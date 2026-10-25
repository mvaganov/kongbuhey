#!/usr/bin/env node
/**
 * schema_analysis.js - Curriculum schema and metadata taxonomy engine for data.js
 *
 * Reads data.js and extracts canonical lists and statistics of:
 *   1. Parts of Speech
 *   2. Semantic Tags (and tag frequencies)
 *   3. Honorific Rules
 *   4. Semantic Vector keys, domains, types, and value distributions
 *
 * Automatically saves/updates schema_summary.json on demand or when triggered by
 * select.js / homonyms.js updates.
 */

const fs = require('fs');
const path = require('path');
const { decomposeHangul, composeHangul, setFinal, hasBatchim } = require('./korean/core/primitives.js');
const { recognizeCompoundParticle, decomposeCompoundParticle } = require('./korean/analyzer/particles.js');

const DEFAULT_DATA_PATH = path.resolve(__dirname, 'data.js');
const DEFAULT_SUMMARY_PATH = path.resolve(__dirname, 'schema_summary.json');

/**
 * Analyzes data.js to extract all permissible schema values and taxonomy mappings.
 */
function analyzeSchema(dataPath = DEFAULT_DATA_PATH) {
	// Clear cache to ensure fresh read
	delete require.cache[path.resolve(dataPath)];
	const { KR_EN_languageUnits, DATA_SCHEMA } = require(path.resolve(dataPath));

	const posSet = new Set();
	const posCounts = {};
	const tagsSet = new Set();
	const tagCounts = {};
	const honorificSet = new Set();
	const honorificCounts = {};

	const vectorKeysSet = new Set();
	const vectorKeyValues = {};
	const domainTaxonomy = {};

	let totalUnits = 0;
	let validVectorCount = 0;

	for (const unit of KR_EN_languageUnits) {
		if (!unit) continue;
		totalUnits++;

		// 1. Part of Speech
		const pos = unit[DATA_SCHEMA.PartofSpeech] || "Noun";
		posSet.add(pos);
		posCounts[pos] = (posCounts[pos] || 0) + 1;

		// 2. Semantic Tags
		const tags = unit[DATA_SCHEMA.SemanticTags];
		const unitTagsList = [];
		if (tags instanceof Set) {
			tags.forEach(t => unitTagsList.push(t));
		} else if (Array.isArray(tags)) {
			tags.forEach(t => unitTagsList.push(t));
		}
		for (const t of unitTagsList) {
			const tagStr = String(t).trim();
			if (tagStr) {
				tagsSet.add(tagStr);
				tagCounts[tagStr] = (tagCounts[tagStr] || 0) + 1;
			}
		}

		// 3. Honorific Rules
		const hon = unit[DATA_SCHEMA.HonorificRules];
		if (hon && typeof hon === 'string' && hon.trim()) {
			const cleanHon = hon.trim();
			honorificSet.add(cleanHon);
			honorificCounts[cleanHon] = (honorificCounts[cleanHon] || 0) + 1;
		}

		// 4. Semantic Vector
		const vec = unit[DATA_SCHEMA.SemanticVector];
		if (vec) {
			let parsed = null;
			if (typeof vec === 'object') {
				parsed = vec;
			} else if (typeof vec === 'string' && vec.trim()) {
				try {
					parsed = JSON.parse(vec);
				} catch (_) { }
			}

			if (parsed && typeof parsed === 'object') {
				validVectorCount++;
				const domain = parsed.domain || "general";
				if (!domainTaxonomy[domain]) {
					domainTaxonomy[domain] = { types: new Set(), actions: new Set(), traits: new Set() };
				}

				for (const [k, v] of Object.entries(parsed)) {
					vectorKeysSet.add(k);
					if (!vectorKeyValues[k]) vectorKeyValues[k] = new Set();

					if (Array.isArray(v)) {
						v.forEach(item => {
							vectorKeyValues[k].add(String(item));
							if (k === 'traits') domainTaxonomy[domain].traits.add(String(item));
						});
					} else if (typeof v === 'object' && v !== null) {
						vectorKeyValues[k].add(JSON.stringify(v));
					} else {
						vectorKeyValues[k].add(v);
						if (k === 'type') domainTaxonomy[domain].types.add(String(v));
						if (k === 'action') domainTaxonomy[domain].actions.add(String(v));
					}
				}
			}
		}
	}

	// Format vectorKeyValues for JSON export
	const formattedKeyValues = {};
	for (const k of Array.from(vectorKeysSet).sort()) {
		formattedKeyValues[k] = Array.from(vectorKeyValues[k] || []).sort((a, b) => {
			if (typeof a === 'number' && typeof b === 'number') return a - b;
			return String(a).localeCompare(String(b));
		});
	}

	// Format domainTaxonomy
	const formattedTaxonomy = {};
	for (const [dom, sets] of Object.entries(domainTaxonomy)) {
		formattedTaxonomy[dom] = {
			types: Array.from(sets.types).sort(),
			actions: Array.from(sets.actions).sort(),
			traits: Array.from(sets.traits).sort()
		};
	}

	return {
		generatedAt: new Date().toISOString(),
		totalUnits,
		validVectorCount,
		partsOfSpeech: Array.from(posSet).sort(),
		posCounts,
		semanticTags: Array.from(tagsSet).sort(),
		tagCounts,
		honorificRules: Array.from(honorificSet).sort(),
		honorificCounts,
		semanticVectors: {
			keys: Array.from(vectorKeysSet).sort(),
			domains: formattedKeyValues.domain || [],
			types: formattedKeyValues.type || [],
			polarities: formattedKeyValues.polarity || [],
			keyValues: formattedKeyValues,
			domainTaxonomy: formattedTaxonomy
		}
	};
}

