(function() {
/**
 * korean/translation/literal_realizer.js
 *
 * Direct Korean-Word-Order Literal English Realizer (`enLiteral`) & Morpheme Alignment Engine.
 *
 * Pedagogical Purpose:
 * Produces a direct, Korean-word-order (SOV + agglutinative postpositions/endings)
 * English translation that exposes Korean syntax and particle/ending roles clearly to
 * English-speaking learners:
 *   Korean:    학생은 오늘 도서관에서 한국어를 열심히 공부했어요.
 *   enLiteral: Student-[topic] today library-at Korean-[obj] diligently study-past.
 *
 * Also enriches every `eojeol` and `segment` in the realized sentence with `surfaceEnLit`
 * and `textEn` so that either the Hangul words/morphemes or the English literal tokens
 * can be rendered as interactive Language Unit buttons in the UI.
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

const {
	DATA_SCHEMA,
	hasTag,
	parseSemanticData
} = (typeof require !== 'undefined' ? require('../core/primitives.js') : window);

/**
 * Cleans a raw English definition string from data.js into a concise 1-2 word literal gloss.
 */
function cleanRawEnglishGloss(rawEn, pos = "") {
	if (!rawEn || typeof rawEn !== "string") return "";
	let s = rawEn
		.replace(/\([^)]*\)/g, "")
		.replace(/"[^"]*"/g, "")
		.split(/[;,/]/)[0]
		.trim();

	if (pos === "Action Verb" || pos === "Descriptive Verb") {
		s = s.replace(/^to\s+/i, "").trim();
		if (pos === "Descriptive Verb") {
			s = s.replace(/^be\s+/i, "").trim();
		}
	}
	return s.replace(/\s+/g, "-") || rawEn.trim();
}

/**
 * Returns the concise literal English stem gloss for a Language Unit.
 */
function getUnitLiteralStem(unit) {
	if (!unit) return "";
	const ko = unit[DATA_SCHEMA.Korean] || "";
	const pos = unit[DATA_SCHEMA.PartofSpeech] || "";
	const sd = parseSemanticData(unit);
	const enMeta = (sd && sd.en) || {};

	// Special high-frequency disambiguations for Korean learners
	if (ko === "있다" && pos === "Descriptive Verb") return "exist/have";
	if (ko === "없다" && pos === "Descriptive Verb") return "not-exist";
	if (ko === "이다") return "be";
	if (ko === "아니다") return "not-be";
	if (ko === "안" && pos === "Adverb") return "not";
	if (ko === "못" && pos === "Adverb") return "cannot";

	if (pos === "Action Verb") {
		const base = enMeta.base || enMeta.lit || cleanRawEnglishGloss(unit[DATA_SCHEMA.English], pos);
		return String(base).trim().replace(/\s+/g, "-");
	}

	if (pos === "Descriptive Verb") {
		const adj = enMeta.adj || enMeta.lit || enMeta.base || cleanRawEnglishGloss(unit[DATA_SCHEMA.English], pos);
		return String(adj).trim().replace(/\s+/g, "-");
	}

	const lit = enMeta.lit || enMeta.nat || cleanRawEnglishGloss(unit[DATA_SCHEMA.English], pos);
	return String(lit).replace(/\([^)]*\)/g, "").replace(/^-+/, "").trim().replace(/\s+/g, "-");
}

/**
 * Returns the hyphenated postpositional role tag for a Korean particle.
 */
