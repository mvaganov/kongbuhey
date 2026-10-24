/**
 * Korean Morphology Engine, Verb Conjugation & Phonology
 *
 * Implements:
 * 1. Standard Korean Pronunciation (표준 발음법) phonological assimilation.
 * 2. Regular and irregular verb/adjective stem conjugation.
 * 3. Case particle attachment with batchim harmony and honorific suppletion.
 * 4. Honorific and Temporal concordance validators and repair routines.
 */

let dataModule;
if (typeof require !== 'undefined') {
	try {
		dataModule = require('../../data.js');
	} catch (e) {
		dataModule = typeof window !== 'undefined' ? window : {};
	}
} else {
	dataModule = typeof window !== 'undefined' ? window : {};
}

const state = (typeof require !== 'undefined' ? require('../state.js') : window);
const {
	DATA_SCHEMA,
	hasTag,
	parseSemanticVector,
	getStem,
	decomposeHangul,
	composeHangul,
	setFinal,
	hasBatchim,
	hasRieulBatchim,
	getVowelHarmony
} = (typeof require !== 'undefined' ? require('./primitives.js') : window);

const {
	FINAL_TO_INITIAL,
	TENSIFY_INITIAL,
	NASAL_VERB_ROOTS,
	DOUBLE_CODA_LIAISON,
	DOUBLE_CODA_SIMPLIFY,
	H_ONSET_MAP,
	NASAL_CODA
} = (typeof require !== 'undefined' ? require('../specs/pronunciation_rules.js') : window);

const { ACTION_VERB_SPECS, DESCRIPTIVE_VERB_SPECS } =
	(typeof require !== 'undefined' ? require('../specs/verb_argument_specs.js') : window);

const { parseAndValidateCollocationFilter } =
	(typeof require !== 'undefined' ? require('../utils/filter_evaluator.js') : window);

// Concord repair delegators (dynamically resolved or injected to avoid circular dependency)
let concordRepairs = {
	applyCounterConcord: (t) => {
		try {
			const mod = typeof require !== 'undefined' ? require('../concord/classifier_concord.js') : window;
			return mod.applyCounterConcord ? mod.applyCounterConcord(t) : t;
		} catch (e) { return t; }
	},
	applySpatialConcord: (t) => {
		try {
			const mod = typeof require !== 'undefined' ? require('../concord/spatial_concord.js') : window;
			return mod.applySpatialConcord ? mod.applySpatialConcord(t) : t;
		} catch (e) { return t; }
	},
	applyMoodConcord: (t) => {
		try {
			const mod = typeof require !== 'undefined' ? require('../concord/mood_concord.js') : window;
			return mod.applyMoodConcord ? mod.applyMoodConcord(t) : t;
		} catch (e) { return t; }
	},
	applyAdverbConcord: (t) => {
		try {
			const mod = typeof require !== 'undefined' ? require('../concord/adverbial_concord.js') : window;
			return mod.applyAdverbConcord ? mod.applyAdverbConcord(t) : t;
		} catch (e) { return t; }
	},
	applyClausalConcord: (t) => {
		try {
			const mod = typeof require !== 'undefined' ? require('../concord/clausal_generator.js') : window;
			return mod.applyClausalConcord ? mod.applyClausalConcord(t) : t;
		} catch (e) { return t; }
	}
};

function registerConcordRepairs(repairs) {
	concordRepairs = { ...concordRepairs, ...repairs };
}

// =========================================================================
// Standard Korean Pronunciation (표준 발음법) Engine
// =========================================================================

