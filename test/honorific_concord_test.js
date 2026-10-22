#!/usr/bin/env node
/**
 * test/honorific_concord_test.js - Feature 4: Speech Register & Honorific Concord Test Suite
 *
 * Validates:
 *  1. Subject Honorific Concord:
 *     - Respected elder nouns command honorific subject particle '-께서' (or '-께서는').
 *  2. Predicate Honorific Marker '-(으)시-':
 *     - Vowel-ending stems (-시-), consonant-ending stems (-으시-).
 *     - Phonological irregularities: ㄹ-drop (살다 -> 사시-), ㄷ-irregular (듣다 -> 들으시-),
 *       ㅂ-irregular (돕다 -> 도우시-), ㅅ-irregular (짓다 -> 지으시-), ㅎ-irregular (하얗다 -> 하야시-).
 *     - Formality conjugations: -(으)십니다 (formal), -(으)세요 (polite), -(으)셨어요 (past).
 *  3. Lexical Verb Suppletions:
 *     - 자다 -> 주무시다
 *     - 먹다 / 마시다 -> 드시다 / 잡수시다
 *     - 있다 (existence) -> 계시다 (vs. indirect honorific 있으시다 for attributes/possessions)
 *     - 아프다 -> 편찮으시다
 *     - 죽다 -> 돌아가시다
 *     - 말하다 -> 말씀하시다
 *  4. Lexical Noun Suppletions:
 *     - 밥 -> 진지 / 식사
 *     - 나이 -> 연세
 *     - 말 -> 말씀
 *     - 집 -> 댁
 *     - 이름 -> 성함
 *     - 생일 -> 생신
 *     - 사람 / 명 -> 분
 *  5. Dative Animacy & Respect:
 *     - Elder recipients strictly command '-께' (never *-에게 or *-한테).
 *  6. Humble Predicate Suppletions:
 *     - 주다 -> 드리다
 *     - 말하다 -> 말씀드리다
 *     - 묻다 / 물어보다 -> 여쭙다 / 여쭈어보다
 *     - 만나다 / 보다 -> 뵙다
 *     - 도와주다 -> 도와드리다
 *     - 보여주다 -> 보여드리다
 *  7. 1st-Person Perspective Pronoun Concord:
 *     - 저 / 제 (humble singular), 저희 (humble plural).
 *  8. Honorific Violation Detection (validateHonorificConcord):
 *     - Disallows ungrammatical mixtures (*선생님이 밥을 자요, *선생님에게 주다).
 *  9. Phrase Builders Integration (buildActionVerbPhrase & buildDescriptiveVerbPhrase).
 * 10. Dynamic Data Recovery & Zero Hardcoded Hangul Verification.
 *
 * Usage:
 *   node test/honorific_concord_test.js
 */

const fs = require('fs');
const path = require('path');
const {
	KR_EN_languageUnits,
	DATA_SCHEMA,
	getWords,
	hasTag
} = require('../data.js');

const korean = require('../korean.js');
const {
	attachParticle,
	hasBatchim,
	hasRieulBatchim,
	getStem,
	getConjugatedStem,
	applyMorphology,
	isElderNoun,
	getHonorificVerb,
	getHumbleVerb,
	getHonorificNoun,
	getHumblePronoun,
	getPlainCounterpart,
	isHonorificWord,
	isHumbleWord,
	isForbiddenForElder,
	getHonorificPredicate,
	getHumblePredicate,
	applyHonorificConcord,
	validateHonorificConcord,
	buildActionVerbPhrase,
	buildDescriptiveVerbPhrase,
	HONORIFIC_VERB_SUPPLETIONS,
	HUMBLE_VERB_SUPPLETIONS,
	HONORIFIC_NOUN_SUPPLETIONS,
	HUMBLE_PRONOUN_SUPPLETIONS,
	PLAIN_COUNTERPARTS,
	ELDER_NOUN_TITLES
} = korean;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message, detail = "") {
	totalTests++;
	if (condition) {
		passedTests++;
	} else {
		failedTests++;
		console.error(`  [FAIL] ${message}`);
		if (detail) console.error(`         Detail: ${detail}`);
	}
}

console.log("======================================================");
console.log("   FEATURE 4: SPEECH REGISTER & HONORIFICS CONCORD   ");
console.log("======================================================");