function getParticleLiteralTag(particleType, particleUnit = null, clauseContext = {}) {
	if (!particleType && !particleUnit) return "";

	const verbUnit = clauseContext.verbUnit || null;
	const isMotionVerb = verbUnit && hasTag(verbUnit, "intransitive_motion", "locative_goal", "movement");
	const isOriginVerb = verbUnit && hasTag(verbUnit, "locative_origin");

	switch (particleType) {
		case "topic":
			return "-[topic]";
		case "topic_honorific":
			return "-[topic:hon]";
		case "subject":
		case "nominative":
			return clauseContext.honorific ? "-[subj:hon]" : "-[subj]";
		case "object":
		case "accusative":
		case "obj":
			return "-[obj]";
		case "location":
		case "location_static":
			return isMotionVerb ? "-to" : "-at";
		case "location_dynamic":
			return isOriginVerb ? "-from" : "-at/in";
		case "direction":
		case "direction_ro":
			return "-to/toward";
		case "instrumental":
		case "means":
			return "-by/with";
		case "time":
		case "temporal":
			return "-at/on";
		case "dative":
		case "dative_person":
			return clauseContext.recipientHonorific ? "-to[hon]" : "-to";
		case "comitative":
		case "companion":
			return "-with/and";
		case "possessive":
			return "-'s";
		case "also":
			return "-also";
		case "only":
		case "exclusive":
			return "-only";
		case "comparison":
			return "-than";
		case "from":
			return "-from";
		case "until":
			return "-until";
		case "each":
			return "-each";
		default:
			break;
	}

	if (particleUnit) {
		const ko = particleUnit[DATA_SCHEMA.Korean] || "";
		if (ko.includes("은") && ko.includes("는")) return "-[topic]";
		if (ko.includes("께서는")) return "-[topic:hon]";
		if (ko.includes("께서")) return "-[subj:hon]";
		if (ko.includes("이") && ko.includes("가")) return "-[subj]";
		if (ko.includes("을") && ko.includes("를")) return "-[obj]";
		if (ko.includes("에서")) return "-at/in";
		if (ko.includes("에다가")) return "-onto";
		if (ko.includes("에게서") || ko.includes("한테서")) return "-from";
		if (ko.includes("에게") || ko.includes("한테")) return "-to";
		if (ko === "께") return "-to[hon]";
		if (ko.includes("(으)로")) return "-toward/by";
		if (ko.startsWith("에")) return "-at/to";
		if (ko === "도") return "-also";
		if (ko === "만") return "-only";
		if (ko === "마다") return "-every";
		if (ko === "부터") return "-from";
		if (ko === "까지") return "-until";
		if (ko.includes("보다")) return "-than";
		if (ko.includes("의")) return "-'s";
		if (ko.includes("랑") || ko === "하고" || ko.includes("와")) return "-with/and";
		if (ko.includes("이나")) return "-or";
		if (ko.includes("이라서")) return "-because-is";
		if (ko.includes("이라도")) return "-even-if-is";
		if (ko.includes("밖에")) return "-only[neg]";
		if (ko.includes("만큼")) return "-as-much-as";
		if (ko === "쯤") return "-approx";

		const sd = parseSemanticData(particleUnit);
		if (sd && sd.en && sd.en.role) {
			return `-${sd.en.role}`;
		}
	}

	return "";
}

/**
 * Returns the literal suffix gloss for a Grammar unit or predicate inflection.
 */
