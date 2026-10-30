(function() {
/**
 * Korean Number Generators (Sino-Korean & Native/Pure-Korean)
 *
 * Implements rule-based cardinal and attributive numeral synthesis for
 * Sino-Korean (0..10,000) and Pure-Korean (0..99).
 */

let dataModule;
if (typeof require !== 'undefined') {
	try {
		dataModule = require('../../data.js');
	} catch (e) {
		dataModule = typeof window !== 'undefined' ? window : {};
	}
} else {
	dataModule = typeof window !== 'undefined' ? window : {};
}

const state = (typeof require !== 'undefined' ? require('../state.js') : window);
const { DATA_SCHEMA, hasTag } = (typeof require !== 'undefined' ? require('./primitives.js') : window);

class TokenOption {
	constructor(text, units = []) {
		this.text = text;
		this.units = units;
	}
}

function deduplicateTokenOptions(options) {
	const seen = new Set();
	const result = [];
	for (let opt of options) {
		const key = opt.text;
		if (!seen.has(key)) {
			seen.add(key);
			result.push(opt);
		}
	}
	return result;
}

function getFilteredWords(pos, tag) {
	const getWords = dataModule.getWords || (typeof window !== 'undefined' ? window.getWords : null);
	if (!getWords) return [];
	let words = getWords(pos, tag);
	const currentUsageFilter = state.currentUsageFilter;
	if (currentUsageFilter) {
		let originalWords = words;
		words = words.filter(w => {
			const id = w[DATA_SCHEMA.Id];
			if (currentUsageFilter._ids && currentUsageFilter._ids.has(id)) return true;
			const source = w[DATA_SCHEMA.Source];
			let isAllowed = currentUsageFilter[source] || hasTag(w, "devtest");
			if (!isAllowed) {
				const tags = w[DATA_SCHEMA.SemanticTags];
				if (tags) {
					for (let t of tags) {
						if (currentUsageFilter[t]) { isAllowed = true; break; }
					}
				}
			}
			return isAllowed;
		});
		if (words.length === 0 && originalWords.length > 0) {
			words = originalWords.slice(0, 5);
		}
	}
	return words;
}

function getSinoNumber(n) {
	if (n === 0) return state.NUM_ZERO;
	if (n === 10000) return state.SINO_TEN_THOUSAND;
	if (n < 0 || n > 10000) throw new Error(`Sino-Korean numbers supported for 0..10000, got ${n}`);
	let result = "", rem = n;
	const powerNames = [
		[1000, state.SINO_THOUSAND],
		[100, state.SINO_HUNDRED],
		[10, state.SINO_TEN]
	];
	for (const [val, name] of powerNames) {
		const d = Math.floor(rem / val);
		if (d > 0) result += (d === 1 ? "" : state.SINO_DIGITS[d]) + name;
		rem %= val;
	}
	if (rem > 0) result += state.SINO_DIGITS[rem];
	return result;
}

function getKoreanNumber(n, isAttributive = false) {
	if (n === 0) return state.NUM_ZERO;
	if (n < 0 || n > 99) throw new Error(`Pure Korean numbers supported for 0..99, got ${n}`);
	if (n === 20 && isAttributive && state.PURE_KOREAN_TWENTY_ATTRIBUTIVE) {
		return state.PURE_KOREAN_TWENTY_ATTRIBUTIVE;
	}
	const onesArr = isAttributive ? state.PURE_KOREAN_ONES_ATTRIBUTIVE : state.PURE_KOREAN_ONES_CARDINAL;
	const t = Math.floor(n / 10), o = n % 10;
	return (state.PURE_KOREAN_TENS[t] || "") + (t === 0 || o !== 0 ? onesArr[o] : "");
}

function getNumberTokenOptions(baseTag, min, max, isAttributive) {
	const options = [];
	const KoreanWord = DATA_SCHEMA.Korean;
	const words = getFilteredWords("Number", baseTag);

	if (max - min + 1 <= 10) {
		for (let i = min; i <= max; i++) {
			const text = (baseTag === "sinoNumber") ? getSinoNumber(i) : getKoreanNumber(i, isAttributive);
			const matchingUnit = words.find(w => w[KoreanWord] === text);
			options.push(new TokenOption(text, matchingUnit ? [matchingUnit] : []));
		}
		return deduplicateTokenOptions(options);
	}

	words.forEach(w => {
		if (isAttributive && hasTag(w, "counting") && !hasTag(w, "attributive")) return;
		if (!isAttributive && hasTag(w, "attributive") && !hasTag(w, "counting")) return;
		const val = state.KOREAN_NUMBER_VALUES[w[KoreanWord]];
		if (val !== undefined && (val < min || val > max)) return;
		options.push(new TokenOption(w[KoreanWord], [w]));
	});

	const samples = [min, max];
	if (min + 1 < max) samples.push(min + 1);
	if (max - 1 > min) samples.push(max - 1);
	const span = max - min;
	samples.push(Math.floor(min + span * 0.25), Math.floor(min + span * 0.5), Math.floor(min + span * 0.75));

	samples.forEach(n => {
		if (n >= min && n <= max) {
			const text = (baseTag === "sinoNumber") ? getSinoNumber(n) : getKoreanNumber(n, isAttributive);
			const matchingUnit = words.find(w => w[KoreanWord] === text);
			options.push(new TokenOption(text, matchingUnit ? [matchingUnit] : []));
		}
	});

	return deduplicateTokenOptions(options);
}

const numberExports = {
	TokenOption,
	deduplicateTokenOptions,
	getFilteredWords,
	getSinoNumber,
	getKoreanNumber,
	getNumberTokenOptions
};

if (typeof window !== 'undefined') {
	Object.assign(window, numberExports);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = numberExports;
}
})();
