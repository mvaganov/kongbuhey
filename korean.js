let dataModule;
if (typeof require !== 'undefined') {
	dataModule = require('./data.js');
} else {
	dataModule = window;
}
const { getWords, DATA_SCHEMA, KR_EN_languageUnits } = dataModule;
const hasTag = dataModule.hasTag || function (unit, ...tags) {
	if (!unit) return false;
	const unitTags = unit[DATA_SCHEMA.SemanticTags];
	if (unitTags) {
		if (unitTags instanceof Set) {
			if (tags.length === 1) return unitTags.has(tags[0]);
			for (let i = 0; i < tags.length; i++) if (unitTags.has(tags[i])) return true;
			return false;
		}
		if (Array.isArray(unitTags)) {
			if (tags.length === 1) return unitTags.includes(tags[0]);
			return tags.some(t => unitTags.includes(t));
		}
	}
	return false;
};

function parseSemanticVector(unit) {
	if (!unit) return {};
	const raw = unit[DATA_SCHEMA.SemanticVector];
	if (!raw || raw === "") return {};
	if (typeof raw === 'object') return raw;
	try { return JSON.parse(raw); } catch (e) { return {}; }
}

// =========================================================================
// 1. Hangul Syllable Primitives & Constants
// =========================================================================
const HANGUL_INITIALS = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const HANGUL_MEDIALS = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
const HANGUL_FINALS = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

function decomposeHangul(char) {
	const code = char.charCodeAt(0) - 0xAC00;
	if (code < 0 || code >= 11172) return null;
	return { initial: Math.floor(code / 588), medial: Math.floor((code % 588) / 28), final: code % 28 };
}

function composeHangul(initial, medial, final = 0) {
	return String.fromCharCode(0xAC00 + (initial * 588) + (medial * 28) + final);
}

function setFinal(char, final = 0) {
	const d = decomposeHangul(char);
	return d ? composeHangul(d.initial, d.medial, final) : char;
}

function hasBatchim(char) {
	const d = decomposeHangul(char);
	return !!(d && d.final !== 0);
}

function hasRieulBatchim(char) {
	const d = decomposeHangul(char);
	return !!(d && d.final === 8);
}

function getStem(baseForm) {
	return baseForm.replace(/다$/, '');
}

function getVowelHarmony(char) {
	if (char === '하') return '여';
	const d = decomposeHangul(char);
	if (!d) return '어';
	return (d.medial === 0 || d.medial === 2 || d.medial === 8) ? '아' : '어';
}

// =========================================================================
// 2. Proper Names, Usage Filtering & Option Tracking
// =========================================================================
let properNames = [];

function initProperNames() {
	properNames = [];
	const units = KR_EN_languageUnits || (getWords ? getWords("Noun") : []) || [];
	for (const u of units) {
		if (hasTag(u, "name", "proper_noun", "properName")) {
			properNames.push(u[DATA_SCHEMA.Korean]);
		}
	}
}

function getProperNames() {
	if (!properNames || properNames.length === 0) initProperNames();
	return properNames;
}
function setProperNames(names) { if (Array.isArray(names)) properNames = [...names]; }
function getRandomProperName() {
	if (!properNames || properNames.length === 0) initProperNames();
	if (!properNames || properNames.length === 0) return "";
	return properNames[Math.floor(Math.random() * properNames.length)];
}

let currentUsageFilter = null;
let totalOptionsCutToPreventCombinatorialExplosion = 0;

function setCurrentUsageFilter(filter) { currentUsageFilter = filter; }
function getTotalOptionsCut() { return totalOptionsCutToPreventCombinatorialExplosion; }
function resetTotalOptionsCut() { totalOptionsCutToPreventCombinatorialExplosion = 0; }

function getFilteredWords(pos, tag) {
	let words = getWords(pos, tag);
	if (currentUsageFilter) {
		let originalWords = words;
		words = words.filter(w => {
			const id = w[DATA_SCHEMA.Id];
			if (currentUsageFilter._ids && currentUsageFilter._ids.has(id)) return true;
			const source = w[DATA_SCHEMA.Source];
			let isAllowed = currentUsageFilter[source] || hasTag(w, "devtest");
			if (!isAllowed) {
				const tags = w[DATA_SCHEMA.SemanticTags];
				if (tags) {
					for (let t of tags) {
						if (currentUsageFilter[t]) { isAllowed = true; break; }
					}
				}
			}
			return isAllowed;
		});
		if (words.length === 0 && originalWords.length > 0) {
			words = originalWords.slice(0, 5);
		}
	}
	return words;
}

function getConjugatedStem(koreanWord, conjugation) {
	let stem = getStem(koreanWord);
	if (conjugation && conjugation !== "regular" && conjugation !== "") {
		stem += `[${conjugation}]`;
	}
	return stem;
}

class TokenOption {
	constructor(text, units = []) {
		this.text = text;
		this.units = units;
	}
}

let usedUnitIds = new Set();
function markUnitUsed(unit) {
	if (unit && typeof unit[DATA_SCHEMA.Id] === 'number') {
		usedUnitIds.add(unit[DATA_SCHEMA.Id]);
	}
}
function getUsedUnitIds() { return usedUnitIds; }
function resetUsedUnits() { usedUnitIds.clear(); }

function deduplicateTokenOptions(options) {
	const seen = new Set();
	const result = [];
	for (let opt of options) {
		const key = opt.text;
		if (!seen.has(key)) {
			seen.add(key);
			result.push(opt);
		}
	}
	return result;
}

// =========================================================================
// 3. Korean Number Generators (Sino & Pure Korean)
// =========================================================================
let SINO_DIGITS = Array(10).fill("");
let PURE_KOREAN_TENS = Array(10).fill("");
let PURE_KOREAN_ONES_CARDINAL = Array(10).fill("");
let PURE_KOREAN_ONES_ATTRIBUTIVE = Array(10).fill("");
let KOREAN_NUMBER_VALUES = {};
let SINO_TEN = "";
let SINO_HUNDRED = "";
let SINO_THOUSAND = "";
let SINO_TEN_THOUSAND = "";
let NUM_ZERO = "";
let PURE_KOREAN_TWENTY_ATTRIBUTIVE = "";

function initNumberSystem() {
	SINO_DIGITS = Array(10).fill("");
	PURE_KOREAN_TENS = Array(10).fill("");
	PURE_KOREAN_ONES_CARDINAL = Array(10).fill("");
	PURE_KOREAN_ONES_ATTRIBUTIVE = Array(10).fill("");
	KOREAN_NUMBER_VALUES = {};
	SINO_TEN = "";
	SINO_HUNDRED = "";
	SINO_THOUSAND = "";
	SINO_TEN_THOUSAND = "";
	NUM_ZERO = "";
	PURE_KOREAN_TWENTY_ATTRIBUTIVE = "";

	const numberUnits = (KR_EN_languageUnits || []).filter(u => u && u[DATA_SCHEMA.PartofSpeech] === "Number");
	for (const unit of numberUnits) {
		const ko = unit[DATA_SCHEMA.Korean];
		if (!ko) continue;
		const sv = parseSemanticVector(unit);
		const val = sv && sv.value !== undefined ? sv.value : undefined;
		if (val !== undefined) {
			KOREAN_NUMBER_VALUES[ko] = val;
		}

		if (val === 0 && !NUM_ZERO) {
			NUM_ZERO = ko;
		}

		if (hasTag(unit, "sinoNumber")) {
			if (val >= 1 && val <= 9) {
				SINO_DIGITS[val] = ko;
			} else if (val === 10) {
				SINO_TEN = ko;
			} else if (val === 100) {
				SINO_HUNDRED = ko;
			} else if (val === 1000) {
				SINO_THOUSAND = ko;
			} else if (val === 10000) {
				SINO_TEN_THOUSAND = ko;
			}
		}

		if (hasTag(unit, "koreanNumber")) {
			if (val >= 1 && val <= 9) {
				if (hasTag(unit, "attributive")) {
					PURE_KOREAN_ONES_ATTRIBUTIVE[val] = ko;
				}
				if (hasTag(unit, "counting") || !hasTag(unit, "attributive")) {
					PURE_KOREAN_ONES_CARDINAL[val] = ko;
				}
			} else if (val >= 10 && val <= 90 && val % 10 === 0) {
				if (hasTag(unit, "attributive") && val === 20) {
					PURE_KOREAN_TWENTY_ATTRIBUTIVE = ko;
				} else {
					PURE_KOREAN_TENS[val / 10] = ko;
				}
			}
		}
	}

	for (let i = 1; i <= 9; i++) {
		if (!PURE_KOREAN_ONES_ATTRIBUTIVE[i] && PURE_KOREAN_ONES_CARDINAL[i]) {
			PURE_KOREAN_ONES_ATTRIBUTIVE[i] = PURE_KOREAN_ONES_CARDINAL[i];
		}
		if (!PURE_KOREAN_ONES_CARDINAL[i] && PURE_KOREAN_ONES_ATTRIBUTIVE[i]) {
			PURE_KOREAN_ONES_CARDINAL[i] = PURE_KOREAN_ONES_ATTRIBUTIVE[i];
		}
	}

	for (let t = 1; t <= 9; t++) {
		const tenStr = PURE_KOREAN_TENS[t];
		if (!tenStr) continue;
		for (let o = 1; o <= 9; o++) {
			const val = t * 10 + o;
			const card = PURE_KOREAN_ONES_CARDINAL[o];
			const attr = PURE_KOREAN_ONES_ATTRIBUTIVE[o];
			if (card && KOREAN_NUMBER_VALUES[tenStr + card] === undefined) {
				KOREAN_NUMBER_VALUES[tenStr + card] = val;
			}
			if (attr && KOREAN_NUMBER_VALUES[tenStr + attr] === undefined) {
				KOREAN_NUMBER_VALUES[tenStr + attr] = val;
			}
		}
	}
}

function getSinoNumber(n) {
	if (n === 0) return NUM_ZERO;
	if (n === 10000) return SINO_TEN_THOUSAND;
	if (n < 0 || n > 10000) throw new Error(`Sino-Korean numbers supported for 0..10000, got ${n}`);
	let result = "", rem = n;
	const powerNames = [[1000, SINO_THOUSAND], [100, SINO_HUNDRED], [10, SINO_TEN]];
	for (const [val, name] of powerNames) {
		const d = Math.floor(rem / val);
		if (d > 0) result += (d === 1 ? "" : SINO_DIGITS[d]) + name;
		rem %= val;
	}
	if (rem > 0) result += SINO_DIGITS[rem];
	return result;
}

function getKoreanNumber(n, isAttributive = false) {
	if (n === 0) return NUM_ZERO;
	if (n < 0 || n > 99) throw new Error(`Pure Korean numbers supported for 0..99, got ${n}`);
	if (n === 20 && isAttributive && PURE_KOREAN_TWENTY_ATTRIBUTIVE) return PURE_KOREAN_TWENTY_ATTRIBUTIVE;
	const onesArr = isAttributive ? PURE_KOREAN_ONES_ATTRIBUTIVE : PURE_KOREAN_ONES_CARDINAL;
	const t = Math.floor(n / 10), o = n % 10;
	return (PURE_KOREAN_TENS[t] || "") + (t === 0 || o !== 0 ? onesArr[o] : "");
}

function getNumberTokenOptions(baseTag, min, max, isAttributive) {
	const options = [];
	const KoreanWord = DATA_SCHEMA.Korean;
	const words = getFilteredWords("Number", baseTag);

	if (max - min + 1 <= 10) {
		for (let i = min; i <= max; i++) {
			const text = (baseTag === "sinoNumber") ? getSinoNumber(i) : getKoreanNumber(i, isAttributive);
			const matchingUnit = words.find(w => w[KoreanWord] === text);
			options.push(new TokenOption(text, matchingUnit ? [matchingUnit] : []));
		}
		return deduplicateTokenOptions(options);
	}

	words.forEach(w => {
		if (isAttributive && hasTag(w, "counting") && !hasTag(w, "attributive")) return;
		if (!isAttributive && hasTag(w, "attributive") && !hasTag(w, "counting")) return;
		const val = KOREAN_NUMBER_VALUES[w[KoreanWord]];
		if (val !== undefined && (val < min || val > max)) return;
		options.push(new TokenOption(w[KoreanWord], [w]));
	});

	const samples = [min, max];
	if (min + 1 < max) samples.push(min + 1);
	if (max - 1 > min) samples.push(max - 1);
	const span = max - min;
	samples.push(Math.floor(min + span * 0.25), Math.floor(min + span * 0.5), Math.floor(min + span * 0.75));

	samples.forEach(n => {
		if (n >= min && n <= max) {
			const text = (baseTag === "sinoNumber") ? getSinoNumber(n) : getKoreanNumber(n, isAttributive);
			const matchingUnit = words.find(w => w[KoreanWord] === text);
			options.push(new TokenOption(text, matchingUnit ? [matchingUnit] : []));
		}
	});

	return deduplicateTokenOptions(options);
}

// =========================================================================
// 4. Verb Phrase Building & Argument Specs
// =========================================================================
/**
 * SEMANTIC ARGUMENT SELECTION SCHEMA & TAXONOMY RULES
 * ===================================================
 * This subsystem governs how Action Verbs and Descriptive Verbs select their
 * noun arguments (direct objects, nominal subjects, datives, or locations)
 * to ensure semantic plausibility across sentence generation.
 *
 * 4-TIER ARGUMENT RESOLUTION HIERARCHY:
 * -------------------------------------
 * 1. TIER 1 - Embedded `collocation_filter` in SemanticVector:
 *    - An inline JavaScript predicate (with validated header comment) that
 *      runs against candidate nouns: `/*js:filter* / (n, hasTag) => ...`.
 *    - Overrides coarse category tags and enforces fine-grained constraints
 *      (e.g., negative exclusions like `!hasTag(n, "clothing")`).
 *    - MUST maintain candidate diversity: every filter must leave >= 3 valid
 *      candidate nouns in the curriculum to prevent lexical starvation.
 *
 * 2. TIER 2 - Granular Category Spec Matching:
 *    - Matches selection tags on the verb against ACTION_VERB_SPECS or
 *      DESCRIPTIVE_VERB_SPECS (e.g. `descriptive_taste` -> `food`, `transitive_clothing` -> `clothing`).
 *    - Filters nouns in `data.js` having the target `nounTag`.
 *
 * 3. TIER 3 - Domain / Fallback Tag Matching:
 *    - If `preferDomain: true`, prioritizes nouns whose `SemanticVector.domain`
 *      matches the selection domain.
 *    - If 0 nouns match `nounTag`, cascades to `fallbackTag` (e.g. `drink` for taste).
 *
 * 4. TIER 4 - Global Lexicon Fallback:
 *    - If all prior tiers yield 0 candidates, falls back to nouns tagged `object`
 *      (or general nouns excluding `measureWord`).
 *
 * -------------------------------------------------------------------------
 * HOW TO ADD A NEW SEMANTIC SELECTION TAG WITH NEW RULES (FOR LLMS & DEVS):
 * -------------------------------------------------------------------------
 * When introducing a new verb or adjective that requires restricted argument
 * selection (e.g. `transitive_cosmetics` or `descriptive_luminosity`):
 *
 * STEP 1: Verify Noun Taxonomy in data.js
 *   Ensure the vocabulary has at least 3 nouns tagged with the target noun category
 *   (e.g. `cosmetics` or `lightSource`). If not, tag appropriate nouns via `select.js`.
 *
 * STEP 2: Register the Rule in korean.js
 *   Add a spec object to ACTION_VERB_SPECS or DESCRIPTIVE_VERB_SPECS below:
 *     // For Action Verbs:
 *     { tag: "transitive_cosmetics", nounTag: "cosmetics", particle: "object", fallbackTag: "accessory" }
 *     // For Descriptive Verbs:
 *     { tag: "descriptive_luminosity", nounTag: "lightSource", fallbackTag: "room" }
 *
 * STEP 3: Tag the Verb in data.js
 *   Assign the registered tag (e.g. `transitive_cosmetics`) to the verb's SemanticTags.
 *   Use select.js to apply the update:
 *     node select.js "UPDATE KR_EN_languageUnits SET SemanticTags = [...] WHERE Korean = '...'"
 *
 * STEP 4: Add Negative Exclusions via collocation_filter (If Needed)
 *   If single-tag matching is too permissive (e.g. you need to exclude specific subcategories):
 *   Set `collocation_filter` in the verb's SemanticVector with the mandatory `/*js:filter* /` header:
 *     '{"domain":"...", "collocation_filter":"/*js:filter* / (n, hasTag) => hasTag(n, \"cosmetics\") && !hasTag(n, \"clothing\")"}'
 *
 * STEP 5: Validate and Verify
 *   Run the automated test suites to ensure 0 regressions and >= 3 candidates:
 *     node collocation_test.js
 *     node test.js
 */
const ACTION_VERB_SPECS = [
	// Apparel (Fine-grained)
	{ tag: "transitive_clothing", nounTag: "clothing", particle: "object" },
	{ tag: "transitive_footwear", nounTag: "footwear", particle: "object" },
	{ tag: "transitive_headwear", nounTag: "headwear", particle: "object" },
	{ tag: "transitive_handwear", nounTag: "handwear", particle: "object", fallbackTag: "accessory" },
	{ tag: "transitive_neckwear", nounTag: "neckwear", particle: "object", fallbackTag: "accessory" },
	{ tag: "transitive_watch", nounTag: "watch", particle: "object", fallbackTag: "accessory" },
	{ tag: "transitive_wearable", nounTag: "wearable", particle: "object" },

	// Consumption
	{ tag: "transitive_food", nounTag: "food", particle: "object", preferDomain: true },
	{ tag: "transitive_drink", nounTag: "drink", particle: "object", preferDomain: true },

	// Media, Arts & Communication
	{ tag: "transitive_reading", nounTag: "reading", particle: "object" },
	{ tag: "transitive_visual", nounTag: "visual_media", particle: "object" },
	{ tag: "transitive_audio", nounTag: "audio", particle: "object" },
	{ tag: "transitive_song", nounTag: "song", particle: "object", fallbackTag: "person" },
	{ tag: "transitive_writing", nounTag: "writing", particle: "object" },
	{ tag: "transitive_language", nounTag: "language", particle: "object" },
	{ tag: "transitive_information", nounTag: "abstract", particle: "object", fallbackTag: "education" },

	// Activities & Sports
	{ tag: "transitive_activity", nounTag: "activity", particle: "object" },
	{ tag: "transitive_instrument", nounTag: "instrument", particle: "object" },
	{ tag: "transitive_sports", nounTag: "racketSports", particle: "object", fallbackTag: "sports" },

	// Vehicles & Transportation
	{ tag: "transitive_vehicle", nounTag: "vehicle", particle: "object" },
	{ tag: "transitive_transportation", nounTag: "transportation", particle: "object" },

	// Hygiene & Chores
	{ tag: "transitive_teeth", nounTag: "teeth", particle: "object", fallbackTag: "bodyPart" },
	{ tag: "transitive_bodyPart", nounTag: "bodyPart", particle: "object" },
	{ tag: "transitive_room", nounTag: "room", particle: "object" },

	// Social & General
	{ tag: "transitive_person", nounTag: "person", particle: "object" },
	{ tag: "transitive_social", nounTag: "person", particle: "object" },
	{ tag: "dative_person", nounTag: "person", particle: "dative" },
	{ tag: "dative_humble", nounTag: "elder_noun", particle: "dative", fallbackTag: "person" },
	{ tag: "transitive_place", nounTag: "place", particle: "object", preferDomain: true },
	{ tag: "transitive_object", nounTag: "object", particle: "object" },
	{ tag: "transitive_general", nounTag: "object", particle: "object", fallbackTag: null },

	// Intransitive Motion & Location
	{ tag: "intransitive_motion", nounTag: "place", particle: "location", preferDomain: true },
	{ tag: "intransitive_place", nounTag: "place", particle: "location", preferDomain: true },
	{ tag: "intransitive_person", nounTag: "person", particle: "subject" },
	{ tag: "intransitive_social", nounTag: "person", particle: "subject" },
	{ tag: "intransitive_food", nounTag: null, particle: null },
	{ tag: "intransitive_general", nounTag: null, particle: null }
];

