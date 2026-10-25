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
			if (Array.isArray(sv.aliases)) {
				for (const a of sv.aliases) {
					if (pos === 'Grammar') {
						if (!grammarByKo.has(a)) grammarByKo.set(a, []);
						grammarByKo.get(a).push(u);
					} else {
						if (!vocabByKo.has(a)) vocabByKo.set(a, []);
						vocabByKo.get(a).push(u);
					}
				}
			}
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
		const jeoCandidates = (vocabByKo.get("저") || []).filter(u => u[DATA_SCHEMA.PartofSpeech] === 'Pronoun');
		const jeoUnit = jeoCandidates[0] || null;
		pronounSandhiMap.set("제", { baseId: jeoUnit ? jeoUnit[DATA_SCHEMA.Id] : 2, baseWord: "저", particleId: 96, particleWord: "가", surfaceForm: "제가" });
	}
	if (!pronounSandhiMap.has("내")) {
		const naCandidates = (vocabByKo.get("나") || []).filter(u => u[DATA_SCHEMA.PartofSpeech] === 'Pronoun');
		const naUnit = naCandidates[0] || null;
		pronounSandhiMap.set("내", { baseId: naUnit ? naUnit[DATA_SCHEMA.Id] : 2, baseWord: naUnit ? "나" : "저", particleId: 96, particleWord: "가", surfaceForm: "내가" });
	}
	if (!pronounSandhiMap.has("네")) {
		const neoCandidates = (vocabByKo.get("너") || []).filter(u => u[DATA_SCHEMA.PartofSpeech] === 'Pronoun');
		const neoUnit = neoCandidates[0] || null;
		pronounSandhiMap.set("네", { baseId: neoUnit ? neoUnit[DATA_SCHEMA.Id] : 2, baseWord: neoUnit ? "너" : "저", particleId: 96, particleWord: "가", surfaceForm: "네가" });
	}

	// 5. Embedded SyntaxFrame MWE Matchers (/*js:matcher*/)
	const mweRules = [];
	for (const u of units) {
		if (!u) continue;
		const frame = u[DATA_SCHEMA.SyntaxFrame];
		if (typeof frame === 'string' && frame.includes('/*js:matcher*/')) {
			const matcherFn = compileMweMatcher(frame, u[DATA_SCHEMA.Id]);
			if (matcherFn) {
				mweRules.push({ unit: u, id: u[DATA_SCHEMA.Id], matcherFn });
			}
		}
	}

	// 6. Pre-compile verbal endings from units tagged with 'verbal_ending'
	const verbalEndingRules = [];
	for (const u of units) {
		if (!u) continue;
		const id = u[DATA_SCHEMA.Id];
		const tags = semanticTagsByUnitId.get(id);
		if (!tags || !tags.has('verbal_ending')) continue;

		const sv = parseSemanticVector(u) || {};
		let forms = Array.isArray(sv.surface_forms) ? [...sv.surface_forms] : [];
		if (forms.length === 0) {
			const cleanKo = (u[DATA_SCHEMA.Korean] || '').replace(/^[~-]/, '').replace(/\?$/, '').trim();
			cleanKo.split('/').forEach(p => {
				const trimmed = p.trim().replace(/^[~-]/, '');
				if (trimmed.includes('(으)')) {
					forms.push(trimmed.replace('(으)', '으'));
					forms.push(trimmed.replace('(으)', ''));
				} else {
					forms.push(trimmed);
				}
			});
		}

		let canonicalText = (u[DATA_SCHEMA.Korean] || '').replace(/\?$/, '').trim();
		if (canonicalText.includes(' / ')) {
			canonicalText = canonicalText.split(' / ')[0].trim();
		}
		if (canonicalText.startsWith('~')) {
			canonicalText = '-' + canonicalText.slice(1);
		} else if (!canonicalText.startsWith('-')) {
			canonicalText = '-' + canonicalText;
		}

		for (const form of forms) {
			if (!form) continue;
			verbalEndingRules.push({
				form,
				unit: u,
				id,
				text: canonicalText,
				pos: u[DATA_SCHEMA.PartofSpeech] === 'Grammar' ? 'Verb Ending' : u[DATA_SCHEMA.PartofSpeech],
				gloss: `${canonicalText} (${u[DATA_SCHEMA.English]}, ID ${id})`
			});
		}
	}
	// Sort by descending form length for greedy maximal munch matching
	verbalEndingRules.sort((a, b) => b.form.length - a.form.length);

	cachedIndex = {
		unitById,
		vocabByKo,
		grammarByKo,
		semanticTagsByUnitId,
		motionVerbStems,
		stativeVerbStems,
		pronounSandhiMap,
		mweRules,
		verbalEndingRules
	};
	cachedUnitsRef = units;

	return cachedIndex;
}

/**
 * Compiles an embedded JavaScript matcher script from a SyntaxFrame definition.
 * Format: /*js:matcher* / ({ w1, w2, w3, ... }) => ...
 */
function compileMweMatcher(frameStr, unitId = "unknown") {
	if (typeof frameStr !== 'string') return null;
	const match = frameStr.match(/\/\*\s*js:matcher\s*\*\/\s*([\s\S]*)$/);
	if (!match || !match[1].trim()) return null;
	const code = match[1].trim();
	try {
		return new Function('ctx', `"use strict"; return (${code})(ctx);`);
	} catch (err) {
		console.warn(`[MWE MATCHER COMPILE ERROR] Unit ID ${unitId}: ${err.message}`);
		return null;
	}
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
	window.compileMweMatcher = compileMweMatcher;
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		getIndex,
		resetIndexCache,
		compileMweMatcher
	};
}
