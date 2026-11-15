/**
 * shared/unit_card.js - the read-only "language unit details" card (ID/POS/Source pills, Korean, English,
 * conjugation + honorific rules, notes) and a popup that shows it. Browser global or CommonJS (HTML builder only).
 * Used by the Unit Selector details pane and by popups in other views.
 */
(function() {
'use strict';

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function renderNotes(notes) {
	if (typeof window !== 'undefined' && typeof window.renderMarkdownWithHtml === 'function') return window.renderMarkdownWithHtml(notes);
	if (typeof require === 'function') return require('./markdown.js').renderMarkdownWithHtml(notes);
	return esc(notes);
}

/** info: { id, ko, en, pos, src, conj, honorific, notes } -> HTML string of the card body. */
function unitCoreViewHtml(info) {
	const conj = Array.isArray(info.conj) ? info.conj.join(', ') : String(info.conj == null ? '' : info.conj);
	const honorific = String(info.honorific == null ? '' : info.honorific);
	const notes = String(info.notes == null ? '' : info.notes);
	let html = `<div class="details-meta-pills"><span class="details-pill">ID #${esc(info.id)}</span><span class="details-pill">${esc(info.pos)}</span><span class="details-pill">${esc(info.src)}</span></div>
		<h2 class="details-korean-heading">${esc(info.ko)}</h2>
		<div class="details-english-definition">${esc(info.en)}</div>`;
	if (conj.trim() || honorific.trim()) {
		html += '<div class="details-grammar-box">'
			+ (conj.trim() ? `<div><span class="details-field-label">Conjugation / Grammar Rules:</span> <code>${esc(conj)}</code></div>` : '')
			+ (honorific.trim() ? `<div><span class="details-field-label">Honorifics:</span> ${esc(honorific)}</div>` : '')
			+ '</div>';
	}
	if (notes.trim()) {
		html += `<div class="details-notes-box"><div class="details-field-label">Notes</div><div class="details-markdown-body">${renderNotes(notes)}</div></div>`;
	}
	return html;
}

/** Shows the card in a dismissable popup (click outside, ✕ or Escape closes it). */
function openUnitPopup(info) {
	if (typeof document === 'undefined') return null;
	const backdrop = document.createElement('div');
	backdrop.className = 'modal-backdrop unit-popup';
	backdrop.setAttribute('role', 'dialog');
	backdrop.setAttribute('aria-modal', 'true');
	backdrop.innerHTML = `<div class="modal-card"><div class="modal-header"><h2>Language Unit</h2>
		<button type="button" class="modal-close-btn" aria-label="Close">×</button></div>
		<div class="modal-body unit-core-section">${unitCoreViewHtml(info)}</div></div>`;
	const close = () => { document.removeEventListener('keydown', onKey); backdrop.remove(); };
	const onKey = e => { if (e.key === 'Escape') close(); };
	backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
	backdrop.querySelector('.modal-close-btn').addEventListener('click', close);
	document.addEventListener('keydown', onKey);
	document.body.appendChild(backdrop);
	return backdrop;
}

if (typeof window !== 'undefined') { window.unitCoreViewHtml = unitCoreViewHtml; window.openUnitPopup = openUnitPopup; }
if (typeof module !== 'undefined' && module.exports) module.exports = { unitCoreViewHtml, openUnitPopup };
})();
