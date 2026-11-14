(function() {
// Universal Constants
const { K } = (typeof require !== 'undefined') ? require('../../constants.js') : (typeof window !== 'undefined' ? window : {});

/**
 * korean/concord/argument_concord.js
 *
 * Centralized Argument, Subject, Verb, Adverb, Time, and Container Concordance Engine.
 * Uses data.js SemanticTags and SemanticData (preferred_action_verbs, preferred_descriptive_verbs,
 * venue_allowed_verbs, allows_teeth, collocation_filter) and O(1) Set registries.
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
	parseSemanticData
} = (typeof require !== 'undefined' ? require('../core/primitives.js') : window);

const {
	getVerbParticleType,
	getNounCandidatesForVerb,
	getSubjectCandidatesForDescriptiveVerb,
	filterWordsByTense,
	isElderNoun
} = (typeof require !== 'undefined' ? require('../core/morphology.js') : window);

const {
	canAdverbPrecede
} = (typeof require !== 'undefined' ? require('./adverbial_concord.js') : window);

// ============================================================================
// Concordance Domain Sets (O(1) Membership Lookups)
// ============================================================================
// TODO generate these sets automatically at load time. language units should have semantic data or a semantic tag (or tags) that prompts inclusion in a set like this (though a common way of checking for a set requirement like this in the language unit might make the set obsolete, since the language unit can also be checked at O(1) speed). if there are missing language units, create them.

const NON_SUBJECT_DEICTICS = new Set([
	"누구", "누가", "무엇", "뭐", "어디", "언제", "얼마", "몇",
	"이곳", "그곳", "저곳", "이거", "그거", "저거", "이것", "그것", "저것"
]);

const SUBJECT_PERSONAL_PRONOUNS = new Set(["나", "저", "우리", "저희", "그", "그녀"]);
const COLLOQUIAL_NON_SUBJECT_PERSONS = new Set(["얘들", "놈", "녀석"]);

const NON_AGENT_PERSON_WORDS = new Set([
	"사람", "나이", "이름", "성함", "연세", "생일", "생신", "고향", "주소", "전화번호", "번호",
	"취미", "전공", "성별", "국적", "키", "몸무게", "얼굴", "마음", "성격", "버릇", "습관",
	"목소리", "눈물", "땀", "피", "꿈", "생각", "기분", "감정", "말씀", "진지", "댁", "병환", "약주"
]);

const NO_DIRECT_OBJECT_VERBS = new Set(["말씀하다", "끓다", "식다", "터지다", "들어있다"]);
const PLACEMENT_VERBS = new Set(["놓다", "올려놓다", "두다", "담다", "넣다"]);
const ORIGIN_MOTION_VERBS = new Set(["출발하다", "나가다", "나오다", "출국하다", "떠나다"]);
const STATIC_POSTURE_VERBS = new Set(["눕다", "앉다", "살다"]);
const DYNAMIC_ACTIVITY_MOTION_VERBS = new Set(["달리다", "걷다", "뛰다", "산책하다", "조깅하다", "수영하다", "등산하다"]);
const PATH_MOTION_NOUNS = new Set(["길", "거리", "횡단보도", "다리", "공원", "학교"]);
const DEPARTURE_ORIGIN_NOUNS = new Set(["공항", "인천공항", "김포공항", "한국", "미국", "일본", "중국", "서울"]);
const BROAD_WORLD_REGIONS = new Set(["서양", "동양", "세계"]);
const STATIC_REST_PLACES = new Set(["침대", "방", "집", "소파", "의자"]);
const RESIDENTIAL_LIVING_PLACES = new Set(["집", "아파트", "기숙사", "하숙집", "원룸", "한국", "서울", "부산", "제주도", "미국", "일본", "중국", "고향", "시골", "도시", "동네"]);
const SEATING_SURFACE_PLACES = new Set(["의자", "자리", "소파", "벤치", "바닥"]);
const LYING_SURFACE_PLACES = new Set(["침대", "소파", "바닥", "방"]);
const DAILY_ROUTINE_POSTURE_VERBS = new Set(["샤워하다", "세수하다", "목욕하다", "닦다", "자다", "일어나다", "앉다", "눕다"]);
const DAILY_DEICTIC_TIME_WORDS = new Set(["아침", "오전", "오후", "저녁", "밤", "오늘", "어제", "내일", "매일", "날마다", "일찍"]);
const MEDIA_WORK_NOUNS = new Set(["액션영화", "코미디 영화", "영화", "드라마", "프로그램"]);
const MOVING_RESIDENCE_PLACES = new Set(["집", "원룸", "아파트", "기숙사", "하숙집", "방", "서울", "부산", "대구", "인천", "한국", "고향", "동네"]);
const ATTENDANCE_VENUES = new Set(["학교", "수업", "학원", "모임", "회의", "대학교"]);
const RUNNING_VENUES = new Set(["공원", "한강공원", "운동장", "길", "거리", "산", "바다"]);

const SOLID_COOKING_VERBS = new Set(["삶다", "굽다", "볶다", "튀기다", "다지다", "썰다"]);
const SOLID_COOKING_NOUNS = new Set(["고기", "생선", "채소", "라면", "돼지고기", "소고기", "닭고기", "달걀", "감자", "양파"]);
const NON_SOLID_COOKING_NOUNS = new Set(["물", "주스", "콜라", "사이다", "커피", "차", "술", "맥주", "우유", "뷔페", "식당", "설렁탕", "미역국", "된장찌개", "김치찌개"]);
const BOILABLE_NOUNS = new Set(["물", "라면", "찌개", "국", "탕", "차", "보리차", "설렁탕", "미역국", "된장찌개", "김치찌개"]);
const DRINKABLE_NOUNS = new Set(["물", "주스", "콜라", "사이다", "커피", "차", "술", "맥주", "우유"]);
const FRAGILE_BREAKABLE_NOUNS = new Set(["유리", "거울", "접시", "컵", "그릇", "달걀", "잠"]);
const QUITTABLE_NOUNS = new Set(["일", "직장", "회사", "공부", "운동", "아르바이트", "담배", "술"]);

const GENERAL_TRANSITIVE_FALLBACK_KOREAN = new Set([
	"사다", "보다", "찾다", "기다리다", "준비하다", "바꾸다",
	"사용하다", "이용하다", "배우다", "기억하다", "좋아하다", "원하다", "고르다"
]);

const GENERAL_EVALUATIVE_FALLBACK_KOREAN = new Set([
	"좋다", "많다", "괜찮다", "필요하다", "중요하다", "유명하다",
	"편하다", "어렵다", "쉽다", "비싸다", "싸다", "크다", "작다"
]);

const POSSESSION_CALQUE_VERBS = new Set(["가지다", "사다", "구매하다", "주문하다", "선물하다", "만들다", "빌리다", "얻다", "줍다"]);
const SOUP_STEW_NOUNS = new Set(["설렁탕", "미역국", "된장찌개", "김치찌개"]);
const SOUP_STEW_ACTION_VERBS = new Set(["먹다", "끓이다", "데우다", "주문하다", "좋아하다", "맛보다"]);
const DRINK_ACTION_VERBS = new Set(["마시다", "사다", "주문하다", "따르다", "좋아하다"]);
const LANGUAGE_ACTION_VERBS = new Set(["공부하다", "배우다", "가르치다", "잘하다", "연습하다", "알다", "모르다", "좋아하다"]);
const TRANSITIVE_PLACE_VERBS = new Set(["방문하다", "찾다", "청소하다", "구경하다"]);
const BODY_CARE_ACTION_VERBS = new Set(["닦다", "씻다", "치료하다", "보다", "만지다"]);
const COMMERCIAL_TRANSACTION_VERBS = new Set(["사다", "팔다", "바꾸다", "주문하다", "이용하다", "사용하다"]);
const NON_COMMODITY_NOUNS = new Set([
	"잠", "휴대", "길이", "소화", "기온", "기분", "마음", "성격",
	"손", "코", "얼굴", "허리", "강남스타일", "주차 금지", "경치", "생활", "대화", "태권도", "반", "제목"
]);

const FIRST_PERSON_SUBJECT_PRONOUNS = new Set(["저", "나", "우리", "저희"]);
const PRICING_ELIGIBLE_NOUNS = new Set(["물건", "선물", "음식", "옷", "표", "가방", "모자", "신발", "시계", "자동차"]);
const RELATIONAL_OR_FORMULAIC_DVS = new Set(["안녕하다", "싶다", "결과 다르다", "같다", "비슷하다", "다르다", "어울리다", "오랜만이다", "친하다"]);
const RESTRICTED_NON_TARGET_DVS = new Set(["정숙하다", "웬만하다", "울퉁불퉁하다", "따사롭다", "야하다", "고맙다", "감사하다", "미안하다", "죄송하다", "낫다", "싫다"]);
const INTERROGATIVE_DVS = new Set(["어떻다", "어떠하다"]);
const INTERPERSONAL_ATTITUDE_DVS = new Set(["감사하다", "죄송하다", "미안하다", "고맙다"]);
const SUBJECTIVE_EXPERIENCER_DVS = new Set([
	"즐겁다", "기쁘다", "슬프다", "부럽다", "그립다", "부끄럽다", "외롭다", "불안하다",
	"무섭다", "힘들다", "졸리다", "창피하다", "심심하다", "행복하다", "섭섭하다", "피곤하다"
]);
const NON_PERSON_ATTRIBUTE_DVS = new Set([
	"울퉁불퉁하다", "매끄럽다", "비싸다", "싸다", "맑다", "흐리다",
	"따뜻하다", "시원하다", "춥다", "덥다", "적다", "야하다", "빠르다"
]);
const PRICING_DVS = new Set(["비싸다", "싸다"]);
const SMALL_STATIONERY_NOUNS = new Set(["거울", "필통", "지우개", "볼펜", "연필", "휴지", "가위", "자"]);
const ERGONOMIC_INTEREST_DVS = new Set(["편하다", "불편하다", "재미없다", "재미있다", "간단하다"]);
const TICKET_CREDENTIAL_NOUNS = new Set(["기차표", "표", "명함", "엽서", "우표", "카드", "신분증", "학생증", "여권"]);
const SIZE_THICKNESS_DVS = new Set(["작다", "크다", "얇다", "두껍다"]);
const PHYSICAL_DIMENSION_DVS = new Set(["작다", "크다", "얇다", "두껍다", "무겁다", "가볍다", "길다", "짧다"]);
const AGE_COMPATIBLE_DVS = new Set(["많다", "적다", "어리다"]);
const RESULTATIVE_PAST_DVS = new Set(["잘생기다", "못생기다", "오래되다"]);
const SOUP_STEW_DVS = new Set(["맛있다", "뜨겁다", "따뜻하다", "싱겁다", "짜다", "얼큰하다"]);
const RULE_PROHIBITION_DVS = new Set(["필요하다", "중요하다", "엄격하다", "있다", "없다"]);
const LANGUAGE_DVS = new Set(["어렵다", "쉽다", "재미있다", "중요하다", "좋다", "필요하다"]);
const BODY_PART_DVS = new Set(["아프다", "시리다", "좋다", "튼튼하다", "괜찮다", "하얗다"]);
const NON_PHYSICAL_ATTR_NOUNS = new Set(["나이", "게임", "날씨", "생활"]);
const HUMAN_APPEARANCE_DVS = new Set(["날씬하다", "뚱뚱하다", "잘생기다", "못생기다", "마르다", "정숙하다", "웬만하다"]);
const WEATHER_TEMPERATURE_DVS = new Set(["맑다", "흐리다", "쌀쌀하다", "화창하다", "무덥다", "춥다", "덥다", "따뜻하다", "시원하다"]);
const CONCRETE_PHYSICAL_DVS = new Set([
	"크다", "작다", "넓다", "좁다", "길다", "짧다", "높다", "낮다",
	"있다", "없다", "오래되다", "필요하다", "비싸다", "싸다", "무겁다", "가볍다", "편하다", "불편하다"
]);

const BULKY_OR_MEDIUM_OBJECTS = new Set([
	"컴퓨터", "텔레비전", "책상", "의자", "소파", "침대", "가방", "신발", "구두", "운동화",
	"옷", "코트", "바지", "치마", "책", "공책", "우산", "옷걸이", "거울", "칠판"
]);
const FOOD_OR_DRINK_ITEMS = new Set(["우유", "물", "음료", "주스", "김치", "고기", "과일", "달걀", "음식", "사과", "빵", "반찬"]);
const PUT_IN_CONTAINERS = new Set(["가방", "주머니", "상자", "냉장고", "서랍", "봉투", "지갑"]);
const TINY_CONTAINERS = new Set(["봉투", "주머니", "지갑", "필통", "컵", "그릇"]);
const FALLBACK_CONTAINERS = new Set(["가방", "상자", "서랍"]);

const PLURAL_SUBJECT_WORDS = new Set(["우리", "저희", "가족", "친구들", "학생들", "사람들", "아이들", "부모님"]);
const EXCLUDED_TIME_ADVERBS = new Set(["아직", "벌써", "이미", "언제", "금방", "이제", "방금", "아까", "새로", "드디어", "미리", "오래"]);
const DAILY_HABIT_ADVERBS = new Set(["날마다", "매일"]);

// ============================================================================
// Core Selection & Concordance Functions
// ============================================================================

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
		filtered = filtered.filter(u => !hasTag(u, "modifier_root", K.BOUND_NOUN) && u[DATA_SCHEMA.Korean] !== "데" && !u[DATA_SCHEMA.Korean].endsWith("적"));
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

function selectSubjectUnit(options = {}, targetId = null, preferElder = false) {
	const nouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
		n => !hasTag(n, K.MEASUREWORD) && !hasTag(n, K.COUNTER) && !hasTag(n, K.POSITION) && !hasTag(n, "possessive") && !(parseSemanticData(n).en && parseSemanticData(n).en.possOnly) && n[DATA_SCHEMA.Korean] !== "이" && !NON_SUBJECT_DEICTICS.has(n[DATA_SCHEMA.Korean])
	);
	const pronouns = getAllUnitsOfPos(K.PRONOUN, options, targetId).filter(
		p => SUBJECT_PERSONAL_PRONOUNS.has(p[DATA_SCHEMA.Korean])
	);

	if (preferElder) {
		const elders = nouns.filter(
			n => isElderNoun(n) && !NON_AGENT_PERSON_WORDS.has(n[DATA_SCHEMA.Korean])
		);
		if (elders.length > 0) return pickRandom(elders);
		const respectNouns = nouns.filter(n => (hasTag(n, K.PROFESSION, "job", "status") || n[DATA_SCHEMA.Korean].endsWith("님")) && !NON_AGENT_PERSON_WORDS.has(n[DATA_SCHEMA.Korean]));
		if (respectNouns.length > 0) return pickRandom(respectNouns);
	}

	const personNouns = nouns.filter(
		n => hasTag(n, K.PERSON, K.FAMILY, K.PROFESSION, "subject_animate")
			&& !hasTag(n, "body_part", "body", K.ABSTRACT, K.PLACE, K.TIME, K.CLOTHING, K.FOOD, "illness", "symptom", K.TRAVEL, K.EVENT, K.ACTIVITY, K.OBJECT, "building", K.FACILITY, "institution", "language", K.COUNTRY, "name", K.INFORMAL)
			&& !(hasTag(n, "colloquial") && parseSemanticData(n).polarity === -1)
			&& !COLLOQUIAL_NON_SUBJECT_PERSONS.has(n[DATA_SCHEMA.Korean])
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
		K.INTRANSITIVE_MOTION,
		K.INTRANSITIVE_PLACE,
		"intransitive_state",
		"intransitive_food",
		"intransitive_person",
		"passive",
		K.WEATHER,
		K.LOCATIVE_STATIC,
		"posture",
		K.HEALTH
	)) return true;
	const sd = parseSemanticData(verbUnit);
	if (sd.type === K.INTRANSITIVE || sd.req === K.SUBJECT) return true;
	return false;
}

function selectArgumentForActionVerb(verbUnit, options = {}, targetId = null) {
	if (!verbUnit) return { nounUnit: null, role: null, particleType: null };
	const verbKo = verbUnit[DATA_SCHEMA.Korean] || "";
	if (verbKo.includes(" ")) {
		return { nounUnit: null, role: null, particleType: null };
	}

	const sd = parseSemanticData(verbUnit);
	const syntaxFrame = String(verbUnit[DATA_SCHEMA.SyntaxFrame] || "");
	const frameRequiresSubject = /이\/가/.test(syntaxFrame) ||
		(sd.type === K.INTRANSITIVE && sd.req && sd.req !== K.PERSON && sd.req !== "any") ||
		sd.req === K.SUBJECT;

	if (frameRequiresSubject || NO_DIRECT_OBJECT_VERBS.has(verbKo)) {
		return { nounUnit: null, role: null, particleType: null };
	}

	const isTransPlacement = PLACEMENT_VERBS.has(verbKo) || hasTag(verbUnit, "placement_transitive", K.TRANSITIVE_GENERAL, "transitive_place");
	const isPathMotion = sd.req === "path" || verbKo === "지나가다";
	const isLocativeOrigin = hasTag(verbUnit, K.LOCATIVE_ORIGIN) || ORIGIN_MOTION_VERBS.has(verbKo);
	const isLocativeStatic = !isLocativeOrigin && !isTransPlacement && (hasTag(verbUnit, K.LOCATIVE_STATIC, "posture") || STATIC_POSTURE_VERBS.has(verbKo));
	const isLocativeMotion = !isLocativeOrigin && !isPathMotion && !isTransPlacement && hasTag(verbUnit, K.INTRANSITIVE_MOTION, K.INTRANSITIVE_PLACE, K.LOCATIVE_GOAL);
	const isPureIntransitive = isIntransitiveVerb(verbUnit);

	if (isPathMotion) {
		const pathNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n =>
			PATH_MOTION_NOUNS.has(n[DATA_SCHEMA.Korean])
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
				DEPARTURE_ORIGIN_NOUNS.has(n[DATA_SCHEMA.Korean]) || hasTag(n, K.COUNTRY, "airport")
			);
		} else {
			originPlaces = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n =>
				hasTag(n, K.PLACE, K.LOCATION, K.FACILITY, K.COUNTRY, "city") && !hasTag(n, K.MEASUREWORD, K.POSITION) && !BROAD_WORLD_REGIONS.has(n[DATA_SCHEMA.Korean])
			);
		}
		if (originPlaces.length > 0) {
			return { nounUnit: pickRandom(originPlaces), role: K.LOCATION, particleType: "location_dynamic" };
		}
		return { nounUnit: null, role: null, particleType: null };
	}

	if (isLocativeStatic) {
		let places;
		if (verbKo === "살다") { // TODO could there be a function in a language unit's semantic data for a function like this, to generate paired nouns? that could eliminate a lot of logic in this file, and would bring functionality and data closer together.
			places = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n =>
				RESIDENTIAL_LIVING_PLACES.has(n[DATA_SCHEMA.Korean])
				|| (hasTag(n, "housing", "residence", "city", K.COUNTRY) && n[DATA_SCHEMA.Korean] !== "곳" && n[DATA_SCHEMA.Korean] !== "회사" && !BROAD_WORLD_REGIONS.has(n[DATA_SCHEMA.Korean]))
			);
		} else if (verbKo === "앉다") {
			places = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n =>
				SEATING_SURFACE_PLACES.has(n[DATA_SCHEMA.Korean])
			);
		} else if (verbKo === "눕다") {
			places = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n =>
				LYING_SURFACE_PLACES.has(n[DATA_SCHEMA.Korean])
			);
		} else {
			places = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n =>
				hasTag(n, K.PLACE, K.LOCATION, K.FACILITY, "furniture") || STATIC_REST_PLACES.has(n[DATA_SCHEMA.Korean])
			);
		}
		if (places.length > 0) {
			return { nounUnit: pickRandom(places), role: K.LOCATION, particleType: "location_static" };
		}
		return { nounUnit: null, role: null, particleType: null };
	}

	if (isLocativeMotion) {
		const isDynamicActivityMotion = DYNAMIC_ACTIVITY_MOTION_VERBS.has(verbKo);
		let places;
		if (verbKo === "이사하다") {
			places = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n =>
				hasTag(n, "housing", "residence", "city", K.COUNTRY) || MOVING_RESIDENCE_PLACES.has(n[DATA_SCHEMA.Korean])
			);
		} else if (verbKo === "결석하다") {
			places = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n =>
				ATTENDANCE_VENUES.has(n[DATA_SCHEMA.Korean])
			);
		} else if (verbKo === "달리다") {
			places = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n =>
				RUNNING_VENUES.has(n[DATA_SCHEMA.Korean])
			);
		} else {
			places = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => hasTag(n, K.PLACE, K.LOCATION, "institution", K.FACILITY));
		}
		if (places.length > 0) {
			return { nounUnit: pickRandom(places), role: K.LOCATION, particleType: isDynamicActivityMotion ? "location_dynamic" : "location_static" };
		}
		return { nounUnit: null, role: null, particleType: null };
	}

	if (isPureIntransitive) {
		return { nounUnit: null, role: null, particleType: null };
	}

	const particleType = getVerbParticleType(verbUnit);

	let candidates = [];
	if (SOLID_COOKING_VERBS.has(verbKo) && !sd.collocation_filter) {
		candidates = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => (hasTag(n, "meat", "fish", "vegetable", "solid_food", "ingredient", K.FOOD) || SOLID_COOKING_NOUNS.has(n[DATA_SCHEMA.Korean])) &&
			!hasTag(n, K.DRINK, "liquid", "beverage", "soup", "stew", K.PLACE, K.FACILITY, "restaurant") &&
			!NON_SOLID_COOKING_NOUNS.has(n[DATA_SCHEMA.Korean])
		);
	} else if (verbKo === "끓이다") {
		candidates = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => BOILABLE_NOUNS.has(n[DATA_SCHEMA.Korean]) || hasTag(n, "soup", "stew", "boilable_liquid")
		);
	} else if ((verbKo === "마시다" || (sd && sd.req === "liquid")) && !sd.collocation_filter) {
		candidates = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => !hasTag(n, K.MEASUREWORD, K.COUNTER, K.SPORTS, "waterSports", K.ACTIVITY) && (
				hasTag(n, K.DRINK, "beverage")
				|| parseSemanticData(n).domain === K.DRINK
				|| (DRINKABLE_NOUNS.has(n[DATA_SCHEMA.Korean])
					&& !hasTag(n, K.TRANSPORTATION, K.VEHICLE) && parseSemanticData(n).domain !== K.TRANSPORTATION)
			)
		);
	} else if (verbKo === "깨다" || verbKo === "깨뜨리다") {
		candidates = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => FRAGILE_BREAKABLE_NOUNS.has(n[DATA_SCHEMA.Korean]) || hasTag(n, "fragile", "dish", "glasswear")
		);
	} else if (verbKo === "그만두다") {
		candidates = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => QUITTABLE_NOUNS.has(n[DATA_SCHEMA.Korean]) || hasTag(n, "job", "work", "habit", "study")
		);
	} else if (hasTag(verbUnit, "cooking") && !sd.collocation_filter) {
		candidates = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => hasTag(n, K.FOOD, "ingredient", "meat", "vegetable") && !hasTag(n, K.DRINK, "liquid", K.PLACE, K.FACILITY)
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
		!hasTag(n, "name", K.QUESTION_WORD, K.INTERROGATIVE)
		&& !NON_SUBJECT_DEICTICS.has(n[DATA_SCHEMA.Korean])
		&& !(hasTag(n, "colloquial") && parseSemanticData(n).polarity === -1)
	);
	if (filteredClean.length > 0) {
		candidates = filteredClean;
	}
	const verbAllowsTeeth = Boolean((sd && sd.allows_teeth) || hasTag(verbUnit, "teeth"));
	if (!verbAllowsTeeth) {
		const nonDental = candidates.filter(n => n[DATA_SCHEMA.Id] !== 361 && n[DATA_SCHEMA.Korean] !== "이");
		if (nonDental.length > 0) candidates = nonDental;
	}
	if (verbKo === "매다") {
		const nonJewelry = candidates.filter(n => !hasTag(n, "jewelry") && n[DATA_SCHEMA.Korean] !== "목걸이");
		if (nonJewelry.length > 0) candidates = nonJewelry;
	}
	const isHumbleVerb = verbKo.includes("드리") || verbKo === "여쭤보다" || verbKo === "여쭙다" || (state.HUMBLE_VERBS && state.HUMBLE_VERBS.has(verbKo)) || (state.HUMBLE_DATIVE_VERBS && state.HUMBLE_DATIVE_VERBS.has(verbKo));
	if (particleType === K.DATIVE && isHumbleVerb) {
		const elders = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => isElderNoun(n) && hasTag(n, K.PERSON, K.FAMILY, K.PROFESSION, "kinship_elder", "elder", K.ELDER_NOUN, "honorific_person")
		);
		if (elders.length > 0) candidates = elders;
	} else if (particleType === K.DATIVE && !isHumbleVerb) {
		const animateNonElders = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => hasTag(n, K.PERSON, K.FAMILY, K.PROFESSION)
				&& !isElderNoun(n)
				&& !NON_AGENT_PERSON_WORDS.has(n[DATA_SCHEMA.Korean])
				&& !COLLOQUIAL_NON_SUBJECT_PERSONS.has(n[DATA_SCHEMA.Korean])
		);
		if (animateNonElders.length > 0) {
			candidates = animateNonElders;
		} else {
			const nonElders = candidates.filter(n => !isElderNoun(n));
			if (nonElders.length > 0) candidates = nonElders;
		}
	}
	const isStrictArgVerb = Boolean(sd && (sd.collocation_filter || (sd.req && sd.req !== K.OBJECT && sd.req !== "any")));
	if (candidates.length === 0 && options.onlyFromSet && !isStrictArgVerb) {
		candidates = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => !hasTag(n, K.MEASUREWORD) && !hasTag(n, K.COUNTER) && !hasTag(n, K.TIME)
		);
	}
	if (candidates.length === 0) return { nounUnit: null, role: null, particleType: null };

	const chosen = pickRandom(candidates);
	const role = particleType === K.DATIVE ? K.RECIPIENT
		: (particleType === K.LOCATION || particleType === "location_static") ? K.LOCATION
		: (particleType === K.DIRECTION || particleType === "direction_ro") ? K.DIRECTION
		: particleType === K.SUBJECT ? K.SUBJECT
		: K.OBJECT;
	return { nounUnit: chosen, role, particleType };
}

function selectActionVerbForNoun(nounUnit, options = {}, targetId = null) {
	const allAVs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(
		av => !(options.excludePossessionCalque && POSSESSION_CALQUE_VERBS.has(av[DATA_SCHEMA.Korean]))
	);
	if (allAVs.length === 0) return null;
	const nounKo = nounUnit[DATA_SCHEMA.Korean] || "";
	const nounSd = parseSemanticData(nounUnit);

	if (nounSd && Array.isArray(nounSd.preferred_action_verbs) && nounSd.preferred_action_verbs.length > 0) {
		const prefSet = new Set(nounSd.preferred_action_verbs);
		const prefAVs = allAVs.filter(av => prefSet.has(av[DATA_SCHEMA.Korean]));
		if (prefAVs.length > 0) return pickRandom(prefAVs);
	}

	if (hasTag(nounUnit, "teeth") || nounKo === "이") {
		const teethAVs = allAVs.filter(av => Boolean(parseSemanticData(av).allows_teeth) && av[DATA_SCHEMA.Korean] !== "갈다");
		if (teethAVs.length > 0) return pickRandom(teethAVs);
	}

	if (hasTag(nounUnit, "soup", "stew") || SOUP_STEW_NOUNS.has(nounKo)) {
		const soupAVs = allAVs.filter(av => SOUP_STEW_ACTION_VERBS.has(av[DATA_SCHEMA.Korean]));
		if (soupAVs.length > 0) return pickRandom(soupAVs);
	}

	if (!hasTag(nounUnit, K.MEASUREWORD, K.COUNTER)
		&& !hasTag(nounUnit, K.TRANSPORTATION, K.VEHICLE)
		&& nounSd.domain !== K.TRANSPORTATION
		&& (hasTag(nounUnit, K.DRINK, "liquid", "beverage") || DRINKABLE_NOUNS.has(nounKo))) {
		const drinkAVs = allAVs.filter(av => DRINK_ACTION_VERBS.has(av[DATA_SCHEMA.Korean]));
		if (drinkAVs.length > 0) return pickRandom(drinkAVs);
	}

	if (hasTag(nounUnit, "language")) {
		const langAVs = allAVs.filter(av => LANGUAGE_ACTION_VERBS.has(av[DATA_SCHEMA.Korean]));
		if (langAVs.length > 0) return pickRandom(langAVs);
	}

	const isNonCommodity = hasTag(nounUnit,
		K.ABSTRACT, K.HEALTH, "dimension_metric", "bodily_process", "meteorological_metric",
		"psychological_state", "physiological_state", "cultural_concept", "verbal_property",
		"bodyPart", K.EMOTION, "personality", K.CONCEPT, "rule", K.PROHIBITION, "signage",
		"language", K.ACTIVITY, K.COMMUNICATION, "attribute"
	) || NON_COMMODITY_NOUNS.has(nounKo);

	const nounId = nounUnit[DATA_SCHEMA.Id];
	const isMediaWork = MEDIA_WORK_NOUNS.has(nounKo) || hasTag(nounUnit, "movie", "film", "media_work");
	const matchingAVs = allAVs.filter(av => {
		const avKo = av[DATA_SCHEMA.Korean] || "";
		if (avKo.includes(" ")) return false;
		if (avKo === "말씀하다" || state.HONORIFIC_WORDS.has(avKo) || state.HUMBLE_WORDS.has(avKo)) return false;
		if (isMediaWork && avKo === "버리다") return false;
		if (isIntransitiveVerb(av)) return false;
		if (getVerbParticleType(av) !== K.OBJECT) return false;
		const cands = getNounCandidatesForVerb(av);
		return cands.some(c => c[DATA_SCHEMA.Id] === nounId);
	});
	if (matchingAVs.length > 0) return pickRandom(matchingAVs);

	if (hasTag(nounUnit, K.PLACE, K.LOCATION, "institution", K.FACILITY)) {
		const transitivePlaceAVs = allAVs.filter(av => TRANSITIVE_PLACE_VERBS.has(av[DATA_SCHEMA.Korean]));
		if (transitivePlaceAVs.length > 0) return pickRandom(transitivePlaceAVs);
	}

	if (hasTag(nounUnit, "teeth", "bodyPart") || nounSd.domain === "body") {
		const bodyAVs = allAVs.filter(av => BODY_CARE_ACTION_VERBS.has(av[DATA_SCHEMA.Korean]));
		if (bodyAVs.length > 0) return pickRandom(bodyAVs);
	}

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
			generalAVs = generalAVs.filter(av => !COMMERCIAL_TRANSACTION_VERBS.has(av[DATA_SCHEMA.Korean]));
		}
		if (generalAVs.length > 0) return pickRandom(generalAVs);
		return pickRandom(cleanTransitiveAVs);
	}

	const fallbackTransitive = allAVs.filter(v => !isIntransitiveVerb(v) && !(v[DATA_SCHEMA.Korean] || "").includes(" "));
	return pickRandom(fallbackTransitive) || pickRandom(allAVs);
}

function selectDescriptiveVerbForNoun(nounUnit, options = {}, targetId = null) {
	const isElder = isElderNoun(nounUnit);
	const nounKo = nounUnit[DATA_SCHEMA.Korean] || "";
	const nounSd = parseSemanticData(nounUnit);
	const isFirstPersonSubj = FIRST_PERSON_SUBJECT_PRONOUNS.has(nounKo);
	const isPricingEligible = hasTag(nounUnit, "commercial_item", "commodity", "goods", "merchandise", "fee", "currency", K.FOOD, K.CLOTHING, "ticket", K.COMMERCE) ||
		PRICING_ELIGIBLE_NOUNS.has(nounKo);
	const allDVs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId).filter(dv => {
		const ko = dv[DATA_SCHEMA.Korean];
		if (!ko || ko.includes(" ")) return false;
		if (RELATIONAL_OR_FORMULAIC_DVS.has(ko)) return false;
		if (dv[DATA_SCHEMA.Id] !== targetId && RESTRICTED_NON_TARGET_DVS.has(ko)) return false;
		if (hasTag(dv, K.DEMONSTRATIVE, K.QUESTION_WORD, K.INTERROGATIVE, "greeting", K.DISCOURSE) || INTERROGATIVE_DVS.has(ko)) return false;
		if ((nounKo === "우리" || (hasTag(nounUnit, K.PERSON, K.FAMILY) && dv[DATA_SCHEMA.Id] !== targetId)) && ko === "반갑다") return false;
		if (!isFirstPersonSubj && (hasTag(dv, "interpersonal_attitude") || INTERPERSONAL_ATTITUDE_DVS.has(ko))) return false;
		if (hasTag(nounUnit, K.PERSON, K.FAMILY) && !isFirstPersonSubj && SUBJECTIVE_EXPERIENCER_DVS.has(ko)) return false;
		if (hasTag(nounUnit, K.PERSON, K.FAMILY) && NON_PERSON_ATTRIBUTE_DVS.has(ko)) return false;
		if (!isPricingEligible && PRICING_DVS.has(ko)) return false;
		if (SMALL_STATIONERY_NOUNS.has(nounKo) && ERGONOMIC_INTEREST_DVS.has(ko)) return false;
		if (TICKET_CREDENTIAL_NOUNS.has(nounKo) && SIZE_THICKNESS_DVS.has(ko)) return false;
		if ((nounKo === "게임" || MEDIA_WORK_NOUNS.has(nounKo) || hasTag(nounUnit, K.ACTIVITY, "movie", "film", "media_work")) && PHYSICAL_DIMENSION_DVS.has(ko)) return false;
		if (nounKo === "나이" && !AGE_COMPATIBLE_DVS.has(ko)) return false;
		if (options.tense && options.tense !== K.PAST && (hasTag(dv, "resultative_past") || RESULTATIVE_PAST_DVS.has(ko))) return false;
		if (!isElder && state.HONORIFIC_WORDS && state.HONORIFIC_WORDS.has(ko)) return false;
		return true;
	});
	if (allDVs.length === 0) return null;

	if (nounSd && Array.isArray(nounSd.preferred_descriptive_verbs) && nounSd.preferred_descriptive_verbs.length > 0) {
		const prefSet = new Set(nounSd.preferred_descriptive_verbs);
		const prefDVs = allDVs.filter(dv => prefSet.has(dv[DATA_SCHEMA.Korean]));
		if (prefDVs.length > 0) return pickRandom(prefDVs, options.seedOffset, options);
	}

	if (hasTag(nounUnit, "soup", "stew") || SOUP_STEW_NOUNS.has(nounKo)) {
		const soupDVs = allDVs.filter(dv => SOUP_STEW_DVS.has(dv[DATA_SCHEMA.Korean]));
		if (soupDVs.length > 0) return pickRandom(soupDVs, options.seedOffset, options);
	}

	if (nounKo === "주차 금지" || hasTag(nounUnit, K.PROHIBITION, "rule")) {
		const ruleDVs = allDVs.filter(dv => RULE_PROHIBITION_DVS.has(dv[DATA_SCHEMA.Korean]));
		if (ruleDVs.length > 0) return pickRandom(ruleDVs, options.seedOffset, options);
	}

	if (hasTag(nounUnit, "language")) {
		const langDVs = allDVs.filter(dv => LANGUAGE_DVS.has(dv[DATA_SCHEMA.Korean]));
		if (langDVs.length > 0) return pickRandom(langDVs, options.seedOffset, options);
	}

	const nounId = nounUnit[DATA_SCHEMA.Id];
	const matchingDVs = allDVs.filter(dv => {
		const cands = getSubjectCandidatesForDescriptiveVerb(dv);
		return cands.some(c => c[DATA_SCHEMA.Id] === nounId);
	});
	if (matchingDVs.length > 0) return pickRandom(matchingDVs, options.seedOffset, options);

	if (hasTag(nounUnit, "teeth", "bodyPart") || nounSd.domain === "body") {
		const bodyDVs = allDVs.filter(dv => BODY_PART_DVS.has(dv[DATA_SCHEMA.Korean]));
		if (bodyDVs.length > 0) return pickRandom(bodyDVs, options.seedOffset, options);
	}

	const isNonPhysicalAttr = hasTag(nounUnit, "language", K.ABSTRACT, "attribute", K.ACTIVITY, "quantity", "time_amount") || NON_PHYSICAL_ATTR_NOUNS.has(nounKo);
	const cleanDVs = allDVs.filter(dv => {
		const ko = dv[DATA_SCHEMA.Korean];
		if (!ko || ko.includes(" ")) return false;
		if (HUMAN_APPEARANCE_DVS.has(ko)) return false;
		if (WEATHER_TEMPERATURE_DVS.has(ko)) return false;
		if (isNonPhysicalAttr && CONCRETE_PHYSICAL_DVS.has(ko)) return false;
		return true;
	});

	if (cleanDVs.length > 0) {
		const generalDVs = cleanDVs.filter(dv => GENERAL_EVALUATIVE_FALLBACK_KOREAN.has(dv[DATA_SCHEMA.Korean]));
		if (generalDVs.length > 0) return pickRandom(generalDVs, options.seedOffset, options);
		return pickRandom(cleanDVs, options.seedOffset, options);
	}

	return pickRandom(allDVs, options.seedOffset, options);
}

function selectPutInContainerNoun(objectNounUnit, options = {}, targetId = null) {
	const objKo = objectNounUnit ? (objectNounUnit[DATA_SCHEMA.Korean] || "") : "";
	const isBulkyOrMedium = Boolean(objectNounUnit && (
		BULKY_OR_MEDIUM_OBJECTS.has(objKo) ||
		hasTag(objectNounUnit, "furniture", "appliance", K.CLOTHING, "footwear", "luggage")
	));
	const isFoodOrDrink = Boolean(objectNounUnit && (
		hasTag(objectNounUnit, K.FOOD, K.DRINK, "beverage") ||
		FOOD_OR_DRINK_ITEMS.has(objKo)
	));
	let pool = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => {
		const nKo = n[DATA_SCHEMA.Korean] || "";
		if (nKo === "쓰레기통") return false;
		if (hasTag(n, K.FOOD, K.HONORIFIC, "honorific_noun")) return false;
		if (!PUT_IN_CONTAINERS.has(nKo) && !hasTag(n, "container")) return false;
		if (isBulkyOrMedium && TINY_CONTAINERS.has(nKo)) return false;
		if (!isFoodOrDrink && nKo === "냉장고") return false;
		return true;
	});
	if (pool.length === 0) {
		pool = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => FALLBACK_CONTAINERS.has(n[DATA_SCHEMA.Korean]));
	}
	return pickRandom(pool);
}

function isPluralSubjectUnit(subjUnit) {
	if (!subjUnit) return false;
	const sKo = subjUnit[DATA_SCHEMA.Korean] || "";
	return hasTag(subjUnit, "plural") || PLURAL_SUBJECT_WORDS.has(sKo) || sKo.endsWith("들");
}

function selectTimeUnit(tense, options = {}, targetId = null, targetVerbUnit = null) {
	const vKo = targetVerbUnit ? (targetVerbUnit[DATA_SCHEMA.Korean] || "") : "";
	if (vKo === "살다" && tense !== K.PRESENT) return null;
	// TODO should this be a named set near the top of argument_concord.js?
	const excludedTimeNouns = new Set([
		"학기", "날", "때", "번", "월", "년", "한번", "방학중", "학기 중", "계절", "언제", "생신",
		"며칠", "몇 시", "이때", "순서", "차례", "동안", "하루", "이틀", "사흘", "나흘", "닷새",
		"열흘", "기간", "날짜", "일정", "출발", "여유", "적", "말", "전", "후", "처음", "과거",
		"미래", "이전", "종일", "요일", "연초", "연말", "오랜만", "-박 -일", "지난", "올해", "금년",
		"작년", "지난해", "내년", "다음주"
	]);
	if (tense !== K.PRESENT) {
		excludedTimeNouns.add("지금");
		excludedTimeNouns.add("요즘");
		excludedTimeNouns.add("현재");
	}
	const isDailyRoutine = DAILY_ROUTINE_POSTURE_VERBS.has(vKo);
	const timeNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => {
		const nKo = n[DATA_SCHEMA.Korean];
		if (!hasTag(n, K.TIME, "temporal")) return false;
		if (hasTag(n, K.MEASUREWORD, K.COUNTER, K.QUESTION_WORD, K.INTERROGATIVE, K.HONORIFIC, "honorific_noun", K.ABSTRACT, "order", "duration", K.BOUND_NOUN, "schedule", K.CONCEPT, K.EMOTION, "time_modifier", K.DETERMINER)) return false;
		if (excludedTimeNouns.has(nKo)) return false;
		if (vKo === "살다" && nKo !== "요즘" && nKo !== "지금") return false;
		if (isDailyRoutine && !DAILY_DEICTIC_TIME_WORDS.has(nKo)) return false;
		return true;
	});
	const timeAdvs = getAllUnitsOfPos(K.POS_ADVERB, options, targetId).filter(a => {
		if (!hasTag(a, K.TIME, "temporal", "adverb_time")) return false;
		if (hasTag(a, K.QUESTION_WORD, K.INTERROGATIVE)) return false;
		const aKo = a[DATA_SCHEMA.Korean];
		if (EXCLUDED_TIME_ADVERBS.has(aKo)) return false;
		if (tense === K.FUTURE && DAILY_HABIT_ADVERBS.has(aKo)) return false;
		if (vKo === "살다" && aKo !== "요즘" && aKo !== "지금") return false;
		if (isDailyRoutine && !DAILY_DEICTIC_TIME_WORDS.has(aKo)) return false;
		if (targetVerbUnit && typeof canAdverbPrecede === 'function' && !canAdverbPrecede(a, targetVerbUnit, { tense })) return false;
		return true;
	});
	const pool = filterWordsByTense([...timeNouns, ...timeAdvs], tense);
	return pickRandom(pool);
}

function selectAdverbUnit(isDescriptive, polarity, options = {}, targetId = null, targetVerbUnit = null) {
	const advs = getAllUnitsOfPos(K.POS_ADVERB, options, targetId).filter(a => {
		if (a[DATA_SCHEMA.PartofSpeech] !== K.POS_ADVERB) return false;
		const ko = a[DATA_SCHEMA.Korean];
		if (ko === "안" || ko === "못") return false;
		if (polarity !== K.NEGATIVE && state.ALL_NPI_WORDS.has(ko)) return false;
		if (hasTag(a, K.DISCOURSE, "conjunction", K.TIME, "temporal", "concessive", "approximation", "number_unit", K.CONNECTIVE, "greeting", "interjection", "exclamation", "hesitation")) return false;
		if (hasTag(a, K.QUESTION_WORD, K.INTERROGATIVE)) return false;
		if (targetVerbUnit && typeof canAdverbPrecede === 'function' && !canAdverbPrecede(a, targetVerbUnit, { isNegative: polarity === K.NEGATIVE, pluralSubject: options.pluralSubject })) return false;
		if (isDescriptive) {
			if (state.MANNER_ADVERBS.has(ko) || hasTag(a, K.MANNER, K.ADVERB_MANNER)) return false;
			const sv = parseSemanticData(a);
			if (sv && sv.target_pos === K.ACTION_VERB) return false;
			return state.DEGREE_ADVERBS.has(ko) || hasTag(a, K.DEGREE, "adverb_degree", "degree_pure");
		}
		if (hasTag(a, "degree_pure")) return false;
		return state.MANNER_ADVERBS.has(ko) || hasTag(a, K.MANNER, K.ADVERB_MANNER);
	});
	return pickRandom(advs);
}

const argumentConcordExports = {
	pickRandom,
	filterBySet,
	getAllUnitsOfPos,
	selectSubjectUnit,
	isIntransitiveVerb,
	selectArgumentForActionVerb,
	selectActionVerbForNoun,
	selectDescriptiveVerbForNoun,
	selectPutInContainerNoun,
	isPluralSubjectUnit,
	selectTimeUnit,
	selectAdverbUnit,
	NON_SUBJECT_DEICTICS,
	PLACEMENT_VERBS,
	RESULTATIVE_PAST_DVS,
	INTERPERSONAL_ATTITUDE_DVS,
	WEATHER_TEMPERATURE_DVS,
	DAILY_HABIT_ADVERBS
};

if (typeof window !== 'undefined') {
	Object.assign(window, argumentConcordExports);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = argumentConcordExports;
}
})();

