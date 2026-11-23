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

const api = { FC2Core, defaultClock };
if (typeof window !== 'undefined') window.FC2Controller = api;
if (isNode) module.exports = api;
})();
