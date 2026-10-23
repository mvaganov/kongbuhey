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
	if (conjugation && conjugation !== "regular" && conjugation !== "" && /^[a-z_]+$/.test(conjugation)) {
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

let SPATIAL_POSITIONS = new Map();
let DEICTIC_DETERMINERS = new Map();
let DEICTIC_PRONOUNS = new Map();
let DEICTIC_LOCATIVES = new Map();
let DEICTIC_DIRECTIONS = new Map();

let IMPERATIVE_GRAMMAR_IDS = new Set();
let PROPOSITIVE_GRAMMAR_IDS = new Set();
let INABILITY_NEGATION_IDS = new Set();
let GENERAL_NEGATION_IDS = new Set();
let VOLITIONAL_GRAMMAR_IDS = new Set();
let FORBIDDEN_NEGATIVE_ROOTS = new Set();
let NEGATION_SUPPLETIONS = new Map();
let AFFIRMATIVE_COUNTERPARTS = new Map();
let SHORT_NEGATION_WORDS = new Set();
let SHORT_INABILITY_WORDS = new Set();
let SHORT_GENERAL_WORDS = new Set();
let DESCRIPTIVE_SURFACE_MAP = new Map();
let FORBIDDEN_DV_IMPERATIVE_FORMS = new Map();
let FORBIDDEN_DV_PROPOSITIVE_FORMS = new Map();
let FORBIDDEN_DV_LONG_INABILITY_FORMS = new Map();
let FORBIDDEN_DV_VOLITIONAL_FORMS = new Map();
let DEGREE_ADVERBS = new Map();
let MANNER_ADVERBS = new Map();
let DISCOURSE_ADVERBS = new Map();
let NEGATIVE_POLARITY_ADVERBS = new Map();
let ALL_NPI_WORDS = new Set();
let AFFIRMATIVE_DEGREE_ADVERBS = new Map();
let CLAUSAL_CONNECTIVES = new Map();
let CAUSAL_CONNECTIVES = new Map();
let CONTRAST_CONNECTIVES = new Map();
let PURPOSE_CONNECTIVES = new Map();
let CONDITION_CONNECTIVES = new Map();
let SIMULTANEOUS_CONNECTIVES = new Map();
let MOTION_VERBS = new Set();
let MOTION_VERB_STEMS = new Set();
let MULTI_WORD_CONNECTIVE_RULES = [];
let DYNAMIC_SUFFIX_RULES = [];

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
	SPATIAL_POSITIONS.clear();
	DEICTIC_DETERMINERS.clear();
	DEICTIC_PRONOUNS.clear();
	DEICTIC_LOCATIVES.clear();
	DEICTIC_DIRECTIONS.clear();
	IMPERATIVE_GRAMMAR_IDS.clear();
	PROPOSITIVE_GRAMMAR_IDS.clear();
	INABILITY_NEGATION_IDS.clear();
	GENERAL_NEGATION_IDS.clear();
	VOLITIONAL_GRAMMAR_IDS.clear();
	FORBIDDEN_NEGATIVE_ROOTS.clear();
	NEGATION_SUPPLETIONS.clear();
	AFFIRMATIVE_COUNTERPARTS.clear();
	SHORT_NEGATION_WORDS.clear();
	SHORT_INABILITY_WORDS.clear();
	SHORT_GENERAL_WORDS.clear();
	DESCRIPTIVE_SURFACE_MAP.clear();
	FORBIDDEN_DV_IMPERATIVE_FORMS.clear();
	FORBIDDEN_DV_PROPOSITIVE_FORMS.clear();
	FORBIDDEN_DV_LONG_INABILITY_FORMS.clear();
	FORBIDDEN_DV_VOLITIONAL_FORMS.clear();
	DEGREE_ADVERBS.clear();
	MANNER_ADVERBS.clear();
	DISCOURSE_ADVERBS.clear();
	NEGATIVE_POLARITY_ADVERBS.clear();
	ALL_NPI_WORDS.clear();
	AFFIRMATIVE_DEGREE_ADVERBS.clear();
	CLAUSAL_CONNECTIVES.clear();
	CAUSAL_CONNECTIVES.clear();
	CONTRAST_CONNECTIVES.clear();
	PURPOSE_CONNECTIVES.clear();
	CONDITION_CONNECTIVES.clear();
	SIMULTANEOUS_CONNECTIVES.clear();
	MOTION_VERBS.clear();
	MOTION_VERB_STEMS.clear();
	MULTI_WORD_CONNECTIVE_RULES = [];
	DYNAMIC_SUFFIX_RULES = [];

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

		// Spatial position nouns
		if (pos === "Noun" && (hasTag(unit, "position") || (sv && sv.domain === "position"))) {
			SPATIAL_POSITIONS.set(ko, {
				unit,
				ko,
				en: unit[DATA_SCHEMA.English],
				domain: sv?.domain || "position",
				direction: sv?.direction || null
			});
		}

		// Deictic Demonstratives & Determiners
		if (hasTag(unit, "deictic", "demonstrative") || (sv && (sv.proximity || sv.deictic_type))) {
			const prox = sv?.proximity || (hasTag(unit, "proximal") ? "proximal" : hasTag(unit, "medial") ? "medial" : hasTag(unit, "distal") ? "distal" : hasTag(unit, "interrogative") ? "interrogative" : "proximal");
			const deicticType = sv?.deictic_type || (pos === "Determiner" ? "determiner" : pos === "Pronoun" && hasTag(unit, "place", "location") ? "place" : pos === "Pronoun" ? "thing" : hasTag(unit, "direction") ? "direction" : null);

			if (pos === "Determiner" || deicticType === "determiner") {
				DEICTIC_DETERMINERS.set(ko, { unit, ko, proximity: prox, type: "determiner" });
			} else if (deicticType === "thing" || (pos === "Pronoun" && !hasTag(unit, "place", "location") && (hasTag(unit, "thing", "object") || sv?.domain === "object"))) {
				DEICTIC_PRONOUNS.set(ko, { unit, ko, proximity: prox, type: "thing", formality: unit[DATA_SCHEMA.FormalityLevel] });
			} else if (deicticType === "place" || (hasTag(unit, "place", "location") && (pos === "Pronoun" || pos === "Noun"))) {
				DEICTIC_LOCATIVES.set(ko, { unit, ko, proximity: prox, type: "place" });
			} else if (deicticType === "direction" || hasTag(unit, "direction")) {
				DEICTIC_DIRECTIONS.set(ko, { unit, ko, proximity: prox, type: "direction" });
			}
		}

		// Predicate Mood, Speech Act & Negation (Feature 8)
		if (pos === "Grammar") {
			if (sv?.mood === "imperative" || hasTag(unit, "imperative", "prohibition")) {
				IMPERATIVE_GRAMMAR_IDS.add(unitId);
			}
			if (sv?.mood === "propositive" || hasTag(unit, "propositive", "suggestion")) {
				PROPOSITIVE_GRAMMAR_IDS.add(unitId);
			}
			if (sv?.negation_type === "inability" || hasTag(unit, "inability")) {
				INABILITY_NEGATION_IDS.add(unitId);
			}
			if (sv?.negation_type === "long_general" || (hasTag(unit, "negative") && !hasTag(unit, "inability"))) {
				GENERAL_NEGATION_IDS.add(unitId);
			}
			if (sv?.mood === "volitional" || hasTag(unit, "volitional", "desire")) {
				VOLITIONAL_GRAMMAR_IDS.add(unitId);
			}
		}

		if (pos === "Adverb") {
			if (sv?.negation_type === "short_inability" || hasTag(unit, "inability")) {
				SHORT_INABILITY_WORDS.add(ko);
				SHORT_NEGATION_WORDS.add(ko);
			}
			if (sv?.negation_type === "short_general" || (hasTag(unit, "negative") && !hasTag(unit, "inability"))) {
				SHORT_GENERAL_WORDS.add(ko);
				SHORT_NEGATION_WORDS.add(ko);
			}
		}

		if (sv?.negation_suppletion) {
			NEGATION_SUPPLETIONS.set(ko, sv.negation_suppletion);
			if (sv.forbidden_negative_root) {
				FORBIDDEN_NEGATIVE_ROOTS.add(ko);
			}
		}
		if (sv?.affirmative_counterpart) {
			AFFIRMATIVE_COUNTERPARTS.set(ko, sv.affirmative_counterpart);
		}

		// Adverbial Sub-Typing & Syntactic Placement (Feature 9)
		if (pos === "Adverb" || pos === "Conjunction") {
			const isDiscourse = sv?.adverb_type === "discourse" || pos === "Conjunction" || hasTag(unit, "adverb_discourse", "discourse", "conjunction");
			const isNPI = sv?.npi || sv?.polarity_requirement === -1 || hasTag(unit, "negative_polarity", "npi");
			let isDegree = sv?.adverb_type === "degree";
			let isManner = sv?.adverb_type === "manner";

			if (!isDegree && !isManner && !isDiscourse) {
				if (hasTag(unit, "adverb_degree", "degree")) isDegree = true;
				else if (hasTag(unit, "adverb_manner", "manner")) isManner = true;
			}

			if (isDiscourse) {
				DISCOURSE_ADVERBS.set(ko, { unit, ko, position: "sentence_initial" });
			}
			if (isNPI) {
				NEGATIVE_POLARITY_ADVERBS.set(ko, { unit, ko, polarity_requirement: -1, npi: true });
				ALL_NPI_WORDS.add(ko);
			}
			if (isDegree) {
				DEGREE_ADVERBS.set(ko, { unit, ko, target_pos: sv?.target_pos || "Descriptive Verb", npi: isNPI });
				if (!isNPI) {
					AFFIRMATIVE_DEGREE_ADVERBS.set(ko, { unit, ko, target_pos: sv?.target_pos || "Descriptive Verb" });
				}
			}
			if (isManner) {
				MANNER_ADVERBS.set(ko, { unit, ko, target_pos: sv?.target_pos || "Action Verb" });
			}
		}

		// Feature 11: Motion Verbs for purpose connective concord (-(으)러)
		if (pos === "Action Verb" && hasTag(unit, "motion_concord")) {
			MOTION_VERBS.add(ko);
			MOTION_VERB_STEMS.add(getStem(ko));
		}

		// Feature 11: Clausal Connectives (Causal, Contrastive, Purpose, Condition, Simultaneous)
		if (pos === "Connective" || pos === "Grammar" || hasTag(unit, "connective", "conjunction", "clausal_connective", "reason", "cause", "purpose", "condition", "contrast", "simultaneous")) {
			const isConnective = hasTag(unit, "connective", "conjunction", "clausal_connective") ||
				pos === "Connective" ||
				(pos === "Grammar" && (hasTag(unit, "reason", "cause", "purpose", "condition", "contrast", "simultaneous") || sv?.clause1_tense_allowed !== undefined || sv?.clause2_moods_allowed !== undefined));

			if (isConnective) {
				const connectiveInfo = {
					unit,
					ko,
					id: unit[DATA_SCHEMA.Id],
					clause1_tense_allowed: sv?.clause1_tense_allowed !== undefined ? sv.clause1_tense_allowed : true,
					clause2_moods_allowed: sv?.clause2_moods_allowed || ["declarative", "interrogative", "imperative", "propositive", "suggestive"],
					clause1_pos: sv?.clause1_pos || ["Action Verb", "Descriptive Verb"],
					same_subject: sv?.same_subject || false,
					outcome_polarity: sv?.outcome_polarity !== undefined ? sv.outcome_polarity : 0,
					motion_verb_required: sv?.motion_verb_required || false,
					function: sv?.function || (sv?.connective_type === "causal" || sv?.domain === "causal" || hasTag(unit, "reason", "cause", "causal") ? "cause" : (sv?.connective_type === "contrast" || sv?.domain === "contrast" || hasTag(unit, "contrast") ? "contrast" : (sv?.connective_type === "purpose" || sv?.domain === "purpose" || hasTag(unit, "purpose") ? "purpose" : (sv?.connective_type === "condition" || sv?.domain === "condition" || hasTag(unit, "condition") ? "condition" : (sv?.connective_type === "simultaneous" || sv?.domain === "simultaneous" || hasTag(unit, "simultaneous") ? "simultaneous" : "general"))))),
					surface_forms: Array.isArray(sv?.surface_forms) ? sv.surface_forms : []
				};

				const registerKey = (k) => {
					if (!k) return;
					const trimmed = String(k).trim();
					CLAUSAL_CONNECTIVES.set(trimmed, connectiveInfo);
					const stripped = trimmed.replace(/^[-~]/, "");
					CLAUSAL_CONNECTIVES.set(stripped, connectiveInfo);
					CLAUSAL_CONNECTIVES.set(`-${stripped}`, connectiveInfo);
					CLAUSAL_CONNECTIVES.set(`~${stripped}`, connectiveInfo);
				};

				registerKey(ko);
				CLAUSAL_CONNECTIVES.set(String(unit[DATA_SCHEMA.Id]), connectiveInfo);
				for (const sf of connectiveInfo.surface_forms) {
					registerKey(sf);
				}

				if (connectiveInfo.function === "cause" || hasTag(unit, "reason", "cause", "causal")) {
					CAUSAL_CONNECTIVES.set(ko, connectiveInfo);
				} else if (connectiveInfo.function === "contrast" || hasTag(unit, "contrast")) {
					CONTRAST_CONNECTIVES.set(ko, connectiveInfo);
				} else if (connectiveInfo.function === "purpose" || hasTag(unit, "purpose")) {
					PURPOSE_CONNECTIVES.set(ko, connectiveInfo);
				} else if (connectiveInfo.function === "condition" || hasTag(unit, "condition")) {
					CONDITION_CONNECTIVES.set(ko, connectiveInfo);
				} else if (connectiveInfo.function === "simultaneous" || hasTag(unit, "simultaneous")) {
					SIMULTANEOUS_CONNECTIVES.set(ko, connectiveInfo);
				}
			}
		}
	}

	// Precompute descriptive verb surface forms and forbidden mood combinations (Feature 8)
	const descriptiveUnits = allUnits.filter(u => u && u[DATA_SCHEMA.PartofSpeech] === "Descriptive Verb");
	for (const du of descriptiveUnits) {
		const dKo = du[DATA_SCHEMA.Korean];
		if (!dKo) continue;
		const dConj = du[DATA_SCHEMA.Conjugation];
		const dStem = getConjugatedStem(dKo, dConj);
		const rawStem = getStem(dKo);

		// Record surface forms for inability checking (못 + [DV])
		DESCRIPTIVE_SURFACE_MAP.set(dKo, du);
		DESCRIPTIVE_SURFACE_MAP.set(rawStem, du);
		DESCRIPTIVE_SURFACE_MAP.set(applyMorphology(dStem + "아/어요"), du);
		DESCRIPTIVE_SURFACE_MAP.set(applyMorphology(dStem + "아/어"), du);
		DESCRIPTIVE_SURFACE_MAP.set(applyMorphology(dStem + "습니다/ㅂ니다"), du);
		DESCRIPTIVE_SURFACE_MAP.set(applyMorphology(dStem + "았/었어요"), du);
		DESCRIPTIVE_SURFACE_MAP.set(applyMorphology(dStem + "았/었습니다"), du);

		// Forbidden imperative combinations
		FORBIDDEN_DV_IMPERATIVE_FORMS.set(applyMorphology(dStem + "으/십시오"), dKo);
		FORBIDDEN_DV_IMPERATIVE_FORMS.set(applyMorphology(dStem + "으/세요"), dKo);
		FORBIDDEN_DV_IMPERATIVE_FORMS.set(applyMorphology(dStem + "아/어라"), dKo);
		FORBIDDEN_DV_IMPERATIVE_FORMS.set(rawStem + "지 마세요", dKo);
		FORBIDDEN_DV_IMPERATIVE_FORMS.set(rawStem + "지 마십시오", dKo);
		FORBIDDEN_DV_IMPERATIVE_FORMS.set(rawStem + "지 마", dKo);
		FORBIDDEN_DV_IMPERATIVE_FORMS.set(rawStem + "지 마라", dKo);

		// Forbidden propositive combinations
		FORBIDDEN_DV_PROPOSITIVE_FORMS.set(applyMorphology(dStem + "으/ㅂ시다"), dKo);
		FORBIDDEN_DV_PROPOSITIVE_FORMS.set(rawStem + "자", dKo);
		FORBIDDEN_DV_PROPOSITIVE_FORMS.set(rawStem + "세", dKo);

		// Forbidden inability long combinations
		FORBIDDEN_DV_LONG_INABILITY_FORMS.set(rawStem + "지 못해요", dKo);
		FORBIDDEN_DV_LONG_INABILITY_FORMS.set(rawStem + "지 못합니다", dKo);
		FORBIDDEN_DV_LONG_INABILITY_FORMS.set(rawStem + "지 못하다", dKo);
		FORBIDDEN_DV_LONG_INABILITY_FORMS.set(rawStem + "지 못했다", dKo);
		FORBIDDEN_DV_LONG_INABILITY_FORMS.set(rawStem + "지 못했어요", dKo);
		FORBIDDEN_DV_LONG_INABILITY_FORMS.set(rawStem + "지 못했습니다", dKo);

		// Forbidden volitional combinations
		FORBIDDEN_DV_VOLITIONAL_FORMS.set(rawStem + "고 싶어요", dKo);
		FORBIDDEN_DV_VOLITIONAL_FORMS.set(rawStem + "고 싶습니다", dKo);
		FORBIDDEN_DV_VOLITIONAL_FORMS.set(rawStem + "고 싶다", dKo);
		FORBIDDEN_DV_VOLITIONAL_FORMS.set(rawStem + "고 싶어해요", dKo);
		FORBIDDEN_DV_VOLITIONAL_FORMS.set(rawStem + "고 싶어합니다", dKo);
	}

	// Feature 11: Compile dynamic multi-word and suffix connective parsing rules from CLAUSAL_CONNECTIVES
	const seenMultiWords = new Set();
	const seenSuffixes = new Set();
	const uniqueConnectiveSpecs = new Set(CLAUSAL_CONNECTIVES.values());

	for (const spec of uniqueConnectiveSpecs) {
		const rawForms = [spec.ko, ...(spec.surface_forms || [])];
		const canonicalConn = spec.ko.startsWith("~") ? "-" + spec.ko.slice(1) : spec.ko;
		for (const raw of rawForms) {
			if (!raw) continue;
			const clean = String(raw).trim().replace(/^[-~]/, "");
			if (clean.includes(" ") || clean.includes("때문에") || clean.includes("바람에") || clean.includes("후에") || clean.includes("때")) {
				if (!seenMultiWords.has(clean)) {
					seenMultiWords.add(clean);
					const pattern = new RegExp(`^(.*?)\\s*${clean.replace(/\s+/g, "\\s*")}\\s*(.*)$`);
					MULTI_WORD_CONNECTIVE_RULES.push({
						pattern,
						connective: canonicalConn,
						cWord: clean
					});
				}
			} else {
				const suffixItems = [];
				if (clean.includes("(으)")) {
					suffixItems.push({ suffix: clean.replace(/\(으\)/g, "으"), strip: clean.replace(/\(으\)/g, "으") });
					suffixItems.push({ suffix: clean.replace(/\(으\)/g, ""), strip: clean.replace(/\(으\)/g, "") });
				} else if (clean.includes("(느)")) {
					suffixItems.push({ suffix: clean.replace(/\(느\)/g, "느"), strip: clean.replace(/\(느\)/g, "느") });
					suffixItems.push({ suffix: clean.replace(/\(느\)/g, ""), strip: clean.replace(/\(느\)/g, "") });
				} else {
					suffixItems.push({ suffix: clean, strip: clean });
				}

				if (spec.ko.includes("아/어서") || clean === "아/어서") {
					suffixItems.push({ suffix: "았어서", strip: "어서" });
					suffixItems.push({ suffix: "었어서", strip: "어서" });
					suffixItems.push({ suffix: "였어서", strip: "어서" });
					suffixItems.push({ suffix: "했어서", strip: "어서" });
					suffixItems.push({ suffix: "서", strip: "서", isSeoRule: true });
				}

				for (const item of suffixItems) {
					if (!item.suffix || seenSuffixes.has(item.suffix)) continue;
					seenSuffixes.add(item.suffix);
					DYNAMIC_SUFFIX_RULES.push({
						suffix: item.suffix,
						strip: item.strip,
						connective: canonicalConn,
						isSeoRule: !!item.isSeoRule
					});
				}
			}
		}
	}

	const standardMultiGrammar = [
		{ form: "ㄴ 후에", canonical: "-(으)ㄴ 후에" },
		{ form: "은 후에", canonical: "-(으)ㄴ 후에" },
		{ form: "ㄹ 때", canonical: "-(으)ㄹ 때" },
		{ form: "을 때", canonical: "-(으)ㄹ 때" }
	];
	for (const smg of standardMultiGrammar) {
		if (!seenMultiWords.has(smg.form)) {
			seenMultiWords.add(smg.form);
			MULTI_WORD_CONNECTIVE_RULES.push({
				pattern: new RegExp(`^(.*?)\\s*${smg.form.replace(/\s+/g, "\\s*")}\\s*(.*)$`),
				connective: smg.canonical,
				cWord: smg.form
			});
		}
	}

	MULTI_WORD_CONNECTIVE_RULES.sort((a, b) => b.cWord.length - a.cWord.length);
	DYNAMIC_SUFFIX_RULES.sort((a, b) => b.suffix.length - a.suffix.length);

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

