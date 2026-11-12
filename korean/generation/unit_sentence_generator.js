(function() {
// Universal Constants
const { K } = (typeof require !== 'undefined') ? require('../../constants.js') : (typeof window !== 'undefined' ? window : {});

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
	isDeicticTimeWord,
	canTakeMood
} = (typeof require !== 'undefined' ? require('../core/morphology.js') : window);

const {
	getClassifierNumeralType,
	getMatchingClassifier,
	getMatchingNounsForClassifier
} = (typeof require !== 'undefined' ? require('../concord/classifier_concord.js') : window);

const {
	canAdverbPrecede
} = (typeof require !== 'undefined' ? require('../concord/adverbial_concord.js') : window);

const {
	getGrammarRegistry,
	resolveParticleUnit,
	resolveEndingUnit,
	makeSegment,
	splitNounAndParticleSegments,
	splitSingleVerbWordSegments,
	realizeKoreanFromAST
} = (typeof require !== 'undefined' ? require('./sentence_ast.js') : window);

function pickRandom(arr, seedOffset = null, options = null) {
	if (!arr || arr.length === 0) return null;
	let pool = arr;
	if (options && options.difficultyTier) {
		const tier = options.difficultyTier;
		if (tier === 'easiest') {
			let minScore = 999;
			for (let i = 0; i < arr.length; i++) {
				const sc = arr[i][DATA_SCHEMA.PriorityScore] || 3;
				if (sc < minScore) minScore = sc;
			}
			const easy = arr.filter(u => (u[DATA_SCHEMA.PriorityScore] || 3) <= minScore);
			if (easy.length > 0) pool = easy;
		} else if (tier === 'easy_and_inset') {
			const allowed = options.allowedUnitIds instanceof Set ? options.allowedUnitIds : null;
			const inSetPool = allowed ? arr.filter(u => allowed.has(u[DATA_SCHEMA.Id])) : [];
			const easyPool = arr.filter(u => (u[DATA_SCHEMA.PriorityScore] || 3) <= 2);
			const rndChoice = (state && typeof state.seededRandom === 'function') ? state.seededRandom() : Math.random();
			if (inSetPool.length > 0 && easyPool.length > 0) {
				pool = (rndChoice < 0.5) ? inSetPool : easyPool;
			} else if (inSetPool.length > 0) {
				pool = inSetPool;
			} else if (easyPool.length > 0) {
				pool = easyPool;
			}
		}
	}
	if (typeof seedOffset === 'number' && seedOffset >= 0) {
		return pool[seedOffset % pool.length];
	}
	const rnd = (state && typeof state.seededRandom === 'function') ? state.seededRandom() : Math.random();
	return pool[Math.floor(rnd * pool.length)];
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
	if (pos === K.DESCRIPTIVE_VERB) {
		if (!options.includeCopula) {
			filtered = filtered.filter(u => u[DATA_SCHEMA.Korean] !== "이다" && u[DATA_SCHEMA.Id] !== 55);
		}
		if (!options.includeGreetingPredicates) {
			filtered = filtered.filter(u => u[DATA_SCHEMA.Korean] !== "안녕하다" && u[DATA_SCHEMA.Id] !== 5);
		}
	}
	if (pos === K.NOUN && !options.includeBoundNominals) {
		filtered = filtered.filter(u => !hasTag(u, "modifier_root", "bound_noun") && u[DATA_SCHEMA.Korean] !== "데" && !u[DATA_SCHEMA.Korean].endsWith("적"));
	}
	if ((pos === K.NOUN || pos === K.PRONOUN) && !options.includePossessive) {
		filtered = filtered.filter(u => {
			if (targetId != null && u[DATA_SCHEMA.Id] === targetId) return true;
			const sd = parseSemanticData(u);
			return !hasTag(u, "possessive") && !(sd.en && sd.en.possOnly);
		});
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
	const nouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
		n => !hasTag(n, K.MEASUREWORD) && !hasTag(n, "counter") && !hasTag(n, "position") && !hasTag(n, "possessive") && !(parseSemanticData(n).en && parseSemanticData(n).en.possOnly) && n[DATA_SCHEMA.Korean] !== "이" && !NON_SUBJECT_DEICTICS.has(n[DATA_SCHEMA.Korean])
	);
	const pronouns = getAllUnitsOfPos(K.PRONOUN, options, targetId).filter(
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
		n => hasTag(n, K.PERSON, K.FAMILY, "profession", "subject_animate")
			&& !hasTag(n, "body_part", "body", K.ABSTRACT, K.PLACE, K.TIME, K.CLOTHING, K.FOOD, "illness", "symptom", K.TRAVEL, "event", K.ACTIVITY, K.OBJECT, "building", K.FACILITY, "institution", "language", "country", "name", "informal")
			&& !(hasTag(n, "colloquial") && parseSemanticData(n).polarity === -1)
			&& !["얘들", "놈", "녀석"].includes(n[DATA_SCHEMA.Korean])
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
		K.INTRANSITIVE,
		K.INTRANSITIVE_GENERAL,
		"intransitive_motion",
		"intransitive_place",
		"intransitive_state",
		"intransitive_food",
		"intransitive_person",
		"passive",
		K.WEATHER,
		"locative_static",
		"posture",
		K.HEALTH
	)) return true;
	const sd = parseSemanticData(verbUnit);
	if (sd.type === K.INTRANSITIVE || sd.req === "subject") return true;
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
		(sd.type === K.INTRANSITIVE && sd.req && sd.req !== K.PERSON && sd.req !== "any") ||
		sd.req === "subject";

	if (frameRequiresSubject || ["말씀하다", "끓다", "식다", "터지다", "들어있다"].includes(verbKo)) {
		return { nounUnit: null, role: null, particleType: null };
	}

	const isTransPlacement = ["놓다", "올려놓다", "두다", "담다", "넣다"].includes(verbKo) || hasTag(verbUnit, K.TRANSITIVE_GENERAL, "transitive_place");
	const isPathMotion = sd.req === "path" || verbKo === "지나가다";
	const isLocativeOrigin = hasTag(verbUnit, "locative_origin") || ["출발하다", "나가다", "나오다", "출국하다", "떠나다"].includes(verbKo);
	const isLocativeStatic = !isLocativeOrigin && !isTransPlacement && (hasTag(verbUnit, "locative_static", "posture") || ["눕다", "앉다", "살다"].includes(verbKo));
	const isLocativeMotion = !isLocativeOrigin && !isPathMotion && !isTransPlacement && hasTag(verbUnit, "intransitive_motion", "intransitive_place", "locative_goal");
	const isPureIntransitive = isIntransitiveVerb(verbUnit);

	if (isPathMotion) {
		const pathNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n =>
			["길", "거리", "횡단보도", "다리", "공원", "학교"].includes(n[DATA_SCHEMA.Korean])
		);
		if (pathNouns.length > 0) {
			return { nounUnit: pickRandom(pathNouns), role: K.OBJECT, particleType: K.OBJECT };
		}
		return { nounUnit: null, role: null, particleType: null };
	}

	if (isLocativeOrigin) {
		let originPlaces;
		if (verbKo === "출국하다") {
			originPlaces = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n =>
				["공항", "인천공항", "김포공항", "한국", "미국", "일본", "중국", "서울"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "country", "airport")
			);
		} else {
			originPlaces = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n =>
				hasTag(n, K.PLACE, "location", K.FACILITY, "country", "city") && !hasTag(n, K.MEASUREWORD, "position") && !["서양", "동양", "세계"].includes(n[DATA_SCHEMA.Korean])
			);
		}
		if (originPlaces.length > 0) {
			return { nounUnit: pickRandom(originPlaces), role: "location", particleType: "location_dynamic" };
		}
		return { nounUnit: null, role: null, particleType: null };
	}

	if (isLocativeStatic) {
		const places = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n =>
			hasTag(n, K.PLACE, "location", K.FACILITY, "furniture") || ["침대", "방", "집", "소파", "의자"].includes(n[DATA_SCHEMA.Korean])
		);
		if (places.length > 0) {
			return { nounUnit: pickRandom(places), role: "location", particleType: "location_static" };
		}
		return { nounUnit: null, role: null, particleType: null };
	}

	if (isLocativeMotion) {
		const isDynamicActivityMotion = ["달리다", "걷다", "뛰다", "산책하다", "조깅하다", "수영하다", "등산하다"].includes(verbKo);
		let places;
		if (verbKo === "이사하다") {
			places = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n =>
				hasTag(n, "housing", "residence", "city", "country") || ["집", "원룸", "아파트", "기숙사", "하숙집", "방", "서울", "부산", "대구", "인천", "한국", "고향", "동네"].includes(n[DATA_SCHEMA.Korean])
			);
		} else if (verbKo === "결석하다") {
			places = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n =>
				["학교", "수업", "학원", "모임", "회의", "대학교"].includes(n[DATA_SCHEMA.Korean])
			);
		} else if (verbKo === "달리다") {
			places = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n =>
				["공원", "한강공원", "운동장", "길", "거리", "산", "바다"].includes(n[DATA_SCHEMA.Korean])
			);
		} else {
			places = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => hasTag(n, K.PLACE, "location", "institution", K.FACILITY));
		}
		if (places.length > 0) {
			return { nounUnit: pickRandom(places), role: "location", particleType: isDynamicActivityMotion ? "location_dynamic" : "location_static" };
		}
		return { nounUnit: null, role: null, particleType: null };
	}

	if (isPureIntransitive) {
		return { nounUnit: null, role: null, particleType: null };
	}

	const particleType = getVerbParticleType(verbUnit);

	let candidates = [];
	if (["삶다", "굽다", "볶다", "튀기다", "다지다", "썰다"].includes(verbKo) && !sd.collocation_filter) {
		candidates = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => (hasTag(n, "meat", "fish", "vegetable", "solid_food", "ingredient", K.FOOD) || ["고기", "생선", "채소", "라면", "돼지고기", "소고기", "닭고기", "달걀", "감자", "양파"].includes(n[DATA_SCHEMA.Korean])) &&
			!hasTag(n, "drink", "liquid", "beverage", "soup", "stew", K.PLACE, K.FACILITY, "restaurant") &&
			!["물", "주스", "콜라", "사이다", "커피", "차", "술", "맥주", "우유", "뷔페", "식당", "설렁탕", "미역국", "된장찌개", "김치찌개"].includes(n[DATA_SCHEMA.Korean])
		);
	} else if (verbKo === "끓이다") {
		candidates = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => ["물", "라면", "찌개", "국", "탕", "차", "보리차", "설렁탕", "미역국", "된장찌개", "김치찌개"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "soup", "stew", "boilable_liquid")
		);
	} else if ((verbKo === "마시다" || (sd && sd.req === "liquid")) && !sd.collocation_filter) {
		candidates = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => !hasTag(n, K.MEASUREWORD, "counter", "sports", "waterSports", K.ACTIVITY) && (
				hasTag(n, "drink", "beverage")
				|| parseSemanticData(n).domain === "drink"
				|| (["물", "주스", "콜라", "사이다", "커피", "차", "술", "맥주", "우유"].includes(n[DATA_SCHEMA.Korean])
					&& !hasTag(n, K.TRANSPORTATION, "vehicle") && parseSemanticData(n).domain !== K.TRANSPORTATION)
			)
		);
	} else if (verbKo === "깨다" || verbKo === "깨뜨리다") {
		candidates = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => ["유리", "거울", "접시", "컵", "그릇", "달걀", "잠"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "fragile", "dish", "glasswear")
		);
	} else if (verbKo === "그만두다") {
		candidates = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => ["일", "직장", "회사", "공부", "운동", "아르바이트", "담배", "술"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "job", "work", "habit", "study")
		);
	} else if (hasTag(verbUnit, "cooking") && !sd.collocation_filter) {
		candidates = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => hasTag(n, K.FOOD, "ingredient", "meat", "vegetable") && !hasTag(n, "drink", "liquid", K.PLACE, K.FACILITY)
		);
	}
	if (candidates.length === 0) {
		candidates = filterBySet(getNounCandidatesForVerb(verbUnit), options, targetId);
		if (!sd.collocation_filter && sd.req !== "body" && sd.req !== "body_part") {
			const nonBody = candidates.filter(n => !hasTag(n, "body", "body_part", "bodyPart") && parseSemanticData(n).domain !== "body");
			if (nonBody.length > 0) candidates = nonBody;
		}
	}
	const filteredClean = candidates.filter(n =>
		!hasTag(n, "name", "questionWord", "interrogative")
		&& !["누구", "누가", "무엇", "뭐", "어디", "언제"].includes(n[DATA_SCHEMA.Korean])
		&& !(hasTag(n, "colloquial") && parseSemanticData(n).polarity === -1)
	);
	if (filteredClean.length > 0) {
		candidates = filteredClean;
	}
	if (!["닦다", "뽑다", "치료하다", "갈다"].includes(verbKo) && !hasTag(verbUnit, "teeth")) {
		const nonDental = candidates.filter(n => n[DATA_SCHEMA.Id] !== 361 && n[DATA_SCHEMA.Korean] !== "이");
		if (nonDental.length > 0) candidates = nonDental;
	}
	if (verbKo === "매다") {
		const nonJewelry = candidates.filter(n => !hasTag(n, "jewelry") && n[DATA_SCHEMA.Korean] !== "목걸이");
		if (nonJewelry.length > 0) candidates = nonJewelry;
	}
	const isHumbleVerb = verbKo.includes("드리") || verbKo === "여쭤보다" || verbKo === "여쭙다" || (state.HUMBLE_VERBS && state.HUMBLE_VERBS.has(verbKo)) || (state.HUMBLE_DATIVE_VERBS && state.HUMBLE_DATIVE_VERBS.has(verbKo));
	if (particleType === "dative" && isHumbleVerb) {
		const elders = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => isElderNoun(n) && hasTag(n, K.PERSON, K.FAMILY, "profession", "kinship_elder", "elder", "elder_noun", "honorific_person")
		);
		if (elders.length > 0) candidates = elders;
	} else if (particleType === "dative" && !isHumbleVerb) {
		const nonElders = candidates.filter(n => !isElderNoun(n));
		if (nonElders.length > 0) candidates = nonElders;
	}
	const isStrictArgVerb = Boolean(sd && (sd.collocation_filter || (sd.req && sd.req !== K.OBJECT && sd.req !== "any")));
	if (candidates.length === 0 && options.onlyFromSet && !isStrictArgVerb) {
		// Fallback to any non-measureWord noun in the set only for unconstrained transitive verbs
		candidates = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => !hasTag(n, K.MEASUREWORD) && !hasTag(n, "counter") && !hasTag(n, K.TIME)
		);
	}
	if (candidates.length === 0) return { nounUnit: null, role: null, particleType: null };

	const chosen = pickRandom(candidates);
	const role = particleType === "dative" ? "recipient"
		: (particleType === "location" || particleType === "location_static") ? "location"
		: (particleType === "direction" || particleType === "direction_ro") ? "direction"
		: particleType === "subject" ? "subject"
		: K.OBJECT;
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
	const POSSESSION_CALQUE_VERBS = new Set(["가지다", "사다", "구매하다", "주문하다", "선물하다", "만들다", "빌리다", "얻다", "줍다"]);
	const allAVs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(
		av => !(options.excludePossessionCalque && POSSESSION_CALQUE_VERBS.has(av[DATA_SCHEMA.Korean]))
	);
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

	if (!hasTag(nounUnit, K.MEASUREWORD, "counter")
		&& !hasTag(nounUnit, K.TRANSPORTATION, "vehicle")
		&& parseSemanticData(nounUnit).domain !== K.TRANSPORTATION
		&& (hasTag(nounUnit, "drink", "liquid", "beverage") || ["물", "주스", "콜라", "사이다", "커피", "차", "술", "맥주", "우유"].includes(nounKo))) {
		const drinkAVs = allAVs.filter(av => ["마시다", "사다", "주문하다", "따르다", "좋아하다"].includes(av[DATA_SCHEMA.Korean]));
		if (drinkAVs.length > 0) return pickRandom(drinkAVs);
	}

	if (hasTag(nounUnit, "language")) {
		const langAVs = allAVs.filter(av => ["공부하다", "배우다", "가르치다", "잘하다", "연습하다", "알다", "모르다", "좋아하다"].includes(av[DATA_SCHEMA.Korean]));
		if (langAVs.length > 0) return pickRandom(langAVs);
	}

	if (nounKo === "경치") {
		const sceneryAVs = allAVs.filter(av => ["보다", "구경하다", "좋아하다", "찍다"].includes(av[DATA_SCHEMA.Korean]));
		if (sceneryAVs.length > 0) return pickRandom(sceneryAVs);
	}

	if (nounKo === "나이") {
		const ageAVs = allAVs.filter(av => ["물어보다", "묻다", "알다", "모르다"].includes(av[DATA_SCHEMA.Korean]));
		if (ageAVs.length > 0) return pickRandom(ageAVs);
	}

	if (nounKo === "대화" || nounKo === "태권도") {
		const actAVs = nounKo === "태권도"
			? allAVs.filter(av => ["배우다", "연습하다", "가르치다", "좋아하다", "하다"].includes(av[DATA_SCHEMA.Korean]))
			: allAVs.filter(av => ["하다", "듣다", "시작하다", "끝내다", "좋아하다"].includes(av[DATA_SCHEMA.Korean]));
		if (actAVs.length > 0) return pickRandom(actAVs);
	}

	const isNonCommodity = hasTag(nounUnit,
		K.ABSTRACT, K.HEALTH, "dimension_metric", "bodily_process", "meteorological_metric",
		"psychological_state", "physiological_state", "cultural_concept", "verbal_property",
		"bodyPart", K.EMOTION, "personality", K.CONCEPT, "rule", "prohibition", "signage",
		"language", K.ACTIVITY, K.COMMUNICATION, "attribute"
	) || ["잠", "휴대", "길이", "소화", "기온", "기분", "마음", "성격", "손", "코", "얼굴", "허리", "강남스타일", "주차 금지", "경치", "생활", "대화", "태권도", "반", "제목"].includes(nounKo);

	const nounId = nounUnit[DATA_SCHEMA.Id];
	// Find verbs whose collocation candidates include this noun
	const matchingAVs = allAVs.filter(av => {
		const avKo = av[DATA_SCHEMA.Korean] || "";
		if (avKo.includes(" ")) return false;
		if (avKo === "말씀하다" || state.HONORIFIC_WORDS.has(avKo) || state.HUMBLE_WORDS.has(avKo)) return false;
		if (isIntransitiveVerb(av)) return false;
		if (getVerbParticleType(av) !== K.OBJECT) return false;
		const cands = getNounCandidatesForVerb(av);
		return cands.some(c => c[DATA_SCHEMA.Id] === nounId);
	});
	if (matchingAVs.length > 0) return pickRandom(matchingAVs);

	if (hasTag(nounUnit, K.PLACE, "location", "institution", K.FACILITY)) {
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
		if (ko === "말씀하다" || state.HONORIFIC_WORDS.has(ko) || state.HUMBLE_WORDS.has(ko)) return false;
		if (isIntransitiveVerb(av)) return false;
		return getVerbParticleType(av) === K.OBJECT;
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
	const isElder = isElderNoun(nounUnit);
	const nounKo = nounUnit[DATA_SCHEMA.Korean] || "";
	const isFirstPersonSubj = ["저", "나", "우리", "저희"].includes(nounKo);
	const isPricingEligible = hasTag(nounUnit, "commercial_item", "commodity", "goods", "merchandise", "fee", "currency", K.FOOD, K.CLOTHING, "ticket", K.COMMERCE) ||
		["물건", "선물", "음식", "옷", "표", "가방", "모자", "신발", "시계", "자동차"].includes(nounKo);
	const allDVs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId).filter(dv => {
		const ko = dv[DATA_SCHEMA.Korean];
		if (!ko || ko.includes(" ")) return false;
		if (["안녕하다", "싶다", "결과 다르다", "같다", "비슷하다", "다르다", "어울리다", "오랜만이다", "친하다"].includes(ko)) return false;
		if (dv[DATA_SCHEMA.Id] !== targetId && ["정숙하다", "웬만하다", "울퉁불퉁하다", "따사롭다", "야하다", "고맙다", "감사하다", "미안하다", "죄송하다", "낫다", "싫다"].includes(ko)) return false;
		if (hasTag(dv, "demonstrative", "questionWord", "interrogative", "greeting", K.DISCOURSE) || ["어떻다", "어떠하다"].includes(ko)) return false;
		if ((nounKo === "우리" || (hasTag(nounUnit, K.PERSON, K.FAMILY) && dv[DATA_SCHEMA.Id] !== targetId)) && ko === "반갑다") return false;
		if (!isFirstPersonSubj && ["감사하다", "죄송하다", "미안하다", "고맙다"].includes(ko)) return false;
		if (hasTag(nounUnit, K.PERSON, K.FAMILY) && !isFirstPersonSubj && ["즐겁다", "기쁘다", "슬프다", "부럽다", "그립다", "부끄럽다", "외롭다", "불안하다", "무섭다", "힘들다", "졸리다", "창피하다", "심심하다", "행복하다", "섭섭하다", "피곤하다"].includes(ko)) return false;
		if (hasTag(nounUnit, K.PERSON, K.FAMILY) && ["울퉁불퉁하다", "매끄럽다", "비싸다", "싸다", "맑다", "흐리다", "따뜻하다", "시원하다", "춥다", "덥다", "적다", "야하다", "빠르다"].includes(ko)) return false;
		if (!isPricingEligible && ["비싸다", "싸다"].includes(ko)) return false;
		if (["거울", "필통", "지우개", "볼펜", "연필", "휴지", "가위", "자"].includes(nounKo) && ["편하다", "불편하다", "재미없다", "재미있다", "간단하다"].includes(ko)) return false;
		if (["기차표", "표", "명함", "엽서", "우표", "카드", "신분증", "학생증", "여권"].includes(nounKo) && ["작다", "크다", "얇다", "두껍다"].includes(ko)) return false;
		if ((nounKo === "게임" || hasTag(nounUnit, K.ACTIVITY)) && ["작다", "크다", "얇다", "두껍다", "무겁다", "가볍다", "길다", "짧다"].includes(ko)) return false;
		if (nounKo === "나이" && !["많다", "적다", "어리다"].includes(ko)) return false;
		if (options.tense && options.tense !== "past" && ["잘생기다", "못생기다", "오래되다"].includes(ko)) return false;
		if (!isElder && state.HONORIFIC_WORDS && state.HONORIFIC_WORDS.has(ko)) return false;
		return true;
	});
	if (allDVs.length === 0) return null;

	if (hasTag(nounUnit, "teeth") || nounKo === "이") {
		const teethDVs = allDVs.filter(dv => ["아프다", "시리다", "좋다", "튼튼하다", "하얗다"].includes(dv[DATA_SCHEMA.Korean]));
		if (teethDVs.length > 0) return pickRandom(teethDVs, options.seedOffset, options);
	}

	if (nounKo === "잠") {
		const sleepDVs = allDVs.filter(dv => ["달다", "부족하다", "많다", "적다", "깊다"].includes(dv[DATA_SCHEMA.Korean]));
		if (sleepDVs.length > 0) return pickRandom(sleepDVs, options.seedOffset, options);
	}

	if (nounKo === "길이") {
		const lenDVs = allDVs.filter(dv => ["길다", "짧다", "적당하다", "좋다"].includes(dv[DATA_SCHEMA.Korean]));
		if (lenDVs.length > 0) return pickRandom(lenDVs, options.seedOffset, options);
	}

	if (nounKo === "소화") {
		const digDVs = allDVs.filter(dv => ["잘되다", "안되다", "좋다", "힘들다"].includes(dv[DATA_SCHEMA.Korean]));
		if (digDVs.length > 0) return pickRandom(digDVs, options.seedOffset, options);
	}

	if (nounKo === "기온") {
		const tempDVs = allDVs.filter(dv => ["높다", "낮다", "따뜻하다", "쌀쌀하다"].includes(dv[DATA_SCHEMA.Korean]));
		if (tempDVs.length > 0) return pickRandom(tempDVs, options.seedOffset, options);
	}

	if (nounKo === "기분") {
		const moodDVs = allDVs.filter(dv => ["좋다", "나쁘다", "상쾌하다", "괜찮다"].includes(dv[DATA_SCHEMA.Korean]));
		if (moodDVs.length > 0) return pickRandom(moodDVs, options.seedOffset, options);
	}

	if (nounKo === "휴대") {
		const carryDVs = allDVs.filter(dv => ["편하다", "쉽다", "좋다"].includes(dv[DATA_SCHEMA.Korean]));
		if (carryDVs.length > 0) return pickRandom(carryDVs, options.seedOffset, options);
	}

	if (nounKo === "강남스타일") {
		const styleDVs = allDVs.filter(dv => ["유명하다", "재미있다", "신나다"].includes(dv[DATA_SCHEMA.Korean]));
		if (styleDVs.length > 0) return pickRandom(styleDVs, options.seedOffset, options);
	}

	if (hasTag(nounUnit, "soup", "stew") || ["설렁탕", "미역국", "된장찌개", "김치찌개"].includes(nounKo)) {
		const soupDVs = allDVs.filter(dv => ["맛있다", "뜨겁다", "따뜻하다", "싱겁다", "짜다", "얼큰하다"].includes(dv[DATA_SCHEMA.Korean]));
		if (soupDVs.length > 0) return pickRandom(soupDVs, options.seedOffset, options);
	}

	if (nounKo === "주차 금지" || hasTag(nounUnit, "prohibition", "rule")) {
		const ruleDVs = allDVs.filter(dv => ["필요하다", "중요하다", "엄격하다", "있다", "없다"].includes(dv[DATA_SCHEMA.Korean]));
		if (ruleDVs.length > 0) return pickRandom(ruleDVs, options.seedOffset, options);
	}

	if (hasTag(nounUnit, "language")) {
		const langDVs = allDVs.filter(dv => ["어렵다", "쉽다", "재미있다", "중요하다", "좋다", "필요하다"].includes(dv[DATA_SCHEMA.Korean]));
		if (langDVs.length > 0) return pickRandom(langDVs, options.seedOffset, options);
	}

	if (nounKo === "경치") {
		const sceneryDVs = allDVs.filter(dv => ["아름답다", "좋다", "멋있다", "예쁘다", "유명하다", "시원하다"].includes(dv[DATA_SCHEMA.Korean]));
		if (sceneryDVs.length > 0) return pickRandom(sceneryDVs, options.seedOffset, options);
	}

	if (nounKo === "생활") {
		const lifeDVs = allDVs.filter(dv => ["바쁘다", "편하다", "불편하다", "재미있다", "재미없다", "즐겁다", "힘들다", "복잡하다", "좋다"].includes(dv[DATA_SCHEMA.Korean]));
		if (lifeDVs.length > 0) return pickRandom(lifeDVs, options.seedOffset, options);
	}

	const nounId = nounUnit[DATA_SCHEMA.Id];
	const matchingDVs = allDVs.filter(dv => {
		const cands = getSubjectCandidatesForDescriptiveVerb(dv);
		return cands.some(c => c[DATA_SCHEMA.Id] === nounId);
	});
	if (matchingDVs.length > 0) return pickRandom(matchingDVs, options.seedOffset, options);

	if (hasTag(nounUnit, "teeth", "bodyPart") || parseSemanticData(nounUnit).domain === "body") {
		const bodyDVs = allDVs.filter(dv => ["아프다", "시리다", "좋다", "튼튼하다", "괜찮다", "하얗다"].includes(dv[DATA_SCHEMA.Korean]));
		if (bodyDVs.length > 0) return pickRandom(bodyDVs, options.seedOffset, options);
	}

	// Filter out human appearance/weather adjectives when falling back
	const isNonPhysicalAttr = hasTag(nounUnit, "language", K.ABSTRACT, "attribute", K.ACTIVITY, "quantity", "time_amount") || ["나이", "게임", "날씨", "생활"].includes(nounKo);
	const cleanDVs = allDVs.filter(dv => {
		const ko = dv[DATA_SCHEMA.Korean];
		if (!ko || ko.includes(" ")) return false;
		if (["날씬하다", "뚱뚱하다", "잘생기다", "못생기다", "마르다", "정숙하다", "웬만하다"].includes(ko)) return false;
		if (["맑다", "흐리다", "쌀쌀하다", "화창하다", "무덥다", "춥다", "덥다", "따뜻하다", "시원하다"].includes(ko)) return false;
		if (isNonPhysicalAttr && ["크다", "작다", "넓다", "좁다", "길다", "짧다", "높다", "낮다", "있다", "없다", "오래되다", "필요하다", "비싸다", "싸다", "무겁다", "가볍다", "편하다", "불편하다"].includes(ko)) return false;
		return true;
	});

	if (cleanDVs.length > 0) {
		const generalDVs = cleanDVs.filter(dv => GENERAL_EVALUATIVE_FALLBACK_KOREAN.has(dv[DATA_SCHEMA.Korean]));
		if (generalDVs.length > 0) return pickRandom(generalDVs, options.seedOffset, options);
		return pickRandom(cleanDVs, options.seedOffset, options);
	}

	return pickRandom(allDVs, options.seedOffset, options);
}

