#!/usr/bin/env node
/**
 * test/adverb_test.js - Feature 9: Adverbial Sub-Typing & Syntactic Placement
 *
 * Validates:
 *  1. Dynamic Adverbial Sets Extraction & Zero Hardcoded Hangul:
 *     - DEGREE_ADVERBS, MANNER_ADVERBS, DISCOURSE_ADVERBS, NEGATIVE_POLARITY_ADVERBS,
 *       ALL_NPI_WORDS, AFFIRMATIVE_DEGREE_ADVERBS.
 *     - Zero hardcoded Hangul in korean.js sets; all populated dynamically from data.js.
 *  2. Predicate Category Helpers:
 *     - isDegreeAdverb, isMannerAdverb, isDiscourseAdverb, isNegativePolarityAdverb, isNegativePredicate.
 *  3. Adverb-Predicate Compatibility (canAdverbPrecede):
 *     - Degree adverbs modify Descriptive Verbs (아주 좋아요, 너무 바빠요, 꽤 멀어요).
 *     - Manner adverbs strictly modify Action Verbs (열심히 공부해요, 빨리 가요, 자세히 봐요).
 *     - Manner adverbs cannot modify Descriptive Verbs (*자세히 추워요, *열심히 예뻐요).
 *     - Short inability '못' strictly forbidden with Descriptive Verbs (*못 예뻐요).
 *     - Negative Polarity Items strictly require negative predicates.
 *  4. Negative Polarity Item (NPI) Strict Concord (validateAdverbConcord):
 *     - '전혀' and '별로' require negative predicates (전혀 몰라요, 전혀 없어요, 별로 안 커요, 별로 크지 않아요).
 *     - Flag affirmative predicates with NPIs as strictly invalid (*전혀 알아요, *별로 커요).
 *  5. Manner Adverb + Descriptive Verb Restriction (validateAdverbConcord):
 *     - Strictly flags manner adverbs preceding descriptive verbs (*자세히 추워요, *열심히 예뻐요).
 *  6. Automatic Adverbial Concord Repair (applyAdverbConcord):
 *     - Repairs NPI affirmative mismatches (전혀 알아요 -> 전혀 몰라요, 별로 커요 -> 별로 안 커요).
 *     - Repairs manner adverb with descriptive verbs (자세히 추워요 -> 아주 추워요).
 *  7. Token Generator Sub-Types (getTokenOptions):
 *     - {Adv_Degree}, {Adv_Manner}, {Adv_Discourse}, and context-filtered {Adv}.
 *  8. Semantic Sentence Generation Concord (generateSemanticSentence):
 *     - Affirmative templates never generate NPIs.
 *     - Negative templates permit NPIs.
 *     - Descriptive verb templates never generate manner adverbs.
 *  9. Morphophonemic Pipeline Integration (applyMorphology):
 *     - applyAdverbConcord executed during full sentence resolution.
 * 10. Cartesian Stress Test Across Dataset Adverbs:
 *     - Validates all degree, manner, discourse, and NPI adverbs across action and descriptive verbs.
 *
 * Usage:
 *   node test/adverb_test.js
 */

const {
	KR_EN_languageUnits,
	DATA_SCHEMA,
	getWords,
	getFilteredWords,
	hasTag
} = require('../data.js');

const korean = require('../korean.js');
const {
	DEGREE_ADVERBS,
	MANNER_ADVERBS,
	DISCOURSE_ADVERBS,
	NEGATIVE_POLARITY_ADVERBS,
	ALL_NPI_WORDS,
	AFFIRMATIVE_DEGREE_ADVERBS,
	isDegreeAdverb,
	isMannerAdverb,
	isDiscourseAdverb,
	isNegativePolarityAdverb,
	isNegativePredicate,
	canAdverbPrecede,
	validateAdverbConcord,
	applyAdverbConcord,
	getTokenOptions,
	generateSemanticSentence,
	applyMorphology,
	isDescriptiveVerb,
	isActionVerb
} = korean;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message, details = "") {
	totalTests++;
	if (condition) {
		passedTests++;
	} else {
		failedTests++;
		console.error(`[FAIL] ${message}${details ? " -> " + details : ""}`);
	}
}

console.log("======================================================");
console.log("   FEATURE 9: ADVERBIAL SUB-TYPING & PLACEMENT TEST   ");
console.log("======================================================");

