const parseSFTable = async (page, wallet) => {
  await page.screenshot({ path: `${wallet}.png` });
  await page.waitForSelector("[id^='TransactionList']");
  const returnData = await page.evaluate((wallet) => {
    const rows = Array.from(document.querySelectorAll("[class^='tableRow']"));
    return rows.map((row) => {
      const getCell = (sel) => row.querySelector(sel).textContent.trim();
      return {
        Wallet: wallet,
        Date: getCell('td.dateCell'),
        Description: getCell('td.descriptionCell'),
        Amount: parseFloat(
          getCell('#colorCodeShareTranAmt')
            .replace(/[\$\),]/g, '')
            .replace('(', '-'),
        ),
      };
    });
  }, wallet);

  return returnData;
};

exports.parseSFTable = parseSFTable;
