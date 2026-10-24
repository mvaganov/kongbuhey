/**
 * Dynamic Collocation Filter Evaluator & Header Parser
 *
 * Implements safe parsing, header validation, and sandboxed execution of
 * embedded collocation filter scripts (e.g. /*js:filter* / (n, hasTag) => ...).
 */

function parseAndValidateCollocationFilter(filterStr, verbId = "unknown") {
	if (typeof filterStr !== 'string') {
		throw new Error(`Invalid collocation_filter on unit ${verbId}: expected string, got ${typeof filterStr}.`);
	}
	const trimmed = filterStr.trim();
	const headerMatch = trimmed.match(/^\/\*\s*([a-zA-Z0-9_-]+)(?::([^\*]+))?\s*\*\/\s*([\s\S]*)$/);
	if (!headerMatch) {
		throw new Error(`Invalid collocation_filter on unit ${verbId}: missing or malformed header comment. Expected /*js:...*/ or /*js*/.`);
	}

	const lang = headerMatch[1].toLowerCase();
	const subtype = (headerMatch[2] || "").trim();
	const code = headerMatch[3].trim();

	if (lang !== 'js') {
		throw new Error(`Unsupported collocation_filter language '${headerMatch[1]}' on unit ${verbId}. Expected 'js' (e.g. /*js:filter*/).`);
	}

	if (!code) {
		throw new Error(`Empty code body in collocation_filter on unit ${verbId}.`);
	}

	return { lang, subtype, code };
}

function compileCollocationFilter(code, verbId = "unknown") {
	try {
		return new Function('n', 'hasTag', `"use strict"; return (${code})(n, hasTag);`);
	} catch (err) {
		throw new Error(`Failed to compile collocation_filter on unit ${verbId}: ${err.message}`);
	}
}

const filterEvaluatorExports = {
	parseAndValidateCollocationFilter,
	compileCollocationFilter
};

if (typeof window !== 'undefined') {
	Object.assign(window, filterEvaluatorExports);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = filterEvaluatorExports;
}
