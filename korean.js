let dataModule;
if (typeof require !== 'undefined') {
	dataModule = require('./data.js');
} else {
	dataModule = window;
}
const { getWords, DATA_SCHEMA } = dataModule;
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

// =========================================================================
// 1. Hangul Syllable Primitives & Constants
// =========================================================================
const HANGUL_INITIALS = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const HANGUL_MEDIALS = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
const HANGUL_FINALS = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

function decomposeHangul(char) {
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

function getStem(baseForm) {
	return baseForm.replace(/다$/, '');
}

function getVowelHarmony(char) {
	if (char === '하') return '여';
	const d = decomposeHangul(char);
	if (!d) return '어';
	return (d.medial === 0 || d.medial === 2 || d.medial === 8) ? '아' : '어';
}

// =========================================================================
// 2. Proper Names, Usage Filtering & Option Tracking
// =========================================================================
let properNames = ["민수", "지훈", "수진"];

function getProperNames() { return properNames; }
function setProperNames(names) { if (Array.isArray(names)) properNames = [...names]; }
function getRandomProperName() {
	if (!properNames || properNames.length === 0) return "민수";
	return properNames[Math.floor(Math.random() * properNames.length)];
}

let currentUsageFilter = null;
let totalOptionsCutToPreventCombinatorialExplosion = 0;

function setCurrentUsageFilter(filter) { currentUsageFilter = filter; }
function getTotalOptionsCut() { return totalOptionsCutToPreventCombinatorialExplosion; }
function resetTotalOptionsCut() { totalOptionsCutToPreventCombinatorialExplosion = 0; }

function getFilteredWords(pos, tag) {
	let words = getWords(pos, tag);
	if (currentUsageFilter) {
		let originalWords = words;
		words = words.filter(w => {
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

function getConjugatedStem(koreanWord, conjugation) {
	let stem = getStem(koreanWord);
	if (conjugation && conjugation !== "regular" && conjugation !== "") {
		stem += `[${conjugation}]`;
	}
	return stem;
}

class TokenOption {
	constructor(text, units = []) {
		this.text = text;
		this.units = units;
	}
}

let usedUnitIds = new Set();
function markUnitUsed(unit) {
	if (unit && typeof unit[DATA_SCHEMA.Id] === 'number') {
		usedUnitIds.add(unit[DATA_SCHEMA.Id]);
	}
}
function getUsedUnitIds() { return usedUnitIds; }
function resetUsedUnits() { usedUnitIds.clear(); }

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

// =========================================================================
// 3. Korean Number Generators (Sino & Pure Korean)
// =========================================================================
const SINO_DIGITS = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
const PURE_KOREAN_TENS = ["", "열", "스물", "서른", "마흔", "쉰", "예순", "일흔", "여든", "아흔"];
const PURE_KOREAN_ONES_CARDINAL = ["", "하나", "둘", "셋", "넷", "다섯", "여섯", "일곱", "여덟", "아홉"];
const PURE_KOREAN_ONES_ATTRIBUTIVE = ["", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉"];

function getSinoNumber(n) {
	if (n === 0) return "영";
	if (n === 10000) return "만";
	if (n < 0 || n > 10000) throw new Error(`Sino-Korean numbers supported for 0..10000, got ${n}`);
	let result = "", rem = n;
	for (const [val, name] of [[1000, "천"], [100, "백"], [10, "십"]]) {
		const d = Math.floor(rem / val);
		if (d > 0) result += (d === 1 ? "" : SINO_DIGITS[d]) + name;
		rem %= val;
	}
	if (rem > 0) result += SINO_DIGITS[rem];
	return result;
}

function getKoreanNumber(n, isAttributive = false) {
	if (n === 0) return "영";
	if (n < 0 || n > 99) throw new Error(`Pure Korean numbers supported for 0..99, got ${n}`);
	if (n === 20 && isAttributive) return "스무";
	const onesArr = isAttributive ? PURE_KOREAN_ONES_ATTRIBUTIVE : PURE_KOREAN_ONES_CARDINAL;
	const t = Math.floor(n / 10), o = n % 10;
	return (PURE_KOREAN_TENS[t] || "") + (t === 0 || o !== 0 ? onesArr[o] : "");
}

const KOREAN_NUMBER_VALUES = {
	"영": 0, "하나": 1, "한": 1, "둘": 2, "두": 2, "셋": 3, "세": 3, "넷": 4, "네": 4,
	"다섯": 5, "여섯": 6, "일곱": 7, "여덟": 8, "아홉": 9, "열": 10,
	"열하나": 11, "열한": 11, "열둘": 12, "열두": 12, "열셋": 13, "열세": 13, "열넷": 14, "열네": 14,
	"열다섯": 15, "열여섯": 16, "열일곱": 17, "열여덟": 18, "열아홉": 19, "스물": 20, "스무": 20,
	"서른": 30, "마흔": 40, "쉰": 50, "예순": 60, "일흔": 70, "여든": 80, "아흔": 90,
	"일": 1, "이": 2, "삼": 3, "사": 4, "오": 5, "육": 6, "칠": 7, "팔": 8, "구": 9,
	"십": 10, "이십": 20, "삼십": 30, "사십": 40, "오십": 50, "육십": 60, "칠십": 70, "팔십": 80, "구십": 90,
	"백": 100, "천": 1000, "만": 10000
};

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
		const val = KOREAN_NUMBER_VALUES[w[KoreanWord]];
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

// =========================================================================
// 4. Verb Phrase Building & Argument Specs
// =========================================================================
const ACTION_VERB_SPECS = [
	{ tag: "transitive_food", nounTag: "food", particle: "object", preferDomain: true },
	{ tag: "transitive_drink", nounTag: "drink", particle: "object", preferDomain: true },
	{ tag: "transitive_person", nounTag: "person", particle: "object" },
	{ tag: "dative_person", nounTag: "person", particle: "dative" },
	{ tag: "transitive_general", nounTag: "object", particle: "object", fallbackTag: null },
	{ tag: "transitive_sports", nounTag: "sports", particle: "object", fallbackTag: "activity" },
	{ tag: "transitive_transportation", nounTag: "transportation", particle: "object" },
	{ tag: "transitive_place", nounTag: "place", particle: "object", preferDomain: true },
	{ tag: "intransitive_motion", nounTag: "place", particle: "location", preferDomain: true }
];

const DESCRIPTIVE_VERB_SPECS = [
	{ tag: "descriptive_food", nounTag: "food" },
	{ tag: "descriptive_person", nounTag: "person" },
	{ tag: "descriptive_place", nounTag: "place" },
	{ tag: "descriptive_general", nounTag: "object", fallbackTag: null }
];

function findNounForVerbTag(spec) {
	let words = getFilteredWords("Noun", spec.nounTag);
	if (spec.preferDomain) {
		const domainWords = words.filter(w => parseSemanticVector(w).domain);
		if (domainWords.length > 0) words = domainWords;
	}
	if (words.length === 0 && spec.fallbackTag !== undefined) {
		words = getFilteredWords("Noun", spec.fallbackTag || undefined);
	}
	if (words.length === 0) {
		words = getWords("Noun", spec.nounTag);
		if (words.length === 0) words = getWords("Noun");
	}
	const chosen = getRandom(words);
	if (chosen) markUnitUsed(chosen);
	return chosen;
}

function attachParticle(nounKo, particleType) {
	if (particleType === "object") return nounKo + (hasBatchim(nounKo.slice(-1)) ? "을" : "를");
	if (particleType === "dative") return nounKo + "에게";
	if (particleType === "location") return nounKo + "에";
	if (particleType === "subject") return nounKo + (hasBatchim(nounKo.slice(-1)) ? "이" : "가");
	return nounKo;
}

function buildActionVerbPhrase(word, stem, chosenNoun = null) {
	let spec = null;
	if (hasTag(word, "transitive_food") || hasTag(word, "transitive_drink")) {
		spec = hasTag(word, "transitive_food") ? ACTION_VERB_SPECS[0] : ACTION_VERB_SPECS[1];
	} else {
		spec = ACTION_VERB_SPECS.find(s => hasTag(word, s.tag));
	}
	if (!spec) return { text: stem, noun: null };

	const noun = chosenNoun || findNounForVerbTag(spec);
	if (!noun) return { text: stem, noun: null };

	const nounKo = typeof noun === 'string' ? noun : noun[DATA_SCHEMA.Korean];
	return { text: `${attachParticle(nounKo, spec.particle)} ${stem}`, noun };
}

function buildDescriptiveVerbPhrase(word, stem, chosenNoun = null) {
	const spec = DESCRIPTIVE_VERB_SPECS.find(s => hasTag(word, s.tag));
	if (!spec) return { text: stem, noun: null };

	const noun = chosenNoun || findNounForVerbTag(spec);
	if (!noun) return { text: stem, noun: null };

	const nounKo = typeof noun === 'string' ? noun : noun[DATA_SCHEMA.Korean];
	return { text: `${attachParticle(nounKo, "subject")} ${stem}`, noun };
}

function expandSemanticVerb(pos, isAction, tokenType, currentContext, applyConstraint) {
	let words = getFilteredWords(pos);
	if (applyConstraint) {
		if (isAction && currentContext.req_domain) {
			const domainWords = words.filter(w => parseSemanticVector(w).domain === currentContext.req_domain);
			if (domainWords.length > 0) words = domainWords;
		} else if (!isAction && currentContext.logic === "cause_effect") {
			const matchingWords = words.filter(w => {
				const sv = parseSemanticVector(w);
				return (sv.polarity === currentContext.polarity) &&
					(sv.req === currentContext.produced_state || sv.req === "any" || sv.domain === "state");
			});
			if (matchingWords.length > 0) words = matchingWords;
		} else if (!isAction && currentContext.logic === "contrast") {
			const matchingWords = words.filter(w => {
				const sv = parseSemanticVector(w);
				return sv.polarity !== currentContext.polarity && sv.polarity !== 0;
			});
			if (matchingWords.length > 0) words = matchingWords;
		}
	}

	const svWords = words.filter(w => parseSemanticVector(w).domain);
	if (svWords.length > 0) words = svWords;

	const word = getRandom(words);
	if (!word) return { text: "N/A", verb: null, noun: null };

	markUnitUsed(word);
	const sv = parseSemanticVector(word);
	if (isAction) {
		if (sv.prod) currentContext.produced_state = sv.prod;
		if (sv.polarity !== undefined) currentContext.polarity = sv.polarity;
	}

	const stem = getConjugatedStem(word[DATA_SCHEMA.Korean], word[DATA_SCHEMA.Conjugation]);
	if (tokenType === "AVst" || tokenType === "DVst") {
		return { text: stem, verb: word, noun: null };
	}
	const phrase = isAction ? buildActionVerbPhrase(word, stem) : buildDescriptiveVerbPhrase(word, stem);
	return { text: phrase.text, verb: word, noun: phrase.noun };
}

function expandSemanticActionVerb(tokenType, currentContext, applyConstraint) {
	return expandSemanticVerb("Action Verb", true, tokenType, currentContext, applyConstraint);
}

function expandSemanticDescriptiveVerb(tokenType, currentContext, applyConstraint) {
	return expandSemanticVerb("Descriptive Verb", false, tokenType, currentContext, applyConstraint);
}

// =========================================================================
// 5. Template & Token Expansion
// =========================================================================
function getTokenOptions(token, depth = 0) {
	let options = [];
	const KoreanWord = DATA_SCHEMA.Korean;
	const Conjugation = DATA_SCHEMA.Conjugation;

	if (token.type === "Name" || token.isProperName || (token.type === "N" && (token.tag === "name" || token.tag === "properName"))) {
		options = [new TokenOption(getRandomProperName(), [])];
	} else if (token.type === "properNoun") {
		const seeGrammar = getFilteredWords("Grammar").find(g => g[KoreanWord] === "씨") || getWords("Grammar").find(g => g[KoreanWord] === "씨");
		options = [new TokenOption(getRandomProperName() + "씨", seeGrammar ? [seeGrammar] : [])];
	} else if (token.type === "N" || token.type === "Noun" || token.type === "N_Phrase") {
		options = getFilteredWords("Noun", token.tag).map(w => new TokenOption(w[KoreanWord], [w]));
	} else if (token.type === "AVst") {
		options = getFilteredWords("Action Verb", token.tag).map(w => new TokenOption(getConjugatedStem(w[KoreanWord], w[Conjugation]), [w]));
	} else if (token.type === "DVst") {
		options = getFilteredWords("Descriptive Verb", token.tag).map(w => new TokenOption(getConjugatedStem(w[KoreanWord], w[Conjugation]), [w]));
	} else if (token.type === "Number") {
		const rangeMatch = token.tag ? token.tag.match(/^([a-zA-Z_]+)\((\d+)\s*,\s*(\d+)\)$/) : null;
		if (rangeMatch) {
			options = getNumberTokenOptions(rangeMatch[1], parseInt(rangeMatch[2], 10), parseInt(rangeMatch[3], 10), !!token.isFollowedByMeasureWord);
		} else {
			let words = getFilteredWords("Number", token.tag);
			words = words.filter(w => token.isFollowedByMeasureWord
				? (!hasTag(w, "counting") || hasTag(w, "attributive"))
				: (!hasTag(w, "attributive") || hasTag(w, "counting")));
			options = words.map(w => new TokenOption(w[KoreanWord], [w]));
		}
	} else if (token.type === "Adv") {
		options = getFilteredWords("Adverb", token.tag).map(w => new TokenOption(w[KoreanWord], [w]));
	} else if (token.type === "Exclamation") {
		options = getFilteredWords("Exclamation", token.tag).map(w => new TokenOption(w[KoreanWord], [w]));
	} else if (token.type === "Clause" || token.type === "VP") {
		if (depth > 0) {
			options = [new TokenOption("갑니다"), new TokenOption("좋아요")];
		} else {
			const grammars = getFilteredWords("Grammar").filter(g => hasTag(g, "declarative", "suggestion"));
			if (grammars.length > 0) {
				grammars.forEach(g => {
					g[Conjugation].forEach(formula => {
						generateTemplateTokenOptions(formula, depth + 1).forEach(sub => {
							options.push(new TokenOption(sub.text, [g, ...sub.units]));
						});
					});
				});
			} else {
				options = [new TokenOption("갑니다"), new TokenOption("좋아요")];
			}
		}
	} else if (token.type === "VP_AVst") {
		getFilteredWords("Action Verb", token.tag).forEach(av => {
			const stem = getConjugatedStem(av[KoreanWord], av[Conjugation]);
			if (hasTag(av, "transitive_food")) getFilteredWords("Noun", "food").forEach(n => options.push(new TokenOption(`${n[KoreanWord]}을/를 ${stem}`, [av, n])));
			if (hasTag(av, "transitive_drink")) getFilteredWords("Noun", "drink").forEach(n => options.push(new TokenOption(`${n[KoreanWord]}을/를 ${stem}`, [av, n])));
			if (hasTag(av, "transitive_person")) getFilteredWords("Noun", "person").forEach(n => options.push(new TokenOption(`${n[KoreanWord]}을/를 ${stem}`, [av, n])));
			if (hasTag(av, "dative_person")) getFilteredWords("Noun", "person").forEach(n => options.push(new TokenOption(`${n[KoreanWord]}에게 ${stem}`, [av, n])));
			if (hasTag(av, "transitive_general")) {
				let objs = getFilteredWords("Noun", "object");
				if (objs.length === 0) objs = getFilteredWords("Noun");
				objs.forEach(n => options.push(new TokenOption(`${n[KoreanWord]}을/를 ${stem}`, [av, n])));
			}
			if (hasTag(av, "transitive_sports")) {
				let sports = getFilteredWords("Noun", "sports");
				if (sports.length === 0) sports = getFilteredWords("Noun", "activity");
				sports.forEach(n => options.push(new TokenOption(`${n[KoreanWord]}을/를 ${stem}`, [av, n])));
			}
			if (hasTag(av, "transitive_transportation")) {
				getFilteredWords("Noun", "transportation").forEach(n => options.push(new TokenOption(`${n[KoreanWord]}을/를 ${stem}`, [av, n])));
			}
			if (hasTag(av, "transitive_place")) {
				getFilteredWords("Noun", "place").forEach(n => options.push(new TokenOption(`${n[KoreanWord]}을/를 ${stem}`, [av, n])));
			}
			if (hasTag(av, "intransitive_motion")) {
				getFilteredWords("Noun", "place").forEach(n => options.push(new TokenOption(`${n[KoreanWord]}에 ${stem}`, [av, n])));
			}
			if (hasTag(av, "intransitive_general")) options.push(new TokenOption(stem, [av]));
		});
	} else if (token.type === "VP_DVst") {
		getFilteredWords("Descriptive Verb", token.tag).forEach(dv => {
			const stem = getConjugatedStem(dv[KoreanWord], dv[Conjugation]);
			if (hasTag(dv, "descriptive_food")) getFilteredWords("Noun", "food").forEach(n => options.push(new TokenOption(`${n[KoreanWord]}이/가 ${stem}`, [dv, n])));
			if (hasTag(dv, "descriptive_person")) getFilteredWords("Noun", "person").forEach(n => options.push(new TokenOption(`${n[KoreanWord]}이/가 ${stem}`, [dv, n])));
			if (hasTag(dv, "descriptive_place")) getFilteredWords("Noun", "place").forEach(n => options.push(new TokenOption(`${n[KoreanWord]}이/가 ${stem}`, [dv, n])));
			if (hasTag(dv, "descriptive_general")) {
				let nouns = getFilteredWords("Noun", "object");
				if (nouns.length === 0) nouns = getFilteredWords("Noun");
				nouns.forEach(n => options.push(new TokenOption(`${n[KoreanWord]}이/가 ${stem}`, [dv, n])));
			}
		});
	}

	options = deduplicateTokenOptions(options);
	if (!currentUsageFilter && options.length > 5) {
		totalOptionsCutToPreventCombinatorialExplosion += options.length - 5;
		options = options.sort(() => 0.5 - Math.random()).slice(0, 5);
	}
	return options;
}

function generateTemplateTokenOptions(template, depth = 0) {
	if (depth > 2) return [new TokenOption("갑니다"), new TokenOption("좋아요")];
	const tokenRegex = /\{([^}:]+)(?::([^}]+))?\}/;
	const match = template.match(tokenRegex);
	if (!match) return [new TokenOption(template, [])];

	const fullMatch = match[0];
	const tokenType = match[1];
	const tag = match[2];
	const afterToken = template.substring(match.index + fullMatch.length);
	const isFollowedByMeasureWord = /^\s*\{(?:Noun|N):.*measureWord/i.test(afterToken) || /^\s*[가-힣]/.test(afterToken);
	const isProperName = tokenType === "Name" || tag === "properName" || tag === "name" || (tokenType === "N" && (afterToken.startsWith("씨") || afterToken.startsWith(" 씨")));

	const options = getTokenOptions({ type: tokenType, tag, isFollowedByMeasureWord, isProperName }, depth);
	const combinations = [];

	for (let opt of options) {
		let remainder = template.substring(match.index + fullMatch.length);
		if (opt.text.endsWith("씨") && remainder.startsWith("씨")) remainder = remainder.substring(1).trimStart();
		const prefix = template.substring(0, match.index) + opt.text;
		const subOptions = generateTemplateTokenOptions(remainder, depth);

		for (let sub of subOptions) {
			combinations.push(new TokenOption(prefix + sub.text, [...opt.units, ...sub.units]));
		}
	}
	return combinations;
}

function generateTemplateOptions(template, depth = 0) {
	return generateTemplateTokenOptions(template, depth).map(opt => opt.text);
}

// =========================================================================
// 6. Semantic Context & Sentence Generation
// =========================================================================
const SemanticConfig = {
	strictness: { default: 0.8, contrast: 1.0, cause_effect: 0.9, sequence: 0.7, selection: 0.8 },
	getWeight(domainOrLogic) {
		if (domainOrLogic && this.strictness[domainOrLogic] !== undefined) return this.strictness[domainOrLogic];
		return this.strictness.default;
	}
};

function getRandom(arr) {
	if (!arr || arr.length === 0) return null;
	return arr[Math.floor(Math.random() * arr.length)];
}

function parseSemanticVector(unit) {
	if (!unit) return {};
	const raw = unit[DATA_SCHEMA.SemanticVector];
	if (!raw || raw === "") return {};
	if (typeof raw === 'object') return raw;
	try { return JSON.parse(raw); } catch (e) { return {}; }
}

function shouldApplySemanticConstraint(context) {
	if (!context || !context.logic) return false;
	const weight = SemanticConfig.getWeight(context.logic);
	if (weight >= 1.0) return true;
	if (weight <= 0.0) return false;
	return Math.random() < weight;
}

let templateToGrammarMap = null;
function initTemplateToGrammarMap() {
	if (templateToGrammarMap) return;
	templateToGrammarMap = new Map();
	const units = typeof KR_EN_languageUnits !== 'undefined' ? KR_EN_languageUnits : dataModule.KR_EN_languageUnits;
	if (!units) return;
	units.filter(u => u[DATA_SCHEMA.PartofSpeech] === "Grammar").forEach(u => {
		const formulas = u[DATA_SCHEMA.Conjugation];
		if (Array.isArray(formulas)) {
			formulas.forEach((f, idx) => {
				if (!templateToGrammarMap.has(f)) {
					templateToGrammarMap.set(f, { grammarUnit: u, formulaIndex: idx });
				}
			});
		}
	});
}

function findGrammarUnitForTemplate(template) {
	initTemplateToGrammarMap();
	return templateToGrammarMap ? templateToGrammarMap.get(template) : null;
}

function expandSemanticClause(depth, currentContext) {
	const KoreanWord = DATA_SCHEMA.Korean;
	const Conjugation = DATA_SCHEMA.Conjugation;

	let grammars = getFilteredWords("Grammar").filter(g => {
		const sv = parseSemanticVector(g);
		return hasTag(g, "declarative") && (sv.logic === "declarative" || g[KoreanWord].includes("아요") || g[KoreanWord].includes("습니다"));
	});
	if (grammars.length === 0) grammars = getFilteredWords("Grammar").filter(g => hasTag(g, "declarative"));
	if (grammars.length === 0) grammars = getFilteredWords("Grammar");

	const grammar = getRandom(grammars);
	if (grammar) {
		markUnitUsed(grammar);
		const sub = generateSemanticSentence(getRandom(grammar[Conjugation]), depth + 1, currentContext);
		return { text: sub.ko, tree: sub.tree };
	}
	return { text: "좋아요", tree: "좋아요" };
}

function expandSemanticTerminal(tokenType, tag, currentContext, applyConstraint) {
	if (tokenType === "Name" || tag === "name" || tag === "properName") {
		return { text: getRandomProperName(), unit: null };
	}
	if (tokenType === "properNoun") {
		const seeGrammar = getFilteredWords("Grammar").find(g => g[DATA_SCHEMA.Korean] === "씨") || getWords("Grammar").find(g => g[DATA_SCHEMA.Korean] === "씨");
		return { text: getRandomProperName() + "씨", unit: seeGrammar || null };
	}

	let posToFetch = "Noun";
	if (tokenType === "Number") posToFetch = "Number";
	else if (tokenType === "Adv") posToFetch = "Adverb";
	else if (tokenType === "Exclamation") posToFetch = "Exclamation";

	let words = getFilteredWords(posToFetch, tag);
	if (applyConstraint && currentContext.logic === "cause_effect" && currentContext.produced_state) {
		const domainWords = words.filter(w => parseSemanticVector(w).domain);
		if (domainWords.length > 0) words = domainWords;
	}

	const chosen = getRandom(words);
	if (chosen) {
		markUnitUsed(chosen);
		return { text: chosen[DATA_SCHEMA.Korean], unit: chosen };
	}
	return { text: "N/A", unit: null };
}

function generateSemanticSentence(templateOrUnit, depth = 0, incomingContext = {}) {
	if (depth > 2) return { ko: "좋아요", context: {}, tree: "좋아요" };

	let template = "", grammarId = null;
	const units = typeof KR_EN_languageUnits !== 'undefined' ? KR_EN_languageUnits : dataModule.KR_EN_languageUnits;

	if (typeof templateOrUnit === 'number') {
		const gu = units ? units[templateOrUnit] : null;
		if (gu) {
			grammarId = gu[DATA_SCHEMA.Id];
			template = getRandom(gu[DATA_SCHEMA.Conjugation]) || "";
		} else {
			template = String(templateOrUnit);
			grammarId = template;
		}
	} else if (Array.isArray(templateOrUnit) && typeof templateOrUnit[DATA_SCHEMA.Id] === 'number') {
		grammarId = templateOrUnit[DATA_SCHEMA.Id];
		template = getRandom(templateOrUnit[DATA_SCHEMA.Conjugation]) || "";
	} else if (typeof templateOrUnit === 'string') {
		template = templateOrUnit;
		const match = findGrammarUnitForTemplate(template);
		if (match && match.grammarUnit) {
			const gu = match.grammarUnit;
			const formulas = gu[DATA_SCHEMA.Conjugation] || [];
			if (formulas.length > 1 && match.formulaIndex > 0) {
				const sigs = formulas.map(f => (f.match(/\{[^}]+\}/g) || []).join(','));
				grammarId = sigs[match.formulaIndex] === sigs[0] ? template : gu[DATA_SCHEMA.Id];
			} else {
				grammarId = gu[DATA_SCHEMA.Id];
			}
		} else {
			grammarId = template;
		}
	} else {
		template = String(templateOrUnit);
		grammarId = template;
	}

	let koResult = template;
	let currentContext = { ...incomingContext };
	const childrenTree = [];
	const tokenRegex = /\{([^}:]+)(?::([^}]+))?\}/g;
	let match;

	while ((match = tokenRegex.exec(koResult)) !== null) {
		const token = match[0], tokenType = match[1], tag = match[2];
		const applyConstraint = shouldApplySemanticConstraint(currentContext);
		let replacementKo = "", childNode = null;
		const afterToken = koResult.substring(match.index + token.length);
		const isProperName = tokenType === "Name" || tag === "properName" || tag === "name" || (tokenType === "N" && (afterToken.startsWith("씨") || afterToken.startsWith(" 씨")));

		if (isProperName) {
			replacementKo = getRandomProperName();
			childNode = replacementKo;
		} else if (tokenType === "properNoun") {
			const seeGrammar = getFilteredWords("Grammar").find(g => g[DATA_SCHEMA.Korean] === "씨") || getWords("Grammar").find(g => g[DATA_SCHEMA.Korean] === "씨");
			const name = getRandomProperName();
			replacementKo = name + "씨";
			childNode = seeGrammar ? [seeGrammar[DATA_SCHEMA.Id], name] : replacementKo;
		} else if (tokenType === "VP_AVst" || tokenType === "AVst" || tokenType === "VP_DVst" || tokenType === "DVst") {
			const isAction = tokenType.includes("AVst");
			const exp = isAction
				? expandSemanticActionVerb(tokenType, currentContext, applyConstraint)
				: expandSemanticDescriptiveVerb(tokenType, currentContext, applyConstraint);
			replacementKo = exp.text;
			if (exp.verb) {
				childNode = exp.noun
					? [exp.verb[DATA_SCHEMA.Id], typeof exp.noun[DATA_SCHEMA.Id] === 'number' ? exp.noun[DATA_SCHEMA.Id] : exp.noun[DATA_SCHEMA.Korean]]
					: exp.verb[DATA_SCHEMA.Id];
			} else {
				childNode = replacementKo;
			}
		} else if (tokenType === "Clause" || tokenType === "VP") {
			const exp = expandSemanticClause(depth, currentContext);
			replacementKo = exp.text;
			childNode = exp.tree;
		} else if (tokenType === "Number" && tag && tag.includes("(")) {
			const rangeMatch = tag.match(/^([a-zA-Z_]+)\((\d+)\s*,\s*(\d+)\)$/);
			if (rangeMatch) {
				const baseTag = rangeMatch[1];
				const min = parseInt(rangeMatch[2], 10), max = parseInt(rangeMatch[3], 10);
				const val = Math.floor(Math.random() * (max - min + 1)) + min;
				const isFollowedByMeasureWord = /^\s*\{(?:Noun|N):.*measureWord/i.test(afterToken) || /^\s*[가-힣]/.test(afterToken);
				replacementKo = (baseTag === "sinoNumber") ? getSinoNumber(val) : getKoreanNumber(val, isFollowedByMeasureWord);
				const words = getFilteredWords("Number", baseTag);
				const matchedUnit = words.find(w => w[DATA_SCHEMA.Korean] === replacementKo);
				if (matchedUnit) {
					markUnitUsed(matchedUnit);
					childNode = matchedUnit[DATA_SCHEMA.Id];
				} else {
					childNode = replacementKo;
				}
			} else {
				const exp = expandSemanticTerminal(tokenType, tag, currentContext, applyConstraint);
				replacementKo = exp.text;
				childNode = exp.unit ? exp.unit[DATA_SCHEMA.Id] : replacementKo;
			}
		} else {
			const exp = expandSemanticTerminal(tokenType, tag, currentContext, applyConstraint);
			replacementKo = exp.text;
			childNode = exp.unit ? exp.unit[DATA_SCHEMA.Id] : replacementKo;
		}

		childrenTree.push(childNode);
		koResult = koResult.replace(token, replacementKo || "N/A");
		tokenRegex.lastIndex = 0;
	}

	return { ko: koResult, context: currentContext, tree: [grammarId, ...childrenTree] };
}

// =========================================================================
// 7. Language Unit Tree (LUT) Reconstruction & Serialization
// =========================================================================
function reconstructFromLanguageUnitTree(tree) {
	if (tree === null || tree === undefined) return "";
	if (typeof tree === 'string') return tree;
	const units = typeof KR_EN_languageUnits !== 'undefined' ? KR_EN_languageUnits : dataModule.KR_EN_languageUnits;
	if (typeof tree === 'number') {
		const u = units ? units[tree] : null;
		return u ? u[DATA_SCHEMA.Korean] : String(tree);
	}
	if (!Array.isArray(tree) || tree.length === 0) return "";

	const grammarRef = tree[0];
	const children = tree.slice(1);
	let template = "";

	if (typeof grammarRef === 'number') {
		const grammarUnit = units ? units[grammarRef] : null;
		if (grammarUnit && Array.isArray(grammarUnit[DATA_SCHEMA.Conjugation])) {
			const formulas = grammarUnit[DATA_SCHEMA.Conjugation];
			if (formulas.length === 1) {
				template = formulas[0];
			} else {
				const candidate = formulas.find(f => {
					const tokens = f.match(/\{[^}:]+(?::[^}]+)?\}/g) || [];
					if (tokens.length !== children.length) return false;
					for (let i = 0; i < tokens.length; i++) {
						const m = tokens[i].match(/^\{([^}:]+)/);
						if (!m) continue;
						const type = m[1], child = children[i];
						if (type === 'Clause' && !Array.isArray(child)) return false;
						const unitId = typeof child === 'number' ? child : (Array.isArray(child) && typeof child[0] === 'number' ? child[0] : null);
						const u = (unitId !== null && units) ? units[unitId] : null;
						if (type === 'Adv' && u && u[DATA_SCHEMA.PartofSpeech] !== 'Adverb') return false;
						if (type === 'VP_AVst' && u && u[DATA_SCHEMA.PartofSpeech] === 'Adverb') return false;
					}
					return true;
				});

				if (candidate) {
					template = candidate;
				} else {
					const firstChild = children[0];
					const firstId = typeof firstChild === 'number' ? firstChild : (Array.isArray(firstChild) && typeof firstChild[0] === 'number' ? firstChild[0] : null);
					const u = (firstId !== null && units) ? units[firstId] : null;
					const isAV = u && u[DATA_SCHEMA.PartofSpeech] === 'Action Verb';
					const isDV = u && u[DATA_SCHEMA.PartofSpeech] === 'Descriptive Verb';
					template = isAV ? (formulas.find(f => f.includes('AVst')) || formulas[0])
						: isDV ? (formulas.find(f => f.includes('DVst')) || formulas[0])
							: formulas[0];
				}
			}
		} else {
			template = String(grammarRef);
		}
	} else {
		template = String(grammarRef);
	}

	let koResult = template;
	const tokenRegex = /\{([^}:]+)(?::([^}]+))?\}/g;
	let match, childIndex = 0;

	while ((match = tokenRegex.exec(koResult)) !== null) {
		const token = match[0], tokenType = match[1];
		const child = children[childIndex++];
		let replacement = "";

		if (tokenType === "VP_AVst" || tokenType === "AVst" || tokenType === "VP_DVst" || tokenType === "DVst") {
			const isAction = tokenType.includes("AVst");
			const verbId = Array.isArray(child) ? child[0] : (typeof child === 'number' ? child : null);
			const nounId = (Array.isArray(child) && child.length > 1) ? child[1] : null;
			const verb = (verbId !== null && units) ? units[verbId] : null;
			const noun = (nounId !== null && units && typeof nounId === 'number') ? units[nounId] : (typeof nounId === 'string' ? nounId : null);

			if (verb) {
				let stem = getStem(verb[DATA_SCHEMA.Korean]);
				const conj = verb[DATA_SCHEMA.Conjugation];
				if (conj && conj !== "regular" && conj !== "") stem += `[${conj}]`;
				if (tokenType === "AVst" || tokenType === "DVst") {
					replacement = stem;
				} else {
					const phrase = isAction ? buildActionVerbPhrase(verb, stem, noun) : buildDescriptiveVerbPhrase(verb, stem, noun);
					replacement = phrase.text;
				}
			} else {
				replacement = typeof child === 'string' ? child : "N/A";
			}
		} else if (tokenType === "Clause" || tokenType === "VP") {
			replacement = reconstructFromLanguageUnitTree(child);
		} else {
			if (typeof child === 'number' && units && units[child]) {
				replacement = units[child][DATA_SCHEMA.Korean];
			} else if (Array.isArray(child) && child.length === 1 && typeof child[0] === 'number' && units && units[child[0]]) {
				replacement = units[child[0]][DATA_SCHEMA.Korean];
			} else {
				replacement = String(child || "N/A");
			}
		}

		koResult = koResult.replace(token, replacement || "N/A");
		tokenRegex.lastIndex = 0;
	}
	return koResult;
}

