#!/usr/bin/env node
/**
 * test/pronunciation_exceptions_test.js
 *
 * Automated regression test suite for Standard Korean Pronunciation (표준 발음법)
 * statutory phonology exceptions cataloged in 국립국어원 표준 발음법.
 *
 * Validates:
 *  1. Double Batchim Exceptions (제10항 다만, 제11항 다만):
 *     - 'ㄼ' root 밟- -> [ㅂ] before consonants; 넓- derivative compounds -> [넙]
 *     - 'ㄺ' verb stems before 'ㄱ' -> [ㄹ] dissimilation
 *  2. Substantive Morpheme Boundaries (제15항):
 *     - Neutralization before liaison into substantive roots vs. direct liaison in grammatical morphemes
 *  3. Sino-Korean Non-Lateralizing Compounds (제20항 다만):
 *     - ㄴ + ㄹ -> [ㄴ + ㄴ] nasalization instead of [ㄹ + ㄹ]
 *  4. Tensification Exceptions & Saisori (제24항 다만, 제26항 다만, 제28항):
 *     - Passive/causative -기- non-tensification
 *     - Reduplicated Hanja non-tensification
 *     - Saisori glottalization in pure/hybrid compounds
 *  5. 'ㄴ' Insertion in Compounds (제29항):
 *     - Consonant coda + 이/야/여/요/유 -> [ㄴ] insertion
 *  6. Alphabet Letter Names Exceptions (제16항):
 *     - Archaic liaison values before vowel particles
 */

const assert = require('assert');
const korean = require('../korean.js');

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
console.log("   STANDARD PRONUNCIATION EXCEPTIONS TEST SUITE       ");
console.log("======================================================\n");

// -----------------------------------------------------------------------------
// 1. Double Batchim Exceptions (제10항 다만 & 제11항 다만)
// -----------------------------------------------------------------------------
console.log("--- 1. Double Batchim Exceptions (제10항 다만, 제11항 다만) ---");

check("제10항 다만: 밟- root simplifies to [ㅂ] before consonants", () => {
	assert.strictEqual(korean.getPronunciation('밟다'), '밥따');
	assert.strictEqual(korean.getPronunciation('밟고'), '밥꼬');
	assert.strictEqual(korean.getPronunciation('밟지'), '밥찌');
	assert.strictEqual(korean.getPronunciation('밟는'), '밤는'); // ㅂ assimilates to ㅁ before ㄴ
});

check("제10항 본항: 밟- before vowel suffixes maintains standard liaison [발ㅂ-]", () => {
	assert.strictEqual(korean.getPronunciation('밟아'), '발바');
	assert.strictEqual(korean.getPronunciation('밟으면'), '발브면');
});

check("제10항 다만: 넓- derivative compounds simplify to [넙]", () => {
	assert.strictEqual(korean.getPronunciation('넓죽하다'), '넙쭈카다');
	assert.strictEqual(korean.getPronunciation('넓둥글다'), '넙뚱글다');
	assert.strictEqual(korean.getPronunciation('넓적하다'), '넙쩌카다');
});

check("제11항 다만: ㄺ verb stems before ㄱ suffixes dissimilate to [ㄹ]", () => {
	assert.strictEqual(korean.getPronunciation('맑게'), '말께');
	assert.strictEqual(korean.getPronunciation('묽고'), '물꼬');
	assert.strictEqual(korean.getPronunciation('읽거나'), '일꺼나');
	assert.strictEqual(korean.getPronunciation('얽히고'), '얼키고');
});

check("제11항 본항: ㄺ verb stems before other consonants simplify to [ㄱ]", () => {
	assert.strictEqual(korean.getPronunciation('맑다'), '막따');
	assert.strictEqual(korean.getPronunciation('읽다'), '익따');
	assert.strictEqual(korean.getPronunciation('늙다'), '늑따');
});

// -----------------------------------------------------------------------------
// 2. Substantive Morpheme Boundaries (제15항)
// -----------------------------------------------------------------------------
console.log("\n--- 2. Substantive Morpheme Boundaries (제15항) ---");

check("제15항: Substantive morpheme boundaries undergo neutralization then liaison", () => {
	assert.strictEqual(korean.getPronunciation('옷 안'), '오단');
	assert.strictEqual(korean.getPronunciation('밭 아래'), '바다래');
	assert.strictEqual(korean.getPronunciation('늪 앞'), '느밥');
	assert.strictEqual(korean.getPronunciation('겉옷'), '거돋');
	assert.strictEqual(korean.getPronunciation('맛없다'), '마덥따');
	assert.strictEqual(korean.getPronunciation('첫인상'), '처딘상');
});

check("제13항/14항: Grammatical morphemes (particles/suffixes) liaison directly", () => {
	assert.strictEqual(korean.getPronunciation('옷이'), '오시');
	assert.strictEqual(korean.getPronunciation('밭에'), '바테');
	assert.strictEqual(korean.getPronunciation('꽃을'), '꼬츨');
});

// -----------------------------------------------------------------------------
// 3. Sino-Korean Non-Lateralizing Compounds (제20항 다만)
// -----------------------------------------------------------------------------
console.log("\n--- 3. Sino-Korean Non-Lateralization (제20항 다만) ---");

