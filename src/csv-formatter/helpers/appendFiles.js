const fs = require('fs');
const path = require('path');

const workingDir = process.cwd();

const appendFiles = (value, previous) => {
  let prev = previous;
  if (!previous) prev = [];

  let usePath = value;
  if (!usePath.startsWith('/')) {
    usePath = path.join(workingDir, value);
  }

  if (!fs.existsSync(usePath)) {
    console.error(`File or Directory does not exist: ${usePath}`);
    process.exit();
  }

  if (fs.lstatSync(usePath).isDirectory()) {
    const files = fs
      .readdirSync(usePath)
      .filter((file) => path.extname(file).toLowerCase() === '.csv')
      .map((file) => path.join(usePath, file));
    return [...prev, ...files];
  }

  return [...prev, usePath];
};

exports.appendFiles = appendFiles;
