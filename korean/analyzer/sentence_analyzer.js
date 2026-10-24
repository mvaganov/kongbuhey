/**
 * korean/analyzer/sentence_analyzer.js
 *
 * Sentence-Level Analysis & Multi-Word Construction Recognition Engine.
 * Identifies auxiliary predicates, bound noun grammar patterns, and clause valency.
 *
 * Platform: Node.js & Browser (Vanilla JS, zero dependencies).
 */

const { DATA_SCHEMA, decomposeHangul } =
	(typeof require !== 'undefined' ? require('../core/primitives.js') : window);

const { PARTICLE_SPECS } =
	(typeof require !== 'undefined' ? require('./particles.js') : window);

const { evaluateSyntaxFrame } =
	(typeof require !== 'undefined' ? require('./syntax_frame.js') : window);

const { analyzeSingleToken } =
	(typeof require !== 'undefined' ? require('./token_analyzer.js') : window);

const { getIndex } =
	(typeof require !== 'undefined' ? require('./indexer.js') : window);

/**
 * Resolves common verbal/copula inflections on auxiliary tokens.
 */
function resolveAuxiliaryEnding(cleanWord, unitById) {
	if (!cleanWord) return null;
	if (cleanWord.endsWith("습니다") || cleanWord.endsWith("ㅂ니다")) {
		return { text: "-습니다", pos: "Verb Ending", unit: unitById.get(50), gloss: "-습니다 (Formal declarative, ID 50)" };
	}
	if (cleanWord.endsWith("아요") || cleanWord.endsWith("어요") || cleanWord.endsWith("에요") || cleanWord.endsWith("예요") || cleanWord.endsWith("이다")) {
		return { text: "-아/어요", pos: "Verb Ending", unit: unitById.get(49), gloss: "-아/어요 (Polite informal, ID 49)" };
	}
	if (cleanWord.endsWith("으면") || cleanWord.endsWith("면")) {
		return { text: "-(으)면", pos: "Verb Ending", unit: unitById.get(619), gloss: "-(으)면 (Conditional, ID 619)" };
	}
	if (cleanWord.endsWith("어서") || cleanWord.endsWith("아서")) {
		return { text: "-아/어서", pos: "Verb Ending", unit: unitById.get(459), gloss: "-아/어서 (Cause/Sequential, ID 459)" };
	}
	if (cleanWord.endsWith("는")) {
		return { text: "-는", pos: "Adnominal Ending", unit: unitById.get(645), gloss: "-는 (Adnominal Ending, ID 645)" };
	}
	if (cleanWord.endsWith("고")) {
		return { text: "-고", pos: "Connective", unit: unitById.get(336), gloss: "-고 (Connective, ID 336)" };
	}
	return null;
}

function isAdnominalN(word) {
	if (!word) return false;
	const d = decomposeHangul(word.slice(-1));
	return word.endsWith("은") || (d && d.final === 4);
}

function isAdnominalL(word) {
	if (!word) return false;
	const d = decomposeHangul(word.slice(-1));
	return word.endsWith("을") || (d && d.final === 8);
}

function isInformalConnective(word) {
	if (!word) return false;
	return word.endsWith("해") || word.endsWith("아") || word.endsWith("어") ||
		word.endsWith("여") || word.endsWith("와") || word.endsWith("가") ||
		word.endsWith("써") || word.endsWith("줘") || word.endsWith("드셔");
}

/**
 * Builds a structured auxiliary construction token from a SyntaxFrame matcher result.
 */
