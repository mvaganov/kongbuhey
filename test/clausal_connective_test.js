#!/usr/bin/env node
/**
 * test/clausal_connective_test.js - Feature 11: Clausal Connectives & Causal Harmony
 *
 * Validates:
 *  1. Dynamic Connective & Motion Verb Extraction:
 *     - CLAUSAL_CONNECTIVES, CAUSAL_CONNECTIVES, CONTRAST_CONNECTIVES,
 *       PURPOSE_CONNECTIVES, CONDITION_CONNECTIVES, SIMULTANEOUS_CONNECTIVES, MOTION_VERBS.
 *  2. Illocutionary Mood Detection (detectClauseMood):
 *     - Imperative, Propositive, Suggestive, Interrogative, Declarative.
 *  3. Clausal Tense Detection (detectClauseTense):
 *     - Accurate past tense infix detection (-았/었/였/했-) while preserving present roots (있/없/겠).
 *  4. Grammatical Clausal Concord (canConnectiveJoin, validateClausalConcord):
 *     - Natural Korean compound sentences across causal, contrastive, purpose, condition, simultaneous.
 *  5. Explicit Quiz Distractor Traps (generateClausalDistractor):
 *     - Generates 6 specific ungrammatical distractor patterns for learning quizzes:
 *       (1) tense_in_clause1, (2) imperative_in_clause2, (3) propositive_in_clause2,
 *       (4) adjective_in_clause1, (5) positive_outcome, (6) non_motion_verb.
 *  6. Distractor Detection & Diagnosis:
 *     - Strict validation confirming all generated distractors are diagnosed as ungrammatical (valid: false)
 *       with exact matching error codes (ERR_CLAUSE1_PAST_TENSE, ERR_CLAUSE2_IMPERATIVE_MOOD, etc.).
 *  7. Auto-Repair Engine (applyClausalConcord):
 *     - Automatically repairs ungrammatical distractors into natural Korean forms.
 *  8. Quiz Item Generation (generateClausalQuizItem):
 *     - Complete multiple-choice question generator with 1 correct option and 3 validated distractors.
 *
 * Usage:
 *   node test/clausal_connective_test.js
 */

const {
	KR_EN_languageUnits,
	DATA_SCHEMA
} = require('../data.js');

const korean = require('../korean.js');
const {
	CLAUSAL_CONNECTIVES,
	CAUSAL_CONNECTIVES,
	CONTRAST_CONNECTIVES,
	PURPOSE_CONNECTIVES,
	CONDITION_CONNECTIVES,
	SIMULTANEOUS_CONNECTIVES,
	MOTION_VERBS,
	getConnectiveSpecs,
	isClausalConnective,
	detectClauseMood,
	detectClauseTense,
	isMotionPredicate,
	parseSentenceToClauses,
	canConnectiveJoin,
	validateClausalConcord,
	generateClausalDistractor,
	applyClausalConcord,
	generateClausalQuizItem
} = korean;

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
console.log("TEST SUITE: Feature 11 - Clausal Connectives & Causal Harmony");
console.log("======================================================\n");

// -----------------------------------------------------------------------------
// Module 1: Dynamic Connective & Motion Verb Extraction
// -----------------------------------------------------------------------------
console.log("[Module 1] Dynamic Connective & Motion Verb Extraction");

assert(CLAUSAL_CONNECTIVES.size >= 15, `CLAUSAL_CONNECTIVES contains ${CLAUSAL_CONNECTIVES.size} connectives (>= 15 expected)`);
assert(CAUSAL_CONNECTIVES.size >= 5, `CAUSAL_CONNECTIVES contains ${CAUSAL_CONNECTIVES.size} causal connectives (>= 5 expected)`);
assert(CONTRAST_CONNECTIVES.size >= 2, `CONTRAST_CONNECTIVES contains ${CONTRAST_CONNECTIVES.size} contrast connectives (>= 2 expected)`);
assert(PURPOSE_CONNECTIVES.size >= 2, `PURPOSE_CONNECTIVES contains ${PURPOSE_CONNECTIVES.size} purpose connectives (>= 2 expected)`);
assert(CONDITION_CONNECTIVES.size >= 1, `CONDITION_CONNECTIVES contains ${CONDITION_CONNECTIVES.size} condition connectives (>= 1 expected)`);
assert(MOTION_VERBS.size >= 10, `MOTION_VERBS contains ${MOTION_VERBS.size} motion verbs (>= 10 expected)`);