/**
 * Selects a physically compatible container noun for '넣다' given an object noun.
 */
function selectPutInContainerNoun(objectNounUnit, options = {}, targetId = null) {
	const objKo = objectNounUnit ? (objectNounUnit[DATA_SCHEMA.Korean] || "") : "";
	const isBulkyOrMedium = Boolean(objectNounUnit && (
		["컴퓨터", "텔레비전", "책상", "의자", "소파", "침대", "가방", "신발", "구두", "운동화", "옷", "코트", "바지", "치마", "책", "공책", "우산", "옷걸이", "거울", "칠판"].includes(objKo) ||
		hasTag(objectNounUnit, "furniture", "appliance", K.CLOTHING, "footwear", "luggage")
	));
	const isFoodOrDrink = Boolean(objectNounUnit && (
		hasTag(objectNounUnit, K.FOOD, "drink", "beverage") ||
		["우유", "물", "음료", "주스", "김치", "고기", "과일", "달걀", "음식", "사과", "빵", "반찬"].includes(objKo)
	));
	let pool = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => {
		const nKo = n[DATA_SCHEMA.Korean] || "";
		if (hasTag(n, K.FOOD, K.HONORIFIC, "honorific_noun")) return false;
		if (!["가방", "주머니", "상자", "냉장고", "서랍", "봉투", "지갑"].includes(nKo) && !hasTag(n, "container")) return false;
		if (isBulkyOrMedium && ["봉투", "주머니", "지갑", "필통", "컵", "그릇"].includes(nKo)) return false;
		if (!isFoodOrDrink && nKo === "냉장고") return false;
		return true;
	});
	if (pool.length === 0) {
		pool = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => ["가방", "상자", "서랍"].includes(n[DATA_SCHEMA.Korean]));
	}
	return pickRandom(pool);
}

function isPluralSubjectUnit(subjUnit) {
	if (!subjUnit) return false;
	const sKo = subjUnit[DATA_SCHEMA.Korean] || "";
	return hasTag(subjUnit, "plural") || ["우리", "저희", "가족", "친구들", "학생들", "사람들", "아이들", "부모님"].includes(sKo) || sKo.endsWith("들");
}

/**
 * Selects an optional time word concordant with `tense`.
 */
function selectTimeUnit(tense, options = {}, targetId = null, targetVerbUnit = null) {
	const excludedTimeNouns = new Set(["학기", "날", "때", "번", "월", "년", "한번", "방학중", "학기 중", "계절", "언제", "생신", "며칠", "몇 시", "이때", "순서", "차례", "동안", "하루", "이틀", "사흘", "나흘", "닷새", "열흘", "기간", "날짜", "일정", "출발", "여유", "적", "말", "전", "후", "처음", "과거", "미래", "이전", "종일", "요일", "연초", "연말", "오랜만", "-박 -일", "지난", "올해", "금년", "작년", "지난해", "내년", "다음주"]);
	if (tense !== "present") excludedTimeNouns.add("지금");
	const timeNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
		n => hasTag(n, K.TIME, "temporal") && !hasTag(n, K.MEASUREWORD, "counter", "questionWord", "interrogative", K.HONORIFIC, "honorific_noun", K.ABSTRACT, "order", "duration", "bound_noun", "schedule", K.CONCEPT, K.EMOTION, "time_modifier", K.DETERMINER) && !excludedTimeNouns.has(n[DATA_SCHEMA.Korean])
	);
	const timeAdvs = getAllUnitsOfPos(K.POS_ADVERB, options, targetId).filter(a => {
		if (!hasTag(a, K.TIME, "temporal", "adverb_time")) return false;
		if (hasTag(a, "questionWord", "interrogative")) return false;
		const aKo = a[DATA_SCHEMA.Korean];
		if (["아직", "벌써", "이미", "언제", "금방", "이제", "방금", "아까", "새로", "드디어", "미리", "오래"].includes(aKo)) return false;
		if (tense === "future" && ["날마다", "매일"].includes(aKo)) return false;
		if (targetVerbUnit && typeof canAdverbPrecede === 'function' && !canAdverbPrecede(a, targetVerbUnit, { tense })) return false;
		return true;
	});
	const pool = filterWordsByTense([...timeNouns, ...timeAdvs], tense);
	return pickRandom(pool);
}

/**
 * Selects an optional manner or degree adverb compatible with the predicate.
 */
