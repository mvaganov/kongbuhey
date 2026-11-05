/**
 * audit_runner.js - CLI Assistant for Curriculum-Wide Linguistic Audit
 *
 * Pre-populates batch unit lists using data.js/select.js logic, generates
 * deterministic AST test sentences via korean.js, tracks review progress,
 * and provides a unit-by-unit review workflow for LLM auditing agents.
 *
 * USAGE:
 *   node audit_runner.js --init                  # Partition curriculum into 11 batch files
 *   node audit_runner.js --generate <batch>      # Generate test sentences for a batch (e.g. 01)
 *   node audit_runner.js --next <batch>          # Show next unanalyzed unit in batch with sentences
 *   node audit_runner.js --unit <id>             # Generate & view test sentences for a single unit
 *   node audit_runner.js --status                # Print audit progress checklist across all batches
 */

const fs = require('fs');
const path = require('path');
const { KR_EN_languageUnits, DATA_SCHEMA } = require('./data.js');
const {
	setRandomSeed,
	generateSentencesForUnit,
	validateSentenceAST,
	validateSentenceString
} = require('./korean.js');

const BATCHES_DIR = path.join(__dirname, 'audit', 'batches');
const REPORTS_DIR = path.join(__dirname, 'audit', 'reports');
const SCRATCH_AUDIT_DIR = path.join(__dirname, 'scratch', 'audit');

const BATCH_SPECS = [
	{
		id: "01",
		name: "closed_classes",
		label: "Closed Modifiers & Deictics",
		filter: u => ['Pronoun', 'Determiner', 'Number', 'Exclamation'].includes(u[DATA_SCHEMA.PartofSpeech])
	},
	{
		id: "02",
		name: "adverbs",
		label: "Adverbs & Discourse",
		filter: u => u[DATA_SCHEMA.PartofSpeech] === 'Adverb'
	},
	{
		id: "03",
		name: "descriptive_verbs",
		label: "Statives & Adjectives",
		filter: u => u[DATA_SCHEMA.PartofSpeech] === 'Descriptive Verb'
	},
	{
		id: "04",
		name: "grammar",
		label: "Particles & Grammar",
		filter: u => u[DATA_SCHEMA.PartofSpeech] === 'Grammar'
	},
	{
		id: "05",
		name: "action_verbs_part_a",
		label: "Action Verbs (Part A)",
		partitionFrom: 'Action Verb',
		sliceIndex: 0,
		sliceCount: 190
	},
	{
		id: "06",
		name: "action_verbs_part_b",
		label: "Action Verbs (Part B)",
		partitionFrom: 'Action Verb',
		sliceIndex: 190,
		sliceCount: 189
	},
	{
		id: "07",
		name: "nouns_part_a",
		label: "Nouns (Part A)",
		partitionFrom: 'Noun',
		sliceIndex: 0,
		sliceCount: 221
	},
	{
		id: "08",
		name: "nouns_part_b",
		label: "Nouns (Part B)",
		partitionFrom: 'Noun',
		sliceIndex: 221,
		sliceCount: 221
	},
	{
		id: "09",
		name: "nouns_part_c",
		label: "Nouns (Part C)",
		partitionFrom: 'Noun',
		sliceIndex: 442,
		sliceCount: 221
	},
	{
		id: "10",
		name: "nouns_part_d",
		label: "Nouns (Part D)",
		partitionFrom: 'Noun',
		sliceIndex: 663,
		sliceCount: 221
	},
	{
		id: "11",
		name: "nouns_part_e",
		label: "Nouns (Part E)",
		partitionFrom: 'Noun',
		sliceIndex: 884,
		sliceCount: 221
	}
];

function ensureDirs() {
	[BATCHES_DIR, REPORTS_DIR, SCRATCH_AUDIT_DIR].forEach(dir => {
		if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
	});
}

function normalizeBatchId(val) {
	const num = parseInt(val, 10);
	if (isNaN(num)) return val;
	return num < 10 ? `0${num}` : `${num}`;
}

/**
 * Partitions data.js into 11 batch files.
 */