// =========================================================================
// Feature 7: Deictic Demonstratives & Spatial Relational Noun Phrase Syntax
// =========================================================================

function getSpatialPositions(options = {}) {
	if (options.asUnits) {
		return Array.from(SPATIAL_POSITIONS.values()).map(v => v.unit);
	}
	return Array.from(SPATIAL_POSITIONS.keys());
}

function getDeicticDemonstratives(options = {}) {
	const results = [];
	const filterType = options.type;
	const filterProx = options.proximity;

	const mapsToSearch = [];
	if (!filterType || filterType === "determiner") mapsToSearch.push(DEICTIC_DETERMINERS);
	if (!filterType || filterType === "thing" || filterType === "pronoun") mapsToSearch.push(DEICTIC_PRONOUNS);
	if (!filterType || filterType === "place" || filterType === "locative") mapsToSearch.push(DEICTIC_LOCATIVES);
	if (!filterType || filterType === "direction") mapsToSearch.push(DEICTIC_DIRECTIONS);

	for (const m of mapsToSearch) {
		for (const [ko, entry] of m.entries()) {
			if (filterProx && entry.proximity !== filterProx) continue;
			results.push(entry);
		}
	}
	return results;
}

function isStaticExistenceVerb(verbOrKo) {
	if (!verbOrKo) return false;
	const ko = typeof verbOrKo === 'string' ? verbOrKo : (Array.isArray(verbOrKo) ? verbOrKo[DATA_SCHEMA.Korean] : "");
	if (STATIC_EXISTENCE_VERBS.has(ko)) return true;
	const unit = getVerbUnit(verbOrKo);
	if (unit) {
		if (hasTag(unit, "static", "existence", "residence", "locative_static")) return true;
		const sv = parseSemanticVector(unit);
		if (sv && sv.locative === "static") return true;
	}
	return false;
}

function buildSpatialPhrase(referenceNounOrPosition, positionOrOptions = null, maybeOptions = {}) {
	let referenceNoun = referenceNounOrPosition;
	let position = positionOrOptions;
	let options = maybeOptions;

	if (typeof positionOrOptions === 'object' && positionOrOptions !== null && !Array.isArray(positionOrOptions)) {
		options = positionOrOptions;
		position = null;
	}

	const refNounKo = typeof referenceNoun === 'string' ? referenceNoun : (Array.isArray(referenceNoun) ? referenceNoun[DATA_SCHEMA.Korean] : "");
	if (!position && SPATIAL_POSITIONS.has(refNounKo)) {
		position = referenceNoun;
		referenceNoun = null;
	}

	const refUnit = typeof referenceNoun === 'object' && Array.isArray(referenceNoun) ? referenceNoun : getNounUnit(referenceNoun);
	const refKo = typeof referenceNoun === 'string' ? referenceNoun : (refUnit ? refUnit[DATA_SCHEMA.Korean] : "");

	let posUnit = typeof position === 'object' && Array.isArray(position) ? position : null;
	let posKo = typeof position === 'string' ? position : (posUnit ? posUnit[DATA_SCHEMA.Korean] : "");

	if (!posKo) {
		const positions = getSpatialPositions();
		posKo = positions.length > 0 ? positions[Math.floor(Math.random() * positions.length)] : "위";
		posUnit = SPATIAL_POSITIONS.get(posKo)?.unit;
	} else if (!posUnit && SPATIAL_POSITIONS.has(posKo)) {
		posUnit = SPATIAL_POSITIONS.get(posKo)?.unit;
	}

	// Prenominal modifying noun phrase: [Ground] 위의 [Modifying Noun]
	if (options.modifyingNoun) {
		const modKo = typeof options.modifyingNoun === 'string' ? options.modifyingNoun : options.modifyingNoun[DATA_SCHEMA.Korean];
		return `${refKo ? refKo + " " : ""}${posKo}의 ${modKo}`;
	}

	const hasGenitive = options.genitive === true;
	const refPart = hasGenitive ? `${refKo}의` : refKo;

	let particle = options.particle;
	if (!particle) {
		if (options.verb) {
			particle = "location";
		} else {
			particle = "location_static";
		}
	} else if (particle === "static") {
		particle = "location_static";
	} else if (particle === "dynamic") {
		particle = "location_dynamic";
	}

	const attachedPos = attachParticle(posKo, particle, options.verb, options);
	return refPart ? `${refPart} ${attachedPos}` : attachedPos;
}

function buildDeicticPhrase(proximity = "proximal", targetType = "noun", options = {}) {
	if (targetType === "noun" || options.noun) {
		const determinerEntry = Array.from(DEICTIC_DETERMINERS.values()).find(d => d.proximity === proximity);
		const detKo = determinerEntry ? determinerEntry.ko : (proximity === "medial" ? "그" : proximity === "distal" ? "저" : "이");
		const nounKo = typeof options.noun === 'string' ? options.noun : (options.noun ? options.noun[DATA_SCHEMA.Korean] : (typeof targetType === 'string' && targetType !== "noun" ? targetType : "책"));
		if (options.particle) {
			return `${detKo} ` + attachParticle(nounKo, options.particle, options.verb, options);
		}
		return `${detKo} ${nounKo}`;
	}

	if (targetType === "thing" || targetType === "pronoun") {
		const candidates = Array.from(DEICTIC_PRONOUNS.values()).filter(p => p.proximity === proximity);
		const colloquial = options.colloquial === true;
		const entry = candidates.find(c => colloquial ? (c.formality === "informal_low" || c.ko.endsWith("거")) : !c.ko.endsWith("거")) || candidates[0];
		const baseKo = entry ? entry.ko : (proximity === "medial" ? "그것" : proximity === "distal" ? "저것" : "이것");
		if (options.particle) {
			return applyMorphology(attachParticle(baseKo, options.particle, options.verb, options));
		}
		return baseKo;
	}

	if (targetType === "place" || targetType === "locative") {
		const formal = options.formal === true;
		const candidates = Array.from(DEICTIC_LOCATIVES.values()).filter(l => l.proximity === proximity);
		const entry = candidates.find(c => formal ? c.ko.endsWith("곳") : !c.ko.endsWith("곳")) || candidates[0];
		const baseKo = entry ? entry.ko : (proximity === "medial" ? "거기" : proximity === "distal" ? "저기" : "여기");
		if (options.particle) {
			return attachParticle(baseKo, options.particle, options.verb, options);
		}
		return baseKo;
	}

	if (targetType === "direction") {
		const candidates = Array.from(DEICTIC_DIRECTIONS.values()).filter(d => d.proximity === proximity);
		const entry = candidates[0];
		const baseKo = entry ? entry.ko : (proximity === "medial" ? "그쪽" : proximity === "distal" ? "저쪽" : "이쪽");
		if (options.particle) {
			return attachParticle(baseKo, options.particle, options.verb, options);
		}
		return baseKo;
	}

	return "";
}

