/**
 * fc2/game.js - pure game rules for the fc2 study game (no DOM, no storage). Browser global (window.FC2Game) or CommonJS.
 *
 * Every unit carries the four spreadsheet values: score (RecognitionScore), tier (index into LongTermRecognition),
 * lastCorrect / lastSeen (unix seconds). Everything else is derived from them and the clock:
 *   new       owned, never answered
 *   learning  score < ESTABLISHED: recycles inside the session a few cards later, no time gate
 *   growing   established and inside its interval: produces idle currency
 *   ripe      interval elapsed: a harvest (the spaced-repetition review) pays out and counts toward the next tier
 *   wilted    WILT_AFTER intervals elapsed: produces nothing; failing its review can cost a tier (capped, see classify)
 *   dormant   wilted beyond WILT_CAP: same as wilted, but without the tier risk
 * RecognitionScore decays one point per extra interval while a unit waits (derived, applied when it is next answered);
 * LongTermRecognition is durable and gives back up to 2 points per tier on a correct recovery.
 * Coins are paid per attempt and never depend on which self-score was picked.
 *
 * Trials: the harvest that would promote a unit is an objective question instead of a self-scored card (isTrial /
 * answerTrial). Passing promotes and pays PROMOTE_PAY; failing sends the unit back to learning and the trial returns
 * the next time it is ripe. Trial type by tier: Korean -> meaning, listening -> meaning, meaning -> Korean.
 * Daily quests (ensureQuests / questEvent / claimQuest) and ascension (seals: permanent coin bonus bought with stars).
 */