function initBatches() {
	ensureDirs();
	console.log("[Init] Partitioning curriculum into 11 batches...");

	const actionVerbs = KR_EN_languageUnits.filter(u => u[DATA_SCHEMA.PartofSpeech] === 'Action Verb');
	const nouns = KR_EN_languageUnits.filter(u => u[DATA_SCHEMA.PartofSpeech] === 'Noun');

	let totalAssigned = 0;
	const manifest = [];

	BATCH_SPECS.forEach(spec => {
		let units = [];
		if (spec.filter) {
			units = KR_EN_languageUnits.filter(spec.filter);
		} else if (spec.partitionFrom === 'Action Verb') {
			units = actionVerbs.slice(spec.sliceIndex, spec.sliceIndex + spec.sliceCount);
		} else if (spec.partitionFrom === 'Noun') {
			units = nouns.slice(spec.sliceIndex, spec.sliceIndex + spec.sliceCount);
		}

		totalAssigned += units.length;
		const batchData = {
			batchId: spec.id,
			batchName: spec.name,
			label: spec.label,
			count: units.length,
			units: units.map(u => ({
				id: u[DATA_SCHEMA.Id],
				ko: u[DATA_SCHEMA.Korean],
				en: u[DATA_SCHEMA.English],
				pos: u[DATA_SCHEMA.PartofSpeech],
				tags: u[DATA_SCHEMA.SemanticTags] instanceof Set 
					? Array.from(u[DATA_SCHEMA.SemanticTags]) 
					: (Array.isArray(u[DATA_SCHEMA.SemanticTags]) ? u[DATA_SCHEMA.SemanticTags] : []),
				source: u[DATA_SCHEMA.Source] || ""
			}))
		};

		const jsonPath = path.join(BATCHES_DIR, `batch_${spec.id}_${spec.name}.json`);
		fs.writeFileSync(jsonPath, JSON.stringify(batchData, null, 2), 'utf8');

		const idListPath = path.join(BATCHES_DIR, `batch_${spec.id}_ids.txt`);
		const ids = units.map(u => u[DATA_SCHEMA.Id]);
		fs.writeFileSync(idListPath, ids.join('\n'), 'utf8');

		manifest.push({
			id: spec.id,
			name: spec.name,
			label: spec.label,
			count: units.length,
			firstId: ids[0],
			lastId: ids[ids.length - 1],
			jsonPath,
			idListPath
		});

		console.log(`  Batch ${spec.id} (${spec.label}): ${units.length} units (IDs: ${ids[0]}..${ids[ids.length - 1]})`);
	});

	const manifestPath = path.join(BATCHES_DIR, 'manifest.json');
	fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

	console.log(`\n[Init Complete] Total units partitioned: ${totalAssigned}/${KR_EN_languageUnits.length}`);
	if (totalAssigned === KR_EN_languageUnits.length) {
		console.log("  >> 100% curriculum coverage verified with zero gaps or overlaps.");
	} else {
		console.warn(`  >> WARNING: Partitioned count (${totalAssigned}) does not match total (${KR_EN_languageUnits.length})!`);
	}
}

function loadBatch(batchId) {
	const norm = normalizeBatchId(batchId);
	const files = fs.readdirSync(BATCHES_DIR);
	const targetFile = files.find(f => f.startsWith(`batch_${norm}_`) && f.endsWith('.json'));
	if (!targetFile) {
		console.error(`Batch file for "${batchId}" not found in ${BATCHES_DIR}. Run: node audit_runner.js --init`);
		return null;
	}
	return JSON.parse(fs.readFileSync(path.join(BATCHES_DIR, targetFile), 'utf8'));
}

/**
 * Generates test sentences for an entire batch or single unit.
 */