function validateSpatialConcord(input, context = {}) {
	const errors = [];
	const text = typeof input === 'string' ? input : (input && input.text ? input.text : "");
	if (!text) return { valid: true, errors: [] };

	// 1. Determiner Bare Particle Prohibition
	// Bare determiners modifying no nominal: 이, 그, 저, 어느 cannot attach case particles directly (*이가, *이를, *그을, *어느를)
	const bareDeterminerMatches = text.match(/(^|[^가-힣])(?:(이)(가|를|을|에서)|(그)(가|를|을|에서)|(어느)(가|를|을|는|은|에|에서)|(저가))(?=[^가-힣]|$)/g);
	if (bareDeterminerMatches) {
		for (const m of bareDeterminerMatches) {
			errors.push(`Bare demonstrative determiner cannot attach case particle directly: "${m.trim()}" in "${text}"`);
		}
	}

	// 2. Spatial Relational Frame Static vs Dynamic Verb Particle Harmony
	const positionsPattern = Array.from(SPATIAL_POSITIONS.keys()).join('|');
	if (positionsPattern) {
		// Static existence verb takes -에 (not -에서): e.g. *책상 위에서 책이 있어요
		const staticStems = Array.from(STATIC_EXISTENCE_VERBS).map(v => v.replace(/다$/, '')).concat(['누워', '계세', '계십', '계셔', '계셨']);
		if (staticStems.length > 0) {
			const staticErrorRegex = new RegExp(`(?:${positionsPattern})에서\\s+(?:[^.!?]*\\s+)?(?:${staticStems.join('|')})`);
			if (staticErrorRegex.test(text)) {
				errors.push(`Spatial position noun takes '-에' (not '-에서') with static existence verb in: "${text}"`);
			}
		}

		// Dynamic action verb takes -에서 (not -에): e.g. *학교 앞에 친구를 만나요
		const dynamicActionErrorRegex = new RegExp(`(?:${positionsPattern})에\\s+(?:[가-힣]+[을를]\\s+)(?:만나|공부(?:하|해|했)|일(?:하|해|했)|운동(?:하|해|했)|먹|사|놀|기다(?:리|려)|마시|마셔|읽)`);
		if (dynamicActionErrorRegex.test(text)) {
			errors.push(`Spatial position noun takes '-에서' (not '-에') with dynamic action verb in: "${text}"`);
		}
	}

	return {
		valid: errors.length === 0,
		errors
	};
}

function applySpatialConcord(input) {
	if (typeof input === 'object' && input !== null) {
		let text = input.text || "";
		if (text) {
			text = applySpatialConcord(text);
		}
		return { ...input, text };
	}

	let str = String(input);

	// Repair bare determiner + particle errors
	str = str.replace(/(^|[^가-힣])이가(?=[^가-힣]|$)/g, '$1이게');
	str = str.replace(/(^|[^가-힣])이를(?=[^가-힣]|$)/g, '$1이걸');
	str = str.replace(/(^|[^가-힣])그가(?=[^가-힣]|$)/g, '$1그게');
	str = str.replace(/(^|[^가-힣])그를(?=[^가-힣]|$)/g, '$1그걸');

	// Repair static verb locative error on spatial positions: [Position]에서 ... 있다 -> [Position]에 ...
	const positionsPattern = Array.from(SPATIAL_POSITIONS.keys()).join('|');
	if (positionsPattern) {
		const staticStems = Array.from(STATIC_EXISTENCE_VERBS).map(v => v.replace(/다$/, '')).concat(['누워', '계세', '계십', '계셔', '계셨']);
		if (staticStems.length > 0) {
			const repRegex = new RegExp(`(${positionsPattern})에서(\\s+(?:[^.!?]*\\s+)?(?:${staticStems.join('|')}))`, 'g');
			str = str.replace(repRegex, '$1에$2');
		}

		const dynamicRepRegex = new RegExp(`(${positionsPattern})에(\\s+(?:[가-힣]+[을를]\\s+)(?:만나|공부(?:하|해|했)|일(?:하|해|했)|운동(?:하|해|했)|먹|사|놀|기다(?:리|려)|마시|마셔|읽))`, 'g');
		str = str.replace(dynamicRepRegex, '$1에서$2');
	}

	return str;
}

// =========================================================================
// Feature 8: Predicate Mood, Speech Act & Negation Restrictions
// =========================================================================

function isDescriptiveVerb(verbOrKo) {
	if (!verbOrKo) return false;
	const verbUnit = getVerbUnit(verbOrKo);
	if (verbUnit) {
		return verbUnit[DATA_SCHEMA.PartofSpeech] === "Descriptive Verb" || hasTag(verbUnit, "descriptive_verb");
	}
	const ko = typeof verbOrKo === 'string' ? verbOrKo : "";
	const dv = getWords("Descriptive Verb").find(v => v[DATA_SCHEMA.Korean] === ko);
	return !!dv;
}

function isActionVerb(verbOrKo) {
	if (!verbOrKo) return false;
	const verbUnit = getVerbUnit(verbOrKo);
	if (verbUnit) {
		return verbUnit[DATA_SCHEMA.PartofSpeech] === "Action Verb" || hasTag(verbUnit, "action_verb");
	}
	const ko = typeof verbOrKo === 'string' ? verbOrKo : "";
	const av = getWords("Action Verb").find(v => v[DATA_SCHEMA.Korean] === ko);
	return !!av;
}

function canTakeMood(verbOrKo, mood) {
	if (!verbOrKo) return false;
	const isUnit = Array.isArray(verbOrKo);
	const verbUnit = isUnit ? verbOrKo : getVerbUnit(verbOrKo);
	const ko = typeof verbOrKo === 'string' ? verbOrKo : (verbUnit ? verbUnit[DATA_SCHEMA.Korean] : "");
	const pos = verbUnit ? verbUnit[DATA_SCHEMA.PartofSpeech] : "";

	let isAction = false;
	let isDescriptive = false;

	if (isUnit) {
		isAction = pos === "Action Verb" || hasTag(verbUnit, "action_verb");
		isDescriptive = pos === "Descriptive Verb" || hasTag(verbUnit, "descriptive_verb");
	} else {
		isAction = pos === "Action Verb" || isActionVerb(ko);
		isDescriptive = pos === "Descriptive Verb" || (isDescriptiveVerb(ko) && !isAction);
	}

	const normalizedMood = (mood || "").toLowerCase();

	if ((normalizedMood === "negation" || normalizedMood === "short_negation" || normalizedMood === "long_negation") && FORBIDDEN_NEGATIVE_ROOTS.has(ko)) {
		return false;
	}

	if (normalizedMood === "imperative" || normalizedMood === "prohibition" || normalizedMood === "propositive" || normalizedMood === "suggestion") {
		return isAction && !isDescriptive;
	}

	if (normalizedMood === "inability" || normalizedMood === "short_inability" || normalizedMood === "long_inability") {
		return isAction && !isDescriptive;
	}

	if (normalizedMood === "volitional" || normalizedMood === "desire") {
		return isAction && !isDescriptive;
	}

	if (normalizedMood === "negation" || normalizedMood === "short_general" || normalizedMood === "long_general") {
		return !FORBIDDEN_NEGATIVE_ROOTS.has(ko);
	}

	return true;
}

function getNegationSuppletion(verbOrKo) {
	const ko = typeof verbOrKo === 'string' ? verbOrKo : (verbOrKo ? verbOrKo[DATA_SCHEMA.Korean] : "");
	return NEGATION_SUPPLETIONS.get(ko) || null;
}

function getAffirmativeCounterpart(verbOrKo) {
	const ko = typeof verbOrKo === 'string' ? verbOrKo : (verbOrKo ? verbOrKo[DATA_SCHEMA.Korean] : "");
	return AFFIRMATIVE_COUNTERPARTS.get(ko) || null;
}

function conjugatePredicate(verbOrKo, formality = "polite", tense = "present") {
	const verbUnit = getVerbUnit(verbOrKo);
	const ko = typeof verbOrKo === 'string' ? verbOrKo : (verbUnit ? verbUnit[DATA_SCHEMA.Korean] : "");
	if (!ko) return "";
	const conj = verbUnit ? verbUnit[DATA_SCHEMA.Conjugation] : "";
	const stem = getConjugatedStem(ko, conj);
	const isAction = verbUnit ? verbUnit[DATA_SCHEMA.PartofSpeech] === "Action Verb" : isActionVerb(ko);

	if (tense === "past") {
		switch (formality) {
			case "formal":
			case "formal_polite":
				return applyMorphology(stem + "았/었습니다");
			case "plain":
				return applyMorphology(stem + "았/었다");
			case "polite":
			case "polite_informal":
			default:
				return applyMorphology(stem + "았/었어요");
		}
	} else if (tense === "future") {
		switch (formality) {
			case "formal":
			case "formal_polite":
				return applyMorphology(stem + "으/ㄹ 것입니다");
			case "plain":
				return applyMorphology(stem + "으/ㄹ 것이다");
			case "polite":
			case "polite_informal":
			default:
				return applyMorphology(stem + "으/ㄹ 거예요");
		}
	} else {
		switch (formality) {
			case "formal":
			case "formal_polite":
				return applyMorphology(stem + "습니다/ㅂ니다");
			case "plain":
				return isAction ? applyMorphology(stem + "(느)ㄴ다") : (stem + "다");
			case "stem":
				return stem;
			case "polite":
			case "polite_informal":
			default:
				return applyMorphology(stem + "아/어요");
		}
	}
}

function buildNegatedPredicate(verbOrKo, options = {}) {
	const verbUnit = getVerbUnit(verbOrKo);
	const ko = typeof verbOrKo === 'string' ? verbOrKo : (verbUnit ? verbUnit[DATA_SCHEMA.Korean] : "");
	if (!ko) return "";

	const formality = options.formality || "polite";
	const tense = options.tense || "present";
	const isInability = !!options.inability || options.type === "inability";
	const isLong = options.type === "long";

	const suppletive = getNegationSuppletion(ko);
	if (suppletive) {
		return conjugatePredicate(suppletive, formality, tense);
	}

	if (isInability) {
		if (!canTakeMood(ko, "inability")) {
			throw new Error(`Descriptive verb '${ko}' cannot take inability negation (못 / -지 못하다).`);
		}
		const conj = verbUnit ? verbUnit[DATA_SCHEMA.Conjugation] : "";
		const stem = getConjugatedStem(ko, conj);
		if (isLong) {
			return applyMorphology(stem + "지 " + conjugatePredicate("못하다", formality, tense));
		} else {
			return "못 " + conjugatePredicate(ko, formality, tense);
		}
	}

	const conj = verbUnit ? verbUnit[DATA_SCHEMA.Conjugation] : "";
	const stem = getConjugatedStem(ko, conj);
	if (isLong) {
		return applyMorphology(stem + "지 " + conjugatePredicate("않다", formality, tense));
	} else {
		return "안 " + conjugatePredicate(ko, formality, tense);
	}
}

function buildMoodPredicate(verbOrKo, mood, formality = "polite", options = {}) {
	const verbUnit = getVerbUnit(verbOrKo);
	const ko = typeof verbOrKo === 'string' ? verbOrKo : (verbUnit ? verbUnit[DATA_SCHEMA.Korean] : "");
	if (!ko) return "";

	const normalizedMood = (mood || "").toLowerCase();

	if (!canTakeMood(ko, normalizedMood)) {
		throw new Error(`Verb '${ko}' cannot take mood '${mood}'. Descriptive verbs are restricted from imperative, propositive, inability, and volitional moods.`);
	}

	const conj = verbUnit ? verbUnit[DATA_SCHEMA.Conjugation] : "";
	const stem = getConjugatedStem(ko, conj);
	const rawStem = getStem(ko);

	switch (normalizedMood) {
		case "imperative": {
			switch (formality) {
				case "formal":
				case "formal_polite":
				case "formal_high":
					return applyMorphology(stem + "으/십시오");
				case "plain":
				case "informal":
					return applyMorphology(stem + "아/어라");
				case "polite":
				default:
					return applyMorphology(stem + "으/세요");
			}
		}
		case "prohibition": {
			switch (formality) {
				case "formal":
				case "formal_polite":
				case "formal_high":
					return rawStem + "지 마십시오";
				case "plain":
				case "informal":
					return options.plainEnding === "마라" ? (rawStem + "지 마라") : (rawStem + "지 마");
				case "polite":
				default:
					return rawStem + "지 마세요";
			}
		}
		case "propositive": {
			switch (formality) {
				case "formal":
				case "formal_polite":
				case "formal_high":
					return applyMorphology(stem + "으/ㅂ시다");
				case "suggestion":
					return applyMorphology(stem + "으/ㄹ까요?");
				case "plain":
				case "informal":
				default:
					return rawStem + "자";
			}
		}
		case "volitional":
		case "desire": {
			const isThirdPerson = options.person === 3 || options.perspective === "3rd";
			if (isThirdPerson) {
				switch (formality) {
					case "formal":
					case "formal_polite":
					case "formal_high":
						return rawStem + "고 싶어합니다";
					case "plain":
						return rawStem + "고 싶어한다";
					case "polite":
					default:
						return rawStem + "고 싶어해요";
				}
			} else {
				switch (formality) {
					case "formal":
					case "formal_polite":
					case "formal_high":
						return rawStem + "고 싶습니다";
					case "plain":
						return rawStem + "고 싶다";
					case "polite":
					default:
						return rawStem + "고 싶어요";
				}
			}
		}
		default:
			return conjugatePredicate(ko, formality, options.tense || "present");
	}
}

