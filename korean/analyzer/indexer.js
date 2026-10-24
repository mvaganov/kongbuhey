/**
 * korean/analyzer/indexer.js
 *
 * Fast in-memory indexing, semantic tag caching, and dynamic stem classification
 * derived directly from data.js language units.
 *
 * Platform: Node.js & Browser (Vanilla JS, zero dependencies).
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

const { DATA_SCHEMA, parseSemanticVector, getStem } =
	(typeof require !== 'undefined' ? require('../core/primitives.js') : window);

let cachedIndex = null;
let cachedUnitsRef = null;

/**
 * Builds or returns a memoized fast lookup index for the given language units.
 * 
 * @param {Array} languageUnits Optional array of language units (defaults to KR_EN_languageUnits)
 * @returns {Object} Pre-indexed data structures and cached tag lookups
 */
function getIndex(languageUnits) {
	const units = languageUnits || dataModule.KR_EN_languageUnits || [];
	if (cachedIndex && cachedUnitsRef === units) {
		return cachedIndex;
	}

	const unitById = new Map();
	const vocabByKo = new Map();
	const grammarByKo = new Map();
	const semanticTagsByUnitId = new Map();
	const motionVerbStems = new Set();
	const stativeVerbStems = new Set();
	const pronounSandhiMap = new Map();

	for (const u of units) {
		if (!u) continue;
		const id = u[DATA_SCHEMA.Id];
		const ko = u[DATA_SCHEMA.Korean];
		const pos = u[DATA_SCHEMA.PartofSpeech];
		unitById.set(id, u);

		// Pre-compute unified semantic tags for O(1) runtime queries (zero JSON parsing at runtime)
		const tags = new Set();
		const rawTags = u[DATA_SCHEMA.SemanticTags];
		if (Array.isArray(rawTags)) {
			rawTags.forEach(t => tags.add(t));
		} else if (rawTags instanceof Set) {
			rawTags.forEach(t => tags.add(t));
		}

		const sv = parseSemanticVector(u);
		if (sv) {
			if (sv.domain) tags.add(sv.domain);
			if (sv.type) tags.add(sv.type);
			if (sv.field) tags.add(sv.field);
			if (sv.proximity) tags.add(sv.proximity);
			if (sv.deictic_type) tags.add(sv.deictic_type);
		}
		semanticTagsByUnitId.set(id, tags);

		// Index vocabulary vs grammar
		if (pos === 'Grammar') {
			if (!grammarByKo.has(ko)) grammarByKo.set(ko, []);
			grammarByKo.get(ko).push(u);
		} else {
			if (!vocabByKo.has(ko)) vocabByKo.set(ko, []);
			vocabByKo.get(ko).push(u);

			// Index dictionary stem for verbs & adjectives
			if ((pos === 'Action Verb' || pos === 'Descriptive Verb') && typeof ko === 'string' && ko.endsWith('다')) {
				const stem = getStem(ko);
				if (!vocabByKo.has(stem)) vocabByKo.set(stem, []);
				vocabByKo.get(stem).push(u);

				// Dynamically classify motion vs stative verb stems from semantic tags
				if (tags.has('locative_goal') || tags.has('locative_origin') || tags.has('intransitive_motion') || tags.has('movement')) {
					motionVerbStems.add(stem);
				}
				if (pos === 'Descriptive Verb' || tags.has('stative') || tags.has('existence') || tags.has('locative_static')) {
					stativeVerbStems.add(stem);
				}
			}
		}

		// Ingest pronoun sandhi rules dynamically from SemanticVector
		if (pos === 'Pronoun' && sv && Array.isArray(sv.sandhi)) {
			for (const rule of sv.sandhi) {
				if (rule.pattern && rule.replacement) {
					// Identify clean surface replacement (e.g. "$1제가$2" -> "제가", "$1내가$2" -> "내가")
					const cleanReplacement = rule.replacement.replace(/[\$\d]/g, '').trim();
					if (cleanReplacement && cleanReplacement.endsWith("가")) {
						const stemChar = cleanReplacement.slice(0, -1);
						pronounSandhiMap.set(stemChar, {
							baseId: id,
							baseWord: ko,
							particleId: 96,
							particleWord: "가",
							surfaceForm: cleanReplacement
						});
					}
				}
			}
		}
	}

	// High-frequency fallback motion & stative stems to ensure complete coverage
	const DEFAULT_MOTION = ["가", "오", "다니", "도착하", "돌아가", "올라가", "내려가", "나가", "들어오", "떠나", "입학하"];
	const DEFAULT_STATIVE = ["있", "없", "살", "많", "좋", "크", "작", "계시", "남"];
	DEFAULT_MOTION.forEach(s => motionVerbStems.add(s));
	DEFAULT_STATIVE.forEach(s => stativeVerbStems.add(s));

	// Fallback for standard pronominal allomorphs (저+가->제가, 나+가->내가, 너+가->네가)
	if (!pronounSandhiMap.has("제")) {
		pronounSandhiMap.set("제", { baseId: 2, baseWord: "저", particleId: 96, particleWord: "가", surfaceForm: "제가" });
	}
	if (!pronounSandhiMap.has("내")) {
		const naUnit = unitById.get(1699);
		pronounSandhiMap.set("내", { baseId: naUnit ? 1699 : 2, baseWord: naUnit ? "나" : "저", particleId: 96, particleWord: "가", surfaceForm: "내가" });
	}
	if (!pronounSandhiMap.has("네")) {
		const neoUnit = unitById.get(1700);
		pronounSandhiMap.set("네", { baseId: neoUnit ? 1700 : 2, baseWord: neoUnit ? "너" : "저", particleId: 96, particleWord: "가", surfaceForm: "네가" });
	}

	cachedIndex = {
		unitById,
		vocabByKo,
		grammarByKo,
		semanticTagsByUnitId,
		motionVerbStems,
		stativeVerbStems,
		pronounSandhiMap
	};
	cachedUnitsRef = units;

	return cachedIndex;
}

/**
 * Resets cached index (useful during test suites when data.js is reloaded).
 */
function resetIndexCache() {
	cachedIndex = null;
	cachedUnitsRef = null;
}

if (typeof window !== 'undefined') {
	window.getIndex = getIndex;
	window.resetIndexCache = resetIndexCache;
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		getIndex,
		resetIndexCache
	};
}