function buildMweToken(unit, match, rawWords, i, sentenceContext, index) {
	const unitById = index.unitById;
	const vocabByKo = index.vocabByKo;
	const w1 = rawWords[i];
	const w2 = i < rawWords.length - 1 ? rawWords[i + 1] : "";
	const cleanW2 = w2 ? w2.replace(/[^\w가-힣]+/g, '') : "";
	const w3 = i < rawWords.length - 2 ? rawWords[i + 2] : "";
	const cleanW3 = w3 ? w3.replace(/[^\w가-힣]+/g, '') : "";
	const prevW1 = i > 0 ? rawWords[i - 1] : "";

	const span = match.span || 2;
	const surface = match.surfaceOverride || (span === 3 ? `${w1} ${w2} ${w3}` : `${w1} ${w2}`);

	// 1. Resolve Lexical Verb
	let lexical = null;
	if (match.lexicalType === "stem_da") {
		const suffixLen = (match.stemSuffix || "다").length;
		const stem = w1.slice(0, -suffixLen);
		const baseVerb = stem + "다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		lexical = {
			text: baseVerb,
			pos: vUnit ? vUnit[DATA_SCHEMA.PartofSpeech] : "Verb",
			unit: vUnit,
			missing: !vUnit,
			gloss: vUnit ? vUnit[DATA_SCHEMA.English] : ""
		};
	} else if (match.lexicalType === "self_unit") {
		lexical = {
			text: unit[DATA_SCHEMA.Korean],
			pos: unit[DATA_SCHEMA.PartofSpeech],
			unit: unit,
			gloss: unit[DATA_SCHEMA.English]
		};
	} else if (match.lexical !== undefined) {
		lexical = match.lexical;
	} else {
		const a1 = analyzeSingleToken(w1, prevW1, w2, sentenceContext, index);
		lexical = a1 ? a1.lexical : null;
	}

	// 2. Resolve Grammar Units
	const grammarList = [];
	if (match.grammar && Array.isArray(match.grammar)) {
		for (const g of match.grammar) {
			const resolvedUnit = g.unitId ? unitById.get(g.unitId) : (g.unit || unit);
			grammarList.push({
				text: g.text || unit[DATA_SCHEMA.Korean],
				pos: g.pos || "Grammar Pattern",
				unit: resolvedUnit,
				gloss: g.gloss || (resolvedUnit ? resolvedUnit[DATA_SCHEMA.English] : "")
			});
		}
	} else if (match.boundNounId) {
		const geodUnit = unitById.get(match.boundNounId);
		grammarList.push({
			text: match.boundNounText || "것",
			pos: "Bound Noun",
			unit: geodUnit,
			gloss: geodUnit ? geodUnit[DATA_SCHEMA.English] : "bound noun 'thing' (ID 581)"
		});
		grammarList.push({
			text: unit[DATA_SCHEMA.Korean],
			pos: unit[DATA_SCHEMA.PartofSpeech],
			unit: unit,
			gloss: unit[DATA_SCHEMA.English]
		});
	} else {
		grammarList.push({
			text: unit[DATA_SCHEMA.Korean],
			pos: "Grammar Pattern",
			unit: unit,
			gloss: unit[DATA_SCHEMA.English]
		});
	}

	if (match.extraParticle) {
		const pUnit = unitById.get(match.extraParticle.unitId);
		grammarList.push({
			text: match.extraParticle.text,
			pos: "Particle",
			unit: pUnit,
			gloss: match.extraParticle.gloss || (pUnit ? pUnit[DATA_SCHEMA.English] : "")
		});
	}

	if (match.parseTrailingParticle) {
		const particleMatch = cleanW2.match(/때(가|는|에|도)$/);
		const pText = particleMatch ? particleMatch[1] : null;
		const pSpec = pText ? PARTICLE_SPECS.find(p => p.text === pText) : null;
		const pUnit = pSpec && pSpec.ids[0] ? unitById.get(pSpec.ids[0]) : null;
		if (pUnit) {
			grammarList.push({ text: pText, pos: "Particle", unit: pUnit, gloss: pUnit[DATA_SCHEMA.English] });
		}
	}

	if (match.auxEndingTokenIndex) {
		const targetWord = match.auxEndingTokenIndex === 3 ? cleanW3 : cleanW2;
		const endObj = resolveAuxiliaryEnding(targetWord, unitById);
		if (endObj) grammarList.push(endObj);
	}

	if (match.parseW2Grammar) {
		const a2 = analyzeSingleToken(w2, w1, rawWords[i + 2] || "", sentenceContext, index);
		if (a2 && a2.grammar && a2.grammar.length > 0) {
			grammarList.push(...a2.grammar);
		}
	}

	return {
		consumed: span,
		token: {
			surface,
			category: "auxiliary_construction",
			pattern: match.pattern || `${unit[DATA_SCHEMA.Korean]} (${unit[DATA_SCHEMA.English]})`,
			lexical,
			grammar: grammarList,
			disambiguation: match.disambiguation ? {
				resolved: true,
				target: match.disambiguation.target || `${unit[DATA_SCHEMA.Korean]} (ID ${unit[DATA_SCHEMA.Id]})`,
				rule: match.disambiguation.rule || "SyntaxFrame matcher"
			} : null
		}
	};
}