function validateMoodConcord(text, context = {}) {
	const errors = [];
	if (!text || typeof text !== 'string') {
		return { valid: true, errors: [] };
	}

	// 1. Forbidden Negative Roots (알다 -> 모르다, 있다 -> 없다)
	const aldaDirectNeg = /(^|[^가-힣])(?:(?:안|못)\s+(?:알(?:아요|았어요|았습니다|다|고|아서|으면)|압니다)|알지\s+(?:않|못)(?:아요|았습니다|습니다|다|해요|했어요|합니다))(?=[^가-힣]|$)/g;
	if (aldaDirectNeg.test(text)) {
		errors.push(`Verb '알다' cannot be negated directly (must use suppletive '모르다') in: "${text}"`);
	}

	const itdaDirectNeg = /(^|[^가-힣])(?:(?:안|못)\s+(?:있(?:어요|었어요|았습니다|었습니다|다|고|어서|으면)|있습니다)|있지\s+(?:않|못)(?:아요|았습니다|습니다|다|해요|했어요|합니다))(?=[^가-힣]|$)/g;
	if (itdaDirectNeg.test(text)) {
		errors.push(`Verb '있다' cannot be negated directly (must use suppletive '없다') in: "${text}"`);
	}

	// 2. Inability Negation on Descriptive Verbs: 못 + [Descriptive Verb]
	const motRegex = /(^|[^가-힣])못\s+([가-힣]+)(?=[^가-힣]|$)/g;
	let motMatch;
	while ((motMatch = motRegex.exec(text)) !== null) {
		const targetWord = motMatch[2];
		const dvUnit = DESCRIPTIVE_SURFACE_MAP.get(targetWord);
		if (dvUnit) {
			const dvKo = dvUnit[DATA_SCHEMA.Korean];
			errors.push(`Descriptive verb '${dvKo}' cannot take inability negation '못' in: "${text}"`);
		}
	}

	// 3. Long Inability Negation on Descriptive Verbs: [DV]-지 못하다
	for (const [form, dvKo] of FORBIDDEN_DV_LONG_INABILITY_FORMS.entries()) {
		if (text.includes(form)) {
			errors.push(`Descriptive verb '${dvKo}' cannot take inability negation '-지 못하다' in: "${text}"`);
		}
	}

	// 4. Imperative Mood on Descriptive Verbs: [DV]-(으)십시오, [DV]-(으)세요, [DV]-아/어라, [DV]-지 마(세요)
	for (const [form, dvKo] of FORBIDDEN_DV_IMPERATIVE_FORMS.entries()) {
		if (text.includes(form)) {
			errors.push(`Descriptive verb '${dvKo}' cannot take imperative/prohibitive ending in: "${text}"`);
		}
	}

	// 5. Propositive Mood on Descriptive Verbs: [DV]-(으)ㅂ시다, [DV]-자, [DV]-세
	for (const [form, dvKo] of FORBIDDEN_DV_PROPOSITIVE_FORMS.entries()) {
		if (text.includes(form)) {
			errors.push(`Descriptive verb '${dvKo}' cannot take propositive ending in: "${text}"`);
		}
	}

	// 6. Volitional Mood on Descriptive Verbs: [DV]-고 싶다 / [DV]-고 싶어하다
	for (const [form, dvKo] of FORBIDDEN_DV_VOLITIONAL_FORMS.entries()) {
		if (text.includes(form)) {
			errors.push(`Descriptive verb '${dvKo}' cannot take volitional ending directly in: "${text}"`);
		}
	}

	// 7. Volitional Perspective Concord (1st/2nd person vs 3rd person)
	const thirdPersonSubjectRegex = /(^|[^가-힣])(?:친구|어머니|아버지|선생님|그 사람|동생|아이|학생|누나|형|언니|오빠|부모님|할머니|할아버지)(?:이|가|은|는|께서|\s+께서)?\s+(?:[^.!?]*\s+)?([가-힣]+고\s+싶(?:어요|습니다|다))(?=[^가-힣]|$)/;
	if (context.person === 3 || thirdPersonSubjectRegex.test(text)) {
		if (/(?:고\s+싶(?:어요|습니다|다))(?=[^가-힣]|$)/.test(text) && !/(?:고\s+싶어(?:해요|합니다|하다|한다))/.test(text)) {
			errors.push(`3rd person subject requires '-고 싶어하다', not '-고 싶다' in: "${text}"`);
		}
	}

	const firstSecondSubjectRegex = /(^|[^가-힣])(?:나|내|저|제|우리|너|네|당신|자네)(?:는|은|이|가)?\s+(?:[^.!?]*\s+)?([가-힣]+고\s+싶어(?:해요|합니다|하다|한다|해|하니|하냐))(?=[^가-힣]|$)/;
	if (context.person === 1 || context.person === 2 || firstSecondSubjectRegex.test(text)) {
		if (/(?:고\s+싶어(?:해요|합니다|하다|한다|해|하니|하냐))(?=[^가-힣]|$)/.test(text)) {
			errors.push(`1st/2nd person subject requires '-고 싶다', not '-고 싶어하다' in: "${text}"`);
		}
	}

	return {
		valid: errors.length === 0,
		errors: Array.from(new Set(errors))
	};
}

function applyMoodConcord(input, options = {}) {
	if (typeof input === 'object' && input !== null) {
		let text = input.text || "";
		if (text) {
			text = applyMoodConcord(text, options);
		}
		return { ...input, text };
	}

	let str = String(input);

	// 1. Repair direct negation of 알다 -> 모르다
	str = str.replace(/(^|[^가-힣])(?:(?:안|못)\s+알아요|알지\s+(?:않|못)아요)(?=[^가-힣]|$)/g, '$1몰라요');
	str = str.replace(/(^|[^가-힣])(?:(?:안|못)\s+압니다|알지\s+(?:않|못)습니다)(?=[^가-힣]|$)/g, '$1모릅니다');
	str = str.replace(/(^|[^가-힣])(?:(?:안|못)\s+알았습니다|알지\s+(?:않|못)았습니다)(?=[^가-힣]|$)/g, '$1몰랐습니다');
	str = str.replace(/(^|[^가-힣])(?:(?:안|못)\s+알았어요|알지\s+(?:않|못)았어요)(?=[^가-힣]|$)/g, '$1몰랐어요');
	str = str.replace(/(^|[^가-힣])(?:(?:안|못)\s+알다|알지\s+(?:않|못)다)(?=[^가-힣]|$)/g, '$1모르다');

	// 2. Repair direct negation of 있다 -> 없다
	str = str.replace(/(^|[^가-힣])(?:(?:안|못)\s+있어요|있지\s+(?:않|못)아요)(?=[^가-힣]|$)/g, '$1없어요');
	str = str.replace(/(^|[^가-힣])(?:(?:안|못)\s+있습니다|있지\s+(?:않|못)습니다)(?=[^가-힣]|$)/g, '$1없습니다');
	str = str.replace(/(^|[^가-힣])(?:(?:안|못)\s+있었습니다|있지\s+(?:않|못)았습니다)(?=[^가-힣]|$)/g, '$1없었습니다');
	str = str.replace(/(^|[^가-힣])(?:(?:안|못)\s+있었어요|있지\s+(?:않|못)았어요)(?=[^가-힣]|$)/g, '$1없었어요');
	str = str.replace(/(^|[^가-힣])(?:(?:안|못)\s+있다|있지\s+(?:않|못)다)(?=[^가-힣]|$)/g, '$1없다');

	// 3. Repair 못 + [Descriptive Verb] -> 안 + [Descriptive Verb]
	str = str.replace(/(^|[^가-힣])못\s+([가-힣]+)(?=[^가-힣]|$)/g, (match, prefix, word) => {
		if (DESCRIPTIVE_SURFACE_MAP.has(word)) {
			return `${prefix}안 ${word}`;
		}
		return match;
	});

	// 4. Repair [DV]-지 못하다 -> [DV]-지 않다
	for (const [form, dvKo] of FORBIDDEN_DV_LONG_INABILITY_FORMS.entries()) {
		if (str.includes(form)) {
			const rep = form.replace(/지\s*못(해요|합니다|하다|했다|했어요|했습니다)/, '지 않$1')
			                .replace(/지 않해요/, '지 않아요')
			                .replace(/지 않합니다/, '지 않습니다')
			                .replace(/지 않하다/, '지 않다')
			                .replace(/지 않했다/, '지 않았다')
			                .replace(/지 않했어요/, '지 않았어요')
			                .replace(/지 않했습니다/, '지 않았습니다');
			str = str.replace(form, rep);
		}
	}

	// 5. Repair Volitional perspective
	const thirdPersonSubject = /(^|[^가-힣])((?:친구|어머니|아버지|선생님|그 사람|동생|아이|학생|누나|형|언니|오빠|부모님|할머니|할아버지)(?:이|가|은|는|께서|\s+께서)?\s+(?:[^.!?]*\s+)?)([가-힣]+고\s+)싶(어요|습니다|다)(?=[^가-힣]|$)/g;
	str = str.replace(thirdPersonSubject, (m, pre, subj, verbGo, ending) => {
		const repEnding = ending === '어요' ? '어해요' : ending === '습니다' ? '어합니다' : '어한다';
		return `${pre}${subj}${verbGo}싶${repEnding}`;
	});

	const firstSecondSubject = /(^|[^가-힣])((?:나|내|저|제|우리|너|네|당신|자네)(?:는|은|이|가)?\s+(?:[^.!?]*\s+)?)([가-힣]+고\s+)싶어(해요|합니다|하다|한다)(?=[^가-힣]|$)/g;
	str = str.replace(firstSecondSubject, (m, pre, subj, verbGo, ending) => {
		const repEnding = ending === '해요' ? '어요' : ending === '합니다' ? '습니다' : '다';
		return `${pre}${subj}${verbGo}싶${repEnding}`;
	});

	return str;
}

// =========================================================================
// 4b. Adverbial Sub-Typing & Syntactic Placement (Feature 9)
// =========================================================================
function isDegreeAdverb(wordOrUnit) {
	if (!wordOrUnit) return false;
	const ko = typeof wordOrUnit === 'string' ? wordOrUnit : (Array.isArray(wordOrUnit) ? wordOrUnit[DATA_SCHEMA.Korean] : wordOrUnit.ko || wordOrUnit[DATA_SCHEMA.Korean]);
	return DEGREE_ADVERBS.has(ko);
}

function isMannerAdverb(wordOrUnit) {
	if (!wordOrUnit) return false;
	const ko = typeof wordOrUnit === 'string' ? wordOrUnit : (Array.isArray(wordOrUnit) ? wordOrUnit[DATA_SCHEMA.Korean] : wordOrUnit.ko || wordOrUnit[DATA_SCHEMA.Korean]);
	return MANNER_ADVERBS.has(ko);
}

function isDiscourseAdverb(wordOrUnit) {
	if (!wordOrUnit) return false;
	const ko = typeof wordOrUnit === 'string' ? wordOrUnit : (Array.isArray(wordOrUnit) ? wordOrUnit[DATA_SCHEMA.Korean] : wordOrUnit.ko || wordOrUnit[DATA_SCHEMA.Korean]);
	return DISCOURSE_ADVERBS.has(ko);
}

function isNegativePolarityAdverb(wordOrUnit) {
	if (!wordOrUnit) return false;
	const ko = typeof wordOrUnit === 'string' ? wordOrUnit : (Array.isArray(wordOrUnit) ? wordOrUnit[DATA_SCHEMA.Korean] : wordOrUnit.ko || wordOrUnit[DATA_SCHEMA.Korean]);
	return ALL_NPI_WORDS.has(ko);
}

function isNegativePredicate(text) {
	if (!text || typeof text !== 'string') return false;
	// 1. Short negation: 안 or 못 preceding a word
	if (/(^|[^가-힣])(?:안|못)\s+[가-힣]+(?=[^가-힣]|$)/.test(text)) return true;
	// 2. Long negation: -지 않-, -지 못-, -지 말-, -지 마-
	if (/(?:지\s+(?:않|못|말|마)[가-힣]*)/.test(text)) return true;
	// 3. Negative verbs: 모르다, 없다, 아니다
	if (/(?:몰라(?:요|서|도)?|모릅니다|몰랐(?:어요|습니다)|모른다|모르고|모르면)(?=[^가-힣]|$)/.test(text)) return true;
	if (/(?:없(?:어요|어서|어도|습니다|었다|었어요|었습니다|고|으면|는))(?=[^가-힣]|$)/.test(text)) return true;
	if (/(?:아니(?:에요|요|라|어서|면|었습니다|었어|다))|아닙니다(?=[^가-힣]|$)/.test(text)) return true;
	return false;
}

function canAdverbPrecede(adverbOrKo, verbOrKo, options = {}) {
	const advKo = typeof adverbOrKo === 'string' ? adverbOrKo : (Array.isArray(adverbOrKo) ? adverbOrKo[DATA_SCHEMA.Korean] : adverbOrKo.ko || adverbOrKo[DATA_SCHEMA.Korean]);
	const vKo = typeof verbOrKo === 'string' ? verbOrKo : (Array.isArray(verbOrKo) ? verbOrKo[DATA_SCHEMA.Korean] : verbOrKo.ko || verbOrKo[DATA_SCHEMA.Korean]);
	if (!advKo || !vKo) return true;

	const isDV = isDescriptiveVerb(verbOrKo);
	const isPureDV = isDV && !isActionVerb(verbOrKo);
	const isManner = MANNER_ADVERBS.has(advKo);
	const isDegree = DEGREE_ADVERBS.has(advKo);
	const isNPI = ALL_NPI_WORDS.has(advKo);

	// Manner adverbs cannot modify purely descriptive verbs
	if (isManner && !isDegree && isPureDV) {
		return false;
	}

	// Short inability 못 cannot modify purely descriptive verbs
	if (SHORT_INABILITY_WORDS.has(advKo) && isPureDV) {
		return false;
	}

	// NPIs strictly require negative predicate
	if (isNPI) {
		const isNeg = options.isNegative || options.negated || isNegativePredicate(vKo);
		if (!isNeg) return false;
	}

	return true;
}

