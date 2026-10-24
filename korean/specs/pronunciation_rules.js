/**
 * Standard Korean Pronunciation (표준 발음법) Rules and Phonological Tables
 *
 * Declarative tables specifying coda neutralization, liaison, tensification,
 * nasalization, lateralization, and statutory exceptions according to the
 * National Institute of Korean Language (국립국어원 표준 발음법).
 */

// -----------------------------------------------------------------------------
// Core Phonological Transitions
// -----------------------------------------------------------------------------

const FINAL_TO_INITIAL = Object.freeze({
	1: 0, 2: 1, 4: 2, 7: 3, 8: 5, 16: 6, 17: 7, 19: 9, 20: 10,
	22: 12, 23: 14, 24: 15, 25: 16, 26: 17
});

const TENSIFY_INITIAL = Object.freeze({
	0: 1, 3: 4, 7: 8, 9: 10, 12: 13
});

const NASAL_VERB_ROOTS = Object.freeze(new Set([
	'신', '안', '앉', '삼', '젊', '닮', '감', '품', '숨', '넘'
]));

const DOUBLE_CODA_LIAISON = Object.freeze({
	3: [1, 10], 5: [4, 12], 6: [0, 2], 9: [8, 0], 10: [8, 6],
	11: [8, 7], 12: [8, 10], 13: [8, 16], 14: [8, 17], 15: [0, 5], 18: [17, 10]
});

const DOUBLE_CODA_SIMPLIFY = Object.freeze({
	3: 1,   // ㄳ -> ㄱ
	5: 4,   // ㄵ -> ㄴ
	6: 4,   // ㄶ -> ㄴ
	10: 16, // ㄻ -> ㅁ
	12: 8,  // ㄽ -> ㄹ
	13: 8,  // ㄾ -> ㄹ
	14: 17, // ㄿ -> ㅂ
	15: 8,  // ㅀ -> ㄹ
	18: 17  // ㅄ -> ㅂ
});

const H_ONSET_MAP = Object.freeze({
	1: [0, 15], 2: [0, 15], 3: [0, 15], 24: [0, 15], 9: [8, 15],
	7: [0, 16], 19: [0, 16], 20: [0, 16], 25: [0, 16],
	22: [0, 14], 23: [0, 14], 5: [4, 14],
	17: [0, 17], 14: [0, 17], 18: [0, 17], 26: [0, 17], 11: [8, 17]
});

const NASAL_CODA = Object.freeze({
	1: 21, 7: 4, 17: 16, 2: 21, 19: 4, 20: 4, 22: 4, 23: 4, 24: 21, 25: 4, 26: 16
});

// -----------------------------------------------------------------------------
// Statutory Phonology Exceptions (국립국어원 표준 발음법)
// -----------------------------------------------------------------------------

// 제10항 다만 & 제11항 다만: Double Coda Verb Stem Exceptions
const DOUBLE_CODA_VERB_EXCEPTIONS = Object.freeze({
	// Verb root 밟- -> [ㅂ] before all consonants
	baepRoots: new Set(['밟']),
	// Derivative compounds with 넓- -> [넙]
	neolbCompounds: Object.freeze({
		'넓죽하다': '넙쭈카다',
		'넓죽': '넙쭉',
		'넓둥글다': '넙뚱글다',
		'넓둥글': '넙뚱글',
		'넓적하다': '넙쩌카다',
		'넓적': '넙쩍'
	}),
	// Verb stems ending in ㄺ that dissimilate to [ㄹ] before ㄱ suffix
	rieulGiyeokVerbRoots: new Set(['맑', '밝', '붉', '묽', '읽', '얽', '갉', '굵'])
});

// 제15항: Substantive morpheme boundary neutralization before liaison
// Neutralizes coda stop first before liaising into vowel-initial substantive roots
const SUBSTANTIVE_BOUNDARY_EXCEPTIONS = Object.freeze({
	'옷 안': '오단',
	'밭 아래': '바다래',
	'늪 앞': '느밥',
	'겉옷': '거돋',
	'젖어미': '저더미',
	'맛없다': '마덥따',
	'맛없': '마덥',
	'첫인상': '처딘상',
	'꽃 위': '꼬뒤'
});

// 제20항 다만: Sino-Korean non-lateralizing compounds (ㄴ + ㄹ -> [ㄴ + ㄴ])
const SINO_NON_LATERALIZING_MAP = Object.freeze({
	'생산량': '생산냥',
	'의견란': '의견난',
	'임진란': '임진난',
	'결단력': '결딴녁',
	'상견례': '상견녜',
	'입원료': '이붠뇨',
	'횡단로': '횡단노',
	'이원론': '이원논',
	'구근류': '구근뉴',
	'동원령': '동원녕',
	'공권력': '공꿘녁',
	'상관료': '상관뇨',
	'구직란': '구직난',
	'어린이난': '어린이난'
});

const SINO_NON_LATERALIZING_COMPOUNDS = Object.freeze(new Set(Object.keys(SINO_NON_LATERALIZING_MAP)));

// 제24항 다만: Passive/Causative suffix -기- does not tensify after ㄴ, ㅁ
const PASSIVE_CAUSATIVE_GI_VERBS = Object.freeze(new Set([
	'안기', '감기', '굶기', '옮기', '남기', '숨기'
]));

// 제26항 다만: Reduplicated Hanja compounds (no tensification)
const REDUPLICATED_HANJA_WORDS = Object.freeze(new Set([
	'허허실실', '절절하다'
]));

// 제28항: Saisori Glottalization in pure/hybrid compound nouns
const SAISORI_COMPOUND_MAP = Object.freeze({
	'문고리': '문꼬리',
	'눈동자': '눈똥자',
	'길가': '길까',
	'손재주': '손째주',
	'술잔': '술짠',
	'강가': '강까',
	'등불': '등뿔',
	'밤길': '밤낄',
	'비빔밥': '비빔빱',
	'아침밥': '아침빱',
	'물고기': '물꼬기'
});

// 제29항: 'ㄴ' Insertion Rules & Explicit Exceptions
const N_INSERTION_COMPOUNDS = Object.freeze({
	'솜이불': '솜니불',
	'맨입': '맨닙',
	'꽃잎': '꼰닙',
	'물약': '물략',
	'식용유': '시굥뉴',
	'학여울': '항녀울',
	'알약': '알략',
	'휘발유': '휘발류'
});

const NON_N_INSERTION_WORDS = Object.freeze(new Set([
	'6·25', '금융', '송별연', '등용문'
]));

// 제16항: Korean Alphabet Letter Names Pronunciation Exceptions
const LETTER_NAME_EXCEPTIONS = Object.freeze({
	'디귿이': '디그시', '디귿을': '디그슬', '디귿에': '디그세',
	'지읒이': '지으시', '지읒을': '지으슬', '지읒에': '지으세',
	'치읓이': '치으시', '치읓을': '치으슬', '치읓에': '치으세',
	'키읔이': '키으기', '키읔을': '키으글', '키읔에': '키으게',
	'티읕이': '티으시', '티읕을': '티으슬', '티읕에': '티으세',
	'피읖이': '피으비', '피읖을': '피으블', '피읖에': '피으베',
	'히읗이': '히으시', '히읗을': '히으슬', '히읗에': '히으세'
});

const pronunciationRules = {
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
};

if (typeof window !== 'undefined') {
	Object.assign(window, pronunciationRules);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = pronunciationRules;
}
