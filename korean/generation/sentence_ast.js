(function() {
// Universal Constants
const { K } = (typeof require !== 'undefined') ? require('../../constants.js') : (typeof window !== 'undefined' ? window : {});

/**
 * korean/generation/sentence_ast.js
 *
 * Structured Sentence Abstract Syntax Tree (SentenceAST) & Surface Korean Realizer.
 *
 * Provides:
 * 1. Dynamic Grammar Unit Registry (maps particles, verbal endings, auxiliaries,
 *    copulas, and clausal connectives to their canonical Language Units in data.js
 *    with zero hardcoded magic IDs).
 * 2. The SentenceAST schema below (produced by unit_sentence_generator.js builders, mutated by the
 *    realizers here, read by sentence_validator.js and translation/*_realizer.js).
 * 3. Eojeol & Morpheme-Segment Provenance Engine:
 *    Splits every Korean surface word (eojeol) into exact stem + particle/ending segments
 *    where `segments.map(s => s.textKo).join('') === eojeol.surfaceKo`, enabling each
 *    Hangul word/morpheme and English literal token to act as an interactive Language Unit button.
 *
 * Platform: Node.js & Browser (Vanilla JS, zero dependencies).
 *
 * SENTENCE AST SCHEMA (plain objects, no classes; "Unit" = a raw data.js row array, read via DATA_SCHEMA.*).
 * If you add/rename a field, update this block and sentence_validator.js in the same edit.
 *
 *   builder result : { ok: boolean, ast: SentenceAST, ...reason fields when !ok }
 *   SentenceAST    : { type: "Sentence", targetUnitId, speechAct (K.DECLARATIVE|K.INTERROGATIVE|"exclamatory"),
 *                      politeness, tense, polarity, modality, honorific, clauses: ClauseAST[], tree? }
 *                    (sentence-level tense/politeness/etc. mirror the predicate; the predicate is authoritative)
 *   ClauseAST      : { constituents: ConstituentNode[], predicate: PredicateNode }   // realized in array order, then predicate
 *   ConstituentNode: { role (K.SUBJECT|K.TOPIC|K.OBJECT|K.RECIPIENT|K.ADVERB|K.TIME|location roles|"modifier"...),
 *                      particleType (K.* case name, or null for bare words),
 *                      unit | nounUnit,                       // head word; nounUnit wins if both are set
 *                      determinerUnit?, modifierSurfaceKo?,   // prefix word(s) before the head
 *                      counterUnit?, numberSurfaceKo?,        // "<noun?> <number> <counter>" phrase; noun optional
 *                      positionUnit?,                         // "<ground> <position word>" phrase (앞, 위, ...)
 *                      explicitSurfaceKo?,                    // bypasses all assembly (particle must be baked in)
 *                      particleUnit? }                        // normally resolved from particleType by the realizer
 *   PredicateNode  : { role: K.PREDICATE, predType (K.ACTION|K.DESCRIPTIVE|K.COPULA), verbUnit, tense, politeness,
 *                      polarity (K.AFFIRMATIVE|K.NEGATIVE), speechAct, modality (null|"desire"|"ability"|K.INABILITY|
 *                      "obligation"|"permission"|K.PROHIBITION|"progressive"|...), negationType?, honorific?,
 *                      copulaNounUnit? (predType COPULA), connectiveSuffix? (clause-linking stem+suffix),
 *                      explicitSurfaceKo? (bypasses conjugation), endingUnit? (resolved by realizer) }
 *   Realizer output (realizeKoreanFromAST): { ko, koBare, pronunciation, enLiteral, enNatural, ast, eojeols, unitsUsed, unitIds, tree }
 *   Eojeol         : { surfaceKo, role, index, segments: Segment[], unitIds? }  // one per space-separated word
 *   Segment        : { textKo, unitId|null, koDict, enDict, pos, kind ("lexical"|particle|ending...), role }
 *                    INVARIANT: segments.map(s => s.textKo).join('') === eojeol.surfaceKo, and
 *                    eojeols.map(e => e.surfaceKo).join(' ') === ko without terminal punctuation.
 *
 * REALIZER SIDE EFFECTS: realizeConstituentKo/realizePredicateKo MUTATE the nodes they receive (set particleUnit,
 * surfaceKo, eojeols, endingUnit; may swap nounUnit/verbUnit for honorific/humble/negation suppletives and flip
 * polarity to AFFIRMATIVE once a suppletive verb carries the negation). Deep-copy an AST before re-realizing it.
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
	const grammars = getWords(K.POS_GRAMMAR) || [];

	const findG = (predicate) => grammars.find(g => g && predicate(g)) || null;

	const particles = {
		topic: findG(g => hasTag(g, K.PARTICLE) && hasTag(g, K.TOPIC) && !hasTag(g, K.HONORIFIC)),
		topic_honorific: findG(g => hasTag(g, K.PARTICLE) && hasTag(g, K.TOPIC) && hasTag(g, K.HONORIFIC)),
		subject: findG(g => hasTag(g, K.PARTICLE) && hasTag(g, K.SUBJECT) && !hasTag(g, K.HONORIFIC)),
		subject_honorific: findG(g => hasTag(g, K.PARTICLE) && hasTag(g, K.SUBJECT) && hasTag(g, K.HONORIFIC) && !hasTag(g, K.TOPIC)),
		object: findG(g => hasTag(g, K.PARTICLE) && hasTag(g, K.OBJECT)),
		location_static: findG(g => hasTag(g, K.PARTICLE) && hasTag(g, K.LOCATION)),
		location_dynamic: findG(g => hasTag(g, K.PARTICLE) && hasTag(g, "location_action")),
		direction: findG(g => hasTag(g, K.PARTICLE) && hasTag(g, K.DIRECTION)),
		direction_ro: findG(g => hasTag(g, K.PARTICLE) && hasTag(g, "directional")),
		instrumental: findG(g => hasTag(g, K.PARTICLE) && hasTag(g, "instrumental")),
		time: findG(g => hasTag(g, K.PARTICLE) && hasTag(g, K.TIME) && !hasTag(g, "starting_point") && !hasTag(g, "duration")),
		dative: findG(g => hasTag(g, K.PARTICLE) && hasTag(g, K.DATIVE) && !hasTag(g, K.HONORIFIC)),
		dative_honorific: findG(g => hasTag(g, K.PARTICLE) && hasTag(g, K.DATIVE) && hasTag(g, K.HONORIFIC)),
		comitative: findG(g => hasTag(g, K.PARTICLE) && (hasTag(g, "comitative") || g[DATA_SCHEMA.Korean].includes("와 / 과") || g[DATA_SCHEMA.Korean].includes("(이)랑"))),
		possessive: findG(g => hasTag(g, K.PARTICLE) && hasTag(g, "possessive")),
		also: findG(g => hasTag(g, K.PARTICLE) && hasTag(g, "also")),
		exclusive: findG(g => hasTag(g, K.PARTICLE) && hasTag(g, "exclusive")),
		comparison: findG(g => hasTag(g, K.PARTICLE) && hasTag(g, "comparison") && !hasTag(g, K.DEGREE)),
		from: findG(g => hasTag(g, K.PARTICLE) && hasTag(g, "starting_point")),
		until: findG(g => hasTag(g, K.PARTICLE) && hasTag(g, "endpoint")),
		each: findG(g => hasTag(g, K.PARTICLE) && g[DATA_SCHEMA.Korean] === "마다")
	};

	const endings = {
		polite_present: findG(g => hasTag(g, "verbal_ending") && hasTag(g, K.PRESENT) && !hasTag(g, K.HONORIFIC) && g[DATA_SCHEMA.Korean].includes("아요")),
		formal_present: findG(g => hasTag(g, "verbal_ending") && hasTag(g, K.PRESENT) && g[DATA_SCHEMA.Korean].includes("습니다")),
		polite_past: findG(g => hasTag(g, K.PAST) && g[DATA_SCHEMA.Korean].includes("았/었어요")),
		formal_past: findG(g => hasTag(g, K.PAST) && g[DATA_SCHEMA.Korean].includes("았/었습니다")),
		polite_future: findG(g => hasTag(g, K.FUTURE) && g[DATA_SCHEMA.Korean].includes("거예요")),
		polite_imperative: findG(g => hasTag(g, K.IMPERATIVE) && g[DATA_SCHEMA.Korean].includes("세요") && !hasTag(g, K.PROHIBITION)),
		formal_imperative: findG(g => hasTag(g, K.IMPERATIVE) && g[DATA_SCHEMA.Korean].includes("십시오") && !hasTag(g, K.PROHIBITION)),
		plain_imperative: findG(g => hasTag(g, K.IMPERATIVE) && hasTag(g, "plain_style")),
		polite_prohibitive: findG(g => hasTag(g, K.PROHIBITION) && g[DATA_SCHEMA.Korean].includes("마세요")),
		formal_prohibitive: findG(g => hasTag(g, K.PROHIBITION) && g[DATA_SCHEMA.Korean].includes("마십시오")),
		plain_prohibitive: findG(g => hasTag(g, K.PROHIBITION) && hasTag(g, K.INFORMAL)),
		plain_propositive: findG(g => hasTag(g, K.PROPOSITIVE) && g[DATA_SCHEMA.Korean].includes("자")),
		formal_propositive: findG(g => hasTag(g, K.PROPOSITIVE) && g[DATA_SCHEMA.Korean].includes("ㅂ시다")),
		polite_suggestion: findG(g => hasTag(g, "suggestion") && g[DATA_SCHEMA.Korean].includes("까요")),
		plain_declarative: findG(g => hasTag(g, "plain_style") && g[DATA_SCHEMA.Korean].includes("ㄴ다")),
		intimate_declarative: findG(g => hasTag(g, K.INFORMAL) && g[DATA_SCHEMA.Korean].includes("-아/어")),
		formal_interrogative: findG(g => hasTag(g, K.INTERROGATIVE) && g[DATA_SCHEMA.Korean].includes("습니까")),
		polite_interrogative_na: findG(g => hasTag(g, K.INTERROGATIVE) && g[DATA_SCHEMA.Korean].includes("나요")),
		honorific_infix: findG(g => hasTag(g, K.HONORIFIC) && g[DATA_SCHEMA.Korean].includes("시"))
	};

	const modals = {
		desire: findG(g => hasTag(g, "desire") && g[DATA_SCHEMA.Korean].includes("고 싶다")),
		ability: findG(g => hasTag(g, "ability") && g[DATA_SCHEMA.Korean].includes("수 있다")),
		inability: findG(g => hasTag(g, K.INABILITY) && g[DATA_SCHEMA.Korean].includes("수 없다")),
		inability_mot: findG(g => hasTag(g, K.INABILITY) && g[DATA_SCHEMA.Korean].includes("못")),
		long_negation: findG(g => hasTag(g, "long_negation") && g[DATA_SCHEMA.Korean].includes("지 않다")),
		obligation: findG(g => hasTag(g, "obligation") && g[DATA_SCHEMA.Korean].includes("야 하다")),
		permission: findG(g => hasTag(g, "permission") && g[DATA_SCHEMA.Korean].includes("도 되다")),
		prohibition: findG(g => hasTag(g, K.PROHIBITION) && g[DATA_SCHEMA.Korean].includes("면 안 되다")),
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
		causal_aseo: findG(g => hasTag(g, K.CLAUSAL_CONNECTIVE) && g[DATA_SCHEMA.Korean].includes("아/어서")),
		causal_nikka: findG(g => hasTag(g, K.CLAUSAL_CONNECTIVE) && g[DATA_SCHEMA.Korean].includes("니까")),
		causal_ttaemune: findG(g => hasTag(g, K.CLAUSAL_CONNECTIVE) && g[DATA_SCHEMA.Korean].includes("기 때문에")),
		conjunction_go: findG(g => hasTag(g, K.CLAUSAL_CONNECTIVE) && g[DATA_SCHEMA.Korean] === "~고"),
		contrast_jiman: findG(g => hasTag(g, K.CLAUSAL_CONNECTIVE) && g[DATA_SCHEMA.Korean].includes("지만")),
		condition_myeon: findG(g => hasTag(g, K.CLAUSAL_CONNECTIVE) && g[DATA_SCHEMA.Korean].includes("면") && !g[DATA_SCHEMA.Korean].includes("면서")),
		background_neunde: findG(g => hasTag(g, K.CLAUSAL_CONNECTIVE) && g[DATA_SCHEMA.Korean].includes("는데")),
		simultaneous_myeonseo: findG(g => hasTag(g, K.CLAUSAL_CONNECTIVE) && g[DATA_SCHEMA.Korean].includes("면서")),
		purpose_ryeogo: findG(g => hasTag(g, K.CLAUSAL_CONNECTIVE) && g[DATA_SCHEMA.Korean].includes("려고")),
		purpose_reo: findG(g => hasTag(g, K.CLAUSAL_CONNECTIVE) && g[DATA_SCHEMA.Korean].includes("러 가다")),
		immediate_jamaja: findG(g => hasTag(g, K.CLAUSAL_CONNECTIVE) && g[DATA_SCHEMA.Korean].includes("자마자"))
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
		case K.TOPIC:
			return (isElder && options.useHonorificTopic && reg.topic_honorific) ? reg.topic_honorific : reg.topic;
		case K.SUBJECT:
		case "nominative":
			return (isElder && reg.subject_honorific) ? reg.subject_honorific : reg.subject;
		case K.OBJECT:
		case "accusative":
		case "obj":
			return reg.object;
		case K.LOCATION:
		case "location_static":
			return reg.location_static;
		case "location_origin":
		case "location_dynamic":
			return reg.location_dynamic;
		case K.DIRECTION:
			return reg.direction;
		case "direction_ro":
			return reg.direction_ro || reg.direction;
		case "instrumental":
		case "means":
			return reg.instrumental || reg.direction_ro;
		case K.TIME:
		case "temporal":
			return reg.time || reg.location_static;
		case K.DATIVE:
		case K.DATIVE_PERSON:
			return (isElder || options.dativeType === K.HONORIFIC) ? (reg.dative_honorific || reg.dative) : reg.dative;
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
		predType = K.ACTION,
		tense = K.PRESENT,
		politeness = "polite",
		speechAct = K.DECLARATIVE,
		polarity = K.AFFIRMATIVE,
		negationType = null,
		modality = null
	} = predSpec;

	if (predType === K.COPULA) {
		if (polarity === K.NEGATIVE) return reg.copulas.negative || reg.copulas.polite;
		if (politeness === K.FORMAL_HIGH) return reg.copulas.formal || reg.copulas.polite;
		if (politeness === "plain" || politeness === "intimate") return reg.copulas.plain || reg.copulas.polite;
		return reg.copulas.polite;
	}

	if (modality && reg.modals[modality]) {
		return reg.modals[modality];
	}

	if (polarity === K.NEGATIVE) {
		if (negationType === "long_ji_anta") return reg.modals.long_negation;
		if (negationType === "inability_su_eopda") return reg.modals.inability;
		if (negationType === "long_ji_mothada" || negationType === "short_mot") return reg.modals.inability_mot;
	}

	if (speechAct === K.IMPERATIVE) {
		if (polarity === K.NEGATIVE) {
			return politeness === K.FORMAL_HIGH ? reg.endings.formal_prohibitive : reg.endings.polite_prohibitive;
		}
		if (politeness === K.FORMAL_HIGH) return reg.endings.formal_imperative;
		if (politeness === "plain") return reg.endings.plain_imperative;
		return reg.endings.polite_imperative;
	}

	if (speechAct === K.PROPOSITIVE) {
		if (politeness === K.FORMAL_HIGH) return reg.endings.formal_propositive;
		if (politeness === "polite") return reg.endings.polite_suggestion || reg.endings.formal_propositive;
		return reg.endings.plain_propositive;
	}

	if (tense === K.PAST) {
		return politeness === K.FORMAL_HIGH ? reg.endings.formal_past : reg.endings.polite_past;
	}
	if (tense === K.FUTURE) {
		return reg.endings.polite_future;
	}

	if (politeness === K.FORMAL_HIGH) {
		return speechAct === K.INTERROGATIVE ? (reg.endings.formal_interrogative || reg.endings.formal_present) : reg.endings.formal_present;
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
		return [makeSegment(surfaceKo, particleUnit, K.PARTICLE, role)];
	}

	const nounKo = nounUnit[DATA_SCHEMA.Korean] || "";
	if (nounKo && surfaceKo.startsWith(nounKo) && surfaceKo.length > nounKo.length) {
		const stemPart = surfaceKo.slice(0, nounKo.length);
		const particlePart = surfaceKo.slice(nounKo.length);
		return [
			makeSegment(stemPart, nounUnit, "lexical", role),
			makeSegment(particlePart, particleUnit, K.PARTICLE, role)
		];
	}

	// Contracted pronoun cases: 나+가 -> 내가, 저+가 -> 제가, 누구+가 -> 누가
	if ((surfaceKo === "내가" || surfaceKo === "제가" || surfaceKo === "누가") && surfaceKo.length === 2) {
		return [
			makeSegment(surfaceKo[0], nounUnit, "lexical", role),
			makeSegment(surfaceKo[1], particleUnit, K.PARTICLE, role)
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
function splitSingleVerbWordSegments(wordKo, headUnit, endingUnit, role = K.PREDICATE) {
	if (!endingUnit || !headUnit) {
		return [makeSegment(wordKo, headUnit || endingUnit, headUnit ? "lexical" : K.GRAMMAR, role)];
	}

	const headKo = headUnit[DATA_SCHEMA.Korean] || "";
	const headPos = headUnit[DATA_SCHEMA.PartofSpeech] || "";

	// Copula: noun + 이에요/예요/입니다/이야/야
	if (headPos === K.NOUN || headPos === K.PRONOUN) {
		if (headKo && wordKo.startsWith(headKo) && wordKo.length > headKo.length) {
			return [
				makeSegment(wordKo.slice(0, headKo.length), headUnit, "lexical", role),
				makeSegment(wordKo.slice(headKo.length), endingUnit, K.GRAMMAR, role)
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
			makeSegment(wordKo.slice(rawStem.length), endingUnit, K.GRAMMAR, role)
		];
	}

	// Case 2: b_irregular glide expansion (e.g. 춥다 -> 추워요 / 추워서 / 추운)
	const conj = headUnit[DATA_SCHEMA.Conjugation] || "";
	const stemLen = rawStem.length;
	if (conj === K.B_IRREGULAR && wordKo.length > stemLen + 1) {
		const glideSyllable = wordKo[stemLen];
		if (/^[워와웠왔우운울]$/.test(glideSyllable)) {
			return [
				makeSegment(wordKo.slice(0, stemLen + 1), headUnit, "lexical", role),
				makeSegment(wordKo.slice(stemLen + 1), endingUnit, K.GRAMMAR, role)
			];
		}
	}

	// Case 3: syllable-contracted stem (e.g. 공부하다 -> 공부했어요 [stemLen=3: "공부했" + "어요"],
	// 마시다 -> 마셨어요 [stemLen=2: "마셨" + "어요"], 가다 -> 갑니다/가요 [stemLen=1: "갑"+"니다", "가"+"요"])
	if (wordKo.length > stemLen) {
		return [
			makeSegment(wordKo.slice(0, stemLen), headUnit, "lexical", role),
			makeSegment(wordKo.slice(stemLen), endingUnit, K.GRAMMAR, role)
		];
	}

	// Case 4: wordKo.length === stemLen (e.g. intimate panmal "공부해" where stemLen=3)
	if (wordKo.length === stemLen && stemLen > 1) {
		return [
			makeSegment(wordKo.slice(0, stemLen - 1), headUnit, "lexical", role),
			makeSegment(wordKo.slice(stemLen - 1), endingUnit, K.GRAMMAR, role)
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
				role: K.COUNTER,
				headUnitId: counterUnit[DATA_SCHEMA.Id],
				particleUnitId: particleUnit ? particleUnit[DATA_SCHEMA.Id] : null,
				unitIds: lastSegs.map(s => s.unitId).filter(id => id !== null),
				segments: lastSegs
			});
			return eojeols;
		} else if (words.length >= 2 && numberUnit && !primaryUnit) {
			const numWords = words.slice(0, -1);
			for (const nw of numWords) {
				const nId = numberUnit[DATA_SCHEMA.Id];
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
				role: K.COUNTER,
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

	const headUnit = predNode.predType === K.COPULA
		? (predNode.copulaNounUnit || predNode.verbUnit || null)
		: (predNode.verbUnit || predNode.copulaNounUnit || null);
	const endingUnit = predNode.endingUnit || predNode.connectiveUnit || predNode.grammarUnit || null;
	const negUnit = predNode.negationUnit || null;

	// Single-word predicate (e.g., "공부했어요", "예뻐요", "학생이에요", "공부해서")
	if (words.length === 1) {
		const segs = splitSingleVerbWordSegments(words[0], headUnit, endingUnit, K.PREDICATE);
		return [{
			surfaceKo: words[0],
			role: K.PREDICATE,
			headUnitId: headUnit ? headUnit[DATA_SCHEMA.Id] : null,
			particleUnitId: null,
			grammarUnitId: endingUnit ? endingUnit[DATA_SCHEMA.Id] : null,
			unitIds: Array.from(new Set(segs.map(s => s.unitId).filter(id => id !== null))),
			segments: segs
		}];
	}

	// Multi-word predicate cases:
	// Case A: Short negation ("안 먹어요", "못 가요", "그림을 안 그려요", "사진을 못 찍을 거예요")
	const negIdx = negUnit ? words.findIndex(w => w === "안" || w === "못") : -1;
	if (negIdx !== -1) {
		const eojeols = [];
		for (let i = 0; i < words.length; i++) {
			const w = words[i];
			if (i === negIdx) {
				eojeols.push({
					surfaceKo: w,
					role: "negation",
					headUnitId: negUnit[DATA_SCHEMA.Id],
					particleUnitId: null,
					grammarUnitId: negUnit[DATA_SCHEMA.Id],
					unitIds: [negUnit[DATA_SCHEMA.Id]],
					segments: [makeSegment(w, negUnit, K.GRAMMAR, "negation")]
				});
			} else if (i < negIdx) {
				eojeols.push({
					surfaceKo: w,
					role: K.OBJECT,
					headUnitId: headUnit ? headUnit[DATA_SCHEMA.Id] : null,
					particleUnitId: null,
					grammarUnitId: null,
					unitIds: headUnit ? [headUnit[DATA_SCHEMA.Id]] : [],
					segments: [makeSegment(w, headUnit, "lexical", K.OBJECT)]
				});
			} else if (i === negIdx + 1) {
				const verbSegs = splitSingleVerbWordSegments(w, headUnit, endingUnit, K.PREDICATE);
				eojeols.push({
					surfaceKo: w,
					role: K.PREDICATE,
					headUnitId: headUnit ? headUnit[DATA_SCHEMA.Id] : null,
					particleUnitId: null,
					grammarUnitId: endingUnit ? endingUnit[DATA_SCHEMA.Id] : null,
					unitIds: Array.from(new Set(verbSegs.map(s => s.unitId).filter(id => id !== null))),
					segments: verbSegs
				});
			} else {
				const seg = makeSegment(w, endingUnit || headUnit, endingUnit ? K.GRAMMAR : "lexical", "predicate_aux");
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
		}
		return eojeols;
	}

	// Case B: Auxiliary / Periphrastic construction (e.g. "공부하고 싶어요", "먹을 거예요", "먹지 않아요", "갈 수 있어요")
	// First word contains the main verb stem + linker, subsequent word(s) belong to the grammar/ending unit.
	const firstWordSegs = splitSingleVerbWordSegments(words[0], headUnit, endingUnit, K.PREDICATE);
	const eojeols = [{
		surfaceKo: words[0],
		role: K.PREDICATE,
		headUnitId: headUnit ? headUnit[DATA_SCHEMA.Id] : null,
		particleUnitId: null,
		grammarUnitId: endingUnit ? endingUnit[DATA_SCHEMA.Id] : null,
		unitIds: Array.from(new Set(firstWordSegs.map(s => s.unitId).filter(id => id !== null))),
		segments: firstWordSegs
	}];

	for (let i = 1; i < words.length; i++) {
		const w = words[i];
		const seg = makeSegment(w, endingUnit || headUnit, endingUnit ? K.GRAMMAR : "lexical", "predicate_aux");
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
		: (particleType ? resolveParticleUnit(particleType, primaryUnit || counterUnit, clauseContext) : null);

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
	} else if (counterUnit && !primaryUnit) {
		const counterKo = counterUnit[DATA_SCHEMA.Korean];
		const numStr = numberSurfaceKo || "한";
		const counterWithParticle = particleType
			? attachParticle(counterUnit, particleType, clauseContext.verbUnit, clauseContext)
			: counterKo;
		surfaceKo = `${numStr} ${counterWithParticle}`;
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
				topic: particleType === K.TOPIC
			})
			: primaryUnit[DATA_SCHEMA.Korean];
		if (constituent.modifierSurfaceKo) {
			surfaceKo = `${constituent.modifierSurfaceKo} ${baseWithParticle}`;
		} else if (determinerUnit) {
			surfaceKo = `${determinerUnit[DATA_SCHEMA.Korean]} ${baseWithParticle}`;
		} else {
			surfaceKo = baseWithParticle;
		}
	}

	// If time word is deictic and took no particle, clear particleUnit
	if ((particleType === K.TIME || particleType === "temporal") && primaryUnit && isDeicticTimeWord(primaryUnit)) {
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

	// Apply negative verb suppletion (e.g. 있다 -> 없다, 알다 -> 모르다, 약속이 있다 -> 약속이 없다)
	if (activeVerbUnit && predNode.polarity === K.NEGATIVE) {
		const vKo = activeVerbUnit[DATA_SCHEMA.Korean];
		let suppKo = (state && state.NEGATION_SUPPLETIONS && state.NEGATION_SUPPLETIONS.get(vKo)) || null;
		if (!suppKo) {
			if (vKo === "있다") suppKo = "없다";
			else if (vKo === "알다") suppKo = "모르다";
			else if (vKo.endsWith("있다")) suppKo = vKo.slice(0, -2) + "없다";
		}
		if (suppKo) {
			const suppUnit = getVerbUnit(suppKo);
			if (suppUnit) {
				activeVerbUnit = suppUnit;
				predNode.verbUnit = suppUnit;
				predNode.polarity = K.AFFIRMATIVE; // Suppletive lexical verb already inherently carries negation
			}
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
	} else if (predNode.predType === K.COPULA && predNode.copulaNounUnit) {
		const nounKo = predNode.copulaNounUnit[DATA_SCHEMA.Korean];
		const hasB = hasBatchim(nounKo.slice(-1));
		if (predNode.polarity === K.NEGATIVE) {
			surfaceKo = `${nounKo}${hasB ? "이" : "가"} ${predNode.politeness === K.FORMAL_HIGH ? "아닙니다" : "아니에요"}`;
		} else if (predNode.tense === K.PAST) {
			surfaceKo = `${nounKo}${hasB ? "이었어요" : "였어요"}`;
		} else if (predNode.politeness === K.FORMAL_HIGH) {
			surfaceKo = `${nounKo}입니다`;
		} else if (predNode.politeness === "plain" || predNode.politeness === "intimate") {
			surfaceKo = `${nounKo}${hasB ? "이야" : "야"}`;
		} else {
			surfaceKo = `${nounKo}${hasB ? "이에요" : "예요"}`;
		}
	} else if (activeVerbUnit) {
		const politeness = predNode.politeness || "polite";
		const tense = predNode.tense || K.PRESENT;
		const polarity = predNode.polarity || K.AFFIRMATIVE;
		const modality = predNode.modality || null;
		const speechAct = predNode.speechAct || K.DECLARATIVE;
		const stem = getConjugatedStem(activeVerbUnit[DATA_SCHEMA.Korean], activeVerbUnit[DATA_SCHEMA.Conjugation]);

		if (modality === "desire") {
			surfaceKo = buildMoodPredicate(activeVerbUnit, "desire", politeness, {
				tense,
				person: clauseContext.person || (clauseContext.isThirdPerson ? 3 : 1)
			});
		} else if (modality === "ability") {
			const end = politeness === K.FORMAL_HIGH ? "수 있습니다" : politeness === "plain" ? "수 있다" : "수 있어요";
			surfaceKo = resolvePureMorphology(`${stem}으/ㄹ ${end}`, state);
		} else if (modality === K.INABILITY || predNode.negationType === "inability_su_eopda") {
			const end = politeness === K.FORMAL_HIGH ? "수 없습니다" : politeness === "plain" ? "수 없다" : "수 없어요";
			surfaceKo = resolvePureMorphology(`${stem}으/ㄹ ${end}`, state);
		} else if (modality === "obligation") {
			const end = politeness === K.FORMAL_HIGH ? "야 합니다" : politeness === "plain" ? "야 한다" : "야 해요";
			surfaceKo = resolvePureMorphology(`${stem}아/어${end}`, state);
		} else if (modality === "permission") {
			const end = politeness === K.FORMAL_HIGH ? "도 됩니다" : politeness === "plain" ? "도 된다" : "도 돼요";
			surfaceKo = resolvePureMorphology(`${stem}아/어${end}`, state);
		} else if (modality === K.PROHIBITION) {
			const end = politeness === K.FORMAL_HIGH ? "면 안 됩니다" : politeness === "plain" ? "면 안 된다" : "면 안 돼요";
			surfaceKo = resolvePureMorphology(`${stem}으/${end}`, state);
		} else if (modality === "progressive") {
			const rawStem = getStem(activeVerbUnit[DATA_SCHEMA.Korean]);
			const end = politeness === K.FORMAL_HIGH ? "고 있습니다" : politeness === "plain" ? "고 있다" : "고 있어요";
			surfaceKo = `${rawStem}${end}`;
		} else if (modality === "try_attempt") {
			const end = tense === K.PAST ? "봤어요" : (politeness === K.FORMAL_HIGH ? "봅니다" : "봐요");
			surfaceKo = resolvePureMorphology(`${stem}아/어 ${end}`, state);
		} else if (modality === "experience") {
			const end = politeness === K.FORMAL_HIGH ? "적이 있습니다" : "적이 있어요";
			surfaceKo = resolvePureMorphology(`${stem}으/ㄴ ${end}`, state);
		} else if (modality === "promise") {
			surfaceKo = resolvePureMorphology(`${stem}으/ㄹ게요`, state);
		} else if (speechAct === K.IMPERATIVE) {
			surfaceKo = buildMoodPredicate(
				activeVerbUnit,
				polarity === K.NEGATIVE ? K.PROHIBITION : K.IMPERATIVE,
				politeness,
				{ tense }
			);
		} else if (speechAct === K.PROPOSITIVE) {
			surfaceKo = buildMoodPredicate(activeVerbUnit, K.PROPOSITIVE, politeness, { tense });
		} else if (polarity === K.NEGATIVE && !state.FORBIDDEN_NEGATIVE_ROOTS.has(activeVerbUnit[DATA_SCHEMA.Korean]) && !state.AFFIRMATIVE_COUNTERPARTS.has(activeVerbUnit[DATA_SCHEMA.Korean])) {
			const isLong = predNode.negationType === "long_ji_anta" || predNode.negationType === "long_ji_mothada";
			const isInability = predNode.negationType === "long_ji_mothada" || predNode.negationType === "short_mot";
			surfaceKo = buildNegatedPredicate(activeVerbUnit, {
				type: isLong ? "long" : "short",
				inability: isInability,
				formality: politeness,
				tense
			});
		} else {
			const isLexicalHon = state.HONORIFIC_WORDS.has(activeVerbUnit[DATA_SCHEMA.Korean]) && activeVerbUnit[DATA_SCHEMA.Korean].includes("시");
			if (isElderSubj && !isLexicalHon && !state.HUMBLE_WORDS.has(activeVerbUnit[DATA_SCHEMA.Korean])) {
				if (tense === K.FUTURE) {
					const honStem = resolvePureMorphology(`${stem}으/시`, state);
					const futEnd = politeness === K.FORMAL_HIGH ? "겁니다" : politeness === "plain" ? "거야" : "거예요";
					surfaceKo = resolvePureMorphology(`${honStem}으/ㄹ ${futEnd}`, state);
				} else {
					const honEnding = tense === K.PAST
						? (politeness === K.FORMAL_HIGH ? "으/셨습니다" : "으/셨어요")
						: (politeness === K.FORMAL_HIGH ? "으/십니다" : "으/세요");
					surfaceKo = resolvePureMorphology(stem + honEnding, state);
				}
			} else {
				surfaceKo = conjugatePredicate(activeVerbUnit, politeness, tense);
			}
		}
	}

	if (/[?]$/.test(surfaceKo)) {
		predNode.speechAct = K.INTERROGATIVE;
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
		let hasFirstSecondSubj = false;

		for (const con of constituents) {
			const u = con.nounUnit || con.unit;
			if ((con.role === K.SUBJECT || con.role === K.TOPIC) && u) {
				const word = u[DATA_SCHEMA.Korean] || "";
				if (!subjKo || con.role === K.TOPIC) {
					subjKo = word;
				}
				if (state.FIRST_SECOND_PERSON_FORMS && state.FIRST_SECOND_PERSON_FORMS.has(word)) {
					hasFirstSecondSubj = true;
				}
				if (isElderNoun(u)) {
					isElderSubj = true;
				}
			}
			if (con.role === K.RECIPIENT && u && isElderNoun(u)) {
				isElderRecip = true;
			}
		}

		const isFirstOrSecond = hasFirstSecondSubj || Boolean(state.FIRST_SECOND_PERSON_FORMS && state.FIRST_SECOND_PERSON_FORMS.has(subjKo));
		const isThirdPerson = !subjKo || !isFirstOrSecond;

		// If subject is elder and object is a plain noun with an honorific counterpart (e.g. 밥 -> 진지), upgrade it
		if (isElderSubj) {
			for (const con of constituents) {
				if (con.role === K.OBJECT && con.nounUnit) {
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
	const speechAct = ast.speechAct || K.DECLARATIVE;
	const punct = speechAct === K.INTERROGATIVE ? "?" : (speechAct === "exclamatory" ? "!" : ".");
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
