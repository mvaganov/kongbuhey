/**
 * korean/analyzer/verb_morphology.js
 *
 * Declarative Verb and Adnominal Suffix Deconstructor Engine.
 * Handles irregular stems (ㅂ, ㄷ, 르, ㅡ), honorifics, tense infixes,
 * inchoatives (-아/어지다), and adnominal participles.
 *
 * Platform: Node.js & Browser (Vanilla JS, zero dependencies).
 */
const { DATA_SCHEMA, decomposeHangul, composeHangul, setFinal, hasBatchim } =
	(typeof require !== 'undefined' ? require('../core/primitives.js') : window);
const { VERB_SUFFIX_RULES } =
	(typeof require !== 'undefined' ? require('./verb_suffix_rules.js') : window);


/**
 * Matches conjugated verb ending patterns and recovers the underlying dictionary stem.
 * 
 * @param {string} word The Korean word/token to match
 * @param {string} prevWord Preceding word for context
 * @param {string} nextWord Succeeding word for context
 * @param {Object} index Fast lookup index
 * @param {Function} evaluateSyntaxFrameFn Evaluator function for SyntaxFrame
 * @returns {Object|null} Analysis object or null if no verb match
 */
function matchVerbSuffix(word, prevWord = "", nextWord = "", index, evaluateSyntaxFrameFn) {
	const vocabByKo = index.vocabByKo;
	const unitById = index.unitById;
	for (const rule of VERB_SUFFIX_RULES) {
		if (word.endsWith(rule.suffix)) {
			let baseVerb = null;
			let isAdnominal = rule.isAdnominal || false;

			if (rule.stemType === 'fixed_base') {
				const root = word.slice(0, -rule.suffix.length);
				baseVerb = root ? root + rule.baseVerb : rule.baseVerb;
			} else if (rule.stemType === 'hada') {
				const root = word.slice(0, -rule.suffix.length);
				baseVerb = root ? root + "하다" : "하다";
			} else if (rule.stemType === 'stem_da') {
				if (word.length <= rule.suffix.length) continue;
				const stem = word.slice(0, -rule.suffix.length);
				const lastChar = stem.slice(-1);
				const d = decomposeHangul(lastChar);
				if (d && d.final === 20 && stem !== "있" && !stem.endsWith("있")) continue; // let past tense rules handle it
				let candidateVerb = stem + "다";
				if ((rule.suffix.includes("세요") || rule.suffix.includes("는데") || rule.suffix.includes("니까") || rule.suffix === "면") && d && d.final === 0) {
					// Check ㄹ-irregular drop (e.g. 썰다 -> 써세요, 팔다 -> 파는데/파니까, 만들다 -> 만드세요, 살다 -> 사세요)
					const lChar = composeHangul(d.initial, d.medial, 8);
					const lVerb = stem.slice(0, -1) + lChar + "다";
					if (!vocabByKo.has(candidateVerb) && vocabByKo.has(lVerb)) {
						candidateVerb = lVerb;
					}
				}
				if ((rule.suffix.includes("았") || rule.suffix.includes("었")) && d && d.final === 8) {
					// Check 르-irregular drop (e.g. 고르다 -> 골랐습니다, 모르다 -> 몰랐습니다, 다르다 -> 달랐습니다)
					const strippedChar = setFinal(lastChar, 0);
					const reuVerb = stem.slice(0, -1) + strippedChar + "르다";
					if (!vocabByKo.has(candidateVerb) && vocabByKo.has(reuVerb)) {
						candidateVerb = reuVerb;
					}
				}
				baseVerb = candidateVerb;
			} else if (rule.stemType === 'copula_l_kkayo' || rule.stemType === 'copula_inikka') {
				if (word.length <= rule.suffix.length) continue;
				const stem = word.slice(0, -rule.suffix.length);
				const sUnits = vocabByKo.get(stem) || [];
				const nounUnits = sUnits.filter(u => u[DATA_SCHEMA.PartofSpeech] === 'Noun' || u[DATA_SCHEMA.PartofSpeech] === 'Pronoun');
				if (nounUnits.length > 0) {
					const nUnit = nounUnits[0];
					return {
						surface: word,
						category: "noun_copula",
						lexical: { text: stem, pos: nUnit[DATA_SCHEMA.PartofSpeech], unit: nUnit, missing: false, gloss: nUnit[DATA_SCHEMA.English] },
						grammar: rule.grammar.map(g => ({
							text: g.text,
							pos: g.pos,
							unit: unitById.get(g.id) || null,
							missing: !unitById.has(g.id),
							gloss: g.gloss
						})),
						disambiguation: null
					};
				}
			} else if (rule.stemType === 'stem_open_polite') {
				if (word.length < 2) continue;
				const stem = word.slice(0, -1);
				const lastChar = stem.slice(-1);
				const d = decomposeHangul(lastChar);
				if (d && d.final === 0) {
					const baseCandidate = stem + "다";
					if (vocabByKo.has(baseCandidate)) {
						const vUnits = (vocabByKo.get(baseCandidate) || []).filter(u => u[DATA_SCHEMA.PartofSpeech] === 'Action Verb' || u[DATA_SCHEMA.PartofSpeech] === 'Descriptive Verb');
						if (vUnits.length > 0) {
							baseVerb = baseCandidate;
						}
					}
				}
			} else if (rule.stemType === 'stem_inchoative_past_cond') {
				if (word.length <= rule.suffix.length) continue;
				const stemBefore = word.slice(0, -rule.suffix.length); // e.g. '많아'
				if (stemBefore.endsWith("아") || stemBefore.endsWith("어")) {
					const rootStem = stemBefore.slice(0, -1);
					const candVerb = rootStem + "다";
					if (vocabByKo.has(candVerb)) {
						baseVerb = candVerb;
					}
				}
			} else if (rule.stemType === 'stem_l_kkayo') {
				if (word.length <= rule.suffix.length) continue;
				const stemBefore = word.slice(0, -rule.suffix.length);
				const prevChar = stemBefore.slice(-1);
				const d = decomposeHangul(prevChar);
				if (d && d.final === 8) { // ㄹ batchim (e.g. 볼까요 -> 보다, 갈까요 -> 가다)
					const stripped = setFinal(prevChar, 0);
					const stem = stemBefore.slice(0, -1) + stripped;
					let candidateVerb = stem + "다";
					if (!vocabByKo.has(candidateVerb)) {
						const lVerb = stemBefore + "다";
						if (vocabByKo.has(lVerb)) candidateVerb = lVerb;
					}
					baseVerb = candidateVerb;
				} else {
					continue;
				}
			} else if (rule.stemType === 'stem_consonant_polite') {
				const stem = word.slice(0, -rule.suffix.length);
				if (stem.length < 1) continue;
				const lastChar = stem.slice(-1);
				if (!hasBatchim(lastChar)) continue;
				const baseCandidate = stem + "다";
				if (vocabByKo.has(baseCandidate)) {
					baseVerb = baseCandidate;
				} else {
					continue;
				}
			} else if (rule.stemType === 'stem_gi_da') {
				if (word.length <= rule.suffix.length) continue;
				baseVerb = word.slice(0, -rule.suffix.length) + "기다";
			} else if (rule.stemType === 'hada_informal') {
				const root = word.slice(0, -rule.suffix.length);
				baseVerb = root ? root + "하다" : "하다";
			} else if (rule.stemType === 'honorific_adnominal') {
				if (word.length <= rule.suffix.length) continue;
				const root = word.slice(0, -1);
				baseVerb = root + "다";
				isAdnominal = true;
			} else if (rule.stemType === 'honorific_past_adnominal') {
				if (word.length <= rule.suffix.length) continue;
				const root = word.slice(0, -rule.suffix.length);
				let candVerb = root + "다";
				if (!vocabByKo.has(candVerb) && root.endsWith("으")) {
					candVerb = root.slice(0, -1) + "다";
				}
				if (vocabByKo.has(candVerb)) {
					baseVerb = candVerb;
					isAdnominal = true;
				}
			} else if (rule.stemType === 'trial_past_adnominal') {
				if (word.length <= rule.suffix.length) continue;
				const root = word.slice(0, -1);
				baseVerb = (root === "해" || root.endsWith("해")) ? root.slice(0, -1) + "하다" : root + "다";
				isAdnominal = true;
			} else if (rule.stemType === 'stem_b_irregular') {
				const stemWithoutSuffix = word.slice(0, -rule.suffix.length);
				if (stemWithoutSuffix.length < 1) continue;
				const lastChar = stemWithoutSuffix.slice(-1);
				const d = decomposeHangul(lastChar);
				if (d && d.final === 0) { // open vowel (e.g. 어려, 반가, 고마, 쉬)
					const bChar = composeHangul(d.initial, d.medial, 17); // attach ㅂ coda (종성 17 = ㅂ)
					baseVerb = stemWithoutSuffix.slice(0, -1) + bChar + "다";
				} else {
					continue;
				}
			} else if (rule.stemType === 'stem_b_irregular_inchoative') {
				const stemWithoutSuffix = word.slice(0, -rule.suffix.length);
				if (stemWithoutSuffix.length < 1) continue;
				const lastChar = stemWithoutSuffix.slice(-1);
				const d = decomposeHangul(lastChar);
				if (d && d.final === 0) {
					const bChar = composeHangul(d.initial, d.medial, 17);
					baseVerb = stemWithoutSuffix.slice(0, -1) + bChar + "다";
				} else {
					continue;
				}
			} else if (rule.stemType === 'stem_b_nida') {
				if (word.length <= rule.suffix.length) continue;
				const stemWithB = word.slice(0, -rule.suffix.length);
				const lastChar = stemWithB.slice(-1);
				const d = decomposeHangul(lastChar);
				if (d && d.final === 17) { // ㅂ batchim
					// Candidate 1: ㄹ-irregular (듭니다 -> 들다, 압니다 -> 알다)
					const lChar = composeHangul(d.initial, d.medial, 8);
					const lVerb = stemWithB.slice(0, -1) + lChar + "다";
					// Candidate 2: Open stem (갑니다 -> 가다, 봅니다 -> 보다)
					const strippedChar = setFinal(lastChar, 0);
					const openVerb = stemWithB.slice(0, -1) + strippedChar + "다";
					if (vocabByKo.has(lVerb)) {
						baseVerb = lVerb;
					} else if (vocabByKo.has(openVerb)) {
						baseVerb = openVerb;
					}
				} else {
					continue;
				}
			} else if (rule.stemType === 'stem_eu_irregular') {
				const lastChar = word.slice(-1);
				const d = decomposeHangul(lastChar);
				if (d && d.medial === 4 && d.final === 0) { // ㅓ vowel (써 -> 쓰다, 꺼 -> 끄다, 커 -> 크다)
					const euChar = composeHangul(d.initial, 18, 0);
					const cand = word.slice(0, -1) + euChar + "다";
					if (vocabByKo.has(cand)) {
						baseVerb = cand;
					}
				} else {
					continue;
				}
			} else if (rule.stemType === 'stem_reu_past') {
				const stem = word.slice(0, -rule.suffix.length);
				if (stem.length >= 1) {
					const lastChar = stem.slice(-1);
					const strippedChar = setFinal(lastChar, 0);
					const candReu = stem.slice(0, -1) + strippedChar + "르다";
					if (vocabByKo.has(candReu)) {
						baseVerb = candReu;
					}
				}
			} else if (rule.stemType === 'stem_reu_present') {
				const stem = word.slice(0, -rule.suffix.length);
				if (stem.length >= 1) {
					const lastChar = stem.slice(-1);
					const d = decomposeHangul(lastChar);
					if (d && d.final === 8) { // ㄹ batchim (몰라요 -> 모르다, 골라요 -> 고르다, 불러요 -> 부르다)
						const strippedChar = setFinal(lastChar, 0);
						const candReu = stem.slice(0, -1) + strippedChar + "르다";
						if (vocabByKo.has(candReu)) {
							baseVerb = candReu;
						}
					}
				}
			} else if (rule.stemType === 'stem_past_contracted') {
				const stemWithFinal = word.slice(0, -rule.suffix.length);
				if (stemWithFinal.length < 1) continue;
				const lastChar = stemWithFinal.slice(-1);
				const d = decomposeHangul(lastChar);
				if (d && d.final === 20 && stemWithFinal !== "있" && !stemWithFinal.endsWith("있")) { // ㅆ batchim, excluding root '있'
					if (d.medial === 6) { // ㅕ + ㅆ (contracted from ㅣ + 었, e.g. 생겼으면 -> 생기다, 마셨으면 -> 마시다)
						const iChar = composeHangul(d.initial, 20, 0);
						const candI = stemWithFinal.slice(0, -1) + iChar + "다";
						baseVerb = vocabByKo.has(candI) ? candI : stemWithFinal.slice(0, -1) + setFinal(lastChar, 0) + "다";
					} else if (d.medial === 9) { // ㅘ + ㅆ (contracted from ㅗ + 았, e.g. 왔으면 -> 오다, 봤으면 -> 보다)
						const oChar = composeHangul(d.initial, 8, 0);
						const candO = stemWithFinal.slice(0, -1) + oChar + "다";
						baseVerb = vocabByKo.has(candO) ? candO : stemWithFinal.slice(0, -1) + setFinal(lastChar, 0) + "다";
					} else {
						baseVerb = stemWithFinal.slice(0, -1) + setFinal(lastChar, 0) + "다";
					}
				} else {
					continue;
				}
			} else if (rule.stemType === 'stem_consonant_informal') {
				const stem = word.slice(0, -rule.suffix.length);
				if (stem.length < 1 || !hasBatchim(stem.slice(-1))) continue;
				baseVerb = stem + "다";
			} else if (rule.stemType === 'hada_or_particle') {
				const root = word.slice(0, -rule.suffix.length);
				const candidateVerb = root ? root + "하다" : "하다";
				const hasVerb = vocabByKo.has(candidateVerb);
				const hasNoun = root && vocabByKo.has(root);

				const evalContext = { tokenSurface: word, isVerbStem: hasVerb, isNounStem: hasNoun, prevWord, nextWord };
				const connectiveUnit = unitById.get(336);
				const particleUnit = unitById.get(367);
				const evalConnective = evaluateSyntaxFrameFn ? evaluateSyntaxFrameFn(connectiveUnit, evalContext, index) : { score: 1.0 };
				const evalParticle = evaluateSyntaxFrameFn ? evaluateSyntaxFrameFn(particleUnit, evalContext, index) : { score: 0.0 };

				if (evalConnective.score > evalParticle.score && hasVerb) {
					baseVerb = candidateVerb;
				} else {
					continue;
				}
			}

			if (baseVerb) {
				const vUnits = vocabByKo.get(baseVerb) || [];
				const vUnit = vUnits.length > 0 ? vUnits[0] : null;

				if (baseVerb.startsWith("안") && !vUnit) {
					continue;
				}

				if (!vUnit && !baseVerb.endsWith("하다") && rule.suffix.length < 2) {
					continue;
				}

				if ((rule.suffix.includes("시") || rule.suffix.includes("신")) && !vUnit) {
					continue;
				}

				const pos = vUnit ? vUnit[DATA_SCHEMA.PartofSpeech] : "Action Verb";
				const grammarList = rule.grammar.map(g => {
					const u = unitById.get(g.id) || null;
					return {
						text: g.text,
						pos: g.pos,
						unit: u,
						missing: !u,
						gloss: g.gloss || (u ? u[DATA_SCHEMA.English] : g.text)
					};
				});

				return {
					surface: word,
					category: isAdnominal ? "adnominal_modifier" : "conjugated_verb",
					lexical: {
						text: baseVerb,
						pos,
						unit: vUnit,
						missing: !vUnit,
						gloss: vUnit ? vUnit[DATA_SCHEMA.English] : ""
					},
					grammar: grammarList,
					disambiguation: rule.stemType === 'hada_or_particle' ? {
						resolved: true,
						target: `${baseVerb} + -고 (ID 336)`,
						rule: "Satisfies verb connective frame over nominal particle"
					} : null
				};
			}
		}
	}

	// Open-stem -ㅂ니다 (e.g. 갑니다, 옵니다, 봅니다, 배웁니다)
	if (word.endsWith("니다") && word.length >= 3) {
		const stemWithFinal = word.slice(0, -2);
		const lastChar = stemWithFinal.slice(-1);
		const d = decomposeHangul(lastChar);
		if (d && d.final === 17) {
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

	// Contracted open-stem verbs + -서 (e.g. 가서, 만나서, 와서, 봐서, 배워서, 마셔서)
	if (word.endsWith("서") && word.length >= 2) {
		const stemChar = word.slice(-2, -1);
		let candidateStems = [word.slice(0, -1)];
		const d = decomposeHangul(stemChar);
		if (d) {
			if (d.medial === 9) candidateStems.push(word.slice(0, -2) + composeHangul(d.initial, 8, 0));
			else if (d.medial === 14) candidateStems.push(word.slice(0, -2) + composeHangul(d.initial, 13, 0));
			else if (d.medial === 6) candidateStems.push(word.slice(0, -2) + composeHangul(d.initial, 20, 0));
			else if (d.medial === 4 && d.final === 0) candidateStems.push(word.slice(0, -2) + composeHangul(d.initial, 18, 0)); // ㅡ-irregular (e.g. 써서 -> 쓰다, 떠서 -> 뜨다, 꺼서 -> 끄다)
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

	// Contracted open-stem verbs + bare connective/informal -아/어 (e.g. 보여 -> 보이다, 마셔 -> 마시다)
	if (word.length >= 1) {
		const lastChar = word.slice(-1);
		const d = decomposeHangul(lastChar);
		if (d && d.medial === 6 && d.final === 0) { // medial ㅕ without batchim (ㅣ + ㅓ -> ㅕ)
			const iChar = composeHangul(d.initial, 20, 0);
			const baseVerb = word.slice(0, -1) + iChar + "다";
			const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
			if (vUnit) {
				return {
					surface: word,
					category: "conjugated_verb",
					lexical: { text: baseVerb, pos: vUnit[DATA_SCHEMA.PartofSpeech], unit: vUnit, missing: false, gloss: vUnit[DATA_SCHEMA.English] },
					grammar: [{ text: "-아/어", pos: "Verb Ending", unit: unitById.get(459), gloss: "informal / sequential (ID 459)" }]
				};
			}
		} else if (d && d.medial === 1 && d.final === 0) { // medial ㅐ without batchim (보내 -> 보내다)
			const baseVerb = word + "다";
			const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
			if (vUnit) {
				return {
					surface: word,
					category: "conjugated_verb",
					lexical: { text: baseVerb, pos: vUnit[DATA_SCHEMA.PartofSpeech], unit: vUnit, missing: false, gloss: vUnit[DATA_SCHEMA.English] },
					grammar: [{ text: "-아/어", pos: "Verb Ending", unit: unitById.get(459), gloss: "informal / sequential (ID 459)" }]
				};
			}
		}
	}

	// Interrogative open/ㄹ-irregular stem + -ㄴ가요 (e.g. 힘든가요 -> 힘들다, 큰가요 -> 크다)
	if (word.endsWith("가요") && word.length >= 3) {
		const stemWithN = word.slice(0, -2);
		const lastChar = stemWithN.slice(-1);
		const d = decomposeHangul(lastChar);
		if (d && d.final === 4) { // ㄴ batchim
			const stripped = setFinal(lastChar, 0);
			const candOpen = stemWithN.slice(0, -1) + stripped + "다";
			const candL = stemWithN.slice(0, -1) + composeHangul(d.initial, d.medial, 8) + "다"; // attach ㄹ batchim
			let baseVerb = null;
			if (vocabByKo.has(candL)) baseVerb = candL;
			else if (vocabByKo.has(candOpen)) baseVerb = candOpen;

			if (baseVerb) {
				const vUnit = vocabByKo.get(baseVerb)[0];
				return {
					surface: word,
					category: "conjugated_verb",
					lexical: { text: baseVerb, pos: vUnit[DATA_SCHEMA.PartofSpeech], unit: vUnit, gloss: vUnit[DATA_SCHEMA.English] },
					grammar: [{ text: "-(으)ㄴ가요", pos: "Verb Ending", unit: unitById.get(932), gloss: "polite interrogative (ID 932)" }]
				};
			}
		}
	}

	return null;
}

/**
 * Matches adnominal participle forms (~한, ~은, ~는, ~(으)ㄴ, ~(으)ㄹ).
 * 
 * @param {string} word The Korean word to analyze
 * @param {Object} index Fast lookup index
 * @returns {Object|null} Analysis object or null
 */
function matchAdnominalEnding(word, index) {
	const vocabByKo = index.vocabByKo;
	const unitById = index.unitById;

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
	if (word.endsWith("할")) {
		const baseVerb = word.slice(0, -1) + "하다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "adnominal_modifier",
			lexical: { text: baseVerb, pos: vUnit ? vUnit[DATA_SCHEMA.PartofSpeech] : "Descriptive Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" },
			grammar: [{ text: "-(으)ㄹ", pos: "Adnominal Ending", unit: unitById.get(646), gloss: "prospective adnominal (ID 646)" }]
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
			let baseVerb = stem + "다";
			const vUnits = vocabByKo.get(baseVerb) || [];
			let vUnit = vUnits.length > 0 ? vUnits[0] : null;
			if (stem === "부지") {
				baseVerb = "부치다";
				const cookingUnit = (vocabByKo.get("부치다") || []).find(u => u[DATA_SCHEMA.Id] === 1658);
				vUnit = cookingUnit || vUnit;
			}
			if (vUnit && (vUnit[DATA_SCHEMA.PartofSpeech] === 'Action Verb' || vUnit[DATA_SCHEMA.PartofSpeech] === 'Descriptive Verb')) {
				return {
					surface: word,
					category: "adnominal_modifier",
					lexical: { text: baseVerb, pos: vUnit[DATA_SCHEMA.PartofSpeech], unit: vUnit, missing: false, gloss: vUnit[DATA_SCHEMA.English] },
					grammar: [{ text: "-(으)ㄴ", pos: "Adnominal Ending", unit: unitById.get(644), gloss: "adnominal modifier (ID 644)" }]
				};
			}
		}
		if (d && d.final === 8) { // ㄹ batchim (prospective/future adnominal -(으)ㄹ, e.g. 할, 갈, 놀, 쓸, 지루할)
			// Candidate 1: Base stem already ends in ㄹ (놀다, 살다, 알다, 만들다)
			const lBaseVerb = word + "다";
			const lUnits = vocabByKo.get(lBaseVerb) || [];
			const lUnit = lUnits.find(u => u[DATA_SCHEMA.PartofSpeech] === 'Action Verb' || u[DATA_SCHEMA.PartofSpeech] === 'Descriptive Verb') || null;

			// Candidate 2: Open stem + ㄹ (할 -> 하다, 갈 -> 가다, 쓸 -> 쓰다, 볼 -> 보다)
			const strippedChar = setFinal(word.slice(-1), 0);
			const stem = word.slice(0, -1) + strippedChar;
			const openBaseVerb = stem + "다";
			const openUnits = vocabByKo.get(openBaseVerb) || [];
			const openUnit = openUnits.find(u => u[DATA_SCHEMA.PartofSpeech] === 'Action Verb' || u[DATA_SCHEMA.PartofSpeech] === 'Descriptive Verb') || null;

			let chosenVerb = null;
			let chosenUnit = null;
			if (lUnit && openUnit) {
				const lScore = lUnit[DATA_SCHEMA.PriorityScore] ?? 99;
				const openScore = openUnit[DATA_SCHEMA.PriorityScore] ?? 99;
				if (openScore < lScore) {
					chosenVerb = openBaseVerb;
					chosenUnit = openUnit;
				} else {
					chosenVerb = lBaseVerb;
					chosenUnit = lUnit;
				}
			} else if (lUnit) {
				chosenVerb = lBaseVerb;
				chosenUnit = lUnit;
			} else if (openUnit) {
				chosenVerb = openBaseVerb;
				chosenUnit = openUnit;
			}

			if (chosenUnit) {
				return {
					surface: word,
					category: "adnominal_modifier",
					lexical: { text: chosenVerb, pos: chosenUnit[DATA_SCHEMA.PartofSpeech], unit: chosenUnit, missing: false, gloss: chosenUnit[DATA_SCHEMA.English] },
					grammar: [{ text: "-(으)ㄹ", pos: "Adnominal Ending", unit: unitById.get(646), gloss: "prospective adnominal (ID 646)" }]
				};
			}
		}

		// Case C: Consonant stem + 을 (e.g. 있을, 없을, 먹을, 들을, 작을, 많을)
		if (word.endsWith("을") && word.length >= 2) {
			const rawStem = word.slice(0, -1);
			let baseVerb = rawStem + "다";
			if (rawStem === "들") baseVerb = "듣다"; // ㄷ-irregular
			else if (rawStem === "걸") baseVerb = "걷다";

			// Check past tense infix -았/었- before prospective adnominal -(으)ㄹ (e.g. 샀을, 먹었을, 갔을, 봤을, 했을)
			let pastInfixUnit = null;
			if (!vocabByKo.has(baseVerb) && rawStem !== "있" && !rawStem.endsWith("있")) {
				const lastChar = rawStem.slice(-1);
				const d = decomposeHangul(lastChar);
				if (d && d.final === 20) { // ㅆ batchim
					const strippedChar = setFinal(lastChar, 0);
					if (strippedChar === "아" || strippedChar === "어") {
						const candRoot = rawStem.slice(0, -1) + "다";
						if (vocabByKo.has(candRoot)) {
							baseVerb = candRoot;
							pastInfixUnit = unitById.get(335);
						}
					} else if (d.medial === 0) { // ㅏ + ㅆ (contracted from ㅏ + 았, e.g. 샀을 -> 사다, 갔을 -> 가다)
						const openChar = composeHangul(d.initial, 0, 0);
						const candOpen = rawStem.slice(0, -1) + openChar + "다";
						if (vocabByKo.has(candOpen)) {
							baseVerb = candOpen;
							pastInfixUnit = unitById.get(335);
						}
					} else if (d.medial === 8) { // ㅗ + ㅆ (e.g. 봤을 -> 보다, 왔을 -> 오다)
						const openChar = composeHangul(d.initial, 8, 0);
						const candOpen = rawStem.slice(0, -1) + openChar + "다";
						if (vocabByKo.has(candOpen)) {
							baseVerb = candOpen;
							pastInfixUnit = unitById.get(335);
						}
					} else if (rawStem.endsWith("했")) { // 했을 -> 하다
						const candHada = rawStem.slice(0, -1) + "하다";
						if (vocabByKo.has(candHada)) {
							baseVerb = candHada;
							pastInfixUnit = unitById.get(335);
						}
					}
				}
			}

			const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
			if (vUnit && (vUnit[DATA_SCHEMA.PartofSpeech] === 'Action Verb' || vUnit[DATA_SCHEMA.PartofSpeech] === 'Descriptive Verb')) {
				const gList = [];
				if (pastInfixUnit) {
					gList.push({ text: "-았/었-", pos: "Tense Infix", unit: pastInfixUnit, gloss: pastInfixUnit[DATA_SCHEMA.English] });
				}
				gList.push({ text: "-(으)ㄹ", pos: "Adnominal Ending", unit: unitById.get(646), gloss: "prospective adnominal (ID 646)" });
				return {
					surface: word,
					category: "adnominal_modifier",
					lexical: { text: baseVerb, pos: vUnit[DATA_SCHEMA.PartofSpeech], unit: vUnit, missing: false, gloss: vUnit[DATA_SCHEMA.English] },
					grammar: gList
				};
			}
		}
	}

	return null;
}

if (typeof window !== 'undefined') {
	window.VERB_SUFFIX_RULES = VERB_SUFFIX_RULES;
	window.matchVerbSuffix = matchVerbSuffix;
	window.matchAdnominalEnding = matchAdnominalEnding;
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		VERB_SUFFIX_RULES,
		matchVerbSuffix,
		matchAdnominalEnding
	};
}
