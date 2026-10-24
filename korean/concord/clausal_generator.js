/**
 * Feature 11: Clausal Connective Distractor & Quiz Item Generation
 *
 * Implements:
 * 1. Targeted distractor generation for quiz item distractors:
 *    - tense_in_clause1 (*비가 왔어서)
 *    - imperative_in_clause2 (*비가 와서 우산을 쓰세요)
 *    - propositive_in_clause2 (*날씨가 좋아서 공원에 갑시다)
 *    - adjective_in_clause1 (*방이 작느라고)
 *    - positive_outcome (*열심히 공부하느라고 시험에 합격했어요)
 *    - non_motion_verb (*책을 읽으러 커피를 마셔요)
 * 2. Automatic grammatical repair of clausal connective errors (applyClausalConcord).
 * 3. Curriculum quiz item banks and randomized question generation.
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

const { decomposeHangul, composeHangul, hasBatchim, getStem } =
	(typeof require !== 'undefined' ? require('../core/primitives.js') : window);
const { ERROR_CODES } =
	(typeof require !== 'undefined' ? require('../constants/error_codes.js') : window);
const { parseSentenceToClauses, detectClauseMood } =
	(typeof require !== 'undefined' ? require('./clausal_validation.js') : window);
const { getVerbUnit, canTakeMood, buildMoodPredicate, conjugatePredicate, applyMorphology } =
	(typeof require !== 'undefined' ? require('../core/morphology.js') : window);

function generateClausalDistractor(arg1, arg2, arg3, arg4) {
	let clause1, connective, clause2, distractorType;
	if (arguments.length <= 2) {
		const parsed = parseSentenceToClauses(arg1);
		if (!parsed) return arg1;
		clause1 = parsed.clause1;
		connective = parsed.connective;
		clause2 = parsed.clause2;
		distractorType = arg2;
	} else {
		clause1 = arg1;
		connective = arg2;
		clause2 = arg3;
		distractorType = arg4;
	}

	const c1 = String(clause1 || "").trim();
	const conn = String(connective || "").trim();
	const c2 = String(clause2 || "").trim();

	switch (distractorType) {
		case "tense_in_clause1":
		case "clause1_past_tense": {
			const c1Words = c1.split(/\s+/);
			const lastWord = c1Words[c1Words.length - 1];
			const c1Prefix = c1Words.slice(0, -1).join(" ");

			let pastStem = "";
			const lastChar = lastWord.slice(-1);
			const d = decomposeHangul(lastChar);
			if (d) {
				if (d.final === 0) {
					pastStem = lastWord.slice(0, -1) + composeHangul(d.initial, d.medial, 20);
				} else {
					const takesA = (d.medial === 0 || d.medial === 8);
					pastStem = lastWord + (takesA ? "았" : "었");
				}
			} else {
				pastStem = lastWord + "었";
			}
			const pastC1 = (c1Prefix ? c1Prefix + " " : "") + pastStem;

			if (conn.includes("러")) {
				return `${pastC1}으러 ${c2}`;
			}
			if (conn.includes("느라고")) {
				return `${pastC1}느라고 ${c2}`;
			}
			if (conn.includes("아/어서") || conn.includes("어서") || conn.includes("아서")) {
				return `${pastC1}어서 ${c2}`;
			}
			if (conn.includes("기 때문에")) {
				return `${pastC1}기 때문에 ${c2}`;
			}
			return `${pastC1}어서 ${c2}`;
		}

		case "imperative_in_clause2": {
			let impC2 = c2;
			if (detectClauseMood(impC2) !== "imperative") {
				const c2Words = c2.split(/\s+/);
				const lastWord = c2Words[c2Words.length - 1].replace(/[.!?,;~]+$/, "");
				const c2Prefix = c2Words.slice(0, -1).join(" ");
				const verbCandidate = getVerbUnit(lastWord) || getVerbUnit(lastWord + "다") || getVerbUnit(getStem(lastWord) + "다");
				if (verbCandidate && canTakeMood(verbCandidate, "imperative")) {
					impC2 = (c2Prefix ? c2Prefix + " " : "") + buildMoodPredicate(verbCandidate, "imperative", "polite");
				} else {
					impC2 = (c2Prefix ? c2Prefix + " " : "") + "하세요";
				}
			}

			const targetConn = conn.includes("기 때문에") ? "기 때문에" : "아서/어서";
			if (targetConn === "기 때문에") {
				return `${c1}기 때문에 ${impC2}`;
			}

			const c1Words = c1.split(/\s+/);
			const lastC1 = c1Words[c1Words.length - 1];
			const c1Prefix = c1Words.slice(0, -1).join(" ");
			const c1Verb = getVerbUnit(lastC1) || getVerbUnit(lastC1 + "다") || getVerbUnit(getStem(lastC1) + "다");
			const conjC1Word = c1Verb
				? conjugatePredicate(c1Verb, "polite", "present").replace(/요$/, "서")
				: applyMorphology(lastC1 + "아/어서");
			const conjC1 = (c1Prefix ? c1Prefix + " " : "") + conjC1Word;

			return `${conjC1} ${impC2}`;
		}

		case "propositive_in_clause2": {
			let propC2 = c2;
			if (detectClauseMood(propC2) !== "propositive") {
				const c2Words = c2.split(/\s+/);
				const lastWord = c2Words[c2Words.length - 1].replace(/[.!?,;~]+$/, "");
				const c2Prefix = c2Words.slice(0, -1).join(" ");
				const verbCandidate = getVerbUnit(lastWord) || getVerbUnit(lastWord + "다") || getVerbUnit(getStem(lastWord) + "다");
				if (verbCandidate && canTakeMood(verbCandidate, "propositive")) {
					propC2 = (c2Prefix ? c2Prefix + " " : "") + buildMoodPredicate(verbCandidate, "propositive", "formal");
				} else {
					propC2 = (c2Prefix ? c2Prefix + " " : "") + "갑시다";
				}
			}

			const c1Words = c1.split(/\s+/);
			const lastC1 = c1Words[c1Words.length - 1];
			const c1Prefix = c1Words.slice(0, -1).join(" ");
			const c1Verb = getVerbUnit(lastC1) || getVerbUnit(lastC1 + "다") || getVerbUnit(getStem(lastC1) + "다");
			const conjC1Word = c1Verb
				? conjugatePredicate(c1Verb, "polite", "present").replace(/요$/, "서")
				: applyMorphology(lastC1 + "아/어서");
			const conjC1 = (c1Prefix ? c1Prefix + " " : "") + conjC1Word;

			return `${conjC1} ${propC2}`;
		}

		case "adjective_in_clause1":
		case "clause1_invalid_pos": {
			const adjStem = c1.includes("작") ? c1 : "방이 작";
			return `${adjStem}느라고 ${c2 || "짐을 못 넣었어요"}`;
		}

		case "positive_outcome": {
			const c1Action = c1.includes("느라고") ? c1 : `${c1.replace(/다$/, "")}느라고`;
			return `${c1Action} 시험에 합격했어요`;
		}

		case "non_motion_verb": {
			const purposeC1 = c1.includes("러") ? c1 : `${c1}러`;
			return `${purposeC1} 커피를 마셔요`;
		}

		default:
			return `${c1} ${conn} ${c2}`;
	}
}

function applyClausalConcord(input, options = {}) {
	if (typeof input === 'object' && input !== null) {
		let text = input.text || "";
		if (text) {
			text = applyClausalConcord(text, options);
		}
		return { ...input, text };
	}

	let str = String(input);

	// 1. Repair forbidden past tense before -아/어서 (*왔어서 -> 와서, *먹었어서 -> 먹어서, *했어서 -> 해서)
	str = str.replace(/(?:^|\s)([가-힣]*?)([가-힣])어서(?=\s+|$)/g, (match, prefix, pastSyl) => {
		const d = decomposeHangul(pastSyl);
		if (!d || d.final !== 20) return match;
		const leadSpace = match.startsWith(' ') ? ' ' : '';

		if (pastSyl === '왔') return leadSpace + (prefix ? prefix + '와서' : '와서');
		if (pastSyl === '갔') return leadSpace + (prefix ? prefix + '가서' : '가서');
		if (pastSyl === '봤') return leadSpace + (prefix ? prefix + '봐서' : '봐서');
		if (pastSyl === '줬') return leadSpace + (prefix ? prefix + '줘서' : '줘서');
		if (pastSyl === '됐') return leadSpace + (prefix ? prefix + '돼서' : '돼서');
		if (pastSyl === '했') return leadSpace + (prefix ? prefix + '해서' : '해서');

		if (pastSyl === '었' || pastSyl === '았') {
			const stemChar = prefix.slice(-1);
			const stemD = decomposeHangul(stemChar);
			if (stemD) {
				const takesA = (stemD.medial === 0 || stemD.medial === 8);
				return leadSpace + prefix + (takesA ? '아서' : '어서');
			}
			return leadSpace + prefix + '어서';
		}

		const noCoda = composeHangul(d.initial, d.medial, 0);
		return leadSpace + prefix + noCoda + '어서';
	});

	// 2. Repair -아/어서 or -기 때문에 with Imperative/Propositive in Clause 2
	const parsed = parseSentenceToClauses(str);
	if (parsed && (parsed.connective === "-아/어서" || parsed.connective === "-기 때문에" || parsed.connective.includes("아/어서") || parsed.connective.includes("기 때문에"))) {
		const mood = detectClauseMood(parsed.clause2);
		if (mood === "imperative" || mood === "propositive" || mood === "suggestive") {
			const c1 = parsed.clause1;
			let c1WithNikka = "";
			if (c1.endsWith("와") || c1.endsWith("오")) c1WithNikka = c1.replace(/와$|오$/, "오니까");
			else if (c1.endsWith("가")) c1WithNikka = c1 + "니까";
			else if (c1.endsWith("좋아") || c1.endsWith("좋")) c1WithNikka = c1.replace(/좋아$|좋$/, "좋으니까");
			else if (c1.endsWith("하") || c1.endsWith("해")) c1WithNikka = c1.replace(/하$|해$/, "하니까");
			else {
				const lastChar = c1.slice(-1);
				c1WithNikka = hasBatchim(lastChar) ? c1 + "으니까" : c1 + "니까";
			}
			return `${c1WithNikka} ${parsed.clause2}`;
		}
	}

	return str;
}

const CLAUSAL_QUIZ_BANKS = {
	cause_imperative: [
		{
			clause1Nikka: "비가 오니까",
			clause1Eoseo: "비가 와서",
			clause1PastEoseo: "비가 왔어서",
			clause1GiTtaemun: "비가 오기 때문에",
			clause2: "우산을 쓰세요.",
			explanation: "-(으)니까 allows imperative (-으세요) in Clause 2, whereas -아/어서 and -기 때문에 strictly forbid imperative and propositive endings. Additionally, -아/어서 does not allow past tense in Clause 1."
		},
		{
			clause1Nikka: "날씨가 추우니까",
			clause1Eoseo: "날씨가 추워서",
			clause1PastEoseo: "날씨가 추웠어서",
			clause1GiTtaemun: "날씨가 춥기 때문에",
			clause2: "따뜻한 옷을 입으세요.",
			explanation: "-(으)니까 allows imperative (-으세요) in Clause 2, whereas -아/어서 and -기 때문에 strictly forbid imperative endings."
		},
		{
			clause1Nikka: "시간이 없으니까",
			clause1Eoseo: "시간이 없어서",
			clause1PastEoseo: "시간이 없었어서",
			clause1GiTtaemun: "시간이 없기 때문에",
			clause2: "빨리 가세요.",
			explanation: "-(으)니까 allows imperative commands in Clause 2, while -아/어서 and -기 때문에 forbid imperative endings."
		},
		{
			clause1Nikka: "길이 막히니까",
			clause1Eoseo: "길이 막혀서",
			clause1PastEoseo: "길이 막혔어서",
			clause1GiTtaemun: "길이 막히기 때문에",
			clause2: "지하철을 타세요.",
			explanation: "-(으)니까 is used for reasons leading to commands or suggestions."
		}
	],
	cause_propositive: [
		{
			clause1Nikka: "날씨가 좋으니까",
			clause1Eoseo: "날씨가 좋아서",
			clause1PastEoseo: "날씨가 좋았어서",
			clause1GiTtaemun: "날씨가 좋기 때문에",
			clause2: "공원에 갑시다.",
			explanation: "Propositive proposals (-(으)ㅂ시다, -자) require -(으)니까 and cannot follow -아/어서 or -기 때문에."
		},
		{
			clause1Nikka: "배가 고프니까",
			clause1Eoseo: "배가 고파서",
			clause1PastEoseo: "배가 고팠어서",
			clause1GiTtaemun: "배가 고프기 때문에",
			clause2: "식당에 갑시다.",
			explanation: "Propositive proposals (-(으)ㅂ시다) require -(으)니까 and forbid -아/어서."
		},
		{
			clause1Nikka: "시험이 끝나니까",
			clause1Eoseo: "시험이 끝나서",
			clause1PastEoseo: "시험이 끝났어서",
			clause1GiTtaemun: "시험이 끝나기 때문에",
			clause2: "영화를 봅시다.",
			explanation: "Proposals for joint action require -(으)니까 and cannot take -아/어서."
		}
	],
	reason_negative: [
		{
			correctC1: "공부하느라고",
			pastC1: "공부했느라고",
			adjC1: "방이 작느라고",
			negOutcome: "잠을 못 잤어요.",
			adjOutcome: "짐을 못 넣었어요.",
			posOutcome: "시험에 합격했어요.",
			explanation: "-느라고 strictly forbids past tense in Clause 1, requires an Action Verb (not a Descriptive Verb like 작다), and necessitates an unfortunate negative outcome or burden (not a success like 시험에 합격했어요)."
		},
		{
			correctC1: "일하느라고",
			pastC1: "일했느라고",
			adjC1: "옷이 비싸느라고",
			negOutcome: "점심을 못 먹었어요.",
			adjOutcome: "사지 못했어요.",
			posOutcome: "칭찬을 받았어요.",
			explanation: "-느라고 requires an action verb in the present tense and connects to a negative outcome or burden."
		},
		{
			correctC1: "준비하느라고",
			pastC1: "준비했느라고",
			adjC1: "날씨가 춥느라고",
			negOutcome: "지각했어요.",
			adjOutcome: "나가지 못했어요.",
			posOutcome: "상을 받았어요.",
			explanation: "-느라고 cannot take past tense, adjectives, or positive outcomes."
		}
	],
	purpose_motion: [
		{
			actionC1: "책을 읽으러",
			actionPastC1: "책을 읽었으러",
			motionC2: "도서관에 가요.",
			nonMotionC2a: "커피를 마셔요.",
			nonMotionC2b: "집에 있어요.",
			explanation: "-(으)러 strictly requires a motion verb (가다, 오다, 다니다) in Clause 2, and forbids past tense in Clause 1."
		},
		{
			actionC1: "친구를 만나러",
			actionPastC1: "친구를 만났으러",
			motionC2: "카페에 왔어요.",
			nonMotionC2a: "책을 읽어요.",
			nonMotionC2b: "방에 있어요.",
			explanation: "-(으)러 requires a motion verb in Clause 2 (가다, 오다, etc.) and non-past Clause 1."
		},
		{
			actionC1: "운동을 하러",
			actionPastC1: "운동을 했으러",
			motionC2: "체육관에 가요.",
			nonMotionC2a: "음악을 들어요.",
			nonMotionC2b: "텔레비전을 봐요.",
			explanation: "-(으)러 expresses purpose of motion and requires a directional motion verb in Clause 2."
		}
	]
};

function generateClausalQuizItem(options = {}) {
	const topics = ["cause_imperative", "cause_propositive", "reason_negative", "purpose_motion"];
	const topic = options.topic || topics[Math.floor(Math.random() * topics.length)];
	const bank = CLAUSAL_QUIZ_BANKS[topic] || CLAUSAL_QUIZ_BANKS.cause_imperative;
	const entry = (options.index !== undefined && bank[options.index])
		? bank[options.index]
		: bank[Math.floor(Math.random() * bank.length)];

	let item = {};
	if (topic === "cause_imperative") {
		const correctSentence = `${entry.clause1Nikka} ${entry.clause2}`;
		item = {
			topic,
			prompt: "다음 중 올바른 연결 어미를 사용한 문장을 고르십시오.",
			translationPrompt: "Select the sentence with the correct clausal connective:",
			correctSentence,
			correctConnective: "-(으)니까",
			options: [
				{ text: correctSentence, correct: true },
				{ text: `${entry.clause1Eoseo} ${entry.clause2}`, correct: false, trap: "imperative_in_clause2", errorCode: ERROR_CODES.CLAUSE2_IMPERATIVE_MOOD },
				{ text: `${entry.clause1PastEoseo} ${entry.clause2}`, correct: false, trap: "tense_in_clause1", errorCode: ERROR_CODES.CLAUSE1_PAST_TENSE },
				{ text: `${entry.clause1GiTtaemun} ${entry.clause2}`, correct: false, trap: "imperative_in_clause2", errorCode: ERROR_CODES.CLAUSE2_IMPERATIVE_MOOD }
			],
			explanation: entry.explanation,
			ruleSummary: "Causal Connective Concord: -(으)니까 vs -아/어서 / -기 때문에 (Imperative Restriction)"
		};
	} else if (topic === "cause_propositive") {
		const correctSentence = `${entry.clause1Nikka} ${entry.clause2}`;
		item = {
			topic,
			prompt: "다음 중 올바른 문장을 고르십시오.",
			translationPrompt: "Select the grammatically correct proposal sentence:",
			correctSentence,
			correctConnective: "-(으)니까",
			options: [
				{ text: correctSentence, correct: true },
				{ text: `${entry.clause1Eoseo} ${entry.clause2}`, correct: false, trap: "propositive_in_clause2", errorCode: ERROR_CODES.CLAUSE2_PROPOSITIVE_MOOD },
				{ text: `${entry.clause1PastEoseo} ${entry.clause2}`, correct: false, trap: "tense_in_clause1", errorCode: ERROR_CODES.CLAUSE1_PAST_TENSE },
				{ text: `${entry.clause1GiTtaemun} ${entry.clause2}`, correct: false, trap: "propositive_in_clause2", errorCode: ERROR_CODES.CLAUSE2_PROPOSITIVE_MOOD }
			],
			explanation: entry.explanation,
			ruleSummary: "Causal Connective Concord: -(으)니까 vs -아/어서 (Propositive Restriction)"
		};
	} else if (topic === "reason_negative") {
		const correctSentence = `${entry.correctC1} ${entry.negOutcome}`;
		item = {
			topic,
			prompt: "다음 중 올바른 문장을 고르십시오.",
			translationPrompt: "Select the sentence that properly uses -느라고:",
			correctSentence,
			correctConnective: "-느라고",
			options: [
				{ text: correctSentence, correct: true },
				{ text: `${entry.pastC1} ${entry.negOutcome}`, correct: false, trap: "tense_in_clause1", errorCode: ERROR_CODES.CLAUSE1_PAST_TENSE },
				{ text: `${entry.adjC1} ${entry.adjOutcome}`, correct: false, trap: "adjective_in_clause1", errorCode: ERROR_CODES.CLAUSE1_INVALID_POS },
				{ text: `${entry.correctC1} ${entry.posOutcome}`, correct: false, trap: "positive_outcome", errorCode: ERROR_CODES.OUTCOME_POLARITY }
			],
			explanation: entry.explanation,
			ruleSummary: "Causal Connective Concord: -느라고 Constraints (Action Verb + Present Tense + Negative Outcome)"
		};
	} else {
		const correctSentence = `${entry.actionC1} ${entry.motionC2}`;
		item = {
			topic,
			prompt: "다음 중 올바른 목적 연결 표현을 고르십시오.",
			translationPrompt: "Select the correct purpose sentence with -(으)러:",
			correctSentence,
			correctConnective: "-(으)러",
			options: [
				{ text: correctSentence, correct: true },
				{ text: `${entry.actionC1} ${entry.nonMotionC2a}`, correct: false, trap: "non_motion_verb", errorCode: ERROR_CODES.NON_MOTION_VERB },
				{ text: `${entry.actionPastC1} ${entry.motionC2}`, correct: false, trap: "tense_in_clause1", errorCode: ERROR_CODES.CLAUSE1_PAST_TENSE },
				{ text: `${entry.actionC1} ${entry.nonMotionC2b}`, correct: false, trap: "non_motion_verb", errorCode: ERROR_CODES.NON_MOTION_VERB }
			],
			explanation: entry.explanation,
			ruleSummary: "Purpose Connective Concord: -(으)러 Requires Motion Verb & Non-Past Clause 1"
		};
	}

	if (options.shuffle) {
		for (let i = item.options.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[item.options[i], item.options[j]] = [item.options[j], item.options[i]];
		}
	}

	return item;
}

const clausalGeneratorExports = {
	generateClausalDistractor,
	applyClausalConcord,
	CLAUSAL_QUIZ_BANKS,
	generateClausalQuizItem
};

if (typeof window !== 'undefined') {
	Object.assign(window, clausalGeneratorExports);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = clausalGeneratorExports;
}
