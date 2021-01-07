const moment = require('moment');

const formatDate = (dateString) =>
  moment(dateString, ['YYYY-MM-DD', 'MM/DD/YYYY']).format('YYYY-MM-DD');

exports.formatDate = formatDate;
