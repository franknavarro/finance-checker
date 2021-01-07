const inquirer = require('inquirer');

const { formatWalletName } = require('./formatWalletName');

const clickAccount = async (
  page,
  program,
  selectors,
  insecureClick = false,
  textSelector,
) => {
  await page.waitForSelector(selectors);
  const accounts = await page.$$(selectors);
  const accountNamesPull = await page.evaluate(
    (textSelector, ...accounts) => {
      return accounts.map((account) => {
        return (textSelector ? account.querySelector(textSelector) : account)
          .textContent;
      });
    },
    textSelector,
    ...accounts,
  );
  const accountNames = accountNamesPull.map((account) =>
    formatWalletName(account),
  );

  let accountName = formatWalletName(program.account);
  let accountIndex = accountNames.indexOf(accountName);
  if (accountIndex === -1) {
    const selectedAccount = await inquirer.prompt([
      {
        type: 'list',
        message: 'Select a account: ',
        name: 'account',
        choices: accountNames,
      },
    ]);
    accountName = selectedAccount.account;
    accountIndex = accountNames.indexOf(accountName);
  }
  if (insecureClick) {
    await page.evaluate((a) => a.click(), accounts[accountIndex]);
  } else {
    const newAccounts = await page.$$(selectors);
    await newAccounts[accountIndex].click();
  }
  return accountName;
};

exports.clickAccount = clickAccount;
