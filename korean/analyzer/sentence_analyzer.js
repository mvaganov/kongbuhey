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
 * Attempts to match multi-word expressions (auxiliary constructions & bound nouns)
 * starting at index i in rawWords.
 * 
 * @param {Array<string>} rawWords Sequence of whitespace-delimited words
 * @param {number} i Current index in rawWords
 * @param {Object} sentenceContext Context holding clausePredicate, etc.
 * @param {Object} index Fast-lookup index
 * @returns {Object|null} { consumed: number, token: Object } or null
 */
function tryMatchMultiWord(rawWords, i, sentenceContext, index) {
	const unitById = index.unitById;
	const vocabByKo = index.vocabByKo;
	const w1 = rawWords[i];
	const w2 = i < rawWords.length - 1 ? rawWords[i + 1] : "";
	const cleanW2 = w2 ? w2.replace(/[^\w가-힣]+/g, '') : "";
	const w3 = i < rawWords.length - 2 ? rawWords[i + 2] : "";
	const cleanW3 = w3 ? w3.replace(/[^\w가-힣]+/g, '') : "";
	const prevW1 = i > 0 ? rawWords[i - 1] : "";

	// 1. Bound Grammar -(으)ㄴ 후에 (Grammar ID 710)
	if (isAdnominalN(w1) && cleanW2 === "후에") {
		const gUnit = unitById.get(710);
		const a1 = analyzeSingleToken(w1, prevW1, w2, sentenceContext, index);
		const evalRes = evaluateSyntaxFrame(gUnit, { isPrecededByAdnominalVerb: true }, index);
		return {
			consumed: 2,
			token: {
				surface: `${w1} ${w2}`,
				category: "auxiliary_construction",
				pattern: "-(으)ㄴ 후에 (After doing)",
				lexical: a1 ? a1.lexical : null,
				grammar: [
					{ text: "-(으)ㄴ 후에", pos: "Grammar Pattern", unit: gUnit, gloss: gUnit ? gUnit[DATA_SCHEMA.English] : "after doing" }
				],
				disambiguation: {
					resolved: true,
					target: "-(으)ㄴ 후에 (ID 710)",
					rule: evalRes.reason
				}
			}
		};
	}

	// 2. Bound Grammar -(으)ㄴ 지 (Grammar ID 817)
	if (isAdnominalN(w1) && cleanW2 === "지") {
		const gUnit = unitById.get(817);
		const a1 = analyzeSingleToken(w1, prevW1, w2, sentenceContext, index);
		const evalRes = evaluateSyntaxFrame(gUnit, { isPrecededByAdnominalVerb: true }, index);
		return {
			consumed: 2,
			token: {
				surface: `${w1} 지`,
				category: "auxiliary_construction",
				pattern: "-(으)ㄴ 지 (Time elapsed since doing)",
				lexical: a1 ? a1.lexical : null,
				grammar: [
					{ text: "-(으)ㄴ 지", pos: "Grammar Pattern", unit: gUnit, gloss: gUnit ? gUnit[DATA_SCHEMA.English] : "time elapsed since" }
				],
				disambiguation: {
					resolved: true,
					target: "-(으)ㄴ 지 (ID 817)",
					rule: evalRes.reason
				}
			}
		};
	}

	// 3. -기 때문에 (Grammar ID 54)
	if (w1.endsWith("기") && cleanW2 === "때문에") {
		const gUnit = unitById.get(54);
		const stem = w1.slice(0, -1);
		const baseVerb = stem + "다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			consumed: 2,
			token: {
				surface: `${w1} ${w2}`,
				category: "auxiliary_construction",
				pattern: "-기 때문에 (Because of / Since)",
				lexical: {
					text: baseVerb,
					pos: vUnit ? vUnit[DATA_SCHEMA.PartofSpeech] : "Verb",
					unit: vUnit,
					missing: !vUnit,
					gloss: vUnit ? vUnit[DATA_SCHEMA.English] : ""
				},
				grammar: [
					{ text: "-기 때문에", pos: "Grammar Pattern", unit: gUnit, gloss: gUnit ? gUnit[DATA_SCHEMA.English] : "because of" }
				]
			}
		};
	}

	// 4. -지 않다 (Grammar ID 274)
	if (w1.endsWith("지") && cleanW2.startsWith("않")) {
		const gUnit = unitById.get(274);
		const stem = w1.slice(0, -1);
		const baseVerb = stem + "다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		const a2 = analyzeSingleToken(w2, w1, rawWords[i + 2] || "", sentenceContext, index);
		return {
			consumed: 2,
			token: {
				surface: `${w1} ${w2}`,
				category: "auxiliary_construction",
				pattern: "-지 않다 (Long Negation)",
				lexical: {
					text: baseVerb,
					pos: vUnit ? vUnit[DATA_SCHEMA.PartofSpeech] : "Verb",
					unit: vUnit,
					missing: !vUnit,
					gloss: vUnit ? vUnit[DATA_SCHEMA.English] : ""
				},
				grammar: [
					{ text: "-지 않다", pos: "Grammar Pattern", unit: gUnit, gloss: gUnit ? gUnit[DATA_SCHEMA.English] : "to not do/be" },
					...((a2 && a2.grammar) || [])
				]
			}
		};
	}

	// 5. -(으)ㄹ/ㄴ/는 것 같다 (Grammar ID 1638 + 581)
	if ((cleanW2 === "것" || cleanW2 === "거") && cleanW3 && cleanW3.startsWith("같")) {
		const a1 = analyzeSingleToken(w1, prevW1, w2, sentenceContext, index);
		const gatUnit = unitById.get(1638);
		const geodUnit = unitById.get(581);
		const endObj = resolveAuxiliaryEnding(cleanW3, unitById);
		return {
			consumed: 3,
			token: {
				surface: `${w1} ${w2} ${w3}`,
				category: "auxiliary_construction",
				pattern: "-(으)ㄹ 것 같다 (It seems like / looks like)",
				lexical: a1 ? a1.lexical : null,
				grammar: [
					{ text: "것", pos: "Bound Noun", unit: geodUnit, gloss: "bound noun 'thing' (ID 581)" },
					{ text: "같다", pos: "Descriptive Verb", unit: gatUnit, gloss: "similar, like (ID 1638)" },
					...(endObj ? [endObj] : [])
				]
			}
		};
	}

	// 6. -는 중이다 (Grammar ID 931)
	if ((w1.endsWith("는") || w1.endsWith("은")) && cleanW2.startsWith("중")) {
		const gUnit = unitById.get(931);
		const a1 = analyzeSingleToken(w1, prevW1, w2, sentenceContext, index);
		const endObj = resolveAuxiliaryEnding(cleanW2, unitById);
		return {
			consumed: 2,
			token: {
				surface: `${w1} ${w2}`,
				category: "auxiliary_construction",
				pattern: "-는 중이다 (In the middle of doing)",
				lexical: a1 ? a1.lexical : null,
				grammar: [
					{ text: "-는 중이다", pos: "Grammar Pattern", unit: gUnit, gloss: gUnit ? gUnit[DATA_SCHEMA.English] : "in the middle of doing" },
					...(endObj ? [endObj] : [])
				]
			}
		};
	}

	// 7. -고 싶어하다 (ID 1625) vs. -고 싶다 (ID 417)
	if (w1.endsWith("고")) {
		if (cleanW2.startsWith("싶어했") || cleanW2.startsWith("싶어하")) {
			const gUnit = unitById.get(1625);
			const a1 = analyzeSingleToken(w1, prevW1, w2, sentenceContext, index);
			return {
				consumed: 2,
				token: {
					surface: `${w1} ${w2}`,
					category: "auxiliary_construction",
					pattern: "-고 싶어하다 (Want to do - 3rd person)",
					lexical: a1 ? a1.lexical : null,
					grammar: [
						{ text: "-고 싶어하다", pos: "Grammar Pattern", unit: gUnit, gloss: gUnit ? gUnit[DATA_SCHEMA.English] : "want to do" },
						{ text: "-았/었-", pos: "Tense Infix", unit: unitById.get(335), gloss: "past tense (ID 335)" },
						{ text: "-습니다", pos: "Verb Ending", unit: unitById.get(50), gloss: "formal declarative (ID 50)" }
					],
					disambiguation: {
						resolved: true,
						target: "-고 싶어하다 (ID 1625)",
						rule: "Third-person psychological predicate frame '{VP}\\+고\\s+싶어하' matched auxiliary '싶어하다'"
					}
				}
			};
		}
		if (cleanW2.startsWith("싶")) {
			const gUnit = unitById.get(417);
			const a1 = analyzeSingleToken(w1, prevW1, w2, sentenceContext, index);
			const endObj = resolveAuxiliaryEnding(cleanW2, unitById);
			return {
				consumed: 2,
				token: {
					surface: `${w1} ${w2}`,
					category: "auxiliary_construction",
					pattern: "-고 싶다 (Want to do)",
					lexical: a1 ? a1.lexical : null,
					grammar: [
						{ text: "~고 싶다", pos: "Grammar Pattern", unit: gUnit, gloss: gUnit ? gUnit[DATA_SCHEMA.English] : "want to" },
						...(endObj ? [endObj] : [])
					]
				}
			};
		}
	}

	// 8. -(으)려고 하다 (ID 816 + 158)
	if ((w1.endsWith("려고") || w1.endsWith("으려고")) && (cleanW2.startsWith("합") || cleanW2.startsWith("하"))) {
		const a1 = analyzeSingleToken(w1, prevW1, w2, sentenceContext, index);
		return {
			consumed: 2,
			token: {
				surface: `${w1} ${w2}`,
				category: "auxiliary_construction",
				pattern: "-(으)려고 하다 (Intend to do)",
				lexical: a1 ? a1.lexical : null,
				grammar: [
					{ text: "-(으)려고", pos: "Grammar Pattern", unit: unitById.get(816), gloss: "in order to (ID 816)" },
					{ text: "하다", pos: "Auxiliary Verb", unit: unitById.get(158), gloss: "to do (auxiliary, ID 158)" },
					{ text: "-ㅂ니다", pos: "Verb Ending", unit: unitById.get(50), gloss: "formal declarative (ID 50)" }
				]
			}
		};
	}

	// 9. -(으)ㄹ 수 있다 / 없다 (ID 522 / 523)
	if ((cleanW2 === "수" || cleanW2 === "수도") && cleanW3 && (cleanW3.startsWith("있") || cleanW3.startsWith("없"))) {
		const isNegative = cleanW3.startsWith("없");
		const gUnit = unitById.get(isNegative ? 523 : 522);
		const a1 = analyzeSingleToken(w1, prevW1, w2, sentenceContext, index);
		const endObj = resolveAuxiliaryEnding(cleanW3, unitById);
		const gList = [
			{ text: isNegative ? "-(으)ㄹ 수 없다" : "-(으)ㄹ 수 있다", pos: "Grammar Pattern", unit: gUnit, gloss: gUnit ? gUnit[DATA_SCHEMA.English] : (isNegative ? "cannot do" : "can do") }
		];
		if (cleanW2 === "수도") {
			gList.push({ text: "도", pos: "Particle", unit: unitById.get(366), gloss: "also/too (ID 366)" });
		}
		if (endObj) gList.push(endObj);
		return {
			consumed: 3,
			token: {
				surface: `${w1} ${w2} ${w3}`,
				category: "auxiliary_construction",
				pattern: isNegative ? "-(으)ㄹ 수 없다 (Cannot do)" : "-(으)ㄹ 수 있다 (Can do)",
				lexical: a1 ? a1.lexical : null,
				grammar: gList
			}
		};
	}

	// 10. -(으)면 좋겠다 (Grammar ID 1646)
	if ((w1.endsWith("면") || w1.endsWith("으면") || w1.endsWith("하면")) && cleanW2.startsWith("좋겠")) {
		const gUnit = unitById.get(1646);
		const a1 = analyzeSingleToken(w1, prevW1, w2, sentenceContext, index);
		const endObj = resolveAuxiliaryEnding(cleanW2, unitById);
		return {
			consumed: 2,
			token: {
				surface: `${w1} ${w2}`,
				category: "auxiliary_construction",
				pattern: "-(으)면 좋겠다 (I wish/hope that)",
				lexical: a1 ? a1.lexical : null,
				grammar: [
					{ text: "-(으)면 좋겠다", pos: "Grammar Pattern", unit: gUnit, gloss: gUnit ? gUnit[DATA_SCHEMA.English] : "I wish that" },
					...(endObj ? [endObj] : [])
				]
			}
		};
	}

	// 11. -(으)ㄹ 때 (Grammar ID 855)
	if (cleanW2.startsWith("때") && isAdnominalL(w1)) {
		const gUnit = unitById.get(855);
		const a1 = analyzeSingleToken(w1, prevW1, w2, sentenceContext, index);
		const particleMatch = cleanW2.match(/때(가|는|에|도)$/);
		const pText = particleMatch ? particleMatch[1] : null;
		const pSpec = pText ? PARTICLE_SPECS.find(p => p.text === pText) : null;
		const pUnit = pSpec && pSpec.ids[0] ? unitById.get(pSpec.ids[0]) : null;
		const gList = [
			{ text: "-(으)ㄹ 때", pos: "Grammar Pattern", unit: gUnit, gloss: gUnit ? gUnit[DATA_SCHEMA.English] : "when doing" }
		];
		if (pUnit) {
			gList.push({ text: pText, pos: "Particle", unit: pUnit, gloss: pUnit[DATA_SCHEMA.English] });
		}
		return {
			consumed: 2,
			token: {
				surface: `${w1} ${w2}`,
				category: "auxiliary_construction",
				pattern: "-(으)ㄹ 때 (When doing / during)",
				lexical: a1 ? a1.lexical : null,
				grammar: gList
			}
		};
	}

	// 12. 전화 드리다 (ID 599)
	if (w1 === "전화" && cleanW2.startsWith("드리")) {
		const vUnit = unitById.get(599);
		const a2 = analyzeSingleToken(w2, w1, rawWords[i + 2] || "", sentenceContext, index);
		return {
			consumed: 2,
			token: {
				surface: `${w1} ${w2}`,
				category: "auxiliary_construction",
				pattern: "전화드리다 (To call - honorific)",
				lexical: { text: "전화드리다", pos: "Action Verb", unit: vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "to call (honorific)" },
				grammar: (a2 && a2.grammar) || []
			}
		};
	}

	// 13. -아/어 주다 / 드리다 (Benefactive Auxiliary ID 322 / 591)
	if (isInformalConnective(w1) && (cleanW2.startsWith("주") || cleanW2.startsWith("줘") || cleanW2.startsWith("드리"))) {
		const a1 = analyzeSingleToken(w1, prevW1, w2, sentenceContext, index);
		const isHonorific = cleanW2.startsWith("드리");
		const auxVerb = isHonorific ? unitById.get(591) : unitById.get(322);
		const a2 = analyzeSingleToken(w2, w1, rawWords[i + 2] || "", sentenceContext, index);
		return {
			consumed: 2,
			token: {
				surface: `${w1} ${w2}`,
				category: "auxiliary_construction",
				pattern: isHonorific ? "-아/어 드리다 (Do for someone - honorific)" : "-아/어 주다 (Do for someone)",
				lexical: a1 ? a1.lexical : null,
				grammar: [
					{ text: isHonorific ? "-아/어 드리다" : "-아/어 주다", pos: "Auxiliary Verb", unit: auxVerb, gloss: auxVerb ? auxVerb[DATA_SCHEMA.English] : "to give/do for" },
					...((a2 && a2.grammar) || [])
				]
			}
		};
	}

	// 14. -아/어 보다 (Auxiliary Verb ID 879: Trial / Experience)
	if (isInformalConnective(w1) && (cleanW2.startsWith("보") || cleanW2.startsWith("봐") || cleanW2 === "본" || cleanW2.startsWith("봤"))) {
		const a1 = analyzeSingleToken(w1, prevW1, w2, sentenceContext, index);
		const auxVerb = unitById.get(879);
		const a2 = analyzeSingleToken(w2, w1, rawWords[i + 2] || "", sentenceContext, index);
		return {
			consumed: 2,
			token: {
				surface: `${w1} ${w2}`,
				category: "auxiliary_construction",
				pattern: "-아/어 보다 (Try doing / experience)",
				lexical: a1 ? a1.lexical : null,
				grammar: [
					{ text: "-아/어 보다", pos: "Auxiliary Verb", unit: auxVerb, gloss: auxVerb ? auxVerb[DATA_SCHEMA.English] : "to try doing / experience" },
					...((a2 && a2.grammar) || [])
				]
			}
		};
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
