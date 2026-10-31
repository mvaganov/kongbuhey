(function() {
/**
 * korean/generation/unit_sentence_generator.js
 *
 * Target-Unit-Constrained Sentence AST Generator (All 9 Parts of Speech).
 *
 * Capabilities:
 * 1. Generates grammatical, semantically concordant Korean sentences (with full SentenceAST,
 *    eojeol/morpheme segment provenance, and Language Unit IDs) guaranteed to showcase
 *    any target Language Unit (ID 0..2005) across all 9 Parts of Speech:
 *    Noun, Pronoun, Action Verb, Descriptive Verb, Adverb, Determiner, Number, Exclamation, Grammar.
 * 2. First-class "Only From Set" (`options.onlyFromSet`, `options.allowedUnitIds`) constraint:
 *    Restricts all lexical slot-fillers to the user's active practice set and returns
 *    structured insufficiency diagnostics (`{ ok: false, insufficientSet: true, missingRoles, message }`)
 *    if the active set lacks required parts of speech to form a grammatical sentence.
 *
 * Platform: Node.js & Browser (Vanilla JS, zero dependencies).
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
	getStem
} = (typeof require !== 'undefined' ? require('../core/primitives.js') : window);

const {
	resolvePureMorphology,
	getConjugatedStem
} = (typeof require !== 'undefined' ? require('../core/stem_engine.js') : window);

const {
	getLexiconIndex
} = (typeof require !== 'undefined' ? require('../core/lexicon_index.js') : window);

const {
	getSinoNumber,
	getKoreanNumber
} = (typeof require !== 'undefined' ? require('../core/numbers.js') : window);

const {
	getVerbParticleType,
	getNounCandidatesForVerb,
	getSubjectCandidatesForDescriptiveVerb,
	getTemporalPolarity,
	filterWordsByTense,
	isElderNoun,
	isDeicticTimeWord
} = (typeof require !== 'undefined' ? require('../core/morphology.js') : window);

const {
	getClassifierNumeralType,
	getMatchingClassifier,
	getMatchingNounsForClassifier
} = (typeof require !== 'undefined' ? require('../concord/classifier_concord.js') : window);

const {
	getGrammarRegistry,
	resolveParticleUnit,
	resolveEndingUnit,
	makeSegment,
	splitNounAndParticleSegments,
	splitSingleVerbWordSegments,
	realizeKoreanFromAST
} = (typeof require !== 'undefined' ? require('./sentence_ast.js') : window);

function pickRandom(arr, seedOffset = null) {
	if (!arr || arr.length === 0) return null;
	if (typeof seedOffset === 'number' && seedOffset >= 0) {
		return arr[seedOffset % arr.length];
	}
	const rnd = (state && typeof state.seededRandom === 'function') ? state.seededRandom() : Math.random();
	return arr[Math.floor(rnd * arr.length)];
}

/**
 * Filters a candidate array of units according to `options.onlyFromSet` and `options.allowedUnitIds`.
 */
function filterBySet(candidates, options = {}, targetId = null) {
	if (!candidates || candidates.length === 0) return [];
	if (!options || !options.onlyFromSet) return candidates;
	const allowed = options.allowedUnitIds;
	if (!allowed || !(allowed instanceof Set)) return [];
	return candidates.filter(u => {
		if (!u) return false;
		const id = u[DATA_SCHEMA.Id];
		if (options.allowTargetUnit !== false && id === targetId) return true;
		return allowed.has(id);
	});
}

function getAllUnitsOfPos(pos, options = {}, targetId = null) {
	const getWords = dataModule.getWords || (typeof window !== 'undefined' ? window.getWords : () => []);
	const raw = getWords(pos) || [];
	return filterBySet(raw, options, targetId);
}

/**
 * Selects a person/animate subject or topic noun (or pronoun).
 */
function selectSubjectUnit(options = {}, targetId = null, preferElder = false) {
	const nouns = getAllUnitsOfPos("Noun", options, targetId).filter(
		n => !hasTag(n, "measureWord") && !hasTag(n, "counter") && !hasTag(n, "position") && n[DATA_SCHEMA.Korean] !== "이" && !["누구", "무엇", "뭐", "어디", "언제"].includes(n[DATA_SCHEMA.Korean])
	);
	const pronouns = getAllUnitsOfPos("Pronoun", options, targetId).filter(
		p => ["나", "저", "우리", "저희", "그", "그녀"].includes(p[DATA_SCHEMA.Korean])
	);

	const NON_AGENT_PERSON_WORDS = new Set([
		"나이", "이름", "성함", "연세", "생일", "생신", "고향", "주소", "전화번호", "번호",
		"취미", "전공", "성별", "국적", "키", "몸무게", "얼굴", "마음", "성격", "버릇", "습관",
		"목소리", "눈물", "땀", "피", "꿈", "생각", "기분", "감정", "말씀", "진지", "댁", "병환", "약주"
	]);

	if (preferElder) {
		const elders = nouns.filter(
			n => isElderNoun(n)
				&& hasTag(n, "person", "family", "profession", "kinship_elder", "elder", "elder_noun", "honorific_person")
				&& !NON_AGENT_PERSON_WORDS.has(n[DATA_SCHEMA.Korean])
		);
		if (elders.length > 0) return pickRandom(elders);
	}

	const personNouns = nouns.filter(
		n => hasTag(n, "person", "family", "profession", "subject_animate")
			&& !hasTag(n, "body_part", "body", "abstract", "place", "time", "clothing", "food", "illness", "symptom", "travel", "event", "activity", "object", "building", "facility", "institution", "language", "country")
			&& !NON_AGENT_PERSON_WORDS.has(n[DATA_SCHEMA.Korean])
			&& !isElderNoun(n)
	);
	const pool = [...personNouns, ...pronouns];
	if (pool.length > 0) return pickRandom(pool);
	if (nouns.length > 0) return pickRandom(nouns);
	if (pronouns.length > 0) return pickRandom(pronouns);
	return null;
}

function isIntransitiveVerb(verbUnit) {
	if (!verbUnit) return false;
	const ko = verbUnit[DATA_SCHEMA.Korean] || "";
	if (ko.endsWith("되다")) return true;
	if (hasTag(
		verbUnit,
		"intransitive",
		"intransitive_general",
		"intransitive_motion",
		"intransitive_place",
		"intransitive_state",
		"intransitive_food",
		"intransitive_person",
		"passive",
		"weather",
		"locative_static",
		"posture",
		"health"
	)) return true;
	const sd = parseSemanticData(verbUnit);
	if (sd.type === "intransitive" || sd.req === "subject") return true;
	return false;
}

/**
 * Selects an object/complement noun compatible with an Action Verb.
 */
function selectArgumentForActionVerb(verbUnit, options = {}, targetId = null) {
	if (!verbUnit) return { nounUnit: null, role: null, particleType: null };
	const verbKo = verbUnit[DATA_SCHEMA.Korean] || "";
	// Multi-word verb phrases (e.g., "담배를 피우다", "단풍 구경을 하다", "산책을 하다") already include their object noun
	if (verbKo.includes(" ")) {
		return { nounUnit: null, role: null, particleType: null };
	}

	const sd = parseSemanticData(verbUnit);
	const syntaxFrame = String(verbUnit[DATA_SCHEMA.SyntaxFrame] || "");
	const frameRequiresSubject = /이\/가/.test(syntaxFrame) ||
		(sd.type === "intransitive" && sd.req && sd.req !== "person" && sd.req !== "any") ||
		sd.req === "subject";

	if (frameRequiresSubject) {
		return { nounUnit: null, role: null, particleType: null };
	}

	const isLocativeStatic = hasTag(verbUnit, "locative_static", "posture") || ["눕다", "앉다", "살다"].includes(verbKo);
	const isLocativeMotion = hasTag(verbUnit, "intransitive_motion", "intransitive_place", "locative_goal");
	const isPureIntransitive = isIntransitiveVerb(verbUnit);

	if (isLocativeStatic) {
		const places = getAllUnitsOfPos("Noun", options, targetId).filter(n =>
			hasTag(n, "place", "location", "facility", "furniture") || ["침대", "방", "집", "소파", "의자"].includes(n[DATA_SCHEMA.Korean])
		);
		if (places.length > 0) {
			return { nounUnit: pickRandom(places), role: "location", particleType: "location_static" };
		}
		return { nounUnit: null, role: null, particleType: null };
	}

	if (isLocativeMotion) {
		const places = getAllUnitsOfPos("Noun", options, targetId).filter(n => hasTag(n, "place", "location", "institution", "facility"));
		if (places.length > 0) {
			return { nounUnit: pickRandom(places), role: "location", particleType: "location_static" };
		}
		return { nounUnit: null, role: null, particleType: null };
	}

	if (isPureIntransitive) {
		return { nounUnit: null, role: null, particleType: null };
	}

	const particleType = getVerbParticleType(verbUnit);

	let candidates = [];
	if (sd && sd.req === "liquid") {
		candidates = getAllUnitsOfPos("Noun", options, targetId).filter(
			n => hasTag(n, "liquid", "drink", "water") || parseSemanticData(n).domain === "liquid"
		);
	} else if (hasTag(verbUnit, "cooking") && !sd.collocation_filter) {
		candidates = getAllUnitsOfPos("Noun", options, targetId).filter(
			n => hasTag(n, "food", "drink", "cooking", "liquid", "ingredient")
		);
	}
	if (candidates.length === 0) {
		candidates = filterBySet(getNounCandidatesForVerb(verbUnit), options, targetId);
		if (!sd.collocation_filter && sd.req !== "body" && sd.req !== "body_part") {
			const nonBody = candidates.filter(n => !hasTag(n, "body", "body_part", "bodyPart") && parseSemanticData(n).domain !== "body");
			if (nonBody.length > 0) candidates = nonBody;
		}
	}
	if (!["닦다", "뽑다", "치료하다", "갈다"].includes(verbKo) && !hasTag(verbUnit, "teeth")) {
		const nonDental = candidates.filter(n => n[DATA_SCHEMA.Id] !== 361 && n[DATA_SCHEMA.Korean] !== "이");
		if (nonDental.length > 0) candidates = nonDental;
	}
	if (particleType === "dative" && (verbKo.includes("드리") || verbKo === "여쭤보다" || (state.HUMBLE_VERBS && state.HUMBLE_VERBS.has(verbKo)))) {
		const elders = getAllUnitsOfPos("Noun", options, targetId).filter(
			n => isElderNoun(n) && hasTag(n, "person", "family", "profession", "kinship_elder", "elder", "elder_noun", "honorific_person")
		);
		if (elders.length > 0) candidates = elders;
	}
	if (candidates.length === 0 && options.onlyFromSet) {
		// Fallback to any non-measureWord noun in the set
		candidates = getAllUnitsOfPos("Noun", options, targetId).filter(
			n => !hasTag(n, "measureWord") && !hasTag(n, "counter") && !hasTag(n, "time")
		);
	}
	if (candidates.length === 0) return { nounUnit: null, role: null, particleType: null };

	const chosen = pickRandom(candidates);
	const role = particleType === "dative" ? "recipient"
		: particleType === "location" ? "location"
		: particleType === "subject" ? "subject"
		: "object";
	return { nounUnit: chosen, role, particleType };
}

const GENERAL_TRANSITIVE_FALLBACK_KOREAN = new Set([
	"사다", "보다", "찾다", "기다리다", "준비하다", "바꾸다",
	"사용하다", "이용하다", "배우다", "기억하다", "좋아하다", "원하다", "고르다"
]);

const GENERAL_EVALUATIVE_FALLBACK_KOREAN = new Set([
	"좋다", "많다", "괜찮다", "필요하다", "중요하다", "유명하다",
	"편하다", "어렵다", "쉽다", "비싸다", "싸다", "크다", "작다"
]);

/**
 * Selects a compatible Action Verb for a given Noun unit.
 */
function selectActionVerbForNoun(nounUnit, options = {}, targetId = null) {
	const allAVs = getAllUnitsOfPos("Action Verb", options, targetId);
	if (allAVs.length === 0) return null;

	if (hasTag(nounUnit, "teeth") || nounUnit[DATA_SCHEMA.Korean] === "이") {
		const teethAVs = allAVs.filter(av => ["닦다", "치료하다", "뽑다"].includes(av[DATA_SCHEMA.Korean]));
		if (teethAVs.length > 0) return pickRandom(teethAVs);
	}

	const nounId = nounUnit[DATA_SCHEMA.Id];
	// Find verbs whose collocation candidates include this noun
	const matchingAVs = allAVs.filter(av => {
		const avKo = av[DATA_SCHEMA.Korean] || "";
		if (avKo.includes(" ")) return false;
		if (isIntransitiveVerb(av)) return false;
		if (getVerbParticleType(av) !== "object") return false;
		const cands = getNounCandidatesForVerb(av);
		return cands.some(c => c[DATA_SCHEMA.Id] === nounId);
	});
	if (matchingAVs.length > 0) return pickRandom(matchingAVs);

	if (hasTag(nounUnit, "place", "location", "institution", "facility")) {
		const transitivePlaceAVs = allAVs.filter(av => ["방문하다", "찾다", "청소하다", "구경하다"].includes(av[DATA_SCHEMA.Korean]));
		if (transitivePlaceAVs.length > 0) return pickRandom(transitivePlaceAVs);
	}

	if (hasTag(nounUnit, "teeth", "bodyPart") || parseSemanticData(nounUnit).domain === "body") {
		const bodyAVs = allAVs.filter(av => ["닦다", "씻다", "치료하다", "보다", "만지다"].includes(av[DATA_SCHEMA.Korean]));
		if (bodyAVs.length > 0) return pickRandom(bodyAVs);
	}

	// Filter to clean transitive verbs: single word, no spaces, no passive '되다', takes object
	const cleanTransitiveAVs = allAVs.filter(av => {
		const ko = av[DATA_SCHEMA.Korean];
		if (!ko || ko.includes(" ")) return false;
		if (isIntransitiveVerb(av)) return false;
		return getVerbParticleType(av) === "object";
	});

	if (cleanTransitiveAVs.length > 0) {
		const generalAVs = cleanTransitiveAVs.filter(av => GENERAL_TRANSITIVE_FALLBACK_KOREAN.has(av[DATA_SCHEMA.Korean]));
		if (generalAVs.length > 0) return pickRandom(generalAVs);
		return pickRandom(cleanTransitiveAVs);
	}

	const fallbackTransitive = allAVs.filter(v => !isIntransitiveVerb(v) && !(v[DATA_SCHEMA.Korean] || "").includes(" "));
	return pickRandom(fallbackTransitive) || pickRandom(allAVs);
}

/**
 * Selects a compatible Descriptive Verb for a given Noun unit.
 */
function selectDescriptiveVerbForNoun(nounUnit, options = {}, targetId = null) {
	const allDVs = getAllUnitsOfPos("Descriptive Verb", options, targetId);
	if (allDVs.length === 0) return null;

	if (hasTag(nounUnit, "teeth") || nounUnit[DATA_SCHEMA.Korean] === "이") {
		const teethDVs = allDVs.filter(dv => ["아프다", "시리다", "좋다", "튼튼하다", "하얗다"].includes(dv[DATA_SCHEMA.Korean]));
		if (teethDVs.length > 0) return pickRandom(teethDVs);
	}

	const nounId = nounUnit[DATA_SCHEMA.Id];
	const matchingDVs = allDVs.filter(dv => {
		const cands = getSubjectCandidatesForDescriptiveVerb(dv);
		return cands.some(c => c[DATA_SCHEMA.Id] === nounId);
	});
	if (matchingDVs.length > 0) return pickRandom(matchingDVs);

	if (hasTag(nounUnit, "teeth", "bodyPart") || parseSemanticData(nounUnit).domain === "body") {
		const bodyDVs = allDVs.filter(dv => ["아프다", "시리다", "좋다", "튼튼하다", "괜찮다", "하얗다"].includes(dv[DATA_SCHEMA.Korean]));
		if (bodyDVs.length > 0) return pickRandom(bodyDVs);
	}

	// Filter out human appearance/weather adjectives when falling back
	const cleanDVs = allDVs.filter(dv => {
		const ko = dv[DATA_SCHEMA.Korean];
		if (!ko || ko.includes(" ")) return false;
		if (["날씬하다", "뚱뚱하다", "잘생기다", "못생기다", "마르다"].includes(ko)) return false;
		if (["맑다", "흐리다", "쌀쌀하다", "화창하다", "무덥다", "춥다", "덥다"].includes(ko)) return false;
		return true;
	});

	if (cleanDVs.length > 0) {
		const generalDVs = cleanDVs.filter(dv => GENERAL_EVALUATIVE_FALLBACK_KOREAN.has(dv[DATA_SCHEMA.Korean]));
		if (generalDVs.length > 0) return pickRandom(generalDVs);
		return pickRandom(cleanDVs);
	}

	return pickRandom(allDVs);
}

/**
 * Selects an optional time word concordant with `tense`.
 */
function selectTimeUnit(tense, options = {}, targetId = null) {
	const timeNouns = getAllUnitsOfPos("Noun", options, targetId).filter(n => hasTag(n, "time", "temporal") && !hasTag(n, "measureWord", "counter"));
	const timeAdvs = getAllUnitsOfPos("Adverb", options, targetId).filter(a => hasTag(a, "time", "temporal", "adverb_time"));
	const pool = filterWordsByTense([...timeNouns, ...timeAdvs], tense);
	return pickRandom(pool);
}

/**
 * Selects an optional manner or degree adverb compatible with the predicate.
 */
function selectAdverbUnit(isDescriptive, polarity, options = {}, targetId = null) {
	const advs = getAllUnitsOfPos("Adverb", options, targetId).filter(a => {
		const ko = a[DATA_SCHEMA.Korean];
		if (ko === "안" || ko === "못") return false;
		if (polarity !== "negative" && state.ALL_NPI_WORDS.has(ko)) return false;
		if (hasTag(a, "discourse", "conjunction", "time", "temporal")) return false;
		// Interrogative question words must not be chosen as optional decorative adverbs in declarative sentences
		if (hasTag(a, "questionWord", "interrogative")) return false;
		if (isDescriptive) {
			if (state.MANNER_ADVERBS.has(ko) || hasTag(a, "manner", "adverb_manner")) return false;
			const sv = parseSemanticData(a);
			if (sv && sv.target_pos === "Action Verb") return false;
			return state.DEGREE_ADVERBS.has(ko) || hasTag(a, "degree", "adverb_degree", "degree_pure");
		}
		// Action Verbs take MANNER adverbs, NEVER pure degree adverbs
		if (hasTag(a, "degree_pure")) return false;
		return state.MANNER_ADVERBS.has(ko) || hasTag(a, "manner", "adverb_manner");
	});
	return pickRandom(advs);
}

/**
 * Builds a SentenceAST for an Action Verb unit.
 */
function buildASTForActionVerb(verbUnit, variationIndex = 0, options = {}) {
	const targetId = verbUnit[DATA_SCHEMA.Id];
	const isHonVerb = state.HONORIFIC_WORDS.has(verbUnit[DATA_SCHEMA.Korean]);
	const tenses = ["present", "past", "future"];
	const tense = options.tense || tenses[variationIndex % tenses.length];
	const politeness = options.politeness || (variationIndex === 2 ? "formal_high" : "polite");

	const arg = selectArgumentForActionVerb(verbUnit, options, targetId);
	const isNominativeSubjectVerb = arg.role === "subject";
	const modality = (variationIndex === 1 && !isHonVerb && !isNominativeSubjectVerb && !options.onlyFromSet) ? "desire" : null;
	const subjUnit = isNominativeSubjectVerb ? null : selectSubjectUnit(options, targetId, isHonVerb);

	if (options.onlyFromSet && !subjUnit && !arg.nounUnit) {
		return {
			ok: false,
			insufficientSet: true,
			missingRoles: ["Noun or Pronoun"],
			message: "Cannot build a complete sentence using only your current set: add at least one Noun or Pronoun to your set."
		};
	}

	const constituents = [];
	if (subjUnit && (!arg.nounUnit || subjUnit[DATA_SCHEMA.Id] !== arg.nounUnit[DATA_SCHEMA.Id])) {
		constituents.push({
			role: variationIndex % 2 === 0 ? "topic" : "subject",
			nounUnit: subjUnit,
			particleType: variationIndex % 2 === 0 ? "topic" : "subject"
		});
	}

	if (variationIndex > 0) {
		const timeUnit = selectTimeUnit(tense, options, targetId);
		if (timeUnit) {
			const isAdv = timeUnit[DATA_SCHEMA.PartofSpeech] === "Adverb";
			constituents.push({
				role: "time",
				unit: timeUnit,
				particleType: isAdv ? null : "time"
			});
		}
	}

	if (arg.nounUnit) {
		constituents.push({
			role: arg.role,
			nounUnit: arg.nounUnit,
			particleType: arg.particleType
		});
	}

	if (variationIndex === 2) {
		const advUnit = selectAdverbUnit(false, "affirmative", options, targetId);
		if (advUnit) {
			constituents.push({
				role: "adverb",
				unit: advUnit,
				particleType: null
			});
		}
	}

	return {
		ok: true,
		ast: {
			type: "Sentence",
			targetUnitId: targetId,
			speechAct: "declarative",
			politeness,
			tense: modality === "desire" ? "present" : tense,
			polarity: "affirmative",
			modality,
			honorific: isHonVerb || (subjUnit ? isElderNoun(subjUnit) : false),
			clauses: [{
				constituents,
				predicate: {
					role: "predicate",
					predType: "action",
					verbUnit,
					tense: modality === "desire" ? "present" : tense,
					politeness,
					speechAct: "declarative",
					polarity: "affirmative",
					modality,
					honorific: isHonVerb || (subjUnit ? isElderNoun(subjUnit) : false)
				}
			}]
		}
	};
}

/**
 * Builds a SentenceAST for a Descriptive Verb unit.
 */
function buildASTForDescriptiveVerb(dvUnit, variationIndex = 0, options = {}) {
	const targetId = dvUnit[DATA_SCHEMA.Id];
	const tenses = ["present", "past", "present"];
	const tense = options.tense || tenses[variationIndex % tenses.length];
	const politeness = options.politeness || (variationIndex === 2 ? "formal_high" : "polite");

	let subjCandidates = filterBySet(getSubjectCandidatesForDescriptiveVerb(dvUnit), options, targetId);
	const dvKo = dvUnit[DATA_SCHEMA.Korean] || "";
	if (!["아프다", "시리다", "좋다", "튼튼하다"].includes(dvKo) && !hasTag(dvUnit, "teeth")) {
		subjCandidates = subjCandidates.filter(u => u[DATA_SCHEMA.Korean] !== "이");
	}
	if (subjCandidates.length === 0 && options.onlyFromSet) {
		subjCandidates = getAllUnitsOfPos("Noun", options, targetId).filter(
			n => !hasTag(n, "measureWord") && !hasTag(n, "counter")
		);
	}
	const subjUnit = pickRandom(subjCandidates) || selectSubjectUnit(options, targetId, false);

	if (options.onlyFromSet && !subjUnit) {
		return {
			ok: false,
			insufficientSet: true,
			missingRoles: ["Noun or Pronoun"],
			message: "Cannot build a complete sentence using only your current set: add at least one Noun or Pronoun to your set."
		};
	}

	const constituents = [];
	if (subjUnit) {
		constituents.push({
			role: variationIndex === 1 ? "topic" : "subject",
			nounUnit: subjUnit,
			particleType: variationIndex === 1 ? "topic" : "subject"
		});
	}

	if (variationIndex > 0) {
		const degAdv = selectAdverbUnit(true, "affirmative", options, targetId);
		if (degAdv) {
			constituents.push({
				role: "adverb",
				unit: degAdv,
				particleType: null
			});
		}
	}

	return {
		ok: true,
		ast: {
			type: "Sentence",
			targetUnitId: targetId,
			speechAct: "declarative",
			politeness,
			tense,
			polarity: "affirmative",
			clauses: [{
				constituents,
				predicate: {
					role: "predicate",
					predType: "descriptive",
					verbUnit: dvUnit,
					tense,
					politeness,
					speechAct: "declarative",
					polarity: "affirmative"
				}
			}]
		}
	};
}

/**
 * Builds a SentenceAST for a Noun or Pronoun unit.
 */
function buildASTForNominal(nominalUnit, variationIndex = 0, options = {}) {
	const targetId = nominalUnit[DATA_SCHEMA.Id];
	const ko = nominalUnit[DATA_SCHEMA.Korean];
	const pos = nominalUnit[DATA_SCHEMA.PartofSpeech];
	const politeness = options.politeness || (variationIndex === 2 ? "formal_high" : "polite");
	const tenses = ["present", "past", "future"];
	let tense = options.tense || tenses[variationIndex % tenses.length];

	// 1. Classifier / Measure Word Noun (e.g. 개, 명, 마리, 잔, 권, 번, 살, 시)
	if (hasTag(nominalUnit, "measureWord", "counter") || state.CLASSIFIER_UNITS.has(ko)) {
		const numType = getClassifierNumeralType(ko);
		const countVal = (variationIndex % 4) + 1;
		const numStr = numType === "sino" ? getSinoNumber(countVal) : getKoreanNumber(countVal, true);
		const numUnits = getAllUnitsOfPos("Number", options, targetId);
		const matchedNumUnit = numUnits.find(u => u[DATA_SCHEMA.Korean] === numStr) || null;

		let compatibleNouns = filterBySet(getMatchingNounsForClassifier(ko), options, targetId);
		if (compatibleNouns.length === 0) {
			const allN = getAllUnitsOfPos("Noun", options, targetId);
			if (ko === "쪽") {
				compatibleNouns = allN.filter(n => ["책", "공책", "종이", "편지", "잡지"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "book", "paper", "document", "publication"));
			} else if (ko === "권") {
				compatibleNouns = allN.filter(n => ["책", "잡지", "공책", "사전"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "book", "publication"));
			} else if (ko === "명" || ko === "분") {
				compatibleNouns = allN.filter(n => hasTag(n, "person", "human", "family", "profession", "job"));
			} else if (ko === "마리") {
				compatibleNouns = allN.filter(n => hasTag(n, "animal", "pet", "fish", "bird"));
			} else if (ko === "잔" || ko === "병") {
				compatibleNouns = allN.filter(n => hasTag(n, "drink", "beverage", "liquid"));
			} else if (ko === "대") {
				compatibleNouns = allN.filter(n => hasTag(n, "vehicle", "electronics", "machine", "appliance"));
			} else if (ko === "벌") {
				compatibleNouns = allN.filter(n => hasTag(n, "clothing", "clothes"));
			} else if (ko === "켤레") {
				compatibleNouns = allN.filter(n => hasTag(n, "footwear", "shoes"));
			}
			if (compatibleNouns.length === 0) {
				compatibleNouns = allN.filter(
					n => n[DATA_SCHEMA.Id] !== targetId && !hasTag(n, "measureWord", "counter", "time", "place", "position")
				);
			}
		}
		const allAvs = getAllUnitsOfPos("Action Verb", options, targetId);
		const avs = allAvs.filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (vKo.includes(" ")) return false;
			if (isIntransitiveVerb(v)) return false;
			if (getVerbParticleType(v) !== "object") return false;
			return true;
		});
		const dvs = getAllUnitsOfPos("Descriptive Verb", options, targetId);
		const existVerb = dvs.find(v => v[DATA_SCHEMA.Korean] === "있다") || avs.find(v => v[DATA_SCHEMA.Korean] === "사다" || v[DATA_SCHEMA.Korean] === "먹다") || pickRandom(avs) || pickRandom(dvs);

		if (options.onlyFromSet && (compatibleNouns.length === 0 || !existVerb)) {
			const missing = [];
			if (compatibleNouns.length === 0) missing.push("Countable Noun");
			if (!existVerb) missing.push("Action or Descriptive Verb");
			return {
				ok: false,
				insufficientSet: true,
				missingRoles: missing,
				message: `Cannot build a counting sentence using only your current set (missing: ${missing.join(", ")}).`
			};
		}

		const itemNoun = pickRandom(compatibleNouns);
		const isAction = existVerb && existVerb[DATA_SCHEMA.PartofSpeech] === "Action Verb";
		return {
			ok: true,
			ast: {
				type: "Sentence",
				targetUnitId: targetId,
				speechAct: "declarative",
				politeness,
				tense: "present",
				polarity: "affirmative",
				clauses: [{
					constituents: [{
						role: isAction ? "object" : "subject",
						nounUnit: itemNoun,
						numberUnit: matchedNumUnit,
						numberSurfaceKo: numStr,
						countValue: countVal,
						counterUnit: nominalUnit,
						particleType: isAction ? "object" : "subject"
					}],
					predicate: {
						role: "predicate",
						predType: isAction ? "action" : "descriptive",
						verbUnit: existVerb,
						tense: "present",
						politeness,
						speechAct: "declarative",
						polarity: "affirmative"
					}
				}]
			}
		};
	}

	// 2. Spatial Position Noun (위, 아래, 앞, 뒤, 옆, 안, 밖, 사이)
	if (hasTag(nominalUnit, "position") || state.SPATIAL_POSITIONS.has(ko)) {
		const groundNouns = getAllUnitsOfPos("Noun", options, targetId).filter(
			n => n[DATA_SCHEMA.Id] !== targetId && hasTag(n, "place", "furniture", "object") && !hasTag(n, "measureWord", "counter", "position") && n[DATA_SCHEMA.Korean] !== "이"
		);
		const subjNouns = getAllUnitsOfPos("Noun", options, targetId).filter(
			n => n[DATA_SCHEMA.Id] !== targetId && !hasTag(n, "measureWord", "counter", "position", "time") && n[DATA_SCHEMA.Korean] !== "이"
		);
		const dvs = getAllUnitsOfPos("Descriptive Verb", options, targetId);
		const allAvs = getAllUnitsOfPos("Action Verb", options, targetId);
		const avs = allAvs.filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (vKo.includes(" ")) return false;
			if (isIntransitiveVerb(v)) return false;
			if (getVerbParticleType(v) !== "object") return false;
			return true;
		});
		const existVerb = dvs.find(v => v[DATA_SCHEMA.Korean] === "있다") || avs.find(v => hasTag(v, "existence", "locative_static")) || pickRandom(dvs) || pickRandom(avs);

		if (options.onlyFromSet && (groundNouns.length === 0 || !existVerb)) {
			const missing = [];
			if (groundNouns.length === 0) missing.push("Place/Object Noun");
			if (!existVerb) missing.push("Verb");
			return {
				ok: false,
				insufficientSet: true,
				missingRoles: missing,
				message: `Cannot build a spatial sentence using only your current set (missing: ${missing.join(", ")}).`
			};
		}

		const ground = pickRandom(groundNouns);
		const figure = pickRandom(subjNouns.filter(n => !ground || n[DATA_SCHEMA.Id] !== ground[DATA_SCHEMA.Id])) || ground;
		const constituents = [
			{
				role: "location",
				nounUnit: ground,
				positionUnit: nominalUnit,
				particleType: "location_static"
			}
		];
		if (figure && (!ground || figure[DATA_SCHEMA.Id] !== ground[DATA_SCHEMA.Id])) {
			constituents.push({
				role: "subject",
				nounUnit: figure,
				particleType: "subject"
			});
		}
		return {
			ok: true,
			ast: {
				type: "Sentence",
				targetUnitId: targetId,
				speechAct: "declarative",
				politeness,
				tense: "present",
				polarity: "affirmative",
				clauses: [{
					constituents,
					predicate: {
						role: "predicate",
						predType: existVerb[DATA_SCHEMA.PartofSpeech] === "Action Verb" ? "action" : "descriptive",
						verbUnit: existVerb,
						tense: "present",
						politeness,
						speechAct: "declarative",
						polarity: "affirmative"
					}
				}]
			}
		};
	}

	// 3. Time Noun (오늘, 어제, 내일, 아침, 주말, 지금...)
	if (hasTag(nominalUnit, "time", "temporal")) {
		const pol = getTemporalPolarity(nominalUnit);
		if (pol) tense = pol;
		const allAvs = getAllUnitsOfPos("Action Verb", options, targetId);
		const avs = allAvs.filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (vKo.includes(" ")) return false;
			if (isIntransitiveVerb(v)) return false;
			if (getVerbParticleType(v) !== "object") return false;
			return true;
		});
		const dvs = getAllUnitsOfPos("Descriptive Verb", options, targetId);
		const verbUnit = (variationIndex % 2 === 0 && avs.length > 0) ? pickRandom(avs) : (pickRandom(dvs) || pickRandom(avs));

		if (options.onlyFromSet && !verbUnit) {
			return {
				ok: false,
				insufficientSet: true,
				missingRoles: ["Action Verb or Descriptive Verb"],
				message: "Cannot build a sentence using only your current set: add at least one Action Verb or Descriptive Verb."
			};
		}

		const constituents = [{
			role: "time",
			nounUnit: nominalUnit,
			particleType: "time"
		}];

		if (verbUnit[DATA_SCHEMA.PartofSpeech] === "Action Verb") {
			const arg = selectArgumentForActionVerb(verbUnit, options, targetId);
			if (arg.role !== "subject") {
				const subj = selectSubjectUnit(options, targetId, false);
				if (subj && subj[DATA_SCHEMA.Id] !== targetId) {
					constituents.unshift({
						role: "topic",
						nounUnit: subj,
						particleType: "topic"
					});
				}
			}
			if (arg.nounUnit && arg.nounUnit[DATA_SCHEMA.Id] !== targetId) {
				constituents.push({
					role: arg.role,
					nounUnit: arg.nounUnit,
					particleType: arg.particleType
				});
			}
		} else {
			const subjCandidates = filterBySet(getSubjectCandidatesForDescriptiveVerb(verbUnit), options, targetId)
				.filter(n => n[DATA_SCHEMA.Id] !== targetId && n[DATA_SCHEMA.Id] !== 361);
			const subj = pickRandom(subjCandidates);
			if (subj) {
				constituents.push({
					role: "subject",
					nounUnit: subj,
					particleType: "subject"
				});
			}
		}

		return {
			ok: true,
			ast: {
				type: "Sentence",
				targetUnitId: targetId,
				speechAct: "declarative",
				politeness,
				tense,
				polarity: "affirmative",
				clauses: [{
					constituents,
					predicate: {
						role: "predicate",
						predType: verbUnit[DATA_SCHEMA.PartofSpeech] === "Action Verb" ? "action" : "descriptive",
						verbUnit,
						tense,
						politeness,
						speechAct: "declarative",
						polarity: "affirmative"
					}
				}]
			}
		};
	}

	// 4. Place / Location Noun (학교, 도서관, 집, 한국, 식당, 여기, 거기, 어디...)
	if (hasTag(nominalUnit, "place", "location", "institution", "facility") || ["여기", "거기", "저기", "어디"].includes(ko)) {
		const isInterrogative = ko === "어디";
		const allAvs = getAllUnitsOfPos("Action Verb", options, targetId);
		const agentiveAvs = allAvs.filter(v => getVerbParticleType(v) !== "subject" && !/이\/가/.test(String(v[DATA_SCHEMA.SyntaxFrame] || "")));
		const avs = agentiveAvs.length > 0 ? agentiveAvs : allAvs;
		const dvs = getAllUnitsOfPos("Descriptive Verb", options, targetId);
		const verbUnit = pickRandom(avs) || pickRandom(dvs);

		if (options.onlyFromSet && !verbUnit) {
			return {
				ok: false,
				insufficientSet: true,
				missingRoles: ["Action Verb or Descriptive Verb"],
				message: "Cannot build a sentence using only your current set: add at least one Action Verb or Descriptive Verb."
			};
		}

		const isMotionOrStatic = verbUnit && (
			verbUnit[DATA_SCHEMA.PartofSpeech] === "Descriptive Verb" ||
			hasTag(verbUnit, "intransitive_motion", "intransitive_place", "locative_goal", "existence")
		);

		const constituents = [];
		const arg = (verbUnit && verbUnit[DATA_SCHEMA.PartofSpeech] === "Action Verb")
			? selectArgumentForActionVerb(verbUnit, options, targetId)
			: { nounUnit: null, role: null, particleType: null };

		if (arg.role !== "subject") {
			const subj = selectSubjectUnit(options, targetId, false);
			if (subj && subj[DATA_SCHEMA.Id] !== targetId) {
				constituents.push({
					role: "topic",
					nounUnit: subj,
					particleType: "topic"
				});
			}
		}

		constituents.push({
			role: "location",
			nounUnit: nominalUnit,
			particleType: isMotionOrStatic ? "location_static" : "location_dynamic"
		});

		if (!isMotionOrStatic && arg.nounUnit && arg.nounUnit[DATA_SCHEMA.Id] !== targetId && (arg.role === "object" || arg.role === "subject")) {
			constituents.push({
				role: arg.role,
				nounUnit: arg.nounUnit,
				particleType: arg.particleType
			});
		}

		return {
			ok: true,
			ast: {
				type: "Sentence",
				targetUnitId: targetId,
				speechAct: isInterrogative ? "interrogative" : "declarative",
				politeness,
				tense,
				polarity: "affirmative",
				clauses: [{
					constituents,
					predicate: {
						role: "predicate",
						predType: verbUnit[DATA_SCHEMA.PartofSpeech] === "Action Verb" ? "action" : "descriptive",
						verbUnit,
						tense,
						politeness,
						speechAct: isInterrogative ? "interrogative" : "declarative",
						polarity: "affirmative"
					}
				}]
			}
		};
	}

	// 5. Person / Animate Noun or Personal Pronoun -> Subject / Topic
	const isPersonOrPronoun = pos === "Pronoun" || hasTag(nominalUnit, "person", "family", "profession", "animal", "subject_animate");
	if (isPersonOrPronoun && !["이것", "그것", "저것", "무엇", "뭐"].includes(ko)) {
		const isElder = isElderNoun(nominalUnit);
		const isInterrogative = ko === "누구" || ko === "누가";
		const allAvs = getAllUnitsOfPos("Action Verb", options, targetId);
		const avs = allAvs.filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (vKo.includes(" ")) return false;
			if (isIntransitiveVerb(v)) return false;
			if (getVerbParticleType(v) !== "object") return false;
			return true;
		});
		const dvs = getAllUnitsOfPos("Descriptive Verb", options, targetId);
		const verbUnit = (variationIndex % 2 === 0 && avs.length > 0) ? pickRandom(avs) : (pickRandom(dvs) || pickRandom(avs));

		if (!verbUnit) {
			// Fallback to Copula if another noun is in set
			const otherNouns = getAllUnitsOfPos("Noun", options, targetId).filter(n => n[DATA_SCHEMA.Id] !== targetId);
			if (otherNouns.length > 0) {
				return {
					ok: true,
					ast: {
						type: "Sentence",
						targetUnitId: targetId,
						speechAct: isInterrogative ? "interrogative" : "declarative",
						politeness,
						tense: "present",
						polarity: "affirmative",
						clauses: [{
							constituents: [{
								role: "topic",
								nounUnit: nominalUnit,
								particleType: "topic"
							}],
							predicate: {
								role: "predicate",
								predType: "copula",
								copulaNounUnit: pickRandom(otherNouns),
								tense: "present",
								politeness,
								speechAct: isInterrogative ? "interrogative" : "declarative",
								polarity: "affirmative"
							}
						}]
					}
				};
			}
			return {
				ok: false,
				insufficientSet: true,
				missingRoles: ["Action Verb or Descriptive Verb"],
				message: "Cannot build a sentence using only your current set: add at least one Verb to your set."
			};
		}

		const constituents = [{
			role: variationIndex % 2 === 0 ? "topic" : "subject",
			nounUnit: nominalUnit,
			particleType: variationIndex % 2 === 0 ? "topic" : "subject"
		}];

		if (verbUnit[DATA_SCHEMA.PartofSpeech] === "Action Verb") {
			const arg = selectArgumentForActionVerb(verbUnit, options, targetId);
			if (arg.nounUnit && arg.nounUnit[DATA_SCHEMA.Id] !== targetId) {
				constituents.push({
					role: arg.role,
					nounUnit: arg.nounUnit,
					particleType: arg.particleType
				});
			}
		}

		return {
			ok: true,
			ast: {
				type: "Sentence",
				targetUnitId: targetId,
				speechAct: isInterrogative ? "interrogative" : "declarative",
				politeness,
				tense,
				polarity: "affirmative",
				honorific: isElder,
				clauses: [{
					honorific: isElder,
					constituents,
					predicate: {
						role: "predicate",
						predType: verbUnit[DATA_SCHEMA.PartofSpeech] === "Action Verb" ? "action" : "descriptive",
						verbUnit,
						tense,
						politeness,
						speechAct: isInterrogative ? "interrogative" : "declarative",
						polarity: "affirmative",
						honorific: isElder
					}
				}]
			}
		};
	}

	// 6. General Object / Concept Noun or Demonstrative Pronoun (이것, 그것, 저것, 무엇, 책, 커피, 음악...)
	const isInterrogative = ko === "무엇" || ko === "뭐";
	const matchedAV = selectActionVerbForNoun(nominalUnit, options, targetId);
	const matchedDV = selectDescriptiveVerbForNoun(nominalUnit, options, targetId);
	const useAV = variationIndex % 2 === 0 ? Boolean(matchedAV) : !matchedDV;
	const chosenVerb = useAV ? (matchedAV || matchedDV) : (matchedDV || matchedAV);

	if (!chosenVerb) {
		return {
			ok: false,
			insufficientSet: true,
			missingRoles: ["Action Verb or Descriptive Verb"],
			message: "Cannot build a sentence using only your current set: add at least one Action Verb or Descriptive Verb to your set."
		};
	}

	const constituents = [];
	if (chosenVerb[DATA_SCHEMA.PartofSpeech] === "Action Verb") {
		const subj = selectSubjectUnit(options, targetId, false);
		if (subj && subj[DATA_SCHEMA.Id] !== targetId) {
			constituents.push({
				role: "topic",
				nounUnit: subj,
				particleType: "topic"
			});
		}
		const particleType = getVerbParticleType(chosenVerb);
		constituents.push({
			role: particleType === "location" ? "location" : (particleType === "dative" ? "recipient" : "object"),
			nounUnit: nominalUnit,
			particleType
		});
	} else {
		constituents.push({
			role: variationIndex === 1 ? "topic" : "subject",
			nounUnit: nominalUnit,
			particleType: variationIndex === 1 ? "topic" : "subject"
		});
	}

	return {
		ok: true,
		ast: {
			type: "Sentence",
			targetUnitId: targetId,
			speechAct: isInterrogative ? "interrogative" : "declarative",
			politeness,
			tense,
			polarity: "affirmative",
			clauses: [{
				constituents,
				predicate: {
					role: "predicate",
					predType: chosenVerb[DATA_SCHEMA.PartofSpeech] === "Action Verb" ? "action" : "descriptive",
					verbUnit: chosenVerb,
					tense,
					politeness,
					speechAct: isInterrogative ? "interrogative" : "declarative",
					polarity: "affirmative"
				}
			}]
		}
	};
}

