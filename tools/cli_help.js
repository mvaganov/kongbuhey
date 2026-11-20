/**
 * tools/cli_help.js - `--help` / `-h` for CLIs that document themselves in their header comment.
 *
 *   require('./tools/cli_help.js').exitWithHeaderHelp(__filename);   // first statement, before any heavy require
 *
 * With --help or -h in argv it prints the file's first /** ... *\/ block and exits 0, so help is fast and never
 * writes. Otherwise it returns and the CLI runs normally. The header is the documentation: keep usage there.
 * test/cli_help_test.js (test.js --full) checks every CLI's --help is fast, exits 0 and changes no files.
 */
'use strict';
const fs = require('fs');
const path = require('path');

function exitWithHeaderHelp(file) {
	if (!process.argv.slice(2).some(a => a === '--help' || a === '-h')) return;
	const m = fs.readFileSync(file, 'utf8').match(/\/\*\*([\s\S]*?)\*\//);
	console.log(m ? m[1].replace(/^[ \t]*\* ?/gm, '').trim() : `${path.basename(file)}: no header comment (add one)`);
	process.exit(0);
}

module.exports = { exitWithHeaderHelp };
