/**
 * ============================================================================
 * constants.js - Universal Common Constants for Kongbuhey (공부해)
 * ============================================================================
 *
 * Centralized, frozen registry of high-frequency string literals used across
 * data.js, the Korean grammatical concordance engine, webapp, and test suites.
 *
 * Benefits:
 *  - Eliminates magic strings and typographical errors across the codebase.
 *  - Speeds up runtime comparisons via pointer identity checks (===).
 *  - Reduces file size of data.js and curriculum datasets.
 *  - Provides intuitive auto-completion for developers and LLM agents.
 *
 * Usage:
 *  - Namespaced: K.POS.ACTION_VERB, K.CONJ.REGULAR, K.TAG.PLACE, K.FORMALITY.UNIVERSAL
 *  - Shorthand on K: K.AV, K.DV, K.N, K.G, K.ADV, K.NUM, K.PRON, K.DET, K.EXCL
 *  - Top-Level Aliases: AV, DV, N, G, ADV, NUM, PRON, DET, EXCL
 */

(function(global) {
  'use strict';

  // 1. Canonical Parts of Speech
  const POS = Object.freeze({
    NOUN: "Noun",
    ACTION_VERB: "Action Verb",
    DESCRIPTIVE_VERB: "Descriptive Verb",
    GRAMMAR: "Grammar",
    ADVERB: "Adverb",
    NUMBER: "Number",
    PRONOUN: "Pronoun",
    EXCLAMATION: "Exclamation",
    DETERMINER: "Determiner",

    // Ergonomic shorthand properties
    N: "Noun",
    AV: "Action Verb",
    DV: "Descriptive Verb",
    G: "Grammar",
    ADV: "Adverb",
    NUM: "Number",
    PRON: "Pronoun",
    EXCL: "Exclamation",
    DET: "Determiner",
  });

  // 2. Conjugation Classes & Irregular Patterns
  const CONJ = Object.freeze({
    REGULAR: "regular",
    HADA: "hada",
    B_IRREGULAR: "b_irregular",
    L_IRREGULAR: "l_irregular",
    EU_IRREGULAR: "eu_irregular",
    REU_IRREGULAR: "reu_irregular",
    H_IRREGULAR: "h_irregular",
    S_IRREGULAR: "s_irregular",
    D_IRREGULAR: "d_irregular",
    P_IRREGULAR: "p_irregular",
    REGULAR_VOWEL: "regular_vowel",
    REGULAR_CONSONANT: "regular_consonant",
    REGULAR_A: "regular_a",
    REGULAR_EO: "regular_eo",
  });

  // 3. Formality Levels & Speech Registers
  const FORMALITY = Object.freeze({
    UNIVERSAL: "Universal",
    FLEXIBLE: "Flexible",
    PLAIN: "Plain (해체)",
    POLITE: "Polite (해요체)",
    FORMAL: "Formal",
    FORMAL_POLITE: "Formal Polite (합쇼체)",
    POLITE_INFORMAL: "Polite Informal (해요체)",
  });

  // 4. High-Frequency Semantic Tags
  const TAG = Object.freeze({
    PLACE: "place",
    OBJECT: "object",
    TRANSITIVE_GENERAL: "transitive_general",
    TIME: "time",
    FOOD: "food",
    GRADABLE: "gradable",
    INTRANSITIVE_GENERAL: "intransitive_general",
    PERSON: "person",
    DESCRIPTIVE_GENERAL: "descriptive_general",
    CONCEPT: "concept",
    FACILITY: "facility",
    ACTIVITY: "activity",
    SOCIAL: "social",
    ABSTRACT: "abstract",
    GRAMMAR: "grammar",
    COMMUNICATION: "communication",
    HEALTH: "health",
    KOREANNUMBER: "koreanNumber",
    PARTICLE: "particle",
    ACTION: "action",
    TRANSPORTATION: "transportation",
    ACADEMIC: "academic",
    ADVERB: "adverb",
    GENERAL: "general",
    SINOROOT: "sinoRoot",
    MEASUREWORD: "measureWord",
    CLOTHING: "clothing",
    COMMERCE: "commerce",
    EMOTION: "emotion",
    DESCRIPTIVE_PERSON: "descriptive_person",
    FAMILY: "family",
    WEARABLE: "wearable",
    HONORIFIC: "honorific",
    NATURE: "nature",
    PROPER_NOUN: "proper_noun",
    TRAVEL: "travel",
    DEGREE: "degree",
    INTRANSITIVE: "intransitive",
    WEATHER: "weather",
    DISCOURSE: "discourse",
  });

  // 5. Canonical Curriculum Source Lesson Identifiers
  const SRC = Object.freeze({
    SUOBI01: "SUOBI01",
    SUOBI02: "SUOBI02",
    SUOBI03: "SUOBI03",
    SUOBI04: "SUOBI04",
    SUOBI05: "SUOBI05",
    SUOBI06: "SUOBI06",
    SUOBI07: "SUOBI07",
    SUOBI08: "SUOBI08",
    SUOBI09: "SUOBI09",
    SUOBI10: "SUOBI10",
    SUOBI11: "SUOBI11",
    SUOBI12: "SUOBI12",
    SUOBI13: "SUOBI13",
    SUOBI14: "SUOBI14",
    SUOBI15: "SUOBI15",
    SUOBI16: "SUOBI16",
    SUOBI17: "SUOBI17",
    SUOBI18: "SUOBI18",
    DEVTEST: "devtest",
    CLASS2012: "class2012",
    CLASS2051: "class2051",
    CLASS2052: "class2052",
    CLASS2061: "class2061",
    CLASS2062: "class2062",
    CLASS2072: "class2072",
    CLASS2082: "class2082",
    CLASS2111: "class2111",
    CLASS2161: "class2161",
    CUSTOM_PASSAGE: "custom_passage",
    STUDYTEXT22: "studytext22",
  });

  // Master Frozen Container K
  const K = Object.freeze({
    POS,
    CONJ,
    FORMALITY,
    TAG,
    SRC,

    // Direct top-level ergonomic accessors
    N: POS.NOUN,
    AV: POS.ACTION_VERB,
    DV: POS.DESCRIPTIVE_VERB,
    G: POS.GRAMMAR,
    ADV: POS.ADVERB,
    NUM: POS.NUMBER,
    PRON: POS.PRONOUN,
    EXCL: POS.EXCLAMATION,
    DET: POS.DETERMINER,
  });

  // Shorthand Aliases for data.js rows and compact scripts
  const N = POS.NOUN;
  const AV = POS.ACTION_VERB;
  const DV = POS.DESCRIPTIVE_VERB;
  const G = POS.GRAMMAR;
  const ADV = POS.ADVERB;
  const NUM = POS.NUMBER;
  const PRON = POS.PRONOUN;
  const DET = POS.DETERMINER;
  const EXCL = POS.EXCLAMATION;

  // Browser global export
  if (typeof window !== 'undefined') {
    window.K = K;
    window.N = N;
    window.AV = AV;
    window.DV = DV;
    window.G = G;
    window.ADV = ADV;
    window.NUM = NUM;
    window.PRON = PRON;
    window.DET = DET;
    window.EXCL = EXCL;
  }

  // Node.js CommonJS export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      K,
      POS,
      CONJ,
      FORMALITY,
      TAG,
      SRC,
      N,
      AV,
      DV,
      G,
      ADV,
      NUM,
      PRON,
      DET,
      EXCL,
    };
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : global));