function getGrammarEndingLiteralSuffix(predNode) {
	if (!predNode) return "";
	const grammarUnit = predNode.grammarUnit || predNode.endingUnit || predNode.connectiveUnit || null;
	const {
		predType = "action",
		tense = "present",
		politeness = "polite",
		speechAct = "declarative",
		polarity = "affirmative",
		negationType = null,
		modality = null,
		connectiveSuffix = null
	} = predNode;

	if (predType === "copula") {
		if (polarity === "negative") return "-not-be";
		if (tense === "past") return "-was/were";
		return "-be";
	}

	// If predicate was built from a specific Grammar unit formula (e.g. -는 중이다, -(으)ㄹ 때, -기 때문에)
	if (grammarUnit && connectiveSuffix) {
		const gKo = grammarUnit[DATA_SCHEMA.Korean] || "";
		if (gKo.includes("는 중이다")) return ["-ing", "in-middle-of-be"];
		if (gKo.includes("고 있다")) return ["-ing", "be"];
		if (gKo.includes("고 싶다")) return ["-to", "want"];
		if (gKo.includes("고 싶어하다")) return ["-to", "wants"];
		if (gKo.includes("수 있다")) return ["-can", "possible-be"];
		if (gKo.includes("수 없다")) return ["-can", "not-possible-be"];
		if (gKo.includes("지 않다")) return ["-not", "do"];
		if (gKo.includes("지 못하다")) return ["-cannot", "do"];
		if (gKo.includes("지 마세요") || gKo.includes("지 마십시오") || gKo === "-지 마") return ["-not", "please-don't"];
		if (gKo.includes("지 말고")) return ["-not-and", "instead"];
		if (gKo.includes("야 하다") || gKo.includes("야겠다")) return "-must";
		if (gKo.includes("도 되다")) return ["-even-if", "okay-be"];
		if (gKo.includes("면 안 되다")) return ["-if", "not-okay-be"];
		if (gKo.includes("어 보다")) return ["", "try-see"];
		if (gKo.includes("적이 있다")) return ["-past", "experience-exist"];
		if (gKo.includes("기로 하다")) return ["-to-do", "decide"];
		if (gKo.includes("게 되다")) return ["-to-become", "end-up"];
		if (gKo.includes("어지다")) return "-become";
		if (gKo.includes("려고 하다")) return ["-in-order-to", "intend"];
		if (gKo.includes("하려고") || gKo.includes("으)려고")) return "-in-order-to";
		if (gKo.includes("러 가다")) return ["-to-do", "go"];
		if (gKo.includes("기 때문에")) return ["-nominal", "because-of"];
		if (gKo.includes("기 전에")) return ["-nominal", "before"];
		if (gKo.includes("ㄴ 후에") || gKo.includes("다음에")) return ["-after", "after-at"];
		if (gKo.includes("ㄹ 때")) return ["-when", "time-at"];
		if (gKo.includes("자마자")) return "-as-soon-as";
		if (gKo.includes("아/어서")) return "-because/so";
		if (gKo.includes("니까")) return "-since/because";
		if (gKo.includes("므로")) return "-therefore";
		if (gKo.includes("느라고")) return "-because-of-doing";
		if (gKo.includes("바람에")) return ["-wind-at(because)"];
		if (gKo.includes("지만")) return "-but";
		if (gKo.includes("는데") || gKo.includes("ㄴ데")) return "-but/and";
		if (gKo.includes("면서")) return "-while";
		if (gKo.includes("으)면") || gKo.includes("-으면")) return "-if/when";
		if (gKo === "~고") return "-and";
		if (gKo.includes("었다가")) return "-did-and-then";
		if (gKo.includes("ㄹ게요")) return "-will[promise]";
		if (gKo.includes("ㄹ까요")) return "-shall-we?";
		if (gKo.includes("ㄹ래요")) return "-would-you-like?";
		if (gKo.includes("거예요")) return ["-future", "thing-be(will)"];
		if (gKo.includes("겠다")) return "-will/must-be";
		if (gKo.includes("네요")) return "-[realize!]";
		if (gKo.includes("군요") || gKo.includes("구나")) return "-[oh-I-see!]";
		if (gKo.includes("지요") || gKo.includes("-죠")) return "-right?";
		if (gKo.includes("나요") || gKo.includes("은가요") || gKo.includes("습니까") || gKo === "-니?") return "-[question]";
		if (gKo.includes("세요") || gKo.includes("십시오") || gKo === "-어라") return "-please[imp]";
		if (gKo.includes("ㅂ시다") || gKo.includes("~자") || gKo === "-자" || gKo === "-세") return "-let's";
		if (gKo.includes("았/었")) return "-past";
	}

	if (modality === "desire") return ["-to", "want"];
	if (modality === "ability") return ["-can", "possible"];
	if (modality === "inability") return ["-can", "not-possible"];
	if (modality === "obligation") return "-must";
	if (modality === "permission") return ["-even-if", "okay"];
	if (modality === "prohibition") return ["-if", "not-okay"];
	if (modality === "progressive") return ["-ing", "be"];
	if (modality === "try_attempt") return ["", "try"];
	if (modality === "experience") return ["-past", "experience-have"];
	if (modality === "promise") return "-will[promise]";

	if (speechAct === "imperative") {
		return polarity === "negative" ? ["-not", "please-don't"] : "-please[imp]";
	}
	if (speechAct === "propositive") {
		return "-let's";
	}

	if (polarity === "negative") {
		if (negationType === "long_ji_anta") return [tense === "past" ? "-not" : "-not", tense === "past" ? "did-not" : "do-not"];
		if (negationType === "long_ji_mothada") return ["-cannot", tense === "past" ? "could-not" : "cannot"];
	}

	if (tense === "past") return "-past";
	if (tense === "future") return ["-future", "will"];
	if (politeness === "formal_high") return "-[formal]";
	return "";
}