/**
 * Updates schema_summary.json on disk.
 */
function updateSchemaSummary(outputPath = DEFAULT_SUMMARY_PATH, dataPath = DEFAULT_DATA_PATH) {
	const summary = analyzeSchema(dataPath);
	fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2), 'utf8');
	return summary;
}

/**
 * Reads cached schema summary or updates on the fly.
 */
function getSchemaSummary(summaryPath = DEFAULT_SUMMARY_PATH, dataPath = DEFAULT_DATA_PATH) {
	if (fs.existsSync(summaryPath)) {
		try {
			return JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
		} catch (_) { }
	}
	return updateSchemaSummary(summaryPath, dataPath);
}

/**
 * Checks if a Korean word or alias already exists in data.js.
 */
function findExistingUnit(korean, dataPath = DEFAULT_DATA_PATH) {
	if (!korean || typeof korean !== 'string') return null;
	const word = korean.trim();
	if (!word) return null;

	const { KR_EN_languageUnits, DATA_SCHEMA } = require(path.resolve(dataPath));
	for (let i = 0; i < KR_EN_languageUnits.length; i++) {
		const u = KR_EN_languageUnits[i];
		if (!u) continue;
		if (u[DATA_SCHEMA.Korean] === word) return u;

		const svRaw = u[DATA_SCHEMA.SemanticVector];
		if (svRaw && typeof svRaw === 'string' && svRaw.includes(word)) {
			try {
				const sv = JSON.parse(svRaw);
				if (Array.isArray(sv.aliases) && sv.aliases.includes(word)) {
					return u;
				}
			} catch (_) {}
		}
	}
	return null;
}

/**
 * Tests whether stripping common verb/adjective endings (-았/었-, -습니다, -아/어, -고, -니까)
 * yields a stem that matches an existing Action Verb or Descriptive Verb in data.js.
 */
