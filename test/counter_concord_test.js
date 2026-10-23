#!/usr/bin/env node
/**
 * test/counter_concord_test.js
 *
 * Feature 6: Numeral-Classifier Matrix & Attributive Measure Word Syntax Test Suite
 *
 * Automated regression test suite verifying that:
 * 1. Classifier sets (KOREAN_CLASSIFIERS, SINO_CLASSIFIERS) are populated dynamically from data.js.
 * 2. Pure Korean counters strictly require Pure Korean attributive numerals (한, 두, 세, 네, 스무).
 * 3. Sino-Korean counters strictly require Sino-Korean numerals (일, 이, 삼, 사...).
 * 4. Noun-classifier semantic categories (animals -> 마리, books -> 권, drinks -> 잔/병, etc.) agree.
 * 5. Clock times strictly use Pure Korean hour + Sino-Korean minute formula.
 * 6. Calendar months strictly reduce 6월 -> 유월 and 10월 -> 시월.
 * 7. applyCounterConcord and applyMorphology automatically contract cardinal numbers before classifiers.
 * 8. Zero hardcoded Hangul arrays/sets in korean.js classifier architecture.
 */

const fs = require('fs');
const path = require('path');
const korean = require('../korean.js');
const {
	KOREAN_CLASSIFIERS,
	SINO_CLASSIFIERS,
	CLASSIFIER_UNITS,
	CLASSIFIER_NOUN_SPECS,
	isClassifier,
	getClassifierNumeralType,
	getMatchingClassifier,
	getMatchingNounsForClassifier,
	getClassifierCandidatesForNoun,
	isCompatibleNounAndClassifier,
	buildCountingPhrase,
	buildClockTimePhrase,
	getMonthName,
	applyCounterConcord,
	validateCounterConcord,
	applyMorphology,
	generateSemanticSentence,
	getKoreanNumber,
	getSinoNumber
} = korean;
const { KR_EN_languageUnits, DATA_SCHEMA } = require('../data.js');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
	totalTests++;
	if (condition) {
		passedTests++;
	} else {
		failedTests++;
		console.error(`  [FAIL] ${message}`);
	}
}

console.log("======================================================");
console.log("   FEATURE 6: NUMERAL-CLASSIFIER MATRIX TEST SUITE   ");
console.log("======================================================\n");

// -----------------------------------------------------------------------------
// [1/10] Dynamic Classifier Sets Extraction & Zero Hardcoded Hangul
// -----------------------------------------------------------------------------
console.log("[1/10] Dynamic Classifier Sets Extraction & Zero Hardcoded Hangul");

assert(KOREAN_CLASSIFIERS instanceof Set, "KOREAN_CLASSIFIERS is a Set");
assert(KOREAN_CLASSIFIERS.size >= 20, `KOREAN_CLASSIFIERS has >= 20 entries (found ${KOREAN_CLASSIFIERS.size})`);

const expectedPureClassifiers = ['개', '명', '분', '마리', '권', '병', '잔', '대', '채', '송이', '장', '켤레', '벌', '자루', '그릇', '살', '시', '시간', '달', '줄', '판'];
for (const cls of expectedPureClassifiers) {
	assert(KOREAN_CLASSIFIERS.has(cls), `KOREAN_CLASSIFIERS contains '${cls}'`);
}

assert(SINO_CLASSIFIERS instanceof Set, "SINO_CLASSIFIERS is a Set");
assert(SINO_CLASSIFIERS.size >= 14, `SINO_CLASSIFIERS has >= 14 entries (found ${SINO_CLASSIFIERS.size})`);

const expectedSinoClassifiers = ['년', '월', '일', '분', '초', '개월', '층', '호', '원', '인분', '세', '학년'];
for (const cls of expectedSinoClassifiers) {
	assert(SINO_CLASSIFIERS.has(cls), `SINO_CLASSIFIERS contains '${cls}'`);
}