const DESCRIPTIVE_VERB_SPECS = [
	// Taste / Flavor (food, drinks)
	{ tag: "descriptive_taste", nounTag: "food", fallbackTag: "drink", preferDomain: true },

	// Weather / Atmosphere / Climate
	{ tag: "descriptive_weather", nounTag: "weather" },

	// Tactile & Liquid Temperature (water, drinks, food)
	{ tag: "descriptive_tactile_temperature", nounTag: "drink", fallbackTag: "food" },

	// Physical Dimensions: Spatial (rooms, houses, streets, roads)
	{ tag: "descriptive_dimension_spatial", nounTag: "room", fallbackTag: "place" },

	// Physical Dimensions: Linear Length (clothing, time, distance, lines)
	{ tag: "descriptive_dimension_length", nounTag: "clothing", fallbackTag: "time" },

	// Physical Dimensions: Height (mountains, buildings, elevation)
	{ tag: "descriptive_dimension_height", nounTag: "mountain", fallbackTag: "building" },

	// Physical Dimensions: Weight (luggage, books, bags)
	{ tag: "descriptive_dimension_weight", nounTag: "luggage", fallbackTag: "object" },

	// Physical Dimensions: Thickness (clothing, books)
	{ tag: "descriptive_dimension_thickness", nounTag: "clothing", fallbackTag: "book" },

	// Physical Dimensions: General Scale / Size (rooms, buildings, objects)
	{ tag: "descriptive_dimension_scale", nounTag: "room", fallbackTag: "object" },

	// Price & Cost (clothing, commodities, food)
	{ tag: "descriptive_price", nounTag: "clothing", fallbackTag: "commodity" },

	// Cleanliness & Hygiene (rooms, places, facilities)
	{ tag: "descriptive_cleanliness", nounTag: "room", fallbackTag: "place" },

	// Acoustics & Noise (rooms, places, neighborhoods)
	{ tag: "descriptive_acoustic", nounTag: "room", fallbackTag: "place" },

	// Psychological & Emotional State (people, heart, mood)
	{ tag: "descriptive_emotion", nounTag: "person", fallbackTag: "emotion" },

	// Personal Traits & Animate Characteristics (strictly people)
	{ tag: "descriptive_person_trait", nounTag: "person" },
	{ tag: "descriptive_person", nounTag: "person" },

	// Difficulty & Comprehension (languages, tasks, exams)
	{ tag: "descriptive_difficulty", nounTag: "education", fallbackTag: "abstract" },

	// Speed & Velocity (vehicles, people)
	{ tag: "descriptive_speed", nounTag: "vehicle", fallbackTag: "person" },

	// Color & Visual Appearance (clothing, nature, objects)
	{ tag: "descriptive_color", nounTag: "clothing", fallbackTag: "nature" },
	{ tag: "descriptive_appearance", nounTag: "clothing", fallbackTag: "person" },

	// Locations & Facilities
	{ tag: "descriptive_place", nounTag: "place" },

	// Food (General)
	{ tag: "descriptive_food", nounTag: "food" },

	// Fallback general object
	{ tag: "descriptive_general", nounTag: "object", fallbackTag: null }
];

/**
 * Parses and validates the comment header of a `collocation_filter` string.
 *
 * HOW COLLOCATION_FILTER WORKS:
 * ------------------------------
 * The `collocation_filter` is an embedded executable predicate stored inside
 * the JSON `SemanticVector` column of `data.js` on specific language units:
 *   e.g.: '{"domain":"food", "collocation_filter":"/*js:filter* / (n, hasTag) => hasTag(n, \"food\") && !hasTag(n, \"facility\")"}'
 *
 * INTERPLAY WITH SEMANTIC TAG RESTRICTIONS:
 * -----------------------------------------
 * 1. Tier 1 Precedence: If defined, `collocation_filter` executes BEFORE and
 *    overrides coarse single-tag specs (Tier 2).
 * 2. Expressive Relational Constraints: Enables negative exclusions
 *    (`!hasTag(n, 'clothing')`), multi-tag conjunctions/disjunctions, and
 *    fine-grained domain gating impossible with simple flat tags.
 * 3. Candidate Diversity Contract: Every filter must evaluate to >= 3 valid
 *    candidate nouns in the current vocabulary to prevent lexical starvation
 *    and monotonous sentence generation.
 * 4. Header Comment Specification:
 *    - Format: `/*<lang>[:<subtype>]* / <code>`
 *    - Required Language: Must start with `'js'` (e.g. `/*js:filter* /` or `/*js* /`).
 *    - Security & DSL Extensibility: Validates the language header so that
 *      missing or unrecognized headers trigger immediate, descriptive errors.
 *      This prevents malformed scripts and prepares the architecture for future
 *      declarative or regular expression DSLs (e.g. `/*dsl:tag* /`).
 *
 * @param {string} filterStr - The raw filter string from SemanticVector.
 * @param {number|string} verbId - Optional verb ID for error diagnostics.
 * @returns {{ lang: string, subtype: string, code: string }} Parsed header metadata and executable code body.
 * @throws {Error} If header is missing, malformed, or specifies an unsupported language.
 */
function parseAndValidateCollocationFilter(filterStr, verbId = "unknown") {
	if (typeof filterStr !== 'string') {
		throw new Error(`Invalid collocation_filter on unit ${verbId}: expected string, got ${typeof filterStr}.`);
	}
	const trimmed = filterStr.trim();
	const headerMatch = trimmed.match(/^\/\*\s*([a-zA-Z0-9_-]+)(?::([^\*]+))?\s*\*\/\s*([\s\S]*)$/);
	if (!headerMatch) {
		throw new Error(`Invalid collocation_filter on unit ${verbId}: missing or malformed header comment. Expected /*js:...*/ or /*js*/.`);
	}

	const lang = headerMatch[1].toLowerCase();
	const subtype = (headerMatch[2] || "").trim();
	const code = headerMatch[3].trim();

	if (lang !== 'js') {
		throw new Error(`Unsupported collocation_filter language '${headerMatch[1]}' on unit ${verbId}. Expected 'js' (e.g. /*js:filter*/).`);
	}

	if (!code) {
		throw new Error(`Empty code body in collocation_filter on unit ${verbId}.`);
	}

	return { lang, subtype, code };
}

function getNounCandidatesForVerb(verbUnit) {
	const sv = parseSemanticVector(verbUnit);

	// 1. Embedded executable JavaScript filter in SemanticVector
	if (sv && typeof sv.collocation_filter === 'string') {
		try {
			const { lang, code } = parseAndValidateCollocationFilter(sv.collocation_filter, verbUnit[DATA_SCHEMA.Id]);
			if (lang === 'js') {
				const filterFn = new Function('noun', 'hasTag', `return (${code})(noun, hasTag);`);
				const allNouns = getFilteredWords("Noun");
				const matched = allNouns.filter(n => {
					try { return filterFn(n, hasTag); } catch (e) { return false; }
				});
				if (matched.length > 0) return matched;
			}
		} catch (e) {
			console.error(`Failed to execute collocation_filter on unit ${verbUnit[DATA_SCHEMA.Id]}:`, e.message || e);
		}
	}

	// 2. Explicit semantic vector requirement (sv.req)
	if (sv && sv.req) {
		const reqNouns = getFilteredWords("Noun", sv.req).filter(n => !hasTag(n, "measureWord"));
		if (reqNouns.length > 0) return reqNouns;
	}

	// 3. Fallback to ACTION_VERB_SPECS based on SemanticTags
	for (const spec of ACTION_VERB_SPECS) {
		if (hasTag(verbUnit, spec.tag)) {
			let words = getFilteredWords("Noun", spec.nounTag).filter(n => !hasTag(n, "measureWord"));
			if (spec.preferDomain) {
				const domainWords = words.filter(w => parseSemanticVector(w).domain);
				if (domainWords.length > 0) words = domainWords;
			}
			if (words.length === 0 && spec.fallbackTag !== undefined) {
				words = getFilteredWords("Noun", spec.fallbackTag || undefined).filter(n => !hasTag(n, "measureWord"));
			}
			if (words.length > 0) return words;
		}
	}

	let fallback = getFilteredWords("Noun", "object").filter(n => !hasTag(n, "measureWord"));
	if (fallback.length === 0) fallback = getFilteredWords("Noun").filter(n => !hasTag(n, "measureWord"));
	return fallback;
}

function getSubjectCandidatesForDescriptiveVerb(dvUnit) {
	const sv = parseSemanticVector(dvUnit);

	// 1. Embedded executable JavaScript filter in SemanticVector
	if (sv && typeof sv.collocation_filter === 'string') {
		try {
			const { lang, code } = parseAndValidateCollocationFilter(sv.collocation_filter, dvUnit[DATA_SCHEMA.Id]);
			if (lang === 'js') {
				const filterFn = new Function('noun', 'hasTag', `return (${code})(noun, hasTag);`);
				const allNouns = getFilteredWords("Noun");
				const matched = allNouns.filter(n => {
					try { return filterFn(n, hasTag); } catch (e) { return false; }
				});
				if (matched.length > 0) return matched;
			}
		} catch (e) {
			console.error(`Failed to execute collocation_filter on descriptive unit ${dvUnit[DATA_SCHEMA.Id]}:`, e.message || e);
		}
	}

	// 2. Explicit semantic vector requirement (sv.req)
	if (sv && sv.req && sv.req !== 'any') {
		const reqNouns = getFilteredWords("Noun", sv.req).filter(n => !hasTag(n, "measureWord"));
		if (reqNouns.length > 0) return reqNouns;
	}

	// 3. Fallback to DESCRIPTIVE_VERB_SPECS based on SemanticTags
	for (const spec of DESCRIPTIVE_VERB_SPECS) {
		if (hasTag(dvUnit, spec.tag)) {
			let words = getFilteredWords("Noun", spec.nounTag).filter(n => !hasTag(n, "measureWord"));
			if (spec.preferDomain) {
				const domainWords = words.filter(w => parseSemanticVector(w).domain);
				if (domainWords.length > 0) words = domainWords;
			}
			if (words.length === 0 && spec.fallbackTag !== undefined) {
				words = getFilteredWords("Noun", spec.fallbackTag || undefined).filter(n => !hasTag(n, "measureWord"));
			}
			if (words.length > 0) return words;
		}
	}

	let fallback = getFilteredWords("Noun", "object").filter(n => !hasTag(n, "measureWord"));
	if (fallback.length === 0) fallback = getFilteredWords("Noun").filter(n => !hasTag(n, "measureWord"));
	return fallback;
}

function getVerbParticleType(verbUnit) {
	if (hasTag(verbUnit, "dative_person")) return "dative";
	if (hasTag(verbUnit, "intransitive_motion", "intransitive_place")) return "location";
	const spec = ACTION_VERB_SPECS.find(s => hasTag(verbUnit, s.tag));
	if (spec && spec.particle) return spec.particle;
	return "object";
}

function findNounForVerbTag(spec) {
	let words = getFilteredWords("Noun", spec.nounTag);
	if (spec.preferDomain) {
		const domainWords = words.filter(w => parseSemanticVector(w).domain);
		if (domainWords.length > 0) words = domainWords;
	}
	if (words.length === 0 && spec.fallbackTag !== undefined) {
		words = getFilteredWords("Noun", spec.fallbackTag || undefined);
	}
	if (words.length === 0) {
		words = getWords("Noun", spec.nounTag);
		if (words.length === 0) words = getWords("Noun");
	}
	const chosen = getRandom(words);
	if (chosen) markUnitUsed(chosen);
	return chosen;
}

// Fast in-memory unit caches for particle specialization
let nounLookupMap = null;
let allNounsMap = null;

function getNounUnit(nounOrKo) {
	if (Array.isArray(nounOrKo)) return nounOrKo;
	if (typeof nounOrKo !== 'string') return null;
	if (!nounLookupMap) {
		nounLookupMap = new Map();
		const nouns = getWords("Noun");
		for (const n of nouns) {
			const ko = n[DATA_SCHEMA.Korean];
			if (!nounLookupMap.has(ko)) nounLookupMap.set(ko, n);
		}
	}
	return nounLookupMap.get(nounOrKo) || null;
}

function getAllNounUnits(nounOrKo) {
	if (Array.isArray(nounOrKo)) return [nounOrKo];
	if (typeof nounOrKo !== 'string') return [];
	if (!allNounsMap) {
		allNounsMap = new Map();
		const nouns = getWords("Noun");
		for (const n of nouns) {
			const ko = n[DATA_SCHEMA.Korean];
			if (!allNounsMap.has(ko)) allNounsMap.set(ko, []);
			allNounsMap.get(ko).push(n);
		}
	}
	return allNounsMap.get(nounOrKo) || [];
}

let verbLookupMap = null;
function getVerbUnit(verbOrKo) {
	if (Array.isArray(verbOrKo)) return verbOrKo;
	if (typeof verbOrKo !== 'string') return null;
	if (!verbLookupMap) {
		verbLookupMap = new Map();
		const verbs = [...getWords("Action Verb"), ...getWords("Descriptive Verb")];
		for (const v of verbs) {
			const ko = v[DATA_SCHEMA.Korean];
			if (!verbLookupMap.has(ko)) verbLookupMap.set(ko, v);
		}
	}
	return verbLookupMap.get(verbOrKo) || null;
}

let ELDER_NOUN_TITLES = new Set();
let INANIMATE_INSTITUTION_NAMES = new Set();
let ORIGIN_VERBS = new Set();
let ALLATIVE_GOAL_VERBS = new Set();
let STATIC_EXISTENCE_VERBS = new Set();
let HUMBLE_DATIVE_VERBS = new Set();
let TITLE_SUFFIX_SSI = "";

let HONORIFIC_VERB_SUPPLETIONS = new Map();
let HUMBLE_VERB_SUPPLETIONS = new Map();
let HONORIFIC_NOUN_SUPPLETIONS = new Map();
let HUMBLE_PRONOUN_SUPPLETIONS = new Map();
let PLAIN_COUNTERPARTS = new Map();
let HONORIFIC_WORDS = new Set();
let HUMBLE_WORDS = new Set();
let FORBIDDEN_PLAIN_WORDS_FOR_ELDERS = new Set();

let PAST_TIME_WORDS = new Set();
let FUTURE_TIME_WORDS = new Set();
let PRESENT_TIME_WORDS = new Set();
let BARE_TIME_WORDS_NO_PARTICLE = new Set();
let PAST_GRAMMAR_IDS = new Set();
let FUTURE_GRAMMAR_IDS = new Set();
let PRESENT_GRAMMAR_IDS = new Set();

let KOREAN_CLASSIFIERS = new Set();
let SINO_CLASSIFIERS = new Set();
let CLASSIFIER_UNITS = new Map();
let CLASSIFIER_NOUN_SPECS = [];

