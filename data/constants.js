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

    // Grammatical Roles, Moods, Tenses, Polarities & Slot Categories
    SUBJECT: "subject",
    TOPIC: "topic",
    DATIVE: "dative",
    RECIPIENT: "recipient",
    LOCATION: "location",
    DIRECTION: "direction",
    PREDICATE: "predicate",
    COPULA: "copula",
    CONNECTIVE: "connective",
    CLAUSAL_CONNECTIVE: "clausal_connective",
    ENDING: "ending",
    AUXILIARY: "auxiliary",
    PAST: "past",
    PRESENT: "present",
    FUTURE: "future",
    AFFIRMATIVE: "affirmative",
    NEGATIVE: "negative",
    DECLARATIVE: "declarative",
    INTERROGATIVE: "interrogative",
    IMPERATIVE: "imperative",
    PROPOSITIVE: "propositive",
    PROHIBITION: "prohibition",
    INABILITY: "inability",
    FORMAL_HIGH: "formal_high",
    INFORMAL: "informal",
    DESCRIPTIVE: "descriptive",
    NOMINAL: "nominal",
    NOUN_PARTICLE: "noun_particle",
    EXACT_LEXICAL: "exact_lexical",
    CONJUGATED_VERB: "conjugated_verb",
    AUXILIARY_CONSTRUCTION: "auxiliary_construction",
    ADNOMINAL_MODIFIER: "adnominal_modifier",
    FIXED_GRAMMAR: "fixed_grammar",
    NUMERIC_PHRASE: "numeric_phrase",
    NOUN_COPULA: "noun_copula",
    STEM_DA: "stem_da",
    FIXED_BASE: "fixed_base",

    // High-Frequency Concordance & Selection Tags
    COUNTER: "counter",
    ELDER_NOUN: "elder_noun",
    PROFESSION: "profession",
    QUESTION_WORD: "questionWord",
    COUNTRY: "country",
    POSITION: "position",
    VEHICLE: "vehicle",
    DRINK: "drink",
    INTRANSITIVE_MOTION: "intransitive_motion",
    INTRANSITIVE_PLACE: "intransitive_place",
    LOCATIVE_GOAL: "locative_goal",
    LOCATIVE_ORIGIN: "locative_origin",
    LOCATIVE_STATIC: "locative_static",
    DATIVE_PERSON: "dative_person",
    SINO_NUMBER: "sinoNumber",
    DEMONSTRATIVE: "demonstrative",
    ADVERB_MANNER: "adverb_manner",
    MANNER: "manner",
    ROOM: "room",
    INANIMATE_INSTITUTION: "inanimate_institution",
    EVENT: "event",
    BOUND_NOUN: "bound_noun",
    FINANCE: "finance",
    NUMERIC: "numeric",
    SPORTS: "sports",
    PROXIMAL: "proximal",
    MEDIAL: "medial",
    DISTAL: "distal",
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

  // ============================================================================
  // Dynamic Reflection Engine for Flattened & Safe Shorthand Constants
  // ============================================================================
  // Discovers all non-colliding constants across categories at runtime.
  // Flattens constants directly onto K (e.g. K.NOUN, K.OBJECT, K.REGULAR, K.UNIVERSAL)
  // to eliminate character-count bloat while preserving taxonomy containers (K.POS, K.TAG).
  // Prevents shorthand collision for variables differing across categories (GRAMMAR/ADVERB).

  const JS_RESERVED = new Set([
    'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
    'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function',
    'if', 'import', 'in', 'instanceof', 'new', 'return', 'super', 'switch',
    'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
    'let', 'static', 'enum', 'await', 'implements', 'package', 'protected',
    'interface', 'private', 'public', 'null', 'true', 'false', 'NaN', 'Infinity', 'undefined'
  ]);

  const categories = [POS, CONJ, FORMALITY, TAG, SRC];
  const catNames = ['POS', 'CONJ', 'FORMALITY', 'TAG', 'SRC'];

  // Detect key collisions across categories where values differ
  const keyRegistry = new Map();
  for (let i = 0; i < categories.length; i++) {
    const catObj = categories[i];
    const catName = catNames[i];
    for (const key of Object.keys(catObj)) {
      if (!keyRegistry.has(key)) keyRegistry.set(key, []);
      keyRegistry.get(key).push({ cat: catName, val: catObj[key] });
    }
  }

  const collidingKeys = new Set();
  for (const [key, owners] of keyRegistry.entries()) {
    if (owners.length > 1) {
      const vals = new Set(owners.map(o => o.val));
      if (vals.size > 1) collidingKeys.add(key);
    }
  }

  const SAFE_SHORTHANDS = {};

  // 1. POS canonical ergonomic shorthands
  const posShorthands = {
    N: POS.NOUN,
    AV: POS.ACTION_VERB,
    DV: POS.DESCRIPTIVE_VERB,
    G: POS.GRAMMAR,
    ADV: POS.ADVERB,
    NUM: POS.NUMBER,
    PRON: POS.PRONOUN,
    EXCL: POS.EXCLAMATION,
    DET: POS.DETERMINER,
  };
  for (const [k, v] of Object.entries(posShorthands)) {
    SAFE_SHORTHANDS[k] = v;
  }

  // 2. CONJ, FORMALITY, TAG, SRC shorthands (filtering out collisions and reserved keywords)
  for (let i = 1; i < categories.length; i++) {
    const catObj = categories[i];
    for (const [key, val] of Object.entries(catObj)) {
      if (collidingKeys.has(key)) continue;
      if (JS_RESERVED.has(key) || JS_RESERVED.has(key.toLowerCase())) continue;
      SAFE_SHORTHANDS[key] = val;
    }
  }

  // 3. Master Flattened & Frozen Container K
  const flattenedK = {
    // Sub-objects preserved for taxonomy, reflection, and backward compatibility
    POS,
    CONJ,
    FORMALITY,
    TAG,
    SRC,
    SAFE_SHORTHANDS,

    // Direct POS ergonomic accessors
    N: POS.NOUN,
    AV: POS.ACTION_VERB,
    DV: POS.DESCRIPTIVE_VERB,
    G: POS.GRAMMAR,
    ADV: POS.ADVERB,
    NUM: POS.NUMBER,
    PRON: POS.PRONOUN,
    EXCL: POS.EXCLAMATION,
    DET: POS.DETERMINER,
  };

  // Populate POS canonical keys
  for (const [key, val] of Object.entries(POS)) {
    if (key === 'GRAMMAR') {
      flattenedK.POS_GRAMMAR = val;
    } else if (key === 'ADVERB') {
      flattenedK.POS_ADVERB = val;
    } else {
      flattenedK[key] = val;
    }
  }

  // Populate other categories (CONJ, FORMALITY, TAG, SRC) directly on K
  for (const catObj of [CONJ, FORMALITY, TAG, SRC]) {
    for (const [key, val] of Object.entries(catObj)) {
      if (key === 'GRAMMAR') {
        flattenedK.TAG_GRAMMAR = val;
        flattenedK.GRAMMAR = val; // Default K.GRAMMAR to semantic tag "grammar"
      } else if (key === 'ADVERB') {
        flattenedK.TAG_ADVERB = val;
        flattenedK.ADVERB = val; // Default K.ADVERB to semantic tag "adverb"
      } else {
        flattenedK[key] = val;
      }
    }
  }

  const K = Object.freeze(flattenedK);

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
    window.POS = POS;
    window.CONJ = CONJ;
    window.FORMALITY = FORMALITY;
    window.TAG = TAG;
    window.SRC = SRC;
    window.SAFE_SHORTHANDS = SAFE_SHORTHANDS;
    for (const [k, v] of Object.entries(SAFE_SHORTHANDS)) {
      window[k] = v;
    }
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
      SAFE_SHORTHANDS,
      ...SAFE_SHORTHANDS,
    };
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : global));