function validateAdverbConcord(text, context = {}) {
	const errors = [];
	if (!text || typeof text !== 'string') {
		return { valid: true, errors: [] };
	}

	// 1. Negative Polarity Items (NPIs): 전혀, 별로, etc.
	// NPIs obligatorily require negative predicates
	for (const npi of ALL_NPI_WORDS) {
		const npiRegex = new RegExp(`(^|[^가-힣])${npi}(?=[^가-힣]|$)`, 'g');
		let match;
		while ((match = npiRegex.exec(text)) !== null) {
			const afterNpi = text.substring(match.index + match[0].length);
			if (!isNegativePredicate(afterNpi)) {
				errors.push(`Negative polarity adverb '${npi}' strictly requires a negative predicate in: "${text}"`);
			}
		}
	}

	// 2. Manner Adverbs paired with Descriptive Verbs
	// Manner adverbs (자세히, 열심히, 천천히, 빨리, 혼자, 함께, 잘, 못, etc.) strictly modify Action Verbs
	for (const [mannerKo, info] of MANNER_ADVERBS.entries()) {
		if (info.target_pos !== "Action Verb") continue;
		const mannerRegex = new RegExp(`(^|[^가-힣])${mannerKo}\\s+([가-힣]+)(?:\\[[^\\]]+\\])?(?=[^가-힣]|$)`, 'g');
		let match;
		while ((match = mannerRegex.exec(text)) !== null) {
			const targetWord = match[2];
			const dvUnit = DESCRIPTIVE_SURFACE_MAP.get(targetWord);
			if (dvUnit) {
				const dvKo = dvUnit[DATA_SCHEMA.Korean];
				if (isActionVerb(dvKo)) continue;
				errors.push(`Manner adverb '${mannerKo}' cannot modify descriptive verb '${dvKo}' in: "${text}"`);
			}
		}
	}

	return {
		valid: errors.length === 0,
		errors: Array.from(new Set(errors))
	};
}

function applyAdverbConcord(input, options = {}) {
	if (typeof input === 'object' && input !== null) {
		let text = input.text || "";
		if (text) {
			text = applyAdverbConcord(text, options);
		}
		return { ...input, text };
	}

	let str = String(input);

	// 1. Repair Manner Adverb with Descriptive Verb
	for (const [mannerKo, info] of MANNER_ADVERBS.entries()) {
		if (info.target_pos !== "Action Verb") continue;
		const mannerRegex = new RegExp(`(^|[^가-힣])${mannerKo}\\s+([가-힣]+)(?:\\[[^\\]]+\\])?(?=[^가-힣]|$)`, 'g');
		str = str.replace(mannerRegex, (m, p1, targetWord) => {
			const dvUnit = DESCRIPTIVE_SURFACE_MAP.get(targetWord);
			if (dvUnit) {
				const dvKo = dvUnit[DATA_SCHEMA.Korean];
				if (isActionVerb(dvKo)) return m;
				const repAdverb = options.degree_adverb || "아주";
				return `${p1}${repAdverb} ${targetWord}`;
			}
			return m;
		});
	}

	// 2. Repair NPI without negative predicate
	for (const npi of ALL_NPI_WORDS) {
		const npiRegex = new RegExp(`(^|[^가-힣])${npi}\\s+([가-힣]+)(?=[^가-힣]|$)`, 'g');
		str = str.replace(npiRegex, (m, p1, targetWord) => {
			if (isNegativePredicate(targetWord)) return m;

			if (options.prefer_affirmative || options.repair_mode === "replace_adverb") {
				const repAdverb = options.affirmative_adverb || "아주";
				return `${p1}${repAdverb} ${targetWord}`;
			}

			// Negate the predicate
			if (targetWord.startsWith("알았")) {
				return `${p1}${npi} ${targetWord.replace(/^알았/, "몰랐")}`;
			}
			if (targetWord.startsWith("알아")) {
				return `${p1}${npi} ${targetWord.replace(/^알아/, "몰라")}`;
			}
			if (targetWord.startsWith("압니")) {
				return `${p1}${npi} ${targetWord.replace(/^압니/, "모릅니")}`;
			}
			if (targetWord.startsWith("알다")) {
				return `${p1}${npi} ${targetWord.replace(/^알다/, "모르다")}`;
			}
			if (targetWord.startsWith("알고")) {
				return `${p1}${npi} ${targetWord.replace(/^알고/, "모르고")}`;
			}
			if (targetWord.startsWith("알면")) {
				return `${p1}${npi} ${targetWord.replace(/^알면/, "모르면")}`;
			}

			if (targetWord.startsWith("있었")) {
				return `${p1}${npi} ${targetWord.replace(/^있었/, "없었")}`;
			}
			if (targetWord.startsWith("있어")) {
				return `${p1}${npi} ${targetWord.replace(/^있어/, "없어")}`;
			}
			if (targetWord.startsWith("있습니")) {
				return `${p1}${npi} ${targetWord.replace(/^있습니/, "없습니")}`;
			}
			if (targetWord.startsWith("있다")) {
				return `${p1}${npi} ${targetWord.replace(/^있다/, "없다")}`;
			}
			if (targetWord.startsWith("있고")) {
				return `${p1}${npi} ${targetWord.replace(/^있고/, "없고")}`;
			}
			if (targetWord.startsWith("있으면")) {
				return `${p1}${npi} ${targetWord.replace(/^있으면/, "없으면")}`;
			}
			return `${p1}${npi} 안 ${targetWord}`;
		});
	}

	return str;
}

// =========================================================================
// 4c. Clausal Connectives & Causal Harmony (Feature 11)
// =========================================================================

/**
 * Looks up connective specifications from CLAUSAL_CONNECTIVES map or canonical normalizations.
 *
 * @param {string|number|Array} connective - Connective string, unit ID, or language unit.
 * @returns {Object|null} Connective specification with clausal constraints.
 */
function getConnectiveSpecs(connective) {
	if (!connective) return null;
	if (typeof connective === 'number' || (!isNaN(connective) && typeof connective === 'string' && CLAUSAL_CONNECTIVES.has(String(connective)))) {
		return CLAUSAL_CONNECTIVES.get(String(connective)) || null;
	}
	if (typeof connective === 'object' && Array.isArray(connective)) {
		const id = connective[DATA_SCHEMA.Id];
		if (CLAUSAL_CONNECTIVES.has(String(id))) return CLAUSAL_CONNECTIVES.get(String(id));
		const ko = connective[DATA_SCHEMA.Korean];
		return CLAUSAL_CONNECTIVES.get(ko) || null;
	}
	const str = String(connective).trim();
	const clean = str.replace(/^[-~]/, "");
	return CLAUSAL_CONNECTIVES.get(str) ||
		CLAUSAL_CONNECTIVES.get(clean) ||
		CLAUSAL_CONNECTIVES.get(`-${clean}`) ||
		CLAUSAL_CONNECTIVES.get(`~${clean}`) ||
		null;
}

function isClausalConnective(wordOrUnit) {
	return getConnectiveSpecs(wordOrUnit) !== null;
}

const MOOD_SUFFIX_ENTRIES = [
	// Suggestive interrogatives: -(으)ㄹ까요, -(으)ㄹ래요 (requires ㄹ coda)
	{ suffix: "까요", mood: "suggestive", requiresRieul: true },
	{ suffix: "래요", mood: "suggestive", requiresRieul: true },

	// Imperatives (formal, polite, prohibitive, plain)
	{ suffix: "마십시오", mood: "imperative" },
	{ suffix: "하십시오", mood: "imperative" },
	{ suffix: "마세요", mood: "imperative" },
	{ suffix: "마라", mood: "imperative" },
	{ suffix: "십시오", mood: "imperative" },
	{ suffix: "세요", mood: "imperative" },
	{ suffix: "아라", mood: "imperative" },
	{ suffix: "어라", mood: "imperative" },
	{ suffix: "여라", mood: "imperative" },
	{ suffix: "해라", mood: "imperative" },
	{ suffix: "가라", mood: "imperative" },
	{ suffix: "와라", mood: "imperative" },
	{ suffix: "봐라", mood: "imperative" },
	{ suffix: "자라", mood: "imperative" },

	// Propositives
	{ suffix: "읍시다", mood: "propositive" },
	{ suffix: "시다", mood: "propositive", requiresBieup: true },
	{ suffix: "자", mood: "propositive", excludeWords: ["남자", "여자", "모자", "의자", "탁자", "상자"] },

	// Interrogatives
	{ suffix: "는가", mood: "interrogative" },
	{ suffix: "나요", mood: "interrogative" },
	{ suffix: "가요", mood: "interrogative" },
	{ suffix: "니", mood: "interrogative" },
	{ suffix: "냐", mood: "interrogative" }
];

/**
 * Detects the illocutionary mood of a Korean clause or sentence:
 * - 'imperative' (-(으)세요, -(으)십시오, -지 마세요, -아/어라)
 * - 'propositive' (-(으)ㅂ시다, -자)
 * - 'suggestive' (-(으)ㄹ까요?, -(으)ㄹ래요?)
 * - 'interrogative' (questions ending in ?, -니?, -냐?, -나요?, etc.)
 * - 'declarative' (statements)
 */
function detectClauseMood(clause) {
	if (!clause || typeof clause !== 'string') return "declarative";
	const clean = clause.trim().replace(/[.!?,;~]+$/, "").trim();
	const hasQuestionMark = clause.includes("?");

	for (const entry of MOOD_SUFFIX_ENTRIES) {
		if (clean.endsWith(entry.suffix)) {
			if (entry.excludeWords && entry.excludeWords.some(w => clean.endsWith(w))) {
				continue;
			}
			if (entry.requiresRieul) {
				const prevChar = clean.slice(-entry.suffix.length - 1, -entry.suffix.length);
				if (!prevChar) continue;
				const d = decomposeHangul(prevChar);
				if (!d || d.final !== 8) continue;
			}
			if (entry.requiresBieup) {
				const prevChar = clean.slice(-entry.suffix.length - 1, -entry.suffix.length);
				if (!prevChar) continue;
				const d = decomposeHangul(prevChar);
				if (!d || (d.final !== 17 && prevChar !== "읍")) continue;
			}
			return entry.mood;
		}
	}

	if (hasQuestionMark) {
		return "interrogative";
	}

	return "declarative";
}

/**
 * Detects whether a clause contains past tense inflection (-았/었/였/했-).
 * Gracefully ignores present-tense root syllables with coda 20 like 있- (unless followed by 었-).
 */
function detectClauseTense(clause) {
	if (!clause || typeof clause !== 'string') return "present";
	const clean = clause.trim();

	for (let i = 0; i < clean.length; i++) {
		const ch = clean[i];
		const d = decomposeHangul(ch);
		if (d && d.final === 20) { // Coda 20 = ㅆ
			if (ch === '겠') continue; // Modal/future
			if (ch === '있') {
				const nextCh = clean[i + 1];
				if (nextCh) {
					const nextD = decomposeHangul(nextCh);
					if (nextD && nextD.final === 20) return "past";
				}
				continue;
			}
			return "past";
		}
	}

	return "present";
}

/**
 * Checks whether a word surface form is a conjugated motion verb predicate (가다, 오다, 다니다, etc.).
 */
function isMotionPredicate(word) {
	if (!word) return false;
	const vUnit = getVerbUnit(word) || getVerbUnit(word + "다");
	if (vUnit && (hasTag(vUnit, "motion_concord") || MOTION_VERBS.has(vUnit[DATA_SCHEMA.Korean]))) {
		return true;
	}
	const motionPatterns = [
		/^(?:.*?(?:돌아|올라|내려|들어|나))?(?:가|갔|갑|갈)/,
		/^(?:.*?(?:돌아|올라|내려|들어|나))?(?:오|와|왔|옵|올)/,
		/^다니|^다녀|^다녔|^다닙|^다닐/
	];
	return motionPatterns.some(p => p.test(word));
}

/**
 * Parses a compound Korean sentence into Clause 1, Connective, and Clause 2.
 */
function parseSentenceToClauses(sentence) {
	if (!sentence || typeof sentence !== 'string') return null;
	const s = sentence.trim();

	// 1. Multi-word connectives from data.js metadata
	for (const m of MULTI_WORD_CONNECTIVE_RULES) {
		const match = s.match(m.pattern);
		if (match) {
			return {
				clause1: match[1].trim(),
				connective: m.connective,
				clause2: match[2].trim(),
				connectiveWord: m.cWord
			};
		}
	}

	// 2. Single-word connective suffixes attached to Clause 1 final word
	const words = s.split(/\s+/);
	for (let i = 0; i < words.length - 1; i++) {
		const w = words[i];
		const c1Prefix = words.slice(0, i).join(" ");
		const c2 = words.slice(i + 1).join(" ");

		for (const rule of DYNAMIC_SUFFIX_RULES) {
			if (w.endsWith(rule.suffix)) {
				if (rule.isSeoRule) {
					const prevChar = w.slice(-2, -1);
					if (!prevChar) continue;
					const d = decomposeHangul(prevChar);
					if (!d || (d.final !== 0 && d.final !== 20)) continue;
				}
				const stem = w.slice(0, -(rule.strip || rule.suffix).length);
				return {
					clause1: (c1Prefix ? c1Prefix + " " : "") + stem,
					connective: rule.connective,
					clause2: c2,
					connectiveWord: w
				};
			}
		}
	}

	return null;
}

/**
 * Validates whether Clause 1 and Clause 2 can be grammatically joined by the given connective.
 */
