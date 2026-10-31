/**
 * ============================================================================
 * korean.js - Korean Language Processing Engine (Facade & Re-Export Barrel)
 * ============================================================================
 *
 * Provides a unified public API for Korean language generation, morphological analysis,
 * phonological assimilation, numeral synthesis, and semantic concordance engines (Features 1-11).
 * Guarantees 100% backward compatibility for Node.js (CommonJS) and browser environments.
 *
 * ----------------------------------------------------------------------------
 * 1. LINGUISTIC FEATURES INDEX (F1 – F11)
 * ----------------------------------------------------------------------------
 * | Feature | Domain                                 | Implementation Module                  | Declarative Specs / Data              |
 * | :---    | :---                                   | :---                                  | :---                                  |
 * | F1      | Basic Hangul & Syllables               | korean/core/primitives.js             | Built-in Jamo tables                  |
 * | F2      | Numeral Systems (Sino & Native)        | korean/core/numbers.js                | Dynamically loaded from data.js       |
 * | F3      | Regular Verb Conjugation & Particles   | korean/core/morphology.js             | Built-in affix rules                  |
 * | F4      | Phonological Assimilation              | korean/core/morphology.js             | korean/specs/pronunciation_rules.js   |
 * | F5      | Honorific & Humble Suppletion          | korean/core/morphology.js             | data.js (HonorificRules, sv)          |
 * | F6      | Classifier / Counter Concord           | korean/concord/classifier_concord.js  | data.js (counters, measureWord)       |
 * | F7      | Deictic & Spatial Concord              | korean/concord/spatial_concord.js     | data.js (deictic, position)           |
 * | F8      | Mood, Modality & Negation              | korean/concord/mood_concord.js        | data.js (imperative, inability, etc.) |
 * | F9      | Adverbial & NPI Concord                | korean/concord/adverbial_concord.js   | data.js (adverb_degree, npi, etc.)    |
 * | F10     | Verb Argument & Case Frames            | korean/core/morphology.js             | korean/specs/verb_argument_specs.js   |
 * | F11     | Clausal Connective Concord             | korean/concord/clausal_validation.js  | data.js (clausalConnectives)          |
 * |         |                                        | korean/concord/clausal_generator.js   |                                       |
 *
 * ----------------------------------------------------------------------------
 * 2. ENGINE CORE & SHARED UTILITIES
 * ----------------------------------------------------------------------------
 * - State Registry   : korean/state.js                    - Centralized Map/Set collections dynamically initialized from data.js.
 * - Constants        : korean/constants/error_codes.js    - Frozen ERROR_CODES dictionary for concord diagnostics.
 * - Constants        : korean/constants/tags.js           - Frozen GRAMMAR_TAGS dictionary for semantic/syntactic tags.
 * - Type Contracts   : korean/types.js                    - JSDoc typedefs (ConcordValidationResult, Clause, ConnectiveSpec).
 * - Filter Evaluator : korean/utils/filter_evaluator.js   - Sandbox for parsing and running dynamic collocation filters.
 * - LUT Serializer   : korean/utils/lut_serializer.js     - Language Unit Tree export and diagnostic serialization.
 * - Template Engine  : korean/generation/template_engine.js - Template token parsing and slot expansion.
 * - Generator        : korean/generation/semantic_generator.js - High-level natural sentence generation workflows.
 * - Root Facade      : korean.js                          - Re-export barrel guaranteeing backward compatibility.
 *
 * ----------------------------------------------------------------------------
 * 3. RULES FOR LLM AGENTS MODIFYING THIS CODEBASE
 * ----------------------------------------------------------------------------
 * 1. Context Window Safety: Keep individual files focused (< 350 lines). If a module grows,
 *    split generation logic from validation logic.
 * 2. Never Hardcode Hangul in State Sets: All semantic vocabulary sets must be populated
 *    dynamically from data.js via state.initSemanticSets(). Unit tests enforce this via AST/string checks.
 * 3. Use Frozen Constants: Always reference ERROR_CODES and GRAMMAR_TAGS instead of raw strings.
 * 4. Standard Concord Return: Every validator function must return { valid, errors, errorCodes }.
 */

