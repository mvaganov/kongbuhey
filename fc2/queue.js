/**
 * fc2/queue.js - the "time to use it" queue for verified sentence templates (browser global FC2Queue, or CommonJS for tests).
 * One ordered list of template ids, FRONT = longest since it was used. A template that has never been used is ahead of every used one.
 * All functions are pure: they take the stored list and the ids that exist now, and return a new normalized list.
 */
(function() {
'use strict';

/** Stored list + every existing id -> full list. Ids never seen go to the front (in the given order); ids that no longer exist are dropped. */
function normalize(queue, ids) {
	const exist = new Set(ids), seen = new Set(), kept = [];
	for (const id of Array.isArray(queue) ? queue : []) if (exist.has(id) && !seen.has(id)) { seen.add(id); kept.push(id); }
	return [...ids.filter(id => !seen.has(id)), ...kept];
}

/** Move one id to the back (it was just used). Unknown ids are ignored. */
function toBack(queue, ids, id) {
	const q = normalize(queue, ids);
	const i = q.indexOf(id);
	if (i < 0) return q;
	q.splice(i, 1); q.push(id);
	return q;
}

function toFront(queue, ids, id) {
	const q = normalize(queue, ids);
	const i = q.indexOf(id);
	if (i < 0) return q;
	q.splice(i, 1); q.unshift(id);
	return q;
}

/** Put `id` directly before `refId` (or after it when after is true). A missing refId leaves the order unchanged. */
function moveNear(queue, ids, id, refId, after = false) {
	const q = normalize(queue, ids);
	if (id === refId || q.indexOf(id) < 0 || q.indexOf(refId) < 0) return q;
	q.splice(q.indexOf(id), 1);
	q.splice(q.indexOf(refId) + (after ? 1 : 0), 0, id);
	return q;
}

/** id -> position (0 = front). */
function rankMap(queue, ids) {
	const m = new Map();
	normalize(queue, ids).forEach((id, i) => m.set(id, i));
	return m;
}

const api = { normalize, toBack, toFront, moveNear, rankMap };
if (typeof window !== 'undefined') window.FC2Queue = api;
if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
