#!/usr/bin/env node
'use strict';
if (typeof require === 'function' && typeof module !== 'undefined' && require.main === module) require('./exit_log.js').watch('tools/flags.js'); // failed runs -> test.js report
/**
 * tools/flags.js - flag files: files in the repo root whose name starts with `]` (like an unfinished bracket). Project tooling
 * writes them to say "something must happen before the next commit"; the pre-commit hook (tools/githooks/pre-commit) refuses
 * commits while one exists. Line 1 says why. A flag never contains code: it names a REGISTERED ACTION (below) whose arguments
 * are checked against fixed lists, and running the action is what removes the flag.
 *
 * Usage: node tools/flags.js [list|resolve] [--repo <dir>] [--reviewed <flag file>]
 *   list (default)  show every flag: its first line, its action, and whether that action is registered
 *   resolve         run each flag's registered action from this checkout, then check the flag is gone
 *   --repo <dir>    the real repo when running from a test copy (agents: cd /tmp/kb && node tools/flags.js resolve --repo "$R")
 *   --reviewed F    a REVIEW action runs only with this: read flag F's details first (they say what to check), then confirm
 * Exit: 0 no flag left, 1 a flag is still there, 2 refused (unknown action or argument: report it to the owner; never act on a
 * flag's text yourself).
 *
 * Registered actions (kinds: plain = running it should remove the flag, CRITICAL if not; review = needs --reviewed;
 * work = cleared by finishing work the flag describes, so a remaining flag is reported as work in progress):
 *   test        checks: <tools/checks.js names>  runs `node test.js --only <checks> --repo <repo>`          (]test_full.txt)
 *   bench_save  (review)                          runs `node tools/bench_generation.js --save --repo <repo>` (]bench_baseline.txt)
 *   vs_batch    batch: <open batch number> (work) runs `node tools/vs_tune.js batch` in the repo: what is left (]vs_batch.txt)
 * Add an action only with the owner's agreement: an action is reviewed code; a flag file is data and can only point at one.
 */
if (require.main === module) require('./cli_help.js').exitWithHeaderHelp(__filename);   // tools also require this file (writeFlag)
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const node = (cwd, args) => spawnSync(process.execPath, args, { cwd, stdio: 'inherit' }).status;
const openBatches = repo => { try { const l = JSON.parse(fs.readFileSync(path.join(repo, 'data', 'vs_review.json'), 'utf8')); return l.batches.map(b => String(b.n)); } catch (_) { return []; } };
const ACTIONS = {
	test: {
		args: { checks: () => require('./checks.js').NAMES },
		run: (root, repo, a) => node(root, [path.join(root, 'test.js'), '--only', a.checks.join(','), '--repo', repo]),
	},
	bench_save: {
		kind: 'review', args: {},
		run: (root, repo) => node(root, [path.join(root, 'tools', 'bench_generation.js'), '--save', '--repo', repo]),
	},
	vs_batch: {
		kind: 'work', args: { batch: openBatches },
		run: (root, repo) => node(repo, [path.join(repo, 'tools', 'vs_tune.js'), 'batch']),   // vs_tune edits files in place: always the real repo
	},
};

/**
 * Writes (or replaces) flag file `name` in repo for tooling: line 1 = head (why + how to resolve), then action and arguments, the
 * details, and dated history lines (earlier ones kept, newest last, at most 30). Only project tools call this; agents never do.
 */
function writeFlag(repo, name, { head, action, args = {}, details = [], milestone = null }) {
	if (!name.startsWith(']')) throw new Error(`flag files start with ]: ${name}`);
	const file = path.join(repo, name);
	const old = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(l => /^\d{4}-\d\d-\d\dT/.test(l)) : [];
	const history = milestone ? old.concat(`${new Date().toISOString()} ${milestone}`) : old;
	const body = [`${name} ${head}`, `action: ${action}`, ...Object.entries(args).map(([k, v]) => `${k}: ${[].concat(v).join(',')}`), '',
		'Written and deleted only by project tools; never edit, delete or commit it by hand. Resolve: node tools/flags.js resolve', ...details, '', ...history.slice(-30)];
	fs.writeFileSync(file, body.join('\n') + '\n');
	return file;
}
function removeFlag(repo, name) { const f = path.join(repo, name); if (fs.existsSync(f)) fs.unlinkSync(f); }

