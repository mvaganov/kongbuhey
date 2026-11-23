(function() {
const { HANGUL_CONSTANTS: HC } = (typeof require !== 'undefined') ? require('../../data/hangul_constants.js') : window;
// Universal Constants
const { K } = (typeof require !== 'undefined') ? require('../../data/constants.js') : (typeof window !== 'undefined' ? window : {});

/**
 * korean/concord/argument_concord.js
 *
 * Centralized Argument, Subject, Verb, Adverb, Time, and Container Concordance Engine.
 * Uses data.js SemanticTags and SemanticData (preferred_action_verbs, preferred_descriptive_verbs,
 * venue_allowed_verbs, allows_teeth, collocation_filter) and O(1) Set registries.
 */

let dataModule;
if (typeof require !== 'undefined') {
	try {
		dataModule = require('../../data/data.js');
	} catch (e) {
		dataModule = typeof window !== 'undefined' ? window : {};
	}
} else {
	dataModule = typeof window !== 'undefined' ? window : {};
}

const state = (typeof require !== 'undefined' ? require('../state.js') : window);
const {
	DATA_SCHEMA,
	hasTag,
	parseSemanticData
} = (typeof require !== 'undefined' ? require('../core/primitives.js') : window);

const {
	getVerbParticleType,
	getNounCandidatesForVerb,
	getSubjectCandidatesForDescriptiveVerb,
	filterWordsByTense,
	isElderNoun
} = (typeof require !== 'undefined' ? require('../core/morphology.js') : window);

const {
	canAdverbPrecede
} = (typeof require !== 'undefined' ? require('./adverbial_concord.js') : window);

// ============================================================================
// Concordance Domain Sets (O(1) Membership Lookups)
// ============================================================================
// TODO generate these sets automatically at load time. language units should have semantic data or a semantic tag (or tags) that prompts inclusion in a set like this (though a common way of checking for a set requirement like this in the language unit might make the set obsolete, since the language unit can also be checked at O(1) speed). if there are missing language units, create them.

const NON_SUBJECT_DEICTICS = HC.ARG_NON_SUBJECT_DEICTICS;

const SUBJECT_PERSONAL_PRONOUNS = HC.ARG_SUBJECT_PERSONAL_PRONOUNS;
const COLLOQUIAL_NON_SUBJECT_PERSONS = HC.ARG_COLLOQUIAL_NON_SUBJECT_PERSONS;

const NON_AGENT_PERSON_WORDS = HC.ARG_NON_AGENT_PERSON_WORDS;

const NO_DIRECT_OBJECT_VERBS = HC.ARG_NO_DIRECT_OBJECT_VERBS;
const PLACEMENT_VERBS = HC.ARG_PLACEMENT_VERBS;
const ORIGIN_MOTION_VERBS = HC.ARG_ORIGIN_MOTION_VERBS;
const STATIC_POSTURE_VERBS = HC.ARG_STATIC_POSTURE_VERBS;
const DYNAMIC_ACTIVITY_MOTION_VERBS = HC.ARG_DYNAMIC_ACTIVITY_MOTION_VERBS;
const PATH_MOTION_NOUNS = HC.ARG_PATH_MOTION_NOUNS;
const DEPARTURE_ORIGIN_NOUNS = HC.ARG_DEPARTURE_ORIGIN_NOUNS;
const BROAD_WORLD_REGIONS = HC.ARG_BROAD_WORLD_REGIONS;
const STATIC_REST_PLACES = HC.ARG_STATIC_REST_PLACES;
const RESIDENTIAL_LIVING_PLACES = HC.ARG_RESIDENTIAL_LIVING_PLACES;
const SEATING_SURFACE_PLACES = HC.ARG_SEATING_SURFACE_PLACES;
const LYING_SURFACE_PLACES = HC.ARG_LYING_SURFACE_PLACES;
const DAILY_ROUTINE_POSTURE_VERBS = HC.ARG_DAILY_ROUTINE_POSTURE_VERBS;
const DAILY_DEICTIC_TIME_WORDS = HC.ARG_DAILY_DEICTIC_TIME_WORDS;
const MEDIA_WORK_NOUNS = HC.ARG_MEDIA_WORK_NOUNS;
const MOVING_RESIDENCE_PLACES = HC.ARG_MOVING_RESIDENCE_PLACES;
const ATTENDANCE_VENUES = HC.ARG_ATTENDANCE_VENUES;
const RUNNING_VENUES = HC.ARG_RUNNING_VENUES;

const SOLID_COOKING_VERBS = HC.ARG_SOLID_COOKING_VERBS;
const SOLID_COOKING_NOUNS = HC.ARG_SOLID_COOKING_NOUNS;
const NON_SOLID_COOKING_NOUNS = HC.ARG_NON_SOLID_COOKING_NOUNS;
const BOILABLE_NOUNS = HC.ARG_BOILABLE_NOUNS;
const DRINKABLE_NOUNS = HC.ARG_DRINKABLE_NOUNS;
const FRAGILE_BREAKABLE_NOUNS = HC.ARG_FRAGILE_BREAKABLE_NOUNS;
const QUITTABLE_NOUNS = HC.ARG_QUITTABLE_NOUNS;

const GENERAL_TRANSITIVE_FALLBACK_KOREAN = HC.ARG_GENERAL_TRANSITIVE_FALLBACK_KOREAN;

const GENERAL_EVALUATIVE_FALLBACK_KOREAN = HC.ARG_GENERAL_EVALUATIVE_FALLBACK_KOREAN;

const POSSESSION_CALQUE_VERBS = HC.ARG_POSSESSION_CALQUE_VERBS;
const SOUP_STEW_NOUNS = HC.ARG_SOUP_STEW_NOUNS;
const SOUP_STEW_ACTION_VERBS = HC.ARG_SOUP_STEW_ACTION_VERBS;
const DRINK_ACTION_VERBS = HC.ARG_DRINK_ACTION_VERBS;
const LANGUAGE_ACTION_VERBS = HC.ARG_LANGUAGE_ACTION_VERBS;
const TRANSITIVE_PLACE_VERBS = HC.ARG_TRANSITIVE_PLACE_VERBS;
const BODY_CARE_ACTION_VERBS = HC.ARG_BODY_CARE_ACTION_VERBS;
const COMMERCIAL_TRANSACTION_VERBS = HC.ARG_COMMERCIAL_TRANSACTION_VERBS;
const NON_COMMODITY_NOUNS = HC.ARG_NON_COMMODITY_NOUNS;

const FIRST_PERSON_SUBJECT_PRONOUNS = HC.ARG_FIRST_PERSON_SUBJECT_PRONOUNS;
const PRICING_ELIGIBLE_NOUNS = HC.ARG_PRICING_ELIGIBLE_NOUNS;
const RELATIONAL_OR_FORMULAIC_DVS = HC.ARG_RELATIONAL_OR_FORMULAIC_DVS;
const RESTRICTED_NON_TARGET_DVS = HC.ARG_RESTRICTED_NON_TARGET_DVS;
const INTERROGATIVE_DVS = HC.ARG_INTERROGATIVE_DVS;
const INTERPERSONAL_ATTITUDE_DVS = HC.ARG_INTERPERSONAL_ATTITUDE_DVS;
const SUBJECTIVE_EXPERIENCER_DVS = HC.ARG_SUBJECTIVE_EXPERIENCER_DVS;
const NON_PERSON_ATTRIBUTE_DVS = HC.ARG_NON_PERSON_ATTRIBUTE_DVS;
const PRICING_DVS = HC.ARG_PRICING_DVS;
const SMALL_STATIONERY_NOUNS = HC.ARG_SMALL_STATIONERY_NOUNS;
const ERGONOMIC_INTEREST_DVS = HC.ARG_ERGONOMIC_INTEREST_DVS;
const TICKET_CREDENTIAL_NOUNS = HC.ARG_TICKET_CREDENTIAL_NOUNS;
const SIZE_THICKNESS_DVS = HC.ARG_SIZE_THICKNESS_DVS;
const PHYSICAL_DIMENSION_DVS = HC.ARG_PHYSICAL_DIMENSION_DVS;
const AGE_COMPATIBLE_DVS = HC.ARG_AGE_COMPATIBLE_DVS;
const RESULTATIVE_PAST_DVS = HC.ARG_RESULTATIVE_PAST_DVS;
const SOUP_STEW_DVS = HC.ARG_SOUP_STEW_DVS;
const RULE_PROHIBITION_DVS = HC.ARG_RULE_PROHIBITION_DVS;
const LANGUAGE_DVS = HC.ARG_LANGUAGE_DVS;
const BODY_PART_DVS = HC.ARG_BODY_PART_DVS;
const NON_PHYSICAL_ATTR_NOUNS = HC.ARG_NON_PHYSICAL_ATTR_NOUNS;
const HUMAN_APPEARANCE_DVS = HC.ARG_HUMAN_APPEARANCE_DVS;
const WEATHER_TEMPERATURE_DVS = HC.ARG_WEATHER_TEMPERATURE_DVS;
const CONCRETE_PHYSICAL_DVS = HC.ARG_CONCRETE_PHYSICAL_DVS;

const BULKY_OR_MEDIUM_OBJECTS = HC.ARG_BULKY_OR_MEDIUM_OBJECTS;
const FOOD_OR_DRINK_ITEMS = HC.ARG_FOOD_OR_DRINK_ITEMS;
const PUT_IN_CONTAINERS = HC.ARG_PUT_IN_CONTAINERS;
const TINY_CONTAINERS = HC.ARG_TINY_CONTAINERS;
const FALLBACK_CONTAINERS = HC.ARG_FALLBACK_CONTAINERS;

const PLURAL_SUBJECT_WORDS = HC.ARG_PLURAL_SUBJECT_WORDS;
const EXCLUDED_TIME_ADVERBS = HC.ARG_EXCLUDED_TIME_ADVERBS;
const DAILY_HABIT_ADVERBS = HC.ARG_DAILY_HABIT_ADVERBS;

// ============================================================================
// Core Selection & Concordance Functions
// ============================================================================

// Optional steering for the sentence generator (set around one generation call, see setPickSteering): { preferUnitIds, slotBias }.
// Every candidate stays possible; steering only narrows to preferred units and redraws a pick that slotBias.reject flags.
let pickSteering = null;
function setPickSteering(steering) { const prev = pickSteering; pickSteering = steering || null; return prev; }

function pickRandom(arr, seedOffset = null, options = null) {
	if (!arr || arr.length === 0) return null;
	let pool = arr;
	if (options && options.difficultyTier) {
		const tier = options.difficultyTier;
		if (tier === 'easiest') {
			let minScore = 999;
			for (let i = 0; i < arr.length; i++) {
				const sc = arr[i][DATA_SCHEMA.PriorityScore] || 3;
				if (sc < minScore) minScore = sc;
			}
			const easy = arr.filter(u => (u[DATA_SCHEMA.PriorityScore] || 3) <= minScore);
			if (easy.length > 0) pool = easy;
		} else if (tier === 'easy_and_inset') {
			const allowed = options.allowedUnitIds instanceof Set ? options.allowedUnitIds : null;
			const inSetPool = allowed ? arr.filter(u => allowed.has(u[DATA_SCHEMA.Id])) : [];
			const easyPool = arr.filter(u => (u[DATA_SCHEMA.PriorityScore] || 3) <= 2);
			const rndChoice = (state && typeof state.seededRandom === 'function') ? state.seededRandom() : Math.random();
			if (inSetPool.length > 0 && easyPool.length > 0) {
				pool = (rndChoice < 0.5) ? inSetPool : easyPool;
			} else if (inSetPool.length > 0) {
				pool = inSetPool;
			} else if (easyPool.length > 0) {
				pool = easyPool;
			}
		}
	}
	// Only unit rows (arrays) are steered; pickRandom is also used on plain strings/objects.
	const st = Array.isArray(pool[0]) ? pickSteering : null;
	if (st && st.preferUnitIds instanceof Set) {
		const preferred = pool.filter(u => st.preferUnitIds.has(u[DATA_SCHEMA.Id]));
		if (preferred.length > 0) pool = preferred;
	}
	const draw = attempt => {
		if (typeof seedOffset === 'number' && seedOffset >= 0) return pool[(seedOffset + attempt * 7) % pool.length];
		const rnd = (state && typeof state.seededRandom === 'function') ? state.seededRandom() : Math.random();
		return pool[Math.floor(rnd * pool.length)];
	};
	let chosen = draw(0);
	if (st && st.slotBias && typeof st.slotBias.reject === 'function') {
		const retries = typeof st.slotBias.retries === 'number' ? st.slotBias.retries : 2;
		for (let a = 1; a <= retries && pool.length > 1 && st.slotBias.reject(chosen); a++) chosen = draw(a);
	}
	return chosen;
}

function filterBySet(candidates, options = {}, targetId = null) {
	if (!candidates || candidates.length === 0) return [];
	// excludeUnitIds (Set): units the player switched off (e.g. names); the target unit is never excluded.
	const ex = options && options.excludeUnitIds instanceof Set && options.excludeUnitIds.size ? options.excludeUnitIds : null;
	if (ex) candidates = candidates.filter(u => !u || u[DATA_SCHEMA.Id] === targetId || !ex.has(u[DATA_SCHEMA.Id]));
	if (!options || !options.onlyFromSet) return candidates;
	const allowed = options.allowedUnitIds;
	if (!allowed || !(allowed instanceof Set)) return [];
	return candidates.filter(u => {
		if (!u) return false;
		const id = u[DATA_SCHEMA.Id];
		if (options.allowTargetUnit !== false && id === targetId) return true;
		return allowed.has(id);
	});
}

function getAllUnitsOfPos(pos, options = {}, targetId = null) {
	const getWords = dataModule.getWords || (typeof window !== 'undefined' ? window.getWords : () => []);
	const raw = getWords(pos) || [];
	let filtered = filterBySet(raw, options, targetId);
	if (pos === K.DESCRIPTIVE_VERB) {
		if (!options.includeCopula) {
			filtered = filtered.filter(u => u[DATA_SCHEMA.Korean] !== "이다" && u[DATA_SCHEMA.Id] !== 55);
		}
		if (!options.includeGreetingPredicates) {
			filtered = filtered.filter(u => u[DATA_SCHEMA.Korean] !== "안녕하다" && u[DATA_SCHEMA.Id] !== 5);
		}
	}
	if (pos === K.NOUN && !options.includeBoundNominals) {
		filtered = filtered.filter(u => !hasTag(u, "modifier_root", K.BOUND_NOUN) && u[DATA_SCHEMA.Korean] !== "데" && !u[DATA_SCHEMA.Korean].endsWith("적"));
	}
	if ((pos === K.NOUN || pos === K.PRONOUN) && !options.includePossessive) {
		filtered = filtered.filter(u => {
			if (targetId != null && u[DATA_SCHEMA.Id] === targetId) return true;
			const sd = parseSemanticData(u);
			return !hasTag(u, "possessive") && !(sd.en && sd.en.possOnly);
		});
	}
	return filtered;
}

function selectSubjectUnit(options = {}, targetId = null, preferElder = false) {
	const nouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
		n => !hasTag(n, K.MEASUREWORD) && !hasTag(n, K.COUNTER) && !hasTag(n, K.POSITION) && !hasTag(n, "possessive") && !(parseSemanticData(n).en && parseSemanticData(n).en.possOnly) && n[DATA_SCHEMA.Korean] !== "이" && !NON_SUBJECT_DEICTICS.has(n[DATA_SCHEMA.Korean])
	);
	const pronouns = getAllUnitsOfPos(K.PRONOUN, options, targetId).filter(
		p => SUBJECT_PERSONAL_PRONOUNS.has(p[DATA_SCHEMA.Korean])
	);

	if (preferElder) {
		const elders = nouns.filter(
			n => isElderNoun(n) && !NON_AGENT_PERSON_WORDS.has(n[DATA_SCHEMA.Korean])
		);
		if (elders.length > 0) return pickRandom(elders);
		const respectNouns = nouns.filter(n => (hasTag(n, K.PROFESSION, "job", "status") || n[DATA_SCHEMA.Korean].endsWith("님")) && !NON_AGENT_PERSON_WORDS.has(n[DATA_SCHEMA.Korean]));
		if (respectNouns.length > 0) return pickRandom(respectNouns);
	}

	const personNouns = nouns.filter(
		n => hasTag(n, K.PERSON, K.FAMILY, K.PROFESSION, "subject_animate")
			&& !hasTag(n, "body_part", "body", K.ABSTRACT, K.PLACE, K.TIME, K.CLOTHING, K.FOOD, "illness", "symptom", K.TRAVEL, K.EVENT, K.ACTIVITY, K.OBJECT, "building", K.FACILITY, "institution", "language", K.COUNTRY, "name", K.INFORMAL)
			&& !(hasTag(n, "colloquial") && parseSemanticData(n).polarity === -1)
			&& !COLLOQUIAL_NON_SUBJECT_PERSONS.has(n[DATA_SCHEMA.Korean])
			&& !NON_AGENT_PERSON_WORDS.has(n[DATA_SCHEMA.Korean])
			&& !isElderNoun(n)
	);
	const pool = [...personNouns, ...pronouns];
	if (pool.length > 0) return pickRandom(pool);
	if (nouns.length > 0) return pickRandom(nouns);
	if (pronouns.length > 0) return pickRandom(pronouns);
	return null;
}

function isIntransitiveVerb(verbUnit) {
	if (!verbUnit) return false;
	const ko = verbUnit[DATA_SCHEMA.Korean] || "";
	if (ko.endsWith("되다")) return true;
	if (hasTag(
		verbUnit,
		K.INTRANSITIVE,
		K.INTRANSITIVE_GENERAL,
		K.INTRANSITIVE_MOTION,
		K.INTRANSITIVE_PLACE,
		"intransitive_state",
		"intransitive_food",
		"intransitive_person",
		"passive",
		K.WEATHER,
		K.LOCATIVE_STATIC,
		"posture",
		K.HEALTH
	)) return true;
	const sd = parseSemanticData(verbUnit);
	if (sd.type === K.INTRANSITIVE || sd.req === K.SUBJECT) return true;
	return false;
}

function selectArgumentForActionVerb(verbUnit, options = {}, targetId = null) {
	if (!verbUnit) return { nounUnit: null, role: null, particleType: null };
	const verbKo = verbUnit[DATA_SCHEMA.Korean] || "";
	if (verbKo.includes(" ")) {
		return { nounUnit: null, role: null, particleType: null };
	}

	const sd = parseSemanticData(verbUnit);
	const syntaxFrame = String(verbUnit[DATA_SCHEMA.SyntaxFrame] || "");
	const frameRequiresSubject = /이\/가/.test(syntaxFrame) ||
		(sd.type === K.INTRANSITIVE && sd.req && sd.req !== K.PERSON && sd.req !== "any") ||
		sd.req === K.SUBJECT;

	if (frameRequiresSubject || NO_DIRECT_OBJECT_VERBS.has(verbKo)) {
		return { nounUnit: null, role: null, particleType: null };
	}

	const isTransPlacement = PLACEMENT_VERBS.has(verbKo) || hasTag(verbUnit, "placement_transitive", K.TRANSITIVE_GENERAL, "transitive_place");
	const isPathMotion = sd.req === "path" || verbKo === "지나가다";
	const isLocativeOrigin = hasTag(verbUnit, K.LOCATIVE_ORIGIN) || ORIGIN_MOTION_VERBS.has(verbKo);
	const isLocativeStatic = !isLocativeOrigin && !isTransPlacement && (hasTag(verbUnit, K.LOCATIVE_STATIC, "posture") || STATIC_POSTURE_VERBS.has(verbKo));
	const isLocativeMotion = !isLocativeOrigin && !isPathMotion && !isTransPlacement && hasTag(verbUnit, K.INTRANSITIVE_MOTION, K.INTRANSITIVE_PLACE, K.LOCATIVE_GOAL);
	const isPureIntransitive = isIntransitiveVerb(verbUnit);

	if (isPathMotion) {
		const pathNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n =>
			PATH_MOTION_NOUNS.has(n[DATA_SCHEMA.Korean])
		);
		if (pathNouns.length > 0) {
			return { nounUnit: pickRandom(pathNouns), role: K.OBJECT, particleType: K.OBJECT };
		}
		return { nounUnit: null, role: null, particleType: null };
	}

	if (isLocativeOrigin) {
		let originPlaces;
		if (verbKo === "출국하다") {
			originPlaces = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n =>
				DEPARTURE_ORIGIN_NOUNS.has(n[DATA_SCHEMA.Korean]) || hasTag(n, K.COUNTRY, "airport")
			);
		} else {
			originPlaces = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n =>
				hasTag(n, K.PLACE, K.LOCATION, K.FACILITY, K.COUNTRY, "city") && !hasTag(n, K.MEASUREWORD, K.POSITION) && !BROAD_WORLD_REGIONS.has(n[DATA_SCHEMA.Korean])
			);
		}
		if (originPlaces.length > 0) {
			return { nounUnit: pickRandom(originPlaces), role: K.LOCATION, particleType: "location_dynamic" };
		}
		return { nounUnit: null, role: null, particleType: null };
	}

	if (isLocativeStatic) {
		let places;
		if (verbKo === "살다") { // TODO could there be a function in a language unit's semantic data for a function like this, to generate paired nouns? that could eliminate a lot of logic in this file, and would bring functionality and data closer together.
			places = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n =>
				RESIDENTIAL_LIVING_PLACES.has(n[DATA_SCHEMA.Korean])
				|| (hasTag(n, "housing", "residence", "city", K.COUNTRY) && n[DATA_SCHEMA.Korean] !== "곳" && n[DATA_SCHEMA.Korean] !== "회사" && !BROAD_WORLD_REGIONS.has(n[DATA_SCHEMA.Korean]))
			);
		} else if (verbKo === "앉다") {
			places = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n =>
				SEATING_SURFACE_PLACES.has(n[DATA_SCHEMA.Korean])
			);
		} else if (verbKo === "눕다") {
			places = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n =>
				LYING_SURFACE_PLACES.has(n[DATA_SCHEMA.Korean])
			);
		} else {
			places = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n =>
				hasTag(n, K.PLACE, K.LOCATION, K.FACILITY, "furniture") || STATIC_REST_PLACES.has(n[DATA_SCHEMA.Korean])
			);
		}
		if (places.length > 0) {
			return { nounUnit: pickRandom(places), role: K.LOCATION, particleType: "location_static" };
		}
		return { nounUnit: null, role: null, particleType: null };
	}

	if (isLocativeMotion) {
		const isDynamicActivityMotion = DYNAMIC_ACTIVITY_MOTION_VERBS.has(verbKo);
		let places;
		if (verbKo === "이사하다") {
			places = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n =>
				hasTag(n, "housing", "residence", "city", K.COUNTRY) || MOVING_RESIDENCE_PLACES.has(n[DATA_SCHEMA.Korean])
			);
		} else if (verbKo === "결석하다") {
			places = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n =>
				ATTENDANCE_VENUES.has(n[DATA_SCHEMA.Korean])
			);
		} else if (verbKo === "달리다") {
			places = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n =>
				RUNNING_VENUES.has(n[DATA_SCHEMA.Korean])
			);
		} else {
			places = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => hasTag(n, K.PLACE, K.LOCATION, "institution", K.FACILITY));
		}
		if (places.length > 0) {
			return { nounUnit: pickRandom(places), role: K.LOCATION, particleType: isDynamicActivityMotion ? "location_dynamic" : "location_static" };
		}
		return { nounUnit: null, role: null, particleType: null };
	}

	if (isPureIntransitive) {
		return { nounUnit: null, role: null, particleType: null };
	}

	const particleType = getVerbParticleType(verbUnit);

	let candidates = [];
	if (SOLID_COOKING_VERBS.has(verbKo) && !sd.collocation_filter) {
		candidates = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => (hasTag(n, "meat", "fish", "vegetable", "solid_food", "ingredient", K.FOOD) || SOLID_COOKING_NOUNS.has(n[DATA_SCHEMA.Korean])) &&
			!hasTag(n, K.DRINK, "liquid", "beverage", "soup", "stew", K.PLACE, K.FACILITY, "restaurant") &&
			!NON_SOLID_COOKING_NOUNS.has(n[DATA_SCHEMA.Korean])
		);
	} else if (verbKo === "끓이다") {
		candidates = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => BOILABLE_NOUNS.has(n[DATA_SCHEMA.Korean]) || hasTag(n, "soup", "stew", "boilable_liquid")
		);
	} else if ((verbKo === "마시다" || (sd && sd.req === "liquid")) && !sd.collocation_filter) {
		candidates = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => !hasTag(n, K.MEASUREWORD, K.COUNTER, K.SPORTS, "waterSports", K.ACTIVITY) && (
				hasTag(n, K.DRINK, "beverage")
				|| parseSemanticData(n).domain === K.DRINK
				|| (DRINKABLE_NOUNS.has(n[DATA_SCHEMA.Korean])
					&& !hasTag(n, K.TRANSPORTATION, K.VEHICLE) && parseSemanticData(n).domain !== K.TRANSPORTATION)
			)
		);
	} else if (verbKo === "깨다" || verbKo === "깨뜨리다") {
		candidates = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => FRAGILE_BREAKABLE_NOUNS.has(n[DATA_SCHEMA.Korean]) || hasTag(n, "fragile", "dish", "glasswear")
		);
	} else if (verbKo === "그만두다") {
		candidates = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => QUITTABLE_NOUNS.has(n[DATA_SCHEMA.Korean]) || hasTag(n, "job", "work", "habit", "study")
		);
	} else if (hasTag(verbUnit, "cooking") && !sd.collocation_filter) {
		candidates = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => hasTag(n, K.FOOD, "ingredient", "meat", "vegetable") && !hasTag(n, K.DRINK, "liquid", K.PLACE, K.FACILITY)
		);
	}
	if (candidates.length === 0) {
		candidates = filterBySet(getNounCandidatesForVerb(verbUnit), options, targetId);
		if (!sd.collocation_filter && sd.req !== "body" && sd.req !== "body_part") {
			const nonBody = candidates.filter(n => !hasTag(n, "body", "body_part", "bodyPart") && parseSemanticData(n).domain !== "body");
			if (nonBody.length > 0) candidates = nonBody;
		}
	}
	const filteredClean = candidates.filter(n =>
		!hasTag(n, "name", K.QUESTION_WORD, K.INTERROGATIVE)
		&& !NON_SUBJECT_DEICTICS.has(n[DATA_SCHEMA.Korean])
		&& !(hasTag(n, "colloquial") && parseSemanticData(n).polarity === -1)
	);
	if (filteredClean.length > 0) {
		candidates = filteredClean;
	}
	const verbAllowsTeeth = Boolean((sd && sd.allows_teeth) || hasTag(verbUnit, "teeth"));
	if (!verbAllowsTeeth) {
		const nonDental = candidates.filter(n => n[DATA_SCHEMA.Id] !== 361 && n[DATA_SCHEMA.Korean] !== "이");
		if (nonDental.length > 0) candidates = nonDental;
	}
	if (verbKo === "매다") {
		const nonJewelry = candidates.filter(n => !hasTag(n, "jewelry") && n[DATA_SCHEMA.Korean] !== "목걸이");
		if (nonJewelry.length > 0) candidates = nonJewelry;
	}
	const isHumbleVerb = verbKo.includes("드리") || verbKo === "여쭤보다" || verbKo === "여쭙다" || (state.HUMBLE_VERBS && state.HUMBLE_VERBS.has(verbKo)) || (state.HUMBLE_DATIVE_VERBS && state.HUMBLE_DATIVE_VERBS.has(verbKo));
	if (particleType === K.DATIVE && isHumbleVerb) {
		const elders = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => isElderNoun(n) && hasTag(n, K.PERSON, K.FAMILY, K.PROFESSION, "kinship_elder", "elder", K.ELDER_NOUN, "honorific_person")
		);
		if (elders.length > 0) candidates = elders;
	} else if (particleType === K.DATIVE && !isHumbleVerb) {
		const animateNonElders = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => hasTag(n, K.PERSON, K.FAMILY, K.PROFESSION)
				&& !isElderNoun(n)
				&& !NON_AGENT_PERSON_WORDS.has(n[DATA_SCHEMA.Korean])
				&& !COLLOQUIAL_NON_SUBJECT_PERSONS.has(n[DATA_SCHEMA.Korean])
		);
		if (animateNonElders.length > 0) {
			candidates = animateNonElders;
		} else {
			const nonElders = candidates.filter(n => !isElderNoun(n));
			if (nonElders.length > 0) candidates = nonElders;
		}
	}
	const isStrictArgVerb = Boolean(sd && (sd.collocation_filter || (sd.req && sd.req !== K.OBJECT && sd.req !== "any")));
	if (candidates.length === 0 && options.onlyFromSet && !isStrictArgVerb) {
		candidates = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => !hasTag(n, K.MEASUREWORD) && !hasTag(n, K.COUNTER) && !hasTag(n, K.TIME)
		);
	}
	if (candidates.length === 0) return { nounUnit: null, role: null, particleType: null };

	const chosen = pickRandom(candidates);
	const role = particleType === K.DATIVE ? K.RECIPIENT
		: (particleType === K.LOCATION || particleType === "location_static") ? K.LOCATION
		: (particleType === K.DIRECTION || particleType === "direction_ro") ? K.DIRECTION
		: particleType === K.SUBJECT ? K.SUBJECT
		: K.OBJECT;
	return { nounUnit: chosen, role, particleType };
}