// Fetch sample units from data.js
const teacherUnit = getWords("Noun").find(w => w[DATA_SCHEMA.Korean] === "선생님");
const grandmaUnit = getWords("Noun").find(w => w[DATA_SCHEMA.Korean] === "할머니");
const grandpaUnit = getWords("Noun").find(w => w[DATA_SCHEMA.Korean] === "할아버지");
const parentsUnit = getWords("Noun").find(w => w[DATA_SCHEMA.Korean] === "부모님");
const fatherUnit = getWords("Noun").find(w => w[DATA_SCHEMA.Korean] === "아버지");
const motherUnit = getWords("Noun").find(w => w[DATA_SCHEMA.Korean] === "어머니");
const profUnit = getWords("Noun").find(w => w[DATA_SCHEMA.Korean] === "교수님");
const bossUnit = getWords("Noun").find(w => w[DATA_SCHEMA.Korean] === "사장님");
const friendUnit = getWords("Noun").find(w => w[DATA_SCHEMA.Korean] === "친구");
const studentUnit = getWords("Noun").find(w => w[DATA_SCHEMA.Korean] === "학생");

// -----------------------------------------------------------------------------
// [Suite 1] Subject Honorific Concord & Particle Suppletion (-께서 / -께서는)
// -----------------------------------------------------------------------------
console.log("\n[1/10] Subject Honorific Concord & Particle Suppletion (-께서 / -께서는)");

assert(isElderNoun(teacherUnit), "선생님 is identified as elder noun");
assert(isElderNoun(grandmaUnit), "할머니 is identified as elder noun");
assert(isElderNoun(grandpaUnit), "할아버지 is identified as elder noun");
assert(isElderNoun(parentsUnit), "부모님 is identified as elder noun");
assert(isElderNoun(fatherUnit), "아버지 is identified as elder noun");
assert(isElderNoun(motherUnit), "어머니 is identified as elder noun");
assert(isElderNoun(profUnit), "교수님 is identified as elder noun");
assert(isElderNoun(bossUnit), "사장님 is identified as elder noun");
assert(!isElderNoun(friendUnit), "친구 is NOT an elder noun");
assert(!isElderNoun(studentUnit), "학생 is NOT an elder noun");

assert(attachParticle(teacherUnit, "subject_honorific") === "선생님께서", "선생님 + subject_honorific -> 선생님께서");
assert(attachParticle(grandmaUnit, "subject_honorific") === "할머니께서", "할머니 + subject_honorific -> 할머니께서");
assert(attachParticle(teacherUnit, "topic_honorific") === "선생님께서는", "선생님 + topic_honorific -> 선생님께서는");
assert(attachParticle(grandmaUnit, "topic_honorific") === "할머니께서는", "할머니 + topic_honorific -> 할머니께서는");

assert(attachParticle(teacherUnit, "subject", null, { honorific: true }) === "선생님께서", "선생님 + subject { honorific: true } -> 선생님께서");
assert(attachParticle(grandpaUnit, "subject", null, { honorific: true }) === "할아버지께서", "할아버지 + subject { honorific: true } -> 할아버지께서");
assert(attachParticle(friendUnit, "subject") === "친구가", "친구 + subject -> 친구가");
assert(attachParticle(studentUnit, "subject") === "학생이", "학생 + subject -> 학생이");

// -----------------------------------------------------------------------------
// [Suite 2] Predicate Infix -(으)시- Conjugation Engine (Regular & Irregular)
// -----------------------------------------------------------------------------
console.log("\n[2/10] Predicate Infix -(으)시- Conjugation Engine (Regular & Irregular)");

// Regular vowel stem: 가다
assert(getHonorificPredicate("가다", "polite") === "가세요", "가다 -> 가세요 (polite)");
assert(getHonorificPredicate("가다", "formal") === "가십니다", "가다 -> 가십니다 (formal)");
assert(getHonorificPredicate("가다", "formal_question") === "가십니까?", "가다 -> 가십니까? (formal question)");
assert(getHonorificPredicate("가다", "imperative_formal") === "가십시오", "가다 -> 가십시오 (formal imperative)");
assert(getHonorificPredicate("가다", "past") === "가셨어요", "가다 -> 가셨어요 (past polite)");
assert(getHonorificPredicate("가다", "stem") === "가시", "가다 -> 가시 (stem)");

