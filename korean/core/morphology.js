(function() {
// Universal Constants
const { K } = (typeof require !== 'undefined') ? require('../../constants.js') : (typeof window !== 'undefined' ? window : {});

/**
 * Korean Morphology Engine, Verb Conjugation & Phonology
 *
 * Implements:
 * 1. Standard Korean Pronunciation (표준 발음법) phonological assimilation.
 * 2. Regular and irregular verb/adjective stem conjugation.
 * 3. Case particle attachment with batchim harmony and honorific suppletion.
 * 4. Honorific and Temporal concordance validators and repair routines.
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
const {
	DATA_SCHEMA,
	hasTag,
	parseSemanticData,
	parseSemanticVector,
	getStem,
	decomposeHangul,
	composeHangul,
	setFinal,
	hasBatchim,
	hasRieulBatchim,
	getVowelHarmony
} = (typeof require !== 'undefined' ? require('./primitives.js') : window);

const {
	getConjugatedStem,
	conjugateAoStem,
	resolvePureMorphology
} = (typeof require !== 'undefined' ? require('./stem_engine.js') : window);

const INANIMATE_PERSON_ATTR_NOUNS = new Set([
	"나이", "이름", "성함", "연세", "생일", "생신", "고향", "주소",
	"전화번호", "번호", "취미", "전공", "성별", "국적", "키", "몸무게",
	"말씀", "진지", "댁", "병환", "약주"
]);

function filterAnimatePersonSubjects(candidates) {
	const filtered = candidates.filter(n => {
		const ko = n[DATA_SCHEMA.Korean] || "";
		if (INANIMATE_PERSON_ATTR_NOUNS.has(ko)) return false;
		if (hasTag(n, "honorific_noun", "name")) return false;
		if (hasTag(n, "colloquial") && parseSemanticVector(n).polarity === -1) return false;
		return true;
	});
	return filtered.length > 0 ? filtered : candidates;
}

const {
	getLexiconIndex,
	getCompiledCollocationFilter
} = (typeof require !== 'undefined' ? require('./lexicon_index.js') : window);

const {
	FINAL_TO_INITIAL,
	TENSIFY_INITIAL,
	NASAL_VERB_ROOTS,
	DOUBLE_CODA_LIAISON,
	DOUBLE_CODA_SIMPLIFY,
	H_ONSET_MAP,
	NASAL_CODA
} = (typeof require !== 'undefined' ? require('../specs/pronunciation_rules.js') : window);

const { ACTION_VERB_SPECS, DESCRIPTIVE_VERB_SPECS } =
	(typeof require !== 'undefined' ? require('../specs/verb_argument_specs.js') : window);

const { parseAndValidateCollocationFilter } =
	(typeof require !== 'undefined' ? require('../utils/filter_evaluator.js') : window);

const { getPronunciationWord, getPronunciation } =
	(typeof require !== 'undefined' ? require('../phonetics/pronunciation.js') : window);

// Resolving a module on every call costs a filesystem stat per require(); cache once the module has finished loading.
const _lazyModuleCache = new Map();
function loadLazyModule(relPath) {
	if (typeof require === 'undefined') return window;
	if (_lazyModuleCache.has(relPath)) return _lazyModuleCache.get(relPath);
	const mod = require(relPath);
	if (mod && Object.keys(mod).length > 0) _lazyModuleCache.set(relPath, mod);
	return mod;
}
function resolveGetFilteredWords() {
	return typeof window !== 'undefined' ? window.getFilteredWords : loadLazyModule('./numbers.js').getFilteredWords;
}

// Concord repair delegators (dynamically resolved or injected to avoid circular dependency)
let concordRepairs = {
	applyCounterConcord: (t) => {
		try {
			const mod = loadLazyModule('../concord/classifier_concord.js');
			return mod.applyCounterConcord ? mod.applyCounterConcord(t) : t;
		} catch (e) { return t; }
	},
	applySpatialConcord: (t) => {
		try {
			const mod = loadLazyModule('../concord/spatial_concord.js');
			return mod.applySpatialConcord ? mod.applySpatialConcord(t) : t;
		} catch (e) { return t; }
	},
	applyMoodConcord: (t) => {
		try {
			const mod = loadLazyModule('../concord/mood_concord.js');
			return mod.applyMoodConcord ? mod.applyMoodConcord(t) : t;
		} catch (e) { return t; }
	},
	applyAdverbConcord: (t) => {
		try {
			const mod = loadLazyModule('../concord/adverbial_concord.js');
			return mod.applyAdverbConcord ? mod.applyAdverbConcord(t) : t;
		} catch (e) { return t; }
	},
	applyClausalConcord: (t) => {
		try {
			const mod = loadLazyModule('../concord/clausal_generator.js');
			return mod.applyClausalConcord ? mod.applyClausalConcord(t) : t;
		} catch (e) { return t; }
	}
};

function registerConcordRepairs(repairs) {
	concordRepairs = { ...concordRepairs, ...repairs };
}

// =========================================================================
// Standard Korean Pronunciation (표준 발음법) Engine
// (Delegated to specialized module korean/phonetics/pronunciation.js)
// =========================================================================

// =========================================================================
// Morphology & Phonological Attachment
// =========================================================================

function applyMorphology(text) {
	let resolvedKo = resolvePureMorphology(text, state);

	// Concord repairs delegation
	if (concordRepairs.applyCounterConcord) resolvedKo = concordRepairs.applyCounterConcord(resolvedKo);
	if (concordRepairs.applySpatialConcord) resolvedKo = concordRepairs.applySpatialConcord(resolvedKo);
	if (concordRepairs.applyMoodConcord) resolvedKo = concordRepairs.applyMoodConcord(resolvedKo);
	if (concordRepairs.applyAdverbConcord) resolvedKo = concordRepairs.applyAdverbConcord(resolvedKo);
	if (concordRepairs.applyClausalConcord) resolvedKo = concordRepairs.applyClausalConcord(resolvedKo);

	return resolvedKo.replace(/\u200B/g, '');
}

// =========================================================================
// Particle Attachment Engine
// =========================================================================

function attachParticle(noun, particleType, verb = null, options = {}) {
	const nounUnit = getNounUnit(noun);
	const nounKo = typeof noun === 'string' ? noun : (nounUnit ? nounUnit[DATA_SCHEMA.Korean] : "");
	if (!nounKo) return "";
	// Pronoun clitic allomorphy (저/제, 나/내, 너/네)
	if (nounKo === "저" || nounKo === "제") {
		if (particleType === K.SUBJECT || particleType === "nominative" || particleType === "sub") {
			return "제가";
		}
		if (particleType === K.TOPIC) {
			return "저는";
		}
		if (particleType === K.OBJECT || particleType === "accusative" || particleType === "obj") {
			return "저를";
		}
		if (particleType === K.DATIVE || particleType === K.DATIVE_PERSON || particleType === "dative_animate") {
			return (options.spoken === true || options.formality === "spoken") ? "저한테" : "저에게";
		}
	} else if (nounKo === "나" || nounKo === "내") {
		if (particleType === K.SUBJECT || particleType === "nominative" || particleType === "sub") {
			return "내가";
		}
		if (particleType === K.TOPIC) {
			return "나는";
		}
		if (particleType === K.OBJECT || particleType === "accusative" || particleType === "obj") {
			return "나를";
		}
		if (particleType === K.DATIVE || particleType === K.DATIVE_PERSON || particleType === "dative_animate") {
			return (options.spoken === true || options.formality === "spoken") ? "나한테" : "나에게";
		}
	} else if (nounKo === "너" || nounKo === "네") {
		if (particleType === K.SUBJECT || particleType === "nominative" || particleType === "sub") {
			return "네가";
		}
		if (particleType === K.TOPIC) {
			return "너는";
		}
		if (particleType === K.OBJECT || particleType === "accusative" || particleType === "obj") {
			return "너를";
		}
		if (particleType === K.DATIVE || particleType === K.DATIVE_PERSON || particleType === "dative_animate") {
			return (options.spoken === true || options.formality === "spoken") ? "너한테" : "너에게";
		}
	} else if (nounKo === "누구") {
		if (particleType === K.SUBJECT || particleType === "nominative" || particleType === "sub") {
			return "누가";
		}
	}

	const lastChar = nounKo.trim().slice(-1);
	const hasB = hasBatchim(lastChar);
	const hasRieul = hasRieulBatchim(lastChar);
	const verbUnit = getVerbUnit(verb);
	const verbKo = verbUnit ? verbUnit[DATA_SCHEMA.Korean] : (typeof verb === 'string' ? verb : "");

	switch (particleType) {
		case K.OBJECT:
		case "accusative":
		case "obj":
			return nounKo + (hasB ? "을" : "를");

		case K.SUBJECT:
		case "nominative":
		case "sub":
			if (options.honorific === true || (options.allowHonorificSubject && isElderNoun(nounUnit, nounKo))) {
				return nounKo + "께서";
			}
			return nounKo + (hasB ? "이" : "가");

		case "subject_honorific":
		case "honorific_subject":
			return nounKo + "께서";

		case K.TOPIC:
			if (options.honorific === true) {
				return nounKo + "께서는";
			}
			return nounKo + (hasB ? "은" : "는");

		case "topic_honorific":
		case "honorific_topic":
			return nounKo + "께서는";

		case K.DATIVE: {
			const isHumble = (verbUnit && hasTag(verbUnit, "humbleVerb", "dative_humble")) || state.HUMBLE_DATIVE_VERBS.has(verbKo);
			if (options.dativeType === K.HONORIFIC || options.honorific === true || isElderNoun(nounUnit, nounKo) || isHumble) {
				return nounKo + "께";
			}
			if (options.dativeType === "inanimate" || isInanimateInstitution(nounUnit, nounKo)) {
				return nounKo + "에";
			}
			if (options.dativeType === "spoken" || options.spoken === true || options.formality === "spoken") {
				return nounKo + "한테";
			}
			return nounKo + "에게";
		}

		case "dative_honorific":
			return nounKo + "께";

		case "dative_inanimate":
			return nounKo + "에";

		case "dative_spoken":
			return nounKo + "한테";

		case K.DATIVE_PERSON:
		case "dative_animate":
			return (options.spoken === true || options.formality === "spoken") ? nounKo + "한테" : nounKo + "에게";

		case K.LOCATION:
		case "locative": {
			if (options.locativeType === "dynamic" || options.locativeType === "origin") return nounKo + "에서";
			if (options.locativeType === "static" || options.locativeType === "goal" || options.locativeType === "destination") return nounKo + "에";

			if (verbUnit || verbKo) {
				const isOrigin = (verbUnit && hasTag(verbUnit, "origin", "departure", K.LOCATIVE_ORIGIN)) || state.ORIGIN_VERBS.has(verbKo);
				if (isOrigin) return nounKo + "에서";

				const isAllative = (verbUnit && hasTag(verbUnit, "allative", "destination", "goal", K.LOCATIVE_GOAL)) || state.ALLATIVE_GOAL_VERBS.has(verbKo);
				if (isAllative) return nounKo + "에";

				const isStatic = (verbUnit && hasTag(verbUnit, "static", "existence", "residence", K.LOCATIVE_STATIC)) || state.STATIC_EXISTENCE_VERBS.has(verbKo);
				if (isStatic) return nounKo + "에";

				const pos = verbUnit ? verbUnit[DATA_SCHEMA.PartofSpeech] : "";
				if (pos === K.ACTION_VERB || (!pos && !state.ALLATIVE_GOAL_VERBS.has(verbKo) && !state.STATIC_EXISTENCE_VERBS.has(verbKo))) {
					return nounKo + "에서";
				}
			}
			return nounKo + "에";
		}

		case "location_dynamic":
		case "dynamic_location":
			return nounKo + "에서";

		case "location_static":
		case "static_location":
			return nounKo + "에";

		case "location_origin":
		case "origin":
		case "departure":
			return nounKo + "에서";

		case "location_goal":
		case "destination":
		case "allative":
			return nounKo + "에";

		case "instrumental":
		case "instrument":
		case K.DIRECTION:
		case "direction_ro":
		case "-(으)로":
		case "로":
			return nounKo + (!hasB || hasRieul ? "로" : "으로");

		case "comitative":
		case "and_with":
			if (options.spoken === true || options.formality === "spoken") return nounKo + "하고";
			if (options.formality === K.INFORMAL) return nounKo + (hasB ? "이랑" : "랑");
			return nounKo + (hasB ? "과" : "와");

		case "source_person":
		case "ablative_person":
			return (options.spoken === true || options.formality === "spoken") ? nounKo + "한테서" : nounKo + "에게서";

		case "genitive":
			return nounKo + "의";

		case "additive":
			return nounKo + "도";

		case "plural":
			return nounKo + "들";

		case K.TIME:
		case "temporal":
			if (isDeicticTimeWord(nounUnit, nounKo)) {
				return (options.topic === true) ? nounKo + (hasB ? "은" : "는") : nounKo;
			}
			return nounKo + "에";

		default:
			return nounKo;
	}
}

// =========================================================================
// Predicate Conjugation & Mood Builders
// (getConjugatedStem is imported from ./stem_engine.js)
// =========================================================================

function isDescriptiveVerb(verbOrKo) {
	if (!verbOrKo) return false;
	const verbUnit = getVerbUnit(verbOrKo);
	if (verbUnit) {
		return verbUnit[DATA_SCHEMA.PartofSpeech] === K.DESCRIPTIVE_VERB || hasTag(verbUnit, "descriptive_verb");
	}
	const ko = typeof verbOrKo === 'string' ? verbOrKo : "";
	const getWords = dataModule.getWords || (typeof window !== 'undefined' ? window.getWords : () => []);
	const dv = getWords(K.DESCRIPTIVE_VERB).find(v => v[DATA_SCHEMA.Korean] === ko);
	return !!dv;
}

function isActionVerb(verbOrKo) {
	if (!verbOrKo) return false;
	const verbUnit = getVerbUnit(verbOrKo);
	if (verbUnit) {
		return verbUnit[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB || hasTag(verbUnit, "action_verb");
	}
	const ko = typeof verbOrKo === 'string' ? verbOrKo : "";
	const getWords = dataModule.getWords || (typeof window !== 'undefined' ? window.getWords : () => []);
	const av = getWords(K.ACTION_VERB).find(v => v[DATA_SCHEMA.Korean] === ko);
	return !!av;
}

function canTakeMood(verbOrKo, mood) {
	if (!verbOrKo) return false;
	const isUnit = Array.isArray(verbOrKo);
	const verbUnit = isUnit ? verbOrKo : getVerbUnit(verbOrKo);
	const ko = typeof verbOrKo === 'string' ? verbOrKo : (verbUnit ? verbUnit[DATA_SCHEMA.Korean] : "");
	const pos = verbUnit ? verbUnit[DATA_SCHEMA.PartofSpeech] : "";

	let isAction = false;
	let isDescriptive = false;

	if (isUnit) {
		isAction = pos === K.ACTION_VERB || hasTag(verbUnit, "action_verb");
		isDescriptive = pos === K.DESCRIPTIVE_VERB || hasTag(verbUnit, "descriptive_verb");
	} else {
		isAction = pos === K.ACTION_VERB || isActionVerb(ko);
		isDescriptive = pos === K.DESCRIPTIVE_VERB || (isDescriptiveVerb(ko) && !isAction);
	}

	const normalizedMood = (mood || "").toLowerCase();

	if ((normalizedMood === "negation" || normalizedMood === "short_negation" || normalizedMood === "long_negation") && state.FORBIDDEN_NEGATIVE_ROOTS.has(ko)) {
		return false;
	}

	const isInvoluntary = (verbUnit && hasTag(verbUnit, "involuntary", "passive", K.WEATHER) && ko !== "우산을 쓰다")
		|| ["끝나다", "시작되다", "고장 나다", "죽다", "생기다", "열리다", "닫히다"].some(k => ko.includes(k));

	if (normalizedMood === K.IMPERATIVE || normalizedMood === K.PROHIBITION || normalizedMood === K.PROPOSITIVE || normalizedMood === "suggestion") {
		return isAction && !isDescriptive && !isInvoluntary;
	}

	if (normalizedMood === K.INABILITY || normalizedMood === "short_inability" || normalizedMood === "long_inability") {
		return isAction && !isDescriptive;
	}

	if (normalizedMood === "volitional" || normalizedMood === "desire") {
		return isAction && !isDescriptive && !isInvoluntary;
	}

	if (normalizedMood === "negation" || normalizedMood === "short_general" || normalizedMood === "long_general") {
		return !state.FORBIDDEN_NEGATIVE_ROOTS.has(ko);
	}

	return true;
}

function getNegationSuppletion(verbOrKo) {
	const ko = typeof verbOrKo === 'string' ? verbOrKo : (verbOrKo ? verbOrKo[DATA_SCHEMA.Korean] : "");
	return state.NEGATION_SUPPLETIONS.get(ko) || null;
}

function getAffirmativeCounterpart(verbOrKo) {
	const ko = typeof verbOrKo === 'string' ? verbOrKo : (verbOrKo ? verbOrKo[DATA_SCHEMA.Korean] : "");
	return state.AFFIRMATIVE_COUNTERPARTS.get(ko) || null;
}

function conjugatePredicate(verbOrKo, formality = "polite", tense = K.PRESENT) {
	const verbUnit = getVerbUnit(verbOrKo);
	const ko = typeof verbOrKo === 'string' ? verbOrKo : (verbUnit ? verbUnit[DATA_SCHEMA.Korean] : "");
	if (!ko) return "";

	if (ko === "뵙다" || ko === "뵈다") {
		if (tense === K.PAST) {
			return (formality === "formal" || formality === "formal_polite") ? "뵀습니다" : "뵀어요";
		}
		if (tense === K.FUTURE) {
			return (formality === "formal" || formality === "formal_polite") ? "뵙겠습니다" : "뵐 거예요";
		}
		if (formality === "formal" || formality === "formal_polite") {
			return "뵙습니다";
		}
		return "봬요";
	}

	// Nominal Copula Predicates (통화중이다, 오랜만이다, 유행이다, 이다...)
	if (ko.endsWith("이다") && (verbUnit ? verbUnit[DATA_SCHEMA.PartofSpeech] === K.DESCRIPTIVE_VERB : Boolean(getNounUnit(ko.slice(0, -2)) && ko.slice(0, -2) !== "속"))) {
		const baseNoun = ko.slice(0, -2); // e.g. "통화중", "오랜만", "유행"
		if (baseNoun) {
			const hasB = hasBatchim(baseNoun.slice(-1));
			if (tense === K.PAST) {
				if (formality === "formal" || formality === "formal_polite") {
					return `${baseNoun}${hasB ? "이었습니다" : "였습니다"}`;
				}
				return `${baseNoun}${hasB ? "이었어요" : "였어요"}`;
			}
			if (tense === K.FUTURE) {
				if (formality === "formal" || formality === "formal_polite") {
					return `${baseNoun}일 것입니다`;
				}
				return `${baseNoun}일 거예요`;
			}
			if (formality === "formal" || formality === "formal_polite") {
				return `${baseNoun}입니다`;
			}
			return `${baseNoun}${hasB ? "이에요" : "예요"}`;
		}
	}

	const conj = verbUnit ? verbUnit[DATA_SCHEMA.Conjugation] : "";
	const stem = getConjugatedStem(ko, conj);
	const isAction = verbUnit ? verbUnit[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB : isActionVerb(ko);

	if (tense === K.PAST) {
		switch (formality) {
			case "formal":
			case "formal_polite":
				return applyMorphology(stem + "았/었습니다");
			case "plain":
				return applyMorphology(stem + "았/었다");
			case "polite":
			case "polite_informal":
			default:
				return applyMorphology(stem + "았/었어요");
		}
	} else if (tense === K.FUTURE) {
		switch (formality) {
			case "formal":
			case "formal_polite":
				return applyMorphology(stem + "으/ㄹ 것입니다");
			case "plain":
				return applyMorphology(stem + "으/ㄹ 것이다");
			case "polite":
			case "polite_informal":
			default:
				return applyMorphology(stem + "으/ㄹ 거예요");
		}
	} else {
		switch (formality) {
			case "formal":
			case "formal_polite":
				return applyMorphology(stem + "습니다/ㅂ니다");
			case "plain":
				return isAction ? applyMorphology(stem + "(느)ㄴ다") : (stem + "다");
			case "stem":
				return stem;
			case "polite":
			case "polite_informal":
			default:
				return applyMorphology(stem + "아/어요");
		}
	}
}

function buildNegatedPredicate(verbOrKo, options = {}) {
	const verbUnit = getVerbUnit(verbOrKo);
	const ko = typeof verbOrKo === 'string' ? verbOrKo : (verbUnit ? verbUnit[DATA_SCHEMA.Korean] : "");
	if (!ko) return "";

	const formality = options.formality || "polite";
	const tense = options.tense || K.PRESENT;
	const isInability = !!options.inability || options.type === K.INABILITY;
	const isLong = options.type === "long";

	const suppletive = getNegationSuppletion(ko);
	if (suppletive) {
		return conjugatePredicate(suppletive, formality, tense);
	}

	if (isInability) {
		if (!canTakeMood(verbOrKo, K.INABILITY)) {
			throw new Error(`Descriptive verb '${ko}' cannot take inability negation (못 / -지 못하다).`);
		}
		const conj = verbUnit ? verbUnit[DATA_SCHEMA.Conjugation] : "";
		const stem = getConjugatedStem(ko, conj);
		if (isLong) {
			return applyMorphology(stem + "지 " + conjugatePredicate("못하다", formality, tense));
		} else {
			const baseConj = conjugatePredicate(verbOrKo, formality, tense);
			if (ko.includes(" ")) {
				const parts = baseConj.split(" ");
				return `${parts[0]} 못 ${parts.slice(1).join(" ")}`;
			}
			return "못 " + baseConj;
		}
	}

	const conj = verbUnit ? verbUnit[DATA_SCHEMA.Conjugation] : "";
	const stem = getConjugatedStem(ko, conj);
	if (isLong) {
		return applyMorphology(stem + "지 " + conjugatePredicate("않다", formality, tense));
	} else {
		const baseConj = conjugatePredicate(verbOrKo, formality, tense);
		if (ko.includes(" ")) {
			const parts = baseConj.split(" ");
			return `${parts[0]} 안 ${parts.slice(1).join(" ")}`;
		}
		return "안 " + baseConj;
	}
}

function buildMoodPredicate(verbOrKo, mood, formality = "polite", options = {}) {
	const verbUnit = getVerbUnit(verbOrKo);
	const ko = typeof verbOrKo === 'string' ? verbOrKo : (verbUnit ? verbUnit[DATA_SCHEMA.Korean] : "");
	if (!ko) return "";

	const normalizedMood = (mood || "").toLowerCase();

	if (!canTakeMood(verbOrKo, normalizedMood)) {
		throw new Error(`Verb '${ko}' cannot take mood '${mood}'. Descriptive verbs are restricted from imperative, propositive, inability, and volitional moods.`);
	}

	const conj = verbUnit ? verbUnit[DATA_SCHEMA.Conjugation] : "";
	const stem = getConjugatedStem(ko, conj);
	const rawStem = getStem(ko);

	switch (normalizedMood) {
		case K.IMPERATIVE: {
			switch (formality) {
				case "formal":
				case "formal_polite":
				case K.FORMAL_HIGH:
					return applyMorphology(stem + "으/십시오");
				case "plain":
				case K.INFORMAL:
					return applyMorphology(stem + "아/어라");
				case "polite":
				default:
					return applyMorphology(stem + "으/세요");
			}
		}
		case K.PROHIBITION: {
			switch (formality) {
				case "formal":
				case "formal_polite":
				case K.FORMAL_HIGH:
					return rawStem + "지 마십시오";
				case "plain":
				case K.INFORMAL:
					return options.plainEnding === "마라" ? (rawStem + "지 마라") : (rawStem + "지 마");
				case "polite":
				default:
					return rawStem + "지 마세요";
			}
		}
		case K.PROPOSITIVE: {
			switch (formality) {
				case "formal":
				case "formal_polite":
				case K.FORMAL_HIGH:
					return applyMorphology(stem + "으/ㅂ시다");
				case "suggestion":
					return applyMorphology(stem + "으/ㄹ까요?");
				case "plain":
				case K.INFORMAL:
				default:
					return rawStem + "자";
			}
		}
		case "volitional":
		case "desire": {
			const isThirdPerson = options.person === 3 || options.perspective === "3rd";
			if (isThirdPerson) {
				switch (formality) {
					case "formal":
					case "formal_polite":
					case K.FORMAL_HIGH:
						return rawStem + "고 싶어합니다";
					case "plain":
						return rawStem + "고 싶어한다";
					case "polite":
					default:
						return rawStem + "고 싶어해요";
				}
			} else {
				switch (formality) {
					case "formal":
					case "formal_polite":
					case K.FORMAL_HIGH:
						return rawStem + "고 싶습니다";
					case "plain":
						return rawStem + "고 싶다";
					case "polite":
					default:
						return rawStem + "고 싶어요";
				}
			}
		}
		default:
			return conjugatePredicate(ko, formality, options.tense || K.PRESENT);
	}
}

// =========================================================================
// Lookup Map Caches & Query Helpers (Delegated to Unified Lexicon Index)
// =========================================================================

function getNounUnit(nounOrKo) {
	if (Array.isArray(nounOrKo)) return nounOrKo;
	if (typeof nounOrKo !== 'string') return null;
	return getLexiconIndex().nounByKo.get(nounOrKo) || null;
}

function getAllNounUnits(nounOrKo) {
	if (Array.isArray(nounOrKo)) return [nounOrKo];
	if (typeof nounOrKo !== 'string') return [];
	return getLexiconIndex().allNounsByKo.get(nounOrKo) || [];
}

function getVerbUnit(verbOrKo) {
	if (Array.isArray(verbOrKo)) return verbOrKo;
	if (typeof verbOrKo !== 'string') return null;
	return getLexiconIndex().verbByKo.get(verbOrKo) || null;
}

// =========================================================================
// Honorifics & Social Deixis Helpers
// =========================================================================

function getHonorificVerb(verbOrKo) {
	const ko = typeof verbOrKo === 'string' ? verbOrKo : (verbOrKo ? verbOrKo[DATA_SCHEMA.Korean] : "");
	return state.HONORIFIC_VERB_SUPPLETIONS.get(ko) || null;
}

function getHumbleVerb(verbOrKo) {
	const ko = typeof verbOrKo === 'string' ? verbOrKo : (verbOrKo ? verbOrKo[DATA_SCHEMA.Korean] : "");
	return state.HUMBLE_VERB_SUPPLETIONS.get(ko) || null;
}

function getHonorificNoun(nounOrKo) {
	const ko = typeof nounOrKo === 'string' ? nounOrKo : (nounOrKo ? nounOrKo[DATA_SCHEMA.Korean] : "");
	return state.HONORIFIC_NOUN_SUPPLETIONS.get(ko) || null;
}

function getHumblePronoun(pronounOrKo) {
	const ko = typeof pronounOrKo === 'string' ? pronounOrKo : (pronounOrKo ? pronounOrKo[DATA_SCHEMA.Korean] : "");
	return state.HUMBLE_PRONOUN_SUPPLETIONS.get(ko) || null;
}

function getPlainCounterpart(wordOrKo) {
	const ko = typeof wordOrKo === 'string' ? wordOrKo : (wordOrKo ? wordOrKo[DATA_SCHEMA.Korean] : "");
	return state.PLAIN_COUNTERPARTS.get(ko) || null;
}

function isHonorificWord(wordOrKo) {
	const ko = typeof wordOrKo === 'string' ? wordOrKo : (wordOrKo ? wordOrKo[DATA_SCHEMA.Korean] : "");
	return state.HONORIFIC_WORDS.has(ko);
}

function isHumbleWord(wordOrKo) {
	const ko = typeof wordOrKo === 'string' ? wordOrKo : (wordOrKo ? wordOrKo[DATA_SCHEMA.Korean] : "");
	return state.HUMBLE_WORDS.has(ko);
}

function isForbiddenForElder(wordOrKo) {
	const ko = typeof wordOrKo === 'string' ? wordOrKo : (wordOrKo ? wordOrKo[DATA_SCHEMA.Korean] : "");
	return state.FORBIDDEN_PLAIN_WORDS_FOR_ELDERS.has(ko);
}

function isElderNoun(nounUnit, nounKo = "") {
	// TODO is this already a set defined somewhere? could it be made into a set automatically generated on init?
	const NON_PERSON_HONORIFICS = new Set(["말씀", "진지", "연세", "댁", "생신", "병환", "약주", "치하", "성함", "존함", "이름", "나이"]);
	const name = nounKo || (nounUnit ? nounUnit[DATA_SCHEMA.Korean] : "");
	if (name && NON_PERSON_HONORIFICS.has(name)) return false;

	if (nounUnit) {
		if (hasTag(nounUnit, "honorific_noun")) return false;
		if (hasTag(nounUnit, K.ELDER_NOUN, "honorific_person", "elder", "kinship_elder")) return true;
		if (hasTag(nounUnit, K.CONCEPT, K.COMMUNICATION, K.FOOD, K.PLACE, "attribute", K.TIME) && !hasTag(nounUnit, K.PERSON, K.FAMILY, K.PROFESSION, "subject_animate")) return false;
		if (hasTag(nounUnit, K.HONORIFIC) && hasTag(nounUnit, K.PERSON, K.FAMILY, K.PROFESSION, "subject_animate")) return true;
		const sv = parseSemanticVector(nounUnit);
		if (sv && sv.honorific === true && hasTag(nounUnit, K.PERSON, K.FAMILY, K.PROFESSION, "subject_animate")) return true;
		if (state.ELDER_NOUN_TITLES.has(name) || (name && name.endsWith('님') && hasTag(nounUnit, K.PERSON))) return true;
	}
	if (nounKo) {
		if (state.ELDER_NOUN_TITLES.has(nounKo) || nounKo.endsWith('님')) return true;
	}
	return false;
}

function isInanimateInstitution(nounUnit, nounKo = "") {
	if (nounUnit) {
		if (hasTag(nounUnit, K.INANIMATE_INSTITUTION)) return true;
		if (hasTag(nounUnit, K.PERSON, "animal", K.FAMILY, K.PROFESSION, "subject_animate")) return false;
		if (hasTag(nounUnit, "institution", K.FACILITY, "organization", "workplace", K.PLACE, "place_indoor", "place_outdoor")) return true;
	}
	if (nounKo && state.INANIMATE_INSTITUTION_NAMES.has(nounKo)) return true;
	return false;
}

function isDeicticTimeWord(nounUnit, nounKo = "") {
	const ko = nounKo || (nounUnit ? nounUnit[DATA_SCHEMA.Korean] : "");
	if (ko && state.BARE_TIME_WORDS_NO_PARTICLE.has(ko)) return true;
	if (nounUnit) {
		if (hasTag(nounUnit, "no_time_particle")) return true;
		const sv = parseSemanticVector(nounUnit);
		if (sv && sv.no_time_particle === true) return true;
	}
	return false;
}

function getTemporalPolarity(wordOrUnit) {
	if (!wordOrUnit) return null;
	const ko = typeof wordOrUnit === 'string' ? wordOrUnit : (Array.isArray(wordOrUnit) ? wordOrUnit[DATA_SCHEMA.Korean] : "");
	const unit = typeof wordOrUnit === 'object' && Array.isArray(wordOrUnit) ? wordOrUnit : (getNounUnit(ko) || getVerbUnit(ko));
	const id = unit ? unit[DATA_SCHEMA.Id] : (typeof wordOrUnit === 'number' ? wordOrUnit : null);

	if (ko && state.PAST_TIME_WORDS.has(ko)) return K.PAST;
	if (id !== null && state.PAST_GRAMMAR_IDS.has(id)) return K.PAST;

	if (ko && state.FUTURE_TIME_WORDS.has(ko)) return K.FUTURE;
	if (id !== null && state.FUTURE_GRAMMAR_IDS.has(id)) return K.FUTURE;

	if (ko && state.PRESENT_TIME_WORDS.has(ko)) return K.PRESENT;
	if (id !== null && state.PRESENT_GRAMMAR_IDS.has(id)) return K.PRESENT;

	if (unit) {
		if (hasTag(unit, "temporal_past", K.PAST)) return K.PAST;
		if (hasTag(unit, "temporal_future", K.FUTURE)) return K.FUTURE;
		if (hasTag(unit, "temporal_present", K.PRESENT)) return K.PRESENT;
		const sv = parseSemanticVector(unit);
		if (sv && sv.tense) return sv.tense;
	}
	return null;
}

function filterWordsByTense(words, tense) {
	if (!words || words.length === 0 || !tense) return words || [];
	let filtered = words;
	if (tense === K.PAST) {
		filtered = words.filter(w => {
			const ko = typeof w === 'string' ? w : (Array.isArray(w) ? w[DATA_SCHEMA.Korean] : "");
			if (ko === "요즘" || ko === "지금") return false;
			const pol = getTemporalPolarity(w);
			return pol !== K.FUTURE;
		});
	} else if (tense === K.FUTURE) {
		filtered = words.filter(w => {
			const ko = typeof w === 'string' ? w : (Array.isArray(w) ? w[DATA_SCHEMA.Korean] : "");
			if (ko === "요즘") return false;
			const pol = getTemporalPolarity(w);
			return pol !== K.PAST;
		});
	} else if (tense === K.PRESENT) {
		filtered = words.filter(w => {
			const pol = getTemporalPolarity(w);
			return pol !== K.PAST && pol !== K.FUTURE;
		});
	}
	return filtered.length > 0 ? filtered : words;
}

function filterGrammarByTense(grammars, tense) {
	if (!grammars || grammars.length === 0 || !tense) return grammars || [];
	let filtered = grammars;
	if (tense === K.PAST) {
		filtered = grammars.filter(g => {
			const id = g[DATA_SCHEMA.Id];
			if (state.FUTURE_GRAMMAR_IDS.has(id)) return false;
			const sv = parseSemanticVector(g);
			return sv.tense !== K.FUTURE;
		});
	} else if (tense === K.FUTURE) {
		filtered = grammars.filter(g => {
			const id = g[DATA_SCHEMA.Id];
			if (state.PAST_GRAMMAR_IDS.has(id)) return false;
			const sv = parseSemanticVector(g);
			return sv.tense !== K.PAST;
		});
	} else if (tense === K.PRESENT) {
		filtered = grammars.filter(g => {
			const id = g[DATA_SCHEMA.Id];
			if (state.PAST_GRAMMAR_IDS.has(id) || state.FUTURE_GRAMMAR_IDS.has(id)) return false;
			const sv = parseSemanticVector(g);
			return sv.tense !== K.PAST && sv.tense !== K.FUTURE;
		});
	}
	return filtered.length > 0 ? filtered : grammars;
}

// =========================================================================
// Verb Phrase Building
// =========================================================================

function getVerbParticleType(verbUnit) {
	const sv = parseSemanticVector(verbUnit);
	if (sv && typeof sv.particle === 'string' && sv.particle) return sv.particle;
	if (hasTag(verbUnit, K.DATIVE_PERSON)) return K.DATIVE;
	if (hasTag(verbUnit, K.INTRANSITIVE_MOTION, K.INTRANSITIVE_PLACE)) return K.LOCATION;
	const spec = ACTION_VERB_SPECS.find(s => hasTag(verbUnit, s.tag));
	if (spec && spec.particle) return spec.particle;
	return K.OBJECT;
}

function getNounCandidatesForVerb(verbUnit) {
	if (!verbUnit) return [];
	const idx = !state.currentUsageFilter ? getLexiconIndex() : null;
	const unitId = verbUnit[DATA_SCHEMA.Id];
	if (idx && typeof unitId === 'number' && idx.verbCandidateCache.has(unitId)) {
		return idx.verbCandidateCache.get(unitId);
	}
	const cacheAndReturn = (res) => {
		const cleaned = Array.isArray(res)
			? res.filter(n => !hasTag(n, "possessive") && !(parseSemanticVector(n) && parseSemanticVector(n).en && parseSemanticVector(n).en.possOnly))
			: res;
		if (idx && typeof unitId === 'number') idx.verbCandidateCache.set(unitId, cleaned);
		return cleaned;
	};

	const sv = parseSemanticVector(verbUnit);
	const getFilteredWords = resolveGetFilteredWords();

	if (sv && sv.collocation_filter) {
		const filterFn = getCompiledCollocationFilter(verbUnit, parseAndValidateCollocationFilter);
		if (filterFn) {
			const allNouns = getFilteredWords(K.NOUN);
			const matched = allNouns.filter(n => {
				try {
					return filterFn(n, hasTag);
				} catch (e) { return false; }
			});
			if (matched.length > 0) return cacheAndReturn(matched);
		}
	}

	const verbAllowsTeeth = Boolean((sv && sv.allows_teeth) || hasTag(verbUnit, "teeth"));

	if (sv && sv.req && sv.req !== 'any') {
		let reqNouns = getFilteredWords(K.NOUN, sv.req).filter(n => !hasTag(n, K.MEASUREWORD));
		if (!verbAllowsTeeth) {
			reqNouns = reqNouns.filter(n => n[DATA_SCHEMA.Korean] !== "이" && n[DATA_SCHEMA.Id] !== 361);
		}
		if (sv.req === K.FOOD || sv.req === K.DRINK || hasTag(verbUnit, "cooking")) {
			reqNouns = reqNouns.filter(n => !hasTag(n, K.PLACE, K.FACILITY, "restaurant", "store", "bakery", "honorific_noun"));
		}
		if (reqNouns.length > 0) return cacheAndReturn(reqNouns);
	}

	for (const spec of ACTION_VERB_SPECS) {
		if (hasTag(verbUnit, spec.tag)) {
			let words = getFilteredWords(K.NOUN, spec.nounTag).filter(n => !hasTag(n, K.MEASUREWORD));
			if (spec.preferDomain) {
				const domainWords = words.filter(w => parseSemanticVector(w).domain);
				if (domainWords.length > 0) words = domainWords;
			}
			if (words.length === 0 && spec.fallbackTag !== undefined) {
				words = getFilteredWords(K.NOUN, spec.fallbackTag || undefined).filter(n => !hasTag(n, K.MEASUREWORD));
			}
			if (words.length > 0) {
				if (!verbAllowsTeeth) {
					words = words.filter(n => n[DATA_SCHEMA.Korean] !== "이");
				}
				if (words.length > 0) return cacheAndReturn(words);
			}
		}
	}

	let fallback = getFilteredWords(K.NOUN, K.OBJECT).filter(n => !hasTag(n, K.MEASUREWORD) && n[DATA_SCHEMA.Korean] !== "이");
	if (fallback.length === 0) fallback = getFilteredWords(K.NOUN).filter(n => !hasTag(n, K.MEASUREWORD) && n[DATA_SCHEMA.Korean] !== "이");
	return cacheAndReturn(fallback);
}

function getSubjectCandidatesForDescriptiveVerb(dvUnit) {
	if (!dvUnit) return [];
	const idx = !state.currentUsageFilter ? getLexiconIndex() : null;
	const unitId = dvUnit[DATA_SCHEMA.Id];
	if (idx && typeof unitId === 'number' && idx.dvCandidateCache.has(unitId)) {
		return idx.dvCandidateCache.get(unitId);
	}
	const cacheAndReturn = (res) => {
		const cleaned = Array.isArray(res)
			? res.filter(n =>
				!hasTag(n, K.QUESTION_WORD, K.INTERROGATIVE, "possessive")
				&& !(parseSemanticVector(n) && parseSemanticVector(n).en && parseSemanticVector(n).en.possOnly)
			)
			: res;
		if (idx && typeof unitId === 'number') idx.dvCandidateCache.set(unitId, cleaned);
		return cleaned;
	};

	const sv = parseSemanticVector(dvUnit);
	const getFilteredWords = resolveGetFilteredWords();

	if (sv && sv.collocation_filter) {
		const filterFn = getCompiledCollocationFilter(dvUnit, parseAndValidateCollocationFilter);
		if (filterFn) {
			const allNouns = getFilteredWords(K.NOUN);
			const matched = allNouns.filter(n => {
				try {
					return filterFn(n, hasTag);
				} catch (e) { return false; }
			});
			if (matched.length > 0) return cacheAndReturn(matched);
		}
	}

	const dvKorean = dvUnit[DATA_SCHEMA.Korean] || "";
	const restrictAnimatePerson = dvKorean !== "필요하다";
	const dvAllowsTeeth = Boolean((sv && sv.allows_teeth) || hasTag(dvUnit, "teeth"));

	if (sv && sv.req && sv.req !== 'any') {
		let reqNouns = getFilteredWords(K.NOUN, sv.req).filter(n => !hasTag(n, K.MEASUREWORD));
		if (restrictAnimatePerson && (sv.req === K.PERSON || hasTag(dvUnit, K.DESCRIPTIVE_PERSON))) {
			reqNouns = filterAnimatePersonSubjects(reqNouns);
		}
		if (!dvAllowsTeeth) {
			reqNouns = reqNouns.filter(n => n[DATA_SCHEMA.Korean] !== "이" && n[DATA_SCHEMA.Id] !== 361);
		}
		if (reqNouns.length > 0) return cacheAndReturn(reqNouns);
	}

	for (const spec of DESCRIPTIVE_VERB_SPECS) {
		if (hasTag(dvUnit, spec.tag)) {
			let words = getFilteredWords(K.NOUN, spec.nounTag).filter(n => !hasTag(n, K.MEASUREWORD));
			if (restrictAnimatePerson && (spec.nounTag === K.PERSON || hasTag(dvUnit, K.DESCRIPTIVE_PERSON))) {
				words = filterAnimatePersonSubjects(words);
			}
			if (spec.preferDomain) {
				const domainWords = words.filter(w => parseSemanticVector(w).domain);
				if (domainWords.length > 0) words = domainWords;
			}
			if (words.length === 0 && spec.fallbackTag !== undefined) {
				words = getFilteredWords(K.NOUN, spec.fallbackTag || undefined).filter(n => !hasTag(n, K.MEASUREWORD));
			}
			if (words.length > 0) {
				if (!dvAllowsTeeth) {
					words = words.filter(n => n[DATA_SCHEMA.Korean] !== "이");
				}
				if (words.length > 0) return cacheAndReturn(words);
			}
		}
	}

	let fallback = getFilteredWords(K.NOUN, K.OBJECT).filter(n => !hasTag(n, K.MEASUREWORD) && n[DATA_SCHEMA.Korean] !== "이");
	if (fallback.length === 0) fallback = getFilteredWords(K.NOUN).filter(n => !hasTag(n, K.MEASUREWORD) && n[DATA_SCHEMA.Korean] !== "이");
	return cacheAndReturn(fallback);
}

function getRandom(arr) {
	if (!arr || arr.length === 0) return null;
	const rnd = (state && typeof state.seededRandom === 'function') ? state.seededRandom() : Math.random();
	return arr[Math.floor(rnd * arr.length)];
}

function markUnitUsed(unit) {
	if (unit && typeof unit[DATA_SCHEMA.Id] === 'number') {
		state.usedUnitIds.add(unit[DATA_SCHEMA.Id]);
	}
}

function buildActionVerbPhrase(word, stem, chosenNoun = null, options = {}) {
	let activeWord = word;
	let activeStem = stem;

	const isSubjectElder = options.honorific === true || (options.subject && isElderNoun(options.subject));
	const isRecipientElder = (options.recipient && isElderNoun(options.recipient)) || (options.dativeRecipient && isElderNoun(options.dativeRecipient)) || options.dativeType === K.HONORIFIC;

	if (isSubjectElder) {
		const suppletiveKo = getHonorificVerb(activeWord);
		if (suppletiveKo) {
			const suppletiveUnit = getVerbUnit(suppletiveKo);
			if (suppletiveUnit) {
				activeWord = suppletiveUnit;
				activeStem = getConjugatedStem(suppletiveKo, suppletiveUnit[DATA_SCHEMA.Conjugation]);
			} else {
				activeStem = getStem(suppletiveKo);
			}
		}
	}

	if (isRecipientElder) {
		const humbleKo = getHumbleVerb(activeWord);
		if (humbleKo) {
			const humbleUnit = getVerbUnit(humbleKo);
			if (humbleUnit) {
				activeWord = humbleUnit;
				activeStem = getConjugatedStem(humbleKo, humbleUnit[DATA_SCHEMA.Conjugation]);
			} else {
				activeStem = getStem(humbleKo);
			}
		}
	}

	const isPureIntransitive = (hasTag(activeWord, K.INTRANSITIVE_GENERAL) || hasTag(activeWord, K.INTRANSITIVE_MOTION) || hasTag(activeWord, K.INTRANSITIVE_PLACE))
		&& !ACTION_VERB_SPECS.some(s => s.particle === K.OBJECT && hasTag(activeWord, s.tag))
		&& !parseSemanticVector(activeWord).collocation_filter;

	const getFilteredWords = resolveGetFilteredWords();
	const getWords = dataModule.getWords || (typeof window !== 'undefined' ? window.getWords : () => []);

	if (isPureIntransitive) {
		if (hasTag(activeWord, K.INTRANSITIVE_MOTION) || hasTag(activeWord, K.INTRANSITIVE_PLACE)) {
			const placeNoun = chosenNoun || getRandom(getFilteredWords(K.NOUN, K.PLACE)) || getRandom(getWords(K.NOUN, K.PLACE));
			if (placeNoun) {
				markUnitUsed(placeNoun);
				return { text: `${attachParticle(placeNoun, K.LOCATION, activeWord, options)} ${activeStem}`, noun: placeNoun, verb: activeWord };
			}
		}
		return { text: activeStem, noun: null, verb: activeWord };
	}

	let noun = chosenNoun;
	if (!noun) {
		const candidates = getNounCandidatesForVerb(activeWord);
		noun = getRandom(candidates);
		if (noun) markUnitUsed(noun);
	}
	if (!noun) return { text: activeStem, noun: null, verb: activeWord };

	if (isSubjectElder) {
		const suppletiveNounKo = getHonorificNoun(noun);
		if (suppletiveNounKo) {
			const suppletiveNounUnit = getNounUnit(suppletiveNounKo);
			if (suppletiveNounUnit) noun = suppletiveNounUnit;
		}
	}

	const particleType = getVerbParticleType(activeWord);
	const particleOptions = { ...options };
	if (isRecipientElder && (particleType === K.DATIVE || particleType === K.DATIVE_PERSON)) {
		particleOptions.dativeType = K.HONORIFIC;
	}

	return { text: `${attachParticle(noun, particleType, activeWord, particleOptions)} ${activeStem}`, noun, verb: activeWord };
}

function buildDescriptiveVerbPhrase(word, stem, chosenNoun = null, options = {}) {
	let noun = chosenNoun;
	if (!noun) {
		const candidates = getSubjectCandidatesForDescriptiveVerb(word);
		noun = getRandom(candidates);
		if (noun) markUnitUsed(noun);
	}
	if (!noun) return { text: stem, noun: null, verb: word };

	let activeWord = word;
	let activeStem = stem;
	const isHonorificMode = options.honorific === true;
	const isElder = isElderNoun(noun);

	if (isHonorificMode && isElder) {
		const suppletiveKo = getHonorificVerb(activeWord);
		if (suppletiveKo) {
			const suppletiveUnit = getVerbUnit(suppletiveKo);
			if (suppletiveUnit) {
				activeWord = suppletiveUnit;
				activeStem = getConjugatedStem(suppletiveKo, suppletiveUnit[DATA_SCHEMA.Conjugation]);
			} else {
				activeStem = getStem(suppletiveKo);
			}
		}
	}

	const particleOptions = { ...options };
	if (isHonorificMode && isElder) {
		particleOptions.allowHonorificSubject = true;
	}
	return { text: `${attachParticle(noun, K.SUBJECT, activeWord, particleOptions)} ${activeStem}`, noun, verb: activeWord };
}

function getHonorificPredicate(verbOrKo, formality = "polite", options = {}) {
	const verbUnit = getVerbUnit(verbOrKo);
	const verbKo = verbUnit ? verbUnit[DATA_SCHEMA.Korean] : (typeof verbOrKo === 'string' ? verbOrKo : "");
	if (!verbKo) return "";

	if (options.indirectHonorific === true && verbKo === "있다") {
		const conj = verbUnit ? verbUnit[DATA_SCHEMA.Conjugation] : "";
		const stem = getConjugatedStem("있다", conj);
		switch (formality) {
			case "formal":
			case "formal_polite":
				return applyMorphology(stem + "으/십니다");
			case "formal_question":
				return applyMorphology(stem + "으/십니까?");
			case K.PAST:
			case "past_polite":
				return applyMorphology(stem + "으/셨어요");
			case "past_formal":
				return applyMorphology(stem + "으/셨습니다");
			case K.IMPERATIVE:
			case "imperative_polite":
				return applyMorphology(stem + "으/세요");
			case "imperative_formal":
				return applyMorphology(stem + "으/십시오");
			case K.INFORMAL:
			case "banmal":
				return applyMorphology(stem + "으/셔");
			case "stem":
				return applyMorphology(stem + "으/시");
			case "polite":
			case "polite_informal":
			default:
				return applyMorphology(stem + "으/세요");
		}
	}

	const suppletiveKo = state.HONORIFIC_VERB_SUPPLETIONS.get(verbKo);
	const effectiveVerbKo = suppletiveKo || verbKo;
	const effectiveUnit = suppletiveKo ? getVerbUnit(suppletiveKo) : verbUnit;

	if (suppletiveKo) {
		const stem = getStem(suppletiveKo);
		const base = stem.slice(0, -1);
		switch (formality) {
			case "formal":
			case "formal_polite":
				return base + "십니다";
			case "formal_question":
				return base + "십니까?";
			case K.PAST:
			case "past_polite":
				return base + "셨어요";
			case "past_formal":
				return base + "셨습니다";
			case K.IMPERATIVE:
			case "imperative_polite":
				return base + "세요";
			case "imperative_formal":
				return stem + "십시오";
			case K.INFORMAL:
			case "banmal":
				return base + "셔";
			case "stem":
				return stem;
			case "polite":
			case "polite_informal":
			default:
				return base + "세요";
		}
	}

	const conj = effectiveUnit ? effectiveUnit[DATA_SCHEMA.Conjugation] : "";
	const stem = getConjugatedStem(effectiveVerbKo, conj);

	switch (formality) {
		case "formal":
		case "formal_polite":
			return applyMorphology(stem + "으/십니다");
		case "formal_question":
			return applyMorphology(stem + "으/십니까?");
		case K.PAST:
		case "past_polite":
			return applyMorphology(stem + "으/셨어요");
		case "past_formal":
			return applyMorphology(stem + "으/셨습니다");
		case K.IMPERATIVE:
		case "imperative_polite":
			return applyMorphology(stem + "으/세요");
		case "imperative_formal":
			return applyMorphology(stem + "으/십시오");
		case K.INFORMAL:
		case "banmal":
			return applyMorphology(stem + "으/셔");
		case "stem":
			return applyMorphology(stem + "으/시");
		case "polite":
		case "polite_informal":
		default:
			return applyMorphology(stem + "으/세요");
	}
}

function getHumblePredicate(verbOrKo, formality = "polite", options = {}) {
	const verbUnit = getVerbUnit(verbOrKo);
	const verbKo = verbUnit ? verbUnit[DATA_SCHEMA.Korean] : (typeof verbOrKo === 'string' ? verbOrKo : "");
	if (!verbKo) return "";

	const humbleKo = state.HUMBLE_VERB_SUPPLETIONS.get(verbKo) || verbKo;
	const humbleUnit = getVerbUnit(humbleKo);

	if (humbleKo === "여쭙다") {
		switch (formality) {
			case "formal":
			case "formal_polite":
				return "여쭙니다";
			case "formal_question":
				return "여쭙니까?";
			case K.PAST:
			case "past_polite":
				return "여쭸어요";
			case "past_formal":
				return "여쭸습니다";
			case K.INFORMAL:
			case "banmal":
				return "여쭤";
			case "stem":
				return "여쭙";
			case "polite":
			case "polite_informal":
			default:
				return "여쭤요";
		}
	}

	if (humbleKo === "뵙다") {
		switch (formality) {
			case "formal":
			case "formal_polite":
				return "뵙습니다";
			case "formal_question":
				return "뵙습니까?";
			case K.PAST:
			case "past_polite":
				return "뵀어요";
			case "past_formal":
				return "뵀습니다";
			case K.INFORMAL:
			case "banmal":
				return "봬";
			case "stem":
				return "뵙";
			case "polite":
			case "polite_informal":
			default:
				return "봬요";
		}
	}

	const conj = humbleUnit ? humbleUnit[DATA_SCHEMA.Conjugation] : "";
	const stem = getConjugatedStem(humbleKo, conj);

	switch (formality) {
		case "formal":
		case "formal_polite":
			return applyMorphology(stem + "습니다/ㅂ니다");
		case "formal_question":
			return applyMorphology(stem + "습니까/ㅂ니까?");
		case K.PAST:
		case "past_polite":
			return applyMorphology(stem + "았/었어요");
		case "past_formal":
			return applyMorphology(stem + "았/었습니다");
		case K.INFORMAL:
		case "banmal":
			return applyMorphology(stem + "아/어");
		case "stem":
			return stem;
		case "polite":
		case "polite_informal":
		default:
			return applyMorphology(stem + "아/어요");
	}
}

function applyHonorificConcord(input, options = {}) {
	if (typeof input === 'object' && input !== null) {
		const subj = input.subject || options.subject;
		const isElder = isElderNoun(subj) || options.honorific === true;
		const recip = input.recipient || options.recipient || options.dativeRecipient;
		const isElderRecip = isElderNoun(recip) || options.dativeType === K.HONORIFIC;

		let verb = input.verb || options.verb;
		let noun = input.noun || options.noun;
		let pronoun = input.pronoun || options.pronoun;

		if (isElder) {
			if (verb) {
				const hv = getHonorificVerb(verb);
				if (hv) verb = getVerbUnit(hv) || hv;
			}
			if (noun) {
				const hn = getHonorificNoun(noun);
				if (hn) noun = getNounUnit(hn) || hn;
			}
		}

		if (isElderRecip && verb) {
			const uv = getHumbleVerb(verb);
			if (uv) verb = getVerbUnit(uv) || uv;
		}

		if ((isElder || isElderRecip) && pronoun) {
			const hp = getHumblePronoun(pronoun);
			if (hp) pronoun = hp;
		}

		let text = input.text || "";
		if (text) {
			text = applyHonorificConcord(text, { ...options, subject: subj, recipient: recip });
		}

		return { text, subject: subj, verb, noun, recipient: recip, pronoun };
	}

	let str = String(input);

	for (const elder of state.ELDER_NOUN_TITLES) {
		const subjRegex = new RegExp(`(^|[^가-힣])(${elder})(이|가)([^가-힣]|$)`, 'g');
		str = str.replace(subjRegex, '$1$2께서$4');

		const topRegex = new RegExp(`(^|[^가-힣])(${elder})는([^가-힣]|$)`, 'g');
		str = str.replace(topRegex, '$1$2께서는$3');

		const datRegex = new RegExp(`(^|[^가-힣])(${elder})(에게|한테)([^가-힣]|$)`, 'g');
		str = str.replace(datRegex, '$1$2께$4');
	}

	str = str.replace(/([가-힣]+님)(이|가)([^가-힣]|$)/g, '$1께서$3');
	str = str.replace(/([가-힣]+님)(에게|한테)([^가-힣]|$)/g, '$1께$3');

	const isElderContext = options.honorific === true || (options.subject && isElderNoun(options.subject)) || /께서/.test(str);
	if (isElderContext) {
		for (const [plain, hon] of state.HONORIFIC_NOUN_SUPPLETIONS.entries()) {
			const nounRegex = new RegExp(`(^|[^가-힣])(${plain})([을를이가은는의도]?)([^가-힣]|$)`, 'g');
			str = str.replace(nounRegex, (m, pre, base, part, post) => {
				const attached = part ? attachParticle(hon, part === '을' || part === '를' ? K.OBJECT : part === '이' || part === '가' ? K.SUBJECT : part === '은' || part === '는' ? K.TOPIC : part === '의' ? 'genitive' : 'additive') : hon;
				return pre + attached + post;
			});
		}

		str = str.replace(/(^|[^가-힣])자(요|다|고|며|서)([^가-힣]|$)/g, '$1주무세$2$3');
		str = str.replace(/(^|[^가-힣])잡니다([^가-힣]|$)/g, '$1주무십니다$2');
		str = str.replace(/(^|[^가-힣])잤어요([^가-힣]|$)/g, '$1주무셨어요$2');
		str = str.replace(/(^|[^가-힣])잤습니다([^가-힣]|$)/g, '$1주무셨습니다$2');

		str = str.replace(/(^|[^가-힣])먹(어요|다|고|으며|어서)([^가-힣]|$)/g, (m, pre, end, post) => {
			const rep = end === '어요' ? '드세요' : end === '다' ? '드시다' : end === '고' ? '드시고' : end === '으며' ? '드시며' : '드셔서';
			return pre + rep + post;
		});
		str = str.replace(/(^|[^가-힣])먹습니다([^가-힣]|$)/g, '$1드십니다$2');
		str = str.replace(/(^|[^가-힣])먹었어요([^가-힣]|$)/g, '$1드셨어요$2');
		str = str.replace(/(^|[^가-힣])먹었습니다([^가-힣]|$)/g, '$1드셨습니다$2');

		str = str.replace(/(^|[^가-힣])마(셔요|시다|시고|셔서)([^가-힣]|$)/g, (m, pre, end, post) => {
			const rep = end === '셔요' ? '드세요' : end === '시다' ? '드시다' : end === '시고' ? '드시고' : '드셔서';
			return pre + rep + post;
		});
		str = str.replace(/(^|[^가-힣])마십니다([^가-힣]|$)/g, '$1드십니다$2');

		str = str.replace(/(^|[^가-힣])아(파요|프다|파서)([^가-힣]|$)/g, (m, pre, end, post) => {
			const rep = end === '파요' ? '편찮으세요' : end === '프다' ? '편찮으시다' : '편찮으셔서';
			return pre + rep + post;
		});
		str = str.replace(/(^|[^가-힣])아픕니다([^가-힣]|$)/g, '$1편찮으십니다$2');

		str = str.replace(/(^|[^가-힣])죽(었어요|었다|었습니다)([^가-힣]|$)/g, (m, pre, end, post) => {
			const rep = end === '었어요' ? '돌아가셨어요' : end === '었다' ? '돌아가셨다' : '돌아가셨습니다';
			return pre + rep + post;
		});
	}

	const isElderRecipContext = (options.recipient && isElderNoun(options.recipient)) || (options.dativeRecipient && isElderNoun(options.dativeRecipient)) || /께\s+/.test(str);
	if (isElderRecipContext) {
		str = str.replace(/(^|[^가-힣])주(어요|어|다|고|며|어서)([^가-힣]|$)/g, (m, pre, end, post) => {
			const rep = end === '어요' ? '드려요' : end === '어' ? '드려' : end === '다' ? '드리다' : end === '고' ? '드리고' : end === '며' ? '드리며' : '드려서';
			return pre + rep + post;
		});
		str = str.replace(/(^|[^가-힣])줘요([^가-힣]|$)/g, '$1드려요$2');
		str = str.replace(/(^|[^가-힣])줍니다([^가-힣]|$)/g, '$1드립니다$2');
		str = str.replace(/(^|[^가-힣])줬어요([^가-힣]|$)/g, '$1드렸어요$2');
		str = str.replace(/(^|[^가-힣])줬습니다([^가-힣]|$)/g, '$1드렸습니다$2');

		str = str.replace(/(^|[^가-힣])말(해요|합니다|하다|하고|해서)([^가-힣]|$)/g, (m, pre, end, post) => {
			const rep = end === '해요' ? '말씀드려요' : end === '합니다' ? '말씀드립니다' : end === '하다' ? '말씀드리다' : end === '하고' ? '말씀드리고' : '말씀드려서';
			return pre + rep + post;
		});

		str = str.replace(/(^|[^가-힣])물(어요|어|어서)([^가-힣]|$)/g, '$1여쭤$2$3');
		str = str.replace(/(^|[^가-힣])묻(습니다|다|고)([^가-힣]|$)/g, (m, pre, end, post) => {
			const rep = end === '습니다' ? '여쭙니다' : end === '다' ? '여쭙다' : '여쭈고';
			return pre + rep + post;
		});

		str = str.replace(/(^|[^가-힣])만(나요|납니다|나다|나서|나고)([^가-힣]|$)/g, (m, pre, end, post) => {
			const rep = end === '나요' ? '봬요' : end === '납니다' ? '뵙습니다' : end === '나다' ? '뵙다' : end === '나서' ? '봬서' : '뵙고';
			return pre + rep + post;
		});

		str = str.replace(/(^|[^가-힣])내가([^가-힣]|$)/g, '$1제가$2');
		str = str.replace(/(^|[^가-힣])나는([^가-힣]|$)/g, '$1저는$2');
		str = str.replace(/(^|[^가-힣])나를([^가-힣]|$)/g, '$1저를$2');
		str = str.replace(/(^|[^가-힣])우리가([^가-힣]|$)/g, '$1저희가$2');
		str = str.replace(/(^|[^가-힣])우리는([^가-힣]|$)/g, '$1저희는$2');
	}

	return str;
}

function validateHonorificConcord(input, context = {}) {
	const errors = [];
	const text = typeof input === 'string' ? input : (input && input.text ? input.text : "");
	const subj = (input && input.subject) || context.subject;
	const recip = (input && input.recipient) || context.recipient || context.dativeRecipient;
	const verb = (input && input.verb) || context.verb;
	const noun = (input && input.noun) || context.noun;

	const verbKo = verb ? (typeof verb === 'string' ? verb : verb[DATA_SCHEMA.Korean]) : "";
	const nounKo = noun ? (typeof noun === 'string' ? noun : noun[DATA_SCHEMA.Korean]) : "";
	const subjKo = subj ? (typeof subj === 'string' ? subj : subj[DATA_SCHEMA.Korean]) : "";
	const recipKo = recip ? (typeof recip === 'string' ? recip : recip[DATA_SCHEMA.Korean]) : "";

	const isSubjectElder = isElderNoun(subj, subjKo) || context.honorific === true || /께서/.test(text);
	const isRecipientElder = isElderNoun(recip, recipKo) || /께\s+/.test(text) || context.dativeType === K.HONORIFIC;

	if (context.honorific === true || isElderNoun(subj, subjKo)) {
		if (subjKo) {
			const hasPlainSubj = new RegExp(`(^|[^가-힣])${subjKo}(이|가)([^가-힣]|$)`).test(text);
			if (hasPlainSubj) {
				errors.push(`Elder subject '${subjKo}' must take honorific subject particle '-께서', not '-이/가'`);
			}
		}
	}

	if (isSubjectElder) {
		if (verbKo && state.FORBIDDEN_PLAIN_WORDS_FOR_ELDERS.has(verbKo)) {
			const honVerb = state.HONORIFIC_VERB_SUPPLETIONS.get(verbKo);
			errors.push(`Respected elder subject cannot use plain verb '${verbKo}' (supplete to '${honVerb}')`);
		}
		if (/(^|[^가-힣])(자요|잡니다|자다|자고|잤어요|잤다)([^가-힣]|$)/.test(text)) {
			errors.push(`Forbidden plain verb '자다' used with respected elder subject (expected '주무시다')`);
		}
		if (/(^|[^가-힣])(먹어요|먹습니다|먹다|먹고|먹었어요|먹었다)([^가-힣]|$)/.test(text)) {
			errors.push(`Forbidden plain verb '먹다' used with respected elder subject (expected '드시다')`);
		}
		if (/(^|[^가-힣])(마셔요|마십니다|마시다|마셨어요)([^가-힣]|$)/.test(text)) {
			errors.push(`Forbidden plain verb '마시다' used with respected elder subject (expected '드시다')`);
		}
		if (/(^|[^가-힣])(아파요|아픕니다|아프다|아팠어요)([^가-힣]|$)/.test(text)) {
			errors.push(`Forbidden plain verb '아프다' used with respected elder subject (expected '편찮으시다')`);
		}
		if (/(^|[^가-힣])(죽었어요|죽었다|죽습니다|죽다)([^가-힣]|$)/.test(text)) {
			errors.push(`Forbidden plain verb '죽다' used with respected elder subject (expected '돌아가시다')`);
		}

		if (verbKo && state.HUMBLE_WORDS.has(verbKo)) {
			errors.push(`Respected elder subject cannot use humble verb '${verbKo}' for own action`);
		}
		if (/(^|[^가-힣])(말씀드렸|말씀드립|말씀드려|여쭸|여쭈었|여쭙|여쭤|뵀|뵈었|뵙|도와드렸|도와드립|보여드렸|보여드립)/.test(text)) {
			errors.push(`Respected elder subject cannot use humble verb for own action`);
		}

		if (nounKo && state.HONORIFIC_NOUN_SUPPLETIONS.has(nounKo)) {
			const honNoun = state.HONORIFIC_NOUN_SUPPLETIONS.get(nounKo);
			errors.push(`Plain noun '${nounKo}' should be honorific suppletion '${honNoun}' when referring to respected elder`);
		}
		if (/(^|[^가-힣])밥(을|이|은|도)?([^가-힣]|$)/.test(text) && /(드|잡수)/.test(text)) {
			errors.push(`Plain noun '밥' should be honorific suppletion '진지' with honorific consumption verb`);
		}
		if (/(^|[^가-힣])나이(가|는|를)?([^가-힣]|$)/.test(text) && /(많으시|어떻게 되)/.test(text)) {
			errors.push(`Plain noun '나이' should be honorific suppletion '연세' for elder`);
		}
	}

	if (isRecipientElder) {
		if (recipKo) {
			const hasPlainDative = new RegExp(`(^|[^가-힣])${recipKo}(에게|한테)([^가-힣]|$)`).test(text);
			if (hasPlainDative) {
				errors.push(`Elder recipient '${recipKo}' must take honorific dative '-께', not '-에게/-한테'`);
			}
		}

		if (verbKo && state.HUMBLE_VERB_SUPPLETIONS.has(verbKo)) {
			const humble = state.HUMBLE_VERB_SUPPLETIONS.get(verbKo);
			errors.push(`Elder recipient requires humble verb '${humble}', not plain verb '${verbKo}'`);
		}
		if (/(^|[^가-힣])(줘요|줍니다|주다|주고|줬어요|줬다)([^가-힣]|$)/.test(text)) {
			errors.push(`Elder recipient requires humble verb '드리다', not '주다'`);
		}
		if (/(^|[^가-힣])(말해요|말합니다|말하다|말하고|말했어요)([^가-힣]|$)/.test(text)) {
			errors.push(`Elder recipient requires humble verb '말씀드리다', not '말하다'`);
		}
		if (/(^|[^가-힣])(물어요|묻습니다|묻다|물었어요)([^가-힣]|$)/.test(text)) {
			errors.push(`Elder recipient requires humble verb '여쭙다' or '여쭈어보다', not '묻다'`);
		}

		if (/(^|[^가-힣])(내가|나는|나를|나에게|나한테)([^가-힣]|$)/.test(text)) {
			errors.push(`Informal 1st-person pronoun '나/내' cannot be used with elder recipient; use humble '저/제'`);
		}
	}

	return {
		valid: errors.length === 0,
		errors
	};
}

function validateTemporalConcord(input, context = {}) {
	const errors = [];
	const text = typeof input === 'string' ? input : (input && input.text ? input.text : "");
	if (!text) return { valid: true, errors: [] };

	for (const bare of state.BARE_TIME_WORDS_NO_PARTICLE) {
		const deicticParticleRegex = new RegExp(`(^|[^가-힣])(${bare})에([^가-힣]|$)`);
		if (deicticParticleRegex.test(text)) {
			errors.push(`Deictic temporal word '${bare}' cannot take time particle -에 (*${bare}에) in: "${text}"`);
		}
	}

	const foundPast = [];
	const foundFuture = [];
	for (const word of state.PAST_TIME_WORDS) {
		const reg = new RegExp(`(^|[^가-힣])${word}([^가-힣]|$)`);
		if (reg.test(text)) foundPast.push(word);
	}
	for (const word of state.FUTURE_TIME_WORDS) {
		const reg = new RegExp(`(^|[^가-힣])${word}([^가-힣]|$)`);
		if (reg.test(text)) foundFuture.push(word);
	}

	let hasPastPredicate = false;
	for (let i = 0; i < text.length; i++) {
		const ch = text[i];
		if (ch === '있' || ch === '없' || ch === '겠') continue;
		const d = decomposeHangul(ch);
		if (d && d.final === 20) {
			const rest = text.slice(i + 1);
			if (/^(?:어요|습니다|다|어|죠|던|네|소|ㅂ니다)/.test(rest)) {
				hasPastPredicate = true;
				break;
			}
		}
	}
	if (!hasPastPredicate) {
		hasPastPredicate = /(?:았|었|였|했|던|갔|봤|왔|잤)(?:어요|습니다|다|어|죠)/.test(text) && !/(았|었|였)으면\s*좋겠/.test(text);
	}

	const hasFuturePredicate = /((?:거(?:예요|야|입니다|에요|요|다))|(?:(?:ㄹ|을)\s*게요|게요)|(?:(?:으)?려고\s*(?:해|합|하|그))|(?:겠(?:어요|습니다|다|어|죠))|(?:(?:ㄹ|을)\s*건가요|건가요|것인가요))/.test(text);

	if (foundPast.length > 0 && hasFuturePredicate) {
		errors.push(`Past temporal word(s) [${foundPast.join(', ')}] clash with prospective/future predicate in: "${text}"`);
	}
	if (foundFuture.length > 0 && hasPastPredicate) {
		errors.push(`Future temporal word(s) [${foundFuture.join(', ')}] clash with past predicate in: "${text}"`);
	}

	if (context.temporal_polarity === K.PAST && hasFuturePredicate) {
		errors.push(`Context requires past tense, but found future predicate in: "${text}"`);
	}
	if (context.temporal_polarity === K.FUTURE && hasPastPredicate) {
		errors.push(`Context requires future tense, but found past predicate in: "${text}"`);
	}

	return {
		valid: errors.length === 0,
		errors
	};
}

function applyTemporalConcord(input, options = {}) {
	if (typeof input === 'object' && input !== null) {
		let text = input.text || "";
		if (text) {
			text = applyTemporalConcord(text, options);
		}
		return { ...input, text };
	}

	let str = String(input);

	for (const bare of state.BARE_TIME_WORDS_NO_PARTICLE) {
		const deicticRegex = new RegExp(`(^|[^가-힣])(${bare})에([^가-힣]|$)`, 'g');
		str = str.replace(deicticRegex, '$1$2$3');
	}

	return str;
}

const morphologyExports = {
	getPronunciationWord,
	getPronunciation,
	applyMorphology,
	attachParticle,
	getConjugatedStem,
	isDescriptiveVerb,
	isActionVerb,
	canTakeMood,
	getNegationSuppletion,
	getAffirmativeCounterpart,
	conjugatePredicate,
	buildNegatedPredicate,
	buildMoodPredicate,
	getNounUnit,
	getAllNounUnits,
	getVerbUnit,
	getHonorificVerb,
	getHumbleVerb,
	getHonorificNoun,
	getHumblePronoun,
	getPlainCounterpart,
	isHonorificWord,
	isHumbleWord,
	isForbiddenForElder,
	isElderNoun,
	isInanimateInstitution,
	isDeicticTimeWord,
	getTemporalPolarity,
	filterWordsByTense,
	filterGrammarByTense,
	buildActionVerbPhrase,
	buildDescriptiveVerbPhrase,
	getNounCandidatesForVerb,
	getSubjectCandidatesForDescriptiveVerb,
	getVerbParticleType,
	getHonorificPredicate,
	getHumblePredicate,
	applyHonorificConcord,
	validateHonorificConcord,
	applyTemporalConcord,
	validateTemporalConcord,
	registerConcordRepairs
};

if (typeof window !== 'undefined') {
	Object.assign(window, morphologyExports);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = morphologyExports;
}

if (state && typeof state.registerMorphologyEngine === 'function') {
	state.registerMorphologyEngine({ applyMorphology });
}
})();
