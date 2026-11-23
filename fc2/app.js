/**
 * fc2/app.js - the fc2 study game UI: Map (collection + hive), Play (card rounds), Shop (pulls, upgrades, cosmetics), Menu.
 * Rules live in game.js, effects in fx.js. Unit progress (RecognitionScore, LongTermRecognition, TimeStampLastCorrect,
 * TimeStampLastSeen, notes) is written to the webapp's unit store (webapp/db.js) so the Language Units Spreadsheet shows it.
 * Game-only state (coins, xp, owned units, upgrades, cosmetics) lives in localStorage under "kb.fc2.v1.*".
 */
(function() {
'use strict';

const G = window.FC2Game, FX = window.FC2Fx, R = window.FlashcardRender, T = G.T;
const { escapeHtml } = R;
const C = window.DATA_SCHEMA;
// ?debug[=scene]: see fc2/debug.js. Debug mode keeps its own localStorage namespace and skips the unit database.
const DEBUG = typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('debug');
const LS = DEBUG === null ? 'kb.fc2.v1.' : 'kb.fc2.dbg.', OLD = 'kb.fc.v1.';
// ?debug scenes REPLACE the whole save (coins, units, progress) with a staged state, so a ?debug page must never write anything:
// otherwise opening a scene silently overwrites whatever was saved under the debug namespace. Tests add &persist to exercise saving.
const EPHEMERAL = DEBUG !== null && !(typeof location !== 'undefined' && new URLSearchParams(location.search).has('persist'));
const SCORES = [[-2, 'Very hard'], [-1, 'Missed it'], [0, 'Needs practice'], [1, 'Correct'], [2, 'Easy']];
const SCORE_HUE = { '-2': 0, '-1': 22, 0: 48, 1: 95, 2: 135 };
const STARS = ['☆', '★', '★★', '★★★'], RARITY = ['N', 'R', 'SR', 'SSR'];
const TIER_LABEL = ['Unknown', 'Recognized', 'Definition known', 'Known by definition'];
const STATUS_LABEL = { new: '✨ New', learning: '🌱 Learning', growing: '🌿 Growing', ripe: '🌾 Ripe', wilted: '🥀 Wilted', dormant: '💤 Dormant' };
const THEMES = { midnight: ['Midnight', 0], jade: ['Jade', 300], sunset: ['Sunset', 800], neon: ['Neon', 2000] };
const PARTICLES = { sparks: ['Sparks', 0], stars: ['Stars', 250], petals: ['Petals', 600], hangul: ['Hangul burst', 1200] };
const SPEAK_MODES = [['none', "Don't speak"], ['front', 'When the front is shown'], ['back', 'When the back is shown'], ['both', 'Front and back']];
const DEFAULT_OPTS = { reverse: false, speak: 'front', count: 3, onlyOwned: true, v: 2, sound: true, haptics: true, audioTrials: true, names: { off: [], custom: [] } };
const nowSec = () => Math.floor(Date.now() / 1000);
const fmt = n => Math.round(n).toLocaleString();
const dur = s => s < 90 ? `${Math.max(1, Math.round(s))}s` : s < 5400 ? `${Math.round(s / 60)}m` : s < 129600 ? `${Math.round(s / 3600)}h` : `${Math.round(s / 86400)}d`;
const hangulOf = text => String(text).replace(/[^가-힣]/g, '');

// A big error panel with copyable text: storage and load problems must never be silent.
const errorLog = [];
/** "build 15c20d95 · 2026-11-19 19:51" from version.js (written by tools/stamp.js); local time. */
function buildLabel() {
	const v = window.FC2Version;
	if (!v) return 'build unknown (version.js did not load)';
	const t = new Date(v.built), p = n => String(n).padStart(2, '0');
	return `build ${v.hash} · ${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())} ${p(t.getHours())}:${p(t.getMinutes())}`;
}

function reportError(where, err) {
	const text = `${where}: ${err && err.stack ? err.stack : (err && err.message) || String(err)}`;
	if (errorLog.some(e => e.text === text)) { errorLog.find(e => e.text === text).n++; } else errorLog.push({ text, at: new Date().toISOString(), n: 1 });
	if (typeof document === 'undefined' || !document.body) return;
	let box = document.getElementById('errbox');
	if (!box) {
		box = document.createElement('div');
		box.id = 'errbox';
		box.innerHTML = '<h2>⚠ Something went wrong</h2><p>Your progress may not be saved. Copy this text and send it along:</p><textarea readonly rows="9"></textarea><div class="btn-row"><button type="button" class="btn primary" data-err="copy">Copy</button><button type="button" class="btn" data-err="dismiss">Dismiss</button></div><small id="errmsg"></small>';
		box.addEventListener('click', ev => {
			const act = ev.target.getAttribute && ev.target.getAttribute('data-err'), ta = box.querySelector('textarea');
			if (act === 'dismiss') { errorLog.length = 0; box.remove(); } else if (act === 'copy') {
				ta.focus(); ta.select();
				const done = ok => { box.querySelector('#errmsg').textContent = ok ? 'Copied.' : 'Select the text and copy it by hand.'; };
				if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(() => done(true), () => done(document.execCommand && document.execCommand('copy')));
				else done(document.execCommand && document.execCommand('copy'));
			}
		});
		document.body.appendChild(box);
	}
	box.querySelector('textarea').value = errorLog.map(e => `[${e.at}]${e.n > 1 ? ' x' + e.n : ''} ${e.text}`).join('\n\n') + `\n\n${buildLabel()}\n${navigator.userAgent}\n${location.href}`;
}
window.fc2ReportError = reportError;
window.addEventListener('error', ev => { if (!/Cannot set property window/.test(ev.message || '')) reportError('Uncaught error', ev.error || ev.message); });
window.addEventListener('unhandledrejection', ev => reportError('Unhandled promise rejection', ev.reason));

// store.js holds the reload-safety logic. A phone can hold a stale cached index.html (no store.js tag) next to a fresh app.js: say so loudly
// and keep playing without the localStorage mirror instead of failing to start.
const NO_BACKUP = () => { throw new Error('backup needs store.js, which did not load: reload the page'); };
const NO_STORE = { packProg: () => ({}), mergeProg: prog => ({ prog, healed: [] }), packSession: () => null, unpackSession: () => null, packBackup: NO_BACKUP, unpackBackup: NO_BACKUP };
let storeWarned = false;
function store() {
	if (window.FC2Store) return window.FC2Store;
	if (!storeWarned) { storeWarned = true; reportError('Reload safety is off', new Error('store.js did not load, so index.html is probably an old cached copy. Progress is still saved to the unit database, but not mirrored. Reload the page (or clear this site\'s cache) to fix it.')); }
	return NO_STORE;
}

const ls = {
	get(key, fallback) {
		let raw = null;
		try { raw = window.localStorage.getItem(key); } catch (e) { reportError(`Reading saved data (${key}) failed`, e); return fallback; }
		if (raw == null) return fallback;
		try { return JSON.parse(raw); } catch (e) {
			// Never let a corrupt save be silently replaced by a fresh game: keep the raw text and say so.
			if (!EPHEMERAL) try { window.localStorage.setItem(key + '.corrupt', raw); } catch (_) { /* nothing more to do */ }
			reportError(`Saved data (${key}) is unreadable; a copy was kept as ${key}.corrupt`, e);
			return fallback;
		}
	},
	set(key, value) { if (EPHEMERAL) return true; try { window.localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { reportError(`Saving (${key}) failed`, e); return false; } }
};

class FC2App {
	constructor(root) {
		this.root = root;
		// Time and randomness of the game flow. tools/fc2_sim.js (via the controller) swaps in a simulated clock and a seeded random.
		this.clock = { sec: nowSec, ms: () => Date.now(), day: (offset = 0) => { const d = new Date(this.clock.ms() + offset * 864e5); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; } };
		this.rand = Math.random;
		// Custom names (Menu > Names) become runtime units before anything reads the unit list; changes apply on the next load.
		this.customNameIds = this.injectCustomNames((ls.get(LS + 'opts', {}) || {}).names);
		// Merged duplicates (alias rows, tools/merge_units.js) are not playable units; their saved state folds into the canonical unit in init().
		this.alias = window.buildAliasMap ? window.buildAliasMap(window.KR_EN_languageUnits) : new Map();
		this.units = new Map(window.KR_EN_languageUnits.filter(u => !this.alias.has(u[C.Id])).map(u => [u[C.Id], u]));
		// The game state and flow live in controller.js (FC2Core, shared with tools/fc2_sim.js); this class is the view. A stale cached
		// index.html can lack the controller.js tag: say so loudly instead of failing silently.
		if (!window.FC2Controller) {
			reportError('Reload needed', new Error('controller.js did not load, so index.html is probably an old cached copy. Reload the page (or clear this site\'s cache).'));
			throw new Error('fc2: controller.js is missing');
		}
		this.core = new window.FC2Controller.FC2Core({
			units: this.units, C, clock: this.clock, random: () => this.rand(),
			generate: (id, n, options) => window.generateSentencesForUnit(id, n, options),
			templateIds: () => (window.FC2Queue && window.getAllVerifiedSentences ? this.vqIds() : null),
			canSpeak: () => 'speechSynthesis' in window,
			persist: { game: () => this.save(), unit: id => this.saveUnit(id), cell: (id, col, value) => this.saveCell(id, col, value) },
			onSentences: (id, sentences) => this.prefetchSoon(id, sentences)
		});
		this.prog = new Map();   // id -> { score, tier, lastCorrect, lastSeen }
		this.notes = {};
		const savedOpts = ls.get(LS + 'opts', {});
		if (savedOpts.v !== 2) { savedOpts.onlyOwned = true; savedOpts.v = 2; }   // v2: examples from unlocked units only is the default
		this.opts = { ...DEFAULT_OPTS, ...savedOpts };
		this.flags = ls.get(LS + 'flags', []);
		this.tab = 'map';
		this.card = null;
		this.session = this.newSession();
		this.editingNotes = false;
		this.pullPack = '';
		this.cheat = false; this.cheatMinutes = '60';   // run-time only
		this.bind();
		this.ready = this.init();
	}

	// State lives in the controller (this.core); these keep the view's reads and writes unchanged.
	get g() { return this.core.g; } set g(v) { this.core.g = v; }
	get prog() { return this.core.prog; } set prog(v) { this.core.prog = v; }
	get session() { return this.core.session; } set session(v) { this.core.session = v; }
	get card() { return this.core.card; } set card(v) { this.core.card = v; }
	get opts() { return this.core.opts; } set opts(v) { this.core.opts = v; }
	get notes() { return this.core.notes; } set notes(v) { this.core.notes = v; }
	get recent() { return this.core.recent; } set recent(v) { this.core.recent = v; }
	get nameRows() { return this.core.nameRows; }

	newSession() { return this.core.newSession(); }
	newRound() { return this.core.newRound(); }

	// ---------- storage ----------
	async init() {
		let records = [];
		if (DEBUG === null) {
			try {
				this.db = new window.KongbuheyDB(); await this.db.open(); records = await this.db.loadAllUnitDataIncremental();
				if (this.db.useMemoryFallback) reportError('Unit database unavailable', new Error('IndexedDB is not available in this browser: unit progress is kept in this browser\'s local storage only and will not show in the spreadsheet.'));
			} catch (e) { this.db = null; reportError('Unit database failed to open', e); }
		}
		const damaged = new Set();
		for (const rec of records) {
			const c = rec.custom || {};
			if (!this.units.has(rec.unitId) && !this.alias.has(rec.unitId)) continue;
			if (c.RecognitionScore === undefined || c.LongTermRecognition === undefined || c.TimeStampLastCorrect === undefined) damaged.add(this.alias.has(rec.unitId) ? this.alias.get(rec.unitId) : rec.unitId);   // an old bulk-save bug kept only the last cell
			this.prog.set(rec.unitId, { score: Number(c.RecognitionScore) || 0, tier: G.tierIndex(c.LongTermRecognition),
				lastCorrect: Number(c.TimeStampLastCorrect) || 0, lastSeen: Number(c.TimeStampLastSeen) || 0 });
			if (c.notes) this.notes[rec.unitId] = String(c.notes);
		}
		const fold = store().foldAliases || (st => ({ ...st, prog: new Map(st.prog), moved: [] }));
		const notesBefore = { ...this.notes };
		const folded = fold({ prog: this.prog, mirror: ls.get(LS + 'prog', {}), notes: this.notes, owned: [] }, this.alias);
		this.prog = folded.prog; this.notes = folded.notes;
		this.dbPacked = Object.fromEntries([...this.prog].map(([id, u]) => [id, [u.score, u.tier, u.lastCorrect, u.lastSeen]]));   // what the database held, for the Recovery panel
		this.snaps = ls.get(LS + 'snaps', []) || [];
		// The localStorage mirror wins a unit when strictly newer than the database copy, or when the database record lacks progress columns.
		const merged = store().mergeProg(this.prog, folded.mirror, id => this.units.has(id), damaged);
		this.prog = merged.prog;
		let g = ls.get(LS + 'game', null);
		if (!g || g.v !== 1) g = DEBUG === null ? this.migrate() : G.blankGame(this.clock.sec());
		const blank = G.blankGame(this.clock.sec());
		this.g = { ...blank, ...g, cos: { ...blank.cos, ...g.cos }, totals: { ...blank.totals, ...g.totals } };
		this.g.owned = fold({ prog: [], owned: this.g.owned }, this.alias).owned.filter(id => this.units.has(id));
		this.ensureCoreUnlocked();
		for (const id of new Set([...merged.healed, ...folded.moved])) this.saveUnit(id);
		for (const [id, text] of Object.entries(this.notes)) if (text !== notesBefore[id]) this.saveCell(Number(id), 'notes', text);
		const sess = store().unpackSession(ls.get(LS + 'session', null), this.clock.sec(), 3 * 3600);
		if (sess) this.session = { ...this.newSession(), ...sess, round: sess.round || this.newRound() };
		this.applyCosmetics();
		this.findRecoverable();
		this.render();
		if (DEBUG !== null) this.debugScene(DEBUG);
		setInterval(() => { if (this.tab === 'map' && this.modalHidden() && !this.cheat) this.renderScreen(false); }, 15000);
	}

	/** First launch: adopt scores, timestamps, notes and flags from flashcards/ (kb.fc.v1.*). Scored cards start owned. */
	migrate() {
		const now = this.clock.sec(), g = G.blankGame(now);
		const deck = ls.get(OLD + 'deck', null), stats = ls.get(OLD + 'stats', {}) || {}, notes = ls.get(OLD + 'notes', {}) || {};
		const scores = deck && deck.scores ? (Array.isArray(deck.scores) ? deck.scores : Object.entries(deck.scores)) : [];
		for (const [k, raw] of scores) {
			const id = Number(k), sc = Number(raw) || 0, st = stats[id] || {};
			if (!this.units.has(id) || (!sc && !st.correct)) continue;
			g.owned.push(id);
			const cur = this.prog.get(id);
			if (cur && (cur.score || cur.lastSeen)) continue;
			// Established cards start growing now (ripe in one interval) instead of arriving wilted.
			this.prog.set(id, { score: G.clamp(sc), tier: 0, lastCorrect: sc >= T.ESTABLISHED ? now : (st.correct || 0), lastSeen: st.seen || st.correct || now });
			this.saveUnit(id);
		}
		for (const [k, text] of Object.entries(notes)) {
			const id = Number(k);
			if (text && this.units.has(id) && !this.notes[id]) { this.notes[id] = String(text); this.saveCell(id, 'notes', this.notes[id]); }
		}
		if (!this.flags.length) { this.flags = ls.get(OLD + 'flags', []) || []; ls.set(LS + 'flags', this.flags); }
		g.owned.sort((a, b) => G.packRank(this.units.get(a)[C.Source]) - G.packRank(this.units.get(b)[C.Source]) || a - b);
		g.migrated = g.owned.length;
		ls.set(LS + 'game', g);
		return g;
	}

	save() { this.ensureCoreUnlocked(); this.syncAvail(); ls.set(LS + 'game', this.g); if (window.FC2Store) ls.set(LS + 'session', window.FC2Store.packSession(this.session, this.clock.sec())); else store(); this.queueMirror(); }
	/** Write the progress mirror soon (debounced); flush() writes everything now (page hide, tab switch). */
	queueMirror() { if (this.mirrorTimer) return; this.mirrorTimer = setTimeout(() => { this.mirrorTimer = null; this.writeMirror(); }, 250); }
	/**
	 * Mirror of unit progress + rolling snapshots. Never writes when store.js is missing (a stub must not blank a good mirror), and never
	 * replaces a non-empty mirror with an empty one.
	 */
	writeMirror() {
		if (!window.FC2Store) { store(); return; }
		const St = window.FC2Store, packed = St.packProg(this.prog);
		if (!Object.keys(packed).length) { const old = ls.get(LS + 'prog', {}); if (old && Object.keys(old).length) return; }
		ls.set(LS + 'prog', packed);
		const next = St.addSnapshot(this.snaps, packed, this.clock.sec());
		if (next.length !== this.snaps.length || next.some((x, i) => x !== this.snaps[i])) {
			for (const sn of next) if (!this.snaps.includes(sn) && this.g) sn.game = JSON.parse(JSON.stringify(this.g));   // new snapshot: keep coins, level, unlocks, upgrades too
			this.snaps = next; ls.set(LS + 'snaps', next);
		}
	}
	flush() {
		if (!this.g) return;
		if (this.mirrorTimer) { clearTimeout(this.mirrorTimer); this.mirrorTimer = null; }
		this.writeMirror(); ls.set(LS + 'game', this.g);
		if (window.FC2Store) ls.set(LS + 'session', window.FC2Store.packSession(this.session, this.clock.sec()));
	}
	debugScene(name) { if (DEBUG === null) throw new Error('debug scenes need ?debug in the URL'); this.debug = name; window.FC2Debug.apply(this, name); }
	unitOf(id) { return this.core.unitOf(id); }
	saveCell(id, colKey, value) { this.queueMirror(); if (this.db) this.db.saveBulkUnitCellValues([{ unitId: id, colKey, value }]).catch(e => reportError('Saving unit data failed', e)); }
	saveUnit(id) {
		this.queueMirror();
		if (!this.db) return;
		const u = this.unitOf(id);
		this.db.saveBulkUnitCellValues([['RecognitionScore', u.score], ['LongTermRecognition', T.TIERS[u.tier]], ['TimeStampLastCorrect', u.lastCorrect],
			['TimeStampLastSeen', u.lastSeen]].map(([colKey, value]) => ({ unitId: id, colKey, value }))).catch(e => reportError('Saving unit progress failed', e));
	}
	/** Write several units' progress to the unit database in one call; resolves true when it worked (or there is no database). */
	saveUnits(ids) {
		this.queueMirror();
		if (!this.db) return Promise.resolve(true);
		const cells = [];
		for (const id of ids) { const u = this.unitOf(id); for (const [colKey, value] of [['RecognitionScore', u.score], ['LongTermRecognition', T.TIERS[u.tier]], ['TimeStampLastCorrect', u.lastCorrect], ['TimeStampLastSeen', u.lastSeen]]) cells.push({ unitId: id, colKey, value }); }
		return this.db.saveBulkUnitCellValues(cells).then(() => true, e => { reportError('Saving unit progress failed', e); return false; });
	}

	markSeen(ids) { this.core.markSeen(ids); }
	classify() { return this.core.classify(); }
	counts(st) { return this.core.counts(st); }
	applyCosmetics() {
		document.body.dataset.theme = this.g.cos.theme;
		Object.assign(FX.opts, { sound: this.opts.sound, haptics: this.opts.haptics, particle: this.g.cos.particle });
	}
	glyphsFor(id) { return this.g.cos.particle === 'hangul' ? Array.from(hangulOf(this.units.get(id)[C.Korean]) || '한') : undefined; }
	$(sel) { return this.root.querySelector(sel); }
	modalHidden() { return this.$('#modal').classList.contains('hidden'); }

	// ---------- shell ----------
	render() { this.renderHud(); this.renderTabs(); this.renderScreen(true); }

	renderHud() {
		const g = this.g, need = G.xpToNext(g.level);
		this.$('#hud').innerHTML = `<div class="lvl"><b id="lvl">Lv ${g.level}</b><div class="bar"><i id="xpbar" style="width:${Math.round(100 * g.xp / need)}%"></i></div><small id="xptxt">${g.xp}/${need}</small></div>
			<div class="streak" title="Day streak bonus">🔥 ${g.streak.n}</div>
			<div class="coins"><i class="coin"></i><span id="coins" data-n="${g.coins}">${fmt(g.coins)}</span><small>냥</small></div>`;
	}

	updateHud() {
		const g = this.g, need = G.xpToNext(g.level);
		this.$('#lvl').textContent = `Lv ${g.level}`;
		this.$('#xpbar').style.width = Math.round(100 * g.xp / need) + '%';
		this.$('#xptxt').textContent = `${g.xp}/${need}`;
		this.$('.streak').textContent = `🔥 ${g.streak.n}`;
		FX.countUp(this.$('#coins'), g.coins);
	}

	renderTabs() {
		const c = this.counts(), due = c.ripe + c.wilted, qs = this.g.quests;
		const claim = qs ? qs.list.filter(q => !q.claimed && q.have >= q.need).length + (!qs.bonus && qs.list.every(q => q.claimed) ? 1 : 0) : 0;
		const tab = (id, icon, label, badge = '') => `<button type="button" class="tab${this.tab === id ? ' on' : ''}" data-act="tab" data-tab="${id}"><span>${icon}</span>${label}${badge}</button>`;
		this.$('#tabs').innerHTML = tab('map', '🗺', 'Map', claim ? `<em>${claim}</em>` : '') + tab('play', '▶', 'Play', due ? `<em>${due}</em>` : '') + tab('shop', '🛒', 'Shop') + tab('menu', '☰', 'Menu');
	}

	go(tab) {
		if (tab !== 'play' && this.tab === 'play') this.session.combo = 0;
		this.tab = tab;
		FX.clear();   // a burst left mid-flight must not survive a screen change
		this.ensureQuests();
		if (tab === 'play' && !this.card) this.pickCard();
		this.renderTabs();
		this.renderScreen(true);
		FX.sfx('tap');
		if (tab === 'play') this.maybeSpeak('front');
	}

	renderScreen(animate) {
		const el = this.$('#screen'), y = el.scrollTop;
		el.className = 'tab-' + this.tab;
		el.innerHTML = this.tab === 'map' ? this.mapHtml() : this.tab === 'play' ? this.playHtml() : this.tab === 'shop' ? this.shopHtml() : this.menuHtml();
		if (animate) { el.classList.add('enter'); el.scrollTop = 0; } else el.scrollTop = y;
	}

	toast(text) {
		let el = document.getElementById('toast');
		if (!el) { el = document.createElement('div'); el.id = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
		el.textContent = text;
		el.classList.add('show');
		clearTimeout(this.toastTimer);
		this.toastTimer = setTimeout(() => el.classList.remove('show'), 2000);
	}

	// ---------- map ----------
	packsShown() {
		const owned = new Set(this.g.owned), packs = new Map();
		for (const u of this.playableUnits()) {
			const p = String(u[C.Source]);
			if (!packs.has(p)) packs.set(p, { name: p, ids: [], owned: 0 });
			const e = packs.get(p);
			e.ids.push(u[C.Id]);
			if (owned.has(u[C.Id])) e.owned++;
		}
		const all = [...packs.values()].sort((a, b) => G.packRank(a.name) - G.packRank(b.name));
		const next = all.find(p => p.owned < p.ids.length);
		return { all, shown: all.filter(p => p.owned > 0 || p === next), next };
	}

	goalsHtml(c) {
		const g = this.g, now = this.clock.sec(), chips = [`Lv ${g.level + 1} in ${G.xpToNext(g.level) - g.xp} XP`], cost = G.pullCost(g);
		chips.push(cost <= g.coins ? `<b>Pull ready${cost ? '' : ' (free)'}</b>` : `Pull in ${fmt(cost - g.coins)} 냥`);
		let best = null, soon = Infinity;
		for (const id of g.owned) {
			const u = this.unitOf(id);
			if (u.score < T.ESTABLISHED) continue;
			if (G.status(u, now) === 'growing') soon = Math.min(soon, u.lastCorrect + T.INTERVAL[u.tier] - now);
			const left = u.tier < 3 ? T.HARVESTS_TO_PROMOTE[u.tier] - (g.h[id] || 0) : 99;
			if (left < 99 && (!best || left < best.left)) best = { id, left, tier: u.tier };
		}
		if (best) chips.push(`${escapeHtml(this.units.get(best.id)[C.Korean])} → ${STARS[best.tier + 1]} in ${best.left} harvest${best.left > 1 ? 's' : ''}`);
		if (c.growing) chips.push(`Next ripe in ${dur(soon)}`);
		return `<div class="goals">${chips.map(t => `<span>${t}</span>`).join('')}</div>`;
	}

	mapHtml() {
		this.ensureQuests();
		const g = this.g, now = this.clock.sec(), st = this.classify(), c = this.counts(st);
		const trials = g.owned.filter(id => G.isTrial(this.unitOf(id), g.h[id] || 0, st.get(id))).length;
		const idle = G.idleEarned(g, this.prog, now), rate = G.idleRate(g, this.prog, now);
		const full = now >= g.lastCollect + G.offlineCapH(g) * G.HOUR;
		const waiting = [[trials, '⚔ trials'], [c.ripe, '🌾 ripe'], [c.wilted, '🥀 wilted'], [c.dormant, '💤 dormant'], [c.learning, '🌱 learning'], [c.new, '✨ new']].filter(x => x[0]).map(x => `${x[0]} ${x[1]}`).join(' · ');
		const { shown } = this.packsShown(), owned = new Set(g.owned);
		const tile = id => {
			if (!owned.has(id)) return `<button type="button" class="tile locked" data-act="tile" data-id="${id}">·</button>`;
			const u = this.units.get(id), ko = escapeHtml(Array.from(hangulOf(u[C.Korean]) || String(u[C.Korean])).slice(0, 2).join(''));
			const p = this.unitOf(id), s = st.get(id), fill = s === 'growing' ? Math.round(G.ripeness(p, now) * 100) : (s === 'learning' ? Math.round(100 * Math.max(0, p.score) / T.ESTABLISHED) : 0);
			return `<button type="button" class="tile s-${s} r${G.rarity(u[C.PriorityScore])}${G.isTrial(p, g.h[id] || 0, s) ? ' trial' : ''}" data-act="tile" data-id="${id}"><i style="height:${fill}%"></i><span>${ko}</span>${p.tier ? `<em>${STARS[p.tier]}</em>` : ''}</button>`;
		};
		const packs = shown.map(p => {
			const stars = p.ids.reduce((n, id) => n + (owned.has(id) ? this.unitOf(id).tier : 0), 0), max = p.ids.length * 3;
			return `<section class="pack"><header><b>${escapeHtml(p.name)}</b><span>${p.owned}/${p.ids.length} · ${stars}/${max}★</span></header>
				<div class="bar thin"><i style="width:${Math.round(100 * stars / max)}%"></i></div><div class="tiles">${p.ids.map(tile).join('')}</div></section>`;
		}).join('');
		return `${this.recoverHintHtml()}<section class="hive${idle ? ' has' : ''}"><div><b>Hive</b><small>+${fmt(rate)} 냥/h from ${c.growing} growing${full && idle ? ' · <u>store full</u>' : ''}</small></div>
				<button type="button" class="btn gold" data-act="collect" ${idle ? '' : 'disabled'}>Collect <span id="idle">${fmt(idle)}</span></button></section>
			<button type="button" class="play-big${c.ripe + c.wilted ? ' due' : ''}" data-act="tab" data-tab="play"><b>▶ Play</b><small>${waiting || (g.owned.length ? 'Practice, or pull new units' : 'Start with a free pull in the Shop')}</small></button>
			${this.goalsHtml(c)}
			${this.cheatHtml()}
			${(g.games || {}).numbers ? '<button type="button" class="btn wide" data-act="nb-open">🔊 Number sound board</button>' : ''}
			${g.owned.length ? this.questsHtml() : ''}
			${g.owned.length ? '' : '<p class="muted center">Your map is empty. The first pull is free.</p><button type="button" class="btn primary wide" data-act="tab" data-tab="shop">🛒 Open the Shop</button>'}
			${packs}<p class="legend">${Object.values(STATUS_LABEL).join(' · ')}</p>`;
	}

	// ---------- cheat mode (map): tap units to add recognition, and age every unit to fast-forward ripeness ----------
	cheatHtml() {
		const on = this.cheat;
		return `<section class="panel cheat"><button type="button" class="btn wide${on ? ' primary' : ''}" data-act="cheat-toggle">🛠 Cheat mode: ${on ? 'ON (tap a unit: +1 recognition)' : 'off'}</button>
			${on ? `<p class="muted">A tap adds 1 to the unit's score (max ${T.MAX_SCORE}); a unit never answered gets "last correct" = now, so it turns green. Maturing moves every unit's TimeStampLastCorrect and TimeStampLastSeen back, so growing units ripen sooner.</p>
				<label class="row">Mature by <input type="text" inputmode="numeric" id="cheat-min" data-cheat-min value="${escapeHtml(this.cheatMinutes)}" size="6"> minutes <button type="button" class="btn" data-act="cheat-mature">Mature all</button></label>` : ''}</section>`;
	}

	cheatTap(id) {
		if (!this.g.owned.includes(id)) { this.toast('Locked unit'); FX.sfx('deny'); return; }
		const p = { ...this.unitOf(id) }, now = this.clock.sec();
		p.score = Math.min(T.MAX_SCORE, p.score + 1);
		if (!p.lastCorrect) p.lastCorrect = now;
		if (!p.lastSeen) p.lastSeen = now;
		this.prog.set(id, p);
		this.saveUnits([id]); this.save();
		FX.sfx('tap');
		this.renderScreen(false);
		this.toast(`${this.units.get(id)[C.Korean]}: score ${p.score}`);
	}

	matureAll(minutes) {
		const secs = Math.round(Number(minutes) * 60);
		if (!(secs > 0)) { this.toast('Enter a number of minutes'); return; }
		const ids = [];
		for (const [id, u] of this.prog) {
			if (!u.lastCorrect && !u.lastSeen) continue;
			this.prog.set(id, { ...u, lastCorrect: u.lastCorrect ? u.lastCorrect - secs : 0, lastSeen: u.lastSeen ? u.lastSeen - secs : 0 });
			ids.push(id);
		}
		this.saveUnits(ids); this.save(); this.flush();
		this.renderScreen(false);
		this.toast(`Matured ${ids.length} units by ${minutes} min`);
	}

	collect(el) {
		const n = this.core.collect();
		if (!n) return;
		FX.sfx('coin'); FX.buzz(20); FX.fly(el, this.$('#coins'), Math.min(12, 3 + Math.floor(n / 10))); FX.floatText(el, `+${fmt(n)}`, 'gold'); FX.burstAt(el, { count: 24 });
		this.updateHud();
		this.renderScreen(false);
	}

	tileModal(id, edit = false) {
		const u = this.units.get(id);
		if (!this.g.owned.includes(id)) { this.toast(`Locked · ${u[C.Source]} · unlock with pulls`); FX.sfx('deny'); return; }
		const p = this.unitOf(id), now = this.clock.sec(), s = this.classify().get(id), I = T.INTERVAL[p.tier], rar = G.rarity(u[C.PriorityScore]);
		const when = s === 'growing' ? `Ripe in ${dur(p.lastCorrect + I - now)}` : s === 'ripe' ? `Wilts in ${dur(p.lastCorrect + I * T.WILT_AFTER - now)}` : (s === 'wilted' ? 'A miss now costs a star' : '');
		const row = (k, v) => `<tr><th>${k}</th><td>${v}</td></tr>`;
		this.openModal(`${u[C.Korean]}`, `<div class="unit-en">${escapeHtml(u[C.English])}</div>
			<p class="pill-row"><span class="pill">${STATUS_LABEL[s]}</span><span class="pill">${STARS[p.tier]} ${TIER_LABEL[p.tier]}</span><span class="pill r${rar}">${RARITY[rar]}</span><span class="pill">${escapeHtml(u[C.Source])}</span></p>
			${when ? `<p class="muted">${when}</p>` : ''}
			${edit ? this.unitEditHtml(id, p, s, row) : `<table class="kv">${row('RecognitionScore', `${p.score}${G.decay(p, now) ? ` (effective ${G.effectiveScore(p, now)})` : ''}`)}${row('LongTermRecognition', T.TIERS[p.tier])}
			${row('Harvests to next star', p.tier < 3 && p.score >= T.ESTABLISHED ? `${this.g.h[id] || 0}/${T.HARVESTS_TO_PROMOTE[p.tier]}` : '-')}
			${row('TimeStampLastCorrect', R.ago(p.lastCorrect))}${row('TimeStampLastSeen', R.ago(p.lastSeen))}${row('Idle income', s === 'growing' ? `${T.IDLE_RATE[p.tier]} 냥/h` : '0')}</table>`}
			<div class="btn-row"><button type="button" class="btn primary" data-act="review" data-id="${id}">Review now</button>
				<button type="button" class="btn" data-act="unit-edit" data-id="${id}" data-on="${edit ? 0 : 1}">${edit ? 'Done editing' : '🛠 Edit values'}</button></div>`);
	}

	/** Debug editor for one unit: type the score, pick the star level, set the harvest count, stamp "now" on either timestamp. */
	unitEditHtml(id, p, s, row) {
		const need = p.tier < 3 ? T.HARVESTS_TO_PROMOTE[p.tier] : 0;
		return `<table class="kv edit">
			${row('RecognitionScore', `<input type="number" inputmode="numeric" min="${T.MIN_SCORE}" max="${T.MAX_SCORE}" step="1" value="${p.score}" data-edit="score" data-id="${id}">`)}
			${row('LongTermRecognition', `<select data-edit="tier" data-id="${id}">${T.TIERS.map((t, i) => `<option value="${i}" ${i === p.tier ? 'selected' : ''}>${t}</option>`).join('')}</select>`)}
			${row('Harvests to next star', `<input type="number" inputmode="numeric" min="0" max="${Math.max(need, 0)}" step="1" value="${this.g.h[id] || 0}" data-edit="h" data-id="${id}"> / ${need || '-'}`)}
			${row('TimeStampLastCorrect', `${R.ago(p.lastCorrect)} <button type="button" class="btn" data-act="unit-now" data-id="${id}" data-col="lastCorrect">Set to now</button>`)}
			${row('TimeStampLastSeen', `${R.ago(p.lastSeen)} <button type="button" class="btn" data-act="unit-now" data-id="${id}" data-col="lastSeen">Set to now</button>`)}
			${row('Idle income', `${s === 'growing' ? `${T.IDLE_RATE[p.tier]} 냥/h` : '0'} (read only)`)}</table>
			<p class="muted">Score is ${T.MIN_SCORE} to ${T.MAX_SCORE}; 3+ counts as established. <b>Harvests to next star</b>: harvests of this unit while ripe at its current star; reaching the number after the slash (and score 3+) earns the next star. Count harvests first, then the star level. <b>Idle income</b> is not stored: it is worked out from the star level (${T.IDLE_RATE.join(' / ')} 냥/h) while the unit is growing, so there is nothing to edit. A unit looks green (growing) when its score is 3+ and TimeStampLastCorrect is recent: set it to now.</p>`;
	}

	applyUnitEdit(id, field, value) {
		const p = { ...this.unitOf(id) }, n = Math.round(Number(value));
		if (!Number.isFinite(n)) return;
		if (field === 'score') p.score = Math.max(T.MIN_SCORE, Math.min(T.MAX_SCORE, n));
		else if (field === 'tier') p.tier = Math.max(0, Math.min(T.TIERS.length - 1, n));
		else if (field === 'h') this.g.h[id] = Math.max(0, n);
		else if (field === 'lastCorrect' || field === 'lastSeen') p[field] = this.clock.sec();
		else return;
		this.prog.set(id, p);
		this.saveUnit(id); this.save(); this.flush();
		this.updateHud(); this.renderScreen(false); this.tileModal(id, true);
	}

	// ---------- play ----------
	pickCard() {
		this.editingNotes = false;
		this.core.pickCard();
	}

	// G.sentenceOptions (game.js) is shared with tools/save_inspect.js, which replays a save's generation.
	genOptions(targetId = null) { return this.core.genOptions(targetId); }

	// ---------- personal names (Menu > Names) ----------
	/** Runtime units for the player's custom names (data.js addLearningUnit appends them after the data's units). Returns their ids. */
	injectCustomNames(namesOpt) {
		if (typeof window.addLearningUnit !== 'function' || !G.customNameRow) return [];
		return G.normalizeNames(namesOpt).custom.map(c => { const row = G.customNameRow(c, C); window.addLearningUnit(row); return row[C.Id]; });
	}
	/** Units that can be pulled, owned and shown: everything except runtime custom names. */
	playableUnits() { return this.core.playableUnits(); }

	namesHtml(msg = '') {
		const nm = G.normalizeNames(this.opts.names), off = new Set(nm.off);
		const course = this.nameRows.filter(u => u[C.Source] !== G.CUSTOM_NAME_SOURCE).map(u => `<label class="row"><input type="checkbox" data-name-id="${u[C.Id]}" ${off.has(u[C.Id]) ? '' : 'checked'}> ${escapeHtml(u[C.Korean])} <small class="muted">${escapeHtml(u[C.English])}</small></label>`).join('');
		const mine = nm.custom.map((c, i) => `<div class="row">${escapeHtml(c.ko)} <small class="muted">${escapeHtml(c.en)}</small> <button type="button" class="btn small" data-act="name-rm" data-i="${i}">✕ Remove</button></div>`).join('') || '<p class="muted">None yet.</p>';
		return `<p class="muted">The names example sentences use with 씨 and wherever a person's name fits. Names on this list are usable before you unlock them; unticked ones are never used.</p>
			<h3>From the course</h3><div class="names-list">${course}</div>
			<h3>Your names</h3><div class="names-list">${mine}</div>
			<div class="row"><input id="name-ko" placeholder="Korean (민지)" maxlength="12"> <input id="name-en" placeholder="English (Minji)" maxlength="30"> <button type="button" class="btn" data-act="name-add">Add</button></div>
			<p id="names-msg" class="muted">${escapeHtml(msg)}</p>${this.namesDirty ? '<div class="btn-row"><button type="button" class="btn" data-act="reload">Reload to use your names</button></div>' : ''}`;
	}
	namesRefresh(msg) { const b = this.$('#modal .modal-body'); if (b) b.innerHTML = this.namesHtml(msg); }
	namesSave(nm) { this.opts.names = nm; ls.set(LS + 'opts', this.opts); }
	nameToggle(id, on) {
		const nm = G.normalizeNames(this.opts.names);
		nm.off = on ? nm.off.filter(x => x !== id) : [...nm.off, id];
		this.namesSave(nm);
	}
	nameAdd() {
		const ko = (this.$('#name-ko') || {}).value || '', en = (this.$('#name-en') || {}).value || '';
		const nm = G.normalizeNames(this.opts.names), before = nm.custom.length;
		const clean = G.normalizeNames({ off: nm.off, custom: [...nm.custom, { ko, en }] });
		if (clean.custom.length === before) { this.namesRefresh('Type the name in Korean and in English (and not one you already added).'); return; }
		if (this.nameRows.some(u => u[C.Korean] === ko.trim() && u[C.Source] !== G.CUSTOM_NAME_SOURCE)) { this.namesRefresh(`${ko.trim()} is already a course name: tick it above.`); return; }
		this.namesSave(clean); this.namesDirty = true;
		this.namesRefresh(`Added ${ko.trim()}. It is used after a reload.`);
	}
	nameRemove(i) {
		const nm = G.normalizeNames(this.opts.names), [gone] = nm.custom.splice(i, 1);
		this.namesSave(nm); this.namesDirty = true;
		this.namesRefresh(gone ? `Removed ${gone.ko}. Reload to stop using it.` : '');
	}

	/** Units marked SemanticData.alwaysUnlocked (core grammar such as ~아요, ~습니다, 은/는) are always unlocked. */
	ensureCoreUnlocked() { if (this.core) this.core.ensureCoreUnlocked(); }

	// ---------- verified-sentence queue ("time to use it"): the front of the queue is generated first; a generated template goes to the back ----------
	vqIds() { const V = window.verifiedSentenceGenerator; return (V && V.getVerifiedTemplatesShared ? V.getVerifiedTemplatesShared() : window.getAllVerifiedSentences()).map(t => t.id); }

	/**
	 * Keep the generator's availability cache in step with the unlocked units. The cache catches up exactly whenever it is read; this
	 * only starts a background sweep (6 ms slices, 40 ms apart) so the catching-up for every locked sentence is spread over time after an unlock.
	 */
	syncAvail() {
		const V = window.verifiedSentenceGenerator;
		if (!V || !V.syncOwnedUnits || !this.g) return;
		try { if (V.syncOwnedUnits(this.g.owned)) this.availPump(); } catch (e) { reportError('availability cache', e); }
	}

	availPump() {
		const V = window.verifiedSentenceGenerator;
		if (!V || !V.availabilityStep || this.availTimer) return;
		const run = () => {
			this.availTimer = null;
			let more = false;
			try { more = V.availabilityStep(6); } catch (e) { reportError('availability sweep', e); }
			if (more) this.availTimer = setTimeout(run, 40);
		};
		this.availTimer = setTimeout(run, 300);
	}

	vqUsed(sentences) { this.core.vqUsed(sentences); }

	/** Verified sentences that fit the unit: ones the owned units can build first, then ones that still need an unlock; each group in queue order. */
	vqRows() {
		const rank = window.FC2Queue.rankMap(this.g.vq, this.vqIds());
		return window.listVerifiedFitsForUnit(this.vqUnit, this.g.owned)
			.sort((a, b) => (a.missing.length > 0) - (b.missing.length > 0) || rank.get(a.templateId) - rank.get(b.templateId));
	}

	vqChip(id, cls = '') {
		const u = this.units.get(id);
		return u ? `<span class="vq-chip ${cls}">${escapeHtml(u[C.Korean])}<small>${escapeHtml(u[C.English])}</small></span>` : '';
	}

	/** Two or more missing units. Grammar has no chip in the sentence row, so it is listed here (a phone cannot show a hover title);
	 * missing words are already red in the row, so they are counted. */
	vqNeedsMany(miss) {
		const grammar = miss.filter(x => x.slotIndex === null), words = miss.length - grammar.length;
		const more = words ? ` <small class="vq-alt">+ ${words} red word${words > 1 ? 's' : ''}</small>` : '';
		return `<span class="vq-lock many">🔒 needs ${grammar.map(x => this.vqChip(x.unitId, 'need')).join('')}${grammar.length ? more : `${words} red words`}</span>`;
	}

	vqHtml() {
		const rows = this.vqRows();
		if (!rows.length) return '<p class="muted">No verified sentence uses this unit. Its examples come from the generator.</p>';
		const body = rows.map((r, i) => {
			const miss = r.missing, missAt = new Set(miss.map(x => x.slotIndex).filter(x => x !== null));
			const status = !miss.length ? '<span class="vq-ok">✓ ready</span>'
				: miss.length === 1 ? `<span class="vq-lock">🔒 needs ${this.vqChip(miss[0].unitId, 'need')}${miss[0].pool > 1 ? `<small class="vq-alt">or any of ${miss[0].pool - 1} more</small>` : ''}</span>`
				: this.vqNeedsMany(miss);
			const chips = r.slots.map(s => this.vqChip(s.unitId, s.role === 'target' ? 'tgt' : missAt.has(s.index) ? 'need' : '')).join('');
			return `<li class="vq-row${miss.length ? ' locked' : ''}" data-tid="${escapeHtml(r.templateId)}"><span class="vq-grip" aria-label="Drag to reorder" title="Drag to reorder">⠿</span>
				<div class="vq-main"><div class="vq-title"><b>${i + 1}</b> ${escapeHtml(r.ko || r.title)}</div><div class="vq-chips">${chips}</div><div class="vq-status">${status}</div></div>
				<div class="vq-btns"><button type="button" class="btn small" data-act="vq-front" data-tid="${escapeHtml(r.templateId)}">⇧ Front</button><button type="button" class="btn small" data-act="vq-back" data-tid="${escapeHtml(r.templateId)}">⇩ Back</button></div></li>`;
		}).join('');
		const ready = rows.filter(r => !r.missing.length).length;
		return `<p class="muted">${ready} ready, ${rows.length - ready} locked. Top of the list is used first; a sentence goes to the back after it is generated. Drag ⠿ or use the buttons.</p><ol class="vq-list">${body}</ol>`;
	}

	vqOpen() {
		if (!this.card || !window.listVerifiedFitsForUnit || !window.FC2Queue) return;
		this.vqUnit = this.card.id;
		this.openModal(`Sentence queue: ${this.units.get(this.vqUnit)[C.Korean]}`, this.vqHtml(), 'vq');
	}

	vqRefresh() {
		const body = this.$('#modal .modal-body');
		if (!body || this.vqUnit == null) return;
		const y = body.scrollTop;
		body.innerHTML = this.vqHtml();
		body.scrollTop = y;
	}

	/** how: 'front' | 'back' | 'near' (before ref, or after it when after is true). */
	vqMove(tid, how, ref = null, after = false) {
		const Q = window.FC2Queue, ids = this.vqIds(), q = this.g.vq;
		this.g.vq = how === 'front' ? Q.toFront(q, ids, tid) : how === 'back' ? Q.toBack(q, ids, tid) : Q.moveNear(q, ids, tid, ref, after);
		this.save();
		this.vqRefresh();
	}

	/** Touch-friendly drag of a queue row by its grip (HTML5 drag-and-drop does not work on phones). */
	vqDrag(ev) {
		let d = this.vqD;
		const clear = () => this.root.querySelectorAll('.vq-row.drop-before, .vq-row.drop-after').forEach(r => r.classList.remove('drop-before', 'drop-after'));
		if (ev.type === 'pointerdown') {
			const grip = ev.target.closest && ev.target.closest('.vq-grip');
			if (!grip) return;
			const row = grip.closest('.vq-row');
			d = this.vqD = { tid: row.dataset.tid, row, target: null, after: false };
			row.classList.add('dragging');
			try { grip.setPointerCapture(ev.pointerId); } catch (_) { /* no capture: moves still reach the root */ }
			ev.preventDefault();
		} else if (!d) {
			return;
		} else if (ev.type === 'pointermove') {
			const over = document.elementFromPoint(ev.clientX, ev.clientY), row = over && over.closest && over.closest('.vq-row');
			clear();
			d.target = null;
			if (row && row !== d.row) {
				const r = row.getBoundingClientRect();
				d.target = row.dataset.tid; d.after = ev.clientY > r.top + r.height / 2;
				row.classList.add(d.after ? 'drop-after' : 'drop-before');
			}
			const body = this.$('#modal .modal-body');
			if (body) { const b = body.getBoundingClientRect(); if (ev.clientY < b.top + 40) body.scrollTop -= 14; else if (ev.clientY > b.bottom - 40) body.scrollTop += 14; }
		} else {   // pointerup / pointercancel
			clear();
			d.row.classList.remove('dragging');
			this.vqD = null;
			if (ev.type === 'pointerup' && d.target) this.vqMove(d.tid, 'near', d.target, d.after);
		}
	}

	generateFor(id) { return this.core.generateFor(id); }

	/** Building a quiz generates dozens of candidate sentences (~0.3 s). Do it in idle gaps while the card is read, one sentence at a time. */
	prefetchSoon(id, sentences) {
		const todo = sentences.slice();
		const step = () => {
			if (!this.card || this.card.id !== id || this.stest) return;
			const s = todo.shift();
			if (!s) return;
			const rev = this.opts.reverse, key = `${rev}|${this.g.owned.length}`;
			if (!(s.preTest && s.preTest.key === key)) { try { s.preTest = { key, choices: this.buildSentenceTest(s, rev, id) }; } catch (_) { /* built on tap instead */ } }
			setTimeout(step, 80);
		};
		setTimeout(step, 250);
	}

	maybeSpeak(side) {
		const m = this.opts.speak, k = this.card;
		if (!k || k.side !== side) return;
		const t = k.mode === 'trial' && !k.done ? k.trial.type : '';   // a listening trial always speaks; a recall trial never gives the Korean away
		if (t === 'recall' || (t !== 'listen' && (m === 'none' || (m !== 'both' && m !== side) || (side === 'front' && this.opts.reverse && !t)))) return;
		window.speakKorean(this.units.get(this.card.id)[C.Korean]);
	}

	speakBtn(act, extra = '') { return `<button type="button" class="icon-btn speak" data-act="${act}" ${extra} aria-label="Speak">🔊</button>`; }
	isFlagged(ko) { return this.flags.some(f => f.ko === ko); }

	sentencesHtml(o) {
		const k = this.card;
		if (!k.sentences.length) return `<p class="muted">${escapeHtml(k.msg)}</p>`;
		return '<ul class="sentences">' + k.sentences.map((s, i) => `<li class="sentence"><div class="s-body">
			${o.hideKo ? '' : `<div class="s-ko">${R.sentenceHtml(s, k.id)}</div>`}
			${o.english || o.hideKo ? `<div class="s-en-lit">${escapeHtml(s.enLiteral)}</div><div class="s-en">${escapeHtml(s.enNatural || s.en)}</div>` : ''}</div>
			<div class="s-actions">${o.hideKo ? '' : this.speakBtn('speak-sent', `data-i="${i}"`)}
			${o.test ? `<button type="button" class="icon-btn test" data-act="sent-test" data-i="${i}" aria-label="Test my comprehension of this sentence">🎯</button>` : ''}
			<button type="button" class="icon-btn flag${this.isFlagged(s.ko) ? ' flagged' : ''}" data-act="flag" data-i="${i}" aria-label="Flag bad sentence">⚑</button></div></li>`).join('') + '</ul>';
	}

	notesHtml(id) {
		const notes = this.notes[id] || '';
		const body = this.editingNotes ? `<textarea class="notes-edit" data-notes rows="5" placeholder="Markdown notes…">${escapeHtml(notes)}</textarea>`
			: (notes.trim() ? `<div class="notes-md">${window.renderMarkdownWithHtml(notes)}</div>` : '<p class="muted">No notes yet.</p>');
		return `<section class="notes"><div class="notes-head"><h2>Notes</h2><button type="button" class="btn small" data-act="notes-toggle">${this.editingNotes ? 'Done' : 'Edit'}</button></div>${body}</section>`;
	}

	cardHtml() {
		const k = this.card, u = this.units.get(k.id), p = this.unitOf(k.id), rev = this.opts.reverse, rar = G.rarity(u[C.PriorityScore]);
		const head = `<div class="card-tags"><span class="pill r${rar}">${RARITY[rar]}</span><span class="pill">${STARS[p.tier]}</span><span class="pill">${escapeHtml(u[C.Source])}</span></div>`;
		const regen = '<div class="regen-row"><button type="button" class="btn ghost" data-act="regen">↻ New examples</button><button type="button" class="btn ghost" data-act="vq-open" aria-label="Sentence queue" title="Which verified sentences fit this unit, and in what order they come up">☰ Queue</button></div>';
		if (k.mode === 'trial' && k.side === 'front') return this.trialHtml();
		const verdict = k.mode !== 'trial' ? '' : k.passed ? `<div class="verdict pass">⚔ Trial passed: ${STARS[p.tier]} ${TIER_LABEL[p.tier]}</div>`
			: '<div class="verdict fail">⚔ Not yet. Relearn it now; the trial returns the next time it is ripe.</div>';
		if (k.side === 'front') {
			const main = rev ? `<h1 class="unit-main english">${escapeHtml(u[C.English])}</h1>${u[C.Disambiguation] ? `<div class="gloss">${escapeHtml(u[C.Disambiguation])}</div>` : ''}`
				: `<div class="unit-row"><h1 class="unit-main">${escapeHtml(u[C.Korean])}</h1>${this.speakBtn('speak-unit')}</div>`;
			return `${head}${main}${this.sentencesHtml({ hideKo: rev, test: true })}${regen}<p class="hint">Tap the card to reveal · 🎯 tests a sentence</p>`;
		}
		return `${verdict}${head}<div class="unit-row"><h1 class="unit-main">${escapeHtml(u[C.Korean])}</h1>${this.speakBtn('speak-unit')}</div>
			<div class="unit-en">${escapeHtml(u[C.English])}</div>
			<div class="gloss">${escapeHtml(u[C.PartofSpeech] || '')}${u[C.Disambiguation] ? ' · ' + escapeHtml(u[C.Disambiguation]) : ''}</div>
			${this.sentencesHtml({ english: true })}${regen}${this.notesHtml(k.id)}`;
	}

	playHtml() {
		const s = this.session, k = this.card;
		if (!k) return '<div class="empty"><h2>Nothing to study yet</h2><p class="muted">Pull your first units in the Shop. The first pull is free.</p><button type="button" class="btn primary wide" data-act="tab" data-tab="shop">🛒 Open the Shop</button></div>';
		const p = this.unitOf(k.id), cap = G.comboCap(this.g), combo = Math.min(s.combo, cap);
		const mode = k.mode === 'trial' ? '<span class="mode m-trial">⚔ Trial</span>' : k.mode === 'harvest' ? `<span class="mode m-harvest">${STATUS_LABEL[k.st]} · ${T.HARVEST_PAY[p.tier]} 냥</span>`
			: k.mode === 'learn' ? `<span class="mode m-learn">🌱 Learning ${Math.max(0, p.score)}/${T.ESTABLISHED}</span>` : '<span class="mode m-practice">Practice · nothing ripe</span>';
		const pips = Array.from({ length: T.ROUND }, (_, i) => `<i class="${i < s.round.n ? 'on' : ''}"></i>`).join('');
		const scorebar = k.mode === 'trial' ? (k.side === 'back' ? '<nav class="scorebar one"><button type="button" class="btn primary wide" data-act="continue">Continue ▶</button></nav>' : '') : k.side === 'back' ? `<nav class="scorebar">${SCORES.map(([v, label]) => `<button type="button" class="score" data-act="score" data-v="${v}" style="--h:${SCORE_HUE[v]}"><b>${v > 0 ? '+' : ''}${v}</b>${label}</button>`).join('')}</nav>` : '';
		return `<div class="playbar">${mode}<div class="pips">${pips}</div><span class="combo${combo >= cap ? ' max' : ''}" id="combo">x${combo}<small>+${Math.round(combo * T.COMBO_STEP * 100)}%</small></span></div>
			<article class="card ${k.side} k-${k.mode}" id="card">${this.cardHtml()}</article>${scorebar}`;
	}

	flip() {
		if (!this.core.flip()) return;
		this.renderScreen(false);
		this.$('#card').classList.add('flip');
		FX.sfx('flip');
		this.maybeSpeak('back');
	}

	showNextCard() {
		const el = this.$('#card');
		const swap = () => {
			this.pickCard(); this.renderTabs(); this.renderScreen(false);
			const c = this.$('#card');
			if (c) c.classList.add('in');
			this.$('#screen').scrollTop = 0;
			if (this.tab === 'play') this.maybeSpeak('front');
		};
		if (!el) { swap(); return; }
		el.classList.add('out');
		setTimeout(swap, 140);
	}

	score(v, el) {
		const r = this.core.answerSelf(v);
		if (!r) return;
		this.advance(this.settleEffects(r, v, el));
	}

	/** A trial choice was tapped: objective pass or fail, then the back of the card stays up until Continue. */
	choose(i, el) {
		const k = this.card, r = this.core.answerTrial(i);
		if (!r) return;
		this.root.querySelectorAll('#card .choice').forEach((b, j) => { b.disabled = true; if (k.trial.choices[j].id === k.id) b.classList.add('right'); else if (j === i) b.classList.add('wrong'); });
		this.settleEffects(r, k.passed ? 1 : -1, el);
		setTimeout(() => { if (this.card !== k) return; this.renderScreen(false); const c = this.$('#card'); if (c) c.classList.add('flip'); this.$('#screen').scrollTop = 0; this.maybeSpeak('back'); }, k.passed ? 650 : 900);
	}

	advance(delay) {
		if (this.core.roundDone()) setTimeout(() => this.roundResults(), delay + 350);
		else setTimeout(() => this.showNextCard(), delay || 120);
	}

	ensureQuests() { this.core.ensureQuests(); }

	/** Effects for a booked answer (r from core.settle): coins flying, sounds, banners, toasts. Returns the ms to wait before moving on. */
	settleEffects(r, v, el) {
		const g = this.g, ev = r.ev, passed = r.passed, coins = r.coins, crit = r.crit, swift = r.swift, ups = r.ups;
		const ko = this.units.get(r.id)[C.Korean], glyphs = this.glyphsFor(r.id);
		FX.floatText(el, `+${fmt(coins)}${crit ? ' CRIT!' : swift ? ' swift' : ''}`, crit || passed ? 'gold big' : 'gold');
		FX.fly(el, this.$('#coins'), crit || passed ? 12 : Math.min(8, 2 + Math.floor(coins / 6)));
		if (crit) { FX.sfx('crit'); FX.buzz([30, 40, 60]); FX.burstAt(el, { count: 70, power: 12, glyphs }); FX.flash('gold'); }
		else if (ev.harvested) { FX.sfx('harvest', r.combo); FX.buzz(25); FX.burstAt(el, { count: 30, power: 8, glyphs }); }
		else if (v < 0) { FX.sfx('miss'); FX.buzz(ev.kind === 'trial' ? [40, 50, 40] : 15); }
		else { FX.sfx('answer', r.combo); FX.burstAt(el, { count: 8 + Math.min(r.combo, 20), power: 5, glyphs }); }
		let delay = 0;
		if (ev.promoted) { FX.sfx('promote'); FX.flash('gold'); FX.banner(`${ko} ${STARS[r.unit.tier]}`, `${passed ? 'Trial passed' : 'Promoted'}: ${TIER_LABEL[r.unit.tier]}`, 'promo'); delay = 900; }
		else if (ev.established) { FX.sfx('establish'); FX.banner(ko, 'Established: now growing in your hive', 'est'); delay = 700; }
		else if (ev.demoted) { FX.flash('bad'); this.toast(`${ko} wilted and lost a star`); }
		else if (ev.kind === 'trial') FX.flash('bad');
		else if (ev.kind === 'harvest' && ev.lapsed) this.toast(v > 0 ? `${ko} had faded: re-establish it` : `${ko} goes back to learning`);
		if (r.streak === 'kept') this.toast(`🔥 ${g.streak.n}-day streak: +${Math.round((G.streakMult(g) - 1) * 100)}% coins`);
		if (ups) setTimeout(() => this.levelUp(), delay + 200);
		this.updateHud();
		return delay + (ups ? 1300 : 0);
	}

	levelUp() {
		const g = this.g;
		FX.sfx('level'); FX.buzz([40, 60, 40, 60, 120]); FX.banner(`Level ${g.level}`, `+${fmt(T.LEVEL_COINS * g.level)} 냥`, 'level');
		this.updateHud();
	}

	buildTrial(id, tier) { return this.core.buildTrial(id, tier); }

	trialHtml() {
		const k = this.card, u = this.units.get(k.id), t = k.trial;
		const prompt = t.type === 'listen' ? '<button type="button" class="listen" data-act="speak-unit" aria-label="Play again">🔊</button><p class="ask">Listen, then pick the meaning</p>'
			: t.type === 'recall' ? `<h1 class="unit-main english">${escapeHtml(u[C.English])}</h1>${u[C.Disambiguation] ? `<div class="gloss">${escapeHtml(u[C.Disambiguation])}</div>` : ''}<p class="ask">Which Korean is this?</p>`
			: `<div class="unit-row"><h1 class="unit-main">${escapeHtml(u[C.Korean])}</h1>${this.speakBtn('speak-unit')}</div><p class="ask">What does it mean?</p>`;
		return `<div class="card-tags"><span class="pill trial">⚔ Trial</span><span class="pill">${STARS[t.tier]} → ${STARS[t.tier + 1]}</span><span class="pill">+${fmt(T.PROMOTE_PAY[t.tier])} 냥</span></div>${prompt}
			<div class="choices${t.type === 'recall' ? ' ko' : ''}">${t.choices.map((c, i) => `<button type="button" class="choice" data-act="choose" data-i="${i}">${escapeHtml(c.label)}</button>`).join('')}</div>`;
	}

	questsHtml() {
		const qs = this.g.quests;
		if (!qs) return '';
		const all = qs.list.every(q => q.claimed);
		const rows = qs.list.map((q, i) => {
			const done = q.have >= q.need;
			return `<li class="${q.claimed ? 'claimed' : ''}"><div><span>${T.QUESTS[q.k].name.replace('{n}', q.need)} <small>${q.have}/${q.need}</small></span><div class="bar thin"><i style="width:${Math.round(100 * q.have / q.need)}%"></i></div></div>
				${q.claimed ? '<b>✓</b>' : `<button type="button" class="btn gold small" data-act="claim" data-i="${i}" ${done ? '' : 'disabled'}>${done ? 'Claim ' : ''}${fmt(q.coins)}</button>`}</li>`;
		}).join('');
		return `<section class="panel quests"><h2>Today</h2><ul>${rows}</ul>${qs.bonus ? '<p class="muted center">All done. New quests tomorrow.</p>'
			: `<button type="button" class="btn ${all ? 'primary' : ''} wide" data-act="claim" data-i="-1" ${all ? '' : 'disabled'}>🎁 Daily chest${all ? '' : ' · finish all three'}</button>`}</section>`;
	}

	claim(i, el) {
		const coins = this.core.claim(i);
		if (!coins) { FX.sfx('deny'); return; }
		FX.sfx(i === -1 ? 'crit' : 'coin'); FX.buzz(i === -1 ? [30, 40, 60] : 20); FX.floatText(el, `+${fmt(coins)}`, 'gold big'); FX.fly(el, this.$('#coins'), 10); FX.burstAt(el, { count: i === -1 ? 80 : 30, power: i === -1 ? 12 : 7 });
		if (this.g.lastLevelUps) setTimeout(() => this.levelUp(), 300);
		this.updateHud();
		this.renderTabs();
		this.renderScreen(false);
	}

	ascend() {
		const n = this.core.sealsAvailable();
		if (n < T.SEAL_MIN || !window.confirm(`Ascend for ${n} seals? Coins and upgrades reset. Units, stars, levels and cosmetics stay.`)) return;
		this.core.ascend();
		FX.sfx('level'); FX.buzz([60, 60, 60, 60, 160]); FX.flash('gold'); FX.banner('Ascended', `+${n} seals · +${Math.round((G.sealMult(this.g) - 1) * 100)}% coins forever`, 'level');
		this.updateHud();
		this.renderScreen(false);
	}

	roundResults() {
		const { r, c, need, cost, combo } = this.core.endRound(), g = this.g;
		const line = (label, n, cls = '') => n ? `<li class="${cls}"><span>${label}</span><b>${n}</b></li>` : '';
		const tease = [c.ripe + c.wilted ? `${c.ripe + c.wilted} harvests waiting` : '', `${need - g.xp} XP to Lv ${g.level + 1}`,
			cost <= g.coins ? 'A pull is ready in the Shop' : `${fmt(cost - g.coins)} 냥 to the next pull`, c.learning ? `${c.learning} still learning` : ''].filter(Boolean);
		this.openModal(`Round ${g.totals.rounds} complete`, `<div class="result-coins"><i class="coin"></i><span id="res-coins" data-n="0">0</span> 냥</div>
			<div class="lvl wide"><b>Lv ${g.level}</b><div class="bar"><i style="width:${Math.round(100 * g.xp / need)}%"></i></div><small>+${r.xp} XP</small></div>
			<ul class="result-list">${line('🌾 Harvests', r.harvest)}${line('🌿 Established', r.est, 'good')}${line('⚔ Trials passed', r.trials, 'good')}${line('★ Promotions', r.promo - r.trials, 'good')}${line('🌱 Back to learning', r.lapsed, 'warn')}${line(`Combo x${combo}`, `+${Math.round(combo * T.COMBO_STEP * 100)}%`)}</ul>
			<p class="tease">${tease.join(' · ')}</p>
			<div class="btn-row"><button type="button" class="btn primary wide" data-act="next-round">▶ Next round</button></div>
			<div class="btn-row"><button type="button" class="btn" data-act="tab" data-tab="shop">🛒 Shop</button><button type="button" class="btn" data-act="tab" data-tab="map">🗺 Map</button></div>`, 'result');
		FX.countUp(document.getElementById('res-coins'), r.coins, 900);
		FX.sfx('coin');
		this.session.round = this.newRound();
		this.pickCard();
		this.renderTabs();
		this.renderScreen(false);
	}

	clickExampleUnit(id) {
		if (!this.units.has(id) || !this.card || id === this.card.id) return;
		const ko = this.units.get(id)[C.Korean];
		if (!this.g.owned.includes(id)) { this.toast(`${ko} is not unlocked yet`); return; }
		if (!this.session.front.includes(id)) this.session.front.push(id);
		this.toast(`${ko} is next`);
	}

	toggleFlag(i) {
		const item = this.card && this.card.sentences[i];
		if (!item) return false;
		const was = this.isFlagged(item.ko);
		if (was) this.flags = this.flags.filter(f => f.ko !== item.ko);
		else this.flags.push({ ...window.buildFlagEntry(item, this.card.id, 'fc2'), flaggedAt: new Date().toISOString() });
		ls.set(LS + 'flags', this.flags);
		return !was;
	}
	flagPayload() { return { app: 'kongbuhey', kind: 'flagged-sentences', version: 1, exportedAt: new Date().toISOString(), items: this.flags }; }

	// ---------- shop ----------
	pullCandidates() { return this.core.pullCandidates(); }

	shopHtml() {
		const g = this.g, c = this.counts(), cost = G.pullCost(g), nursery = c.new + c.learning, cap = G.nurseryCap(g), left = this.playableUnits().length - g.owned.length;
		const { all, next } = this.packsShown();
		const blocked = !left ? 'Everything is unlocked' : nursery >= cap ? 'Nursery full: establish some units first' : cost > g.coins ? `Need ${fmt(cost - g.coins)} more 냥` : '';
		const packOpts = ['<option value="">Next in course order' + (next ? ` (${escapeHtml(next.name)})` : '') + '</option>']
			.concat(all.filter(p => p.owned < p.ids.length).map(p => `<option value="${escapeHtml(p.name)}" ${this.pullPack === p.name ? 'selected' : ''}>${escapeHtml(p.name)} (${p.ids.length - p.owned} left)</option>`)).join('');
		const nbLv = (g.games || {}).numbers ? 1 : 0;
		const ups = Object.entries(T.UPGRADES).map(([key, s]) => {
			const lv = G.upLevel(g, key), max = lv >= s.max, price = G.upCost(g, key);
			return `<li class="up"><div><b>${s.name}</b> <span class="pill">Lv ${lv}${max ? ' MAX' : ''}</span><small>${s.desc}</small></div>
				<button type="button" class="btn gold" data-act="upgrade" data-key="${key}" ${max || price > g.coins ? 'disabled' : ''}>${max ? 'MAX' : fmt(price)}</button></li>`;
		}).join('');
		const cos = (kind, table, cur) => Object.entries(table).map(([key, [name, price]]) => {
			const has = g.cos.owned.includes(key), on = cur === key;
			return `<button type="button" class="btn cos${on ? ' on' : ''}" data-act="cosmetic" data-kind="${kind}" data-key="${key}" ${!has && price > g.coins ? 'disabled' : ''}>${name}<small>${on ? 'equipped' : has ? 'owned' : fmt(price) + ' 냥'}</small></button>`;
		}).join('');
		return `<section class="panel pull"><h2>Pull new units</h2>
				<p class="muted">Reveals ${G.pullSize(g)} units in course order, highest priority first. Nursery ${nursery}/${cap}.</p>
				<label class="row">From <select data-pack>${packOpts}</select></label>
				<button type="button" class="btn primary wide pull-btn" data-act="pull" ${blocked ? 'disabled' : ''}>✨ Pull ×${G.pullSize(g)} <small>${cost ? fmt(cost) + ' 냥' : 'FREE'}</small></button>
				${blocked ? `<p class="muted center">${blocked}</p>` : ''}</section>
			<section class="panel"><h2>Games</h2><ul class="ups"><li class="up"><div><b>Number sound board</b> <span class="pill">Lv ${nbLv}</span><small>Hear 0-12 in native and Sino-Korean, tap the number you heard.</small></div>
				<button type="button" class="btn gold" data-act="${nbLv ? 'nb-open' : 'nb-buy'}" ${!nbLv && G.NUMBER_COST > g.coins ? 'disabled' : ''}>${nbLv ? 'Open' : fmt(G.NUMBER_COST)}</button></li></ul></section>
			<section class="panel"><h2>Upgrades</h2><ul class="ups">${ups}</ul></section>
			<section class="panel"><h2>Ascend</h2><p class="muted">Seals: <b>${g.seals || 0}</b> (+${Math.round((G.sealMult(g) - 1) * 100)}% all coins, permanent). Ascending banks your ${G.sealsAvailable(g, this.prog)} new ★ as seals and resets coins and upgrades. Units, stars, levels and cosmetics stay.</p>
				<button type="button" class="btn wide${G.sealsAvailable(g, this.prog) >= T.SEAL_MIN ? ' primary' : ''}" data-act="ascend" ${G.sealsAvailable(g, this.prog) >= T.SEAL_MIN ? '' : 'disabled'}>⛩ Ascend${G.sealsAvailable(g, this.prog) >= T.SEAL_MIN ? ` for +${G.sealsAvailable(g, this.prog)} seals` : ` · needs ${T.SEAL_MIN} new ★`}</button></section>
			<section class="panel"><h2>Themes</h2><div class="cos-row">${cos('theme', THEMES, g.cos.theme)}</div><h2>Particles</h2><div class="cos-row">${cos('particle', PARTICLES, g.cos.particle)}</div></section>`;
	}

	pull() {
		const res = this.core.pull(this.pullPack || null);
		if (res.blocked) { FX.sfx('deny'); return; }
		const ids = res.ids;
		if (!ids.length) return;
		this.updateHud();
		const cards = ids.map((id, i) => {
			const u = this.units.get(id), r = G.rarity(u[C.PriorityScore]);
			return `<div class="reveal r${r}" style="--d:${i * 320}ms" data-r="${r}"><span class="rar">${RARITY[r]}</span><b>${escapeHtml(u[C.Korean])}</b><small>${escapeHtml(u[C.Source])}</small></div>`;
		}).join('');
		this.card = null;
		this.openModal('New units', `<div class="reveals">${cards}</div><div class="btn-row"><button type="button" class="btn primary wide" data-act="tab" data-tab="play">▶ Learn them</button></div>`, 'result');
		const colors = [['#b8c0cc'], ['#6cb6ff', '#cfe6ff'], ['#c39bff', '#f0e4ff'], ['#ffd166', '#fff3c4', '#ff9f1c']];
		this.root.querySelectorAll('.reveal').forEach((n, i) => setTimeout(() => {
			if (!n.isConnected) return;
			const r = Number(n.dataset.r);
			FX.sfx(r >= 2 ? 'harvest' : 'reveal', r * 3); FX.buzz(r >= 2 ? [20, 30, 40] : 12);
			FX.burstAt(n, { count: 10 + r * 16, power: 5 + r * 2, colors: colors[r] });
		}, 380 + i * 320));
		this.renderTabs();
		this.renderScreen(false);
	}

	upgrade(key, el) {
		if (!this.core.upgrade(key)) { FX.sfx('deny'); return; }
		FX.sfx('buy'); FX.buzz(20); FX.burstAt(el, { count: 26, colors: ['#6cb6ff', '#cfe6ff', '#ffd166'] });
		this.updateHud();
		this.renderScreen(false);
	}

	cosmetic(kind, key, el) {
		const res = this.core.cosmetic(kind, key, (kind === 'theme' ? THEMES : PARTICLES)[key][1]);
		if (!res) { FX.sfx('deny'); return; }
		if (res.bought) FX.sfx('buy');
		this.applyCosmetics();
		FX.burstAt(el, { count: 30, glyphs: kind === 'particle' && key === 'hangul' ? ['공', '부', '해'] : undefined });
		this.updateHud();
		this.renderScreen(false);
	}

	// ---------- sentence comprehension test ----------
	enOf(s) { return this.core.enOf(s); }

	/**
	 * The sentence's translation (or, when rev, its Korean) plus 3 close wrong ones. Close = the same nouns: candidates are generated with those
	 * nouns preferred, then ranked by how many of the sentence's nouns they share (and how few extra nouns they bring), so only the verb,
	 * tense or other details differ. Each choice carries the unit ids of its sentence.
	 */
	buildSentenceTest(s, rev = false, cardId = null) { return this.core.buildSentenceTest(s, rev, cardId); }

	get STEST_GUARD_MS() { return this.guardMs === undefined ? 450 : this.guardMs; }

	sentenceTest(i) {
		const k = this.card, s = k && k.sentences[i];
		if (!s || k.done || k.side !== 'front') return;
		const rev = this.opts.reverse, pre = s.preTest, choices = pre && pre.key === `${rev}|${this.g.owned.length}` && pre.choices ? pre.choices : this.buildSentenceTest(s, rev);
		s.preTest = null;   // each quiz is fresh: the next tap builds (or prefetches) a new one
		if (!choices) { this.toast('No quick test for this sentence. Try ↻ New examples'); FX.sfx('deny'); return; }
		this.stest = { k, s, choices, rev, done: false, picked: -1, readyAt: this.clock.ms() + this.STEST_GUARD_MS };
		this.markSeen(new Set(choices.flatMap(c => c.ids || [])));   // every unit in the sentence and in the choices was read
		FX.sfx('tap');
		this.stestRender();
	}

	stestRender() {
		const t = this.stest, ko = this.units.get(t.k.id)[C.Korean];
		const btns = t.choices.map((c, j) => `<button type="button" class="choice${!t.done ? '' : c.ok ? ' right' : j === t.picked ? ' wrong' : ''}" data-act="stest-pick" data-i="${j}" ${t.done ? 'disabled' : ''}>${escapeHtml(c.text)}</button>`).join('');
		this.openModal('Sentence test', `<div class="sent-test"><div class="s-big${t.rev ? ' en' : ''}">${escapeHtml(t.rev ? this.enOf(t.s) : t.s.ko)}</div>${t.rev ? '' : this.speakBtn('stest-say')}
			<p class="ask">${t.rev ? 'Which Korean sentence says this?' : 'What does it mean?'}</p><div class="choices${t.rev ? ' ko' : ''}">${btns}</div>
			<p class="muted center">Right: 2 correct answers for every unit in it, 3 for ${escapeHtml(ko)}. Wrong: Missed it for ${escapeHtml(ko)}.</p></div>`);
	}

	stestPick(j, el) {
		const t = this.stest;
		if (!t || t.done || this.card !== t.k || t.k.done) return;
		if (this.clock.ms() < t.readyAt) return;   // a tap meant for the 🎯 button (or made while the quiz was appearing) must not answer it
		t.done = true; t.picked = j;
		const ok = t.choices[j].ok;
		if (ok) { FX.sfx('answer', this.session.combo + 1); FX.buzz(15); FX.burstAt(el, { count: 20, power: 6 }); } else { FX.sfx('miss'); FX.buzz([20, 30, 20]); }
		this.stestRender();
		setTimeout(() => {
			if (this.stest !== t || this.card !== t.k || t.k.done) return;
			this.stest = null; this.closeModal();
			this.sentenceSettle(t.s, ok);
		}, ok ? 800 : 1800);
	}

	/**
	 * Right: a big bonus. Every unlocked unit in the sentence gets 2 "Correct" answers and the card's own unit gets 3 (2 + 1 for spawning the
	 * test), each paying everything an answer pays (score, coins, XP, combo, quests). Units waiting on a promotion trial are skipped, and a
	 * second answer on a ripe unit pays as practice (one harvest per review). Wrong: "Missed it" for the card.
	 */
	sentenceSettle(s, ok) {
		const el = this.$('#card');
		const res = this.core.answerSentence(s, ok, { settled: r => this.settleEffects(r, ok ? 1 : -1, el) });
		if (!ok) { this.advance(res.settledOut); return; }
		const delay = res.settledOut, total = this.bonusShow(el, res.rows, res.coins, res.xp);
		if (res.ups) setTimeout(() => this.levelUp(), delay + 500);
		this.updateHud();
		this.advance(Math.max(delay, total));
	}

	/** One right answer for a unit that is not the card being settled: everything an answer pays, without per-answer effects. */
	creditAnswer(id, st) { return this.core.creditAnswer(id, st); }

	/** The sentence-clear show: coin and XP particles into the HUD, the card's learning pill counting up, a sliding chip per unit. Returns ms until the next card. */
	bonusShow(el, rows, coins, xp) {
		const STEP = 260, coinEl = this.$('#coins'), xpEl = this.$('#xpbar'), ko = id => this.units.get(id)[C.Korean];
		FX.sfx('crit'); FX.buzz([30, 40, 60]); FX.flash('gold');
		FX.burstAt(el, { count: 90, power: 12 });
		FX.floatText(el, `🎯 CLEAR +${fmt(coins)}`, 'gold big');
		for (let i = 0; i < 4; i++) {
			setTimeout(() => { FX.fly(el, coinEl, 12); FX.fly(el, xpEl, 8, '✦', 'xp'); FX.sfx('coin'); }, i * 180);
		}
		setTimeout(() => FX.floatText(xpEl, `+${xp} XP`, 'xp'), 500);
		// The learning pill on the card counts up to the new score.
		const own = rows[0], pill = this.$('.playbar .mode');
		if (pill && own.before.score < T.ESTABLISHED) {
			const to = Math.min(T.ESTABLISHED, own.after.score);
			for (let sc = own.before.score + 1; sc <= to; sc++) {
				setTimeout(() => { pill.textContent = sc >= T.ESTABLISHED ? '✨ Established!' : `🌱 Learning ${sc}/${T.ESTABLISHED}`; pill.classList.remove('pop'); void pill.offsetWidth; pill.classList.add('pop'); FX.sfx('answer', sc + 6); }, 350 * (sc - own.before.score));
			}
		}
		// One chip per unit slides in from the right.
		let box = this.$('#bonus');
		if (!box) { box = document.createElement('div'); box.id = 'bonus'; this.root.appendChild(box); }
		const shown = rows.slice(0, 7);
		shown.forEach((r, i) => {
			setTimeout(() => {
				const learning = r.before.score < T.ESTABLISHED;
				const state = r.promoted ? `★ promoted` : r.established ? '✨ established' : learning ? `🌱 ${Math.max(0, r.before.score)}/${T.ESTABLISHED} → ${Math.min(T.ESTABLISHED, r.after.score)}/${T.ESTABLISHED}` : r.harvested ? '🌾 harvested' : '🌿 practiced';
				const chip = document.createElement('div');
				chip.className = 'bchip' + (r.own ? ' own' : '');
				chip.innerHTML = `<b>${escapeHtml(ko(r.id))}</b><span>${r.own ? '🎯 ×3 · ' : '×2 · '}${state}</span><em>+${fmt(r.coins)} 냥 · +${r.xp} XP</em>`;
				box.appendChild(chip);
				FX.sfx('answer', 3 + i * 2); FX.buzz(10);
				FX.fly(chip, coinEl, 4); FX.burstAt(chip, { count: 14, power: 6 });
				setTimeout(() => chip.classList.add('out'), 1500);
				setTimeout(() => chip.remove(), 1900);
			}, 500 + i * STEP);
		});
		if (rows.length > shown.length) setTimeout(() => { const c = document.createElement('div'); c.className = 'bchip'; c.innerHTML = `<span>+${rows.length - shown.length} more units</span>`; box.appendChild(c); setTimeout(() => c.remove(), 1900); }, 500 + shown.length * STEP);
		return Math.min(3600, 500 + shown.length * STEP + 1100);
	}

	// ---------- number sound board (shop unlock) ----------
	nbBuy(el) {
		if (!this.core.buyNumbers()) { FX.sfx('deny'); return; }
		FX.sfx('buy'); FX.buzz(20); FX.burstAt(el, { count: 30 });
		this.updateHud(); this.renderScreen(false); this.nbOpen();
	}

	nbOpen() {
		const prev = this.nb;
		this.nb = { mode: prev ? prev.mode : 'both', q: null, streak: 0, right: 0, total: 0, done: false, picked: -1 };
		this.nbNext();
	}

	nbNext() {
		const n = this.nb;
		n.q = this.core.numberQuestion(n.mode, n.q); n.done = false; n.picked = -1;
		this.nbRender();
		window.speakKorean(n.q.ko);
	}

	nbRender() {
		const n = this.nb, g = this.g, best = (g.games || {}).numbersBest || 0;
		const btn = v => {
			const cls = !n.done ? '' : v === n.q.n ? ' right' : v === n.picked ? ' wrong' : '';
			return `<button type="button" class="choice${cls}" data-act="nb-pick" data-v="${v}" ${n.done ? 'disabled' : ''}>${v}</button>`;
		};
		const chip = (m, label) => `<button type="button" class="btn${n.mode === m ? ' primary' : ''}" data-act="nb-mode" data-m="${m}">${label}</button>`;
		const reveal = n.done ? `<p class="ask"><b>${n.q.ko}</b> · ${n.q.sys === 'native' ? 'native' : 'Sino-Korean'} ${n.q.n}</p>` : '<p class="ask">Which number did you hear?</p>';
		this.openModal('Number sound board', `<div class="btn-row">${chip('both', 'Both')}${chip('native', 'Native')}${chip('sino', 'Sino')}</div>
			<button type="button" class="listen" data-act="nb-say" aria-label="Play again">🔊</button>${reveal}
			<div class="nb-grid">${Array.from({ length: 12 }, (_, i) => btn(i + 1)).join('')}</div>
			<div class="nb-zero">${btn(0)}</div>
			<p class="muted center">🔥 ${n.streak} · best ${best} · ${n.right}/${n.total} right · native has no zero</p>`);
	}

	nbPick(v, el) {
		const n = this.nb, g = this.g;
		if (!n || n.done || this.modalHidden()) return;
		n.done = true; n.picked = v; n.total++;
		window.speakKorean(G.numberWord(n.q.sys, v));   // say the tapped number in the question's own system
		if (v === n.q.n) {
			n.right++; n.streak++;
			this.core.recordNumberStreak(n.streak);
			FX.sfx('answer', n.streak); FX.buzz(15); FX.burstAt(el, { count: 8 + Math.min(n.streak, 20), power: 5 });
		} else { n.streak = 0; FX.sfx('miss'); FX.buzz([20, 30, 20]); }
		this.nbRender();
		setTimeout(() => { if (this.nb === n && n.done && !this.modalHidden()) this.nbNext(); }, v === n.q.n ? 1100 : 1900);
	}

	// ---------- menu ----------
	menuHtml() {
		const o = this.opts, g = this.g, t = g.totals, c = this.counts();
		const select = (key, list, cur) => `<select data-opt="${key}">${list.map(([v, l]) => `<option value="${v}" ${String(cur) === String(v) ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
		const check = (key, label) => `<label class="row"><input type="checkbox" data-opt="${key}" ${o[key] ? 'checked' : ''}> ${label}</label>`;
		const stars = g.owned.reduce((n, id) => n + this.unitOf(id).tier, 0);
		return `<section class="panel"><h2>Progress</h2><table class="kv"><tr><th>Units unlocked</th><td>${g.owned.length} / ${this.playableUnits().length}</td></tr><tr><th>Stars · trials passed</th><td>${stars} ★ · ${fmt(t.trials || 0)}</td></tr><tr><th>Seals</th><td>${g.seals || 0} (+${Math.round((G.sealMult(g) - 1) * 100)}% coins)</td></tr>
				<tr><th>Growing / ripe / wilted</th><td>${c.growing} / ${c.ripe} / ${c.wilted + c.dormant}</td></tr><tr><th>Answers · harvests · rounds</th><td>${fmt(t.answers)} · ${fmt(t.harvests)} · ${fmt(t.rounds)}</td></tr>
				<tr><th>Coins earned</th><td>${fmt(t.earned)} 냥</td></tr><tr><th>Day streak</th><td>${g.streak.n} (+${Math.round((G.streakMult(g) - 1) * 100)}% coins)</td></tr></table></section>
			<section class="panel"><h2>Options</h2>${check('reverse', 'Test the Korean: show English on the front')}
				<label class="row">Speak the Korean unit ${select('speak', SPEAK_MODES, o.speak)}</label>
				<label class="row">Example sentences per card ${select('count', [1, 2, 3, 4, 5, 6].map(n => [n, n]), o.count)}</label>
				${check('onlyOwned', 'Build examples only from unlocked units')}<div class="btn-row"><button type="button" class="btn" data-act="names-open">Names in examples (씨)</button></div>${check('audioTrials', 'Listening trials (hear the Korean, pick the meaning)')}${check('sound', 'Sound effects')}${check('haptics', 'Vibration')}</section>
			<section class="panel"><h2>Data</h2><div class="btn-row"><button type="button" class="btn" data-act="flags-open">Flagged sentences (${this.flags.length})</button>
				<button type="button" class="btn" data-act="backup-open">Backup / restore</button>
				<button type="button" class="btn" data-act="recover-open">Recover progress</button>
				<button type="button" class="btn" data-act="force-save">💾 Force save</button></div>
				${EPHEMERAL ? '<p class="muted"><b>?debug page: nothing is saved here.</b> Use the normal page for real play.</p>' : ''}
				<div class="btn-row"><a class="btn" href="../webapp/index.html">Spreadsheet (webapp)</a><a class="btn" href="../flashcards/index.html">Old flashcards</a></div>
				<div class="btn-row"><button type="button" class="btn danger" data-act="reset-game">Reset game progress</button></div>
				<p class="muted">Reset clears coins, levels, unlocks and upgrades. Unit scores in the spreadsheet stay.</p></section>
			<p class="muted center build-stamp" id="build-stamp">${escapeHtml(buildLabel())}</p>
			<p class="muted center build-stamp" id="where-am-i">${EPHEMERAL ? 'DEBUG page (nothing is saved)' : DEBUG !== null ? 'DEBUG page (saving on, test mode)' : 'Normal page (saved)'}<br>${escapeHtml(location.href)}</p>`;
	}

	/** Every place progress could still be: the unit database, this page's mirror, the other page's save (?debug vs normal), snapshots, the old flashcards app. */
	recoverySources() {
		const St = window.FC2Store, out = [], ns = LS === 'kb.fc2.v1.' ? 'kb.fc2.dbg.' : 'kb.fc2.v1.', otherName = ns === 'kb.fc2.dbg.' ? 'the ?debug page' : 'the normal page';
		if (!St) return out;
		const add = (label, packed, at, game) => { if (packed && typeof packed === 'object' && Object.keys(packed).length) out.push({ label, packed, at, game, st: St.progStats(packed) }); };
		const when = at => new Date(at * 1000).toLocaleString();
		add('Unit database (this browser)', this.dbPacked);
		add('This page\'s progress copy', ls.get(LS + 'prog', {}));
		for (const sn of [...(this.snaps || [])].reverse()) add(`Automatic snapshot ${when(sn.at)}`, sn.packed, sn.at, sn.game);
		add(`Save of ${otherName}`, ls.get(ns + 'prog', {}));
		for (const sn of [...(ls.get(ns + 'snaps', []) || [])].reverse()) add(`Snapshot of ${otherName} ${when(sn.at)}`, sn.packed, sn.at, sn.game);
		const deck = ls.get(OLD + 'deck', null), stats = ls.get(OLD + 'stats', {}) || {};
		if (deck && deck.scores) {
			const packed = {};
			for (const [k, raw] of (Array.isArray(deck.scores) ? deck.scores : Object.entries(deck.scores))) { const sc = Number(raw) || 0, st = stats[k] || {}; if (sc) packed[k] = [G.clamp(sc), 0, st.correct || 0, st.seen || st.correct || 0]; }
			add('Old flashcards app (scores only)', packed);
		}
		return out;
	}

	/** On the real page: if a much richer saved copy exists elsewhere in this browser (the ?debug save, a snapshot), say so on the map. */
	findRecoverable() {
		this.recoverHint = null;
		if (EPHEMERAL || !window.FC2Store) return;
		const St = window.FC2Store;
		this.recSources = this.recoverySources();
		const cur = St.progStats(Object.fromEntries([...this.prog].map(([id, u]) => [id, [u.score, u.tier, u.lastCorrect, u.lastSeen]])));
		let best = -1;
		this.recSources.forEach((r, i) => { if (r.st.scored >= cur.scored + 5 && (best < 0 || r.st.scored > this.recSources[best].st.scored)) best = i; });
		if (best >= 0) this.recoverHint = best;
	}

	recoverHintHtml() {
		const r = this.recoverHint !== null && this.recoverHint !== undefined ? (this.recSources || [])[this.recoverHint] : null;
		if (!r) return '';
		return `<section class="panel hint-box"><b>💾 Found saved progress</b><p class="muted">${escapeHtml(r.label)}: ${r.st.scored} scored units, ${r.st.established} established, ${r.st.stars} stars${r.st.latest ? ', last activity ' + dur(this.clock.sec() - r.st.latest) + ' ago' : ''}. This page has fewer.</p>
			<div class="btn-row"><button type="button" class="btn primary" data-act="recover" data-i="${this.recoverHint}">Restore it</button>${r.game ? `<button type="button" class="btn" data-act="recover" data-i="${this.recoverHint}" data-game="1">Restore + game</button>` : ''}
			<button type="button" class="btn" data-act="recover-open">See all copies</button></div></section>`;
	}

	recoverOpen() {
		this.recSources = this.recoverySources();
		const now = this.clock.sec(), cur = window.FC2Store ? window.FC2Store.progStats(Object.fromEntries([...this.prog].map(([id, u]) => [id, [u.score, u.tier, u.lastCorrect, u.lastSeen]]))) : null;
		const rows = this.recSources.map((r, i) => `<tr><td>${escapeHtml(r.label)}<br><span class="muted">${r.st.scored} scored · ${r.st.established} established · ${r.st.stars} stars · last activity ${r.st.latest ? dur(now - r.st.latest) + ' ago' : 'unknown'}</span></td>
			<td><button type="button" class="btn" data-act="recover" data-i="${i}">Restore</button>${r.game ? `<button type="button" class="btn" data-act="recover" data-i="${i}" data-game="1">+ game</button>` : ''}</td></tr>`).join('');
		this.openModal('Recover progress', `<p class="muted">Now: ${cur ? `${cur.scored} scored · ${cur.established} established · ${cur.stars} stars` : 'unavailable (store.js missing: reload the page)'}.${EPHEMERAL ? ' <b>This is the ?debug page: it never saves. Open the normal page to recover.</b>' : ''}</p>
			${rows ? `<table class="kv recover">${rows}</table><p class="muted">Restore keeps the more advanced copy of each unit (stars, then score, then newer) and never lowers a unit you have now.</p>` : '<p>No saved progress was found in this browser. Use 🛠 Edit values on a unit in the Map to set values by hand.</p>'}`);
	}

	recoverFrom(i, withGame = false) {
		const src = (this.recSources || [])[i], St = window.FC2Store;
		if (!src || !St) return;
		const r = St.bestOf(this.prog, src.packed, id => this.units.has(id));
		this.prog = r.prog;
		if (withGame && src.game) {   // snapshots from this version on also hold the game (coins, level, unlocks, upgrades): replace the current one
			const blank = G.blankGame(this.clock.sec());
			this.g = { ...blank, ...src.game, cos: { ...blank.cos, ...src.game.cos }, totals: { ...blank.totals, ...src.game.totals } };
			this.g.owned = this.g.owned.filter(id => this.units.has(id));
		}
		for (const id of r.changed) { this.saveUnit(id); if (this.unitOf(id).score > 0 && !this.g.owned.includes(id)) this.g.owned.push(id); }
		this.save(); this.flush(); this.updateHud(); this.findRecoverable(); this.render();
		if (!this.modalHidden()) this.recoverOpen();
		this.toast(r.changed.length ? `Restored ${r.changed.length} units` : 'Nothing to restore: you already have this or better');
	}

	/** Writes everything now and reads it back to prove it stuck: game, session, progress copy, snapshots, and every unit in the database. */
	async forceSave() {
		if (EPHEMERAL) { this.openModal('Force save', '<p><b>?debug page: nothing is saved here by design</b> (scenes replace the whole game). Open the normal page to play and save.</p>'); return; }
		this.openModal('Force save', '<p>Saving...</p>');
		const rows = [], row = (k, v, ok = true) => rows.push(`<tr><th>${k}</th><td>${ok ? '✔' : '✖'} ${v}</td></tr>`);
		try {
			if (!window.FC2Store) { store(); row('Progress copy', 'store.js is missing: reload the page first', false); }
			else {
				this.flush();
				const raw = k => { try { return window.localStorage.getItem(LS + k); } catch (_) { return null; } };
				const ids = [...this.prog.keys()].filter(id => { const u = this.prog.get(id); return u.score || u.tier || u.lastCorrect || u.lastSeen; });
				const game = raw('game'), prog = raw('prog'), sess = raw('session');
				row('Game', game && JSON.parse(game).coins === this.g.coins ? `${game.length} bytes, coins ${this.g.coins}` : 'read-back mismatch', Boolean(game) && JSON.parse(game).coins === this.g.coins);
				const copy = prog ? JSON.parse(prog) : {}, same = ids.filter(id => { const a = copy[id], u = this.prog.get(id); return a && a[0] === u.score && a[1] === u.tier && a[2] === u.lastCorrect && a[3] === u.lastSeen; }).length;
				row('Progress copy', `${same}/${ids.length} units match, ${(prog || '').length} bytes`, same === ids.length);
				row('Session', sess ? `${sess.length} bytes` : 'not saved', Boolean(sess));
				row('Snapshots', `${(this.snaps || []).length} kept`);
				if (this.db) {
					const wrote = await this.saveUnits(ids);
					const recs = await this.db.loadAllUnitDataIncremental(), back = new Map(recs.map(r => [r.unitId, r.custom || {}]));
					const ok = ids.filter(id => { const c = back.get(id), u = this.prog.get(id); return c && Number(c.RecognitionScore) === u.score && G.tierIndex(c.LongTermRecognition) === u.tier && Number(c.TimeStampLastCorrect) === u.lastCorrect && Number(c.TimeStampLastSeen) === u.lastSeen; }).length;
					row('Unit database', `${wrote ? '' : 'write failed, '}${ok}/${ids.length} units read back correctly`, wrote && ok === ids.length);
					if (ok < ids.length) {
						const bad = ids.filter(id => { const c = back.get(id), u = this.prog.get(id); return !(c && Number(c.RecognitionScore) === u.score && G.tierIndex(c.LongTermRecognition) === u.tier && Number(c.TimeStampLastCorrect) === u.lastCorrect && Number(c.TimeStampLastSeen) === u.lastSeen); }).slice(0, 3);
						reportError('Unit database read-back mismatch', new Error(`database fallback mode: ${Boolean(this.db.useMemoryFallback)}; records in database: ${recs.length}\n` + bad.map(id => `unit ${id}: game has ${JSON.stringify(this.prog.get(id))}, database has ${JSON.stringify(back.get(id) || {})}`).join('\n')));
					}
				} else row('Unit database', DEBUG !== null ? 'not used on the ?debug page' : 'unavailable in this browser (the progress copy is your save)', DEBUG !== null);
			}
		} catch (e) { reportError('Force save failed', e); row('Error', escapeHtml(e.message || String(e)), false); }
		this.openModal('Force save', `<table class="kv">${rows.join('')}</table><p class="muted">${rows.some(r => r.includes('✖')) ? 'Something did not save: the red error box above has the details to copy.' : 'Everything above was written and read back.'}</p>`);
	}

	// The backup format lives in fc2/store.js (packBackup / unpackBackup), shared with tools/save_inspect.js. Flagged sentences are not
	// included: they have their own ⬇ Flags export.
	backupJson() {
		const prog = new Map(this.g.owned.map(id => [id, this.unitOf(id)]));
		try { return store().packBackup({ game: this.g, opts: this.opts, prog, notes: this.notes }); } catch (e) { return e.message; }
	}

	restore() {
		const msg = this.$('#backup-msg');
		try {
			const data = store().unpackBackup(this.$('#backup-text').value);
			this.g = { ...G.blankGame(this.clock.sec()), ...data.game };
			this.opts = { ...DEFAULT_OPTS, ...data.opts };
			if (data.flags) this.flags = data.flags;   // older backups carried flags; newer ones leave yours alone
			for (const [id, u] of data.prog) { this.prog.set(id, u); this.saveUnit(id); }
			for (const [k, text] of Object.entries(data.notes)) { this.notes[k] = text; this.saveCell(Number(k), 'notes', text); }
			this.save(); ls.set(LS + 'opts', this.opts); ls.set(LS + 'flags', this.flags);
			this.session = this.newSession(); this.card = null;
			this.applyCosmetics(); this.closeModal(); this.render();
		} catch (err) { msg.textContent = 'Could not restore: ' + err.message; }
	}

	// ---------- modals ----------
	openModal(title, html, cls = '') {
		const m = this.$('#modal');
		m.innerHTML = `<div class="modal-card ${cls}" role="dialog" aria-modal="true"><header><h2>${escapeHtml(title)}</h2>
			<button type="button" class="icon-btn" data-act="close-modal" aria-label="Close">✕</button></header><div class="modal-body">${html}</div></div>`;
		m.classList.remove('hidden');
	}
	closeModal() { const m = this.$('#modal'); m.classList.add('hidden'); m.innerHTML = ''; }

	flagsHtml() {
		return `<p class="muted">${this.flags.length} flagged. Copy this and save it as a file in the project's <code>flagged/</code> folder.</p>
			<textarea id="export-text" class="export" readonly rows="10">${escapeHtml(JSON.stringify(this.flagPayload(), null, 2))}</textarea>
			<div class="btn-row"><button type="button" class="btn" data-act="copy" data-target="export-text">Copy</button><button type="button" class="btn" data-act="download-flags">Download</button>
			<button type="button" class="btn danger" data-act="clear-flags">Clear all flags</button></div>`;
	}

	copyText(textarea, btn) {
		if (!textarea) return;
		const done = () => { const t = btn.textContent; btn.textContent = 'Copied'; setTimeout(() => { btn.textContent = t; }, 1200); };
		textarea.focus(); textarea.select();
		if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(textarea.value).then(done, () => { document.execCommand('copy'); done(); });
		else { document.execCommand('copy'); done(); }
	}

	download(name, text) {
		const a = document.createElement('a');
		a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
		a.download = name;
		document.body.appendChild(a); a.click(); a.remove();
	}

	// ---------- events ----------
	bind() {
		const flush = () => this.flush();
		window.addEventListener('pagehide', flush);
		document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
		this.root.addEventListener('click', ev => {
			if (!this.g) return;
			const link = ev.target.closest('[data-unit]');
			if (link) { ev.preventDefault(); this.clickExampleUnit(Number(link.dataset.unit)); return; }
			const el = ev.target.closest('[data-act]');
			if (el) { if (!el.disabled) this.act(el.dataset.act, el); return; }
			if (ev.target.id === 'modal') { this.closeModal(); return; }
			if (this.tab === 'play' && ev.target.closest('#card') && !ev.target.closest('button, a, textarea, select, input, label, .notes')) this.flip();
		});
		for (const t of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) this.root.addEventListener(t, ev => this.vqDrag(ev));
		this.root.addEventListener('change', ev => {
			const t = ev.target;
			if (t.matches('[data-pack]')) { this.pullPack = t.value; return; }
			if (t.dataset && t.dataset.edit) { this.applyUnitEdit(Number(t.dataset.id), t.dataset.edit, t.value); return; }
			if (t.dataset && t.dataset.nameId) { this.nameToggle(Number(t.dataset.nameId), t.checked); return; }
			const opt = t.dataset && t.dataset.opt;
			if (!opt) return;
			this.opts[opt] = t.type === 'checkbox' ? t.checked : (opt === 'count' ? parseInt(t.value, 10) : t.value);
			ls.set(LS + 'opts', this.opts);
			this.applyCosmetics();
			if (this.card && (opt === 'count' || opt === 'onlyOwned')) Object.assign(this.card, this.generateFor(this.card.id));
		});
		this.root.addEventListener('input', ev => {
			const t = ev.target;
			if (t.matches('[data-cheat-min]')) { this.cheatMinutes = t.value; return; }
			if (!t.matches('[data-notes]') || !this.card) return;
			const id = this.card.id;
			this.notes[id] = t.value;
			clearTimeout(this.notesTimer);
			this.notesTimer = setTimeout(() => this.saveCell(id, 'notes', this.notes[id]), 600);
		});
	}

	act(name, el) {
		switch (name) {
			case 'tab': this.closeModal(); this.go(el.dataset.tab); break;
			case 'collect': this.collect(el); break;
			case 'sent-test': this.sentenceTest(Number(el.dataset.i)); break;
			case 'stest-pick': this.stestPick(Number(el.dataset.i), el); break;
			case 'stest-say': if (this.stest) window.speakKorean(this.stest.s.ko, el); break;
			case 'nb-buy': this.nbBuy(el); break;
			case 'nb-open': this.closeModal(); this.nbOpen(); break;
			case 'nb-pick': this.nbPick(Number(el.dataset.v), el); break;
			case 'nb-say': if (this.nb && this.nb.q) window.speakKorean(this.nb.q.ko, el); break;
			case 'nb-mode': if (this.nb) { this.nb.mode = el.dataset.m; this.nbNext(); } break;
			case 'tile': if (this.cheat) this.cheatTap(Number(el.dataset.id)); else this.tileModal(Number(el.dataset.id)); break;
			case 'cheat-toggle': this.cheat = !this.cheat; this.renderScreen(false); break;
			case 'cheat-mature': this.matureAll(this.cheatMinutes); break;
			case 'force-save': this.forceSave(); break;
			case 'unit-edit': this.tileModal(Number(el.dataset.id), el.dataset.on === '1'); break;
			case 'unit-now': this.applyUnitEdit(Number(el.dataset.id), el.dataset.col, 1); break;
			case 'recover-open': this.recoverOpen(); break;
			case 'recover': this.recoverFrom(Number(el.dataset.i), el.dataset.game === '1'); break;
			case 'review': this.session.front.unshift(Number(el.dataset.id)); this.card = null; this.closeModal(); this.go('play'); break;
			case 'score': this.score(Number(el.dataset.v), el); break;
			case 'choose': this.choose(Number(el.dataset.i), el); break;
			case 'continue': if (this.card && this.card.done && !this.card.left) { this.card.left = true; this.advance(0); } break;
			case 'claim': this.claim(Number(el.dataset.i), el); break;
			case 'ascend': this.ascend(); break;
			case 'next-round': this.closeModal(); if (this.tab !== 'play') this.go('play'); else this.maybeSpeak('front'); break;
			case 'speak-unit': if (this.card) window.speakKorean(this.units.get(this.card.id)[C.Korean], el); break;
			case 'speak-sent': { const s = this.card && this.card.sentences[Number(el.dataset.i)]; if (s) { window.speakKorean(s.ko, el); this.markSeen(R.unitIdsOf(s)); } break; }
			case 'flag': el.classList.toggle('flagged', this.toggleFlag(Number(el.dataset.i))); break;
			case 'vq-open': this.vqOpen(); break;
			case 'vq-front': this.vqMove(el.dataset.tid, 'front'); break;
			case 'vq-back': this.vqMove(el.dataset.tid, 'back'); break;
			case 'regen': Object.assign(this.card, this.generateFor(this.card.id)); this.renderScreen(false); break;
			case 'notes-toggle': this.editingNotes = !this.editingNotes; this.renderScreen(false); break;
			case 'pull': this.pull(); break;
			case 'upgrade': this.upgrade(el.dataset.key, el); break;
			case 'cosmetic': this.cosmetic(el.dataset.kind, el.dataset.key, el); break;
			case 'close-modal': this.closeModal(); break;
			case 'flags-open': this.openModal('Flagged sentences', this.flagsHtml()); break;
			case 'names-open': this.namesDirty = false; this.openModal('Names in examples', this.namesHtml()); break;
			case 'name-add': this.nameAdd(); break;
			case 'name-rm': this.nameRemove(Number(el.dataset.i)); break;
			case 'reload': location.reload(); break;
			case 'backup-open': this.openModal('Backup / restore', `<p class="muted">Game state, options, notes and the scores of unlocked units.</p>
				<textarea id="backup-text" class="export" rows="10">${escapeHtml(this.backupJson())}</textarea><div class="btn-row"><button type="button" class="btn" data-act="copy" data-target="backup-text">Copy</button>
				<button type="button" class="btn danger" data-act="restore">Restore from text</button></div><p id="backup-msg" class="muted"></p>`); break;
			case 'copy': this.copyText(this.$('#' + el.dataset.target), el); break;
			case 'download-flags': this.download('flags-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.json', JSON.stringify(this.flagPayload(), null, 2)); break;
			case 'clear-flags': if (window.confirm('Delete all flagged sentences?')) { this.flags = []; ls.set(LS + 'flags', this.flags); this.openModal('Flagged sentences', this.flagsHtml()); } break;
			case 'restore': this.restore(); break;
			case 'reset-game':
				if (window.confirm('Reset coins, levels, unlocks and upgrades? Unit scores are kept.')) { this.g = G.blankGame(this.clock.sec()); this.save(); this.session = this.newSession(); this.card = null; this.applyCosmetics(); this.render(); }
				break;
			default: break;
		}
	}
}

window.FC2App = FC2App;
window.addEventListener('DOMContentLoaded', () => { window.fc2App = new FC2App(document.getElementById('app')); });
})();
