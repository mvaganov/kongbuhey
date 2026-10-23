#!/usr/bin/env node
/**
 * test/temporal_concord_test.js - Feature 5: Temporal Tense Concord Test Suite
 *
 * Validates:
 *  1. Dynamic Temporal Sets Extraction & Zero Hardcoded Hangul:
 *     - PAST_TIME_WORDS, FUTURE_TIME_WORDS, PRESENT_TIME_WORDS, BARE_TIME_WORDS_NO_PARTICLE
 *     - PAST_GRAMMAR_IDS, FUTURE_GRAMMAR_IDS, PRESENT_GRAMMAR_IDS
 *     - Zero hardcoded Set literals in korean.js
 *  2. Deictic Time Particle Prohibition:
 *     - Pure deictic time words (어제, 오늘, 내일, 지금, 그제, 모레, 작년, 내년, 올해, 요즘, 언제, 아까, 방금, 이제)
 *       strictly forbid the time particle '-에' (*어제에, *오늘에, *내일에, *지금에 are ungrammatical).
 *     - attachParticle(word, "time") returns bare word (or with topic particle if requested).
 *  3. Non-Deictic Time Nouns Require/Attach '-에':
 *     - Clock time (3시에), days of week (월요일에, 주말에), months (1월에), seasons (봄에, 여름에),
 *       periods (낮에, 밤에, 아침에, 저녁에, 방학에) attach '-에'.
 *  4. Past-Restricted Time Words & Predicate Concord:
 *     - Past words (어제, 그제, 작년, 지난주, 지난달, 아까, 방금, 옛날) strictly require past tense (-았/었-).
 *     - Strictly forbid prospective/future endings (-(으)ㄹ 거예요, -(으)ㄹ게요, -(으)려고 하다, -을 건가요).
 *  5. Future-Restricted Time Words & Predicate Concord:
 *     - Future words (내일, 모레, 내년, 다음주, 다음달, 곧, 앞으로) strictly require future/prospective endings.
 *     - Strictly forbid past tense (-았/었-).
 *  6. Present / Habitual / Progressive Time Words:
 *     - 지금, 현재, 요즘, 매일, 항상 pair with present tense (-아/어요, -ㅂ니다/습니다) or progressive (-고 있다).
 *  7. Word & Grammar Filtering by Tense:
 *     - filterWordsByTense and filterGrammarByTense enforce tense compatibility across pools.
 *  8. Sentence Generation Tense Concord (generateSemanticSentence):
 *     - Tense context propagates and enforces concord between adverbial tokens and verbal clause endings.
 *  9. Accidental Deictic Time Particle Repair (applyTemporalConcord & applyMorphology):
 *     - Automatically strips ungrammatical '-에' after deictic words (*어제에 -> 어제).
 * 10. Exhaustive Cross-Validation & Violation Detection (validateTemporalConcord):
 *     - Accurately detects and reports temporal clashes and ungrammatical combinations.
 *
 * Usage:
 *   node test/temporal_concord_test.js
 */

const fs = require('fs');
const path = require('path');
const {
	KR_EN_languageUnits,
	DATA_SCHEMA,
	getWords,
	getFilteredWords,
	hasTag
} = require('../data.js');

const korean = require('../korean.js');
const {
	attachParticle,
	applyMorphology,
	generateSemanticSentence,
	PAST_TIME_WORDS,
	FUTURE_TIME_WORDS,
	PRESENT_TIME_WORDS,
	BARE_TIME_WORDS_NO_PARTICLE,
	PAST_GRAMMAR_IDS,
	FUTURE_GRAMMAR_IDS,
	PRESENT_GRAMMAR_IDS,
	getTemporalPolarity,
	isDeicticTimeWord,
	filterWordsByTense,
	filterGrammarByTense,
	validateTemporalConcord,
	applyTemporalConcord
} = korean;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
	totalTests++;
	if (!condition) {
		failedTests++;
		console.error(`  [FAIL] ${message}`);
	} else {
		passedTests++;
	}
}

console.log("======================================================");
console.log("     FEATURE 5: TEMPORAL TENSE CONCORD TEST SUITE     ");
console.log("======================================================\n");

