#!/usr/bin/env node
/**
 * Golden sentences: regression fixtures built from sentences the user flagged as bad
 * (webapp "⚐ Bad sentence" button -> flagged/*.json -> tools/triage_flags.js -> test/golden_sentences.json).
 *
 * Unlike test.js Stage 4, this is NOT circular: the expectations come from a human/LLM judgement,
 * not from the generator's own rules. See test/golden_lib.js for the fixture format.
 */
'use strict';

const { loadFixtures, sampleSentences, findViolations } = require('./golden_lib.js');

const SEEDS = parseInt(process.env.GOLDEN_SEEDS || '40', 10);
let passed = 0;
let failed = 0;
function assert(cond, msg) {
	if (cond) { passed++; console.log(`  [PASS] ${msg}`); } else { failed++; console.error(`  [FAIL] ${msg}`); }
}

console.log('======================================================');
console.log('       GOLDEN SENTENCE FIXTURES (flag-review loop)    ');
console.log('======================================================');

// --- Harness self-check: a test that cannot fail is worthless -------------------------------------
const probeUnit = 5;
const probe = sampleSentences(probeUnit, 3);
assert(probe.length > 0, 'sampler produces sentences for the probe unit');
const again = sampleSentences(probeUnit, 3);
assert(JSON.stringify(probe) === JSON.stringify(again), 'sampler is deterministic (same seeds -> same sentences)');
assert(
	findViolations({ forbiddenKo: [probe[0].ko] }, probe).length > 0,
	'checker DETECTS a forbidden sentence that really is generated'
);
assert(
	findViolations({ forbiddenKo: ['이 문장은 생성되지 않는다'] }, probe).length === 0,
	'checker stays quiet for a sentence that is never generated'
);
assert(
	findViolations({ forbiddenSubstrings: [probe[0].ko.slice(0, 2)] }, probe).length > 0,
	'checker DETECTS a forbidden substring pattern'
);

// --- Real fixtures -------------------------------------------------------------------------------
const vsTune = require('../tools/vs_tune.js');
const allFixtures = loadFixtures();
const fixtures = allFixtures.filter(fx => !vsTune.isSlotFixture(fx));
const slotFixtures = allFixtures.filter(fx => vsTune.isSlotFixture(fx));
console.log(`\n--- ${fixtures.length} flag fixture(s), ${SEEDS} seeds each ---`);
const cache = new Map();
let openCount = 0;
for (const fx of fixtures) {
	if (!cache.has(fx.targetUnitId)) cache.set(fx.targetUnitId, sampleSentences(fx.targetUnitId, SEEDS));
	const hits = findViolations(fx, cache.get(fx.targetUnitId));
	const label = `${fx.id} [unit ${fx.targetUnitId}] ${fx.reason || ''}`.trim();
	if (fx.status === 'open') {
		openCount++;
		console.log(`  [KNOWN-BUG] ${label} (${hits.length ? 'still reproduces' : 'no longer reproduces - set status "fixed"'})`);
	} else {
		assert(hits.length === 0, `${label}${hits.length ? ` -> e.g. seed ${hits[0].seed}: ${hits[0].ko}` : ''}`);
	}
}

// --- Slot fixtures (tools/vs_tune.js fixture): exact, no sampling ----------------------------------
// "template T, slot i varied alone must not (bad) / must (ok) produce unit U". An open fixture that the
// generator now satisfies FAILS too, so statuses never go stale: `node tools/vs_tune.js fixtures --sync`.
console.log(`\n--- ${slotFixtures.length} slot fixture(s) ---`);
const ids = new Set();
for (const fx of slotFixtures) {
	const label = `${fx.id} ${fx.templateId}[${fx.slot}] unit ${fx.unitId} expect ${fx.expect}: ${fx.reason || ''}`;
	const shapeOk = !ids.has(fx.id) && ['bad', 'ok'].includes(fx.expect) && ['open', 'fixed'].includes(fx.status)
		&& ['clear', 'unsure', 'human'].includes(fx.confidence) && (!fx.gapClass || vsTune.GAP_CLASSES[fx.gapClass]);
	ids.add(fx.id);
	if (!shapeOk) { assert(false, `${label} -> malformed (unique id, expect bad|ok, status open|fixed, confidence clear|unsure|human, known gapClass)`); continue; }
	const st = vsTune.slotFixtureState(fx);
	if (fx.status === 'open') {
		openCount++;
		if (st.satisfied) assert(false, `${label} -> now satisfied: run \`node tools/vs_tune.js fixtures --sync\` to mark it fixed`);
		else console.log(`  [KNOWN-BUG] ${label}`);
	} else {
		assert(st.satisfied, `${label}${st.satisfied ? '' : ` -> violated: ${st.ko || st.note}`}`);
	}
}

