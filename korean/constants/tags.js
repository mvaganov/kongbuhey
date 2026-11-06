(function() {
// Universal Constants
const { K } = (typeof require !== 'undefined') ? require('../../constants.js') : (typeof window !== 'undefined' ? window : {});

/**
 * Korean Engine Semantic and Grammar Tag Constants
 *
 * Centralized, frozen registry of semantic tag strings used across data.js and the
 * Korean grammatical concordance engines. Eliminates string literal typos.
 */
const GRAMMAR_TAGS = Object.freeze({
	// Clausal Connective Concord (Feature 11)
	MOTION_CONCORD: "motion_concord",
	CONNECTIVE: "connective",
	CLAUSAL_CONNECTIVE: "clausal_connective",
	CAUSE: "cause",
	REASON: "reason",
	CAUSAL: "causal",
	CONTRAST: "contrast",
	PURPOSE: "purpose",
	CONDITION: "condition",
	SIMULTANEOUS: "simultaneous",

	// Adverbial & Polarity (Feature 9)
	ADVERB_DISCOURSE: "adverb_discourse",
	DISCOURSE: K.DISCOURSE,
	ADVERB_DEGREE: "adverb_degree",
	DEGREE: K.DEGREE,
	ADVERB_MANNER: "adverb_manner",
	MANNER: "manner",
	NEGATIVE_POLARITY: "negative_polarity",
	NPI: "npi",

	// Mood & Speech Acts (Feature 8)
	IMPERATIVE: "imperative",
	PROHIBITION: "prohibition",
	PROPOSITIVE: "propositive",
	SUGGESTION: "suggestion",
	INABILITY: "inability",
	NEGATIVE: "negative",
	VOLITIONAL: "volitional",
	DESIRE: "desire",

	// Spatial & Deictic (Feature 7)
	POSITION: "position",
	DEICTIC: "deictic",
	DEMONSTRATIVE: "demonstrative",
	PROXIMAL: "proximal",
	MEDIAL: "medial",
	DISTAL: "distal",
	DIRECTION: "direction",
	LOCATION: "location",
	PLACE: K.PLACE,

	// Classifiers / Counters (Feature 6)
	MEASURE_WORD: K.MEASUREWORD,
	COUNTER: "counter",
	KOREAN_MEASURE_WORD: "koreanMeasureWord",
	SINO_MEASURE_WORD: "sinoMeasureWord",

	// Temporal Concord
	TEMPORAL_PAST: "temporal_past",
	TEMPORAL_PRESENT: "temporal_present",
	TEMPORAL_FUTURE: "temporal_future",
	NO_TIME_PARTICLE: "no_time_particle",

	// Honorific & Social Hierarchy
	ELDER_NOUN: "elder_noun",
	INANIMATE_INSTITUTION: "inanimate_institution",
	HONORIFIC: K.HONORIFIC,
	HUMBLE: "humble",
	HONORIFIC_VERB: "honorificVerb",
	HUMBLE_VERB: "humbleVerb",
	HONORIFIC_NOUN: "honorific_noun",
	DATIVE_HUMBLE: "dative_humble",

	// Locative Sub-roles
	LOCATIVE_ORIGIN: "locative_origin",
	LOCATIVE_GOAL: "locative_goal",
	LOCATIVE_STATIC: "locative_static"
});

/**
 * Recognized Topical Curriculum Taxonomy Categories
 *
 * Formal whitelist of authorized educational vocabulary domains and topical groupings.
 * Used by schema analysis and tag hygiene linters to distinguish valid educational topics
 * from orphaned, misspelt, or dead semantic tags.
 */
const CURRICULUM_TAXONOMY_TAGS = Object.freeze([
	// Food & Dining
	K.FOOD, "drink", "beverage", "cooking", "dish", "meal", "snack", "dessert", "fruit",
	"vegetable", "meat", "seafood", "fish", "grain", "soup", "sideDish", "condiment",
	"flavor", "taste", "restaurant", "cafe", "bakery", "ingredient", "alcohol",

	// Clothing & Apparel
	K.CLOTHING, K.WEARABLE, "footwear", "headwear", "handwear", "neckwear", "accessory",
	"jewelry", "bag", "fabric", "style", "fashion",

	// Living, Home & Furniture
	"home", "house", "furniture", "room", "kitchen", "bathroom", "bedroom", "appliance",
	"tool", "bedding", "cleaning", "housework", "household", "living", "housing",

	// Body, Health & Hygiene
	"body", "bodyPart", K.HEALTH, "medical", "medicine", "hospital", "pharmacy", "illness",
	"disease", "symptom", "treatment", "hygiene", "wellness", "fitness",

	// People, Family & Relationships
	K.PERSON, "people", K.FAMILY, "kinship", "relationship", "friend", "parent", "child",
	"sibling", "spouse", "occupation", "profession", "job", "worker", "role", "title",
	"adult", "elder",

	// Nature, Animals & Environment
	K.NATURE, K.WEATHER, "season", "climate", "animal", "pet", "plant", "flower", "tree",
	"landscape", "sky", "earth", "water", "geography", "mountain", "sea", "river",

	// Time & Calendar
	K.TIME, "calendar", "date", "day", "month", "year", "hour", "minute", "second",
	"morning", "afternoon", "evening", "night", "dawn", "holiday", "duration",

	// Travel, Spatial & Transportation
	K.TRAVEL, "trip", "transport", K.TRANSPORTATION, "vehicle", "car", "bus", "train",
	"subway", "bicycle", "airplane", "ship", "station", "airport", "road", "street",
	"traffic", "route", "direction", "distance",

	// Education, Academic & Language
	"education", K.ACADEMIC, "school", "university", "college", "student", "teacher",
	"classroom", "study", "learning", "exam", "grade", "major", "subject", "language",
	"linguistics", "reading", "writing", "book", "stationery",

	// Culture, Arts & Entertainment
	"culture", "art", "music", "song", "media", "film", "movie", "drama", "broadcast",
	"literature", "entertainment", "recreation", "leisure", "hobby", "sports", "sport",
	"game", "exercise", "tradition", "festival",

	// Economy, Commerce & Shopping
	"economy", K.COMMERCE, "finance", "money", "currency", "bank", "price", "cost",
	"shopping", "market", "store", "product", "goods", "commodity", "business",

	// Technology, Science & Devices
	"technology", "science", "electronics", "device", "machine", "computer", "internet",
	"phone", "digital",

	// Society, Public & Institutions
	"society", K.SOCIAL, "institution", K.FACILITY, "organization", "government",
	"public", "community", "law", "rule", "security", "postal",

	// Emotions, Traits & Mental States
	K.EMOTION, "feeling", "mood", "mental", "mind", "personality", "trait", "attitude",
	"cognition", "thought", "belief", "sensation", "sensory",

	// Abstract & General Concepts
	K.CONCEPT, K.ABSTRACT, K.GENERAL, K.ACTIVITY, "event", "schedule", "state", "status",
	"situation", "condition", "attribute", "property", "measurement", "quantity", K.DEGREE
]);

if (typeof window !== "undefined") {
	window.GRAMMAR_TAGS = GRAMMAR_TAGS;
	window.CURRICULUM_TAXONOMY_TAGS = CURRICULUM_TAXONOMY_TAGS;
}

if (typeof module !== "undefined" && module.exports) {
	module.exports = { GRAMMAR_TAGS, CURRICULUM_TAXONOMY_TAGS };
}
})();