// -----------------------------------------------------------------------------
// [1/10] Dynamic Temporal Sets Extraction & Zero Hardcoded Hangul
// -----------------------------------------------------------------------------
console.log("[1/10] Dynamic Temporal Sets Extraction & Zero Hardcoded Hangul");

assert(PAST_TIME_WORDS instanceof Set, "PAST_TIME_WORDS is a Set");
assert(PAST_TIME_WORDS.size >= 10, `PAST_TIME_WORDS has >= 10 entries (found ${PAST_TIME_WORDS.size})`);

const expectedPast = ['어제', '그제', '작년', '지난해', '지난달', '지난주', '아까', '방금', '옛날', '지난번'];
for (const word of expectedPast) {
	assert(PAST_TIME_WORDS.has(word), `PAST_TIME_WORDS contains '${word}'`);
}

assert(FUTURE_TIME_WORDS instanceof Set, "FUTURE_TIME_WORDS is a Set");
assert(FUTURE_TIME_WORDS.size >= 8, `FUTURE_TIME_WORDS has >= 8 entries (found ${FUTURE_TIME_WORDS.size})`);

const expectedFuture = ['내일', '모레', '내년', '다음달', '다음주', '곧', '앞으로'];
for (const word of expectedFuture) {
	assert(FUTURE_TIME_WORDS.has(word), `FUTURE_TIME_WORDS contains '${word}'`);
}

assert(PRESENT_TIME_WORDS instanceof Set, "PRESENT_TIME_WORDS is a Set");
assert(PRESENT_TIME_WORDS.size >= 8, `PRESENT_TIME_WORDS has >= 8 entries (found ${PRESENT_TIME_WORDS.size})`);

const expectedPresent = ['오늘', '지금', '현재', '요즘', '매일', '항상', '날마다', '늘'];
for (const word of expectedPresent) {
	assert(PRESENT_TIME_WORDS.has(word), `PRESENT_TIME_WORDS contains '${word}'`);
}

assert(BARE_TIME_WORDS_NO_PARTICLE instanceof Set, "BARE_TIME_WORDS_NO_PARTICLE is a Set");
assert(BARE_TIME_WORDS_NO_PARTICLE.size >= 10, `BARE_TIME_WORDS_NO_PARTICLE has >= 10 entries (found ${BARE_TIME_WORDS_NO_PARTICLE.size})`);

const expectedDeicticBare = ['어제', '오늘', '내일', '지금', '그제', '모레', '요즘', '언제', '아까', '방금', '이제'];
for (const word of expectedDeicticBare) {
	assert(BARE_TIME_WORDS_NO_PARTICLE.has(word), `BARE_TIME_WORDS_NO_PARTICLE contains '${word}'`);
}

assert(PAST_GRAMMAR_IDS instanceof Set && PAST_GRAMMAR_IDS.size >= 3, `PAST_GRAMMAR_IDS is Set with >= 3 entries (found ${PAST_GRAMMAR_IDS.size})`);
assert(FUTURE_GRAMMAR_IDS instanceof Set && FUTURE_GRAMMAR_IDS.size >= 4, `FUTURE_GRAMMAR_IDS is Set with >= 4 entries (found ${FUTURE_GRAMMAR_IDS.size})`);
assert(PRESENT_GRAMMAR_IDS instanceof Set && PRESENT_GRAMMAR_IDS.size >= 3, `PRESENT_GRAMMAR_IDS is Set with >= 3 entries (found ${PRESENT_GRAMMAR_IDS.size})`);

// Verify absence of hardcoded Hangul Set literals in korean.js
const koreanCode = fs.readFileSync(path.join(__dirname, '../korean.js'), 'utf8');
assert(!koreanCode.includes('const PAST_TIME_WORDS = new Set(["어제"'), "PAST_TIME_WORDS is not hardcoded literal");
assert(!koreanCode.includes('const FUTURE_TIME_WORDS = new Set(["내일"'), "FUTURE_TIME_WORDS is not hardcoded literal");
assert(!koreanCode.includes('const BARE_TIME_WORDS_NO_PARTICLE = new Set(["어제"'), "BARE_TIME_WORDS_NO_PARTICLE is not hardcoded literal");

// -----------------------------------------------------------------------------
// [2/10] Deictic Time Particle Prohibition (-에 strictly forbidden)
// -----------------------------------------------------------------------------
console.log("\n[2/10] Deictic Time Particle Prohibition (-에 strictly forbidden)");

