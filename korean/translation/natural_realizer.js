(function() {
/**
 * korean/translation/natural_realizer.js
 *
 * Idiomatic SVO Natural English Realizer (`enNatural`).
 *
 * Transforms a Korean `SentenceAST` (SOV + agglutinative morphology) into natural,
 * idiomatic SVO English with:
 * 1. Subject-verb agreement (1st/2nd/3rd person singular/plural `am`/`is`/`are`/`was`/`were`, `-s` inflection).
 * 2. Irregular English verb inflections (`base`, `past`, `part`, `s`, `ing` from `SemanticData.en`).
 * 3. Natural article & preposition selection (`the`, `a/an`, bare mass/abstract/proper nouns, `at`/`in`/`to`/`from`).
 * 4. Multi-clause conjunction ordering (`Because ...`, `Although ...`, `When ...`, `While ...`, `If ...`).
 *
 * Platform: Node.js & Browser (Vanilla JS, zero dependencies).
 */

const {
	DATA_SCHEMA,
	hasTag,
	parseSemanticData
} = (typeof require !== 'undefined' ? require('../core/primitives.js') : window);

const UNCOUNTABLE_EN_NOUNS = new Set([
	"water", "coffee", "tea", "milk", "juice", "beer", "alcohol", "wine",
	"rice", "cooked rice", "meal", "food", "bread", "meat", "beef", "pork", "chicken", "fish",
	"kimchi", "ramen", "soup", "salt", "sugar", "money", "cash", "time", "homework",
	"work", "music", "weather", "rain", "snow", "wind", "air", "fire", "love",
	"happiness", "peace", "health", "information", "news", "furniture", "luggage",
	"traffic", "advice", "research", "korean", "english", "japanese", "chinese", "french",
	"spanish", "german", "history", "math", "science", "medicine", "exercise", "sleep"
]);

const PROPER_OR_BARE_PLACES = new Set([
	"home", "school", "work", "bed", "class", "church", "college", "university", "downtown",
	"korea", "south korea", "usa", "america", "japan", "china", "france", "brazil", "uk",
	"england", "germany", "canada", "australia", "russia", "seoul", "busan", "jeju", "tokyo"
]);

/**
 * Extracts a clean natural English phrase for a Language Unit.
 */
function getUnitNaturalPhrase(unit) {
	if (!unit) return "";
	const ko = unit[DATA_SCHEMA.Korean] || "";
	const pos = unit[DATA_SCHEMA.PartofSpeech] || "";
	const sd = parseSemanticData(unit);
	const enMeta = (sd && sd.en) || {};

	if (ko === "나" || ko === "저") return "I";
	if (ko === "우리" || ko === "저희") return "we";
	if (ko === "너" || ko === "당신") return "you";
	if (ko === "그" && pos === "Pronoun") return "he";
	if (ko === "그녀") return "she";
	if (ko === "누구" || ko === "누가") return "who";
	if (ko === "무엇" || ko === "뭐") return "what";
	if (ko === "어디") return "where";
	if (ko === "언제") return "when";
	if (ko === "이것" || ko === "이거") return "this";
	if (ko === "그것" || ko === "그거") return "that";
	if (ko === "저것" || ko === "저거") return "that over there";
	if (ko === "여기" || ko === "이곳") return "here";
	if (ko === "거기" || ko === "그곳") return "there";
	if (ko === "저기" || ko === "저곳") return "over there";

	let raw = enMeta.nat || enMeta.lit || unit[DATA_SCHEMA.English] || "";
	raw = String(raw)
		.replace(/\([^)]*\)/g, "")
		.replace(/"[^"]*"/g, "")
		.split(/[;,/]/)[0]
		.trim();

	if (pos === "Action Verb" || pos === "Descriptive Verb") {
		raw = raw.replace(/^to\s+/i, "").trim();
	}
	return raw;
}

/**
 * Pluralizes an English countable noun when count > 1.
 */
function pluralizeEnglishNoun(nounStr, count = 2) {
	if (!nounStr || count <= 1) return nounStr;
	const lower = nounStr.toLowerCase();
	if (UNCOUNTABLE_EN_NOUNS.has(lower)) return nounStr;
	if (lower === "person") return "people";
	if (lower === "child") return "children";
	if (lower === "man") return "men";
	if (lower === "woman") return "women";
	if (lower === "foot") return "feet";
	if (lower === "tooth") return "teeth";
	if (lower.endsWith("Clothes") || lower.endsWith("clothes") || lower.endsWith("pants") || lower.endsWith("glasses")) return nounStr;
	if (/[sxz]$/.test(lower) || /(?:ch|sh)$/.test(lower)) return nounStr + "es";
	if (/[^aeiou]y$/i.test(lower)) return nounStr.slice(0, -1) + "ies";
	return nounStr + "s";
}

/**
 * Attaches an appropriate English article ("the", "a", "an", or none) to a noun phrase.
 */
function withEnglishArticle(nounStr, unit = null, definite = true) {
	if (!nounStr) return "";
	const trimmed = nounStr.trim();
	const lower = trimmed.toLowerCase();

	if (/^(?:i|you|he|she|it|we|they|me|him|her|us|them|who|what|where|when|this|that|these|those|here|there|over there|my|your|his|her|our|their|a |an |the |\d)/i.test(lower)) {
		return trimmed;
	}
	if (UNCOUNTABLE_EN_NOUNS.has(lower) || PROPER_OR_BARE_PLACES.has(lower)) {
		return trimmed;
	}
	if (unit && (hasTag(unit, "language", "country", "nationality", "properName", "proper_name", "time", "temporal") || unit[DATA_SCHEMA.PartofSpeech] === "Pronoun")) {
		return trimmed;
	}
	if (/^[A-Z]/.test(trimmed)) {
		return trimmed;
	}
	if (lower.endsWith("s") && !lower.endsWith("ss") && !lower.endsWith("bus") && !lower.endsWith("class")) {
		return definite ? `the ${trimmed}` : trimmed;
	}
	if (definite) {
		return `the ${trimmed}`;
	}
	const vowelStart = /^[aeiou]/i.test(lower) && !/^uni|^use|^euro|^one/i.test(lower);
	return `${vowelStart ? "an" : "a"} ${trimmed}`;
}

/**
 * Realizes a nominal constituent into a natural English NP or PP.
 */
function realizeNaturalConstituent(con, clauseContext = {}) {
	if (!con) return "";
	const {
		role = "modifier",
		nounUnit = null,
		unit = null,
		determinerUnit = null,
		countValue = null,
		counterUnit = null,
		positionUnit = null,
		particleType = null,
		particleUnit = null
	} = con;

	const primaryUnit = nounUnit || unit;
	if (!primaryUnit && con.explicitSurfaceKo) {
		return "";
	}
	if (!primaryUnit) return "";

	const ko = primaryUnit[DATA_SCHEMA.Korean] || "";

	// 1. Counting phrase (e.g. 사과 세 개 -> "3 apples")
	if (counterUnit) {
		const count = countValue || 1;
		const baseNoun = getUnitNaturalPhrase(primaryUnit);
		const counterKo = counterUnit[DATA_SCHEMA.Korean] || "";
		if (counterKo === "잔") return `${count} ${count === 1 ? "cup" : "cups"} of ${baseNoun}`;
		if (counterKo === "병") return `${count} ${count === 1 ? "bottle" : "bottles"} of ${baseNoun}`;
		if (counterKo === "그릇") return `${count} ${count === 1 ? "bowl" : "bowls"} of ${baseNoun}`;
		return `${count} ${pluralizeEnglishNoun(baseNoun, count)}`;
	}

	// 2. Spatial phrase (e.g. 책상 위에 -> "on the desk")
	if (positionUnit) {
		const groundNP = withEnglishArticle(getUnitNaturalPhrase(primaryUnit), primaryUnit, true);
		const posKo = positionUnit[DATA_SCHEMA.Korean] || "";
		const posMap = {
			"위": "on",
			"아래": "under",
			"밑": "under",
			"앞": "in front of",
			"뒤": "behind",
			"옆": "next to",
			"안": "inside",
			"속": "inside",
			"밖": "outside",
			"사이": "between",
			"근처": "near"
		};
		const prep = posMap[posKo] || "at";
		return `${prep} ${groundNP}`;
	}

	// 3. Adverbialized Descriptive Verb ("{DVst}게" -> "nicely / in a [adj] way")
	if (role === "adverbial" && primaryUnit[DATA_SCHEMA.PartofSpeech] === "Descriptive Verb") {
		const sd = parseSemanticData(primaryUnit);
		const adj = (sd && sd.en && sd.en.adj) || getUnitNaturalPhrase(primaryUnit).replace(/^be\s+/i, "");
		if (adj.endsWith("y")) return adj.slice(0, -1) + "ily";
		if (adj === "good") return "well";
		if (adj === "fast" || adj === "hard" || adj === "late" || adj === "early") return adj;
		return `${adj}ly`;
	}

	// 4. Determiner + Noun (e.g. 이 책 -> "this book")
	if (determinerUnit) {
		const detEn = getUnitNaturalPhrase(determinerUnit);
		const nounEn = getUnitNaturalPhrase(primaryUnit);
		if (["every", "all", "other", "another"].includes(detEn.toLowerCase()) || ["이", "그", "저", "어느", "무슨", "어떤", "모든", "각"].includes(determinerUnit[DATA_SCHEMA.Korean])) {
			return `${detEn} ${nounEn}`;
		}
		return `a ${detEn} ${nounEn}`;
	}

	// 5. Pronouns in object/recipient role
	if (primaryUnit[DATA_SCHEMA.PartofSpeech] === "Pronoun" && (role === "object" || role === "recipient" || role === "companion")) {
		if (ko === "나" || ko === "저") return role === "recipient" ? "to me" : "me";
		if (ko === "우리" || ko === "저희") return role === "recipient" ? "to us" : "us";
		if (ko === "너" || ko === "당신") return role === "recipient" ? "to you" : "you";
		if (ko === "그") return role === "recipient" ? "to him" : "him";
		if (ko === "그녀") return role === "recipient" ? "to her" : "her";
	}

	const basePhrase = getUnitNaturalPhrase(primaryUnit);

	// 6. Prepositional roles (location, time, recipient, companion, instrumental)
	if (role === "location" || particleType === "location" || particleType === "location_static" || particleType === "location_dynamic" || particleType === "direction") {
		if (["here", "there", "over there", "where", "home", "abroad", "downtown"].includes(basePhrase.toLowerCase())) {
			const verbUnit = clauseContext.verbUnit;
			const isMotion = verbUnit && hasTag(verbUnit, "intransitive_motion", "locative_goal");
			if (basePhrase.toLowerCase() === "home" && !isMotion) return "at home";
			return basePhrase;
		}
		const verbUnit = clauseContext.verbUnit;
		const isMotion = verbUnit && hasTag(verbUnit, "intransitive_motion", "locative_goal");
		const isOrigin = verbUnit && hasTag(verbUnit, "locative_origin");
		const np = withEnglishArticle(basePhrase, primaryUnit, true);
		if (isOrigin) return `from ${np}`;
		if (isMotion || particleType === "direction") return `to ${np}`;
		return `at ${np}`;
	}

	if (role === "time" || particleType === "time" || particleType === "temporal") {
		const lower = basePhrase.toLowerCase();
		if (/^(?:today|yesterday|tomorrow|now|recently|always|often|sometimes|usually|soon|later|already|still|every|last|next|this)/i.test(lower)) {
			return basePhrase;
		}
		if (["morning", "afternoon", "evening"].includes(lower)) return `in the ${lower}`;
		if (lower === "night" || lower === "weekend" || lower === "noon") return `at ${lower}`;
		if (/(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(lower)) return `on ${basePhrase}`;
		return `in ${basePhrase}`;
	}

	if (role === "recipient" || particleType === "dative" || particleType === "dative_person") {
		return `to ${withEnglishArticle(basePhrase, primaryUnit, true)}`;
	}

	if (role === "companion" || particleType === "comitative") {
		return `with ${withEnglishArticle(basePhrase, primaryUnit, true)}`;
	}

	if (particleUnit) {
		const pKo = particleUnit[DATA_SCHEMA.Korean] || "";
		if (pKo.includes("에다가") && role !== "location") return `along with ${withEnglishArticle(basePhrase, primaryUnit, false)}`;
		if (pKo.includes("보다")) return `than ${withEnglishArticle(basePhrase, primaryUnit, true)}`;
		if (pKo === "부터") return `from ${basePhrase}`;
		if (pKo === "까지") return `until ${basePhrase}`;
		if (pKo === "마다") return `every ${basePhrase}`;
		if (pKo === "만") return `only ${withEnglishArticle(basePhrase, primaryUnit, true)}`;
		if (pKo.includes("의")) return `${withEnglishArticle(basePhrase, primaryUnit, true)}'s`;
	}

	if (primaryUnit[DATA_SCHEMA.PartofSpeech] === "Noun") {
		const definite = role === "topic" || role === "subject";
		return withEnglishArticle(basePhrase, primaryUnit, definite);
	}

	return basePhrase;
}

/**
 * Determines person/number of an English subject string for verb agreement.
 */
function getSubjectAgreement(subjStr) {
	const lower = (subjStr || "I").trim().toLowerCase();
	if (lower === "i") return { person: 1, singular: true, bePres: "am", bePast: "was" };
	if (lower === "you" || lower === "we" || lower === "they" || lower.includes(" and ") || (lower.endsWith("s") && !lower.endsWith("ss") && !lower.endsWith("class"))) {
		return { person: 2, singular: false, bePres: "are", bePast: "were" };
	}
	return { person: 3, singular: true, bePres: "is", bePast: "was" };
}

function inflectSingleVerbHead(word, form) {
	if (!word) return "";
	if (form === "s") {
		if (/[^aeiou]y$/i.test(word)) return word.slice(0, -1) + "ies";
		if (/(?:s|x|z|ch|sh|o)$/i.test(word)) return word + "es";
		return word + "s";
	}
	if (form === "ing") {
		if (word.endsWith("ie")) return word.slice(0, -2) + "ying";
		if (word.endsWith("e") && !word.endsWith("ee") && !word.endsWith("ye") && !word.endsWith("oe")) {
			return word.slice(0, -1) + "ing";
		}
		return word + "ing";
	}
	if (form === "past") {
		if (word.endsWith("e")) return word + "d";
		if (/[^aeiou]y$/i.test(word)) return word.slice(0, -1) + "ied";
		return word + "ed";
	}
	return word;
}

function inflectPhrasalOrSimpleVerb(base, explicitForm, formType) {
	const parts = base.trim().split(/\s+/);
	if (parts.length > 1) {
		// If explicitForm was naively generated by appending ed/ing/s to the second word, fix it by inflecting the head verb
		if (!explicitForm || explicitForm.endsWith(parts[parts.length - 1] + "ing") || explicitForm.endsWith(parts[parts.length - 1] + "ed") || explicitForm.endsWith(parts[parts.length - 1] + "s")) {
			return [inflectSingleVerbHead(parts[0], formType), ...parts.slice(1)].join(" ");
		}
	}
	return explicitForm || inflectSingleVerbHead(base, formType);
}

/**
 * Extracts verb inflection forms (`base`, `past`, `part`, `s`, `ing`, `adj`) for a verb unit.
 */
function getVerbEnForms(verbUnit) {
	if (!verbUnit) {
		return { base: "do", past: "did", part: "done", s: "does", ing: "doing", adj: "" };
	}
	const sd = parseSemanticData(verbUnit);
	const en = (sd && sd.en) || {};
	const fallback = getUnitNaturalPhrase(verbUnit) || "do";
	const base = (en.base || fallback).replace(/^to\s+/i, "").trim();
	const past = inflectPhrasalOrSimpleVerb(base, en.past, "past");
	const part = inflectPhrasalOrSimpleVerb(base, en.part || past, "past");
	const s = inflectPhrasalOrSimpleVerb(base, en.s, "s");
	const ing = inflectPhrasalOrSimpleVerb(base, en.ing, "ing");
	const adj = en.adj || base.replace(/^be\s+/i, "").trim();

	return { base, past, part, s, ing, adj, prep: en.prep || null };
}

/**
 * Realizes a single ClauseAST into a natural English clause string.
 */
function realizeNaturalClause(clause, ast, isSubordinate = false) {
	if (!clause) return { text: "", conjPrefix: "", conjSuffix: "" };

	const constituents = clause.constituents || [];
	const pred = clause.predicate || null;
	const verbUnit = pred ? pred.verbUnit : null;
	const clauseContext = {
		honorific: Boolean(clause.honorific || ast.honorific),
		verbUnit
	};

	let discourseParts = [];
	let topicCon = null;
	let subjectCon = null;
	let objectParts = [];
	let recipientParts = [];
	let locationParts = [];
	let timeParts = [];
	let adverbParts = [];

	for (const con of constituents) {
		const role = con.role || "modifier";
		if (role === "discourse") {
			const d = getUnitNaturalPhrase(con.unit || con.nounUnit);
			if (d) discourseParts.push(d);
		} else if (role === "topic" && !topicCon) {
			topicCon = con;
		} else if (role === "subject" && !subjectCon) {
			subjectCon = con;
		} else if (role === "object" || role === "noun_phrase") {
			const o = realizeNaturalConstituent(con, clauseContext);
			if (o) objectParts.push(o);
		} else if (role === "recipient") {
			const r = realizeNaturalConstituent(con, clauseContext);
			if (r) recipientParts.push(r);
		} else if (role === "location") {
			const l = realizeNaturalConstituent(con, clauseContext);
			if (l) locationParts.push(l);
		} else if (role === "time") {
			const t = realizeNaturalConstituent(con, clauseContext);
			if (t) timeParts.push(t);
		} else if (role === "adverb" || role === "adverbial") {
			const a = realizeNaturalConstituent(con, clauseContext);
			if (a) adverbParts.push(a);
		}
	}

	const speechAct = (!isSubordinate && ast.speechAct) || (pred && pred.speechAct) || "declarative";
	const tense = (pred && pred.tense) || ast.tense || "present";
	const polarity = (pred && pred.polarity) || ast.polarity || "affirmative";
	const modality = (pred && pred.modality) || ast.modality || null;
	const grammarUnit = (pred && (pred.grammarUnit || pred.endingUnit || pred.connectiveUnit)) || ast.grammarUnit || null;
	const gKo = grammarUnit ? (grammarUnit[DATA_SCHEMA.Korean] || "") : "";

	// Determine English Subject NP
	let subjStr = "";
	let topicPrefix = "";
	if (topicCon && subjectCon) {
		const topNP = realizeNaturalConstituent(topicCon, clauseContext);
		const subNP = realizeNaturalConstituent(subjectCon, clauseContext);
		// Special possession pattern with 있다/없다 (e.g. 학생은 책이 있어요 -> "The student has a book")
		if (verbUnit && (verbUnit[DATA_SCHEMA.Korean] === "있다" || verbUnit[DATA_SCHEMA.Korean] === "없다")) {
			subjStr = topNP;
			const possessedObj = realizeNaturalConstituent({ ...subjectCon, role: "object" }, clauseContext);
			objectParts.unshift(possessedObj);
		} else {
			topicPrefix = `As for ${topNP}, `;
			subjStr = subNP;
		}
	} else if (subjectCon) {
		subjStr = realizeNaturalConstituent(subjectCon, clauseContext);
	} else if (topicCon) {
		subjStr = realizeNaturalConstituent(topicCon, clauseContext);
	} else {
		if (speechAct === "imperative" || speechAct === "propositive") {
			subjStr = "";
		} else if (speechAct === "interrogative" || gKo.includes("나요") || gKo.includes("은가요") || gKo.includes("습니까") || gKo.includes("래요")) {
			subjStr = "you";
		} else if (clauseContext.honorific) {
			subjStr = "they";
		} else if (verbUnit && verbUnit[DATA_SCHEMA.PartofSpeech] === "Descriptive Verb") {
			subjStr = "it";
		} else {
			subjStr = "I";
		}
	}

	const agr = getSubjectAgreement(subjStr);

	// Handle standalone discourse/exclamation without predicate
	if (!pred) {
		return {
			text: [...discourseParts, subjStr, ...objectParts, ...locationParts, ...timeParts].filter(Boolean).join(" "),
			conjPrefix: "",
			conjSuffix: ""
		};
	}

	let vpStr = "";
	let questionAux = "";
	let conjPrefix = "";
	let conjSuffix = "";

	// Check if subordinate connective or specialized grammar unit
	if (gKo) {
		if (gKo.includes("아/어서") || gKo.includes("니까") || gKo.includes("기 때문에") || gKo.includes("므로") || gKo.includes("느라고") || gKo.includes("바람에")) {
			if (isSubordinate) conjPrefix = "because ";
		} else if (gKo.includes("지만")) {
			if (isSubordinate) conjPrefix = "although ";
		} else if (gKo.includes("는데") || gKo.includes("ㄴ데")) {
			if (isSubordinate) conjSuffix = ", and";
		} else if (gKo.includes("면서")) {
			if (isSubordinate) conjPrefix = "while ";
		} else if ((gKo.includes("으)면") || gKo.includes("-으면")) && !gKo.includes("안 되다") && !gKo.includes("좋겠다")) {
			if (isSubordinate) conjPrefix = "if ";
		} else if (gKo.includes("ㄹ 때")) {
			if (isSubordinate) conjPrefix = "when ";
		} else if (gKo.includes("자마자")) {
			if (isSubordinate) conjPrefix = "as soon as ";
		} else if (gKo.includes("기 전에")) {
			if (isSubordinate) conjPrefix = "before ";
		} else if (gKo.includes("ㄴ 후에") || gKo.includes("다음에")) {
			if (isSubordinate) conjPrefix = "after ";
		} else if (gKo.includes("하려고") || gKo.includes("으)려고") && isSubordinate) {
			conjPrefix = "in order to ";
		} else if (gKo === "~고" && isSubordinate) {
			conjSuffix = ", and";
		}
	}

	// 1. Copula Predicate
	if (pred.predType === "copula" && pred.copulaNounUnit) {
		const copNP = withEnglishArticle(getUnitNaturalPhrase(pred.copulaNounUnit), pred.copulaNounUnit, false);
		const beV = tense === "past" ? agr.bePast : agr.bePres;
		if (speechAct === "interrogative" && !isSubordinate) {
			questionAux = beV;
			vpStr = `${polarity === "negative" ? "not " : ""}${copNP}`;
		} else {
			vpStr = `${beV}${polarity === "negative" ? " not" : ""} ${copNP}`;
		}
	} else if (verbUnit) {
		const vKo = verbUnit[DATA_SCHEMA.Korean] || "";
		const isAction = verbUnit[DATA_SCHEMA.PartofSpeech] === "Action Verb";
		const forms = getVerbEnForms(verbUnit);
		const advPre = adverbParts.length > 0 ? adverbParts.join(" ") + " " : "";
		adverbParts = []; // Consumed inside VP

		// Special case: 있다 / 없다
		if (!isAction && (vKo === "있다" || vKo === "없다")) {
			const isNegExist = vKo === "없다" || polarity === "negative";
			if (objectParts.length > 0) {
				// Possession ("The student has a book")
				const haveV = tense === "past"
					? (isNegExist ? "did not have" : "had")
					: (isNegExist ? (agr.singular && agr.person === 3 ? "does not have" : "do not have") : (agr.singular && agr.person === 3 ? "has" : "have"));
				vpStr = `${ advPre }${ haveV }`;
			} else {
				const beV = tense === "past" ? agr.bePast : agr.bePres;
				vpStr = `${ beV }${ isNegExist ? " not" : "" } ${ advPre }${ locationParts.length > 0 ? "" : "present" }`.trim();
			}
		} else if (!isAction) {
			// Descriptive Verb (Adjective predicate)
			const beV = tense === "past" ? agr.bePast : (tense === "future" ? "will be" : agr.bePres);
			if (gKo.includes("어지다")) {
				const getV = tense === "past" ? "became" : (agr.singular && agr.person === 3 ? "becomes" : "become");
				vpStr = `${getV} ${advPre}${forms.adj}`;
			} else if (speechAct === "interrogative" && !isSubordinate && tense !== "future") {
				questionAux = beV;
				vpStr = `${polarity === "negative" ? "not " : ""}${advPre}${forms.adj}`;
			} else {
				const negStr = polarity === "negative" ? " not" : "";
				vpStr = `${beV}${negStr} ${advPre}${forms.adj}`;
			}
		} else {
			// Action Verb
			if (conjPrefix === "in order to ") {
				subjStr = "";
				vpStr = `${advPre}${forms.base}`;
			} else if (speechAct === "imperative") {
				subjStr = "";
				vpStr = polarity === "negative"
					? `please do not ${advPre}${forms.base}`
					: `please ${advPre}${forms.base}`;
			} else if (speechAct === "propositive" || gKo.includes("까요")) {
				if (gKo.includes("까요")) {
					subjStr = "we";
					questionAux = "shall";
					vpStr = `${advPre}${forms.base}`;
				} else {
					subjStr = "";
					vpStr = `let's ${advPre}${forms.base}`;
				}
			} else if (gKo.includes("는 중이다") || gKo.includes("고 있다") || modality === "progressive") {
				vpStr = `${tense === "past" ? agr.bePast : agr.bePres} ${advPre}${forms.ing}`;
			} else if (gKo.includes("고 싶다") || modality === "desire") {
				const wantV = tense === "past" ? "wanted" : (agr.singular && agr.person === 3 ? "wants" : "want");
				vpStr = `${advPre}${wantV} to ${forms.base}`;
			} else if (gKo.includes("고 싶어하다")) {
				vpStr = `${advPre}${agr.singular && agr.person === 3 ? "wants" : "want"} to ${forms.base}`;
			} else if (gKo.includes("수 있다") || modality === "ability") {
				vpStr = `can ${advPre}${forms.base}`;
			} else if (gKo.includes("수 없다") || modality === "inability" || pred.negationType === "short_mot" || pred.negationType === "long_ji_mothada") {
				vpStr = `${tense === "past" ? "could not" : "cannot"} ${advPre}${forms.base}`;
			} else if (gKo.includes("야 하다") || gKo.includes("야겠다") || modality === "obligation") {
				vpStr = `must ${advPre}${forms.base}`;
			} else if (gKo.includes("도 되다") || modality === "permission") {
				vpStr = `may ${advPre}${forms.base}`;
			} else if (gKo.includes("면 안 되다") || modality === "prohibition") {
				vpStr = `must not ${advPre}${forms.base}`;
			} else if (gKo.includes("어 보다") || modality === "try_attempt") {
				const tryV = tense === "past" || gKo.includes("experience") ? "tried" : (agr.singular && agr.person === 3 ? "tries" : "try");
				vpStr = `${advPre}${tryV} ${forms.ing}`;
			} else if (gKo.includes("적이 있다") || modality === "experience") {
				const haveV = agr.singular && agr.person === 3 ? "has" : "have";
				vpStr = `${haveV} ${advPre}${forms.part}`;
			} else if (gKo.includes("기로 하다")) {
				vpStr = `decided to ${advPre}${forms.base}`;
			} else if (gKo.includes("게 되다")) {
				vpStr = `ended up ${advPre}${forms.ing}`;
			} else if (gKo.includes("려고 하다")) {
				const planV = agr.singular && agr.person === 3 ? "plans" : "plan";
				vpStr = `${planV} to ${advPre}${forms.base}`;
			} else if (gKo.includes("었으면 좋겠다") || gKo.includes("면 좋겠다")) {
				vpStr = `hope to ${advPre}${forms.base}`;
			} else if (polarity === "negative") {
				const doAux = tense === "past" ? "did not" : (agr.singular && agr.person === 3 ? "does not" : "do not");
				vpStr = `${doAux} ${advPre}${forms.base}`;
			} else if (tense === "past") {
				if (speechAct === "interrogative" && !isSubordinate) {
					questionAux = "did";
					vpStr = `${advPre}${forms.base}`;
				} else {
					vpStr = `${advPre}${forms.past}`;
				}
			} else if (tense === "future" || gKo.includes("거예요") || gKo.includes("ㄹ게요") || gKo.includes("겠다")) {
				if (speechAct === "interrogative" && !isSubordinate) {
					questionAux = "will";
					vpStr = `${advPre}${forms.base}`;
				} else {
					vpStr = `will ${advPre}${forms.base}`;
				}
			} else {
				if (speechAct === "interrogative" && !isSubordinate) {
					questionAux = agr.singular && agr.person === 3 ? "does" : "do";
					vpStr = `${advPre}${forms.base}`;
				} else {
					const mainV = agr.singular && agr.person === 3 ? forms.s : forms.base;
					vpStr = `${advPre}${mainV}`;
				}
			}
		}
	}

	const objStr = objectParts.join(" ");
	const recipStr = recipientParts.join(" ");
	const locStr = locationParts.join(" ");
	const timeStr = timeParts.join(" ");
	const discStr = discourseParts.length > 0 ? discourseParts.join(", ") + ", " : "";

	let coreParts = [];
	if (questionAux) {
		coreParts = [questionAux, subjStr, vpStr, objStr, recipStr, locStr, timeStr];
	} else {
		coreParts = [subjStr, vpStr, objStr, recipStr, locStr, timeStr];
	}

	const assembled = discStr + topicPrefix + coreParts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
	return {
		text: assembled,
		conjPrefix,
		conjSuffix
	};
}

/**
 * Realizes a complete `SentenceAST` into an idiomatic SVO English sentence (`enNatural`).
 */
function realizeNaturalEnglish(ast) {
	if (!ast || !Array.isArray(ast.clauses) || ast.clauses.length === 0) {
		return "";
	}

	let fullText = "";
	if (ast.clauses.length === 1) {
		const c0 = realizeNaturalClause(ast.clauses[0], ast, false);
		fullText = c0.text;
	} else {
		const c0 = realizeNaturalClause(ast.clauses[0], ast, true);
		const c1 = realizeNaturalClause(ast.clauses[1], ast, false);
		if (c0.conjPrefix) {
			fullText = `${c0.conjPrefix}${c0.text}, ${c1.text}`;
		} else if (c0.conjSuffix) {
			fullText = `${c0.text}${c0.conjSuffix} ${c1.text}`;
		} else {
			fullText = `${c0.text}, and ${c1.text}`;
		}
	}

	fullText = fullText.trim();
	if (!fullText) return "";

	// Capitalize first letter
	fullText = fullText.charAt(0).toUpperCase() + fullText.slice(1);

	const speechAct = ast.speechAct || "declarative";
	const punct = speechAct === "interrogative" ? "?" : (speechAct === "exclamatory" ? "!" : ".");
	if (!/[.?!]$/.test(fullText)) {
		fullText += punct;
	}

	return fullText;
}

const naturalRealizerExports = {
	getUnitNaturalPhrase,
	pluralizeEnglishNoun,
	withEnglishArticle,
	realizeNaturalConstituent,
	getVerbEnForms,
	realizeNaturalClause,
	realizeNaturalEnglish
};

if (typeof window !== 'undefined') {
	Object.assign(window, naturalRealizerExports);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = naturalRealizerExports;
}
})();
