/**
 * homonyms.js
 * 
 * Korean Homonym, Allomorphic Stem & Phonetic Confusables Engine for Kongbuhey.
 * Maps surface Hangul tokens to:
 *   1. Unambiguous integer IDs (direct vocabulary matches or base verb stems)
 *   2. Language Unit Trees (LUTs: [grammarId, [childId]]) for conjugated/portmanteau tokens
 *   3. Phonetic confusable neighbors (strings prefixed with '_', e.g. '_발', '_강')
 *      ONLY included if the confusable neighbor actually exists in the HOMONYMS dictionary.
 *
 * Supports:
 *   - Fast reverse ingestion & paragraph parsing
 *   - Flashcard distractor selection & confusion tips
 *   - Incremental batch updates as new vocabulary is added to data.js
 */

const fs = require('fs');
const path = require('path');
const { KR_EN_languageUnits, DATA_SCHEMA } = require('./data.js');
const { getStem, applyMorphology, decomposeHangul, composeHangul } = require('./korean.js');

// --- BEGIN HOMONYMS DATA ---
const HOMONYMS = {
	"가": [44,96],
	"가 아니에요": [95],
	"가끔": [48],
	"가다": [44],
	"가방": [83],
	"가수": [27],
	"간": [[644,[44]]],
	"간호사": [28],
	"감사하": [20],
	"감사하다": [20],
	"감사한": [[644,[20]]],
	"감사합": [[50,[20]]],
	"감사해": [[49,[20]]],
	"갑": [[50,[44]]],
	"거울": [65],
	"공책": [79],
	"괜찮": [21],
	"괜찮다": [21],
	"괜찮아": [[49,[21]]],
	"괜찮은": [[644,[21]]],
	"교실": [58],
	"그것": [59],
	"근처": [117],
	"기숙사": [103],
	"기자": [29],
	"꽃": [104],
	"나라": [6],
	"나빠": [[49,[124]]],
	"나쁘": [124],
	"나쁘다": [124],
	"나쁜": [[644,[124]]],
	"나쁩": [[50,[124]]],
	"날씨": [123],
	"내일": [46],
	"네": [4],
	"노르웨이": [7],
	"누가": [[96,[30]],66],
	"누구": [30],
	"는": [36],
	"달력": [67],
	"더운": [[644,[125]]],
	"더워": [[49,[125]]],
	"덥": [125],
	"덥다": [125],
	"도서관": [97],
	"돈": [84],
	"뒤": [105],
	"마셔": [[49,[41]]],
	"마시": [41],
	"마시다": [41],
	"마신": [[644,[41]]],
	"마십": [[50,[41]]],
	"많": [126],
	"많다": [126],
	"많아": [[49,[126]]],
	"많은": [[644,[126]]],
	"맛있": [43],
	"맛있다": [43],
	"맛있어": [[49,[43]]],
	"맛있은": [[644,[43]]],
	"먹": [40],
	"먹다": [40],
	"먹어": [[49,[40]]],
	"먹은": [[644,[40]]],
	"무엇": [60],
	"문": [69,"_물"],
	"물": [39,"_문"],
	"미국": [8],
	"미국 사람": [0],
	"ㅂ니다": [50],
	"밖": [106],
	"밥": [38],
	"방": [118],
	"배우": [31],
	"베트남": [9],
	"볼펜": [85],
	"부사 표현": [57],
	"브라질": [10],
	"사람": [11],
	"사무실": [107],
	"서점": [108],
	"선생님": [32],
	"습니다": [50],
	"시계": [70],
	"시끄러운": [[644,[127]]],
	"시끄러워": [[49,[127]]],
	"시끄럽": [127],
	"시끄럽다": [127],
	"식당": [109],
	"신문": [86],
	"씨": [23],
	"아": [52],
	"아니요": [26],
	"아래": [110],
	"아요": [49,"_어요"],
	"아주": [122],
	"안": [98],
	"안녕하": [5],
	"안녕하다": [5],
	"안녕한": [[644,[5]]],
	"안녕합": [[50,[5]]],
	"안녕해": [[49,[5]]],
	"앞": [99],
	"어느": [19],
	"어디": [100],
	"어때": [[49,[120]]],
	"어떤": [[644,[120]]],
	"어떻": [120],
	"어떻다": [120],
	"어서": [52],
	"어요": [49,"_아요"],
	"없": [81],
	"없다": [81],
	"없어": [[49,[81]]],
	"없은": [[644,[81]]],
	"에": [132],
	"여기": [61],
	"연필": [87],
	"옆": [111],
	"예요": [37],
	"오늘": [45],
	"옷걸이": [71],
	"요리사": [33],
	"우리": [62],
	"우체국": [112],
	"위": [113],
	"은": [36],
	"은행": [101],
	"은행원": [34],
	"의사": [35],
	"의자": [72],
	"이": [55,95,96],
	"이것": [63],
	"이다": [55],
	"이름": [1],
	"이에": [[49,[55]]],
	"이에요": [37],
	"인": [[644,[55]]],
	"일본": [12],
	"입": [[50,[55]]],
	"입니다": [56],
	"있": [82],
	"있다": [82],
	"있어": [[49,[82]]],
	"있은": [[644,[82]]],
	"자주": [47],
	"작": [128,"_적"],
	"작다": [128,"_적다"],
	"작아": [[49,[128]]],
	"작은": [[644,[128]],"_적은"],
	"잡지": [88],
	"저": [2],
	"저것": [73],
	"저기": [114],
	"저는": [[36,[2]]],
	"적": [129,"_작"],
	"적다": [129,"_작다"],
	"적어": [[49,[129]]],
	"적은": [[644,[129]],"_작은"],
	"제": [3],
	"제가": [[96,[2]]],
	"조용하": [130],
	"조용하다": [130],
	"조용한": [[644,[130]]],
	"조용합": [[50,[130]]],
	"조용해": [[49,[130]]],
	"좋": [121],
	"좋다": [121],
	"좋아": [[49,[121]]],
	"좋은": [[644,[121]]],
	"죄송하": [22],
	"죄송하다": [22],
	"죄송한": [[644,[22]]],
	"죄송합": [[50,[22]]],
	"죄송해": [[49,[22]]],
	"중국": [13],
	"지갑": [89],
	"지도": [68],
	"지우개": [90],
	"창문": [74],
	"책": [80],
	"책상": [75],
	"체육관": [115],
	"추운": [[644,[131]]],
	"추워": [[49,[131]]],
	"춥": [131],
	"춥다": [131],
	"친구": [76],
	"칠판": [77],
	"커": [[49,[42]]],
	"컴퓨터": [64],
	"케냐": [14],
	"크": [42],
	"크다": [42],
	"큰": [[644,[42]]],
	"큽": [[50,[42]]],
	"텔레비전": [78],
	"편의점": [116],
	"프랑스": [15],
	"필통": [91],
	"학생": [24],
	"학생식당": [119],
	"학생증": [92],
	"학생회관": [102],
	"한국": [16],
	"한국 사람": [17],
	"해요": [49],
	"호주": [18],
	"회사원": [25],
	"휴대전화": [93],
	"휴지": [94],
};
// --- END HOMONYMS DATA ---

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

function printHelp() {
    console.log(`
Kongbuhey Homonyms & Confusables Engine (homonyms.js)
=====================================================
USAGE:
  node homonyms.js <command> [options]

COMMANDS:
  update                 Incrementally ingest language units from data.js
    --source, -s <tags>  Comma-separated sources (e.g. SUOBI01,SUOBI02)
    --ids <start..end>   ID range (e.g. 0..50)
    --clean, --reset     Rebuild dataset cleanly from specified sources
    --dry-run            Preview changes without modifying file

  lookup <token>         Inspect entries for a specific Hangul token
  parse "<text>"         Morphologically analyze a Korean paragraph
  top [limit]            List top most confusable tokens (default: 10)
  least [limit]          List top least confusable tokens (default: 10)
  stats                  Print dataset metrics and counts

EXAMPLES:
  node homonyms.js update --source SUOBI00,SUOBI01,SUOBI02,SUOBI03
  node homonyms.js lookup 간
  node homonyms.js top 10
  node homonyms.js parse "저는 미국 사람입니다. 도서관에 가요."
`);
}

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
