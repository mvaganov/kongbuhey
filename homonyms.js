/**
 * homonyms.js
 * 
 * Korean Homonym, Allomorphic Stem & Phonetic Confusables Engine for Kongbuhey.
 * Maps surface Hangul tokens to:
 *   1. Direct unit IDs (number): Direct vocabulary matches or base verb stems (e.g. 2 for 저, 44 for 가)
 *   2. Language Unit Trees (LUTs: [grammarId, [childId]]): Conjugated/portmanteau tokens (e.g. 간: [[644, [44]]])
 *   3. Phonetic confusable neighbors ('_neighbor'): Mutually grounded phonetic minimal pairs
 *
 * NOTE FOR LLMs & AGENTS:
 *   The 2,000+ line HOMONYMS dictionary sits at the bottom of this file.
 *   Do NOT load or edit the raw dictionary directly in LLM context; use the CLI commands
 *   or exported query/update methods below.
 */

function printHelp() {
    console.log(`homonyms.js - Korean Homonym, Allomorph & Phonetic Confusables Engine

USAGE:
  node homonyms.js <command> [options]

COMMANDS:
  update                 Incrementally ingest language units from data.js
    --source, -s <tags>  Comma-separated sources (e.g. class2091,class2092)
    --ids <start..end>   ID range (e.g. 1142..1242)
    --clean, --reset     Rebuild dataset cleanly from specified sources
    --dry-run            Preview changes without modifying file

  lookup <token>         Inspect entries and confusability score for a Hangul token
  parse "<text>"         Morphologically analyze text into root words, affixes & syllables
  top [limit]            List top most confusable tokens (default: 10)
  least [limit]          List top least confusable tokens (default: 10)
  stats                  Print dataset metrics (totalTokens, entries, direct, LUTs, phonetics)

LLM WORKFLOW PATTERNS:
  Inspect token:      node homonyms.js lookup 간
  Update after batch: node homonyms.js update --source class2111
  Verify integrity:   node homonyms.js stats
  Confusability:      node homonyms.js top 10
`);
}

const fs = require('fs');
const path = require('path');
const { KR_EN_languageUnits, DATA_SCHEMA } = require('./data.js');
const { getStem, applyMorphology, decomposeHangul, composeHangul } = require('./korean.js');

// =========================================================================
// Phonetic Minimal Pairs & Acoustic Confusability Engine
// =========================================================================

// Consonant triples: [lax, aspirated, tense]
const INITIAL_FAMILIES = [
    [7, 17, 8],   // ㅂ, ㅍ, ㅃ
    [0, 15, 1],   // ㄱ, ㅋ, ㄲ
    [3, 16, 4],   // ㄷ, ㅌ, ㄸ
    [12, 14, 13], // ㅈ, ㅊ, ㅉ
    [9, 10]       // ㅅ, ㅆ
];

// Medial vowel acoustic proximity
const MEDIAL_FAMILIES = [
    [1, 5],       // ㅐ, ㅔ
    [8, 4],       // ㅗ, ㅓ
    [13, 18],     // ㅜ, ㅡ
    [0, 4],       // ㅏ, ㅓ
    [11, 10, 15]  // ㅚ, ㅙ, ㅞ
];

// Coda (Jongseong) neutralizations & acoustic pairs
const FINAL_FAMILIES = [
    [4, 21],      // ㄴ, ㅇ (e.g. 간 <-> 강)
    [4, 8],       // ㄴ, ㄹ (e.g. 간 <-> 갈)
    [7, 19, 20, 22, 23, 25, 27], // ㄷ, ㅅ, ㅆ, ㅈ, ㅊ, ㅌ, ㅎ ([ㄷ] coda neutralization)
    [1, 24, 2],   // ㄱ, ㅋ, ㄲ ([ㄱ] coda neutralization)
    [17, 26]      // ㅂ, ㅍ ([ㅂ] coda neutralization)
];

function getPhoneticCandidates(token) {
    if (!token || typeof token !== 'string') return [];
    const candidates = new Set();

    if (token.length === 1) {
        const d = decomposeHangul(token);
        if (!d) return [];

        for (const fam of INITIAL_FAMILIES) {
            if (fam.includes(d.initial)) {
                for (const alt of fam) if (alt !== d.initial) candidates.add(composeHangul(alt, d.medial, d.final));
            }
        }
        if (d.final > 0) {
            for (const fam of FINAL_FAMILIES) {
                if (fam.includes(d.final)) {
                    for (const alt of fam) if (alt !== d.final) candidates.add(composeHangul(d.initial, d.medial, alt));
                }
            }
        }
        for (const fam of MEDIAL_FAMILIES) {
            if (fam.includes(d.medial)) {
                for (const alt of fam) if (alt !== d.medial) candidates.add(composeHangul(d.initial, alt, d.final));
            }
        }
    } else {
        for (let i = 0; i < token.length; i++) {
            const char = token[i];
            const d = decomposeHangul(char);
            if (!d) continue;

            const charAlts = new Set();
            for (const fam of INITIAL_FAMILIES) {
                if (fam.includes(d.initial)) {
                    for (const alt of fam) if (alt !== d.initial) charAlts.add(composeHangul(alt, d.medial, d.final));
                }
            }
            if (d.final > 0) {
                for (const fam of FINAL_FAMILIES) {
                    if (fam.includes(d.final)) {
                        for (const alt of fam) if (alt !== d.final) charAlts.add(composeHangul(d.initial, d.medial, alt));
                    }
                }
            }
            for (const fam of MEDIAL_FAMILIES) {
                if (fam.includes(d.medial)) {
                    for (const alt of fam) if (alt !== d.medial) charAlts.add(composeHangul(d.initial, alt, d.final));
                }
            }

            for (const altChar of charAlts) {
                const altWord = token.substring(0, i) + altChar + token.substring(i + 1);
                candidates.add(altWord);
            }
        }
    }

    return Array.from(candidates);
}

function getPhoneticNeighbors(token, map = HOMONYMS) {
    const candidates = getPhoneticCandidates(token);
    const neighbors = [];
    for (const alt of candidates) {
        if (alt !== token && (!map || map[alt])) {
            neighbors.push('_' + alt);
        }
    }
    return neighbors;
}

function linkConfusableTokens(map, token) {
    if (!token || typeof token !== 'string') return;
    const candidates = getPhoneticCandidates(token);
    for (const alt of candidates) {
        if (alt !== token && map[alt]) {
            const altTag = '_' + alt;
            const tokenTag = '_' + token;
            if (!map[token].includes(altTag)) map[token].push(altTag);
            if (!map[alt].includes(tokenTag)) map[alt].push(tokenTag);
        }
    }
}

function pruneInvalidConfusables(map) {
    for (const key of Object.keys(map)) {
        if (!/^[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\s]+$/.test(key)) {
            delete map[key];
            continue;
        }
        map[key] = map[key].filter(e => {
            if (typeof e === 'string' && e.startsWith('_')) {
                const target = e.substring(1);
                return !!map[target];
            }
            return true;
        });
    }
}

// =========================================================================
// Entry Management & Ingestion Pipeline
// =========================================================================

function areLutsEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}

function addHomonymEntry(map, token, entry) {
    if (!token || typeof token !== 'string') return;
    const t = token.trim();
    if (!t) return;
    // Keys must exclusively be Hangul (syllables, jamo, and spaces between words)
    if (!/^[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\s]+$/.test(t)) return;
    if (!map[t]) map[t] = [];
    const arr = map[t];

    if (entry !== undefined && entry !== null) {
        if (typeof entry === 'number') {
            if (!arr.includes(entry)) arr.push(entry);
        } else if (typeof entry === 'string') {
            if (entry.startsWith('_')) {
                const target = entry.substring(1);
                if (map[target] && !arr.includes(entry)) {
                    arr.push(entry);
                }
            } else {
                if (!arr.includes(entry)) arr.push(entry);
            }
        } else if (Array.isArray(entry)) {
            if (!arr.some(e => Array.isArray(e) && areLutsEqual(e, entry))) {
                arr.push(entry);
            }
        }
    }

    // Bidirectional confusable check with existing entries in map
    linkConfusableTokens(map, t);
}

function extractEntriesForUnit(unit, map) {
    if (!unit) return;
    const id = unit[DATA_SCHEMA.Id];
    const ko = unit[DATA_SCHEMA.Korean];
    const pos = unit[DATA_SCHEMA.PartofSpeech];
    const conj = unit[DATA_SCHEMA.Conjugation];

    // Key reference grammar units
    const grammarPolite = KR_EN_languageUnits.find(u => u && u[DATA_SCHEMA.Korean] === '~아요 / ~어요 / ~해요');
    const grammarFormal = KR_EN_languageUnits.find(u => u && u[DATA_SCHEMA.Korean] === '~습니다 / ~ㅂ니다');
    const grammarModifierPast = KR_EN_languageUnits.find(u => u && u[DATA_SCHEMA.Korean] === '~(으)ㄴ');
    const grammarTopic = KR_EN_languageUnits.find(u => u && u[DATA_SCHEMA.Korean] === '은 / 는');
    const grammarSubject = KR_EN_languageUnits.find(u => u && u[DATA_SCHEMA.Korean] === '이 / 가');

    const idPolite = grammarPolite ? grammarPolite[DATA_SCHEMA.Id] : 49;
    const idFormal = grammarFormal ? grammarFormal[DATA_SCHEMA.Id] : 50;
    const idModifierPast = grammarModifierPast ? grammarModifierPast[DATA_SCHEMA.Id] : 644;
    const idTopic = grammarTopic ? grammarTopic[DATA_SCHEMA.Id] : 36;
    const idSubject = grammarSubject ? grammarSubject[DATA_SCHEMA.Id] : 96;

    // 1. Direct lexical form (skip grammar template names with ~, -, / and handle Grammar units in step 4)
    if (pos !== 'Grammar') {
        const cleanLexical = ko.replace(/\s*\([^)]*\)/g, '').trim();
        if (!cleanLexical.startsWith('~') && !cleanLexical.startsWith('-') && !cleanLexical.includes('/')) {
            addHomonymEntry(map, cleanLexical, id);
        }
    }

    // 2. Irregular particle forms for Pronouns
    if (pos === 'Pronoun') {
        if (ko === '누구') {
            addHomonymEntry(map, '누가', [idSubject, [id]]);
        } else if (ko === '저') {
            addHomonymEntry(map, '제가', [idSubject, [id]]);
            addHomonymEntry(map, '저는', [idTopic, [id]]);
        } else if (ko === '나') {
            addHomonymEntry(map, '내가', [idSubject, [id]]);
            addHomonymEntry(map, '나는', [idTopic, [id]]);
        }
    }

    // 3. Verbs / Descriptive Verbs (Stems, Allomorphs & Portmanteaus)
    if (pos === 'Action Verb' || pos === 'Descriptive Verb') {
        const stem = getStem(ko);
        if (stem) {
            addHomonymEntry(map, stem, id);
        }

        const conjTag = (conj && conj !== 'regular' && conj !== '') ? `[${conj}]` : '';

        // A. Polite ending (~아/어요)
        try {
            const politeFull = applyMorphology(`${stem}${conjTag}아/어요`);
            if (politeFull && politeFull.endsWith('요')) {
                const politeStem = politeFull.slice(0, -1);
                if (politeStem !== stem) {
                    addHomonymEntry(map, politeStem, [idPolite, [id]]);
                }
            }
        } catch (e) {}

        // B. Noun modifier past / adjective present (~(으)ㄴ)
        try {
            const modFull = applyMorphology(`${stem}${conjTag}으/ㄴ`);
            if (modFull && modFull !== stem) {
                addHomonymEntry(map, modFull, [idModifierPast, [id]]);
            }
        } catch (e) {}

        // C. Formal declarative (~습니다 / ~ㅂ니다)
        try {
            const formalFull = applyMorphology(`${stem}${conjTag}습니다/ㅂ니다`);
            if (formalFull && formalFull.endsWith('니다')) {
                const formalStem = formalFull.slice(0, -2);
                if (formalStem !== stem && formalStem.length <= stem.length) {
                    addHomonymEntry(map, formalStem, [idFormal, [id]]);
                }
            }
        } catch (e) {}

        // D. ㄹ-drop verbs (e.g. 팔다 -> 파는)
        if (stem.endsWith('ㄹ')) {
            const dropped = stem.slice(0, -1);
            addHomonymEntry(map, dropped, [idTopic, [id]]);
        }
    }

    // 4. Grammar units (extract actual surface particles and slash variants)
    if (pos === 'Grammar') {
        const cleanKo = ko.replace(/\s*\([^)]*\)/g, '').trim();
        if (cleanKo.includes('/')) {
            const parts = cleanKo.split('/').map(p => p.trim().replace(/^[~-]/, '')).filter(Boolean);
            for (const p of parts) {
                if (p && !p.includes('{') && !p.includes('}')) {
                    addHomonymEntry(map, p, id);
                }
            }
        } else if (!cleanKo.startsWith('~') && !cleanKo.startsWith('-') && !cleanKo.includes('{')) {
            addHomonymEntry(map, cleanKo, id);
        }
    }
}

