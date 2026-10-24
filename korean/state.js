/**
 * Korean Engine Centralized State Registry & Lifecycle Management
 *
 * Centralizes all 45+ dynamic Map and Set collections populated from data.js.
 * Provides explicit, idempotent initialization and reset lifecycles, ensuring
 * unidirectional data flow and eliminating circular dependency hazards.
 */

let dataModule;
if (typeof require !== 'undefined') {
	try {
		dataModule = require('../data.js');
	} catch (e) {
		dataModule = typeof window !== 'undefined' ? window : {};
	}
} else {
	dataModule = typeof window !== 'undefined' ? window : {};
}

const { DATA_SCHEMA, hasTag, parseSemanticVector, getStem, decomposeHangul, composeHangul, setFinal, getVowelHarmony } =
	(typeof require !== 'undefined' ? require('./core/primitives.js') : window);

// =========================================================================
// State Collections
// =========================================================================

// Proper Names & Usage Filter State
let properNames = [];
let currentUsageFilter = null;
let totalOptionsCutToPreventCombinatorialExplosion = 0;
let usedUnitIds = new Set();

// Number System State
let SINO_DIGITS = Array(10).fill("");
let PURE_KOREAN_TENS = Array(10).fill("");
let PURE_KOREAN_ONES_CARDINAL = Array(10).fill("");
let PURE_KOREAN_ONES_ATTRIBUTIVE = Array(10).fill("");
let KOREAN_NUMBER_VALUES = {};
let SINO_TEN = "";
let SINO_HUNDRED = "";
let SINO_THOUSAND = "";
let SINO_TEN_THOUSAND = "";
let NUM_ZERO = "";
let PURE_KOREAN_TWENTY_ATTRIBUTIVE = "";

// Honorifics & Social Deixis (Feature 5)
let ELDER_NOUN_TITLES = new Set();
let INANIMATE_INSTITUTION_NAMES = new Set();
let ORIGIN_VERBS = new Set();
let ALLATIVE_GOAL_VERBS = new Set();
let STATIC_EXISTENCE_VERBS = new Set();
let HUMBLE_DATIVE_VERBS = new Set();
let TITLE_SUFFIX_SSI = "";
let HONORIFIC_VERB_SUPPLETIONS = new Map();
let HUMBLE_VERB_SUPPLETIONS = new Map();
let HONORIFIC_NOUN_SUPPLETIONS = new Map();
let HUMBLE_PRONOUN_SUPPLETIONS = new Map();
let PLAIN_COUNTERPARTS = new Map();
let HONORIFIC_WORDS = new Set();
let HUMBLE_WORDS = new Set();
let FORBIDDEN_PLAIN_WORDS_FOR_ELDERS = new Set();

// Temporal Concord
let PAST_TIME_WORDS = new Set();
let FUTURE_TIME_WORDS = new Set();
let PRESENT_TIME_WORDS = new Set();
let BARE_TIME_WORDS_NO_PARTICLE = new Set();
let PAST_GRAMMAR_IDS = new Set();
let FUTURE_GRAMMAR_IDS = new Set();
let PRESENT_GRAMMAR_IDS = new Set();

// Classifier / Counter Concord (Feature 6)
let KOREAN_CLASSIFIERS = new Set();
let SINO_CLASSIFIERS = new Set();
let CLASSIFIER_UNITS = new Map();
let CLASSIFIER_NOUN_SPECS = [];

// Spatial & Deictic Concord (Feature 7)
let SPATIAL_POSITIONS = new Map();
let DEICTIC_DETERMINERS = new Map();
let DEICTIC_PRONOUNS = new Map();
let DEICTIC_LOCATIVES = new Map();
let DEICTIC_DIRECTIONS = new Map();

// Mood & Negation Concord (Feature 8)
let IMPERATIVE_GRAMMAR_IDS = new Set();
let PROPOSITIVE_GRAMMAR_IDS = new Set();
let INABILITY_NEGATION_IDS = new Set();
let GENERAL_NEGATION_IDS = new Set();
let VOLITIONAL_GRAMMAR_IDS = new Set();
let FORBIDDEN_NEGATIVE_ROOTS = new Set();
let NEGATION_SUPPLETIONS = new Map();
let AFFIRMATIVE_COUNTERPARTS = new Map();
let SHORT_NEGATION_WORDS = new Set();
let SHORT_INABILITY_WORDS = new Set();
let SHORT_GENERAL_WORDS = new Set();
let DESCRIPTIVE_SURFACE_MAP = new Map();
let FORBIDDEN_DV_IMPERATIVE_FORMS = new Map();
let FORBIDDEN_DV_PROPOSITIVE_FORMS = new Map();
let FORBIDDEN_DV_LONG_INABILITY_FORMS = new Map();
let FORBIDDEN_DV_VOLITIONAL_FORMS = new Map();

// Adverbial & NPI Concord (Feature 9)
let DEGREE_ADVERBS = new Map();
let MANNER_ADVERBS = new Map();
let DISCOURSE_ADVERBS = new Map();
let NEGATIVE_POLARITY_ADVERBS = new Map();
let ALL_NPI_WORDS = new Set();
let AFFIRMATIVE_DEGREE_ADVERBS = new Map();

// Clausal Connective Concord (Feature 11)
let CLAUSAL_CONNECTIVES = new Map();
let CAUSAL_CONNECTIVES = new Map();
let CONTRAST_CONNECTIVES = new Map();
let PURPOSE_CONNECTIVES = new Map();
let CONDITION_CONNECTIVES = new Map();
let SIMULTANEOUS_CONNECTIVES = new Map();
let MOTION_VERBS = new Set();
let MOTION_VERB_STEMS = new Set();
let MULTI_WORD_CONNECTIVE_RULES = [];
let DYNAMIC_SUFFIX_RULES = [];

// Morphology Engine State
let PARTICLE_PAIRS = {};
let PRONOUN_REPLACEMENTS = [];
let particlePairsRegex = null;

// Template Engine State
let TEMPLATE_TO_GRAMMAR_ID = new Map();
let GRAMMAR_ID_TO_TEMPLATE = new Map();

// Lookup Caches
let verbLookupMap = null;
let nounLookupMap = null;

// =========================================================================
// Lifecycle Methods
// =========================================================================

function getConjugatedStem(koreanWord, conjugation) {
	let stem = getStem(koreanWord);
	if (conjugation && conjugation !== "regular" && conjugation !== "" && /^[a-z_]+$/.test(conjugation)) {
		stem += `[${conjugation}]`;
	}
	return stem;
}

