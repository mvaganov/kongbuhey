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
	DISCOURSE: "discourse",
	ADVERB_DEGREE: "adverb_degree",
	DEGREE: "degree",
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
	PLACE: "place",

	// Classifiers / Counters (Feature 6)
	MEASURE_WORD: "measureWord",
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
	HONORIFIC: "honorific",
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

if (typeof window !== "undefined") {
	window.GRAMMAR_TAGS = GRAMMAR_TAGS;
}

if (typeof module !== "undefined" && module.exports) {
	module.exports = { GRAMMAR_TAGS };
}