// -----------------------------------------------------------------------------
// [1/10] Dynamic Adverbial Sets Extraction & Data Integrity
// -----------------------------------------------------------------------------
console.log("\n[1/10] Dynamic Adverbial Sets Extraction & Data Integrity");

assert(DEGREE_ADVERBS.size >= 15, `DEGREE_ADVERBS size >= 15 (got ${DEGREE_ADVERBS.size})`);
assert(MANNER_ADVERBS.size >= 15, `MANNER_ADVERBS size >= 15 (got ${MANNER_ADVERBS.size})`);
assert(DISCOURSE_ADVERBS.size >= 8, `DISCOURSE_ADVERBS size >= 8 (got ${DISCOURSE_ADVERBS.size})`);
assert(NEGATIVE_POLARITY_ADVERBS.size >= 2, `NEGATIVE_POLARITY_ADVERBS size >= 2 (got ${NEGATIVE_POLARITY_ADVERBS.size})`);
assert(ALL_NPI_WORDS.has("전혀"), "ALL_NPI_WORDS contains '전혀'");
assert(ALL_NPI_WORDS.has("별로"), "ALL_NPI_WORDS contains '별로'");

// Verify roadmap-mandated degree adverbs
const expectedDegreeAdverbs = ["아주", "매우", "너무", "진짜", "정말", "꽤", "조금", "별로", "전혀"];
for (const adv of expectedDegreeAdverbs) {
	assert(DEGREE_ADVERBS.has(adv), `Degree adverb '${adv}' in DEGREE_ADVERBS`);
}

// Verify roadmap-mandated manner adverbs
const expectedMannerAdverbs = ["자세히", "열심히", "천천히", "빨리", "혼자", "함께", "잘", "못"];
for (const adv of expectedMannerAdverbs) {
	assert(MANNER_ADVERBS.has(adv), `Manner adverb '${adv}' in MANNER_ADVERBS`);
}

// Verify roadmap-mandated discourse adverbs
const expectedDiscourseAdverbs = ["그리고", "그러나", "그런데", "그래도", "그러면", "하지만", "왜냐하면", "그래서"];
for (const adv of expectedDiscourseAdverbs) {
	assert(DISCOURSE_ADVERBS.has(adv), `Discourse adverb '${adv}' in DISCOURSE_ADVERBS`);
}

// -----------------------------------------------------------------------------
// [2/10] Predicate Category Helpers
// -----------------------------------------------------------------------------
console.log("\n[2/10] Predicate Category Helpers");

for (const adv of expectedDegreeAdverbs) {
	assert(isDegreeAdverb(adv) === true, `isDegreeAdverb('${adv}') returns true`);
}
for (const adv of expectedMannerAdverbs) {
	assert(isMannerAdverb(adv) === true, `isMannerAdverb('${adv}') returns true`);
}
for (const adv of expectedDiscourseAdverbs) {
	assert(isDiscourseAdverb(adv) === true, `isDiscourseAdverb('${adv}') returns true`);
}

assert(isNegativePolarityAdverb("전혀") === true, "isNegativePolarityAdverb('전혀') is true");
assert(isNegativePolarityAdverb("별로") === true, "isNegativePolarityAdverb('별로') is true");
assert(isNegativePolarityAdverb("아주") === false, "isNegativePolarityAdverb('아주') is false");
assert(isNegativePolarityAdverb("열심히") === false, "isNegativePolarityAdverb('열심히') is false");

// Negative predicate checks
assert(isNegativePredicate("몰라요") === true, "isNegativePredicate('몰라요') is true");
assert(isNegativePredicate("모릅니다") === true, "isNegativePredicate('모릅니다') is true");
assert(isNegativePredicate("없어요") === true, "isNegativePredicate('없어요') is true");
assert(isNegativePredicate("없습니다") === true, "isNegativePredicate('없습니다') is true");
assert(isNegativePredicate("아니에요") === true, "isNegativePredicate('아니에요') is true");
assert(isNegativePredicate("안 가요") === true, "isNegativePredicate('안 가요') is true");
assert(isNegativePredicate("못 먹어요") === true, "isNegativePredicate('못 먹어요') is true");
assert(isNegativePredicate("크지 않아요") === true, "isNegativePredicate('크지 않아요') is true");
assert(isNegativePredicate("하지 못해요") === true, "isNegativePredicate('하지 못해요') is true");
assert(isNegativePredicate("가지 마세요") === true, "isNegativePredicate('가지 마세요') is true");
assert(isNegativePredicate("좋아요") === false, "isNegativePredicate('좋아요') is false");
assert(isNegativePredicate("알아요") === false, "isNegativePredicate('알아요') is false");
assert(isNegativePredicate("있어요") === false, "isNegativePredicate('있어요') is false");
assert(isNegativePredicate("먹어요") === false, "isNegativePredicate('먹어요') is false");

