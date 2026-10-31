(function() {
/**
 * korean/analyzer/particles.js
 *
 * Declarative particle specifications, compound particle decompositions,
 * and morphophonemic batchim harmony requirements.
 *
 * Platform: Node.js & Browser (Vanilla JS, zero dependencies).
 */

const PARTICLE_SPECS = Object.freeze([
	// Compound particles (delimiter cliticized to case particle)
	{ text: "에서는", ids: [199, 36], desc: "에서 + 는 (Location topic)", isCompound: true },
	{ text: "에서도", ids: [199, 366], desc: "에서 + 도 (Location additive)", isCompound: true },
	{ text: "에는", ids: [132, 36], desc: "에 + 는 (Time/Location topic)", isCompound: true },
	{ text: "에다가", ids: [995, 996], desc: "에다가 (Location on / in addition to)", isCompound: true },
	{ text: "에다", ids: [995, 996], desc: "에다 (Location on / in addition to)", isCompound: true },
	{ text: "에도", ids: [132, 366], desc: "에 + 도 (Time/Location additive)", isCompound: true },
	{ text: "에게는", ids: [618, 36], desc: "에게 + 는 (Dative topic)", isCompound: true },
	{ text: "에게도", ids: [618, 366], desc: "에게 + 도 (Dative additive)", isCompound: true },
	{ text: "한테는", ids: [618, 36], desc: "한테 + 는 (Dative informal topic)", isCompound: true },
	{ text: "한테도", ids: [618, 366], desc: "한테 + 도 (Dative informal additive)", isCompound: true },
	{ text: "에게나", ids: [618, 1333], desc: "에게 + 나 (Dative quantity/choice)", isCompound: true },
	{ text: "만의", ids: [1402, 856], desc: "만 + 의 (Only + Possessive)", isCompound: true },
	{ text: "에나", ids: [132, 1333], desc: "에 + 나 (Location + inclusive delimiter)", isCompound: true },
	{ text: "께서도", ids: [648, 366], desc: "께서 + 도 (Honorific subject + also)", isCompound: true },
	{ text: "께는", ids: [647, 36], desc: "께 + 는 (Dative honorific topic)", isCompound: true },
	{ text: "께도", ids: [647, 366], desc: "께 + 도 (Dative honorific additive)", isCompound: true },

	// Primary case & delimiter particles
	{ text: "에서", ids: [199], desc: "에서 (Location of action / source)" },
	{ text: "에게", ids: [618], desc: "에게 (Dative)" },
	{ text: "한테", ids: [618], desc: "한테 (Dative informal)" },
	{ text: "께", ids: [647], desc: "께 (Dative honorific)" },
	{ text: "께서", ids: [648], desc: "께서 (Honorific subject marker)" },
	{ text: "으로", ids: [1240, 1241, 1242], desc: "-(으)로 (Direction / Means / Status)", batchimReq: "consonant_not_l" },
	{ text: "로", ids: [1240, 1241, 1242], desc: "-(으)로 (Direction / Means / Status)", batchimReq: "vowel_or_l" },
	{ text: "이나", ids: [1333, 1334], desc: "이나 (Choice / Quantity)", batchimReq: true },
	{ text: "나", ids: [1333, 1334], desc: "(이)나 (Choice / Quantity)", batchimReq: false },
	{ text: "마다", ids: [1797], desc: "마다 (Each / Every)" },
	{ text: "이랑", ids: [276], desc: "(이)랑 (And / With)", batchimReq: true },
	{ text: "랑", ids: [276], desc: "(이)랑 (And / With)", batchimReq: false },
	{ text: "이라서", ids: [1385], desc: "이라서 (Cause/reason for noun)", batchimReq: true },
	{ text: "라서", ids: [1385], desc: "(이)라서 (Cause/reason for noun)", batchimReq: false },
	{ text: "이라도", ids: [1453], desc: "(이)라도 (Compromise / At least)", batchimReq: true },
	{ text: "라도", ids: [1453], desc: "(이)라도 (Compromise / At least)", batchimReq: false },
	{ text: "하고", ids: [367], desc: "하고 (And / With)" },
	{ text: "부터", ids: [1312], desc: "부터 (Starting point)" },
	{ text: "까지", ids: [1826], desc: "까지 (Ending point)" },
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
	{ text: "보다", ids: [680], desc: "보다 (Comparative particle)" },
	{ text: "만큼", ids: [1469], desc: "만큼 (Extent / Degree delimiter)" },
	{ text: "밖에", ids: [1522], desc: "밖에 (Restriction / Only with negative verb)" },
	{ text: "에게서", ids: [1706], desc: "에게서 (Ablative / From person formal)" },
	{ text: "한테서", ids: [1707], desc: "한테서 (Ablative / From person informal)" },
	{ text: "쯤", ids: [653], desc: "쯤 (Approximation particle)" },
	{ text: "만", ids: [1402], desc: "만 (Only)" },
	{ text: "아", ids: [1834], desc: "아 / 야 (Vocative)", batchimReq: true },
	{ text: "야", ids: [1834], desc: "아 / 야 (Vocative)", batchimReq: false },
	{ text: "이라고", ids: [1865], desc: "(이)라고 (Quotation)", batchimReq: true },
	{ text: "라고", ids: [1865], desc: "(이)라고 (Quotation)", batchimReq: false }
]);

/**
 * Permitted constituent particle sets for dynamic compound formation.
 * Korean morphology generally stacks delimiter/topic clitics onto case/source clitics.
 */
const ALLOWED_COMPOUND_P1 = new Set([
	"에서", "에", "에게", "한테", "께서", "으로", "로", "과", "와", "부터", "까지", "만", "보다"
]);
const ALLOWED_COMPOUND_P2 = new Set([
	"는", "은", "도", "만", "의", "나", "야"
]);

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
		if (vocabByKo.has(stem)) {
			const cands = vocabByKo.get(stem).filter(u =>
				u[DATA_SCHEMA.PartofSpeech] === 'Noun' ||
				u[DATA_SCHEMA.PartofSpeech] === 'Pronoun' ||
				u[DATA_SCHEMA.PartofSpeech] === 'Bound Noun' ||
				u[DATA_SCHEMA.PartofSpeech] === 'Number'
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
				u[DATA_SCHEMA.PartofSpeech] === 'Noun' ||
				u[DATA_SCHEMA.PartofSpeech] === 'Pronoun'
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
			u[DATA_SCHEMA.PartofSpeech] === 'Noun' ||
			u[DATA_SCHEMA.PartofSpeech] === 'Pronoun' ||
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
				u[DATA_SCHEMA.PartofSpeech] === 'Noun' ||
				u[DATA_SCHEMA.PartofSpeech] === 'Pronoun' ||
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
			u[DATA_SCHEMA.PartofSpeech] === 'Noun' ||
			u[DATA_SCHEMA.PartofSpeech] === 'Pronoun' ||
			u[DATA_SCHEMA.PartofSpeech] === 'Bound Noun'
		) || stemUnits[0];
		const copulaUnit = unitById.get(56);
		return {
			surface: word,
			category: "noun_copula",
			lexical: {
				text: copulaStem,
				pos: nUnit ? nUnit[DATA_SCHEMA.PartofSpeech] : "Noun",
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

