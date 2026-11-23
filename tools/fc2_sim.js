#!/usr/bin/env node
'use strict';
if (typeof require === 'function' && typeof module !== 'undefined' && require.main === module) require('./exit_log.js').watch('tools/fc2_sim.js'); // failed runs -> test.js report
/**
 * tools/fc2_sim.js - headless fc2 for QA by LLM agents and scripts: the real game flow (fc2/controller.js, fc2/game.js, the sentence
 * generators) with a simulated clock and a seeded random. No DOM, effects or speech (speech is stubbed: listening trials still happen).
 *
 * Usage: node tools/fc2_sim.js <command> [options]
 *   run      batch play; prints a compact summary, writes one JSON line per card to --log
 *            --cards N (200)  --days D (3)  --sessions S per day (2)  --policy correct|wrong|mixed (mixed)
 *            --quiz R  share of cards that take a sentence test (0.1)   --pull auto|never (auto)   --sec-per-card S (20)
 *            --pull-from course|examples|<Source> (course): what auto-pulls unlock (examples = the Examples Critical Path)
 *            --sentences file.tsv: every distinct example sentence (count, V verified / G generator, template, cards, ko, en),
 *            generator ones first: the file to read in a sentence quality pass (docs: handoff.md "Simulator sentence QA")
 *   step     play by commands: --do "card; answer 1; trial right; status" (or commands from piped stdin, one per line;
 *            an interactive fc2> prompt when stdin is a terminal). --state keeps the game between calls, not the open card.
 *            commands: card | answer <-2..2> | trial right|wrong|<i> | quiz right|wrong [i] | next | pull [pack] | collect |
 *                      upgrade <key> | claim <i|-1> | ascend | buy-numbers | wait <hours> | status | units [text] | save <file>
 *            also: path [n] (next n units of the Examples Critical Path)
 *   script   --script file.js (exports next(view) -> command string or null) or file.txt (one command per line)
 *   critical-path [--n 30]  the Examples Critical Path from the loaded state: units in order, usable verified templates after each
 *   help     this text
 * Common:  --load save.json (a Menu > Backup / restore file; default: a fresh game)  --seed N (1)  --save out.json (end state as a
 *          backup the app can restore)  --state file.json (load if it exists, save at the end: carries a step session between calls)
 *          --log file.jsonl (default local/sim/<command>-seed<N>.jsonl)  --no-speech (listening trials fall back to reading)
 *          --strict (exit 1 when any check below failed)
 * Checks on every generated sentence: sentence_validator.validateSentenceString errors (time word vs tense, ...), 씨 on a non-name.
 * Checks on the state after every action: coins >= 0, scores and stars in range, owned ids unique and real, xp below the next level.
 */
require('./cli_help.js').exitWithHeaderHelp(__filename);
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const data = require('../data/data.js');
const D = data.DATA_SCHEMA;
const G = require('../fc2/game.js');
const T = G.T;
const { FC2Core, DEFAULT_OPTS } = require('../fc2/controller.js');
const korean = require('../korean/index.js');
const { generateSentencesForUnit } = require('../shared/sentence_adapter.js');
const vg = require('../korean/generation/verified_sentence_generator.js');
const { validateSentenceString } = require('../korean/generation/sentence_validator.js');
const { buildAliasMap } = require('../korean/core/primitives.js');

// ---------------------------------------------------------------- args
function parseArgs(argv) {
	const pos = [], flags = {};
	const BOOL = new Set(['no-speech', 'help', 'strict']);
	for (let k = 0; k < argv.length; k++) {
		const a = argv[k];
		if (!a.startsWith('--')) { pos.push(a); continue; }
		const [key, val] = a.slice(2).split('=');
		flags[key] = val !== undefined ? val : BOOL.has(key) ? true : argv[++k];
	}
	return { pos, flags };
}

function mulberry32(seed) {
	let a = seed >>> 0;
	const f = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
	f.state = () => a;
	return f;
}

