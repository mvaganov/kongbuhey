#!/usr/bin/env node
'use strict';
/**
 * test/fc2_sim_test.js - the headless fc2 simulator (tools/fc2_sim.js) as a regression harness for game flow.
 * Default (~2 s): determinism by seed, a scripted session, backup round trip through fc2/store.js, policy sanity, the checks catch faults.
 * --full: 200-card, 3-day runs with every policy, fresh and from the bundled fresh state, with zero check failures.
 * Usage: node test/fc2_sim_test.js [--full]
 */
const assert = require('assert');
const path = require('path');
const { execFileSync } = require('child_process');
const sim = require('../tools/fc2_sim.js');
const Store = require('../fc2/store.js');

const FULL = process.argv.includes('--full');
const SIM = path.resolve(__dirname, '..', 'tools', 'fc2_sim.js');
let passed = 0;
const test = (name, fn) => {
	try { fn(); passed++; } catch (e) { console.error(`FAIL ${name}\n  ${e.message.split('\n').join('\n  ')}`); process.exitCode = 1; }
};

/** A fresh game, played by batch policy; returns the runner (stats, log lines) and the sim. */
function play({ seed = 3, cards = 30, days = 2, policy = 'mixed', quiz = 0.2 } = {}) {
	const s = sim.createSim({ seed });
	s.addCustomNames();
	s.core.newGame(false);
	s.secPerCard = 20;
	const api = sim.makeRunner(s, null);
	const played = sim.runBatch(s, api, { cards, days, policy, quiz });
	return { s, api, played };
}
const allChecks = api => ({ ...api.stats.checks, ...api.stats.stateChecks });

// Same seed, same game: compared across separate processes, since the generator keeps module-level caches.
test('same seed replays the same game (separate processes)', () => {
	const run = () => execFileSync(process.execPath, [SIM, 'run', '--cards', '25', '--days', '1', '--seed', '5', '--log', path.join(require('os').tmpdir(), 'fc2_sim_test.jsonl')], { encoding: 'utf8' });
	const a = run(), b = run();
	assert.strictEqual(a.replace(/per-card log.*/, ''), b.replace(/per-card log.*/, ''), 'two runs with seed 5 differ');
	assert.match(a, /checks: all passed/, a);
});

test('scripted session: pull, answer, quiz, wait, collect', () => {
	const s = sim.createSim({ seed: 1 });
	s.addCustomNames();
	s.core.newGame(false);
	const api = sim.makeRunner(s, null);
	const out = ['pull', 'answer 1', 'answer 1', 'answer -1', 'quiz right', 'wait 12', 'collect'].map(c => sim.runCommand(api, c));
	assert.match(out[0], /^pulled \d+ for 0:/, out[0]);
	assert.ok(s.core.g.owned.length >= 10, `owned ${s.core.g.owned.length}: core units plus the free pull`);
	assert.strictEqual(api.stats.cards, 4);
	assert.match(out[4], /quiz right/, out[4]);
	assert.match(out[6], /collected \d+|nothing to collect/, out[6]);
	assert.ok(s.core.g.coins > 0, 'answers paid coins');
	assert.deepStrictEqual(allChecks(api), {});
	assert.throws(() => sim.runCommand(api, 'bogus'), /unknown command/);
});

test('end state is a backup the app restores (fc2/store.js) and the sim reloads', () => {
	const { s } = play({ cards: 20, days: 1 });
	const text = s.core.backupJson();
	const b = Store.unpackBackup(text);
	assert.ok(b.game && b.prog, 'unpackBackup returns game and prog');
	const t = sim.createSim({ seed: 9 });
	sim.loadInto(t, text);
	assert.deepStrictEqual(t.core.g.owned, s.core.g.owned);
	assert.strictEqual(t.core.g.coins, s.core.g.coins);
	assert.strictEqual(t.core.g.level, s.core.g.level);
	for (const id of s.core.g.owned) assert.deepStrictEqual(t.core.unitOf(id), s.core.unitOf(id), `unit ${id} progress`);
});

