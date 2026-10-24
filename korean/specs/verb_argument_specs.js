/**
 * Action and Descriptive Verb Argument Specifications
 *
 * Declarative argument selection frames mapping semantic tags to required
 * arguments, particles, and domain preference flags.
 */

const ACTION_VERB_SPECS = Object.freeze([
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
]);

const DESCRIPTIVE_VERB_SPECS = Object.freeze([
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
]);

const verbArgumentSpecs = {
	ACTION_VERB_SPECS,
	DESCRIPTIVE_VERB_SPECS
};

if (typeof window !== 'undefined') {
	Object.assign(window, verbArgumentSpecs);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = verbArgumentSpecs;
}
