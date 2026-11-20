#!/usr/bin/env node
/**
 * test/cli_help_test.js - every CLI answers `--help` fast, exits 0, prints something, and changes no file.
 * Runs in `node test.js --full` (spawns ~16 Node processes, ~2 s). Standalone: `node test/cli_help_test.js [--verbose]`.
 *
 * A CLI is any .js file in the repo root, tools/ or data/ that reads process.argv (found by text search, so a new
 * tool is covered automatically). Fix a failure by handling --help before heavy requires or side effects:
 * `require('./tools/cli_help.js').exitWithHeaderHelp(__filename)` prints the file's header comment, or give the
 * tool its own printHelp(). The file is the documentation; CLAUDE.md only names it.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
// Measured 2026-11-20 (Linux, local disk): bare node 10 ms, require data/data.js 30 ms, require korean/index.js
// 110 ms; slowest --help 120 ms (tools that load the engine before parsing args). 500 ms leaves room for slower
// Windows startup and still fails any tool that generates sentences or analyzes text (seconds) before answering.
const LIMIT_MS = 500;
const verbose = process.argv.includes('--verbose');

let passed = 0, failed = 0;
const check = (ok, msg) => { if (ok) { passed++; if (verbose) console.log(`  [PASS] ${msg}`); } else { failed++; console.log(`  [FAIL] ${msg}`); } };

function findClis() {
	const out = [];
	for (const dir of ['.', 'tools', 'data']) {
		for (const f of fs.readdirSync(path.join(ROOT, dir))) {
			const rel = path.join(dir, f);
			if (!f.endsWith('.js') || rel === path.join('tools', 'cli_help.js')) continue;
			if (fs.readFileSync(path.join(ROOT, rel), 'utf8').includes('process.argv')) out.push(rel);
		}
	}
	return out.sort();
}

/** path -> "mtime:size" for every file outside node_modules/.git (enough to see a write; contents not read). */
function snapshot(dir = ROOT, acc = new Map()) {
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		if (e.name === 'node_modules' || e.name === '.git') continue;
		const p = path.join(dir, e.name);
		if (e.isDirectory()) snapshot(p, acc);
		else if (e.isFile()) { const s = fs.statSync(p); acc.set(path.relative(ROOT, p), `${s.mtimeMs}:${s.size}`); }
	}
	return acc;
}
function diff(a, b) {
	const changed = [];
	for (const [k, v] of b) if (a.get(k) !== v) changed.push(k);
	for (const k of a.keys()) if (!b.has(k)) changed.push(k + ' (deleted)');
	return changed;
}

console.log('======================================================');
console.log('         CLI --help (fast, exit 0, no writes)         ');
console.log('======================================================');
const clis = findClis();
check(clis.length >= 10, `found ${clis.length} CLIs by text search (sanity: the search still works)`);
let before = snapshot();
const timings = [];
for (const rel of clis) {
	const t0 = process.hrtime.bigint();
	const r = spawnSync(process.execPath, [path.join(ROOT, rel), '--help'], { cwd: ROOT, encoding: 'utf8', timeout: 30000 });
	const ms = Number(process.hrtime.bigint() - t0) / 1e6;
	timings.push([rel, ms]);
	const after = snapshot();
	const changed = diff(before, after);
	check(r.status === 0, `${rel} --help exits 0 (got ${r.status}${r.signal ? ', ' + r.signal : ''})`);
	check((r.stdout || '').trim().length >= 20, `${rel} --help prints its usage on stdout`);
	check(ms <= LIMIT_MS, `${rel} --help takes ${Math.round(ms)} ms (limit ${LIMIT_MS})`);
	check(changed.length === 0, `${rel} --help changes no file${changed.length ? ': ' + changed.slice(0, 5).join(', ') : ''}`);
	before = after;
}
if (verbose) for (const [rel, ms] of timings.sort((a, b) => b[1] - a[1])) console.log(`  ${String(Math.round(ms)).padStart(5)} ms  ${rel}`);
console.log(`\nTOTAL TESTS: ${passed + failed}\nPASSED:      ${passed}\nFAILED:      ${failed}`);
process.exit(failed ? 1 : 0);