// Verify essential TOPIK causal connectives exist in specs
const essentialCausals = ["-아/어서", "-(으)니까", "-기 때문에", "-느라고", "-는 바람에", "-(으)므로"];
for (const ec of essentialCausals) {
	const specs = getConnectiveSpecs(ec);
	assert(specs !== null, `Essential causal connective '${ec}' specs retrieved successfully`);
	if (specs) {
		assert(specs.function === "cause" || specs.unit[DATA_SCHEMA.SemanticTags].has("reason") || specs.unit[DATA_SCHEMA.SemanticTags].has("cause"), `'${ec}' has causal function`);
	}
}

// Verify motion verbs
const essentialMotion = ["가다", "오다", "다니다", "돌아가다", "돌아오다"];
for (const mv of essentialMotion) {
	assert(MOTION_VERBS.has(mv), `Essential motion verb '${mv}' present in MOTION_VERBS`);
}

// -----------------------------------------------------------------------------
// Module 2: Illocutionary Mood Detection Engine (detectClauseMood)
// -----------------------------------------------------------------------------
console.log("\n[Module 2] Illocutionary Mood Detection Engine (detectClauseMood)");

const moodCases = [
	{ text: "우산을 쓰세요", mood: "imperative" },
	{ text: "조용히 하십시오", mood: "imperative" },
	{ text: "가지 마세요", mood: "imperative" },
	{ text: "빨리 가라", mood: "imperative" },
	{ text: "공원에 갑시다", mood: "propositive" },
	{ text: "밥을 먹읍시다", mood: "propositive" },
	{ text: "내일 같이 가자", mood: "propositive" },
	{ text: "커피를 마실까요?", mood: "suggestive" },
	{ text: "영화를 볼래요?", mood: "suggestive" },
	{ text: "어디에 가요?", mood: "interrogative" },
	{ text: "밥을 먹었습니까?", mood: "interrogative" },
	{ text: "집에 갔어요", mood: "declarative" },
	{ text: "도서관에서 공부합니다", mood: "declarative" },
	{ text: "날씨가 좋습니다", mood: "declarative" }
];

for (const mc of moodCases) {
	const detected = detectClauseMood(mc.text);
	assert(detected === mc.mood, `detectClauseMood("${mc.text}") => '${detected}' (expected '${mc.mood}')`);
}

// -----------------------------------------------------------------------------
// Module 3: Clausal Tense Detection Engine (detectClauseTense)
// -----------------------------------------------------------------------------
console.log("\n[Module 3] Clausal Tense Detection Engine (detectClauseTense)");

const tenseCases = [
	{ text: "비가 왔어", tense: "past" },
	{ text: "피곤했어서", tense: "past" },
	{ text: "먹었으러", tense: "past" },
	{ text: "늦었으므로", tense: "past" },
	{ text: "날씨가 좋았어서", tense: "past" },
	{ text: "비가 와서", tense: "present" },
	{ text: "피곤해서", tense: "present" },
	{ text: "먹으러", tense: "present" },
	{ text: "공부하느라고", tense: "present" },
	{ text: "돈이 있어서", tense: "present" }, // Root 있- without past
	{ text: "돈이 있었어서", tense: "past" },  // Past 있었-
	{ text: "시간이 없어서", tense: "present" },
	{ text: "시간이 없었어서", tense: "past" },
	{ text: "내일 갈게요", tense: "present" }   // Modal 겠-
];

for (const tc of tenseCases) {
	const detected = detectClauseTense(tc.text);
	assert(detected === tc.tense, `detectClauseTense("${tc.text}") => '${detected}' (expected '${tc.tense}')`);
}

// -----------------------------------------------------------------------------
// Module 4: Grammatical Clausal Concord (canConnectiveJoin & validateClausalConcord)
// -----------------------------------------------------------------------------
console.log("\n[Module 4] Grammatical Clausal Concord (canConnectiveJoin)");

const validSentences = [
	"비가 와서 우산을 썼어요.",
	"피곤해서 일찍 잤어요.",
	"비가 오니까 우산을 쓰세요.",
	"날씨가 좋으니까 공원에 갑시다.",
	"비가 오니까 커피를 마실까요?",
	"비가 오기 때문에 늦었어요.",
	"공부하느라고 잠을 못 잤어요.",
	"비가 오는 바람에 지각했어요.",
	"바람이 불었으므로 행사를 취소했습니다.",
	"책을 읽으러 도서관에 가요.",
	"친구를 만나러 카페에 왔어요.",
	"음악을 들으면서 책을 읽어요.",
	"시간이 있으면 영화를 봐요.",
	"한국어는 어렵지만 재미있어요.",
	"비가 오는데 우산이 없어요."
];

for (const vs of validSentences) {
	const res = validateClausalConcord(vs);
	assert(res.valid === true, `Valid sentence verified: "${vs}"`);
	if (!res.valid) {
		console.error(`  Validation errors:`, res.errors);
	}
}

