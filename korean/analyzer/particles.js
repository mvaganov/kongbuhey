(function() {
const { HANGUL_CONSTANTS: HC } = (typeof require !== 'undefined') ? require('../../data/hangul_constants.js') : window;
// Universal Constants
const { K } = (typeof require !== 'undefined') ? require('../../data/constants.js') : (typeof window !== 'undefined' ? window : {});

/**
 * korean/analyzer/particles.js
 *
 * Declarative particle specifications, compound particle decompositions,
 * and morphophonemic batchim harmony requirements.
 *
 * Platform: Node.js & Browser (Vanilla JS, zero dependencies).
 */

const PARTICLE_SPECS = HC.PARTICLE_PARTICLE_SPECS;

/**
 * Permitted constituent particle sets for dynamic compound formation.
 * Korean morphology generally stacks delimiter/topic clitics onto case/source clitics.
 */
const ALLOWED_COMPOUND_P1 = HC.PARTICLE_ALLOWED_COMPOUND_P1;
const ALLOWED_COMPOUND_P2 = HC.PARTICLE_ALLOWED_COMPOUND_P2;

/**
 * Finds exact particle match for a standalone particle word.
 */
function findExactParticle(word) {
	return PARTICLE_SPECS.find(p => p.text === word) || null;
}

/**
 * Validates whether the given Hangul syllable satisfies the particle's batchim requirement.
 * 
 * @param {string} lastChar Last Hangul syllable of the nominal stem
 * @param {string|boolean} batchimReq Requirement rule from PARTICLE_SPECS
 * @param {Function} hasBatchimFn Primitive hasBatchim
 * @param {Function} decomposeHangulFn Primitive decomposeHangul
 * @returns {boolean} True if requirement is satisfied
 */
function checkBatchimRequirement(lastChar, batchimReq, hasBatchimFn, decomposeHangulFn) {
	if (batchimReq === undefined || batchimReq === null) return true;
	const batchim = hasBatchimFn(lastChar);
	const d = decomposeHangulFn(lastChar);

	if (batchimReq === "consonant_not_l") {
		// Consonant required, but ㄹ behaves like vowel for -(으)로
		return batchim && (!d || d.final !== 8);
	}
	if (batchimReq === "vowel_or_l") {
		// Vowel or ㄹ coda required
		return !batchim || (d && d.final === 8);
	}
	if (batchimReq === true) {
		return batchim;
	}
	if (batchimReq === false) {
		return !batchim;
	}
	return true;
}

/**
 * Decomposes a candidate particle string into its constituent primary particles from PARTICLE_SPECS.
 * 
 * @param {string} particleStr The particle string to decompose (e.g. "으로는", "와는", "과도")
 * @returns {Object|null} Decomposed structure with p1, p2, combined IDs, and description, or null
 */
function decomposeCompoundParticle(particleStr) {
	if (!particleStr || particleStr.length < 2) return null;

	const primaryMatches = PARTICLE_SPECS.filter(p => !p.isCompound);

	// Try prefix + suffix splits
	for (let splitIdx = 1; splitIdx < particleStr.length; splitIdx++) {
		const prefix = particleStr.slice(0, splitIdx);
		const suffix = particleStr.slice(splitIdx);

		if (!ALLOWED_COMPOUND_P1.has(prefix) || !ALLOWED_COMPOUND_P2.has(suffix)) {
			continue;
		}

		const p1 = primaryMatches.find(p => p.text === prefix);
		const p2 = primaryMatches.find(p => p.text === suffix);

		if (p1 && p2) {
			const p1Desc = p1.desc.split('(')[0].trim();
			const p2Desc = p2.desc.split('(')[0].trim();
			return {
				text: particleStr,
				p1,
				p2,
				ids: [...p1.ids, ...p2.ids],
				desc: `${p1.text} + ${p2.text} (${p1Desc} + ${p2Desc})`,
				batchimReq: p1.batchimReq !== undefined ? p1.batchimReq : null
			};
		}
	}
	return null;
}

/**
 * Scans a Korean surface token to see if it ends with a known or candidate compound particle,
 * recovering the nominal stem and the compound particle morphology.
 * 
 * @param {string} word Korean word to analyze
 * @param {Map|Set|Object} [vocabByKo] Optional dictionary vocabulary map/set for stem validation
 * @param {Object} [options] Optional configuration ({ allowUnknownStem: boolean })
 * @returns {Object|null} Matched compound particle decomposition or null
 */
function recognizeCompoundParticle(word, vocabByKo = null, options = {}) {
	if (!word || word.length < 3) return null;

	const allowUnknownStem = options.allowUnknownStem || false;
	const maxPartLen = Math.min(4, word.length - 1);

	for (let len = maxPartLen; len >= 2; len--) {
		const candidateParticle = word.slice(-len);
		const stem = word.slice(0, -len);
		if (!stem) continue;

		const hasStem = vocabByKo ? (vocabByKo.has ? vocabByKo.has(stem) : Boolean(vocabByKo[stem])) : false;
		if (!hasStem && !allowUnknownStem) continue;

		// 1. Is candidateParticle an existing compound spec in PARTICLE_SPECS?
		const existingSpec = PARTICLE_SPECS.find(p => p.text === candidateParticle && p.isCompound);
		if (existingSpec) {
			return {
				matched: true,
				word,
				stem,
				hasExistingStem: hasStem,
				isExistingSpec: true,
				spec: existingSpec,
				compoundText: candidateParticle,
				ids: existingSpec.ids,
				desc: existingSpec.desc
			};
		}

		// 2. Can candidateParticle be dynamically decomposed into known P1 + P2?
		const decomp = decomposeCompoundParticle(candidateParticle);
		if (decomp) {
			return {
				matched: true,
				word,
				stem,
				hasExistingStem: hasStem,
				isExistingSpec: false,
				decomp,
				compoundText: candidateParticle,
				ids: decomp.ids,
				desc: decomp.desc,
				suggestedSpec: `{ text: "${decomp.text}", ids: [${decomp.ids.join(', ')}], desc: "${decomp.desc}" }`
			};
		}
	}

	return null;
}

// Stems permitted to take the contracted topic particle -ㄴ (from -는, ID 36).
// Restricting this prevents false positives on numbers (오->온, 사->산) and
// adnominal modifier verb stems (온 from 오다, 산 from 사다, 찬 from 차다, 판 from 파다/판).
const VALID_CONTRACTED_TOPIC_STEMS = HC.PARTICLE_VALID_CONTRACTED_TOPIC_STEMS;

/**
 * Decomposes contracted enclitics (topic particle -ㄴ or object particle -ㄹ)
 * on vowel-final nominal stems into base lexical unit + particle.
 *
 * e.g. 오빤 (오빠+는), 땐 (때+는), 난 (나+는), 넌 (너+는), 전 (저+는),
 *      우린 (우리+는), 여긴 (여기+는), 어젠 (어제+는),
 *      날 (나+를), 널 (너+를), 뭘 (뭐+를)
 */
function matchContractedParticle(word, index, DATA_SCHEMA) {
	if (!word || word.length === 0) return null;
	const lastCode = word.charCodeAt(word.length - 1);
	if (lastCode < 0xAC00 || lastCode > 0xD7A3) return null;
	const final = (lastCode - 0xAC00) % 28;
	const unitById = index.unitById;
	const vocabByKo = index.vocabByKo;

	// 1. Contracted Topic Particle: -ㄴ (from -는, ID 36)
	if (final === 4) { // nieun coda
		const uncontractedLast = String.fromCharCode(lastCode - 4);
		const stem = word.slice(0, -1) + uncontractedLast;
		if (VALID_CONTRACTED_TOPIC_STEMS.has(stem) && vocabByKo.has(stem)) {
			const cands = vocabByKo.get(stem).filter(u =>
				u[DATA_SCHEMA.PartofSpeech] === K.NOUN ||
				u[DATA_SCHEMA.PartofSpeech] === K.PRONOUN ||
				u[DATA_SCHEMA.PartofSpeech] === 'Bound Noun'
			);
			if (cands.length > 0) {
				const nUnit = cands[0];
				const topicUnit = unitById.get(36);
				return {
					surface: word,
					category: "contracted_topic",
					lexical: {
						text: stem,
						pos: nUnit[DATA_SCHEMA.PartofSpeech],
						unit: nUnit,
						missing: false,
						gloss: nUnit[DATA_SCHEMA.English]
					},
					grammar: [{
						text: "는",
						pos: "Particle",
						unit: topicUnit,
						missing: !topicUnit,
						gloss: topicUnit ? topicUnit[DATA_SCHEMA.English] : "topic particle (contracted ㄴ ID 36)"
					}]
				};
			}
		}
	}

	// 2. Contracted Object Particle: -ㄹ (from -를, ID 173)
	if (final === 8) { // rieul coda
		const uncontractedLast = String.fromCharCode(lastCode - 8);
		const stem = word.slice(0, -1) + uncontractedLast;
		if (stem === "나" || stem === "너" || stem === "뭐" || stem === "저" || stem === "누구") {
			const cands = (vocabByKo.get(stem) || []).filter(u =>
				u[DATA_SCHEMA.PartofSpeech] === K.NOUN ||
				u[DATA_SCHEMA.PartofSpeech] === K.PRONOUN
			);
			if (cands.length > 0) {
				const nUnit = cands[0];
				const objUnit = unitById.get(173);
				return {
					surface: word,
					category: "contracted_object",
					lexical: {
						text: stem,
						pos: nUnit[DATA_SCHEMA.PartofSpeech],
						unit: nUnit,
						missing: false,
						gloss: nUnit[DATA_SCHEMA.English]
					},
					grammar: [{
						text: "를",
						pos: "Particle",
						unit: objUnit,
						missing: !objUnit,
						gloss: objUnit ? objUnit[DATA_SCHEMA.English] : "object particle (contracted ㄹ ID 173)"
					}]
				};
			}
		}
	}

	return null;
}

/**
 * Decomposes Noun + Plain Declarative Copula -(이)다 (ID 56).
 *
 * e.g. 이때다 (이때 + 다), 친구다 (친구 + 다), 학생이다 (학생 + 이다), 시작이다 (시작 + 이다)
 */
function matchPlainCopula(word, index, DATA_SCHEMA, hasBatchimFn) {
	if (!word || word.length < 2 || !word.endsWith("다")) return null;
	const unitById = index.unitById;
	const vocabByKo = index.vocabByKo;

	// Do not override verbs that exist in dictionary
	if (vocabByKo.has(word)) return null;

	let copulaStem = null;
	let copulaText = "다";

	// 1. Consonant-final noun + 이다 (e.g. 학생이다 -> 학생, 시작이다 -> 시작)
	if (word.endsWith("이다") && word.length > 2) {
		const candidate = word.slice(0, -2);
		const units = (vocabByKo.get(candidate) || []).filter(u =>
			u[DATA_SCHEMA.PartofSpeech] === K.NOUN ||
			u[DATA_SCHEMA.PartofSpeech] === K.PRONOUN ||
			u[DATA_SCHEMA.PartofSpeech] === 'Bound Noun'
		);
		if (units.length > 0) {
			copulaStem = candidate;
			copulaText = "이다";
		}
	}

	// 2. Vowel-final noun + 다 (e.g. 이때다 -> 이때, 친구다 -> 친구)
	if (!copulaStem) {
		const candidate = word.slice(0, -1);
		const lastSyl = candidate.slice(-1);
		if (!hasBatchimFn(lastSyl)) {
			const units = (vocabByKo.get(candidate) || []).filter(u =>
				u[DATA_SCHEMA.PartofSpeech] === K.NOUN ||
				u[DATA_SCHEMA.PartofSpeech] === K.PRONOUN ||
				u[DATA_SCHEMA.PartofSpeech] === 'Bound Noun'
			);
			if (units.length > 0) {
				copulaStem = candidate;
				copulaText = "다";
			}
		}
	}

	if (copulaStem) {
		const stemUnits = vocabByKo.get(copulaStem) || [];
		const nUnit = stemUnits.find(u =>
			u[DATA_SCHEMA.PartofSpeech] === K.NOUN ||
			u[DATA_SCHEMA.PartofSpeech] === K.PRONOUN ||
			u[DATA_SCHEMA.PartofSpeech] === 'Bound Noun'
		) || stemUnits[0];
		const copulaUnit = unitById.get(56);
		return {
			surface: word,
			category: K.NOUN_COPULA,
			lexical: {
				text: copulaStem,
				pos: nUnit ? nUnit[DATA_SCHEMA.PartofSpeech] : K.NOUN,
				unit: nUnit,
				missing: !nUnit,
				gloss: nUnit ? nUnit[DATA_SCHEMA.English] : "candidate noun (" + copulaStem + ")"
			},
			grammar: [{
				text: copulaText,
				pos: "Verb Ending",
				unit: copulaUnit,
				gloss: copulaUnit ? copulaUnit[DATA_SCHEMA.English] : "is/are (copula ID 56)"
			}]
		};
	}

	return null;
}

if (typeof window !== 'undefined') {
	window.PARTICLE_SPECS = PARTICLE_SPECS;
	window.findExactParticle = findExactParticle;
	window.checkBatchimRequirement = checkBatchimRequirement;
	window.decomposeCompoundParticle = decomposeCompoundParticle;
	window.recognizeCompoundParticle = recognizeCompoundParticle;
	window.matchContractedParticle = matchContractedParticle;
	window.matchPlainCopula = matchPlainCopula;
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		PARTICLE_SPECS,
		findExactParticle,
		checkBatchimRequirement,
		decomposeCompoundParticle,
		recognizeCompoundParticle,
		matchContractedParticle,
		matchPlainCopula
	};
}
})();

