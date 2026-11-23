/**
 * fc2/store.js - pure helpers for keeping fc2 progress safe across page reloads (browser global FC2Store, or CommonJS for tests).
 * Unit progress lives in the unit database (so the spreadsheet can show it) AND in a localStorage mirror: if the database is unavailable,
 * blocked or slow to flush, a reload still finds the progress. The session (combo, round, learning queue) is saved too.
 */
(function() {
'use strict';

/** prog: Map id -> { score, tier, lastCorrect, lastSeen }  ->  { id: [score, tier, lastCorrect, lastSeen] } */
function packProg(prog) {
	const out = {};
	for (const [id, u] of prog) out[id] = [u.score, u.tier, u.lastCorrect, u.lastSeen];
	return out;
}

const stamp = u => Math.max(u.lastSeen || 0, u.lastCorrect || 0);

/**
 * Merge database progress with the mirror. The mirror wins a unit only when strictly newer (its latest timestamp is greater), so a score
 * edited by hand in the spreadsheet (no new timestamp) is not overwritten, EXCEPT for ids in preferMirror (database records missing their
 * progress columns, left by an old bulk-save bug where only the last cell of a unit was kept). Returns { prog: Map, healed: ids the database should be rewritten for }.
 */
function mergeProg(dbProg, mirror, validId = () => true, preferMirror = new Set()) {
	const prog = new Map(dbProg), healed = [];
	for (const [k, a] of Object.entries(mirror || {})) {
		const id = Number(k);
		if (!Array.isArray(a) || !validId(id)) continue;
		const m = { score: Number(a[0]) || 0, tier: Number(a[1]) || 0, lastCorrect: Number(a[2]) || 0, lastSeen: Number(a[3]) || 0 };
		const d = prog.get(id);
		if (!d || preferMirror.has(id) || stamp(m) > stamp(d)) { prog.set(id, m); healed.push(id); }   // preferMirror: the database record lacks progress columns (damaged)
	}
	return { prog, healed };
}

/** Summary of a packed progress object: how much real progress it holds (used to rank recovery sources and pin the richest snapshot). */
function progStats(packed) {
	const st = { units: 0, scored: 0, established: 0, stars: 0, latest: 0 };
	for (const a of Object.values(packed || {})) {
		if (!Array.isArray(a)) continue;
		st.units++;
		if ((Number(a[0]) || 0) > 0) st.scored++;
		if ((Number(a[0]) || 0) >= 3) st.established++;
		st.stars += Number(a[1]) || 0;
		st.latest = Math.max(st.latest, Number(a[2]) || 0, Number(a[3]) || 0);
	}
	return st;
}

const rankOf = u => [u.tier || 0, u.score || 0, stamp(u)];
const isBetter = (a, b) => { const x = rankOf(a), y = rankOf(b); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i]; return false; };
const unpack = a => ({ score: Number(a[0]) || 0, tier: Number(a[1]) || 0, lastCorrect: Number(a[2]) || 0, lastSeen: Number(a[3]) || 0 });

/**
 * Merged duplicate units (aliases, tools/merge_units.js) hand their saved state to the canonical unit: progress (the more advanced copy wins,
 * as in bestOf), the localStorage mirror, the owned list (order kept, no repeats) and notes (appended when both have text).
 * alias: Map aliasId -> canonicalId. Mutates nothing; returns { prog, mirror, owned, notes, moved: canonical ids whose progress changed }.
 */
function foldAliases(state, alias) {
	const prog = new Map(state.prog || []), mirror = { ...(state.mirror || {}) }, notes = { ...(state.notes || {}) }, moved = [];
	if (!alias || !alias.size) return { prog, mirror, owned: (state.owned || []).slice(), notes, moved };
	for (const [a, c] of alias) {
		if (prog.has(a)) {
			const m = prog.get(a), cur = prog.get(c);
			prog.delete(a);
			if (!cur || isBetter(m, cur)) { prog.set(c, m); moved.push(c); }
		}
		if (Array.isArray(mirror[a])) {
			const cur = mirror[c];
			if (!Array.isArray(cur) || isBetter(unpack(mirror[a]), unpack(cur))) mirror[c] = mirror[a];
			delete mirror[a];
		}
		if (notes[a]) { notes[c] = notes[c] ? `${notes[c]}\n\n${notes[a]}` : notes[a]; delete notes[a]; }
	}
	const owned = [], seen = new Set();
	for (const id of (state.owned || [])) { const to = alias.has(id) ? alias.get(id) : id; if (!seen.has(to)) { seen.add(to); owned.push(to); } }
	return { prog, mirror, owned, notes, moved };
}

/** Recovery merge: per unit keep the more advanced copy (higher star, then score, then newer). Returns { prog: Map, changed: ids that differ from `prog` }. */
function bestOf(prog, packed, validId = () => true) {
	const out = new Map(prog), changed = [];
	const rank = u => [u.tier || 0, u.score || 0, stamp(u)];
	const better = (a, b) => { const x = rank(a), y = rank(b); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i]; return false; };
	for (const [k, a] of Object.entries(packed || {})) {
		const id = Number(k);
		if (!Array.isArray(a) || !validId(id)) continue;
		const m = { score: Number(a[0]) || 0, tier: Number(a[1]) || 0, lastCorrect: Number(a[2]) || 0, lastSeen: Number(a[3]) || 0 };
		const cur = out.get(id);
		if (!cur || better(m, cur)) { out.set(id, m); changed.push(id); }
	}
	return { prog: out, changed };
}