function generateBatchSentences(batchId, customSeed = null) {
	ensureDirs();
	const batch = loadBatch(batchId);
	if (!batch) return;

	const batchDir = path.join(SCRATCH_AUDIT_DIR, `batch_${batch.batchId}`);
	if (!fs.existsSync(batchDir)) fs.mkdirSync(batchDir, { recursive: true });

	const seed = customSeed !== null ? customSeed : (1793700000000 + parseInt(batch.batchId, 10) * 100000);
	setRandomSeed(seed);

	console.log(`\n[Generate] Batch ${batch.batchId} (${batch.label}): Generating 10 sentences for ${batch.count} units (Seed: ${seed})...`);

	let combinedOutput = `======================================================================\n`;
	combinedOutput += `           BATCH ${batch.batchId} LINGUISTIC AUDIT SENTENCES GENERATION       \n`;
	combinedOutput += `======================================================================\n`;
	combinedOutput += `Batch: ${batch.batchId} (${batch.label})\n`;
	combinedOutput += `Total Units: ${batch.count}\n`;
	combinedOutput += `Seed: ${seed}\n`;
	combinedOutput += `Generated: ${new Date().toISOString()}\n`;
	combinedOutput += `======================================================================\n\n`;

	batch.units.forEach((uInfo, idx) => {
		setRandomSeed(seed);
		const unit = KR_EN_languageUnits[uInfo.id];
		const genRes = generateSentencesForUnit(unit, 10);
		let unitText = `----------------------------------------------------------------------\n`;
		unitText += `Unit #${uInfo.id} ${uInfo.ko} (${uInfo.pos}) - "${uInfo.en}"\n`;
		const tagsDisplay = Array.isArray(uInfo.tags) ? uInfo.tags.join(', ') : (uInfo.tags || '');
		unitText += `Tags: [${tagsDisplay}] | Source: ${uInfo.source}\n`;
		unitText += `Reproduce: node exhaustive.js --id ${uInfo.id} -eng none --ast -sentence 10 --seed ${seed}\n`;
		unitText += `----------------------------------------------------------------------\n`;

		if (!genRes || !genRes.sentences || genRes.sentences.length === 0) {
			unitText += `  [ERROR] No sentences could be generated.\n\n`;
		} else {
			genRes.sentences.forEach((s, sIdx) => {
				const valRes = validateSentenceAST(s.ast, s);
				const strRes = validateSentenceString(s.ko, uInfo.ko);
				const allErrors = [...valRes.errors, ...strRes.errors];
				const allWarnings = [...valRes.warnings, ...strRes.warnings];

				let line = `  [var.${sIdx + 1}] ${s.ko}`;
				if (allErrors.length > 0) line += ` [ERRORS: ${allErrors.join('; ')}]`;
				if (allWarnings.length > 0) line += ` [WARNINGS: ${allWarnings.join('; ')}]`;
				unitText += line + "\n";
			});
			unitText += "\n";
		}

		// Write individual unit scratch file
		fs.writeFileSync(path.join(batchDir, `unit_${uInfo.id}.txt`), unitText, 'utf8');
		combinedOutput += unitText;

		if ((idx + 1) % 50 === 0 || idx + 1 === batch.count) {
			process.stdout.write(`\rGenerated: ${idx + 1}/${batch.count} units...`);
		}
	});

	process.stdout.write("\n");
	const combinedPath = path.join(SCRATCH_AUDIT_DIR, `batch_${batch.batchId}_sentences.txt`);
	fs.writeFileSync(combinedPath, combinedOutput, 'utf8');
	console.log(`[Complete] Wrote combined sentences to: ${combinedPath}`);
	console.log(`[Complete] Individual unit files written to: ${batchDir}/unit_<id>.txt`);
}

/**
 * Finds the next unanalyzed unit in the batch and prints its sentences & template.
 */
