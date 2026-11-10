#!/usr/bin/env node

/**
 * scripts/audit_priority_scores.js
 *
 * Dedicated CLI helper tool to audit, inspect, export, and batch-apply
 * PriorityScore updates to data.js.
 *
 * Commands:
 *   node scripts/audit_priority_scores.js stats
 *       Prints summary distribution of PriorityScores across all language units and per POS.
 *
 *   node scripts/audit_priority_scores.js inspect [--tier <num>] [--pos <pos>] [--search <query>] [--limit <num>]
 *       Inspects language units matching filters with disambiguation glosses and metadata.
 *
 *   node scripts/audit_priority_scores.js export [--tier <num>] [--pos <pos>] --out <filepath>
 *       Exports language units to a review JSON file with ProposedPriorityScore and Reason fields.
 *
 *   node scripts/audit_priority_scores.js apply <filepath> [--dry-run]
 *       Validates proposed scores, previews changes, and batch-updates data.js in-place.
 *
 *   node scripts/audit_priority_scores.js verify
 *       Verifies that all units have valid numeric PriorityScores (0.5, 1, 2, 3, 4, 5).
 */

const fs = require('fs');
const path = require('path');
const { K } = require('../constants.js');

const DATA_FILE_PATH = path.resolve(__dirname, '../data.js');

const VALID_PRIORITY_SCORES = [0.5, 1, 2, 3, 4, 5];

function loadDataset() {
	delete require.cache[require.resolve(DATA_FILE_PATH)];
	const { KR_EN_languageUnits, DATA_SCHEMA } = require(DATA_FILE_PATH);
	return { KR_EN_languageUnits, DATA_SCHEMA };
}

function getStats() {
	const { KR_EN_languageUnits, DATA_SCHEMA } = loadDataset();
	const overall = {};
	const perPos = {};

	for (const u of KR_EN_languageUnits) {
		const score = u[DATA_SCHEMA.PriorityScore];
		const pos = u[DATA_SCHEMA.PartofSpeech] || 'Unknown';

		overall[score] = (overall[score] || 0) + 1;
		if (!perPos[pos]) perPos[pos] = {};
		perPos[pos][score] = (perPos[pos][score] || 0) + 1;
	}

	return { total: KR_EN_languageUnits.length, overall, perPos };
}

function printStats() {
	const { total, overall, perPos } = getStats();

	console.log(`\n======================================================`);
	console.log(`        KONGBUHEY PRIORITY SCORE DISTRIBUTION         `);
	console.log(`======================================================`);
	console.log(`Total Units: ${total}\n`);

	console.log(`Overall Tiers:`);
	const allTiers = [0.5, 1, 2, 3, 4, 5];
	const tierLabels = {
		0.5: 'Tier 0.5 (Ultra-Basic Examples)',
		1:   'Tier 1.0 (Top Essential / Survival)',
		2:   'Tier 2.0 (Core Beginner / TOPIK I L1)',
		3:   'Tier 3.0 (Elementary / TOPIK I L2)',
		4:   'Tier 4.0 (Intermediate / TOPIK II L3-4)',
		5:   'Tier 5.0 (Advanced / Niche)'
	};

	allTiers.forEach(t => {
		const count = overall[t] || 0;
		const pct = ((count / total) * 100).toFixed(1);
		const bar = '█'.repeat(Math.round(count / 25));
		console.log(`  ${String(t).padEnd(4)} | ${tierLabels[t].padEnd(38)} | ${String(count).padStart(5)} (${pct.padStart(5)}%) ${bar}`);
	});

	// Check if any invalid/string scores exist
	const otherKeys = Object.keys(overall).filter(k => !allTiers.includes(Number(k)));
	if (otherKeys.length > 0) {
		console.log(`\n  ⚠️ Other/Unclassified Scores:`);
		otherKeys.forEach(k => console.log(`     "${k}": ${overall[k]} units`));
	}

	console.log(`\n------------------------------------------------------`);
	console.log(`Distribution by Part of Speech:`);
	console.log(`------------------------------------------------------`);

	const posList = Object.keys(perPos).sort((a, b) => {
		const sumA = Object.values(perPos[a]).reduce((s, v) => s + v, 0);
		const sumB = Object.values(perPos[b]).reduce((s, v) => s + v, 0);
		return sumB - sumA;
	});

	posList.forEach(pos => {
		const scores = perPos[pos];
		const subtotal = Object.values(scores).reduce((s, v) => s + v, 0);
		const breakdown = allTiers.map(t => `P${t}:${scores[t] || 0}`).join(' | ');
		console.log(`  ${pos.padEnd(18)} (${String(subtotal).padStart(4)} units): ${breakdown}`);
	});
	console.log(`======================================================\n`);
}

