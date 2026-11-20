#!/usr/bin/env node
'use strict';
const fs = require('fs'), path = require('path');
const G = require('../fc2/game.js');
const { T, HOUR } = G;

let passed = 0, failed = 0;
const assert = (c, m) => { if (c) { passed++; console.log(`  [PASS] ${m}`); } else { failed++; console.error(`  [FAIL] ${m}`); } };
console.log('======================================================');
console.log('          FC2 GAME RULES                              ');
console.log('======================================================');

const NOW = 1e9, unit = (o = {}) => ({ ...G.blankUnit(), ...o });
const est = (tier, ago, score = 4) => unit({ score, tier, lastCorrect: NOW - ago, lastSeen: NOW - ago });

assert(G.status(unit(), NOW) === 'new', 'an untouched unit is new');
assert(G.status(unit({ score: 2, lastSeen: 5 }), NOW) === 'learning', 'score below ESTABLISHED is learning');
assert(G.status(est(0, HOUR), NOW) === 'growing' && G.status(est(0, 5 * HOUR), NOW) === 'ripe' && G.status(est(0, 13 * HOUR), NOW) === 'wilted', 'growing -> ripe -> wilted by elapsed intervals');
assert(G.decay(est(0, 5 * HOUR), NOW) === 0 && G.decay(est(0, 13 * HOUR), NOW) === 2, 'score decays one point per extra interval, derived only');

