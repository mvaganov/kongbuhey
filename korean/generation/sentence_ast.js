(function() {
/**
 * korean/generation/sentence_ast.js
 *
 * Structured Sentence Abstract Syntax Tree (SentenceAST) & Surface Korean Realizer.
 *
 * Provides:
 * 1. Dynamic Grammar Unit Registry (maps particles, verbal endings, auxiliaries,
 *    copulas, and clausal connectives to their canonical Language Units in data.js
 *    with zero hardcoded magic IDs).
 * 2. Declarative AST node builders (SentenceAST, ClauseAST, ConstituentNode, PredicateNode).
 * 3. Eojeol & Morpheme-Segment Provenance Engine:
 *    Splits every Korean surface word (eojeol) into exact stem + particle/ending segments
 *    where `segments.map(s => s.textKo).join('') === eojeol.surfaceKo`, enabling each
 *    Hangul word/morpheme and English literal token to act as an interactive Language Unit button.
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
	getStem,
	hasBatchim
} = (typeof require !== 'undefined' ? require('../core/primitives.js') : window);

const {
	resolvePureMorphology,
	getConjugatedStem
} = (typeof require !== 'undefined' ? require('../core/stem_engine.js') : window);

const {
	applyMorphology,
	attachParticle,
	conjugatePredicate,
	buildNegatedPredicate,
	buildMoodPredicate,
	isElderNoun,
	isDeicticTimeWord,
	getHonorificVerb,
	getHumbleVerb,
	getHonorificNoun,
	getVerbUnit,
	getNounUnit
} = (typeof require !== 'undefined' ? require('../core/morphology.js') : window);

const {
	getPronunciation
} = (typeof require !== 'undefined' ? require('../phonetics/pronunciation.js') : window);

const {
	realizeLiteralEnglish
} = (typeof require !== 'undefined' ? require('../translation/literal_realizer.js') : window);

const {
	realizeNaturalEnglish
} = (typeof require !== 'undefined' ? require('../translation/natural_realizer.js') : window);

let cachedGrammarRegistry = null;
let cachedGrammarUnitsRef = null;

/**
 * Dynamically indexes particle, ending, copula, modality, and connective Grammar units
 * from data.js without any hardcoded numeric IDs.
 */
function getGrammarRegistry() {
	const units = dataModule.KR_EN_languageUnits || (typeof window !== 'undefined' ? window.KR_EN_languageUnits : []);
	if (cachedGrammarRegistry && cachedGrammarUnitsRef === units && units.length > 0) {
		return cachedGrammarRegistry;
	}

	const getWords = dataModule.getWords || (typeof window !== 'undefined' ? window.getWords : () => []);
	const grammars = getWords("Grammar") || [];

	const findG = (predicate) => grammars.find(g => g && predicate(g)) || null;

	const particles = {
		topic: findG(g => hasTag(g, "particle") && hasTag(g, "topic") && !hasTag(g, "honorific")),
		topic_honorific: findG(g => hasTag(g, "particle") && hasTag(g, "topic") && hasTag(g, "honorific")),
		subject: findG(g => hasTag(g, "particle") && hasTag(g, "subject") && !hasTag(g, "honorific")),
		subject_honorific: findG(g => hasTag(g, "particle") && hasTag(g, "subject") && hasTag(g, "honorific") && !hasTag(g, "topic")),
		object: findG(g => hasTag(g, "particle") && hasTag(g, "object")),
		location_static: findG(g => hasTag(g, "particle") && hasTag(g, "location")),
		location_dynamic: findG(g => hasTag(g, "particle") && hasTag(g, "location_action")),
		direction: findG(g => hasTag(g, "particle") && hasTag(g, "direction")),
		direction_ro: findG(g => hasTag(g, "particle") && hasTag(g, "directional")),
		instrumental: findG(g => hasTag(g, "particle") && hasTag(g, "instrumental")),
		time: findG(g => hasTag(g, "particle") && hasTag(g, "time") && !hasTag(g, "starting_point") && !hasTag(g, "duration")),
		dative: findG(g => hasTag(g, "particle") && hasTag(g, "dative") && !hasTag(g, "honorific")),
		dative_honorific: findG(g => hasTag(g, "particle") && hasTag(g, "dative") && hasTag(g, "honorific")),
		comitative: findG(g => hasTag(g, "particle") && (hasTag(g, "comitative") || g[DATA_SCHEMA.Korean].includes("와 / 과") || g[DATA_SCHEMA.Korean].includes("(이)랑"))),
		possessive: findG(g => hasTag(g, "particle") && hasTag(g, "possessive")),
		also: findG(g => hasTag(g, "particle") && hasTag(g, "also")),
		exclusive: findG(g => hasTag(g, "particle") && hasTag(g, "exclusive")),
		comparison: findG(g => hasTag(g, "particle") && hasTag(g, "comparison") && !hasTag(g, "degree")),
		from: findG(g => hasTag(g, "particle") && hasTag(g, "starting_point")),
		until: findG(g => hasTag(g, "particle") && hasTag(g, "endpoint")),
		each: findG(g => hasTag(g, "particle") && g[DATA_SCHEMA.Korean] === "마다")
	};

	const endings = {
		polite_present: findG(g => hasTag(g, "verbal_ending") && hasTag(g, "present") && !hasTag(g, "honorific") && g[DATA_SCHEMA.Korean].includes("아요")),
		formal_present: findG(g => hasTag(g, "verbal_ending") && hasTag(g, "present") && g[DATA_SCHEMA.Korean].includes("습니다")),
		polite_past: findG(g => hasTag(g, "past") && g[DATA_SCHEMA.Korean].includes("았/었어요")),
		formal_past: findG(g => hasTag(g, "past") && g[DATA_SCHEMA.Korean].includes("았/었습니다")),
		polite_future: findG(g => hasTag(g, "future") && g[DATA_SCHEMA.Korean].includes("거예요")),
		polite_imperative: findG(g => hasTag(g, "imperative") && g[DATA_SCHEMA.Korean].includes("세요") && !hasTag(g, "prohibition")),
		formal_imperative: findG(g => hasTag(g, "imperative") && g[DATA_SCHEMA.Korean].includes("십시오") && !hasTag(g, "prohibition")),
		plain_imperative: findG(g => hasTag(g, "imperative") && hasTag(g, "plain_style")),
		polite_prohibitive: findG(g => hasTag(g, "prohibition") && g[DATA_SCHEMA.Korean].includes("마세요")),
		formal_prohibitive: findG(g => hasTag(g, "prohibition") && g[DATA_SCHEMA.Korean].includes("마십시오")),
		plain_prohibitive: findG(g => hasTag(g, "prohibition") && hasTag(g, "informal")),
		plain_propositive: findG(g => hasTag(g, "propositive") && g[DATA_SCHEMA.Korean].includes("자")),
		formal_propositive: findG(g => hasTag(g, "propositive") && g[DATA_SCHEMA.Korean].includes("ㅂ시다")),
		polite_suggestion: findG(g => hasTag(g, "suggestion") && g[DATA_SCHEMA.Korean].includes("까요")),
		plain_declarative: findG(g => hasTag(g, "plain_style") && g[DATA_SCHEMA.Korean].includes("ㄴ다")),
		intimate_declarative: findG(g => hasTag(g, "informal") && g[DATA_SCHEMA.Korean].includes("-아/어")),
		formal_interrogative: findG(g => hasTag(g, "interrogative") && g[DATA_SCHEMA.Korean].includes("습니까")),
		polite_interrogative_na: findG(g => hasTag(g, "interrogative") && g[DATA_SCHEMA.Korean].includes("나요")),
		honorific_infix: findG(g => hasTag(g, "honorific") && g[DATA_SCHEMA.Korean].includes("시"))
	};

	const modals = {
		desire: findG(g => hasTag(g, "desire") && g[DATA_SCHEMA.Korean].includes("고 싶다")),
		ability: findG(g => hasTag(g, "ability") && g[DATA_SCHEMA.Korean].includes("수 있다")),
		inability: findG(g => hasTag(g, "inability") && g[DATA_SCHEMA.Korean].includes("수 없다")),
		inability_mot: findG(g => hasTag(g, "inability") && g[DATA_SCHEMA.Korean].includes("못")),
		long_negation: findG(g => hasTag(g, "long_negation") && g[DATA_SCHEMA.Korean].includes("지 않다")),
		obligation: findG(g => hasTag(g, "obligation") && g[DATA_SCHEMA.Korean].includes("야 하다")),
		permission: findG(g => hasTag(g, "permission") && g[DATA_SCHEMA.Korean].includes("도 되다")),
		prohibition: findG(g => hasTag(g, "prohibition") && g[DATA_SCHEMA.Korean].includes("면 안 되다")),
		progressive: findG(g => hasTag(g, "progressive") && g[DATA_SCHEMA.Korean].includes("고 있다")),
		try_attempt: findG(g => hasTag(g, "attempt") && g[DATA_SCHEMA.Korean].includes("보다")),
		experience: findG(g => hasTag(g, "experience") && g[DATA_SCHEMA.Korean].includes("적이 있다")),
		promise: findG(g => hasTag(g, "promise") && g[DATA_SCHEMA.Korean].includes("ㄹ게요"))
	};

	const copulas = {
		polite: findG(g => g[DATA_SCHEMA.Korean].includes("이에요 / 예요")),
		formal: findG(g => g[DATA_SCHEMA.Korean] === "입니다"),
		plain: findG(g => g[DATA_SCHEMA.Korean].includes("이야 / 야")),
		negative: findG(g => g[DATA_SCHEMA.Korean].includes("아니에요"))
	};

	const connectives = {
		causal_aseo: findG(g => hasTag(g, "clausal_connective") && g[DATA_SCHEMA.Korean].includes("아/어서")),
		causal_nikka: findG(g => hasTag(g, "clausal_connective") && g[DATA_SCHEMA.Korean].includes("니까")),
		causal_ttaemune: findG(g => hasTag(g, "clausal_connective") && g[DATA_SCHEMA.Korean].includes("기 때문에")),
		conjunction_go: findG(g => hasTag(g, "clausal_connective") && g[DATA_SCHEMA.Korean] === "~고"),
		contrast_jiman: findG(g => hasTag(g, "clausal_connective") && g[DATA_SCHEMA.Korean].includes("지만")),
		condition_myeon: findG(g => hasTag(g, "clausal_connective") && g[DATA_SCHEMA.Korean].includes("면") && !g[DATA_SCHEMA.Korean].includes("면서")),
		background_neunde: findG(g => hasTag(g, "clausal_connective") && g[DATA_SCHEMA.Korean].includes("는데")),
		simultaneous_myeonseo: findG(g => hasTag(g, "clausal_connective") && g[DATA_SCHEMA.Korean].includes("면서")),
		purpose_ryeogo: findG(g => hasTag(g, "clausal_connective") && g[DATA_SCHEMA.Korean].includes("려고")),
		purpose_reo: findG(g => hasTag(g, "clausal_connective") && g[DATA_SCHEMA.Korean].includes("러 가다")),
		immediate_jamaja: findG(g => hasTag(g, "clausal_connective") && g[DATA_SCHEMA.Korean].includes("자마자"))
	};

	cachedGrammarRegistry = { particles, endings, modals, copulas, connectives };
	cachedGrammarUnitsRef = units;
	return cachedGrammarRegistry;
}

/**
 * Resolves the canonical particle Grammar unit for a given particleType and options.
 */
function resolveParticleUnit(particleType, nounUnit = null, options = {}) {
	if (options.explicitParticleUnit) return options.explicitParticleUnit;
	const reg = getGrammarRegistry().particles;
	const isElder = options.honorific === true || (nounUnit && isElderNoun(nounUnit));

	switch (particleType) {
		case "topic":
			return (isElder && options.useHonorificTopic && reg.topic_honorific) ? reg.topic_honorific : reg.topic;
		case "subject":
		case "nominative":
			return (isElder && reg.subject_honorific) ? reg.subject_honorific : reg.subject;
		case "object":
		case "accusative":
		case "obj":
			return reg.object;
		case "location":
		case "location_static":
			return reg.location_static;
		case "location_dynamic":
			return reg.location_dynamic;
		case "direction":
			return reg.direction;
		case "direction_ro":
			return reg.direction_ro || reg.direction;
		case "instrumental":
		case "means":
			return reg.instrumental || reg.direction_ro;
		case "time":
		case "temporal":
			return reg.time || reg.location_static;
		case "dative":
		case "dative_person":
			return (isElder || options.dativeType === "honorific") ? (reg.dative_honorific || reg.dative) : reg.dative;
		case "comitative":
		case "companion":
			return reg.comitative;
		case "possessive":
			return reg.possessive;
		case "also":
			return reg.also;
		case "only":
		case "exclusive":
			return reg.exclusive;
		case "comparison":
			return reg.comparison;
		case "from":
			return reg.from;
		case "until":
			return reg.until;
		case "each":
			return reg.each;
		default:
			return null;
	}
}

/**
 * Resolves the canonical sentence-ending or modality Grammar unit for a predicate.
 */
function resolveEndingUnit(predSpec) {
	if (predSpec.grammarUnit) return predSpec.grammarUnit;
	if (predSpec.connectiveUnit) return predSpec.connectiveUnit;

	const reg = getGrammarRegistry();
	const {
		predType = "action",
		tense = "present",
		politeness = "polite",
		speechAct = "declarative",
		polarity = "affirmative",
		negationType = null,
		modality = null
	} = predSpec;

	if (predType === "copula") {
		if (polarity === "negative") return reg.copulas.negative || reg.copulas.polite;
		if (politeness === "formal_high") return reg.copulas.formal || reg.copulas.polite;
		if (politeness === "plain" || politeness === "intimate") return reg.copulas.plain || reg.copulas.polite;
		return reg.copulas.polite;
	}

	if (modality && reg.modals[modality]) {
		return reg.modals[modality];
	}

	if (polarity === "negative") {
		if (negationType === "long_ji_anta") return reg.modals.long_negation;
		if (negationType === "inability_su_eopda") return reg.modals.inability;
		if (negationType === "long_ji_mothada" || negationType === "short_mot") return reg.modals.inability_mot;
	}

	if (speechAct === "imperative") {
		if (polarity === "negative") {
			return politeness === "formal_high" ? reg.endings.formal_prohibitive : reg.endings.polite_prohibitive;
		}
		if (politeness === "formal_high") return reg.endings.formal_imperative;
		if (politeness === "plain") return reg.endings.plain_imperative;
		return reg.endings.polite_imperative;
	}

	if (speechAct === "propositive") {
		if (politeness === "formal_high") return reg.endings.formal_propositive;
		if (politeness === "polite") return reg.endings.polite_suggestion || reg.endings.formal_propositive;
		return reg.endings.plain_propositive;
	}

	if (tense === "past") {
		return politeness === "formal_high" ? reg.endings.formal_past : reg.endings.polite_past;
	}
	if (tense === "future") {
		return reg.endings.polite_future;
	}

	if (politeness === "formal_high") {
		return speechAct === "interrogative" ? (reg.endings.formal_interrogative || reg.endings.formal_present) : reg.endings.formal_present;
	}
	if (politeness === "plain") {
		return reg.endings.plain_declarative;
	}
	if (politeness === "intimate") {
		return reg.endings.intimate_declarative;
	}

	return reg.endings.polite_present;
}

/**
 * Helper to create a segment descriptor for an eojeol sub-token.
 */
function makeSegment(textKo, unit, kind = "lexical", role = null) {
	if (!unit) {
		return {
			textKo,
			unitId: null,
			koDict: textKo,
			enDict: "",
			pos: "Unknown",
			kind,
			role
		};
	}
	return {
		textKo,
		unitId: unit[DATA_SCHEMA.Id],
		koDict: unit[DATA_SCHEMA.Korean],
		enDict: unit[DATA_SCHEMA.English],
		pos: unit[DATA_SCHEMA.PartofSpeech],
		kind,
		role
	};
}

/**
 * Splits a single-word noun+particle surface string (e.g. "학생은", "내가", "학교에서")
 * into exact stem + particle segments that concatenate back to `surfaceKo`.
 */
function splitNounAndParticleSegments(surfaceKo, nounUnit, particleUnit, role) {
	if (!particleUnit) {
		return [makeSegment(surfaceKo, nounUnit, "lexical", role)];
	}
	if (!nounUnit) {
		return [makeSegment(surfaceKo, particleUnit, "particle", role)];
	}

	const nounKo = nounUnit[DATA_SCHEMA.Korean] || "";
	if (nounKo && surfaceKo.startsWith(nounKo) && surfaceKo.length > nounKo.length) {
		const stemPart = surfaceKo.slice(0, nounKo.length);
		const particlePart = surfaceKo.slice(nounKo.length);
		return [
			makeSegment(stemPart, nounUnit, "lexical", role),
			makeSegment(particlePart, particleUnit, "particle", role)
		];
	}

	// Contracted pronoun cases: 나+가 -> 내가, 저+가 -> 제가, 누구+가 -> 누가
	if ((surfaceKo === "내가" || surfaceKo === "제가" || surfaceKo === "누가") && surfaceKo.length === 2) {
		return [
			makeSegment(surfaceKo[0], nounUnit, "lexical", role),
			makeSegment(surfaceKo[1], particleUnit, "particle", role)
		];
	}

	if (surfaceKo === nounKo) {
		return [makeSegment(surfaceKo, nounUnit, "lexical", role)];
	}

	return [makeSegment(surfaceKo, nounUnit, "lexical", role)];
}

/**
 * Splits a single conjugated predicate word (e.g. "공부했어요", "먹습니다", "추워요", "학생이에요")
 * into [stemSegment, endingSegment] at the exact Hangul syllable boundary.
 */
function splitSingleVerbWordSegments(wordKo, headUnit, endingUnit, role = "predicate") {
	if (!endingUnit || !headUnit) {
		return [makeSegment(wordKo, headUnit || endingUnit, headUnit ? "lexical" : "grammar", role)];
	}

	const headKo = headUnit[DATA_SCHEMA.Korean] || "";
	const headPos = headUnit[DATA_SCHEMA.PartofSpeech] || "";

	// Copula: noun + 이에요/예요/입니다/이야/야
	if (headPos === "Noun" || headPos === "Pronoun") {
		if (headKo && wordKo.startsWith(headKo) && wordKo.length > headKo.length) {
			return [
				makeSegment(wordKo.slice(0, headKo.length), headUnit, "lexical", role),
				makeSegment(wordKo.slice(headKo.length), endingUnit, "grammar", role)
			];
		}
	}

	const rawStem = getStem(headKo);
	if (!rawStem) {
		return [makeSegment(wordKo, headUnit, "lexical", role)];
	}

	// Case 1: uncontracted stem is a strict prefix of wordKo (e.g. "먹" in "먹었어요", "가" in "가고")
	if (wordKo.startsWith(rawStem) && wordKo.length > rawStem.length) {
		return [
			makeSegment(wordKo.slice(0, rawStem.length), headUnit, "lexical", role),
			makeSegment(wordKo.slice(rawStem.length), endingUnit, "grammar", role)
		];
	}

	// Case 2: b_irregular glide expansion (e.g. 춥다 -> 추워요 / 추워서 / 추운)
	const conj = headUnit[DATA_SCHEMA.Conjugation] || "";
	const stemLen = rawStem.length;
	if (conj === "b_irregular" && wordKo.length > stemLen + 1) {
		const glideSyllable = wordKo[stemLen];
		if (/^[워와웠왔우운울]$/.test(glideSyllable)) {
			return [
				makeSegment(wordKo.slice(0, stemLen + 1), headUnit, "lexical", role),
				makeSegment(wordKo.slice(stemLen + 1), endingUnit, "grammar", role)
			];
		}
	}

	// Case 3: syllable-contracted stem (e.g. 공부하다 -> 공부했어요 [stemLen=3: "공부했" + "어요"],
	// 마시다 -> 마셨어요 [stemLen=2: "마셨" + "어요"], 가다 -> 갑니다/가요 [stemLen=1: "갑"+"니다", "가"+"요"])
	if (wordKo.length > stemLen) {
		return [
			makeSegment(wordKo.slice(0, stemLen), headUnit, "lexical", role),
			makeSegment(wordKo.slice(stemLen), endingUnit, "grammar", role)
		];
	}

	// Case 4: wordKo.length === stemLen (e.g. intimate panmal "공부해" where stemLen=3)
	if (wordKo.length === stemLen && stemLen > 1) {
		return [
			makeSegment(wordKo.slice(0, stemLen - 1), headUnit, "lexical", role),
			makeSegment(wordKo.slice(stemLen - 1), endingUnit, "grammar", role)
		];
	}

	return [makeSegment(wordKo, headUnit, "lexical", role)];
}

/**
 * Builds eojeol descriptors for a realized constituent.
 */
function buildConstituentEojeols(constituent, surfaceKo) {
	const words = surfaceKo.trim().split(/\s+/).filter(Boolean);
	if (words.length === 0) return [];

	const {
		role = "modifier",
		nounUnit = null,
		unit = null,
		determinerUnit = null,
		numberUnit = null,
		counterUnit = null,
		positionUnit = null,
		particleUnit = null
	} = constituent;

	const primaryUnit = nounUnit || unit;

	// 1. Counting phrase: e.g. "사과 세 개를" or "사과 세 개"
	if (counterUnit && words.length >= 2) {
		const eojeols = [];
		if (words.length >= 3 && primaryUnit) {
			eojeols.push({
				surfaceKo: words[0],
				role,
				headUnitId: primaryUnit[DATA_SCHEMA.Id],
				particleUnitId: null,
				unitIds: [primaryUnit[DATA_SCHEMA.Id]],
				segments: [makeSegment(words[0], primaryUnit, "lexical", role)]
			});
			const numWords = words.slice(1, -1);
			for (const nw of numWords) {
				const nId = numberUnit ? numberUnit[DATA_SCHEMA.Id] : null;
				eojeols.push({
					surfaceKo: nw,
					role: "number",
					headUnitId: nId,
					particleUnitId: null,
					unitIds: nId !== null ? [nId] : [],
					segments: [makeSegment(nw, numberUnit, "lexical", "number")]
				});
			}
			const lastWord = words[words.length - 1];
			const lastSegs = splitNounAndParticleSegments(lastWord, counterUnit, particleUnit, role);
			eojeols.push({
				surfaceKo: lastWord,
				role: "counter",
				headUnitId: counterUnit[DATA_SCHEMA.Id],
				particleUnitId: particleUnit ? particleUnit[DATA_SCHEMA.Id] : null,
				unitIds: lastSegs.map(s => s.unitId).filter(id => id !== null),
				segments: lastSegs
			});
			return eojeols;
		}
	}

	// 2. Spatial phrase: e.g. "책상 위에"
	if (positionUnit && words.length === 2 && primaryUnit) {
		const lastSegs = splitNounAndParticleSegments(words[1], positionUnit, particleUnit, role);
		return [
			{
				surfaceKo: words[0],
				role: "ground_noun",
				headUnitId: primaryUnit[DATA_SCHEMA.Id],
				particleUnitId: null,
				unitIds: [primaryUnit[DATA_SCHEMA.Id]],
				segments: [makeSegment(words[0], primaryUnit, "lexical", "ground_noun")]
			},
			{
				surfaceKo: words[1],
				role,
				headUnitId: positionUnit[DATA_SCHEMA.Id],
				particleUnitId: particleUnit ? particleUnit[DATA_SCHEMA.Id] : null,
				unitIds: lastSegs.map(s => s.unitId).filter(id => id !== null),
				segments: lastSegs
			}
		];
	}

	// 3. Determiner + Noun (+ Particle): e.g. "이 책을" or "이 미국 사람을"
	if (determinerUnit && words.length >= 2 && primaryUnit) {
		const nounWithParticle = words.slice(1).join(" ");
		const lastSegs = splitNounAndParticleSegments(nounWithParticle, primaryUnit, particleUnit, role);
		return [
			{
				surfaceKo: words[0],
				role: "determiner",
				headUnitId: determinerUnit[DATA_SCHEMA.Id],
				particleUnitId: null,
				unitIds: [determinerUnit[DATA_SCHEMA.Id]],
				segments: [makeSegment(words[0], determinerUnit, "lexical", "determiner")]
			},
			{
				surfaceKo: nounWithParticle,
				role,
				headUnitId: primaryUnit[DATA_SCHEMA.Id],
				particleUnitId: particleUnit ? particleUnit[DATA_SCHEMA.Id] : null,
				unitIds: lastSegs.map(s => s.unitId).filter(id => id !== null),
				segments: lastSegs
			}
		];
	}

	// 4. Standard single-unit constituent (including multi-word lexical lemmas like "미국 사람" or "가족 여행")
	if (!counterUnit && !positionUnit && !determinerUnit && primaryUnit) {
		const fullTrimmed = surfaceKo.trim();
		const segs = splitNounAndParticleSegments(fullTrimmed, primaryUnit, particleUnit, role);
		return [{
			surfaceKo: fullTrimmed,
			role,
			headUnitId: primaryUnit[DATA_SCHEMA.Id],
			particleUnitId: particleUnit ? particleUnit[DATA_SCHEMA.Id] : null,
			unitIds: segs.map(s => s.unitId).filter(id => id !== null),
			segments: segs
		}];
	}

	// 5. Fallback for explicit surface expressions without a single primaryUnit
	if (words.length === 1) {
		const segs = splitNounAndParticleSegments(words[0], primaryUnit, particleUnit, role);
		return [{
			surfaceKo: words[0],
			role,
			headUnitId: primaryUnit ? primaryUnit[DATA_SCHEMA.Id] : null,
			particleUnitId: particleUnit ? particleUnit[DATA_SCHEMA.Id] : null,
			unitIds: segs.map(s => s.unitId).filter(id => id !== null),
			segments: segs
		}];
	}

	// 5. Fallback for multi-word lexical expressions
	return words.map((w, idx) => {
		const isLast = idx === words.length - 1;
		const segs = isLast
			? splitNounAndParticleSegments(w, primaryUnit, particleUnit, role)
			: [makeSegment(w, primaryUnit, "lexical", role)];
		return {
			surfaceKo: w,
			role,
			headUnitId: primaryUnit ? primaryUnit[DATA_SCHEMA.Id] : null,
			particleUnitId: (isLast && particleUnit) ? particleUnit[DATA_SCHEMA.Id] : null,
			unitIds: segs.map(s => s.unitId).filter(id => id !== null),
			segments: segs
		};
	});
}

/**
 * Builds eojeol descriptors for a realized predicate (including multi-word auxiliaries/negations).
 */
function buildPredicateEojeols(predNode, surfaceKo) {
	const words = surfaceKo.trim().split(/\s+/).filter(Boolean);
	if (words.length === 0) return [];

	const headUnit = predNode.verbUnit || predNode.copulaNounUnit || null;
	const endingUnit = predNode.endingUnit || predNode.connectiveUnit || predNode.grammarUnit || null;
	const negUnit = predNode.negationUnit || null;

	// Single-word predicate (e.g., "공부했어요", "예뻐요", "학생이에요", "공부해서")
	if (words.length === 1) {
		const segs = splitSingleVerbWordSegments(words[0], headUnit, endingUnit, "predicate");
		return [{
			surfaceKo: words[0],
			role: "predicate",
			headUnitId: headUnit ? headUnit[DATA_SCHEMA.Id] : null,
			particleUnitId: null,
			grammarUnitId: endingUnit ? endingUnit[DATA_SCHEMA.Id] : null,
			unitIds: Array.from(new Set(segs.map(s => s.unitId).filter(id => id !== null))),
			segments: segs
		}];
	}

	// Multi-word predicate cases:
	// Case A: Short negation ("안 먹어요", "못 가요") where words[0] is "안" or "못"
	if (words.length === 2 && (words[0] === "안" || words[0] === "못") && negUnit) {
		const verbSegs = splitSingleVerbWordSegments(words[1], headUnit, endingUnit, "predicate");
		return [
			{
				surfaceKo: words[0],
				role: "negation",
				headUnitId: negUnit[DATA_SCHEMA.Id],
				particleUnitId: null,
				grammarUnitId: negUnit[DATA_SCHEMA.Id],
				unitIds: [negUnit[DATA_SCHEMA.Id]],
				segments: [makeSegment(words[0], negUnit, "grammar", "negation")]
			},
			{
				surfaceKo: words[1],
				role: "predicate",
				headUnitId: headUnit ? headUnit[DATA_SCHEMA.Id] : null,
				particleUnitId: null,
				grammarUnitId: endingUnit ? endingUnit[DATA_SCHEMA.Id] : null,
				unitIds: Array.from(new Set(verbSegs.map(s => s.unitId).filter(id => id !== null))),
				segments: verbSegs
			}
		];
	}

	// Case B: Auxiliary / Periphrastic construction (e.g. "공부하고 싶어요", "먹을 거예요", "먹지 않아요", "갈 수 있어요")
	// First word contains the main verb stem + linker, subsequent word(s) belong to the grammar/ending unit.
	const firstWordSegs = splitSingleVerbWordSegments(words[0], headUnit, endingUnit, "predicate");
	const eojeols = [{
		surfaceKo: words[0],
		role: "predicate",
		headUnitId: headUnit ? headUnit[DATA_SCHEMA.Id] : null,
		particleUnitId: null,
		grammarUnitId: endingUnit ? endingUnit[DATA_SCHEMA.Id] : null,
		unitIds: Array.from(new Set(firstWordSegs.map(s => s.unitId).filter(id => id !== null))),
		segments: firstWordSegs
	}];

	for (let i = 1; i < words.length; i++) {
		const w = words[i];
		const seg = makeSegment(w, endingUnit || headUnit, endingUnit ? "grammar" : "lexical", "predicate_aux");
		eojeols.push({
			surfaceKo: w,
			role: "predicate_aux",
			headUnitId: endingUnit ? endingUnit[DATA_SCHEMA.Id] : (headUnit ? headUnit[DATA_SCHEMA.Id] : null),
			particleUnitId: null,
			grammarUnitId: endingUnit ? endingUnit[DATA_SCHEMA.Id] : null,
			unitIds: seg.unitId !== null ? [seg.unitId] : [],
			segments: [seg]
		});
	}

	return eojeols;
}

/**
 * Realizes a single ConstituentNode into Korean surface text and eojeol descriptors.
 */
function realizeConstituentKo(constituent, clauseContext = {}) {
	if (!constituent) return { surfaceKo: "", eojeols: [] };

	const {
		role = "modifier",
		nounUnit = null,
		unit = null,
		determinerUnit = null,
		numberSurfaceKo = null,
		counterUnit = null,
		positionUnit = null,
		particleType = null,
		explicitSurfaceKo = null
	} = constituent;

	const primaryUnit = nounUnit || unit;
	const resolvedParticleUnit = constituent.particleUnit !== undefined
		? constituent.particleUnit
		: (particleType ? resolveParticleUnit(particleType, primaryUnit, clauseContext) : null);

	constituent.particleUnit = resolvedParticleUnit;

	let surfaceKo = "";
	if (explicitSurfaceKo) {
		surfaceKo = explicitSurfaceKo;
	} else if (counterUnit && primaryUnit) {
		const nounKo = primaryUnit[DATA_SCHEMA.Korean];
		const counterKo = counterUnit[DATA_SCHEMA.Korean];
		const numStr = numberSurfaceKo || "한";
		const counterWithParticle = particleType
			? attachParticle(counterUnit, particleType, clauseContext.verbUnit, clauseContext)
			: counterKo;
		surfaceKo = `${nounKo} ${numStr} ${counterWithParticle}`;
	} else if (positionUnit && primaryUnit) {
		const groundKo = primaryUnit[DATA_SCHEMA.Korean];
		const posWithParticle = particleType
			? attachParticle(positionUnit, particleType, clauseContext.verbUnit, clauseContext)
			: positionUnit[DATA_SCHEMA.Korean];
		surfaceKo = `${groundKo} ${posWithParticle}`;
	} else if (primaryUnit) {
		const baseWithParticle = particleType
			? attachParticle(primaryUnit, particleType, clauseContext.verbUnit, {
				...clauseContext,
				topic: particleType === "topic"
			})
			: primaryUnit[DATA_SCHEMA.Korean];
		if (determinerUnit) {
			surfaceKo = `${determinerUnit[DATA_SCHEMA.Korean]} ${baseWithParticle}`;
		} else {
			surfaceKo = baseWithParticle;
		}
	}

	// If time word is deictic and took no particle, clear particleUnit
	if ((particleType === "time" || particleType === "temporal") && primaryUnit && isDeicticTimeWord(primaryUnit)) {
		if (!surfaceKo.endsWith("에") && !surfaceKo.endsWith("은") && !surfaceKo.endsWith("는")) {
			constituent.particleUnit = null;
		}
	}

	surfaceKo = resolvePureMorphology(surfaceKo, state);
	constituent.surfaceKo = surfaceKo;
	const eojeols = buildConstituentEojeols(constituent, surfaceKo);
	constituent.eojeols = eojeols;
	return { surfaceKo, eojeols };
}

/**
 * Realizes a PredicateNode into Korean surface text and eojeol descriptors.
 */
function realizePredicateKo(predNode, clauseContext = {}) {
	if (!predNode) return { surfaceKo: "", eojeols: [] };

	let activeVerbUnit = predNode.verbUnit || null;
	const isElderSubj = predNode.honorific === true || clauseContext.honorific === true;
	const isElderRecip = clauseContext.recipientHonorific === true;

	// Apply honorific / humble verb suppletion automatically if applicable
	if (activeVerbUnit && isElderSubj) {
		const honKo = getHonorificVerb(activeVerbUnit);
		if (honKo) {
			const honUnit = getVerbUnit(honKo);
			if (honUnit) activeVerbUnit = honUnit;
		}
	} else if (activeVerbUnit && isElderRecip) {
		const humKo = getHumbleVerb(activeVerbUnit);
		if (humKo) {
			const humUnit = getVerbUnit(humKo);
			if (humUnit) activeVerbUnit = humUnit;
		}
	}
	predNode.verbUnit = activeVerbUnit;
	predNode.endingUnit = resolveEndingUnit(predNode);

	let surfaceKo = "";

	if (predNode.explicitSurfaceKo) {
		surfaceKo = resolvePureMorphology(predNode.explicitSurfaceKo, state);
	} else if (predNode.connectiveSuffix && activeVerbUnit) {
		const stem = getConjugatedStem(activeVerbUnit[DATA_SCHEMA.Korean], activeVerbUnit[DATA_SCHEMA.Conjugation]);
		surfaceKo = resolvePureMorphology(stem + predNode.connectiveSuffix, state);
	} else if (predNode.predType === "copula" && predNode.copulaNounUnit) {
		const nounKo = predNode.copulaNounUnit[DATA_SCHEMA.Korean];
		const hasB = hasBatchim(nounKo.slice(-1));
		if (predNode.polarity === "negative") {
			surfaceKo = `${nounKo}${hasB ? "이" : "가"} ${predNode.politeness === "formal_high" ? "아닙니다" : "아니에요"}`;
		} else if (predNode.tense === "past") {
			surfaceKo = `${nounKo}${hasB ? "이었어요" : "였어요"}`;
		} else if (predNode.politeness === "formal_high") {
			surfaceKo = `${nounKo}입니다`;
		} else if (predNode.politeness === "plain" || predNode.politeness === "intimate") {
			surfaceKo = `${nounKo}${hasB ? "이야" : "야"}`;
		} else {
			surfaceKo = `${nounKo}${hasB ? "이에요" : "예요"}`;
		}
	} else if (activeVerbUnit) {
		const politeness = predNode.politeness || "polite";
		const tense = predNode.tense || "present";
		const polarity = predNode.polarity || "affirmative";
		const modality = predNode.modality || null;
		const speechAct = predNode.speechAct || "declarative";
		const stem = getConjugatedStem(activeVerbUnit[DATA_SCHEMA.Korean], activeVerbUnit[DATA_SCHEMA.Conjugation]);

		if (modality === "desire") {
			surfaceKo = buildMoodPredicate(activeVerbUnit, "desire", politeness, {
				tense,
				person: clauseContext.person || (clauseContext.isThirdPerson ? 3 : 1)
			});
		} else if (modality === "ability") {
			const end = politeness === "formal_high" ? "수 있습니다" : politeness === "plain" ? "수 있다" : "수 있어요";
			surfaceKo = resolvePureMorphology(`${stem}으/ㄹ ${end}`, state);
		} else if (modality === "inability" || predNode.negationType === "inability_su_eopda") {
			const end = politeness === "formal_high" ? "수 없습니다" : politeness === "plain" ? "수 없다" : "수 없어요";
			surfaceKo = resolvePureMorphology(`${stem}으/ㄹ ${end}`, state);
		} else if (modality === "obligation") {
			const end = politeness === "formal_high" ? "야 합니다" : politeness === "plain" ? "야 한다" : "야 해요";
			surfaceKo = resolvePureMorphology(`${stem}아/어${end}`, state);
		} else if (modality === "permission") {
			const end = politeness === "formal_high" ? "도 됩니다" : politeness === "plain" ? "도 된다" : "도 돼요";
			surfaceKo = resolvePureMorphology(`${stem}아/어${end}`, state);
		} else if (modality === "prohibition") {
			const end = politeness === "formal_high" ? "면 안 됩니다" : politeness === "plain" ? "면 안 된다" : "면 안 돼요";
			surfaceKo = resolvePureMorphology(`${stem}으/${end}`, state);
		} else if (modality === "progressive") {
			const rawStem = getStem(activeVerbUnit[DATA_SCHEMA.Korean]);
			const end = politeness === "formal_high" ? "고 있습니다" : politeness === "plain" ? "고 있다" : "고 있어요";
			surfaceKo = `${rawStem}${end}`;
		} else if (modality === "try_attempt") {
			const end = tense === "past" ? "봤어요" : (politeness === "formal_high" ? "봅니다" : "봐요");
			surfaceKo = resolvePureMorphology(`${stem}아/어 ${end}`, state);
		} else if (modality === "experience") {
			const end = politeness === "formal_high" ? "적이 있습니다" : "적이 있어요";
			surfaceKo = resolvePureMorphology(`${stem}으/ㄴ ${end}`, state);
		} else if (modality === "promise") {
			surfaceKo = resolvePureMorphology(`${stem}으/ㄹ게요`, state);
		} else if (speechAct === "imperative") {
			surfaceKo = buildMoodPredicate(
				activeVerbUnit,
				polarity === "negative" ? "prohibition" : "imperative",
				politeness,
				{ tense }
			);
		} else if (speechAct === "propositive") {
			surfaceKo = buildMoodPredicate(activeVerbUnit, "propositive", politeness, { tense });
		} else if (polarity === "negative" && !state.FORBIDDEN_NEGATIVE_ROOTS.has(activeVerbUnit[DATA_SCHEMA.Korean]) && !["없다", "아니다", "모르다"].includes(activeVerbUnit[DATA_SCHEMA.Korean])) {
			const isLong = predNode.negationType === "long_ji_anta" || predNode.negationType === "long_ji_mothada";
			const isInability = predNode.negationType === "long_ji_mothada" || predNode.negationType === "short_mot";
			surfaceKo = buildNegatedPredicate(activeVerbUnit, {
				type: isLong ? "long" : "short",
				inability: isInability,
				formality: politeness,
				tense
			});
		} else {
			if (isElderSubj && !state.HONORIFIC_WORDS.has(activeVerbUnit[DATA_SCHEMA.Korean]) && !state.HUMBLE_WORDS.has(activeVerbUnit[DATA_SCHEMA.Korean])) {
				const honEnding = tense === "past"
					? (politeness === "formal_high" ? "으/셨습니다" : "으/셨어요")
					: (politeness === "formal_high" ? "으/십니다" : "으/세요");
				surfaceKo = resolvePureMorphology(stem + honEnding, state);
			} else {
				surfaceKo = conjugatePredicate(activeVerbUnit, politeness, tense, { honorific: isElderSubj });
			}
		}
	}

	if (/[?]$/.test(surfaceKo)) {
		predNode.speechAct = "interrogative";
	}
	const cleanPredKo = surfaceKo.replace(/[.?!~]+$/, '');
	predNode.surfaceKo = cleanPredKo;
	const eojeols = buildPredicateEojeols(predNode, cleanPredKo);
	predNode.eojeols = eojeols;
	return { surfaceKo: cleanPredKo, eojeols };
}

/**
 * Realizes a complete SentenceAST into surface Korean, pronunciation, eojeols,
 * morpheme segments, and ordered language unit provenance (`unitsUsed`, `unitIds`).
 */
function realizeKoreanFromAST(ast) {
	if (!ast || !Array.isArray(ast.clauses) || ast.clauses.length === 0) {
		return {
			ko: "",
			pronunciation: "",
			ast,
			eojeols: [],
			unitsUsed: [],
			unitIds: [],
			tree: []
		};
	}

	const allEojeols = [];
	const clauseStrings = [];

	for (let cIdx = 0; cIdx < ast.clauses.length; cIdx++) {
		const clause = ast.clauses[cIdx];
		const constituents = clause.constituents || [];
		const pred = clause.predicate || null;

		// Determine if subject/topic or recipient in this clause is an elder noun and grammatical person
		let isElderSubj = Boolean(clause.honorific || ast.honorific);
		let isElderRecip = false;
		let subjKo = "";

		for (const con of constituents) {
			const u = con.nounUnit || con.unit;
			if ((con.role === "subject" || con.role === "topic") && u) {
				subjKo = u[DATA_SCHEMA.Korean] || "";
				if (isElderNoun(u)) {
					isElderSubj = true;
				}
			}
			if (con.role === "recipient" && u && isElderNoun(u)) {
				isElderRecip = true;
			}
		}

		const isFirstOrSecond = ["나", "내", "저", "제", "우리", "저희", "너", "네", "당신", "자네", "너희", "여러분"].includes(subjKo);
		const isThirdPerson = !subjKo || !isFirstOrSecond;

		// If subject is elder and object is a plain noun with an honorific counterpart (e.g. 밥 -> 진지), upgrade it
		if (isElderSubj) {
			for (const con of constituents) {
				if (con.role === "object" && con.nounUnit) {
					const honNounKo = getHonorificNoun(con.nounUnit);
					if (honNounKo) {
						const honNounUnit = getNounUnit(honNounKo);
						if (honNounUnit) con.nounUnit = honNounUnit;
					}
				}
			}
		}

		const clauseContext = {
			honorific: isElderSubj,
			recipientHonorific: isElderRecip,
			isThirdPerson,
			person: isFirstOrSecond ? 1 : 3,
			verbUnit: pred ? pred.verbUnit : null
		};

		const wordParts = [];
		for (const con of constituents) {
			const realized = realizeConstituentKo(con, clauseContext);
			if (realized.surfaceKo) {
				wordParts.push(realized.surfaceKo);
				allEojeols.push(...realized.eojeols);
			}
		}

		if (pred) {
			pred.honorific = pred.honorific || isElderSubj;
			const realizedPred = realizePredicateKo(pred, clauseContext);
			if (realizedPred.surfaceKo) {
				wordParts.push(realizedPred.surfaceKo);
				allEojeols.push(...realizedPred.eojeols);
			}
		}

		clauseStrings.push(wordParts.join(" "));
	}

	let rawJoined = clauseStrings.join(" ").trim();
	let resolvedKo = applyMorphology(rawJoined).trim();

	// Add terminal punctuation if not already present
	const speechAct = ast.speechAct || "declarative";
	const punct = speechAct === "interrogative" ? "?" : (speechAct === "exclamatory" ? "!" : ".");
	const koWithPunct = /[.?~]$/.test(resolvedKo) ? resolvedKo : (resolvedKo ? resolvedKo + punct : "");

	// Realize Dual English Translations (Literal SOV + Natural SVO) and annotate eojeols/segments
	const enLiteral = typeof realizeLiteralEnglish === "function" ? realizeLiteralEnglish(ast) : "";
	const enNatural = typeof realizeNaturalEnglish === "function" ? realizeNaturalEnglish(ast) : "";

	// Assign eojeol indices and collect ordered unitsUsed
	const unitsUsed = [];
	const seenUnitIds = new Set();

	allEojeols.forEach((eojeol, idx) => {
		eojeol.index = idx;
		for (const seg of (eojeol.segments || [])) {
			if (typeof seg.unitId === "number") {
				if (!seenUnitIds.has(seg.unitId)) {
					seenUnitIds.add(seg.unitId);
					unitsUsed.push({
						unitId: seg.unitId,
						ko: seg.koDict,
						en: seg.enDict,
						pos: seg.pos,
						kind: seg.kind,
						role: seg.role || eojeol.role,
						surfaceKo: seg.textKo,
						surfaceEn: seg.textEn || "",
						eojeolIndex: idx
					});
				}
			}
		}
	});

	// Ensure targetUnitId is recorded if it was part of the AST
	const unitIds = Array.from(seenUnitIds);
	const tree = ast.tree || unitIds;

	return {
		ko: koWithPunct,
		koBare: resolvedKo,
		pronunciation: koWithPunct ? getPronunciation(koWithPunct) : "",
		enLiteral,
		enNatural,
		ast,
		eojeols: allEojeols,
		unitsUsed,
		unitIds,
		tree
	};
}

const sentenceAstExports = {
	getGrammarRegistry,
	resolveParticleUnit,
	resolveEndingUnit,
	makeSegment,
	splitNounAndParticleSegments,
	splitSingleVerbWordSegments,
	buildConstituentEojeols,
	buildPredicateEojeols,
	realizeConstituentKo,
	realizePredicateKo,
	realizeKoreanFromAST
};

if (typeof window !== 'undefined') {
	Object.assign(window, sentenceAstExports);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = sentenceAstExports;
}
})();