function canConnectiveJoin(clause1, connectiveTextOrId, clause2, options = {}) {
	const specs = getConnectiveSpecs(connectiveTextOrId);
	if (!specs) {
		return { valid: true, connective: connectiveTextOrId, errors: [], errorCodes: [] };
	}

	const errors = [];
	const errorCodes = [];
	const c1Str = typeof clause1 === 'string' ? clause1.trim() : "";
	const c2Str = typeof clause2 === 'string' ? clause2.trim() : "";
	const connName = specs.ko || connectiveTextOrId;

	// 1. Clause 1 Tense Restriction
	if (specs.clause1_tense_allowed === false) {
		const t1 = detectClauseTense(c1Str);
		if (t1 === "past") {
			errors.push(`Connective '${connName}' does not permit past tense (-았/었/였-) in Clause 1: "${c1Str}"`);
			errorCodes.push("ERR_CLAUSE1_PAST_TENSE");
		}
	}

	// 2. Clause 2 Mood Restriction
	const allowedMoods = new Set(specs.clause2_moods_allowed || ["declarative", "interrogative", "imperative", "propositive", "suggestive"]);
	const c2Mood = detectClauseMood(c2Str);
	if (!allowedMoods.has(c2Mood)) {
		if (c2Mood === "imperative") {
			errors.push(`Connective '${connName}' cannot be followed by an imperative clause: "${c2Str}"`);
			errorCodes.push("ERR_CLAUSE2_IMPERATIVE_MOOD");
		} else if (c2Mood === "propositive") {
			errors.push(`Connective '${connName}' cannot be followed by a propositive clause: "${c2Str}"`);
			errorCodes.push("ERR_CLAUSE2_PROPOSITIVE_MOOD");
		} else if (c2Mood === "suggestive") {
			errors.push(`Connective '${connName}' cannot be followed by a suggestive clause: "${c2Str}"`);
			errorCodes.push("ERR_CLAUSE2_SUGGESTIVE_MOOD");
		} else {
			errors.push(`Connective '${connName}' cannot take mood '${c2Mood}' in Clause 2: "${c2Str}"`);
			errorCodes.push("ERR_CLAUSE2_INVALID_MOOD");
		}
	}

	// 3. Clause 1 Part of Speech Restriction
	if (specs.clause1_pos && Array.isArray(specs.clause1_pos)) {
		const allowedPos = new Set(specs.clause1_pos);
		const c1Words = c1Str.split(/\s+/);
		const lastC1Word = c1Words[c1Words.length - 1].replace(/[.!?,;~]+$/, "");
		if (lastC1Word) {
			const isDV = DESCRIPTIVE_SURFACE_MAP.has(lastC1Word) ||
				isDescriptiveVerb(lastC1Word.endsWith("다") ? lastC1Word : lastC1Word + "다");
			const isAV = isActionVerb(lastC1Word.endsWith("다") ? lastC1Word : lastC1Word + "다") ||
				(!isDV && lastC1Word.endsWith("하")); // e.g. 일하, 공부하

			if (isDV && !allowedPos.has("Descriptive Verb")) {
				errors.push(`Connective '${connName}' requires an Action Verb in Clause 1, but found descriptive verb: "${lastC1Word}"`);
				errorCodes.push("ERR_CLAUSE1_INVALID_POS");
			} else if (isAV && !allowedPos.has("Action Verb")) {
				errors.push(`Connective '${connName}' requires a Descriptive Verb in Clause 1, but found action verb: "${lastC1Word}"`);
				errorCodes.push("ERR_CLAUSE1_INVALID_POS");
			}
		}
	}

	// 4. Motion Verb Requirement for Purpose Connectives (e.g. -(으)러)
	if (specs.motion_verb_required) {
		const c2Words = c2Str.split(/\s+/);
		const lastC2Word = c2Words[c2Words.length - 1].replace(/[.!?,;~]+$/, "");
		if (lastC2Word && !isMotionPredicate(lastC2Word)) {
			errors.push(`Connective '${connName}' strictly requires a motion verb (가다, 오다, 다니다, etc.) in Clause 2, but found: "${lastC2Word}"`);
			errorCodes.push("ERR_NON_MOTION_VERB");
		}
	}

	// 5. Outcome Polarity Requirement (-느라고, -는 바람에)
	if (specs.outcome_polarity === -1) {
		if (options.outcomePolarity === 1) {
			errors.push(`Connective '${connName}' requires a negative consequence or burden, but outcome is positive`);
			errorCodes.push("ERR_OUTCOME_POLARITY");
		} else {
			const positiveDistractorKeywords = ["합격했", "성공했", "칭찬", "상을 받", "이겼", "기뻤"];
			if (positiveDistractorKeywords.some(kw => c2Str.includes(kw))) {
				errors.push(`Connective '${connName}' requires a negative consequence or burden, but found positive outcome: "${c2Str}"`);
				errorCodes.push("ERR_OUTCOME_POLARITY");
			}
		}
	}

	// 6. Same Subject Requirement
	if (specs.same_subject && options.subject1 && options.subject2 && options.subject1 !== options.subject2) {
		errors.push(`Connective '${connName}' requires identical subjects in Clause 1 and Clause 2, but found '${options.subject1}' vs '${options.subject2}'`);
		errorCodes.push("ERR_DIFFERENT_SUBJECT");
	}

	return {
		valid: errors.length === 0,
		connective: connName,
		errors,
		errorCodes,
		clause1: c1Str,
		clause2: c2Str
	};
}

/**
 * Validates clausal concord across a full Korean compound sentence or clause configuration.
 */
function validateClausalConcord(sentenceOrClauses, options = {}) {
	if (!sentenceOrClauses) {
		return { valid: true, errors: [], errorCodes: [], connective: null };
	}

	if (typeof sentenceOrClauses === 'object' && sentenceOrClauses.connective) {
		return canConnectiveJoin(
			sentenceOrClauses.clause1,
			sentenceOrClauses.connective,
			sentenceOrClauses.clause2,
			options
		);
	}

	if (typeof sentenceOrClauses === 'string') {
		const parsed = parseSentenceToClauses(sentenceOrClauses);
		if (!parsed) {
			return { valid: true, errors: [], errorCodes: [], connective: null };
		}
		const res = canConnectiveJoin(parsed.clause1, parsed.connective, parsed.clause2, options);
		res.originalSentence = sentenceOrClauses;
		res.connectiveWord = parsed.connectiveWord;
		return res;
	}

	return { valid: true, errors: [], errorCodes: [], connective: null };
}

/**
 * Generates an explicitly ungrammatical distractor sentence for clausal connective quiz questions.
 *
 * Distractor Types:
 * - 'tense_in_clause1': forces past tense into Clause 1 with a connective that forbids past tense (*비가 왔어서)
 * - 'imperative_in_clause2': forces an imperative ending into Clause 2 after -아/어서 or -기 때문에 (*비가 와서 우산을 쓰세요)
 * - 'propositive_in_clause2': forces a propositive ending into Clause 2 after -아/어서 (*날씨가 좋아서 공원에 갑시다)
 * - 'adjective_in_clause1': uses a descriptive verb with -느라고 (*방이 작느라고 짐을 못 넣었어요)
 * - 'positive_outcome': uses -느라고 with a positive success outcome (*열심히 공부하느라고 시험에 합격했어요)
 * - 'non_motion_verb': uses -(으)러 with a non-motion verb (*책을 읽으러 커피를 마셔요)
 */
function generateClausalDistractor(arg1, arg2, arg3, arg4) {
	let clause1, connective, clause2, distractorType;
	if (arguments.length <= 2) {
		const parsed = parseSentenceToClauses(arg1);
		if (!parsed) return arg1;
		clause1 = parsed.clause1;
		connective = parsed.connective;
		clause2 = parsed.clause2;
		distractorType = arg2;
	} else {
		clause1 = arg1;
		connective = arg2;
		clause2 = arg3;
		distractorType = arg4;
	}

	const c1 = String(clause1 || "").trim();
	const conn = String(connective || "").trim();
	const c2 = String(clause2 || "").trim();

	switch (distractorType) {
		case "tense_in_clause1":
		case "clause1_past_tense": {
			const c1Words = c1.split(/\s+/);
			const lastWord = c1Words[c1Words.length - 1];
			const c1Prefix = c1Words.slice(0, -1).join(" ");

			// Determine past tense stem for the last word using Korean morphology
			let pastStem = "";
			const lastChar = lastWord.slice(-1);
			const d = decomposeHangul(lastChar);
			if (d) {
				if (d.final === 0) {
					pastStem = lastWord.slice(0, -1) + composeHangul(d.initial, d.medial, 20);
				} else {
					const takesA = (d.medial === 0 || d.medial === 8);
					pastStem = lastWord + (takesA ? "았" : "었");
				}
			} else {
				pastStem = lastWord + "었";
			}
			const pastC1 = (c1Prefix ? c1Prefix + " " : "") + pastStem;

			if (conn.includes("러")) {
				return `${pastC1}으러 ${c2}`;
			} else if (conn.includes("느라고")) {
				return `${pastC1}느라고 ${c2}`;
			}
			return `${pastC1}어서 ${c2}`;
		}

		case "imperative_in_clause2": {
			let impC2 = c2;
			if (detectClauseMood(impC2) !== "imperative") {
				const c2Words = c2.split(/\s+/);
				const lastWord = c2Words[c2Words.length - 1].replace(/[.!?,;~]+$/, "");
				const c2Prefix = c2Words.slice(0, -1).join(" ");
				const verbCandidate = getVerbUnit(lastWord) || getVerbUnit(lastWord + "다") || getVerbUnit(getStem(lastWord) + "다");
				if (verbCandidate && canTakeMood(verbCandidate, "imperative")) {
					impC2 = (c2Prefix ? c2Prefix + " " : "") + buildMoodPredicate(verbCandidate, "imperative", "polite");
				} else {
					impC2 = (c2Prefix ? c2Prefix + " " : "") + "하세요";
				}
			}

			const targetConn = conn.includes("기 때문에") ? "기 때문에" : "아서/어서";
			if (targetConn === "기 때문에") {
				return `${c1}기 때문에 ${impC2}`;
			}

			// Conjugate Clause 1 with -아/어서 using morphology engine
			const c1Words = c1.split(/\s+/);
			const lastC1 = c1Words[c1Words.length - 1];
			const c1Prefix = c1Words.slice(0, -1).join(" ");
			const c1Verb = getVerbUnit(lastC1) || getVerbUnit(lastC1 + "다") || getVerbUnit(getStem(lastC1) + "다");
			const conjC1Word = c1Verb
				? conjugatePredicate(c1Verb, "polite", "present").replace(/요$/, "서")
				: applyMorphology(lastC1 + "아/어서");
			const conjC1 = (c1Prefix ? c1Prefix + " " : "") + conjC1Word;

			return `${conjC1} ${impC2}`;
		}

		case "propositive_in_clause2": {
			let propC2 = c2;
			if (detectClauseMood(propC2) !== "propositive") {
				const c2Words = c2.split(/\s+/);
				const lastWord = c2Words[c2Words.length - 1].replace(/[.!?,;~]+$/, "");
				const c2Prefix = c2Words.slice(0, -1).join(" ");
				const verbCandidate = getVerbUnit(lastWord) || getVerbUnit(lastWord + "다") || getVerbUnit(getStem(lastWord) + "다");
				if (verbCandidate && canTakeMood(verbCandidate, "propositive")) {
					propC2 = (c2Prefix ? c2Prefix + " " : "") + buildMoodPredicate(verbCandidate, "propositive", "formal");
				} else {
					propC2 = (c2Prefix ? c2Prefix + " " : "") + "갑시다";
				}
			}

			const c1Words = c1.split(/\s+/);
			const lastC1 = c1Words[c1Words.length - 1];
			const c1Prefix = c1Words.slice(0, -1).join(" ");
			const c1Verb = getVerbUnit(lastC1) || getVerbUnit(lastC1 + "다") || getVerbUnit(getStem(lastC1) + "다");
			const conjC1Word = c1Verb
				? conjugatePredicate(c1Verb, "polite", "present").replace(/요$/, "서")
				: applyMorphology(lastC1 + "아/어서");
			const conjC1 = (c1Prefix ? c1Prefix + " " : "") + conjC1Word;

			return `${conjC1} ${propC2}`;
		}

		case "adjective_in_clause1":
		case "clause1_invalid_pos": {
			const adjStem = c1.includes("작") ? c1 : "방이 작";
			return `${adjStem}느라고 ${c2 || "짐을 못 넣었어요"}`;
		}

		case "positive_outcome": {
			const c1Action = c1.includes("느라고") ? c1 : `${c1.replace(/다$/, "")}느라고`;
			return `${c1Action} 시험에 합격했어요`;
		}

		case "non_motion_verb": {
			const purposeC1 = c1.includes("러") ? c1 : `${c1}러`;
			return `${purposeC1} 커피를 마셔요`;
		}

		default:
			return `${c1} ${conn} ${c2}`;
	}
}

/**
 * Repairs ungrammatical clausal connective patterns to grammatical Korean.
 */
