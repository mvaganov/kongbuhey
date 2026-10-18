/**
 * text_analyzer.js
 * 
 * Korean Passage Ingestion, Morphological Decomposition, Homonym Disambiguation,
 * and Curriculum Gap Identification Engine for Kongbuhey.
 * 
 * Architecture & Philosophy:
 *   1. Zero Hard-Coded Word Statements: Disambiguation between homonyms (e.g. 저 pronoun vs.
 *      determiner, 이 determiner vs. numeral vs. noun, 하고 particle vs. verb connective)
 *      is driven strictly by declarative `SyntaxFrame` templates and `SemanticTags` /
 *      `SemanticVector` matching on adjacent words.
 *   2. SyntaxFrame Specification: A domain-specific valency & collocation pattern language:
 *        - `_` : The anchor morpheme/unit.
 *        - `\+` : Direct morphological attachment (no whitespace).
 *        - `\s+` : Whitespace separation between orthographic tokens.
 *        - `^`, `$` : Phrase/word boundary anchors.
 *        - `{Noun}`, `{Noun:place}`, `{Noun:time}`, `{Noun:tool|vehicle|language}` : POS & Semantic constraints.
 *        - `{Verb}`, `{Verb:movement}`, `{Verb:stative}`, `{Verb:cognition}` : Predicate constraints.
 *        - `{VP}` : Verb predicate stem.
 *        - `{VP_adnominal}` : Adnominal verb participle (-(으)ㄴ, -는, -(으)ㄹ).
 *        - `{Particle}` : Case, topic, or delimiter particle.
 *        - `{Number}`, `{Counter}` : Numeric values and classifiers.
 *   3. Polysemous Particle Disambiguation: Surrounding nouns and clause predicates are
 *      scanned for semantic tags (e.g. place + motion verb -> directional -에 / -(으)로;
 *      place + stative verb -> locational -에).
 *   4. Intentional Pedagogical Ambiguity: When linguistic context is genuinely ambiguous
 *      or admits multiple valid interpretations, the engine surfaces the ambiguity
 *      intentionally as a study note rather than masking it.
 *   5. Dual Report Output:
 *        - Student Study Checklist (Known vocabulary and grammar in passage).
 *        - Developer Curriculum Gap Inventory (Missing vocabulary and grammar).
 */

const { KR_EN_languageUnits, DATA_SCHEMA } = require('./data.js');
const { HOMONYMS, lookupToken } = require('./homonyms.js');
const { decomposeHangul, composeHangul, hasBatchim, getStem, setFinal } = require('./korean.js');

// =========================================================================
// 1. Data Indexing & Fast In-Memory Indexes
// =========================================================================

const vocabByKo = new Map();
const grammarByKo = new Map();
const unitById = new Map();

for (const u of KR_EN_languageUnits) {
	if (!u) continue;
	const id = u[DATA_SCHEMA.Id];
	const ko = u[DATA_SCHEMA.Korean];
	const pos = u[DATA_SCHEMA.PartofSpeech];
	unitById.set(id, u);

	if (pos === 'Grammar') {
		if (!grammarByKo.has(ko)) grammarByKo.set(ko, []);
		grammarByKo.get(ko).push(u);
	} else {
		if (!vocabByKo.has(ko)) vocabByKo.set(ko, []);
		vocabByKo.get(ko).push(u);

		// Index dictionary stem for verbs
		if ((pos === 'Action Verb' || pos === 'Descriptive Verb') && ko.endsWith('다')) {
			const stem = ko.replace(/다$/, '');
			if (!vocabByKo.has(stem)) vocabByKo.set(stem, []);
			vocabByKo.get(stem).push(u);
		}
	}
}

// Particle specifications with target grammar IDs where available
const PARTICLE_SPECS = [
	{ text: "에서는", ids: [199, 36], desc: "에서 + 는 (Location topic)" },
	{ text: "에서도", ids: [199, 366], desc: "에서 + 도 (Location additive)" },
	{ text: "에는", ids: [132, 36], desc: "에 + 는 (Time/Location topic)" },
	{ text: "에게는", ids: [618, 36], desc: "에게 + 는 (Dative topic)" },
	{ text: "에서", ids: [199], desc: "에서 (Location of action / source)" },
	{ text: "에게", ids: [618], desc: "에게 (Dative)" },
	{ text: "한테", ids: [618], desc: "한테 (Dative informal)" },
	{ text: "으로", ids: [1240, 1241, 1242], desc: "-(으)로 (Direction / Means / Status)", batchimReq: true },
	{ text: "로", ids: [1240, 1241, 1242], desc: "-(으)로 (Direction / Means / Status)", batchimReq: false },
	{ text: "이나", ids: [1333, 1334], desc: "이나 (Choice / Quantity)", batchimReq: true },
	{ text: "이랑", ids: [276], desc: "(이)랑 (And / With)", batchimReq: true },
	{ text: "랑", ids: [276], desc: "(이)랑 (And / With)", batchimReq: false },
	{ text: "하고", ids: [367], desc: "하고 (And / With)" },
	{ text: "부터", ids: [433], desc: "부터 (Starting point)" },
	{ text: "까지", ids: [435], desc: "까지 (Ending point)" },
	{ text: "은", ids: [36], desc: "은 / 는 (Topic)", batchimReq: true },
	{ text: "는", ids: [36], desc: "은 / 는 (Topic)", batchimReq: false },
	{ text: "이", ids: [96], desc: "이 / 가 (Subject)", batchimReq: true },
	{ text: "가", ids: [96], desc: "이 / 가 (Subject)", batchimReq: false },
	{ text: "을", ids: [173], desc: "을 / 를 (Object)", batchimReq: true },
	{ text: "를", ids: [173], desc: "을 / 를 (Object)", batchimReq: false },
	{ text: "에", ids: [132, 200, 275], desc: "에 (Location / Direction / Time)" },
	{ text: "과", ids: [1624], desc: "과 (And / With)", batchimReq: true },
	{ text: "와", ids: [1624], desc: "와 (And / With)", batchimReq: false },
	{ text: "도", ids: [366], desc: "도 (Also / Too)" },
	{ text: "의", ids: [856, 857], desc: "의 (Possessive / Relation)" },
	{ text: "쯤", ids: [653], desc: "쯤 (Approximation particle)" },
	{ text: "만", ids: [365], desc: "만 (Only)" }
];

// Pronominal irregular subject allomorph rules (저+가 -> 제가, 나+가 -> 내가, 너+가 -> 네가)
const PRONOMINAL_SUBJECT_ALLOMORPHS = {
	"제": { baseId: 2, baseWord: "저", particleId: 96, particleWord: "가" },
	"내": { baseId: 1, baseWord: "나", particleId: 96, particleWord: "가" },
	"네": { baseId: 3, baseWord: "너", particleId: 96, particleWord: "가" }
};

// =========================================================================
// 2. Semantic Ontology & Tag Matching Helpers
// =========================================================================

const SEMANTIC_ONTOLOGY = {
	place: new Set(["place", "country", "place_indoor", "place_outdoor", "location", "institution", "world"]),
	time: new Set(["time", "duration", "frequency", "point_in_time", "counter", "past", "present", "future"]),
	tool: new Set(["tool", "vehicle", "language", "material", "device", "transportation", "instrument"]),
	role: new Set(["role", "profession", "person", "family", "social"]),
	abstract: new Set(["abstract", "concept", "culture", "cognition", "emotion"]),
	movement: new Set(["movement", "motion", "travel", "intransitive_motion", "entry"]),
	stative: new Set(["stative", "existence", "property", "state", "descriptive"]),
	cognition: new Set(["cognition", "mental", "emotion", "communication"])
};

// High-frequency motion and stative verbs for semantic valency cross-checking
const MOTION_VERB_STEMS = new Set(["가", "오", "다니", "도착하", "돌아가", "올라가", "내려가", "나가", "들어오", "떠나", "입학하"]);
const STATIVE_VERB_STEMS = new Set(["있", "없", "살", "많", "좋", "크", "작", "계시", "남"]);

function getUnitSemanticTags(unit) {
	if (!unit) return new Set();
	const rawTags = unit[DATA_SCHEMA.SemanticTags];
	const tags = new Set();
	if (Array.isArray(rawTags)) {
		rawTags.forEach(t => tags.add(t));
	} else if (rawTags instanceof Set) {
		rawTags.forEach(t => tags.add(t));
	}
	const rawVec = unit[DATA_SCHEMA.SemanticVector];
	if (rawVec && typeof rawVec === 'string') {
		try {
			const v = JSON.parse(rawVec);
			if (v.domain) tags.add(v.domain);
			if (v.type) tags.add(v.type);
			if (v.field) tags.add(v.field);
		} catch (_) { }
	}
	return tags;
}

function matchesSemanticCategory(unit, categoryExpr) {
	if (!unit) return false;
	const unitTags = getUnitSemanticTags(unit);
	const requiredCategories = categoryExpr.split('|');

	for (const cat of requiredCategories) {
		if (unitTags.has(cat)) return true;
		const mappedSet = SEMANTIC_ONTOLOGY[cat];
		if (mappedSet) {
			for (const t of unitTags) {
				if (mappedSet.has(t)) return true;
			}
		}
	}
	return false;
}

function findClausePredicate(context) {
	if (context && context.clausePredicate) return context.clausePredicate;
	return null;
}

// =========================================================================
// 3. SyntaxFrame Evaluator Engine
// =========================================================================

/**
 * Evaluates whether a language unit's SyntaxFrame is satisfied by the local context.
 * 
 * Returns: { matches: boolean, score: number, reason: string }
 */
