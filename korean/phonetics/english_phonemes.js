/**
 * korean/phonetics/english_phonemes.js
 *
 * English-Readable Phoneme Transliteration Engine
 *
 * Converts Korean text into Latin phonetic transliterations specifically
 * optimized for Speech Synthesis (Web Speech API / TTS engines in English,
 * French, Polish, and other European languages).
 *
 * Key Optimizations:
 *  1. Resolves text through Standard Korean Pronunciation (getPronunciation) to
 *     apply all liaison, neutralization, batchim assimilation, and statutory exceptions.
 *  2. Eliminates double-consonant stutters:
 *     - ㄲ, ㅋ -> 'k' (single 'k' prevents TTS stuttering on tense stops)
 *     - ㅆ -> 's' (single 's' prevents TTS stuttering on tense sibilants)
 *     - ㄸ, ㅌ -> 't'
 *     - ㅃ, ㅍ -> 'p'
 *     - ㅉ, ㅊ -> 'j' / 'ch'
 *  3. Eliminates false-positive acronym spelling:
 *     - Vowels in closed syllables avoid un-English clusters like '-hn', '-hp', '-hm'
 *       (e.g. 'an' instead of 'ahn', 'man' instead of 'mahn'), preventing TTS engines
 *       from spelling out syllables letter-by-letter.
 *  4. Sibilant Palatalization:
 *     - ㅅ/ㅆ before i or y* palatalizes to 'sh' (e.g. 식사 -> 'shiksa', 샤워 -> 'shawa').
 *  5. Fluent Syllable Joining Modes:
 *     - 'natural' (default): Joins syllables into natural whole words (e.g. 'Annyeong haseyo'),
 *       allowing speech engines to coarticulate fluently without pause artifacts.
 *     - 'hyphenated': 'An-nyeong ha-se-yo'
 *     - 'spaced': 'An nyeong ha se yo'
 */

const {
	decomposeHangul
} = (typeof require !== 'undefined' ? require('../core/primitives.js') : window);

const {
	getPronunciation
} = (typeof require !== 'undefined' ? require('./pronunciation.js') : window);

// -----------------------------------------------------------------------------
// Consonant & Vowel Phoneme Maps (Single Consonants to Prevent TTS Stuttering)
// -----------------------------------------------------------------------------

const ONSET_EN = Object.freeze({
	0: 'g',   // ㄱ
	1: 'k',   // ㄲ (single consonant to prevent stuttering)
	2: 'n',   // ㄴ
	3: 'd',   // ㄷ
	4: 't',   // ㄸ (single consonant)
	5: 'r',   // ㄹ
	6: 'm',   // ㅁ
	7: 'b',   // ㅂ
	8: 'p',   // ㅃ (single consonant)
	9: 's',   // ㅅ
	10: 's',  // ㅆ (single consonant)
	11: '',   // ㅇ (silent onset)
	12: 'j',  // ㅈ
	13: 'j',  // ㅉ (single consonant)
	14: 'ch', // ㅊ
	15: 'k',  // ㅋ
	16: 't',  // ㅌ
	17: 'p',  // ㅍ
	18: 'h'   // ㅎ
});

const CODA_EN = Object.freeze({
	0: '',     // no coda
	1: 'k',    // ㄱ
	2: 'k',    // ㄲ
	3: 'k',    // ㄳ
	4: 'n',    // ㄴ
	5: 'n',    // ㄵ
	6: 'n',    // ㄶ
	7: 't',    // ㄷ
	8: 'l',    // ㄹ
	9: 'k',    // ㄺ
	10: 'm',   // ㄻ
	11: 'p',   // ㄼ
	12: 'l',   // ㄽ
	13: 't',   // ㄾ
	14: 'p',   // ㄿ
	15: 'l',   // ㅀ
	16: 'm',   // ㅁ
	17: 'p',   // ㅂ
	18: 'p',   // ㅄ
	19: 't',   // ㅅ
	20: 't',   // ㅆ
	21: 'ng',  // ㅇ
	22: 't',   // ㅈ
	23: 't',   // ㅊ
	24: 'k',   // ㅋ
	25: 't',   // ㅌ
	26: 'p',   // ㅍ
	27: 't'    // ㅎ
});

/**
 * Transliterates a single Hangul syllable character into a TTS-friendly phoneme chunk.
 *
 * @param {string} char - Single Hangul syllable
 * @param {string} [prevChar] - Preceding Hangul syllable in the same token (for coarticulation)
 * @returns {string} Clean phoneme string
 */
