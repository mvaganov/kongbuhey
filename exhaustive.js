const { getPartOfSpeechCached, DATA_SCHEMA, cache } = require('./data.js');
const { applyMorphology, getFilteredWords, setCurrentUsageFilter, generateTemplateOptions, getTotalOptionsCut, resetTotalOptionsCut, hasBatchim, getStem } = require('./korean.js');
const fs = require('fs');

var requestedTags = undefined;
if (process.argv.length > 2) {
    requestedTags = {};
    for (let i = 2; i < process.argv.length; ++i) {
        let arg = process.argv[i];
        let posTags = getPartOfSpeechCached(arg);
        if (posTags.length > 0 || cache[arg]) {
            console.log(arg + " " + (posTags.length > 0 ? posTags : "Source"));
            requestedTags[arg] = true;
        } else {
            console.log(arg + " [Not found]");
        }
    }
}
setCurrentUsageFilter(requestedTags);

function generateExhaustive(template) {
    let unresolvedCombinations = generateTemplateOptions(template, 1);
    return unresolvedCombinations.map(c => applyMorphology(c));
}

// --- Semantic Vector Testing & Contextual Generation (from semantic_test.js) ---

function getRandom(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
}

function parseSemanticVector(unit) {
    if (!unit) return {};
    const sv = unit[DATA_SCHEMA.SemanticVector];
    if (sv) {
        try {
            return typeof sv === 'object' ? sv : JSON.parse(sv);
        } catch (e) {
            return {};
        }
    }
    return {};
}

const SemanticConfig = {
    globalStrictness: 0.5,
    grammarOverrides: {
        "contrast": 1.0,
        "condition": 0.3
    }
};

const KoreanWord = DATA_SCHEMA.Korean;
const Conjugation = DATA_SCHEMA.Conjugation;
const Tags = DATA_SCHEMA.SemanticTags;

