/**
 * korean/analyzer/token_analyzer.js
 *
 * Single-Token Morphological Analysis Engine.
 * Decomposes individual orthographic Korean tokens into lexical roots,
 * affixes, particles, copulas, and numbers.
 *
 * Platform: Node.js & Browser (Vanilla JS, zero dependencies).
 */

const { DATA_SCHEMA, decomposeHangul, hasBatchim, getStem } =
	(typeof require !== 'undefined' ? require('../core/primitives.js') : window);

const { PARTICLE_SPECS, findExactParticle, checkBatchimRequirement } =
	(typeof require !== 'undefined' ? require('./particles.js') : window);

const { evaluateSyntaxFrame, disambiguateCandidates } =
	(typeof require !== 'undefined' ? require('./syntax_frame.js') : window);

const { matchVerbSuffix, matchAdnominalEnding } =
	(typeof require !== 'undefined' ? require('./verb_morphology.js') : window);

const { getIndex } =
	(typeof require !== 'undefined' ? require('./indexer.js') : window);

/**
 * Analyzes a single Korean word/token within its sentence context.
 * 
 * @param {string} rawWord The surface token
 * @param {string} prevWord Preceding word in sentence
 * @param {string} nextWord Succeeding word in sentence
 * @param {Object} sentenceContext Contextual sentence metadata (clausePredicate, etc.)
 * @param {Object} explicitIndex Optional pre-built index
 * @returns {Object|null} Decomposed token structure or null
 */
