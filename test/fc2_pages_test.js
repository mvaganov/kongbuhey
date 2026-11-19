#!/usr/bin/env node
/**
 * fc2 page wiring (static, well under a second). Catches the "stale/missing script tag" class of bug that jsdom playthroughs miss
 * when the test machine has the right files but the page does not load them:
 *  - every <script src> in fc2/index.html points at a file that exists, with no duplicates;
 *  - every fc2/*.js file is loaded by index.html (a new module that was never added);
 *  - every FC2-prefixed window global that fc2 scripts read is assigned (window.X = ...) by some script index.html loads.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const PAGE_DIR = path.join(ROOT, 'fc2');

let passed = 0, failed = 0;
const assert = (c, m) => { if (c) { passed++; console.log(`  [PASS] ${m}`); } else { failed++; console.error(`  [FAIL] ${m}`); } };

console.log('======================================================');
console.log('         FC2 PAGE WIRING (static script checks)       ');
console.log('======================================================');

const html = fs.readFileSync(path.join(PAGE_DIR, 'index.html'), 'utf8');
const srcs = [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map(m => m[1]);
const files = srcs.map(s => path.resolve(PAGE_DIR, s));

const missing = srcs.filter((s, i) => !fs.existsSync(files[i]));
assert(srcs.length > 0 && missing.length === 0, `every script tag points at an existing file${missing.length ? ' (missing: ' + missing.join(', ') + ')' : ''}`);
assert(new Set(files).size === files.length, 'no script is loaded twice');

const own = fs.readdirSync(PAGE_DIR).filter(f => f.endsWith('.js'));
const unloaded = own.filter(f => !files.includes(path.join(PAGE_DIR, f)));
assert(unloaded.length === 0, `every fc2/*.js file is loaded by index.html${unloaded.length ? ' (not loaded: ' + unloaded.join(', ') + ')' : ''}`);

const text = f => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '');
const assigned = new Set();
for (const f of files) for (const m of text(f).matchAll(/window\.([A-Za-z_$][\w$]*)\s*=[^=]/g)) assigned.add(m[1]);
const problems = [];
for (const f of files.filter(f => f.startsWith(PAGE_DIR + path.sep))) {
	const used = new Set([...text(f).matchAll(/window\.((?:FC2|fc2)[\w$]*)/g)].map(m => m[1]));
	for (const name of used) if (!assigned.has(name)) problems.push(`${path.basename(f)} uses window.${name}, which no loaded script assigns`);
}
assert(problems.length === 0, `every FC2-prefixed window global that fc2 scripts use is defined by a loaded script${problems.length ? '\n    ' + problems.join('\n    ') : ''}`);

console.log(`\nfc2 pages: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
