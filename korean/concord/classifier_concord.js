(function() {
// Universal Constants
const { K } = (typeof require !== 'undefined') ? require('../../constants.js') : (typeof window !== 'undefined' ? window : {});

/**
 * Feature 6: Numeral-Classifier Matrix & Attributive Measure Word Syntax
 *
 * Implements:
 * 1. Classifier numeral type identification (Native Korean vs. Sino-Korean).
 * 2. Semantic matching and compatibility between nouns and classifiers.
 * 3. Counting phrase synthesis with numeral attributive reduction (한, 두, 세, 네, 스무).
 * 4. Clock time (시/분) and calendar month phonological reduction (유월, 시월).
 * 5. Counter concordance validation and automatic repair.
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
const { DATA_SCHEMA, hasTag, parseSemanticVector } = (typeof require !== 'undefined' ? require('../core/primitives.js') : window);
const { ERROR_CODES } = (typeof require !== 'undefined' ? require('../constants/error_codes.js') : window);
const { getKoreanNumber, getSinoNumber } = (typeof require !== 'undefined' ? require('../core/numbers.js') : window);
const { getNounUnit, getAllNounUnits, isElderNoun, attachParticle } = (typeof require !== 'undefined' ? require('../core/morphology.js') : window);

function isClassifier(wordOrUnit) {
	if (!wordOrUnit) return false;
	const ko = typeof wordOrUnit === 'string' ? wordOrUnit : (Array.isArray(wordOrUnit) ? wordOrUnit[DATA_SCHEMA.Korean] : "");
	if (ko && (state.KOREAN_CLASSIFIERS.has(ko) || state.SINO_CLASSIFIERS.has(ko))) return true;
	if (typeof wordOrUnit === 'object' && Array.isArray(wordOrUnit)) {
		if (hasTag(wordOrUnit, K.MEASUREWORD, "counter", "koreanMeasureWord", "sinoMeasureWord")) return true;
		const sv = parseSemanticVector(wordOrUnit);
		if (sv && sv.counter === true) return true;
	}
	return false;
}

function getClassifierNumeralType(classifierOrUnit) {
	if (!classifierOrUnit) return null;
	if (typeof classifierOrUnit === 'object' && Array.isArray(classifierOrUnit)) {
		if (hasTag(classifierOrUnit, "koreanMeasureWord")) return "pure";
		if (hasTag(classifierOrUnit, "sinoMeasureWord")) return "sino";
		const sv = parseSemanticVector(classifierOrUnit);
		if (sv && sv.numType) return sv.numType;
	}
	const ko = typeof classifierOrUnit === 'string' ? classifierOrUnit : (Array.isArray(classifierOrUnit) ? classifierOrUnit[DATA_SCHEMA.Korean] : "");
	if (ko && state.KOREAN_CLASSIFIERS.has(ko) && !state.SINO_CLASSIFIERS.has(ko)) return "pure";
	if (ko && state.SINO_CLASSIFIERS.has(ko) && !state.KOREAN_CLASSIFIERS.has(ko)) return "sino";
	if (ko && state.KOREAN_CLASSIFIERS.has(ko)) return "pure";
	if (ko && state.SINO_CLASSIFIERS.has(ko)) return "sino";
	return null;
}

function getMatchingClassifier(nounOrUnit) {
	const unit = typeof nounOrUnit === 'object' && Array.isArray(nounOrUnit) ? nounOrUnit : getNounUnit(nounOrUnit);
	const ko = typeof nounOrUnit === 'string' ? nounOrUnit : (unit ? unit[DATA_SCHEMA.Korean] : "");

	if (unit) {
		const sv = parseSemanticVector(unit);
		if (sv && sv.classifier) return sv.classifier;
		if (sv && sv.counter === true && (state.KOREAN_CLASSIFIERS.has(ko) || state.SINO_CLASSIFIERS.has(ko))) return ko;
	}

	for (const spec of state.CLASSIFIER_NOUN_SPECS) {
		if (spec.generalObject) continue;

		if (spec.honorificPerson) {
			if (isElderNoun(unit, ko) || (unit && hasTag(unit, "elder_noun", "elder", K.HONORIFIC))) {
				return spec.classifier;
			}
			continue;
		}

		if (spec.plainPerson) {
			if (!isElderNoun(unit, ko) && unit && spec.tags.some(t => hasTag(unit, t))) {
				return spec.classifier;
			}
			continue;
		}

		if (unit && spec.tags.some(t => hasTag(unit, t))) {
			return spec.classifier;
		}
	}

	const generalSpec = state.CLASSIFIER_NOUN_SPECS.find(s => s.generalObject);
	if (generalSpec) return generalSpec.classifier;

	return state.CLASSIFIER_NOUN_SPECS.length > 0 ? state.CLASSIFIER_NOUN_SPECS[state.CLASSIFIER_NOUN_SPECS.length - 1].classifier : "";
}

function getMatchingNounsForClassifier(classifierOrUnit) {
	const ko = typeof classifierOrUnit === 'string' ? classifierOrUnit : (classifierOrUnit ? classifierOrUnit[DATA_SCHEMA.Korean] : "");
	const getWords = dataModule.getWords || (typeof window !== 'undefined' ? window.getWords : () => []);
	const allNouns = getWords(K.NOUN).filter(n => !hasTag(n, K.MEASUREWORD) && !hasTag(n, "counter"));
	if (ko === "살" || ko === "세") {
		return allNouns.filter(n => ["아이", "아기", "조카", "동생", "남동생", "여동생", "학생", "친구", "딸", "아들"].includes(n[DATA_SCHEMA.Korean]) || (hasTag(n, "child", "junior") && !hasTag(n, "elder", "elder_noun") && !["어른", "노인", "연세", "나이"].includes(n[DATA_SCHEMA.Korean])));
	}
	if (ko === "대") {
		return allNouns.filter(n => hasTag(n, "vehicle", "electronics", "machine", "appliance") && !hasTag(n, "ticket", K.TRAVEL, K.ACTIVITY));
	}
	if (ko === "채") {
		return allNouns.filter(n => (hasTag(n, "building") || ["집", "하숙집", "빌딩", "건물", "아파트", "단독주택"].includes(n[DATA_SCHEMA.Korean])) && !hasTag(n, "finance", "currency", "money", "expense"));
	}
	if (ko === "호") {
		return allNouns.filter(n => ["교실", "사무실", "호실", "연구실", "회의실", "강의실", "기숙사", "방"].includes(n[DATA_SCHEMA.Korean]) && !["욕실", "베란다", "부엌", "거실", "현관", "마당"].includes(n[DATA_SCHEMA.Korean]));
	}
	if (ko === "학년") {
		return allNouns.filter(n => ["초등학교", "중학교", "고등학교", "대학교", "대학원", "학생"].includes(n[DATA_SCHEMA.Korean]) || (hasTag(n, "school") && !hasTag(n, K.PLACE, K.FACILITY, "room", "hall", K.ACTIVITY, "event") && !["대강당", "강당", "교실", "학원", "오리엔테이션", "숙제", "공부"].includes(n[DATA_SCHEMA.Korean])));
	}
	if (ko === "편") {
		return allNouns.filter(n => ["영화", "드라마", "시", "소설", "비디오"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "media_work", "film", "literature"));
	}
	if (ko === "%") {
		return allNouns.filter(n => ["할인", "이자율", "확률", "비율", "성공률"].includes(n[DATA_SCHEMA.Korean]) || hasTag(n, "rate_proportion", "discount", "finance"));
	}
	if (ko === "개") {
		return allNouns.filter(n => {
			if (hasTag(n, "language", K.ACADEMIC, "academic_fee", "finance", "currency", "currency_resource", "money", K.PLACE, K.FACILITY, "institution", "restaurant", "media_work", "music", "film", "drama", "uncountable", "mass_noun", "liquid", "drink", "soup", "stew", K.ABSTRACT, K.TIME, "temporal", K.PERSON, K.FAMILY, "animal", K.CLOTHING, "garment", K.WEARABLE, "footwear", "vehicle", K.TRANSPORTATION, "appliance", "electronics", "machine", "device", "flower", "book", "reading", "media", "broadcast", K.COMMUNICATION, "utensil", "cutlery", K.ACTIVITY, "entertainment", "event", "sports", "art", K.CONCEPT, "work", "attribute", "document", "ticket", "postal")) return false;
			const nKo = n[DATA_SCHEMA.Korean];
			if (["한국말", "영어", "일본말", "중국말", "프랑스말", "베트남말", "음악", "영화", "드라마", "밥", "국", "찌개", "돈", "뭘", "뭐", "무엇", "이거", "것", "북경반점", "식당", "빵집", "컴퓨터공학", "교육학", "법학", "곡류", "파스타", "신문", "면", "고기", "비옷", "코트", "반바지", "세탁기", "선풍기", "휴대전화", "전화", "지역 번호", "차", "잡지", "장미", "젓가락", "숟가락", "방송", "사진", "공책", "카드", "학생증", "신분증", "여권", "엽서", "명함", "종이", "우표", "표", "기차표", "영화표", "비행기 표", "쓰레기", "포도", "책", "교과서", "사전", "만화책", "노선도", "약도"].includes(nKo)) return false;
			return hasTag(n, K.OBJECT, "item", "stationery", "fruit", "food_ingredient", "tool", "container", "discrete_object") || ["사과", "빵", "핸드백", "냄비", "시계", "선물", "인형", "상자", "지우개", "볼펜", "가방", "우산", "모자", "컵", "달걀", "토마토"].includes(nKo);
		});
	}

	const spec = state.CLASSIFIER_NOUN_SPECS.find(s => s.classifier === ko || (s.unit && s.unit[DATA_SCHEMA.Korean] === ko));

	if (!spec) {
		return allNouns.filter(n => hasTag(n, K.OBJECT) || hasTag(n, "item"));
	}

	let matched = allNouns.filter(n => {
		if (spec.honorificPerson) {
			return isElderNoun(n);
		}
		if (spec.plainPerson) {
			return spec.tags.some(t => hasTag(n, t)) && !isElderNoun(n);
		}
		if (spec.generalObject) {
			if (spec.incompatibleTags && spec.incompatibleTags.some(t => hasTag(n, t))) return false;
			if (isElderNoun(n)) return false;
			return spec.tags.some(t => hasTag(n, t));
		}
		return spec.tags.some(t => hasTag(n, t));
	});

	if (matched.length === 0 && spec.fallbackTag) {
		matched = allNouns.filter(n => hasTag(n, spec.fallbackTag));
	}
	return matched;
}

function getClassifierCandidatesForNoun(nounOrUnit) {
	const unit = typeof nounOrUnit === 'object' && Array.isArray(nounOrUnit) ? nounOrUnit : getNounUnit(nounOrUnit);
	const ko = typeof nounOrUnit === 'string' ? nounOrUnit : (unit ? unit[DATA_SCHEMA.Korean] : "");
	const candidates = new Set();

	const primary = getMatchingClassifier(unit || ko);
	if (primary) candidates.add(primary);

	for (const spec of state.CLASSIFIER_NOUN_SPECS) {
		if (isCompatibleNounAndClassifier(unit || ko, spec.classifier)) {
			candidates.add(spec.classifier);
		}
	}

	return Array.from(candidates);
}

function isCompatibleNounAndClassifier(nounOrUnit, classifierOrUnit) {
	const clsKo = typeof classifierOrUnit === 'string' ? classifierOrUnit : (classifierOrUnit ? classifierOrUnit[DATA_SCHEMA.Korean] : "");
	if (!clsKo) return true;

	const spec = state.CLASSIFIER_NOUN_SPECS.find(s => s.classifier === clsKo || (s.unit && s.unit[DATA_SCHEMA.Korean] === clsKo));
	if (!spec) return true;

	function checkUnitCompat(nounUnit) {
		if (!nounUnit) return false;
		const nounKo = nounUnit[DATA_SCHEMA.Korean] || "";
		const sv = parseSemanticVector(nounUnit);
		if (sv && sv.classifier && sv.classifier === clsKo) return true;

		if (spec.generalObject) {
			if (isElderNoun(nounUnit, nounKo)) return false;
			if (spec.incompatibleTags && spec.incompatibleTags.some(t => hasTag(nounUnit, t))) return false;
			return true;
		}

		if (spec.honorificPerson) {
			return isElderNoun(nounUnit, nounKo) || hasTag(nounUnit, "elder_noun", "elder", K.HONORIFIC);
		}

		if (spec.plainPerson) {
			return spec.tags.some(t => hasTag(nounUnit, t));
		}

		return spec.tags.some(t => hasTag(nounUnit, t));
	}

	if (Array.isArray(nounOrUnit)) {
		return checkUnitCompat(nounOrUnit);
	}

	const nounKo = typeof nounOrUnit === 'string' ? nounOrUnit : "";
	if (!nounKo) return true;

	const matchingUnits = getAllNounUnits(nounKo);
	if (matchingUnits.length > 0) {
		return matchingUnits.some(u => checkUnitCompat(u));
	}

	return spec.generalObject === true;
}

function buildCountingPhrase(nounOrUnit, count = 1, options = {}) {
	const nounUnit = typeof nounOrUnit === 'object' && Array.isArray(nounOrUnit) ? nounOrUnit : getNounUnit(nounOrUnit);
	const nounKo = typeof nounOrUnit === 'string' ? nounOrUnit : (nounUnit ? nounUnit[DATA_SCHEMA.Korean] : "");

	let classifier = options.classifier;
	if (!classifier) {
		classifier = getMatchingClassifier(nounUnit || nounKo);
	}
	const classifierKo = typeof classifier === 'object' && Array.isArray(classifier) ? classifier[DATA_SCHEMA.Korean] : classifier;
	const numType = options.numType || getClassifierNumeralType(classifierKo) || "pure";

	let numStr = "";
	if (numType === "pure") {
		numStr = getKoreanNumber(count, true);
	} else {
		numStr = getSinoNumber(count);
	}

	if (options.prenominal) {
		let base = `${numStr} ${classifierKo}의 ${nounKo}`;
		if (options.particle) {
			base = attachParticle(base, options.particle, options.verb);
		}
		return base;
	}

	let phrase = `${nounKo} ${numStr} ${classifierKo}`;
	if (options.particle) {
		phrase = `${nounKo} ${numStr} ` + attachParticle(classifierKo, options.particle, options.verb, options);
	}
	return phrase;
}

function buildClockTimePhrase(hour, minute = 0) {
	if (hour < 1 || hour > 12) throw new Error(`Clock hour must be 1..12, got ${hour}`);
	const hourStr = `${getKoreanNumber(hour, true)} 시`;
	if (minute === undefined || minute === null || minute === 0) {
		return hourStr;
	}
	if (minute < 0 || minute > 59) throw new Error(`Clock minute must be 0..59, got ${minute}`);
	return `${hourStr} ${getSinoNumber(minute)} 분`;
}

function getMonthName(monthNum) {
	if (monthNum < 1 || monthNum > 12) throw new Error(`Month must be 1..12, got ${monthNum}`);
	if (monthNum === 6) return "유월";
	if (monthNum === 10) return "시월";
	return `${getSinoNumber(monthNum)}월`;
}

function applyCounterConcord(text) {
	if (!text || typeof text !== 'string') return text;
	let s = text;

	const pureCounters = Array.from(state.KOREAN_CLASSIFIERS || []).filter(c => c !== "번" && c !== "분");
	if (pureCounters.length > 0) {
		const counterPattern = pureCounters.join('|');
		const suffix = '((?:[을를이가은는의도]|(?:에게|한테|으로|로|입니다|입니까|이에요|예요|이다|이고|이면))?)(?=[^가-힣]|$)';

		const replaceCardinal = (str, numRegex, targetAttr) => {
			return str.replace(numRegex, (match, p1, num, counter, suf, offset, fullStr) => {
				// Guard: '줄' is a counter (e.g. 김밥 두 줄), but in '둘 줄 알다/모르다',
				// '둘' is the prospective form of verb '두다' (to put) and '줄' is the ability noun.
				if (counter === '줄') {
					const rest = fullStr.slice(offset + match.length);
					if (/^\s*(?:알|압|모르|모릅|몰)/.test(rest)) {
						return match;
					}
				}
				return `${p1}${targetAttr} ${counter}${suf || ''}`;
			});
		};

		s = replaceCardinal(s, new RegExp(`(^|[^가-힣])(하나)\\s+(${counterPattern})${suffix}`, 'g'), '한');
		s = replaceCardinal(s, new RegExp(`(^|[^가-힣])(둘)\\s+(${counterPattern})${suffix}`, 'g'), '두');
		s = replaceCardinal(s, new RegExp(`(^|[^가-힣])(셋)\\s+(${counterPattern})${suffix}`, 'g'), '세');
		s = replaceCardinal(s, new RegExp(`(^|[^가-힣])(넷)\\s+(${counterPattern})${suffix}`, 'g'), '네');
		s = replaceCardinal(s, new RegExp(`(^|[^가-힣])(스물)\\s+(${counterPattern})${suffix}`, 'g'), '스무');

		const tensPrefixes = "열|스물|서른|마흔|쉰|예순|일흔|여든|아흔";
		const replaceTensCardinal = (str, numSuffix, targetAttr) => {
			return str.replace(new RegExp(`(^|[^가-힣])(${tensPrefixes})(${numSuffix})\\s+(${counterPattern})${suffix}`, 'g'), (match, p1, ten, num, counter, suf, offset, fullStr) => {
				if (counter === '줄') {
					const rest = fullStr.slice(offset + match.length);
					if (/^\s*(?:알|압|모르|모릅|몰)/.test(rest)) {
						return match;
					}
				}
				return `${p1}${ten}${targetAttr} ${counter}${suf || ''}`;
			});
		};

		s = replaceTensCardinal(s, '하나', '한');
		s = replaceTensCardinal(s, '둘', '두');
		s = replaceTensCardinal(s, '셋', '세');
		s = replaceTensCardinal(s, '넷', '네');
	}

	s = s.replace(/(^|[^가-힣])육\s*월(?=[^가-힣]|$|[을를이가은는의도]|(?:에|에서|부터|까지|으로|로))/g, '$1유월');
	s = s.replace(/(^|[^가-힣])십\s*월(?=[^가-힣]|$|[을를이가은는의도]|(?:에|에서|부터|까지|으로|로))/g, '$1시월');

	return s;
}

function validateCounterConcord(input, context = {}) {
	const errors = [];
	const errorCodes = [];
	const text = typeof input === 'string' ? input : (input && input.text ? input.text : "");
	if (!text) return { valid: true, errors: [], errorCodes: [] };

	const pureCounters = Array.from(state.KOREAN_CLASSIFIERS || []).filter(c => c !== "번" && c !== "분");
	const sinoCounters = Array.from(state.SINO_CLASSIFIERS || []).filter(c => c !== "번" && c !== "분");
	const counterSuffix = '(?:(?:[을를이가은는의도]|(?:에게|한테|으로|로|입니다|입니까|이에요|예요|이다|이고|이면|에|에서|부터|까지|쯤|전|후))?)(?=[^가-힣]|$)';

	// 1. Cardinal Pure Numbers preceding Pure Counter
	if (pureCounters.length > 0) {
		const cardinalRegex = new RegExp(`(^|[^가-힣])((?:(?:열|스물|서른|마흔|쉰|예순|일흔|여든|아흔)?(?:하나|둘|셋|넷)|스물))\\s+(${pureCounters.join('|')})${counterSuffix}`, 'g');
		let cardMatch;
		while ((cardMatch = cardinalRegex.exec(text)) !== null) {
			if (cardMatch[3] === '줄') {
				const rest = text.slice(cardMatch.index + cardMatch[0].length);
				if (/^\s*(?:알|압|모르|모릅|몰)/.test(rest)) {
					continue; // Not a counter; it's the grammar pattern -(으)ㄹ 줄 알다/모르다 with verb '두다'
				}
			}
			errors.push(`Cardinal pure Korean number '${cardMatch[2]}' used before counter '${cardMatch[3]}'; expected attributive form (한/두/세/네/스무) in: "${text}"`);
			errorCodes.push(ERROR_CODES.NUMERAL_CLASSIFIER_TYPE_MISMATCH);
		}

		// 2. Sino Numbers used with Pure Counters
		const sinoNumerals = "일|이|삼|사|오|육|칠|팔|구|십|십일|십이|십삼|십사|십오|이십";
		const sinoWithPureRegex = new RegExp(`(^|[^가-힣])(${sinoNumerals})\\s+(${pureCounters.join('|')})${counterSuffix}`, 'g');
		let sinoMatch;
		while ((sinoMatch = sinoWithPureRegex.exec(text)) !== null) {
			errors.push(`Sino-Korean numeral '${sinoMatch[2]}' cannot be used with native Korean counter '${sinoMatch[3]}' in: "${text}"`);
			errorCodes.push(ERROR_CODES.NUMERAL_CLASSIFIER_TYPE_MISMATCH);
		}
	}

	// 3. Pure Numbers used with Sino Counters
	if (sinoCounters.length > 0) {
		const pureNumerals = "한|두|세|네|다섯|여섯|일곱|여덟|아홉|열|열한|열두|열세|열네|열다섯|스무|스물한";
		const pureWithSinoRegex = new RegExp(`(^|[^가-힣])(${pureNumerals})\\s+(${sinoCounters.join('|')})${counterSuffix}`, 'g');
		let pureMatch;
		while ((pureMatch = pureWithSinoRegex.exec(text)) !== null) {
			errors.push(`Native Korean numeral '${pureMatch[2]}' cannot be used with Sino-Korean counter '${pureMatch[3]}' in: "${text}"`);
			errorCodes.push(ERROR_CODES.NUMERAL_CLASSIFIER_TYPE_MISMATCH);
		}
	}

	// 4. Pure Clock minutes
	const pureMinNumerals = "하나|둘|셋|넷|한|두|세|네|다섯|여섯|일곱|여덟|아홉|열|열하나|열둘|열셋|열넷|열한|열두|열세|열네|열다섯|스무|스물";
	const pureMinuteRegex = new RegExp(`(^|[^가-힣])(?:시)\\s+(${pureMinNumerals})\\s+분${counterSuffix}`, 'g');
	if (pureMinuteRegex.test(text)) {
		errors.push(`Clock minutes must use Sino-Korean numerals, not native Korean in: "${text}"`);
		errorCodes.push(ERROR_CODES.NUMERAL_CLASSIFIER_TYPE_MISMATCH);
	}

	// 5. Sino Clock hour
	const sinoNumerals = "일|이|삼|사|오|육|칠|팔|구|십|십일|십이";
	const sinoHourRegex = new RegExp(`(^|[^가-힣])(${sinoNumerals})\\s+시${counterSuffix}`, 'g');
	let sinoHourMatch;
	while ((sinoHourMatch = sinoHourRegex.exec(text)) !== null) {
		errors.push(`Clock hours must use native Korean numerals (한 시, 두 시), not Sino numeral '${sinoHourMatch[2]}' in: "${text}"`);
		errorCodes.push(ERROR_CODES.NUMERAL_CLASSIFIER_TYPE_MISMATCH);
	}

	// 6. Month phonological reduction
	if (/(^|[^가-힣])육\s*월(?=[^가-힣]|$|[을를이가은는의도]|(?:에|에서|부터|까지|으로|로))/.test(text)) {
		errors.push(`Month 6 must be phonologically reduced to '유월', not '*육월' in: "${text}"`);
		errorCodes.push(ERROR_CODES.NUMERAL_CLASSIFIER_TYPE_MISMATCH);
	}
	if (/(^|[^가-힣])십\s*월(?=[^가-힣]|$|[을를이가은는의도]|(?:에|에서|부터|까지|으로|로))/.test(text)) {
		errors.push(`Month 10 must be phonologically reduced to '시월', not '*십월' in: "${text}"`);
		errorCodes.push(ERROR_CODES.NUMERAL_CLASSIFIER_TYPE_MISMATCH);
	}

	// 7. Noun-Classifier Category Concord
	const countingPhraseRegex = /([가-힣]+)\s+(?:한|두|세|네|다섯|여섯|일곱|여덟|아홉|열|스무|\d+)\s+([가-힣]+)/g;
	let phraseMatch;
	while ((phraseMatch = countingPhraseRegex.exec(text)) !== null) {
		const nounCandidate = phraseMatch[1];
		const rawCls = phraseMatch[2];
		const clsCandidate = rawCls.replace(/(?:[을를이가은는의도]|(?:에게|한테|으로|로|입니다|입니까|이에요|예요|이다|이고|이면))$/, '');
		if (state.KOREAN_CLASSIFIERS.has(clsCandidate) || state.SINO_CLASSIFIERS.has(clsCandidate)) {
			if (!isCompatibleNounAndClassifier(nounCandidate, clsCandidate)) {
				errors.push(`Noun '${nounCandidate}' is semantically incompatible with classifier '${clsCandidate}' in: "${text}"`);
				errorCodes.push(ERROR_CODES.NOUN_CLASSIFIER_CATEGORY_MISMATCH);
			}
		}
	}

	return {
		valid: errors.length === 0,
		errors,
		errorCodes
	};
}

const classifierExports = {
	isClassifier,
	getClassifierNumeralType,
	getMatchingClassifier,
	getMatchingNounsForClassifier,
	getClassifierCandidatesForNoun,
	isCompatibleNounAndClassifier,
	buildCountingPhrase,
	buildClockTimePhrase,
	getMonthName,
	applyCounterConcord,
	validateCounterConcord
};

if (typeof window !== 'undefined') {
	Object.assign(window, classifierExports);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = classifierExports;
}
})();