function transliterateSyllable(char, prevChar = null) {
	const d = decomposeHangul(char);
	if (!d) return char;

	let onset = ONSET_EN[d.initial];
	let isPalatalizedS = false;

	// Liquid Gemination: 'ㄹ + ㄹ' (coda ㄹ followed by onset ㄹ) is pronounced [lː], not [lr]
	// Produces fluent 'll' (e.g. 빨리 -> Palli, 몰라 -> Molla, 연락 [열락] -> Yeollak)
	if (d.initial === 5 && prevChar) {
		const prevD = decomposeHangul(prevChar);
		if (prevD && prevD.final === 8) {
			onset = 'l';
		}
	}

	// Palatalization: 's' before 'i' or 'y*' sounds like 'sh'
	if (d.initial === 9 || d.initial === 10) {
		if (d.medial === 20 || [2, 3, 6, 7, 12, 17].includes(d.medial)) {
			onset = 'sh';
			isPalatalizedS = true;
		} else {
			onset = 's';
		}
	}

	let nucleus = '';

	switch (d.medial) {
		case 0: // ㅏ
			nucleus = 'a';
			break;
		case 1: // ㅐ
			nucleus = 'ae';
			break;
		case 2: // ㅑ
			nucleus = isPalatalizedS ? 'a' : 'ya';
			break;
		case 3: // ㅒ
			nucleus = isPalatalizedS ? 'e' : 'ye';
			break;
		case 4: // ㅓ
			nucleus = 'eo';
			break;
		case 5: // ㅔ
			nucleus = 'e';
			break;
		case 6: // ㅕ
			nucleus = isPalatalizedS ? 'eo' : 'yeo';
			break;
		case 7: // ㅖ
			nucleus = isPalatalizedS ? 'e' : 'ye';
			break;
		case 8: // ㅗ
			nucleus = 'o';
			break;
		case 9: // ㅘ
			nucleus = 'wa';
			break;
		case 10: // ㅙ
			nucleus = 'wae';
			break;
		case 11: // ㅚ
			nucleus = 'oe';
			break;
		case 12: // ㅛ
			nucleus = isPalatalizedS ? 'o' : 'yo';
			break;
		case 13: // ㅜ
			nucleus = 'u';
			break;
		case 14: // ㅝ
			nucleus = 'wo';
			break;
		case 15: // ㅞ
			nucleus = 'we';
			break;
		case 16: // ㅟ
			nucleus = 'wi';
			break;
		case 17: // ㅠ
			nucleus = isPalatalizedS ? 'u' : 'yu';
			break;
		case 18: // ㅡ
			nucleus = 'eu';
			break;
		case 19: // ㅢ
			nucleus = 'ui';
			break;
		case 20: // ㅣ
			nucleus = 'i';
			break;
		default:
			nucleus = 'a';
	}

	const coda = CODA_EN[d.final] || '';
	return onset + nucleus + coda;
}

/**
 * Converts Korean text into English/European-readable phonetic transliteration for TTS engines.
 *
 * @param {string} text - Surface Korean text
 * @param {Object} [options] - Transliteration options
 * @param {string} [options.style='natural'] - Joining style: 'natural' (words joined), 'hyphenated' (syllables hyphenated), or 'spaced' (syllables separated by space)
 * @param {boolean} [options.capitalize=true] - Whether to capitalize the first letter of each word
 * @param {boolean} [options.phoneticInput=false] - Whether input is already phonetic Hangul
 * @param {Object} [options.pronunciationOptions={}] - Options forwarded to getPronunciation
 * @returns {string} Transliterated phonetic string ready for speech synthesis
 */
function toEnglishPhonemes(text, options = {}) {
	if (!text || typeof text !== 'string') return text;

	const {
		style = 'natural',
		capitalize = true,
		phoneticInput = false,
		pronunciationOptions = {}
	} = options;

	// Backward-compatibility: if hyphenate is explicitly boolean false, use natural
	const effectiveStyle = (options.hyphenate === false) ? 'natural' : (options.hyphenate === true ? 'hyphenated' : style);

	// Stage 1: Standard Phonetic Normalization (unless already phonetic)
	const phoneticText = phoneticInput ? text : getPronunciation(text, pronunciationOptions);

	// Stage 2: Tokenization preserving word boundaries and punctuation
	const tokens = phoneticText.split(/(\s+|[.,?!~:;"'()\[\]{}]+)/);

	const convertedTokens = tokens.map(token => {
		// Whitespace or punctuation tokens passed through directly
		if (/^[\s.,?!~:;"'()\[\]{}]+$/.test(token)) {
			return token;
		}

		const syllables = [];
		for (let i = 0; i < token.length; i++) {
			const ch = token[i];
			const prevCh = i > 0 ? token[i - 1] : null;
			const phoneme = transliterateSyllable(ch, prevCh);
			syllables.push(phoneme);
		}

		if (syllables.length === 0) return token;

		let wordResult = '';
		if (effectiveStyle === 'hyphenated') {
			wordResult = syllables.join('-');
		} else if (effectiveStyle === 'spaced') {
			wordResult = syllables.join(' ');
		} else {
			// 'natural' word mode
			wordResult = syllables.join('');
		}

		// Capitalize first character of each word for rhythm pacing
		if (capitalize && wordResult.length > 0) {
			wordResult = wordResult.charAt(0).toUpperCase() + wordResult.slice(1);
		}

		return wordResult;
	});

	return convertedTokens.join('');
}

const englishPhonemesModule = {
	toEnglishPhonemes,
	transliterateSyllable,
	ONSET_EN,
	CODA_EN
};

if (typeof window !== 'undefined') {
	Object.assign(window, englishPhonemesModule);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = englishPhonemesModule;
}
