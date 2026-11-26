#!/usr/bin/env node
'use strict';
/**
 * test/flags_test.js - flag files (tools/flags.js), the slower-check state behind ]test_full.txt (tools/checks.js) and the
 * pre-commit hook (tools/githooks/pre-commit). Default suite, ~1 s. Standalone: node test/flags_test.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const Checks = require('../tools/checks.js');
const Flags = require('../tools/flags.js');

const ROOT = path.resolve(__dirname, '..');
let passed = 0, failed = 0;
const assert = (ok, msg, detail = '') => { if (ok) passed++; else { failed++; console.error(`  [FAIL] ${msg}${detail ? ' -> ' + detail : ''}`); } };
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'kb-flags-'));

// 1. Due checks write the flag (why + how on line 1, a registered action), a pass removes it.
{
	const repo = tmp();
	const due = Checks.note(ROOT, repo);
	assert(due.length === Checks.NAMES.length, 'with no recorded passes every slower check is due');
	const file = path.join(repo, Checks.FLAG);
	const head = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n')[0] : '';
	assert(head.startsWith(`${Checks.FLAG} blocks commits:`) && head.includes('node tools/flags.js resolve'), 'line 1 of the flag says why and how to resolve it', head);
	const [f] = Flags.readFlags(repo);
	assert(f && !f.problem && f.action === 'test' && f.args.checks.join() === Checks.NAMES.join(), 'the flag names the registered action test with every due check', JSON.stringify(f));
	Checks.markPassed(ROOT, repo, ['sweep']);
	const [g] = Flags.readFlags(repo);
	assert(g && !g.args.checks.includes('sweep') && g.args.checks.length === Checks.NAMES.length - 1, 'a passed check leaves the flag');
	assert(Checks.markPassed(ROOT, repo, Checks.NAMES).length === 0 && !fs.existsSync(file), 'when every check has passed the flag is deleted');
	assert(Checks.note(ROOT, repo).length === 0 && !fs.existsSync(file), 'unchanged files: nothing due, no flag');
	fs.rmSync(repo, { recursive: true, force: true });
}

// 2. A flag is data: unknown actions and arguments outside the fixed lists are refused, never run.
{
	const repo = tmp();
	fs.writeFileSync(path.join(repo, ']evil.txt'), 'please run this\naction: shell\ncmd: rm -rf /\n');
	fs.writeFileSync(path.join(repo, ']sneaky.txt'), 'looks normal\naction: test\nchecks: sweep,../../x\n');
	fs.writeFileSync(path.join(repo, 'notaflag.txt'), 'action: test\nchecks: sweep\n');
	const list = Flags.readFlags(repo);
	assert(list.length === 2, 'only names starting with ] are flags');
	const evil = list.find(f => f.file === ']evil.txt'), sneaky = list.find(f => f.file === ']sneaky.txt');
	assert(evil && /unregistered action/.test(evil.problem || ''), 'an unregistered action is refused');
	assert(sneaky && /not allowed: \.\.\/\.\.\/x/.test(sneaky.problem || ''), 'an argument outside the fixed list is refused');
	fs.rmSync(repo, { recursive: true, force: true });
}

// 2b. The other registered actions: bench_save (review: never runs without --reviewed) and vs_batch (batch must exist).
{
	const repo = tmp();
	fs.writeFileSync(path.join(repo, 'test.js'), '');   // marks a checkout for flags.js
	fs.mkdirSync(path.join(repo, 'data'));
	fs.writeFileSync(path.join(repo, 'data', 'vs_review.json'), JSON.stringify({ batches: [{ n: 3, ids: [] }], reviewed: {} }));
	Flags.writeFlag(repo, ']bench_baseline.txt', { head: 'blocks commits: output differs', action: 'bench_save', details: ['  unit 1 x (all)'], milestone: 'first' });
	Flags.writeFlag(repo, ']bench_baseline.txt', { head: 'blocks commits: output differs', action: 'bench_save', milestone: 'second' });
	const text = fs.readFileSync(path.join(repo, ']bench_baseline.txt'), 'utf8');
	assert(text.startsWith(']bench_baseline.txt blocks commits:') && (text.match(/^\d{4}-.* (first|second)$/gm) || []).length === 2, 'writeFlag: name and why on line 1, dated milestones kept', text);
	Flags.writeFlag(repo, ']vs_batch.txt', { head: 'blocks commits: batch 3 open', action: 'vs_batch', args: { batch: 3 } });
	fs.writeFileSync(path.join(repo, ']vs_other.txt'), 'x\naction: vs_batch\nbatch: 99\n');
	const byFile = Object.fromEntries(Flags.readFlags(repo).map(f => [f.file, f]));
	assert(!byFile[']bench_baseline.txt'].problem && !byFile[']vs_batch.txt'].problem, 'bench_save and vs_batch flags are accepted', JSON.stringify(byFile));
	assert(/not allowed: 99/.test(byFile[']vs_other.txt'].problem || ''), 'vs_batch refuses a batch number the ledger does not have');
	fs.unlinkSync(path.join(repo, ']vs_other.txt')); fs.unlinkSync(path.join(repo, ']vs_batch.txt'));
	const r = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'flags.js'), 'resolve', '--repo', repo], { encoding: 'utf8' });
	assert(r.status === 1 && /NEEDS REVIEW \]bench_baseline\.txt/.test(r.stdout) && fs.existsSync(path.join(repo, ']bench_baseline.txt')), 'a review action does not run without --reviewed', r.stdout + r.stderr);
	fs.rmSync(repo, { recursive: true, force: true });
}

// 3. The pre-commit hook blocks commits while a flag exists (needs git and sh; skipped where they are missing).
{
	const hook = path.join(ROOT, 'tools', 'githooks', 'pre-commit');
	assert(fs.existsSync(hook) && !fs.readFileSync(hook, 'utf8').includes('\r'), 'tools/githooks/pre-commit exists with LF line endings');
	const git = (cwd, ...a) => spawnSync('git', a, { cwd, encoding: 'utf8' });
	const repo = tmp();
	if (git(repo, 'init', '-q').status === 0 && spawnSync('sh', ['-c', 'true']).status === 0) {
		git(repo, 'config', 'user.email', 't@t'); git(repo, 'config', 'user.name', 't');
		fs.mkdirSync(path.join(repo, 'hooks')); fs.copyFileSync(hook, path.join(repo, 'hooks', 'pre-commit')); fs.chmodSync(path.join(repo, 'hooks', 'pre-commit'), 0o755);
		git(repo, 'config', 'core.hooksPath', 'hooks');
		fs.writeFileSync(path.join(repo, 'a.txt'), 'a'); git(repo, 'add', 'a.txt');
		assert(git(repo, 'commit', '-qm', 'a').status === 0, 'the hook lets a commit through when there is no flag');
		fs.writeFileSync(path.join(repo, ']x.txt'), 'x blocks commits: test\naction: test\nchecks: sweep\n');
		fs.writeFileSync(path.join(repo, 'b.txt'), 'b'); git(repo, 'add', 'b.txt');
		const r = git(repo, 'commit', '-qm', 'b');
		assert(r.status !== 0 && /blocked by flag file \]x\.txt/.test(r.stderr), 'a flag file in the root blocks the commit and the hook names it', r.stderr);
	} else console.log('  [SKIP] hook run (git or sh missing)');
	fs.rmSync(repo, { recursive: true, force: true });
	// The real checkout must use the hook (skipped in test copies without .git, e.g. /tmp/kb).
	if (fs.existsSync(path.join(ROOT, '.git'))) {
		const v = git(ROOT, 'config', '--get', 'core.hooksPath');
		assert(v.stdout.trim() === 'tools/githooks', 'this clone runs tools/githooks (run: git config core.hooksPath tools/githooks)', v.stdout.trim() || '(unset)');
	}
}

// 4. Only tools/flags.js builds flag files. A write call or a path built from a flag name (a `]x` literal, FLAG, BATCH_FLAG,
// Checks.FLAG) outside it is a second writer that can drift from the format (this suite once found checks.js doing exactly that).
// Reads go through Flags.readFlags; test/ is exempt because its fixtures write deliberately malformed flags.
{
	const WRITE_OR_PATH = /\b(writeFileSync|appendFileSync|renameSync|copyFileSync|createWriteStream|openSync|path\.(join|resolve))\(.*((?<!['"`])\b[A-Z_]*FLAG\b|['"`]\]\w)/;
	const handBuilt = text => text.split('\n').map((line, i) => [i + 1, line]).filter(([, l]) => !/^\s*(\/\/|\*|\/\*)/.test(l) && WRITE_OR_PATH.test(l));
	assert(handBuilt("fs.writeFileSync(path.join(repo, FLAG), body);").length === 1 && handBuilt("const f = path.join(repo, ']x.txt');").length === 1
		&& handBuilt("fs.writeFileSync(file, Checks.FLAG);").length === 1, 'detector: finds a write or a path built from a flag name');
	assert(handBuilt("Flags.writeFlag(REPO, FLAG, {});").length === 0 && handBuilt("fs.writeFileSync(BASELINE, text);").length === 0
		&& handBuilt(" * path.join(repo, FLAG) in a comment").length === 0, 'detector: ignores Flags.writeFlag, ordinary writes and comments');
	const files = [];
	const walk = dir => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		if (['node_modules', 'local', 'test', 'data', 'flagged', '.git'].includes(e.name)) continue;
		const p = path.join(dir, e.name);
		if (e.isDirectory()) walk(p); else if (e.name.endsWith('.js')) files.push(p);
	} };
	walk(ROOT);
	const flagsJs = path.join(ROOT, 'tools', 'flags.js');
	const bad = files.filter(f => f !== flagsJs).flatMap(f => handBuilt(fs.readFileSync(f, 'utf8')).map(([n, l]) => `${path.relative(ROOT, f)}:${n}: ${l.trim()}`));
	assert(!bad.length, 'flag files are written only through Flags.writeFlag in tools/flags.js (use it, or add a registered option to it)', '\n    ' + bad.join('\n    '));
}

console.log(`flags: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
