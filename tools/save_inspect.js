#!/usr/bin/env node
'use strict';
if (typeof require === 'function' && typeof module !== 'undefined' && require.main === module) require('./exit_log.js').watch('tools/save_inspect.js'); // failed runs -> test.js report
/**
 * tools/save_inspect.js - answer questions about an fc2 save file (Menu > Backup / restore text) without reading it into context.
 *
 * The format is read only through fc2/store.js unpackBackup (where app.js builds it), and sentence generation is replayed with the
 * game's own option builder (fc2/game.js sentenceOptions) and queue (fc2/queue.js), so this tool follows the app when they change.
 *
 * Usage: node tools/save_inspect.js <command> [save.json] [options]   (save defaults to the newest local/GameSave_*.json)
 *   summary                    level, coins, options, unlocked units by part of speech and pack, queue, notes
 *   owned [--pos P] [--source S] [--sort strength|id]   unlocked units with score, star tier and strength (what the slot bias uses)
 *   unit <id|korean>           one unit: owned?, progress, strength vs the owned mean
 *   gen [--cards N] [--unit ID] [--seed S] [--top K] [--show N]
 *                              replay N cards of example generation as the game does (each card: one unlocked unit, opts.count
 *                              sentences, unlocked-only filter, slot bias, "time to use it" queue) and tally sentence endings,
 *                              predicates, templates and generator paths. --show prints N sample sentences.
                              What-ifs: --no-bias (no slot bias), --all-units (as if onlyOwned were off), --no-recent (no
                              recently-used penalty), --as-saved (without the always-unlocked units the app adds on load).
 *   fields                     what each backup field means (from fc2/store.js)
 */
require('./cli_help.js').exitWithHeaderHelp(__filename);
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const Store = require('../fc2/store.js');
const G = require('../fc2/game.js');
const Q = require('../fc2/queue.js');
const { KR_EN_languageUnits: UNITS, DATA_SCHEMA: D } = require('../data/data.js');

function parseArgs(argv) {
	const pos = [], flags = {};
	for (let k = 0; k < argv.length; k++) {
		const a = argv[k];
		if (a.startsWith('--')) { const [key, val] = a.slice(2).split('='); flags[key] = val !== undefined ? val : (argv[k + 1] && !argv[k + 1].startsWith('--') ? argv[++k] : true); }
		else pos.push(a);
	}
	return { pos, flags };
}

function defaultSave() {
	const dir = path.join(ROOT, 'local');
	const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => /^GameSave.*\.json$/i.test(f)).map(f => path.join(dir, f)) : [];
	files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
	if (!files.length) throw new Error('no save given and no local/GameSave_*.json found');
	return files[0];
}

function loadSave(file) {
	const save = Store.unpackBackup(fs.readFileSync(file, 'utf8'));
	const saveTime = Math.max(0, ...[...save.prog.values()].map(u => Math.max(u.lastSeen, u.lastCorrect)));
	return { ...save, file, now: saveTime || Math.floor(Date.now() / 1000) };   // judge decay at the moment of the save, not today
}

const U = (id) => UNITS[id];
const ko = (id) => (U(id) ? U(id)[D.Korean] : `#${id}`);
const unitOf = (save) => (id) => save.prog.get(id) || G.blankUnit();
const strengthOf = (save) => (id) => { const u = unitOf(save)(id); return G.effectiveScore(u, save.now) + u.tier; };
const countBy = (arr, f) => arr.reduce((m, x) => { const k = f(x); m[k] = (m[k] || 0) + 1; return m; }, {});
const fmtCounts = (m, top = 99) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, top).map(([k, n]) => `${k} ${n}`).join(', ');

