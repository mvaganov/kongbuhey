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
const SCORES = [[-2, 'Very hard'], [-1, 'Missed it'], [0, 'Needs practice'], [1, 'Correct'], [2, 'Easy']];
const SCORE_HUE = { '-2': 0, '-1': 22, 0: 48, 1: 95, 2: 135 };
const STARS = ['☆', '★', '★★', '★★★'], RARITY = ['N', 'R', 'SR', 'SSR'];
const TIER_LABEL = ['Unknown', 'Recognized', 'Definition known', 'Known by definition'];
const STATUS_LABEL = { new: '✨ New', learning: '🌱 Learning', growing: '🌿 Growing', ripe: '🌾 Ripe', wilted: '🥀 Wilted', dormant: '💤 Dormant' };
const THEMES = { midnight: ['Midnight', 0], jade: ['Jade', 300], sunset: ['Sunset', 800], neon: ['Neon', 2000] };
const PARTICLES = { sparks: ['Sparks', 0], stars: ['Stars', 250], petals: ['Petals', 600], hangul: ['Hangul burst', 1200] };
const SPEAK_MODES = [['none', "Don't speak"], ['front', 'When the front is shown'], ['back', 'When the back is shown'], ['both', 'Front and back']];
const DEFAULT_OPTS = { reverse: false, speak: 'front', count: 3, onlyOwned: true, v: 2, sound: true, haptics: true, audioTrials: true };
const nowSec = () => Math.floor(Date.now() / 1000);
const dayKey = (offset = 0) => { const d = new Date(Date.now() + offset * 864e5); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const fmt = n => Math.round(n).toLocaleString();
const dur = s => s < 90 ? `${Math.max(1, Math.round(s))}s` : s < 5400 ? `${Math.round(s / 60)}m` : s < 129600 ? `${Math.round(s / 3600)}h` : `${Math.round(s / 86400)}d`;
const hangulOf = text => String(text).replace(/[^가-힣]/g, '');

// A big error panel with copyable text: storage and load problems must never be silent.
const errorLog = [];
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
	box.querySelector('textarea').value = errorLog.map(e => `[${e.at}]${e.n > 1 ? ' x' + e.n : ''} ${e.text}`).join('\n\n') + `\n\n${navigator.userAgent}\n${location.href}`;
}
window.fc2ReportError = reportError;
window.addEventListener('error', ev => { if (!/Cannot set property window/.test(ev.message || '')) reportError('Uncaught error', ev.error || ev.message); });
window.addEventListener('unhandledrejection', ev => reportError('Unhandled promise rejection', ev.reason));