function initSemanticSets() {
	ELDER_NOUN_TITLES.clear();
	INANIMATE_INSTITUTION_NAMES.clear();
	ORIGIN_VERBS.clear();
	ALLATIVE_GOAL_VERBS.clear();
	STATIC_EXISTENCE_VERBS.clear();
	HUMBLE_DATIVE_VERBS.clear();
	HONORIFIC_VERB_SUPPLETIONS.clear();
	HUMBLE_VERB_SUPPLETIONS.clear();
	HONORIFIC_NOUN_SUPPLETIONS.clear();
	HUMBLE_PRONOUN_SUPPLETIONS.clear();
	PLAIN_COUNTERPARTS.clear();
	HONORIFIC_WORDS.clear();
	HUMBLE_WORDS.clear();
	FORBIDDEN_PLAIN_WORDS_FOR_ELDERS.clear();
	PAST_TIME_WORDS.clear();
	FUTURE_TIME_WORDS.clear();
	PRESENT_TIME_WORDS.clear();
	BARE_TIME_WORDS_NO_PARTICLE.clear();
	PAST_GRAMMAR_IDS.clear();
	FUTURE_GRAMMAR_IDS.clear();
	PRESENT_GRAMMAR_IDS.clear();
	KOREAN_CLASSIFIERS.clear();
	SINO_CLASSIFIERS.clear();
	CLASSIFIER_UNITS.clear();
	CLASSIFIER_NOUN_SPECS = [];

	const allUnits = KR_EN_languageUnits || [];
	for (const unit of allUnits) {
		if (!unit) continue;
		const ko = unit[DATA_SCHEMA.Korean];
		if (!ko) continue;
		const pos = unit[DATA_SCHEMA.PartofSpeech] || "";

		if (hasTag(unit, "elder_noun")) {
			ELDER_NOUN_TITLES.add(ko);
		}
		if (hasTag(unit, "inanimate_institution")) {
			INANIMATE_INSTITUTION_NAMES.add(ko);
		}
		if (hasTag(unit, "locative_origin")) {
			ORIGIN_VERBS.add(ko);
		}
		if (hasTag(unit, "locative_goal")) {
			ALLATIVE_GOAL_VERBS.add(ko);
		}
		if (hasTag(unit, "locative_static")) {
			STATIC_EXISTENCE_VERBS.add(ko);
		}
		if (hasTag(unit, "dative_humble")) {
			HUMBLE_DATIVE_VERBS.add(ko);
		}
		if (pos === "Grammar" && hasTag(unit, "properNoun", "honorific") && !TITLE_SUFFIX_SSI) {
			TITLE_SUFFIX_SSI = ko;
		}

		const sv = parseSemanticVector(unit);
		if (sv) {
			if (sv.honorific_suppletion) {
				if (pos === "Action Verb" || pos === "Descriptive Verb") {
					HONORIFIC_VERB_SUPPLETIONS.set(ko, sv.honorific_suppletion);
					FORBIDDEN_PLAIN_WORDS_FOR_ELDERS.add(ko);
				} else if (pos === "Noun") {
					HONORIFIC_NOUN_SUPPLETIONS.set(ko, sv.honorific_suppletion);
					FORBIDDEN_PLAIN_WORDS_FOR_ELDERS.add(ko);
				} else if (pos === "Pronoun") {
					HUMBLE_PRONOUN_SUPPLETIONS.set(ko, sv.honorific_suppletion);
				}
			}
			if (sv.humble_suppletion) {
				if (pos === "Action Verb" || pos === "Descriptive Verb") {
					HUMBLE_VERB_SUPPLETIONS.set(ko, sv.humble_suppletion);
				} else if (pos === "Pronoun") {
					HUMBLE_PRONOUN_SUPPLETIONS.set(ko, sv.humble_suppletion);
				}
			}
			if (sv.plain_counterpart) {
				PLAIN_COUNTERPARTS.set(ko, sv.plain_counterpart);
			}
		}

		// Also check HonorificRules column to catch any declarative notes
		const hr = unit[DATA_SCHEMA.HonorificRules] || "";
		if (hr) {
			const repMatch = hr.match(/Replace with ([가-힣]+) for respected subjects/);
			if (repMatch) {
				const target = repMatch[1];
				if (pos === "Action Verb" || pos === "Descriptive Verb") {
					if (!HONORIFIC_VERB_SUPPLETIONS.has(ko)) HONORIFIC_VERB_SUPPLETIONS.set(ko, target);
					FORBIDDEN_PLAIN_WORDS_FOR_ELDERS.add(ko);
				} else if (pos === "Noun") {
					if (!HONORIFIC_NOUN_SUPPLETIONS.has(ko)) HONORIFIC_NOUN_SUPPLETIONS.set(ko, target);
					FORBIDDEN_PLAIN_WORDS_FOR_ELDERS.add(ko);
				}
			}
			const honMatch = hr.match(/Honorific:\s*([가-힣]+)/);
			if (honMatch) {
				const target = honMatch[1];
				if (pos === "Action Verb" || pos === "Descriptive Verb") {
					if (!HONORIFIC_VERB_SUPPLETIONS.has(ko)) HONORIFIC_VERB_SUPPLETIONS.set(ko, target);
					FORBIDDEN_PLAIN_WORDS_FOR_ELDERS.add(ko);
				} else if (pos === "Noun") {
					if (!HONORIFIC_NOUN_SUPPLETIONS.has(ko)) HONORIFIC_NOUN_SUPPLETIONS.set(ko, target);
					FORBIDDEN_PLAIN_WORDS_FOR_ELDERS.add(ko);
				}
			}
			const formOfMatch = hr.match(/Honorific form of ([가-힣]+)/);
			if (formOfMatch) {
				const base = formOfMatch[1];
				if (!PLAIN_COUNTERPARTS.has(ko)) PLAIN_COUNTERPARTS.set(ko, base);
				if (pos === "Action Verb" || pos === "Descriptive Verb") {
					if (!HONORIFIC_VERB_SUPPLETIONS.has(base)) HONORIFIC_VERB_SUPPLETIONS.set(base, ko);
					FORBIDDEN_PLAIN_WORDS_FOR_ELDERS.add(base);
				} else if (pos === "Noun") {
					if (!HONORIFIC_NOUN_SUPPLETIONS.has(base)) HONORIFIC_NOUN_SUPPLETIONS.set(base, ko);
					FORBIDDEN_PLAIN_WORDS_FOR_ELDERS.add(base);
				}
			}
		}

		if (hasTag(unit, "honorific", "honorificVerb", "honorific_noun", "honorific_person", "elder_noun")) {
			HONORIFIC_WORDS.add(ko);
		}
		if (hasTag(unit, "humble", "humbleVerb", "dative_humble")) {
			HUMBLE_WORDS.add(ko);
		}

		const unitId = unit[DATA_SCHEMA.Id];
		const isPast = hasTag(unit, "temporal_past", "past") || (sv && sv.tense === "past");
		const isFuture = hasTag(unit, "temporal_future", "future") || (sv && sv.tense === "future");
		const isPresent = hasTag(unit, "temporal_present", "present") || (sv && sv.tense === "present");
		const isNoParticle = hasTag(unit, "no_time_particle") || (sv && sv.no_time_particle === true);

		if (isPast) {
			if (pos === "Grammar") PAST_GRAMMAR_IDS.add(unitId);
			else PAST_TIME_WORDS.add(ko);
		}
		if (isFuture) {
			if (pos === "Grammar") FUTURE_GRAMMAR_IDS.add(unitId);
			else FUTURE_TIME_WORDS.add(ko);
		}
		if (isPresent) {
			if (pos === "Grammar") PRESENT_GRAMMAR_IDS.add(unitId);
			else PRESENT_TIME_WORDS.add(ko);
		}
		if (isNoParticle) {
			BARE_TIME_WORDS_NO_PARTICLE.add(ko);
		}

		if (pos === "Noun" && (hasTag(unit, "measureWord", "counter") || (sv && sv.counter === true))) {
			CLASSIFIER_UNITS.set(ko, unit);
			if (hasTag(unit, "koreanMeasureWord") || (sv && sv.numType === "pure")) {
				KOREAN_CLASSIFIERS.add(ko);
			}
			if (hasTag(unit, "sinoMeasureWord") || (sv && sv.numType === "sino")) {
				SINO_CLASSIFIERS.add(ko);
			}

			if (sv && sv.classifier_spec) {
				const cs = sv.classifier_spec;
				CLASSIFIER_NOUN_SPECS.push({
					classifier: ko,
					unitId: unit[DATA_SCHEMA.Id],
					unit: unit,
					tags: Array.isArray(cs.tags) ? cs.tags : (cs.tags ? [cs.tags] : []),
					fallbackTag: cs.fallbackTag || null,
					priority: typeof cs.priority === 'number' ? cs.priority : 50,
					honorificPerson: !!cs.honorificPerson,
					plainPerson: !!cs.plainPerson,
					generalObject: !!cs.generalObject,
					incompatibleTags: Array.isArray(cs.incompatibleTags) ? cs.incompatibleTags : []
				});
			}
		}
	}

	CLASSIFIER_NOUN_SPECS.sort((a, b) => b.priority - a.priority);
}

function getTemporalPolarity(wordOrUnit) {
	if (!wordOrUnit) return null;
	const ko = typeof wordOrUnit === 'string' ? wordOrUnit : (Array.isArray(wordOrUnit) ? wordOrUnit[DATA_SCHEMA.Korean] : "");
	const unit = typeof wordOrUnit === 'object' && Array.isArray(wordOrUnit) ? wordOrUnit : (getNounUnit(ko) || getVerbUnit(ko));
	const id = unit ? unit[DATA_SCHEMA.Id] : (typeof wordOrUnit === 'number' ? wordOrUnit : null);

	if (ko && PAST_TIME_WORDS.has(ko)) return "past";
	if (id !== null && PAST_GRAMMAR_IDS.has(id)) return "past";

	if (ko && FUTURE_TIME_WORDS.has(ko)) return "future";
	if (id !== null && FUTURE_GRAMMAR_IDS.has(id)) return "future";

	if (ko && PRESENT_TIME_WORDS.has(ko)) return "present";
	if (id !== null && PRESENT_GRAMMAR_IDS.has(id)) return "present";

	if (unit) {
		if (hasTag(unit, "temporal_past", "past")) return "past";
		if (hasTag(unit, "temporal_future", "future")) return "future";
		if (hasTag(unit, "temporal_present", "present")) return "present";
		const sv = parseSemanticVector(unit);
		if (sv && sv.tense) return sv.tense;
	}
	return null;
}

function isDeicticTimeWord(nounUnit, nounKo = "") {
	const ko = nounKo || (nounUnit ? nounUnit[DATA_SCHEMA.Korean] : "");
	if (ko && BARE_TIME_WORDS_NO_PARTICLE.has(ko)) return true;
	if (nounUnit) {
		if (hasTag(nounUnit, "no_time_particle")) return true;
		const sv = parseSemanticVector(nounUnit);
		if (sv && sv.no_time_particle === true) return true;
	}
	return false;
}

function filterWordsByTense(words, tense) {
	if (!words || words.length === 0 || !tense) return words || [];
	let filtered = words;
	if (tense === "past") {
		filtered = words.filter(w => {
			const pol = getTemporalPolarity(w);
			return pol !== "future";
		});
	} else if (tense === "future") {
		filtered = words.filter(w => {
			const pol = getTemporalPolarity(w);
			return pol !== "past";
		});
	} else if (tense === "present") {
		filtered = words.filter(w => {
			const pol = getTemporalPolarity(w);
			return pol !== "past" && pol !== "future";
		});
	}
	return filtered.length > 0 ? filtered : words;
}

function filterGrammarByTense(grammars, tense) {
	if (!grammars || grammars.length === 0 || !tense) return grammars || [];
	let filtered = grammars;
	if (tense === "past") {
		filtered = grammars.filter(g => {
			const id = g[DATA_SCHEMA.Id];
			if (FUTURE_GRAMMAR_IDS.has(id)) return false;
			const sv = parseSemanticVector(g);
			return sv.tense !== "future";
		});
	} else if (tense === "future") {
		filtered = grammars.filter(g => {
			const id = g[DATA_SCHEMA.Id];
			if (PAST_GRAMMAR_IDS.has(id)) return false;
			const sv = parseSemanticVector(g);
			return sv.tense !== "past";
		});
	} else if (tense === "present") {
		filtered = grammars.filter(g => {
			const id = g[DATA_SCHEMA.Id];
			if (PAST_GRAMMAR_IDS.has(id) || FUTURE_GRAMMAR_IDS.has(id)) return false;
			const sv = parseSemanticVector(g);
			return sv.tense !== "past" && sv.tense !== "future";
		});
	}
	return filtered.length > 0 ? filtered : grammars;
}

function isElderNoun(nounUnit, nounKo = "") {
	if (nounUnit) {
		if (hasTag(nounUnit, "elder_noun", "honorific", "honorific_person", "elder", "kinship_elder")) return true;
		const sv = parseSemanticVector(nounUnit);
		if (sv && sv.honorific === true) return true;
		const name = nounUnit[DATA_SCHEMA.Korean];
		if (ELDER_NOUN_TITLES.has(name) || (name && name.endsWith('님') && hasTag(nounUnit, "person"))) return true;
	}
	if (nounKo) {
		if (ELDER_NOUN_TITLES.has(nounKo) || nounKo.endsWith('님')) return true;
	}
	return false;
}

function isInanimateInstitution(nounUnit, nounKo = "") {
	if (nounUnit) {
		if (hasTag(nounUnit, "inanimate_institution")) return true;
		if (hasTag(nounUnit, "person", "animal", "family", "profession", "subject_animate")) return false;
		if (hasTag(nounUnit, "institution", "facility", "organization", "workplace", "place", "place_indoor", "place_outdoor")) return true;
	}
	if (nounKo && INANIMATE_INSTITUTION_NAMES.has(nounKo)) return true;
	return false;
}

function getHonorificVerb(verbOrKo) {
	const ko = typeof verbOrKo === 'string' ? verbOrKo : (verbOrKo ? verbOrKo[DATA_SCHEMA.Korean] : "");
	return HONORIFIC_VERB_SUPPLETIONS.get(ko) || null;
}

function getHumbleVerb(verbOrKo) {
	const ko = typeof verbOrKo === 'string' ? verbOrKo : (verbOrKo ? verbOrKo[DATA_SCHEMA.Korean] : "");
	return HUMBLE_VERB_SUPPLETIONS.get(ko) || null;
}

function getHonorificNoun(nounOrKo) {
	const ko = typeof nounOrKo === 'string' ? nounOrKo : (nounOrKo ? nounOrKo[DATA_SCHEMA.Korean] : "");
	return HONORIFIC_NOUN_SUPPLETIONS.get(ko) || null;
}

function getHumblePronoun(pronounOrKo) {
	const ko = typeof pronounOrKo === 'string' ? pronounOrKo : (pronounOrKo ? pronounOrKo[DATA_SCHEMA.Korean] : "");
	return HUMBLE_PRONOUN_SUPPLETIONS.get(ko) || null;
}

function getPlainCounterpart(wordOrKo) {
	const ko = typeof wordOrKo === 'string' ? wordOrKo : (wordOrKo ? wordOrKo[DATA_SCHEMA.Korean] : "");
	return PLAIN_COUNTERPARTS.get(ko) || null;
}

function isHonorificWord(wordOrKo) {
	const ko = typeof wordOrKo === 'string' ? wordOrKo : (wordOrKo ? wordOrKo[DATA_SCHEMA.Korean] : "");
	return HONORIFIC_WORDS.has(ko);
}

function isHumbleWord(wordOrKo) {
	const ko = typeof wordOrKo === 'string' ? wordOrKo : (wordOrKo ? wordOrKo[DATA_SCHEMA.Korean] : "");
	return HUMBLE_WORDS.has(ko);
}

function isForbiddenForElder(wordOrKo) {
	const ko = typeof wordOrKo === 'string' ? wordOrKo : (wordOrKo ? wordOrKo[DATA_SCHEMA.Korean] : "");
	return FORBIDDEN_PLAIN_WORDS_FOR_ELDERS.has(ko);
}

function getHonorificPredicate(verbOrKo, formality = "polite", options = {}) {
	const verbUnit = getVerbUnit(verbOrKo);
	const verbKo = verbUnit ? verbUnit[DATA_SCHEMA.Korean] : (typeof verbOrKo === 'string' ? verbOrKo : "");
	if (!verbKo) return "";

	if (options.indirectHonorific === true && verbKo === "있다") {
		const conj = verbUnit ? verbUnit[DATA_SCHEMA.Conjugation] : "";
		const stem = getConjugatedStem("있다", conj);
		switch (formality) {
			case "formal":
			case "formal_polite":
				return applyMorphology(stem + "으/십니다");
			case "formal_question":
				return applyMorphology(stem + "으/십니까?");
			case "past":
			case "past_polite":
				return applyMorphology(stem + "으/셨어요");
			case "past_formal":
				return applyMorphology(stem + "으/셨습니다");
			case "imperative":
			case "imperative_polite":
				return applyMorphology(stem + "으/세요");
			case "imperative_formal":
				return applyMorphology(stem + "으/십시오");
			case "informal":
			case "banmal":
				return applyMorphology(stem + "으/셔");
			case "stem":
				return applyMorphology(stem + "으/시");
			case "polite":
			case "polite_informal":
			default:
				return applyMorphology(stem + "으/세요");
		}
	}

	const suppletiveKo = HONORIFIC_VERB_SUPPLETIONS.get(verbKo);
	const effectiveVerbKo = suppletiveKo || verbKo;
	const effectiveUnit = suppletiveKo ? getVerbUnit(suppletiveKo) : verbUnit;

	if (suppletiveKo) {
		const stem = getStem(suppletiveKo);
		const base = stem.slice(0, -1);
		switch (formality) {
			case "formal":
			case "formal_polite":
				return base + "십니다";
			case "formal_question":
				return base + "십니까?";
			case "past":
			case "past_polite":
				return base + "셨어요";
			case "past_formal":
				return base + "셨습니다";
			case "imperative":
			case "imperative_polite":
				return base + "세요";
			case "imperative_formal":
				return stem + "십시오";
			case "informal":
			case "banmal":
				return base + "셔";
			case "stem":
				return stem;
			case "polite":
			case "polite_informal":
			default:
				return base + "세요";
		}
	}

	const conj = effectiveUnit ? effectiveUnit[DATA_SCHEMA.Conjugation] : "";
	const stem = getConjugatedStem(effectiveVerbKo, conj);

	switch (formality) {
		case "formal":
		case "formal_polite":
			return applyMorphology(stem + "으/십니다");
		case "formal_question":
			return applyMorphology(stem + "으/십니까?");
		case "past":
		case "past_polite":
			return applyMorphology(stem + "으/셨어요");
		case "past_formal":
			return applyMorphology(stem + "으/셨습니다");
		case "imperative":
		case "imperative_polite":
			return applyMorphology(stem + "으/세요");
		case "imperative_formal":
			return applyMorphology(stem + "으/십시오");
		case "informal":
		case "banmal":
			return applyMorphology(stem + "으/셔");
		case "stem":
			return applyMorphology(stem + "으/시");
		case "polite":
		case "polite_informal":
		default:
			return applyMorphology(stem + "으/세요");
	}
}

function getHumblePredicate(verbOrKo, formality = "polite", options = {}) {
	const verbUnit = getVerbUnit(verbOrKo);
	const verbKo = verbUnit ? verbUnit[DATA_SCHEMA.Korean] : (typeof verbOrKo === 'string' ? verbOrKo : "");
	if (!verbKo) return "";

	const humbleKo = HUMBLE_VERB_SUPPLETIONS.get(verbKo) || verbKo;
	const humbleUnit = getVerbUnit(humbleKo);

	if (humbleKo === "여쭙다") {
		switch (formality) {
			case "formal":
			case "formal_polite":
				return "여쭙니다";
			case "formal_question":
				return "여쭙니까?";
			case "past":
			case "past_polite":
				return "여쭸어요";
			case "past_formal":
				return "여쭸습니다";
			case "informal":
			case "banmal":
				return "여쭤";
			case "stem":
				return "여쭙";
			case "polite":
			case "polite_informal":
			default:
				return "여쭤요";
		}
	}

	if (humbleKo === "뵙다") {
		switch (formality) {
			case "formal":
			case "formal_polite":
				return "뵙습니다";
			case "formal_question":
				return "뵙습니까?";
			case "past":
			case "past_polite":
				return "뵀어요";
			case "past_formal":
				return "뵀습니다";
			case "informal":
			case "banmal":
				return "봬";
			case "stem":
				return "뵙";
			case "polite":
			case "polite_informal":
			default:
				return "봬요";
		}
	}

	const conj = humbleUnit ? humbleUnit[DATA_SCHEMA.Conjugation] : "";
	const stem = getConjugatedStem(humbleKo, conj);

	switch (formality) {
		case "formal":
		case "formal_polite":
			return applyMorphology(stem + "습니다/ㅂ니다");
		case "formal_question":
			return applyMorphology(stem + "습니까/ㅂ니까?");
		case "past":
		case "past_polite":
			return applyMorphology(stem + "았/었어요");
		case "past_formal":
			return applyMorphology(stem + "았/었습니다");
		case "informal":
		case "banmal":
			return applyMorphology(stem + "아/어");
		case "stem":
			return stem;
		case "polite":
		case "polite_informal":
		default:
			return applyMorphology(stem + "아/어요");
	}
}

