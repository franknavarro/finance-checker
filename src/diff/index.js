#! /usr/bin/env node
const { program } = require('commander');
const path = require('path');
const tmp = require('tmp');
const child_process = require('child_process');

const { csvReader } = require('../globalHelpers/csvReader');
const { writeDataToCSV } = require('../globalHelpers/writeDataToCSV');
const { FIELD_MAPPINGS } = require('../globalHelpers/constants');

const ROWS = [FIELD_MAPPINGS.amount];

let compareFiles = [];
program
  .name('finances diff')
  .arguments('<file1> <file2>')
  .action((file1, file2) => {
    compareFiles = [file1, file2];
  });

program.parse(process.argv);

const generateDiffFiles = async (files) => {
  const diffFiles = [];
  for (let f = 0; f < files.length; f++) {
    const file = files[f];
    const newData = [];

    await csvReader(file, {}, (data) => {
      newData.push({
        [FIELD_MAPPINGS.amount.normal]: data[FIELD_MAPPINGS.amount.normal],
      });
    });

    const fileName = path.basename(file).replace(/\.csv$/, '');
    const tmpFile = tmp.fileSync({ name: `diff-${fileName}.csv` });
    diffFiles.push(tmpFile);

    await writeDataToCSV(newData, tmpFile.name, ROWS);
  }

  return diffFiles;
};

(async () => {
  const diffFiles = await generateDiffFiles(compareFiles);
  const diffFilenames = diffFiles.map((d) => d.name);
  var editor = process.env.EDITOR || 'vi';

  const diffOption = [];
  if (editor === 'nvim') {
    diffOption.push('-d');
  }
  const options = [...diffOption, ...diffFilenames];
  console.log(options);

  compareFiles.forEach((file) => {
    child_process.exec(`open ${file} -a 'Microsoft Excel'`);
  });
  child_process.spawn('nvim', options, { stdio: 'inherit' }).on('exit', () => {
    diffFiles.forEach((file) => file.removeCallback());
  });
})();
