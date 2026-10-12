let dataModule;
if (typeof require !== 'undefined') {
    dataModule = require('./data.js');
} else {
    dataModule = window;
}
const { getWords, DATA_SCHEMA } = dataModule;
const hasTag = dataModule.hasTag || function(unit, ...tags) {
    if (!unit) return false;
    const tagSet = unit[DATA_SCHEMA.TagSet];
    if (tagSet) {
        if (tags.length === 1) return tagSet.has(tags[0]);
        for (let i = 0; i < tags.length; i++) if (tagSet.has(tags[i])) return true;
        return false;
    }
    const unitTags = unit[DATA_SCHEMA.SemanticTags] || [];
    if (tags.length === 1) return unitTags.includes(tags[0]);
    return tags.some(t => unitTags.includes(t));
};

let currentUsageFilter = null;
let totalOptionsCutToPreventCombinatorialExplosion = 0;

function setCurrentUsageFilter(filter) {
    currentUsageFilter = filter;
}

function getTotalOptionsCut() {
    return totalOptionsCutToPreventCombinatorialExplosion;
}

function resetTotalOptionsCut() {
    totalOptionsCutToPreventCombinatorialExplosion = 0;
}

function getFilteredWords(pos, tag) {
    let words = getWords(pos, tag);
    if (currentUsageFilter) {
        let originalWords = words;
        words = words.filter(w => {
            const source = w[DATA_SCHEMA.Source];
            let isAllowed = currentUsageFilter[source] || hasTag(w, "devtest");
            if (!isAllowed) {
                const tags = w[DATA_SCHEMA.SemanticTags] || [];
                isAllowed = tags.some(t => currentUsageFilter[t]);
            }
            return isAllowed;
        });
        if (words.length == 0 && originalWords.length > 0) {
            words = originalWords.slice(0, 5);
        }
    }
    return words;
}

function getConjugatedStem(koreanWord, conjugation) {
    let stem = getStem(koreanWord);
    if (conjugation && conjugation !== "regular" && conjugation !== "") stem += `[${conjugation}]`;
    return stem;
}

class TokenOption {
    constructor(text, units = []) {
        this.text = text;
        this.units = Array.isArray(units) ? units : (units ? [units] : []);
    }
    toString() {
        return this.text;
    }
}

let usedUnitIds = new Set();

function markUnitUsed(unit) {
    if (!unit) return;
    const id = Array.isArray(unit) ? unit[DATA_SCHEMA.Id] : unit.Id;
    if (typeof id === 'number') {
        usedUnitIds.add(id);
    }
}

function getUsedUnitIds() {
    return usedUnitIds;
}

function resetUsedUnits() {
    usedUnitIds.clear();
}

function deduplicateTokenOptions(options) {
    const seen = new Map();
    for (let opt of options) {
        if (!opt) continue;
        const text = typeof opt === 'string' ? opt : opt.text;
        const units = (opt instanceof TokenOption) ? opt.units : [];
        if (!seen.has(text)) {
            seen.set(text, new TokenOption(text, [...units]));
        } else {
            const existing = seen.get(text);
            for (let u of units) {
                if (!existing.units.includes(u)) {
                    existing.units.push(u);
                }
            }
        }
    }
    return Array.from(seen.values());
}

function getTokenOptions(token, depth = 0) {
    let options = [];
    const KoreanWord = DATA_SCHEMA.Korean;
    const Conjugation = DATA_SCHEMA.Conjugation;
    const SemanticTags = DATA_SCHEMA.SemanticTags;
    
    if (token.type === "N" || token.type === "N_Phrase") {
        options = getFilteredWords("Noun", token.tag).map(w => new TokenOption(w[KoreanWord], [w]));
    } else if (token.type === "AVst") {
        options = getFilteredWords("Action Verb", token.tag).map(w => new TokenOption(getConjugatedStem(w[KoreanWord], w[Conjugation]), [w]));
    } else if (token.type === "DVst") {
        options = getFilteredWords("Descriptive Verb", token.tag).map(w => new TokenOption(getConjugatedStem(w[KoreanWord], w[Conjugation]), [w]));
    } else if (token.type === "Number") {
        options = getFilteredWords("Number", token.tag).map(w => new TokenOption(w[KoreanWord], [w]));
    } else if (token.type === "Adv") {
        options = getFilteredWords("Adverb", token.tag).map(w => new TokenOption(w[KoreanWord], [w]));
    } else if (token.type === "Exclamation") {
        options = getFilteredWords("Exclamation", token.tag).map(w => new TokenOption(w[KoreanWord], [w]));
    } else if (token.type === "Clause" || token.type === "VP") {
        if (depth > 0) {
            options = [new TokenOption("갑니다"), new TokenOption("좋아요")];
        } else {
            const grammars = getFilteredWords("Grammar").filter(g => {
                return hasTag(g, "declarative", "suggestion");
            });
            if (grammars.length > 0) {
                grammars.forEach(g => {
                    const formulas = g[Conjugation];
                    formulas.forEach(formula => {
                        const subOptions = generateTemplateTokenOptions(formula, depth + 1);
                        subOptions.forEach(sub => {
                            options.push(new TokenOption(sub.text, [g, ...sub.units]));
                        });
                    });
                });
            } else {
                options = [new TokenOption("갑니다"), new TokenOption("좋아요")];
            }
        }
    } else if (token.type === "VP_AVst") {
        const avs = getFilteredWords("Action Verb", token.tag);
        avs.forEach(av => {
            let stem = getConjugatedStem(av[KoreanWord], av[Conjugation]);
            if (hasTag(av, "transitive_food")) getFilteredWords("Noun", "food").forEach(n => options.push(new TokenOption(`${n[KoreanWord]}을/를 ${stem}`, [av, n])));
            if (hasTag(av, "transitive_drink")) getFilteredWords("Noun", "drink").forEach(n => options.push(new TokenOption(`${n[KoreanWord]}을/를 ${stem}`, [av, n])));
            if (hasTag(av, "transitive_person")) getFilteredWords("Noun", "person").forEach(n => options.push(new TokenOption(`${n[KoreanWord]}을/를 ${stem}`, [av, n])));
            if (hasTag(av, "dative_person")) getFilteredWords("Noun", "person").forEach(n => options.push(new TokenOption(`${n[KoreanWord]}에게 ${stem}`, [av, n])));
            if (hasTag(av, "transitive_general")) {
                let objs = getFilteredWords("Noun", "object");
                if (objs.length === 0) objs = getFilteredWords("Noun");
                objs.forEach(n => options.push(new TokenOption(`${n[KoreanWord]}을/를 ${stem}`, [av, n])));
            }
            if (hasTag(av, "transitive_sports")) {
                let sports = getFilteredWords("Noun", "sports");
                if (sports.length === 0) sports = getFilteredWords("Noun", "activity");
                sports.forEach(n => options.push(new TokenOption(`${n[KoreanWord]}을/를 ${stem}`, [av, n])));
            }
            if (hasTag(av, "transitive_transportation")) {
                let trans = getFilteredWords("Noun", "transportation");
                trans.forEach(n => options.push(new TokenOption(`${n[KoreanWord]}을/를 ${stem}`, [av, n])));
            }
            if (hasTag(av, "transitive_place")) {
                let places = getFilteredWords("Noun", "place");
                places.forEach(n => options.push(new TokenOption(`${n[KoreanWord]}을/를 ${stem}`, [av, n])));
            }
            if (hasTag(av, "intransitive_motion")) getFilteredWords("Noun", "place").forEach(n => options.push(new TokenOption(`${n[KoreanWord]}에 ${stem}`, [av, n])));
            if (hasTag(av, "intransitive_general")) options.push(new TokenOption(stem, [av]));
        });
    } else if (token.type === "VP_DVst") {
        const dvs = getFilteredWords("Descriptive Verb", token.tag);
        dvs.forEach(dv => {
            let stem = getConjugatedStem(dv[KoreanWord], dv[Conjugation]);
            if (hasTag(dv, "descriptive_food")) getFilteredWords("Noun", "food").forEach(n => options.push(new TokenOption(`${n[KoreanWord]}이/가 ${stem}`, [dv, n])));
            if (hasTag(dv, "descriptive_person")) getFilteredWords("Noun", "person").forEach(n => options.push(new TokenOption(`${n[KoreanWord]}이/가 ${stem}`, [dv, n])));
            if (hasTag(dv, "descriptive_place")) getFilteredWords("Noun", "place").forEach(n => options.push(new TokenOption(`${n[KoreanWord]}이/가 ${stem}`, [dv, n])));
            if (hasTag(dv, "descriptive_general")) {
                let nouns = getFilteredWords("Noun", "object");
                if (nouns.length === 0) nouns = getFilteredWords("Noun");
                nouns.forEach(n => options.push(new TokenOption(`${n[KoreanWord]}이/가 ${stem}`, [dv, n])));
            }
        });
    }

    options = deduplicateTokenOptions(options);

    if (!currentUsageFilter && options.length > 5) {
        totalOptionsCutToPreventCombinatorialExplosion += options.length - 5;
        options = options.sort(() => 0.5 - Math.random()).slice(0, 5);
    }
    return options;
}