// Regular consonant stem: 읽다
assert(getHonorificPredicate("읽다", "polite") === "읽으세요", "읽다 -> 읽으세요 (polite)");
assert(getHonorificPredicate("읽다", "formal") === "읽으십니다", "읽다 -> 읽으십니다 (formal)");
assert(getHonorificPredicate("읽다", "formal_question") === "읽으십니까?", "읽다 -> 읽으십니까? (formal question)");
assert(getHonorificPredicate("읽다", "imperative_formal") === "읽으십시오", "읽다 -> 읽으십시오 (formal imperative)");
assert(getHonorificPredicate("읽다", "past") === "읽으셨어요", "읽다 -> 읽으셨어요 (past polite)");

// ㄹ-drop stem: 살다, 만들다, 알다
assert(getHonorificPredicate("살다", "polite") === "사세요", "살다 (ㄹ-drop) -> 사세요");
assert(getHonorificPredicate("살다", "formal") === "사십니다", "살다 (ㄹ-drop) -> 사십니다");
assert(getHonorificPredicate("살다", "past") === "사셨어요", "살다 (ㄹ-drop) -> 사셨어요");
assert(getHonorificPredicate("만들다", "polite") === "만드세요", "만들다 (ㄹ-drop) -> 만드세요");
assert(getHonorificPredicate("알다", "polite") === "아세요", "알다 (ㄹ-drop) -> 아세요");

// ㄷ-irregular stem: 듣다, 걷다
assert(getHonorificPredicate("듣다", "polite") === "들으세요", "듣다 (ㄷ-irregular) -> 들으세요");
assert(getHonorificPredicate("듣다", "formal") === "들으십니다", "듣다 (ㄷ-irregular) -> 들으십니다");
assert(getHonorificPredicate("듣다", "past") === "들으셨어요", "듣다 (ㄷ-irregular) -> 들으셨어요");
assert(getHonorificPredicate("걷다", "polite") === "걸으세요", "걷다 (ㄷ-irregular) -> 걸으세요");

// ㅂ-irregular stem: 돕다
assert(getHonorificPredicate("돕다", "polite") === "도우세요", "돕다 (ㅂ-irregular) -> 도우세요");
assert(getHonorificPredicate("돕다", "formal") === "도우십니다", "돕다 (ㅂ-irregular) -> 도우십니다");
assert(getHonorificPredicate("돕다", "past") === "도우셨어요", "돕다 (ㅂ-irregular) -> 도우셨어요");

// ㅅ-irregular stem: 짓다
assert(getHonorificPredicate("짓다", "polite") === "지으세요", "짓다 (ㅅ-irregular) -> 지으세요");
assert(getHonorificPredicate("짓다", "formal") === "지으십니다", "짓다 (ㅅ-irregular) -> 지으십니다");
assert(getHonorificPredicate("짓다", "past") === "지으셨어요", "짓다 (ㅅ-irregular) -> 지으셨어요");

// -----------------------------------------------------------------------------
// [Suite 3] Lexical Verb Suppletions for Elder Subjects
// -----------------------------------------------------------------------------
console.log("\n[3/10] Lexical Verb Suppletions for Elder Subjects");

assert(getHonorificVerb("자다") === "주무시다", "자다 -> 주무시다 suppletion");
assert(getHonorificVerb("먹다") === "드시다", "먹다 -> 드시다 suppletion");
assert(getHonorificVerb("마시다") === "드시다", "마시다 -> 드시다 suppletion");
assert(getHonorificVerb("있다") === "계시다", "있다 -> 계시다 suppletion");
assert(getHonorificVerb("아프다") === "편찮으시다", "아프다 -> 편찮으시다 suppletion");
assert(getHonorificVerb("죽다") === "돌아가시다", "죽다 -> 돌아가시다 suppletion");
assert(getHonorificVerb("말하다") === "말씀하시다", "말하다 -> 말씀하시다 suppletion");

assert(isForbiddenForElder("자다"), "자다 is forbidden directly for elder subject");
assert(isForbiddenForElder("먹다"), "먹다 is forbidden directly for elder subject");
assert(isForbiddenForElder("마시다"), "마시다 is forbidden directly for elder subject");
assert(isForbiddenForElder("아프다"), "아프다 is forbidden directly for elder subject");
assert(isForbiddenForElder("죽다"), "죽다 is forbidden directly for elder subject");