function analyzeSingleToken(rawWord, prevWord = "", nextWord = "", sentenceContext = {}, explicitIndex = null) {
	const word = rawWord.replace(/^[^\w가-힣]+|[^\w가-힣]+$/g, '');
	if (!word) return null;
	if (!/[가-힣]/.test(word)) return null; // Ignore pure ASCII metadata (emails, URLs)

	const index = explicitIndex || getIndex();
	const unitById = index.unitById;
	const vocabByKo = index.vocabByKo;

	// 0.0 Contracted bound noun 것 + case/topic particle: 건 (것은), 게 (것이), 걸 (것을)
	if (word === "건" || word === "게" || word === "걸") {
		const particleText = word === "건" ? "은" : word === "게" ? "이" : "을";
		const pSpec = PARTICLE_SPECS.find(p => p.text === particleText);
		const pUnit = pSpec && pSpec.ids[0] ? unitById.get(pSpec.ids[0]) : null;
		const geodUnit = unitById.get(581);
		return {
			surface: word,
			category: "contracted_bound_noun",
			lexical: { text: "것", pos: "Noun", unit: geodUnit, gloss: "thing (bound noun ID 581)" },
			grammar: [{ text: particleText, pos: "Particle", unit: pUnit, gloss: pUnit ? pUnit[DATA_SCHEMA.English] : particleText }]
		};
	}

	// 0. Standalone particle (e.g. from punctuation or source spacing)
	const exactSpec = (word !== "이" && word !== "하고" && word !== "와") ? findExactParticle(word) : null;
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
		const nUnit = nounUnits.length > 0 ? nounUnits[0] : null;
		const copulaUnit = unitById.get(56);
		return {
			surface: word,
			category: "noun_copula",
			lexical: { text: stem, pos: nUnit ? nUnit[DATA_SCHEMA.PartofSpeech] : "Noun", unit: nUnit, missing: !nUnit, gloss: nUnit ? nUnit[DATA_SCHEMA.English] : "candidate noun (" + stem + ")" },
			grammar: [{ text: "입니다", pos: "Verb Ending", unit: copulaUnit, gloss: copulaUnit ? copulaUnit[DATA_SCHEMA.English] : "is/are (copula ID 56)" }]
		};
	}
	// 0.12 Noun + Polite Informal Copula 이에요 / 예요 (ID 37)
	const copulaPoliteMatch = word.match(/^(.+?)(이에요|예요)$/);
	if (copulaPoliteMatch && copulaPoliteMatch[1].length >= 1) {
		const stem = copulaPoliteMatch[1];
		const ending = copulaPoliteMatch[2];
		const stemUnits = vocabByKo.get(stem) || [];
		const nounUnits = stemUnits.filter(u => u[DATA_SCHEMA.PartofSpeech] === 'Noun' || u[DATA_SCHEMA.PartofSpeech] === 'Pronoun');
		const nUnit = nounUnits.length > 0 ? nounUnits[0] : null;
		if (nUnit || vocabByKo.has(stem)) {
			const copulaUnit = unitById.get(37);
			return {
				surface: word,
				category: "noun_copula",
				lexical: { text: stem, pos: nUnit ? nUnit[DATA_SCHEMA.PartofSpeech] : "Noun", unit: nUnit, missing: !nUnit, gloss: nUnit ? nUnit[DATA_SCHEMA.English] : "candidate noun (" + stem + ")" },
				grammar: [{ text: ending, pos: "Verb Ending", unit: copulaUnit, gloss: copulaUnit ? copulaUnit[DATA_SCHEMA.English] : "is/are (copula ID 37)" }]
			};
		}
	}
	// 0.13 Noun + Plain Informal Copula 이야 / 야 (ID 1833)
	const copulaPlainMatch = word.match(/^(.+?)(이야|야)$/);
	if (copulaPlainMatch && copulaPlainMatch[1].length >= 1) {
		const stem = copulaPlainMatch[1];
		const ending = copulaPlainMatch[2];
		const stemUnits = vocabByKo.get(stem) || [];
		const nounUnits = stemUnits.filter(u => u[DATA_SCHEMA.PartofSpeech] === 'Noun' || u[DATA_SCHEMA.PartofSpeech] === 'Pronoun' || u[DATA_SCHEMA.PartofSpeech] === 'Bound Noun');
		const nUnit = nounUnits.length > 0 ? nounUnits[0] : null;
		if (nUnit || (ending === "이야" && vocabByKo.has(stem))) {
			const copulaUnit = unitById.get(1833);
			return {
				surface: word,
				category: "noun_copula",
				lexical: { text: stem, pos: nUnit ? nUnit[DATA_SCHEMA.PartofSpeech] : "Noun", unit: nUnit, missing: !nUnit, gloss: nUnit ? nUnit[DATA_SCHEMA.English] : "candidate noun (" + stem + ")" },
				grammar: [{ text: ending, pos: "Verb Ending", unit: copulaUnit, gloss: copulaUnit ? copulaUnit[DATA_SCHEMA.English] : "is/are (plain copula ID 1833)" }]
			};
		}
	}
	// 0.15 Noun + Copula Past / Conditional (e.g. 룸메이트였으면, 학생이었으면, 친구였어요, 25만원이었는데)
	const copulaPastMatch = word.match(/^(.+?)(이었으면|였으면|이었습니다|였습니다|이었어요|였어요|이었는데|였는데)$/);
	if (copulaPastMatch) {
		const stem = copulaPastMatch[1];
		const ending = copulaPastMatch[2];
		const stemUnits = vocabByKo.get(stem) || [];
		const nounUnits = stemUnits.filter(u => u[DATA_SCHEMA.PartofSpeech] === 'Noun' || u[DATA_SCHEMA.PartofSpeech] === 'Pronoun');
		let nUnit = nounUnits.length > 0 ? nounUnits[0] : null;
		let isNumeric = false;
		if (!nUnit) {
			const numM = stem.match(/^(\d[\d\*]*(?:[~-]\d+)?)([가-힣]+)$/);
			if (numM) {
				isNumeric = true;
				const cText = numM[2];
				nUnit = (cText === "만원" || cText === "원") ? unitById.get(526) : (vocabByKo.get(cText) ? vocabByKo.get(cText)[0] : null);
			}
		}

		if (nUnit || vocabByKo.has(stem) || isNumeric) {
			const isCond = ending.endsWith("면");
			const isFormal = ending.endsWith("습니다");
			const isNeunde = ending.endsWith("는데");
			const gList = [
				{ text: "이다", pos: "Copula", unit: unitById.get(56), gloss: "copula 'be' (ID 56)" },
				{ text: "-았/었-", pos: "Tense Infix", unit: unitById.get(335), gloss: "past tense (ID 335)" },
				isCond ? { text: "-(으)면", pos: "Verb Ending", unit: unitById.get(619), gloss: "conditional 'if/when' (ID 619)" } :
					isFormal ? { text: "-습니다", pos: "Verb Ending", unit: unitById.get(50), gloss: "formal declarative (ID 50)" } :
						isNeunde ? { text: "-는데", pos: "Verb Ending", unit: unitById.get(620), gloss: "background/contrastive (ID 620)" } :
							{ text: "-아요/어요", pos: "Verb Ending", unit: unitById.get(49), gloss: "polite informal (ID 49)" }
			];

			return {
				surface: word,
				category: "noun_copula_past",
				lexical: { text: stem, pos: isNumeric ? "Number+Counter" : (nUnit ? nUnit[DATA_SCHEMA.PartofSpeech] : "Noun"), unit: nUnit, missing: !nUnit, gloss: nUnit ? nUnit[DATA_SCHEMA.English] : stem },
				grammar: gList
			};
		}
	}
	// 0.17 Noun + Copula Connective 이고 (e.g. 갈색이고, 학생이고)
	if (word.endsWith("이고") && word.length > 2) {
		const stem = word.slice(0, -2);
		const stemUnits = vocabByKo.get(stem) || [];
		const nounUnits = stemUnits.filter(u => u[DATA_SCHEMA.PartofSpeech] === 'Noun' || u[DATA_SCHEMA.PartofSpeech] === 'Pronoun');
		const nUnit = nounUnits.length > 0 ? nounUnits[0] : null;
		if (nUnit || vocabByKo.has(stem)) {
			return {
				surface: word,
				category: "noun_copula_connective",
				lexical: { text: stem, pos: nUnit ? nUnit[DATA_SCHEMA.PartofSpeech] : "Noun", unit: nUnit, missing: !nUnit, gloss: nUnit ? nUnit[DATA_SCHEMA.English] : "candidate noun (" + stem + ")" },
				grammar: [
					{ text: "이다", pos: "Copula", unit: unitById.get(56), gloss: "copula 'be' (ID 56)" },
					{ text: "-고", pos: "Verb Ending", unit: unitById.get(336), gloss: "connective 'and' (ID 336)" }
				]
			};
		}
	}
	// 0.18 Noun + Copula Background/Contrastive 인데 / 인데요 (e.g. 방석인데, 프로그램인데요)
	const indeM = word.match(/^(.+?)(인데요|인데)$/);
	if (indeM && indeM[1].length >= 1) {
		const stem = indeM[1];
		const isYo = indeM[2] === "인데요";
		const stemUnits = vocabByKo.get(stem) || [];
		const nounUnits = stemUnits.filter(u => u[DATA_SCHEMA.PartofSpeech] === 'Noun' || u[DATA_SCHEMA.PartofSpeech] === 'Pronoun');
		const nUnit = nounUnits.length > 0 ? nounUnits[0] : null;
		if (nUnit || vocabByKo.has(stem)) {
			return {
				surface: word,
				category: "noun_copula_connective",
				lexical: { text: stem, pos: nUnit ? nUnit[DATA_SCHEMA.PartofSpeech] : "Noun", unit: nUnit, missing: !nUnit, gloss: nUnit ? nUnit[DATA_SCHEMA.English] : "candidate noun (" + stem + ")" },
				grammar: [
					{ text: "이다", pos: "Copula", unit: unitById.get(56), gloss: "copula 'be' (ID 56)" },
					isYo ? { text: "-는데요", pos: "Verb Ending", unit: unitById.get(1292), gloss: "background / soft statement (ID 1292)" } : { text: "-는데", pos: "Verb Ending", unit: unitById.get(620), gloss: "background/contrastive (ID 620)" }
				]
			};
		}
	}
	// 0.2 Noun + Copula + -아/어서: 이어서 / 여서 (e.g. 대전이어서, 친구여서)
	const eoseoM = word.match(/^(.+?)(이어서|여서)$/);
	if (eoseoM && eoseoM[1].length >= 1) {
		const stem = eoseoM[1];
		const stemUnits = vocabByKo.get(stem) || [];
		const nounUnits = stemUnits.filter(u => u[DATA_SCHEMA.PartofSpeech] === 'Noun' || u[DATA_SCHEMA.PartofSpeech] === 'Pronoun');
		const nUnit = nounUnits.length > 0 ? nounUnits[0] : null;
		return {
			surface: word,
			category: "noun_copula_connective",
			lexical: { text: stem, pos: nUnit ? nUnit[DATA_SCHEMA.PartofSpeech] : "Noun", unit: nUnit, missing: !nUnit, gloss: nUnit ? nUnit[DATA_SCHEMA.English] : stem },
			grammar: [
				{ text: "이다", pos: "Copula", unit: unitById.get(56), gloss: "copula 'be' (ID 56)" },
				{ text: "-아/어서", pos: "Verb Ending", unit: unitById.get(459), gloss: "cause / sequential (ID 459)" }
			]
		};
	}

	// 1. Pronominal Irregular Subject Allomorphs (제+가 -> 제가, 내+가 -> 내가, 네+가 -> 네가)
	if (word.endsWith("가") && word.length === 2) {
		const stem = word[0];
		const allo = index.pronounSandhiMap ? index.pronounSandhiMap.get(stem) : null;
		if (allo) {
			const baseUnit = unitById.get(allo.baseId);
			const particleUnit = unitById.get(allo.particleId);
			return {
				surface: word,
				category: "pronoun_phrase",
				lexical: { text: allo.baseWord, pos: baseUnit ? baseUnit[DATA_SCHEMA.PartofSpeech] : "Pronoun", unit: baseUnit, gloss: baseUnit ? baseUnit[DATA_SCHEMA.English] : "" },
				grammar: [{ text: allo.particleWord, pos: "Particle", unit: particleUnit, gloss: particleUnit ? particleUnit[DATA_SCHEMA.English] : "" }],
				disambiguation: {
					resolved: true,
					target: `${allo.baseWord} (${baseUnit ? baseUnit[DATA_SCHEMA.PartofSpeech] : "Pronoun"} ID ${baseUnit ? baseUnit[DATA_SCHEMA.Id] : allo.baseId})`,
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
			const nextNounUnit = vocabByKo.has(nextWord) ? vocabByKo.get(nextWord)[0] : null;
			const nextStem = nextWord ? (getStem(nextWord) || nextWord.slice(0, 1)) : "";
			const nextIsVerb = Boolean(nextWord && (
				(vocabByKo.has(nextWord) && vocabByKo.get(nextWord).some(u => u[DATA_SCHEMA.PartofSpeech] === 'Action Verb' || u[DATA_SCHEMA.PartofSpeech] === 'Descriptive Verb')) ||
				(vocabByKo.has(nextStem) && vocabByKo.get(nextStem).some(u => u[DATA_SCHEMA.PartofSpeech] === 'Action Verb' || u[DATA_SCHEMA.PartofSpeech] === 'Descriptive Verb')) ||
				(nextWord.length > 1 && vocabByKo.has(nextWord.slice(0, 1)) && vocabByKo.get(nextWord.slice(0, 1)).some(u => u[DATA_SCHEMA.PartofSpeech] === 'Action Verb' || u[DATA_SCHEMA.PartofSpeech] === 'Descriptive Verb'))
			));
			const evalContext = {
				tokenSurface: word,
				attachedParticle: "",
				attachedEnding: "",
				prevWord,
				nextWord,
				nextUnit: nextNounUnit,
				nextIsVerb,
				clausePredicate: sentenceContext.clausePredicate
			};

			const disambigRes = disambiguateCandidates(nonVerbs, evalContext, index);
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
	// 2.5 Noun + Plural suffix -들 (e.g. 친척들, 학생들, 친구들)
	if (word.endsWith("들") && word.length > 1) {
		const singularStem = word.slice(0, -1);
		const sUnits = vocabByKo.has(singularStem) ? vocabByKo.get(singularStem).filter(u => u[DATA_SCHEMA.PartofSpeech] === 'Noun' || u[DATA_SCHEMA.PartofSpeech] === 'Pronoun' || u[DATA_SCHEMA.PartofSpeech] === 'Adverb') : [];
		const nUnit = sUnits.length > 0 ? sUnits[0] : null;
		return {
			surface: word,
			category: "noun_plural",
			lexical: { text: singularStem, pos: nUnit ? nUnit[DATA_SCHEMA.PartofSpeech] : "Noun", unit: nUnit, missing: !nUnit, gloss: nUnit ? nUnit[DATA_SCHEMA.English] : "candidate noun (" + singularStem + ")" },
			grammar: [{ text: "들", pos: "Plural Suffix", unit: unitById.get(550), gloss: "plural suffix (ID 550)" }]
		};
	}
	// 3. Number + Counter + Particle (e.g. 1년쯤, 2년 동안, 3시에, 6~7분, 20**년, 5호선으로, 4개의)
	const numCounterMatch = word.match(/^(\d[\d\*]*(?:[~-]\d+)?)([가-힣]+?)(의|으로|로|쯤|에|부터|까지|은|는|이|가|을|를|도|만|과|와)?$/);
	if (numCounterMatch) {
		const numVal = numCounterMatch[1];
		const counterText = numCounterMatch[2];
		const particleText = numCounterMatch[3];
		const counterUnits = vocabByKo.get(counterText) || [];
		let counterUnit = counterUnits.length > 0 ? counterUnits[0] : null;
		if (!counterUnit && (counterText === "만원" || counterText.endsWith("원"))) {
			counterUnit = unitById.get(526);
		}

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
	// 4. Centralized Declarative Verb & Suffix Matching
	const verbRes = matchVerbSuffix(word, prevWord, nextWord, index, evaluateSyntaxFrame);
	if (verbRes) return verbRes;
	// 5. Adnominal Participles: ~한, ~은, ~는, ~(으)ㄴ, ~(으)ㄹ
	const adnominalRes = matchAdnominalEnding(word, index);
	if (adnominalRes) return adnominalRes;
	// 5.5 Prefix Negative Adverb 안 (e.g. 안사먹었는데 -> 안 + 사먹었는데)
	if (word.startsWith("안") && word.length >= 3 && !vocabByKo.has(word)) {
		const remainder = word.slice(1);
		const innerRes = analyzeSingleToken(remainder, prevWord, nextWord, sentenceContext, explicitIndex);
		if (innerRes && innerRes.category !== "unknown" && innerRes.lexical && (innerRes.lexical.pos === 'Action Verb' || innerRes.lexical.pos === 'Descriptive Verb')) {
			const anUnit = unitById.get(251);
			innerRes.surface = word;
			innerRes.grammar = innerRes.grammar || [];
			innerRes.grammar.unshift({
				text: "안",
				pos: "Negative Adverb",
				unit: anUnit,
				missing: !anUnit,
				gloss: anUnit ? anUnit[DATA_SCHEMA.English] : "not (short negation ID 251)"
			});
			return innerRes;
		}
	}

	// 6. Noun + Attached Particle Cliticization
	for (const spec of PARTICLE_SPECS) {
		if (word.endsWith(spec.text) && word.length > spec.text.length) {
			let stem = word.slice(0, -spec.text.length);
			let isPlural = false;

			// Handle plural suffix -들 (e.g. 친척들 + 과 -> 친척들과, 학생들 + 이 -> 학생들이)
			if (stem.endsWith("들") && stem.length > 1) {
				const singularStem = stem.slice(0, -1);
				if (vocabByKo.has(singularStem)) {
					stem = singularStem;
					isPlural = true;
				}
			}

			// Handle familiar name suffix -이 on personal names ending in batchim (e.g. 미진이 + 는 -> 미진이는)
			let isFamiliarName = false;
			let baseNameStem = null;
			if (stem.endsWith("이") && stem.length > 1) {
				const baseName = stem.slice(0, -1);
				const baseUnits = vocabByKo.get(baseName) || [];
				const isName = baseUnits.some(u => {
					const tagSet = index.semanticTagsByUnitId ? index.semanticTagsByUnitId.get(u[DATA_SCHEMA.Id]) : null;
					return tagSet ? (tagSet.has("name") || tagSet.has("proper_noun")) : false;
				});
				if (isName && hasBatchim(baseName.slice(-1))) {
					baseNameStem = baseName;
					isFamiliarName = true;
				}
			}

			const lastChar = (isPlural ? "들" : isFamiliarName ? "이" : stem).slice(-1);
			if (!checkBatchimRequirement(lastChar, spec.batchimReq, hasBatchim, decomposeHangul)) {
				continue;
			}
			if (isFamiliarName) {
				stem = baseNameStem;
			}

			let validNounUnits = [];
			if (stem === "씨") {
				const cUnit = unitById.get(23);
				if (cUnit) validNounUnits = [cUnit];
			} else {
				const stemUnits = vocabByKo.get(stem) || [];
				validNounUnits = stemUnits.filter(u => u[DATA_SCHEMA.PartofSpeech] === 'Noun' || u[DATA_SCHEMA.PartofSpeech] === 'Pronoun' || u[DATA_SCHEMA.PartofSpeech] === 'Number' || u[DATA_SCHEMA.PartofSpeech] === 'Adverb' || u[DATA_SCHEMA.PartofSpeech] === 'Bound Noun');
			}

			// Check if unrecognized stem is a compound noun (e.g. 새집 + 에서 -> 새 + 집 + 에서)
			if (validNounUnits.length === 0) {
				for (let len = stem.length - 1; len >= 1; len--) {
					const prefix = stem.slice(0, len);
					const suffix = stem.slice(len);
					if (vocabByKo.has(prefix) && vocabByKo.has(suffix)) {
						const pUnits = vocabByKo.get(prefix) || [];
						const sUnits = vocabByKo.get(suffix) || [];
						const pUnit = pUnits.find(u => (u[DATA_SCHEMA.PartofSpeech] === 'Noun' || u[DATA_SCHEMA.PartofSpeech] === 'Determiner') && u[DATA_SCHEMA.PartofSpeech] !== 'Exclamation');
						const sUnit = sUnits.find(u => u[DATA_SCHEMA.PartofSpeech] === 'Noun');
						if (pUnit && sUnit) {
							const pParticle = spec.ids.length > 0 ? unitById.get(spec.ids[0]) : null;
							return {
								surface: word,
								category: "compound_noun",
								lexical: {
									text: stem,
									pos: "Compound Noun",
									components: [
										{ text: prefix, unit: pUnit, gloss: pUnit[DATA_SCHEMA.English] },
										{ text: suffix, unit: sUnit, missing: !sUnit, gloss: sUnit[DATA_SCHEMA.English] }
									]
								},
								grammar: [{
									text: spec.text,
									pos: "Particle",
									unit: pParticle,
									missing: !pParticle,
									gloss: pParticle ? pParticle[DATA_SCHEMA.English] : spec.desc
								}]
							};
						}
					}
				}
			}

			let stemUnit = validNounUnits.length > 0 ? validNounUnits[0] : null;
			let chosenParticleUnit = null;
			let disambigInfo = null;
			let stemDisambigInfo = null;

			// Disambiguate multi-candidate noun stem (e.g. 저 pronoun vs determiner in 저는)
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
				const stemRes = disambiguateCandidates(validNounUnits, evalStemContext, index);
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

				const res = disambiguateCandidates(candidateParticleUnits, evalContext, index);
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
			const grammarList = [];
			if (isPlural) {
				grammarList.push({
					text: "들",
					pos: "Plural Suffix",
					unit: unitById.get(550),
					missing: false,
					gloss: "plural suffix (ID 550)"
				});
			}
			grammarList.push({
				text: spec.text,
				pos: "Particle",
				unit: chosenParticleUnit,
				missing: !chosenParticleUnit,
				gloss: chosenParticleUnit ? chosenParticleUnit[DATA_SCHEMA.English] : spec.desc
			});

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
				grammar: grammarList,
				disambiguation: finalDisambig
			};
		}
	}

	// 7. Compound Noun Decomposition (e.g. 한국문화 -> 한국 + 문화, 새집 -> 새 + 집)
	for (let len = word.length - 1; len >= 1; len--) {
		const prefix = word.slice(0, len);
		const suffix = word.slice(len);
		if (vocabByKo.has(prefix) && vocabByKo.has(suffix)) {
			const pUnits = vocabByKo.get(prefix) || [];
			const sUnits = vocabByKo.get(suffix) || [];
			const pUnit = pUnits.find(u => (u[DATA_SCHEMA.PartofSpeech] === 'Noun' || u[DATA_SCHEMA.PartofSpeech] === 'Determiner') && u[DATA_SCHEMA.PartofSpeech] !== 'Exclamation');
			const sUnit = sUnits.find(u => u[DATA_SCHEMA.PartofSpeech] === 'Noun');
			if (pUnit && sUnit) {
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
	}

	// 8. Unknown Token
	return {
		surface: word,
		category: "unknown",
		lexical: { text: word, pos: "Unknown", missing: true, gloss: "unrecognized vocabulary" },
		grammar: []
	};
}

if (typeof window !== 'undefined') {
	window.analyzeSingleToken = analyzeSingleToken;
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		analyzeSingleToken
	};
}
