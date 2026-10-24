/**
 * Feature 8: Predicate Mood, Speech Acts & Negation Concord
 *
 * Implements:
 * 1. Prohibition of direct negation on 알다 / 있다 (suppletion to 모르다 / 없다).
 * 2. Restriction of inability negation (못 / -지 못하다) to Action Verbs only.
 * 3. Restriction of imperative and propositive moods to Action Verbs only.
 * 4. Perspective concord on volitional endings (-고 싶다 for 1st/2nd vs. -고 싶어하다 for 3rd person).
 * 5. Mood concord validation and automatic repair.
 */

let dataModule;
if (typeof require !== 'undefined') {
	try {
		dataModule = require('../../data.js');
	} catch (e) {
		dataModule = typeof window !== 'undefined' ? window : {};
	}
} else {
	dataModule = typeof window !== 'undefined' ? window : {};
}

const state = (typeof require !== 'undefined' ? require('../state.js') : window);
const { DATA_SCHEMA } = (typeof require !== 'undefined' ? require('../core/primitives.js') : window);
const { ERROR_CODES } = (typeof require !== 'undefined' ? require('../constants/error_codes.js') : window);

function validateMoodConcord(text, context = {}) {
	const errors = [];
	const errorCodes = [];
	if (!text || typeof text !== 'string') {
		return { valid: true, errors: [], errorCodes: [] };
	}

	// 1. Forbidden Negative Roots (알다 -> 모르다, 있다 -> 없다)
	const aldaDirectNeg = /(^|[^가-힣])(?:(?:안|못)\s+(?:알(?:아요|았어요|았습니다|다|고|아서|으면)|압니다)|알지\s+(?:않|못)(?:아요|았습니다|습니다|다|해요|했어요|합니다))(?=[^가-힣]|$)/g;
	if (aldaDirectNeg.test(text)) {
		errors.push(`Verb '알다' cannot be negated directly (must use suppletive '모르다') in: "${text}"`);
		errorCodes.push(ERROR_CODES.FORBIDDEN_NEGATIVE_ROOT);
	}

	const itdaDirectNeg = /(^|[^가-힣])(?:(?:안|못)\s+(?:있(?:어요|었어요|았습니다|었습니다|다|고|어서|으면)|있습니다)|있지\s+(?:않|못)(?:아요|았습니다|습니다|다|해요|했어요|합니다))(?=[^가-힣]|$)/g;
	if (itdaDirectNeg.test(text)) {
		errors.push(`Verb '있다' cannot be negated directly (must use suppletive '없다') in: "${text}"`);
		errorCodes.push(ERROR_CODES.FORBIDDEN_NEGATIVE_ROOT);
	}

	// 2. Inability Negation on Descriptive Verbs: 못 + [Descriptive Verb]
	const motRegex = /(^|[^가-힣])못\s+([가-힣]+)(?=[^가-힣]|$)/g;
	let motMatch;
	while ((motMatch = motRegex.exec(text)) !== null) {
		const targetWord = motMatch[2];
		const dvUnit = state.DESCRIPTIVE_SURFACE_MAP.get(targetWord);
		if (dvUnit) {
			const dvKo = dvUnit[DATA_SCHEMA.Korean];
			errors.push(`Descriptive verb '${dvKo}' cannot take inability negation '못' in: "${text}"`);
			errorCodes.push(ERROR_CODES.DV_INABILITY_NEGATION);
		}
	}

	// 3. Long Inability Negation on Descriptive Verbs: [DV]-지 못하다
	for (const [form, dvKo] of state.FORBIDDEN_DV_LONG_INABILITY_FORMS.entries()) {
		if (text.includes(form)) {
			errors.push(`Descriptive verb '${dvKo}' cannot take inability negation '-지 못하다' in: "${text}"`);
			errorCodes.push(ERROR_CODES.DV_LONG_INABILITY);
		}
	}

	// 4. Imperative Mood on Descriptive Verbs: [DV]-(으)십시오, [DV]-(으)세요, [DV]-아/어라, [DV]-지 마(세요)
	for (const [form, dvKo] of state.FORBIDDEN_DV_IMPERATIVE_FORMS.entries()) {
		if (text.includes(form)) {
			errors.push(`Descriptive verb '${dvKo}' cannot take imperative/prohibitive ending in: "${text}"`);
			errorCodes.push(ERROR_CODES.DV_IMPERATIVE_MOOD);
		}
	}

	// 5. Propositive Mood on Descriptive Verbs: [DV]-(으)ㅂ시다, [DV]-자, [DV]-세
	for (const [form, dvKo] of state.FORBIDDEN_DV_PROPOSITIVE_FORMS.entries()) {
		if (text.includes(form)) {
			errors.push(`Descriptive verb '${dvKo}' cannot take propositive ending in: "${text}"`);
			errorCodes.push(ERROR_CODES.DV_PROPOSITIVE_MOOD);
		}
	}

	// 6. Volitional Mood on Descriptive Verbs: [DV]-고 싶다 / [DV]-고 싶어하다
	for (const [form, dvKo] of state.FORBIDDEN_DV_VOLITIONAL_FORMS.entries()) {
		if (text.includes(form)) {
			errors.push(`Descriptive verb '${dvKo}' cannot take volitional ending directly in: "${text}"`);
			errorCodes.push(ERROR_CODES.DV_VOLITIONAL_MOOD);
		}
	}

	// 7. Volitional Perspective Concord (1st/2nd person vs 3rd person)
	const thirdPersonSubjectRegex = /(^|[^가-힣])(?:친구|어머니|아버지|선생님|그 사람|동생|아이|학생|누나|형|언니|오빠|부모님|할머니|할아버지)(?:이|가|은|는|께서|\s+께서)?\s+(?:[^.!?]*\s+)?([가-힣]+고\s+싶(?:어요|습니다|다))(?=[^가-힣]|$)/;
	if (context.person === 3 || thirdPersonSubjectRegex.test(text)) {
		if (/(?:고\s+싶(?:어요|습니다|다))(?=[^가-힣]|$)/.test(text) && !/(?:고\s+싶어(?:해요|합니다|하다|한다))/.test(text)) {
			errors.push(`3rd person subject requires '-고 싶어하다', not '-고 싶다' in: "${text}"`);
			errorCodes.push(ERROR_CODES.VOLITIONAL_PERSPECTIVE);
		}
	}

	const firstSecondSubjectRegex = /(^|[^가-힣])(?:나|내|저|제|우리|너|네|당신|자네)(?:는|은|이|가)?\s+(?:[^.!?]*\s+)?([가-힣]+고\s+싶어(?:해요|합니다|하다|한다|해|하니|하냐))(?=[^가-힣]|$)/;
	if (context.person === 1 || context.person === 2 || firstSecondSubjectRegex.test(text)) {
		if (/(?:고\s+싶어(?:해요|합니다|하다|한다|해|하니|하냐))(?=[^가-힣]|$)/.test(text)) {
			errors.push(`1st/2nd person subject requires '-고 싶다', not '-고 싶어하다' in: "${text}"`);
			errorCodes.push(ERROR_CODES.VOLITIONAL_PERSPECTIVE);
		}
	}

	return {
		valid: errors.length === 0,
		errors: Array.from(new Set(errors)),
		errorCodes: Array.from(new Set(errorCodes))
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
		if (state.DESCRIPTIVE_SURFACE_MAP.has(word)) {
			return `${prefix}안 ${word}`;
		}
		return match;
	});

	// 4. Repair [DV]-지 못하다 -> [DV]-지 않다
	for (const [form, dvKo] of state.FORBIDDEN_DV_LONG_INABILITY_FORMS.entries()) {
		if (str.includes(form)) {
			const rep = form.replace(/지\s*못(해요|합니다|하다|했다|했어요|했습니다)/, '지 않$1')
			                .replace(/지 않해요/, '지 않아요')
			                .replace(/지 않합니다/, '지 않습니다')
			                .replace(/지 않하다/, '지 않다')
			                .replace(/지 않했다/, '지 않았다')
			                .replace(/지 않했어요/, '지 않았어요')
			                .replace(/지 않했습니다/, '지 않았습니다');
			str = str.split(form).join(rep);
		}
	}

	// 4. Repair volitional perspective concord
	const thirdPersonSubjectRegex = /(^|[^가-힣])(?:친구|어머니|아버지|선생님|그 사람|동생|아이|학생|누나|형|언니|오빠|부모님|할머니|할아버지)(?:이|가|은|는|께서|\s+께서)?\s+(?:[^.!?]*\s+)?([가-힣]+고\s+싶(?:어요|습니다|다))(?=[^가-힣]|$)/;
	if (options.person === 3 || thirdPersonSubjectRegex.test(str)) {
		str = str.replace(/(고\s+)싶어요(?=[^가-힣]|$)/g, '$1싶어해요');
		str = str.replace(/(고\s+)싶습니다(?=[^가-힣]|$)/g, '$1싶어합니다');
		str = str.replace(/(고\s+)싶다(?=[^가-힣]|$)/g, '$1싶어한다');
	}

	const firstSecondSubjectRegex = /(^|[^가-힣])(?:나|내|저|제|우리|너|네|당신|자네)(?:는|은|이|가)?\s+(?:[^.!?]*\s+)?([가-힣]+고\s+싶어(?:해요|합니다|하다|한다|해|하니|하냐))(?=[^가-힣]|$)/;
	if (options.person === 1 || options.person === 2 || firstSecondSubjectRegex.test(str)) {
		str = str.replace(/(고\s+)싶어해요(?=[^가-힣]|$)/g, '$1싶어요');
		str = str.replace(/(고\s+)싶어합니다(?=[^가-힣]|$)/g, '$1싶습니다');
		str = str.replace(/(고\s+)싶어한다(?=[^가-힣]|$)/g, '$1싶다');
	}

	return str;
}

const moodExports = {
	validateMoodConcord,
	applyMoodConcord
};

if (typeof window !== 'undefined') {
	Object.assign(window, moodExports);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = moodExports;
}