function deduceExistingVerbStem(surface, dataPath = DEFAULT_DATA_PATH) {
	if (!surface || typeof surface !== 'string') return null;
	const s = surface.trim();
	if (s.length < 1) return null;

	const { KR_EN_languageUnits, DATA_SCHEMA } = require(path.resolve(dataPath));
	const verbMap = new Map();
	for (const u of KR_EN_languageUnits) {
		if (u && (u[DATA_SCHEMA.PartofSpeech] === 'Action Verb' || u[DATA_SCHEMA.PartofSpeech] === 'Descriptive Verb')) {
			verbMap.set(u[DATA_SCHEMA.Korean], u);
		}
	}

	// 1. Direct stem match for open informal verbs (e.g. 나가 -> 나가다, 사 -> 사다, 보 -> 보다)
	if (verbMap.has(s) || verbMap.has(s + "다")) {
		const u = verbMap.get(s) || verbMap.get(s + "다");
		return { matched: true, surface: s, verbUnit: u, suffix: "open stem informal (no suffix)" };
	}
	if (s === "해") {
		const u = verbMap.get("하다");
		if (u) return { matched: true, surface: s, verbUnit: u, suffix: "하다 informal (해)" };
	}

	// 2. Candidate suffix patterns to test
	const candidates = [];

	// 2a. Formal polite endings: ~습니다, ~ㅂ니다
	if (s.endsWith("습니다") && s.length > 3) {
		candidates.push({ stem: s.slice(0, -3), suffix: "습니다" });
	} else if (s.endsWith("ㅂ니다") || (s.length >= 2 && s.endsWith("니다"))) {
		const basePart = s.replace(/니다$/, '');
		if (basePart.length >= 1) {
			const lastChar = basePart.slice(-1);
			const d = decomposeHangul(lastChar);
			if (d && d.final === 17) { // ㅂ coda
				const openChar = setFinal(lastChar, 0);
				const stemPrefix = basePart.slice(0, -1);
				candidates.push({ stem: stemPrefix + openChar, suffix: "ㅂ니다 (open stem)" });
				candidates.push({ stem: stemPrefix + setFinal(lastChar, 8), suffix: "ㅂ니다 (ㄹ-drop stem)" });
			}
		}
	}

	// 2b. 르-irregular past: ~랐습니다, ~렀습니다, ~랐어요, ~렀어요, ~랐다, ~렀다 (골랐습니다 -> 고르다, 몰랐어요 -> 모르다)
	const reuMatch = s.match(/(랐|렀)(습니다|어요|다|고|던|네)$/);
	if (reuMatch) {
		const prefix = s.slice(0, -reuMatch[0].length);
		if (prefix.length >= 1) {
			const lastPre = prefix.slice(-1);
			const d = decomposeHangul(lastPre);
			if (d && d.final === 8) { // ㄹ coda
				const strippedRoot = prefix.slice(0, -1) + setFinal(lastPre, 0);
				candidates.push({ stem: strippedRoot + "르", suffix: `르-irregular past (-${reuMatch[0]})` });
			}
		}
	}

	// 2c. Honorific inflections: ~하셔서, ~하셨어요, ~하셨습니다, ~하시면, ~하십니다, ~(으)셔서, ~(으)셨어요, ~(으)시면
	const honMatch = s.match(/(하|으시|시|으셔|셔|으셨|셨)(습니다|습니까|어요|다|고|던|네|면|서|요)$/);
	if (honMatch) {
		const matchStr = honMatch[0];
		if (matchStr.startsWith("하")) {
			const prefix = s.slice(0, -matchStr.length);
			candidates.push({ stem: prefix + "하", suffix: `honorific (-${matchStr})` });
		} else {
			const prefix = s.slice(0, -matchStr.length);
			candidates.push({ stem: prefix, suffix: `honorific (-${matchStr})` });
			if (matchStr.startsWith("으") && prefix.endsWith("으")) {
				candidates.push({ stem: prefix.slice(0, -1), suffix: `honorific (-${matchStr})` });
			}
		}
	}

	// 2d. Past tense endings: ~았습니다, ~었습니다, ~였습니다, ~았다, ~었다, ~였다, ~았어요, ~었어요, ~였어요, ~았고, ~었고
	const pastMatch = s.match(/(았|었|였)(습니다|어요|다|고|던|네|더)$/);
	if (pastMatch) {
		const pastIdx = s.lastIndexOf(pastMatch[1]);
		const stem = s.slice(0, pastIdx);
		if (stem.length > 0) {
			candidates.push({ stem: stem, suffix: `-았/었-${pastMatch[2]}` });
		}
	}

	// 2d. ㅂ-irregular past/connective: ~웠다, ~웠어요, ~웠습니다, ~워지다, ~워지니까, ~워
	const bIrregRegex = /워(지니까|져서|졌다|집니다|요|서|도)?$/;
	if (bIrregRegex.test(s)) {
		const basePrefix = s.replace(bIrregRegex, '');
		if (basePrefix.length >= 1) {
			const lastPre = basePrefix.slice(-1);
			const d = decomposeHangul(lastPre);
			if (d && d.final === 0) {
				const bChar = setFinal(lastPre, 17); // ㅂ coda
				candidates.push({ stem: basePrefix.slice(0, -1) + bChar, suffix: "ㅂ-irregular ~워-" });
			}
		}
	}

	// 2e. ㅡ-irregular informal / past: 써 -> 쓰다, 꺼 -> 끄다, 썼다 -> 쓰다
	if (s === "써" || s === "써서" || s === "써도" || s === "썼다" || s === "썼습니다" || s === "썼어요") {
		candidates.push({ stem: "쓰", suffix: "ㅡ-irregular (쓰다)" });
	} else if (s === "꺼" || s === "꺼서" || s === "껐다") {
		candidates.push({ stem: "끄", suffix: "ㅡ-irregular (끄다)" });
	} else if (s === "커" || s === "커서" || s === "컸다") {
		candidates.push({ stem: "크", suffix: "ㅡ-irregular (크다)" });
	}

	// 2f. Common connective / mood endings: ~고, ~지, ~지만, ~니까, ~으니까, ~으면, ~면, ~아, ~어, ~아서, ~어서
	const connSuffixes = [
		{ ending: "지만", name: "-지만" },
		{ ending: "으니까", name: "-(으)니까", stripEu: true },
		{ ending: "니까", name: "-니까" },
		{ ending: "으면", name: "-(으)면", stripEu: true },
		{ ending: "면", name: "-면" },
		{ ending: "어서", name: "-아서/어서" },
		{ ending: "아서", name: "-아서/어서" },
		{ ending: "어도", name: "-아/어도" },
		{ ending: "아도", name: "-아/어도" },
		{ ending: "고", name: "-고" },
		{ ending: "지", name: "-지" },
		{ ending: "어", name: "informal -어" },
		{ ending: "아", name: "informal -아" }
	];

	for (const cs of connSuffixes) {
		if (s.endsWith(cs.ending) && s.length > cs.ending.length) {
			let stem = s.slice(0, -cs.ending.length);
			candidates.push({ stem, suffix: cs.name });
			if (cs.stripEu && stem.endsWith("으")) {
				candidates.push({ stem: stem.slice(0, -1), suffix: cs.name });
			}
		}
	}

	// Test candidates against existing verbs in verbMap
	for (const c of candidates) {
		const candVerb = c.stem + "다";
		if (verbMap.has(candVerb)) {
			const u = verbMap.get(candVerb);
			return {
				matched: true,
				surface: s,
				verbUnit: u,
				candidateStem: c.stem,
				suffix: c.suffix
			};
		}
}

	return null;
}

