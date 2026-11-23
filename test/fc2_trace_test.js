#!/usr/bin/env node
/**
 * fc2 effect trace (jsdom): a scripted session through the real fc2 page with a simulated clock, a seeded random and virtual timers.
 * Every effect the view plays (FX calls, toasts, modals) is logged with its virtual time, and the game state is snapshotted after each
 * action. The log must equal test/fc2_trace_golden.json: refactoring the game flow out of fc2/app.js (into fc2/controller.js) must not
 * change what the player sees, in what order, or when.
 *
 *   node test/fc2_trace_test.js            compare with the golden log
 *   node test/fc2_trace_test.js --record   write the golden log from the current code (only for an intended behaviour change)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const GOLDEN = path.join(__dirname, 'fc2_trace_golden.json');

let passed = 0, failed = 0;
const assert = (c, m) => { if (c) { passed++; console.log(`  [PASS] ${m}`); } else { failed++; console.error(`  [FAIL] ${m}`); } };

function mulberry32(a) {
	return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

(async () => {
	console.log('======================================================');
	console.log('        FC2 EFFECT TRACE (jsdom, golden compare)      ');
	console.log('======================================================');
	const { JSDOM, VirtualConsole } = require('jsdom');
	const errors = [];
	const vc = new VirtualConsole();
	vc.on('jsdomError', e => errors.push((e.detail && e.detail.message) || e.message));
	const page = path.join(ROOT, 'fc2', 'index.html');
	const dom = await JSDOM.fromFile(page, {
		url: require('url').pathToFileURL(page).href + '?debug&persist',
		runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
		beforeParse(w) {
			const mem = new Map();
			Object.defineProperty(w, 'localStorage', { value: { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => { mem.set(k, String(v)); }, removeItem: k => mem.delete(k) }, configurable: true, writable: true });
			w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => {}, set: () => true });
			w.SpeechSynthesisUtterance = function(t) { this.text = t; };
			Object.defineProperty(w, 'speechSynthesis', { value: { speak() {}, cancel() {}, getVoices: () => [] }, configurable: true });
		}
	});
	const w = dom.window, d = w.document;
	await new Promise(r => w.addEventListener('load', r));
	await w.fc2App.ready;
	const app = w.fc2App, G = w.FC2Game, T = G.T, FX = w.FC2Fx;
	app.closeModal();

	// ---------- determinism: clock, random, timers, no generation, no background sweeps ----------
	let ms = 1795000000000;
	app.clock.ms = () => ms; app.clock.sec = () => Math.floor(ms / 1000);
	app.rand = mulberry32(42);
	app.syncAvail = () => {};
	app.prefetchSoon = () => {};
	if (app.core) app.core.env.generate = () => []; else app.generateFor = () => ({ sentences: [], msg: '' });
	w.confirm = () => true;
	let vnow = 0, seq = 0, stepStart = 0;
	const timers = new Map();
	w.setTimeout = (fn, delay = 0) => { const id = ++seq; timers.set(id, { at: vnow + (Number(delay) || 0), fn, id }); return id; };
	w.clearTimeout = id => { timers.delete(id); };
	const runTimers = () => {
		for (let guard = 0; timers.size && guard < 20000; guard++) {
			const next = [...timers.values()].sort((a, b) => a.at - b.at || a.id - b.id)[0];
			timers.delete(next.id); vnow = next.at;
			next.fn();
		}
	};

	// ---------- the log ----------
	const log = [];
	const el2s = x => (x && x.nodeType === 1 ? `<${x.tagName.toLowerCase()}${x.id ? '#' + x.id : ''}${x.classList && x.classList.length ? '.' + [...x.classList].join('.') : ''}>` : x);
	const arg = a => (a && a.nodeType === 1 ? el2s(a) : a && typeof a === 'object' && !Array.isArray(a) ? JSON.stringify(Object.fromEntries(Object.entries(a).filter(([k]) => k !== 'colors'))) : JSON.stringify(a));
	for (const name of ['sfx', 'buzz', 'burstAt', 'floatText', 'fly', 'flash', 'banner', 'countUp', 'clear']) {
		FX[name] = (...args) => { log.push(`t+${vnow - stepStart} FX.${name}(${args.map(arg).join(', ')})`); };
	}
	const toast = app.toast.bind(app);
	app.toast = text => { log.push(`t+${vnow - stepStart} toast ${text}`); toast(text); };
	const openModal = app.openModal.bind(app);
	app.openModal = (title, html, cls) => { log.push(`t+${vnow - stepStart} modal ${title}`); openModal(title, html, cls); };

	const snap = () => {
		const g = app.g, s = app.session, k = app.card;
		const prog = [...app.prog.entries()].filter(([id]) => g.owned.includes(id)).sort((a, b) => a[0] - b[0]).map(([id, u]) => `${id}:${u.score}/${u.tier}/${u.lastCorrect}/${u.lastSeen}`);
		return JSON.stringify({ coins: g.coins, xp: g.xp, level: g.level, owned: g.owned, h: g.h, up: g.up, totals: g.totals, streak: g.streak, seals: g.seals, games: g.games, quests: g.quests && g.quests.list.map(q => [q.k, q.have, q.claimed]),
			cos: g.cos, session: { n: s.n, combo: s.combo, last: s.last, due: [...s.due], round: s.round, front: s.front }, card: k && { id: k.id, mode: k.mode, side: k.side, st: k.st, trial: k.trial && k.trial.choices.map(c => c.id) }, prog });
	};
	const action = (name, fn) => {
		stepStart = vnow;
		log.push(`== ${name}`);
		try { fn(); runTimers(); } catch (e) { log.push(`!! ${name} threw ${e.message}`); }
		log.push(`state ${snap()}`);
	};
	const el = () => d.querySelector('#card') || d.body;

	// ---------- the scripted session ----------
	action('fresh game', () => { app.g = G.blankGame(app.clock.sec()); app.prog = new Map(); app.session = app.newSession(); app.card = null; app.save(); });
	action('free pull', () => { app.go('shop'); app.pull(); });
	const core = new Set(app.g.owned.filter(id => { const u = app.units.get(id); return u[w.DATA_SCHEMA.SemanticData] && u[w.DATA_SCHEMA.SemanticData].alwaysUnlocked; }));
	const o = app.g.owned.filter(id => !core.has(id));
	const now = app.clock.sec();
	action('stage unit states', () => {
		app.prog.set(o[0], { score: 1, tier: 0, lastCorrect: 0, lastSeen: now - 100 });                                         // learning
		app.prog.set(o[1], { score: 3, tier: 0, lastCorrect: now - T.INTERVAL[0] - 60, lastSeen: now - T.INTERVAL[0] - 60 });     // ripe at ☆: a trial
		app.prog.set(o[2], { score: 4, tier: 1, lastCorrect: now - T.INTERVAL[1] - 60, lastSeen: now - T.INTERVAL[1] - 60 });     // ripe at ★: a harvest
		app.prog.set(o[3], { score: 4, tier: 1, lastCorrect: now - T.INTERVAL[1] * T.WILT_AFTER - 60, lastSeen: now - 9e5 });     // wilted
		app.prog.set(o[4], { score: 3, tier: 2, lastCorrect: now - T.INTERVAL[2] - 60, lastSeen: now - T.INTERVAL[2] - 60 }); app.g.h[o[4]] = T.HARVESTS_TO_PROMOTE[2] - 1;   // ripe at ★★, trial next
		app.save();
	});
	action('open play', () => { app.go('play'); });
	const scores = [1, 2, -1, 0, -2, 1, 1, 2];
	let trialRight = true;
	for (let i = 0; i < 14; i++) {
		const k = app.card;
		if (!k) break;
		if (k.mode === 'trial') {
			const right = k.trial.choices.findIndex(c => c.id === k.id), pick = trialRight ? right : (right + 1) % k.trial.choices.length;
			action(`card ${i}: trial ${trialRight ? 'right' : 'wrong'}`, () => { app.choose(pick, el()); });
			trialRight = !trialRight;
			action(`card ${i}: continue`, () => { app.act('continue', el()); });
		} else {
			const v = scores[i % scores.length];
			action(`card ${i}: flip + score ${v}`, () => { app.flip(); app.score(v, el()); });
		}
		ms += 7000;   // seven seconds per card: not swift
		if (app.modalHidden && !app.modalHidden()) action(`card ${i}: close modal`, () => { app.act('next-round', el()); });
	}
	action('sentence test right', () => { if (!app.card) app.pickCard(); app.sentenceSettle({ ko: '테스트 문장', enNatural: 'test sentence', unitIds: [o[0], o[2], o[5]] }, true); });
	action('sentence test wrong', () => { if (!app.card) app.pickCard(); app.sentenceSettle({ ko: '테스트 문장', enNatural: 'test sentence', unitIds: [o[0]] }, false); });
	ms += 3 * 3600 * 1000;
	action('collect after 3 h', () => { app.go('map'); app.collect(d.body); });
	action('upgrade', () => { app.g.coins += 5000; app.go('shop'); app.upgrade(Object.keys(T.UPGRADES)[0], d.body); });
	action('cosmetic', () => { app.cosmetic('theme', 'jade', d.body); });
	action('claim quest 0 and chest', () => { app.ensureQuests(); app.claim(0, d.body); app.claim(-1, d.body); });
	action('number board', () => { app.nbBuy(d.body); const q = app.nb.q.n; app.nbPick(q, d.body); app.nbPick(app.nb.q.n === 0 ? 1 : 0, d.body); });
	action('second pull', () => { app.g.coins += 5000; app.closeModal(); app.go('shop'); app.pull(); });
	action('ascend', () => { app.closeModal(); for (const id of app.g.owned.slice(0, T.SEAL_MIN + 2)) app.prog.set(id, { ...app.unitOf(id), tier: Math.max(1, app.unitOf(id).tier) }); app.ascend(); });

	const out = { note: 'Written by node test/fc2_trace_test.js --record. Do not edit by hand.', trace: log };
	if (process.argv.includes('--record')) {
		fs.writeFileSync(GOLDEN, JSON.stringify(out, null, 1) + '\n');
		console.log(`  recorded ${log.length} lines -> ${path.relative(ROOT, GOLDEN)}`);
	} else {
		const golden = JSON.parse(fs.readFileSync(GOLDEN, 'utf8')).trace;
		const at = log.findIndex((l, i) => l !== golden[i]);
		const same = at < 0 && log.length === golden.length;
		assert(log.length > 100 && log.some(l => l.includes('FX.banner')) && log.some(l => l.startsWith('t+') && l.includes('modal Round')), `the scripted session covers banners and a round end (${log.length} lines)`);
		assert(same, same ? `effects and state match the golden trace (${log.length} lines)`
			: `first difference at line ${at < 0 ? Math.min(log.length, golden.length) : at}:\n      now:    ${String(log[at < 0 ? golden.length : at]).slice(0, 300)}\n      golden: ${String(golden[at < 0 ? log.length : at]).slice(0, 300)}`);
	}
	assert(!log.some(l => l.startsWith('!!')), `no action threw${log.filter(l => l.startsWith('!!')).slice(0, 2).map(l => ': ' + l).join('')}`);
	assert(errors.length === 0, `no page errors${errors.length ? ': ' + errors.slice(0, 2).join(' | ') : ''}`);
	console.log(`\nfc2 trace: ${passed} passed, ${failed} failed`);
	process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
