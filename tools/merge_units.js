#!/usr/bin/env node
'use strict';
if (typeof require === 'function' && typeof module !== 'undefined' && require.main === module) require('./exit_log.js').watch('tools/merge_units.js'); // failed runs -> test.js report
require('./cli_help.js').exitWithHeaderHelp(__filename);
/**
 * tools/merge_units.js - merge duplicate language units into one canonical unit.
 *
 *   node tools/merge_units.js 337=45 424=46 ... [--dry-run]
 *
 * Unit ids are array positions (units[id]) and stored progress is keyed by id, so a duplicate is not deleted: its row
 * becomes an inert alias (PartofSpeech K.ALIAS, SemanticData.aliasOf = canonical id) that every POS-filtered pool skips,
 * the analyzer never emits, and the apps fold into the canonical unit on load (progress included).
 *
 * For each alias=canonical pair it:
 *   1. data.js (via select.js UPDATE, which validates): canonical keeps its own SemanticTags (a union would let it pass
 *      AND-filters neither duplicate passed, e.g. 무엇 into 뭐라고 slots); tags only the alias had are printed for review.
 *      It gains SemanticData keys it lacks from the alias, the alias's Conjugation when its own is empty, and the earliest
 *      pack Source (fc2 packRank: class packs first), so it unlocks no later than either duplicate did. The alias row is blanked.
 *   2. verified_sentences.js: every slot/grammar reference to the alias now points at the canonical unit; a slot whose
 *      original unit was the alias and used default filters gets the tags both units share frozen as CustomTags.
 *   3. homonyms.js: alias ids replaced by the canonical id, duplicate entries dropped.
 */

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const { K } = require('../data/constants.js');
const { KR_EN_languageUnits: UNITS, DATA_SCHEMA: D } = require('../data/data.js');
const { packRank } = require('../fc2/game.js');
const vsTune = require('./vs_tune.js');

const VS_PATH = path.join(ROOT, 'data', 'verified_sentences.js');
const HOM_PATH = path.join(ROOT, 'data', 'homonyms.js');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const pairs = args.filter(a => /^\d+=\d+$/.test(a)).map(a => a.split('=').map(Number));
if (!pairs.length) { console.log('usage: node tools/merge_units.js <aliasId>=<canonicalId> ... [--dry-run]'); process.exit(1); }

const sd = (u) => { const v = u[D.SemanticData]; return (typeof v === 'string' ? JSON.parse(v || '{}') : { ...(v || {}) }); };
const tags = (u) => Array.from(u[D.SemanticTags] || []);
const isEmpty = (v) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);

const aliasOf = new Map();
for (const [a, c] of pairs) {
	const A = UNITS[a];
	const C = UNITS[c];
	if (!A || !C) throw new Error(`unknown id in ${a}=${c}`);
	if (a === c) throw new Error(`${a}=${c}: same unit`);
	if (A[D.PartofSpeech] === K.ALIAS || C[D.PartofSpeech] === K.ALIAS) throw new Error(`${a}=${c}: already an alias`);
	if (A[D.PartofSpeech] !== C[D.PartofSpeech]) throw new Error(`${a}=${c}: part of speech differs (${A[D.PartofSpeech]} / ${C[D.PartofSpeech]})`);
	aliasOf.set(a, c);
}
for (const c of aliasOf.values()) if (aliasOf.has(c)) throw new Error(`canonical ${c} is itself merged away; point its aliases at the final unit`);

