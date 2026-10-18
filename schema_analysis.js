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
 * Generates an intelligent draft language unit skeleton using the schema taxonomy.
 */
function scaffoldUnit(korean, source = "studytext", context = {}, summary = null) {
	const tax = summary || getSchemaSummary();
	const word = String(korean || "").trim();

	let pos = "Noun";
	let tags = ["general"];
	let conjugation = "";
	let vector = { domain: "concept", type: "general" };
	let syntaxFrame = "";
	let english = `<English definition of "${word}">`;

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
	scaffoldUnit
};
