(function() {
// Universal Constants
const { K } = (typeof require !== 'undefined') ? require('../../constants.js') : (typeof window !== 'undefined' ? window : {});

/**
 * Action and Descriptive Verb Argument Specifications
 *
 * Declarative argument selection frames mapping semantic tags to required
 * arguments, particles, and domain preference flags.
 */

const { hasTag } = (typeof require !== 'undefined' ? require('../core/primitives.js') : window);

const ACTION_VERB_SPECS = Object.freeze([
	// Apparel (Fine-grained)
	{ tag: "transitive_clothing", nounTag: K.CLOTHING, particle: K.OBJECT },
	{ tag: "transitive_footwear", nounTag: "footwear", particle: K.OBJECT },
	{ tag: "transitive_headwear", nounTag: "headwear", particle: K.OBJECT },
	{ tag: "transitive_handwear", nounTag: "handwear", particle: K.OBJECT, fallbackTag: "accessory" },
	{ tag: "transitive_neckwear", nounTag: "neckwear", particle: K.OBJECT, fallbackTag: "accessory" },
	{ tag: "transitive_watch", nounTag: "watch", particle: K.OBJECT, fallbackTag: "accessory" },
	{ tag: "transitive_wearable", nounTag: K.WEARABLE, particle: K.OBJECT },

	// Consumption
	{ tag: "transitive_food", nounTag: K.FOOD, particle: K.OBJECT, preferDomain: true },
	{ tag: "transitive_drink", nounTag: K.DRINK, particle: K.OBJECT, preferDomain: true },

	// Media, Arts & Communication
	{ tag: "transitive_reading", nounTag: "reading", particle: K.OBJECT },
	{ tag: "transitive_visual", nounTag: "visual_media", particle: K.OBJECT },
	{ tag: "transitive_audio", nounTag: "audio", particle: K.OBJECT },
	{ tag: "transitive_song", nounTag: "song", particle: K.OBJECT, fallbackTag: K.PERSON },
	{ tag: "transitive_writing", nounTag: "writing", particle: K.OBJECT },
	{ tag: "transitive_language", nounTag: "language", particle: K.OBJECT },
	{ tag: "transitive_information", nounTag: K.ABSTRACT, particle: K.OBJECT, fallbackTag: "education" },

	// Activities & Sports
	{ tag: "transitive_activity", nounTag: K.ACTIVITY, particle: K.OBJECT },
	{ tag: "transitive_instrument", nounTag: "instrument", particle: K.OBJECT },
	{ tag: "transitive_sports", nounTag: "racketSports", particle: K.OBJECT, fallbackTag: K.SPORTS },

	// Vehicles & Transportation
	{ tag: "transitive_vehicle", nounTag: K.VEHICLE, particle: K.OBJECT },
	{ tag: "transitive_transportation", nounTag: K.TRANSPORTATION, particle: K.OBJECT },

	// Hygiene & Chores
	{ tag: "transitive_teeth", nounTag: "teeth", particle: K.OBJECT, fallbackTag: "bodyPart" },
	{ tag: "transitive_bodyPart", nounTag: "bodyPart", particle: K.OBJECT },
	{ tag: "transitive_room", nounTag: K.ROOM, particle: K.OBJECT },

	// Social & General
	{ tag: "transitive_person", nounTag: K.PERSON, particle: K.OBJECT },
	{ tag: "transitive_social", nounTag: K.PERSON, particle: K.OBJECT },
	{ tag: K.DATIVE_PERSON, nounTag: K.PERSON, particle: K.DATIVE },
	{ tag: "dative_humble", nounTag: K.ELDER_NOUN, particle: K.DATIVE, fallbackTag: K.PERSON },
	{ tag: "transitive_place", nounTag: K.PLACE, particle: K.OBJECT, preferDomain: true },
	{ tag: "transitive_object", nounTag: K.OBJECT, particle: K.OBJECT },
	{ tag: K.TRANSITIVE_GENERAL, nounTag: K.OBJECT, particle: K.OBJECT, fallbackTag: null },

	// Intransitive Motion & Location
	{ tag: K.INTRANSITIVE_MOTION, nounTag: K.PLACE, particle: K.LOCATION, preferDomain: true },
	{ tag: K.INTRANSITIVE_PLACE, nounTag: K.PLACE, particle: K.LOCATION, preferDomain: true },
	{ tag: "intransitive_person", nounTag: K.PERSON, particle: K.SUBJECT },
	{ tag: "intransitive_social", nounTag: K.PERSON, particle: K.SUBJECT },
	{ tag: "intransitive_food", nounTag: null, particle: null },
	{ tag: K.INTRANSITIVE_GENERAL, nounTag: null, particle: null }
]);

const DESCRIPTIVE_VERB_SPECS = Object.freeze([
	// Taste / Flavor (food, drinks)
	{ tag: "descriptive_taste", nounTag: K.FOOD, fallbackTag: K.DRINK, preferDomain: true },

	// Weather / Atmosphere / Climate
	{ tag: "descriptive_weather", nounTag: K.WEATHER },

	// Tactile & Liquid Temperature (water, drinks, food)
	{ tag: "descriptive_tactile_temperature", nounTag: K.DRINK, fallbackTag: K.FOOD },

	// Physical Dimensions: Spatial (rooms, houses, streets, roads)
	{ tag: "descriptive_dimension_spatial", nounTag: K.ROOM, fallbackTag: K.PLACE },

	// Physical Dimensions: Linear Length (clothing, time, distance, lines)
	{ tag: "descriptive_dimension_length", nounTag: K.CLOTHING, fallbackTag: K.TIME },

	// Physical Dimensions: Height (mountains, buildings, elevation)
	{ tag: "descriptive_dimension_height", nounTag: "mountain", fallbackTag: "building" },

	// Physical Dimensions: Weight (luggage, books, bags)
	{ tag: "descriptive_dimension_weight", nounTag: "luggage", fallbackTag: K.OBJECT },

	// Physical Dimensions: Thickness (clothing, books)
	{ tag: "descriptive_dimension_thickness", nounTag: K.CLOTHING, fallbackTag: "book" },

	// Physical Dimensions: General Scale / Size (rooms, buildings, objects)
	{ tag: "descriptive_dimension_scale", nounTag: K.ROOM, fallbackTag: K.OBJECT },

	// Price & Cost (clothing, commodities, food)
	{ tag: "descriptive_price", nounTag: K.CLOTHING, fallbackTag: "commodity" },

	// Cleanliness & Hygiene (rooms, places, facilities)
	{ tag: "descriptive_cleanliness", nounTag: K.ROOM, fallbackTag: K.PLACE },

	// Acoustics & Noise (rooms, places, neighborhoods)
	{ tag: "descriptive_acoustic", nounTag: K.ROOM, fallbackTag: K.PLACE },

	// Psychological & Emotional State (strictly people/sentient beings)
	{ tag: "descriptive_emotion", nounTag: K.PERSON, fallbackTag: K.PERSON },

	// Personal Traits & Animate Characteristics (strictly people)
	{ tag: "descriptive_person_trait", nounTag: K.PERSON },
	{ tag: K.DESCRIPTIVE_PERSON, nounTag: K.PERSON },

	// Difficulty & Comprehension (languages, tasks, exams)
	{ tag: "descriptive_difficulty", nounTag: "education", fallbackTag: K.ABSTRACT },

	// Speed & Velocity (vehicles, people)
	{ tag: "descriptive_speed", nounTag: K.VEHICLE, fallbackTag: K.PERSON },

	// Color & Visual Appearance (clothing, nature, objects)
	{ tag: "descriptive_color", nounTag: K.CLOTHING, fallbackTag: K.NATURE },
	{ tag: "descriptive_appearance", nounTag: K.CLOTHING, fallbackTag: K.PERSON },

	// Locations & Facilities
	{ tag: "descriptive_place", nounTag: K.PLACE },

	// Food (General)
	{ tag: "descriptive_food", nounTag: K.FOOD },

	// Fallback general object
	{ tag: K.DESCRIPTIVE_GENERAL, nounTag: K.OBJECT, fallbackTag: null }
]);

/**
 * Declarative Semantic Predicate and Argument Classifiers
 */
function isGradableDescriptiveVerb(unit) {
	return hasTag(unit, K.GRADABLE);
}

function isScalableActionVerb(unit) {
	return hasTag(unit, "scalable", "scalable_duration", "scalable_emotion", "scalable_quantity");
}

function isPureDegreeAdverb(unit) {
	return hasTag(unit, "degree_pure");
}

function isVolitionalHumanVerb(unit) {
	return hasTag(unit, "volitional_human");
}

function isResourceNoun(unit) {
	return hasTag(unit, "resource");
}

const verbArgumentSpecs = {
	ACTION_VERB_SPECS,
	DESCRIPTIVE_VERB_SPECS,
	isGradableDescriptiveVerb,
	isScalableActionVerb,
	isPureDegreeAdverb,
	isVolitionalHumanVerb,
	isResourceNoun
};

if (typeof window !== 'undefined') {
	Object.assign(window, verbArgumentSpecs);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = verbArgumentSpecs;
}
})();