function generateTemplateTokenOptions(template, depth = 0) {
    if (depth > 2) return [new TokenOption("갑니다"), new TokenOption("좋아요")];

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

    let optionsPerToken = tokens.map(token => getTokenOptions(token, depth));

    const cartesian = (...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));

    let combinations = [];
    if (optionsPerToken.length > 0) {
        combinations = cartesian(...optionsPerToken);
        if (optionsPerToken.length === 1) {
            combinations = combinations.map(item => [item]);
        }
    } else {
        return [new TokenOption(template, [])];
    }

    let results = [];
    combinations.forEach(combo => {
        let str = "";
        let comboUnits = [];
        for (let i = 0; i < parts.length - 1; i++) {
            const opt = combo[i];
            const text = (opt && opt.text !== undefined) ? opt.text : String(opt);
            str += parts[i] + text;
            if (opt && opt.units) {
                comboUnits.push(...opt.units);
            }
        }
        str += parts[parts.length - 1];

        const uniqueUnits = [];
        for (let u of comboUnits) {
            if (u && !uniqueUnits.includes(u)) {
                uniqueUnits.push(u);
            }
        }
        results.push(new TokenOption(str, uniqueUnits));
    });

    return results;
}

function generateTemplateOptions(template, depth = 0) {
    const tokenOptions = generateTemplateTokenOptions(template, depth);
    tokenOptions.forEach(opt => {
        if (opt && opt.units) {
            opt.units.forEach(u => markUnitUsed(u));
        }
    });
    return tokenOptions.map(opt => opt.text);
}

// --- Semantic Vector & Contextual Sentence Generation ---

const SemanticConfig = {
    globalStrictness: 0.5,
    grammarOverrides: {
        "contrast": 1.0,
        "condition": 0.3
    }
};

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

function shouldApplySemanticConstraint(context) {
    let activeStrictness = SemanticConfig.globalStrictness;
    if (context && context.logic && SemanticConfig.grammarOverrides[context.logic] !== undefined) {
        activeStrictness = SemanticConfig.grammarOverrides[context.logic];
    }
    return Math.random() < activeStrictness;
}

let templateToGrammarMap = null;

function initTemplateToGrammarMap() {
    if (templateToGrammarMap) return templateToGrammarMap;
    templateToGrammarMap = new Map();
    const allGrammars = getWords("Grammar");
    allGrammars.forEach(gu => {
        if (!gu) return;
        const formulas = gu[DATA_SCHEMA.Conjugation];
        if (Array.isArray(formulas)) {
            formulas.forEach((formula, idx) => {
                if (!templateToGrammarMap.has(formula)) {
                    templateToGrammarMap.set(formula, { grammarUnit: gu, formulaIndex: idx });
                }
            });
        }
    });
    return templateToGrammarMap;
}

function findGrammarUnitForTemplate(template) {
    if (!template || typeof template !== 'string') return null;
    const map = initTemplateToGrammarMap();
    if (map.has(template)) return map.get(template);
    // Attempt fuzzy match by trimming whitespace
    const trimmed = template.trim();
    if (map.has(trimmed)) return map.get(trimmed);
    return null;
}