// 1. Core Primitives & State
const primitives = require('./korean/core/primitives.js');
const state = require('./korean/state.js');
const errorCodes = require('./korean/constants/error_codes.js');
const grammarTags = require('./korean/constants/tags.js');

// 2. Core Engines
const stemEngine = require('./korean/core/stem_engine.js');
const lexiconIndex = require('./korean/core/lexicon_index.js');
const numbers = require('./korean/core/numbers.js');
const morphology = require('./korean/core/morphology.js');
const phonetics = require('./korean/phonetics/pronunciation.js');
const englishPhonemes = require('./korean/phonetics/english_phonemes.js');

// 3. Declarative Specs & Evaluators
const verbSpecs = require('./korean/specs/verb_argument_specs.js');
const pronunciationSpecs = require('./korean/specs/pronunciation_rules.js');
const filterEvaluator = require('./korean/utils/filter_evaluator.js');
const lutSerializer = require('./korean/utils/lut_serializer.js');

// 4. Concord Engines (Features 6 - 11)
const classifierConcord = require('./korean/concord/classifier_concord.js');
const spatialConcord = require('./korean/concord/spatial_concord.js');
const moodConcord = require('./korean/concord/mood_concord.js');
const adverbialConcord = require('./korean/concord/adverbial_concord.js');
const clausalValidation = require('./korean/concord/clausal_validation.js');
const clausalGenerator = require('./korean/concord/clausal_generator.js');

// 5. Generation & Translation Engines
const literalRealizer = require('./korean/translation/literal_realizer.js');
const naturalRealizer = require('./korean/translation/natural_realizer.js');
const templateEngine = require('./korean/generation/template_engine.js');
const semanticGenerator = require('./korean/generation/semantic_generator.js');
const sentenceAst = require('./korean/generation/sentence_ast.js');
const unitGenerator = require('./korean/generation/unit_sentence_generator.js');
const sentenceValidator = require('./korean/generation/sentence_validator.js');

// 6. Text Analyzer Subsystem
const analyzer = require('./korean/analyzer/index.js');

// Helper functions for options tracking and usage filters
function setCurrentUsageFilter(filter) {
	state.currentUsageFilter = filter;
}

function getTotalOptionsCut() {
	return state.totalOptionsCutToPreventCombinatorialExplosion;
}

function resetTotalOptionsCut() {
	state.totalOptionsCutToPreventCombinatorialExplosion = 0;
}

function markUnitUsed(unit) {
	if (unit && typeof unit[primitives.DATA_SCHEMA.Id] === 'number') {
		state.usedUnitIds.add(unit[primitives.DATA_SCHEMA.Id]);
	}
}

function getUsedUnitIds() {
	return state.usedUnitIds;
}

function resetUsedUnits() {
	state.usedUnitIds.clear();
}

function getRandom(arr) {
	if (!arr || arr.length === 0) return null;
	const rnd = (state && typeof state.seededRandom === 'function') ? state.seededRandom() : Math.random();
	return arr[Math.floor(rnd * arr.length)];
}