/**
 * Annotates a realized constituent's eojeols and segments with literal English glosses.
 */
function annotateConstituentLiteral(constituent, clauseContext = {}) {
	if (!constituent || !Array.isArray(constituent.eojeols)) return [];

	const {
		nounUnit = null,
		unit = null,
		determinerUnit = null,
		numberUnit = null,
		countValue = null,
		counterUnit = null,
		positionUnit = null,
		particleType = null,
		particleUnit = null
	} = constituent;

	const primaryUnit = nounUnit || unit;
	const pTag = getParticleLiteralTag(particleType, particleUnit, clauseContext);
	const eojeols = constituent.eojeols;

	// 1. Counting phrase: [Noun, Number, Counter+Particle]
	if (counterUnit && eojeols.length >= 3 && primaryUnit) {
		const nounLit = getUnitLiteralStem(primaryUnit);
		eojeols[0].segments[0].textEn = nounLit;
		eojeols[0].surfaceEnLit = nounLit;

		const numLit = countValue !== null ? String(countValue) : (numberUnit ? getUnitLiteralStem(numberUnit) : eojeols[1].surfaceKo);
		for (let i = 1; i < eojeols.length - 1; i++) {
			eojeols[i].segments[0].textEn = i === 1 ? numLit : "";
			eojeols[i].surfaceEnLit = i === 1 ? numLit : "";
		}

		const counterEojeol = eojeols[eojeols.length - 1];
		const counterLit = `[count:${getUnitLiteralStem(counterUnit)}]`;
		if (counterEojeol.segments.length >= 2) {
			counterEojeol.segments[0].textEn = counterLit;
			counterEojeol.segments[1].textEn = pTag;
			counterEojeol.surfaceEnLit = counterLit + pTag;
		} else if (counterEojeol.segments.length === 1) {
			counterEojeol.segments[0].textEn = counterLit + pTag;
			counterEojeol.surfaceEnLit = counterLit + pTag;
		}
		return eojeols.map(e => e.surfaceEnLit).filter(Boolean);
	}

	// 2. Spatial phrase: [GroundNoun, Position+Particle]
	if (positionUnit && eojeols.length === 2 && primaryUnit) {
		const groundLit = getUnitLiteralStem(primaryUnit);
		eojeols[0].segments[0].textEn = groundLit;
		eojeols[0].surfaceEnLit = groundLit;

		const posLit = getUnitLiteralStem(positionUnit);
		if (eojeols[1].segments.length >= 2) {
			eojeols[1].segments[0].textEn = posLit;
			eojeols[1].segments[1].textEn = pTag || "-at";
			eojeols[1].surfaceEnLit = posLit + (pTag || "-at");
		} else {
			eojeols[1].segments[0].textEn = posLit + (pTag || "-at");
			eojeols[1].surfaceEnLit = posLit + (pTag || "-at");
		}
		return eojeols.map(e => e.surfaceEnLit).filter(Boolean);
	}

	// 3. Determiner + Noun (+ Particle): [Determiner, Noun+Particle]
	if (determinerUnit && eojeols.length === 2 && primaryUnit) {
		const detLit = getUnitLiteralStem(determinerUnit);
		eojeols[0].segments[0].textEn = detLit;
		eojeols[0].surfaceEnLit = detLit;

		const nounLit = getUnitLiteralStem(primaryUnit);
		if (eojeols[1].segments.length >= 2) {
			eojeols[1].segments[0].textEn = nounLit;
			eojeols[1].segments[1].textEn = pTag;
			eojeols[1].surfaceEnLit = nounLit + pTag;
		} else {
			eojeols[1].segments[0].textEn = nounLit + pTag;
			eojeols[1].surfaceEnLit = nounLit + pTag;
		}
		return eojeols.map(e => e.surfaceEnLit).filter(Boolean);
	}

	// 4. Adverbial verb modifier (e.g. "{DVst}게" -> "pretty-ly")
	if (constituent.role === "adverbial" && primaryUnit && particleUnit && eojeols.length === 1) {
		const stemLit = getUnitLiteralStem(primaryUnit);
		const gKo = particleUnit[DATA_SCHEMA.Korean] || "";
		const suffixLit = gKo.includes("게") ? "-ly" : `-${cleanRawEnglishGloss(particleUnit[DATA_SCHEMA.English])}`;
		if (eojeols[0].segments.length >= 2) {
			eojeols[0].segments[0].textEn = stemLit;
			eojeols[0].segments[1].textEn = suffixLit;
		} else if (eojeols[0].segments.length === 1) {
			eojeols[0].segments[0].textEn = stemLit + suffixLit;
		}
		eojeols[0].surfaceEnLit = stemLit + suffixLit;
		return [eojeols[0].surfaceEnLit];
	}

	// 5. Standard single-eojeol constituent (Noun+Particle, Time word, Adverb, Exclamation)
	const stemLit = primaryUnit ? getUnitLiteralStem(primaryUnit) : (constituent.surfaceKo || "");
	for (let i = 0; i < eojeols.length; i++) {
		const ej = eojeols[i];
		const isLast = i === eojeols.length - 1;
		if (isLast && ej.segments.length >= 2) {
			ej.segments[0].textEn = stemLit;
			ej.segments[1].textEn = pTag;
			ej.surfaceEnLit = stemLit + pTag;
		} else if (ej.segments.length >= 1) {
			const full = isLast ? (stemLit + pTag) : stemLit;
			ej.segments[0].textEn = full;
			ej.surfaceEnLit = full;
		}
	}

	return eojeols.map(e => e.surfaceEnLit).filter(Boolean);
}