// -----------------------------------------------------------------------------
// Module 5: Explicit Quiz Distractor Traps (generateClausalDistractor)
// -----------------------------------------------------------------------------
console.log("\n[Module 5] Explicit Quiz Distractor Traps (generateClausalDistractor)");

// Trap 1: Tense in Clause 1 (*비가 왔어서 우산을 썼어요)
const d1 = generateClausalDistractor("비가 와서 우산을 썼어요", "tense_in_clause1");
assert(d1.includes("왔어서"), `Trap 1 (tense_in_clause1) generates '왔어서': "${d1}"`);

// Trap 2: Imperative in Clause 2 (*비가 와서 우산을 쓰세요)
const d2 = generateClausalDistractor("비가 오니까 우산을 쓰세요", "imperative_in_clause2");
assert(d2.includes("와서") && d2.includes("쓰세요"), `Trap 2 (imperative_in_clause2) generates '-아/어서' with imperative: "${d2}"`);

// Trap 3: Propositive in Clause 2 (*날씨가 좋아서 공원에 갑시다)
const d3 = generateClausalDistractor("날씨가 좋으니까 공원에 갑시다", "propositive_in_clause2");
assert(d3.includes("좋아서") && d3.includes("갑시다"), `Trap 3 (propositive_in_clause2) generates '-아/어서' with propositive: "${d3}"`);

// Trap 4: Adjective in Clause 1 (*방이 작느라고 짐을 못 넣었어요)
const d4 = generateClausalDistractor("공부하느라고 잠을 못 잤어요", "adjective_in_clause1");
assert(d4.includes("작느라고"), `Trap 4 (adjective_in_clause1) generates descriptive verb with '-느라고': "${d4}"`);

// Trap 5: Positive outcome with -느라고 (*열심히 공부하느라고 시험에 합격했어요)
const d5 = generateClausalDistractor("공부하느라고 잠을 못 잤어요", "positive_outcome");
assert(d5.includes("시험에 합격했어요"), `Trap 5 (positive_outcome) generates positive outcome with '-느라고': "${d5}"`);

// Trap 6: Non-motion verb with -(으)러 (*책을 읽으러 커피를 마셔요)
const d6 = generateClausalDistractor("책을 읽으러 도서관에 가요", "non_motion_verb");
assert(d6.includes("커피를 마셔요"), `Trap 6 (non_motion_verb) generates non-motion verb with '-(으)러': "${d6}"`);

// -----------------------------------------------------------------------------
// Module 6: Distractor Detection & Diagnosis (validateClausalConcord)
// -----------------------------------------------------------------------------
console.log("\n[Module 6] Distractor Detection & Diagnosis (validateClausalConcord)");

const distractorDiagnoses = [
	{
		sentence: "비가 왔어서 우산을 썼어요.",
		trap: "Past tense in Clause 1 with -아/어서",
		expectedCode: "ERR_CLAUSE1_PAST_TENSE"
	},
	{
		sentence: "피곤했어서 일찍 잤어요.",
		trap: "Past tense in Clause 1 with -아/어서",
		expectedCode: "ERR_CLAUSE1_PAST_TENSE"
	},
	{
		sentence: "밥을 먹었으러 식당에 가요.",
		trap: "Past tense in Clause 1 with -(으)러",
		expectedCode: "ERR_CLAUSE1_PAST_TENSE"
	},
	{
		sentence: "일했느라고 못 잤어요.",
		trap: "Past tense in Clause 1 with -느라고",
		expectedCode: "ERR_CLAUSE1_PAST_TENSE"
	},
	{
		sentence: "비가 와서 우산을 쓰세요.",
		trap: "Imperative mood in Clause 2 with -아/어서",
		expectedCode: "ERR_CLAUSE2_IMPERATIVE_MOOD"
	},
	{
		sentence: "비가 오기 때문에 우산을 쓰세요.",
		trap: "Imperative mood in Clause 2 with -기 때문에",
		expectedCode: "ERR_CLAUSE2_IMPERATIVE_MOOD"
	},
	{
		sentence: "날씨가 좋아서 공원에 갑시다.",
		trap: "Propositive mood in Clause 2 with -아/어서",
		expectedCode: "ERR_CLAUSE2_PROPOSITIVE_MOOD"
	},
	{
		sentence: "날씨가 좋기 때문에 공원에 갑시다.",
		trap: "Propositive mood in Clause 2 with -기 때문에",
		expectedCode: "ERR_CLAUSE2_PROPOSITIVE_MOOD"
	},
	{
		sentence: "방이 작느라고 짐을 못 넣었어요.",
		trap: "Descriptive Verb in Clause 1 with -느라고",
		expectedCode: "ERR_CLAUSE1_INVALID_POS"
	},
	{
		sentence: "열심히 공부하느라고 시험에 합격했어요.",
		trap: "Positive outcome with -느라고",
		expectedCode: "ERR_OUTCOME_POLARITY"
	},
	{
		sentence: "책을 읽으러 커피를 마셔요.",
		trap: "Non-motion verb in Clause 2 with -(으)러",
		expectedCode: "ERR_NON_MOTION_VERB"
	},
	{
		sentence: "책을 읽으러 집에 있어요.",
		trap: "Static verb in Clause 2 with -(으)러",
		expectedCode: "ERR_NON_MOTION_VERB"
	}
];