// ---------------------------------------------------------------- the simulated game
/** A core with a simulated clock (ms), a seeded random, the Node sentence generator and in-memory persistence. */
function createSim({ seed = 1, startMs = null, speech = true, opts = null } = {}) {
	const rand = mulberry32(seed);
	korean.setRandomSeed(seed);
	const units0 = data.KR_EN_languageUnits;
	const alias = buildAliasMap(units0);
	const sim = { ms: startMs || Date.UTC(2026, 10, 23, 9, 0, 0), rand, seed, notes: [] };
	const clock = { ms: () => sim.ms, sec: () => Math.floor(sim.ms / 1000), day: (offset = 0) => { const d = new Date(sim.ms + offset * 864e5); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; } };
	const templateIds = vg.getVerifiedTemplatesShared().map(t => t.id);
	const buildUnits = () => new Map(units0.filter(u => u && !alias.has(u[D.Id])).map(u => [u[D.Id], u]));
	const core = new FC2Core({
		units: buildUnits(), C: D, clock, random: rand,
		generate: (id, n, options) => generateSentencesForUnit(id, n, options),
		templateIds: () => templateIds,
		canSpeak: () => speech,
		persist: { game() {}, unit() {}, cell() {} },
		criticalPath: (owned, cands, n) => vg.examplesCriticalPath(owned, cands, n)
	});
	core.opts = { ...DEFAULT_OPTS, ...(opts || {}) };
	sim.core = core;
	sim.clock = clock;
	/** Custom names in the options become runtime units, as the app does on load. */
	sim.addCustomNames = () => {
		for (const c of G.normalizeNames(core.opts.names).custom) data.addLearningUnit(G.customNameRow(c, D));
		core.units = buildUnits();
		core.nameRows = [...core.units.values()].filter(u => G.isNameRow(u, D));
		core.coreIds = null;
	};
	return sim;
}

/** Start the clock at the save's last activity (so decay and ripeness are as the player left them). */
function saveTimeMs(text) {
	try {
		const units = JSON.parse(text).units || {};
		const t = Math.max(0, ...Object.values(units).map(a => Math.max(Number(a[2]) || 0, Number(a[3]) || 0)));
		return t ? t * 1000 : null;
	} catch (_) { return null; }
}

function loadInto(sim, text) {
	const r = sim.core.loadBackup(text);
	sim.addCustomNames();
	sim.core.ensureCoreUnlocked();
	return r;
}

// ---------------------------------------------------------------- checks
const ko = id => (data.KR_EN_languageUnits[id] ? data.KR_EN_languageUnits[id][D.Korean] : `#${id}`);
const SSI = data.KR_EN_languageUnits.find(u => u && u[D.PartofSpeech] === 'Grammar' && data.hasTag(u, 'proper_noun') && data.hasTag(u, 'honorific'));

function sentenceChecks(s) {
	const out = [];
	const v = validateSentenceString(s.ko || '');
	if (!v.valid) for (const e of v.errors) out.push(`${e.code}`);
	if (SSI && / 씨/.test(s.ko || '')) {
		const words = String(s.ko).split(/\s+/), i = words.findIndex(w => w.startsWith('씨'));
		const host = i > 0 ? words[i - 1] : '';
		const hostUnit = (s.unitsUsed || []).map(u => data.KR_EN_languageUnits[u.unitId]).find(u => u && host.startsWith(u[D.Korean]));
		if (hostUnit && !G.isNameRow(hostUnit, D)) out.push('SSI_ON_NON_NAME');
	}
	return out;
}

function stateChecks(core) {
	const g = core.g, out = [];
	if (g.coins < 0) out.push('NEGATIVE_COINS');
	if (new Set(g.owned).size !== g.owned.length) out.push('DUPLICATE_OWNED');
	if (g.owned.some(id => !core.units.has(id))) out.push('OWNED_UNKNOWN_UNIT');
	for (const [id, u] of core.prog) {
		if (u.score < T.MIN_SCORE || u.score > T.MAX_SCORE) { out.push(`SCORE_OUT_OF_RANGE ${id}`); break; }
		if (u.tier < 0 || u.tier >= T.TIERS.length) { out.push(`TIER_OUT_OF_RANGE ${id}`); break; }
	}
	if (g.xp < 0 || g.xp >= G.xpToNext(g.level)) out.push('XP_NOT_BELOW_NEXT_LEVEL');
	if (Object.values(g.h).some(n => n < 0)) out.push('NEGATIVE_HARVEST_COUNT');
	return out;
}