// ---------------------------------------------------------------- 1. data.js records
const groups = new Map();
for (const [a, c] of aliasOf) { if (!groups.has(c)) groups.set(c, []); groups.get(c).push(a); }
const oldTags = new Map();
const records = [];
for (const [c, aliases] of groups) {
	const C = UNITS[c];
	const members = [C, ...aliases.map(a => UNITS[a])];
	for (const u of members.slice(1)) oldTags.set(u[D.Id], tags(u).filter(t => tags(C).includes(t)));
	const mergedSd = sd(C);
	for (const u of members.slice(1)) for (const [k, v] of Object.entries(sd(u))) if (!(k in mergedSd)) mergedSd[k] = v;
	const source = members.map(u => u[D.Source]).sort((x, y) => packRank(x) - packRank(y))[0];
	const rec = { Id: c, SemanticData: mergedSd, Source: source };
	if (isEmpty(C[D.Conjugation])) { const donor = members.find(u => !isEmpty(u[D.Conjugation])); if (donor) rec.Conjugation = donor[D.Conjugation]; }
	records.push(rec);
	const added = [...new Set(members.slice(1).flatMap(tags))].filter(t => !tags(C).includes(t));
	const sdAdded = Object.keys(mergedSd).filter(k => !(k in sd(C)));
	console.log(`#${c} ${C[D.Korean]} <- ${aliases.map(a => '#' + a).join(' ')}  source ${C[D.Source]}${source !== C[D.Source] ? ' -> ' + source : ''}` +
		`${added.length ? '  alias-only tags (not merged): ' + added.join(',') : ''}${sdAdded.length ? '  +sd ' + sdAdded.join(',') : ''}${rec.Conjugation ? '  +conj' : ''}`);
	for (const a of aliases) {
		records.push({
			Id: a, PartofSpeech: K.ALIAS, English: `duplicate of #${c} ${C[D.Korean]}`, SemanticTags: ['alias'],
			SemanticData: { domain: 'alias', logic: 'alias', aliasOf: c }, Conjugation: '', SyntaxFrame: '', Disambiguation: '',
			FormalityLevel: '', HonorificRules: ''
		});
	}
}

// ---------------------------------------------------------------- 2. verified_sentences.js
let vsSrc = fs.readFileSync(VS_PATH, 'utf8');
const { VERIFIED_SENTENCES } = require('../data/verified_sentences.js');
let frozen = 0;
for (const row of VERIFIED_SENTENCES) {
	row[5].forEach((slot, i) => {
		const u = slot[0];
		if (oldTags.has(u) && !Array.isArray(slot[7])) { vsSrc = vsTune.editSlotTags(vsSrc, row[0], i, oldTags.get(u)); frozen++; }
	});
}
const blockStart = vsSrc.indexOf('const VERIFIED_SENTENCES = [');
let remapped = 0;
vsSrc = vsSrc.slice(0, blockStart) + vsSrc.slice(blockStart).replace(/\[(\d+),"/g, (m, id) => {
	const c = aliasOf.get(Number(id));
	if (c === undefined) return m;
	remapped++;
	return `[${c},"`;
});

// ---------------------------------------------------------------- 3. homonyms.js
const homSrc = fs.readFileSync(HOM_PATH, 'utf8');
const { HOMONYMS } = require('../data/homonyms.js');
const remapDeep = (v) => Array.isArray(v) ? v.map(remapDeep) : (typeof v === 'number' && aliasOf.has(v) ? aliasOf.get(v) : v);
let homChanged = 0;
const newMap = {};
for (const [k, entries] of Object.entries(HOMONYMS)) {
	const seen = new Set();
	const out = [];
	for (const e of entries.map(remapDeep)) { const key = JSON.stringify(e); if (!seen.has(key)) { seen.add(key); out.push(e); } }
	if (JSON.stringify(out) !== JSON.stringify(entries)) homChanged++;
	newMap[k] = out;
}
// Same serializer as homonyms.js updateHomonyms(), so untouched lines stay byte-identical.
const sortedKeys = Object.keys(newMap).sort((a, b) => a.localeCompare(b, 'ko'));
const homBlock = `// --- BEGIN HOMONYMS DATA ---\nconst HOMONYMS = {\n${sortedKeys.map(k => `\t${JSON.stringify(k)}: ${JSON.stringify(newMap[k])},`).join('\n')}\n};\n// --- END HOMONYMS DATA ---`;
const homOut = homSrc.replace(/^\/\/ --- BEGIN HOMONYMS DATA ---[\s\S]*?^\/\/ --- END HOMONYMS DATA ---/m, () => homBlock);

console.log(`verified_sentences: ${remapped} references remapped, ${frozen} slots frozen to their old default tags`);
console.log(`homonyms: ${homChanged} tokens changed`);
if (dryRun) { console.log('(dry run: nothing written)'); process.exit(0); }

const recFile = path.join(require('os').tmpdir(), `merge_units_${process.pid}.json`);
fs.writeFileSync(recFile, JSON.stringify(records));
cp.execFileSync(process.execPath, [path.join(ROOT, 'select.js'), 'UPDATE', 'FROMFILE', recFile], { stdio: 'inherit', cwd: ROOT });
fs.rmSync(recFile, { force: true });
fs.writeFileSync(VS_PATH, vsSrc, 'utf8');
fs.writeFileSync(HOM_PATH, homOut, 'utf8');
console.log('written: data/data.js, data/verified_sentences.js, data/homonyms.js. Next: node schema_analysis.js (summary), node test.js');