function selectActionVerbForNoun(nounUnit, options = {}, targetId = null) {
	const allAVs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(
		av => !(options.excludePossessionCalque && POSSESSION_CALQUE_VERBS.has(av[DATA_SCHEMA.Korean]))
	);
	if (allAVs.length === 0) return null;
	const nounKo = nounUnit[DATA_SCHEMA.Korean] || "";
	const nounSd = parseSemanticData(nounUnit);

	if (nounSd && Array.isArray(nounSd.preferred_action_verbs) && nounSd.preferred_action_verbs.length > 0) {
		const prefSet = new Set(nounSd.preferred_action_verbs);
		const prefAVs = allAVs.filter(av => prefSet.has(av[DATA_SCHEMA.Korean]));
		if (prefAVs.length > 0) return pickRandom(prefAVs);
	}

	if (hasTag(nounUnit, "teeth") || nounKo === "이") {
		const teethAVs = allAVs.filter(av => Boolean(parseSemanticData(av).allows_teeth) && av[DATA_SCHEMA.Korean] !== "갈다");
		if (teethAVs.length > 0) return pickRandom(teethAVs);
	}

	if (hasTag(nounUnit, "soup", "stew") || SOUP_STEW_NOUNS.has(nounKo)) {
		const soupAVs = allAVs.filter(av => SOUP_STEW_ACTION_VERBS.has(av[DATA_SCHEMA.Korean]));
		if (soupAVs.length > 0) return pickRandom(soupAVs);
	}

	if (!hasTag(nounUnit, K.MEASUREWORD, K.COUNTER)
		&& !hasTag(nounUnit, K.TRANSPORTATION, K.VEHICLE)
		&& nounSd.domain !== K.TRANSPORTATION
		&& (hasTag(nounUnit, K.DRINK, "liquid", "beverage") || DRINKABLE_NOUNS.has(nounKo))) {
		const drinkAVs = allAVs.filter(av => DRINK_ACTION_VERBS.has(av[DATA_SCHEMA.Korean]));
		if (drinkAVs.length > 0) return pickRandom(drinkAVs);
	}

	if (hasTag(nounUnit, "language")) {
		const langAVs = allAVs.filter(av => LANGUAGE_ACTION_VERBS.has(av[DATA_SCHEMA.Korean]));
		if (langAVs.length > 0) return pickRandom(langAVs);
	}

	const isNonCommodity = hasTag(nounUnit,
		K.ABSTRACT, K.HEALTH, "dimension_metric", "bodily_process", "meteorological_metric",
		"psychological_state", "physiological_state", "cultural_concept", "verbal_property",
		"bodyPart", K.EMOTION, "personality", K.CONCEPT, "rule", K.PROHIBITION, "signage",
		"language", K.ACTIVITY, K.COMMUNICATION, "attribute"
	) || NON_COMMODITY_NOUNS.has(nounKo);

	const nounId = nounUnit[DATA_SCHEMA.Id];
	const isMediaWork = MEDIA_WORK_NOUNS.has(nounKo) || hasTag(nounUnit, "movie", "film", "media_work");
	const matchingAVs = allAVs.filter(av => {
		const avKo = av[DATA_SCHEMA.Korean] || "";
		if (avKo.includes(" ")) return false;
		if (avKo === "말씀하다" || state.HONORIFIC_WORDS.has(avKo) || state.HUMBLE_WORDS.has(avKo)) return false;
		if (isMediaWork && avKo === "버리다") return false;
		if (isIntransitiveVerb(av)) return false;
		if (getVerbParticleType(av) !== K.OBJECT) return false;
		const cands = getNounCandidatesForVerb(av);
		return cands.some(c => c[DATA_SCHEMA.Id] === nounId);
	});
	if (matchingAVs.length > 0) return pickRandom(matchingAVs);

	if (hasTag(nounUnit, K.PLACE, K.LOCATION, "institution", K.FACILITY)) {
		const transitivePlaceAVs = allAVs.filter(av => TRANSITIVE_PLACE_VERBS.has(av[DATA_SCHEMA.Korean]));
		if (transitivePlaceAVs.length > 0) return pickRandom(transitivePlaceAVs);
	}

	if (hasTag(nounUnit, "teeth", "bodyPart") || nounSd.domain === "body") {
		const bodyAVs = allAVs.filter(av => BODY_CARE_ACTION_VERBS.has(av[DATA_SCHEMA.Korean]));
		if (bodyAVs.length > 0) return pickRandom(bodyAVs);
	}

	// Fallbacks never use a verb whose data restricts its objects (collocation_filter, a specific req, a person object): the noun
	// already failed that verb's candidate check above, so it would read as 시계를 사귀었어요 / 옷걸이를 그만뒀어요. With a small
	// unlocked set those restricted verbs can be the only transitive ones; then no action verb is returned and the caller uses a
	// descriptive verb or another frame.
	const restrictsObject = av => {
		const sd = parseSemanticData(av);
		return Boolean(sd && (sd.collocation_filter || (sd.req && sd.req !== 'any' && sd.req !== K.OBJECT))) || hasTag(av, "transitive_person");
	};
	const cleanTransitiveAVs = allAVs.filter(av => {
		const ko = av[DATA_SCHEMA.Korean];
		if (!ko || ko.includes(" ")) return false;
		if (restrictsObject(av)) return false;
		if (ko === "말씀하다" || state.HONORIFIC_WORDS.has(ko) || state.HUMBLE_WORDS.has(ko)) return false;
		if (isIntransitiveVerb(av)) return false;
		return getVerbParticleType(av) === K.OBJECT;
	});

	if (cleanTransitiveAVs.length > 0) {
		let generalAVs = cleanTransitiveAVs.filter(av => GENERAL_TRANSITIVE_FALLBACK_KOREAN.has(av[DATA_SCHEMA.Korean]));
		if (isNonCommodity) {
			generalAVs = generalAVs.filter(av => !COMMERCIAL_TRANSACTION_VERBS.has(av[DATA_SCHEMA.Korean]));
		}
		if (generalAVs.length > 0) return pickRandom(generalAVs);
		return pickRandom(cleanTransitiveAVs);
	}

	const fallbackTransitive = allAVs.filter(v => !isIntransitiveVerb(v) && !restrictsObject(v) && !(v[DATA_SCHEMA.Korean] || "").includes(" "));
	return pickRandom(fallbackTransitive) || null;
}

