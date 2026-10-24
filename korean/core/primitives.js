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
	getVowelHarmony
};

if (typeof window !== 'undefined') {
	Object.assign(window, exportedPrimitives);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = exportedPrimitives;
}