function evaluateSyntaxFrame(unit, context) {
	const frame = unit[DATA_SCHEMA.SyntaxFrame];
	if (!frame || frame.trim() === "") {
		return { matches: true, score: 0.5, reason: "No SyntaxFrame constraint specified" };
	}

	const {
		tokenSurface,
		attachedParticle,
		attachedEnding,
		prevWord,
		nextWord,
		prevUnit,
		nextUnit,
		nounStemUnit,
		clausePredicate
	} = context;

	// Pattern 1: Standalone word preceding a Noun: ^_\s+{Noun}
	if (frame.includes("^") && frame.includes("{Noun}")) {
		const isStandalone = !attachedParticle && !attachedEnding;
		const nextIsNoun = nextUnit && (nextUnit[DATA_SCHEMA.PartofSpeech] === 'Noun' || nextUnit[DATA_SCHEMA.PartofSpeech] === 'Pronoun');
		const nextLooksLikeNoun = nextWord && /^[가-힣]+/.test(nextWord);

		if (isStandalone && (nextIsNoun || nextLooksLikeNoun)) {
			return {
				matches: true,
				score: 1.0,
				reason: `Satisfies frame '${frame}': Standalone modifier preceding noun '${nextWord || (nextUnit ? nextUnit[DATA_SCHEMA.Korean] : "")}'`
			};
		}
		return { matches: false, score: 0.0, reason: `Fails frame '${frame}': Requires following noun` };
	}

	// Pattern 2: Attaches directly to a Particle: _\+{Particle}
	if (frame.includes("_\\+{Particle}")) {
		if (attachedParticle) {
			return {
				matches: true,
				score: 1.0,
				reason: `Satisfies frame '${frame}': Cliticized case/topic particle '${attachedParticle}' attached to base`
			};
		}
		return { matches: false, score: 0.1, reason: `Fails frame '${frame}': Requires attached particle` };
	}

	// Pattern 3: Number followed by Counter or Counter/Time preceded by quantity
	if (frame.includes("{Counter}") || frame.includes("{Number}") || frame.includes("Counter:time") || frame.includes("Noun:time")) {
		if (frame.includes("Counter:time") || frame.includes("Noun:time")) {
			const cleanPrev = prevWord ? prevWord.replace(/[^\w가-힣]+/g, '') : "";
			const hasTimeOrNum = /\d/.test(prevWord || "") || /개월|년|달|일|시|분|초|시간|주/.test(cleanPrev);
			if (hasTimeOrNum) {
				return {
					matches: true,
					score: 1.0,
					reason: `Satisfies frame '${frame}': Preceded by temporal quantity or time noun '${cleanPrev}'`
				};
			}
		}
		if (frame.includes("{Number}\\s*_")) {
			// Unit is a counter, preceded by a number
			const cleanPrev = prevWord ? prevWord.replace(/[^\w가-힣]+/g, '') : "";
			const precededByNum = prevWord && (/\d+$/.test(prevWord) || /\d/.test(cleanPrev) || (prevUnit && prevUnit[DATA_SCHEMA.PartofSpeech] === 'Number'));
			if (precededByNum || context.isNumericPhrase) {
				return {
					matches: true,
					score: 1.0,
					reason: `Satisfies frame '${frame}': Counter attached to numeric quantifier`
				};
			}
		}
		if (frame.includes("{Counter}")) {
			// Unit is a number, followed by a counter
			const followedByCounter = nextUnit && (nextUnit[DATA_SCHEMA.PartofSpeech] === 'Noun' && getUnitSemanticTags(nextUnit).has('counter'));
			if (followedByCounter) {
				return {
					matches: true,
					score: 1.0,
					reason: `Satisfies frame '${frame}': Number quantifier followed by classifier`
				};
			}
		}
	}

	// Pattern 4: Bound Grammar vs. Free Noun / Post-Adnominal Noun: {VP_adnominal}\s+후에, {VP_adnominal}\s*_
	if (frame.includes("{VP_adnominal}")) {
		const cleanPrev = prevWord ? prevWord.replace(/[^\w가-힣]+/g, '') : "";
		const dPrev = cleanPrev ? decomposeHangul(cleanPrev.slice(-1)) : null;
		const prevLooksAdnominal = cleanPrev && (
			cleanPrev.endsWith("는") || cleanPrev.endsWith("은") || cleanPrev.endsWith("한") ||
			(dPrev && (dPrev.final === 4 || dPrev.final === 8))
		);
		const isPrecededByAdnominal = context.isPrecededByAdnominalVerb || prevLooksAdnominal;
		if (isPrecededByAdnominal) {
			return {
				matches: true,
				score: 1.0,
				reason: `Satisfies frame '${frame}': Governed by preceding adnominal verb modifier '${cleanPrev}'`
			};
		}
		return { matches: false, score: 0.1, reason: `Fails frame '${frame}': Requires preceding adnominal verb modifier` };
	}

	// Pattern 5: Polysemous Particle -에 / -(으)로 Disambiguation
	if (frame.includes("{Noun:place}") || frame.includes("{Noun:time}") || frame.includes("{Noun:tool") || frame.includes("{Noun:abstract}")) {
		const targetNoun = nounStemUnit || prevUnit;
		const pred = clausePredicate;

		// Direction: {Noun:place}\+에\s+.*{Verb:movement} or {Noun:place}\+으?로\s+.*{Verb:movement}
		if (frame.includes("{Verb:movement}")) {
			const isPlace = targetNoun && matchesSemanticCategory(targetNoun, "place");
			const isMotionPred = pred && (matchesSemanticCategory(pred, "movement") || MOTION_VERB_STEMS.has(getStem(pred[DATA_SCHEMA.Korean])));
			if (isPlace && isMotionPred) {
				return {
					matches: true,
					score: 1.0,
					reason: `Satisfies frame '${frame}': Destination place '${targetNoun[DATA_SCHEMA.Korean]}' with motion verb '${pred[DATA_SCHEMA.Korean]}'`
				};
			}
			if (isPlace) return { matches: true, score: 0.7, reason: `Place noun matches directional frame candidate` };
			return { matches: false, score: 0.1, reason: `Noun '${targetNoun ? targetNoun[DATA_SCHEMA.Korean] : ""}' is not a place or lacks motion predicate` };
		}

		// Static Location / Reference: {Noun:place}\+에\s+.*{Verb:stative}|{Noun:abstract}\+에
		if (frame.includes("{Verb:stative}") || frame.includes("{Noun:abstract}")) {
			const isPlace = targetNoun && matchesSemanticCategory(targetNoun, "place");
			const isAbstract = targetNoun && matchesSemanticCategory(targetNoun, "abstract");
			const isStativePred = pred && (matchesSemanticCategory(pred, "stative") || STATIVE_VERB_STEMS.has(getStem(pred[DATA_SCHEMA.Korean])));

			if (isAbstract) {
				return {
					matches: true,
					score: 0.95,
					reason: `Satisfies frame '${frame}': Abstract topic/reference noun '${targetNoun[DATA_SCHEMA.Korean]}'`
				};
			}
			if (isPlace && isStativePred) {
				return {
					matches: true,
					score: 0.95,
					reason: `Satisfies frame '${frame}': Location place '${targetNoun[DATA_SCHEMA.Korean]}' with stative verb '${pred[DATA_SCHEMA.Korean]}'`
				};
			}
			if (isPlace && !pred) {
				return {
					matches: true,
					score: 0.7,
					reason: `Place noun satisfies locative frame`
				};
			}
		}

		// Time: {Noun:time}\+에
		if (frame.includes("{Noun:time}")) {
			const isTime = targetNoun && matchesSemanticCategory(targetNoun, "time");
			if (isTime) {
				return {
					matches: true,
					score: 1.0,
					reason: `Satisfies frame '${frame}': Temporal noun '${targetNoun[DATA_SCHEMA.Korean]}'`
				};
			}
			return { matches: false, score: 0.0, reason: `Noun '${targetNoun ? targetNoun[DATA_SCHEMA.Korean] : ""}' is not a time unit` };
		}

		// Tool / Means / Language: {Noun:tool|vehicle|language|material}\+으?로
		if (frame.includes("{Noun:tool|vehicle|language|material}")) {
			const isInstrument = targetNoun && matchesSemanticCategory(targetNoun, "tool|vehicle|language|material");
			if (isInstrument) {
				return {
					matches: true,
					score: 1.0,
					reason: `Satisfies frame '${frame}': Instrument/language/means noun '${targetNoun[DATA_SCHEMA.Korean]}'`
				};
			}
			return { matches: false, score: 0.1, reason: `Noun '${targetNoun ? targetNoun[DATA_SCHEMA.Korean] : ""}' is not tool/vehicle/language` };
		}
	}



	// Pattern 6: Verb Connective vs. Lexical Particle: {VP}\+고 vs. {Noun}\+하고
	if (frame.includes("{VP}\\+고")) {
		if (context.isVerbStem) {
			return {
				matches: true,
				score: 1.0,
				reason: `Satisfies frame '${frame}': Connective '-고' attaching to verb stem`
			};
		}
		return { matches: false, score: 0.0, reason: `Fails frame '${frame}': Target base is not a verb stem` };
	}
	if (frame.includes("{Noun}\\+하고")) {
		if (context.isNounStem) {
			return {
				matches: true,
				score: 1.0,
				reason: `Satisfies frame '${frame}': Comitative nominal particle attached to noun`
			};
		}
		return { matches: false, score: 0.0, reason: `Fails frame '${frame}': Target base is not a noun` };
	}

	return { matches: true, score: 0.5, reason: `General match for frame '${frame}'` };
}

/**
 * Disambiguates between homonym candidates using SyntaxFrame and semantic tags.
 */
function disambiguateCandidates(candidates, context) {
	if (!candidates || candidates.length === 0) return null;
	if (candidates.length === 1) {
		return {
			chosenUnit: candidates[0],
			confidence: 1.0,
			rule: `Unambiguous unit ID ${candidates[0][DATA_SCHEMA.Id]}`
		};
	}

	const scored = [];
	for (const unit of candidates) {
		const evalRes = evaluateSyntaxFrame(unit, context);
		scored.push({ unit, ...evalRes });
	}

	// Sort by descending score
	scored.sort((a, b) => b.score - a.score);

	const top = scored[0];
	const second = scored[1];

	// Intentional Pedagogical Ambiguity Check:
	// If top candidates have close or tied non-zero scores, flag intentional ambiguity
	if (top.score > 0 && second.score > 0 && Math.abs(top.score - second.score) < 0.15) {
		return {
			chosenUnit: top.unit,
			confidence: top.score,
			intentional_ambiguity: true,
			competingUnits: [top.unit, second.unit],
			rule: `Intentional Pedagogical Ambiguity: Context supports both ID ${top.unit[DATA_SCHEMA.Id]} ("${top.unit[DATA_SCHEMA.English]}") and ID ${second.unit[DATA_SCHEMA.Id]} ("${second.unit[DATA_SCHEMA.English]}"). Frame evaluation: ${top.reason}`
		};
	}

	return {
		chosenUnit: top.unit,
		confidence: top.score,
		rule: top.reason
	};
}

// =========================================================================
// 4. Token-Level Morphological Analysis Engine
// =========================================================================