function applyClausalConcord(input, options = {}) {
	if (typeof input === 'object' && input !== null) {
		let text = input.text || "";
		if (text) {
			text = applyClausalConcord(text, options);
		}
		return { ...input, text };
	}

	let str = String(input);

	// 1. Repair forbidden past tense before -아/어서 (*왔어서 -> 와서, *먹었어서 -> 먹어서, *했어서 -> 해서)
	str = str.replace(/(?:^|\s)([가-힣]*?)([가-힣])어서(?=\s+|$)/g, (match, prefix, pastSyl) => {
		const d = decomposeHangul(pastSyl);
		if (!d || d.final !== 20) return match;
		const leadSpace = match.startsWith(' ') ? ' ' : '';

		if (pastSyl === '왔') return leadSpace + (prefix ? prefix + '와서' : '와서');
		if (pastSyl === '갔') return leadSpace + (prefix ? prefix + '가서' : '가서');
		if (pastSyl === '봤') return leadSpace + (prefix ? prefix + '봐서' : '봐서');
		if (pastSyl === '줬') return leadSpace + (prefix ? prefix + '줘서' : '줘서');
		if (pastSyl === '됐') return leadSpace + (prefix ? prefix + '돼서' : '돼서');
		if (pastSyl === '했') return leadSpace + (prefix ? prefix + '해서' : '해서');

		if (pastSyl === '었' || pastSyl === '았') {
			const stemChar = prefix.slice(-1);
			const stemD = decomposeHangul(stemChar);
			if (stemD) {
				const takesA = (stemD.medial === 0 || stemD.medial === 8);
				return leadSpace + prefix + (takesA ? '아서' : '어서');
			}
			return leadSpace + prefix + '어서';
		}

		const noCoda = composeHangul(d.initial, d.medial, 0);
		return leadSpace + prefix + noCoda + '어서';
	});

	// 2. Repair -아/어서 or -기 때문에 with Imperative/Propositive in Clause 2 (*비가 와서 우산을 쓰세요 -> 비가 오니까 우산을 쓰세요)
	const parsed = parseSentenceToClauses(str);
	if (parsed && (parsed.connective === "-아/어서" || parsed.connective === "-기 때문에" || parsed.connective.includes("아/어서") || parsed.connective.includes("기 때문에"))) {
		const mood = detectClauseMood(parsed.clause2);
		if (mood === "imperative" || mood === "propositive" || mood === "suggestive") {
			const c1 = parsed.clause1;
			let c1WithNikka = "";
			if (c1.endsWith("와") || c1.endsWith("오")) c1WithNikka = c1.replace(/와$|오$/, "오니까");
			else if (c1.endsWith("가")) c1WithNikka = c1 + "니까";
			else if (c1.endsWith("좋아") || c1.endsWith("좋")) c1WithNikka = c1.replace(/좋아$|좋$/, "좋으니까");
			else if (c1.endsWith("하") || c1.endsWith("해")) c1WithNikka = c1.replace(/하$|해$/, "하니까");
			else {
				const lastChar = c1.slice(-1);
				c1WithNikka = hasBatchim(lastChar) ? c1 + "으니까" : c1 + "니까";
			}
			return `${c1WithNikka} ${parsed.clause2}`;
		}
	}

	return str;
}

const CLAUSAL_QUIZ_BANKS = {
	cause_imperative: [
		{
			clause1Nikka: "비가 오니까",
			clause1Eoseo: "비가 와서",
			clause1PastEoseo: "비가 왔어서",
			clause1GiTtaemun: "비가 오기 때문에",
			clause2: "우산을 쓰세요.",
			explanation: "-(으)니까 allows imperative (-으세요) in Clause 2, whereas -아/어서 and -기 때문에 strictly forbid imperative and propositive endings. Additionally, -아/어서 does not allow past tense in Clause 1."
		},
		{
			clause1Nikka: "날씨가 추우니까",
			clause1Eoseo: "날씨가 추워서",
			clause1PastEoseo: "날씨가 추웠어서",
			clause1GiTtaemun: "날씨가 춥기 때문에",
			clause2: "따뜻한 옷을 입으세요.",
			explanation: "-(으)니까 allows imperative (-으세요) in Clause 2, whereas -아/어서 and -기 때문에 strictly forbid imperative endings."
		},
		{
			clause1Nikka: "시간이 없으니까",
			clause1Eoseo: "시간이 없어서",
			clause1PastEoseo: "시간이 없었어서",
			clause1GiTtaemun: "시간이 없기 때문에",
			clause2: "빨리 가세요.",
			explanation: "-(으)니까 allows imperative commands in Clause 2, while -아/어서 and -기 때문에 forbid imperative endings."
		},
		{
			clause1Nikka: "길이 막히니까",
			clause1Eoseo: "길이 막혀서",
			clause1PastEoseo: "길이 막혔어서",
			clause1GiTtaemun: "길이 막히기 때문에",
			clause2: "지하철을 타세요.",
			explanation: "-(으)니까 is used for reasons leading to commands or suggestions."
		}
	],
	cause_propositive: [
		{
			clause1Nikka: "날씨가 좋으니까",
			clause1Eoseo: "날씨가 좋아서",
			clause1PastEoseo: "날씨가 좋았어서",
			clause1GiTtaemun: "날씨가 좋기 때문에",
			clause2: "공원에 갑시다.",
			explanation: "Propositive proposals (-(으)ㅂ시다, -자) require -(으)니까 and cannot follow -아/어서 or -기 때문에."
		},
		{
			clause1Nikka: "배가 고프니까",
			clause1Eoseo: "배가 고파서",
			clause1PastEoseo: "배가 고팠어서",
			clause1GiTtaemun: "배가 고프기 때문에",
			clause2: "식당에 갑시다.",
			explanation: "Propositive proposals (-(으)ㅂ시다) require -(으)니까 and forbid -아/어서."
		},
		{
			clause1Nikka: "시험이 끝나니까",
			clause1Eoseo: "시험이 끝나서",
			clause1PastEoseo: "시험이 끝났어서",
			clause1GiTtaemun: "시험이 끝나기 때문에",
			clause2: "영화를 봅시다.",
			explanation: "Proposals for joint action require -(으)니까 and cannot take -아/어서."
		}
	],
	reason_negative: [
		{
			correctC1: "공부하느라고",
			pastC1: "공부했느라고",
			adjC1: "방이 작느라고",
			negOutcome: "잠을 못 잤어요.",
			adjOutcome: "짐을 못 넣었어요.",
			posOutcome: "시험에 합격했어요.",
			explanation: "-느라고 strictly forbids past tense in Clause 1, requires an Action Verb (not a Descriptive Verb like 작다), and necessitates an unfortunate negative outcome or burden (not a success like 시험에 합격했어요)."
		},
		{
			correctC1: "일하느라고",
			pastC1: "일했느라고",
			adjC1: "옷이 비싸느라고",
			negOutcome: "점심을 못 먹었어요.",
			adjOutcome: "사지 못했어요.",
			posOutcome: "칭찬을 받았어요.",
			explanation: "-느라고 requires an action verb in the present tense and connects to a negative outcome or burden."
		},
		{
			correctC1: "준비하느라고",
			pastC1: "준비했느라고",
			adjC1: "날씨가 춥느라고",
			negOutcome: "지각했어요.",
			adjOutcome: "나가지 못했어요.",
			posOutcome: "상을 받았어요.",
			explanation: "-느라고 cannot take past tense, adjectives, or positive outcomes."
		}
	],
	purpose_motion: [
		{
			actionC1: "책을 읽으러",
			actionPastC1: "책을 읽었으러",
			motionC2: "도서관에 가요.",
			nonMotionC2a: "커피를 마셔요.",
			nonMotionC2b: "집에 있어요.",
			explanation: "-(으)러 strictly requires a motion verb (가다, 오다, 다니다) in Clause 2, and forbids past tense in Clause 1."
		},
		{
			actionC1: "친구를 만나러",
			actionPastC1: "친구를 만났으러",
			motionC2: "카페에 왔어요.",
			nonMotionC2a: "책을 읽어요.",
			nonMotionC2b: "방에 있어요.",
			explanation: "-(으)러 requires a motion verb in Clause 2 (가다, 오다, etc.) and non-past Clause 1."
		},
		{
			actionC1: "운동을 하러",
			actionPastC1: "운동을 했으러",
			motionC2: "체육관에 가요.",
			nonMotionC2a: "음악을 들어요.",
			nonMotionC2b: "텔레비전을 봐요.",
			explanation: "-(으)러 expresses purpose of motion and requires a directional motion verb in Clause 2."
		}
	]
};

/**
 * Generates a complete clausal connective quiz question with 1 correct sentence and 3 targeted distractors.
 * Dynamically selects questions and distractors across curriculum clause banks.
 */