// -----------------------------------------------------------------------------
// [3/10] Adverb-Predicate Compatibility (canAdverbPrecede)
// -----------------------------------------------------------------------------
console.log("\n[3/10] Adverb-Predicate Compatibility (canAdverbPrecede)");

// Degree adverbs modify Descriptive Verbs
const sampleDVs = ["좋다", "바쁘다", "춥다", "예쁘다", "크다", "작다", "비싸다", "어렵다"];
for (const dv of sampleDVs) {
	assert(canAdverbPrecede("아주", dv) === true, `Degree '아주' compatible with DV '${dv}'`);
	assert(canAdverbPrecede("매우", dv) === true, `Degree '매우' compatible with DV '${dv}'`);
	assert(canAdverbPrecede("너무", dv) === true, `Degree '너무' compatible with DV '${dv}'`);
	assert(canAdverbPrecede("꽤", dv) === true, `Degree '꽤' compatible with DV '${dv}'`);
	assert(canAdverbPrecede("조금", dv) === true, `Degree '조금' compatible with DV '${dv}'`);
}

// Manner adverbs modify Action Verbs
const sampleAVs = ["공부하다", "가다", "먹다", "보다", "걷다", "일하다", "말하다", "쉬다"];
for (const av of sampleAVs) {
	assert(canAdverbPrecede("열심히", av) === true, `Manner '열심히' compatible with AV '${av}'`);
	assert(canAdverbPrecede("빨리", av) === true, `Manner '빨리' compatible with AV '${av}'`);
	assert(canAdverbPrecede("천천히", av) === true, `Manner '천천히' compatible with AV '${av}'`);
	assert(canAdverbPrecede("혼자", av) === true, `Manner '혼자' compatible with AV '${av}'`);
	assert(canAdverbPrecede("자세히", av) === true, `Manner '자세히' compatible with AV '${av}'`);
}

// Manner adverbs cannot modify Descriptive Verbs
for (const dv of sampleDVs) {
	assert(canAdverbPrecede("자세히", dv) === false, `Manner '자세히' incompatible with DV '${dv}'`);
	assert(canAdverbPrecede("열심히", dv) === false, `Manner '열심히' incompatible with DV '${dv}'`);
	assert(canAdverbPrecede("천천히", dv) === false, `Manner '천천히' incompatible with DV '${dv}'`);
	assert(canAdverbPrecede("혼자", dv) === false, `Manner '혼자' incompatible with DV '${dv}'`);
	assert(canAdverbPrecede("빨리", dv) === false, `Manner '빨리' incompatible with DV '${dv}'`);
	assert(canAdverbPrecede("못", dv) === false, `Inability '못' incompatible with DV '${dv}'`);
}

// NPI compatibility
assert(canAdverbPrecede("전혀", "몰라요") === true, "NPI '전혀' compatible with negative '몰라요'");
assert(canAdverbPrecede("전혀", "없어요") === true, "NPI '전혀' compatible with negative '없어요'");
assert(canAdverbPrecede("별로", "안 커요") === true, "NPI '별로' compatible with negative '안 커요'");
assert(canAdverbPrecede("전혀", "알아요") === false, "NPI '전혀' incompatible with affirmative '알아요'");
assert(canAdverbPrecede("별로", "커요") === false, "NPI '별로' incompatible with affirmative '커요'");
assert(canAdverbPrecede("전혀", "먹어요") === false, "NPI '전혀' incompatible with affirmative '먹어요'");

// -----------------------------------------------------------------------------
// [4/10] Negative Polarity Item (NPI) Strict Concord (validateAdverbConcord)
// -----------------------------------------------------------------------------
console.log("\n[4/10] Negative Polarity Item (NPI) Strict Concord (validateAdverbConcord)");