/**
 * Annotates a realized predicate's eojeols and segments with literal English glosses.
 */
function annotatePredicateLiteral(predNode) {
	if (!predNode || !Array.isArray(predNode.eojeols) || predNode.eojeols.length === 0) return [];

	const headUnit = predNode.verbUnit || predNode.copulaNounUnit || null;
	const stemLit = headUnit ? getUnitLiteralStem(headUnit) : "";
	const endingSpec = getGrammarEndingLiteralSuffix(predNode);
	const eojeols = predNode.eojeols;

	// Case 1: Single-word predicate (e.g. "공부했어요" -> "study-past", "학생이에요" -> "student-be")
	if (eojeols.length === 1) {
		const ej = eojeols[0];
		const suffixStr = Array.isArray(endingSpec) ? endingSpec.filter(Boolean).join("-") : (endingSpec || "");
		const normalizedSuffix = suffixStr && !suffixStr.startsWith("-") ? "-" + suffixStr : suffixStr;

		if (ej.segments.length >= 2) {
			ej.segments[0].textEn = stemLit;
			ej.segments[1].textEn = normalizedSuffix;
			ej.surfaceEnLit = stemLit + normalizedSuffix;
		} else if (ej.segments.length === 1) {
			ej.segments[0].textEn = stemLit + normalizedSuffix;
			ej.surfaceEnLit = stemLit + normalizedSuffix;
		}
		return [ej.surfaceEnLit];
	}

	// Case 2: Short negation ("안 먹어요" -> ["not", "eat"], "못 가요" -> ["cannot", "go"])
	if (eojeols.length === 2 && (eojeols[0].surfaceKo === "안" || eojeols[0].surfaceKo === "못")) {
		const negWord = eojeols[0].surfaceKo === "못" ? "cannot" : "not";
		eojeols[0].segments[0].textEn = negWord;
		eojeols[0].surfaceEnLit = negWord;

		const tenseSuffix = predNode.tense === "past" ? "-past" : (predNode.tense === "future" ? "-future" : "");
		if (eojeols[1].segments.length >= 2) {
			eojeols[1].segments[0].textEn = stemLit;
			eojeols[1].segments[1].textEn = tenseSuffix;
			eojeols[1].surfaceEnLit = stemLit + tenseSuffix;
		} else {
			eojeols[1].segments[0].textEn = stemLit + tenseSuffix;
			eojeols[1].surfaceEnLit = stemLit + tenseSuffix;
		}
		return [eojeols[0].surfaceEnLit, eojeols[1].surfaceEnLit];
	}

	// Case 3: Multi-word auxiliary / periphrastic predicate (e.g. "공부하고 싶어요", "먹을 거예요", "먹지 않아요")
	const firstSuffix = Array.isArray(endingSpec) ? (endingSpec[0] || "") : "";
	const auxGloss = Array.isArray(endingSpec) ? (endingSpec[1] || "aux") : (endingSpec || "").replace(/^-/, "");

	const firstEj = eojeols[0];
	if (firstEj.segments.length >= 2) {
		firstEj.segments[0].textEn = stemLit;
		firstEj.segments[1].textEn = firstSuffix;
		firstEj.surfaceEnLit = stemLit + firstSuffix;
	} else {
		firstEj.segments[0].textEn = stemLit + firstSuffix;
		firstEj.surfaceEnLit = stemLit + firstSuffix;
	}

	for (let i = 1; i < eojeols.length; i++) {
		const auxEj = eojeols[i];
		const textEn = i === eojeols.length - 1 ? auxGloss : "be";
		if (auxEj.segments.length >= 1) {
			auxEj.segments[0].textEn = textEn;
		}
		auxEj.surfaceEnLit = textEn;
	}

	return eojeols.map(e => e.surfaceEnLit).filter(Boolean);
}