function applyHonorificConcord(input, options = {}) {
	if (typeof input === 'object' && input !== null) {
		const subj = input.subject || options.subject;
		const isElder = isElderNoun(subj) || options.honorific === true;
		const recip = input.recipient || options.recipient || options.dativeRecipient;
		const isElderRecip = isElderNoun(recip) || options.dativeType === "honorific";

		let verb = input.verb || options.verb;
		let noun = input.noun || options.noun;
		let pronoun = input.pronoun || options.pronoun;

		if (isElder) {
			if (verb) {
				const hv = getHonorificVerb(verb);
				if (hv) verb = getVerbUnit(hv) || hv;
			}
			if (noun) {
				const hn = getHonorificNoun(noun);
				if (hn) noun = getNounUnit(hn) || hn;
			}
		}

		if (isElderRecip && verb) {
			const uv = getHumbleVerb(verb);
			if (uv) verb = getVerbUnit(uv) || uv;
		}

		if ((isElder || isElderRecip) && pronoun) {
			const hp = getHumblePronoun(pronoun);
			if (hp) pronoun = hp;
		}

		let text = input.text || "";
		if (text) {
			text = applyHonorificConcord(text, { ...options, subject: subj, recipient: recip });
		}

		return { text, subject: subj, verb, noun, recipient: recip, pronoun };
	}

	let str = String(input);

	for (const elder of ELDER_NOUN_TITLES) {
		const subjRegex = new RegExp(`(^|[^가-힣])(${elder})(이|가)([^가-힣]|$)`, 'g');
		str = str.replace(subjRegex, '$1$2께서$4');

		const topRegex = new RegExp(`(^|[^가-힣])(${elder})는([^가-힣]|$)`, 'g');
		str = str.replace(topRegex, '$1$2께서는$3');

		const datRegex = new RegExp(`(^|[^가-힣])(${elder})(에게|한테)([^가-힣]|$)`, 'g');
		str = str.replace(datRegex, '$1$2께$4');
	}

	str = str.replace(/([가-힣]+님)(이|가)([^가-힣]|$)/g, '$1께서$3');
	str = str.replace(/([가-힣]+님)(에게|한테)([^가-힣]|$)/g, '$1께$3');

	const isElderContext = options.honorific === true || (options.subject && isElderNoun(options.subject)) || /께서/.test(str);
	if (isElderContext) {
		for (const [plain, hon] of HONORIFIC_NOUN_SUPPLETIONS.entries()) {
			const nounRegex = new RegExp(`(^|[^가-힣])(${plain})([을를이가은는의도]?)([^가-힣]|$)`, 'g');
			str = str.replace(nounRegex, (m, pre, base, part, post) => {
				const attached = part ? attachParticle(hon, part === '을' || part === '를' ? 'object' : part === '이' || part === '가' ? 'subject' : part === '은' || part === '는' ? 'topic' : part === '의' ? 'genitive' : 'additive') : hon;
				return pre + attached + post;
			});
		}

		str = str.replace(/(^|[^가-힣])자(요|다|고|며|서)([^가-힣]|$)/g, '$1주무세$2$3');
		str = str.replace(/(^|[^가-힣])잡니다([^가-힣]|$)/g, '$1주무십니다$2');
		str = str.replace(/(^|[^가-힣])잤어요([^가-힣]|$)/g, '$1주무셨어요$2');
		str = str.replace(/(^|[^가-힣])잤습니다([^가-힣]|$)/g, '$1주무셨습니다$2');

		str = str.replace(/(^|[^가-힣])먹(어요|다|고|으며|어서)([^가-힣]|$)/g, (m, pre, end, post) => {
			const rep = end === '어요' ? '드세요' : end === '다' ? '드시다' : end === '고' ? '드시고' : end === '으며' ? '드시며' : '드셔서';
			return pre + rep + post;
		});
		str = str.replace(/(^|[^가-힣])먹습니다([^가-힣]|$)/g, '$1드십니다$2');
		str = str.replace(/(^|[^가-힣])먹었어요([^가-힣]|$)/g, '$1드셨어요$2');
		str = str.replace(/(^|[^가-힣])먹었습니다([^가-힣]|$)/g, '$1드셨습니다$2');

		str = str.replace(/(^|[^가-힣])마(셔요|시다|시고|셔서)([^가-힣]|$)/g, (m, pre, end, post) => {
			const rep = end === '셔요' ? '드세요' : end === '시다' ? '드시다' : end === '시고' ? '드시고' : '드셔서';
			return pre + rep + post;
		});
		str = str.replace(/(^|[^가-힣])마십니다([^가-힣]|$)/g, '$1드십니다$2');

		str = str.replace(/(^|[^가-힣])아(파요|프다|파서)([^가-힣]|$)/g, (m, pre, end, post) => {
			const rep = end === '파요' ? '편찮으세요' : end === '프다' ? '편찮으시다' : '편찮으셔서';
			return pre + rep + post;
		});
		str = str.replace(/(^|[^가-힣])아픕니다([^가-힣]|$)/g, '$1편찮으십니다$2');

		str = str.replace(/(^|[^가-힣])죽(었어요|었다|었습니다)([^가-힣]|$)/g, (m, pre, end, post) => {
			const rep = end === '었어요' ? '돌아가셨어요' : end === '었다' ? '돌아가셨다' : '돌아가셨습니다';
			return pre + rep + post;
		});
	}

	const isElderRecipContext = (options.recipient && isElderNoun(options.recipient)) || (options.dativeRecipient && isElderNoun(options.dativeRecipient)) || /께\s+/.test(str);
	if (isElderRecipContext) {
		str = str.replace(/(^|[^가-힣])주(어요|어|다|고|며|어서)([^가-힣]|$)/g, (m, pre, end, post) => {
			const rep = end === '어요' ? '드려요' : end === '어' ? '드려' : end === '다' ? '드리다' : end === '고' ? '드리고' : end === '며' ? '드리며' : '드려서';
			return pre + rep + post;
		});
		str = str.replace(/(^|[^가-힣])줘요([^가-힣]|$)/g, '$1드려요$2');
		str = str.replace(/(^|[^가-힣])줍니다([^가-힣]|$)/g, '$1드립니다$2');
		str = str.replace(/(^|[^가-힣])줬어요([^가-힣]|$)/g, '$1드렸어요$2');
		str = str.replace(/(^|[^가-힣])줬습니다([^가-힣]|$)/g, '$1드렸습니다$2');

		str = str.replace(/(^|[^가-힣])말(해요|합니다|하다|하고|해서)([^가-힣]|$)/g, (m, pre, end, post) => {
			const rep = end === '해요' ? '말씀드려요' : end === '합니다' ? '말씀드립니다' : end === '하다' ? '말씀드리다' : end === '하고' ? '말씀드리고' : '말씀드려서';
			return pre + rep + post;
		});

		str = str.replace(/(^|[^가-힣])물(어요|어|어서)([^가-힣]|$)/g, '$1여쭤$2$3');
		str = str.replace(/(^|[^가-힣])묻(습니다|다|고)([^가-힣]|$)/g, (m, pre, end, post) => {
			const rep = end === '습니다' ? '여쭙니다' : end === '다' ? '여쭙다' : '여쭈고';
			return pre + rep + post;
		});

		str = str.replace(/(^|[^가-힣])만(나요|납니다|나다|나서|나고)([^가-힣]|$)/g, (m, pre, end, post) => {
			const rep = end === '나요' ? '봬요' : end === '납니다' ? '뵙습니다' : end === '나다' ? '뵙다' : end === '나서' ? '봬서' : '뵙고';
			return pre + rep + post;
		});

		str = str.replace(/(^|[^가-힣])내가([^가-힣]|$)/g, '$1제가$2');
		str = str.replace(/(^|[^가-힣])나는([^가-힣]|$)/g, '$1저는$2');
		str = str.replace(/(^|[^가-힣])나를([^가-힣]|$)/g, '$1저를$2');
		str = str.replace(/(^|[^가-힣])우리가([^가-힣]|$)/g, '$1저희가$2');
		str = str.replace(/(^|[^가-힣])우리는([^가-힣]|$)/g, '$1저희는$2');
	}

	return str;
}

function validateHonorificConcord(input, context = {}) {
	const errors = [];
	const text = typeof input === 'string' ? input : (input && input.text ? input.text : "");
	const subj = (input && input.subject) || context.subject;
	const recip = (input && input.recipient) || context.recipient || context.dativeRecipient;
	const verb = (input && input.verb) || context.verb;
	const noun = (input && input.noun) || context.noun;

	const verbKo = verb ? (typeof verb === 'string' ? verb : verb[DATA_SCHEMA.Korean]) : "";
	const nounKo = noun ? (typeof noun === 'string' ? noun : noun[DATA_SCHEMA.Korean]) : "";
	const subjKo = subj ? (typeof subj === 'string' ? subj : subj[DATA_SCHEMA.Korean]) : "";
	const recipKo = recip ? (typeof recip === 'string' ? recip : recip[DATA_SCHEMA.Korean]) : "";

	const isSubjectElder = isElderNoun(subj, subjKo) || context.honorific === true || /께서/.test(text);
	const isRecipientElder = isElderNoun(recip, recipKo) || /께\s+/.test(text) || context.dativeType === "honorific";

	if (context.honorific === true || isElderNoun(subj, subjKo)) {
		if (subjKo) {
			const hasPlainSubj = new RegExp(`(^|[^가-힣])${subjKo}(이|가)([^가-힣]|$)`).test(text);
			if (hasPlainSubj) {
				errors.push(`Elder subject '${subjKo}' must take honorific subject particle '-께서', not '-이/가'`);
			}
		}
	}

	if (isSubjectElder) {
		if (verbKo && FORBIDDEN_PLAIN_WORDS_FOR_ELDERS.has(verbKo)) {
			const honVerb = HONORIFIC_VERB_SUPPLETIONS.get(verbKo);
			errors.push(`Respected elder subject cannot use plain verb '${verbKo}' (supplete to '${honVerb}')`);
		}
		if (/(^|[^가-힣])(자요|잡니다|자다|자고|잤어요|잤다)([^가-힣]|$)/.test(text)) {
			errors.push(`Forbidden plain verb '자다' used with respected elder subject (expected '주무시다')`);
		}
		if (/(^|[^가-힣])(먹어요|먹습니다|먹다|먹고|먹었어요|먹었다)([^가-힣]|$)/.test(text)) {
			errors.push(`Forbidden plain verb '먹다' used with respected elder subject (expected '드시다')`);
		}
		if (/(^|[^가-힣])(마셔요|마십니다|마시다|마셨어요)([^가-힣]|$)/.test(text)) {
			errors.push(`Forbidden plain verb '마시다' used with respected elder subject (expected '드시다')`);
		}
		if (/(^|[^가-힣])(아파요|아픕니다|아프다|아팠어요)([^가-힣]|$)/.test(text)) {
			errors.push(`Forbidden plain verb '아프다' used with respected elder subject (expected '편찮으시다')`);
		}
		if (/(^|[^가-힣])(죽었어요|죽었다|죽습니다|죽다)([^가-힣]|$)/.test(text)) {
			errors.push(`Forbidden plain verb '죽다' used with respected elder subject (expected '돌아가시다')`);
		}

		if (verbKo && HUMBLE_WORDS.has(verbKo)) {
			errors.push(`Respected elder subject cannot use humble verb '${verbKo}' for own action`);
		}
		if (/(^|[^가-힣])(말씀드렸|말씀드립|말씀드려|여쭸|여쭈었|여쭙|여쭤|뵀|뵈었|뵙|도와드렸|도와드립|보여드렸|보여드립)/.test(text)) {
			errors.push(`Respected elder subject cannot use humble verb for own action`);
		}

		if (nounKo && HONORIFIC_NOUN_SUPPLETIONS.has(nounKo)) {
			const honNoun = HONORIFIC_NOUN_SUPPLETIONS.get(nounKo);
			errors.push(`Plain noun '${nounKo}' should be honorific suppletion '${honNoun}' when referring to respected elder`);
		}
		if (/(^|[^가-힣])밥(을|이|은|도)?([^가-힣]|$)/.test(text) && /(드|잡수)/.test(text)) {
			errors.push(`Plain noun '밥' should be honorific suppletion '진지' with honorific consumption verb`);
		}
		if (/(^|[^가-힣])나이(가|는|를)?([^가-힣]|$)/.test(text) && /(많으시|어떻게 되)/.test(text)) {
			errors.push(`Plain noun '나이' should be honorific suppletion '연세' for elder`);
		}
	}

	if (isRecipientElder) {
		if (recipKo) {
			const hasPlainDative = new RegExp(`(^|[^가-힣])${recipKo}(에게|한테)([^가-힣]|$)`).test(text);
			if (hasPlainDative) {
				errors.push(`Elder recipient '${recipKo}' must take honorific dative '-께', not '-에게/-한테'`);
			}
		}

		if (verbKo && HUMBLE_VERB_SUPPLETIONS.has(verbKo)) {
			const humble = HUMBLE_VERB_SUPPLETIONS.get(verbKo);
			errors.push(`Elder recipient requires humble verb '${humble}', not plain verb '${verbKo}'`);
		}
		if (/(^|[^가-힣])(줘요|줍니다|주다|주고|줬어요|줬다)([^가-힣]|$)/.test(text)) {
			errors.push(`Elder recipient requires humble verb '드리다', not '주다'`);
		}
		if (/(^|[^가-힣])(말해요|말합니다|말하다|말하고|말했어요)([^가-힣]|$)/.test(text)) {
			errors.push(`Elder recipient requires humble verb '말씀드리다', not '말하다'`);
		}
		if (/(^|[^가-힣])(물어요|묻습니다|묻다|물었어요)([^가-힣]|$)/.test(text)) {
			errors.push(`Elder recipient requires humble verb '여쭙다' or '여쭈어보다', not '묻다'`);
		}

		if (/(^|[^가-힣])(내가|나는|나를|나에게|나한테)([^가-힣]|$)/.test(text)) {
			errors.push(`Informal 1st-person pronoun '나/내' cannot be used with elder recipient; use humble '저/제'`);
		}
	}

	return {
		valid: errors.length === 0,
		errors
	};
}

function validateTemporalConcord(input, context = {}) {
	const errors = [];
	const text = typeof input === 'string' ? input : (input && input.text ? input.text : "");
	if (!text) return { valid: true, errors: [] };

	// 1. Deictic time particle prohibition (*오늘에, *어제에, *내일에, *지금에)
	for (const bare of BARE_TIME_WORDS_NO_PARTICLE) {
		const deicticParticleRegex = new RegExp(`(^|[^가-힣])(${bare})에([^가-힣]|$)`);
		if (deicticParticleRegex.test(text)) {
			errors.push(`Deictic temporal word '${bare}' cannot take time particle -에 (*${bare}에) in: "${text}"`);
		}
	}

	// 2. Identify temporal words present in text
	const foundPast = [];
	const foundFuture = [];
	for (const word of PAST_TIME_WORDS) {
		const reg = new RegExp(`(^|[^가-힣])${word}([^가-힣]|$)`);
		if (reg.test(text)) foundPast.push(word);
	}
	for (const word of FUTURE_TIME_WORDS) {
		const reg = new RegExp(`(^|[^가-힣])${word}([^가-힣]|$)`);
		if (reg.test(text)) foundFuture.push(word);
	}

	// 3. Identify verbal tense markers in text
	let hasPastPredicate = false;
	for (let i = 0; i < text.length; i++) {
		const ch = text[i];
		if (ch === '있' || ch === '없' || ch === '겠') continue;
		const d = decomposeHangul(ch);
		if (d && d.final === 20) { // ㅆ coda
			const rest = text.slice(i + 1);
			if (/^(?:어요|습니다|다|어|죠|던|네|소|ㅂ니다)/.test(rest)) {
				hasPastPredicate = true;
				break;
			}
		}
	}
	if (!hasPastPredicate) {
		hasPastPredicate = /(?:았|었|였|했|던|갔|봤|왔|잤)(?:어요|습니다|다|어|죠)/.test(text) && !/(았|었|였)으면\s*좋겠/.test(text);
	}

	// Future/prospective markers: -(으)ㄹ 거예요, -(으)ㄹ게요, -(으)려고 해요/합니다, -겠-, -을 건가요
	const hasFuturePredicate = /((?:거(?:예요|야|입니다|에요|요|다))|(?:(?:ㄹ|을)\s*게요|게요)|(?:(?:으)?려고\s*(?:해|합|하|그))|(?:겠(?:어요|습니다|다|어|죠))|(?:(?:ㄹ|을)\s*건가요|건가요|것인가요))/.test(text);

	// 4. Check for temporal contradictions
	if (foundPast.length > 0 && hasFuturePredicate) {
		errors.push(`Past temporal word(s) [${foundPast.join(', ')}] clash with prospective/future predicate in: "${text}"`);
	}
	if (foundFuture.length > 0 && hasPastPredicate) {
		errors.push(`Future temporal word(s) [${foundFuture.join(', ')}] clash with past predicate in: "${text}"`);
	}

	if (context.temporal_polarity === "past" && hasFuturePredicate) {
		errors.push(`Context requires past tense, but found future predicate in: "${text}"`);
	}
	if (context.temporal_polarity === "future" && hasPastPredicate) {
		errors.push(`Context requires future tense, but found past predicate in: "${text}"`);
	}

	return {
		valid: errors.length === 0,
		errors
	};
}

function applyTemporalConcord(input, options = {}) {
	if (typeof input === 'object' && input !== null) {
		let text = input.text || "";
		if (text) {
			text = applyTemporalConcord(text, options);
		}
		return { ...input, text };
	}

	let str = String(input);

	// Normalize deictic time + -에
	for (const bare of BARE_TIME_WORDS_NO_PARTICLE) {
		const deicticRegex = new RegExp(`(^|[^가-힣])(${bare})에([^가-힣]|$)`, 'g');
		str = str.replace(deicticRegex, '$1$2$3');
	}

	return str;
}

// =========================================================================
// Feature 6: Numeral-Classifier Matrix & Attributive Measure Word Syntax
// =========================================================================

// CLASSIFIER_NOUN_SPECS is dynamically populated from data.js in initSemanticSets()

function isClassifier(wordOrUnit) {
	if (!wordOrUnit) return false;
	const ko = typeof wordOrUnit === 'string' ? wordOrUnit : (Array.isArray(wordOrUnit) ? wordOrUnit[DATA_SCHEMA.Korean] : "");
	if (ko && (KOREAN_CLASSIFIERS.has(ko) || SINO_CLASSIFIERS.has(ko))) return true;
	if (typeof wordOrUnit === 'object' && Array.isArray(wordOrUnit)) {
		if (hasTag(wordOrUnit, "measureWord", "counter", "koreanMeasureWord", "sinoMeasureWord")) return true;
		const sv = parseSemanticVector(wordOrUnit);
		if (sv && sv.counter === true) return true;
	}
	return false;
}

function getClassifierNumeralType(classifierOrUnit) {
	if (!classifierOrUnit) return null;
	if (typeof classifierOrUnit === 'object' && Array.isArray(classifierOrUnit)) {
		if (hasTag(classifierOrUnit, "koreanMeasureWord")) return "pure";
		if (hasTag(classifierOrUnit, "sinoMeasureWord")) return "sino";
		const sv = parseSemanticVector(classifierOrUnit);
		if (sv && sv.numType) return sv.numType;
	}
	const ko = typeof classifierOrUnit === 'string' ? classifierOrUnit : (Array.isArray(classifierOrUnit) ? classifierOrUnit[DATA_SCHEMA.Korean] : "");
	if (ko && KOREAN_CLASSIFIERS.has(ko) && !SINO_CLASSIFIERS.has(ko)) return "pure";
	if (ko && SINO_CLASSIFIERS.has(ko) && !KOREAN_CLASSIFIERS.has(ko)) return "sino";
	if (ko && KOREAN_CLASSIFIERS.has(ko)) return "pure";
	if (ko && SINO_CLASSIFIERS.has(ko)) return "sino";
	return null;
}

function getMatchingClassifier(nounOrUnit) {
	const unit = typeof nounOrUnit === 'object' && Array.isArray(nounOrUnit) ? nounOrUnit : getNounUnit(nounOrUnit);
	const ko = typeof nounOrUnit === 'string' ? nounOrUnit : (unit ? unit[DATA_SCHEMA.Korean] : "");

	if (unit) {
		const sv = parseSemanticVector(unit);
		if (sv && sv.classifier) return sv.classifier;
		if (sv && sv.counter === true && (KOREAN_CLASSIFIERS.has(ko) || SINO_CLASSIFIERS.has(ko))) return ko;
	}

	// Iterate through dynamically loaded classifier specs from data.js in priority order
	for (const spec of CLASSIFIER_NOUN_SPECS) {
		if (spec.generalObject) continue; // Default object classifier evaluated as final fallback

		if (spec.honorificPerson) {
			if (isElderNoun(unit, ko) || (unit && hasTag(unit, "elder_noun", "elder", "honorific"))) {
				return spec.classifier;
			}
			continue;
		}

		if (spec.plainPerson) {
			if (!isElderNoun(unit, ko) && unit && spec.tags.some(t => hasTag(unit, t))) {
				return spec.classifier;
			}
			continue;
		}

		if (unit && spec.tags.some(t => hasTag(unit, t))) {
			return spec.classifier;
		}
	}

	// Final fallback: general object classifier from specs (e.g. 개)
	const generalSpec = CLASSIFIER_NOUN_SPECS.find(s => s.generalObject);
	if (generalSpec) return generalSpec.classifier;

	return CLASSIFIER_NOUN_SPECS.length > 0 ? CLASSIFIER_NOUN_SPECS[CLASSIFIER_NOUN_SPECS.length - 1].classifier : "";
}

