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
const REQUIRED_GLOBALS = ['openUnitPopup', 'renderMarkdownWithHtml', 'speakKorean', 
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

	const credits = ['Gemini Flash 3.8', 'Gemini Argon', 'Claude Sonnet', 'Claude Opus', 'Yonsei', 'Tatoeba', 'btn-open-credits'];
	const missingCredits = credits.filter(c => !html.includes(c));
	assert(missingCredits.length === 0, `About & Credits modal names every attribution${missingCredits.length ? ' (missing: ' + missingCredits.join(', ') + ')' : ''}`);

	// Standalone flashcard page: every script exists and the engine list mirrors webapp/index.html.
	const fcHtml = fs.readFileSync(path.join(ROOT, 'flashcards', 'index.html'), 'utf8');
	const fcSrcs = [...fcHtml.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
	const fcMissing = fcSrcs.filter(src => !fs.existsSync(path.join(ROOT, 'flashcards', src)));
	assert(fcMissing.length === 0, `flashcards/index.html references no missing files${fcMissing.length ? ' (' + fcMissing.join(', ') + ')' : ''}`);
	const fcKorean = fcSrcs.filter(src => src.startsWith('../korean/'));
	assert(JSON.stringify(fcKorean) === JSON.stringify([...included].map(f => '../' + f)), 'flashcards/index.html loads the same korean/ engine modules in the same order as the webapp');

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
	// Unit Selector: keyboard navigation, in-place selection (no list rebuild), Space/Enter toggles InSet.
	try {
		const sv = w.kongbuheyApp.selectorView;
		sv.render();
		sv.expandedSources.add(sv.getSourceGroups()[0].source);
		sv.renderSourcesList();
		const firstRow = w.document.querySelector('.selector-unit-row');
		const firstId = Number(firstRow.dataset.unitId);
		sv.selectUnitForDetails(firstId);
		assert(w.document.querySelector('.selector-unit-row') === firstRow && firstRow.classList.contains('is-active-detail'),
			'selecting a unit highlights it in place without rebuilding the list (scroll position is kept)');
		const order = sv.getNavigableUnitIds();
		const key = k => { const ev = new w.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }); w.document.body.dispatchEvent(ev); return ev; };
		w.document.getElementById('view-selector').classList.add('active');
		key('ArrowDown');
		assert(sv.selectedUnitId === order[order.indexOf(firstId) + 1], 'Down arrow selects the next unit in the list');
		const lastOfGroup = sv.getSourceGroups()[0].unitIds.slice(-1)[0];
		sv.selectUnitForDetails(lastOfGroup);
		key('ArrowDown');
		const nextGroup = sv.getSourceGroups()[1];
		assert(sv.selectedUnitId === nextGroup.unitIds[0] && sv.expandedSources.has(nextGroup.source), 'Down arrow from the last unit of a source opens the next source and selects its first unit');
		key('ArrowUp');
		assert(sv.selectedUnitId === lastOfGroup, 'Up arrow walks back');
		const before = Boolean(sv.engine.getCellValue(sv.selectedUnitId, 'InSet'));
		key(' ');
		await new Promise(r => setTimeout(r, 50));
		assert(Boolean(sv.engine.getCellValue(lastOfGroup, 'InSet')) === !before, 'Space toggles the selected unit In Set');
		key('Enter');
		await new Promise(r => setTimeout(r, 50));
		assert(Boolean(sv.engine.getCellValue(lastOfGroup, 'InSet')) === before, 'Enter toggles it back');
	} catch (e) { assert(false, 'selector keyboard tests ran: ' + e.message); }

	// Verified Sentences: unit links open a details popup, single-choice slots no longer print #undefined.
	try {
		const vv = w.kongbuheyApp.verifiedView;
		vv.render();
		const singles = vv.getAllEntries().filter(e => vv._getGenerator().analyzeTemplateStructure(e.template || e).singleChoiceCount > 0);
		assert(singles.length > 0, 'found a verified template with a single-choice slot');
		vv.selectedTemplateId = singles[0].id;
		vv.render();
		const html = vv.container.innerHTML;
		assert(!/#undefined/.test(html), 'single-choice slot banner never shows #undefined');
		const link = vv.container.querySelector('a[data-unit-link]');
		assert(!!link, 'valid matching units are rendered as links');
		link.click();
		const pop = w.document.querySelector('.unit-popup');
		assert(pop && pop.querySelector('.details-korean-heading') && pop.querySelector('.details-english-definition'), 'clicking a unit link opens a popup with the unit details');
		pop.querySelector('.modal-close-btn').click();
		assert(!w.document.querySelector('.unit-popup'), 'popup closes');
	} catch (e) { assert(false, 'verified view tests ran: ' + e.message); }

	w.close();

	// Flashcard page: renders a card, flips on a tap, scores, undoes (jsdom has no canvas: ignore that one error).
	const fcErrors = [];
	const fvc = new VirtualConsole();
	fvc.on('jsdomError', e => { const m = (e.detail && e.detail.message) || e.message; if (!/getContext|Not implemented/.test(m)) fcErrors.push(m); });
	const fdom = await JSDOM.fromFile(path.join(ROOT, 'flashcards', 'index.html'), { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: fvc });
	await new Promise(r => fdom.window.addEventListener('load', r));
	await new Promise(r => setTimeout(r, 800));
	const fd = fdom.window.document, app = fdom.window.flashcardApp;
	assert(fcErrors.length === 0, `flashcard page loads with no errors${fcErrors.length ? ': ' + fcErrors.slice(0, 2).join(' | ') : ''}`);
	assert(app && fd.querySelectorAll('.sentence').length > 0 && fd.querySelector('.unit-main'), 'flashcard front shows the unit and example sentences');
	fd.querySelector('#card').click();
	assert(fd.querySelectorAll('.score').length === 5 && fd.querySelector('.s-en'), 'tapping empty space reveals the back with 5 score buttons and English');
	const first = app.deck.frontId;
	fd.querySelector('.score[data-v="1"]').click();
	assert(app.deck.frontId !== first && app.deck.scoreOf(first) === 1, 'scoring moves to the next card and records the score');
	fd.querySelector('[data-act="undo"]').click();
	assert(app.deck.frontId === first && app.deck.scoreOf(first) === 0, 'Back undoes the last score');
	// Example-sentence unit links: queue the clicked unit next (default option), adding it to the deck if needed.
	const link = fd.querySelector('.s-ko a[data-unit]');
	assert(!!link && fd.querySelector('.s-ko mark.hl'), 'example sentences show the unit highlighted and other units as links');
	if (link) {
		const lid = Number(link.dataset.unit);
		app.deck.remove(lid);
		link.click();
		assert(app.deck.has(lid) && (app.deck.order[1] === lid || app.deck.frontId === lid), 'tapping a unit link adds it to the deck and queues it next');
	}
	// Back side: Remove from the deck; seen/correct stats; sorting.
	fd.querySelector('#card').click();
	const removed = app.deck.frontId;
	fd.querySelector('[data-act="remove-unit"]').click();
	assert(!app.deck.has(removed) && app.deck.frontId !== removed, 'Remove takes the current card out of the deck');
	assert(app.stat(app.deck.frontId).seen > 0, 'showing a card marks it seen');
	fd.querySelector('#card').click();
	const scored = app.deck.frontId;
	fd.querySelector('.score[data-v="2"]').click();
	assert(app.stat(scored).correct > 0, 'a positive score marks the unit correct');
	fd.querySelector('[data-act="options"]').click();
	assert(!!fd.querySelector('[data-act="sort-seen"]') && !!fd.querySelector('[data-opt="unitClick"]'), 'options offer sorting and the example-click behaviour');
	fd.querySelector('[data-act="sort-seen"]').click();
	const seenAfter = app.deck.order.slice(1).map(i => app.stat(i).seen || 0);
	assert(seenAfter.every((v, i) => i === 0 || v >= seenAfter[i - 1]) && seenAfter[seenAfter.length - 1] > 0, 'sort by last seen puts the least recently seen first');
	// Units mode: list, source toggle, details with morpheme breakdown, add back.
	fd.querySelector('[data-act="mode-units"]').click();
	assert(app.mode === 'units' && fd.querySelectorAll('.u-src').length > 10, 'Units mode lists the sources');
	const srcBtn = fd.querySelector('[data-act="u-src-expand"]');
	srcBtn.click();
	const firstRow = fd.querySelector('[data-act="u-open"]');
	assert(!!firstRow, 'expanding a source shows its units');
	const src = srcBtn.dataset.src, srcIds = app.unitsView.bySource.get(src);
	fd.querySelector('[data-act="u-src-toggle"]').click();
	const allIn = srcIds.every(i => app.deck.has(i)), noneIn = srcIds.every(i => !app.deck.has(i));
	assert(allIn || noneIn, 'the source tick adds or removes the whole source');
	fd.querySelector('[data-act="u-open"]').click();
	assert(app.unitsView.screen === 'detail' && fd.querySelector('.u-detail .unit-main'), 'tapping a unit opens its details');
	assert(fd.querySelectorAll('.s-parts .part').length > 0 || fd.querySelectorAll('.sentence').length === 0, 'details show the morpheme breakdown of each example');
	const did = app.unitsView.detailId, wasIn = app.deck.has(did);
	fd.querySelector('.u-detail [data-act="u-toggle"]').click();
	assert(app.deck.has(did) === !wasIn, 'the details page toggles the unit in or out of the deck');
	fd.querySelector('[data-act="u-study"]').click();
	assert(app.mode === 'cards' && app.deck.frontId === did, 'Study now shows that unit as the current card');
	fdom.window.close();

	console.log(`\nTOTAL: ${passed + failed}  PASSED: ${passed}  FAILED: ${failed}`);
	// jsdom leaves timers/handles alive for ~20s after window.close(); exit explicitly.
	process.exit(failed > 0 ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