function getPronunciationWord(word) {
	const chars = [];
	const hangulIndices = [];
	for (let i = 0; i < word.length; i++) {
		const d = decomposeHangul(word[i]);
		if (d) { chars.push(d); hangulIndices.push(chars.length - 1); }
		else { chars.push(word[i]); }
	}
	if (hangulIndices.length === 0) return word;

	const H = hangulIndices.map(idx => chars[idx]);
	const originalSyllables = hangulIndices.map(idx => word[idx]);

	// Pass 1: Consonant + ㅢ -> ㅣ
	for (let i = 0; i < H.length; i++) {
		if (H[i].initial !== 11 && H[i].medial === 19) H[i].medial = 20;
	}

	// Pass 2: Palatalization
	for (let i = 0; i < H.length - 1; i++) {
		const cur = H[i], next = H[i + 1];
		if (next.initial === 11 && (next.medial === 20 || next.medial === 6)) {
			if (cur.final === 7) { cur.final = 0; next.initial = 12; }
			else if (cur.final === 25) { cur.final = 0; next.initial = 14; }
			else if (cur.final === 13) { cur.final = 8; next.initial = 14; }
		} else if (next.initial === 18 && (next.medial === 20 || next.medial === 6) && cur.final === 7) {
			cur.final = 0; next.initial = 14;
		}
	}

	// Pass 3: ㅎ assimilation & merging
	for (let i = 0; i < H.length - 1; i++) {
		const cur = H[i], next = H[i + 1];
		if (cur.final === 27 || cur.final === 6 || cur.final === 15) {
			const isH = cur.final === 27, isNh = cur.final === 6;
			const baseFinal = isH ? 0 : (isNh ? 4 : 8);
			if (next.initial === 11) {
				cur.final = 0;
				if (!isH) next.initial = isNh ? 2 : 5;
			} else if (next.initial === 0) { cur.final = baseFinal; next.initial = 15; }
			else if (next.initial === 3) { cur.final = baseFinal; next.initial = 16; }
			else if (next.initial === 12) { cur.final = baseFinal; next.initial = 14; }
			else if (next.initial === 9) { cur.final = baseFinal; next.initial = 10; }
			else if (next.initial === 2) {
				cur.final = isH ? 4 : baseFinal;
				if (!isH && !isNh) next.initial = 5;
			}
		} else if (next.initial === 18 && H_ONSET_MAP[cur.final]) {
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

	// Pass 5: Liaison
	for (let i = 0; i < H.length - 1; i++) {
		const cur = H[i], next = H[i + 1];
		if (cur.final > 0 && cur.final !== 21 && next.initial === 11) {
			if (FINAL_TO_INITIAL[cur.final] !== undefined) {
				next.initial = FINAL_TO_INITIAL[cur.final];
				cur.final = 0;
			} else if (DOUBLE_CODA_LIAISON[cur.final]) {
				[cur.final, next.initial] = DOUBLE_CODA_LIAISON[cur.final];
			}
		}
	}

	// Pass 6: Coda Simplification / Neutralization
	for (let i = 0; i < H.length; i++) {
		const cur = H[i], next = (i < H.length - 1) ? H[i + 1] : null;
		if (cur.final > 0) {
			if (DOUBLE_CODA_SIMPLIFY[cur.final]) {
				cur.final = DOUBLE_CODA_SIMPLIFY[cur.final];
			} else if (cur.final === 11) {
				cur.final = originalSyllables[i] === '밟' ? 17 : 8;
			} else if (cur.final === 9) {
				cur.final = (next && next.initial === 0) ? 8 : 1;
			}

			if (cur.final === 2 || cur.final === 24) cur.final = 1;
			else if ([19, 20, 22, 23, 25, 27].includes(cur.final)) cur.final = 7;
			else if (cur.final === 26) cur.final = 17;
		}
	}

	// Pass 7: Tensification
	for (let i = 0; i < H.length - 1; i++) {
		const cur = H[i], next = H[i + 1];
		if (cur.final === 1 || cur.final === 7 || cur.final === 17) {
			if (TENSIFY_INITIAL[next.initial] !== undefined) next.initial = TENSIFY_INITIAL[next.initial];
		} else if ((cur.final === 4 || cur.final === 16) && NASAL_VERB_ROOTS.has(originalSyllables[i])) {
			const nextOrig = decomposeHangul(originalSyllables[i + 1]);
			if (nextOrig && nextOrig.initial !== 11 && TENSIFY_INITIAL[next.initial] !== undefined) {
				next.initial = TENSIFY_INITIAL[next.initial];
			}
		} else if (cur.final === 8) {
			if (next.initial === 0 && next.medial === 4) next.initial = 1;
			else if (next.initial === 9 && next.medial === 13) next.initial = 10;
			else if (next.initial === 12 && next.medial === 13) next.initial = 13;
		}
	}

	// Pass 8: Nasalization
	for (let i = 0; i < H.length - 1; i++) {
		const cur = H[i], next = H[i + 1];
		if (next.initial === 5) {
			if (cur.final === 16 || cur.final === 21) next.initial = 2;
			else if (NASAL_CODA[cur.final]) { cur.final = NASAL_CODA[cur.final]; next.initial = 2; }
		}
		if ((next.initial === 2 || next.initial === 6) && NASAL_CODA[cur.final]) {
			cur.final = NASAL_CODA[cur.final];
		}
	}

	// Pass 9: Lateralization
	for (let i = 0; i < H.length - 1; i++) {
		const cur = H[i], next = H[i + 1];
		if (cur.final === 4 && next.initial === 5) cur.final = 8;
		else if (cur.final === 8 && next.initial === 2) next.initial = 5;
	}

	for (let i = 0; i < hangulIndices.length; i++) {
		chars[hangulIndices[i]] = composeHangul(H[i].initial, H[i].medial, H[i].final);
	}
	return chars.join('');
}

function getPronunciation(text) {
	if (!text || typeof text !== 'string') return text;
	return text.replace(/([가-힣]+)/g, m => getPronunciationWord(m));
}

// =========================================================================
// Morphology & Phonological Attachment
// =========================================================================

function applyMorphology(text) {
	let resolvedKo = text;

	// Irregular Verbs
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
	if (!state.particlePairsRegex && state.PARTICLE_PAIRS) {
		const keys = Object.keys(state.PARTICLE_PAIRS).sort((a, b) => b.length - a.length);
		if (keys.length > 0) {
			const escaped = keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
			state.particlePairsRegex = new RegExp(`([가-힣])(${escaped})`, 'g');
		}
	}
	if (state.particlePairsRegex && state.PARTICLE_PAIRS) {
		resolvedKo = resolvedKo.replace(state.particlePairsRegex, (_, ch, p) => {
			const pair = state.PARTICLE_PAIRS[p];
			return ch + (pair ? (hasBatchim(ch) ? pair[0] : pair[1]) : p);
		});
	}

	// Resolve contracted pronouns
	(state.PRONOUN_REPLACEMENTS || []).forEach(([pat, rep]) => { resolvedKo = resolvedKo.replace(pat, rep); });

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

	// Resolve 아/어/았/었 vowel harmony
	resolvedKo = resolvedKo.replace(/([가-힣])(아\/어|았\/었)(요|서|어|도|야|라|던|)/g, (_, ch, h, s) => {
		const hv = getVowelHarmony(ch);
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

	// Resolve (으)로 based on batchim
	resolvedKo = resolvedKo.replace(/([가-힣])\(으\)로/g, (_, ch) => {
		const d = decomposeHangul(ch);
		return ch + (d && d.final !== 0 && d.final !== 8 ? '으로' : '로');
	});

	// Resolve (으)므로 based on batchim
	resolvedKo = resolvedKo.replace(/([가-힣])\(으\)므로/g, (_, ch) => {
		const d = decomposeHangul(ch);
		return ch + (d && d.final !== 0 && d.final !== 8 ? '으므로' : '므로');
	});

	// Resolve (으)시 / (으)세 / (으)십 / (으)셨 based on batchim
	resolvedKo = resolvedKo.replace(/([가-힣])\(으\)(시|세|셔|셨|십)/g, (_, ch, s) => {
		const d = decomposeHangul(ch);
		if (d && d.final === 8) return setFinal(ch, 0) + s;
		return ch + (d && d.final !== 0 && d.final !== 8 ? '으' : '') + s;
	});

	// Resolve 으/ㄹ
	resolvedKo = resolvedKo.replace(/([가-힣])으\/ㄹ/g, (_, ch) => {
		const d = decomposeHangul(ch);
		if (d && d.final !== 0) return d.final === 8 ? ch : ch + '을';
		return setFinal(ch, 8);
	});

	// Resolve 으/ㄴ
	resolvedKo = resolvedKo.replace(/([가-힣])으\/ㄴ/g, (_, ch) => {
		const d = decomposeHangul(ch);
		if (d && d.final !== 0) return d.final === 8 ? setFinal(ch, 4) : ch + '은';
		return setFinal(ch, 4);
	});

	// Resolve (느)ㄴ다(고)
	resolvedKo = resolvedKo.replace(/([가-힣])(?:느\/ㄴ다|\(느\)ㄴ다)(고|)/g, (_, ch, quote) => {
		const q = quote || '';
		const d = decomposeHangul(ch);
		if (d && d.final !== 0) return (d.final === 8 ? setFinal(ch, 4) : ch + '는') + '다' + q;
		return setFinal(ch, 4) + '다' + q;
	});

	// Basic Vowel Contractions
	resolvedKo = resolvedKo.replace(/([가-힣])아(요|서|도|야|라|)/g, (m, ch, s) => {
		const d = decomposeHangul(ch);
		if (!d || d.final !== 0) return m;
		if (d.medial === 0) return ch + s; // ㅏ
		if (d.medial === 8) return composeHangul(d.initial, 9, 0) + s; // ㅗ -> ㅘ
		return m;
	});

	resolvedKo = resolvedKo.replace(/([가-힣])았(어요|어|다가|던|습니다|다)/g, (m, ch, s) => {
		const d = decomposeHangul(ch);
		if (!d || d.final !== 0) return m;
		if (d.medial === 0) return composeHangul(d.initial, 0, 20) + s; // ㅏ -> 았
		if (d.medial === 8) return composeHangul(d.initial, 9, 20) + s; // ㅗ -> 왔
		return m;
	});

	resolvedKo = resolvedKo.replace(/오아(요|서|도|야|라)/g, (m, s) => "와" + s);
	resolvedKo = resolvedKo.replace(/오았(어요|어|다가|던|습니다|다)/g, (m, s) => "왔" + s);
	resolvedKo = resolvedKo.replace(/하여(요|서|도|야|라|지|져|졌)/g, (m, s) => "해" + s);
	resolvedKo = resolvedKo.replace(/하였(어요|어|다가|던|습니다|다)/g, (m, s) => "했" + s);
	resolvedKo = resolvedKo.replace(/마시(아|어)(요|서|도|야|라)/g, (m, v, s) => "마셔" + s);
	resolvedKo = resolvedKo.replace(/크(아|어)(요|서|도|야|라)/g, (m, v, s) => "커" + s);
	resolvedKo = resolvedKo.replace(/이어요/g, "이에요");

	resolvedKo = resolvedKo.replace(/([가-힣])어(요|서|도|야|라|지|져|졌)/g, (m, ch, s) => {
		const d = decomposeHangul(ch);
		if (!d || d.final !== 0) return m;
		if (d.medial === 20) return composeHangul(d.initial, 6, 0) + s; // ㅣ -> ㅕ
		if (d.medial === 13) return composeHangul(d.initial, 14, 0) + s; // ㅜ -> ㅝ
		if ([1, 4, 5, 6].includes(d.medial)) return ch + s; // ㅐ, ㅓ, ㅔ, ㅕ
		return m;
	});

	resolvedKo = resolvedKo.replace(/([가-힣])었(어요|어|다가|던|습니다|다)/g, (m, ch, s) => {
		const d = decomposeHangul(ch);
		if (!d || d.final !== 0) return m;
		if (d.medial === 20) return composeHangul(d.initial, 6, 20) + s; // ㅣ -> 였
		if (d.medial === 13) return composeHangul(d.initial, 14, 20) + s; // ㅜ -> 웠
		if ([1, 4, 5, 6].includes(d.medial)) return composeHangul(d.initial, d.medial, 20) + s;
		return m;
	});

	if (state.BARE_TIME_WORDS_NO_PARTICLE && state.BARE_TIME_WORDS_NO_PARTICLE.size > 0) {
		for (const bare of state.BARE_TIME_WORDS_NO_PARTICLE) {
			const deicticRegex = new RegExp(`(^|[^가-힣])(${bare})에([^가-힣]|$)`, 'g');
			resolvedKo = resolvedKo.replace(deicticRegex, '$1$2$3');
		}
	}

	// Concord repairs delegation
	if (concordRepairs.applyCounterConcord) resolvedKo = concordRepairs.applyCounterConcord(resolvedKo);
	if (concordRepairs.applySpatialConcord) resolvedKo = concordRepairs.applySpatialConcord(resolvedKo);
	if (concordRepairs.applyMoodConcord) resolvedKo = concordRepairs.applyMoodConcord(resolvedKo);
	if (concordRepairs.applyAdverbConcord) resolvedKo = concordRepairs.applyAdverbConcord(resolvedKo);
	if (concordRepairs.applyClausalConcord) resolvedKo = concordRepairs.applyClausalConcord(resolvedKo);

	resolvedKo = resolvedKo.replace(/\u200B/g, '');
	return resolvedKo;
}

// =========================================================================
// Particle Attachment Engine
// =========================================================================

function attachParticle(noun, particleType, verb = null, options = {}) {
	const nounUnit = getNounUnit(noun);
	const nounKo = typeof noun === 'string' ? noun : (nounUnit ? nounUnit[DATA_SCHEMA.Korean] : "");
	if (!nounKo) return "";

	const lastChar = nounKo.trim().slice(-1);
	const hasB = hasBatchim(lastChar);
	const hasRieul = hasRieulBatchim(lastChar);
	const verbUnit = getVerbUnit(verb);
	const verbKo = verbUnit ? verbUnit[DATA_SCHEMA.Korean] : (typeof verb === 'string' ? verb : "");

	switch (particleType) {
		case "object":
		case "accusative":
		case "obj":
			return nounKo + (hasB ? "을" : "를");

		case "subject":
		case "nominative":
		case "sub":
			if (options.honorific === true || (options.allowHonorificSubject && isElderNoun(nounUnit, nounKo))) {
				return nounKo + "께서";
			}
			return nounKo + (hasB ? "이" : "가");

		case "subject_honorific":
		case "honorific_subject":
			return nounKo + "께서";

		case "topic":
			if (options.honorific === true) {
				return nounKo + "께서는";
			}
			return nounKo + (hasB ? "은" : "는");

		case "topic_honorific":
		case "honorific_topic":
			return nounKo + "께서는";

		case "dative": {
			const isHumble = (verbUnit && hasTag(verbUnit, "humbleVerb", "dative_humble")) || state.HUMBLE_DATIVE_VERBS.has(verbKo);
			if (options.dativeType === "honorific" || options.honorific === true || isElderNoun(nounUnit, nounKo) || isHumble) {
				return nounKo + "께";
			}
			if (options.dativeType === "inanimate" || isInanimateInstitution(nounUnit, nounKo)) {
				return nounKo + "에";
			}
			if (options.dativeType === "spoken" || options.spoken === true || options.formality === "spoken") {
				return nounKo + "한테";
			}
			return nounKo + "에게";
		}

		case "dative_honorific":
			return nounKo + "께";

		case "dative_inanimate":
			return nounKo + "에";

		case "dative_spoken":
			return nounKo + "한테";

		case "dative_person":
		case "dative_animate":
			return (options.spoken === true || options.formality === "spoken") ? nounKo + "한테" : nounKo + "에게";

		case "location":
		case "locative": {
			if (options.locativeType === "dynamic" || options.locativeType === "origin") return nounKo + "에서";
			if (options.locativeType === "static" || options.locativeType === "goal" || options.locativeType === "destination") return nounKo + "에";

			if (verbUnit || verbKo) {
				const isOrigin = (verbUnit && hasTag(verbUnit, "origin", "departure", "locative_origin")) || state.ORIGIN_VERBS.has(verbKo);
				if (isOrigin) return nounKo + "에서";

				const isAllative = (verbUnit && hasTag(verbUnit, "allative", "destination", "goal", "locative_goal")) || state.ALLATIVE_GOAL_VERBS.has(verbKo);
				if (isAllative) return nounKo + "에";

				const isStatic = (verbUnit && hasTag(verbUnit, "static", "existence", "residence", "locative_static")) || state.STATIC_EXISTENCE_VERBS.has(verbKo);
				if (isStatic) return nounKo + "에";

				const pos = verbUnit ? verbUnit[DATA_SCHEMA.PartofSpeech] : "";
				if (pos === "Action Verb" || (!pos && !state.ALLATIVE_GOAL_VERBS.has(verbKo) && !state.STATIC_EXISTENCE_VERBS.has(verbKo))) {
					return nounKo + "에서";
				}
			}
			return nounKo + "에";
		}

		case "location_dynamic":
		case "dynamic_location":
			return nounKo + "에서";

		case "location_static":
		case "static_location":
			return nounKo + "에";

		case "location_origin":
		case "origin":
		case "departure":
			return nounKo + "에서";

		case "location_goal":
		case "destination":
		case "allative":
			return nounKo + "에";

		case "instrumental":
		case "instrument":
		case "direction":
		case "-(으)로":
		case "로":
			return nounKo + (!hasB || hasRieul ? "로" : "으로");

		case "comitative":
		case "and_with":
			if (options.spoken === true || options.formality === "spoken") return nounKo + "하고";
			if (options.formality === "informal") return nounKo + (hasB ? "이랑" : "랑");
			return nounKo + (hasB ? "과" : "와");

		case "source_person":
		case "ablative_person":
			return (options.spoken === true || options.formality === "spoken") ? nounKo + "한테서" : nounKo + "에게서";

		case "genitive":
			return nounKo + "의";

		case "additive":
			return nounKo + "도";

		case "plural":
			return nounKo + "들";

		case "time":
		case "temporal":
			if (isDeicticTimeWord(nounUnit, nounKo)) {
				return (options.topic === true) ? nounKo + (hasB ? "은" : "는") : nounKo;
			}
			return nounKo + "에";

		default:
			return nounKo;
	}
}

// =========================================================================
// Predicate Conjugation & Mood Builders
// =========================================================================

function getConjugatedStem(koreanWord, conjugation) {
	let stem = getStem(koreanWord);
	if (conjugation && conjugation !== "regular" && conjugation !== "" && /^[a-z_]+$/.test(conjugation)) {
		stem += `[${conjugation}]`;
	}
	return stem;
}

function isDescriptiveVerb(verbOrKo) {
	if (!verbOrKo) return false;
	const verbUnit = getVerbUnit(verbOrKo);
	if (verbUnit) {
		return verbUnit[DATA_SCHEMA.PartofSpeech] === "Descriptive Verb" || hasTag(verbUnit, "descriptive_verb");
	}
	const ko = typeof verbOrKo === 'string' ? verbOrKo : "";
	const getWords = dataModule.getWords || (typeof window !== 'undefined' ? window.getWords : () => []);
	const dv = getWords("Descriptive Verb").find(v => v[DATA_SCHEMA.Korean] === ko);
	return !!dv;
}

function isActionVerb(verbOrKo) {
	if (!verbOrKo) return false;
	const verbUnit = getVerbUnit(verbOrKo);
	if (verbUnit) {
		return verbUnit[DATA_SCHEMA.PartofSpeech] === "Action Verb" || hasTag(verbUnit, "action_verb");
	}
	const ko = typeof verbOrKo === 'string' ? verbOrKo : "";
	const getWords = dataModule.getWords || (typeof window !== 'undefined' ? window.getWords : () => []);
	const av = getWords("Action Verb").find(v => v[DATA_SCHEMA.Korean] === ko);
	return !!av;
}

function canTakeMood(verbOrKo, mood) {
	if (!verbOrKo) return false;
	const isUnit = Array.isArray(verbOrKo);
	const verbUnit = isUnit ? verbOrKo : getVerbUnit(verbOrKo);
	const ko = typeof verbOrKo === 'string' ? verbOrKo : (verbUnit ? verbUnit[DATA_SCHEMA.Korean] : "");
	const pos = verbUnit ? verbUnit[DATA_SCHEMA.PartofSpeech] : "";

	let isAction = false;
	let isDescriptive = false;

	if (isUnit) {
		isAction = pos === "Action Verb" || hasTag(verbUnit, "action_verb");
		isDescriptive = pos === "Descriptive Verb" || hasTag(verbUnit, "descriptive_verb");
	} else {
		isAction = pos === "Action Verb" || isActionVerb(ko);
		isDescriptive = pos === "Descriptive Verb" || (isDescriptiveVerb(ko) && !isAction);
	}

	const normalizedMood = (mood || "").toLowerCase();

	if ((normalizedMood === "negation" || normalizedMood === "short_negation" || normalizedMood === "long_negation") && state.FORBIDDEN_NEGATIVE_ROOTS.has(ko)) {
		return false;
	}

	if (normalizedMood === "imperative" || normalizedMood === "prohibition" || normalizedMood === "propositive" || normalizedMood === "suggestion") {
		return isAction && !isDescriptive;
	}

	if (normalizedMood === "inability" || normalizedMood === "short_inability" || normalizedMood === "long_inability") {
		return isAction && !isDescriptive;
	}

	if (normalizedMood === "volitional" || normalizedMood === "desire") {
		return isAction && !isDescriptive;
	}

	if (normalizedMood === "negation" || normalizedMood === "short_general" || normalizedMood === "long_general") {
		return !state.FORBIDDEN_NEGATIVE_ROOTS.has(ko);
	}

	return true;
}

function getNegationSuppletion(verbOrKo) {
	const ko = typeof verbOrKo === 'string' ? verbOrKo : (verbOrKo ? verbOrKo[DATA_SCHEMA.Korean] : "");
	return state.NEGATION_SUPPLETIONS.get(ko) || null;
}

function getAffirmativeCounterpart(verbOrKo) {
	const ko = typeof verbOrKo === 'string' ? verbOrKo : (verbOrKo ? verbOrKo[DATA_SCHEMA.Korean] : "");
	return state.AFFIRMATIVE_COUNTERPARTS.get(ko) || null;
}

function conjugatePredicate(verbOrKo, formality = "polite", tense = "present") {
	const verbUnit = getVerbUnit(verbOrKo);
	const ko = typeof verbOrKo === 'string' ? verbOrKo : (verbUnit ? verbUnit[DATA_SCHEMA.Korean] : "");
	if (!ko) return "";
	const conj = verbUnit ? verbUnit[DATA_SCHEMA.Conjugation] : "";
	const stem = getConjugatedStem(ko, conj);
	const isAction = verbUnit ? verbUnit[DATA_SCHEMA.PartofSpeech] === "Action Verb" : isActionVerb(ko);

	if (tense === "past") {
		switch (formality) {
			case "formal":
			case "formal_polite":
				return applyMorphology(stem + "았/었습니다");
			case "plain":
				return applyMorphology(stem + "았/었다");
			case "polite":
			case "polite_informal":
			default:
				return applyMorphology(stem + "았/었어요");
		}
	} else if (tense === "future") {
		switch (formality) {
			case "formal":
			case "formal_polite":
				return applyMorphology(stem + "으/ㄹ 것입니다");
			case "plain":
				return applyMorphology(stem + "으/ㄹ 것이다");
			case "polite":
			case "polite_informal":
			default:
				return applyMorphology(stem + "으/ㄹ 거예요");
		}
	} else {
		switch (formality) {
			case "formal":
			case "formal_polite":
				return applyMorphology(stem + "습니다/ㅂ니다");
			case "plain":
				return isAction ? applyMorphology(stem + "(느)ㄴ다") : (stem + "다");
			case "stem":
				return stem;
			case "polite":
			case "polite_informal":
			default:
				return applyMorphology(stem + "아/어요");
		}
	}
}

function buildNegatedPredicate(verbOrKo, options = {}) {
	const verbUnit = getVerbUnit(verbOrKo);
	const ko = typeof verbOrKo === 'string' ? verbOrKo : (verbUnit ? verbUnit[DATA_SCHEMA.Korean] : "");
	if (!ko) return "";

	const formality = options.formality || "polite";
	const tense = options.tense || "present";
	const isInability = !!options.inability || options.type === "inability";
	const isLong = options.type === "long";

	const suppletive = getNegationSuppletion(ko);
	if (suppletive) {
		return conjugatePredicate(suppletive, formality, tense);
	}

	if (isInability) {
		if (!canTakeMood(ko, "inability")) {
			throw new Error(`Descriptive verb '${ko}' cannot take inability negation (못 / -지 못하다).`);
		}
		const conj = verbUnit ? verbUnit[DATA_SCHEMA.Conjugation] : "";
		const stem = getConjugatedStem(ko, conj);
		if (isLong) {
			return applyMorphology(stem + "지 " + conjugatePredicate("못하다", formality, tense));
		} else {
			return "못 " + conjugatePredicate(ko, formality, tense);
		}
	}

	const conj = verbUnit ? verbUnit[DATA_SCHEMA.Conjugation] : "";
	const stem = getConjugatedStem(ko, conj);
	if (isLong) {
		return applyMorphology(stem + "지 " + conjugatePredicate("않다", formality, tense));
	} else {
		return "안 " + conjugatePredicate(ko, formality, tense);
	}
}

function buildMoodPredicate(verbOrKo, mood, formality = "polite", options = {}) {
	const verbUnit = getVerbUnit(verbOrKo);
	const ko = typeof verbOrKo === 'string' ? verbOrKo : (verbUnit ? verbUnit[DATA_SCHEMA.Korean] : "");
	if (!ko) return "";

	const normalizedMood = (mood || "").toLowerCase();

	if (!canTakeMood(ko, normalizedMood)) {
		throw new Error(`Verb '${ko}' cannot take mood '${mood}'. Descriptive verbs are restricted from imperative, propositive, inability, and volitional moods.`);
	}

	const conj = verbUnit ? verbUnit[DATA_SCHEMA.Conjugation] : "";
	const stem = getConjugatedStem(ko, conj);
	const rawStem = getStem(ko);

	switch (normalizedMood) {
		case "imperative": {
			switch (formality) {
				case "formal":
				case "formal_polite":
				case "formal_high":
					return applyMorphology(stem + "으/십시오");
				case "plain":
				case "informal":
					return applyMorphology(stem + "아/어라");
				case "polite":
				default:
					return applyMorphology(stem + "으/세요");
			}
		}
		case "prohibition": {
			switch (formality) {
				case "formal":
				case "formal_polite":
				case "formal_high":
					return rawStem + "지 마십시오";
				case "plain":
				case "informal":
					return options.plainEnding === "마라" ? (rawStem + "지 마라") : (rawStem + "지 마");
				case "polite":
				default:
					return rawStem + "지 마세요";
			}
		}
		case "propositive": {
			switch (formality) {
				case "formal":
				case "formal_polite":
				case "formal_high":
					return applyMorphology(stem + "으/ㅂ시다");
				case "suggestion":
					return applyMorphology(stem + "으/ㄹ까요?");
				case "plain":
				case "informal":
				default:
					return rawStem + "자";
			}
		}
		case "volitional":
		case "desire": {
			const isThirdPerson = options.person === 3 || options.perspective === "3rd";
			if (isThirdPerson) {
				switch (formality) {
					case "formal":
					case "formal_polite":
					case "formal_high":
						return rawStem + "고 싶어합니다";
					case "plain":
						return rawStem + "고 싶어한다";
					case "polite":
					default:
						return rawStem + "고 싶어해요";
				}
			} else {
				switch (formality) {
					case "formal":
					case "formal_polite":
					case "formal_high":
						return rawStem + "고 싶습니다";
					case "plain":
						return rawStem + "고 싶다";
					case "polite":
					default:
						return rawStem + "고 싶어요";
				}
			}
		}
		default:
			return conjugatePredicate(ko, formality, options.tense || "present");
	}
}

// =========================================================================
// Lookup Map Caches & Query Helpers
// =========================================================================

let nounLookupMap = null;
let allNounsMap = null;
let verbLookupMap = null;

function getNounUnit(nounOrKo) {
	if (Array.isArray(nounOrKo)) return nounOrKo;
	if (typeof nounOrKo !== 'string') return null;
	const getWords = dataModule.getWords || (typeof window !== 'undefined' ? window.getWords : () => []);
	if (!nounLookupMap) {
		nounLookupMap = new Map();
		const nouns = getWords("Noun");
		for (const n of nouns) {
			const ko = n[DATA_SCHEMA.Korean];
			if (!nounLookupMap.has(ko)) nounLookupMap.set(ko, n);
		}
	}
	return nounLookupMap.get(nounOrKo) || null;
}

function getAllNounUnits(nounOrKo) {
	if (Array.isArray(nounOrKo)) return [nounOrKo];
	if (typeof nounOrKo !== 'string') return [];
	const getWords = dataModule.getWords || (typeof window !== 'undefined' ? window.getWords : () => []);
	if (!allNounsMap) {
		allNounsMap = new Map();
		const nouns = getWords("Noun");
		for (const n of nouns) {
			const ko = n[DATA_SCHEMA.Korean];
			if (!allNounsMap.has(ko)) allNounsMap.set(ko, []);
			allNounsMap.get(ko).push(n);
		}
	}
	return allNounsMap.get(nounOrKo) || [];
}

function getVerbUnit(verbOrKo) {
	if (Array.isArray(verbOrKo)) return verbOrKo;
	if (typeof verbOrKo !== 'string') return null;
	const getWords = dataModule.getWords || (typeof window !== 'undefined' ? window.getWords : () => []);
	if (!verbLookupMap) {
		verbLookupMap = new Map();
		const verbs = [...getWords("Action Verb"), ...getWords("Descriptive Verb")];
		for (const v of verbs) {
			const ko = v[DATA_SCHEMA.Korean];
			if (!verbLookupMap.has(ko)) verbLookupMap.set(ko, v);
		}
	}
	return verbLookupMap.get(verbOrKo) || null;
}

// =========================================================================
// Honorifics & Social Deixis Helpers
// =========================================================================

function getHonorificVerb(verbOrKo) {
	const ko = typeof verbOrKo === 'string' ? verbOrKo : (verbOrKo ? verbOrKo[DATA_SCHEMA.Korean] : "");
	return state.HONORIFIC_VERB_SUPPLETIONS.get(ko) || null;
}

function getHumbleVerb(verbOrKo) {
	const ko = typeof verbOrKo === 'string' ? verbOrKo : (verbOrKo ? verbOrKo[DATA_SCHEMA.Korean] : "");
	return state.HUMBLE_VERB_SUPPLETIONS.get(ko) || null;
}

function getHonorificNoun(nounOrKo) {
	const ko = typeof nounOrKo === 'string' ? nounOrKo : (nounOrKo ? nounOrKo[DATA_SCHEMA.Korean] : "");
	return state.HONORIFIC_NOUN_SUPPLETIONS.get(ko) || null;
}

function getHumblePronoun(pronounOrKo) {
	const ko = typeof pronounOrKo === 'string' ? pronounOrKo : (pronounOrKo ? pronounOrKo[DATA_SCHEMA.Korean] : "");
	return state.HUMBLE_PRONOUN_SUPPLETIONS.get(ko) || null;
}

function getPlainCounterpart(wordOrKo) {
	const ko = typeof wordOrKo === 'string' ? wordOrKo : (wordOrKo ? wordOrKo[DATA_SCHEMA.Korean] : "");
	return state.PLAIN_COUNTERPARTS.get(ko) || null;
}

function isHonorificWord(wordOrKo) {
	const ko = typeof wordOrKo === 'string' ? wordOrKo : (wordOrKo ? wordOrKo[DATA_SCHEMA.Korean] : "");
	return state.HONORIFIC_WORDS.has(ko);
}

function isHumbleWord(wordOrKo) {
	const ko = typeof wordOrKo === 'string' ? wordOrKo : (wordOrKo ? wordOrKo[DATA_SCHEMA.Korean] : "");
	return state.HUMBLE_WORDS.has(ko);
}

function isForbiddenForElder(wordOrKo) {
	const ko = typeof wordOrKo === 'string' ? wordOrKo : (wordOrKo ? wordOrKo[DATA_SCHEMA.Korean] : "");
	return state.FORBIDDEN_PLAIN_WORDS_FOR_ELDERS.has(ko);
}

function isElderNoun(nounUnit, nounKo = "") {
	if (nounUnit) {
		if (hasTag(nounUnit, "elder_noun", "honorific", "honorific_person", "elder", "kinship_elder")) return true;
		const sv = parseSemanticVector(nounUnit);
		if (sv && sv.honorific === true) return true;
		const name = nounUnit[DATA_SCHEMA.Korean];
		if (state.ELDER_NOUN_TITLES.has(name) || (name && name.endsWith('님') && hasTag(nounUnit, "person"))) return true;
	}
	if (nounKo) {
		if (state.ELDER_NOUN_TITLES.has(nounKo) || nounKo.endsWith('님')) return true;
	}
	return false;
}

function isInanimateInstitution(nounUnit, nounKo = "") {
	if (nounUnit) {
		if (hasTag(nounUnit, "inanimate_institution")) return true;
		if (hasTag(nounUnit, "person", "animal", "family", "profession", "subject_animate")) return false;
		if (hasTag(nounUnit, "institution", "facility", "organization", "workplace", "place", "place_indoor", "place_outdoor")) return true;
	}
	if (nounKo && state.INANIMATE_INSTITUTION_NAMES.has(nounKo)) return true;
	return false;
}

function isDeicticTimeWord(nounUnit, nounKo = "") {
	const ko = nounKo || (nounUnit ? nounUnit[DATA_SCHEMA.Korean] : "");
	if (ko && state.BARE_TIME_WORDS_NO_PARTICLE.has(ko)) return true;
	if (nounUnit) {
		if (hasTag(nounUnit, "no_time_particle")) return true;
		const sv = parseSemanticVector(nounUnit);
		if (sv && sv.no_time_particle === true) return true;
	}
	return false;
}

function getTemporalPolarity(wordOrUnit) {
	if (!wordOrUnit) return null;
	const ko = typeof wordOrUnit === 'string' ? wordOrUnit : (Array.isArray(wordOrUnit) ? wordOrUnit[DATA_SCHEMA.Korean] : "");
	const unit = typeof wordOrUnit === 'object' && Array.isArray(wordOrUnit) ? wordOrUnit : (getNounUnit(ko) || getVerbUnit(ko));
	const id = unit ? unit[DATA_SCHEMA.Id] : (typeof wordOrUnit === 'number' ? wordOrUnit : null);

	if (ko && state.PAST_TIME_WORDS.has(ko)) return "past";
	if (id !== null && state.PAST_GRAMMAR_IDS.has(id)) return "past";

	if (ko && state.FUTURE_TIME_WORDS.has(ko)) return "future";
	if (id !== null && state.FUTURE_GRAMMAR_IDS.has(id)) return "future";

	if (ko && state.PRESENT_TIME_WORDS.has(ko)) return "present";
	if (id !== null && state.PRESENT_GRAMMAR_IDS.has(id)) return "present";

	if (unit) {
		if (hasTag(unit, "temporal_past", "past")) return "past";
		if (hasTag(unit, "temporal_future", "future")) return "future";
		if (hasTag(unit, "temporal_present", "present")) return "present";
		const sv = parseSemanticVector(unit);
		if (sv && sv.tense) return sv.tense;
	}
	return null;
}

function filterWordsByTense(words, tense) {
	if (!words || words.length === 0 || !tense) return words || [];
	let filtered = words;
	if (tense === "past") {
		filtered = words.filter(w => {
			const pol = getTemporalPolarity(w);
			return pol !== "future";
		});
	} else if (tense === "future") {
		filtered = words.filter(w => {
			const pol = getTemporalPolarity(w);
			return pol !== "past";
		});
	} else if (tense === "present") {
		filtered = words.filter(w => {
			const pol = getTemporalPolarity(w);
			return pol !== "past" && pol !== "future";
		});
	}
	return filtered.length > 0 ? filtered : words;
}

function filterGrammarByTense(grammars, tense) {
	if (!grammars || grammars.length === 0 || !tense) return grammars || [];
	let filtered = grammars;
	if (tense === "past") {
		filtered = grammars.filter(g => {
			const id = g[DATA_SCHEMA.Id];
			if (state.FUTURE_GRAMMAR_IDS.has(id)) return false;
			const sv = parseSemanticVector(g);
			return sv.tense !== "future";
		});
	} else if (tense === "future") {
		filtered = grammars.filter(g => {
			const id = g[DATA_SCHEMA.Id];
			if (state.PAST_GRAMMAR_IDS.has(id)) return false;
			const sv = parseSemanticVector(g);
			return sv.tense !== "past";
		});
	} else if (tense === "present") {
		filtered = grammars.filter(g => {
			const id = g[DATA_SCHEMA.Id];
			if (state.PAST_GRAMMAR_IDS.has(id) || state.FUTURE_GRAMMAR_IDS.has(id)) return false;
			const sv = parseSemanticVector(g);
			return sv.tense !== "past" && sv.tense !== "future";
		});
	}
	return filtered.length > 0 ? filtered : grammars;
}

// =========================================================================
// Verb Phrase Building
// =========================================================================

function getVerbParticleType(verbUnit) {
	if (hasTag(verbUnit, "dative_person")) return "dative";
	if (hasTag(verbUnit, "intransitive_motion", "intransitive_place")) return "location";
	const spec = ACTION_VERB_SPECS.find(s => hasTag(verbUnit, s.tag));
	if (spec && spec.particle) return spec.particle;
	return "object";
}

function getNounCandidatesForVerb(verbUnit) {
	const sv = parseSemanticVector(verbUnit);

	if (sv && typeof sv.collocation_filter === 'string') {
		try {
			const { lang, code } = parseAndValidateCollocationFilter(sv.collocation_filter, verbUnit[DATA_SCHEMA.Id]);
			if (lang === 'js') {
				const filterFn = new Function('noun', 'hasTag', `return (${code})(noun, hasTag);`);
				const getFilteredWords = typeof window !== 'undefined' ? window.getFilteredWords : require('./numbers.js').getFilteredWords;
				const allNouns = getFilteredWords("Noun");
				const matched = allNouns.filter(n => {
					try { return filterFn(n, hasTag); } catch (e) { return false; }
				});
				if (matched.length > 0) return matched;
			}
		} catch (e) {
			console.error(`Failed to execute collocation_filter on verb unit ${verbUnit[DATA_SCHEMA.Id]}:`, e.message || e);
		}
	}

	const getFilteredWords = typeof window !== 'undefined' ? window.getFilteredWords : require('./numbers.js').getFilteredWords;

	if (sv && sv.req && sv.req !== 'any') {
		const reqNouns = getFilteredWords("Noun", sv.req).filter(n => !hasTag(n, "measureWord"));
		if (reqNouns.length > 0) return reqNouns;
	}

	for (const spec of ACTION_VERB_SPECS) {
		if (hasTag(verbUnit, spec.tag)) {
			let words = getFilteredWords("Noun", spec.nounTag).filter(n => !hasTag(n, "measureWord"));
			if (spec.preferDomain) {
				const domainWords = words.filter(w => parseSemanticVector(w).domain);
				if (domainWords.length > 0) words = domainWords;
			}
			if (words.length === 0 && spec.fallbackTag !== undefined) {
				words = getFilteredWords("Noun", spec.fallbackTag || undefined).filter(n => !hasTag(n, "measureWord"));
			}
			if (words.length > 0) return words;
		}
	}

	let fallback = getFilteredWords("Noun", "object").filter(n => !hasTag(n, "measureWord"));
	if (fallback.length === 0) fallback = getFilteredWords("Noun").filter(n => !hasTag(n, "measureWord"));
	return fallback;
}

function getSubjectCandidatesForDescriptiveVerb(dvUnit) {
	const sv = parseSemanticVector(dvUnit);

	if (sv && typeof sv.collocation_filter === 'string') {
		try {
			const { lang, code } = parseAndValidateCollocationFilter(sv.collocation_filter, dvUnit[DATA_SCHEMA.Id]);
			if (lang === 'js') {
				const filterFn = new Function('noun', 'hasTag', `return (${code})(noun, hasTag);`);
				const getFilteredWords = typeof window !== 'undefined' ? window.getFilteredWords : require('./numbers.js').getFilteredWords;
				const allNouns = getFilteredWords("Noun");
				const matched = allNouns.filter(n => {
					try { return filterFn(n, hasTag); } catch (e) { return false; }
				});
				if (matched.length > 0) return matched;
			}
		} catch (e) {
			console.error(`Failed to execute collocation_filter on descriptive unit ${dvUnit[DATA_SCHEMA.Id]}:`, e.message || e);
		}
	}

	const getFilteredWords = typeof window !== 'undefined' ? window.getFilteredWords : require('./numbers.js').getFilteredWords;

	if (sv && sv.req && sv.req !== 'any') {
		const reqNouns = getFilteredWords("Noun", sv.req).filter(n => !hasTag(n, "measureWord"));
		if (reqNouns.length > 0) return reqNouns;
	}

	for (const spec of DESCRIPTIVE_VERB_SPECS) {
		if (hasTag(dvUnit, spec.tag)) {
			let words = getFilteredWords("Noun", spec.nounTag).filter(n => !hasTag(n, "measureWord"));
			if (spec.preferDomain) {
				const domainWords = words.filter(w => parseSemanticVector(w).domain);
				if (domainWords.length > 0) words = domainWords;
			}
			if (words.length === 0 && spec.fallbackTag !== undefined) {
				words = getFilteredWords("Noun", spec.fallbackTag || undefined).filter(n => !hasTag(n, "measureWord"));
			}
			if (words.length > 0) return words;
		}
	}

	let fallback = getFilteredWords("Noun", "object").filter(n => !hasTag(n, "measureWord"));
	if (fallback.length === 0) fallback = getFilteredWords("Noun").filter(n => !hasTag(n, "measureWord"));
	return fallback;
}

function getRandom(arr) {
	if (!arr || arr.length === 0) return null;
	return arr[Math.floor(Math.random() * arr.length)];
}

function markUnitUsed(unit) {
	if (unit && typeof unit[DATA_SCHEMA.Id] === 'number') {
		state.usedUnitIds.add(unit[DATA_SCHEMA.Id]);
	}
}

function buildActionVerbPhrase(word, stem, chosenNoun = null, options = {}) {
	let activeWord = word;
	let activeStem = stem;

	const isSubjectElder = options.honorific === true || (options.subject && isElderNoun(options.subject));
	const isRecipientElder = (options.recipient && isElderNoun(options.recipient)) || (options.dativeRecipient && isElderNoun(options.dativeRecipient)) || options.dativeType === "honorific";

	if (isSubjectElder) {
		const suppletiveKo = getHonorificVerb(activeWord);
		if (suppletiveKo) {
			const suppletiveUnit = getVerbUnit(suppletiveKo);
			if (suppletiveUnit) {
				activeWord = suppletiveUnit;
				activeStem = getConjugatedStem(suppletiveKo, suppletiveUnit[DATA_SCHEMA.Conjugation]);
			} else {
				activeStem = getStem(suppletiveKo);
			}
		}
	}

	if (isRecipientElder) {
		const humbleKo = getHumbleVerb(activeWord);
		if (humbleKo) {
			const humbleUnit = getVerbUnit(humbleKo);
			if (humbleUnit) {
				activeWord = humbleUnit;
				activeStem = getConjugatedStem(humbleKo, humbleUnit[DATA_SCHEMA.Conjugation]);
			} else {
				activeStem = getStem(humbleKo);
			}
		}
	}

	const isPureIntransitive = (hasTag(activeWord, "intransitive_general") || hasTag(activeWord, "intransitive_motion") || hasTag(activeWord, "intransitive_place"))
		&& !ACTION_VERB_SPECS.some(s => s.particle === "object" && hasTag(activeWord, s.tag))
		&& !parseSemanticVector(activeWord).collocation_filter;

	const getFilteredWords = typeof window !== 'undefined' ? window.getFilteredWords : require('./numbers.js').getFilteredWords;
	const getWords = dataModule.getWords || (typeof window !== 'undefined' ? window.getWords : () => []);

	if (isPureIntransitive) {
		if (hasTag(activeWord, "intransitive_motion") || hasTag(activeWord, "intransitive_place")) {
			const placeNoun = chosenNoun || getRandom(getFilteredWords("Noun", "place")) || getRandom(getWords("Noun", "place"));
			if (placeNoun) {
				markUnitUsed(placeNoun);
				return { text: `${attachParticle(placeNoun, "location", activeWord, options)} ${activeStem}`, noun: placeNoun, verb: activeWord };
			}
		}
		return { text: activeStem, noun: null, verb: activeWord };
	}

	let noun = chosenNoun;
	if (!noun) {
		const candidates = getNounCandidatesForVerb(activeWord);
		noun = getRandom(candidates);
		if (noun) markUnitUsed(noun);
	}
	if (!noun) return { text: activeStem, noun: null, verb: activeWord };

	if (isSubjectElder) {
		const suppletiveNounKo = getHonorificNoun(noun);
		if (suppletiveNounKo) {
			const suppletiveNounUnit = getNounUnit(suppletiveNounKo);
			if (suppletiveNounUnit) noun = suppletiveNounUnit;
		}
	}

	const particleType = getVerbParticleType(activeWord);
	const particleOptions = { ...options };
	if (isRecipientElder && (particleType === "dative" || particleType === "dative_person")) {
		particleOptions.dativeType = "honorific";
	}

	return { text: `${attachParticle(noun, particleType, activeWord, particleOptions)} ${activeStem}`, noun, verb: activeWord };
}

function buildDescriptiveVerbPhrase(word, stem, chosenNoun = null, options = {}) {
	let noun = chosenNoun;
	if (!noun) {
		const candidates = getSubjectCandidatesForDescriptiveVerb(word);
		noun = getRandom(candidates);
		if (noun) markUnitUsed(noun);
	}
	if (!noun) return { text: stem, noun: null, verb: word };

	let activeWord = word;
	let activeStem = stem;
	const isHonorificMode = options.honorific === true;
	const isElder = isElderNoun(noun);

	if (isHonorificMode && isElder) {
		const suppletiveKo = getHonorificVerb(activeWord);
		if (suppletiveKo) {
			const suppletiveUnit = getVerbUnit(suppletiveKo);
			if (suppletiveUnit) {
				activeWord = suppletiveUnit;
				activeStem = getConjugatedStem(suppletiveKo, suppletiveUnit[DATA_SCHEMA.Conjugation]);
			} else {
				activeStem = getStem(suppletiveKo);
			}
		}
	}

	const particleOptions = { ...options };
	if (isHonorificMode && isElder) {
		particleOptions.allowHonorificSubject = true;
	}
	return { text: `${attachParticle(noun, "subject", activeWord, particleOptions)} ${activeStem}`, noun, verb: activeWord };
}

function getHonorificPredicate(verbOrKo, formality = "polite", options = {}) {
	const verbUnit = getVerbUnit(verbOrKo);
	const verbKo = verbUnit ? verbUnit[DATA_SCHEMA.Korean] : (typeof verbOrKo === 'string' ? verbOrKo : "");
	if (!verbKo) return "";

	if (options.indirectHonorific === true && verbKo === "있다") {
		const conj = verbUnit ? verbUnit[DATA_SCHEMA.Conjugation] : "";
		const stem = getConjugatedStem("있다", conj);
		switch (formality) {
			case "formal":
			case "formal_polite":
				return applyMorphology(stem + "으/십니다");
			case "formal_question":
				return applyMorphology(stem + "으/십니까?");
			case "past":
			case "past_polite":
				return applyMorphology(stem + "으/셨어요");
			case "past_formal":
				return applyMorphology(stem + "으/셨습니다");
			case "imperative":
			case "imperative_polite":
				return applyMorphology(stem + "으/세요");
			case "imperative_formal":
				return applyMorphology(stem + "으/십시오");
			case "informal":
			case "banmal":
				return applyMorphology(stem + "으/셔");
			case "stem":
				return applyMorphology(stem + "으/시");
			case "polite":
			case "polite_informal":
			default:
				return applyMorphology(stem + "으/세요");
		}
	}

	const suppletiveKo = state.HONORIFIC_VERB_SUPPLETIONS.get(verbKo);
	const effectiveVerbKo = suppletiveKo || verbKo;
	const effectiveUnit = suppletiveKo ? getVerbUnit(suppletiveKo) : verbUnit;

	if (suppletiveKo) {
		const stem = getStem(suppletiveKo);
		const base = stem.slice(0, -1);
		switch (formality) {
			case "formal":
			case "formal_polite":
				return base + "십니다";
			case "formal_question":
				return base + "십니까?";
			case "past":
			case "past_polite":
				return base + "셨어요";
			case "past_formal":
				return base + "셨습니다";
			case "imperative":
			case "imperative_polite":
				return base + "세요";
			case "imperative_formal":
				return stem + "십시오";
			case "informal":
			case "banmal":
				return base + "셔";
			case "stem":
				return stem;
			case "polite":
			case "polite_informal":
			default:
				return base + "세요";
		}
	}

	const conj = effectiveUnit ? effectiveUnit[DATA_SCHEMA.Conjugation] : "";
	const stem = getConjugatedStem(effectiveVerbKo, conj);

	switch (formality) {
		case "formal":
		case "formal_polite":
			return applyMorphology(stem + "으/십니다");
		case "formal_question":
			return applyMorphology(stem + "으/십니까?");
		case "past":
		case "past_polite":
			return applyMorphology(stem + "으/셨어요");
		case "past_formal":
			return applyMorphology(stem + "으/셨습니다");
		case "imperative":
		case "imperative_polite":
			return applyMorphology(stem + "으/세요");
		case "imperative_formal":
			return applyMorphology(stem + "으/십시오");
		case "informal":
		case "banmal":
			return applyMorphology(stem + "으/셔");
		case "stem":
			return applyMorphology(stem + "으/시");
		case "polite":
		case "polite_informal":
		default:
			return applyMorphology(stem + "으/세요");
	}
}

function getHumblePredicate(verbOrKo, formality = "polite", options = {}) {
	const verbUnit = getVerbUnit(verbOrKo);
	const verbKo = verbUnit ? verbUnit[DATA_SCHEMA.Korean] : (typeof verbOrKo === 'string' ? verbOrKo : "");
	if (!verbKo) return "";

	const humbleKo = state.HUMBLE_VERB_SUPPLETIONS.get(verbKo) || verbKo;
	const humbleUnit = getVerbUnit(humbleKo);

	if (humbleKo === "여쭙다") {
		switch (formality) {
			case "formal":
			case "formal_polite":
				return "여쭙니다";
			case "formal_question":
				return "여쭙니까?";
			case "past":
			case "past_polite":
				return "여쭸어요";
			case "past_formal":
				return "여쭸습니다";
			case "informal":
			case "banmal":
				return "여쭤";
			case "stem":
				return "여쭙";
			case "polite":
			case "polite_informal":
			default:
				return "여쭤요";
		}
	}

	if (humbleKo === "뵙다") {
		switch (formality) {
			case "formal":
			case "formal_polite":
				return "뵙습니다";
			case "formal_question":
				return "뵙습니까?";
			case "past":
			case "past_polite":
				return "뵀어요";
			case "past_formal":
				return "뵀습니다";
			case "informal":
			case "banmal":
				return "봬";
			case "stem":
				return "뵙";
			case "polite":
			case "polite_informal":
			default:
				return "봬요";
		}
	}

	const conj = humbleUnit ? humbleUnit[DATA_SCHEMA.Conjugation] : "";
	const stem = getConjugatedStem(humbleKo, conj);

	switch (formality) {
		case "formal":
		case "formal_polite":
			return applyMorphology(stem + "습니다/ㅂ니다");
		case "formal_question":
			return applyMorphology(stem + "습니까/ㅂ니까?");
		case "past":
		case "past_polite":
			return applyMorphology(stem + "았/었어요");
		case "past_formal":
			return applyMorphology(stem + "았/었습니다");
		case "informal":
		case "banmal":
			return applyMorphology(stem + "아/어");
		case "stem":
			return stem;
		case "polite":
		case "polite_informal":
		default:
			return applyMorphology(stem + "아/어요");
	}
}

function applyHonorificConcord(input, options = {}) {
	if (typeof input === 'object' && input !== null) {
		const subj = input.subject || options.subject;
		const isElder = isElderNoun(subj) || options.honorific === true;
		const recip = input.recipient || options.recipient || options.dativeRecipient;
		const isElderRecip = isElderNoun(recip) || options.dativeType === "honorific";

		let verb = input.verb || options.verb;
		let noun = input.noun || options.noun;
		let pronoun = input.pronoun || options.pronoun;

		if (isElder) {
			if (verb) {
				const hv = getHonorificVerb(verb);
				if (hv) verb = getVerbUnit(hv) || hv;
			}
			if (noun) {
				const hn = getHonorificNoun(noun);
				if (hn) noun = getNounUnit(hn) || hn;
			}
		}

		if (isElderRecip && verb) {
			const uv = getHumbleVerb(verb);
			if (uv) verb = getVerbUnit(uv) || uv;
		}

		if ((isElder || isElderRecip) && pronoun) {
			const hp = getHumblePronoun(pronoun);
			if (hp) pronoun = hp;
		}

		let text = input.text || "";
		if (text) {
			text = applyHonorificConcord(text, { ...options, subject: subj, recipient: recip });
		}

		return { text, subject: subj, verb, noun, recipient: recip, pronoun };
	}

	let str = String(input);

	for (const elder of state.ELDER_NOUN_TITLES) {
		const subjRegex = new RegExp(`(^|[^가-힣])(${elder})(이|가)([^가-힣]|$)`, 'g');
		str = str.replace(subjRegex, '$1$2께서$4');

		const topRegex = new RegExp(`(^|[^가-힣])(${elder})는([^가-힣]|$)`, 'g');
		str = str.replace(topRegex, '$1$2께서는$3');

		const datRegex = new RegExp(`(^|[^가-힣])(${elder})(에게|한테)([^가-힣]|$)`, 'g');
		str = str.replace(datRegex, '$1$2께$4');
	}

	str = str.replace(/([가-힣]+님)(이|가)([^가-힣]|$)/g, '$1께서$3');
	str = str.replace(/([가-힣]+님)(에게|한테)([^가-힣]|$)/g, '$1께$3');

	const isElderContext = options.honorific === true || (options.subject && isElderNoun(options.subject)) || /께서/.test(str);
	if (isElderContext) {
		for (const [plain, hon] of state.HONORIFIC_NOUN_SUPPLETIONS.entries()) {
			const nounRegex = new RegExp(`(^|[^가-힣])(${plain})([을를이가은는의도]?)([^가-힣]|$)`, 'g');
			str = str.replace(nounRegex, (m, pre, base, part, post) => {
				const attached = part ? attachParticle(hon, part === '을' || part === '를' ? 'object' : part === '이' || part === '가' ? 'subject' : part === '은' || part === '는' ? 'topic' : part === '의' ? 'genitive' : 'additive') : hon;
				return pre + attached + post;
			});
		}

		str = str.replace(/(^|[^가-힣])자(요|다|고|며|서)([^가-힣]|$)/g, '$1주무세$2$3');
		str = str.replace(/(^|[^가-힣])잡니다([^가-힣]|$)/g, '$1주무십니다$2');
		str = str.replace(/(^|[^가-힣])잤어요([^가-힣]|$)/g, '$1주무셨어요$2');
		str = str.replace(/(^|[^가-힣])잤습니다([^가-힣]|$)/g, '$1주무셨습니다$2');

		str = str.replace(/(^|[^가-힣])먹(어요|다|고|으며|어서)([^가-힣]|$)/g, (m, pre, end, post) => {
			const rep = end === '어요' ? '드세요' : end === '다' ? '드시다' : end === '고' ? '드시고' : end === '으며' ? '드시며' : '드셔서';
			return pre + rep + post;
		});
		str = str.replace(/(^|[^가-힣])먹습니다([^가-힣]|$)/g, '$1드십니다$2');
		str = str.replace(/(^|[^가-힣])먹었어요([^가-힣]|$)/g, '$1드셨어요$2');
		str = str.replace(/(^|[^가-힣])먹었습니다([^가-힣]|$)/g, '$1드셨습니다$2');

		str = str.replace(/(^|[^가-힣])마(셔요|시다|시고|셔서)([^가-힣]|$)/g, (m, pre, end, post) => {
			const rep = end === '셔요' ? '드세요' : end === '시다' ? '드시다' : end === '시고' ? '드시고' : '드셔서';
			return pre + rep + post;
		});
		str = str.replace(/(^|[^가-힣])마십니다([^가-힣]|$)/g, '$1드십니다$2');

		str = str.replace(/(^|[^가-힣])아(파요|프다|파서)([^가-힣]|$)/g, (m, pre, end, post) => {
			const rep = end === '파요' ? '편찮으세요' : end === '프다' ? '편찮으시다' : '편찮으셔서';
			return pre + rep + post;
		});
		str = str.replace(/(^|[^가-힣])아픕니다([^가-힣]|$)/g, '$1편찮으십니다$2');

		str = str.replace(/(^|[^가-힣])죽(었어요|었다|었습니다)([^가-힣]|$)/g, (m, pre, end, post) => {
			const rep = end === '었어요' ? '돌아가셨어요' : end === '었다' ? '돌아가셨다' : '돌아가셨습니다';
			return pre + rep + post;
		});
	}

	const isElderRecipContext = (options.recipient && isElderNoun(options.recipient)) || (options.dativeRecipient && isElderNoun(options.dativeRecipient)) || /께\s+/.test(str);
	if (isElderRecipContext) {
		str = str.replace(/(^|[^가-힣])주(어요|어|다|고|며|어서)([^가-힣]|$)/g, (m, pre, end, post) => {
			const rep = end === '어요' ? '드려요' : end === '어' ? '드려' : end === '다' ? '드리다' : end === '고' ? '드리고' : end === '며' ? '드리며' : '드려서';
			return pre + rep + post;
		});
		str = str.replace(/(^|[^가-힣])줘요([^가-힣]|$)/g, '$1드려요$2');
		str = str.replace(/(^|[^가-힣])줍니다([^가-힣]|$)/g, '$1드립니다$2');
		str = str.replace(/(^|[^가-힣])줬어요([^가-힣]|$)/g, '$1드렸어요$2');
		str = str.replace(/(^|[^가-힣])줬습니다([^가-힣]|$)/g, '$1드렸습니다$2');

		str = str.replace(/(^|[^가-힣])말(해요|합니다|하다|하고|해서)([^가-힣]|$)/g, (m, pre, end, post) => {
			const rep = end === '해요' ? '말씀드려요' : end === '합니다' ? '말씀드립니다' : end === '하다' ? '말씀드리다' : end === '하고' ? '말씀드리고' : '말씀드려서';
			return pre + rep + post;
		});

		str = str.replace(/(^|[^가-힣])물(어요|어|어서)([^가-힣]|$)/g, '$1여쭤$2$3');
		str = str.replace(/(^|[^가-힣])묻(습니다|다|고)([^가-힣]|$)/g, (m, pre, end, post) => {
			const rep = end === '습니다' ? '여쭙니다' : end === '다' ? '여쭙다' : '여쭈고';
			return pre + rep + post;
		});

		str = str.replace(/(^|[^가-힣])만(나요|납니다|나다|나서|나고)([^가-힣]|$)/g, (m, pre, end, post) => {
			const rep = end === '나요' ? '봬요' : end === '납니다' ? '뵙습니다' : end === '나다' ? '뵙다' : end === '나서' ? '봬서' : '뵙고';
			return pre + rep + post;
		});

		str = str.replace(/(^|[^가-힣])내가([^가-힣]|$)/g, '$1제가$2');
		str = str.replace(/(^|[^가-힣])나는([^가-힣]|$)/g, '$1저는$2');
		str = str.replace(/(^|[^가-힣])나를([^가-힣]|$)/g, '$1저를$2');
		str = str.replace(/(^|[^가-힣])우리가([^가-힣]|$)/g, '$1저희가$2');
		str = str.replace(/(^|[^가-힣])우리는([^가-힣]|$)/g, '$1저희는$2');
	}

	return str;
}

function validateHonorificConcord(input, context = {}) {
	const errors = [];
	const text = typeof input === 'string' ? input : (input && input.text ? input.text : "");
	const subj = (input && input.subject) || context.subject;
	const recip = (input && input.recipient) || context.recipient || context.dativeRecipient;
	const verb = (input && input.verb) || context.verb;
	const noun = (input && input.noun) || context.noun;

	const verbKo = verb ? (typeof verb === 'string' ? verb : verb[DATA_SCHEMA.Korean]) : "";
	const nounKo = noun ? (typeof noun === 'string' ? noun : noun[DATA_SCHEMA.Korean]) : "";
	const subjKo = subj ? (typeof subj === 'string' ? subj : subj[DATA_SCHEMA.Korean]) : "";
	const recipKo = recip ? (typeof recip === 'string' ? recip : recip[DATA_SCHEMA.Korean]) : "";

	const isSubjectElder = isElderNoun(subj, subjKo) || context.honorific === true || /께서/.test(text);
	const isRecipientElder = isElderNoun(recip, recipKo) || /께\s+/.test(text) || context.dativeType === "honorific";

	if (context.honorific === true || isElderNoun(subj, subjKo)) {
		if (subjKo) {
			const hasPlainSubj = new RegExp(`(^|[^가-힣])${subjKo}(이|가)([^가-힣]|$)`).test(text);
			if (hasPlainSubj) {
				errors.push(`Elder subject '${subjKo}' must take honorific subject particle '-께서', not '-이/가'`);
			}
		}
	}

	if (isSubjectElder) {
		if (verbKo && state.FORBIDDEN_PLAIN_WORDS_FOR_ELDERS.has(verbKo)) {
			const honVerb = state.HONORIFIC_VERB_SUPPLETIONS.get(verbKo);
			errors.push(`Respected elder subject cannot use plain verb '${verbKo}' (supplete to '${honVerb}')`);
		}
		if (/(^|[^가-힣])(자요|잡니다|자다|자고|잤어요|잤다)([^가-힣]|$)/.test(text)) {
			errors.push(`Forbidden plain verb '자다' used with respected elder subject (expected '주무시다')`);
		}
		if (/(^|[^가-힣])(먹어요|먹습니다|먹다|먹고|먹었어요|먹었다)([^가-힣]|$)/.test(text)) {
			errors.push(`Forbidden plain verb '먹다' used with respected elder subject (expected '드시다')`);
		}
		if (/(^|[^가-힣])(마셔요|마십니다|마시다|마셨어요)([^가-힣]|$)/.test(text)) {
			errors.push(`Forbidden plain verb '마시다' used with respected elder subject (expected '드시다')`);
		}
		if (/(^|[^가-힣])(아파요|아픕니다|아프다|아팠어요)([^가-힣]|$)/.test(text)) {
			errors.push(`Forbidden plain verb '아프다' used with respected elder subject (expected '편찮으시다')`);
		}
		if (/(^|[^가-힣])(죽었어요|죽었다|죽습니다|죽다)([^가-힣]|$)/.test(text)) {
			errors.push(`Forbidden plain verb '죽다' used with respected elder subject (expected '돌아가시다')`);
		}

		if (verbKo && state.HUMBLE_WORDS.has(verbKo)) {
			errors.push(`Respected elder subject cannot use humble verb '${verbKo}' for own action`);
		}
		if (/(^|[^가-힣])(말씀드렸|말씀드립|말씀드려|여쭸|여쭈었|여쭙|여쭤|뵀|뵈었|뵙|도와드렸|도와드립|보여드렸|보여드립)/.test(text)) {
			errors.push(`Respected elder subject cannot use humble verb for own action`);
		}

		if (nounKo && state.HONORIFIC_NOUN_SUPPLETIONS.has(nounKo)) {
			const honNoun = state.HONORIFIC_NOUN_SUPPLETIONS.get(nounKo);
			errors.push(`Plain noun '${nounKo}' should be honorific suppletion '${honNoun}' when referring to respected elder`);
		}
		if (/(^|[^가-힣])밥(을|이|은|도)?([^가-힣]|$)/.test(text) && /(드|잡수)/.test(text)) {
			errors.push(`Plain noun '밥' should be honorific suppletion '진지' with honorific consumption verb`);
		}
		if (/(^|[^가-힣])나이(가|는|를)?([^가-힣]|$)/.test(text) && /(많으시|어떻게 되)/.test(text)) {
			errors.push(`Plain noun '나이' should be honorific suppletion '연세' for elder`);
		}
	}

	if (isRecipientElder) {
		if (recipKo) {
			const hasPlainDative = new RegExp(`(^|[^가-힣])${recipKo}(에게|한테)([^가-힣]|$)`).test(text);
			if (hasPlainDative) {
				errors.push(`Elder recipient '${recipKo}' must take honorific dative '-께', not '-에게/-한테'`);
			}
		}

		if (verbKo && state.HUMBLE_VERB_SUPPLETIONS.has(verbKo)) {
			const humble = state.HUMBLE_VERB_SUPPLETIONS.get(verbKo);
			errors.push(`Elder recipient requires humble verb '${humble}', not plain verb '${verbKo}'`);
		}
		if (/(^|[^가-힣])(줘요|줍니다|주다|주고|줬어요|줬다)([^가-힣]|$)/.test(text)) {
			errors.push(`Elder recipient requires humble verb '드리다', not '주다'`);
		}
		if (/(^|[^가-힣])(말해요|말합니다|말하다|말하고|말했어요)([^가-힣]|$)/.test(text)) {
			errors.push(`Elder recipient requires humble verb '말씀드리다', not '말하다'`);
		}
		if (/(^|[^가-힣])(물어요|묻습니다|묻다|물었어요)([^가-힣]|$)/.test(text)) {
			errors.push(`Elder recipient requires humble verb '여쭙다' or '여쭈어보다', not '묻다'`);
		}

		if (/(^|[^가-힣])(내가|나는|나를|나에게|나한테)([^가-힣]|$)/.test(text)) {
			errors.push(`Informal 1st-person pronoun '나/내' cannot be used with elder recipient; use humble '저/제'`);
		}
	}

	return {
		valid: errors.length === 0,
		errors
	};
}

function validateTemporalConcord(input, context = {}) {
	const errors = [];
	const text = typeof input === 'string' ? input : (input && input.text ? input.text : "");
	if (!text) return { valid: true, errors: [] };

	for (const bare of state.BARE_TIME_WORDS_NO_PARTICLE) {
		const deicticParticleRegex = new RegExp(`(^|[^가-힣])(${bare})에([^가-힣]|$)`);
		if (deicticParticleRegex.test(text)) {
			errors.push(`Deictic temporal word '${bare}' cannot take time particle -에 (*${bare}에) in: "${text}"`);
		}
	}

	const foundPast = [];
	const foundFuture = [];
	for (const word of state.PAST_TIME_WORDS) {
		const reg = new RegExp(`(^|[^가-힣])${word}([^가-힣]|$)`);
		if (reg.test(text)) foundPast.push(word);
	}
	for (const word of state.FUTURE_TIME_WORDS) {
		const reg = new RegExp(`(^|[^가-힣])${word}([^가-힣]|$)`);
		if (reg.test(text)) foundFuture.push(word);
	}

	let hasPastPredicate = false;
	for (let i = 0; i < text.length; i++) {
		const ch = text[i];
		if (ch === '있' || ch === '없' || ch === '겠') continue;
		const d = decomposeHangul(ch);
		if (d && d.final === 20) {
			const rest = text.slice(i + 1);
			if (/^(?:어요|습니다|다|어|죠|던|네|소|ㅂ니다)/.test(rest)) {
				hasPastPredicate = true;
				break;
			}
		}
	}
	if (!hasPastPredicate) {
		hasPastPredicate = /(?:았|었|였|했|던|갔|봤|왔|잤)(?:어요|습니다|다|어|죠)/.test(text) && !/(았|었|였)으면\s*좋겠/.test(text);
	}

	const hasFuturePredicate = /((?:거(?:예요|야|입니다|에요|요|다))|(?:(?:ㄹ|을)\s*게요|게요)|(?:(?:으)?려고\s*(?:해|합|하|그))|(?:겠(?:어요|습니다|다|어|죠))|(?:(?:ㄹ|을)\s*건가요|건가요|것인가요))/.test(text);

	if (foundPast.length > 0 && hasFuturePredicate) {
		errors.push(`Past temporal word(s) [${foundPast.join(', ')}] clash with prospective/future predicate in: "${text}"`);
	}
	if (foundFuture.length > 0 && hasPastPredicate) {
		errors.push(`Future temporal word(s) [${foundFuture.join(', ')}] clash with past predicate in: "${text}"`);
	}

	if (context.temporal_polarity === "past" && hasFuturePredicate) {
		errors.push(`Context requires past tense, but found future predicate in: "${text}"`);
	}
	if (context.temporal_polarity === "future" && hasPastPredicate) {
		errors.push(`Context requires future tense, but found past predicate in: "${text}"`);
	}

	return {
		valid: errors.length === 0,
		errors
	};
}

function applyTemporalConcord(input, options = {}) {
	if (typeof input === 'object' && input !== null) {
		let text = input.text || "";
		if (text) {
			text = applyTemporalConcord(text, options);
		}
		return { ...input, text };
	}

	let str = String(input);

	for (const bare of state.BARE_TIME_WORDS_NO_PARTICLE) {
		const deicticRegex = new RegExp(`(^|[^가-힣])(${bare})에([^가-힣]|$)`, 'g');
		str = str.replace(deicticRegex, '$1$2$3');
	}

	return str;
}

const morphologyExports = {
	getPronunciationWord,
	getPronunciation,
	applyMorphology,
	attachParticle,
	getConjugatedStem,
	isDescriptiveVerb,
	isActionVerb,
	canTakeMood,
	getNegationSuppletion,
	getAffirmativeCounterpart,
	conjugatePredicate,
	buildNegatedPredicate,
	buildMoodPredicate,
	getNounUnit,
	getAllNounUnits,
	getVerbUnit,
	getHonorificVerb,
	getHumbleVerb,
	getHonorificNoun,
	getHumblePronoun,
	getPlainCounterpart,
	isHonorificWord,
	isHumbleWord,
	isForbiddenForElder,
	isElderNoun,
	isInanimateInstitution,
	isDeicticTimeWord,
	getTemporalPolarity,
	filterWordsByTense,
	filterGrammarByTense,
	buildActionVerbPhrase,
	buildDescriptiveVerbPhrase,
	getNounCandidatesForVerb,
	getSubjectCandidatesForDescriptiveVerb,
	getVerbParticleType,
	getHonorificPredicate,
	getHumblePredicate,
	applyHonorificConcord,
	validateHonorificConcord,
	applyTemporalConcord,
	validateTemporalConcord,
	registerConcordRepairs
};

if (typeof window !== 'undefined') {
	Object.assign(window, morphologyExports);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = morphologyExports;
}

if (state && typeof state.registerMorphologyEngine === 'function') {
	state.registerMorphologyEngine({ applyMorphology });
}