function selectAdverbUnit(isDescriptive, polarity, options = {}, targetId = null, targetVerbUnit = null) {
	const advs = getAllUnitsOfPos(K.POS_ADVERB, options, targetId).filter(a => {
		if (a[DATA_SCHEMA.PartofSpeech] !== K.POS_ADVERB) return false;
		const ko = a[DATA_SCHEMA.Korean];
		if (ko === "안" || ko === "못") return false;
		if (polarity !== "negative" && state.ALL_NPI_WORDS.has(ko)) return false;
		if (hasTag(a, K.DISCOURSE, "conjunction", K.TIME, "temporal", "concessive", "approximation", "number_unit", "connective", "greeting", "interjection", "exclamation", "hesitation")) return false;
		// Interrogative question words must not be chosen as optional decorative adverbs in declarative sentences
		if (hasTag(a, "questionWord", "interrogative")) return false;
		if (targetVerbUnit && typeof canAdverbPrecede === 'function' && !canAdverbPrecede(a, targetVerbUnit, { isNegative: polarity === "negative", pluralSubject: options.pluralSubject })) return false;
		if (isDescriptive) {
			if (state.MANNER_ADVERBS.has(ko) || hasTag(a, "manner", "adverb_manner")) return false;
			const sv = parseSemanticData(a);
			if (sv && sv.target_pos === K.ACTION_VERB) return false;
			return state.DEGREE_ADVERBS.has(ko) || hasTag(a, K.DEGREE, "adverb_degree", "degree_pure");
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
	const rawVerbKo = verbUnit[DATA_SCHEMA.Korean] || "";
	const isHonVerb = state.HONORIFIC_WORDS.has(rawVerbKo);
	const tenses = rawVerbKo === "알다" ? ["present", "present", "past"] : ["present", "past", "future"];
	const tense = options.tense || tenses[variationIndex % tenses.length];
	const politeness = options.politeness || (variationIndex === 2 ? "formal_high" : "polite");

	const arg = selectArgumentForActionVerb(verbUnit, options, targetId);
	const isNominativeSubjectVerb = arg.role === "subject";
	const verbKo = verbUnit[DATA_SCHEMA.Korean] || "";
	const isInvoluntary = hasTag(verbUnit, "involuntary", "passive", "symptom", K.WEATHER, "state", "existential") || ["끝나다", "시작되다", "고장 나다", "죽다", "생기다", "열리다", "닫히다", "끓다", "식다", "터지다", "말씀하다", "들어있다"].some(k => verbKo.includes(k));
	const modality = (variationIndex === 1 && !isHonVerb && !isNominativeSubjectVerb && !isInvoluntary && !options.onlyFromSet) ? "desire" : null;

	let subjUnit = null;
	if (verbKo === "끓다") {
		const liquids = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => ["물", "라면", "찌개", "국", "탕", "보리차"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "liquid", "soup", "stew"));
		subjUnit = pickRandom(liquids) || null;
	} else if (verbKo === "식다") {
		const hotItems = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => !hasTag(n, K.MEASUREWORD, "counter")
				&& !hasTag(n, K.TRANSPORTATION, "vehicle")
				&& parseSemanticData(n).domain !== K.TRANSPORTATION
				&& (["밥", "국", "찌개", "커피", "차", "피자", "음식"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, K.FOOD, "drink"))
		);
		subjUnit = pickRandom(hotItems) || null;
	} else if (verbKo === "터지다") {
		const inflatables = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => ["풍선", "타이어"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, K.OBJECT));
		subjUnit = pickRandom(inflatables) || null;
	} else if (verbKo === "말씀하다") {
		subjUnit = selectSubjectUnit(options, targetId, true);
	} else if (verbKo === "들어있다") {
		subjUnit = null;
	} else {
		subjUnit = isNominativeSubjectVerb ? null : selectSubjectUnit(options, targetId, isHonVerb);
		if (subjUnit && ["할인하다", "팔다", "배달하다"].includes(verbKo) && ["아랫사람", "윗사람", "노인", "어른", "아이", "얘들", "사나이", "놈"].includes(subjUnit[DATA_SCHEMA.Korean])) {
			const merchantPool = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => ["가게", "마트", "백화점", "식당", "카페", "회사원", "종업원", "사장님", "선배", "친구"].includes(n[DATA_SCHEMA.Korean]));
			if (merchantPool.length > 0) subjUnit = pickRandom(merchantPool);
		}
	}

	if (options.onlyFromSet && !subjUnit && !arg.nounUnit) {
		return {
			ok: false,
			insufficientSet: true,
			missingRoles: ["Noun or Pronoun"],
			message: "Cannot build a complete sentence using only your current set: add at least one Noun or Pronoun to your set."
		};
	}

	if (subjUnit && arg.nounUnit && ["치마", "원피스"].includes(arg.nounUnit[DATA_SCHEMA.Korean]) && ["오빠", "형", "남동생", "아버지", "아빠", "할아버지", "작은아버지", "큰아버지", "삼촌", "아저씨", "남자", "사나이"].includes(subjUnit[DATA_SCHEMA.Korean])) {
		const femaleOrNeutralSubjs = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => ["언니", "누나", "여동생", "어머니", "엄마", "친구", "여자", "학생", "선생님"].includes(n[DATA_SCHEMA.Korean]));
		const femalePronoun = getAllUnitsOfPos(K.PRONOUN, options, targetId).find(p => p[DATA_SCHEMA.Korean] === "저");
		const replacement = pickRandom(femaleOrNeutralSubjs) || femalePronoun;
		if (replacement) subjUnit = replacement;
	}

	const constituents = [];
	if (subjUnit && (!arg.nounUnit || subjUnit[DATA_SCHEMA.Id] !== arg.nounUnit[DATA_SCHEMA.Id])) {
		constituents.push({
			role: variationIndex % 2 === 0 ? "topic" : "subject",
			nounUnit: subjUnit,
			particleType: variationIndex % 2 === 0 ? "topic" : "subject"
		});
	}

	if (variationIndex > 0 && verbKo !== "알다") {
		const timeUnit = selectTimeUnit(tense, options, targetId, verbUnit);
		if (timeUnit) {
			const isAdv = timeUnit[DATA_SCHEMA.PartofSpeech] === K.POS_ADVERB;
			constituents.push({
				role: K.TIME,
				unit: timeUnit,
				particleType: isAdv ? null : K.TIME
			});
		}
	}

	if (verbKo === "놓다") {
		const furnitureOrPlace = pickRandom(getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => ["책상", "탁자", "식탁", "의자", "바닥", "침대"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "furniture", K.PLACE)));
		const smallObj = pickRandom(getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => ["책", "가방", "모자", "휴대전화", "컵", "그릇", "열쇠"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, K.OBJECT)));
		if (furnitureOrPlace && smallObj) {
			constituents.push({
				role: "location",
				nounUnit: furnitureOrPlace,
				particleType: "location_static"
			});
			constituents.push({
				role: K.OBJECT,
				nounUnit: smallObj,
				particleType: K.OBJECT
			});
		}
	} else if (verbKo === "담다") {
		const container = pickRandom(getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => ["접시", "그릇", "상자", "가방", "냉장고", "바구니"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "container", "dish")));
		if (container) {
			constituents.push({
				role: "location",
				nounUnit: container,
				particleType: "location_static"
			});
		}
		if (arg.nounUnit) {
			constituents.push({
				role: arg.role,
				nounUnit: arg.nounUnit,
				particleType: arg.particleType
			});
		}
	} else if (verbKo === "넣다") {
		const container = selectPutInContainerNoun(arg.nounUnit, options, targetId);
		if (container) {
			constituents.push({
				role: "location",
				nounUnit: container,
				particleType: "location_static"
			});
		}
		if (arg.nounUnit) {
			constituents.push({
				role: arg.role,
				nounUnit: arg.nounUnit,
				particleType: arg.particleType
			});
		}
	} else if (verbKo === "들어있다") {
		const container = pickRandom(getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => ["가방", "상자", "주머니", "지갑", "방"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "container")));
		const content = pickRandom(getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => ["책", "돈", "지갑", "열쇠", "편지"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, K.OBJECT)));
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
		const instNoun = pickRandom(getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => ["수업", "학교", "대학교", "학원", "회의", "모임"].includes(n[DATA_SCHEMA.Korean])));
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
		if (verbKo === "가르치다") {
			const subjMatter = pickRandom(getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => ["한국어", "영어", "일본어", "중국어", "수학", "음악", "태권도", "요리", "한국말"].includes(n[DATA_SCHEMA.Korean])));
			if (subjMatter) {
				constituents.push({
					role: K.OBJECT,
					nounUnit: subjMatter,
					particleType: K.OBJECT
				});
			}
		}
	}

	if (variationIndex === 2) {
		const advUnit = selectAdverbUnit(false, "affirmative", { ...options, pluralSubject: isPluralSubjectUnit(subjUnit) }, targetId, verbUnit);
		if (advUnit) {
			constituents.push({
				role: K.ADVERB,
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
					predType: K.ACTION,
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
	let tense = options.tense || tenses[variationIndex % tenses.length];
	if (["잘생기다", "못생기다", "오래되다"].includes(dvKo) && !options.tense) tense = "past";
	const politeness = options.politeness || (variationIndex === 2 ? "formal_high" : "polite");

	// Greeting formula 안녕하다 (Unit 5) -> strictly polite formulaic greeting frame
	if (dvKo === "안녕하다" || targetId === 5) {
		const elderNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => isElderNoun(n)
				&& !hasTag(n, "attribute", "honorific_noun", K.CONCEPT)
				&& (!hasTag(n, "profession") || (n[DATA_SCHEMA.Korean] || "").endsWith("님"))
				&& !["부장", "교수", "과장", "사장", "선배"].includes(n[DATA_SCHEMA.Korean])
		);
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
						polarity: "affirmative",
						honorific: true
					}
				}]
			}
		};
	}

	// Copula 이다 (Unit 55) -> requires complement noun and animacy-matched subject
	if (dvKo === "이다" || targetId === 55) {
		const allNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => !hasTag(n, K.MEASUREWORD, "counter", "position", "name")
				&& !(hasTag(n, "colloquial") && parseSemanticData(n).polarity === -1)
				&& n[DATA_SCHEMA.Korean] !== "이"
		);
		const complementCandidates = allNouns.filter(n => hasTag(n, "profession", "job", "status", "role", "nationality", K.OBJECT, K.FOOD, "animal", "fruit"));
		const complementNoun = (complementCandidates.length > 0 ? pickRandom(complementCandidates) : pickRandom(allNouns));
		const isHumanComp = complementNoun && hasTag(complementNoun, K.PERSON, "profession", "job", "status", "role", "nationality");

		let subjUnit = null;
		if (isHumanComp) {
			const humanPronouns = getAllUnitsOfPos(K.PRONOUN, options, targetId).filter(p => ["저", "나", "우리"].includes(p[DATA_SCHEMA.Korean]));
			subjUnit = pickRandom(humanPronouns) || selectSubjectUnit(options, targetId, false);
		} else {
			const thingPronouns = getAllUnitsOfPos(K.PRONOUN, options, targetId).filter(p => ["이것", "그것", "저것", "이거", "그거", "저거"].includes(p[DATA_SCHEMA.Korean]));
			subjUnit = pickRandom(thingPronouns);
		}
		if (subjUnit && complementNoun && subjUnit[DATA_SCHEMA.Id] === complementNoun[DATA_SCHEMA.Id]) {
			subjUnit = null;
		}

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

	let subjUnit = null;
	if (["감사하다", "죄송하다", "미안하다", "고맙다"].includes(dvKo)) {
		const allowedPros = ["죄송하다", "감사하다"].includes(dvKo) ? ["저", "저희"] : ["저", "우리", "저희"];
		const speakerPronouns = getAllUnitsOfPos(K.PRONOUN, options, targetId).filter(
			p => allowedPros.includes(p[DATA_SCHEMA.Korean])
		);
		if ((variationIndex % 2 === 0 || ["죄송하다", "감사하다"].includes(dvKo)) && speakerPronouns.length > 0) {
			subjUnit = pickRandom(speakerPronouns);
		}
	} else {
		let subjCandidates = filterBySet(getSubjectCandidatesForDescriptiveVerb(dvUnit), options, targetId);
		if (["피곤하다", "섭섭하다", "졸리다", "배고프다", "목마르다"].includes(dvKo)) {
			const firstPersonPronouns = getAllUnitsOfPos(K.PRONOUN, options, targetId).filter(
				p => ["저", "나", "우리", "저희"].includes(p[DATA_SCHEMA.Korean])
			);
			if (firstPersonPronouns.length > 0) subjCandidates = firstPersonPronouns;
		}
		if (!["아프다", "시리다", "좋다", "튼튼하다"].includes(dvKo) && !hasTag(dvUnit, "teeth")) {
			subjCandidates = subjCandidates.filter(u => u[DATA_SCHEMA.Korean] !== "이");
		}
		const dvSd = parseSemanticData(dvUnit);
		const isStrictDV = Boolean(dvSd && (dvSd.collocation_filter || (dvSd.req && dvSd.req !== "any")));
		if (subjCandidates.length === 0 && options.onlyFromSet && !isStrictDV) {
			subjCandidates = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
				n => !hasTag(n, K.MEASUREWORD) && !hasTag(n, "counter")
			);
		}
		subjUnit = pickRandom(subjCandidates) || (!isStrictDV ? selectSubjectUnit(options, targetId, false) : null);
	}

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
		const isPluralSubj = isPluralSubjectUnit(subjUnit);
		const degAdv = selectAdverbUnit(true, "affirmative", { ...options, pluralSubject: isPluralSubj }, targetId, dvUnit);
		if (degAdv && !(subjUnit && isElderNoun(subjUnit) && degAdv[DATA_SCHEMA.Korean] === "완전") && (typeof canAdverbPrecede !== 'function' || canAdverbPrecede(degAdv, dvUnit, { isNegative: false, pluralSubject: isPluralSubj }))) {
			constituents.push({
				role: K.ADVERB,
				unit: degAdv,
				particleType: null
			});
		}
	} else if (["있다", "없다"].includes(dvKo) && variationIndex % 2 === 1) {
		const placeNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => hasTag(n, K.PLACE, "location", "room") && !hasTag(n, K.MEASUREWORD, "counter", "position")
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
		const allNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => n[DATA_SCHEMA.PartofSpeech] === K.NOUN &&
			!(hasTag(n, "colloquial") && parseSemanticData(n).polarity === -1) &&
			!hasTag(n, K.MEASUREWORD, "counter", K.TIME, "position", "questionWord", K.PROPER_NOUN, K.NATURE, K.WEATHER, "station", "symptom", "bodily_process", "language", K.DISEASE, "landmark", "tourism", "transitFacility", "pronoun") &&
			!["이", "얼마", "누구", "무엇", "뭐", "어디", "언제", "몇", "너희", "하늘", "바다", "소화", "기온", "프랑스말", "한국말", "영어", "일본어", "중국어", "비", "눈", "바람", "태풍", "서양", "동양", "한국", "점"].includes(n[DATA_SCHEMA.Korean]) &&
			(
				["집", "방", "학교", "회사", "고향", "나라", "교실", "사무실", "이름", "전화번호", "이메일", "주소", "직업", "취미", "전공", "생일", "생각", "마음", "기분", "계획", "약속", "시간", "돈"].includes(n[DATA_SCHEMA.Korean]) ||
				(
					hasTag(n, K.PERSON, K.FAMILY, K.OBJECT, K.CLOTHING, K.WEARABLE, "furniture", "room", "bag", "stationery", "electronics") &&
					!hasTag(n, K.PLACE, K.FACILITY, "restaurant", "store", "company", "region", K.ABSTRACT, K.CONCEPT, K.ACADEMIC)
				)
			)
		);
		const headNoun = pickRandom(allNouns);
		const isAction = variationIndex % 2 === 1;
		const chosenVerb = isAction
			? (headNoun ? selectActionVerbForNoun(headNoun, { ...options, excludePossessionCalque: true }, targetId) : null)
			: (headNoun ? selectDescriptiveVerbForNoun(headNoun, { ...options, tense }, targetId) : null);
		if (chosenVerb && ["잘생기다", "못생기다", "오래되다"].includes(chosenVerb[DATA_SCHEMA.Korean]) && !options.tense) {
			tense = "past";
		}
		if (headNoun && chosenVerb) {
			const isActionVerb = chosenVerb[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB;
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
							role: isActionVerb ? K.OBJECT : "subject",
							determinerUnit: nominalUnit,
							nounUnit: headNoun,
							particleType: isActionVerb ? K.OBJECT : "subject"
						}],
						predicate: {
							role: "predicate",
							predType: isActionVerb ? K.ACTION : "descriptive",
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
	if (hasTag(nominalUnit, K.MEASUREWORD, "counter") || state.CLASSIFIER_UNITS.has(ko)) {
		if (ko === "번") {
			const freqCount = (variationIndex % 3) + 2;
			const freqNumUnit = getAllUnitsOfPos(K.NUMBER, options, targetId).find(u => u[DATA_SCHEMA.Korean] === getKoreanNumber(freqCount, true)) || null;
			const freqVerbs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(v => ["보다", "읽다", "만나다", "가다", "먹다"].includes(v[DATA_SCHEMA.Korean]));
			const freqVerb = pickRandom(freqVerbs) || pickRandom(getAllUnitsOfPos(K.ACTION_VERB, options, targetId));
			const freqObj = freqVerb ? selectArgumentForActionVerb(freqVerb, options, targetId) : { nounUnit: null, role: null, particleType: null };
			const freqSubj = selectSubjectUnit(options, targetId, false);
			if (freqVerb && (freqObj.nounUnit || freqSubj)) {
				const freqConstituents = [];
				if (freqSubj && (!freqObj.nounUnit || freqSubj[DATA_SCHEMA.Id] !== freqObj.nounUnit[DATA_SCHEMA.Id])) {
					freqConstituents.push({ role: "topic", nounUnit: freqSubj, particleType: "topic" });
				}
				if (freqObj.nounUnit) {
					freqConstituents.push({ role: freqObj.role, nounUnit: freqObj.nounUnit, particleType: freqObj.particleType });
				}
				freqConstituents.push({
					role: "frequency",
					numberUnit: freqNumUnit,
					countValue: freqCount,
					counterUnit: nominalUnit,
					particleType: null,
					explicitSurfaceKo: `${getKoreanNumber(freqCount, true)} 번`
				});
				return {
					ok: true,
					ast: {
						type: "Sentence",
						targetUnitId: targetId,
						speechAct: "declarative",
						politeness,
						tense: variationIndex % 2 === 0 ? "past" : "present",
						polarity: "affirmative",
						clauses: [{
							constituents: freqConstituents,
							predicate: {
								role: "predicate",
								predType: K.ACTION,
								verbUnit: freqVerb,
								tense: variationIndex % 2 === 0 ? "past" : "present",
								politeness,
								speechAct: "declarative",
								polarity: "affirmative"
							}
						}]
					}
				};
			}
		}
		const numType = getClassifierNumeralType(ko);
		const countVal = (variationIndex % 4) + 1;
		const numStr = numType === "sino" ? getSinoNumber(countVal) : getKoreanNumber(countVal, true);
		const numUnits = getAllUnitsOfPos(K.NUMBER, options, targetId);
		const matchedNumUnit = numUnits.find(u => u[DATA_SCHEMA.Korean] === numStr) || null;

		let compatibleNouns = filterBySet(getMatchingNounsForClassifier(ko), options, targetId);
		if (ko === "쪽") {
			const allN = getAllUnitsOfPos(K.NOUN, options, targetId);
			compatibleNouns = allN.filter(n => ["책", "교과서", "잡지", "신문", "사전", "만화책"].includes(n[DATA_SCHEMA.Korean]));
		} else if (compatibleNouns.length === 0) {
			const allN = getAllUnitsOfPos(K.NOUN, options, targetId);
			if (ko === "권") {
				compatibleNouns = allN.filter(n => ["책", "잡지", "공책", "사전"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "book", "publication"));
			} else if (ko === "명" || ko === "분") {
				compatibleNouns = allN.filter(n => hasTag(n, K.PERSON, "human", K.FAMILY, "profession", "job"));
			} else if (ko === "마리") {
				compatibleNouns = allN.filter(n => hasTag(n, "animal", "pet", "fish", "bird"));
			} else if (ko === "잔" || ko === "병") {
				compatibleNouns = allN.filter(n => hasTag(n, "drink", "beverage", "liquid") && !hasTag(n, K.MEASUREWORD, "counter"));
			} else if (ko === "대") {
				compatibleNouns = allN.filter(n => hasTag(n, "vehicle", "electronics", "machine", "appliance") && !hasTag(n, "ticket", K.TRAVEL, K.ACTIVITY));
			} else if (ko === "벌") {
				compatibleNouns = allN.filter(n => hasTag(n, K.CLOTHING, "clothes"));
			} else if (ko === "켤레") {
				compatibleNouns = allN.filter(n => hasTag(n, "footwear", "shoes"));
			} else if (ko === "살" || ko === "세") {
				compatibleNouns = allN.filter(n => ["아이", "아기", "학생", "동생", "조카", "친구"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "child", "junior"));
			} else if (ko === "채") {
				compatibleNouns = allN.filter(n => ["집", "하숙집", "빌딩", "건물", "아파트"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "building", "housing"));
			} else if (ko === "호") {
				compatibleNouns = allN.filter(n => ["방", "교실", "사무실", "호실"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "room", "office"));
			} else if (ko === "학년") {
				compatibleNouns = allN.filter(n => ["초등학교", "중학교", "고등학교", "대학교", "대학원", "학생"].includes(n[DATA_SCHEMA.Korean]) || (hasTag(n, "school") && !hasTag(n, K.PLACE, K.FACILITY, "room", "hall") && !["대강당", "강당", "교실", "학원"].includes(n[DATA_SCHEMA.Korean])));
			} else if (ko === "편") {
				compatibleNouns = allN.filter(n => ["영화", "드라마", "시", "소설", "비디오"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "media_work", "film", "literature"));
			} else if (ko === "%") {
				compatibleNouns = allN.filter(n => ["할인", "이자율", "확률", "비율", "성공률"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "rate_proportion", "discount", "finance"));
			}
			if (compatibleNouns.length === 0) {
				compatibleNouns = allN.filter(
					n => n[DATA_SCHEMA.Id] !== targetId && !hasTag(n, K.MEASUREWORD, "counter", K.TIME, K.PLACE, "position")
				);
			}
		}
		const allAvs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId);
		const avs = allAvs.filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (vKo.includes(" ")) return false;
			if (isIntransitiveVerb(v)) return false;
			if (getVerbParticleType(v) !== K.OBJECT) return false;
			return true;
		});
		const dvs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId);
		const existVerb = ko === "쪽"
			? (avs.find(v => v[DATA_SCHEMA.Korean] === "읽다") || avs.find(v => v[DATA_SCHEMA.Korean] === "보다") || pickRandom(avs) || pickRandom(dvs))
			: (dvs.find(v => v[DATA_SCHEMA.Korean] === "있다") || avs.find(v => v[DATA_SCHEMA.Korean] === "사다" || v[DATA_SCHEMA.Korean] === "먹다") || pickRandom(avs) || pickRandom(dvs));

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
		const isAction = existVerb && existVerb[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB;
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
						role: isAction ? K.OBJECT : "subject",
						nounUnit: itemNoun,
						numberUnit: matchedNumUnit,
						numberSurfaceKo: numStr,
						countValue: countVal,
						counterUnit: nominalUnit,
						particleType: isAction ? K.OBJECT : "subject"
					}],
					predicate: {
						role: "predicate",
						predType: isAction ? K.ACTION : "descriptive",
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

	// 1.4. Quantity Noun 반 ("half")
	if (ko === "반" && hasTag(nominalUnit, "time_amount", "quantity")) {
		const subjUnit = selectSubjectUnit(options, targetId, false);
		const portionPool = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => ["사과", "케이크", "피자", "빵", "우유", "책", "숙제", "물"].includes(n[DATA_SCHEMA.Korean]));
		const portionObj = pickRandom(portionPool);
		const verbChoices = portionObj && ["책", "숙제"].includes(portionObj[DATA_SCHEMA.Korean])
			? (portionObj[DATA_SCHEMA.Korean] === "책" ? ["읽다", "보다"] : ["끝내다", "하다"])
			: (portionObj && ["우유", "물"].includes(portionObj[DATA_SCHEMA.Korean]) ? ["마시다", "남기다"] : ["먹다", "사다", "남기다"]);
		const actionVerb = pickRandom(getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(v => verbChoices.includes(v[DATA_SCHEMA.Korean]))) || selectActionVerbForNoun(portionObj || nominalUnit, options, targetId);
		if (subjUnit && portionObj && actionVerb && !options.onlyFromSet) {
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
							{ role: "topic", nounUnit: subjUnit, particleType: "topic" },
							{ role: "modifier", nounUnit: portionObj, particleType: null },
							{ role: K.OBJECT, nounUnit: nominalUnit, particleType: K.OBJECT }
						],
						predicate: {
							role: "predicate",
							predType: K.ACTION,
							verbUnit: actionVerb,
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

	// 1.5. Bound Noun 데 (Unit 2025)
	if (ko === "데" || (hasTag(nominalUnit, "bound_noun") && ko === "데")) {
		const actionVerbs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(v => ["가다", "살다", "쉬다", "만나다", "공부하다"].includes(v[DATA_SCHEMA.Korean]));
		const descriptiveVerbs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId).filter(v => ["좋다", "조용하다", "깨끗하다", "편하다", "따뜻하다"].includes(v[DATA_SCHEMA.Korean]));
		const modVerb = (variationIndex % 2 === 0 ? pickRandom(descriptiveVerbs) : pickRandom(actionVerbs)) || pickRandom(descriptiveVerbs);
		const modStem = modVerb ? getConjugatedStem(modVerb[DATA_SCHEMA.Korean], modVerb[DATA_SCHEMA.Conjugation]) : "좋";
		const modEnding = (modVerb && modVerb[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB) ? "는" : "으/ㄴ";
		const modKo = resolvePureMorphology(modStem + modEnding, state);
		const subjUnit = selectSubjectUnit(options, targetId, false);
		const mainVerb = pickRandom(getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(v => ["찾다", "가다", "좋아하다", "원하다", "알아보다"].includes(v[DATA_SCHEMA.Korean]))) || pickRandom(getAllUnitsOfPos(K.ACTION_VERB, options, targetId));
		const mainVerbKo = mainVerb ? mainVerb[DATA_SCHEMA.Korean] : "";
		const isMotion = ["가다", "오다", "다니다", "살다"].includes(mainVerbKo);
		const deRole = isMotion ? "location" : K.OBJECT;
		const deParticle = isMotion ? "location_static" : K.OBJECT;

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
						predType: K.ACTION,
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
	if (hasTag(nominalUnit, "modifier_root") || (ko.endsWith("적") && hasTag(nominalUnit, K.CONCEPT, "personality", "trait"))) {
		const allNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => !hasTag(n, K.MEASUREWORD, "counter", "position") && n[DATA_SCHEMA.Korean] !== "이" && n[DATA_SCHEMA.Id] !== targetId
		);
		const headNounCandidates = allNouns.filter(n => hasTag(n, K.PERSON, "personality", K.ABSTRACT, "art", "culture", "design", K.GENERAL));
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
								role: K.OBJECT,
								nounUnit: headNoun,
								modifierSurfaceKo: adnominalKo,
								particleType: K.OBJECT
							}
						],
						predicate: {
							role: "predicate",
							predType: K.ACTION,
							verbUnit: pickRandom(getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(v => ["좋아하다", "원하다", "찾다", "바라다", "생각하다"].includes(v[DATA_SCHEMA.Korean]))) || selectActionVerbForNoun(headNoun, options, targetId),
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
							verbUnit: getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId).find(v => v[DATA_SCHEMA.Korean] === "이다") || null,
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
		const isInside = ko === "안";
		const isOutside = ko === "밖";
		const isBelow = ko === "아래";
		const isAbove = ko === "위";
		const groundNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => n[DATA_SCHEMA.Id] !== targetId &&
			(isBelow
				? ["책상", "의자", "식탁", "탁자", "침대", "소파", "나무", "창문"].includes(n[DATA_SCHEMA.Korean])
				: (isOutside
					? ["집", "학교", "도서관", "교실", "방", "식당", "카페", "건물", "빌딩", "병원", "은행", "기숙사"].includes(n[DATA_SCHEMA.Korean])
					: (isAbove
						? ["책상", "탁자", "식탁", "침대", "의자", "소파", "바닥", "가방", "책", "공책", "상자"].includes(n[DATA_SCHEMA.Korean])
						: (hasTag(n, "furniture", "room", "building", "housing", "container") || ["학교", "도서관", "식당", "집", "방", "책상", "의자", "식탁", "탁자", "침대", "소파", "가방", "상자", "나무", "건물", "빌딩", "공원", "문"].includes(n[DATA_SCHEMA.Korean]))))) &&
			!hasTag(n, K.MEASUREWORD, "counter", "position", "language", K.ABSTRACT, "traffic", "city", "country", "region", "deictic", "demonstrative", "landmark", K.NATURE) &&
			!["이", "나이", "말", "한국말", "베트남말", "중국말", "일본말", "영어", "서울", "부산", "호주", "러시아", "한국", "미국", "일본", "중국", "저기", "그곳", "여기", "거기", "산", "바다", "강", "호수", "한강공원", "스키장", "온천", "농구장", "고속도로", "뷔페", "극장", "노약자석", "횡단보도", "방석"].includes(n[DATA_SCHEMA.Korean])
		);
		const allSubjNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => n[DATA_SCHEMA.Id] !== targetId &&
			!hasTag(n, K.MEASUREWORD, "counter", "position", K.TIME, K.ABSTRACT, "attribute", "metric", K.EMOTION, "psychological_state", "bodily_process", K.CONCEPT, "language", "fee", "expense", "currency_resource", "direction", "deictic", "demonstrative", "number", "bodyPart", "body", "sport", K.ACTIVITY, "entertainment", "digital_media", "computing", "food_ingredient", "questionWord", "interrogative", "honorific_noun") &&
			!(isBelow && hasTag(n, K.PERSON, K.FAMILY)) &&
			!["이", "나이", "기분", "소화", "기온", "길이", "성격", "마음", "스트레스", "여유", "잠", "베트남말", "한국말", "배달비", "천", "이쪽", "저쪽", "여기", "거기", "무릎", "손", "발", "눈", "코", "귀", "입", "머리", "목", "테니스", "수영", "축구", "인사", "계산", "앱", "어플", "프로그램", "참기름", "설탕", "소금", "간장", "변비약", "냉동식품", "초밥", "얼마", "덱", "댁", "구경거리", "롤러코스터"].includes(n[DATA_SCHEMA.Korean])
		);
		const dvs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId);
		const allAvs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId);
		const avs = allAvs.filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (vKo.includes(" ")) return false;
			if (isIntransitiveVerb(v)) return false;
			if (getVerbParticleType(v) !== K.OBJECT) return false;
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
		const groundKo = ground ? (ground[DATA_SCHEMA.Korean] || "") : "";
		const isIndoorRoom = Boolean(ground && (hasTag(ground, "room") || ["방", "교실", "서재", "욕실", "화장실", "거실", "부엌", "안방", "연구실", "사무실", "강의실"].includes(groundKo)));
		const isBuildingOrOutdoorGround = Boolean(ground && !isIndoorRoom && (hasTag(ground, K.PLACE, K.FACILITY, "building") || ["학교", "도서관", "식당", "건물", "빌딩", "공원", "집", "나무", "기숙사", "카페", "병원", "은행"].includes(groundKo)));
		const isVehicleCar = n => (n[DATA_SCHEMA.Korean] !== "차" || hasTag(n, "vehicle", K.TRANSPORTATION)) && !hasTag(n, "drink", "tea", K.FOOD);
		const scaleFilteredSubjs = allSubjNouns.filter(n => {
			if (ground && n[DATA_SCHEMA.Id] === ground[DATA_SCHEMA.Id]) return false;
			if (!isVehicleCar(n)) return false;
			const nKo = n[DATA_SCHEMA.Korean] || "";
			if (isOutside) {
				return (hasTag(n, K.PERSON, K.FAMILY, "animal") && !hasTag(n, "elder_noun", K.HONORIFIC)) || ["사람", "학생", "친구", "아이", "고양이", "강아지", "나무", "차", "버스", "자전거", "택시", "벤치"].includes(nKo);
			}
			if (isInside) {
				if (isIndoorRoom || isBuildingOrOutdoorGround) {
					return (hasTag(n, K.PERSON, K.FAMILY) && !hasTag(n, "elder_noun", K.HONORIFIC)) || ["책상", "의자", "탁자", "침대", "소파", "학생", "친구", "사람", "선생님"].includes(nKo);
				}
				return !hasTag(n, K.PLACE, K.FACILITY, "building", "housing", "city", "country", "vehicle", K.TRANSPORTATION, "furniture", "appliance", "amusement") && !["팩스", "프린터"].includes(nKo) && (hasTag(n, K.OBJECT, "stationery", "book", "tool") || ["책", "공책", "가방", "지갑", "열쇠", "사과", "연필", "볼펜", "안경", "휴대전화", "우산"].includes(nKo));
			}
			if (isIndoorRoom) {
				// Behind/beside an indoor room: furniture, people, or adjacent rooms (never external buildings like 서점/백화점 or 나라!)
				return (hasTag(n, K.PERSON, K.FAMILY) && !hasTag(n, "elder_noun", K.HONORIFIC)) || ["책상", "의자", "탁자", "침대", "소파", "창문", "문", "거실", "화장실", "부엌", "방", "서재", "교실", "사람", "친구", "학생"].includes(nKo);
			}
			if (isBuildingOrOutdoorGround) {
				// Outside/beside/behind/in-front-of a building requires person, tree, vehicle, or nearby external place/facility (never country/room/region/amusement!)
				return !hasTag(n, "amusement", "landmark", "district", "region", "country", "room") && !["나라", "외국", "세계", "방", "서재", "욕실"].includes(nKo) && ((hasTag(n, K.PERSON, K.FAMILY, "vehicle", K.FACILITY, K.PLACE, "animal") && !hasTag(n, "elder_noun", K.HONORIFIC)) || ["사람", "학생", "친구", "차", "자전거", "버스", "나무", "공원", "정류장", "카페", "서점", "빵집", "식당", "고양이", "강아지", "의자", "벤치"].includes(nKo));
			}
			// On/under/beside furniture or small objects: small physical objects, pets, or stationery (not vehicles, cities, appliances, furniture, or districts!)
			return !hasTag(n, K.PLACE, K.FACILITY, "building", "housing", "city", "country", "vehicle", K.TRANSPORTATION, "amusement", "furniture", "appliance", "electronics", "machine", "landmark", "district", "region") && !["팩스", "프린터", "텔레비전", "컴퓨터", "냉장고", "세탁기"].includes(nKo) && (hasTag(n, "stationery", "book", "tool", "device", "fruit") || ["책", "공책", "가방", "컵", "시계", "열쇠", "우산", "신발", "인형", "고양이", "강아지", "사과", "연필", "볼펜", "안경", "휴대전화", "모자", "지갑"].includes(nKo));
		});
		const figure = pickRandom(scaleFilteredSubjs.length > 0 ? scaleFilteredSubjs : allSubjNouns.filter(n => !ground || n[DATA_SCHEMA.Id] !== ground[DATA_SCHEMA.Id])) || ground;
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
						predType: existVerb[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB ? K.ACTION : "descriptive",
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
	if (hasTag(nominalUnit, K.TIME, "temporal")) {
		const isTimeModifier = ko === "지난" || hasTag(nominalUnit, "time_modifier", "determiner");
		if (isTimeModifier) tense = "past";
		const pol = getTemporalPolarity(nominalUnit);
		if (pol) tense = pol;
		const EXCLUDED_TIME_AVS = new Set(["때리다", "검사하다", "전하다", "밀다", "당기다", "말다", "포장하다", "세다", "올려놓다", "내려놓다", "붓다", "뜨거워지다", "낫다", "피다", "늘다", "줄다", "돌아가시다", "넘어지다", "떨리다", "바르다", "깎다", "소독하다", "묶다", "매다", "접다", "걸레질하다", "세일하다", "할인하다", "좌회전하다", "우회전하다", "썰다", "볶다", "굽다", "끓이다", "삶다", "튀기다", "다지다", "뿌리다", "가지다"]);
		const PREFERRED_TIME_AVS = new Set(["일어나다", "자다", "출근하다", "퇴근하다", "가다", "오다", "도착하다", "출발하다", "공부하다", "일하다", "운동하다", "산책하다", "쉬다", "먹다", "마시다", "식사하다", "요리하다", "만나다", "전화하다", "이야기하다", "읽다", "쓰다", "보다", "듣다", "청소하다", "쇼핑하다", "사다", "준비하다", "연습하다", "운전하다"]);
		const allAvs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId);
		const filteredAvs = allAvs.filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (vKo.includes(" ")) return false;
			if (EXCLUDED_TIME_AVS.has(vKo)) return false;
			if (hasTag(v, "involuntary", "passive", K.WEATHER)) return false;
			if (isIntransitiveVerb(v)) return false;
			if (getVerbParticleType(v) !== K.OBJECT) return false;
			return true;
		});
		const prefTimeAvs = filteredAvs.filter(v => PREFERRED_TIME_AVS.has(v[DATA_SCHEMA.Korean]));
		const avs = prefTimeAvs.length > 0 ? prefTimeAvs : filteredAvs;
		const isMealTimeWord = ["아침", "점심", "저녁"].includes(ko);
		const TRANSIENT_TIME_DVS = new Set(["바쁘다", "한가하다", "조용하다", "시끄럽다", "복잡하다", "피곤하다", "배고프다", "춥다", "덥다", "따뜻하다", "시원하다", "쌀쌀하다", "맑다", "흐리다", "화창하다", "무덥다"]);
		const dvs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId).filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (vKo.includes(" ")) return false;
			if (!TRANSIENT_TIME_DVS.has(vKo)) return false;
			if (isMealTimeWord && (hasTag(v, K.WEATHER, "descriptive_weather") || ["맑다", "흐리다", "쌀쌀하다", "화창하다", "무덥다", "춥다", "덥다", "따뜻하다", "시원하다"].includes(vKo))) return false;
			if (hasTag(v, "questionWord", "interrogative", K.HONORIFIC) || state.HONORIFIC_WORDS.has(vKo)) return false;
			const sc = filterBySet(getSubjectCandidatesForDescriptiveVerb(v), options, targetId).filter(n => n[DATA_SCHEMA.Id] !== targetId && n[DATA_SCHEMA.Id] !== 361);
			if (sc.length === 0) return false;
			return true;
		});
		const verbUnit = (variationIndex % 2 === 0 && avs.length > 0) ? pickRandom(avs) : (pickRandom(dvs) || pickRandom(avs));
		const timeSpeechAct = (ko === "언제" || hasTag(nominalUnit, "questionWord", "interrogative") || (verbUnit && hasTag(verbUnit, "questionWord", "interrogative"))) ? "interrogative" : "declarative";

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
			const timeNounCandidates = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n =>
				["달", "주", "해", "번", "학기", "겨울", "여름"].includes(n[DATA_SCHEMA.Korean])
			);
			if (timeNounCandidates.length > 0) {
				timeNounForSlot = pickRandom(timeNounCandidates);
				determinerForSlot = nominalUnit;
			}
		}

		const constituents = [{
			role: K.TIME,
			nounUnit: timeNounForSlot,
			determinerUnit: determinerForSlot,
			particleType: K.TIME
		}];

		if (verbUnit[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB) {
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
				speechAct: timeSpeechAct,
				politeness,
				tense,
				polarity: "affirmative",
				clauses: [{
					constituents,
					predicate: {
						role: "predicate",
						predType: verbUnit[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB ? K.ACTION : "descriptive",
						verbUnit,
						tense,
						politeness,
						speechAct: timeSpeechAct,
						polarity: "affirmative"
					}
				}]
			}
		};
	}

	// 4. Place / Location Noun (학교, 도서관, 집, 한국, 식당, 여기, 거기, 어디, 이곳, 저곳...)
	if (hasTag(nominalUnit, K.PLACE, "location", "institution", K.FACILITY) || ["여기", "거기", "저기", "어디", "이곳", "그곳", "저곳"].includes(ko)) {
		if (ko === "나라" && !hasTag(nominalUnit, K.PROPER_NOUN)) {
			const dvs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId);
			const naturalCountryDVs = dvs.filter(v => ["크다", "작다", "아름답다", "많다", "좋다", "유명하다"].includes(v[DATA_SCHEMA.Korean]));
			const countryDv = pickRandom(naturalCountryDVs);
			if (countryDv) {
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
								role: variationIndex === 1 ? "topic" : "subject",
								nounUnit: nominalUnit,
								particleType: variationIndex === 1 ? "topic" : "subject"
							}],
							predicate: {
								role: "predicate",
								predType: "descriptive",
								verbUnit: countryDv,
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
		const isInterrogative = ko === "어디";
		const nonKitchenPlace = ["교실", "도서관", "은행", "우체국", "병원", "약국", "학교", "사무실", "서점", "공항", "박물관", "미술관", "지하철역", "버스 정류장", "꽃집", "문구점", "찜질방", "산", "바다", "강", "호수", "공원", "한강공원", "노래방", "피시방", "영화관", "극장", "체육관", "백화점", "마트", "시장", "미용실", "세탁소"].includes(ko);
		const nonDomesticPlace = nonKitchenPlace || ["학생회관", "식당", "카페", "편의점", "저기", "거기", "여기", "그곳"].includes(ko);
		const isResidentialPlace = ["집", "원룸", "아파트", "기숙사", "하숙집", "고향", "서울", "부산", "대구", "속초", "한국", "미국", "일본", "중국", "독일", "베트남", "프랑스", "외국", "도시", "동네"].includes(ko) || hasTag(nominalUnit, "housing", "residence", "city", "country");
		const isWorkplace = ["회사", "사무실", "은행", "병원", "학교", "공장", "가게", "식당", "카페", "서점", "빵집", "마트", "백화점", "약국"].includes(ko);
		const isAcademicInst = ["학교", "초등학교", "중학교", "고등학교", "대학교", "대학원", "유치원", "학원"].includes(ko);
		const isCommuteDest = ["학교", "초등학교", "중학교", "고등학교", "대학교", "회사", "학원", "병원", "교회", "은행"].includes(ko);
		const isTransitStop = ["버스", "지하철", "택시", "기차", "정류장", "버스 정류장", "지하철역", "역", "터미널", "공항", "서울역", "부산역", "이촌역", "홍대입구역", "광화문역"].includes(ko);
		const isDiningVenue = ["식당", "학생식당", "카페", "빵집", "집", "기숙사", "맛집", "뷔페", "북경반점"].includes(ko);
		const isRetailStore = ["꽃집", "문구점", "백화점", "마트", "가게", "서점", "빵집", "편의점", "약국", "시장"].includes(ko);
		const isStudyVenue = ["도서관", "교실", "학교", "대학교", "학원", "집", "기숙사", "원룸", "서재", "방", "서점"].includes(ko);
		const isParkingVenue = ["주차장", "길", "집", "회사", "학교", "백화점", "마트"].includes(ko);
		const isPostalVenue = ko === "우체국";
		const isDeicticPlace = ["저기", "거기", "여기", "이곳", "그곳", "저곳"].includes(ko);
		const isOutdoorNature = hasTag(nominalUnit, K.NATURE) || ["산", "바다", "강", "호수", "공원", "한강공원", "스키장", "온천", "농구장"].includes(ko);
		const allAvs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (vKo.includes(" ")) return false;
			if (hasTag(v, "involuntary", "passive", K.WEATHER) || state.HONORIFIC_WORDS.has(vKo) || ["걸리다", "지내다", "되다", "나다", "죽다", "생기다", "터지다", "끓다", "식다", "놓다", "두다", "담다", "넣다", "보이다", "끼다", "개다", "싸다", "쌓다", "알다", "모르다", "기억하다", "원하다", "생각하다", "사랑하다", "남다", "붓다", "낫다", "뜨거워지다", "피다", "늘다", "줄다", "돌아가시다", "넘어지다", "떨리다", "눕다", "서다", "앉다", "잘하다", "못하다", "올려놓다", "보여주다", "보여드리다", "때리다", "지나가다", "빌려주다", "나빠하다", "배달시키다", "걸레질하다", "좌회전하다", "우회전하다", "세일하다", "할인하다", "바르다", "깎다", "소독하다", "묶다", "매다", "접다", "당기다", "밀다", "세다", "확인하다", "섞다", "버리다", "서명하다", "전하다", "짓다", "잡다", "예약하다", "건너다", "출국하다", "지각하다", "등산하다", "민박하다"].includes(vKo) && !["산", "바다", "강", "호수", "공원", "한강공원", "공항", "인천공항", "김포공항", "학교", "대학교", "학원", "회사", "한국", "미국", "일본", "중국", "서울", "시골", "제주도", "속초"].includes(ko)) return false;
			if (vKo === "출국하다" && !["공항", "인천공항", "김포공항", "한국", "미국", "일본", "중국", "서울", "외국"].includes(ko)) return false;
			if (vKo === "등산하다" && !["산", "설악산", "백두산", "한라산"].includes(ko)) return false;
			if (vKo === "지각하다" && !["학교", "수업", "학원", "회사", "모임", "회의", "대학교"].includes(ko)) return false;
			if (vKo === "민박하다" && !["바다", "산", "시골", "제주도", "속초"].includes(ko)) return false;
			if (vKo === "수영하다" && !["수영장", "바다", "강", "운동장"].includes(ko)) return false;
			if (vKo === "낚시하다" && !["바다", "강", "호수"].includes(ko)) return false;
			if ((ko === "저기" || ko === "저곳") && ["오다", "올라오다", "내려오다", "들어오다", "나오다"].includes(vKo)) return false;
			const VENUE_ALLOWED_VERBS = {
				"산": ["등산하다", "올라가다", "내려오다", "걷다", "산책하다", "구경하다", "쉬다", "가다", "오다", "찍다"],
				"바다": ["수영하다", "놀다", "걷다", "구경하다", "쉬다", "여행하다", "민박하다", "낚시하다", "가다", "오다", "찍다", "보다"],
				"강": ["걷다", "산책하다", "구경하다", "쉬다", "낚시하다", "달리다", "조깅하다", "가다", "오다", "찍다", "보다"],
				"호수": ["걷다", "산책하다", "구경하다", "쉬다", "낚시하다", "달리다", "조깅하다", "가다", "오다", "찍다", "보다"],
				"공원": ["산책하다", "걷다", "운동하다", "조깅하다", "달리다", "쉬다", "놀다", "만나다", "이야기하다", "가다", "오다", "찍다"],
				"한강공원": ["산책하다", "걷다", "운동하다", "조깅하다", "달리다", "쉬다", "놀다", "만나다", "이야기하다", "가다", "오다", "찍다"],
				"서울": ["살다", "여행하다", "구경하다", "일하다", "공부하다", "생활하다", "가다", "오다", "도착하다", "출발하다", "떠나다", "찍다"],
				"도서관": ["공부하다", "읽다", "쓰다", "빌리다", "찾다", "쉬다", "가다", "오다", "들어가다", "나오다", "만나다", "있다"],
				"서점": ["사다", "고르다", "읽다", "찾다", "구경하다", "가다", "오다", "들어가다", "만나다", "있다"],
				"꽃집": ["구경하다", "일하다", "가다", "오다", "도착하다", "만나다", "기다리다", "있다"],
				"문구점": ["구경하다", "일하다", "가다", "오다", "도착하다", "기다리다", "있다"],
				"빵집": ["구경하다", "일하다", "가다", "오다", "도착하다", "만나다", "기다리다", "먹다", "마시다", "있다"],
				"피시방": ["게임하다", "놀다", "만나다", "기다리다", "가다", "오다", "일하다", "있다"],
				"찜질방": ["쉬다", "자다", "목욕하다", "이야기하다", "만나다", "놀다", "가다", "오다", "있다"],
				"학생회관": ["식사하다", "만나다", "이야기하다", "쉬다", "공부하다", "가다", "오다", "기다리다", "있다"],
				"백화점": ["쇼핑하다", "구경하다", "일하다", "만나다", "기다리다", "가다", "오다", "도착하다", "있다"]
			};
			if (VENUE_ALLOWED_VERBS[ko] && !VENUE_ALLOWED_VERBS[ko].includes(vKo)) return false;
			if (state.HUMBLE_WORDS.has(vKo) || (state.HUMBLE_DATIVE_VERBS && state.HUMBLE_DATIVE_VERBS.has(vKo)) || vKo.includes("드리")) return false;
			if (!isResidentialPlace && (vKo === "이사하다" || vKo === "살다" || vKo === "생활하다")) return false;
			if (!["집", "기숙사", "하숙집", "원룸", "아파트", "고향"].includes(ko) && ["생활하다", "초대하다", "설거지하다", "키우다", "정리하다", "신다", "벗다", "입다"].includes(vKo)) return false;
			if (!isWorkplace && ["출근하다", "퇴근하다", "벌다"].includes(vKo)) return false;
			if (!isAcademicInst && ["입학하다", "결석하다", "출석하다"].includes(vKo)) return false;
			if (!isCommuteDest && vKo === "다니다") return false;
			if (!isTransitStop && ["내리다", "하차하다", "타다", "갈아타다"].includes(vKo)) return false;
			if (!isDiningVenue && ["먹다", "마시다", "시키다", "주문하다", "말다", "씹다", "덜다"].includes(vKo)) return false;
			if (!isRetailStore && ["사다", "고르다", "팔다", "준비하다"].includes(vKo)) return false;
			if (!isStudyVenue && ["공부하다", "읽다", "쓰다", "배우다", "빌리다", "가르치다", "필기하다"].includes(vKo)) return false;
			if (["꽃집", "문구점", "빵집", "학생회관", "학생식당"].includes(ko) && ["사귀다", "안내하다", "모으다", "올리다", "올려놓다", "보여주다", "바르다", "깎다", "소독하다", "주고받다", "연기하다", "낚시하다", "서명하다", "부르다", "발표하다", "질문하다", "내려오다", "올라오다", "세우다", "물어보다"].includes(vKo)) return false;
			if (!isParkingVenue && vKo === "주차하다") return false;
			if (!isPostalVenue && vKo === "부치다") return false;
			if (vKo === "세배하다" && !["집", "할아버지 댁", "고향"].includes(ko)) return false;
			if ((nonDomesticPlace || isDeicticPlace || isOutdoorNature) && ["세수하다", "목욕하다", "샤워하다", "자다", "낮잠 자다", "졸다", "일어나다"].includes(vKo) && ko !== "찜질방") return false;
			if ((nonKitchenPlace || isDeicticPlace || isOutdoorNature) && (hasTag(v, "cooking") || ["자르다", "튀기다", "썰다", "볶다", "굽다", "끓이다", "삶다", "말다", "부치다", "양념하다", "내리다", "다지다", "뿌리다", "깎다"].includes(vKo))) return false;
			if ((isOutdoorNature || ["꽃집", "문구점", "찜질방", "도서관", "병원", "약국", "은행", "백화점", "빵집", "체육관", "학생식당", "학생회관", "서울", "부산"].includes(ko)) && ["치다", "녹음하다", "다운로드하다", "원하다", "기억하다", "사용하다", "찾다", "바르다", "소독하다", "깎다", "덜다", "연기하다", "서명하다", "발표하다", "주고받다", "세우다", "올려놓다", "보여주다", "부르다", "내려오다", "올라오다", "사귀다", "모으다", "안내하다", "질문하다", "빌리다", "설거지하다"].includes(vKo)) return false;
			if ((ko === "여기" || ko === "이곳") && ["가다", "소풍을 가다", "여행하다", "출발하다", "나가다", "돌아가다"].includes(vKo)) return false;
			const isMotionOrStat = hasTag(v, "intransitive_motion", "intransitive_place", "locative_goal", "locative_origin", "existence") || ["출근하다", "도착하다", "입학하다", "출국하다", "떠나다"].includes(vKo);
			if (!isMotionOrStat && !isIntransitiveVerb(v)) {
				if (getVerbParticleType(v) === "dative") return false;
				const argPreview = selectArgumentForActionVerb(v, options, targetId);
				if (!argPreview || !argPreview.nounUnit || argPreview.role !== K.OBJECT) return false;
			}
			return true;
		});
		const agentiveAvs = allAvs.filter(v => getVerbParticleType(v) !== "subject" && !/이\/가/.test(String(v[DATA_SCHEMA.SyntaxFrame] || "")));
		const avs = agentiveAvs.length > 0 ? agentiveAvs : allAvs;
		const matchedPlaceDv = selectDescriptiveVerbForNoun(nominalUnit, { ...options, tense }, targetId);
		const dvs = matchedPlaceDv ? [matchedPlaceDv] : [];
		const verbUnit = pickRandom(avs) || pickRandom(dvs);

		if (options.onlyFromSet && !verbUnit) {
			return {
				ok: false,
				insufficientSet: true,
				missingRoles: ["Action Verb or Descriptive Verb"],
				message: "Cannot build a sentence using only your current set: add at least one Action Verb or Descriptive Verb."
			};
		}

		const verbKoPlace = verbUnit ? (verbUnit[DATA_SCHEMA.Korean] || "") : "";
		const isDynamicMotionOrOrigin = ["달리다", "걷다", "뛰다", "산책하다", "조깅하다", "수영하다", "등산하다", "떠나다", "출국하다", "출발하다", "나오다", "지나가다"].includes(verbKoPlace) || hasTag(verbUnit, "locative_origin");
		const isMotionOrStatic = verbUnit && (
			verbUnit[DATA_SCHEMA.PartofSpeech] === K.DESCRIPTIVE_VERB ||
			hasTag(verbUnit, "intransitive_motion", "intransitive_place", "locative_goal", "locative_origin", "existence") ||
			["출근하다", "도착하다", "입학하다", "출국하다", "떠나다"].includes(verbKoPlace)
		);

		const constituents = [];
		const arg = (verbUnit && verbUnit[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB)
			? selectArgumentForActionVerb(verbUnit, options, targetId)
			: { nounUnit: null, role: null, particleType: null };

		if (arg.role !== "subject") {
			let subj = selectSubjectUnit(options, targetId, false);
			if (subj && arg.nounUnit && ["치마", "원피스"].includes(arg.nounUnit[DATA_SCHEMA.Korean]) && ["오빠", "형", "남동생", "아버지", "아빠", "할아버지", "작은아버지", "큰아버지", "삼촌", "아저씨", "남자", "사나이"].includes(subj[DATA_SCHEMA.Korean])) {
				const fSubjs = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => ["언니", "누나", "여동생", "어머니", "엄마", "친구", "여자", "학생"].includes(n[DATA_SCHEMA.Korean]));
				if (fSubjs.length > 0) subj = pickRandom(fSubjs);
			}
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
			particleType: (!isDynamicMotionOrOrigin && (isMotionOrStatic || isKyesida)) ? "location_static" : "location_dynamic"
		});

		if (!isMotionOrStatic && arg.nounUnit && arg.nounUnit[DATA_SCHEMA.Id] !== targetId && (arg.role === K.OBJECT || arg.role === "subject")) {
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
						predType: verbUnit[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB ? K.ACTION : "descriptive",
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
	const isPerson = isPersonalPronoun || hasTag(nominalUnit, K.PERSON, K.FAMILY, "profession", "animal", "subject_animate");
	const isNonPersonDeictic = ["이것", "그것", "저것", "이거", "그거", "저거", "무엇", "뭐", "얼마", "몇", "여기", "거기", "저기", "어디", "이곳", "그곳", "저곳", "언제", "며칠"].includes(ko);
	if (isPerson && !isNonPersonDeictic) {
		const isElder = isElderNoun(nominalUnit);
		const isFirstPerson = ["저", "나", "우리", "저희", "제", "내"].includes(ko);
		const isJunior = hasTag(nominalUnit, "child", "junior") || ["아이", "조카", "동생", "남동생", "여동생", "사나이", "놈"].includes(ko);
		const isInterrogative = ko === "누구" || ko === "누가";
		const allAvs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId);
		const avs = allAvs.filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (vKo.includes(" ")) return false;
			if (isIntransitiveVerb(v)) return false;
			if (getVerbParticleType(v) !== K.OBJECT) return false;
			if ((!isElder || isFirstPerson || isJunior) && state.HONORIFIC_WORDS.has(vKo)) return false;
			if (["아랫사람", "노인", "어른", "아이", "학생", "조카", "남동생", "여동생", "얘들", "사나이", "놈"].includes(ko) && ["할인하다", "팔다"].includes(vKo)) return false;
			return true;
		});
		const matchedDV = selectDescriptiveVerbForNoun(nominalUnit, { ...options, tense }, targetId);
		let chosenDV = matchedDV;
		if (chosenDV && (!isElder || isFirstPerson || isJunior) && state.HONORIFIC_WORDS.has(chosenDV[DATA_SCHEMA.Korean])) {
			chosenDV = null;
		}
		const verbUnit = (variationIndex % 2 === 0 && avs.length > 0) ? pickRandom(avs, options.seedOffset, options) : (chosenDV || pickRandom(avs, options.seedOffset, options));
		let clauseTensePerson = tense;
		if (verbUnit && ["잘생기다", "못생기다", "오래되다"].includes(verbUnit[DATA_SCHEMA.Korean]) && !options.tense) {
			clauseTensePerson = "past";
		}

		if (!verbUnit) {
			// Fallback to Copula if another noun is in set
			const otherNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => n[DATA_SCHEMA.Id] !== targetId);
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

		if (verbUnit[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB) {
			const arg = selectArgumentForActionVerb(verbUnit, options, targetId);
			if (verbUnit[DATA_SCHEMA.Korean] === "넣다" || verbUnit[DATA_SCHEMA.Korean] === "담다") {
				const container = verbUnit[DATA_SCHEMA.Korean] === "담다"
					? pickRandom(getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => !hasTag(n, K.HONORIFIC, "honorific_noun") && (["접시", "그릇", "바구니", "상자"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "container", "dish"))))
					: selectPutInContainerNoun(arg.nounUnit, options, targetId);
				if (container && container[DATA_SCHEMA.Id] !== targetId) {
					constituents.push({
						role: "location",
						nounUnit: container,
						particleType: "location_static"
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
		}

		return {
			ok: true,
			ast: {
				type: "Sentence",
				targetUnitId: targetId,
				speechAct: isInterrogative ? "interrogative" : "declarative",
				politeness,
				tense: clauseTensePerson,
				polarity: "affirmative",
				honorific: isElder,
				clauses: [{
					honorific: isElder,
					constituents,
					predicate: {
						role: "predicate",
						predType: verbUnit[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB ? K.ACTION : "descriptive",
						verbUnit,
						tense: clauseTensePerson,
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
	const matchedAV = selectActionVerbForNoun(nominalUnit, options, targetId);
	const matchedDV = selectDescriptiveVerbForNoun(nominalUnit, { ...options, tense }, targetId);
	const useAV = variationIndex % 2 === 0 ? Boolean(matchedAV) : !matchedDV;
	const chosenVerb = useAV ? (matchedAV || matchedDV) : (matchedDV || matchedAV);
	const isInterrogative = ko === "무엇" || ko === "뭐" || Boolean(
		chosenVerb && (["어떻다", "어떠하다"].includes(chosenVerb[DATA_SCHEMA.Korean]) || hasTag(chosenVerb, "questionWord", "interrogative"))
	);

	if (!chosenVerb) {
		return {
			ok: false,
			insufficientSet: true,
			missingRoles: ["Action Verb or Descriptive Verb"],
			message: "Cannot build a sentence using only your current set: add at least one Action Verb or Descriptive Verb to your set."
		};
	}

	const constituents = [];
	if (chosenVerb[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB) {
		const subj = selectSubjectUnit(options, targetId, false);
		if (subj && subj[DATA_SCHEMA.Id] !== targetId) {
			constituents.push({
				role: "topic",
				nounUnit: subj,
				particleType: "topic"
			});
		}
		const chosenKo = chosenVerb[DATA_SCHEMA.Korean];
		if (chosenKo === "담다" || chosenKo === "놓다" || chosenKo === "두다" || chosenKo === "넣다") {
			const locPool = chosenKo === "담다"
				? getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => !hasTag(n, K.HONORIFIC, "honorific_noun") && (["접시", "그릇", "상자", "가방", "냉장고", "바구니"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "container", "dish")))
				: chosenKo === "넣다"
					? null
					: getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => ["책상", "탁자", "식탁", "의자", "바닥", "침대"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "furniture", K.PLACE));
			const containerLoc = chosenKo === "넣다"
				? selectPutInContainerNoun(nominalUnit, options, targetId)
				: pickRandom(locPool);
			if (containerLoc && containerLoc[DATA_SCHEMA.Id] !== targetId) {
				constituents.push({
					role: "location",
					nounUnit: containerLoc,
					particleType: "location_static"
				});
			}
		}
		let particleType = getVerbParticleType(chosenVerb);
		if (particleType === "dative" && !hasTag(nominalUnit, K.PERSON, K.FAMILY, "profession")) {
			particleType = K.OBJECT;
		}
		constituents.push({
			role: (particleType === "location" || particleType === "location_static") ? "location" : (particleType === "dative" ? "recipient" : K.OBJECT),
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
					predType: chosenVerb[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB ? K.ACTION : "descriptive",
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
	if (pos === K.DETERMINER) {
		const isInterrogative = ["어느", "무슨", "어떤", "몇"].includes(ko);
		const isTemporalDet = ["지난", "이번", "다음", "올"].includes(ko);
		let nouns = [];
		if (isTemporalDet) {
			nouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
				n => hasTag(n, K.TIME, "temporal") && !hasTag(n, K.MEASUREWORD, "counter", "position")
			);
		}
		if (nouns.length === 0) {
			nouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => {
				if (hasTag(n, K.MEASUREWORD, "counter", K.TIME, "position", "questionWord")) return false;
				if (["이", "얼마", "누구", "무엇", "뭐", "어디", "언제", "몇"].includes(n[DATA_SCHEMA.Korean])) return false;
				if (ko === "어느") {
					if (hasTag(n, K.PROPER_NOUN, K.FAMILY, "landmark", "tourism", "cultural_concept", "anatomy", "body_fluid", "maneuver")) return false;
					if (["직진", "좌회전", "우회전", "유턴", "스크린도어"].includes(n[DATA_SCHEMA.Korean])) return false;
					return ["나라", "고향", "도시", "학교", "회사", "집", "방", "가게", "식당", "카페", "은행", "병원", "공원", "친구", "사람", "선생님", "버스", "지하철", "계절", "요일", "쪽", "음식", "색깔", "책", "영화", "노래", "신발"].includes(n[DATA_SCHEMA.Korean])
						|| hasTag(n, K.PLACE, K.FACILITY, "country", "city", K.PERSON, K.TRANSPORTATION, "season", K.CLOTHING, "book", "direction");
				}
				return true;
			});
			if (ko === "어느" && nouns.length === 0) {
				nouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
					n => !hasTag(n, K.MEASUREWORD, "counter", K.TIME, "position", "questionWord", "cultural_concept", "anatomy", "body_fluid") &&
					!["이", "얼마", "누구", "무엇", "뭐", "어디", "언제", "몇"].includes(n[DATA_SCHEMA.Korean])
				);
			}
		}
		const allAvs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId);
		const avs = allAvs.filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (vKo.includes(" ")) return false;
			if (isIntransitiveVerb(v)) return false;
			if (getVerbParticleType(v) !== K.OBJECT) return false;
			return true;
		});
		const dvs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId);
		const headNoun = pickRandom(nouns);
		const isAction = variationIndex % 2 === 1;
		const chosenVerb = isAction
			? (headNoun ? selectActionVerbForNoun(headNoun, options, targetId) : pickRandom(avs))
			: (headNoun ? selectDescriptiveVerbForNoun(headNoun, options, targetId) : pickRandom(dvs));

		if (options.onlyFromSet && (nouns.length === 0 || !chosenVerb)) {
			const missing = [];
			if (nouns.length === 0) missing.push(K.NOUN);
			if (!chosenVerb) missing.push("Verb");
			return {
				ok: false,
				insufficientSet: true,
				missingRoles: missing,
				message: `Cannot build a sentence for determiner '${ko}' using only your current set (missing: ${missing.join(", ")}).`
			};
		}

		const isActionVerb = chosenVerb[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB;
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
						role: isActionVerb ? K.OBJECT : "subject",
						determinerUnit: unit,
						nounUnit: headNoun,
						particleType: isActionVerb ? K.OBJECT : "subject"
					}],
					predicate: {
						role: "predicate",
						predType: isActionVerb ? K.ACTION : "descriptive",
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
	if (pos === K.NUMBER) {
		const isSino = hasTag(unit, "sinoNumber");
		const numVal = (state.KOREAN_NUMBER_VALUES && state.KOREAN_NUMBER_VALUES[ko]) || 1;
		const classifiers = isSino ? Array.from(state.SINO_CLASSIFIERS) : Array.from(state.KOREAN_CLASSIFIERS);
		let chosenClassifierKo = isSino
			? (numVal >= 100 && classifiers.includes("원") ? "원" : (classifiers.includes("쪽") ? "쪽" : (classifiers[0] || "분")))
			: (classifiers.includes("개") ? "개" : (classifiers[0] || "개"));
		let counterUnit = state.CLASSIFIER_UNITS.get(chosenClassifierKo) || null;

		if (options.onlyFromSet) {
			const inSetCounters = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => hasTag(n, K.MEASUREWORD, "counter"));
			const matchingCounter = inSetCounters.find(c => (getClassifierNumeralType(c[DATA_SCHEMA.Korean]) === "sino") === isSino) || inSetCounters[0];
			if (matchingCounter) {
				counterUnit = matchingCounter;
				chosenClassifierKo = matchingCounter[DATA_SCHEMA.Korean];
			}
		}

		let nouns = chosenClassifierKo === "원"
			? getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => ["돈", "현금"].includes(n[DATA_SCHEMA.Korean]))
			: (chosenClassifierKo === "쪽"
				? getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => ["책", "교과서", "잡지", "신문", "사전", "만화책"].includes(n[DATA_SCHEMA.Korean]))
				: filterBySet(getMatchingNounsForClassifier(chosenClassifierKo), options, targetId));
		if (nouns.length === 0) {
			nouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => !hasTag(n, K.MEASUREWORD, "counter", K.TIME, K.PLACE));
		}
		const allAvs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId);
		const avs = allAvs.filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (vKo.includes(" ")) return false;
			if (isIntransitiveVerb(v)) return false;
			if (getVerbParticleType(v) !== K.OBJECT) return false;
			return true;
		});
		const dvs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId);
		const chosenVerb = chosenClassifierKo === "쪽"
			? (avs.find(v => v[DATA_SCHEMA.Korean] === "읽다") || avs.find(v => v[DATA_SCHEMA.Korean] === "보다") || pickRandom(avs) || pickRandom(dvs))
			: (chosenClassifierKo === "원"
				? (avs.find(v => v[DATA_SCHEMA.Korean] === "내다") || avs.find(v => v[DATA_SCHEMA.Korean] === "쓰다") || avs.find(v => v[DATA_SCHEMA.Korean] === "받다") || pickRandom(avs) || pickRandom(dvs))
				: (dvs.find(v => v[DATA_SCHEMA.Korean] === "있다") || pickRandom(avs) || pickRandom(dvs)));

		if (options.onlyFromSet && (nouns.length === 0 || !chosenVerb)) {
			const missing = [];
			if (nouns.length === 0) missing.push(K.NOUN);
			if (!chosenVerb) missing.push("Verb");
			return {
				ok: false,
				insufficientSet: true,
				missingRoles: missing,
				message: `Cannot build a number sentence using only your current set (missing: ${missing.join(", ")}).`
			};
		}

		const itemNoun = pickRandom(nouns);
		const isAction = chosenVerb[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB;
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
						role: isAction ? K.OBJECT : "subject",
						nounUnit: itemNoun,
						numberUnit: unit,
						numberSurfaceKo: numSurface,
						countValue: numVal,
						counterUnit,
						particleType: isAction ? K.OBJECT : "subject"
					}],
					predicate: {
						role: "predicate",
						predType: isAction ? K.ACTION : "descriptive",
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
	if (pos === K.EXCLAMATION) {
		const isAction = variationIndex % 2 === 1;
		const allAvs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId);
		const avs = allAvs.filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (vKo.includes(" ")) return false;
			if (isIntransitiveVerb(v)) return false;
			if (getVerbParticleType(v) !== K.OBJECT) return false;
			return true;
		});
		const dvs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId).filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (["싶다", "안녕하다", "죄송하다", "어떻다", "이렇다", "그렇다", "저렇다"].includes(vKo)) return false;
			if (hasTag(v, "auxiliary", "connective", "greeting")) return false;
			return true;
		});

		const constituents = [{
			role: K.DISCOURSE,
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
							predType: K.ACTION,
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
							predType: chosenVerb && chosenVerb[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB ? K.ACTION : "descriptive",
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
		const avs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(v => !state.FORBIDDEN_NEGATIVE_ROOTS.has(v[DATA_SCHEMA.Korean]) && !v[DATA_SCHEMA.Korean].includes(" "));
		const dvs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId).filter(v => !state.FORBIDDEN_NEGATIVE_ROOTS.has(v[DATA_SCHEMA.Korean]) && !["안녕하다", "싶다", "어떠하다"].includes(v[DATA_SCHEMA.Korean]));
		const dv1 = pickRandom(dvs) || dvs[0];
		const dvSubjs = dv1 ? filterBySet(getSubjectCandidatesForDescriptiveVerb(dv1), options, targetId).filter(u => u[DATA_SCHEMA.Id] !== 361) : [];
		const subj1 = dvSubjs.length > 0 ? pickRandom(dvSubjs) : selectSubjectUnit(options, targetId, false);
		const verb2 = (variationIndex % 2 === 0 && avs.length > 0) ? pickRandom(avs) : (pickRandom(dvs) || pickRandom(avs));
		const isAct2 = verb2 && verb2[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB;
		const arg2 = (isAct2 && !hasTag(verb2, "scalable_duration", "scalable_quantity")) ? selectArgumentForActionVerb(verb2, options, targetId) : { nounUnit: null };

		const clause1Constituents = [
			{ role: K.ADVERB, unit, particleType: null }
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
							predType: isAct2 ? K.ACTION : "descriptive",
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
		const avs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(v => !state.FORBIDDEN_NEGATIVE_ROOTS.has(v[DATA_SCHEMA.Korean]) && !v[DATA_SCHEMA.Korean].includes(" "));
		const dvs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId).filter(v => !state.FORBIDDEN_NEGATIVE_ROOTS.has(v[DATA_SCHEMA.Korean]) && !["안녕하다", "싶다", "어떠하다"].includes(v[DATA_SCHEMA.Korean]));
		const chosenVerb = (variationIndex % 2 === 0 && avs.length > 0) ? pickRandom(avs) : (pickRandom(dvs) || pickRandom(avs));
		const isAction = chosenVerb[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB;
		const subj = isAction ? selectSubjectUnit(options, targetId, false) : (filterBySet(getSubjectCandidatesForDescriptiveVerb(chosenVerb), options, targetId)[0] || selectSubjectUnit(options, targetId, false));
		const arg = (isAction && !hasTag(chosenVerb, "scalable_duration", "scalable_quantity")) ? selectArgumentForActionVerb(chosenVerb, options, targetId) : { nounUnit: null };

		const constituents = [
			{ role: K.DISCOURSE, unit, particleType: null }
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
						predType: isAction ? K.ACTION : "descriptive",
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
		const counterUnit = state.CLASSIFIER_UNITS.get(cKo) || getAllUnitsOfPos(K.NOUN, options, targetId).find(n => n[DATA_SCHEMA.Korean] === cKo) || null;
		let compatibleNouns = filterBySet(getMatchingNounsForClassifier(cKo), options, targetId);
		if (compatibleNouns.length === 0) {
			compatibleNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => !hasTag(n, K.MEASUREWORD, "counter", K.TIME, "position"));
		}
		const headNoun = pickRandom(compatibleNouns);
		const numVals = [2, 3, 5, 10];
		const numVal = numVals[variationIndex % numVals.length];
		const numKo = getKoreanNumber(numVal, true);

		const modifierPhrase = `한 ${numKo}`;
		const isExistential = variationIndex % 2 === 0;
		const verbUnit = isExistential
			? (getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId).find(v => v[DATA_SCHEMA.Korean] === "있다") || null)
			: (headNoun ? selectActionVerbForNoun(headNoun, options, targetId) : null);

		const isAction = verbUnit && verbUnit[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB;
		const constituents = [{
			role: isAction ? K.OBJECT : "subject",
			nounUnit: headNoun,
			numberSurfaceKo: modifierPhrase,
			counterUnit,
			particleType: isAction ? K.OBJECT : "subject"
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
						predType: isAction ? K.ACTION : "descriptive",
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
	const isDiscourse = state.DISCOURSE_ADVERBS.has(ko) || hasTag(unit, K.DISCOURSE, "conjunction");
	const isQuestionWord = hasTag(unit, "questionWord", "interrogative");
	const pol = getTemporalPolarity(unit);
	if (pol) tense = pol;
	if (["가끔", "자주", "항상", "보통", "매일", "매주", "매달", "매년"].includes(ko) && tense === "future" && !options.tense) {
		tense = "present";
	}
	const isAdvNeg = isNPI || isShortAn || isShortMot;
	const requiresVolitionOrFreq = ["가끔", "자주", "항상", "매달", "매주", "매년", "날마다", "매일", "열심히", "천천히", "빨리"].includes(ko);
	const isDailyHabit = ["날마다", "매일"].includes(ko);

	const avs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(v => {
		const k = v[DATA_SCHEMA.Korean] || "";
		if (k.includes(" ")) return false;
		if (k === "때리다" && v[DATA_SCHEMA.Id] !== targetId) return false;
		if (state.FORBIDDEN_NEGATIVE_ROOTS.has(k)) return false;
		if (isAdvNeg && (k.endsWith("있다") || k.endsWith("알다"))) return false;
		if (requiresVolitionOrFreq && (hasTag(v, "involuntary", "passive") || ["터지다", "내리다", "끓다", "식다", "말다", "사먹다", "여쭙다"].includes(k))) return false;
		if (isDailyHabit && ["알아보다", "고치다", "물어보다", "키우다", "이사하다", "입학하다", "졸업하다", "결혼하다", "세다", "빌리다", "바꾸다"].includes(k)) return false;
		if (typeof canAdverbPrecede === 'function' && !canAdverbPrecede(unit, v, { isNegative: isAdvNeg, tense })) return false;
		return true;
	});
	const dvs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId).filter(v => {
		const k = v[DATA_SCHEMA.Korean] || "";
		if (k.includes(" ")) return false;
		if (state.FORBIDDEN_NEGATIVE_ROOTS.has(k)) return false;
		if (isAdvNeg && (k.endsWith("있다") || k.endsWith("알다"))) return false;
		if (tense !== "past" && ["잘생기다", "못생기다", "오래되다"].includes(k)) return false;
		if (typeof canAdverbPrecede === 'function' && !canAdverbPrecede(unit, v, { isNegative: isAdvNeg, tense })) return false;
		return true;
	});

	let chosenVerb = null;
	if (isShortMot) {
		const volitionalAVs = avs.filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (["낫다", "걸리다", "끝나다", "시작되다", "고장 나다", "죽다", "생기다", "열리다", "닫히다"].some(k => vKo.includes(k))) return false;
			if (hasTag(v, "involuntary", "passive", K.WEATHER)) return false;
			return true;
		});
		chosenVerb = pickRandom(volitionalAVs) || pickRandom(avs);
	} else if (ko === "얼마나") {
		// 얼마나 requires gradable Descriptive Verb (degree) or duration/scalable verb (scalable)
		const durationVerbs = avs.filter(v => hasTag(v, "scalable", "scalable_duration", "scalable_quantity", "scalable_emotion"));
		const gradableDvs = dvs.filter(v => hasTag(v, K.GRADABLE));
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
			missingRoles: [isShortMot || isManner ? K.ACTION_VERB : "Action Verb or Descriptive Verb"],
			message: `Cannot build a sentence for adverb '${ko}' using only your current set: add a compatible Verb to your set.`
		};
	}

	const isAction = chosenVerb[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB;
	const constituents = [];
	let subj = null;
	if (ko === "얼마나" && hasTag(chosenVerb, "scalable_duration", "scalable_quantity")) {
		const resourceNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => hasTag(n, "resource"));
		subj = resourceNouns.length > 0 ? (hasTag(chosenVerb, "scalable_quantity") && resourceNouns.length > 1 ? pickRandom(resourceNouns) : resourceNouns[0]) : selectSubjectUnit(options, targetId, false);
	} else if (["모두", "다"].includes(ko)) {
		const pluralPool = getAllUnitsOfPos(K.PRONOUN, options, targetId).filter(p => ["우리", "저희"].includes(p[DATA_SCHEMA.Korean]));
		const pluralNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => isPluralSubjectUnit(n));
		subj = pickRandom([...pluralPool, ...pluralNouns]) || selectSubjectUnit(options, targetId, false);
	} else if (!isAction) {
		const dvSubjs = filterBySet(getSubjectCandidatesForDescriptiveVerb(chosenVerb), options, targetId).filter(u => u[DATA_SCHEMA.Id] !== 361 && !hasTag(u, "questionWord", "interrogative") && !["누구", "누가", "무엇", "뭐", "언제", "어디"].includes(u[DATA_SCHEMA.Korean]));
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
		constituents.push({ role: K.DISCOURSE, unit, particleType: null });
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
		constituents.push({ role: K.TIME, unit, particleType: null });
	}

	if (arg.nounUnit && (!subj || arg.nounUnit[DATA_SCHEMA.Id] !== subj[DATA_SCHEMA.Id])) {
		constituents.push({
			role: arg.role,
			nounUnit: arg.nounUnit,
			particleType: arg.particleType
		});
	}

	if (!isDiscourse && !pol && !isShortAn && !isShortMot) {
		constituents.push({ role: K.ADVERB, unit, particleType: null });
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
					predType: isAction ? K.ACTION : "descriptive",
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
	const isImperativeOrPropositive = hasTag(grammarUnit, "imperative", "propositive");
	const avs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(v => {
		if (isNegativeGrammar && state.FORBIDDEN_NEGATIVE_ROOTS.has(v[DATA_SCHEMA.Korean])) return false;
		if (isInability && !canTakeMood(v, "inability")) return false;
		if (isImperativeOrPropositive && !canTakeMood(v, "imperative")) return false;
		return true;
	});
	const dvs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId).filter(v => {
		if (isNegativeGrammar && state.FORBIDDEN_NEGATIVE_ROOTS.has(v[DATA_SCHEMA.Korean])) return false;
		return true;
	});
	const nouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => !hasTag(n, K.MEASUREWORD, "counter") && n[DATA_SCHEMA.Korean] !== "이");

	if (options.onlyFromSet) {
		const needsAV = formulas.length > 0 && formulas.every(f => f.includes("AVst"));
		const needsDV = formulas.length > 0 && formulas.every(f => f.includes("DVst") && !f.includes("AVst"));
		const missing = [];
		if (needsAV && avs.length === 0) missing.push(K.ACTION_VERB);
		if (needsDV && dvs.length === 0) missing.push(K.DESCRIPTIVE_VERB);
		if (!needsAV && !needsDV && avs.length === 0 && dvs.length === 0 && !ko.includes("이에요") && !ko.includes("입니다") && !ko.includes("이야")) {
			missing.push("Action or Descriptive Verb");
		}
		if (nouns.length === 0) missing.push(K.NOUN);
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

	// Split formula if it has a subordinate clause or adverbial modifier followed by {Clause}
	if (formula.includes("{Clause}")) {
		const parts = formula.split("{Clause}");
		const subFormula = parts[0].trim();

		if (/^\{Adv[^}]*\}$/.test(subFormula)) {
			// Single clause modified by an adverb placed cleanly before the predicate/VP
			const cleanAdverbCandidates = getAllUnitsOfPos(K.POS_ADVERB, options, targetId).filter(a => {
				if (a[DATA_SCHEMA.PartofSpeech] !== K.POS_ADVERB) return false;
				const aKo = a[DATA_SCHEMA.Korean];
				if (aKo === "안" || aKo === "못") return false;
				if (!isNegativeGrammar && state.ALL_NPI_WORDS && state.ALL_NPI_WORDS.has(aKo)) return false;
				if (hasTag(a, K.DISCOURSE, "conjunction", "connective", "greeting", "interjection", "exclamation", "hesitation", K.TIME, "temporal", "questionWord", "interrogative", "demonstrative", "concessive", "approximation", "number_unit")) return false;
				if (["그렇게", "이렇게", "저렇게", "다함께", "따로"].includes(aKo)) return false;
				if (isImperativeOrPropositive && parseSemanticData(a).target_pos === K.DESCRIPTIVE_VERB) return false;
				return true;
			});
			const cleanAVs = avs.filter(v => {
				const vKo = v[DATA_SCHEMA.Korean];
				return !vKo.includes(" ") && !["죽다", "걸리다", "지내다", "빌리다", "들다", "되다", "나다", "태어나다", "줄다", "늘다", "걱정되다", "들어주다", "대다", "도와드리다", "여쭙다"].includes(vKo) && !hasTag(v, "involuntary");
			});
			const cleanDVs = dvs.filter(v => {
				const vKo = v[DATA_SCHEMA.Korean];
				return !["비슷하다", "다르다", "같다", "이다", "아니다", "태어나다", "줄다", "늘다", "걱정되다", "어떻다", "어떠하다", "어울리다", "오랜만이다", "행복하다", "외롭다", "불안하다", "부끄럽다", "슬프다", "기쁘다", "즐겁다", "부럽다", "그립다", "무섭다", "힘들다", "졸리다", "창피하다", "심심하다"].includes(vKo)
					&& !hasTag(v, "demonstrative", "questionWord", "interrogative", "greeting", K.DISCOURSE)
					&& !(tense !== "past" && ["잘생기다", "못생기다", "오래되다"].includes(vKo));
			});
			const advPool = cleanAdverbCandidates.length > 0 ? cleanAdverbCandidates : getAllUnitsOfPos(K.POS_ADVERB, options, targetId).filter(a => a[DATA_SCHEMA.PartofSpeech] === K.POS_ADVERB);
			const chosenAdv = pickRandom(advPool);
			const advTargetPos = chosenAdv ? parseSemanticData(chosenAdv).target_pos : null;
			const advIsManner = chosenAdv && (state.MANNER_ADVERBS.has(chosenAdv[DATA_SCHEMA.Korean]) || hasTag(chosenAdv, "manner", "adverb_manner"));
			const advRequiresAction = isImperativeOrPropositive || advIsManner || advTargetPos === K.ACTION_VERB
				|| (chosenAdv && hasTag(chosenAdv, "spatial", "adverb_place", "distance", "adverb_frequency", "frequency"));
			const candidateVerbs = advRequiresAction
				? (cleanAVs.length > 0 ? cleanAVs : avs)
				: (advTargetPos === K.DESCRIPTIVE_VERB
					? (cleanDVs.length > 0 ? cleanDVs : dvs)
					: cleanAVs.concat(cleanDVs));
			const compatibleVerbs = (chosenAdv && typeof canAdverbPrecede === 'function')
				? candidateVerbs.filter(v => canAdverbPrecede(chosenAdv, v, { isNegative: isNegativeGrammar }))
				: candidateVerbs;
			const mainVerb = pickRandom(compatibleVerbs.length > 0 ? compatibleVerbs : candidateVerbs) || pickRandom(avs) || pickRandom(dvs);

			const mainClauseConstituents = [];
			let mainPred = null;
			if (mainVerb) {
				const isAction = mainVerb[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB;
				if (isAction) {
					const arg = selectArgumentForActionVerb(mainVerb, options, targetId);
					if (arg.role !== "subject") {
						const subj = selectSubjectUnit(options, targetId, false);
						if (subj) {
							mainClauseConstituents.push({
								role: "topic",
								nounUnit: subj,
								particleType: "topic"
							});
						}
					}
					if (arg.nounUnit) {
						mainClauseConstituents.push({
							role: arg.role,
							nounUnit: arg.nounUnit,
							particleType: arg.particleType
						});
						if (arg.particleType === "location_static" && ["놓다", "올려놓다", "두다", "담다", "넣다"].includes(mainVerb[DATA_SCHEMA.Korean])) {
							const objCands = filterBySet(getNounCandidatesForVerb(mainVerb), options, targetId).filter(n => !hasTag(n, K.MEASUREWORD, "counter", K.PLACE, K.FACILITY, "building", "furniture", "vehicle", K.PROPER_NOUN));
							const objNoun = pickRandom(objCands, options.seedOffset, options);
							if (objNoun) {
								mainClauseConstituents.push({
									role: K.OBJECT,
									nounUnit: objNoun,
									particleType: K.OBJECT
								});
							}
						}
					}
				} else {
					const isColloquialAdv = Boolean(chosenAdv && chosenAdv[DATA_SCHEMA.Korean] === "완전");
					const dvSubjPool = filterBySet(getSubjectCandidatesForDescriptiveVerb(mainVerb), options, targetId).filter(
						n => !isColloquialAdv || (!isElderNoun(n) && !["할아버지", "할머니"].includes(n[DATA_SCHEMA.Korean]))
					);
					const subj = pickRandom(dvSubjPool.length > 0 ? dvSubjPool : filterBySet(getSubjectCandidatesForDescriptiveVerb(mainVerb), options, targetId));
					if (subj) {
						mainClauseConstituents.push({
							role: "subject",
							nounUnit: subj,
							particleType: "subject"
						});
					}
				}
				if (chosenAdv) {
					mainClauseConstituents.push({
						role: K.ADVERB,
						unit: chosenAdv,
						particleType: null
					});
				}
				mainPred = {
					role: "predicate",
					predType: isAction ? K.ACTION : "descriptive",
					verbUnit: mainVerb,
					tense,
					politeness,
					speechAct,
					polarity: isNegativeGrammar ? "negative" : "affirmative"
				};
			}
			clauses.push({ constituents: mainClauseConstituents, predicate: mainPred });
		} else {
			const subRes = expandFormulaIntoClause(subFormula, grammarUnit, tense, politeness, options, targetId, true);
			const EXCLUDED_CAUSAL_MAIN_VERBS = new Set(["돌아가시다", "기뻐하다", "몸이 떨리다"]);
			const subSubjCon = (subRes && Array.isArray(subRes.constituents))
				? subRes.constituents.find(c => (c.role === "subject" || c.role === "topic") && (c.nounUnit || c.unit))
				: null;
			const subSubjUnit = subSubjCon ? (subSubjCon.nounUnit || subSubjCon.unit) : null;
			const subSubjIsHuman = Boolean(subSubjUnit && (
				subSubjUnit[DATA_SCHEMA.PartofSpeech] === K.PRONOUN
				|| hasTag(subSubjUnit, K.PERSON, K.FAMILY, "profession", "subject_animate")
			));
			const isNominalReason = !subFormula.includes("VP_") && subFormula.includes("때문에");
			const isClauseReasonWithDV = subFormula.includes("때문에") && subRes && subRes.predicate && subRes.predicate.predType === "descriptive";
			const NOMINAL_CAUSE_MAIN_VERBS = new Set(["피곤하다", "바쁘다", "힘들다", "늦다", "기쁘다", "슬프다", "건강하다", "괜찮다", "좋다", "나쁘다", "걱정되다", "쉬다", "일하다", "공부하다", "기다리다", "만나다", "가다", "오다", "먹다", "사다", "준비하다"]);
			const mainAvPool = avs.filter(v => (v[DATA_SCHEMA.Id] === targetId || !EXCLUDED_CAUSAL_MAIN_VERBS.has(v[DATA_SCHEMA.Korean])) && (!(isNominalReason || isClauseReasonWithDV) || NOMINAL_CAUSE_MAIN_VERBS.has(v[DATA_SCHEMA.Korean])));
			const compatibleDvPool = dvs.filter(v => {
				if (v[DATA_SCHEMA.Id] !== targetId && EXCLUDED_CAUSAL_MAIN_VERBS.has(v[DATA_SCHEMA.Korean])) return false;
				if ((isNominalReason || isClauseReasonWithDV) && !NOMINAL_CAUSE_MAIN_VERBS.has(v[DATA_SCHEMA.Korean])) return false;
				if (!subSubjIsHuman) return true;
				const cands = filterBySet(getSubjectCandidatesForDescriptiveVerb(v), options, targetId);
				return cands.some(n => n[DATA_SCHEMA.Id] === subSubjUnit[DATA_SCHEMA.Id]);
			});
			const baseMainAv = mainAvPool.length > 0 ? mainAvPool : avs;
			const baseMainDv = compatibleDvPool.length > 0 ? compatibleDvPool : dvs.filter(v => v[DATA_SCHEMA.Id] === targetId || !EXCLUDED_CAUSAL_MAIN_VERBS.has(v[DATA_SCHEMA.Korean]));
			const mainVerbCandidates = isImperativeOrPropositive
				? baseMainAv
				: (baseMainAv.concat(baseMainDv));
			const mainVerb = pickRandom(mainVerbCandidates) || pickRandom(avs) || pickRandom(dvs);
			const mainClauseConstituents = [];
			let mainPred = null;
			if (mainVerb) {
				const isAction = mainVerb[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB;
				const isMainHonVerb = state.HONORIFIC_WORDS && state.HONORIFIC_WORDS.has(mainVerb[DATA_SCHEMA.Korean]);
				let reuseSubjHonorific = false;
				if (isAction) {
					const arg = selectArgumentForActionVerb(mainVerb, options, targetId);
					if (arg.nounUnit) {
						if (arg.role === "subject" && subSubjIsHuman) {
							reuseSubjHonorific = isElderNoun(subSubjUnit);
						} else {
							mainClauseConstituents.push({
								role: arg.role,
								nounUnit: arg.nounUnit,
								particleType: arg.particleType
							});
						}
					}
					if (subSubjIsHuman && (arg.role !== "subject" || !arg.nounUnit)) {
						reuseSubjHonorific = isMainHonVerb || isElderNoun(subSubjUnit);
					}
				} else {
					const dvSubjCands = filterBySet(getSubjectCandidatesForDescriptiveVerb(mainVerb), options, targetId);
					const subSubjValidForMainDv = subSubjUnit && dvSubjCands.some(n => n[DATA_SCHEMA.Id] === subSubjUnit[DATA_SCHEMA.Id]);
					if (subSubjIsHuman && subSubjValidForMainDv) {
						reuseSubjHonorific = isMainHonVerb || isElderNoun(subSubjUnit);
					} else {
						const subj = pickRandom(dvSubjCands);
						if (subj) {
							mainClauseConstituents.push({
								role: "subject",
								nounUnit: subj,
								particleType: "subject"
							});
						}
					}
				}
				mainPred = {
					role: "predicate",
					predType: isAction ? K.ACTION : "descriptive",
					verbUnit: mainVerb,
					tense,
					politeness,
					speechAct,
					polarity: "affirmative",
					...(reuseSubjHonorific ? { honorific: true } : {})
				};
			}
			clauses.push(subRes, { constituents: mainClauseConstituents, predicate: mainPred });
		}
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
	const isClauseImperative = hasTag(grammarUnit, "imperative");
	const isClausePropositive = hasTag(grammarUnit, "propositive");
	const avs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(v => {
		if (v[DATA_SCHEMA.Id] === targetId) return true;
		if (!isInterrogative && hasTag(v, "questionWord", "interrogative")) return false;
		if (isClauseNeg && state.FORBIDDEN_NEGATIVE_ROOTS.has(v[DATA_SCHEMA.Korean])) return false;
		if (isClauseInability && !canTakeMood(v, "inability")) return false;
		if (isClauseImperative && !canTakeMood(v, "imperative")) return false;
		if (isClausePropositive && !canTakeMood(v, "propositive")) return false;
		if ((isClausePropositive || isClauseImperative) && ["전화가 오다", "화가 나다", "비가 오다", "눈이 오다", "바람이 불다", "못하다", "잘하다", "방학하다", "나빠하다", "좋아하다", "싫어하다", "부러워하다", "슬퍼하다", "기뻐하다", "결석하다", "지각하다", "실수하다", "잊어버리다", "잃어버리다", "넘어지다", "때리다"].includes(v[DATA_SCHEMA.Korean])) return false;
		if (isClausePropositive && (["오다", "올라오다", "내려오다", "들어오다", "나오다", "돌아오다"].includes(v[DATA_SCHEMA.Korean]) || state.HONORIFIC_WORDS.has(v[DATA_SCHEMA.Korean]) || hasTag(v, K.HONORIFIC, "honorificVerb"))) return false;
		return true;
	});
	const dvs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId).filter(v => {
		if (v[DATA_SCHEMA.Id] === targetId) return true;
		if (!isInterrogative && hasTag(v, "questionWord", "interrogative")) return false;
		if (isClauseNeg && state.FORBIDDEN_NEGATIVE_ROOTS.has(v[DATA_SCHEMA.Korean])) return false;
		if (tense !== "past" && ["잘생기다", "못생기다", "오래되다"].includes(v[DATA_SCHEMA.Korean])) return false;
		return true;
	});
	const allNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
		n => !hasTag(n, K.MEASUREWORD, "counter")
			&& n[DATA_SCHEMA.Korean] !== "이"
			&& !(hasTag(n, "colloquial") && parseSemanticData(n).polarity === -1)
			&& (isInterrogative || (!hasTag(n, "questionWord", "interrogative") && !["얼마", "누구", "무엇", "뭐", "어디", "언제", "몇", "며칠"].includes(n[DATA_SCHEMA.Korean])))
	);

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
			const restOfFormula = formula.slice(m.index + m[0].length).trim();
			const hasMoreTokens = /\{[^}]+\}/.test(restOfFormula);
			let chosenVerb = isAction ? (pickRandom(avs) || pickRandom(dvs)) : (pickRandom(dvs) || pickRandom(avs));
			if (isAction && (isClausePropositive || isClauseImperative) && avs.length > 0 && (tokenType === "VP_AVst" || !hasMoreTokens)) {
				const propPool = avs.filter(v => {
					if (isIntransitiveVerb(v) || getVerbParticleType(v) !== K.OBJECT) return true;
					const argCheck = selectArgumentForActionVerb(v, options, targetId);
					return Boolean(argCheck && argCheck.nounUnit);
				});
				if (propPool.length > 0 && chosenVerb && !propPool.includes(chosenVerb)) {
					chosenVerb = pickRandom(propPool);
				}
			}
			if (!chosenVerb) continue;

			// Add argument if VP_* or if bare AVst/DVst is the main predicate with no prior arguments
			if (tokenType === "VP_AVst" || (tokenType === "AVst" && !hasMoreTokens && constituents.length === 0)) {
				const arg = selectArgumentForActionVerb(chosenVerb, options, targetId);
				if (arg.nounUnit && !((isClausePropositive || isClauseImperative) && arg.role === "subject")) {
					const cVerbKo = chosenVerb[DATA_SCHEMA.Korean];
					const isDativeArg = arg.particleType === "dative" || arg.role === "recipient" || arg.role === "dative";
					let finalArgNoun = arg.nounUnit;
					if (isDativeArg && !cVerbKo.includes("드리") && cVerbKo !== "여쭙다" && isElderNoun(finalArgNoun)) {
						const nonElders = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => ["친구", "동생", "남동생", "여동생", "학생", "아이"].includes(n[DATA_SCHEMA.Korean]));
						if (nonElders.length > 0) finalArgNoun = pickRandom(nonElders, options.seedOffset, options);
					}
					constituents.push({
						role: arg.role,
						nounUnit: finalArgNoun,
						particleType: arg.particleType
					});
					if (isDativeArg && ["가르치다", "주다", "드리다", "보내다", "선물하다", "빌려주다"].includes(cVerbKo)) {
						let objCands = cVerbKo === "가르치다"
							? getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => !hasTag(n, K.MEASUREWORD, "counter", K.PERSON, K.PLACE, K.PROPER_NOUN) && (hasTag(n, "language", K.ACADEMIC, "hobby", "sport") || ["한국어", "영어", "일본어", "중국어", "요리", "노래", "운전", "컴퓨터", "수영", "태권도", "말"].includes(n[DATA_SCHEMA.Korean])))
							: filterBySet(getNounCandidatesForVerb(chosenVerb), options, targetId).filter(n => !hasTag(n, K.MEASUREWORD, "counter", K.PERSON, K.PLACE, K.PROPER_NOUN));
						const objNoun = pickRandom(objCands, options.seedOffset, options);
						if (objNoun) {
							constituents.push({
								role: K.OBJECT,
								nounUnit: objNoun,
								particleType: K.OBJECT
							});
						}
					}
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
					predType: isAction ? K.ACTION : "descriptive",
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
					predType: isAction ? K.ACTION : "descriptive",
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
		} else if (tokenType === "N" || tokenType === K.NOUN || tokenType === "N_Phrase") {
			let pool = allNouns;
			if (grammarUnit[DATA_SCHEMA.Korean] === "씨" || targetId === 23) {
				const personalNames = allNouns.filter(
					n => ["마리", "민수", "지훈", "수진", "영수", "유키", "올리비아", "미진", "리타오", "흐엉", "에릭", "민준"].includes(n[DATA_SCHEMA.Korean])
						|| (hasTag(n, "properNoun", K.PROPER_NOUN) && hasTag(n, K.PERSON))
				);
				if (personalNames.length > 0) pool = personalNames;
			} else {
				const isHonParticle = hasTag(grammarUnit, K.HONORIFIC) || (grammarUnit[DATA_SCHEMA.Korean] || "").includes("께서") || (grammarUnit[DATA_SCHEMA.Korean] || "").includes("께");
				if (isHonParticle) {
					const elders = allNouns.filter(
						n => isElderNoun(n)
							&& hasTag(n, K.PERSON, K.FAMILY, "profession", "kinship_elder", "elder", "elder_noun", "honorific_person")
							&& !["말씀", "진지", "연세", "성함", "생신", "댁", "병환", "약주"].includes(n[DATA_SCHEMA.Korean])
					);
					if (elders.length > 0) pool = elders;
				} else if (tag) {
					const tagged = allNouns.filter(n => hasTag(n, tag));
					if (tagged.length > 0) pool = tagged;
				}
			}
			const restOfFormula = formula.slice(m.index + m[0].length).trim();
			const hasMoreTokens = /\{[^}]+\}/.test(restOfFormula);
			const isCopulaEnding = !hasMoreTokens && (suffix.includes("이/예요") || suffix.includes("입니다") || suffix.includes("이야") || restOfFormula.includes("아니에요"));

			if (isCopulaEnding) {
				const copulaNouns = pool.filter(n =>
					hasTag(n, "profession", "job", "status", "role", "nationality", K.OBJECT, K.FOOD, "animal", "fruit")
					&& !hasTag(n, "name")
					&& !(hasTag(n, "colloquial") && parseSemanticData(n).polarity === -1)
				);
				if (copulaNouns.length > 0) pool = copulaNouns;
			}

			const chosenNoun = pickRandom(pool) || allNouns[0];
			if (!chosenNoun) continue;

			if (isCopulaEnding) {
				const fullCopula = resolvePureMorphology(chosenNoun[DATA_SCHEMA.Korean] + suffix + (restOfFormula ? " " + restOfFormula : ""), state);
				const isHumanComp = hasTag(chosenNoun, K.PERSON, "profession", "job", "status", "role", "nationality");
				let subj = null;
				if (isHumanComp) {
					const humanPronouns = getAllUnitsOfPos(K.PRONOUN, options, targetId).filter(p => ["저", "나", "우리"].includes(p[DATA_SCHEMA.Korean]));
					subj = pickRandom(humanPronouns) || selectSubjectUnit(options, targetId, false);
				} else {
					const thingPronouns = getAllUnitsOfPos(K.PRONOUN, options, targetId).filter(p => ["이것", "그것", "저것", "이거", "그거", "저거"].includes(p[DATA_SCHEMA.Korean]));
					subj = pickRandom(thingPronouns);
				}
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
					polarity: restOfFormula.includes("아니") ? "negative" : "affirmative",
					tense,
					politeness
				};
				break;
			} else {
				const gKo = grammarUnit[DATA_SCHEMA.Korean] || "";
				const inferredRole = (hasTag(grammarUnit, "topic") || suffix.includes("은/는")) ? "topic"
					: (hasTag(grammarUnit, "subject") || suffix.includes("이/가") || suffix.includes("께서")) ? "subject"
					: (hasTag(grammarUnit, K.OBJECT) || suffix.includes("을/를")) ? K.OBJECT
					: (hasTag(grammarUnit, "dative") || suffix.includes("에게") || suffix.includes("한테") || suffix === "께") ? "recipient"
					: (tag === K.PLACE || hasTag(grammarUnit, "location", "location_action", "direction", "directional")) ? "location"
					: (tag === K.TIME || hasTag(grammarUnit, K.TIME, "temporal")) ? K.TIME
					: "noun_phrase";
				const inferredParticleType = inferredRole === "location"
					? (suffix.includes("에서") ? "location_dynamic" : "location_static")
					: (inferredRole === "recipient" ? "dative" : (inferredRole !== "noun_phrase" ? inferredRole : null));

				const isSsiPattern = grammarUnit[DATA_SCHEMA.Korean] === "씨" || targetId === 23;
				const ssiParticle = isSsiPattern && !hasMoreTokens ? "가" : "";
				const finalInferredRole = isSsiPattern && !hasMoreTokens ? "subject" : inferredRole;
				const finalInferredParticleType = isSsiPattern && !hasMoreTokens ? "subject" : inferredParticleType;
				const joiner = (suffix === "씨" || suffix.startsWith("씨")) ? " " : "";
				const withSuffix = resolvePureMorphology(chosenNoun[DATA_SCHEMA.Korean] + joiner + suffix + ssiParticle, state);
				constituents.push({
					role: finalInferredRole,
					nounUnit: chosenNoun,
					particleType: finalInferredParticleType,
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
					role: K.ADVERB,
					unit: advUnit,
					particleType: null
				});
			}
		} else if (tokenType === K.NUMBER) {
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
						predType: K.ACTION,
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
			const isElder = (grammarUnit[DATA_SCHEMA.Korean] !== "씨" && targetId !== 23) && (isElderNoun(baseNoun) || hasTag(grammarUnit, K.HONORIFIC));
			if (role === K.OBJECT) {
				const sub = selectSubjectUnit(options, targetId, false);
				if (sub && sub[DATA_SCHEMA.Id] !== baseNoun[DATA_SCHEMA.Id]) {
					constituents.unshift({
						role: "topic",
						nounUnit: sub,
						particleType: "topic"
					});
				}
				const transitiveAvs = avs.filter(v => !isIntransitiveVerb(v) && getVerbParticleType(v) === K.OBJECT);
				const av = selectActionVerbForNoun(baseNoun, options, targetId) || pickRandom(transitiveAvs) || pickRandom(avs);
				if (av) {
					predicate = {
						role: "predicate",
						predType: K.ACTION,
						verbUnit: av,
						tense,
						politeness
					};
				}
			} else {
				const nonHumbleAVs = avs.filter(v => !state.HUMBLE_WORDS.has(v[DATA_SCHEMA.Korean]));
				const chosenV = isElder
					? (pickRandom(nonHumbleAVs) || pickRandom(dvs))
					: (selectDescriptiveVerbForNoun(baseNoun, { ...options, tense }, targetId) || selectActionVerbForNoun(baseNoun, options, targetId) || pickRandom(dvs) || pickRandom(avs));
				if (chosenV) {
					if (["잘생기다", "못생기다", "오래되다"].includes(chosenV[DATA_SCHEMA.Korean]) && !options.tense) {
						tense = "past";
					}
					const isAct = chosenV[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB;
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
						predType: isAct ? K.ACTION : "descriptive",
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
			if (lastNoun && lastNoun[DATA_SCHEMA.PartofSpeech] === K.NOUN) {
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
	if (pos === K.ACTION_VERB) {
		buildRes = buildASTForActionVerb(targetUnit, variationIndex, options);
	} else if (pos === K.DESCRIPTIVE_VERB) {
		buildRes = buildASTForDescriptiveVerb(targetUnit, variationIndex, options);
	} else if (pos === K.NOUN || pos === K.PRONOUN) {
		buildRes = buildASTForNominal(targetUnit, variationIndex, options);
	} else if (pos === K.POS_GRAMMAR) {
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
	let sentenceValidatorModule;
	try {
		sentenceValidatorModule = (typeof require !== 'undefined') ? require('./sentence_validator.js') : (typeof window !== 'undefined' ? window : null);
	} catch (e) {
		sentenceValidatorModule = null;
	}
	if (sentenceValidatorModule && typeof sentenceValidatorModule.validateSentenceAST === 'function') {
		const valRes = sentenceValidatorModule.validateSentenceAST(buildRes.ast, realized);
		if (valRes && !valRes.valid && valRes.errors.length > 0) {
			return {
				ok: false,
				insufficientSet: false,
				missingRoles: [],
				message: `Generated AST failed semantic validation: ${valRes.errors.map(e => e.message).join('; ')}`
			};
		}
	}
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
		const targetIdx = sentences.length;
		const tier = (targetIdx === 0) ? 'easiest' : (count >= 3 && targetIdx === count - 1 ? 'challenging' : 'easy_and_inset');
		const res = generateSentenceForUnit(unitOrId, {
			...options,
			difficultyTier: tier,
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
			res.difficultyTier = tier;
			res.difficultyLabel = (tier === 'easiest' ? 'Easiest' : (tier === 'easy_and_inset' ? 'Easy + In-Set' : 'Challenging'));
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
