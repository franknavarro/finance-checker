const waitForTableRefresh = async (page, compareData) => {
  let attempts = 3;
  while (attempts) {
    try {
      await page.evaluate(() =>
        document
          .querySelector("#tableResults a[name='Older_Transactions']")
          .click(),
      );
      await page.waitForFunction(
        (firstData) => {
          const firstRow = document.querySelector("tr[class^='tableRow']");
          const getCell = (sel) =>
            firstRow.querySelector(sel).textContent.trim();
          const sameCell =
            !firstRow ||
            (getCell('td.dateCell') !== firstData.Date &&
              getCell('td.descriptionCell') !== firstData.Description &&
              parseFloat(
                getCell('#colorCodeShareTranAmt')
                  .replace(/^\((.*)\)$/, '-$1')
                  .replace('$', ''),
              ) !== firstData.Amount);
          return sameCell;
        },
        {},
        compareData,
      );
      attempts = 0;
    } catch {
      attempts--;
    }
  }
};

exports.waitForTableRefresh = waitForTableRefresh;
