const { formatDate } = require('../globalHelpers/formatDate');
const { formatCurrency } = require('../globalHelpers/formatCurrency');

/*
 * Takes the form of: {
 *  normal: 'holds the normalized key'
 *  spendee: 'holds the key Spendee uses for the column'
 *  formatter: 'function used to format the value'
 *  sorter: 'function used for determining sort order for field'
 *  order: 'prescedence the field takes when sorting (0 indexed)'
 * }
 */
const FIELD_MAPPINGS = {
  amount: {
    normal: 'Amount',
    spendee: 'Amount',
    formatter: formatCurrency,
    sorter: (a, b) => parseFloat(a.Amount) - parseFloat(b.Amount),
    order: 0,
  },
  date: {
    normal: 'Date',
    spendee: 'Date',
    formatter: formatDate,
    sorter: (a, b) => new Date(a.Date) - new Date(b.Date),
    order: 1,
  },
  description: {
    normal: 'Description',
    spendee: 'Notes',
    formatter: (s) => s.trim(),
    sorter: (a, b) => a.Description.localeCompare(b.Description),
    order: 2,
  },
  wallet: {
    normal: 'Wallet',
    spendee: 'Wallet',
    formatter: (s) => s.trim(),
    sorter: (a, b) => a.Wallet.localeCompare(b.Wallet),
    order: 3,
  },
};

exports.FIELD_MAPPINGS = FIELD_MAPPINGS;
