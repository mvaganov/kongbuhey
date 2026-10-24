/**
 * Standard Korean Pronunciation (표준 발음법) Rules and Phonological Tables
 *
 * Declarative tables specifying coda neutralization, liaison, tensification,
 * nasalization, and lateralization transitions.
 */

const FINAL_TO_INITIAL = Object.freeze({
	1: 0, 2: 1, 4: 2, 7: 3, 8: 5, 16: 6, 17: 7, 19: 9, 20: 10, 22: 12, 23: 14, 24: 15, 25: 16, 26: 17
});

const TENSIFY_INITIAL = Object.freeze({
	0: 1, 3: 4, 7: 8, 9: 10, 12: 13
});

const NASAL_VERB_ROOTS = Object.freeze(new Set(['신', '안', '앉', '삼', '젊', '닮', '감', '품', '숨', '넘']));

const DOUBLE_CODA_LIAISON = Object.freeze({
	3: [1, 10], 5: [4, 12], 6: [0, 2], 9: [8, 0], 10: [8, 6],
	11: [8, 7], 12: [8, 10], 13: [8, 16], 14: [8, 17], 15: [0, 5], 18: [17, 10]
});

const DOUBLE_CODA_SIMPLIFY = Object.freeze({
	3: 1, 5: 4, 6: 4, 10: 16, 12: 8, 13: 8, 14: 17, 15: 8, 18: 17
});

const H_ONSET_MAP = Object.freeze({
	1: [0, 15], 2: [0, 15], 3: [0, 15], 24: [0, 15], 9: [8, 15],
	7: [0, 16], 19: [0, 16], 20: [0, 16], 25: [0, 16],
	22: [0, 14], 23: [0, 14], 5: [4, 14],
	17: [0, 17], 14: [0, 17], 18: [0, 17], 26: [0, 17], 11: [8, 17]
});

const NASAL_CODA = Object.freeze({
	1: 21, 7: 4, 17: 16
});

const pronunciationRules = {
	FINAL_TO_INITIAL,
	TENSIFY_INITIAL,
	NASAL_VERB_ROOTS,
	DOUBLE_CODA_LIAISON,
	DOUBLE_CODA_SIMPLIFY,
	H_ONSET_MAP,
	NASAL_CODA
};

if (typeof window !== 'undefined') {
	Object.assign(window, pronunciationRules);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = pronunciationRules;
}
