const formatWalletName = (name = '', fileSafe = false) => {
  if (!name) return name;

  const newName = name
    .trim()
    .toLowerCase()
    .split(' ')
    .map((w) => w[0].toUpperCase() + w.slice(1));

  return newName.join(fileSafe ? '_' : ' ');
};

exports.formatWalletName = formatWalletName;
