#!/usr/bin/env node
/**
 * PreToolUse hook: keep multi-megabyte data files out of the model's context.
 *
 * Why a hook and not permissions.deny: deny rules block Read entirely, and Edit needs a prior Read,
 * so a deny would also block legitimate schema changes. This hook only rejects *whole-file* reads.
 * Ranged reads (offset/limit), grep/select.js lookups and node codemod scripts stay allowed.
 *
 * Protocol: tool call JSON arrives on stdin. Exit 0 = allow. Exit 2 = block; stderr goes back to Claude.
 */
'use strict';

const BIG = /(^|[\\/])(data\.js|homonyms\.js|verified_sentences\.js|studytexts\.js|schema_summary\.json|package-lock\.json|exhaustive_output[^\\/]*\.txt|output\.txt)$/;
const BIG_IN_CMD = /\b(data\.js|homonyms\.js|verified_sentences\.js|studytexts\.js|schema_summary\.json|exhaustive_output\S*\.txt|output\.txt)\b/;
const DUMP_CMD = /(^|[;&]\s*)(cat|type|more|less|Get-Content|gc)\s/;
const MAX_LINES = 120;

let raw = '';
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
	let call;
	try { call = JSON.parse(raw); } catch (_) { process.exit(0); }
	const input = call.tool_input || {};

	if (call.tool_name === 'Read' && BIG.test(String(input.file_path || ''))) {
		const limit = Number(input.limit);
		if (!(limit > 0 && limit <= MAX_LINES)) {
			process.stderr.write(
				`Blocked: ${input.file_path} is too large to load whole. ` +
				`Look units up with \`node select.js --locate <id|korean>\`, search with Grep, ` +
				`or Read with offset and limit <= ${MAX_LINES}. For bulk or schema changes write a node codemod script ` +
				`instead of editing by hand.\n`);
			process.exit(2);
		}
	}

	if (call.tool_name === 'Bash') {
		const cmd = String(input.command || '');
		// Dumping a big file straight to output (no pipe to head/grep/sed/wc) floods the context.
		if (DUMP_CMD.test(cmd) && BIG_IN_CMD.test(cmd) && !/\|/.test(cmd)) {
			process.stderr.write(
				'Blocked: do not dump a whole data file to the terminal. ' +
				'Use `node select.js --locate ...`, grep, or `sed -n \'A,Bp\'` with a small range.\n');
			process.exit(2);
		}
	}
	process.exit(0);
});
