(function() {
/**
 * korean/analyzer/index.js
 *
 * Facade barrel for the Kongbuhey Korean Text Analyzer Subsystem.
 * Exposes passage, sentence, and token-level morphological analysis,
 * syntax frame evaluation, and homonym disambiguation.
 *
 * Platform: Node.js & Browser (Vanilla JS, zero dependencies).
 */

const indexer = (typeof require !== 'undefined' ? require('./indexer.js') : window);
const particles = (typeof require !== 'undefined' ? require('./particles.js') : window);
const syntaxFrame = (typeof require !== 'undefined' ? require('./syntax_frame.js') : window);
const verbMorphology = (typeof require !== 'undefined' ? require('./verb_morphology.js') : window);
const tokenAnalyzer = (typeof require !== 'undefined' ? require('./token_analyzer.js') : window);
const sentenceAnalyzer = (typeof require !== 'undefined' ? require('./sentence_analyzer.js') : window);
const passageAnalyzer = (typeof require !== 'undefined' ? require('./passage_analyzer.js') : window);

const analyzerExports = {
	// Indexer
	getIndex: indexer.getIndex,
	resetIndexCache: indexer.resetIndexCache,
	compileMweMatcher: indexer.compileMweMatcher,

	// Particles
	PARTICLE_SPECS: particles.PARTICLE_SPECS,
	findExactParticle: particles.findExactParticle,
	checkBatchimRequirement: particles.checkBatchimRequirement,
	decomposeCompoundParticle: particles.decomposeCompoundParticle,
	recognizeCompoundParticle: particles.recognizeCompoundParticle,

	// Syntax Frame & Disambiguation
	SEMANTIC_ONTOLOGY: syntaxFrame.SEMANTIC_ONTOLOGY,
	getUnitSemanticTags: syntaxFrame.getUnitSemanticTags,
	matchesSemanticCategory: syntaxFrame.matchesSemanticCategory,
	evaluateSyntaxFrame: syntaxFrame.evaluateSyntaxFrame,
	disambiguateCandidates: syntaxFrame.disambiguateCandidates,

	// Verb Morphology
	VERB_SUFFIX_RULES: verbMorphology.VERB_SUFFIX_RULES,
	matchVerbSuffix: verbMorphology.matchVerbSuffix,
	matchAdnominalEnding: verbMorphology.matchAdnominalEnding,

	// Token & Sentence Analyzers
	analyzeSingleToken: tokenAnalyzer.analyzeSingleToken,
	analyzeSentence: sentenceAnalyzer.analyzeSentence,
	tryMatchMultiWord: sentenceAnalyzer.tryMatchMultiWord,
	isInformalConnective: sentenceAnalyzer.isInformalConnective,
	buildInformalConnectives: indexer.buildInformalConnectives,
	DEFAULT_INFORMAL_CONNECTIVES: indexer.DEFAULT_INFORMAL_CONNECTIVES,

	// Passage Analyzer & Formatter
	analyzePassage: passageAnalyzer.analyzePassage,
	formatAnalysisReport: passageAnalyzer.formatAnalysisReport
};

if (typeof window !== 'undefined') {
	window.koreanAnalyzer = analyzerExports;
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = analyzerExports;
}
})();
