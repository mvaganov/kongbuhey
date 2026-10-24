/**
 * korean/analyzer/syntax_frame.js
 *
 * SyntaxFrame Evaluation Engine, Semantic Ontology Cross-Checking,
 * and Pedagogical Homonym Disambiguation.
 *
 * Platform: Node.js & Browser (Vanilla JS, zero dependencies).
 */

const { DATA_SCHEMA, decomposeHangul, getStem } =
	(typeof require !== 'undefined' ? require('../core/primitives.js') : window);

const SEMANTIC_ONTOLOGY = Object.freeze({
	place: new Set(["place", "country", "place_indoor", "place_outdoor", "location", "institution", "world"]),
	time: new Set(["time", "duration", "frequency", "point_in_time", "counter", "past", "present", "future"]),
	tool: new Set(["tool", "vehicle", "language", "material", "device", "transportation", "instrument"]),
	role: new Set(["role", "profession", "person", "family", "social"]),
	abstract: new Set(["abstract", "concept", "culture", "cognition", "emotion"]),
	movement: new Set(["movement", "motion", "travel", "intransitive_motion", "entry"]),
	stative: new Set(["stative", "existence", "property", "state", "descriptive"]),
	cognition: new Set(["cognition", "mental", "emotion", "communication"])
});

/**
 * Retrieves cached semantic tags for a unit, or extracts them dynamically.
 */
function getUnitSemanticTags(unit, index) {
	if (!unit) return new Set();
	const unitId = unit[DATA_SCHEMA.Id];
	if (index && index.semanticTagsByUnitId && index.semanticTagsByUnitId.has(unitId)) {
		return index.semanticTagsByUnitId.get(unitId);
	}

	const tags = new Set();
	const rawTags = unit[DATA_SCHEMA.SemanticTags];
	if (Array.isArray(rawTags)) {
		rawTags.forEach(t => tags.add(t));
	} else if (rawTags instanceof Set) {
		rawTags.forEach(t => tags.add(t));
	}

	const rawVec = unit[DATA_SCHEMA.SemanticVector];
	if (rawVec && typeof rawVec === 'string') {
		try {
			const v = JSON.parse(rawVec);
			if (v.domain) tags.add(v.domain);
			if (v.type) tags.add(v.type);
			if (v.field) tags.add(v.field);
		} catch (_) { }
	}
	return tags;
}

/**
 * Checks if a language unit satisfies a semantic category expression (e.g. "place", "tool|vehicle|language").
 */
function matchesSemanticCategory(unit, categoryExpr, index) {
	if (!unit) return false;
	const unitTags = getUnitSemanticTags(unit, index);
	const requiredCategories = categoryExpr.split('|');

	for (const cat of requiredCategories) {
		if (unitTags.has(cat)) return true;
		const mappedSet = SEMANTIC_ONTOLOGY[cat];
		if (mappedSet) {
			for (const t of unitTags) {
				if (mappedSet.has(t)) return true;
			}
		}
	}
	return false;
}

/**
 * Evaluates whether a language unit's SyntaxFrame constraint is satisfied in the given context.
 * 
 * @param {Array} unit Language unit row from data.js
 * @param {Object} context Surrounding syntactic context
 * @param {Object} index Fast lookup index
 * @returns {Object} { matches: boolean, score: number, reason: string }
 */
