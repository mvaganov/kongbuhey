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
	getMatchingNounsForClassifier,
	canAdverbPrecede,
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
	selectAdverbUnit
} = (typeof require !== 'undefined' ? require('../concord/index.js') : window);

const {
	getGrammarRegistry,
	resolveParticleUnit,
	resolveEndingUnit,
	makeSegment,
	splitNounAndParticleSegments,
	splitSingleVerbWordSegments,
	realizeKoreanFromAST
} = (typeof require !== 'undefined' ? require('./sentence_ast.js') : window);

/**
 * Builds a SentenceAST for an Action Verb unit.
 */
function buildASTForActionVerb(verbUnit, variationIndex = 0, options = {}) {
	const targetId = verbUnit[DATA_SCHEMA.Id];
	const rawVerbKo = verbUnit[DATA_SCHEMA.Korean] || "";
	const isHonVerb = state.HONORIFIC_WORDS.has(rawVerbKo);
	const tenses = rawVerbKo === "알다" ? [K.PRESENT, K.PRESENT, K.PAST] : [K.PRESENT, K.PAST, K.FUTURE];
	const tense = options.tense || tenses[variationIndex % tenses.length];
	const politeness = options.politeness || (variationIndex === 2 ? K.FORMAL_HIGH : "polite");

	const arg = selectArgumentForActionVerb(verbUnit, options, targetId);
	const isNominativeSubjectVerb = arg.role === K.SUBJECT;
	const verbKo = verbUnit[DATA_SCHEMA.Korean] || "";
	const isInvoluntary = hasTag(verbUnit, "involuntary", "passive", "symptom", K.WEATHER, "state", "existential") || ["끝나다", "시작되다", "고장 나다", "죽다", "생기다", "열리다", "닫히다", "끓다", "식다", "터지다", "말씀하다", "들어있다"].some(k => verbKo.includes(k));
	const modality = (variationIndex === 1 && !isHonVerb && !isNominativeSubjectVerb && !isInvoluntary && !options.onlyFromSet) ? "desire" : null;

	let subjUnit = null;
	if (verbKo === "끓다") {
		const liquids = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (new Set(["물", "라면", "찌개", "국", "탕", "보리차"])).has(n[DATA_SCHEMA.Korean]) || hasTag(n, "liquid", "soup", "stew"));
		subjUnit = pickRandom(liquids) || null;
	} else if (verbKo === "식다") {
		const hotItems = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => !hasTag(n, K.MEASUREWORD, K.COUNTER)
				&& !hasTag(n, K.TRANSPORTATION, K.VEHICLE)
				&& parseSemanticData(n).domain !== K.TRANSPORTATION
				&& ((new Set(["밥", "국", "찌개", "커피", "차", "피자", "음식"])).has(n[DATA_SCHEMA.Korean]) || hasTag(n, K.FOOD, K.DRINK))
		);
		subjUnit = pickRandom(hotItems) || null;
	} else if (verbKo === "터지다") {
		const inflatables = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (new Set(["풍선", "타이어"])).has(n[DATA_SCHEMA.Korean]) || hasTag(n, K.OBJECT));
		subjUnit = pickRandom(inflatables) || null;
	} else if (verbKo === "말씀하다") {
		subjUnit = selectSubjectUnit(options, targetId, true);
	} else if (verbKo === "들어있다") {
		subjUnit = null;
	} else {
		subjUnit = isNominativeSubjectVerb ? null : selectSubjectUnit(options, targetId, isHonVerb);
		if (subjUnit && (new Set(["할인하다", "팔다", "배달하다"])).has(verbKo) && (new Set(["아랫사람", "윗사람", "노인", "어른", "아이", "얘들", "사나이", "놈"])).has(subjUnit[DATA_SCHEMA.Korean])) {
			const merchantPool = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (new Set(["가게", "마트", "백화점", "식당", "카페", "회사원", "종업원", "사장님", "선배", "친구"])).has(n[DATA_SCHEMA.Korean]));
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

	if (subjUnit && arg.nounUnit && (new Set(["치마", "원피스"])).has(arg.nounUnit[DATA_SCHEMA.Korean]) && (new Set(["오빠", "형", "남동생", "아버지", "아빠", "할아버지", "작은아버지", "큰아버지", "삼촌", "아저씨", "남자", "사나이"])).has(subjUnit[DATA_SCHEMA.Korean])) {
		const femaleOrNeutralSubjs = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (new Set(["언니", "누나", "여동생", "어머니", "엄마", "친구", "여자", "학생", "선생님"])).has(n[DATA_SCHEMA.Korean]));
		const femalePronoun = getAllUnitsOfPos(K.PRONOUN, options, targetId).find(p => p[DATA_SCHEMA.Korean] === "저");
		const replacement = pickRandom(femaleOrNeutralSubjs) || femalePronoun;
		if (replacement) subjUnit = replacement;
	}

	const constituents = [];
	if (subjUnit && (!arg.nounUnit || subjUnit[DATA_SCHEMA.Id] !== arg.nounUnit[DATA_SCHEMA.Id])) {
		constituents.push({
			role: variationIndex % 2 === 0 ? K.TOPIC : K.SUBJECT,
			nounUnit: subjUnit,
			particleType: variationIndex % 2 === 0 ? K.TOPIC : K.SUBJECT
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
		const furnitureOrPlace = pickRandom(getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (new Set(["책상", "탁자", "식탁", "의자", "바닥", "침대"])).has(n[DATA_SCHEMA.Korean]) || hasTag(n, "furniture", K.PLACE)));
		const smallObj = pickRandom(getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (new Set(["책", "가방", "모자", "휴대전화", "컵", "그릇", "열쇠"])).has(n[DATA_SCHEMA.Korean]) || hasTag(n, K.OBJECT)));
		if (furnitureOrPlace && smallObj) {
			constituents.push({
				role: K.LOCATION,
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
		const container = pickRandom(getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (new Set(["접시", "그릇", "상자", "가방", "냉장고", "바구니"])).has(n[DATA_SCHEMA.Korean]) || hasTag(n, "container", "dish")));
		if (container) {
			constituents.push({
				role: K.LOCATION,
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
				role: K.LOCATION,
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
		const container = pickRandom(getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (new Set(["가방", "상자", "주머니", "지갑", "방"])).has(n[DATA_SCHEMA.Korean]) || hasTag(n, "container")));
		const content = pickRandom(getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (new Set(["책", "돈", "지갑", "열쇠", "편지"])).has(n[DATA_SCHEMA.Korean]) || hasTag(n, K.OBJECT)));
		if (container && content) {
			constituents.push({
				role: K.LOCATION,
				nounUnit: container,
				particleType: "location_static"
			});
			constituents.push({
				role: K.SUBJECT,
				nounUnit: content,
				particleType: K.SUBJECT
			});
		}
	} else if ((new Set(["결석하다", "출석하다", "입학하다"])).has(verbKo)) {
		const instNoun = pickRandom(getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (new Set(["수업", "학교", "대학교", "학원", "회의", "모임"])).has(n[DATA_SCHEMA.Korean])));
		if (instNoun) {
			constituents.push({
				role: K.LOCATION,
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
			const subjMatter = pickRandom(getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (new Set(["한국어", "영어", "일본어", "중국어", "수학", "음악", "태권도", "요리", "한국말"])).has(n[DATA_SCHEMA.Korean])));
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
		const advUnit = selectAdverbUnit(false, K.AFFIRMATIVE, { ...options, pluralSubject: isPluralSubjectUnit(subjUnit) }, targetId, verbUnit);
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
			speechAct: K.DECLARATIVE,
			politeness,
			tense: modality === "desire" ? K.PRESENT : tense,
			polarity: K.AFFIRMATIVE,
			modality,
			honorific: isHonVerb || (subjUnit ? isElderNoun(subjUnit) : false),
			clauses: [{
				constituents,
				predicate: {
					role: K.PREDICATE,
					predType: K.ACTION,
					verbUnit,
					tense: modality === "desire" ? K.PRESENT : tense,
					politeness,
					speechAct: K.DECLARATIVE,
					polarity: K.AFFIRMATIVE,
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
	const tenses = [K.PRESENT, K.PAST, K.PRESENT];
	let tense = options.tense || tenses[variationIndex % tenses.length];
	if ((new Set(["잘생기다", "못생기다", "오래되다"])).has(dvKo) && !options.tense) tense = K.PAST;
	const politeness = options.politeness || (variationIndex === 2 ? K.FORMAL_HIGH : "polite");

	// Greeting formula 안녕하다 (Unit 5) -> strictly polite formulaic greeting frame
	if (dvKo === "안녕하다" || targetId === 5) {
		const elderNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => isElderNoun(n)
				&& !hasTag(n, "attribute", "honorific_noun", K.CONCEPT)
				&& (!hasTag(n, K.PROFESSION) || (n[DATA_SCHEMA.Korean] || "").endsWith("님"))
				&& !(new Set(["부장", "교수", "과장", "사장", "선배"])).has(n[DATA_SCHEMA.Korean])
		);
		const addressee = (variationIndex % 2 === 1 && elderNouns.length > 0) ? pickRandom(elderNouns) : null;
		const constituents = [];
		if (addressee) {
			constituents.push({
				role: K.TOPIC,
				nounUnit: addressee,
				particleType: K.TOPIC
			});
		}
		return {
			ok: true,
			ast: {
				type: "Sentence",
				targetUnitId: targetId,
				speechAct: K.INTERROGATIVE,
				politeness: variationIndex === 2 ? K.FORMAL_HIGH : "polite",
				tense: K.PRESENT,
				polarity: K.AFFIRMATIVE,
				clauses: [{
					constituents,
					predicate: {
						role: K.PREDICATE,
						predType: K.DESCRIPTIVE,
						verbUnit: dvUnit,
						tense: K.PRESENT,
						politeness: variationIndex === 2 ? K.FORMAL_HIGH : "polite",
						speechAct: K.INTERROGATIVE,
						polarity: K.AFFIRMATIVE,
						honorific: true
					}
				}]
			}
		};
	}

	// Copula 이다 (Unit 55) -> requires complement noun and animacy-matched subject
	if (dvKo === "이다" || targetId === 55) {
		const allNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => !hasTag(n, K.MEASUREWORD, K.COUNTER, K.POSITION, "name")
				&& !(hasTag(n, "colloquial") && parseSemanticData(n).polarity === -1)
				&& n[DATA_SCHEMA.Korean] !== "이"
		);
		const complementCandidates = allNouns.filter(n => hasTag(n, K.PROFESSION, "job", "status", "role", "nationality", K.OBJECT, K.FOOD, "animal", "fruit"));
		const complementNoun = (complementCandidates.length > 0 ? pickRandom(complementCandidates) : pickRandom(allNouns));
		const isHumanComp = complementNoun && hasTag(complementNoun, K.PERSON, K.PROFESSION, "job", "status", "role", "nationality");

		let subjUnit = null;
		if (isHumanComp) {
			const humanPronouns = getAllUnitsOfPos(K.PRONOUN, options, targetId).filter(p => (new Set(["저", "나", "우리"])).has(p[DATA_SCHEMA.Korean]));
			subjUnit = pickRandom(humanPronouns) || selectSubjectUnit(options, targetId, false);
		} else {
			const thingPronouns = getAllUnitsOfPos(K.PRONOUN, options, targetId).filter(p => (new Set(["이것", "그것", "저것", "이거", "그거", "저거"])).has(p[DATA_SCHEMA.Korean]));
			subjUnit = pickRandom(thingPronouns);
		}
		if (subjUnit && complementNoun && subjUnit[DATA_SCHEMA.Id] === complementNoun[DATA_SCHEMA.Id]) {
			subjUnit = null;
		}

		const constituents = [];
		if (subjUnit) {
			constituents.push({
				role: K.TOPIC,
				nounUnit: subjUnit,
				particleType: K.TOPIC
			});
		}

		return {
			ok: true,
			ast: {
				type: "Sentence",
				targetUnitId: targetId,
				speechAct: K.DECLARATIVE,
				politeness,
				tense,
				polarity: K.AFFIRMATIVE,
				clauses: [{
					constituents,
					predicate: {
						role: K.PREDICATE,
						predType: K.COPULA,
						verbUnit: dvUnit,
						copulaNounUnit: complementNoun,
						tense,
						politeness,
						speechAct: K.DECLARATIVE,
						polarity: K.AFFIRMATIVE
					}
				}]
			}
		};
	}

	let subjUnit = null;
	if ((new Set(["감사하다", "죄송하다", "미안하다", "고맙다"])).has(dvKo)) {
		const allowedPros = (new Set(["죄송하다", "감사하다"])).has(dvKo) ? ["저", "저희"] : ["저", "우리", "저희"];
		const speakerPronouns = getAllUnitsOfPos(K.PRONOUN, options, targetId).filter(
			p => allowedPros.includes(p[DATA_SCHEMA.Korean])
		);
		if ((variationIndex % 2 === 0 || (new Set(["죄송하다", "감사하다"])).has(dvKo)) && speakerPronouns.length > 0) {
			subjUnit = pickRandom(speakerPronouns);
		}
	} else {
		let subjCandidates = filterBySet(getSubjectCandidatesForDescriptiveVerb(dvUnit), options, targetId);
		if ((new Set(["피곤하다", "섭섭하다", "졸리다", "배고프다", "목마르다"])).has(dvKo)) {
			const firstPersonPronouns = getAllUnitsOfPos(K.PRONOUN, options, targetId).filter(
				p => (new Set(["저", "나", "우리", "저희"])).has(p[DATA_SCHEMA.Korean])
			);
			if (firstPersonPronouns.length > 0) subjCandidates = firstPersonPronouns;
		}
		if (!(new Set(["아프다", "시리다", "좋다", "튼튼하다"])).has(dvKo) && !hasTag(dvUnit, "teeth")) {
			subjCandidates = subjCandidates.filter(u => u[DATA_SCHEMA.Korean] !== "이");
		}
		const dvSd = parseSemanticData(dvUnit);
		const isStrictDV = Boolean(dvSd && (dvSd.collocation_filter || (dvSd.req && dvSd.req !== "any")));
		if (subjCandidates.length === 0 && options.onlyFromSet && !isStrictDV) {
			subjCandidates = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
				n => !hasTag(n, K.MEASUREWORD) && !hasTag(n, K.COUNTER)
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
			role: variationIndex === 1 ? K.TOPIC : K.SUBJECT,
			nounUnit: subjUnit,
			particleType: variationIndex === 1 ? K.TOPIC : K.SUBJECT
		});
	}

	if (variationIndex > 0 && !(new Set(["있다", "없다"])).has(dvKo)) {
		const isPluralSubj = isPluralSubjectUnit(subjUnit);
		const degAdv = selectAdverbUnit(true, K.AFFIRMATIVE, { ...options, pluralSubject: isPluralSubj }, targetId, dvUnit);
		if (degAdv && !(subjUnit && isElderNoun(subjUnit) && degAdv[DATA_SCHEMA.Korean] === "완전") && (typeof canAdverbPrecede !== 'function' || canAdverbPrecede(degAdv, dvUnit, { isNegative: false, pluralSubject: isPluralSubj }))) {
			constituents.push({
				role: K.ADVERB,
				unit: degAdv,
				particleType: null
			});
		}
	} else if ((new Set(["있다", "없다"])).has(dvKo) && variationIndex % 2 === 1) {
		const placeNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => hasTag(n, K.PLACE, K.LOCATION, K.ROOM) && !hasTag(n, K.MEASUREWORD, K.COUNTER, K.POSITION)
		);
		const place = pickRandom(placeNouns);
		if (place) {
			constituents.unshift({
				role: K.LOCATION,
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
			speechAct: K.DECLARATIVE,
			politeness,
			tense,
			polarity: K.AFFIRMATIVE,
			clauses: [{
				constituents,
				predicate: {
					role: K.PREDICATE,
					predType: K.DESCRIPTIVE,
					verbUnit: dvUnit,
					tense,
					politeness,
					speechAct: K.DECLARATIVE,
					polarity: K.AFFIRMATIVE
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
	const politeness = options.politeness || (variationIndex === 2 ? K.FORMAL_HIGH : "polite");
	const tenses = [K.PRESENT, K.PAST, K.FUTURE];
	let tense = options.tense || tenses[variationIndex % tenses.length];

	// 0.5. Possessive Pronoun (제, 내, or tags: possessive) -> Attributive modifier before head noun
	if (hasTag(nominalUnit, "possessive") || ko === "제" || (ko === "내" && hasTag(nominalUnit, "pronoun_1st", "possessive"))) {
		const allNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => n[DATA_SCHEMA.PartofSpeech] === K.NOUN &&
			!(hasTag(n, "colloquial") && parseSemanticData(n).polarity === -1) &&
			!hasTag(n, K.MEASUREWORD, K.COUNTER, K.TIME, K.POSITION, K.QUESTION_WORD, K.PROPER_NOUN, K.NATURE, K.WEATHER, "station", "symptom", "bodily_process", "language", K.DISEASE, "landmark", "tourism", "transitFacility", "pronoun") &&
			!(new Set(["이", "얼마", "누구", "무엇", "뭐", "어디", "언제", "몇", "너희", "하늘", "바다", "소화", "기온", "프랑스말", "한국말", "영어", "일본어", "중국어", "비", "눈", "바람", "태풍", "서양", "동양", "한국", "점"])).has(n[DATA_SCHEMA.Korean]) &&
			(
				(new Set(["집", "방", "학교", "회사", "고향", "나라", "교실", "사무실", "이름", "전화번호", "이메일", "주소", "직업", "취미", "전공", "생일", "생각", "마음", "기분", "계획", "약속", "시간", "돈"])).has(n[DATA_SCHEMA.Korean]) ||
				(
					hasTag(n, K.PERSON, K.FAMILY, K.OBJECT, K.CLOTHING, K.WEARABLE, "furniture", K.ROOM, "bag", "stationery", "electronics") &&
					!hasTag(n, K.PLACE, K.FACILITY, "restaurant", "store", "company", "region", K.ABSTRACT, K.CONCEPT, K.ACADEMIC)
				)
			)
		);
		const headNoun = pickRandom(allNouns);
		const isAction = variationIndex % 2 === 1;
		const chosenVerb = isAction
			? (headNoun ? selectActionVerbForNoun(headNoun, { ...options, excludePossessionCalque: true }, targetId) : null)
			: (headNoun ? selectDescriptiveVerbForNoun(headNoun, { ...options, tense }, targetId) : null);
		if (chosenVerb && (new Set(["잘생기다", "못생기다", "오래되다"])).has(chosenVerb[DATA_SCHEMA.Korean]) && !options.tense) {
			tense = K.PAST;
		}
		if (headNoun && chosenVerb) {
			const isActionVerb = chosenVerb[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB;
			return {
				ok: true,
				ast: {
					type: "Sentence",
					targetUnitId: targetId,
					speechAct: K.DECLARATIVE,
					politeness,
					tense,
					polarity: K.AFFIRMATIVE,
					clauses: [{
						constituents: [{
							role: isActionVerb ? K.OBJECT : K.SUBJECT,
							determinerUnit: nominalUnit,
							nounUnit: headNoun,
							particleType: isActionVerb ? K.OBJECT : K.SUBJECT
						}],
						predicate: {
							role: K.PREDICATE,
							predType: isActionVerb ? K.ACTION : K.DESCRIPTIVE,
							verbUnit: chosenVerb,
							tense,
							politeness,
							speechAct: K.DECLARATIVE,
							polarity: K.AFFIRMATIVE
						}
					}]
				}
			};
		}
	}

	// 1. Classifier / Measure Word Noun (e.g. 개, 명, 마리, 잔, 권, 번, 살, 시)
	if (hasTag(nominalUnit, K.MEASUREWORD, K.COUNTER) || state.CLASSIFIER_UNITS.has(ko)) {
		if (ko === "번") {
			const freqCount = (variationIndex % 3) + 2;
			const freqNumUnit = getAllUnitsOfPos(K.NUMBER, options, targetId).find(u => u[DATA_SCHEMA.Korean] === getKoreanNumber(freqCount, true)) || null;
			const freqVerbs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(v => (new Set(["보다", "읽다", "만나다", "가다", "먹다"])).has(v[DATA_SCHEMA.Korean]));
			const freqVerb = pickRandom(freqVerbs) || pickRandom(getAllUnitsOfPos(K.ACTION_VERB, options, targetId));
			const freqObj = freqVerb ? selectArgumentForActionVerb(freqVerb, options, targetId) : { nounUnit: null, role: null, particleType: null };
			const freqSubj = selectSubjectUnit(options, targetId, false);
			if (freqVerb && (freqObj.nounUnit || freqSubj)) {
				const freqConstituents = [];
				if (freqSubj && (!freqObj.nounUnit || freqSubj[DATA_SCHEMA.Id] !== freqObj.nounUnit[DATA_SCHEMA.Id])) {
					freqConstituents.push({ role: K.TOPIC, nounUnit: freqSubj, particleType: K.TOPIC });
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
						speechAct: K.DECLARATIVE,
						politeness,
						tense: variationIndex % 2 === 0 ? K.PAST : K.PRESENT,
						polarity: K.AFFIRMATIVE,
						clauses: [{
							constituents: freqConstituents,
							predicate: {
								role: K.PREDICATE,
								predType: K.ACTION,
								verbUnit: freqVerb,
								tense: variationIndex % 2 === 0 ? K.PAST : K.PRESENT,
								politeness,
								speechAct: K.DECLARATIVE,
								polarity: K.AFFIRMATIVE
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
			compatibleNouns = allN.filter(n => (new Set(["책", "교과서", "잡지", "신문", "사전", "만화책"])).has(n[DATA_SCHEMA.Korean]));
		} else if (compatibleNouns.length === 0) {
			const allN = getAllUnitsOfPos(K.NOUN, options, targetId);
			if (ko === "권") {
				compatibleNouns = allN.filter(n => (new Set(["책", "잡지", "공책", "사전"])).has(n[DATA_SCHEMA.Korean]) || hasTag(n, "book", "publication"));
			} else if (ko === "명" || ko === "분") {
				compatibleNouns = allN.filter(n => hasTag(n, K.PERSON, "human", K.FAMILY, K.PROFESSION, "job"));
			} else if (ko === "마리") {
				compatibleNouns = allN.filter(n => hasTag(n, "animal", "pet", "fish", "bird"));
			} else if (ko === "잔" || ko === "병") {
				compatibleNouns = allN.filter(n => hasTag(n, K.DRINK, "beverage", "liquid") && !hasTag(n, K.MEASUREWORD, K.COUNTER));
			} else if (ko === "대") {
				compatibleNouns = allN.filter(n => hasTag(n, K.VEHICLE, "electronics", "machine", "appliance") && !hasTag(n, "ticket", K.TRAVEL, K.ACTIVITY));
			} else if (ko === "벌") {
				compatibleNouns = allN.filter(n => hasTag(n, K.CLOTHING, "clothes"));
			} else if (ko === "켤레") {
				compatibleNouns = allN.filter(n => hasTag(n, "footwear", "shoes"));
			} else if (ko === "살" || ko === "세") {
				compatibleNouns = allN.filter(n => (new Set(["아이", "아기", "학생", "동생", "조카", "친구"])).has(n[DATA_SCHEMA.Korean]) || hasTag(n, "child", "junior"));
			} else if (ko === "채") {
				compatibleNouns = allN.filter(n => (new Set(["집", "하숙집", "빌딩", "건물", "아파트"])).has(n[DATA_SCHEMA.Korean]) || hasTag(n, "building", "housing"));
			} else if (ko === "호") {
				compatibleNouns = allN.filter(n => (new Set(["방", "교실", "사무실", "호실"])).has(n[DATA_SCHEMA.Korean]) || hasTag(n, K.ROOM, "office"));
			} else if (ko === "학년") {
				compatibleNouns = allN.filter(n => (new Set(["초등학교", "중학교", "고등학교", "대학교", "대학원", "학생"])).has(n[DATA_SCHEMA.Korean]) || (hasTag(n, "school") && !hasTag(n, K.PLACE, K.FACILITY, K.ROOM, "hall") && !(new Set(["대강당", "강당", "교실", "학원"])).has(n[DATA_SCHEMA.Korean])));
			} else if (ko === "편") {
				compatibleNouns = allN.filter(n => (new Set(["영화", "드라마", "시", "소설", "비디오"])).has(n[DATA_SCHEMA.Korean]) || hasTag(n, "media_work", "film", "literature"));
			} else if (ko === "%") {
				compatibleNouns = allN.filter(n => (new Set(["할인", "이자율", "확률", "비율", "성공률"])).has(n[DATA_SCHEMA.Korean]) || hasTag(n, "rate_proportion", "discount", K.FINANCE));
			}
			if (compatibleNouns.length === 0) {
				compatibleNouns = allN.filter(
					n => n[DATA_SCHEMA.Id] !== targetId && !hasTag(n, K.MEASUREWORD, K.COUNTER, K.TIME, K.PLACE, K.POSITION)
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
				speechAct: K.DECLARATIVE,
				politeness,
				tense: K.PRESENT,
				polarity: K.AFFIRMATIVE,
				honorific: false,
				clauses: [{
					honorific: false,
					constituents: [{
						role: isAction ? K.OBJECT : K.SUBJECT,
						nounUnit: itemNoun,
						numberUnit: matchedNumUnit,
						numberSurfaceKo: numStr,
						countValue: countVal,
						counterUnit: nominalUnit,
						particleType: isAction ? K.OBJECT : K.SUBJECT
					}],
					predicate: {
						role: K.PREDICATE,
						predType: isAction ? K.ACTION : K.DESCRIPTIVE,
						verbUnit: existVerb,
						tense: K.PRESENT,
						politeness,
						speechAct: K.DECLARATIVE,
						polarity: K.AFFIRMATIVE,
						honorific: false
					}
				}]
			}
		};
	}

	// 1.4. Quantity Noun 반 ("half")
	if (ko === "반" && hasTag(nominalUnit, "time_amount", "quantity")) {
		const subjUnit = selectSubjectUnit(options, targetId, false);
		const portionPool = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (new Set(["사과", "케이크", "피자", "빵", "우유", "책", "숙제", "물"])).has(n[DATA_SCHEMA.Korean]));
		const portionObj = pickRandom(portionPool);
		const verbChoices = portionObj && (new Set(["책", "숙제"])).has(portionObj[DATA_SCHEMA.Korean])
			? (portionObj[DATA_SCHEMA.Korean] === "책" ? ["읽다", "보다"] : ["끝내다", "하다"])
			: (portionObj && (new Set(["우유", "물"])).has(portionObj[DATA_SCHEMA.Korean]) ? ["마시다", "남기다"] : ["먹다", "사다", "남기다"]);
		const actionVerb = pickRandom(getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(v => verbChoices.includes(v[DATA_SCHEMA.Korean]))) || selectActionVerbForNoun(portionObj || nominalUnit, options, targetId);
		if (subjUnit && portionObj && actionVerb && !options.onlyFromSet) {
			return {
				ok: true,
				ast: {
					type: "Sentence",
					targetUnitId: targetId,
					speechAct: K.DECLARATIVE,
					politeness,
					tense,
					polarity: K.AFFIRMATIVE,
					clauses: [{
						constituents: [
							{ role: K.TOPIC, nounUnit: subjUnit, particleType: K.TOPIC },
							{ role: "modifier", nounUnit: portionObj, particleType: null },
							{ role: K.OBJECT, nounUnit: nominalUnit, particleType: K.OBJECT }
						],
						predicate: {
							role: K.PREDICATE,
							predType: K.ACTION,
							verbUnit: actionVerb,
							tense,
							politeness,
							speechAct: K.DECLARATIVE,
							polarity: K.AFFIRMATIVE
						}
					}]
				}
			};
		}
	}

	// 1.5. Bound Noun 데 (Unit 2025)
	if (ko === "데" || (hasTag(nominalUnit, K.BOUND_NOUN) && ko === "데")) {
		const actionVerbs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(v => (new Set(["가다", "살다", "쉬다", "만나다", "공부하다"])).has(v[DATA_SCHEMA.Korean]));
		const descriptiveVerbs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId).filter(v => (new Set(["좋다", "조용하다", "깨끗하다", "편하다", "따뜻하다"])).has(v[DATA_SCHEMA.Korean]));
		const modVerb = (variationIndex % 2 === 0 ? pickRandom(descriptiveVerbs) : pickRandom(actionVerbs)) || pickRandom(descriptiveVerbs);
		const modStem = modVerb ? getConjugatedStem(modVerb[DATA_SCHEMA.Korean], modVerb[DATA_SCHEMA.Conjugation]) : "좋";
		const modEnding = (modVerb && modVerb[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB) ? "는" : "으/ㄴ";
		const modKo = resolvePureMorphology(modStem + modEnding, state);
		const subjUnit = selectSubjectUnit(options, targetId, false);
		const mainVerb = pickRandom(getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(v => (new Set(["찾다", "가다", "좋아하다", "원하다", "알아보다"])).has(v[DATA_SCHEMA.Korean]))) || pickRandom(getAllUnitsOfPos(K.ACTION_VERB, options, targetId));
		const mainVerbKo = mainVerb ? mainVerb[DATA_SCHEMA.Korean] : "";
		const isMotion = (new Set(["가다", "오다", "다니다", "살다"])).has(mainVerbKo);
		const deRole = isMotion ? K.LOCATION : K.OBJECT;
		const deParticle = isMotion ? "location_static" : K.OBJECT;

		return {
			ok: true,
			ast: {
				type: "Sentence",
				targetUnitId: targetId,
				speechAct: K.DECLARATIVE,
				politeness,
				tense,
				polarity: K.AFFIRMATIVE,
				clauses: [{
					constituents: [
						{
							role: K.SUBJECT,
							nounUnit: subjUnit,
							particleType: K.SUBJECT
						},
						{
							role: deRole,
							nounUnit: nominalUnit,
							modifierSurfaceKo: resolvePureMorphology(modKo, state),
							particleType: deParticle
						}
					],
					predicate: {
						role: K.PREDICATE,
						predType: K.ACTION,
						verbUnit: mainVerb,
						tense,
						politeness,
						speechAct: K.DECLARATIVE,
						polarity: K.AFFIRMATIVE
					}
				}]
			}
		};
	}

	// 1.6. Sino-Korean -적 Bound Modifier Root (인간적, 감각적...)
	if (hasTag(nominalUnit, "modifier_root") || (ko.endsWith("적") && hasTag(nominalUnit, K.CONCEPT, "personality", "trait"))) {
		const allNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => !hasTag(n, K.MEASUREWORD, K.COUNTER, K.POSITION) && n[DATA_SCHEMA.Korean] !== "이" && n[DATA_SCHEMA.Id] !== targetId
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
					speechAct: K.DECLARATIVE,
					politeness,
					tense,
					polarity: K.AFFIRMATIVE,
					clauses: [{
						constituents: [
							{
								role: K.SUBJECT,
								nounUnit: subjUnit,
								particleType: K.SUBJECT
							},
							{
								role: K.OBJECT,
								nounUnit: headNoun,
								modifierSurfaceKo: adnominalKo,
								particleType: K.OBJECT
							}
						],
						predicate: {
							role: K.PREDICATE,
							predType: K.ACTION,
							verbUnit: pickRandom(getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(v => (new Set(["좋아하다", "원하다", "찾다", "바라다", "생각하다"])).has(v[DATA_SCHEMA.Korean]))) || selectActionVerbForNoun(headNoun, options, targetId),
							tense,
							politeness,
							speechAct: K.DECLARATIVE,
							polarity: K.AFFIRMATIVE
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
					speechAct: K.DECLARATIVE,
					politeness,
					tense,
					polarity: K.AFFIRMATIVE,
					clauses: [{
						constituents: [{
							role: K.TOPIC,
							nounUnit: subjUnit || headNoun,
							particleType: K.TOPIC
						}],
						predicate: {
							role: K.PREDICATE,
							predType: K.COPULA,
							verbUnit: getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId).find(v => v[DATA_SCHEMA.Korean] === "이다") || null,
							copulaNounUnit: nominalUnit,
							tense,
							politeness,
							speechAct: K.DECLARATIVE,
							polarity: K.AFFIRMATIVE
						}
					}]
				}
			};
		}
	}

	// 2. Spatial Position Noun (위, 아래, 앞, 뒤, 옆, 안, 밖, 사이)
	if (hasTag(nominalUnit, K.POSITION) || state.SPATIAL_POSITIONS.has(ko)) {
		const isInside = ko === "안";
		const isOutside = ko === "밖";
		const isBelow = ko === "아래";
		const isAbove = ko === "위";
		const groundNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => n[DATA_SCHEMA.Id] !== targetId &&
			(isBelow
				? (new Set(["책상", "의자", "식탁", "탁자", "침대", "소파", "나무", "창문"])).has(n[DATA_SCHEMA.Korean])
				: (isOutside
					? (new Set(["집", "학교", "도서관", "교실", "방", "식당", "카페", "건물", "빌딩", "병원", "은행", "기숙사"])).has(n[DATA_SCHEMA.Korean])
					: (isAbove
						? (new Set(["책상", "탁자", "식탁", "침대", "의자", "소파", "바닥", "가방", "책", "공책", "상자"])).has(n[DATA_SCHEMA.Korean])
						: (hasTag(n, "furniture", K.ROOM, "building", "housing", "container") || (new Set(["학교", "도서관", "식당", "집", "방", "책상", "의자", "식탁", "탁자", "침대", "소파", "가방", "상자", "나무", "건물", "빌딩", "공원", "문"])).has(n[DATA_SCHEMA.Korean]))))) &&
			!hasTag(n, K.MEASUREWORD, K.COUNTER, K.POSITION, "language", K.ABSTRACT, "traffic", "city", K.COUNTRY, "region", "deictic", K.DEMONSTRATIVE, "landmark", K.NATURE) &&
			!(new Set(["이", "나이", "말", "한국말", "베트남말", "중국말", "일본말", "영어", "서울", "부산", "호주", "러시아", "한국", "미국", "일본", "중국", "저기", "그곳", "여기", "거기", "산", "바다", "강", "호수", "한강공원", "스키장", "온천", "농구장", "고속도로", "뷔페", "극장", "노약자석", "횡단보도", "방석"])).has(n[DATA_SCHEMA.Korean])
		);
		const allSubjNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => n[DATA_SCHEMA.Id] !== targetId &&
			!hasTag(n, K.MEASUREWORD, K.COUNTER, K.POSITION, K.TIME, K.ABSTRACT, "attribute", "metric", K.EMOTION, "psychological_state", "bodily_process", K.CONCEPT, "language", "fee", "expense", "currency_resource", K.DIRECTION, "deictic", K.DEMONSTRATIVE, "number", "bodyPart", "body", "sport", K.ACTIVITY, "entertainment", "digital_media", "computing", "food_ingredient", K.QUESTION_WORD, K.INTERROGATIVE, "honorific_noun") &&
			!(isBelow && hasTag(n, K.PERSON, K.FAMILY)) &&
			!(new Set(["이", "나이", "기분", "소화", "기온", "길이", "성격", "마음", "스트레스", "여유", "잠", "베트남말", "한국말", "배달비", "천", "이쪽", "저쪽", "여기", "거기", "무릎", "손", "발", "눈", "코", "귀", "입", "머리", "목", "테니스", "수영", "축구", "인사", "계산", "앱", "어플", "프로그램", "참기름", "설탕", "소금", "간장", "변비약", "냉동식품", "초밥", "얼마", "덱", "댁", "구경거리", "롤러코스터"])).has(n[DATA_SCHEMA.Korean])
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
		const existVerb = dvs.find(v => v[DATA_SCHEMA.Korean] === "있다") || avs.find(v => hasTag(v, "existence", K.LOCATIVE_STATIC)) || pickRandom(dvs) || pickRandom(avs);

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
		const isIndoorRoom = Boolean(ground && (hasTag(ground, K.ROOM) || (new Set(["방", "교실", "서재", "욕실", "화장실", "거실", "부엌", "안방", "연구실", "사무실", "강의실"])).has(groundKo)));
		const isBuildingOrOutdoorGround = Boolean(ground && !isIndoorRoom && (hasTag(ground, K.PLACE, K.FACILITY, "building") || (new Set(["학교", "도서관", "식당", "건물", "빌딩", "공원", "집", "나무", "기숙사", "카페", "병원", "은행"])).has(groundKo)));
		const isVehicleCar = n => (n[DATA_SCHEMA.Korean] !== "차" || hasTag(n, K.VEHICLE, K.TRANSPORTATION)) && !hasTag(n, K.DRINK, "tea", K.FOOD);
		const scaleFilteredSubjs = allSubjNouns.filter(n => {
			if (ground && n[DATA_SCHEMA.Id] === ground[DATA_SCHEMA.Id]) return false;
			if (!isVehicleCar(n)) return false;
			const nKo = n[DATA_SCHEMA.Korean] || "";
			if (isOutside) {
				return (hasTag(n, K.PERSON, K.FAMILY, "animal") && !hasTag(n, K.ELDER_NOUN, K.HONORIFIC)) || (new Set(["사람", "학생", "친구", "아이", "고양이", "강아지", "나무", "차", "버스", "자전거", "택시", "벤치"])).has(nKo);
			}
			if (isInside) {
				if (isIndoorRoom || isBuildingOrOutdoorGround) {
					return (hasTag(n, K.PERSON, K.FAMILY) && !hasTag(n, K.ELDER_NOUN, K.HONORIFIC)) || (new Set(["책상", "의자", "탁자", "침대", "소파", "학생", "친구", "사람", "선생님"])).has(nKo);
				}
				return !hasTag(n, K.PLACE, K.FACILITY, "building", "housing", "city", K.COUNTRY, K.VEHICLE, K.TRANSPORTATION, "furniture", "appliance", "amusement") && !(new Set(["팩스", "프린터"])).has(nKo) && (hasTag(n, K.OBJECT, "stationery", "book", "tool") || (new Set(["책", "공책", "가방", "지갑", "열쇠", "사과", "연필", "볼펜", "안경", "휴대전화", "우산"])).has(nKo));
			}
			if (isIndoorRoom) {
				// Behind/beside an indoor room: furniture, people, or adjacent rooms (never external buildings like 서점/백화점 or 나라!)
				return (hasTag(n, K.PERSON, K.FAMILY) && !hasTag(n, K.ELDER_NOUN, K.HONORIFIC)) || (new Set(["책상", "의자", "탁자", "침대", "소파", "창문", "문", "거실", "화장실", "부엌", "방", "서재", "교실", "사람", "친구", "학생"])).has(nKo);
			}
			if (isBuildingOrOutdoorGround) {
				// Outside/beside/behind/in-front-of a building requires person, tree, vehicle, or nearby external place/facility (never country/room/region/amusement!)
				return !hasTag(n, "amusement", "landmark", "district", "region", K.COUNTRY, K.ROOM) && !(new Set(["나라", "외국", "세계", "방", "서재", "욕실"])).has(nKo) && ((hasTag(n, K.PERSON, K.FAMILY, K.VEHICLE, K.FACILITY, K.PLACE, "animal") && !hasTag(n, K.ELDER_NOUN, K.HONORIFIC)) || (new Set(["사람", "학생", "친구", "차", "자전거", "버스", "나무", "공원", "정류장", "카페", "서점", "빵집", "식당", "고양이", "강아지", "의자", "벤치"])).has(nKo));
			}
			// On/under/beside furniture or small objects: small physical objects, pets, or stationery (not vehicles, cities, appliances, furniture, or districts!)
			return !hasTag(n, K.PLACE, K.FACILITY, "building", "housing", "city", K.COUNTRY, K.VEHICLE, K.TRANSPORTATION, "amusement", "furniture", "appliance", "electronics", "machine", "landmark", "district", "region") && !(new Set(["팩스", "프린터", "텔레비전", "컴퓨터", "냉장고", "세탁기"])).has(nKo) && (hasTag(n, "stationery", "book", "tool", "device", "fruit") || (new Set(["책", "공책", "가방", "컵", "시계", "열쇠", "우산", "신발", "인형", "고양이", "강아지", "사과", "연필", "볼펜", "안경", "휴대전화", "모자", "지갑"])).has(nKo));
		});
		const figure = pickRandom(scaleFilteredSubjs.length > 0 ? scaleFilteredSubjs : allSubjNouns.filter(n => !ground || n[DATA_SCHEMA.Id] !== ground[DATA_SCHEMA.Id])) || ground;
		const constituents = [
			{
				role: K.LOCATION,
				nounUnit: ground,
				positionUnit: nominalUnit,
				particleType: "location_static"
			}
		];
		if (figure && (!ground || figure[DATA_SCHEMA.Id] !== ground[DATA_SCHEMA.Id])) {
			constituents.push({
				role: K.SUBJECT,
				nounUnit: figure,
				particleType: K.SUBJECT
			});
		}
		return {
			ok: true,
			ast: {
				type: "Sentence",
				targetUnitId: targetId,
				speechAct: K.DECLARATIVE,
				politeness,
				tense: K.PRESENT,
				polarity: K.AFFIRMATIVE,
				clauses: [{
					constituents,
					predicate: {
						role: K.PREDICATE,
						predType: existVerb[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB ? K.ACTION : K.DESCRIPTIVE,
						verbUnit: existVerb,
						tense: K.PRESENT,
						politeness,
						speechAct: K.DECLARATIVE,
						polarity: K.AFFIRMATIVE
					}
				}]
			}
		};
	}

	// 3. Time Noun (오늘, 어제, 내일, 아침, 주말, 지금...)
	if (hasTag(nominalUnit, K.TIME, "temporal")) {
		const isTimeModifier = ko === "지난" || hasTag(nominalUnit, "time_modifier", "determiner");
		if (isTimeModifier) tense = K.PAST;
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
		const isMealTimeWord = (new Set(["아침", "점심", "저녁"])).has(ko);
		const TRANSIENT_TIME_DVS = new Set(["바쁘다", "한가하다", "조용하다", "시끄럽다", "복잡하다", "피곤하다", "배고프다", "춥다", "덥다", "따뜻하다", "시원하다", "쌀쌀하다", "맑다", "흐리다", "화창하다", "무덥다"]);
		const dvs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId).filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (vKo.includes(" ")) return false;
			if (!TRANSIENT_TIME_DVS.has(vKo)) return false;
			if (isMealTimeWord && (hasTag(v, K.WEATHER, "descriptive_weather") || (new Set(["맑다", "흐리다", "쌀쌀하다", "화창하다", "무덥다", "춥다", "덥다", "따뜻하다", "시원하다"])).has(vKo))) return false;
			if (hasTag(v, K.QUESTION_WORD, K.INTERROGATIVE, K.HONORIFIC) || state.HONORIFIC_WORDS.has(vKo)) return false;
			const sc = filterBySet(getSubjectCandidatesForDescriptiveVerb(v), options, targetId).filter(n => n[DATA_SCHEMA.Id] !== targetId && n[DATA_SCHEMA.Id] !== 361);
			if (sc.length === 0) return false;
			return true;
		});
		const verbUnit = (variationIndex % 2 === 0 && avs.length > 0) ? pickRandom(avs) : (pickRandom(dvs) || pickRandom(avs));
		const timeSpeechAct = (ko === "언제" || hasTag(nominalUnit, K.QUESTION_WORD, K.INTERROGATIVE) || (verbUnit && hasTag(verbUnit, K.QUESTION_WORD, K.INTERROGATIVE))) ? K.INTERROGATIVE : K.DECLARATIVE;

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
				(new Set(["달", "주", "해", "번", "학기", "겨울", "여름"])).has(n[DATA_SCHEMA.Korean])
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
			if (arg.role !== K.SUBJECT) {
				const subj = selectSubjectUnit(options, targetId, false);
				if (subj && subj[DATA_SCHEMA.Id] !== targetId) {
					constituents.unshift({
						role: K.TOPIC,
						nounUnit: subj,
						particleType: K.TOPIC
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
					role: K.SUBJECT,
					nounUnit: subj,
					particleType: K.SUBJECT
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
				polarity: K.AFFIRMATIVE,
				clauses: [{
					constituents,
					predicate: {
						role: K.PREDICATE,
						predType: verbUnit[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB ? K.ACTION : K.DESCRIPTIVE,
						verbUnit,
						tense,
						politeness,
						speechAct: timeSpeechAct,
						polarity: K.AFFIRMATIVE
					}
				}]
			}
		};
	}

	// 4. Place / Location Noun (학교, 도서관, 집, 한국, 식당, 여기, 거기, 어디, 이곳, 저곳...)
	if (hasTag(nominalUnit, K.PLACE, K.LOCATION, "institution", K.FACILITY) || (new Set(["여기", "거기", "저기", "어디", "이곳", "그곳", "저곳"])).has(ko)) {
		if (ko === "나라" && !hasTag(nominalUnit, K.PROPER_NOUN)) {
			const dvs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId);
			const naturalCountryDVs = dvs.filter(v => (new Set(["크다", "작다", "아름답다", "많다", "좋다", "유명하다"])).has(v[DATA_SCHEMA.Korean]));
			const countryDv = pickRandom(naturalCountryDVs);
			if (countryDv) {
				return {
					ok: true,
					ast: {
						type: "Sentence",
						targetUnitId: targetId,
						speechAct: K.DECLARATIVE,
						politeness,
						tense,
						polarity: K.AFFIRMATIVE,
						clauses: [{
							constituents: [{
								role: variationIndex === 1 ? K.TOPIC : K.SUBJECT,
								nounUnit: nominalUnit,
								particleType: variationIndex === 1 ? K.TOPIC : K.SUBJECT
							}],
							predicate: {
								role: K.PREDICATE,
								predType: K.DESCRIPTIVE,
								verbUnit: countryDv,
								tense,
								politeness,
								speechAct: K.DECLARATIVE,
								polarity: K.AFFIRMATIVE
							}
						}]
					}
				};
			}
		}
		const isInterrogative = ko === "어디";
		const nonKitchenPlace = (new Set(["교실", "도서관", "은행", "우체국", "병원", "약국", "학교", "사무실", "서점", "공항", "박물관", "미술관", "지하철역", "버스 정류장", "꽃집", "문구점", "찜질방", "산", "바다", "강", "호수", "공원", "한강공원", "노래방", "피시방", "영화관", "극장", "체육관", "백화점", "마트", "시장", "미용실", "세탁소"])).has(ko);
		const nonDomesticPlace = nonKitchenPlace || (new Set(["학생회관", "식당", "카페", "편의점", "저기", "거기", "여기", "그곳"])).has(ko);
		const isResidentialPlace = (new Set(["집", "원룸", "아파트", "기숙사", "하숙집", "고향", "서울", "부산", "대구", "속초", "한국", "미국", "일본", "중국", "독일", "베트남", "프랑스", "외국", "도시", "동네"])).has(ko) || hasTag(nominalUnit, "housing", "residence", "city", K.COUNTRY);
		const isWorkplace = (new Set(["회사", "사무실", "은행", "병원", "학교", "공장", "가게", "식당", "카페", "서점", "빵집", "마트", "백화점", "약국"])).has(ko);
		const isAcademicInst = (new Set(["학교", "초등학교", "중학교", "고등학교", "대학교", "대학원", "유치원", "학원"])).has(ko);
		const isCommuteDest = (new Set(["학교", "초등학교", "중학교", "고등학교", "대학교", "회사", "학원", "병원", "교회", "은행"])).has(ko);
		const isTransitStop = (new Set(["버스", "지하철", "택시", "기차", "정류장", "버스 정류장", "지하철역", "역", "터미널", "공항", "서울역", "부산역", "이촌역", "홍대입구역", "광화문역"])).has(ko);
		const isDiningVenue = (new Set(["식당", "학생식당", "카페", "빵집", "집", "기숙사", "맛집", "뷔페", "북경반점"])).has(ko);
		const isRetailStore = (new Set(["꽃집", "문구점", "백화점", "마트", "가게", "서점", "빵집", "편의점", "약국", "시장"])).has(ko);
		const isStudyVenue = (new Set(["도서관", "교실", "학교", "대학교", "학원", "집", "기숙사", "원룸", "서재", "방", "서점"])).has(ko);
		const isParkingVenue = (new Set(["주차장", "길", "집", "회사", "학교", "백화점", "마트"])).has(ko);
		const isPostalVenue = ko === "우체국";
		const isDeicticPlace = (new Set(["저기", "거기", "여기", "이곳", "그곳", "저곳"])).has(ko);
		const isOutdoorNature = hasTag(nominalUnit, K.NATURE) || (new Set(["산", "바다", "강", "호수", "공원", "한강공원", "스키장", "온천", "농구장"])).has(ko);
		const allAvs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (vKo.includes(" ")) return false;
			if (hasTag(v, "involuntary", "passive", K.WEATHER) || state.HONORIFIC_WORDS.has(vKo) || (new Set(["걸리다", "지내다", "되다", "나다", "죽다", "생기다", "터지다", "끓다", "식다", "놓다", "두다", "담다", "넣다", "보이다", "끼다", "개다", "싸다", "쌓다", "알다", "모르다", "기억하다", "원하다", "생각하다", "사랑하다", "남다", "붓다", "낫다", "뜨거워지다", "피다", "늘다", "줄다", "돌아가시다", "넘어지다", "떨리다", "눕다", "서다", "앉다", "잘하다", "못하다", "올려놓다", "보여주다", "보여드리다", "때리다", "지나가다", "빌려주다", "나빠하다", "배달시키다", "걸레질하다", "좌회전하다", "우회전하다", "세일하다", "할인하다", "바르다", "깎다", "소독하다", "묶다", "매다", "접다", "당기다", "밀다", "세다", "확인하다", "섞다", "버리다", "서명하다", "전하다", "짓다", "잡다", "예약하다", "건너다", "출국하다", "지각하다", "등산하다", "민박하다"])).has(vKo) && !(new Set(["산", "바다", "강", "호수", "공원", "한강공원", "공항", "인천공항", "김포공항", "학교", "대학교", "학원", "회사", "한국", "미국", "일본", "중국", "서울", "시골", "제주도", "속초"])).has(ko)) return false;
			if (vKo === "출국하다" && !(new Set(["공항", "인천공항", "김포공항", "한국", "미국", "일본", "중국", "서울", "외국"])).has(ko)) return false;
			if (vKo === "등산하다" && !(new Set(["산", "설악산", "백두산", "한라산"])).has(ko)) return false;
			if (vKo === "지각하다" && !(new Set(["학교", "수업", "학원", "회사", "모임", "회의", "대학교"])).has(ko)) return false;
			if (vKo === "민박하다" && !(new Set(["바다", "산", "시골", "제주도", "속초"])).has(ko)) return false;
			if (vKo === "수영하다" && !(new Set(["수영장", "바다", "강", "운동장"])).has(ko)) return false;
			if (vKo === "낚시하다" && !(new Set(["바다", "강", "호수"])).has(ko)) return false;
			if ((ko === "저기" || ko === "저곳") && (new Set(["오다", "올라오다", "내려오다", "들어오다", "나오다"])).has(vKo)) return false;
			const venueAllowed = parseSemanticData(nominalUnit).venue_allowed_verbs;
			if (Array.isArray(venueAllowed) && !(new Set(venueAllowed)).has(vKo)) return false;
			if (state.HUMBLE_WORDS.has(vKo) || (state.HUMBLE_DATIVE_VERBS && state.HUMBLE_DATIVE_VERBS.has(vKo)) || vKo.includes("드리")) return false;
			if (!isResidentialPlace && (vKo === "이사하다" || vKo === "살다" || vKo === "생활하다")) return false;
			if (!(new Set(["집", "기숙사", "하숙집", "원룸", "아파트", "고향"])).has(ko) && (new Set(["생활하다", "초대하다", "설거지하다", "키우다", "정리하다", "신다", "벗다", "입다"])).has(vKo)) return false;
			if (!isWorkplace && (new Set(["출근하다", "퇴근하다", "벌다"])).has(vKo)) return false;
			if (!isAcademicInst && (new Set(["입학하다", "결석하다", "출석하다"])).has(vKo)) return false;
			if (!isCommuteDest && vKo === "다니다") return false;
			if (!isTransitStop && (new Set(["내리다", "하차하다", "타다", "갈아타다"])).has(vKo)) return false;
			if (!isDiningVenue && (new Set(["먹다", "마시다", "시키다", "주문하다", "말다", "씹다", "덜다"])).has(vKo)) return false;
			if (!isRetailStore && (new Set(["사다", "고르다", "팔다", "준비하다"])).has(vKo)) return false;
			if (!isStudyVenue && (new Set(["공부하다", "읽다", "쓰다", "배우다", "빌리다", "가르치다", "필기하다"])).has(vKo)) return false;
			if ((new Set(["꽃집", "문구점", "빵집", "학생회관", "학생식당"])).has(ko) && (new Set(["사귀다", "안내하다", "모으다", "올리다", "올려놓다", "보여주다", "바르다", "깎다", "소독하다", "주고받다", "연기하다", "낚시하다", "서명하다", "부르다", "발표하다", "질문하다", "내려오다", "올라오다", "세우다", "물어보다"])).has(vKo)) return false;
			if (!isParkingVenue && vKo === "주차하다") return false;
			if (!isPostalVenue && vKo === "부치다") return false;
			if (vKo === "세배하다" && !(new Set(["집", "할아버지 댁", "고향"])).has(ko)) return false;
			if ((nonDomesticPlace || isDeicticPlace || isOutdoorNature) && (new Set(["세수하다", "목욕하다", "샤워하다", "자다", "낮잠 자다", "졸다", "일어나다"])).has(vKo) && ko !== "찜질방") return false;
			if ((nonKitchenPlace || isDeicticPlace || isOutdoorNature) && (hasTag(v, "cooking") || (new Set(["자르다", "튀기다", "썰다", "볶다", "굽다", "끓이다", "삶다", "말다", "부치다", "양념하다", "내리다", "다지다", "뿌리다", "깎다"])).has(vKo))) return false;
			if ((isOutdoorNature || (new Set(["꽃집", "문구점", "찜질방", "도서관", "병원", "약국", "은행", "백화점", "빵집", "체육관", "학생식당", "학생회관", "서울", "부산"])).has(ko)) && (new Set(["치다", "녹음하다", "다운로드하다", "원하다", "기억하다", "사용하다", "찾다", "바르다", "소독하다", "깎다", "덜다", "연기하다", "서명하다", "발표하다", "주고받다", "세우다", "올려놓다", "보여주다", "부르다", "내려오다", "올라오다", "사귀다", "모으다", "안내하다", "질문하다", "빌리다", "설거지하다"])).has(vKo)) return false;
			if ((ko === "여기" || ko === "이곳") && (new Set(["가다", "소풍을 가다", "여행하다", "출발하다", "나가다", "돌아가다"])).has(vKo)) return false;
			const isMotionOrStat = hasTag(v, K.INTRANSITIVE_MOTION, K.INTRANSITIVE_PLACE, K.LOCATIVE_GOAL, K.LOCATIVE_ORIGIN, "existence") || (new Set(["출근하다", "도착하다", "입학하다", "출국하다", "떠나다"])).has(vKo);
			if (!isMotionOrStat && !isIntransitiveVerb(v)) {
				if (getVerbParticleType(v) === K.DATIVE) return false;
				const argPreview = selectArgumentForActionVerb(v, options, targetId);
				if (!argPreview || !argPreview.nounUnit || argPreview.role !== K.OBJECT) return false;
			}
			return true;
		});
		const agentiveAvs = allAvs.filter(v => getVerbParticleType(v) !== K.SUBJECT && !/이\/가/.test(String(v[DATA_SCHEMA.SyntaxFrame] || "")));
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
		const isDynamicMotionOrOrigin = (new Set(["달리다", "걷다", "뛰다", "산책하다", "조깅하다", "수영하다", "등산하다", "떠나다", "출국하다", "출발하다", "나오다", "지나가다"])).has(verbKoPlace) || hasTag(verbUnit, K.LOCATIVE_ORIGIN);
		const isMotionOrStatic = verbUnit && (
			verbUnit[DATA_SCHEMA.PartofSpeech] === K.DESCRIPTIVE_VERB ||
			hasTag(verbUnit, K.INTRANSITIVE_MOTION, K.INTRANSITIVE_PLACE, K.LOCATIVE_GOAL, K.LOCATIVE_ORIGIN, "existence") ||
			(new Set(["출근하다", "도착하다", "입학하다", "출국하다", "떠나다"])).has(verbKoPlace)
		);

		const constituents = [];
		const arg = (verbUnit && verbUnit[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB)
			? selectArgumentForActionVerb(verbUnit, options, targetId)
			: { nounUnit: null, role: null, particleType: null };

		if (arg.role !== K.SUBJECT) {
			let subj = selectSubjectUnit(options, targetId, false);
			if (subj && arg.nounUnit && (new Set(["치마", "원피스"])).has(arg.nounUnit[DATA_SCHEMA.Korean]) && (new Set(["오빠", "형", "남동생", "아버지", "아빠", "할아버지", "작은아버지", "큰아버지", "삼촌", "아저씨", "남자", "사나이"])).has(subj[DATA_SCHEMA.Korean])) {
				const fSubjs = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (new Set(["언니", "누나", "여동생", "어머니", "엄마", "친구", "여자", "학생"])).has(n[DATA_SCHEMA.Korean]));
				if (fSubjs.length > 0) subj = pickRandom(fSubjs);
			}
			if (subj && subj[DATA_SCHEMA.Id] !== targetId) {
				constituents.push({
					role: K.TOPIC,
					nounUnit: subj,
					particleType: K.TOPIC
				});
			}
		}

		const isKyesida = verbUnit && (verbUnit[DATA_SCHEMA.Korean] === "계시다" || verbUnit[DATA_SCHEMA.Korean] === "있다");
		constituents.push({
			role: K.LOCATION,
			nounUnit: nominalUnit,
			particleType: (!isDynamicMotionOrOrigin && (isMotionOrStatic || isKyesida)) ? "location_static" : "location_dynamic"
		});

		if (!isMotionOrStatic && arg.nounUnit && arg.nounUnit[DATA_SCHEMA.Id] !== targetId && (arg.role === K.OBJECT || arg.role === K.SUBJECT)) {
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
				speechAct: isInterrogative ? K.INTERROGATIVE : K.DECLARATIVE,
				politeness,
				tense,
				polarity: K.AFFIRMATIVE,
				clauses: [{
					constituents,
					predicate: {
						role: K.PREDICATE,
						predType: verbUnit[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB ? K.ACTION : K.DESCRIPTIVE,
						verbUnit,
						tense,
						politeness,
						speechAct: isInterrogative ? K.INTERROGATIVE : K.DECLARATIVE,
						polarity: K.AFFIRMATIVE
					}
				}]
			}
		};
	}

	// 5. Person / Animate Noun or Personal Pronoun -> Subject / Topic
	const isPersonalPronoun = (new Set(["나", "저", "우리", "저희", "너", "너희", "그", "그녀", "당신", "누구", "누가", "제", "내", "네"])).has(ko);
	const isPerson = isPersonalPronoun || hasTag(nominalUnit, K.PERSON, K.FAMILY, K.PROFESSION, "animal", "subject_animate");
	const isNonPersonDeictic = (new Set(["이것", "그것", "저것", "이거", "그거", "저거", "무엇", "뭐", "얼마", "몇", "여기", "거기", "저기", "어디", "이곳", "그곳", "저곳", "언제", "며칠"])).has(ko);
	if (isPerson && !isNonPersonDeictic) {
		const isElder = isElderNoun(nominalUnit);
		const isFirstPerson = (new Set(["저", "나", "우리", "저희", "제", "내"])).has(ko);
		const isJunior = hasTag(nominalUnit, "child", "junior") || (new Set(["아이", "조카", "동생", "남동생", "여동생", "사나이", "놈"])).has(ko);
		const isInterrogative = ko === "누구" || ko === "누가";
		const allAvs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId);
		const avs = allAvs.filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (vKo.includes(" ")) return false;
			if (isIntransitiveVerb(v)) return false;
			if (getVerbParticleType(v) !== K.OBJECT) return false;
			if ((!isElder || isFirstPerson || isJunior) && state.HONORIFIC_WORDS.has(vKo)) return false;
			if ((new Set(["아랫사람", "노인", "어른", "아이", "학생", "조카", "남동생", "여동생", "얘들", "사나이", "놈"])).has(ko) && (new Set(["할인하다", "팔다"])).has(vKo)) return false;
			return true;
		});
		const matchedDV = selectDescriptiveVerbForNoun(nominalUnit, { ...options, tense }, targetId);
		let chosenDV = matchedDV;
		if (chosenDV && (!isElder || isFirstPerson || isJunior) && state.HONORIFIC_WORDS.has(chosenDV[DATA_SCHEMA.Korean])) {
			chosenDV = null;
		}
		const verbUnit = (variationIndex % 2 === 0 && avs.length > 0) ? pickRandom(avs, options.seedOffset, options) : (chosenDV || pickRandom(avs, options.seedOffset, options));
		let clauseTensePerson = tense;
		if (verbUnit && (new Set(["잘생기다", "못생기다", "오래되다"])).has(verbUnit[DATA_SCHEMA.Korean]) && !options.tense) {
			clauseTensePerson = K.PAST;
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
						speechAct: isInterrogative ? K.INTERROGATIVE : K.DECLARATIVE,
						politeness,
						tense: K.PRESENT,
						polarity: K.AFFIRMATIVE,
						clauses: [{
							constituents: [{
								role: isInterrogative ? K.SUBJECT : K.TOPIC,
								nounUnit: nominalUnit,
								particleType: isInterrogative ? K.SUBJECT : K.TOPIC
							}],
							predicate: {
								role: K.PREDICATE,
								predType: K.COPULA,
								copulaNounUnit: pickRandom(otherNouns),
								tense: K.PRESENT,
								politeness,
								speechAct: isInterrogative ? K.INTERROGATIVE : K.DECLARATIVE,
								polarity: K.AFFIRMATIVE
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

		const nominalParticle = isInterrogative ? K.SUBJECT : (variationIndex % 2 === 0 ? K.TOPIC : K.SUBJECT);
		const nominalRole = isInterrogative ? K.SUBJECT : (variationIndex % 2 === 0 ? K.TOPIC : K.SUBJECT);
		const constituents = [{
			role: nominalRole,
			nounUnit: nominalUnit,
			particleType: nominalParticle
		}];

		if (verbUnit[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB) {
			const arg = selectArgumentForActionVerb(verbUnit, options, targetId);
			if (verbUnit[DATA_SCHEMA.Korean] === "넣다" || verbUnit[DATA_SCHEMA.Korean] === "담다") {
				const container = verbUnit[DATA_SCHEMA.Korean] === "담다"
					? pickRandom(getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => !hasTag(n, K.HONORIFIC, "honorific_noun") && ((new Set(["접시", "그릇", "바구니", "상자"])).has(n[DATA_SCHEMA.Korean]) || hasTag(n, "container", "dish"))))
					: selectPutInContainerNoun(arg.nounUnit, options, targetId);
				if (container && container[DATA_SCHEMA.Id] !== targetId) {
					constituents.push({
						role: K.LOCATION,
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
				speechAct: isInterrogative ? K.INTERROGATIVE : K.DECLARATIVE,
				politeness,
				tense: clauseTensePerson,
				polarity: K.AFFIRMATIVE,
				honorific: isElder,
				clauses: [{
					honorific: isElder,
					constituents,
					predicate: {
						role: K.PREDICATE,
						predType: verbUnit[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB ? K.ACTION : K.DESCRIPTIVE,
						verbUnit,
						tense: clauseTensePerson,
						politeness,
						speechAct: isInterrogative ? K.INTERROGATIVE : K.DECLARATIVE,
						polarity: K.AFFIRMATIVE,
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
		chosenVerb && ((new Set(["어떻다", "어떠하다"])).has(chosenVerb[DATA_SCHEMA.Korean]) || hasTag(chosenVerb, K.QUESTION_WORD, K.INTERROGATIVE))
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
				role: K.TOPIC,
				nounUnit: subj,
				particleType: K.TOPIC
			});
		}
		const chosenKo = chosenVerb[DATA_SCHEMA.Korean];
		if (chosenKo === "담다" || chosenKo === "놓다" || chosenKo === "두다" || chosenKo === "넣다") {
			const locPool = chosenKo === "담다"
				? getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => !hasTag(n, K.HONORIFIC, "honorific_noun") && ((new Set(["접시", "그릇", "상자", "가방", "냉장고", "바구니"])).has(n[DATA_SCHEMA.Korean]) || hasTag(n, "container", "dish")))
				: chosenKo === "넣다"
					? null
					: getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (new Set(["책상", "탁자", "식탁", "의자", "바닥", "침대"])).has(n[DATA_SCHEMA.Korean]) || hasTag(n, "furniture", K.PLACE));
			const containerLoc = chosenKo === "넣다"
				? selectPutInContainerNoun(nominalUnit, options, targetId)
				: pickRandom(locPool);
			if (containerLoc && containerLoc[DATA_SCHEMA.Id] !== targetId) {
				constituents.push({
					role: K.LOCATION,
					nounUnit: containerLoc,
					particleType: "location_static"
				});
			}
		}
		let particleType = getVerbParticleType(chosenVerb);
		if (particleType === K.DATIVE && !hasTag(nominalUnit, K.PERSON, K.FAMILY, K.PROFESSION)) {
			particleType = K.OBJECT;
		}
		constituents.push({
			role: (particleType === K.LOCATION || particleType === "location_static") ? K.LOCATION : (particleType === K.DATIVE ? K.RECIPIENT : K.OBJECT),
			nounUnit: nominalUnit,
			particleType
		});
	} else {
		const partType = isInterrogative ? K.SUBJECT : (variationIndex === 1 ? K.TOPIC : K.SUBJECT);
		const roleType = isInterrogative ? K.SUBJECT : (variationIndex === 1 ? K.TOPIC : K.SUBJECT);
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
			speechAct: isInterrogative ? K.INTERROGATIVE : K.DECLARATIVE,
			politeness,
			tense,
			polarity: K.AFFIRMATIVE,
			clauses: [{
				constituents,
				predicate: {
					role: K.PREDICATE,
					predType: chosenVerb[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB ? K.ACTION : K.DESCRIPTIVE,
					verbUnit: chosenVerb,
					tense,
					politeness,
					speechAct: isInterrogative ? K.INTERROGATIVE : K.DECLARATIVE,
					polarity: K.AFFIRMATIVE
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
	const politeness = options.politeness || (variationIndex === 2 ? K.FORMAL_HIGH : "polite");
	const tenses = [K.PRESENT, K.PAST, K.FUTURE];
	let tense = options.tense || tenses[variationIndex % tenses.length];

	// 1. Determiner (이, 그, 저, 어느, 무슨, 어떤, 새, 헌, 모든, 다른...)
	if (pos === K.DETERMINER) {
		const isInterrogative = (new Set(["어느", "무슨", "어떤", "몇"])).has(ko);
		const isTemporalDet = (new Set(["지난", "이번", "다음", "올"])).has(ko);
		let nouns = [];
		if (isTemporalDet) {
			nouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
				n => hasTag(n, K.TIME, "temporal") && !hasTag(n, K.MEASUREWORD, K.COUNTER, K.POSITION)
			);
		}
		if (nouns.length === 0) {
			nouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => {
				if (hasTag(n, K.MEASUREWORD, K.COUNTER, K.TIME, K.POSITION, K.QUESTION_WORD)) return false;
				if ((new Set(["이", "얼마", "누구", "무엇", "뭐", "어디", "언제", "몇"])).has(n[DATA_SCHEMA.Korean])) return false;
				if (ko === "어느") {
					if (hasTag(n, K.PROPER_NOUN, K.FAMILY, "landmark", "tourism", "cultural_concept", "anatomy", "body_fluid", "maneuver")) return false;
					if ((new Set(["직진", "좌회전", "우회전", "유턴", "스크린도어"])).has(n[DATA_SCHEMA.Korean])) return false;
					return (new Set(["나라", "고향", "도시", "학교", "회사", "집", "방", "가게", "식당", "카페", "은행", "병원", "공원", "친구", "사람", "선생님", "버스", "지하철", "계절", "요일", "쪽", "음식", "색깔", "책", "영화", "노래", "신발"])).has(n[DATA_SCHEMA.Korean])
						|| hasTag(n, K.PLACE, K.FACILITY, K.COUNTRY, "city", K.PERSON, K.TRANSPORTATION, "season", K.CLOTHING, "book", K.DIRECTION);
				}
				return true;
			});
			if (ko === "어느" && nouns.length === 0) {
				nouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
					n => !hasTag(n, K.MEASUREWORD, K.COUNTER, K.TIME, K.POSITION, K.QUESTION_WORD, "cultural_concept", "anatomy", "body_fluid") &&
					!(new Set(["이", "얼마", "누구", "무엇", "뭐", "어디", "언제", "몇"])).has(n[DATA_SCHEMA.Korean])
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
				speechAct: isInterrogative ? K.INTERROGATIVE : K.DECLARATIVE,
				politeness,
				tense,
				polarity: K.AFFIRMATIVE,
				clauses: [{
					constituents: [{
						role: isActionVerb ? K.OBJECT : K.SUBJECT,
						determinerUnit: unit,
						nounUnit: headNoun,
						particleType: isActionVerb ? K.OBJECT : K.SUBJECT
					}],
					predicate: {
						role: K.PREDICATE,
						predType: isActionVerb ? K.ACTION : K.DESCRIPTIVE,
						verbUnit: chosenVerb,
						tense,
						politeness,
						speechAct: isInterrogative ? K.INTERROGATIVE : K.DECLARATIVE,
						polarity: K.AFFIRMATIVE
					}
				}]
			}
		};
	}

	// 2. Number (하나, 둘, 한, 두, 일, 이, 삼...)
	if (pos === K.NUMBER) {
		const isSino = hasTag(unit, K.SINO_NUMBER);
		const numVal = (state.KOREAN_NUMBER_VALUES && state.KOREAN_NUMBER_VALUES[ko]) || 1;
		const classifiers = isSino ? Array.from(state.SINO_CLASSIFIERS) : Array.from(state.KOREAN_CLASSIFIERS);
		let chosenClassifierKo = isSino
			? (numVal >= 100 && classifiers.includes("원") ? "원" : (classifiers.includes("쪽") ? "쪽" : (classifiers[0] || "분")))
			: (classifiers.includes("개") ? "개" : (classifiers[0] || "개"));
		let counterUnit = state.CLASSIFIER_UNITS.get(chosenClassifierKo) || null;

		if (options.onlyFromSet) {
			const inSetCounters = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => hasTag(n, K.MEASUREWORD, K.COUNTER));
			const matchingCounter = inSetCounters.find(c => (getClassifierNumeralType(c[DATA_SCHEMA.Korean]) === "sino") === isSino) || inSetCounters[0];
			if (matchingCounter) {
				counterUnit = matchingCounter;
				chosenClassifierKo = matchingCounter[DATA_SCHEMA.Korean];
			}
		}

		let nouns = chosenClassifierKo === "원"
			? getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (new Set(["돈", "현금"])).has(n[DATA_SCHEMA.Korean]))
			: (chosenClassifierKo === "쪽"
				? getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (new Set(["책", "교과서", "잡지", "신문", "사전", "만화책"])).has(n[DATA_SCHEMA.Korean]))
				: filterBySet(getMatchingNounsForClassifier(chosenClassifierKo), options, targetId));
		if (nouns.length === 0) {
			nouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => !hasTag(n, K.MEASUREWORD, K.COUNTER, K.TIME, K.PLACE));
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
				speechAct: K.DECLARATIVE,
				politeness,
				tense: K.PRESENT,
				polarity: K.AFFIRMATIVE,
				clauses: [{
					constituents: [{
						role: isAction ? K.OBJECT : K.SUBJECT,
						nounUnit: itemNoun,
						numberUnit: unit,
						numberSurfaceKo: numSurface,
						countValue: numVal,
						counterUnit,
						particleType: isAction ? K.OBJECT : K.SUBJECT
					}],
					predicate: {
						role: K.PREDICATE,
						predType: isAction ? K.ACTION : K.DESCRIPTIVE,
						verbUnit: chosenVerb,
						tense: K.PRESENT,
						politeness,
						speechAct: K.DECLARATIVE,
						polarity: K.AFFIRMATIVE
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
			if ((new Set(["싶다", "안녕하다", "죄송하다", "어떻다", "이렇다", "그렇다", "저렇다"])).has(vKo)) return false;
			if (hasTag(v, K.AUXILIARY, K.CONNECTIVE, "greeting")) return false;
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
					role: K.SUBJECT,
					nounUnit: subj,
					particleType: K.SUBJECT
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
					speechAct: K.DECLARATIVE,
					politeness,
					tense: K.PRESENT,
					polarity: K.AFFIRMATIVE,
					clauses: [{
						constituents,
						predicate: {
							role: K.PREDICATE,
							predType: K.ACTION,
							verbUnit: chosenVerb,
							tense: K.PRESENT,
							politeness,
							speechAct: K.DECLARATIVE,
							polarity: K.AFFIRMATIVE
						}
					}]
				}
			};
		} else {
			const chosenVerb = pickRandom(dvs) || pickRandom(avs);
			const subjCandidates = chosenVerb ? filterBySet(getSubjectCandidatesForDescriptiveVerb(chosenVerb), options, targetId)
				.filter(u => u[DATA_SCHEMA.Id] !== 361 && !(new Set(["인형", "드라마", "자전거", "오토바이", "햇빛"])).has(u[DATA_SCHEMA.Korean])) : [];
			const subj = (subjCandidates.length > 0 ? pickRandom(subjCandidates) : selectSubjectUnit(options, targetId, false));
			if (subj) {
				constituents.push({
					role: K.SUBJECT,
					nounUnit: subj,
					particleType: K.SUBJECT
				});
			}
			return {
				ok: true,
				ast: {
					type: "Sentence",
					targetUnitId: targetId,
					speechAct: K.DECLARATIVE,
					politeness,
					tense: K.PRESENT,
					polarity: K.AFFIRMATIVE,
					clauses: [{
						constituents,
						predicate: {
							role: K.PREDICATE,
							predType: chosenVerb && chosenVerb[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB ? K.ACTION : K.DESCRIPTIVE,
							verbUnit: chosenVerb,
							tense: K.PRESENT,
							politeness,
							speechAct: K.DECLARATIVE,
							polarity: K.AFFIRMATIVE
						}
					}]
				}
			};
		}
	}

	// 4. Adverb (Degree, Manner, Time, Discourse, NPI, Short Negation)
	if (ko === "아무리") {
		const avs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(v => !state.FORBIDDEN_NEGATIVE_ROOTS.has(v[DATA_SCHEMA.Korean]) && !(v[DATA_SCHEMA.Korean] || "").includes(" "));
		const dvs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId).filter(v => !state.FORBIDDEN_NEGATIVE_ROOTS.has(v[DATA_SCHEMA.Korean]) && !(new Set(["안녕하다", "싶다", "어떠하다"])).has(v[DATA_SCHEMA.Korean]));
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
			clause1Constituents.push({ role: K.SUBJECT, nounUnit: subj1, particleType: K.SUBJECT });
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
				speechAct: K.DECLARATIVE,
				politeness,
				tense: K.PRESENT,
				polarity: K.AFFIRMATIVE,
				clauses: [
					{
						constituents: clause1Constituents,
						predicate: {
							role: K.PREDICATE,
							predType: K.DESCRIPTIVE,
							verbUnit: dv1,
							connectiveSuffix: "아/어도"
						}
					},
					{
						constituents: clause2Constituents,
						predicate: {
							role: K.PREDICATE,
							predType: isAct2 ? K.ACTION : K.DESCRIPTIVE,
							verbUnit: verb2,
							tense: K.PRESENT,
							politeness,
							speechAct: K.DECLARATIVE,
							polarity: K.AFFIRMATIVE
						}
					}
				]
			}
		};
	}

	if (ko === "왜냐하면") {
		const avs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(v => !state.FORBIDDEN_NEGATIVE_ROOTS.has(v[DATA_SCHEMA.Korean]) && !(v[DATA_SCHEMA.Korean] || "").includes(" "));
		const dvs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId).filter(v => !state.FORBIDDEN_NEGATIVE_ROOTS.has(v[DATA_SCHEMA.Korean]) && !(new Set(["안녕하다", "싶다", "어떠하다"])).has(v[DATA_SCHEMA.Korean]));
		const chosenVerb = (variationIndex % 2 === 0 && avs.length > 0) ? pickRandom(avs) : (pickRandom(dvs) || pickRandom(avs));
		const isAction = chosenVerb[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB;
		const subj = isAction ? selectSubjectUnit(options, targetId, false) : (filterBySet(getSubjectCandidatesForDescriptiveVerb(chosenVerb), options, targetId)[0] || selectSubjectUnit(options, targetId, false));
		const arg = (isAction && !hasTag(chosenVerb, "scalable_duration", "scalable_quantity")) ? selectArgumentForActionVerb(chosenVerb, options, targetId) : { nounUnit: null };

		const constituents = [
			{ role: K.DISCOURSE, unit, particleType: null }
		];
		if (subj) {
			constituents.push({ role: K.TOPIC, nounUnit: subj, particleType: K.TOPIC });
		}
		if (arg.nounUnit && (!subj || arg.nounUnit[DATA_SCHEMA.Id] !== subj[DATA_SCHEMA.Id])) {
			constituents.push({ role: arg.role, nounUnit: arg.nounUnit, particleType: arg.particleType });
		}

		const stem = getStem(chosenVerb[DATA_SCHEMA.Korean]);
		const explEnding = politeness === K.FORMAL_HIGH ? "기 때문입니다" : "기 때문이에요";

		return {
			ok: true,
			ast: {
				type: "Sentence",
				targetUnitId: targetId,
				speechAct: K.DECLARATIVE,
				politeness,
				tense: K.PRESENT,
				polarity: K.AFFIRMATIVE,
				clauses: [{
					constituents,
					predicate: {
						role: K.PREDICATE,
						predType: isAction ? K.ACTION : K.DESCRIPTIVE,
						verbUnit: chosenVerb,
						explicitSurfaceKo: stem + explEnding,
						tense: K.PRESENT,
						politeness,
						speechAct: K.DECLARATIVE,
						polarity: K.AFFIRMATIVE
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
			compatibleNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => !hasTag(n, K.MEASUREWORD, K.COUNTER, K.TIME, K.POSITION));
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
			role: isAction ? K.OBJECT : K.SUBJECT,
			nounUnit: headNoun,
			numberSurfaceKo: modifierPhrase,
			counterUnit,
			particleType: isAction ? K.OBJECT : K.SUBJECT
		}];
		if (isAction) {
			const subj = selectSubjectUnit(options, targetId, false);
			if (subj) {
				constituents.unshift({ role: K.TOPIC, nounUnit: subj, particleType: K.TOPIC });
			}
		}

		return {
			ok: true,
			ast: {
				type: "Sentence",
				targetUnitId: targetId,
				speechAct: K.DECLARATIVE,
				politeness,
				tense: K.PRESENT,
				polarity: K.AFFIRMATIVE,
				clauses: [{
					constituents,
					predicate: {
						role: K.PREDICATE,
						predType: isAction ? K.ACTION : K.DESCRIPTIVE,
						verbUnit,
						tense: K.PRESENT,
						politeness,
						speechAct: K.DECLARATIVE,
						polarity: K.AFFIRMATIVE
					}
				}]
			}
		};
	}

	const isNPI = state.ALL_NPI_WORDS.has(ko) || hasTag(unit, "npi", "negative_polarity");
	const isShortAn = ko === "안";
	const isShortMot = ko === "못" || state.SHORT_INABILITY_WORDS.has(ko);
	const isManner = state.MANNER_ADVERBS.has(ko) || hasTag(unit, K.MANNER, K.ADVERB_MANNER);
	const isDegree = state.DEGREE_ADVERBS.has(ko) && !isManner;
	const isDiscourse = state.DISCOURSE_ADVERBS.has(ko) || hasTag(unit, K.DISCOURSE, "conjunction");
	const isQuestionWord = hasTag(unit, K.QUESTION_WORD, K.INTERROGATIVE);
	const pol = getTemporalPolarity(unit);
	if (pol) tense = pol;
	if ((new Set(["가끔", "자주", "항상", "보통", "매일", "매주", "매달", "매년"])).has(ko) && tense === K.FUTURE && !options.tense) {
		tense = K.PRESENT;
	}
	const isAdvNeg = isNPI || isShortAn || isShortMot;
	const requiresVolitionOrFreq = (new Set(["가끔", "자주", "항상", "매달", "매주", "매년", "날마다", "매일", "열심히", "천천히", "빨리"])).has(ko);
	const isDailyHabit = (new Set(["날마다", "매일"])).has(ko);

	const avs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(v => {
		const k = v[DATA_SCHEMA.Korean] || "";
		if (k.includes(" ")) return false;
		if (k === "때리다" && v[DATA_SCHEMA.Id] !== targetId) return false;
		if (state.FORBIDDEN_NEGATIVE_ROOTS.has(k)) return false;
		if (isAdvNeg && (k.endsWith("있다") || k.endsWith("알다"))) return false;
		if (requiresVolitionOrFreq && (hasTag(v, "involuntary", "passive") || (new Set(["터지다", "내리다", "끓다", "식다", "말다", "사먹다", "여쭙다"])).has(k))) return false;
		if (isDailyHabit && (new Set(["알아보다", "고치다", "물어보다", "키우다", "이사하다", "입학하다", "졸업하다", "결혼하다", "세다", "빌리다", "바꾸다"])).has(k)) return false;
		if (typeof canAdverbPrecede === 'function' && !canAdverbPrecede(unit, v, { isNegative: isAdvNeg, tense })) return false;
		return true;
	});
	const dvs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId).filter(v => {
		const k = v[DATA_SCHEMA.Korean] || "";
		if (k.includes(" ")) return false;
		if (state.FORBIDDEN_NEGATIVE_ROOTS.has(k)) return false;
		if (isAdvNeg && (k.endsWith("있다") || k.endsWith("알다"))) return false;
		if (tense !== K.PAST && (new Set(["잘생기다", "못생기다", "오래되다"])).has(k)) return false;
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
	} else if ((new Set(["모두", "다"])).has(ko)) {
		const pluralPool = getAllUnitsOfPos(K.PRONOUN, options, targetId).filter(p => (new Set(["우리", "저희"])).has(p[DATA_SCHEMA.Korean]));
		const pluralNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => isPluralSubjectUnit(n));
		subj = pickRandom([...pluralPool, ...pluralNouns]) || selectSubjectUnit(options, targetId, false);
	} else if (!isAction) {
		const dvSubjs = filterBySet(getSubjectCandidatesForDescriptiveVerb(chosenVerb), options, targetId).filter(u => u[DATA_SCHEMA.Id] !== 361 && !hasTag(u, K.QUESTION_WORD, K.INTERROGATIVE) && !(new Set(["누구", "누가", "무엇", "뭐", "언제", "어디"])).has(u[DATA_SCHEMA.Korean]));
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
		const subjParticle = isQuestionWord ? K.SUBJECT : K.TOPIC;
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

	const polarity = (isNPI || isShortAn || isShortMot || ko === "아직") ? K.NEGATIVE : K.AFFIRMATIVE;
	const negationType = isShortMot ? "short_mot" : (polarity === K.NEGATIVE ? "short_an" : null);
	const speechAct = isQuestionWord ? K.INTERROGATIVE : K.DECLARATIVE;

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
					role: K.PREDICATE,
					predType: isAction ? K.ACTION : K.DESCRIPTIVE,
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

	const isNegativeGrammar = hasTag(grammarUnit, K.NEGATIVE, K.INABILITY, K.PROHIBITION) || formulas.some(f => f.includes("못") || f.includes("안"));
	const isInability = hasTag(grammarUnit, K.INABILITY) || formulas.some(f => f.includes("못"));
	const isImperativeOrPropositive = hasTag(grammarUnit, K.IMPERATIVE, K.PROPOSITIVE);
	const avs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(v => {
		if (isNegativeGrammar && state.FORBIDDEN_NEGATIVE_ROOTS.has(v[DATA_SCHEMA.Korean])) return false;
		if (isInability && !canTakeMood(v, K.INABILITY)) return false;
		if (isImperativeOrPropositive && !canTakeMood(v, K.IMPERATIVE)) return false;
		return true;
	});
	const dvs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId).filter(v => {
		if (isNegativeGrammar && state.FORBIDDEN_NEGATIVE_ROOTS.has(v[DATA_SCHEMA.Korean])) return false;
		return true;
	});
	const nouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => !hasTag(n, K.MEASUREWORD, K.COUNTER) && n[DATA_SCHEMA.Korean] !== "이");

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

	const isInterrogative = formula.includes("?") || hasTag(grammarUnit, K.INTERROGATIVE);
	const speechAct = isInterrogative ? K.INTERROGATIVE
		: hasTag(grammarUnit, K.IMPERATIVE) ? K.IMPERATIVE
			: hasTag(grammarUnit, K.PROPOSITIVE) ? K.PROPOSITIVE
				: K.DECLARATIVE;

	const tense = hasTag(grammarUnit, K.PAST, "temporal_past") ? K.PAST
		: hasTag(grammarUnit, K.FUTURE, "temporal_future") ? K.FUTURE
			: K.PRESENT;
	const politeness = hasTag(grammarUnit, K.FORMAL_HIGH, "formal_polite") ? K.FORMAL_HIGH
		: hasTag(grammarUnit, "plain_style") ? "plain"
			: hasTag(grammarUnit, K.INFORMAL) ? "intimate"
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
				if (hasTag(a, K.DISCOURSE, "conjunction", K.CONNECTIVE, "greeting", "interjection", "exclamation", "hesitation", K.TIME, "temporal", K.QUESTION_WORD, K.INTERROGATIVE, K.DEMONSTRATIVE, "concessive", "approximation", "number_unit")) return false;
				if ((new Set(["그렇게", "이렇게", "저렇게", "다함께", "따로"])).has(aKo)) return false;
				if (isImperativeOrPropositive && parseSemanticData(a).target_pos === K.DESCRIPTIVE_VERB) return false;
				return true;
			});
			const cleanAVs = avs.filter(v => {
				const vKo = v[DATA_SCHEMA.Korean];
				return !vKo.includes(" ") && !(new Set(["죽다", "걸리다", "지내다", "빌리다", "들다", "되다", "나다", "태어나다", "줄다", "늘다", "걱정되다", "들어주다", "대다", "도와드리다", "여쭙다"])).has(vKo) && !hasTag(v, "involuntary");
			});
			const cleanDVs = dvs.filter(v => {
				const vKo = v[DATA_SCHEMA.Korean];
				return !(new Set(["비슷하다", "다르다", "같다", "이다", "아니다", "태어나다", "줄다", "늘다", "걱정되다", "어떻다", "어떠하다", "어울리다", "오랜만이다", "행복하다", "외롭다", "불안하다", "부끄럽다", "슬프다", "기쁘다", "즐겁다", "부럽다", "그립다", "무섭다", "힘들다", "졸리다", "창피하다", "심심하다"])).has(vKo)
					&& !hasTag(v, K.DEMONSTRATIVE, K.QUESTION_WORD, K.INTERROGATIVE, "greeting", K.DISCOURSE)
					&& !(tense !== K.PAST && (new Set(["잘생기다", "못생기다", "오래되다"])).has(vKo));
			});
			const advPool = cleanAdverbCandidates.length > 0 ? cleanAdverbCandidates : getAllUnitsOfPos(K.POS_ADVERB, options, targetId).filter(a => a[DATA_SCHEMA.PartofSpeech] === K.POS_ADVERB);
			const chosenAdv = pickRandom(advPool);
			const advTargetPos = chosenAdv ? parseSemanticData(chosenAdv).target_pos : null;
			const advIsManner = chosenAdv && (state.MANNER_ADVERBS.has(chosenAdv[DATA_SCHEMA.Korean]) || hasTag(chosenAdv, K.MANNER, K.ADVERB_MANNER));
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
					if (arg.role !== K.SUBJECT) {
						const subj = selectSubjectUnit(options, targetId, false);
						if (subj) {
							mainClauseConstituents.push({
								role: K.TOPIC,
								nounUnit: subj,
								particleType: K.TOPIC
							});
						}
					}
					if (arg.nounUnit) {
						mainClauseConstituents.push({
							role: arg.role,
							nounUnit: arg.nounUnit,
							particleType: arg.particleType
						});
						if (arg.particleType === "location_static" && (new Set(["놓다", "올려놓다", "두다", "담다", "넣다"])).has(mainVerb[DATA_SCHEMA.Korean])) {
							const objCands = filterBySet(getNounCandidatesForVerb(mainVerb), options, targetId).filter(n => !hasTag(n, K.MEASUREWORD, K.COUNTER, K.PLACE, K.FACILITY, "building", "furniture", K.VEHICLE, K.PROPER_NOUN));
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
						n => !isColloquialAdv || (!isElderNoun(n) && !(new Set(["할아버지", "할머니"])).has(n[DATA_SCHEMA.Korean]))
					);
					const subj = pickRandom(dvSubjPool.length > 0 ? dvSubjPool : filterBySet(getSubjectCandidatesForDescriptiveVerb(mainVerb), options, targetId));
					if (subj) {
						mainClauseConstituents.push({
							role: K.SUBJECT,
							nounUnit: subj,
							particleType: K.SUBJECT
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
					role: K.PREDICATE,
					predType: isAction ? K.ACTION : K.DESCRIPTIVE,
					verbUnit: mainVerb,
					tense,
					politeness,
					speechAct,
					polarity: isNegativeGrammar ? K.NEGATIVE : K.AFFIRMATIVE
				};
			}
			clauses.push({ constituents: mainClauseConstituents, predicate: mainPred });
		} else {
			const subRes = expandFormulaIntoClause(subFormula, grammarUnit, tense, politeness, options, targetId, true);
			const EXCLUDED_CAUSAL_MAIN_VERBS = new Set(["돌아가시다", "기뻐하다", "몸이 떨리다"]);
			const subSubjCon = (subRes && Array.isArray(subRes.constituents))
				? subRes.constituents.find(c => (c.role === K.SUBJECT || c.role === K.TOPIC) && (c.nounUnit || c.unit))
				: null;
			const subSubjUnit = subSubjCon ? (subSubjCon.nounUnit || subSubjCon.unit) : null;
			const subSubjIsHuman = Boolean(subSubjUnit && (
				subSubjUnit[DATA_SCHEMA.PartofSpeech] === K.PRONOUN
				|| hasTag(subSubjUnit, K.PERSON, K.FAMILY, K.PROFESSION, "subject_animate")
			));
			const isNominalReason = !subFormula.includes("VP_") && subFormula.includes("때문에");
			const isClauseReasonWithDV = subFormula.includes("때문에") && subRes && subRes.predicate && subRes.predicate.predType === K.DESCRIPTIVE;
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
						if (arg.role === K.SUBJECT && subSubjIsHuman) {
							reuseSubjHonorific = isElderNoun(subSubjUnit);
						} else {
							mainClauseConstituents.push({
								role: arg.role,
								nounUnit: arg.nounUnit,
								particleType: arg.particleType
							});
						}
					}
					if (subSubjIsHuman && (arg.role !== K.SUBJECT || !arg.nounUnit)) {
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
								role: K.SUBJECT,
								nounUnit: subj,
								particleType: K.SUBJECT
							});
						}
					}
				}
				mainPred = {
					role: K.PREDICATE,
					predType: isAction ? K.ACTION : K.DESCRIPTIVE,
					verbUnit: mainVerb,
					tense,
					politeness,
					speechAct,
					polarity: K.AFFIRMATIVE,
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
			polarity: hasTag(grammarUnit, K.NEGATIVE, K.INABILITY, K.PROHIBITION) ? K.NEGATIVE : K.AFFIRMATIVE,
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

	const isInterrogative = formula.includes("?") || hasTag(grammarUnit, K.INTERROGATIVE);
	const isClauseNeg = hasTag(grammarUnit, K.NEGATIVE, K.INABILITY, K.PROHIBITION) || formula.includes("못") || formula.includes("안");
	const isClauseInability = hasTag(grammarUnit, K.INABILITY) || formula.includes("못");
	const isClauseImperative = hasTag(grammarUnit, K.IMPERATIVE);
	const isClausePropositive = hasTag(grammarUnit, K.PROPOSITIVE);
	const avs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(v => {
		if (v[DATA_SCHEMA.Id] === targetId) return true;
		if (!isInterrogative && hasTag(v, K.QUESTION_WORD, K.INTERROGATIVE)) return false;
		if (isClauseNeg && state.FORBIDDEN_NEGATIVE_ROOTS.has(v[DATA_SCHEMA.Korean])) return false;
		if (isClauseInability && !canTakeMood(v, K.INABILITY)) return false;
		if (isClauseImperative && !canTakeMood(v, K.IMPERATIVE)) return false;
		if (isClausePropositive && !canTakeMood(v, K.PROPOSITIVE)) return false;
		if ((isClausePropositive || isClauseImperative) && (new Set(["전화가 오다", "화가 나다", "비가 오다", "눈이 오다", "바람이 불다", "못하다", "잘하다", "방학하다", "나빠하다", "좋아하다", "싫어하다", "부러워하다", "슬퍼하다", "기뻐하다", "결석하다", "지각하다", "실수하다", "잊어버리다", "잃어버리다", "넘어지다", "때리다"])).has(v[DATA_SCHEMA.Korean])) return false;
		if (isClausePropositive && ((new Set(["오다", "올라오다", "내려오다", "들어오다", "나오다", "돌아오다"])).has(v[DATA_SCHEMA.Korean]) || state.HONORIFIC_WORDS.has(v[DATA_SCHEMA.Korean]) || hasTag(v, K.HONORIFIC, "honorificVerb"))) return false;
		return true;
	});
	const dvs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId).filter(v => {
		if (v[DATA_SCHEMA.Id] === targetId) return true;
		if (!isInterrogative && hasTag(v, K.QUESTION_WORD, K.INTERROGATIVE)) return false;
		if (isClauseNeg && state.FORBIDDEN_NEGATIVE_ROOTS.has(v[DATA_SCHEMA.Korean])) return false;
		if (tense !== K.PAST && (new Set(["잘생기다", "못생기다", "오래되다"])).has(v[DATA_SCHEMA.Korean])) return false;
		return true;
	});
	const allNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
		n => !hasTag(n, K.MEASUREWORD, K.COUNTER)
			&& n[DATA_SCHEMA.Korean] !== "이"
			&& !(hasTag(n, "colloquial") && parseSemanticData(n).polarity === -1)
			&& (isInterrogative || (!hasTag(n, K.QUESTION_WORD, K.INTERROGATIVE) && !(new Set(["얼마", "누구", "무엇", "뭐", "어디", "언제", "몇", "며칠"])).has(n[DATA_SCHEMA.Korean])))
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
				if (arg.nounUnit && !((isClausePropositive || isClauseImperative) && arg.role === K.SUBJECT)) {
					const cVerbKo = chosenVerb[DATA_SCHEMA.Korean];
					const isDativeArg = arg.particleType === K.DATIVE || arg.role === K.RECIPIENT || arg.role === K.DATIVE;
					let finalArgNoun = arg.nounUnit;
					if (isDativeArg && !cVerbKo.includes("드리") && cVerbKo !== "여쭙다" && isElderNoun(finalArgNoun)) {
						const nonElders = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (new Set(["친구", "동생", "남동생", "여동생", "학생", "아이"])).has(n[DATA_SCHEMA.Korean]));
						if (nonElders.length > 0) finalArgNoun = pickRandom(nonElders, options.seedOffset, options);
					}
					constituents.push({
						role: arg.role,
						nounUnit: finalArgNoun,
						particleType: arg.particleType
					});
					if (isDativeArg && (new Set(["가르치다", "주다", "드리다", "보내다", "선물하다", "빌려주다"])).has(cVerbKo)) {
						let objCands = cVerbKo === "가르치다"
							? getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => !hasTag(n, K.MEASUREWORD, K.COUNTER, K.PERSON, K.PLACE, K.PROPER_NOUN) && (hasTag(n, "language", K.ACADEMIC, "hobby", "sport") || (new Set(["한국어", "영어", "일본어", "중국어", "요리", "노래", "운전", "컴퓨터", "수영", "태권도", "말"])).has(n[DATA_SCHEMA.Korean])))
							: filterBySet(getNounCandidatesForVerb(chosenVerb), options, targetId).filter(n => !hasTag(n, K.MEASUREWORD, K.COUNTER, K.PERSON, K.PLACE, K.PROPER_NOUN));
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
						role: K.SUBJECT,
						nounUnit: subj,
						particleType: K.SUBJECT
					});
				}
			}

			if (!hasMoreTokens && restOfFormula.length > 0) {
				const fullSuffix = suffix + " " + restOfFormula;
				predicate = {
					role: K.PREDICATE,
					predType: isAction ? K.ACTION : K.DESCRIPTIVE,
					verbUnit: chosenVerb,
					grammarUnit,
					connectiveSuffix: fullSuffix,
					tense,
					politeness
				};
				break;
			} else {
				const predNode = {
					role: K.PREDICATE,
					predType: isAction ? K.ACTION : K.DESCRIPTIVE,
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
					n => (new Set(["마리", "민수", "지훈", "수진", "영수", "유키", "올리비아", "미진", "리타오", "흐엉", "에릭", "민준"])).has(n[DATA_SCHEMA.Korean])
						|| (hasTag(n, "properNoun", K.PROPER_NOUN) && hasTag(n, K.PERSON))
				);
				if (personalNames.length > 0) pool = personalNames;
			} else {
				const isHonParticle = hasTag(grammarUnit, K.HONORIFIC) || (grammarUnit[DATA_SCHEMA.Korean] || "").includes("께서") || (grammarUnit[DATA_SCHEMA.Korean] || "").includes("께");
				if (isHonParticle) {
					const elders = allNouns.filter(
						n => isElderNoun(n)
							&& hasTag(n, K.PERSON, K.FAMILY, K.PROFESSION, "kinship_elder", "elder", K.ELDER_NOUN, "honorific_person")
							&& !(new Set(["말씀", "진지", "연세", "성함", "생신", "댁", "병환", "약주"])).has(n[DATA_SCHEMA.Korean])
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
					hasTag(n, K.PROFESSION, "job", "status", "role", "nationality", K.OBJECT, K.FOOD, "animal", "fruit")
					&& !hasTag(n, "name")
					&& !(hasTag(n, "colloquial") && parseSemanticData(n).polarity === -1)
				);
				if (copulaNouns.length > 0) pool = copulaNouns;
			}

			const chosenNoun = pickRandom(pool) || allNouns[0];
			if (!chosenNoun) continue;

			if (isCopulaEnding) {
				const fullCopula = resolvePureMorphology(chosenNoun[DATA_SCHEMA.Korean] + suffix + (restOfFormula ? " " + restOfFormula : ""), state);
				const isHumanComp = hasTag(chosenNoun, K.PERSON, K.PROFESSION, "job", "status", "role", "nationality");
				let subj = null;
				if (isHumanComp) {
					const humanPronouns = getAllUnitsOfPos(K.PRONOUN, options, targetId).filter(p => (new Set(["저", "나", "우리"])).has(p[DATA_SCHEMA.Korean]));
					subj = pickRandom(humanPronouns) || selectSubjectUnit(options, targetId, false);
				} else {
					const thingPronouns = getAllUnitsOfPos(K.PRONOUN, options, targetId).filter(p => (new Set(["이것", "그것", "저것", "이거", "그거", "저거"])).has(p[DATA_SCHEMA.Korean]));
					subj = pickRandom(thingPronouns);
				}
				if (subj && subj[DATA_SCHEMA.Id] !== chosenNoun[DATA_SCHEMA.Id]) {
					constituents.push({
						role: K.TOPIC,
						nounUnit: subj,
						particleType: K.TOPIC
					});
				}
				predicate = {
					role: K.PREDICATE,
					predType: K.COPULA,
					copulaNounUnit: chosenNoun,
					grammarUnit,
					explicitSurfaceKo: fullCopula,
					polarity: restOfFormula.includes("아니") ? K.NEGATIVE : K.AFFIRMATIVE,
					tense,
					politeness
				};
				break;
			} else {
				const gKo = grammarUnit[DATA_SCHEMA.Korean] || "";
				const inferredRole = (hasTag(grammarUnit, K.TOPIC) || suffix.includes("은/는")) ? K.TOPIC
					: (hasTag(grammarUnit, K.SUBJECT) || suffix.includes("이/가") || suffix.includes("께서")) ? K.SUBJECT
					: (hasTag(grammarUnit, K.OBJECT) || suffix.includes("을/를")) ? K.OBJECT
					: (hasTag(grammarUnit, K.DATIVE) || suffix.includes("에게") || suffix.includes("한테") || suffix === "께") ? K.RECIPIENT
					: (tag === K.PLACE || hasTag(grammarUnit, K.LOCATION, "location_action", K.DIRECTION, "directional")) ? K.LOCATION
					: (tag === K.TIME || hasTag(grammarUnit, K.TIME, "temporal")) ? K.TIME
					: "noun_phrase";
				const inferredParticleType = inferredRole === K.LOCATION
					? (suffix.includes("에서") ? "location_dynamic" : "location_static")
					: (inferredRole === K.RECIPIENT ? K.DATIVE : (inferredRole !== "noun_phrase" ? inferredRole : null));

				const isSsiPattern = grammarUnit[DATA_SCHEMA.Korean] === "씨" || targetId === 23;
				const ssiParticle = isSsiPattern && !hasMoreTokens ? "가" : "";
				const finalInferredRole = isSsiPattern && !hasMoreTokens ? K.SUBJECT : inferredRole;
				const finalInferredParticleType = isSsiPattern && !hasMoreTokens ? K.SUBJECT : inferredParticleType;
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
								role: K.SUBJECT,
								nounUnit: fig,
								particleType: K.SUBJECT
							});
						}
						predicate = {
							role: K.PREDICATE,
							predType: K.DESCRIPTIVE,
							verbUnit: existUnit,
							tense: K.PRESENT,
							politeness: "polite",
							polarity: restOfFormula === "없어요" ? K.NEGATIVE : K.AFFIRMATIVE
						};
						break;
					}
				}
			}
		} else if (tokenType.startsWith("Adv")) {
			const advUnit = selectAdverbUnit(false, K.AFFIRMATIVE, options, targetId);
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
						role: K.PREDICATE,
						predType: K.ACTION,
						verbUnit: countVerb,
						grammarUnit,
						connectiveSuffix: "자",
						tense: K.PRESENT,
						politeness: "plain",
						speechAct: K.PROPOSITIVE
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
						role: K.TOPIC,
						nounUnit: sub,
						particleType: K.TOPIC
					});
				}
				const transitiveAvs = avs.filter(v => !isIntransitiveVerb(v) && getVerbParticleType(v) === K.OBJECT);
				const av = selectActionVerbForNoun(baseNoun, options, targetId) || pickRandom(transitiveAvs) || pickRandom(avs);
				if (av) {
					predicate = {
						role: K.PREDICATE,
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
					if ((new Set(["잘생기다", "못생기다", "오래되다"])).has(chosenV[DATA_SCHEMA.Korean]) && !options.tense) {
						tense = K.PAST;
					}
					const isAct = chosenV[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB;
					if (isAct && (role === K.TOPIC || role === K.SUBJECT)) {
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
						role: K.PREDICATE,
						predType: isAct ? K.ACTION : K.DESCRIPTIVE,
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
					role: K.PREDICATE,
					predType: K.COPULA,
					copulaNounUnit: lastNoun,
					tense: K.PRESENT,
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