for (const word of expectedDeicticBare) {
	assert(isDeicticTimeWord(null, word), `isDeicticTimeWord('${word}') returns true`);
	
	// attachParticle with "time" must return bare word
	const attached = attachParticle(word, "time");
	assert(attached === word, `attachParticle('${word}', 'time') returns bare '${word}' (not '${attached}')`);
	assert(!attached.endsWith("에"), `attachParticle('${word}', 'time') does not end with -에`);

	// attachParticle with topic: true attaches 은/는
	const topicAttached = attachParticle(word, "time", null, { topic: true });
	assert(topicAttached.endsWith("은") || topicAttached.endsWith("는"), `attachParticle('${word}', 'time', { topic: true }) attaches topic marker: '${topicAttached}'`);

	// validateTemporalConcord flags word + 에
	const validation = validateTemporalConcord(`${word}에 학교에 갔어요`);
	assert(!validation.valid, `validateTemporalConcord flags '${word}에': valid=${validation.valid}`);
	assert(validation.errors.some(e => e.includes(`*${word}에`)), `Error mentions *${word}에`);

	// applyMorphology strips word + 에
	const cleaned = applyMorphology(`${word}에 친구를 만났어요`);
	assert(cleaned.startsWith(`${word} `), `applyMorphology strips -에 from '${word}에': got '${cleaned}'`);
}

// -----------------------------------------------------------------------------
// [3/10] Non-Deictic Time Nouns Require/Attach '-에'
// -----------------------------------------------------------------------------
console.log("\n[3/10] Non-Deictic Time Nouns Require/Attach '-에'");

const nonDeicticTimeNouns = [
	{ noun: "3시", expected: "3시에" },
	{ noun: "월요일", expected: "월요일에" },
	{ noun: "주말", expected: "주말에" },
	{ noun: "1월", expected: "1월에" },
	{ noun: "봄", expected: "봄에" },
	{ noun: "여름", expected: "여름에" },
	{ noun: "가을", expected: "가을에" },
	{ noun: "겨울", expected: "겨울에" },
	{ noun: "낮", expected: "낮에" },
	{ noun: "밤", expected: "밤에" },
	{ noun: "아침", expected: "아침에" },
	{ noun: "저녁", expected: "저녁에" },
	{ noun: "방학", expected: "방학에" },
	{ noun: "생일", expected: "생일에" },
	{ noun: "작년", expected: "작년에" },
	{ noun: "내년", expected: "내년에" },
	{ noun: "올해", expected: "올해에" }
];

for (const { noun, expected } of nonDeicticTimeNouns) {
	assert(!isDeicticTimeWord(null, noun), `isDeicticTimeWord('${noun}') returns false`);
	const attached = attachParticle(noun, "time");
	assert(attached === expected, `attachParticle('${noun}', 'time') returns '${expected}': got '${attached}'`);

	// Valid sentences with non-deictic time nouns + 에 should not be flagged as particle errors
	const validation = validateTemporalConcord(`${attached} 친구를 만났어요`);
	assert(!validation.errors.some(e => e.includes("cannot take time particle -에")), `No deictic particle error for '${attached}'`);
}

// -----------------------------------------------------------------------------
// [4/10] Past-Restricted Time Words & Predicate Concord
// -----------------------------------------------------------------------------
console.log("\n[4/10] Past-Restricted Time Words & Predicate Concord");

