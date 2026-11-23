(function() {
const { HANGUL_CONSTANTS: HC } = (typeof require !== 'undefined') ? require('../../data/hangul_constants.js') : window;
// Universal Constants
const { K } = (typeof require !== 'undefined') ? require('../../data/constants.js') : (typeof window !== 'undefined' ? window : {});

/**
 * korean/generation/unit_sentence_generator.js
 *
 * Target-Unit-Constrained Sentence AST Generator (All 9 Parts of Speech).
 *
 * Capabilities:
 * 1. Generates grammatical, semantically concordant Korean sentences (with full SentenceAST,
 *    eojeol/morpheme segment provenance, and Language Unit IDs) guaranteed to showcase
 *    any target Language Unit (ID 0..2005) across all 9 Parts of Speech:
 *    Noun, Pronoun, Action Verb, Descriptive Verb, Adverb, Determiner, Number, Exclamation, Grammar.
 * 2. First-class "Only From Set" (`options.onlyFromSet`, `options.allowedUnitIds`) constraint:
 *    Restricts all lexical slot-fillers to the user's active practice set and returns
 *    structured insufficiency diagnostics (`{ ok: false, insufficientSet: true, missingRoles, message }`)
 *    if the active set lacks required parts of speech to form a grammatical sentence.
 *
 * Platform: Node.js & Browser (Vanilla JS, zero dependencies).
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
	parseSemanticData,
	getStem
} = (typeof require !== 'undefined' ? require('../core/primitives.js') : window);

const {
	resolvePureMorphology,
	getConjugatedStem
} = (typeof require !== 'undefined' ? require('../core/stem_engine.js') : window);

const {
	getLexiconIndex
} = (typeof require !== 'undefined' ? require('../core/lexicon_index.js') : window);

const {
	getSinoNumber,
	getKoreanNumber
} = (typeof require !== 'undefined' ? require('../core/numbers.js') : window);

const {
	getVerbParticleType,
	getNounCandidatesForVerb,
	getSubjectCandidatesForDescriptiveVerb,
	getTemporalPolarity,
	filterWordsByTense,
	isElderNoun,
	isDeicticTimeWord,
	canTakeMood
} = (typeof require !== 'undefined' ? require('../core/morphology.js') : window);

const {
	getClassifierNumeralType,
	getMatchingClassifier,
	getMatchingNounsForClassifier,
	canAdverbPrecede,
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
	selectAdverbUnit
} = (typeof require !== 'undefined' ? require('../concord/index.js') : window);

const {
	getGrammarRegistry,
	resolveParticleUnit,
	resolveEndingUnit,
	makeSegment,
	splitNounAndParticleSegments,
	splitSingleVerbWordSegments,
	realizeKoreanFromAST
} = (typeof require !== 'undefined' ? require('./sentence_ast.js') : window);

/**
 * Builds a SentenceAST for an Action Verb unit.
 */
function buildASTForActionVerb(verbUnit, variationIndex = 0, options = {}) {
	const targetId = verbUnit[DATA_SCHEMA.Id];
	const rawVerbKo = verbUnit[DATA_SCHEMA.Korean] || "";
	const isHonVerb = state.HONORIFIC_WORDS.has(rawVerbKo);
	const tenses = rawVerbKo === "알다" ? [K.PRESENT, K.PRESENT, K.PAST] : [K.PRESENT, K.PAST, K.FUTURE];
	const tense = options.tense || tenses[variationIndex % tenses.length];
	const politeness = options.politeness || (variationIndex === 2 ? K.FORMAL_HIGH : "polite");

	const arg = selectArgumentForActionVerb(verbUnit, options, targetId);
	const isNominativeSubjectVerb = arg.role === K.SUBJECT;
	const verbKo = verbUnit[DATA_SCHEMA.Korean] || "";
	const isInvoluntary = hasTag(verbUnit, "involuntary", "passive", "symptom", K.WEATHER, "state", "existential") || HC.UNITGEN_AST_ACTION_VERB_K_VERBKO_INCLUDES_K_LIST_SOME.some(k => verbKo.includes(k));
	const modality = (variationIndex === 1 && !isHonVerb && !isNominativeSubjectVerb && !isInvoluntary && !options.onlyFromSet) ? "desire" : null;

	let subjUnit = null;
	// TODO should the Sets in these conditionals be generated in argument_concord.js? can the associated language units flag inclusion in these Sets?
	if (verbKo === "끓다") {
		const liquids = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (HC.UNITGEN_AST_ACTION_VERB_N_DATA_SCHEMA_KOREAN_ONE_OF).has(n[DATA_SCHEMA.Korean]) || hasTag(n, "liquid", "soup", "stew"));
		subjUnit = pickRandom(liquids) || null;
	} else if (verbKo === "식다") {
		const hotItems = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => !hasTag(n, K.MEASUREWORD, K.COUNTER)
				&& !hasTag(n, K.TRANSPORTATION, K.VEHICLE)
				&& parseSemanticData(n).domain !== K.TRANSPORTATION
				&& ((HC.UNITGEN_AST_ACTION_VERB_N_DATA_SCHEMA_KOREAN_ONE_OF_2).has(n[DATA_SCHEMA.Korean]) || hasTag(n, K.FOOD, K.DRINK))
		);
		subjUnit = pickRandom(hotItems) || null;
	} else if (verbKo === "터지다") {
		const inflatables = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (HC.UNITGEN_AST_ACTION_VERB_N_DATA_SCHEMA_KOREAN_ONE_OF_3).has(n[DATA_SCHEMA.Korean]) || hasTag(n, K.OBJECT));
		subjUnit = pickRandom(inflatables) || null;
	} else if (verbKo === "말씀하다") {
		subjUnit = selectSubjectUnit(options, targetId, true);
	} else if (verbKo === "들어있다") {
		subjUnit = null;
	} else {
		subjUnit = isNominativeSubjectVerb ? null : selectSubjectUnit(options, targetId, isHonVerb);
		if (subjUnit && (HC.UNITGEN_AST_ACTION_VERB_VERBKO_ONE_OF_2).has(verbKo) && (HC.UNITGEN_AST_ACTION_VERB_SUBJUNIT_DATA_SCHEMA_KOREA_ONE_OF).has(subjUnit[DATA_SCHEMA.Korean])) {
			const merchantPool = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (HC.UNITGEN_AST_ACTION_VERB_N_DATA_SCHEMA_KOREAN_ONE_OF_4).has(n[DATA_SCHEMA.Korean]));
			if (merchantPool.length > 0) subjUnit = pickRandom(merchantPool);
		}
	}

	if (options.onlyFromSet && !subjUnit && !arg.nounUnit) {
		return {
			ok: false,
			insufficientSet: true,
			missingRoles: ["Noun or Pronoun"],
			message: "Cannot build a complete sentence using only your current set: add at least one Noun or Pronoun to your set."
		};
	}

	if (subjUnit && arg.nounUnit && (HC.UNITGEN_AST_ACTION_VERB_ARG_NOUNUNIT_DATA_SCHEMA_K_ONE_OF).has(arg.nounUnit[DATA_SCHEMA.Korean]) && (HC.UNITGEN_AST_ACTION_VERB_SUBJUNIT_DATA_SCHEMA_KOREA_ONE_OF_2).has(subjUnit[DATA_SCHEMA.Korean])) {
		const femaleOrNeutralSubjs = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (HC.UNITGEN_AST_ACTION_VERB_N_DATA_SCHEMA_KOREAN_ONE_OF_5).has(n[DATA_SCHEMA.Korean]));
		const femalePronoun = getAllUnitsOfPos(K.PRONOUN, options, targetId).find(p => p[DATA_SCHEMA.Korean] === "저");
		const replacement = pickRandom(femaleOrNeutralSubjs) || femalePronoun;
		if (replacement) subjUnit = replacement;
	}

	const constituents = [];
	if (subjUnit && (!arg.nounUnit || subjUnit[DATA_SCHEMA.Id] !== arg.nounUnit[DATA_SCHEMA.Id])) {
		constituents.push({
			role: variationIndex % 2 === 0 ? K.TOPIC : K.SUBJECT,
			nounUnit: subjUnit,
			particleType: variationIndex % 2 === 0 ? K.TOPIC : K.SUBJECT
		});
	}

	if (variationIndex > 0 && verbKo !== "알다") {
		const timeUnit = selectTimeUnit(tense, options, targetId, verbUnit);
		if (timeUnit) {
			const isAdv = timeUnit[DATA_SCHEMA.PartofSpeech] === K.POS_ADVERB;
			constituents.push({
				role: K.TIME,
				unit: timeUnit,
				particleType: isAdv ? null : K.TIME
			});
		}
	}

	if (verbKo === "놓다") {
		const furnitureOrPlace = pickRandom(getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (HC.UNITGEN_AST_ACTION_VERB_N_DATA_SCHEMA_KOREAN_ONE_OF_6).has(n[DATA_SCHEMA.Korean]) || hasTag(n, "furniture", K.PLACE)));
		const smallObj = pickRandom(getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (HC.UNITGEN_AST_ACTION_VERB_N_DATA_SCHEMA_KOREAN_ONE_OF_7).has(n[DATA_SCHEMA.Korean]) || hasTag(n, K.OBJECT)));
		if (furnitureOrPlace && smallObj) {
			constituents.push({
				role: K.LOCATION,
				nounUnit: furnitureOrPlace,
				particleType: "location_static"
			});
			constituents.push({
				role: K.OBJECT,
				nounUnit: smallObj,
				particleType: K.OBJECT
			});
		}
	} else if (verbKo === "담다") {
		const container = pickRandom(getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => n[DATA_SCHEMA.Korean] !== "쓰레기통" && ((HC.UNITGEN_AST_ACTION_VERB_N_DATA_SCHEMA_KOREAN_ONE_OF_8).has(n[DATA_SCHEMA.Korean]) || hasTag(n, "container", "dish"))));
		if (container) {
			constituents.push({
				role: K.LOCATION,
				nounUnit: container,
				particleType: "location_static"
			});
		}
		if (arg.nounUnit) {
			constituents.push({
				role: arg.role,
				nounUnit: arg.nounUnit,
				particleType: arg.particleType
			});
		}
	} else if (verbKo === "넣다") {
		const container = selectPutInContainerNoun(arg.nounUnit, options, targetId);
		if (container) {
			constituents.push({
				role: K.LOCATION,
				nounUnit: container,
				particleType: "location_static"
			});
		}
		if (arg.nounUnit) {
			constituents.push({
				role: arg.role,
				nounUnit: arg.nounUnit,
				particleType: arg.particleType
			});
		}
	} else if (verbKo === "들어있다") {
		const container = pickRandom(getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (HC.UNITGEN_AST_ACTION_VERB_N_DATA_SCHEMA_KOREAN_ONE_OF_9).has(n[DATA_SCHEMA.Korean]) || hasTag(n, "container")));
		const content = pickRandom(getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (HC.UNITGEN_AST_ACTION_VERB_N_DATA_SCHEMA_KOREAN_ONE_OF_10).has(n[DATA_SCHEMA.Korean]) || hasTag(n, K.OBJECT)));
		if (container && content) {
			constituents.push({
				role: K.LOCATION,
				nounUnit: container,
				particleType: "location_static"
			});
			constituents.push({
				role: K.SUBJECT,
				nounUnit: content,
				particleType: K.SUBJECT
			});
		}
	} else if ((HC.UNITGEN_AST_ACTION_VERB_VERBKO_ONE_OF_3).has(verbKo)) {
		const instNoun = pickRandom(getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (HC.UNITGEN_AST_ACTION_VERB_N_DATA_SCHEMA_KOREAN_ONE_OF_11).has(n[DATA_SCHEMA.Korean])));
		if (instNoun) {
			constituents.push({
				role: K.LOCATION,
				nounUnit: instNoun,
				particleType: "location_static"
			});
		}
	} else if (HC.UNITGEN_AST_ACTION_VERB_VERBKO_ONE_OF.includes(verbKo)) {
		const skillNoun = pickRandom(getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (HC.UNITGEN_AST_ACTION_VERB_N_DATA_SCHEMA_KOREAN_ONE_OF_12).has(n[DATA_SCHEMA.Korean])));
		if (skillNoun) {
			constituents.push({
				role: K.OBJECT,
				nounUnit: skillNoun,
				particleType: K.OBJECT
			});
		}
	} else if (arg.nounUnit) {
		constituents.push({
			role: arg.role,
			nounUnit: arg.nounUnit,
			particleType: arg.particleType
		});
		if (verbKo === "가르치다") {
			const subjMatter = pickRandom(getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (HC.UNITGEN_AST_ACTION_VERB_N_DATA_SCHEMA_KOREAN_ONE_OF_13).has(n[DATA_SCHEMA.Korean])));
			if (subjMatter) {
				constituents.push({
					role: K.OBJECT,
					nounUnit: subjMatter,
					particleType: K.OBJECT
				});
			}
		} else if ((HC.UNITGEN_AST_ACTION_VERB_VERBKO_ONE_OF_4).has(verbKo)) {
			const askObj = pickRandom(getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (HC.UNITGEN_AST_ACTION_VERB_N_DATA_SCHEMA_KOREAN_ONE_OF_14).has(n[DATA_SCHEMA.Korean])));
			if (askObj) {
				constituents.push({
					role: K.OBJECT,
					nounUnit: askObj,
					particleType: K.OBJECT
				});
			}
		} else if ((HC.UNITGEN_AST_ACTION_VERB_VERBKO_ONE_OF_5).has(verbKo)) {
			const giveObj = pickRandom(getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (HC.UNITGEN_AST_ACTION_VERB_N_DATA_SCHEMA_KOREAN_ONE_OF_15).has(n[DATA_SCHEMA.Korean])));
			if (giveObj) {
				constituents.push({
					role: K.OBJECT,
					nounUnit: giveObj,
					particleType: K.OBJECT
				});
			}
		}
	}

	if (variationIndex === 2) {
		const advUnit = selectAdverbUnit(false, K.AFFIRMATIVE, { ...options, pluralSubject: isPluralSubjectUnit(subjUnit) }, targetId, verbUnit);
		if (advUnit) {
			constituents.push({
				role: K.ADVERB,
				unit: advUnit,
				particleType: null
			});
		}
	}

	return {
		ok: true,
		ast: {
			type: "Sentence",
			targetUnitId: targetId,
			speechAct: K.DECLARATIVE,
			politeness,
			tense: modality === "desire" ? K.PRESENT : tense,
			polarity: K.AFFIRMATIVE,
			modality,
			honorific: isHonVerb || (subjUnit ? isElderNoun(subjUnit) : false),
			clauses: [{
				constituents,
				predicate: {
					role: K.PREDICATE,
					predType: K.ACTION,
					verbUnit,
					tense: modality === "desire" ? K.PRESENT : tense,
					politeness,
					speechAct: K.DECLARATIVE,
					polarity: K.AFFIRMATIVE,
					modality,
					honorific: isHonVerb || (subjUnit ? isElderNoun(subjUnit) : false)
				}
			}]
		}
	};
}

/**
 * Builds a SentenceAST for a Descriptive Verb unit.
 */
function buildASTForDescriptiveVerb(dvUnit, variationIndex = 0, options = {}) {
	const targetId = dvUnit[DATA_SCHEMA.Id];
	const dvKo = dvUnit[DATA_SCHEMA.Korean] || "";
	const tenses = [K.PRESENT, K.PAST, K.PRESENT];
	let tense = options.tense || tenses[variationIndex % tenses.length];
	if ((HC.UNITGEN_AST_DESCRIPTIVE_VERB_DVKO_ONE_OF).has(dvKo) && !options.tense) tense = K.PAST;
	const politeness = options.politeness || (variationIndex === 2 ? K.FORMAL_HIGH : "polite");

	// Greeting formula 안녕하다 (Unit 5) -> strictly polite formulaic greeting frame
	if (dvKo === "안녕하다" || targetId === 5) {
		const elderNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => isElderNoun(n)
				&& !hasTag(n, "attribute", "honorific_noun", K.CONCEPT)
				&& (!hasTag(n, K.PROFESSION) || (n[DATA_SCHEMA.Korean] || "").endsWith("님"))
				&& !(HC.UNITGEN_AST_DESCRIPTIVE_VERB_N_DATA_SCHEMA_KOREAN_ONE_OF).has(n[DATA_SCHEMA.Korean])
		);
		const addressee = (variationIndex % 2 === 1 && elderNouns.length > 0) ? pickRandom(elderNouns) : null;
		const constituents = [];
		if (addressee) {
			constituents.push({
				role: K.TOPIC,
				nounUnit: addressee,
				particleType: K.TOPIC
			});
		}
		return {
			ok: true,
			ast: {
				type: "Sentence",
				targetUnitId: targetId,
				speechAct: K.INTERROGATIVE,
				politeness: variationIndex === 2 ? K.FORMAL_HIGH : "polite",
				tense: K.PRESENT,
				polarity: K.AFFIRMATIVE,
				clauses: [{
					constituents,
					predicate: {
						role: K.PREDICATE,
						predType: K.DESCRIPTIVE,
						verbUnit: dvUnit,
						tense: K.PRESENT,
						politeness: variationIndex === 2 ? K.FORMAL_HIGH : "polite",
						speechAct: K.INTERROGATIVE,
						polarity: K.AFFIRMATIVE,
						honorific: true
					}
				}]
			}
		};
	}

	// Copula 이다 (Unit 55) -> requires complement noun and animacy-matched subject
	if (dvKo === "이다" || targetId === 55) {
		const allNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => !hasTag(n, K.MEASUREWORD, K.COUNTER, K.POSITION, "name")
				&& !(hasTag(n, "colloquial") && parseSemanticData(n).polarity === -1)
				&& n[DATA_SCHEMA.Korean] !== "이"
		);
		const complementCandidates = allNouns.filter(n => hasTag(n, K.PROFESSION, "job", "status", "role", "nationality", K.OBJECT, K.FOOD, "animal", "fruit"));
		const complementNoun = (complementCandidates.length > 0 ? pickRandom(complementCandidates) : pickRandom(allNouns));
		const isHumanComp = complementNoun && hasTag(complementNoun, K.PERSON, K.PROFESSION, "job", "status", "role", "nationality");

		let subjUnit = null;
		if (isHumanComp) {
			const humanPronouns = getAllUnitsOfPos(K.PRONOUN, options, targetId).filter(p => (HC.UNITGEN_AST_DESCRIPTIVE_VERB_P_DATA_SCHEMA_KOREAN_ONE_OF).has(p[DATA_SCHEMA.Korean]));
			subjUnit = pickRandom(humanPronouns) || selectSubjectUnit(options, targetId, false);
		} else {
			const thingPronouns = getAllUnitsOfPos(K.PRONOUN, options, targetId).filter(p => (HC.UNITGEN_AST_DESCRIPTIVE_VERB_P_DATA_SCHEMA_KOREAN_ONE_OF_2).has(p[DATA_SCHEMA.Korean]));
			subjUnit = pickRandom(thingPronouns);
		}
		if (subjUnit && complementNoun && subjUnit[DATA_SCHEMA.Id] === complementNoun[DATA_SCHEMA.Id]) {
			subjUnit = null;
		}

		const constituents = [];
		if (subjUnit) {
			constituents.push({
				role: K.TOPIC,
				nounUnit: subjUnit,
				particleType: K.TOPIC
			});
		}

		return {
			ok: true,
			ast: {
				type: "Sentence",
				targetUnitId: targetId,
				speechAct: K.DECLARATIVE,
				politeness,
				tense,
				polarity: K.AFFIRMATIVE,
				clauses: [{
					constituents,
					predicate: {
						role: K.PREDICATE,
						predType: K.COPULA,
						verbUnit: dvUnit,
						copulaNounUnit: complementNoun,
						tense,
						politeness,
						speechAct: K.DECLARATIVE,
						polarity: K.AFFIRMATIVE
					}
				}]
			}
		};
	}

	let subjUnit = null;
	if ((HC.UNITGEN_AST_DESCRIPTIVE_VERB_DVKO_ONE_OF_2).has(dvKo)) {
		const allowedPros = (HC.UNITGEN_AST_DESCRIPTIVE_VERB_DVKO_ONE_OF_3).has(dvKo) ? ["저", "저희"] : ["저", "우리", "저희"];
		const speakerPronouns = getAllUnitsOfPos(K.PRONOUN, options, targetId).filter(
			p => allowedPros.includes(p[DATA_SCHEMA.Korean])
		);
		if ((variationIndex % 2 === 0 || (HC.UNITGEN_AST_DESCRIPTIVE_VERB_DVKO_ONE_OF_4).has(dvKo)) && speakerPronouns.length > 0) {
			subjUnit = pickRandom(speakerPronouns);
		}
	} else {
		let subjCandidates = filterBySet(getSubjectCandidatesForDescriptiveVerb(dvUnit), options, targetId);
		if ((HC.UNITGEN_AST_DESCRIPTIVE_VERB_DVKO_ONE_OF_5).has(dvKo)) {
			const firstPersonPronouns = getAllUnitsOfPos(K.PRONOUN, options, targetId).filter(
				p => (HC.UNITGEN_AST_DESCRIPTIVE_VERB_P_DATA_SCHEMA_KOREAN_ONE_OF_3).has(p[DATA_SCHEMA.Korean])
			);
			if (firstPersonPronouns.length > 0) subjCandidates = firstPersonPronouns;
		}
		if (!(HC.UNITGEN_AST_DESCRIPTIVE_VERB_DVKO_ONE_OF_6).has(dvKo) && !hasTag(dvUnit, "teeth")) {
			subjCandidates = subjCandidates.filter(u => u[DATA_SCHEMA.Korean] !== "이");
		}
		const dvSd = parseSemanticData(dvUnit);
		const isStrictDV = Boolean(dvSd && (dvSd.collocation_filter || (dvSd.req && dvSd.req !== "any")));
		if (subjCandidates.length === 0 && options.onlyFromSet && !isStrictDV) {
			subjCandidates = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
				n => !hasTag(n, K.MEASUREWORD) && !hasTag(n, K.COUNTER)
			);
		}
		subjUnit = pickRandom(subjCandidates) || (!isStrictDV ? selectSubjectUnit(options, targetId, false) : null);
	}

	if (options.onlyFromSet && !subjUnit) {
		return {
			ok: false,
			insufficientSet: true,
			missingRoles: ["Noun or Pronoun"],
			message: "Cannot build a complete sentence using only your current set: add at least one Noun or Pronoun to your set."
		};
	}

	const constituents = [];
	if (subjUnit) {
		constituents.push({
			role: variationIndex === 1 ? K.TOPIC : K.SUBJECT,
			nounUnit: subjUnit,
			particleType: variationIndex === 1 ? K.TOPIC : K.SUBJECT
		});
	}

	if (variationIndex > 0 && !(HC.UNITGEN_AST_DESCRIPTIVE_VERB_DVKO_ONE_OF_7).has(dvKo)) {
		const isPluralSubj = isPluralSubjectUnit(subjUnit);
		const degAdv = selectAdverbUnit(true, K.AFFIRMATIVE, { ...options, pluralSubject: isPluralSubj }, targetId, dvUnit);
		if (degAdv && !(subjUnit && isElderNoun(subjUnit) && degAdv[DATA_SCHEMA.Korean] === "완전") && (typeof canAdverbPrecede !== 'function' || canAdverbPrecede(degAdv, dvUnit, { isNegative: false, pluralSubject: isPluralSubj }))) {
			constituents.push({
				role: K.ADVERB,
				unit: degAdv,
				particleType: null
			});
		}
	} else if ((HC.UNITGEN_AST_DESCRIPTIVE_VERB_DVKO_ONE_OF_8).has(dvKo) && variationIndex % 2 === 1) {
		const placeNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => hasTag(n, K.PLACE, K.LOCATION, K.ROOM) && !hasTag(n, K.MEASUREWORD, K.COUNTER, K.POSITION)
		);
		const place = pickRandom(placeNouns);
		if (place) {
			constituents.unshift({
				role: K.LOCATION,
				nounUnit: place,
				particleType: "location_static"
			});
		}
	}

	return {
		ok: true,
		ast: {
			type: "Sentence",
			targetUnitId: targetId,
			speechAct: K.DECLARATIVE,
			politeness,
			tense,
			polarity: K.AFFIRMATIVE,
			clauses: [{
				constituents,
				predicate: {
					role: K.PREDICATE,
					predType: K.DESCRIPTIVE,
					verbUnit: dvUnit,
					tense,
					politeness,
					speechAct: K.DECLARATIVE,
					polarity: K.AFFIRMATIVE
				}
			}]
		}
	};
}