/**
 * Attempts to match multi-word expressions (auxiliary constructions & bound nouns)
 * starting at index i in rawWords, driven dynamically by compiled SyntaxFrame matchers.
 * 
 * @param {Array<string>} rawWords Sequence of whitespace-delimited words
 * @param {number} i Current index in rawWords
 * @param {Object} sentenceContext Context holding clausePredicate, etc.
 * @param {Object} index Fast-lookup index
 * @returns {Object|null} { consumed: number, token: Object } or null
 */
function tryMatchMultiWord(rawWords, i, sentenceContext, index) {
	const w1 = rawWords[i];
	const w2 = i < rawWords.length - 1 ? rawWords[i + 1] : "";
	const cleanW2 = w2 ? w2.replace(/[^\w가-힣]+/g, '') : "";
	const w3 = i < rawWords.length - 2 ? rawWords[i + 2] : "";
	const cleanW3 = w3 ? w3.replace(/[^\w가-힣]+/g, '') : "";
	const prevW1 = i > 0 ? rawWords[i - 1] : "";

	const matchCtx = {
		w1,
		w2,
		w3,
		cleanW2,
		cleanW3,
		prevW1,
		isAdnominalN: isAdnominalN(w1),
		isAdnominalL: isAdnominalL(w1),
		isInformal: isInformalConnective(w1),
		rawWords,
		i,
		sentenceContext,
		index
	};

	// Evaluate declarative SyntaxFrame matchers registered in index
	if (index.mweRules && index.mweRules.length > 0) {
		for (const rule of index.mweRules) {
			matchCtx.unit = rule.unit;
			const match = rule.matcherFn(matchCtx);
			if (match) {
				return buildMweToken(rule.unit, match, rawWords, i, sentenceContext, index);
			}
		}
	}

	return null;
}

/**
 * Analyzes a full Korean sentence, parsing multi-word grammar patterns and single tokens.
 * 
 * @param {string} sentText The sentence text
 * @param {number} sentenceIndex 1-based sentence index in passage
 * @param {Object} explicitIndex Optional pre-built index
 * @returns {Object} { sentenceIndex, text: sentText, tokens }
 */
function analyzeSentence(sentText, sentenceIndex = 1, explicitIndex = null) {
	const index = explicitIndex || getIndex();
	const vocabByKo = index.vocabByKo;

	const rawWords = sentText.split(/\s+/).map(w => w.trim()).filter(Boolean);

	// Pass 1: Extract clause terminal predicate for semantic valency resolution
	let clausePredicate = null;
	for (let k = rawWords.length - 1; k >= 0; k--) {
		const cw = rawWords[k].replace(/[^\w가-힣]+/g, '');
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
		const mweMatch = tryMatchMultiWord(rawWords, i, sentenceContext, index);
		if (mweMatch) {
			tokens.push(mweMatch.token);
			i += mweMatch.consumed;
			continue;
		}

		// Standard single token analysis
		const prev = i > 0 ? rawWords[i - 1] : "";
		const next = i < rawWords.length - 1 ? rawWords[i + 1] : "";
		const res = analyzeSingleToken(rawWords[i], prev, next, sentenceContext, index);
		tokens.push(res);
		i++;
	}

	return {
		sentenceIndex,
		text: sentText,
		tokens
	};
}

if (typeof window !== 'undefined') {
	window.analyzeSentence = analyzeSentence;
	window.tryMatchMultiWord = tryMatchMultiWord;
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		analyzeSentence,
		tryMatchMultiWord
	};
}
