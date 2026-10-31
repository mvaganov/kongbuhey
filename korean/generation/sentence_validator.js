/**
 * Automated Linguistic Validator for Korean Sentence Generation
 *
 * Automates the discovery of grammatical, semantic, and AST provenance
 * inconsistencies across generated Korean sentences:
 *
 * 1. VALENCY_TRANSITIVITY_MISMATCH: Accusative particle -(을/를) with intransitive/passive/weather predicates.
 * 2. REDUNDANT_DOUBLE_OBJECT: Predicates that already incorporate a noun object taking an external accusative noun.
 * 3. INANIMATE_AGENT_MISMATCH: Inanimate/abstract nouns acting as agentive subjects of volitional human verbs.
 * 4. CLASSIFIER_DOMAIN_MISMATCH: Numeral classifiers paired with incompatible noun semantic domains.
 * 5. AST_PROVENANCE_DESYNC: Desync between realized Korean surface text, eojeols, morpheme segments, or unit IDs.
 * 6. UNRESOLVED_MARKERS: Unresolved template placeholders, particle alternations, or irregular conjugation tags.
 *
 * Platform: Node.js & Browser (Vanilla JS, zero external dependencies).
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

// Common INTRANSITIVE verbs that cannot take an accusative direct object -(을/를)
const INTRANSITIVE_VERB_ROOTS = new Set([
	"가다", "오다", "도착하다", "출발하다", "다니다", "돌아오다", "돌아가다", "올라가다", "내려가다",
	"끝나다", "시작되다", "배달되다", "고장 나다", "일어나다", "자다", "죽다", "살다", "눕다", "서다",
	"비가 오다", "눈이 오다", "바람이 불다", "목이 쉬다", "몸이 떨리다", "떨리다", "생기다", "남다"
]);

// Volitional actions that strictly require human or animate agents
const STRICT_VOLITIONAL_HUMAN_VERBS = new Set([
	"공부하다", "식사하다", "일하다", "운동하다", "생각하다", "이야기하다", "운전하다",
	"노래하다", "춤을 추다", "독서를 하다", "데이트하다", "등산하다", "아르바이트하다",
	"대답하다", "질문하다", "서명하다", "결정하다", "기뻐하다", "슬퍼하다"
]);

// Numeral classifier category rules
const CLASSIFIER_DOMAIN_RULES = {
	"명": { allowedTags: ["person", "human", "family", "profession", "job", "honorific_person", "kinship_plain"], name: "people" },
	"분": { allowedTags: ["person", "human", "family", "profession", "elder", "elder_noun", "honorific_person"], name: "honored people" },
	"마리": { allowedTags: ["animal", "pet", "fish", "bird", "insect"], name: "animals" },
	"권": { allowedTags: ["book", "publication", "paper", "document"], name: "books/publications" },
	"잔": { allowedTags: ["drink", "beverage", "liquid"], name: "beverages" },
	"병": { allowedTags: ["drink", "beverage", "liquid", "bottle"], name: "bottles" },
	"송이": { allowedTags: ["flower", "plant", "fruit"], name: "flowers/bunches" },
	"대": { allowedTags: ["vehicle", "electronics", "machine", "appliance", "car"], name: "vehicles/machines" },
	"벌": { allowedTags: ["clothing", "clothes"], name: "clothing items" },
	"켤레": { allowedTags: ["footwear", "shoes", "socks", "gloves"], name: "footwear pairs" },
	"쪽": { allowedTags: ["book", "paper", "document", "publication"], name: "pages/paper items" }
};

// Patterns representing unresolved generation syntax or morphology bugs
const UNRESOLVED_PATTERNS = [
	{ pattern: /\{[^}]*\}/, code: "UNRESOLVED_PLACEHOLDER", message: "Unresolved template placeholder remaining in Korean text" },
	{ pattern: /이\/가|은\/는|을\/를|\(이\)랑|\(이\)나|이\/나|\(이\)라서|이\/라서|\(이\)라도|이\/라도|\(이\)든지|이\/든지|과\/와|와\/과/, code: "UNRESOLVED_PARTICLE_PAIR", message: "Unresolved particle alternation pair" },
	{ pattern: /아\/어|으\/|았\/었/, code: "UNRESOLVED_VOWEL_HARMONY", message: "Unresolved vowel harmony / stem alternation marker" },
	{ pattern: /\[[a-z_]+\]/, code: "UNRESOLVED_CONJUGATION_TAG", message: "Unresolved irregular conjugation tag" },
	{ pattern: /\u200B/, code: "RESIDUAL_ZERO_WIDTH_SPACE", message: "Residual internal zero-width space marker (\u200B)" }
];

/**
 * Validates a realization against a SentenceAST.
 *
 * @param {Object} ast - SentenceAST
 * @param {Object} realized - Object returned by realizeKoreanFromAST(ast)
 * @returns {{ valid: boolean, errors: Array<{code: string, message: string}>, warnings: Array<{code: string, message: string}> }}
 */