function basicConjugate(stemWithMarker, endingPattern) {
	// Local lightweight conjugation helper to avoid circular dependency with full morphology
	let resolved = stemWithMarker;

	// Strip conjugation tags for regular / unhandled
	resolved = resolved.replace(/\[[^\]]+\]/g, '');

	if (endingPattern === "아/어요" || endingPattern === "아/어") {
		const isYo = endingPattern === "아/어요";
		const lastChar = resolved.slice(-1);
		const vh = getVowelHarmony(lastChar);
		if (lastChar === '하') {
			resolved = resolved.slice(0, -1) + (isYo ? "해요" : "해");
		} else {
			const d = decomposeHangul(lastChar);
			if (d && d.final === 0) {
				if (d.medial === 0) resolved = resolved + (isYo ? "요" : "");
				else if (d.medial === 8) resolved = resolved.slice(0, -1) + composeHangul(d.initial, 9, 0) + (isYo ? "요" : "");
				else if (d.medial === 20) resolved = resolved.slice(0, -1) + composeHangul(d.initial, 6, 0) + (isYo ? "요" : "");
				else if (d.medial === 13) resolved = resolved.slice(0, -1) + composeHangul(d.initial, 14, 0) + (isYo ? "요" : "");
				else resolved = resolved + vh + (isYo ? "요" : "");
			} else {
				resolved = resolved + vh + (isYo ? "요" : "");
			}
		}
		return resolved;
	}

	if (endingPattern === "습니다/ㅂ니다") {
		const lastChar = resolved.slice(-1);
		const d = decomposeHangul(lastChar);
		if (d && d.final !== 0) {
			return resolved + "습니다";
		}
		return setFinal(lastChar, 17) + "니다";
	}

	if (endingPattern === "았/었어요" || endingPattern === "았/었습니다") {
		const isFormal = endingPattern === "았/었습니다";
		const lastChar = resolved.slice(-1);
		const vh = getVowelHarmony(lastChar);
		const pastVowel = vh === '여' ? '였' : vh === '아' ? '았' : '었';
		if (lastChar === '하') {
			resolved = resolved.slice(0, -1) + (isFormal ? "했습니다" : "했어요");
		} else {
			const d = decomposeHangul(lastChar);
			if (d && d.final === 0) {
				if (d.medial === 0) resolved = resolved.slice(0, -1) + composeHangul(d.initial, 0, 20) + (isFormal ? "습니다" : "어요");
				else if (d.medial === 8) resolved = resolved.slice(0, -1) + composeHangul(d.initial, 9, 20) + (isFormal ? "습니다" : "어요");
				else if (d.medial === 20) resolved = resolved.slice(0, -1) + composeHangul(d.initial, 6, 20) + (isFormal ? "습니다" : "어요");
				else if (d.medial === 13) resolved = resolved.slice(0, -1) + composeHangul(d.initial, 14, 20) + (isFormal ? "습니다" : "어요");
				else resolved = resolved + pastVowel + (isFormal ? "습니다" : "어요");
			} else {
				resolved = resolved + pastVowel + (isFormal ? "습니다" : "어요");
			}
		}
		return resolved;
	}

	if (endingPattern === "으/십시오") {
		const lastChar = resolved.slice(-1);
		const d = decomposeHangul(lastChar);
		return resolved + (d && d.final !== 0 ? "으십시오" : "십시오");
	}
	if (endingPattern === "으/세요") {
		const lastChar = resolved.slice(-1);
		const d = decomposeHangul(lastChar);
		return resolved + (d && d.final !== 0 ? "으세요" : "세요");
	}
	if (endingPattern === "아/어라") {
		const lastChar = resolved.slice(-1);
		const vh = getVowelHarmony(lastChar);
		return resolved + vh + "라";
	}
	if (endingPattern === "으/ㅂ시다") {
		const lastChar = resolved.slice(-1);
		const d = decomposeHangul(lastChar);
		if (d && d.final !== 0) return resolved + "읍시다";
		return setFinal(lastChar, 17) + "시다";
	}

	return resolved + endingPattern;
}

function initProperNames(dm = dataModule) {
	properNames.length = 0;
	const units = dm.KR_EN_languageUnits || (dm.getWords ? dm.getWords("Noun") : []) || [];
	for (const u of units) {
		if (hasTag(u, "name", "proper_noun", "properName")) {
			properNames.push(u[DATA_SCHEMA.Korean]);
		}
	}
}

function initNumberSystem(dm = dataModule) {
	SINO_DIGITS.fill("");
	PURE_KOREAN_TENS.fill("");
	PURE_KOREAN_ONES_CARDINAL.fill("");
	PURE_KOREAN_ONES_ATTRIBUTIVE.fill("");
	for (const k of Object.keys(KOREAN_NUMBER_VALUES)) {
		delete KOREAN_NUMBER_VALUES[k];
	}
	SINO_TEN = "";
	SINO_HUNDRED = "";
	SINO_THOUSAND = "";
	SINO_TEN_THOUSAND = "";
	NUM_ZERO = "";
	PURE_KOREAN_TWENTY_ATTRIBUTIVE = "";

	const numberUnits = (dm.KR_EN_languageUnits || []).filter(u => u && u[DATA_SCHEMA.PartofSpeech] === "Number");
	for (const unit of numberUnits) {
		const ko = unit[DATA_SCHEMA.Korean];
		if (!ko) continue;
		const sv = parseSemanticVector(unit);
		const val = sv && sv.value !== undefined ? sv.value : undefined;
		if (val !== undefined) {
			KOREAN_NUMBER_VALUES[ko] = val;
		}

		if (val === 0 && !NUM_ZERO) {
			NUM_ZERO = ko;
		}

		if (hasTag(unit, "sinoNumber")) {
			if (val >= 1 && val <= 9) {
				SINO_DIGITS[val] = ko;
			} else if (val === 10) {
				SINO_TEN = ko;
			} else if (val === 100) {
				SINO_HUNDRED = ko;
			} else if (val === 1000) {
				SINO_THOUSAND = ko;
			} else if (val === 10000) {
				SINO_TEN_THOUSAND = ko;
			}
		}

		if (hasTag(unit, "koreanNumber")) {
			if (val >= 1 && val <= 9) {
				if (hasTag(unit, "attributive")) {
					PURE_KOREAN_ONES_ATTRIBUTIVE[val] = ko;
				}
				if (hasTag(unit, "counting") || !hasTag(unit, "attributive")) {
					PURE_KOREAN_ONES_CARDINAL[val] = ko;
				}
			} else if (val >= 10 && val <= 90 && val % 10 === 0) {
				if (hasTag(unit, "attributive") && val === 20) {
					PURE_KOREAN_TWENTY_ATTRIBUTIVE = ko;
				} else {
					PURE_KOREAN_TENS[val / 10] = ko;
				}
			}
		}
	}

	for (let i = 1; i <= 9; i++) {
		if (!PURE_KOREAN_ONES_ATTRIBUTIVE[i] && PURE_KOREAN_ONES_CARDINAL[i]) {
			PURE_KOREAN_ONES_ATTRIBUTIVE[i] = PURE_KOREAN_ONES_CARDINAL[i];
		}
		if (!PURE_KOREAN_ONES_CARDINAL[i] && PURE_KOREAN_ONES_ATTRIBUTIVE[i]) {
			PURE_KOREAN_ONES_CARDINAL[i] = PURE_KOREAN_ONES_ATTRIBUTIVE[i];
		}
	}

	for (let t = 1; t <= 9; t++) {
		const tenStr = PURE_KOREAN_TENS[t];
		if (!tenStr) continue;
		for (let o = 1; o <= 9; o++) {
			const val = t * 10 + o;
			const card = PURE_KOREAN_ONES_CARDINAL[o];
			const attr = PURE_KOREAN_ONES_ATTRIBUTIVE[o];
			if (card && KOREAN_NUMBER_VALUES[tenStr + card] === undefined) {
				KOREAN_NUMBER_VALUES[tenStr + card] = val;
			}
			if (attr && KOREAN_NUMBER_VALUES[tenStr + attr] === undefined) {
				KOREAN_NUMBER_VALUES[tenStr + attr] = val;
			}
		}
	}
}

