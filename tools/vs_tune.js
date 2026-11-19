#!/usr/bin/env node
'use strict';
/**
 * tools/vs_tune.js - inspect and tune Verified Sentence templates from the command line (no web UI).
 *
 * Built for an LLM agent loosening semantic tag filters one slot at a time: every edit prints the units it
 * admits or drops, each realized in the template sentence and run through the generator's validator, so
 * the agent judges real sentences instead of tag names. Edits are written into data/verified_sentences.js
 * (slot CustomTags, template Rules) and become the webapp/fc2 defaults. Run `node tools/vs_tune.js help`.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const VS_PATH = path.join(ROOT, 'data', 'verified_sentences.js');
const { K } = require('../data/constants.js');
const { KR_EN_languageUnits: UNITS, DATA_SCHEMA: D } = require('../data/data.js');
const vg = require('../korean/generation/verified_sentence_generator.js');

const HELP = `vs_tune.js - inspect and loosen Verified Sentence slot filters without the web UI

READ
  list [--source S] [--grammar G] [--unit U] [--max-slots N]   one line per template: id, slots, sentence
  show <id> [--n N]               slots: unit, grammar, tag filters (default/custom), pool size, N sample units
  slot <id> <i> [--check] [--all] every candidate for slot i; --check realizes each one in the sentence + validates
  gen <id> [count] [--slot i] [--seed S]   random sentences (--slot i varies only slot i, like the game does)
  check <id> "<korean>"           does the string conform to the template? (slot-by-slot report)
  rules <id>                      the template's extra semantic rules
  gaps                            every documented missing mechanism (kind "gap") and unknown rule kind
  coverage [--max-slots N]        grammar units with no template of at most N slots (default 4)

WRITE (all accept --dry-run; all print the admitted/dropped units realized in the sentence)
  tags <id> <i> -tag +tag ...     remove (-) / add (+) slot filter tags
  reset <id> [<i>]                slot (or every slot) back to the strict default: the original unit's tags
  rule-add <id> '<json>'          e.g. '{"slot":2,"kind":"noTags","tags":["family"]}'
                                  kinds: anyTags | noTags | deny {ids} | sd {key, values} | gap {text, slot?}
  rule-rm <id> <n>                remove rule number n (from \`rules\`)
  ingest <file> [--source S]      add one template per line (default source "minimal"); "# ..." lines are comments;
                                  an optional "| 52,459" suffix lists grammar unit ids the line must cover

LOOSENING LOOP (per slot, see docs in tools/vs_tune.js header)
  show -> tags <id> <i> -X --dry-run -> read every OK sentence -> keep (rerun without --dry-run) or try another tag.
  The game varies ONE slot at a time with the rest fixed, so judge each slot against the fixed original context.
  If no tag split expresses the right set, add a rule; if no rule kind can, add a "gap" rule describing the
  missing mechanism (it is documented in the data and listed by \`gaps\`).
`;

// ---------------------------------------------------------------- unit helpers
const U = (id) => UNITS[id];
const unitTags = (u) => {
	const t = u && u[D.SemanticTags];
	return (t instanceof Set ? Array.from(t) : (Array.isArray(t) ? t : [])).filter(Boolean);
};
const fmtUnit = (u) => u ? `${u[D.Korean]}(${u[D.Id]}) ${String(u[D.English] || '').slice(0, 28)}` : '?';
const shortUnit = (u) => u ? `${u[D.Korean]}(${u[D.Id]})` : '?';

// ---------------------------------------------------------------- raw-text editing of verified_sentences.js
// Edits replace one element of one row in place, so diffs stay one line and K.* constants survive.
function readSrc() { return fs.readFileSync(VS_PATH, 'utf8'); }

function matchClose(src, start) {
	let depth = 0;
	let inStr = false;
	for (let i = start; i < src.length; i++) {
		const c = src[i];
		if (inStr) {
			if (c === '\\') i++;
			else if (c === '"') inStr = false;
			continue;
		}
		if (c === '"') inStr = true;
		else if (c === '[' || c === '{') depth++;
		else if (c === ']' || c === '}') { depth--; if (depth === 0) return i; }
	}
	throw new Error('unbalanced brackets at ' + start);
}

// Top-level element spans of the array literal src[start..end] (start '[' and end ']').
function splitTop(src, start, end) {
	const spans = [];
	let depth = 0;
	let inStr = false;
	let elStart = start + 1;
	for (let i = start + 1; i < end; i++) {
		const c = src[i];
		if (inStr) {
			if (c === '\\') i++;
			else if (c === '"') inStr = false;
			continue;
		}
		if (c === '"') inStr = true;
		else if (c === '[' || c === '{') depth++;
		else if (c === ']' || c === '}') depth--;
		else if (c === ',' && depth === 0) { spans.push([elStart, i]); elStart = i + 1; }
	}
	if (src.slice(elStart, end).trim()) spans.push([elStart, end]);
	return spans.map(([s, e]) => {
		while (/\s/.test(src[s])) s++;
		while (e > s && /\s/.test(src[e - 1])) e--;
		return { s, e };
	});
}

function locateRow(src, id) {
	const marker = `\n\t[${JSON.stringify(id)},`;
	const at = src.indexOf(marker);
	if (at < 0) throw new Error(`template ${id} not found in verified_sentences.js`);
	const start = at + 2;
	return { start, end: matchClose(src, start) };
}

function writeSrc(src) {
	fs.writeFileSync(VS_PATH, src, 'utf8');
	delete require.cache[require.resolve('../data/verified_sentences.js')];
	vg.resetHardcodedVerifiedCache();
}

function editSlotTags(src, id, slotIdx, tagsOrNull) {
	const row = locateRow(src, id);
	const els = splitTop(src, row.start, row.end);
	const slotsEl = els[5];
	const slots = splitTop(src, slotsEl.s, slotsEl.e - 1);
	const slot = slots[slotIdx];
	if (!slot) throw new Error(`slot ${slotIdx} out of range`);
	const fields = splitTop(src, slot.s, slot.e - 1);
	const f = fields[7];
	const text = tagsOrNull === null ? 'null' : JSON.stringify(tagsOrNull);
	return src.slice(0, f.s) + text + src.slice(f.e);
}
const rawSetSlotTags = (id, slotIdx, tagsOrNull) => writeSrc(editSlotTags(readSrc(), id, slotIdx, tagsOrNull));

function editRules(src, id, rules) {
	const row = locateRow(src, id);
	const els = splitTop(src, row.start, row.end);
	const text = JSON.stringify(rules);
	if (els[6]) return rules.length ? src.slice(0, els[6].s) + text + src.slice(els[6].e) : src.slice(0, els[5].e) + src.slice(els[6].e);
	return rules.length ? src.slice(0, els[5].e) + ',' + text + src.slice(els[5].e) : src;
}
const rawSetRules = (id, rules) => writeSrc(editRules(readSrc(), id, rules));

// ---------------------------------------------------------------- template helpers
function getTpl(id) {
	const t = vg.getVerifiedSentenceById(id);
	if (!t) throw new Error(`template ${id} not found`);
	return t;
}
const isLocked = (slot) => Boolean(slot.inflection && (slot.inflection.stemForm === K.FIXED_GRAMMAR || slot.inflection.stemForm === 'exact'));
const defaultTags = (slot) => {
	if (typeof slot.originalUnitId === 'number' && U(slot.originalUnitId)) return unitTags(U(slot.originalUnitId));
	return [];
};
function rawCustomTags(id, slotIdx) {
	const { VERIFIED_SENTENCES } = require('../data/verified_sentences.js');
	const row = VERIFIED_SENTENCES.find(r => r[0] === id);
	const ct = row && row[5][slotIdx] && row[5][slotIdx][7];
	return Array.isArray(ct) ? ct : null;
}
const sentenceOf = (t) => (t.originalKo || t.slots.map(s => s.originalSurface + (s.trailingPunct || '')).join(' ') + (t.punctuation || ''));

function realizeWith(tpl, slotIdx, unitId) {
	const res = vg.generateSentenceFromTemplate(tpl, {
		targetUnitId: unitId, targetSlotIndex: slotIdx, varyMode: 'selected', unlockedSlots: [slotIdx]
	});
	if (res && res.ok) {
		const chosen = res.slotChoices && res.slotChoices[slotIdx];
		const landed = chosen && (chosen.chosenUnitId === unitId || (chosen.chosenUnit && chosen.chosenUnit[D.Id] === unitId));
		return { ok: landed !== false, ko: res.ko, en: res.enNatural || res.en || '', note: landed === false ? 'unit did not land in slot' : '' };
	}
	const err = res && res.validation && res.validation.errors && res.validation.errors[0];
	return { ok: false, ko: '', en: '', note: err ? `${err.code || ''} ${err.message || ''}`.trim() : (res && res.message) || 'failed' };
}

function printRealized(tpl, slotIdx, units, limit) {
	let okN = 0;
	let badN = 0;
	const shown = limit > 0 ? units.slice(0, limit) : units;
	for (const u of shown) {
		const r = realizeWith(tpl, slotIdx, u[D.Id]);
		if (r.ok) { okN++; console.log(`    OK   ${shortUnit(u).padEnd(14)} ${r.ko}   | ${r.en}`); }
		else { badN++; console.log(`    REJ  ${shortUnit(u).padEnd(14)} ${r.note}`); }
	}
	if (shown.length < units.length) console.log(`    ... ${units.length - shown.length} more (--all)`);
	return { okN, badN };
}

function withSlotTags(tpl, slotIdx, tags) {
	const copy = JSON.parse(JSON.stringify(tpl));
	copy.slots[slotIdx].tags = tags;
	return copy;
}
function withRules(tpl, rules) {
	const copy = JSON.parse(JSON.stringify(tpl));
	copy.rules = rules;
	copy.slots.forEach((s, i) => { s.rules = rules.filter(r => r.slot === i); });
	return copy;
}
const poolIds = (slot) => vg.getSlotCandidates(slot).candidates.map(u => u[D.Id]);

function printDelta(beforeTpl, afterTpl, slotIdx, flags) {
	const before = new Set(poolIds(beforeTpl.slots[slotIdx]));
	const afterList = poolIds(afterTpl.slots[slotIdx]);
	const after = new Set(afterList);
	const added = afterList.filter(x => !before.has(x)).map(U);
	const dropped = [...before].filter(x => !after.has(x)).map(U);
	console.log(`  slot ${slotIdx}: pool ${before.size} -> ${after.size}  (+${added.length} admitted, -${dropped.length} dropped)`);
	if (isLocked(afterTpl.slots[slotIdx])) console.log('  NOTE: slot is LOCKED (stemForm exact/fixed): it never varies, so its filters have no effect.');
	if (added.length) {
		console.log('  admitted (realized with the rest of the sentence fixed):');
		const r = printRealized(afterTpl, slotIdx, added, flags.all ? 0 : 40);
		console.log(`  -> ${r.okN} OK, ${r.badN} rejected by the existing validator`);
	}
	if (dropped.length) console.log('  dropped: ' + dropped.map(shortUnit).join(' '));
}

// ---------------------------------------------------------------- commands
function cmdList(flags) {
	const all = vg.getAllVerifiedSentences();
	let rows = all;
	if (flags.source) rows = rows.filter(t => t.source === flags.source);
	if (flags.grammar) rows = rows.filter(t => t.grammarUnitIds.includes(Number(flags.grammar)));
	if (flags.unit) rows = rows.filter(t => t.slots.some(s => s.originalUnitId === Number(flags.unit)));
	if (flags['max-slots']) rows = rows.filter(t => t.slots.length <= Number(flags['max-slots']));
	for (const t of rows) {
		const nRules = (t.rules || []).length;
		console.log(`${t.id.padEnd(16)} ${String(t.slots.length).padStart(2)} slots${nRules ? ` ${nRules}r` : ''}  ${sentenceOf(t)}`);
	}
	console.log(`(${rows.length} of ${all.length} templates)`);
}

function cmdShow(id, flags) {
	const t = getTpl(id);
	const n = Number(flags.n || 10);
	console.log(`${t.id}  [${t.source}]  ${sentenceOf(t)}`);
	console.log(`grammar units: ${t.grammarUnitIds.map(g => shortUnit(U(g))).join(' ')}`);
	t.slots.forEach((s, i) => {
		const pool = vg.getSlotCandidates(s);
		const custom = rawCustomTags(id, i);
		const def = defaultTags(s);
		let tagNote = 'default';
		if (custom) {
			const rm = def.filter(x => !custom.includes(x));
			const add = custom.filter(x => !def.includes(x));
			tagNote = `custom${rm.length ? ' -' + rm.join(' -') : ''}${add.length ? ' +' + add.join(' +') : ''}`;
		}
		const g = (s.grammar || []).map(x => `${x.text}(${x.unitId})`).join(' ');
		console.log(`[${i}] ${s.originalSurface}  ${s.pos}  ${fmtUnit(U(s.originalUnitId))}${g ? '  grammar: ' + g : ''}`);
		console.log(`    form ${s.category}/${s.inflection.stemForm}${isLocked(s) ? '  LOCKED' : ''}  tags[${tagNote}]: ${s.tags.join(', ') || '(none)'}`);
		(s.rules || []).forEach(r => console.log(`    rule: ${JSON.stringify(r)}`));
		if (!isLocked(s)) {
			const sample = pool.candidates.slice(0, n).map(shortUnit).join(' ');
			console.log(`    pool ${pool.count}: ${sample}${pool.count > n ? ' ...' : ''}`);
		}
	});
	const tplRules = (t.rules || []).filter(r => typeof r.slot !== 'number');
	tplRules.forEach(r => console.log(`rule: ${JSON.stringify(r)}`));
}

function cmdSlot(id, i, flags) {
	const t = getTpl(id);
	const s = t.slots[i];
	if (!s) throw new Error('no such slot');
	const pool = vg.getSlotCandidates(s).candidates;
	console.log(`${t.id} slot ${i} (${s.originalSurface}, ${s.pos}) tags: ${s.tags.join(', ') || '(none)'}  pool ${pool.length}${isLocked(s) ? '  LOCKED' : ''}`);
	if (flags.check) printRealized(t, i, pool, flags.all ? 0 : 60);
	else (flags.all ? pool : pool.slice(0, 200)).forEach(u => console.log('  ' + fmtUnit(u)));
}

function cmdGen(id, count, flags) {
	const t = getTpl(id);
	const opts = flags.slot !== undefined ? { varyMode: 'selected', unlockedSlots: [Number(flags.slot)] } : { varyMode: 'all' };
	const base = Number(flags.seed || Date.now() % 100000);
	let shown = 0;
	const seen = new Set();
	for (let k = 0; k < count * 6 && shown < count; k++) {
		const r = vg.generateSentenceFromTemplate(t, { ...opts, seedOffset: base + k * 17, variationIndex: k });
		if (r && r.ok && seen.has(r.ko)) continue;
		if (r && r.ok) { shown++; seen.add(r.ko); console.log(`  ${r.ko}   | ${r.enNatural || r.en}`); }
		else if (k === 0) console.log('  FAILED: ' + ((r && r.message) || '?'));
	}
	console.log(`(seed ${base})`);
}

function cmdCheck(id, text) {
	const t = getTpl(id);
	const analyzer = require('../korean/analyzer/index.js');
	const analyzed = analyzer.analyzeSentence(text, 1, analyzer.getIndex());
	const x = vg.extractVerifiedSentenceTemplate(analyzed, 'check', null, 1);
	if (!x) {
		const bad = (analyzed.tokens || []).filter(tk => !tk || tk.category === 'unknown' || (tk.lexical && tk.lexical.missing) || (tk.grammar || []).some(g => g.missing));
		console.log(`DOES NOT CONFORM: the string does not analyze into a valid template${bad.length ? ' (unrecognized: ' + bad.map(b => b.surface || b.text || '?').join(' ') + ')' : ' (validator rejected it)'}`);
		return false;
	}
	const problems = [];
	if (x.slots.length !== t.slots.length) problems.push(`slot count ${x.slots.length} != ${t.slots.length}`);
	const units = UNITS;
	for (let i = 0; i < Math.min(x.slots.length, t.slots.length); i++) {
		const a = t.slots[i];
		const b = x.slots[i];
		const ga = (a.grammar || []).map(g => g.unitId).sort().join(',');
		const gb = (b.grammar || []).map(g => g.unitId).sort().join(',');
		if (ga !== gb) problems.push(`[${i}] grammar ${gb || '-'} != template ${ga || '-'}`);
		const u = units[b.originalUnitId];
		if (isLocked(a)) {
			if (b.originalSurface !== a.originalSurface) problems.push(`[${i}] locked slot needs "${a.originalSurface}", got "${b.originalSurface}"`);
		} else if (b.originalUnitId !== a.originalUnitId) {
			// The analyzer picks one homonym; the string conforms if any same-spelling, same-POS unit fits the slot.
			const ctx = vg.buildSlotMatchContext(a, units);
			const homonyms = units.filter(h => h && h[D.Korean] === (u && u[D.Korean]) && h[D.PartofSpeech] === a.pos);
			const fit = homonyms.find(h => h[D.Id] === a.originalUnitId || vg.isUnitEligibleForSlot(h, a, ctx));
			if (fit) continue;
			problems.push(`[${i}] ${shortUnit(u)} is not in the slot pool (tags ${a.tags.join(',') || '-'})`);
		}
	}
	console.log(problems.length ? 'DOES NOT CONFORM:\n  ' + problems.join('\n  ') : `CONFORMS to ${id}`);
	return problems.length === 0;
}

function cmdTags(id, i, ops, flags) {
	const before = getTpl(id);
	const s = before.slots[i];
	if (!s) throw new Error('no such slot');
	let tags = [...s.tags];
	for (const op of ops) {
		const tag = op.slice(1);
		if (op[0] === '-') { if (!tags.includes(tag)) throw new Error(`slot ${i} has no tag "${tag}" (has: ${tags.join(', ')})`); tags = tags.filter(x => x !== tag); }
		else if (op[0] === '+') { if (!tags.includes(tag)) tags.push(tag); }
		else throw new Error(`tag op must start with - or +: ${op}`);
	}
	const after = withSlotTags(before, i, tags);
	printDelta(before, after, i, flags);
	if (flags['dry-run']) { console.log('  (dry run: nothing written)'); return; }
	const def = defaultTags(s);
	const same = tags.length === def.length && tags.every(x => def.includes(x));
	rawSetSlotTags(id, i, same ? null : tags);
	console.log(`  written: ${id}[${i}] tags = ${same ? 'default' : JSON.stringify(tags)}`);
}

function cmdReset(id, i, flags) {
	const before = getTpl(id);
	const idxs = i === undefined ? before.slots.map((_, k) => k) : [i];
	for (const k of idxs) {
		const after = withSlotTags(before, k, defaultTags(before.slots[k]));
		if (poolIds(after.slots[k]).join() === poolIds(before.slots[k]).join() && !rawCustomTags(id, k)) continue;
		printDelta(before, after, k, flags);
		if (!flags['dry-run']) rawSetSlotTags(id, k, null);
	}
	console.log(flags['dry-run'] ? '  (dry run: nothing written)' : `  ${id}: reset ${i === undefined ? 'all slots' : 'slot ' + i} to default tags`);
}

const RULE_KINDS = ['anyTags', 'noTags', 'deny', 'sd', 'gap'];
function cmdRules(id) {
	const t = getTpl(id);
	if (!t.rules.length) { console.log(`${id}: no rules`); return; }
	t.rules.forEach((r, k) => console.log(`${k}: ${JSON.stringify(r)}${RULE_KINDS.includes(r.kind) ? '' : '   <- UNKNOWN KIND (ignored by generator)'}`));
}

function cmdRuleAdd(id, json, flags) {
	let rule;
	try { rule = JSON.parse(json); } catch (e) { throw new Error('rule must be JSON: ' + e.message); }
	if (!RULE_KINDS.includes(rule.kind)) throw new Error(`unknown kind "${rule.kind}" (known: ${RULE_KINDS.join(', ')}). To document a mechanism that does not exist yet, use {"kind":"gap","slot":i,"text":"..."}`);
	if (rule.kind === 'gap' && !rule.text) throw new Error('a gap rule needs "text" explaining the missing mechanism');
	if (rule.kind !== 'gap' && typeof rule.slot !== 'number') throw new Error('slot rules need a numeric "slot"');
	const before = getTpl(id);
	const rules = [...before.rules, rule];
	if (typeof rule.slot === 'number' && rule.kind !== 'gap') {
		const after = withRules(before, rules);
		printDelta(before, after, rule.slot, flags);
		const orig = U(before.slots[rule.slot].originalUnitId);
		if (orig && !vg.slotRulesAllow(orig, after.slots[rule.slot])) console.log(`  WARNING: the rule excludes the template's own unit ${shortUnit(orig)}`);
	}
	if (flags['dry-run']) { console.log('  (dry run: nothing written)'); return; }
	rawSetRules(id, rules);
	console.log(`  written: ${id} rule ${rules.length - 1} = ${JSON.stringify(rule)}`);
}

function cmdRuleRm(id, n, flags) {
	const before = getTpl(id);
	const rule = before.rules[n];
	if (!rule) throw new Error(`no rule ${n}`);
	const rules = before.rules.filter((_, k) => k !== n);
	if (typeof rule.slot === 'number' && rule.kind !== 'gap') printDelta(before, withRules(before, rules), rule.slot, flags);
	if (flags['dry-run']) { console.log('  (dry run: nothing written)'); return; }
	rawSetRules(id, rules);
	console.log(`  removed: ${JSON.stringify(rule)}`);
}

function cmdGaps() {
	let n = 0;
	for (const t of vg.getAllVerifiedSentences()) {
		(t.rules || []).forEach((r, k) => {
			if (r.kind === 'gap' || !RULE_KINDS.includes(r.kind)) {
				n++;
				console.log(`${t.id} rule ${k}${typeof r.slot === 'number' ? ' slot ' + r.slot : ''}: ${r.kind === 'gap' ? r.text : 'UNKNOWN KIND ' + JSON.stringify(r)}`);
				console.log(`    ${sentenceOf(t)}`);
			}
		});
	}
	console.log(`(${n} gaps)`);
}

function cmdCoverage(flags) {
	const max = Number(flags['max-slots'] || 4);
	const best = new Map();
	for (const t of vg.getAllVerifiedSentences()) for (const g of t.grammarUnitIds) best.set(g, Math.min(best.get(g) || 99, t.slots.length));
	const gram = UNITS.filter(u => u[D.PartofSpeech] === K.POS_GRAMMAR);
	const missing = gram.filter(u => !(best.get(u[D.Id]) <= max));
	missing.forEach(u => console.log(`${String(u[D.Id]).padStart(5)} ${u[D.Korean]}  shortest: ${best.has(u[D.Id]) ? best.get(u[D.Id]) + ' slots' : 'none'}  | ${String(u[D.English]).slice(0, 50)}`));
	console.log(`(${missing.length} of ${gram.length} grammar units lack a template of <= ${max} slots)`);
}

function kNameMap(src) {
	const map = {};
	for (const m of src.matchAll(/K\.([A-Z0-9_]+)/g)) if (typeof K[m[1]] === 'string' && !map[K[m[1]]]) map[K[m[1]]] = m[1];
	return map;
}
function rowText(row, kmap) {
	const slotText = (s) => '[' + s.map((v, j) => ((j === 2 || j === 3) && kmap[v]) ? 'K.' + kmap[v] : JSON.stringify(v)).join(',') + ']';
	const head = row.slice(0, 5).map(v => JSON.stringify(v)).join(',');
	const rest = row.length > 6 ? ',' + JSON.stringify(row[6]) : '';
	return `[${head},[${row[5].map(slotText).join(',')}]${rest}]`;
}

function cmdIngest(file, flags) {
	const source = flags.source || 'minimal';
	const lines = fs.readFileSync(path.resolve(file), 'utf8').split(/\r?\n/);
	const existing = vg.getAllVerifiedSentences();
	const seenKo = new Set(existing.filter(t => t.source === source).map(t => t.originalKo));
	let seq = existing.filter(t => t.source === source).length;
	const usedIds = new Set(existing.map(t => t.id));
	const analyzer = require('../korean/analyzer/index.js');
	const index = analyzer.getIndex();
	const newRows = [];
	let rejected = 0;
	for (const line of lines) {
		const raw = line.trim();
		if (!raw || raw.startsWith('#')) continue;
		const [text, want] = raw.split('|').map(x => x.trim());
		const wantIds = want ? want.split(',').map(Number).filter(Number.isFinite) : [];
		if (seenKo.has(text)) { console.log(`SKIP dup   ${text}`); continue; }
		let id;
		do { seq++; id = `vs_${source}_${seq}`; } while (usedIds.has(id));
		const analyzed = analyzer.analyzeSentence(text, seq, index);
		const tpl = vg.extractVerifiedSentenceTemplate(analyzed, source, null, seq);
		if (!tpl) {
			seq--;
			rejected++;
			const bad = (analyzed.tokens || []).filter(tk => !tk || tk.category === 'unknown' || (tk.lexical && tk.lexical.missing) || (tk.grammar || []).some(g => g.missing));
			console.log(`REJECT     ${text}   ${bad.length ? 'unrecognized: ' + bad.map(b => b.surface || b.text || '?').join(' ') : 'validator rejected / no predicate'}`);
			continue;
		}
		tpl.id = id;
		tpl.title = `[${source} #${seq}]`;
		const miss = wantIds.filter(g => !tpl.grammarUnitIds.includes(g));
		const gtxt = tpl.grammarUnitIds.join(',');
		if (miss.length) {
			seq--;
			rejected++;
			console.log(`MISS       ${text}   analyzer found grammar [${gtxt}], expected ${miss.join(',')}`);
			continue;
		}
		seenKo.add(text);
		usedIds.add(id);
		newRows.push(vg.serializeCompactTemplate(tpl));
		console.log(`OK ${id.padEnd(16)} ${tpl.slots.length} slots  grammar [${gtxt}]  ${text}`);
	}
	console.log(`${newRows.length} accepted, ${rejected} rejected`);
	if (!newRows.length || flags['dry-run']) { if (flags['dry-run']) console.log('(dry run: nothing written)'); return; }
	const src = readSrc();
	const kmap = kNameMap(src);
	const endMarker = '\n];';
	const blockStart = src.indexOf('const VERIFIED_SENTENCES = [');
	const at = src.indexOf(endMarker, blockStart);
	writeSrc(src.slice(0, at) + ',\n' + newRows.map(r => '\t' + rowText(r, kmap)).join(',\n') + src.slice(at));
	console.log(`appended ${newRows.length} templates to data/verified_sentences.js`);
}

// ---------------------------------------------------------------- arg parsing
function parseArgs(argv) {
	const pos = [];
	const flags = {};
	const BOOL = new Set(['all', 'check', 'dry-run']);
	for (let k = 0; k < argv.length; k++) {
		const a = argv[k];
		if (a.startsWith('--')) {
			const [key, val] = a.slice(2).split('=');
			if (val !== undefined) flags[key] = val;
			else if (BOOL.has(key)) flags[key] = true;
			else flags[key] = argv[++k];
		} else pos.push(a);
	}
	return { pos, flags };
}

function main() {
	const { pos, flags } = parseArgs(process.argv.slice(2));
	const [cmd, a, b, ...rest] = pos;
	const num = (x, name) => { const n = Number(x); if (!Number.isInteger(n)) throw new Error(`${name} must be an integer`); return n; };
	switch (cmd) {
	case 'list': return cmdList(flags);
	case 'show': return cmdShow(a, flags);
	case 'slot': return cmdSlot(a, num(b, 'slot'), flags);
	case 'gen': return cmdGen(a, b ? num(b, 'count') : 5, flags);
	case 'check': return process.exit(cmdCheck(a, [b, ...rest].join(' ')) ? 0 : 1);
	case 'tags': return cmdTags(a, num(b, 'slot'), rest, flags);
	case 'reset': return cmdReset(a, b === undefined ? undefined : num(b, 'slot'), flags);
	case 'rules': return cmdRules(a);
	case 'rule-add': return cmdRuleAdd(a, [b, ...rest].join(' '), flags);
	case 'rule-rm': return cmdRuleRm(a, num(b, 'rule number'), flags);
	case 'gaps': return cmdGaps();
	case 'coverage': return cmdCoverage(flags);
	case 'ingest': return cmdIngest(a, flags);
	default: console.log(HELP);
	}
}

if (require.main === module) {
	try { main(); } catch (e) { console.error('error: ' + e.message); process.exit(2); }
}

module.exports = { splitTop, locateRow, editSlotTags, editRules, rowText, kNameMap };