function getMatchingNounsForClassifier(classifierOrUnit) {
	const ko = typeof classifierOrUnit === 'string' ? classifierOrUnit : (classifierOrUnit ? classifierOrUnit[DATA_SCHEMA.Korean] : "");
	const allNouns = getWords("Noun").filter(n => !hasTag(n, "measureWord") && !hasTag(n, "counter"));
	const spec = CLASSIFIER_NOUN_SPECS.find(s => s.classifier === ko || (s.unit && s.unit[DATA_SCHEMA.Korean] === ko));

	if (!spec) {
		return allNouns.filter(n => hasTag(n, "object") || hasTag(n, "item"));
	}

	let matched = allNouns.filter(n => {
		if (spec.honorificPerson) {
			return isElderNoun(n);
		}
		if (spec.plainPerson) {
			return spec.tags.some(t => hasTag(n, t)) && !isElderNoun(n);
		}
		if (spec.generalObject) {
			if (spec.incompatibleTags && spec.incompatibleTags.some(t => hasTag(n, t))) return false;
			if (isElderNoun(n)) return false;
			return spec.tags.some(t => hasTag(n, t));
		}
		return spec.tags.some(t => hasTag(n, t));
	});

	if (matched.length === 0 && spec.fallbackTag) {
		matched = allNouns.filter(n => hasTag(n, spec.fallbackTag));
	}
	return matched;
}

function getClassifierCandidatesForNoun(nounOrUnit) {
	const unit = typeof nounOrUnit === 'object' && Array.isArray(nounOrUnit) ? nounOrUnit : getNounUnit(nounOrUnit);
	const ko = typeof nounOrUnit === 'string' ? nounOrUnit : (unit ? unit[DATA_SCHEMA.Korean] : "");
	const candidates = new Set();

	// Primary preferred classifier first
	const primary = getMatchingClassifier(unit || ko);
	if (primary) candidates.add(primary);

	// Check compatibility against all registered classifier specs from data.js
	for (const spec of CLASSIFIER_NOUN_SPECS) {
		if (isCompatibleNounAndClassifier(unit || ko, spec.classifier)) {
			candidates.add(spec.classifier);
		}
	}

	return Array.from(candidates);
}

function isCompatibleNounAndClassifier(nounOrUnit, classifierOrUnit) {
	const clsKo = typeof classifierOrUnit === 'string' ? classifierOrUnit : (classifierOrUnit ? classifierOrUnit[DATA_SCHEMA.Korean] : "");
	if (!clsKo) return true;

	const spec = CLASSIFIER_NOUN_SPECS.find(s => s.classifier === clsKo || (s.unit && s.unit[DATA_SCHEMA.Korean] === clsKo));
	if (!spec) return true;

	function checkUnitCompat(nounUnit) {
		if (!nounUnit) return false;
		const nounKo = nounUnit[DATA_SCHEMA.Korean] || "";
		const sv = parseSemanticVector(nounUnit);
		if (sv && sv.classifier && sv.classifier === clsKo) return true;

		if (spec.generalObject) {
			if (isElderNoun(nounUnit, nounKo)) return false;
			if (spec.incompatibleTags && spec.incompatibleTags.some(t => hasTag(nounUnit, t))) return false;
			return true;
		}

		if (spec.honorificPerson) {
			return isElderNoun(nounUnit, nounKo) || hasTag(nounUnit, "elder_noun", "elder", "honorific");
		}

		if (spec.plainPerson) {
			return spec.tags.some(t => hasTag(nounUnit, t));
		}

		return spec.tags.some(t => hasTag(nounUnit, t));
	}

	if (Array.isArray(nounOrUnit)) {
		return checkUnitCompat(nounOrUnit);
	}

	const nounKo = typeof nounOrUnit === 'string' ? nounOrUnit : "";
	if (!nounKo) return true;

	const matchingUnits = getAllNounUnits(nounKo);
	if (matchingUnits.length > 0) {
		return matchingUnits.some(u => checkUnitCompat(u));
	}

	return spec.generalObject === true;
}

function buildCountingPhrase(nounOrUnit, count = 1, options = {}) {
	const nounUnit = typeof nounOrUnit === 'object' && Array.isArray(nounOrUnit) ? nounOrUnit : getNounUnit(nounOrUnit);
	const nounKo = typeof nounOrUnit === 'string' ? nounOrUnit : (nounUnit ? nounUnit[DATA_SCHEMA.Korean] : "");

	let classifier = options.classifier;
	if (!classifier) {
		classifier = getMatchingClassifier(nounUnit || nounKo);
	}
	const classifierKo = typeof classifier === 'object' && Array.isArray(classifier) ? classifier[DATA_SCHEMA.Korean] : classifier;
	const numType = options.numType || getClassifierNumeralType(classifierKo) || "pure";

	let numStr = "";
	if (numType === "pure") {
		numStr = getKoreanNumber(count, true); // Attributive form: 한, 두, 세, 네, 다섯...
	} else {
		numStr = getSinoNumber(count);
	}

	if (options.prenominal) {
		let base = `${numStr} ${classifierKo}의 ${nounKo}`;
		if (options.particle) {
			base = attachParticle(base, options.particle, options.verb);
		}
		return base;
	}

	let phrase = `${nounKo} ${numStr} ${classifierKo}`;
	if (options.particle) {
		phrase = `${nounKo} ${numStr} ` + attachParticle(classifierKo, options.particle, options.verb, options);
	}
	return phrase;
}

function buildClockTimePhrase(hour, minute = 0) {
	if (hour < 1 || hour > 12) throw new Error(`Clock hour must be 1..12, got ${hour}`);
	const hourStr = `${getKoreanNumber(hour, true)} 시`;
	if (minute === undefined || minute === null || minute === 0) {
		return hourStr;
	}
	if (minute < 0 || minute > 59) throw new Error(`Clock minute must be 0..59, got ${minute}`);
	return `${hourStr} ${getSinoNumber(minute)} 분`;
}

function getMonthName(monthNum) {
	if (monthNum < 1 || monthNum > 12) throw new Error(`Month must be 1..12, got ${monthNum}`);
	if (monthNum === 6) return "유월";
	if (monthNum === 10) return "시월";
	return `${getSinoNumber(monthNum)}월`;
}

function applyCounterConcord(text) {
	if (!text || typeof text !== 'string') return text;
	let s = text;

	const pureCounters = Array.from(KOREAN_CLASSIFIERS || []).filter(c => c !== "번" && c !== "분");
	if (pureCounters.length > 0) {
		const counterPattern = pureCounters.join('|');
		const suffix = '((?:[을를이가은는의도]|(?:에게|한테|으로|로|입니다|입니까|이에요|예요|이다|이고|이면))?)(?=[^가-힣]|$)';

		// Single digit cardinal pure numbers: 하나 -> 한, 둘 -> 두, 셋 -> 세, 넷 -> 네, 스물 -> 스무
		s = s.replace(new RegExp(`(^|[^가-힣])하나\\s+(${counterPattern})${suffix}`, 'g'), '$1한 $2$3');
		s = s.replace(new RegExp(`(^|[^가-힣])둘\\s+(${counterPattern})${suffix}`, 'g'), '$1두 $2$3');
		s = s.replace(new RegExp(`(^|[^가-힣])셋\\s+(${counterPattern})${suffix}`, 'g'), '$1세 $2$3');
		s = s.replace(new RegExp(`(^|[^가-힣])넷\\s+(${counterPattern})${suffix}`, 'g'), '$1네 $2$3');
		s = s.replace(new RegExp(`(^|[^가-힣])스물\\s+(${counterPattern})${suffix}`, 'g'), '$1스무 $2$3');

		// Tens compound numerals: 열하나 -> 열한, 열둘 -> 열두, 열셋 -> 열세, 열넷 -> 열네, etc.
		const tensPrefixes = "열|스물|서른|마흔|쉰|예순|일흔|여든|아흔";
		s = s.replace(new RegExp(`(^|[^가-힣])(${tensPrefixes})하나\\s+(${counterPattern})${suffix}`, 'g'), '$1$2한 $3$4');
		s = s.replace(new RegExp(`(^|[^가-힣])(${tensPrefixes})둘\\s+(${counterPattern})${suffix}`, 'g'), '$1$2두 $3$4');
		s = s.replace(new RegExp(`(^|[^가-힣])(${tensPrefixes})셋\\s+(${counterPattern})${suffix}`, 'g'), '$1$2세 $3$4');
		s = s.replace(new RegExp(`(^|[^가-힣])(${tensPrefixes})넷\\s+(${counterPattern})${suffix}`, 'g'), '$1$2네 $3$4');
	}

	// Month phonological reduction: 육월 -> 유월, 십월 -> 시월
	s = s.replace(/(^|[^가-힣])육\s*월(?=[^가-힣]|$|[을를이가은는의도]|(?:에|에서|부터|까지|으로|로))/g, '$1유월');
	s = s.replace(/(^|[^가-힣])십\s*월(?=[^가-힣]|$|[을를이가은는의도]|(?:에|에서|부터|까지|으로|로))/g, '$1시월');

	return s;
}

function validateCounterConcord(input, context = {}) {
	const errors = [];
	const text = typeof input === 'string' ? input : (input && input.text ? input.text : "");
	if (!text) return { valid: true, errors: [] };

	const pureCounters = Array.from(KOREAN_CLASSIFIERS || []).filter(c => c !== "번" && c !== "분");
	const sinoCounters = Array.from(SINO_CLASSIFIERS || []).filter(c => c !== "번" && c !== "분");
	const counterSuffix = '(?:(?:[을를이가은는의도]|(?:에게|한테|으로|로|입니다|입니까|이에요|예요|이다|이고|이면|에|에서|부터|까지|쯤|전|후))?)(?=[^가-힣]|$)';

	// 1. Cardinal Pure Numbers preceding Pure Counter (must be attributive 한, 두, 세, 네, 스무)
	if (pureCounters.length > 0) {
		const cardinalRegex = new RegExp(`(^|[^가-힣])((?:(?:열|스물|서른|마흔|쉰|예순|일흔|여든|아흔)?(?:하나|둘|셋|넷)|스물))\\s+(${pureCounters.join('|')})${counterSuffix}`, 'g');
		let cardMatch;
		while ((cardMatch = cardinalRegex.exec(text)) !== null) {
			errors.push(`Cardinal pure Korean number '${cardMatch[2]}' used before counter '${cardMatch[3]}'; expected attributive form (한/두/세/네/스무) in: "${text}"`);
		}

		// 2. Sino Numbers used with Pure Counters (*일 개, *이 명, *삼 마리, *사 권, *오 병)
		const sinoNumerals = "일|이|삼|사|오|육|칠|팔|구|십|십일|십이|십삼|십사|십오|이십";
		const sinoWithPureRegex = new RegExp(`(^|[^가-힣])(${sinoNumerals})\\s+(${pureCounters.join('|')})${counterSuffix}`, 'g');
		let sinoMatch;
		while ((sinoMatch = sinoWithPureRegex.exec(text)) !== null) {
			errors.push(`Sino-Korean numeral '${sinoMatch[2]}' cannot be used with native Korean counter '${sinoMatch[3]}' in: "${text}"`);
		}
	}

	// 3. Pure Numbers used with Sino Counters (*세 개월, *두 년, *다섯 층, *한 원, *두 인분)
	if (sinoCounters.length > 0) {
		const pureNumerals = "한|두|세|네|다섯|여섯|일곱|여덟|아홉|열|열한|열두|열세|열네|열다섯|스무|스물한";
		const pureWithSinoRegex = new RegExp(`(^|[^가-힣])(${pureNumerals})\\s+(${sinoCounters.join('|')})${counterSuffix}`, 'g');
		let pureMatch;
		while ((pureMatch = pureWithSinoRegex.exec(text)) !== null) {
			errors.push(`Native Korean numeral '${pureMatch[2]}' cannot be used with Sino-Korean counter '${pureMatch[3]}' in: "${text}"`);
		}
	}

	// 4. Pure Clock minutes (*세 시 셋 분 -> Sino minute required)
	const pureMinNumerals = "하나|둘|셋|넷|한|두|세|네|다섯|여섯|일곱|여덟|아홉|열|열하나|열둘|열셋|열넷|열한|열두|열세|열네|열다섯|스무|스물";
	const pureMinuteRegex = new RegExp(`(^|[^가-힣])(?:시)\\s+(${pureMinNumerals})\\s+분${counterSuffix}`, 'g');
	if (pureMinuteRegex.test(text)) {
		errors.push(`Clock minutes must use Sino-Korean numerals, not native Korean in: "${text}"`);
	}

	// 5. Sino Clock hour (*일 시 -> Pure hour required)
	const sinoNumerals = "일|이|삼|사|오|육|칠|팔|구|십|십일|십이";
	const sinoHourRegex = new RegExp(`(^|[^가-힣])(${sinoNumerals})\\s+시${counterSuffix}`, 'g');
	let sinoHourMatch;
	while ((sinoHourMatch = sinoHourRegex.exec(text)) !== null) {
		errors.push(`Clock hours must use native Korean numerals (한 시, 두 시), not Sino numeral '${sinoHourMatch[2]}' in: "${text}"`);
	}

	// 6. Month phonological reduction (*육월 -> 유월, *십월 -> 시월)
	if (/(^|[^가-힣])육\s*월(?=[^가-힣]|$|[을를이가은는의도]|(?:에|에서|부터|까지|으로|로))/.test(text)) {
		errors.push(`Month 6 must be phonologically reduced to '유월', not '*육월' in: "${text}"`);
	}
	if (/(^|[^가-힣])십\s*월(?=[^가-힣]|$|[을를이가은는의도]|(?:에|에서|부터|까지|으로|로))/.test(text)) {
		errors.push(`Month 10 must be phonologically reduced to '시월', not '*십월' in: "${text}"`);
	}

	// 7. Noun-Classifier Category Concord
	const countingPhraseRegex = /([가-힣]+)\s+(?:한|두|세|네|다섯|여섯|일곱|여덟|아홉|열|스무|\d+)\s+([가-힣]+)/g;
	let phraseMatch;
	while ((phraseMatch = countingPhraseRegex.exec(text)) !== null) {
		const nounCandidate = phraseMatch[1];
		const rawCls = phraseMatch[2];
		const clsCandidate = rawCls.replace(/(?:[을를이가은는의도]|(?:에게|한테|으로|로|입니다|입니까|이에요|예요|이다|이고|이면))$/, '');
		if (KOREAN_CLASSIFIERS.has(clsCandidate) || SINO_CLASSIFIERS.has(clsCandidate)) {
			if (!isCompatibleNounAndClassifier(nounCandidate, clsCandidate)) {
				errors.push(`Noun '${nounCandidate}' is semantically incompatible with classifier '${clsCandidate}' in: "${text}"`);
			}
		}
	}

	return {
		valid: errors.length === 0,
		errors
	};
}

/**
 * Attaches the appropriate grammatical case or semantic particle to a noun,
 * performing phonological batchim concord, honorific suppletion, animacy differentiation,
 * and locative static-vs-dynamic duality.
 *
 * @param {Array|string} noun - The noun language unit array or Korean surface string.
 * @param {string} particleType - Particle category (object, subject, topic, dative, location, instrumental, etc.).
 * @param {Array|string|null} verb - Optional verb language unit or Korean string for contextual concord.
 * @param {Object} options - Optional configuration ({ spoken, locativeType, dativeType, honorific }).
 * @returns {string} Noun with appropriately attached case particle.
 */
function attachParticle(noun, particleType, verb = null, options = {}) {
	const nounUnit = getNounUnit(noun);
	const nounKo = typeof noun === 'string' ? noun : (nounUnit ? nounUnit[DATA_SCHEMA.Korean] : "");
	if (!nounKo) return "";

	const lastChar = nounKo.trim().slice(-1);
	const hasB = hasBatchim(lastChar);
	const hasRieul = hasRieulBatchim(lastChar);
	const verbUnit = getVerbUnit(verb);
	const verbKo = verbUnit ? verbUnit[DATA_SCHEMA.Korean] : (typeof verb === 'string' ? verb : "");

	switch (particleType) {
		case "object":
		case "accusative":
		case "obj":
			return nounKo + (hasB ? "을" : "를");

		case "subject":
		case "nominative":
		case "sub":
			if (options.honorific === true || (options.allowHonorificSubject && isElderNoun(nounUnit, nounKo))) {
				return nounKo + "께서";
			}
			return nounKo + (hasB ? "이" : "가");

		case "subject_honorific":
		case "honorific_subject":
			return nounKo + "께서";

		case "topic":
			if (options.honorific === true) {
				return nounKo + "께서는";
			}
			return nounKo + (hasB ? "은" : "는");

		case "topic_honorific":
		case "honorific_topic":
			return nounKo + "께서는";

		case "dative": {
			const isHumble = (verbUnit && hasTag(verbUnit, "humbleVerb", "dative_humble")) || HUMBLE_DATIVE_VERBS.has(verbKo);
			if (options.dativeType === "honorific" || options.honorific === true || isElderNoun(nounUnit, nounKo) || isHumble) {
				return nounKo + "께";
			}
			if (options.dativeType === "inanimate" || isInanimateInstitution(nounUnit, nounKo)) {
				return nounKo + "에";
			}
			if (options.dativeType === "spoken" || options.spoken === true || options.formality === "spoken") {
				return nounKo + "한테";
			}
			return nounKo + "에게";
		}

		case "dative_honorific":
			return nounKo + "께";

		case "dative_inanimate":
			return nounKo + "에";

		case "dative_spoken":
			return nounKo + "한테";

		case "dative_person":
		case "dative_animate":
			return (options.spoken === true || options.formality === "spoken") ? nounKo + "한테" : nounKo + "에게";

		case "location":
		case "locative": {
			if (options.locativeType === "dynamic" || options.locativeType === "origin") return nounKo + "에서";
			if (options.locativeType === "static" || options.locativeType === "goal" || options.locativeType === "destination") return nounKo + "에";

			if (verbUnit || verbKo) {
				const isOrigin = (verbUnit && hasTag(verbUnit, "origin", "departure", "locative_origin")) || ORIGIN_VERBS.has(verbKo);
				if (isOrigin) return nounKo + "에서";

				const isAllative = (verbUnit && hasTag(verbUnit, "allative", "destination", "goal", "locative_goal")) || ALLATIVE_GOAL_VERBS.has(verbKo);
				if (isAllative) return nounKo + "에";

				const isStatic = (verbUnit && hasTag(verbUnit, "static", "existence", "residence", "locative_static")) || STATIC_EXISTENCE_VERBS.has(verbKo);
				if (isStatic) return nounKo + "에";

				const pos = verbUnit ? verbUnit[DATA_SCHEMA.PartofSpeech] : "";
				if (pos === "Action Verb" || (!pos && !ALLATIVE_GOAL_VERBS.has(verbKo) && !STATIC_EXISTENCE_VERBS.has(verbKo))) {
					return nounKo + "에서";
				}
			}
			return nounKo + "에";
		}

		case "location_dynamic":
		case "dynamic_location":
			return nounKo + "에서";

		case "location_static":
		case "static_location":
			return nounKo + "에";

		case "location_origin":
		case "origin":
		case "departure":
			return nounKo + "에서";

		case "location_goal":
		case "destination":
		case "allative":
			return nounKo + "에";

		case "instrumental":
		case "instrument":
		case "direction":
		case "-(으)로":
		case "로":
			return nounKo + (!hasB || hasRieul ? "로" : "으로");

		case "comitative":
		case "and_with":
			if (options.spoken === true || options.formality === "spoken") return nounKo + "하고";
			if (options.formality === "informal") return nounKo + (hasB ? "이랑" : "랑");
			return nounKo + (hasB ? "과" : "와");

		case "source_person":
		case "ablative_person":
			return (options.spoken === true || options.formality === "spoken") ? nounKo + "한테서" : nounKo + "에게서";

		case "genitive":
			return nounKo + "의";

		case "additive":
			return nounKo + "도";

		case "plural":
			return nounKo + "들";

		case "time":
		case "temporal":
			if (isDeicticTimeWord(nounUnit, nounKo)) {
				return (options.topic === true) ? nounKo + (hasB ? "은" : "는") : nounKo;
			}
			return nounKo + "에";

		default:
			return nounKo;
	}
}