// Conjugation of suppletive verbs
assert(getHonorificPredicate("자다", "polite") === "주무세요", "자다 -> 주무세요");
assert(getHonorificPredicate("자다", "formal") === "주무십니다", "자다 -> 주무십니다");
assert(getHonorificPredicate("자다", "past") === "주무셨어요", "자다 -> 주무셨어요");

assert(getHonorificPredicate("먹다", "polite") === "드세요", "먹다 -> 드세요");
assert(getHonorificPredicate("먹다", "formal") === "드십니다", "먹다 -> 드십니다");
assert(getHonorificPredicate("먹다", "past") === "드셨어요", "먹다 -> 드셨어요");

assert(getHonorificPredicate("있다", "polite") === "계세요", "있다 (existence) -> 계세요");
assert(getHonorificPredicate("있다", "formal") === "계십니다", "있다 (existence) -> 계십니다");
assert(getHonorificPredicate("있다", "past") === "계셨어요", "있다 (existence) -> 계셨어요");

// Indirect honorific for elder's attribute/possession: 시간이 있으세요 / 있으십니다
assert(getHonorificPredicate("있다", "polite", { indirectHonorific: true }) === "있으세요", "있다 (indirect honorific) -> 있으세요");
assert(getHonorificPredicate("있다", "formal", { indirectHonorific: true }) === "있으십니다", "있다 (indirect honorific) -> 있으십니다");

assert(getHonorificPredicate("아프다", "polite") === "편찮으세요", "아프다 -> 편찮으세요");
assert(getHonorificPredicate("아프다", "formal") === "편찮으십니다", "아프다 -> 편찮으십니다");
assert(getHonorificPredicate("아프다", "past") === "편찮으셨어요", "아프다 -> 편찮으셨어요");

assert(getHonorificPredicate("죽다", "past") === "돌아가셨어요", "죽다 -> 돌아가셨어요");
assert(getHonorificPredicate("죽다", "past_formal") === "돌아가셨습니다", "죽다 -> 돌아가셨습니다");

// -----------------------------------------------------------------------------
// [Suite 4] Lexical Noun Suppletions for Elder Possessions & Attributes
// -----------------------------------------------------------------------------
console.log("\n[4/10] Lexical Noun Suppletions for Elder Possessions & Attributes");

assert(getHonorificNoun("밥") === "진지", "밥 -> 진지 suppletion");
assert(getHonorificNoun("나이") === "연세", "나이 -> 연세 suppletion");
assert(getHonorificNoun("말") === "말씀", "말 -> 말씀 suppletion");
assert(getHonorificNoun("집") === "댁", "집 -> 댁 suppletion");
assert(getHonorificNoun("이름") === "성함", "이름 -> 성함 suppletion");
assert(getHonorificNoun("생일") === "생신", "생일 -> 생신 suppletion");
assert(getHonorificNoun("사람") === "분", "사람 -> 분 suppletion");
assert(getHonorificNoun("명") === "분", "명 -> 분 suppletion");

assert(getPlainCounterpart("진지") === "밥", "진지 plain counterpart is 밥");
assert(getPlainCounterpart("연세") === "나이", "연세 plain counterpart is 나이");
assert(getPlainCounterpart("댁") === "집", "댁 plain counterpart is 집");
assert(getPlainCounterpart("성함") === "이름", "성함 plain counterpart is 이름");
assert(getPlainCounterpart("생신") === "생일", "생신 plain counterpart is 생일");
assert(getPlainCounterpart("분") === "사람", "분 plain counterpart is 사람");

// -----------------------------------------------------------------------------
// [Suite 5] Dative Animacy & Recipient Respect (-께 vs -에게 / -한테)
// -----------------------------------------------------------------------------
console.log("\n[5/10] Dative Animacy & Recipient Respect (-께 vs -에게 / -한테)");

assert(attachParticle(teacherUnit, "dative") === "선생님께", "선생님 dative -> 선생님께");
assert(attachParticle(grandmaUnit, "dative") === "할머니께", "할머니 dative -> 할머니께");
assert(attachParticle(parentsUnit, "dative") === "부모님께", "부모님 dative -> 부모님께");
assert(attachParticle(profUnit, "dative") === "교수님께", "교수님 dative -> 교수님께");
assert(attachParticle(bossUnit, "dative") === "사장님께", "사장님 dative -> 사장님께");