/**
 * Builds a SentenceAST for a Noun or Pronoun unit.
 */
function buildASTForNominal(nominalUnit, variationIndex = 0, options = {}) {
	const targetId = nominalUnit[DATA_SCHEMA.Id];
	const ko = nominalUnit[DATA_SCHEMA.Korean];
	const pos = nominalUnit[DATA_SCHEMA.PartofSpeech];
	const politeness = options.politeness || (variationIndex === 2 ? K.FORMAL_HIGH : "polite");
	const tenses = [K.PRESENT, K.PAST, K.FUTURE];
	let tense = options.tense || tenses[variationIndex % tenses.length];

	// 0.5. Possessive Pronoun (제, 내, or tags: possessive) -> Attributive modifier before head noun
	if (hasTag(nominalUnit, "possessive") || ko === "제" || (ko === "내" && hasTag(nominalUnit, "pronoun_1st", "possessive"))) {
		const allNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => n[DATA_SCHEMA.PartofSpeech] === K.NOUN &&
			!(hasTag(n, "colloquial") && parseSemanticData(n).polarity === -1) &&
			!hasTag(n, K.MEASUREWORD, K.COUNTER, K.TIME, K.POSITION, K.QUESTION_WORD, K.PROPER_NOUN, K.NATURE, K.WEATHER, "station", "symptom", "bodily_process", "language", K.DISEASE, "landmark", "tourism", "transitFacility", "pronoun") &&
			!(HC.UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF).has(n[DATA_SCHEMA.Korean]) &&
			(
				(HC.UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_2).has(n[DATA_SCHEMA.Korean]) ||
				(
					hasTag(n, K.PERSON, K.FAMILY, K.OBJECT, K.CLOTHING, K.WEARABLE, "furniture", K.ROOM, "bag", "stationery", "electronics") &&
					!hasTag(n, K.PLACE, K.FACILITY, "restaurant", "store", "company", "region", K.ABSTRACT, K.CONCEPT, K.ACADEMIC)
				)
			)
		);
		const headNoun = pickRandom(allNouns);
		const isAction = variationIndex % 2 === 1;
		const chosenVerb = isAction
			? (headNoun ? selectActionVerbForNoun(headNoun, { ...options, excludePossessionCalque: true }, targetId) : null)
			: (headNoun ? selectDescriptiveVerbForNoun(headNoun, { ...options, tense }, targetId) : null);
		if (chosenVerb && (HC.UNITGEN_AST_NOMINAL_CHOSENVERB_DATA_SCHEMA_KOR_ONE_OF).has(chosenVerb[DATA_SCHEMA.Korean]) && !options.tense) {
			tense = K.PAST;
		}
		if (headNoun && chosenVerb) {
			const isActionVerb = chosenVerb[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB;
			return {
				ok: true,
				ast: {
					type: "Sentence",
					targetUnitId: targetId,
					speechAct: K.DECLARATIVE,
					politeness,
					tense,
					polarity: K.AFFIRMATIVE,
					clauses: [{
						constituents: [{
							role: isActionVerb ? K.OBJECT : K.SUBJECT,
							determinerUnit: nominalUnit,
							nounUnit: headNoun,
							particleType: isActionVerb ? K.OBJECT : K.SUBJECT
						}],
						predicate: {
							role: K.PREDICATE,
							predType: isActionVerb ? K.ACTION : K.DESCRIPTIVE,
							verbUnit: chosenVerb,
							tense,
							politeness,
							speechAct: K.DECLARATIVE,
							polarity: K.AFFIRMATIVE
						}
					}]
				}
			};
		}
	}

	// 0.6. Adnominal Determiner-Noun (#289 무슨) -> Attributive modifier before head noun
	if (ko === "무슨" || (pos === K.NOUN && hasTag(nominalUnit, K.DETERMINER) && !hasTag(nominalUnit, K.TIME, "time_modifier"))) {
		const isInterrogativeDet = ko === "무슨" || hasTag(nominalUnit, K.QUESTION_WORD, K.INTERROGATIVE);
		const detHeadNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => (HC.UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_3).has(n[DATA_SCHEMA.Korean])
		);
		const headNoun = pickRandom(detHeadNouns);
		const chosenVerb = headNoun ? selectActionVerbForNoun(headNoun, { ...options, excludePossessionCalque: true }, targetId) : null;
		const subjUnit = selectSubjectUnit(options, targetId, false);
		if (headNoun && chosenVerb) {
			const constituents = [];
			if (subjUnit && !(HC.UNITGEN_AST_NOMINAL_SUBJUNIT_DATA_SCHEMA_KOREA_ONE_OF).has(subjUnit[DATA_SCHEMA.Korean])) {
				constituents.push({
					role: K.TOPIC,
					nounUnit: subjUnit,
					particleType: K.TOPIC
				});
			}
			constituents.push({
				role: K.OBJECT,
				determinerUnit: nominalUnit,
				nounUnit: headNoun,
				particleType: K.OBJECT
			});
			return {
				ok: true,
				ast: {
					type: "Sentence",
					targetUnitId: targetId,
					speechAct: isInterrogativeDet ? K.INTERROGATIVE : K.DECLARATIVE,
					politeness,
					tense,
					polarity: K.AFFIRMATIVE,
					clauses: [{
						constituents,
						predicate: {
							role: K.PREDICATE,
							predType: K.ACTION,
							verbUnit: chosenVerb,
							tense,
							politeness,
							speechAct: isInterrogativeDet ? K.INTERROGATIVE : K.DECLARATIVE,
							polarity: K.AFFIRMATIVE
						}
					}]
				}
			};
		}
	}

	// 0.7. Contracted Accusative WH-Pronoun (#355 뭘) & Calendar Question Pronoun (#340 며칠)
	if (ko === "뭘") {
		const nonFirstPersonSubjs = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => (HC.UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_4).has(n[DATA_SCHEMA.Korean])
		);
		const subjUnit = pickRandom(nonFirstPersonSubjs) || selectSubjectUnit(options, targetId, false);
		const whActionVerbs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(
			v => (HC.UNITGEN_AST_NOMINAL_V_DATA_SCHEMA_KOREAN_ONE_OF).has(v[DATA_SCHEMA.Korean])
		);
		const chosenVerb = pickRandom(whActionVerbs);
		if (chosenVerb) {
			const constituents = [];
			if (subjUnit && !(HC.UNITGEN_AST_NOMINAL_SUBJUNIT_DATA_SCHEMA_KOREA_ONE_OF_2).has(subjUnit[DATA_SCHEMA.Korean])) {
				constituents.push({ role: K.TOPIC, nounUnit: subjUnit, particleType: K.TOPIC });
			}
			constituents.push({ role: K.OBJECT, nounUnit: nominalUnit, particleType: null });
			return {
				ok: true,
				ast: {
					type: "Sentence",
					targetUnitId: targetId,
					speechAct: K.INTERROGATIVE,
					politeness,
					tense,
					polarity: K.AFFIRMATIVE,
					clauses: [{
						constituents,
						predicate: {
							role: K.PREDICATE,
							predType: K.ACTION,
							verbUnit: chosenVerb,
							tense,
							politeness,
							speechAct: K.INTERROGATIVE,
							polarity: K.AFFIRMATIVE
						}
					}]
				}
			};
		}
	}
	if (ko === "며칠") {
		const nonFirstPersonSubjs = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => (HC.UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_5).has(n[DATA_SCHEMA.Korean])
		);
		const subjUnit = pickRandom(nonFirstPersonSubjs) || selectSubjectUnit(options, targetId, false);
		const scheduleVerbs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(
			v => (HC.UNITGEN_AST_NOMINAL_V_DATA_SCHEMA_KOREAN_ONE_OF_2).has(v[DATA_SCHEMA.Korean])
		);
		const chosenVerb = pickRandom(scheduleVerbs);
		if (chosenVerb) {
			const constituents = [];
			if (subjUnit && !(HC.UNITGEN_AST_NOMINAL_SUBJUNIT_DATA_SCHEMA_KOREA_ONE_OF_3).has(subjUnit[DATA_SCHEMA.Korean])) {
				constituents.push({ role: K.TOPIC, nounUnit: subjUnit, particleType: K.TOPIC });
			}
			constituents.push({ role: K.TIME, nounUnit: nominalUnit, particleType: K.TIME });
			return {
				ok: true,
				ast: {
					type: "Sentence",
					targetUnitId: targetId,
					speechAct: K.INTERROGATIVE,
					politeness,
					tense,
					polarity: K.AFFIRMATIVE,
					clauses: [{
						constituents,
						predicate: {
							role: K.PREDICATE,
							predType: K.ACTION,
							verbUnit: chosenVerb,
							tense,
							politeness,
							speechAct: K.INTERROGATIVE,
							polarity: K.AFFIRMATIVE
						}
					}]
				}
			};
		}
	}

	// 1. Classifier / Measure Word Noun (e.g. 개, 명, 마리, 잔, 권, 번, 살, 시, 월, 일)
	if (hasTag(nominalUnit, K.MEASUREWORD, K.COUNTER) || state.CLASSIFIER_UNITS.has(ko)) {
		if (HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_8.includes(ko)) {
			const calVals = ko === "월" ? [1, 2, 3, 4, 5, 7, 8, 9, 11, 12] : [1, 2, 3, 5, 7, 10, 15, 20, 25, 30];
			const calVal = calVals[variationIndex % calVals.length];
			const sinoStr = getSinoNumber(calVal);
			const matchedNumUnit = getAllUnitsOfPos(K.NUMBER, options, targetId).find(u => u[DATA_SCHEMA.Korean] === sinoStr) || null;
			const calVerbs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(
				v => (HC.UNITGEN_AST_NOMINAL_V_DATA_SCHEMA_KOREAN_ONE_OF_3).has(v[DATA_SCHEMA.Korean])
			);
			const calVerb = pickRandom(calVerbs) || pickRandom(getAllUnitsOfPos(K.ACTION_VERB, options, targetId));
			const calSubj = selectSubjectUnit(options, targetId, false);
			const calTense = variationIndex % 2 === 0 ? K.PRESENT : K.PAST;
			if (calVerb && calSubj) {
				return {
					ok: true,
					ast: {
						type: "Sentence",
						targetUnitId: targetId,
						speechAct: K.DECLARATIVE,
						politeness,
						tense: calTense,
						polarity: K.AFFIRMATIVE,
						clauses: [{
							constituents: [
								{ role: K.TOPIC, nounUnit: calSubj, particleType: K.TOPIC },
								{
									role: K.TIME,
									numberUnit: matchedNumUnit,
									numberSurfaceKo: sinoStr,
									countValue: calVal,
									counterUnit: nominalUnit,
									particleType: K.TIME
								}
							],
							predicate: {
								role: K.PREDICATE,
								predType: K.ACTION,
								verbUnit: calVerb,
								tense: calTense,
								politeness,
								speechAct: K.DECLARATIVE,
								polarity: K.AFFIRMATIVE
							}
						}]
					}
				};
			}
		}
		if (ko === "번") {
			const freqCount = (variationIndex % 3) + 2;
			const freqNumUnit = getAllUnitsOfPos(K.NUMBER, options, targetId).find(u => u[DATA_SCHEMA.Korean] === getKoreanNumber(freqCount, true)) || null;
			const freqVerbs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(v => (HC.UNITGEN_AST_NOMINAL_V_DATA_SCHEMA_KOREAN_ONE_OF_4).has(v[DATA_SCHEMA.Korean]));
			const freqVerb = pickRandom(freqVerbs) || pickRandom(getAllUnitsOfPos(K.ACTION_VERB, options, targetId));
			const freqObj = freqVerb ? selectArgumentForActionVerb(freqVerb, options, targetId) : { nounUnit: null, role: null, particleType: null };
			const freqSubj = selectSubjectUnit(options, targetId, false);
			if (freqVerb && (freqObj.nounUnit || freqSubj)) {
				const freqConstituents = [];
				if (freqSubj && (!freqObj.nounUnit || freqSubj[DATA_SCHEMA.Id] !== freqObj.nounUnit[DATA_SCHEMA.Id])) {
					freqConstituents.push({ role: K.TOPIC, nounUnit: freqSubj, particleType: K.TOPIC });
				}
				if (freqObj.nounUnit) {
					freqConstituents.push({ role: freqObj.role, nounUnit: freqObj.nounUnit, particleType: freqObj.particleType });
				}
				freqConstituents.push({
					role: "frequency",
					numberUnit: freqNumUnit,
					countValue: freqCount,
					counterUnit: nominalUnit,
					particleType: null,
					explicitSurfaceKo: `${getKoreanNumber(freqCount, true)} 번`
				});
				return {
					ok: true,
					ast: {
						type: "Sentence",
						targetUnitId: targetId,
						speechAct: K.DECLARATIVE,
						politeness,
						tense: variationIndex % 2 === 0 ? K.PAST : K.PRESENT,
						polarity: K.AFFIRMATIVE,
						clauses: [{
							constituents: freqConstituents,
							predicate: {
								role: K.PREDICATE,
								predType: K.ACTION,
								verbUnit: freqVerb,
								tense: variationIndex % 2 === 0 ? K.PAST : K.PRESENT,
								politeness,
								speechAct: K.DECLARATIVE,
								polarity: K.AFFIRMATIVE
							}
						}]
					}
				};
			}
		}
		const numType = getClassifierNumeralType(ko);
		const countVal = (variationIndex % 4) + 1;
		const numStr = numType === "sino" ? getSinoNumber(countVal) : getKoreanNumber(countVal, true);
		const numUnits = getAllUnitsOfPos(K.NUMBER, options, targetId);
		const matchedNumUnit = numUnits.find(u => u[DATA_SCHEMA.Korean] === numStr) || null;

		let compatibleNouns = filterBySet(getMatchingNounsForClassifier(ko), options, targetId);
		if (ko === "쪽") {
			const allN = getAllUnitsOfPos(K.NOUN, options, targetId);
			compatibleNouns = allN.filter(n => (HC.UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_6).has(n[DATA_SCHEMA.Korean]));
		} else if (compatibleNouns.length === 0) {
			const allN = getAllUnitsOfPos(K.NOUN, options, targetId);
			if (ko === "권") {
				compatibleNouns = allN.filter(n => (HC.UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_7).has(n[DATA_SCHEMA.Korean]) || hasTag(n, "book", "publication"));
			} else if (HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_7.includes(ko)) {
				compatibleNouns = allN.filter(n => hasTag(n, K.PERSON, "human", K.FAMILY, K.PROFESSION, "job"));
			} else if (ko === "마리") {
				compatibleNouns = allN.filter(n => hasTag(n, "animal", "pet", "fish", "bird"));
			} else if (HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_6.includes(ko)) {
				compatibleNouns = allN.filter(n => hasTag(n, K.DRINK, "beverage", "liquid") && !hasTag(n, K.MEASUREWORD, K.COUNTER));
			} else if (ko === "대") {
				compatibleNouns = allN.filter(n => hasTag(n, K.VEHICLE, "electronics", "machine", "appliance") && !hasTag(n, "ticket", K.TRAVEL, K.ACTIVITY));
			} else if (ko === "벌") {
				compatibleNouns = allN.filter(n => hasTag(n, K.CLOTHING, "clothes"));
			} else if (ko === "켤레") {
				compatibleNouns = allN.filter(n => hasTag(n, "footwear", "shoes"));
			} else if (HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_5.includes(ko)) {
				compatibleNouns = allN.filter(n => (HC.UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_8).has(n[DATA_SCHEMA.Korean]) || hasTag(n, "child", "junior"));
			} else if (ko === "채") {
				compatibleNouns = allN.filter(n => (HC.UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_9).has(n[DATA_SCHEMA.Korean]) || hasTag(n, "building", "housing"));
			} else if (ko === "호") {
				compatibleNouns = allN.filter(n => (HC.UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_10).has(n[DATA_SCHEMA.Korean]) || hasTag(n, K.ROOM, "office"));
			} else if (ko === "학년") {
				compatibleNouns = allN.filter(n => (HC.UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_11).has(n[DATA_SCHEMA.Korean]) || (hasTag(n, "school") && !hasTag(n, K.PLACE, K.FACILITY, K.ROOM, "hall") && !(HC.UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_12).has(n[DATA_SCHEMA.Korean])));
			} else if (ko === "편") {
				compatibleNouns = allN.filter(n => (HC.UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_13).has(n[DATA_SCHEMA.Korean]) || hasTag(n, "media_work", "film", "literature"));
			} else if (ko === "%") {
				compatibleNouns = allN.filter(n => (HC.UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_14).has(n[DATA_SCHEMA.Korean]) || hasTag(n, "rate_proportion", "discount", K.FINANCE));
			}
			if (compatibleNouns.length === 0) {
				compatibleNouns = allN.filter(
					n => n[DATA_SCHEMA.Id] !== targetId && !hasTag(n, K.MEASUREWORD, K.COUNTER, K.TIME, K.PLACE, K.POSITION)
				);
			}
		}
		const allAvs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId);
		const avs = allAvs.filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (vKo.includes(" ")) return false;
			if (isIntransitiveVerb(v)) return false;
			if (getVerbParticleType(v) !== K.OBJECT) return false;
			return true;
		});
		const dvs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId);
		const existVerb = ko === "쪽"
			? (avs.find(v => v[DATA_SCHEMA.Korean] === "읽다") || avs.find(v => v[DATA_SCHEMA.Korean] === "보다") || pickRandom(avs) || pickRandom(dvs))
			: (dvs.find(v => v[DATA_SCHEMA.Korean] === "있다") || avs.find(v => HC.UNITGEN_AST_NOMINAL_V_DATA_SCHEMA_KOREAN_ONE_OF_10.includes(v[DATA_SCHEMA.Korean])) || pickRandom(avs) || pickRandom(dvs));

		if (options.onlyFromSet && (compatibleNouns.length === 0 || !existVerb)) {
			const missing = [];
			if (compatibleNouns.length === 0) missing.push("Countable Noun");
			if (!existVerb) missing.push("Action or Descriptive Verb");
			return {
				ok: false,
				insufficientSet: true,
				missingRoles: missing,
				message: `Cannot build a counting sentence using only your current set (missing: ${missing.join(", ")}).`
			};
		}

		const itemNoun = pickRandom(compatibleNouns);
		let chosenCountVerb = existVerb;
		if (!options.onlyFromSet && itemNoun && (compatibleNouns.length <= 3 || variationIndex % 2 === 1)) {
			const itemAv = selectActionVerbForNoun(itemNoun, { ...options, excludePossessionCalque: false }, targetId);
			if (variationIndex % 2 === 1 && itemAv) {
				chosenCountVerb = itemAv;
			}
		}
		const isAction = chosenCountVerb && chosenCountVerb[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB;
		const countTense = (isAction && variationIndex % 3 === 1) ? K.PAST : K.PRESENT;
		const countConstituents = [];
		if (isAction) {
			const countSubj = selectSubjectUnit(options, targetId, false);
			if (countSubj && (!itemNoun || countSubj[DATA_SCHEMA.Id] !== itemNoun[DATA_SCHEMA.Id])) {
				countConstituents.push({
					role: K.TOPIC,
					nounUnit: countSubj,
					particleType: K.TOPIC
				});
			}
		} else if (!options.onlyFromSet && compatibleNouns.length <= 3 && variationIndex >= 4) {
			const locPlaces = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
				n => (HC.UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_15).has(n[DATA_SCHEMA.Korean])
			);
			const locPlace = locPlaces[variationIndex % locPlaces.length];
			if (locPlace) {
				countConstituents.push({
					role: K.LOCATION,
					nounUnit: locPlace,
					particleType: "location_static"
				});
			}
		}
		countConstituents.push({
			role: isAction ? K.OBJECT : K.SUBJECT,
			nounUnit: itemNoun,
			numberUnit: matchedNumUnit,
			numberSurfaceKo: numStr,
			countValue: countVal,
			counterUnit: nominalUnit,
			particleType: isAction ? K.OBJECT : K.SUBJECT
		});
		return {
			ok: true,
			ast: {
				type: "Sentence",
				targetUnitId: targetId,
				speechAct: K.DECLARATIVE,
				politeness,
				tense: countTense,
				polarity: K.AFFIRMATIVE,
				honorific: false,
				clauses: [{
					honorific: false,
					constituents: countConstituents,
					predicate: {
						role: K.PREDICATE,
						predType: isAction ? K.ACTION : K.DESCRIPTIVE,
						verbUnit: chosenCountVerb,
						tense: countTense,
						politeness,
						speechAct: K.DECLARATIVE,
						polarity: K.AFFIRMATIVE,
						honorific: false
					}
				}]
			}
		};
	}

	// 1.4. Quantity Noun 반 ("half")
	if (ko === "반" && hasTag(nominalUnit, "time_amount", "quantity")) {
		const subjUnit = selectSubjectUnit(options, targetId, false);
		const portionPool = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (HC.UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_16).has(n[DATA_SCHEMA.Korean]));
		const portionObj = pickRandom(portionPool);
		const verbChoices = portionObj && (HC.UNITGEN_AST_NOMINAL_PORTIONOBJ_DATA_SCHEMA_KOR_ONE_OF).has(portionObj[DATA_SCHEMA.Korean])
			? (portionObj[DATA_SCHEMA.Korean] === "책" ? ["읽다", "보다"] : ["끝내다", "하다"])
			: (portionObj && (HC.UNITGEN_AST_NOMINAL_PORTIONOBJ_DATA_SCHEMA_KOR_ONE_OF_2).has(portionObj[DATA_SCHEMA.Korean]) ? ["마시다", "남기다"] : ["먹다", "사다", "남기다"]);
		const actionVerb = pickRandom(getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(v => verbChoices.includes(v[DATA_SCHEMA.Korean]))) || selectActionVerbForNoun(portionObj || nominalUnit, options, targetId);
		if (subjUnit && portionObj && actionVerb && !options.onlyFromSet) {
			return {
				ok: true,
				ast: {
					type: "Sentence",
					targetUnitId: targetId,
					speechAct: K.DECLARATIVE,
					politeness,
					tense,
					polarity: K.AFFIRMATIVE,
					clauses: [{
						constituents: [
							{ role: K.TOPIC, nounUnit: subjUnit, particleType: K.TOPIC },
							{ role: "modifier", nounUnit: portionObj, particleType: null },
							{ role: K.OBJECT, nounUnit: nominalUnit, particleType: K.OBJECT }
						],
						predicate: {
							role: K.PREDICATE,
							predType: K.ACTION,
							verbUnit: actionVerb,
							tense,
							politeness,
							speechAct: K.DECLARATIVE,
							polarity: K.AFFIRMATIVE
						}
					}]
				}
			};
		}
	}

	// 1.5. Bound Noun 데 (Unit 2025)
	if (ko === "데" || (hasTag(nominalUnit, K.BOUND_NOUN) && ko === "데")) {
		const actionVerbs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(v => (HC.UNITGEN_AST_NOMINAL_V_DATA_SCHEMA_KOREAN_ONE_OF_5).has(v[DATA_SCHEMA.Korean]));
		const descriptiveVerbs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId).filter(v => (HC.UNITGEN_AST_NOMINAL_V_DATA_SCHEMA_KOREAN_ONE_OF_6).has(v[DATA_SCHEMA.Korean]));
		const modVerb = (variationIndex % 2 === 0 ? pickRandom(descriptiveVerbs) : pickRandom(actionVerbs)) || pickRandom(descriptiveVerbs);
		const modStem = modVerb ? getConjugatedStem(modVerb[DATA_SCHEMA.Korean], modVerb[DATA_SCHEMA.Conjugation]) : "좋";
		const modEnding = (modVerb && modVerb[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB) ? "는" : "으/ㄴ";
		const modKo = resolvePureMorphology(modStem + modEnding, state);
		const subjUnit = selectSubjectUnit(options, targetId, false);
		const mainVerb = pickRandom(getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(v => (HC.UNITGEN_AST_NOMINAL_V_DATA_SCHEMA_KOREAN_ONE_OF_7).has(v[DATA_SCHEMA.Korean]))) || pickRandom(getAllUnitsOfPos(K.ACTION_VERB, options, targetId));
		const mainVerbKo = mainVerb ? mainVerb[DATA_SCHEMA.Korean] : "";
		const isMotion = (HC.UNITGEN_AST_NOMINAL_MAINVERBKO_ONE_OF).has(mainVerbKo);
		const deRole = isMotion ? K.LOCATION : K.OBJECT;
		const deParticle = isMotion ? "location_static" : K.OBJECT;

		return {
			ok: true,
			ast: {
				type: "Sentence",
				targetUnitId: targetId,
				speechAct: K.DECLARATIVE,
				politeness,
				tense,
				polarity: K.AFFIRMATIVE,
				clauses: [{
					constituents: [
						{
							role: K.SUBJECT,
							nounUnit: subjUnit,
							particleType: K.SUBJECT
						},
						{
							role: deRole,
							nounUnit: nominalUnit,
							modifierSurfaceKo: resolvePureMorphology(modKo, state),
							particleType: deParticle
						}
					],
					predicate: {
						role: K.PREDICATE,
						predType: K.ACTION,
						verbUnit: mainVerb,
						tense,
						politeness,
						speechAct: K.DECLARATIVE,
						polarity: K.AFFIRMATIVE
					}
				}]
			}
		};
	}

	// 1.6. Sino-Korean -적 Bound Modifier Root (인간적, 감각적...)
	if (hasTag(nominalUnit, "modifier_root") || (ko.endsWith("적") && hasTag(nominalUnit, K.CONCEPT, "personality", "trait"))) {
		const allNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => !hasTag(n, K.MEASUREWORD, K.COUNTER, K.POSITION) && n[DATA_SCHEMA.Korean] !== "이" && n[DATA_SCHEMA.Id] !== targetId
		);
		const headNounCandidates = allNouns.filter(n => hasTag(n, K.PERSON, "personality", K.ABSTRACT, "art", "culture", "design", K.GENERAL));
		const headNoun = headNounCandidates.length > 0 ? pickRandom(headNounCandidates) : pickRandom(allNouns);
		const subjUnit = selectSubjectUnit(options, targetId, false);

		if (variationIndex % 2 === 0) {
			const adnominalKo = `${ko}인`;
			return {
				ok: true,
				ast: {
					type: "Sentence",
					targetUnitId: targetId,
					speechAct: K.DECLARATIVE,
					politeness,
					tense,
					polarity: K.AFFIRMATIVE,
					clauses: [{
						constituents: [
							{
								role: K.SUBJECT,
								nounUnit: subjUnit,
								particleType: K.SUBJECT
							},
							{
								role: K.OBJECT,
								nounUnit: headNoun,
								modifierSurfaceKo: adnominalKo,
								particleType: K.OBJECT
							}
						],
						predicate: {
							role: K.PREDICATE,
							predType: K.ACTION,
							verbUnit: pickRandom(getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(v => (HC.UNITGEN_AST_NOMINAL_V_DATA_SCHEMA_KOREAN_ONE_OF_8).has(v[DATA_SCHEMA.Korean]))) || selectActionVerbForNoun(headNoun, options, targetId),
							tense,
							politeness,
							speechAct: K.DECLARATIVE,
							polarity: K.AFFIRMATIVE
						}
					}]
				}
			};
		} else {
			return {
				ok: true,
				ast: {
					type: "Sentence",
					targetUnitId: targetId,
					speechAct: K.DECLARATIVE,
					politeness,
					tense,
					polarity: K.AFFIRMATIVE,
					clauses: [{
						constituents: [{
							role: K.TOPIC,
							nounUnit: subjUnit || headNoun,
							particleType: K.TOPIC
						}],
						predicate: {
							role: K.PREDICATE,
							predType: K.COPULA,
							verbUnit: getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId).find(v => v[DATA_SCHEMA.Korean] === "이다") || null,
							copulaNounUnit: nominalUnit,
							tense,
							politeness,
							speechAct: K.DECLARATIVE,
							polarity: K.AFFIRMATIVE
						}
					}]
				}
			};
		}
	}

	// 2. Spatial Position Noun (위, 아래, 앞, 뒤, 옆, 안, 밖, 사이)
	if (hasTag(nominalUnit, K.POSITION) || state.SPATIAL_POSITIONS.has(ko)) {
		const isInside = ko === "안";
		const isOutside = ko === "밖";
		const isBelow = ko === "아래";
		const isAbove = ko === "위";
		const groundNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => n[DATA_SCHEMA.Id] !== targetId &&
			(isBelow
				? (HC.UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_17).has(n[DATA_SCHEMA.Korean])
				: (isOutside
					? (HC.UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_18).has(n[DATA_SCHEMA.Korean])
					: (isAbove
						? (HC.UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_19).has(n[DATA_SCHEMA.Korean])
						: (hasTag(n, "furniture", K.ROOM, "building", "housing", "container") || (HC.UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_20).has(n[DATA_SCHEMA.Korean]))))) &&
			!hasTag(n, K.MEASUREWORD, K.COUNTER, K.POSITION, "language", K.ABSTRACT, "traffic", "city", K.COUNTRY, "region", "deictic", K.DEMONSTRATIVE, "landmark", K.NATURE) &&
			!(HC.UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_21).has(n[DATA_SCHEMA.Korean])
		);
		const allSubjNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
			n => n[DATA_SCHEMA.Id] !== targetId &&
			!hasTag(n, K.MEASUREWORD, K.COUNTER, K.POSITION, K.TIME, K.ABSTRACT, "attribute", "metric", K.EMOTION, "psychological_state", "bodily_process", K.CONCEPT, "language", "fee", "expense", "currency_resource", K.DIRECTION, "deictic", K.DEMONSTRATIVE, "number", "bodyPart", "body", "sport", K.ACTIVITY, "entertainment", "digital_media", "computing", "food_ingredient", K.QUESTION_WORD, K.INTERROGATIVE, "honorific_noun") &&
			!(isBelow && hasTag(n, K.PERSON, K.FAMILY)) &&
			!(HC.UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_22).has(n[DATA_SCHEMA.Korean])
		);
		const dvs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId);
		const allAvs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId);
		const avs = allAvs.filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (vKo.includes(" ")) return false;
			if (isIntransitiveVerb(v)) return false;
			if (getVerbParticleType(v) !== K.OBJECT) return false;
			return true;
		});
		const existVerb = dvs.find(v => v[DATA_SCHEMA.Korean] === "있다") || avs.find(v => hasTag(v, "existence", K.LOCATIVE_STATIC)) || pickRandom(dvs) || pickRandom(avs);

		if (options.onlyFromSet && (groundNouns.length === 0 || !existVerb)) {
			const missing = [];
			if (groundNouns.length === 0) missing.push("Place/Object Noun");
			if (!existVerb) missing.push("Verb");
			return {
				ok: false,
				insufficientSet: true,
				missingRoles: missing,
				message: `Cannot build a spatial sentence using only your current set (missing: ${missing.join(", ")}).`
			};
		}

		const ground = pickRandom(groundNouns);
		const groundKo = ground ? (ground[DATA_SCHEMA.Korean] || "") : "";
		const isIndoorRoom = Boolean(ground && (hasTag(ground, K.ROOM) || (HC.UNITGEN_AST_NOMINAL_GROUNDKO_ONE_OF).has(groundKo)));
		const isBuildingOrOutdoorGround = Boolean(ground && !isIndoorRoom && (hasTag(ground, K.PLACE, K.FACILITY, "building") || (HC.UNITGEN_AST_NOMINAL_GROUNDKO_ONE_OF_2).has(groundKo)));
		const isVehicleCar = n => (n[DATA_SCHEMA.Korean] !== "차" || hasTag(n, K.VEHICLE, K.TRANSPORTATION)) && !hasTag(n, K.DRINK, "tea", K.FOOD);
		const scaleFilteredSubjs = allSubjNouns.filter(n => {
			if (ground && n[DATA_SCHEMA.Id] === ground[DATA_SCHEMA.Id]) return false;
			if (!isVehicleCar(n)) return false;
			const nKo = n[DATA_SCHEMA.Korean] || "";
			if (isOutside) {
				return (hasTag(n, K.PERSON, K.FAMILY, "animal") && !hasTag(n, K.ELDER_NOUN, K.HONORIFIC)) || (HC.UNITGEN_AST_NOMINAL_NKO_ONE_OF).has(nKo);
			}
			if (isInside) {
				if (isIndoorRoom || isBuildingOrOutdoorGround) {
					return (hasTag(n, K.PERSON, K.FAMILY) && !hasTag(n, K.ELDER_NOUN, K.HONORIFIC)) || (HC.UNITGEN_AST_NOMINAL_NKO_ONE_OF_2).has(nKo);
				}
				return !hasTag(n, K.PLACE, K.FACILITY, "building", "housing", "city", K.COUNTRY, K.VEHICLE, K.TRANSPORTATION, "furniture", "appliance", "amusement") && !(HC.UNITGEN_AST_NOMINAL_NKO_ONE_OF_3).has(nKo) && (hasTag(n, K.OBJECT, "stationery", "book", "tool") || (HC.UNITGEN_AST_NOMINAL_NKO_ONE_OF_4).has(nKo));
			}
			if (isIndoorRoom) {
				// Behind/beside an indoor room: furniture, people, or adjacent rooms (never external buildings like 서점/백화점 or 나라!)
				return (hasTag(n, K.PERSON, K.FAMILY) && !hasTag(n, K.ELDER_NOUN, K.HONORIFIC)) || (HC.UNITGEN_AST_NOMINAL_NKO_ONE_OF_5).has(nKo);
			}
			if (isBuildingOrOutdoorGround) {
				// Outside/beside/behind/in-front-of a building requires person, tree, vehicle, or nearby external place/facility (never country/room/region/amusement!)
				return !hasTag(n, "amusement", "landmark", "district", "region", K.COUNTRY, K.ROOM) && !(HC.UNITGEN_AST_NOMINAL_NKO_ONE_OF_6).has(nKo) && ((hasTag(n, K.PERSON, K.FAMILY, K.VEHICLE, K.FACILITY, K.PLACE, "animal") && !hasTag(n, K.ELDER_NOUN, K.HONORIFIC)) || (HC.UNITGEN_AST_NOMINAL_NKO_ONE_OF_7).has(nKo));
			}
			// On/under/beside furniture or small objects: small physical objects, pets, or stationery (not vehicles, cities, appliances, furniture, or districts!)
			return !hasTag(n, K.PLACE, K.FACILITY, "building", "housing", "city", K.COUNTRY, K.VEHICLE, K.TRANSPORTATION, "amusement", "furniture", "appliance", "electronics", "machine", "landmark", "district", "region") && !(HC.UNITGEN_AST_NOMINAL_NKO_ONE_OF_8).has(nKo) && (hasTag(n, "stationery", "book", "tool", "device", "fruit") || (HC.UNITGEN_AST_NOMINAL_NKO_ONE_OF_9).has(nKo));
		});
		const figure = pickRandom(scaleFilteredSubjs.length > 0 ? scaleFilteredSubjs : allSubjNouns.filter(n => !ground || n[DATA_SCHEMA.Id] !== ground[DATA_SCHEMA.Id])) || ground;
		const constituents = [
			{
				role: K.LOCATION,
				nounUnit: ground,
				positionUnit: nominalUnit,
				particleType: "location_static"
			}
		];
		if (figure && (!ground || figure[DATA_SCHEMA.Id] !== ground[DATA_SCHEMA.Id])) {
			constituents.push({
				role: K.SUBJECT,
				nounUnit: figure,
				particleType: K.SUBJECT
			});
		}
		return {
			ok: true,
			ast: {
				type: "Sentence",
				targetUnitId: targetId,
				speechAct: K.DECLARATIVE,
				politeness,
				tense: K.PRESENT,
				polarity: K.AFFIRMATIVE,
				clauses: [{
					constituents,
					predicate: {
						role: K.PREDICATE,
						predType: existVerb[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB ? K.ACTION : K.DESCRIPTIVE,
						verbUnit: existVerb,
						tense: K.PRESENT,
						politeness,
						speechAct: K.DECLARATIVE,
						polarity: K.AFFIRMATIVE
					}
				}]
			}
		};
	}

	// 3. Time Noun (오늘, 어제, 내일, 아침, 주말, 지금...)
	if (hasTag(nominalUnit, K.TIME, "temporal")) {
		const isTimeModifier = ko === "지난" || hasTag(nominalUnit, "time_modifier", "determiner");
		if (isTimeModifier) tense = K.PAST;
		const pol = getTemporalPolarity(nominalUnit);
		if (pol) tense = pol;
		const EXCLUDED_TIME_AVS = HC.UNITGEN_AST_NOMINAL_EXCLUDED_TIME_AVS;
		const PREFERRED_TIME_AVS = HC.UNITGEN_AST_NOMINAL_PREFERRED_TIME_AVS;
		const allAvs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId);
		const filteredAvs = allAvs.filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (vKo.includes(" ")) return false;
			if (EXCLUDED_TIME_AVS.has(vKo)) return false;
			if (hasTag(v, "involuntary", "passive", K.WEATHER)) return false;
			if (isIntransitiveVerb(v)) return false;
			if (getVerbParticleType(v) !== K.OBJECT) return false;
			return true;
		});
		const prefTimeAvs = filteredAvs.filter(v => PREFERRED_TIME_AVS.has(v[DATA_SCHEMA.Korean]));
		const avs = prefTimeAvs.length > 0 ? prefTimeAvs : filteredAvs;
		const isMealTimeWord = (HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_9).has(ko);
		const TRANSIENT_TIME_DVS = HC.UNITGEN_AST_NOMINAL_TRANSIENT_TIME_DVS;
		const dvs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId).filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (vKo.includes(" ")) return false;
			if (!TRANSIENT_TIME_DVS.has(vKo)) return false;
			if (isMealTimeWord && (hasTag(v, K.WEATHER, "descriptive_weather") || (HC.UNITGEN_AST_NOMINAL_VKO_ONE_OF_2).has(vKo))) return false;
			if (hasTag(v, K.QUESTION_WORD, K.INTERROGATIVE, K.HONORIFIC) || state.HONORIFIC_WORDS.has(vKo)) return false;
			const sc = filterBySet(getSubjectCandidatesForDescriptiveVerb(v), options, targetId).filter(n => n[DATA_SCHEMA.Id] !== targetId && n[DATA_SCHEMA.Id] !== 361);
			if (sc.length === 0) return false;
			return true;
		});
		const verbUnit = (variationIndex % 2 === 0 && avs.length > 0) ? pickRandom(avs) : (pickRandom(dvs) || pickRandom(avs));
		const timeSpeechAct = (ko === "언제" || hasTag(nominalUnit, K.QUESTION_WORD, K.INTERROGATIVE) || (verbUnit && hasTag(verbUnit, K.QUESTION_WORD, K.INTERROGATIVE))) ? K.INTERROGATIVE : K.DECLARATIVE;

		if (options.onlyFromSet && !verbUnit) {
			return {
				ok: false,
				insufficientSet: true,
				missingRoles: ["Action Verb or Descriptive Verb"],
				message: "Cannot build a sentence using only your current set: add at least one Action Verb or Descriptive Verb."
			};
		}

		let timeNounForSlot = nominalUnit;
		let determinerForSlot = null;
		if (isTimeModifier) {
			const timeNounCandidates = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n =>
				(HC.UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_23).has(n[DATA_SCHEMA.Korean])
			);
			if (timeNounCandidates.length > 0) {
				timeNounForSlot = pickRandom(timeNounCandidates);
				determinerForSlot = nominalUnit;
			}
		}

		const constituents = [{
			role: K.TIME,
			nounUnit: timeNounForSlot,
			determinerUnit: determinerForSlot,
			particleType: K.TIME
		}];

		if (verbUnit[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB) {
			const arg = selectArgumentForActionVerb(verbUnit, options, targetId);
			if (arg.role !== K.SUBJECT) {
				const subj = selectSubjectUnit(options, targetId, false);
				if (subj && subj[DATA_SCHEMA.Id] !== targetId) {
					constituents.unshift({
						role: K.TOPIC,
						nounUnit: subj,
						particleType: K.TOPIC
					});
				}
			}
			if (arg.nounUnit && arg.nounUnit[DATA_SCHEMA.Id] !== targetId) {
				constituents.push({
					role: arg.role,
					nounUnit: arg.nounUnit,
					particleType: arg.particleType
				});
			}
		} else {
			const subjCandidates = filterBySet(getSubjectCandidatesForDescriptiveVerb(verbUnit), options, targetId)
				.filter(n => n[DATA_SCHEMA.Id] !== targetId && n[DATA_SCHEMA.Id] !== 361);
			const subj = pickRandom(subjCandidates);
			if (subj) {
				constituents.push({
					role: K.SUBJECT,
					nounUnit: subj,
					particleType: K.SUBJECT
				});
			}
		}

		return {
			ok: true,
			ast: {
				type: "Sentence",
				targetUnitId: targetId,
				speechAct: timeSpeechAct,
				politeness,
				tense,
				polarity: K.AFFIRMATIVE,
				clauses: [{
					constituents,
					predicate: {
						role: K.PREDICATE,
						predType: verbUnit[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB ? K.ACTION : K.DESCRIPTIVE,
						verbUnit,
						tense,
						politeness,
						speechAct: timeSpeechAct,
						polarity: K.AFFIRMATIVE
					}
				}]
			}
		};
	}

	// 4. Place / Location Noun (학교, 도서관, 집, 한국, 식당, 여기, 거기, 어디, 이곳, 저곳...)
	if (hasTag(nominalUnit, K.PLACE, K.LOCATION, "institution", K.FACILITY) || (HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_10).has(ko)) {
		if (ko === "나라" && !hasTag(nominalUnit, K.PROPER_NOUN)) {
			const dvs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId);
			const naturalCountryDVs = dvs.filter(v => (HC.UNITGEN_AST_NOMINAL_V_DATA_SCHEMA_KOREAN_ONE_OF_9).has(v[DATA_SCHEMA.Korean]));
			const countryDv = pickRandom(naturalCountryDVs);
			if (countryDv) {
				return {
					ok: true,
					ast: {
						type: "Sentence",
						targetUnitId: targetId,
						speechAct: K.DECLARATIVE,
						politeness,
						tense,
						polarity: K.AFFIRMATIVE,
						clauses: [{
							constituents: [{
								role: variationIndex === 1 ? K.TOPIC : K.SUBJECT,
								nounUnit: nominalUnit,
								particleType: variationIndex === 1 ? K.TOPIC : K.SUBJECT
							}],
							predicate: {
								role: K.PREDICATE,
								predType: K.DESCRIPTIVE,
								verbUnit: countryDv,
								tense,
								politeness,
								speechAct: K.DECLARATIVE,
								polarity: K.AFFIRMATIVE
							}
						}]
					}
				};
			}
		}
		const isInterrogative = ko === "어디";
		const nonKitchenPlace = (HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_11).has(ko);
		const nonDomesticPlace = nonKitchenPlace || (HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_12).has(ko);
		const isResidentialPlace = (HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_13).has(ko) || hasTag(nominalUnit, "housing", "residence", "city", K.COUNTRY);
		const isWorkplace = (HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_14).has(ko);
		const isAcademicInst = (HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_15).has(ko);
		const isCommuteDest = (HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_16).has(ko);
		const isTransitStop = (HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_17).has(ko);
		const isDiningVenue = (HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_18).has(ko);
		const isRetailStore = (HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_19).has(ko);
		const isStudyVenue = (HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_20).has(ko);
		const isParkingVenue = (HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_21).has(ko);
		const isPostalVenue = ko === "우체국";
		const isDeicticPlace = (HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_22).has(ko);
		const isOutdoorNature = hasTag(nominalUnit, K.NATURE) || (HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_23).has(ko);
		const allAvs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (vKo.includes(" ")) return false;
			if (hasTag(v, "involuntary", "passive", K.WEATHER) || state.HONORIFIC_WORDS.has(vKo) || (HC.UNITGEN_AST_NOMINAL_VKO_ONE_OF_3).has(vKo) && !(HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_24).has(ko)) return false;
			if (vKo === "출국하다" && !(HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_25).has(ko)) return false;
			if (vKo === "등산하다" && !(HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_26).has(ko)) return false;
			if (vKo === "지각하다" && !(HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_27).has(ko)) return false;
			if (vKo === "민박하다" && !(HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_28).has(ko)) return false;
			if (vKo === "수영하다" && !(HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_29).has(ko)) return false;
			if (vKo === "낚시하다" && !(HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_30).has(ko)) return false;
			if ((HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_4.includes(ko)) && (HC.UNITGEN_AST_NOMINAL_VKO_ONE_OF_4).has(vKo)) return false;
			const venueAllowed = parseSemanticData(nominalUnit).venue_allowed_verbs;
			if (Array.isArray(venueAllowed) && !(new Set(venueAllowed)).has(vKo)) return false;
			if (state.HUMBLE_WORDS.has(vKo) || (state.HUMBLE_DATIVE_VERBS && state.HUMBLE_DATIVE_VERBS.has(vKo)) || vKo.includes("드리")) return false;
			if (!isResidentialPlace && (HC.UNITGEN_AST_NOMINAL_VKO_ONE_OF.includes(vKo))) return false;
			if (!(HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_31).has(ko) && (HC.UNITGEN_AST_NOMINAL_VKO_ONE_OF_5).has(vKo)) return false;
			if (!isWorkplace && (HC.UNITGEN_AST_NOMINAL_VKO_ONE_OF_6).has(vKo)) return false;
			if (!isAcademicInst && (HC.UNITGEN_AST_NOMINAL_VKO_ONE_OF_7).has(vKo)) return false;
			if (!isCommuteDest && vKo === "다니다") return false;
			if (!isTransitStop && (HC.UNITGEN_AST_NOMINAL_VKO_ONE_OF_8).has(vKo)) return false;
			if (!isDiningVenue && (HC.UNITGEN_AST_NOMINAL_VKO_ONE_OF_9).has(vKo)) return false;
			if (!isRetailStore && (HC.UNITGEN_AST_NOMINAL_VKO_ONE_OF_10).has(vKo)) return false;
			if (!isStudyVenue && (HC.UNITGEN_AST_NOMINAL_VKO_ONE_OF_11).has(vKo)) return false;
			if ((HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_32).has(ko) && (HC.UNITGEN_AST_NOMINAL_VKO_ONE_OF_12).has(vKo)) return false;
			if (!isParkingVenue && vKo === "주차하다") return false;
			if (!isPostalVenue && vKo === "부치다") return false;
			if (vKo === "세배하다" && !(HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_33).has(ko)) return false;
			if ((nonDomesticPlace || isDeicticPlace || isOutdoorNature) && (HC.UNITGEN_AST_NOMINAL_VKO_ONE_OF_13).has(vKo) && ko !== "찜질방") return false;
			if ((nonKitchenPlace || isDeicticPlace || isOutdoorNature) && (hasTag(v, "cooking") || (HC.UNITGEN_AST_NOMINAL_VKO_ONE_OF_14).has(vKo))) return false;
			if ((isOutdoorNature || (HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_34).has(ko)) && (HC.UNITGEN_AST_NOMINAL_VKO_ONE_OF_15).has(vKo)) return false;
			if ((HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_3.includes(ko)) && (HC.UNITGEN_AST_NOMINAL_VKO_ONE_OF_16).has(vKo)) return false;
			const isMotionOrStat = hasTag(v, K.INTRANSITIVE_MOTION, K.INTRANSITIVE_PLACE, K.LOCATIVE_GOAL, K.LOCATIVE_ORIGIN, "existence") || (HC.UNITGEN_AST_NOMINAL_VKO_ONE_OF_17).has(vKo);
			if (!isMotionOrStat && !isIntransitiveVerb(v)) {
				if (getVerbParticleType(v) === K.DATIVE) return false;
				const argPreview = selectArgumentForActionVerb(v, options, targetId);
				if (!argPreview || !argPreview.nounUnit || argPreview.role !== K.OBJECT) return false;
			}
			return true;
		});
		const agentiveAvs = allAvs.filter(v => {
			const rawFrame = v[DATA_SCHEMA.SyntaxFrame];
			return getVerbParticleType(v) !== K.SUBJECT && !/이\/가/.test(typeof rawFrame === 'string' ? rawFrame : "");
		});
		const avs = agentiveAvs.length > 0 ? agentiveAvs : allAvs;
		const matchedPlaceDv = selectDescriptiveVerbForNoun(nominalUnit, { ...options, tense }, targetId);
		const dvs = matchedPlaceDv ? [matchedPlaceDv] : [];
		const verbUnit = pickRandom(avs) || pickRandom(dvs);

		if (options.onlyFromSet && !verbUnit) {
			return {
				ok: false,
				insufficientSet: true,
				missingRoles: ["Action Verb or Descriptive Verb"],
				message: "Cannot build a sentence using only your current set: add at least one Action Verb or Descriptive Verb."
			};
		}

		const verbKoPlace = verbUnit ? (verbUnit[DATA_SCHEMA.Korean] || "") : "";
		const isDynamicMotionOrOrigin = (HC.UNITGEN_AST_NOMINAL_VERBKOPLACE_ONE_OF).has(verbKoPlace) || hasTag(verbUnit, K.LOCATIVE_ORIGIN);
		const isMotionOrStatic = verbUnit && (
			verbUnit[DATA_SCHEMA.PartofSpeech] === K.DESCRIPTIVE_VERB ||
			hasTag(verbUnit, K.INTRANSITIVE_MOTION, K.INTRANSITIVE_PLACE, K.LOCATIVE_GOAL, K.LOCATIVE_ORIGIN, "existence") ||
			(HC.UNITGEN_AST_NOMINAL_VERBKOPLACE_ONE_OF_2).has(verbKoPlace)
		);

		const constituents = [];
		const arg = (verbUnit && verbUnit[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB)
			? selectArgumentForActionVerb(verbUnit, options, targetId)
			: { nounUnit: null, role: null, particleType: null };

		if (arg.role !== K.SUBJECT) {
			let subj = selectSubjectUnit(options, targetId, false);
			if (subj && arg.nounUnit && (HC.UNITGEN_AST_NOMINAL_ARG_NOUNUNIT_DATA_SCHEMA_K_ONE_OF).has(arg.nounUnit[DATA_SCHEMA.Korean]) && (HC.UNITGEN_AST_NOMINAL_SUBJ_DATA_SCHEMA_KOREAN_ONE_OF).has(subj[DATA_SCHEMA.Korean])) {
				const fSubjs = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (HC.UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_24).has(n[DATA_SCHEMA.Korean]));
				if (fSubjs.length > 0) subj = pickRandom(fSubjs);
			}
			if (subj && subj[DATA_SCHEMA.Id] !== targetId) {
				constituents.push({
					role: K.TOPIC,
					nounUnit: subj,
					particleType: K.TOPIC
				});
			}
		}

		const isKyesida = verbUnit && (HC.UNITGEN_AST_NOMINAL_VERBUNIT_DATA_SCHEMA_KOREA_ONE_OF_3.includes(verbUnit[DATA_SCHEMA.Korean]));
		constituents.push({
			role: K.LOCATION,
			nounUnit: nominalUnit,
			particleType: (!isDynamicMotionOrOrigin && (isMotionOrStatic || isKyesida)) ? "location_static" : "location_dynamic"
		});

		if (!isMotionOrStatic && arg.nounUnit && arg.nounUnit[DATA_SCHEMA.Id] !== targetId && (arg.role === K.OBJECT || arg.role === K.SUBJECT)) {
			constituents.push({
				role: arg.role,
				nounUnit: arg.nounUnit,
				particleType: arg.particleType
			});
		}

		return {
			ok: true,
			ast: {
				type: "Sentence",
				targetUnitId: targetId,
				speechAct: isInterrogative ? K.INTERROGATIVE : K.DECLARATIVE,
				politeness,
				tense,
				polarity: K.AFFIRMATIVE,
				clauses: [{
					constituents,
					predicate: {
						role: K.PREDICATE,
						predType: verbUnit[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB ? K.ACTION : K.DESCRIPTIVE,
						verbUnit,
						tense,
						politeness,
						speechAct: isInterrogative ? K.INTERROGATIVE : K.DECLARATIVE,
						polarity: K.AFFIRMATIVE
					}
				}]
			}
		};
	}

	// 5. Person / Animate Noun or Personal Pronoun -> Subject / Topic
	const isPersonalPronoun = (HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_35).has(ko);
	const isPerson = isPersonalPronoun || hasTag(nominalUnit, K.PERSON, K.FAMILY, K.PROFESSION, "animal", "subject_animate");
	const isNonPersonDeictic = (HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_36).has(ko);
	if (isPerson && !isNonPersonDeictic) {
		const isElder = isElderNoun(nominalUnit);
		const isFirstPerson = (HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_37).has(ko);
		const isJunior = hasTag(nominalUnit, "child", "junior") || (HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_38).has(ko);
		const isInterrogative = HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_2.includes(ko);
		const allAvs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId);
		const avs = allAvs.filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (vKo.includes(" ")) return false;
			if (isIntransitiveVerb(v)) return false;
			if (getVerbParticleType(v) !== K.OBJECT) return false;
			if ((!isElder || isFirstPerson || isJunior) && state.HONORIFIC_WORDS.has(vKo)) return false;
			if ((HC.UNITGEN_AST_NOMINAL_KO_ONE_OF_39).has(ko) && (HC.UNITGEN_AST_NOMINAL_VKO_ONE_OF_18).has(vKo)) return false;
			return true;
		});
		const matchedDV = selectDescriptiveVerbForNoun(nominalUnit, { ...options, tense }, targetId);
		let chosenDV = matchedDV;
		if (chosenDV && (!isElder || isFirstPerson || isJunior) && state.HONORIFIC_WORDS.has(chosenDV[DATA_SCHEMA.Korean])) {
			chosenDV = null;
		}
		const verbUnit = (variationIndex % 2 === 0 && avs.length > 0) ? pickRandom(avs, options.seedOffset, options) : (chosenDV || pickRandom(avs, options.seedOffset, options));
		let clauseTensePerson = tense;
		if (verbUnit && (HC.UNITGEN_AST_NOMINAL_VERBUNIT_DATA_SCHEMA_KOREA_ONE_OF).has(verbUnit[DATA_SCHEMA.Korean]) && !options.tense) {
			clauseTensePerson = K.PAST;
		}

		if (!verbUnit) {
			// Fallback to Copula if another noun is in set
			const otherNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => n[DATA_SCHEMA.Id] !== targetId);
			if (otherNouns.length > 0) {
				return {
					ok: true,
					ast: {
						type: "Sentence",
						targetUnitId: targetId,
						speechAct: isInterrogative ? K.INTERROGATIVE : K.DECLARATIVE,
						politeness,
						tense: K.PRESENT,
						polarity: K.AFFIRMATIVE,
						clauses: [{
							constituents: [{
								role: isInterrogative ? K.SUBJECT : K.TOPIC,
								nounUnit: nominalUnit,
								particleType: isInterrogative ? K.SUBJECT : K.TOPIC
							}],
							predicate: {
								role: K.PREDICATE,
								predType: K.COPULA,
								copulaNounUnit: pickRandom(otherNouns),
								tense: K.PRESENT,
								politeness,
								speechAct: isInterrogative ? K.INTERROGATIVE : K.DECLARATIVE,
								polarity: K.AFFIRMATIVE
							}
						}]
					}
				};
			}
			return {
				ok: false,
				insufficientSet: true,
				missingRoles: ["Action Verb or Descriptive Verb"],
				message: "Cannot build a sentence using only your current set: add at least one Verb to your set."
			};
		}

		const nominalParticle = isInterrogative ? K.SUBJECT : (variationIndex % 2 === 0 ? K.TOPIC : K.SUBJECT);
		const nominalRole = isInterrogative ? K.SUBJECT : (variationIndex % 2 === 0 ? K.TOPIC : K.SUBJECT);
		const constituents = [{
			role: nominalRole,
			nounUnit: nominalUnit,
			particleType: nominalParticle
		}];

		if (verbUnit[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB) {
			const arg = selectArgumentForActionVerb(verbUnit, options, targetId);
			if (HC.UNITGEN_AST_NOMINAL_VERBUNIT_DATA_SCHEMA_KOREA_ONE_OF_2.includes(verbUnit[DATA_SCHEMA.Korean])) {
				const container = verbUnit[DATA_SCHEMA.Korean] === "담다"
					? pickRandom(getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => !hasTag(n, K.HONORIFIC, "honorific_noun") && ((HC.UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_25).has(n[DATA_SCHEMA.Korean]) || hasTag(n, "container", "dish"))))
					: selectPutInContainerNoun(arg.nounUnit, options, targetId);
				if (container && container[DATA_SCHEMA.Id] !== targetId) {
					constituents.push({
						role: K.LOCATION,
						nounUnit: container,
						particleType: "location_static"
					});
				}
			}
			if (arg.nounUnit && arg.nounUnit[DATA_SCHEMA.Id] !== targetId) {
				constituents.push({
					role: arg.role,
					nounUnit: arg.nounUnit,
					particleType: arg.particleType
				});
			}
		}

		return {
			ok: true,
			ast: {
				type: "Sentence",
				targetUnitId: targetId,
				speechAct: isInterrogative ? K.INTERROGATIVE : K.DECLARATIVE,
				politeness,
				tense: clauseTensePerson,
				polarity: K.AFFIRMATIVE,
				honorific: isElder,
				clauses: [{
					honorific: isElder,
					constituents,
					predicate: {
						role: K.PREDICATE,
						predType: verbUnit[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB ? K.ACTION : K.DESCRIPTIVE,
						verbUnit,
						tense: clauseTensePerson,
						politeness,
						speechAct: isInterrogative ? K.INTERROGATIVE : K.DECLARATIVE,
						polarity: K.AFFIRMATIVE,
						honorific: isElder
					}
				}]
			}
		};
	}

	// 6. General Object / Concept Noun or Demonstrative Pronoun (이것, 그것, 저것, 무엇, 책, 커피, 음악...)
	const matchedAV = selectActionVerbForNoun(nominalUnit, options, targetId);
	const matchedDV = selectDescriptiveVerbForNoun(nominalUnit, { ...options, tense }, targetId);
	const useAV = variationIndex % 2 === 0 ? Boolean(matchedAV) : !matchedDV;
	const chosenVerb = useAV ? (matchedAV || matchedDV) : (matchedDV || matchedAV);
	const isInterrogative = HC.UNITGEN_AST_NOMINAL_KO_ONE_OF.includes(ko) || Boolean(
		chosenVerb && ((HC.UNITGEN_AST_NOMINAL_CHOSENVERB_DATA_SCHEMA_KOR_ONE_OF_2).has(chosenVerb[DATA_SCHEMA.Korean]) || hasTag(chosenVerb, K.QUESTION_WORD, K.INTERROGATIVE))
	);

	if (!chosenVerb) {
		return {
			ok: false,
			insufficientSet: true,
			missingRoles: ["Action Verb or Descriptive Verb"],
			message: "Cannot build a sentence using only your current set: add at least one Action Verb or Descriptive Verb to your set."
		};
	}

	const constituents = [];
	if (chosenVerb[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB) {
		const subj = selectSubjectUnit(options, targetId, false);
		if (subj && subj[DATA_SCHEMA.Id] !== targetId) {
			constituents.push({
				role: K.TOPIC,
				nounUnit: subj,
				particleType: K.TOPIC
			});
		}
		const chosenKo = chosenVerb[DATA_SCHEMA.Korean];
		if (HC.UNITGEN_AST_NOMINAL_CHOSENKO_ONE_OF.includes(chosenKo)) {
			const locPool = chosenKo === "담다"
				? getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => !hasTag(n, K.HONORIFIC, "honorific_noun") && ((HC.UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_26).has(n[DATA_SCHEMA.Korean]) || hasTag(n, "container", "dish")))
				: chosenKo === "넣다"
					? null
					: getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (HC.UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_27).has(n[DATA_SCHEMA.Korean]) || hasTag(n, "furniture", K.PLACE));
			const containerLoc = chosenKo === "넣다"
				? selectPutInContainerNoun(nominalUnit, options, targetId)
				: pickRandom(locPool);
			if (containerLoc && containerLoc[DATA_SCHEMA.Id] !== targetId) {
				constituents.push({
					role: K.LOCATION,
					nounUnit: containerLoc,
					particleType: "location_static"
				});
			}
		}
		let particleType = getVerbParticleType(chosenVerb);
		if (particleType === K.DATIVE && !hasTag(nominalUnit, K.PERSON, K.FAMILY, K.PROFESSION)) {
			particleType = K.OBJECT;
		}
		constituents.push({
			role: (particleType === K.LOCATION || particleType === "location_static") ? K.LOCATION : (particleType === K.DATIVE ? K.RECIPIENT : K.OBJECT),
			nounUnit: nominalUnit,
			particleType
		});
	} else {
		const partType = isInterrogative ? K.SUBJECT : (variationIndex === 1 ? K.TOPIC : K.SUBJECT);
		const roleType = isInterrogative ? K.SUBJECT : (variationIndex === 1 ? K.TOPIC : K.SUBJECT);
		constituents.push({
			role: roleType,
			nounUnit: nominalUnit,
			particleType: partType
		});
	}

	return {
		ok: true,
		ast: {
			type: "Sentence",
			targetUnitId: targetId,
			speechAct: isInterrogative ? K.INTERROGATIVE : K.DECLARATIVE,
			politeness,
			tense,
			polarity: K.AFFIRMATIVE,
			clauses: [{
				constituents,
				predicate: {
					role: K.PREDICATE,
					predType: chosenVerb[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB ? K.ACTION : K.DESCRIPTIVE,
					verbUnit: chosenVerb,
					tense,
					politeness,
					speechAct: isInterrogative ? K.INTERROGATIVE : K.DECLARATIVE,
					polarity: K.AFFIRMATIVE
				}
			}]
		}
	};
}

