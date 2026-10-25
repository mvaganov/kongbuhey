/**
 * text_analyzer.js
 * 
 * Korean Passage Ingestion, Morphological Decomposition, Homonym Disambiguation,
 * and Curriculum Gap Identification Engine for Kongbuhey.
 * 
 * Re-architected Facade & CLI runner delegating to the modularized korean/analyzer engine:
 *   - korean/analyzer/indexer.js          (In-memory indexing & tag caching)
 *   - korean/analyzer/particles.js        (Declarative particle specs & batchim rules)
 *   - korean/analyzer/syntax_frame.js     (SyntaxFrame evaluation & disambiguation)
 *   - korean/analyzer/verb_morphology.js  (Verb conjugation & adnominal deconstruction)
 *   - korean/analyzer/token_analyzer.js   (Single-token morphological decomposition)
 *   - korean/analyzer/sentence_analyzer.js (Sentence multi-word constructions)
 *   - korean/analyzer/passage_analyzer.js  (Passage analysis & text report formatting)
 */

const fs = require('fs');
const path = require('path');
const analyzer = require('./korean/analyzer/index.js');

/**
 * Analyzes a passage, and if running in Node with curriculum gaps, generates
 * scaffolded draft units into scratch/new_units_<passageName>.json.
 * 
 * @param {string} passageText The text of the passage to analyze
 * @param {string} passageName Identifier/source name for the passage
 * @returns {Object} Comprehensive analysis result object
 */
function analyzePassage(passageText, passageName = "Passage") {
	const result = analyzer.analyzePassage(passageText, passageName);

	// Automatically generate pre-populated draft file of missing words using schema_analysis.js
	if (result.missingVocab.length > 0 || result.missingGrammar.length > 0) {
		try {
			const scratchDir = path.resolve(__dirname, 'scratch');
			if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });
			const draftFile = path.join('scratch', `new_units_${passageName}.json`);
			const fullDraftPath = path.resolve(__dirname, draftFile);

			const schemaAnalysisPath = path.resolve(__dirname, 'schema_analysis.js');
			let scaffoldFn = null;
			let schemaTax = null;
			if (fs.existsSync(schemaAnalysisPath)) {
				const sa = require(schemaAnalysisPath);
				scaffoldFn = sa.scaffoldUnit;
				schemaTax = sa.getSchemaSummary();
			}

			const draftUnits = [];
			for (const mv of result.missingVocab) {
				const u = scaffoldFn ? scaffoldFn(mv.text, passageName, {
					isDescriptive: mv.pos === 'Descriptive Verb',
					isCounter: mv.pos && mv.pos.includes('Counter'),
					disambiguation: mv.gloss || ""
				}, schemaTax) : {
					Korean: mv.text,
					English: mv.gloss || `<English definition of "${mv.text}">`,
					PartofSpeech: mv.pos || "Noun",
					SemanticTags: ["general"],
					Disambiguation: "",
					Conjugation: mv.text.endsWith("하다") ? "hada" : "",
					Source: passageName,
					PriorityScore: 1,
					FormalityLevel: "Universal",
					HonorificRules: "",
					SemanticVector: JSON.stringify({ domain: "concept", type: "general" }),
					SyntaxFrame: ""
				};
				if (u) draftUnits.push(u);
			}

			for (const mg of result.missingGrammar) {
				const gu = scaffoldFn ? scaffoldFn(mg.text, passageName, {
					isVerbEnding: true,
					disambiguation: mg.gloss || ""
				}, schemaTax) : {
					Korean: mg.text,
					English: mg.gloss || `<English explanation of "${mg.text}">`,
					PartofSpeech: "Grammar",
					SemanticTags: ["grammar"],
					Disambiguation: "",
					Conjugation: ["{VP_AVst}"],
					Source: passageName,
					PriorityScore: 2,
					FormalityLevel: "Universal",
					HonorificRules: "",
					SemanticVector: JSON.stringify({ domain: "grammar", type: "verb_ending" }),
					SyntaxFrame: ""
				};
				if (gu) draftUnits.push(gu);
			}

			if (draftUnits.length > 0) {
				fs.writeFileSync(fullDraftPath, JSON.stringify(draftUnits, null, 2), 'utf8');
				result.draftFile = draftFile;
			} else if (fs.existsSync(fullDraftPath)) {
				try { fs.unlinkSync(fullDraftPath); } catch (_) {}
			}
		} catch (e) {
			// Non-fatal if drafting fails
		}
	}

	return result;
}

// =========================================================================
// CLI Execution & Module Exports
// =========================================================================

function runCli() {
	const studytexts = require('./studytexts.js');
	const args = process.argv.slice(2);
	let passageName = "studytext12";
	let textToAnalyze = studytexts.studytext12;

	if (args.length > 0 && !args[0].startsWith("-")) {
		passageName = args[0];
		if (studytexts[passageName]) {
			textToAnalyze = studytexts[passageName];
		} else {
			console.error(`Unknown studytext key '${passageName}', defaulting to studytext12.`);
			passageName = "studytext12";
			textToAnalyze = studytexts.studytext12;
		}
	}

	const report = analyzePassage(textToAnalyze, passageName);

	if (args.includes("--json")) {
		console.log(JSON.stringify(report, null, 2));
	} else {
		console.log(analyzer.formatAnalysisReport(report));
	}
}

if (require.main === module) {
	runCli();
}

module.exports = {
	analyzePassage,
	analyzeSentence: analyzer.analyzeSentence,
	analyzeSingleToken: analyzer.analyzeSingleToken,
	evaluateSyntaxFrame: analyzer.evaluateSyntaxFrame,
	disambiguateCandidates: analyzer.disambiguateCandidates,
	formatAnalysisReport: analyzer.formatAnalysisReport,
	// Export submodule engine for fine-grained access
	analyzer
};