function flattenLanguageUnitTree(tree) {
	const ids = new Set();
	function traverse(node) {
		if (node === null || node === undefined) return;
		if (typeof node === 'number') { ids.add(node); return; }
		if (Array.isArray(node)) {
			for (let item of node) {
				if (typeof item === 'number') ids.add(item);
				else if (Array.isArray(item)) traverse(item);
			}
		}
	}
	traverse(tree);
	return Array.from(ids).sort((a, b) => a - b);
}

function encodeLanguageUnitIds(idsOrTree) {
	let ids = [];
	if (Array.isArray(idsOrTree) && idsOrTree.some(x => Array.isArray(x) || typeof x === 'string')) {
		ids = flattenLanguageUnitTree(idsOrTree);
	} else if (Array.isArray(idsOrTree)) {
		ids = Array.from(new Set(idsOrTree)).filter(x => typeof x === 'number').sort((a, b) => a - b);
	} else if (typeof idsOrTree === 'number') {
		ids = [idsOrTree];
	}

	const u16 = new Uint16Array(ids);
	const bytes = new Uint8Array(u16.buffer, u16.byteOffset, u16.byteLength);

	if (typeof Buffer !== 'undefined') {
		return Buffer.from(bytes).toString('base64url');
	}
	let binary = '';
	for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeLanguageUnitIds(token) {
	if (!token || typeof token !== 'string') return [];
	let b64 = token.replace(/-/g, '+').replace(/_/g, '/');
	while (b64.length % 4) b64 += '=';

	let bytes;
	if (typeof Buffer !== 'undefined') {
		bytes = new Uint8Array(Buffer.from(b64, 'base64'));
	} else {
		const binary = atob(b64);
		bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	}

	const count = Math.floor(bytes.byteLength / 2);
	const u16 = new Uint16Array(bytes.buffer, bytes.byteOffset, count);
	return Array.from(u16);
}

// =========================================================================
// 8. Korean Morphology Engine
// =========================================================================
const PARTICLE_PAIRS = {
	"이/가": ["이", "가"], "은/는": ["은", "는"], "을/를": ["을", "를"], "(이)랑": ["이랑", "랑"],
	"(이)나": ["이나", "나"], "이/나": ["이나", "나"], "(이)라서": ["이라서", "라서"], "이/라서": ["이라서", "라서"],
	"(이)라도": ["이라도", "라도"], "이/라도": ["이라도", "라도"], "(이)든지": ["이든지", "든지"], "이/든지": ["이든지", "든지"],
	"과/와": ["과", "와"], "와/과": ["과", "와"]
};

const PRONOUN_REPLACEMENTS = [
	[/누가가/g, '누가'], [/누가를/g, '누구를'], [/누가에게/g, '누구에게'],
	[/누가는/g, '누구는'], [/누가도/g, '누구도'], [/뭘을/g, '뭘'],
	[/(^|[^가-힣])저가([^가-힣]|$)/g, '$1제가$2'],
	[/(^|[^가-힣])누구가([^가-힣]|$)/g, '$1누가$2']
];

function applyMorphology(text) {
	let resolvedKo = text;

	// Irregular Verbs
	// 1. b_irregular
	resolvedKo = resolvedKo.replace(/([가-힣])\[b_irregular\]으\/(니까|면|면서|러|려고|려면|세|시|셔|십|로|라고|ㄹ|ㄴ)/g, (_, ch, s) => {
		const base = setFinal(ch, 0);
		return s === 'ㄴ' ? base + '운' : s === 'ㄹ' ? base + '울' : base + '우' + s;
	});
	resolvedKo = resolvedKo.replace(/([가-힣])\[b_irregular\](아\/어|았\/었)(요|서|어|도|야|라|던|)/g, (_, ch, h, s) => {
		const base = setFinal(ch, 0);
		const isW = (ch === '돕' || ch === '곱');
		const added = (h === "았/었") ? (isW ? "왔" : "웠") : (isW ? "와" : "워");
		return base + added + s;
	});

	// 2. l_irregular
	resolvedKo = resolvedKo.replace(/([가-힣])\[l_irregular\]으\/(니까|면|면서|러|려고|려면|세|시|셔|십|로|라고|ㄹ|ㄴ)/g, (_, ch, s) => {
		if (s === 'ㄴ') return setFinal(ch, 4);
		if (s === 'ㄹ') return ch;
		if (/^(면|면서|러|려고|려면|로|라고)$/.test(s)) return ch + s;
		return setFinal(ch, 0) + s;
	});
	resolvedKo = resolvedKo.replace(/([가-힣])\[l_irregular\](는|나|니|냐)/g, (_, ch, s) => setFinal(ch, 0) + s);
	resolvedKo = resolvedKo.replace(/([가-힣])\[l_irregular\]습니다\/ㅂ니다/g, (_, ch) => setFinal(ch, 17) + "니다");

	// 3. d_irregular
	resolvedKo = resolvedKo.replace(/([가-힣])\[d_irregular\]으\/(니까|면|면서|러|려고|려면|세|시|셔|십|로|라고|ㄹ|ㄴ)/g, (_, ch, s) => {
		const withL = setFinal(ch, 8);
		return s === 'ㄴ' ? withL + '은' : s === 'ㄹ' ? withL + '을' : withL + '으' + s;
	});
	resolvedKo = resolvedKo.replace(/([가-힣])\[d_irregular\](아\/어|았\/었)(요|서|어|도|야|라|던|)/g, (_, ch, h, s) => setFinal(ch, 8) + h + s);

	// 4. eu_irregular
	resolvedKo = resolvedKo.replace(/([가-힣])\[eu_irregular\](아\/어|았\/었)(요|서|어|도|야|라|던|)/g, (match, ch, h, s) => {
		const idx = resolvedKo.indexOf(match);
		const prevVowel = idx > 0 ? getVowelHarmony(resolvedKo[idx - 1]) : '어';
		const d = decomposeHangul(ch);
		return composeHangul(d.initial, prevVowel === '아' ? 0 : 4, h === "았/었" ? 20 : 0) + s;
	});

	// 5. reu_irregular & reo_irregular
	resolvedKo = resolvedKo.replace(/([가-힣])르\[reu_irregular\](아\/어|았\/었)(요|서|어|도|야|라|던|)/g, (_, pre, h, s) => {
		const prevVowel = getVowelHarmony(pre);
		return setFinal(pre, 8) + composeHangul(5, prevVowel === '아' ? 0 : 4, h === "았/었" ? 20 : 0) + s;
	});
	resolvedKo = resolvedKo.replace(/([가-힣])르\[reo_irregular\](아\/어|았\/었)(요|서|어|도|야|라|던|)/g, (_, pre, h, s) => {
		return pre + "르" + (h === "았/었" ? "렀" : "러") + s;
	});

	// 6. h_irregular
	resolvedKo = resolvedKo.replace(/([가-힣])\[h_irregular\]으\/(니까|면|면서|러|려고|려면|세|시|셔|십|로|라고|ㄹ|ㄴ)/g, (_, ch, s) => {
		const base = setFinal(ch, 0);
		return s === 'ㄴ' ? setFinal(base, 4) : s === 'ㄹ' ? setFinal(base, 8) : base + s;
	});
	resolvedKo = resolvedKo.replace(/([가-힣])\[h_irregular\](아\/어|았\/었)(요|서|어|도|야|라|던|)/g, (_, ch, h, s) => {
		return composeHangul(decomposeHangul(ch).initial, 1, h === "았/었" ? 20 : 0) + s;
	});

	// 7. s_irregular
	resolvedKo = resolvedKo.replace(/([가-힣])\[s_irregular\]으\/(니까|면|면서|러|려고|려면|세|시|셔|십|로|라고|ㄹ|ㄴ)/g, (_, ch, s) => {
		const base = setFinal(ch, 0);
		return s === 'ㄴ' ? base + '은' : s === 'ㄹ' ? base + '을' : base + '으' + s;
	});
	resolvedKo = resolvedKo.replace(/([가-힣])\[s_irregular\](아\/어|았\/었)(요|서|어|도|야|라|던|)/g, (_, ch, h, s) => {
		const base = setFinal(ch, 0);
		const hv = getVowelHarmony(base);
		return base + '\u200B' + (h === "았/었" ? (hv === '아' ? '았' : '었') : hv) + s;
	});

	// Strip leftover conjugation markers
	resolvedKo = resolvedKo.replace(/\[[a-z_]+\]/g, '');

	// Resolve particles based on previous character's batchim
	resolvedKo = resolvedKo.replace(/([가-힣])(이\/가|은\/는|을\/를|\(이\)랑|\(이\)나|이\/나|\(이\)라서|이\/라서|\(이\)라도|이\/라도|\(이\)든지|이\/든지|과\/와|와\/과)/g, (_, ch, p) => {
		const pair = PARTICLE_PAIRS[p];
		return ch + (pair ? (hasBatchim(ch) ? pair[0] : pair[1]) : p);
	});

	// Resolve contracted pronouns
	PRONOUN_REPLACEMENTS.forEach(([pat, rep]) => { resolvedKo = resolvedKo.replace(pat, rep); });

	// Resolve 이/예요 based on batchim
	resolvedKo = resolvedKo.replace(/([가-힣])이\/예요/g, (_, ch) => ch + (hasBatchim(ch) ? '이에요' : '예요'));

	// Resolve 습니다/ㅂ니다 based on batchim
	resolvedKo = resolvedKo.replace(/([가-힣])(습니다\/ㅂ니다|습니다|ㅂ니다)/g, (_, ch, ending) => {
		if (ending === "습니다/ㅂ니다") {
			const d = decomposeHangul(ch);
			if (d && d.final !== 0) {
				return d.final === 8 ? setFinal(ch, 17) + "니다" : ch + "습니다";
			}
			return setFinal(ch, 17) + "니다";
		}
		return ch + ending;
	});

	// Resolve 아/어/았/었 vowel harmony
	resolvedKo = resolvedKo.replace(/([가-힣])(아\/어|았\/었)(요|서|어|도|야|라|던|)/g, (_, ch, h, s) => {
		const hv = getVowelHarmony(ch);
		if (h === "았/었") {
			return ch + (hv === '여' ? '였' : hv === '아' ? '았' : '었') + s;
		}
		return ch + hv + s;
	});

	// Resolve 으 insertion
	resolvedKo = resolvedKo.replace(/([가-힣])으\/(니까|면|면서|러|려고|려면|세|시|셔|십|로|라고)/g, (_, ch, s) => {
		const d = decomposeHangul(ch);
		return ch + (d && d.final !== 0 && d.final !== 8 ? '으' : '') + s;
	});

	// Resolve (으)로 based on batchim
	resolvedKo = resolvedKo.replace(/([가-힣])\(으\)로/g, (_, ch) => {
		const d = decomposeHangul(ch);
		return ch + (d && d.final !== 0 && d.final !== 8 ? '으로' : '로');
	});

	// Resolve 으/ㄹ
	resolvedKo = resolvedKo.replace(/([가-힣])으\/ㄹ/g, (_, ch) => {
		const d = decomposeHangul(ch);
		if (d && d.final !== 0) return d.final === 8 ? ch : ch + '을';
		return setFinal(ch, 8);
	});

	// Resolve 으/ㄴ
	resolvedKo = resolvedKo.replace(/([가-힣])으\/ㄴ/g, (_, ch) => {
		const d = decomposeHangul(ch);
		if (d && d.final !== 0) return d.final === 8 ? setFinal(ch, 4) : ch + '은';
		return setFinal(ch, 4);
	});

	// Resolve (느)ㄴ다(고)
	resolvedKo = resolvedKo.replace(/([가-힣])(?:느\/ㄴ다|\(느\)ㄴ다)(고|)/g, (_, ch, quote) => {
		const q = quote || '';
		const d = decomposeHangul(ch);
		if (d && d.final !== 0) return (d.final === 8 ? setFinal(ch, 4) : ch + '는') + '다' + q;
		return setFinal(ch, 4) + '다' + q;
	});

	// Basic Vowel Contractions
	resolvedKo = resolvedKo.replace(/([가-힣])아(요|서|도|야|라|)/g, (m, ch, s) => {
		const d = decomposeHangul(ch);
		if (!d || d.final !== 0) return m;
		if (d.medial === 0) return ch + s; // ㅏ
		if (d.medial === 8) return composeHangul(d.initial, 9, 0) + s; // ㅗ -> ㅘ
		return m;
	});

	resolvedKo = resolvedKo.replace(/([가-힣])았(어요|어|다가|던)/g, (m, ch, s) => {
		const d = decomposeHangul(ch);
		if (!d || d.final !== 0) return m;
		if (d.medial === 0) return composeHangul(d.initial, 0, 20) + s; // ㅏ -> 았
		if (d.medial === 8) return composeHangul(d.initial, 9, 20) + s; // ㅗ -> 왔
		return m;
	});

	resolvedKo = resolvedKo.replace(/오아(요|서|도|야|라)/g, (m, s) => "와" + s);
	resolvedKo = resolvedKo.replace(/오았(어요|어|다가|던)/g, (m, s) => "왔" + s);
	resolvedKo = resolvedKo.replace(/하여(요|서|도|야|라|지|져|졌)/g, (m, s) => "해" + s);
	resolvedKo = resolvedKo.replace(/하였(어요|어|다가|던)/g, (m, s) => "했" + s);
	resolvedKo = resolvedKo.replace(/마시(아|어)(요|서|도|야|라)/g, (m, v, s) => "마셔" + s);
	resolvedKo = resolvedKo.replace(/크(아|어)(요|서|도|야|라)/g, (m, v, s) => "커" + s);
	resolvedKo = resolvedKo.replace(/이어요/g, "이에요");

	resolvedKo = resolvedKo.replace(/([가-힣])어(요|서|도|야|라|지|져|졌)/g, (m, ch, s) => {
		const d = decomposeHangul(ch);
		if (!d || d.final !== 0) return m;
		if (d.medial === 20) return composeHangul(d.initial, 6, 0) + s; // ㅣ -> ㅕ
		if (d.medial === 13) return composeHangul(d.initial, 14, 0) + s; // ㅜ -> ㅝ
		if ([1, 4, 5, 6].includes(d.medial)) return ch + s; // ㅐ, ㅓ, ㅔ, ㅕ
		return m;
	});

	resolvedKo = resolvedKo.replace(/([가-힣])었(어요|어|다가|던)/g, (m, ch, s) => {
		const d = decomposeHangul(ch);
		if (!d || d.final !== 0) return m;
		if (d.medial === 20) return composeHangul(d.initial, 6, 20) + s; // ㅣ -> 였
		if (d.medial === 13) return composeHangul(d.initial, 14, 20) + s; // ㅜ -> 웠
		if ([1, 4, 5, 6].includes(d.medial)) return composeHangul(d.initial, d.medial, 20) + s;
		return m;
	});

	resolvedKo = resolvedKo.replace(/\u200B/g, '');
	return resolvedKo;
}

// =========================================================================
// 9. Standard Korean Pronunciation (표준 발음법) Engine
// =========================================================================
const FINAL_TO_INITIAL = { 1: 0, 2: 1, 4: 2, 7: 3, 8: 5, 16: 6, 17: 7, 19: 9, 20: 10, 22: 12, 23: 14, 24: 15, 25: 16, 26: 17 };
const TENSIFY_INITIAL = { 0: 1, 3: 4, 7: 8, 9: 10, 12: 13 };
const NASAL_VERB_ROOTS = new Set(['신', '안', '앉', '삼', '젊', '닮', '감', '품', '숨', '넘']);
const DOUBLE_CODA_LIAISON = {
	3: [1, 10], 5: [4, 12], 6: [0, 2], 9: [8, 0], 10: [8, 6],
	11: [8, 7], 12: [8, 10], 13: [8, 16], 14: [8, 17], 15: [0, 5], 18: [17, 10]
};
const DOUBLE_CODA_SIMPLIFY = { 3: 1, 5: 4, 6: 4, 10: 16, 12: 8, 13: 8, 14: 17, 15: 8, 18: 17 };
const H_ONSET_MAP = {
	1: [0, 15], 2: [0, 15], 3: [0, 15], 24: [0, 15], 9: [8, 15],
	7: [0, 16], 19: [0, 16], 20: [0, 16], 25: [0, 16],
	22: [0, 14], 23: [0, 14], 5: [4, 14],
	17: [0, 17], 14: [0, 17], 18: [0, 17], 26: [0, 17], 11: [8, 17]
};
const NASAL_CODA = { 1: 21, 7: 4, 17: 16 };

function getPronunciationWord(word) {
	const chars = [];
	const hangulIndices = [];
	for (let i = 0; i < word.length; i++) {
		const d = decomposeHangul(word[i]);
		if (d) { chars.push(d); hangulIndices.push(chars.length - 1); }
		else { chars.push(word[i]); }
	}
	if (hangulIndices.length === 0) return word;

	const H = hangulIndices.map(idx => chars[idx]);
	const originalSyllables = hangulIndices.map(idx => word[idx]);

	// Pass 1: Consonant + ㅢ -> ㅣ
	for (let i = 0; i < H.length; i++) {
		if (H[i].initial !== 11 && H[i].medial === 19) H[i].medial = 20;
	}

	// Pass 2: Palatalization
	for (let i = 0; i < H.length - 1; i++) {
		const cur = H[i], next = H[i + 1];
		if (next.initial === 11 && (next.medial === 20 || next.medial === 6)) {
			if (cur.final === 7) { cur.final = 0; next.initial = 12; }
			else if (cur.final === 25) { cur.final = 0; next.initial = 14; }
			else if (cur.final === 13) { cur.final = 8; next.initial = 14; }
		} else if (next.initial === 18 && (next.medial === 20 || next.medial === 6) && cur.final === 7) {
			cur.final = 0; next.initial = 14;
		}
	}

	// Pass 3: ㅎ assimilation & merging
	for (let i = 0; i < H.length - 1; i++) {
		const cur = H[i], next = H[i + 1];
		if (cur.final === 27 || cur.final === 6 || cur.final === 15) {
			const isH = cur.final === 27, isNh = cur.final === 6;
			const baseFinal = isH ? 0 : (isNh ? 4 : 8);
			if (next.initial === 11) {
				cur.final = 0;
				if (!isH) next.initial = isNh ? 2 : 5;
			} else if (next.initial === 0) { cur.final = baseFinal; next.initial = 15; }
			else if (next.initial === 3) { cur.final = baseFinal; next.initial = 16; }
			else if (next.initial === 12) { cur.final = baseFinal; next.initial = 14; }
			else if (next.initial === 9) { cur.final = baseFinal; next.initial = 10; }
			else if (next.initial === 2) {
				cur.final = isH ? 4 : baseFinal;
				if (!isH && !isNh) next.initial = 5;
			}
		} else if (next.initial === 18 && H_ONSET_MAP[cur.final]) {
			[cur.final, next.initial] = H_ONSET_MAP[cur.final];
		}
	}

	// Pass 4: ㅅ/ㅆ coda before ㅅ onset
	for (let i = 0; i < H.length - 1; i++) {
		const cur = H[i], next = H[i + 1];
		if ((cur.final === 19 || cur.final === 20) && next.initial === 9) {
			cur.final = 0; next.initial = 10;
		} else if (cur.final === 18 && next.initial === 9) {
			cur.final = 17; next.initial = 10;
		}
	}

	// Pass 5: Liaison
	for (let i = 0; i < H.length - 1; i++) {
		const cur = H[i], next = H[i + 1];
		if (cur.final > 0 && cur.final !== 21 && next.initial === 11) {
			if (FINAL_TO_INITIAL[cur.final] !== undefined) {
				next.initial = FINAL_TO_INITIAL[cur.final];
				cur.final = 0;
			} else if (DOUBLE_CODA_LIAISON[cur.final]) {
				[cur.final, next.initial] = DOUBLE_CODA_LIAISON[cur.final];
			}
		}
	}

	// Pass 6: Coda Simplification / Neutralization
	for (let i = 0; i < H.length; i++) {
		const cur = H[i], next = (i < H.length - 1) ? H[i + 1] : null;
		if (cur.final > 0) {
			if (DOUBLE_CODA_SIMPLIFY[cur.final]) {
				cur.final = DOUBLE_CODA_SIMPLIFY[cur.final];
			} else if (cur.final === 11) {
				cur.final = originalSyllables[i] === '밟' ? 17 : 8;
			} else if (cur.final === 9) {
				cur.final = (next && next.initial === 0) ? 8 : 1;
			}

			if (cur.final === 2 || cur.final === 24) cur.final = 1;
			else if ([19, 20, 22, 23, 25, 27].includes(cur.final)) cur.final = 7;
			else if (cur.final === 26) cur.final = 17;
		}
	}

	// Pass 7: Tensification
	for (let i = 0; i < H.length - 1; i++) {
		const cur = H[i], next = H[i + 1];
		if (cur.final === 1 || cur.final === 7 || cur.final === 17) {
			if (TENSIFY_INITIAL[next.initial] !== undefined) next.initial = TENSIFY_INITIAL[next.initial];
		} else if ((cur.final === 4 || cur.final === 16) && NASAL_VERB_ROOTS.has(originalSyllables[i])) {
			const nextOrig = decomposeHangul(originalSyllables[i + 1]);
			if (nextOrig && nextOrig.initial !== 11 && TENSIFY_INITIAL[next.initial] !== undefined) {
				next.initial = TENSIFY_INITIAL[next.initial];
			}
		} else if (cur.final === 8) {
			if (next.initial === 0 && next.medial === 4) next.initial = 1;
			else if (next.initial === 9 && next.medial === 13) next.initial = 10;
			else if (next.initial === 12 && next.medial === 13) next.initial = 13;
		}
	}

	// Pass 8: Nasalization
	for (let i = 0; i < H.length - 1; i++) {
		const cur = H[i], next = H[i + 1];
		if (next.initial === 5) {
			if (cur.final === 16 || cur.final === 21) next.initial = 2;
			else if (NASAL_CODA[cur.final]) { cur.final = NASAL_CODA[cur.final]; next.initial = 2; }
		}
		if ((next.initial === 2 || next.initial === 6) && NASAL_CODA[cur.final]) {
			cur.final = NASAL_CODA[cur.final];
		}
	}

	// Pass 9: Lateralization
	for (let i = 0; i < H.length - 1; i++) {
		const cur = H[i], next = H[i + 1];
		if (cur.final === 4 && next.initial === 5) cur.final = 8;
		else if (cur.final === 8 && next.initial === 2) next.initial = 5;
	}

	for (let i = 0; i < hangulIndices.length; i++) {
		chars[hangulIndices[i]] = composeHangul(H[i].initial, H[i].medial, H[i].final);
	}
	return chars.join('');
}

function getPronunciation(text) {
	if (!text || typeof text !== 'string') return text;
	return text.replace(/([가-힣]+)/g, m => getPronunciationWord(m));
}

// =========================================================================
// 10. Module Exports
// =========================================================================
const exportedMembers = {
	hasBatchim,
	getStem,
	getVowelHarmony,
	applyMorphology,
	decomposeHangul,
	composeHangul,
	setFinal,
	getPronunciationWord,
	getPronunciation,
	getFilteredWords,
	setCurrentUsageFilter,
	getTokenOptions,
	generateTemplateOptions,
	generateTemplateTokenOptions,
	getTotalOptionsCut,
	resetTotalOptionsCut,
	markUnitUsed,
	getUsedUnitIds,
	resetUsedUnits,
	hasTag,
	getRandom,
	parseSemanticVector,
	SemanticConfig,
	shouldApplySemanticConstraint,
	findGrammarUnitForTemplate,
	initTemplateToGrammarMap,
	buildActionVerbPhrase,
	buildDescriptiveVerbPhrase,
	expandSemanticActionVerb,
	expandSemanticDescriptiveVerb,
	expandSemanticClause,
	expandSemanticTerminal,
	generateSemanticSentence,
	reconstructFromLanguageUnitTree,
	flattenLanguageUnitTree,
	encodeLanguageUnitIds,
	decodeLanguageUnitIds,
	properNames,
	getProperNames,
	setProperNames,
	getRandomProperName,
	getSinoNumber,
	getKoreanNumber,
	getNumberTokenOptions,
	KOREAN_NUMBER_VALUES,
	TokenOption,
	deduplicateTokenOptions,
	getConjugatedStem
};

if (typeof window !== 'undefined') {
	Object.assign(window, exportedMembers);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = exportedMembers;
}