const pastTestWords = ['어제', '그제', '작년', '지난주', '지난달', '아까', '방금', '옛날'];
for (const word of pastTestWords) {
	assert(getTemporalPolarity(word) === "past", `getTemporalPolarity('${word}') is 'past'`);

	// Past tense pairings -> valid
	const validInformal = `${word} 도서관에 갔어요`;
	const validFormal = `${word} 영화를 봤습니다`;
	const validAte = `${word} 밥을 먹었어요`;
	assert(validateTemporalConcord(validInformal).valid, `Valid past sentence: "${validInformal}"`);
	assert(validateTemporalConcord(validFormal).valid, `Valid past sentence: "${validFormal}"`);
	assert(validateTemporalConcord(validAte).valid, `Valid past sentence: "${validAte}"`);

	// Future tense pairings -> invalid (flagged!)
	const invalidFuture1 = `${word} 도서관에 갈 거예요`;
	const invalidFuture2 = `${word} 영화를 볼게요`;
	const invalidFuture3 = `${word} 밥을 먹으려고 해요`;
	const invalidFuture4 = `${word} 언제 갈 건가요?`;

	const res1 = validateTemporalConcord(invalidFuture1);
	const res2 = validateTemporalConcord(invalidFuture2);
	const res3 = validateTemporalConcord(invalidFuture3);
	const res4 = validateTemporalConcord(invalidFuture4);

	assert(!res1.valid, `Flagged past + -(으)ㄹ 거예요: "${invalidFuture1}"`);
	assert(!res2.valid, `Flagged past + -(으)ㄹ게요: "${invalidFuture2}"`);
	assert(!res3.valid, `Flagged past + -(으)려고 해요: "${invalidFuture3}"`);
	assert(!res4.valid, `Flagged past + -을 건가요: "${invalidFuture4}"`);
}

// -----------------------------------------------------------------------------
// [5/10] Future-Restricted Time Words & Predicate Concord
// -----------------------------------------------------------------------------
console.log("\n[5/10] Future-Restricted Time Words & Predicate Concord");

const futureTestWords = ['내일', '모레', '내년', '다음주', '다음달', '곧', '앞으로'];
for (const word of futureTestWords) {
	assert(getTemporalPolarity(word) === "future", `getTemporalPolarity('${word}') is 'future'`);

	// Future tense pairings -> valid
	const validFuture1 = `${word} 도서관에 갈 거예요`;
	const validFuture2 = `${word} 영화를 볼게요`;
	const validFuture3 = `${word} 밥을 먹으려고 해요`;
	assert(validateTemporalConcord(validFuture1).valid, `Valid future sentence: "${validFuture1}"`);
	assert(validateTemporalConcord(validFuture2).valid, `Valid future sentence: "${validFuture2}"`);
	assert(validateTemporalConcord(validFuture3).valid, `Valid future sentence: "${validFuture3}"`);

	// Past tense pairings -> invalid (flagged!)
	const invalidPast1 = `${word} 도서관에 갔어요`;
	const invalidPast2 = `${word} 영화를 봤습니다`;
	const invalidPast3 = `${word} 밥을 먹었어요`;
	const invalidPast4 = `${word} 친구를 만났어요`;

	const res1 = validateTemporalConcord(invalidPast1);
	const res2 = validateTemporalConcord(invalidPast2);
	const res3 = validateTemporalConcord(invalidPast3);
	const res4 = validateTemporalConcord(invalidPast4);

	assert(!res1.valid, `Flagged future + 갔어요: "${invalidPast1}"`);
	assert(!res2.valid, `Flagged future + 봤습니다: "${invalidPast2}"`);
	assert(!res3.valid, `Flagged future + 먹었어요: "${invalidPast3}"`);
	assert(!res4.valid, `Flagged future + 만났어요: "${invalidPast4}"`);
}

// -----------------------------------------------------------------------------
// [6/10] Present / Habitual / Progressive Time Words
// -----------------------------------------------------------------------------
console.log("\n[6/10] Present / Habitual / Progressive Time Words");

const presentTestWords = ['지금', '현재', '요즘', '매일', '항상'];
for (const word of presentTestWords) {
	assert(getTemporalPolarity(word) === "present", `getTemporalPolarity('${word}') is 'present'`);

	const presentSentence1 = `${word} 밥을 먹고 있어요`;
	const presentSentence2 = `${word} 학교에 가요`;
	const presentSentence3 = `${word} 공부합니다`;

	assert(validateTemporalConcord(presentSentence1).valid, `Valid present sentence: "${presentSentence1}"`);
	assert(validateTemporalConcord(presentSentence2).valid, `Valid present sentence: "${presentSentence2}"`);
	assert(validateTemporalConcord(presentSentence3).valid, `Valid present sentence: "${presentSentence3}"`);
}

// -----------------------------------------------------------------------------
// [7/10] Word & Grammar Filtering by Tense
// -----------------------------------------------------------------------------
console.log("\n[7/10] Word & Grammar Filtering by Tense");

