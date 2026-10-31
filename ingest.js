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
const {
	findExistingUnit,
	deduceExistingVerbStem,
	generateVerbSuffixSnippet,
	detectProperNameCandidate,
	scaffoldUnit,
	getSchemaSummary,
	updateSchemaSummary
} = require(SCHEMA_ANALYSIS_PATH);
const { recognizeCompoundParticle, decomposeCompoundParticle } = require('./korean/analyzer/particles.js');
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
		if (!ingested.has(p) && studytexts[p] && studytexts[p].trim().length > 0) return p;
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

function printHelp() {
	console.log(`ingest.js - Unified Curriculum Ingestion Pipeline for Kongbuhey

USAGE:
  node ingest.js [passageName] [options]
  node ingest.js --text "<korean text>" [--source <tag>] [options]
  node ingest.js --file <path> [--source <tag>] [options]
  node ingest.js --draft <path> [--source <tag>] [options]

OPTIONS:
  --text "<text>"     Analyze and ingest arbitrary Korean text directly
  --file <path>       Read Korean text or JSON draft units from file (.txt, .json)
  --draft <path>      Insert scaffolded JSON units exported from web app or scratch/
  --source <tag>      Curriculum source tag (default: custom_passage or filename)
  --dry-run           Preview curriculum gaps and morphology hints without modifying data
  --auto, -y, --yes   Non-interactive mode (automatically confirm insertions)
  -h, --help          Display this help message and exit
`);
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
	if (args.includes('-h') || args.includes('--help')) {
		printHelp();
		process.exit(0);
	}

	const isDryRun = args.includes('--dry-run');
	const isAuto = args.includes('--auto') || args.includes('-y') || args.includes('--yes');

	const getArgVal = (flag) => {
		const idx = args.indexOf(flag);
		return (idx !== -1 && idx + 1 < args.length) ? args[idx + 1] : null;
	};

	const textArg = getArgVal('--text');
	const fileArg = getArgVal('--file');
	const draftArg = getArgVal('--draft');
	const sourceArg = getArgVal('--source');

	let passageText = '';
	let passageName = '';
	let directDraftUnits = null;

	if (draftArg) {
		const draftPath = path.resolve(process.cwd(), draftArg);
		if (!fs.existsSync(draftPath)) {
			console.error(`[ERROR] Draft file not found: ${draftPath}`);
			process.exit(1);
		}
		directDraftUnits = JSON.parse(fs.readFileSync(draftPath, 'utf8'));
		passageName = sourceArg || path.basename(draftPath, path.extname(draftPath)).replace(/^new_units_/, '') || 'custom_source';
	} else if (fileArg) {
		const filePath = path.resolve(process.cwd(), fileArg);
		if (!fs.existsSync(filePath)) {
			console.error(`[ERROR] File not found: ${filePath}`);
			process.exit(1);
		}
		if (filePath.endsWith('.json')) {
			directDraftUnits = JSON.parse(fs.readFileSync(filePath, 'utf8'));
			passageName = sourceArg || path.basename(filePath, path.extname(filePath)).replace(/^new_units_/, '') || 'custom_source';
		} else {
			passageText = fs.readFileSync(filePath, 'utf8');
			passageName = sourceArg || path.basename(filePath, path.extname(filePath));
		}
	} else if (textArg) {
		passageText = textArg;
		passageName = sourceArg || 'custom_passage';
	} else {
		// Existing studytexts.js flow
		const targetArg = args.find(a => !a.startsWith('-'));
		passageName = targetArg || findNextUningestedPassage();
		if (!passageName) {
			console.log("[INGEST] All known study texts in studytexts.js are already ingested!");
			process.exit(0);
		}
		passageText = studytexts[passageName];
		if (!passageText) {
			console.error(`[ERROR] Passage "${passageName}" not found in studytexts.js.`);
			process.exit(1);
		}
	}

	console.log(`======================================================`);
	console.log(`       KONGBUHEY STUDY TEXT INGESTION PIPELINE        `);
	console.log(`======================================================`);
	console.log(`Target Source / Passage: ${passageName}`);
	if (passageText) console.log(`Text Length:             ${passageText.length} characters`);
	if (directDraftUnits) console.log(`Direct Draft Units:      ${directDraftUnits.length} units`);
	if (isDryRun) console.log(`Mode:                    DRY RUN (no files will be modified)`);
	console.log(`------------------------------------------------------\n`);

	// --- PATH A: Direct Draft Units Ingestion ---
	if (directDraftUnits) {
		console.log(`[1/4] Loaded ${directDraftUnits.length} scaffolded units for source "${passageName}":`);
		for (const u of directDraftUnits) {
			const ko = u.Korean || '';
			const en = u.English || '';
			const pos = u.PartofSpeech || 'Noun';
			console.log(`  - ${ko.padEnd(16)} [${pos.padEnd(16)}] ${en}`);
		}

		if (isDryRun) {
			console.log(`\n[DRY RUN COMPLETE] Verified ${directDraftUnits.length} draft units.`);
			process.exit(0);
		}

		if (!isAuto) {
			const ans = await promptUser(`\nProceed to insert ${directDraftUnits.length} units into data.js? [y/N]: `);
			if (ans !== 'y' && ans !== 'yes') {
				console.log("[ABORT] Ingestion cancelled by user.");
				process.exit(0);
			}
		}

		const scratchDir = path.resolve(__dirname, 'scratch');
		if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });
		const draftPath = path.resolve(scratchDir, `new_units_${passageName}.json`);
		fs.writeFileSync(draftPath, JSON.stringify(directDraftUnits, null, 2), 'utf8');

		console.log(`\n[2/4] Inserting units into data.js...`);
		child_process.execFileSync(process.execPath, [
			path.resolve(__dirname, 'select.js'),
			'INSERT',
			'FROMFILE',
			draftPath,
			'--source',
			passageName
		], { stdio: 'inherit' });

		console.log(`[3/4] Synchronizing homonyms.js and schema summary...`);
		child_process.execFileSync(process.execPath, [
			HOMONYMS_PATH,
			'update',
			'--source',
			passageName
		], { stdio: 'inherit' });

		updateSchemaSummary();

		if (studytexts[passageName]) {
			registerPassageInTest(passageName);
		}

		console.log(`[4/4] Running verification test suite...`);
		child_process.execFileSync(process.execPath, [TEST_PATH, passageName], { stdio: 'inherit' });

		console.log(`\n======================================================`);
		console.log(`[COMPLETE] ${passageName} successfully ingested!`);
		console.log(`======================================================\n`);
		process.exit(0);
	}

	// --- PATH B: Text Decomposition Pipeline ---
	// Step 1: Run text analyzer
	console.log(`[1/5] Running passage decomposition...`);
	const report = textAnalyzer.analyzePassage(passageText, passageName);
	const index = textAnalyzer.getIndex();

	// Step 2: Filter gaps
	const rawMissing = [...report.missingVocab, ...report.missingGrammar];
	const morphologyHints = [];
	const compoundParticleHints = [];
	const properNameHints = [];
	const trueMissing = [];

	for (const m of rawMissing) {
		let word = m.text.trim();
		const existing = findExistingUnit(word);
		if (existing) {
			continue;
		}

		// Check verb morphology hints
		const morph = deduceExistingVerbStem(word);
		if (morph) {
			morphologyHints.push(morph);
			continue;
		}

		// Check compound particle recognition
		const comp = recognizeCompoundParticle(word, index.vocabByKo, { allowUnknownStem: true });
		if (comp) {
			compoundParticleHints.push(comp);
			if (comp.hasExistingStem) {
				// Stem already exists in dictionary, so this is purely a compound particle gap
				continue;
			}
			// Stem is unrepresented in dictionary, so isolate the stem for vocabulary scaffolding
			word = comp.stem;
			m.text = comp.stem;
		}

		// Check proper name & diminutive heuristic
		const nameHint = detectProperNameCandidate(word, passageText, index.vocabByKo);
		if (nameHint) {
			properNameHints.push(nameHint);
			m.isName = true;
			m.baseName = nameHint.baseName;
			m.nameReason = nameHint.reason;
			m.text = nameHint.baseName;
		}

		// Deduplicate in trueMissing
		if (!trueMissing.some(item => item.text === m.text)) {
			trueMissing.push(m);
		}
	}

	// Step 3: Report morphology, compound particle, and proper name hints if any
	if (morphologyHints.length > 0) {
		console.log(`\n------------------------------------------------------`);
		console.log(`[MORPHOLOGY HINTS] Found ${morphologyHints.length} inflected forms of existing verbs:`);
		for (const h of morphologyHints) {
			console.log(`  * "${h.surface}" -> matches ${h.verbUnit[1]} (ID ${h.verbUnit[0]}) via ${h.suffix}`);
			const snippet = generateVerbSuffixSnippet(h);
			if (snippet) {
				console.log(`    Suggested VERB_SUFFIX_RULES entry for verb_suffix_rules.js:\n    ${snippet}\n`);
			}
		}
		console.log(`Tip: If any of these should decompose cleanly, update korean/analyzer/verb_suffix_rules.js or sentence_analyzer.js.`);
		console.log(`------------------------------------------------------\n`);
	}

	if (compoundParticleHints.length > 0) {
		console.log(`\n------------------------------------------------------`);
		console.log(`[COMPOUND PARTICLE HINTS] Found ${compoundParticleHints.length} compound particle formations:`);
		for (const cp of compoundParticleHints) {
			console.log(`  * "${cp.word}" -> stem "${cp.stem}" + particle "${cp.compoundText}" (${cp.desc})`);
			if (!cp.isExistingSpec) {
				console.log(`    Suggested PARTICLE_SPECS entry for korean/analyzer/particles.js:\n    ${cp.suggestedSpec}\n`);
			}
		}
		console.log(`Tip: Add new compound particles to korean/analyzer/particles.js.`);
		console.log(`------------------------------------------------------\n`);
	}

	if (properNameHints.length > 0) {
		console.log(`\n------------------------------------------------------`);
		console.log(`[PROPER NAME HINTS] Found ${properNameHints.length} proper name candidates:`);
		for (const pn of properNameHints) {
			console.log(`  * "${pn.baseName}" (from "${pn.surface}") -> ${pn.reason}`);
		}
		console.log(`------------------------------------------------------\n`);
	}

	// Step 4: Handle truly missing vocabulary
	if (trueMissing.length === 0) {
		if (morphologyHints.length > 0 || compoundParticleHints.length > 0) {
			console.log(`[INFO] No new dictionary vocabulary units are needed.`);
			console.log(`The remaining unparsed tokens are inflections of existing verbs or compound particles.`);
			if (isDryRun) process.exit(0);
		} else {
			console.log(`[SUCCESS] 0 curriculum gaps! All words are fully recognized.`);
			if (isDryRun) {
				console.log(`\n[DRY RUN COMPLETE] 0 gaps detected in passage "${passageName}".`);
				process.exit(0);
			}
			if (studytexts[passageName]) {
				registerPassageInTest(passageName);
			}
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
			const scaffolded = scaffoldUnit(tm.baseName || tm.text, passageName, {
				...tm,
				passageText,
				isName: tm.isName,
				baseName: tm.baseName
			});
			const u = scaffolded || {
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
			console.log(`  - ${u.Korean.padEnd(16)} [${u.PartofSpeech.padEnd(16)}] ${u.English} (Tags: ${u.SemanticTags.join(', ')})`);
		}

		if (isDryRun) {
			console.log(`\n[DRY RUN COMPLETE] Found ${trueMissing.length} new units, ${morphologyHints.length} morphology hints, and ${compoundParticleHints.length} compound particle hints.`);
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

		if (studytexts[passageName]) {
			registerPassageInTest(passageName);
		}

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