// Verify absence of hardcoded Hangul Set/Array literals for classifiers in korean.js
const koreanCode = fs.readFileSync(path.join(__dirname, '../korean.js'), 'utf8');
assert(!koreanCode.includes('const KOREAN_CLASSIFIERS = new Set(["개"'), "KOREAN_CLASSIFIERS is not hardcoded literal");
assert(!koreanCode.includes('const SINO_CLASSIFIERS = new Set(["년"'), "SINO_CLASSIFIERS is not hardcoded literal");
assert(!koreanCode.includes('const CLASSIFIER_NOUN_SPECS = ['), "CLASSIFIER_NOUN_SPECS is not a hardcoded array literal");
assert(Array.isArray(CLASSIFIER_NOUN_SPECS) && CLASSIFIER_NOUN_SPECS.length >= 20, `CLASSIFIER_NOUN_SPECS dynamically populated from data.js (found ${CLASSIFIER_NOUN_SPECS.length})`);

// -----------------------------------------------------------------------------
// [2/10] Classifier Numeral Type Identification (getClassifierNumeralType & isClassifier)
// -----------------------------------------------------------------------------
console.log("\n[2/10] Classifier Numeral Type Identification");

for (const cls of expectedPureClassifiers) {
	assert(isClassifier(cls), `isClassifier('${cls}') is true`);
	if (cls !== '분') {
		assert(getClassifierNumeralType(cls) === "pure", `getClassifierNumeralType('${cls}') is 'pure'`);
	}
}

for (const cls of expectedSinoClassifiers) {
	assert(isClassifier(cls), `isClassifier('${cls}') is true`);
	if (cls !== '분') {
		assert(getClassifierNumeralType(cls) === "sino", `getClassifierNumeralType('${cls}') is 'sino'`);
	}
}

// For homonym '분' (dual classifier: pure for people, sino for time), unit differentiation resolves numeral type
const minuteUnit = KR_EN_languageUnits.find(u => u[DATA_SCHEMA.Id] === 249); // 분 (minute)
const personUnit = KR_EN_languageUnits.find(u => u[DATA_SCHEMA.Id] === 1639); // 분 (person honorific)
assert(getClassifierNumeralType(minuteUnit) === "sino", "getClassifierNumeralType(minuteUnit) is 'sino'");
assert(getClassifierNumeralType(personUnit) === "pure", "getClassifierNumeralType(personUnit) is 'pure'");

assert(!isClassifier("사과"), "isClassifier('사과') is false");
assert(!isClassifier("학교"), "isClassifier('학교') is false");
assert(!isClassifier("가다"), "isClassifier('가다') is false");

// -----------------------------------------------------------------------------
// [3/10] Pure Korean Attributive Numeral Concord
// -----------------------------------------------------------------------------
console.log("\n[3/10] Pure Korean Attributive Numeral Concord");

// Attributive forms: 한, 두, 세, 네, 스무
const validAttributivePairs = [
	{ phrase: "사과 한 개", noun: "사과", cls: "개" },
	{ phrase: "학생 두 명", noun: "학생", cls: "명" },
	{ phrase: "고양이 세 마리", noun: "고양이", cls: "마리" },
	{ phrase: "책 네 권", noun: "책", cls: "권" },
	{ phrase: "물 다섯 병", noun: "물", cls: "병" },
	{ phrase: "커피 여섯 잔", noun: "커피", cls: "잔" },
	{ phrase: "차 일곱 대", noun: "차", cls: "대" },
	{ phrase: "집 여덟 채", noun: "집", cls: "채" },
	{ phrase: "꽃 아홉 송이", noun: "꽃", cls: "송이" },
	{ phrase: "사진 열 장", noun: "사진", cls: "장" },
	{ phrase: "나이 스무 살", noun: "나이", cls: "살" },
	{ phrase: "친구 스물한 명", noun: "친구", cls: "명" },
	{ phrase: "신발 스물두 켤레", noun: "신발", cls: "켤레" }
];

