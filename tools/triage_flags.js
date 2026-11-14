#!/usr/bin/env node
/**
 * tools/triage_flags.js - turn "⚐ Bad sentence" flags into regression fixtures.
 *
 * Workflow
 *   1. In the app, click "⚐ Bad sentence", then "⬇ Flags (N)" to download flags-*.json.
 *   2. Put the file(s) in flagged/ (gitignored inbox).
 *   3. node tools/triage_flags.js                       -> compact report of every pending flag
 *   4. The agent judges each one, then records it:
 *        node tools/triage_flags.js verdict <#|sentence> confirmed|false_positive|unsure "reason"
 *   5. node tools/triage_flags.js promote               -> confirmed verdicts become test/golden_sentences.json fixtures
 *      (status "open" while the generator still produces them, "fixed" otherwise)
 *   6. The agent fixes the generator rule, sets status to "fixed" and runs `node test.js`.
 *
 * Verdicts live in flagged/verdicts.json (keyed by sentence). Never judge a flag from memory:
 * the report shows every unit used, and reproducibility across seeds.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { KR_EN_languageUnits: UNITS } = require('../data.js');
const { FIXTURE_PATH, sampleSentences, findViolations, loadFixtures } = require('../test/golden_lib.js');

const FLAG_DIR = path.resolve(__dirname, '..', 'flagged');
const VERDICT_PATH = path.join(FLAG_DIR, 'verdicts.json');
const VERDICTS = ['confirmed', 'false_positive', 'unsure'];

function readJson(file, fallback) {
	return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : fallback;
}

function loadFlags() {
	if (!fs.existsSync(FLAG_DIR)) return [];
	const byKo = new Map();
	for (const f of fs.readdirSync(FLAG_DIR).filter(n => n.endsWith('.json') && n !== 'verdicts.json').sort()) {
		const doc = readJson(path.join(FLAG_DIR, f), {});
		for (const it of doc.items || []) if (it.ko && !byKo.has(it.ko)) byKo.set(it.ko, { ...it, file: f });
	}
	return Array.from(byKo.values());
}

const unitLabel = (id) => {
	const u = UNITS[id];
	return u ? `#${id} ${u[1]} "${u[2]}" (${u[3]})` : `#${id} (unknown)`;
};

function reproduction(flag, seeds) {
	if (typeof flag.targetUnitId !== 'number') return 'unknown target unit';
	const hits = findViolations({ forbiddenKo: [flag.ko] }, sampleSentences(flag.targetUnitId, seeds));
	return hits.length ? `YES (seed ${hits[0].seed}, ${hits.length}x in ${seeds} seeds)` : `no (0 in ${seeds} seeds; may be rare or fixed)`;
}

function resolveKo(flags, key) {
	if (/^#?\d+$/.test(key)) return (flags[parseInt(key.replace('#', ''), 10) - 1] || {}).ko;
	return key;
}

const [cmd = 'report', ...rest] = process.argv.slice(2);
const flags = loadFlags();
const verdicts = readJson(VERDICT_PATH, {});

if (cmd === 'report') {
	const seeds = parseInt(process.env.TRIAGE_SEEDS || '150', 10);
	const showAll = rest.includes('--all');
	const pending = flags.map((f, i) => ({ f, n: i + 1 })).filter(({ f }) => showAll || !verdicts[f.ko]);
	console.log(`${flags.length} flag(s) in flagged/, ${pending.length} ${showAll ? 'shown' : 'pending'}.`);
	for (const { f, n } of pending) {
		console.log(`\n#${n} ${f.ko}`);
		console.log(`   literal: ${f.enLiteral}`);
		console.log(`   natural: ${f.enNatural}`);
		console.log(`   origin: ${f.origin}${f.templateId ? ' [' + f.templateId + ']' : ''}  tier: ${f.tier || '-'}  mode: ${f.mode}`);
		console.log(`   target: ${typeof f.targetUnitId === 'number' ? unitLabel(f.targetUnitId) : '?'}`);
		console.log(`   morphemes: ${(f.segments || []).map(s => s.unitId === null ? s.ko : `${s.ko}#${s.unitId}`).join(' + ')}`);
		console.log(`   units: ${(f.unitIds || []).map(unitLabel).join(' | ')}`);
		console.log(`   reproducible: ${reproduction(f, seeds)}`);
		if (verdicts[f.ko]) console.log(`   verdict: ${verdicts[f.ko].verdict} - ${verdicts[f.ko].reason}`);
	}
} else if (cmd === 'verdict') {
	const [key, verdict, ...reasonParts] = rest;
	const ko = key && resolveKo(flags, key);
	if (!ko || !VERDICTS.includes(verdict)) {
		console.error(`usage: verdict <#|sentence> ${VERDICTS.join('|')} "reason"`);
		process.exit(1);
	}
	verdicts[ko] = { verdict, reason: reasonParts.join(' '), at: new Date().toISOString().slice(0, 10) };
	fs.writeFileSync(VERDICT_PATH, JSON.stringify(verdicts, null, 2));
	console.log(`recorded: ${ko} -> ${verdict}`);
} else if (cmd === 'promote') {
	const seeds = parseInt(process.env.TRIAGE_SEEDS || '150', 10);
	const fixtures = loadFixtures();
	const have = new Set(fixtures.flatMap(fx => fx.forbiddenKo || []));
	let added = 0;
	for (const f of flags) {
		const v = verdicts[f.ko];
		if (!v || v.verdict !== 'confirmed' || have.has(f.ko)) continue;
		const stillBad = typeof f.targetUnitId === 'number' &&
			findViolations({ forbiddenKo: [f.ko] }, sampleSentences(f.targetUnitId, seeds)).length > 0;
		const id = 'g' + String(fixtures.length + 1).padStart(3, '0');
		fixtures.push({
			id, targetUnitId: f.targetUnitId, forbiddenKo: [f.ko], forbiddenSubstrings: [],
			reason: v.reason, templateId: f.templateId || null, status: stillBad ? 'open' : 'fixed', addedAt: v.at
		});
		added++;
		console.log(`+ ${id} [${stillBad ? 'open' : 'fixed'}] ${f.ko}  (${v.reason})`);
	}
	fs.writeFileSync(FIXTURE_PATH, JSON.stringify({ fixtures }, null, 2) + '\n');
	console.log(`${added} fixture(s) added; ${fixtures.length} total -> ${path.relative(process.cwd(), FIXTURE_PATH)}`);
} else {
	console.error('commands: report [--all] | verdict <#|sentence> <verdict> "reason" | promote');
	process.exit(1);
}
