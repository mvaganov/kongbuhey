/**
 * fc2/controller.js - the fc2 game state and flow without any DOM (browser global FC2Controller, or CommonJS for tools/fc2_sim.js).
 *
 * FC2Core owns the state (game, unit progress, session, current card, options, notes, recently used units) and the flow that changes
 * it. fc2/app.js is the view: it renders this state, turns taps into core actions and plays effects (sound, particles, banners) for
 * the events an action returns. tools/fc2_sim.js drives the same core headless, with a simulated clock and a seeded random.
 *
 * Everything environment-specific is injected (see the constructor): the clock, the random source, the sentence generator, whether
 * speech is available, and the persistence callbacks. Rules (scores, payouts, pulls, quests) stay in fc2/game.js.
 */
(function() {
'use strict';

const isNode = typeof module !== 'undefined' && module.exports;
const G = isNode ? require('./game.js') : window.FC2Game;
const Q = isNode ? require('./queue.js') : window.FC2Queue;
const R = isNode ? require('../flashcards/render.js') : window.FlashcardRender;
const T = G.T;
// store.js is optional in the browser (a stale cached page may lack it); backups need it.
const Store = () => {
	const S = isNode ? require('./store.js') : window.FC2Store;
	if (!S) throw new Error('backup needs store.js, which did not load: reload the page');
	return S;
};

/** Options of a new player (Menu > Options). */
const DEFAULT_OPTS = { reverse: false, speak: 'front', count: 3, onlyOwned: true, v: 2, sound: true, haptics: true, audioTrials: true, names: { off: [], custom: [] } };

const defaultClock = () => {
	const clock = { sec: () => Math.floor(clock.ms() / 1000), ms: () => Date.now() };
	clock.day = (offset = 0) => { const d = new Date(clock.ms() + offset * 864e5); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
	return clock;
};

class FC2Core {
	/**
	 * env:
	 *   units      Map id -> unit row (playable units plus runtime custom names)
	 *   C          DATA_SCHEMA (column indexes)
	 *   clock      { sec(), ms(), day(offset) }            default: the real clock
	 *   random     () => [0, 1)                            default: Math.random
	 *   generate   (unitId, count, options) => sentences   the sentence adapter (shared/sentence_adapter.js generateSentencesForUnit)
	 *   templateIds () => verified template ids            for the "time to use it" queue; null disables the queue
	 *   canSpeak   () => boolean                           listening trials need speech synthesis
	 *   persist    { game(), unit(id), cell(id, col, value) }   called after state changes (the app writes storage; the sim keeps memory)
	 *   onSentences (id, sentences) => void                 optional: the app prefetches quizzes for a card's examples
	 */
	constructor(env) {
		this.env = env;
		this.units = env.units;
		this.C = env.C;
		this.clock = env.clock || defaultClock();
		this.rand = env.random || Math.random;
		this.persist = env.persist || { game() {}, unit() {}, cell() {} };
		this.nameRows = [...this.units.values()].filter(u => G.isNameRow(u, this.C));
		this.g = null;
		this.prog = new Map();   // id -> { score, tier, lastCorrect, lastSeen }
		this.notes = {};
		this.opts = {};
		this.card = null;
		this.recent = [];
		this.session = this.newSession();
	}

	// ---------- whole-state operations ----------
	/** A fresh game (coins, levels, unlocks, upgrades reset). Unit progress is kept unless keepProgress is false. */
	newGame(keepProgress = true) {
		this.g = G.blankGame(this.clock.sec());
		if (!keepProgress) { this.prog = new Map(); this.notes = {}; }
		this.session = this.newSession();
		this.card = null;
		this.ensureCoreUnlocked();
		this.persist.game();
	}

	/** Backup text (Menu > Backup / restore; format in fc2/store.js). */
	backupJson() {
		const prog = new Map(this.g.owned.map(id => [id, this.unitOf(id)]));
		return Store().packBackup({ game: this.g, opts: this.opts, prog, notes: this.notes });
	}

	/**
	 * Load a backup (text or parsed object) into this state, like the app's Restore: the game and options are replaced (missing fields
	 * from the defaults), unit progress and notes are merged in. Returns { ids, noteIds, flags } for the caller to persist.
	 */
	loadBackup(textOrObj) {
		const data = Store().unpackBackup(textOrObj);
		this.g = { ...G.blankGame(this.clock.sec()), ...data.game };
		this.opts = { ...DEFAULT_OPTS, ...data.opts };
		for (const [id, u] of data.prog) this.prog.set(id, u);
		for (const [k, text] of Object.entries(data.notes)) this.notes[k] = text;
		this.session = this.newSession();
		this.card = null;
		return { ids: [...data.prog.keys()], noteIds: Object.keys(data.notes).map(Number), flags: data.flags };
	}

	/** Leaving the Play screen ends the combo. */
	pauseSession() { this.session.combo = 0; }
	/** Show unit id next (Review now, or a tapped word in an example). first: ahead of anything already queued. */
	queueNext(id, first = false) {
		if (first) this.session.front.unshift(id);
		else if (!this.session.front.includes(id)) this.session.front.push(id);
	}

	newSession() { return { n: 0, due: new Map(), last: null, front: [], combo: 0, round: this.newRound() }; }
	newRound() { return { n: 0, coins: 0, xp: 0, est: 0, promo: 0, harvest: 0, lapsed: 0, trials: 0 }; }

	// ---------- reading state ----------
	unitOf(id) { return this.prog.get(id) || G.blankUnit(); }
	classify() { return G.classify(this.prog, this.g.owned, this.clock.sec()); }
	counts(st = this.classify()) { const c = { new: 0, learning: 0, growing: 0, ripe: 0, wilted: 0, dormant: 0 }; for (const s of st.values()) c[s]++; return c; }
	/** Units that can be pulled, owned and shown: everything except runtime custom names. */
	playableUnits() { return [...this.units.values()].filter(u => u[this.C.Source] !== G.CUSTOM_NAME_SOURCE); }
	pullCandidates() {
		const C = this.C, owned = new Set(this.g.owned);
		return this.playableUnits().filter(u => !owned.has(u[C.Id])).map(u => ({ id: u[C.Id], pack: String(u[C.Source]), priority: Number(u[C.PriorityScore]) || 0 }));
	}

	/** Units marked SemanticData.alwaysUnlocked (core grammar such as ~아요, ~습니다, 은/는) are always unlocked. */
	ensureCoreUnlocked() {
		if (!this.g) return;
		const C = this.C;
		if (!this.coreIds) this.coreIds = [...this.units.values()].filter(u => u[C.SemanticData] && u[C.SemanticData].alwaysUnlocked).map(u => u[C.Id]);
		G.ensureUnlocked(this.g, this.coreIds);
	}

	markSeen(ids) {
		const t = this.clock.sec();
		for (const id of ids) if (this.units.has(id)) { this.prog.set(id, { ...this.unitOf(id), lastSeen: t }); this.persist.cell(id, 'TimeStampLastSeen', t); }
	}

	// ---------- example sentences ----------
	templateIds() { return this.env.templateIds ? this.env.templateIds() : null; }

	// G.sentenceOptions (game.js) is shared with tools/save_inspect.js, which replays a save's generation.
	genOptions(targetId = null) {
		const ids = Q ? this.templateIds() : null, queue = ids ? Q.normalize(this.g.vq, ids) : null;
		return G.sentenceOptions({ owned: this.g.owned, opts: this.opts, unitOf: id => this.unitOf(id), now: this.clock.sec(), queue, idOf: u => u[this.C.Id], recent: this.recent || [], targetId,
			names: G.nameUse(this.nameRows || [], this.opts.names, this.C), random: this.rand });
	}

	generateFor(id) {
		try {
			const list = this.env.generate(id, this.opts.count, this.genOptions(id)), sentences = Array.from(list);
			if (sentences.length) {
				this.recent = G.pushRecent(this.recent, G.contentUnitIds(sentences));
				this.vqUsed(sentences);
				if (this.env.onSentences) this.env.onSentences(id, sentences);
			}
			return { sentences, msg: sentences.length ? '' : this.opts.onlyOwned ? 'No examples from your unlocked units yet. They appear as you unlock more, or allow all units in the Menu.' : (list.message || 'No example sentences are available for this unit yet.') };
		} catch (_) { return { sentences: [], msg: 'Could not generate sentences for this unit.' }; }
	}

	/** A generated verified template goes to the back of the "time to use it" queue. */
	vqUsed(sentences) {
		const ids = Q ? this.templateIds() : null;
		if (!ids) return;
		const used = sentences.map(s => s.verifiedTemplateId).filter(Boolean);
		if (!used.length) return;
		this.g.vq = used.reduce((q, tid) => Q.toBack(q, ids, tid), this.g.vq);
		this.persist.game();
	}

	// ---------- trials ----------
	buildTrial(id, tier) {
		const C = this.C;
		let type = T.TRIAL_TYPES[tier];
		if (type === 'listen' && !(this.opts.audioTrials && this.env.canSpeak && this.env.canSpeak())) type = 'meaning';
		const u = this.units.get(id), n = T.TRIAL_CHOICES[tier], label = x => String(type === 'recall' ? x[C.Korean] : x[C.English]);
		// Two answers that differ only by case, whitespace or a parenthetical ("who" vs "who (subject)") are the same answer to the player.
		const key = x => { const t = label(x).replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase(); return t || label(x).trim().toLowerCase(); };
		const owned = new Set(this.g.owned), seen = new Set([key(u)]), picks = [], all = this.playableUnits();
		const pos = x => x[C.PartofSpeech] === u[C.PartofSpeech];
		const ok = x => x[C.Id] !== id && x[C.Korean] !== u[C.Korean] && x[C.English] !== u[C.English] && !seen.has(key(x));
		// Distractors: unlocked units of the same part of speech first, then the same pack, then anything.
		for (const pool of [all.filter(x => owned.has(x[C.Id]) && pos(x)), all.filter(x => pos(x) && x[C.Source] === u[C.Source]), all.filter(pos), all]) {
			for (const x of pool.sort(() => this.rand() - 0.5)) {
				if (picks.length >= n - 1) break;
				if (ok(x)) { seen.add(key(x)); picks.push(x); }
			}
		}
		return { type, tier, choices: [u, ...picks].map(x => ({ id: x[C.Id], label: label(x) })).sort(() => this.rand() - 0.5) };
	}

	// ---------- sentence comprehension test ----------
	enOf(s) { return String(s.enNatural || s.en || '').trim(); }

	/**
	 * The sentence's translation (or, when rev, its Korean) plus 3 close wrong ones. Close = the same nouns: candidates are generated with those
	 * nouns preferred, then ranked by how many of the sentence's nouns they share (and how few extra nouns they bring), so only the verb,
	 * tense or other details differ. Each choice carries the unit ids of its sentence.
	 */
	buildSentenceTest(s, rev = false, cardId = null) {
		const C = this.C;
		const k = { id: cardId === null ? this.card.id : cardId }, mine = new Set(R.unitIdsOf(s)), right = this.enOf(s);
		const norm = t => t.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim();
		const isNoun = id => { const p = (this.units.get(id) || [])[C.PartofSpeech]; return p === 'Noun' || p === 'Pronoun'; };
		const nounsOf = ids => new Set(ids.filter(isNoun));
		const cardNoun = isNoun(k.id), nouns = nounsOf([...mine].filter(id => !(cardNoun && id === k.id)));   // when the tested unit is a noun, its slot must differ in every option
		const seen = new Set([norm(right), norm(String(s.enLiteral || ''))]), pool = [];
		const shuffle = a => a.sort(() => this.rand() - 0.5), owned = this.g.owned;
		const inIt = [...mine].filter(id => id !== k.id && owned.includes(id));
		const sources = [...(cardNoun ? [] : [k.id]), ...shuffle(inIt.filter(id => !isNoun(id))), ...shuffle(owned.filter(id => id !== k.id && !mine.has(id) && !isNoun(id))).slice(0, 5), ...shuffle(inIt.filter(isNoun))].slice(0, 10);
		// Owned set and strength mean once per quiz, not once per generation call (~30). No queue order: wrong answers follow the queue's
		// front templates every time (they never rotate it), so they come from the random seeded pick instead, which varies more.
		const genBase = this.genOptions();
		delete genBase.queueOrder;
		let perfect = 0;   // candidates with exactly the sentence's nouns: enough of them and we stop generating
		// A cheap budget first (fast); only when it finds fewer than 3 distinct wrong answers (small unlock sets) retry with a generous one.
		for (const budget of [{ n: 4, deep: 3, passes: 2, perfect: 3 }, { n: 6, deep: 4, passes: 3, perfect: 6 }]) {
			if (pool.length >= 3 && (!cardNoun || new Set(pool.map(p => p.repl.slice().sort().join())).size >= 3)) break;   // noun cards also want 3 different replacement nouns
			for (const [si, id] of sources.entries()) {
				if (perfect >= budget.perfect) break;
				let list = [];
				try { for (let pass = 0; pass < (si < budget.deep ? budget.passes : 1); pass++) list.push(...Array.from(this.env.generate(id, budget.n, { ...genBase, seedOffset: Math.floor(this.rand() * 997), preferUnitIds: nouns }))); } catch (_) { /* fewer candidates */ }
				for (const c of list) {
					const en = this.enOf(c), key = norm(en);
					if (!en || c.ko === s.ko || seen.has(key)) continue;
					const ids = R.unitIdsOf(c);
					if (cardNoun && ids.includes(k.id)) continue;   // the tested noun itself never appears in a wrong answer
					seen.add(key);
					const cn = nounsOf(ids), same = [...nouns].filter(x => cn.has(x)).length, repl = [...cn].filter(x => !nouns.has(x)), off = Math.abs(repl.length - (cardNoun ? 1 : 0));
					if (same === nouns.size && off === 0) perfect++;
					pool.push({ text: rev ? String(c.ko) : en, ids, repl, score: same * 10 - off * 6 + ids.filter(x => mine.has(x)).length, r: this.rand() });
				}
			}
		}
		if (!right || pool.length < 3) return null;
		pool.sort((a, b) => b.score - a.score || a.r - b.r);
		let picked = pool.slice(0, 3);
		if (cardNoun) {   // each wrong answer swaps in a different noun: best-ranked first, no replacement noun used twice, then fill from the rest
			const used = new Set(), by = [];
			for (const p of pool) { if (by.length >= 3) break; if (p.repl.some(x => used.has(x))) continue; p.repl.forEach(x => used.add(x)); by.push(p); }
			for (const p of pool) { if (by.length >= 3) break; if (!by.includes(p)) by.push(p); }
			picked = by;
		}
		return [{ text: rev ? String(s.ko) : right, ok: true, ids: [...mine] }, ...picked.map(p => ({ text: p.text, ok: false, ids: p.ids }))].sort(() => this.rand() - 0.5);
	}

	// ---------- the card loop ----------
	ensureQuests() {
		if (G.ensureQuests(this.g, this.clock.day(), this.g.owned.some(id => this.unitOf(id).score >= T.ESTABLISHED))) this.persist.game();
	}

	/** The next card (or null when nothing is owned), with its trial and example sentences. */
	pickCard() {
		const st = this.classify(), pick = G.nextCard(this.g, this.prog, st, this.session);
		if (!pick) { this.card = null; return null; }
		const s = st.get(pick.id), u = this.unitOf(pick.id), trial = G.isTrial(u, this.g.h[pick.id] || 0, s);
		this.card = { id: pick.id, mode: trial ? 'trial' : pick.mode, st: s, side: 'front', shownAt: this.clock.ms(), trial: trial ? this.buildTrial(pick.id, u.tier) : null, ...this.generateFor(pick.id) };
		return this.card;
	}

	/** Turn the front of a learn/harvest card over. False when there is nothing to flip. */
	flip() {
		if (!this.card || this.card.side !== 'front' || this.card.mode === 'trial') return false;
		this.card.side = 'back';
		return true;
	}

	/**
	 * Book an answer for the current card: unit progress, coins, xp, quests, streak, the learning queue. Returns what the view needs for its
	 * effects: { id, ev, coins, xp, ups, crit, swift, passed, streak, combo, unit }.
	 */
	settle(res, v, tierBefore) {
		const k = this.card, g = this.g, s = this.session, id = k.id, ev = res.ev, passed = ev.kind === 'trial' && ev.promoted;
		this.prog.set(id, res.unit);
		if (res.h) g.h[id] = res.h; else delete g.h[id];
		this.persist.unit(id);
		const streak = G.touchStreak(g, this.clock.day(), this.clock.day(-1));
		s.combo++;
		const swift = (this.clock.ms() - k.shownAt) / 1000 <= T.SWIFT_SEC, crit = ev.kind === 'harvest' && this.rand() < G.critChance(g);
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
		this.persist.game();
		return { id, ev, coins, xp, ups, crit, swift, passed, streak, combo: s.combo, unit: res.unit };
	}

	/** Self-score v (-2..+2) for a flipped learn/harvest card. Null when the card cannot be scored now. */
	answerSelf(v) {
		const k = this.card;
		if (!k || k.mode === 'trial' || k.side !== 'back' || k.done) return null;
		k.done = true;
		const u = this.unitOf(k.id);
		return this.settle(G.answer(u, this.g.h[k.id] || 0, v, this.clock.sec(), k.st), v, u.tier);
	}

	/** Trial choice i: objective pass or fail; the back of the card stays up until continueCard(). Null when not answerable. */
	answerTrial(i) {
		const k = this.card;
		if (!k || k.mode !== 'trial' || k.done) return null;
		k.done = true;
		k.passed = k.trial.choices[i].id === k.id;
		const u = this.unitOf(k.id);
		const r = this.settle(G.answerTrial(u, this.g.h[k.id] || 0, k.passed, this.clock.sec(), k.st), k.passed ? 1 : -1, u.tier);
		k.side = 'back';
		return r;
	}

	/** After a trial's verdict: true when the card may be left (the view then advances). */
	continueCard() {
		const k = this.card;
		if (!k || !k.done || k.left) return false;
		k.left = true;
		return true;
	}

	/**
	 * Sentence comprehension test answered. Wrong: "Missed it" for the card ({ wrong: settle result }). Right: every unlocked unit in the
	 * sentence gets 2 "Correct" answers and the card's own unit its normal answer plus 2 more ({ own, rows, coins, xp, ups, settled }).
	 * Units waiting on a promotion trial are skipped. hooks.settled(r) runs right after the card's own answer is booked (where the view
	 * plays that answer's effects), before the 2 extra credits, so the effects see the state at that moment.
	 */
	answerSentence(s, ok, hooks = {}) {
		const k = this.card, g = this.g, now = this.clock.sec(), u = this.unitOf(k.id);
		k.done = true;
		if (!ok) {
			const wrong = this.settle(G.answer(u, g.h[k.id] || 0, -1, now, k.st), -1, u.tier);
			return { wrong, settledOut: hooks.settled ? hooks.settled(wrong) : undefined };
		}
		const st = this.classify(), rows = [], before = { ...u };
		let xp = 0, coins = 0, ups = 0;
		const credit = (id, row) => {
			const r = this.creditAnswer(id, row.n ? G.status(this.unitOf(id), this.clock.sec()) : st.get(id));
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
		const settled = this.settle(G.answer(u, g.h[k.id] || 0, 1, now, k.st), 1, u.tier);
		const settledOut = hooks.settled ? hooks.settled(settled) : undefined;
		const own = { id: k.id, n: 1, coins: 0, xp: 0, before, own: true };
		credit(k.id, own); credit(k.id, own);
		own.after = { ...this.unitOf(k.id) };
		this.persist.game();
		return { settled, settledOut, own, rows: [own, ...rows], coins, xp, ups };
	}

	/** True when the round is complete (the view shows the results, then nextRound()). */
	roundDone() { return this.session.round.n >= T.ROUND; }

	/** Book the end of a round; returns the finished round and the numbers the results screen shows. */
	endRound() {
		const g = this.g, r = this.session.round, c = this.counts(), need = G.xpToNext(g.level), cost = G.pullCost(g), combo = Math.min(this.session.combo, G.comboCap(g));
		g.totals.rounds++;
		G.questEvent(g, { rounds: 1 });
		this.persist.game();
		return { r, c, need, cost, combo };
	}

	/** A fresh round and its first card. */
	nextRound() {
		this.session.round = this.newRound();
		return this.pickCard();
	}

	// ---------- economy ----------
	/** Idle coins from growing units; returns the amount collected (0 = nothing to collect). */
	collect() {
		const now = this.clock.sec(), n = G.idleEarned(this.g, this.prog, now);
		if (!n) return 0;
		this.g.coins += n; this.g.totals.earned += n; this.g.lastCollect = now;
		this.persist.game();
		return n;
	}

	/** Why a pull is not possible now ('coins' | 'nursery'), or '' when it is. */
	pullBlocked() {
		const g = this.g, c = this.counts();
		return G.pullCost(g) > g.coins ? 'coins' : c.new + c.learning >= G.nurseryCap(g) ? 'nursery' : '';
	}

	/** Unlock a pack of units (pack: a Source, or null for course order). Returns { ids, cost } or { blocked } ({ ids: [] } when none left). */
	/**
	 * pack: a Source name, null (course order) or G.EXAMPLES_PACK: the units that make the most verified example templates usable
	 * (env.criticalPath), then course order for any rest. Returns { ids, cost, examples: { before, after } | undefined }.
	 */
	pull(pack = null) {
		const g = this.g, cost = G.pullCost(g), blocked = this.pullBlocked(), n = G.pullSize(g), cands = this.pullCandidates();
		if (blocked) return { blocked, ids: [] };
		let ids, examples;
		if (pack === G.EXAMPLES_PACK && this.env.criticalPath) {
			const path = this.env.criticalPath(g.owned, cands.map(c => c.id), n);
			ids = path.ids.slice();
			if (ids.length < n) { const taken = new Set(ids); ids.push(...G.pickPull(cands.filter(c => !taken.has(c.id)), n - ids.length, this.rand, null)); }
			examples = { before: path.before, after: path.after };
		} else ids = G.pickPull(cands, n, this.rand, pack === G.EXAMPLES_PACK ? null : pack || null);
		if (!ids.length) return { ids };
		g.coins -= cost; g.pulls++; g.owned.push(...ids);
		this.persist.game();
		this.card = null;
		return { ids, cost, examples };
	}

	/** Verified example templates the unlocked units can fully build, of all: { usable, total }; null without the verified generator. */
	examplesUsable() {
		if (!this.env.criticalPath || !this.g) return null;
		const ids = this.templateIds();
		return { usable: this.env.criticalPath(this.g.owned, [], 0).before, total: ids ? ids.length : null };
	}

	/** The next `n` units of the Examples Critical Path from the current unlocks, with usable templates after each: [{ id, gain, usable }]. */
	criticalPath(n = 10) {
		if (!this.env.criticalPath) return null;
		return this.env.criticalPath(this.g.owned, this.pullCandidates().map(c => c.id), n);
	}

	/** Buy one level of upgrade key; false when too expensive or maxed. */
	upgrade(key) {
		const g = this.g, price = G.upCost(g, key);
		if (price > g.coins || G.upLevel(g, key) >= T.UPGRADES[key].max) return false;
		g.coins -= price; g.up[key] = G.upLevel(g, key) + 1;
		this.persist.game();
		return true;
	}

	/** Equip (buying first if needed, for price coins) a cosmetic. Returns { bought } or null when it cannot be afforded. */
	cosmetic(kind, key, price) {
		const g = this.g;
		let bought = false;
		if (!g.cos.owned.includes(key)) {
			if (price > g.coins) return null;
			g.coins -= price; g.cos.owned.push(key);
			bought = true;
		}
		g.cos[kind] = key;
		this.persist.game();
		return { bought };
	}

	/** Claim daily quest i (-1 = the chest); returns the coins paid (0 = nothing to claim). */
	claim(i) {
		const coins = G.claimQuest(this.g, i);
		if (coins) this.persist.game();
		return coins;
	}

	sealsAvailable() { return G.sealsAvailable(this.g, this.prog); }
	/** Bank new stars as seals (the view confirms first). Returns the seals gained, or 0 when below the minimum. */
	ascend() {
		const n = this.sealsAvailable();
		if (n < T.SEAL_MIN) return 0;
		G.ascend(this.g, this.prog);
		this.persist.game();
		return n;
	}

	// ---------- number sound board ----------
	buyNumbers() {
		const g = this.g;
		if ((g.games || {}).numbers || G.NUMBER_COST > g.coins) return false;
		g.coins -= G.NUMBER_COST; g.games = { ...g.games, numbers: 1 };
		this.persist.game();
		return true;
	}
	numberQuestion(mode, prev) { return G.numberQuestion(mode, this.rand, prev); }
	/** A right-answer streak: kept as the best when it beats it. */
	recordNumberStreak(streak) {
		const g = this.g;
		if (streak > ((g.games || {}).numbersBest || 0)) { g.games = { ...g.games, numbersBest: streak }; this.persist.game(); }
	}

	/** One right answer for a unit that is not the card being settled: everything an answer pays, without per-answer effects. */
	creditAnswer(id, st) {
		const g = this.g, ss = this.session, now = this.clock.sec(), u = this.unitOf(id), h = g.h[id] || 0;
		const res = G.answer(u, h, 1, now, st), ev = res.ev;
		this.prog.set(id, res.unit);
		if (res.h) g.h[id] = res.h; else delete g.h[id];
		this.persist.unit(id);
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
}

const api = { FC2Core, defaultClock, DEFAULT_OPTS };
if (typeof window !== 'undefined') window.FC2Controller = api;
if (isNode) module.exports = api;
})();
