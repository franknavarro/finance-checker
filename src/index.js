#! /usr/bin/env node

const { program } = require('commander');

program.command('csv', "Format csv's to correct format");
program
  .command('wells-fargo', 'Retrieve financial data from Wells Fargo')
  .alias('wf');
program
  .command('schools-first', "Retrieve financial data from School's First")
  .alias('sf');
program.command('diff', 'Take the amount and date columns and diff them');

program.parse(process.argv);
