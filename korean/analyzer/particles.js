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
	{ text: "에서는", ids: [199, 36], desc: "에서 + 는 (Location topic)" },
	{ text: "에서도", ids: [199, 366], desc: "에서 + 도 (Location additive)" },
	{ text: "에는", ids: [132, 36], desc: "에 + 는 (Time/Location topic)" },
	{ text: "에다가", ids: [995, 996], desc: "에다가 (Location on / in addition to)" },
	{ text: "에다", ids: [995, 996], desc: "에다 (Location on / in addition to)" },
	{ text: "에도", ids: [132, 366], desc: "에 + 도 (Time/Location additive)" },
	{ text: "에게는", ids: [618, 36], desc: "에게 + 는 (Dative topic)" },
	{ text: "에게도", ids: [618, 366], desc: "에게 + 도 (Dative additive)" },
	{ text: "한테는", ids: [618, 36], desc: "한테 + 는 (Dative informal topic)" },
	{ text: "한테도", ids: [618, 366], desc: "한테 + 도 (Dative informal additive)" },

	// Primary case & delimiter particles
	{ text: "에서", ids: [199], desc: "에서 (Location of action / source)" },
	{ text: "에게", ids: [618], desc: "에게 (Dative)" },
	{ text: "한테", ids: [618], desc: "한테 (Dative informal)" },
	{ text: "께서", ids: [648], desc: "께서 (Honorific subject marker)" },
	{ text: "으로", ids: [1240, 1241, 1242], desc: "-(으)로 (Direction / Means / Status)", batchimReq: "consonant_not_l" },
	{ text: "로", ids: [1240, 1241, 1242], desc: "-(으)로 (Direction / Means / Status)", batchimReq: "vowel_or_l" },
	{ text: "이나", ids: [1333, 1334], desc: "이나 (Choice / Quantity)", batchimReq: true },
	{ text: "나", ids: [1333, 1334], desc: "(이)나 (Choice / Quantity)", batchimReq: false },
	{ text: "마다", ids: [1797], desc: "마다 (Each / Every)" },
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
	{ text: "보다", ids: [680], desc: "보다 (Comparative particle)" },
	{ text: "쯤", ids: [653], desc: "쯤 (Approximation particle)" },
	{ text: "만", ids: [365], desc: "만 (Only)" }
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

if (typeof window !== 'undefined') {
	window.PARTICLE_SPECS = PARTICLE_SPECS;
	window.findExactParticle = findExactParticle;
	window.checkBatchimRequirement = checkBatchimRequirement;
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		PARTICLE_SPECS,
		findExactParticle,
		checkBatchimRequirement
	};
}
