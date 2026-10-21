#!/usr/bin/env node
/**
 * test/dynamic_semantic_sets_test.js
 *
 * Automated regression test suite verifying that:
 * 1. ELDER_NOUN_TITLES is dynamically populated from data.js via 'elder_noun' tag.
 * 2. INANIMATE_INSTITUTION_NAMES is dynamically populated via 'inanimate_institution' tag.
 * 3. ORIGIN_VERBS, ALLATIVE_GOAL_VERBS, STATIC_EXISTENCE_VERBS, HUMBLE_DATIVE_VERBS
 *    are dynamically populated via their respective semantic tags.
 * 4. Number counting systems (SINO_DIGITS, PURE_KOREAN_TENS, PURE_KOREAN_ONES_*,
 *    KOREAN_NUMBER_VALUES) are recovered dynamically from data.js Number units.
 * 5. PARTICLE_PAIRS and PRONOUN_REPLACEMENTS are recovered dynamically from data.js
 *    Grammar and Pronoun units as single point of truth.
 * 6. Hardcoded vocabulary Hangul lists are absent from korean.js data structures.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const korean = require('../korean.js');
const { KR_EN_languageUnits, DATA_SCHEMA, hasTag } = require('../data.js');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function check(desc, fn) {
	totalTests++;
	try {
		fn();
		passedTests++;
		console.log(`  [PASS] ${desc}`);
	} catch (err) {
		failedTests++;
		console.error(`  [FAIL] ${desc}`);
		console.error(`         ${err.message}`);
	}
}

console.log("======================================================");
console.log("   DYNAMIC SEMANTIC SETS & VOCABULARY RECOVERY TEST   ");
console.log("======================================================\n");

// 1. Elder Noun Titles
check("ELDER_NOUN_TITLES is populated dynamically from 'elder_noun' tag", () => {
	assert.ok(korean.ELDER_NOUN_TITLES instanceof Set, "ELDER_NOUN_TITLES must be a Set");
	assert.ok(korean.ELDER_NOUN_TITLES.size >= 20, `Expected at least 20 elder titles, got ${korean.ELDER_NOUN_TITLES.size}`);
	
	// Check key members
	const expected = ['선생님', '교수님', '부모님', '어머니', '아버지', '할머니', '할아버지', '사장님', '어르신', '작은아버지', '작은어머니', '부장', '팀장'];
	for (const title of expected) {
		assert.ok(korean.ELDER_NOUN_TITLES.has(title), `ELDER_NOUN_TITLES should contain ${title}`);
	}

	// Verify all members in the set actually have elder_noun tag in data.js
	for (const title of korean.ELDER_NOUN_TITLES) {
		const unit = KR_EN_languageUnits.find(u => u[DATA_SCHEMA.Korean] === title);
		assert.ok(unit, `Unit for ${title} must exist in data.js`);
		assert.ok(hasTag(unit, 'elder_noun'), `${title} must have 'elder_noun' tag`);
	}
});

// 2. Inanimate Institutions
check("INANIMATE_INSTITUTION_NAMES is populated dynamically from 'inanimate_institution' tag", () => {
	assert.ok(korean.INANIMATE_INSTITUTION_NAMES instanceof Set, "INANIMATE_INSTITUTION_NAMES must be a Set");
	assert.ok(korean.INANIMATE_INSTITUTION_NAMES.size >= 20, `Expected at least 20 institutions, got ${korean.INANIMATE_INSTITUTION_NAMES.size}`);

	const expected = ['회사', '은행', '학교', '병원', '우체국', '가게', '식당', '도서관', '백화점', '약국', '시청', '경찰서', '대사관', '소방서', '구청'];
	for (const inst of expected) {
		assert.ok(korean.INANIMATE_INSTITUTION_NAMES.has(inst), `INANIMATE_INSTITUTION_NAMES should contain ${inst}`);
	}

	for (const name of korean.INANIMATE_INSTITUTION_NAMES) {
		const unit = KR_EN_languageUnits.find(u => u[DATA_SCHEMA.Korean] === name);
		assert.ok(unit, `Unit for ${name} must exist in data.js`);
		assert.ok(hasTag(unit, 'inanimate_institution'), `${name} must have 'inanimate_institution' tag`);
	}
});

// 3. Dynamic Verb Sets
check("ORIGIN_VERBS is populated dynamically from 'locative_origin' tag", () => {
	assert.ok(korean.ORIGIN_VERBS instanceof Set);
	const expected = ['출발하다', '떠나다', '출국하다', '내리다', '나오다', '나가다', '졸업하다', '태어나다'];
	for (const v of expected) {
		assert.ok(korean.ORIGIN_VERBS.has(v), `ORIGIN_VERBS should contain ${v}`);
	}
});

check("ALLATIVE_GOAL_VERBS is populated dynamically from 'locative_goal' tag", () => {
	assert.ok(korean.ALLATIVE_GOAL_VERBS instanceof Set);
	const expected = ['가다', '오다', '다니다', '도착하다', '들어가다', '들어오다', '돌아가다', '돌아오다', '올라가다', '내려가다', '오르다', '다녀오다', '입학하다'];
	for (const v of expected) {
		assert.ok(korean.ALLATIVE_GOAL_VERBS.has(v), `ALLATIVE_GOAL_VERBS should contain ${v}`);
	}
});

check("STATIC_EXISTENCE_VERBS is populated dynamically from 'locative_static' tag", () => {
	assert.ok(korean.STATIC_EXISTENCE_VERBS instanceof Set);
	const expected = ['있다', '없다', '계시다', '살다', '앉다', '서다', '눕다', '놓다', '두다', '올려놓다'];
	for (const v of expected) {
		assert.ok(korean.STATIC_EXISTENCE_VERBS.has(v), `STATIC_EXISTENCE_VERBS should contain ${v}`);
	}
});

check("HUMBLE_DATIVE_VERBS is populated dynamically from 'dative_humble' tag", () => {
	assert.ok(korean.HUMBLE_DATIVE_VERBS instanceof Set);
	const expected = ['드리다', '말씀드리다', '여쭙다', '여쭈어보다', '연락드리다', '인사드리다', '전화드리다', '보여드리다', '도와드리다'];
	for (const v of expected) {
		assert.ok(korean.HUMBLE_DATIVE_VERBS.has(v), `HUMBLE_DATIVE_VERBS should contain ${v}`);
	}
});

// 4. Number Counting Systems
check("Number systems are populated dynamically from data.js Number units", () => {
	// Sino digits
	assert.strictEqual(korean.SINO_DIGITS[1], '일');
	assert.strictEqual(korean.SINO_DIGITS[9], '구');
	assert.strictEqual(korean.getSinoNumber(0), '영');
	assert.strictEqual(korean.getSinoNumber(1), '일');
	assert.strictEqual(korean.getSinoNumber(10), '십');
	assert.strictEqual(korean.getSinoNumber(25), '이십오');
	assert.strictEqual(korean.getSinoNumber(100), '백');
	assert.strictEqual(korean.getSinoNumber(1000), '천');
	assert.strictEqual(korean.getSinoNumber(10000), '만');

	// Pure Korean
	assert.strictEqual(korean.PURE_KOREAN_TENS[1], '열');
	assert.strictEqual(korean.PURE_KOREAN_TENS[2], '스물');
	assert.strictEqual(korean.PURE_KOREAN_TENS[9], '아흔');
	assert.strictEqual(korean.PURE_KOREAN_ONES_CARDINAL[1], '하나');
	assert.strictEqual(korean.PURE_KOREAN_ONES_ATTRIBUTIVE[1], '한');
	assert.strictEqual(korean.PURE_KOREAN_ONES_CARDINAL[2], '둘');
	assert.strictEqual(korean.PURE_KOREAN_ONES_ATTRIBUTIVE[2], '두');
	assert.strictEqual(korean.getKoreanNumber(1, false), '하나');
	assert.strictEqual(korean.getKoreanNumber(1, true), '한');
	assert.strictEqual(korean.getKoreanNumber(20, false), '스물');
	assert.strictEqual(korean.getKoreanNumber(20, true), '스무');
	assert.strictEqual(korean.getKoreanNumber(45, false), '마흔다섯');
	assert.strictEqual(korean.getKoreanNumber(45, true), '마흔다섯');

	// Value dictionary
	assert.strictEqual(korean.KOREAN_NUMBER_VALUES['영'], 0);
	assert.strictEqual(korean.KOREAN_NUMBER_VALUES['하나'], 1);
	assert.strictEqual(korean.KOREAN_NUMBER_VALUES['한'], 1);
	assert.strictEqual(korean.KOREAN_NUMBER_VALUES['스물'], 20);
	assert.strictEqual(korean.KOREAN_NUMBER_VALUES['스무'], 20);
	assert.strictEqual(korean.KOREAN_NUMBER_VALUES['열셋'], 13);
	assert.strictEqual(korean.KOREAN_NUMBER_VALUES['열세'], 13);
	assert.strictEqual(korean.KOREAN_NUMBER_VALUES['백'], 100);
});

// 5. Particle Pairs & Pronoun Replacements
check("PARTICLE_PAIRS and PRONOUN_REPLACEMENTS are recovered dynamically from data.js", () => {
	assert.ok(korean.PARTICLE_PAIRS['이/가'], "이/가 must exist in PARTICLE_PAIRS");
	assert.deepStrictEqual(korean.PARTICLE_PAIRS['이/가'], ['이', '가']);
	assert.deepStrictEqual(korean.PARTICLE_PAIRS['은/는'], ['은', '는']);
	assert.deepStrictEqual(korean.PARTICLE_PAIRS['을/를'], ['을', '를']);
	assert.deepStrictEqual(korean.PARTICLE_PAIRS['(이)랑'], ['이랑', '랑']);
	assert.deepStrictEqual(korean.PARTICLE_PAIRS['과/와'], ['과', '와']);

	// Verify morphology engine applies allomorphs correctly
	assert.strictEqual(korean.applyMorphology('학생이/가'), '학생이');
	assert.strictEqual(korean.applyMorphology('의사이/가'), '의사가');
	assert.strictEqual(korean.applyMorphology('선생님은/는'), '선생님은');
	assert.strictEqual(korean.applyMorphology('친구은/는'), '친구는');
	assert.strictEqual(korean.applyMorphology('물밥을/를'), '물밥을');
	assert.strictEqual(korean.applyMorphology('사과을/를'), '사과를');

	// Verify pronoun sandhi rules
	assert.strictEqual(korean.applyMorphology('저가'), '제가');
	assert.strictEqual(korean.applyMorphology('누구가'), '누가');
	assert.strictEqual(korean.applyMorphology('누가가'), '누가');
	assert.strictEqual(korean.applyMorphology('누가를'), '누구를');
	assert.strictEqual(korean.applyMorphology('뭘을'), '뭘');
});

// 6. Source Code Verification: Absence of Hardcoded Sets
check("korean.js contains no hardcoded array literals for ELDER_NOUN_TITLES or INANIMATE_INSTITUTION_NAMES", () => {
	const code = fs.readFileSync(path.resolve(__dirname, '../korean.js'), 'utf8');

	// Must NOT contain hardcoded new Set([...]) with Hangul for ELDER_NOUN_TITLES
	assert.ok(!code.includes("const ELDER_NOUN_TITLES = new Set(["), "ELDER_NOUN_TITLES must not be hardcoded Set literal");
	assert.ok(!code.includes("const INANIMATE_INSTITUTION_NAMES = new Set(["), "INANIMATE_INSTITUTION_NAMES must not be hardcoded Set literal");
	assert.ok(!code.includes("const ORIGIN_VERBS = new Set(["), "ORIGIN_VERBS must not be hardcoded Set literal");
	assert.ok(!code.includes("const ALLATIVE_GOAL_VERBS = new Set(["), "ALLATIVE_GOAL_VERBS must not be hardcoded Set literal");
	assert.ok(!code.includes("const STATIC_EXISTENCE_VERBS = new Set(["), "STATIC_EXISTENCE_VERBS must not be hardcoded Set literal");
	assert.ok(!code.includes("const HUMBLE_DATIVE_VERBS = new Set(["), "HUMBLE_DATIVE_VERBS must not be hardcoded Set literal");

	// Numbers must NOT be hardcoded arrays
	assert.ok(!code.includes('const SINO_DIGITS = ["", "일"'), "SINO_DIGITS must not be hardcoded array");
	assert.ok(!code.includes('const PURE_KOREAN_TENS = ["", "열"'), "PURE_KOREAN_TENS must not be hardcoded array");
	assert.ok(!code.includes('const PURE_KOREAN_ONES_CARDINAL = ["", "하나"'), "PURE_KOREAN_ONES_CARDINAL must not be hardcoded array");

	// PARTICLE_PAIRS must NOT be hardcoded object literal
	assert.ok(!code.includes('const PARTICLE_PAIRS = {'), "PARTICLE_PAIRS must not be hardcoded object literal");
});

console.log("\n======================================================");
console.log(`TOTAL TESTS: ${totalTests}`);
console.log(`PASSED:      ${passedTests}`);
console.log(`FAILED:      ${failedTests}`);
console.log("======================================================\n");

if (failedTests > 0) {
	process.exit(1);
} else {
	console.log(">>> ALL DYNAMIC SEMANTIC SET TESTS 100% PASSED! <<<\n");
}
