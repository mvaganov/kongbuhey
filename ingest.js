#!/usr/bin/env node
/**
 * ingest.js - Unified Curriculum Ingestion Pipeline for Kongbuhey
 *
 * Automates the complete study text ingestion workflow:
 *   1. Decomposes passage text using text_analyzer.js.
 *   2. Deduplicates against existing data.js units & identifies morphology hints.
 *   3. Scaffolds ONLY truly unrepresented language units into scratch JSON.
 *   4. Inserts new units into data.js using select.js.
 *   5. Synchronizes homonyms.js and schema_summary.json.
 *   6. Registers passage in test.js INGESTED_STUDY_TEXTS.
 *   7. Executes test.js validation suite to guarantee 0 curriculum gaps.
 *
 * Usage:
 *   node ingest.js studytext72           # Ingest specific passage
 *   node ingest.js                       # Auto-detect next uningested study text
 *   node ingest.js studytext72 --dry-run # Preview gaps and morphology hints without modifying data
 *   node ingest.js studytext72 --auto    # Non-interactive / CI mode
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const child_process = require('child_process');

const DATA_PATH = path.resolve(__dirname, 'data.js');
const TEST_PATH = path.resolve(__dirname, 'test.js');
const STUDYTEXTS_PATH = path.resolve(__dirname, 'studytexts.js');
const HOMONYMS_PATH = path.resolve(__dirname, 'homonyms.js');
const SCHEMA_ANALYSIS_PATH = path.resolve(__dirname, 'schema_analysis.js');
const TEXT_ANALYZER_PATH = path.resolve(__dirname, 'text_analyzer.js');

const studytexts = require(STUDYTEXTS_PATH);
const { findExistingUnit, deduceExistingVerbStem, generateVerbSuffixSnippet, getSchemaSummary, updateSchemaSummary } = require(SCHEMA_ANALYSIS_PATH);
const textAnalyzer = require(TEXT_ANALYZER_PATH);

function getIngestedPassages() {
	const testContent = fs.readFileSync(TEST_PATH, 'utf8');
	const m = testContent.match(/const INGESTED_STUDY_TEXTS = \[([^\]]+)\];/);
	if (!m) return [];
	return m[1].replace(/["'\s\n]/g, '').split(',').filter(Boolean);
}

function findNextUningestedPassage() {
	const ingested = new Set(getIngestedPassages());
	const allPassages = Object.keys(studytexts).filter(k => k.startsWith('studytext'));
	for (const p of allPassages) {
		if (!ingested.has(p)) return p;
	}
	return null;
}

function registerPassageInTest(passageName) {
	const testContent = fs.readFileSync(TEST_PATH, 'utf8');
	const m = testContent.match(/const INGESTED_STUDY_TEXTS = \[([^\]]+)\];/);
	if (!m) return false;

	const currentList = m[1].replace(/["'\s\n]/g, '').split(',').filter(Boolean);
	if (currentList.includes(passageName)) return true;

	currentList.push(passageName);
	const replacement = `const INGESTED_STUDY_TEXTS = [${currentList.map(s => `"${s}"`).join(', ')}];`;
	const updatedContent = testContent.replace(/const INGESTED_STUDY_TEXTS = \[([^\]]+)\];/, replacement);
	fs.writeFileSync(TEST_PATH, updatedContent, 'utf8');
	console.log(`[INGEST] Registered "${passageName}" in test.js INGESTED_STUDY_TEXTS.`);
	return true;
}

async function promptUser(question) {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	return new Promise(resolve => {
		rl.question(question, answer => {
			rl.close();
			resolve(answer.trim().toLowerCase());
		});
	});
}

async function main() {
	const args = process.argv.slice(2);
	const isDryRun = args.includes('--dry-run');
	const isAuto = args.includes('--auto') || args.includes('-y') || args.includes('--yes');
	const targetArg = args.find(a => !a.startsWith('-'));

	let passageName = targetArg || findNextUningestedPassage();
	if (!passageName) {
		console.log("[INGEST] All known study texts in studytexts.js are already ingested!");
		process.exit(0);
	}

	const passageText = studytexts[passageName];
	if (!passageText) {
		console.error(`[ERROR] Passage "${passageName}" not found in studytexts.js.`);
		process.exit(1);
	}

	console.log(`======================================================`);
	console.log(`       KONGBUHEY STUDY TEXT INGESTION PIPELINE        `);
	console.log(`======================================================`);
	console.log(`Target Passage: ${passageName}`);
	console.log(`Length:         ${passageText.length} characters`);
	if (isDryRun) console.log(`Mode:           DRY RUN (no files will be modified)`);
	console.log(`------------------------------------------------------\n`);

	// Step 1: Run text analyzer
	console.log(`[1/5] Running passage decomposition...`);
	const report = textAnalyzer.analyzePassage(passageText, passageName);

	// Step 2: Filter gaps
	const rawMissing = [...report.missingVocab, ...report.missingGrammar];
	const morphologyHints = [];
	const trueMissing = [];

	for (const m of rawMissing) {
		const word = m.text.trim();
		const existing = findExistingUnit(word);
		if (existing) {
			continue;
		}
		const morph = deduceExistingVerbStem(word);
		if (morph) {
			morphologyHints.push(morph);
			continue;
		}
		trueMissing.push(m);
	}

	// Step 3: Report morphology hints if any
	if (morphologyHints.length > 0) {
		console.log(`\n------------------------------------------------------`);
		console.log(`[MORPHOLOGY HINTS] Found ${morphologyHints.length} inflected forms of existing verbs:`);
		for (const h of morphologyHints) {
			console.log(`  * "${h.surface}" -> matches ${h.verbUnit[1]} (ID ${h.verbUnit[0]}) via ${h.suffix}`);
			const snippet = generateVerbSuffixSnippet(h);
			if (snippet) {
				console.log(`    Suggested VERB_SUFFIX_RULES entry for verb_morphology.js:\n    ${snippet}\n`);
			}
		}
		console.log(`Tip: If any of these should decompose cleanly, update korean/analyzer/verb_morphology.js or sentence_analyzer.js.`);
		console.log(`------------------------------------------------------\n`);
	}

	// Step 4: Handle truly missing vocabulary
	if (trueMissing.length === 0) {
		if (morphologyHints.length > 0) {
			console.log(`[INFO] No new dictionary vocabulary units are needed.`);
			console.log(`The remaining unparsed tokens are inflections of existing verbs.`);
			if (isDryRun) process.exit(0);
		} else {
			console.log(`[SUCCESS] 0 curriculum gaps! All words are fully recognized.`);
			registerPassageInTest(passageName);
			console.log(`[2/5] Running verification test suite...`);
			child_process.execFileSync(process.execPath, [TEST_PATH, passageName], { stdio: 'inherit' });
			console.log(`\n======================================================`);
			console.log(`[COMPLETE] Passage "${passageName}" is 100% verified!`);
			console.log(`======================================================\n`);
			process.exit(0);
		}
	} else {
		console.log(`\n[2/5] Truly Unrepresented Language Units (${trueMissing.length}):`);
		console.log(`------------------------------------------------------`);
		const draftPath = path.resolve(__dirname, 'scratch', `new_units_${passageName}.json`);
		const draftUnits = [];

		for (const tm of trueMissing) {
			const u = {
				Korean: tm.text,
				English: tm.gloss || `<English definition of "${tm.text}">`,
				PartofSpeech: tm.pos || "Noun",
				SemanticTags: ["general"],
				Disambiguation: "",
				Conjugation: tm.text.endsWith("하다") ? "hada" : "",
				Source: passageName,
				PriorityScore: 1,
				FormalityLevel: "Universal",
				HonorificRules: "",
				SemanticVector: JSON.stringify({ domain: "concept", type: "general" }),
				SyntaxFrame: ""
			};
			draftUnits.push(u);
			console.log(`  - ${u.Korean.padEnd(16)} [${u.PartofSpeech.padEnd(16)}] ${u.English}`);
		}

		if (isDryRun) {
			console.log(`\n[DRY RUN COMPLETE] Found ${trueMissing.length} new units and ${morphologyHints.length} morphology hints.`);
			process.exit(0);
		}

		// Save draft JSON
		const scratchDir = path.resolve(__dirname, 'scratch');
		if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });
		fs.writeFileSync(draftPath, JSON.stringify(draftUnits, null, 2), 'utf8');
		console.log(`\nDraft units written to: scratch/new_units_${passageName}.json`);

		// Step 5: Confirm and insert
		if (!isAuto) {
			const ans = await promptUser(`\nProceed to insert ${draftUnits.length} units into data.js? [y/N]: `);
			if (ans !== 'y' && ans !== 'yes') {
				console.log("[ABORT] Ingestion cancelled by user. Draft JSON preserved in scratch/.");
				process.exit(0);
			}
		}

		console.log(`\n[3/5] Inserting units into data.js...`);
		child_process.execFileSync(process.execPath, [
			path.resolve(__dirname, 'select.js'),
			'INSERT',
			'FROMFILE',
			draftPath,
			'--source',
			passageName
		], { stdio: 'inherit' });

		console.log(`[4/5] Synchronizing homonyms.js and schema summary...`);
		child_process.execFileSync(process.execPath, [
			HOMONYMS_PATH,
			'update',
			'--source',
			passageName
		], { stdio: 'inherit' });

		updateSchemaSummary();

		registerPassageInTest(passageName);

		console.log(`[5/5] Running verification test suite...`);
		child_process.execFileSync(process.execPath, [TEST_PATH, passageName], { stdio: 'inherit' });

		console.log(`\n======================================================`);
		console.log(`[COMPLETE] ${passageName} successfully ingested!`);
		console.log(`======================================================\n`);
	}
}

if (require.main === module) {
	main().catch(err => {
		console.error("\n[FATAL ERROR]", err);
		process.exit(1);
	});
}

module.exports = {
	getIngestedPassages,
	findNextUningestedPassage,
	registerPassageInTest
};