function generateSemanticSentence(template, depth = 0, incomingContext = {}) {
    if (depth > 2) return { ko: "좋아요", context: {} };

    let koResult = template;
    let currentContext = { ...incomingContext };

    const tokenRegex = /\{([^}:]+)(?::([^}]+))?\}/g;
    let match;

    while ((match = tokenRegex.exec(koResult)) !== null) {
        const token = match[0];
        const tokenType = match[1];
        const tag = match[2];

        let activeStrictness = SemanticConfig.globalStrictness;
        if (currentContext.logic && SemanticConfig.grammarOverrides[currentContext.logic] !== undefined) {
            activeStrictness = SemanticConfig.grammarOverrides[currentContext.logic];
        }
        const applyConstraint = Math.random() < activeStrictness;

        let replacementKo = "";
        if (tokenType === "VP_AVst" || tokenType === "AVst") {
            let words = getFilteredWords("Action Verb");

            if (applyConstraint && currentContext.req_domain) {
                const domainWords = words.filter(w => parseSemanticVector(w).domain === currentContext.req_domain);
                if (domainWords.length > 0) words = domainWords;
            }

            const svWords = words.filter(w => parseSemanticVector(w).domain);
            if (svWords.length > 0) words = svWords;

            const word = getRandom(words);
            if (!word) {
                replacementKo = "N/A";
            } else {
                const sv = parseSemanticVector(word);
                if (sv.prod) currentContext.produced_state = sv.prod;
                if (sv.polarity !== undefined) currentContext.polarity = sv.polarity;

                let stem = getStem(word[KoreanWord]);
                if (word[Conjugation] && word[Conjugation] !== "regular" && word[Conjugation] !== "") stem += `[${word[Conjugation]}]`;

                const tags = word[Tags] || [];
                if (tokenType === "AVst") {
                    replacementKo = stem;
                } else if (tags.includes("transitive_food") || tags.includes("transitive_drink")) {
                    let reqTag = tags.includes("transitive_food") ? "food" : "drink";
                    let nounWords = getFilteredWords("Noun", reqTag).filter(w => parseSemanticVector(w).domain);
                    if (nounWords.length === 0) nounWords = getFilteredWords("Noun", reqTag);
                    const obj = getRandom(nounWords) || ["무엇"];
                    const particle = hasBatchim(obj[KoreanWord].slice(-1)) ? "을" : "를";
                    replacementKo = `${obj[KoreanWord]}${particle} ${stem}`;
                } else if (tags.includes("transitive_person")) {
                    let nounWords = getFilteredWords("Noun", "person");
                    const obj = getRandom(nounWords) || ["사람"];
                    const particle = hasBatchim(obj[KoreanWord].slice(-1)) ? "을" : "를";
                    replacementKo = `${obj[KoreanWord]}${particle} ${stem}`;
                } else if (tags.includes("dative_person")) {
                    let nounWords = getFilteredWords("Noun", "person");
                    const obj = getRandom(nounWords) || ["사람"];
                    replacementKo = `${obj[KoreanWord]}에게 ${stem}`;
                } else if (tags.includes("transitive_general")) {
                    let nounWords = getFilteredWords("Noun", "object");
                    if (nounWords.length === 0) nounWords = getFilteredWords("Noun");
                    const obj = getRandom(nounWords) || ["것"];
                    const particle = hasBatchim(obj[KoreanWord].slice(-1)) ? "을" : "를";
                    replacementKo = `${obj[KoreanWord]}${particle} ${stem}`;
                } else if (tags.includes("intransitive_motion")) {
                    let placeWords = getFilteredWords("Noun", "place").filter(w => parseSemanticVector(w).domain);
                    if (placeWords.length === 0) placeWords = getFilteredWords("Noun", "place");
                    const place = getRandom(placeWords) || ["어디"];
                    replacementKo = `${place[KoreanWord]}에 ${stem}`;
                } else {
                    replacementKo = stem;
                }
            }
        }
        else if (tokenType === "VP_DVst" || tokenType === "DVst") {
            let words = getFilteredWords("Descriptive Verb");

            if (applyConstraint && currentContext.logic === "cause_effect") {
                const matchingWords = words.filter(w => {
                    let sv = parseSemanticVector(w);
                    let matchesPolarity = (sv.polarity === currentContext.polarity);
                    let matchesProduced = (sv.req === currentContext.produced_state || sv.req === "any" || sv.domain === "state");
                    return matchesPolarity && matchesProduced;
                });
                if (matchingWords.length > 0) words = matchingWords;
            } else if (applyConstraint && currentContext.logic === "contrast") {
                const matchingWords = words.filter(w => {
                    let sv = parseSemanticVector(w);
                    let matchesPolarity = (sv.polarity !== currentContext.polarity && sv.polarity !== 0);
                    return matchesPolarity;
                });
                if (matchingWords.length > 0) words = matchingWords;
            }

            const svWords = words.filter(w => parseSemanticVector(w).domain);
            if (svWords.length > 0) words = svWords;

            const word = getRandom(words);
            if (!word) {
                replacementKo = "N/A";
            } else {
                let stem = getStem(word[KoreanWord]);
                if (word[Conjugation] && word[Conjugation] !== "regular" && word[Conjugation] !== "") stem += `[${word[Conjugation]}]`;

                if (tokenType === "DVst") {
                    replacementKo = stem;
                } else {
                    const tags = word[Tags] || [];
                    if (tags.includes("descriptive_food")) {
                        let nouns = getFilteredWords("Noun", "food");
                        const n = getRandom(nouns) || ["음식"];
                        const particle = hasBatchim(n[KoreanWord].slice(-1)) ? "이" : "가";
                        replacementKo = `${n[KoreanWord]}${particle} ${stem}`;
                    } else if (tags.includes("descriptive_person")) {
                        let nouns = getFilteredWords("Noun", "person");
                        const n = getRandom(nouns) || ["사람"];
                        const particle = hasBatchim(n[KoreanWord].slice(-1)) ? "이" : "가";
                        replacementKo = `${n[KoreanWord]}${particle} ${stem}`;
                    } else if (tags.includes("descriptive_place")) {
                        let nouns = getFilteredWords("Noun", "place");
                        const n = getRandom(nouns) || ["곳"];
                        const particle = hasBatchim(n[KoreanWord].slice(-1)) ? "이" : "가";
                        replacementKo = `${n[KoreanWord]}${particle} ${stem}`;
                    } else if (tags.includes("descriptive_general")) {
                        let nouns = getFilteredWords("Noun", "object");
                        if (nouns.length === 0) nouns = getFilteredWords("Noun");
                        const n = getRandom(nouns) || ["것"];
                        const particle = hasBatchim(n[KoreanWord].slice(-1)) ? "이" : "가";
                        replacementKo = `${n[KoreanWord]}${particle} ${stem}`;
                    } else {
                        replacementKo = stem;
                    }
                }
            }
        }
        else if (tokenType === "Clause" || tokenType === "VP") {
            let grammars = getFilteredWords("Grammar").filter(g => {
                const tags = g[Tags] || [];
                const sv = parseSemanticVector(g);
                return tags.includes("declarative") && (sv.logic === "declarative" || g[KoreanWord].includes("아요") || g[KoreanWord].includes("습니다"));
            });
            if (grammars.length === 0) grammars = getFilteredWords("Grammar").filter(g => (g[Tags] || []).includes("declarative"));
            if (grammars.length === 0) grammars = getFilteredWords("Grammar");
            const grammar = getRandom(grammars);

            if (grammar) {
                const formula = getRandom(grammar[Conjugation]);
                const sub = generateSemanticSentence(formula, depth + 1, currentContext);
                replacementKo = sub.ko;
            } else {
                replacementKo = "좋아요";
            }
        }
        else {
            let words = getFilteredWords(tokenType === "N" ? "Noun" : (tokenType === "Number" ? "Number" : "Adverb"), tag);

            if (applyConstraint && currentContext.logic === "cause_effect" && currentContext.produced_state) {
                const domainWords = words.filter(w => parseSemanticVector(w).domain);
                if (domainWords.length > 0) words = domainWords;
            }

            if (words.length > 0) {
                replacementKo = getRandom(words)[KoreanWord];
            } else {
                replacementKo = "N/A";
            }
        }

        if (replacementKo) {
            koResult = koResult.replace(token, replacementKo);
        } else {
            koResult = koResult.replace(token, "N/A");
        }
        tokenRegex.lastIndex = 0;
    }

    return { ko: koResult, context: currentContext };
}

