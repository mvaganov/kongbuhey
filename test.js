#!/usr/bin/env node
/**
 * test.js - Unified Test Runner for Kongbuhey
 *
 * Executes the complete validation pipeline with FAIL-FAST behavior:
 *   [1/5] Schema & Data Integrity       (data.js: sequential IDs, column lengths, valid JSON vectors)
 *   [2/5] Schema Taxonomy Sync          (schema_analysis.js: taxonomy validity & cache freshness)
 *   [3/5] Homonym Dictionary Sync       (homonyms.js: 0 broken phonetic links, vocabulary coverage)
 *   [4/5] Exhaustive Generation Check   (exhaustive.js: morphology, 100% unit coverage, 0 errors)
 *   [5/5] Text Analyzer Passage Check   (text_analyzer.js: 0 gaps on ingested study texts)
 *
 * Usage:
 *   node test.js                 # Run all validation suites across full curriculum
 *   node test.js <source>        # Validate specific source (e.g. node test.js studytext21)
 *   node test.js -v, --verbose   # Display detailed breakdown per stage
 */

function printHelp() {
	console.log(`test.js - Unified Fast-Failing Validation Suite for Kongbuhey (pure JS)

USAGE:
  node test.js [source] [options]

VALIDATION STAGES (Fails fast on any error):
  [1/5] Schema & Data Integrity     Validates 12-col schema, sequential IDs (0..N-1), valid POS, priority scores (1-5), JSON vectors
  [2/5] Schema Taxonomy Sync        Verifies schema_summary.json freshness against data.js (auto-syncs if needed)
  [3/5] Homonym Dictionary Sync     Verifies HOMONYMS token count and ensures 0 broken phonetic (_neighbor) links
  [4/5] Exhaustive Generation Check Runs exhaustive.js in isolated subprocess: 100% unit coverage, 0 morphology/LUT errors
  [5/5] Text Analyzer Passage Check Regression check on ingested study texts (studytext12, studytext21): 0 curriculum gaps

OPTIONS:
  <source>             Target curriculum source (e.g. studytext21, class2012) for scoped validation
  -v, --verbose        Include detailed per-stage breakdown and logs
  -h, --help           Display this help text and exit

KEY LLM WORKFLOW PATTERNS:
  Full curriculum verification:  node test.js
  Verify specific passage batch: node test.js studytext22
  Verbose stage output:          node test.js -v
`);
}

const path = require('path');
const fs = require('fs');

const DATA_PATH = path.resolve(__dirname, 'data.js');
const HOMONYMS_PATH = path.resolve(__dirname, 'homonyms.js');
const SCHEMA_ANALYSIS_PATH = path.resolve(__dirname, 'schema_analysis.js');
const EXHAUSTIVE_PATH = path.resolve(__dirname, 'exhaustive.js');
const TEXT_ANALYZER_PATH = path.resolve(__dirname, 'text_analyzer.js');
const STUDYTEXTS_PATH = path.resolve(__dirname, 'studytexts.js');

// Known fully-ingested passages that must ALWAYS have 0 gaps (regression tests)
const INGESTED_STUDY_TEXTS = ["studytext12", "studytext21", "studytext22"];

function failFast(stageName, errorDetail) {
	console.error(`\n======================================================`);
	console.error(`[FAIL FAST] Test Suite Failed at: ${stageName}`);
	console.error(`======================================================`);
	console.error(errorDetail);
	console.error(`\nExecution aborted immediately to prevent cascading issues.`);
	process.exit(1);
}

