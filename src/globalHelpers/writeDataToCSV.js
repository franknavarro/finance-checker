const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const writeDataToCSV = async (data, filePath, headerMap) => {
  const sortOrder = [...headerMap].sort((a, b) => a.order - b.order);
  data.sort((a, b) => {
    for (const h of sortOrder) {
      const comparer = h.sorter(a, b);
      if (comparer) return comparer;
    }
  });

  const headerCSV = headerMap.map((h) => ({
    id: h.normal,
    title: h.normal,
  }));

  await createCsvWriter({
    path: filePath,
    header: headerCSV,
  }).writeRecords(data);
  return filePath;
};

exports.writeDataToCSV = writeDataToCSV;
