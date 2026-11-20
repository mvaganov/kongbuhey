'use strict';
/**
 * tools/only_expansion.js - keep `only {ids}` slots from going stale as vocabulary grows.
 *
 * An `only` rule freezes a verified-sentence slot to a word list. When select.js inserts a unit, this finds the
 * `only` slots it could join: same part of speech as the slot's own word, and carrying every tag that all the
 * listed words (plus the slot's own word) share, ignoring validator-only tags. Matches are queued in
 * TODO_check_sentences_for_expansion_options.json at the repo root; review them with
 * `node tools/vs_tune.js expansions` and accept with `node tools/vs_tune.js only-add <id> <i> <unitId>`.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TODO_PATH = path.join(ROOT, 'TODO_check_sentences_for_expansion_options.json');
const VALIDATOR_ONLY_TAGS = new Set(['object_elidable', 'motion_activity']); // mirrors verified_sentence_generator.js (test checks)

const tagsOf = (u, D) => {
	const t = u && u[D.SemanticTags];
	const list = t instanceof Set ? Array.from(t) : (Array.isArray(t) ? t : (typeof t === 'string' ? t.split(/[,\s]+/) : []));
	return list.filter(x => x && !VALIDATOR_ONLY_TAGS.has(x));
};

/** Every slot with an only rule: { templateId, slot, pos, ids (incl. the slot's own word), deny, shared tags }. */
function onlySlots(units, D, rows) {
	const out = [];
	for (const row of rows) {
		const rules = Array.isArray(row[6]) ? row[6] : [];
		for (const r of rules) {
			if (!r || r.kind !== 'only' || !Array.isArray(r.ids) || typeof r.slot !== 'number') continue;
			const slotRow = row[5] && row[5][r.slot];
			const orig = slotRow && units[slotRow[0]];
			if (!orig) continue;
			const ids = [...new Set([slotRow[0], ...r.ids])].filter(id => units[id]);
			let shared = null;
			for (const id of ids) {
				const t = new Set(tagsOf(units[id], D));
				shared = shared === null ? t : new Set([...shared].filter(x => t.has(x)));
			}
			const deny = rules.filter(x => x && x.kind === 'deny' && x.slot === r.slot).flatMap(x => x.ids || []);
			out.push({ templateId: row[0], slot: r.slot, pos: orig[D.PartofSpeech], ids, deny, shared: [...(shared || [])].sort() });
		}
	}
	return out;
}

/** Candidate (unit, only slot) pairs for new units. A slot whose words share no tag matches nothing. */
function findExpansions(newUnits, units, D, rows) {
	const hits = [];
	for (const s of onlySlots(units, D, rows)) {
		if (!s.shared.length) continue;
		for (const u of newUnits) {
			const id = u[D.Id];
			if (u[D.PartofSpeech] !== s.pos || s.ids.includes(id) || s.deny.includes(id)) continue;
			const t = new Set(tagsOf(u, D));
			if (s.shared.every(x => t.has(x))) hits.push({ unitId: id, korean: u[D.Korean], templateId: s.templateId, slot: s.slot, sharedTags: s.shared });
		}
	}
	return hits;
}

function readTodo(file = TODO_PATH) {
	if (!fs.existsSync(file)) return { note: 'New units that may fit an only-list slot. Review: node tools/vs_tune.js expansions', items: [] };
	return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function writeTodo(j, file = TODO_PATH) { fs.writeFileSync(file, JSON.stringify(j, null, 2) + '\n'); }

/** Queue hits (deduplicated); returns how many were new. */
function queueExpansions(hits, file = TODO_PATH) {
	if (!hits.length) return 0;
	const j = readTodo(file);
	const key = (h) => `${h.templateId}|${h.slot}|${h.unitId}`;
	const have = new Set(j.items.map(key));
	const today = new Date().toISOString().slice(0, 10);
	const fresh = hits.filter(h => !have.has(key(h))).map(h => ({ ...h, addedAt: today }));
	if (!fresh.length) return 0;
	j.items.push(...fresh);
	writeTodo(j, file);
	return fresh.length;
}

/** Called by select.js after an insert. Loads the template rows lazily (inserts are rare). */
function afterInsert(newUnits, units, D, options = {}) {
	if (!newUnits.length) return;
	let rows;
	try { rows = require('../data/verified_sentences.js').VERIFIED_SENTENCES || []; } catch (_) { return; }
	const all = units.slice();
	for (const u of newUnits) all[u[D.Id]] = u;
	const hits = findExpansions(newUnits, all, D, rows);
	if (!hits.length) return;
	if (options.dryRun) { console.log(`  [only-list] ${hits.length} slot(s) could take the new unit(s) (dry run: not queued)`); return; }
	const n = queueExpansions(hits, options.expansionTodoPath || TODO_PATH);
	console.log(`  [only-list] ${n} new candidate(s) for only-list slots queued in ${path.basename(options.expansionTodoPath || TODO_PATH)}; review: node tools/vs_tune.js expansions`);
}

module.exports = { TODO_PATH, VALIDATOR_ONLY_TAGS, onlySlots, findExpansions, readTodo, writeTodo, queueExpansions, afterInsert };
