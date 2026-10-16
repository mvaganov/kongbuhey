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

const fs = require('fs');
const path = require('path');

const DATA_FILE_PATH = path.resolve(__dirname, 'data.js');

// --- Schema Definitions ---
let SCHEMA_COLUMNS = [
    { name: "Korean", index: 0, type: "string" },
    { name: "English", index: 1, type: "string" },
    { name: "PartofSpeech", index: 2, type: "string" },
    { name: "SemanticTags", index: 3, type: "tags" },
    { name: "Disambiguation", index: 4, type: "string" },
    { name: "Conjugation", index: 5, type: "conjugation" },
    { name: "Source", index: 6, type: "string" },
    { name: "FormalityLevel", index: 7, type: "string" },
    { name: "HonorificRules", index: 8, type: "string" },
    { name: "SemanticVector", index: 9, type: "json" },
    { name: "Id", index: 10, type: "number" }
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
} catch (_) {}

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
            return tagsArr;
        }
        if (col.name === 'PartofSpeech') {
            return rec.PartofSpeech || "Noun";
        }
        return rec[col.name] !== undefined ? rec[col.name] : (col.type === 'number' ? 0 : "");
    });
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
    const canonical = normalizeColumnName(colName);
    if (!canonical) return false;

    let unitVal;
    if (canonical === 'Id') {
        unitVal = unit[DATA_SCHEMA.Id];
    } else if (canonical === 'SemanticTags') {
        unitVal = unit[DATA_SCHEMA.SemanticTags];
    } else {
        const idx = DATA_SCHEMA[canonical];
        unitVal = idx !== undefined ? unit[idx] : undefined;
    }

    // Clean value
    let val = valStr.trim();
    if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
        val = val.substring(1, val.length - 1);
    }

    const upperOp = op.toUpperCase().replace(/\s+/g, ' ');

    // Tags evaluation
    if (canonical === 'SemanticTags') {
        const tagsArr = unitVal instanceof Set ? Array.from(unitVal) : (Array.isArray(unitVal) ? unitVal : []);
        if (upperOp === 'CONTAINS' || upperOp === '=') {
            return tagsArr.map(t => t.toLowerCase()).includes(val.toLowerCase());
        }
        if (upperOp === '!=') {
            return !tagsArr.map(t => t.toLowerCase()).includes(val.toLowerCase());
        }
        if (upperOp === 'LIKE') {
            return tagsArr.some(t => matchLike(t, val));
        }
        if (upperOp === 'NOT LIKE') {
            return !tagsArr.some(t => matchLike(t, val));
        }
    }

    // Numeric comparison for Id
    if (canonical === 'Id' || (!isNaN(unitVal) && !isNaN(val) && typeof unitVal === 'number')) {
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
        format = complexity <= COMPLEXITY_THRESHOLD ? 'tsv' : 'json';
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
function formatResults(results, format = 'json') {
    switch (format.toLowerCase()) {
        case 'jsonl':
            return results.map(r => JSON.stringify(r)).join('\n');

        case 'tsv': {
            if (results.length === 0) return "";
            const headers = Object.keys(results[0]);
            const lines = [headers.join('\t')];
            for (const r of results) {
                const row = headers.map(h => {
                    const val = r[h];
                    if (val === null || val === undefined) return "";
                    if (typeof val === 'object') return JSON.stringify(val);
                    return String(val).replace(/\t/g, ' ').replace(/[\r\n]+/g, ' ');
                });
                lines.push(row.join('\t'));
            }
            return lines.join('\n');
        }

        case 'table': {
            if (results.length === 0) return "Empty set (0 rows)";
            const headers = Object.keys(results[0]);
            const colWidths = {};
            headers.forEach(h => colWidths[h] = h.length);

            results.forEach(r => {
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

            const rows = results.map(r => {
                return '| ' + headers.map(h => {
                    let val = r[h];
                    if (typeof val === 'object') val = JSON.stringify(val);
                    return pad(val, colWidths[h]);
                }).join(' | ') + ' |';
            });

            return [divider, headerRow, divider, ...rows, divider, `(${results.length} rows)`].join('\n');
        }

        case 'raw': {
            return results.map(r => {
                const u = buildUnitFromRecord(r, r.Source || getDefaultSource(), r.Id ?? 0, SCHEMA_COLUMNS);
                return formatUnitLine(u, false, SCHEMA_COLUMNS);
            }).join('\n');
        }

        case 'json':
        default:
            return JSON.stringify(results, null, 2);
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
                        try { v = JSON.parse(v); } catch (_) {}
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
            } catch (_) {}
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
                try { val = JSON.parse(val); } catch (_) {}
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
            try { v = JSON.parse(v); } catch (_) {}
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
    } else {
        throw new Error(`Unrecognized command: "${trimmed}". Expected SELECT, UPDATE, INSERT, DELETE, or COUNT.`);
    }
}

// --- CLI Runner ---
function printHelp() {
    console.log(`
Kongbuhey Data Manipulation CLI (select.js)
===========================================
Pure JavaScript SQL-like tool for extracting, querying, and updating language units in data.js.

USAGE:
  node select.js <COMMAND> [OPTIONS]

COMMANDS:
  SELECT <cols> [WHERE <cond>] [ORDER BY <col> [ASC|DESC]] [LIMIT <n>] [FORMAT <fmt>]
    Extract a subset of language units matching criteria.
    Available columns: Id, Korean, English, PartofSpeech, SemanticTags, Disambiguation,
                       Conjugation, Source, PriorityScore, FormalityLevel, HonorificRules, SemanticVector, *

    Formats: tsv (default for low complexity), json (default for high complexity / *), jsonl, table, raw

  UPDATE [cols...] FROMFILE <filename>
    Update language units in data.js using data from a file (JSON, JSONL, TSV, or raw JS).
    Matches existing rows by Id (or Korean) and modifies only specified columns.

  UPDATE [KR_EN_languageUnits] SET <col> = <val> [WHERE <cond>]
    Inline SQL update of matching records in data.js.

  INSERT INTO KR_EN_languageUnits (<cols...>) VALUES (<vals...>)
  INSERT FROMFILE <filename>
    Insert new language unit(s) into data.js.

  DELETE FROM KR_EN_languageUnits WHERE <cond>
    Delete matching language units from data.js.

  ADD <colName> <defaultValue> (AFTER <col> | BEFORE <col> | FIRST | LAST)
    Add a new column into data.js schema and all unit rows.

OPTIONS:
  --source, -s <name>   Source tag for newly inserted units (default: ::YYYYMMDD timestamp)
  --format <fmt>        Output format for SELECT: tsv, json, jsonl, table, raw (auto-detected by complexity if omitted)
  --dry-run             Preview changes without modifying data.js
  --data <path>         Target data file path (default: ./data.js)

EXAMPLES:
  # 1. Query columns and output to file:
  node select.js SELECT Korean, English, Id, SemanticVector > output.txt

  # 2. Query with filter and table display:
  node select.js "SELECT Id, Korean, English, PartofSpeech WHERE Source = 'SUOBI01' LIMIT 10 FORMAT table"

  # 3. Filter by tag or wildcard:
  node select.js "SELECT Id, Korean, SemanticTags WHERE SemanticTags CONTAINS 'food'"
  node select.js "SELECT Id, Korean, English WHERE Korean LIKE '%씨%'"

  # 4. Update data.js from an edited file:
  node select.js UPDATE Korean, English, Id, SemanticVector FROMFILE output.txt
  node select.js UPDATE FROMFILE output.txt

  # 5. Inline update:
  node select.js "UPDATE SET FormalityLevel = 'Formal' WHERE Korean = '감사하다'"

  # 6. Insert new units with custom or default timestamp Source:
  node select.js INSERT FROMFILE new_units.json --source class2012
  node select.js "INSERT INTO KR_EN_languageUnits (Korean, English) VALUES ('사과', 'apple')"
`);
}

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
        const result = execute(commandStr, { format, dryRun, dataFile, source });
        if (result.results !== undefined) {
            // SELECT output
            console.log(formatResults(result.results, result.format));
        } else if (result.added !== undefined) {
            // ADD column output
            console.log(result.message);
        } else if (result.updated !== undefined) {
            // UPDATE output
            console.log(`Success: Updated ${result.updated} unit(s) in ${path.basename(dataFile)}${result.inserted ? ` (inserted ${result.inserted})` : ''}${result.dryRun ? ' [DRY RUN]' : ''}.`);
        } else if (result.inserted !== undefined) {
            // INSERT output
            console.log(`Success: Inserted ${result.inserted} unit(s) into ${path.basename(dataFile)}${result.dryRun ? ' [DRY RUN]' : ''}.`);
        } else if (result.deleted !== undefined) {
            // DELETE output
            console.log(`Success: Deleted ${result.deleted} unit(s) from ${path.basename(dataFile)}${result.dryRun ? ' [DRY RUN]' : ''}.`);
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
    formatResults,
    loadData,
    DATA_SCHEMA: SCHEMA_COLUMNS
};
