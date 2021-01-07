const formatCurrency = (currency) =>
  parseFloat(currency.replace('$', '')).toFixed(2);

exports.formatCurrency = formatCurrency;