test('policies move the game the way their scores say', () => {
	const good = play({ policy: 'correct', cards: 40 }), bad = play({ policy: 'wrong', cards: 40 });
	assert.ok(good.api.stats.established > 0, 'always-correct establishes units');
	assert.strictEqual(bad.api.stats.established, 0, 'always-wrong establishes nothing');
	assert.ok(good.s.core.g.xp + 1000 * good.s.core.g.level > bad.s.core.g.xp + 1000 * bad.s.core.g.level, 'correct out-levels wrong');
	assert.deepStrictEqual(allChecks(good.api), {});
	assert.deepStrictEqual(allChecks(bad.api), {});
});

test('the checks catch faults', () => {
	const { s } = play({ cards: 5, days: 1 });
	s.core.g.coins = -1;
	s.core.g.owned.push(s.core.g.owned[0]);
	const found = sim.stateChecks(s.core);
	assert.ok(found.includes('NEGATIVE_COINS') && found.includes('DUPLICATE_OWNED'), found.join(','));
	assert.ok(sim.sentenceChecks({ ko: '내일 학교에 갔어요.', unitsUsed: [] }).length > 0, 'tomorrow + past tense is reported');
	assert.deepStrictEqual(sim.sentenceChecks({ ko: '내일 학교에 갈 거예요.', unitsUsed: [] }), []);
});

test('Examples Critical Path: monotone, beats course order, pulls through the Shop option', () => {
	const vg = require('../korean/generation/verified_sentence_generator.js');
	const s = sim.createSim({ seed: 2 });
	s.addCustomNames();
	s.core.newGame(false);
	s.core.ensureCoreUnlocked();
	const cands = s.core.pullCandidates().map(c => c.id);
	const p = vg.examplesCriticalPath(s.core.g.owned, cands, 40);
	assert.strictEqual(p.ids.length, 40);
	assert.strictEqual(new Set(p.ids).size, 40, 'no unit twice');
	p.steps.forEach((x, i) => assert.ok(x.usable >= (i ? p.steps[i - 1].usable : p.before), 'usable templates never drop'));
	assert.strictEqual(p.completed.length, p.after, 'completed lists every usable template once');
	p.completed.forEach((c, i) => assert.ok(c.step >= (i ? p.completed[i - 1].step : 0), 'completed is in step order (vs_tune batch --critical-path)'));
	const G = require('../fc2/game.js');
	const course = G.pickPull(s.core.pullCandidates(), 40, () => 0, null);
	const courseAfter = vg.examplesCriticalPath([...s.core.g.owned, ...course], [], 0).before;
	assert.ok(p.after >= courseAfter + 10, `critical path ${p.after} usable templates after 40 unlocks vs course order ${courseAfter}`);
	const api = sim.makeRunner(s, null);
	const out = sim.runCommand(api, 'pull examples');
	assert.match(out, /verified templates usable \d+ -> \d+/, out);
	assert.deepStrictEqual(s.core.g.owned.slice(-p.steps.slice(0, 5).length), p.ids.slice(0, 5), 'the free pull takes the first steps of the path');
	assert.match(sim.runCommand(api, 'path 3'), /^verified templates usable now: \d+\n +1 /);
});

if (FULL) {
	for (const policy of Object.keys(sim.POLICIES)) {
		test(`full: 200 cards over 3 days, policy ${policy}, no check failures`, () => {
			const { api, played } = play({ policy, cards: 200, days: 3, seed: 11 });
			assert.strictEqual(played, 200);
			assert.deepStrictEqual(allChecks(api), {}, JSON.stringify(api.stats.checkEx));
		});
	}
	test('full: a JS script policy drives step commands', () => {
		const fs = require('fs'), os = require('os');
		const file = path.join(os.tmpdir(), 'fc2_sim_script_test.js');
		fs.writeFileSync(file, `module.exports.next = v => v.step === 0 ? 'pull' : v.step > 30 ? null : (v.card() && v.card().mode === 'trial' ? 'trial right' : 'answer 1');`);
		const out = execFileSync(process.execPath, [SIM, 'script', '--script', file, '--log', path.join(os.tmpdir(), 'fc2_sim_script.jsonl')], { encoding: 'utf8' });
		assert.match(out, /pulled/);
		assert.ok((out.match(/^> (answer|trial)/gm) || []).length === 30, 'thirty answers');
	});
}

if (!process.exitCode) console.log(`fc2 sim: ${passed} passed${FULL ? ' (full)' : ''}`);