function initMorphologyData(dm = dataModule) {
	for (const k of Object.keys(PARTICLE_PAIRS)) {
		delete PARTICLE_PAIRS[k];
	}
	PRONOUN_REPLACEMENTS.length = 0;
	particlePairsRegex = null;
	if (typeof stateExports !== 'undefined') {
		stateExports.particlePairsRegex = null;
	}

	const allUnits = dm.KR_EN_languageUnits || [];
	for (const unit of allUnits) {
		if (!unit) continue;
		const pos = unit[DATA_SCHEMA.PartofSpeech];
		const sv = parseSemanticVector(unit);
		if (!sv) continue;

		if (pos === "Grammar" && sv.allomorph_pair && Array.isArray(sv.allomorph_pair)) {
			const pair = sv.allomorph_pair;
			if (sv.allomorph_patterns && Array.isArray(sv.allomorph_patterns)) {
				for (const pat of sv.allomorph_patterns) {
					PARTICLE_PAIRS[pat] = pair;
					const noSpace = pat.replace(/\s+/g, '');
					PARTICLE_PAIRS[noSpace] = pair;
				}
			}
			const ko = unit[DATA_SCHEMA.Korean];
			if (ko) {
				PARTICLE_PAIRS[ko] = pair;
				PARTICLE_PAIRS[ko.replace(/\s+/g, '')] = pair;
			}
		}

		if (pos === "Pronoun" && sv.sandhi && Array.isArray(sv.sandhi)) {
			for (const rule of sv.sandhi) {
				if (rule.pattern && rule.replacement !== undefined) {
					const regex = new RegExp(rule.pattern, rule.flags || 'g');
					PRONOUN_REPLACEMENTS.push([regex, rule.replacement]);
				}
			}
		}
	}

	const keys = Object.keys(PARTICLE_PAIRS).sort((a, b) => b.length - a.length);
	if (keys.length > 0) {
		const escaped = keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
		particlePairsRegex = new RegExp(`([가-힣])(${escaped})`, 'g');
	}
}

let morphologyEngine = null;

function registerMorphologyEngine(engine) {
	morphologyEngine = engine;
	initSemanticSets();
}