for (const { phrase } of validAttributivePairs) {
	const res = validateCounterConcord(phrase);
	assert(res.valid, `Valid attributive phrase: '${phrase}'`);
}

// Cardinal forms directly preceding classifiers are ungrammatical
const invalidCardinalPairs = [
	{ phrase: "사과 하나 개", err: "하나" },
	{ phrase: "학생 둘 명", err: "둘" },
	{ phrase: "고양이 셋 마리", err: "셋" },
	{ phrase: "책 넷 권", err: "넷" },
	{ phrase: "나이 스물 살", err: "스물" },
	{ phrase: "친구 열하나 명", err: "열하나" },
	{ phrase: "신발 열둘 켤레", err: "열둘" }
];

for (const { phrase, err } of invalidCardinalPairs) {
	const res = validateCounterConcord(phrase);
	assert(!res.valid, `Invalid cardinal phrase correctly flagged: '${phrase}'`);
	assert(res.errors.some(e => e.includes(err)), `Error message mentions '${err}'`);
}

// -----------------------------------------------------------------------------
// [4/10] Pure vs Sino Numeral System Harmony
// -----------------------------------------------------------------------------
console.log("\n[4/10] Pure vs Sino Numeral System Harmony");

// Sino numerals used with pure counters -> invalid
const sinoWithPureClashes = [
	"사과 일 개",
	"학생 이 명",
	"고양이 삼 마리",
	"책 사 권",
	"물 오 병",
	"커피 육 잔",
	"차 칠 대",
	"신발 팔 켤레",
	"옷 구 벌"
];

for (const phrase of sinoWithPureClashes) {
	const res = validateCounterConcord(phrase);
	assert(!res.valid, `Correctly rejected Sino numeral with pure counter: '${phrase}'`);
	assert(res.errors.some(e => e.includes("Sino-Korean numeral")), `Error mentions Sino-Korean numeral`);
}

// Pure numerals used with Sino counters -> invalid
const pureWithSinoClashes = [
	"세 개월 동안 한국에 살았어요",
	"두 년 전에 졸업했어요",
	"다섯 층으로 올라가세요",
	"천 한 원을 냈어요",
	"고기 두 인분을 주문했어요"
];

for (const phrase of pureWithSinoClashes) {
	const res = validateCounterConcord(phrase);
	assert(!res.valid, `Correctly rejected pure numeral with Sino counter: '${phrase}'`);
	assert(res.errors.some(e => e.includes("Native Korean numeral")), `Error mentions Native Korean numeral`);
}

// -----------------------------------------------------------------------------
// [5/10] Noun-Classifier Category Semantic Concord
// -----------------------------------------------------------------------------
console.log("\n[5/10] Noun-Classifier Category Semantic Concord");

const validCategoryMappings = [
	{ noun: "사과", cls: "개" },
	{ noun: "빵", cls: "개" },
	{ noun: "학생", cls: "명" },
	{ noun: "친구", cls: "명" },
	{ noun: "사람", cls: "명" },
	{ noun: "선생님", cls: "분" },
	{ noun: "교수님", cls: "분" },
	{ noun: "할머니", cls: "분" },
	{ noun: "고양이", cls: "마리" },
	{ noun: "강아지", cls: "마리" },
	{ noun: "새", cls: "마리" },
	{ noun: "물고기", cls: "마리" },
	{ noun: "책", cls: "권" },
	{ noun: "공책", cls: "권" },
	{ noun: "사전", cls: "권" },
	{ noun: "물", cls: "병" },
	{ noun: "맥주", cls: "병" },
	{ noun: "커피", cls: "잔" },
	{ noun: "차", cls: "잔" },
	{ noun: "컴퓨터", cls: "대" },
	{ noun: "텔레비전", cls: "대" },
	{ noun: "자전거", cls: "대" },
	{ noun: "집", cls: "채" },
	{ noun: "꽃", cls: "송이" },
	{ noun: "장미", cls: "송이" },
	{ noun: "종이", cls: "장" },
	{ noun: "사진", cls: "장" },
	{ noun: "표", cls: "장" },
	{ noun: "우표", cls: "장" },
	{ noun: "편지", cls: "장" },
	{ noun: "신발", cls: "켤레" },
	{ noun: "구두", cls: "켤레" },
	{ noun: "양말", cls: "켤레" },
	{ noun: "옷", cls: "벌" },
	{ noun: "바지", cls: "벌" },
	{ noun: "정장", cls: "벌" },
	{ noun: "연필", cls: "자루" },
	{ noun: "밥", cls: "그릇" },
	{ noun: "라면", cls: "그릇" },
	{ noun: "나이", cls: "살" }
];

