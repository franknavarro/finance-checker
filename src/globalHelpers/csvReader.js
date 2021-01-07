const fs = require('fs');
const csvParser = require('csv-parser');

const csvReader = async (filepath, options = {}, callback) => {
  const promise = new Promise((resolve, reject) => {
    fs.createReadStream(filepath)
      .pipe(csvParser(options))
      .on('data', callback)
      .on('end', () => resolve())
      .on('error', () => reject());
  });
  return await promise;
};

exports.csvReader = csvReader;
