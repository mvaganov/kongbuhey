#!/usr/bin/env node
/**
 * test/english_phonemes_test.js
 *
 * Automated regression test suite for English/European phoneme transliteration
 * optimized for Speech Synthesis (Web Speech API / TTS).
 *
 * Validates:
 *  1. Fundamental vowels & acoustic tuning:
 *     - Natural Latin vowels preventing acronym spelling (an, gam, man, bap)
 *     - Single consonants preventing stuttering (k, s, t, p, j)
 *  2. Consonants, tensification & palatalization:
 *     - ㅅ before i/y* -> 'sh' (식사 -> Shiksa, 시간 -> Shigan, 샤워 -> Shawa)
 *     - Single consonants for tense onsets (ㄲ->k, ㅆ->s, ㄸ->t, ㅃ->p, ㅉ->j)
 *  3. Integrated pipeline with statutory pronunciation exceptions:
 *     - Substantive boundaries (겉옷 -> Geodot, 맛없다 -> Madeopta)
 *     - Sino-Korean non-lateralization (생산량 -> Saengsannyang)
 *     - Double coda verb dissimilation (맑게 -> Malke, 밟고 -> Bapko)
 *     - Nasalization (감사합니다 -> Gamsahamnida)
 *  4. Formatting & styles:
 *     - Natural whole-word mode (default, fluent TTS coarticulation)
 *     - Hyphenated syllable mode (for visual morpheme inspection)
 *     - Spaced syllable mode
 *     - Punctuation and whitespace preservation
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
console.log("   ENGLISH/EUROPEAN PHONEME TRANSLITERATION TEST      ");
console.log("======================================================\n");

// -----------------------------------------------------------------------------
// 1. Core Greetings & Polite Phrases (Natural Word Mode)
// -----------------------------------------------------------------------------
console.log("--- 1. Core Polite Phrases & Natural Word Synthesis ---");

check("Standard polite greetings transliterate into fluent whole words without acronym spelling", () => {
	assert.strictEqual(korean.toEnglishPhonemes('안녕하세요'), 'Annyeonghaseyo');
	assert.strictEqual(korean.toEnglishPhonemes('감사합니다'), 'Gamsahamnida');
	assert.strictEqual(korean.toEnglishPhonemes('죄송합니다'), 'Joesonghamnida');
	assert.strictEqual(korean.toEnglishPhonemes('반갑습니다'), 'Bangapseumnida');
});

// -----------------------------------------------------------------------------
// 2. Vowel Acoustic Tuning & Clean Latin Syllables
// -----------------------------------------------------------------------------
console.log("\n--- 2. Vowel Acoustic Tuning (Clean Latin Syllables) ---");

check("Vowels map cleanly to standard pronounceable syllables", () => {
	assert.strictEqual(korean.toEnglishPhonemes('어머니'), 'Eomeoni');
	assert.strictEqual(korean.toEnglishPhonemes('아버지'), 'Abeoji');
	assert.strictEqual(korean.toEnglishPhonemes('우유'), 'Uyu');
	assert.strictEqual(korean.toEnglishPhonemes('여름'), 'Yeoreum');
	assert.strictEqual(korean.toEnglishPhonemes('오늘'), 'Oneul');
	assert.strictEqual(korean.toEnglishPhonemes('사과'), 'Sagwa');
	assert.strictEqual(korean.toEnglishPhonemes('위에'), 'Wie');
});

// -----------------------------------------------------------------------------
// 3. Palatalization & Single Consonants (No Stutters)
// -----------------------------------------------------------------------------
console.log("\n--- 3. Palatalization & Single Consonants (No Stutters) ---");

check("ㅅ before i / y* sounds palatalizes to 'sh'", () => {
	assert.strictEqual(korean.toEnglishPhonemes('시간'), 'Shigan');
	assert.strictEqual(korean.toEnglishPhonemes('식사'), 'Shiksa'); // single 's', no stuttering 'ss'
	assert.strictEqual(korean.toEnglishPhonemes('샤워'), 'Shawo');
	assert.strictEqual(korean.toEnglishPhonemes('쇼핑'), 'Shoping');
	assert.strictEqual(korean.toEnglishPhonemes('사람'), 'Saram'); // 's' before 'a' remains 's'
	assert.strictEqual(korean.toEnglishPhonemes('서울'), 'Seoul');  // 's' before 'eo' remains 's'
});

check("Liquid gemination (ㄹ + ㄹ) produces clean 'll' instead of 'lr'", () => {
	assert.strictEqual(korean.toEnglishPhonemes('빨리'), 'Palli');
	assert.strictEqual(korean.toEnglishPhonemes('몰라'), 'Molla');
	assert.strictEqual(korean.toEnglishPhonemes('달려'), 'Dallyeo');
	assert.strictEqual(korean.toEnglishPhonemes('신라'), 'Shilla'); // [실라] -> Shilla
	assert.strictEqual(korean.toEnglishPhonemes('연락'), 'Yeollak'); // [열락] -> Yeollak
});

// -----------------------------------------------------------------------------
// 4. Pipeline Integration with Statutory Exceptions
// -----------------------------------------------------------------------------
console.log("\n--- 4. Statutory Phonology Exceptions Integration ---");

check("Substantive boundary neutralization integrates into English phonemes", () => {
	assert.strictEqual(korean.toEnglishPhonemes('겉옷'), 'Geodot');
	assert.strictEqual(korean.toEnglishPhonemes('맛없다'), 'Madeopta');
	assert.strictEqual(korean.toEnglishPhonemes('옷 안'), 'Odan');
});

check("Sino-Korean non-lateralization integrates into English phonemes", () => {
	assert.strictEqual(korean.toEnglishPhonemes('생산량'), 'Saengsannyang');
	assert.strictEqual(korean.toEnglishPhonemes('상견례'), 'Sanggyeonnye');
	assert.strictEqual(korean.toEnglishPhonemes('입원료'), 'Ibwonnyo');
	assert.strictEqual(korean.toEnglishPhonemes('결단력'), 'Gyeoltannyeok');
});

check("Double coda verb stem dissimilation uses single consonants", () => {
	assert.strictEqual(korean.toEnglishPhonemes('맑게'), 'Malke'); // single 'k'
	assert.strictEqual(korean.toEnglishPhonemes('읽거나'), 'Ilkeona'); // single 'k'
	assert.strictEqual(korean.toEnglishPhonemes('밟고'), 'Bapko'); // single 'k'
	assert.strictEqual(korean.toEnglishPhonemes('밟다'), 'Bapta'); // single 't'
});

check("'ㄴ' insertion in compounds integrates into English phonemes", () => {
	assert.strictEqual(korean.toEnglishPhonemes('솜이불'), 'Somnibul');
	assert.strictEqual(korean.toEnglishPhonemes('식용유'), 'Shigyongnyu');
	assert.strictEqual(korean.toEnglishPhonemes('꽃잎'), 'Konnip');
});

// -----------------------------------------------------------------------------
// 5. Formatting, Pacing & Style Modes
// -----------------------------------------------------------------------------
console.log("\n--- 5. Formatting, Pacing & Style Modes ---");

check("Punctuation marks and whitespace are preserved exactly", () => {
	const res = korean.toEnglishPhonemes('안녕하십니까? 저는 학생입니다.');
	assert.strictEqual(res, 'Annyeonghashimnika? Jeoneun Haksaengimnida.');
});

check("Options allow hyphenated or spaced syllable modes", () => {
	const hyphenated = korean.toEnglishPhonemes('사과', { style: 'hyphenated' });
	assert.strictEqual(hyphenated, 'Sa-gwa');

	const spaced = korean.toEnglishPhonemes('사과', { style: 'spaced' });
	assert.strictEqual(spaced, 'Sa gwa');

	const uncapitalized = korean.toEnglishPhonemes('사과', { capitalize: false });
	assert.strictEqual(uncapitalized, 'sagwa');
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
	console.log(">>> ALL ENGLISH/EUROPEAN PHONEME TESTS 100% PASSED! <<<\n");
}