assert(attachParticle(friendUnit, "dative") === "친구에게", "친구 dative (formal) -> 친구에게");
assert(attachParticle(friendUnit, "dative", null, { spoken: true }) === "친구한테", "친구 dative (spoken) -> 친구한테");
assert(attachParticle(studentUnit, "dative") === "학생에게", "학생 dative (formal) -> 학생에게");

// -----------------------------------------------------------------------------
// [Suite 6] Humble Predicate Suppletions toward Elder Recipients
// -----------------------------------------------------------------------------
console.log("\n[6/10] Humble Predicate Suppletions toward Elder Recipients");

assert(getHumbleVerb("주다") === "드리다", "주다 -> 드리다 humble suppletion");
assert(getHumbleVerb("말하다") === "말씀드리다", "말하다 -> 말씀드리다 humble suppletion");
assert(getHumbleVerb("묻다") === "여쭙다", "묻다 -> 여쭙다 humble suppletion");
assert(getHumbleVerb("물어보다") === "여쭈어보다", "물어보다 -> 여쭈어보다 humble suppletion");
assert(getHumbleVerb("만나다") === "뵙다", "만나다 -> 뵙다 humble suppletion");
assert(getHumbleVerb("보다") === "뵙다", "보다 -> 뵙다 humble suppletion");
assert(getHumbleVerb("도와주다") === "도와드리다", "도와주다 -> 도와드리다 humble suppletion");
assert(getHumbleVerb("보여주다") === "보여드리다", "보여주다 -> 보여드리다 humble suppletion");

assert(isHumbleWord("드리다"), "드리다 is identified as humble word");
assert(isHumbleWord("말씀드리다"), "말씀드리다 is identified as humble word");
assert(isHumbleWord("여쭙다"), "여쭙다 is identified as humble word");
assert(isHumbleWord("뵙다"), "뵙다 is identified as humble word");

// Conjugation of humble predicates
assert(getHumblePredicate("주다", "polite") === "드려요", "주다 -> 드려요 (polite humble)");
assert(getHumblePredicate("주다", "formal") === "드립니다", "주다 -> 드립니다 (formal humble)");
assert(getHumblePredicate("주다", "past") === "드렸어요", "주다 -> 드렸어요 (past polite humble)");
assert(getHumblePredicate("주다", "past_formal") === "드렸습니다", "주다 -> 드렸습니다 (past formal humble)");

assert(getHumblePredicate("말하다", "polite") === "말씀드려요", "말하다 -> 말씀드려요 (polite humble)");
assert(getHumblePredicate("말하다", "formal") === "말씀드립니다", "말하다 -> 말씀드립니다 (formal humble)");

assert(getHumblePredicate("묻다", "polite") === "여쭤요", "묻다 -> 여쭤요 (polite humble)");
assert(getHumblePredicate("묻다", "formal") === "여쭙니다", "묻다 -> 여쭙니다 (formal humble)");

assert(getHumblePredicate("만나다", "polite") === "봬요", "만나다 -> 봬요 (polite humble)");

// -----------------------------------------------------------------------------
// [Suite 7] 1st-Person Perspective Pronoun Concord
// -----------------------------------------------------------------------------
console.log("\n[7/10] 1st-Person Perspective Pronoun Concord");

assert(getHumblePronoun("나") === "저", "나 -> 저 humble pronoun suppletion");
assert(getHumblePronoun("우리") === "저희", "우리 -> 저희 humble pronoun suppletion");

// Sandhi contraction of humble pronoun 저 + 가 -> 제가
assert(applyMorphology("저가 가요") === "제가 가요", "저 + 가 contracts to 제가");
assert(applyMorphology("누구가 와요") === "누가 와요", "누구 + 가 contracts to 누가");

// -----------------------------------------------------------------------------
// [Suite 8] Honorific Violation Detection (validateHonorificConcord)
// -----------------------------------------------------------------------------
console.log("\n[8/10] Honorific Violation Detection (validateHonorificConcord)");

// Forbidden plain verbs with elder subject
const check1 = validateHonorificConcord("선생님께서 자요", { honorific: true });
assert(!check1.valid, "Rejects: *선생님께서 자요");
assert(check1.errors.some(e => e.includes("자다")), "Errors mention forbidden plain verb 자다");