function analyzeSingleToken(rawWord, prevWord = "", nextWord = "", sentenceContext = {}) {
	const word = rawWord.replace(/^[^\w가-힣]+|[^\w가-힣]+$/g, '');
	if (!word) return null;

	// 0. Standalone particle (e.g. from punctuation or source spacing)
	const exactSpec = PARTICLE_SPECS.find(p => p.text === word);
	if (exactSpec) {
		const pUnit = exactSpec.ids.length > 0 ? unitById.get(exactSpec.ids[0]) : null;
		return {
			surface: word,
			category: "standalone_particle",
			lexical: null,
			grammar: [{
				text: exactSpec.text,
				pos: "Particle",
				unit: pUnit,
				missing: !pUnit,
				gloss: pUnit ? pUnit[DATA_SCHEMA.English] : exactSpec.desc
			}]
		};
	}

	// 0.1 Noun + Copula 입니다 (ID 56)
	if (word.endsWith("입니다") && word.length > 3) {
		const stem = word.slice(0, -3);
		const stemUnits = vocabByKo.get(stem) || [];
		const nounUnits = stemUnits.filter(u => u[DATA_SCHEMA.PartofSpeech] === 'Noun' || u[DATA_SCHEMA.PartofSpeech] === 'Pronoun');
		if (nounUnits.length > 0) {
			const nUnit = nounUnits[0];
			const copulaUnit = unitById.get(56);
			return {
				surface: word,
				category: "noun_copula",
				lexical: { text: stem, pos: nUnit[DATA_SCHEMA.PartofSpeech], unit: nUnit, gloss: nUnit[DATA_SCHEMA.English] },
				grammar: [{ text: "입니다", pos: "Verb Ending", unit: copulaUnit, gloss: copulaUnit ? copulaUnit[DATA_SCHEMA.English] : "is/are (copula ID 56)" }]
			};
		}
	}

	// 1. Pronominal Irregular Subject Allomorphs (제+가 -> 제가, 내+가 -> 내가, 네+가 -> 네가)
	if (word.endsWith("가") && word.length === 2) {
		const stem = word[0];
		const allo = PRONOMINAL_SUBJECT_ALLOMORPHS[stem];
		if (allo) {
			const baseUnit = unitById.get(allo.baseId);
			const particleUnit = unitById.get(allo.particleId);
			return {
				surface: word,
				category: "pronoun_phrase",
				lexical: { text: allo.baseWord, pos: baseUnit[DATA_SCHEMA.PartofSpeech], unit: baseUnit, gloss: baseUnit[DATA_SCHEMA.English] },
				grammar: [{ text: allo.particleWord, pos: "Particle", unit: particleUnit, gloss: particleUnit[DATA_SCHEMA.English] }],
				disambiguation: {
					resolved: true,
					target: `${allo.baseWord} (${baseUnit[DATA_SCHEMA.PartofSpeech]} ID ${baseUnit[DATA_SCHEMA.Id]})`,
					rule: `Pronominal subject allomorph '${stem}' + '${allo.particleWord}' derived from base pronoun '${allo.baseWord}'`
				}
			};
		}
	}

	// 2. Exact match in vocabulary (Nouns, Adverbs, Determiners, Exclamations)
	if (vocabByKo.has(word)) {
		const candidates = vocabByKo.get(word);
		const nonVerbs = candidates.filter(u => u[DATA_SCHEMA.PartofSpeech] !== 'Action Verb' && u[DATA_SCHEMA.PartofSpeech] !== 'Descriptive Verb');

		if (nonVerbs.length > 0) {
			// Disambiguate using SyntaxFrame
			const nextNounUnit = vocabByKo.has(nextWord) ? vocabByKo.get(nextWord)[0] : null;
			const evalContext = {
				tokenSurface: word,
				attachedParticle: "",
				attachedEnding: "",
				prevWord,
				nextWord,
				nextUnit: nextNounUnit,
				clausePredicate: sentenceContext.clausePredicate
			};

			const disambigRes = disambiguateCandidates(nonVerbs, evalContext);
			const chosen = disambigRes ? disambigRes.chosenUnit : nonVerbs[0];

			return {
				surface: word,
				category: "exact_lexical",
				lexical: {
					text: chosen[DATA_SCHEMA.Korean],
					pos: chosen[DATA_SCHEMA.PartofSpeech],
					unit: chosen,
					gloss: chosen[DATA_SCHEMA.English]
				},
				grammar: [],
				disambiguation: disambigRes && nonVerbs.length > 1 ? {
					resolved: true,
					target: `${chosen[DATA_SCHEMA.Korean]} (${chosen[DATA_SCHEMA.PartofSpeech]} ID ${chosen[DATA_SCHEMA.Id]})`,
					rule: disambigRes.rule,
					intentional_ambiguity: disambigRes.intentional_ambiguity
				} : null
			};
		}
	}

	// 3. Number + Counter + Particle (e.g. 1년쯤, 2년 동안, 3시에)
	const numCounterMatch = word.match(/^(\d+)([가-힣]+?)(쯤|에|부터|까지|은|는|이|가|을|를)?$/);
	if (numCounterMatch) {
		const numVal = parseInt(numCounterMatch[1], 10);
		const counterText = numCounterMatch[2];
		const particleText = numCounterMatch[3];
		const counterUnits = vocabByKo.get(counterText) || [];
		const counterUnit = counterUnits.length > 0 ? counterUnits[0] : null;

		const gList = [];
		if (particleText) {
			const spec = PARTICLE_SPECS.find(p => p.text === particleText);
			const pUnit = spec && spec.ids[0] ? unitById.get(spec.ids[0]) : null;
			gList.push({
				text: particleText,
				pos: "Particle",
				unit: pUnit,
				missing: !pUnit,
				gloss: pUnit ? pUnit[DATA_SCHEMA.English] : spec ? spec.desc : particleText
			});
		}

		return {
			surface: word,
			category: "numeric_phrase",
			lexical: {
				text: `${numVal}${counterText}`,
				pos: "Number+Counter",
				number: { value: numVal, sinoUnit: unitById.get(236) },
				counter: {
					text: counterText,
					unit: counterUnit,
					missing: !counterUnit,
					gloss: counterUnit ? counterUnit[DATA_SCHEMA.English] : "counter"
				}
			},
			grammar: gList
		};
	}

	// 4. Intentive -(으)하려고 / -(으)려고
	if (word.endsWith("하려고")) {
		const baseVerb = word.slice(0, -3) + "하다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: baseVerb, pos: "Action Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "to " + word.slice(0, -3) },
			grammar: [{ text: "-(으)려고", pos: "Verb Ending", unit: unitById.get(816), gloss: "intentive 'in order to' (ID 816)" }]
		};
	}
	if (word.endsWith("으려고") || word.endsWith("려고")) {
		const stem = word.endsWith("으려고") ? word.slice(0, -3) : word.slice(0, -2);
		const baseVerb = stem + "다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: baseVerb, pos: vUnit ? vUnit[DATA_SCHEMA.PartofSpeech] : "Action Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" },
			grammar: [{ text: "-(으)려고", pos: "Verb Ending", unit: unitById.get(816), gloss: "intentive 'in order to' (ID 816)" }]
		};
	}

	// 5. Past formal: ~했습니다, ~왔습니다, ~봤습니다, ~됐습니다, ~았습니다/었습니다
	if (word.endsWith("했습니다")) {
		const root = word.slice(0, -4);
		const baseVerb = root + "하다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: baseVerb, pos: "Action Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "to " + root },
			grammar: [
				{ text: "-았/었-", pos: "Tense Infix", unit: unitById.get(335), gloss: "past tense (ID 335)" },
				{ text: "-습니다", pos: "Verb Ending", unit: unitById.get(50), gloss: "formal declarative (ID 50)" }
			]
		};
	}
	if (word.endsWith("왔습니다")) {
		const root = word.slice(0, -4);
		const baseVerb = root ? root + "오다" : "오다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: baseVerb, pos: "Action Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "to come" },
			grammar: [
				{ text: "-았/었-", pos: "Tense Infix", unit: unitById.get(335), gloss: "past tense (ID 335)" },
				{ text: "-습니다", pos: "Verb Ending", unit: unitById.get(50), gloss: "formal declarative (ID 50)" }
			]
		};
	}
	if (word.endsWith("봤습니다")) {
		const root = word.slice(0, -4);
		const baseVerb = root ? root + "보다" : "보다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: baseVerb, pos: "Action Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "to see/watch" },
			grammar: [
				{ text: "-았/었-", pos: "Tense Infix", unit: unitById.get(335), gloss: "past tense (ID 335)" },
				{ text: "-습니다", pos: "Verb Ending", unit: unitById.get(50), gloss: "formal declarative (ID 50)" }
			]
		};
	}
	if (word.endsWith("됐습니다")) {
		const vUnit = vocabByKo.get("되다") ? vocabByKo.get("되다")[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: "되다", pos: "Action Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "to become, elapse" },
			grammar: [
				{ text: "-았/었-", pos: "Tense Infix", unit: unitById.get(335), gloss: "past tense (ID 335)" },
				{ text: "-습니다", pos: "Verb Ending", unit: unitById.get(50), gloss: "formal declarative (ID 50)" }
			]
		};
	}

	// 6. Future / Volition formal: ~하겠습니다 / ~겠습니다
	if (word.endsWith("하겠습니다")) {
		const root = word.slice(0, -5);
		const baseVerb = root + "하다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: baseVerb, pos: "Action Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "to " + root },
			grammar: [
				{ text: "-겠-", pos: "Pre-final Ending", unit: unitById.get(838), gloss: "volition/intention (ID 838)" },
				{ text: "-습니다", pos: "Verb Ending", unit: unitById.get(50), gloss: "formal declarative (ID 50)" }
			]
		};
	}
	if (word.endsWith("겠습니다")) {
		const stem = word.slice(0, -4);
		const baseVerb = stem + "다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: baseVerb, pos: "Action Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" },
			grammar: [
				{ text: "-겠-", pos: "Pre-final Ending", unit: unitById.get(838), gloss: "volition/intention (ID 838)" },
				{ text: "-습니다", pos: "Verb Ending", unit: unitById.get(50), gloss: "formal declarative (ID 50)" }
			]
		};
	}

	// 7. Present formal: ~습니다 / ~ㅂ니다 / ~합니다
	if (word.endsWith("합니다")) {
		const root = word.slice(0, -3);
		const baseVerb = root + "하다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: baseVerb, pos: vUnit ? vUnit[DATA_SCHEMA.PartofSpeech] : "Action Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" },
			grammar: [{ text: "-ㅂ니다", pos: "Verb Ending", unit: unitById.get(50), gloss: "formal declarative (ID 50)" }]
		};
	}
	if (word.endsWith("습니다")) {
		const stem = word.slice(0, -3);
		const baseVerb = stem + "다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: baseVerb, pos: vUnit ? vUnit[DATA_SCHEMA.PartofSpeech] : "Descriptive Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" },
			grammar: [{ text: "-습니다", pos: "Verb Ending", unit: unitById.get(50), gloss: "formal declarative (ID 50)" }]
		};
	}

	// 7.1 Open-stem -ㅂ니다 (e.g. 갑니다, 옵니다, 봅니다, 배웁니다)
	if (word.endsWith("니다") && word.length >= 3) {
		const stemWithFinal = word.slice(0, -2);
		const lastChar = stemWithFinal.slice(-1);
		const d = decomposeHangul(lastChar);
		if (d && d.final === 17) { // ㅂ batchim
			const stripped = setFinal(lastChar, 0);
			const stem = stemWithFinal.slice(0, -1) + stripped;
			const baseVerb = stem + "다";
			const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
			if (vUnit) {
				return {
					surface: word,
					category: "conjugated_verb",
					lexical: { text: baseVerb, pos: vUnit[DATA_SCHEMA.PartofSpeech], unit: vUnit, gloss: vUnit[DATA_SCHEMA.English] },
					grammar: [{ text: "-ㅂ니다", pos: "Verb Ending", unit: unitById.get(50), gloss: "formal declarative (ID 50)" }]
				};
			}
		}
	}

	// 7.2 Formal polite imperative: -(으)십시오 (ID 1644)
	if (word.endsWith("하십시오")) {
		const root = word.slice(0, -4);
		const baseVerb = root + "하다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: baseVerb, pos: "Action Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" },
			grammar: [{ text: "-(으)십시오", pos: "Verb Ending", unit: unitById.get(1644), gloss: "formal imperative (ID 1644)" }]
		};
	}
	if (word.endsWith("으십시오") || word.endsWith("십시오")) {
		const stem = word.endsWith("으십시오") ? word.slice(0, -4) : word.slice(0, -3);
		const baseVerb = stem + "다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: baseVerb, pos: vUnit ? vUnit[DATA_SCHEMA.PartofSpeech] : "Action Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" },
			grammar: [{ text: "-(으)십시오", pos: "Verb Ending", unit: unitById.get(1644), gloss: "formal imperative (ID 1644)" }]
		};
	}

	// 7.3 Exclamatory realization: -는군요 / -군요 (ID 1645)
	if (word.endsWith("하시는군요")) {
		const root = word.slice(0, -5);
		const baseVerb = root + "하다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: baseVerb, pos: "Action Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" },
			grammar: [
				{ text: "-(으)시-", pos: "Honorific Infix", unit: unitById.get(678), gloss: "honorific subject (ID 678)" },
				{ text: "-는군요", pos: "Verb Ending", unit: unitById.get(1645), gloss: "realization exclamatory (ID 1645)" }
			]
		};
	}
	if (word.endsWith("는군요")) {
		const stem = word.slice(0, -3);
		const baseVerb = stem + "다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: baseVerb, pos: "Action Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" },
			grammar: [{ text: "-는군요", pos: "Verb Ending", unit: unitById.get(1645), gloss: "realization exclamatory (ID 1645)" }]
		};
	}
	if (word.endsWith("군요")) {
		const stem = word.slice(0, -2);
		const baseVerb = stem + "다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: baseVerb, pos: vUnit ? vUnit[DATA_SCHEMA.PartofSpeech] : "Descriptive Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" },
			grammar: [{ text: "-군요", pos: "Verb Ending", unit: unitById.get(1645), gloss: "realization exclamatory (ID 1645)" }]
		};
	}

	// 7.4 Realization ending: -네요 (ID 839)
	if (word.endsWith("했네요")) {
		const root = word.slice(0, -3);
		const baseVerb = root + "하다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: baseVerb, pos: "Action Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" },
			grammar: [
				{ text: "-았/었-", pos: "Tense Infix", unit: unitById.get(335), gloss: "past tense (ID 335)" },
				{ text: "-네요", pos: "Verb Ending", unit: unitById.get(839), gloss: "realization/surprise (ID 839)" }
			]
		};
	}
	if (word.endsWith("겠네요")) {
		const stem = word.slice(0, -3);
		const baseVerb = stem + "다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: baseVerb, pos: vUnit ? vUnit[DATA_SCHEMA.PartofSpeech] : "Descriptive Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" },
			grammar: [
				{ text: "-겠-", pos: "Pre-final Ending", unit: unitById.get(838), gloss: "conjecture/volition (ID 838)" },
				{ text: "-네요", pos: "Verb Ending", unit: unitById.get(839), gloss: "realization/surprise (ID 839)" }
			]
		};
	}
	if (word.endsWith("네요")) {
		const stem = word.slice(0, -2);
		const baseVerb = stem + "다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: baseVerb, pos: vUnit ? vUnit[DATA_SCHEMA.PartofSpeech] : "Descriptive Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" },
			grammar: [{ text: "-네요", pos: "Verb Ending", unit: unitById.get(839), gloss: "realization/surprise (ID 839)" }]
		};
	}

	// 7.5 Volition / Conjecture informal: -겠어요 and Polite informal -해요 (ID 49)
	if (word.endsWith("하겠어요")) {
		const root = word.slice(0, -4);
		const baseVerb = root + "하다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: baseVerb, pos: "Action Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" },
			grammar: [
				{ text: "-겠-", pos: "Pre-final Ending", unit: unitById.get(838), gloss: "volition/intention (ID 838)" },
				{ text: "-아요/어요", pos: "Verb Ending", unit: unitById.get(49), gloss: "polite informal (ID 49)" }
			]
		};
	}
	if (word.endsWith("겠어요")) {
		const stem = word.slice(0, -3);
		const baseVerb = stem + "다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: baseVerb, pos: vUnit ? vUnit[DATA_SCHEMA.PartofSpeech] : "Action Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" },
			grammar: [
				{ text: "-겠-", pos: "Pre-final Ending", unit: unitById.get(838), gloss: "volition/intention (ID 838)" },
				{ text: "-아요/어요", pos: "Verb Ending", unit: unitById.get(49), gloss: "polite informal (ID 49)" }
			]
		};
	}
	if (word.endsWith("해요")) {
		const root = word.slice(0, -2);
		const baseVerb = root + "하다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: baseVerb, pos: vUnit ? vUnit[DATA_SCHEMA.PartofSpeech] : "Descriptive Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" },
			grammar: [{ text: "-아/어요", pos: "Verb Ending", unit: unitById.get(49), gloss: "polite informal (ID 49)" }]
		};
	}
	if (word.endsWith("해") && word.length >= 2) {
		const root = word.slice(0, -1);
		const baseVerb = root + "하다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		if (vUnit) {
			return {
				surface: word,
				category: "conjugated_verb",
				lexical: { text: baseVerb, pos: vUnit[DATA_SCHEMA.PartofSpeech], unit: vUnit, gloss: vUnit[DATA_SCHEMA.English] },
				grammar: [{ text: "-아/어", pos: "Verb Ending", unit: unitById.get(459), gloss: "informal / sequential (ID 459)" }]
			};
		}
	}

	// 7.6 Background / Contrastive: -는데 (ID 620)
	if (word.endsWith("하는데")) {
		const root = word.slice(0, -3);
		const baseVerb = root + "하다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: baseVerb, pos: "Action Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" },
			grammar: [{ text: "-는데", pos: "Verb Ending", unit: unitById.get(620), gloss: "background/contrastive (ID 620)" }]
		};
	}
	if (word.endsWith("는데")) {
		const stem = word.slice(0, -2);
		let baseVerb = stem + "다";
		let vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: baseVerb, pos: vUnit ? vUnit[DATA_SCHEMA.PartofSpeech] : "Action Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" },
			grammar: [{ text: "-는데", pos: "Verb Ending", unit: unitById.get(620), gloss: "background/contrastive (ID 620)" }]
		};
	}

	// 7.7 Cause / Reason: -(으)니까 (ID 53)
	if (word.endsWith("하니까")) {
		const root = word.slice(0, -3);
		const baseVerb = root + "하다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: baseVerb, pos: "Action Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" },
			grammar: [{ text: "-(으)니까", pos: "Verb Ending", unit: unitById.get(53), gloss: "since / because (ID 53)" }]
		};
	}
	if (word.endsWith("으니까") || word.endsWith("니까")) {
		const stem = word.endsWith("으니까") ? word.slice(0, -3) : word.slice(0, -2);
		const baseVerb = stem + "다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: baseVerb, pos: vUnit ? vUnit[DATA_SCHEMA.PartofSpeech] : "Action Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" },
			grammar: [{ text: "-(으)니까", pos: "Verb Ending", unit: unitById.get(53), gloss: "since / because (ID 53)" }]
		};
	}

	// 7.8 Simultaneous action: -(으)면서 (ID 711)
	if (word.endsWith("하면서")) {
		const root = word.slice(0, -3);
		const baseVerb = root + "하다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: baseVerb, pos: "Action Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" },
			grammar: [{ text: "-(으)면서", pos: "Verb Ending", unit: unitById.get(711), gloss: "while doing (ID 711)" }]
		};
	}
	if (word.endsWith("으면서") || word.endsWith("면서")) {
		const stem = word.endsWith("으면서") ? word.slice(0, -3) : word.slice(0, -2);
		const baseVerb = stem + "다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: baseVerb, pos: vUnit ? vUnit[DATA_SCHEMA.PartofSpeech] : "Action Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" },
			grammar: [{ text: "-(으)면서", pos: "Verb Ending", unit: unitById.get(711), gloss: "while doing (ID 711)" }]
		};
	}

	// 7.9 Past Connective: -았/었고 (ID 335 + ID 336)
	if (word.endsWith("했고")) {
		const root = word.slice(0, -2);
		const baseVerb = root + "하다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: baseVerb, pos: "Action Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" },
			grammar: [
				{ text: "-았/었-", pos: "Tense Infix", unit: unitById.get(335), gloss: "past tense (ID 335)" },
				{ text: "-고", pos: "Verb Ending", unit: unitById.get(336), gloss: "connective 'and' (ID 336)" }
			]
		};
	}
	if (word.endsWith("았고") || word.endsWith("었고")) {
		const stem = word.slice(0, -2);
		const baseVerb = stem + "다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: baseVerb, pos: vUnit ? vUnit[DATA_SCHEMA.PartofSpeech] : "Action Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" },
			grammar: [
				{ text: "-았/었-", pos: "Tense Infix", unit: unitById.get(335), gloss: "past tense (ID 335)" },
				{ text: "-고", pos: "Verb Ending", unit: unitById.get(336), gloss: "connective 'and' (ID 336)" }
			]
		};
	}

	// 8. Connective -고 vs. Particle 하고 Disambiguation
	if (word.endsWith("하고")) {
		const root = word.slice(0, -2);
		const baseVerb = root + "하다";
		const hasVerb = vocabByKo.has(baseVerb);
		const hasNoun = vocabByKo.has(root);

		const evalContext = {
			tokenSurface: word,
			isVerbStem: hasVerb,
			isNounStem: hasNoun,
			prevWord,
			nextWord
		};

		const connectiveUnit = unitById.get(336); // -고
		const particleUnit = unitById.get(367);   // 하고

		const evalConnective = evaluateSyntaxFrame(connectiveUnit, evalContext);
		const evalParticle = evaluateSyntaxFrame(particleUnit, evalContext);

		if (evalConnective.score > evalParticle.score && hasVerb) {
			const vUnit = vocabByKo.get(baseVerb)[0];
			return {
				surface: word,
				category: "conjugated_verb",
				lexical: { text: baseVerb, pos: "Action Verb", unit: vUnit, gloss: vUnit[DATA_SCHEMA.English] },
				grammar: [{ text: "-고", pos: "Verb Ending", unit: connectiveUnit, gloss: connectiveUnit[DATA_SCHEMA.English] }],
				disambiguation: {
					resolved: true,
					target: `${baseVerb} + -고 (ID 336)`,
					rule: evalConnective.reason
				}
			};
		}
	}
	if (word.endsWith("고") && !word.endsWith("하고")) {
		const stem = word.slice(0, -1);
		let baseVerb = stem + "다";
		let vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: baseVerb, pos: vUnit ? vUnit[DATA_SCHEMA.PartofSpeech] : "Action Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" },
			grammar: [{ text: "-고", pos: "Verb Ending", unit: unitById.get(336), gloss: "connective 'and' (ID 336)" }]
		};
	}

	// 9. Sequential / Cause ~아/어서 (~해서, ~겨서, ~아서, ~어서, and contracted ~서)
	if (word.endsWith("해서")) {
		const baseVerb = word.slice(0, -2) + "하다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: baseVerb, pos: "Action Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" },
			grammar: [{ text: "-아/어서", pos: "Verb Ending", unit: unitById.get(459), gloss: "cause / sequential (ID 459)" }]
		};
	}
	if (word.endsWith("겨서")) {
		const baseVerb = word.slice(0, -2) + "기다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: baseVerb, pos: "Action Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" },
			grammar: [{ text: "-아/어서", pos: "Verb Ending", unit: unitById.get(459), gloss: "cause / sequential (ID 459)" }]
		};
	}
	if (word.endsWith("아서") || word.endsWith("어서")) {
		const stem = word.slice(0, -2);
		const baseVerb = stem + "다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: baseVerb, pos: vUnit ? vUnit[DATA_SCHEMA.PartofSpeech] : "Action Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" },
			grammar: [{ text: "-아/어서", pos: "Verb Ending", unit: unitById.get(459), gloss: "cause / sequential (ID 459)" }]
		};
	}
	// Contracted open-stem verbs + -서 (e.g. 가서, 만나서, 와서, 봐서, 배워서, 마셔서)
	if (word.endsWith("서") && word.length >= 2) {
		const stemChar = word.slice(-2, -1);
		let candidateStems = [word.slice(0, -1)];
		const d = decomposeHangul(stemChar);
		if (d) {
			if (d.medial === 9) candidateStems.push(word.slice(0, -2) + composeHangul(d.initial, 8, 0)); // ㅘ -> ㅗ (와서->오다, 봐서->보다)
			else if (d.medial === 14) candidateStems.push(word.slice(0, -2) + composeHangul(d.initial, 13, 0)); // ㅝ -> ㅜ (배워서->배우다)
			else if (d.medial === 6) candidateStems.push(word.slice(0, -2) + composeHangul(d.initial, 20, 0)); // ㅕ -> ㅣ (마셔서->마시다)
		}
		for (const s of candidateStems) {
			const baseVerb = s + "다";
			const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
			if (vUnit) {
				return {
					surface: word,
					category: "conjugated_verb",
					lexical: { text: baseVerb, pos: vUnit[DATA_SCHEMA.PartofSpeech], unit: vUnit, gloss: vUnit[DATA_SCHEMA.English] },
					grammar: [{ text: "-아/어서", pos: "Verb Ending", unit: unitById.get(459), gloss: "cause / sequential (ID 459)" }]
				};
			}
		}
	}

	// 10. Conditional ~(으)면 (~하면, ~으면, ~면)
	if (word.endsWith("하면")) {
		const baseVerb = word.slice(0, -2) + "하다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: baseVerb, pos: "Action Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" },
			grammar: [{ text: "-(으)면", pos: "Verb Ending", unit: unitById.get(619), gloss: "conditional 'if/when' (ID 619)" }]
		};
	}
	if (word.endsWith("으면") || word.endsWith("면")) {
		const stem = word.endsWith("으면") ? word.slice(0, -2) : word.slice(0, -1);
		const baseVerb = stem + "다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "conjugated_verb",
			lexical: { text: baseVerb, pos: vUnit ? vUnit[DATA_SCHEMA.PartofSpeech] : "Action Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" },
			grammar: [{ text: "-(으)면", pos: "Verb Ending", unit: unitById.get(619), gloss: "conditional 'if/when' (ID 619)" }]
		};
	}

	// 10.1 Honorific Adnominal: ~(으)실 (e.g. 되실)
	if (word.endsWith("실") && word.length >= 2) {
		const root = word.slice(0, -1);
		const baseVerb = root + "다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		if (vUnit) {
			return {
				surface: word,
				category: "adnominal_modifier",
				lexical: { text: baseVerb, pos: vUnit[DATA_SCHEMA.PartofSpeech], unit: vUnit, gloss: vUnit[DATA_SCHEMA.English] },
				grammar: [
					{ text: "-(으)시-", pos: "Honorific Infix", unit: unitById.get(678), gloss: "honorific subject (ID 678)" },
					{ text: "-(으)ㄹ", pos: "Adnominal Ending", unit: unitById.get(646), gloss: "future/prospective adnominal (ID 646)" }
				]
			};
		}
	}

	// 11. Adnominal Participles: ~한, ~은, ~는, ~(으)ㄴ, ~(으)ㄹ
	if (word.endsWith("한")) {
		const baseVerb = word.slice(0, -1) + "하다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "adnominal_modifier",
			lexical: { text: baseVerb, pos: "Action Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" },
			grammar: [{ text: "-(으)ㄴ", pos: "Adnominal Ending", unit: unitById.get(644), gloss: "past adnominal (ID 644)" }]
		};
	}
	if (word.endsWith("은")) {
		const stem = word.slice(0, -1);
		const baseVerb = stem + "다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		if (vUnit && (vUnit[DATA_SCHEMA.PartofSpeech] === 'Descriptive Verb' || vUnit[DATA_SCHEMA.PartofSpeech] === 'Action Verb')) {
			return {
				surface: word,
				category: "adnominal_modifier",
				lexical: { text: baseVerb, pos: vUnit[DATA_SCHEMA.PartofSpeech], unit: vUnit, missing: false, gloss: vUnit[DATA_SCHEMA.English] },
				grammar: [{ text: "-(으)ㄴ", pos: "Adnominal Ending", unit: unitById.get(644), gloss: "adnominal modifier (ID 644)" }]
			};
		}
	}
	if (word.endsWith("는")) {
		const stem = word.slice(0, -1);
		let baseVerb = stem + "다";
		if (stem === "모르") baseVerb = "모르다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		if (vUnit && (vUnit[DATA_SCHEMA.PartofSpeech] === 'Action Verb' || vUnit[DATA_SCHEMA.PartofSpeech] === 'Descriptive Verb')) {
			return {
				surface: word,
				category: "adnominal_modifier",
				lexical: { text: baseVerb, pos: vUnit[DATA_SCHEMA.PartofSpeech], unit: vUnit, missing: false, gloss: vUnit[DATA_SCHEMA.English] },
				grammar: [{ text: "-는", pos: "Adnominal Ending", unit: unitById.get(645), gloss: "present adnominal (ID 645)" }]
			};
		}
	}
	if (word.length >= 1 && hasBatchim(word.slice(-1))) {
		const d = decomposeHangul(word.slice(-1));
		if (d && d.final === 4) { // ㄴ batchim (past adnominal -(으)ㄴ, e.g. 온, 간, 본, 산, 된)
			const strippedChar = setFinal(word.slice(-1), 0);
			const stem = word.slice(0, -1) + strippedChar;
			const baseVerb = stem + "다";
			const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
			if (vUnit && (vUnit[DATA_SCHEMA.PartofSpeech] === 'Action Verb' || vUnit[DATA_SCHEMA.PartofSpeech] === 'Descriptive Verb')) {
				return {
					surface: word,
					category: "adnominal_modifier",
					lexical: { text: baseVerb, pos: vUnit[DATA_SCHEMA.PartofSpeech], unit: vUnit, missing: false, gloss: vUnit[DATA_SCHEMA.English] },
					grammar: [{ text: "-(으)ㄴ", pos: "Adnominal Ending", unit: unitById.get(644), gloss: "adnominal modifier (ID 644)" }]
				};
			}
		}
		if (d && d.final === 8) { // ㄹ batchim (prospective/future adnominal -(으)ㄹ, e.g. 할, 갈, 놀, 지루할)
			// Case A: Base stem already ends in ㄹ (놀다, 살다, 알다, 만들다)
			const lBaseVerb = word + "다";
			const lUnit = vocabByKo.get(lBaseVerb) ? vocabByKo.get(lBaseVerb)[0] : null;
			if (lUnit && (lUnit[DATA_SCHEMA.PartofSpeech] === 'Action Verb' || lUnit[DATA_SCHEMA.PartofSpeech] === 'Descriptive Verb')) {
				return {
					surface: word,
					category: "adnominal_modifier",
					lexical: { text: lBaseVerb, pos: lUnit[DATA_SCHEMA.PartofSpeech], unit: lUnit, missing: false, gloss: lUnit[DATA_SCHEMA.English] },
					grammar: [{ text: "-(으)ㄹ", pos: "Adnominal Ending", unit: unitById.get(646), gloss: "prospective adnominal (ID 646)" }]
				};
			}

			// Case B: Open stem + ㄹ (할 -> 하다, 갈 -> 가다, 지루할 -> 지루하다, 볼 -> 보다)
			const strippedChar = setFinal(word.slice(-1), 0);
			const stem = word.slice(0, -1) + strippedChar;
			const baseVerb = stem + "다";
			const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
			if (vUnit && (vUnit[DATA_SCHEMA.PartofSpeech] === 'Action Verb' || vUnit[DATA_SCHEMA.PartofSpeech] === 'Descriptive Verb')) {
				return {
					surface: word,
					category: "adnominal_modifier",
					lexical: { text: baseVerb, pos: vUnit[DATA_SCHEMA.PartofSpeech], unit: vUnit, missing: false, gloss: vUnit[DATA_SCHEMA.English] },
					grammar: [{ text: "-(으)ㄹ", pos: "Adnominal Ending", unit: unitById.get(646), gloss: "prospective adnominal (ID 646)" }]
				};
			}
		}
	}

	// 12. Noun + Attached Particle Cliticization
	for (const spec of PARTICLE_SPECS) {
		if (word.endsWith(spec.text) && word.length > spec.text.length) {
			const stem = word.slice(0, -spec.text.length);
			const lastChar = stem.slice(-1);
			const batchim = hasBatchim(lastChar);

			if (spec.batchimReq === true && !batchim && spec.text !== "으로") continue;
			if (spec.batchimReq === false && batchim) continue;

			const stemUnits = vocabByKo.get(stem) || [];
			const validNounUnits = stemUnits.filter(u => u[DATA_SCHEMA.PartofSpeech] === 'Noun' || u[DATA_SCHEMA.PartofSpeech] === 'Pronoun');
			let stemUnit = validNounUnits.length > 0 ? validNounUnits[0] : null;

			let chosenParticleUnit = null;
			let disambigInfo = null;

			// Disambiguate multi-candidate noun stem (e.g. 저 pronoun vs. determiner in 저는)
			let stemDisambigInfo = null;
			if (validNounUnits.length > 1) {
				const cleanPrev = prevWord ? prevWord.replace(/[^\w가-힣]+/g, '') : "";
				const dPrev = cleanPrev ? decomposeHangul(cleanPrev.slice(-1)) : null;
				const prevLooksAdnominal = cleanPrev && (
					cleanPrev.endsWith("는") || cleanPrev.endsWith("은") || cleanPrev.endsWith("한") ||
					(dPrev && (dPrev.final === 4 || dPrev.final === 8))
				);
				const evalStemContext = {
					tokenSurface: stem,
					attachedParticle: spec.text,
					isPrecededByAdnominalVerb: !!prevLooksAdnominal,
					prevWord,
					nextWord
				};
				const stemRes = disambiguateCandidates(validNounUnits, evalStemContext);
				if (stemRes) {
					stemUnit = stemRes.chosenUnit;
					stemDisambigInfo = {
						resolved: true,
						target: `${stemUnit[DATA_SCHEMA.Korean]} (${stemUnit[DATA_SCHEMA.PartofSpeech]} ID ${stemUnit[DATA_SCHEMA.Id]})`,
						rule: stemRes.rule
					};
				}
			}

			if (spec.ids.length === 1) {
				chosenParticleUnit = unitById.get(spec.ids[0]);
			} else if (spec.ids.length > 1) {
				const candidateParticleUnits = spec.ids.map(id => unitById.get(id)).filter(Boolean);
				const evalContext = {
					tokenSurface: word,
					attachedParticle: spec.text,
					nounStemUnit: stemUnit,
					clausePredicate: sentenceContext.clausePredicate,
					prevWord,
					nextWord
				};

				const res = disambiguateCandidates(candidateParticleUnits, evalContext);
				if (res) {
					chosenParticleUnit = res.chosenUnit;
					disambigInfo = {
						resolved: true,
						target: `${chosenParticleUnit[DATA_SCHEMA.Korean]} (ID ${chosenParticleUnit[DATA_SCHEMA.Id]})`,
						rule: res.rule,
						intentional_ambiguity: res.intentional_ambiguity
					};
				}
			}

			const finalDisambig = disambigInfo || stemDisambigInfo;

			return {
				surface: word,
				category: "noun_particle",
				lexical: {
					text: stem,
					pos: stemUnit ? stemUnit[DATA_SCHEMA.PartofSpeech] : "Noun",
					unit: stemUnit,
					missing: !stemUnit,
					gloss: stemUnit ? stemUnit[DATA_SCHEMA.English] : "candidate noun (" + stem + ")"
				},
				grammar: [{
					text: spec.text,
					pos: "Particle",
					unit: chosenParticleUnit,
					missing: !chosenParticleUnit,
					gloss: chosenParticleUnit ? chosenParticleUnit[DATA_SCHEMA.English] : spec.desc
				}],
				disambiguation: finalDisambig
			};
		}
	}

	// 13. Compound Noun Decomposition (e.g. 한국문화 -> 한국 + 문화)
	for (let len = word.length - 1; len >= 2; len--) {
		const prefix = word.slice(0, len);
		const suffix = word.slice(len);
		if (vocabByKo.has(prefix) && vocabByKo.has(suffix)) {
			const pUnit = vocabByKo.get(prefix)[0];
			const sUnit = vocabByKo.get(suffix)[0];
			return {
				surface: word,
				category: "compound_noun",
				lexical: {
					text: word,
					pos: "Compound Noun",
					components: [
						{ text: prefix, unit: pUnit, gloss: pUnit[DATA_SCHEMA.English] },
						{ text: suffix, unit: sUnit, missing: !sUnit, gloss: sUnit[DATA_SCHEMA.English] }
					]
				},
				grammar: []
			};
		}
	}

	// 14. Unknown Token
	return {
		surface: word,
		category: "unknown",
		lexical: { text: word, pos: "Unknown", missing: true, gloss: "unrecognized vocabulary" },
		grammar: []
	};
}

