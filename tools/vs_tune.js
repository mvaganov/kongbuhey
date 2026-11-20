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
  slot <id> <i> --open [--by-tag] every unit of the slot's POS, ignoring tags, realized; --by-tag groups the OK ones by tag
                                  (find which tag to keep, or the ids for an allow rule)
  unit <id> [<id>...]             a unit's tags, POS and English
  gen <id> [count] [--slot i] [--seed S]   random sentences (--slot i varies only slot i, like the game does)
  check <id> "<korean>"           does the string conform to the template? (slot-by-slot report)
  rules <id>                      the template's extra semantic rules
  gaps [--summary] [--class C]    documented missing mechanisms (kind "gap"); --summary counts per class
  gap-classes                     the closed list of gap classes (a gap rule must use one)
  coverage [--max-slots N]        grammar units with no template of at most N slots (default 4)
  stats [--deep]                  key=value tuning metrics; --deep (~40 s) also counts sentences that realize
                                  (compare with docs/vs_tuning_baseline.txt)
  evidence <ko> [<ko>...]         Tatoeba sentences (docs/kor_sentences.tsv) containing every given string

WRITE (all accept --dry-run; all print the admitted/dropped units realized in the sentence)
  tags <id> <i> -tag +tag ...     remove (-) / add (+) slot filter tags
  reset <id> [<i>]                slot (or every slot) back to the strict default: the original unit's tags
  rule-add <id> '<json>'          e.g. '{"slot":2,"kind":"noTags","tags":["family"]}'
                                  kinds: anyTags {tags} | noTags {tags} | deny {ids} | allow {ids} | sd {key, values}
                                  (allow: listed units join without the slot's tags; the slot's own word is always in)
                                         gap {class, text, slot?, units?}   (see gap-classes)
  rule-rm <id> <n>                remove rule number n (from \`rules\`)
  ingest <file> [--source S]      add one template per line (default source "minimal"); "# ..." lines are comments;
                                  an optional "| 52,459" suffix lists grammar unit ids the line must cover

BATCHES (ledger: data/vs_review.json)
  batch [--n 25]                  the open batch's remaining templates; opens the next batch if none is open
  batch status                    progress of the open batch + stats (deep, ~40 s) changed since the baseline
  done <id> "<note>"              mark a template of the open batch reviewed (note: what changed, or "kept")

FIXTURES (test/golden_sentences.json; checked by test/golden_sentences_test.js without sampling)
  fixture <id> <i> <unitId> bad|ok "<reason>" [--confidence clear|unsure] [--gap-class C]
                                  "template <id> slot <i> must not (bad) / must (ok) produce this unit".
                                  Status is computed: "open" if the generator violates it today, else "fixed".
  fixtures [--unsure] [--open]    list slot fixtures; --unsure = the native-speaker review list, also written to
                                  local/native_review.txt (numbered, with context, no agent guess; share that file)
  fixture-rm <gid>                delete a slot fixture (a mistaken one; to change it, delete and add again)
  fixtures --sync                 mark open fixtures the generator now satisfies as fixed (the suite fails until you do)
  human <gid> right|wrong ["note"] record the native speaker's verdict on an unsure fixture (wrong flips it)

LOOSENING LOOP: see "Verified-sentence tuning workflow" in handoff.md. In short, per variable slot:
  show -> tags <id> <i> -X --dry-run -> read every OK sentence -> keep (rerun without --dry-run) or try another tag.
  The game varies ONE slot at a time with the rest fixed, so judge each slot against the fixed original context.
  No tag split works -> a rule; no rule kind can express it -> a gap rule with a class.
`;

// ---------------------------------------------------------------- gap classes (closed list)
// A gap rule documents a mechanism the generator lacks. The class lets the implementing agent count which
// mechanism blocks the most templates. Add a class here (with a test-visible description) only when none fits:
// "other" is counted and reported, so a growing "other" count is the signal to split it.
const GAP_CLASSES = {
	'tense-time': 'a time word (어제, 내일, 지금, ...) disagrees with the predicate tense, e.g. 내일 ... 잤어요',
	'cross-slot': 'the right set for slot i depends on the word in another slot (verb-object fit, place-verb fit) and the original context cannot fix it',
	'honorific': 'subject honorific or speech-level agreement (-(으)시-, 드리다/주다, 께서) with the person in another slot',
	'counter': 'number system or counter word agreement (한 개 / 일 분, native vs Sino-Korean)',
	'predicate-class': 'grammar valid only for some predicate classes (adjective vs action verb, -고 있다, imperatives, -(으)러)',
	'particle-choice': 'the particle must change with the new word (에 vs 에서, 한테 vs 에게 for animacy) and the template keeps the old one',
	'data-tag': 'not a mechanism: the right words exist but lack (or wrongly carry) a SemanticTag in data.js; list them in "units"',
	'validator-reject': 'an existing validator rejects a natural sentence with the NEW word (errors the original also raises are already waived); name the error code',
	'english': 'the Korean is fine but the generated English is wrong',
	'template-error': 'the template itself was extracted wrongly (wrong unit, grammar or locking)',
	'other': 'none of the above; the text must say what mechanism is missing'
};

function validateRule(rule) {
	if (!rule || typeof rule !== 'object') return 'a rule must be a JSON object';
	if (!RULE_KINDS.includes(rule.kind)) return `unknown kind "${rule.kind}" (known: ${RULE_KINDS.join(', ')})`;
	if (rule.kind === 'gap') {
		if (!GAP_CLASSES[rule.class]) return `a gap rule needs "class", one of: ${Object.keys(GAP_CLASSES).join(', ')} (see \`gap-classes\`)`;
		if (!rule.text || String(rule.text).length < 10) return 'a gap rule needs "text" (one sentence: what goes wrong and with which words)';
		if (rule.slot !== undefined && typeof rule.slot !== 'number') return 'gap "slot" must be a number when given';
		if (rule.units !== undefined && !(Array.isArray(rule.units) && rule.units.every(Number.isInteger))) return 'gap "units" must be an array of unit ids';
		if (rule.class === 'data-tag' && !(rule.units && rule.units.length)) return 'a data-tag gap must list the affected unit ids in "units"';
		return null;
	}
	if (typeof rule.slot !== 'number') return 'slot rules need a numeric "slot"';
	if ((rule.kind === 'anyTags' || rule.kind === 'noTags') && !(Array.isArray(rule.tags) && rule.tags.length)) return `${rule.kind} needs a non-empty "tags" array`;
	if ((rule.kind === 'deny' || rule.kind === 'allow') && !(Array.isArray(rule.ids) && rule.ids.length && rule.ids.every(Number.isInteger))) return `${rule.kind} needs a non-empty "ids" array of unit ids`;
	if (rule.kind === 'sd' && !(rule.key && Array.isArray(rule.values))) return 'sd needs "key" and a "values" array';
	return null;
}

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
	if (dropped.length) console.log('  dropped: ' + dropped.slice(0, flags.all ? dropped.length : 30).map(shortUnit).join(' ') + (dropped.length > 30 && !flags.all ? ` ... ${dropped.length - 30} more (--all)` : ''));
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
			// Pool membership is only the tag filter; the validator rejects some. Show the ones that realize.
			const probe = pool.candidates.slice(0, 60);
			const okUnits = probe.filter(u => realizeWith(t, i, u[D.Id]).ok);
			const sample = okUnits.slice(0, n).map(shortUnit).join(' ');
			const of = probe.length < pool.count ? ` of the first ${probe.length}` : '';
			console.log(`    pool ${pool.count}, ${okUnits.length}${of} realize: ${sample}${okUnits.length > n ? ' ...' : ''}`);
		}
	});
	const tplRules = (t.rules || []).filter(r => typeof r.slot !== 'number');
	tplRules.forEach(r => console.log(`rule: ${JSON.stringify(r)}`));
}