// ---------------------------------------------------------------- policies (self-scores: -1 wrong, +1 right, -2 "much more practice",
// 0 "at least one more practice", +2 "boring, move on"; the player studies, so scores say how well the unit is known)
const POLICIES = {
	correct: () => ({ self: 1, trial: true, quiz: true }),
	wrong: () => ({ self: -1, trial: false, quiz: false }),
	/** A seeded learner who improves with practice: knows a unit with a probability that grows with how often it was answered,
	 *  plus its stars (durable knowledge). Scoring follows from that, so a weak unit does not spiral down forever. */
	mixed: (core, id, rand, practice) => {
		const u = core.unitOf(id), strength = G.effectiveScore(u, core.clock.sec()) + 2 * u.tier;
		const n = practice.has(id) ? practice.get(id) : Math.max(0, u.score) + 2 * u.tier;   // a loaded save's history counts as practice
		practice.set(id, n + 1);
		const p = Math.min(0.95, 0.3 + 0.12 * n + 0.08 * u.tier), knows = rand() < p, r = rand();
		const self = knows ? (strength >= 6 && r < 0.5 ? 2 : strength < 3 && r < 0.3 ? 0 : 1) : (strength <= 0 && r < 0.5 ? -2 : -1);
		return { self, trial: knows, quiz: rand() < p };
	}
};

// ---------------------------------------------------------------- actions (shared by run, step and script)
/** V = from a verified (textbook) template, G = built by the fallback generator (the app shows 📖 / ⚙). */
const srcOf = s => (s && s.isVerifiedStructure ? 'V' : 'G');
const logSentences = list => (list || []).map(s => `${srcOf(s)} ${s.ko}`);

function cardView(core) {
	const k = core.card;
	if (!k) return null;
	const u = core.units.get(k.id), p = core.unitOf(k.id);
	return { id: k.id, ko: u[D.Korean], en: u[D.English], pos: u[D.PartofSpeech], mode: k.mode, status: k.st, side: k.side, score: p.score, tier: p.tier,
		trial: k.trial && { type: k.trial.type, choices: k.trial.choices.map(c => c.label) }, sentences: (k.sentences || []).map(s => ({ src: srcOf(s), ko: s.ko, en: s.enNatural || s.en, template: s.verifiedTemplateId || null })) };
}