function selectDescriptiveVerbForNoun(nounUnit, options = {}, targetId = null) {
	const isElder = isElderNoun(nounUnit);
	const nounKo = nounUnit[DATA_SCHEMA.Korean] || "";
	const nounSd = parseSemanticData(nounUnit);
	const isFirstPersonSubj = FIRST_PERSON_SUBJECT_PRONOUNS.has(nounKo);
	const isPricingEligible = hasTag(nounUnit, "commercial_item", "commodity", "goods", "merchandise", "fee", "currency", K.FOOD, K.CLOTHING, "ticket", K.COMMERCE) ||
		PRICING_ELIGIBLE_NOUNS.has(nounKo);
	const allDVs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId).filter(dv => {
		const ko = dv[DATA_SCHEMA.Korean];
		if (!ko || ko.includes(" ")) return false;
		if (RELATIONAL_OR_FORMULAIC_DVS.has(ko)) return false;
		if (dv[DATA_SCHEMA.Id] !== targetId && RESTRICTED_NON_TARGET_DVS.has(ko)) return false;
		if (hasTag(dv, K.DEMONSTRATIVE, K.QUESTION_WORD, K.INTERROGATIVE, "greeting", K.DISCOURSE) || INTERROGATIVE_DVS.has(ko)) return false;
		if ((nounKo === "우리" || (hasTag(nounUnit, K.PERSON, K.FAMILY) && dv[DATA_SCHEMA.Id] !== targetId)) && ko === "반갑다") return false;
		if (!isFirstPersonSubj && (hasTag(dv, "interpersonal_attitude") || INTERPERSONAL_ATTITUDE_DVS.has(ko))) return false;
		if (hasTag(nounUnit, K.PERSON, K.FAMILY) && !isFirstPersonSubj && SUBJECTIVE_EXPERIENCER_DVS.has(ko)) return false;
		if (hasTag(nounUnit, K.PERSON, K.FAMILY) && NON_PERSON_ATTRIBUTE_DVS.has(ko)) return false;
		if (!isPricingEligible && PRICING_DVS.has(ko)) return false;
		if (SMALL_STATIONERY_NOUNS.has(nounKo) && ERGONOMIC_INTEREST_DVS.has(ko)) return false;
		if (TICKET_CREDENTIAL_NOUNS.has(nounKo) && SIZE_THICKNESS_DVS.has(ko)) return false;
		if ((nounKo === "게임" || MEDIA_WORK_NOUNS.has(nounKo) || hasTag(nounUnit, K.ACTIVITY, "movie", "film", "media_work")) && PHYSICAL_DIMENSION_DVS.has(ko)) return false;
		if (nounKo === "나이" && !AGE_COMPATIBLE_DVS.has(ko)) return false;
		if (options.tense && options.tense !== K.PAST && (hasTag(dv, "resultative_past") || RESULTATIVE_PAST_DVS.has(ko))) return false;
		if (!isElder && state.HONORIFIC_WORDS && state.HONORIFIC_WORDS.has(ko)) return false;
		return true;
	});
	if (allDVs.length === 0) return null;

	if (nounSd && Array.isArray(nounSd.preferred_descriptive_verbs) && nounSd.preferred_descriptive_verbs.length > 0) {
		const prefSet = new Set(nounSd.preferred_descriptive_verbs);
		const prefDVs = allDVs.filter(dv => prefSet.has(dv[DATA_SCHEMA.Korean]));
		if (prefDVs.length > 0) return pickRandom(prefDVs, options.seedOffset, options);
	}

	if (hasTag(nounUnit, "soup", "stew") || SOUP_STEW_NOUNS.has(nounKo)) {
		const soupDVs = allDVs.filter(dv => SOUP_STEW_DVS.has(dv[DATA_SCHEMA.Korean]));
		if (soupDVs.length > 0) return pickRandom(soupDVs, options.seedOffset, options);
	}

	if (nounKo === "주차 금지" || hasTag(nounUnit, K.PROHIBITION, "rule")) {
		const ruleDVs = allDVs.filter(dv => RULE_PROHIBITION_DVS.has(dv[DATA_SCHEMA.Korean]));
		if (ruleDVs.length > 0) return pickRandom(ruleDVs, options.seedOffset, options);
	}

	if (hasTag(nounUnit, "language")) {
		const langDVs = allDVs.filter(dv => LANGUAGE_DVS.has(dv[DATA_SCHEMA.Korean]));
		if (langDVs.length > 0) return pickRandom(langDVs, options.seedOffset, options);
	}

	const nounId = nounUnit[DATA_SCHEMA.Id];
	const matchingDVs = allDVs.filter(dv => {
		const cands = getSubjectCandidatesForDescriptiveVerb(dv);
		return cands.some(c => c[DATA_SCHEMA.Id] === nounId);
	});
	if (matchingDVs.length > 0) return pickRandom(matchingDVs, options.seedOffset, options);

	if (hasTag(nounUnit, "teeth", "bodyPart") || nounSd.domain === "body") {
		const bodyDVs = allDVs.filter(dv => BODY_PART_DVS.has(dv[DATA_SCHEMA.Korean]));
		if (bodyDVs.length > 0) return pickRandom(bodyDVs, options.seedOffset, options);
	}

	const isNonPhysicalAttr = hasTag(nounUnit, "language", K.ABSTRACT, "attribute", K.ACTIVITY, "quantity", "time_amount") || NON_PHYSICAL_ATTR_NOUNS.has(nounKo);
	// Fallbacks never use a verb whose data restricts its subjects (collocation_filter): the noun did not match it above
	// (저게 많아요 came from here although 많다 excludes deictic subjects), as selectActionVerbForNoun does for objects.
	const unrestricted = allDVs.filter(dv => !(parseSemanticData(dv) || {}).collocation_filter);
	const cleanDVs = unrestricted.filter(dv => {
		const ko = dv[DATA_SCHEMA.Korean];
		if (!ko || ko.includes(" ")) return false;
		if (HUMAN_APPEARANCE_DVS.has(ko)) return false;
		if (WEATHER_TEMPERATURE_DVS.has(ko)) return false;
		if (isNonPhysicalAttr && CONCRETE_PHYSICAL_DVS.has(ko)) return false;
		return true;
	});

	if (cleanDVs.length > 0) {
		const generalDVs = cleanDVs.filter(dv => GENERAL_EVALUATIVE_FALLBACK_KOREAN.has(dv[DATA_SCHEMA.Korean]));
		if (generalDVs.length > 0) return pickRandom(generalDVs, options.seedOffset, options);
		return pickRandom(cleanDVs, options.seedOffset, options);
	}

	return pickRandom(unrestricted.length ? unrestricted : allDVs, options.seedOffset, options);
}

