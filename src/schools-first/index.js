#! /usr/bin/env node
const { program } = require('commander');
const inquirer = require('inquirer');
const path = require('path');
const puppeteer = require('puppeteer');

const { clickAccount } = require('../globalHelpers/clickAccount');
const { formatWalletName } = require('../globalHelpers/formatWalletName');
const { writeDataToCSV } = require('../globalHelpers/writeDataToCSV');
const { FIELD_MAPPINGS } = require('../globalHelpers/constants');

const { parseSFTable } = require('./helpers/parseSFTable');
const { waitForTableRefresh } = require('./helpers/waitForTableRefresh');

const { SCHOOLS_FIRST } = require('../credentials');

const ROWS = [
  FIELD_MAPPINGS.date,
  FIELD_MAPPINGS.amount,
  FIELD_MAPPINGS.description,
  FIELD_MAPPINGS.wallet,
];

program
  .name('finances schools-first')
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
  const url =
    'https://www.schoolsfirstfcu.org/SchoolsFirst_PortalEAI/PortalEAI';
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const logging = (logString) => {
    if (debug) console.log(logString);
  };

  await page.goto(url);
  await page.click('#loginMemberId');
  await page.keyboard.type(SCHOOLS_FIRST.USERNAME);
  await page.click('#loginMemberPwd');
  await page.keyboard.type(SCHOOLS_FIRST.PASSWORD);
  await page.click('#loginbuttonc');
  console.log('Attempting login');

  try {
    await page.screenshot({ path: 'login.png' });
    await page.waitForSelector('#checkingandsavings');
  } catch {
    console.log('Asking for authentication.');
    await page.waitForSelector('.loginButtonForward');
    await page.click('.loginButtonForward');
    await page.waitForSelector('#otpcode');
    await page.click('#otpcode');
    const optcode = await inquirer.prompt([
      {
        type: 'password',
        message: 'Enter the text code: ',
        name: 'password',
      },
    ]);
    await page.waitForSelector('#checkingandsavings');
  }
  console.log('Logged in');

  const shareName = await clickAccount(
    page,
    program,
    '#CheckingTab tr a[name="shareDesc"], #SavingTab tr a[name="shareDesc"]',
    true,
  );

  let allData = [];
  let keepSearching = true;
  let dataPage = 0;
  while (keepSearching) {
    const newRows = await parseSFTable(page, shareName);
    if (!newRows.length) {
      keepSearching = false;
      continue;
    }
    allData = [...allData, ...newRows];
    dataPage++;
    await waitForTableRefresh(page, newRows[0]);
    console.log(`Retrieved data for page ${dataPage}`);
  }

  const workingDir = process.cwd();
  const saveFile = program.file || `SF_${formatWalletName(shareName)}.csv`;
  const savePath = path.join(workingDir, saveFile);
  await writeDataToCSV(allData, savePath, ROWS);
  await browser.close();
})();