function initSemanticSets(dm = dataModule) {
	ELDER_NOUN_TITLES.clear();
	INANIMATE_INSTITUTION_NAMES.clear();
	ORIGIN_VERBS.clear();
	ALLATIVE_GOAL_VERBS.clear();
	STATIC_EXISTENCE_VERBS.clear();
	HUMBLE_DATIVE_VERBS.clear();
	HONORIFIC_VERB_SUPPLETIONS.clear();
	HUMBLE_VERB_SUPPLETIONS.clear();
	HONORIFIC_NOUN_SUPPLETIONS.clear();
	HUMBLE_PRONOUN_SUPPLETIONS.clear();
	PLAIN_COUNTERPARTS.clear();
	HONORIFIC_WORDS.clear();
	HUMBLE_WORDS.clear();
	FORBIDDEN_PLAIN_WORDS_FOR_ELDERS.clear();
	PAST_TIME_WORDS.clear();
	FUTURE_TIME_WORDS.clear();
	PRESENT_TIME_WORDS.clear();
	BARE_TIME_WORDS_NO_PARTICLE.clear();
	PAST_GRAMMAR_IDS.clear();
	FUTURE_GRAMMAR_IDS.clear();
	PRESENT_GRAMMAR_IDS.clear();
	KOREAN_CLASSIFIERS.clear();
	SINO_CLASSIFIERS.clear();
	CLASSIFIER_UNITS.clear();
	CLASSIFIER_NOUN_SPECS.length = 0;
	SPATIAL_POSITIONS.clear();
	DEICTIC_DETERMINERS.clear();
	DEICTIC_PRONOUNS.clear();
	DEICTIC_LOCATIVES.clear();
	DEICTIC_DIRECTIONS.clear();
	IMPERATIVE_GRAMMAR_IDS.clear();
	PROPOSITIVE_GRAMMAR_IDS.clear();
	INABILITY_NEGATION_IDS.clear();
	GENERAL_NEGATION_IDS.clear();
	VOLITIONAL_GRAMMAR_IDS.clear();
	FORBIDDEN_NEGATIVE_ROOTS.clear();
	NEGATION_SUPPLETIONS.clear();
	AFFIRMATIVE_COUNTERPARTS.clear();
	SHORT_NEGATION_WORDS.clear();
	SHORT_INABILITY_WORDS.clear();
	SHORT_GENERAL_WORDS.clear();
	DESCRIPTIVE_SURFACE_MAP.clear();
	FORBIDDEN_DV_IMPERATIVE_FORMS.clear();
	FORBIDDEN_DV_PROPOSITIVE_FORMS.clear();
	FORBIDDEN_DV_LONG_INABILITY_FORMS.clear();
	FORBIDDEN_DV_VOLITIONAL_FORMS.clear();
	DEGREE_ADVERBS.clear();
	MANNER_ADVERBS.clear();
	DISCOURSE_ADVERBS.clear();
	NEGATIVE_POLARITY_ADVERBS.clear();
	ALL_NPI_WORDS.clear();
	AFFIRMATIVE_DEGREE_ADVERBS.clear();
	CLAUSAL_CONNECTIVES.clear();
	CAUSAL_CONNECTIVES.clear();
	CONTRAST_CONNECTIVES.clear();
	PURPOSE_CONNECTIVES.clear();
	CONDITION_CONNECTIVES.clear();
	SIMULTANEOUS_CONNECTIVES.clear();
	MOTION_VERBS.clear();
	MOTION_VERB_STEMS.clear();
	MULTI_WORD_CONNECTIVE_RULES.length = 0;
	DYNAMIC_SUFFIX_RULES.length = 0;

	const allUnits = dm.KR_EN_languageUnits || [];
	for (const unit of allUnits) {
		if (!unit) continue;
		const ko = unit[DATA_SCHEMA.Korean];
		if (!ko) continue;
		const pos = unit[DATA_SCHEMA.PartofSpeech] || "";

		if (hasTag(unit, "elder_noun")) {
			ELDER_NOUN_TITLES.add(ko);
		}
		if (hasTag(unit, "inanimate_institution")) {
			INANIMATE_INSTITUTION_NAMES.add(ko);
		}
		if (hasTag(unit, "locative_origin")) {
			ORIGIN_VERBS.add(ko);
		}
		if (hasTag(unit, "locative_goal")) {
			ALLATIVE_GOAL_VERBS.add(ko);
		}
		if (hasTag(unit, "locative_static")) {
			STATIC_EXISTENCE_VERBS.add(ko);
		}
		if (hasTag(unit, "dative_humble")) {
			HUMBLE_DATIVE_VERBS.add(ko);
		}
		if (pos === "Grammar" && hasTag(unit, "properNoun", "honorific") && !TITLE_SUFFIX_SSI) {
			TITLE_SUFFIX_SSI = ko;
		}

		const sv = parseSemanticVector(unit);
		if (sv) {
			if (sv.honorific_suppletion) {
				if (pos === "Action Verb" || pos === "Descriptive Verb") {
					HONORIFIC_VERB_SUPPLETIONS.set(ko, sv.honorific_suppletion);
					FORBIDDEN_PLAIN_WORDS_FOR_ELDERS.add(ko);
				} else if (pos === "Noun") {
					HONORIFIC_NOUN_SUPPLETIONS.set(ko, sv.honorific_suppletion);
					FORBIDDEN_PLAIN_WORDS_FOR_ELDERS.add(ko);
				} else if (pos === "Pronoun") {
					HUMBLE_PRONOUN_SUPPLETIONS.set(ko, sv.honorific_suppletion);
				}
			}
			if (sv.humble_suppletion) {
				if (pos === "Action Verb" || pos === "Descriptive Verb") {
					HUMBLE_VERB_SUPPLETIONS.set(ko, sv.humble_suppletion);
				} else if (pos === "Pronoun") {
					HUMBLE_PRONOUN_SUPPLETIONS.set(ko, sv.humble_suppletion);
				}
			}
			if (sv.plain_counterpart) {
				PLAIN_COUNTERPARTS.set(ko, sv.plain_counterpart);
			}
		}

		const hr = unit[DATA_SCHEMA.HonorificRules] || "";
		if (hr) {
			const repMatch = hr.match(/Replace with ([가-힣]+) for respected subjects/);
			if (repMatch) {
				const target = repMatch[1];
				if (pos === "Action Verb" || pos === "Descriptive Verb") {
					if (!HONORIFIC_VERB_SUPPLETIONS.has(ko)) HONORIFIC_VERB_SUPPLETIONS.set(ko, target);
					FORBIDDEN_PLAIN_WORDS_FOR_ELDERS.add(ko);
				} else if (pos === "Noun") {
					if (!HONORIFIC_NOUN_SUPPLETIONS.has(ko)) HONORIFIC_NOUN_SUPPLETIONS.set(ko, target);
					FORBIDDEN_PLAIN_WORDS_FOR_ELDERS.add(ko);
				}
			}
			const honMatch = hr.match(/Honorific:\s*([가-힣]+)/);
			if (honMatch) {
				const target = honMatch[1];
				if (pos === "Action Verb" || pos === "Descriptive Verb") {
					if (!HONORIFIC_VERB_SUPPLETIONS.has(ko)) HONORIFIC_VERB_SUPPLETIONS.set(ko, target);
					FORBIDDEN_PLAIN_WORDS_FOR_ELDERS.add(ko);
				} else if (pos === "Noun") {
					if (!HONORIFIC_NOUN_SUPPLETIONS.has(ko)) HONORIFIC_NOUN_SUPPLETIONS.set(ko, target);
					FORBIDDEN_PLAIN_WORDS_FOR_ELDERS.add(ko);
				}
			}
			const formOfMatch = hr.match(/Honorific form of ([가-힣]+)/);
			if (formOfMatch) {
				const base = formOfMatch[1];
				if (!PLAIN_COUNTERPARTS.has(ko)) PLAIN_COUNTERPARTS.set(ko, base);
				if (pos === "Action Verb" || pos === "Descriptive Verb") {
					if (!HONORIFIC_VERB_SUPPLETIONS.has(base)) HONORIFIC_VERB_SUPPLETIONS.set(base, ko);
					FORBIDDEN_PLAIN_WORDS_FOR_ELDERS.add(base);
				} else if (pos === "Noun") {
					if (!HONORIFIC_NOUN_SUPPLETIONS.has(base)) HONORIFIC_NOUN_SUPPLETIONS.set(base, ko);
					FORBIDDEN_PLAIN_WORDS_FOR_ELDERS.add(base);
				}
			}
		}

		if (hasTag(unit, "honorific", "honorificVerb", "honorific_noun", "honorific_person", "elder_noun")) {
			HONORIFIC_WORDS.add(ko);
		}
		if (hasTag(unit, "humble", "humbleVerb", "dative_humble")) {
			HUMBLE_WORDS.add(ko);
		}

		const unitId = unit[DATA_SCHEMA.Id];
		const isPast = hasTag(unit, "temporal_past", "past") || (sv && sv.tense === "past");
		const isFuture = hasTag(unit, "temporal_future", "future") || (sv && sv.tense === "future");
		const isPresent = hasTag(unit, "temporal_present", "present") || (sv && sv.tense === "present");
		const isNoParticle = hasTag(unit, "no_time_particle") || (sv && sv.no_time_particle === true);

		if (isPast) {
			if (pos === "Grammar") PAST_GRAMMAR_IDS.add(unitId);
			else PAST_TIME_WORDS.add(ko);
		}
		if (isFuture) {
			if (pos === "Grammar") FUTURE_GRAMMAR_IDS.add(unitId);
			else FUTURE_TIME_WORDS.add(ko);
		}
		if (isPresent) {
			if (pos === "Grammar") PRESENT_GRAMMAR_IDS.add(unitId);
			else PRESENT_TIME_WORDS.add(ko);
		}
		if (isNoParticle) {
			BARE_TIME_WORDS_NO_PARTICLE.add(ko);
		}

		if (pos === "Noun" && (hasTag(unit, "measureWord", "counter") || (sv && sv.counter === true))) {
			CLASSIFIER_UNITS.set(ko, unit);
			if (hasTag(unit, "koreanMeasureWord") || (sv && sv.numType === "pure")) {
				KOREAN_CLASSIFIERS.add(ko);
			}
			if (hasTag(unit, "sinoMeasureWord") || (sv && sv.numType === "sino")) {
				SINO_CLASSIFIERS.add(ko);
			}

			if (sv && sv.classifier_spec) {
				const cs = sv.classifier_spec;
				CLASSIFIER_NOUN_SPECS.push({
					classifier: ko,
					unitId: unit[DATA_SCHEMA.Id],
					unit: unit,
					tags: Array.isArray(cs.tags) ? cs.tags : (cs.tags ? [cs.tags] : []),
					fallbackTag: cs.fallbackTag || null,
					priority: typeof cs.priority === 'number' ? cs.priority : 50,
					honorificPerson: !!cs.honorificPerson,
					plainPerson: !!cs.plainPerson,
					generalObject: !!cs.generalObject,
					incompatibleTags: Array.isArray(cs.incompatibleTags) ? cs.incompatibleTags : []
				});
			}
		}

		if (pos === "Noun" && (hasTag(unit, "position") || (sv && sv.domain === "position"))) {
			SPATIAL_POSITIONS.set(ko, {
				unit,
				ko,
				en: unit[DATA_SCHEMA.English],
				domain: sv?.domain || "position",
				direction: sv?.direction || null
			});
		}

		if (hasTag(unit, "deictic", "demonstrative") || (sv && (sv.proximity || sv.deictic_type))) {
			const prox = sv?.proximity || (hasTag(unit, "proximal") ? "proximal" : hasTag(unit, "medial") ? "medial" : hasTag(unit, "distal") ? "distal" : hasTag(unit, "interrogative") ? "interrogative" : "proximal");
			const deicticType = sv?.deictic_type || (pos === "Determiner" ? "determiner" : pos === "Pronoun" && hasTag(unit, "place", "location") ? "place" : pos === "Pronoun" ? "thing" : hasTag(unit, "direction") ? "direction" : null);

			if (pos === "Determiner" || deicticType === "determiner") {
				DEICTIC_DETERMINERS.set(ko, { unit, ko, proximity: prox, type: "determiner" });
			} else if (deicticType === "thing" || (pos === "Pronoun" && !hasTag(unit, "place", "location") && (hasTag(unit, "thing", "object") || sv?.domain === "object"))) {
				DEICTIC_PRONOUNS.set(ko, { unit, ko, proximity: prox, type: "thing", formality: unit[DATA_SCHEMA.FormalityLevel] });
			} else if (deicticType === "place" || (hasTag(unit, "place", "location") && (pos === "Pronoun" || pos === "Noun"))) {
				DEICTIC_LOCATIVES.set(ko, { unit, ko, proximity: prox, type: "place" });
			} else if (deicticType === "direction" || hasTag(unit, "direction")) {
				DEICTIC_DIRECTIONS.set(ko, { unit, ko, proximity: prox, type: "direction" });
			}
		}

		if (pos === "Grammar") {
			if (sv?.mood === "imperative" || hasTag(unit, "imperative", "prohibition")) {
				IMPERATIVE_GRAMMAR_IDS.add(unitId);
			}
			if (sv?.mood === "propositive" || hasTag(unit, "propositive", "suggestion")) {
				PROPOSITIVE_GRAMMAR_IDS.add(unitId);
			}
			if (sv?.negation_type === "inability" || hasTag(unit, "inability")) {
				INABILITY_NEGATION_IDS.add(unitId);
			}
			if (sv?.negation_type === "long_general" || (hasTag(unit, "negative") && !hasTag(unit, "inability"))) {
				GENERAL_NEGATION_IDS.add(unitId);
			}
			if (sv?.mood === "volitional" || hasTag(unit, "volitional", "desire")) {
				VOLITIONAL_GRAMMAR_IDS.add(unitId);
			}
		}

		if (pos === "Adverb") {
			if (sv?.negation_type === "short_inability" || hasTag(unit, "inability")) {
				SHORT_INABILITY_WORDS.add(ko);
				SHORT_NEGATION_WORDS.add(ko);
			}
			if (sv?.negation_type === "short_general" || (hasTag(unit, "negative") && !hasTag(unit, "inability"))) {
				SHORT_GENERAL_WORDS.add(ko);
				SHORT_NEGATION_WORDS.add(ko);
			}
		}

		if (sv?.negation_suppletion) {
			NEGATION_SUPPLETIONS.set(ko, sv.negation_suppletion);
			if (sv.forbidden_negative_root) {
				FORBIDDEN_NEGATIVE_ROOTS.add(ko);
			}
		}
		if (sv?.affirmative_counterpart) {
			AFFIRMATIVE_COUNTERPARTS.set(ko, sv.affirmative_counterpart);
		}

		if (pos === "Adverb" || pos === "Conjunction") {
			const isDiscourse = sv?.adverb_type === "discourse" || pos === "Conjunction" || hasTag(unit, "adverb_discourse", "discourse", "conjunction");
			const isNPI = sv?.npi || sv?.polarity_requirement === -1 || hasTag(unit, "negative_polarity", "npi");
			let isDegree = sv?.adverb_type === "degree";
			let isManner = sv?.adverb_type === "manner";

			if (!isDegree && !isManner && !isDiscourse) {
				if (hasTag(unit, "adverb_degree", "degree")) isDegree = true;
				else if (hasTag(unit, "adverb_manner", "manner")) isManner = true;
			}

			if (isDiscourse) {
				DISCOURSE_ADVERBS.set(ko, { unit, ko, position: "sentence_initial" });
			}
			if (isNPI) {
				NEGATIVE_POLARITY_ADVERBS.set(ko, { unit, ko, polarity_requirement: -1, npi: true });
				ALL_NPI_WORDS.add(ko);
			}
			if (isDegree) {
				DEGREE_ADVERBS.set(ko, { unit, ko, target_pos: sv?.target_pos || "Descriptive Verb", npi: isNPI });
				if (!isNPI) {
					AFFIRMATIVE_DEGREE_ADVERBS.set(ko, { unit, ko, target_pos: sv?.target_pos || "Descriptive Verb" });
				}
			}
			if (isManner) {
				MANNER_ADVERBS.set(ko, { unit, ko, target_pos: sv?.target_pos || "Action Verb" });
			}
		}

		if (pos === "Action Verb" && hasTag(unit, "motion_concord")) {
			MOTION_VERBS.add(ko);
			MOTION_VERB_STEMS.add(getStem(ko));
		}

		if (pos === "Connective" || pos === "Grammar" || hasTag(unit, "connective", "conjunction", "clausal_connective", "reason", "cause", "purpose", "condition", "contrast", "simultaneous")) {
			const isConnective = hasTag(unit, "connective", "conjunction", "clausal_connective") ||
				pos === "Connective" ||
				(pos === "Grammar" && (hasTag(unit, "reason", "cause", "purpose", "condition", "contrast", "simultaneous") || sv?.clause1_tense_allowed !== undefined || sv?.clause2_moods_allowed !== undefined));

			if (isConnective) {
				const connectiveInfo = {
					unit,
					ko,
					id: unit[DATA_SCHEMA.Id],
					clause1_tense_allowed: sv?.clause1_tense_allowed !== undefined ? sv.clause1_tense_allowed : true,
					clause2_moods_allowed: sv?.clause2_moods_allowed || ["declarative", "interrogative", "imperative", "propositive", "suggestive"],
					clause1_pos: sv?.clause1_pos || ["Action Verb", "Descriptive Verb"],
					same_subject: sv?.same_subject || false,
					outcome_polarity: sv?.outcome_polarity !== undefined ? sv.outcome_polarity : 0,
					motion_verb_required: sv?.motion_verb_required || false,
					function: sv?.function || (sv?.connective_type === "causal" || sv?.domain === "causal" || hasTag(unit, "reason", "cause", "causal") ? "cause" : (sv?.connective_type === "contrast" || sv?.domain === "contrast" || hasTag(unit, "contrast") ? "contrast" : (sv?.connective_type === "purpose" || sv?.domain === "purpose" || hasTag(unit, "purpose") ? "purpose" : (sv?.connective_type === "condition" || sv?.domain === "condition" || hasTag(unit, "condition") ? "condition" : (sv?.connective_type === "simultaneous" || sv?.domain === "simultaneous" || hasTag(unit, "simultaneous") ? "simultaneous" : "general"))))),
					surface_forms: Array.isArray(sv?.surface_forms) ? sv.surface_forms : []
				};

				const registerKey = (k) => {
					if (!k) return;
					const trimmed = String(k).trim();
					CLAUSAL_CONNECTIVES.set(trimmed, connectiveInfo);
					const stripped = trimmed.replace(/^[-~]/, "");
					CLAUSAL_CONNECTIVES.set(stripped, connectiveInfo);
					CLAUSAL_CONNECTIVES.set(`-${stripped}`, connectiveInfo);
					CLAUSAL_CONNECTIVES.set(`~${stripped}`, connectiveInfo);
				};

				registerKey(ko);
				CLAUSAL_CONNECTIVES.set(String(unit[DATA_SCHEMA.Id]), connectiveInfo);
				for (const sf of connectiveInfo.surface_forms) {
					registerKey(sf);
				}

				if (connectiveInfo.function === "cause" || hasTag(unit, "reason", "cause", "causal")) {
					CAUSAL_CONNECTIVES.set(ko, connectiveInfo);
				} else if (connectiveInfo.function === "contrast" || hasTag(unit, "contrast")) {
					CONTRAST_CONNECTIVES.set(ko, connectiveInfo);
				} else if (connectiveInfo.function === "purpose" || hasTag(unit, "purpose")) {
					PURPOSE_CONNECTIVES.set(ko, connectiveInfo);
				} else if (connectiveInfo.function === "condition" || hasTag(unit, "condition")) {
					CONDITION_CONNECTIVES.set(ko, connectiveInfo);
				} else if (connectiveInfo.function === "simultaneous" || hasTag(unit, "simultaneous")) {
					SIMULTANEOUS_CONNECTIVES.set(ko, connectiveInfo);
				}
			}
		}
	}

	let applyMorph = (morphologyEngine && morphologyEngine.applyMorphology)
		|| (typeof window !== 'undefined' && window.applyMorphology ? window.applyMorphology : null);
	const morph = (pattern) => {
		if (applyMorph) return applyMorph(pattern);
		return basicConjugate(pattern, "");
	};

	const descriptiveUnits = allUnits.filter(u => u && u[DATA_SCHEMA.PartofSpeech] === "Descriptive Verb");
	for (const du of descriptiveUnits) {
		const dKo = du[DATA_SCHEMA.Korean];
		if (!dKo) continue;
		const dConj = du[DATA_SCHEMA.Conjugation];
		const dStem = getConjugatedStem(dKo, dConj);
		const rawStem = getStem(dKo);

		DESCRIPTIVE_SURFACE_MAP.set(dKo, du);
		DESCRIPTIVE_SURFACE_MAP.set(rawStem, du);
		DESCRIPTIVE_SURFACE_MAP.set(morph(dStem + "아/어요"), du);
		DESCRIPTIVE_SURFACE_MAP.set(morph(dStem + "아/어"), du);
		DESCRIPTIVE_SURFACE_MAP.set(morph(dStem + "습니다/ㅂ니다"), du);
		DESCRIPTIVE_SURFACE_MAP.set(morph(dStem + "았/었어요"), du);
		DESCRIPTIVE_SURFACE_MAP.set(morph(dStem + "았/었습니다"), du);

		FORBIDDEN_DV_IMPERATIVE_FORMS.set(morph(dStem + "으/십시오"), dKo);
		FORBIDDEN_DV_IMPERATIVE_FORMS.set(morph(dStem + "으/세요"), dKo);
		FORBIDDEN_DV_IMPERATIVE_FORMS.set(morph(dStem + "아/어라"), dKo);
		FORBIDDEN_DV_IMPERATIVE_FORMS.set(rawStem + "지 마세요", dKo);
		FORBIDDEN_DV_IMPERATIVE_FORMS.set(rawStem + "지 마십시오", dKo);
		FORBIDDEN_DV_IMPERATIVE_FORMS.set(rawStem + "지 마", dKo);
		FORBIDDEN_DV_IMPERATIVE_FORMS.set(rawStem + "지 마라", dKo);

		FORBIDDEN_DV_PROPOSITIVE_FORMS.set(morph(dStem + "으/ㅂ시다"), dKo);
		FORBIDDEN_DV_PROPOSITIVE_FORMS.set(rawStem + "자", dKo);
		FORBIDDEN_DV_PROPOSITIVE_FORMS.set(rawStem + "세", dKo);

		FORBIDDEN_DV_LONG_INABILITY_FORMS.set(rawStem + "지 못해요", dKo);
		FORBIDDEN_DV_LONG_INABILITY_FORMS.set(rawStem + "지 못합니다", dKo);
		FORBIDDEN_DV_LONG_INABILITY_FORMS.set(rawStem + "지 못하다", dKo);
		FORBIDDEN_DV_LONG_INABILITY_FORMS.set(rawStem + "지 못했다", dKo);
		FORBIDDEN_DV_LONG_INABILITY_FORMS.set(rawStem + "지 못했어요", dKo);
		FORBIDDEN_DV_LONG_INABILITY_FORMS.set(rawStem + "지 못했습니다", dKo);

		FORBIDDEN_DV_VOLITIONAL_FORMS.set(rawStem + "고 싶어요", dKo);
		FORBIDDEN_DV_VOLITIONAL_FORMS.set(rawStem + "고 싶습니다", dKo);
		FORBIDDEN_DV_VOLITIONAL_FORMS.set(rawStem + "고 싶다", dKo);
		FORBIDDEN_DV_VOLITIONAL_FORMS.set(rawStem + "고 싶어해요", dKo);
		FORBIDDEN_DV_VOLITIONAL_FORMS.set(rawStem + "고 싶어합니다", dKo);
	}

	const seenMultiWords = new Set();
	const seenSuffixes = new Set();
	const uniqueConnectiveSpecs = new Set(CLAUSAL_CONNECTIVES.values());

	for (const spec of uniqueConnectiveSpecs) {
		const rawForms = [spec.ko, ...(spec.surface_forms || [])];
		const canonicalConn = spec.ko.startsWith("~") ? "-" + spec.ko.slice(1) : spec.ko;
		for (const raw of rawForms) {
			if (!raw) continue;
			const clean = String(raw).trim().replace(/^[-~]/, "");
			if (clean.includes(" ") || clean.includes("때문에") || clean.includes("바람에") || clean.includes("후에") || clean.includes("때")) {
				if (!seenMultiWords.has(clean)) {
					seenMultiWords.add(clean);
					const pattern = new RegExp(`^(.*?)\\s*${clean.replace(/\s+/g, "\\s*")}\\s*(.*)$`);
					MULTI_WORD_CONNECTIVE_RULES.push({
						pattern,
						connective: canonicalConn,
						cWord: clean
					});
				}
			} else {
				const suffixItems = [];
				if (clean.includes("(으)")) {
					suffixItems.push({ suffix: clean.replace(/\(으\)/g, "으"), strip: clean.replace(/\(으\)/g, "으") });
					suffixItems.push({ suffix: clean.replace(/\(으\)/g, ""), strip: clean.replace(/\(으\)/g, "") });
				} else if (clean.includes("(느)")) {
					suffixItems.push({ suffix: clean.replace(/\(느\)/g, "느"), strip: clean.replace(/\(느\)/g, "느") });
					suffixItems.push({ suffix: clean.replace(/\(느\)/g, ""), strip: clean.replace(/\(느\)/g, "") });
				} else {
					suffixItems.push({ suffix: clean, strip: clean });
				}

				if (spec.ko.includes("아/어서") || clean === "아/어서") {
					suffixItems.push({ suffix: "았어서", strip: "어서" });
					suffixItems.push({ suffix: "었어서", strip: "어서" });
					suffixItems.push({ suffix: "였어서", strip: "어서" });
					suffixItems.push({ suffix: "했어서", strip: "어서" });
					suffixItems.push({ suffix: "서", strip: "서", isSeoRule: true });
				}

				for (const item of suffixItems) {
					if (!item.suffix || seenSuffixes.has(item.suffix)) continue;
					seenSuffixes.add(item.suffix);
					DYNAMIC_SUFFIX_RULES.push({
						suffix: item.suffix,
						strip: item.strip,
						connective: canonicalConn,
						isSeoRule: !!item.isSeoRule
					});
				}
			}
		}
	}

	const standardMultiGrammar = [
		{ form: "ㄴ 후에", canonical: "-(으)ㄴ 후에" },
		{ form: "은 후에", canonical: "-(으)ㄴ 후에" },
		{ form: "ㄹ 때", canonical: "-(으)ㄹ 때" },
		{ form: "을 때", canonical: "-(으)ㄹ 때" }
	];
	for (const smg of standardMultiGrammar) {
		if (!seenMultiWords.has(smg.form)) {
			seenMultiWords.add(smg.form);
			MULTI_WORD_CONNECTIVE_RULES.push({
				pattern: new RegExp(`^(.*?)\\s*${smg.form.replace(/\s+/g, "\\s*")}\\s*(.*)$`),
				connective: smg.canonical,
				cWord: smg.form
			});
		}
	}

	MULTI_WORD_CONNECTIVE_RULES.sort((a, b) => b.cWord.length - a.cWord.length);
	DYNAMIC_SUFFIX_RULES.sort((a, b) => b.suffix.length - a.suffix.length);
	CLASSIFIER_NOUN_SPECS.sort((a, b) => b.priority - a.priority);
}