function makeRunner(sim, logPath) {
	const core = sim.core;
	const stats = { cards: 0, modes: {}, self: {}, trials: { passed: 0, failed: 0 }, quizzes: { right: 0, wrong: 0, none: 0 }, harvests: 0, established: 0, promoted: 0, lapsed: 0, demoted: 0, rounds: 0,
		pulls: [], sentenceN: 0, sentences: {}, byKo: {}, endings: {}, finals: {}, paths: {}, checks: {}, checkEx: {}, stateChecks: {}, timeline: [] };
	const logLines = [];
	const bump = (m, k, n = 1) => { m[k] = (m[k] || 0) + n; };
	const check = (name, example) => { bump(stats.checks, name); if (!stats.checkEx[name]) stats.checkEx[name] = example; };
	const noteSentences = (list, cardId) => {
		for (const s of list) {
			stats.sentenceN++;
			bump(stats.sentences, s.ko);
			const row = stats.byKo[s.ko] || (stats.byKo[s.ko] = { n: 0, src: srcOf(s), tpl: s.verifiedTemplateId || '', cards: new Set(), en: s.enNatural || s.en || '' });
			row.n++; row.cards.add(ko(cardId));
			const w = String(s.ko).replace(/[.?!~]+$/, '').split(/\s+/);
			bump(stats.endings, w.slice(-2).join(' '));
			const content = (s.unitsUsed || []).filter(x => String(x.kind).toLowerCase() !== 'grammar');
			if (content.length) bump(stats.finals, `${ko(content[content.length - 1].unitId)}`);
			bump(stats.paths, s.verifiedTemplateId ? 'verified' : 'generator');
			for (const c of sentenceChecks(s)) check(c, `${s.ko} (card ${ko(cardId)})`);
		}
	};
	const afterAction = (label) => {
		for (const c of stateChecks(core)) { bump(stats.stateChecks, c); if (!stats.checkEx[c]) stats.checkEx[c] = label; }
	};
	const ensureCard = () => {
		if (core.card && !core.card.done) return core.card;
		if (core.card && core.card.done) {
			if (core.roundDone()) { core.endRound(); stats.rounds++; core.nextRound(); } else core.pickCard();
		} else core.pickCard();
		if (core.card && !core.card._noted) { core.card._noted = true; noteSentences(core.card.sentences || [], core.card.id); }
		return core.card;
	};
	const book = (r, extra) => {
		if (!r) return;
		const ev = r.ev;
		if (ev.harvested) stats.harvests++;
		if (ev.established) stats.established++;
		if (ev.promoted) stats.promoted++;
		if (ev.lapsed) stats.lapsed++;
		if (ev.demoted) stats.demoted++;
		logLines.push(JSON.stringify({ t: new Date(sim.ms).toISOString(), card: r.id, ko: ko(r.id), ...extra, coins: r.coins, xp: r.xp, ev, unit: r.unit, level: core.g.level, totalCoins: core.g.coins }));
	};
	const api = {
		stats,
		card() { return cardView(core) || (ensureCard() && cardView(core)); },
		/** Self-score the current learn/harvest card (flips it first). */
		answer(v) {
			const k = ensureCard();
			if (!k) return 'no card (nothing unlocked: pull)';
			if (k.mode === 'trial') return 'this card is a trial: use trial right|wrong|<i>';
			core.flip();
			const r = core.answerSelf(v);
			stats.cards++; bump(stats.modes, k.mode); bump(stats.self, v);
			book(r, { mode: k.mode, status: k.st, self: v, sentences: logSentences(k.sentences) });
			afterAction(`answer ${v} on ${ko(k.id)}`);
			sim.ms += (sim.secPerCard || 20) * 1000;
			return `${ko(k.id)} ${k.mode} ${v > 0 ? '+' : ''}${v}: +${r.coins} coins${r.ev.established ? ', established' : ''}${r.ev.promoted ? ', promoted' : ''}${r.ev.harvested ? ', harvested' : ''}${r.ev.lapsed ? ', lapsed' : ''}`;
		},
		trial(arg) {
			const k = ensureCard();
			if (!k || k.mode !== 'trial') return 'the current card is not a trial';
			const right = k.trial.choices.findIndex(c => c.id === k.id);
			const i = arg === 'right' || arg === true ? right : arg === 'wrong' || arg === false ? (right + 1) % k.trial.choices.length : Number(arg);
			const r = core.answerTrial(i);
			core.continueCard();
			stats.cards++; bump(stats.modes, 'trial'); stats.trials[k.passed ? 'passed' : 'failed']++;
			book(r, { mode: 'trial', trialType: k.trial.type, passed: k.passed, sentences: logSentences(k.sentences) });
			afterAction(`trial on ${ko(k.id)}`);
			sim.ms += (sim.secPerCard || 20) * 1000;
			return `${ko(k.id)} trial (${k.trial.type}) ${k.passed ? 'passed' : 'failed'}: +${r.coins} coins`;
		},
		/** Sentence test on sentence i of the current card. */
		quiz(arg, i = 0) {
			const k = ensureCard();
			if (!k || k.mode === 'trial') return 'no card that can take a sentence test';
			const s = (k.sentences || [])[i];
			if (!s) return 'that card has no sentence ' + i;
			const choices = core.buildSentenceTest(s, Boolean(core.opts.reverse), k.id);
			if (!choices) { stats.quizzes.none++; return 'no quiz could be built for this sentence'; }
			core.markSeen(new Set(choices.flatMap(c => c.ids || [])));
			const ok = arg === 'right' || arg === true;
			const res = core.answerSentence(s, ok);
			stats.cards++; bump(stats.modes, k.mode); stats.quizzes[ok ? 'right' : 'wrong']++;
			book(res.wrong || res.settled, { mode: k.mode, quiz: ok ? 'right' : 'wrong', sentence: s.ko, choices: choices.map(c => c.text), bonusUnits: res.rows ? res.rows.length : 0, bonusCoins: res.coins || 0 });
			afterAction(`quiz on ${ko(k.id)}`);
			sim.ms += (sim.secPerCard || 20) * 1000 * 2;
			return `${ko(k.id)} quiz ${ok ? 'right' : 'wrong'}${res.rows ? `: ${res.rows.length} units credited, +${res.coins} bonus coins` : ''}`;
		},
		next() { if (core.card && !core.card.done) core.card.done = true; ensureCard(); return cardView(core) ? `next: ${cardView(core).ko}` : 'no card'; },
		/** pack: a Source name, "examples" (the Examples Critical Path), "course" or nothing (course order). */
		pull(pack) {
			const res = core.pull(pack === 'examples' ? G.EXAMPLES_PACK : pack === 'course' ? null : pack || null);
			if (res.blocked) return `pull blocked: ${res.blocked === 'coins' ? `needs ${G.pullCost(core.g)} coins` : 'nursery full (establish some units first)'}`;
			if (!res.ids.length) return 'nothing left to pull';
			stats.pulls.push({ t: new Date(sim.ms).toISOString(), level: core.g.level, ids: res.ids, ko: res.ids.map(ko), cost: res.cost, examples: res.examples });
			afterAction('pull');
			const ex = res.examples ? ` (verified templates usable ${res.examples.before} -> ${res.examples.after})` : '';
			return `pulled ${res.ids.length} for ${res.cost}: ${res.ids.map(ko).join(' ')}${ex}`;
		},
		path(n = 10) {
			const p = core.criticalPath(Number(n));
			if (!p) return 'no critical path (the verified generator is missing)';
			return `verified templates usable now: ${p.before}\n` + p.steps.map((x, i) => `${String(i + 1).padStart(3)} ${String(x.id).padStart(5)} ${ko(x.id).padEnd(12)} gain ${x.gain}  -> ${x.usable} usable`).join('\n');
		},
		usable() { return vg.examplesCriticalPath(core.g.owned, [], 0).before; },
		writeSentences(file) {
			const rows = Object.entries(stats.byKo).sort((a, b) => (a[1].src === b[1].src ? 0 : a[1].src === 'G' ? -1 : 1) || b[1].n - a[1].n);
			const clean = t => String(t).replace(/[\t\n]/g, ' ');
			const out = ['count\tsrc\ttemplate\tcards\tko\ten'].concat(rows.map(([k, r]) => [r.n, r.src, r.tpl, [...r.cards].join(','), k, r.en].map(clean).join('\t')));
			fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
			fs.writeFileSync(file, out.join('\n') + '\n');
			return rows.length;
		},
		collect() { const n = core.collect(); afterAction('collect'); return n ? `collected ${n} idle coins` : 'nothing to collect'; },
		upgrade(key) { return core.upgrade(key) ? `upgraded ${key} to ${G.upLevel(core.g, key)}` : `cannot upgrade ${key}`; },
		claim(i) { const n = core.claim(Number(i)); return n ? `claimed ${n}` : 'nothing to claim'; },
		ascend() { const n = core.ascend(); return n ? `ascended for ${n} seals` : `needs ${T.SEAL_MIN} new stars`; },
		'buy-numbers'() { return core.buyNumbers() ? 'number board bought' : 'cannot buy the number board'; },
		wait(hours) { core.pauseSession(); sim.ms += Number(hours) * 3600 * 1000; if (core.card && !core.card.done) core.card = null; return `clock +${hours} h: ${new Date(sim.ms).toISOString()}`; },
		status() {
			const g = core.g, c = core.counts();
			return `level ${g.level} xp ${g.xp}/${G.xpToNext(g.level)} coins ${g.coins} owned ${g.owned.length} stars ${g.owned.reduce((n, id) => n + core.unitOf(id).tier, 0)} seals ${g.seals} | ${Object.entries(c).map(([k, n]) => `${k} ${n}`).join(' ')} | pull ${G.pullCost(g)} (${core.pullBlocked() || 'ready'}) | ${new Date(sim.ms).toISOString()}`;
		},
		units(text = '') {
			return core.g.owned.filter(id => !text || ko(id).includes(text)).map(id => { const p = core.unitOf(id); return `${id} ${ko(id)} score ${p.score} tier ${p.tier}`; }).join('\n') || '(none)';
		},
		save(file) { fs.writeFileSync(path.resolve(file), core.backupJson()); return `saved ${file}`; },
		timeline(label) { stats.timeline.push({ label, t: new Date(sim.ms).toISOString(), level: core.g.level, coins: core.g.coins, owned: core.g.owned.length, stars: core.g.owned.reduce((n, id) => n + core.unitOf(id).tier, 0) }); },
		writeLog() {
			if (!logPath) return;
			fs.mkdirSync(path.dirname(logPath), { recursive: true });
			fs.writeFileSync(logPath, logLines.join('\n') + (logLines.length ? '\n' : ''));
		},
		logLines
	};
	return api;
}