function selectPutInContainerNoun(objectNounUnit, options = {}, targetId = null) {
	const objKo = objectNounUnit ? (objectNounUnit[DATA_SCHEMA.Korean] || "") : "";
	const isBulkyOrMedium = Boolean(objectNounUnit && (
		BULKY_OR_MEDIUM_OBJECTS.has(objKo) ||
		hasTag(objectNounUnit, "furniture", "appliance", K.CLOTHING, "footwear", "luggage")
	));
	const isFoodOrDrink = Boolean(objectNounUnit && (
		hasTag(objectNounUnit, K.FOOD, K.DRINK, "beverage") ||
		FOOD_OR_DRINK_ITEMS.has(objKo)
	));
	let pool = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => {
		const nKo = n[DATA_SCHEMA.Korean] || "";
		if (nKo === "쓰레기통") return false;
		if (hasTag(n, K.FOOD, K.HONORIFIC, "honorific_noun")) return false;
		if (!PUT_IN_CONTAINERS.has(nKo) && !hasTag(n, "container")) return false;
		if (isBulkyOrMedium && TINY_CONTAINERS.has(nKo)) return false;
		if (!isFoodOrDrink && nKo === "냉장고") return false;
		return true;
	});
	if (pool.length === 0) {
		pool = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => FALLBACK_CONTAINERS.has(n[DATA_SCHEMA.Korean]));
	}
	return pickRandom(pool);
}

