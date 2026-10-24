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
 * Analyzes a full Korean sentence, parsing multi-word grammar patterns and single tokens.
 * 
 * @param {string} sentText The sentence text
 * @param {number} sentenceIndex 1-based sentence index in passage
 * @param {Object} explicitIndex Optional pre-built index
 * @returns {Object} { sentenceIndex, text: sentText, tokens }
 */
function analyzeSentence(sentText, sentenceIndex = 1, explicitIndex = null) {
	const index = explicitIndex || getIndex();
	const unitById = index.unitById;
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
		const w1 = rawWords[i];
		const w2 = i < rawWords.length - 1 ? rawWords[i + 1] : "";
		const cleanW2 = w2.replace(/[^\w가-힣]+/g, '');

		const d1 = decomposeHangul(w1.slice(-1));
		const isAdnominalN = w1.endsWith("은") || (d1 && d1.final === 4);

		// Multi-word pattern 1: Bound Grammar -(으)ㄴ 후에 (Grammar ID 710)
		if (isAdnominalN && cleanW2 === "후에") {
			const gUnit = unitById.get(710);
			const a1 = analyzeSingleToken(w1, i > 0 ? rawWords[i - 1] : "", w2, sentenceContext, index);
			const evalRes = evaluateSyntaxFrame(gUnit, { isPrecededByAdnominalVerb: true }, index);

			tokens.push({
				surface: `${w1} ${w2}`,
				category: "auxiliary_construction",
				pattern: "-(으)ㄴ 후에 (After doing)",
				lexical: a1 ? a1.lexical : null,
				grammar: [
					{ text: "-(으)ㄴ 후에", pos: "Grammar Pattern", unit: gUnit, gloss: gUnit ? gUnit[DATA_SCHEMA.English] : "after doing" }
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
			const a1 = analyzeSingleToken(w1, i > 0 ? rawWords[i - 1] : "", w2, sentenceContext, index);
			const evalRes = evaluateSyntaxFrame(gUnit, { isPrecededByAdnominalVerb: true }, index);

			tokens.push({
				surface: `${w1} 지`,
				category: "auxiliary_construction",
				pattern: "-(으)ㄴ 지 (Time elapsed since doing)",
				lexical: a1 ? a1.lexical : null,
				grammar: [
					{ text: "-(으)ㄴ 지", pos: "Grammar Pattern", unit: gUnit, gloss: gUnit ? gUnit[DATA_SCHEMA.English] : "time elapsed since" }
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
				const a1 = analyzeSingleToken(w1, i > 0 ? rawWords[i - 1] : "", w2, sentenceContext, index);
				tokens.push({
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
				});
				i += 2;
				continue;
			}
			if (cleanW2.startsWith("싶")) {
				const gUnit = unitById.get(417);
				const a1 = analyzeSingleToken(w1, i > 0 ? rawWords[i - 1] : "", w2, sentenceContext, index);
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
					lexical: a1 ? a1.lexical : null,
					grammar: [
						{ text: "~고 싶다", pos: "Grammar Pattern", unit: gUnit, gloss: gUnit ? gUnit[DATA_SCHEMA.English] : "want to" },
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
				const a1 = analyzeSingleToken(w1, i > 0 ? rawWords[i - 1] : "", w2, sentenceContext, index);
				tokens.push({
					surface: `${w1} ${w2}`,
					category: "auxiliary_construction",
					pattern: "-(으)려고 하다 (Intend to do)",
					lexical: a1 ? a1.lexical : null,
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
		if ((cleanW2 === "수" || cleanW2 === "수도") && i + 2 < rawWords.length) {
			const w3 = rawWords[i + 2];
			const cleanW3 = w3.replace(/[^\w가-힣]+/g, '');
			if (cleanW3.startsWith("있") || cleanW3.startsWith("없")) {
				const isNegative = cleanW3.startsWith("없");
				const gUnit = unitById.get(isNegative ? 523 : 522);
				const a1 = analyzeSingleToken(w1, i > 0 ? rawWords[i - 1] : "", w2, sentenceContext, index);
				let endingDesc = cleanW3.endsWith("는") ? "-는 (Adnominal Ending, ID 645)" :
					cleanW3.endsWith("습니다") ? "-습니다 (Formal declarative, ID 50)" :
					cleanW3.endsWith("어요") ? "-아/어요 (Polite informal, ID 49)" :
					cleanW3.endsWith("고") ? "-고 (Connective, ID 336)" : cleanW3;
				let endingUnit = cleanW3.endsWith("는") ? unitById.get(645) :
					cleanW3.endsWith("습니다") ? unitById.get(50) :
					cleanW3.endsWith("어요") ? unitById.get(49) :
					cleanW3.endsWith("고") ? unitById.get(336) : null;

				const gList = [
					{ text: isNegative ? "-(으)ㄹ 수 없다" : "-(으)ㄹ 수 있다", pos: "Grammar Pattern", unit: gUnit, gloss: gUnit ? gUnit[DATA_SCHEMA.English] : (isNegative ? "cannot do" : "can do") }
				];
				if (cleanW2 === "수도") {
					gList.push({ text: "도", pos: "Particle", unit: unitById.get(366), gloss: "also/too (ID 366)" });
				}
				gList.push({ text: endingDesc.split(' ')[0], pos: "Verb Ending", unit: endingUnit, gloss: endingDesc });

				tokens.push({
					surface: `${w1} ${w2} ${w3}`,
					category: "auxiliary_construction",
					pattern: isNegative ? "-(으)ㄹ 수 없다 (Cannot do)" : "-(으)ㄹ 수 있다 (Can do)",
					lexical: a1 ? a1.lexical : null,
					grammar: gList
				});
				i += 3;
				continue;
			}
		}

		// Multi-word pattern 6: -(으)면 좋겠다 (Grammar ID 1646)
		if ((w1.endsWith("면") || w1.endsWith("으면") || w1.endsWith("하면")) && cleanW2.startsWith("좋겠")) {
			const gUnit = unitById.get(1646);
			const a1 = analyzeSingleToken(w1, i > 0 ? rawWords[i - 1] : "", w2, sentenceContext, index);
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
					{ text: "-(으)면 좋겠다", pos: "Grammar Pattern", unit: gUnit, gloss: gUnit ? gUnit[DATA_SCHEMA.English] : "I wish that" },
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
				const a1 = analyzeSingleToken(w1, i > 0 ? rawWords[i - 1] : "", w2, sentenceContext, index);
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
			const a2 = analyzeSingleToken(w2, w1, i < rawWords.length - 2 ? rawWords[i + 2] : "", sentenceContext, index);
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
		if ((w1.endsWith("해") || w1.endsWith("아") || w1.endsWith("어")) && (cleanW2.startsWith("주") || cleanW2.startsWith("줘") || cleanW2.startsWith("드리"))) {
			const a1 = analyzeSingleToken(w1, i > 0 ? rawWords[i - 1] : "", w2, sentenceContext, index);
			const isHonorific = cleanW2.startsWith("드리");
			const auxVerb = isHonorific ? unitById.get(591) : unitById.get(322); // 드리다 or 주다
			const a2 = analyzeSingleToken(w2, w1, i < rawWords.length - 2 ? rawWords[i + 2] : "", sentenceContext, index);

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
		const res = analyzeSingleToken(w1, prev, next, sentenceContext, index);
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
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		analyzeSentence
	};
}