/** One command line ("answer 1", "trial right", "quiz wrong 1", ...) -> output text. */
function runCommand(api, line) {
	const [cmd, ...args] = line.trim().split(/\s+/);
	if (!cmd || cmd.startsWith('#')) return null;
	if (cmd === 'card') return JSON.stringify(api.card(), null, 1);
	if (cmd === 'answer') return api.answer(Number(args[0]));
	if (cmd === 'trial') return api.trial(args[0]);
	if (cmd === 'quiz') return api.quiz(args[0], Number(args[1] || 0));
	if (typeof api[cmd] === 'function' && !['writeLog', 'timeline', 'card', 'stats', 'writeSentences', 'usable'].includes(cmd)) return api[cmd](...args);
	throw new Error(`unknown command "${cmd}" (see --help)`);
}

// ---------------------------------------------------------------- batch play
function runBatch(sim, api, flags) {
	const core = sim.core, policy = POLICIES[flags.policy || 'mixed'];
	if (!policy) throw new Error(`unknown policy ${flags.policy} (correct | wrong | mixed)`);
	const cards = Number(flags.cards || 200), days = Number(flags.days || 3), sessions = Number(flags.sessions || 2);
	const quizRate = Number(flags.quiz !== undefined ? flags.quiz : 0.1), autoPull = (flags.pull || 'auto') === 'auto', from = flags['pull-from'] || 'course';
	const perSession = Math.max(1, Math.ceil(cards / (days * sessions)));
	const pRand = mulberry32((sim.seed * 7919) >>> 0);   // the policy's own stream, so changing it does not shift the game's random
	const practice = new Map();
	api.timeline('start');
	api.stats.usable = api.usable();
	let played = 0;
	for (let day = 0; day < days && played < cards; day++) {
		for (let s = 0; s < sessions && played < cards; s++) {
			if (day || s) api.wait(24 / sessions);
			api.collect();
			core.ensureQuests();
			while (autoPull && !core.pullBlocked() && core.pullCandidates().length) { if (/nothing left/.test(api.pull(from))) break; }
			for (let n = 0; n < perSession && played < cards; n++) {
				const k = (() => { const v = api.card(); return v && core.card; })();
				if (!k) break;
				const p = policy(core, k.id, pRand, practice);
				if (k.mode === 'trial') api.trial(p.trial ? 'right' : 'wrong');
				else if (pRand() < quizRate && (k.sentences || []).length) api.quiz(p.quiz ? 'right' : 'wrong', 0);
				else api.answer(p.self);
				played++;
				while (autoPull && !core.pullBlocked() && core.counts().new === 0 && core.pullCandidates().length) { if (/nothing left/.test(api.pull(from))) break; }
			}
			for (let i = 0; i < 3; i++) core.claim(i);
			core.claim(-1);
			api.timeline(`day ${day + 1} session ${s + 1}`);
		}
	}
	return played;
}