// Assemble unified export surface
const exportedMembers = {
	// Constants
	ERROR_CODES: errorCodes.ERROR_CODES,
	GRAMMAR_TAGS: grammarTags.GRAMMAR_TAGS,

	// Primitives
	DATA_SCHEMA: primitives.DATA_SCHEMA,
	hasTag: primitives.hasTag,
	parseSemanticData: primitives.parseSemanticData,
	parseSemanticVector: primitives.parseSemanticVector,
	HANGUL_INITIALS: primitives.HANGUL_INITIALS,
	HANGUL_MEDIALS: primitives.HANGUL_MEDIALS,
	HANGUL_FINALS: primitives.HANGUL_FINALS,
	decomposeHangul: primitives.decomposeHangul,
	composeHangul: primitives.composeHangul,
	setFinal: primitives.setFinal,
	hasBatchim: primitives.hasBatchim,
	hasRieulBatchim: primitives.hasRieulBatchim,
	getStem: primitives.getStem,
	getVowelHarmony: primitives.getVowelHarmony,
	matchesBaseSyllable: primitives.matchesBaseSyllable,

	// State collections & Lifecycle
	properNames: state.properNames,
	getProperNames: templateEngine.getProperNames,
	setProperNames: templateEngine.setProperNames,
	getRandomProperName: templateEngine.getRandomProperName,
	initProperNames: state.initProperNames,
	initNumberSystem: state.initNumberSystem,
	initSemanticSets: state.initSemanticSets,
	initMorphologyData: state.initMorphologyData,
	initTemplateToGrammarMap: state.initTemplateToGrammarMap,
	initAllDataSets: state.initAllDataSets,
	currentUsageFilter: state.currentUsageFilter,
	setCurrentUsageFilter,
	totalOptionsCutToPreventCombinatorialExplosion: state.totalOptionsCutToPreventCombinatorialExplosion,
	getTotalOptionsCut,
	resetTotalOptionsCut,
	usedUnitIds: state.usedUnitIds,
	markUnitUsed,
	getUsedUnitIds,
	resetUsedUnits,
	getRandom,

	// Numerals (Sino & Native)
	SINO_DIGITS: state.SINO_DIGITS,
	PURE_KOREAN_TENS: state.PURE_KOREAN_TENS,
	PURE_KOREAN_ONES_CARDINAL: state.PURE_KOREAN_ONES_CARDINAL,
	PURE_KOREAN_ONES_ATTRIBUTIVE: state.PURE_KOREAN_ONES_ATTRIBUTIVE,
	KOREAN_NUMBER_VALUES: state.KOREAN_NUMBER_VALUES,
	SINO_TEN: state.SINO_TEN,
	SINO_HUNDRED: state.SINO_HUNDRED,
	SINO_THOUSAND: state.SINO_THOUSAND,
	SINO_TEN_THOUSAND: state.SINO_TEN_THOUSAND,
	NUM_ZERO: state.NUM_ZERO,
	PURE_KOREAN_TWENTY_ATTRIBUTIVE: state.PURE_KOREAN_TWENTY_ATTRIBUTIVE,
	getSinoNumber: numbers.getSinoNumber,
	getKoreanNumber: numbers.getKoreanNumber,
	getNumberTokenOptions: numbers.getNumberTokenOptions,
	getFilteredWords: numbers.getFilteredWords,
	TokenOption: numbers.TokenOption,
	deduplicateTokenOptions: numbers.deduplicateTokenOptions,

	// Morphology & Pronunciation
	getPronunciationWord: phonetics.getPronunciationWord,
	getPronunciation: phonetics.getPronunciation,
	toEnglishPhonemes: englishPhonemes.toEnglishPhonemes,
	transliterateSyllable: englishPhonemes.transliterateSyllable,
	ONSET_EN: englishPhonemes.ONSET_EN,
	NUCLEUS_EN: englishPhonemes.NUCLEUS_EN,
	CODA_EN: englishPhonemes.CODA_EN,
	applyMorphology: morphology.applyMorphology,
	resolvePureMorphology: stemEngine.resolvePureMorphology,
	conjugateAoStem: stemEngine.conjugateAoStem,
	deriveConnectiveEndings: stemEngine.deriveConnectiveEndings,
	getLexiconIndex: lexiconIndex.getLexiconIndex,
	invalidateLexiconIndex: lexiconIndex.invalidateLexiconIndex,
	getCompiledCollocationFilter: lexiconIndex.getCompiledCollocationFilter,
	attachParticle: morphology.attachParticle,
	getConjugatedStem: morphology.getConjugatedStem,
	isDescriptiveVerb: morphology.isDescriptiveVerb,
	isActionVerb: morphology.isActionVerb,
	canTakeMood: morphology.canTakeMood,
	getNegationSuppletion: morphology.getNegationSuppletion,
	getAffirmativeCounterpart: morphology.getAffirmativeCounterpart,
	conjugatePredicate: morphology.conjugatePredicate,
	buildNegatedPredicate: morphology.buildNegatedPredicate,
	buildMoodPredicate: morphology.buildMoodPredicate,
	getNounUnit: morphology.getNounUnit,
	getAllNounUnits: morphology.getAllNounUnits,
	getVerbUnit: morphology.getVerbUnit,
	buildActionVerbPhrase: morphology.buildActionVerbPhrase,
	buildDescriptiveVerbPhrase: morphology.buildDescriptiveVerbPhrase,
	getNounCandidatesForVerb: morphology.getNounCandidatesForVerb,
	getSubjectCandidatesForDescriptiveVerb: morphology.getSubjectCandidatesForDescriptiveVerb,
	getVerbParticleType: morphology.getVerbParticleType,
	PARTICLE_PAIRS: state.PARTICLE_PAIRS,
	PRONOUN_REPLACEMENTS: state.PRONOUN_REPLACEMENTS,

	// Honorifics & Social Deixis (Feature 5)
	ELDER_NOUN_TITLES: state.ELDER_NOUN_TITLES,
	INANIMATE_INSTITUTION_NAMES: state.INANIMATE_INSTITUTION_NAMES,
	ORIGIN_VERBS: state.ORIGIN_VERBS,
	ALLATIVE_GOAL_VERBS: state.ALLATIVE_GOAL_VERBS,
	STATIC_EXISTENCE_VERBS: state.STATIC_EXISTENCE_VERBS,
	HUMBLE_DATIVE_VERBS: state.HUMBLE_DATIVE_VERBS,
	HONORIFIC_VERB_SUPPLETIONS: state.HONORIFIC_VERB_SUPPLETIONS,
	HUMBLE_VERB_SUPPLETIONS: state.HUMBLE_VERB_SUPPLETIONS,
	HONORIFIC_NOUN_SUPPLETIONS: state.HONORIFIC_NOUN_SUPPLETIONS,
	HUMBLE_PRONOUN_SUPPLETIONS: state.HUMBLE_PRONOUN_SUPPLETIONS,
	PLAIN_COUNTERPARTS: state.PLAIN_COUNTERPARTS,
	HONORIFIC_WORDS: state.HONORIFIC_WORDS,
	HUMBLE_WORDS: state.HUMBLE_WORDS,
	FORBIDDEN_PLAIN_WORDS_FOR_ELDERS: state.FORBIDDEN_PLAIN_WORDS_FOR_ELDERS,
	isElderNoun: morphology.isElderNoun,
	isInanimateInstitution: morphology.isInanimateInstitution,
	getHonorificVerb: morphology.getHonorificVerb,
	getHumbleVerb: morphology.getHumbleVerb,
	getHonorificNoun: morphology.getHonorificNoun,
	getHumblePronoun: morphology.getHumblePronoun,
	getPlainCounterpart: morphology.getPlainCounterpart,
	isHonorificWord: morphology.isHonorificWord,
	isHumbleWord: morphology.isHumbleWord,
	isForbiddenForElder: morphology.isForbiddenForElder,
	getHonorificPredicate: morphology.getHonorificPredicate,
	getHumblePredicate: morphology.getHumblePredicate,
	applyHonorificConcord: morphology.applyHonorificConcord,
	validateHonorificConcord: morphology.validateHonorificConcord,

	// Temporal Concord
	PAST_TIME_WORDS: state.PAST_TIME_WORDS,
	FUTURE_TIME_WORDS: state.FUTURE_TIME_WORDS,
	PRESENT_TIME_WORDS: state.PRESENT_TIME_WORDS,
	BARE_TIME_WORDS_NO_PARTICLE: state.BARE_TIME_WORDS_NO_PARTICLE,
	PAST_GRAMMAR_IDS: state.PAST_GRAMMAR_IDS,
	FUTURE_GRAMMAR_IDS: state.FUTURE_GRAMMAR_IDS,
	PRESENT_GRAMMAR_IDS: state.PRESENT_GRAMMAR_IDS,
	getTemporalPolarity: morphology.getTemporalPolarity,
	isDeicticTimeWord: morphology.isDeicticTimeWord,
	filterWordsByTense: morphology.filterWordsByTense,
	filterGrammarByTense: morphology.filterGrammarByTense,
	validateTemporalConcord: morphology.validateTemporalConcord,
	applyTemporalConcord: morphology.applyTemporalConcord,

	// Classifiers & Counters (Feature 6)
	KOREAN_CLASSIFIERS: state.KOREAN_CLASSIFIERS,
	SINO_CLASSIFIERS: state.SINO_CLASSIFIERS,
	CLASSIFIER_UNITS: state.CLASSIFIER_UNITS,
	CLASSIFIER_NOUN_SPECS: state.CLASSIFIER_NOUN_SPECS,
	isClassifier: classifierConcord.isClassifier,
	getClassifierNumeralType: classifierConcord.getClassifierNumeralType,
	getMatchingClassifier: classifierConcord.getMatchingClassifier,
	getMatchingNounsForClassifier: classifierConcord.getMatchingNounsForClassifier,
	getClassifierCandidatesForNoun: classifierConcord.getClassifierCandidatesForNoun,
	isCompatibleNounAndClassifier: classifierConcord.isCompatibleNounAndClassifier,
	buildCountingPhrase: classifierConcord.buildCountingPhrase,
	buildClockTimePhrase: classifierConcord.buildClockTimePhrase,
	getMonthName: classifierConcord.getMonthName,
	applyCounterConcord: classifierConcord.applyCounterConcord,
	validateCounterConcord: classifierConcord.validateCounterConcord,

	// Spatial & Deictic (Feature 7)
	SPATIAL_POSITIONS: state.SPATIAL_POSITIONS,
	DEICTIC_DETERMINERS: state.DEICTIC_DETERMINERS,
	DEICTIC_PRONOUNS: state.DEICTIC_PRONOUNS,
	DEICTIC_LOCATIVES: state.DEICTIC_LOCATIVES,
	DEICTIC_DIRECTIONS: state.DEICTIC_DIRECTIONS,
	getSpatialPositions: spatialConcord.getSpatialPositions,
	getDeicticDemonstratives: spatialConcord.getDeicticDemonstratives,
	buildSpatialPhrase: spatialConcord.buildSpatialPhrase,
	buildDeicticPhrase: spatialConcord.buildDeicticPhrase,
	isStaticExistenceVerb: spatialConcord.isStaticExistenceVerb,
	validateSpatialConcord: spatialConcord.validateSpatialConcord,
	applySpatialConcord: spatialConcord.applySpatialConcord,

	// Mood, Negation & Modality (Feature 8)
	IMPERATIVE_GRAMMAR_IDS: state.IMPERATIVE_GRAMMAR_IDS,
	PROPOSITIVE_GRAMMAR_IDS: state.PROPOSITIVE_GRAMMAR_IDS,
	INABILITY_NEGATION_IDS: state.INABILITY_NEGATION_IDS,
	GENERAL_NEGATION_IDS: state.GENERAL_NEGATION_IDS,
	VOLITIONAL_GRAMMAR_IDS: state.VOLITIONAL_GRAMMAR_IDS,
	FORBIDDEN_NEGATIVE_ROOTS: state.FORBIDDEN_NEGATIVE_ROOTS,
	NEGATION_SUPPLETIONS: state.NEGATION_SUPPLETIONS,
	AFFIRMATIVE_COUNTERPARTS: state.AFFIRMATIVE_COUNTERPARTS,
	SHORT_NEGATION_WORDS: state.SHORT_NEGATION_WORDS,
	SHORT_INABILITY_WORDS: state.SHORT_INABILITY_WORDS,
	SHORT_GENERAL_WORDS: state.SHORT_GENERAL_WORDS,
	DESCRIPTIVE_SURFACE_MAP: state.DESCRIPTIVE_SURFACE_MAP,
	FORBIDDEN_DV_IMPERATIVE_FORMS: state.FORBIDDEN_DV_IMPERATIVE_FORMS,
	FORBIDDEN_DV_PROPOSITIVE_FORMS: state.FORBIDDEN_DV_PROPOSITIVE_FORMS,
	FORBIDDEN_DV_LONG_INABILITY_FORMS: state.FORBIDDEN_DV_LONG_INABILITY_FORMS,
	FORBIDDEN_DV_VOLITIONAL_FORMS: state.FORBIDDEN_DV_VOLITIONAL_FORMS,
	validateMoodConcord: moodConcord.validateMoodConcord,
	applyMoodConcord: moodConcord.applyMoodConcord,

	// Adverbial & NPI Concord (Feature 9)
	DEGREE_ADVERBS: state.DEGREE_ADVERBS,
	MANNER_ADVERBS: state.MANNER_ADVERBS,
	DISCOURSE_ADVERBS: state.DISCOURSE_ADVERBS,
	NEGATIVE_POLARITY_ADVERBS: state.NEGATIVE_POLARITY_ADVERBS,
	ALL_NPI_WORDS: state.ALL_NPI_WORDS,
	AFFIRMATIVE_DEGREE_ADVERBS: state.AFFIRMATIVE_DEGREE_ADVERBS,
	isDegreeAdverb: adverbialConcord.isDegreeAdverb,
	isMannerAdverb: adverbialConcord.isMannerAdverb,
	isDiscourseAdverb: adverbialConcord.isDiscourseAdverb,
	isNegativePolarityAdverb: adverbialConcord.isNegativePolarityAdverb,
	isNegativePredicate: adverbialConcord.isNegativePredicate,
	canAdverbPrecede: adverbialConcord.canAdverbPrecede,
	validateAdverbConcord: adverbialConcord.validateAdverbConcord,
	applyAdverbConcord: adverbialConcord.applyAdverbConcord,

	// Clausal Connectives (Feature 11)
	CLAUSAL_CONNECTIVES: state.CLAUSAL_CONNECTIVES,
	CAUSAL_CONNECTIVES: state.CAUSAL_CONNECTIVES,
	CONTRAST_CONNECTIVES: state.CONTRAST_CONNECTIVES,
	PURPOSE_CONNECTIVES: state.PURPOSE_CONNECTIVES,
	CONDITION_CONNECTIVES: state.CONDITION_CONNECTIVES,
	SIMULTANEOUS_CONNECTIVES: state.SIMULTANEOUS_CONNECTIVES,
	MOTION_VERBS: state.MOTION_VERBS,
	getConnectiveSpecs: clausalValidation.getConnectiveSpecs,
	isClausalConnective: clausalValidation.isClausalConnective,
	detectClauseMood: clausalValidation.detectClauseMood,
	detectClauseTense: clausalValidation.detectClauseTense,
	isMotionPredicate: clausalValidation.isMotionPredicate,
	parseSentenceToClauses: clausalValidation.parseSentenceToClauses,
	canConnectiveJoin: clausalValidation.canConnectiveJoin,
	validateClausalConcord: clausalValidation.validateClausalConcord,
	generateClausalDistractor: clausalGenerator.generateClausalDistractor,
	applyClausalConcord: clausalGenerator.applyClausalConcord,
	generateClausalQuizItem: clausalGenerator.generateClausalQuizItem,

	// Specs & Evaluator
	ACTION_VERB_SPECS: verbSpecs.ACTION_VERB_SPECS,
	DESCRIPTIVE_VERB_SPECS: verbSpecs.DESCRIPTIVE_VERB_SPECS,
	parseAndValidateCollocationFilter: filterEvaluator.parseAndValidateCollocationFilter,
	compileCollocationFilter: filterEvaluator.compileCollocationFilter,
	DOUBLE_CODA_VERB_EXCEPTIONS: pronunciationSpecs.DOUBLE_CODA_VERB_EXCEPTIONS,
	SUBSTANTIVE_BOUNDARY_EXCEPTIONS: pronunciationSpecs.SUBSTANTIVE_BOUNDARY_EXCEPTIONS,
	SINO_NON_LATERALIZING_COMPOUNDS: pronunciationSpecs.SINO_NON_LATERALIZING_COMPOUNDS,
	PASSIVE_CAUSATIVE_GI_VERBS: pronunciationSpecs.PASSIVE_CAUSATIVE_GI_VERBS,
	REDUPLICATED_HANJA_WORDS: pronunciationSpecs.REDUPLICATED_HANJA_WORDS,
	SAISORI_COMPOUND_MAP: pronunciationSpecs.SAISORI_COMPOUND_MAP,
	N_INSERTION_COMPOUNDS: pronunciationSpecs.N_INSERTION_COMPOUNDS,
	NON_N_INSERTION_WORDS: pronunciationSpecs.NON_N_INSERTION_WORDS,
	LETTER_NAME_EXCEPTIONS: pronunciationSpecs.LETTER_NAME_EXCEPTIONS,

	// Templates & Generation
	getTokenOptions: templateEngine.getTokenOptions,
	generateTemplateTokenOptions: templateEngine.generateTemplateTokenOptions,
	generateTemplateOptions: templateEngine.generateTemplateOptions,
	SemanticConfig: semanticGenerator.SemanticConfig,
	shouldApplySemanticConstraint: semanticGenerator.shouldApplySemanticConstraint,
	findGrammarUnitForTemplate: semanticGenerator.findGrammarUnitForTemplate,
	expandSemanticActionVerb: semanticGenerator.expandSemanticActionVerb,
	expandSemanticDescriptiveVerb: semanticGenerator.expandSemanticDescriptiveVerb,
	expandSemanticClause: semanticGenerator.expandSemanticClause,
	expandSemanticTerminal: semanticGenerator.expandSemanticTerminal,
	generateSemanticSentence: semanticGenerator.generateSemanticSentence,
	getGrammarRegistry: sentenceAst.getGrammarRegistry,
	resolveParticleUnit: sentenceAst.resolveParticleUnit,
	resolveEndingUnit: sentenceAst.resolveEndingUnit,
	realizeKoreanFromAST: sentenceAst.realizeKoreanFromAST,
	realizeLiteralEnglish: literalRealizer.realizeLiteralEnglish,
	realizeNaturalEnglish: naturalRealizer.realizeNaturalEnglish,
	generateSentenceForUnit: unitGenerator.generateSentenceForUnit,
	generateSentencesForUnit: unitGenerator.generateSentencesForUnit,
	validateSentenceAST: sentenceValidator.validateSentenceAST,
	validateSentenceString: sentenceValidator.validateSentenceString,
	SentenceValidator: sentenceValidator,

	// LUT Utilities
	reconstructFromLanguageUnitTree: lutSerializer.reconstructFromLanguageUnitTree,
	flattenLanguageUnitTree: lutSerializer.flattenLanguageUnitTree,
	encodeLanguageUnitIds: lutSerializer.encodeLanguageUnitIds,
	decodeLanguageUnitIds: lutSerializer.decodeLanguageUnitIds,

	// Text Analyzer Subsystem
	analyzer: analyzer,
	analyzePassage: analyzer.analyzePassage,
	analyzeSentence: analyzer.analyzeSentence,
	analyzeSingleToken: analyzer.analyzeSingleToken,
	evaluateSyntaxFrame: analyzer.evaluateSyntaxFrame,
	disambiguateCandidates: analyzer.disambiguateCandidates,

	// PRNG & Seeding
	setRandomSeed: state.setRandomSeed,
	getRandomSeed: state.getRandomSeed,
	seededRandom: state.seededRandom
};

if (typeof window !== 'undefined') {
	Object.assign(window, exportedMembers);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = exportedMembers;
}
