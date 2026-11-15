/**
 * flashcards/render.js - pure string helpers for the flashcard UI (no DOM access, unit-testable in Node).
 * Browser global (window.FlashcardRender) or CommonJS.
 */
(function() {
'use strict';

const escapeHtml = s => String(s == null ? '' : s)
	.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Eojeols of a generated sentence as arrays of { text, en, id } morpheme segments. */
function segmentsOf(item) {
	const ejs = (item && Array.isArray(item.eojeols)) ? item.eojeols : [];
	return ejs.map(ej => (ej.segments || []).map(seg => ({
		text: seg.textKo || '', en: seg.textEn || '', id: typeof seg.unitId === 'number' ? seg.unitId : null
	})));
}

/** Every language unit id a sentence uses. */
function unitIdsOf(item) {
	const ids = new Set([...((item && item.unitIds) || []), ...((item && item.unitsUsed) || [])].filter(n => typeof n === 'number'));
	for (const ej of segmentsOf(item)) for (const s of ej) if (s.id !== null) ids.add(s.id);
	return Array.from(ids);
}

/**
 * HTML for a generated sentence: the morphemes of `unitId` in <mark class="hl">, every other known unit as an
 * underlined link (<a data-unit>). Falls back to plain text when the segments do not rebuild `item.ko`.
 */
function sentenceHtml(item, unitId) {
	const plain = String((item && item.ko) || '');
	const parts = segmentsOf(item);
	const rebuilt = parts.map(p => p.map(s => s.text).join('')).join(' ');
	const strip = t => t.replace(/[\s.?!,]/g, '');
	if (!parts.length || strip(rebuilt) !== strip(plain)) return escapeHtml(plain);
	const tail = /[.?!]+$/.exec(plain);
	let k = 0;
	const body = parts.map(p => {
		let html = '';
		for (let i = 0; i < p.length;) {
			const seg = p[i];
			if (!seg.text) { i++; continue; }
			if (seg.id === unitId) {
				let run = '';
				while (i < p.length && p[i].id === unitId) run += p[i++].text;
				html += `<mark class="hl">${escapeHtml(run)}</mark>`;
				continue;
			}
			html += seg.id !== null
				? `<a href="#" class="ul ul${k++ % 2}" data-unit="${seg.id}">${escapeHtml(seg.text)}</a>`
				: escapeHtml(seg.text);
			i++;
		}
		return html;
	}).join(' ');
	return body + (tail && !rebuilt.endsWith(tail[0]) ? escapeHtml(tail[0]) : '');
}

/** Morpheme-by-morpheme breakdown: one chip per segment with its Korean and literal English. */
function breakdownHtml(item, unitId) {
	return segmentsOf(item).map(p => '<span class="ej">' + p.filter(s => s.text).map(s => {
		const inner = `<b>${escapeHtml(s.text)}</b>${s.en ? `<small>${escapeHtml(s.en)}</small>` : ''}`;
		if (s.id === unitId) return `<span class="part hl">${inner}</span>`;
		return s.id !== null ? `<a href="#" class="part" data-unit="${s.id}">${inner}</a>` : `<span class="part">${inner}</span>`;
	}).join('') + '</span>').join('');
}

/** "never", "now", "5m", "3h", "2d" since a unix-seconds timestamp. */
function ago(ts, now = Math.floor(Date.now() / 1000)) {
	if (!ts) return 'never';
	const d = Math.max(0, now - ts);
	if (d < 60) return 'now';
	if (d < 3600) return `${Math.floor(d / 60)}m`;
	if (d < 86400) return `${Math.floor(d / 3600)}h`;
	return `${Math.floor(d / 86400)}d`;
}

const api = { escapeHtml, segmentsOf, unitIdsOf, sentenceHtml, breakdownHtml, ago };
if (typeof window !== 'undefined') window.FlashcardRender = api;
if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
