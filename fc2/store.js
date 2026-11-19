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

const api = { packProg, mergeProg, progStats, bestOf, addSnapshot, packSession, unpackSession };
if (typeof window !== 'undefined') window.FC2Store = api;
if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
