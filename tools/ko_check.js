#!/usr/bin/env node
/**
 * tools/ko_check.js - ask a Korean-first LLM whether sentences sound natural.
 *
 * Providers (both OpenAI-compatible Chat Completions):
 *   exaone   LG K-EXAONE 2.5   https://api.exaone.ai/v1   model k-exaone_v2.5   (free since 2026-11-09)
 *            key: EXAONE_API_KEY  (issue at https://docs.exaone.ai -> "API Key 발급하기")
 *   upstage  Upstage Solar Pro 4  https://api.upstage.ai/v1  model solar-pro4    (paid; $10 signup credit)
 *            key: UPSTAGE_API_KEY  (https://console.upstage.ai)
 * Keys come from the environment, or from local/keys.env (KEY=value lines; local/ is gitignored).
 *
 * Usage
 *   node tools/ko_check.js "너희는 어떻게 말합니까?" ["another sentence" ...]
 *   node tools/ko_check.js --file sentences.txt      one sentence per line, # comments ok
 *   echo "문장" | node tools/ko_check.js -
 *   --provider exaone|upstage   (default exaone)
 *   --effort low|high|max       EXAONE reasoning depth (default low; it always reasons)
 *   --json                      one JSON verdict per line instead of the text report
 *   --out <file>                write JSON verdicts to <file> as UTF-8 (implies --json; use this on
 *                               Windows PowerShell, whose pipes re-encode Hangul into mojibake)
 *   --ping                      one tiny request to confirm the key and endpoint work
 * A sentence is flagged for an "error" issue or a score of 3 or lower; other notes print but do not flag.
 * Exit code: 0 all natural, 1 something flagged, 2 usage/auth/network error.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const PROVIDERS = {
	exaone: { base: 'https://api.exaone.ai/v1', model: 'k-exaone_v2.5', keyVar: 'EXAONE_API_KEY' },
	upstage: { base: 'https://api.upstage.ai/v1', model: 'solar-pro4', keyVar: 'UPSTAGE_API_KEY' },
};

const TIMEOUT_MS = 90000;
const FLAG_SCORE = 3;

const SYSTEM = `You are a native Korean editor reviewing sentences for a Korean learner's study app.
Judge whether a native speaker would naturally say or write the given sentence. Classify every issue you find:
- "error": ungrammatical or clearly wrong: conjugation, wrong or missing particle, speech level / honorific mismatch (e.g. 너희 with 합니다체), nonsense meaning (e.g. buying a subway), translationese (번역투) a native would not produce.
- "style": grammatical but a native would usually phrase it differently.
- "context": fine in some situations; say which.
- "spacing": 띄어쓰기 / spelling only.
Do not report an issue just because a more formal synonym exists or the sentence could be more specific. A short, plain, correct sentence has no issues.
Reply with ONLY a JSON object, no prose, no code fence:
{"score": 1-5 (5 = fully natural), "issues": [{"type": "error|style|context|spacing", "note": "short English description"}], "suggestion": "most natural corrected Korean, or the original if there is no error"}`;

function loadKeysFile() {
	const p = path.join(__dirname, '..', 'local', 'keys.env');
	if (!fs.existsSync(p)) return;
	for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
		const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
		if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
	}
}

function parseArgs(argv) {
	const o = { provider: 'exaone', effort: 'low', json: false, ping: false, out: null, sentences: [] };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--provider') o.provider = argv[++i];
		else if (a === '--effort') o.effort = argv[++i];
		else if (a === '--json') o.json = true;
		else if (a === '--out') { o.out = argv[++i]; o.json = true; }
		else if (a === '--ping') o.ping = true;
		else if (a === '--file') o.sentences.push(...readLines(fs.readFileSync(argv[++i], 'utf8')));
		else if (a === '-') o.sentences.push(...readLines(fs.readFileSync(0, 'utf8')));
		else if (a === '-h' || a === '--help') { o.help = true; }
		else o.sentences.push(a);
	}
	return o;
}
const readLines = (t) => t.split(/\r?\n/).map(s => s.trim()).filter(s => s && !s.startsWith('#'));

async function chat(p, key, effort, messages, maxTokens) {
	const body = { model: p.model, messages, max_tokens: maxTokens };
	if (p === PROVIDERS.exaone) body.reasoning_effort = effort;
	let res, text;
	for (let attempt = 1; ; attempt++) {
		try {
			res = await fetch(p.base + '/chat/completions', {
				method: 'POST',
				headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
				signal: AbortSignal.timeout(TIMEOUT_MS),
			});
			text = await res.text();
			break;
		} catch (e) {
			// fetch hides the real reason (reset, DNS, timeout) in e.cause
			const why = e.name === 'TimeoutError' ? `timed out after ${TIMEOUT_MS / 1000}s` : `${e.message}${e.cause ? ' (' + (e.cause.code || e.cause.message) + ')' : ''}`;
			if (attempt >= 3) throw new Error(why);
			console.error(`  retry ${attempt}/2: ${why}`);
			await new Promise(r => setTimeout(r, 3000 * attempt));
		}
	}
	let j; try { j = JSON.parse(text); } catch { j = null; }
	if (!res.ok || !j || !j.choices) {
		const err = new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
		err.fatal = res.status === 401 || res.status === 403 || (j && j.result_code === 401);
		throw err;
	}
	return { content: (j.choices[0].message.content || '').trim(), usage: j.usage };
}

// natural is decided here, not by the model: an "error" issue or a score <= FLAG_SCORE fails a sentence.
// Calibration 2026-11-20: textbook originals scored 4-5 (0/30 flagged); 8 golden bad fixtures were scored
// 2-3 with only style/context notes, so the score catches what the issue type misses.
// Native-speaker review of 11 of those fixtures: the model agreed on the 5 that were actually fine, but
// scored all 6 confirmed-bad ones 4-5 (rude self-praise, 그립다 for 보고 싶다, bare 여자/것은, nonsense
// like 비싸면 됩니다). It catches grammar/register errors, not pragmatic oddness: a second opinion, not a gate.
function parseVerdict(content) {
	const m = content.match(/\{[\s\S]*\}/);
	if (!m) return null;
	let v; try { v = JSON.parse(m[0]); } catch { return null; }
	v.issues = (v.issues || []).map(i => typeof i === 'string' ? { type: 'error', note: i } : i);
	v.natural = !v.issues.some(i => i.type === 'error') && !(typeof v.score === 'number' && v.score <= FLAG_SCORE);
	return v;
}

async function main() {
	loadKeysFile();
	const o = parseArgs(process.argv.slice(2));
	if (o.help) { console.log(fs.readFileSync(__filename, 'utf8').match(/\/\*\*([\s\S]*?)\*\//)[1].replace(/^ \* ?/gm, '')); return 0; }
	const p = PROVIDERS[o.provider];
	if (!p) { console.error(`unknown --provider ${o.provider} (exaone|upstage)`); return 2; }
	const key = process.env[p.keyVar];
	if (!key) { console.error(`${p.keyVar} not set (env or local/keys.env)`); return 2; }

	if (o.ping) {
		try {
			const r = await chat(p, key, 'low', [{ role: 'user', content: '"안녕하세요"를 영어로 한 단어로.' }], 512);
			console.log(`ok  ${o.provider}/${p.model}  reply=${JSON.stringify(r.content)}  usage=${JSON.stringify(r.usage)}`);
			return 0;
		} catch (e) { console.error(`FAIL ${e.message}`); return 2; }
	}
	if (!o.sentences.length) { console.error('no sentences (see --help)'); return 2; }

	let flagged = 0, errors = 0, n = 0;
	if (o.out) fs.writeFileSync(o.out, '');
	for (const s of o.sentences) {
		let v;
		try {
			const r = await chat(p, key, o.effort, [{ role: 'system', content: SYSTEM }, { role: 'user', content: s }], 4096);
			v = parseVerdict(r.content) || { natural: null, error: 'unparseable reply', raw: r.content.slice(0, 200) };
		} catch (e) {
			if (e.fatal) { console.error(`auth failed: ${e.message}`); return 2; }
			v = { natural: null, error: e.message };
		}
		if (v.natural === false) flagged++;
		if (v.natural === null) errors++;
		n++;
		const line = JSON.stringify({ sentence: s, ...v });
		if (o.out) { fs.appendFileSync(o.out, line + '\n'); console.error(`  ${n}/${o.sentences.length} ${v.natural === true ? 'ok' : v.natural === false ? 'FLAG' : 'ERR'}`); }
		else if (o.json) console.log(line);
		else {
			const tag = v.natural === true ? 'OK  ' : v.natural === false ? 'FLAG' : 'ERR ';
			console.log(`${tag} [${v.score ?? '-'}] ${s}`);
			for (const i of v.issues || []) console.log(`       - ${(i.type || '?').padEnd(7)} ${i.note}`);
			if (v.natural === false && v.suggestion && v.suggestion !== s) console.log(`       → ${v.suggestion}`);
			if (v.error) console.log(`       ! ${v.error}`);
		}
	}
	console.error(`${o.sentences.length} checked, ${flagged} flagged, ${errors} errors${o.out ? ' -> ' + o.out : ''}`);
	return errors ? 2 : flagged ? 1 : 0;
}

main().then(c => { process.exitCode = c; }, e => { console.error(e); process.exitCode = 2; });