/**
 * Builds a SentenceAST for an Adverb, Determiner, Number, or Exclamation unit.
 */
function buildASTForModifierOrParticleLike(unit, variationIndex = 0, options = {}) {
	const targetId = unit[DATA_SCHEMA.Id];
	const ko = unit[DATA_SCHEMA.Korean];
	const pos = unit[DATA_SCHEMA.PartofSpeech];
	const politeness = options.politeness || (variationIndex === 2 ? "formal_high" : "polite");
	const tenses = ["present", "past", "future"];
	let tense = options.tense || tenses[variationIndex % tenses.length];

	// 1. Determiner (이, 그, 저, 어느, 무슨, 어떤, 새, 헌, 모든, 다른...)
	if (pos === "Determiner") {
		const isInterrogative = ["어느", "무슨", "어떤", "몇"].includes(ko);
		const isTemporalDet = ["지난", "이번", "다음", "올"].includes(ko);
		let nouns = [];
		if (isTemporalDet) {
			nouns = getAllUnitsOfPos("Noun", options, targetId).filter(
				n => hasTag(n, "time", "temporal") && !hasTag(n, "measureWord", "counter", "position")
			);
		}
		if (nouns.length === 0) {
			nouns = getAllUnitsOfPos("Noun", options, targetId).filter(
				n => !hasTag(n, "measureWord", "counter", "time", "position") && n[DATA_SCHEMA.Korean] !== "이"
			);
		}
		const allAvs = getAllUnitsOfPos("Action Verb", options, targetId);
		const avs = allAvs.filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (vKo.includes(" ")) return false;
			if (isIntransitiveVerb(v)) return false;
			if (getVerbParticleType(v) !== "object") return false;
			return true;
		});
		const dvs = getAllUnitsOfPos("Descriptive Verb", options, targetId);
		const chosenVerb = (variationIndex % 2 === 0 && dvs.length > 0) ? pickRandom(dvs) : (pickRandom(avs) || pickRandom(dvs));

		if (options.onlyFromSet && (nouns.length === 0 || !chosenVerb)) {
			const missing = [];
			if (nouns.length === 0) missing.push("Noun");
			if (!chosenVerb) missing.push("Verb");
			return {
				ok: false,
				insufficientSet: true,
				missingRoles: missing,
				message: `Cannot build a sentence for determiner '${ko}' using only your current set (missing: ${missing.join(", ")}).`
			};
		}

		const headNoun = pickRandom(nouns);
		const isAction = chosenVerb[DATA_SCHEMA.PartofSpeech] === "Action Verb";
		return {
			ok: true,
			ast: {
				type: "Sentence",
				targetUnitId: targetId,
				speechAct: isInterrogative ? "interrogative" : "declarative",
				politeness,
				tense,
				polarity: "affirmative",
				clauses: [{
					constituents: [{
						role: isAction ? "object" : "subject",
						determinerUnit: unit,
						nounUnit: headNoun,
						particleType: isAction ? "object" : "subject"
					}],
					predicate: {
						role: "predicate",
						predType: isAction ? "action" : "descriptive",
						verbUnit: chosenVerb,
						tense,
						politeness,
						speechAct: isInterrogative ? "interrogative" : "declarative",
						polarity: "affirmative"
					}
				}]
			}
		};
	}

	// 2. Number (하나, 둘, 한, 두, 일, 이, 삼...)
	if (pos === "Number") {
		const isSino = hasTag(unit, "sinoNumber");
		const classifiers = isSino ? Array.from(state.SINO_CLASSIFIERS) : Array.from(state.KOREAN_CLASSIFIERS);
		let chosenClassifierKo = classifiers.includes("개") ? "개" : (classifiers[0] || "개");
		let counterUnit = state.CLASSIFIER_UNITS.get(chosenClassifierKo) || null;

		if (options.onlyFromSet) {
			const inSetCounters = getAllUnitsOfPos("Noun", options, targetId).filter(n => hasTag(n, "measureWord", "counter"));
			const matchingCounter = inSetCounters.find(c => (getClassifierNumeralType(c[DATA_SCHEMA.Korean]) === "sino") === isSino) || inSetCounters[0];
			if (matchingCounter) {
				counterUnit = matchingCounter;
				chosenClassifierKo = matchingCounter[DATA_SCHEMA.Korean];
			}
		}

		let nouns = filterBySet(getMatchingNounsForClassifier(chosenClassifierKo), options, targetId);
		if (nouns.length === 0) {
			nouns = getAllUnitsOfPos("Noun", options, targetId).filter(n => !hasTag(n, "measureWord", "counter", "time", "place"));
		}
		const allAvs = getAllUnitsOfPos("Action Verb", options, targetId);
		const avs = allAvs.filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (vKo.includes(" ")) return false;
			if (isIntransitiveVerb(v)) return false;
			if (getVerbParticleType(v) !== "object") return false;
			return true;
		});
		const dvs = getAllUnitsOfPos("Descriptive Verb", options, targetId);
		const chosenVerb = dvs.find(v => v[DATA_SCHEMA.Korean] === "있다") || pickRandom(avs) || pickRandom(dvs);

		if (options.onlyFromSet && (nouns.length === 0 || !chosenVerb)) {
			const missing = [];
			if (nouns.length === 0) missing.push("Noun");
			if (!chosenVerb) missing.push("Verb");
			return {
				ok: false,
				insufficientSet: true,
				missingRoles: missing,
				message: `Cannot build a number sentence using only your current set (missing: ${missing.join(", ")}).`
			};
		}

		const itemNoun = pickRandom(nouns);
		const isAction = chosenVerb[DATA_SCHEMA.PartofSpeech] === "Action Verb";
		const numVal = (state.KOREAN_NUMBER_VALUES && state.KOREAN_NUMBER_VALUES[ko]) || 1;
		const numSurface = (!isSino && counterUnit) ? getKoreanNumber(numVal, true) : ko;

		return {
			ok: true,
			ast: {
				type: "Sentence",
				targetUnitId: targetId,
				speechAct: "declarative",
				politeness,
				tense: "present",
				polarity: "affirmative",
				clauses: [{
					constituents: [{
						role: isAction ? "object" : "subject",
						nounUnit: itemNoun,
						numberUnit: unit,
						numberSurfaceKo: numSurface,
						countValue: numVal,
						counterUnit,
						particleType: isAction ? "object" : "subject"
					}],
					predicate: {
						role: "predicate",
						predType: isAction ? "action" : "descriptive",
						verbUnit: chosenVerb,
						tense: "present",
						politeness,
						speechAct: "declarative",
						polarity: "affirmative"
					}
				}]
			}
		};
	}

	// 3. Exclamation (네, 아니요, 아, 와, 안녕하세요, 감사합니다...)
	if (pos === "Exclamation") {
		const allAvs = getAllUnitsOfPos("Action Verb", options, targetId);
		const avs = allAvs.filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (vKo.includes(" ")) return false;
			if (isIntransitiveVerb(v)) return false;
			if (getVerbParticleType(v) !== "object") return false;
			return true;
		});
		const dvs = getAllUnitsOfPos("Descriptive Verb", options, targetId);
		const chosenVerb = pickRandom(dvs) || pickRandom(avs);

		if (options.onlyFromSet && !chosenVerb) {
			return {
				ok: false,
				insufficientSet: true,
				missingRoles: ["Action Verb or Descriptive Verb"],
				message: "Cannot build a complete sentence using only your current set: add at least one Verb to your set."
			};
		}

		const constituents = [{
			role: "discourse",
			unit,
			particleType: null
		}];

		if (chosenVerb) {
			const isAction = chosenVerb[DATA_SCHEMA.PartofSpeech] === "Action Verb";
			if (isAction) {
				const arg = selectArgumentForActionVerb(chosenVerb, options, targetId);
				if (arg.nounUnit) {
					constituents.push({
						role: arg.role,
						nounUnit: arg.nounUnit,
						particleType: arg.particleType
					});
				}
			} else {
				const subj = pickRandom(filterBySet(getSubjectCandidatesForDescriptiveVerb(chosenVerb), options, targetId).filter(u => u[DATA_SCHEMA.Id] !== 361));
				if (subj) {
					constituents.push({
						role: "subject",
						nounUnit: subj,
						particleType: "subject"
					});
				}
			}
		}

		return {
			ok: true,
			ast: {
				type: "Sentence",
				targetUnitId: targetId,
				speechAct: "declarative",
				politeness,
				tense: "present",
				polarity: "affirmative",
				clauses: [{
					constituents,
					predicate: chosenVerb ? {
						role: "predicate",
						predType: chosenVerb[DATA_SCHEMA.PartofSpeech] === "Action Verb" ? "action" : "descriptive",
						verbUnit: chosenVerb,
						tense: "present",
						politeness,
						speechAct: "declarative",
						polarity: "affirmative"
					} : null
				}]
			}
		};
	}

	// 4. Adverb (Degree, Manner, Time, Discourse, NPI, Short Negation)
	const isNPI = state.ALL_NPI_WORDS.has(ko) || hasTag(unit, "npi", "negative_polarity");
	const isShortAn = ko === "안";
	const isShortMot = ko === "못" || state.SHORT_INABILITY_WORDS.has(ko);
	const isManner = state.MANNER_ADVERBS.has(ko) || hasTag(unit, "manner", "adverb_manner");
	const isDegree = state.DEGREE_ADVERBS.has(ko) && !isManner;
	const isDiscourse = state.DISCOURSE_ADVERBS.has(ko) || hasTag(unit, "discourse", "conjunction");
	const isQuestionWord = hasTag(unit, "questionWord", "interrogative");
	const pol = getTemporalPolarity(unit);
	if (pol) tense = pol;

	const avs = getAllUnitsOfPos("Action Verb", options, targetId).filter(v => !state.FORBIDDEN_NEGATIVE_ROOTS.has(v[DATA_SCHEMA.Korean]));
	const dvs = getAllUnitsOfPos("Descriptive Verb", options, targetId).filter(v => !state.FORBIDDEN_NEGATIVE_ROOTS.has(v[DATA_SCHEMA.Korean]));

	let chosenVerb = null;
	if (isShortMot) {
		const volitionalAVs = avs.filter(v => {
			const vKo = v[DATA_SCHEMA.Korean];
			if (["낫다", "걸리다", "끝나다", "시작되다", "고장 나다", "죽다", "생기다"].includes(vKo)) return false;
			if (hasTag(v, "involuntary", "passive", "weather")) return false;
			return true;
		});
		chosenVerb = pickRandom(volitionalAVs) || pickRandom(avs);
	} else if (ko === "얼마나") {
		// 얼마나 requires gradable Descriptive Verb (degree) or duration/scalable verb (scalable)
		const durationVerbs = avs.filter(v => hasTag(v, "scalable", "scalable_duration", "scalable_quantity", "scalable_emotion"));
		const gradableDvs = dvs.filter(v => hasTag(v, "gradable"));
		if (variationIndex === 1 && durationVerbs.length > 0) {
			chosenVerb = pickRandom(durationVerbs);
		} else {
			chosenVerb = pickRandom(gradableDvs) || pickRandom(dvs) || pickRandom(durationVerbs) || dvs[0];
		}
	} else if (isManner) {
		chosenVerb = pickRandom(avs);
	} else if (isDegree) {
		// Degree adverbs (아주, 매우, 너무, 꽤, 무척, 조금, 참) modify Descriptive Verbs or scalable psychological verbs
		const scalableAVs = avs.filter(v => hasTag(v, "scalable", "scalable_emotion"));
		chosenVerb = pickRandom(dvs) || (scalableAVs.length > 0 ? pickRandom(scalableAVs) : null) || dvs[0] || pickRandom(avs);
	} else {
		chosenVerb = pickRandom(avs) || pickRandom(dvs);
	}

	if (!chosenVerb) {
		return {
			ok: false,
			insufficientSet: true,
			missingRoles: [isShortMot || isManner ? "Action Verb" : "Action Verb or Descriptive Verb"],
			message: `Cannot build a sentence for adverb '${ko}' using only your current set: add a compatible Verb to your set.`
		};
	}

	const isAction = chosenVerb[DATA_SCHEMA.PartofSpeech] === "Action Verb";
	const constituents = [];
	let subj = null;
	if (ko === "얼마나" && hasTag(chosenVerb, "scalable_duration", "scalable_quantity")) {
		const resourceNouns = getAllUnitsOfPos("Noun", options, targetId).filter(n => hasTag(n, "resource"));
		subj = resourceNouns.length > 0 ? (hasTag(chosenVerb, "scalable_quantity") && resourceNouns.length > 1 ? pickRandom(resourceNouns) : resourceNouns[0]) : selectSubjectUnit(options, targetId, false);
	} else if (!isAction) {
		const dvSubjs = filterBySet(getSubjectCandidatesForDescriptiveVerb(chosenVerb), options, targetId).filter(u => u[DATA_SCHEMA.Id] !== 361);
		subj = dvSubjs.length > 0 ? pickRandom(dvSubjs) : selectSubjectUnit(options, targetId, false);
	} else {
		subj = selectSubjectUnit(options, targetId, false);
	}

	const arg = (isAction && !hasTag(chosenVerb, "scalable_duration", "scalable_quantity"))
		? selectArgumentForActionVerb(chosenVerb, options, targetId)
		: { nounUnit: null };

	if (options.onlyFromSet && !subj && !arg.nounUnit) {
		return {
			ok: false,
			insufficientSet: true,
			missingRoles: ["Noun or Pronoun"],
			message: `Cannot build a sentence for adverb '${ko}' using only your current set: add at least one Noun or Pronoun.`
		};
	}

	if (isDiscourse) {
		constituents.push({ role: "discourse", unit, particleType: null });
	}

	if (subj) {
		const subjParticle = isQuestionWord ? "subject" : "topic";
		constituents.push({
			role: subjParticle,
			nounUnit: subj,
			particleType: subjParticle
		});
	}

	if (!isDiscourse && pol) {
		constituents.push({ role: "time", unit, particleType: null });
	}

	if (arg.nounUnit && (!subj || arg.nounUnit[DATA_SCHEMA.Id] !== subj[DATA_SCHEMA.Id])) {
		constituents.push({
			role: arg.role,
			nounUnit: arg.nounUnit,
			particleType: arg.particleType
		});
	}

	if (!isDiscourse && !pol && !isShortAn && !isShortMot) {
		constituents.push({ role: "adverb", unit, particleType: null });
	}

	const polarity = (isNPI || isShortAn || isShortMot) ? "negative" : "affirmative";
	const negationType = isShortMot ? "short_mot" : (polarity === "negative" ? "short_an" : null);
	const speechAct = isQuestionWord ? "interrogative" : "declarative";

	return {
		ok: true,
		ast: {
			type: "Sentence",
			targetUnitId: targetId,
			speechAct,
			politeness,
			tense,
			polarity,
			negationType,
			clauses: [{
				constituents,
				predicate: {
					role: "predicate",
					predType: isAction ? "action" : "descriptive",
					verbUnit: chosenVerb,
					negationUnit: (isShortAn || isShortMot) ? unit : null,
					tense,
					politeness,
					speechAct,
					polarity,
					negationType
				}
			}]
		}
	};
}