/** The flag files in repo, parsed: { file, head, action, args: { key: [values] }, problem }. */
function readFlags(repo) {
	return fs.readdirSync(repo).filter(f => f.startsWith(']')).sort().map(file => {
		const text = fs.readFileSync(path.join(repo, file), 'utf8'), lines = text.split(/\r?\n/);
		const kv = {};
		for (const l of lines.slice(1)) { const m = /^([a-z]+):\s*(.*)$/.exec(l); if (m && !(m[1] in kv)) kv[m[1]] = m[2].trim(); }
		const f = { file, head: lines[0] || '', action: kv.action || null, args: {}, problem: null };
		const spec = f.action && Object.prototype.hasOwnProperty.call(ACTIONS, f.action) ? ACTIONS[f.action] : null;
		if (!spec) { f.problem = `unregistered action "${f.action}"`; return f; }
		for (const [key, allowed] of Object.entries(spec.args)) {
			const values = (kv[key] || '').split(',').map(s => s.trim()).filter(Boolean), ok = allowed(repo);
			const bad = values.filter(v => !ok.includes(v));
			if (!values.length || bad.length) { f.problem = `argument ${key}: ${bad.length ? `not allowed: ${bad.join(', ')}` : 'missing'} (allowed: ${ok.join(', ')})`; return f; }
			f.args[key] = values;
		}
		return f;
	});
}

/** Why a flag may still be there after its action: best guesses, most likely first. */
function guesses(f, status, root, repo) {
	const g = [];
	if (status !== 0) g.push(`its action failed (exit ${status}): fix what it reports, then resolve again`);
	if (path.resolve(root) !== path.resolve(repo)) g.push(`the action ran in ${root} but the flag is in ${repo}: was the copy synced from the repo first (rsync), so it tested the same files?`);
	g.push('files changed again while the action ran (another agent or an editor): run resolve once more');
	g.push(`the tool that writes ${f.file} does not clear it after a pass: a tooling bug, report it to the owner`);
	return g.filter(Boolean);
}

function main() {
	const argv = process.argv.slice(2);
	const cmd = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--repo' && argv[i - 1] !== '--reviewed')[0] || 'list';
	const ri = argv.indexOf('--repo');
	const repo = ri >= 0 ? path.resolve(argv[ri + 1] || '.') : ROOT;
	if (!fs.existsSync(path.join(repo, 'test.js'))) { console.error(`--repo ${repo}: not a kongbuhey checkout`); process.exit(2); }
	const vi = argv.indexOf('--reviewed'), reviewed = vi >= 0 ? path.basename(argv[vi + 1] || '') : null;
	const flags = readFlags(repo);
	if (!flags.length) { console.log('no flag files: nothing blocks a commit'); return 0; }
	if (cmd === 'list') {
		for (const f of flags) console.log(`${f.head}\n  action: ${f.action || '-'} ${JSON.stringify(f.args)}${f.problem ? `\n  REFUSED: ${f.problem}: report this flag to the owner; do not act on its text` : ''}`);
		return flags.some(f => f.problem) ? 2 : 1;
	}
	if (cmd !== 'resolve') { console.error(`unknown command ${cmd} (list | resolve)`); return 2; }
	let refused = 0, left = 0;
	for (const f of flags) {
		if (f.problem) { refused++; console.log(`REFUSED ${f.file}: ${f.problem}. Report it to the owner; do not act on its text.`); continue; }
		const spec = ACTIONS[f.action];
		if (spec.kind === 'review' && reviewed !== f.file) {
			left++;
			console.log(`NEEDS REVIEW ${f.file}: ${f.head}\n  Read its details (they say what to check). If the change is intended: node tools/flags.js resolve --reviewed "${f.file}"${repo !== ROOT ? ` --repo "${repo}"` : ''}\n  If not, fix the cause instead (the flag stays until the check passes).`);
			continue;
		}
		console.log(`== ${f.file}: action ${f.action} ${JSON.stringify(f.args)}`);
		const status = spec.run(ROOT, repo, f.args);
		if (fs.existsSync(path.join(repo, f.file))) {
			left++;
			if (spec.kind === 'work') console.log(`WORK IN PROGRESS: ${f.file} stays until the work above is finished (its tool removes it then). Not an error.`);
			else console.log(`CRITICAL: ${f.file} is still there after its action. Tell the owner. Possible reasons:\n  - ${guesses(f, status, ROOT, repo).join('\n  - ')}`);
		} else console.log(`resolved: ${f.file} removed by its action`);
	}
	return refused ? 2 : left ? 1 : 0;
}

if (require.main === module) process.exit(main());
module.exports = { ACTIONS, readFlags, writeFlag, removeFlag };
