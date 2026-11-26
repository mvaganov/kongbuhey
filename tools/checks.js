'use strict';
/**
 * tools/checks.js (library) - the slower checks the default `node test.js` skips, what each one watches, and the flag file that
 * says which are due. Used by test.js (every run notes what is due; `--full` and `--only a,b` run checks and clear what passed)
 * and by tools/flags.js (the registered action `test` runs `node test.js --only <checks>`).
 *
 * A check is due when a file it watches changed since the check last passed (hashes in local/check_state.json, per check).
 * While any check is due, the flag file `]test_full.txt` sits in the repo root: line 1 says why and how to resolve it, and the
 * pre-commit hook (tools/githooks/pre-commit) refuses commits until it is gone. Only this module writes or deletes it (through tools/flags.js, which owns the flag file format).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Flags = require('./flags.js');

const FLAG = ']test_full.txt';
const STATE = path.join('local', 'check_state.json');

/** watch: a directory (every .js below it), a file, or '*.js' (the repo root's own .js files). */
const CHECKS = {
	sweep: { desc: 'generation over every unit (tools/exhaustive.js, seed 1), ~20 s', watch: ['korean/generation', 'korean/core', 'korean/concord', 'data/constants.js', 'data/hangul_constants.js'],
		cmd: ['tools/exhaustive.js', '--seed', '1'], ok: out => !/Validation: FAILED|Unused Language Units in Scope/.test(out) },
	browser: { desc: 'jsdom load of webapp/index.html (test/browser_load_test.js), ~10 s', watch: ['korean', 'shared', 'webapp', 'flashcards'],
		cmd: ['test/browser_load_test.js'] },
	bench: { desc: 'generation speed and output-unchanged check (tools/bench_generation.js), ~10 s', watch: ['korean/generation', 'korean/core', 'korean/concord', 'korean/translation', 'shared/sentence_adapter.js',
		'data/data.js', 'data/verified_sentences.js'],
		cmd: ['tools/bench_generation.js'], repoArg: true },   // writes test/bench_baseline.json and ]bench_baseline.txt in the repo
	cli: { desc: 'every CLI answers --help fast and writes nothing (test/cli_help_test.js), ~2 s', watch: ['tools', '*.js'],
		cmd: ['test/cli_help_test.js'] },
	sim: { desc: '200-card simulator runs for every policy (test/fc2_sim_test.js --full), ~7 s', watch: ['fc2/controller.js', 'fc2/game.js', 'fc2/queue.js', 'fc2/store.js', 'tools/fc2_sim.js'],
		cmd: ['test/fc2_sim_test.js', '--full'] },
};
const NAMES = Object.keys(CHECKS);

function watchedFiles(root, spec) {
	const out = [];
	if (spec === '*.js') {
		for (const f of fs.readdirSync(root)) if (f.endsWith('.js') && fs.statSync(path.join(root, f)).isFile()) out.push(f);
		return out;
	}
	const abs = path.join(root, spec);
	if (!fs.existsSync(abs)) return out;
	if (fs.statSync(abs).isFile()) return [spec];
	const walk = rel => {
		for (const e of fs.readdirSync(path.join(root, rel), { withFileTypes: true })) {
			if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
			const r = path.join(rel, e.name);
			if (e.isDirectory()) walk(r); else if (e.name.endsWith('.js')) out.push(r);
		}
	};
	walk(spec);
	return out;
}

/** { 'path/file.js': 'sha1 prefix' } for everything a check watches, in the checkout at root. */
function hashes(root, name) {
	const out = {};
	for (const spec of CHECKS[name].watch) for (const f of watchedFiles(root, spec)) {
		out[f.split(path.sep).join('/')] = crypto.createHash('sha1').update(fs.readFileSync(path.join(root, f))).digest('hex').slice(0, 12);
	}
	return out;
}

function readState(repo) {
	try { return JSON.parse(fs.readFileSync(path.join(repo, STATE), 'utf8')); } catch (_) { return {}; }
}

/** [{ name, changed: [files] }] for every check whose watched files differ from when it last passed. */
function due(root, repo) {
	const state = readState(repo), out = [];
	for (const name of NAMES) {
		const last = state[name] && state[name].hashes, now = hashes(root, name);
		if (!last) { out.push({ name, changed: ['(never passed here yet)'] }); continue; }
		const changed = [...new Set([...Object.keys(now), ...Object.keys(last)])].filter(k => now[k] !== last[k]).sort();
		if (changed.length) out.push({ name, changed });
	}
	return out;
}

/** Writes the flag for the due checks (or deletes it when none is due). The format and history live in tools/flags.js. */
function writeFlag(repo, list) {
	if (!list.length) { Flags.removeFlag(repo, FLAG); return null; }
	const names = list.map(x => x.name);
	const short = l => (l.length > 4 ? `${l.slice(0, 4).join(', ')} and ${l.length - 4} more` : l.join(', '));
	return Flags.writeFlag(repo, FLAG, {
		head: `blocks commits: code changed since these slower checks last passed: ${names.join(', ')}. Resolve: node tools/flags.js resolve`,
		action: 'test', args: { checks: names },
		details: list.map(x => `${x.name}: ${CHECKS[x.name].desc}; changed: ${short(x.changed)}`),
		milestone: `due: ${list.map(x => `${x.name} (${short(x.changed)})`).join('; ')}`,
	});
}

/** Records that checks passed for the files now in root, then rewrites (or deletes) the flag. Returns what is still due. */
function markPassed(root, repo, names) {
	const state = readState(repo);
	for (const name of names) state[name] = { at: new Date().toISOString(), hashes: hashes(root, name) };
	fs.mkdirSync(path.join(repo, 'local'), { recursive: true });
	fs.writeFileSync(path.join(repo, STATE), JSON.stringify(state, null, 1));
	const left = due(root, repo);
	writeFlag(repo, left);
	return left;
}

/** Notes what is due (every test.js run). */
function note(root, repo) {
	const list = due(root, repo);
	writeFlag(repo, list);
	return list;
}

/** Runs checks in the checkout at root (repo: the real repo, for checks that write there); returns [{ name, ok, ms, out }]. */
function run(root, names, repo = root) {
	const { spawnSync } = require('child_process');
	return names.map(name => {
		const c = CHECKS[name], t0 = Date.now();
		const args = c.cmd.map((a, i) => (i === 0 ? path.join(root, a) : a)).concat(c.repoArg ? ['--repo', repo] : []);
		const r = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
		const out = (r.stdout || '') + (r.stderr || '');
		return { name, ok: r.status === 0 && (!c.ok || c.ok(out)), ms: Date.now() - t0, out };
	});
}

module.exports = { FLAG, CHECKS, NAMES, due, note, markPassed, writeFlag, run, hashes };