/**
 * Compiles a Grammar unit's curated Conjugation formula (e.g. "{VP_AVst}는 중이에요",
 * "{DVst}으/ㄹ 때 {Clause}", "{Noun:place}에다가 {VP_AVst}아/어요") into a structured SentenceAST
 * with full eojeol & morpheme segment provenance.
 */
function buildASTForGrammarUnit(grammarUnit, variationIndex = 0, options = {}) {
	const targetId = grammarUnit[DATA_SCHEMA.Id];
	const ko = grammarUnit[DATA_SCHEMA.Korean];
	const formulas = Array.isArray(grammarUnit[DATA_SCHEMA.Conjugation]) ? grammarUnit[DATA_SCHEMA.Conjugation] : [];

	const isNegativeGrammar = hasTag(grammarUnit, "negative", "inability", "prohibition") || formulas.some(f => f.includes("못") || f.includes("안"));
	const isInability = hasTag(grammarUnit, "inability") || formulas.some(f => f.includes("못"));
	const avs = getAllUnitsOfPos("Action Verb", options, targetId).filter(v => {
		if (isNegativeGrammar && state.FORBIDDEN_NEGATIVE_ROOTS.has(v[DATA_SCHEMA.Korean])) return false;
		if (isInability && (["낫다", "걸리다", "끝나다", "시작되다", "고장 나다", "죽다", "생기다"].includes(v[DATA_SCHEMA.Korean]) || hasTag(v, "involuntary", "passive", "weather"))) return false;
		return true;
	});
	const dvs = getAllUnitsOfPos("Descriptive Verb", options, targetId).filter(v => {
		if (isNegativeGrammar && state.FORBIDDEN_NEGATIVE_ROOTS.has(v[DATA_SCHEMA.Korean])) return false;
		return true;
	});
	const nouns = getAllUnitsOfPos("Noun", options, targetId).filter(n => !hasTag(n, "measureWord", "counter") && n[DATA_SCHEMA.Korean] !== "이");

	if (options.onlyFromSet) {
		const needsAV = formulas.length > 0 && formulas.every(f => f.includes("AVst"));
		const needsDV = formulas.length > 0 && formulas.every(f => f.includes("DVst") && !f.includes("AVst"));
		const missing = [];
		if (needsAV && avs.length === 0) missing.push("Action Verb");
		if (needsDV && dvs.length === 0) missing.push("Descriptive Verb");
		if (!needsAV && !needsDV && avs.length === 0 && dvs.length === 0 && !ko.includes("이에요") && !ko.includes("입니다") && !ko.includes("이야")) {
			missing.push("Action or Descriptive Verb");
		}
		if (nouns.length === 0) missing.push("Noun");
		if (missing.length > 0) {
			return {
				ok: false,
				insufficientSet: true,
				missingRoles: missing,
				message: `Cannot build a sentence for grammar '${ko}' using only your current set (missing: ${missing.join(", ")}).`
			};
		}
	}

	// Pick a formula compatible with available POS in set
	let compatibleFormulas = formulas.filter(f => {
		if (f.includes("AVst") && avs.length === 0) return false;
		if (f.includes("DVst") && dvs.length === 0) return false;
		return true;
	});
	if (compatibleFormulas.length === 0) compatibleFormulas = formulas;

	const formula = compatibleFormulas.length > 0
		? compatibleFormulas[variationIndex % compatibleFormulas.length]
		: "{VP_AVst}아/어요";

	const isInterrogative = formula.includes("?") || hasTag(grammarUnit, "interrogative");
	const speechAct = isInterrogative ? "interrogative"
		: hasTag(grammarUnit, "imperative") ? "imperative"
			: hasTag(grammarUnit, "propositive") ? "propositive"
				: "declarative";

	const tense = hasTag(grammarUnit, "past", "temporal_past") ? "past"
		: hasTag(grammarUnit, "future", "temporal_future") ? "future"
			: "present";
	const politeness = hasTag(grammarUnit, "formal_high", "formal_polite") ? "formal_high"
		: hasTag(grammarUnit, "plain_style") ? "plain"
			: hasTag(grammarUnit, "informal") ? "intimate"
				: "polite";

	// Expand formula tokens while recording AST constituents and predicate
	const constituents = [];
	let mainPredicate = null;
	const clauses = [];

	// Split formula if it has a subordinate clause followed by {Clause}
	if (formula.includes("{Clause}")) {
		const parts = formula.split("{Clause}");
		const subFormula = parts[0].trim();
		const subRes = expandFormulaIntoClause(subFormula, grammarUnit, tense, politeness, options, targetId, true);
		const mainVerb = pickRandom(avs) || pickRandom(dvs);
		const mainClauseConstituents = [];
		let mainPred = null;
		if (mainVerb) {
			const isAction = mainVerb[DATA_SCHEMA.PartofSpeech] === "Action Verb";
			if (isAction) {
				const arg = selectArgumentForActionVerb(mainVerb, options, targetId);
				if (arg.nounUnit) {
					mainClauseConstituents.push({
						role: arg.role,
						nounUnit: arg.nounUnit,
						particleType: arg.particleType
					});
				}
			} else {
				const subj = pickRandom(filterBySet(getSubjectCandidatesForDescriptiveVerb(mainVerb), options, targetId));
				if (subj) {
					mainClauseConstituents.push({
						role: "subject",
						nounUnit: subj,
						particleType: "subject"
					});
				}
			}
			mainPred = {
				role: "predicate",
				predType: isAction ? "action" : "descriptive",
				verbUnit: mainVerb,
				tense,
				politeness,
				speechAct,
				polarity: "affirmative"
			};
		}
		clauses.push(subRes, { constituents: mainClauseConstituents, predicate: mainPred });
	} else {
		const singleClause = expandFormulaIntoClause(formula, grammarUnit, tense, politeness, options, targetId, false);
		clauses.push(singleClause);
	}

	return {
		ok: true,
		ast: {
			type: "Sentence",
			targetUnitId: targetId,
			grammarUnit,
			speechAct,
			politeness,
			tense,
			polarity: hasTag(grammarUnit, "negative", "inability", "prohibition") ? "negative" : "affirmative",
			clauses
		}
	};
}