const allAdverbs = getWords("Adverb");
const pastFilteredWords = filterWordsByTense(allAdverbs, "past");
const futureFilteredWords = filterWordsByTense(allAdverbs, "future");
const presentFilteredWords = filterWordsByTense(allAdverbs, "present");

assert(pastFilteredWords.some(w => w[DATA_SCHEMA.Korean] === "아까"), "pastFilteredWords contains '아까'");
assert(!pastFilteredWords.some(w => w[DATA_SCHEMA.Korean] === "곧"), "pastFilteredWords excludes future '곧'");

assert(futureFilteredWords.some(w => w[DATA_SCHEMA.Korean] === "곧"), "futureFilteredWords contains '곧'");
assert(!futureFilteredWords.some(w => w[DATA_SCHEMA.Korean] === "아까"), "futureFilteredWords excludes past '아까'");

assert(presentFilteredWords.some(w => w[DATA_SCHEMA.Korean] === "항상"), "presentFilteredWords contains '항상'");
assert(!presentFilteredWords.some(w => w[DATA_SCHEMA.Korean] === "아까"), "presentFilteredWords excludes past '아까'");
assert(!presentFilteredWords.some(w => w[DATA_SCHEMA.Korean] === "곧"), "presentFilteredWords excludes future '곧'");

const allGrammars = getWords("Grammar");
const pastFilteredGrammars = filterGrammarByTense(allGrammars, "past");
const futureFilteredGrammars = filterGrammarByTense(allGrammars, "future");

assert(pastFilteredGrammars.some(g => g[DATA_SCHEMA.Id] === 335), "pastFilteredGrammars contains Unit 335 (~았/었어요)");
assert(!pastFilteredGrammars.some(g => g[DATA_SCHEMA.Id] === 460), "pastFilteredGrammars excludes Unit 460 (~(으)ㄹ 거예요)");

assert(futureFilteredGrammars.some(g => g[DATA_SCHEMA.Id] === 460), "futureFilteredGrammars contains Unit 460 (~(으)ㄹ 거예요)");
assert(!futureFilteredGrammars.some(g => g[DATA_SCHEMA.Id] === 335), "futureFilteredGrammars excludes Unit 335 (~았/었어요)");

// -----------------------------------------------------------------------------
// [8/10] Sentence Generation Tense Concord (generateSemanticSentence)
// -----------------------------------------------------------------------------
console.log("\n[8/10] Sentence Generation Tense Concord (generateSemanticSentence)");

// Generating from past grammar unit (Id 335: ~았/었어요)
for (let i = 0; i < 5; i++) {
	const res = generateSemanticSentence(335);
	const resolved = applyMorphology(res.ko);
	const validation = validateTemporalConcord(resolved, { temporal_polarity: "past" });
	assert(validation.valid, `generateSemanticSentence(335) valid: "${resolved}"`);
	assert(!/(내일|모레|다음주|다음달|내년|곧)/.test(resolved), `No future adverbs in past sentence: "${resolved}"`);
}

// Generating from future grammar unit (Id 460: ~(으)ㄹ 거예요)
for (let i = 0; i < 5; i++) {
	const res = generateSemanticSentence(460);
	const resolved = applyMorphology(res.ko);
	const validation = validateTemporalConcord(resolved, { temporal_polarity: "future" });
	assert(validation.valid, `generateSemanticSentence(460) valid: "${resolved}"`);
	assert(!/(어제|그제|작년|지난주|지난달|아까|방금|옛날)/.test(resolved), `No past adverbs in future sentence: "${resolved}"`);
}

// Generating with explicit context: { temporal_polarity: "past" }
for (let i = 0; i < 5; i++) {
	const res = generateSemanticSentence("{Adv} {VP_AVst}", 0, { temporal_polarity: "past" });
	const resolved = applyMorphology(res.ko);
	assert(!/(내일|모레|다음주|다음달|내년|곧)/.test(resolved), `No future adverbs generated under past context: "${resolved}"`);
}

// Generating with explicit context: { temporal_polarity: "future" }
for (let i = 0; i < 5; i++) {
	const res = generateSemanticSentence("{Adv} {VP_AVst}", 0, { temporal_polarity: "future" });
	const resolved = applyMorphology(res.ko);
	assert(!/(어제|그제|작년|지난주|지난달|아까|방금|옛날)/.test(resolved), `No past adverbs generated under future context: "${resolved}"`);
}