function inspectUnits(options = {}) {
	const { KR_EN_languageUnits, DATA_SCHEMA } = loadDataset();
	let filtered = KR_EN_languageUnits;

	if (options.tier !== undefined && options.tier !== null) {
		const targetTier = Number(options.tier);
		filtered = filtered.filter(u => u[DATA_SCHEMA.PriorityScore] === targetTier);
	}

	if (options.pos) {
		const targetPos = options.pos.toLowerCase();
		filtered = filtered.filter(u => String(u[DATA_SCHEMA.PartofSpeech] || '').toLowerCase() === targetPos);
	}

	if (options.search) {
		const q = options.search.toLowerCase();
		filtered = filtered.filter(u => {
			const ko = String(u[DATA_SCHEMA.Korean] || '').toLowerCase();
			const en = String(u[DATA_SCHEMA.English] || '').toLowerCase();
			return ko.includes(q) || en.includes(q);
		});
	}

	const limit = options.limit ? parseInt(options.limit, 10) : 50;
	console.log(`\nFound ${filtered.length} matching units (showing first ${Math.min(limit, filtered.length)}):`);
	console.log(`------------------------------------------------------------------------------------------------------`);
	console.log(`ID    | Korean          | POS              | PScore | English / Disambiguation`);
	console.log(`------------------------------------------------------------------------------------------------------`);

	filtered.slice(0, limit).forEach(u => {
		const id = String(u[DATA_SCHEMA.Id]).padEnd(5);
		const ko = String(u[DATA_SCHEMA.Korean]).padEnd(15);
		const pos = String(u[DATA_SCHEMA.PartofSpeech]).padEnd(16);
		const ps = String(u[DATA_SCHEMA.PriorityScore]).padEnd(6);
		const en = String(u[DATA_SCHEMA.English]);
		const disambig = u[DATA_SCHEMA.Disambiguation] ? ` [${u[DATA_SCHEMA.Disambiguation]}]` : '';
		console.log(`${id} | ${ko} | ${pos} | ${ps} | ${en}${disambig}`);
	});
	console.log(`------------------------------------------------------------------------------------------------------\n`);
}

function exportUnits(options = {}) {
	const { KR_EN_languageUnits, DATA_SCHEMA } = loadDataset();
	let filtered = KR_EN_languageUnits;

	if (options.tier !== undefined && options.tier !== null) {
		const targetTier = Number(options.tier);
		filtered = filtered.filter(u => u[DATA_SCHEMA.PriorityScore] === targetTier);
	}

	if (options.pos) {
		const targetPos = options.pos.toLowerCase();
		filtered = filtered.filter(u => String(u[DATA_SCHEMA.PartofSpeech] || '').toLowerCase() === targetPos);
	}

	const exportList = filtered.map(u => {
		const id = u[DATA_SCHEMA.Id];
		const ko = u[DATA_SCHEMA.Korean];
		const en = u[DATA_SCHEMA.English];
		const pos = u[DATA_SCHEMA.PartofSpeech];
		const tags = u[DATA_SCHEMA.SemanticTags] || [];
		const source = u[DATA_SCHEMA.Source] || '';
		const currentPs = u[DATA_SCHEMA.PriorityScore];

		return {
			Id: id,
			Korean: ko,
			English: en,
			PartofSpeech: pos,
			SemanticTags: tags,
			Source: source,
			CurrentPriorityScore: currentPs,
			ProposedPriorityScore: currentPs,
			Reason: ''
		};
	});

	const outFile = options.out || path.resolve(__dirname, `../scratch/priority_review_${Date.now()}.json`);
	const outDir = path.dirname(outFile);
	if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

	fs.writeFileSync(outFile, JSON.stringify(exportList, null, 2), 'utf8');
	console.log(`\nExported ${exportList.length} units to: ${outFile}`);
	console.log(`Edit "ProposedPriorityScore" (0.5, 1, 2, 3, 4, 5) and optionally "Reason" in that file.`);
	console.log(`Then run: node scripts/audit_priority_scores.js apply "${outFile}" [--dry-run]\n`);
	return outFile;
}