/**
 * Expands a single-clause Grammar formula into a ClauseAST `{ constituents, predicate }`.
 */
function expandFormulaIntoClause(formula, grammarUnit, tense, politeness, options, targetId, isSubordinate) {
	const constituents = [];
	let predicate = null;

	const isInterrogative = formula.includes("?") || hasTag(grammarUnit, "interrogative");
	const isClauseNeg = hasTag(grammarUnit, "negative", "inability", "prohibition") || formula.includes("못") || formula.includes("안");
	const isClauseInability = hasTag(grammarUnit, "inability") || formula.includes("못");
	const avs = getAllUnitsOfPos("Action Verb", options, targetId).filter(v => {
		if (v[DATA_SCHEMA.Id] === targetId) return true;
		if (!isInterrogative && hasTag(v, "questionWord", "interrogative")) return false;
		if (isClauseNeg && state.FORBIDDEN_NEGATIVE_ROOTS.has(v[DATA_SCHEMA.Korean])) return false;
		if (isClauseInability && (["낫다", "걸리다", "끝나다", "시작되다", "고장 나다", "죽다", "생기다"].includes(v[DATA_SCHEMA.Korean]) || hasTag(v, "involuntary", "passive", "weather"))) return false;
		return true;
	});
	const dvs = getAllUnitsOfPos("Descriptive Verb", options, targetId).filter(v => {
		if (v[DATA_SCHEMA.Id] === targetId) return true;
		if (!isInterrogative && hasTag(v, "questionWord", "interrogative")) return false;
		if (isClauseNeg && state.FORBIDDEN_NEGATIVE_ROOTS.has(v[DATA_SCHEMA.Korean])) return false;
		return true;
	});
	const allNouns = getAllUnitsOfPos("Noun", options, targetId).filter(n => !hasTag(n, "measureWord", "counter") && n[DATA_SCHEMA.Korean] !== "이");

	// Match tokens with their immediately following literal suffix up to the next space or token
	const tokenWithSuffixRegex = /(\{[^}]+\})([^\s{]*)|([^\s{}]+)/g;
	let m;
	while ((m = tokenWithSuffixRegex.exec(formula)) !== null) {
		if (m[3]) {
			// Standalone literal word in template (e.g. "얼마나", "안", "못", "더")
			const literalWord = resolvePureMorphology(m[3], state);
			constituents.push({
				role: "modifier",
				unit: grammarUnit,
				explicitSurfaceKo: literalWord,
				particleUnit: null
			});
			continue;
		}

		const rawToken = m[1];
		const suffix = m[2] || "";
		const inner = rawToken.slice(1, -1);
		const [tokenType, tag] = inner.split(":");

		if (tokenType === "VP_AVst" || tokenType === "AVst" || tokenType === "VP_DVst" || tokenType === "DVst") {
			const isAction = tokenType.includes("AVst");
			const chosenVerb = isAction ? (pickRandom(avs) || pickRandom(dvs)) : (pickRandom(dvs) || pickRandom(avs));
			if (!chosenVerb) continue;

			const restOfFormula = formula.slice(m.index + m[0].length).trim();
			const hasMoreTokens = /\{[^}]+\}/.test(restOfFormula);

			// Add argument if VP_* or if bare AVst/DVst is the main predicate with no prior arguments
			if (tokenType === "VP_AVst" || (tokenType === "AVst" && !hasMoreTokens && constituents.length === 0)) {
				const arg = selectArgumentForActionVerb(chosenVerb, options, targetId);
				if (arg.nounUnit) {
					constituents.push({
						role: arg.role,
						nounUnit: arg.nounUnit,
						particleType: arg.particleType
					});
				}
			} else if (tokenType === "VP_DVst" || (tokenType === "DVst" && !hasMoreTokens && constituents.length === 0)) {
				const subjCands = filterBySet(getSubjectCandidatesForDescriptiveVerb(chosenVerb), options, targetId);
				const subj = pickRandom(subjCands) || pickRandom(allNouns);
				if (subj) {
					constituents.push({
						role: "subject",
						nounUnit: subj,
						particleType: "subject"
					});
				}
			}

			if (!hasMoreTokens && restOfFormula.length > 0) {
				const fullSuffix = suffix + " " + restOfFormula;
				predicate = {
					role: "predicate",
					predType: isAction ? "action" : "descriptive",
					verbUnit: chosenVerb,
					grammarUnit,
					connectiveSuffix: fullSuffix,
					tense,
					politeness
				};
				break;
			} else {
				const predNode = {
					role: "predicate",
					predType: isAction ? "action" : "descriptive",
					verbUnit: chosenVerb,
					grammarUnit,
					connectiveSuffix: suffix || "아/어요",
					tense,
					politeness
				};
				if (hasMoreTokens) {
					const stem = getConjugatedStem(chosenVerb[DATA_SCHEMA.Korean], chosenVerb[DATA_SCHEMA.Conjugation]);
					const realizedMod = resolvePureMorphology(stem + suffix, state);
					constituents.push({
						role: "adverbial",
						unit: chosenVerb,
						particleUnit: grammarUnit,
						explicitSurfaceKo: realizedMod
					});
				} else {
					predicate = predNode;
				}
			}
		} else if (tokenType === "N" || tokenType === "Noun" || tokenType === "N_Phrase") {
			let pool = allNouns;
			const isHonParticle = hasTag(grammarUnit, "honorific") || (grammarUnit[DATA_SCHEMA.Korean] || "").includes("께서") || (grammarUnit[DATA_SCHEMA.Korean] || "").includes("께");
			if (isHonParticle) {
				const elders = allNouns.filter(
					n => isElderNoun(n)
						&& hasTag(n, "person", "family", "profession", "kinship_elder", "elder", "elder_noun", "honorific_person")
						&& !["말씀", "진지", "연세", "성함", "생신", "댁", "병환", "약주"].includes(n[DATA_SCHEMA.Korean])
				);
				if (elders.length > 0) pool = elders;
			} else if (tag) {
				const tagged = allNouns.filter(n => hasTag(n, tag));
				if (tagged.length > 0) pool = tagged;
			}
			const chosenNoun = pickRandom(pool) || allNouns[0];
			if (!chosenNoun) continue;

			const restOfFormula = formula.slice(m.index + m[0].length).trim();
			const hasMoreTokens = /\{[^}]+\}/.test(restOfFormula);

			if (!hasMoreTokens && (suffix.includes("이/예요") || suffix.includes("입니다") || suffix.includes("이야") || restOfFormula.includes("아니에요"))) {
				const fullCopula = resolvePureMorphology(chosenNoun[DATA_SCHEMA.Korean] + suffix + (restOfFormula ? " " + restOfFormula : ""), state);
				const subj = selectSubjectUnit(options, targetId, false);
				if (subj && subj[DATA_SCHEMA.Id] !== chosenNoun[DATA_SCHEMA.Id]) {
					constituents.push({
						role: "topic",
						nounUnit: subj,
						particleType: "topic"
					});
				}
				predicate = {
					role: "predicate",
					predType: "copula",
					copulaNounUnit: chosenNoun,
					grammarUnit,
					explicitSurfaceKo: fullCopula,
					tense,
					politeness
				};
				break;
			} else {
				const gKo = grammarUnit[DATA_SCHEMA.Korean] || "";
				const inferredRole = (hasTag(grammarUnit, "topic") || suffix.includes("은/는")) ? "topic"
					: (hasTag(grammarUnit, "subject") || suffix.includes("이/가") || suffix.includes("께서")) ? "subject"
					: (hasTag(grammarUnit, "object") || suffix.includes("을/를")) ? "object"
					: (hasTag(grammarUnit, "dative") || suffix.includes("에게") || suffix.includes("한테") || suffix === "께") ? "recipient"
					: (tag === "place" || hasTag(grammarUnit, "location", "location_action", "direction", "directional")) ? "location"
					: (tag === "time" || hasTag(grammarUnit, "time", "temporal")) ? "time"
					: "noun_phrase";
				const inferredParticleType = inferredRole === "location"
					? (suffix.includes("에서") ? "location_dynamic" : "location_static")
					: (inferredRole === "recipient" ? "dative" : (inferredRole !== "noun_phrase" ? inferredRole : null));

				const withSuffix = resolvePureMorphology(chosenNoun[DATA_SCHEMA.Korean] + suffix, state);
				constituents.push({
					role: inferredRole,
					nounUnit: chosenNoun,
					particleType: inferredParticleType,
					particleUnit: suffix ? grammarUnit : null,
					explicitSurfaceKo: withSuffix
				});

				// If restOfFormula is a literal verb like "있어요" or "없어요", turn it into the predicate!
				if (!hasMoreTokens && (restOfFormula === "있어요" || restOfFormula === "없어요")) {
					const existKo = restOfFormula === "없어요" ? "없다" : "있다";
					const existUnit = dvs.find(v => v[DATA_SCHEMA.Korean] === existKo) || getLexiconIndex().verbByKo.get(existKo);
					if (existUnit) {
						const fig = selectSubjectUnit(options, targetId, false);
						if (fig && fig[DATA_SCHEMA.Id] !== chosenNoun[DATA_SCHEMA.Id]) {
							constituents.push({
								role: "subject",
								nounUnit: fig,
								particleType: "subject"
							});
						}
						predicate = {
							role: "predicate",
							predType: "descriptive",
							verbUnit: existUnit,
							tense: "present",
							politeness: "polite",
							polarity: restOfFormula === "없어요" ? "negative" : "affirmative"
						};
						break;
					}
				}
			}
		} else if (tokenType.startsWith("Adv")) {
			const advUnit = selectAdverbUnit(false, "affirmative", options, targetId);
			if (advUnit) {
				constituents.push({
					role: "adverb",
					unit: advUnit,
					particleType: null
				});
			}
		} else if (tokenType === "Number") {
			const numStr = getSinoNumber(3);
			const withSuffix = resolvePureMorphology(numStr + suffix, state);
			constituents.push({
				role: "number",
				unit: grammarUnit,
				explicitSurfaceKo: withSuffix
			});
			const restOfFormula = formula.slice(m.index + m[0].length).trim();
			if (restOfFormula === "세자") {
				const countVerb = avs.find(v => v[DATA_SCHEMA.Korean] === "세다") || getLexiconIndex().verbByKo.get("세다") || pickRandom(avs);
				if (countVerb) {
					predicate = {
						role: "predicate",
						predType: "action",
						verbUnit: countVerb,
						grammarUnit,
						connectiveSuffix: "자",
						tense: "present",
						politeness: "plain",
						speechAct: "propositive"
					};
					break;
				}
			}
		}
	}

	// If formula was a particle/nominal pattern without a predicate (e.g. "{N}은/는", "{N}이/가", "{N}을/를", "{N:person}께서"),
	// keep the particle constituent and attach a compatible verb predicate!
	if (!predicate && !isSubordinate && constituents.length > 0) {
		const firstCon = constituents[0];
		const baseNoun = firstCon.nounUnit || firstCon.unit;
		if (constituents.length === 1 && baseNoun) {
			const role = firstCon.role;
			const isElder = isElderNoun(baseNoun) || hasTag(grammarUnit, "honorific");
			if (role === "object") {
				const sub = selectSubjectUnit(options, targetId, false);
				if (sub && sub[DATA_SCHEMA.Id] !== baseNoun[DATA_SCHEMA.Id]) {
					constituents.unshift({
						role: "topic",
						nounUnit: sub,
						particleType: "topic"
					});
				}
				const transitiveAvs = avs.filter(v => !isIntransitiveVerb(v) && getVerbParticleType(v) === "object");
				const av = selectActionVerbForNoun(baseNoun, options, targetId) || pickRandom(transitiveAvs) || pickRandom(avs);
				if (av) {
					predicate = {
						role: "predicate",
						predType: "action",
						verbUnit: av,
						tense,
						politeness
					};
				}
			} else {
				const nonHumbleAVs = avs.filter(v => !state.HUMBLE_WORDS.has(v[DATA_SCHEMA.Korean]));
				const chosenV = isElder
					? (pickRandom(nonHumbleAVs) || pickRandom(dvs))
					: (selectDescriptiveVerbForNoun(baseNoun, options, targetId) || selectActionVerbForNoun(baseNoun, options, targetId) || pickRandom(dvs) || pickRandom(avs));
				if (chosenV) {
					const isAct = chosenV[DATA_SCHEMA.PartofSpeech] === "Action Verb";
					if (isAct && (role === "topic" || role === "subject")) {
						const arg = selectArgumentForActionVerb(chosenV, options, targetId);
						if (arg.nounUnit && arg.nounUnit[DATA_SCHEMA.Id] !== baseNoun[DATA_SCHEMA.Id]) {
							constituents.push({
								role: arg.role,
								nounUnit: arg.nounUnit,
								particleType: arg.particleType
							});
						}
					}
					predicate = {
						role: "predicate",
						predType: isAct ? "action" : "descriptive",
						verbUnit: chosenV,
						tense,
						politeness,
						honorific: isElder
					};
				}
			}
		} else {
			const lastCon = constituents[constituents.length - 1];
			const lastNoun = lastCon.nounUnit || lastCon.unit;
			if (lastNoun && lastNoun[DATA_SCHEMA.PartofSpeech] === "Noun") {
				predicate = {
					role: "predicate",
					predType: "copula",
					copulaNounUnit: lastNoun,
					tense: "present",
					politeness: "polite"
				};
				constituents.pop();
			}
		}
	}

	return { constituents, predicate };
}