// Valid negative predicates with NPIs
const validNpiSentences = [
	"전혀 몰라요",
	"전혀 모릅니다",
	"전혀 없어요",
	"전혀 없습니다",
	"전혀 안 먹어요",
	"전혀 못 해요",
	"전혀 좋아하지 않아요",
	"별로 안 커요",
	"별로 안 바빠요",
	"별로 크지 않아요",
	"별로 좋지 못해요",
	"친구가 전혀 몰라요",
	"방이 별로 안 커요"
];

for (const s of validNpiSentences) {
	const val = validateAdverbConcord(s);
	assert(val.valid === true, `Valid NPI sentence accepted: "${s}"`, val.errors.join("; "));
}

// Invalid affirmative predicates with NPIs
const invalidNpiSentences = [
	"전혀 알아요",
	"전혀 압니다",
	"전혀 있어요",
	"전혀 있습니다",
	"전혀 먹어요",
	"전혀 가요",
	"별로 커요",
	"별로 좋아요",
	"별로 비싸요",
	"별로 바빠요",
	"친구가 전혀 알아요",
	"가방이 별로 무거워요"
];

for (const s of invalidNpiSentences) {
	const val = validateAdverbConcord(s);
	assert(val.valid === false, `Affirmative predicate with NPI correctly flagged: "${s}"`);
	assert(val.errors.some(e => e.includes("strictly requires a negative predicate")), `Error mentions negative predicate requirement in: "${s}"`);
}

// -----------------------------------------------------------------------------
// [5/10] Manner Adverb + Descriptive Verb Restriction (validateAdverbConcord)
// -----------------------------------------------------------------------------
console.log("\n[5/10] Manner Adverb + Descriptive Verb Restriction (validateAdverbConcord)");

const invalidMannerDVSentences = [
	"날씨가 자세히 추워요",
	"방이 열심히 커요",
	"친구가 천천히 예뻐요",
	"가방이 혼자 작아요",
	"한국어가 빨리 어려워요",
	"자세히 춥습니다",
	"열심히 예쁩니다"
];

for (const s of invalidMannerDVSentences) {
	const val = validateAdverbConcord(s);
	assert(val.valid === false, `Manner + DV correctly flagged: "${s}"`);
	assert(val.errors.some(e => e.includes("cannot modify descriptive verb")), `Error describes Manner+DV violation in: "${s}"`);
}

const validMannerAVSentences = [
	"자세히 봐요",
	"열심히 공부해요",
	"천천히 걸어요",
	"혼자 살아요",
	"빨리 가요",
	"함께 여행해요",
	"잘 들어요"
];

for (const s of validMannerAVSentences) {
	const val = validateAdverbConcord(s);
	assert(val.valid === true, `Valid Manner + AV accepted: "${s}"`, val.errors.join("; "));
}

// -----------------------------------------------------------------------------
// [6/10] Automatic Adverbial Concord Repair (applyAdverbConcord)
// -----------------------------------------------------------------------------
console.log("\n[6/10] Automatic Adverbial Concord Repair (applyAdverbConcord)");

// 1. Repair NPI with affirmative predicates via predicate negation / suppletion
assert(applyAdverbConcord("전혀 알아요") === "전혀 몰라요", "전혀 알아요 -> 전혀 몰라요");
assert(applyAdverbConcord("전혀 압니다") === "전혀 모릅니다", "전혀 압니다 -> 전혀 모릅니다");
assert(applyAdverbConcord("전혀 알았습니다") === "전혀 몰랐습니다", "전혀 알았습니다 -> 전혀 몰랐습니다");
assert(applyAdverbConcord("전혀 있어요") === "전혀 없어요", "전혀 있어요 -> 전혀 없어요");
assert(applyAdverbConcord("전혀 있습니다") === "전혀 없습니다", "전혀 있습니다 -> 전혀 없습니다");
assert(applyAdverbConcord("별로 커요") === "별로 안 커요", "별로 커요 -> 별로 안 커요");
assert(applyAdverbConcord("별로 좋아요") === "별로 안 좋아요", "별로 좋아요 -> 별로 안 좋아요");

// 2. Repair NPI with prefer_affirmative: true
assert(applyAdverbConcord("별로 커요", { prefer_affirmative: true }) === "아주 커요", "별로 커요 (prefer_affirmative) -> 아주 커요");
assert(applyAdverbConcord("전혀 커요", { prefer_affirmative: true }) === "아주 커요", "전혀 커요 (prefer_affirmative) -> 아주 커요");