for (const dd of distractorDiagnoses) {
	const res = validateClausalConcord(dd.sentence);
	assert(res.valid === false, `Distractor recognized as UNGRAMMATICAL: "${dd.sentence}"`);
	assert(res.errorCodes.includes(dd.expectedCode), `Distractor diagnosed with expected code '${dd.expectedCode}': found [${res.errorCodes.join(", ")}]`);
}

// -----------------------------------------------------------------------------
// Module 7: Auto-Repair Engine (applyClausalConcord)
// -----------------------------------------------------------------------------
console.log("\n[Module 7] Auto-Repair Engine (applyClausalConcord)");

const repairCases = [
	{
		distractor: "비가 왔어서 우산을 썼어요.",
		expected: "비가 와서 우산을 썼어요."
	},
	{
		distractor: "피곤했어서 일찍 잤어요.",
		expected: "피곤해서 일찍 잤어요."
	},
	{
		distractor: "밥을 먹었어서 배불러요.",
		expected: "밥을 먹어서 배불러요."
	},
	{
		distractor: "비가 와서 우산을 쓰세요.",
		expected: "비가 오니까 우산을 쓰세요."
	},
	{
		distractor: "날씨가 좋아서 공원에 갑시다.",
		expected: "날씨가 좋으니까 공원에 갑시다."
	},
	{
		distractor: "비가 오기 때문에 우산을 쓰세요.",
		expected: "비가 오니까 우산을 쓰세요."
	}
];

for (const rc of repairCases) {
	const repaired = applyClausalConcord(rc.distractor);
	assert(repaired === rc.expected, `applyClausalConcord("${rc.distractor}") => "${repaired}" (expected "${rc.expected}")`);
	// Repaired string should pass validation
	const validCheck = validateClausalConcord(repaired);
	assert(validCheck.valid === true, `Repaired sentence passes validation: "${repaired}"`);
}

// -----------------------------------------------------------------------------
// Module 8: Quiz Item Generation Engine (generateClausalQuizItem)
// -----------------------------------------------------------------------------
console.log("\n[Module 8] Quiz Item Generation Engine (generateClausalQuizItem)");

const quizTopics = ["cause_imperative", "cause_propositive", "reason_negative", "purpose_motion"];

for (const topic of quizTopics) {
	const quiz = generateClausalQuizItem({ topic });
	assert(typeof quiz.prompt === "string" && quiz.prompt.length > 0, `Quiz [${topic}] has prompt`);
	assert(typeof quiz.correctSentence === "string" && quiz.correctSentence.length > 0, `Quiz [${topic}] has correctSentence`);
	assert(Array.isArray(quiz.options) && quiz.options.length === 4, `Quiz [${topic}] has exactly 4 options`);

	// Verify correct answer
	const correctOptions = quiz.options.filter(o => o.correct === true);
	assert(correctOptions.length === 1, `Quiz [${topic}] has exactly 1 correct answer`);

	const correctValidation = validateClausalConcord(quiz.correctSentence);
	assert(correctValidation.valid === true, `Quiz [${topic}] correct sentence is 100% valid`);

	// Verify all 3 distractors are recognized as ungrammatical
	const distractorOptions = quiz.options.filter(o => o.correct === false);
	assert(distractorOptions.length === 3, `Quiz [${topic}] has exactly 3 distractors`);

	for (const dOpt of distractorOptions) {
		const dVal = validateClausalConcord(dOpt.text);
		assert(dVal.valid === false, `Quiz [${topic}] distractor "${dOpt.text}" recognized as ungrammatical`);
		assert(dVal.errorCodes.includes(dOpt.errorCode), `Quiz [${topic}] distractor "${dOpt.text}" diagnosed with '${dOpt.errorCode}'`);
	}
}

console.log("\n======================================================");
console.log(`TOTAL TESTS: ${totalTests}`);
console.log(`PASSED:      ${passedTests}`);
console.log(`FAILED:      ${failedTests}`);
console.log("======================================================\n");

if (failedTests > 0) {
	console.error(`>>> FAILED: ${failedTests} assertion(s) failed in Feature 11 test suite. <<<`);
	process.exit(1);
} else {
	console.log(">>> FEATURE 11 (CLAUSAL CONNECTIVES & CAUSAL HARMONY) 100% VALIDATED! <<<\n");
}
