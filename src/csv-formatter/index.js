#! /usr/bin/env node
const { program } = require('commander');
const path = require('path');

const { FIELD_MAPPINGS } = require('../globalHelpers/constants');
const { appendFiles } = require('./helpers/appendFiles');
const { csvReader } = require('../globalHelpers/csvReader');
const { writeDataToCSV } = require('../globalHelpers/writeDataToCSV');

let argumentFiles = [];

program
  .name('finances csv')
  .arguments('<file> [files...]')
  .action((file, files) => {
    argumentFiles = appendFiles(file, argumentFiles);
    files.forEach((f) => (argumentFiles = appendFiles(f, argumentFiles)));
  })
  .option('-p, --prefix <prefix>', 'prefix for output file name', 'Spendee')
  .option('-s, --separator <separator>', 'separator used for csv file', ';')
  .option(
    '    --sort <type>',
    'which column to sort by. options are: enum[amount,date]',
    'amount',
  );

program.parse(process.argv);

const formatCSV = async (files, prefix) => {
  for (let f = 0; f < files.length; f++) {
    const file = files[f];
    const newData = [];
    let walletName = '';

    const ROWS = [
      { ...FIELD_MAPPINGS.date, order: program.sort === 'amount' ? 1 : 0 },
      { ...FIELD_MAPPINGS.amount, order: program.sort === 'amount' ? 0 : 1 },
      FIELD_MAPPINGS.description,
      FIELD_MAPPINGS.wallet,
    ];

    await csvReader(file, { separator: program.separator }, (data) => {
      if (!walletName) {
        walletName = data.Wallet.replace(/[ -]/g, '_').replace(/_+/g, '_');
      }
      const addData = ROWS.reduce((acc, cur) => {
        const val = cur.formatter
          ? cur.formatter(data[cur.spendee])
          : data[cur.spendee];
        acc[cur.normal] = val;
        return acc;
      }, {});

      newData.push(addData);
    });

    const saveDir = path.dirname(file);
    const fileName = path.basename(file).replace(/\.csv$/, '');
    const saveFileName = /all/i.test(fileName) ? 'All' : walletName;
    const savePath = path.join(saveDir, `${prefix}_${saveFileName}.csv`);
    await writeDataToCSV(newData, savePath, ROWS);
    console.log(`Saved data to ${savePath}`);
  }
};

exports.formatCSV = formatCSV;
(async () => {
  await formatCSV(argumentFiles, program.prefix);
})();