for (const { noun, cls } of validCategoryMappings) {
	assert(isCompatibleNounAndClassifier(noun, cls), `isCompatibleNounAndClassifier('${noun}', '${cls}') is true`);
	const matched = getMatchingClassifier(noun);
	assert(matched === cls || (cls === "분" && matched === "분") || (cls === "병" && (matched === "잔" || matched === "병")),
		`getMatchingClassifier('${noun}') matches '${cls}' (got '${matched}')`);
}

// Incompatible semantic categories
const incompatibleCategoryPairs = [
	{ noun: "물", cls: "마리", phrase: "물 세 마리를 마셨어요" },
	{ noun: "고양이", cls: "잔", phrase: "고양이 두 잔이 있어요" },
	{ noun: "책", cls: "켤레", phrase: "책 다섯 켤레를 샀어요" },
	{ noun: "사람", cls: "권", phrase: "사람 네 권이 왔어요" },
	{ noun: "사과", cls: "대", phrase: "사과 세 대를 먹었어요" },
	{ noun: "자동차", cls: "송이", phrase: "자동차 한 송이가 지나가요" },
	{ noun: "신발", cls: "병", phrase: "신발 세 병을 신었어요" },
	{ noun: "선생님", cls: "마리", phrase: "선생님 두 마리가 오셨어요" },
	{ noun: "꽃", cls: "켤레", phrase: "꽃 두 켤레를 받았어요" },
	{ noun: "옷", cls: "마리", phrase: "옷 세 마리를 입었어요" }
];

for (const { noun, cls, phrase } of incompatibleCategoryPairs) {
	assert(!isCompatibleNounAndClassifier(noun, cls), `isCompatibleNounAndClassifier('${noun}', '${cls}') is false`);
	const res = validateCounterConcord(phrase);
	assert(!res.valid, `Flagged category clash: '${phrase}'`);
	assert(res.errors.some(e => e.includes(noun) && e.includes(cls)), `Error mentions '${noun}' and '${cls}'`);
}

// -----------------------------------------------------------------------------
// [6/10] Counting Phrase Builder (buildCountingPhrase)
// -----------------------------------------------------------------------------
console.log("\n[6/10] Counting Phrase Builder (buildCountingPhrase)");

assert(buildCountingPhrase("사과", 3, { particle: "object" }) === "사과 세 개를", "사과 3 object: '사과 세 개를'");
assert(buildCountingPhrase("학생", 2, { particle: "subject" }) === "학생 두 명이", "학생 2 subject: '학생 두 명이'");
assert(buildCountingPhrase("고양이", 1, { particle: "subject" }) === "고양이 한 마리가", "고양이 1 subject: '고양이 한 마리가'");
assert(buildCountingPhrase("커피", 2, { particle: "object" }) === "커피 두 잔을", "커피 2 object: '커피 두 잔을'");
assert(buildCountingPhrase("구두", 1, { particle: "object" }) === "구두 한 켤레를", "구두 1 object: '구두 한 켤레를'");
assert(buildCountingPhrase("옷", 2, { particle: "object" }) === "옷 두 벌을", "옷 2 object: '옷 두 벌을'");
assert(buildCountingPhrase("선생님", 2, { particle: "subject" }) === "선생님 두 분이", "선생님 2 subject: '선생님 두 분이'");
assert(buildCountingPhrase("책", 3, { prenominal: true }) === "세 권의 책", "책 3 prenominal: '세 권의 책'");
assert(buildCountingPhrase("학생", 5, { prenominal: true }) === "다섯 명의 학생", "학생 5 prenominal: '다섯 명의 학생'");

