#!/usr/bin/env node
// tools/hangul_literals.js - Hangul literals and magic unit ids in engine code. Usage: printHelp() below (node tools/hangul_literals.js --help).
'use strict';

function printHelp() {
	console.log(`tools/hangul_literals.js - find the literals that put linguistic knowledge in code instead of data, and hold the line on them.

Scans engine code (korean/, shared/) for Hangul in strings, templates and regexes, and for magic unit ids (a number compared
with an id: g.id === 645, uId === 1369, units[66], [322, 1383].includes(g.unitId), byId.get(66)).
Why, naming rules and migration order: docs/architecture.md section 1, "Hangul constants scheme". Allowed home: data/hangul_constants.js.

Not scanned (exempt by decision 2026-11-22): tools/, test/, root CLIs (tooling); fc2/, flashcards/, webapp/ (user interface);
data/ (data, including the rule tables moved there). Error and log text (throw, new Error, errors.push, console.*, message: ...)
is reported as exempt.

Kinds:
  compare   a word tested against ONE value (===, !==, case, x.includes/startsWith/endsWith/has('w')): the rules most worth
            moving into data.js tags. [chainN] marks a run of such tests on the same subject (a === 'x' || a === 'y', or
            consecutive ifs with identical bodies): a ready-made table.
  table     inside an array/object literal; tables move to hangul_constants.js whole, under one name.
  regex     Hangul inside a regex literal (rebuild with new RegExp from named constants).
  unit-id   a magic unit id.
  other     anything else (return values, arguments, replacements).

Usage:
  node tools/hangul_literals.js                 every literal: file:line  function  kind  text
  node tools/hangul_literals.js --summary       the scale of the problem in one screen
  node tools/hangul_literals.js --by-file       count per file, by kind
  node tools/hangul_literals.js --by-function   count per function, with the lines it spans (comment header included)
  node tools/hangul_literals.js --compare       only single-value comparisons and unit ids, with chains marked
  node tools/hangul_literals.js --tables        every table: size, file:lines, name, free-floating (module level) or which function
  Filters: --file <substring>  --kind <kind>  --include-exempt (also list exempt error text)  --quiet (no footer)
  node tools/hangul_literals.js --check         ratchet, run by node test.js Stage 0: fails if any file's count differs from
                                                test/hangul_literals_baseline.json (new files must be 0). Fewer = good: lock it in with
  node tools/hangul_literals.js --save-baseline`);
}

if (typeof require === 'function' && typeof module !== 'undefined' && require.main === module) require('./exit_log.js').watch('tools/hangul_literals.js'); // failed runs -> test.js report
if (require.main === module && (process.argv.includes('--help') || process.argv.includes('-h'))) { printHelp(); process.exit(0); }

const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const BASELINE = path.join(ROOT, 'test', 'hangul_literals_baseline.json');
const SCAN_DIRS = ['korean', 'shared'];
const HANGUL = /[ᄀ-ᇿ㄰-㆏가-힣]/;
const ID_NAME = /(^id$|Id$|ID$|_id$|^uid$)/;
const MESSAGE_CALL = /^(log|warn|error|info|debug)$/, MESSAGE_LIST = /err|warn|msg|message|issue|problem|reason|note/i, MESSAGE_KEY = /^(message|msg|reason|error|warning|hint|explanation|note|description)$/;
const SPELLING_TESTS = new Set(['includes', 'startsWith', 'endsWith', 'has', 'indexOf']);

function listFiles() {
	const out = [];
	for (const d of SCAN_DIRS) {
		for (const f of fs.readdirSync(path.join(ROOT, d), { recursive: true })) if (String(f).endsWith('.js')) out.push(path.join(d, String(f)).split(path.sep).join('/'));
	}
	return out.sort();
}

let espree = null;
function parse(src) {
	espree = espree || require('espree');
	return espree.parse(src, { ecmaVersion: 'latest', sourceType: 'script', loc: true, range: true, comment: true });
}

const srcOf = (src, n) => src.slice(n.range[0], n.range[1]);
const isIdLike = n => !!n && ((n.type === 'Identifier' && ID_NAME.test(n.name)) ||
	(n.type === 'MemberExpression' && (n.computed ? (n.property.type === 'MemberExpression' && !n.property.computed && n.property.property.name === 'Id') || (n.property.type === 'Literal' && ID_NAME.test(String(n.property.value))) : ID_NAME.test(n.property.name))));