function buildActionVerbPhrase(word, stem, chosenNoun = null, options = {}) {
	let activeWord = word;
	let activeStem = stem;

	const isSubjectElder = options.honorific === true || (options.subject && isElderNoun(options.subject));
	const isRecipientElder = (options.recipient && isElderNoun(options.recipient)) || (options.dativeRecipient && isElderNoun(options.dativeRecipient)) || options.dativeType === "honorific";

	if (isSubjectElder) {
		const suppletiveKo = getHonorificVerb(activeWord);
		if (suppletiveKo) {
			const suppletiveUnit = getVerbUnit(suppletiveKo);
			if (suppletiveUnit) {
				activeWord = suppletiveUnit;
				activeStem = getConjugatedStem(suppletiveKo, suppletiveUnit[DATA_SCHEMA.Conjugation]);
			} else {
				activeStem = getStem(suppletiveKo);
			}
		}
	}

	if (isRecipientElder) {
		const humbleKo = getHumbleVerb(activeWord);
		if (humbleKo) {
			const humbleUnit = getVerbUnit(humbleKo);
			if (humbleUnit) {
				activeWord = humbleUnit;
				activeStem = getConjugatedStem(humbleKo, humbleUnit[DATA_SCHEMA.Conjugation]);
			} else {
				activeStem = getStem(humbleKo);
			}
		}
	}

	const isPureIntransitive = (hasTag(activeWord, "intransitive_general") || hasTag(activeWord, "intransitive_motion") || hasTag(activeWord, "intransitive_place"))
		&& !ACTION_VERB_SPECS.some(s => s.particle === "object" && hasTag(activeWord, s.tag))
		&& !parseSemanticVector(activeWord).collocation_filter;

	if (isPureIntransitive) {
		if (hasTag(activeWord, "intransitive_motion") || hasTag(activeWord, "intransitive_place")) {
			const placeNoun = chosenNoun || getRandom(getFilteredWords("Noun", "place")) || getRandom(getWords("Noun", "place"));
			if (placeNoun) {
				markUnitUsed(placeNoun);
				return { text: `${attachParticle(placeNoun, "location", activeWord, options)} ${activeStem}`, noun: placeNoun, verb: activeWord };
			}
		}
		return { text: activeStem, noun: null, verb: activeWord };
	}

	let noun = chosenNoun;
	if (!noun) {
		const candidates = getNounCandidatesForVerb(activeWord);
		noun = getRandom(candidates);
		if (noun) markUnitUsed(noun);
	}
	if (!noun) return { text: activeStem, noun: null, verb: activeWord };

	if (isSubjectElder) {
		const suppletiveNounKo = getHonorificNoun(noun);
		if (suppletiveNounKo) {
			const suppletiveNounUnit = getNounUnit(suppletiveNounKo);
			if (suppletiveNounUnit) noun = suppletiveNounUnit;
		}
	}

	const particleType = getVerbParticleType(activeWord);
	const particleOptions = { ...options };
	if (isRecipientElder && (particleType === "dative" || particleType === "dative_person")) {
		particleOptions.dativeType = "honorific";
	}

	return { text: `${attachParticle(noun, particleType, activeWord, particleOptions)} ${activeStem}`, noun, verb: activeWord };
}

function buildDescriptiveVerbPhrase(word, stem, chosenNoun = null, options = {}) {
	let noun = chosenNoun;
	if (!noun) {
		const candidates = getSubjectCandidatesForDescriptiveVerb(word);
		noun = getRandom(candidates);
		if (noun) markUnitUsed(noun);
	}
	if (!noun) return { text: stem, noun: null, verb: word };

	let activeWord = word;
	let activeStem = stem;
	const isHonorificMode = options.honorific === true;
	const isElder = isElderNoun(noun);

	if (isHonorificMode && isElder) {
		const suppletiveKo = getHonorificVerb(activeWord);
		if (suppletiveKo) {
			const suppletiveUnit = getVerbUnit(suppletiveKo);
			if (suppletiveUnit) {
				activeWord = suppletiveUnit;
				activeStem = getConjugatedStem(suppletiveKo, suppletiveUnit[DATA_SCHEMA.Conjugation]);
			} else {
				activeStem = getStem(suppletiveKo);
			}
		}
	}

	const particleOptions = { ...options };
	if (isHonorificMode && isElder) {
		particleOptions.allowHonorificSubject = true;
	}
	return { text: `${attachParticle(noun, "subject", activeWord, particleOptions)} ${activeStem}`, noun, verb: activeWord };
}

function expandSemanticVerb(pos, isAction, tokenType, currentContext, applyConstraint) {
	let words = getFilteredWords(pos);
	if (applyConstraint) {
		if (isAction && currentContext.req_domain) {
			const domainWords = words.filter(w => parseSemanticVector(w).domain === currentContext.req_domain);
			if (domainWords.length > 0) words = domainWords;
		} else if (!isAction && currentContext.logic === "cause_effect") {
			const matchingWords = words.filter(w => {
				const sv = parseSemanticVector(w);
				return (sv.polarity === currentContext.polarity) &&
					(sv.req === currentContext.produced_state || sv.req === "any" || sv.domain === "state");
			});
			if (matchingWords.length > 0) words = matchingWords;
		} else if (!isAction && currentContext.logic === "contrast") {
			const matchingWords = words.filter(w => {
				const sv = parseSemanticVector(w);
				return sv.polarity !== currentContext.polarity && sv.polarity !== 0;
			});
			if (matchingWords.length > 0) words = matchingWords;
		}
	}

	const svWords = words.filter(w => parseSemanticVector(w).domain);
	if (svWords.length > 0) words = svWords;

	const word = getRandom(words);
	if (!word) return { text: "N/A", verb: null, noun: null };

	markUnitUsed(word);
	const sv = parseSemanticVector(word);
	if (isAction) {
		if (sv.prod) currentContext.produced_state = sv.prod;
		if (sv.polarity !== undefined) currentContext.polarity = sv.polarity;
	}

	const stem = getConjugatedStem(word[DATA_SCHEMA.Korean], word[DATA_SCHEMA.Conjugation]);
	if (tokenType === "AVst" || tokenType === "DVst") {
		return { text: stem, verb: word, noun: null };
	}
	const phrase = isAction ? buildActionVerbPhrase(word, stem, null, currentContext) : buildDescriptiveVerbPhrase(word, stem, null, currentContext);
	return { text: phrase.text, verb: phrase.verb || word, noun: phrase.noun };
}

function expandSemanticActionVerb(tokenType, currentContext, applyConstraint) {
	return expandSemanticVerb("Action Verb", true, tokenType, currentContext, applyConstraint);
}

function expandSemanticDescriptiveVerb(tokenType, currentContext, applyConstraint) {
	return expandSemanticVerb("Descriptive Verb", false, tokenType, currentContext, applyConstraint);
}