/**
 * Generates a single grammatical, semantically concordant sentence for `unitOrId`.
 *
 * @param {number|Array} unitOrId Target Language Unit or its numeric ID
 * @param {Object} [options] Generation options (`variationIndex`, `onlyFromSet`, `allowedUnitIds`, `tense`, `politeness`)
 * @returns {Object} Realized sentence object with `{ ok, ko, pronunciation, ast, eojeols, unitsUsed, unitIds, tree }`
 */
function generateSentenceForUnit(unitOrId, options = {}) {
	const units = dataModule.KR_EN_languageUnits || (typeof window !== 'undefined' ? window.KR_EN_languageUnits : []);
	const targetUnit = Array.isArray(unitOrId) ? unitOrId : (typeof unitOrId === "number" && units ? units[unitOrId] : null);

	if (!targetUnit) {
		return {
			ok: false,
			insufficientSet: false,
			missingRoles: [],
			message: `Language unit not found: ${unitOrId}`
		};
	}

	if (options.onlyFromSet && (!options.allowedUnitIds || options.allowedUnitIds.size === 0)) {
		return {
			ok: false,
			insufficientSet: true,
			missingRoles: ["Active Set is empty"],
			message: "Your active practice set is empty. Select some language units on the left to generate sentences from your set."
		};
	}

	const pos = targetUnit[DATA_SCHEMA.PartofSpeech];
	const variationIndex = typeof options.variationIndex === "number" ? options.variationIndex : 0;

	let buildRes;
	if (pos === "Action Verb") {
		buildRes = buildASTForActionVerb(targetUnit, variationIndex, options);
	} else if (pos === "Descriptive Verb") {
		buildRes = buildASTForDescriptiveVerb(targetUnit, variationIndex, options);
	} else if (pos === "Noun" || pos === "Pronoun") {
		buildRes = buildASTForNominal(targetUnit, variationIndex, options);
	} else if (pos === "Grammar") {
		buildRes = buildASTForGrammarUnit(targetUnit, variationIndex, options);
	} else {
		buildRes = buildASTForModifierOrParticleLike(targetUnit, variationIndex, options);
	}

	if (!buildRes || !buildRes.ok) {
		return buildRes || {
			ok: false,
			insufficientSet: true,
			missingRoles: ["Compatible Words"],
			message: "Could not build a sentence with the current constraints."
		};
	}

	const realized = realizeKoreanFromAST(buildRes.ast);
	return {
		ok: true,
		insufficientSet: false,
		targetUnitId: targetUnit[DATA_SCHEMA.Id],
		...realized
	};
}