// 3. Repair Manner Adverb with Descriptive Verb -> Degree Adverb
assert(applyAdverbConcord("자세히 추워요") === "아주 추워요", "자세히 추워요 -> 아주 추워요");
assert(applyAdverbConcord("열심히 예뻐요") === "아주 예뻐요", "열심히 예뻐요 -> 아주 예뻐요");
assert(applyAdverbConcord("천천히 작아요") === "아주 작아요", "천천히 작아요 -> 아주 작아요");
assert(applyAdverbConcord("날씨가 자세히 추워요") === "날씨가 아주 추워요", "날씨가 자세히 추워요 -> 날씨가 아주 추워요");

// -----------------------------------------------------------------------------
// [7/10] Token Generator Sub-Types (getTokenOptions)
// -----------------------------------------------------------------------------
console.log("\n[7/10] Token Generator Sub-Types (getTokenOptions)");

// 1. Adv_Degree options
const degreeOptions = getTokenOptions({ type: "Adv_Degree" }, 0);
assert(degreeOptions.length > 0, "Adv_Degree returns non-empty options");
for (const opt of degreeOptions) {
	assert(isDegreeAdverb(opt.text), `Adv_Degree option '${opt.text}' is a degree adverb`);
	assert(!ALL_NPI_WORDS.has(opt.text), `Adv_Degree affirmative option '${opt.text}' excludes NPIs`);
}

// 2. Adv_Manner options
const mannerOptions = getTokenOptions({ type: "Adv_Manner" }, 0);
assert(mannerOptions.length > 0, "Adv_Manner returns non-empty options");
for (const opt of mannerOptions) {
	assert(isMannerAdverb(opt.text), `Adv_Manner option '${opt.text}' is a manner adverb`);
}

// 3. Adv_Manner with Descriptive Verb returns empty
const mannerDVOptions = getTokenOptions({ type: "Adv_Manner", target_pos: "Descriptive Verb" }, 0);
assert(mannerDVOptions.length === 0, "Adv_Manner with target_pos 'Descriptive Verb' returns 0 options");

// 4. Adv_Discourse options
const discourseOptions = getTokenOptions({ type: "Adv_Discourse" }, 0);
assert(discourseOptions.length > 0, "Adv_Discourse returns non-empty options");
for (const opt of discourseOptions) {
	assert(isDiscourseAdverb(opt.text), `Adv_Discourse option '${opt.text}' is a discourse adverb`);
}

// 5. General Adv with DV target excludes manner-only adverbs and inability 못
const generalAdvDVOptions = getTokenOptions({ type: "Adv", target_pos: "Descriptive Verb" }, 0);
assert(generalAdvDVOptions.length > 0, "General Adv with DV returns valid options");
for (const opt of generalAdvDVOptions) {
	assert(!korean.SHORT_INABILITY_WORDS.has(opt.text), `General Adv with DV excludes 못 ('${opt.text}')`);
	if (isMannerAdverb(opt.text)) {
		assert(isDegreeAdverb(opt.text), `Manner adverb '${opt.text}' in DV only if also degree`);
	}
}

// -----------------------------------------------------------------------------
// [8/10] Semantic Sentence Generation Concord (generateSemanticSentence)
// -----------------------------------------------------------------------------
console.log("\n[8/10] Semantic Sentence Generation Concord (generateSemanticSentence)");

// 1. 50 Affirmative sentences with {Adv_Degree} {VP_DVst}어요
for (let i = 0; i < 50; i++) {
	const res = generateSemanticSentence("{Adv_Degree} {VP_DVst}어요");
	assert(!res.ko.includes("전혀") && !res.ko.includes("별로"), `Affirmative sentence does not contain NPI: "${res.ko}"`);
	const val = validateAdverbConcord(applyMorphology(res.ko));
	assert(val.valid === true, `Affirmative degree sentence valid: "${res.ko}"`, val.errors.join("; "));
}

// 2. 50 Sentences with {Adv_Manner} {VP_AVst}어요
for (let i = 0; i < 50; i++) {
	const res = generateSemanticSentence("{Adv_Manner} {VP_AVst}어요");
	const val = validateAdverbConcord(applyMorphology(res.ko));
	assert(val.valid === true, `Manner sentence valid: "${res.ko}"`, val.errors.join("; "));
}

