(function() {
/**
 * korean/analyzer/sentence_analyzer.js
 *
 * Sentence-Level Analysis & Multi-Word Construction Recognition Engine.
 * Identifies auxiliary predicates, bound noun grammar patterns, and clause valency.
 *
 * Platform: Node.js & Browser (Vanilla JS, zero dependencies).
 */

const { DATA_SCHEMA, decomposeHangul, composeHangul, setFinal, matchesBaseSyllable } =
	(typeof require !== 'undefined' ? require('../core/primitives.js') : window);

const { PARTICLE_SPECS } =
	(typeof require !== 'undefined' ? require('./particles.js') : window);

const { evaluateSyntaxFrame } =
	(typeof require !== 'undefined' ? require('./syntax_frame.js') : window);

const { matchAdnominalEnding } =
	(typeof require !== 'undefined' ? require('./verb_morphology.js') : window);

const { analyzeSingleToken } =
	(typeof require !== 'undefined' ? require('./token_analyzer.js') : window);

const { getIndex, DEFAULT_INFORMAL_CONNECTIVES } =
	(typeof require !== 'undefined' ? require('./indexer.js') : window);

/**
 * Resolves verbal/copula inflections on auxiliary tokens using dynamic single-token
 * morphology arbitration and the collection of language units tagged with 'verbal_ending'.
 */
function resolveAuxiliaryEnding(cleanWord, index) {
	if (!cleanWord || !index) return null;
	const analyzed = analyzeSingleToken(cleanWord, "", "", {}, index);
	if (analyzed && analyzed.grammar && analyzed.grammar.length > 0) return analyzed.grammar;

	if (Array.isArray(index.verbalEndingRules)) {
		const lastChar = cleanWord.length >= 2 ? cleanWord.slice(-2, -1) : null;
		const d = lastChar ? decomposeHangul(lastChar) : null;
		for (const rule of index.verbalEndingRules) {
			const matched = (rule.form === "ㅂ니다") ?
				(cleanWord.endsWith("ㅂ니다") || (cleanWord.endsWith("니다") && d && d.final === 17)) :
				cleanWord.endsWith(rule.form);
			if (matched) {
				const grammarList = [];
				if (cleanWord.includes("았") || cleanWord.includes("었")) {
					const pastCandidates = (index.grammarByKo && index.grammarByKo.get("~았/었어요")) || [];
					const pastUnit = pastCandidates[0] || null;
					if (pastUnit) {
						grammarList.push({ text: "-았/었-", pos: "Tense Infix", unit: pastUnit, gloss: pastUnit[DATA_SCHEMA.English] || "past tense" });
					}
				}
				grammarList.push({ text: rule.text, pos: rule.pos, unit: rule.unit, gloss: rule.gloss });
				return grammarList;
			}
		}
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

/**
 * Fast O(1) set-based check verifying whether a word ends with a valid informal connective morpheme.
 * Utilizes the dynamically populated informalConnectiveEndings Set initialized by indexer.js.
 * 
 * @param {string} word The word to evaluate
 * @param {Object} [index] Optional fast lookup index containing pre-computed informalConnectiveEndings
 * @returns {boolean} True if the word terminates in an informal connective morpheme
 */
function isInformalConnective(word, index = null) {
	if (!word || /^[\d,]/.test(word) || word.endsWith("에서") || word.endsWith("에게서")) return false;
	const set = (index && index.informalConnectiveEndings) || DEFAULT_INFORMAL_CONNECTIVES;
	return set.has(word.slice(-1)) || (word.length >= 2 && set.has(word.slice(-2)));
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
	let detectedPastInfix = null;
	let detectedInchoative = null;
	let detectedCopula = null;
	let detectedW1Grammar = null;
	if (match.lexicalType === "stem_da") {
		const targetWord = match.lexicalTokenIndex === 2 ? w2 : w1;
		const suffixLen = (match.stemSuffix || "다").length;
		const stem = targetWord.slice(0, -suffixLen);
		let baseVerb = stem + "다";
		if (!vocabByKo.has(baseVerb) && vocabByKo.has(stem + "하다")) {
			baseVerb = stem + "하다";
		}
		if (!vocabByKo.has(baseVerb) && stem.length > 0) {
			const lastChar = stem.slice(-1);
			const d = decomposeHangul(lastChar);
			if (d && d.final === 20) { // ㅆ batchim (past tense: 았 / 었)
				const strippedChar = setFinal(lastChar, 0);
				if (strippedChar === "아" || strippedChar === "어") {
					const rootStem = stem.slice(0, -1);
					const candVerb = rootStem + "다";
					if (vocabByKo.has(candVerb)) {
						baseVerb = candVerb;
						const pastCandidates = (index.grammarByKo && index.grammarByKo.get("~았/었어요")) || [];
						const pastUnit = pastCandidates[0] || null;
						detectedPastInfix = {
							text: "-았/었-",
							pos: "Tense Infix",
							unitId: pastUnit ? pastUnit[DATA_SCHEMA.Id] : null,
							gloss: pastUnit ? pastUnit[DATA_SCHEMA.English] : "past tense"
						};
					}
				}
			} else if (d && d.final === 4) { // ㄴ batchim (adnominal -ㄴ지 / -(으)ㄴ지, e.g. 튼튼한지 -> 튼튼하다)
				const strippedChar = setFinal(lastChar, 0);
				const candVerb = stem.slice(0, -1) + strippedChar + "다";
				if (vocabByKo.has(candVerb)) {
					baseVerb = candVerb;
				}
			} else if (stem.endsWith("워지")) { // inchoative -어지다 on ㅂ-irregular (e.g. 더러워지지 -> 더럽다 + -어지다)
				const rootStem = stem.slice(0, -2);
				const prevChar = rootStem.slice(-1);
				const prevD = decomposeHangul(prevChar);
				if (prevD && prevD.final === 0) {
					const bChar = composeHangul(prevD.initial, prevD.medial, 17);
					const candB = rootStem.slice(0, -1) + bChar + "다";
					if (vocabByKo.has(candB)) {
						baseVerb = candB;
						const inchCandidates = (index.grammarByKo && index.grammarByKo.get("-어지다")) || [];
						const inchUnit = inchCandidates[0] || null;
						detectedInchoative = { text: "-어지다", pos: "Verb Ending", unitId: inchUnit ? inchUnit[DATA_SCHEMA.Id] : null, gloss: inchUnit ? inchUnit[DATA_SCHEMA.English] : "become / get" };
					}
				}
			} else if (stem.endsWith("해지")) {
				const candHada = stem.slice(0, -2) + "하다";
				if (vocabByKo.has(candHada)) {
					baseVerb = candHada;
					const inchCandidates = (index.grammarByKo && index.grammarByKo.get("-어지다")) || [];
					const inchUnit = inchCandidates[0] || null;
					detectedInchoative = { text: "-어지다", pos: "Verb Ending", unitId: inchUnit ? inchUnit[DATA_SCHEMA.Id] : null, gloss: inchUnit ? inchUnit[DATA_SCHEMA.English] : "become / get" };
				}
			} else if (stem.endsWith("어지") || stem.endsWith("아지")) {
				const candRoot = stem.slice(0, -2) + "다";
				if (vocabByKo.has(candRoot)) {
					baseVerb = candRoot;
					const inchCandidates = (index.grammarByKo && index.grammarByKo.get("-어지다")) || [];
					const inchUnit = inchCandidates[0] || null;
					detectedInchoative = { text: "-어지다", pos: "Verb Ending", unitId: inchUnit ? inchUnit[DATA_SCHEMA.Id] : null, gloss: inchUnit ? inchUnit[DATA_SCHEMA.English] : "become / get" };
				}
			} else if (stem.endsWith("이") && stem.length > 1) { // copula -이다 on noun (e.g. 디자인이기 -> 디자인 + 이다)
				const nounStem = stem.slice(0, -1);
				const nUnits = (vocabByKo.get(nounStem) || []).filter(u => u[DATA_SCHEMA.PartofSpeech] === 'Noun' || u[DATA_SCHEMA.PartofSpeech] === 'Pronoun');
				if (nUnits.length > 0) {
					baseVerb = nounStem;
					const copCandidates = (index.grammarByKo && (index.grammarByKo.get("입니다") || index.grammarByKo.get("이다"))) || [];
					const copUnit = copCandidates[0] || null;
					detectedCopula = { text: "이다", pos: "Copula", unitId: copUnit ? copUnit[DATA_SCHEMA.Id] : null, gloss: copUnit ? copUnit[DATA_SCHEMA.English] : "copula 'be'" };
				}
			}
		}
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		lexical = {
			text: baseVerb,
			pos: vUnit ? vUnit[DATA_SCHEMA.PartofSpeech] : "Verb",
			unit: vUnit,
			missing: !vUnit,
			gloss: vUnit ? vUnit[DATA_SCHEMA.English] : ""
		};
	} else if (match.lexicalType === "stem_informal_or_da") {
		const targetWord = match.lexicalTokenIndex === 2 ? w2 : w1;
		const stemWithInf = targetWord.endsWith("도") ? targetWord.slice(0, -1) : targetWord;
		let baseVerb = null;
		if (stemWithInf.endsWith("해")) {
			baseVerb = stemWithInf.slice(0, -1) + "하다";
		} else if (stemWithInf.endsWith("려")) {
			baseVerb = stemWithInf.slice(0, -1) + "리다";
		} else if (stemWithInf.endsWith("라") || stemWithInf.endsWith("러")) {
			const prevChar = stemWithInf.length >= 2 ? stemWithInf.slice(-2, -1) : null;
			const d = prevChar ? decomposeHangul(prevChar) : null;
			if (d && d.final === 8) {
				const candReu = stemWithInf.slice(0, -2) + setFinal(prevChar, 0) + "르다";
				if (vocabByKo.has(candReu)) baseVerb = candReu;
			}
			if (!baseVerb) baseVerb = stemWithInf.slice(0, -1) + "다";
		} else if (stemWithInf.endsWith("어") || stemWithInf.endsWith("아")) {
			baseVerb = stemWithInf.slice(0, -1) + "다";
		} else {
			baseVerb = stemWithInf + "다";
		}
		if (!vocabByKo.has(baseVerb)) {
			// Check single-syllable open / irregular (e.g. 써 -> 쓰다, 봐 -> 보다, 가 -> 가다, 와 -> 오다)
			const a1 = analyzeSingleToken(stemWithInf, prevW1, w2, sentenceContext, index);
			if (a1 && a1.lexical && a1.lexical.unit) {
				baseVerb = a1.lexical.text;
			}
		}
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		lexical = { text: baseVerb, pos: vUnit ? vUnit[DATA_SCHEMA.PartofSpeech] : "Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" };
	} else if (match.lexicalType === "stem_b_irregular_or_da") {
		let baseVerb = null;
		if (w1.endsWith("워")) {
			const stem = w1.slice(0, -1);
			const d = decomposeHangul(stem.slice(-1));
			if (d && d.final === 0) {
				const bChar = composeHangul(d.initial, d.medial, 17);
				baseVerb = stem.slice(0, -1) + bChar + "다";
			}
		} else if (w1.endsWith("아") || w1.endsWith("어")) {
			baseVerb = w1.slice(0, -1) + "다";
		}
		const vUnit = baseVerb && vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		lexical = { text: baseVerb || w1, pos: vUnit ? vUnit[DATA_SCHEMA.PartofSpeech] : "Descriptive Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" };
	} else if (match.lexicalType === "self_unit") {
		lexical = { text: unit[DATA_SCHEMA.Korean], pos: unit[DATA_SCHEMA.PartofSpeech], unit, gloss: unit[DATA_SCHEMA.English] };
	} else if (match.lexical !== undefined) {
		lexical = match.lexical;
	} else if (match.isAdnominalL || match.lexicalType === "adnominal_l") {
		const adm = matchAdnominalEnding ? matchAdnominalEnding(w1, index) : null;
		if (adm && adm.lexical) {
			lexical = adm.lexical;
		} else {
			const a1 = analyzeSingleToken(w1, prevW1, w2, sentenceContext, index);
			lexical = a1 ? a1.lexical : null;
		}
	} else {
		const a1 = analyzeSingleToken(w1, prevW1, w2, sentenceContext, index);
		lexical = a1 ? a1.lexical : null;
		if (a1 && a1.grammar && a1.grammar.length > 0) detectedW1Grammar = a1.grammar;
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

	if (detectedPastInfix) {
		const pastUnit = unitById.get(detectedPastInfix.unitId);
		grammarList.push({ text: detectedPastInfix.text, pos: detectedPastInfix.pos, unit: pastUnit, gloss: detectedPastInfix.gloss });
	}
	if (detectedInchoative) {
		const inchUnit = unitById.get(detectedInchoative.unitId);
		grammarList.push({ text: detectedInchoative.text, pos: detectedInchoative.pos, unit: inchUnit, gloss: detectedInchoative.gloss });
	}
	if (detectedCopula) {
		const copUnit = unitById.get(detectedCopula.unitId);
		grammarList.push({ text: detectedCopula.text, pos: detectedCopula.pos, unit: copUnit, gloss: detectedCopula.gloss });
	}
	if (detectedW1Grammar) grammarList.unshift(...detectedW1Grammar);

	if (match.extraParticle) {
		const pUnit = unitById.get(match.extraParticle.unitId);
		grammarList.push({ text: match.extraParticle.text, pos: "Particle", unit: pUnit, gloss: match.extraParticle.gloss || (pUnit ? pUnit[DATA_SCHEMA.English] : "") });
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
		const endObjs = resolveAuxiliaryEnding(targetWord, index);
		if (endObjs && endObjs.length > 0) {
			grammarList.push(...endObjs);
		}
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
		isInformal: isInformalConnective(w1, index),
		checkAdnominalN: isAdnominalN,
		checkAdnominalL: isAdnominalL,
		checkInformal: (w) => isInformalConnective(w, index),
		decomposeHangul,
		rawWords,
		i,
		sentenceContext,
		index,
		matchesBaseSyllable
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
		if (res) tokens.push(res);
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
	window.isInformalConnective = isInformalConnective;
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		analyzeSentence,
		tryMatchMultiWord,
		isInformalConnective
	};
}
})();