/**
 * Generates `count` diverse example sentences for `unitOrId`.
 */
function generateSentencesForUnit(unitOrId, count = 3, options = {}) {
	const sentences = [];
	const seenKo = new Set();
	const maxAttempts = count * 4;

	for (let attempt = 0; attempt < maxAttempts && sentences.length < count; attempt++) {
		const res = generateSentenceForUnit(unitOrId, {
			...options,
			variationIndex: attempt
		});
		if (!res.ok) {
			if (sentences.length === 0) {
				return {
					ok: false,
					insufficientSet: Boolean(res.insufficientSet),
					missingRoles: res.missingRoles || [],
					message: res.message || "Insufficient language units in set.",
					sentences: []
				};
			}
			break;
		}
		if (res.ko && !seenKo.has(res.ko)) {
			seenKo.add(res.ko);
			sentences.push(res);
		}
	}

	// Pad if fewer than `count` unique variations were possible from a tiny set
	while (sentences.length > 0 && sentences.length < count) {
		const res = generateSentenceForUnit(unitOrId, {
			...options,
			variationIndex: sentences.length
		});
		if (res.ok && res.ko) {
			sentences.push(res);
		} else {
			break;
		}
	}

	return {
		ok: sentences.length > 0,
		insufficientSet: false,
		missingRoles: [],
		message: null,
		sentences
	};
}

const unitGeneratorExports = {
	generateSentenceForUnit,
	generateSentencesForUnit,
	generateSingleUnitSentenceAST: generateSentenceForUnit,
	generateUnitSentencesAST: generateSentencesForUnit,
	buildASTForActionVerb,
	buildASTForDescriptiveVerb,
	buildASTForNominal,
	buildASTForModifierOrParticleLike,
	buildASTForGrammarUnit
};

if (typeof window !== 'undefined') {
	Object.assign(window, unitGeneratorExports);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = unitGeneratorExports;
}
})();
