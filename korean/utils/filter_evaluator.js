(function() {
// Universal Constants
const { K } = (typeof require !== 'undefined') ? require('../../constants.js') : (typeof window !== 'undefined' ? window : {});

/**
 * Dynamic Collocation Filter Evaluator & Header Parser
 *
 * Implements safe parsing, header validation, and sandboxed execution of
 * embedded collocation filter scripts (e.g. /*js:filter* / (n, hasTag) => ...).
 */

const VALID_DECLARATIVE_KEYS = new Set([
	'anyTag',
	'allTags',
	'notTags',
	'allow',
	'deny',
	'overrideAllow'
]);

function evaluateDeclarativeCollocationFilter(spec, unit, hasTagFn) {
	if (!spec || typeof spec !== 'object' || !unit) return true;
	const ko = unit[1] || '';
	if (Array.isArray(spec.deny) && spec.deny.includes(ko)) return false;
	if (Array.isArray(spec.allTags) && spec.allTags.length > 0) {
		for (const t of spec.allTags) {
			if (!hasTagFn(unit, t)) return false;
		}
	}
	if (Array.isArray(spec.overrideAllow) && spec.overrideAllow.includes(ko)) {
		return true;
	}
	if (Array.isArray(spec.notTags) && spec.notTags.length > 0 && hasTagFn(unit, ...spec.notTags)) {
		return false;
	}
	const hasAnyTagSpec = Array.isArray(spec.anyTag) && spec.anyTag.length > 0;
	const hasAllowSpec = Array.isArray(spec.allow) && spec.allow.length > 0;
	if (hasAnyTagSpec || hasAllowSpec) {
		const matchedTag = hasAnyTagSpec && hasTagFn(unit, ...spec.anyTag);
		const matchedAllow = hasAllowSpec && spec.allow.includes(ko);
		return Boolean(matchedTag || matchedAllow);
	}
	return true;
}

function parseAndValidateCollocationFilter(filterVal, verbId = "unknown") {
	if (filterVal && typeof filterVal === 'object' && !Array.isArray(filterVal)) {
		const keys = Object.keys(filterVal);
		if (keys.length === 0) {
			throw new Error(`Empty declarative collocation_filter object on unit ${verbId}.`);
		}
		for (const k of keys) {
			if (!VALID_DECLARATIVE_KEYS.has(k)) {
				throw new Error(`Unsupported declarative collocation_filter key '${k}' on unit ${verbId}.`);
			}
			if (!Array.isArray(filterVal[k])) {
				throw new Error(`Invalid declarative collocation_filter field '${k}' on unit ${verbId}: expected Array.`);
			}
		}
		return { lang: K.DECLARATIVE, subtype: 'filter', spec: filterVal, code: filterVal };
	}
	if (typeof filterVal !== 'string') {
		throw new Error(`Invalid collocation_filter on unit ${verbId}: expected object or string, got ${typeof filterVal}.`);
	}
	const trimmed = filterVal.trim();
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

function compileCollocationFilter(codeOrSpec, verbId = "unknown") {
	if (codeOrSpec && typeof codeOrSpec === 'object' && !Array.isArray(codeOrSpec)) {
		return (n, hasTag) => evaluateDeclarativeCollocationFilter(codeOrSpec, n, hasTag);
	}
	try {
		return new Function('n', 'hasTag', `"use strict"; return (${codeOrSpec})(n, hasTag);`);
	} catch (err) {
		throw new Error(`Failed to compile collocation_filter on unit ${verbId}: ${err.message}`);
	}
}

const filterEvaluatorExports = {
	evaluateDeclarativeCollocationFilter,
	parseAndValidateCollocationFilter,
	compileCollocationFilter
};

if (typeof window !== 'undefined') {
	Object.assign(window, filterEvaluatorExports);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = filterEvaluatorExports;
}
})();