const isHangulLiteral = n => (n.type === 'Literal' && ((typeof n.value === 'string' && HANGUL.test(n.value)) || (n.regex && HANGUL.test(n.regex.pattern)))) ||
	(n.type === 'TemplateLiteral' && n.quasis.some(q => HANGUL.test(q.value.raw)));
const isEq = op => op === '===' || op === '!==' || op === '==' || op === '!=';

/** Scan one file -> { literals: [...], functions: Map(name -> {start, end, count}), tables: [...] } */
function scanFile(rel) {
	const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
	const ast = parse(src);
	const comments = ast.comments || [];
	const literals = [], functions = new Map(), tables = new Map();
	let chainSeq = 0;

	// Leading comment block of a statement: contiguous comments ending right above it.
	const headerStart = line => {
		let start = line;
		for (let i = comments.length - 1; i >= 0; i--) {
			const c = comments[i];
			if (c.loc.end.line === start - 1 || (c.loc.end.line === start && c.loc.start.line < start)) start = c.loc.start.line;
			else if (c.loc.end.line < start - 1) break;
		}
		return start;
	};
	const nameOf = (fn, parent, owner) => {
		if (fn.id && fn.id.name) return fn.id.name;
		if (parent && parent.type === 'VariableDeclarator' && parent.id.type === 'Identifier') return parent.id.name;
		if (parent && (parent.type === 'Property' || parent.type === 'MethodDefinition') && parent.key) return parent.key.name || String(parent.key.value);
		if (parent && parent.type === 'AssignmentExpression') return srcOf(src, parent.left).replace(/\s+/g, '');
		return owner ? null : null;
	};

	// Chains: runs of single-value tests on the same subject, convertible to a table lookup.
	const chainOf = new Map();   // literal node -> chain id
	const leafKey = n => {
		if (n.type === 'BinaryExpression' && isEq(n.operator)) {
			const [lit, other] = isHangulLiteral(n.right) ? [n.right, n.left] : isHangulLiteral(n.left) ? [n.left, n.right] : [null];
			if (lit && lit.type === 'Literal') return { key: `${n.operator} ${srcOf(src, other)}`, lit };
		}
		if (n.type === 'CallExpression' && n.callee.type === 'MemberExpression' && SPELLING_TESTS.has(n.callee.property.name) && n.arguments.length === 1 && isHangulLiteral(n.arguments[0]) && n.arguments[0].type === 'Literal') {
			return { key: `${srcOf(src, n.callee.object)}.${n.callee.property.name}()`, lit: n.arguments[0] };
		}
		if (n.type === 'UnaryExpression' && n.operator === '!') { const k = leafKey(n.argument); if (k) return { key: '!' + k.key, lit: k.lit }; }
		return null;
	};
	const flatten = (n, op, out) => { if (n.type === 'LogicalExpression' && n.operator === op) { flatten(n.left, op, out); flatten(n.right, op, out); } else out.push(n); return out; };
	const markChain = leaves => { if (leaves.length < 2) return; chainSeq++; for (const l of leaves) chainOf.set(l.lit, chainSeq); };
	const findChains = (n, parent) => {
		if (n.type === 'LogicalExpression' && !(parent && parent.type === 'LogicalExpression' && parent.operator === n.operator)) {
			const leaves = flatten(n, n.operator, []).map(leafKey);
			const groups = new Map();
			for (const l of leaves) if (l) { if (!groups.has(l.key)) groups.set(l.key, []); groups.get(l.key).push(l); }
			for (const g of groups.values()) markChain(g);
		}
		const body = n.type === 'BlockStatement' || n.type === 'Program' ? n.body : n.type === 'SwitchCase' ? n.consequent : null;
		if (body) {   // consecutive ifs with the same single-value test shape and identical bodies
			let run = [], key = null, cons = null;
			const flush = () => { markChain(run); run = []; key = null; cons = null; };
			for (const st of body) {
				const l = st.type === 'IfStatement' && !st.alternate ? leafKey(st.test) : null;
				const c = l ? srcOf(src, st.consequent) : null;
				if (l && l.key === key && c === cons) run.push(l);
				else { flush(); if (l) { run = [l]; key = l.key; cons = c; } }
			}
			flush();
		}
	};

	const walk = (n, parents, fn) => {
		if (!n || typeof n.type !== 'string') return;
		const parent = parents[parents.length - 1];
		if (/Function/.test(n.type)) {
			const name = nameOf(n, parent);
			if (name) {
				const stmt = [...parents].reverse().find(p => /Statement$|Declaration$|^Property$|^MethodDefinition$/.test(p.type) && p.type !== 'BlockStatement' && p.type !== 'ReturnStatement') || n;
				const holder = n.type === 'FunctionDeclaration' ? n : stmt;
				fn = { name: functions.has(name) ? `${name}@${n.loc.start.line}` : name, start: headerStart(holder.loc.start.line), end: n.loc.end.line, count: 0, kinds: {} };
				functions.set(fn.name, fn);
			}
		}
		findChains(n, parent);
		if (isHangulLiteral(n)) record(n, parents, fn, 'hangul');
		if (n.type === 'Literal' && typeof n.value === 'number' && isUnitIdUse(n, parents)) record(n, parents, fn, 'unit-id');
		parents.push(n);
		for (const k of Object.keys(n)) {
			if (k === 'loc' || k === 'range') continue;
			const v = n[k];
			if (Array.isArray(v)) v.forEach(c => walk(c, parents, fn)); else if (v && typeof v.type === 'string') walk(v, parents, fn);
		}
		parents.pop();
	};

	const isUnitIdUse = (n, parents) => {
		const p = parents[parents.length - 1], pp = parents[parents.length - 2];
		if (!p) return false;
		if (p.type === 'BinaryExpression' && isEq(p.operator)) return isIdLike(p.left === n ? p.right : p.left);
		if (p.type === 'SwitchCase' && p.test === n) { const sw = pp; return sw && isIdLike(sw.discriminant); }
		if (p.type === 'MemberExpression' && p.computed && p.property === n) return /(^units$|languageUnits|^allUnits$)/.test(srcOf(src, p.object).split('.').pop());
		if (p.type === 'CallExpression' && p.arguments[0] === n && p.callee.type === 'MemberExpression' && p.callee.property.name === 'get') return /ById/i.test(srcOf(src, p.callee.object));
		if (p.type === 'ArrayExpression' && pp && pp.type === 'MemberExpression' && pp.object === p) {
			const call = parents[parents.length - 3];
			return !!call && call.type === 'CallExpression' && /^(includes|has|indexOf)$/.test(pp.property.name) && isIdLike(call.arguments[0]);
		}
		return false;
	};

	const exemptReason = (parents) => {
		for (let i = parents.length - 1; i >= 0; i--) {
			const p = parents[i];
			if (/Function|Statement$/.test(p.type) && p.type !== 'ThrowStatement' && p.type !== 'ExpressionStatement') return null;
			if (p.type === 'ThrowStatement') return 'error text';
			if (p.type === 'NewExpression' && /Error$/.test(p.callee.name || '')) return 'error text';
			if (p.type === 'CallExpression' && p.callee.type === 'MemberExpression') {
				const m = p.callee.property.name, obj = srcOf(src, p.callee.object);
				if (obj === 'console' && MESSAGE_CALL.test(m)) return 'log text';
				if ((m === 'push' || m === 'unshift') && MESSAGE_LIST.test(obj)) return 'error text';
			}
			if (p.type === 'Property' && p.key && MESSAGE_KEY.test(p.key.name || p.key.value || '')) return 'error text';
		}
		return null;
	};

	const record = (n, parents, fn, what) => {
		const p = parents[parents.length - 1];
		let kind;
		if (what === 'unit-id') kind = 'unit-id';
		else if (n.regex) kind = 'regex';
		else if (parents.some(x => x.type === 'ArrayExpression' || x.type === 'ObjectExpression') && (p.type === 'ArrayExpression' || p.type === 'Property' || p.type === 'ObjectExpression')) kind = 'table';
		else if ((p.type === 'BinaryExpression' && isEq(p.operator)) || (p.type === 'SwitchCase' && p.test === n) ||
			(p.type === 'CallExpression' && p.callee.type === 'MemberExpression' && SPELLING_TESTS.has(p.callee.property.name) && p.arguments.length === 1)) kind = 'compare';
		else kind = 'other';
		const exempt = what === 'hangul' ? exemptReason(parents) : null;
		const text = n.regex ? `/${n.regex.pattern}/${n.regex.flags}` : n.type === 'TemplateLiteral' ? '`' + n.quasis.map(q => q.value.raw).join('${}') + '`' : what === 'unit-id' ? String(n.value) : JSON.stringify(n.value);
		const lit = { file: rel, line: n.loc.start.line, fn: fn ? fn.name : '(top level)', kind, text, exempt, chain: null, node: n };
		literals.push(lit);
		if (kind === 'table') {
			const outer = parents.find(x => x.type === 'ArrayExpression' || x.type === 'ObjectExpression');
			if (!tables.has(outer)) {
				let di = parents.indexOf(outer) - 1;   // climb through wrappers: Object.freeze([...]), new Set([...]), [...].slice().sort()
				while (di > 0 && /^(CallExpression|NewExpression|ArrayExpression|MemberExpression)$/.test(parents[di].type)) di--;
				const decl = parents[di];
				const name = decl && decl.type === 'VariableDeclarator' ? decl.id.name : decl && decl.type === 'Property' ? (decl.key.name || decl.key.value) : decl && decl.type === 'AssignmentExpression' ? srcOf(src, decl.left) : '(inline)';
				const freeFloating = !fn;   // module level: outside every named function (the module's anonymous IIFE wrapper does not count)
				tables.set(outer, { file: rel, line: outer.loc.start.line, endLine: outer.loc.end.line, name, fn: fn ? fn.name : '(top level)', size: 0, freeFloating });
			}
			if (!exempt) tables.get(outer).size++;
		}
		if (fn && !exempt) { fn.count++; fn.kinds[kind] = (fn.kinds[kind] || 0) + 1; }
	};

	walk(ast, [], null);
	for (const l of literals) { if (chainOf.has(l.node)) l.chain = `${rel}#${chainOf.get(l.node)}`; delete l.node; }
	return { literals, functions, tables: [...tables.values()].filter(t => t.size > 0) };
}