// -----------------------------------------------------------------------------
// [9/10] Accidental Deictic Time Particle Repair (applyTemporalConcord & applyMorphology)
// -----------------------------------------------------------------------------
console.log("\n[9/10] Accidental Deictic Time Particle Repair");

const repairCases = [
	{ input: "어제에 학교에 갔어요", expected: "어제 학교에 갔어요" },
	{ input: "오늘에 친구를 만나요", expected: "오늘 친구를 만나요" },
	{ input: "내일에 부산에 갈 거예요", expected: "내일 부산에 갈 거예요" },
	{ input: "지금에 밥을 먹어요", expected: "지금 밥을 먹어요" },
	{ input: "그제에 도서관에 있었어요", expected: "그제 도서관에 있었어요" },
	{ input: "모레에 시험을 봐요", expected: "모레 시험을 봐요" }
];

for (const { input, expected } of repairCases) {
	const repairedByConcord = applyTemporalConcord(input);
	assert(repairedByConcord === expected, `applyTemporalConcord('${input}') -> '${expected}' (got '${repairedByConcord}')`);

	const repairedByMorphology = applyMorphology(input);
	assert(repairedByMorphology === expected, `applyMorphology('${input}') -> '${expected}' (got '${repairedByMorphology}')`);
}

// -----------------------------------------------------------------------------
// [10/10] Exhaustive Cross-Validation & Violation Detection
// -----------------------------------------------------------------------------
console.log("\n[10/10] Exhaustive Cross-Validation & Violation Detection");

// Cartesian test: 8 past adverbs x 4 past verbs = 32 valid sentences
const pastVerbs = ["갔어요", "먹었습니다", "봤어요", "만났습니다"];
let pastCount = 0;
for (const adv of pastTestWords) {
	for (const verb of pastVerbs) {
		const s = `${adv} ${verb}`;
		const res = validateTemporalConcord(s);
		assert(res.valid, `Valid Cartesian past: "${s}"`);
		pastCount++;
	}
}
assert(pastCount === 32, `Tested 32 valid past Cartesian pairs`);

// Cartesian test: 8 past adverbs x 4 future verbs = 32 invalid sentences
const futureVerbs = ["갈 거예요", "먹을게요", "보려고 해요", "만날 건가요?"];
let clashCount1 = 0;
for (const adv of pastTestWords) {
	for (const verb of futureVerbs) {
		const s = `${adv} ${verb}`;
		const res = validateTemporalConcord(s);
		assert(!res.valid, `Correctly rejected past+future clash: "${s}"`);
		clashCount1++;
	}
}
assert(clashCount1 === 32, `Tested 32 invalid past+future clashes`);

// Cartesian test: 7 future adverbs x 4 future verbs = 28 valid sentences
let futureCount = 0;
for (const adv of futureTestWords) {
	for (const verb of futureVerbs) {
		const s = `${adv} ${verb}`;
		const res = validateTemporalConcord(s);
		assert(res.valid, `Valid Cartesian future: "${s}"`);
		futureCount++;
	}
}
assert(futureCount === 28, `Tested 28 valid future Cartesian pairs`);

// Cartesian test: 7 future adverbs x 4 past verbs = 28 invalid sentences
let clashCount2 = 0;
for (const adv of futureTestWords) {
	for (const verb of pastVerbs) {
		const s = `${adv} ${verb}`;
		const res = validateTemporalConcord(s);
		assert(!res.valid, `Correctly rejected future+past clash: "${s}"`);
		clashCount2++;
	}
}
assert(clashCount2 === 28, `Tested 28 invalid future+past clashes`);

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log("\n======================================================");
console.log(`TOTAL TESTS: ${totalTests}`);
console.log(`PASSED:      ${passedTests}`);
console.log(`FAILED:      ${failedTests}`);
console.log("======================================================");

if (failedTests > 0) {
	console.error(`\n>>> FAILED: ${failedTests} assertion(s) failed in Feature 5 test suite. <<<`);
	process.exit(1);
} else {
	console.log("\n>>> FEATURE 5 (TEMPORAL TENSE CONCORD) 100% VALIDATED! <<<");
	process.exit(0);
}
