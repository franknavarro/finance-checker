const parseWFTable = async (page, wallet) => {
  const rowSelector = 'tbody > tr.detailed-transaction';
  await page.waitForSelector(rowSelector);
  const returnData = await page.evaluate(
    (wallet, rowSelector) => {
      const rows = Array.from(document.querySelectorAll(rowSelector));
      return rows.map((row) => {
        const getCell = (sel) => {
          const cell = row.querySelector(sel);
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
        return {
          Wallet: wallet,
          Date: getCell("td[headers*='date']"),
          Description: getCell("td[headers*='description']"),
          Amount: getMoney(),
        };
      });
    },
    wallet,
    rowSelector,
  );
  return returnData;
};

exports.parseWFTable = parseWFTable;