function generateClausalQuizItem(options = {}) {
	const topics = ["cause_imperative", "cause_propositive", "reason_negative", "purpose_motion"];
	const topic = options.topic || (typeof getRandom === 'function' ? getRandom(topics) : topics[Math.floor(Math.random() * topics.length)]);
	const bank = CLAUSAL_QUIZ_BANKS[topic] || CLAUSAL_QUIZ_BANKS.cause_imperative;
	const entry = (options.index !== undefined && bank[options.index])
		? bank[options.index]
		: (typeof getRandom === 'function' ? getRandom(bank) : bank[Math.floor(Math.random() * bank.length)]);

	let item = {};
	if (topic === "cause_imperative") {
		const correctSentence = `${entry.clause1Nikka} ${entry.clause2}`;
		item = {
			topic,
			prompt: "다음 중 올바른 연결 어미를 사용한 문장을 고르십시오.",
			translationPrompt: "Select the sentence with the correct clausal connective:",
			correctSentence,
			correctConnective: "-(으)니까",
			options: [
				{ text: correctSentence, correct: true },
				{ text: `${entry.clause1Eoseo} ${entry.clause2}`, correct: false, trap: "imperative_in_clause2", errorCode: "ERR_CLAUSE2_IMPERATIVE_MOOD" },
				{ text: `${entry.clause1PastEoseo} ${entry.clause2}`, correct: false, trap: "tense_in_clause1", errorCode: "ERR_CLAUSE1_PAST_TENSE" },
				{ text: `${entry.clause1GiTtaemun} ${entry.clause2}`, correct: false, trap: "imperative_in_clause2", errorCode: "ERR_CLAUSE2_IMPERATIVE_MOOD" }
			],
			explanation: entry.explanation,
			ruleSummary: "Causal Connective Concord: -(으)니까 vs -아/어서 / -기 때문에 (Imperative Restriction)"
		};
	} else if (topic === "cause_propositive") {
		const correctSentence = `${entry.clause1Nikka} ${entry.clause2}`;
		item = {
			topic,
			prompt: "다음 중 올바른 문장을 고르십시오.",
			translationPrompt: "Select the grammatically correct proposal sentence:",
			correctSentence,
			correctConnective: "-(으)니까",
			options: [
				{ text: correctSentence, correct: true },
				{ text: `${entry.clause1Eoseo} ${entry.clause2}`, correct: false, trap: "propositive_in_clause2", errorCode: "ERR_CLAUSE2_PROPOSITIVE_MOOD" },
				{ text: `${entry.clause1PastEoseo} ${entry.clause2}`, correct: false, trap: "tense_in_clause1", errorCode: "ERR_CLAUSE1_PAST_TENSE" },
				{ text: `${entry.clause1GiTtaemun} ${entry.clause2}`, correct: false, trap: "propositive_in_clause2", errorCode: "ERR_CLAUSE2_PROPOSITIVE_MOOD" }
			],
			explanation: entry.explanation,
			ruleSummary: "Causal Connective Concord: -(으)니까 vs -아/어서 (Propositive Restriction)"
		};
	} else if (topic === "reason_negative") {
		const correctSentence = `${entry.correctC1} ${entry.negOutcome}`;
		item = {
			topic,
			prompt: "다음 중 올바른 문장을 고르십시오.",
			translationPrompt: "Select the sentence that properly uses -느라고:",
			correctSentence,
			correctConnective: "-느라고",
			options: [
				{ text: correctSentence, correct: true },
				{ text: `${entry.pastC1} ${entry.negOutcome}`, correct: false, trap: "tense_in_clause1", errorCode: "ERR_CLAUSE1_PAST_TENSE" },
				{ text: `${entry.adjC1} ${entry.adjOutcome}`, correct: false, trap: "adjective_in_clause1", errorCode: "ERR_CLAUSE1_INVALID_POS" },
				{ text: `${entry.correctC1} ${entry.posOutcome}`, correct: false, trap: "positive_outcome", errorCode: "ERR_OUTCOME_POLARITY" }
			],
			explanation: entry.explanation,
			ruleSummary: "Causal Connective Concord: -느라고 Constraints (Action Verb + Present Tense + Negative Outcome)"
		};
	} else {
		const correctSentence = `${entry.actionC1} ${entry.motionC2}`;
		item = {
			topic,
			prompt: "다음 중 올바른 목적 연결 표현을 고르십시오.",
			translationPrompt: "Select the correct purpose sentence with -(으)러:",
			correctSentence,
			correctConnective: "-(으)러",
			options: [
				{ text: correctSentence, correct: true },
				{ text: `${entry.actionC1} ${entry.nonMotionC2a}`, correct: false, trap: "non_motion_verb", errorCode: "ERR_NON_MOTION_VERB" },
				{ text: `${entry.actionPastC1} ${entry.motionC2}`, correct: false, trap: "tense_in_clause1", errorCode: "ERR_CLAUSE1_PAST_TENSE" },
				{ text: `${entry.actionC1} ${entry.nonMotionC2b}`, correct: false, trap: "non_motion_verb", errorCode: "ERR_NON_MOTION_VERB" }
			],
			explanation: entry.explanation,
			ruleSummary: "Purpose Connective Concord: -(으)러 Requires Motion Verb & Non-Past Clause 1"
		};
	}

	if (options.shuffle && typeof shuffle === 'function') {
		item.options = shuffle(item.options);
	}

	return item;
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
	} else if (token.type === "Adv_Degree" || (token.type === "Adv" && token.tag === "degree")) {
		let words = Array.from(DEGREE_ADVERBS.values()).map(info => info.unit);
		if (token.tag && token.tag !== "degree") {
			words = words.filter(w => hasTag(w, token.tag));
		}
		if (token.affirmative || token.polarity === 1 || (!token.negated && !token.isNegative)) {
			words = words.filter(w => !ALL_NPI_WORDS.has(w[KoreanWord]));
		}
		options = words.map(w => new TokenOption(w[KoreanWord], [w]));
	} else if (token.type === "Adv_Manner" || (token.type === "Adv" && token.tag === "manner")) {
		let words = Array.from(MANNER_ADVERBS.values()).map(info => info.unit);
		if (token.tag && token.tag !== "manner") {
			words = words.filter(w => hasTag(w, token.tag));
		}
		if (token.target_pos === "Descriptive Verb" || token.isDV) {
			words = [];
		}
		options = words.map(w => new TokenOption(w[KoreanWord], [w]));
	} else if (token.type === "Adv_Discourse" || (token.type === "Adv" && (token.tag === "discourse" || token.tag === "conjunction"))) {
		let words = Array.from(DISCOURSE_ADVERBS.values()).map(info => info.unit);
		if (token.tag && token.tag !== "discourse" && token.tag !== "conjunction") {
			words = words.filter(w => hasTag(w, token.tag));
		}
		options = words.map(w => new TokenOption(w[KoreanWord], [w]));
	} else if (token.type === "Adv") {
		let words = getFilteredWords("Adverb", token.tag);
		if (token.target_pos === "Descriptive Verb" || token.isDV) {
			words = words.filter(w => {
				const ko = w[KoreanWord];
				if (SHORT_INABILITY_WORDS.has(ko)) return false;
				if (MANNER_ADVERBS.has(ko) && !DEGREE_ADVERBS.has(ko)) return false;
				return true;
			});
		}
		if (token.affirmative || token.polarity === 1 || (!token.negated && !token.isNegative)) {
			words = words.filter(w => !ALL_NPI_WORDS.has(w[KoreanWord]));
		}
		options = words.map(w => new TokenOption(w[KoreanWord], [w]));
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
	} else if (token.type === "Spatial_Phrase" || token.type === "Relational_Loc") {
		const positions = getSpatialPositions();
		let groundNouns = getFilteredWords("Noun", "place");
		if (groundNouns.length === 0) groundNouns = getFilteredWords("Noun", "furniture");
		if (groundNouns.length === 0) groundNouns = getFilteredWords("Noun", "object");
		groundNouns.slice(0, 5).forEach(gn => {
			const pos = positions[Math.floor(Math.random() * positions.length)];
			const posUnit = SPATIAL_POSITIONS.get(pos)?.unit;
			const phrase = `${gn[KoreanWord]} ${pos}에`;
			options.push(new TokenOption(phrase, posUnit ? [gn, posUnit] : [gn]));
		});
	} else if (token.type === "Deictic_NP") {
		const determiners = Array.from(DEICTIC_DETERMINERS.values());
		const nouns = getFilteredWords("Noun", "object").slice(0, 5);
		nouns.forEach(n => {
			const det = determiners[Math.floor(Math.random() * determiners.length)];
			const phrase = `${det.ko} ${n[KoreanWord]}`;
			options.push(new TokenOption(phrase, [det.unit, n]));
		});
	} else if (token.type === "Deictic_Loc") {
		const locs = Array.from(DEICTIC_LOCATIVES.values());
		options = locs.map(l => new TokenOption(l.ko, [l.unit]));
	} else if (token.type === "Deictic_Pronoun") {
		const pros = Array.from(DEICTIC_PRONOUNS.values());
		options = pros.map(p => new TokenOption(p.ko, [p.unit]));
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
	else if (tokenType === "Adv" || tokenType === "Adv_Time" || tokenType === "Adv_Degree" || tokenType === "Adv_Manner" || tokenType === "Adv_Discourse") posToFetch = "Adverb";
	else if (tokenType === "Exclamation") posToFetch = "Exclamation";

	let words = [];
	if (tokenType === "Adv_Degree") {
		words = Array.from(DEGREE_ADVERBS.values()).map(info => info.unit);
		if (tag) words = words.filter(w => hasTag(w, tag));
	} else if (tokenType === "Adv_Manner") {
		words = Array.from(MANNER_ADVERBS.values()).map(info => info.unit);
		if (tag) words = words.filter(w => hasTag(w, tag));
	} else if (tokenType === "Adv_Discourse") {
		words = Array.from(DISCOURSE_ADVERBS.values()).map(info => info.unit);
		if (tag) words = words.filter(w => hasTag(w, tag));
	} else {
		words = getFilteredWords(posToFetch, tag);
	}

	if (applyConstraint && currentContext.logic === "cause_effect" && currentContext.produced_state) {
		const domainWords = words.filter(w => parseSemanticVector(w).domain);
		if (domainWords.length > 0) words = domainWords;
	}

	if (currentContext.temporal_polarity && (tokenType === "Adv" || tokenType === "Adv_Time" || tokenType === "Time" || tag === "time" || tag === "temporal" || tag === "adverb_time" || tag === "temporalNoun")) {
		const tenseFiltered = filterWordsByTense(words, currentContext.temporal_polarity);
		if (tenseFiltered.length > 0) words = tenseFiltered;
	}

	if ((tokenType === "Adv" || tokenType === "Adv_Degree" || tag === "adverb") && (currentContext.isDV || currentContext.target_pos === "Descriptive Verb")) {
		words = words.filter(w => {
			const ko = w[DATA_SCHEMA.Korean];
			if (SHORT_INABILITY_WORDS.has(ko)) return false;
			if (MANNER_ADVERBS.has(ko) && !DEGREE_ADVERBS.has(ko)) return false;
			return true;
		});
	}

	const isNegContext = currentContext.isNegative || currentContext.negated || currentContext.mood === "inability";
	if (!isNegContext && (tokenType.startsWith("Adv") || tag === "adverb")) {
		words = words.filter(w => !ALL_NPI_WORDS.has(w[DATA_SCHEMA.Korean]));
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
	if (/DVst/.test(template)) {
		currentContext.isDV = true;
	}
	if (typeof grammarId === 'number') {
		if (IMPERATIVE_GRAMMAR_IDS.has(grammarId)) currentContext.mood = "imperative";
		else if (PROPOSITIVE_GRAMMAR_IDS.has(grammarId)) currentContext.mood = "propositive";
		else if (INABILITY_NEGATION_IDS.has(grammarId)) currentContext.mood = "inability";
		else if (VOLITIONAL_GRAMMAR_IDS.has(grammarId)) currentContext.mood = "volitional";

		if (INABILITY_NEGATION_IDS.has(grammarId) || GENERAL_NEGATION_IDS.has(grammarId)) {
			currentContext.isNegative = true;
		}
	}
	if (/(?:않|못|마세|마십|없|아니)/.test(template)) {
		currentContext.isNegative = true;
	}
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
		} else if (tokenType === "Spatial_Phrase" || tokenType === "Relational_Loc") {
			let groundNouns = getWords("Noun").filter(n => hasTag(n, "place") || hasTag(n, "furniture") || (hasTag(n, "object") && !hasTag(n, "measureWord") && !hasTag(n, "counter")));
			if (groundNouns.length === 0) groundNouns = getWords("Noun", "place");
			const sampledGround = groundNouns[Math.floor(Math.random() * groundNouns.length)];
			const positions = getSpatialPositions();
			const sampledPos = positions.length > 0 ? positions[Math.floor(Math.random() * positions.length)] : "위";
			const posUnit = SPATIAL_POSITIONS.get(sampledPos)?.unit;

			let particleType = "location";
			if (tag === "static" || /에$/.test(token)) particleType = "location_static";
			else if (tag === "dynamic" || /에서$/.test(token)) particleType = "location_dynamic";
			else if (tag === "direction" || /로$/.test(token)) particleType = "direction";

			replacementKo = buildSpatialPhrase(sampledGround, sampledPos, { particle: particleType });
			childNode = [
				sampledGround ? sampledGround[DATA_SCHEMA.Id] : 0,
				posUnit ? posUnit[DATA_SCHEMA.Id] : sampledPos
			];
		} else if (tokenType === "Deictic_NP") {
			const proximity = tag === "medial" ? "medial" : tag === "distal" ? "distal" : tag === "interrogative" ? "interrogative" : "proximal";
			let nouns = getWords("Noun").filter(n => !hasTag(n, "measureWord") && !hasTag(n, "counter") && !hasTag(n, "place"));
			const sampledNoun = nouns[Math.floor(Math.random() * nouns.length)];
			replacementKo = buildDeicticPhrase(proximity, "noun", { noun: sampledNoun });
			const detUnit = Array.from(DEICTIC_DETERMINERS.values()).find(d => d.proximity === proximity)?.unit;
			childNode = [
				detUnit ? detUnit[DATA_SCHEMA.Id] : 0,
				sampledNoun ? sampledNoun[DATA_SCHEMA.Id] : 0
			];
		} else if (tokenType === "Deictic_Loc") {
			const proximity = tag === "medial" ? "medial" : tag === "distal" ? "distal" : tag === "interrogative" ? "interrogative" : "proximal";
			replacementKo = buildDeicticPhrase(proximity, "place");
			const locUnit = Array.from(DEICTIC_LOCATIVES.values()).find(l => l.proximity === proximity && l.ko === replacementKo)?.unit;
			childNode = locUnit ? locUnit[DATA_SCHEMA.Id] : replacementKo;
		} else if (tokenType === "Deictic_Pronoun") {
			const proximity = tag === "medial" ? "medial" : tag === "distal" ? "distal" : tag === "interrogative" ? "interrogative" : "proximal";
			replacementKo = buildDeicticPhrase(proximity, "thing");
			const proUnit = Array.from(DEICTIC_PRONOUNS.values()).find(p => p.proximity === proximity && p.ko === replacementKo)?.unit;
			childNode = proUnit ? proUnit[DATA_SCHEMA.Id] : replacementKo;
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
	resolvedKo = resolvedKo.replace(/\[[^\]]+\]/g, '');

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

	// Resolve 으/ㅂ시다 and (으)ㅂ시다 based on batchim
	resolvedKo = resolvedKo.replace(/([가-힣])(?:으\/ㅂ시다|\(으\)ㅂ시다)/g, (_, ch) => {
		const d = decomposeHangul(ch);
		if (d && d.final !== 0) {
			return d.final === 8 ? setFinal(ch, 17) + "시다" : ch + "읍시다";
		}
		return setFinal(ch, 17) + "시다";
	});

	// Resolve 아/어/았/었 vowel harmony
	resolvedKo = resolvedKo.replace(/([가-힣])(아\/어|았\/었)(요|서|어|도|야|라|던|)/g, (_, ch, h, s) => {
		const hv = getVowelHarmony(ch);
		if (h === "았/었") {
			return ch + (hv === '여' ? '였' : hv === '아' ? '았' : '었') + s;
		}
		return ch + hv + s;
	});

	// Resolve 으 insertion and ㄹ-dropping before (세|시|셔|셨|십)
	resolvedKo = resolvedKo.replace(/([가-힣])으\/(니까|면|면서|러|려고|려면|세|시|셔|셨|십|로|라고)/g, (_, ch, s) => {
		const d = decomposeHangul(ch);
		if (d && d.final === 8 && (s === '세' || s === '시' || s === '셔' || s === '셨' || s === '십')) {
			return setFinal(ch, 0) + s;
		}
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
		if (d && d.final === 8) return setFinal(ch, 0) + s;
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
	resolvedKo = applySpatialConcord(resolvedKo);
	resolvedKo = applyMoodConcord(resolvedKo);
	resolvedKo = applyAdverbConcord(resolvedKo);
	resolvedKo = applyClausalConcord(resolvedKo);

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
	validateCounterConcord,
	SPATIAL_POSITIONS,
	DEICTIC_DETERMINERS,
	DEICTIC_PRONOUNS,
	DEICTIC_LOCATIVES,
	DEICTIC_DIRECTIONS,
	getSpatialPositions,
	getDeicticDemonstratives,
	buildSpatialPhrase,
	buildDeicticPhrase,
	isStaticExistenceVerb,
	validateSpatialConcord,
	applySpatialConcord,
	IMPERATIVE_GRAMMAR_IDS,
	PROPOSITIVE_GRAMMAR_IDS,
	INABILITY_NEGATION_IDS,
	GENERAL_NEGATION_IDS,
	VOLITIONAL_GRAMMAR_IDS,
	FORBIDDEN_NEGATIVE_ROOTS,
	NEGATION_SUPPLETIONS,
	AFFIRMATIVE_COUNTERPARTS,
	SHORT_NEGATION_WORDS,
	SHORT_INABILITY_WORDS,
	SHORT_GENERAL_WORDS,
	DESCRIPTIVE_SURFACE_MAP,
	FORBIDDEN_DV_IMPERATIVE_FORMS,
	FORBIDDEN_DV_PROPOSITIVE_FORMS,
	FORBIDDEN_DV_LONG_INABILITY_FORMS,
	FORBIDDEN_DV_VOLITIONAL_FORMS,
	isDescriptiveVerb,
	isActionVerb,
	canTakeMood,
	getNegationSuppletion,
	getAffirmativeCounterpart,
	conjugatePredicate,
	buildNegatedPredicate,
	buildMoodPredicate,
	validateMoodConcord,
	applyMoodConcord,
	DEGREE_ADVERBS,
	MANNER_ADVERBS,
	DISCOURSE_ADVERBS,
	NEGATIVE_POLARITY_ADVERBS,
	ALL_NPI_WORDS,
	AFFIRMATIVE_DEGREE_ADVERBS,
	isDegreeAdverb,
	isMannerAdverb,
	isDiscourseAdverb,
	isNegativePolarityAdverb,
	isNegativePredicate,
	canAdverbPrecede,
	validateAdverbConcord,
	applyAdverbConcord,
	CLAUSAL_CONNECTIVES,
	CAUSAL_CONNECTIVES,
	CONTRAST_CONNECTIVES,
	PURPOSE_CONNECTIVES,
	CONDITION_CONNECTIVES,
	SIMULTANEOUS_CONNECTIVES,
	MOTION_VERBS,
	getConnectiveSpecs,
	isClausalConnective,
	detectClauseMood,
	detectClauseTense,
	isMotionPredicate,
	parseSentenceToClauses,
	canConnectiveJoin,
	validateClausalConcord,
	generateClausalDistractor,
	applyClausalConcord,
	generateClausalQuizItem
};

if (typeof window !== 'undefined') {
	Object.assign(window, exportedMembers);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = exportedMembers;
}