/**
 * Builds a SentenceAST for an Adverb, Determiner, Number, or Exclamation unit.
 */
function buildASTForModifierOrParticleLike(unit, variationIndex = 0, options = {}) {
	const targetId = unit[DATA_SCHEMA.Id];
	const ko = unit[DATA_SCHEMA.Korean];
	const pos = unit[DATA_SCHEMA.PartofSpeech];
	const politeness = options.politeness || (variationIndex === 2 ? K.FORMAL_HIGH : "polite");
	const tenses = [K.PRESENT, K.PAST, K.FUTURE];
	let tense = options.tense || tenses[variationIndex % tenses.length];

	// 1. Determiner (이, 그, 저, 어느, 무슨, 어떤, 새, 헌, 모든, 다른...)
	if (pos === K.DETERMINER) {
		const isInterrogative = (HC.UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_KO_ONE_OF).has(ko);
		const isTemporalDet = (HC.UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_KO_ONE_OF_2).has(ko);
		let nouns = [];
		if (isTemporalDet) {
			nouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
				n => hasTag(n, K.TIME, "temporal") && !hasTag(n, K.MEASUREWORD, K.COUNTER, K.POSITION)
			);
		}
		if (nouns.length === 0) {
			nouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => {
				if (hasTag(n, K.MEASUREWORD, K.COUNTER, K.TIME, K.POSITION, K.QUESTION_WORD)) return false;
				if ((HC.UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_N_DATA_SCHEMA_KOREAN_ONE_OF).has(n[DATA_SCHEMA.Korean])) return false;
				if (ko === "어느") {
					if (hasTag(n, K.PROPER_NOUN, K.FAMILY, "landmark", "tourism", "cultural_concept", "anatomy", "body_fluid", "maneuver")) return false;
					if ((HC.UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_N_DATA_SCHEMA_KOREAN_ONE_OF_2).has(n[DATA_SCHEMA.Korean])) return false;
					return (HC.UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_N_DATA_SCHEMA_KOREAN_ONE_OF_3).has(n[DATA_SCHEMA.Korean])
						|| hasTag(n, K.PLACE, K.FACILITY, K.COUNTRY, "city", K.PERSON, K.TRANSPORTATION, "season", K.CLOTHING, "book", K.DIRECTION);
				}
				return true;
			});
			if (ko === "어느" && nouns.length === 0) {
				nouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
					n => !hasTag(n, K.MEASUREWORD, K.COUNTER, K.TIME, K.POSITION, K.QUESTION_WORD, "cultural_concept", "anatomy", "body_fluid") &&
					!(HC.UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_N_DATA_SCHEMA_KOREAN_ONE_OF_4).has(n[DATA_SCHEMA.Korean])
				);
			}
		}
		const allAvs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId);
		const avs = allAvs.filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (vKo.includes(" ")) return false;
			if (isIntransitiveVerb(v)) return false;
			if (getVerbParticleType(v) !== K.OBJECT) return false;
			return true;
		});
		const dvs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId);
		const headNoun = pickRandom(nouns);
		const isAction = variationIndex % 2 === 1;
		const chosenVerb = isAction
			? (headNoun ? selectActionVerbForNoun(headNoun, options, targetId) : pickRandom(avs))
			: (headNoun ? selectDescriptiveVerbForNoun(headNoun, options, targetId) : pickRandom(dvs));

		if (options.onlyFromSet && (nouns.length === 0 || !chosenVerb)) {
			const missing = [];
			if (nouns.length === 0) missing.push(K.NOUN);
			if (!chosenVerb) missing.push("Verb");
			return {
				ok: false,
				insufficientSet: true,
				missingRoles: missing,
				message: `Cannot build a sentence for determiner '${ko}' using only your current set (missing: ${missing.join(", ")}).`
			};
		}

		const isActionVerb = chosenVerb[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB;
		return {
			ok: true,
			ast: {
				type: "Sentence",
				targetUnitId: targetId,
				speechAct: isInterrogative ? K.INTERROGATIVE : K.DECLARATIVE,
				politeness,
				tense,
				polarity: K.AFFIRMATIVE,
				clauses: [{
					constituents: [{
						role: isActionVerb ? K.OBJECT : K.SUBJECT,
						determinerUnit: unit,
						nounUnit: headNoun,
						particleType: isActionVerb ? K.OBJECT : K.SUBJECT
					}],
					predicate: {
						role: K.PREDICATE,
						predType: isActionVerb ? K.ACTION : K.DESCRIPTIVE,
						verbUnit: chosenVerb,
						tense,
						politeness,
						speechAct: isInterrogative ? K.INTERROGATIVE : K.DECLARATIVE,
						polarity: K.AFFIRMATIVE
					}
				}]
			}
		};
	}

	// 2. Number (하나, 둘, 한, 두, 일, 이, 삼...)
	if (pos === K.NUMBER) {
		const isSino = hasTag(unit, K.SINO_NUMBER);
		const numVal = (state.KOREAN_NUMBER_VALUES && state.KOREAN_NUMBER_VALUES[ko]) || 1;

		// Native Korean cardinal counting numbers (하나, 둘, 셋, 넷, 열하나, 열둘, 스물)
		// must appear in their exact cardinal form rather than being converted to attributive 한/두/세/네/스무!
		if (!isSino && hasTag(unit, "counting") && getKoreanNumber(numVal, true) !== ko && !options.onlyFromSet) {
			const cardNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
				n => (HC.UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_N_DATA_SCHEMA_KOREAN_ONE_OF_5).has(n[DATA_SCHEMA.Korean])
			);
			const cardNoun = pickRandom(cardNouns);
			const isCardAction = variationIndex % 2 === 1;
			const cardVerb = isCardAction
				? (cardNoun ? selectActionVerbForNoun(cardNoun, options, targetId) : null)
				: (getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId).find(v => v[DATA_SCHEMA.Korean] === "있다") || null);
			const cardTense = (isCardAction && variationIndex % 3 === 1) ? K.PAST : K.PRESENT;
			if (cardNoun && cardVerb) {
				const cardAct = cardVerb[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB;
				const cardConstituents = [];
				if (cardAct) {
					const cardSubj = selectSubjectUnit(options, targetId, false);
					if (cardSubj) {
						cardConstituents.push({ role: K.TOPIC, nounUnit: cardSubj, particleType: K.TOPIC });
					}
				}
				cardConstituents.push({
					role: cardAct ? K.OBJECT : K.SUBJECT,
					nounUnit: cardNoun,
					particleType: cardAct ? K.OBJECT : K.SUBJECT
				});
				cardConstituents.push({
					role: "number",
					unit,
					numberUnit: unit,
					explicitSurfaceKo: ko,
					particleType: null
				});
				return {
					ok: true,
					ast: {
						type: "Sentence",
						targetUnitId: targetId,
						speechAct: K.DECLARATIVE,
						politeness,
						tense: cardTense,
						polarity: K.AFFIRMATIVE,
						clauses: [{
							constituents: cardConstituents,
							predicate: {
								role: K.PREDICATE,
								predType: cardAct ? K.ACTION : K.DESCRIPTIVE,
								verbUnit: cardVerb,
								tense: cardTense,
								politeness,
								speechAct: K.DECLARATIVE,
								polarity: K.AFFIRMATIVE
							}
						}]
					}
				};
			}
		}

		const classifiers = isSino ? Array.from(state.SINO_CLASSIFIERS) : Array.from(state.KOREAN_CLASSIFIERS);
		const sinoClassifierSet = new Set(classifiers);
		const korClassifierSet = new Set(classifiers);
		let chosenClassifierKo = isSino
			? (numVal >= 100 && sinoClassifierSet.has("원") ? "원" : (sinoClassifierSet.has("쪽") ? "쪽" : (classifiers[0] || "분")))
			: (korClassifierSet.has("개") ? "개" : (classifiers[0] || "개"));
		let counterUnit = state.CLASSIFIER_UNITS.get(chosenClassifierKo) || null;

		if (options.onlyFromSet) {
			const inSetCounters = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => hasTag(n, K.MEASUREWORD, K.COUNTER));
			const matchingCounter = inSetCounters.find(c => (getClassifierNumeralType(c[DATA_SCHEMA.Korean]) === "sino") === isSino) || inSetCounters[0];
			if (matchingCounter) {
				counterUnit = matchingCounter;
				chosenClassifierKo = matchingCounter[DATA_SCHEMA.Korean];
			}
		}

		let nouns = chosenClassifierKo === "원"
			? getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (HC.UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_N_DATA_SCHEMA_KOREAN_ONE_OF_6).has(n[DATA_SCHEMA.Korean]))
			: (chosenClassifierKo === "쪽"
				? getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (HC.UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_N_DATA_SCHEMA_KOREAN_ONE_OF_7).has(n[DATA_SCHEMA.Korean]))
				: filterBySet(getMatchingNounsForClassifier(chosenClassifierKo), options, targetId));
		if (nouns.length === 0) {
			nouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => !hasTag(n, K.MEASUREWORD, K.COUNTER, K.TIME, K.PLACE));
		}
		const allAvs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId);
		const avs = allAvs.filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (vKo.includes(" ")) return false;
			if (isIntransitiveVerb(v)) return false;
			if (getVerbParticleType(v) !== K.OBJECT) return false;
			return true;
		});
		const dvs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId);
		const pageVerbs = avs.filter(v => (HC.UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_V_DATA_SCHEMA_KOREAN_ONE_OF).has(v[DATA_SCHEMA.Korean]));
		const wonVerbs = avs.filter(v => (HC.UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_V_DATA_SCHEMA_KOREAN_ONE_OF_2).has(v[DATA_SCHEMA.Korean]));
		const chosenVerb = chosenClassifierKo === "쪽"
			? (pickRandom(pageVerbs) || avs.find(v => v[DATA_SCHEMA.Korean] === "읽다") || pickRandom(avs) || pickRandom(dvs))
			: (chosenClassifierKo === "원"
				? (variationIndex % 3 === 0 && dvs.find(v => v[DATA_SCHEMA.Korean] === "있다") ? dvs.find(v => v[DATA_SCHEMA.Korean] === "있다") : (pickRandom(wonVerbs) || pickRandom(avs) || pickRandom(dvs)))
				: (dvs.find(v => v[DATA_SCHEMA.Korean] === "있다") || pickRandom(avs) || pickRandom(dvs)));

		if (options.onlyFromSet && (nouns.length === 0 || !chosenVerb)) {
			const missing = [];
			if (nouns.length === 0) missing.push(K.NOUN);
			if (!chosenVerb) missing.push("Verb");
			return {
				ok: false,
				insufficientSet: true,
				missingRoles: missing,
				message: `Cannot build a number sentence using only your current set (missing: ${missing.join(", ")}).`
			};
		}

		const itemNoun = pickRandom(nouns);
		const isAction = chosenVerb[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB;
		const numSurface = (!isSino && counterUnit) ? getKoreanNumber(numVal, true) : ko;
		const numTense = (isAction && variationIndex % 2 === 1) ? K.PAST : K.PRESENT;
		const numConstituents = [];
		if (isAction && !options.onlyFromSet) {
			const numSubj = selectSubjectUnit(options, targetId, false);
			if (numSubj) {
				numConstituents.push({
					role: K.TOPIC,
					nounUnit: numSubj,
					particleType: K.TOPIC
				});
			}
		}
		numConstituents.push({
			role: isAction ? K.OBJECT : K.SUBJECT,
			nounUnit: itemNoun,
			numberUnit: unit,
			numberSurfaceKo: numSurface,
			countValue: numVal,
			counterUnit,
			particleType: isAction ? K.OBJECT : K.SUBJECT
		});

		return {
			ok: true,
			ast: {
				type: "Sentence",
				targetUnitId: targetId,
				speechAct: K.DECLARATIVE,
				politeness,
				tense: numTense,
				polarity: K.AFFIRMATIVE,
				clauses: [{
					constituents: numConstituents,
					predicate: {
						role: K.PREDICATE,
						predType: isAction ? K.ACTION : K.DESCRIPTIVE,
						verbUnit: chosenVerb,
						tense: numTense,
						politeness,
						speechAct: K.DECLARATIVE,
						polarity: K.AFFIRMATIVE
					}
				}]
			}
		};
	}

	// 3. Exclamation (네, 아니요, 아, 와, 안녕하세요, 감사합니다...)
	if (pos === K.EXCLAMATION) {
		const isAction = variationIndex % 2 === 1;
		const allAvs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId);
		const avs = allAvs.filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (vKo.includes(" ")) return false;
			if (isIntransitiveVerb(v)) return false;
			if (getVerbParticleType(v) !== K.OBJECT) return false;
			return true;
		});
		const dvs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId).filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if ((HC.UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_VKO_ONE_OF).has(vKo)) return false;
			if (hasTag(v, K.AUXILIARY, K.CONNECTIVE, "greeting")) return false;
			return true;
		});

		const constituents = [{
			role: K.DISCOURSE,
			unit,
			particleType: null
		}];

		if (isAction && avs.length > 0) {
			const chosenVerb = pickRandom(avs);
			const subj = selectSubjectUnit(options, targetId, false);
			const arg = selectArgumentForActionVerb(chosenVerb, options, targetId);
			if (subj) {
				constituents.push({
					role: K.SUBJECT,
					nounUnit: subj,
					particleType: K.SUBJECT
				});
			}
			if (arg.nounUnit && (!subj || arg.nounUnit[DATA_SCHEMA.Id] !== subj[DATA_SCHEMA.Id])) {
				constituents.push({
					role: arg.role,
					nounUnit: arg.nounUnit,
					particleType: arg.particleType
				});
			}
			return {
				ok: true,
				ast: {
					type: "Sentence",
					targetUnitId: targetId,
					speechAct: K.DECLARATIVE,
					politeness,
					tense: K.PRESENT,
					polarity: K.AFFIRMATIVE,
					clauses: [{
						constituents,
						predicate: {
							role: K.PREDICATE,
							predType: K.ACTION,
							verbUnit: chosenVerb,
							tense: K.PRESENT,
							politeness,
							speechAct: K.DECLARATIVE,
							polarity: K.AFFIRMATIVE
						}
					}]
				}
			};
		} else {
			const chosenVerb = pickRandom(dvs) || pickRandom(avs);
			const subjCandidates = chosenVerb ? filterBySet(getSubjectCandidatesForDescriptiveVerb(chosenVerb), options, targetId)
				.filter(u => u[DATA_SCHEMA.Id] !== 361 && !(HC.UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_U_DATA_SCHEMA_KOREAN_ONE_OF).has(u[DATA_SCHEMA.Korean])) : [];
			const subj = (subjCandidates.length > 0 ? pickRandom(subjCandidates) : selectSubjectUnit(options, targetId, false));
			if (subj) {
				constituents.push({
					role: K.SUBJECT,
					nounUnit: subj,
					particleType: K.SUBJECT
				});
			}
			return {
				ok: true,
				ast: {
					type: "Sentence",
					targetUnitId: targetId,
					speechAct: K.DECLARATIVE,
					politeness,
					tense: K.PRESENT,
					polarity: K.AFFIRMATIVE,
					clauses: [{
						constituents,
						predicate: {
							role: K.PREDICATE,
							predType: chosenVerb && chosenVerb[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB ? K.ACTION : K.DESCRIPTIVE,
							verbUnit: chosenVerb,
							tense: K.PRESENT,
							politeness,
							speechAct: K.DECLARATIVE,
							polarity: K.AFFIRMATIVE
						}
					}]
				}
			};
		}
	}

	// 4. Adverb (Degree, Manner, Time, Discourse, NPI, Short Negation)
	if (ko === "아무리") {
		const avs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(v => !state.FORBIDDEN_NEGATIVE_ROOTS.has(v[DATA_SCHEMA.Korean]) && !(v[DATA_SCHEMA.Korean] || "").includes(" "));
		const dvs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId).filter(v => !state.FORBIDDEN_NEGATIVE_ROOTS.has(v[DATA_SCHEMA.Korean]) && !(HC.UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_V_DATA_SCHEMA_KOREAN_ONE_OF_3).has(v[DATA_SCHEMA.Korean]));
		const dv1 = pickRandom(dvs) || dvs[0];
		const dvSubjs = dv1 ? filterBySet(getSubjectCandidatesForDescriptiveVerb(dv1), options, targetId).filter(u => u[DATA_SCHEMA.Id] !== 361) : [];
		const subj1 = dvSubjs.length > 0 ? pickRandom(dvSubjs) : selectSubjectUnit(options, targetId, false);
		const verb2 = (variationIndex % 2 === 0 && avs.length > 0) ? pickRandom(avs) : (pickRandom(dvs) || pickRandom(avs));
		const isAct2 = verb2 && verb2[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB;
		const arg2 = (isAct2 && !hasTag(verb2, "scalable_duration", "scalable_quantity")) ? selectArgumentForActionVerb(verb2, options, targetId) : { nounUnit: null };

		const clause1Constituents = [
			{ role: K.ADVERB, unit, particleType: null }
		];
		if (subj1) {
			clause1Constituents.push({ role: K.SUBJECT, nounUnit: subj1, particleType: K.SUBJECT });
		}
		const clause2Constituents = [];
		if (arg2.nounUnit) {
			clause2Constituents.push({ role: arg2.role, nounUnit: arg2.nounUnit, particleType: arg2.particleType });
		}

		return {
			ok: true,
			ast: {
				type: "Sentence",
				targetUnitId: targetId,
				speechAct: K.DECLARATIVE,
				politeness,
				tense: K.PRESENT,
				polarity: K.AFFIRMATIVE,
				clauses: [
					{
						constituents: clause1Constituents,
						predicate: {
							role: K.PREDICATE,
							predType: K.DESCRIPTIVE,
							verbUnit: dv1,
							connectiveSuffix: "아/어도"
						}
					},
					{
						constituents: clause2Constituents,
						predicate: {
							role: K.PREDICATE,
							predType: isAct2 ? K.ACTION : K.DESCRIPTIVE,
							verbUnit: verb2,
							tense: K.PRESENT,
							politeness,
							speechAct: K.DECLARATIVE,
							polarity: K.AFFIRMATIVE
						}
					}
				]
			}
		};
	}

	if (ko === "왜냐하면") {
		const avs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(v => !state.FORBIDDEN_NEGATIVE_ROOTS.has(v[DATA_SCHEMA.Korean]) && !(v[DATA_SCHEMA.Korean] || "").includes(" "));
		const dvs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId).filter(v => !state.FORBIDDEN_NEGATIVE_ROOTS.has(v[DATA_SCHEMA.Korean]) && !(HC.UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_V_DATA_SCHEMA_KOREAN_ONE_OF_4).has(v[DATA_SCHEMA.Korean]));
		const chosenVerb = (variationIndex % 2 === 0 && avs.length > 0) ? pickRandom(avs) : (pickRandom(dvs) || pickRandom(avs));
		const isAction = chosenVerb[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB;
		const subj = isAction ? selectSubjectUnit(options, targetId, false) : (filterBySet(getSubjectCandidatesForDescriptiveVerb(chosenVerb), options, targetId)[0] || selectSubjectUnit(options, targetId, false));
		const arg = (isAction && !hasTag(chosenVerb, "scalable_duration", "scalable_quantity")) ? selectArgumentForActionVerb(chosenVerb, options, targetId) : { nounUnit: null };

		const constituents = [
			{ role: K.DISCOURSE, unit, particleType: null }
		];
		if (subj) {
			constituents.push({ role: K.TOPIC, nounUnit: subj, particleType: K.TOPIC });
		}
		if (arg.nounUnit && (!subj || arg.nounUnit[DATA_SCHEMA.Id] !== subj[DATA_SCHEMA.Id])) {
			constituents.push({ role: arg.role, nounUnit: arg.nounUnit, particleType: arg.particleType });
		}

		const stem = getStem(chosenVerb[DATA_SCHEMA.Korean]);
		const explEnding = politeness === K.FORMAL_HIGH ? "기 때문입니다" : "기 때문이에요";

		return {
			ok: true,
			ast: {
				type: "Sentence",
				targetUnitId: targetId,
				speechAct: K.DECLARATIVE,
				politeness,
				tense: K.PRESENT,
				polarity: K.AFFIRMATIVE,
				clauses: [{
					constituents,
					predicate: {
						role: K.PREDICATE,
						predType: isAction ? K.ACTION : K.DESCRIPTIVE,
						verbUnit: chosenVerb,
						explicitSurfaceKo: stem + explEnding,
						tense: K.PRESENT,
						politeness,
						speechAct: K.DECLARATIVE,
						polarity: K.AFFIRMATIVE
					}
				}]
			}
		};
	}

	if (ko === "한" && (hasTag(unit, "approximation", "number_unit") || targetId === 1521)) {
		const counters = HC.UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_COUNTERS;
		const cKo = counters[variationIndex % counters.length];
		const counterUnit = state.CLASSIFIER_UNITS.get(cKo) || getAllUnitsOfPos(K.NOUN, options, targetId).find(n => n[DATA_SCHEMA.Korean] === cKo) || null;
		let compatibleNouns = filterBySet(getMatchingNounsForClassifier(cKo), options, targetId);
		if (compatibleNouns.length === 0) {
			compatibleNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => !hasTag(n, K.MEASUREWORD, K.COUNTER, K.TIME, K.POSITION));
		}
		const headNoun = pickRandom(compatibleNouns);
		const numVals = [2, 3, 5, 10];
		const numVal = numVals[variationIndex % numVals.length];
		const numKo = getKoreanNumber(numVal, true);

		const modifierPhrase = `한 ${numKo}`;
		const isExistential = variationIndex % 2 === 0;
		const verbUnit = isExistential
			? (getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId).find(v => v[DATA_SCHEMA.Korean] === "있다") || null)
			: (headNoun ? selectActionVerbForNoun(headNoun, options, targetId) : null);

		const isAction = verbUnit && verbUnit[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB;
		const constituents = [{
			role: isAction ? K.OBJECT : K.SUBJECT,
			nounUnit: headNoun,
			numberSurfaceKo: modifierPhrase,
			counterUnit,
			particleType: isAction ? K.OBJECT : K.SUBJECT
		}];
		if (isAction) {
			const subj = selectSubjectUnit(options, targetId, false);
			if (subj) {
				constituents.unshift({ role: K.TOPIC, nounUnit: subj, particleType: K.TOPIC });
			}
		}

		return {
			ok: true,
			ast: {
				type: "Sentence",
				targetUnitId: targetId,
				speechAct: K.DECLARATIVE,
				politeness,
				tense: K.PRESENT,
				polarity: K.AFFIRMATIVE,
				clauses: [{
					constituents,
					predicate: {
						role: K.PREDICATE,
						predType: isAction ? K.ACTION : K.DESCRIPTIVE,
						verbUnit,
						tense: K.PRESENT,
						politeness,
						speechAct: K.DECLARATIVE,
						polarity: K.AFFIRMATIVE
					}
				}]
			}
		};
	}

	const isNPI = state.ALL_NPI_WORDS.has(ko) || hasTag(unit, "npi", "negative_polarity");
	const isShortAn = ko === "안";
	const isShortMot = ko === "못" || state.SHORT_INABILITY_WORDS.has(ko);
	const isManner = state.MANNER_ADVERBS.has(ko) || hasTag(unit, K.MANNER, K.ADVERB_MANNER);
	const isDegree = state.DEGREE_ADVERBS.has(ko) && !isManner;
	const isDiscourse = state.DISCOURSE_ADVERBS.has(ko) || hasTag(unit, K.DISCOURSE, "conjunction");
	const isQuestionWord = hasTag(unit, K.QUESTION_WORD, K.INTERROGATIVE);
	const pol = getTemporalPolarity(unit);
	if (pol) tense = pol;
	if ((HC.UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_KO_ONE_OF_3).has(ko) && tense === K.FUTURE && !options.tense) {
		tense = K.PRESENT;
	}
	const isAdvNeg = isNPI || isShortAn || isShortMot;
	const isFreqHabit = (HC.UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_KO_ONE_OF_4).has(ko);
	const requiresVolitionOrFreq = isFreqHabit || (HC.UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_KO_ONE_OF_5).has(ko);
	const isDailyHabit = (HC.UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_KO_ONE_OF_6).has(ko);

	const avs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(v => {
		const k = v[DATA_SCHEMA.Korean] || "";
		if (k.includes(" ")) return false;
		if (k === "때리다" && v[DATA_SCHEMA.Id] !== targetId) return false;
		if (state.FORBIDDEN_NEGATIVE_ROOTS.has(k)) return false;
		if (state.HONORIFIC_WORDS && state.HONORIFIC_WORDS.has(k)) return false;
		if (state.HUMBLE_WORDS && state.HUMBLE_WORDS.has(k)) return false;
		if (hasTag(v, K.HONORIFIC, "honorificVerb", "humble", "humbleVerb")) return false;
		if (isAdvNeg && (HC.UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_K_ENDSWITH_ONE_OF_2.some(_w => k.endsWith(_w)))) return false;
		if (requiresVolitionOrFreq && (hasTag(v, "involuntary", "passive") || (HC.UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_K_ONE_OF).has(k))) return false;
		if (isDailyHabit && (HC.UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_K_ONE_OF_2).has(k)) return false;
		if (typeof canAdverbPrecede === 'function' && !canAdverbPrecede(unit, v, { isNegative: isAdvNeg, tense })) return false;
		return true;
	});
	const dvs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId).filter(v => {
		const k = v[DATA_SCHEMA.Korean] || "";
		if (k.includes(" ")) return false;
		if (state.FORBIDDEN_NEGATIVE_ROOTS.has(k)) return false;
		if (state.HONORIFIC_WORDS && state.HONORIFIC_WORDS.has(k)) return false;
		if (hasTag(v, K.HONORIFIC, "honorificVerb")) return false;
		if (isAdvNeg && (HC.UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_K_ENDSWITH_ONE_OF.some(_w => k.endsWith(_w)))) return false;
		if (tense !== K.PAST && (HC.UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_K_ONE_OF_3).has(k)) return false;
		if (typeof canAdverbPrecede === 'function' && !canAdverbPrecede(unit, v, { isNegative: isAdvNeg, tense })) return false;
		return true;
	});

	let chosenVerb = null;
	if (isShortMot) {
		const volitionalAVs = avs.filter(v => {
			const vKo = v[DATA_SCHEMA.Korean] || "";
			if (HC.UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_K_VKO_INCLUDES_K_LIST_SOME.some(k => vKo.includes(k))) return false;
			if (hasTag(v, "involuntary", "passive", K.WEATHER)) return false;
			return true;
		});
		chosenVerb = pickRandom(volitionalAVs) || pickRandom(avs);
	} else if (ko === "얼마나") {
		// 얼마나 requires gradable Descriptive Verb (degree) or duration/scalable verb (scalable)
		const durationVerbs = avs.filter(v => hasTag(v, "scalable", "scalable_duration", "scalable_quantity", "scalable_emotion"));
		const gradableDvs = dvs.filter(v => hasTag(v, K.GRADABLE));
		if (variationIndex === 1 && durationVerbs.length > 0) {
			chosenVerb = pickRandom(durationVerbs);
		} else {
			chosenVerb = pickRandom(gradableDvs) || pickRandom(dvs) || pickRandom(durationVerbs) || dvs[0];
		}
	} else if (isManner) {
		chosenVerb = pickRandom(avs);
	} else if (isDegree) {
		// Degree adverbs (아주, 매우, 너무, 꽤, 무척, 조금, 참) modify Descriptive Verbs or scalable psychological verbs
		const scalableAVs = avs.filter(v => hasTag(v, "scalable", "scalable_emotion"));
		chosenVerb = pickRandom(dvs) || (scalableAVs.length > 0 ? pickRandom(scalableAVs) : null) || dvs[0] || pickRandom(avs);
	} else {
		chosenVerb = pickRandom(avs) || pickRandom(dvs);
	}

	if (!chosenVerb) {
		return {
			ok: false,
			insufficientSet: true,
			missingRoles: [isShortMot || isManner ? K.ACTION_VERB : "Action Verb or Descriptive Verb"],
			message: `Cannot build a sentence for adverb '${ko}' using only your current set: add a compatible Verb to your set.`
		};
	}

	const isAction = chosenVerb[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB;
	const constituents = [];
	let subj = null;
	if (ko === "얼마나" && hasTag(chosenVerb, "scalable_duration", "scalable_quantity")) {
		const resourceNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => hasTag(n, "resource"));
		subj = resourceNouns.length > 0 ? (hasTag(chosenVerb, "scalable_quantity") && resourceNouns.length > 1 ? pickRandom(resourceNouns) : resourceNouns[0]) : selectSubjectUnit(options, targetId, false);
	} else if ((HC.UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_KO_ONE_OF_7).has(ko)) {
		const pluralPool = getAllUnitsOfPos(K.PRONOUN, options, targetId).filter(p => (HC.UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_P_DATA_SCHEMA_KOREAN_ONE_OF).has(p[DATA_SCHEMA.Korean]));
		const pluralNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => isPluralSubjectUnit(n));
		subj = pickRandom([...pluralPool, ...pluralNouns]) || selectSubjectUnit(options, targetId, false);
	} else if (!isAction) {
		const dvSubjs = filterBySet(getSubjectCandidatesForDescriptiveVerb(chosenVerb), options, targetId).filter(u => u[DATA_SCHEMA.Id] !== 361 && !hasTag(u, K.QUESTION_WORD, K.INTERROGATIVE) && !(HC.UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_U_DATA_SCHEMA_KOREAN_ONE_OF_2).has(u[DATA_SCHEMA.Korean]));
		subj = dvSubjs.length > 0 ? pickRandom(dvSubjs) : selectSubjectUnit(options, targetId, false);
	} else {
		subj = selectSubjectUnit(options, targetId, false);
	}

	const arg = (isAction && !hasTag(chosenVerb, "scalable_duration", "scalable_quantity"))
		? selectArgumentForActionVerb(chosenVerb, options, targetId)
		: { nounUnit: null };
	if (isAction && arg.nounUnit && (HC.UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_CHOSENVERB_DATA_SCHEMA_KOR_ONE_OF).has(chosenVerb[DATA_SCHEMA.Korean])) {
		arg.particleType = "comitative";
		arg.role = "comitative";
		if (!hasTag(arg.nounUnit, K.PERSON, K.FAMILY, K.PROFESSION)) {
			const personPool = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (HC.UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_N_DATA_SCHEMA_KOREAN_ONE_OF_8).has(n[DATA_SCHEMA.Korean]));
			if (personPool.length > 0) arg.nounUnit = pickRandom(personPool);
		}
	}

	if (options.onlyFromSet && !subj && !arg.nounUnit) {
		return {
			ok: false,
			insufficientSet: true,
			missingRoles: ["Noun or Pronoun"],
			message: `Cannot build a sentence for adverb '${ko}' using only your current set: add at least one Noun or Pronoun.`
		};
	}

	if (isDiscourse) {
		constituents.push({ role: K.DISCOURSE, unit, particleType: null });
	}

	if (subj) {
		const subjParticle = isQuestionWord ? K.SUBJECT : K.TOPIC;
		constituents.push({
			role: subjParticle,
			nounUnit: subj,
			particleType: subjParticle
		});
	}

	if (!isDiscourse && pol) {
		constituents.push({ role: K.TIME, unit, particleType: null });
	}

	if (arg.nounUnit && (!subj || arg.nounUnit[DATA_SCHEMA.Id] !== subj[DATA_SCHEMA.Id])) {
		constituents.push({
			role: arg.role,
			nounUnit: arg.nounUnit,
			particleType: arg.particleType
		});
	}

	if (!isDiscourse && !pol && !isShortAn && !isShortMot) {
		constituents.push({ role: K.ADVERB, unit, particleType: null });
	}

	const polarity = (isNPI || isShortAn || isShortMot || ko === "아직") ? K.NEGATIVE : K.AFFIRMATIVE;
	const negationType = isShortMot ? "short_mot" : (polarity === K.NEGATIVE ? "short_an" : null);
	const speechAct = isQuestionWord ? K.INTERROGATIVE : K.DECLARATIVE;

	return {
		ok: true,
		ast: {
			type: "Sentence",
			targetUnitId: targetId,
			speechAct,
			politeness,
			tense,
			polarity,
			negationType,
			clauses: [{
				constituents,
				predicate: {
					role: K.PREDICATE,
					predType: isAction ? K.ACTION : K.DESCRIPTIVE,
					verbUnit: chosenVerb,
					negationUnit: (isShortAn || isShortMot) ? unit : null,
					tense,
					politeness,
					speechAct,
					polarity,
					negationType
				}
			}]
		}
	};
}

