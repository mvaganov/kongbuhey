// Universal Constants
const { K } = (typeof require !== 'undefined') ? require('./constants.js') : (typeof window !== 'undefined' ? window : {});

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
const verifiedGenerator = require('./korean/generation/verified_sentence_generator.js');

const { DATA_SCHEMA } = (typeof require !== 'undefined') ? require('./data.js') : (typeof window !== 'undefined' ? window : {});

const VERIFIED_SENTENCES_PATH = path.resolve(__dirname, 'verified_sentences.js');
const SCAFFOLD_PRIORITY_INSTRUCTION = "TODO: PriorityScore [0.5=ultra-simple, 1=top essential ~200, 2=beginner ~1k, 3=elementary ~2.5k, 4=intermediate ~5k, 5=niche]";

/**
 * Loads existing static Verified Sentence entries from verified_sentences.js.
 *
 * @param {string} [filePath]
 * @returns {Array<Object>}
 */
function loadVerifiedSentencesFromFile(filePath = VERIFIED_SENTENCES_PATH) {
	if (!fs.existsSync(filePath)) return [];
	try {
		delete require.cache[require.resolve(filePath)];
		const mod = require(filePath);
		if (!Array.isArray(mod.VERIFIED_SENTENCES)) return [];
		return mod.VERIFIED_SENTENCES.map(row => verifiedGenerator.hydrateVerifiedSentence(row));
	} catch (_) {
		return [];
	}
}

/**
 * Writes an array of Verified Sentence templates into verified_sentences.js.
 * Compacts templates into array-of-arrays representation matching VERIFIED_TEMPLATE_SCHEMA.
 *
 * @param {Array<Object|Array>} templates
 * @param {string} [filePath]
 */
function writeVerifiedSentencesToFile(templates, filePath = VERIFIED_SENTENCES_PATH) {
	const compactRows = templates.map(t => verifiedGenerator.serializeCompactTemplate(t));
	const rowLines = compactRows.map(row => '\t' + JSON.stringify(row)).join(',\n');

	const content = [
		'// constants-disable',
		'/**',
		' * verified_sentences.js',
		' *',
		' * Compact static repository of Verified Sentence templates discovered from ingested',
		' * Korean study texts. Represented as an array of arrays conforming to VERIFIED_TEMPLATE_SCHEMA',
		' * and VERIFIED_SLOT_SCHEMA, with lexical definitions and default tags derived from data.js.',
		' */',
		'',
		'const VERIFIED_TEMPLATE_SCHEMA = {',
		'\tId: 0,',
		'\tTitle: 1,',
		'\tSource: 2,',
		'\tOriginalKo: 3,',
		'\tPunctuation: 4,',
		'\tSlots: 5,',
		"\t0: 'Id',",
		"\t1: 'Title',",
		"\t2: 'Source',",
		"\t3: 'OriginalKo',",
		"\t4: 'Punctuation',",
		"\t5: 'Slots'",
		'};',
		'',
		'const VERIFIED_SLOT_SCHEMA = {',
		'\tUnitId: 0,',
		'\tSurface: 1,',
		'\tCategory: 2,',
		'\tStemForm: 3,',
		'\tSuffix: 4,',
		'\tPrefix: 5,',
		'\tGrammar: 6,',
		'\tCustomTags: 7,',
		'\tTrailingPunct: 8,',
		"\t0: 'UnitId',",
		"\t1: 'Surface',",
		"\t2: 'Category',",
		"\t3: 'StemForm',",
		"\t4: 'Suffix',",
		"\t5: 'Prefix',",
		"\t6: 'Grammar',",
		"\t7: 'CustomTags',",
		"\t8: 'TrailingPunct'",
		'};',
		'',
		`const VERIFIED_SENTENCES = [\n${rowLines}\n];`,
		'',
		"if (typeof window !== 'undefined') {",
		'\twindow.VERIFIED_TEMPLATE_SCHEMA = VERIFIED_TEMPLATE_SCHEMA;',
		'\twindow.VERIFIED_SLOT_SCHEMA = VERIFIED_SLOT_SCHEMA;',
		'\twindow.VERIFIED_SENTENCES = VERIFIED_SENTENCES;',
		'}',
		'',
		"if (typeof module !== 'undefined' && module.exports) {",
		'\tmodule.exports = {',
		'\t\tVERIFIED_TEMPLATE_SCHEMA,',
		'\t\tVERIFIED_SLOT_SCHEMA,',
		'\t\tVERIFIED_SENTENCES',
		'\t};',
		'}',
		'// constants-enable',
		''
	].join('\n');

	fs.writeFileSync(filePath, content, 'utf8');
	try {
		delete require.cache[require.resolve(filePath)];
	} catch (_) {}
	if (verifiedGenerator && typeof verifiedGenerator.resetHardcodedVerifiedCache === 'function') {
		verifiedGenerator.resetHardcodedVerifiedCache();
	}
}