function cmdSlot(id, i, flags) {
	const t = getTpl(id);
	const s = t.slots[i];
	if (!s) throw new Error('no such slot');
	if (flags.open) return cmdSlotOpen(t, i, flags);
	const pool = vg.getSlotCandidates(s).candidates;
	console.log(`${t.id} slot ${i} (${s.originalSurface}, ${s.pos}) tags: ${s.tags.join(', ') || '(none)'}  pool ${pool.length}${isLocked(s) ? '  LOCKED' : ''}`);
	if (flags.check) printRealized(t, i, pool, flags.all ? 0 : 60);
	else (flags.all ? pool : pool.slice(0, 200)).forEach(u => console.log('  ' + fmtUnit(u)));
}

// Every unit of the slot's POS realized with the slot's tags removed: what the validator alone allows.
function cmdSlotOpen(t, i, flags) {
	const open = withSlotTags(t, i, []);
	open.slots[i].rules = [];
	const pool = vg.getSlotCandidates(open.slots[i]).candidates;
	const ok = pool.filter(u => realizeWith(open, i, u[D.Id]).ok);
	const cur = new Set(poolIds(t.slots[i]));
	console.log(`${t.id} slot ${i}: ${ok.length} of ${pool.length} ${t.slots[i].pos} units realize without tag filters (* = in the current pool)`);
	if (!flags['by-tag']) {
		(flags.all ? ok : ok.slice(0, 80)).forEach(u => console.log(`  ${cur.has(u[D.Id]) ? '*' : ' '} ${fmtUnit(u)}`));
		if (!flags.all && ok.length > 80) console.log(`  ... ${ok.length - 80} more (--all)`);
		return;
	}
	const by = {};
	for (const u of ok) for (const tag of unitTags(u)) (by[tag] = by[tag] || []).push(u);
	Object.entries(by).sort((a, b) => b[1].length - a[1].length).slice(0, flags.all ? 999 : 25)
		.forEach(([tag, us]) => console.log(`  ${tag.padEnd(24)} ${String(us.length).padStart(3)}  ${us.slice(0, 10).map(u => (cur.has(u[D.Id]) ? '*' : '') + u[D.Korean]).join(' ')}`));
}

