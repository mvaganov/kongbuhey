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
 * edited by hand in the spreadsheet (no new timestamp) is not overwritten. Returns { prog: Map, healed: ids the database should be rewritten for }.
 */
function mergeProg(dbProg, mirror, validId = () => true) {
	const prog = new Map(dbProg), healed = [];
	for (const [k, a] of Object.entries(mirror || {})) {
		const id = Number(k);
		if (!Array.isArray(a) || !validId(id)) continue;
		const m = { score: Number(a[0]) || 0, tier: Number(a[1]) || 0, lastCorrect: Number(a[2]) || 0, lastSeen: Number(a[3]) || 0 };
		const d = prog.get(id);
		if (!d || stamp(m) > stamp(d)) { prog.set(id, m); healed.push(id); }
	}
	return { prog, healed };
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

const api = { packProg, mergeProg, packSession, unpackSession };
if (typeof window !== 'undefined') window.FC2Store = api;
if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