function replacePriorityScoreInLine(line, newScore) {
	const trimmed = line.trim();
	if (!trimmed.startsWith('[') || (!trimmed.endsWith('],') && !trimmed.endsWith(']'))) return line;

	let depthBracket = 0;
	let depthBrace = 0;
	let inString = false;
	let stringChar = '';
	let escape = false;

	const startIdx = line.indexOf('[');
	let elemStart = startIdx + 1;
	const elements = [];

	for (let i = startIdx + 1; i < line.length; i++) {
		const ch = line[i];
		if (escape) { escape = false; continue; }
		if (ch === '\\') { escape = true; continue; }
		if (inString) {
			if (ch === stringChar) inString = false;
			continue;
		}
		if (ch === '"' || ch === "'") {
			inString = true;
			stringChar = ch;
			continue;
		}
		if (ch === '[') { depthBracket++; continue; }
		if (ch === ']') {
			if (depthBracket > 0) { depthBracket--; continue; }
			else {
				elements.push({ start: elemStart, end: i, text: line.slice(elemStart, i) });
				break;
			}
		}
		if (ch === '{') { depthBrace++; continue; }
		if (ch === '}') { depthBrace--; continue; }
		if (ch === ',' && depthBracket === 0 && depthBrace === 0) {
			elements.push({ start: elemStart, end: i, text: line.slice(elemStart, i) });
			elemStart = i + 1;
		}
	}

	if (elements.length > 8) {
		const target = elements[8];
		const before = line.slice(0, target.start);
		const after = line.slice(target.end);
		return before + ' ' + newScore + after;
	}
	return line;
}

function applyUpdates(reviewFilePath, options = {}) {
	if (!fs.existsSync(reviewFilePath)) {
		throw new Error(`Review file does not exist: ${reviewFilePath}`);
	}

	const reviewData = JSON.parse(fs.readFileSync(reviewFilePath, 'utf8'));
	if (!Array.isArray(reviewData) || reviewData.length === 0) {
		throw new Error(`No records found in review file: ${reviewFilePath}`);
	}

	const { KR_EN_languageUnits, DATA_SCHEMA } = loadDataset();
	const updates = [];
	const errors = [];

	reviewData.forEach((rec, idx) => {
		const id = rec.Id;
		if (typeof id !== 'number' || !KR_EN_languageUnits[id]) {
			errors.push(`Row ${idx}: Invalid or missing Unit ID ${id}.`);
			return;
		}

		const proposed = rec.ProposedPriorityScore;
		if (typeof proposed !== 'number' || !VALID_PRIORITY_SCORES.includes(proposed)) {
			errors.push(`Unit ID ${id} (${rec.Korean || KR_EN_languageUnits[id][DATA_SCHEMA.Korean]}): Invalid ProposedPriorityScore "${proposed}". Must be one of: ${VALID_PRIORITY_SCORES.join(', ')}.`);
			return;
		}

		const current = KR_EN_languageUnits[id][DATA_SCHEMA.PriorityScore];
		if (proposed !== current) {
			updates.push({
				id,
				ko: KR_EN_languageUnits[id][DATA_SCHEMA.Korean],
				pos: KR_EN_languageUnits[id][DATA_SCHEMA.PartofSpeech],
				en: KR_EN_languageUnits[id][DATA_SCHEMA.English],
				current,
				proposed,
				reason: rec.Reason || ''
			});
		}
	});

	if (errors.length > 0) {
		console.error(`\nValidation Errors (${errors.length}):`);
		errors.slice(0, 15).forEach(e => console.error(`  - ${e}`));
		if (errors.length > 15) console.error(`  ... and ${errors.length - 15} more errors.`);
		throw new Error('Aborted: Review file contains invalid PriorityScores.');
	}

	console.log(`\n======================================================`);
	console.log(`          PRIORITY SCORE UPDATE PREVIEW               `);
	console.log(`======================================================`);
	console.log(`Total Records Reviewed: ${reviewData.length}`);
	console.log(`Proposed Score Changes: ${updates.length}`);
	console.log(`Unchanged Units:        ${reviewData.length - updates.length}\n`);

	if (updates.length === 0) {
		console.log('No PriorityScore changes detected in review file. Exiting.');
		return { updated: 0 };
	}

	// Breakdown of proposed movements
	const transitions = {};
	updates.forEach(u => {
		const key = `${u.current} -> ${u.proposed}`;
		transitions[key] = (transitions[key] || 0) + 1;
	});

	console.log(`Transition Breakdown:`);
	Object.entries(transitions).forEach(([k, v]) => console.log(`  ${k.padEnd(14)}: ${v} units`));

	console.log(`\nSample Changes (first 20):`);
	console.log(`------------------------------------------------------------------------------------------------------`);
	console.log(`ID    | Korean          | POS              | Change     | English`);
	console.log(`------------------------------------------------------------------------------------------------------`);
	updates.slice(0, 20).forEach(u => {
		const id = String(u.id).padEnd(5);
		const ko = String(u.ko).padEnd(15);
		const pos = String(u.pos).padEnd(16);
		const chg = `P${u.current} -> P${u.proposed}`.padEnd(10);
		console.log(`${id} | ${ko} | ${pos} | ${chg} | ${u.en}`);
	});
	console.log(`------------------------------------------------------------------------------------------------------\n`);

	if (options.dryRun) {
		console.log(`[DRY RUN] No changes were written to data.js. Remove --dry-run to commit.`);
		return { updated: updates.length, dryRun: true };
	}

	// Apply updates directly to data.js
	const dataContent = fs.readFileSync(DATA_FILE_PATH, 'utf8');
	const lines = dataContent.split('\n');

	// Map of Id to update line in data.js
	// Language units in data.js have Id as first element in array: [ 0, ... ]
	let appliedCount = 0;
	const updateMap = new Map(updates.map(u => [u.id, u.proposed]));

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		// Match unit line: \t[<id>, ...
		const idMatch = line.match(/^\t\[\s*(\d+)\s*,/);
		if (idMatch) {
			const id = parseInt(idMatch[1], 10);
			if (updateMap.has(id)) {
				const nextScore = updateMap.get(id);
				lines[i] = replacePriorityScoreInLine(line, nextScore);
				appliedCount++;
			}
		}
	}

	fs.writeFileSync(DATA_FILE_PATH, lines.join('\n'), 'utf8');
	console.log(`✔ Successfully committed ${appliedCount} PriorityScore updates to data.js!\n`);

	// Print updated stats
	printStats();
	return { updated: appliedCount };
}