function validateSemanticVectors() {
    let allPos = ["Noun", "Action Verb", "Descriptive Verb", "Adverb", "Grammar"];
    let totalCount = 0;
    let taggedCount = 0;
    let invalidCount = 0;

    allPos.forEach(pos => {
        getFilteredWords(pos).forEach(unit => {
            totalCount++;
            const raw = unit[DATA_SCHEMA.SemanticVector];
            if (raw && raw !== "") {
                taggedCount++;
                try {
                    if (typeof raw === 'string') JSON.parse(raw);
                } catch (e) {
                    invalidCount++;
                    console.error(`Invalid SemanticVector JSON for ${unit[DATA_SCHEMA.Korean]}:`, raw);
                }
            }
        });
    });

    console.log(`Semantic Vector Status: ${taggedCount}/${totalCount} units have semantic vectors (${invalidCount} JSON errors).`);
}

const badPatterns = [
    { pattern: /\{[^}]*\}/, name: "Unresolved placeholder" },
    { pattern: /이\/가|은\/는|을\/를|\(이\)랑/, name: "Unresolved particle alternation" },
    { pattern: /아\/어|으\//, name: "Unresolved vowel harmony / stem marker" },
    { pattern: /\[[a-z_]+\]/, name: "Unresolved conjugation rule tag" }
];

let validationErrors = 0;
let validatedSentencesCount = 0;

function validateSentence(sentence, contextName) {
    validatedSentencesCount++;
    for (let bp of badPatterns) {
        if (bp.pattern.test(sentence)) {
            console.error(`\n  [Grammar/Morphology Bug] ${bp.name} in "${sentence}" (${contextName})`);
            validationErrors++;
            return false;
        }
    }
    return true;
}

function runSemanticTests(currentGrammarUnits) {
    let resultLog = "\n--- Semantic Vector Context Tests ---\n";
    console.log("\n=== Semantic Vector Context Tests ===");

    const semanticTests = [
        { name: "Because A, B", template: "{VP_AVst}으/니까 {Clause}", context: { logic: "cause_effect", polarity_match: true } },
        { name: "But A, B", template: "{VP_AVst}는데 {Clause}", context: { logic: "contrast", polarity_match: false } },
        { name: "If A, B", template: "{VP_AVst}으/면 {Clause}", context: { logic: "condition" } },
        { name: "While doing A, B", template: "{AVst}으/면서 {Clause}", context: { logic: "parallel" } }
    ];

    semanticTests.forEach(t => {
        const header = `\n--- [Test] ${t.name} (${t.template}) ---`;
        console.log(`\n[Test] ${t.name} (${t.template}):`);
        resultLog += header + "\n";
        for (let i = 0; i < 3; i++) {
            const res = generateSemanticSentence(t.template, 0, t.context);
            const resolved = applyMorphology(res.ko);
            validateSentence(resolved, t.name);
            const line = `  Sample ${i + 1}: ${resolved}`;
            console.log(line);
            resultLog += line + "\n";
        }
    });

    // Also run contextual semantic samples on current source grammar templates
    if (currentGrammarUnits && currentGrammarUnits.length > 0) {
        console.log("\n--- Source Grammar Semantic Generation ---");
        resultLog += "\n--- Source Grammar Semantic Generation ---\n";
        currentGrammarUnits.forEach(gu => {
            const formulas = gu[DATA_SCHEMA.Conjugation];
            formulas.forEach(formula => {
                const sv = parseSemanticVector(gu);
                const header = `\n--- [Template] ${gu[KoreanWord]} (${formula}) ---`;
                resultLog += header + "\n";
                for (let i = 0; i < 2; i++) {
                    const res = generateSemanticSentence(formula, 0, sv);
                    const resolved = applyMorphology(res.ko);
                    validateSentence(resolved, gu[KoreanWord]);
                    const line = `  Sample ${i + 1}: ${resolved}`;
                    resultLog += line + "\n";
                }
            });
        });
    }

    return resultLog;
}

// --- Execution ---

validateSemanticVectors();

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
    generateExhaustive(t).forEach(s => {
        validateSentence(s, t);
        outputStr += s + "\n";
    });
    let cutCount = getTotalOptionsCut();
    if (cutCount > 0) {
        process.stdout.write(`(${cutCount} options cut to prevent combinatorial explosion) `)
    }
});
process.stdout.write("\n");

// Append semantic tests to exhaustive output
const semanticResults = runSemanticTests(grammarUnits);
outputStr += semanticResults;

fs.writeFileSync('exhaustive_output.txt', outputStr, 'utf8');
console.log("\nWrote output directly to exhaustive_output.txt in UTF-8 format.");
if (validationErrors === 0) {
    console.log(`Validation: ALL ${validatedSentencesCount} generated sentences PASSED morphology and grammar checks (0 errors).`);
} else {
    console.error(`Validation: FAILED - ${validationErrors} syntax/morphology errors detected across ${validatedSentencesCount} sentences.`);
}
