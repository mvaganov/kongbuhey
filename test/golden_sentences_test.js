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
const fixtures = loadFixtures();
console.log(`\n--- ${fixtures.length} fixture(s), ${SEEDS} seeds each ---`);
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

console.log(`\nTOTAL: ${passed + failed}  PASSED: ${passed}  FAILED: ${failed}  KNOWN-BUGS(open): ${openCount}`);
if (failed > 0) process.exit(1);
