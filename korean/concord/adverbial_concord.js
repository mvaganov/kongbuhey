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
const { DATA_SCHEMA } = (typeof require !== 'undefined' ? require('../core/primitives.js') : window);
const { ERROR_CODES } = (typeof require !== 'undefined' ? require('../constants/error_codes.js') : window);
const { isDescriptiveVerb, isActionVerb } = (typeof require !== 'undefined' ? require('../core/morphology.js') : window);

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

	if (advKo === "거의" && (isPureDV || isDescriptiveVerb(verbOrKo)) && !options.isNegative && !["없다", "모르다", "비슷하다", "같다"].includes(vKo)) {
		return false;
	}
	if ((advKo === "특히" || advKo === "특별히") && ["춥다", "덥다", "따뜻하다", "시원하다", "쌀쌀하다", "흐리다", "맑다", "있다", "없다", "시끄럽다", "조용하다", "복잡하다", "고맙다", "감사하다", "미안하다", "죄송하다", "서명하다", "출발하다", "도착하다", "피곤하다", "아프다", "바쁘다", "한가하다", "졸리다"].includes(vKo)) {
		return false;
	}
	if ((advKo === "좀" || advKo === "조금" || advKo === "꽤" || advKo === "점점" || advKo === "특별히" || advKo === "특히") && ["감사하다", "고맙다", "미안하다", "죄송하다"].includes(vKo)) {
		return false;
	}
	if (advKo === "꽤" && (options.isNegative || options.negated || isNegativePredicate(vKo))) {
		return false;
	}
	if (["모두", "다"].includes(advKo)) {
		if (options.pluralSubject === false) return false;
		if (["고맙다", "감사하다", "미안하다", "죄송하다", "반갑다", "아름답다", "예쁘다", "복잡하다", "시끄럽다", "조용하다", "나쁘다", "적다", "맑다", "흐리다", "덥다", "춥다"].includes(vKo)) {
			return false;
		}
	}
	if (advKo === "제일" && ["고맙다", "감사하다", "미안하다", "죄송하다", "반갑다", "아름답다", "예쁘다", "피곤하다", "졸리다", "배고프다", "목마르다"].includes(vKo)) {
		return false;
	}
	if (advKo === "조금" && ["아름답다", "고맙다", "감사하다", "반갑다"].includes(vKo)) {
		return false;
	}
	if (advKo === "멀리" && !["가다", "오다", "다니다", "가깝다", "멀다", "살다", "이사하다", "여행하다", "보이다", "보다", "들리다", "던지다", "떠나다", "출발하다", "뛰다", "걷다", "운전하다"].includes(vKo)) {
		return false;
	}
	if (["매달", "매년", "매주"].includes(advKo) && !["가다", "오다", "다니다", "하다", "공부하다", "일하다", "운동하다", "여행하다", "청소하다", "만나다", "전화하다", "보내다", "내다", "받다", "읽다", "쓰다", "사다", "먹다", "모으다", "쉬다"].includes(vKo)) {
		return false;
	}
	if (advKo === "아직" && !options.isNegative && !isNegativePredicate(vKo) && !["있다", "남다", "어리다", "모르다", "멀다", "부족하다", "많다", "적다", "크다", "작다", "남아있다", "살다", "일하다"].includes(vKo)) {
		return false;
	}
	if (advKo === "완전" && ["외롭다", "불안하다", "슬프다", "기쁘다", "부끄럽다", "어렵다", "오래되다", "감사하다", "고맙다", "미안하다", "죄송하다", "유명하다", "중요하다", "편리하다", "불편하다", "빠르다", "느리다", "늦다", "크다", "작다", "높다", "낮다", "비싸다", "싸다", "많다", "적다", "같다", "비슷하다", "행복하다", "즐겁다", "만족하다", "우울하다", "반갑다", "복잡하다", "아름답다", "조용하다", "시끄럽다", "따뜻하다", "춥다", "덥다", "시원하다", "아프다", "피곤하다", "바쁘다", "한가하다", "친절하다"].includes(vKo)) {
		return false;
	}
	if (advKo === "새로" && !["만들다", "시작하다", "사다", "구매하다", "주문하다", "배우다", "이사하다", "열다", "쓰다", "짓다", "정하다", "결정하다", "바꾸다", "고치다", "준비하다", "구하다", "나오다", "생기다", "들어가다", "입학하다", "출발하다", "가다", "오다"].includes(vKo)) {
		return false;
	}
	if (advKo === "자세히" && !["보다", "읽다", "듣다", "설명하다", "말하다", "알아보다", "조사하다", "알려주다", "적다", "쓰다", "살펴보다", "이야기하다", "묻다", "물어보다"].includes(vKo)) {
		return false;
	}
	if (advKo === "천천히" && ["받다", "주다", "얻다", "찾다", "만나다", "사다", "팔다", "켜다", "끄다", "열다", "닫다", "찍다", "시작하다", "끝나다", "도착하다", "출발하다", "떠나다", "죽다", "태어나다", "잃어버리다", "잊어버리다"].includes(vKo)) {
		return false;
	}
	if (advKo === "푹" && !["자다", "쉬다", "주무시다", "삶다", "끓이다", "익히다", "잠들다"].includes(vKo)) {
		return false;
	}
	if (advKo === "금방" && (options.tense === "past" || ["일하다", "아르바이트하다", "운전하다", "노래하다", "공부하다", "수영하다", "여행하다", "생활하다", "기다리다"].includes(vKo))) {
		return false;
	}
	if (advKo === "오래" && !options.isNegative && !isNegativePredicate(vKo) && ["마시다", "먹다", "식사하다", "사다", "팔다", "주다", "받다", "넣다", "꺼내다", "버리다", "켜다", "끄다", "열다", "닫다", "찍다", "부치다", "출발하다", "도착하다", "일어나다", "타다", "내리다", "입다", "벗다", "신다", "씻다", "자르다", "서명하다"].includes(vKo)) {
		return false;
	}
	if (advKo === "가끔" && ["그만두다", "결혼하다", "졸업하다", "입학하다", "태어나다", "죽다", "끝나다", "시작되다", "가보다", "전화가 오다"].includes(vKo)) {
		return false;
	}
	if ((advKo === "방금" || advKo === "아까") && options.tense && options.tense !== "past") {
		return false;
	}
	const isInchoativeVerb = options.inchoative || vKo.endsWith("아지다") || vKo.endsWith("어지다") || vKo.endsWith("해지다") || ["늘다", "줄다", "나아지다", "좋아지다", "나빠지다", "변하다", "커지다", "작아지다", "올라가다", "내려가다", "익숙해지다", "어려워지다", "쉬워지다", "자라다"].includes(vKo);
	if (advKo === "점점" && !isInchoativeVerb) {
		return false;
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

			if (targetWord.startsWith("알았")) {
				return `${p1}${npi} ${targetWord.replace(/^알았/, "몰랐")}`;
			}
			if (targetWord.startsWith("알아")) {
				return `${p1}${npi} ${targetWord.replace(/^알아/, "몰라")}`;
			}
			if (targetWord.startsWith("압니")) {
				return `${p1}${npi} ${targetWord.replace(/^압니/, "모릅니")}`;
			}
			if (targetWord.startsWith("알다")) {
				return `${p1}${npi} ${targetWord.replace(/^알다/, "모르다")}`;
			}
			if (targetWord.startsWith("알고")) {
				return `${p1}${npi} ${targetWord.replace(/^알고/, "모르고")}`;
			}
			if (targetWord.startsWith("알면")) {
				return `${p1}${npi} ${targetWord.replace(/^알면/, "모르면")}`;
			}

			if (targetWord.startsWith("있었")) {
				return `${p1}${npi} ${targetWord.replace(/^있었/, "없었")}`;
			}
			if (targetWord.startsWith("있어")) {
				return `${p1}${npi} ${targetWord.replace(/^있어/, "없어")}`;
			}
			if (targetWord.startsWith("있습니")) {
				return `${p1}${npi} ${targetWord.replace(/^있습니/, "없습니")}`;
			}
			if (targetWord.startsWith("있다")) {
				return `${p1}${npi} ${targetWord.replace(/^있다/, "없다")}`;
			}
			if (targetWord.startsWith("있고")) {
				return `${p1}${npi} ${targetWord.replace(/^있고/, "없고")}`;
			}
			if (targetWord.startsWith("있으면")) {
				return `${p1}${npi} ${targetWord.replace(/^있으면/, "없으면")}`;
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