/**
 * Compiles a Grammar unit's curated Conjugation formula (e.g. "{VP_AVst}는 중이에요",
 * "{DVst}으/ㄹ 때 {Clause}", "{Noun:place}에다가 {VP_AVst}아/어요") into a structured SentenceAST
 * with full eojeol & morpheme segment provenance.
 */
// 씨 and the like: a grammar unit tagged proper_noun + honorific attaches to a personal name only (data tags name + person).
const isNameSuffixGrammar = (g) => hasTag(g, K.PROPER_NOUN) && hasTag(g, K.HONORIFIC);
const isPersonalName = (n) => hasTag(n, "name") && hasTag(n, K.PERSON);

function buildASTForGrammarUnit(grammarUnit, variationIndex = 0, options = {}) {
	const targetId = grammarUnit[DATA_SCHEMA.Id];
	const ko = grammarUnit[DATA_SCHEMA.Korean];
	// With no name available (e.g. none unlocked), there is no sentence for a name suffix: never 학생증 씨 / 저것 씨.
	if (isNameSuffixGrammar(grammarUnit) && !getAllUnitsOfPos(K.NOUN, options, targetId).some(isPersonalName)) {
		return { ok: false, insufficientSet: true, missingRoles: ["a personal name (e.g. 민수)"], message: "This suffix needs a personal name, and none is available." };
	}
	const formulas = Array.isArray(grammarUnit[DATA_SCHEMA.Conjugation]) ? grammarUnit[DATA_SCHEMA.Conjugation] : [];

	const isNegativeGrammar = hasTag(grammarUnit, K.NEGATIVE, K.INABILITY, K.PROHIBITION) || formulas.some(f => HC.UNITGEN_AST_GRAMMAR_UNIT_F_INCLUDES_ONE_OF.some(_w => f.includes(_w)));
	const isInability = hasTag(grammarUnit, K.INABILITY) || formulas.some(f => f.includes("못"));
	const isImperativeOrPropositive = hasTag(grammarUnit, K.IMPERATIVE, K.PROPOSITIVE);
	const avs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(v => {
		if (isNegativeGrammar && state.FORBIDDEN_NEGATIVE_ROOTS.has(v[DATA_SCHEMA.Korean])) return false;
		if (isInability && !canTakeMood(v, K.INABILITY)) return false;
		if (isImperativeOrPropositive && !canTakeMood(v, K.IMPERATIVE)) return false;
		return true;
	});
	const dvs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId).filter(v => {
		if (isNegativeGrammar && state.FORBIDDEN_NEGATIVE_ROOTS.has(v[DATA_SCHEMA.Korean])) return false;
		return true;
	});
	const nouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => !hasTag(n, K.MEASUREWORD, K.COUNTER) && n[DATA_SCHEMA.Korean] !== "이");

	if (options.onlyFromSet) {
		const needsAV = formulas.length > 0 && formulas.every(f => f.includes("AVst"));
		const needsDV = formulas.length > 0 && formulas.every(f => f.includes("DVst") && !f.includes("AVst"));
		const missing = [];
		if (needsAV && avs.length === 0) missing.push(K.ACTION_VERB);
		if (needsDV && dvs.length === 0) missing.push(K.DESCRIPTIVE_VERB);
		if (!needsAV && !needsDV && avs.length === 0 && dvs.length === 0 && !HC.UNITGEN_AST_GRAMMAR_UNIT_KO_INCLUDES_NONE_OF.some(_w => ko.includes(_w))) {
			missing.push("Action or Descriptive Verb");
		}
		if (nouns.length === 0) missing.push(K.NOUN);
		if (missing.length > 0) {
			return {
				ok: false,
				insufficientSet: true,
				missingRoles: missing,
				message: `Cannot build a sentence for grammar '${ko}' using only your current set (missing: ${missing.join(", ")}).`
			};
		}
	}

	// Pick a formula compatible with available POS in set
	let compatibleFormulas = formulas.filter(f => {
		if (f.includes("AVst") && avs.length === 0) return false;
		if (f.includes("DVst") && dvs.length === 0) return false;
		return true;
	});
	if (compatibleFormulas.length === 0) compatibleFormulas = formulas;

	const formula = compatibleFormulas.length > 0
		? compatibleFormulas[variationIndex % compatibleFormulas.length]
		: "{VP_AVst}아/어요";

	const isInterrogative = formula.includes("?") || hasTag(grammarUnit, K.INTERROGATIVE);
	const speechAct = isInterrogative ? K.INTERROGATIVE
		: hasTag(grammarUnit, K.IMPERATIVE) ? K.IMPERATIVE
			: hasTag(grammarUnit, K.PROPOSITIVE) ? K.PROPOSITIVE
				: K.DECLARATIVE;

	const tense = hasTag(grammarUnit, K.PAST, "temporal_past") ? K.PAST
		: hasTag(grammarUnit, K.FUTURE, "temporal_future") ? K.FUTURE
			: K.PRESENT;
	const politeness = hasTag(grammarUnit, K.FORMAL_HIGH, "formal_polite") ? K.FORMAL_HIGH
		: hasTag(grammarUnit, "plain_style") ? "plain"
			: hasTag(grammarUnit, K.INFORMAL) ? "intimate"
				: "polite";

	// Expand formula tokens while recording AST constituents and predicate
	const constituents = [];
	let mainPredicate = null;
	const clauses = [];

	// Special handling for Noun-Conjunction + DV patterns (#276 (이)랑, #367 하고)
	if (!options.onlyFromSet && (targetId === 276 || targetId === 367 || HC.UNITGEN_AST_GRAMMAR_UNIT_KO_ONE_OF.includes(ko))) {
		const conjDomainSpecs = HC.UNITGEN_AST_GRAMMAR_UNIT_CONJ_DOMAIN_SPECS;
		const spec = conjDomainSpecs[variationIndex % conjDomainSpecs.length];
		const domainNounSet = new Set(spec.nouns);
		const domainDvSet = new Set(spec.dvs);
		const domainNouns = nouns.filter(n => domainNounSet.has(n[DATA_SCHEMA.Korean]));
		const domainDvs = dvs.filter(v => domainDvSet.has(v[DATA_SCHEMA.Korean]));
		const n1 = domainNouns[variationIndex % domainNouns.length] || pickRandom(domainNouns);
		const n2Pool = domainNouns.filter(n => !n1 || n[DATA_SCHEMA.Id] !== n1[DATA_SCHEMA.Id]);
		const n2 = n2Pool[(variationIndex + 1) % n2Pool.length] || pickRandom(n2Pool);
		const conjDv = domainDvs[variationIndex % domainDvs.length] || pickRandom(domainDvs);
		if (n1 && n2 && conjDv) {
			const conjSuffix = (targetId === 276 || ko === "(이)랑") ? "(이)랑" : "하고";
			const n1WithConj = resolvePureMorphology(n1[DATA_SCHEMA.Korean] + conjSuffix, state);
			const conjTense = variationIndex % 3 === 1 ? K.PAST : K.PRESENT;
			return {
				ok: true,
				ast: {
					type: "Sentence",
					targetUnitId: targetId,
					grammarUnit,
					speechAct: K.DECLARATIVE,
					politeness,
					tense: conjTense,
					polarity: K.AFFIRMATIVE,
					clauses: [{
						constituents: [
							{
								role: "conjunct",
								nounUnit: n1,
								particleUnit: grammarUnit,
								explicitSurfaceKo: n1WithConj
							},
							{
								role: K.SUBJECT,
								nounUnit: n2,
								particleType: K.SUBJECT
							}
						],
						predicate: {
							role: K.PREDICATE,
							predType: K.DESCRIPTIVE,
							verbUnit: conjDv,
							tense: conjTense,
							politeness,
							speechAct: K.DECLARATIVE,
							polarity: K.AFFIRMATIVE
						}
					}]
				}
			};
		}
	}

	// Special handling for Time / Frequency / Quantity / Number-Counting grammar patterns (#277–#284)
	if (!options.onlyFromSet && targetId >= 277 && targetId <= 284) {
		const patSubj = selectSubjectUnit(options, targetId, false);
		const patTense = variationIndex % 2 === 0 ? K.PRESENT : K.PAST;
		if (targetId === 277) {
			// 시간 표현: {Number:koreanNumber} 시 {Number:sinoNumber} 분에 [ActionVerb]
			const hourVal = (variationIndex % 11) + 1;
			const minVals = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
			const minVal = minVals[variationIndex % minVals.length];
			const hourKo = getKoreanNumber(hourVal, true);
			const minKo = getSinoNumber(minVal);
			const schedVerbs = avs.filter(v => (HC.UNITGEN_AST_GRAMMAR_UNIT_V_DATA_SCHEMA_KOREAN_ONE_OF).has(v[DATA_SCHEMA.Korean]));
			const schedVerb = schedVerbs[variationIndex % schedVerbs.length] || pickRandom(schedVerbs) || pickRandom(avs);
			if (patSubj && schedVerb) {
				return {
					ok: true,
					ast: {
						type: "Sentence",
						targetUnitId: targetId,
						grammarUnit,
						speechAct: K.DECLARATIVE,
						politeness,
						tense: patTense,
						polarity: K.AFFIRMATIVE,
						clauses: [{
							constituents: [
								{ role: K.TOPIC, nounUnit: patSubj, particleType: K.TOPIC },
								{ role: K.TIME, unit: grammarUnit, explicitSurfaceKo: `${hourKo} 시 ${minKo} 분에`, particleType: K.TIME }
							],
							predicate: {
								role: K.PREDICATE,
								predType: K.ACTION,
								verbUnit: schedVerb,
								tense: patTense,
								politeness,
								speechAct: K.DECLARATIVE,
								polarity: K.AFFIRMATIVE
							}
						}]
					}
				};
			}
		} else if (targetId === 278) {
			// 횟수 표현: {Number:koreanNumber} 번 [ActionVerb]
			const freqVal = (variationIndex % 5) + 1;
			const freqKo = getKoreanNumber(freqVal, true);
			const freqNumUnit = getAllUnitsOfPos(K.NUMBER, options, targetId).find(u => u[DATA_SCHEMA.Korean] === freqKo) || null;
			const bunUnit = state.CLASSIFIER_UNITS.get("번") || getAllUnitsOfPos(K.NOUN, options, targetId).find(n => n[DATA_SCHEMA.Korean] === "번") || null;
			const freqVerbs = avs.filter(v => (HC.UNITGEN_AST_GRAMMAR_UNIT_V_DATA_SCHEMA_KOREAN_ONE_OF_2).has(v[DATA_SCHEMA.Korean]));
			const freqVerb = freqVerbs[variationIndex % freqVerbs.length] || pickRandom(freqVerbs) || pickRandom(avs);
			const freqArg = freqVerb ? selectArgumentForActionVerb(freqVerb, options, targetId) : { nounUnit: null };
			if (patSubj && freqVerb) {
				const freqConsts = [{ role: K.TOPIC, nounUnit: patSubj, particleType: K.TOPIC }];
				if (freqArg.nounUnit && freqArg.nounUnit[DATA_SCHEMA.Id] !== patSubj[DATA_SCHEMA.Id]) {
					freqConsts.push({ role: freqArg.role, nounUnit: freqArg.nounUnit, particleType: freqArg.particleType });
				}
				freqConsts.push({
					role: "frequency",
					unit: grammarUnit,
					numberUnit: freqNumUnit,
					numberSurfaceKo: freqKo,
					countValue: freqVal,
					counterUnit: bunUnit,
					particleType: null,
					explicitSurfaceKo: `${freqKo} 번`
				});
				return {
					ok: true,
					ast: {
						type: "Sentence",
						targetUnitId: targetId,
						grammarUnit,
						speechAct: K.DECLARATIVE,
						politeness,
						tense: patTense,
						polarity: K.AFFIRMATIVE,
						clauses: [{
							constituents: freqConsts,
							predicate: {
								role: K.PREDICATE,
								predType: K.ACTION,
								verbUnit: freqVerb,
								tense: patTense,
								politeness,
								speechAct: K.DECLARATIVE,
								polarity: K.AFFIRMATIVE
							}
						}]
					}
				};
			}
		} else if (targetId === 279 || targetId === 281 || targetId === 283) {
			// Sino-Korean quantity / counting (#279 1-10, #281 1-10000, #283 1-10000)
			const sinoVals = targetId === 279
				? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
				: [10, 20, 30, 50, 100, 500, 1000, 2000, 5000, 10000];
			const sinoVal = sinoVals[variationIndex % sinoVals.length];
			const sinoKo = getSinoNumber(sinoVal);
			const sinoNumUnit = getAllUnitsOfPos(K.NUMBER, options, targetId).find(u => u[DATA_SCHEMA.Korean] === sinoKo) || null;
			const counterKo = sinoVal >= 100 ? "원" : (variationIndex % 2 === 0 && sinoVal <= 5 ? "인분" : "쪽");
			const cUnit = state.CLASSIFIER_UNITS.get(counterKo) || getAllUnitsOfPos(K.NOUN, options, targetId).find(n => n[DATA_SCHEMA.Korean] === counterKo) || null;
			const itemPool = counterKo === "인분"
				? nouns.filter(n => (HC.UNITGEN_AST_GRAMMAR_UNIT_N_DATA_SCHEMA_KOREAN_ONE_OF).has(n[DATA_SCHEMA.Korean]))
				: (counterKo === "원"
					? nouns.filter(n => (HC.UNITGEN_AST_GRAMMAR_UNIT_N_DATA_SCHEMA_KOREAN_ONE_OF_2).has(n[DATA_SCHEMA.Korean]))
					: nouns.filter(n => (HC.UNITGEN_AST_GRAMMAR_UNIT_N_DATA_SCHEMA_KOREAN_ONE_OF_3).has(n[DATA_SCHEMA.Korean])));
			const itemNoun = itemPool[variationIndex % itemPool.length] || pickRandom(itemPool);
			const verbPool = counterKo === "인분"
				? avs.filter(v => (HC.UNITGEN_AST_GRAMMAR_UNIT_V_DATA_SCHEMA_KOREAN_ONE_OF_3).has(v[DATA_SCHEMA.Korean]))
				: (counterKo === "원"
					? avs.filter(v => (HC.UNITGEN_AST_GRAMMAR_UNIT_V_DATA_SCHEMA_KOREAN_ONE_OF_4).has(v[DATA_SCHEMA.Korean]))
					: avs.filter(v => (HC.UNITGEN_AST_GRAMMAR_UNIT_V_DATA_SCHEMA_KOREAN_ONE_OF_5).has(v[DATA_SCHEMA.Korean])));
			const qVerb = verbPool[variationIndex % verbPool.length] || pickRandom(verbPool);
			if (patSubj && itemNoun && cUnit && qVerb) {
				return {
					ok: true,
					ast: {
						type: "Sentence",
						targetUnitId: targetId,
						grammarUnit,
						speechAct: K.DECLARATIVE,
						politeness,
						tense: patTense,
						polarity: K.AFFIRMATIVE,
						clauses: [{
							constituents: [
								{ role: K.TOPIC, nounUnit: patSubj, particleType: K.TOPIC },
								{
									role: K.OBJECT,
									nounUnit: itemNoun,
									numberUnit: sinoNumUnit,
									numberSurfaceKo: sinoKo,
									countValue: sinoVal,
									counterUnit: cUnit,
									particleType: K.OBJECT
								}
							],
							predicate: {
								role: K.PREDICATE,
								predType: K.ACTION,
								verbUnit: qVerb,
								tense: patTense,
								politeness,
								speechAct: K.DECLARATIVE,
								polarity: K.AFFIRMATIVE
							}
						}]
					}
				};
			}
		} else if (targetId === 280 || targetId === 282) {
			// Native Korean quantity (#280 1-10, #282 1-99)
			const korVals = targetId === 280
				? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
				: [1, 2, 3, 4, 5, 10, 11, 12, 20, 30];
			const korVal = korVals[variationIndex % korVals.length];
			const korAttrKo = getKoreanNumber(korVal, true);
			const korNumUnit = getAllUnitsOfPos(K.NUMBER, options, targetId).find(u => u[DATA_SCHEMA.Korean] === korAttrKo) || null;
			const korSpecs = HC.UNITGEN_AST_GRAMMAR_UNIT_KOR_SPECS;
			const kSpec = korSpecs[variationIndex % korSpecs.length];
			const cUnit = state.CLASSIFIER_UNITS.get(kSpec.c) || getAllUnitsOfPos(K.NOUN, options, targetId).find(n => n[DATA_SCHEMA.Korean] === kSpec.c) || null;
			const nSet = new Set(kSpec.n);
			const vSet = new Set(kSpec.v);
			const itemPool = nouns.filter(n => nSet.has(n[DATA_SCHEMA.Korean]));
			const verbPool = avs.filter(v => vSet.has(v[DATA_SCHEMA.Korean]));
			const itemNoun = itemPool[variationIndex % itemPool.length] || pickRandom(itemPool);
			const qVerb = verbPool[variationIndex % verbPool.length] || pickRandom(verbPool);
			if (patSubj && itemNoun && cUnit && qVerb) {
				return {
					ok: true,
					ast: {
						type: "Sentence",
						targetUnitId: targetId,
						grammarUnit,
						speechAct: K.DECLARATIVE,
						politeness,
						tense: patTense,
						polarity: K.AFFIRMATIVE,
						clauses: [{
							constituents: [
								{ role: K.TOPIC, nounUnit: patSubj, particleType: K.TOPIC },
								{
									role: K.OBJECT,
									nounUnit: itemNoun,
									numberUnit: korNumUnit,
									numberSurfaceKo: korAttrKo,
									countValue: korVal,
									counterUnit: cUnit,
									particleType: K.OBJECT
								}
							],
							predicate: {
								role: K.PREDICATE,
								predType: K.ACTION,
								verbUnit: qVerb,
								tense: patTense,
								politeness,
								speechAct: K.DECLARATIVE,
								polarity: K.AFFIRMATIVE
							}
						}]
					}
				};
			}
		} else if (targetId === 284) {
			// Native Korean cardinal counting (#284 1-50): [Noun]이/가 [하나/둘/셋/넷...] 있어요
			const cardVals = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 20, 30, 40, 50];
			const cardVal = cardVals[variationIndex % cardVals.length];
			const cardKo = getKoreanNumber(cardVal, false);
			const cardNumUnit = getAllUnitsOfPos(K.NUMBER, options, targetId).find(u => u[DATA_SCHEMA.Korean] === cardKo) || null;
			const cardPool = nouns.filter(n => (HC.UNITGEN_AST_GRAMMAR_UNIT_N_DATA_SCHEMA_KOREAN_ONE_OF_4).has(n[DATA_SCHEMA.Korean]));
			const cardNoun = cardPool[variationIndex % cardPool.length] || pickRandom(cardPool);
			const existDv = dvs.find(v => v[DATA_SCHEMA.Korean] === "있다");
			if (cardNoun && existDv) {
				return {
					ok: true,
					ast: {
						type: "Sentence",
						targetUnitId: targetId,
						grammarUnit,
						speechAct: K.DECLARATIVE,
						politeness,
						tense: K.PRESENT,
						polarity: K.AFFIRMATIVE,
						clauses: [{
							constituents: [
								{ role: K.SUBJECT, nounUnit: cardNoun, particleType: K.SUBJECT },
								{ role: "number", unit: cardNumUnit || grammarUnit, numberUnit: cardNumUnit, explicitSurfaceKo: cardKo, particleType: null }
							],
							predicate: {
								role: K.PREDICATE,
								predType: K.DESCRIPTIVE,
								verbUnit: existDv,
								tense: K.PRESENT,
								politeness,
								speechAct: K.DECLARATIVE,
								polarity: K.AFFIRMATIVE
							}
						}]
					}
				};
			}
		}
	}

	// Split formula if it has a subordinate clause or adverbial modifier followed by {Clause}
	if (formula.includes("{Clause}")) {
		const parts = formula.split("{Clause}");
		const subFormula = parts[0].trim();

		if (/^\{Adv[^}]*\}$/.test(subFormula)) {
			// Single clause modified by an adverb placed cleanly before the predicate/VP
			const cleanAdverbCandidates = getAllUnitsOfPos(K.POS_ADVERB, options, targetId).filter(a => {
				if (a[DATA_SCHEMA.PartofSpeech] !== K.POS_ADVERB) return false;
				const aKo = a[DATA_SCHEMA.Korean];
				if (HC.UNITGEN_AST_GRAMMAR_UNIT_AKO_ONE_OF.includes(aKo)) return false;
				if (!isNegativeGrammar && state.ALL_NPI_WORDS && state.ALL_NPI_WORDS.has(aKo)) return false;
				if (hasTag(a, K.DISCOURSE, "conjunction", K.CONNECTIVE, "greeting", "interjection", "exclamation", "hesitation", K.TIME, "temporal", K.QUESTION_WORD, K.INTERROGATIVE, K.DEMONSTRATIVE, "concessive", "approximation", "number_unit")) return false;
				if ((HC.UNITGEN_AST_GRAMMAR_UNIT_AKO_ONE_OF_2).has(aKo)) return false;
				if (isImperativeOrPropositive && parseSemanticData(a).target_pos === K.DESCRIPTIVE_VERB) return false;
				return true;
			});
			const cleanAVs = avs.filter(v => {
				const vKo = v[DATA_SCHEMA.Korean];
				return !vKo.includes(" ") && !(HC.UNITGEN_AST_GRAMMAR_UNIT_VKO_ONE_OF).has(vKo) && !hasTag(v, "involuntary");
			});
			const cleanDVs = dvs.filter(v => {
				const vKo = v[DATA_SCHEMA.Korean];
				return !(HC.UNITGEN_AST_GRAMMAR_UNIT_VKO_ONE_OF_2).has(vKo)
					&& !hasTag(v, K.DEMONSTRATIVE, K.QUESTION_WORD, K.INTERROGATIVE, "greeting", K.DISCOURSE)
					&& !(tense !== K.PAST && (HC.UNITGEN_AST_GRAMMAR_UNIT_VKO_ONE_OF_3).has(vKo));
			});
			const advPool = cleanAdverbCandidates.length > 0 ? cleanAdverbCandidates : getAllUnitsOfPos(K.POS_ADVERB, options, targetId).filter(a => a[DATA_SCHEMA.PartofSpeech] === K.POS_ADVERB);
			const chosenAdv = pickRandom(advPool);
			const advTargetPos = chosenAdv ? parseSemanticData(chosenAdv).target_pos : null;
			const advIsManner = chosenAdv && (state.MANNER_ADVERBS.has(chosenAdv[DATA_SCHEMA.Korean]) || hasTag(chosenAdv, K.MANNER, K.ADVERB_MANNER));
			const advRequiresAction = isImperativeOrPropositive || advIsManner || advTargetPos === K.ACTION_VERB
				|| (chosenAdv && hasTag(chosenAdv, "spatial", "adverb_place", "distance", "adverb_frequency", "frequency"));
			const candidateVerbs = advRequiresAction
				? (cleanAVs.length > 0 ? cleanAVs : avs)
				: (advTargetPos === K.DESCRIPTIVE_VERB
					? (cleanDVs.length > 0 ? cleanDVs : dvs)
					: cleanAVs.concat(cleanDVs));
			const compatibleVerbs = (chosenAdv && typeof canAdverbPrecede === 'function')
				? candidateVerbs.filter(v => canAdverbPrecede(chosenAdv, v, { isNegative: isNegativeGrammar }))
				: candidateVerbs;
			const mainVerb = pickRandom(compatibleVerbs.length > 0 ? compatibleVerbs : candidateVerbs) || pickRandom(avs) || pickRandom(dvs);

			const mainClauseConstituents = [];
			let mainPred = null;
			if (mainVerb) {
				const isAction = mainVerb[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB;
				if (isAction) {
					const arg = selectArgumentForActionVerb(mainVerb, options, targetId);
					if (arg.role !== K.SUBJECT) {
						const subj = selectSubjectUnit(options, targetId, false);
						if (subj) {
							mainClauseConstituents.push({
								role: K.TOPIC,
								nounUnit: subj,
								particleType: K.TOPIC
							});
						}
					}
					if (arg.nounUnit) {
						mainClauseConstituents.push({
							role: arg.role,
							nounUnit: arg.nounUnit,
							particleType: arg.particleType
						});
						if (arg.particleType === "location_static" && (HC.UNITGEN_AST_GRAMMAR_UNIT_MAINVERB_DATA_SCHEMA_KOREA_ONE_OF).has(mainVerb[DATA_SCHEMA.Korean])) {
							const objCands = filterBySet(getNounCandidatesForVerb(mainVerb), options, targetId).filter(n => !hasTag(n, K.MEASUREWORD, K.COUNTER, K.PLACE, K.FACILITY, "building", "furniture", K.VEHICLE, K.PROPER_NOUN));
							const objNoun = pickRandom(objCands, options.seedOffset, options);
							if (objNoun) {
								mainClauseConstituents.push({
									role: K.OBJECT,
									nounUnit: objNoun,
									particleType: K.OBJECT
								});
							}
						}
					}
				} else {
					const isColloquialAdv = Boolean(chosenAdv && chosenAdv[DATA_SCHEMA.Korean] === "완전");
					const dvSubjPool = filterBySet(getSubjectCandidatesForDescriptiveVerb(mainVerb), options, targetId).filter(
						n => !isColloquialAdv || (!isElderNoun(n) && !(HC.UNITGEN_AST_GRAMMAR_UNIT_N_DATA_SCHEMA_KOREAN_ONE_OF_5).has(n[DATA_SCHEMA.Korean]))
					);
					const subj = pickRandom(dvSubjPool.length > 0 ? dvSubjPool : filterBySet(getSubjectCandidatesForDescriptiveVerb(mainVerb), options, targetId));
					if (subj) {
						mainClauseConstituents.push({
							role: K.SUBJECT,
							nounUnit: subj,
							particleType: K.SUBJECT
						});
					}
				}
				if (chosenAdv) {
					mainClauseConstituents.push({
						role: K.ADVERB,
						unit: chosenAdv,
						particleType: null
					});
				}
				mainPred = {
					role: K.PREDICATE,
					predType: isAction ? K.ACTION : K.DESCRIPTIVE,
					verbUnit: mainVerb,
					tense,
					politeness,
					speechAct,
					polarity: isNegativeGrammar ? K.NEGATIVE : K.AFFIRMATIVE
				};
			}
			clauses.push({ constituents: mainClauseConstituents, predicate: mainPred });
		} else {
			const subRes = expandFormulaIntoClause(subFormula, grammarUnit, tense, politeness, options, targetId, true);
			const EXCLUDED_CAUSAL_MAIN_VERBS = HC.UNITGEN_AST_GRAMMAR_UNIT_EXCLUDED_CAUSAL_MAIN_VERBS;
			const subSubjCon = (subRes && Array.isArray(subRes.constituents))
				? subRes.constituents.find(c => (c.role === K.SUBJECT || c.role === K.TOPIC) && (c.nounUnit || c.unit))
				: null;
			const subSubjUnit = subSubjCon ? (subSubjCon.nounUnit || subSubjCon.unit) : null;
			const subSubjIsHuman = Boolean(subSubjUnit && (
				subSubjUnit[DATA_SCHEMA.PartofSpeech] === K.PRONOUN
				|| hasTag(subSubjUnit, K.PERSON, K.FAMILY, K.PROFESSION, "subject_animate")
			));
			const isNominalReason = !subFormula.includes("VP_") && subFormula.includes("때문에");
			const isClauseReasonWithDV = subFormula.includes("때문에") && subRes && subRes.predicate && subRes.predicate.predType === K.DESCRIPTIVE;
			const NOMINAL_CAUSE_MAIN_VERBS = HC.UNITGEN_AST_GRAMMAR_UNIT_NOMINAL_CAUSE_MAIN_VERBS;
			const mainAvPool = avs.filter(v => (v[DATA_SCHEMA.Id] === targetId || !EXCLUDED_CAUSAL_MAIN_VERBS.has(v[DATA_SCHEMA.Korean])) && (!(isNominalReason || isClauseReasonWithDV) || NOMINAL_CAUSE_MAIN_VERBS.has(v[DATA_SCHEMA.Korean])));
			const compatibleDvPool = dvs.filter(v => {
				if (v[DATA_SCHEMA.Id] !== targetId && EXCLUDED_CAUSAL_MAIN_VERBS.has(v[DATA_SCHEMA.Korean])) return false;
				if ((isNominalReason || isClauseReasonWithDV) && !NOMINAL_CAUSE_MAIN_VERBS.has(v[DATA_SCHEMA.Korean])) return false;
				if (!subSubjIsHuman) return true;
				const cands = filterBySet(getSubjectCandidatesForDescriptiveVerb(v), options, targetId);
				return cands.some(n => n[DATA_SCHEMA.Id] === subSubjUnit[DATA_SCHEMA.Id]);
			});
			const baseMainAv = mainAvPool.length > 0 ? mainAvPool : avs;
			const baseMainDv = compatibleDvPool.length > 0 ? compatibleDvPool : dvs.filter(v => v[DATA_SCHEMA.Id] === targetId || !EXCLUDED_CAUSAL_MAIN_VERBS.has(v[DATA_SCHEMA.Korean]));
			const mainVerbCandidates = isImperativeOrPropositive
				? baseMainAv
				: (baseMainAv.concat(baseMainDv));
			const mainVerb = pickRandom(mainVerbCandidates) || pickRandom(avs) || pickRandom(dvs);
			const mainClauseConstituents = [];
			let mainPred = null;
			if (mainVerb) {
				const isAction = mainVerb[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB;
				const isMainHonVerb = state.HONORIFIC_WORDS && state.HONORIFIC_WORDS.has(mainVerb[DATA_SCHEMA.Korean]);
				let reuseSubjHonorific = false;
				if (isAction) {
					const arg = selectArgumentForActionVerb(mainVerb, options, targetId);
					if (arg.nounUnit) {
						if (arg.role === K.SUBJECT && subSubjIsHuman) {
							reuseSubjHonorific = isElderNoun(subSubjUnit);
						} else {
							mainClauseConstituents.push({
								role: arg.role,
								nounUnit: arg.nounUnit,
								particleType: arg.particleType
							});
						}
					}
					if (subSubjIsHuman && (arg.role !== K.SUBJECT || !arg.nounUnit)) {
						reuseSubjHonorific = isMainHonVerb || isElderNoun(subSubjUnit);
					}
				} else {
					const dvSubjCands = filterBySet(getSubjectCandidatesForDescriptiveVerb(mainVerb), options, targetId);
					const subSubjValidForMainDv = subSubjUnit && dvSubjCands.some(n => n[DATA_SCHEMA.Id] === subSubjUnit[DATA_SCHEMA.Id]);
					if (subSubjIsHuman && subSubjValidForMainDv) {
						reuseSubjHonorific = isMainHonVerb || isElderNoun(subSubjUnit);
					} else {
						const subj = pickRandom(dvSubjCands);
						if (subj) {
							mainClauseConstituents.push({
								role: K.SUBJECT,
								nounUnit: subj,
								particleType: K.SUBJECT
							});
						}
					}
				}
				mainPred = {
					role: K.PREDICATE,
					predType: isAction ? K.ACTION : K.DESCRIPTIVE,
					verbUnit: mainVerb,
					tense,
					politeness,
					speechAct,
					polarity: K.AFFIRMATIVE,
					...(reuseSubjHonorific ? { honorific: true } : {})
				};
			}
			clauses.push(subRes, { constituents: mainClauseConstituents, predicate: mainPred });
		}
	} else {
		const singleClause = expandFormulaIntoClause(formula, grammarUnit, tense, politeness, options, targetId, false);
		clauses.push(singleClause);
	}

	return {
		ok: true,
		ast: {
			type: "Sentence",
			targetUnitId: targetId,
			grammarUnit,
			speechAct,
			politeness,
			tense,
			polarity: hasTag(grammarUnit, K.NEGATIVE, K.INABILITY, K.PROHIBITION) ? K.NEGATIVE : K.AFFIRMATIVE,
			clauses
		}
	};
}

