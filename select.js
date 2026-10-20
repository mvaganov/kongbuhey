#!/usr/bin/env node
/**
 * select.js - SQL-like query and data manipulation CLI tool for kongbuhey's data.js.
 *
 * Pure JavaScript, no external dependencies.
 *
 * Capabilities:
 *   - SELECT: Extract subsets of KR_EN_languageUnits by columns, with WHERE, ORDER BY, LIMIT, OFFSET.
 *   - UPDATE: Update language units in data.js from an edited file (JSON, JSONL, TSV) or inline SQL.
 *   - INSERT: Add new language units to data.js from a file or inline SQL.
 *   - DELETE: Remove language units matching WHERE criteria.
 *
 * Output Formats: json (default), jsonl, tsv, table, raw
 */
function printHelp() {
	console.log(`select.js - SQL-like CLI for data.js KR_EN_languageUnits (pure JS, zero dependencies)

USAGE:
  node select.js <COMMAND> [OPTIONS]

COMMANDS:
  SELECT <cols|*> [WHERE <cond>] [ORDER BY <col> [ASC|DESC]] [LIMIT <n>] [OFFSET <n>] [FORMAT <fmt>]
  COUNT [WHERE <cond>]                      Count matching rows (returns single int)
  UPDATE [cols...] FROMFILE <file>          Update matching rows by Id (or Korean)
  UPDATE [KR_EN_languageUnits] SET <col>=<val> [WHERE <cond>]
  INSERT FROMFILE <file> [--source <tag>]   Insert units (JSON/TSV). Provide explicit Id to avoid collisions!
  INSERT INTO KR_EN_languageUnits (<cols>) VALUES (<vals>)
  DELETE FROM KR_EN_languageUnits WHERE <cond>
  ADD <col> <defaultVal> (FIRST|LAST|AFTER <c>|BEFORE <c>)   Alter schema & rows
  AUDIT [SEMANTIC]                          Audit verbs for semantic rule coverage and starvation

OPTIONS:
  --source, -s <tag>   Curriculum source for inserted units (default: ::YYYYMMDD)
  --format <fmt>       tsv, jsonl, json, table, raw
                       (Auto: TSV if complexity <= 8, else JSONL. JSON used only when explicitly requested.)
  --summary [n]        Truncate large results after n rows (default: 5) with a '... [{n} more rows truncated]' suffix
  --strict             Fail fast with error on semantic diversity warnings or unregistered tags
  --dry-run            Preview changes without modifying data.js
  -v, --verbose        Include detailed operation messages (quiet by default on mutations)
  --data <path>        Custom data file (default: ./data.js)

SCHEMA COLUMNS (aliases: id, ko, en, pos, tags, disambig, conj, src, score, formality, honorific, vector):
  0. Id (int, PK)               6. Conjugation (str rule or array of formulas)
  1. Korean (str)               7. Source (curriculum tag, e.g. SUOBI01, class2012)
  2. English (str)              8. PriorityScore (int 1-5, TOPIK learner tier)
  3. PartofSpeech (str)         9. FormalityLevel (str)
  4. SemanticTags (str[])      10. HonorificRules (str)
  5. Disambiguation (str)      11. SemanticVector (JSON str, e.g. {"domain":"..."})

WHERE OPERATORS:
  =, !=, <, >, <=, >=, AND, OR, LIKE '%pat%', NOT LIKE, CONTAINS 'tag', NOT CONTAINS, IN ('a','b'), NOT IN

KEY LLM WORKFLOW PATTERNS:
  Find next ID:  node select.js "SELECT Id ORDER BY Id DESC LIMIT 1"
  Count rows:    node select.js "COUNT WHERE Source = 'class2012'"
  Query to TSV:  node select.js "SELECT Id, Korean, English WHERE Source = 'SUOBI01'"
  Export subset: node select.js "SELECT Id, Korean, SemanticVector WHERE Id < 50" > output.txt
  Update back:   node select.js UPDATE Korean, SemanticVector FROMFILE output.txt
  Insert batch:  node select.js INSERT FROMFILE new_units.json --source class2012 --dry-run
  Inspect tag:   node select.js "SELECT Id, Korean WHERE SemanticTags CONTAINS 'food' LIMIT 10"
  Query JSON:    node select.js "SELECT Id, Korean, sv.domain, sv.polarity WHERE sv.domain = 'age'"
`);
}

const fs = require('fs');
const path = require('path');

const {
	ACTION_VERB_SPECS,
	DESCRIPTIVE_VERB_SPECS,
	getNounCandidatesForVerb,
	getSubjectCandidatesForDescriptiveVerb,
	parseAndValidateCollocationFilter,
	hasTag
} = require('./korean.js');

const DATA_FILE_PATH = path.resolve(__dirname, 'data.js');

// --- Schema Definitions ---
let SCHEMA_COLUMNS = [
	{ name: "Id", index: 0, type: "number" },
	{ name: "Korean", index: 1, type: "string" },
	{ name: "English", index: 2, type: "string" },
	{ name: "PartofSpeech", index: 3, type: "string" },
	{ name: "SemanticTags", index: 4, type: "tags" },
	{ name: "Disambiguation", index: 5, type: "string" },
	{ name: "Conjugation", index: 6, type: "conjugation" },
	{ name: "Source", index: 7, type: "string" },
	{ name: "PriorityScore", index: 8, type: "number" },
	{ name: "FormalityLevel", index: 9, type: "string" },
	{ name: "HonorificRules", index: 10, type: "string" },
	{ name: "SemanticVector", index: 11, type: "json" }
];

function getSchemaColumns(DATA_SCHEMA) {
	if (!DATA_SCHEMA) return SCHEMA_COLUMNS;
	const cols = [];
	for (let i = 0; ; i++) {
		if (DATA_SCHEMA[i] !== undefined) {
			const name = DATA_SCHEMA[i];
			let type = "string";
			if (name === "Id" || name === "PriorityScore") type = "number";
			else if (name === "SemanticTags") type = "tags";
			else if (name === "Conjugation") type = "conjugation";
			else if (name === "SemanticVector") type = "json";
			cols.push({ name, index: i, type });
		} else {
			break;
		}
	}
	return cols.length > 0 ? cols : SCHEMA_COLUMNS;
}

try {
	const initialData = require(DATA_FILE_PATH);
	if (initialData && initialData.DATA_SCHEMA) {
		SCHEMA_COLUMNS = getSchemaColumns(initialData.DATA_SCHEMA);
	}
} catch (_) { }

const COLUMN_ALIASES = {
	"korean": "Korean", "ko": "Korean",
	"english": "English", "en": "English",
	"partofspeech": "PartofSpeech", "pos": "PartofSpeech", "part_of_speech": "PartofSpeech",
	"semantictags": "SemanticTags", "tags": "SemanticTags", "semantic_tags": "SemanticTags", "tag": "SemanticTags",
	"disambiguation": "Disambiguation", "disambig": "Disambiguation",
	"conjugation": "Conjugation", "formula": "Conjugation", "conjugationrules": "Conjugation", "conjugation_rules": "Conjugation",
	"source": "Source", "src": "Source", "curriculum": "Source",
	"priorityscore": "PriorityScore", "priority": "PriorityScore", "score": "PriorityScore", "ps": "PriorityScore",
	"formalitylevel": "FormalityLevel", "formality": "FormalityLevel", "formality_level": "FormalityLevel",
	"honorificrules": "HonorificRules", "honorific": "HonorificRules", "honorific_rules": "HonorificRules",
	"semanticvector": "SemanticVector", "vector": "SemanticVector", "semantic_vector": "SemanticVector", "sv": "SemanticVector",
	"id": "Id", "index": "Id", "rowid": "Id", "id_num": "Id"
};

