/**
 * fc2/debug.js - "fc2/index.html?debug=<scene>" opens the game in a ready-made state (a ripe listening trial, the sentence
 * test, the number board...) so a screen can be checked in seconds instead of after two days of play. "?debug" lists the scenes.
 * A ?debug page NEVER SAVES (scenes replace the whole game, so saving would overwrite your progress with the staged state). It reads the
 * kb.fc2.dbg.* namespace but writes nothing and never touches the unit database. Tests add &persist to exercise saving.
 * test/fc2_ui_test.js runs every scene too, so this is the one place that knows how to reach each screen.
 * Adding a screen worth checking? Add a scene here with an `expect` selector; the UI test then covers it for free.
 */
(function() {
'use strict';

const G = window.FC2Game, T = G.T;
const now = () => Math.floor(Date.now() / 1000);

function reset(app, coins = 500) {
	app.g = G.blankGame(now()); app.g.coins = coins;
	app.prog = new Map(); app.session = app.newSession(); app.card = null; app.stest = null; app.nb = null;
	app.opts = { ...app.opts, reverse: false };
	app.closeModal(); app.applyCosmetics();
}
/** Unlock the first n units in course order (deterministic). */
const own = (app, n) => { const ids = G.pickPull(app.pullCandidates(), n, () => 0); app.g.owned.push(...ids); return ids; };
/** Give a unit a tier and score, last answered `hours` ago (default: just ripe), with h harvests banked toward the next star. */
function setUnit(app, id, tier, h = 0, hours = null, score = T.ESTABLISHED) {
	const t = now() - Math.round((hours === null ? T.INTERVAL[tier] / 3600 + 0.2 : hours) * 3600);
	app.prog.set(id, { score, tier, lastCorrect: t, lastSeen: t });
	if (h) app.g.h[id] = h; else delete app.g.h[id];
}
function show(app, tab) {
	app.tab = tab;
	if (tab === 'play' && !app.card) app.pickCard();
	app.render();
	if (tab === 'play') app.maybeSpeak('front');
}
/** A learn card whose first example can build a comprehension test (a testable example is moved to the front). */
function testableCard(app, rev) {
	app.opts = { ...app.opts, reverse: rev };
	for (const id of app.g.owned) {
		const c = app.generateFor(id);
		if (!c.sentences.length) continue;
		app.card = { id };
		// Any example will do (verified ones without an English frame have no test): move the first testable one to the front.
		const at = c.sentences.findIndex(s => app.buildSentenceTest(s, rev));
		if (at < 0) continue;
		if (at > 0) c.sentences.unshift(...c.sentences.splice(at, 1));
		app.card = { id, mode: 'learn', st: 'new', side: 'front', shownAt: Date.now(), trial: null, ...c };
		return true;
	}
	app.card = null;
	return false;
}
const trial = tier => app => {
	reset(app); const [id] = own(app, 6);
	setUnit(app, id, tier, T.HARVESTS_TO_PROMOTE[tier] - 1);
	app.session.front.push(id);
	show(app, 'play');
};
const sentence = (rev, open) => app => {
	reset(app); own(app, 12);
	if (!testableCard(app, rev)) { show(app, 'map'); app.toast('debug: no testable example in this pack'); return; }
	show(app, 'play');
	if (open) app.sentenceTest(0);
};

const scenes = {
	'fresh': { desc: 'Empty game, 500 냥: the first free pull', expect: '.pull-btn', setup(app) { reset(app); show(app, 'shop'); } },
	'map': { desc: 'Map with new, learning, growing, ripe and wilted units', expect: '.tile', setup(app) {
		reset(app); const ids = own(app, 12);
		setUnit(app, ids[0], 1, 0, 1); setUnit(app, ids[1], 2, 0, 5); setUnit(app, ids[2], 0, 0, 5); setUnit(app, ids[3], 0, 0, 13);
		setUnit(app, ids[4], 0, 0, 1, 1); setUnit(app, ids[5], 1, 1);
		show(app, 'map');
	} },
	'learn-card': { desc: 'A new unit card (front)', expect: '.k-learn', setup(app) { reset(app); own(app, 6); show(app, 'play'); } },
	'harvest-card': { desc: 'A ripe ★ unit: self-scored harvest', expect: '.k-harvest', setup(app) { reset(app); const [id] = own(app, 6); setUnit(app, id, 1, 0); app.session.front.push(id); show(app, 'play'); } },
	'trial-meaning': { desc: '☆ → ★ trial: see the Korean, pick the meaning (4)', expect: '.k-trial .choice', setup: trial(0) },
	'trial-listen': { desc: '★ → ★★ trial: hear the Korean, pick the meaning (6)', expect: '.k-trial .listen', setup: trial(1) },
	'trial-recall': { desc: '★★ → ★★★ trial: see the meaning, pick the Korean (6)', expect: '.k-trial .choices.ko, .k-trial .choice', setup: trial(2) },
	'sentence-card': { desc: 'A card with 🎯 test buttons on its examples', expect: '[data-act="sent-test"]', setup: sentence(false, false) },
	'sentence-test': { desc: 'Sentence test: Korean enlarged, 4 English choices', expect: '.sent-test .choice', setup: sentence(false, true) },
	'sentence-test-reverse': { desc: 'Reverse sentence test: English enlarged, 4 Korean choices', expect: '.sent-test .choices.ko', setup: sentence(true, true) },
	'numbers': { desc: 'Number sound board, unlocked', expect: '[data-act="nb-pick"]', setup(app) { reset(app, 100); app.g.games = { numbers: 1 }; show(app, 'shop'); app.nbOpen(); } },
	'error-box': { desc: 'The copyable error panel, with a sample error', expect: '#errbox textarea', setup(app) { reset(app); show(app, 'map'); window.fc2ReportError('Debug sample (not a real error)', new Error('Sample error text to copy and paste')); } },
	'shop': { desc: '3000 냥 and 30 units: the full shop', expect: '[data-act="upgrade"]', setup(app) { reset(app, 3000); own(app, 30); show(app, 'shop'); } },
	'ascend': { desc: 'Enough stars banked to ascend', expect: '[data-act="ascend"]:not([disabled])', setup(app) { reset(app); own(app, 12).forEach(id => setUnit(app, id, 1, 0, 1)); show(app, 'shop'); } },
	'levelup': { desc: 'One answer away from a level up', expect: '.k-learn', setup(app) { reset(app); own(app, 6); app.g.xp = G.xpToNext(1) - 1; show(app, 'play'); } },
	'names': { desc: 'Menu > Names in examples: course names to tick, your own names to add', expect: '[data-name-id]', setup(app) { reset(app); show(app, 'menu'); app.act('names-open'); } }
};

function list(app) {
	app.openModal('Debug scenes', `<p class="muted">Open <code>?debug=name</code>. Progress is kept apart from your real game.</p><ul class="dbg-list">${
		Object.entries(scenes).map(([k, s]) => `<li><a href="?debug=${k}"><b>${k}</b></a> <small class="muted">${s.desc}</small></li>`).join('')}</ul>`);
}

function apply(app, name) {
	const scene = scenes[name];
	if (scene) scene.setup(app); else { reset(app); show(app, 'map'); list(app); }
	if (typeof document !== 'undefined' && !document.getElementById('dbg-badge')) {   // shown for the scene list too: you always know you are on a debug page
		const b = document.createElement('a');
		b.id = 'dbg-badge'; b.href = '?debug'; b.textContent = 'DEBUG: ' + (scene ? name : 'scene list') + (/[?&]persist\b/.test(location.search) ? '' : ' - nothing is saved');
		b.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:99;font:bold 13px monospace;color:#fff;background:#c0392b;padding:4px 8px;text-align:center;text-decoration:none';
		document.body.appendChild(b);
	}
}

window.FC2Debug = { scenes, apply, names: Object.keys(scenes) };
})();