function cmdUnit(ids) {
	for (const x of ids) {
		const u = U(Number(x));
		console.log(u ? `${fmtUnit(u)}  [${u[D.PartofSpeech]}]  tags: ${unitTags(u).join(', ')}` : `no unit ${x}`);
	}
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

const RULE_KINDS = ['anyTags', 'noTags', 'deny', 'allow', 'sd', 'gap'];
function cmdRules(id) {
	const t = getTpl(id);
	if (!t.rules.length) { console.log(`${id}: no rules`); return; }
	t.rules.forEach((r, k) => { const e = validateRule(r); console.log(`${k}: ${JSON.stringify(r)}${e ? '   <- INVALID: ' + e : ''}`); });
}

function cmdRuleAdd(id, json, flags) {
	let rule;
	try { rule = JSON.parse(json); } catch (e) { throw new Error('rule must be JSON: ' + e.message); }
	const err = validateRule(rule);
	if (err) throw new Error(err + '. To document a mechanism that does not exist yet: {"kind":"gap","class":"<gap-classes>","slot":i,"text":"..."}');
	const before = getTpl(id);
	if (typeof rule.slot === 'number' && !before.slots[rule.slot]) throw new Error(`slot ${rule.slot} out of range (template has ${before.slots.length})`);
	const dup = before.rules.find(r => JSON.stringify(r) === JSON.stringify(rule));
	if (dup) throw new Error('the template already has this exact rule');
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

function allGaps() {
	const out = [];
	for (const t of vg.getAllVerifiedSentences()) {
		(t.rules || []).forEach((r, k) => { if (r.kind === 'gap' || !RULE_KINDS.includes(r.kind)) out.push({ t, k, r }); });
	}
	return out;
}

function cmdGaps(flags) {
	const gaps = allGaps();
	if (flags.summary) {
		const by = {};
		for (const { t, r } of gaps) {
			const c = r.kind === 'gap' ? (GAP_CLASSES[r.class] ? r.class : `INVALID(${r.class})`) : `UNKNOWN-KIND(${r.kind})`;
			(by[c] = by[c] || new Set()).add(t.id);
		}
		Object.entries(by).sort((a, b) => b[1].size - a[1].size)
			.forEach(([c, ids]) => console.log(`${String(ids.size).padStart(4)} templates  ${c}`));
		console.log(`(${gaps.length} gap rules)`);
		return;
	}
	let n = 0;
	for (const { t, k, r } of gaps) {
		if (flags.class && r.class !== flags.class) continue;
		n++;
		const head = `${t.id} rule ${k}${typeof r.slot === 'number' ? ' slot ' + r.slot : ''}`;
		console.log(r.kind === 'gap'
			? `${head} [${r.class || 'NO CLASS'}]: ${r.text}${r.units ? '  units ' + r.units.map(x => shortUnit(U(x))).join(' ') : ''}`
			: `${head}: UNKNOWN KIND ${JSON.stringify(r)}`);
		console.log(`    ${sentenceOf(t)}`);
	}
	console.log(`(${n} gaps)`);
}

function cmdGapClasses() {
	for (const [c, d] of Object.entries(GAP_CLASSES)) console.log(`${c.padEnd(16)} ${d}`);
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

// ---------------------------------------------------------------- batches (review ledger)
const LEDGER_PATH = path.join(ROOT, 'data', 'vs_review.json');
const BASELINE_PATH = path.join(ROOT, 'docs', 'vs_tuning_baseline.txt');
const PER_UNIT_PER_PASS = 6;
const today = () => new Date().toISOString().slice(0, 10);

function readLedger() {
	if (!fs.existsSync(LEDGER_PATH)) return { batches: [], reviewed: {} };
	const j = JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf8'));
	return { batches: j.batches || [], reviewed: j.reviewed || {} };
}
function writeLedger(l) { fs.writeFileSync(LEDGER_PATH, JSON.stringify(l, null, '\t') + '\n'); }

const variableSlots = (t) => t.slots.map((s, i) => i).filter(i => !isLocked(t.slots[i]));

/**
 * Review order: templates grouped by their lowest grammar unit id (SUOBI00/01 first). Within a unit the
 * shortest come first, because the game uses a unit's shortest templates first. Each pass takes at most
 * PER_UNIT_PER_PASS templates per unit, so early units do not swallow every batch (은/는 has 126 templates).
 * Templates with no variable slot are skipped: there is nothing to tune.
 */
function reviewOrder() {
	const tpls = vg.getAllVerifiedSentences().filter(t => variableSlots(t).length > 0);
	const groupOf = (t) => (t.grammarUnitIds.length ? Math.min(...t.grammarUnitIds) : 1e9);
	const groups = new Map();
	for (const t of tpls) { const g = groupOf(t); if (!groups.has(g)) groups.set(g, []); groups.get(g).push(t); }
	const keyed = [];
	for (const [g, list] of groups) {
		list.sort((a, b) => a.slots.length - b.slots.length || a.id.localeCompare(b.id, 'en', { numeric: true }));
		list.forEach((t, rank) => keyed.push({ t, pass: Math.floor(rank / PER_UNIT_PER_PASS), g }));
	}
	keyed.sort((a, b) => a.pass - b.pass || a.g - b.g || a.t.slots.length - b.t.slots.length || a.t.id.localeCompare(b.t.id, 'en', { numeric: true }));
	return keyed.map(k => k.t);
}

function openBatch(l) {
	const b = l.batches[l.batches.length - 1];
	return b && b.ids.some(id => !l.reviewed[id]) ? b : null;
}

function printBatch(b, l) {
	const left = b.ids.filter(id => !l.reviewed[id]);
	console.log(`batch ${b.n} (opened ${b.opened}): ${b.ids.length - left.length}/${b.ids.length} reviewed   (pools = variable slot:pool size)`);
	for (const id of left) {
		const t = vg.getVerifiedSentenceById(id);
		if (!t) { console.log(`  ${id}  (MISSING TEMPLATE)`); continue; }
		const g = U(Math.min(...t.grammarUnitIds));
		const pools = variableSlots(t).map(i => `${i}:${vg.getSlotCandidates(t.slots[i]).count}`).join(' ');
		console.log(`  ${id.padEnd(16)} pools ${pools.padEnd(14)} [${g ? g[D.Korean] : '-'}]  ${sentenceOf(t)}`);
	}
	if (!left.length) console.log('  complete: run `batch status`, then hand off (see handoff.md)');
}

function cmdBatch(sub, flags) {
	const l = readLedger();
	if (sub === 'status') return cmdBatchStatus(l);
	const open = openBatch(l);
	if (open) { printBatch(open, l); return; }
	const n = Number(flags.n || 25);
	const inBatch = new Set(l.batches.flatMap(b => b.ids));
	const ids = reviewOrder().filter(t => !l.reviewed[t.id] && !inBatch.has(t.id)).slice(0, n).map(t => t.id);
	if (!ids.length) { console.log('every template with a variable slot has been reviewed'); return; }
	const b = { n: l.batches.length + 1, opened: today(), ids };
	if (flags['dry-run']) { console.log('(dry run: batch not opened)'); printBatch(b, l); return; }
	l.batches.push(b);
	writeLedger(l);
	printBatch(b, l);
}

function cmdDone(id, note, flags) {
	const l = readLedger();
	const b = l.batches.find(x => x.ids.includes(id));
	if (!b) throw new Error(`${id} is not in any batch (run \`batch\` to see the open batch)`);
	if (!note || note.length < 4) throw new Error('done needs a note: what changed ("-food slot 1; gap tense-time") or "kept: already right"');
	if (flags['dry-run']) { console.log('(dry run)'); return; }
	l.reviewed[id] = { batch: b.n, note };
	writeLedger(l);
	const left = b.ids.filter(x => !l.reviewed[x]).length;
	console.log(`${id} reviewed (batch ${b.n}: ${left} left)`);
}

function cmdBatchStatus(l) {
	const b = l.batches[l.batches.length - 1];
	if (b) printBatch(b, l);
	if (!fs.existsSync(BASELINE_PATH)) { console.log('no baseline file (docs/vs_tuning_baseline.txt)'); return; }
	const parse = (txt) => Object.fromEntries(txt.split(/\r?\n/).filter(x => /^[\w.-]+=/.test(x)).map(x => x.split('=')));
	const base = parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
	const now = parse(statsLines(true).join('\n'));
	console.log('changed since baseline:');
	let any = false;
	for (const k of new Set([...Object.keys(base), ...Object.keys(now)])) {
		if (base[k] !== now[k]) { any = true; console.log(`  ${k}: ${base[k] === undefined ? '-' : base[k]} -> ${now[k] === undefined ? '-' : now[k]}`); }
	}
	if (!any) console.log('  (nothing)');
}

// ---------------------------------------------------------------- slot fixtures
// A slot fixture states "template T, slot i, varied alone, must not (expect bad) / must (expect ok) produce
// unit U". Checking it is exact and fast (pool membership + one realization), unlike the sampled flag fixtures.
const goldenPath = () => path.join(ROOT, 'test', 'golden_sentences.json');
function readGolden() { return fs.existsSync(goldenPath()) ? JSON.parse(fs.readFileSync(goldenPath(), 'utf8')) : { fixtures: [] }; }
function writeGolden(j) { fs.writeFileSync(goldenPath(), JSON.stringify(j, null, 2) + '\n'); }
const isSlotFixture = (fx) => typeof fx.templateId === 'string' && typeof fx.slot === 'number' && Number.isInteger(fx.unitId);

/** Does the game produce unit `unitId` in slot `slotIdx` of template `tpl` (the slot varied alone)? */
function slotAdmits(tpl, slotIdx, unitId) {
	const slot = tpl.slots[slotIdx];
	if (!slot) return { admitted: false, ko: '', note: 'no such slot' };
	if (isLocked(slot)) return { admitted: slot.originalUnitId === unitId, ko: sentenceOf(tpl), note: 'locked slot' };
	if (!poolIds(slot).includes(unitId)) {
		const r = realizeWith(tpl, slotIdx, unitId);
		return { admitted: false, ko: r.ok ? r.ko : '', note: 'not in slot pool' };
	}
	const r = realizeWith(tpl, slotIdx, unitId);
	return { admitted: r.ok, ko: r.ko, note: r.ok ? '' : r.note };
}

/** {admitted, satisfied, ko} for a slot fixture against the current data and generator. */
function slotFixtureState(fx) {
	const t = vg.getVerifiedSentenceById(fx.templateId);
	if (!t) return { admitted: false, satisfied: false, ko: '', note: `template ${fx.templateId} missing` };
	const a = slotAdmits(t, fx.slot, fx.unitId);
	return { ...a, satisfied: fx.expect === 'ok' ? a.admitted : !a.admitted };
}

/** The sentence a fixture is about, even when the slot no longer admits the unit: realized with the slot's
 * tags and rules lifted, so a native speaker reads a real sentence, not a placeholder. */
function exampleKo(t, i, unitId) {
	const open = withSlotTags(t, i, []);
	open.slots[i].rules = [];
	const r = realizeWith(open, i, unitId);
	if (r.ok || r.ko) return r.ko;
	const res = vg.generateSentenceFromTemplate(open, { targetUnitId: unitId, targetSlotIndex: i, varyMode: 'selected', unlockedSlots: [i] });
	const m = res && res.message && res.message.match(/in: "([^"]+)"/);
	return m ? m[1] : `(${U(unitId)[D.Korean]} in: ${sentenceOf(t)})`;
}

function cmdFixture(id, i, unitId, expect, reason, flags) {
	const t = getTpl(id);
	if (!t.slots[i]) throw new Error(`slot ${i} out of range`);
	if (!U(unitId)) throw new Error(`no unit ${unitId}`);
	if (expect !== 'bad' && expect !== 'ok') throw new Error('expect must be "bad" or "ok"');
	if (!reason || reason.length < 8) throw new Error('give a reason (why the sentence is wrong / right)');
	const confidence = flags.confidence || 'clear';
	if (!['clear', 'unsure'].includes(confidence)) throw new Error('--confidence must be clear or unsure');
	if (flags['gap-class'] && !GAP_CLASSES[flags['gap-class']]) throw new Error(`unknown gap class (see gap-classes)`);
	const j = readGolden();
	if (j.fixtures.some(fx => isSlotFixture(fx) && fx.templateId === id && fx.slot === i && fx.unitId === unitId)) throw new Error('a fixture for this template/slot/unit exists already');
	const fx = { id: '', templateId: id, slot: i, unitId, expect, ko: '', reason, confidence, status: '' };
	if (flags['gap-class']) fx.gapClass = flags['gap-class'];
	const st = slotFixtureState(fx);
	fx.ko = st.ko || exampleKo(t, i, unitId);
	fx.status = st.satisfied ? 'fixed' : 'open';
	const maxN = j.fixtures.reduce((m, f) => Math.max(m, Number(String(f.id).replace(/\D/g, '')) || 0), 0);
	fx.id = 'g' + String(maxN + 1).padStart(3, '0');
	fx.addedAt = today();
	console.log(`${fx.id} ${expect} ${fx.status}  ${fx.ko}   (${st.admitted ? 'generated today' : 'not generated today'}${st.note ? ': ' + st.note : ''})`);
	if (fx.status === 'open' && !fx.gapClass) console.log('  NOTE: open = the generator violates this today. Fix the slot (tags/rule) or pass --gap-class if no rule can.');
	if (flags['dry-run']) { console.log('(dry run: nothing written)'); return; }
	j.fixtures.push(fx);
	writeGolden(j);
}

function cmdFixtures(flags) {
	if (flags.sync) {
		// open -> fixed only; a fixed fixture that is violated again is a regression and must fail the suite.
		const j = readGolden();
		const flipped = j.fixtures.filter(fx => isSlotFixture(fx) && fx.status === 'open' && slotFixtureState(fx).satisfied);
		flipped.forEach(fx => { fx.status = 'fixed'; fx.fixedAt = today(); console.log(`${fx.id} open -> fixed  ${fx.ko}`); });
		if (flipped.length && !flags['dry-run']) writeGolden(j);
		console.log(`(${flipped.length} fixtures flipped to fixed)`);
		return;
	}
	let list = readGolden().fixtures.filter(isSlotFixture);
	if (flags.unsure) list = list.filter(fx => fx.confidence === 'unsure');
	if (flags.open) list = list.filter(fx => fx.status === 'open');
	if (flags.unsure) return writeReviewList(list);
	for (const fx of list) {
		const u = U(fx.unitId);
		console.log(`${fx.id} ${fx.expect.padEnd(3)} ${fx.status.padEnd(5)} ${fx.confidence.padEnd(6)} ${fx.templateId}[${fx.slot}] ${shortUnit(u)}${fx.gapClass ? ' gap:' + fx.gapClass : ''}  ${fx.ko}  | ${fx.reason}`);
	}
	console.log(`(${list.length} slot fixtures)`);
}

/**
 * The native-speaker review list: numbered sentences with the original template sentence as context, no agent
 * guess (it biases the reviewer), ids in a key at the end. Written as UTF-8 to local/native_review.txt (gitignored:
 * originals are textbook text; a PowerShell pipe would garble Hangul). Record answers: human <gid> right|wrong "note"
 * ("right" = the fixture's expect was correct).
 */
function writeReviewList(list) {
	const lines = [
		`Korean sentence review (${today()}). For each numbered sentence: natural / a bit odd / wrong, and how you would say it.`,
		'Each one swaps one word of a correct textbook sentence (shown in parentheses). Judge the new sentence on its own.',
		'',
	];
	list.forEach((fx, n) => lines.push(`${n + 1}. ${fx.ko}`, `   (original: ${sentenceOf(getTpl(fx.templateId))})`, ''));
	lines.push('key (for recording answers, not for the reviewer): ' + list.map((fx, n) => `${n + 1}=${fx.id}`).join(' '));
	const text = lines.join('\n') + '\n';
	const out = path.resolve(__dirname, '..', 'local', 'native_review.txt');
	fs.mkdirSync(path.dirname(out), { recursive: true });
	fs.writeFileSync(out, text);
	console.log(text + `(${list.length} unsure fixtures -> ${path.relative(process.cwd(), out)})`);
}

function cmdFixtureRm(gid, flags) {
	const j = readGolden();
	const k = j.fixtures.findIndex(f => f.id === gid && isSlotFixture(f));
	if (k < 0) throw new Error(`no slot fixture ${gid}`);
	console.log(`removing ${gid}: ${j.fixtures[k].ko}`);
	if (flags['dry-run']) { console.log('(dry run: nothing written)'); return; }
	j.fixtures.splice(k, 1);
	writeGolden(j);
}

function cmdHuman(gid, verdict, note, flags) {
	if (verdict !== 'right' && verdict !== 'wrong') throw new Error('verdict must be "right" (the agent guessed correctly) or "wrong"');
	const j = readGolden();
	const fx = j.fixtures.find(f => f.id === gid && isSlotFixture(f));
	if (!fx) throw new Error(`no slot fixture ${gid}`);
	if (verdict === 'wrong') fx.expect = fx.expect === 'bad' ? 'ok' : 'bad';
	fx.confidence = 'human';
	fx.human = { verdict, note: note || '', at: today() };
	fx.status = slotFixtureState(fx).satisfied ? 'fixed' : 'open';
	console.log(`${gid}: ${verdict}; now expects ${fx.expect}, status ${fx.status}`);
	if (verdict === 'wrong' && fx.status === 'open') console.log(`  the slot must change so ${fx.templateId}[${fx.slot}] ${fx.expect === 'ok' ? 'admits' : 'excludes'} unit ${fx.unitId}`);
	if (flags['dry-run']) { console.log('(dry run: nothing written)'); return; }
	writeGolden(j);
}

// ---------------------------------------------------------------- stats and evidence
/** Sentences the game can make by varying one slot: every pool unit realized (slow, ~40 s). */
function realizableStats() {
	const earlySources = new Set(['SUOBI00', 'SUOBI01']);
	// slots.lowYield: pool >= 20 but under 20% realize. The game draws from the pool and validates at most 10
	// times, so such a slot mostly fails to vary: give it tags (or an allow list) that match what realizes.
	const out = { 'sentences.oneSlot': 0, 'sentences.oneSlot.early': 0, 'slots.noSentence': 0, 'slots.lowYield': 0 };
	for (const t of vg.getAllVerifiedSentences()) {
		const g = t.grammarUnitIds.length ? U(Math.min(...t.grammarUnitIds)) : null;
		const early = g && earlySources.has(g[D.Source]);
		t.slots.forEach((s, i) => {
			if (isLocked(s)) return;
			const pool = vg.getSlotCandidates(s).candidates;
			const n = pool.filter(u => realizeWith(t, i, u[D.Id]).ok).length;
			if (pool.length >= 20 && n < pool.length * 0.2) out['slots.lowYield']++;
			out['sentences.oneSlot'] += n;
			if (early) out['sentences.oneSlot.early'] += n;
			if (n === 0) out['slots.noSentence']++;
		});
	}
	return out;
}

function statsLines(deep) {
	const tpls = vg.getAllVerifiedSentences();
	const out = {};
	const inc = (k, n = 1) => { out[k] = (out[k] || 0) + n; };
	const pools = [];
	const earlySources = new Set(['SUOBI00', 'SUOBI01']);
	out.templates = tpls.length;
	for (const t of tpls) {
		const g = t.grammarUnitIds.length ? U(Math.min(...t.grammarUnitIds)) : null;
		const early = g && earlySources.has(g[D.Source]);
		if (t.source === 'minimal') inc('templates.minimal');
		t.slots.forEach((s, i) => {
			inc('slots');
			if (rawCustomTags(t.id, i)) inc('slots.customTags');
			if (isLocked(s)) { inc('slots.locked'); return; }
			const n = vg.getSlotCandidates(s).count;
			pools.push(n);
			inc('slots.variable');
			inc(n <= 1 ? 'slots.pool.le1' : n <= 5 ? 'slots.pool.2to5' : n <= 30 ? 'slots.pool.6to30' : 'slots.pool.gt30');
			inc('variants.oneSlot', n);
			if (early) inc('variants.oneSlot.early', n);
		});
		for (const r of t.rules || []) inc(r.kind === 'gap' ? `gaps.${r.class || 'NO_CLASS'}` : `rules.${r.kind}`);
	}
	pools.sort((a, b) => a - b);
	out['slots.pool.median'] = pools.length ? pools[Math.floor(pools.length / 2)] : 0;
	const best = new Map();
	for (const t of tpls) for (const g of t.grammarUnitIds) best.set(g, Math.min(best.get(g) || 99, t.slots.length));
	const gram = UNITS.filter(u => u && u[D.PartofSpeech] === K.POS_GRAMMAR);
	out.grammarUnits = gram.length;
	out['grammarUnits.noTemplate'] = gram.filter(u => !best.has(u[D.Id])).length;
	out['grammarUnits.noTemplateLe3Slots'] = gram.filter(u => !(best.get(u[D.Id]) <= 3)).length;
	const l = readLedger();
	out['review.batches'] = l.batches.length;
	out['review.templates'] = Object.keys(l.reviewed).length;
	const sf = readGolden().fixtures.filter(isSlotFixture);
	out['fixtures.slot'] = sf.length;
	for (const fx of sf) { inc(`fixtures.slot.${fx.status}`); if (fx.confidence === 'unsure') inc('fixtures.slot.unsure'); }
	if (deep) Object.assign(out, realizableStats());
	return Object.keys(out).sort().map(k => `${k}=${out[k]}`);
}

function cmdStats(flags) {
	console.log('# vs_tune.js stats  (variants.oneSlot = sum of variable slot pools; sentences.oneSlot (--deep) = the pool units that realize)');
	statsLines(Boolean(flags.deep)).forEach(x => console.log(x));
}

function cmdEvidence(words) {
	if (!words.length) throw new Error('give one or more Korean strings');
	const file = path.join(ROOT, 'docs', 'kor_sentences.tsv');
	const hits = fs.readFileSync(file, 'utf8').split(/\r?\n/).map(x => x.split('\t')[2]).filter(x => x && words.every(w => x.includes(w)));
	hits.slice(0, 6).forEach(x => console.log('  ' + x));
	console.log(`(${hits.length} Tatoeba sentences contain ${words.map(w => JSON.stringify(w)).join(' + ')}; CC BY, tatoeba.org)`);
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
	const BOOL = new Set(['all', 'check', 'dry-run', 'summary', 'unsure', 'open', 'sync', 'deep', 'by-tag']);
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
	case 'gaps': return cmdGaps(flags);
	case 'gap-classes': return cmdGapClasses();
	case 'coverage': return cmdCoverage(flags);
	case 'stats': return cmdStats(flags);
	case 'unit': return cmdUnit([a, b, ...rest].filter(x => x !== undefined));
	case 'fixture-rm': return cmdFixtureRm(a, flags);
	case 'evidence': return cmdEvidence([a, b, ...rest].filter(x => x !== undefined));
	case 'ingest': return cmdIngest(a, flags);
	case 'batch': return cmdBatch(a, flags);
	case 'done': return cmdDone(a, [b, ...rest].join(' ').trim(), flags);
	case 'fixture': return cmdFixture(a, num(b, 'slot'), num(rest[0], 'unitId'), rest[1], rest.slice(2).join(' ').trim(), flags);
	case 'fixtures': return cmdFixtures(flags);
	case 'human': return cmdHuman(a, b, rest.join(' ').trim(), flags);
	default: console.log(HELP);
	}
}

if (require.main === module) {
	try { main(); } catch (e) { console.error('error: ' + e.message); process.exit(2); }
}

module.exports = {
	splitTop, locateRow, editSlotTags, editRules, rowText, kNameMap,
	GAP_CLASSES, RULE_KINDS, validateRule, exampleKo, reviewOrder, readLedger, isSlotFixture, slotAdmits, slotFixtureState, statsLines
};