function initTemplateToGrammarMap(dm = dataModule) {
	TEMPLATE_TO_GRAMMAR_ID.clear();
	GRAMMAR_ID_TO_TEMPLATE.clear();
	const units = (dm.KR_EN_languageUnits || []).filter(u => u && u[DATA_SCHEMA.PartofSpeech] === "Grammar");
	for (const u of units) {
		const ko = u[DATA_SCHEMA.Korean];
		const id = u[DATA_SCHEMA.Id];
		if (!ko || id === undefined) continue;
		const clean = ko.replace(/^[-~]/, '').trim();
		TEMPLATE_TO_GRAMMAR_ID.set(clean, id);
		TEMPLATE_TO_GRAMMAR_ID.set(ko, id);
		GRAMMAR_ID_TO_TEMPLATE.set(id, ko);
	}
}

function initAllDataSets(dm = dataModule) {
	initProperNames(dm);
	initNumberSystem(dm);
	initMorphologyData(dm);
	initSemanticSets(dm);
	initTemplateToGrammarMap(dm);
}

const stateExports = {
	properNames,
	initProperNames,
	get currentUsageFilter() { return currentUsageFilter; },
	set currentUsageFilter(v) { currentUsageFilter = v; },
	get totalOptionsCutToPreventCombinatorialExplosion() { return totalOptionsCutToPreventCombinatorialExplosion; },
	set totalOptionsCutToPreventCombinatorialExplosion(v) { totalOptionsCutToPreventCombinatorialExplosion = v; },
	usedUnitIds,
	SINO_DIGITS,
	PURE_KOREAN_TENS,
	PURE_KOREAN_ONES_CARDINAL,
	PURE_KOREAN_ONES_ATTRIBUTIVE,
	KOREAN_NUMBER_VALUES,
	get SINO_TEN() { return SINO_TEN; },
	set SINO_TEN(v) { SINO_TEN = v; },
	get SINO_HUNDRED() { return SINO_HUNDRED; },
	set SINO_HUNDRED(v) { SINO_HUNDRED = v; },
	get SINO_THOUSAND() { return SINO_THOUSAND; },
	set SINO_THOUSAND(v) { SINO_THOUSAND = v; },
	get SINO_TEN_THOUSAND() { return SINO_TEN_THOUSAND; },
	set SINO_TEN_THOUSAND(v) { SINO_TEN_THOUSAND = v; },
	get NUM_ZERO() { return NUM_ZERO; },
	set NUM_ZERO(v) { NUM_ZERO = v; },
	get PURE_KOREAN_TWENTY_ATTRIBUTIVE() { return PURE_KOREAN_TWENTY_ATTRIBUTIVE; },
	set PURE_KOREAN_TWENTY_ATTRIBUTIVE(v) { PURE_KOREAN_TWENTY_ATTRIBUTIVE = v; },
	ELDER_NOUN_TITLES,
	INANIMATE_INSTITUTION_NAMES,
	ORIGIN_VERBS,
	ALLATIVE_GOAL_VERBS,
	STATIC_EXISTENCE_VERBS,
	HUMBLE_DATIVE_VERBS,
	get TITLE_SUFFIX_SSI() { return TITLE_SUFFIX_SSI; },
	set TITLE_SUFFIX_SSI(v) { TITLE_SUFFIX_SSI = v; },
	HONORIFIC_VERB_SUPPLETIONS,
	HUMBLE_VERB_SUPPLETIONS,
	HONORIFIC_NOUN_SUPPLETIONS,
	HUMBLE_PRONOUN_SUPPLETIONS,
	PLAIN_COUNTERPARTS,
	HONORIFIC_WORDS,
	HUMBLE_WORDS,
	FORBIDDEN_PLAIN_WORDS_FOR_ELDERS,
	PAST_TIME_WORDS,
	FUTURE_TIME_WORDS,
	PRESENT_TIME_WORDS,
	BARE_TIME_WORDS_NO_PARTICLE,
	PAST_GRAMMAR_IDS,
	FUTURE_GRAMMAR_IDS,
	PRESENT_GRAMMAR_IDS,
	KOREAN_CLASSIFIERS,
	SINO_CLASSIFIERS,
	CLASSIFIER_UNITS,
	CLASSIFIER_NOUN_SPECS,
	SPATIAL_POSITIONS,
	DEICTIC_DETERMINERS,
	DEICTIC_PRONOUNS,
	DEICTIC_LOCATIVES,
	DEICTIC_DIRECTIONS,
	IMPERATIVE_GRAMMAR_IDS,
	PROPOSITIVE_GRAMMAR_IDS,
	INABILITY_NEGATION_IDS,
	GENERAL_NEGATION_IDS,
	VOLITIONAL_GRAMMAR_IDS,
	FORBIDDEN_NEGATIVE_ROOTS,
	NEGATION_SUPPLETIONS,
	AFFIRMATIVE_COUNTERPARTS,
	SHORT_NEGATION_WORDS,
	SHORT_INABILITY_WORDS,
	SHORT_GENERAL_WORDS,
	DESCRIPTIVE_SURFACE_MAP,
	FORBIDDEN_DV_IMPERATIVE_FORMS,
	FORBIDDEN_DV_PROPOSITIVE_FORMS,
	FORBIDDEN_DV_LONG_INABILITY_FORMS,
	FORBIDDEN_DV_VOLITIONAL_FORMS,
	DEGREE_ADVERBS,
	MANNER_ADVERBS,
	DISCOURSE_ADVERBS,
	NEGATIVE_POLARITY_ADVERBS,
	ALL_NPI_WORDS,
	AFFIRMATIVE_DEGREE_ADVERBS,
	CLAUSAL_CONNECTIVES,
	CAUSAL_CONNECTIVES,
	CONTRAST_CONNECTIVES,
	PURPOSE_CONNECTIVES,
	CONDITION_CONNECTIVES,
	SIMULTANEOUS_CONNECTIVES,
	MOTION_VERBS,
	MOTION_VERB_STEMS,
	MULTI_WORD_CONNECTIVE_RULES,
	DYNAMIC_SUFFIX_RULES,
	PARTICLE_PAIRS,
	PRONOUN_REPLACEMENTS,
	TEMPLATE_TO_GRAMMAR_ID,
	GRAMMAR_ID_TO_TEMPLATE,
	initNumberSystem,
	initSemanticSets,
	initMorphologyData,
	initTemplateToGrammarMap,
	initAllDataSets,
	registerMorphologyEngine
};

if (typeof window !== 'undefined') {
	Object.assign(window, stateExports);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = stateExports;
}

// Auto-initialize when loaded
initAllDataSets();
