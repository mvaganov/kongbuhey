(function() {
/**
 * korean/phonetics/pronunciation.js
 *
 * Standard Korean Pronunciation (국립국어원 표준 발음법) Engine
 *
 * Implements:
 * 1. Phonological mutations: Liaison (연음), Coda Neutralization (평폐쇄음화),
 *    Double Batchim Simplification (자음군 단순화), Nasalization (비음화),
 *    Lateralization (유음화), Tensification (경음화), Aspiration / ㅎ-merging (격음화/탈락),
 *    and Palatalization (구개음화).
 * 2. Statutory Phonology Exceptions (국립국어원 표준 발음법 예외 조항):
 *    - 제10항 다만: ㄼ verb root 밟- -> [ㅂ] before consonants; 넓- derivative compounds
 *    - 제11항 다만: ㄺ verb stems before ㄱ -> [ㄹ] (맑게 [말께], 읽거나 [일꺼나])
 *    - 제15항: Substantive morpheme boundary neutralization before liaison (옷 안 [오단], 겉옷 [거돋])
 *    - 제16항: Letter names irregular liaison (디귿이 [디그시], 지읒이 [지으시])
 *    - 제20항 다만: Sino-Korean non-lateralizing compounds (생산량 [생산냥], 상견례 [상견녜])
 *    - 제24항 다만: Passive/causative suffix -기- non-tensification (안기다 [안기다])
 *    - 제26항 다만: Reduplicated Hanja compounds non-tensification (허허실실)
 *    - 제28항: Saisori glottalization in pure/hybrid compounds (문고리 [문꼬리], 눈동자 [눈똥자])
 *    - 제29항: 'ㄴ' insertion in compounds (솜이불 [솜니불], 식용유 [시굥뉴])
 */

const {
	decomposeHangul,
	composeHangul
} = (typeof require !== 'undefined' ? require('../core/primitives.js') : window);

const {
	FINAL_TO_INITIAL,
	TENSIFY_INITIAL,
	NASAL_VERB_ROOTS,
	DOUBLE_CODA_LIAISON,
	DOUBLE_CODA_SIMPLIFY,
	H_ONSET_MAP,
	NASAL_CODA,
	DOUBLE_CODA_VERB_EXCEPTIONS,
	SUBSTANTIVE_BOUNDARY_EXCEPTIONS,
	SINO_NON_LATERALIZING_MAP,
	SINO_NON_LATERALIZING_COMPOUNDS,
	PASSIVE_CAUSATIVE_GI_VERBS,
	REDUPLICATED_HANJA_WORDS,
	SAISORI_COMPOUND_MAP,
	N_INSERTION_COMPOUNDS,
	NON_N_INSERTION_WORDS,
	LETTER_NAME_EXCEPTIONS
} = (typeof require !== 'undefined' ? require('../specs/pronunciation_rules.js') : window);

/**
 * Phonetically resolves a single Korean token word according to Standard Pronunciation.
 *
 * @param {string} word - Surface Hangul token
 * @param {Object} [options] - Pronunciation configuration
 * @returns {string} Standard phonetic Hangul representation
 */
function getPronunciationWord(word, options = {}) {
	if (!word || typeof word !== 'string') return word;

	// Check reduplicated Hanja words (제26항 다만)
	const isReduplicatedHanja = REDUPLICATED_HANJA_WORDS.has(word);

	const chars = [];
	const hangulIndices = [];
	for (let i = 0; i < word.length; i++) {
		const d = decomposeHangul(word[i]);
		if (d) {
			chars.push(d);
			hangulIndices.push(chars.length - 1);
		} else {
			chars.push(word[i]);
		}
	}
	if (hangulIndices.length === 0) return word;

	const H = hangulIndices.map(idx => chars[idx]);
	const originalSyllables = hangulIndices.map(idx => word[idx]);

	// Exception: Verb root 밟- (제10항 다만) -> [ㅂ] before all consonants or word boundary
	for (let i = 0; i < H.length; i++) {
		if (DOUBLE_CODA_VERB_EXCEPTIONS.baepRoots.has(originalSyllables[i]) && H[i].final === 11) {
			const next = (i < H.length - 1) ? H[i + 1] : null;
			if (!next || next.initial !== 11) { // before consonant or word-final
				H[i].final = 17; // ㅂ
			}
		}
	}

	// Exception: Verb stems ending in ㄺ before suffix starting with ㄱ (제11항 다만) -> [ㄹ]
	for (let i = 0; i < H.length - 1; i++) {
		if (DOUBLE_CODA_VERB_EXCEPTIONS.rieulGiyeokVerbRoots.has(originalSyllables[i]) &&
			H[i].final === 9 && H[i + 1].initial === 0) {
			H[i].final = 8; // ㄹ
			H[i + 1].initial = 1; // ㄲ (tensify following ㄱ)
		}
	}

	// Pass 1: Consonant + ㅢ -> ㅣ (non-initial onset)
	for (let i = 0; i < H.length; i++) {
		if (H[i].initial !== 11 && H[i].medial === 19) {
			H[i].medial = 20;
		}
	}

	// Pass 2: Palatalization (구개음화: ㄷ/ㅌ + 이/히 -> ㅈ/ㅊ)
	for (let i = 0; i < H.length - 1; i++) {
		const cur = H[i], next = H[i + 1];
		if (next.initial === 11 && (next.medial === 20 || next.medial === 6)) { // 이 or 여
			if (cur.final === 7) { cur.final = 0; next.initial = 12; } // ㄷ -> ㅈ
			else if (cur.final === 25) { cur.final = 0; next.initial = 14; } // ㅌ -> ㅊ
			else if (cur.final === 13) { cur.final = 8; next.initial = 14; } // ㄾ -> ㄹ + ㅊ
		} else if (next.initial === 18 && (next.medial === 20 || next.medial === 6) && cur.final === 7) {
			cur.final = 0; next.initial = 14; // ㄷ + 히 -> ㅊ
		}
	}

	// Pass 3: ㅎ assimilation & merging (격음화 & 탈락)
	for (let i = 0; i < H.length - 1; i++) {
		const cur = H[i], next = H[i + 1];
		if (cur.final === 27 || cur.final === 6 || cur.final === 15) { // ㅎ, ㄶ, ㅀ
			const isH = cur.final === 27, isNh = cur.final === 6;
			const baseFinal = isH ? 0 : (isNh ? 4 : 8);
			if (next.initial === 11) { // before vowel
				cur.final = 0;
				if (!isH) next.initial = isNh ? 2 : 5; // ㄶ -> ㄴ, ㅀ -> ㄹ
			} else if (next.initial === 0) { cur.final = baseFinal; next.initial = 15; } // + ㄱ -> ㅋ
			else if (next.initial === 3) { cur.final = baseFinal; next.initial = 16; } // + ㄷ -> ㅌ
			else if (next.initial === 12) { cur.final = baseFinal; next.initial = 14; } // + ㅈ -> ㅊ
			else if (next.initial === 9) { cur.final = baseFinal; next.initial = 10; } // + ㅅ -> ㅆ
			else if (next.initial === 2) {
				cur.final = isH ? 4 : baseFinal;
				if (!isH && !isNh) next.initial = 5;
			}
		} else if (next.initial === 18 && H_ONSET_MAP[cur.final]) { // consonant + ㅎ
			[cur.final, next.initial] = H_ONSET_MAP[cur.final];
		}
	}

	// Pass 4: ㅅ/ㅆ coda before ㅅ onset
	for (let i = 0; i < H.length - 1; i++) {
		const cur = H[i], next = H[i + 1];
		if ((cur.final === 19 || cur.final === 20) && next.initial === 9) {
			cur.final = 0; next.initial = 10;
		} else if (cur.final === 18 && next.initial === 9) {
			cur.final = 17; next.initial = 10;
		}
	}

	// Pass 5: Liaison (연음)
	for (let i = 0; i < H.length - 1; i++) {
		const cur = H[i], next = H[i + 1];
		if (cur.final > 0 && cur.final !== 21 && next.initial === 11) { // non-ㅇ coda before ㅇ
			if (FINAL_TO_INITIAL[cur.final] !== undefined) {
				next.initial = FINAL_TO_INITIAL[cur.final];
				cur.final = 0;
			} else if (DOUBLE_CODA_LIAISON[cur.final]) {
				[cur.final, next.initial] = DOUBLE_CODA_LIAISON[cur.final];
			}
		}
	}

	// Pass 6: Coda Simplification / Neutralization (평폐쇄음화)
	for (let i = 0; i < H.length; i++) {
		const cur = H[i], next = (i < H.length - 1) ? H[i + 1] : null;
		if (cur.final > 0) {
			if (DOUBLE_CODA_SIMPLIFY[cur.final]) {
				cur.final = DOUBLE_CODA_SIMPLIFY[cur.final];
			} else if (cur.final === 11) { // ㄼ
				cur.final = (originalSyllables[i] === '밟') ? 17 : 8;
			} else if (cur.final === 9) { // ㄺ
				cur.final = (next && next.initial === 0) ? 8 : 1;
			}

			// Neutralize to 7 representative stops (ㄱ, ㄷ, ㅂ)
			if (cur.final === 2 || cur.final === 24) cur.final = 1; // ㄲ, ㅋ -> ㄱ
			else if ([19, 20, 22, 23, 25, 27].includes(cur.final)) cur.final = 7; // ㅅ, ㅆ, ㅈ, ㅊ, ㅌ, ㅎ -> ㄷ
			else if (cur.final === 26) cur.final = 17; // ㅍ -> ㅂ
		}
	}

	// Pass 7: Tensification (경음화)
	for (let i = 0; i < H.length - 1; i++) {
		const cur = H[i], next = H[i + 1];

		// Check if next syllable is passive/causative -기- (제24항 다만)
		const isPassiveGi = PASSIVE_CAUSATIVE_GI_VERBS.has(originalSyllables[i] + '기') && originalSyllables[i + 1] === '기';

		if (cur.final === 1 || cur.final === 7 || cur.final === 17) { // after ㄱ, ㄷ, ㅂ
			if (TENSIFY_INITIAL[next.initial] !== undefined) {
				next.initial = TENSIFY_INITIAL[next.initial];
			}
		} else if ((cur.final === 4 || cur.final === 16) && NASAL_VERB_ROOTS.has(originalSyllables[i])) { // nasal verb roots
			const bigram = originalSyllables[i] + originalSyllables[i + 1];
			const isNounExclusion = ['감사', '안경', '신발', '남자', '인사', '안전', '신문', '신부', '감기', '감자', '임시', '점심'].includes(bigram);
			if (!isPassiveGi && !isNounExclusion) {
				const nextOrig = decomposeHangul(originalSyllables[i + 1]);
				if (nextOrig && nextOrig.initial !== 11 && TENSIFY_INITIAL[next.initial] !== undefined) {
					next.initial = TENSIFY_INITIAL[next.initial];
				}
			}
		} else if (cur.final === 8 && !isReduplicatedHanja) { // Sino-Korean ㄹ coda tensification
			if (next.initial === 0 && next.medial === 4) next.initial = 1;
			else if (next.initial === 9 && next.medial === 13) next.initial = 10;
			else if (next.initial === 12 && next.medial === 13) next.initial = 13;
		}
	}

	// Pass 8: Nasalization (비음화)
	for (let i = 0; i < H.length - 1; i++) {
		const cur = H[i], next = H[i + 1];
		if (next.initial === 5) { // before ㄹ
			if (cur.final === 16 || cur.final === 21) next.initial = 2; // ㅁ/ㅇ + ㄹ -> ㅁ/ㅇ + ㄴ
			else if (NASAL_CODA[cur.final]) {
				cur.final = NASAL_CODA[cur.final];
				next.initial = 2;
			}
		}
		if ((next.initial === 2 || next.initial === 6) && NASAL_CODA[cur.final]) { // before ㄴ, ㅁ
			cur.final = NASAL_CODA[cur.final];
		}
	}

	// Pass 9: Lateralization (유음화: ㄴ+ㄹ or ㄹ+ㄴ -> ㄹ+ㄹ)
	for (let i = 0; i < H.length - 1; i++) {
		const cur = H[i], next = H[i + 1];
		if (cur.final === 4 && next.initial === 5) { // ㄴ + ㄹ -> ㄹ + ㄹ
			cur.final = 8;
		} else if (cur.final === 8 && next.initial === 2) { // ㄹ + ㄴ -> ㄹ + ㄹ
			next.initial = 5;
		}
	}

	for (let i = 0; i < hangulIndices.length; i++) {
		chars[hangulIndices[i]] = composeHangul(H[i].initial, H[i].medial, H[i].final);
	}
	return chars.join('');
}

/**
 * Phonetically resolves a complete Korean text passage or sentence.
 *
 * @param {string} text - Surface Korean text
 * @param {Object} [options] - Pronunciation configuration
 * @returns {string} Standard phonetic Hangul representation
 */
function getPronunciation(text, options = {}) {
	if (!text || typeof text !== 'string') return text;

	let processed = text;

	// 1. Korean Alphabet Letter Names Exceptions (제16항)
	for (const [raw, repl] of Object.entries(LETTER_NAME_EXCEPTIONS)) {
		processed = processed.split(raw).join(repl);
	}

	// 2. Substantive Morpheme Boundary Neutralization before Liaison (제15항)
	for (const [raw, repl] of Object.entries(SUBSTANTIVE_BOUNDARY_EXCEPTIONS)) {
		processed = processed.split(raw).join(repl);
	}

	// 3. 'ㄴ' Insertion Rules (제29항)
	for (const [raw, repl] of Object.entries(N_INSERTION_COMPOUNDS)) {
		processed = processed.split(raw).join(repl);
	}

	// 4. Saisori Glottalization in Compounds (제28항)
	for (const [raw, repl] of Object.entries(SAISORI_COMPOUND_MAP)) {
		processed = processed.split(raw).join(repl);
	}

	// 5. Derivative compounds with 넓- (제10항 다만)
	for (const [raw, repl] of Object.entries(DOUBLE_CODA_VERB_EXCEPTIONS.neolbCompounds)) {
		processed = processed.split(raw).join(repl);
	}

	// 6. Sino-Korean Non-Lateralizing Compounds (제20항 다만: ㄴ + ㄹ -> [ㄴ + ㄴ])
	for (const [raw, repl] of Object.entries(SINO_NON_LATERALIZING_MAP)) {
		processed = processed.split(raw).join(repl);
	}

	// 7. General Word-Level Phonetic Resolution
	return processed.replace(/([가-힣]+)/g, m => getPronunciationWord(m, options));
}

const pronunciationEngine = {
	getPronunciationWord,
	getPronunciation
};

if (typeof window !== 'undefined') {
	Object.assign(window, pronunciationEngine);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = pronunciationEngine;
}
})();
