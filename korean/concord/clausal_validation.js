// Universal Constants
const { K } = (typeof require !== 'undefined') ? require('../../constants.js') : (typeof window !== 'undefined' ? window : {});

/**
 * Feature 11: Clausal Connective Parsing & Concord Validation
 *
 * Implements:
 * 1. Dynamic connective specification lookup and normalization.
 * 2. Illocutionary speech act mood detection (declarative, interrogative, imperative, propositive, suggestive).
 * 3. Clause-level grammatical tense detection (-았/었/였-).
 * 4. Motion predicate recognition for purpose connectives (-(으)러).
 * 5. Compound sentence clause decomposition (parseSentenceToClauses).
 * 6. Clausal connective harmony validation (canConnectiveJoin, validateClausalConcord).
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
const { DATA_SCHEMA, decomposeHangul, getStem } = (typeof require !== 'undefined' ? require('../core/primitives.js') : window);
const { ERROR_CODES } = (typeof require !== 'undefined' ? require('../constants/error_codes.js') : window);
const { getVerbUnit, isActionVerb, isDescriptiveVerb } = (typeof require !== 'undefined' ? require('../core/morphology.js') : window);

function getConnectiveSpecs(connective) {
	if (!connective) return null;
	if (typeof connective === 'number' || (!isNaN(connective) && typeof connective === 'string' && state.CLAUSAL_CONNECTIVES.has(String(connective)))) {
		return state.CLAUSAL_CONNECTIVES.get(String(connective)) || null;
	}
	if (typeof connective === 'object' && Array.isArray(connective)) {
		const id = connective[DATA_SCHEMA.Id];
		if (state.CLAUSAL_CONNECTIVES.has(String(id))) return state.CLAUSAL_CONNECTIVES.get(String(id));
		const ko = connective[DATA_SCHEMA.Korean];
		return state.CLAUSAL_CONNECTIVES.get(ko) || null;
	}
	const str = String(connective).trim();
	const clean = str.replace(/^[-~]/, "");
	return state.CLAUSAL_CONNECTIVES.get(str) ||
		state.CLAUSAL_CONNECTIVES.get(clean) ||
		state.CLAUSAL_CONNECTIVES.get(`-${clean}`) ||
		state.CLAUSAL_CONNECTIVES.get(`~${clean}`) ||
		null;
}

function isClausalConnective(wordOrUnit) {
	return getConnectiveSpecs(wordOrUnit) !== null;
}

const MOOD_SUFFIX_ENTRIES = [
	{ suffix: "까요", mood: "suggestive", requiresRieul: true },
	{ suffix: "래요", mood: "suggestive", requiresRieul: true },
	{ suffix: "마십시오", mood: K.IMPERATIVE },
	{ suffix: "하십시오", mood: K.IMPERATIVE },
	{ suffix: "마세요", mood: K.IMPERATIVE },
	{ suffix: "마라", mood: K.IMPERATIVE },
	{ suffix: "십시오", mood: K.IMPERATIVE },
	{ suffix: "세요", mood: K.IMPERATIVE },
	{ suffix: "아라", mood: K.IMPERATIVE },
	{ suffix: "어라", mood: K.IMPERATIVE },
	{ suffix: "여라", mood: K.IMPERATIVE },
	{ suffix: "해라", mood: K.IMPERATIVE },
	{ suffix: "가라", mood: K.IMPERATIVE },
	{ suffix: "와라", mood: K.IMPERATIVE },
	{ suffix: "봐라", mood: K.IMPERATIVE },
	{ suffix: "자라", mood: K.IMPERATIVE },
	{ suffix: "읍시다", mood: K.PROPOSITIVE },
	{ suffix: "시다", mood: K.PROPOSITIVE, requiresBieup: true },
	{ suffix: "자", mood: K.PROPOSITIVE, excludeWords: ["남자", "여자", "모자", "의자", "탁자", "상자"] },
	{ suffix: "는가", mood: K.INTERROGATIVE },
	{ suffix: "나요", mood: K.INTERROGATIVE },
	{ suffix: "가요", mood: K.INTERROGATIVE },
	{ suffix: "니", mood: K.INTERROGATIVE },
	{ suffix: "냐", mood: K.INTERROGATIVE }
];

function detectClauseMood(clause) {
	if (!clause || typeof clause !== 'string') return K.DECLARATIVE;
	const clean = clause.trim().replace(/[.!?,;~]+$/, "").trim();
	const hasQuestionMark = clause.includes("?");

	for (const entry of MOOD_SUFFIX_ENTRIES) {
		if (clean.endsWith(entry.suffix)) {
			if (entry.excludeWords && entry.excludeWords.some(w => clean.endsWith(w))) {
				continue;
			}
			if (entry.mood === K.IMPERATIVE && (entry.suffix === "세요" || entry.suffix === "십시오")) {
				if (clean.includes("께서") || clean.includes("마음에 드")) {
					continue;
				}
				const lastWord = clean.split(/\s+/).pop();
				if (lastWord === "세요") {
					// Standalone '세요' is the indicative of '세다' (e.g. '자리를 세요', '힘이 세요'); imperative is '세세요'
					continue;
				}
				const dvKo = state.FORBIDDEN_DV_IMPERATIVE_FORMS ? state.FORBIDDEN_DV_IMPERATIVE_FORMS.get(lastWord) : null;
				if (dvKo && dvKo !== "싸다" && dvKo !== "낫다") {
					// Descriptive verbs ending in -(으)세요 / -(으)십시오 are subject honorific declaratives, NOT imperatives
					continue;
				}
			}
			if (entry.requiresRieul) {
				const prevChar = clean.slice(-entry.suffix.length - 1, -entry.suffix.length);
				if (!prevChar) continue;
				const d = decomposeHangul(prevChar);
				if (!d || d.final !== 8) continue;
			}
			if (entry.requiresBieup) {
				const prevChar = clean.slice(-entry.suffix.length - 1, -entry.suffix.length);
				if (!prevChar) continue;
				const d = decomposeHangul(prevChar);
				if (!d || (d.final !== 17 && prevChar !== "읍")) continue;
			}
			return entry.mood;
		}
	}

	if (hasQuestionMark) {
		return K.INTERROGATIVE;
	}

	return K.DECLARATIVE;
}

function detectClauseTense(clause) {
	if (!clause || typeof clause !== 'string') return K.PRESENT;
	const clean = clause.trim();

	for (let i = 0; i < clean.length; i++) {
		const ch = clean[i];
		const d = decomposeHangul(ch);
		if (d && d.final === 20) {
			if (ch === '겠') continue;
			if (ch === '있') {
				const nextCh = clean[i + 1];
				if (nextCh) {
					const nextD = decomposeHangul(nextCh);
					if (nextD && nextD.final === 20) return K.PAST;
				}
				continue;
			}
			return K.PAST;
		}
	}

	return K.PRESENT;
}

function isMotionPredicate(word) {
	if (!word) return false;
	const vUnit = getVerbUnit(word) || getVerbUnit(word + "다");
	if (vUnit && (hasTag(vUnit, "motion_concord") || state.MOTION_VERBS.has(vUnit[DATA_SCHEMA.Korean]))) {
		return true;
	}
	const motionPatterns = [
		/^(?:.*?(?:돌아|올라|내려|들어|나))?(?:가|갔|갑|갈)/,
		/^(?:.*?(?:돌아|올라|내려|들어|나))?(?:오|와|왔|옵|올)/,
		/^다니|^다녀|^다녔|^다닙|^다닐/
	];
	return motionPatterns.some(p => p.test(word));
}

function parseSentenceToClauses(sentence) {
	if (!sentence || typeof sentence !== 'string') return null;
	const s = sentence.trim();

	for (const m of state.MULTI_WORD_CONNECTIVE_RULES) {
		const match = s.match(m.pattern);
		if (match) {
			return {
				clause1: match[1].trim(),
				connective: m.connective,
				clause2: match[2].trim(),
				connectiveWord: m.cWord
			};
		}
	}

	const words = s.split(/\s+/);
	for (let i = 0; i < words.length - 1; i++) {
		const w = words[i];
		const c1Prefix = words.slice(0, i).join(" ");
		const c2 = words.slice(i + 1).join(" ");

		for (const rule of state.DYNAMIC_SUFFIX_RULES) {
			if (w === "해서" && c1Prefix && (c1Prefix.endsWith("으로") || c1Prefix.endsWith("로"))) continue;
			if (w === "어서" || w === "그래서" || w === "그래도") continue;
			if (state.DISCOURSE_ADVERBS && state.DISCOURSE_ADVERBS.has(w)) continue;
			if (w.endsWith(rule.suffix)) {
				if (rule.isSeoRule) {
					if (w.endsWith("께서") || w.endsWith("에게서") || w.endsWith("한테서")) continue;
					if (w.endsWith("에서") && getNounUnit(w.slice(0, -2))) continue;
					const prevChar = w.slice(-2, -1);
					if (!prevChar) continue;
					const d = decomposeHangul(prevChar);
					if (!d || (d.final !== 0 && d.final !== 20)) continue;
				}
				const stem = w.slice(0, -(rule.strip || rule.suffix).length);
				if (!stem && !c1Prefix) continue;
				return {
					clause1: (c1Prefix ? c1Prefix + " " : "") + stem,
					connective: rule.connective,
					clause2: c2,
					connectiveWord: w
				};
			}
		}
	}

	return null;
}

function canConnectiveJoin(clause1, connectiveTextOrId, clause2, options = {}) {
	const specs = getConnectiveSpecs(connectiveTextOrId);
	if (!specs) {
		return { valid: true, connective: connectiveTextOrId, errors: [], errorCodes: [] };
	}

	const errors = [];
	const errorCodes = [];
	const c1Str = typeof clause1 === 'string' ? clause1.trim() : "";
	const c2Str = typeof clause2 === 'string' ? clause2.trim() : "";
	const connName = specs.ko || connectiveTextOrId;

	// 1. Clause 1 Tense Restriction
	if (specs.clause1_tense_allowed === false) {
		const t1 = detectClauseTense(c1Str);
		if (t1 === K.PAST) {
			errors.push(`Connective '${connName}' does not permit past tense (-았/었/였-) in Clause 1: "${c1Str}"`);
			errorCodes.push(ERROR_CODES.CLAUSE1_PAST_TENSE);
		}
	}

	// 2. Clause 2 Mood Restriction
	const allowedMoods = new Set(specs.clause2_moods_allowed || [K.DECLARATIVE, K.INTERROGATIVE, K.IMPERATIVE, K.PROPOSITIVE, "suggestive"]);
	const c2Mood = detectClauseMood(c2Str);
	if (!allowedMoods.has(c2Mood)) {
		if (c2Mood === K.IMPERATIVE) {
			errors.push(`Connective '${connName}' cannot be followed by an imperative clause: "${c2Str}"`);
			errorCodes.push(ERROR_CODES.CLAUSE2_IMPERATIVE_MOOD);
		} else if (c2Mood === K.PROPOSITIVE) {
			errors.push(`Connective '${connName}' cannot be followed by a propositive clause: "${c2Str}"`);
			errorCodes.push(ERROR_CODES.CLAUSE2_PROPOSITIVE_MOOD);
		} else if (c2Mood === "suggestive") {
			errors.push(`Connective '${connName}' cannot be followed by a suggestive clause: "${c2Str}"`);
			errorCodes.push(ERROR_CODES.CLAUSE2_SUGGESTIVE_MOOD);
		} else {
			errors.push(`Connective '${connName}' cannot take mood '${c2Mood}' in Clause 2: "${c2Str}"`);
			errorCodes.push(ERROR_CODES.CLAUSE2_INVALID_MOOD);
		}
	}

	// 3. Clause 1 Part of Speech Restriction
	if (specs.clause1_pos && Array.isArray(specs.clause1_pos)) {
		const allowedPos = new Set(specs.clause1_pos);
		const c1Words = c1Str.split(/\s+/);
		const lastC1Word = c1Words[c1Words.length - 1].replace(/[.!?,;~]+$/, "");
		if (lastC1Word) {
			const isDV = state.DESCRIPTIVE_SURFACE_MAP.has(lastC1Word) ||
				isDescriptiveVerb(lastC1Word.endsWith("다") ? lastC1Word : lastC1Word + "다");
			const isAV = isActionVerb(lastC1Word.endsWith("다") ? lastC1Word : lastC1Word + "다") ||
				(!isDV && lastC1Word.endsWith("하"));

			if (isDV && !allowedPos.has(K.DESCRIPTIVE_VERB)) {
				errors.push(`Connective '${connName}' requires an Action Verb in Clause 1, but found descriptive verb: "${lastC1Word}"`);
				errorCodes.push(ERROR_CODES.CLAUSE1_INVALID_POS);
			} else if (isAV && !allowedPos.has(K.ACTION_VERB)) {
				errors.push(`Connective '${connName}' requires a Descriptive Verb in Clause 1, but found action verb: "${lastC1Word}"`);
				errorCodes.push(ERROR_CODES.CLAUSE1_INVALID_POS);
			}
		}
	}

	// 4. Motion Verb Requirement for Purpose Connectives (e.g. -(으)러)
	if (specs.motion_verb_required) {
		const c2Words = c2Str.split(/\s+/);
		const lastC2Word = c2Words[c2Words.length - 1].replace(/[.!?,;~]+$/, "");
		if (lastC2Word && !isMotionPredicate(lastC2Word)) {
			errors.push(`Connective '${connName}' strictly requires a motion verb (가다, 오다, 다니다, etc.) in Clause 2, but found: "${lastC2Word}"`);
			errorCodes.push(ERROR_CODES.NON_MOTION_VERB);
		}
	}

	// 5. Outcome Polarity Requirement (-느라고, -는 바람에)
	if (specs.outcome_polarity === -1) {
		if (options.outcomePolarity === 1) {
			errors.push(`Connective '${connName}' requires a negative consequence or burden, but outcome is positive`);
			errorCodes.push(ERROR_CODES.OUTCOME_POLARITY);
		} else {
			const positiveDistractorKeywords = ["합격했", "성공했", "칭찬", "상을 받", "이겼", "기뻤"];
			if (positiveDistractorKeywords.some(kw => c2Str.includes(kw))) {
				errors.push(`Connective '${connName}' requires a negative consequence or burden, but found positive outcome: "${c2Str}"`);
				errorCodes.push(ERROR_CODES.OUTCOME_POLARITY);
			}
		}
	}

	// 6. Same Subject Requirement
	if (specs.same_subject && options.subject1 && options.subject2 && options.subject1 !== options.subject2) {
		errors.push(`Connective '${connName}' requires identical subjects in Clause 1 and Clause 2, but found '${options.subject1}' vs '${options.subject2}'`);
		errorCodes.push(ERROR_CODES.DIFFERENT_SUBJECT);
	}

	return {
		valid: errors.length === 0,
		connective: connName,
		errors,
		errorCodes,
		clause1: c1Str,
		clause2: c2Str
	};
}

function validateClausalConcord(sentenceOrClauses, options = {}) {
	if (!sentenceOrClauses) {
		return { valid: true, errors: [], errorCodes: [], connective: null };
	}

	if (typeof sentenceOrClauses === 'object' && sentenceOrClauses.connective) {
		return canConnectiveJoin(
			sentenceOrClauses.clause1,
			sentenceOrClauses.connective,
			sentenceOrClauses.clause2,
			options
		);
	}

	if (typeof sentenceOrClauses === 'string') {
		const parsed = parseSentenceToClauses(sentenceOrClauses);
		if (!parsed) {
			return { valid: true, errors: [], errorCodes: [], connective: null };
		}
		const res = canConnectiveJoin(parsed.clause1, parsed.connective, parsed.clause2, options);
		res.originalSentence = sentenceOrClauses;
		res.connectiveWord = parsed.connectiveWord;
		return res;
	}

	return { valid: true, errors: [], errorCodes: [], connective: null };
}

const clausalValidationExports = {
	getConnectiveSpecs,
	isClausalConnective,
	detectClauseMood,
	detectClauseTense,
	isMotionPredicate,
	parseSentenceToClauses,
	canConnectiveJoin,
	validateClausalConcord
};

if (typeof window !== 'undefined') {
	Object.assign(window, clausalValidationExports);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = clausalValidationExports;
}