function normalizeColumnName(col) {
	if (!col) return null;
	const clean = col.trim().replace(/^[`'"]+|[`'"]+$/g, '');
	if (clean === '*') return '*';
	const lower = clean.toLowerCase();
	if (COLUMN_ALIASES[lower]) return COLUMN_ALIASES[lower];
	const found = SCHEMA_COLUMNS.find(c => c.name.toLowerCase() === lower);
	return found ? found.name : clean;
}

// --- Default Source Generator (::YYYYMMDD) ---
function getDefaultSource(date = new Date()) {
	const yyyy = date.getFullYear();
	const mm = String(date.getMonth() + 1).padStart(2, '0');
	const dd = String(date.getDate()).padStart(2, '0');
	return `::${yyyy}${mm}${dd}`;
}

// --- Data Loading ---
function loadData(filePath = DATA_FILE_PATH) {
	// Clear node cache to get fresh data
	const resolved = path.resolve(filePath);
	delete require.cache[resolved];
	const dataModule = require(resolved);
	const KR_EN_languageUnits = dataModule.KR_EN_languageUnits;
	const DATA_SCHEMA = dataModule.DATA_SCHEMA;

	if (DATA_SCHEMA) {
		SCHEMA_COLUMNS = getSchemaColumns(DATA_SCHEMA);
	}

	// Ensure Id is assigned to each unit
	KR_EN_languageUnits.forEach((unit, idx) => {
		unit[DATA_SCHEMA.Id] = idx;
	});

	return { KR_EN_languageUnits, DATA_SCHEMA };
}

// --- Record Formatting & Conversion ---
function unitToRecord(unit, selectedCols = null, DATA_SCHEMA) {
	const cols = (selectedCols && selectedCols.length > 0 && selectedCols[0] !== '*')
		? selectedCols
		: SCHEMA_COLUMNS.map(c => c.name);

	const record = {};
	for (const col of cols) {
		if (col.includes('.')) {
			const parts = col.split('.');
			const rootCol = normalizeColumnName(parts[0]);
			if (rootCol === 'SemanticVector') {
				const raw = unit[DATA_SCHEMA.SemanticVector];
				let parsed = null;
				if (typeof raw === 'object' && raw !== null) parsed = raw;
				else if (typeof raw === 'string' && raw.trim()) {
					try { parsed = JSON.parse(raw); } catch (_) { parsed = null; }
				}
				let cur = parsed;
				for (const p of parts.slice(1)) {
					cur = (cur && typeof cur === 'object') ? cur[p] : undefined;
				}
				record[col] = cur !== undefined ? cur : null;
				continue;
			}
		}

		const canonical = normalizeColumnName(col);
		if (!canonical) continue;
		if (canonical === 'Id') {
			record.Id = typeof unit[DATA_SCHEMA.Id] === 'number' ? unit[DATA_SCHEMA.Id] : -1;
		} else if (canonical === 'SemanticTags') {
			const raw = unit[DATA_SCHEMA.SemanticTags];
			record.SemanticTags = raw instanceof Set ? Array.from(raw) : (Array.isArray(raw) ? raw : []);
		} else {
			const idx = DATA_SCHEMA[canonical];
			record[canonical] = idx !== undefined && unit[idx] !== undefined ? unit[idx] : "";
		}
	}
	return record;
}

function formatColumnValue(colName, val) {
	const canonical = normalizeColumnName(colName);
	if (canonical === 'Id') {
		const num = typeof val === 'number' ? val : (parseInt(val, 10) || 0);
		return String(num);
	}
	if (canonical === 'PriorityScore') {
		const num = typeof val === 'number' ? val : (Number(val) || 99);
		return String(num);
	}
	if (canonical === 'SemanticTags') {
		let tagsArr = [];
		if (val instanceof Set) tagsArr = Array.from(val);
		else if (Array.isArray(val)) tagsArr = val;
		return tagsArr.length === 0 ? "[]" : `[${tagsArr.map(t => JSON.stringify(t)).join(', ')}]`;
	}
	if (canonical === 'Conjugation') {
		if (Array.isArray(val)) {
			return val.length === 0 ? "[]" : `[${val.map(c => JSON.stringify(c)).join(', ')}]`;
		}
		return JSON.stringify(val ?? "");
	}
	if (canonical === 'SemanticVector') {
		if (val !== undefined && val !== null && val !== "") {
			const s = typeof val === 'object' ? JSON.stringify(val) : String(val);
			return (s.startsWith('{') && !s.includes("'")) ? `'${s}'` : JSON.stringify(s);
		}
		return '""';
	}
	if (typeof val === 'number') {
		return String(val);
	}
	return JSON.stringify(val ?? "");
}

function formatUnitLine(unit, isLast = false, schemaCols = SCHEMA_COLUMNS) {
	const elements = schemaCols.map(col => {
		const val = unit[col.index];
		return formatColumnValue(col.name, val);
	});
	return `\t[${elements.join(', ')}]${isLast ? "" : ","}`;
}

function buildUnitFromRecord(rec, resolvedSource, newId = 0, schemaCols = SCHEMA_COLUMNS) {
	return schemaCols.map(col => {
		if (col.name === 'Id') {
			return (rec.Id !== undefined && rec.Id !== null && rec.Id !== "" && !isNaN(rec.Id))
				? parseInt(rec.Id, 10)
				: newId;
		}
		if (col.name === 'Source') {
			return (rec.Source && rec.Source.trim()) || resolvedSource;
		}
		if (col.name === 'PriorityScore') {
			return (rec.PriorityScore !== undefined && rec.PriorityScore !== null && rec.PriorityScore !== "" && !isNaN(rec.PriorityScore))
				? Number(rec.PriorityScore)
				: 99;
		}
		if (col.name === 'SemanticTags') {
			let tagsArr = [];
			if (rec.SemanticTags instanceof Set) tagsArr = Array.from(rec.SemanticTags);
			else if (Array.isArray(rec.SemanticTags)) tagsArr = rec.SemanticTags;
			else if (typeof rec.SemanticTags === 'string') {
				try {
					const parsed = JSON.parse(rec.SemanticTags);
					if (Array.isArray(parsed)) tagsArr = parsed;
				} catch (_) {
					tagsArr = rec.SemanticTags.split(',').map(t => t.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
				}
			}
			return tagsArr;
		}
		if (col.name === 'PartofSpeech') {
			return rec.PartofSpeech || "Noun";
		}
		return rec[col.name] !== undefined ? rec[col.name] : (col.type === 'number' ? 0 : "");
	});
}

/**
 * Resolves the specific semantic constraint tag or mechanism responsible for
 * filtering arguments for a given verb.
 */
function getVerbSemanticConstraint(unit, schemaCols = SCHEMA_COLUMNS) {
	if (!unit) return "unknown";
	const getIdx = (colName) => {
		const found = schemaCols.find ? schemaCols.find(c => c.name === colName) : null;
		if (found) return found.index;
		return schemaCols[colName] !== undefined ? schemaCols[colName] : -1;
	};
	const svIdx = getIdx("SemanticVector");
	const posIdx = getIdx("PartofSpeech");
	const tagsIdx = getIdx("SemanticTags");
	const svVal = svIdx >= 0 ? unit[svIdx] : null;

	let sv = {};
	try { sv = typeof svVal === 'string' ? JSON.parse(svVal) : svVal; } catch (_) {}

	const pos = posIdx >= 0 ? unit[posIdx] : "Noun";
	const tagsVal = tagsIdx >= 0 ? unit[tagsIdx] : [];
	const tags = tagsVal instanceof Set ? Array.from(tagsVal) : (Array.isArray(tagsVal) ? tagsVal : []);

	// Prioritize the specific semantic selection tag responsible for the restriction
	let specTag = null;
	if (pos === "Descriptive Verb") {
		const spec = DESCRIPTIVE_VERB_SPECS.find(s => tags.includes(s.tag));
		if (spec) specTag = spec.tag;
	} else if (pos === "Action Verb") {
		const spec = ACTION_VERB_SPECS.find(s => tags.includes(s.tag));
		if (spec) specTag = spec.tag;
	}
	if (!specTag) {
		const anySelTag = tags.find(t => t.startsWith("transitive_") || t.startsWith("descriptive_") || t.startsWith("intransitive_") || t.startsWith("dative_"));
		if (anySelTag) specTag = anySelTag;
	}

	if (specTag) {
		return specTag;
	}

	if (sv && sv.collocation_filter) return "collocation_filter";
	if (sv && sv.req && sv.req !== 'any') return `sv.req (${sv.req})`;

	return "global fallback (object)";
}

/**
 * Detects whether a language unit has conflated multiple distinct homonymous/polysemous
 * senses with divergent semantic selection constraints into a single row.
 *
 * @param {Array} unit - The 12-column language unit array.
 * @param {Object} schemaCols - Schema columns or index map.
 * @returns {string[]|null} List of ambiguity conflict reasons, or null if none.
 */
function detectUndifferentiatedHomonym(unit, schemaCols = SCHEMA_COLUMNS) {
	if (!unit) return null;
	const getIdx = (colName) => {
		const found = schemaCols.find ? schemaCols.find(c => c.name === colName) : null;
		if (found) return found.index;
		return schemaCols[colName] !== undefined ? schemaCols[colName] : -1;
	};

	const posIdx = getIdx("PartofSpeech");
	const koIdx = getIdx("Korean");
	const idIdx = getIdx("Id");
	const enIdx = getIdx("English");
	const disIdx = getIdx("Disambiguation");
	const tagsIdx = getIdx("SemanticTags");
	const svIdx = getIdx("SemanticVector");

	const pos = posIdx >= 0 ? unit[posIdx] : "Noun";
	if (pos !== "Action Verb" && pos !== "Descriptive Verb") return null;

	const id = idIdx >= 0 ? unit[idIdx] : "?";
	const ko = koIdx >= 0 ? unit[koIdx] : "?";
	const en = (enIdx >= 0 ? unit[enIdx] : "") || "";
	const dis = (disIdx >= 0 ? unit[disIdx] : "") || "";
	const tagsVal = tagsIdx >= 0 ? unit[tagsIdx] : [];
	const tags = tagsVal instanceof Set ? Array.from(tagsVal) : (Array.isArray(tagsVal) ? tagsVal : []);
	const svVal = svIdx >= 0 ? unit[svIdx] : null;

	let sv = {};
	try { sv = typeof svVal === 'string' ? JSON.parse(svVal) : svVal; } catch (_) {}

	const selTags = tags.filter(t => t.startsWith('transitive_') || t.startsWith('descriptive_') || t.startsWith('intransitive_') || t.startsWith('dative_'));
	const issues = [];

	// 1. Cross-Domain Conflations in Tags
	const hasWeather = tags.includes('weather') || (sv && sv.domain === 'weather');
	const hasWearable = tags.includes('wearable') || tags.includes('clothing') || tags.includes('footwear') || tags.includes('handwear') || (sv && sv.domain === 'clothing');
	const hasFood = tags.includes('food') || tags.includes('drink') || tags.includes('cooking') || (sv && sv.domain === 'food');
	const hasTransport = tags.includes('transportation') || tags.includes('vehicle') || (sv && sv.domain === 'transportation');
	const hasSports = tags.includes('sports') || selTags.includes('transitive_sports');
	const hasInstrument = tags.includes('instrument') || tags.includes('music') || selTags.includes('transitive_instrument');
	const hasPostal = tags.includes('postal') || (sv && sv.domain === 'postal');
	const hasTheater = tags.includes('theater') || tags.includes('acting');
	const hasSchedule = tags.includes('schedule');

	if (hasWeather && hasWearable) {
		issues.push("Contradictory domain tags conflated: 'weather' + 'wearable/clothing'");
	}
	if (hasWeather && hasFood) {
		issues.push("Contradictory domain tags conflated: 'weather' + 'food/cooking'");
	}
	if (hasWeather && hasTransport) {
		issues.push("Contradictory domain tags conflated: 'weather' + 'transportation'");
	}
	if (hasSports && hasInstrument) {
		issues.push("Contradictory domain tags conflated: 'sports' + 'musical instrument'");
	}
	if (hasPostal && hasFood) {
		issues.push("Contradictory domain tags conflated: 'postal' + 'food/cooking'");
	}
	if (hasSchedule && hasTheater) {
		issues.push("Contradictory domain tags conflated: 'schedule' + 'theater/acting'");
	}

	// 2. Domain vs Selection Tag Contradiction
	if (sv && sv.domain) {
		if (sv.domain === 'weather' && selTags.some(t => t.includes('handwear') || t.includes('clothing') || t.includes('footwear') || t.includes('neckwear'))) {
			issues.push(`SemanticVector domain '${sv.domain}' contradicts wearable selection tag: ${selTags.join(', ')}`);
		}
		if (sv.domain === 'clothing' && tags.includes('weather')) {
			issues.push(`SemanticVector domain '${sv.domain}' contradicts 'weather' tag`);
		}
	}

	// 3. Mutually exclusive specific selection tags
	const specificTrans = selTags.filter(t => 
		t.includes('neckwear') || t.includes('handwear') || t.includes('footwear') || 
		t.includes('headwear') || t.includes('watch') || t.includes('sports') || 
		t.includes('instrument')
	);
	if (specificTrans.length > 1) {
		const hasTwoIncompatible = (
			(specificTrans.includes('transitive_sports') && specificTrans.includes('transitive_instrument')) ||
			(specificTrans.some(t => t.includes('wear') || t.includes('watch')) && specificTrans.some(t => t.includes('sports') || t.includes('instrument')))
		);
		if (hasTwoIncompatible) {
			issues.push(`Multiple mutually incompatible specific selection tags: ${specificTrans.join(' vs ')}`);
		}
	}

	// 4. Divergent senses in definition where a specific constraint only applies to one sense
	const enLower = en.toLowerCase();
	const distinctParens = [...new Set(((en + ' ' + dis).match(/\(([^)]+)\)/g) || []).map(p => p.toLowerCase()))];
	if (distinctParens.length >= 2 && (specificTrans.length > 0 || (sv && sv.collocation_filter))) {
		const isCrossDomainParen = (
			(distinctParens.some(p => p.includes('weather') || p.includes('rain') || p.includes('fog')) &&
			 distinctParens.some(p => p.includes('cloth') || p.includes('ring') || p.includes('glove') || p.includes('bag') || p.includes('bedding'))) ||
			(distinctParens.some(p => p.includes('sport') || p.includes('tennis')) &&
			 distinctParens.some(p => p.includes('piano') || p.includes('instrument')))
		);
		if (isCrossDomainParen) {
			issues.push(`Divergent domain senses in definition: ${distinctParens.join(' vs ')} with specific constraint`);
		}
	}

	if (specificTrans.length > 0) {
		for (const st of specificTrans) {
			if (st === 'transitive_handwear' && (enLower.includes('fog') || enLower.includes('trap'))) {
				issues.push(`Selection tag '${st}' applies only to handwear, but definition includes '${en}'`);
			}
			if (st === 'transitive_watch' && (enLower.includes('kick') || enLower.includes('cold') || enLower.includes('full'))) {
				issues.push(`Selection tag '${st}' applies only to watch, but definition includes '${en}'`);
			}
		}
	}

	return issues.length > 0 ? issues : null;
}

/**
 * Validates a language unit against the semantic argument selection rules and taxonomy.
 * Emits actionable error messages with direct pointers to korean.js specifications.
 *
 * @param {Array} unit - The 12-column language unit array.
 * @param {Array[]} allUnits - The full curriculum unit array (for context).
 * @param {Object} schemaCols - The schema column definitions or index map.
 * @param {Object} options - Configuration options ({ strict: boolean, strictAmbiguity: boolean }).
 */
function validateLanguageUnitSemanticSelection(unit, allUnits, schemaCols = SCHEMA_COLUMNS, options = {}) {
	if (!unit) return;
	const getIdx = (colName) => {
		const found = schemaCols.find ? schemaCols.find(c => c.name === colName) : null;
		if (found) return found.index;
		return schemaCols[colName] !== undefined ? schemaCols[colName] : -1;
	};

	const posIdx = getIdx("PartofSpeech");
	const koIdx = getIdx("Korean");
	const idIdx = getIdx("Id");
	const tagsIdx = getIdx("SemanticTags");
	const svIdx = getIdx("SemanticVector");

	const pos = posIdx >= 0 ? unit[posIdx] : "Noun";
	const id = idIdx >= 0 ? unit[idIdx] : "?";
	const ko = koIdx >= 0 ? unit[koIdx] : "?";
	const tagsVal = tagsIdx >= 0 ? unit[tagsIdx] : [];
	const tags = tagsVal instanceof Set ? Array.from(tagsVal) : (Array.isArray(tagsVal) ? tagsVal : []);

	// 1. Validate collocation_filter in SemanticVector if present
	const svVal = svIdx >= 0 ? unit[svIdx] : null;
	if (svVal) {
		try {
			const parsed = typeof svVal === 'string' ? JSON.parse(svVal) : svVal;
			if (parsed && parsed.collocation_filter) {
				parseAndValidateCollocationFilter(parsed.collocation_filter, id);
			}
		} catch (filterErr) {
			const errMsg = `[SEMANTIC FILTER ERROR] Unit '${ko}' (Id: ${id}) has invalid collocation_filter: ${filterErr.message}\n` +
				`-> Location: SemanticVector column in data.js\n` +
				`-> Expected format: /*js:filter*/ (noun, hasTag) => ...\n` +
				`-> See korean.js (parseAndValidateCollocationFilter, lines ~410-465) for specifications.`;
			if (options.strict) throw new Error(errMsg);
			else console.error(`\n${errMsg}\n`);
		}
	}

	// 2. Check for Undifferentiated Homonym / Ambiguity Conflation
	const ambiguityIssues = detectUndifferentiatedHomonym(unit, schemaCols);
	if (ambiguityIssues && ambiguityIssues.length > 0) {
		const warnMsg = `[SEMANTIC AMBIGUITY WARNING] Verb '${ko}' (Id: ${id}) appears to combine multiple distinct senses with conflicting selection constraints:\n` +
			ambiguityIssues.map(iss => `  * ${iss}`).join('\n') + '\n' +
			`-> RECOMMENDATION: A word with definitions implying distinct uses should have separate entries if any use requires distinct semantic tags (e.g. '이' has Id:237 [number], Id:361 [teeth], Id:1618 [determiner]).\n` +
			`-> Split '${ko}' into distinct entries with differentiated Disambiguations and targeted tags.\n`;
		if (options.strictAmbiguity) throw new Error(warnMsg);
		else console.warn(`\n${warnMsg}`);
	}

	// 3. Validate Descriptive Verbs
	if (pos === "Descriptive Verb") {
		const descriptiveTags = new Set(DESCRIPTIVE_VERB_SPECS.map(s => s.tag));
		for (const tag of tags) {
			if (tag.startsWith("descriptive_") && !descriptiveTags.has(tag)) {
				const errMsg = `[SEMANTIC SELECTION RULE ERROR] Descriptive Verb '${ko}' (Id: ${id}) has unrecognized selection tag '${tag}'.\n` +
					`-> This tag is NOT registered in DESCRIPTIVE_VERB_SPECS in korean.js!\n` +
					`-> To establish argument selection rules for '${tag}', register it in korean.js (DESCRIPTIVE_VERB_SPECS, lines ~335-408):\n` +
					`     { tag: "${tag}", nounTag: "<targetNounTag>", fallbackTag: "<optionalFallback>" }\n` +
					`-> See korean.js: 'HOW TO ADD A NEW SEMANTIC SELECTION TAG WITH NEW RULES'.`;
				if (options.strict) throw new Error(errMsg);
				else console.warn(`\n${errMsg}\n`);
			}
		}

		const hasSuppressDiversity = tags.some(t => {
			const u = String(t).toUpperCase();
			return u === 'SUPPRESS_SEMANTIC_DIVERSITY_WARNING' || u === 'SUPRESS_SEMANTIC_DIVERSITY_WARNING';
		});

		try {
			const cands = getSubjectCandidatesForDescriptiveVerb(unit);
			const constraint = getVerbSemanticConstraint(unit, schemaCols);
			if (cands.length === 0) {
				const errMsg = `[SEMANTIC STARVATION ERROR] Descriptive Verb '${ko}' (Id: ${id}) has ZERO valid candidate subjects under constraint '${constraint}'!\n` +
					`-> Sentence generation with this verb will be impossible or blocked.\n` +
					`-> Check korean.js (DESCRIPTIVE_VERB_SPECS, lines ~335-408) to verify target nounTag or add matching nouns in data.js.`;
				if (options.strict) throw new Error(errMsg);
				else console.error(`\n${errMsg}\n`);
			} else if (cands.length < 3 && !hasSuppressDiversity) {
				console.warn(`\n[SEMANTIC DIVERSITY WARNING] Descriptive Verb '${ko}' (Id: ${id}) has only ${cands.length} valid candidate subject(s) (${cands.map(c => koIdx >= 0 ? c[koIdx] : c[1]).join(', ')}) under constraint '${constraint}'.\n` +
					`-> Expected at least 3 candidates to ensure diverse sentence generation.\n` +
					`-> Check korean.js (DESCRIPTIVE_VERB_SPECS) or expand matching nouns in data.js.\n`);
			}
		} catch (candErr) {
			console.error(`\n[SEMANTIC EVALUATION ERROR] Failed to resolve subject candidates for '${ko}' (Id: ${id}): ${candErr.message}\n`);
		}
	}

	// 4. Validate Action Verbs
	if (pos === "Action Verb") {
		const actionTags = new Set(ACTION_VERB_SPECS.map(s => s.tag));
		for (const tag of tags) {
			if ((tag.startsWith("transitive_") || tag.startsWith("intransitive_") || tag.startsWith("dative_")) && !actionTags.has(tag)) {
				const errMsg = `[SEMANTIC SELECTION RULE ERROR] Action Verb '${ko}' (Id: ${id}) has unrecognized selection tag '${tag}'.\n` +
					`-> This tag is NOT registered in ACTION_VERB_SPECS in korean.js!\n` +
					`-> To establish argument selection rules for '${tag}', register it in korean.js (ACTION_VERB_SPECS, lines ~280-334):\n` +
					`     { tag: "${tag}", nounTag: "<targetNounTag>", particle: "object"|"location"|"dative" }\n` +
					`-> See korean.js: 'HOW TO ADD A NEW SEMANTIC SELECTION TAG WITH NEW RULES'.`;
				if (options.strict) throw new Error(errMsg);
				else console.warn(`\n${errMsg}\n`);
			}
		}

		const isPureIntransitive = hasTag(unit, "intransitive_general") || hasTag(unit, "intransitive_food");
		if (!isPureIntransitive) {
			const hasSuppressDiversity = tags.some(t => {
				const u = String(t).toUpperCase();
				return u === 'SUPPRESS_SEMANTIC_DIVERSITY_WARNING' || u === 'SUPRESS_SEMANTIC_DIVERSITY_WARNING';
			});
			try {
				const cands = getNounCandidatesForVerb(unit);
				const constraint = getVerbSemanticConstraint(unit, schemaCols);
				if (cands.length === 0) {
					const errMsg = `[SEMANTIC STARVATION ERROR] Action Verb '${ko}' (Id: ${id}) has ZERO valid candidate noun arguments under constraint '${constraint}'!\n` +
						`-> Check korean.js (ACTION_VERB_SPECS, lines ~280-334) or collocation_filter in data.js.`;
					if (options.strict) throw new Error(errMsg);
					else console.error(`\n${errMsg}\n`);
				} else if (cands.length < 3 && !hasSuppressDiversity) {
					console.warn(`\n[SEMANTIC DIVERSITY WARNING] Action Verb '${ko}' (Id: ${id}) has only ${cands.length} valid candidate noun(s) (${cands.map(c => koIdx >= 0 ? c[koIdx] : c[1]).join(', ')}) under constraint '${constraint}'.\n` +
						`-> Expected at least 3 candidates to ensure diverse sentence generation.\n` +
						`-> Check korean.js (ACTION_VERB_SPECS) or expand matching nouns in data.js.\n`);
				}
			} catch (candErr) {
				console.error(`\n[SEMANTIC EVALUATION ERROR] Failed to resolve noun candidates for '${ko}' (Id: ${id}): ${candErr.message}\n`);
			}
		}
	}
}

/**
 * Audits all language units in data.js for semantic argument selection coverage,
 * identifying unregistered selection tags, zero-candidate starvation, and low-diversity verbs.
 */
function auditSemanticRules(options = {}) {
	const dataPath = options.dataFile || DATA_FILE_PATH;
	const { KR_EN_languageUnits, DATA_SCHEMA } = loadData(dataPath);
	console.log(`\n======================================================`);
	console.log(` AUDITING SEMANTIC SELECTION RULES & CANDIDATE POOLS  `);
	console.log(` Dataset: ${path.basename(dataPath)} (${KR_EN_languageUnits.length} units)`);
	console.log(`======================================================\n`);

	let verbCount = 0;
	let starvedCount = 0;
	let lowDiversityCount = 0;
	let unregTagCount = 0;
	let ambiguousCount = 0;

	const actionTags = new Set(ACTION_VERB_SPECS.map(s => s.tag));
	const descriptiveTags = new Set(DESCRIPTIVE_VERB_SPECS.map(s => s.tag));

	for (const unit of KR_EN_languageUnits) {
		if (!unit) continue;
		const pos = unit[DATA_SCHEMA.PartofSpeech];
		const id = unit[DATA_SCHEMA.Id];
		const ko = unit[DATA_SCHEMA.Korean];
		const tags = Array.from(unit[DATA_SCHEMA.SemanticTags] || []);

		if (pos === "Descriptive Verb" || pos === "Action Verb") {
			verbCount++;
			const ambig = detectUndifferentiatedHomonym(unit, DATA_SCHEMA);
			if (ambig && ambig.length > 0) {
				ambiguousCount++;
				console.warn(`[AMBIGUOUS HOMONYM] ${pos} '${ko}' (Id: ${id}): ${ambig.join('; ')}`);
			}
		}

		const hasSuppressDiversity = tags.some(t => {
			const u = String(t).toUpperCase();
			return u === 'SUPPRESS_SEMANTIC_DIVERSITY_WARNING' || u === 'SUPRESS_SEMANTIC_DIVERSITY_WARNING';
		});

		if (pos === "Descriptive Verb") {
			for (const t of tags) {
				if (t.startsWith("descriptive_") && !descriptiveTags.has(t)) {
					unregTagCount++;
					console.warn(`[UNREGISTERED TAG] Descriptive Verb '${ko}' (Id: ${id}): tag '${t}' not in DESCRIPTIVE_VERB_SPECS in korean.js`);
				}
			}
			const cands = getSubjectCandidatesForDescriptiveVerb(unit);
			const constraint = getVerbSemanticConstraint(unit, DATA_SCHEMA);
			if (cands.length === 0) {
				starvedCount++;
				console.error(`[STARVATION] Descriptive Verb '${ko}' (Id: ${id}) has 0 candidate subjects under constraint '${constraint}'!`);
			} else if (cands.length < 3 && !hasSuppressDiversity) {
				lowDiversityCount++;
				console.warn(`[LOW DIVERSITY] Descriptive Verb '${ko}' (Id: ${id}) has only ${cands.length} candidate(s): ${cands.map(c => c[DATA_SCHEMA.Korean]).join(', ')} under constraint '${constraint}'`);
			}
		} else if (pos === "Action Verb") {
			for (const t of tags) {
				if ((t.startsWith("transitive_") || t.startsWith("intransitive_") || t.startsWith("dative_")) && !actionTags.has(t)) {
					unregTagCount++;
					console.warn(`[UNREGISTERED TAG] Action Verb '${ko}' (Id: ${id}): tag '${t}' not in ACTION_VERB_SPECS in korean.js`);
				}
			}
			const isPureIntransitive = hasTag(unit, "intransitive_general") || hasTag(unit, "intransitive_food");
			if (!isPureIntransitive) {
				const cands = getNounCandidatesForVerb(unit);
				const constraint = getVerbSemanticConstraint(unit, DATA_SCHEMA);
				if (cands.length === 0) {
					starvedCount++;
					console.error(`[STARVATION] Action Verb '${ko}' (Id: ${id}) has 0 candidate objects under constraint '${constraint}'!`);
				} else if (cands.length < 3 && !hasSuppressDiversity) {
					lowDiversityCount++;
					console.warn(`[LOW DIVERSITY] Action Verb '${ko}' (Id: ${id}) has only ${cands.length} candidate(s): ${cands.map(c => c[DATA_SCHEMA.Korean]).join(', ')} under constraint '${constraint}'`);
				}
			}
		}
	}

	console.log(`\n------------------------------------------------------`);
	console.log(`Audited ${verbCount} verbs in ${path.basename(dataPath)}:`);
	console.log(`  Unregistered selection tags : ${unregTagCount}`);
	console.log(`  Starved verbs (0 candidates): ${starvedCount}`);
	console.log(`  Low diversity (<3 candidates): ${lowDiversityCount}`);
	console.log(`  Ambiguous homonym conflations: ${ambiguousCount}`);
	console.log(`======================================================\n`);

	return {
		totalVerbs: verbCount,
		unregisteredTags: unregTagCount,
		starvedVerbs: starvedCount,
		lowDiversityVerbs: lowDiversityCount,
		ambiguousHomonyms: ambiguousCount,
		format: 'text'
	};
}

// --- WHERE Clause Evaluation ---
function parseWhereTokens(clauseStr) {
	if (!clauseStr || !clauseStr.trim()) return [];
	// Split into tokens: words, quoted strings, operators
	const regex = /([`'"].*?[`'"]|\bAND\b|\bOR\b|<=|>=|!=|<>|=|<|>|\bLIKE\b|\bNOT\s+LIKE\b|\bCONTAINS\b|\bIN\b|\bNOT\s+IN\b|[(),]|[\w.-]+)/gi;
	const tokens = [];
	let match;
	while ((match = regex.exec(clauseStr)) !== null) {
		tokens.push(match[0]);
	}
	return tokens;
}

function matchLike(str, pattern) {
	if (str === null || str === undefined) return false;
	const regexPattern = "^" + String(pattern)
		.replace(/[.+^${}()|[\]\\]/g, '\\$&')
		.replace(/%/g, '.*')
		.replace(/_/g, '.') + "$";
	return new RegExp(regexPattern, 'i').test(String(str));
}

function evaluatePredicate(unit, colName, op, valStr, DATA_SCHEMA) {
	let unitVal;
	let isArrayVal = false;
	const isJsonPath = colName.includes('.');

	if (isJsonPath) {
		const parts = colName.split('.');
		const rootCol = normalizeColumnName(parts[0]);
		if (rootCol === 'SemanticVector') {
			const raw = unit[DATA_SCHEMA.SemanticVector];
			let parsed = null;
			if (typeof raw === 'object' && raw !== null) parsed = raw;
			else if (typeof raw === 'string' && raw.trim()) {
				try { parsed = JSON.parse(raw); } catch (_) { parsed = null; }
			}
			let cur = parsed;
			for (const p of parts.slice(1)) {
				cur = (cur && typeof cur === 'object') ? cur[p] : undefined;
			}
			unitVal = cur;
			if (Array.isArray(unitVal)) isArrayVal = true;
		} else {
			return false;
		}
	} else {
		const canonical = normalizeColumnName(colName);
		if (!canonical) return false;

		if (canonical === 'Id') {
			unitVal = unit[DATA_SCHEMA.Id];
		} else if (canonical === 'SemanticTags') {
			unitVal = unit[DATA_SCHEMA.SemanticTags];
			isArrayVal = true;
		} else {
			const idx = DATA_SCHEMA[canonical];
			unitVal = idx !== undefined ? unit[idx] : undefined;
		}
	}

	// Clean value
	let val = valStr.trim();
	if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
		val = val.substring(1, val.length - 1);
	}

	const upperOp = op.toUpperCase().replace(/\s+/g, ' ');

	// Array / Tags evaluation
	if (isArrayVal) {
		const arr = unitVal instanceof Set ? Array.from(unitVal) : (Array.isArray(unitVal) ? unitVal : []);
		const cleanArr = arr.map(t => String(t).toLowerCase());
		const lowerVal = val.toLowerCase();
		if (upperOp === 'CONTAINS' || upperOp === '=') {
			return cleanArr.includes(lowerVal);
		}
		if (upperOp === '!=') {
			return !cleanArr.includes(lowerVal);
		}
		if (upperOp === 'LIKE') {
			return cleanArr.some(t => matchLike(t, val));
		}
		if (upperOp === 'NOT LIKE') {
			return !cleanArr.some(t => matchLike(t, val));
		}
		return false;
	}

	// Boolean comparison (e.g. sv.honorific = true)
	if (typeof unitVal === 'boolean') {
		const boolVal = val.toLowerCase() === 'true' || val === '1';
		if (upperOp === '=') return unitVal === boolVal;
		if (upperOp === '!=' || upperOp === '<>') return unitVal !== boolVal;
		return false;
	}

	// Numeric comparison for Id or numeric properties
	if (unitVal !== null && unitVal !== undefined && unitVal !== "" && !isNaN(unitVal) && !isNaN(val)) {
		const numUnit = Number(unitVal);
		const numVal = Number(val);
		switch (upperOp) {
			case '=': return numUnit === numVal;
			case '!=':
			case '<>': return numUnit !== numVal;
			case '>': return numUnit > numVal;
			case '>=': return numUnit >= numVal;
			case '<': return numUnit < numVal;
			case '<=': return numUnit <= numVal;
		}
	}

	// String / General comparison
	const strUnit = String(unitVal ?? "").toLowerCase();
	const strVal = String(val ?? "").toLowerCase();

	switch (upperOp) {
		case '=': return strUnit === strVal;
		case '!=':
		case '<>': return strUnit !== strVal;
		case '>': return strUnit > strVal;
		case '>=': return strUnit >= strVal;
		case '<': return strUnit < strVal;
		case '<=': return strUnit <= strVal;
		case 'LIKE': return matchLike(unitVal, val);
		case 'NOT LIKE': return !matchLike(unitVal, val);
		case 'CONTAINS': return strUnit.includes(strVal);
		case 'IN': {
			const list = val.replace(/[()]/g, '').split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '').toLowerCase());
			return list.includes(strUnit);
		}
		case 'NOT IN': {
			const list = val.replace(/[()]/g, '').split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '').toLowerCase());
			return !list.includes(strUnit);
		}
		default: return false;
	}
}

