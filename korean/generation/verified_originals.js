(function() {
/**
 * korean/generation/verified_originals.js
 *
 * Private-content overlay for Verified Sentence templates.
 *
 * Textbook-derived sentences (a template's OriginalKo and the sentence text in its Title) must not live in
 * tracked files. They are kept in `local/verified_originals.js` (gitignored), keyed by template id:
 *   { "vs_363": { "ko": "<original sentence>", "title": "[krx1 #1] <original sentence>" }, ... }
 * Hydration merges the overlay back in when the file exists; a fresh clone simply gets blank originals
 * and label-only titles.
 *
 * Open-licensed sources (e.g. Tatoeba, CC BY) are the exception: their text stays inline in
 * verified_sentences.js, with attribution shown in the app's Credits.
 *
 * Browser: `<script src="../local/verified_originals.js">` sets window.VERIFIED_ORIGINALS (optional file).
 * Node: the same file is require()d.
 */

const OPEN_LICENSED_SOURCES = new Set(['tatoeba']);

function isOpenLicensedSource(source) {
	return OPEN_LICENSED_SOURCES.has(String(source || '').toLowerCase());
}

let cachedOriginals = null;

function resetVerifiedOriginalsCache() {
	cachedOriginals = null;
	if (typeof require !== 'undefined') {
		try { delete require.cache[require.resolve('../../local/verified_originals.js')]; } catch (_) {}
	}
}

function getVerifiedOriginals() {
	if (cachedOriginals) return cachedOriginals;
	let data = null;
	if (typeof window !== 'undefined' && window.VERIFIED_ORIGINALS) {
		data = window.VERIFIED_ORIGINALS;
	} else if (typeof require !== 'undefined') {
		try { data = require('../../local/verified_originals.js'); } catch (_) { data = null; }
	}
	cachedOriginals = (data && typeof data === 'object') ? data : {};
	return cachedOriginals;
}

const verifiedOriginalsExports = {
	OPEN_LICENSED_SOURCES,
	isOpenLicensedSource,
	getVerifiedOriginals,
	resetVerifiedOriginalsCache
};

if (typeof window !== 'undefined') {
	Object.assign(window, verifiedOriginalsExports);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = verifiedOriginalsExports;
}
})();