function validateSentenceAST(ast, realized) {
	const errors = [];
	const warnings = [];

	if (!realized || typeof realized.ko !== "string") {
		errors.push({ code: "NULL_REALIZATION", message: "Sentence realization is null or missing 'ko' string." });
		return { valid: false, errors, warnings };
	}

	const ko = realized.ko;
	const koClean = ko.replace(/[.?!~]+$/, "").trim();

	// 1. Unresolved markers
	for (const up of UNRESOLVED_PATTERNS) {
		if (up.pattern.test(ko)) {
			errors.push({ code: up.code, message: `${up.message} in: "${ko}"` });
		}
	}

	// 2. AST Provenance Desync (Surface vs Eojeols vs Segments)
	const eojeols = realized.eojeols || [];
	const eojeolJoined = eojeols.map(e => e.surfaceKo).join(" ").trim();

	if (eojeolJoined && koClean && eojeolJoined !== koClean) {
		errors.push({
			code: "AST_PROVENANCE_DESYNC",
			message: `Eojeol surface text mismatch: "${eojeolJoined}" !== "${koClean}"`
		});
	}

	eojeols.forEach((ej, idx) => {
		const segs = ej.segments || [];
		if (segs.length > 0) {
			const segJoined = segs.map(s => s.textKo || s.text || "").join("");
			if (segJoined !== ej.surfaceKo) {
				errors.push({
					code: "SEGMENT_RECONSTRUCTION_MISMATCH",
					message: `Eojeol [${idx}] segments "${segJoined}" !== surface "${ej.surfaceKo}"`
				});
			}
		}
	});

	// Check unit provenance
	if (Array.isArray(realized.unitsUsed)) {
		const usedIdSet = new Set(realized.unitsUsed.map(u => u.unitId));
		eojeols.forEach(ej => {
			for (const id of (ej.unitIds || [])) {
				if (typeof id === "number" && !usedIdSet.has(id)) {
					warnings.push({
						code: "MISSING_UNIT_IN_PROVENANCE",
						message: `Unit ID ${id} present in eojeol '${ej.surfaceKo}' but omitted from unitsUsed array.`
					});
				}
			}
		});
	}

	// 3. Clause-level Syntactic & Semantic Checks
	const clauses = (ast && Array.isArray(ast.clauses)) ? ast.clauses : [];
	for (const clause of clauses) {
		const constituents = clause.constituents || [];
		const pred = clause.predicate || {};
		const verbUnit = pred.verbUnit || null;
		const verbKo = verbUnit ? (verbUnit[DATA_SCHEMA.Korean] || "") : "";
		const predType = pred.predType || (verbUnit && verbUnit[DATA_SCHEMA.PartofSpeech] === "Descriptive Verb" ? "descriptive" : "action");

		// Find constituents by role
		let subjCon = null;
		let objCon = null;
		let numCon = null;

		for (const con of constituents) {
			if (con.role === "subject" || con.role === "topic") subjCon = con;
			if (con.role === "object" || con.particleType === "object" || con.particleType === "accusative") objCon = con;
			if (con.numeralUnit || con.classifierUnit) numCon = con;
		}

		// A. VALENCY_TRANSITIVITY_MISMATCH
		if (objCon) {
			const objUnit = objCon.nounUnit || objCon.unit;
			const objKo = objUnit ? objUnit[DATA_SCHEMA.Korean] : "";

			if (predType === "descriptive") {
				errors.push({
					code: "VALENCY_TRANSITIVITY_MISMATCH",
					message: `Descriptive verb '${verbKo}' cannot take accusative direct object '${objKo}' in: "${ko}"`
				});
			} else if (verbKo) {
				const isIntrans = INTRANSITIVE_VERB_ROOTS.has(verbKo) ||
					(verbUnit && hasTag(verbUnit, "intransitive", "passive", "weather") && !hasTag(verbUnit, "transitive"));
				if (isIntrans) {
					errors.push({
						code: "VALENCY_TRANSITIVITY_MISMATCH",
						message: `Intransitive verb '${verbKo}' cannot take accusative direct object '${objKo}' in: "${ko}"`
					});
				}
			}
		}

		// B. REDUNDANT_DOUBLE_OBJECT
		if (objCon && verbKo && verbKo.includes(" ")) {
			// e.g. "문자메시지를 받다", "샤워를 하다", "약속을 지키다", "자전거를 타다"
			if (verbKo.includes("을 ") || verbKo.includes("를 ")) {
				errors.push({
					code: "REDUNDANT_DOUBLE_OBJECT",
					message: `Multi-word verb '${verbKo}' already contains an incorporated object, invalidating external object in: "${ko}"`
				});
			}
		}

		// C. INANIMATE_AGENT_MISMATCH
		if (subjCon && verbKo) {
			const subjUnit = subjCon.nounUnit || subjCon.unit;
			if (subjUnit) {
				const subjKo = subjUnit[DATA_SCHEMA.Korean] || "";
				const isStrictHumanVerb = STRICT_VOLITIONAL_HUMAN_VERBS.has(verbKo);
				const isInanimate = hasTag(subjUnit, "inanimate", "abstract", "academic", "concept", "facility")
					|| ["신분증", "경제학", "의자", "공항버스", "수업", "회의", "가구"].includes(subjKo);

				if (isStrictHumanVerb && isInanimate) {
					warnings.push({
						code: "INANIMATE_AGENT_MISMATCH",
						message: `Inanimate noun '${subjKo}' is improbable agent for volitional verb '${verbKo}' in: "${ko}"`
					});
				}
			}
		}

		// D. CLASSIFIER_DOMAIN_MISMATCH
		if (numCon && numCon.classifierUnit && numCon.nounUnit) {
			const cKo = numCon.classifierUnit[DATA_SCHEMA.Korean];
			const nUnit = numCon.nounUnit;
			const nKo = nUnit[DATA_SCHEMA.Korean];
			const rule = CLASSIFIER_DOMAIN_RULES[cKo];

			if (rule) {
				const hasAllowedTag = rule.allowedTags.some(t => hasTag(nUnit, t));
				if (!hasAllowedTag) {
					warnings.push({
						code: "CLASSIFIER_DOMAIN_MISMATCH",
						message: `Classifier '${cKo}' (${rule.name}) is incompatible with noun '${nKo}' in: "${ko}"`
					});
				}
			}
		}
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings
	};
}