function evaluateSyntaxFrame(unit, context = {}, index = null) {
	const frame = unit[DATA_SCHEMA.SyntaxFrame];
	if (!frame || frame.trim() === "") {
		return { matches: true, score: 0.5, reason: "No SyntaxFrame constraint specified" };
	}

	const {
		tokenSurface,
		attachedParticle,
		attachedEnding,
		prevWord,
		nextWord,
		prevUnit,
		nextUnit,
		nounStemUnit,
		clausePredicate
	} = context;

	// Pattern 1: Standalone word preceding a Noun: ^_\s+{Noun}
	if (frame.includes("^") && frame.includes("{Noun}")) {
		const isStandalone = !attachedParticle && !attachedEnding;
		const nextIsNoun = nextUnit && (nextUnit[DATA_SCHEMA.PartofSpeech] === 'Noun' || nextUnit[DATA_SCHEMA.PartofSpeech] === 'Pronoun');
		const nextLooksLikeNoun = nextWord && /^[가-힣]+/.test(nextWord);

		if (isStandalone && (nextIsNoun || nextLooksLikeNoun)) {
			return {
				matches: true,
				score: 1.0,
				reason: `Satisfies frame '${frame}': Standalone modifier preceding noun '${nextWord || (nextUnit ? nextUnit[DATA_SCHEMA.Korean] : "")}'`
			};
		}
		return { matches: false, score: 0.0, reason: `Fails frame '${frame}': Requires following noun` };
	}

	// Pattern 2: Attaches directly to a Particle: _\+{Particle}
	if (frame.includes("_\\+{Particle}")) {
		if (attachedParticle) {
			return {
				matches: true,
				score: 1.0,
				reason: `Satisfies frame '${frame}': Cliticized case/topic particle '${attachedParticle}' attached to base`
			};
		}
		return { matches: false, score: 0.1, reason: `Fails frame '${frame}': Requires attached particle` };
	}

	// Pattern 3: Number followed by Counter or Counter/Time preceded by quantity
	if (frame.includes("{Counter}") || frame.includes("{Number}") || frame.includes("Counter:time") || frame.includes("Noun:time")) {
		if (frame.includes("Counter:time") || frame.includes("Noun:time")) {
			const cleanPrev = prevWord ? prevWord.replace(/[^\w가-힣]+/g, '') : "";
			const hasTimeOrNum = /\d/.test(prevWord || "") || /개월|년|달|일|시|분|초|시간|주/.test(cleanPrev);
			if (hasTimeOrNum) {
				return {
					matches: true,
					score: 1.0,
					reason: `Satisfies frame '${frame}': Preceded by temporal quantity or time noun '${cleanPrev}'`
				};
			}
		}
		if (frame.includes("{Number}\\s*_")) {
			const cleanPrev = prevWord ? prevWord.replace(/[^\w가-힣]+/g, '') : "";
			const precededByNum = prevWord && (/\d+$/.test(prevWord) || /\d/.test(cleanPrev) || (prevUnit && prevUnit[DATA_SCHEMA.PartofSpeech] === 'Number'));
			if (precededByNum || context.isNumericPhrase) {
				return {
					matches: true,
					score: 1.0,
					reason: `Satisfies frame '${frame}': Counter attached to numeric quantifier`
				};
			}
		}
		if (frame.includes("{Counter}")) {
			const followedByCounter = nextUnit && (nextUnit[DATA_SCHEMA.PartofSpeech] === 'Noun' && getUnitSemanticTags(nextUnit, index).has('counter'));
			if (followedByCounter) {
				return {
					matches: true,
					score: 1.0,
					reason: `Satisfies frame '${frame}': Number quantifier followed by classifier`
				};
			}
		}
	}

	// Pattern 4: Bound Grammar vs. Free Noun / Post-Adnominal Noun: {VP_adnominal}\s+후에, {VP_adnominal}\s*_
	if (frame.includes("{VP_adnominal}")) {
		const cleanPrev = prevWord ? prevWord.replace(/[^\w가-힣]+/g, '') : "";
		const dPrev = cleanPrev ? decomposeHangul(cleanPrev.slice(-1)) : null;
		const prevLooksAdnominal = cleanPrev && (
			cleanPrev.endsWith("는") || cleanPrev.endsWith("은") || cleanPrev.endsWith("한") ||
			(dPrev && (dPrev.final === 4 || dPrev.final === 8))
		);
		const isPrecededByAdnominal = context.isPrecededByAdnominalVerb || prevLooksAdnominal;
		if (isPrecededByAdnominal) {
			return {
				matches: true,
				score: 1.0,
				reason: `Satisfies frame '${frame}': Governed by preceding adnominal verb modifier '${cleanPrev}'`
			};
		}
		return { matches: false, score: 0.1, reason: `Fails frame '${frame}': Requires preceding adnominal verb modifier` };
	}

	// Pattern 5: Polysemous Particle -에 / -(으)로 Disambiguation
	if (frame.includes("{Noun:place}") || frame.includes("{Noun:time}") || frame.includes("{Noun:tool") || frame.includes("{Noun:abstract}")) {
		const targetNoun = nounStemUnit || prevUnit;
		const pred = clausePredicate;
		const predStem = pred ? getStem(pred[DATA_SCHEMA.Korean]) : "";
		const isMotionStem = index && index.motionVerbStems ? index.motionVerbStems.has(predStem) : false;
		const isStativeStem = index && index.stativeVerbStems ? index.stativeVerbStems.has(predStem) : false;

		// Direction: {Noun:place}\+에\s+.*{Verb:movement}
		if (frame.includes("{Verb:movement}")) {
			const isPlace = targetNoun && matchesSemanticCategory(targetNoun, "place", index);
			const isMotionPred = pred && (matchesSemanticCategory(pred, "movement", index) || isMotionStem);
			if (isPlace && isMotionPred) {
				return {
					matches: true,
					score: 1.0,
					reason: `Satisfies frame '${frame}': Destination place '${targetNoun[DATA_SCHEMA.Korean]}' with motion verb '${pred[DATA_SCHEMA.Korean]}'`
				};
			}
			if (isPlace) return { matches: true, score: 0.7, reason: `Place noun matches directional frame candidate` };
			return { matches: false, score: 0.1, reason: `Noun '${targetNoun ? targetNoun[DATA_SCHEMA.Korean] : ""}' is not a place or lacks motion predicate` };
		}

		// Static Location / Reference: {Noun:place}\+에\s+.*{Verb:stative}|{Noun:abstract}\+에
		if (frame.includes("{Verb:stative}") || frame.includes("{Noun:abstract}")) {
			const isPlace = targetNoun && matchesSemanticCategory(targetNoun, "place", index);
			const isAbstract = targetNoun && matchesSemanticCategory(targetNoun, "abstract", index);
			const isStativePred = pred && (matchesSemanticCategory(pred, "stative", index) || isStativeStem);

			if (isAbstract) {
				return {
					matches: true,
					score: 0.95,
					reason: `Satisfies frame '${frame}': Abstract topic/reference noun '${targetNoun[DATA_SCHEMA.Korean]}'`
				};
			}
			if (isPlace && isStativePred) {
				return {
					matches: true,
					score: 0.95,
					reason: `Satisfies frame '${frame}': Location place '${targetNoun[DATA_SCHEMA.Korean]}' with stative verb '${pred[DATA_SCHEMA.Korean]}'`
				};
			}
			if (isPlace && !pred) {
				return {
					matches: true,
					score: 0.7,
					reason: `Place noun satisfies locative frame`
				};
			}
		}

		// Time: {Noun:time}\+에
		if (frame.includes("{Noun:time}")) {
			const isTime = targetNoun && matchesSemanticCategory(targetNoun, "time", index);
			if (isTime) {
				return {
					matches: true,
					score: 1.0,
					reason: `Satisfies frame '${frame}': Temporal noun '${targetNoun[DATA_SCHEMA.Korean]}'`
				};
			}
			return { matches: false, score: 0.0, reason: `Noun '${targetNoun ? targetNoun[DATA_SCHEMA.Korean] : ""}' is not a time unit` };
		}

		// Tool / Means / Language: {Noun:tool|vehicle|language|material}\+으?로
		if (frame.includes("{Noun:tool|vehicle|language|material}")) {
			const isInstrument = targetNoun && matchesSemanticCategory(targetNoun, "tool|vehicle|language|material", index);
			if (isInstrument) {
				return {
					matches: true,
					score: 1.0,
					reason: `Satisfies frame '${frame}': Instrument/language/means noun '${targetNoun[DATA_SCHEMA.Korean]}'`
				};
			}
			return { matches: false, score: 0.1, reason: `Noun '${targetNoun ? targetNoun[DATA_SCHEMA.Korean] : ""}' is not tool/vehicle/language` };
		}
	}

	// Pattern 6: Verb Connective vs. Lexical Particle: {VP}\+고 vs. {Noun}\+하고
	if (frame.includes("{VP}\\+고")) {
		if (context.isVerbStem) {
			return {
				matches: true,
				score: 1.0,
				reason: `Satisfies frame '${frame}': Connective '-고' attaching to verb stem`
			};
		}
		return { matches: false, score: 0.0, reason: `Fails frame '${frame}': Target base is not a verb stem` };
	}
	if (frame.includes("{Noun}\\+하고")) {
		if (context.isNounStem) {
			return {
				matches: true,
				score: 1.0,
				reason: `Satisfies frame '${frame}': Comitative nominal particle attached to noun`
			};
		}
		return { matches: false, score: 0.0, reason: `Fails frame '${frame}': Target base is not a noun` };
	}

	return { matches: true, score: 0.5, reason: `General match for frame '${frame}'` };
}