function updateHomonyms(options = {}) {
    const targetFile = options.targetFile || __filename;
    const sources = options.sources ? new Set(options.sources) : null;
    const idRange = options.idRange || null;
    const dryRun = !!options.dryRun;

    // Filter units
    const targetUnits = KR_EN_languageUnits.filter(u => {
        if (!u) return false;
        if (sources && !sources.has(u[DATA_SCHEMA.Source])) return false;
        if (idRange) {
            const id = u[DATA_SCHEMA.Id];
            if (id < idRange[0] || id > idRange[1]) return false;
        }
        return true;
    });

    if (targetUnits.length === 0) {
        return { updated: 0, message: "No matching units found in data.js" };
    }

    // Clone existing HOMONYMS (unless options.reset is true)
    const updatedMap = {};
    if (!options.reset) {
        for (const [k, v] of Object.entries(HOMONYMS)) {
            updatedMap[k] = [...v];
        }
    }

    // Ingest target units
    for (const unit of targetUnits) {
        extractEntriesForUnit(unit, updatedMap);
    }

    // Prune any confusable entries whose target is not in the dictionary
    pruneInvalidConfusables(updatedMap);

    const totalKeys = Object.keys(updatedMap).length;

    if (!dryRun) {
        // Serialize updatedMap neatly
        const sortedKeys = Object.keys(updatedMap).sort((a, b) => a.localeCompare(b, 'ko'));
        const lines = sortedKeys.map(k => `\t${JSON.stringify(k)}: ${JSON.stringify(updatedMap[k])},`);
        const block = `// --- BEGIN HOMONYMS DATA ---\nconst HOMONYMS = {\n${lines.join('\n')}\n};\n// --- END HOMONYMS DATA ---`;

        const content = fs.readFileSync(targetFile, 'utf8');
        const pattern = /\/\/ --- BEGIN HOMONYMS DATA ---[\s\S]*?\/\/ --- END HOMONYMS DATA ---/;
        if (!pattern.test(content)) {
            throw new Error("Could not find HOMONYMS data block delimiters in target file.");
        }
        const newContent = content.replace(pattern, block);
        fs.writeFileSync(targetFile, newContent, 'utf8');
    }

    return {
        updatedUnits: targetUnits.length,
        totalTokens: totalKeys,
        dryRun
    };
}

// =========================================================================
// Public Query & Scoring API
// =========================================================================

function lookupToken(token) {
    if (!token) return [];
    return HOMONYMS[token.trim()] || [];
}

function getConfusabilityScore(token) {
    const entries = lookupToken(token);
    if (!entries || entries.length === 0) return 0;

    let directUnits = 0;
    let luts = 0;
    let phonetic = 0;

    for (const e of entries) {
        if (typeof e === 'number') directUnits++;
        else if (Array.isArray(e)) luts++;
        else if (typeof e === 'string' && e.startsWith('_')) phonetic++;
    }

    // Weighted confusability formula
    return (directUnits * 1.0) + (luts * 1.2) + (phonetic * 0.8);
}

function getTopConfusableTokens(limit = 10) {
    const scored = Object.keys(HOMONYMS).map(t => ({
        token: t,
        score: parseFloat(getConfusabilityScore(t).toFixed(2)),
        entries: HOMONYMS[t]
    }));

    scored.sort((a, b) => b.score - a.score || b.entries.length - a.entries.length);
    return scored.slice(0, limit);
}

function getLeastConfusableTokens(limit = 10) {
    const scored = Object.keys(HOMONYMS).map(t => ({
        token: t,
        score: parseFloat(getConfusabilityScore(t).toFixed(2)),
        entries: HOMONYMS[t]
    }));

    // Least confusable: lowest score, tie-break by longer token length (more specific)
    scored.sort((a, b) => a.score - b.score || b.token.length - a.token.length);
    return scored.slice(0, limit);
}

function parseKoreanParagraph(text) {
    if (!text || typeof text !== 'string') return [];
    const words = text.match(/[\w가-힣]+/g) || [];
    const findings = [];

    for (const word of words) {
        const direct = lookupToken(word);
        
        // Morphological segmentation: check prefixes and suffixes
        const subTokens = [];
        for (let len = word.length - 1; len >= 1; len--) {
            const prefix = word.substring(0, len);
            const suffix = word.substring(len);
            const pEntries = lookupToken(prefix);
            const sEntries = lookupToken(suffix);
            if (pEntries.length > 0) {
                subTokens.push({ position: 'prefix', token: prefix, entries: pEntries });
            }
            if (sEntries.length > 0) {
                subTokens.push({ position: 'suffix', token: suffix, entries: sEntries });
            }
        }

        // Deduplicate subTokens
        const uniqueSub = [];
        const seen = new Set();
        for (const st of subTokens) {
            const k = `${st.position}:${st.token}`;
            if (!seen.has(k)) {
                seen.add(k);
                uniqueSub.push(st);
            }
        }

        const syllables = Array.from(word).map(char => ({ char, entries: lookupToken(char) }));

        findings.push({
            word,
            directEntries: direct,
            subTokens: uniqueSub,
            syllableDecomposition: syllables.filter(s => s.entries.length > 0)
        });
    }

    return findings;
}

function getStats() {
    const keys = Object.keys(HOMONYMS);
    let totalEntries = 0;
    let directCount = 0;
    let lutCount = 0;
    let phoneticCount = 0;

    for (const k of keys) {
        for (const e of HOMONYMS[k]) {
            totalEntries++;
            if (typeof e === 'number') directCount++;
            else if (Array.isArray(e)) lutCount++;
            else if (typeof e === 'string' && e.startsWith('_')) phoneticCount++;
        }
    }

    return {
        totalTokens: keys.length,
        totalEntries,
        directUnits: directCount,
        languageUnitTrees: lutCount,
        phoneticLinks: phoneticCount
    };
}

// =========================================================================
// CLI Runner
// =========================================================================

// =========================================================================
// CLI Runner
// =========================================================================

function runCli() {
    const args = process.argv.slice(2);
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        printHelp();
        process.exit(0);
    }

    const command = args[0].toLowerCase();

    if (command === 'update') {
        let sources = null;
        let idRange = null;
        let dryRun = false;
        let reset = false;

        for (let i = 1; i < args.length; i++) {
            const a = args[i];
            if ((a === '--source' || a === '-s') && i + 1 < args.length) {
                sources = args[++i].split(',').map(s => s.trim()).filter(Boolean);
            } else if (a.startsWith('--source=')) {
                sources = a.substring(9).split(',').map(s => s.trim()).filter(Boolean);
            } else if (a === '--ids' && i + 1 < args.length) {
                const parts = args[++i].split('..').map(Number);
                if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) idRange = parts;
            } else if (a === '--dry-run') {
                dryRun = true;
            } else if (a === '--reset' || a === '--clean') {
                reset = true;
            }
        }

        const res = updateHomonyms({ sources, idRange, dryRun, reset });
        console.log(`Update complete: Processed ${res.updatedUnits} units. Dataset now contains ${res.totalTokens} tokens${res.dryRun ? ' [DRY RUN]' : ''}.`);
    } else if (command === 'lookup') {
        const token = args[1];
        if (!token) {
            console.error("Error: Please specify a token to look up (e.g. node homonyms.js lookup 간)");
            process.exit(1);
        }
        const entries = lookupToken(token);
        console.log(`\nHomonym entries for "${token}" (Score: ${getConfusabilityScore(token).toFixed(2)}):`);
        console.log(JSON.stringify(entries, null, 2));
    } else if (command === 'top') {
        const limit = parseInt(args[1], 10) || 10;
        const top = getTopConfusableTokens(limit);
        console.log(`\n=== Top ${limit} Most Easily Confusable Tokens ===`);
        top.forEach((item, idx) => {
            console.log(`${String(idx + 1).padStart(2)}. "${item.token}" (Score: ${item.score}) -> ${JSON.stringify(item.entries)}`);
        });
    } else if (command === 'least') {
        const limit = parseInt(args[1], 10) || 10;
        const least = getLeastConfusableTokens(limit);
        console.log(`\n=== Top ${limit} Least Confusable Tokens ===`);
        least.forEach((item, idx) => {
            console.log(`${String(idx + 1).padStart(2)}. "${item.token}" (Score: ${item.score}) -> ${JSON.stringify(item.entries)}`);
        });
    } else if (command === 'parse') {
        const text = args.slice(1).join(' ');
        if (!text) {
            console.error("Error: Please provide a Korean sentence/paragraph to parse.");
            process.exit(1);
        }
        const results = parseKoreanParagraph(text);
        console.log(`\n=== Reverse Ingestion Analysis ===`);
        for (const item of results) {
            console.log(`\nWord: "${item.word}"`);
            if (item.directEntries.length > 0) {
                console.log(`  Direct Match: ${JSON.stringify(item.directEntries)}`);
            }
            if (item.subTokens && item.subTokens.length > 0) {
                console.log(`  Sub-Tokens / Affixes:`);
                for (const st of item.subTokens) {
                    console.log(`    [${st.position}] "${st.token}": ${JSON.stringify(st.entries)}`);
                }
            }
            if (item.syllableDecomposition.length > 0) {
                console.log(`  Syllable Breakdown:`);
                for (const syl of item.syllableDecomposition) {
                    console.log(`    "${syl.char}": ${JSON.stringify(syl.entries)}`);
                }
            }
        }
    } else if (command === 'stats') {
        console.log("\n=== Homonyms Dataset Metrics ===");
        console.log(JSON.stringify(getStats(), null, 2));
    } else {
        console.error(`Unrecognized command: ${command}`);
        printHelp();
        process.exit(1);
    }
}

