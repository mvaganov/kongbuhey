/**
 * Korean Hangul Syllable Primitives & Morphophonological Foundation
 *
 * Core mathematical decompositions and compositions for the Hangul Unicode block (0xAC00 - 0xD7A3).
 * Zero dependencies, pure functions.
 */

let dataModule;
if (typeof require !== 'undefined') {
	try {
		dataModule = require('../../data.js');
	} catch (e) {
		try {
			dataModule = require('../data.js');
		} catch (e2) {
			dataModule = typeof window !== 'undefined' ? window : {};
		}
	}
} else {
	dataModule = typeof window !== 'undefined' ? window : {};
}

const DATA_SCHEMA = dataModule.DATA_SCHEMA || {
	Id: 0,
	Korean: 1,
	English: 2,
	PartofSpeech: 3,
	Conjugation: 4,
	Source: 5,
	SemanticTags: 6,
	SemanticVector: 7,
	HonorificRules: 8,
	FormalityLevel: 9
};

const hasTag = dataModule.hasTag || function (unit, ...tags) {
	if (!unit) return false;
	const unitTags = unit[DATA_SCHEMA.SemanticTags];
	if (unitTags) {
		if (unitTags instanceof Set) {
			if (tags.length === 1) return unitTags.has(tags[0]);
			for (let i = 0; i < tags.length; i++) if (unitTags.has(tags[i])) return true;
			return false;
		}
		if (Array.isArray(unitTags)) {
			if (tags.length === 1) return unitTags.includes(tags[0]);
			return tags.some(t => unitTags.includes(t));
		}
	}
	return false;
};

function parseSemanticVector(unit) {
	if (!unit) return {};
	const raw = unit[DATA_SCHEMA.SemanticVector];
	if (!raw || raw === "") return {};
	if (typeof raw === 'object') return raw;
	try { return JSON.parse(raw); } catch (e) { return {}; }
}

const HANGUL_INITIALS = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const HANGUL_MEDIALS = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
const HANGUL_FINALS = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

function decomposeHangul(char) {
	if (!char || typeof char !== 'string') return null;
	const code = char.charCodeAt(0) - 0xAC00;
	if (code < 0 || code >= 11172) return null;
	return { initial: Math.floor(code / 588), medial: Math.floor((code % 588) / 28), final: code % 28 };
}

function composeHangul(initial, medial, final = 0) {
	return String.fromCharCode(0xAC00 + (initial * 588) + (medial * 28) + final);
}

function setFinal(char, final = 0) {
	const d = decomposeHangul(char);
	return d ? composeHangul(d.initial, d.medial, final) : char;
}

function hasBatchim(char) {
	const d = decomposeHangul(char);
	return !!(d && d.final !== 0);
}

function hasRieulBatchim(char) {
	const d = decomposeHangul(char);
	return !!(d && d.final === 8);
}

function getStem(baseForm) {
	if (!baseForm || typeof baseForm !== 'string') return "";
	return baseForm.replace(/다$/, '');
}

function getVowelHarmony(char) {
	if (char === '하') return '여';
	const d = decomposeHangul(char);
	if (!d) return '어';
	return (d.medial === 0 || d.medial === 2 || d.medial === 8) ? '아' : '어';
}

/**
 * Checks whether a character's initial consonant and medial vowel match
 * any of the specified base syllable patterns, ignoring the final consonant (batchim).
 *
 * Example:
 *   matchesBaseSyllable('됩니다', '되') === true ('됩' has initial ㄷ, medial ㅚ)
 *   matchesBaseSyllable('되다', '되') === true
 *   matchesBaseSyllable('됐어요', '되', '돼') === true ('됐' has medial ㅙ)
 *
 * @param {string} char Syllable or word whose first character is checked
 * @param {...string} baseChars One or more base syllables to match against (e.g. '되', '돼')
 * @returns {boolean} True if initial and medial match any baseChar
 */
function matchesBaseSyllable(char, ...baseChars) {
	if (!char || typeof char !== 'string') return false;
	const d1 = decomposeHangul(char[0]);
	if (!d1) return baseChars.includes(char[0]);
	for (let i = 0; i < baseChars.length; i++) {
		const base = baseChars[i];
		if (!base || typeof base !== 'string') continue;
		const d2 = decomposeHangul(base[0]);
		if (!d2) {
			if (char[0] === base[0]) return true;
		} else if (d1.initial === d2.initial && d1.medial === d2.medial) {
			return true;
		}
	}
	return false;
}

const exportedPrimitives = {
	DATA_SCHEMA,
	hasTag,
	parseSemanticVector,
	HANGUL_INITIALS,
	HANGUL_MEDIALS,
	HANGUL_FINALS,
	decomposeHangul,
	composeHangul,
	setFinal,
	hasBatchim,
	hasRieulBatchim,
	getStem,
	getVowelHarmony,
	matchesBaseSyllable
};

if (typeof window !== 'undefined') {
	Object.assign(window, exportedPrimitives);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = exportedPrimitives;
}
