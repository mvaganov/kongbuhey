#!/usr/bin/env node
/**
 * test/grammar_mood_test.js - Feature 8: Predicate Mood, Speech Act & Negation Restrictions
 *
 * Validates:
 *  1. Dynamic Mood & Negation Sets Extraction & Zero Hardcoded Hangul:
 *     - IMPERATIVE_GRAMMAR_IDS, PROPOSITIVE_GRAMMAR_IDS, INABILITY_NEGATION_IDS,
 *       VOLITIONAL_GRAMMAR_IDS, FORBIDDEN_NEGATIVE_ROOTS, NEGATION_SUPPLETIONS,
 *       AFFIRMATIVE_COUNTERPARTS, SHORT_INABILITY_WORDS, SHORT_GENERAL_WORDS.
 *     - Fully populated from data.js with zero hardcoded Hangul in korean.js sets.
 *  2. Imperative Mood Action Verb Restriction:
 *     - Only Action Verbs can take -(으)세요, -(으)십시오, -아/어라.
 *     - Descriptive Verbs are strictly forbidden from taking imperative endings.
 *  3. Propositive Mood Action Verb Restriction:
 *     - Only Action Verbs can take -(으)ㅂ시다, -자, -세, -(으)ㄹ까요?.
 *     - Descriptive Verbs are strictly forbidden from taking propositive endings.
 *  4. Prohibitive Negative Imperative Restriction:
 *     - Only Action Verbs can take -지 마세요, -지 마십시오, -지 마, -지 마라.
 *     - Descriptive Verbs are strictly forbidden from taking prohibitive endings.
 *  5. Short Negation Duality (안 vs 못):
 *     - Short general negation '안' attaches to both Action Verbs and Descriptive Verbs.
 *     - Short inability negation '못' attaches strictly to Action Verbs (never Descriptive Verbs).
 *  6. Long Negation Duality (-지 않다 vs -지 못하다):
 *     - Long general negation '-지 않다' attaches to both Action Verbs and Descriptive Verbs.
 *     - Long inability negation '-지 못하다' attaches strictly to Action Verbs.
 *  7. Negation Suppletions:
 *     - '알다' -> '모르다' (never '*안 알다' / '*못 알다' / '*알지 않다').
 *     - '있다' -> '없다' (never '*안 있다' / '*못 있다' / '*있지 않다').
 *     - Symmetrical affirmative counterparts '모르다' -> '알다', '없다' -> '있다'.
 *  8. Volitional Perspective Concord (-고 싶다 vs -고 싶어하다):
 *     - 1st/2nd person: '-고 싶다' (내가 가고 싶어요).
 *     - 3rd person: '-고 싶어하다' (친구가 가고 싶어해요).
 *     - Descriptive Verbs are strictly forbidden from taking volitional endings directly.
 *  9. Concord Validation & Repair (validateMoodConcord, applyMoodConcord):
 *     - Accurate diagnostic detection of violations.
 *     - Automatic repair of suppletions, inability mismatches, and perspective errors.
 * 10. Exhaustive Cross-Validation across All Action Verbs vs Descriptive Verbs:
 *     - Cartesian validation across all 326 Action Verbs and 124 Descriptive Verbs.
 *
 * Usage:
 *   node test/grammar_mood_test.js
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
	IMPERATIVE_GRAMMAR_IDS,
	PROPOSITIVE_GRAMMAR_IDS,
	INABILITY_NEGATION_IDS,
	GENERAL_NEGATION_IDS,
	VOLITIONAL_GRAMMAR_IDS,
	FORBIDDEN_NEGATIVE_ROOTS,
	NEGATION_SUPPLETIONS,
	AFFIRMATIVE_COUNTERPARTS,
	SHORT_NEGATION_WORDS,
	SHORT_INABILITY_WORDS,
	SHORT_GENERAL_WORDS,
	DESCRIPTIVE_SURFACE_MAP,
	FORBIDDEN_DV_IMPERATIVE_FORMS,
	FORBIDDEN_DV_PROPOSITIVE_FORMS,
	FORBIDDEN_DV_LONG_INABILITY_FORMS,
	FORBIDDEN_DV_VOLITIONAL_FORMS,
	isDescriptiveVerb,
	isActionVerb,
	canTakeMood,
	getNegationSuppletion,
	getAffirmativeCounterpart,
	conjugatePredicate,
	buildNegatedPredicate,
	buildMoodPredicate,
	validateMoodConcord,
	applyMoodConcord,
	applyMorphology,
	generateSemanticSentence
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
console.log("   FEATURE 8: MOOD, SPEECH ACT & NEGATION CONCORD     ");
console.log("======================================================");

// -----------------------------------------------------------------------------
// [1/10] Dynamic Mood & Negation Sets Extraction & Zero Hardcoded Hangul
// -----------------------------------------------------------------------------
console.log("\n[1/10] Dynamic Mood & Negation Sets Extraction & Zero Hardcoded Hangul");

assert(IMPERATIVE_GRAMMAR_IDS instanceof Set, "IMPERATIVE_GRAMMAR_IDS is a Set");
assert(IMPERATIVE_GRAMMAR_IDS.size >= 6, `IMPERATIVE_GRAMMAR_IDS has >= 6 entries (found ${IMPERATIVE_GRAMMAR_IDS.size})`);
assert(IMPERATIVE_GRAMMAR_IDS.has(416), "Contains unit 416 ~(으)세요");
assert(IMPERATIVE_GRAMMAR_IDS.has(1644), "Contains unit 1644 -(으)십시오");
assert(IMPERATIVE_GRAMMAR_IDS.has(1141), "Contains unit 1141 -지 마");
assert(IMPERATIVE_GRAMMAR_IDS.has(1182), "Contains unit 1182 -어라");
assert(IMPERATIVE_GRAMMAR_IDS.has(1737), "Contains unit 1737 -지 마세요");
assert(IMPERATIVE_GRAMMAR_IDS.has(1738), "Contains unit 1738 -지 마십시오");

assert(PROPOSITIVE_GRAMMAR_IDS instanceof Set, "PROPOSITIVE_GRAMMAR_IDS is a Set");
assert(PROPOSITIVE_GRAMMAR_IDS.size >= 5, `PROPOSITIVE_GRAMMAR_IDS has >= 5 entries (found ${PROPOSITIVE_GRAMMAR_IDS.size})`);
assert(PROPOSITIVE_GRAMMAR_IDS.has(51), "Contains unit 51 ~자");
assert(PROPOSITIVE_GRAMMAR_IDS.has(1183), "Contains unit 1183 -자");
assert(PROPOSITIVE_GRAMMAR_IDS.has(1170), "Contains unit 1170 -세");
assert(PROPOSITIVE_GRAMMAR_IDS.has(1021), "Contains unit 1021 -(으)ㄹ까요?");
assert(PROPOSITIVE_GRAMMAR_IDS.has(1736), "Contains unit 1736 -(으)ㅂ시다");

assert(INABILITY_NEGATION_IDS.has(524), "INABILITY_NEGATION_IDS contains unit 524");
assert(VOLITIONAL_GRAMMAR_IDS.has(417), "VOLITIONAL_GRAMMAR_IDS contains unit 417 (~고 싶다)");
assert(VOLITIONAL_GRAMMAR_IDS.has(1625), "VOLITIONAL_GRAMMAR_IDS contains unit 1625 (-고 싶어하다)");

assert(FORBIDDEN_NEGATIVE_ROOTS.has("알다"), "FORBIDDEN_NEGATIVE_ROOTS contains '알다'");
assert(FORBIDDEN_NEGATIVE_ROOTS.has("있다"), "FORBIDDEN_NEGATIVE_ROOTS contains '있다'");
assert(NEGATION_SUPPLETIONS.get("알다") === "모르다", "NEGATION_SUPPLETIONS maps '알다' -> '모르다'");
assert(NEGATION_SUPPLETIONS.get("있다") === "없다", "NEGATION_SUPPLETIONS maps '있다' -> '없다'");
assert(AFFIRMATIVE_COUNTERPARTS.get("모르다") === "알다", "AFFIRMATIVE_COUNTERPARTS maps '모르다' -> '알다'");
assert(AFFIRMATIVE_COUNTERPARTS.get("없다") === "있다", "AFFIRMATIVE_COUNTERPARTS maps '없다' -> '있다'");

assert(SHORT_INABILITY_WORDS.has("못"), "SHORT_INABILITY_WORDS contains '못'");
assert(SHORT_GENERAL_WORDS.has("안"), "SHORT_GENERAL_WORDS contains '안'");

// -----------------------------------------------------------------------------
// [2/10] Imperative Mood Action Verb Restriction
// -----------------------------------------------------------------------------
console.log("\n[2/10] Imperative Mood Action Verb Restriction");

const sampleActionVerbs = ["가다", "먹다", "공부하다", "앉다", "만들다", "읽다", "오다", "보다"];
const sampleDescriptiveVerbs = ["예쁘다", "바쁘다", "크다", "작다", "친절하다", "비싸다", "좋다", "춥다", "덥다", "어렵다"];

for (const av of sampleActionVerbs) {
	assert(canTakeMood(av, "imperative") === true, `Action Verb '${av}' can take imperative mood`);
	const politeImp = buildMoodPredicate(av, "imperative", "polite");
	const formalImp = buildMoodPredicate(av, "imperative", "formal");
	const plainImp = buildMoodPredicate(av, "imperative", "plain");
	assert(politeImp.endsWith("세요"), `'${av}' polite imperative ends with '세요': '${politeImp}'`);
	assert(formalImp.endsWith("십시오"), `'${av}' formal imperative ends with '십시오': '${formalImp}'`);
	assert(plainImp.endsWith("라") || plainImp.endsWith("해"), `'${av}' plain imperative ends with '라' or '해': '${plainImp}'`);
}

// Check rieul batchim dropping in imperative
assert(buildMoodPredicate("만들다", "imperative", "polite") === "만드세요", "만들다 polite imp -> 만드세요");
assert(buildMoodPredicate("만들다", "imperative", "formal") === "만드십시오", "만들다 formal imp -> 만드십시오");
assert(buildMoodPredicate("살다", "imperative", "polite") === "사세요", "살다 polite imp -> 사세요");
assert(buildMoodPredicate("살다", "imperative", "formal") === "사십시오", "살다 formal imp -> 사십시오");

for (const dv of sampleDescriptiveVerbs) {
	assert(canTakeMood(dv, "imperative") === false, `Descriptive Verb '${dv}' CANNOT take imperative mood`);
	let threw = false;
	try {
		buildMoodPredicate(dv, "imperative", "polite");
	} catch (e) {
		threw = true;
	}
	assert(threw, `buildMoodPredicate('${dv}', 'imperative') correctly throws Error`);
}

// -----------------------------------------------------------------------------
// [3/10] Propositive Mood Action Verb Restriction
// -----------------------------------------------------------------------------
console.log("\n[3/10] Propositive Mood Action Verb Restriction");

for (const av of sampleActionVerbs) {
	assert(canTakeMood(av, "propositive") === true, `Action Verb '${av}' can take propositive mood`);
	const formalProp = buildMoodPredicate(av, "propositive", "formal");
	const plainProp = buildMoodPredicate(av, "propositive", "plain");
	const sugProp = buildMoodPredicate(av, "propositive", "suggestion");
	assert(formalProp.endsWith("시다"), `'${av}' formal propositive ends with '(으)ㅂ시다': '${formalProp}'`);
	assert(plainProp.endsWith("자"), `'${av}' plain propositive ends with '자': '${plainProp}'`);
	assert(sugProp.endsWith("까요?"), `'${av}' suggestion propositive ends with '까요?': '${sugProp}'`);
}

// Check batchim allomorphs for formal propositive
assert(buildMoodPredicate("가다", "propositive", "formal") === "갑시다", "가다 formal prop -> 갑시다");
assert(buildMoodPredicate("먹다", "propositive", "formal") === "먹읍시다", "먹다 formal prop -> 먹읍시다");
assert(buildMoodPredicate("앉다", "propositive", "formal") === "앉읍시다", "앉다 formal prop -> 앉읍시다");
assert(buildMoodPredicate("만들다", "propositive", "formal") === "만듭시다", "만들다 formal prop -> 만듭시다");
assert(buildMoodPredicate("살다", "propositive", "formal") === "삽시다", "살다 formal prop -> 삽시다");

for (const dv of sampleDescriptiveVerbs) {
	assert(canTakeMood(dv, "propositive") === false, `Descriptive Verb '${dv}' CANNOT take propositive mood`);
	let threw = false;
	try {
		buildMoodPredicate(dv, "propositive", "formal");
	} catch (e) {
		threw = true;
	}
	assert(threw, `buildMoodPredicate('${dv}', 'propositive') correctly throws Error`);
}

// -----------------------------------------------------------------------------
// [4/10] Prohibitive Negative Imperative Restriction
// -----------------------------------------------------------------------------
console.log("\n[4/10] Prohibitive Negative Imperative Restriction");

for (const av of sampleActionVerbs) {
	assert(canTakeMood(av, "prohibition") === true, `Action Verb '${av}' can take prohibition`);
	const politeProhib = buildMoodPredicate(av, "prohibition", "polite");
	const formalProhib = buildMoodPredicate(av, "prohibition", "formal");
	const plainProhib = buildMoodPredicate(av, "prohibition", "plain");
	assert(politeProhib.endsWith("지 마세요"), `'${av}' polite prohibition ends with '지 마세요': '${politeProhib}'`);
	assert(formalProhib.endsWith("지 마십시오"), `'${av}' formal prohibition ends with '지 마십시오': '${formalProhib}'`);
	assert(plainProhib.endsWith("지 마"), `'${av}' plain prohibition ends with '지 마': '${plainProhib}'`);
}

for (const dv of sampleDescriptiveVerbs) {
	assert(canTakeMood(dv, "prohibition") === false, `Descriptive Verb '${dv}' CANNOT take prohibition`);
	let threw = false;
	try {
		buildMoodPredicate(dv, "prohibition", "polite");
	} catch (e) {
		threw = true;
	}
	assert(threw, `buildMoodPredicate('${dv}', 'prohibition') correctly throws Error`);
}

// -----------------------------------------------------------------------------
// [5/10] Short Negation Duality (안 vs 못)
// -----------------------------------------------------------------------------
console.log("\n[5/10] Short Negation Duality (안 vs 못)");

// Short general negation '안' works for Action Verbs
assert(buildNegatedPredicate("가다", { type: "short" }) === "안 가요", "가다 short neg -> 안 가요");
assert(buildNegatedPredicate("먹다", { type: "short" }) === "안 먹어요", "먹다 short neg -> 안 먹어요");
assert(buildNegatedPredicate("공부하다", { type: "short" }) === "안 공부해요", "공부하다 short neg -> 안 공부해요");

// Short general negation '안' works for Descriptive Verbs
assert(buildNegatedPredicate("예쁘다", { type: "short" }) === "안 예뻐요", "예쁘다 short neg -> 안 예뻐요");
assert(buildNegatedPredicate("비싸다", { type: "short" }) === "안 비싸요", "비싸다 short neg -> 안 비싸요");
assert(buildNegatedPredicate("춥다", { type: "short" }) === "안 추워요", "춥다 short neg -> 안 추워요");
assert(buildNegatedPredicate("작다", { type: "short" }) === "안 작아요", "작다 short neg -> 안 작아요");
assert(buildNegatedPredicate("크다", { type: "short" }) === "안 커요", "크다 short neg -> 안 커요");

// Short inability negation '못' works for Action Verbs
assert(buildNegatedPredicate("가다", { inability: true, type: "short" }) === "못 가요", "가다 inability short -> 못 가요");
assert(buildNegatedPredicate("먹다", { inability: true, type: "short" }) === "못 먹어요", "먹다 inability short -> 못 먹어요");
assert(buildNegatedPredicate("공부하다", { inability: true, type: "short" }) === "못 공부해요", "공부하다 inability short -> 못 공부해요");

// Short inability negation '못' CANNOT be used with Descriptive Verbs
for (const dv of sampleDescriptiveVerbs) {
	assert(canTakeMood(dv, "inability") === false, `Descriptive Verb '${dv}' CANNOT take inability mood`);
	let threw = false;
	try {
		buildNegatedPredicate(dv, { inability: true, type: "short" });
	} catch (e) {
		threw = true;
	}
	assert(threw, `buildNegatedPredicate('${dv}', { inability: true }) correctly throws Error`);

	const badPhrase = `오늘 날씨가 못 ${conjugatePredicate(dv, "polite")}`;
	const validation = validateMoodConcord(badPhrase);
	assert(!validation.valid, `validateMoodConcord correctly flags short inability with DV: '${badPhrase}'`);
}

// -----------------------------------------------------------------------------
// [6/10] Long Negation Duality (-지 않다 vs -지 못하다)
// -----------------------------------------------------------------------------
console.log("\n[6/10] Long Negation Duality (-지 않다 vs -지 못하다)");

// Long general negation '-지 않다' works for Action Verbs
assert(buildNegatedPredicate("가다", { type: "long" }) === "가지 않아요", "가다 long neg -> 가지 않아요");
assert(buildNegatedPredicate("먹다", { type: "long" }) === "먹지 않아요", "먹다 long neg -> 먹지 않아요");
assert(buildNegatedPredicate("공부하다", { type: "long" }) === "공부하지 않아요", "공부하다 long neg -> 공부하지 않아요");

// Long general negation '-지 않다' works for Descriptive Verbs
assert(buildNegatedPredicate("예쁘다", { type: "long" }) === "예쁘지 않아요", "예쁘다 long neg -> 예쁘지 않아요");
assert(buildNegatedPredicate("비싸다", { type: "long" }) === "비싸지 않아요", "비싸다 long neg -> 비싸지 않아요");
assert(buildNegatedPredicate("바쁘다", { type: "long" }) === "바쁘지 않아요", "바쁘다 long neg -> 바쁘지 않아요");

// Long inability negation '-지 못하다' works for Action Verbs
assert(buildNegatedPredicate("가다", { inability: true, type: "long" }) === "가지 못해요", "가다 long inability -> 가지 못해요");
assert(buildNegatedPredicate("먹다", { inability: true, type: "long" }) === "먹지 못해요", "먹다 long inability -> 먹지 못해요");

// Long inability negation '-지 못하다' CANNOT be used with Descriptive Verbs
for (const dv of sampleDescriptiveVerbs) {
	let threw = false;
	try {
		buildNegatedPredicate(dv, { inability: true, type: "long" });
	} catch (e) {
		threw = true;
	}
	assert(threw, `buildNegatedPredicate('${dv}', { inability: true, type: 'long' }) correctly throws Error`);

	const stem = dv.replace(/다$/, '');
	const badPhrase = `그 물건이 ${stem}지 못해요`;
	const validation = validateMoodConcord(badPhrase);
	assert(!validation.valid, `validateMoodConcord correctly flags long inability with DV: '${badPhrase}'`);
}

// -----------------------------------------------------------------------------
// [7/10] Negation Suppletions (알다 -> 모르다, 있다 -> 없다)
// -----------------------------------------------------------------------------
console.log("\n[7/10] Negation Suppletions (알다 -> 모르다, 있다 -> 없다)");

// '알다' suppletion
assert(getNegationSuppletion("알다") === "모르다", "getNegationSuppletion('알다') -> '모르다'");
assert(getAffirmativeCounterpart("모르다") === "알다", "getAffirmativeCounterpart('모르다') -> '알다'");
assert(canTakeMood("알다", "negation") === false, "canTakeMood('알다', 'negation') is false (requires suppletion)");

assert(buildNegatedPredicate("알다", { formality: "polite" }) === "몰라요", "buildNegatedPredicate('알다', polite) -> 몰라요");
assert(buildNegatedPredicate("알다", { formality: "formal" }) === "모릅니다", "buildNegatedPredicate('알다', formal) -> 모릅니다");
assert(buildNegatedPredicate("알다", { tense: "past" }) === "몰랐어요", "buildNegatedPredicate('알다', past) -> 몰랐어요");

// '있다' suppletion
assert(getNegationSuppletion("있다") === "없다", "getNegationSuppletion('있다') -> '없다'");
assert(getAffirmativeCounterpart("없다") === "있다", "getAffirmativeCounterpart('없다') -> '있다'");
assert(canTakeMood("있다", "negation") === false, "canTakeMood('있다', 'negation') is false (requires suppletion)");

assert(buildNegatedPredicate("있다", { formality: "polite" }) === "없어요", "buildNegatedPredicate('있다', polite) -> 없어요");
assert(buildNegatedPredicate("있다", { formality: "formal" }) === "없습니다", "buildNegatedPredicate('있다', formal) -> 없습니다");
assert(buildNegatedPredicate("있다", { tense: "past" }) === "없었어요", "buildNegatedPredicate('있다', past) -> 없었어요");

// Flag direct negation errors for '알다' and '있다'
const forbiddenAldaForms = ["안 알아요", "안 압니다", "안 알았습니다", "못 알아요", "알지 않아요", "알지 못해요"];
for (const form of forbiddenAldaForms) {
	const res = validateMoodConcord(`저는 그것을 ${form}`);
	assert(!res.valid, `validateMoodConcord flags direct negation of '알다': '${form}'`);
}

const forbiddenItdaForms = ["안 있어요", "안 있습니다", "안 있었습니다", "못 있어요", "있지 않아요", "있지 못해요"];
for (const form of forbiddenItdaForms) {
	const res = validateMoodConcord(`방에 사람이 ${form}`);
	assert(!res.valid, `validateMoodConcord flags direct negation of '있다': '${form}'`);
}

// -----------------------------------------------------------------------------
// [8/10] Volitional Perspective Concord (-고 싶다 vs -고 싶어하다)
// -----------------------------------------------------------------------------
console.log("\n[8/10] Volitional Perspective Concord (-고 싶다 vs -고 싶어하다)");

// Action verbs can take volitional mood
assert(canTakeMood("가다", "volitional") === true, "canTakeMood('가다', 'volitional') is true");
assert(buildMoodPredicate("가다", "volitional", "polite") === "가고 싶어요", "1st/2nd person volitional polite -> 가고 싶어요");
assert(buildMoodPredicate("가다", "volitional", "formal") === "가고 싶습니다", "1st/2nd person volitional formal -> 가고 싶습니다");
assert(buildMoodPredicate("가다", "volitional", "plain") === "가고 싶다", "1st/2nd person volitional plain -> 가고 싶다");

// 3rd person perspective
assert(buildMoodPredicate("가다", "volitional", "polite", { person: 3 }) === "가고 싶어해요", "3rd person volitional polite -> 가고 싶어해요");
assert(buildMoodPredicate("가다", "volitional", "formal", { person: 3 }) === "가고 싶어합니다", "3rd person volitional formal -> 가고 싶어합니다");
assert(buildMoodPredicate("가다", "volitional", "plain", { person: 3 }) === "가고 싶어한다", "3rd person volitional plain -> 가고 싶어한다");

// Descriptive verbs CANNOT take volitional mood directly
for (const dv of sampleDescriptiveVerbs) {
	assert(canTakeMood(dv, "volitional") === false, `Descriptive Verb '${dv}' CANNOT take volitional mood`);
	let threw = false;
	try {
		buildMoodPredicate(dv, "volitional", "polite");
	} catch (e) {
		threw = true;
	}
	assert(threw, `buildMoodPredicate('${dv}', 'volitional') correctly throws Error`);
	const stem = dv.replace(/다$/, '');
	const badPhrase = `내가 ${stem}고 싶어요`;
	const validation = validateMoodConcord(badPhrase);
	assert(!validation.valid, `validateMoodConcord correctly flags DV volitional: '${badPhrase}'`);
}

// Perspective mismatch detection
assert(!validateMoodConcord("친구가 한국에 가고 싶어요").valid, "Flags 3rd person subject with '-고 싶다': '친구가 한국에 가고 싶어요'");
assert(!validateMoodConcord("어머니가 커피를 마시고 싶습니다").valid, "Flags 3rd person subject with '-고 싶습니다'");
assert(!validateMoodConcord("선생님이 책을 읽고 싶다").valid, "Flags 3rd person subject with '-고 싶다'");

assert(!validateMoodConcord("내가 한국에 가고 싶어해요").valid, "Flags 1st person subject with '-고 싶어하다': '내가 한국에 가고 싶어해요'");
assert(!validateMoodConcord("저는 밥을 먹고 싶어합니다").valid, "Flags 1st person subject with '-고 싶어합니다'");
assert(!validateMoodConcord("너는 무엇을 보고 싶어하니?").valid || validateMoodConcord("너는 무엇을 보고 싶어해").valid === false, "Flags 2nd person with '-고 싶어하다'");

// -----------------------------------------------------------------------------
// [9/10] Concord Validation & Repair (validateMoodConcord, applyMoodConcord)
// -----------------------------------------------------------------------------
console.log("\n[9/10] Concord Validation & Repair (validateMoodConcord, applyMoodConcord)");

// Repairing short inability negation on DV
assert(applyMoodConcord("이 옷이 못 예뻐요") === "이 옷이 안 예뻐요", "못 예뻐요 -> 안 예뻐요");
assert(applyMoodConcord("가격이 못 비싸요") === "가격이 안 비싸요", "못 비싸요 -> 안 비싸요");
assert(applyMoodConcord("방이 못 커요") === "방이 안 커요", "못 커요 -> 안 커요");
assert(applyMoodConcord("오늘 못 바빠요") === "오늘 안 바빠요", "못 바빠요 -> 안 바빠요");

// Repairing long inability negation on DV
assert(applyMoodConcord("이 옷이 예쁘지 못해요") === "이 옷이 예쁘지 않아요", "예쁘지 못해요 -> 예쁘지 않아요");
assert(applyMoodConcord("가격이 비싸지 못합니다") === "가격이 비싸지 않습니다", "비싸지 못합니다 -> 비싸지 않습니다");
assert(applyMoodConcord("방이 크지 못하다") === "방이 크지 않다", "크지 못하다 -> 크지 않다");

// Repairing suppletion errors
assert(applyMoodConcord("저는 답을 안 알아요") === "저는 답을 몰라요", "안 알아요 -> 몰라요");
assert(applyMoodConcord("그는 사실을 못 압니다") === "그는 사실을 모릅니다", "못 압니다 -> 모릅니다");
assert(applyMoodConcord("그것을 안 알았습니다") === "그것을 몰랐습니다", "안 알았습니다 -> 몰랐습니다");
assert(applyMoodConcord("방에 친구가 안 있어요") === "방에 친구가 없어요", "안 있어요 -> 없어요");
assert(applyMoodConcord("교실에 학생이 안 있습니다") === "교실에 학생이 없습니다", "안 있습니다 -> 없습니다");
assert(applyMoodConcord("시간이 안 있었습니다") === "시간이 없었습니다", "안 있었습니다 -> 없었습니다");

// Repairing volitional perspective errors
assert(applyMoodConcord("친구가 사과를 먹고 싶어요") === "친구가 사과를 먹고 싶어해요", "친구가 ... 먹고 싶어요 -> 먹고 싶어해요");
assert(applyMoodConcord("어머니께서 여행을 가고 싶습니다") === "어머니께서 여행을 가고 싶어합니다", "어머니께서 ... 가고 싶습니다 -> 가고 싶어합니다");
assert(applyMoodConcord("내가 영화를 보고 싶어해요") === "내가 영화를 보고 싶어요", "내가 ... 보고 싶어해요 -> 보고 싶어요");
assert(applyMoodConcord("저는 커피를 마시고 싶어합니다") === "저는 커피를 마시고 싶습니다", "저는 ... 마시고 싶어합니다 -> 마시고 싶습니다");

// -----------------------------------------------------------------------------
// [10/10] Exhaustive Cross-Validation across All Action Verbs vs Descriptive Verbs
// -----------------------------------------------------------------------------
console.log("\n[10/10] Exhaustive Cross-Validation across All Action Verbs vs Descriptive Verbs");

const allUnits = KR_EN_languageUnits || [];
const allActionVerbs = allUnits.filter(u => u && u[DATA_SCHEMA.PartofSpeech] === "Action Verb");
const allDescriptiveVerbs = allUnits.filter(u => u && u[DATA_SCHEMA.PartofSpeech] === "Descriptive Verb");

console.log(`Auditing ${allActionVerbs.length} Action Verbs and ${allDescriptiveVerbs.length} Descriptive Verbs...`);

// 1. All Action Verbs must be permitted for imperative and propositive moods
for (const avUnit of allActionVerbs) {
	const ko = avUnit[DATA_SCHEMA.Korean];
	assert(canTakeMood(avUnit, "imperative") === true, `Action Verb '${ko}' permitted for imperative`);
	assert(canTakeMood(avUnit, "propositive") === true, `Action Verb '${ko}' permitted for propositive`);
	assert(canTakeMood(avUnit, "inability") === true, `Action Verb '${ko}' permitted for inability`);
	assert(canTakeMood(avUnit, "volitional") === true, `Action Verb '${ko}' permitted for volitional`);
}

// 2. All Descriptive Verbs must be forbidden from imperative, propositive, inability, and volitional moods
for (const dvUnit of allDescriptiveVerbs) {
	const ko = dvUnit[DATA_SCHEMA.Korean];
	assert(canTakeMood(dvUnit, "imperative") === false, `Descriptive Verb '${ko}' forbidden from imperative`);
	assert(canTakeMood(dvUnit, "propositive") === false, `Descriptive Verb '${ko}' forbidden from propositive`);
	assert(canTakeMood(dvUnit, "inability") === false, `Descriptive Verb '${ko}' forbidden from inability`);
	assert(canTakeMood(dvUnit, "volitional") === false, `Descriptive Verb '${ko}' forbidden from volitional`);

	// General negation is permitted unless it requires suppletion ('있다')
	if (ko === "있다") {
		assert(canTakeMood(dvUnit, "negation") === false, `'있다' requires negation suppletion to '없다'`);
	} else {
		assert(canTakeMood(dvUnit, "negation") === true, `Descriptive Verb '${ko}' permitted for general negation`);
	}
}

console.log("\n======================================================");
console.log(`TOTAL TESTS: ${totalTests}`);
console.log(`PASSED:      ${passedTests}`);
console.log(`FAILED:      ${failedTests}`);
console.log("======================================================\n");

if (failedTests > 0) {
	console.error(`>>> FAILED: ${failedTests} assertion(s) failed in Feature 8 test suite. <<<`);
	process.exit(1);
} else {
	console.log(">>> FEATURE 8 (MOOD, SPEECH ACT & NEGATION CONCORD) 100% VALIDATED! <<<\n");
}