// =========================================================================
// 5. Sentence-Level Multi-Word Construction Analysis Engine
// =========================================================================

function analyzeSentence(sentText, sentenceIndex = 1) {
	const rawWords = sentText.split(/\s+/).map(w => w.trim()).filter(Boolean);

	// Pass 1: Extract clause terminal predicate for semantic valency resolution
	let clausePredicate = null;
	for (let k = rawWords.length - 1; k >= 0; k--) {
		const cw = rawWords[k].replace(/[^\w가-힣]+/g, '');
		// Check for verb patterns in last 2 words
		for (const [stem, units] of vocabByKo.entries()) {
			const verbUnits = units.filter(u => u[DATA_SCHEMA.PartofSpeech] === 'Action Verb' || u[DATA_SCHEMA.PartofSpeech] === 'Descriptive Verb');
			if (verbUnits.length > 0 && (cw.startsWith(stem) || cw.includes(stem))) {
				clausePredicate = verbUnits[0];
				break;
			}
		}
		if (clausePredicate) break;
	}

	const sentenceContext = { clausePredicate };
	const tokens = [];
	let i = 0;

	while (i < rawWords.length) {
		const w1 = rawWords[i];
		const w2 = i < rawWords.length - 1 ? rawWords[i + 1] : "";
		const cleanW2 = w2.replace(/[^\w가-힣]+/g, '');

		const d1 = decomposeHangul(w1.slice(-1));
		const isAdnominalN = w1.endsWith("은") || (d1 && d1.final === 4);

		// Multi-word pattern 1: Bound Grammar -(으)ㄴ 후에 (Grammar ID 710)
		if (isAdnominalN && cleanW2 === "후에") {
			const gUnit = unitById.get(710);
			const a1 = analyzeSingleToken(w1, i > 0 ? rawWords[i - 1] : "", w2, sentenceContext);
			const evalRes = evaluateSyntaxFrame(gUnit, { isPrecededByAdnominalVerb: true });

			tokens.push({
				surface: `${w1} ${w2}`,
				category: "auxiliary_construction",
				pattern: "-(으)ㄴ 후에 (After doing)",
				lexical: a1.lexical,
				grammar: [
					{ text: "-(으)ㄴ 후에", pos: "Grammar Pattern", unit: gUnit, gloss: gUnit[DATA_SCHEMA.English] }
				],
				disambiguation: {
					resolved: true,
					target: `-(으)ㄴ 후에 (ID 710)`,
					rule: evalRes.reason
				}
			});
			i += 2;
			continue;
		}

		// Multi-word pattern 2: Bound Grammar -(으)ㄴ 지 (Grammar ID 817)
		if (isAdnominalN && cleanW2 === "지") {
			const gUnit = unitById.get(817);
			const a1 = analyzeSingleToken(w1, i > 0 ? rawWords[i - 1] : "", w2, sentenceContext);
			const evalRes = evaluateSyntaxFrame(gUnit, { isPrecededByAdnominalVerb: true });

			tokens.push({
				surface: `${w1} 지`,
				category: "auxiliary_construction",
				pattern: "-(으)ㄴ 지 (Time elapsed since doing)",
				lexical: a1.lexical,
				grammar: [
					{ text: "-(으)ㄴ 지", pos: "Grammar Pattern", unit: gUnit, gloss: gUnit[DATA_SCHEMA.English] }
				],
				disambiguation: {
					resolved: true,
					target: `-(으)ㄴ 지 (ID 817)`,
					rule: evalRes.reason
				}
			});
			i += 2;
			continue;
		}

		// Multi-word pattern 3: -고 싶어하다 (3rd person) vs. -고 싶다 (1st/2nd person)
		if (w1.endsWith("고")) {
			if (cleanW2.startsWith("싶어했") || cleanW2.startsWith("싶어하")) {
				const gUnit = unitById.get(1625);
				const a1 = analyzeSingleToken(w1, i > 0 ? rawWords[i - 1] : "", w2, sentenceContext);
				tokens.push({
					surface: `${w1} ${w2}`,
					category: "auxiliary_construction",
					pattern: "-고 싶어하다 (Want to do - 3rd person)",
					lexical: a1.lexical,
					grammar: [
						{ text: "-고 싶어하다", pos: "Grammar Pattern", unit: gUnit, gloss: gUnit[DATA_SCHEMA.English] },
						{ text: "-았/었-", pos: "Tense Infix", unit: unitById.get(335), gloss: "past tense (ID 335)" },
						{ text: "-습니다", pos: "Verb Ending", unit: unitById.get(50), gloss: "formal declarative (ID 50)" }
					],
					disambiguation: {
						resolved: true,
						target: "-고 싶어하다 (ID 1625)",
						rule: "Third-person psychological predicate frame '{VP}\\+고\\s+싶어하' matched auxiliary '싶어하다'"
					}
				});
				i += 2;
				continue;
			}
			if (cleanW2.startsWith("싶")) {
				const gUnit = unitById.get(417);
				const a1 = analyzeSingleToken(w1, i > 0 ? rawWords[i - 1] : "", w2, sentenceContext);
				let endingDesc = cleanW2.endsWith("으면") ? "-(으)면 (Conditional, ID 619)" :
					cleanW2.endsWith("어서") ? "-아/어서 (Cause/Sequential, ID 459)" :
						cleanW2.endsWith("습니다") ? "-습니다 (Formal declarative, ID 50)" : cleanW2;
				let endingUnit = cleanW2.endsWith("으면") ? unitById.get(619) :
					cleanW2.endsWith("어서") ? unitById.get(459) :
						cleanW2.endsWith("습니다") ? unitById.get(50) : null;
				tokens.push({
					surface: `${w1} ${w2}`,
					category: "auxiliary_construction",
					pattern: "-고 싶다 (Want to do)",
					lexical: a1.lexical,
					grammar: [
						{ text: "~고 싶다", pos: "Grammar Pattern", unit: gUnit, gloss: gUnit[DATA_SCHEMA.English] },
						{ text: endingDesc.split(' ')[0], pos: "Verb Ending", unit: endingUnit, gloss: endingDesc }
					]
				});
				i += 2;
				continue;
			}
		}

		// Multi-word pattern 4: -(으)려고 하다 (Auxiliary Intention)
		if (w1.endsWith("려고") || w1.endsWith("으려고")) {
			if (cleanW2.startsWith("합") || cleanW2.startsWith("하")) {
				const a1 = analyzeSingleToken(w1, i > 0 ? rawWords[i - 1] : "", w2, sentenceContext);
				tokens.push({
					surface: `${w1} ${w2}`,
					category: "auxiliary_construction",
					pattern: "-(으)려고 하다 (Intend to do)",
					lexical: a1.lexical,
					grammar: [
						{ text: "-(으)려고", pos: "Grammar Pattern", unit: unitById.get(816), gloss: "in order to (ID 816)" },
						{ text: "하다", pos: "Auxiliary Verb", unit: unitById.get(158), gloss: "to do (auxiliary, ID 158)" },
						{ text: "-ㅂ니다", pos: "Verb Ending", unit: unitById.get(50), gloss: "formal declarative (ID 50)" }
					]
				});
				i += 2;
				continue;
			}
		}

		// Multi-word pattern 5: -(으)ㄹ 수 있다 / 없다 (Grammar ID 522 / 523)
		if (cleanW2 === "수" && i + 2 < rawWords.length) {
			const w3 = rawWords[i + 2];
			const cleanW3 = w3.replace(/[^\w가-힣]+/g, '');
			if (cleanW3.startsWith("있") || cleanW3.startsWith("없")) {
				const isNegative = cleanW3.startsWith("없");
				const gUnit = unitById.get(isNegative ? 523 : 522);
				const a1 = analyzeSingleToken(w1, i > 0 ? rawWords[i - 1] : "", w2, sentenceContext);
				let endingDesc = cleanW3.endsWith("는") ? "-는 (Adnominal Ending, ID 645)" :
					cleanW3.endsWith("습니다") ? "-습니다 (Formal declarative, ID 50)" :
					cleanW3.endsWith("어요") ? "-아/어요 (Polite informal, ID 49)" : cleanW3;
				let endingUnit = cleanW3.endsWith("는") ? unitById.get(645) :
					cleanW3.endsWith("습니다") ? unitById.get(50) :
					cleanW3.endsWith("어요") ? unitById.get(49) : null;

				tokens.push({
					surface: `${w1} ${w2} ${w3}`,
					category: "auxiliary_construction",
					pattern: isNegative ? "-(으)ㄹ 수 없다 (Cannot do)" : "-(으)ㄹ 수 있다 (Can do)",
					lexical: a1 ? a1.lexical : null,
					grammar: [
						{ text: isNegative ? "-(으)ㄹ 수 없다" : "-(으)ㄹ 수 있다", pos: "Grammar Pattern", unit: gUnit, gloss: gUnit[DATA_SCHEMA.English] },
						{ text: endingDesc.split(' ')[0], pos: "Verb Ending", unit: endingUnit, gloss: endingDesc }
					]
				});
				i += 3;
				continue;
			}
		}

		// Multi-word pattern 6: -(으)면 좋겠다 (Grammar ID 1646)
		if ((w1.endsWith("면") || w1.endsWith("으면") || w1.endsWith("하면")) && cleanW2.startsWith("좋겠")) {
			const gUnit = unitById.get(1646);
			const a1 = analyzeSingleToken(w1, i > 0 ? rawWords[i - 1] : "", w2, sentenceContext);
			let endingDesc = cleanW2.endsWith("습니다") ? "-습니다 (Formal declarative, ID 50)" :
				cleanW2.endsWith("어요") ? "-아/어요 (Polite informal, ID 49)" : cleanW2;
			let endingUnit = cleanW2.endsWith("습니다") ? unitById.get(50) :
				cleanW2.endsWith("어요") ? unitById.get(49) : null;

			tokens.push({
				surface: `${w1} ${w2}`,
				category: "auxiliary_construction",
				pattern: "-(으)면 좋겠다 (I wish/hope that)",
				lexical: a1 ? a1.lexical : null,
				grammar: [
					{ text: "-(으)면 좋겠다", pos: "Grammar Pattern", unit: gUnit, gloss: gUnit[DATA_SCHEMA.English] },
					{ text: endingDesc.split(' ')[0], pos: "Verb Ending", unit: endingUnit, gloss: endingDesc }
				]
			});
			i += 2;
			continue;
		}

		// Multi-word pattern 7: -(으)ㄹ 때 (Grammar ID 855)
		if (cleanW2.startsWith("때")) {
			const d1 = decomposeHangul(w1.slice(-1));
			if (w1.endsWith("을") || (d1 && d1.final === 8)) {
				const gUnit = unitById.get(855);
				const a1 = analyzeSingleToken(w1, i > 0 ? rawWords[i - 1] : "", w2, sentenceContext);
				const particleMatch = cleanW2.match(/때(가|는|에|도)$/);
				const pText = particleMatch ? particleMatch[1] : null;
				const pSpec = pText ? PARTICLE_SPECS.find(p => p.text === pText) : null;
				const pUnit = pSpec && pSpec.ids[0] ? unitById.get(pSpec.ids[0]) : null;

				const gList = [
					{ text: "-(으)ㄹ 때", pos: "Grammar Pattern", unit: gUnit, gloss: gUnit[DATA_SCHEMA.English] }
				];
				if (pUnit) {
					gList.push({ text: pText, pos: "Particle", unit: pUnit, gloss: pUnit[DATA_SCHEMA.English] });
				}

				tokens.push({
					surface: `${w1} ${w2}`,
					category: "auxiliary_construction",
					pattern: "-(으)ㄹ 때 (When doing / during)",
					lexical: a1 ? a1.lexical : null,
					grammar: gList
				});
				i += 2;
				continue;
			}
		}

		// Multi-word pattern 8: 전화 드리다 (ID 599)
		if (w1 === "전화" && cleanW2.startsWith("드리")) {
			const vUnit = unitById.get(599); // 전화드리다
			const a2 = analyzeSingleToken(w2, w1, i < rawWords.length - 2 ? rawWords[i + 2] : "", sentenceContext);
			tokens.push({
				surface: `${w1} ${w2}`,
				category: "auxiliary_construction",
				pattern: "전화드리다 (To call - honorific)",
				lexical: { text: "전화드리다", pos: "Action Verb", unit: vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "to call (honorific)" },
				grammar: (a2 && a2.grammar) || []
			});
			i += 2;
			continue;
		}

		// Multi-word pattern 9: -아/어 주다 / 드리다 (Benefactive Auxiliary)
		if ((w1.endsWith("해") || w1.endsWith("아") || w1.endsWith("어")) && (cleanW2.startsWith("주") || cleanW2.startsWith("드리"))) {
			const a1 = analyzeSingleToken(w1, i > 0 ? rawWords[i - 1] : "", w2, sentenceContext);
			const isHonorific = cleanW2.startsWith("드리");
			const auxVerb = isHonorific ? unitById.get(591) : unitById.get(322); // 드리다 or 주다
			const a2 = analyzeSingleToken(w2, w1, i < rawWords.length - 2 ? rawWords[i + 2] : "", sentenceContext);

			tokens.push({
				surface: `${w1} ${w2}`,
				category: "auxiliary_construction",
				pattern: isHonorific ? "-아/어 드리다 (Do for someone - honorific)" : "-아/어 주다 (Do for someone)",
				lexical: a1 ? a1.lexical : null,
				grammar: [
					{ text: isHonorific ? "-아/어 드리다" : "-아/어 주다", pos: "Auxiliary Verb", unit: auxVerb, gloss: auxVerb ? auxVerb[DATA_SCHEMA.English] : "to give/do for" },
					...((a2 && a2.grammar) || [])
				]
			});
			i += 2;
			continue;
		}

		// Standard single token analysis
		const prev = i > 0 ? rawWords[i - 1] : "";
		const next = i < rawWords.length - 1 ? rawWords[i + 1] : "";
		const res = analyzeSingleToken(w1, prev, next, sentenceContext);
		tokens.push(res);
		i++;
	}

	return {
		sentenceIndex,
		text: sentText,
		tokens
	};
}