function verifyScores() {
	const { KR_EN_languageUnits, DATA_SCHEMA } = loadDataset();
	let invalidCount = 0;

	KR_EN_languageUnits.forEach((u, id) => {
		const score = u[DATA_SCHEMA.PriorityScore];
		if (typeof score !== 'number' || !VALID_PRIORITY_SCORES.includes(score)) {
			console.error(`Invalid PriorityScore at ID ${id} (${u[DATA_SCHEMA.Korean]}): ${JSON.stringify(score)}`);
			invalidCount++;
		}
	});

	if (invalidCount === 0) {
		console.log(`✔ All ${KR_EN_languageUnits.length} units have valid PriorityScores in { ${VALID_PRIORITY_SCORES.join(', ')} }.`);
	} else {
		console.error(`❌ Found ${invalidCount} units with invalid PriorityScores!`);
		process.exit(1);
	}
}

function parseCliArgs(argv) {
	const args = argv.slice(2);
	const command = args[0] || 'stats';
	const options = {};

	for (let i = 1; i < args.length; i++) {
		const arg = args[i];
		if (arg === '--dry-run') options.dryRun = true;
		else if (arg === '--tier' && args[i + 1]) options.tier = args[++i];
		else if (arg === '--pos' && args[i + 1]) options.pos = args[++i];
		else if (arg === '--search' && args[i + 1]) options.search = args[++i];
		else if (arg === '--limit' && args[i + 1]) options.limit = args[++i];
		else if (arg === '--out' && args[i + 1]) options.out = args[++i];
		else if (!arg.startsWith('--') && !options.filePath) options.filePath = arg;
	}

	return { command, options };
}

function main() {
	const { command, options } = parseCliArgs(process.argv);

	switch (command.toLowerCase()) {
		case 'stats':
			printStats();
			break;
		case 'inspect':
			inspectUnits(options);
			break;
		case 'export':
			exportUnits(options);
			break;
		case 'apply':
			applyUpdates(options.filePath || options.out, options);
			break;
		case 'verify':
			verifyScores();
			break;
		default:
			console.log(`Unknown command: "${command}". Expected stats, inspect, export, apply, or verify.`);
			process.exit(1);
	}
}

if (require.main === module) {
	main();
}

module.exports = {
	getStats,
	inspectUnits,
	exportUnits,
	applyUpdates,
	verifyScores
};
