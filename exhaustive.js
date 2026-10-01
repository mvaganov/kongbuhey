const { getWords } = require('./data.js');
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
            options = getWords("Noun", token.tag).map(w => w[0]);
        } else if (token.type === "AVst") {
            options = getWords("Action Verb", token.tag).map(w => getStem(w[0]));
        } else if (token.type === "DVst") {
            options = getWords("Descriptive Verb", token.tag).map(w => getStem(w[0]));
        } else if (token.type === "Adv") {
            options = getWords("Adverb", token.tag).map(w => w[0]);
        } else if (token.type === "Clause") {
            options = ["갑니다", "좋아요"];
        } else if (token.type === "VP_AVst") {
            const avs = getWords("Action Verb", token.tag);
            avs.forEach(av => {
                const tags = av[3];
                const stem = getStem(av[0]);
                if (tags.includes("transitive_food")) getWords("Noun", "food").forEach(n => options.push(`${n[0]}을/를 ${stem}`));
                if (tags.includes("transitive_drink")) getWords("Noun", "drink").forEach(n => options.push(`${n[0]}을/를 ${stem}`));
                if (tags.includes("intransitive_motion")) getWords("Noun", "place").forEach(n => options.push(`${n[0]}에 ${stem}`));
            });
            options = [...new Set(options)];
        } else if (token.type === "VP_DVst") {
            const dvs = getWords("Descriptive Verb", token.tag);
            dvs.forEach(dv => {
                const tags = dv[3];
                const stem = getStem(dv[0]);
                if (tags.includes("descriptive_food")) getWords("Noun", "food").forEach(n => options.push(`${n[0]}이/가 ${stem}`));
                if (tags.includes("descriptive_person")) getWords("Noun", "person").forEach(n => options.push(`${n[0]}이/가 ${stem}`));
                if (tags.includes("descriptive_general")) getWords("Noun", "place").forEach(n => options.push(`${n[0]}이/가 ${stem}`));
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

const grammarUnits = getWords("Grammar");
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
