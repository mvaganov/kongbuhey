(function() {
// Universal Constants
const { K } = (typeof require !== 'undefined') ? require('../../constants.js') : (typeof window !== 'undefined' ? window : {});

/**
 * Feature 9: Adverbial Sub-Typing & Syntactic Placement Concord
 *
 * Implements:
 * 1. Adverbial classification (Degree, Manner, Discourse, Negative Polarity Items / NPI).
 * 2. Strict Negative Polarity Item concordance (전혀, 별로, etc. requiring negative predicates).
 * 3. Manner adverb restriction (prohibiting manner adverbs with pure descriptive verbs).
 * 4. Adverbial placement and concord validation and automatic repair.
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
const { DATA_SCHEMA, hasTag } = (typeof require !== 'undefined' ? require('../core/primitives.js') : window);
const { ERROR_CODES } = (typeof require !== 'undefined' ? require('../constants/error_codes.js') : window);
const { isDescriptiveVerb, isActionVerb } = (typeof require !== 'undefined' ? require('../core/morphology.js') : window);

const NPI_NEGATIVE_PREFIX_REPAIRS = [
	["알았", "몰랐"],
	["알아", "몰라"],
	["압니", "모릅니"],
	["알다", "모르다"],
	["알고", "모르고"],
	["알면", "모르면"],
	["있었", "없었"],
	["있어", "없어"],
	["있습니", "없습니"],
	["있다", "없다"],
	["있고", "없고"],
	["있으면", "없으면"]
];

function isDegreeAdverb(wordOrUnit) {
	if (!wordOrUnit) return false;
	const ko = typeof wordOrUnit === 'string' ? wordOrUnit : (Array.isArray(wordOrUnit) ? wordOrUnit[DATA_SCHEMA.Korean] : wordOrUnit.ko || wordOrUnit[DATA_SCHEMA.Korean]);
	return state.DEGREE_ADVERBS.has(ko);
}

function isMannerAdverb(wordOrUnit) {
	if (!wordOrUnit) return false;
	const ko = typeof wordOrUnit === 'string' ? wordOrUnit : (Array.isArray(wordOrUnit) ? wordOrUnit[DATA_SCHEMA.Korean] : wordOrUnit.ko || wordOrUnit[DATA_SCHEMA.Korean]);
	return state.MANNER_ADVERBS.has(ko);
}

function isDiscourseAdverb(wordOrUnit) {
	if (!wordOrUnit) return false;
	const ko = typeof wordOrUnit === 'string' ? wordOrUnit : (Array.isArray(wordOrUnit) ? wordOrUnit[DATA_SCHEMA.Korean] : wordOrUnit.ko || wordOrUnit[DATA_SCHEMA.Korean]);
	return state.DISCOURSE_ADVERBS.has(ko);
}

function isNegativePolarityAdverb(wordOrUnit) {
	if (!wordOrUnit) return false;
	const ko = typeof wordOrUnit === 'string' ? wordOrUnit : (Array.isArray(wordOrUnit) ? wordOrUnit[DATA_SCHEMA.Korean] : wordOrUnit.ko || wordOrUnit[DATA_SCHEMA.Korean]);
	return state.ALL_NPI_WORDS.has(ko);
}

function isNegativePredicate(text) {
	if (!text || typeof text !== 'string') return false;
	if (/(^|[^가-힣])(?:안|못)\s+[가-힣]+(?=[^가-힣]|$)/.test(text)) return true;
	if (/(?:지\s+(?:않|못|말|마)[가-힣]*)/.test(text)) return true;
	if (/(?:몰라(?:요|서|도)?|모릅니다|몰랐(?:어요|습니다)|모른다|모르고|모르면)(?=[^가-힣]|$)/.test(text)) return true;
	if (/(?:없[가-힣]*)(?=[^가-힣]|$)/.test(text)) return true;
	if (/(?:아니(?:에요|요|라|어서|면|었습니다|었어|다))|아닙니다(?=[^가-힣]|$)/.test(text)) return true;
	return false;
}

function canAdverbPrecede(adverbOrKo, verbOrKo, options = {}) {
	const advKo = typeof adverbOrKo === 'string' ? adverbOrKo : (Array.isArray(adverbOrKo) ? adverbOrKo[DATA_SCHEMA.Korean] : adverbOrKo.ko || adverbOrKo[DATA_SCHEMA.Korean]);
	const vKo = typeof verbOrKo === 'string' ? verbOrKo : (Array.isArray(verbOrKo) ? verbOrKo[DATA_SCHEMA.Korean] : verbOrKo.ko || verbOrKo[DATA_SCHEMA.Korean]);
	if (!advKo || !vKo) return true;

	const isDV = isDescriptiveVerb(verbOrKo);
	const isPureDV = isDV && !isActionVerb(verbOrKo);
	const isManner = state.MANNER_ADVERBS.has(advKo);
	const isDegree = state.DEGREE_ADVERBS.has(advKo);
	const isNPI = state.ALL_NPI_WORDS.has(advKo);

	if (isManner && !isDegree && isPureDV) {
		return false;
	}

	if (state.SHORT_INABILITY_WORDS.has(advKo) && isPureDV) {
		return false;
	}

	if (isNPI) {
		const isNeg = options.isNegative || options.negated || isNegativePredicate(vKo);
		if (!isNeg) return false;
	}

	const advSpec = state.ADVERB_CONCORD_SPECS && state.ADVERB_CONCORD_SPECS.get(advKo);
	if (advSpec) {
		const isNeg = Boolean(options.isNegative || options.negated || isNegativePredicate(vKo));
		if (advSpec.forbidNegative && isNeg) return false;
		if (advSpec.requirePluralSubject && options.pluralSubject === false) return false;
		if (advSpec.requirePastTense && options.tense && options.tense !== K.PAST) return false;
		if (advSpec.forbidPastTense && options.tense === K.PAST) return false;
		if (advSpec.denyVerbsSet && advSpec.denyVerbsSet.has(vKo)) return false;
		if (advSpec.allowVerbsSet && !advSpec.allowVerbsSet.has(vKo)) return false;
		if (advSpec.dvAllowAffirmativeSet && (isPureDV || isDV) && !isNeg && !advSpec.dvAllowAffirmativeSet.has(vKo)) return false;
		if (advSpec.allowAffirmativeVerbsSet && !isNeg && !advSpec.allowAffirmativeVerbsSet.has(vKo)) return false;
		if (advSpec.denyAffirmativeVerbsSet && !isNeg && advSpec.denyAffirmativeVerbsSet.has(vKo)) return false;
		if (advSpec.requireInchoative) {
			const isInchoativeVerb = Boolean(
				options.inchoative ||
				vKo.endsWith("아지다") ||
				vKo.endsWith("어지다") ||
				vKo.endsWith("해지다") ||
				(state.INCHOATIVE_VERBS && state.INCHOATIVE_VERBS.has(vKo)) ||
				(Array.isArray(verbOrKo) && hasTag(verbOrKo, "inchoative"))
			);
			if (!isInchoativeVerb) return false;
		}
	}

	return true;
}

function validateAdverbConcord(text, context = {}) {
	const errors = [];
	const errorCodes = [];
	if (!text || typeof text !== 'string') {
		return { valid: true, errors: [], errorCodes: [] };
	}

	// 1. Negative Polarity Items (NPIs): 전혀, 별로, etc.
	for (const npi of state.ALL_NPI_WORDS) {
		const npiRegex = new RegExp(`(^|[^가-힣])${npi}(?=[^가-힣]|$)`, 'g');
		let match;
		while ((match = npiRegex.exec(text)) !== null) {
			const afterNpi = text.substring(match.index + match[0].length);
			if (!isNegativePredicate(afterNpi)) {
				errors.push(`Negative polarity adverb '${npi}' strictly requires a negative predicate in: "${text}"`);
				errorCodes.push(ERROR_CODES.NPI_POSITIVE_PREDICATE);
			}
		}
	}

	// 2. Manner Adverbs paired with Descriptive Verbs
	for (const [mannerKo, info] of state.MANNER_ADVERBS.entries()) {
		if (info.target_pos !== K.ACTION_VERB) continue;
		const mannerRegex = new RegExp(`(^|[^가-힣])${mannerKo}\\s+([가-힣]+)(?:\\[[^\\]]+\\])?(?=[^가-힣]|$)`, 'g');
		let match;
		while ((match = mannerRegex.exec(text)) !== null) {
			const targetWord = match[2];
			const dvUnit = state.DESCRIPTIVE_SURFACE_MAP.get(targetWord);
			if (dvUnit) {
				const dvKo = dvUnit[DATA_SCHEMA.Korean];
				if (isActionVerb(dvKo)) continue;
				errors.push(`Manner adverb '${mannerKo}' cannot modify descriptive verb '${dvKo}' in: "${text}"`);
				errorCodes.push(ERROR_CODES.ADVERB_TARGET_POS_MISMATCH);
			}
		}
	}

	return {
		valid: errors.length === 0,
		errors: Array.from(new Set(errors)),
		errorCodes: Array.from(new Set(errorCodes))
	};
}

function applyAdverbConcord(input, options = {}) {
	if (typeof input === 'object' && input !== null) {
		let text = input.text || "";
		if (text) {
			text = applyAdverbConcord(text, options);
		}
		return { ...input, text };
	}

	let str = String(input);

	// 1. Repair Manner Adverb with Descriptive Verb
	for (const [mannerKo, info] of state.MANNER_ADVERBS.entries()) {
		if (info.target_pos !== K.ACTION_VERB) continue;
		const mannerRegex = new RegExp(`(^|[^가-힣])${mannerKo}\\s+([가-힣]+)(?:\\[[^\\]]+\\])?(?=[^가-힣]|$)`, 'g');
		str = str.replace(mannerRegex, (m, p1, targetWord) => {
			const dvUnit = state.DESCRIPTIVE_SURFACE_MAP.get(targetWord);
			if (dvUnit) {
				const dvKo = dvUnit[DATA_SCHEMA.Korean];
				if (isActionVerb(dvKo)) return m;
				const repAdverb = options.degree_adverb || "아주";
				return `${p1}${repAdverb} ${targetWord}`;
			}
			return m;
		});
	}

	// 2. Repair NPI without negative predicate
	for (const npi of state.ALL_NPI_WORDS) {
		const npiRegex = new RegExp(`(^|[^가-힣])${npi}\\s+([가-힣]+)(?=[^가-힣]|$)`, 'g');
		str = str.replace(npiRegex, (m, p1, targetWord, offset) => {
			if (targetWord === "안" || targetWord === "못" || isNegativePredicate(targetWord)) return m;
			const afterNpi = str.substring(offset + m.length - targetWord.length);
			if (isNegativePredicate(afterNpi)) return m;

			if (options.prefer_affirmative || options.repair_mode === "replace_adverb") {
				const repAdverb = options.affirmative_adverb || "아주";
				return `${p1}${repAdverb} ${targetWord}`;
			}
			for (const [prefix, negPrefix] of NPI_NEGATIVE_PREFIX_REPAIRS) {
				if (targetWord.startsWith(prefix)) {
					return `${p1}${npi} ${negPrefix}${targetWord.slice(prefix.length)}`;
				}
			}
			return `${p1}${npi} 안 ${targetWord}`;
		});
	}

	return str;
}

const adverbExports = {
	isDegreeAdverb,
	isMannerAdverb,
	isDiscourseAdverb,
	isNegativePolarityAdverb,
	isNegativePredicate,
	canAdverbPrecede,
	validateAdverbConcord,
	applyAdverbConcord
};

if (typeof window !== 'undefined') {
	Object.assign(window, adverbExports);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = adverbExports;
}
})();