function isPluralSubjectUnit(subjUnit) {
	if (!subjUnit) return false;
	const sKo = subjUnit[DATA_SCHEMA.Korean] || "";
	return hasTag(subjUnit, "plural") || PLURAL_SUBJECT_WORDS.has(sKo) || sKo.endsWith("들");
}

function selectTimeUnit(tense, options = {}, targetId = null, targetVerbUnit = null) {
	const vKo = targetVerbUnit ? (targetVerbUnit[DATA_SCHEMA.Korean] || "") : "";
	if (vKo === "살다" && tense !== K.PRESENT) return null;
	// TODO should this be a named set near the top of argument_concord.js?
	const excludedTimeNouns = new Set([
		"학기", "날", "때", "번", "월", "년", "한번", "방학중", "학기 중", "계절", "언제", "생신",
		"며칠", "몇 시", "이때", "순서", "차례", "동안", "하루", "이틀", "사흘", "나흘", "닷새",
		"열흘", "기간", "날짜", "일정", "출발", "여유", "적", "말", "전", "후", "처음", "과거",
		"미래", "이전", "종일", "요일", "연초", "연말", "오랜만", "-박 -일", "지난", "올해", "금년",
		"작년", "지난해", "내년", "다음주"
	]);
	if (tense !== K.PRESENT) {
		excludedTimeNouns.add("지금");
		excludedTimeNouns.add("요즘");
		excludedTimeNouns.add("현재");
	}
	const isDailyRoutine = DAILY_ROUTINE_POSTURE_VERBS.has(vKo);
	const timeNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => {
		const nKo = n[DATA_SCHEMA.Korean];
		if (!hasTag(n, K.TIME, "temporal")) return false;
		if (hasTag(n, K.MEASUREWORD, K.COUNTER, K.QUESTION_WORD, K.INTERROGATIVE, K.HONORIFIC, "honorific_noun", K.ABSTRACT, "order", "duration", K.BOUND_NOUN, "schedule", K.CONCEPT, K.EMOTION, "time_modifier", K.DETERMINER)) return false;
		if (excludedTimeNouns.has(nKo)) return false;
		if (vKo === "살다" && nKo !== "요즘" && nKo !== "지금") return false;
		if (isDailyRoutine && !DAILY_DEICTIC_TIME_WORDS.has(nKo)) return false;
		return true;
	});
	const timeAdvs = getAllUnitsOfPos(K.POS_ADVERB, options, targetId).filter(a => {
		if (!hasTag(a, K.TIME, "temporal", "adverb_time")) return false;
		if (hasTag(a, K.QUESTION_WORD, K.INTERROGATIVE)) return false;
		const aKo = a[DATA_SCHEMA.Korean];
		if (EXCLUDED_TIME_ADVERBS.has(aKo)) return false;
		if (tense === K.FUTURE && DAILY_HABIT_ADVERBS.has(aKo)) return false;
		if (vKo === "살다" && aKo !== "요즘" && aKo !== "지금") return false;
		if (isDailyRoutine && !DAILY_DEICTIC_TIME_WORDS.has(aKo)) return false;
		if (targetVerbUnit && typeof canAdverbPrecede === 'function' && !canAdverbPrecede(a, targetVerbUnit, { tense })) return false;
		return true;
	});
	const pool = filterWordsByTense([...timeNouns, ...timeAdvs], tense);
	return pickRandom(pool);
}