function summary(sim, api, played, flags) {
	const core = sim.core, st = api.stats, g = core.g;
	const top = (m, k = 8) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, k);
	const pct = n => `${Math.round(100 * n / Math.max(1, st.sentenceN))}%`;
	const out = [];
	out.push(`fc2 sim  seed ${sim.seed}  policy ${flags.policy || 'mixed'}  ${played} cards  ${st.sentenceN} sentences  ${st.rounds} rounds`);
	const t0 = st.timeline[0], t1 = st.timeline[st.timeline.length - 1];
	if (t0 && t1) out.push(`level ${t0.level} -> ${t1.level}   coins ${t0.coins} -> ${t1.coins}   owned ${t0.owned} -> ${t1.owned}   stars ${t0.stars} -> ${t1.stars}`);
	out.push(`timeline: ${st.timeline.map(x => `${x.label}: Lv${x.level} ${x.coins}c ${x.owned}u ${x.stars}★`).join(' | ')}`);
	out.push(`cards by mode: ${top(st.modes).map(([k, n]) => `${k} ${n}`).join(', ')}   self-scores: ${Object.entries(st.self).sort().map(([k, n]) => `${k}:${n}`).join(' ')}`);
	out.push(`trials passed ${st.trials.passed} failed ${st.trials.failed}   quizzes right ${st.quizzes.right} wrong ${st.quizzes.wrong} unbuildable ${st.quizzes.none}`);
	out.push(`established ${st.established}  harvests ${st.harvests}  promotions ${st.promoted}  lapses ${st.lapsed}  demotions ${st.demoted}`);
	out.push(`pulls: ${st.pulls.length ? st.pulls.map(p => `[Lv${p.level} ${p.cost}c] ${p.ko.join(' ')}`).join(' | ') : 'none'}`);
	out.push(`generator paths: ${top(st.paths).map(([k, n]) => `${k} ${pct(n)}`).join(', ')}`);
	out.push(`verified templates usable: ${st.usable !== undefined ? st.usable : '?'} -> ${api.usable()}   (pulls from: ${flags['pull-from'] || 'course'})`);
	out.push(`most repeated sentences: ${top(st.sentences, 5).map(([k, n]) => `${n}x ${st.byKo[k] ? st.byKo[k].src : ''} ${k}`).join(' | ')}`);
	out.push(`most common endings: ${top(st.endings, 6).map(([k, n]) => `${pct(n)} ${k}`).join(' | ')}`);
	out.push(`final content words: ${top(st.finals, 8).map(([k, n]) => `${pct(n)} ${k}`).join(' | ')}`);
	const checks = { ...st.checks, ...st.stateChecks };
	out.push(Object.keys(checks).length ? `CHECKS FAILED: ${Object.entries(checks).map(([k, n]) => `${k} x${n} (e.g. ${st.checkEx[k]})`).join(' | ')}` : 'checks: all passed');
	out.push(`end: level ${g.level}, ${g.coins} coins, ${g.owned.length} unlocked${flags.save ? `, saved to ${flags.save}` : ''}${flags.logPath ? `; per-card log: ${path.relative(process.cwd(), flags.logPath)}` : ''}`);
	return out.join('\n');
}

