#! /usr/bin/env node
const { program } = require('commander');
const path = require('path');
const puppeteer = require('puppeteer');

const { formatWalletName } = require('../globalHelpers/formatWalletName');
const { clickAccount } = require('../globalHelpers/clickAccount');
const { parseWFTable } = require('./helpers/parseWFTable');
const { writeDataToCSV } = require('../globalHelpers/writeDataToCSV');
const { FIELD_MAPPINGS } = require('../globalHelpers/constants');

const { WELLS_FARGO } = require('../credentials');

const ROWS = [
  FIELD_MAPPINGS.date,
  FIELD_MAPPINGS.amount,
  FIELD_MAPPINGS.description,
  FIELD_MAPPINGS.wallet,
];

program
  .name('finances wells-fargo')
  .option(
    '-a, --account <account name>',
    'Which account you want to get the information for',
  )
  .option(
    '-f, --file <path>',
    'The file path you want the destination csv to download',
  );

program.parse(process.argv);

(async () => {
  const debug = false;
  // const url = 'https://www.wellsfargo.com/';
  const url = 'https://connect.secure.wellsfargo.com/auth/login/present';
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-fullscreen'],
  });
  const page = await browser.newPage();

  const screenshot = async (page, filename) => {
    if (debug) {
      const sceenshotFile = path.join(
        __dirname,
        '../../.debug',
        `${filename}.png`,
      );
      await page.screenshot({ path: sceenshotFile });
    }
  };
  const logging = (logString) => {
    if (debug) console.log(logString);
  };

  await page.goto(url);
  await screenshot(page, 'page-load');
  // await page.click('#userid');
  await page.click('#usernameWrapper');
  await page.keyboard.type(WELLS_FARGO.USERNAME);
  // await page.click('#password');
  await page.click('#passwordWrapper');
  await page.keyboard.type(WELLS_FARGO.PASSWORD);
  await screenshot(page, 'login-info');
  // await page.click('#btnSignon');
  // await page.evaluate(() => {
  // document.querySelector("input[name='continue']").click();
  // });
  await page.keyboard.press('Enter');
  await screenshot(page, 'logining-in');

  try {
    console.log('Attempting login');
    await page.waitForSelector('span.account-name');
  } catch {
    console.log('Something went wrong with loging in');
    console.log('Taking screenshot');
    await screenshot(page, 'failed-login');
    process.exit();
  }
  console.log('Logged in');

  await screenshot(page, 'accounts');
  const accountName = await clickAccount(
    page,
    program,
    'a.account-title-group',
    false,
    '.account-name',
  );

  let allData = [];
  let prevRows = [];
  let keepSearching = true;
  let dataPage = 0;

  const isSameRecord = (oldRow, newRow, compareRow = 'first') => {
    let old, newer;
    if (compareRow === 'first') {
      old = oldRow[0];
      newer = newRow[0];
    } else if (compareRow === 'last') {
      old = oldRow[oldRow.length - 1];
      newer = newRow[newRow.length - 1];
    }

    if (!old || !newer) {
      return false;
    }

    return (
      old.Date === newer.Date &&
      old.Amount === newer.Amount &&
      old.Description === newer.Description
    );
  };

  while (keepSearching) {
    await screenshot(page, `${accountName}_${dataPage}`);
    const newRows = await parseWFTable(page, accountName);
    logging(newRows);
    const isSameFirstRow = isSameRecord(prevRows, newRows, 'first');
    logging(isSameFirstRow);
    if (!isSameFirstRow) {
      dataPage++;
      console.log(`Retrieved data for page ${dataPage}`);
      allData = [...allData, ...prevRows];
    }
    prevRows = newRows;
    logging('waiting for next page');
    await page.waitForSelector('a.page-next');
    logging('found next page');
    const nextButton = await page.$('a.page-next');
    const isNextPage = await page.evaluate((nextButton) => {
      return nextButton.getAttribute('aria-disabled') !== 'true';
    }, nextButton);

    logging({ isNextPage });
    if (!isNextPage) {
      allData = [...allData, ...newRows];
      keepSearching = false;
      continue;
    }

    await nextButton.click();
    await page.waitForFunction(
      (prevLastRow) => {
        const rowSelector = 'tbody > tr.detailed-transaction';
        const rows = document.querySelectorAll(rowSelector);
        const lastRow = rows[rows.length - 1];
        const getCell = (sel) => {
          const cell = lastRow.querySelector(sel);
          if (!cell) return '';
          return cell.textContent.trim();
        };
        const getMoney = () => {
          const credits = getCell("td[headers*='credits']");
          const debits = getCell("td[headers*='debits']");
          const amount = getCell("td[headers*='amount']");
          let useMoney;
          if (amount) {
            useMoney = amount.includes('+')
              ? amount.replace('+', '')
              : `-${amount}`;
          } else {
            useMoney = amount ? amount : credits ? credits : `-${debits}`;
          }
          return parseFloat(
            useMoney.replace(/[$,]/g, '').replace(/\s*\(pending\)/, ''),
          );
        };

        logging({ prevLastRow, lastRow, rowSelector });
        const notSameCell =
          prevLastRow.Date !== getCell("td[headers*='date']") &&
          prevLastRow.Description !== getCell("td[headers*='description']") &&
          prevLastRow.Amount !== getMoney();
        return notSameCell;
      },
      {},
      prevRows[prevRows.length - 1],
    );
  }

  const workingDir = process.cwd();
  const saveFile = program.file || `WF_${formatWalletName(accountName)}.csv`;
  const savePath = path.join(workingDir, saveFile);
  await writeDataToCSV(allData, savePath, ROWS);
  console.log(`Saved data to: ${savePath}`);
  await browser.close();
})();