function scanAll() {
	const files = listFiles(), results = [];
	for (const f of files) { try { results.push(scanFile(f)); } catch (e) { throw new Error(`${f}: ${e.message}`); } }
	return results;
}

const KINDS = ['compare', 'table', 'regex', 'unit-id', 'other'];
const countsByFile = results => {
	const out = {};
	for (const r of results) {
		const lits = r.literals.filter(l => !l.exempt);
		if (lits.length) out[r.literals[0].file] = lits.length;
	}
	return out;
};

function main() {
	const args = process.argv.slice(2), opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
	const fileFilter = opt('--file'), kindFilter = opt('--kind'), withExempt = args.includes('--include-exempt');
	const results = scanAll().filter(r => !fileFilter || (r.literals[0] && r.literals[0].file.includes(fileFilter)) || r.functions.size === 0 && false);
	const all = results.flatMap(r => r.literals).filter(l => (!fileFilter || l.file.includes(fileFilter)) && (!kindFilter || l.kind === kindFilter));
	const live = all.filter(l => !l.exempt);

	if (args.includes('--save-baseline') || args.includes('--check')) {
		const now = countsByFile(scanAll());
		if (args.includes('--save-baseline')) {
			fs.writeFileSync(BASELINE, JSON.stringify({ note: 'Per-file counts of Hangul literals and magic unit ids in engine code (tools/hangul_literals.js). Only ever lower these.', files: now }, null, 1) + '\n');
			console.log(`Saved ${Object.keys(now).length} files, ${Object.values(now).reduce((a, b) => a + b, 0)} literals -> ${path.relative(ROOT, BASELINE)}`);
			return 0;
		}
		const base = fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, 'utf8')).files : {};
		const up = [], down = [];
		for (const f of new Set([...Object.keys(base), ...Object.keys(now)])) {
			const a = base[f] || 0, b = now[f] || 0;
			if (b > a) up.push(`${f}: ${a} -> ${b}`); else if (b < a) down.push(`${f}: ${a} -> ${b}`);
		}
		if (up.length) console.log(`New Hangul literals or magic unit ids in engine code (put them in data/hangul_constants.js under a use-specific name, or in data.js; see docs/architecture.md section 1):\n  ${up.join('\n  ')}\n  Find them: node tools/hangul_literals.js --file <file>`);
		if (down.length) console.log(`Fewer literals than the baseline (good): lock it in with node tools/hangul_literals.js --save-baseline\n  ${down.join('\n  ')}`);
		if (!up.length && !down.length) console.log(`OK: ${Object.values(now).reduce((a, b) => a + b, 0)} literals in ${Object.keys(now).length} files, matching the baseline.`);
		return up.length || down.length ? 1 : 0;
	}

	if (args.includes('--summary')) {
		const by = k => live.filter(l => l.kind === k).length;
		const chains = new Map(); for (const l of live) if (l.chain) chains.set(l.chain, (chains.get(l.chain) || 0) + 1);
		const tables = results.flatMap(r => r.tables);
		const fns = results.flatMap(r => [...r.functions.values()]).filter(f => f.count);
		const sizes = { '1-5': 0, '6-25': 0, '26-100': 0, '>100': 0 }; for (const f of fns) sizes[f.count <= 5 ? '1-5' : f.count <= 25 ? '6-25' : f.count <= 100 ? '26-100' : '>100']++;
		const top = results.flatMap(r => r.literals.filter(l => !l.exempt && l.fn === '(top level)')).length;
		console.log(`Engine code (korean/, shared/): ${live.length} literals in ${new Set(live.map(l => l.file)).size} files; ${all.length - live.length} exempt (error/log text).`);
		console.log(`  compare  ${String(by('compare')).padStart(5)}  word tested against one value; ${[...chains.values()].reduce((a, b) => a + b, 0)} of them sit in ${chains.size} chains (ready-made tables)`);
		console.log(`  table    ${String(by('table')).padStart(5)}  in ${tables.length} tables (${tables.filter(t => t.freeFloating).length} free-floating at module level, holding ${tables.filter(t => t.freeFloating).reduce((a, t) => a + t.size, 0)})`);
		console.log(`  regex    ${String(by('regex')).padStart(5)}`);
		console.log(`  unit-id  ${String(by('unit-id')).padStart(5)}  magic unit ids`);
		console.log(`  other    ${String(by('other')).padStart(5)}`);
		console.log(`Functions holding literals: ${fns.length} (by count: ${Object.entries(sizes).map(([k, v]) => `${k}: ${v}`).join(', ')}); module level (outside functions): ${top}.`);
		return 0;
	}

	if (args.includes('--by-file')) {
		const rows = new Map();
		for (const l of live) { const r = rows.get(l.file) || { n: 0 }; r.n++; r[l.kind] = (r[l.kind] || 0) + 1; rows.set(l.file, r); }
		for (const [f, r] of [...rows].sort((a, b) => b[1].n - a[1].n)) console.log(`${String(r.n).padStart(5)}  ${f.padEnd(50)} ${KINDS.filter(k => r[k]).map(k => `${k} ${r[k]}`).join(', ')}`);
		return 0;
	}

	if (args.includes('--by-function')) {
		for (const r of results) {
			const fns = [...r.functions.values()].filter(f => f.count).sort((a, b) => a.start - b.start);
			const top = r.literals.filter(l => !l.exempt && l.fn === '(top level)' && (!kindFilter || l.kind === kindFilter));
			if (!fns.length && !top.length) continue;
			console.log(r.literals[0].file);
			if (top.length) console.log(`  ${String(top.length).padStart(5)}  (top level, outside functions)`);
			for (const f of fns) console.log(`  ${String(f.count).padStart(5)}  ${f.name}  lines ${f.start}-${f.end}  (${KINDS.filter(k => f.kinds[k]).map(k => `${k} ${f.kinds[k]}`).join(', ')})`);
		}
		return 0;
	}

	if (args.includes('--tables')) {
		for (const t of results.flatMap(r => r.tables).filter(t => !fileFilter || t.file.includes(fileFilter)).sort((a, b) => b.size - a.size)) {
			console.log(`${String(t.size).padStart(5)}  ${t.file}:${t.line}-${t.endLine}  ${t.name}  ${t.freeFloating ? 'free-floating' : 'in ' + t.fn}`);
		}
		return 0;
	}

	const rows = args.includes('--compare') ? live.filter(l => l.kind === 'compare' || l.kind === 'unit-id') : withExempt ? all : live;
	if (args.includes('--compare')) rows.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
	for (const l of rows) {
		console.log(`${l.file}:${l.line}  ${l.fn}  ${l.kind}${l.chain ? ` [chain${l.chain.split('#')[1]}]` : ''}${l.exempt ? ` (exempt: ${l.exempt})` : ''}  ${l.text.length > 100 ? l.text.slice(0, 97) + '...' : l.text}`);
	}
	if (!args.includes('--quiet')) console.log(`\n${rows.length} literal(s). Modes: --summary --by-file --by-function --compare --tables --check (see --help)`);
	return 0;
}

if (require.main === module) process.exit(main());
module.exports = { scanAll, scanFile, countsByFile };
