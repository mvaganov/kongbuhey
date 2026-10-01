const { getWords } = require('./data.js');
const { hasBatchim, getStem, applyMorphology } = require('./korean.js');

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSentence(template, depth = 0) {
  if (depth > 4) return { ko: "...", en: "..." }; 

  let koResult = template;
  let enParts = [];

  // Match {Token:tag} or {Token}
  const tokenRegex = /\{([^}:]+)(?::([^}]+))?\}/g;
  let match;
  
  while ((match = tokenRegex.exec(koResult)) !== null) {
    const token = match[0];
    const tokenType = match[1];
    const tag = match[2]; // e.g. "person", "food"
    
    let replacementKo = "";
    let replacementEn = "";
    
    if (tokenType === "N" || tokenType === "N_Phrase") {
      const word = getRandom(getWords("Noun", tag));
      replacementKo = word[0];
      replacementEn = `[${word[1]}]`;
    } 
    else if (tokenType === "Adv") {
      const word = getRandom(getWords("Adverb", tag));
      replacementKo = word[0];
      replacementEn = `[${word[1]}]`;
    }
    else if (tokenType === "AVst") {
      const word = getRandom(getWords("Action Verb", tag));
      let stem = getStem(word[0]);
      if (word[5] && word[5] !== "regular" && word[5] !== "") stem += `[${word[5]}]`;
      replacementKo = stem;
      replacementEn = `[${word[1]}]`;
    }
    else if (tokenType === "DVst") {
      const word = getRandom(getWords("Descriptive Verb", tag));
      let stem = getStem(word[0]);
      if (word[5] && word[5] !== "regular" && word[5] !== "") stem += `[${word[5]}]`;
      replacementKo = stem;
      replacementEn = `[${word[1]}]`;
    }
    else if (tokenType === "Clause" || tokenType === "VP") {
      const grammars = getWords("Grammar").filter(g => g[3].includes("declarative") || g[3].includes("suggestion"));
      const grammar = getRandom(grammars);
      const formula = getRandom(grammar[5]);
      const sub = generateSentence(formula, depth + 1);
      replacementKo = sub.ko;
      replacementEn = sub.en;
    }
    else if (tokenType === "VP_AVst") {
       // Pick a random AV
       const word = getRandom(getWords("Action Verb"));
       const tags = word[3];
       let stem = getStem(word[0]);
       if (word[5] && word[5] !== "regular" && word[5] !== "") stem += `[${word[5]}]`;
       
       if (tags.includes("transitive_food")) {
           const obj = getRandom(getWords("Noun", "food"));
           const particle = hasBatchim(obj[0].slice(-1)) ? "을" : "를";
           replacementKo = `${obj[0]}${particle} ${stem}`;
           replacementEn = `[${word[1]} ${obj[1]}]`;
       } else if (tags.includes("transitive_drink")) {
           const obj = getRandom(getWords("Noun", "drink"));
           const particle = hasBatchim(obj[0].slice(-1)) ? "을" : "를";
           replacementKo = `${obj[0]}${particle} ${stem}`;
           replacementEn = `[${word[1]} ${obj[1]}]`;
       } else if (tags.includes("intransitive_motion")) {
           // It needs a place destination
           const place = getRandom(getWords("Noun", "place"));
           replacementKo = `${place[0]}에 ${stem}`;
           replacementEn = `[${word[1]} to ${place[1]}]`;
       } else {
           replacementKo = stem;
           replacementEn = `[${word[1]}]`;
       }
    }
    else if (tokenType === "VP_DVst") {
       const word = getRandom(getWords("Descriptive Verb"));
       const tags = word[3];
       let stem = getStem(word[0]);
       if (word[5] && word[5] !== "regular" && word[5] !== "") stem += `[${word[5]}]`;

       let subjTag = "person"; // default
       if (tags.includes("descriptive_food")) subjTag = "food";
       else if (tags.includes("descriptive_person")) subjTag = "person";
       else if (tags.includes("descriptive_general")) subjTag = null; // any noun
       
       const subj = getRandom(getWords("Noun", subjTag));
       const particle = hasBatchim(subj[0].slice(-1)) ? "이" : "가";
       replacementKo = `${subj[0]}${particle} ${stem}`;
       replacementEn = `[${subj[1]} is ${word[1].replace('to be ', '')}]`;
    }
    
    if (replacementKo) {
        koResult = koResult.replace(token, replacementKo);
        if (replacementEn) enParts.push(replacementEn);
    }
    
    tokenRegex.lastIndex = 0;
  }
  
  koResult = applyMorphology(koResult);
  let enResult = enParts.join(" ");
  return { ko: koResult, en: enResult };
}

console.log("=== Random Korean Phrase Generator (Semantic Testing) ===\n");
const grammarUnits = getWords("Grammar");
const testTemplates = [];
grammarUnits.forEach(entry => {
    entry[5].forEach(formula => {
        testTemplates.push(formula);
    });
});

testTemplates.forEach(template => {
  console.log(`Template:  ${template}`);
  for (let i = 0; i < 2; i++) {
    const result = generateSentence(template);
    console.log(`  Korean:  ${result.ko}`);
    console.log(`  English: ${result.en}`);
  }
  console.log("------------------------------------------------");
});