/**
 * Adds newly discovered Verified Sentence templates to verified_sentences.js,
 * deduplicating by Korean sentence text and source.
 *
 * @param {Array<Object>} newTemplates
 * @param {string} [filePath]
 * @param {Object} [options]
 * @returns {{ added: number, updated: number, total: number, templates: Array<Object> }}
 */
function addVerifiedSentencesToFile(newTemplates, filePath = VERIFIED_SENTENCES_PATH, options = {}) {
	const existing = loadVerifiedSentencesFromFile(filePath);
	const overwrite = Boolean(options.overwrite);
	const byKey = new Map();

	for (const item of existing) {
		const koText = item && (item.originalKo || item.korean);
		if (!koText) continue;
		const key = `${item.source || ''}::${koText}`;
		byKey.set(key, item);
	}

	let added = 0;
	let updated = 0;

	for (const tmpl of (newTemplates || [])) {
		const koText = tmpl && (tmpl.originalKo || tmpl.korean);
		if (!koText) continue;
		const cleanCopy = JSON.parse(JSON.stringify(tmpl));
		cleanCopy.isHardcoded = true;

		// AST Recomposition Validation Gate: Verify grammatical & syntactic integrity
		if (typeof verifiedGenerator !== 'undefined' && typeof verifiedGenerator.recomposeASTFromVerifiedSentence === 'function') {
			const units = require('./data.js').KR_EN_languageUnits;
			const slotChoices = (cleanCopy.slots || []).map(s => {
				const u = s.originalUnitId != null ? units[s.originalUnitId] : null;
				return {
					slotIndex: s.index,
					chosenUnit: u,
					chosenUnitId: s.originalUnitId,
					surfaceKo: s.originalSurface,
					isVariedSlot: false,
					pos: u ? u[DATA_SCHEMA.PartofSpeech] : s.pos,
					grammar: s.grammar
				};
			});
			const realized = { ko: koText, en: '' };
			const ast = verifiedGenerator.recomposeASTFromVerifiedSentence(cleanCopy, slotChoices, realized);
			const valResult = verifiedGenerator.validateVerifiedSentence(ast, realized, slotChoices);
			if (!valResult.valid || (valResult.errors && valResult.errors.length > 0)) {
				continue; // Reject erroneous template from entering verified_sentences.js
			}
		}

		const key = `${cleanCopy.source || ''}::${koText}`;
		if (!byKey.has(key)) {
			existing.push(cleanCopy);
			byKey.set(key, cleanCopy);
			added++;
		} else if (overwrite) {
			const prev = byKey.get(key);
			const idx = existing.indexOf(prev);
			if (idx !== -1) {
				existing[idx] = cleanCopy;
			}
			byKey.set(key, cleanCopy);
			updated++;
		}
	}

	if (added > 0 || updated > 0 || !fs.existsSync(filePath)) {
		writeVerifiedSentencesToFile(existing, filePath);
	}

	return {
		added,
		updated,
		total: existing.length,
		templates: existing
	};
}

/**
 * Synchronizes verified_sentences.js across all ingested study texts defined in test.js.
 *
 * @param {string} [filePath]
 * @returns {{ totalPassages: number, totalTemplates: number }}
 */