/**
 * Realizes the Korean-word-order literal English translation (`enLiteral`) from a `SentenceAST`
 * and annotates all eojeols and segments in place.
 */
function realizeLiteralEnglish(ast) {
	if (!ast || !Array.isArray(ast.clauses) || ast.clauses.length === 0) {
		return "";
	}

	const tokens = [];

	for (const clause of ast.clauses) {
		const constituents = clause.constituents || [];
		const pred = clause.predicate || null;

		const clauseContext = {
			honorific: Boolean(clause.honorific || ast.honorific),
			verbUnit: pred ? pred.verbUnit : null
		};

		for (const con of constituents) {
			const cTokens = annotateConstituentLiteral(con, clauseContext);
			tokens.push(...cTokens);
		}

		if (pred) {
			const pTokens = annotatePredicateLiteral(pred);
			tokens.push(...pTokens);
		}
	}

	let joined = tokens.filter(Boolean).join(" ").trim();
	if (!joined) return "";

	// Capitalize first letter while preserving bracket tags
	joined = joined.charAt(0).toUpperCase() + joined.slice(1);

	const speechAct = ast.speechAct || "declarative";
	const punct = speechAct === "interrogative" ? "?" : (speechAct === "exclamatory" ? "!" : ".");
	if (!/[.?!]$/.test(joined)) {
		joined += punct;
	}

	return joined;
}

const literalRealizerExports = {
	cleanRawEnglishGloss,
	getUnitLiteralStem,
	getParticleLiteralTag,
	getGrammarEndingLiteralSuffix,
	annotateConstituentLiteral,
	annotatePredicateLiteral,
	realizeLiteralEnglish
};

if (typeof window !== 'undefined') {
	Object.assign(window, literalRealizerExports);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = literalRealizerExports;
}
})();
