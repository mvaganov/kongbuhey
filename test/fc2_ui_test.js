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
	const dom = await JSDOM.fromFile(path.join(ROOT, 'fc2', 'index.html'), {
		runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
		beforeParse(w) {
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
		assert(d.querySelectorAll('#tabs .tab').length === 4 && d.querySelector('#screen .play-big, #screen [data-act="tab"]'), 'boots to a Map with four tabs and an empty-state call to action');
	});

	await step('pull', async () => {
		app.go('shop');
		click('[data-act="pull"]');
		assert(app.g.owned.length === G.pullSize(app.g) && app.g.pulls === 1 && app.g.coins === 0, 'the first pull is free and unlocks a pack of units');
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
		assert(showTestable(), 'a fresh pack has at least one unit with a testable example');
		const id = app.card.id, answers = app.g.totals.answers;
		click('[data-act="sent-test"]');
		assert(app.stest && app.stest.choices.length === 4 && app.stest.choices.filter(c => c.ok).length === 1 && d.querySelectorAll('.sent-test .choice').length === 4, 'the test offers 4 translations, one right');
		click(`[data-act="stest-pick"][data-i="${app.stest.choices.findIndex(c => c.ok)}"]`);
		const moved = await until(() => app.card && app.card.id !== id && !app.card.done);
		assert(moved && app.g.totals.answers > answers, 'a right answer credits the units and moves on');
		showTestable();
		const id2 = app.card.id, p2 = app.unitOf(id2).score;
		click('[data-act="sent-test"]');
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
		click('[data-act="sent-test"]');
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
		assert(app.nb.streak === 1 && app.nb.right === 1, 'a correct tap starts a streak');
		await wait(1000);
		const q2 = app.nb.q;
		assert(q2 !== q && app.nb.done === false, 'the next number follows automatically');
		click(`[data-act="nb-pick"][data-v="${q2.n === 1 ? 2 : 1}"]`);
		assert(app.nb.streak === 0 && app.nb.total === 2 && app.g.games.numbersBest === 1, 'a wrong tap resets the streak and keeps the best');
	});

	const real = errors.filter(e => !/concord|Cannot set property window|local[\\/]verified_originals/.test(e));
	assert(real.length === 0, `no script errors during play${real.length ? ': ' + real.slice(0, 3).join(' | ') : ''}`);
	console.log(`\nfc2 UI: ${passed} passed, ${failed} failed`);
	dom.window.close();
	process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
