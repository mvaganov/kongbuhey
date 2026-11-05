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
	let filtered = filterBySet(raw, options, targetId);
	if (pos === "Descriptive Verb") {
		if (!options.includeCopula) {
			filtered = filtered.filter(u => u[DATA_SCHEMA.Korean] !== "이다" && u[DATA_SCHEMA.Id] !== 55);
		}
		if (!options.includeGreetingPredicates) {
			filtered = filtered.filter(u => u[DATA_SCHEMA.Korean] !== "안녕하다" && u[DATA_SCHEMA.Id] !== 5);
		}
	}
	if (pos === "Noun" && !options.includeBoundNominals) {
		filtered = filtered.filter(u => !hasTag(u, "modifier_root", "bound_noun") && u[DATA_SCHEMA.Korean] !== "데" && !u[DATA_SCHEMA.Korean].endsWith("적"));
	}
	return filtered;
}

/**
 * Selects a person/animate subject or topic noun (or pronoun).
 */
function selectSubjectUnit(options = {}, targetId = null, preferElder = false) {
	const NON_SUBJECT_DEICTICS = new Set([
		"누구", "누가", "무엇", "뭐", "어디", "언제", "얼마", "몇",
		"이곳", "그곳", "저곳", "이거", "그거", "저거", "이것", "그것", "저것"
	]);
	const nouns = getAllUnitsOfPos("Noun", options, targetId).filter(
		n => !hasTag(n, "measureWord") && !hasTag(n, "counter") && !hasTag(n, "position") && n[DATA_SCHEMA.Korean] !== "이" && !NON_SUBJECT_DEICTICS.has(n[DATA_SCHEMA.Korean])
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
				&& !NON_AGENT_PERSON_WORDS.has(n[DATA_SCHEMA.Korean])
		);
		if (elders.length > 0) return pickRandom(elders);
		const respectNouns = nouns.filter(n => (hasTag(n, "profession", "job", "status") || n[DATA_SCHEMA.Korean].endsWith("님")) && !NON_AGENT_PERSON_WORDS.has(n[DATA_SCHEMA.Korean]));
		if (respectNouns.length > 0) return pickRandom(respectNouns);
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

	if (frameRequiresSubject || ["말씀하다", "끓다", "식다", "터지다"].includes(verbKo)) {
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
	if (["삶다", "굽다", "볶다", "튀기다", "다지다", "썰다"].includes(verbKo)) {
		candidates = getAllUnitsOfPos("Noun", options, targetId).filter(
			n => (hasTag(n, "meat", "fish", "vegetable", "solid_food", "ingredient", "food") || ["고기", "생선", "채소", "라면", "돼지고기", "소고기", "닭고기", "달걀", "감자", "양파"].includes(n[DATA_SCHEMA.Korean])) &&
			!hasTag(n, "drink", "liquid", "beverage", "soup", "stew", "place", "facility", "restaurant") &&
			!["물", "주스", "콜라", "사이다", "커피", "차", "술", "맥주", "우유", "뷔페", "식당", "설렁탕", "미역국", "된장찌개", "김치찌개"].includes(n[DATA_SCHEMA.Korean])
		);
	} else if (verbKo === "끓이다") {
		candidates = getAllUnitsOfPos("Noun", options, targetId).filter(
			n => ["물", "라면", "찌개", "국", "탕", "차", "보리차", "설렁탕", "미역국", "된장찌개", "김치찌개"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "soup", "stew", "boilable_liquid")
		);
	} else if (verbKo === "마시다" || (sd && sd.req === "liquid")) {
		candidates = getAllUnitsOfPos("Noun", options, targetId).filter(
			n => hasTag(n, "liquid", "drink", "water", "beverage") || ["물", "주스", "콜라", "사이다", "커피", "차", "술", "맥주", "우유"].includes(n[DATA_SCHEMA.Korean]) || parseSemanticData(n).domain === "liquid"
		);
	} else if (verbKo === "깨다" || verbKo === "깨뜨리다") {
		candidates = getAllUnitsOfPos("Noun", options, targetId).filter(
			n => ["유리", "거울", "접시", "컵", "그릇", "달걀", "잠"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "fragile", "dish", "glasswear")
		);
	} else if (verbKo === "그만두다") {
		candidates = getAllUnitsOfPos("Noun", options, targetId).filter(
			n => ["일", "직장", "회사", "공부", "운동", "아르바이트", "담배", "술"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "job", "work", "habit", "study")
		);
	} else if (hasTag(verbUnit, "cooking") && !sd.collocation_filter) {
		candidates = getAllUnitsOfPos("Noun", options, targetId).filter(
			n => hasTag(n, "food", "ingredient", "meat", "vegetable") && !hasTag(n, "drink", "liquid", "place", "facility")
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
	const nounKo = nounUnit[DATA_SCHEMA.Korean] || "";
	if (hasTag(nounUnit, "teeth") || nounKo === "이") {
		const teethAVs = allAVs.filter(av => ["닦다", "치료하다", "뽑다"].includes(av[DATA_SCHEMA.Korean]));
		if (teethAVs.length > 0) return pickRandom(teethAVs);
	}

	if (nounKo === "잠") {
		const sleepAVs = allAVs.filter(av => ["자다", "깨다", "줄이다"].includes(av[DATA_SCHEMA.Korean]));
		if (sleepAVs.length > 0) return pickRandom(sleepAVs);
	}

	if (nounKo === "길이") {
		const lengthAVs = allAVs.filter(av => ["재다", "보다", "줄이다", "늘이다", "확인하다", "측정하다"].includes(av[DATA_SCHEMA.Korean]));
		if (lengthAVs.length > 0) return pickRandom(lengthAVs);
	}

	if (nounKo === "소화") {
		const digestionAVs = allAVs.filter(av => ["돕다", "시키다", "확인하다"].includes(av[DATA_SCHEMA.Korean]));
		if (digestionAVs.length > 0) return pickRandom(digestionAVs);
	}

	if (nounKo === "기온") {
		const tempAVs = allAVs.filter(av => ["확인하다", "재다", "보다", "알아보다", "측정하다"].includes(av[DATA_SCHEMA.Korean]));
		if (tempAVs.length > 0) return pickRandom(tempAVs);
	}

	if (nounKo === "기분") {
		const moodAVs = allAVs.filter(av => ["풀다", "알다", "이해하다", "생각하다", "바꾸다"].includes(av[DATA_SCHEMA.Korean]));
		if (moodAVs.length > 0) return pickRandom(moodAVs);
	}

	if (nounKo === "휴대") {
		const carryAVs = allAVs.filter(av => ["하다", "돕다"].includes(av[DATA_SCHEMA.Korean]));
		if (carryAVs.length > 0) return pickRandom(carryAVs);
	}

	if (nounKo === "강남스타일") {
		const styleAVs = allAVs.filter(av => ["따라하다", "추다", "부르다", "듣다", "보다", "좋아하다"].includes(av[DATA_SCHEMA.Korean]));
		if (styleAVs.length > 0) return pickRandom(styleAVs);
	}

	if (hasTag(nounUnit, "soup", "stew") || ["설렁탕", "미역국", "된장찌개", "김치찌개"].includes(nounKo)) {
		const soupAVs = allAVs.filter(av => ["먹다", "끓이다", "데우다", "주문하다", "좋아하다", "맛보다"].includes(av[DATA_SCHEMA.Korean]));
		if (soupAVs.length > 0) return pickRandom(soupAVs);
	}

	if (hasTag(nounUnit, "drink", "liquid", "beverage") || ["물", "주스", "콜라", "사이다", "커피", "차", "술", "맥주", "우유"].includes(nounKo)) {
		const drinkAVs = allAVs.filter(av => ["마시다", "사다", "주문하다", "따르다", "좋아하다"].includes(av[DATA_SCHEMA.Korean]));
		if (drinkAVs.length > 0) return pickRandom(drinkAVs);
	}

	const isNonCommodity = hasTag(nounUnit,
		"abstract", "health", "dimension_metric", "bodily_process", "meteorological_metric",
		"psychological_state", "physiological_state", "cultural_concept", "verbal_property",
		"bodyPart", "emotion", "personality", "concept", "rule", "prohibition", "signage"
	) || ["잠", "휴대", "길이", "소화", "기온", "기분", "마음", "성격", "손", "코", "얼굴", "허리", "강남스타일", "주차 금지"].includes(nounKo);

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
		let generalAVs = cleanTransitiveAVs.filter(av => GENERAL_TRANSITIVE_FALLBACK_KOREAN.has(av[DATA_SCHEMA.Korean]));
		if (isNonCommodity) {
			generalAVs = generalAVs.filter(av => !["사다", "팔다", "바꾸다", "주문하다", "이용하다", "사용하다"].includes(av[DATA_SCHEMA.Korean]));
		}
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
	const allDVs = getAllUnitsOfPos("Descriptive Verb", options, targetId).filter(dv => {
		const ko = dv[DATA_SCHEMA.Korean];
		if (!ko || ko.includes(" ")) return false;
		if (["안녕하다", "싶다", "결과 다르다"].includes(ko)) return false;
		return true;
	});
	if (allDVs.length === 0) return null;

	const nounKo = nounUnit[DATA_SCHEMA.Korean] || "";
	if (hasTag(nounUnit, "teeth") || nounKo === "이") {
		const teethDVs = allDVs.filter(dv => ["아프다", "시리다", "좋다", "튼튼하다", "하얗다"].includes(dv[DATA_SCHEMA.Korean]));
		if (teethDVs.length > 0) return pickRandom(teethDVs);
	}

	if (nounKo === "잠") {
		const sleepDVs = allDVs.filter(dv => ["달다", "부족하다", "많다", "적다", "깊다"].includes(dv[DATA_SCHEMA.Korean]));
		if (sleepDVs.length > 0) return pickRandom(sleepDVs);
	}

	if (nounKo === "길이") {
		const lenDVs = allDVs.filter(dv => ["길다", "짧다", "적당하다", "좋다"].includes(dv[DATA_SCHEMA.Korean]));
		if (lenDVs.length > 0) return pickRandom(lenDVs);
	}

	if (nounKo === "소화") {
		const digDVs = allDVs.filter(dv => ["잘되다", "안되다", "좋다", "힘들다"].includes(dv[DATA_SCHEMA.Korean]));
		if (digDVs.length > 0) return pickRandom(digDVs);
	}

	if (nounKo === "기온") {
		const tempDVs = allDVs.filter(dv => ["높다", "낮다", "따뜻하다", "쌀쌀하다"].includes(dv[DATA_SCHEMA.Korean]));
		if (tempDVs.length > 0) return pickRandom(tempDVs);
	}

	if (nounKo === "기분") {
		const moodDVs = allDVs.filter(dv => ["좋다", "나쁘다", "상쾌하다", "괜찮다"].includes(dv[DATA_SCHEMA.Korean]));
		if (moodDVs.length > 0) return pickRandom(moodDVs);
	}

	if (nounKo === "휴대") {
		const carryDVs = allDVs.filter(dv => ["편하다", "쉽다", "좋다"].includes(dv[DATA_SCHEMA.Korean]));
		if (carryDVs.length > 0) return pickRandom(carryDVs);
	}

	if (nounKo === "강남스타일") {
		const styleDVs = allDVs.filter(dv => ["유명하다", "재미있다", "신나다"].includes(dv[DATA_SCHEMA.Korean]));
		if (styleDVs.length > 0) return pickRandom(styleDVs);
	}

	if (hasTag(nounUnit, "soup", "stew") || ["설렁탕", "미역국", "된장찌개", "김치찌개"].includes(nounKo)) {
		const soupDVs = allDVs.filter(dv => ["맛있다", "뜨겁다", "따뜻하다", "싱겁다", "짜다", "얼큰하다"].includes(dv[DATA_SCHEMA.Korean]));
		if (soupDVs.length > 0) return pickRandom(soupDVs);
	}

	if (nounKo === "주차 금지" || hasTag(nounUnit, "prohibition", "rule")) {
		const ruleDVs = allDVs.filter(dv => ["필요하다", "중요하다", "엄격하다", "있다", "없다"].includes(dv[DATA_SCHEMA.Korean]));
		if (ruleDVs.length > 0) return pickRandom(ruleDVs);
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

	const isPricingEligible = hasTag(nounUnit, "commercial_item", "commodity", "goods", "merchandise", "fee", "currency", "food", "clothing", "ticket", "commerce") ||
		["물건", "선물", "음식", "옷", "표", "가방", "모자", "신발", "시계", "자동차"].includes(nounKo);

	// Filter out human appearance/weather adjectives when falling back
	const cleanDVs = allDVs.filter(dv => {
		const ko = dv[DATA_SCHEMA.Korean];
		if (!ko || ko.includes(" ")) return false;
		if (["날씬하다", "뚱뚱하다", "잘생기다", "못생기다", "마르다"].includes(ko)) return false;
		if (["맑다", "흐리다", "쌀쌀하다", "화창하다", "무덥다", "춥다", "덥다"].includes(ko)) return false;
		return true;
	});

	if (cleanDVs.length > 0) {
		let generalDVs = cleanDVs.filter(dv => GENERAL_EVALUATIVE_FALLBACK_KOREAN.has(dv[DATA_SCHEMA.Korean]));
		if (!isPricingEligible) {
			generalDVs = generalDVs.filter(dv => !["비싸다", "싸다"].includes(dv[DATA_SCHEMA.Korean]));
		}
		if (hasTag(nounUnit, "person", "family")) {
			generalDVs = generalDVs.filter(dv => !["울퉁불퉁하다", "매끄럽다", "비싸다", "싸다", "맑다", "흐리다"].includes(dv[DATA_SCHEMA.Korean]));
		}
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
	const verbKo = verbUnit[DATA_SCHEMA.Korean] || "";
	const isInvoluntary = hasTag(verbUnit, "involuntary", "passive", "weather") || ["끝나다", "시작되다", "고장 나다", "죽다", "생기다", "열리다", "닫히다", "끓다", "식다", "터지다", "말씀하다"].some(k => verbKo.includes(k));
	const modality = (variationIndex === 1 && !isHonVerb && !isNominativeSubjectVerb && !isInvoluntary && !options.onlyFromSet) ? "desire" : null;

	let subjUnit = null;
	if (verbKo === "끓다") {
		const liquids = getAllUnitsOfPos("Noun", options, targetId).filter(n => ["물", "라면", "찌개", "국", "탕", "보리차"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "liquid", "soup", "stew"));
		subjUnit = pickRandom(liquids) || null;
	} else if (verbKo === "식다") {
		const hotItems = getAllUnitsOfPos("Noun", options, targetId).filter(n => ["밥", "국", "찌개", "커피", "차", "피자", "음식"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "food", "drink"));
		subjUnit = pickRandom(hotItems) || null;
	} else if (verbKo === "터지다") {
		const inflatables = getAllUnitsOfPos("Noun", options, targetId).filter(n => ["풍선", "타이어"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "object"));
		subjUnit = pickRandom(inflatables) || null;
	} else if (verbKo === "말씀하다") {
		subjUnit = selectSubjectUnit(options, targetId, true);
	} else {
		subjUnit = isNominativeSubjectVerb ? null : selectSubjectUnit(options, targetId, isHonVerb);
	}

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

	if (verbKo === "놓다") {
		const furnitureOrPlace = pickRandom(getAllUnitsOfPos("Noun", options, targetId).filter(n => ["책상", "탁자", "식탁", "의자", "바닥", "침대"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "furniture", "place")));
		const smallObj = pickRandom(getAllUnitsOfPos("Noun", options, targetId).filter(n => ["책", "가방", "모자", "휴대전화", "컵", "그릇", "열쇠"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "object")));
		if (furnitureOrPlace && smallObj) {
			constituents.push({
				role: "location",
				nounUnit: furnitureOrPlace,
				particleType: "location_static"
			});
			constituents.push({
				role: "object",
				nounUnit: smallObj,
				particleType: "object"
			});
		}
	} else if (verbKo === "들어있다") {
		const container = pickRandom(getAllUnitsOfPos("Noun", options, targetId).filter(n => ["가방", "상자", "주머니", "지갑", "방"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "container")));
		const content = pickRandom(getAllUnitsOfPos("Noun", options, targetId).filter(n => ["책", "돈", "지갑", "열쇠", "편지"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "object")));
		if (container && content) {
			constituents.push({
				role: "location",
				nounUnit: container,
				particleType: "location_static"
			});
			constituents.push({
				role: "subject",
				nounUnit: content,
				particleType: "subject"
			});
		}
	} else if (["결석하다", "출석하다", "입학하다"].includes(verbKo)) {
		const instNoun = pickRandom(getAllUnitsOfPos("Noun", options, targetId).filter(n => ["수업", "학교", "대학교", "학원"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "school", "institution", "academic")));
		if (instNoun) {
			constituents.push({
				role: "location",
				nounUnit: instNoun,
				particleType: "location_static"
			});
		}
	} else if (arg.nounUnit) {
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
	const dvKo = dvUnit[DATA_SCHEMA.Korean] || "";
	const tenses = ["present", "past", "present"];
	const tense = options.tense || tenses[variationIndex % tenses.length];
	const politeness = options.politeness || (variationIndex === 2 ? "formal_high" : "polite");

	// Greeting formula 안녕하다 (Unit 5) -> strictly polite formulaic greeting frame
	if (dvKo === "안녕하다" || targetId === 5) {
		const elderNouns = getAllUnitsOfPos("Noun", options, targetId).filter(n => isElderNoun(n) || hasTag(n, "honorific_person", "profession"));
		const addressee = (variationIndex % 2 === 1 && elderNouns.length > 0) ? pickRandom(elderNouns) : null;
		const constituents = [];
		if (addressee) {
			constituents.push({
				role: "topic",
				nounUnit: addressee,
				particleType: "topic"
			});
		}
		return {
			ok: true,
			ast: {
				type: "Sentence",
				targetUnitId: targetId,
				speechAct: "interrogative",
				politeness: variationIndex === 2 ? "formal_high" : "polite",
				tense: "present",
				polarity: "affirmative",
				clauses: [{
					constituents,
					predicate: {
						role: "predicate",
						predType: "descriptive",
						verbUnit: dvUnit,
						tense: "present",
						politeness: variationIndex === 2 ? "formal_high" : "polite",
						speechAct: "interrogative",
						polarity: "affirmative"
					}
				}]
			}
		};
	}

	// Copula 이다 (Unit 55) -> requires complement noun and subject
	if (dvKo === "이다" || targetId === 55) {
		const allNouns = getAllUnitsOfPos("Noun", options, targetId).filter(
			n => !hasTag(n, "measureWord", "counter", "position") && n[DATA_SCHEMA.Korean] !== "이"
		);
		const complementCandidates = allNouns.filter(n => hasTag(n, "profession", "job", "status", "role", "object", "food", "animal", "fruit"));
		const complementNoun = (complementCandidates.length > 0 ? pickRandom(complementCandidates) : pickRandom(allNouns));
		const deicticOrPerson = pickRandom(getAllUnitsOfPos("Pronoun", options, targetId).filter(p => ["이것", "그것", "저것", "이거", "그거", "저거", "저", "나", "우리"].includes(p[DATA_SCHEMA.Korean]))) || selectSubjectUnit(options, targetId, false);
		const subjUnit = deicticOrPerson || pickRandom(allNouns);

		const constituents = [];
		if (subjUnit) {
			constituents.push({
				role: "topic",
				nounUnit: subjUnit,
				particleType: "topic"
			});
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
						predType: "copula",
						verbUnit: dvUnit,
						copulaNounUnit: complementNoun,
						tense,
						politeness,
						speechAct: "declarative",
						polarity: "affirmative"
					}
				}]
			}
		};
	}

	let subjCandidates = filterBySet(getSubjectCandidatesForDescriptiveVerb(dvUnit), options, targetId);
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

	if (variationIndex > 0 && !["있다", "없다"].includes(dvKo)) {
		const degAdv = selectAdverbUnit(true, "affirmative", options, targetId);
		if (degAdv) {
			constituents.push({
				role: "adverb",
				unit: degAdv,
				particleType: null
			});
		}
	} else if (["있다", "없다"].includes(dvKo) && variationIndex % 2 === 1) {
		const placeNouns = getAllUnitsOfPos("Noun", options, targetId).filter(
			n => hasTag(n, "place", "location", "room") && !hasTag(n, "measureWord", "counter", "position")
		);
		const place = pickRandom(placeNouns);
		if (place) {
			constituents.unshift({
				role: "location",
				nounUnit: place,
				particleType: "location_static"
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

	// 0.5. Possessive Pronoun (제, 내, or tags: possessive) -> Attributive modifier before head noun
	if (hasTag(nominalUnit, "possessive") || ko === "제" || (ko === "내" && hasTag(nominalUnit, "pronoun_1st", "possessive"))) {
		const allNouns = getAllUnitsOfPos("Noun", options, targetId).filter(
			n => !hasTag(n, "measureWord", "counter", "time", "position", "questionWord") &&
			!["이", "얼마", "누구", "무엇", "뭐", "어디", "언제", "몇"].includes(n[DATA_SCHEMA.Korean])
		);
		const headNoun = pickRandom(allNouns);
		const isAction = variationIndex % 2 === 1;
		const chosenVerb = isAction
			? (headNoun ? selectActionVerbForNoun(headNoun, options, targetId) : null)
			: (headNoun ? selectDescriptiveVerbForNoun(headNoun, options, targetId) : null);
		if (headNoun && chosenVerb) {
			const isActionVerb = chosenVerb[DATA_SCHEMA.PartofSpeech] === "Action Verb";
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
						constituents: [{
							role: isActionVerb ? "object" : "subject",
							determinerUnit: nominalUnit,
							nounUnit: headNoun,
							particleType: isActionVerb ? "object" : "subject"
						}],
						predicate: {
							role: "predicate",
							predType: isActionVerb ? "action" : "descriptive",
							verbUnit: chosenVerb,
							tense,
							politeness,
							speechAct: "declarative",
							polarity: "affirmative"
						}
					}]
				}
			};
		}
	}

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
				compatibleNouns = allN.filter(n => hasTag(n, "vehicle", "electronics", "machine", "appliance") && !hasTag(n, "ticket", "travel", "activity"));
			} else if (ko === "벌") {
				compatibleNouns = allN.filter(n => hasTag(n, "clothing", "clothes"));
			} else if (ko === "켤레") {
				compatibleNouns = allN.filter(n => hasTag(n, "footwear", "shoes"));
			} else if (ko === "살" || ko === "세") {
				compatibleNouns = allN.filter(n => ["아이", "아기", "학생", "동생", "조카", "친구"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "child", "junior"));
			} else if (ko === "채") {
				compatibleNouns = allN.filter(n => ["집", "하숙집", "빌딩", "건물", "아파트"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "building", "housing"));
			} else if (ko === "호") {
				compatibleNouns = allN.filter(n => ["방", "교실", "사무실", "호실"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "room", "office"));
			} else if (ko === "학년") {
				compatibleNouns = allN.filter(n => ["초등학교", "중학교", "고등학교", "대학교", "대학원", "학생"].includes(n[DATA_SCHEMA.Korean]) || (hasTag(n, "school") && !hasTag(n, "place", "facility", "room", "hall") && !["대강당", "강당", "교실", "학원"].includes(n[DATA_SCHEMA.Korean])));
			} else if (ko === "편") {
				compatibleNouns = allN.filter(n => ["영화", "드라마", "시", "소설", "비디오"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "media_work", "film", "literature"));
			} else if (ko === "%") {
				compatibleNouns = allN.filter(n => ["할인", "이자율", "확률", "비율", "성공률"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "rate_proportion", "discount", "finance"));
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
				honorific: false,
				clauses: [{
					honorific: false,
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
						polarity: "affirmative",
						honorific: false
					}
				}]
			}
		};
	}

	// 1.5. Bound Noun 데 (Unit 2025)
	if (ko === "데" || (hasTag(nominalUnit, "bound_noun") && ko === "데")) {
		const actionVerbs = getAllUnitsOfPos("Action Verb", options, targetId).filter(v => ["가다", "살다", "쉬다", "만나다", "공부하다"].includes(v[DATA_SCHEMA.Korean]));
		const descriptiveVerbs = getAllUnitsOfPos("Descriptive Verb", options, targetId).filter(v => ["좋다", "조용하다", "깨끗하다", "편하다", "따뜻하다"].includes(v[DATA_SCHEMA.Korean]));
		const modVerb = (variationIndex % 2 === 0 ? pickRandom(descriptiveVerbs) : pickRandom(actionVerbs)) || pickRandom(descriptiveVerbs);
		const modStem = modVerb ? getConjugatedStem(modVerb[DATA_SCHEMA.Korean], modVerb[DATA_SCHEMA.Conjugation]) : "좋";
		const modEnding = (modVerb && modVerb[DATA_SCHEMA.PartofSpeech] === "Action Verb") ? "는" : "으/ㄴ";
		const modKo = resolvePureMorphology(modStem + modEnding, state);
		const subjUnit = selectSubjectUnit(options, targetId, false);
		const mainVerb = pickRandom(getAllUnitsOfPos("Action Verb", options, targetId).filter(v => ["찾다", "가다", "좋아하다", "원하다", "알아보다"].includes(v[DATA_SCHEMA.Korean]))) || pickRandom(getAllUnitsOfPos("Action Verb", options, targetId));
		const mainVerbKo = mainVerb ? mainVerb[DATA_SCHEMA.Korean] : "";
		const isMotion = ["가다", "오다", "다니다", "살다"].includes(mainVerbKo);
		const deRole = isMotion ? "location" : "object";
		const deParticle = isMotion ? "location_static" : "object";

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
					constituents: [
						{
							role: "subject",
							nounUnit: subjUnit,
							particleType: "subject"
						},
						{
							role: deRole,
							nounUnit: nominalUnit,
							modifierSurfaceKo: resolvePureMorphology(modKo, state),
							particleType: deParticle
						}
					],
					predicate: {
						role: "predicate",
						predType: "action",
						verbUnit: mainVerb,
						tense,
						politeness,
						speechAct: "declarative",
						polarity: "affirmative"
					}
				}]
			}
		};
	}

	// 1.6. Sino-Korean -적 Bound Modifier Root (인간적, 감각적...)
	if (hasTag(nominalUnit, "modifier_root") || (ko.endsWith("적") && hasTag(nominalUnit, "concept", "personality", "trait"))) {
		const allNouns = getAllUnitsOfPos("Noun", options, targetId).filter(
			n => !hasTag(n, "measureWord", "counter", "position") && n[DATA_SCHEMA.Korean] !== "이" && n[DATA_SCHEMA.Id] !== targetId
		);
		const headNounCandidates = allNouns.filter(n => hasTag(n, "person", "personality", "abstract", "art", "culture", "design", "general"));
		const headNoun = headNounCandidates.length > 0 ? pickRandom(headNounCandidates) : pickRandom(allNouns);
		const subjUnit = selectSubjectUnit(options, targetId, false);

		if (variationIndex % 2 === 0) {
			const adnominalKo = `${ko}인`;
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
						constituents: [
							{
								role: "subject",
								nounUnit: subjUnit,
								particleType: "subject"
							},
							{
								role: "object",
								nounUnit: headNoun,
								modifierSurfaceKo: adnominalKo,
								particleType: "object"
							}
						],
						predicate: {
							role: "predicate",
							predType: "action",
							verbUnit: pickRandom(getAllUnitsOfPos("Action Verb", options, targetId).filter(v => ["좋아하다", "원하다", "찾다", "바라다", "생각하다"].includes(v[DATA_SCHEMA.Korean]))) || selectActionVerbForNoun(headNoun, options, targetId),
							tense,
							politeness,
							speechAct: "declarative",
							polarity: "affirmative"
						}
					}]
				}
			};
		} else {
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
						constituents: [{
							role: "topic",
							nounUnit: subjUnit || headNoun,
							particleType: "topic"
						}],
						predicate: {
							role: "predicate",
							predType: "copula",
							verbUnit: getAllUnitsOfPos("Descriptive Verb", options, targetId).find(v => v[DATA_SCHEMA.Korean] === "이다") || null,
							copulaNounUnit: nominalUnit,
							tense,
							politeness,
							speechAct: "declarative",
							polarity: "affirmative"
						}
					}]
				}
			};
		}
	}

	// 2. Spatial Position Noun (위, 아래, 앞, 뒤, 옆, 안, 밖, 사이)
	if (hasTag(nominalUnit, "position") || state.SPATIAL_POSITIONS.has(ko)) {
		const groundNouns = getAllUnitsOfPos("Noun", options, targetId).filter(
			n => n[DATA_SCHEMA.Id] !== targetId &&
			hasTag(n, "place", "furniture", "room", "building", "facility", "housing", "container") &&
			!hasTag(n, "measureWord", "counter", "position", "language", "abstract", "traffic") &&
			!["이", "나이", "말", "한국말", "베트남말", "중국말", "일본말", "영어"].includes(n[DATA_SCHEMA.Korean])
		);
		const subjNouns = getAllUnitsOfPos("Noun", options, targetId).filter(
			n => n[DATA_SCHEMA.Id] !== targetId &&
			!hasTag(n, "measureWord", "counter", "position", "time", "abstract", "attribute", "metric", "emotion", "psychological_state", "bodily_process", "concept", "language") &&
			!["이", "나이", "기분", "소화", "기온", "길이", "성격", "마음", "스트레스", "여유", "잠", "베트남말", "한국말"].includes(n[DATA_SCHEMA.Korean])
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
		const isTimeModifier = ko === "지난" || hasTag(nominalUnit, "time_modifier", "determiner");
		if (isTimeModifier) tense = "past";
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
		const dvs = getAllUnitsOfPos("Descriptive Verb", options, targetId).filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (vKo.includes(" ")) return false;
			if (["안녕하다", "싶다", "결과 다르다"].includes(vKo)) return false;
			return true;
		});
		const verbUnit = (variationIndex % 2 === 0 && avs.length > 0) ? pickRandom(avs) : (pickRandom(dvs) || pickRandom(avs));

		if (options.onlyFromSet && !verbUnit) {
			return {
				ok: false,
				insufficientSet: true,
				missingRoles: ["Action Verb or Descriptive Verb"],
				message: "Cannot build a sentence using only your current set: add at least one Action Verb or Descriptive Verb."
			};
		}

		let timeNounForSlot = nominalUnit;
		let determinerForSlot = null;
		if (isTimeModifier) {
			const timeNounCandidates = getAllUnitsOfPos("Noun", options, targetId).filter(n =>
				["달", "주", "해", "번", "학기", "겨울", "여름"].includes(n[DATA_SCHEMA.Korean])
			);
			if (timeNounCandidates.length > 0) {
				timeNounForSlot = pickRandom(timeNounCandidates);
				determinerForSlot = nominalUnit;
			}
		}

		const constituents = [{
			role: "time",
			nounUnit: timeNounForSlot,
			determinerUnit: determinerForSlot,
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

	// 4. Place / Location Noun (학교, 도서관, 집, 한국, 식당, 여기, 거기, 어디, 이곳, 저곳...)
	if (hasTag(nominalUnit, "place", "location", "institution", "facility") || ["여기", "거기", "저기", "어디", "이곳", "그곳", "저곳"].includes(ko)) {
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

		const isKyesida = verbUnit && (verbUnit[DATA_SCHEMA.Korean] === "계시다" || verbUnit[DATA_SCHEMA.Korean] === "있다");
		constituents.push({
			role: "location",
			nounUnit: nominalUnit,
			particleType: (isMotionOrStatic || isKyesida) ? "location_static" : "location_dynamic"
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
	const isPersonalPronoun = ["나", "저", "우리", "저희", "너", "너희", "그", "그녀", "당신", "누구", "누가", "제", "내", "네"].includes(ko);
	const isPerson = isPersonalPronoun || hasTag(nominalUnit, "person", "family", "profession", "animal", "subject_animate");
	const isNonPersonDeictic = ["이것", "그것", "저것", "이거", "그거", "저거", "무엇", "뭐", "얼마", "몇", "여기", "거기", "저기", "어디", "이곳", "그곳", "저곳", "언제", "며칠"].includes(ko);
	if (isPerson && !isNonPersonDeictic) {
		const isElder = isElderNoun(nominalUnit);
		const isFirstPerson = ["저", "나", "우리", "저희", "제", "내"].includes(ko);
		const isJunior = hasTag(nominalUnit, "child", "junior") || ["아이", "조카", "동생", "남동생", "여동생", "사나이", "놈"].includes(ko);
		const isInterrogative = ko === "누구" || ko === "누가";
		const allAvs = getAllUnitsOfPos("Action Verb", options, targetId);
		const avs = allAvs.filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (vKo.includes(" ")) return false;
			if (isIntransitiveVerb(v)) return false;
			if (getVerbParticleType(v) !== "object") return false;
			if ((!isElder || isFirstPerson || isJunior) && state.HONORIFIC_WORDS.has(vKo)) return false;
			return true;
		});
		const dvs = getAllUnitsOfPos("Descriptive Verb", options, targetId).filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if ((!isElder || isFirstPerson || isJunior) && state.HONORIFIC_WORDS.has(vKo)) return false;
			if (["울퉁불퉁하다", "매끄럽다", "비싸다", "싸다", "맑다", "흐리다", "파랗다", "하얗다", "노랗다", "빨갛다", "까맣다", "푸르다", "안녕하다"].includes(vKo)) return false;
			return true;
		});
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
								role: isInterrogative ? "subject" : "topic",
								nounUnit: nominalUnit,
								particleType: isInterrogative ? "subject" : "topic"
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

		const nominalParticle = isInterrogative ? "subject" : (variationIndex % 2 === 0 ? "topic" : "subject");
		const nominalRole = isInterrogative ? "subject" : (variationIndex % 2 === 0 ? "topic" : "subject");
		const constituents = [{
			role: nominalRole,
			nounUnit: nominalUnit,
			particleType: nominalParticle
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
		const partType = isInterrogative ? "subject" : (variationIndex === 1 ? "topic" : "subject");
		const roleType = isInterrogative ? "subject" : (variationIndex === 1 ? "topic" : "subject");
		constituents.push({
			role: roleType,
			nounUnit: nominalUnit,
			particleType: partType
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
				n => !hasTag(n, "measureWord", "counter", "time", "position", "questionWord") &&
				!["이", "얼마", "누구", "무엇", "뭐", "어디", "언제", "몇"].includes(n[DATA_SCHEMA.Korean])
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
		const headNoun = pickRandom(nouns);
		const isAction = variationIndex % 2 === 1;
		const chosenVerb = isAction
			? (headNoun ? selectActionVerbForNoun(headNoun, options, targetId) : pickRandom(avs))
			: (headNoun ? selectDescriptiveVerbForNoun(headNoun, options, targetId) : pickRandom(dvs));

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

		const isActionVerb = chosenVerb[DATA_SCHEMA.PartofSpeech] === "Action Verb";
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
						role: isActionVerb ? "object" : "subject",
						determinerUnit: unit,
						nounUnit: headNoun,
						particleType: isActionVerb ? "object" : "subject"
					}],
					predicate: {
						role: "predicate",
						predType: isActionVerb ? "action" : "descriptive",
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
		const isAction = variationIndex % 2 === 1;
		const allAvs = getAllUnitsOfPos("Action Verb", options, targetId);
		const avs = allAvs.filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (vKo.includes(" ")) return false;
			if (isIntransitiveVerb(v)) return false;
			if (getVerbParticleType(v) !== "object") return false;
			return true;
		});
		const dvs = getAllUnitsOfPos("Descriptive Verb", options, targetId).filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (["싶다", "안녕하다", "죄송하다", "어떻다", "이렇다", "그렇다", "저렇다"].includes(vKo)) return false;
			if (hasTag(v, "auxiliary", "connective", "greeting")) return false;
			return true;
		});

		const constituents = [{
			role: "discourse",
			unit,
			particleType: null
		}];

		if (isAction && avs.length > 0) {
			const chosenVerb = pickRandom(avs);
			const subj = selectSubjectUnit(options, targetId, false);
			const arg = selectArgumentForActionVerb(chosenVerb, options, targetId);
			if (subj) {
				constituents.push({
					role: "subject",
					nounUnit: subj,
					particleType: "subject"
				});
			}
			if (arg.nounUnit && (!subj || arg.nounUnit[DATA_SCHEMA.Id] !== subj[DATA_SCHEMA.Id])) {
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
					speechAct: "declarative",
					politeness,
					tense: "present",
					polarity: "affirmative",
					clauses: [{
						constituents,
						predicate: {
							role: "predicate",
							predType: "action",
							verbUnit: chosenVerb,
							tense: "present",
							politeness,
							speechAct: "declarative",
							polarity: "affirmative"
						}
					}]
				}
			};
		} else {
			const chosenVerb = pickRandom(dvs) || pickRandom(avs);
			const subjCandidates = chosenVerb ? filterBySet(getSubjectCandidatesForDescriptiveVerb(chosenVerb), options, targetId)
				.filter(u => u[DATA_SCHEMA.Id] !== 361 && !["인형", "드라마", "자전거", "오토바이", "햇빛"].includes(u[DATA_SCHEMA.Korean])) : [];
			const subj = (subjCandidates.length > 0 ? pickRandom(subjCandidates) : selectSubjectUnit(options, targetId, false));
			if (subj) {
				constituents.push({
					role: "subject",
					nounUnit: subj,
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
							predType: chosenVerb && chosenVerb[DATA_SCHEMA.PartofSpeech] === "Action Verb" ? "action" : "descriptive",
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
	}

	// 4. Adverb (Degree, Manner, Time, Discourse, NPI, Short Negation)
	if (ko === "아무리") {
		const avs = getAllUnitsOfPos("Action Verb", options, targetId).filter(v => !state.FORBIDDEN_NEGATIVE_ROOTS.has(v[DATA_SCHEMA.Korean]) && !v[DATA_SCHEMA.Korean].includes(" "));
		const dvs = getAllUnitsOfPos("Descriptive Verb", options, targetId).filter(v => !state.FORBIDDEN_NEGATIVE_ROOTS.has(v[DATA_SCHEMA.Korean]) && !["안녕하다", "싶다", "어떠하다"].includes(v[DATA_SCHEMA.Korean]));
		const dv1 = pickRandom(dvs) || dvs[0];
		const dvSubjs = dv1 ? filterBySet(getSubjectCandidatesForDescriptiveVerb(dv1), options, targetId).filter(u => u[DATA_SCHEMA.Id] !== 361) : [];
		const subj1 = dvSubjs.length > 0 ? pickRandom(dvSubjs) : selectSubjectUnit(options, targetId, false);
		const verb2 = (variationIndex % 2 === 0 && avs.length > 0) ? pickRandom(avs) : (pickRandom(dvs) || pickRandom(avs));
		const isAct2 = verb2 && verb2[DATA_SCHEMA.PartofSpeech] === "Action Verb";
		const arg2 = (isAct2 && !hasTag(verb2, "scalable_duration", "scalable_quantity")) ? selectArgumentForActionVerb(verb2, options, targetId) : { nounUnit: null };

		const clause1Constituents = [
			{ role: "adverb", unit, particleType: null }
		];
		if (subj1) {
			clause1Constituents.push({ role: "subject", nounUnit: subj1, particleType: "subject" });
		}
		const clause2Constituents = [];
		if (arg2.nounUnit) {
			clause2Constituents.push({ role: arg2.role, nounUnit: arg2.nounUnit, particleType: arg2.particleType });
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
				clauses: [
					{
						constituents: clause1Constituents,
						predicate: {
							role: "predicate",
							predType: "descriptive",
							verbUnit: dv1,
							connectiveSuffix: "아/어도"
						}
					},
					{
						constituents: clause2Constituents,
						predicate: {
							role: "predicate",
							predType: isAct2 ? "action" : "descriptive",
							verbUnit: verb2,
							tense: "present",
							politeness,
							speechAct: "declarative",
							polarity: "affirmative"
						}
					}
				]
			}
		};
	}

	if (ko === "왜냐하면") {
		const avs = getAllUnitsOfPos("Action Verb", options, targetId).filter(v => !state.FORBIDDEN_NEGATIVE_ROOTS.has(v[DATA_SCHEMA.Korean]) && !v[DATA_SCHEMA.Korean].includes(" "));
		const dvs = getAllUnitsOfPos("Descriptive Verb", options, targetId).filter(v => !state.FORBIDDEN_NEGATIVE_ROOTS.has(v[DATA_SCHEMA.Korean]) && !["안녕하다", "싶다", "어떠하다"].includes(v[DATA_SCHEMA.Korean]));
		const chosenVerb = (variationIndex % 2 === 0 && avs.length > 0) ? pickRandom(avs) : (pickRandom(dvs) || pickRandom(avs));
		const isAction = chosenVerb[DATA_SCHEMA.PartofSpeech] === "Action Verb";
		const subj = isAction ? selectSubjectUnit(options, targetId, false) : (filterBySet(getSubjectCandidatesForDescriptiveVerb(chosenVerb), options, targetId)[0] || selectSubjectUnit(options, targetId, false));
		const arg = (isAction && !hasTag(chosenVerb, "scalable_duration", "scalable_quantity")) ? selectArgumentForActionVerb(chosenVerb, options, targetId) : { nounUnit: null };

		const constituents = [
			{ role: "discourse", unit, particleType: null }
		];
		if (subj) {
			constituents.push({ role: "topic", nounUnit: subj, particleType: "topic" });
		}
		if (arg.nounUnit && (!subj || arg.nounUnit[DATA_SCHEMA.Id] !== subj[DATA_SCHEMA.Id])) {
			constituents.push({ role: arg.role, nounUnit: arg.nounUnit, particleType: arg.particleType });
		}

		const stem = getStem(chosenVerb[DATA_SCHEMA.Korean]);
		const explEnding = politeness === "formal_high" ? "기 때문입니다" : "기 때문이에요";

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
						predType: isAction ? "action" : "descriptive",
						verbUnit: chosenVerb,
						explicitSurfaceKo: stem + explEnding,
						tense: "present",
						politeness,
						speechAct: "declarative",
						polarity: "affirmative"
					}
				}]
			}
		};
	}

	if (ko === "한" && (hasTag(unit, "approximation", "number_unit") || targetId === 1521)) {
		const counters = ["명", "개", "권", "잔", "병", "시간", "달", "마리"];
		const cKo = counters[variationIndex % counters.length];
		const counterUnit = state.CLASSIFIER_UNITS.get(cKo) || getAllUnitsOfPos("Noun", options, targetId).find(n => n[DATA_SCHEMA.Korean] === cKo) || null;
		let compatibleNouns = filterBySet(getMatchingNounsForClassifier(cKo), options, targetId);
		if (compatibleNouns.length === 0) {
			compatibleNouns = getAllUnitsOfPos("Noun", options, targetId).filter(n => !hasTag(n, "measureWord", "counter", "time", "position"));
		}
		const headNoun = pickRandom(compatibleNouns);
		const numVals = [2, 3, 5, 10];
		const numVal = numVals[variationIndex % numVals.length];
		const numKo = getKoreanNumber(numVal, true);

		const modifierPhrase = `한 ${numKo}`;
		const isExistential = variationIndex % 2 === 0;
		const verbUnit = isExistential
			? (getAllUnitsOfPos("Descriptive Verb", options, targetId).find(v => v[DATA_SCHEMA.Korean] === "있다") || null)
			: (headNoun ? selectActionVerbForNoun(headNoun, options, targetId) : null);

		const isAction = verbUnit && verbUnit[DATA_SCHEMA.PartofSpeech] === "Action Verb";
		const constituents = [{
			role: isAction ? "object" : "subject",
			nounUnit: headNoun,
			numberSurfaceKo: modifierPhrase,
			counterUnit,
			particleType: isAction ? "object" : "subject"
		}];
		if (isAction) {
			const subj = selectSubjectUnit(options, targetId, false);
			if (subj) {
				constituents.unshift({ role: "topic", nounUnit: subj, particleType: "topic" });
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
					predicate: {
						role: "predicate",
						predType: isAction ? "action" : "descriptive",
						verbUnit,
						tense: "present",
						politeness,
						speechAct: "declarative",
						polarity: "affirmative"
					}
				}]
			}
		};
	}

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

	const polarity = (isNPI || isShortAn || isShortMot || ko === "아직") ? "negative" : "affirmative";
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
			if (grammarUnit[DATA_SCHEMA.Korean] === "씨" || targetId === 23) {
				const personalNames = allNouns.filter(
					n => ["마리", "민수", "지훈", "수진", "영수", "유키", "올리비아", "미진", "리타오", "흐엉", "에릭", "민준"].includes(n[DATA_SCHEMA.Korean])
						|| (hasTag(n, "properNoun") && hasTag(n, "person"))
				);
				if (personalNames.length > 0) pool = personalNames;
			} else {
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

				const joiner = (suffix === "씨" || suffix.startsWith("씨")) ? " " : "";
				const withSuffix = resolvePureMorphology(chosenNoun[DATA_SCHEMA.Korean] + joiner + suffix, state);
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
			const isElder = (grammarUnit[DATA_SCHEMA.Korean] !== "씨" && targetId !== 23) && (isElderNoun(baseNoun) || hasTag(grammarUnit, "honorific"));
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