function cmdSummary(save) {
	const g = save.game, owned = g.owned || [];
	console.log(`${path.basename(save.file)}  backup v${save.version}  (judged at ${new Date(save.now * 1000).toISOString()})`);
	console.log(`level ${g.level}  coins ${g.coins}  xp ${g.xp}  pulls ${g.pulls}  ascensions ${g.ascensions}  seals ${g.seals}`);
	console.log(`options: ${JSON.stringify(save.opts)}`);
	console.log(`unlocked units: ${owned.length}`);
	console.log(`  by part of speech: ${fmtCounts(countBy(owned, id => U(id) ? U(id)[D.PartofSpeech] : 'missing'))}`);
	console.log(`  by pack: ${fmtCounts(countBy(owned, id => U(id) ? U(id)[D.Source] : 'missing'))}`);
	const s = strengthOf(save), mean = owned.reduce((n, id) => n + s(id), 0) / (owned.length || 1);
	console.log(`  strength mean ${mean.toFixed(2)} (slot bias redraws fillers above it); ${owned.filter(id => s(id) <= mean).length} units at or below`);
	console.log(`verified queue: ${(g.vq || []).length} ids; notes: ${Object.keys(save.notes).length}; flags in backup: ${save.flags ? save.flags.length : 'none'}`);
}

function cmdOwned(save, flags) {
	const s = strengthOf(save), uo = unitOf(save);
	let ids = [...(save.game.owned || [])];
	if (flags.pos) ids = ids.filter(id => U(id) && String(U(id)[D.PartofSpeech]).toLowerCase().includes(String(flags.pos).toLowerCase()));
	if (flags.source) ids = ids.filter(id => U(id) && String(U(id)[D.Source]) === flags.source);
	if (flags.sort !== 'id') ids.sort((a, b) => s(a) - s(b));
	for (const id of ids) { const u = uo(id); console.log(`${String(id).padStart(5)} ${ko(id).padEnd(8)} ${String(U(id) && U(id)[D.PartofSpeech]).padEnd(16)} ${String(U(id) && U(id)[D.Source]).padEnd(10)} score ${u.score} tier ${u.tier} strength ${s(id).toFixed(2)}`); }
	console.log(`(${ids.length} units)`);
}

function cmdUnit(save, key) {
	const id = /^\d+$/.test(String(key)) ? Number(key) : UNITS.findIndex(u => u && u[D.Korean] === key);
	if (!U(id)) throw new Error(`no unit ${key}`);
	const owned = (save.game.owned || []).includes(id), s = strengthOf(save), all = save.game.owned || [];
	const mean = all.reduce((n, x) => n + s(x), 0) / (all.length || 1);
	console.log(`${id} ${ko(id)} (${U(id)[D.English]}) ${U(id)[D.PartofSpeech]} pack ${U(id)[D.Source]}  owned: ${owned}`);
	if (owned) console.log(`  progress ${JSON.stringify(unitOf(save)(id))}  strength ${s(id).toFixed(2)} vs mean ${mean.toFixed(2)} (${s(id) > mean ? 'redrawn by slot bias' : 'favored by slot bias'})`);
}