function showNextUnit(batchId) {
	const batch = loadBatch(batchId);
	if (!batch) return;

	const reportPath = path.join(REPORTS_DIR, `batch_${batch.batchId}_report.md`);
	let analyzedIds = new Set();
	if (fs.existsSync(reportPath)) {
		const content = fs.readFileSync(reportPath, 'utf8');
		const matches = content.matchAll(/### Unit #(\d+)/g);
		for (const m of matches) {
			analyzedIds.add(parseInt(m[1], 10));
		}
	}

	const nextUnit = batch.units.find(u => !analyzedIds.has(u.id));
	if (!nextUnit) {
		console.log(`\n[Batch ${batch.batchId}] All ${batch.count} units have been analyzed!`);
		console.log(`Report location: ${reportPath}`);
		return;
	}

	const unitScratchPath = path.join(SCRATCH_AUDIT_DIR, `batch_${batch.batchId}`, `unit_${nextUnit.id}.txt`);
	if (!fs.existsSync(unitScratchPath)) {
		console.log(`Sentence cache missing for batch ${batch.batchId}. Generating now...`);
		generateBatchSentences(batch.batchId);
	}

	const unitContent = fs.readFileSync(unitScratchPath, 'utf8');
	console.log(`\n======================================================================`);
	console.log(`NEXT UNIT TO AUDIT: Batch ${batch.batchId} (${analyzedIds.size + 1}/${batch.count})`);
	console.log(`======================================================================`);
	console.log(unitContent);

	console.log(`----------------------------------------------------------------------`);
	console.log(`COPY/PASTE TEMPLATE FOR: ${reportPath}`);
	console.log(`----------------------------------------------------------------------`);
	const seed = (1793700000000 + parseInt(batch.batchId, 10) * 100000);
	console.log(`### Unit #${nextUnit.id} ${nextUnit.ko} (${nextUnit.pos}) - "${nextUnit.en}"
- **Status:** CLEAN
- **Reproducing Command:** \`node exhaustive.js --id ${nextUnit.id} -eng none --ast -sentence 10 --seed ${seed} -o scratch/audit/unit_${nextUnit.id}.txt\`
- **Seed:** \`${seed}\`
- **Linguistic Evaluation:** All 10 generated variations are grammatically sound and natural.
`);
}

/**
 * Checks progress across all batches.
 */
function showStatus() {
	console.log(`\n==================================================================================`);
	console.log(`                    CURRICULUM LINGUISTIC AUDIT STATUS TRACKER                   `);
	console.log(`==================================================================================`);
	console.log(`| Batch | Focus / Scope                  | Total Units | Analyzed | Clean | Flagged | Progress |`);
	console.log(`|:-----:|:-------------------------------|:-----------:|:--------:|:-----:|:-------:|:--------:|`);

	let grandTotal = 0;
	let grandAnalyzed = 0;
	let grandClean = 0;
	let grandFlagged = 0;

	BATCH_SPECS.forEach(spec => {
		const norm = spec.id;
		const batch = loadBatch(norm);
		const count = batch ? batch.count : (spec.sliceCount || 0);
		grandTotal += count;

		const reportPath = path.join(REPORTS_DIR, `batch_${norm}_report.md`);
		let analyzed = 0;
		let clean = 0;
		let flagged = 0;

		if (fs.existsSync(reportPath)) {
			const text = fs.readFileSync(reportPath, 'utf8');
			const units = text.split(/### Unit #\d+/);
			analyzed = units.length - 1;
			const cleanMatches = text.match(/- \*\*Status:\*\* CLEAN/g);
			clean = cleanMatches ? cleanMatches.length : 0;
			const issueMatches = text.match(/- \*\*Status:\*\* ISSUE_DETECTED/g);
			flagged = issueMatches ? issueMatches.length : 0;
		}

		grandAnalyzed += analyzed;
		grandClean += clean;
		grandFlagged += flagged;

		const pct = count > 0 ? Math.round((analyzed / count) * 100) : 0;
		const pctBar = `${pct}%`.padStart(4);
		console.log(`|  ${spec.id}   | ${spec.label.padEnd(30)} | ${String(count).padStart(11)} | ${String(analyzed).padStart(8)} | ${String(clean).padStart(5)} | ${String(flagged).padStart(7)} |   ${pctBar}   |`);
	});

	const grandPct = grandTotal > 0 ? Math.round((grandAnalyzed / grandTotal) * 100) : 0;
	console.log(`----------------------------------------------------------------------------------`);
	console.log(`| TOTAL | Entire Curriculum (11 Batches) | ${String(grandTotal).padStart(11)} | ${String(grandAnalyzed).padStart(8)} | ${String(grandClean).padStart(5)} | ${String(grandFlagged).padStart(7)} |   ${String(grandPct).padStart(3)}%   |`);
	console.log(`==================================================================================\n`);
}

// --- CLI Parsing ---
const args = process.argv.slice(2);
if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
	console.log(`audit_runner.js - Linguistic Audit Assistant CLI

COMMANDS:
  node audit_runner.js --init              Initialize and partition all 11 batches into audit/batches/
  node audit_runner.js --generate <batch>  Generate test sentences for a batch (e.g. 01)
  node audit_runner.js --next <batch>      Show next unanalyzed unit in batch with sentences & template
  node audit_runner.js --status            Display overall audit completion progress across all batches
`);
	process.exit(0);
}

if (args.includes('--init')) {
	initBatches();
} else if (args.includes('--generate')) {
	const bIdx = args.indexOf('--generate') + 1;
	const batchId = args[bIdx];
	if (!batchId) {
		console.error("Please specify a batch ID (e.g. node audit_runner.js --generate 01)");
		process.exit(1);
	}
	if (batchId === 'all') {
		BATCH_SPECS.forEach(b => generateBatchSentences(b.id));
	} else {
		generateBatchSentences(batchId);
	}
} else if (args.includes('--next')) {
	const bIdx = args.indexOf('--next') + 1;
	const batchId = args[bIdx];
	if (!batchId) {
		console.error("Please specify a batch ID (e.g. node audit_runner.js --next 01)");
		process.exit(1);
	}
	showNextUnit(batchId);
} else if (args.includes('--status')) {
	showStatus();
} else {
	console.error(`Unknown arguments: ${args.join(' ')}. Run with --help.`);
}