/**
 * Validates a plain Korean sentence string without AST context.
 *
 * @param {string} ko - Realized surface Korean string
 * @param {Object} [context={}] - Contextual hint
 * @returns {{ valid: boolean, errors: Array<{code: string, message: string}>, warnings: Array<{code: string, message: string}> }}
 */
function validateSentenceString(ko, context = {}) {
	const errors = [];
	const warnings = [];
	if (!ko || typeof ko !== "string") {
		return { valid: false, errors: [{ code: "EMPTY_STRING", message: "Input is empty or not a string" }], warnings };
	}

	// 1. Unresolved markers
	for (const up of UNRESOLVED_PATTERNS) {
		if (up.pattern.test(ko)) {
			errors.push({ code: up.code, message: `${up.message} in: "${ko}"` });
		}
	}

	// 2. Double negation anomaly
	if (/(?:^|\s)안\s+안(?:\s|$|[.,?!])|(?:^|\s)못\s+못(?:\s|$|[.,?!])/.test(ko)) {
		errors.push({ code: "REDUNDANT_DOUBLE_NEGATION", message: `Duplicate negation particles detected in: "${ko}"` });
	}

	// 3. Spurious "니까 오세요" clausal corruption
	if (/니까\s+오세요/.test(ko)) {
		errors.push({ code: "CORRUPTED_CLAUSAL_GREETING", message: `Corrupted greeting '니까 오세요' detected in: "${ko}"` });
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings
	};
}

const sentenceValidatorExports = {
	validateSentenceAST,
	validateSentenceString,
	INTRANSITIVE_VERB_ROOTS,
	STRICT_VOLITIONAL_HUMAN_VERBS,
	CLASSIFIER_DOMAIN_RULES,
	UNRESOLVED_PATTERNS
};

if (typeof window !== 'undefined') {
	window.SentenceValidator = sentenceValidatorExports;
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = sentenceValidatorExports;
}