// --- BEGIN HOMONYMS DATA ---
const HOMONYMS = {
	"가": [44,96],
	"가 아니에요": [95],
	"가게": [557],
	"가까운": [[644,[650]]],
	"가까워": [[49,[650]]],
	"가깝": [650],
	"가깝다": [650],
	"가끔": [48,464],
	"가다": [44],
	"가르쳐": [[49,[145]]],
	"가르치": [145],
	"가르치다": [145],
	"가르친": [[644,[145]]],
	"가르칩": [[50,[145]]],
	"가방": [83],
	"가벼운": [[644,[545]]],
	"가벼워": [[49,[545]]],
	"가볍": [545],
	"가볍다": [545],
	"가수": [27],
	"가을": [736],
	"가전제품": [1023],
	"가지고 오": [714],
	"가지고 오다": [714],
	"가지고 온": [[644,[714]]],
	"가지고 옵": [[50,[714]]],
	"가지고 와": [[49,[714]]],
	"간": [[644,[44]],"_강","_건",960],
	"간호사": [28],
	"갈아입": [1047],
	"갈아입다": [1047],
	"갈아입어": [[49,[1047]]],
	"갈아입은": [[644,[1047]]],
	"갈아타": [673],
	"갈아타다": [673],
	"갈아탄": [[644,[673]]],
	"갈아탑": [[50,[673]]],
	"감": [998],
	"감사하": [20],
	"감사하다": [20],
	"감사한": [[644,[20]]],
	"감사합": [[50,[20]]],
	"감사해": [[49,[20]]],
	"감자": [961],
	"갑": [[50,[44]],"_겁"],
	"갑자기": [1159],
	"값": [532],
	"강": [178,"_간"],
	"강아지": [1094],
	"같이": [325],
	"개": [329,"_깨"],
	"거기": [696,"_고기"],
	"거리": [858],
	"거실": [913],
	"거울": [65],
	"거의": [914],
	"건": [[644,[915]],"_걸","_간"],
	"건강하": [782],
	"건강하다": [782],
	"건강한": [[644,[782]]],
	"건강합": [[50,[782]]],
	"건강해": [[49,[782]]],
	"건너": [699],
	"건너다": [699],
	"건너편": [697],
	"건넌": [[644,[699]]],
	"건넙": [[50,[699]]],
	"걷": [362,"_것"],
	"걷다": [362],
	"걸": [915,"_건"],
	"걸다": [915],
	"걸려": [[49,[651]]],
	"걸리": [651],
	"걸리다": [651],
	"걸린": [[644,[651]]],
	"걸립": [[50,[651]]],
	"걸어": [[49,[362]],[49,[915]]],
	"걸은": [[644,[362]]],
	"겁": [[50,[915]],"_갑"],
	"것": [581,"_걷","_곳"],
	"게스트하우스": [743],
	"게임": [155],
	"게임하": [166],
	"게임하다": [166],
	"게임한": [[644,[166]]],
	"게임합": [[50,[166]]],
	"게임해": [[49,[166]]],
	"겨울": [737],
	"결석하": [1184],
	"결석하다": [1184],
	"결석한": [[644,[1184]]],
	"결석합": [[50,[1184]]],
	"결석해": [[49,[1184]]],
	"경영학": [802],
	"경제학": [803],
	"경치": [186],
	"계셔": [[49,[504]]],
	"계시": [504],
	"계시다": [504],
	"계신": [[644,[504]]],
	"계십": [[50,[504]]],
	"계약하": [895],
	"계약하다": [895],
	"계약한": [[644,[895]]],
	"계약합": [[50,[895]]],
	"계약해": [[49,[895]]],
	"계절": [728],
	"계획을 세우": [748],
	"계획을 세우다": [748],
	"계획을 세운": [[644,[748]]],
	"계획을 세웁": [[50,[748]]],
	"계획을 세워": [[49,[748]]],
	"고기": [962,"_거기"],
	"고르": [604],
	"고르다": [604],
	"고른": [[644,[604]]],
	"고릅": [[50,[604]]],
	"고마운": [[644,[231]]],
	"고마워": [[49,[231]]],
	"고맙": [231],
	"고맙다": [231],
	"고모": [840],
	"고모부": [841],
	"고속버스": [654],
	"고속버스터미널": [669],
	"고유어 수량 표현": [280,282],
	"고유어 숫자 세기": [284],
	"고추장": [933],
	"고향": [174],
	"골라": [[49,[604]]],
	"골프": [374],
	"골프장": [375],
	"곳": [558,"_것"],
	"공무원": [842],
	"공부하": [167],
	"공부하다": [167],
	"공부한": [[644,[167]]],
	"공부합": [[50,[167]]],
	"공부해": [[49,[167]]],
	"공원": [418],
	"공책": [79],
	"공항": [670],
	"공항버스": [655],
	"과일": [291],
	"과자": [509],
	"관광지": [880],
	"광고 회사": [783],
	"광화문": [1213],
	"괜찮": [21],
	"괜찮다": [21],
	"괜찮아": [[49,[21]]],
	"괜찮은": [[644,[21]]],
	"교과서": [224],
	"교수": [486],
	"교실": [58],
	"교육학": [804],
	"교통카드": [1214],
	"구": [244],
	"구경거리": [859],
	"구경하": [513],
	"구경하다": [513],
	"구경한": [[644,[513]]],
	"구경합": [[50,[513]]],
	"구경해": [[49,[513]]],
	"구두": [533],
	"구십": [270],
	"구운": [[644,[963]]],
	"구워": [[49,[963]]],
	"국가 번호": [624],
	"국어국문학": [805],
	"굽": [963],
	"굽다": [963],
	"권": [567],
	"귀": [818],
	"귀걸이": [1024],
	"그것": [59],
	"그래": [[49,[1069]],1142],
	"그래서": [602],
	"그래요": [528],
	"그런": [[644,[1069]]],
	"그럼": [290],
	"그렇": [1069],
	"그렇다": [1069],
	"그렇지만": [601],
	"그릇": [318],
	"그리고": [353],
	"그리운": [[644,[881]]],
	"그리워": [[49,[881]]],
	"그림을 그려": [[49,[517]]],
	"그림을 그리": [517],
	"그림을 그리다": [517],
	"그림을 그린": [[644,[517]]],
	"그림을 그립": [[50,[517]]],
	"그립": [881],
	"그립다": [881],
	"그만두": [784],
	"그만두다": [784],
	"그만둔": [[644,[784]]],
	"그만둡": [[50,[784]]],
	"그만둬": [[49,[784]]],
	"그제": [421],
	"그쪽": [687],
	"극장": [478],
	"근처": [117],
	"글쎄요": [477],
	"금년": [422],
	"금요일": [347],
	"급하": [1160],
	"급하다": [1160],
	"급한": [[644,[1160]]],
	"급합": [[50,[1160]]],
	"급해": [[49,[1160]]],
	"기": [738],
	"기 전에": [710],
	"기다려": [[49,[146]]],
	"기다리": [146],
	"기다리다": [146],
	"기다린": [[644,[146]]],
	"기다립": [[50,[146]]],
	"기대": [1095],
	"기름": [964],
	"기뻐": [[49,[882]]],
	"기쁘": [882],
	"기쁘다": [882],
	"기쁜": [[644,[882]]],
	"기쁩": [[50,[882]]],
	"기숙사": [103],
	"기자": [29,"_기차"],
	"기차": [656,"_기자"],
	"기차표": [445],
	"긴": [[644,[312]],"_길"],
	"길": [312,"_긴"],
	"길다": [312],
	"길어": [[49,[312]]],
	"김밥": [326],
	"김치": [401],
	"깁": [[50,[312]]],
	"까만": [[644,[1070]]],
	"까맣": [1070],
	"까맣다": [1070],
	"까매": [[49,[1070]]],
	"깎": [934],
	"깎다": [934],
	"깎아": [[49,[934]]],
	"깎은": [[644,[934]]],
	"깨": [1215,"_개","_께"],
	"깨끗하": [191],
	"깨끗하다": [191],
	"깨끗한": [[644,[191]]],
	"깨끗합": [[50,[191]]],
	"깨끗해": [[49,[191]]],
	"깨다": [1215],
	"깬": [[644,[1215]]],
	"깹": [[50,[1215]]],
	"꺼": [[49,[674]],"_커"],
	"께": [647,"_깨"],
	"께서": [648],
	"꽃": [104,965],
	"꽃다": [965],
	"꽃다발": [582],
	"꽃바구니": [1115],
	"꽃아": [[49,[965]]],
	"꽃은": [[644,[965]]],
	"꽃집": [159],
	"끄": [674,"_크"],
	"끄다": [674,"_크다"],
	"끈": [[644,[674]],"_큰"],
	"끓이": [966],
	"끓이다": [966],
	"끓이에": [[49,[966]]],
	"끓인": [[644,[966]]],
	"끓입": [[50,[966]]],
	"끕": [[50,[674]],"_큽"],
	"끝": [764],
	"끝나": [356],
	"끝나다": [356],
	"끝난": [[644,[356]]],
	"끝납": [[50,[356]]],
	"ㄴ 적이 있다": [679],
	"ㄴ 후에": [710],
	"나가": [706],
	"나가다": [706],
	"나간": [[644,[706]]],
	"나갑": [[50,[706]]],
	"나라": [6],
	"나빠": [[49,[124]]],
	"나쁘": [124],
	"나쁘다": [124],
	"나쁜": [[644,[124]]],
	"나쁩": [[50,[124]]],
	"나이": [250],
	"나흘": [1161],
	"날마다": [156,473],
	"날씨": [123],
	"날씬하": [819],
	"날씬하다": [819],
	"날씬한": [[644,[819]]],
	"날씬합": [[50,[819]]],
	"날씬해": [[49,[819]]],
	"남동생": [491],
	"남성복": [1025],
	"남자": [187],
	"남해": [860],
	"내": [1216,"_네"],
	"내년": [423],
	"내다": [1216],
	"내려": [[49,[667]]],
	"내려가": [707],
	"내려가다": [707],
	"내려간": [[644,[707]]],
	"내려갑": [[50,[707]]],
	"내리": [667],
	"내리다": [667],
	"내린": [[644,[667]]],
	"내립": [[50,[667]]],
	"내일": [46,424],
	"낸": [[644,[1216]]],
	"냄비": [967],
	"냅": [[50,[1216]]],
	"냉동식품": [999],
	"냉면": [292],
	"너무": [400],
	"너희": [1143],
	"넣": [935,"_놓"],
	"넣다": [935,"_놓다"],
	"넣어": [[49,[935]]],
	"넣은": [[644,[935]],"_놓은"],
	"네": [4,215,"_내"],
	"넥타이": [583],
	"넷": [255],
	"노란": [[644,[1071]]],
	"노랗": [1071],
	"노랗다": [1071],
	"노래": [[49,[1071]]],
	"노래방": [160],
	"노래하": [168],
	"노래하다": [168],
	"노래한": [[644,[168]]],
	"노래합": [[50,[168]]],
	"노래해": [[49,[168]]],
	"노르웨이": [7],
	"노선도": [1217],
	"노약자석": [1218],
	"녹차": [293],
	"논": [[644,[313]],"_놀"],
	"놀": [313,"_논"],
	"놀다": [313],
	"놀아": [[49,[313]]],
	"놀이공원": [474],
	"놉": [[50,[313]]],
	"농구": [376],
	"농구장": [377],
	"놓": [916,"_넣",1185],
	"놓다": [916,"_넣다",1185],
	"놓아": [[49,[916]],[49,[1185]]],
	"놓은": [[644,[916]],"_넣은",[644,[1185]]],
	"누가": [[96,[30]],66,[96,[514]]],
	"누구": [30,514],
	"누나": [492],
	"누르": [1219],
	"누르다": [1219],
	"누른": [[644,[1219]]],
	"누릅": [[50,[1219]]],
	"눈사람": [729],
	"눈싸움을 하": [731],
	"눈싸움을 하다": [731],
	"눈싸움을 한": [[644,[731]]],
	"눈싸움을 합": [[50,[731]]],
	"눈싸움을 해": [[49,[731]]],
	"눈이 오": [722],
	"눈이 오다": [722],
	"눈이 온": [[644,[722]]],
	"눈이 옵": [[50,[722]]],
	"눈이 와": [[49,[722]]],
	"눌러": [[49,[1219]]],
	"뉴스": [631],
	"는": [36,"_늘",[644,[1186]]],
	"는 것": [738],
	"늘": [1186,"_는"],
	"늘다": [1186],
	"늘어": [[49,[1186]]],
	"늡": [[50,[1186]]],
	"늦": [452],
	"늦게": [455],
	"늦다": [452],
	"늦어": [[49,[452]]],
	"늦은": [[644,[452]]],
	"다": [752,"_타","_더"],
	"다녀": [[49,[785]]],
	"다녀오": [861],
	"다녀오다": [861],
	"다녀온": [[644,[861]]],
	"다녀옵": [[50,[861]]],
	"다녀와": [[49,[861]]],
	"다니": [785],
	"다니다": [785],
	"다닌": [[644,[785]]],
	"다닙": [[50,[785]]],
	"다르": [614],
	"다르다": [614],
	"다른": [[644,[614]]],
	"다릅": [[50,[614]]],
	"다섯": [216],
	"다음": [426],
	"다음달": [428],
	"다음일": [425],
	"다음주": [429],
	"다져": [[49,[968]]],
	"다지": [968],
	"다지다": [968],
	"다진": [[644,[968]]],
	"다집": [[50,[968]]],
	"닦": [360],
	"닦다": [360],
	"닦아": [[49,[360]]],
	"닦은": [[644,[360]]],
	"단": [[644,[314]],"_달","_탄","_던"],
	"단말기": [1220],
	"단순하": [1072],
	"단순하다": [1072],
	"단순한": [[644,[1072]]],
	"단순합": [[50,[1072]]],
	"단순해": [[49,[1072]]],
	"단풍 구경을 하": [732],
	"단풍 구경을 하다": [732],
	"단풍 구경을 한": [[644,[732]]],
	"단풍 구경을 합": [[50,[732]]],
	"단풍 구경을 해": [[49,[732]]],
	"닫": [232],
	"닫다": [232],
	"닫아": [[49,[232]]],
	"닫은": [[644,[232]]],
	"달": [314,"_단",427,"_덜"],
	"달다": [314,"_덜다"],
	"달라": [[49,[614]]],
	"달력": [67],
	"달아": [[49,[314]]],
	"닭고기": [969],
	"담배를 피우": [733],
	"담배를 피우다": [733],
	"담배를 피운": [[644,[733]]],
	"담배를 피웁": [[50,[733]]],
	"담배를 피워": [[49,[733]]],
	"답": [[50,[314]],"_덥","_탑"],
	"닷새": [1162],
	"당겨": [[49,[1187]]],
	"당근": [970],
	"당기": [1187],
	"당기다": [1187],
	"당긴": [[644,[1187]]],
	"당깁": [[50,[1187]]],
	"대": [1221],
	"대다": [1221],
	"대학교": [487],
	"대학원": [806],
	"대화": [225],
	"대회": [1000],
	"댁": [642],
	"댄": [[644,[1221]]],
	"댑": [[50,[1221]]],
	"더": [530,"_도","_다"],
	"더러운": [[644,[192]]],
	"더러워": [[49,[192]]],
	"더럽": [192],
	"더럽다": [192],
	"더운": [[644,[125]],"_도운"],
	"더워": [[49,[125]]],
	"던": [[644,[936]],"_덜","_돈","_단"],
	"덜": [936,"_달","_던"],
	"덜다": [936,"_달다"],
	"덜어": [[49,[936]]],
	"덥": [125,"_답","_돕",[50,[936]]],
	"덥다": [125,"_돕다"],
	"데이트하": [404],
	"데이트하다": [404],
	"데이트한": [[644,[404]]],
	"데이트합": [[50,[404]]],
	"데이트해": [[49,[404]]],
	"도": [366,"_더"],
	"도서관": [97],
	"도시": [862],
	"도와": [[49,[411]]],
	"도와주": [820],
	"도와주다": [820],
	"도와준": [[644,[820]]],
	"도와줍": [[50,[820]]],
	"도와줘": [[49,[820]]],
	"도운": [[644,[411]],"_더운"],
	"도움": [1096],
	"도착하": [675],
	"도착하다": [675],
	"도착한": [[644,[675]]],
	"도착합": [[50,[675]]],
	"도착해": [[49,[675]]],
	"독서를 하": [518],
	"독서를 하다": [518],
	"독서를 한": [[644,[518]]],
	"독서를 합": [[50,[518]]],
	"독서를 해": [[49,[518]]],
	"돈": [84,"_던"],
	"돈을 바꾸": [758],
	"돈을 바꾸다": [758],
	"돈을 바꾼": [[644,[758]]],
	"돈을 바꿉": [[50,[758]]],
	"돈을 바꿔": [[49,[758]]],
	"돌아오": [760],
	"돌아오다": [760],
	"돌아온": [[644,[760]]],
	"돌아옵": [[50,[760]]],
	"돌아와": [[49,[760]]],
	"돕": [411,"_덥"],
	"돕다": [411,"_덥다"],
	"동네": [896],
	"동물원": [479],
	"동아리": [1097],
	"동창": [1098],
	"동창회": [863],
	"동해": [1099],
	"동호회": [1100],
	"돼지고기": [971],
	"되다": [574],
	"된장": [937],
	"두": [213,972],
	"두꺼운": [[644,[546]]],
	"두꺼워": [[49,[546]]],
	"두껍": [546],
	"두껍다": [546],
	"두다": [972],
	"둔": [[644,[972]],"_둘","_든"],
	"둘": [253,"_들","_둔"],
	"둘다": [1026,"_들다"],
	"둡": [[50,[972]],"_듭"],
	"둬": [[49,[972]]],
	"뒤": [105,"_뛰"],
	"뒤풀이": [1144],
	"드디어": [1101],
	"드라마": [475],
	"드려": [[49,[591]]],
	"드리": [591],
	"드리다": [591],
	"드린": [[644,[591]]],
	"드립": [[50,[591]]],
	"드셔": [[49,[505]]],
	"드시": [505],
	"드시다": [505],
	"드신": [[644,[505]]],
	"드십": [[50,[505]]],
	"든": [[644,[1102]],"_들","_둔"],
	"듣": [147],
	"듣다": [147],
	"들": [550,"_둘",1102,"_든"],
	"들다": [1102,"_둘다"],
	"들어": [[49,[147]],[49,[1102]]],
	"들어가": [708],
	"들어가다": [708],
	"들어간": [[644,[708]]],
	"들어갑": [[50,[708]]],
	"들어주": [1188],
	"들어주다": [1188],
	"들어준": [[644,[1188]]],
	"들어줍": [[50,[1188]]],
	"들어줘": [[49,[1188]]],
	"들은": [[644,[147]]],
	"듭": [[50,[1102]],"_둡"],
	"등산하": [398],
	"등산하다": [398],
	"등산한": [[644,[398]]],
	"등산합": [[50,[398]]],
	"등산해": [[49,[398]]],
	"따뜻하": [713],
	"따뜻하다": [713],
	"따뜻한": [[644,[713]]],
	"따뜻합": [[50,[713]]],
	"따뜻해": [[49,[713]]],
	"따로": [1073],
	"딸기": [294],
	"떠나": [751],
	"떠나다": [751],
	"떠난": [[644,[751]]],
	"떠납": [[50,[751]]],
	"떠든": [[644,[1048]],"_떠들"],
	"떠들": [1048,"_떠든"],
	"떠들다": [1048],
	"떠들어": [[49,[1048]]],
	"떠듭": [[50,[1048]]],
	"떡": [1116],
	"떡국": [773],
	"똑똑하": [821],
	"똑똑하다": [821],
	"똑똑한": [[644,[821]]],
	"똑똑합": [[50,[821]]],
	"똑똑해": [[49,[821]]],
	"똑바로": [695],
	"뛰": [1049,"_뒤"],
	"뛰다": [1049],
	"뛰어": [[49,[1049]]],
	"뛴": [[644,[1049]]],
	"뜁": [[50,[1049]]],
	"랑": [276],
	"러 가다": [485],
	"롤러코스터": [864],
	"룸메이트": [897],
	"를": [173],
	"마리": [330],
	"마셔": [[49,[41]]],
	"마시": [41],
	"마시다": [41],
	"마신": [[644,[41]]],
	"마십": [[50,[41]]],
	"마음": [822],
	"마음에 든": [[644,[1074]],"_마음에 들"],
	"마음에 들": [1074,"_마음에 든"],
	"마음에 들다": [1074],
	"마음에 들어": [[49,[1074]]],
	"마음에 듭": [[50,[1074]]],
	"마트": [1001],
	"마흔": [261,1163],
	"만": [273,"_먼",531,"_말",[644,[938]]],
	"만나": [148],
	"만나다": [148],
	"만난": [[644,[148]]],
	"만납": [[50,[148]]],
	"만든": [[644,[286]],"_만들"],
	"만들": [286,"_만든"],
	"만들다": [286],
	"만들어": [[49,[286]]],
	"만듭": [[50,[286]]],
	"만져": [[49,[1050]]],
	"만지": [1050],
	"만지다": [1050],
	"만진": [[644,[1050]]],
	"만집": [[50,[1050]]],
	"많": [126],
	"많다": [126],
	"많아": [[49,[126]]],
	"많은": [[644,[126]]],
	"많이": [408],
	"말": [938,"_만","_멀",1145],
	"말다": [938,"_멀다"],
	"말씀드려": [[49,[592]]],
	"말씀드리": [592],
	"말씀드리다": [592],
	"말씀드린": [[644,[592]]],
	"말씀드립": [[50,[592]]],
	"말씀하셔": [[49,[506]]],
	"말씀하시": [506],
	"말씀하시다": [506],
	"말씀하신": [[644,[506]]],
	"말씀하십": [[50,[506]]],
	"말아": [[49,[938]]],
	"말하": [593],
	"말하다": [593],
	"말한": [[644,[593]]],
	"말합": [[50,[593]]],
	"말해": [[49,[593]]],
	"맑": [718],
	"맑다": [718],
	"맑아": [[49,[718]]],
	"맑은": [[644,[718]]],
	"맙": [[50,[938]],"_멉"],
	"맛": [295,"_맞"],
	"맛없": [311],
	"맛없다": [311],
	"맛없어": [[49,[311]]],
	"맛없은": [[644,[311]]],
	"맛있": [43,"_멋있"],
	"맛있다": [43,"_멋있다"],
	"맛있어": [[49,[43]],"_멋있어"],
	"맛있은": [[644,[43]],"_멋있은"],
	"맞": [1075,"_맛"],
	"맞다": [1075],
	"맞아": [[49,[1075]]],
	"맞은": [[644,[1075]]],
	"매운": [[644,[287]]],
	"매워": [[49,[287]]],
	"매장": [1027],
	"맥주": [327],
	"맵": [287,"_멥"],
	"맵다": [287],
	"먹": [40],
	"먹다": [40],
	"먹어": [[49,[40]]],
	"먹은": [[644,[40]]],
	"먼": [[644,[315]],"_멀","_만"],
	"먼저": [354],
	"멀": [315,"_먼","_말"],
	"멀다": [315,"_말다"],
	"멀어": [[49,[315]]],
	"멉": [[50,[315]],"_맙"],
	"멋있": [1076,"_맛있"],
	"멋있다": [1076,"_맛있다"],
	"멋있어": [[49,[1076]],"_맛있어"],
	"멋있은": [[644,[1076]],"_맛있은"],
	"메": [1028],
	"메다": [1028],
	"멘": [[644,[1028]]],
	"멥": [[50,[1028]],"_맵"],
	"며칠": [340],
	"면": [973],
	"면세점": [559],
	"명절": [939],
	"몇": [201],
	"모두": [575],
	"모레": [430],
	"모르": [615],
	"모르다": [615],
	"모른": [[644,[615]]],
	"모릅": [[50,[615]]],
	"모양": [1077],
	"모으": [1103],
	"모으다": [1103],
	"모은": [[644,[1103]]],
	"모읍": [[50,[1103]]],
	"모이": [1104],
	"모이다": [1104],
	"모이에": [[49,[1104]]],
	"모인": [[644,[1104]]],
	"모임": [1105],
	"모입": [[50,[1104]]],
	"모자": [750],
	"목걸이": [1029],
	"목소리": [823],
	"목요일": [346],
	"목이 마르": [1051],
	"목이 마르다": [1051],
	"목이 마른": [[644,[1051]]],
	"목이 마릅": [[50,[1051]]],
	"목이 말라": [[49,[1051]]],
	"몰라": [[49,[615]]],
	"뫄": [[49,[1103]]],
	"무거운": [[644,[547]]],
	"무거워": [[49,[547]]],
	"무겁": [547],
	"무겁다": [547],
	"무릎": [824],
	"무슨": [289],
	"무엇": [60,515],
	"무역 회사": [786],
	"무척": [1146],
	"문": [69,"_물"],
	"문구점": [161],
	"문자메시지를 받": [633],
	"문자메시지를 받다": [633],
	"문자메시지를 받아": [[49,[633]]],
	"문자메시지를 받은": [[644,[633]]],
	"문자메시지를 보내": [634],
	"문자메시지를 보내다": [634],
	"문자메시지를 보낸": [[644,[634]]],
	"문자메시지를 보냅": [[50,[634]]],
	"묻": [363],
	"묻다": [363],
	"물": [39,"_문"],
	"물건": [717],
	"물어": [[49,[363]]],
	"물어보": [694],
	"물어보다": [694],
	"물어본": [[644,[694]]],
	"물어봅": [[50,[694]]],
	"물어봐": [[49,[694]]],
	"물은": [[644,[363]]],
	"뭐": [510],
	"뭘": [355],
	"미국": [8],
	"미국 사람": [0],
	"미술관": [480],
	"미용실": [898],
	"미터": [681],
	"민": [[644,[1189]],"_밀"],
	"민박집": [739],
	"민박하": [741],
	"민박하다": [741],
	"민박한": [[644,[741]]],
	"민박합": [[50,[741]]],
	"민박해": [[49,[741]]],
	"밀": [1189,"_민"],
	"밀다": [1189],
	"밀어": [[49,[1189]]],
	"밉": [[50,[1189]]],
	"ㅂ니다": [50],
	"바나나": [560],
	"바다": [175],
	"바람이 분": [[644,[723]],"_바람이 불"],
	"바람이 불": [723,"_바람이 분"],
	"바람이 불다": [723],
	"바람이 불어": [[49,[723]]],
	"바람이 붑": [[50,[723]]],
	"바로": [1147],
	"바빠": [[49,[193]]],
	"바쁘": [193],
	"바쁘다": [193],
	"바쁜": [[644,[193]]],
	"바쁩": [[50,[193]]],
	"바지": [534],
	"박물관": [481],
	"박수를 쳐": [[49,[1117]]],
	"박수를 치": [1117],
	"박수를 치다": [1117],
	"박수를 친": [[644,[1117]]],
	"박수를 칩": [[50,[1117]]],
	"밖": [106],
	"반": [202,"_방","_번","_판","_발"],
	"반가운": [[644,[412]]],
	"반가워": [[49,[412]]],
	"반갑": [412],
	"반갑다": [412],
	"반대": [1222],
	"반바지": [1052],
	"반지": [1030],
	"받": [365],
	"받다": [365],
	"받아": [[49,[365]]],
	"받은": [[644,[365]]],
	"발": [825,"_팔","_반","_벌"],
	"발로 차": [1118],
	"발로 차다": [1118],
	"발로 찬": [[644,[1118]]],
	"발로 찹": [[50,[1118]]],
	"밝": [1078],
	"밝다": [1078],
	"밝아": [[49,[1078]]],
	"밝은": [[644,[1078]]],
	"밥": [38,"_팝"],
	"방": [118,"_빵","_반"],
	"방법": [940],
	"방석": [1002],
	"방송국": [787],
	"방학": [765],
	"방학이 끝나": [769],
	"방학이 끝나다": [769],
	"방학이 끝난": [[644,[769]]],
	"방학이 끝납": [[50,[769]]],
	"방학이 시작되": [770],
	"방학이 시작되다": [770],
	"방학이 시작되어": [[49,[770]]],
	"방학이 시작된": [[644,[770]]],
	"방학이 시작됩": [[50,[770]]],
	"방학중": [766],
	"방학하": [761],
	"방학하다": [761],
	"방학한": [[644,[761]]],
	"방학합": [[50,[761]]],
	"방학해": [[49,[761]]],
	"배": [657],
	"배가 고파": [[49,[324]]],
	"배가 고프": [324],
	"배가 고프다": [324],
	"배가 고픈": [[644,[324]]],
	"배가 고픕": [[50,[324]]],
	"배낭": [1031],
	"배우": [31,135],
	"배우다": [135],
	"배운": [[644,[135]]],
	"배웁": [[50,[135]]],
	"배워": [[49,[135]]],
	"배추": [1003],
	"백": [271,535],
	"백화점": [162,561],
	"버려": [[49,[974]]],
	"버리": [974],
	"버리다": [974],
	"버린": [[644,[974]]],
	"버립": [[50,[974]]],
	"버섯": [975],
	"버스": [658],
	"번": [226,"_본","_반","_벌",677],
	"벌": [568,"_번","_발"],
	"벌써": [1148],
	"법학": [807],
	"벗": [1190],
	"벗다": [1190],
	"벗어": [[49,[1190]]],
	"벗은": [[644,[1190]]],
	"벚꽃": [724],
	"베란다": [917],
	"베트남": [9],
	"베트남말": [137],
	"벨": [1223],
	"벽": [918],
	"벽시계": [1119],
	"별로": [883],
	"병": [331],
	"병원": [446],
	"보": [149,976],
	"보내": [594],
	"보내다": [594],
	"보낸": [[644,[594]]],
	"보냅": [[50,[594]]],
	"보다": [149,680,976],
	"보라색": [1053],
	"보이": [700],
	"보이다": [700],
	"보이에": [[49,[700]]],
	"보인": [[644,[700]]],
	"보입": [[50,[700]]],
	"보통": [203],
	"복잡하": [184],
	"복잡하다": [184],
	"복잡한": [[644,[184]]],
	"복잡합": [[50,[184]]],
	"복잡해": [[49,[184]]],
	"볶": [977],
	"볶다": [977],
	"볶아": [[49,[977]]],
	"볶은": [[644,[977]]],
	"본": [[644,[149]],"_번",[644,[976]]],
	"볼펜": [85],
	"봄": [725],
	"봅": [[50,[149]],[50,[976]]],
	"봐": [[49,[149]],[49,[976]]],
	"뵙": [1164],
	"뵙다": [1164],
	"뵙어": [[49,[1164]]],
	"뵙은": [[644,[1164]]],
	"부끄러운": [[644,[884]]],
	"부끄러워": [[49,[884]]],
	"부끄럽": [884],
	"부끄럽다": [884],
	"부러운": [[644,[885]]],
	"부러워": [[49,[885]]],
	"부럽": [885],
	"부럽다": [885],
	"부르": [616,"_푸르"],
	"부르다": [616,"_푸르다"],
	"부른": [[644,[616]],"_푸른"],
	"부릅": [[50,[616]],"_푸릅"],
	"부모님": [493],
	"부사 표현": [57],
	"부엌": [919],
	"부인": [1120],
	"부장": [1200],
	"부케": [1121],
	"부탁": [1191],
	"분": [249],
	"분식집": [899],
	"분위기": [1122],
	"분홍색": [1054],
	"불고기": [285],
	"불러": [[49,[616]]],
	"불안하": [886],
	"불안하다": [886],
	"불안한": [[644,[886]]],
	"불안합": [[50,[886]]],
	"불안해": [[49,[886]]],
	"불편하": [900],
	"불편하다": [900],
	"불편한": [[644,[900]]],
	"불편합": [[50,[900]]],
	"불편해": [[49,[900]]],
	"브라질": [10],
	"비가 오": [715],
	"비가 오다": [715],
	"비가 온": [[644,[715]]],
	"비가 옵": [[50,[715]]],
	"비가 와": [[49,[715]]],
	"비누": [1004],
	"비벼": [[49,[941]]],
	"비비": [941],
	"비비다": [941],
	"비빈": [[644,[941]]],
	"비빔밥": [296],
	"비빕": [[50,[941]]],
	"비슷하": [1079],
	"비슷하다": [1079],
	"비슷한": [[644,[1079]]],
	"비슷합": [[50,[1079]]],
	"비슷해": [[49,[1079]]],
	"비싸": [392],
	"비싸다": [392],
	"비싼": [[644,[392]]],
	"비쌉": [[50,[392]]],
	"비행기": [659],
	"비행기 표": [447],
	"빌딩": [865],
	"빌려": [[49,[393]]],
	"빌려주": [1192],
	"빌려주다": [1192],
	"빌려준": [[644,[1192]]],
	"빌려줍": [[50,[1192]]],
	"빌려줘": [[49,[1192]]],
	"빌리": [393],
	"빌리다": [393],
	"빌린": [[644,[393]]],
	"빌립": [[50,[393]]],
	"빠르": [394],
	"빠르다": [394],
	"빠른": [[644,[394]]],
	"빠릅": [[50,[394]]],
	"빨간": [[644,[1080]]],
	"빨갛": [1080],
	"빨갛다": [1080],
	"빨개": [[49,[1080]]],
	"빨라": [[49,[394]]],
	"빨래하": [405],
	"빨래하다": [405],
	"빨래한": [[644,[405]]],
	"빨래합": [[50,[405]]],
	"빨래해": [[49,[405]]],
	"빨리": [456],
	"빵": [138,"_방"],
	"빵집": [163],
	"뿌려": [[49,[942]]],
	"뿌리": [942],
	"뿌리다": [942],
	"뿌린": [[644,[942]]],
	"뿌립": [[50,[942]]],
	"사": [150,239,"_싸","_서"],
	"사거리": [682],
	"사과": [297],
	"사귀": [788],
	"사귀다": [788],
	"사귀어": [[49,[788]]],
	"사귄": [[644,[788]]],
	"사귑": [[50,[788]]],
	"사다": [150,"_싸다","_서다"],
	"사람": [11],
	"사무실": [107],
	"사십": [247],
	"사이즈": [1081],
	"사진을 찍": [519],
	"사진을 찍다": [519],
	"사진을 찍어": [[49,[519]]],
	"사진을 찍은": [[644,[519]]],
	"사흘": [1165],
	"산": [[644,[150]],179,"_살",[644,[316]],"_싼","_선"],
	"산책": [351],
	"살": [316,"_산"],
	"살다": [316],
	"살아": [[49,[316]]],
	"삶": [978],
	"삶다": [978],
	"삶아": [[49,[978]]],
	"삶은": [[644,[978]]],
	"삼": [238,"_섬"],
	"삼겹살": [319],
	"삼계탕": [298],
	"삼성역": [943],
	"삼십": [223],
	"삽": [[50,[150]],[50,[316]],"_쌉","_섭"],
	"상품": [1032],
	"상품권": [584],
	"새": [808,"_세"],
	"새로": [920],
	"색깔": [1055],
	"샌드위치": [299],
	"샐러드": [1123],
	"생겨": [[49,[1166]]],
	"생기": [1166],
	"생기다": [1166],
	"생긴": [[644,[1166]]],
	"생깁": [[50,[1166]]],
	"생선": [188],
	"생수": [1005],
	"생신": [585],
	"생일": [341],
	"생일축하 노래를 부르": [609],
	"생일축하 노래를 부르다": [609],
	"생일축하 노래를 부른": [[644,[609]]],
	"생일축하 노래를 부릅": [[50,[609]]],
	"생일축하 노래를 불러": [[49,[609]]],
	"생활": [189],
	"생활용품": [1006],
	"샤부샤부": [1124],
	"샤워하": [352],
	"샤워하다": [352],
	"샤워한": [[644,[352]]],
	"샤워합": [[50,[352]]],
	"샤워해": [[49,[352]]],
	"서": [1224,"_써","_사"],
	"서다": [1224,"_사다"],
	"서류": [1201],
	"서른": [260,1167],
	"서양": [300],
	"서울": [183],
	"서재": [921],
	"서점": [108],
	"서핑": [378],
	"서해": [866],
	"섞": [944],
	"섞다": [944],
	"섞어": [[49,[944]]],
	"섞은": [[644,[944]]],
	"선": [[644,[1224]],"_썬","_손","_산"],
	"선글라스": [753],
	"선물": [576],
	"선물을 고르": [610],
	"선물을 고르다": [610],
	"선물을 고른": [[644,[610]]],
	"선물을 고릅": [[50,[610]]],
	"선물을 골라": [[49,[610]]],
	"선물하": [579],
	"선물하다": [579],
	"선물한": [[644,[579]]],
	"선물합": [[50,[579]]],
	"선물해": [[49,[579]]],
	"선배": [1125],
	"선생님": [32],
	"선선하": [719],
	"선선하다": [719],
	"선선한": [[644,[719]]],
	"선선합": [[50,[719]]],
	"선선해": [[49,[719]]],
	"설날": [774],
	"설렁탕": [979],
	"설명하": [1193],
	"설명하다": [1193],
	"설명한": [[644,[1193]]],
	"설명합": [[50,[1193]]],
	"설명해": [[49,[1193]]],
	"설탕": [945],
	"섬": [867,"_삼"],
	"섭": [[50,[1224]],"_썹","_삽"],
	"섭섭하": [1168],
	"섭섭하다": [1168],
	"섭섭한": [[644,[1168]]],
	"섭섭합": [[50,[1168]]],
	"섭섭해": [[49,[1168]]],
	"성격": [826],
	"성함": [641,1149],
	"세": [214,"_새",1169,1171],
	"세다": [1171],
	"세배하": [775],
	"세배하다": [775],
	"세배한": [[644,[775]]],
	"세배합": [[50,[775]]],
	"세배해": [[49,[775]]],
	"세상": [1150],
	"세수하": [357],
	"세수하다": [357],
	"세수한": [[644,[357]]],
	"세수합": [[50,[357]]],
	"세수해": [[49,[357]]],
	"세일하": [1033],
	"세일하다": [1033],
	"세일한": [[644,[1033]]],
	"세일합": [[50,[1033]]],
	"세일해": [[49,[1033]]],
	"세제": [1126],
	"세탁기": [922],
	"센": [[644,[1171]]],
	"셉": [[50,[1171]]],
	"셋": [254],
	"소고기": [946],
	"소금": [947],
	"소리": [1007],
	"소스": [980],
	"소파": [923],
	"소풍을 가": [727],
	"소풍을 가다": [727],
	"소풍을 간": [[644,[727]]],
	"소풍을 갑": [[50,[727]]],
	"손": [827,"_선"],
	"손잡이": [1225],
	"송별회": [1106],
	"송이": [551],
	"쇼핑하": [406],
	"쇼핑하다": [406],
	"쇼핑한": [[644,[406]]],
	"쇼핑합": [[50,[406]]],
	"쇼핑해": [[49,[406]]],
	"수건": [924],
	"수업": [227],
	"수영": [176,379],
	"수영복": [1034],
	"수영장": [380],
	"수요일": [345],
	"숙제": [228],
	"숲": [868],
	"쉬": [420],
	"쉬다": [420],
	"쉬어": [[49,[420]]],
	"쉬운": [[644,[413]]],
	"쉬워": [[49,[413]]],
	"쉰": [262,[644,[420]],1172],
	"쉽": [413,[50,[420]]],
	"쉽다": [413],
	"슈퍼마켓": [562],
	"스노보드": [381],
	"스무": [259],
	"스물": [258,552],
	"스케이트": [382],
	"스케이트장": [383],
	"스크린도어": [1226],
	"스키": [384],
	"스키장": [385],
	"스트레스": [948],
	"스포츠용품": [1035],
	"슬리퍼": [536],
	"습니다": [50],
	"승강장": [1227],
	"시": [204,"_씨"],
	"시간": [665],
	"시간 표현": [277],
	"시간이 없": [444],
	"시간이 없다": [444],
	"시간이 없어": [[49,[444]]],
	"시간이 없은": [[644,[444]]],
	"시계": [70],
	"시골": [869],
	"시끄러운": [[644,[127]]],
	"시끄러워": [[49,[127]]],
	"시끄럽": [127],
	"시끄럽다": [127],
	"시디": [586],
	"시작": [767],
	"시작되": [762],
	"시작되다": [762],
	"시작되어": [[49,[762]]],
	"시작된": [[644,[762]]],
	"시작됩": [[50,[762]]],
	"시작하": [1107],
	"시작하다": [1107],
	"시작한": [[644,[1107]]],
	"시작합": [[50,[1107]]],
	"시작해": [[49,[1107]]],
	"시장": [563],
	"시청": [843],
	"시켜": [[49,[321]]],
	"시키": [321],
	"시키다": [321],
	"시킨": [[644,[321]]],
	"시킵": [[50,[321]]],
	"식당": [109,448],
	"식료품": [1008],
	"식사하": [169],
	"식사하다": [169],
	"식사한": [[644,[169]]],
	"식사합": [[50,[169]]],
	"식사해": [[49,[169]]],
	"식초": [949],
	"식탁": [925],
	"신": [756],
	"신다": [756],
	"신문": [86],
	"신문방송학": [809],
	"신문사": [789],
	"신발": [537],
	"신선하": [870],
	"신선하다": [870],
	"신선한": [[644,[870]]],
	"신선합": [[50,[870]]],
	"신선해": [[49,[870]]],
	"신어": [[49,[756]],"_실어"],
	"신은": [[644,[756]],"_실은"],
	"싣": [364],
	"싣다": [364],
	"실례지만": [685],
	"실어": [[49,[364]],"_신어"],
	"실은": [[644,[364]],"_신은"],
	"심심하": [476],
	"심심하다": [476],
	"심심한": [[644,[476]]],
	"심심합": [[50,[476]]],
	"심심해": [[49,[476]]],
	"십": [245,"_씹"],
	"십만": [538],
	"싸": [548,"_사","_써",901],
	"싸다": [548,"_사다",901],
	"싼": [[644,[548]],"_산",[644,[901]],"_썬"],
	"쌀쌀하": [720],
	"쌀쌀하다": [720],
	"쌀쌀한": [[644,[720]]],
	"쌀쌀합": [[50,[720]]],
	"쌀쌀해": [[49,[720]]],
	"쌉": [[50,[548]],"_삽",[50,[901]],"_썹"],
	"써": [[49,[151]],"_싸",[49,[757]],[49,[1036]],[49,[1127]],"_서"],
	"썬": [[644,[981]],"_썰","_싼","_선"],
	"썰": [981,"_썬"],
	"썰다": [981],
	"썰어": [[49,[981]]],
	"썹": [[50,[981]],"_쌉","_섭"],
	"쓰": [151,757,1036,1127],
	"쓰다": [151,757,1036,1127],
	"쓰레기": [982],
	"쓰레기통": [983],
	"쓴": [[644,[151]],[644,[757]],[644,[1036]],[644,[1127]]],
	"씁": [[50,[151]],[50,[757]],[50,[1036]],[50,[1127]]],
	"씨": [23,"_시"],
	"씹": [1128,"_십"],
	"씹다": [1128],
	"씹어": [[49,[1128]]],
	"씹은": [[644,[1128]]],
	"아": [52,459,572,574,1113,"_어",1139,1140,1202],
	"아니요": [26],
	"아래": [110],
	"아르바이트하": [170],
	"아르바이트하다": [170],
	"아르바이트한": [[644,[170]]],
	"아르바이트합": [[50,[170]]],
	"아르바이트해": [[49,[170]]],
	"아름다운": [[644,[185]]],
	"아름다워": [[49,[185]]],
	"아름답": [185],
	"아름답다": [185],
	"아버지": [488],
	"아요": [49,"_어요"],
	"아이": [402],
	"아주": [122,409],
	"아직": [742],
	"아침": [208],
	"아파": [[49,[453]]],
	"아프": [453],
	"아프다": [453],
	"아픈": [[644,[453]]],
	"아픕": [[50,[453]]],
	"아홉": [205],
	"아흔": [266,1173],
	"안": [98,"_알",[644,[230]],251],
	"안녕하": [5],
	"안녕하다": [5],
	"안녕한": [[644,[5]]],
	"안녕합": [[50,[5]]],
	"안녕해": [[49,[5]]],
	"안전선": [1228],
	"앉": [328],
	"앉다": [328],
	"앉아": [[49,[328]]],
	"앉은": [[644,[328]]],
	"알": [230,"_안"],
	"알다": [230],
	"알아": [[49,[230]]],
	"알아보": [902],
	"알아보다": [902],
	"알아본": [[644,[902]]],
	"알아봅": [[50,[902]]],
	"알아봐": [[49,[902]]],
	"압": [[50,[230]],"_앞"],
	"았": [335],
	"앞": [99,"_압"],
	"액세서리": [587],
	"액션영화": [301],
	"앨범": [1129],
	"약": [701],
	"약국": [683],
	"약도": [903],
	"약속": [462],
	"약속 시간": [467],
	"약속 장소": [468],
	"약속을 지켜": [[49,[469]]],
	"약속을 지키": [469],
	"약속을 지키다": [469],
	"약속을 지킨": [[644,[469]]],
	"약속을 지킵": [[50,[469]]],
	"약속을 하": [470],
	"약속을 하다": [470],
	"약속을 한": [[644,[470]]],
	"약속을 합": [[50,[470]]],
	"약속을 해": [[49,[470]]],
	"약속이 없": [471],
	"약속이 없다": [471],
	"약속이 없어": [[49,[471]]],
	"약속이 없은": [[644,[471]]],
	"약속이 있": [472],
	"약속이 있다": [472],
	"약속이 있어": [[49,[472]]],
	"약속이 있은": [[644,[472]]],
	"얇": [549],
	"얇다": [549],
	"얇아": [[49,[549]]],
	"얇은": [[644,[549]]],
	"양념": [950],
	"양념하": [951],
	"양념하다": [951],
	"양념한": [[644,[951]]],
	"양념합": [[50,[951]]],
	"양념해": [[49,[951]]],
	"양말": [564],
	"양복": [1056],
	"양파": [984],
	"어": [1113,"_오","_아",1203],
	"어 가지고": [1139,1140],
	"어깨": [828],
	"어느": [19],
	"어도 되다": [572],
	"어두운": [[644,[1082]]],
	"어두워": [[49,[1082]]],
	"어둡": [1082],
	"어둡다": [1082],
	"어디": [100],
	"어때": [[49,[120]],[49,[1083]]],
	"어떤": [[644,[120]],[644,[1083]]],
	"어떻": [120,1083],
	"어떻게": [668],
	"어떻다": [120,1083],
	"어려": [[49,[844]]],
	"어려운": [[644,[414]]],
	"어려워": [[49,[414]]],
	"어렵": [414],
	"어렵다": [414],
	"어리": [844],
	"어리다": [844],
	"어린": [[644,[844]]],
	"어린이날": [776],
	"어립": [[50,[844]]],
	"어머니": [494],
	"어서": [52,459],
	"어서 오세요": [556],
	"어야 하다": [574],
	"어요": [49,"_아요"],
	"어울려": [[49,[1130]]],
	"어울리": [1130],
	"어울리다": [1130],
	"어울린": [[644,[1130]]],
	"어울립": [[50,[1130]]],
	"어제": [419],
	"언니": [495],
	"언제": [177],
	"얼굴": [829],
	"얼마": [525],
	"얼마나": [652],
	"없": [81],
	"없다": [81,679],
	"없어": [[49,[81]]],
	"없은": [[644,[81]]],
	"었어요": [335],
	"에": [132,200,275],
	"에게": [618],
	"에다가": [995,996],
	"에서": [199],
	"여권": [754],
	"여기": [61],
	"여기요": [323],
	"여기저기": [608],
	"여덟": [219],
	"여동생": [496],
	"여든": [265,1174],
	"여러분": [1151],
	"여름": [735],
	"여보세요": [629],
	"여섯": [217],
	"여성복": [1037],
	"여의도역": [1229],
	"여자": [190],
	"여쭈운": [[644,[643]]],
	"여쭈워": [[49,[643]]],
	"여쭙": [643],
	"여쭙다": [643],
	"여행": [744],
	"여행사": [745],
	"여행을 가": [749],
	"여행을 가다": [749],
	"여행을 간": [[644,[749]]],
	"여행을 갑": [[50,[749]]],
	"여행하": [407],
	"여행하다": [407],
	"여행한": [[644,[407]]],
	"여행합": [[50,[407]]],
	"여행해": [[49,[407]]],
	"역": [671],
	"역사": [489],
	"연": [[644,[317]],"_열"],
	"연락드려": [[49,[595]]],
	"연락드리": [595],
	"연락드리다": [595],
	"연락드린": [[644,[595]]],
	"연락드립": [[50,[595]]],
	"연락하": [596],
	"연락하다": [596],
	"연락한": [[644,[596]]],
	"연락합": [[50,[596]]],
	"연락해": [[49,[596]]],
	"연세": [640,1152],
	"연초": [830],
	"연필": [87],
	"열": [220,317,"_연"],
	"열다": [317],
	"열두": [222],
	"열둘": [257],
	"열려": [[49,[1230]]],
	"열리": [1230],
	"열리다": [1230],
	"열린": [[644,[1230]]],
	"열립": [[50,[1230]]],
	"열심히": [810],
	"열어": [[49,[317]]],
	"열하나": [256],
	"열한": [221],
	"열흘": [1175],
	"엽": [[50,[317]],"_옆"],
	"영문학": [811],
	"영어": [139],
	"영화": [209],
	"영화관": [482],
	"영화표": [449],
	"옆": [111,"_엽"],
	"예매하": [442],
	"예매하다": [442],
	"예매한": [[644,[442]]],
	"예매합": [[50,[442]]],
	"예매해": [[49,[442]]],
	"예뻐": [[49,[194]]],
	"예쁘": [194],
	"예쁘다": [194],
	"예쁜": [[644,[194]]],
	"예쁩": [[50,[194]]],
	"예순": [263,1176],
	"예약하": [454],
	"예약하다": [454],
	"예약한": [[644,[454]]],
	"예약합": [[50,[454]]],
	"예약해": [[49,[454]]],
	"예요": [37],
	"오": [136,240,"_어"],
	"오늘": [45,337],
	"오다": [136,485],
	"오래": [458],
	"오래되": [887],
	"오래되다": [887],
	"오래되어": [[49,[887]]],
	"오래된": [[644,[887]]],
	"오래됩": [[50,[887]]],
	"오랜만이": [790],
	"오랜만이다": [790],
	"오랜만이에": [[49,[790]]],
	"오랜만인": [[644,[790]]],
	"오랜만입": [[50,[790]]],
	"오른쪽": [684],
	"오빠": [497],
	"오십": [248],
	"오전": [210],
	"오토바이": [660],
	"오후": [211],
	"온": [[644,[136]]],
	"온천": [871],
	"올라가": [709],
	"올라가다": [709],
	"올라간": [[644,[709]]],
	"올라갑": [[50,[709]]],
	"올해": [431],
	"옵": [[50,[136]]],
	"옷": [450],
	"옷걸이": [71],
	"옷장": [926],
	"와": [[49,[136]],512],
	"와이셔츠": [539],
	"왜": [439],
	"외로운": [[644,[888]]],
	"외로워": [[49,[888]]],
	"외롭": [888],
	"외롭다": [888],
	"외삼촌": [845],
	"외숙모": [846],
	"외할머니": [498,847],
	"외할아버지": [499,848],
	"왼쪽": [688],
	"요가": [386],
	"요금": [1231],
	"요리": [511],
	"요리를 하": [520],
	"요리를 하다": [520],
	"요리를 한": [[644,[520]]],
	"요리를 합": [[50,[520]]],
	"요리를 해": [[49,[520]]],
	"요리법": [985],
	"요리사": [33],
	"요일": [338],
	"요즘": [465],
	"욕실": [927],
	"우동": [302],
	"우리": [62],
	"우산": [540],
	"우산을 써": [[49,[716]]],
	"우산을 쓰": [716],
	"우산을 쓰다": [716],
	"우산을 쓴": [[644,[716]]],
	"우산을 씁": [[50,[716]]],
	"우체국": [112],
	"운동복": [1057],
	"운동장": [368],
	"운동하": [171],
	"운동하다": [171],
	"운동한": [[644,[171]]],
	"운동합": [[50,[171]]],
	"운동해": [[49,[171]]],
	"운동화": [541],
	"운전하": [233],
	"운전하다": [233],
	"운전한": [[644,[233]]],
	"운전합": [[50,[233]]],
	"운전해": [[49,[233]]],
	"원": [526,"_월"],
	"원피스": [1058],
	"월": [349,"_원"],
	"월급": [1084],
	"월요일": [343],
	"위": [113],
	"유명하": [889],
	"유명하다": [889],
	"유명한": [[644,[889]]],
	"유명합": [[50,[889]]],
	"유명해": [[49,[889]]],
	"유자차": [303],
	"유행이": [1059],
	"유행이다": [1059],
	"유행이에": [[49,[1059]]],
	"유행인": [[644,[1059]]],
	"유행입": [[50,[1059]]],
	"육": [241],
	"육교": [702],
	"육십": [267],
	"은": [36,"_을"],
	"은행": [101],
	"은행원": [34],
	"을": [173,"_은"],
	"을지로입구역": [1232],
	"음": [1204],
	"음력": [777],
	"음료": [1009],
	"음식": [304],
	"음악": [140],
	"의": [856,857],
	"의사": [35],
	"의자": [72],
	"의학": [812],
	"이": [55,95,96,237,361],
	"이거": [516],
	"이것": [63],
	"이다": [55],
	"이따가": [580],
	"이래": [[49,[1085]]],
	"이런": [[644,[1085]]],
	"이렇": [1085],
	"이렇다": [1085],
	"이름": [1],
	"이마": [831],
	"이메일": [588],
	"이모": [849],
	"이모부": [850],
	"이미": [1205],
	"이번": [432],
	"이분": [490,"_이불"],
	"이불": [1010,"_이분"],
	"이사하": [904],
	"이사하다": [904],
	"이사한": [[644,[904]]],
	"이사합": [[50,[904]]],
	"이사해": [[49,[904]]],
	"이삿짐": [905],
	"이삿짐센터": [906],
	"이십": [246],
	"이야기": [627],
	"이에": [[49,[55]]],
	"이에요": [37],
	"이쪽": [689],
	"이태원역": [1233],
	"이틀": [1177],
	"익숙하": [791],
	"익숙하다": [791],
	"익숙한": [[644,[791]]],
	"익숙합": [[50,[791]]],
	"익숙해": [[49,[791]]],
	"인": [[644,[55]],"_일"],
	"인분": [320],
	"인사동": [952],
	"인사드려": [[49,[597]]],
	"인사드리": [597],
	"인사드리다": [597],
	"인사드린": [[644,[597]]],
	"인사드립": [[50,[597]]],
	"인사하": [598],
	"인사하다": [598],
	"인사한": [[644,[598]]],
	"인사합": [[50,[598]]],
	"인사해": [[49,[598]]],
	"인형": [589],
	"일": [236,"_인",350],
	"일곱": [218],
	"일기예보": [712],
	"일본": [12],
	"일본말": [141],
	"일어나": [358],
	"일어나다": [358],
	"일어난": [[644,[358]]],
	"일어납": [[50,[358]]],
	"일요일": [348],
	"일찍": [443],
	"일하": [172],
	"일하다": [172],
	"일한": [[644,[172]]],
	"일합": [[50,[172]]],
	"일해": [[49,[172]]],
	"일흔": [264,1178],
	"읽": [152],
	"읽다": [152],
	"읽어": [[49,[152]]],
	"읽은": [[644,[152]]],
	"잃어버려": [[49,[986]]],
	"잃어버리": [986],
	"잃어버리다": [986],
	"잃어버린": [[644,[986]]],
	"잃어버립": [[50,[986]]],
	"입": [[50,[55]],153,832],
	"입니다": [56],
	"입다": [153],
	"입어": [[49,[153]]],
	"입은": [[644,[153]]],
	"있": [82],
	"있다": [82],
	"있어": [[49,[82]]],
	"있은": [[644,[82]]],
	"자": [359,"_차","_저",1206],
	"자다": [359,"_차다"],
	"자루": [569,"_자르"],
	"자르": [617,"_자루"],
	"자르다": [617],
	"자른": [[644,[617]]],
	"자릅": [[50,[617]]],
	"자장면": [305],
	"자전거": [661],
	"자전거를 타": [466],
	"자전거를 타다": [466],
	"자전거를 탄": [[644,[466]]],
	"자전거를 탑": [[50,[466]]],
	"자주": [47,372],
	"작": [128,"_적"],
	"작년": [433],
	"작다": [128,"_적다"],
	"작아": [[49,[128]]],
	"작은": [[644,[128]],"_적은"],
	"잔": [332,[644,[359]],"_장","_찬"],
	"잘라": [[49,[617]]],
	"잘생겨": [[49,[833]]],
	"잘생기": [833],
	"잘생기다": [833],
	"잘생긴": [[644,[833]]],
	"잘생깁": [[50,[833]]],
	"잘하": [395],
	"잘하다": [395],
	"잘한": [[644,[395]]],
	"잘합": [[50,[395]]],
	"잘해": [[49,[395]]],
	"잠깐만요": [623],
	"잡": [[50,[359]],"_찹",1194,"_접"],
	"잡다": [1194,"_접다"],
	"잡수셔": [[49,[507]]],
	"잡수시": [507],
	"잡수시다": [507],
	"잡수신": [[644,[507]]],
	"잡수십": [[50,[507]]],
	"잡아": [[49,[1194]]],
	"잡은": [[644,[1194]],"_접은"],
	"잡지": [88],
	"잡지사": [792],
	"잡채": [1131],
	"장": [570,"_잔"],
	"장갑": [1038],
	"장미": [553],
	"재료": [987],
	"재미없": [195],
	"재미없다": [195],
	"재미없어": [[49,[195]]],
	"재미없은": [[644,[195]]],
	"재미있": [196],
	"재미있다": [196],
	"재미있어": [[49,[196]]],
	"재미있은": [[644,[196]]],
	"저": [2,"_자",686,1207],
	"저것": [73],
	"저기": [114,1208],
	"저녁": [212],
	"저는": [[36,[2]],[36,[1207]]],
	"저래": [[49,[1086]]],
	"저런": [[644,[1086]]],
	"저렇": [1086],
	"저렇다": [1086],
	"저분": [133],
	"저쪽": [690],
	"저희": [1153],
	"적": [129,"_작"],
	"적다": [129,"_작다"],
	"적어": [[49,[129]]],
	"적은": [[644,[129]],"_작은"],
	"전공하": [813],
	"전공하다": [813],
	"전공한": [[644,[813]]],
	"전공합": [[50,[813]]],
	"전공해": [[49,[813]]],
	"전주": [740],
	"전하": [1209],
	"전하다": [1209],
	"전한": [[644,[1209]]],
	"전합": [[50,[1209]]],
	"전해": [[49,[1209]]],
	"전화가 오": [635],
	"전화가 오다": [635],
	"전화가 온": [[644,[635]]],
	"전화가 옵": [[50,[635]]],
	"전화가 와": [[49,[635]]],
	"전화드려": [[49,[599]]],
	"전화드리": [599],
	"전화드리다": [599],
	"전화드린": [[644,[599]]],
	"전화드립": [[50,[599]]],
	"전화를 건": [[644,[636]],"_전화를 걸"],
	"전화를 걸": [636,"_전화를 건"],
	"전화를 걸다": [636],
	"전화를 걸어": [[49,[636]]],
	"전화를 겁": [[50,[636]]],
	"전화를 끊": [637],
	"전화를 끊다": [637],
	"전화를 끊어": [[49,[637]]],
	"전화를 끊은": [[644,[637]]],
	"전화를 바꾸": [638],
	"전화를 바꾸다": [638],
	"전화를 바꾼": [[644,[638]]],
	"전화를 바꿉": [[50,[638]]],
	"전화를 바꿔": [[49,[638]]],
	"전화를 받": [630],
	"전화를 받다": [630],
	"전화를 받아": [[49,[630]]],
	"전화를 받은": [[644,[630]]],
	"전화번호": [622],
	"전화하": [234,600],
	"전화하다": [234,600],
	"전화한": [[644,[234]],[644,[600]]],
	"전화합": [[50,[234]],[50,[600]]],
	"전화해": [[49,[234]],[49,[600]]],
	"점심": [206],
	"점점": [793],
	"점퍼": [1060],
	"접": [1195,"_좁","_잡"],
	"접다": [1195,"_좁다","_잡다"],
	"접시": [953],
	"접어": [[49,[1195]]],
	"접은": [[644,[1195]],"_좁은","_잡은"],
	"젓가락": [663],
	"정류장": [672],
	"정리하": [907],
	"정리하다": [907],
	"정리한": [[644,[907]]],
	"정리합": [[50,[907]]],
	"정리해": [[49,[907]]],
	"정말": [607],
	"제": [3],
	"제가": [[96,[2]],[96,[1207]]],
	"제일": [555],
	"조금": [410],
	"조끼": [1061],
	"조용하": [130],
	"조용하다": [130],
	"조용한": [[644,[130]]],
	"조용합": [[50,[130]]],
	"조용해": [[49,[130]]],
	"조카": [851],
	"존": [[644,[1132]],"_졸"],
	"졸": [1132,"_존"],
	"졸다": [1132],
	"졸아": [[49,[1132]]],
	"졸업하": [814],
	"졸업하다": [814],
	"졸업한": [[644,[814]]],
	"졸업합": [[50,[814]]],
	"졸업해": [[49,[814]]],
	"좀": [373],
	"좁": [415,[50,[1132]],"_접"],
	"좁다": [415,"_접다"],
	"좁아": [[49,[415]]],
	"좁은": [[644,[415]],"_접은"],
	"종로": [1234],
	"종업원": [664],
	"좋": [121],
	"좋다": [121],
	"좋아": [[49,[121]]],
	"좋아하": [288],
	"좋아하다": [288],
	"좋아한": [[644,[288]]],
	"좋아합": [[50,[288]]],
	"좋아해": [[49,[288]]],
	"좋은": [[644,[121]]],
	"죄송하": [22],
	"죄송하다": [22],
	"죄송한": [[644,[22]]],
	"죄송합": [[50,[22]]],
	"죄송해": [[49,[22]]],
	"주": [322,435],
	"주다": [322],
	"주말": [369],
	"주머니": [1087],
	"주무셔": [[49,[508]]],
	"주무시": [508],
	"주무시다": [508],
	"주무신": [[644,[508]]],
	"주무십": [[50,[508]]],
	"주방용품": [1133],
	"주변": [928],
	"주스": [565],
	"주유소": [908],
	"준": [[644,[322]],"_줄",[644,[1196]]],
	"준비하": [605],
	"준비하다": [605],
	"준비한": [[644,[605]]],
	"준비합": [[50,[605]]],
	"준비해": [[49,[605]]],
	"줄": [333,"_준",1196,1235],
	"줄다": [1196],
	"줄어": [[49,[1196]]],
	"줍": [[50,[322]],"_춥",[50,[1196]]],
	"중국": [13],
	"중국말": [142],
	"줘": [[49,[322]]],
	"즐거운": [[644,[794]]],
	"즐거워": [[49,[794]]],
	"즐겁": [794],
	"즐겁다": [794],
	"지 못하다": [524],
	"지갑": [89],
	"지금": [154],
	"지나": [1154],
	"지나다": [1154],
	"지난": [438,[644,[1154]]],
	"지난달": [436],
	"지난주": [437],
	"지난해": [434],
	"지납": [[50,[1154]]],
	"지내": [795],
	"지내다": [795],
	"지낸": [[644,[795]]],
	"지냅": [[50,[795]]],
	"지도": [68],
	"지역 번호": [625],
	"지우개": [90],
	"지하": [691],
	"지하도": [703],
	"지하철": [387],
	"직장": [796],
	"진지": [639,1155],
	"짐": [909],
	"집": [180,"_칩","_찝"],
	"집들이": [1134],
	"짧": [529],
	"짧다": [529],
	"짧아": [[49,[529]]],
	"짧은": [[644,[529]]],
	"짬뽕": [306],
	"쪄": [[49,[988]],"_쳐"],
	"쪽": [229,1236],
	"쯤": [653],
	"찌": [988,"_치"],
	"찌다": [988,"_치다"],
	"찍": [954],
	"찍다": [954],
	"찍어": [[49,[954]]],
	"찍은": [[644,[954]]],
	"찐": [[644,[988]],"_친"],
	"찜질방": [164,910],
	"찝": [[50,[988]],"_집","_칩"],
	"차": [307,"_자",662,1039],
	"차다": [1039,"_자다"],
	"착하": [834],
	"착하다": [834],
	"착한": [[644,[834]]],
	"착합": [[50,[834]]],
	"착해": [[49,[834]]],
	"찬": [[644,[1039]],"_잔","_천"],
	"참기름": [989],
	"참외": [1011],
	"찹": [[50,[1039]],"_잡"],
	"찻잔": [1135],
	"창문": [74],
	"찾": [554],
	"찾다": [554],
	"찾아": [[49,[554]]],
	"찾은": [[644,[554]]],
	"채소": [990],
	"책": [80],
	"책상": [75],
	"책장": [991],
	"천": [272,542,"_찬"],
	"천천히": [457],
	"첫": [1088],
	"청바지": [1062],
	"청소하": [399],
	"청소하다": [399],
	"청소한": [[644,[399]]],
	"청소합": [[50,[399]]],
	"청소해": [[49,[399]]],
	"체육관": [115],
	"쳐": [[49,[396]],"_쪄"],
	"초대장": [1108],
	"초대하": [1109],
	"초대하다": [1109],
	"초대한": [[644,[1109]]],
	"초대합": [[50,[1109]]],
	"초대해": [[49,[1109]]],
	"초밥": [308],
	"초콜릿": [603],
	"추운": [[644,[131]]],
	"추워": [[49,[131]]],
	"축구": [370],
	"축하하": [606],
	"축하하다": [606],
	"축하한": [[644,[606]]],
	"축하합": [[50,[606]]],
	"축하해": [[49,[606]]],
	"출구": [704],
	"출근하": [797],
	"출근하다": [797],
	"출근한": [[644,[797]]],
	"출근합": [[50,[797]]],
	"출근해": [[49,[797]]],
	"출발하": [676],
	"출발하다": [676],
	"출발한": [[644,[676]]],
	"출발합": [[50,[676]]],
	"출발해": [[49,[676]]],
	"출판사": [798],
	"춤을 추": [521],
	"춤을 추다": [521],
	"춤을 춘": [[644,[521]]],
	"춤을 춥": [[50,[521]]],
	"춤을 춰": [[49,[521]]],
	"춥": [131,"_줍"],
	"춥다": [131],
	"충전기": [755],
	"층": [692],
	"치": [396,"_찌"],
	"치다": [396,"_찌다"],
	"치마": [527],
	"치약": [1012],
	"친": [[644,[396]],"_칠","_찐"],
	"친구": [76],
	"친절하": [197],
	"친절하다": [197],
	"친절한": [[644,[197]]],
	"친절합": [[50,[197]]],
	"친절해": [[49,[197]]],
	"친척": [852],
	"칠": [242,"_친"],
	"칠십": [268],
	"칠판": [77],
	"칩": [[50,[396]],"_집","_찝"],
	"칫솔": [1013],
	"카드를 써": [[49,[611]]],
	"카드를 쓰": [611],
	"카드를 쓰다": [611],
	"카드를 쓴": [[644,[611]]],
	"카드를 씁": [[50,[611]]],
	"카페": [483],
	"커": [[49,[42]],"_꺼","_코"],
	"커피": [143],
	"컴퓨터": [64],
	"컴퓨터공학": [815],
	"케냐": [14],
	"케이크": [577],
	"케이크를 자르": [612],
	"케이크를 자르다": [612],
	"케이크를 자른": [[644,[612]]],
	"케이크를 자릅": [[50,[612]]],
	"케이크를 잘라": [[49,[612]]],
	"켤레": [571],
	"코": [835,"_커"],
	"코미디 영화": [309],
	"코트": [543],
	"콘도": [746],
	"콘서트": [440],
	"크": [42,"_끄"],
	"크다": [42,"_끄다"],
	"크리스마스": [342],
	"크리스마스트리": [778],
	"크림빵": [566],
	"큰": [[644,[42]],"_끈"],
	"큰아버지": [853],
	"큰어머니": [854],
	"큽": [[50,[42]],"_끕"],
	"타": [397,"_다"],
	"타다": [397],
	"탁구": [388],
	"탁구장": [389],
	"탄": [[644,[397]],"_단"],
	"탑": [[50,[397]],"_답"],
	"태권도": [165],
	"택시": [649],
	"테니스": [390],
	"테니스장": [391],
	"텔레비전": [78],
	"토마토": [1014],
	"토요일": [339],
	"통화중이": [632],
	"통화중이다": [632],
	"통화중이에": [[49,[632]]],
	"통화중인": [[644,[632]]],
	"통화중입": [[50,[632]]],
	"퇴근하": [1210],
	"퇴근하다": [1210],
	"퇴근한": [[644,[1210]]],
	"퇴근합": [[50,[1210]]],
	"퇴근해": [[49,[1210]]],
	"튀겨": [[49,[992]]],
	"튀기": [992],
	"튀기다": [992],
	"튀긴": [[644,[992]]],
	"튀깁": [[50,[992]]],
	"특별히": [1063],
	"티셔츠": [544],
	"파": [993],
	"파란": [[644,[1089]]],
	"파랗": [1089],
	"파랗다": [1089],
	"파래": [[49,[1089]]],
	"파티": [628],
	"판": [334,"_반","_팔",[644,[1015]]],
	"팔": [243,"_판","_발",1015],
	"팔다": [1015],
	"팔십": [269],
	"팔아": [[49,[1015]]],
	"팝": [[50,[1015]],"_밥"],
	"팝콘": [730],
	"패션잡화": [1040],
	"펜션": [747],
	"펴": [[49,[726]],1197],
	"펴다": [1197],
	"편": [[644,[1197]]],
	"편리하": [872],
	"편리하다": [872],
	"편리한": [[644,[872]]],
	"편리합": [[50,[872]]],
	"편리해": [[49,[872]]],
	"편의점": [116],
	"폅": [[50,[1197]]],
	"포도": [1016],
	"포스터": [1017],
	"표": [441],
	"푸르": [873,"_부르"],
	"푸르다": [873,"_부르다"],
	"푸르러": [[49,[873]]],
	"푸른": [[644,[873]],"_부른"],
	"푸릅": [[50,[873]],"_부릅"],
	"풍선을 분": [[644,[613]],"_풍선을 불"],
	"풍선을 불": [613,"_풍선을 분"],
	"풍선을 불다": [613],
	"풍선을 불어": [[49,[613]]],
	"풍선을 붑": [[50,[613]]],
	"프라이팬": [994],
	"프랑스": [15],
	"프랑스말": [144],
	"피": [726],
	"피곤하": [235],
	"피곤하다": [235],
	"피곤한": [[644,[235]]],
	"피곤합": [[50,[235]]],
	"피곤해": [[49,[235]]],
	"피다": [726],
	"피시방": [157],
	"피자": [310],
	"핀": [[644,[726]]],
	"필요하": [1110],
	"필요하다": [1110],
	"필요한": [[644,[1110]]],
	"필요합": [[50,[1110]]],
	"필요해": [[49,[1110]]],
	"필통": [91],
	"핍": [[50,[726]]],
	"ㅎ동사": [1093],
	"하": [158],
	"하고": [367],
	"하나": [252],
	"하늘색": [1064],
	"하다": [158],
	"하루": [1179],
	"하애": [[49,[1090]]],
	"하얀": [[644,[1090]]],
	"하얗": [1090],
	"하얗다": [1090],
	"학기": [759],
	"학기 중": [768],
	"학기가 끝나": [771],
	"학기가 끝나다": [771],
	"학기가 끝난": [[644,[771]]],
	"학기가 끝납": [[50,[771]]],
	"학기가 시작되": [772],
	"학기가 시작되다": [772],
	"학기가 시작되어": [[49,[772]]],
	"학기가 시작된": [[644,[772]]],
	"학기가 시작됩": [[50,[772]]],
	"학생": [24],
	"학생식당": [119],
	"학생증": [92],
	"학생회관": [102],
	"한": [[644,[158]],207],
	"한가하": [198],
	"한가하다": [198],
	"한가한": [[644,[198]]],
	"한가합": [[50,[198]]],
	"한가해": [[49,[198]]],
	"한강공원": [463],
	"한국": [16],
	"한국 사람": [17],
	"한국말": [134],
	"한글날": [779],
	"한라산": [874],
	"한번": [763],
	"한복": [693],
	"한식": [403],
	"한자어 수량 표현": [279,281],
	"한자어 숫자 세기": [283],
	"한테": [618],
	"할머니": [500],
	"할아버지": [501],
	"할인": [1041],
	"합": [[50,[158]]],
	"항공사": [799],
	"항상": [1042],
	"해": [[49,[158]]],
	"해변": [875],
	"해산물": [876],
	"해수욕장에 가": [734],
	"해수욕장에 가다": [734],
	"해수욕장에 간": [[644,[734]]],
	"해수욕장에 갑": [[50,[734]]],
	"해요": [49],
	"핸드백": [1043],
	"햄": [1018],
	"행복하": [890],
	"행복하다": [890],
	"행복한": [[644,[890]]],
	"행복합": [[50,[890]]],
	"행복해": [[49,[890]]],
	"향수": [590],
	"향초": [1136],
	"허리": [836],
	"현관": [929],
	"형": [502],
	"형제": [503],
	"호선": [666],
	"호수": [181],
	"호주": [18],
	"호텔": [451],
	"홍대": [1237],
	"홍대입구역": [1238],
	"화가 나": [891],
	"화가 나다": [891],
	"화가 난": [[644,[891]]],
	"화가 납": [[50,[891]]],
	"화려하": [1091],
	"화려하다": [1091],
	"화려한": [[644,[1091]]],
	"화려합": [[50,[1091]]],
	"화려해": [[49,[1091]]],
	"화분": [1137],
	"화요일": [344],
	"화장실": [705],
	"화장품": [578],
	"환영회": [1111],
	"회비": [1112],
	"회사": [182],
	"회사원": [25],
	"회색": [1065],
	"횟수 표현": [278],
	"횡단보도": [698],
	"후": [1180],
	"후추": [955],
	"휴가": [780],
	"휴대전화": [93,626],
	"휴일": [781],
	"휴지": [94,1138],
	"흐려": [[49,[721]]],
	"흐리": [721],
	"흐리다": [721],
	"흐린": [[644,[721]]],
	"흐립": [[50,[721]]],
	"흰색": [1066],
	"힘든": [[644,[371]],"_힘들"],
	"힘들": [371,"_힘든"],
	"힘들다": [371],
	"힘들어": [[49,[371]]],
	"힘듭": [[50,[371]]],
};
// --- END HOMONYMS DATA ---

if (require.main === module) {
    runCli();
}

module.exports = {
    HOMONYMS,
    lookupToken,
    getConfusabilityScore,
    getTopConfusableTokens,
    getLeastConfusableTokens,
    parseKoreanParagraph,
    getPhoneticCandidates,
    getPhoneticNeighbors,
    linkConfusableTokens,
    pruneInvalidConfusables,
    updateHomonyms,
    getStats
};