check("제20항 다만: Sino-Korean compounds nasalize ㄴ+ㄹ to [ㄴ+ㄴ]", () => {
	assert.strictEqual(korean.getPronunciation('생산량'), '생산냥');
	assert.strictEqual(korean.getPronunciation('의견란'), '의견난');
	assert.strictEqual(korean.getPronunciation('임진란'), '임진난');
	assert.strictEqual(korean.getPronunciation('결단력'), '결딴녁');
	assert.strictEqual(korean.getPronunciation('상견례'), '상견녜');
	assert.strictEqual(korean.getPronunciation('입원료'), '이붠뇨');
	assert.strictEqual(korean.getPronunciation('횡단로'), '횡단노');
	assert.strictEqual(korean.getPronunciation('이원론'), '이원논');
	assert.strictEqual(korean.getPronunciation('구근류'), '구근뉴');
});

check("제20항 본항: Regular ㄴ+ㄹ / ㄹ+ㄴ assimilates into [ㄹ+ㄹ]", () => {
	assert.strictEqual(korean.getPronunciation('신라'), '실라');
	assert.strictEqual(korean.getPronunciation('난로'), '날로');
	assert.strictEqual(korean.getPronunciation('설날'), '설랄');
	assert.strictEqual(korean.getPronunciation('칼날'), '칼랄');
});

// -----------------------------------------------------------------------------
// 4. Tensification Exceptions & Saisori (제24항 다만, 제26항 다만, 제28항)
// -----------------------------------------------------------------------------
console.log("\n--- 4. Tensification Exceptions & Saisori ---");

check("제24항 다만: Passive/Causative suffix -기- does NOT tensify", () => {
	assert.strictEqual(korean.getPronunciation('안기다'), '안기다');
	assert.strictEqual(korean.getPronunciation('감기다'), '감기다');
	assert.strictEqual(korean.getPronunciation('굶기다'), '굼기다');
	assert.strictEqual(korean.getPronunciation('옮기다'), '옴기다');
});

check("제24항 본항: Other suffixes after nasal verb stems tensify", () => {
	assert.strictEqual(korean.getPronunciation('안고'), '안꼬');
	assert.strictEqual(korean.getPronunciation('신다'), '신따');
	assert.strictEqual(korean.getPronunciation('감다'), '감따');
});

check("제26항 다만: Reduplicated Hanja compounds do NOT tensify", () => {
	assert.strictEqual(korean.getPronunciation('허허실실'), '허허실실');
	assert.strictEqual(korean.getPronunciation('절절하다'), '절절하다');
});

check("제28항: Saisori glottalization in pure/hybrid compound nouns", () => {
	assert.strictEqual(korean.getPronunciation('문고리'), '문꼬리');
	assert.strictEqual(korean.getPronunciation('눈동자'), '눈똥자');
	assert.strictEqual(korean.getPronunciation('길가'), '길까');
	assert.strictEqual(korean.getPronunciation('손재주'), '손째주');
	assert.strictEqual(korean.getPronunciation('술잔'), '술짠');
	assert.strictEqual(korean.getPronunciation('강가'), '강까');
	assert.strictEqual(korean.getPronunciation('등불'), '등뿔');
	assert.strictEqual(korean.getPronunciation('비빔밥'), '비빔빱');
});

// -----------------------------------------------------------------------------
// 5. 'ㄴ' Insertion Rules (제29항)
// -----------------------------------------------------------------------------
console.log("\n--- 5. 'ㄴ' Insertion in Compounds (제29항) ---");

check("제29항: Compound words insert [ㄴ] before 이/야/여/요/유", () => {
	assert.strictEqual(korean.getPronunciation('솜이불'), '솜니불');
	assert.strictEqual(korean.getPronunciation('맨입'), '맨닙');
	assert.strictEqual(korean.getPronunciation('꽃잎'), '꼰닙');
	assert.strictEqual(korean.getPronunciation('물약'), '물략');
	assert.strictEqual(korean.getPronunciation('식용유'), '시굥뉴');
});

// -----------------------------------------------------------------------------
// 6. Korean Alphabet Letter Names Exceptions (제16항)
// -----------------------------------------------------------------------------
console.log("\n--- 6. Alphabet Letter Names Exceptions (제16항) ---");

check("제16항: Korean alphabet letter names irregular liaison before particles", () => {
	assert.strictEqual(korean.getPronunciation('디귿이'), '디그시');
	assert.strictEqual(korean.getPronunciation('지읒이'), '지으시');
	assert.strictEqual(korean.getPronunciation('치읓이'), '치으시');
	assert.strictEqual(korean.getPronunciation('키읔이'), '키으기');
	assert.strictEqual(korean.getPronunciation('티읕이'), '티으시');
	assert.strictEqual(korean.getPronunciation('피읖이'), '피으비');
	assert.strictEqual(korean.getPronunciation('히읗이'), '히으시');
});

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log("\n======================================================");
console.log(`TOTAL TESTS: ${totalTests}`);
console.log(`PASSED:      ${passedTests}`);
console.log(`FAILED:      ${failedTests}`);
console.log("======================================================\n");

if (failedTests > 0) {
	process.exit(1);
} else {
	console.log(">>> ALL PRONUNCIATION EXCEPTION TESTS 100% PASSED! <<<\n");
}