const ls = {
	get(key, fallback) {
		let raw = null;
		try { raw = window.localStorage.getItem(key); } catch (e) { reportError(`Reading saved data (${key}) failed`, e); return fallback; }
		if (raw == null) return fallback;
		try { return JSON.parse(raw); } catch (e) {
			// Never let a corrupt save be silently replaced by a fresh game: keep the raw text and say so.
			try { window.localStorage.setItem(key + '.corrupt', raw); } catch (_) { /* nothing more to do */ }
			reportError(`Saved data (${key}) is unreadable; a copy was kept as ${key}.corrupt`, e);
			return fallback;
		}
	},
	set(key, value) { try { window.localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { reportError(`Saving (${key}) failed`, e); return false; } }
};

class FC2App {
	constructor(root) {
		this.root = root;
		this.units = new Map(window.KR_EN_languageUnits.map(u => [u[C.Id], u]));
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
		this.bind();
		this.ready = this.init();
	}

	newSession() { return { n: 0, due: new Map(), last: null, front: [], combo: 0, round: this.newRound() }; }
	newRound() { return { n: 0, coins: 0, xp: 0, est: 0, promo: 0, harvest: 0, lapsed: 0, trials: 0 }; }

	// ---------- storage ----------
	async init() {
		let records = [];
		if (DEBUG === null) {
			try {
				this.db = new window.KongbuheyDB(); await this.db.open(); records = await this.db.loadAllUnitDataIncremental();
				if (this.db.useMemoryFallback) reportError('Unit database unavailable', new Error('IndexedDB is not available in this browser: unit progress is kept in this browser\'s local storage only and will not show in the spreadsheet.'));
			} catch (e) { this.db = null; reportError('Unit database failed to open', e); }
		}
		for (const rec of records) {
			const c = rec.custom || {};
			if (!this.units.has(rec.unitId)) continue;
			this.prog.set(rec.unitId, { score: Number(c.RecognitionScore) || 0, tier: G.tierIndex(c.LongTermRecognition),
				lastCorrect: Number(c.TimeStampLastCorrect) || 0, lastSeen: Number(c.TimeStampLastSeen) || 0 });
			if (c.notes) this.notes[rec.unitId] = String(c.notes);
		}
		// The localStorage mirror wins a unit only when strictly newer than the database copy.
		const merged = window.FC2Store.mergeProg(this.prog, ls.get(LS + 'prog', {}), id => this.units.has(id));
		this.prog = merged.prog;
		let g = ls.get(LS + 'game', null);
		if (!g || g.v !== 1) g = DEBUG === null ? this.migrate() : G.blankGame(nowSec());
		const blank = G.blankGame(nowSec());
		this.g = { ...blank, ...g, cos: { ...blank.cos, ...g.cos }, totals: { ...blank.totals, ...g.totals } };
		this.g.owned = this.g.owned.filter(id => this.units.has(id));
		for (const id of merged.healed) this.saveUnit(id);
		const sess = window.FC2Store.unpackSession(ls.get(LS + 'session', null), nowSec(), 3 * 3600);
		if (sess) this.session = { ...this.newSession(), ...sess, round: sess.round || this.newRound() };
		this.applyCosmetics();
		this.render();
		if (DEBUG !== null) this.debugScene(DEBUG);
		setInterval(() => { if (this.tab === 'map' && this.modalHidden()) this.renderScreen(false); }, 15000);
	}

	/** First launch: adopt scores, timestamps, notes and flags from flashcards/ (kb.fc.v1.*). Scored cards start owned. */
	migrate() {
		const now = nowSec(), g = G.blankGame(now);
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

	save() { ls.set(LS + 'game', this.g); ls.set(LS + 'session', window.FC2Store.packSession(this.session, nowSec())); this.queueMirror(); }
	/** Write the progress mirror soon (debounced); flush() writes everything now (page hide, tab switch). */
	queueMirror() { if (this.mirrorTimer) return; this.mirrorTimer = setTimeout(() => { this.mirrorTimer = null; ls.set(LS + 'prog', window.FC2Store.packProg(this.prog)); }, 250); }
	flush() {
		if (!this.g) return;
		if (this.mirrorTimer) { clearTimeout(this.mirrorTimer); this.mirrorTimer = null; }
		ls.set(LS + 'prog', window.FC2Store.packProg(this.prog)); ls.set(LS + 'game', this.g); ls.set(LS + 'session', window.FC2Store.packSession(this.session, nowSec()));
	}
	debugScene(name) { if (DEBUG === null) throw new Error('debug scenes need ?debug in the URL'); this.debug = name; window.FC2Debug.apply(this, name); }
	unitOf(id) { return this.prog.get(id) || G.blankUnit(); }
	saveCell(id, colKey, value) { this.queueMirror(); if (this.db) this.db.saveBulkUnitCellValues([{ unitId: id, colKey, value }]).catch(e => reportError('Saving unit data failed', e)); }
	saveUnit(id) {
		this.queueMirror();
		if (!this.db) return;
		const u = this.unitOf(id);
		this.db.saveBulkUnitCellValues([['RecognitionScore', u.score], ['LongTermRecognition', T.TIERS[u.tier]], ['TimeStampLastCorrect', u.lastCorrect],
			['TimeStampLastSeen', u.lastSeen]].map(([colKey, value]) => ({ unitId: id, colKey, value }))).catch(e => reportError('Saving unit progress failed', e));
	}
	markSeen(ids) {
		const t = nowSec();
		for (const id of ids) if (this.units.has(id)) { this.prog.set(id, { ...this.unitOf(id), lastSeen: t }); this.saveCell(id, 'TimeStampLastSeen', t); }
	}
	classify() { return G.classify(this.prog, this.g.owned, nowSec()); }
	counts(st = this.classify()) { const c = { new: 0, learning: 0, growing: 0, ripe: 0, wilted: 0, dormant: 0 }; for (const s of st.values()) c[s]++; return c; }
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
		for (const u of this.units.values()) {
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
		const g = this.g, now = nowSec(), chips = [`Lv ${g.level + 1} in ${G.xpToNext(g.level) - g.xp} XP`], cost = G.pullCost(g);
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
		const g = this.g, now = nowSec(), st = this.classify(), c = this.counts(st);
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
		return `<section class="hive${idle ? ' has' : ''}"><div><b>Hive</b><small>+${fmt(rate)} 냥/h from ${c.growing} growing${full && idle ? ' · <u>store full</u>' : ''}</small></div>
				<button type="button" class="btn gold" data-act="collect" ${idle ? '' : 'disabled'}>Collect <span id="idle">${fmt(idle)}</span></button></section>
			<button type="button" class="play-big${c.ripe + c.wilted ? ' due' : ''}" data-act="tab" data-tab="play"><b>▶ Play</b><small>${waiting || (g.owned.length ? 'Practice, or pull new units' : 'Start with a free pull in the Shop')}</small></button>
			${this.goalsHtml(c)}
			${(g.games || {}).numbers ? '<button type="button" class="btn wide" data-act="nb-open">🔊 Number sound board</button>' : ''}
			${g.owned.length ? this.questsHtml() : ''}
			${g.owned.length ? '' : '<p class="muted center">Your map is empty. The first pull is free.</p><button type="button" class="btn primary wide" data-act="tab" data-tab="shop">🛒 Open the Shop</button>'}
			${packs}<p class="legend">${Object.values(STATUS_LABEL).join(' · ')}</p>`;
	}

	collect(el) {
		const now = nowSec(), n = G.idleEarned(this.g, this.prog, now);
		if (!n) return;
		this.g.coins += n; this.g.totals.earned += n; this.g.lastCollect = now;
		this.save();
		FX.sfx('coin'); FX.buzz(20); FX.fly(el, this.$('#coins'), Math.min(12, 3 + Math.floor(n / 10))); FX.floatText(el, `+${fmt(n)}`, 'gold'); FX.burstAt(el, { count: 24 });
		this.updateHud();
		this.renderScreen(false);
	}

	tileModal(id) {
		const u = this.units.get(id);
		if (!this.g.owned.includes(id)) { this.toast(`Locked · ${u[C.Source]} · unlock with pulls`); FX.sfx('deny'); return; }
		const p = this.unitOf(id), now = nowSec(), s = this.classify().get(id), I = T.INTERVAL[p.tier], rar = G.rarity(u[C.PriorityScore]);
		const when = s === 'growing' ? `Ripe in ${dur(p.lastCorrect + I - now)}` : s === 'ripe' ? `Wilts in ${dur(p.lastCorrect + I * T.WILT_AFTER - now)}` : (s === 'wilted' ? 'A miss now costs a star' : '');
		const row = (k, v) => `<tr><th>${k}</th><td>${v}</td></tr>`;
		this.openModal(`${u[C.Korean]}`, `<div class="unit-en">${escapeHtml(u[C.English])}</div>
			<p class="pill-row"><span class="pill">${STATUS_LABEL[s]}</span><span class="pill">${STARS[p.tier]} ${TIER_LABEL[p.tier]}</span><span class="pill r${rar}">${RARITY[rar]}</span><span class="pill">${escapeHtml(u[C.Source])}</span></p>
			${when ? `<p class="muted">${when}</p>` : ''}
			<table class="kv">${row('RecognitionScore', `${p.score}${G.decay(p, now) ? ` (effective ${G.effectiveScore(p, now)})` : ''}`)}${row('LongTermRecognition', T.TIERS[p.tier])}
			${row('Harvests to next star', p.tier < 3 && p.score >= T.ESTABLISHED ? `${this.g.h[id] || 0}/${T.HARVESTS_TO_PROMOTE[p.tier]}` : '-')}
			${row('TimeStampLastCorrect', R.ago(p.lastCorrect))}${row('TimeStampLastSeen', R.ago(p.lastSeen))}${row('Idle income', s === 'growing' ? `${T.IDLE_RATE[p.tier]} 냥/h` : '0')}</table>
			<div class="btn-row"><button type="button" class="btn primary" data-act="review" data-id="${id}">Review now</button></div>`);
	}

	// ---------- play ----------
	pickCard() {
		const st = this.classify(), pick = G.nextCard(this.g, this.prog, st, this.session);
		this.editingNotes = false;
		if (!pick) { this.card = null; return; }
		const s = st.get(pick.id), u = this.unitOf(pick.id), trial = G.isTrial(u, this.g.h[pick.id] || 0, s);
		this.card = { id: pick.id, mode: trial ? 'trial' : pick.mode, st: s, side: 'front', shownAt: Date.now(), trial: trial ? this.buildTrial(pick.id, u.tier) : null, ...this.generateFor(pick.id) };
	}

	genOptions() {
		const options = { seedOffset: Math.floor(Math.random() * 997) };
		if (this.opts.onlyOwned) { options.onlyFromSet = true; options.allowedUnitIds = new Set(this.g.owned); }
		// Lean toward the units you know least: a slot filler stronger than the owned average is redrawn up to twice. Every unit stays possible.
		const now = nowSec(), strength = id => { const u = this.unitOf(id); if (!u) return 0; return G.effectiveScore(u, now) + u.tier; };
		const owned = this.g.owned, mean = owned.length ? owned.reduce((n, id) => n + strength(id), 0) / owned.length : 0;
		options.slotBias = { retries: 2, reject: unit => strength(unit[C.Id]) > mean };
		return options;
	}

	generateFor(id) {
		try {
			const list = window.generateSentencesForUnit(id, this.opts.count, this.genOptions()), sentences = Array.from(list);
			if (sentences.length) this.prefetchSoon(id, sentences);
			return { sentences, msg: sentences.length ? '' : this.opts.onlyOwned ? 'No examples from your unlocked units yet. They appear as you unlock more, or allow all units in the Menu.' : (list.message || 'No example sentences are available for this unit yet.') };
		} catch (_) { return { sentences: [], msg: 'Could not generate sentences for this unit.' }; }
	}

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
		const regen = '<button type="button" class="btn ghost" data-act="regen">↻ New examples</button>';
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
		if (!this.card || this.card.side !== 'front' || this.card.mode === 'trial') return;
		this.card.side = 'back';
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
		const k = this.card;
		if (!k || k.mode === 'trial' || k.side !== 'back' || k.done) return;
		k.done = true;
		const u = this.unitOf(k.id);
		this.advance(this.settle(G.answer(u, this.g.h[k.id] || 0, v, nowSec(), k.st), v, el, u.tier));
	}

	/** A trial choice was tapped: objective pass or fail, then the back of the card stays up until Continue. */
	choose(i, el) {
		const k = this.card;
		if (!k || k.mode !== 'trial' || k.done) return;
		k.done = true;
		k.passed = k.trial.choices[i].id === k.id;
		this.root.querySelectorAll('#card .choice').forEach((b, j) => { b.disabled = true; if (k.trial.choices[j].id === k.id) b.classList.add('right'); else if (j === i) b.classList.add('wrong'); });
		const u = this.unitOf(k.id);
		this.settle(G.answerTrial(u, this.g.h[k.id] || 0, k.passed, nowSec(), k.st), k.passed ? 1 : -1, el, u.tier);
		k.side = 'back';
		setTimeout(() => { if (this.card !== k) return; this.renderScreen(false); const c = this.$('#card'); if (c) c.classList.add('flip'); this.$('#screen').scrollTop = 0; this.maybeSpeak('back'); }, k.passed ? 650 : 900);
	}

	advance(delay) {
		if (this.session.round.n >= T.ROUND) setTimeout(() => this.roundResults(), delay + 350);
		else setTimeout(() => this.showNextCard(), delay || 120);
	}

	ensureQuests() {
		if (G.ensureQuests(this.g, dayKey(), this.g.owned.some(id => this.unitOf(id).score >= T.ESTABLISHED))) this.save();
	}

	/** Book an answer: unit progress, coins, xp, quests, effects. Returns the ms to wait before moving on. */
	settle(res, v, el, tierBefore) {
		const k = this.card, g = this.g, s = this.session, id = k.id, ev = res.ev, passed = ev.kind === 'trial' && ev.promoted;
		this.prog.set(id, res.unit);
		if (res.h) g.h[id] = res.h; else delete g.h[id];
		this.saveUnit(id);
		const streak = G.touchStreak(g, dayKey(), dayKey(-1));
		s.combo++;
		const swift = (Date.now() - k.shownAt) / 1000 <= T.SWIFT_SEC, crit = ev.kind === 'harvest' && Math.random() < G.critChance(g);
		const coins = G.payout(g, ev, tierBefore, { combo: s.combo, swift, crit }), xp = G.xpFor(ev);
		g.coins += coins; g.totals.earned += coins; g.totals.answers++;
		if (ev.harvested) g.totals.harvests++;
		if (passed) g.totals.trials = (g.totals.trials || 0) + 1;
		const ups = G.addXp(g, xp);
		if (res.unit.score < T.ESTABLISHED) s.due.set(id, s.n + 1 + T.LEARN_GAP[v]); else s.due.delete(id);
		s.n++; s.last = id;
		const r = s.round;
		r.n++; r.coins += coins; r.xp += xp; r.est += ev.established ? 1 : 0; r.promo += ev.promoted ? 1 : 0; r.harvest += ev.harvested ? 1 : 0; r.lapsed += ev.lapsed ? 1 : 0; r.trials += passed ? 1 : 0;
		this.ensureQuests();
		G.questEvent(g, { answers: 1, established: ev.established ? 1 : 0, harvests: ev.harvested ? 1 : 0, trials: passed ? 1 : 0, combo: s.combo });
		this.save();

		const ko = this.units.get(id)[C.Korean], glyphs = this.glyphsFor(id);
		FX.floatText(el, `+${fmt(coins)}${crit ? ' CRIT!' : swift ? ' swift' : ''}`, crit || passed ? 'gold big' : 'gold');
		FX.fly(el, this.$('#coins'), crit || passed ? 12 : Math.min(8, 2 + Math.floor(coins / 6)));
		if (crit) { FX.sfx('crit'); FX.buzz([30, 40, 60]); FX.burstAt(el, { count: 70, power: 12, glyphs }); FX.flash('gold'); }
		else if (ev.harvested) { FX.sfx('harvest', s.combo); FX.buzz(25); FX.burstAt(el, { count: 30, power: 8, glyphs }); }
		else if (v < 0) { FX.sfx('miss'); FX.buzz(ev.kind === 'trial' ? [40, 50, 40] : 15); }
		else { FX.sfx('answer', s.combo); FX.burstAt(el, { count: 8 + Math.min(s.combo, 20), power: 5, glyphs }); }
		let delay = 0;
		if (ev.promoted) { FX.sfx('promote'); FX.flash('gold'); FX.banner(`${ko} ${STARS[res.unit.tier]}`, `${passed ? 'Trial passed' : 'Promoted'}: ${TIER_LABEL[res.unit.tier]}`, 'promo'); delay = 900; }
		else if (ev.established) { FX.sfx('establish'); FX.banner(ko, 'Established: now growing in your hive', 'est'); delay = 700; }
		else if (ev.demoted) { FX.flash('bad'); this.toast(`${ko} wilted and lost a star`); }
		else if (ev.kind === 'trial') FX.flash('bad');
		else if (ev.kind === 'harvest' && ev.lapsed) this.toast(v > 0 ? `${ko} had faded: re-establish it` : `${ko} goes back to learning`);
		if (streak === 'kept') this.toast(`🔥 ${g.streak.n}-day streak: +${Math.round((G.streakMult(g) - 1) * 100)}% coins`);
		if (ups) setTimeout(() => this.levelUp(), delay + 200);
		this.updateHud();
		return delay + (ups ? 1300 : 0);
	}

	levelUp() {
		const g = this.g;
		FX.sfx('level'); FX.buzz([40, 60, 40, 60, 120]); FX.banner(`Level ${g.level}`, `+${fmt(T.LEVEL_COINS * g.level)} 냥`, 'level');
		this.updateHud();
	}

	buildTrial(id, tier) {
		let type = T.TRIAL_TYPES[tier];
		if (type === 'listen' && !(this.opts.audioTrials && 'speechSynthesis' in window)) type = 'meaning';
		const u = this.units.get(id), n = T.TRIAL_CHOICES[tier], label = x => String(type === 'recall' ? x[C.Korean] : x[C.English]);
		const owned = new Set(this.g.owned), seen = new Set([label(u)]), picks = [], all = [...this.units.values()];
		const pos = x => x[C.PartofSpeech] === u[C.PartofSpeech];
		const ok = x => x[C.Id] !== id && x[C.Korean] !== u[C.Korean] && x[C.English] !== u[C.English] && !seen.has(label(x));
		// Distractors: unlocked units of the same part of speech first, then the same pack, then anything.
		for (const pool of [all.filter(x => owned.has(x[C.Id]) && pos(x)), all.filter(x => pos(x) && x[C.Source] === u[C.Source]), all.filter(pos), all]) {
			for (const x of pool.sort(() => Math.random() - 0.5)) {
				if (picks.length >= n - 1) break;
				if (ok(x)) { seen.add(label(x)); picks.push(x); }
			}
		}
		return { type, tier, choices: [u, ...picks].map(x => ({ id: x[C.Id], label: label(x) })).sort(() => Math.random() - 0.5) };
	}

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
		const coins = G.claimQuest(this.g, i);
		if (!coins) { FX.sfx('deny'); return; }
		this.save();
		FX.sfx(i === -1 ? 'crit' : 'coin'); FX.buzz(i === -1 ? [30, 40, 60] : 20); FX.floatText(el, `+${fmt(coins)}`, 'gold big'); FX.fly(el, this.$('#coins'), 10); FX.burstAt(el, { count: i === -1 ? 80 : 30, power: i === -1 ? 12 : 7 });
		if (this.g.lastLevelUps) setTimeout(() => this.levelUp(), 300);
		this.updateHud();
		this.renderTabs();
		this.renderScreen(false);
	}

	ascend() {
		const n = G.sealsAvailable(this.g, this.prog);
		if (n < T.SEAL_MIN || !window.confirm(`Ascend for ${n} seals? Coins and upgrades reset. Units, stars, levels and cosmetics stay.`)) return;
		G.ascend(this.g, this.prog);
		this.save();
		FX.sfx('level'); FX.buzz([60, 60, 60, 60, 160]); FX.flash('gold'); FX.banner('Ascended', `+${n} seals · +${Math.round((G.sealMult(this.g) - 1) * 100)}% coins forever`, 'level');
		this.updateHud();
		this.renderScreen(false);
	}

	roundResults() {
		const g = this.g, r = this.session.round, c = this.counts(), need = G.xpToNext(g.level), cost = G.pullCost(g), combo = Math.min(this.session.combo, G.comboCap(g));
		g.totals.rounds++;
		G.questEvent(g, { rounds: 1 });
		this.save();
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
	pullCandidates() {
		const owned = new Set(this.g.owned);
		return [...this.units.values()].filter(u => !owned.has(u[C.Id])).map(u => ({ id: u[C.Id], pack: String(u[C.Source]), priority: Number(u[C.PriorityScore]) || 0 }));
	}

	shopHtml() {
		const g = this.g, c = this.counts(), cost = G.pullCost(g), nursery = c.new + c.learning, cap = G.nurseryCap(g), left = this.units.size - g.owned.length;
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
		const g = this.g, c = this.counts(), cost = G.pullCost(g);
		if (cost > g.coins || c.new + c.learning >= G.nurseryCap(g)) { FX.sfx('deny'); return; }
		const ids = G.pickPull(this.pullCandidates(), G.pullSize(g), Math.random, this.pullPack || null);
		if (!ids.length) return;
		g.coins -= cost; g.pulls++; g.owned.push(...ids);
		this.save();
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
		const g = this.g, price = G.upCost(g, key);
		if (price > g.coins || G.upLevel(g, key) >= T.UPGRADES[key].max) { FX.sfx('deny'); return; }
		g.coins -= price; g.up[key] = G.upLevel(g, key) + 1;
		this.save();
		FX.sfx('buy'); FX.buzz(20); FX.burstAt(el, { count: 26, colors: ['#6cb6ff', '#cfe6ff', '#ffd166'] });
		this.updateHud();
		this.renderScreen(false);
	}

	cosmetic(kind, key, el) {
		const g = this.g, price = (kind === 'theme' ? THEMES : PARTICLES)[key][1];
		if (!g.cos.owned.includes(key)) {
			if (price > g.coins) { FX.sfx('deny'); return; }
			g.coins -= price; g.cos.owned.push(key);
			FX.sfx('buy');
		}
		g.cos[kind] = key;
		this.save();
		this.applyCosmetics();
		FX.burstAt(el, { count: 30, glyphs: kind === 'particle' && key === 'hangul' ? ['공', '부', '해'] : undefined });
		this.updateHud();
		this.renderScreen(false);
	}

	// ---------- sentence comprehension test ----------
	enOf(s) { return String(s.enNatural || s.en || '').trim(); }

	/**
	 * The sentence's translation (or, when rev, its Korean) plus 3 close wrong ones. Close = the same nouns: candidates are generated with those
	 * nouns preferred, then ranked by how many of the sentence's nouns they share (and how few extra nouns they bring), so only the verb,
	 * tense or other details differ. Each choice carries the unit ids of its sentence.
	 */
	buildSentenceTest(s, rev = false, cardId = null) {
		const k = { id: cardId === null ? this.card.id : cardId }, mine = new Set(R.unitIdsOf(s)), right = this.enOf(s);
		const norm = t => t.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim();
		const isNoun = id => { const p = (this.units.get(id) || [])[C.PartofSpeech]; return p === 'Noun' || p === 'Pronoun'; };
		const nounsOf = ids => new Set(ids.filter(isNoun));
		const nouns = nounsOf([...mine]);
		const seen = new Set([norm(right), norm(String(s.enLiteral || ''))]), pool = [];
		const shuffle = a => a.sort(() => Math.random() - 0.5), owned = this.g.owned;
		const inIt = [...mine].filter(id => id !== k.id && owned.includes(id));
		const sources = [k.id, ...shuffle(inIt.filter(id => !isNoun(id))), ...shuffle(owned.filter(id => id !== k.id && !mine.has(id) && !isNoun(id))).slice(0, 5), ...shuffle(inIt.filter(isNoun))].slice(0, 10);
		let perfect = 0;   // candidates with exactly the sentence's nouns: enough of them and we stop generating
		for (const [si, id] of sources.entries()) {
			if (perfect >= 3) break;
			let list = [];
			try { for (let pass = 0; pass < (si < 3 ? 2 : 1); pass++) list.push(...Array.from(window.generateSentencesForUnit(id, 4, { ...this.genOptions(), preferUnitIds: nouns }))); } catch (_) { /* fewer candidates */ }
			for (const c of list) {
				const en = this.enOf(c), key = norm(en);
				if (!en || c.ko === s.ko || seen.has(key)) continue;
				seen.add(key);
				const ids = R.unitIdsOf(c), cn = nounsOf(ids), same = [...nouns].filter(x => cn.has(x)).length;
				if (same === nouns.size && cn.size === same) perfect++;
				pool.push({ text: rev ? String(c.ko) : en, ids, score: same * 10 - (cn.size - same) * 6 + ids.filter(x => mine.has(x)).length, r: Math.random() });
			}
		}
		if (!right || pool.length < 3) return null;
		pool.sort((a, b) => b.score - a.score || a.r - b.r);
		return [{ text: rev ? String(s.ko) : right, ok: true, ids: [...mine] }, ...pool.slice(0, 3).map(p => ({ text: p.text, ok: false, ids: p.ids }))].sort(() => Math.random() - 0.5);
	}

	get STEST_GUARD_MS() { return this.guardMs === undefined ? 450 : this.guardMs; }

	sentenceTest(i) {
		const k = this.card, s = k && k.sentences[i];
		if (!s || k.done || k.side !== 'front') return;
		const rev = this.opts.reverse, pre = s.preTest, choices = pre && pre.key === `${rev}|${this.g.owned.length}` && pre.choices ? pre.choices : this.buildSentenceTest(s, rev);
		s.preTest = null;   // each quiz is fresh: the next tap builds (or prefetches) a new one
		if (!choices) { this.toast('No quick test for this sentence. Try ↻ New examples'); FX.sfx('deny'); return; }
		this.stest = { k, s, choices, rev, done: false, picked: -1, readyAt: Date.now() + this.STEST_GUARD_MS };
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
		if (Date.now() < t.readyAt) return;   // a tap meant for the 🎯 button (or made while the quiz was appearing) must not answer it
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
		const k = this.card, g = this.g, now = nowSec(), el = this.$('#card'), u = this.unitOf(k.id);
		k.done = true;
		if (!ok) { this.advance(this.settle(G.answer(u, g.h[k.id] || 0, -1, now, k.st), -1, el, u.tier)); return; }
		const st = this.classify(), rows = [], before = { ...u };
		let xp = 0, coins = 0, ups = 0;
		const credit = (id, row) => {
			const r = this.creditAnswer(id, row.n ? G.status(this.unitOf(id), nowSec()) : st.get(id));
			row.n++; row.coins += r.coins; row.xp += r.xp; row.harvested = row.harvested || r.ev.harvested; row.established = row.established || r.ev.established; row.promoted = row.promoted || r.ev.promoted;
			coins += r.coins; xp += r.xp; ups += r.ups;
		};
		for (const id of R.unitIdsOf(s)) {
			if (id === k.id || !g.owned.includes(id) || G.isTrial(this.unitOf(id), g.h[id] || 0, st.get(id))) continue;
			const row = { id, n: 0, coins: 0, xp: 0, before: { ...this.unitOf(id) } };
			credit(id, row); credit(id, row);
			row.after = { ...this.unitOf(id) }; rows.push(row);
		}
		// The card's own unit: its normal answer (all the usual effects), then 2 more.
		const delay = this.settle(G.answer(u, g.h[k.id] || 0, 1, now, k.st), 1, el, u.tier);
		const own = { id: k.id, n: 1, coins: 0, xp: 0, before, own: true };
		credit(k.id, own); credit(k.id, own);
		own.after = { ...this.unitOf(k.id) };
		this.save();
		const total = this.bonusShow(el, [own, ...rows], coins, xp);
		if (ups) setTimeout(() => this.levelUp(), delay + 500);
		this.updateHud();
		this.advance(Math.max(delay, total));
	}

	/** One right answer for a unit that is not the card being settled: everything an answer pays, without per-answer effects. */
	creditAnswer(id, st) {
		const g = this.g, ss = this.session, now = nowSec(), u = this.unitOf(id), h = g.h[id] || 0;
		const res = G.answer(u, h, 1, now, st), ev = res.ev;
		this.prog.set(id, res.unit);
		if (res.h) g.h[id] = res.h; else delete g.h[id];
		this.saveUnit(id);
		ss.combo++;
		const coins = G.payout(g, ev, u.tier, { combo: ss.combo, swift: false, crit: false }), xp = G.xpFor(ev);
		g.coins += coins; g.totals.earned += coins; g.totals.answers++;
		if (ev.harvested) g.totals.harvests++;
		const ups = G.addXp(g, xp);
		if (res.unit.score < T.ESTABLISHED) ss.due.set(id, ss.n + 1 + T.LEARN_GAP[1]); else ss.due.delete(id);
		const r = ss.round;
		r.coins += coins; r.xp += xp; r.est += ev.established ? 1 : 0; r.harvest += ev.harvested ? 1 : 0; r.lapsed += ev.lapsed ? 1 : 0;
		G.questEvent(g, { answers: 1, established: ev.established ? 1 : 0, harvests: ev.harvested ? 1 : 0, combo: ss.combo });
		return { coins, xp, ups, ev };
	}

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
		const g = this.g;
		if ((g.games || {}).numbers || G.NUMBER_COST > g.coins) { FX.sfx('deny'); return; }
		g.coins -= G.NUMBER_COST; g.games = { ...g.games, numbers: 1 };
		this.save(); FX.sfx('buy'); FX.buzz(20); FX.burstAt(el, { count: 30 });
		this.updateHud(); this.renderScreen(false); this.nbOpen();
	}

	nbOpen() {
		const prev = this.nb;
		this.nb = { mode: prev ? prev.mode : 'both', q: null, streak: 0, right: 0, total: 0, done: false, picked: -1 };
		this.nbNext();
	}

	nbNext() {
		const n = this.nb;
		n.q = G.numberQuestion(n.mode, Math.random, n.q); n.done = false; n.picked = -1;
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
			if (n.streak > ((g.games || {}).numbersBest || 0)) { g.games = { ...g.games, numbersBest: n.streak }; this.save(); }
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
		return `<section class="panel"><h2>Progress</h2><table class="kv"><tr><th>Units unlocked</th><td>${g.owned.length} / ${this.units.size}</td></tr><tr><th>Stars · trials passed</th><td>${stars} ★ · ${fmt(t.trials || 0)}</td></tr><tr><th>Seals</th><td>${g.seals || 0} (+${Math.round((G.sealMult(g) - 1) * 100)}% coins)</td></tr>
				<tr><th>Growing / ripe / wilted</th><td>${c.growing} / ${c.ripe} / ${c.wilted + c.dormant}</td></tr><tr><th>Answers · harvests · rounds</th><td>${fmt(t.answers)} · ${fmt(t.harvests)} · ${fmt(t.rounds)}</td></tr>
				<tr><th>Coins earned</th><td>${fmt(t.earned)} 냥</td></tr><tr><th>Day streak</th><td>${g.streak.n} (+${Math.round((G.streakMult(g) - 1) * 100)}% coins)</td></tr></table></section>
			<section class="panel"><h2>Options</h2>${check('reverse', 'Test the Korean: show English on the front')}
				<label class="row">Speak the Korean unit ${select('speak', SPEAK_MODES, o.speak)}</label>
				<label class="row">Example sentences per card ${select('count', [1, 2, 3, 4, 5, 6].map(n => [n, n]), o.count)}</label>
				${check('onlyOwned', 'Build examples only from unlocked units')}${check('audioTrials', 'Listening trials (hear the Korean, pick the meaning)')}${check('sound', 'Sound effects')}${check('haptics', 'Vibration')}</section>
			<section class="panel"><h2>Data</h2><div class="btn-row"><button type="button" class="btn" data-act="flags-open">Flagged sentences (${this.flags.length})</button>
				<button type="button" class="btn" data-act="backup-open">Backup / restore</button></div>
				<div class="btn-row"><a class="btn" href="../webapp/index.html">Spreadsheet (webapp)</a><a class="btn" href="../flashcards/index.html">Old flashcards</a></div>
				<div class="btn-row"><button type="button" class="btn danger" data-act="reset-game">Reset game progress</button></div>
				<p class="muted">Reset clears coins, levels, unlocks and upgrades. Unit scores in the spreadsheet stay.</p></section>`;
	}

	backupJson() {
		const units = {};
		for (const id of this.g.owned) { const u = this.unitOf(id); units[id] = [u.score, u.tier, u.lastCorrect, u.lastSeen]; }
		return JSON.stringify({ app: 'kongbuhey-fc2', version: 1, game: this.g, opts: this.opts, flags: this.flags, units, notes: this.notes });
	}

	restore() {
		const msg = this.$('#backup-msg');
		try {
			const data = JSON.parse(this.$('#backup-text').value);
			if (data.app !== 'kongbuhey-fc2' || !data.game) throw new Error('Not an fc2 backup');
			this.g = { ...G.blankGame(nowSec()), ...data.game };
			this.opts = { ...DEFAULT_OPTS, ...(data.opts || {}) };
			this.flags = data.flags || [];
			for (const [k, a] of Object.entries(data.units || {})) { const id = Number(k); this.prog.set(id, { score: a[0], tier: a[1], lastCorrect: a[2], lastSeen: a[3] }); this.saveUnit(id); }
			for (const [k, text] of Object.entries(data.notes || {})) { this.notes[k] = text; this.saveCell(Number(k), 'notes', text); }
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
		this.root.addEventListener('change', ev => {
			const t = ev.target;
			if (t.matches('[data-pack]')) { this.pullPack = t.value; return; }
			const opt = t.dataset && t.dataset.opt;
			if (!opt) return;
			this.opts[opt] = t.type === 'checkbox' ? t.checked : (opt === 'count' ? parseInt(t.value, 10) : t.value);
			ls.set(LS + 'opts', this.opts);
			this.applyCosmetics();
			if (this.card && (opt === 'count' || opt === 'onlyOwned')) Object.assign(this.card, this.generateFor(this.card.id));
		});
		this.root.addEventListener('input', ev => {
			const t = ev.target;
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
			case 'tile': this.tileModal(Number(el.dataset.id)); break;
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
			case 'regen': Object.assign(this.card, this.generateFor(this.card.id)); this.renderScreen(false); break;
			case 'notes-toggle': this.editingNotes = !this.editingNotes; this.renderScreen(false); break;
			case 'pull': this.pull(); break;
			case 'upgrade': this.upgrade(el.dataset.key, el); break;
			case 'cosmetic': this.cosmetic(el.dataset.kind, el.dataset.key, el); break;
			case 'close-modal': this.closeModal(); break;
			case 'flags-open': this.openModal('Flagged sentences', this.flagsHtml()); break;
			case 'backup-open': this.openModal('Backup / restore', `<p class="muted">Game state, options, flags, notes and the scores of unlocked units.</p>
				<textarea id="backup-text" class="export" rows="10">${escapeHtml(this.backupJson())}</textarea><div class="btn-row"><button type="button" class="btn" data-act="copy" data-target="backup-text">Copy</button>
				<button type="button" class="btn danger" data-act="restore">Restore from text</button></div><p id="backup-msg" class="muted"></p>`); break;
			case 'copy': this.copyText(this.$('#' + el.dataset.target), el); break;
			case 'download-flags': this.download('flags-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.json', JSON.stringify(this.flagPayload(), null, 2)); break;
			case 'clear-flags': if (window.confirm('Delete all flagged sentences?')) { this.flags = []; ls.set(LS + 'flags', this.flags); this.openModal('Flagged sentences', this.flagsHtml()); } break;
			case 'restore': this.restore(); break;
			case 'reset-game':
				if (window.confirm('Reset coins, levels, unlocks and upgrades? Unit scores are kept.')) { this.g = G.blankGame(nowSec()); this.save(); this.session = this.newSession(); this.card = null; this.applyCosmetics(); this.render(); }
				break;
			default: break;
		}
	}
}

window.FC2App = FC2App;
window.addEventListener('DOMContentLoaded', () => { window.fc2App = new FC2App(document.getElementById('app')); });
})();