function buildActionVerbPhrase(word, stem, chosenNoun = null) {
    const KoreanWord = DATA_SCHEMA.Korean;
    let noun = chosenNoun;
    let particleType = "object"; // "object" (을/를), "dative" (에게), "location" (에), "none"
    let tagMatched = null;

    if (hasTag(word, "transitive_food") || hasTag(word, "transitive_drink")) {
        tagMatched = hasTag(word, "transitive_food") ? "food" : "drink";
        particleType = "object";
    } else if (hasTag(word, "transitive_person")) {
        tagMatched = "person";
        particleType = "object";
    } else if (hasTag(word, "dative_person")) {
        tagMatched = "person";
        particleType = "dative";
    } else if (hasTag(word, "transitive_general")) {
        tagMatched = "object";
        particleType = "object";
    } else if (hasTag(word, "transitive_sports")) {
        tagMatched = "sports";
        particleType = "object";
    } else if (hasTag(word, "transitive_transportation")) {
        tagMatched = "transportation";
        particleType = "object";
    } else if (hasTag(word, "transitive_place")) {
        tagMatched = "place";
        particleType = "object";
    } else if (hasTag(word, "intransitive_motion")) {
        tagMatched = "place";
        particleType = "location";
    } else {
        particleType = "none";
    }

    if (particleType === "none") {
        return { text: stem, noun: null };
    }

    if (!noun) {
        let nounWords = getFilteredWords("Noun", tagMatched);
        if (tagMatched === "food" || tagMatched === "drink" || tagMatched === "place") {
            const domainWords = nounWords.filter(w => parseSemanticVector(w).domain);
            if (domainWords.length > 0) nounWords = domainWords;
        }
        if (nounWords.length === 0 && tagMatched === "sports") {
            nounWords = getFilteredWords("Noun", "activity");
        }
        if (nounWords.length === 0 && tagMatched === "object") {
            nounWords = getFilteredWords("Noun");
        }
        if (nounWords.length === 0) {
            nounWords = getWords("Noun", tagMatched);
            if (nounWords.length === 0) nounWords = getWords("Noun");
        }
        noun = getRandom(nounWords);
        if (noun) markUnitUsed(noun);
    }

    if (!noun) {
        return { text: stem, noun: null };
    }

    const nounKo = typeof noun === 'string' ? noun : noun[KoreanWord];
    let phrase = "";
    if (particleType === "object") {
        const p = hasBatchim(nounKo.slice(-1)) ? "을" : "를";
        phrase = `${nounKo}${p} ${stem}`;
    } else if (particleType === "dative") {
        phrase = `${nounKo}에게 ${stem}`;
    } else if (particleType === "location") {
        phrase = `${nounKo}에 ${stem}`;
    } else {
        phrase = stem;
    }

    return { text: phrase, noun };
}

function buildDescriptiveVerbPhrase(word, stem, chosenNoun = null) {
    const KoreanWord = DATA_SCHEMA.Korean;
    let noun = chosenNoun;
    let tagMatched = null;

    if (hasTag(word, "descriptive_food")) {
        tagMatched = "food";
    } else if (hasTag(word, "descriptive_person")) {
        tagMatched = "person";
    } else if (hasTag(word, "descriptive_place")) {
        tagMatched = "place";
    } else if (hasTag(word, "descriptive_general")) {
        tagMatched = "object";
    }

    if (!tagMatched) {
        return { text: stem, noun: null };
    }

    if (!noun) {
        let nouns = getFilteredWords("Noun", tagMatched);
        if (nouns.length === 0 && tagMatched === "object") {
            nouns = getFilteredWords("Noun");
        }
        if (nouns.length === 0) {
            nouns = getWords("Noun", tagMatched);
            if (nouns.length === 0) nouns = getWords("Noun");
        }
        noun = getRandom(nouns);
        if (noun) markUnitUsed(noun);
    }

    if (!noun) {
        return { text: stem, noun: null };
    }

    const nounKo = typeof noun === 'string' ? noun : noun[KoreanWord];
    const particle = hasBatchim(nounKo.slice(-1)) ? "이" : "가";
    return { text: `${nounKo}${particle} ${stem}`, noun };
}

function expandSemanticActionVerb(tokenType, currentContext, applyConstraint) {
    let words = getFilteredWords("Action Verb");

    if (applyConstraint && currentContext.req_domain) {
        const domainWords = words.filter(w => parseSemanticVector(w).domain === currentContext.req_domain);
        if (domainWords.length > 0) words = domainWords;
    }

    const svWords = words.filter(w => parseSemanticVector(w).domain);
    if (svWords.length > 0) words = svWords;

    const word = getRandom(words);
    if (!word) return { text: "N/A", verb: null, noun: null };

    markUnitUsed(word);
    const sv = parseSemanticVector(word);
    if (sv.prod) currentContext.produced_state = sv.prod;
    if (sv.polarity !== undefined) currentContext.polarity = sv.polarity;

    let stem = getConjugatedStem(word[DATA_SCHEMA.Korean], word[DATA_SCHEMA.Conjugation]);

    if (tokenType === "AVst") {
        return { text: stem, verb: word, noun: null };
    }
    const phrase = buildActionVerbPhrase(word, stem);
    return { text: phrase.text, verb: word, noun: phrase.noun };
}

function expandSemanticDescriptiveVerb(tokenType, currentContext, applyConstraint) {
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
    if (!word) return { text: "N/A", verb: null, noun: null };

    markUnitUsed(word);
    let stem = getConjugatedStem(word[DATA_SCHEMA.Korean], word[DATA_SCHEMA.Conjugation]);

    if (tokenType === "DVst") {
        return { text: stem, verb: word, noun: null };
    }
    const phrase = buildDescriptiveVerbPhrase(word, stem);
    return { text: phrase.text, verb: word, noun: phrase.noun };
}

function expandSemanticClause(depth, currentContext) {
    const KoreanWord = DATA_SCHEMA.Korean;
    const Conjugation = DATA_SCHEMA.Conjugation;

    let grammars = getFilteredWords("Grammar").filter(g => {
        const sv = parseSemanticVector(g);
        return hasTag(g, "declarative") && (sv.logic === "declarative" || g[KoreanWord].includes("아요") || g[KoreanWord].includes("습니다"));
    });
    if (grammars.length === 0) {
        grammars = getFilteredWords("Grammar").filter(g => hasTag(g, "declarative"));
    }
    if (grammars.length === 0) {
        grammars = getFilteredWords("Grammar");
    }
    const grammar = getRandom(grammars);

    if (grammar) {
        markUnitUsed(grammar);
        const formula = getRandom(grammar[Conjugation]);
        const sub = generateSemanticSentence(formula, depth + 1, currentContext);
        return { text: sub.ko, tree: sub.tree };
    }
    return { text: "좋아요", tree: "좋아요" };
}

function expandSemanticTerminal(tokenType, tag, currentContext, applyConstraint) {
    let posToFetch = "Noun";
    if (tokenType === "Number") posToFetch = "Number";
    else if (tokenType === "Adv") posToFetch = "Adverb";
    else if (tokenType === "Exclamation") posToFetch = "Exclamation";

    let words = getFilteredWords(posToFetch, tag);

    if (applyConstraint && currentContext.logic === "cause_effect" && currentContext.produced_state) {
        const domainWords = words.filter(w => parseSemanticVector(w).domain);
        if (domainWords.length > 0) words = domainWords;
    }

    if (words.length > 0) {
        const chosen = getRandom(words);
        if (chosen) {
            markUnitUsed(chosen);
            return { text: chosen[DATA_SCHEMA.Korean], unit: chosen };
        }
    }
    return { text: "N/A", unit: null };
}