{ // learning: two "Easy" answers establish; coins do not depend on the score picked
	let r = G.answer(unit(), 0, 2, NOW, 'new');
	assert(!r.ev.established && r.unit.score === 2, 'first +2 is not yet established');
	r = G.answer(r.unit, 0, 2, NOW, 'learning');
	assert(r.ev.established && r.unit.lastCorrect === NOW, 'second +2 establishes and stamps lastCorrect');
	const g = G.blankGame(NOW), m = { combo: 3, swift: false, crit: false };
	const pays = [-2, -1, 0, 1, 2].map(v => G.payout(g, G.answer(est(1, 30 * HOUR), 0, v, NOW, 'ripe').ev, 1, m));
	assert(new Set(pays).size === 1, 'harvest coins are identical for every self-score');
}
{ // harvest and promotion
	let r = G.answer(est(0, 5 * HOUR), 0, 1, NOW, 'ripe');
	assert(r.ev.harvested && r.ev.promoted && r.unit.tier === 1 && r.h === 0, 'tier 0 promotes after one ripe harvest');
	r = G.answer(est(1, 30 * HOUR), 0, 1, NOW, 'ripe');
	assert(r.ev.harvested && !r.ev.promoted && r.h === 1, 'tier 1 needs two harvests');
	r = G.answer(est(1, 30 * HOUR), 1, 1, NOW, 'ripe');
	assert(r.ev.promoted && r.unit.tier === 2, 'second harvest promotes tier 1');
	r = G.answer(est(1, 30 * HOUR), 1, 0, NOW, 'ripe');
	assert(r.ev.lapsed && r.unit.score === T.ESTABLISHED - 1 && r.h === 0 && r.unit.tier === 1 && r.unit.lastCorrect !== NOW, 'a 0 on a ripe card lapses to learning, keeps the tier');
}
{ // wilt, recovery, dormancy
	let r = G.answer(est(2, 72 * HOUR * 4), 0, -1, NOW, 'wilted');
	assert(r.ev.demoted && r.unit.tier === 1, 'missing a wilted card costs a tier');
	r = G.answer(est(2, 72 * HOUR * 4), 0, -1, NOW, 'dormant');
	assert(!r.ev.demoted && r.unit.tier === 2, 'missing a dormant card does not');
	const lo = G.answer(est(0, 4 * HOUR * 6, 4), 0, 1, NOW, 'wilted'), hi = G.answer(est(3, 168 * HOUR * 6, 4), 0, 1, NOW, 'wilted');
	assert(lo.ev.lapsed && !lo.ev.harvested && hi.ev.harvested && hi.ev.recovered === 5, 'high LongTermRecognition recovers decayed score; tier 0 has to re-establish');
	const units = new Map(), owned = [];
	for (let i = 0; i < T.WILT_CAP + 5; i++) { units.set(i, est(0, 100 * HOUR + i)); owned.push(i); }
	const st = G.classify(units, owned, NOW), count = s => [...st.values()].filter(x => x === s).length;
	assert(count('wilted') === T.WILT_CAP && count('dormant') === 5, 'at most WILT_CAP units are at risk; the rest are dormant');
}
{ // practice never moves the ripening clock
	const u = est(1, HOUR), r = G.answer(u, 1, 2, NOW, 'growing');
	assert(r.ev.kind === 'practice' && r.unit.lastCorrect === u.lastCorrect && r.unit.score === u.score && r.h === 1, 'a correct early review changes only lastSeen');
	assert(G.answer(u, 1, -1, NOW, 'growing').ev.lapsed, 'an early miss lapses');
}
{ // idle income
	const g = G.blankGame(NOW - 100 * HOUR); g.owned = [1, 2];
	const units = new Map([[1, est(1, 100 * HOUR)], [2, unit({ score: 1 })]]);
	assert(G.idleEarned(g, units, NOW) === T.IDLE_RATE[1] * T.OFFLINE_CAP_H, 'idle income stops at the offline cap');
	g.lastCollect = NOW - 2 * HOUR; units.set(1, est(0, 10 * HOUR));
	assert(G.idleEarned(g, units, NOW) === 0, 'a ripe unit produces nothing until harvested');
	units.set(1, est(0, HOUR));
	assert(G.idleEarned(g, units, NOW) === T.IDLE_RATE[0] && G.idleRate(g, units, NOW) === T.IDLE_RATE[0], 'a growing unit pays its hourly rate from its last correct answer');
}
{ // xp, streak, upgrades
	const g = G.blankGame(NOW);
	assert(G.addXp(g, G.xpToNext(1) + 1) === 1 && g.level === 2 && g.xp === 1 && g.coins === T.LEVEL_COINS * 2, 'xp rolls over into a level and pays coins');
	assert(G.touchStreak(g, 'd2', 'd1') === 'reset' && g.streak.n === 1 && G.touchStreak(g, 'd3', 'd2') === 'kept' && g.streak.n === 2 && G.touchStreak(g, 'd3', 'd2') === 'same', 'day streak keeps, repeats and resets');
	assert(G.pullCost(g) === 0 && G.upCost(g, 'yield') === T.UPGRADES.yield.base, 'first pull is free; upgrade costs start at base');
}
{ // pulls and scheduling
	const cands = [{ id: 1, pack: 'SUOBI01', priority: 5 }, { id: 2, pack: 'class2012', priority: 1 }, { id: 3, pack: 'class2011', priority: 0.5 }, { id: 4, pack: 'class2011', priority: 4 }, { id: 5, pack: 'studytext12', priority: 1 }];
	assert(JSON.stringify(G.pickPull(cands, 4, () => 0)) === '[3,4,2,5]', 'pulls go pack by pack (class, then study texts), easiest PriorityScore first');
	assert(G.pickPull(cands, 1, () => 0, 'SUOBI01')[0] === 1, 'a chosen pack is pulled first');
	const g = G.blankGame(NOW); g.owned = [1, 2, 3, 4];
	const units = new Map([[1, unit({ score: 1, lastSeen: 1 })], [2, est(0, 5 * HOUR)], [3, unit()], [4, est(1, HOUR)]]);
	const st = G.classify(units, g.owned, NOW), s = { n: 0, due: new Map([[1, 5]]), last: null, front: [] };
	assert(G.nextCard(g, units, st, s).id === 2, 'a ripe card comes before new cards');
	st.set(2, 'growing');
	assert(G.nextCard(g, units, st, s).id === 3, 'then new cards');
	st.set(3, 'growing'); s.n = 5;
	assert(G.nextCard(g, units, st, s).id === 1, 'a learning card returns when its gap has passed');
	s.front = [4];
	assert(G.nextCard(g, units, st, s).mode === 'practice', 'a queued card jumps the line');
}
{ // trials: the promoting harvest is objective
	assert(G.isTrial(est(0, 5 * HOUR), 0, 'ripe') && !G.isTrial(est(1, 30 * HOUR), 0, 'ripe') && G.isTrial(est(1, 30 * HOUR), 1, 'ripe') && !G.isTrial(est(0, HOUR), 0, 'growing') && !G.isTrial(est(3, 999 * HOUR), 9, 'wilted'), 'only the promoting review of a ripe unit is a trial');
	let r = G.answerTrial(est(1, 30 * HOUR), 1, true, NOW, 'ripe');
	assert(r.ev.promoted && r.unit.tier === 2 && r.h === 0 && r.unit.lastCorrect === NOW, 'passing a trial promotes');
	r = G.answerTrial(est(0, 4 * HOUR * 2.5, 3), 0, true, NOW, 'ripe');
	assert(r.unit.score >= T.ESTABLISHED, 'a passed trial leaves the unit established even after decay');
	r = G.answerTrial(est(1, 30 * HOUR), 1, false, NOW, 'ripe');
	assert(r.ev.lapsed && r.unit.tier === 1 && r.unit.score === T.ESTABLISHED - 1 && r.h === 1 && G.isTrial({ ...r.unit, score: 4 }, r.h, 'ripe'), 'failing keeps the tier, goes back to learning, and the trial returns');
	assert(G.answerTrial(est(1, 999 * HOUR), 1, false, NOW, 'wilted').ev.demoted, 'failing a wilted trial costs a tier');
	const g = G.blankGame(NOW), m = { combo: 0, swift: false, crit: false };
	assert(G.payout(g, G.answerTrial(est(0, 5 * HOUR), 0, true, NOW, 'ripe').ev, 0, m) === T.HARVEST_PAY[0] + T.PROMOTE_PAY[0] && G.payout(g, G.answerTrial(est(0, 5 * HOUR), 0, false, NOW, 'ripe').ev, 0, m) === T.HARVEST_PAY[0], 'a passed trial pays the promotion bonus');
}
{ // quests and ascension
	const g = G.blankGame(NOW);
	assert(G.ensureQuests(g, 'd1', false) && g.quests.list.length === 3 && g.quests.list.every(q => !T.QUESTS[q.k].needsRipe) && !G.ensureQuests(g, 'd1', true), 'three daily quests, feasible ones only, stable for the day');
	const again = G.blankGame(NOW); G.ensureQuests(again, 'd1', false);
	assert(JSON.stringify(again.quests) === JSON.stringify(g.quests), 'quests are deterministic per day');
	const q = g.quests.list[0];
	assert(G.claimQuest(g, 0) === 0, 'an unfinished quest cannot be claimed');
	G.questEvent(g, { [q.k]: 999, combo: 999, answers: 999, established: 999, rounds: 999 });
	assert(q.have === q.need && G.claimQuest(g, 0) === q.coins && G.claimQuest(g, 0) === 0 && G.claimQuest(g, -1) === 0, 'a finished quest pays once; the bonus waits for all three');
	G.claimQuest(g, 1); G.claimQuest(g, 2);
	assert(G.claimQuest(g, -1) > 0 && G.claimQuest(g, -1) === 0 && G.ensureQuests(g, 'd2', true), 'bonus pays once; a new day rolls new quests');
	const a = G.blankGame(NOW); a.owned = [1, 2, 3, 4]; a.coins = 500; a.up = { yield: 3 };
	const units = new Map([1, 2, 3, 4].map(id => [id, est(3, HOUR)]));
	assert(G.sealsAvailable(a, units) === 12 && G.ascend(a, units) === 12 && a.seals === 12 && a.coins === 0 && !a.up.yield && G.ascend(a, units) === 0, 'ascending banks new stars as seals and resets coins and upgrades');
	assert(Math.abs(G.sealMult(a) - (1 + 12 * T.SEAL_BONUS)) < 1e-9 && G.payout(a, { kind: 'learn' }, 0, { combo: 0 }) === Math.round(T.LEARN_PAY * G.sealMult(a)), 'seals multiply coins');
	a.seals = 0; units.set(1, est(0, HOUR));
	assert(G.sealsAvailable(a, units) === 0, 'stars lost below the banked count give no seals');
}
{ // number sound board
	assert(G.NUMBER_COST === 10 && G.blankGame(NOW).games && !G.blankGame(NOW).games.numbers, 'the number board costs 10 and starts locked');
	assert(G.NUMBER_WORDS.native.length === 13 && G.NUMBER_WORDS.sino.length === 13, 'both systems cover 0-12');
	let seq = 0, prev = null, ok = true; const seen = { native: new Set(), sino: new Set() };
	for (let i = 0; i < 400; i++) {
		const q = G.numberQuestion(i % 3 === 0 ? 'native' : i % 3 === 1 ? 'sino' : 'both', () => (seq = (seq * 9301 + 49297) % 233280) / 233280, prev);
		if (!q.ko || q.n > 12 || (q.sys === 'native' && q.n < 1) || (prev && prev.sys === q.sys && prev.n === q.n)) ok = false;
		seen[q.sys].add(q.n); prev = q;
	}
	assert(ok && seen.native.size === 12 && seen.sino.size === 13, 'questions stay in range, native has no zero, no immediate repeats, every number comes up');
	assert(G.numberWord('native', 3) === G.NUMBER_WORDS.native[3] && G.numberWord('native', 0) === '공' && G.numberWord('sino', 0) === '영' && G.numberWord('sino', 12) === '십이', 'a tapped number is spoken in the question\'s system; native zero is 공');
	assert(G.numberQuestion('native', () => 0.999).n === 12 && G.numberQuestion('sino', () => 0).n === 0, 'range ends are reachable');
}
{ // reload safety: the progress mirror, the session snapshot
	const S = require('../fc2/store.js');
	const mk = (score, tier, lc, ls) => ({ score, tier, lastCorrect: lc, lastSeen: ls });
	const db = new Map([[1, mk(2, 0, 100, 100)], [2, mk(3, 1, 500, 500)]]);
	const mirror = { 1: [3, 0, 200, 200], 2: [0, 0, 500, 500], 3: [1, 0, 50, 60], 9: [1, 0, 1, 1] };
	const m = S.mergeProg(db, mirror, id => id !== 9);
	assert(m.prog.get(1).score === 3 && m.prog.get(2).score === 3 && m.prog.get(2).tier === 1, 'the mirror wins a unit only when strictly newer (equal stamps keep the database copy)');
	assert(m.prog.get(3).score === 1 && !m.prog.has(9) && m.healed.sort().join() === '1,3', 'units missing from the database come back from the mirror; unknown ids are ignored; healed lists what to rewrite');
	assert(JSON.stringify(S.packProg(new Map([[5, mk(1, 2, 3, 4)]]))) === '{"5":[1,2,3,4]}', 'progress packs compactly');
	const sess = { n: 4, combo: 7, round: { n: 4, coins: 9 }, due: new Map([[3, 8]]), last: 3 };
	const back = S.unpackSession(JSON.parse(JSON.stringify(S.packSession(sess, 1000))), 1100, 3600);
	assert(back.combo === 7 && back.n === 4 && back.round.coins === 9 && back.due.get(3) === 8 && back.last === 3, 'the session (combo, round, learning queue) survives a reload');
	assert(S.unpackSession(S.packSession(sess, 1000), 1000 + 3601, 3600) === null && S.unpackSession(null, 1, 1) === null, 'a stale or missing session is dropped');
}
{ // a database record damaged by the old bulk-save bug (only lastSeen kept) must not beat the progress copy at equal timestamps
	const S = require('../fc2/store.js');
	const db = new Map([[3, { score: 0, tier: 0, lastCorrect: 0, lastSeen: 500 }]]), mirror = { 3: [6, 2, 400, 500] };
	assert(S.mergeProg(db, mirror).prog.get(3).score === 0, 'with equal timestamps the database copy still wins by default (spreadsheet edits stay)');
	const healed = S.mergeProg(db, mirror, () => true, new Set([3]));
	assert(healed.prog.get(3).score === 6 && healed.prog.get(3).tier === 2 && healed.healed.includes(3), 'a damaged database record (missing progress columns) is healed from the progress copy');
}
{ // recovery helpers: stats, best-of merge, rolling snapshots that keep the richest copy
	const S = require('../fc2/store.js');
	const rich = { 1: [5, 2, 100, 100], 2: [3, 1, 90, 90], 3: [1, 0, 80, 80], 4: [0, 0, 0, 0] };
	const st = S.progStats(rich);
	assert(st.units === 4 && st.scored === 3 && st.established === 2 && st.stars === 3 && st.latest === 100, 'progStats counts scored, established and starred units');
	const cur = new Map([[1, { score: 0, tier: 0, lastCorrect: 0, lastSeen: 0 }], [5, { score: 4, tier: 1, lastCorrect: 50, lastSeen: 50 }]]);
	const b = S.bestOf(cur, { 1: [5, 2, 100, 100], 5: [2, 0, 10, 10], 9: [1, 0, 1, 1] }, id => id !== 9);
	assert(b.prog.get(1).score === 5 && b.prog.get(1).tier === 2 && b.prog.get(5).score === 4 && !b.prog.has(9) && b.changed.join() === '1', 'bestOf restores lost units but never downgrades a more advanced one, and skips invalid ids');
	let snaps = S.addSnapshot([], rich, 1000);
	assert(snaps.length === 1 && S.addSnapshot(snaps, rich, 1000 + 60).length === 1, 'a snapshot is skipped when the last one is recent or identical');
	snaps = S.addSnapshot(snaps, { 1: [1, 0, 5, 5] }, 1000 + 3600);
	for (let i = 0; i < 10; i++) snaps = S.addSnapshot(snaps, { 1: [0, 0, i, i], [i + 10]: [0, 0, 0, 0] }, 5000 + i * 3600);
	assert(snaps.length <= 6 && snaps.some(x => S.progStats(x.packed).scored === 3), 'the richest snapshot survives a run of poorer ones');
	assert(S.addSnapshot(snaps, {}, 999999999).length === snaps.length, 'an empty progress is never snapshotted');
}
{ // merged duplicate units (aliases, tools/merge_units.js) hand their saved state to the canonical unit
	const S = require('../fc2/store.js');
	const mk = (score, tier, lc, ls) => ({ score, tier, lastCorrect: lc, lastSeen: ls });
	const alias = new Map([[10, 1], [11, 2], [12, 3]]);
	const f = S.foldAliases({
		prog: new Map([[1, mk(1, 0, 50, 50)], [10, mk(4, 2, 40, 40)], [2, mk(5, 3, 90, 90)], [11, mk(1, 0, 99, 99)], [12, mk(2, 0, 7, 7)]]),
		mirror: { 10: [4, 2, 40, 40], 2: [5, 3, 90, 90], 11: [1, 0, 99, 99] },
		owned: [10, 1, 5, 11, 2, 12], notes: { 10: 'a', 1: 'b', 12: 'c' }
	}, alias);
	assert(f.prog.get(1).tier === 2 && f.prog.get(2).tier === 3 && f.prog.get(3).score === 2 && ![10, 11, 12].some(id => f.prog.has(id)), 'an alias\'s progress moves to its canonical unit only when more advanced (tier, then score), and never stays under the alias id');
	assert(f.moved.sort().join() === '1,3' && f.mirror[1][1] === 2 && f.mirror[2][1] === 3 && !(10 in f.mirror) && !(11 in f.mirror), 'moved lists canonical units to re-save; the localStorage mirror folds the same way');
	assert(f.owned.join() === '1,5,2,3' && f.notes[1] === 'b\n\na' && f.notes[3] === 'c' && !('10' in f.notes), 'owned units map to canonical ids without repeats; notes are carried over');
	assert(S.foldAliases({ prog: new Map([[1, mk(1, 0, 1, 1)]]), owned: [1] }, new Map()).owned.join() === '1', 'no aliases: state passes through');
}
{ // fc2/index.html loads the same engine scripts as flashcards/index.html
	const srcs = dir => [...fs.readFileSync(path.join(__dirname, '..', dir, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"/g)].map(m => m[1].replace(/\?.*$/, ""));
	const eng = l => l.filter(s => s.startsWith('../data/') || s.startsWith('../korean/'));
	const mine = srcs('fc2');
	assert(JSON.stringify(eng(mine)) === JSON.stringify(eng(srcs('flashcards'))), 'fc2/index.html loads the same data/ and korean/ scripts as flashcards/index.html');
}

console.log(`\nfc2 game rules: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
