#!/usr/bin/env node
/**
 * fc2 UI test (jsdom): loads fc2/index.html like a phone would and plays it through the real click handlers.
 * Node tests of game.js cannot see wiring bugs (a renamed data-act, a missing export, a handler that throws).
 * Covers: first free pull, one learning card, a promotion trial, the number sound board unlock and quiz.
 * Layout and animation are not checked (no canvas or real speech in jsdom): look at those on the phone.
 * Runs in the default suite (about 30 s on a slow disk, almost all of it jsdom loading). `--static` skips the jsdom run.
 */
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..');

let passed = 0, failed = 0;
const assert = (c, m) => { if (c) { passed++; console.log(`  [PASS] ${m}`); } else { failed++; console.error(`  [FAIL] ${m}`); } };
const wait = ms => new Promise(r => setTimeout(r, ms));
const until = async (fn, ms = 5000) => { const t = Date.now(); while (Date.now() - t < ms) { if (fn()) return true; await wait(50); } return false; };

(async () => {
	console.log('======================================================');
	console.log('          FC2 UI TEST (jsdom, fc2/index.html)         ');
	console.log('======================================================');
	if (process.argv.includes('--static')) { console.log('  (skipped: --static)'); return; }

	const { JSDOM, VirtualConsole } = require('jsdom');
	const errors = [];
	const vc = new VirtualConsole();
	vc.on('jsdomError', e => errors.push(((e.detail && e.detail.message) || e.message) + (e.type ? ` [${e.type}]` : '')));
	const said = [];
	const page = path.join(ROOT, 'fc2', 'index.html');
	const dom = await JSDOM.fromFile(page, {
		url: require('url').pathToFileURL(page).href + '?debug&persist',   // debug mode: its own storage namespace and the scene list; &persist lets it save (a plain ?debug page never writes)
		runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
		beforeParse(w) {
			const mem = new Map();   // file:// pages have no localStorage in jsdom: give it one so a reload can be simulated
			Object.defineProperty(w, 'localStorage', { value: { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => { mem.set(k, String(v)); }, removeItem: k => mem.delete(k) }, configurable: true, writable: true });
			w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => {}, set: () => true });
			w.SpeechSynthesisUtterance = function(t) { this.text = t; };
			Object.defineProperty(w, 'speechSynthesis', { value: { speak: u => said.push(u.text), cancel() {}, getVoices: () => [] }, configurable: true });
		}
	});
	const w = dom.window, d = w.document;
	await new Promise(r => w.addEventListener('load', r));
	await w.fc2App.ready;
	const app = w.fc2App, G = w.FC2Game;
	const click = sel => { const el = d.querySelector(sel); if (!el) throw new Error('missing ' + sel); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
	const step = async (name, fn) => { try { await fn(); } catch (e) { assert(false, `${name}: ${e.message}`); } };

	await step('boot', async () => {
		assert(app.debug === '' && !d.querySelector('#modal').classList.contains('hidden'), '?debug opens the scene list');
		app.closeModal();
		assert(d.querySelectorAll('#tabs .tab').length === 4 && d.querySelector('#screen .play-big, #screen [data-act="tab"]'), 'boots to a Map with four tabs and an empty-state call to action');
	});

	await step('build stamp', async () => {
		app.go('menu');
		const el = d.querySelector('#build-stamp');
		assert(w.FC2Version && el && el.textContent.includes(w.FC2Version.hash) && /\d{4}-\d\d-\d\d \d\d:\d\d/.test(el.textContent), 'the Menu ends with the build stamp (hash and time)');
		app.go('map');
	});

	await step('pull', async () => {
		app.go('shop');
		const coins0 = app.g.coins;
		click('[data-act="pull"]');
		assert(app.g.owned.length === G.pullSize(app.g) && app.g.pulls === 1 && app.g.coins === coins0, 'the first pull is free and unlocks a pack of units');
		app.closeModal();
	});

	await step('learn a card', async () => {
		app.go('play');
		assert(app.card && app.card.mode !== 'trial', 'Play shows a learning card');
		app.flip();
		click('[data-act="score"]');
		assert(app.g.totals.answers === 1 && app.g.coins > 0, 'scoring a card is recorded and pays coins');
		await until(() => app.card && !app.card.done);   // let the card swap finish
	});

	await step('sentence test', async () => {
		app.session = app.newSession(); app.card = null; app.go('map'); app.go('play');
		assert(app.opts.onlyOwned === true, 'examples default to unlocked units only');
		// some units have no example from a 5-unit pack (that is expected): show a card that does
		const showTestable = () => {
			const id = app.g.owned.find(i => { const c = app.generateFor(i); if (!c.sentences.length) return false; app.card = { id: i }; return Boolean(app.buildSentenceTest(c.sentences[0])); });
			if (id === undefined) return false;
			app.card = { id, mode: 'learn', st: 'new', side: 'front', shownAt: Date.now(), trial: null, ...app.generateFor(id) };
			app.renderScreen(false);
			return true;
		};
		// Some random 5-unit packs have no example with 3 distinct wrong answers (the app then says "try New examples"): widen the pack like later play does.
		for (let extra = 0; extra < 4 && !showTestable(); extra++) for (let i = 0; i < 15; i++) { const nid = (extra * 15 + i) * 7 + 3; if (!app.g.owned.includes(nid) && app.units.has(nid)) app.g.owned.push(nid); }
		assert(showTestable(), 'a pack has at least one unit with a testable example');
		const id = app.card.id, answers = app.g.totals.answers;
		const prefetched = await until(() => app.card.sentences[0].preTest && app.card.sentences[0].preTest.choices, 20000);
		const pre = prefetched ? app.card.sentences[0].preTest.choices : null;
		assert(prefetched, 'the quiz for a shown example is built in the background');
		click('[data-act="sent-test"]');
		assert(pre && app.stest.choices === pre, 'tapping 🎯 uses the pre-built quiz');
		click(`[data-act="stest-pick"][data-i="0"]`);
		assert(app.stest && !app.stest.done, 'a tap in the first moments after the quiz opens does not answer it');
		app.stest.readyAt = 0;
		const seenIds = [...new Set(app.stest.choices.flatMap(c => c.ids))].filter(u => app.g.owned.includes(u));
		assert(seenIds.length > 0 && seenIds.every(u => app.unitOf(u).lastSeen > 0), 'opening a test marks every unit in the sentence and its choices as seen');
		assert(app.stest && app.stest.choices.length === 4 && app.stest.choices.filter(c => c.ok).length === 1 && d.querySelectorAll('.sent-test .choice').length === 4, 'the test offers 4 translations, one right');
		const others = w.FlashcardRender.unitIdsOf(app.stest.s).filter(u => u !== id && app.g.owned.includes(u)).length;
		const coins0 = app.g.coins, xp0 = app.g.xp + app.g.level * 1000;
		click(`[data-act="stest-pick"][data-i="${app.stest.choices.findIndex(c => c.ok)}"]`);
		const chips = await until(() => d.querySelectorAll('.bchip').length >= 1);
		assert(chips, 'a right answer shows the sentence-clear chips');
		const moved = await until(() => app.card && app.card.id !== id && !app.card.done);
		assert(moved && app.g.totals.answers - answers === 3 + 2 * others && app.g.coins > coins0 && app.g.xp + app.g.level * 1000 > xp0, 'a right answer gives the card unit 3 correct answers and every other unit 2, then moves on');
		showTestable();
		const id2 = app.card.id, p2 = app.unitOf(id2).score;
		click('[data-act="sent-test"]'); app.stest.readyAt = 0;
		click(`[data-act="stest-pick"][data-i="${app.stest.choices.findIndex(c => !c.ok)}"]`);
		const a2 = app.g.totals.answers;
		await until(() => app.g.totals.answers > a2);
		assert(app.unitOf(id2).score < p2 || app.unitOf(id2).score === 0, 'a wrong answer counts as Missed it for the card');
		await until(() => app.card && !app.card.done);
	});

	await step('reverse sentence test', async () => {
		app.opts.reverse = true;
		const id = app.g.owned.find(i => { const c = app.generateFor(i); if (!c.sentences.length) return false; app.card = { id: i }; return Boolean(app.buildSentenceTest(c.sentences[0], true)); });
		app.card = { id, mode: 'learn', st: 'new', side: 'front', shownAt: Date.now(), trial: null, ...app.generateFor(id) };
		app.renderScreen(false);
		click('[data-act="sent-test"]'); app.stest.readyAt = 0;
		const t = app.stest, hangul = /[\uAC00-\uD7A3]/;
		assert(t && t.rev && t.choices.length === 4 && t.choices.every(c => hangul.test(c.text)) && !hangul.test(d.querySelector('.s-big').textContent), 'in reverse mode the English is shown with 4 Korean sentences to choose from');
		click(`[data-act="stest-pick"][data-i="${t.choices.findIndex(c => c.ok)}"]`);
		await until(() => app.card && app.card.id !== id && !app.card.done);
		app.opts.reverse = false;
		await until(() => app.card && !app.card.done);
	});

	await step('trial', async () => {
		const id = app.g.owned[0], now = Math.floor(Date.now() / 1000);
		app.session = app.newSession(); app.card = null;
		app.prog.set(id, { score: 3, tier: 0, lastCorrect: now - 5 * 3600, lastSeen: now - 5 * 3600 });
		app.g.h[id] = 0;
		app.g.owned = [id];
		app.go('map'); app.go('play');
		assert(app.card && app.card.mode === 'trial' && d.querySelectorAll('.choice').length === 4, 'a ripe unit that would promote shows a 4-choice trial');
		const right = app.card.trial.choices.findIndex(c => c.id === id);
		click(`[data-act="choose"][data-i="${right}"]`);
		assert(app.prog.get(id).tier === 1, 'passing the trial promotes the unit');
	});

	await step('trial choices are never the same answer', async () => {
		// 누구 "who" and 누가 "who (subject)" are one answer to the player: they must never share a trial.
		const norm = t => String(t).replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
		const C = w.DATA_SCHEMA;
		app.g.owned = [...app.units.keys()];
		let bad = 0;
		for (const id of [30, 66]) {
			for (let i = 0; i < 40; i++) {
				const labels = app.buildTrial(id, 0).choices.map(c => norm(c.label));
				if (new Set(labels).size !== labels.length) bad++;
			}
		}
		assert(app.units.get(30)[C.English] === 'who', 'fixture unit 30 is "who"');
		assert(bad === 0, `no trial offers two answers that differ only by case, spacing or a parenthetical (${bad} bad)`);
	});

	await step('screen change clears the particle canvas', async () => {
		let cleared = 0;
		const orig = w.FC2Fx.clear;
		w.FC2Fx.clear = (...a) => { cleared++; return orig.apply(w.FC2Fx, a); };
		app.go('map'); app.go('play'); app.go('map');
		w.FC2Fx.clear = orig;
		assert(typeof orig === 'function' && cleared >= 3, `every tab switch clears the effects canvas (${cleared} clears for 3 switches)`);
	});

	await step('number board', async () => {
		app.closeModal();
		app.g.coins = 25; app.go('shop');
		assert(!(app.g.games || {}).numbers && d.querySelector('[data-act="nb-buy"]'), 'the number board is locked and offered in the shop');
		click('[data-act="nb-buy"]');
		assert(app.g.coins === 15 && app.g.games.numbers === 1, 'buying costs 10 and unlocks it');
		assert(d.querySelectorAll('[data-act="nb-pick"]').length === 13 && said.at(-1) === app.nb.q.ko, 'the board shows 12 buttons plus 0 and speaks the number');
		const q = app.nb.q;
		click(`[data-act="nb-pick"][data-v="${q.n}"]`);
		assert(said.at(-1) === G.numberWord(q.sys, q.n), 'tapping a number speaks it');
		assert(app.nb.streak === 1 && app.nb.right === 1, 'a correct tap starts a streak');
		assert(await until(() => app.nb.done === false), 'the next number follows automatically');
		const q2 = app.nb.q;
		click(`[data-act="nb-pick"][data-v="${q2.n === 1 ? 2 : 1}"]`);
		assert(app.nb.streak === 0 && app.nb.total === 2 && app.g.games.numbersBest === 1, 'a wrong tap resets the streak and keeps the best');
	});

	await step('reload', async () => {
		// Simulate closing and reopening the page: flush as pagehide would, then start a second app over the same storage.
		app.g.coins += 7; app.save(); app.flush();
		const root2 = d.querySelector('#app').cloneNode(true); root2.id = 'app2'; d.body.appendChild(root2);
		const applyScene = w.FC2Debug.apply; w.FC2Debug.apply = () => {};   // a real reload has no scene to apply
		const app2 = new w.FC2App(root2);
		await app2.ready;
		assert(app2.g.coins === app.g.coins && app2.g.level === app.g.level && app2.g.owned.join() === app.g.owned.join(), 'after a reload the coins, level and unlocked units are all still there');
		const same = [...app.prog].every(([id, u]) => { const v = app2.prog.get(id); return v && v.score === u.score && v.tier === u.tier && v.lastCorrect === u.lastCorrect && v.lastSeen === u.lastSeen; });
		assert(same && app.prog.size > 0, 'after a reload every unit keeps its score, tier, last correct and last seen');
		assert(app2.session.combo === app.session.combo && app2.session.round.n === app.session.round.n, 'after a reload the combo and round progress are still there');
		assert(app2.g.games.numbers === 1 && app2.g.games.numbersBest === app.g.games.numbersBest, 'after a reload the number board unlock and best streak are still there');
		w.localStorage.setItem('kb.fc2.dbg.game', '{not json');
		const before = d.querySelectorAll('#errbox').length;
		new w.FC2App(d.querySelector('#app').cloneNode(true));
		await wait(50);
		w.FC2Debug.apply = applyScene;
		assert(d.querySelectorAll('#errbox').length === 1 && before === 0 && w.localStorage.getItem('kb.fc2.dbg.game.corrupt') === '{not json', 'a corrupt save shows the error panel and keeps a copy of the raw text');
		d.querySelector('#errbox [data-err="dismiss"]').dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
		assert(!d.querySelector('#errbox'), 'the error panel can be dismissed');
		// a stale cached index.html without store.js: the app still starts, and says why reload safety is off
		w.localStorage.removeItem('kb.fc2.dbg.game.corrupt'); w.localStorage.setItem('kb.fc2.dbg.game', JSON.stringify(app.g));
		const store = w.FC2Store; w.FC2Debug.apply = () => {}; delete w.FC2Store;
		const app3 = new w.FC2App(d.querySelector('#app').cloneNode(true));
		await app3.ready; await wait(50);
		w.FC2Store = store; w.FC2Debug.apply = applyScene;
		assert(/store\.js did not load/.test((d.querySelector('#errbox textarea') || {}).value || '') && app3.g, 'a missing store.js shows a clear error but the app still starts');
	});

	await step('unit editor and recovery', async () => {
		const id = app.g.owned[0], ch = (sel, v) => { const el = d.querySelector(sel); el.value = v; el.dispatchEvent(new w.Event('change', { bubbles: true })); };
		app.go('map');
		app.tileModal(id);
		click('[data-act="unit-edit"]');
		assert(d.querySelector('[data-edit="score"]') && d.querySelector('[data-edit="tier"]') && d.querySelector('[data-edit="h"]') && d.querySelectorAll('[data-act="unit-now"]').length === 2, 'Edit values shows a score field, a star dropdown, a harvest field and two Set to now buttons');
		ch('[data-edit="score"]', '7'); ch('[data-edit="tier"]', '2'); ch('[data-edit="h"]', '1');
		app.prog.set(id, { ...app.unitOf(id), lastCorrect: 0, lastSeen: 0 });
		click('[data-act="unit-now"][data-col="lastCorrect"]'); click('[data-act="unit-now"][data-col="lastSeen"]');
		const u = app.unitOf(id), now = Math.floor(Date.now() / 1000);
		assert(u.score === 7 && u.tier === 2 && app.g.h[id] === 1 && Math.abs(u.lastCorrect - now) < 5 && Math.abs(u.lastSeen - now) < 5, 'the editor sets score, star level, harvest count and both timestamps');
		assert(JSON.parse(w.localStorage.getItem('kb.fc2.dbg.prog'))[id][0] === 7, 'an edit is saved to the progress copy immediately');
		ch('[data-edit="score"]', '99');
		assert(app.unitOf(id).score === 10, 'an out-of-range score is clamped');
		app.closeModal();

		// mirror safety: a stale page without store.js must not blank the saved progress, and an empty prog never replaces a non-empty mirror
		const keep = w.localStorage.getItem('kb.fc2.dbg.prog'), St = w.FC2Store;
		delete w.FC2Store; app.writeMirror(); w.FC2Store = St;
		assert(w.localStorage.getItem('kb.fc2.dbg.prog') === keep, 'with store.js missing the progress copy is left untouched');
		const saved = app.prog; app.prog = new Map(); app.writeMirror(); app.prog = saved;
		assert(w.localStorage.getItem('kb.fc2.dbg.prog') === keep, 'an empty progress never replaces a non-empty copy');

		// recovery: lose everything here, find it in the other save (the normal page's namespace) and restore it
		w.localStorage.setItem('kb.fc2.v1.prog', keep);
		app.prog = new Map(); app.dbPacked = {}; app.snaps = [];
		w.localStorage.setItem('kb.fc2.dbg.prog', '{}');
		click('[data-act="tab"][data-tab="menu"]');
		click('[data-act="recover-open"]');
		const rows = d.querySelectorAll('[data-act="recover"]');
		assert(rows.length >= 1 && /normal page/.test(d.querySelector('#modal').textContent), 'the Recovery panel lists the other save');
		click('[data-act="recover"][data-i="0"]');
		const back = app.unitOf(id);
		assert(back.score === 10 && back.tier === 2 && app.g.owned.includes(id), 'Restore brings the unit progress back');
		app.closeModal();
		app.go('map');
	});

	await step('debug pages never save', async () => {
		// Regression: opening ?debug=<scene> staged a fake game and the debug page then saved it over the real progress.
		const writes = [], prog = JSON.stringify({ 5: [7, 2, 100, 100] }), mem = new Map([['kb.fc2.dbg.prog', prog], ['kb.fc2.dbg.game', JSON.stringify({ v: 1, coins: 4242, owned: [5] })]]);
		const dom2 = await JSDOM.fromFile(page, {
			url: require('url').pathToFileURL(page).href + '?debug=harvest-card', runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: new VirtualConsole(),
			beforeParse(w2) {
				Object.defineProperty(w2, 'localStorage', { value: { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => { writes.push(k); mem.set(k, String(v)); }, removeItem: k => mem.delete(k) }, configurable: true, writable: true });
				w2.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => {}, set: () => true });
				w2.SpeechSynthesisUtterance = function(t) { this.text = t; };
				Object.defineProperty(w2, 'speechSynthesis', { value: { speak() {}, cancel() {}, getVoices: () => [] }, configurable: true });
			}
		});
		await new Promise(r => dom2.window.addEventListener('load', r));
		await dom2.window.fc2App.ready;
		const a2 = dom2.window.fc2App;
		a2.save(); a2.flush(); a2.markSeen([a2.g.owned[0]]);
		await wait(450);
		const staged = a2.g.owned.length > 0 && a2.g.coins !== 4242;
		dom2.window.close();
		assert(staged && writes.length === 0 && mem.get('kb.fc2.dbg.prog') === prog, 'a ?debug scene page replaces the game in memory but writes nothing to storage');
	});

	await step('normal page: saved-elsewhere card and damaged database', async () => {
		// The player's real progress ended up in the ?debug save: the normal page must notice and offer it, not show an empty map.
		const rich = {}; for (let i = 0; i < 8; i++) rich[10 + i] = [5, 1, 1000 + i, 1000 + i];
		const mem = new Map([['kb.fc2.dbg.prog', JSON.stringify(rich)], ['kb.fc2.v1.game', JSON.stringify({ v: 1, coins: 7, owned: [10, 11, 12] })]]);
		const dom3 = await JSDOM.fromFile(page, {
			url: require('url').pathToFileURL(page).href, runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: new VirtualConsole(),
			beforeParse(w3) {
				Object.defineProperty(w3, 'localStorage', { value: { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => { mem.set(k, String(v)); }, removeItem: k => mem.delete(k) }, configurable: true, writable: true });
				w3.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => {}, set: () => true });
				w3.SpeechSynthesisUtterance = function(t) { this.text = t; };
				Object.defineProperty(w3, 'speechSynthesis', { value: { speak() {}, cancel() {}, getVoices: () => [] }, configurable: true });
			}
		});
		await new Promise(r => dom3.window.addEventListener('load', r));
		await dom3.window.fc2App.ready;
		const a3 = dom3.window.fc2App, d3 = dom3.window.document;
		const hint = d3.querySelector('.hint-box');
		assert(hint && /8 scored/.test(hint.textContent) && !d3.querySelector('#dbg-badge'), 'the normal page shows a "Found saved progress" card when another copy has far more');
		d3.querySelector('.hint-box [data-act="recover"]').dispatchEvent(new dom3.window.MouseEvent('click', { bubbles: true }));
		assert(a3.unitOf(10).score === 5 && a3.unitOf(17).tier === 1 && !d3.querySelector('.hint-box') && JSON.parse(mem.get('kb.fc2.v1.prog'))[17][0] === 5, 'Restore it brings the units back, hides the card and saves them to the normal save');
		a3.go('menu');
		assert(/Normal page/.test((d3.querySelector('#where-am-i') || {}).textContent || ''), 'the Menu says which page and URL you are on');

		// A database record left damaged by the old bulk-save bug (only lastSeen kept) is healed from the progress copy, and the heal reaches the database whole.
		const wdb = dom3.window, recs = new Map([[20, { unitId: 20, custom: { TimeStampLastSeen: 5000 } }]]);
		wdb.KongbuheyDB = class { async open() {} async loadAllUnitDataIncremental() { return [...recs.values()]; } async saveBulkUnitCellValues(cells) { for (const c of cells) { const r = recs.get(c.unitId) || { unitId: c.unitId, custom: {} }; r.custom[c.colKey] = c.value; recs.set(c.unitId, r); } return true; } };
		mem.set('kb.fc2.v1.prog', JSON.stringify({ 20: [6, 2, 4000, 5000] }));
		const root = d3.querySelector('#app').cloneNode(true);
		const a4 = new wdb.FC2App(root); await a4.ready; await wait(50);
		assert(a4.unitOf(20).score === 6 && a4.unitOf(20).tier === 2 && a4.unitOf(20).lastCorrect === 4000, 'a damaged database record is healed from the progress copy on load');
		const c20 = recs.get(20).custom;
		assert(c20.RecognitionScore === 6 && c20.LongTermRecognition === 'definitionKnown' && c20.TimeStampLastCorrect === 4000 && c20.TimeStampLastSeen === 5000, 'the healed progress is written back to the database in full');
		dom3.window.close();
	});

	await step('noun slot varies', async () => {
		const isNoun = id => (app.units.get(id) || [])[w.DATA_SCHEMA.PartofSpeech] === 'Noun';
		const nounIds = [];
		for (let id = 0; id < 400 && nounIds.length < 40; id++) if (isNoun(id)) nounIds.push(id);
		for (const id of nounIds) if (!app.g.owned.includes(id)) app.g.owned.push(id);
		let built = 0, bad = '', dup = 0;
		for (const id of nounIds) {
			if (built >= 4) break;
			const c = app.generateFor(id), s = c.sentences.find(x => w.FlashcardRender.unitIdsOf(x).includes(id));
			if (!s) continue;
			app.card = { id };
			const ch = app.buildSentenceTest(s, false, id);
			if (!ch) continue;
			built++;
			const wrong = ch.filter(x => !x.ok), mineIds = new Set(w.FlashcardRender.unitIdsOf(s));
			if (wrong.some(x => x.ids.includes(id))) bad = 'a wrong answer still contains the tested noun';
			const repl = wrong.map(x => x.ids.filter(u => isNoun(u) && !mineIds.has(u)).sort().join());
			if (new Set(repl).size !== repl.length && repl.every(Boolean)) dup++;   // rare when the unlocked pool has too little variety
		}
		assert(built >= 1 && !bad && dup <= Math.floor(built / 4), `when the tested unit is a noun, wrong answers swap in different nouns${bad ? ' (' + bad + ')' : ''} (${built} quizzes built, ${dup} with a repeated replacement)`);
	});

	await step('cheat mode, force save, lean backup', async () => {
		app.go('map');
		const id = app.g.owned[1];
		app.prog.set(id, { score: 0, tier: 0, lastCorrect: 0, lastSeen: 0 });
		click('[data-act="cheat-toggle"]');
		assert(app.cheat && d.querySelector('#cheat-min'), 'Cheat mode shows the minutes field');
		click(`.tile[data-id="${id}"]`); click(`.tile[data-id="${id}"]`);
		const u = app.unitOf(id), now = Math.floor(Date.now() / 1000);
		assert(u.score === 2 && Math.abs(u.lastCorrect - now) < 5 && !d.querySelector('#modal:not(.hidden) .unit-en'), 'in cheat mode each tap adds 1 recognition (and stamps a never-answered unit) without opening the unit');
		const typed = d.querySelector('#cheat-min'); typed.value = '90'; typed.dispatchEvent(new w.Event('input', { bubbles: true }));
		app.renderScreen(false);
		assert(d.querySelector('#cheat-min').value === '90', 'the typed minutes survive a map redraw');
		const before = { ...app.unitOf(id) }, other = app.g.owned.find(i => i !== id && app.unitOf(i).lastCorrect);
		const ob = other === undefined ? null : { ...app.unitOf(other) };
		click('[data-act="cheat-mature"]');
		assert(app.unitOf(id).lastCorrect === before.lastCorrect - 5400 && app.unitOf(id).lastSeen === before.lastSeen - 5400 && (!ob || app.unitOf(other).lastCorrect === ob.lastCorrect - 5400), 'Mature all moves every unit\'s timestamps back by the entered minutes');
		assert(JSON.parse(w.localStorage.getItem('kb.fc2.dbg.prog'))[id][2] === app.unitOf(id).lastCorrect, 'maturing is saved immediately');
		click('[data-act="cheat-toggle"]');
		app.go('menu');
		click('[data-act="force-save"]');
		await until(() => /read back|written/.test(d.querySelector('#modal').textContent), 8000);
		assert(/Everything above was written and read back/.test(d.querySelector('#modal').textContent) && !d.querySelector('#modal').textContent.includes('✖'), 'Force save writes everything and reads it back');
		app.closeModal();
		// the database path (jsdom has no IndexedDB): a faithful fake passes, one that silently drops writes is reported
		const makeDb = drop => { const m = new Map(); return { saveBulkUnitCellValues: async cells => { if (!drop) for (const c of cells) m.set(c.unitId, { ...(m.get(c.unitId) || {}), [c.colKey]: c.value }); }, loadAllUnitDataIncremental: async () => [...m].map(([unitId, custom]) => ({ unitId, custom })) }; };
		for (const [drop, label] of [[false, 'a working database reads back'], [true, 'a database that drops writes is reported']]) {
			app.db = makeDb(drop); click('[data-act="force-save"]');
			await until(() => /Everything above|did not save/.test(d.querySelector('#modal').textContent), 8000);
			const text = d.querySelector('#modal').textContent;
			assert(drop ? text.includes('✖') && /did not save/.test(text) : !text.includes('✖'), `force save: ${label}`);
			app.closeModal();
		}
		app.db = null;
		app.flags = [{ ko: 'x', flaggedAt: 'now' }];
		const backup = JSON.parse(app.backupJson());
		assert(!('flags' in backup) && backup.units && backup.game, 'the backup carries progress but no flagged sentences');
		const keep = app.flags;
		app.$('#backup-text') || app.openModal('b', '<textarea id="backup-text"></textarea><p id="backup-msg"></p>');
		d.querySelector('#backup-text').value = JSON.stringify(backup);
		app.restore();
		assert(app.flags === keep, 'restoring a backup without flags leaves your flagged sentences alone');
		app.closeModal();
	});

	await step('debug scenes', async () => {
		const F = w.FC2Debug;
		for (const name of F.names) {
			said.length = 0;
			try { app.debugScene(name); } catch (e) { assert(false, `scene ${name}: threw ${e.message}`); continue; }
			assert(d.querySelector(F.scenes[name].expect), `scene ${name} renders (${F.scenes[name].expect})`);
			if (name === 'trial-listen') assert(app.card.trial.type === 'listen' && app.card.trial.choices.length === 6 && said.at(-1) === app.units.get(app.card.id)[w.DATA_SCHEMA.Korean], 'the listening trial has 6 choices and speaks the unit on its own');
			if (name === 'trial-meaning') assert(app.card.trial.choices.length === 4, 'the meaning trial has 4 choices');
			if (name === 'trial-recall') assert(app.card.trial.type === 'recall' && app.card.trial.choices.length === 6, 'the recall trial has 6 choices');
		}
	});

	await step('generator steering', async () => {
		let rejects = 0, made = 0;
		const bias = { retries: 2, reject: () => { rejects++; return true; } };
		for (let id = 0; id < 40 && !rejects; id++) made += Array.from(w.generateSentencesForUnit(id, 3, { seedOffset: 3, slotBias: bias })).length;
		assert(rejects > 0 && made > 0, 'the slot bias is consulted by the generator and never blocks it');
		let astRejects = 0, astMade = 0;
		const astBias = { retries: 2, reject: () => { astRejects++; return true; } };
		for (let id = 0; id < 40 && !astRejects; id++) { const r = w.generateSentenceForUnit(id, { slotBias: astBias }); if (r) astMade++; }
		assert(astRejects > 0 && astMade > 0, 'the slot bias also steers the fallback (AST) generator without blocking it');
		let preferred = 0, total = 0;
		for (let id = 0; id < 60 && !preferred; id++) {
			const base = Array.from(w.generateSentencesForUnit(id, 1, { seedOffset: 5 }))[0];
			if (!base) continue;
			const ids = w.FlashcardRender.unitIdsOf(base).filter(u => u !== id);
			if (!ids.length) continue;
			const want = new Set([ids[0]]);
			const steered = Array.from(w.generateSentencesForUnit(id, 3, { seedOffset: 11, preferUnitIds: want }));
			total += steered.length; preferred += steered.filter(x => w.FlashcardRender.unitIdsOf(x).includes(ids[0])).length;
		}
		assert(total > 0 && preferred > 0, 'preferred units show up in generated sentences when they fit a slot');
	});

	const real = errors.filter(e => !/concord|Cannot set property window|local[\\/]verified_originals/.test(e));
	assert(real.length === 0, `no script errors during play${real.length ? ': ' + real.slice(0, 3).join(' | ') : ''}`);
	console.log(`\nfc2 UI: ${passed} passed, ${failed} failed`);
	dom.window.close();
	process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