// --- Tuning data invariants (rules, gap classes, review ledger) -------------------------------------
const vg = require('../korean/generation/verified_sentence_generator.js');
const templates = vg.getAllVerifiedSentences();
const badRules = [];
for (const t of templates) (t.rules || []).forEach((r, k) => { const e = vsTune.validateRule(r); if (e) badRules.push(`${t.id} rule ${k}: ${e}`); });
assert(badRules.length === 0, `every template rule is valid (gap rules carry a known class)${badRules.length ? ' -> ' + badRules.slice(0, 3).join('; ') : ''}`);
assert(validateCheck(), 'validateRule rejects a gap without class and accepts one with a class');
function validateCheck() {
	return vsTune.validateRule({ kind: 'gap', text: 'tomorrow with past tense' }) !== null
		&& vsTune.validateRule({ kind: 'gap', class: 'tense-time', slot: 0, text: '내일 with past tense 잤어요' }) === null
		&& vsTune.validateRule({ kind: 'gap', class: 'data-tag', text: '오늘 lacks temporalNoun' }) !== null
		&& vsTune.validateRule({ kind: 'noTags', slot: 1, tags: [] }) !== null;
}
// Every template reproduces its own sentence when any one variable slot is varied (the original is attested
// Korean; tag filters keep it, and validator errors it raises itself are waived in the generator).
const notSelf = [];
for (const t of templates) t.slots.forEach((s, i) => {
	if (s.inflection && ['exact', 'fixed_grammar', 'fixed'].includes(String(s.inflection.stemForm).toLowerCase())) return;
	const r = vsTune.slotAdmits(t, i, s.originalUnitId);
	if (!r.admitted && r.note !== 'locked slot') notSelf.push(`${t.id}[${i}] ${r.note}`);
});
assert(notSelf.length === 0, `every template realizes its original word in every variable slot${notSelf.length ? ` -> ${notSelf.length}, e.g. ${notSelf.slice(0, 3).join('; ')}` : ''}`);
const ledger = vsTune.readLedger();
const tplIds = new Set(templates.map(t => t.id));
const batchIds = new Set(ledger.batches.flatMap(b => b.ids));
const strayLedger = [...batchIds, ...Object.keys(ledger.reviewed)].filter(id => !tplIds.has(id));
assert(strayLedger.length === 0, `review ledger names only existing templates${strayLedger.length ? ' -> ' + strayLedger.slice(0, 5).join(', ') : ''}`);
const unbatched = Object.keys(ledger.reviewed).filter(id => !batchIds.has(id));
assert(unbatched.length === 0, `every reviewed template belongs to a batch${unbatched.length ? ' -> ' + unbatched.slice(0, 5).join(', ') : ''}`);
const order = vsTune.reviewOrder();
const minG = (t) => (t.grammarUnitIds.length ? Math.min(...t.grammarUnitIds) : 1e9);
assert(order.length > 0 && minG(order[0]) === Math.min(...order.map(minG)) && order[0].slots.length <= order[1].slots.length,
	'review order starts with the lowest grammar unit id, shortest template first');

console.log(`\nTOTAL: ${passed + failed}  PASSED: ${passed}  FAILED: ${failed}  KNOWN-BUGS(open): ${openCount}`);
if (failed > 0) process.exit(1);