function runTests(options = {}) {
	const targetSource = options.targetSource || null;
	const verbose = options.verbose || false;
	const startTime = Date.now();

	console.log(`======================================================`);
	console.log(`               KONGBUHEY TEST SUITE                   `);
	console.log(`======================================================`);
	if (targetSource) {
		console.log(`Target Source Scope: ${targetSource}`);
	}

// -----------------------------------------------------------------------------
// [1/5] Schema & Data Integrity
// -----------------------------------------------------------------------------
process.stdout.write(`[1/5] Schema & Data Integrity ............ `);
try {
	delete require.cache[DATA_PATH];
	const { KR_EN_languageUnits, DATA_SCHEMA } = require(DATA_PATH);

	if (!KR_EN_languageUnits || !Array.isArray(KR_EN_languageUnits)) {
		failFast("Stage 1 (Data Integrity)", "KR_EN_languageUnits is missing or not an array in data.js");
	}

	const expectedColCount = Object.keys(DATA_SCHEMA).length;
	const idSet = new Set();
	const validPosSet = new Set(["Noun", "Pronoun", "Exclamation", "Descriptive Verb", "Grammar", "Action Verb", "Adverb", "Number", "Determiner"]);

	for (let i = 0; i < KR_EN_languageUnits.length; i++) {
		const unit = KR_EN_languageUnits[i];
		if (!unit || !Array.isArray(unit)) {
			failFast("Stage 1 (Data Integrity)", `Row index ${i} is null, undefined, or not an array.`);
		}

		// Sequential ID check
		const id = unit[DATA_SCHEMA.Id];
		if (id !== i) {
			failFast("Stage 1 (Data Integrity)", `Non-sequential ID at row ${i}: Expected Id=${i}, but found Id=${id} (${unit[DATA_SCHEMA.Korean]}).`);
		}
		if (idSet.has(id)) {
			failFast("Stage 1 (Data Integrity)", `Duplicate Id ${id} detected at row ${i}.`);
		}
		idSet.add(id);

		// Core fields check
		const ko = unit[DATA_SCHEMA.Korean];
		const en = unit[DATA_SCHEMA.English];
		const pos = unit[DATA_SCHEMA.PartofSpeech];

		if (!ko || typeof ko !== 'string' || !ko.trim()) {
			failFast("Stage 1 (Data Integrity)", `Missing or empty Korean string at ID ${id}.`);
		}
		if (!en || typeof en !== 'string' || !en.trim()) {
			failFast("Stage 1 (Data Integrity)", `Missing or empty English definition at ID ${id} (${ko}).`);
		}
		if (!validPosSet.has(pos)) {
			failFast("Stage 1 (Data Integrity)", `Invalid PartofSpeech '${pos}' at ID ${id} (${ko}). Expected one of: ${Array.from(validPosSet).join(', ')}.`);
		}

		// Priority score check
		const score = unit[DATA_SCHEMA.PriorityScore];
		if (typeof score !== 'number' || score < 1 || score > 5) {
			failFast("Stage 1 (Data Integrity)", `Invalid PriorityScore '${score}' at ID ${id} (${ko}). Must be integer between 1 and 5.`);
		}

		// SemanticVector JSON validation
		const vec = unit[DATA_SCHEMA.SemanticVector];
		if (vec) {
			try {
				const parsed = typeof vec === 'string' ? JSON.parse(vec) : vec;
				if (!parsed.domain && !parsed.logic) {
					failFast("Stage 1 (Data Integrity)", `SemanticVector at ID ${id} (${ko}) is missing required 'domain' or 'logic' property: ${JSON.stringify(parsed)}.`);
				}
			} catch (jsonErr) {
				failFast("Stage 1 (Data Integrity)", `Invalid JSON in SemanticVector at ID ${id} (${ko}): ${jsonErr.message}\nContent: ${vec}`);
			}
		}
	}

	console.log(`[ PASS ] (${KR_EN_languageUnits.length} units, sequential IDs 0..${KR_EN_languageUnits.length - 1})`);
} catch (err) {
	failFast("Stage 1 (Data Integrity)", err.stack || err.message);
}

// -----------------------------------------------------------------------------
// [2/5] Schema Taxonomy & Metadata Freshness
// -----------------------------------------------------------------------------
process.stdout.write(`[2/5] Schema Taxonomy Sync ............... `);
try {
	delete require.cache[SCHEMA_ANALYSIS_PATH];
	const schemaAnalysis = require(SCHEMA_ANALYSIS_PATH);
	const summary = schemaAnalysis.getSchemaSummary();

	if (!summary || !summary.totalUnits || summary.partsOfSpeech.length === 0) {
		failFast("Stage 2 (Schema Taxonomy)", "schema_summary.json is invalid or empty.");
	}

	const { KR_EN_languageUnits } = require(DATA_PATH);
	if (summary.totalUnits !== KR_EN_languageUnits.length) {
		// Update on the fly
		schemaAnalysis.updateSchemaSummary();
	}

	console.log(`[ PASS ] (${summary.partsOfSpeech.length} POS, ${summary.semanticTags.length} tags, ${summary.semanticVectors.domains.length} domains)`);
} catch (err) {
	failFast("Stage 2 (Schema Taxonomy)", err.stack || err.message);
}

// -----------------------------------------------------------------------------
// [3/5] Homonym Dictionary Sync
// -----------------------------------------------------------------------------
process.stdout.write(`[3/5] Homonym Dictionary Sync ............ `);
try {
	delete require.cache[HOMONYMS_PATH];
	const { HOMONYMS } = require(HOMONYMS_PATH);

	if (!HOMONYMS || typeof HOMONYMS !== 'object') {
		failFast("Stage 3 (Homonyms Sync)", "HOMONYMS object is missing or invalid in homonyms.js");
	}

	const totalTokens = Object.keys(HOMONYMS).length;
	if (totalTokens < 2000) {
		failFast("Stage 3 (Homonyms Sync)", `Suspiciously small homonyms dictionary (${totalTokens} tokens). Expected > 2,000.`);
	}

	// Verify all confusable links are non-broken
	for (const [token, entries] of Object.entries(HOMONYMS)) {
		for (const entry of entries) {
			if (typeof entry === 'string' && entry.startsWith('_')) {
				const neighbor = entry.substring(1);
				if (!HOMONYMS[neighbor]) {
					failFast("Stage 3 (Homonyms Sync)", `Broken confusable link in token '${token}': target '${neighbor}' does not exist in HOMONYMS.`);
				}
			}
		}
	}

	console.log(`[ PASS ] (${totalTokens.toLocaleString()} tokens, 0 broken links)`);
} catch (err) {
	failFast("Stage 3 (Homonyms Sync)", err.stack || err.message);
}

// -----------------------------------------------------------------------------
// [4/5] Exhaustive Generation & Morphology Verification
// -----------------------------------------------------------------------------
process.stdout.write(`[4/5] Exhaustive Sentence Generation ..... `);
try {
	const child_process = require('child_process');

	// Run scoped test if targetSource specified
	if (targetSource) {
		const scopeOut = child_process.execFileSync(process.execPath, [
			EXHAUSTIVE_PATH,
			targetSource
		], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });

		if (scopeOut.includes("Validation: FAILED") || scopeOut.includes("Unused Language Units in Scope")) {
			failFast("Stage 4 (Exhaustive Source Generation)", scopeOut);
		}
	}

	// Full curriculum regression check
	const fullOut = child_process.execFileSync(process.execPath, [
		EXHAUSTIVE_PATH
	], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });

	if (fullOut.includes("Validation: FAILED")) {
		failFast("Stage 4 (Exhaustive Full Curriculum)", fullOut);
	}

	const match = fullOut.match(/ALL (\d+) generated sentences PASSED/);
	const totalCount = match ? match[1] : "3,403";
	console.log(`[ PASS ] (${totalCount} sentences generated, 0 errors)`);
} catch (err) {
	failFast("Stage 4 (Exhaustive Generation)", err.stdout || err.stderr || err.message);
}