/**
 * Expands a single-clause Grammar formula into a ClauseAST `{ constituents, predicate }`.
 */
function expandFormulaIntoClause(formula, grammarUnit, tense, politeness, options, targetId, isSubordinate) {
	const constituents = [];
	let predicate = null;

	const isInterrogative = formula.includes("?") || hasTag(grammarUnit, K.INTERROGATIVE);
	const isClauseNeg = hasTag(grammarUnit, K.NEGATIVE, K.INABILITY, K.PROHIBITION) || HC.UNITGEN_EXPAND_FORMULA_INTO_CLAUSE_FORMULA_INCLUDES_ONE_OF.some(_w => formula.includes(_w));
	const isClauseInability = hasTag(grammarUnit, K.INABILITY) || formula.includes("못");
	const isClauseImperative = hasTag(grammarUnit, K.IMPERATIVE);
	const isClausePropositive = hasTag(grammarUnit, K.PROPOSITIVE);
	const avs = getAllUnitsOfPos(K.ACTION_VERB, options, targetId).filter(v => {
		if (v[DATA_SCHEMA.Id] === targetId) return true;
		if (!isInterrogative && hasTag(v, K.QUESTION_WORD, K.INTERROGATIVE)) return false;
		if (isClauseNeg && state.FORBIDDEN_NEGATIVE_ROOTS.has(v[DATA_SCHEMA.Korean])) return false;
		if (isClauseInability && !canTakeMood(v, K.INABILITY)) return false;
		if (isClauseImperative && !canTakeMood(v, K.IMPERATIVE)) return false;
		if (isClausePropositive && !canTakeMood(v, K.PROPOSITIVE)) return false;
		if ((isClausePropositive || isClauseImperative) && (HC.UNITGEN_EXPAND_FORMULA_INTO_CLAUSE_V_DATA_SCHEMA_KOREAN_ONE_OF).has(v[DATA_SCHEMA.Korean])) return false;
		if (isClausePropositive && ((HC.UNITGEN_EXPAND_FORMULA_INTO_CLAUSE_V_DATA_SCHEMA_KOREAN_ONE_OF_2).has(v[DATA_SCHEMA.Korean]) || state.HONORIFIC_WORDS.has(v[DATA_SCHEMA.Korean]) || hasTag(v, K.HONORIFIC, "honorificVerb"))) return false;
		return true;
	});
	const dvs = getAllUnitsOfPos(K.DESCRIPTIVE_VERB, options, targetId).filter(v => {
		if (v[DATA_SCHEMA.Id] === targetId) return true;
		if (!isInterrogative && hasTag(v, K.QUESTION_WORD, K.INTERROGATIVE)) return false;
		if (isClauseNeg && state.FORBIDDEN_NEGATIVE_ROOTS.has(v[DATA_SCHEMA.Korean])) return false;
		if (tense !== K.PAST && (HC.UNITGEN_EXPAND_FORMULA_INTO_CLAUSE_V_DATA_SCHEMA_KOREAN_ONE_OF_3).has(v[DATA_SCHEMA.Korean])) return false;
		return true;
	});
	const allNouns = getAllUnitsOfPos(K.NOUN, options, targetId).filter(
		n => !hasTag(n, K.MEASUREWORD, K.COUNTER)
			&& n[DATA_SCHEMA.Korean] !== "이"
			&& !(hasTag(n, "colloquial") && parseSemanticData(n).polarity === -1)
			&& (isInterrogative || (!hasTag(n, K.QUESTION_WORD, K.INTERROGATIVE) && !(HC.UNITGEN_EXPAND_FORMULA_INTO_CLAUSE_N_DATA_SCHEMA_KOREAN_ONE_OF).has(n[DATA_SCHEMA.Korean])))
	);

	// Match tokens with their immediately following literal suffix up to the next space or token
	const tokenWithSuffixRegex = /(\{[^}]+\})([^\s{]*)|([^\s{}]+)/g;
	let m;
	while ((m = tokenWithSuffixRegex.exec(formula)) !== null) {
		if (m[3]) {
			// Standalone literal word in template (e.g. "얼마나", "안", "못", "더")
			const literalWord = resolvePureMorphology(m[3], state);
			constituents.push({
				role: "modifier",
				unit: grammarUnit,
				explicitSurfaceKo: literalWord,
				particleUnit: null
			});
			continue;
		}

		const rawToken = m[1];
		const suffix = m[2] || "";
		const inner = rawToken.slice(1, -1);
		const [tokenType, tag] = inner.split(":");

		if (tokenType === "VP_AVst" || tokenType === "AVst" || tokenType === "VP_DVst" || tokenType === "DVst") {
			const isAction = tokenType.includes("AVst");
			const restOfFormula = formula.slice(m.index + m[0].length).trim();
			const hasMoreTokens = /\{[^}]+\}/.test(restOfFormula);
			let chosenVerb = isAction ? (pickRandom(avs) || pickRandom(dvs)) : (pickRandom(dvs) || pickRandom(avs));
			if (isAction && (isClausePropositive || isClauseImperative) && avs.length > 0 && (tokenType === "VP_AVst" || !hasMoreTokens)) {
				const propPool = avs.filter(v => {
					if (isIntransitiveVerb(v) || getVerbParticleType(v) !== K.OBJECT) return true;
					const argCheck = selectArgumentForActionVerb(v, options, targetId);
					return Boolean(argCheck && argCheck.nounUnit);
				});
				if (propPool.length > 0 && chosenVerb && !propPool.includes(chosenVerb)) {
					chosenVerb = pickRandom(propPool);
				}
			}
			if (!chosenVerb) continue;

			// Add argument if VP_* or if bare AVst/DVst is the main predicate with no prior arguments
			if (tokenType === "VP_AVst" || (tokenType === "AVst" && !hasMoreTokens && constituents.length === 0)) {
				const arg = selectArgumentForActionVerb(chosenVerb, options, targetId);
				if (arg.nounUnit && !((isClausePropositive || isClauseImperative) && arg.role === K.SUBJECT)) {
					const cVerbKo = chosenVerb[DATA_SCHEMA.Korean];
					const isDativeArg = arg.particleType === K.DATIVE || arg.role === K.RECIPIENT || arg.role === K.DATIVE;
					let finalArgNoun = arg.nounUnit;
					if (isDativeArg && !cVerbKo.includes("드리") && cVerbKo !== "여쭙다" && isElderNoun(finalArgNoun)) {
						const nonElders = getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => (HC.UNITGEN_EXPAND_FORMULA_INTO_CLAUSE_N_DATA_SCHEMA_KOREAN_ONE_OF_2).has(n[DATA_SCHEMA.Korean]));
						if (nonElders.length > 0) finalArgNoun = pickRandom(nonElders, options.seedOffset, options);
					}
					constituents.push({
						role: arg.role,
						nounUnit: finalArgNoun,
						particleType: arg.particleType
					});
					if (isDativeArg && (HC.UNITGEN_EXPAND_FORMULA_INTO_CLAUSE_CVERBKO_ONE_OF).has(cVerbKo)) {
						let objCands = cVerbKo === "가르치다"
							? getAllUnitsOfPos(K.NOUN, options, targetId).filter(n => !hasTag(n, K.MEASUREWORD, K.COUNTER, K.PERSON, K.PLACE, K.PROPER_NOUN) && (hasTag(n, "language", K.ACADEMIC, "hobby", "sport") || (HC.UNITGEN_EXPAND_FORMULA_INTO_CLAUSE_N_DATA_SCHEMA_KOREAN_ONE_OF_3).has(n[DATA_SCHEMA.Korean])))
							: filterBySet(getNounCandidatesForVerb(chosenVerb), options, targetId).filter(n => !hasTag(n, K.MEASUREWORD, K.COUNTER, K.PERSON, K.PLACE, K.PROPER_NOUN));
						const objNoun = pickRandom(objCands, options.seedOffset, options);
						if (objNoun) {
							constituents.push({
								role: K.OBJECT,
								nounUnit: objNoun,
								particleType: K.OBJECT
							});
						}
					}
				}
			} else if (tokenType === "VP_DVst" || (tokenType === "DVst" && !hasMoreTokens && constituents.length === 0)) {
				const subjCands = filterBySet(getSubjectCandidatesForDescriptiveVerb(chosenVerb), options, targetId);
				const subj = pickRandom(subjCands) || pickRandom(allNouns);
				if (subj) {
					constituents.push({
						role: K.SUBJECT,
						nounUnit: subj,
						particleType: K.SUBJECT
					});
				}
			}

			if (!hasMoreTokens && restOfFormula.length > 0) {
				const fullSuffix = suffix + " " + restOfFormula;
				predicate = {
					role: K.PREDICATE,
					predType: isAction ? K.ACTION : K.DESCRIPTIVE,
					verbUnit: chosenVerb,
					grammarUnit,
					connectiveSuffix: fullSuffix,
					tense,
					politeness
				};
				break;
			} else {
				const predNode = {
					role: K.PREDICATE,
					predType: isAction ? K.ACTION : K.DESCRIPTIVE,
					verbUnit: chosenVerb,
					grammarUnit,
					connectiveSuffix: suffix || "아/어요",
					tense,
					politeness
				};
				if (hasMoreTokens) {
					const stem = getConjugatedStem(chosenVerb[DATA_SCHEMA.Korean], chosenVerb[DATA_SCHEMA.Conjugation]);
					const realizedMod = resolvePureMorphology(stem + suffix, state);
					constituents.push({
						role: "adverbial",
						unit: chosenVerb,
						particleUnit: grammarUnit,
						explicitSurfaceKo: realizedMod
					});
				} else {
					predicate = predNode;
				}
			}
		} else if (tokenType === "N" || tokenType === K.NOUN || tokenType === "N_Phrase") {
			let pool = allNouns;
			if (isNameSuffixGrammar(grammarUnit)) {
				pool = allNouns.filter(isPersonalName);   // never any other noun (buildASTForGrammarUnit fails first when there is none)
			} else {
				const isHonParticle = hasTag(grammarUnit, K.HONORIFIC) || (grammarUnit[DATA_SCHEMA.Korean] || "").includes("께서") || (grammarUnit[DATA_SCHEMA.Korean] || "").includes("께");
				if (isHonParticle) {
					const elders = allNouns.filter(
						n => isElderNoun(n)
							&& hasTag(n, K.PERSON, K.FAMILY, K.PROFESSION, "kinship_elder", "elder", K.ELDER_NOUN, "honorific_person")
							&& !(HC.UNITGEN_EXPAND_FORMULA_INTO_CLAUSE_N_DATA_SCHEMA_KOREAN_ONE_OF_5).has(n[DATA_SCHEMA.Korean])
					);
					if (elders.length > 0) pool = elders;
				} else if (tag) {
					const tagged = allNouns.filter(n => hasTag(n, tag));
					if (tagged.length > 0) pool = tagged;
				}
			}
			const restOfFormula = formula.slice(m.index + m[0].length).trim();
			const hasMoreTokens = /\{[^}]+\}/.test(restOfFormula);
			const isCopulaEnding = !hasMoreTokens && (HC.UNITGEN_EXPAND_FORMULA_INTO_CLAUSE_SUFFIX_INCLUDES_ONE_OF_3.some(_w => suffix.includes(_w)) || restOfFormula.includes("아니에요"));

			if (isCopulaEnding) {
				const copulaNouns = pool.filter(n =>
					hasTag(n, K.PROFESSION, "job", "status", "role", "nationality", K.OBJECT, K.FOOD, "animal", "fruit")
					&& !hasTag(n, "name")
					&& !(hasTag(n, "colloquial") && parseSemanticData(n).polarity === -1)
				);
				if (copulaNouns.length > 0) pool = copulaNouns;
			}

			const chosenNoun = pickRandom(pool) || allNouns[0];
			if (!chosenNoun) continue;

			if (isCopulaEnding) {
				const fullCopula = resolvePureMorphology(chosenNoun[DATA_SCHEMA.Korean] + suffix + (restOfFormula ? " " + restOfFormula : ""), state);
				const isHumanComp = hasTag(chosenNoun, K.PERSON, K.PROFESSION, "job", "status", "role", "nationality");
				let subj = null;
				if (isHumanComp) {
					const humanPronouns = getAllUnitsOfPos(K.PRONOUN, options, targetId).filter(p => (HC.UNITGEN_EXPAND_FORMULA_INTO_CLAUSE_P_DATA_SCHEMA_KOREAN_ONE_OF).has(p[DATA_SCHEMA.Korean]));
					subj = pickRandom(humanPronouns) || selectSubjectUnit(options, targetId, false);
				} else {
					const thingPronouns = getAllUnitsOfPos(K.PRONOUN, options, targetId).filter(p => (HC.UNITGEN_EXPAND_FORMULA_INTO_CLAUSE_P_DATA_SCHEMA_KOREAN_ONE_OF_2).has(p[DATA_SCHEMA.Korean]));
					subj = pickRandom(thingPronouns);
				}
				if (subj && subj[DATA_SCHEMA.Id] !== chosenNoun[DATA_SCHEMA.Id]) {
					constituents.push({
						role: K.TOPIC,
						nounUnit: subj,
						particleType: K.TOPIC
					});
				}
				predicate = {
					role: K.PREDICATE,
					predType: K.COPULA,
					copulaNounUnit: chosenNoun,
					grammarUnit,
					explicitSurfaceKo: fullCopula,
					polarity: restOfFormula.includes("아니") ? K.NEGATIVE : K.AFFIRMATIVE,
					tense,
					politeness
				};
				break;
			} else {
				const gKo = grammarUnit[DATA_SCHEMA.Korean] || "";
				const inferredRole = (hasTag(grammarUnit, K.TOPIC) || suffix.includes("은/는")) ? K.TOPIC
					: (hasTag(grammarUnit, K.SUBJECT) || HC.UNITGEN_EXPAND_FORMULA_INTO_CLAUSE_SUFFIX_INCLUDES_ONE_OF_2.some(_w => suffix.includes(_w))) ? K.SUBJECT
					: (hasTag(grammarUnit, K.OBJECT) || suffix.includes("을/를")) ? K.OBJECT
					: (hasTag(grammarUnit, K.DATIVE) || HC.UNITGEN_EXPAND_FORMULA_INTO_CLAUSE_SUFFIX_INCLUDES_ONE_OF.some(_w => suffix.includes(_w)) || suffix === "께") ? K.RECIPIENT
					: (tag === K.PLACE || hasTag(grammarUnit, K.LOCATION, "location_action", K.DIRECTION, "directional")) ? K.LOCATION
					: (tag === K.TIME || hasTag(grammarUnit, K.TIME, "temporal")) ? K.TIME
					: "noun_phrase";
				const inferredParticleType = inferredRole === K.LOCATION
					? (suffix.includes("에서") ? "location_dynamic" : "location_static")
					: (inferredRole === K.RECIPIENT ? K.DATIVE : (inferredRole !== "noun_phrase" ? inferredRole : null));

				const isSsiPattern = grammarUnit[DATA_SCHEMA.Korean] === "씨" || targetId === 23;
				const ssiParticle = isSsiPattern && !hasMoreTokens ? "가" : "";
				const finalInferredRole = isSsiPattern && !hasMoreTokens ? K.SUBJECT : inferredRole;
				const finalInferredParticleType = isSsiPattern && !hasMoreTokens ? K.SUBJECT : inferredParticleType;
				const joiner = (suffix === "씨" || suffix.startsWith("씨")) ? " " : "";
				const withSuffix = resolvePureMorphology(chosenNoun[DATA_SCHEMA.Korean] + joiner + suffix + ssiParticle, state);
				constituents.push({
					role: finalInferredRole,
					nounUnit: chosenNoun,
					particleType: finalInferredParticleType,
					particleUnit: suffix ? grammarUnit : null,
					explicitSurfaceKo: withSuffix
				});

				// If restOfFormula is a literal verb like "있어요" or "없어요", turn it into the predicate!
				if (!hasMoreTokens && (HC.UNITGEN_EXPAND_FORMULA_INTO_CLAUSE_RESTOFFORMULA_ONE_OF.includes(restOfFormula))) {
					const existKo = restOfFormula === "없어요" ? "없다" : "있다";
					const existUnit = dvs.find(v => v[DATA_SCHEMA.Korean] === existKo) || getLexiconIndex().verbByKo.get(existKo);
					if (existUnit) {
						const fig = selectSubjectUnit(options, targetId, false);
						if (fig && fig[DATA_SCHEMA.Id] !== chosenNoun[DATA_SCHEMA.Id]) {
							constituents.push({
								role: K.SUBJECT,
								nounUnit: fig,
								particleType: K.SUBJECT
							});
						}
						predicate = {
							role: K.PREDICATE,
							predType: K.DESCRIPTIVE,
							verbUnit: existUnit,
							tense: K.PRESENT,
							politeness: "polite",
							polarity: restOfFormula === "없어요" ? K.NEGATIVE : K.AFFIRMATIVE
						};
						break;
					}
				}
			}
		} else if (tokenType.startsWith("Adv")) {
			const advUnit = selectAdverbUnit(false, K.AFFIRMATIVE, options, targetId);
			if (advUnit) {
				constituents.push({
					role: K.ADVERB,
					unit: advUnit,
					particleType: null
				});
			}
		} else if (tokenType === K.NUMBER) {
			const numStr = getSinoNumber(3);
			const withSuffix = resolvePureMorphology(numStr + suffix, state);
			constituents.push({
				role: "number",
				unit: grammarUnit,
				explicitSurfaceKo: withSuffix
			});
			const restOfFormula = formula.slice(m.index + m[0].length).trim();
			if (restOfFormula === "세자") {
				const countVerb = avs.find(v => v[DATA_SCHEMA.Korean] === "세다") || getLexiconIndex().verbByKo.get("세다") || pickRandom(avs);
				if (countVerb) {
					predicate = {
						role: K.PREDICATE,
						predType: K.ACTION,
						verbUnit: countVerb,
						grammarUnit,
						connectiveSuffix: "자",
						tense: K.PRESENT,
						politeness: "plain",
						speechAct: K.PROPOSITIVE
					};
					break;
				}
			}
		}
	}

	// If formula was a particle/nominal pattern without a predicate (e.g. "{N}은/는", "{N}이/가", "{N}을/를", "{N:person}께서"),
	// keep the particle constituent and attach a compatible verb predicate!
	if (!predicate && !isSubordinate && constituents.length > 0) {
		const firstCon = constituents[0];
		const baseNoun = firstCon.nounUnit || firstCon.unit;
		if (constituents.length === 1 && baseNoun) {
			const role = firstCon.role;
			const isElder = (grammarUnit[DATA_SCHEMA.Korean] !== "씨" && targetId !== 23) && (isElderNoun(baseNoun) || hasTag(grammarUnit, K.HONORIFIC));
			if (role === K.OBJECT) {
				const sub = selectSubjectUnit(options, targetId, false);
				if (sub && sub[DATA_SCHEMA.Id] !== baseNoun[DATA_SCHEMA.Id]) {
					constituents.unshift({
						role: K.TOPIC,
						nounUnit: sub,
						particleType: K.TOPIC
					});
				}
				const transitiveAvs = avs.filter(v => !isIntransitiveVerb(v) && getVerbParticleType(v) === K.OBJECT);
				const av = selectActionVerbForNoun(baseNoun, options, targetId) || pickRandom(transitiveAvs) || pickRandom(avs);
				if (av) {
					predicate = {
						role: K.PREDICATE,
						predType: K.ACTION,
						verbUnit: av,
						tense,
						politeness
					};
				}
			} else {
				const nonHumbleAVs = avs.filter(v => !state.HUMBLE_WORDS.has(v[DATA_SCHEMA.Korean]));
				const chosenV = isElder
					? (pickRandom(nonHumbleAVs) || pickRandom(dvs))
					: (selectDescriptiveVerbForNoun(baseNoun, { ...options, tense }, targetId) || selectActionVerbForNoun(baseNoun, options, targetId) || pickRandom(dvs) || pickRandom(avs));
				if (chosenV) {
					if ((HC.UNITGEN_EXPAND_FORMULA_INTO_CLAUSE_CHOSENV_DATA_SCHEMA_KOREAN_ONE_OF).has(chosenV[DATA_SCHEMA.Korean]) && !options.tense) {
						tense = K.PAST;
					}
					const isAct = chosenV[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB;
					if (isAct && (role === K.TOPIC || role === K.SUBJECT)) {
						const arg = selectArgumentForActionVerb(chosenV, options, targetId);
						if (arg.nounUnit && arg.nounUnit[DATA_SCHEMA.Id] !== baseNoun[DATA_SCHEMA.Id]) {
							constituents.push({
								role: arg.role,
								nounUnit: arg.nounUnit,
								particleType: arg.particleType
							});
						}
					}
					predicate = {
						role: K.PREDICATE,
						predType: isAct ? K.ACTION : K.DESCRIPTIVE,
						verbUnit: chosenV,
						tense,
						politeness,
						honorific: isElder
					};
				}
			}
		} else {
			const lastCon = constituents[constituents.length - 1];
			const lastNoun = lastCon.nounUnit || lastCon.unit;
			if (lastNoun && lastNoun[DATA_SCHEMA.PartofSpeech] === K.NOUN) {
				predicate = {
					role: K.PREDICATE,
					predType: K.COPULA,
					copulaNounUnit: lastNoun,
					tense: K.PRESENT,
					politeness: "polite"
				};
				constituents.pop();
			}
		}
	}

	return { constituents, predicate };
}

