/**
 * flashcards/render.js - pure string helpers for the flashcard UI (no DOM access, unit-testable in Node).
 * Browser global (window.FlashcardRender) or CommonJS.
 */
(function() {
'use strict';

const escapeHtml = s => String(s == null ? '' : s)
	.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * HTML for a generated sentence with every morpheme that belongs to `unitId` wrapped in <mark class="hl">.
 * Built from the sentence's eojeol segments; falls back to plain text when they do not rebuild `item.ko`.
 */
function sentenceHtml(item, unitId) {
	const plain = String((item && item.ko) || '');
	const ejs = (item && Array.isArray(item.eojeols)) ? item.eojeols : [];
	const parts = ejs.map(ej => (ej.segments || []).map(seg => ({ text: seg.textKo || '', hit: seg.unitId === unitId })));
	const rebuilt = parts.map(p => p.map(s => s.text).join('')).join(' ');
	const strip = t => t.replace(/[\s.?!,]/g, '');
	if (!parts.length || strip(rebuilt) !== strip(plain)) return escapeHtml(plain);
	const tail = /[.?!]+$/.exec(plain);
	const body = parts.map(p => {
		let html = '', run = '', runHit = null;
		const flush = () => { if (run) html += runHit ? `<mark class="hl">${escapeHtml(run)}</mark>` : escapeHtml(run); run = ''; };
		for (const seg of p) { if (runHit !== seg.hit) { flush(); runHit = seg.hit; } run += seg.text; }
		flush();
		return html;
	}).join(' ');
	return body + (tail && !rebuilt.endsWith(tail[0]) ? escapeHtml(tail[0]) : '');
}

/** Distinct sorted Source tags of the units with their counts. `units` are raw data.js rows. */
function sourceSummary(units, sourceCol = 7) {
	const counts = new Map();
	for (const u of units) counts.set(u[sourceCol], (counts.get(u[sourceCol]) || 0) + 1);
	return Array.from(counts, ([source, count]) => ({ source, count }));
}

const api = { escapeHtml, sentenceHtml, sourceSummary };
if (typeof window !== 'undefined') window.FlashcardRender = api;
if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