// ---------------------------------------------------------------- main
function main() {
	const { pos, flags } = parseArgs(process.argv.slice(2));
	const cmd = pos[0];
	if (!cmd || cmd === 'help') { console.log('usage: node tools/fc2_sim.js run|step|script|critical-path [options] (details: --help)'); return; }
	const seed = Number(flags.seed || 1);
	const stateFile = flags.state ? path.resolve(flags.state) : null;
	const loadFile = stateFile && fs.existsSync(stateFile) ? stateFile : flags.load ? path.resolve(flags.load) : null;
	const text = loadFile ? fs.readFileSync(loadFile, 'utf8') : null;
	const meta = text ? (JSON.parse(text).sim || null) : null;
	const sim = createSim({ seed: meta ? meta.seed : seed, startMs: meta ? meta.ms : text ? saveTimeMs(text) : null, speech: !flags['no-speech'] });
	if (text) loadInto(sim, text); else { sim.addCustomNames(); sim.core.newGame(false); }
	sim.secPerCard = Number(flags['sec-per-card'] || 20);
	const logPath = path.resolve(flags.log || path.join(ROOT, 'local', 'sim', `${cmd}-seed${seed}.jsonl`));
	flags.logPath = logPath;
	const api = makeRunner(sim, logPath);
	if (cmd === 'critical-path') {
		console.log(api.path(Number(flags.n || 30)));
	} else if (cmd === 'run') {
		const played = runBatch(sim, api, flags);
		if (flags.save) api.save(flags.save);
		if (flags.sentences) console.log(`wrote ${api.writeSentences(flags.sentences)} distinct sentences to ${flags.sentences}`);
		api.writeLog();
		console.log(summary(sim, api, played, flags));
	} else if (cmd === 'step' || cmd === 'script') {
		let lines;
		if (cmd === 'script') {
			if (!flags.script) throw new Error('script needs --script file.js|file.txt');
			const file = path.resolve(flags.script);
			if (/\.js$/.test(file)) {
				const mod = require(file), max = Number(flags.max || 1000), outs = [];
				for (let i = 0; i < max; i++) {
					const c = mod.next({ core: sim.core, card: () => api.card(), status: () => api.status(), G, T, D, step: i });
					if (!c) break;
					const o = runCommand(api, c);
					if (o !== null) outs.push(`> ${c}\n${o}`);
				}
				console.log(outs.join('\n'));
				lines = [];
			} else lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
		} else if (!flags.do && process.stdin.isTTY) return repl(sim, api, flags, stateFile);
		else lines = flags.do ? String(flags.do).split(';') : fs.readFileSync(0, 'utf8').split(/\r?\n/);
		for (const line of lines) {
			const o = runCommand(api, line);
			if (o !== null) console.log(`> ${line.trim()}\n${o}`);
		}
		if (flags.save) api.save(flags.save);
		api.writeLog();
	} else throw new Error(`unknown command ${cmd} (run | step | script | critical-path)`);
	finish(sim, api, flags, stateFile);
}