// =========================================================================
// 6. Passage-Level Ingestion & Dual Report Generation
// =========================================================================

function analyzePassage(passageText, passageName = "Passage") {
	// Clean boilerplate / metadata headers
	let cleanedText = passageText
		.replace(/^#+.*$/gm, '')
		.replace(/^[↳\s]+/gm, '')
		.trim();

	if (!/^[가-힣]/.test(cleanedText)) {
		cleanedText = cleanedText.replace(/^[^가-힣]+/, '').trim();
	}

	// Split into sentences using Korean punctuation terminators
	const rawSentences = cleanedText
		.split(/(?<=[.?!])\s+/)
		.map(s => s.trim())
		.filter(s => s.length > 0 && /[가-힣]/.test(s));

	const sentences = rawSentences.map((s, idx) => analyzeSentence(s, idx + 1));

	// Aggregate statistics
	const knownVocab = new Map();
	const knownGrammar = new Map();
	const missingVocab = new Map();
	const missingGrammar = new Map();
	const disambiguations = [];

	sentences.forEach(sent => {
		sent.tokens.forEach(t => {
			if (!t) return;

			// Disambiguations
			if (t.disambiguation) {
				disambiguations.push({
					sentenceIndex: sent.sentenceIndex,
					surface: t.surface,
					target: t.disambiguation.target,
					rule: t.disambiguation.rule,
					intentional_ambiguity: t.disambiguation.intentional_ambiguity
				});
			}

			// Lexical unit
			if (t.lexical) {
				if (t.category === "compound_noun" && t.lexical.components) {
					t.lexical.components.forEach(comp => {
						if (comp.unit) {
							const id = comp.unit[DATA_SCHEMA.Id];
							if (!knownVocab.has(id)) knownVocab.set(id, { unit: comp.unit, count: 0 });
							knownVocab.get(id).count++;
						} else if (comp.missing) {
							const k = comp.text;
							if (!missingVocab.has(k)) missingVocab.set(k, { text: k, pos: "Noun", gloss: comp.gloss, count: 0, contexts: [] });
							missingVocab.get(k).count++;
							missingVocab.get(k).contexts.push(`Sent ${sent.sentenceIndex}: ${t.surface}`);
						}
					});
				} else if (t.category === "numeric_phrase" && t.lexical.counter) {
					const c = t.lexical.counter;
					if (c.unit) {
						const id = c.unit[DATA_SCHEMA.Id];
						if (!knownVocab.has(id)) knownVocab.set(id, { unit: c.unit, count: 0 });
						knownVocab.get(id).count++;
					} else if (c.missing) {
						const k = c.text;
						if (!missingVocab.has(k)) missingVocab.set(k, { text: k, pos: "Noun (Counter)", gloss: c.gloss, count: 0, contexts: [] });
						missingVocab.get(k).count++;
						missingVocab.get(k).contexts.push(`Sent ${sent.sentenceIndex}: ${t.surface}`);
					}
				} else if (t.lexical.unit) {
					const id = t.lexical.unit[DATA_SCHEMA.Id];
					if (!knownVocab.has(id)) knownVocab.set(id, { unit: t.lexical.unit, count: 0 });
					knownVocab.get(id).count++;
				} else if (t.lexical.missing) {
					const k = t.lexical.text;
					if (!missingVocab.has(k)) {
						missingVocab.set(k, {
							text: k,
							pos: t.lexical.pos,
							gloss: t.lexical.gloss,
							tags: t.lexical.suggestedTags || [],
							count: 0,
							contexts: []
						});
					}
					missingVocab.get(k).count++;
					missingVocab.get(k).contexts.push(`Sent ${sent.sentenceIndex}: ${t.surface}`);
				}
			}

			// Grammar units
			if (t.grammar && Array.isArray(t.grammar)) {
				t.grammar.forEach(g => {
					if (g.unit) {
						const id = g.unit[DATA_SCHEMA.Id];
						if (!knownGrammar.has(id)) knownGrammar.set(id, { unit: g.unit, count: 0 });
						knownGrammar.get(id).count++;
					} else if (g.missing) {
						const k = g.text;
						if (!missingGrammar.has(k)) missingGrammar.set(k, { text: k, pos: g.pos, gloss: g.gloss, count: 0, contexts: [] });
						missingGrammar.get(k).count++;
						missingGrammar.get(k).contexts.push(`Sent ${sent.sentenceIndex}: ${t.surface}`);
					}
				});
			}
		});
	});

	return {
		passageName,
		totalSentences: sentences.length,
		sentences,
		summary: {
			knownVocabCount: knownVocab.size,
			knownGrammarCount: knownGrammar.size,
			missingVocabCount: missingVocab.size,
			missingGrammarCount: missingGrammar.size,
			disambiguationsCount: disambiguations.length
		},
		knownVocab: Array.from(knownVocab.values()),
		knownGrammar: Array.from(knownGrammar.values()),
		missingVocab: Array.from(missingVocab.values()),
		missingGrammar: Array.from(missingGrammar.values()),
		disambiguations
	};
}

function formatAnalysisReport(result) {
	const lines = [];
	lines.push("================================================================================");
	lines.push(`PASSAGE MORPHOLOGICAL ANALYSIS REPORT: ${result.passageName}`);
	lines.push("================================================================================");
	lines.push(`Total Sentences: ${result.totalSentences}`);
	lines.push(`Known Vocabulary Units:    ${result.summary.knownVocabCount}`);
	lines.push(`Known Grammar Patterns:    ${result.summary.knownGrammarCount}`);
	lines.push(`Missing Vocabulary Gaps:   ${result.summary.missingVocabCount}`);
	lines.push(`Missing Grammar Gaps:      ${result.summary.missingGrammarCount}`);
	lines.push(`Disambiguations Resolved:  ${result.summary.disambiguationsCount}`);
	lines.push("--------------------------------------------------------------------------------");

	// 1. Sentence-by-Sentence Breakdown
	lines.push("\n1. SENTENCE-BY-SENTENCE DECOMPOSITION");
	lines.push("--------------------------------------------------------------------------------");
	result.sentences.forEach(s => {
		lines.push(`\n[Sentence ${s.sentenceIndex}] "${s.text}"`);
		s.tokens.forEach(t => {
			if (!t) return;
			let tokenLine = `  - "${t.surface}" (${t.category})`;
			if (t.lexical) {
				if (t.lexical.components) {
					const comps = t.lexical.components.map(c => `${c.text}${c.unit ? ` [ID ${c.unit[DATA_SCHEMA.Id]}]` : ' [MISSING]'}`).join(' + ');
					tokenLine += `\n      Lexical Compound: ${comps}`;
				} else {
					const idStr = t.lexical.unit ? `ID ${t.lexical.unit[DATA_SCHEMA.Id]}` : "MISSING";
					tokenLine += `\n      Lexical: ${t.lexical.text} [${t.lexical.pos}] (${idStr}) - "${t.lexical.gloss}"`;
				}
			}
			if (t.grammar && t.grammar.length > 0) {
				const gStrs = t.grammar.map(g => {
					const idStr = g.unit ? `ID ${g.unit[DATA_SCHEMA.Id]}` : "MISSING";
					return `${g.text} [${g.pos}] (${idStr})`;
				});
				tokenLine += `\n      Grammar: ${gStrs.join(', ')}`;
			}
			if (t.disambiguation) {
				tokenLine += `\n      Disambiguation: -> ${t.disambiguation.target}`;
				tokenLine += `\n      Rule: ${t.disambiguation.rule}`;
				if (t.disambiguation.intentional_ambiguity) {
					tokenLine += ` [NOTE: Pedagogical Ambiguity Preserved]`;
				}
			}
			lines.push(tokenLine);
		});
	});

	// 2. Student Study Guide
	lines.push("\n================================================================================");
	lines.push("2. LEARNER STUDY CHECKLIST (Active Language Units in this Passage)");
	lines.push("================================================================================");
	lines.push(`\n[A. Vocabulary to Master (${result.knownVocab.length} units)]`);
	result.knownVocab.forEach(item => {
		const u = item.unit;
		const id = String(u[DATA_SCHEMA.Id]).padStart(4, ' ');
		const ko = u[DATA_SCHEMA.Korean].padEnd(16, ' ');
		const en = `"${u[DATA_SCHEMA.English]}"`;
		const freq = `(freq: ${item.count}, source: ${u[DATA_SCHEMA.Source]})`;
		lines.push(`    - [ID ${id}] ${ko} ${en} ${freq}`);
	});

	lines.push(`\n[B. Active Grammar Patterns to Master (${result.knownGrammar.length} units)]`);
	result.knownGrammar.forEach(item => {
		const u = item.unit;
		const id = String(u[DATA_SCHEMA.Id]).padStart(4, ' ');
		const ko = u[DATA_SCHEMA.Korean].padEnd(24, ' ');
		const en = `"${u[DATA_SCHEMA.English]}"`;
		const freq = `(freq: ${item.count}, source: ${u[DATA_SCHEMA.Source]})`;
		lines.push(`    - [ID ${id}] ${ko} ${en} ${freq}`);
	});

	// 3. Curriculum Gap Inventory
	lines.push("\n--------------------------------------------------------------------------------");
	lines.push("3. CURRICULUM GAP INVENTORY (Units to Ingest into data.js & homonyms.js)");
	lines.push("--------------------------------------------------------------------------------");
	if (result.missingVocab.length === 0 && result.missingGrammar.length === 0) {
		lines.push("\n  ALL vocabulary and grammar units in this passage are fully covered in data.js! (0 Gaps)");
	} else {
		if (result.missingVocab.length > 0) {
			lines.push(`\n[A. Missing Vocabulary (${result.missingVocab.length} items)]`);
			result.missingVocab.forEach(item => {
				const tagStr = item.tags && item.tags.length > 0 ? `, tags: [${item.tags.join(', ')}]` : '';
				lines.push(`    - ${item.text.padEnd(14, ' ')} [${item.pos}] "${item.gloss}" (freq: ${item.count}${tagStr})`);
				lines.push(`      Contexts: ${item.contexts.join(', ')}`);
			});
		}
		if (result.missingGrammar.length > 0) {
			lines.push(`\n[B. Missing Grammar Patterns (${result.missingGrammar.length} items)]`);
			result.missingGrammar.forEach(item => {
				lines.push(`    - ${item.text.padEnd(18, ' ')} [${item.pos}] "${item.gloss}" (freq: ${item.count})`);
				lines.push(`      Contexts: ${item.contexts.join(', ')}`);
			});
		}
	}

	// 4. Homonym Disambiguation Summary
	lines.push("\n--------------------------------------------------------------------------------");
	lines.push(`4. HOMONYM DISAMBIGUATION SUMMARY (${result.disambiguations.length} occurrences)`);
	lines.push("--------------------------------------------------------------------------------");
	result.disambiguations.forEach(d => {
		const tag = d.intentional_ambiguity ? " [INTENTIONAL AMBIGUITY]" : "";
		lines.push(`  [Sent ${d.sentenceIndex}] Token "${d.surface}":${tag}`);
		lines.push(`    -> Resolved Target: ${d.target}`);
		lines.push(`    -> Decision Rule:   ${d.rule}`);
	});
	lines.push("================================================================================\n");

	return lines.join("\n");
}

// =========================================================================
// 7. CLI Execution & Module Exports
// =========================================================================

function runCli() {
	const studytexts = require('./studytexts.js');
	const args = process.argv.slice(2);
	let passageName = "studytext12";
	let textToAnalyze = studytexts.studytext12;

	if (args.length > 0 && !args[0].startsWith("-")) {
		passageName = args[0];
		if (studytexts[passageName]) {
			textToAnalyze = studytexts[passageName];
		} else {
			console.error(`Unknown studytext key '${passageName}', defaulting to studytext12.`);
			passageName = "studytext12";
			textToAnalyze = studytexts.studytext12;
		}
	}

	const report = analyzePassage(textToAnalyze, passageName);

	if (args.includes("--json")) {
		console.log(JSON.stringify(report, null, 2));
	} else {
		console.log(formatAnalysisReport(report));
	}
}

if (require.main === module) {
	runCli();
}

module.exports = {
	analyzePassage,
	analyzeSentence,
	analyzeSingleToken,
	evaluateSyntaxFrame,
	disambiguateCandidates,
	formatAnalysisReport
};