function cmdGen(save, flags) {
	const korean = require('../korean/index.js');
	const { generateSentencesForUnit } = require('../shared/sentence_adapter.js');
	const vg = require('../korean/generation/verified_sentence_generator.js');
	const owned = save.game.owned || [];
	const cards = Number(flags.cards || 60), seed = Number(flags.seed || 1), show = Number(flags.show || 0);
	const tplIds = vg.getAllVerifiedSentences().map(t => t.id);
	let queue = Q.normalize(save.game.vq, tplIds);
	let rnd = seed;
	const random = () => { rnd = (rnd * 1103515245 + 12345) % 2147483648; return rnd / 2147483648; };
	const sents = [];
	const core = UNITS.filter(u => u && u[D.SemanticData] && u[D.SemanticData].alwaysUnlocked).map(u => u[D.Id]);
	// The app's custom names (Menu > Names) are runtime units added at load; add them the same way, then the name lists.
	const { addLearningUnit } = require('../data/data.js');
	for (const c of G.normalizeNames(save.opts.names).custom) addLearningUnit(G.customNameRow(c, D));
	const names = G.nameUse(UNITS.filter(u => G.isNameRow(u, D)), save.opts.names, D);
	if (!flags['as-saved']) G.ensureUnlocked(save.game, core);   // the app adds these on load
	let recent = [];
	for (let c = 0; c < cards; c++) {
		const id = flags.unit !== undefined ? Number(flags.unit) : owned[Math.floor(random() * owned.length)];
		korean.setRandomSeed(seed * 1000 + c);
		const opts = flags['all-units'] ? { ...save.opts, onlyOwned: false } : save.opts;
		const options = G.sentenceOptions({ owned: save.game.owned, opts, unitOf: unitOf(save), now: save.now, queue, idOf: u => u[D.Id], random, recent: flags['no-recent'] ? [] : recent, targetId: id, names });
		if (flags['no-bias']) delete options.slotBias;
		const list = Array.from(generateSentencesForUnit(id, Number(save.opts.count) || 3, options) || []);
		recent = G.pushRecent(recent, G.contentUnitIds(list));   // app.js generateFor
		for (const s of list) {
			sents.push({ card: id, ...s });
			if (s.verifiedTemplateId) queue = Q.toBack(queue, tplIds, s.verifiedTemplateId);   // app.js vqUsed
		}
	}
	const top = Number(flags.top || 12);
	const words = s => String(s.ko || '').replace(/[.?!~]+$/, '').split(/\s+/);
	const pred = s => { const us = (s.unitsUsed || []).filter(u => u.kind !== 'grammar' && u.kind !== K_GRAMMAR); return us.length ? `${us[us.length - 1].ko}(${us[us.length - 1].unitId})` : '?'; };
	console.log(`${sents.length} sentences from ${cards} cards (seed ${seed}${flags.unit !== undefined ? `, unit ${ko(Number(flags.unit))}` : ', random unlocked units'})`);
	const pct = (m) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, top).map(([k, n]) => `  ${String(n).padStart(4)} ${(100 * n / sents.length).toFixed(0).padStart(3)}%  ${k}`).join('\n');
	console.log('last word:\n' + pct(countBy(sents, s => words(s).slice(-1).join(' '))));
	console.log('last two words:\n' + pct(countBy(sents, s => words(s).slice(-2).join(' '))));
	console.log('final content unit:\n' + pct(countBy(sents, pred)));
	console.log('template / path:\n' + pct(countBy(sents, s => s.verifiedTemplateId || (s.isVerifiedStructure ? 'verified?' : 'AST generator'))));
	if (show) sents.slice(0, show).forEach(s => console.log(`  [${ko(s.card)}] ${s.ko}   | ${s.verifiedTemplateId || 'AST'}`));
}
const K_GRAMMAR = require('../data/constants.js').K.GRAMMAR;

function cmdFields() {
	const src = fs.readFileSync(path.join(ROOT, 'fc2', 'store.js'), 'utf8');
	const m = src.match(/\/\*\*\n \* Fields of a backup[\s\S]*?\*\//);
	console.log(m ? m[0].replace(/^\/\*\*\n| \*\/$/g, '').replace(/^ \* ?/gm, '') : 'see fc2/store.js BACKUP_FIELDS');
}

function main() {
	const { pos, flags } = parseArgs(process.argv.slice(2));
	const cmd = pos[0];
	if (!cmd || cmd === 'help') { console.log('usage: node tools/save_inspect.js <summary|owned|unit|gen|fields> [save.json] (details: --help)'); return; }
	if (cmd === 'fields') return cmdFields();
	const rest = pos.slice(1);
	const fileArg = rest.find(x => /\.json$/i.test(x));
	const save = loadSave(fileArg ? path.resolve(fileArg) : defaultSave());
	const args = rest.filter(x => x !== fileArg);
	switch (cmd) {
	case 'summary': return cmdSummary(save);
	case 'owned': return cmdOwned(save, flags);
	case 'unit': return cmdUnit(save, args[0]);
	case 'gen': return cmdGen(save, flags);
	default: throw new Error(`unknown command ${cmd} (try: help)`);
	}
}

if (require.main === module) {
	try { main(); } catch (e) { console.error('error: ' + e.message); process.exit(2); }
}
module.exports = { loadSave };
