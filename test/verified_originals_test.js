#!/usr/bin/env node
/**
 * Content hygiene: textbook-derived sentence text must not live in tracked files.
 * It belongs in gitignored local/verified_originals.js (see korean/generation/verified_originals.js).
 * Everything here also passes on a fresh clone, where the local files do not exist.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const { isOpenLicensedSource } = require('../korean/generation/verified_originals.js');
const { VERIFIED_SENTENCES, VERIFIED_TEMPLATE_SCHEMA: T } = require('../verified_sentences.js');
const textAnalyzer = require('../text_analyzer.js');

let passed = 0;
let failed = 0;
function assert(cond, msg) {
	if (cond) { passed++; console.log(`  [PASS] ${msg}`); } else { failed++; console.error(`  [FAIL] ${msg}`); }
}

console.log('======================================================');
console.log('       CONTENT HYGIENE (textbook text stays local)    ');
console.log('======================================================');

assert(isOpenLicensedSource('tatoeba') && isOpenLicensedSource('Tatoeba'), 'Tatoeba is an open-licensed source (text may stay inline)');
assert(!isOpenLicensedSource('krx1') && !isOpenLicensedSource('class2011') && !isOpenLicensedSource(''), 'course sources are private by default');

const privateRows = VERIFIED_SENTENCES.filter(r => !isOpenLicensedSource(r[T.Source]));
assert(privateRows.length > 0 && privateRows.every(r => r[T.OriginalKo] === ''), `all ${privateRows.length} private-source templates have blank OriginalKo`);
assert(privateRows.every(r => /^\[[^\]]*\]$/.test(r[T.Title]) || r[T.Title] === r[T.Id]), 'private-source titles are label-only (no sentence text)');

// Writer: must keep the CLI/K import, blank private text, and keep the real overlay untouched when given another path.
const realOverlay = path.join(ROOT, 'local', 'verified_originals.js');
const overlayBefore = fs.existsSync(realOverlay) ? fs.statSync(realOverlay).mtimeMs : null;
const tmpDir = null;
const tmpFile = path.join(ROOT, '_hygiene_tmp_verified_sentences.js'); // inside ROOT so relative requires resolve
try {
	fs.copyFileSync(path.join(ROOT, 'verified_sentences.js'), tmpFile);
	const templates = textAnalyzer.loadVerifiedSentencesFromFile(tmpFile);
	textAnalyzer.writeVerifiedSentencesToFile(templates, tmpFile);
	const out = fs.readFileSync(tmpFile, 'utf8');
	assert(out.includes('function printHelp') && out.includes('var { K }'), 'writer preserves the CLI and K import (replaces only the data block)');
	const reloaded = require(tmpFile).VERIFIED_SENTENCES;
	assert(reloaded.length === VERIFIED_VALID_COUNT(templates) && reloaded.every(r => r[T.OriginalKo] === ''), 'writer output has blank OriginalKo for private templates');
	const overlayAfter = fs.existsSync(realOverlay) ? fs.statSync(realOverlay).mtimeMs : null;
	assert(overlayBefore === overlayAfter, 'writing to a custom path never touches the real local/ overlay');
	if (overlayBefore !== null) {
		const tmpOverlay = tmpFile + '.originals.js';
		const a = require(realOverlay);
		const b = fs.existsSync(tmpOverlay) ? require(tmpOverlay) : {};
		assert(Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(k => a[k].ko === b[k].ko && a[k].title === b[k].title),
			'writer reproduces the local overlay exactly (no text lost or altered)');
	}
} finally {
	fs.rmSync(tmpFile, { force: true }); fs.rmSync(tmpFile + '.originals.js', { force: true });
}
function VERIFIED_VALID_COUNT(t) { return t.length; }

// Leak guard (only possible where the author has studytexts.js): no tracked file may contain a study-text sentence.
// Known leaks with a ceiling: the count may shrink, never grow.
const KNOWN_LEAKS = {
	'korean/generation/verified_sentence_generator.js': 99, // one textbook phrase in a literal; see handoff.md
	'verified_sentences.js': 1 // vs_231 slot Surface holds one multi-word clause fragment
};
const studyPath = path.join(ROOT, 'studytexts.js');
let tracked = null;
try { tracked = cp.execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean); } catch (_) { tracked = null; }
if (!fs.existsSync(studyPath) || !tracked) {
	console.log('  [SKIP] leak scan (needs local studytexts.js and git)');
} else {
	const hangul = /[가-힣]/g;
	const sentences = new Set();
	for (const v of Object.values(require(studyPath))) {
		if (typeof v !== 'string') continue;
		for (const s of v.split(/[.!?\n]+/).map(x => x.trim().replace(/\s+/g, ' '))) if ((s.match(hangul) || []).length >= 8) sentences.add(s);
	}
	const leaks = [];
	for (const f of tracked) {
		if (/^(node_modules|\.claude|docs\/kor_sentences|package-lock|studytexts)/.test(f) || !/\.(js|json|md|html|txt|tsv|css)$/.test(f)) continue;
		let text;
		try { text = fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\s+/g, ' '); } catch (_) { continue; }
		let n = 0;
		for (const s of sentences) if (text.includes(s)) n++;
		if (n > (KNOWN_LEAKS[f] || 0)) leaks.push(`${f} (${n})`);
	}
	assert(leaks.length === 0, `no tracked file contains a textbook sentence (${sentences.size} checked)${leaks.length ? ': ' + leaks.join(', ') : ''}`);
}

console.log(`\nTOTAL: ${passed + failed}  PASSED: ${passed}  FAILED: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
