#!/usr/bin/env node
/**
 * tools/bench_generation.js - sentence generation speed, and a check that generation output did not change by accident.
 * Runs in `node test.js --full` (~10 s). Standalone: `node tools/bench_generation.js [--save] [--no-quiz]`.
 *
 * Measures (node; fc2 quiz build in jsdom): engine module load, first-use init, card generation cold and warm
 * (3 sentences, owned = units 0..699, the fc2 options), the availability sweep's worst slice, and fc2's quiz build.
 * Timings are reported next to the saved baseline's; they never fail the run (machine noise).
 *
 * Work checks (deterministic, so they CAN fail): a second identical pass rebuilds no cache and repeats exactly the first pass's
 * template attempts and AST fallbacks; unlocking units recomputes no slot and checks each new unit at most once per locked slot;
 * a template edit rebuilds the snapshot once; and with unchanged data the seeded pass does no more work than the baseline
 * (template attempts, AST fallbacks, cache fills). More work for an intended reason (a new rule, more templates)? re-save with --save.
 *
 * Output check: generation is seeded, so the same code and data give the same sentences. The baseline
 * (test/bench_baseline.json, hashes only, no sentence text) stores one hash per unit and mode plus a hash of the data files.
 *   - same data, different output  -> FAIL: generator behaviour changed. Intended (a fix, a new rule)? re-save with --save.
 *   - data files changed            -> the check is skipped (and says so); re-save after reviewing the data change.
 * Use it around refactors: run before (or --save), change code, run again; "identical" means no behaviour change.
 * Whenever the output differs from the baseline (changed data or not), it writes the flag ]bench_baseline.txt listing the changed
 * samples; `node tools/flags.js resolve --reviewed "]bench_baseline.txt"` re-saves after review, and an identical run removes it.
 * --repo <dir>: the real repo when running from a test copy (the baseline and the flag are read and written there).
 */
'use strict';
if (typeof require === 'function' && typeof module !== 'undefined' && require.main === module) require('./exit_log.js').watch('tools/bench_generation.js'); // failed runs -> test.js report
if (process.argv.includes('--help') || process.argv.includes('-h')) require('./cli_help.js').exitWithHeaderHelp(__filename);

const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2), SAVE = args.includes('--save'), QUIZ = !args.includes('--no-quiz');
const REPO = args.includes('--repo') ? path.resolve(args[args.indexOf('--repo') + 1] || '.') : ROOT;
const BASELINE = path.join(REPO, 'test', 'bench_baseline.json');
const FLAG = ']bench_baseline.txt';
const Flags = require('./flags.js');
const OWNED_MAX = 700;   // "owned" = units 0..699: an early-curriculum unlock set
const hash = s => crypto.createHash('sha1').update(s).digest('hex').slice(0, 12);
const now = () => process.hrtime.bigint(), ms = a => Number(process.hrtime.bigint() - a) / 1e6;
const stats = l => { const s = l.slice().sort((a, b) => a - b), n = s.length; return { n, mean: +(s.reduce((a, b) => a + b, 0) / n).toFixed(1), p90: +s[Math.floor(n * 0.9)].toFixed(1), max: +s[n - 1].toFixed(1) }; };