function selectAdverbUnit(isDescriptive, polarity, options = {}, targetId = null, targetVerbUnit = null) {
	const advs = getAllUnitsOfPos(K.POS_ADVERB, options, targetId).filter(a => {
		if (a[DATA_SCHEMA.PartofSpeech] !== K.POS_ADVERB) return false;
		const ko = a[DATA_SCHEMA.Korean];
		if (ko === "안" || ko === "못") return false;
		if (polarity !== K.NEGATIVE && state.ALL_NPI_WORDS.has(ko)) return false;
		if (hasTag(a, K.DISCOURSE, "conjunction", K.TIME, "temporal", "concessive", "approximation", "number_unit", K.CONNECTIVE, "greeting", "interjection", "exclamation", "hesitation")) return false;
		if (hasTag(a, K.QUESTION_WORD, K.INTERROGATIVE)) return false;
		if (targetVerbUnit && typeof canAdverbPrecede === 'function' && !canAdverbPrecede(a, targetVerbUnit, { isNegative: polarity === K.NEGATIVE, pluralSubject: options.pluralSubject })) return false;
		if (isDescriptive) {
			if (state.MANNER_ADVERBS.has(ko) || hasTag(a, K.MANNER, K.ADVERB_MANNER)) return false;
			const sv = parseSemanticData(a);
			if (sv && sv.target_pos === K.ACTION_VERB) return false;
			return state.DEGREE_ADVERBS.has(ko) || hasTag(a, K.DEGREE, "adverb_degree", "degree_pure");
		}
		if (hasTag(a, "degree_pure")) return false;
		return state.MANNER_ADVERBS.has(ko) || hasTag(a, K.MANNER, K.ADVERB_MANNER);
	});
	return pickRandom(advs);
}

const argumentConcordExports = {
	pickRandom,
	setPickSteering,
	filterBySet,
	getAllUnitsOfPos,
	selectSubjectUnit,
	isIntransitiveVerb,
	selectArgumentForActionVerb,
	selectActionVerbForNoun,
	selectDescriptiveVerbForNoun,
	selectPutInContainerNoun,
	isPluralSubjectUnit,
	selectTimeUnit,
	selectAdverbUnit,
	NON_SUBJECT_DEICTICS,
	PLACEMENT_VERBS,
	RESULTATIVE_PAST_DVS,
	INTERPERSONAL_ATTITUDE_DVS,
	WEATHER_TEMPERATURE_DVS,
	DAILY_HABIT_ADVERBS
};

if (typeof window !== 'undefined') {
	Object.assign(window, argumentConcordExports);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = argumentConcordExports;
}
})();