// -----------------------------------------------------------------------------
// [7/10] Hybrid Clock Time Formula (buildClockTimePhrase)
// -----------------------------------------------------------------------------
console.log("\n[7/10] Hybrid Clock Time Formula (buildClockTimePhrase)");

assert(buildClockTimePhrase(1) === "한 시", "1:00 -> '한 시'");
assert(buildClockTimePhrase(1, 30) === "한 시 삼십 분", "1:30 -> '한 시 삼십 분'");
assert(buildClockTimePhrase(2, 15) === "두 시 십오 분", "2:15 -> '두 시 십오 분'");
assert(buildClockTimePhrase(12, 45) === "열두 시 사십오 분", "12:45 -> '열두 시 사십오 분'");
assert(buildClockTimePhrase(7, 5) === "일곱 시 오 분", "7:05 -> '일곱 시 오 분'");
assert(buildClockTimePhrase(10, 50) === "열 시 오십 분", "10:50 -> '열 시 오십 분'");

// Validation tests on clock time
assert(validateCounterConcord("한 시 삼십 분에 만나요").valid, "Valid clock time sentence");
assert(validateCounterConcord("열두 시 사십오 분에 점심을 먹어요").valid, "Valid clock time sentence");

const invalidClock1 = "일 시 삼십 분에 만나요"; // Sino hour -> invalid
const invalidClock2 = "세 시 셋 분에 끝나요"; // Pure minute -> invalid
assert(!validateCounterConcord(invalidClock1).valid, `Flagged Sino hour: '${invalidClock1}'`);
assert(!validateCounterConcord(invalidClock2).valid, `Flagged pure minute: '${invalidClock2}'`);

// -----------------------------------------------------------------------------
// [8/10] Month Names & Phonological Reductions (getMonthName)
// -----------------------------------------------------------------------------
console.log("\n[8/10] Month Names & Phonological Reductions");

const expectedMonths = [
	{ m: 1, name: "일월" },
	{ m: 2, name: "이월" },
	{ m: 3, name: "삼월" },
	{ m: 4, name: "사월" },
	{ m: 5, name: "오월" },
	{ m: 6, name: "유월" },  // Special reduction
	{ m: 7, name: "칠월" },
	{ m: 8, name: "팔월" },
	{ m: 9, name: "구월" },
	{ m: 10, name: "시월" }, // Special reduction
	{ m: 11, name: "십일월" },
	{ m: 12, name: "십이월" }
];

for (const { m, name } of expectedMonths) {
	assert(getMonthName(m) === name, `Month ${m} is '${name}'`);
	assert(validateCounterConcord(`${name}에 시험이 있어요`).valid, `Valid month sentence with '${name}'`);
}

// Unreduced *육월 and *십월 must be flagged as errors
assert(!validateCounterConcord("육월에 방학이에요").valid, "Flagged unreduced '*육월'");
assert(!validateCounterConcord("십월에 여행을 가요").valid, "Flagged unreduced '*십월'");

// -----------------------------------------------------------------------------
// [9/10] Accidental Cardinal Numeral Repair (applyCounterConcord & applyMorphology)
// -----------------------------------------------------------------------------
console.log("\n[9/10] Accidental Cardinal Numeral Repair");