function generateSemanticSentence(templateOrUnit, depth = 0, incomingContext = {}) {
    if (depth > 2) return { ko: "좋아요", context: {}, tree: "좋아요" };

    let template = "";
    let grammarId = null;

    if (typeof templateOrUnit === 'number') {
        const units = typeof KR_EN_languageUnits !== 'undefined' ? KR_EN_languageUnits : dataModule.KR_EN_languageUnits;
        const gu = units ? units[templateOrUnit] : null;
        if (gu) {
            grammarId = gu[DATA_SCHEMA.Id];
            template = getRandom(gu[DATA_SCHEMA.Conjugation]) || "";
        } else {
            template = String(templateOrUnit);
            grammarId = template;
        }
    } else if (Array.isArray(templateOrUnit) && typeof templateOrUnit[DATA_SCHEMA.Id] === 'number') {
        grammarId = templateOrUnit[DATA_SCHEMA.Id];
        template = getRandom(templateOrUnit[DATA_SCHEMA.Conjugation]) || "";
    } else if (typeof templateOrUnit === 'string') {
        template = templateOrUnit;
        const match = findGrammarUnitForTemplate(template);
        if (match && match.grammarUnit) {
            const gu = match.grammarUnit;
            const formulas = gu[DATA_SCHEMA.Conjugation] || [];
            if (formulas.length > 1 && match.formulaIndex > 0) {
                const sigs = formulas.map(f => (f.match(/\{[^}]+\}/g) || []).join(','));
                if (sigs[match.formulaIndex] === sigs[0]) {
                    grammarId = template;
                } else {
                    grammarId = gu[DATA_SCHEMA.Id];
                }
            } else {
                grammarId = gu[DATA_SCHEMA.Id];
            }
        } else {
            grammarId = template;
        }
    } else {
        template = String(templateOrUnit);
        grammarId = template;
    }

    let koResult = template;
    let currentContext = { ...incomingContext };
    const childrenTree = [];

    const tokenRegex = /\{([^}:]+)(?::([^}]+))?\}/g;
    let match;

    while ((match = tokenRegex.exec(koResult)) !== null) {
        const token = match[0];
        const tokenType = match[1];
        const tag = match[2];

        const applyConstraint = shouldApplySemanticConstraint(currentContext);

        let replacementKo = "";
        let childNode = null;

        if (tokenType === "VP_AVst" || tokenType === "AVst") {
            const exp = expandSemanticActionVerb(tokenType, currentContext, applyConstraint);
            replacementKo = exp.text;
            if (exp.verb) {
                if (exp.noun) {
                    const nounId = typeof exp.noun[DATA_SCHEMA.Id] === 'number' ? exp.noun[DATA_SCHEMA.Id] : exp.noun[DATA_SCHEMA.Korean];
                    childNode = [exp.verb[DATA_SCHEMA.Id], nounId];
                } else {
                    childNode = exp.verb[DATA_SCHEMA.Id];
                }
            } else {
                childNode = replacementKo;
            }
        } else if (tokenType === "VP_DVst" || tokenType === "DVst") {
            const exp = expandSemanticDescriptiveVerb(tokenType, currentContext, applyConstraint);
            replacementKo = exp.text;
            if (exp.verb) {
                if (exp.noun) {
                    const nounId = typeof exp.noun[DATA_SCHEMA.Id] === 'number' ? exp.noun[DATA_SCHEMA.Id] : exp.noun[DATA_SCHEMA.Korean];
                    childNode = [exp.verb[DATA_SCHEMA.Id], nounId];
                } else {
                    childNode = exp.verb[DATA_SCHEMA.Id];
                }
            } else {
                childNode = replacementKo;
            }
        } else if (tokenType === "Clause" || tokenType === "VP") {
            const exp = expandSemanticClause(depth, currentContext);
            replacementKo = exp.text;
            childNode = exp.tree;
        } else {
            const exp = expandSemanticTerminal(tokenType, tag, currentContext, applyConstraint);
            replacementKo = exp.text;
            childNode = exp.unit ? exp.unit[DATA_SCHEMA.Id] : replacementKo;
        }

        childrenTree.push(childNode);
        koResult = koResult.replace(token, replacementKo || "N/A");
        tokenRegex.lastIndex = 0;
    }

    const tree = [grammarId, ...childrenTree];
    return { ko: koResult, context: currentContext, tree };
}

