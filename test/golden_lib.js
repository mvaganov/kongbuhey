/**
 * Shared helpers for the golden-sentence fixtures (test/golden_sentences.json).
 *
 * A fixture records a human/LLM-triaged judgement ("this surface form is wrong"), which is the
 * only kind of correctness oracle that is independent of the generator's own rules.
 *
 * Fixture shape:
 *   id                 stable id (g001, g002, ...)
 *   targetUnitId       the unit whose details pane produced the sentence
 *   forbiddenKo        exact sentences that must never be generated for that unit
 *   forbiddenSubstrings  optional: a surface pattern that must never appear (use once the rule is understood)
 *   reason             why it is wrong (one line)
 *   status             "open"  = known bug: reported, does not fail the suite
 *                      "fixed" = regression guard: any reproduction fails the suite
 */
'use strict';

const path = require('path');
const korean = require('../korean.js');
const { generateSentencesForUnit } = require('../webapp/selector.js');

const FIXTURE_PATH = path.resolve(__dirname, 'golden_sentences.json');

/** Mirrors how the UI generates: random seedOffset in [0, 997), batch of `count`. Deterministic per seed. */
function sampleSentences(unitId, seeds, count = 3) {
	const out = [];
	for (let s = 1; s <= seeds; s++) {
		korean.setRandomSeed(s);
		const batch = generateSentencesForUnit(unitId, count, { seedOffset: s % 997 });
		for (const sent of batch) out.push({ seed: s, ko: String(sent.ko || '').trim() });
	}
	return out;
}

/** Returns the violations of `fixture` within a pre-generated sample. */
function findViolations(fixture, sample) {
	const exact = new Set((fixture.forbiddenKo || []).map(k => String(k).trim()));
	const subs = fixture.forbiddenSubstrings || [];
	const hits = [];
	for (const { seed, ko } of sample) {
		if (exact.has(ko)) hits.push({ seed, ko, rule: 'exact' });
		for (const sub of subs) if (sub && ko.includes(sub)) hits.push({ seed, ko, rule: `substring "${sub}"` });
	}
	return hits;
}

function loadFixtures(file = FIXTURE_PATH) {
	const fs = require('fs');
	if (!fs.existsSync(file)) return [];
	return JSON.parse(fs.readFileSync(file, 'utf8')).fixtures || [];
}

module.exports = { FIXTURE_PATH, sampleSentences, findViolations, loadFixtures };