/**
 * Generates a single grammatical, semantically concordant sentence for `unitOrId`.
 *
 * @param {number|Array} unitOrId Target Language Unit or its numeric ID
 * @param {Object} [options] Generation options (`variationIndex`, `onlyFromSet`, `allowedUnitIds`, `tense`, `politeness`)
 * @returns {Object} Realized sentence object with `{ ok, ko, pronunciation, ast, eojeols, unitsUsed, unitIds, tree }`
 */
/** Entry point. options.preferUnitIds / options.slotBias steer slot picks (see argument_concord.js); both are optional. */
function generateSentenceForUnit(unitOrId, options = {}) {
	if (!options || (!options.preferUnitIds && !options.slotBias)) return generateSentenceForUnitImpl(unitOrId, options);
	const prev = setPickSteering({ preferUnitIds: options.preferUnitIds, slotBias: options.slotBias });
	try { return generateSentenceForUnitImpl(unitOrId, options); } finally { setPickSteering(prev); }
}

function generateSentenceForUnitImpl(unitOrId, options = {}) {
	const units = dataModule.KR_EN_languageUnits || (typeof window !== 'undefined' ? window.KR_EN_languageUnits : []);
	const targetUnit = Array.isArray(unitOrId) ? unitOrId : (typeof unitOrId === "number" && units ? units[unitOrId] : null);

	if (!targetUnit) {
		return {
			ok: false,
			insufficientSet: false,
			missingRoles: [],
			message: `Language unit not found: ${unitOrId}`
		};
	}

	if (options.onlyFromSet && (!options.allowedUnitIds || options.allowedUnitIds.size === 0)) {
		return {
			ok: false,
			insufficientSet: true,
			missingRoles: ["Active Set is empty"],
			message: "Your active practice set is empty. Select some language units on the left to generate sentences from your set."
		};
	}

	const pos = targetUnit[DATA_SCHEMA.PartofSpeech];
	const variationIndex = typeof options.variationIndex === "number" ? options.variationIndex : 0;

	let buildRes;
	if (pos === K.ACTION_VERB) {
		buildRes = buildASTForActionVerb(targetUnit, variationIndex, options);
	} else if (pos === K.DESCRIPTIVE_VERB) {
		buildRes = buildASTForDescriptiveVerb(targetUnit, variationIndex, options);
	} else if (pos === K.NOUN || pos === K.PRONOUN) {
		buildRes = buildASTForNominal(targetUnit, variationIndex, options);
	} else if (pos === K.POS_GRAMMAR) {
		buildRes = buildASTForGrammarUnit(targetUnit, variationIndex, options);
	} else {
		buildRes = buildASTForModifierOrParticleLike(targetUnit, variationIndex, options);
	}

	if (!buildRes || !buildRes.ok) {
		return buildRes || {
			ok: false,
			insufficientSet: true,
			missingRoles: ["Compatible Words"],
			message: "Could not build a sentence with the current constraints."
		};
	}

	const realized = realizeKoreanFromAST(buildRes.ast);
	let sentenceValidatorModule;
	try {
		sentenceValidatorModule = (typeof require !== 'undefined') ? require('./sentence_validator.js') : (typeof window !== 'undefined' ? window : null);
	} catch (e) {
		sentenceValidatorModule = null;
	}
	if (sentenceValidatorModule && typeof sentenceValidatorModule.validateSentenceAST === 'function') {
		const valRes = sentenceValidatorModule.validateSentenceAST(buildRes.ast, realized);
		if (valRes && !valRes.valid && valRes.errors.length > 0) {
			return {
				ok: false,
				insufficientSet: false,
				missingRoles: [],
				message: `Generated AST failed semantic validation: ${valRes.errors.map(e => e.message).join('; ')}`
			};
		}
	}
	return {
		ok: true,
		insufficientSet: false,
		targetUnitId: targetUnit[DATA_SCHEMA.Id],
		...realized
	};
}