const check2 = validateHonorificConcord("할머니께서 밥을 먹어요", { honorific: true });
assert(!check2.valid, "Rejects: *할머니께서 밥을 먹어요");
assert(check2.errors.some(e => e.includes("먹다")), "Errors mention forbidden plain verb 먹다");

const check3 = validateHonorificConcord("아버지께서 아파요", { honorific: true });
assert(!check3.valid, "Rejects: *아버지께서 아파요");
assert(check3.errors.some(e => e.includes("아프다")), "Errors mention forbidden plain verb 아프다");

// Elder subject with plain subject particle in honorific mode
const check4 = validateHonorificConcord("선생님이 드세요", { subject: teacherUnit, honorific: true });
assert(!check4.valid, "Rejects: *선생님이 드세요 (plain -이 with honorific verb)");
assert(check4.errors.some(e => e.includes("-께서")), "Errors mention missing -께서");

// Elder recipient with plain dative particle
const check5 = validateHonorificConcord("선생님에게 드렸습니다", { recipient: teacherUnit });
assert(!check5.valid, "Rejects: *선생님에게 드렸습니다 (plain -에게 with elder recipient)");
assert(check5.errors.some(e => e.includes("-께")), "Errors mention missing -께");

// Elder recipient with non-humble verb
const check6 = validateHonorificConcord("선생님께 책을 줬어요", { recipient: teacherUnit });
assert(!check6.valid, "Rejects: *선생님께 책을 줬어요 (non-humble 주다 toward elder)");
assert(check6.errors.some(e => e.includes("드리다")), "Errors mention required humble verb 드리다");

// Elder subject using humble verb for own action
const check7 = validateHonorificConcord("선생님께서 학생에게 말씀드렸습니다", { honorific: true });
assert(!check7.valid, "Rejects: *선생님께서 학생에게 말씀드렸습니다 (elder humbling self)");
assert(check7.errors.some(e => e.includes("humble")), "Errors mention elder cannot use humble verb");

// Informal 1st person pronoun with elder recipient
const check8 = validateHonorificConcord("내가 선생님께 드렸습니다", { recipient: teacherUnit });
assert(!check8.valid, "Rejects: *내가 선생님께 드렸습니다 (informal 내가 with elder recipient)");
assert(check8.errors.some(e => e.includes("나/내")), "Errors mention informal 1st person pronoun");

// Valid honorific sentences must pass cleanly
const validCheck1 = validateHonorificConcord("선생님께서 진지를 드십니다", { honorific: true });
assert(validCheck1.valid, "Accepts: 선생님께서 진지를 드십니다");

const validCheck2 = validateHonorificConcord("할머니께서 주무세요", { honorific: true });
assert(validCheck2.valid, "Accepts: 할머니께서 주무세요");

const validCheck3 = validateHonorificConcord("아버지께서 편찮으십니다", { honorific: true });
assert(validCheck3.valid, "Accepts: 아버지께서 편찮으십니다");

const validCheck4 = validateHonorificConcord("제가 선생님께 책을 드렸습니다", { recipient: teacherUnit });
assert(validCheck4.valid, "Accepts: 제가 선생님께 책을 드렸습니다");

const validCheck5 = validateHonorificConcord("저희가 부모님께 말씀드렸어요", { recipient: parentsUnit });
assert(validCheck5.valid, "Accepts: 저희가 부모님께 말씀드렸어요");

// -----------------------------------------------------------------------------
// [Suite 9] Phrase Builders Integration (buildActionVerbPhrase & buildDescriptiveVerbPhrase)
// -----------------------------------------------------------------------------
console.log("\n[9/10] Phrase Builders Integration");

const sleepVerb = getWords("Action Verb").find(w => w[DATA_SCHEMA.Korean] === "자다");
const eatVerb = getWords("Action Verb").find(w => w[DATA_SCHEMA.Korean] === "먹다");
const giveVerb = getWords("Action Verb").find(w => w[DATA_SCHEMA.Korean] === "주다");
const sickVerb = getWords("Descriptive Verb").find(w => w[DATA_SCHEMA.Korean] === "아프다");

