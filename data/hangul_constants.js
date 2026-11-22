/**
 * hangul_constants.js - every Hangul literal that code (not data) depends on, each under a name that says WHY the code needs it.
 *
 * The goal is linguistic knowledge in data (data.js tags, SemanticData), not code. Each entry here is a known exception: a word or
 * fragment some logic tests for by spelling. Reading the names alone should tell you what rule exists and where, so the list doubles
 * as a code-quality backlog: an entry that is really a fact about particular words ("these verbs...", "this counter...") is a candidate
 * to become a data tag, after which the entry and its code path can go. See docs/architecture.md section 1.
 *
 * Naming: <AREA>_<RULE>_<ROLE>, use-specific. Two rules that test the same spelling get two names (the reasons differ, so their future
 * fixes differ). AREA is the owning function or module (SLOT = isUnitEligibleForSlot in verified_sentence_generator.js).
 * Each entry's comment: the rule, then "Data fix:" when the knowledge could move to data.tags/SemanticData, or "Mechanics" when it is
 * grammar machinery (endings, particles, jamo) that legitimately lives in code.
 *
 * Usage: browser global HANGUL_CONSTANTS (classic script, load right after data/constants.js); Node: require(...).HANGUL_CONSTANTS.
 * Regex patterns are built from these with new RegExp(...) at module load, never with Hangul inline.
 */
(function(root) {
'use strict';

const HANGUL_CONSTANTS = Object.freeze({
	// ---- SLOT: isUnitEligibleForSlot (korean/generation/verified_sentence_generator.js) ----

	// 개월 (months) is a counter only usable after a number; never fills a non-numeric slot. Data fix: tag counter_numeric_only.
	SLOT_COUNTER_ONLY_IN_NUMERIC_SLOT_MONTHS: '개월',
	// Zero words (영 Sino zero, 공 zero read in phone numbers) may only replace another zero word. Data fix: tag zero_number.
	SLOT_ZERO_WORDS_REPLACE_ONLY_ZERO: Object.freeze(['영', '공']),
	// Native cardinals with a shortened attributive form (하나->한, 둘->두 ...): without a particle the slot is attributive, so the
	// bare form is wrong. Data fix: SemanticData.attributiveForm (only words with it are excluded).
	SLOT_NATIVE_CARDINALS_SHORTENED_BEFORE_COUNTER: Object.freeze(['하나', '둘', '셋', '넷', '열하나', '열둘', '열셋', '열넷', '스물']),
	// A slot whose suffix contains 주 is treated as benefactive (-아/어 주다). Mechanics, but crude: should test the grammar unit, not a syllable.
	SLOT_BENEFACTIVE_SUFFIX_MARKER: '주',
	// A benefactive slot (-아/어 주다 / 드리다) cannot take a giving verb as the main verb ("*주어 주다"). Data fix: tag giving_verb.
	SLOT_BENEFACTIVE_EXCLUDED_MAIN_VERB_GIVE: '주다',
	SLOT_BENEFACTIVE_EXCLUDED_MAIN_VERB_GIVE_HONORIFIC: '드리다',
	// 시 (o'clock) and other counters never substitute for each other: telling time is not counting. Data fix: tag clock_counter.
	SLOT_CLOCK_HOUR_COUNTER: '시',
	// Present adnominal ending -는 as it appears in a slot's grammar text. Mechanics (should match the grammar unit id instead).
	SLOT_PRESENT_ADNOMINAL_ENDING_TEXTS: Object.freeze(['-는', '는']),
	// Descriptive verbs that take -는 (있다/없다 and compounds: 재미있다, 맛없다). Data fix: tag takes_neun_adnominal.
	SLOT_PRESENT_ADNOMINAL_DV_SUFFIXES: Object.freeze(['있다', '없다']),
});

if (typeof module !== 'undefined' && module.exports) module.exports = { HANGUL_CONSTANTS };
else root.HANGUL_CONSTANTS = HANGUL_CONSTANTS;
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : global));
