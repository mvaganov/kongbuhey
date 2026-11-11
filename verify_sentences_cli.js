#!/usr/bin/env node
/**
 * verify_sentences_cli.js
 * 
 * Command-line Testing & Verification Tool for Verified Sentences Generation System.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { K } = require('./constants.js');
const { KR_EN_languageUnits, DATA_SCHEMA } = require('./data.js');
const state = require('./korean/state.js');
const { generateVerifiedSentencesForUnit } = require('./korean/generation/verified_sentence_generator.js');

function printHelp() {
	console.log(`verify_sentences_cli.js - Interactive CLI Sentence Verification System

USAGE:
  node verify_sentences_cli.js [options]
  node verify_sentences_cli.js <unitId> <seed>

OPTIONS:
  <unitId> <seed>     Deterministically regenerate a specific sentence for a unit
  --status            Display current verification progress and history
  --reset             Reset verification progress back to Unit ID 0
  --unit <id>         Inspect a specific unit without advancing the saved pointer
  --range <start>-<end> Inspect an inclusive range of unit IDs (e.g. --range 3-27)
  --dump              Print sentences non-interactively without prompting or saving
  --json              Format --dump output as machine-readable JSON
  --limit <N>         Limit verification loop to N units in this session
  --yes               Non-interactive mode: automatically approve all units
  --no                Non-interactive mode: automatically flag error on current unit
  -h, --help          Display this help message and exit

WORKFLOW:
  1. Start or resume testing:  node verify_sentences_cli.js
  2. For each unit, review the 10 generated candidate sentences:
     - 'y': Pass and advance to next language unit
     - 'n': Fail and halt, saving progress at the failed unit
     - 'q': Quit session without advancing
  3. When an error is flagged ('n'), inspect and fix the generator/data code.
  4. Re-run 'node verify_sentences_cli.js' to verify your fix on the exact same unit.
`);
}

const PROGRESS_PATH = path.resolve(__dirname, 'scratch', 'sentence_verification_progress.json');

function ensureScratchDir() {
	const dir = path.dirname(PROGRESS_PATH);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

function loadProgress() {
	ensureScratchDir();
	if (fs.existsSync(PROGRESS_PATH)) {
		try {
			return JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf8'));
		} catch (_) {
			// Fall through to default
		}
	}
	return {
		currentUnitId: 0,
		lastVerifiedUnitId: null,
		totalVerified: 0,
		lastUpdated: null,
		history: []
	};
}

function saveProgress(progress) {
	ensureScratchDir();
	progress.lastUpdated = new Date().toISOString();
	fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2), 'utf8');
}

function getSeedForUnitAndIndex(unitId, index) {
	const baseSeed = (unitId + 1) * 100;
	return baseSeed * 10 + index;
}

function generate10SentencesForUnit(unitId) {
	const baseSeed = (unitId + 1) * 100;
	state.setRandomSeed(baseSeed);
	const res = generateVerifiedSentencesForUnit(unitId, 10, {
		seedOffset: baseSeed,
		random: false
	});

	const sentences = (res && res.sentences) ? res.sentences : [];
	return sentences.map((s, idx) => ({
		unitId,
		seed: baseSeed * 10 + idx,
		index: idx + 1,
		ko: s.ko,
		en: s.en,
		isVerifiedStructure: Boolean(s.isVerifiedStructure),
		templateId: s.verifiedTemplateId || null,
		difficultyTier: s.difficultyTier || null,
		difficultyLabel: s.difficultyLabel || null
	}));
}

function generateSentenceForUnitAndSeed(unitId, seed) {
	const seedNum = Number(seed);
	const index = Math.abs(seedNum) % 10;
	const baseSeed = Math.floor(seedNum / 10);
	state.setRandomSeed(baseSeed || 1);
	const res = generateVerifiedSentencesForUnit(unitId, 10, {
		seedOffset: baseSeed,
		random: false
	});

	if (res && res.sentences && res.sentences.length > 0) {
		const s = res.sentences[index % res.sentences.length];
		return {
			unitId,
			seed: seedNum,
			index: index + 1,
			ko: s.ko,
			en: s.en,
			isVerifiedStructure: Boolean(s.isVerifiedStructure),
			templateId: s.verifiedTemplateId || null,
			difficultyTier: s.difficultyTier || null,
			difficultyLabel: s.difficultyLabel || null
		};
	}
	return null;
}

function formatSingleSentenceDisplay(item) {
	const badge = item.isVerifiedStructure ? `[Verified: ${item.templateId || 'Template'}]` : `[AST Fallback]`;
	const diff = item.difficultyLabel ? ` (${item.difficultyLabel})` : '';
	return `  [${item.index}/10] [Unit: ${item.unitId}, Seed: ${item.seed}] ${badge}${diff}\n` +
	       `         KO: ${item.ko}\n` +
	       `         EN: ${item.en || '(No gloss)'}\n`;
}

function printUnitHeader(unit) {
	const id = unit[DATA_SCHEMA.Id];
	const ko = unit[DATA_SCHEMA.Korean];
	const en = unit[DATA_SCHEMA.English];
	const pos = unit[DATA_SCHEMA.PartofSpeech];
	const pScore = unit[DATA_SCHEMA.PriorityScore];

	console.log(`\n================================================================================`);
	console.log(`Language Unit #${id}: "${ko}" (${en}) | POS: ${pos} | PriorityScore: ${pScore}`);
	console.log(`================================================================================`);
}

function promptUser(rl, questionText) {
	return new Promise(resolve => {
		rl.question(questionText, answer => {
			resolve(String(answer || '').trim());
		});
	});
}

async function runCli() {
	const args = process.argv.slice(2);

	// 0. Help Command
	if (args.includes('-h') || args.includes('--help')) {
		printHelp();
		process.exit(0);
	}

	// 1. Status Command
	if (args.includes('--status')) {
		const prog = loadProgress();
		console.log(`\n--- Sentence Verification Progress ---`);
		console.log(`Current Unit ID: ${prog.currentUnitId}`);
		console.log(`Last Verified ID: ${prog.lastVerifiedUnitId !== null ? prog.lastVerifiedUnitId : 'None'}`);
		console.log(`Total Units Verified: ${prog.totalVerified} / ${KR_EN_languageUnits.length}`);
		console.log(`Last Updated: ${prog.lastUpdated || 'Never'}\n`);
		process.exit(0);
	}

	// 2. Reset Command
	if (args.includes('--reset')) {
		saveProgress({
			currentUnitId: 0,
			lastVerifiedUnitId: null,
			totalVerified: 0,
			lastUpdated: new Date().toISOString(),
			history: []
		});
		console.log(`[RESET] Sentence verification progress reset to Unit ID 0.`);
		process.exit(0);
	}

	// 3. Single Sentence Exact Regeneration by (Unit ID, Seed)
	let targetUnitArg = null;
	let targetSeedArg = null;

	if (args.length >= 2 && !args[0].startsWith('-') && !args[1].startsWith('-')) {
		targetUnitArg = parseInt(args[0], 10);
		targetSeedArg = parseInt(args[1], 10);
	} else if (args.includes('--unit') && args.includes('--seed')) {
		targetUnitArg = parseInt(args[args.indexOf('--unit') + 1], 10);
		targetSeedArg = parseInt(args[args.indexOf('--seed') + 1], 10);
	}

	if (targetUnitArg !== null && !isNaN(targetUnitArg) && targetSeedArg !== null && !isNaN(targetSeedArg)) {
		const unit = KR_EN_languageUnits[targetUnitArg];
		if (!unit) {
			console.error(`[ERROR] Unit ID ${targetUnitArg} not found.`);
			process.exit(1);
		}
		const single = generateSentenceForUnitAndSeed(targetUnitArg, targetSeedArg);
		if (!single) {
			console.error(`[ERROR] Could not generate sentence for Unit ID ${targetUnitArg} with seed ${targetSeedArg}.`);
			process.exit(1);
		}
		printUnitHeader(unit);
		console.log(formatSingleSentenceDisplay(single));
		process.exit(0);
	}

	// 4. Specific Unit / Range Inspection (without modifying saved pointer)
	let singleUnitInspection = null;
	if (args.includes('--unit') && !args.includes('--seed')) {
		singleUnitInspection = parseInt(args[args.indexOf('--unit') + 1], 10);
	}

	let rangeStart = null;
	let rangeEnd = null;
	if (args.includes('--range')) {
		const rangeStr = args[args.indexOf('--range') + 1] || '';
		const m = rangeStr.match(/^(\d+)-(\d+)$/);
		if (!m) {
			console.error(`[ERROR] Invalid --range format '${rangeStr}'. Expected '<start>-<end>' (e.g. 3-27).`);
			process.exit(1);
		}
		rangeStart = parseInt(m[1], 10);
		rangeEnd = parseInt(m[2], 10);
	}

	const isDump = args.includes('--dump');
	const isJson = args.includes('--json');

	// 5. Non-Interactive Dump Mode (Read-Only Batch Output)
	if (isDump) {
		const progress = loadProgress();
		const maxUnits = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1], 10) : Infinity;
		const startId = rangeStart !== null ? rangeStart : (singleUnitInspection !== null ? singleUnitInspection : progress.currentUnitId);
		const endId = rangeEnd !== null ? rangeEnd : (singleUnitInspection !== null ? singleUnitInspection : KR_EN_languageUnits.length - 1);

		const dumpResults = [];
		let count = 0;
		for (let id = startId; id <= endId && id < KR_EN_languageUnits.length && count < maxUnits; id++) {
			const unit = KR_EN_languageUnits[id];
			if (!unit) continue;
			const batch = generate10SentencesForUnit(id);
			if (isJson) {
				dumpResults.push({
					unitId: id,
					korean: unit[DATA_SCHEMA.Korean],
					english: unit[DATA_SCHEMA.English],
					pos: unit[DATA_SCHEMA.PartofSpeech],
					sentences: batch
				});
			} else {
				printUnitHeader(unit);
				if (batch.length === 0) {
					console.log(`  [WARN] 0 sentences generated for Unit #${id}.`);
				} else {
					for (const item of batch) {
						console.log(formatSingleSentenceDisplay(item));
					}
				}
			}
			count++;
		}
		if (isJson) {
			console.log(JSON.stringify(dumpResults, null, 2));
		}
		process.exit(0);
	}

	// 6. Interactive / Automated Testing Loop
	const progress = loadProgress();
	let currentId = rangeStart !== null ? rangeStart : (singleUnitInspection !== null ? singleUnitInspection : progress.currentUnitId);
	const loopEndId = rangeEnd !== null ? rangeEnd : KR_EN_languageUnits.length - 1;

	const autoYes = args.includes('--yes');
	const autoNo = args.includes('--no');
	const maxUnits = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1], 10) : Infinity;
	let processedInSession = 0;

	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	try {
		while (currentId <= loopEndId && currentId < KR_EN_languageUnits.length && processedInSession < maxUnits) {
			const unit = KR_EN_languageUnits[currentId];
			if (!unit) {
				currentId++;
				continue;
			}

			printUnitHeader(unit);
			const batch = generate10SentencesForUnit(currentId);
			if (batch.length === 0) {
				console.log(`  [WARN] 0 sentences generated for Unit #${currentId}.`);
			} else {
				for (const item of batch) {
					console.log(formatSingleSentenceDisplay(item));
				}
			}

			let decision = '';
			if (autoYes) {
				decision = 'y';
				console.log(`[Auto-Yes] Verified Unit #${currentId}`);
			} else if (autoNo) {
				decision = 'n';
				console.log(`[Auto-No] Rejected Unit #${currentId}`);
			} else {
				decision = await promptUser(rl, `Verify Unit #${currentId} (${batch.length} sentences): All correct? [y=pass, n=fail/stop, q=quit]: `);
				decision = decision.toLowerCase();
			}

			const isInspectionMode = singleUnitInspection !== null || rangeStart !== null;
			if (decision === 'y' || decision === 'yes') {
				if (!isInspectionMode) {
					progress.lastVerifiedUnitId = currentId;
					progress.totalVerified = (progress.totalVerified || 0) + 1;
					progress.history.push({
						unitId: currentId,
						korean: unit[DATA_SCHEMA.Korean],
						status: 'passed',
						timestamp: new Date().toISOString()
					});
					currentId++;
					progress.currentUnitId = currentId;
					saveProgress(progress);
				} else if (singleUnitInspection !== null) {
					console.log(`[OK] Unit #${currentId} verified in single inspection mode.`);
					break;
				} else {
					console.log(`[OK] Unit #${currentId} verified in range inspection mode.`);
					currentId++;
				}
				processedInSession++;
			} else if (decision === 'n' || decision === 'no') {
				if (!isInspectionMode) {
					progress.history.push({
						unitId: currentId,
						korean: unit[DATA_SCHEMA.Korean],
						status: 'failed',
						timestamp: new Date().toISOString()
					});
					saveProgress(progress);
				}
				console.log(`\n================================================================================`);
				console.log(`[STOPPED] Generation mistake flagged on Unit #${currentId} ("${unit[DATA_SCHEMA.Korean]}").`);
				console.log(`Progress saved at Unit #${currentId}. Inspect and fix the generation code, then restart.`);
				console.log(`================================================================================\n`);
				process.exit(1);
			} else if (decision === 'q' || decision === 'quit') {
				console.log(`[QUIT] Exiting sentence verification.`);
				process.exit(0);
			} else {
				console.log(`[INVALID] Please enter 'y' for pass, 'n' for fail/stop, or 'q' to quit.`);
			}
		}

		if (currentId >= KR_EN_languageUnits.length) {
			console.log(`\n🎉 All ${KR_EN_languageUnits.length} language units have been verified!`);
		}
	} finally {
		rl.close();
	}
}

if (require.main === module) {
	runCli().catch(err => {
		console.error(`[FATAL] Error running verify_sentences_cli:`, err);
		process.exit(1);
	});
}

module.exports = {
	loadProgress,
	saveProgress,
	getSeedForUnitAndIndex,
	generate10SentencesForUnit,
	generateSentenceForUnitAndSeed,
	runCli
};