(function() {
'use strict';

const HOUR = 3600;
const T = {
	MIN_SCORE: -6, MAX_SCORE: 10, ESTABLISHED: 3,
	TIERS: ['unknown', 'recognized', 'definitionKnown', 'knownByDefinition'],
	INTERVAL: [4 * HOUR, 20 * HOUR, 72 * HOUR, 168 * HOUR],
	HARVESTS_TO_PROMOTE: [1, 2, 3],
	WILT_AFTER: 3, WILT_CAP: 20,
	IDLE_RATE: [2, 5, 12, 30],            // coins per hour while growing, by tier
	HARVEST_PAY: [8, 16, 32, 64], LEARN_PAY: 2, PRACTICE_PAY: 1, PROMOTE_PAY: [40, 100, 250],   // PROMOTE_PAY by the tier left behind
	TRIAL_TYPES: ['meaning', 'listen', 'recall'], TRIAL_CHOICES: [4, 6, 6],
	XP: { answer: 5, harvest: 10, establish: 15, promote: 40 },
	LEARN_GAP: { '-2': 3, '-1': 5, 0: 8, 1: 12, 2: 20 },   // cards until a learning card returns
	NURSERY_CAP: 15, PULL_SIZE: 5, PULL_BASE: 40, PULL_STEP: 10, PULL_WINDOW: 8,
	ROUND: 10, SWIFT_SEC: 6, SWIFT_BONUS: 0.2, COMBO_STEP: 0.02, COMBO_CAP: 25,
	CRIT_BASE: 0.05, CRIT_MULT: 3, STREAK_STEP: 0.05, STREAK_CAP: 10, OFFLINE_CAP_H: 8,
	LEVEL_BASE: 40, LEVEL_STEP: 20, LEVEL_COINS: 10,
	SEAL_MIN: 10, SEAL_BONUS: 0.02, QUEST_XP: 20, QUEST_BONUS: 100,
	QUESTS: {
		answers: { name: 'Answer {n} cards', n: [30, 60, 100], coins: [40, 80, 140] },
		established: { name: 'Establish {n} units', n: [3, 6, 10], coins: [40, 80, 140] },
		rounds: { name: 'Finish {n} rounds', n: [2, 4, 8], coins: [30, 60, 120] },
		combo: { name: 'Reach a x{n} combo', n: [10, 20, 25], coins: [30, 60, 100], max: true },
		harvests: { name: 'Harvest {n} ripe units', n: [5, 12, 25], coins: [50, 100, 180], needsRipe: true },
		trials: { name: 'Pass {n} trials', n: [1, 3, 6], coins: [60, 120, 220], needsRipe: true }
	},
	UPGRADES: {
		yield: { name: 'Sharper sickle', desc: '+10% harvest pay', per: 0.1, base: 60, growth: 1.6, max: 20 },
		rate: { name: 'Busy hive', desc: '+15% idle income', per: 0.15, base: 80, growth: 1.6, max: 20 },
		cap: { name: 'Bigger store', desc: '+2h offline storage', per: 2, base: 100, growth: 1.8, max: 8 },
		luck: { name: 'Lucky charm', desc: '+2% critical harvest', per: 0.02, base: 120, growth: 1.7, max: 10 },
		combo: { name: 'Long breath', desc: '+5 combo cap', per: 5, base: 150, growth: 1.9, max: 5 },
		pull: { name: 'Wider net', desc: '+1 unit per pull', per: 1, base: 200, growth: 2.2, max: 5 },
		nursery: { name: 'Bigger nursery', desc: '+3 learning slots', per: 3, base: 150, growth: 1.9, max: 5 }
	}
};

const clamp = (n, lo = T.MIN_SCORE, hi = T.MAX_SCORE) => Math.max(lo, Math.min(hi, n));
const tierIndex = name => Math.max(0, T.TIERS.indexOf(name));
const blankUnit = () => ({ score: 0, tier: 0, lastCorrect: 0, lastSeen: 0 });
const blankGame = now => ({
	v: 1, games: {}, coins: 0, xp: 0, level: 1, owned: [], h: {}, up: {}, pulls: 0, lastCollect: now,
	streak: { day: '', n: 0 }, cos: { owned: ['midnight', 'sparks'], theme: 'midnight', particle: 'sparks' },
	totals: { answers: 0, harvests: 0, rounds: 0, earned: 0, trials: 0 }, seals: 0, starsBanked: 0, ascensions: 0, quests: null, vq: []
});

const NUMBER_COST = 10;
const NUMBER_WORDS = {
	native: ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열', '열하나', '열둘'],
	sino: ['영', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구', '십', '십일', '십이']
};
/** What the board says for a tapped button: the system of the question asked. Native Korean has no zero, so 공 stands in. */
function numberWord(sys, n) { return sys === 'native' ? (n === 0 ? '공' : NUMBER_WORDS.native[n]) : NUMBER_WORDS.sino[n]; }
/** One number sound-board question. mode: 'both' | 'native' | 'sino'. Native Korean has no zero, so native draws 1-12. */
function numberQuestion(mode, rnd, prev) {
	const sys = mode === 'native' || mode === 'sino' ? mode : (rnd() < 0.5 ? 'native' : 'sino');
	const lo = sys === 'native' ? 1 : 0;
	let n;
	do { n = lo + Math.floor(rnd() * (13 - lo)); } while (prev && prev.sys === sys && prev.n === n);
	return { sys, n, ko: NUMBER_WORDS[sys][n] };
}

function status(u, now) {
	if (!u.lastSeen && !u.lastCorrect && !u.score) return 'new';
	if (u.score < T.ESTABLISHED) return 'learning';
	const el = now - u.lastCorrect, I = T.INTERVAL[u.tier];
	if (el < I) return 'growing';
	return el < I * T.WILT_AFTER ? 'ripe' : 'wilted';
}

/** Points RecognitionScore has lost to waiting (0 until a full interval past ripe). */
function decay(u, now) {
	if (u.score < T.ESTABLISHED) return 0;
	const I = T.INTERVAL[u.tier];
	return Math.max(0, Math.floor((now - u.lastCorrect - I) / I));
}
const effectiveScore = (u, now) => clamp(u.score - decay(u, now));
/** 0..1 progress of a growing unit toward ripe. */
const ripeness = (u, now) => u.score < T.ESTABLISHED ? 0 : Math.max(0, Math.min(1, (now - u.lastCorrect) / T.INTERVAL[u.tier]));

/** units: Map id -> unit. Returns Map id -> status, with wilted units past WILT_CAP (oldest first keep the risk) marked dormant. */
function classify(units, ownedIds, now) {
	const out = new Map(), wilted = [];
	for (const id of ownedIds) {
		const u = units.get(id) || blankUnit(), s = status(u, now);
		out.set(id, s);
		if (s === 'wilted') wilted.push([id, u.lastCorrect]);
	}
	wilted.sort((a, b) => a[1] - b[1]).slice(T.WILT_CAP).forEach(([id]) => out.set(id, 'dormant'));
	return out;
}

/**
 * Apply a self-score v (-2..+2). st is the unit's status from classify(). h = harvests banked toward the next tier.
 * Returns { unit, h, ev } where ev = { kind: learn|harvest|practice, established, harvested, promoted, demoted, lapsed, recovered }.
 */
function answer(u, h, v, now, st) {
	const r = { ...u, lastSeen: now };
	const ev = { kind: 'learn', established: false, harvested: false, promoted: false, demoted: false, lapsed: false, recovered: 0 };
	if (st === 'new' || st === 'learning') {
		r.score = clamp(u.score + v);
		if (v > 0) r.lastCorrect = now;
		ev.established = r.score >= T.ESTABLISHED;
		return { unit: r, h, ev };
	}
	if (st === 'growing') { // early review: only an honest miss changes anything
		ev.kind = 'practice';
		if (v < 0) { r.score = T.ESTABLISHED + v; h = 0; ev.lapsed = true; }
		return { unit: r, h, ev };
	}
	ev.kind = 'harvest';
	const d = decay(u, now);
	if (v > 0) {
		ev.recovered = Math.min(d, 2 * u.tier);
		r.score = clamp(u.score - d + ev.recovered + v);
		r.lastCorrect = now;
		if (r.score >= T.ESTABLISHED) {
			ev.harvested = true;
			h += 1;
			if (u.tier < T.TIERS.length - 1 && h >= T.HARVESTS_TO_PROMOTE[u.tier]) { r.tier = u.tier + 1; h = 0; ev.promoted = true; }
		} else ev.lapsed = true; // faded too far: correct, but it has to be re-established
		return { unit: r, h, ev };
	}
	r.score = clamp(Math.min(u.score - d + v, T.ESTABLISHED - 1));
	ev.lapsed = true;
	if (v < 0 && st === 'wilted' && u.tier > 0) { r.tier = u.tier - 1; ev.demoted = true; }
	return { unit: r, h: 0, ev };
}

/** True when this review is the one that would promote the unit: it is asked as an objective trial. */
function isTrial(u, h, st) {
	return (st === 'ripe' || st === 'wilted' || st === 'dormant') && u.tier < T.TIERS.length - 1 && h >= T.HARVESTS_TO_PROMOTE[u.tier] - 1;
}

/** Objective result of a trial. Pass: promoted (score at least ESTABLISHED). Fail: back to learning, trial returns when next ripe. */
function answerTrial(u, h, pass, now, st) {
	const r = { ...u, lastSeen: now }, d = decay(u, now);
	const ev = { kind: 'trial', established: false, harvested: false, promoted: false, demoted: false, lapsed: false, recovered: 0 };
	if (pass) {
		ev.recovered = Math.min(d, 2 * u.tier);
		r.score = clamp(Math.max(T.ESTABLISHED, u.score - d + ev.recovered + 1));
		r.lastCorrect = now; r.tier = u.tier + 1;
		ev.harvested = ev.promoted = true;
		return { unit: r, h: 0, ev };
	}
	r.score = T.ESTABLISHED - 1;
	ev.lapsed = true;
	if (st === 'wilted' && u.tier > 0) { r.tier = u.tier - 1; ev.demoted = true; return { unit: r, h: 0, ev }; }
	return { unit: r, h: T.HARVESTS_TO_PROMOTE[u.tier] - 1, ev };
}

const upLevel = (g, key) => (g.up && g.up[key]) || 0;
const upCost = (g, key) => { const s = T.UPGRADES[key]; return Math.round(s.base * Math.pow(s.growth, upLevel(g, key))); };
const comboCap = g => T.COMBO_CAP + upLevel(g, 'combo') * T.UPGRADES.combo.per;
const critChance = g => T.CRIT_BASE + upLevel(g, 'luck') * T.UPGRADES.luck.per;
const pullSize = g => T.PULL_SIZE + upLevel(g, 'pull');
const pullCost = g => g.pulls === 0 ? 0 : T.PULL_BASE + T.PULL_STEP * (g.pulls - 1);
const nurseryCap = g => T.NURSERY_CAP + upLevel(g, 'nursery') * T.UPGRADES.nursery.per;
const offlineCapH = g => T.OFFLINE_CAP_H + upLevel(g, 'cap') * T.UPGRADES.cap.per;
const streakMult = g => 1 + Math.min(Math.max(0, g.streak.n - 1), T.STREAK_CAP) * T.STREAK_STEP;
const xpToNext = level => T.LEVEL_BASE + T.LEVEL_STEP * level;
const sealMult = g => 1 + (g.seals || 0) * T.SEAL_BONUS;
const totalStars = (g, units) => g.owned.reduce((n, id) => n + ((units.get(id) || {}).tier || 0), 0);
const sealsAvailable = (g, units) => Math.max(0, totalStars(g, units) - (g.starsBanked || 0));
/** Ascend: bank new stars as seals (permanent coin bonus); coins and upgrades reset. Returns seals gained (0 = not enough). */
function ascend(g, units) {
	const n = sealsAvailable(g, units);
	if (n < T.SEAL_MIN) return 0;
	g.seals = (g.seals || 0) + n; g.starsBanked = totalStars(g, units); g.ascensions = (g.ascensions || 0) + 1;
	g.coins = 0; g.up = {};
	return n;
}

/** Coins for one attempt. tier = the unit's tier before the answer. m = { combo, swift, crit }. */
function payout(g, ev, tier, m) {
	const reap = ev.kind === 'harvest' || ev.kind === 'trial';
	const base = reap ? T.HARVEST_PAY[tier] + (ev.kind === 'trial' && ev.promoted ? T.PROMOTE_PAY[tier] : 0) : (ev.kind === 'practice' ? T.PRACTICE_PAY : T.LEARN_PAY);
	let mult = sealMult(g) * streakMult(g) * (1 + Math.min(m.combo, comboCap(g)) * T.COMBO_STEP);
	if (reap) mult *= (1 + upLevel(g, 'yield') * T.UPGRADES.yield.per) * (m.crit ? T.CRIT_MULT : 1);
	if (m.swift) mult *= 1 + T.SWIFT_BONUS;
	return Math.max(1, Math.round(base * mult));
}
const xpFor = ev => T.XP.answer + (ev.harvested ? T.XP.harvest : 0) + (ev.established ? T.XP.establish : 0) + (ev.promoted ? T.XP.promote : 0);

/** Adds xp, returns the number of levels gained (g is mutated). */
function addXp(g, xp) {
	g.xp += xp;
	let ups = 0;
	while (g.xp >= xpToNext(g.level)) { g.xp -= xpToNext(g.level); g.level++; ups++; g.coins += T.LEVEL_COINS * g.level; }
	return ups;
}

/** Idle coins produced by growing units since g.lastCollect (each unit stops when it turns ripe; capped by offline storage). */
function idleEarned(g, units, now) {
	const end = Math.min(now, g.lastCollect + offlineCapH(g) * HOUR);
	let sum = 0;
	for (const id of g.owned) {
		const u = units.get(id);
		if (!u || u.score < T.ESTABLISHED || !u.lastCorrect) continue;
		const a = Math.max(g.lastCollect, u.lastCorrect), b = Math.min(end, u.lastCorrect + T.INTERVAL[u.tier]);
		if (b > a) sum += T.IDLE_RATE[u.tier] * (b - a) / HOUR;
	}
	return Math.floor(sum * (1 + upLevel(g, 'rate') * T.UPGRADES.rate.per) * sealMult(g));
}
function idleRate(g, units, now) {
	let r = 0;
	for (const id of g.owned) { const u = units.get(id); if (u && status(u, now) === 'growing') r += T.IDLE_RATE[u.tier]; }
	return r * (1 + upLevel(g, 'rate') * T.UPGRADES.rate.per) * sealMult(g);
}

/** Day streak: call on the first answer of a session. dayKey = local YYYY-MM-DD, prevKey = the day before. Returns 'kept'|'same'|'reset'. */
function touchStreak(g, dayKey, prevKey) {
	if (g.streak.day === dayKey) return 'same';
	const kept = g.streak.day === prevKey;
	g.streak = { day: dayKey, n: kept ? g.streak.n + 1 : 1 };
	return kept ? 'kept' : 'reset';
}

// ---------- daily quests ----------
function hash(str) { let h = 2166136261; for (const ch of String(str)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0; return h; }
/** Three quests per local day, the same all day. canReap = some unit is established (so harvest / trial quests are possible). */
function ensureQuests(g, dayKey, canReap) {
	if (g.quests && g.quests.day === dayKey) return false;
	const size = g.level < 5 ? 0 : g.level < 15 ? 1 : 2;
	const keys = Object.keys(T.QUESTS).filter(k => canReap || !T.QUESTS[k].needsRipe);
	let seed = hash(dayKey);
	const list = [];
	while (list.length < 3 && keys.length) {
		seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
		const k = keys.splice(seed % keys.length, 1)[0], q = T.QUESTS[k];
		list.push({ k, need: q.n[size], have: 0, coins: q.coins[size], claimed: false });
	}
	g.quests = { day: dayKey, list, bonus: false };
	return true;
}
/** ev: { answers, established, rounds, harvests, trials, combo } increments (combo is a high-water mark). */
function questEvent(g, ev) {
	if (!g.quests) return;
	for (const q of g.quests.list) q.have = Math.min(q.need, T.QUESTS[q.k].max ? Math.max(q.have, ev[q.k] || 0) : q.have + (ev[q.k] || 0));
}
/** Claim quest i (or the all-done bonus with i = -1). Returns coins paid (0 = not claimable). Levels gained are in g.lastLevelUps. */
function claimQuest(g, i) {
	const qs = g.quests;
	g.lastLevelUps = 0;
	if (!qs) return 0;
	let coins = 0;
	if (i === -1) {
		if (qs.bonus || !qs.list.every(q => q.claimed)) return 0;
		qs.bonus = true; coins = T.QUEST_BONUS + 10 * g.level;
	} else {
		const q = qs.list[i];
		if (!q || q.claimed || q.have < q.need) return 0;
		q.claimed = true; coins = q.coins;
	}
	coins = Math.round(coins * sealMult(g));
	g.coins += coins; g.totals.earned += coins;
	g.lastLevelUps = addXp(g, T.QUEST_XP);
	return coins;
}

/** Pack order: this semester's class packs first (numeric), then study texts, then everything else in data order. */
function packRank(source) {
	const s = String(source), m = /(\d+)/.exec(s), n = m ? Number(m[1]) : 0;
	if (s.startsWith('class')) return n;
	if (s.startsWith('studytext')) return 1e6 + n;
	return 2e6 + (s.startsWith('SUOBI') ? n : 1e5);
}
const rarity = priority => priority >= 5 ? 3 : priority >= 4 ? 2 : priority >= 3 ? 1 : 0; // PriorityScore 5 / 4 / 3 / lower

/**
 * Choose the next units to unlock. cands: [{ id, pack, priority }] not yet owned. Works through packs in packRank order
 * (or `pack` first when given); inside a pack, lowest PriorityScore (easiest: 0.5 ultra-simple .. 5 niche) then lowest id, picking randomly within a small window.
 */
function pickPull(cands, n, rng = Math.random, pack = null) {
	const sorted = cands.slice().sort((a, b) => ((a.pack === pack ? -1 : packRank(a.pack)) - (b.pack === pack ? -1 : packRank(b.pack)))
		|| (a.priority - b.priority) || (a.id - b.id));
	const out = [];
	while (out.length < n && sorted.length) {
		const first = sorted[0].pack;
		let w = 0;
		while (w < sorted.length && w < T.PULL_WINDOW && sorted[w].pack === first) w++;
		out.push(sorted.splice(Math.floor(rng() * w), 1)[0].id);
	}
	return out;
}

/**
 * Next card for the session. st: Map id -> status (classify). s = { n: cards answered, due: Map id -> n at which a learning
 * card returns, last: id just shown, front: [ids queued by the player] }. Returns { id, mode } or null.
 */
function nextCard(g, units, st, s) {
	const not = id => id !== s.last || g.owned.length === 1;
	while (s.front && s.front.length) { const id = s.front.shift(); if (st.has(id)) return { id, mode: modeOf(st.get(id)) }; }
	const by = (want, key) => g.owned.filter(id => want.includes(st.get(id)) && not(id)).sort((a, b) => key(a) - key(b));
	const dueAt = id => s.due.has(id) ? s.due.get(id) : 0, lc = id => (units.get(id) || {}).lastCorrect || 0, ls = id => (units.get(id) || {}).lastSeen || 0;
	const learning = by(['learning'], dueAt);
	if (learning.length && dueAt(learning[0]) <= s.n) return { id: learning[0], mode: 'learn' };
	for (const group of [['wilted'], ['ripe'], ['dormant']]) { const l = by(group, lc); if (l.length) return { id: l[0], mode: 'harvest' }; }
	const fresh = g.owned.filter(id => st.get(id) === 'new' && not(id));
	if (fresh.length) return { id: fresh[0], mode: 'learn' };
	if (learning.length) return { id: learning[0], mode: 'learn' };
	const practice = by(['growing'], ls);
	return practice.length ? { id: practice[0], mode: 'practice' } : null;
}
const modeOf = st => (st === 'new' || st === 'learning') ? 'learn' : (st === 'growing' ? 'practice' : 'harvest');

/**
 * Sentence-generation options for a card. app.js genOptions() uses this, and tools/save_inspect.js replays it on a save file, so the
 * two stay identical. onlyOwned -> sentences use unlocked units only. slotBias leans toward the units you know least: a slot filler
 * stronger than the owned average is redrawn up to twice. queue: the normalized "time to use it" template order, or null.
 */
function sentenceOptions({ owned, opts, unitOf, now, queue, idOf, random = Math.random, recent = [], targetId = null }) {
	const options = { seedOffset: Math.floor(random() * 997) };
	if (opts && opts.onlyOwned) { options.onlyFromSet = true; options.allowedUnitIds = new Set(owned); }
	const strength = id => { const u = unitOf(id); return u ? effectiveScore(u, now) + u.tier : 0; };
	const mean = owned.length ? owned.reduce((n, id) => n + strength(id), 0) / owned.length : 0;
	if (queue) options.queueOrder = queue;
	// recent: content units of the last few cards' sentences (pushRecent). They are redrawn like strong units, so a small unlock set
	// does not repeat the same verb in every sentence. The card's own unit is never held back.
	const recentSet = new Set(recent);
	options.slotBias = { retries: 2, reject: unit => { const id = idOf(unit); return strength(id) > mean || (id !== targetId && recentSet.has(id)); } };
	return options;
}

/** How many content units the "recently used" list keeps (about the last 3 cards of 3 sentences). */
const RECENT_KEEP = 24;
/** Append ids (most recent last), dropping older copies; keep the newest `keep`. */
function pushRecent(recent, ids, keep = RECENT_KEEP) {
	const add = [...new Set(ids)];
	return [...(recent || []).filter(x => !add.includes(x)), ...add].slice(-keep);
}
/** Content (non-grammar) unit ids used in generated sentences, from their unitsUsed lists. */
function contentUnitIds(sentences) {
	const out = [];
	for (const s of sentences || []) for (const u of (s && s.unitsUsed) || []) if (typeof u.unitId === 'number' && String(u.kind).toLowerCase() !== 'grammar') out.push(u.unitId);
	return out;
}
/** Units marked always unlocked (SemanticData.alwaysUnlocked in data.js) join game.owned. Returns true when something was added. */
function ensureUnlocked(g, ids) {
	const have = new Set(g.owned), add = ids.filter(id => !have.has(id));
	if (add.length) g.owned = [...g.owned, ...add];
	return add.length > 0;
}

const api = { sentenceOptions, RECENT_KEEP, pushRecent, contentUnitIds, ensureUnlocked, NUMBER_COST, NUMBER_WORDS, numberWord, numberQuestion, T, HOUR, clamp, tierIndex, blankUnit, blankGame, status, decay, effectiveScore, ripeness, classify, answer, payout, xpFor, addXp, xpToNext,
	idleEarned, idleRate, touchStreak, isTrial, answerTrial, sealMult, totalStars, sealsAvailable, ascend, ensureQuests, questEvent, claimQuest, packRank, rarity, pickPull, nextCard, modeOf, upLevel, upCost, comboCap, critChance, pullSize, pullCost,
	nurseryCap, offlineCapH, streakMult };
if (typeof window !== 'undefined') window.FC2Game = api;
if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