function finish(sim, api, flags, stateFile) {
	if (stateFile) {
		const out = JSON.parse(sim.core.backupJson());
		out.sim = { seed: sim.seed, ms: sim.ms };
		fs.writeFileSync(stateFile, JSON.stringify(out));
	}
	const failed = Object.keys(api.stats.checks).length + Object.keys(api.stats.stateChecks).length;
	if (failed && flags.strict) process.exit(1);
}

/** Interactive play for a human at a terminal: one command per line, "quit" or Ctrl-D ends (then --save / --state apply). */
function repl(sim, api, flags, stateFile) {
	const rl = require('readline').createInterface({ input: process.stdin, output: process.stdout, prompt: 'fc2> ' });
	console.log(api.status());
	rl.prompt();
	rl.on('line', line => {
		if (/^\s*(quit|exit)\s*$/.test(line)) return rl.close();
		try { const o = runCommand(api, line); if (o !== null) console.log(o); } catch (e) { console.log('error: ' + e.message); }
		rl.prompt();
	});
	rl.on('close', () => { if (flags.save) api.save(flags.save); api.writeLog(); finish(sim, api, flags, stateFile); });
}

if (require.main === module) {
	try { main(); } catch (e) { console.error('error: ' + e.message); process.exit(2); }
}
module.exports = { createSim, makeRunner, runCommand, runBatch, summary, POLICIES, sentenceChecks, stateChecks, loadInto, mulberry32 };