function syncAllStudyTextsVerifiedSentences(filePath = VERIFIED_SENTENCES_PATH) {
	const studytexts = require('./studytexts.js');
	const testPath = path.resolve(__dirname, 'test.js');
	let passages = Object.keys(studytexts).filter(k => k.startsWith('studytext'));

	if (fs.existsSync(testPath)) {
		const testContent = fs.readFileSync(testPath, 'utf8');
		const m = testContent.match(/const INGESTED_STUDY_TEXTS = \[([^\]]+)\];/);
		if (m) {
			const parsed = m[1].replace(/["'\s\n]/g, '').split(',').filter(Boolean);
			if (parsed.length > 0) passages = [...parsed];
		}
	}
	if (studytexts.justKorean && !passages.includes('justKorean')) {
		passages.push('justKorean');
	}

	const index = analyzer.getIndex();
	const allTemplates = [];
	const seenKorean = new Set();

	for (const pName of passages) {
		const text = studytexts[pName];
		if (!text) continue;
		const extracted = verifiedGenerator.extractVerifiedSentencesFromPassage(text, pName, { index, isHardcoded: true });
		for (const tmpl of extracted) {
			const koText = tmpl.originalKo || tmpl.korean;
			if (!koText || seenKorean.has(koText)) continue;
			seenKorean.add(koText);
			tmpl.id = `vs_${allTemplates.length + 1}`;
			tmpl.isHardcoded = true;
			allTemplates.push(tmpl);
		}
	}

	writeVerifiedSentencesToFile(allTemplates, filePath);
	return {
		totalPassages: passages.length,
		totalTemplates: allTemplates.length
	};
}

/**
 * Analyzes a passage, extracts Verified Sentence templates, and if running in Node
 * with curriculum gaps, generates scaffolded draft units into scratch/new_units_<passageName>.json.
 * 
 * @param {string} passageText The text of the passage to analyze
 * @param {string} passageName Identifier/source name for the passage
 * @param {Object} [options] Optional flags ({ saveVerified: boolean })
 * @returns {Object} Comprehensive analysis result object
 */
function analyzePassage(passageText, passageName = "Passage", options = {}) {
	const result = analyzer.analyzePassage(passageText, passageName);

	// Extract Verified Sentence templates from the passage
	result.verifiedSentences = verifiedGenerator.extractVerifiedSentencesFromPassage(
		passageText,
		passageName,
		{ index: analyzer.getIndex() }
	);

	if (options && options.saveVerified && result.verifiedSentences.length > 0) {
		result.verifiedSaveStats = addVerifiedSentencesToFile(result.verifiedSentences);
	}

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
					isDescriptive: mv.pos === K.DESCRIPTIVE_VERB,
					isCounter: mv.pos && mv.pos.includes('Counter'),
					disambiguation: mv.gloss || ""
				}, schemaTax) : {
					Korean: mv.text,
					English: mv.gloss || `<English definition of "${mv.text}">`,
					PartofSpeech: mv.pos || K.NOUN,
					SemanticTags: [K.GENERAL],
					Disambiguation: "",
					Conjugation: mv.text.endsWith("하다") ? K.HADA : "",
					Source: passageName,
					PriorityScore: SCAFFOLD_PRIORITY_INSTRUCTION,
					FormalityLevel: K.UNIVERSAL,
					HonorificRules: "",
					SemanticData: { domain: K.CONCEPT, type: K.GENERAL },
					SemanticVector: { domain: K.CONCEPT, type: K.GENERAL },
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
					PartofSpeech: K.POS_GRAMMAR,
					SemanticTags: [K.GRAMMAR],
					Disambiguation: "",
					Conjugation: ["{VP_AVst}"],
					Source: passageName,
					PriorityScore: SCAFFOLD_PRIORITY_INSTRUCTION,
					FormalityLevel: K.UNIVERSAL,
					HonorificRules: "",
					SemanticData: { domain: K.GRAMMAR, type: "verb_ending" },
					SemanticVector: { domain: K.GRAMMAR, type: "verb_ending" },
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

	if (args.includes('--sync-verified')) {
		const stats = syncAllStudyTextsVerifiedSentences();
		console.log(`[VERIFIED SENTENCES] Synchronized ${stats.totalTemplates} Verified Sentence templates across ${stats.totalPassages} ingested study texts into verified_sentences.js.`);
		return;
	}

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

	const saveVerified = args.includes('--add-verified') || args.includes('--save-verified');
	const report = analyzePassage(textToAnalyze, passageName, { saveVerified });

	if (args.includes("--json")) {
		console.log(JSON.stringify(report, null, 2));
	} else {
		console.log(analyzer.formatAnalysisReport(report));
		if (report.verifiedSentences) {
			console.log(`[VERIFIED SENTENCES] Discovered ${report.verifiedSentences.length} Verified Sentence templates in "${passageName}".`);
		}
		if (report.verifiedSaveStats) {
			console.log(`[VERIFIED SENTENCES] Saved to verified_sentences.js (+${report.verifiedSaveStats.added} added, ${report.verifiedSaveStats.total} total).`);
		}
	}
}

if (require.main === module) {
	runCli();
}

module.exports = {
	analyzePassage,
	loadVerifiedSentencesFromFile,
	writeVerifiedSentencesToFile,
	addVerifiedSentencesToFile,
	syncAllStudyTextsVerifiedSentences,
	extractVerifiedSentencesFromPassage: verifiedGenerator.extractVerifiedSentencesFromPassage,
	extractVerifiedSentenceTemplate: verifiedGenerator.extractVerifiedSentenceTemplate,
	getIndex: analyzer.getIndex,
	analyzeSentence: analyzer.analyzeSentence,
	analyzeSingleToken: analyzer.analyzeSingleToken,
	evaluateSyntaxFrame: analyzer.evaluateSyntaxFrame,
	disambiguateCandidates: analyzer.disambiguateCandidates,
	formatAnalysisReport: analyzer.formatAnalysisReport,
	// Export submodule engine for fine-grained access
	analyzer,
	verifiedGenerator
};