function evaluateWhereClause(whereStr, unit, DATA_SCHEMA) {
	if (!whereStr || !whereStr.trim()) return true;

	// Simple parser for conjuncts (AND / OR)
	// Supports: Col Op Val [AND/OR Col Op Val ...]
	const orClauses = whereStr.split(/\bOR\b/i);
	for (const orClause of orClauses) {
		const andClauses = orClause.split(/\bAND\b/i);
		let andMatch = true;

		for (const andClause of andClauses) {
			const trimmed = andClause.trim();
			if (!trimmed) continue;

			const predRegex = /^\s*([`'"]?[\w.-]+[`'"]?)\s*(<=|>=|!=|<>|=|<|>|\bNOT\s+LIKE\b|\bLIKE\b|\bCONTAINS\b|\bNOT\s+IN\b|\bIN\b)\s*(.+)$/i;
			const match = trimmed.match(predRegex);
			if (match) {
				const col = match[1];
				const op = match[2];
				const val = match[3];
				if (!evaluatePredicate(unit, col, op, val, DATA_SCHEMA)) {
					andMatch = false;
					break;
				}
			} else {
				// Fallback tag check e.g. "devtest" or "person"
				const tags = unit[DATA_SCHEMA.SemanticTags];
				const tagList = tags instanceof Set ? Array.from(tags) : (Array.isArray(tags) ? tags : []);
				if (!tagList.includes(trimmed.replace(/^['"]|['"]$/g, ''))) {
					andMatch = false;
					break;
				}
			}
		}

		if (andMatch) return true;
	}

	return false;
}

// --- Query Execution (SELECT) ---
// --- Column Complexity & Default Format Engine ---
const COMPLEXITY_THRESHOLD = 8;

const COLUMN_COMPLEXITY_WEIGHTS = {
	'SemanticTags': 2,
	'Conjugation': 2,
	'SemanticVector': 4
};

function getColumnComplexity(selectedCols, DATA_SCHEMA) {
	if (!selectedCols || selectedCols.length === 0 || selectedCols[0] === '*') {
		return SCHEMA_COLUMNS.reduce((sum, col) => sum + (COLUMN_COMPLEXITY_WEIGHTS[col.name] || 1), 0);
	}
	let total = 0;
	for (const col of selectedCols) {
		if (col.includes('.')) {
			total += 1;
			continue;
		}
		const canonical = normalizeColumnName(col);
		if (canonical === '*') {
			return SCHEMA_COLUMNS.reduce((sum, c) => sum + (COLUMN_COMPLEXITY_WEIGHTS[c.name] || 1), 0);
		}
		total += COLUMN_COMPLEXITY_WEIGHTS[canonical] || 1;
	}
	return total;
}

// --- SELECT Execution ---
function executeSelect(queryStr, options = {}) {
	const { KR_EN_languageUnits, DATA_SCHEMA } = loadData(options.dataFile || DATA_FILE_PATH);

	// Normalize query string
	let q = queryStr.trim();
	if (q.toUpperCase().startsWith('SELECT')) {
		q = q.substring(6).trim();
	}

	// Extract FORMAT if explicitly provided
	let explicitFormat = null;
	if (options.format) {
		explicitFormat = options.format.toLowerCase();
	}
	const formatMatch = q.match(/\bFORMAT\s+([\w]+)\b/i);
	if (formatMatch) {
		explicitFormat = formatMatch[1].toLowerCase();
		q = q.replace(formatMatch[0], '').trim();
	}

	// Extract LIMIT / OFFSET
	let limit = null;
	let offset = 0;
	const limitMatch = q.match(/\bLIMIT\s+(\d+)(?:\s+OFFSET\s+(\d+))?\b/i);
	if (limitMatch) {
		limit = parseInt(limitMatch[1], 10);
		if (limitMatch[2]) offset = parseInt(limitMatch[2], 10);
		q = q.replace(limitMatch[0], '').trim();
	}
	const offsetMatch = q.match(/\bOFFSET\s+(\d+)\b/i);
	if (offsetMatch) {
		offset = parseInt(offsetMatch[1], 10);
		q = q.replace(offsetMatch[0], '').trim();
	}

	// Extract ORDER BY
	let orderCol = null;
	let orderDir = 'ASC';
	const orderMatch = q.match(/\bORDER\s+BY\s+([`'"]?[\w.-]+[`'"]?)(?:\s+(ASC|DESC))?\b/i);
	if (orderMatch) {
		orderCol = normalizeColumnName(orderMatch[1]);
		if (orderMatch[2]) orderDir = orderMatch[2].toUpperCase();
		q = q.replace(orderMatch[0], '').trim();
	}

	// Extract WHERE
	let whereClause = "";
	const whereMatch = q.match(/\bWHERE\s+([\s\S]+)$/i);
	if (whereMatch) {
		whereClause = whereMatch[1].trim();
		q = q.substring(0, whereMatch.index).trim();
	}

	// Extract FROM if present (ignore table name)
	const fromMatch = q.match(/\bFROM\s+[\w.-]+/i);
	if (fromMatch) {
		q = q.substring(0, fromMatch.index).trim();
	}

	// Columns
	const rawCols = q.includes(',')
		? q.split(',').map(c => c.trim()).filter(Boolean)
		: q.split(/\s+/).map(c => c.trim()).filter(Boolean);
	const selectedCols = rawCols.length === 0 ? ['*'] : rawCols.map(normalizeColumnName);

	// Determine format: explicit takes priority; otherwise use column complexity
	let format = explicitFormat;
	if (!format) {
		const complexity = getColumnComplexity(selectedCols, DATA_SCHEMA);
		format = complexity <= COMPLEXITY_THRESHOLD ? 'tsv' : 'jsonl';
	}

	// Filter rows
	let results = [];
	for (const unit of KR_EN_languageUnits) {
		if (evaluateWhereClause(whereClause, unit, DATA_SCHEMA)) {
			results.push(unitToRecord(unit, selectedCols, DATA_SCHEMA));
		}
	}

	// Order By
	if (orderCol) {
		results.sort((a, b) => {
			const va = a[orderCol] ?? "";
			const vb = b[orderCol] ?? "";
			if (typeof va === 'number' && typeof vb === 'number') {
				return orderDir === 'ASC' ? va - vb : vb - va;
			}
			const sa = String(va).localeCompare(String(vb));
			return orderDir === 'ASC' ? sa : -sa;
		});
	}

	// Offset & Limit
	if (offset > 0) results = results.slice(offset);
	if (limit !== null && limit >= 0) results = results.slice(0, limit);

	return { results, format, count: results.length };
}

// --- Output Serialization ---
function formatResults(results, format = 'jsonl', summary = null) {
	let rowsToFormat = results;
	let truncationSuffix = "";
	const limitCount = typeof summary === 'number' ? summary : (summary ? 5 : null);
	if (limitCount !== null && results.length > limitCount) {
		rowsToFormat = results.slice(0, limitCount);
		truncationSuffix = `\n... [${results.length - limitCount} more rows truncated]`;
	}

	switch (format.toLowerCase()) {
		case 'jsonl':
			return rowsToFormat.map(r => JSON.stringify(r)).join('\n') + truncationSuffix;

		case 'tsv': {
			if (rowsToFormat.length === 0) return "";
			const headers = Object.keys(rowsToFormat[0]);
			const lines = [headers.join('\t')];
			for (const r of rowsToFormat) {
				const row = headers.map(h => {
					const val = r[h];
					if (val === null || val === undefined) return "";
					if (typeof val === 'object') return JSON.stringify(val);
					return String(val).replace(/\t/g, ' ').replace(/[\r\n]+/g, ' ');
				});
				lines.push(row.join('\t'));
			}
			return lines.join('\n') + truncationSuffix;
		}

		case 'table': {
			if (rowsToFormat.length === 0) return "Empty set (0 rows)";
			const headers = Object.keys(rowsToFormat[0]);
			const colWidths = {};
			headers.forEach(h => colWidths[h] = h.length);

			rowsToFormat.forEach(r => {
				headers.forEach(h => {
					let s = r[h];
					if (typeof s === 'object') s = JSON.stringify(s);
					s = String(s ?? "");
					if (s.length > (colWidths[h] || 0)) {
						colWidths[h] = Math.min(s.length, 50); // cap max column display width
					}
				});
			});

			const pad = (str, len) => {
				const s = String(str ?? "");
				return s.length >= len ? s.substring(0, len) : s + ' '.repeat(len - s.length);
			};

			const divider = '+' + headers.map(h => '-'.repeat(colWidths[h] + 2)).join('+') + '+';
			const headerRow = '| ' + headers.map(h => pad(h, colWidths[h])).join(' | ') + ' |';

			const rows = rowsToFormat.map(r => {
				return '| ' + headers.map(h => {
					let val = r[h];
					if (typeof val === 'object') val = JSON.stringify(val);
					return pad(val, colWidths[h]);
				}).join(' | ') + ' |';
			});

			const countMsg = truncationSuffix ? `(${results.length} rows total, displaying ${rowsToFormat.length})` : `(${results.length} rows)`;
			return [divider, headerRow, divider, ...rows, divider, countMsg].join('\n') + truncationSuffix;
		}

		case 'raw': {
			return rowsToFormat.map(r => {
				const u = buildUnitFromRecord(r, r.Source || getDefaultSource(), r.Id ?? 0, SCHEMA_COLUMNS);
				return formatUnitLine(u, false, SCHEMA_COLUMNS);
			}).join('\n') + truncationSuffix;
		}

		case 'json':
		default:
			return JSON.stringify(rowsToFormat, null, 2) + truncationSuffix;
	}
}

// --- Data File Modification Engine ---
function getUnitLineIndices(lines) {
	const unitIndices = [];
	let inArray = false;
	for (let i = 0; i < lines.length; i++) {
		const trimmed = lines[i].trim();
		if (trimmed.startsWith('const KR_EN_languageUnits = [')) {
			inArray = true;
			continue;
		}
		if (inArray) {
			if (trimmed.startsWith('];')) {
				break;
			}
			if (trimmed.startsWith('[')) {
				unitIndices.push(i);
			}
		}
	}
	return unitIndices;
}

function readTextFile(filePath) {
	const buf = fs.readFileSync(filePath);
	if (buf.length >= 2 && buf[0] === 0xFF && buf[1] === 0xFE) {
		return buf.toString('utf16le');
	}
	if (buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
		return buf.toString('utf8').substring(1);
	}
	return buf.toString('utf8');
}

function parseInputFile(filePath, explicitCols = null) {
	if (!fs.existsSync(filePath)) {
		throw new Error(`Input file not found: ${filePath}`);
	}
	const content = readTextFile(filePath).trim();
	if (!content) return [];

	// Try parsing as JSON array
	if (content.startsWith('[') || content.startsWith('{')) {
		try {
			const parsed = JSON.parse(content);
			if (Array.isArray(parsed)) {
				if (parsed.length > 0 && Array.isArray(parsed[0])) {
					// Array of arrays
					return parsed.map(row => {
						const rec = {};
						if (explicitCols && explicitCols.length > 0) {
							explicitCols.forEach((col, idx) => {
								if (idx < row.length) rec[normalizeColumnName(col)] = row[idx];
							});
						} else {
							SCHEMA_COLUMNS.forEach(c => {
								if (c.index < row.length) rec[c.name] = row[c.index];
							});
						}
						return rec;
					});
				}
				// Array of objects
				return parsed;
			} else if (typeof parsed === 'object') {
				return [parsed];
			}
		} catch (e) {
			// Might be JSON Lines or JS file
		}
	}

	// Try JSON Lines (JSONL)
	const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
	if (lines.length > 0 && lines[0].startsWith('{') && lines[0].endsWith('}')) {
		try {
			return lines.map(l => JSON.parse(l));
		} catch (e) {
			// Not JSONL
		}
	}

	// Try TSV
	if (content.includes('\t')) {
		const tsvLines = content.split('\n').filter(Boolean);
		let headers = [];
		let startIndex = 0;
		if (tsvLines[0].includes('\t')) {
			const firstRowCols = tsvLines[0].split('\t').map(c => normalizeColumnName(c.trim()));
			if (firstRowCols.some(c => SCHEMA_COLUMNS.some(sc => sc.name === c))) {
				headers = firstRowCols;
				startIndex = 1;
			}
		}
		if (headers.length === 0) {
			headers = explicitCols && explicitCols.length > 0
				? explicitCols.map(normalizeColumnName)
				: SCHEMA_COLUMNS.map(c => c.name);
		}

		const records = [];
		for (let i = startIndex; i < tsvLines.length; i++) {
			const vals = tsvLines[i].split('\t');
			const rec = {};
			headers.forEach((h, idx) => {
				if (idx < vals.length) {
					let v = vals[idx].trim();
					if ((v.startsWith('{') && v.endsWith('}')) || (v.startsWith('[') && v.endsWith(']'))) {
						try { v = JSON.parse(v); } catch (_) { }
					}
					rec[h] = v;
				}
			});
			records.push(rec);
		}
		return records;
	}

	// Try raw JS array rows (e.g. `["씨", "Mr./Ms.", ...],`)
	const rawMatches = [];
	for (const line of lines) {
		const trimmed = line.trim().replace(/,$/, '');
		if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
			try {
				// Use Function to safely evaluate array literal
				const row = new Function(`return ${trimmed}`)();
				if (Array.isArray(row)) {
					const rec = {};
					if (explicitCols && explicitCols.length > 0) {
						explicitCols.forEach((col, idx) => {
							if (idx < row.length) rec[normalizeColumnName(col)] = row[idx];
						});
					} else {
						SCHEMA_COLUMNS.forEach(c => {
							if (c.index < row.length) rec[c.name] = row[c.index];
						});
					}
					rawMatches.push(rec);
				}
			} catch (_) { }
		}
	}
	if (rawMatches.length > 0) return rawMatches;

	throw new Error(`Unable to determine format of ${filePath}. Expected JSON array, JSONL, or TSV.`);
}

function writeDataFile(modifiedLines, filePath = DATA_FILE_PATH) {
	const tmpPath = filePath + '.tmp';
	fs.writeFileSync(tmpPath, modifiedLines.join('\n'), 'utf8');

	// Syntax validation
	try {
		delete require.cache[path.resolve(tmpPath)];
		const testLoad = require(path.resolve(tmpPath));
		if (!testLoad.KR_EN_languageUnits || !Array.isArray(testLoad.KR_EN_languageUnits)) {
			throw new Error("KR_EN_languageUnits is missing or not an array");
		}
	} catch (err) {
		if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
		throw new Error(`Syntax validation failed for updated data.js: ${err.message}`);
	}

	// Safely copy tmp over target file
	fs.copyFileSync(tmpPath, filePath);
	fs.unlinkSync(tmpPath);

	// Automatically update schema analysis if schema_analysis.js is present
	try {
		const schemaAnalysisPath = path.resolve(__dirname, 'schema_analysis.js');
		if (fs.existsSync(schemaAnalysisPath)) {
			delete require.cache[schemaAnalysisPath];
			const schemaAnalysis = require(schemaAnalysisPath);
			if (typeof schemaAnalysis.updateSchemaSummary === 'function') {
				schemaAnalysis.updateSchemaSummary();
			}
		}
	} catch (_) { }
}

// --- UPDATE Execution ---
function executeUpdateFromFile(inputFile, explicitCols = null, options = {}) {
	const { KR_EN_languageUnits, DATA_SCHEMA } = loadData(options.dataFile || DATA_FILE_PATH);
	const records = parseInputFile(inputFile, explicitCols);
	if (records.length === 0) {
		return { updated: 0, inserted: 0, message: "No records found in input file" };
	}

	const dataPath = options.dataFile || DATA_FILE_PATH;
	const fileContent = fs.readFileSync(dataPath, 'utf8');
	const lines = fileContent.split('\n');
	const unitIndices = getUnitLineIndices(lines);

	let updatedCount = 0;
	let insertedCount = 0;
	const updatedIds = [];

	records.forEach(rec => {
		// Find unit: primary key is Id, fallback is Korean
		let targetId = -1;
		if (rec.Id !== undefined && rec.Id !== null && rec.Id !== "" && !isNaN(rec.Id)) {
			targetId = parseInt(rec.Id, 10);
		} else if (rec.Korean) {
			targetId = KR_EN_languageUnits.findIndex(u => u[DATA_SCHEMA.Korean] === rec.Korean);
		}

		if (targetId >= 0 && targetId < unitIndices.length) {
			// Update existing row
			const existing = KR_EN_languageUnits[targetId];
			for (const key of Object.keys(rec)) {
				const col = normalizeColumnName(key);
				if (!col || col === 'Id') continue;
				const idx = DATA_SCHEMA[col];
				if (idx !== undefined) {
					existing[idx] = rec[key];
				}
			}

			validateLanguageUnitSemanticSelection(existing, KR_EN_languageUnits, DATA_SCHEMA, options);

			const lineIdx = unitIndices[targetId];
			const isLast = (targetId === unitIndices.length - 1);
			lines[lineIdx] = formatUnitLine(existing, isLast);
			updatedCount++;
			updatedIds.push(targetId);
		} else {
			// Check if record is a section comment
			if (rec.comment || rec._comment || rec.Comment) {
				const commentText = rec.comment || rec._comment || rec.Comment;
				const commentLine = commentText.startsWith('//') ? `\t${commentText}` : `\t// ${commentText}`;
				if (!lines.some(l => l.trim() === commentLine.trim())) {
					let closeIdx = lines.findIndex(l => l.trim().startsWith('];'));
					if (closeIdx === -1) closeIdx = lines.length;
					lines.splice(closeIdx, 0, commentLine);
				}
				return;
			}

			// Insert new row
			const defaultSource = options.source || getDefaultSource();
			const resolvedSource = (rec.Source && rec.Source.trim() && !options.source)
				? rec.Source.trim()
				: (options.source || (rec.Source && rec.Source.trim()) || defaultSource);

			const newUnit = buildUnitFromRecord(rec, resolvedSource, unitIndices.length + insertedCount, SCHEMA_COLUMNS);
			validateLanguageUnitSemanticSelection(newUnit, KR_EN_languageUnits, DATA_SCHEMA, options);

			// Find closing `];`
			let closeIdx = lines.findIndex(l => l.trim().startsWith('];'));
			if (closeIdx === -1) closeIdx = lines.length;

			// Make sure previous line ends with comma
			if (unitIndices.length > 0) {
				const lastLineIdx = unitIndices[unitIndices.length - 1];
				if (!lines[lastLineIdx].trim().endsWith(',')) {
					lines[lastLineIdx] = lines[lastLineIdx].replace(/([^,])\s*$/, '$1,');
				}
			}

			const newLine = formatUnitLine(newUnit, false);
			lines.splice(closeIdx, 0, newLine);
			insertedCount++;
		}
	});

	// If units were inserted, ensure the last unit in the array has no trailing comma
	if (insertedCount > 0) {
		let closeIdx = lines.findIndex(l => l.trim().startsWith('];'));
		for (let i = closeIdx - 1; i >= 0; i--) {
			if (lines[i].trim().startsWith('[') && !lines[i].trim().startsWith('//')) {
				lines[i] = lines[i].replace(/,\s*$/, '');
				break;
			}
		}
	}

	if (!options.dryRun && (updatedCount > 0 || insertedCount > 0)) {
		writeDataFile(lines, dataPath);
	}

	return {
		updated: updatedCount,
		inserted: insertedCount,
		updatedIds,
		dryRun: !!options.dryRun
	};
}

function executeUpdateInline(setClause, whereClause, options = {}) {
	const { KR_EN_languageUnits, DATA_SCHEMA } = loadData(options.dataFile || DATA_FILE_PATH);

	// Parse SET clauses: Col = Val, Col2 = Val2...
	const assignments = [];
	const setParts = setClause.split(/,(?=(?:[^'"]*['"][^'"]*['"])*[^'"]*$)/);
	for (const part of setParts) {
		const m = part.match(/^\s*([`'"]?[\w.-]+[`'"]?)\s*=\s*(.+)$/);
		if (m) {
			const col = normalizeColumnName(m[1]);
			let val = m[2].trim();
			if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
				val = val.substring(1, val.length - 1);
			} else if (!isNaN(val)) {
				val = Number(val);
			} else if ((val.startsWith('{') && val.endsWith('}')) || (val.startsWith('[') && val.endsWith(']'))) {
				try { val = JSON.parse(val); } catch (_) { }
			}
			assignments.push({ col, val });
		}
	}

	if (assignments.length === 0) {
		throw new Error("No valid assignments found in SET clause.");
	}

	const dataPath = options.dataFile || DATA_FILE_PATH;
	const fileContent = fs.readFileSync(dataPath, 'utf8');
	const lines = fileContent.split('\n');
	const unitIndices = getUnitLineIndices(lines);

	let updatedCount = 0;
	const updatedIds = [];

	KR_EN_languageUnits.forEach((unit, idx) => {
		if (evaluateWhereClause(whereClause, unit, DATA_SCHEMA)) {
			for (const { col, val } of assignments) {
				if (col === 'Id') continue;
				const schemaIdx = DATA_SCHEMA[col];
				if (schemaIdx !== undefined) {
					unit[schemaIdx] = val;
				}
			}

			const lineIdx = unitIndices[idx];
			const isLast = (idx === unitIndices.length - 1);
			lines[lineIdx] = formatUnitLine(unit, isLast);
			updatedCount++;
			updatedIds.push(idx);
		}
	});

	if (!options.dryRun && updatedCount > 0) {
		writeDataFile(lines, dataPath);
	}

	return { updated: updatedCount, updatedIds, dryRun: !!options.dryRun };
}

// --- INSERT Execution ---
function executeInsert(insertStr, options = {}) {
	let q = insertStr.trim();
	if (q.toUpperCase().startsWith('INSERT')) {
		q = q.substring(6).trim();
	}
	if (q.toUpperCase().startsWith('INTO')) {
		q = q.substring(4).trim();
	}
	// Remove table name if present
	q = q.replace(/^KR_EN_languageUnits\s*/i, '');

	// Check if FROMFILE
	const fromFileMatch = q.match(/\bFROMFILE\s+([^\s]+)/i) || q.match(/\bFROM\s+([^\s]+)/i);
	if (fromFileMatch) {
		const file = fromFileMatch[1];
		let cols = q.substring(0, fromFileMatch.index).trim();
		cols = cols.replace(/[()]/g, '').split(',').map(c => c.trim()).filter(Boolean);
		return executeUpdateFromFile(file, cols, options);
	}

	// Parse (cols) VALUES (vals)
	const valMatch = q.match(/\(([^)]+)\)\s*VALUES\s*\(([\s\S]+)\)/i);
	if (!valMatch) {
		throw new Error("Invalid INSERT statement. Syntax: INSERT INTO KR_EN_languageUnits (cols...) VALUES (vals...)");
	}

	const cols = valMatch[1].split(',').map(c => normalizeColumnName(c.trim()));
	// Parse values respecting quotes and brackets
	const valsStr = valMatch[2].trim();
	const vals = [];
	const valRegex = /([`'"].*?[`'"]|\[.*?\]|\{.*?\}|[^,]+)/g;
	let m;
	while ((m = valRegex.exec(valsStr)) !== null) {
		let v = m[0].trim();
		if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
			v = v.substring(1, v.length - 1);
		} else if ((v.startsWith('[') && v.endsWith(']')) || (v.startsWith('{') && v.endsWith('}'))) {
			try { v = JSON.parse(v); } catch (_) { }
		}
		vals.push(v);
	}

	const record = {};
	cols.forEach((col, idx) => {
		if (idx < vals.length) record[col] = vals[idx];
	});

	const dataPath = options.dataFile || DATA_FILE_PATH;
	const fileContent = fs.readFileSync(dataPath, 'utf8');
	const lines = fileContent.split('\n');
	const unitIndices = getUnitLineIndices(lines);

	const defaultSource = options.source || getDefaultSource();
	const resolvedSource = (record.Source && record.Source.trim() && !options.source)
		? record.Source.trim()
		: (options.source || (record.Source && record.Source.trim()) || defaultSource);

	const newUnit = buildUnitFromRecord(record, resolvedSource, unitIndices.length, SCHEMA_COLUMNS);
	validateLanguageUnitSemanticSelection(newUnit, null, SCHEMA_COLUMNS, options);

	let closeIdx = lines.findIndex(l => l.trim().startsWith('];'));
	if (closeIdx === -1) closeIdx = lines.length;

	if (unitIndices.length > 0) {
		const lastLineIdx = unitIndices[unitIndices.length - 1];
		if (!lines[lastLineIdx].trim().endsWith(',')) {
			lines[lastLineIdx] = lines[lastLineIdx].replace(/([^,])\s*$/, '$1,');
		}
	}

	const newLine = formatUnitLine(newUnit, false);
	lines.splice(closeIdx, 0, newLine);

	if (!options.dryRun) {
		writeDataFile(lines, dataPath);
	}

	return { inserted: 1, unit: newUnit, dryRun: !!options.dryRun };
}

// --- DELETE Execution ---
function executeDelete(deleteStr, options = {}) {
	const { KR_EN_languageUnits, DATA_SCHEMA } = loadData(options.dataFile || DATA_FILE_PATH);
	let q = deleteStr.trim();
	if (q.toUpperCase().startsWith('DELETE')) {
		q = q.substring(6).trim();
	}
	if (q.toUpperCase().startsWith('FROM')) {
		q = q.substring(4).trim();
	}
	q = q.replace(/^KR_EN_languageUnits\s*/i, '');

	let whereClause = "";
	const whereMatch = q.match(/\bWHERE\s+([\s\S]+)$/i);
	if (whereMatch) {
		whereClause = whereMatch[1].trim();
	}

	if (!whereClause) {
		throw new Error("DELETE requires a WHERE clause to prevent accidental deletion of entire dataset.");
	}

	const dataPath = options.dataFile || DATA_FILE_PATH;
	const fileContent = fs.readFileSync(dataPath, 'utf8');
	const lines = fileContent.split('\n');
	const unitIndices = getUnitLineIndices(lines);

	const lineIndicesToRemove = new Set();
	let deletedCount = 0;

	KR_EN_languageUnits.forEach((unit, idx) => {
		if (evaluateWhereClause(whereClause, unit, DATA_SCHEMA)) {
			lineIndicesToRemove.add(unitIndices[idx]);
			deletedCount++;
		}
	});

	if (deletedCount === 0) {
		return { deleted: 0, message: "No matching rows found" };
	}

	const newLines = lines.filter((_, idx) => !lineIndicesToRemove.has(idx));

	if (!options.dryRun) {
		writeDataFile(newLines, dataPath);
	}

	return { deleted: deletedCount, dryRun: !!options.dryRun };
}

// --- ADD Column Execution ---
function parseAddCommand(str) {
	const trimmed = str.trim();
	const match = trimmed.match(/^ADD\s+([`'"]?[\w.-]+[`'"]?)\s+([`'"]?.*?['"]?)\s+(AFTER\s+[`'"]?[\w.-]+[`'"]?|BEFORE\s+[`'"]?[\w.-]+[`'"]?|FIRST|LAST)$/i);
	if (!match) {
		throw new Error("Invalid ADD statement. Syntax: ADD <colName> <defaultValue> (AFTER <col> | BEFORE <col> | FIRST | LAST)");
	}
	const rawCol = match[1].trim().replace(/^[`'"]+|[`'"]+$/g, '');
	let rawVal = match[2].trim();
	let val;
	if ((rawVal.startsWith("'") && rawVal.endsWith("'")) || (rawVal.startsWith('"') && rawVal.endsWith('"'))) {
		val = rawVal.substring(1, rawVal.length - 1);
	} else if (!isNaN(rawVal) && rawVal !== '') {
		val = Number(rawVal);
	} else if ((rawVal.startsWith('[') && rawVal.endsWith(']')) || (rawVal.startsWith('{') && rawVal.endsWith('}'))) {
		try { val = JSON.parse(rawVal); } catch (_) { val = rawVal; }
	} else if (rawVal.toLowerCase() === 'true') {
		val = true;
	} else if (rawVal.toLowerCase() === 'false') {
		val = false;
	} else if (rawVal.toLowerCase() === 'null') {
		val = null;
	} else {
		val = rawVal;
	}

	const posStr = match[3].trim();
	let placement = null;
	let targetCol = null;

	if (/^FIRST$/i.test(posStr)) {
		placement = 'FIRST';
	} else if (/^LAST$/i.test(posStr)) {
		placement = 'LAST';
	} else {
		const afterMatch = posStr.match(/^AFTER\s+([`'"]?[\w.-]+[`'"]?)$/i);
		if (afterMatch) {
			placement = 'AFTER';
			targetCol = afterMatch[1].trim().replace(/^[`'"]+|[`'"]+$/g, '');
		} else {
			const beforeMatch = posStr.match(/^BEFORE\s+([`'"]?[\w.-]+[`'"]?)$/i);
			if (beforeMatch) {
				placement = 'BEFORE';
				targetCol = beforeMatch[1].trim().replace(/^[`'"]+|[`'"]+$/g, '');
			} else {
				throw new Error(`Unrecognized position in ADD command: "${posStr}"`);
			}
		}
	}

	return { colName: rawCol, defaultValue: val, placement, targetCol };
}

function executeAddColumn(commandStr, options = {}) {
	const { colName, defaultValue, placement, targetCol } = parseAddCommand(commandStr);
	const dataPath = options.dataFile || DATA_FILE_PATH;
	const fileContent = fs.readFileSync(dataPath, 'utf8');
	const lines = fileContent.split('\n');

	const { KR_EN_languageUnits, DATA_SCHEMA } = loadData(dataPath);

	let canonicalCol = normalizeColumnName(colName);
	if (!canonicalCol) {
		canonicalCol = colName.charAt(0).toUpperCase() + colName.slice(1);
	}
	if (colName.toLowerCase() === 'id') {
		canonicalCol = 'Id';
	} else if (colName.toLowerCase() === 'priorityscore') {
		canonicalCol = 'PriorityScore';
	}

	const unitIndices = getUnitLineIndices(lines);
	if (unitIndices.length === 0) {
		throw new Error("No language units found in target data file.");
	}

	// Determine current physical columns in the array rows
	const firstRowText = lines[unitIndices[0]].trim().replace(/,$/, '');
	const firstRowArr = eval(firstRowText);
	const physicalColCount = firstRowArr.length;

	// Get current ordered columns from DATA_SCHEMA up to physicalColCount
	const currentPhysicalCols = [];
	for (let i = 0; i < physicalColCount; i++) {
		if (DATA_SCHEMA[i] !== undefined) {
			currentPhysicalCols.push(DATA_SCHEMA[i]);
		}
	}

	// Check if canonicalCol is already physically in the rows
	if (currentPhysicalCols.includes(canonicalCol)) {
		throw new Error(`Column "${canonicalCol}" already exists in ${path.basename(dataPath)}.`);
	}

	// Calculate insert index in physical columns
	let insertIdx = -1;
	if (placement === 'FIRST') {
		insertIdx = 0;
	} else if (placement === 'LAST') {
		insertIdx = currentPhysicalCols.length;
	} else if (placement === 'AFTER') {
		const normTarget = normalizeColumnName(targetCol);
		const idx = currentPhysicalCols.indexOf(normTarget);
		if (idx === -1) {
			throw new Error(`Target column "${targetCol}" not found in current physical schema.`);
		}
		insertIdx = idx + 1;
	} else if (placement === 'BEFORE') {
		const normTarget = normalizeColumnName(targetCol);
		const idx = currentPhysicalCols.indexOf(normTarget);
		if (idx === -1) {
			throw new Error(`Target column "${targetCol}" not found in current physical schema.`);
		}
		insertIdx = idx;
	}

	// New physical columns
	const newPhysicalCols = [...currentPhysicalCols];
	newPhysicalCols.splice(insertIdx, 0, canonicalCol);

	// If Id is NOT yet in newPhysicalCols, keep it at the end in DATA_SCHEMA as dynamic/virtual
	const allSchemaCols = [...newPhysicalCols];
	if (!allSchemaCols.includes('Id')) {
		allSchemaCols.push('Id');
	}

	// Construct new schema definitions for formatting
	const newSchemaCols = newPhysicalCols.map((name, index) => {
		let type = 'string';
		if (name === 'Id' || name === 'PriorityScore') type = 'number';
		else if (name === 'SemanticTags') type = 'tags';
		else if (name === 'Conjugation') type = 'conjugation';
		else if (name === 'SemanticVector') type = 'json';
		return { name, index, type };
	});

	// 1. Update each unit line in `lines` (before modifying lines length at the top)
	unitIndices.forEach((lineIdx, unitIdx) => {
		const rawText = lines[lineIdx].trim().replace(/,$/, '');
		const row = eval(rawText);
		row.splice(insertIdx, 0, defaultValue);
		const isLast = (unitIdx === unitIndices.length - 1);
		lines[lineIdx] = formatUnitLine(row, isLast, newSchemaCols);
	});

	// 2. Update DATA_SCHEMA block at the top of data.js
	let schemaStart = -1;
	let schemaEnd = -1;
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].trim().startsWith('const DATA_SCHEMA = {')) {
			schemaStart = i;
		}
		if (schemaStart !== -1 && lines[i].trim().startsWith('Object.freeze(DATA_SCHEMA);')) {
			schemaEnd = i;
			break;
		}
	}

	if (schemaStart === -1 || schemaEnd === -1) {
		throw new Error("Could not locate DATA_SCHEMA definition block in data.js.");
	}

	const schemaBlockLines = [
		'const DATA_SCHEMA = {'
	];
	allSchemaCols.forEach((col, idx) => {
		const comment = col === 'SemanticTags' ? ' // Array<string> in raw definition; replaced with Set<string> when added to main language units list via addLearningUnit' : '';
		schemaBlockLines.push(`\t${col}: ${idx},${comment}`);
	});
	allSchemaCols.forEach((col, idx) => {
		const isLast = (idx === allSchemaCols.length - 1);
		schemaBlockLines.push(`\t${idx}: '${col}'${isLast ? '' : ','}`);
	});
	schemaBlockLines.push('};');
	schemaBlockLines.push('Object.freeze(DATA_SCHEMA);');

	lines.splice(schemaStart, (schemaEnd - schemaStart + 1), ...schemaBlockLines);

	if (!options.dryRun) {
		writeDataFile(lines, dataPath);
		// Refresh local SCHEMA_COLUMNS
		SCHEMA_COLUMNS = getSchemaColumns(loadData(dataPath).DATA_SCHEMA);
	}

	return {
		added: canonicalCol,
		index: insertIdx,
		defaultValue,
		count: unitIndices.length,
		dryRun: !!options.dryRun,
		message: `Success: Added column '${canonicalCol}' at index ${insertIdx} with default value ${JSON.stringify(defaultValue)} in ${path.basename(dataPath)} (${unitIndices.length} units modified)${options.dryRun ? ' [DRY RUN]' : ''}.`
	};
}

// --- Main Command Dispatcher ---
function execute(commandStr, options = {}) {
	const trimmed = commandStr.trim();
	const upper = trimmed.toUpperCase();

	if (upper.startsWith('SELECT')) {
		return executeSelect(trimmed, options);
	} else if (upper.startsWith('UPDATE')) {
		// Check for FROMFILE or FROM
		const fromFileMatch = trimmed.match(/\bFROMFILE\s+([^\s]+)/i) || trimmed.match(/\bFROM\s+([^\s]+)/i);
		if (fromFileMatch) {
			const file = fromFileMatch[1];
			// Extract column list between UPDATE and FROMFILE
			let colsPart = trimmed.substring(6, fromFileMatch.index).trim();
			// Remove table name if present
			colsPart = colsPart.replace(/^KR_EN_languageUnits\s*/i, '');
			const cols = colsPart.includes(',')
				? colsPart.split(',').map(c => c.trim()).filter(Boolean)
				: colsPart.split(/\s+/).map(c => c.trim()).filter(Boolean);
			return executeUpdateFromFile(file, cols, options);
		}

		// Check for SET ... WHERE
		const setMatch = trimmed.match(/\bSET\s+([\s\S]+?)(?:\s+\bWHERE\s+([\s\S]+))?$/i);
		if (setMatch) {
			const setClause = setMatch[1].trim();
			const whereClause = setMatch[2] ? setMatch[2].trim() : "";
			return executeUpdateInline(setClause, whereClause, options);
		}

		// Simple syntax: `UPDATE filename.txt`
		const parts = trimmed.split(/\s+/).slice(1);
		if (parts.length > 0 && fs.existsSync(parts[0])) {
			return executeUpdateFromFile(parts[0], null, options);
		}

		throw new Error("Invalid UPDATE statement. Syntax: UPDATE [cols...] FROMFILE <file> OR UPDATE SET col=val WHERE ... ");
	} else if (upper.startsWith('INSERT')) {
		return executeInsert(trimmed, options);
	} else if (upper.startsWith('DELETE')) {
		return executeDelete(trimmed, options);
	} else if (upper.startsWith('ADD')) {
		return executeAddColumn(trimmed, options);
	} else if (upper.startsWith('COUNT')) {
		const whereClause = trimmed.substring(5).replace(/^\s*WHERE\s*/i, '').trim();
		const res = executeSelect(`SELECT Id WHERE ${whereClause}`, options);
		return { count: res.count, format: 'text' };
	} else if (upper.startsWith('AUDIT')) {
		return auditSemanticRules(options);
	} else {
		throw new Error(`Unrecognized command: "${trimmed}". Expected SELECT, UPDATE, INSERT, DELETE, COUNT, or AUDIT.`);
	}
}

// --- CLI Runner ---

function runCli() {
	const rawArgs = process.argv.slice(2);
	if (rawArgs.length === 0 || rawArgs.includes('--help') || rawArgs.includes('-h') || rawArgs[0].toLowerCase() === 'help') {
		printHelp();
		process.exit(0);
	}

	// Extract options
	let format = null;
	let dryRun = false;
	let dataFile = DATA_FILE_PATH;
	let source = null;
	let summary = null;
	let verbose = false;

	const filteredArgs = [];
	for (let i = 0; i < rawArgs.length; i++) {
		const arg = rawArgs[i];
		if (arg === '--format' && i + 1 < rawArgs.length) {
			format = rawArgs[++i];
		} else if (arg === '--dry-run') {
			dryRun = true;
		} else if (arg === '--data' && i + 1 < rawArgs.length) {
			dataFile = rawArgs[++i];
		} else if ((arg === '--source' || arg === '-s') && i + 1 < rawArgs.length) {
			source = rawArgs[++i];
		} else if (arg.startsWith('--source=')) {
			source = arg.substring(9);
		} else if (arg === '--summary') {
			if (i + 1 < rawArgs.length && /^\d+$/.test(rawArgs[i + 1])) {
				summary = parseInt(rawArgs[++i], 10);
			} else {
				summary = 5;
			}
		} else if (arg.startsWith('--summary=')) {
			summary = parseInt(arg.substring(10), 10) || 5;
		} else if (arg === '--strict') {
			options = options || {};
			options.strict = true;
		} else if (arg === '--audit' || arg === '--audit-semantic') {
			filteredArgs.push('AUDIT');
		} else if (arg === '-v' || arg === '--verbose') {
			verbose = true;
		} else {
			filteredArgs.push(arg);
		}
	}

	const commandStr = filteredArgs.join(' ').trim();
	if (!commandStr) {
		printHelp();
		process.exit(0);
	}

	try {
		const result = execute(commandStr, { format, dryRun, dataFile, source, summary, verbose });
		if (result.results !== undefined) {
			// SELECT output
			console.log(formatResults(result.results, result.format, summary));
		} else if (result.added !== undefined) {
			// ADD column output
			if (verbose || dryRun) {
				console.log(result.message);
			}
		} else if (result.updated !== undefined) {
			// UPDATE output
			if (verbose || dryRun) {
				console.log(`Success: Updated ${result.updated} unit(s) in ${path.basename(dataFile)}${result.inserted ? ` (inserted ${result.inserted})` : ''}${result.dryRun ? ' [DRY RUN]' : ''}.`);
			}
		} else if (result.inserted !== undefined) {
			// INSERT output
			if (verbose || dryRun) {
				console.log(`Success: Inserted ${result.inserted} unit(s) into ${path.basename(dataFile)}${result.dryRun ? ' [DRY RUN]' : ''}.`);
			}
		} else if (result.deleted !== undefined) {
			// DELETE output
			if (verbose || dryRun) {
				console.log(`Success: Deleted ${result.deleted} unit(s) from ${path.basename(dataFile)}${result.dryRun ? ' [DRY RUN]' : ''}.`);
			}
		} else if (result.count !== undefined) {
			console.log(result.count);
		}
	} catch (err) {
		console.error(`Error: ${err.message}`);
		process.exit(1);
	}
}

if (require.main === module) {
	runCli();
}

module.exports = {
	execute,
	executeSelect,
	executeUpdateFromFile,
	executeUpdateInline,
	executeInsert,
	executeDelete,
	executeAddColumn,
	auditSemanticRules,
	validateLanguageUnitSemanticSelection,
	detectUndifferentiatedHomonym,
	getVerbSemanticConstraint,
	formatResults,
	loadData,
	DATA_SCHEMA: SCHEMA_COLUMNS
};
