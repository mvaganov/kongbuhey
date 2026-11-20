#!/usr/bin/env node
'use strict';
/**
 * select.js API round trips on a temp copy of data/data.js (kept beside the original so its relative requires resolve).
 * Guards the edit paths agents use instead of hand-editing data.js: UPDATE FROMFILE, inline UPDATE SET, SELECT, --dry-run.
 * Regression: UPDATE of a unit whose SyntaxFrame is a function used to leave the old multi-line entry behind (syntax error).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const select = require('../select.js');
const { K } = require('../data/constants.js');

let passed = 0;
let failed = 0;
function assert(cond, msg) {
	if (cond) { passed++; console.log(`  [PASS] ${msg}`); } else { failed++; console.error(`  [FAIL] ${msg}`); }
}

console.log('======================================================');
console.log('        SELECT.JS API (temp copy of data.js)          ');
console.log('======================================================');

const REAL = path.join(ROOT, 'data', 'data.js');
const TMP = path.join(ROOT, 'data', '_select_test_tmp_data.js');
const REC = path.join(os.tmpdir(), `select_test_${process.pid}.json`);
const SUMMARY = path.join(ROOT, 'data', 'schema_summary.json');
const ser = u => JSON.stringify(u, (k, v) => (v instanceof Set ? [...v] : (typeof v === 'function' ? String(v) : v)));
const load = () => { delete require.cache[require.resolve(TMP)]; return require(TMP); };

try {
	const realBefore = fs.readFileSync(REAL, 'utf8');
	const summaryBefore = fs.existsSync(SUMMARY) ? fs.readFileSync(SUMMARY, 'utf8') : null;
	fs.copyFileSync(REAL, TMP);
	const { KR_EN_languageUnits: before, DATA_SCHEMA: D } = load();
	const fnId = before.findIndex(u => typeof u[D.SyntaxFrame] === 'function');
	const lineId = before.findIndex(u => u[D.PartofSpeech] === K.NOUN && typeof u[D.SyntaxFrame] !== 'function');
	assert(fnId >= 0 && lineId >= 0, `fixtures: unit #${fnId} has a function SyntaxFrame, unit #${lineId} is a plain noun`);

	// UPDATE FROMFILE: one multi-line entry (function frame) and one single-line entry
	fs.writeFileSync(REC, JSON.stringify([{ Id: fnId, Source: 'selecttest_a' }, { Id: lineId, English: 'select test' }]));
	const r1 = select.executeUpdateFromFile(REC, null, { dataFile: TMP });
	const a1 = load().KR_EN_languageUnits;
	assert(r1.updated === 2 && a1.length === before.length, 'UPDATE FROMFILE updates both rows and the file still loads with the same unit count');
	assert(a1[fnId][D.Source] === 'selecttest_a' && typeof a1[fnId][D.SyntaxFrame] === 'function' && String(a1[fnId][D.SyntaxFrame]) === String(before[fnId][D.SyntaxFrame]),
		'a unit with a function SyntaxFrame keeps its frame intact (old multi-line entry fully replaced)');
	assert(a1[lineId][D.English] === 'select test', 'a single-line unit takes the new value');
	assert(a1.every((u, i) => i === fnId || i === lineId || ser(u) === ser(before[i])), 'no other unit changes');

	// Inline UPDATE SET ... WHERE, and a second edit of the now single-line function-frame entry
	select.execute(`UPDATE SET Source = 'selecttest_b' WHERE Id = ${fnId}`, { dataFile: TMP });
	const a2 = load().KR_EN_languageUnits;
	assert(a2[fnId][D.Source] === 'selecttest_b' && String(a2[fnId][D.SyntaxFrame]) === String(before[fnId][D.SyntaxFrame]) && a2.length === before.length,
		'inline UPDATE SET edits the same unit again without damaging it');

	// INSERT queues the new unit for only-list slots it could join (tools/only_expansion.js)
	{
		const TODO = path.join(os.tmpdir(), `select_test_todo_${process.pid}.json`);
		const oe = require('../tools/only_expansion.js');
		const rows = require('../data/verified_sentences.js').VERIFIED_SENTENCES;
		const target = oe.onlySlots(load().KR_EN_languageUnits, D, rows).find(x => x.shared.length && x.pos === 'Action Verb');
		assert(Boolean(target), 'there is an only-list verb slot with shared tags to test against');
		const newId = load().KR_EN_languageUnits.length;
		fs.writeFileSync(REC, JSON.stringify([{ Id: newId, Korean: '시험삼다', English: 'test verb', PartofSpeech: 'Action Verb', PriorityScore: 3, SemanticTags: target.shared }]));
		select.executeUpdateFromFile(REC, null, { dataFile: TMP, dryRun: true, expansionTodoPath: TODO });
		assert(!fs.existsSync(TODO), 'a dry-run INSERT queues nothing');
		select.executeUpdateFromFile(REC, null, { dataFile: TMP, expansionTodoPath: TODO });
		const items = fs.existsSync(TODO) ? JSON.parse(fs.readFileSync(TODO, 'utf8')).items : [];
		assert(items.some(it => it.unitId === newId && it.templateId === target.templateId && it.slot === target.slot),
			`INSERT of a word with the shared tags queues it for ${target.templateId}[${target.slot}]`);
		fs.rmSync(TODO, { force: true });
	}

	// --dry-run writes nothing
	const snapshot = fs.readFileSync(TMP, 'utf8');
	fs.writeFileSync(REC, JSON.stringify([{ Id: lineId, English: 'dry run' }]));
	select.executeUpdateFromFile(REC, null, { dataFile: TMP, dryRun: true });
	assert(fs.readFileSync(TMP, 'utf8') === snapshot, '--dry-run leaves the file unchanged');

	// SELECT reads the edited copy
	const sel = select.executeSelect(`SELECT Id, English WHERE Id = ${lineId}`, { dataFile: TMP });
	const rows = Array.isArray(sel) ? sel : (sel && (sel.rows || sel.results)) || [];
	assert(JSON.stringify(rows).includes('select test'), 'SELECT returns the edited value from the chosen data file');

	assert(fs.readFileSync(REAL, 'utf8') === realBefore, 'the real data/data.js is never touched');
	assert(!fs.existsSync(SUMMARY) || fs.readFileSync(SUMMARY, 'utf8') === summaryBefore, 'editing a temp data file does not regenerate schema_summary.json');
} catch (e) {
	failed++;
	console.error('  [FAIL] ' + (e.stack || e.message));
} finally {
	for (const f of [TMP, TMP + '.tmp', REC]) fs.rmSync(f, { force: true });
	// select.js loads the real data module for SCHEMA_COLUMNS; restore it for anything run after this in the same process
	delete require.cache[require.resolve(TMP)];
}

console.log(`\nTOTAL: ${passed + failed}  PASSED: ${passed}  FAILED: ${failed}`);
if (failed > 0) process.exit(1);