// Elder subject in buildActionVerbPhrase triggers verb suppletion (자다 -> 주무시다)
const sleepPhraseHon = buildActionVerbPhrase(sleepVerb, getStem("자다"), null, { honorific: true, subject: grandmaUnit });
assert(sleepPhraseHon.verb && sleepPhraseHon.verb[DATA_SCHEMA.Korean] === "주무시다", "buildActionVerbPhrase suppletes 자다 to 주무시다 for grandma");
assert(sleepPhraseHon.text.includes("주무시"), `Generated text contains 주무시: "${sleepPhraseHon.text}"`);

// Elder subject with 밥 triggers noun suppletion to 진지
const riceNoun = getWords("Noun").find(w => w[DATA_SCHEMA.Korean] === "밥");
const eatPhraseHon = buildActionVerbPhrase(eatVerb, getStem("먹다"), riceNoun, { honorific: true, subject: teacherUnit });
assert(eatPhraseHon.verb && eatPhraseHon.verb[DATA_SCHEMA.Korean] === "드시다", "buildActionVerbPhrase suppletes 먹다 to 드시다 for teacher");
assert(eatPhraseHon.noun && eatPhraseHon.noun[DATA_SCHEMA.Korean] === "진지", "buildActionVerbPhrase suppletes 밥 to 진지 for teacher");
assert(eatPhraseHon.text.includes("진지를"), `Generated phrase attaches accusative to 진지: "${eatPhraseHon.text}"`);

// Elder recipient in buildActionVerbPhrase triggers humble suppletion (주다 -> 드리다, -께)
const givePhraseHumble = buildActionVerbPhrase(giveVerb, getStem("주다"), teacherUnit, { recipient: teacherUnit });
assert(givePhraseHumble.verb && givePhraseHumble.verb[DATA_SCHEMA.Korean] === "드리다", "buildActionVerbPhrase suppletes 주다 to 드리다 for elder recipient");
assert(givePhraseHumble.text.includes("선생님께"), `Generated phrase attaches -께 to recipient: "${givePhraseHumble.text}"`);

// Elder subject in buildDescriptiveVerbPhrase triggers suppletion (아프다 -> 편찮으시다, -께서)
const sickPhraseHon = buildDescriptiveVerbPhrase(sickVerb, getStem("아프다"), grandpaUnit, { honorific: true });
assert(sickPhraseHon.verb && sickPhraseHon.verb[DATA_SCHEMA.Korean] === "편찮으시다", "buildDescriptiveVerbPhrase suppletes 아프다 to 편찮으시다 for grandpa");
assert(sickPhraseHon.text.startsWith("할아버지께서"), `Generated phrase begins with 할아버지께서: "${sickPhraseHon.text}"`);

// Full phrase transformation via applyHonorificConcord
const rawSentence = "할머니가 밥을 먹어요";
const transformed = applyHonorificConcord(rawSentence, { honorific: true });
assert(transformed.includes("할머니께서"), `applyHonorificConcord attaches -께서: "${transformed}"`);
assert(transformed.includes("진지를"), `applyHonorificConcord suppletes to 진지를: "${transformed}"`);
assert(transformed.includes("드세요"), `applyHonorificConcord suppletes to 드세요: "${transformed}"`);

const rawDativeSentence = "내가 선생님에게 책을 줘요";
const transformedDative = applyHonorificConcord(rawDativeSentence, { recipient: teacherUnit });
assert(transformedDative.includes("제가"), `applyHonorificConcord lowers 내가 to 제가: "${transformedDative}"`);
assert(transformedDative.includes("선생님께"), `applyHonorificConcord attaches -께: "${transformedDative}"`);
assert(transformedDative.includes("드려요"), `applyHonorificConcord suppletes 줘요 to 드려요: "${transformedDative}"`);

// -----------------------------------------------------------------------------
// [Suite 10] Dynamic Data Recovery & Zero Hardcoded Hangul Verification
// -----------------------------------------------------------------------------
console.log("\n[10/10] Dynamic Data Recovery & Zero Hardcoded Hangul Verification");

assert(HONORIFIC_VERB_SUPPLETIONS instanceof Map, "HONORIFIC_VERB_SUPPLETIONS is a Map");
assert(HONORIFIC_VERB_SUPPLETIONS.size >= 8, `HONORIFIC_VERB_SUPPLETIONS has at least 8 entries, found ${HONORIFIC_VERB_SUPPLETIONS.size}`);

