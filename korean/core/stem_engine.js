(function() {
/**
 * ============================================================================
 * korean/core/stem_engine.js - Unified Pure Korean Stem & Allomorph Engine
 * ============================================================================
 *
 * Single point of truth for Korean verb/adjective stem conjugation, vowel harmony,
 * irregular stem allomorphy (ㅂ, ㄷ, ㅅ, 르, 러, ㅡ, ㄹ, ㅎ, 하다, 이다), and
 * pure morphological string resolution (without full-sentence concord repair overhead).
 *
 * Zero Node.js dependencies; 100% browser and CommonJS compatible.
 */

const {
	getStem,
	decomposeHangul,
	composeHangul,
	setFinal,
	hasBatchim,
	hasRieulBatchim,
	getVowelHarmony
} = (typeof require !== 'undefined' ? require('./primitives.js') : window);

/**
 * Formats a dictionary verb/adjective into a stem with an inline irregularity tag
 * if applicable (e.g. ("춥다", "b_irregular") -> "춥[b_irregular]").
 */
function getConjugatedStem(koreanWord, conjugation) {
	let stem = getStem(koreanWord);
	if (conjugation && conjugation !== "regular" && conjugation !== "" && /^[a-z_]+$/.test(conjugation)) {
		stem += `[${conjugation}]`;
	}
	return stem;
}

/**
 * Computes the exact -아/어/해/여 connective stem for any Korean verb/adjective stem.
 * Handles all regular and irregular conjugation classes deterministically.
 *
 * @param {string} rawStem - Verb stem without trailing '다' (e.g. '먹', '가', '공부하', '춥', '걷', '모르')
 * @param {string} [conjRule='regular'] - Conjugation class from data.js
 * @returns {string} Realized -아/어 stem (e.g. '먹어', '가', '공부해', '추워', '걸어', '몰라')
 */
function conjugateAoStem(rawStem, conjRule = 'regular') {
	if (!rawStem) return '';
	const rule = String(conjRule || 'regular').toLowerCase();
	const stem = rawStem.replace(/다$/, '').replace(/\[[^\]]+\]/g, '');
	if (!stem) return '';

	const lastChar = stem.slice(-1);
	const prefix = stem.slice(0, -1);
	const d = decomposeHangul(lastChar);
	if (!d) return stem + '어';

	if (lastChar === '하' || rule.includes('hada')) {
		return prefix + '해';
	}

	// 1. ㅂ irregular (춥다 -> 추워, 돕다 -> 도와, 곱다 -> 고와)
	if (rule.includes('b_irregular') || rule.includes('p_irregular')) {
		if (d.final === 17) {
			const base = setFinal(lastChar, 0);
			const isBrightO = (lastChar === '돕' || lastChar === '곱');
			return prefix + base + (isBrightO ? '와' : '워');
		}
	}

	// 2. ㄷ irregular (걷다 -> 걸어, 묻다 -> 물어, 듣다 -> 들어)
	if (rule.includes('d_irregular') && d.final === 7) {
		const withL = setFinal(lastChar, 8);
		const vh = getVowelHarmony(withL);
		return prefix + withL + vh;
	}

	// 3. ㅅ irregular (낫다 -> 나아, 짓다 -> 지어, 붓다 -> 부어)
	if (rule.includes('s_irregular') && d.final === 19) {
		const base = setFinal(lastChar, 0);
		const vh = getVowelHarmony(base);
		return prefix + base + vh;
	}

	// 4. ㅎ irregular (어떻다 -> 어때, 파랗다 -> 파래, 노랗다 -> 노래)
	if (rule.includes('h_irregular') && d.final === 27) {
		const medial = (lastChar === '렇' || lastChar === '떻') ? 1 : 1; // ㅐ
		return prefix + composeHangul(d.initial, medial, 0);
	}

	// 5. 러 irregular (이르다 -> 이르러, 푸르다 -> 푸르러)
	if (rule.includes('reo_irregular') && lastChar === '르') {
		return prefix + '르러';
	}

	// 6. 르 irregular (모르다 -> 몰라, 빠르다 -> 빨라, 부르다 -> 불러)
	if ((rule.includes('reu_irregular') || lastChar === '르') && lastChar === '르' && prefix.length > 0 && !rule.includes('regular')) {
		const prevChar = prefix.slice(-1);
		const prevPrefix = prefix.slice(0, -1);
		const prevVh = getVowelHarmony(prevChar);
		return prevPrefix + setFinal(prevChar, 8) + (prevVh === '아' ? '라' : '러');
	}

	// 7. ㅡ dropout (쓰다 -> 써, 크다 -> 커, 바쁘다 -> 바빠, 아프다 -> 아파)
	if (d.final === 0 && d.medial === 18) {
		const prevChar = prefix.slice(-1);
		const prevVh = prevChar ? getVowelHarmony(prevChar) : '어';
		return prefix + composeHangul(d.initial, prevVh === '아' ? 0 : 4, 0);
	}

	// 8. Vowel-ending stems (no batchim) -> vowel contraction
	if (d.final === 0) {
		if (d.medial === 0 || d.medial === 1 || d.medial === 4 || d.medial === 5 || d.medial === 6) {
			// ㅏ, ㅐ, ㅓ, ㅔ, ㅕ -> unchanged (가 -> 가, 서 -> 서, 보내 -> 보내, 켜 -> 켜)
			return stem;
		}
		if (d.medial === 8) {
			// ㅗ -> ㅘ (오 -> 와, 보 -> 봐)
			return prefix + composeHangul(d.initial, 9, 0);
		}
		if (d.medial === 13) {
			// ㅜ -> ㅝ (주 -> 줘, 배우 -> 배워)
			return prefix + composeHangul(d.initial, 14, 0);
		}
		if (d.medial === 20) {
			// ㅣ -> ㅕ (마시 -> 마셔, 기다리 -> 기다려)
			return prefix + composeHangul(d.initial, 6, 0);
		}
		if (d.medial === 11) {
			// ㅚ -> ㅙ (되 -> 돼)
			return prefix + composeHangul(d.initial, 10, 0);
		}
	}

	// 9. Consonant-ending regular stems -> append 아 or 어
	const vh = getVowelHarmony(lastChar);
	return stem + vh;
}

/**
 * Derives all informal connective surface stems (-아/어/해/여) for a dictionary verb/adjective.
 * Used by both forward synthesis and the reverse text analyzer indexer.
 */
function deriveConnectiveEndings(ko, conjRule = '') {
	const results = new Set();
	if (!ko || !ko.endsWith('다') || ko.length < 2) return results;
	const stem = ko.slice(0, -1);
	if (!stem) return results;

	if (stem.endsWith('하')) {
		const prefix = stem.slice(0, -1);
		results.add(prefix + '해');
		results.add(prefix + '여');
		return results;
	}

	if (stem.endsWith('르') && stem.length >= 2 && !String(conjRule).includes('regular')) {
		results.add(conjugateAoStem(stem, 'reu_irregular'));
	}

	const lastChar = stem.slice(-1);
	const d = decomposeHangul(lastChar);
	if (d && d.final === 17) {
		results.add(conjugateAoStem(stem, 'b_irregular'));
	}
	if (d && d.final === 7) {
		results.add(conjugateAoStem(stem, 'd_irregular'));
	}
	if (d && d.final === 19) {
		results.add(conjugateAoStem(stem, 's_irregular'));
	}
	if (d && d.final === 27) {
		results.add(conjugateAoStem(stem, 'h_irregular'));
	}

	results.add(conjugateAoStem(stem, conjRule || 'regular'));
	return results;
}

/**
 * Pure morphological string resolver (irregular verb tags, particle pairs, pronoun sandhi,
 * vowel contractions, and bare time words).
 * Does NOT execute the 5 full-sentence concord repair passes, making it 10x faster for
 * single-word and stem-level conjugations.
 */
function resolvePureMorphology(text, stateObj = null) {
	if (!text || typeof text !== 'string') return '';
	const state = stateObj || (typeof require !== 'undefined' ? require('../state.js') : window);
	let resolvedKo = text;

	// 1. b_irregular
	resolvedKo = resolvedKo.replace(/([가-힣])\[b_irregular\]으\/(니까|면|면서|러|려고|려면|세|시|셔|셨|십|로|라고|므로|ㄹ|ㄴ)/g, (_, ch, s) => {
		const base = setFinal(ch, 0);
		return s === 'ㄴ' ? base + '운' : s === 'ㄹ' ? base + '울' : base + '우' + s;
	});
	resolvedKo = resolvedKo.replace(/([가-힣])\[b_irregular\](아\/어|았\/었)(요|서|어|도|야|라|던|)/g, (_, ch, h, s) => {
		const base = setFinal(ch, 0);
		const isW = (ch === '돕' || ch === '곱');
		const added = (h === "았/었") ? (isW ? "왔" : "웠") : (isW ? "와" : "워");
		return base + added + s;
	});

	// 2. l_irregular
	resolvedKo = resolvedKo.replace(/([가-힣])\[l_irregular\]으\/(니까|면|면서|러|려고|려면|세|시|셔|셨|십|로|라고|므로|ㄹ|ㄴ)/g, (_, ch, s) => {
		if (s === 'ㄴ') return setFinal(ch, 4);
		if (s === 'ㄹ') return ch;
		if (/^(면|면서|러|려고|려면|로|라고|므로)$/.test(s)) return ch + s;
		return setFinal(ch, 0) + s;
	});
	resolvedKo = resolvedKo.replace(/([가-힣])\[l_irregular\](는|나|니|냐)/g, (_, ch, s) => setFinal(ch, 0) + s);
	resolvedKo = resolvedKo.replace(/([가-힣])\[l_irregular\]습니다\/ㅂ니다/g, (_, ch) => setFinal(ch, 17) + "니다");

	// 3. d_irregular
	resolvedKo = resolvedKo.replace(/([가-힣])\[d_irregular\]으\/(니까|면|면서|러|려고|려면|세|시|셔|셨|십|로|라고|므로|ㄹ|ㄴ)/g, (_, ch, s) => {
		const withL = setFinal(ch, 8);
		return s === 'ㄴ' ? withL + '은' : s === 'ㄹ' ? withL + '을' : withL + '으' + s;
	});
	resolvedKo = resolvedKo.replace(/([가-힣])\[d_irregular\](아\/어|았\/었)(요|서|어|도|야|라|던|)/g, (_, ch, h, s) => setFinal(ch, 8) + h + s);

	// 4. eu_irregular
	resolvedKo = resolvedKo.replace(/([가-힣])\[eu_irregular\](아\/어|았\/었)(요|서|어|도|야|라|던|)/g, (match, ch, h, s) => {
		const idx = resolvedKo.indexOf(match);
		const prevVowel = idx > 0 ? getVowelHarmony(resolvedKo[idx - 1]) : '어';
		const d = decomposeHangul(ch);
		return composeHangul(d.initial, prevVowel === '아' ? 0 : 4, h === "았/었" ? 20 : 0) + s;
	});

	// 5. reu_irregular & reo_irregular
	resolvedKo = resolvedKo.replace(/([가-힣])르\[reu_irregular\](아\/어|았\/었)(요|서|어|도|야|라|던|)/g, (_, pre, h, s) => {
		const prevVowel = getVowelHarmony(pre);
		return setFinal(pre, 8) + composeHangul(5, prevVowel === '아' ? 0 : 4, h === "았/었" ? 20 : 0) + s;
	});
	resolvedKo = resolvedKo.replace(/([가-힣])르\[reo_irregular\](아\/어|았\/었)(요|서|어|도|야|라|던|)/g, (_, pre, h, s) => {
		return pre + "르" + (h === "았/었" ? "렀" : "러") + s;
	});

	// 6. h_irregular
	resolvedKo = resolvedKo.replace(/([가-힣])\[h_irregular\]으\/(니까|면|면서|러|려고|려면|세|시|셔|셨|십|로|라고|므로|ㄹ|ㄴ)/g, (_, ch, s) => {
		const base = setFinal(ch, 0);
		return s === 'ㄴ' ? setFinal(base, 4) : s === 'ㄹ' ? setFinal(base, 8) : base + s;
	});
	resolvedKo = resolvedKo.replace(/([가-힣])\[h_irregular\](아\/어|았\/었)(요|서|어|도|야|라|던|)/g, (_, ch, h, s) => {
		return composeHangul(decomposeHangul(ch).initial, 1, h === "았/었" ? 20 : 0) + s;
	});

	// 7. s_irregular
	resolvedKo = resolvedKo.replace(/([가-힣])\[s_irregular\]으\/(니까|면|면서|러|려고|려면|세|시|셔|셨|십|로|라고|므로|ㄹ|ㄴ)/g, (_, ch, s) => {
		const base = setFinal(ch, 0);
		return s === 'ㄴ' ? base + '은' : s === 'ㄹ' ? base + '을' : base + '으' + s;
	});
	resolvedKo = resolvedKo.replace(/([가-힣])\[s_irregular\](아\/어|았\/었)(요|서|어|도|야|라|던|)/g, (_, ch, h, s) => {
		const base = setFinal(ch, 0);
		const hv = getVowelHarmony(base);
		return base + '\u200B' + (h === "았/었" ? (hv === '아' ? '았' : '었') : hv) + s;
	});

	// Strip leftover conjugation markers
	resolvedKo = resolvedKo.replace(/\[[^\]]+\]/g, '');

	// Resolve particles based on previous character's batchim
	if (state && !state.particlePairsRegex && state.PARTICLE_PAIRS) {
		const keys = Object.keys(state.PARTICLE_PAIRS).sort((a, b) => b.length - a.length);
		if (keys.length > 0) {
			const escaped = keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
			state.particlePairsRegex = new RegExp(`([가-힣])(${escaped})`, 'g');
		}
	}
	if (state && state.particlePairsRegex && state.PARTICLE_PAIRS) {
		resolvedKo = resolvedKo.replace(state.particlePairsRegex, (_, ch, p) => {
			const pair = state.PARTICLE_PAIRS[p];
			return ch + (pair ? (hasBatchim(ch) ? pair[0] : pair[1]) : p);
		});
	}

	// Resolve contracted pronouns (protecting 나가다 verb connective stem: 나가 보다, 나가 주다, etc.)
	if (state && state.PRONOUN_REPLACEMENTS) {
		state.PRONOUN_REPLACEMENTS.forEach(([pat, rep]) => {
			if (String(pat).includes("나가")) {
				resolvedKo = resolvedKo.replace(/(^|[^가-힣])나가(?=[^가-힣]|$)(?!\s+(?:보|주|버리|있|계시))/g, '$1내가');
				return;
			}
			resolvedKo = resolvedKo.replace(pat, rep);
		});
	}

	// Resolve 이/예요 based on batchim
	resolvedKo = resolvedKo.replace(/([가-힣])이\/예요/g, (_, ch) => ch + (hasBatchim(ch) ? '이에요' : '예요'));

	// Resolve 습니다/ㅂ니다 based on batchim
	resolvedKo = resolvedKo.replace(/([가-힣])(습니다\/ㅂ니다|습니다|ㅂ니다)/g, (_, ch, ending) => {
		if (ending === "습니다/ㅂ니다") {
			const d = decomposeHangul(ch);
			if (d && d.final !== 0) {
				return d.final === 8 ? setFinal(ch, 17) + "니다" : ch + "습니다";
			}
			return setFinal(ch, 17) + "니다";
		}
		return ch + ending;
	});

	// Resolve 으/ㅂ시다 and (으)ㅂ시다 based on batchim
	resolvedKo = resolvedKo.replace(/([가-힣])(?:으\/ㅂ시다|\(으\)ㅂ시다)/g, (_, ch) => {
		const d = decomposeHangul(ch);
		if (d && d.final !== 0) {
			return d.final === 8 ? setFinal(ch, 17) + "시다" : ch + "읍시다";
		}
		return setFinal(ch, 17) + "시다";
	});

	// Resolve 아/어/았/었 vowel harmony and direct vowel stem contractions
	resolvedKo = resolvedKo.replace(/([가-힣])(아\/어|았\/었)(요|서|어|도|야|라|던|)/g, (_, ch, h, s) => {
		const d = decomposeHangul(ch);
		const hv = getVowelHarmony(ch);

		// If stem has no batchim, resolve contraction directly at insertion time
		if (d && d.final === 0) {
			if (ch === "하" || hv === "여") {
				if (h === "아/어") return "해" + s;
				if (h === "았/었") return "했" + s;
			}
			if (h === "아/어") {
				if (d.medial === 0) return ch + s; // ㅏ (가, 나, 사, 자, 타)
				if (d.medial === 8) return composeHangul(d.initial, 9, 0) + s; // ㅗ -> ㅘ (보 -> 봐, 오 -> 와)
				if (d.medial === 13) return composeHangul(d.initial, 14, 0) + s; // ㅜ -> ㅝ (주 -> 줘, 배우 -> 배워)
				if (d.medial === 20) return composeHangul(d.initial, 6, 0) + s; // ㅣ -> ㅕ (마시 -> 마셔, 기다리 -> 기다려)
				if ([1, 4, 5, 6].includes(d.medial)) return ch + s; // ㅐ, ㅓ, ㅔ, ㅕ
				if (d.medial === 18) return composeHangul(d.initial, 4, 0) + s; // ㅡ (크 -> 커, 쓰 -> 써)
			} else if (h === "았/었") {
				if (d.medial === 0) return composeHangul(d.initial, 0, 20) + s; // ㅏ -> 았 (갔, 났, 샀, 잤)
				if (d.medial === 8) return composeHangul(d.initial, 9, 20) + s; // ㅗ -> 왔/봤
				if (d.medial === 13) return composeHangul(d.initial, 14, 20) + s; // ㅜ -> 줬/배웠
				if (d.medial === 20) return composeHangul(d.initial, 6, 20) + s; // ㅣ -> 마셨/기다렸
				if ([1, 4, 5, 6].includes(d.medial)) return composeHangul(d.initial, d.medial, 20) + s; // 섰, 보냈, 켰
				if (d.medial === 18) return composeHangul(d.initial, 4, 20) + s; // 컸, 썼
			}
		}

		if (h === "았/었") {
			return ch + (hv === '여' ? '였' : hv === '아' ? '았' : '었') + s;
		}
		return ch + hv + s;
	});

	// Resolve 으 insertion and ㄹ-dropping before (세|시|셔|셨|십)
	resolvedKo = resolvedKo.replace(/([가-힣])으\/(니까|면|면서|러|려고|려면|세|시|셔|셨|십|로|라고|므로)/g, (_, ch, s) => {
		const d = decomposeHangul(ch);
		if (d && d.final === 8 && (s === '세' || s === '시' || s === '셔' || s === '셨' || s === '십')) {
			return setFinal(ch, 0) + s;
		}
		return ch + (d && d.final !== 0 && d.final !== 8 ? '으' : '') + s;
	});

	// Resolve (으)로, (으)므로, (으)시
	resolvedKo = resolvedKo.replace(/([가-힣])\(으\)로/g, (_, ch) => {
		const d = decomposeHangul(ch);
		return ch + (d && d.final !== 0 && d.final !== 8 ? '으로' : '로');
	});
	resolvedKo = resolvedKo.replace(/([가-힣])\(으\)므로/g, (_, ch) => {
		const d = decomposeHangul(ch);
		return ch + (d && d.final !== 0 && d.final !== 8 ? '으므로' : '므로');
	});
	resolvedKo = resolvedKo.replace(/([가-힣])\(으\)(시|세|셔|셨|십)/g, (_, ch, s) => {
		const d = decomposeHangul(ch);
		if (d && d.final === 8) return setFinal(ch, 0) + s;
		return ch + (d && d.final !== 0 && d.final !== 8 ? '으' : '') + s;
	});

	// Resolve 으/ㄹ, 으/ㄴ, (느)ㄴ다
	resolvedKo = resolvedKo.replace(/([가-힣])으\/ㄹ/g, (_, ch) => {
		const d = decomposeHangul(ch);
		if (d && d.final !== 0) return d.final === 8 ? ch : ch + '을';
		return setFinal(ch, 8);
	});
	resolvedKo = resolvedKo.replace(/([가-힣])으\/ㄴ/g, (_, ch) => {
		const d = decomposeHangul(ch);
		if (d && d.final !== 0) return d.final === 8 ? setFinal(ch, 4) : ch + '은';
		return setFinal(ch, 4);
	});
	resolvedKo = resolvedKo.replace(/([가-힣])(?:느\/ㄴ다|\(느\)ㄴ다)(고|)/g, (_, ch, quote) => {
		const q = quote || '';
		const d = decomposeHangul(ch);
		if (d && d.final !== 0) return (d.final === 8 ? setFinal(ch, 4) : ch + '는') + '다' + q;
		return setFinal(ch, 4) + '다' + q;
	});

	// Basic Vowel Contractions (exempting ㅅ-irregular roots from over-contracting)
	resolvedKo = resolvedKo.replace(/([가-힣])아(요|서|도|야|라|)/g, (m, ch, s) => {
		if (ch === '나' || ch === '지' || ch === '이' || ch === '저' || ch === '부' || ch === '그') return m;
		const d = decomposeHangul(ch);
		if (!d || d.final !== 0) return m;
		if (d.medial === 0) return ch + s;
		if (d.medial === 8) return composeHangul(d.initial, 9, 0) + s;
		return m;
	});
	resolvedKo = resolvedKo.replace(/([가-힣])았(어요|어|다가|던|습니다|다)/g, (m, ch, s) => {
		if (ch === '나' || ch === '지' || ch === '이' || ch === '저' || ch === '부' || ch === '그') return m;
		const d = decomposeHangul(ch);
		if (!d || d.final !== 0) return m;
		if (d.medial === 0) return composeHangul(d.initial, 0, 20) + s;
		if (d.medial === 8) return composeHangul(d.initial, 9, 20) + s;
		return m;
	});

	resolvedKo = resolvedKo.replace(/오아(요|서|도|야|라)/g, (_, s) => "와" + s);
	resolvedKo = resolvedKo.replace(/오았(어요|어|다가|던|습니다|다)/g, (_, s) => "왔" + s);
	resolvedKo = resolvedKo.replace(/하여(요|서|도|야|라|지|져|졌)/g, (_, s) => "해" + s);
	resolvedKo = resolvedKo.replace(/하였(어요|어|다가|던|습니다|다)/g, (_, s) => "했" + s);
	resolvedKo = resolvedKo.replace(/마시(아|어)(요|서|도|야|라)/g, (_, _v, s) => "마셔" + s);
	resolvedKo = resolvedKo.replace(/크(아|어)(요|서|도|야|라)/g, (_, _v, s) => "커" + s);
	resolvedKo = resolvedKo.replace(/([^을를\s])이어요/g, (m, ch) => hasBatchim(ch) ? ch + "이에요" : m);

	resolvedKo = resolvedKo.replace(/([가-힣])어(요|서|도|야|라|지|져|졌)/g, (m, ch, s) => {
		if (ch === '지' || ch === '이' || ch === '저' || ch === '부' || ch === '그') return m;
		const d = decomposeHangul(ch);
		if (!d || d.final !== 0) return m;
		if (d.medial === 20) return composeHangul(d.initial, 6, 0) + s;
		if (d.medial === 13) return composeHangul(d.initial, 14, 0) + s;
		if ([1, 4, 5, 6].includes(d.medial)) return ch + s;
		return m;
	});
	resolvedKo = resolvedKo.replace(/([가-힣])었(어요|어|다가|던|습니다|다)/g, (m, ch, s) => {
		if (ch === '지' || ch === '이' || ch === '저' || ch === '부' || ch === '그') return m;
		const d = decomposeHangul(ch);
		if (!d || d.final !== 0) return m;
		if (d.medial === 20) return composeHangul(d.initial, 6, 20) + s;
		if (d.medial === 13) return composeHangul(d.initial, 14, 20) + s;
		if ([1, 4, 5, 6].includes(d.medial)) return composeHangul(d.initial, d.medial, 20) + s;
		return m;
	});

	if (state && state.BARE_TIME_WORDS_NO_PARTICLE && state.BARE_TIME_WORDS_NO_PARTICLE.size > 0) {
		for (const bare of state.BARE_TIME_WORDS_NO_PARTICLE) {
			const deicticRegex = new RegExp(`(^|[^가-힣])(${bare})에([^가-힣]|$)`, 'g');
			resolvedKo = resolvedKo.replace(deicticRegex, '$1$2$3');
		}
	}

	return resolvedKo.replace(/\u200B/g, '');
}

const stemEngineExports = {
	getConjugatedStem,
	conjugateAoStem,
	deriveConnectiveEndings,
	resolvePureMorphology
};

if (typeof window !== 'undefined') {
	Object.assign(window, stemEngineExports);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = stemEngineExports;
}
})();