function reconstructFromLanguageUnitTree(tree) {
    if (tree === null || tree === undefined) return "";
    if (typeof tree === 'string') return tree;
    if (typeof tree === 'number') {
        const units = typeof KR_EN_languageUnits !== 'undefined' ? KR_EN_languageUnits : dataModule.KR_EN_languageUnits;
        const u = units ? units[tree] : null;
        return u ? u[DATA_SCHEMA.Korean] : String(tree);
    }
    if (!Array.isArray(tree) || tree.length === 0) return "";

    const units = typeof KR_EN_languageUnits !== 'undefined' ? KR_EN_languageUnits : dataModule.KR_EN_languageUnits;
    const grammarRef = tree[0];
    const children = tree.slice(1);

    let template = "";
    let grammarUnit = null;

    if (typeof grammarRef === 'number') {
        grammarUnit = units ? units[grammarRef] : null;
        if (grammarUnit && Array.isArray(grammarUnit[DATA_SCHEMA.Conjugation])) {
            const formulas = grammarUnit[DATA_SCHEMA.Conjugation];
            if (formulas.length === 1) {
                template = formulas[0];
            } else {
                // Determine which formula matches the children based on first child's part of speech
                const firstChild = children[0];
                let isActionVerb = false;
                let isDescriptiveVerb = false;

                if (typeof firstChild === 'number') {
                    const u = units ? units[firstChild] : null;
                    if (u) {
                        isActionVerb = u[DATA_SCHEMA.PartofSpeech] === 'Action Verb';
                        isDescriptiveVerb = u[DATA_SCHEMA.PartofSpeech] === 'Descriptive Verb';
                    }
                } else if (Array.isArray(firstChild) && typeof firstChild[0] === 'number') {
                    const u = units ? units[firstChild[0]] : null;
                    if (u) {
                        isActionVerb = u[DATA_SCHEMA.PartofSpeech] === 'Action Verb';
                        isDescriptiveVerb = u[DATA_SCHEMA.PartofSpeech] === 'Descriptive Verb';
                    }
                }

                if (isActionVerb) {
                    template = formulas.find(f => f.includes('AVst')) || formulas[0];
                } else if (isDescriptiveVerb) {
                    template = formulas.find(f => f.includes('DVst')) || formulas[0];
                } else {
                    template = formulas[0];
                }
            }
        } else {
            template = String(grammarRef);
        }
    } else if (typeof grammarRef === 'string') {
        template = grammarRef;
    } else {
        template = String(grammarRef);
    }

    let koResult = template;
    const tokenRegex = /\{([^}:]+)(?::([^}]+))?\}/g;
    let match;
    let childIndex = 0;

    while ((match = tokenRegex.exec(koResult)) !== null) {
        const token = match[0];
        const tokenType = match[1];
        const child = children[childIndex++];

        let replacement = "";
        if (tokenType === "VP_AVst" || tokenType === "AVst") {
            let verbId = null;
            let nounId = null;
            if (Array.isArray(child)) {
                verbId = child[0];
                nounId = child.length > 1 ? child[1] : null;
            } else if (typeof child === 'number') {
                verbId = child;
            }

            const verb = (verbId !== null && units) ? units[verbId] : null;
            const noun = (nounId !== null && units && typeof nounId === 'number') ? units[nounId] : (typeof nounId === 'string' ? nounId : null);

            if (verb) {
                let stem = getStem(verb[DATA_SCHEMA.Korean]);
                if (verb[DATA_SCHEMA.Conjugation] && verb[DATA_SCHEMA.Conjugation] !== "regular" && verb[DATA_SCHEMA.Conjugation] !== "") {
                    stem += `[${verb[DATA_SCHEMA.Conjugation]}]`;
                }
                if (tokenType === "AVst") {
                    replacement = stem;
                } else {
                    const phrase = buildActionVerbPhrase(verb, stem, noun);
                    replacement = phrase.text;
                }
            } else {
                replacement = typeof child === 'string' ? child : "N/A";
            }
        } else if (tokenType === "VP_DVst" || tokenType === "DVst") {
            let verbId = null;
            let nounId = null;
            if (Array.isArray(child)) {
                verbId = child[0];
                nounId = child.length > 1 ? child[1] : null;
            } else if (typeof child === 'number') {
                verbId = child;
            }

            const verb = (verbId !== null && units) ? units[verbId] : null;
            const noun = (nounId !== null && units && typeof nounId === 'number') ? units[nounId] : (typeof nounId === 'string' ? nounId : null);

            if (verb) {
                let stem = getStem(verb[DATA_SCHEMA.Korean]);
                if (verb[DATA_SCHEMA.Conjugation] && verb[DATA_SCHEMA.Conjugation] !== "regular" && verb[DATA_SCHEMA.Conjugation] !== "") {
                    stem += `[${verb[DATA_SCHEMA.Conjugation]}]`;
                }
                if (tokenType === "DVst") {
                    replacement = stem;
                } else {
                    const phrase = buildDescriptiveVerbPhrase(verb, stem, noun);
                    replacement = phrase.text;
                }
            } else {
                replacement = typeof child === 'string' ? child : "N/A";
            }
        } else if (tokenType === "Clause" || tokenType === "VP") {
            replacement = reconstructFromLanguageUnitTree(child);
        } else {
            // Terminal (Noun, Number, Adv, Exclamation)
            if (typeof child === 'number' && units && units[child]) {
                replacement = units[child][DATA_SCHEMA.Korean];
            } else if (Array.isArray(child) && child.length === 1 && typeof child[0] === 'number' && units && units[child[0]]) {
                replacement = units[child[0]][DATA_SCHEMA.Korean];
            } else {
                replacement = String(child || "N/A");
            }
        }

        koResult = koResult.replace(token, replacement || "N/A");
        tokenRegex.lastIndex = 0;
    }

    return koResult;
}

function flattenLanguageUnitTree(tree) {
    const ids = new Set();

    function traverse(node) {
        if (node === null || node === undefined) return;
        if (typeof node === 'number') {
            ids.add(node);
            return;
        }
        if (typeof node === 'string') {
            const match = findGrammarUnitForTemplate(node);
            if (match && match.grammarUnit && typeof match.grammarUnit[DATA_SCHEMA.Id] === 'number') {
                ids.add(match.grammarUnit[DATA_SCHEMA.Id]);
            }
            return;
        }
        if (Array.isArray(node)) {
            // If it's a Language Unit itself (has DATA_SCHEMA fields)
            if (typeof node[DATA_SCHEMA.Id] === 'number') {
                ids.add(node[DATA_SCHEMA.Id]);
                return;
            }
            for (let item of node) {
                traverse(item);
            }
            return;
        }
        if (typeof node === 'object' && typeof node.Id === 'number') {
            ids.add(node.Id);
            return;
        }
    }

    traverse(tree);
    return Array.from(ids).sort((a, b) => a - b);
}