/**
 * Disambiguates between homonym candidates using SyntaxFrame and semantic tags.
 * Preserves pedagogical ambiguity when two interpretations are equally valid.
 */
function disambiguateCandidates(candidates, context, index = null) {
	if (!candidates || candidates.length === 0) return null;
	if (candidates.length === 1) {
		return {
			chosenUnit: candidates[0],
			confidence: 1.0,
			rule: `Unambiguous unit ID ${candidates[0][DATA_SCHEMA.Id]}`
		};
	}

	const scored = [];
	for (const unit of candidates) {
		const evalRes = evaluateSyntaxFrame(unit, context, index);
		scored.push({ unit, ...evalRes });
	}

	// Sort by descending score
	scored.sort((a, b) => b.score - a.score);

	const top = scored[0];
	const second = scored[1];

	// Intentional Pedagogical Ambiguity Check
	if (top.score > 0 && second.score > 0 && Math.abs(top.score - second.score) < 0.15) {
		return {
			chosenUnit: top.unit,
			confidence: top.score,
			intentional_ambiguity: true,
			competingUnits: [top.unit, second.unit],
			rule: `Intentional Pedagogical Ambiguity: Context supports both ID ${top.unit[DATA_SCHEMA.Id]} ("${top.unit[DATA_SCHEMA.English]}") and ID ${second.unit[DATA_SCHEMA.Id]} ("${second.unit[DATA_SCHEMA.English]}"). Frame evaluation: ${top.reason}`
		};
	}

	return {
		chosenUnit: top.unit,
		confidence: top.score,
		rule: top.reason
	};
}

if (typeof window !== 'undefined') {
	window.SEMANTIC_ONTOLOGY = SEMANTIC_ONTOLOGY;
	window.getUnitSemanticTags = getUnitSemanticTags;
	window.matchesSemanticCategory = matchesSemanticCategory;
	window.evaluateSyntaxFrame = evaluateSyntaxFrame;
	window.disambiguateCandidates = disambiguateCandidates;
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		SEMANTIC_ONTOLOGY,
		getUnitSemanticTags,
		matchesSemanticCategory,
		evaluateSyntaxFrame,
		disambiguateCandidates
	};
}