/**
 * Rolling safety copies of the packed progress: a new one at most every minGapSec, newest `keep` retained, and the richest one ever taken
 * (most scored units) is always kept, so a later blank or damaged save can never push the last good copy out.
 */
function addSnapshot(snaps, packed, now, { minGapSec = 1800, keep = 6 } = {}) {
	const list = Array.isArray(snaps) ? snaps.filter(x => x && x.packed) : [];
	const last = list[list.length - 1], st = progStats(packed);
	if (!st.units || (last && (now - last.at < minGapSec || JSON.stringify(last.packed) === JSON.stringify(packed)))) return list;
	list.push({ at: now, packed });
	const rich = list.reduce((b, x) => (progStats(x.packed).scored >= progStats(b.packed).scored ? x : b), list[0]);
	const recent = list.slice(-keep);
	return recent.includes(rich) ? recent : [rich, ...recent.slice(1)];
}

/** Session snapshot: combo, round progress and the learning queue. */
function packSession(s, now) {
	return { n: s.n, combo: s.combo, round: s.round, due: [...s.due], last: s.last, savedAt: now };
}
/** Returns the fields to restore, or null when there is no snapshot or it is older than maxAge seconds. */
function unpackSession(raw, now, maxAge) {
	if (!raw || typeof raw !== 'object' || !raw.savedAt || now - raw.savedAt > maxAge) return null;
	return { n: Number(raw.n) || 0, combo: Number(raw.combo) || 0, round: raw.round || undefined, due: new Map(Array.isArray(raw.due) ? raw.due : []), last: raw.last ?? null };
}

// ---------- Backup file (Menu > Backup / restore) ----------
// The ONE place that knows the backup format: app.js builds and restores it with these, tools/save_inspect.js reads saves with them.
// Change the format here (and bump BACKUP_VERSION, keeping unpackBackup able to read older versions).
const BACKUP_APP = 'kongbuhey-fc2';
const BACKUP_VERSION = 1;
/**
 * Fields of a backup (version 1):
 *   app      'kongbuhey-fc2'
 *   version  1
 *   game     the game state (fc2/game.js blankGame): coins, xp, level, owned (unlocked unit ids, in unlock order),
 *            h (id -> harvests toward the next star), up (upgrade levels), pulls, streak, cos (cosmetics), totals, seals,
 *            starsBanked, ascensions, quests, vq ("time to use it" queue of verified template ids, front = longest unused)
 *   opts     options (app.js DEFAULT_OPTS): onlyOwned (examples from unlocked units only), count (examples per card), speak,
 *            names ({ off: unit ids switched off, custom: [{ ko, en }] } personal names, Menu > Names),
 *            reverse, sound, haptics, audioTrials
 *   units    id -> [RecognitionScore, star tier, TimeStampLastCorrect, TimeStampLastSeen] for the unlocked units (epoch seconds)
 *   notes    id -> markdown notes
 *   flags    (older backups only) flagged sentences
 */
const BACKUP_FIELDS = ['app', 'version', 'game', 'opts', 'units', 'notes'];

/** { game, opts, prog: Map id -> {score, tier, lastCorrect, lastSeen}, notes } -> backup JSON text. Only the owned units' progress is written. */
function packBackup({ game, opts, prog, notes }) {
	const units = {};
	for (const id of game.owned || []) { const u = prog.get(id); if (u) units[id] = [u.score, u.tier, u.lastCorrect, u.lastSeen]; }
	return JSON.stringify({ app: BACKUP_APP, version: BACKUP_VERSION, game, opts, units, notes: notes || {} });
}

/** Backup JSON text (or a parsed object) -> { version, game, opts, prog: Map, notes, flags|null }. Throws on anything that is not an fc2 backup. */
function unpackBackup(textOrObj) {
	const data = typeof textOrObj === 'string' ? JSON.parse(textOrObj) : textOrObj;
	if (!data || data.app !== BACKUP_APP || !data.game) throw new Error('Not an fc2 backup');
	const prog = new Map();
	for (const [k, a] of Object.entries(data.units || {})) {
		if (!Array.isArray(a)) continue;
		prog.set(Number(k), { score: Number(a[0]) || 0, tier: Number(a[1]) || 0, lastCorrect: Number(a[2]) || 0, lastSeen: Number(a[3]) || 0 });
	}
	return { version: Number(data.version) || 1, game: data.game, opts: data.opts || {}, prog, notes: data.notes || {}, flags: Array.isArray(data.flags) ? data.flags : null };
}

const api = { packProg, mergeProg, progStats, bestOf, foldAliases, addSnapshot, packSession, unpackSession, BACKUP_APP, BACKUP_VERSION, BACKUP_FIELDS, packBackup, unpackBackup };
if (typeof window !== 'undefined') window.FC2Store = api;
if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