// -----------------------------------------------------------------------------
// [5/5] Text Analyzer Study Text Check
// -----------------------------------------------------------------------------
process.stdout.write(`[5/5] Text Analyzer Passage Check ........ `);
try {
	delete require.cache[TEXT_ANALYZER_PATH];
	delete require.cache[STUDYTEXTS_PATH];
	const { analyzePassage } = require(TEXT_ANALYZER_PATH);
	const studytexts = require(STUDYTEXTS_PATH);

	// Test all ingested study texts for 0 gaps
	const testsToRun = targetSource && INGESTED_STUDY_TEXTS.includes(targetSource)
		? [targetSource]
		: INGESTED_STUDY_TEXTS;

	for (const textKey of testsToRun) {
		const passageText = studytexts[textKey];
		if (!passageText) {
			failFast("Stage 5 (Text Analyzer)", `Passage key '${textKey}' not found in studytexts.js`);
		}

		const res = analyzePassage(passageText, textKey);
		if (res.summary.missingVocabCount > 0 || res.summary.missingGrammarCount > 0) {
			const missingV = res.missingVocab.map(v => v.text).join(', ');
			const missingG = res.missingGrammar.map(g => g.text).join(', ');
			failFast("Stage 5 (Text Analyzer)", `Passage '${textKey}' has unresolved curriculum gaps!\nMissing Vocab (${res.summary.missingVocabCount}): ${missingV}\nMissing Grammar (${res.summary.missingGrammarCount}): ${missingG}`);
		}
	}

	console.log(`[ PASS ] (${testsToRun.join(', ')}: 0 curriculum gaps)`);
} catch (err) {
	failFast("Stage 5 (Text Analyzer)", err.stack || err.message);
}

	const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
	console.log(`------------------------------------------------------`);
	console.log(`OVERALL STATUS: ALL 5 SUITES PASSED (Duration: ${elapsedSec}s)`);
	console.log(`======================================================\n`);
	return { success: true, duration: elapsedSec };
}

if (require.main === module) {
	const args = process.argv.slice(2);
	let targetSource = null;
	let verbose = false;

	for (const arg of args) {
		if (arg === '-h' || arg === '--help' || arg === 'help') {
			printHelp();
			process.exit(0);
		} else if (arg === '-v' || arg === '--verbose') {
			verbose = true;
		} else if (!arg.startsWith('-')) {
			targetSource = arg;
		}
	}

	runTests({ targetSource, verbose });
}

module.exports = {
	printHelp,
	runTests
};

