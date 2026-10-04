const { getWords, DATA_SCHEMA } = require('./data.js');
const { applyMorphology, hasBatchim, getStem } = require('./korean.js');

function getRandom(arr) {
	if (arr.length === 0) return null;
	return arr[Math.floor(Math.random() * arr.length)];
}

function parseSemanticVector(unit) {
	if (!unit) return {};
	const sv = unit[DATA_SCHEMA.SemanticVector];
	if (sv) return JSON.parse(sv);
	return {};
}

const SemanticConfig = {
	globalStrictness: 0.5, // 0.0 = total random novelty, 1.0 = strict semantic adherence
	grammarOverrides: {
		"contrast": 1.0, // But/However requires strict polarity mismatch
		"condition": 0.3 // "If" statements can be highly absurd/creative
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

		// Determine the active strictness for this token expansion
		let activeStrictness = SemanticConfig.globalStrictness;
		if (currentContext.logic && SemanticConfig.grammarOverrides[currentContext.logic] !== undefined) {
			activeStrictness = SemanticConfig.grammarOverrides[currentContext.logic];
		}
		const applyConstraint = Math.random() < activeStrictness;

		let replacementKo = "";
		if (tokenType === "VP_AVst" || tokenType === "AVst") {
			let words = getWords("Action Verb");

			if (applyConstraint && currentContext.req_domain) {
				words = words.filter(w => {
					let sv = parseSemanticVector(w);
					return sv.domain === currentContext.req_domain;
				});
			}

			// Force devtest only
			words = words.filter(w => parseSemanticVector(w).domain);

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
				if (tags.includes("transitive_food") || tags.includes("transitive_drink")) {
					let nounWords = getWords("Noun", tags.includes("transitive_food") ? "food" : "drink");
					nounWords = nounWords.filter(w => parseSemanticVector(w).domain);
					const obj = getRandom(nounWords) || ["무엇"];
					const particle = hasBatchim(obj[KoreanWord].slice(-1)) ? "을" : "를";
					replacementKo = `${obj[KoreanWord]}${particle} ${stem}`;
				} else if (tags.includes("intransitive_motion")) {
					let placeWords = getWords("Noun", "place").filter(w => parseSemanticVector(w).domain);
					const place = getRandom(placeWords) || ["어디"];
					replacementKo = `${place[KoreanWord]}에 ${stem}`;
				} else {
					replacementKo = stem;
				}
			}
		}
		else if (tokenType === "VP_DVst" || tokenType === "DVst") {
			let words = getWords("Descriptive Verb");

			// Apply logic
			if (applyConstraint && currentContext.logic === "cause_effect") {
				words = words.filter(w => {
					let sv = parseSemanticVector(w);
					let matchesPolarity = (sv.polarity === currentContext.polarity);
					let matchesProduced = (sv.req === currentContext.produced_state || sv.req === "any" || sv.domain === "state");
					return matchesPolarity && matchesProduced;
				});
			} else if (applyConstraint && currentContext.logic === "contrast") {
				words = words.filter(w => {
					let sv = parseSemanticVector(w);
					// Contrast requires opposite polarity!
					let matchesPolarity = (sv.polarity !== currentContext.polarity && sv.polarity !== 0);
					return matchesPolarity;
				});
			}

			words = words.filter(w => parseSemanticVector(w).domain);

			const word = getRandom(words);
			if (!word) {
				replacementKo = "N/A";
			} else {
				let stem = getStem(word[KoreanWord]);
				if (word[Conjugation] && word[Conjugation] !== "regular" && word[Conjugation] !== "") stem += `[${word[Conjugation]}]`;
				replacementKo = stem;
			}
		}
		else if (tokenType === "Clause" || tokenType === "VP") {
			let grammars = getWords("Grammar").filter(g => g[Tags].includes("declarative"));
			grammars = grammars.filter(g => parseSemanticVector(g).logic); // force devtest grammar
			const grammar = getRandom(grammars);

			if (grammar) {
				const formula = getRandom(grammar[Conjugation]);
				const sub = generateSemanticSentence(formula, depth + 1, currentContext);
				replacementKo = sub.ko;
			} else {
				replacementKo = "N/A";
			}
		}
		else {
			// Fallback for Noun, Adv, etc.
			let words = getWords(tokenType === "N" ? "Noun" : "Adverb", tag);

			// Constrain Nouns if logic demands it (e.g., if identifying something produced by the action)
			if (applyConstraint && currentContext.logic === "cause_effect" && currentContext.produced_state) {
				// Ensure noun matches domain
				words = words.filter(w => parseSemanticVector(w).domain);
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

console.log("=== Semantic Vector Context Test ===\n");

const tests = [
	{ name: "Because A, B", template: "{VP_AVst}으/니까 {Clause}", context: { logic: "cause_effect", polarity_match: true } },
	{ name: "But A, B", template: "{VP_AVst}는데 {Clause}", context: { logic: "contrast", polarity_match: false } },
	{ name: "If A, B", template: "{VP_AVst}으/면 {Clause}", context: { logic: "condition" } }
];

for (const t of tests) {
	console.log(`\nTesting: ${t.name} (${t.template})`);
	for (let i = 0; i < 5; i++) {
		const result = generateSemanticSentence(t.template, 0, t.context);
		console.log(`  Result: ${applyMorphology(result.ko)}`);
	}
}