let passed = 0, failed = 0;
const check = (ok, msg) => { if (ok) passed++; else failed++; console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${msg}`); };

async function main() {
	const timings = {};
	let a = now();
	const V = require(path.join(ROOT, 'korean/generation/verified_sentence_generator.js'));
	const A = require(path.join(ROOT, 'shared/sentence_adapter.js'));
	const state = require(path.join(ROOT, 'korean/state.js'));
	const units = require(path.join(ROOT, 'data/data.js')).KR_EN_languageUnits;
	timings.loadMs = +ms(a).toFixed(0);
	a = now(); const ids = V.getVerifiedTemplatesShared().map(t => t.id); timings.initMs = +ms(a).toFixed(1);

	// ---- speed: fc2-like cards
	const owned = new Set(Array.from({ length: OWNED_MAX }, (_, i) => i)), sample = [];
	for (let i = 20; i < OWNED_MAX; i += 9) sample.push(i);
	const opts = r => ({ seedOffset: r, onlyFromSet: true, allowedUnitIds: owned, queueOrder: ids, slotBias: { retries: 2, reject: u => u[0] % 2 === 0 } });
	const work = {}, delta = (a, b) => Object.fromEntries(Object.keys(b).map(k => [k, b[k] - a[k]]));
	for (const pass of ['cold', 'warm']) {
		const per = [], w0 = V.getWorkStats();
		state.setRandomSeed(1);
		for (const id of sample) { const t = now(); A.generateSentencesForUnit(id, 3, opts(7)); per.push(ms(t)); }
		timings[pass + 'Card'] = stats(per);
		work[pass] = delta(w0, V.getWorkStats());
	}
	const CACHES = ['snapshotBuilds', 'difficultyComputes', 'slotContextBuilds', 'slotListComputes', 'matchComputes', 'baselineChecks'];
	const rebuilt = CACHES.filter(k => work.warm[k] !== 0);
	check(!rebuilt.length, `a second identical pass rebuilds no cache${rebuilt.length ? ' -> ' + rebuilt.map(k => `${k} +${work.warm[k]}`).join(', ') : ''}`);
	check(work.warm.templateAttempts === work.cold.templateAttempts && work.warm.astFallbackCalls === work.cold.astFallbackCalls,
		`the same seeded pass does the same work twice (template attempts ${work.cold.templateAttempts}/${work.warm.templateAttempts}, AST fallbacks ${work.cold.astFallbackCalls}/${work.warm.astFallbackCalls})`);

	V.syncOwnedUnits([]); V.syncOwnedUnits([...owned]);
	const slices = []; for (;;) { const t = now(), more = V.availabilityStep(6); slices.push(ms(t)); if (!more) break; }
	timings.availSweep = { slices: slices.length, worstSliceMs: +Math.max(...slices).toFixed(1) };
	// Unlock 15 more units: only the new units are checked, and only against slots that were still locked.
	const a0 = V.getAvailabilityStats(), added = Array.from({ length: 15 }, (_, i) => OWNED_MAX + i);
	V.syncOwnedUnits([...owned, ...added]);
	while (V.availabilityStep(1e9));
	const a1 = V.getAvailabilityStats();
	check(a1.slotComputes === a0.slotComputes && a1.unitChecks - a0.unitChecks <= a0.lockedSlots * added.length,
		`an unlock recomputes no slot and checks each new unit at most once per locked slot (${a1.slotComputes - a0.slotComputes} recomputes, ${a1.unitChecks - a0.unitChecks} checks <= ${a0.lockedSlots} x ${added.length})`);

	// ---- output fingerprint (seeded; independent of the speed runs above)
	const lines = {};
	for (let id = 0; id < units.length; id += 5) {
		for (const mode of ['all', 'owned']) {
			state.setRandomSeed(id + 1);
			const r = V.generateVerifiedSentencesForUnit(id, 3, { seedOffset: id % 13, ...(mode === 'owned' ? { onlyFromSet: true, allowedUnitIds: owned } : {}) });
			lines[`${id}:${mode}`] = hash(r.sentences.map(s => `${s.verifiedTemplateId || 'ast'}|${s.ko}|${s.enLiteral}|${s.enNatural}`).join('\n'));
		}
	}
	lines.fits = hash(JSON.stringify(V.listVerifiedFitsForUnit(79, [...owned]).map(r => [r.templateId, r.missing])));
	lines.ranking = hash(JSON.stringify(V.getPrioritizedVerifiedSentences().map(x => [x.id, x.difficultyScore])));

	// ---- a template edit rebuilds the shared snapshot once, not per call
	const editId = ids[0], w2 = V.getWorkStats();
	V.updateVerifiedSentenceTitle(editId, 'bench edit');
	for (const id of sample.slice(0, 5)) A.generateSentencesForUnit(id, 3, opts(3));
	const builds = V.getWorkStats().snapshotBuilds - w2.snapshotBuilds;
	V.resetHardcodedVerifiedSentence(editId);
	check(builds === 1 && V.getVerifiedTemplatesShared().find(t => t.id === editId).title !== 'bench edit', `a template edit rebuilds the snapshot exactly once (${builds}) and the reset restores it`);

	// ---- fc2 quiz build (jsdom)
	if (QUIZ) timings.quizBuild = await quizTimings();

	const dataHash = hash(['data/data.js', 'data/verified_sentences.js'].map(f => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n')).join('\0'));   // CRLF/LF checkouts hash alike
	const base = fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, 'utf8')) : null;

	console.log('Generation bench (ms; "was" = saved baseline, often another machine)');
	const fmt = (k, v) => `${k.padEnd(14)} ${JSON.stringify(v)}${base && base.timings && base.timings[k] !== undefined ? '   was ' + JSON.stringify(base.timings[k]) : ''}`;
	for (const [k, v] of Object.entries(timings)) console.log('  ' + fmt(k, v));

	const changed = base ? Object.keys({ ...base.lines, ...lines }).filter(k => base.lines[k] !== lines[k]) : [];
	const dataChanged = Boolean(base) && base.dataHash !== dataHash;
	const sampleName = k => { const m = /^(\d+):(\w+)$/.exec(k); return m && units[Number(m[1])] ? `unit ${m[1]} ${units[Number(m[1])][1]} (${m[2]})` : k; };
	if (SAVE) {
		fs.writeFileSync(BASELINE, JSON.stringify({ savedAt: new Date().toISOString(), dataHash, timings, work: work.cold, lines }, null, 1) + '\n');
		Flags.removeFlag(REPO, FLAG);
		console.log(`Saved baseline: ${Object.keys(lines).length} output hashes -> ${path.relative(REPO, BASELINE)} (${FLAG} removed)`);
		check(true, 'baseline saved');
	} else if (changed.length) {
		Flags.writeFlag(REPO, FLAG, {
			head: `blocks commits: generation output differs from the saved bench baseline in ${changed.length} of ${Object.keys(lines).length} samples (data files changed: ${dataChanged ? 'yes' : 'no'}). Review, then: node tools/flags.js resolve --reviewed "${FLAG}"`,
			action: 'bench_save',
			details: ['What to check: the uncommitted change (git diff --stat) should explain every changed sample: a fix, a new rule, tuned',
				'templates or edited units. Samples for units the change cannot touch mean an unintended side effect: find it instead of resolving.',
				'Changed samples (unit, mode: all units / owned = units 0..699):', ...changed.slice(0, 40).map(k => '  ' + sampleName(k)), ...(changed.length > 40 ? [`  ... ${changed.length - 40} more`] : [])],
			milestone: `${changed.length} samples differ (data changed: ${dataChanged ? 'yes' : 'no'})`,
		});
		console.log(`  output differs in ${changed.length} samples: ${FLAG} written (review, then node tools/flags.js resolve --reviewed "${FLAG}")`);
	} else Flags.removeFlag(REPO, FLAG);
	if (SAVE) { /* saved above */ } else if (!base) {
		check(false, `no baseline at ${path.relative(REPO, BASELINE)}: run node tools/bench_generation.js --save`);
	} else if (dataChanged) {
		console.log(changed.length ? `  (data/data.js or data/verified_sentences.js changed since the baseline: the ${changed.length} output differences are expected; review them in ${FLAG})`
			: '  (data/data.js or data/verified_sentences.js changed since the baseline, but the output is identical: nothing to review)');
		check(true, `bench ran (data changed; ${changed.length} output samples differ)`);
	} else {
		const diff = changed;
		const grew = base.work ? Object.keys(work.cold).filter(k => work.cold[k] > (base.work[k] ?? Infinity)) : [];
		console.log(`  ${'work (cold)'.padEnd(14)} ${JSON.stringify(work.cold)}${base.work ? '   was ' + JSON.stringify(base.work) : ''}`);
		check(grew.length === 0, grew.length ? `the seeded pass does more work than the baseline: ${grew.map(k => `${k} ${base.work[k]} -> ${work.cold[k]}`).join(', ')}. Intended? --save`
			: 'the seeded pass does no more work than the baseline');
		check(diff.length === 0, diff.length ? `generation output changed for ${diff.length} of ${Object.keys(lines).length} unit/mode samples with unchanged data (first: ${diff.slice(0, 6).join(', ')}). Intended? review ${FLAG}`
			: `generation output identical to the baseline (${Object.keys(lines).length} samples)`);
	}
	console.log(`\nTOTAL TESTS: ${passed + failed}\nPASSED:      ${passed}\nFAILED:      ${failed}`);
	process.exit(failed ? 1 : 0);
}

/** Load fc2/index.html in jsdom (as the UI test does) and time buildSentenceTest on a spread of cards. */
async function quizTimings() {
	const { JSDOM, VirtualConsole } = require('jsdom');
	const page = path.join(ROOT, 'fc2', 'index.html');
	const dom = await JSDOM.fromFile(page, {
		url: require('url').pathToFileURL(page).href + '?debug',   // plain ?debug never saves anything
		runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: new VirtualConsole(),
		beforeParse(w) {
			const mem = new Map();
			Object.defineProperty(w, 'localStorage', { value: { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) } });
			w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => {}, set: () => true });
			w.SpeechSynthesisUtterance = function() {};
			Object.defineProperty(w, 'speechSynthesis', { value: { speak() {}, cancel() {}, getVoices: () => [] } });
		}
	});
	const w = dom.window;
	await new Promise(r => w.addEventListener('load', r));
	await w.fc2App.ready;
	const app = w.fc2App;
	app.closeModal(); app.prefetchSoon = () => {};
	app.g.owned = Array.from({ length: OWNED_MAX }, (_, i) => i); app.opts.onlyOwned = true;
	const per = [];
	for (let id = 20; id < OWNED_MAX; id += 23) {
		const { sentences } = app.generateFor(id);
		for (const s of sentences.slice(0, 2)) { const t = w.performance.now(); app.buildSentenceTest(s, false, id); per.push(w.performance.now() - t); }
	}
	w.close();
	return stats(per);
}

main().catch(e => { console.error(e); console.log(`\nTOTAL TESTS: ${passed + failed + 1}\nPASSED:      ${passed}\nFAILED:      ${failed + 1}`); process.exit(1); });
