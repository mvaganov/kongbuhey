/**
 * ============================================================================
 * korean/core/lexicon_index.js - Unified O(1) Lexicon & Candidate Cache Index
 * ============================================================================
 *
 * Pre-indexes KR_EN_languageUnits in a single pass and memoizes:
 *   1. O(1) unit lookups by ID and Korean surface string (`unitById`, `nounByKo`, `verbByKo`)
 *   2. Pre-filtered non-measure-word noun buckets by tag (`nonMeasureNounsByTag`)
 *   3. Compiled `collocation_filter` functions (`compiledCollocationFilters`) so `new Function`
 *      never runs inside hot generation loops
 *   4. Memoized verb argument candidate pools (`verbCandidateCache`, `dvCandidateCache`)
 *
 * Zero Node.js dependencies; 100% browser and CommonJS compatible.
 */

let dataModule;
if (typeof require !== 'undefined') {
	try {
		dataModule = require('../../data.js');
	} catch (e) {
		dataModule = typeof window !== 'undefined' ? window : {};
	}
} else {
	dataModule = typeof window !== 'undefined' ? window : {};
}

const { DATA_SCHEMA, hasTag, parseSemanticData } =
	(typeof require !== 'undefined' ? require('./primitives.js') : window);

let cachedLexiconIndex = null;
let cachedUnitsRef = null;
let cachedUnitsLength = -1;

function buildLexiconIndex(dm = dataModule) {
	const units = dm.KR_EN_languageUnits || (typeof window !== 'undefined' ? window.KR_EN_languageUnits : []) || [];
	const unitById = new Map();
	const nounByKo = new Map();
	const allNounsByKo = new Map();
	const verbByKo = new Map();
	const unitsByPos = new Map();
	const nonMeasureNounsAll = [];
	const nonMeasureNounsByTag = new Map();
	const compiledCollocationFilters = new Map();
	const verbCandidateCache = new Map();
	const dvCandidateCache = new Map();

	for (let i = 0; i < units.length; i++) {
		const u = units[i];
		if (!u) continue;
		const id = u[DATA_SCHEMA.Id];
		const ko = u[DATA_SCHEMA.Korean];
		const pos = u[DATA_SCHEMA.PartofSpeech];

		unitById.set(id, u);
		// Warm up SemanticData memoization cache
		parseSemanticData(u);

		if (!unitsByPos.has(pos)) unitsByPos.set(pos, []);
		unitsByPos.get(pos).push(u);

		if (pos === 'Noun' || pos === 'Pronoun') {
			if (!nounByKo.has(ko)) nounByKo.set(ko, u);
			if (!allNounsByKo.has(ko)) allNounsByKo.set(ko, []);
			allNounsByKo.get(ko).push(u);

			if (!hasTag(u, 'measureWord')) {
				nonMeasureNounsAll.push(u);
				const tags = u[DATA_SCHEMA.SemanticTags];
				if (tags) {
					for (const t of tags) {
						if (!nonMeasureNounsByTag.has(t)) nonMeasureNounsByTag.set(t, []);
						nonMeasureNounsByTag.get(t).push(u);
					}
				}
			}
		} else if (pos === 'Action Verb' || pos === 'Descriptive Verb') {
			if (!verbByKo.has(ko)) verbByKo.set(ko, u);
		}
	}

	return {
		units,
		unitById,
		nounByKo,
		allNounsByKo,
		verbByKo,
		unitsByPos,
		nonMeasureNounsAll,
		nonMeasureNounsByTag,
		compiledCollocationFilters,
		verbCandidateCache,
		dvCandidateCache
	};
}

function getLexiconIndex(dm = dataModule) {
	const units = dm.KR_EN_languageUnits || (typeof window !== 'undefined' ? window.KR_EN_languageUnits : []) || [];
	if (cachedLexiconIndex && cachedUnitsRef === units && cachedUnitsLength === units.length) {
		return cachedLexiconIndex;
	}
	cachedLexiconIndex = buildLexiconIndex(dm);
	cachedUnitsRef = units;
	cachedUnitsLength = units.length;
	return cachedLexiconIndex;
}

function invalidateLexiconIndex() {
	cachedLexiconIndex = null;
	cachedUnitsRef = null;
	cachedUnitsLength = -1;
}

/**
 * Returns (and caches) a compiled collocation_filter function for a verb/adjective unit.
 */
function getCompiledCollocationFilter(unit, parseAndValidateFn) {
	if (!unit) return null;
	const id = unit[DATA_SCHEMA.Id];
	const idx = getLexiconIndex();
	if (idx.compiledCollocationFilters.has(id)) {
		return idx.compiledCollocationFilters.get(id);
	}
	const sd = parseSemanticData(unit);
	if (!sd || typeof sd.collocation_filter !== 'string') {
		idx.compiledCollocationFilters.set(id, null);
		return null;
	}
	try {
		const { lang, code } = parseAndValidateFn(sd.collocation_filter, id);
		if (lang === 'js') {
			const fn = new Function('noun', 'hasTag', `return (${code})(noun, hasTag);`);
			idx.compiledCollocationFilters.set(id, fn);
			return fn;
		}
	} catch (_) {
		// Fallback to null if invalid
	}
	idx.compiledCollocationFilters.set(id, null);
	return null;
}

const lexiconIndexExports = {
	getLexiconIndex,
	invalidateLexiconIndex,
	getCompiledCollocationFilter
};

if (typeof window !== 'undefined') {
	Object.assign(window, lexiconIndexExports);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = lexiconIndexExports;
}

