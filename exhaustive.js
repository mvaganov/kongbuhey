const { KR_EN_languageUnits, getWords } = require('./data.js');

const filterArg = process.argv[2];

function getFilteredWords(pos, tag) {
    let words = getWords(pos, tag);
    if (filterArg) {
        words = words.filter(w => {
            const source = w[6];
            const tags = w[3] || [];
            return source === filterArg || tags.includes("devtest");
        });
    }
    return words;
}
const { hasBatchim, getStem, applyMorphology } = require('./korean.js');

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
        if (token.type === "N" || token.type === "N_Phrase") {
            options = getFilteredWords("Noun", token.tag).map(w => w[0]);
        } else if (token.type === "AVst") {
            options = getFilteredWords("Action Verb", token.tag).map(w => {
                let stem = getStem(w[0]);
                if (w[5] && w[5] !== "regular" && w[5] !== "") stem += `[${w[5]}]`;
                return stem;
            });
        } else if (token.type === "DVst") {
            options = getFilteredWords("Descriptive Verb", token.tag).map(w => {
                let stem = getStem(w[0]);
                if (w[5] && w[5] !== "regular" && w[5] !== "") stem += `[${w[5]}]`;
                return stem;
            });
        } else if (token.type === "Number") {
            options = getFilteredWords("Number", token.tag).map(w => w[0]);
        } else if (token.type === "Adv") {
            options = getFilteredWords("Adverb", token.tag).map(w => w[0]);
        } else if (token.type === "Clause") {
            options = ["갑니다", "좋아요"];
        } else if (token.type === "VP_AVst") {
            const avs = getFilteredWords("Action Verb", token.tag);
            avs.forEach(av => {
                const tags = av[3];
                let stem = getStem(av[0]);
                if (av[5] && av[5] !== "regular" && av[5] !== "") stem += `[${av[5]}]`;
                if (tags.includes("transitive_food")) getFilteredWords("Noun", "food").forEach(n => options.push(`${n[0]}을/를 ${stem}`));
                if (tags.includes("transitive_drink")) getFilteredWords("Noun", "drink").forEach(n => options.push(`${n[0]}을/를 ${stem}`));
                if (tags.includes("intransitive_motion")) getFilteredWords("Noun", "place").forEach(n => options.push(`${n[0]}에 ${stem}`));
            });
            options = [...new Set(options)];
        } else if (token.type === "VP_DVst") {
            const dvs = getFilteredWords("Descriptive Verb", token.tag);
            dvs.forEach(dv => {
                const tags = dv[3];
                let stem = getStem(dv[0]);
                if (dv[5] && dv[5] !== "regular" && dv[5] !== "") stem += `[${dv[5]}]`;
                if (tags.includes("descriptive_food")) getFilteredWords("Noun", "food").forEach(n => options.push(`${n[0]}이/가 ${stem}`));
                if (tags.includes("descriptive_person")) getFilteredWords("Noun", "person").forEach(n => options.push(`${n[0]}이/가 ${stem}`));
                if (tags.includes("descriptive_general")) getFilteredWords("Noun", "place").forEach(n => options.push(`${n[0]}이/가 ${stem}`));
            });
            options = [...new Set(options)];
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
templates.forEach(t => {
    outputStr += `\n--- Template: ${t} ---\n`;
    generateExhaustive(t).forEach(s => outputStr += s + "\n");
});

fs.writeFileSync('exhaustive_output.txt', outputStr, 'utf8');
console.log("Wrote output directly to exhaustive_output.txt in UTF-8 format.");