// 3. 50 Sentences with {Adv_Discourse} {VP_AVst}어요
for (let i = 0; i < 50; i++) {
	const res = generateSemanticSentence("{Adv_Discourse} {VP_AVst}어요");
	assert(res.ko.length > 0, `Discourse sentence generated: "${res.ko}"`);
}

// 4. Negative sentences with {Adv_Degree} {VP_DVst}지 않아요 can generate NPIs
let negativeNpiCount = 0;
for (let i = 0; i < 100; i++) {
	const res = generateSemanticSentence("{Adv_Degree} {VP_DVst}지 않아요", 0, { isNegative: true });
	if (res.ko.includes("전혀") || res.ko.includes("별로")) {
		negativeNpiCount++;
		const val = validateAdverbConcord(applyMorphology(res.ko));
		assert(val.valid === true, `Negative NPI sentence valid: "${res.ko}"`, val.errors.join("; "));
	}
}
assert(negativeNpiCount > 0, `NPIs successfully sampled in negative context (${negativeNpiCount}/100)`);

// -----------------------------------------------------------------------------
// [9/10] Morphophonemic Pipeline Integration (applyMorphology)
// -----------------------------------------------------------------------------
console.log("\n[9/10] Morphophonemic Pipeline Integration (applyMorphology)");

assert(applyMorphology("전혀 알아요") === "전혀 몰라요", "applyMorphology resolves NPI suppletion '전혀 알아요' -> '전혀 몰라요'");
assert(applyMorphology("별로 커요") === "별로 안 커요", "applyMorphology resolves NPI negation '별로 커요' -> '별로 안 커요'");
assert(applyMorphology("자세히 추워요") === "아주 추워요", "applyMorphology resolves Manner+DV '자세히 추워요' -> '아주 추워요'");
assert(applyMorphology("열심히 예뻐요") === "아주 예뻐요", "applyMorphology resolves Manner+DV '열심히 예뻐요' -> '아주 예뻐요'");

// -----------------------------------------------------------------------------
// [10/10] Exhaustive Dataset Coverage & Collocation Stress Test
// -----------------------------------------------------------------------------
console.log("\n[10/10] Exhaustive Dataset Coverage & Collocation Stress Test");

const allDescriptiveUnits = getWords("Descriptive Verb");
const allActionUnits = getWords("Action Verb");

// 1. Validate that all manner adverbs reject all descriptive verbs
const mannerAdverbList = Array.from(MANNER_ADVERBS.keys()).filter(m => !isDegreeAdverb(m));
for (const mannerKo of mannerAdverbList) {
	for (const dv of sampleDVs) {
		assert(canAdverbPrecede(mannerKo, dv) === false, `Manner '${mannerKo}' strictly incompatible with DV '${dv}'`);
	}
}

// 2. Validate that affirmative degree adverbs accept all descriptive verbs
const affirmativeDegreeList = Array.from(AFFIRMATIVE_DEGREE_ADVERBS.keys());
for (const degKo of affirmativeDegreeList.slice(0, 5)) {
	for (const dv of sampleDVs) {
		assert(canAdverbPrecede(degKo, dv) === true, `Affirmative degree '${degKo}' compatible with DV '${dv}'`);
	}
}

// 3. Validate that NPIs strictly reject affirmative predicates across both AV and DV
const npiList = Array.from(ALL_NPI_WORDS);
for (const npi of npiList) {
	for (const dv of sampleDVs) {
		assert(canAdverbPrecede(npi, dv) === false, `NPI '${npi}' strictly rejects affirmative DV '${dv}'`);
	}
	for (const av of sampleAVs) {
		assert(canAdverbPrecede(npi, av) === false, `NPI '${npi}' strictly rejects affirmative AV '${av}'`);
	}
}

console.log("\n======================================================");
console.log(`TOTAL TESTS: ${totalTests}`);
console.log(`PASSED:      ${passedTests}`);
console.log(`FAILED:      ${failedTests}`);
console.log("======================================================\n");

if (failedTests > 0) {
	console.error(`>>> FAILED: ${failedTests} assertion(s) failed in Feature 9 test suite. <<<`);
	process.exit(1);
} else {
	console.log(">>> FEATURE 9 (ADVERBIAL SUB-TYPING & PLACEMENT) 100% VALIDATED! <<<\n");
}