/**
 * Generates `count` diverse example sentences for `unitOrId`.
 */
function generateSentencesForUnit(unitOrId, count = 3, options = {}) {
	const sentences = [];
	const seenKo = new Set();
	const maxAttempts = count * 4;

	for (let attempt = 0; attempt < maxAttempts && sentences.length < count; attempt++) {
		const targetIdx = sentences.length;
		const tier = (targetIdx === 0) ? 'easiest' : (count >= 3 && targetIdx === count - 1 ? 'challenging' : 'easy_and_inset');
		const res = generateSentenceForUnit(unitOrId, {
			...options,
			difficultyTier: tier,
			variationIndex: attempt
		});
		if (!res.ok) {
			if (sentences.length === 0) {
				return {
					ok: false,
					insufficientSet: Boolean(res.insufficientSet),
					missingRoles: res.missingRoles || [],
					message: res.message || "Insufficient language units in set.",
					sentences: []
				};
			}
			break;
		}
		if (res.ko && !seenKo.has(res.ko)) {
			seenKo.add(res.ko);
			res.difficultyTier = tier;
			res.difficultyLabel = (tier === 'easiest' ? 'Easiest' : (tier === 'easy_and_inset' ? 'Easy + In-Set' : 'Challenging'));
			sentences.push(res);
		}
	}

	// Pad if fewer than `count` unique variations were possible from a tiny set
	while (sentences.length > 0 && sentences.length < count) {
		const res = generateSentenceForUnit(unitOrId, {
			...options,
			variationIndex: sentences.length
		});
		if (res.ok && res.ko) {
			sentences.push(res);
		} else {
			break;
		}
	}

	return {
		ok: sentences.length > 0,
		insufficientSet: false,
		missingRoles: [],
		message: null,
		sentences
	};
}

const unitGeneratorExports = {
	generateSentenceForUnit,
	generateSentencesForUnit,
	generateSingleUnitSentenceAST: generateSentenceForUnit,
	generateUnitSentencesAST: generateSentencesForUnit,
	buildASTForActionVerb,
	buildASTForDescriptiveVerb,
	buildASTForNominal,
	buildASTForModifierOrParticleLike,
	buildASTForGrammarUnit
};

if (typeof window !== 'undefined') {
	Object.assign(window, unitGeneratorExports);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = unitGeneratorExports;
}
})();
