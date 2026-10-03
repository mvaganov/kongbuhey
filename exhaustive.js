const { KR_EN_languageUnits, getWords, getPartOfSpeechCached, DATA_SCHEMA } = require('./data.js');

var requestedTags = undefined;
if (process.argv.length > 2) {
    requestedTags = {};
    for (let i = 2; i < process.argv.length; ++i) {
        let arg = process.argv[i];
        let posTags = getPartOfSpeechCached(arg);
        console.log(arg + " " + posTags);
        if (posTags.length > 0) {
            requestedTags[arg] = true;
        }
    }
}

function getFilteredWords(pos, tag) {
    let words = getWords(pos, tag);
    if (requestedTags) {
        let originalWords = words;
        words = words.filter(w => {
            const source = w[DATA_SCHEMA.Source];
            const tags = w[DATA_SCHEMA.SemanticTags] || [];
            let isAllowed = requestedTags[source] || tags.includes("devtest");
            return isAllowed;
        });
        if (words.length == 0 && originalWords.length > 0) {
            words = originalWords.slice(0, 5);
        }
    }
    return words;
}
const { hasBatchim, getStem, applyMorphology } = require('./korean.js');

function getConjugatedStem(koreanWord, conjugation) {
    let stem = getStem(koreanWord);
    if (conjugation && conjugation !== "regular" && conjugation !== "") stem += `[${conjugation}]`;
    return stem;
}

var totalOptionsCutToPreventCombinatorialExplosion = 0;
function generateExhaustive(template) {
    const tokenRegex = /\{([^}:]+)(?::([^}]+))?\}/g;
    let tokens = [];
    let match;
    let parts = [];
    let lastIndex = 0;

    while ((match = tokenRegex.exec(template)) !== null) {
        parts.push(template.substring(lastIndex, match.index));
        tokens.push({ type: match[1], tag: match[2], full: match[0] });
        lastIndex = tokenRegex.lastIndex;
    }
    parts.push(template.substring(lastIndex));

    let optionsPerToken = tokens.map(token => {
        let options = [];
        const KoreanWord = DATA_SCHEMA.Korean;
        const Conjugation = DATA_SCHEMA.Conjugation;
        const SemanticTags = DATA_SCHEMA.SemanticTags;
        if (token.type === "N" || token.type === "N_Phrase") {
            options = getFilteredWords("Noun", token.tag).map(w => w[KoreanWord]);
        } else if (token.type === "AVst") {
            options = getFilteredWords("Action Verb", token.tag).map(w => getConjugatedStem(w[KoreanWord], w[Conjugation]));
        } else if (token.type === "DVst") {
            options = getFilteredWords("Descriptive Verb", token.tag).map(w => getConjugatedStem(w[KoreanWord], w[Conjugation]));
        } else if (token.type === "Number") {
            options = getFilteredWords("Number", token.tag).map(w => w[KoreanWord]);
        } else if (token.type === "Adv") {
            options = getFilteredWords("Adverb", token.tag).map(w => w[KoreanWord]);
        } else if (token.type === "Clause") {
            options = ["갑니다", "좋아요"];
        } else if (token.type === "VP_AVst") {
            const avs = getFilteredWords("Action Verb", token.tag);
            avs.forEach(av => {
                const tags = av[SemanticTags];
                let stem = getConjugatedStem(av[KoreanWord], av[Conjugation]);
                if (tags.includes("transitive_food")) getFilteredWords("Noun", "food").forEach(n => options.push(`${n[KoreanWord]}을/를 ${stem}`));
                if (tags.includes("transitive_drink")) getFilteredWords("Noun", "drink").forEach(n => options.push(`${n[KoreanWord]}을/를 ${stem}`));
                if (tags.includes("intransitive_motion")) getFilteredWords("Noun", "place").forEach(n => options.push(`${n[KoreanWord]}에 ${stem}`));
            });
            options = [...new Set(options)];
        } else if (token.type === "VP_DVst") {
            const dvs = getFilteredWords("Descriptive Verb", token.tag);
            dvs.forEach(dv => {
                const tags = dv[SemanticTags];
                let stem = getConjugatedStem(dv[KoreanWord], dv[Conjugation]);
                if (tags.includes("descriptive_food")) getFilteredWords("Noun", "food").forEach(n => options.push(`${n[KoreanWord]}이/가 ${stem}`));
                if (tags.includes("descriptive_person")) getFilteredWords("Noun", "person").forEach(n => options.push(`${n[KoreanWord]}이/가 ${stem}`));
                if (tags.includes("descriptive_general")) getFilteredWords("Noun", "place").forEach(n => options.push(`${n[KoreanWord]}이/가 ${stem}`));
            });
            options = [...new Set(options)];
        }

        if (!requestedTags && options.length > 5) {
            totalOptionsCutToPreventCombinatorialExplosion += options.length - 5;
            options = options.sort(() => 0.5 - Math.random()).slice(0, 5);
        }
        return options;
    });

    const cartesian = (...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));

    let combinations = [];
    if (optionsPerToken.length > 0) {
        combinations = cartesian(...optionsPerToken);
        if (optionsPerToken.length === 1) {
            combinations = combinations.map(item => [item]);
        }
    } else {
        return [applyMorphology(template)];
    }

    let results = [];
    combinations.forEach(combo => {
        let str = "";
        for (let i = 0; i < parts.length - 1; i++) {
            str += parts[i] + combo[i];
        }
        str += parts[parts.length - 1];
        results.push(applyMorphology(str));
    });

    return results;
}

const fs = require('fs');

const grammarUnits = getFilteredWords("Grammar");
const templates = [];
grammarUnits.forEach(entry => {
    entry[5].forEach(formula => {
        templates.push(formula);
    });
});

let outputStr = "";
templates.forEach((t, index) => {
    process.stdout.write(`\rGenerating: ${index + 1}/${templates.length} templates processed...`);
    outputStr += `\n--- Template: ${t} ---\n`;
    generateExhaustive(t).forEach(s => outputStr += s + "\n");
    if (totalOptionsCutToPreventCombinatorialExplosion > 0) {
        process.stdout.write(`(${totalOptionsCutToPreventCombinatorialExplosion} options cut to prevent combinatorial explosion) `)
    }
});
process.stdout.write("\n");

fs.writeFileSync('exhaustive_output.txt', outputStr, 'utf8');
console.log("Wrote output directly to exhaustive_output.txt in UTF-8 format.");
