(function() {
/**
 * korean/concord/index.js
 *
 * Unified Concordance Subsystem Facade.
 * Re-exports all Korean concordance engines:
 * - argument_concord.js   (Subject, Object, Predicate, Container, Time, Adverb selection)
 * - adverbial_concord.js  (Adverb-Predicate & NPI concordance)
 * - classifier_concord.js (Numeral-Classifier-Noun concordance)
 * - spatial_concord.js    (Deictic & Locative-Verb concordance)
 * - mood_concord.js       (Mood, Modality & Negation concordance)
 * - clausal_validation.js (Inter-clausal connective concordance)
 */

const argumentConcord = (typeof require !== 'undefined') ? require('./argument_concord.js') : (typeof window !== 'undefined' ? window : {});
const adverbialConcord = (typeof require !== 'undefined') ? require('./adverbial_concord.js') : (typeof window !== 'undefined' ? window : {});
const classifierConcord = (typeof require !== 'undefined') ? require('./classifier_concord.js') : (typeof window !== 'undefined' ? window : {});
const spatialConcord = (typeof require !== 'undefined') ? require('./spatial_concord.js') : (typeof window !== 'undefined' ? window : {});
const moodConcord = (typeof require !== 'undefined') ? require('./mood_concord.js') : (typeof window !== 'undefined' ? window : {});
const clausalValidation = (typeof require !== 'undefined') ? require('./clausal_validation.js') : (typeof window !== 'undefined' ? window : {});

const concordExports = {
	...argumentConcord,
	...adverbialConcord,
	...classifierConcord,
	...spatialConcord,
	...moodConcord,
	...clausalValidation
};

if (typeof window !== 'undefined') {
	Object.assign(window, concordExports);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = concordExports;
}
})();

