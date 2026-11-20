'use strict';
/**
 * tools/exit_log.js - make failed CLI runs hard to miss.
 *
 * A shell pipeline can hide a tool's failure (`cmd | tail` reports tail's status; `a && b` silently skips b).
 * Every CLI calls watch('<name>'): a non-zero exit appends one JSON line (time, tool, code, args, last error)
 * to a log in the OS temp dir (outside the repo, so test copies of the repo share it). test.js snapshots and
 * clears the log when it starts and prints the snapshot when it exits, so failures since the last run surface.
 */
if (require.main === module) require('./cli_help.js').exitWithHeaderHelp(__filename); // a library; run directly it only prints this header
const fs = require('fs');
const os = require('os');
const path = require('path');

const LOG = path.join(os.tmpdir(), 'kongbuhey_tool_errors.log');

/** okCodes: exit codes that are results, not failures (vs_tune check exits 1 for "does not conform"). */
function watch(name, { okCodes = [] } = {}) {
	let last = '';
	const orig = console.error;
	console.error = (...a) => { last = a.map(String).join(' ').slice(0, 300); orig.apply(console, a); };
	process.on('uncaughtExceptionMonitor', (e) => { last = String((e && e.stack) || e).split('\n').slice(0, 2).join(' | ').slice(0, 300); });
	process.on('exit', (code) => {
		if (!code || okCodes.includes(code)) return;
		try {
			fs.appendFileSync(LOG, JSON.stringify({ at: new Date().toISOString(), tool: name, code, cwd: process.cwd(), args: process.argv.slice(2).join(' ').slice(0, 200), error: last }) + '\n');
		} catch (_) { /* logging must never fail the tool */ }
	});
}

/** Entries logged since the last call, then the log is emptied. */
function takeAll() {
	try {
		if (!fs.existsSync(LOG)) return [];
		const lines = fs.readFileSync(LOG, 'utf8').split('\n').filter(Boolean);
		fs.writeFileSync(LOG, '');
		return lines.map(l => { try { return JSON.parse(l); } catch (_) { return { error: l }; } });
	} catch (_) { return []; }
}

module.exports = { LOG, watch, takeAll };
