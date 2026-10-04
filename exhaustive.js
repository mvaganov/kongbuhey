const { getPartOfSpeechCached, DATA_SCHEMA } = require('./data.js');
const { applyMorphology, getFilteredWords, setCurrentUsageFilter, generateTemplateOptions, getTotalOptionsCut, resetTotalOptionsCut } = require('./korean.js');

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
setCurrentUsageFilter(requestedTags);

function generateExhaustive(template) {
    let unresolvedCombinations = generateTemplateOptions(template, 1);
    return unresolvedCombinations.map(c => applyMorphology(c));
}

const fs = require('fs');

const grammarUnits = getFilteredWords("Grammar");
const templates = [];
grammarUnits.forEach(entry => {
    entry[DATA_SCHEMA.Conjugation].forEach(formula => {
        templates.push(formula);
    });
});

let outputStr = "";
templates.forEach((t, index) => {
    resetTotalOptionsCut();
    process.stdout.write(`\rGenerating: ${index + 1}/${templates.length} templates processed...`);
    outputStr += `\n--- Template: ${t} ---\n`;
    generateExhaustive(t).forEach(s => outputStr += s + "\n");
    let cutCount = getTotalOptionsCut();
    if (cutCount > 0) {
        process.stdout.write(`(${cutCount} options cut to prevent combinatorial explosion) `)
    }
});
process.stdout.write("\n");

fs.writeFileSync('exhaustive_output.txt', outputStr, 'utf8');
console.log("Wrote output directly to exhaustive_output.txt in UTF-8 format.");
