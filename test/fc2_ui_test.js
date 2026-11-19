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
		url: require('url').pathToFileURL(page).href + '?debug',   // debug mode: its own storage namespace, and the scene list
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
