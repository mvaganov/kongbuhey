#!/usr/bin/env node
'use strict';
if (typeof require === 'function' && typeof module !== 'undefined' && require.main === module) require('./exit_log.js').watch('tools/tatoeba_prefilter.js'); // failed runs -> test.js report
require('./cli_help.js').exitWithHeaderHelp(__filename);
/**
 * Stage A+B of docs/tatoeba_selection_plan.md. Deterministic, no LLM.
 *   A: script prefilter on docs/kor_sentences.tsv  -> local/tatoeba_stageA.tsv, local/tatoeba_dropped.tsv
 *   B: passage-analyzer bucketing (unknown-unit count) -> local/tatoeba_stageB.tsv
 * Usage: node tools/tatoeba_prefilter.js [--stage A|B|all] [--limit N] [--max-unknown 1]
 * Outputs go to gitignored local/. Nothing here touches data.js.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const IN = path.join(ROOT, 'docs', 'kor_sentences.tsv');
const OUT = path.join(ROOT, 'local');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const stage = opt('--stage', 'all');
const limit = parseInt(opt('--limit', '0'), 10);
const maxUnknown = parseInt(opt('--max-unknown', '1'), 10);

const HANGUL = /[가-힣]/g;
// Frequent Tatoeba names (transliterated Tom/Mary/John...). Names add nothing to the lexicon.
const NAMES = /(톰|메리|메어리|존|앨리스|켄|다나카|스미스|보브|제인|마이크|수잔|사라|리사|조지|데이비드|토니|캐시|마리아|피터|폴|제임스|켈리|윌리엄|리처드|로버트|에밀리|사무엘|사미|레일라)(은|는|이|가|을|를|의|도|와|과|에게|한테|씨)?(\s|$|[,.?!])/;
// Common spelling/spacing errors in user-contributed Korean (see docs: 올께요 is the canonical example).
const BAD = [/[ㄱ-ㅎㅏ-ㅣ]/, /께요|할께|갈께|올께|줄께|볼께/, /됬|됫/, /몇일/, /않돼|안되요|않되요/, /웬지|어떻게든지|바램|금새|왠만|역활|희안/, /\.{2,}|!{2,}|\?{2,}|~/, /["“”'‘’()\[\]{}<>]/];

function stageA() {
  const rows = fs.readFileSync(IN, 'utf8').split('\n').filter(Boolean).map(l => l.split('\t'));
  const seen = new Set();
  const kept = [];
  const dropped = {};
  const drop = (reason, r) => { (dropped[reason] = dropped[reason] || []).push(r); };
  for (const r of rows) {
    const [id, , text0] = r;
    const text = (text0 || '').trim().replace(/\s+/g, ' ');
    const syl = (text.match(HANGUL) || []).length;
    if (syl < 5 || syl > 20) { drop('length', r); continue; }
    if (/[A-Za-z]/.test(text)) { drop('latin', r); continue; }
    if (/\d/.test(text)) { drop('digit', r); continue; }
    if (!/[.?!]$/.test(text)) { drop('no-final-punct', r); continue; }
    if (BAD.some(re => re.test(text))) { drop('bad-pattern', r); continue; }
    if (NAMES.test(text)) { drop('name', r); continue; }
    const key = text.replace(/[\s.?!,]/g, '');
    if (seen.has(key)) { drop('duplicate', r); continue; }
    seen.add(key);
    kept.push([id, text]);
  }
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'tatoeba_stageA.tsv'), kept.map(r => r.join('\t')).join('\n') + '\n');
  fs.writeFileSync(path.join(OUT, 'tatoeba_dropped.tsv'),
    Object.entries(dropped).flatMap(([why, rs]) => rs.map(r => `${r[0]}\t${why}\t${r[2]}`)).join('\n') + '\n');
  console.log(`Stage A: ${rows.length} in, ${kept.length} kept`);
  for (const [why, rs] of Object.entries(dropped)) console.log(`  dropped ${String(rs.length).padStart(5)}  ${why}`);
  return kept;
}

function stageB(kept) {
  const analyzer = require('../korean/analyzer/index.js');
  const todo = limit ? kept.slice(0, limit) : kept;
  const out = [];
  const buckets = {};
  const t0 = Date.now();
  for (const [id, text] of todo) {
    let unknown = [];
    try {
      const r = analyzer.analyzePassage(text, 't' + id);
      unknown = [...r.missingVocab.map(m => m.text), ...r.missingGrammar.map(m => m.text)];
    } catch (e) { unknown = ['<analyzer-error>']; }
    const n = unknown.length;
    buckets[n] = (buckets[n] || 0) + 1;
    if (n <= maxUnknown) out.push([id, text, n, unknown.join(',')]);
  }
  fs.writeFileSync(path.join(OUT, 'tatoeba_stageB.tsv'), out.map(r => r.join('\t')).join('\n') + '\n');
  console.log(`Stage B: analyzed ${todo.length} in ${((Date.now() - t0) / 1000).toFixed(0)}s; kept ${out.length} with <= ${maxUnknown} unknown`);
  console.log('  unknown-count histogram:', JSON.stringify(buckets));
}

let kept;
if (stage === 'A' || stage === 'all') kept = stageA();
else kept = fs.readFileSync(path.join(OUT, 'tatoeba_stageA.tsv'), 'utf8').split('\n').filter(Boolean).map(l => l.split('\t'));
if (stage === 'B' || stage === 'all') stageB(kept);

// ---- Stage B2: diversity-capped candidate selection (deterministic) ----
if (stage === 'select' || stage === 'all') {
  const target = parseInt(opt('--target', '700'), 10);
  const capEnding = parseInt(opt('--cap-ending', '6'), 10);
  const capUnknown = parseInt(opt('--cap-unknown', '3'), 10);
  const rows = fs.readFileSync(path.join(OUT, 'tatoeba_stageB.tsv'), 'utf8').split('\n').filter(Boolean).map(l => l.split('\t'));
  const hash = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
  const bad = u => !u || /<analyzer-error>/.test(u) || /^(톰|메리|존|보스턴|프랑스어|영어|일본어|중국어|도쿄|파리)/.test(u) || /(입다|있다)$/.test(u) && false;
  const ok = rows.filter(r => r[2] === '0' || !bad(r[3]));
  ok.sort((a, b) => hash(a[0]) - hash(b[0])); // seeded-by-id shuffle
  const perEnding = {}, perUnknown = {}, pick = [];
  // i+1 first (best learning value) up to 60% of target, then fill with i+0
  const pass = (want, filterFn) => {
    for (const r of ok) {
      if (pick.length >= want) break;
      if (!filterFn(r) || pick.includes(r)) continue;
      const syl = (r[1].match(HANGUL) || []).length;
      if (syl < 6 || syl > 16) continue;
      const end = r[1].replace(/[.?!]$/, '').slice(-2);
      if ((perEnding[end] || 0) >= capEnding) continue;
      if (r[2] === '1' && (perUnknown[r[3]] || 0) >= capUnknown) continue;
      perEnding[end] = (perEnding[end] || 0) + 1;
      if (r[2] === '1') perUnknown[r[3]] = (perUnknown[r[3]] || 0) + 1;
      pick.push(r);
    }
  };
  pass(Math.round(target * 0.6), r => r[2] === '1');
  pass(target, r => r[2] === '0');
  pick.sort((a, b) => Number(a[0]) - Number(b[0]));
  fs.writeFileSync(path.join(OUT, 'tatoeba_candidates.tsv'), pick.map(r => r.join('\t')).join('\n') + '\n');
  console.log(`Select: ${pick.length} candidates (i+1: ${pick.filter(r => r[2] === '1').length}, i+0: ${pick.filter(r => r[2] === '0').length}); distinct endings ${Object.keys(perEnding).length}`);
}
