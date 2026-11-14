#!/usr/bin/env node
/**
 * Browser load test (jsdom): index.html is a second, hand-maintained module system that the Node
 * tests never exercise. This catches what Node `require()` hides:
 *   - top-level const/let collisions between classic <script> files (unwrapped modules)
 *   - korean/ modules that Node loads but index.html forgot to include
 *   - exports that never reach `window`
 * Found in practice: spatial/adverbial concord, sentence_validator, mood/clausal concord were silently
 * missing in the browser while every Node test passed.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
// Loaded by the Node facade (korean.js) only; intentionally absent from the browser.
const NODE_ONLY = new Set([
	'korean/types.js', 'korean/utils/lut_serializer.js', 'korean/generation/semantic_generator.js',
	'korean/generation/template_engine.js', 'korean/phonetics/english_phonemes.js'
]);
const REQUIRED_GLOBALS = [
	'KongbuheyApp', 'KongbuheyDB', 'UnitSelectorView', 'generateSentencesForUnit', 'verifiedSentenceGenerator',
	'validateSpatialConcord', 'applySpatialConcord', 'validateAdverbConcord', 'canAdverbPrecede', 'applyAdverbConcord',
	'applyMoodConcord', 'applyClausalConcord', 'validateClausalConcord', 'applyCounterConcord',
	'validateTemporalConcord', 'validateHonorificConcord', 'setRandomSeed', 'SentenceValidator'
];

let passed = 0;
let failed = 0;
const assert = (c, m) => { if (c) { passed++; console.log(`  [PASS] ${m}`); } else { failed++; console.error(`  [FAIL] ${m}`); } };

function walk(dir) {
	return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
		e.isDirectory() ? walk(path.join(dir, e.name)) : (e.name.endsWith('.js') ? [path.join(dir, e.name)] : []));
}

(async () => {
	console.log('======================================================');
	console.log('       BROWSER LOAD TEST (jsdom, index.html)          ');
	console.log('======================================================');

	const html = fs.readFileSync(path.join(ROOT, 'webapp', 'index.html'), 'utf8');
	const included = new Set([...html.matchAll(/src="\.\.\/(korean\/[^"]+)"/g)].map(m => m[1]));
	const onDisk = walk(path.join(ROOT, 'korean')).map(f => path.relative(ROOT, f).split(path.sep).join('/'));
	const orphaned = onDisk.filter(f => !included.has(f) && !NODE_ONLY.has(f));
	assert(orphaned.length === 0, `every korean/ module is in index.html or on the NODE_ONLY list${orphaned.length ? ' (missing: ' + orphaned.join(', ') + ')' : ''}`);
	const dead = [...included].filter(f => !onDisk.includes(f));
	assert(dead.length === 0, `index.html references no missing files${dead.length ? ' (' + dead.join(', ') + ')' : ''}`);

	if (process.argv.includes('--static')) {
		// jsdom takes ~25s just to require() on a slow filesystem; the full run (node test.js --full) does it.
		console.log('  [SKIP] jsdom load check (run with --full)');
		console.log(`\nTOTAL: ${passed + failed}  PASSED: ${passed}  FAILED: ${failed}`);
		process.exit(failed > 0 ? 1 : 0);
	}
	const { JSDOM, VirtualConsole } = require('jsdom');
	const errors = [];
	const vc = new VirtualConsole();
	vc.on('jsdomError', e => errors.push(((e.detail && e.detail.message) || e.message) + (e.type ? ` [${e.type}]` : '')));
	const dom = await JSDOM.fromFile(path.join(ROOT, 'webapp', 'index.html'), {
		runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc
	});
	await new Promise(r => dom.window.addEventListener('load', r));
	await new Promise(r => setTimeout(r, 1200));
	const w = dom.window;

	// local/verified_originals.js is optional and gitignored: its absence on a fresh clone is expected.
	const realErrors = errors.filter(e => !/local[\\/]verified_originals/.test(e));
	assert(realErrors.length === 0, `all <script> files load with no errors${realErrors.length ? ': ' + realErrors.slice(0, 3).join(' | ') : ''}`);
	const absent = REQUIRED_GLOBALS.filter(n => typeof w[n] === 'undefined');
	assert(absent.length === 0, `required globals reach window${absent.length ? ' (absent: ' + absent.join(', ') + ')' : ''}`);

	let produced = 0;
	try {
		w.setRandomSeed(1);
		produced = w.generateSentencesForUnit(5, 3, { seedOffset: 1 }).length;
	} catch (e) { errors.push(e.message); }
	assert(produced > 0, 'browser-side generator produces sentences');
	w.close();

	console.log(`\nTOTAL: ${passed + failed}  PASSED: ${passed}  FAILED: ${failed}`);
	// jsdom leaves timers/handles alive for ~20s after window.close(); exit explicitly.
	process.exit(failed > 0 ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
