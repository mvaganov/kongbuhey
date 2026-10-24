/**
 * Korean Engine Shared JSDoc Type Definitions
 *
 * Provides standardized type contracts for LLM agents and IDE static analysis,
 * eliminating ambiguity in domain entity structures and return values.
 */

/**
 * @typedef {Object} ConcordValidationResult
 * @property {boolean} valid - Whether the input complies with grammatical concord rules
 * @property {string[]} errors - Human-readable diagnostic error explanations
 * @property {string[]} [errorCodes] - Standardized machine-readable error codes (from ERROR_CODES)
 * @property {string[]} [suggestions] - Optional list of corrected or suggested alternatives
 * @property {string} [connective] - Canonical connective identified in the clause (if applicable)
 * @property {string} [originalSentence] - Original input string evaluated
 */

/**
 * @typedef {Object} Clause
 * @property {string} text - The raw clause string
 * @property {string} predicate - The terminal predicate / verb of the clause
 * @property {string} mood - The detected speech act mood ('declarative', 'imperative', etc.)
 * @property {string} [tense] - The detected grammatical tense ('past', 'present', 'future')
 * @property {string} [connective] - Clausal connective attaching to this clause
 * @property {string[]} [tags] - Associated semantic tags
 */

/**
 * @typedef {Object} ParsedSentence
 * @property {string} clause1 - The antecedent clause text
 * @property {string} connective - The canonical clausal connective (e.g. '-(으)러', '-아/어서')
 * @property {string} clause2 - The consequent clause text
 * @property {string} [connectiveWord] - The exact surface connective token found in the sentence
 */

/**
 * @typedef {Object} ConnectiveSpec
 * @property {Object} unit - The underlying language unit from data.js
 * @property {string} ko - The Korean canonical representation
 * @property {number} id - Language unit ID
 * @property {boolean} clause1_tense_allowed - Whether past tense is permissible in clause 1
 * @property {string[]} clause2_moods_allowed - Permissible mood endings in clause 2
 * @property {string[]} clause1_pos - Permissible parts of speech in clause 1
 * @property {boolean} same_subject - Whether clause 1 and 2 require identical subjects
 * @property {number} outcome_polarity - Outcome requirement (-1: negative, 0: neutral, 1: positive)
 * @property {boolean} motion_verb_required - Whether clause 2 strictly requires a motion predicate
 * @property {string} function - Clausal relationship type ('cause', 'contrast', 'purpose', etc.)
 * @property {string[]} surface_forms - Morphological surface representations
 */

/**
 * @typedef {Object} HangulDecomposition
 * @property {number} initial - Initial consonant index (0..18)
 * @property {number} medial - Medial vowel index (0..20)
 * @property {number} final - Final consonant index (0..27, 0 = no batchim)
 */

if (typeof module !== "undefined" && module.exports) {
	module.exports = {};
}