const repairCases = [
	{ input: "사과 하나 개를 먹었어요", expected: "사과 한 개를 먹었어요" },
	{ input: "학생 둘 명이 왔어요", expected: "학생 두 명이 왔어요" },
	{ input: "고양이 셋 마리가 있어요", expected: "고양이 세 마리가 있어요" },
	{ input: "책 넷 권을 샀어요", expected: "책 네 권을 샀어요" },
	{ input: "저는 스물 살입니다", expected: "저는 스무 살입니다" },
	{ input: "친구 열하나 명이 모였어요", expected: "친구 열한 명이 모였어요" },
	{ input: "신발 스물둘 켤레를 정리했어요", expected: "신발 스물두 켤레를 정리했어요" },
	{ input: "육월에 방학이에요", expected: "유월에 방학이에요" },
	{ input: "십월에 만나요", expected: "시월에 만나요" }
];

for (const { input, expected } of repairCases) {
	const repairedByCounter = applyCounterConcord(input);
	assert(repairedByCounter === expected, `applyCounterConcord('${input}') -> '${expected}' (got '${repairedByCounter}')`);

	const repairedByMorphology = applyMorphology(input);
	assert(repairedByMorphology === expected, `applyMorphology('${input}') -> '${expected}' (got '${repairedByMorphology}')`);
}

// -----------------------------------------------------------------------------
// [10/10] Exhaustive Cartesian Cross-Validation
// -----------------------------------------------------------------------------
console.log("\n[10/10] Exhaustive Cartesian Cross-Validation");

// 1. 10 nouns x 5 counts = 50 valid generated sentences
const testNouns = [
	{ n: "사과", cls: "개" },
	{ n: "학생", cls: "명" },
	{ n: "고양이", cls: "마리" },
	{ n: "책", cls: "권" },
	{ n: "물", cls: "병" },
	{ n: "커피", cls: "잔" },
	{ n: "컴퓨터", cls: "대" },
	{ n: "집", cls: "채" },
	{ n: "꽃", cls: "송이" },
	{ n: "사진", cls: "장" }
];

let validCount = 0;
for (const { n } of testNouns) {
	for (let c = 1; c <= 5; c++) {
		const s = buildCountingPhrase(n, c, { particle: "object" }) + " 샀어요";
		const res = validateCounterConcord(s);
		assert(res.valid, `Valid Cartesian phrase: '${s}'`);
		validCount++;
	}
}
assert(validCount === 50, "Tested 50 valid Cartesian counting phrases");

// 2. 10 nouns x 4 cardinal pure numerals = 40 invalid sentences
const cardinalNums = ["하나", "둘", "셋", "넷"];
let cardinalClashCount = 0;
for (const { n, cls } of testNouns) {
	for (const card of cardinalNums) {
		const s = `${n} ${card} ${cls}를 샀어요`;
		const res = validateCounterConcord(s);
		assert(!res.valid, `Correctly rejected cardinal numeral: '${s}'`);
		cardinalClashCount++;
	}
}
assert(cardinalClashCount === 40, "Tested 40 invalid cardinal numeral clashes");

// 3. 10 nouns x 4 Sino numerals = 40 invalid sentences
const sinoNums = ["일", "이", "삼", "사"];
let sinoClashCount = 0;
for (const { n, cls } of testNouns) {
	for (const sino of sinoNums) {
		const s = `${n} ${sino} ${cls}를 샀어요`;
		const res = validateCounterConcord(s);
		assert(!res.valid, `Correctly rejected Sino numeral with pure counter: '${s}'`);
		sinoClashCount++;
	}
}
assert(sinoClashCount === 40, "Tested 40 invalid Sino numeral clashes");

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log("\n======================================================");
console.log(`TOTAL TESTS: ${totalTests}`);
console.log(`PASSED:      ${passedTests}`);
console.log(`FAILED:      ${failedTests}`);
console.log("======================================================");

if (failedTests > 0) {
	console.error(`\n>>> FAILED: ${failedTests} assertion(s) failed in Feature 6 test suite. <<<`);
	process.exit(1);
} else {
	console.log("\n>>> FEATURE 6 (NUMERAL-CLASSIFIER MATRIX) 100% VALIDATED! <<<");
	process.exit(0);
}