// =========================================================================
// 5. Template & Token Expansion
// =========================================================================
function getTokenOptions(token, depth = 0) {
	let options = [];
	const KoreanWord = DATA_SCHEMA.Korean;
	const Conjugation = DATA_SCHEMA.Conjugation;

	if (token.type === "Name" || token.isProperName || (token.type === "N" && (token.tag === "name" || token.tag === "properName"))) {
		options = [new TokenOption(getRandomProperName(), [])];
	} else if (token.type === "properNoun") {
		const ssiSuffix = TITLE_SUFFIX_SSI || "씨";
		const seeGrammar = getFilteredWords("Grammar").find(g => hasTag(g, "properNoun", "honorific") || g[KoreanWord] === ssiSuffix) || getWords("Grammar").find(g => hasTag(g, "properNoun", "honorific") || g[KoreanWord] === ssiSuffix);
		options = [new TokenOption(getRandomProperName() + ssiSuffix, seeGrammar ? [seeGrammar] : [])];
	} else if (token.type === "N" || token.type === "Noun" || token.type === "N_Phrase") {
		options = getFilteredWords("Noun", token.tag).map(w => new TokenOption(w[KoreanWord], [w]));
	} else if (token.type === "AVst") {
		options = getFilteredWords("Action Verb", token.tag).map(w => new TokenOption(getConjugatedStem(w[KoreanWord], w[Conjugation]), [w]));
	} else if (token.type === "DVst") {
		options = getFilteredWords("Descriptive Verb", token.tag).map(w => new TokenOption(getConjugatedStem(w[KoreanWord], w[Conjugation]), [w]));
	} else if (token.type === "Number") {
		const rangeMatch = token.tag ? token.tag.match(/^([a-zA-Z_]+)\((\d+)\s*,\s*(\d+)\)$/) : null;
		if (rangeMatch) {
			options = getNumberTokenOptions(rangeMatch[1], parseInt(rangeMatch[2], 10), parseInt(rangeMatch[3], 10), !!token.isFollowedByMeasureWord);
		} else {
			let words = getFilteredWords("Number", token.tag);
			words = words.filter(w => token.isFollowedByMeasureWord
				? (!hasTag(w, "counting") || hasTag(w, "attributive"))
				: (!hasTag(w, "attributive") || hasTag(w, "counting")));
			options = words.map(w => new TokenOption(w[KoreanWord], [w]));
		}
	} else if (token.type === "Adv") {
		options = getFilteredWords("Adverb", token.tag).map(w => new TokenOption(w[KoreanWord], [w]));
	} else if (token.type === "Det" || token.type === "Determiner") {
		options = getFilteredWords("Determiner", token.tag).map(w => new TokenOption(w[KoreanWord], [w]));
	} else if (token.type === "Exclamation") {
		options = getFilteredWords("Exclamation", token.tag).map(w => new TokenOption(w[KoreanWord], [w]));
	} else if (token.type === "Clause" || token.type === "VP") {
		if (depth > 0) {
			options = [new TokenOption("갑니다"), new TokenOption("좋아요")];
		} else {
			const grammars = getFilteredWords("Grammar").filter(g => hasTag(g, "declarative", "suggestion"));
			if (grammars.length > 0) {
				grammars.forEach(g => {
					g[Conjugation].forEach(formula => {
						generateTemplateTokenOptions(formula, depth + 1).forEach(sub => {
							options.push(new TokenOption(sub.text, [g, ...sub.units]));
						});
					});
				});
			} else {
				options = [new TokenOption("갑니다"), new TokenOption("좋아요")];
			}
		}
	} else if (token.type === "VP_AVst") {
		getFilteredWords("Action Verb", token.tag).forEach(av => {
			const stem = getConjugatedStem(av[KoreanWord], av[Conjugation]);
			const isPureIntransitive = (hasTag(av, "intransitive_general") || hasTag(av, "intransitive_motion") || hasTag(av, "intransitive_place"))
				&& !ACTION_VERB_SPECS.some(s => s.particle === "object" && hasTag(av, s.tag))
				&& !parseSemanticVector(av).collocation_filter;

			if (isPureIntransitive) {
				if (hasTag(av, "intransitive_motion") || hasTag(av, "intransitive_place")) {
					getFilteredWords("Noun", "place").forEach(n => {
						options.push(new TokenOption(`${attachParticle(n, "location", av)} ${stem}`, [av, n]));
					});
				} else {
					options.push(new TokenOption(stem, [av]));
				}
				return;
			}

			const particleType = getVerbParticleType(av);
			const nouns = getNounCandidatesForVerb(av);
			nouns.forEach(n => {
				const phrase = `${attachParticle(n, particleType, av)} ${stem}`;
				options.push(new TokenOption(phrase, [av, n]));
			});
		});
	} else if (token.type === "VP_DVst") {
		getFilteredWords("Descriptive Verb", token.tag).forEach(dv => {
			const stem = getConjugatedStem(dv[KoreanWord], dv[Conjugation]);
			const candidates = getSubjectCandidatesForDescriptiveVerb(dv);
			candidates.forEach(n => {
				const phrase = `${attachParticle(n, "subject", dv)} ${stem}`;
				options.push(new TokenOption(phrase, [dv, n]));
			});
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
	const tokenRegex = /\{([^}:]+)(?::([^}]+))?\}/;
	const match = template.match(tokenRegex);
	if (!match) return [new TokenOption(template, [])];

	const fullMatch = match[0];
	const tokenType = match[1];
	const tag = match[2];
	const afterToken = template.substring(match.index + fullMatch.length);
	const isFollowedByMeasureWord = /^\s*\{(?:Noun|N):.*measureWord/i.test(afterToken) || /^\s*[가-힣]/.test(afterToken);
	const ssiSuffix = TITLE_SUFFIX_SSI || "씨";
	const isProperName = tokenType === "Name" || tag === "properName" || tag === "name" || (tokenType === "N" && (afterToken.startsWith(ssiSuffix) || afterToken.startsWith(" " + ssiSuffix)));

	const options = getTokenOptions({ type: tokenType, tag, isFollowedByMeasureWord, isProperName }, depth);
	const combinations = [];

	for (let opt of options) {
		let remainder = template.substring(match.index + fullMatch.length);
		if (opt.text.endsWith(ssiSuffix) && remainder.startsWith(ssiSuffix)) remainder = remainder.substring(ssiSuffix.length).trimStart();
		const prefix = template.substring(0, match.index) + opt.text;
		const subOptions = generateTemplateTokenOptions(remainder, depth);

		for (let sub of subOptions) {
			combinations.push(new TokenOption(prefix + sub.text, [...opt.units, ...sub.units]));
		}
	}
	return combinations;
}

function generateTemplateOptions(template, depth = 0) {
	return generateTemplateTokenOptions(template, depth).map(opt => opt.text);
}

// =========================================================================
// 6. Semantic Context & Sentence Generation
// =========================================================================
const SemanticConfig = {
	strictness: { default: 0.8, contrast: 1.0, cause_effect: 0.9, sequence: 0.7, selection: 0.8 },
	getWeight(domainOrLogic) {
		if (domainOrLogic && this.strictness[domainOrLogic] !== undefined) return this.strictness[domainOrLogic];
		return this.strictness.default;
	}
};

function getRandom(arr) {
	if (!arr || arr.length === 0) return null;
	return arr[Math.floor(Math.random() * arr.length)];
}


function shouldApplySemanticConstraint(context) {
	if (!context || !context.logic) return false;
	const weight = SemanticConfig.getWeight(context.logic);
	if (weight >= 1.0) return true;
	if (weight <= 0.0) return false;
	return Math.random() < weight;
}

let templateToGrammarMap = null;
function initTemplateToGrammarMap() {
	if (templateToGrammarMap) return;
	templateToGrammarMap = new Map();
	const units = typeof KR_EN_languageUnits !== 'undefined' ? KR_EN_languageUnits : dataModule.KR_EN_languageUnits;
	if (!units) return;
	units.filter(u => u[DATA_SCHEMA.PartofSpeech] === "Grammar").forEach(u => {
		const formulas = u[DATA_SCHEMA.Conjugation];
		if (Array.isArray(formulas)) {
			formulas.forEach((f, idx) => {
				if (!templateToGrammarMap.has(f)) {
					templateToGrammarMap.set(f, { grammarUnit: u, formulaIndex: idx });
				}
			});
		}
	});
}

function findGrammarUnitForTemplate(template) {
	initTemplateToGrammarMap();
	return templateToGrammarMap ? templateToGrammarMap.get(template) : null;
}

function expandSemanticClause(depth, currentContext) {
	const KoreanWord = DATA_SCHEMA.Korean;
	const Conjugation = DATA_SCHEMA.Conjugation;

	let grammars = getFilteredWords("Grammar").filter(g => {
		const sv = parseSemanticVector(g);
		return hasTag(g, "declarative") && (sv.logic === "declarative" || g[KoreanWord].includes("아요") || g[KoreanWord].includes("습니다"));
	});
	if (grammars.length === 0) grammars = getFilteredWords("Grammar").filter(g => hasTag(g, "declarative"));
	if (grammars.length === 0) grammars = getFilteredWords("Grammar");

	if (currentContext.temporal_polarity) {
		const tenseGrammars = filterGrammarByTense(grammars, currentContext.temporal_polarity);
		if (tenseGrammars.length > 0) grammars = tenseGrammars;
	}

	const grammar = getRandom(grammars);
	if (grammar) {
		markUnitUsed(grammar);
		const sub = generateSemanticSentence(getRandom(grammar[Conjugation]), depth + 1, currentContext);
		return { text: sub.ko, tree: sub.tree };
	}
	return { text: "좋아요", tree: "좋아요" };
}

function expandSemanticTerminal(tokenType, tag, currentContext, applyConstraint) {
	if (tokenType === "Name" || tag === "name" || tag === "properName") {
		return { text: getRandomProperName(), unit: null };
	}
	if (tokenType === "properNoun") {
		const ssiSuffix = TITLE_SUFFIX_SSI || "씨";
		const seeGrammar = getFilteredWords("Grammar").find(g => hasTag(g, "properNoun", "honorific") || g[DATA_SCHEMA.Korean] === ssiSuffix) || getWords("Grammar").find(g => hasTag(g, "properNoun", "honorific") || g[DATA_SCHEMA.Korean] === ssiSuffix);
		return { text: getRandomProperName() + ssiSuffix, unit: seeGrammar || null };
	}

	let posToFetch = "Noun";
	if (tokenType === "Number") posToFetch = "Number";
	else if (tokenType === "Adv" || tokenType === "Adv_Time") posToFetch = "Adverb";
	else if (tokenType === "Exclamation") posToFetch = "Exclamation";

	let words = getFilteredWords(posToFetch, tag);
	if (applyConstraint && currentContext.logic === "cause_effect" && currentContext.produced_state) {
		const domainWords = words.filter(w => parseSemanticVector(w).domain);
		if (domainWords.length > 0) words = domainWords;
	}

	if (currentContext.temporal_polarity && (tokenType === "Adv" || tokenType === "Adv_Time" || tokenType === "Time" || tag === "time" || tag === "temporal" || tag === "adverb_time" || tag === "temporalNoun")) {
		const tenseFiltered = filterWordsByTense(words, currentContext.temporal_polarity);
		if (tenseFiltered.length > 0) words = tenseFiltered;
	}

	const chosen = getRandom(words);
	if (chosen) {
		markUnitUsed(chosen);
		const pol = getTemporalPolarity(chosen);
		if (pol && !currentContext.temporal_polarity) {
			currentContext.temporal_polarity = pol;
		}
		return { text: chosen[DATA_SCHEMA.Korean], unit: chosen };
	}
	return { text: "N/A", unit: null };
}

function generateSemanticSentence(templateOrUnit, depth = 0, incomingContext = {}) {
	if (depth > 2) return { ko: "좋아요", context: {}, tree: "좋아요" };

	let template = "", grammarId = null;
	const units = typeof KR_EN_languageUnits !== 'undefined' ? KR_EN_languageUnits : dataModule.KR_EN_languageUnits;

	if (typeof templateOrUnit === 'number') {
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
				grammarId = sigs.slice(0, match.formulaIndex).includes(sigs[match.formulaIndex]) ? template : gu[DATA_SCHEMA.Id];
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

	let currentContext = { ...incomingContext };
	if (!currentContext.temporal_polarity) {
		if (typeof grammarId === 'number') {
			if (PAST_GRAMMAR_IDS.has(grammarId)) currentContext.temporal_polarity = "past";
			else if (FUTURE_GRAMMAR_IDS.has(grammarId)) currentContext.temporal_polarity = "future";
			else if (PRESENT_GRAMMAR_IDS.has(grammarId)) currentContext.temporal_polarity = "present";
		}
	}

	let koResult = template;
	const childrenTree = [];
	const tokenRegex = /\{([^}:]+)(?::([^}]+))?\}/g;
	let match;

	while ((match = tokenRegex.exec(koResult)) !== null) {
		const token = match[0], tokenType = match[1], tag = match[2];
		const applyConstraint = shouldApplySemanticConstraint(currentContext);
		let replacementKo = "", childNode = null;
		const afterToken = koResult.substring(match.index + token.length);
		const ssiSuffix = TITLE_SUFFIX_SSI || "씨";
		const isProperName = tokenType === "Name" || tag === "properName" || tag === "name" || (tokenType === "N" && (afterToken.startsWith(ssiSuffix) || afterToken.startsWith(" " + ssiSuffix)));

		if (isProperName) {
			replacementKo = getRandomProperName();
			childNode = replacementKo;
		} else if (tokenType === "properNoun") {
			const seeGrammar = getFilteredWords("Grammar").find(g => hasTag(g, "properNoun", "honorific") || g[DATA_SCHEMA.Korean] === ssiSuffix) || getWords("Grammar").find(g => hasTag(g, "properNoun", "honorific") || g[DATA_SCHEMA.Korean] === ssiSuffix);
			const name = getRandomProperName();
			replacementKo = name + ssiSuffix;
			childNode = seeGrammar ? [seeGrammar[DATA_SCHEMA.Id], name] : replacementKo;
		} else if (tokenType === "VP_AVst" || tokenType === "AVst" || tokenType === "VP_DVst" || tokenType === "DVst") {
			const isAction = tokenType.includes("AVst");
			const exp = isAction
				? expandSemanticActionVerb(tokenType, currentContext, applyConstraint)
				: expandSemanticDescriptiveVerb(tokenType, currentContext, applyConstraint);
			replacementKo = exp.text;
			if (exp.verb) {
				childNode = exp.noun
					? [exp.verb[DATA_SCHEMA.Id], typeof exp.noun[DATA_SCHEMA.Id] === 'number' ? exp.noun[DATA_SCHEMA.Id] : exp.noun[DATA_SCHEMA.Korean]]
					: exp.verb[DATA_SCHEMA.Id];
			} else {
				childNode = replacementKo;
			}
		} else if (tokenType === "Clause" || tokenType === "VP") {
			const exp = expandSemanticClause(depth, currentContext);
			replacementKo = exp.text;
			childNode = exp.tree;
		} else if (tokenType === "CountPhrase" || tokenType === "Noun_Count") {
			let nouns = getWords("Noun").filter(n => !hasTag(n, "measureWord") && !hasTag(n, "counter") && !hasTag(n, "place"));
			if (tag && tag !== "object" && tag !== "subject" && tag !== "topic" && tag !== "AV" && tag !== "DV") {
				nouns = nouns.filter(n => hasTag(n, tag));
			}
			if (nouns.length === 0) nouns = getWords("Noun", "object");
			const sampledNoun = nouns[Math.floor(Math.random() * nouns.length)];
			const count = Math.floor(Math.random() * 5) + 1;
			const classifier = getMatchingClassifier(sampledNoun);
			const classifierUnit = CLASSIFIER_UNITS.get(classifier);

			let particle = null;
			if (tag === "object" || tag === "AV" || /을|를/.test(token)) particle = "object";
			else if (tag === "subject" || tag === "DV" || /이|가/.test(token)) particle = "subject";
			else if (tag === "topic" || /은|는/.test(token)) particle = "topic";

			replacementKo = buildCountingPhrase(sampledNoun, count, { classifier, particle });
			childNode = [
				sampledNoun ? sampledNoun[DATA_SCHEMA.Id] : 0,
				count,
				classifierUnit ? classifierUnit[DATA_SCHEMA.Id] : classifier
			];
		} else if (tokenType === "Number" && tag && tag.includes("(")) {
			const rangeMatch = tag.match(/^([a-zA-Z_]+)\((\d+)\s*,\s*(\d+)\)$/);
			if (rangeMatch) {
				const baseTag = rangeMatch[1];
				const min = parseInt(rangeMatch[2], 10), max = parseInt(rangeMatch[3], 10);
				const val = Math.floor(Math.random() * (max - min + 1)) + min;
				const isFollowedByMeasureWord = /^\s*\{(?:Noun|N):.*(?:measureWord|koreanMeasureWord|counter)/i.test(afterToken) || /^\s*[가-힣]/.test(afterToken);
				replacementKo = (baseTag === "sinoNumber") ? getSinoNumber(val) : getKoreanNumber(val, isFollowedByMeasureWord);
				const words = getFilteredWords("Number", baseTag);
				const matchedUnit = words.find(w => w[DATA_SCHEMA.Korean] === replacementKo);
				if (matchedUnit) {
					markUnitUsed(matchedUnit);
					childNode = matchedUnit[DATA_SCHEMA.Id];
				} else {
					childNode = replacementKo;
				}
			} else {
				const exp = expandSemanticTerminal(tokenType, tag, currentContext, applyConstraint);
				replacementKo = exp.text;
				childNode = exp.unit ? exp.unit[DATA_SCHEMA.Id] : replacementKo;
			}
		} else {
			const exp = expandSemanticTerminal(tokenType, tag, currentContext, applyConstraint);
			replacementKo = exp.text;
			childNode = exp.unit ? exp.unit[DATA_SCHEMA.Id] : replacementKo;
		}

		childrenTree.push(childNode);
		koResult = koResult.replace(token, replacementKo || "N/A");
		tokenRegex.lastIndex = 0;
	}

	return { ko: koResult, context: currentContext, tree: [grammarId, ...childrenTree] };
}

// =========================================================================
// 7. Language Unit Tree (LUT) Reconstruction & Serialization
// =========================================================================
function reconstructFromLanguageUnitTree(tree) {
	if (tree === null || tree === undefined) return "";
	if (typeof tree === 'string') return tree;
	const units = typeof KR_EN_languageUnits !== 'undefined' ? KR_EN_languageUnits : dataModule.KR_EN_languageUnits;
	if (typeof tree === 'number') {
		const u = units ? units[tree] : null;
		return u ? u[DATA_SCHEMA.Korean] : String(tree);
	}
	if (!Array.isArray(tree) || tree.length === 0) return "";

	const grammarRef = tree[0];
	const children = tree.slice(1);
	let template = "";

	if (typeof grammarRef === 'number') {
		const grammarUnit = units ? units[grammarRef] : null;
		if (grammarUnit && Array.isArray(grammarUnit[DATA_SCHEMA.Conjugation])) {
			const formulas = grammarUnit[DATA_SCHEMA.Conjugation];
			if (formulas.length === 1) {
				template = formulas[0];
			} else {
				const candidate = formulas.find(f => {
					const tokens = f.match(/\{[^}:]+(?::[^}]+)?\}/g) || [];
					if (tokens.length !== children.length) return false;
					for (let i = 0; i < tokens.length; i++) {
						const m = tokens[i].match(/^\{([^}:]+)/);
						if (!m) continue;
						const type = m[1], child = children[i];
						if (type === 'Clause' && !Array.isArray(child)) return false;
						const unitId = typeof child === 'number' ? child : (Array.isArray(child) && typeof child[0] === 'number' ? child[0] : null);
						const u = (unitId !== null && units) ? units[unitId] : null;
						if (type === 'Adv' && u && u[DATA_SCHEMA.PartofSpeech] !== 'Adverb') return false;
						if ((type === 'VP_AVst' || type === 'AVst') && u && u[DATA_SCHEMA.PartofSpeech] !== 'Action Verb') return false;
						if ((type === 'VP_DVst' || type === 'DVst') && u && u[DATA_SCHEMA.PartofSpeech] !== 'Descriptive Verb') return false;
					}
					return true;
				});

				if (candidate) {
					template = candidate;
				} else {
					const firstChild = children[0];
					const firstId = typeof firstChild === 'number' ? firstChild : (Array.isArray(firstChild) && typeof firstChild[0] === 'number' ? firstChild[0] : null);
					const u = (firstId !== null && units) ? units[firstId] : null;
					const isAV = u && u[DATA_SCHEMA.PartofSpeech] === 'Action Verb';
					const isDV = u && u[DATA_SCHEMA.PartofSpeech] === 'Descriptive Verb';
					template = isAV ? (formulas.find(f => f.includes('AVst')) || formulas[0])
						: isDV ? (formulas.find(f => f.includes('DVst')) || formulas[0])
							: formulas[0];
				}
			}
		} else {
			template = String(grammarRef);
		}
	} else {
		template = String(grammarRef);
	}

	let koResult = template;
	const tokenRegex = /\{([^}:]+)(?::([^}]+))?\}/g;
	let match, childIndex = 0;

	while ((match = tokenRegex.exec(koResult)) !== null) {
		const token = match[0], tokenType = match[1];
		const child = children[childIndex++];
		let replacement = "";

		if (tokenType === "VP_AVst" || tokenType === "AVst" || tokenType === "VP_DVst" || tokenType === "DVst") {
			const verbId = Array.isArray(child) ? child[0] : (typeof child === 'number' ? child : null);
			const nounId = (Array.isArray(child) && child.length > 1) ? child[1] : null;
			const verb = (verbId !== null && units) ? units[verbId] : null;
			const noun = (nounId !== null && units && typeof nounId === 'number') ? units[nounId] : (typeof nounId === 'string' ? nounId : null);

			if (verb) {
				let stem = getStem(verb[DATA_SCHEMA.Korean]);
				const conj = verb[DATA_SCHEMA.Conjugation];
				if (conj && conj !== "regular" && conj !== "") stem += `[${conj}]`;
				if (tokenType === "AVst" || tokenType === "DVst") {
					replacement = stem;
				} else {
					const isVerbAction = verb[DATA_SCHEMA.PartofSpeech] === 'Action Verb';
					const phrase = isVerbAction ? buildActionVerbPhrase(verb, stem, noun) : buildDescriptiveVerbPhrase(verb, stem, noun);
					replacement = phrase.text;
				}
			} else {
				replacement = typeof child === 'string' ? child : "N/A";
			}
		} else if (tokenType === "Clause" || tokenType === "VP") {
			replacement = reconstructFromLanguageUnitTree(child);
		} else {
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
		if (typeof node === 'number') { ids.add(node); return; }
		if (Array.isArray(node)) {
			for (let item of node) {
				if (typeof item === 'number') ids.add(item);
				else if (Array.isArray(item)) traverse(item);
			}
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
	for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
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

// =========================================================================
// 8. Korean Morphology Engine
// =========================================================================
let PARTICLE_PAIRS = {};
let PRONOUN_REPLACEMENTS = [];
let particlePairsRegex = null;

function initMorphologyData() {
	PARTICLE_PAIRS = {};
	PRONOUN_REPLACEMENTS = [];
	particlePairsRegex = null;

	const allUnits = KR_EN_languageUnits || [];
	for (const unit of allUnits) {
		if (!unit) continue;
		const pos = unit[DATA_SCHEMA.PartofSpeech];
		const sv = parseSemanticVector(unit);
		if (!sv) continue;

		// Recover Particle Pairs from Grammar units in data.js
		if (pos === "Grammar" && sv.allomorph_pair && Array.isArray(sv.allomorph_pair)) {
			const pair = sv.allomorph_pair;
			if (sv.allomorph_patterns && Array.isArray(sv.allomorph_patterns)) {
				for (const pat of sv.allomorph_patterns) {
					PARTICLE_PAIRS[pat] = pair;
					const noSpace = pat.replace(/\s+/g, '');
					PARTICLE_PAIRS[noSpace] = pair;
				}
			}
			const ko = unit[DATA_SCHEMA.Korean];
			if (ko) {
				PARTICLE_PAIRS[ko] = pair;
				PARTICLE_PAIRS[ko.replace(/\s+/g, '')] = pair;
			}
		}

		// Recover Pronoun Sandhi Replacements from Pronoun units in data.js
		if (pos === "Pronoun" && sv.sandhi && Array.isArray(sv.sandhi)) {
			for (const rule of sv.sandhi) {
				if (rule.pattern && rule.replacement !== undefined) {
					const regex = new RegExp(rule.pattern, rule.flags || 'g');
					PRONOUN_REPLACEMENTS.push([regex, rule.replacement]);
				}
			}
		}
	}

	const keys = Object.keys(PARTICLE_PAIRS).sort((a, b) => b.length - a.length);
	if (keys.length > 0) {
		const escaped = keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
		particlePairsRegex = new RegExp(`([가-힣])(${escaped})`, 'g');
	}
}

function applyMorphology(text) {
	let resolvedKo = text;

	// Irregular Verbs
	// 1. b_irregular
	resolvedKo = resolvedKo.replace(/([가-힣])\[b_irregular\]으\/(니까|면|면서|러|려고|려면|세|시|셔|셨|십|로|라고|ㄹ|ㄴ)/g, (_, ch, s) => {
		const base = setFinal(ch, 0);
		return s === 'ㄴ' ? base + '운' : s === 'ㄹ' ? base + '울' : base + '우' + s;
	});
	resolvedKo = resolvedKo.replace(/([가-힣])\[b_irregular\](아\/어|았\/었)(요|서|어|도|야|라|던|)/g, (_, ch, h, s) => {
		const base = setFinal(ch, 0);
		const isW = (ch === '돕' || ch === '곱');
		const added = (h === "았/었") ? (isW ? "왔" : "웠") : (isW ? "와" : "워");
		return base + added + s;
	});

	// 2. l_irregular
	resolvedKo = resolvedKo.replace(/([가-힣])\[l_irregular\]으\/(니까|면|면서|러|려고|려면|세|시|셔|셨|십|로|라고|ㄹ|ㄴ)/g, (_, ch, s) => {
		if (s === 'ㄴ') return setFinal(ch, 4);
		if (s === 'ㄹ') return ch;
		if (/^(면|면서|러|려고|려면|로|라고)$/.test(s)) return ch + s;
		return setFinal(ch, 0) + s;
	});
	resolvedKo = resolvedKo.replace(/([가-힣])\[l_irregular\](는|나|니|냐)/g, (_, ch, s) => setFinal(ch, 0) + s);
	resolvedKo = resolvedKo.replace(/([가-힣])\[l_irregular\]습니다\/ㅂ니다/g, (_, ch) => setFinal(ch, 17) + "니다");

	// 3. d_irregular
	resolvedKo = resolvedKo.replace(/([가-힣])\[d_irregular\]으\/(니까|면|면서|러|려고|려면|세|시|셔|셨|십|로|라고|ㄹ|ㄴ)/g, (_, ch, s) => {
		const withL = setFinal(ch, 8);
		return s === 'ㄴ' ? withL + '은' : s === 'ㄹ' ? withL + '을' : withL + '으' + s;
	});
	resolvedKo = resolvedKo.replace(/([가-힣])\[d_irregular\](아\/어|았\/었)(요|서|어|도|야|라|던|)/g, (_, ch, h, s) => setFinal(ch, 8) + h + s);

	// 4. eu_irregular
	resolvedKo = resolvedKo.replace(/([가-힣])\[eu_irregular\](아\/어|았\/었)(요|서|어|도|야|라|던|)/g, (match, ch, h, s) => {
		const idx = resolvedKo.indexOf(match);
		const prevVowel = idx > 0 ? getVowelHarmony(resolvedKo[idx - 1]) : '어';
		const d = decomposeHangul(ch);
		return composeHangul(d.initial, prevVowel === '아' ? 0 : 4, h === "았/었" ? 20 : 0) + s;
	});

	// 5. reu_irregular & reo_irregular
	resolvedKo = resolvedKo.replace(/([가-힣])르\[reu_irregular\](아\/어|았\/었)(요|서|어|도|야|라|던|)/g, (_, pre, h, s) => {
		const prevVowel = getVowelHarmony(pre);
		return setFinal(pre, 8) + composeHangul(5, prevVowel === '아' ? 0 : 4, h === "았/었" ? 20 : 0) + s;
	});
	resolvedKo = resolvedKo.replace(/([가-힣])르\[reo_irregular\](아\/어|았\/었)(요|서|어|도|야|라|던|)/g, (_, pre, h, s) => {
		return pre + "르" + (h === "았/었" ? "렀" : "러") + s;
	});

	// 6. h_irregular
	resolvedKo = resolvedKo.replace(/([가-힣])\[h_irregular\]으\/(니까|면|면서|러|려고|려면|세|시|셔|셨|십|로|라고|ㄹ|ㄴ)/g, (_, ch, s) => {
		const base = setFinal(ch, 0);
		return s === 'ㄴ' ? setFinal(base, 4) : s === 'ㄹ' ? setFinal(base, 8) : base + s;
	});
	resolvedKo = resolvedKo.replace(/([가-힣])\[h_irregular\](아\/어|았\/었)(요|서|어|도|야|라|던|)/g, (_, ch, h, s) => {
		return composeHangul(decomposeHangul(ch).initial, 1, h === "았/었" ? 20 : 0) + s;
	});

	// 7. s_irregular
	resolvedKo = resolvedKo.replace(/([가-힣])\[s_irregular\]으\/(니까|면|면서|러|려고|려면|세|시|셔|셨|십|로|라고|ㄹ|ㄴ)/g, (_, ch, s) => {
		const base = setFinal(ch, 0);
		return s === 'ㄴ' ? base + '은' : s === 'ㄹ' ? base + '을' : base + '으' + s;
	});
	resolvedKo = resolvedKo.replace(/([가-힣])\[s_irregular\](아\/어|았\/었)(요|서|어|도|야|라|던|)/g, (_, ch, h, s) => {
		const base = setFinal(ch, 0);
		const hv = getVowelHarmony(base);
		return base + '\u200B' + (h === "았/었" ? (hv === '아' ? '았' : '었') : hv) + s;
	});

	// Strip leftover conjugation markers
	resolvedKo = resolvedKo.replace(/\[[a-z_]+\]/g, '');

	// Resolve particles based on previous character's batchim
	if (!particlePairsRegex) {
		const keys = Object.keys(PARTICLE_PAIRS).sort((a, b) => b.length - a.length);
		if (keys.length > 0) {
			const escaped = keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
			particlePairsRegex = new RegExp(`([가-힣])(${escaped})`, 'g');
		}
	}
	if (particlePairsRegex) {
		resolvedKo = resolvedKo.replace(particlePairsRegex, (_, ch, p) => {
			const pair = PARTICLE_PAIRS[p];
			return ch + (pair ? (hasBatchim(ch) ? pair[0] : pair[1]) : p);
		});
	}

	// Resolve contracted pronouns
	PRONOUN_REPLACEMENTS.forEach(([pat, rep]) => { resolvedKo = resolvedKo.replace(pat, rep); });

	// Resolve 이/예요 based on batchim
	resolvedKo = resolvedKo.replace(/([가-힣])이\/예요/g, (_, ch) => ch + (hasBatchim(ch) ? '이에요' : '예요'));

	// Resolve 습니다/ㅂ니다 based on batchim
	resolvedKo = resolvedKo.replace(/([가-힣])(습니다\/ㅂ니다|습니다|ㅂ니다)/g, (_, ch, ending) => {
		if (ending === "습니다/ㅂ니다") {
			const d = decomposeHangul(ch);
			if (d && d.final !== 0) {
				return d.final === 8 ? setFinal(ch, 17) + "니다" : ch + "습니다";
			}
			return setFinal(ch, 17) + "니다";
		}
		return ch + ending;
	});

	// Resolve 아/어/았/었 vowel harmony
	resolvedKo = resolvedKo.replace(/([가-힣])(아\/어|았\/었)(요|서|어|도|야|라|던|)/g, (_, ch, h, s) => {
		const hv = getVowelHarmony(ch);
		if (h === "았/었") {
			return ch + (hv === '여' ? '였' : hv === '아' ? '았' : '었') + s;
		}
		return ch + hv + s;
	});

	// Resolve 으 insertion
	resolvedKo = resolvedKo.replace(/([가-힣])으\/(니까|면|면서|러|려고|려면|세|시|셔|셨|십|로|라고)/g, (_, ch, s) => {
		const d = decomposeHangul(ch);
		return ch + (d && d.final !== 0 && d.final !== 8 ? '으' : '') + s;
	});

	// Resolve (으)로 based on batchim
	resolvedKo = resolvedKo.replace(/([가-힣])\(으\)로/g, (_, ch) => {
		const d = decomposeHangul(ch);
		return ch + (d && d.final !== 0 && d.final !== 8 ? '으로' : '로');
	});

	// Resolve (으)시 / (으)세 / (으)십 / (으)셨 based on batchim
	resolvedKo = resolvedKo.replace(/([가-힣])\(으\)(시|세|셔|셨|십)/g, (_, ch, s) => {
		const d = decomposeHangul(ch);
		return ch + (d && d.final !== 0 && d.final !== 8 ? '으' : '') + s;
	});

	// Resolve 으/ㄹ
	resolvedKo = resolvedKo.replace(/([가-힣])으\/ㄹ/g, (_, ch) => {
		const d = decomposeHangul(ch);
		if (d && d.final !== 0) return d.final === 8 ? ch : ch + '을';
		return setFinal(ch, 8);
	});

	// Resolve 으/ㄴ
	resolvedKo = resolvedKo.replace(/([가-힣])으\/ㄴ/g, (_, ch) => {
		const d = decomposeHangul(ch);
		if (d && d.final !== 0) return d.final === 8 ? setFinal(ch, 4) : ch + '은';
		return setFinal(ch, 4);
	});

	// Resolve (느)ㄴ다(고)
	resolvedKo = resolvedKo.replace(/([가-힣])(?:느\/ㄴ다|\(느\)ㄴ다)(고|)/g, (_, ch, quote) => {
		const q = quote || '';
		const d = decomposeHangul(ch);
		if (d && d.final !== 0) return (d.final === 8 ? setFinal(ch, 4) : ch + '는') + '다' + q;
		return setFinal(ch, 4) + '다' + q;
	});

	// Basic Vowel Contractions
	resolvedKo = resolvedKo.replace(/([가-힣])아(요|서|도|야|라|)/g, (m, ch, s) => {
		const d = decomposeHangul(ch);
		if (!d || d.final !== 0) return m;
		if (d.medial === 0) return ch + s; // ㅏ
		if (d.medial === 8) return composeHangul(d.initial, 9, 0) + s; // ㅗ -> ㅘ
		return m;
	});

	resolvedKo = resolvedKo.replace(/([가-힣])았(어요|어|다가|던|습니다|다)/g, (m, ch, s) => {
		const d = decomposeHangul(ch);
		if (!d || d.final !== 0) return m;
		if (d.medial === 0) return composeHangul(d.initial, 0, 20) + s; // ㅏ -> 았
		if (d.medial === 8) return composeHangul(d.initial, 9, 20) + s; // ㅗ -> 왔
		return m;
	});

	resolvedKo = resolvedKo.replace(/오아(요|서|도|야|라)/g, (m, s) => "와" + s);
	resolvedKo = resolvedKo.replace(/오았(어요|어|다가|던|습니다|다)/g, (m, s) => "왔" + s);
	resolvedKo = resolvedKo.replace(/하여(요|서|도|야|라|지|져|졌)/g, (m, s) => "해" + s);
	resolvedKo = resolvedKo.replace(/하였(어요|어|다가|던|습니다|다)/g, (m, s) => "했" + s);
	resolvedKo = resolvedKo.replace(/마시(아|어)(요|서|도|야|라)/g, (m, v, s) => "마셔" + s);
	resolvedKo = resolvedKo.replace(/크(아|어)(요|서|도|야|라)/g, (m, v, s) => "커" + s);
	resolvedKo = resolvedKo.replace(/이어요/g, "이에요");

	resolvedKo = resolvedKo.replace(/([가-힣])어(요|서|도|야|라|지|져|졌)/g, (m, ch, s) => {
		const d = decomposeHangul(ch);
		if (!d || d.final !== 0) return m;
		if (d.medial === 20) return composeHangul(d.initial, 6, 0) + s; // ㅣ -> ㅕ
		if (d.medial === 13) return composeHangul(d.initial, 14, 0) + s; // ㅜ -> ㅝ
		if ([1, 4, 5, 6].includes(d.medial)) return ch + s; // ㅐ, ㅓ, ㅔ, ㅕ
		return m;
	});

	resolvedKo = resolvedKo.replace(/([가-힣])었(어요|어|다가|던|습니다|다)/g, (m, ch, s) => {
		const d = decomposeHangul(ch);
		if (!d || d.final !== 0) return m;
		if (d.medial === 20) return composeHangul(d.initial, 6, 20) + s; // ㅣ -> 였
		if (d.medial === 13) return composeHangul(d.initial, 14, 20) + s; // ㅜ -> 웠
		if ([1, 4, 5, 6].includes(d.medial)) return composeHangul(d.initial, d.medial, 20) + s;
		return m;
	});

	if (BARE_TIME_WORDS_NO_PARTICLE && BARE_TIME_WORDS_NO_PARTICLE.size > 0) {
		for (const bare of BARE_TIME_WORDS_NO_PARTICLE) {
			const deicticRegex = new RegExp(`(^|[^가-힣])(${bare})에([^가-힣]|$)`, 'g');
			resolvedKo = resolvedKo.replace(deicticRegex, '$1$2$3');
		}
	}

	resolvedKo = applyCounterConcord(resolvedKo);

	resolvedKo = resolvedKo.replace(/\u200B/g, '');
	return resolvedKo;
}

// =========================================================================
// 9. Standard Korean Pronunciation (표준 발음법) Engine
// =========================================================================
const FINAL_TO_INITIAL = { 1: 0, 2: 1, 4: 2, 7: 3, 8: 5, 16: 6, 17: 7, 19: 9, 20: 10, 22: 12, 23: 14, 24: 15, 25: 16, 26: 17 };
const TENSIFY_INITIAL = { 0: 1, 3: 4, 7: 8, 9: 10, 12: 13 };
const NASAL_VERB_ROOTS = new Set(['신', '안', '앉', '삼', '젊', '닮', '감', '품', '숨', '넘']);
const DOUBLE_CODA_LIAISON = {
	3: [1, 10], 5: [4, 12], 6: [0, 2], 9: [8, 0], 10: [8, 6],
	11: [8, 7], 12: [8, 10], 13: [8, 16], 14: [8, 17], 15: [0, 5], 18: [17, 10]
};
const DOUBLE_CODA_SIMPLIFY = { 3: 1, 5: 4, 6: 4, 10: 16, 12: 8, 13: 8, 14: 17, 15: 8, 18: 17 };
const H_ONSET_MAP = {
	1: [0, 15], 2: [0, 15], 3: [0, 15], 24: [0, 15], 9: [8, 15],
	7: [0, 16], 19: [0, 16], 20: [0, 16], 25: [0, 16],
	22: [0, 14], 23: [0, 14], 5: [4, 14],
	17: [0, 17], 14: [0, 17], 18: [0, 17], 26: [0, 17], 11: [8, 17]
};
const NASAL_CODA = { 1: 21, 7: 4, 17: 16 };

function getPronunciationWord(word) {
	const chars = [];
	const hangulIndices = [];
	for (let i = 0; i < word.length; i++) {
		const d = decomposeHangul(word[i]);
		if (d) { chars.push(d); hangulIndices.push(chars.length - 1); }
		else { chars.push(word[i]); }
	}
	if (hangulIndices.length === 0) return word;

	const H = hangulIndices.map(idx => chars[idx]);
	const originalSyllables = hangulIndices.map(idx => word[idx]);

	// Pass 1: Consonant + ㅢ -> ㅣ
	for (let i = 0; i < H.length; i++) {
		if (H[i].initial !== 11 && H[i].medial === 19) H[i].medial = 20;
	}

	// Pass 2: Palatalization
	for (let i = 0; i < H.length - 1; i++) {
		const cur = H[i], next = H[i + 1];
		if (next.initial === 11 && (next.medial === 20 || next.medial === 6)) {
			if (cur.final === 7) { cur.final = 0; next.initial = 12; }
			else if (cur.final === 25) { cur.final = 0; next.initial = 14; }
			else if (cur.final === 13) { cur.final = 8; next.initial = 14; }
		} else if (next.initial === 18 && (next.medial === 20 || next.medial === 6) && cur.final === 7) {
			cur.final = 0; next.initial = 14;
		}
	}

	// Pass 3: ㅎ assimilation & merging
	for (let i = 0; i < H.length - 1; i++) {
		const cur = H[i], next = H[i + 1];
		if (cur.final === 27 || cur.final === 6 || cur.final === 15) {
			const isH = cur.final === 27, isNh = cur.final === 6;
			const baseFinal = isH ? 0 : (isNh ? 4 : 8);
			if (next.initial === 11) {
				cur.final = 0;
				if (!isH) next.initial = isNh ? 2 : 5;
			} else if (next.initial === 0) { cur.final = baseFinal; next.initial = 15; }
			else if (next.initial === 3) { cur.final = baseFinal; next.initial = 16; }
			else if (next.initial === 12) { cur.final = baseFinal; next.initial = 14; }
			else if (next.initial === 9) { cur.final = baseFinal; next.initial = 10; }
			else if (next.initial === 2) {
				cur.final = isH ? 4 : baseFinal;
				if (!isH && !isNh) next.initial = 5;
			}
		} else if (next.initial === 18 && H_ONSET_MAP[cur.final]) {
			[cur.final, next.initial] = H_ONSET_MAP[cur.final];
		}
	}

	// Pass 4: ㅅ/ㅆ coda before ㅅ onset
	for (let i = 0; i < H.length - 1; i++) {
		const cur = H[i], next = H[i + 1];
		if ((cur.final === 19 || cur.final === 20) && next.initial === 9) {
			cur.final = 0; next.initial = 10;
		} else if (cur.final === 18 && next.initial === 9) {
			cur.final = 17; next.initial = 10;
		}
	}

	// Pass 5: Liaison
	for (let i = 0; i < H.length - 1; i++) {
		const cur = H[i], next = H[i + 1];
		if (cur.final > 0 && cur.final !== 21 && next.initial === 11) {
			if (FINAL_TO_INITIAL[cur.final] !== undefined) {
				next.initial = FINAL_TO_INITIAL[cur.final];
				cur.final = 0;
			} else if (DOUBLE_CODA_LIAISON[cur.final]) {
				[cur.final, next.initial] = DOUBLE_CODA_LIAISON[cur.final];
			}
		}
	}

	// Pass 6: Coda Simplification / Neutralization
	for (let i = 0; i < H.length; i++) {
		const cur = H[i], next = (i < H.length - 1) ? H[i + 1] : null;
		if (cur.final > 0) {
			if (DOUBLE_CODA_SIMPLIFY[cur.final]) {
				cur.final = DOUBLE_CODA_SIMPLIFY[cur.final];
			} else if (cur.final === 11) {
				cur.final = originalSyllables[i] === '밟' ? 17 : 8;
			} else if (cur.final === 9) {
				cur.final = (next && next.initial === 0) ? 8 : 1;
			}

			if (cur.final === 2 || cur.final === 24) cur.final = 1;
			else if ([19, 20, 22, 23, 25, 27].includes(cur.final)) cur.final = 7;
			else if (cur.final === 26) cur.final = 17;
		}
	}

	// Pass 7: Tensification
	for (let i = 0; i < H.length - 1; i++) {
		const cur = H[i], next = H[i + 1];
		if (cur.final === 1 || cur.final === 7 || cur.final === 17) {
			if (TENSIFY_INITIAL[next.initial] !== undefined) next.initial = TENSIFY_INITIAL[next.initial];
		} else if ((cur.final === 4 || cur.final === 16) && NASAL_VERB_ROOTS.has(originalSyllables[i])) {
			const nextOrig = decomposeHangul(originalSyllables[i + 1]);
			if (nextOrig && nextOrig.initial !== 11 && TENSIFY_INITIAL[next.initial] !== undefined) {
				next.initial = TENSIFY_INITIAL[next.initial];
			}
		} else if (cur.final === 8) {
			if (next.initial === 0 && next.medial === 4) next.initial = 1;
			else if (next.initial === 9 && next.medial === 13) next.initial = 10;
			else if (next.initial === 12 && next.medial === 13) next.initial = 13;
		}
	}

	// Pass 8: Nasalization
	for (let i = 0; i < H.length - 1; i++) {
		const cur = H[i], next = H[i + 1];
		if (next.initial === 5) {
			if (cur.final === 16 || cur.final === 21) next.initial = 2;
			else if (NASAL_CODA[cur.final]) { cur.final = NASAL_CODA[cur.final]; next.initial = 2; }
		}
		if ((next.initial === 2 || next.initial === 6) && NASAL_CODA[cur.final]) {
			cur.final = NASAL_CODA[cur.final];
		}
	}

	// Pass 9: Lateralization
	for (let i = 0; i < H.length - 1; i++) {
		const cur = H[i], next = H[i + 1];
		if (cur.final === 4 && next.initial === 5) cur.final = 8;
		else if (cur.final === 8 && next.initial === 2) next.initial = 5;
	}

	for (let i = 0; i < hangulIndices.length; i++) {
		chars[hangulIndices[i]] = composeHangul(H[i].initial, H[i].medial, H[i].final);
	}
	return chars.join('');
}

function getPronunciation(text) {
	if (!text || typeof text !== 'string') return text;
	return text.replace(/([가-힣]+)/g, m => getPronunciationWord(m));
}

function initAllDataSets() {
	initProperNames();
	initNumberSystem();
	initSemanticSets();
	initMorphologyData();
}

initAllDataSets();

// =========================================================================
// 10. Module Exports
// =========================================================================
const exportedMembers = {
	hasBatchim,
	getStem,
	getVowelHarmony,
	applyMorphology,
	decomposeHangul,
	composeHangul,
	setFinal,
	getPronunciationWord,
	getPronunciation,
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
	initTemplateToGrammarMap,
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
	decodeLanguageUnitIds,
	properNames,
	getProperNames,
	setProperNames,
	getRandomProperName,
	initProperNames,
	initNumberSystem,
	initSemanticSets,
	initMorphologyData,
	initAllDataSets,
	getSinoNumber,
	getKoreanNumber,
	getNumberTokenOptions,
	KOREAN_NUMBER_VALUES,
	SINO_DIGITS,
	PURE_KOREAN_TENS,
	PURE_KOREAN_ONES_CARDINAL,
	PURE_KOREAN_ONES_ATTRIBUTIVE,
	ELDER_NOUN_TITLES,
	INANIMATE_INSTITUTION_NAMES,
	ORIGIN_VERBS,
	ALLATIVE_GOAL_VERBS,
	STATIC_EXISTENCE_VERBS,
	HUMBLE_DATIVE_VERBS,
	PARTICLE_PAIRS,
	PRONOUN_REPLACEMENTS,
	HONORIFIC_VERB_SUPPLETIONS,
	HUMBLE_VERB_SUPPLETIONS,
	HONORIFIC_NOUN_SUPPLETIONS,
	HUMBLE_PRONOUN_SUPPLETIONS,
	PLAIN_COUNTERPARTS,
	HONORIFIC_WORDS,
	HUMBLE_WORDS,
	FORBIDDEN_PLAIN_WORDS_FOR_ELDERS,
	isElderNoun,
	isInanimateInstitution,
	getHonorificVerb,
	getHumbleVerb,
	getHonorificNoun,
	getHumblePronoun,
	getPlainCounterpart,
	isHonorificWord,
	isHumbleWord,
	isForbiddenForElder,
	getHonorificPredicate,
	getHumblePredicate,
	applyHonorificConcord,
	validateHonorificConcord,
	TokenOption,
	deduplicateTokenOptions,
	getConjugatedStem,
	ACTION_VERB_SPECS,
	DESCRIPTIVE_VERB_SPECS,
	getNounCandidatesForVerb,
	getSubjectCandidatesForDescriptiveVerb,
	getVerbParticleType,
	parseAndValidateCollocationFilter,
	attachParticle,
	getNounUnit,
	getVerbUnit,
	hasRieulBatchim,
	PAST_TIME_WORDS,
	FUTURE_TIME_WORDS,
	PRESENT_TIME_WORDS,
	BARE_TIME_WORDS_NO_PARTICLE,
	PAST_GRAMMAR_IDS,
	FUTURE_GRAMMAR_IDS,
	PRESENT_GRAMMAR_IDS,
	getTemporalPolarity,
	isDeicticTimeWord,
	filterWordsByTense,
	filterGrammarByTense,
	validateTemporalConcord,
	applyTemporalConcord,
	KOREAN_CLASSIFIERS,
	SINO_CLASSIFIERS,
	CLASSIFIER_UNITS,
	CLASSIFIER_NOUN_SPECS,
	isClassifier,
	getClassifierNumeralType,
	getMatchingClassifier,
	getMatchingNounsForClassifier,
	getClassifierCandidatesForNoun,
	isCompatibleNounAndClassifier,
	buildCountingPhrase,
	buildClockTimePhrase,
	getMonthName,
	applyCounterConcord,
	validateCounterConcord
};

if (typeof window !== 'undefined') {
	Object.assign(window, exportedMembers);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = exportedMembers;
}