/**
 * Generates a ready-to-paste JavaScript rule snippet for VERB_SUFFIX_RULES
 * in korean/analyzer/verb_suffix_rules.js based on a reverse-stem morphology match.
 */
function generateVerbSuffixSnippet(morph) {
	if (!morph || !morph.verbUnit) return null;

	const surface = morph.surface;
	const baseVerb = morph.verbUnit[1];

	// Catalog of standard morphology grammar objects with canonical IDs
	const G = {
		HONORIFIC: { text: "-(으)시-", pos: "Honorific Infix", id: 678, gloss: "honorific subject (ID 678)" },
		PAST: { text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" },
		VOLITION: { text: "-겠-", pos: "Pre-final Ending", id: 838, gloss: "volition/intention (ID 838)" },
		FORMAL_DEC: { text: "-습니다", pos: "Verb Ending", id: 50, gloss: "formal declarative (ID 50)" },
		FORMAL_QUESTION: { text: "-ㅂ니까", pos: "Verb Ending", id: 50, gloss: "formal question (ID 50)" },
		POLITE_INF: { text: "-아/어요", pos: "Verb Ending", id: 49, gloss: "polite informal (ID 49)" },
		CONDITIONAL: { text: "-(으)면", pos: "Verb Ending", id: 619, gloss: "conditional 'if/when' (ID 619)" },
		CAUSE_SEQ: { text: "-아/어서", pos: "Verb Ending", id: 459, gloss: "cause / sequential (ID 459)" },
		CONNECTIVE: { text: "-고", pos: "Verb Ending", id: 336, gloss: "connective 'and' (ID 336)" },
		BUT: { text: "~지만", pos: "Verb Ending", id: 461, gloss: "but/although (ID 461)" },
		NEUNDE: { text: "-는데", pos: "Verb Ending", id: 620, gloss: "background/contrastive (ID 620)" },
		POLITE_IMP: { text: "-(으)세요", pos: "Verb Ending", id: 416, gloss: "polite honorific ending (ID 416)" },
		FORMAL_IMP: { text: "-(으)십시오", pos: "Verb Ending", id: 1644, gloss: "formal imperative (ID 1644)" },
		INTERROGATIVE: { text: "-나요", pos: "Verb Ending", id: 930, gloss: "polite interrogative (ID 930)" },
		CONFIRMATION: { text: "-지요", pos: "Verb Ending", id: 1773, gloss: "confirmation ending (ID 1773)" },
		SURPRISE: { text: "-네요", pos: "Verb Ending", id: 839, gloss: "realization/surprise (ID 839)" },
		EXCLAMATORY: { text: "-군요", pos: "Verb Ending", id: 1645, gloss: "realization exclamatory (ID 1645)" },
		REASON_NIKA: { text: "-(으)니까", pos: "Verb Ending", id: 53, gloss: "since / because (ID 53)" },
		WHILE: { text: "-(으)면서", pos: "Verb Ending", id: 711, gloss: "while doing (ID 711)" },
		INTENT: { text: "-(으)려고", pos: "Verb Ending", id: 816, gloss: "intentive 'in order to' (ID 816)" },
		PURPOSE: { text: "-(으)러", pos: "Verb Ending", id: 485, gloss: "in order to (ID 485)" },
	};

	let stemType = "stem_da";
	let suffix = "";
	let baseVerbField = null;
	const grammar = [];

	const isHada = baseVerb.endsWith("하다");
	const isReu = baseVerb.endsWith("르다");

	if (isReu && (surface.includes("랐") || surface.includes("렀") || surface.includes("라") || surface.includes("러"))) {
		if (surface.includes("랐") || surface.includes("렀")) {
			stemType = "stem_reu_past";
			grammar.push(G.PAST);
			if (surface.endsWith("습니다")) { suffix = surface.includes("랐") ? "랐습니다" : "렀습니다"; grammar.push(G.FORMAL_DEC); }
			else if (surface.endsWith("어요")) { suffix = surface.includes("랐") ? "랐어요" : "렀어요"; grammar.push(G.POLITE_INF); }
			else if (surface.endsWith("다")) { suffix = surface.includes("랐") ? "랐다" : "렀다"; grammar.push(G.FORMAL_DEC); }
			else { suffix = surface; stemType = "fixed_base"; baseVerbField = baseVerb; }
		} else {
			stemType = "stem_reu_present";
			if (surface.endsWith("요")) { suffix = surface.includes("라") ? "라요" : "러요"; grammar.push(G.POLITE_INF); }
			else if (surface.endsWith("서")) { suffix = surface.includes("라") ? "라서" : "려서"; grammar.push(G.CAUSE_SEQ); }
			else { suffix = surface; stemType = "fixed_base"; baseVerbField = baseVerb; }
		}
	} else if (isHada && (surface.includes("하") || surface.includes("해") || surface.includes("했"))) {
		stemType = "hada";
		if (surface.includes("하")) {
			suffix = surface.slice(surface.lastIndexOf("하"));
		} else if (surface.includes("했")) {
			suffix = surface.slice(surface.lastIndexOf("했"));
		} else {
			suffix = surface.slice(surface.lastIndexOf("해"));
		}

		if (suffix.includes("시") || suffix.includes("셔") || suffix.includes("세")) grammar.push(G.HONORIFIC);
		if (suffix.includes("했") || suffix.includes("았") || suffix.includes("었")) grammar.push(G.PAST);
		if (suffix.includes("겠")) grammar.push(G.VOLITION);

		if (suffix.endsWith("습니다")) grammar.push(G.FORMAL_DEC);
		else if (suffix.endsWith("습니까")) grammar.push(G.FORMAL_QUESTION);
		else if (suffix.endsWith("어요") || suffix.endsWith("아요") || suffix.endsWith("해요")) grammar.push(G.POLITE_INF);
		else if (suffix.endsWith("면")) grammar.push(G.CONDITIONAL);
		else if (suffix.endsWith("서")) grammar.push(G.CAUSE_SEQ);
		else if (suffix.endsWith("고")) grammar.push(G.CONNECTIVE);
		else if (suffix.endsWith("지만")) grammar.push(G.BUT);
		else if (suffix.endsWith("는데")) grammar.push(G.NEUNDE);
		else if (suffix.endsWith("세요")) grammar.push(G.POLITE_IMP);
		else if (suffix.endsWith("십시오")) grammar.push(G.FORMAL_IMP);
		else if (suffix.endsWith("니까")) grammar.push(G.REASON_NIKA);
		else if (suffix.endsWith("면서")) grammar.push(G.WHILE);
	} else {
		const stem = baseVerb.replace(/다$/, '');
		if (surface === stem) {
			suffix = surface;
			stemType = "fixed_base";
			baseVerbField = baseVerb;
			grammar.push({ text: "-아/어", pos: "Verb Ending", id: 459, gloss: "informal (ID 459)" });
		} else if (surface.startsWith(stem)) {
			suffix = surface.slice(stem.length);
			stemType = "stem_da";

			if (surface.includes("셨")) {
				grammar.push(G.HONORIFIC);
				grammar.push(G.PAST);
			} else {
				if (suffix.includes("시") || suffix.includes("셔")) grammar.push(G.HONORIFIC);
				if (suffix.includes("았") || suffix.includes("었")) grammar.push(G.PAST);
			}
			if (suffix.includes("겠")) grammar.push(G.VOLITION);

			if (suffix.endsWith("습니다")) grammar.push(G.FORMAL_DEC);
			else if (suffix.endsWith("습니까")) grammar.push(G.FORMAL_QUESTION);
			else if (suffix.endsWith("어요") || suffix.endsWith("아요") || suffix.endsWith("요")) grammar.push(G.POLITE_INF);
			else if (suffix.endsWith("면")) grammar.push(G.CONDITIONAL);
			else if (suffix.endsWith("서")) grammar.push(G.CAUSE_SEQ);
			else if (suffix.endsWith("고")) grammar.push(G.CONNECTIVE);
			else if (suffix.endsWith("지만")) grammar.push(G.BUT);
			else if (suffix.endsWith("는데") || suffix.endsWith("은데")) grammar.push(G.NEUNDE);
			else if (suffix.endsWith("세요")) grammar.push(G.POLITE_IMP);
			else if (suffix.endsWith("십시오")) grammar.push(G.FORMAL_IMP);
			else if (suffix.endsWith("니까")) grammar.push(G.REASON_NIKA);
			else if (suffix.endsWith("면서")) grammar.push(G.WHILE);
			else if (suffix.endsWith("네요")) grammar.push(G.SURPRISE);
			else if (suffix.endsWith("지요") || suffix.endsWith("죠")) grammar.push(G.CONFIRMATION);
		} else {
			suffix = surface;
			stemType = "fixed_base";
			baseVerbField = baseVerb;

			if (surface.includes("셨")) {
				grammar.push(G.HONORIFIC);
				grammar.push(G.PAST);
			} else if (surface.includes("았") || surface.includes("었") || surface.includes("였") || surface.includes("됐")) {
				grammar.push(G.PAST);
			}
			if (surface.includes("겠")) grammar.push(G.VOLITION);
			if (surface.endsWith("습니다")) grammar.push(G.FORMAL_DEC);
			else if (surface.endsWith("어요") || surface.endsWith("아요") || surface.endsWith("요")) grammar.push(G.POLITE_INF);
			else if (surface.endsWith("면")) grammar.push(G.CONDITIONAL);
			else if (surface.endsWith("서")) grammar.push(G.CAUSE_SEQ);
			else if (surface.endsWith("고")) grammar.push(G.CONNECTIVE);
		}
	}

	let snippet = `{ suffix: "${suffix}", stemType: "${stemType}"`;
	if (baseVerbField) snippet += `, baseVerb: "${baseVerbField}"`;
	const grammarEntries = grammar.map(g => `{ text: "${g.text}", pos: "${g.pos}", id: ${g.id}, gloss: "${g.gloss}" }`);
	snippet += `, grammar: [${grammarEntries.join(", ")}] }`;
	return snippet;
}

/**
 * Detects whether an unparsed word or stem is likely a proper personal name
 * based on morphological markers (vocatives, familiar diminutive -이) or passage context.
 * 
 * @param {string} word Korean word or candidate stem
 * @param {string} [passageText] Raw passage string for contextual heuristics
 * @param {Map|Set|Object} [vocabByKo] Optional vocab index to prevent hijacking common nouns
 * @returns {Object|null} Proper name candidate object or null
 */
function detectProperNameCandidate(word, passageText = "", vocabByKo = null) {
	if (!word || typeof word !== 'string') return null;
	const clean = word.trim();
	// Names must be 2 to 5 pure Hangul syllables
	if (!/^[가-힣]{2,5}$/.test(clean)) return null;

	// Exclude common discourse adverbs, conjunctions, and general words
	const EXCLUDED_DISCOURSE = new Set(["근데", "그리고", "그래서", "그러면", "그런데", "하지만", "그래도", "이따가", "어떻게", "진짜로", "얼마나", "아무튼", "아마도", "다 같이", "오랜만"]);
	if (EXCLUDED_DISCOURSE.has(clean)) return null;

	// Guard: Do not classify common words as names if already existing in vocab
	if (vocabByKo && (vocabByKo.has ? vocabByKo.has(clean) : Boolean(vocabByKo[clean]))) {
		const existingUnits = vocabByKo.get ? vocabByKo.get(clean) : vocabByKo[clean];
		const firstUnit = Array.isArray(existingUnits) ? existingUnits[0] : existingUnits;
		if (firstUnit && firstUnit[4] && !firstUnit[4].includes("name")) {
			return null;
		}
	}

	// 1. Check vocative ending: [Stem]아 (batchim) or [Stem]야 (vowel)
	if (clean.length >= 2) {
		const lastChar = clean.slice(-1);
		const prevChar = clean.slice(-2, -1);
		const stem = clean.slice(0, -1);
		if (lastChar === "아" && hasBatchim(prevChar) && !EXCLUDED_DISCOURSE.has(stem)) {
			return {
				isName: true,
				baseName: stem,
				surface: clean,
				reason: `Vocative particle -아 attached to consonant stem "${stem}"`,
				confidence: 0.95
			};
		}
		if (lastChar === "야" && !hasBatchim(prevChar) && !EXCLUDED_DISCOURSE.has(stem)) {
			return {
				isName: true,
				baseName: stem,
				surface: clean,
				reason: `Vocative particle -야 attached to open vowel stem "${stem}"`,
				confidence: 0.95
			};
		}
	}

	// 2. Check familiar diminutive -이 + particle or standalone [Stem]이
	if (clean.length >= 2 && clean.endsWith("이")) {
		const stem = clean.slice(0, -1);
		const lastChar = stem.slice(-1);
		if (hasBatchim(lastChar) && !EXCLUDED_DISCOURSE.has(stem)) {
			return {
				isName: true,
				baseName: stem,
				surface: clean,
				reason: `Familiar diminutive suffix -이 attached to consonant stem "${stem}"`,
				confidence: 0.9
			};
		}
	}

	// 3. Contextual heuristic in passageText
	if (passageText && typeof passageText === 'string') {
		// Matches lines consisting purely of clean (dialogue/chat script turn)
		// e.g. "흐엉\n", "에릭\n", "민준\n" or "오전9:40\n민준"
		const speakerRegex = new RegExp(`(?:^|[\\r\\n]+)(?:\\d{1,4}[\\r\\n]+|오[전후]\\d+:\\d+[\\r\\n]+)?\\s*(${clean})\\s*(?:[\\r\\n]+|:)`, 'm');
		if (speakerRegex.test(passageText)) {
			return {
				isName: true,
				baseName: clean,
				surface: clean,
				reason: `Dialogue speaker header in script/chat passage`,
				confidence: 0.9
			};
		}

		// Matches "[clean] 씨" or "[clean] 님"
		const titleRegex = new RegExp(`(?:^|[\\s\\r\\n])${clean}\\s*(?:씨|님)`, 'm');
		if (titleRegex.test(passageText)) {
			return {
				isName: true,
				baseName: clean,
				surface: clean,
				reason: `Precedes honorific title (씨/님) in passage`,
				confidence: 0.95
			};
		}

		// Matches "[clean] 집들이", "[clean]의 생일", "[clean] 생일"
		const assocRegex = new RegExp(`(?:^|[\\s\\r\\n])${clean}(?:의)?\\s+(?:집들이|생일|결혼식|파티|송별회|동창회)`, 'm');
		if (assocRegex.test(passageText)) {
			return {
				isName: true,
				baseName: clean,
				surface: clean,
				reason: `Associated with personal celebration/event in passage`,
				confidence: 0.85
			};
		}
	}

	return null;
}

/**
 * Generates an intelligent draft language unit skeleton using the schema taxonomy.
 */
function scaffoldUnit(korean, source = "studytext", context = {}, summary = null) {
	const word = String(korean || "").trim();
	if (!word) return null;

	// Exact-match guard
	if (!context.force) {
		const existing = findExistingUnit(word);
		if (existing) {
			console.log(`[DEDUPLICATION] "${word}" already exists as unit ${existing[0]} (${existing[1]} - ${existing[2]}). Skipping scaffolding.`);
			return null;
		}

		// Smart reverse-stem morphology deduction
		const morph = deduceExistingVerbStem(word);
		if (morph) {
			console.log(`[MORPHOLOGY HINT] "${word}" matches existing verb ${morph.verbUnit[1]} (ID ${morph.verbUnit[0]}) via suffix "${morph.suffix}".`);
			const snippet = generateVerbSuffixSnippet(morph);
			if (snippet) {
				console.log(`  Suggested VERB_SUFFIX_RULES entry for verb_suffix_rules.js:\n  ${snippet}`);
			}
			return null;
		}
	}

	const tax = summary || getSchemaSummary();

	let pos = "Noun";
	let tags = ["general"];
	let conjugation = "";
	let vector = { domain: "concept", type: "general" };
	let syntaxFrame = "";
	let english = `<English definition of "${word}">`;

	// Proper name & diminutive heuristic
	const nameCandidate = detectProperNameCandidate(word, context.passageText || context.passage || "");
	if (context.isName || context.isProperNoun || nameCandidate) {
		const baseName = nameCandidate ? nameCandidate.baseName : (context.baseName || word);
		pos = "Noun";
		tags = ["name", "proper_noun"];
		vector = { domain: "person", type: "name" };
		english = context.english || `<Person name "${baseName}">`;
		return {
			Korean: baseName,
			English: english,
			PartofSpeech: pos,
			SemanticTags: tags,
			Disambiguation: context.disambiguation || "",
			Conjugation: "",
			Source: source,
			PriorityScore: context.priorityScore || 1,
			FormalityLevel: "Universal",
			HonorificRules: "",
			SemanticVector: JSON.stringify(vector),
			SyntaxFrame: ""
		};
	}

	// Part of Speech inference from morphological markers or context
	if (context.isVerbEnding || word.startsWith("-") || word.startsWith("~")) {
		pos = "Grammar";
		tags = ["grammar"];
		conjugation = ["{VP_AVst}"];
		vector = { domain: "grammar", type: "verb_ending" };
	} else if (word.endsWith("하다")) {
		// Action Verb vs Descriptive Verb inference
		if (context.isDescriptive || ["지루하다", "따뜻하다", "친절하다", "시원하다"].some(w => word.includes(w))) {
			pos = "Descriptive Verb";
			tags = ["state", "emotion", "descriptive_general"];
			conjugation = "hada";
			vector = { domain: "state", polarity: 1 };
		} else {
			pos = "Action Verb";
			tags = ["action", "general"];
			conjugation = "hada";
			vector = { domain: "action", action: word.slice(0, -2) };
		}
	} else if (word.endsWith("다") && word.length >= 2) {
		pos = context.isDescriptive ? "Descriptive Verb" : "Action Verb";
		tags = [context.isDescriptive ? "descriptive_general" : "action"];
		conjugation = "regular";
		vector = { domain: context.isDescriptive ? "state" : "action" };
	} else if (context.isCounter || ["개월", "년", "월", "일", "시", "분", "명", "마리", "개", "번", "권", "장"].includes(word)) {
		pos = "Noun";
		tags = ["counter", context.isTime ? "time" : "measurement"];
		vector = { domain: context.isTime ? "time" : "measurement", type: "counter" };
		syntaxFrame = "{Number}\\s*_";
	} else if (context.isTimeNoun || ["전", "후", "때", "날", "아침", "오후", "저녁", "밤", "새벽"].includes(word)) {
		pos = "Noun";
		tags = ["time", "calendar"];
		vector = { domain: "time", type: "relative" };
		if (word === "전" || word === "후") {
			syntaxFrame = "({Number}\\s*{Counter:time}|{Noun:time})\\s*_";
		}
	} else if (context.isLanguage || word.endsWith("어") || word.endsWith("말")) {
		pos = "Noun";
		tags = ["language", "education"];
		vector = { domain: "language", type: "natural_language" };
	} else if (context.isPlace || context.attachedParticle === "에서" || context.attachedParticle === "에") {
		pos = "Noun";
		tags = ["place", "place_indoor"];
		vector = { domain: "geography", type: "place" };
	} else if (context.isAdnominalFollower || ["일", "분", "것", "사람"].includes(word)) {
		pos = "Noun";
		tags = ["concept", "activity"];
		vector = { domain: "concept", type: "abstract" };
		syntaxFrame = "{VP_adnominal}\\s*_";
	}

	// Ensure tags are in taxonomy
	const validTags = tags.filter(t => tax.semanticTags.includes(t));
	if (validTags.length === 0) validTags.push("general");

	return {
		Korean: word,
		English: english,
		PartofSpeech: pos,
		SemanticTags: validTags,
		Disambiguation: context.disambiguation || "",
		Conjugation: conjugation,
		Source: source,
		PriorityScore: context.priorityScore || 1,
		FormalityLevel: context.formality || "Universal",
		HonorificRules: context.honorific || "",
		SemanticVector: JSON.stringify(vector),
		SyntaxFrame: syntaxFrame || context.syntaxFrame || ""
	};
}

if (require.main === module) {
	console.log("Analyzing schema in data.js...");
	const summary = updateSchemaSummary();
	console.log(`\n======================================================`);
	console.log(`              DATA.JS SCHEMA TAXONOMY REPORT          `);
	console.log(`======================================================`);
	console.log(`Total Units Analyzed:        ${summary.totalUnits}`);
	console.log(`Units with Semantic Vectors: ${summary.validVectorCount} (${(summary.validVectorCount / summary.totalUnits * 100).toFixed(1)}%)`);
	console.log(`------------------------------------------------------`);
	console.log(`Parts of Speech (${summary.partsOfSpeech.length}):`);
	summary.partsOfSpeech.forEach(p => console.log(`  - ${p.padEnd(20)} (${summary.posCounts[p]} units)`));
	console.log(`------------------------------------------------------`);
	console.log(`Total Semantic Tags:         ${summary.semanticTags.length}`);
	console.log(`Top 10 Semantic Tags:        ${summary.semanticTags.slice(0, 10).map(t => `${t} (${summary.tagCounts[t]})`).join(', ')}`);
	console.log(`------------------------------------------------------`);
	console.log(`Honorific Rules:             ${summary.honorificRules.length} registered rules`);
	console.log(`Semantic Vector Keys (${summary.semanticVectors.keys.length}): ${summary.semanticVectors.keys.slice(0, 8).join(', ')}...`);
	console.log(`Semantic Vector Domains:     ${summary.semanticVectors.domains.length} distinct domains`);
	console.log(`------------------------------------------------------`);
	console.log(`Saved comprehensive summary to: ${path.relative(process.cwd(), DEFAULT_SUMMARY_PATH)}`);
	console.log(`======================================================\n`);
}

module.exports = {
	analyzeSchema,
	updateSchemaSummary,
	getSchemaSummary,
	scaffoldUnit,
	findExistingUnit,
	deduceExistingVerbStem,
	generateVerbSuffixSnippet,
	detectProperNameCandidate,
	recognizeCompoundParticle,
	decomposeCompoundParticle
};