function encodeLanguageUnitIds(idsOrTree) {
    let ids = [];
    if (Array.isArray(idsOrTree) && idsOrTree.some(x => Array.isArray(x) || typeof x === 'string')) {
        ids = flattenLanguageUnitTree(idsOrTree);
    } else if (Array.isArray(idsOrTree)) {
        ids = Array.from(new Set(idsOrTree)).filter(x => typeof x === 'number').sort((a, b) => a - b);
    } else if (typeof idsOrTree === 'number') {
        ids = [idsOrTree];
    }

    const u16 = new Uint16Array(ids);
    const bytes = new Uint8Array(u16.buffer, u16.byteOffset, u16.byteLength);

    if (typeof Buffer !== 'undefined') {
        return Buffer.from(bytes).toString('base64url');
    }
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeLanguageUnitIds(token) {
    if (!token || typeof token !== 'string') return [];
    let b64 = token.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';

    let bytes;
    if (typeof Buffer !== 'undefined') {
        bytes = new Uint8Array(Buffer.from(b64, 'base64'));
    } else {
        const binary = atob(b64);
        bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    }

    const count = Math.floor(bytes.byteLength / 2);
    const u16 = new Uint16Array(bytes.buffer, bytes.byteOffset, count);
    return Array.from(u16);
}

function hasBatchim(char) {
  const code = char.charCodeAt(0) - 44032;
  if (code < 0 || code > 11171) return false;
  return code % 28 !== 0;
}

function getStem(baseForm) {
  return baseForm.replace(/다$/, '');
}

function getVowelHarmony(char) {
    if (char === '하') return '여'; // Special case for 하 -> 하여 -> 해
    const code = char.charCodeAt(0) - 44032;
    if (code < 0 || code > 11171) return '어'; // Fallback
    const medial = Math.floor(code / 28) % 21;
    // 0: ㅏ, 2: ㅑ, 8: ㅗ
    if (medial === 0 || medial === 2 || medial === 8) {
        return '아';
    }
    return '어';
}

function applyMorphology(text) {
    let resolvedKo = text;
    
    // Irregular Verbs Handling
    // 1. b_irregular + 으 -> 우
    resolvedKo = resolvedKo.replace(/([가-힣])\[b_irregular\]으\/(니까|면|면서|러|려고|세|시|셔|십|ㄹ|ㄴ)/g, (match, prevChar, suffix) => {
        // Drop ㅂ (jongseong 17) -> add 우
        const stemNoB = String.fromCharCode(prevChar.charCodeAt(0) - 17);
        if (suffix === 'ㄴ') return stemNoB + '운';
        if (suffix === 'ㄹ') return stemNoB + '울';
        return stemNoB + '우' + suffix;
    });

    // 2. b_irregular + 아/어 -> 워
    resolvedKo = resolvedKo.replace(/([가-힣])\[b_irregular\](아\/어|았\/었)(요|서|어|도|야|)/g, (match, prevChar, harmonyMarker, suffix) => {
        const stemNoB = String.fromCharCode(prevChar.charCodeAt(0) - 17);
        let added = harmonyMarker === "았/었" ? "웠" : "워";
        if (prevChar === '돕' || prevChar === '곱') {
            added = harmonyMarker === "았/었" ? "왔" : "와";
        }
        return stemNoB + added + suffix;
    });

    // 3. l_irregular (ㄹ drops before ㄴ, ㅂ, ㅅ; doesn't drop before ㅁ, ㄹ, but 으 drops)
    // e.g., 살다 + 으/니까 -> 사니까, 살다 + 으/면 -> 살면, 열다 + 으/면서 -> 열면서
    resolvedKo = resolvedKo.replace(/([가-힣])\[l_irregular\]으\/(니까|면|면서|러|려고|세|시|셔|십|ㄹ|ㄴ)/g, (match, prevChar, suffix) => {
        if (suffix === 'ㄴ') return String.fromCharCode(prevChar.charCodeAt(0) - 8 + 4); // drop ㄹ, add ㄴ
        if (suffix === 'ㄹ') return prevChar; // ㄹ stays ㄹ
        if (suffix === '면' || suffix === '면서' || suffix === '러' || suffix === '려고') {
            // ㄹ does NOT drop, but 으 drops
            return prevChar + suffix;
        }
        const stemNoL = String.fromCharCode(prevChar.charCodeAt(0) - 8);
        return stemNoL + suffix;
    });

    // ㄹ drops before 는
    resolvedKo = resolvedKo.replace(/([가-힣])\[l_irregular\]는/g, (match, prevChar) => {
        const stemNoL = String.fromCharCode(prevChar.charCodeAt(0) - 8);
        return stemNoL + '는';
    });
    
    // ㄹ + 습니다 -> ㅂ니다
    resolvedKo = resolvedKo.replace(/([가-힣])\[l_irregular\]습니다\/ㅂ니다/g, (match, prevChar) => {
        const stemNoL = String.fromCharCode(prevChar.charCodeAt(0) - 8);
        const stemWithB = String.fromCharCode(stemNoL.charCodeAt(0) + 17); // Add ㅂ batchim
        return stemWithB + "니다";
    });

    // 4. d_irregular (ㄷ -> ㄹ before vowels 으 and 아/어)
    resolvedKo = resolvedKo.replace(/([가-힣])\[d_irregular\]으\/(니까|면|면서|러|려고|세|시|셔|십|ㄹ|ㄴ)/g, (match, prevChar, suffix) => {
        // Change ㄷ (jongseong 7) to ㄹ (jongseong 8)
        const stemWithL = String.fromCharCode(prevChar.charCodeAt(0) + 1);
        if (suffix === 'ㄴ') return stemWithL + '은';
        if (suffix === 'ㄹ') return stemWithL + '을';
        return stemWithL + '으' + suffix;
    });

    resolvedKo = resolvedKo.replace(/([가-힣])\[d_irregular\](아\/어|았\/었)(요|서|어|도|야|)/g, (match, prevChar, harmonyMarker, suffix) => {
        // Change ㄷ (jongseong 7) to ㄹ (jongseong 8)
        const stemWithL = String.fromCharCode(prevChar.charCodeAt(0) + 1);
        return stemWithL + harmonyMarker + suffix; // harmony is resolved later
    });

    // 5. eu_irregular (drop 으, use previous vowel for harmony)
    resolvedKo = resolvedKo.replace(/([가-힣])\[eu_irregular\](아\/어|았\/었)(요|서|어|도|야|)/g, (match, prevChar, harmonyMarker, suffix) => {
        const idx = resolvedKo.indexOf(match);
        let harmonyVowel = '어';
        if (idx > 0) {
            harmonyVowel = getVowelHarmony(resolvedKo[idx - 1]);
        }
        
        const code = prevChar.charCodeAt(0) - 44032;
        const initial = Math.floor(code / 588);
        
        let newMedial = harmonyVowel === '아' ? 0 : 4;
        let newJongseong = harmonyMarker === "았/었" ? 20 : 0;
        
        const newChar = String.fromCharCode(44032 + (initial * 588) + (newMedial * 28) + newJongseong);
        return newChar + suffix;
    });

    // 6. reu_irregular (르 drops, previous gets ㄹ batchim, 르 becomes 라/러)
    resolvedKo = resolvedKo.replace(/([가-힣])르\[reu_irregular\](아\/어|았\/었)(요|서|어|도|야|)/g, (match, preReu, harmonyMarker, suffix) => {
        // Add ㄹ batchim (8) to preReu
        const stemWithL = String.fromCharCode(preReu.charCodeAt(0) + 8);
        
        const harmonyVowel = getVowelHarmony(preReu);
        let newReuMedial = harmonyVowel === '아' ? 0 : 4; // ㅏ(0) or ㅓ(4)
        let newReuJongseong = harmonyMarker === "았/었" ? 20 : 0; // ㅆ(20)
        
        // 5 is initial ㄹ. 5 * 588 = 2940.
        const newReuBlock = String.fromCharCode(44032 + 2940 + (newReuMedial * 28) + newReuJongseong);
        
        return stemWithL + newReuBlock + suffix;
    });

    // 7. h_irregular (ㅎ drops before vowels; 으 drops; 아/어 blends into ㅐ/였)
    // h_irregular + 으/(니까|면|면서|러|려고|세|시|셔|십|ㄹ|ㄴ)
    resolvedKo = resolvedKo.replace(/([가-힣])\[h_irregular\]으\/(니까|면|면서|러|려고|세|시|셔|십|ㄹ|ㄴ)/g, (match, prevChar, suffix) => {
        // Drop ㅎ (jongseong 27)
        const stemNoH = String.fromCharCode(prevChar.charCodeAt(0) - 27);
        if (suffix === 'ㄴ') return String.fromCharCode(stemNoH.charCodeAt(0) + 4); // add ㄴ
        if (suffix === 'ㄹ') return String.fromCharCode(stemNoH.charCodeAt(0) + 8); // add ㄹ
        return stemNoH + suffix;
    });

    // h_irregular + (아/어|았/었) -> vowel changes to ㅐ (medial 1), plus ㅆ if past
    resolvedKo = resolvedKo.replace(/([가-힣])\[h_irregular\](아\/어|았\/었)(요|서|어|도|야|)/g, (match, prevChar, harmonyMarker, suffix) => {
        const code = prevChar.charCodeAt(0) - 44032;
        const initial = Math.floor(code / 588);
        const newMedial = 1; // ㅐ
        const newJongseong = harmonyMarker === "았/었" ? 20 : 0; // ㅆ
        const newChar = String.fromCharCode(44032 + (initial * 588) + (newMedial * 28) + newJongseong);
        return newChar + suffix;
    });

    // Strip leftover conjugation markers that didn't trigger an irregular change (or are unimplemented)
    resolvedKo = resolvedKo.replace(/\[[a-z_]+\]/g, '');

    // Resolve particles based on previous character's batchim
    resolvedKo = resolvedKo.replace(/([가-힣])(이\/가|은\/는|을\/를|\(이\)랑)/g, (match, prevChar, particleStr) => {
        const hasB = hasBatchim(prevChar);
        if (particleStr === "이/가") return prevChar + (hasB ? "이" : "가");
        if (particleStr === "은/는") return prevChar + (hasB ? "은" : "는");
        if (particleStr === "을/를") return prevChar + (hasB ? "을" : "를");
        if (particleStr === "(이)랑") return prevChar + (hasB ? "이랑" : "랑");
        return match;
    });

    // Resolve contracted pronouns and irregular pronoun-particle combinations
    resolvedKo = resolvedKo.replace(/누가가/g, '누가');
    resolvedKo = resolvedKo.replace(/누가를/g, '누구를');
    resolvedKo = resolvedKo.replace(/누가에게/g, '누구에게');
    resolvedKo = resolvedKo.replace(/누가는/g, '누구는');
    resolvedKo = resolvedKo.replace(/누가도/g, '누구도');
    resolvedKo = resolvedKo.replace(/뭘을/g, '뭘');
    resolvedKo = resolvedKo.replace(/(^|[^가-힣])저가([^가-힣]|$)/g, (m, p1, p2) => p1 + '제가' + p2);
    resolvedKo = resolvedKo.replace(/(^|[^가-힣])누구가([^가-힣]|$)/g, (m, p1, p2) => p1 + '누가' + p2);
    
    // Resolve 이/예요 based on batchim
    resolvedKo = resolvedKo.replace(/([가-힣])이\/예요/g, (match, prevChar) => {
        if (hasBatchim(prevChar)) {
            return prevChar + '이에요';
        } else {
            return prevChar + '예요';
        }
    });

    // Resolve 습니다/ㅂ니다 based on previous character's batchim
    resolvedKo = resolvedKo.replace(/([가-힣])(습니다\/ㅂ니다|습니다|ㅂ니다)/g, (match, prevChar, ending) => {
        if (ending === "습니다/ㅂ니다") {
            const code = prevChar.charCodeAt(0) - 44032;
            if (hasBatchim(prevChar)) {
                // If ㄹ batchim, drop ㄹ and add ㅂ니다
                if (code % 28 === 8) {
                    const stemNoL = String.fromCharCode(prevChar.charCodeAt(0) - 8);
                    const stemWithB = String.fromCharCode(stemNoL.charCodeAt(0) + 17);
                    return stemWithB + "니다";
                }
                return prevChar + "습니다";
            }
            // Merge ㅂ batchim (offset 17 in jongseong)
            return String.fromCharCode(prevChar.charCodeAt(0) + 17) + "니다"; 
        }
        return match;
    });

    // Resolve 아/어/았/었 vowel harmony
    resolvedKo = resolvedKo.replace(/([가-힣])(아\/어|았\/었)(요|서|어|도|야|)/g, (match, prevChar, harmonyMarker, suffix) => {
        const harmonyVowel = getVowelHarmony(prevChar);
        if (harmonyMarker === "았/었") {
            if (harmonyVowel === '여') return prevChar + '였' + suffix;
            return prevChar + (harmonyVowel === '아' ? '았' : '었') + suffix;
        }
        return prevChar + harmonyVowel + suffix;
    });

    // Resolve 으 insertion (e.g., 으/니까, 으/면, 으/세요) based on batchim
    resolvedKo = resolvedKo.replace(/([가-힣])으\/(니까|면|러|려고|세|시|셔|십)/g, (match, prevChar, suffix) => {
        const code = prevChar.charCodeAt(0) - 44032;
        if (hasBatchim(prevChar)) {
            // ㄹ batchim doesn't take 으.
            if (code % 28 === 8) {
                return prevChar + suffix;
            }
            return prevChar + '으' + suffix;
        } else {
            return prevChar + suffix;
        }
    });

    // Resolve 으/ㄹ (e.g., 으/ㄹ 거예요)
    resolvedKo = resolvedKo.replace(/([가-힣])으\/ㄹ/g, (match, prevChar) => {
        const code = prevChar.charCodeAt(0) - 44032;
        if (hasBatchim(prevChar)) {
            if (code % 28 === 8) { // ㄹ batchim
                return prevChar;
            }
            return prevChar + '을';
        } else {
            // Add ㄹ (jongseong 8) to prevChar
            return String.fromCharCode(prevChar.charCodeAt(0) + 8);
        }
    });
    
    // Resolve 으/ㄴ (e.g., 으/ㄴ데)
    resolvedKo = resolvedKo.replace(/([가-힣])으\/ㄴ/g, (match, prevChar) => {
        const code = prevChar.charCodeAt(0) - 44032;
        if (hasBatchim(prevChar)) {
            if (code % 28 === 8) { // ㄹ batchim drops ㄹ and adds ㄴ
                return String.fromCharCode(prevChar.charCodeAt(0) - 8 + 4);
            }
            return prevChar + '은';
        } else {
            // Add ㄴ (jongseong 4) to prevChar
            return String.fromCharCode(prevChar.charCodeAt(0) + 4);
        }
    });

    // Basic Vowel Contractions
    // Generic 아 + 아 = 아, ㅗ + 아 = ㅘ
    resolvedKo = resolvedKo.replace(/([가-힣])아(요|서|도|야|)/g, (match, prevChar, suffix) => {
        const code = prevChar.charCodeAt(0) - 44032;
        if (code >= 0) {
            const medial = Math.floor(code / 28) % 21;
            const jongseong = code % 28;
            if (medial === 0 && jongseong === 0) { // 'ㅏ' vowel, no batchim (가 + 아요 -> 가요, 가 + 아도 -> 가도)
                return prevChar + suffix;
            }
            if (medial === 8 && jongseong === 0) { // 'ㅗ' vowel, no batchim (보 + 아요 -> 봐요, 보 + 아도 -> 봐도)
                const initial = Math.floor(code / 588);
                return String.fromCharCode(44032 + (initial * 588) + (9 * 28) + 0) + suffix;
            }
        }
        return match;
    });
    
    // Generic 아 + 았 = 았, ㅗ + 았 = 왔
    resolvedKo = resolvedKo.replace(/([가-힣])았(어요|어)/g, (match, prevChar, suffix) => {
        const code = prevChar.charCodeAt(0) - 44032;
        if (code >= 0) {
            const medial = Math.floor(code / 28) % 21;
            const jongseong = code % 28;
            if (medial === 0 && jongseong === 0) { // 'ㅏ' vowel, no batchim (가 + 았어요 -> 갔어요)
                const initial = Math.floor(code / 588);
                const newChar = String.fromCharCode(44032 + (initial * 588) + (0 * 28) + 20); // 0 is 'ㅏ', 20 is 'ㅆ'
                return newChar + suffix;
            }
            if (medial === 8 && jongseong === 0) { // 'ㅗ' vowel, no batchim (보 + 았어요 -> 봤어요)
                const initial = Math.floor(code / 588);
                const newChar = String.fromCharCode(44032 + (initial * 588) + (9 * 28) + 20); // 9 is 'ㅘ', 20 is 'ㅆ'
                return newChar + suffix;
            }
        }
        return match;
    });

    resolvedKo = resolvedKo.replace(/오아(요|서|도|야)/g, (m, s) => "와" + s);
    resolvedKo = resolvedKo.replace(/오았어요/g, "왔어요");
    resolvedKo = resolvedKo.replace(/하여(요|서|도|야)/g, (m, s) => "해" + s);
    resolvedKo = resolvedKo.replace(/하였어요/g, "했어요");
    resolvedKo = resolvedKo.replace(/마시(아|어)(요|서|도|야)/g, (m, v, s) => "마셔" + s);
    resolvedKo = resolvedKo.replace(/크(아|어)(요|서|도|야)/g, (m, v, s) => "커" + s);
    resolvedKo = resolvedKo.replace(/이어요/g, "이에요");

    // Generic 이 + 어 = 여 and ㅜ + 어 = 워 contraction
    resolvedKo = resolvedKo.replace(/([가-힣])어(요|서|도|야)/g, (match, prevChar, suffix) => {
        const code = prevChar.charCodeAt(0) - 44032;
        if (code >= 0) {
            const medial = Math.floor(code / 28) % 21;
            const jongseong = code % 28;
            if (medial === 20 && jongseong === 0) { // 'ㅣ' vowel, no batchim (기다리 + 어요 -> 기다려요, 마시 + 어도 -> 마셔도)
                const initial = Math.floor(code / 588);
                const newChar = String.fromCharCode(44032 + (initial * 588) + (6 * 28) + 0); // 6 is 'ㅕ'
                return newChar + suffix;
            }
            if (medial === 13 && jongseong === 0) { // 'ㅜ' vowel, no batchim (배우 + 어요 -> 배워요, 배우 + 어도 -> 배워도)
                const initial = Math.floor(code / 588);
                const newChar = String.fromCharCode(44032 + (initial * 588) + (14 * 28) + 0); // 14 is 'ㅝ'
                return newChar + suffix;
            }
        }
        return match;
    });
    
    // Generic 이 + 었 = 였 and ㅜ + 었 = 웠 contraction
    resolvedKo = resolvedKo.replace(/([가-힣])었(어요|어)/g, (match, prevChar, suffix) => {
        const code = prevChar.charCodeAt(0) - 44032;
        if (code >= 0) {
            const medial = Math.floor(code / 28) % 21;
            const jongseong = code % 28;
            if (medial === 20 && jongseong === 0) { // 'ㅣ' vowel, no batchim (기다리 + 었어요 -> 기다렸어요)
                const initial = Math.floor(code / 588);
                const newChar = String.fromCharCode(44032 + (initial * 588) + (6 * 28) + 20); // 6 is 'ㅕ', 20 is 'ㅆ'
                return newChar + suffix;
            }
            if (medial === 13 && jongseong === 0) { // 'ㅜ' vowel, no batchim (배우 + 었어요 -> 배웠어요)
                const initial = Math.floor(code / 588);
                const newChar = String.fromCharCode(44032 + (initial * 588) + (14 * 28) + 20); // 14 is 'ㅝ', 20 is 'ㅆ'
                return newChar + suffix;
            }
        }
        return match;
    });

    return resolvedKo;
}

// Support both Node.js (for scripts) and Browser (for the app)
const exportedMembers = { 
    hasBatchim, 
    getStem, 
    applyMorphology, 
    getFilteredWords, 
    setCurrentUsageFilter, 
    getTokenOptions, 
    generateTemplateOptions, 
    generateTemplateTokenOptions,
    getTotalOptionsCut,
    resetTotalOptionsCut,
    markUnitUsed,
    getUsedUnitIds,
    resetUsedUnits,
    hasTag,
    getRandom,
    parseSemanticVector,
    SemanticConfig,
    shouldApplySemanticConstraint,
    findGrammarUnitForTemplate,
    buildActionVerbPhrase,
    buildDescriptiveVerbPhrase,
    expandSemanticActionVerb,
    expandSemanticDescriptiveVerb,
    expandSemanticClause,
    expandSemanticTerminal,
    generateSemanticSentence,
    reconstructFromLanguageUnitTree,
    flattenLanguageUnitTree,
    encodeLanguageUnitIds,
    decodeLanguageUnitIds
};

if (typeof window !== 'undefined') {
    Object.assign(window, exportedMembers);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportedMembers;
}
