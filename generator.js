const { applyMorphology, generateTemplateOptions, getFilteredWords } = require('./korean.js');

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSentence(template) {
  // Use generateTemplateOptions which uses the logic in korean.js
  let options = generateTemplateOptions(template, 0); 
  
  if (options.length === 0) {
      return { ko: "Error: No options generated", en: "" };
  }
  
  // Pick a random combination
  let koResult = applyMorphology(getRandom(options));
  return { ko: koResult, en: "" };
}

console.log("=== Random Korean Phrase Generator (Semantic Testing) ===\n");
const grammarUnits = getFilteredWords("Grammar");
const testTemplates = [];
grammarUnits.forEach(entry => {
    entry[5].forEach(formula => {
        testTemplates.push(formula);
    });
});

// Let's specifically test a template that uses {Clause} so we can see depth
const clauseTemplate = "{VP_AVst}으/니까 {Clause}";

console.log(`Testing Deep Clause Generation with: ${clauseTemplate}\n`);
for (let i = 0; i < 10; i++) {
    const result = generateSentence(clauseTemplate);
    console.log(`  Korean:  ${result.ko}`);
}