assert(HUMBLE_VERB_SUPPLETIONS instanceof Map, "HUMBLE_VERB_SUPPLETIONS is a Map");
assert(HUMBLE_VERB_SUPPLETIONS.size >= 8, `HUMBLE_VERB_SUPPLETIONS has at least 8 entries, found ${HUMBLE_VERB_SUPPLETIONS.size}`);

assert(HONORIFIC_NOUN_SUPPLETIONS instanceof Map, "HONORIFIC_NOUN_SUPPLETIONS is a Map");
assert(HONORIFIC_NOUN_SUPPLETIONS.size >= 7, `HONORIFIC_NOUN_SUPPLETIONS has at least 7 entries, found ${HONORIFIC_NOUN_SUPPLETIONS.size}`);

assert(HUMBLE_PRONOUN_SUPPLETIONS instanceof Map, "HUMBLE_PRONOUN_SUPPLETIONS is a Map");
assert(HUMBLE_PRONOUN_SUPPLETIONS.size >= 2, `HUMBLE_PRONOUN_SUPPLETIONS has at least 2 entries, found ${HUMBLE_PRONOUN_SUPPLETIONS.size}`);

// Verify zero hardcoded literal declarations in korean.js for suppletion maps
const koreanCode = fs.readFileSync(path.join(__dirname, '../korean.js'), 'utf8');
assert(!koreanCode.includes("const HONORIFIC_VERB_SUPPLETIONS = new Map(["), "HONORIFIC_VERB_SUPPLETIONS is not hardcoded map literal");
assert(!koreanCode.includes("const HUMBLE_VERB_SUPPLETIONS = new Map(["), "HUMBLE_VERB_SUPPLETIONS is not hardcoded map literal");
assert(!koreanCode.includes("const HONORIFIC_NOUN_SUPPLETIONS = new Map(["), "HONORIFIC_NOUN_SUPPLETIONS is not hardcoded map literal");

// Verify all suppletive pairs in HONORIFIC_VERB_SUPPLETIONS have valid entries in data.js
for (const [plain, hon] of HONORIFIC_VERB_SUPPLETIONS.entries()) {
	const plainUnit = KR_EN_languageUnits.find(u => u && u[DATA_SCHEMA.Korean] === plain);
	const honUnit = KR_EN_languageUnits.find(u => u && u[DATA_SCHEMA.Korean] === hon);
	assert(plainUnit !== undefined, `Plain verb '${plain}' exists in data.js`);
	assert(honUnit !== undefined, `Honorific verb '${hon}' exists in data.js`);
}

// Verify all suppletive pairs in HUMBLE_VERB_SUPPLETIONS have valid entries in data.js
for (const [plain, humble] of HUMBLE_VERB_SUPPLETIONS.entries()) {
	const plainUnit = KR_EN_languageUnits.find(u => u && u[DATA_SCHEMA.Korean] === plain);
	const humbleUnit = KR_EN_languageUnits.find(u => u && u[DATA_SCHEMA.Korean] === humble);
	assert(plainUnit !== undefined, `Plain verb '${plain}' exists in data.js`);
	assert(humbleUnit !== undefined, `Humble verb '${humble}' exists in data.js`);
}

// Verify all suppletive pairs in HONORIFIC_NOUN_SUPPLETIONS have valid entries in data.js
for (const [plain, hon] of HONORIFIC_NOUN_SUPPLETIONS.entries()) {
	const plainUnit = KR_EN_languageUnits.find(u => u && u[DATA_SCHEMA.Korean] === plain);
	const honUnit = KR_EN_languageUnits.find(u => u && u[DATA_SCHEMA.Korean] === hon);
	assert(plainUnit !== undefined, `Plain noun '${plain}' exists in data.js`);
	assert(honUnit !== undefined, `Honorific noun '${hon}' exists in data.js`);
}

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log("\n======================================================");
console.log(`TOTAL TESTS: ${totalTests}`);
console.log(`PASSED:      ${passedTests}`);
console.log(`FAILED:      ${failedTests}`);
console.log("======================================================");

if (failedTests > 0) {
	console.error(`\n>>> FAILED: ${failedTests} assertion(s) failed in Feature 4 test suite. <<<`);
	process.exit(1);
} else {
	console.log("\n>>> FEATURE 4 (SPEECH REGISTER & HONORIFICS) 100% VALIDATED! <<<");
	process.exit(0);
}
