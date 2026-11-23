/**
 * hangul_constants.js - every Hangul literal that code (not data) depends on, each under a name that says WHY the code needs it.
 *
 * The goal is linguistic knowledge in data (data.js tags, SemanticData), not code. Each entry here is a known exception: a word or
 * fragment some logic tests for by spelling. Reading the names alone should tell you what rule exists and where, so the list doubles
 * as a code-quality backlog: an entry that is really a fact about particular words ("these verbs...", "this counter...") is a candidate
 * to become a data tag, after which the entry and its code path can go. See docs/architecture.md section 1.
 *
 * Naming: <AREA>_<RULE>_<ROLE>, use-specific. Two rules that test the same spelling get two names (the reasons differ, so their future
 * fixes differ). AREA is the owning function or module (SLOT = isUnitEligibleForSlot in verified_sentence_generator.js).
 * Each entry's comment: the rule, then "Data fix:" when the knowledge could move to data.tags/SemanticData, or "Mechanics" when it is
 * grammar machinery (endings, particles, jamo) that legitimately lives in code.
 *
 * Usage: browser global HANGUL_CONSTANTS (classic script, load right after data/constants.js); Node: require(...).HANGUL_CONSTANTS.
 * Regex patterns are built from these with new RegExp(...) at module load, never with Hangul inline.
 */
(function(root) {
'use strict';

const HANGUL_CONSTANTS = Object.freeze({
	// ---- SLOT: isUnitEligibleForSlot (korean/generation/verified_sentence_generator.js) ----

	// 개월 (months) is a counter only usable after a number; never fills a non-numeric slot. Data fix: tag counter_numeric_only.
	SLOT_COUNTER_ONLY_IN_NUMERIC_SLOT_MONTHS: '개월',
	// Zero words (영 Sino zero, 공 zero read in phone numbers) may only replace another zero word. Data fix: tag zero_number.
	SLOT_ZERO_WORDS_REPLACE_ONLY_ZERO: Object.freeze(['영', '공']),
	// Native cardinals with a shortened attributive form (하나->한, 둘->두 ...): without a particle the slot is attributive, so the
	// bare form is wrong. Data fix: SemanticData.attributiveForm (only words with it are excluded).
	SLOT_NATIVE_CARDINALS_SHORTENED_BEFORE_COUNTER: Object.freeze(['하나', '둘', '셋', '넷', '열하나', '열둘', '열셋', '열넷', '스물']),
	// A slot whose suffix contains 주 is treated as benefactive (-아/어 주다). Mechanics, but crude: should test the grammar unit, not a syllable.
	SLOT_BENEFACTIVE_SUFFIX_MARKER: '주',
	// A benefactive slot (-아/어 주다 / 드리다) cannot take a giving verb as the main verb ("*주어 주다"). Data fix: tag giving_verb.
	SLOT_BENEFACTIVE_EXCLUDED_MAIN_VERB_GIVE: '주다',
	SLOT_BENEFACTIVE_EXCLUDED_MAIN_VERB_GIVE_HONORIFIC: '드리다',
	// 시 (o'clock) and other counters never substitute for each other: telling time is not counting. Data fix: tag clock_counter.
	SLOT_CLOCK_HOUR_COUNTER: '시',
	// Present adnominal ending -는 as it appears in a slot's grammar text. Mechanics (should match the grammar unit id instead).
	SLOT_PRESENT_ADNOMINAL_ENDING_TEXTS: Object.freeze(['-는', '는']),
	// Descriptive verbs that take -는 (있다/없다 and compounds: 재미있다, 맛없다). Data fix: tag takes_neun_adnominal.
	SLOT_PRESENT_ADNOMINAL_DV_SUFFIXES: Object.freeze(['있다', '없다']),
	// ---- TABLES: module-level tables moved whole from their modules (2026-11-22). One name per table, never one per word. ----

	// SEMANTIC_TAG_SELECTION_WHITELIST (korean/constants/tags.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	TAGS_SEMANTIC_TAG_SELECTION_WHITELIST: Object.freeze({
		"SUPPRESS_SEMANTIC_DIVERSITY_WARNING": {
			rationale: "Directive tag on verbs with < 3 curriculum arguments (e.g. 닦다, 부르다, 차다, 끼다, 누르다, 긋다, 벌다) to explicitly exempt them from diversity starvation alerts when curriculum vocabulary is inherently bounded.",
			checkedBy: "select.js (auditSemanticRules / validateLanguageUnitSemanticSelection)"
		},
		"cosmetics": {
			rationale: "Selection constraint tag queried by collocation_filter on topical hygiene and beauty verbs such as 바르다 (to apply/smear lotion, cream, makeup).",
			checkedBy: "data.js (collocation_filter on unit 1440 바르다 via filter_evaluator.js / lexicon_index.js)"
		},
		"liquid": {
			rationale: "Selection constraint tag queried by collocation_filter on fluid manipulation verbs such as 붓다 (to pour liquid).",
			checkedBy: "data.js (collocation_filter on unit 1420 붓다 via filter_evaluator.js / lexicon_index.js)"
		},
		"computing": {
			rationale: "Selection constraint tag queried by collocation_filter on digital technology verbs such as 다운로드하다 (to download) and 클릭하다 (to click).",
			checkedBy: "data.js (collocation_filter on units 1919 and 1926 via filter_evaluator.js / lexicon_index.js)"
		}
	}),
	// UNRESOLVED_PATTERNS (korean/generation/sentence_validator.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	VALIDATOR_UNRESOLVED_PATTERNS: Object.freeze([
		{ pattern: /\{[^}]*\}/, code: "UNRESOLVED_PLACEHOLDER", message: "Unresolved template placeholder remaining in Korean text" },
		{ pattern: /이\/가|은\/는|을\/를|\(이\)랑|\(이\)나|이\/나|\(이\)라서|이\/라서|\(이\)라도|이\/라도|\(이\)든지|이\/든지|과\/와|와\/과/, code: "UNRESOLVED_PARTICLE_PAIR", message: "Unresolved particle alternation pair" },
		{ pattern: /아\/어|으\/|았\/었/, code: "UNRESOLVED_VOWEL_HARMONY", message: "Unresolved vowel harmony / stem alternation marker" },
		{ pattern: /\[[a-z_]+\]/, code: "UNRESOLVED_CONJUGATION_TAG", message: "Unresolved irregular conjugation tag" },
		{ pattern: /\u200B/, code: "RESIDUAL_ZERO_WIDTH_SPACE", message: "Residual internal zero-width space marker (\u200B)" }
	]),
	// INANIMATE_PERSON_ATTR_NOUNS (korean/core/morphology.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	MORPH_INANIMATE_PERSON_ATTR_NOUNS: new Set([
		"나이", "이름", "성함", "연세", "생일", "생신", "고향", "주소",
		"전화번호", "번호", "취미", "전공", "성별", "국적", "키", "몸무게",
		"말씀", "진지", "댁", "병환", "약주"
	]),
	// NPI_NEGATIVE_PREFIX_REPAIRS (korean/concord/adverbial_concord.js). Mechanics: grammar machinery (jamo, particles, endings) that legitimately lives in code.
	ADVERB_NPI_NEGATIVE_PREFIX_REPAIRS: Object.freeze([
		["알았", "몰랐"],
		["알아", "몰라"],
		["압니", "모릅니"],
		["알다", "모르다"],
		["알고", "모르고"],
		["알면", "모르면"],
		["있었", "없었"],
		["있어", "없어"],
		["있습니", "없습니"],
		["있다", "없다"],
		["있고", "없고"],
		["있으면", "없으면"]
	]),
	// HANGUL_INITIALS (korean/core/primitives.js). Mechanics: grammar machinery (jamo, particles, endings) that legitimately lives in code.
	JAMO_HANGUL_INITIALS: Object.freeze(['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']),
	// HANGUL_MEDIALS (korean/core/primitives.js). Mechanics: grammar machinery (jamo, particles, endings) that legitimately lives in code.
	JAMO_HANGUL_MEDIALS: Object.freeze(['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ']),
	// HANGUL_FINALS (korean/core/primitives.js). Mechanics: grammar machinery (jamo, particles, endings) that legitimately lives in code.
	JAMO_HANGUL_FINALS: Object.freeze(['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']),
	// CLAUSAL_QUIZ_BANKS (korean/concord/clausal_generator.js). Data fix: quiz content; belongs in data/ as a table, not in code.
	CLAUSAL_GEN_CLAUSAL_QUIZ_BANKS: Object.freeze({
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
	}),
	// PARTICLE_SPECS (korean/analyzer/particles.js). Mechanics: grammar machinery (jamo, particles, endings) that legitimately lives in code.
	PARTICLE_PARTICLE_SPECS: Object.freeze([
		// Compound particles (delimiter cliticized to case particle)
		{ text: "에서는", ids: [199, 36], desc: "에서 + 는 (Location topic)", isCompound: true },
		{ text: "에서도", ids: [199, 366], desc: "에서 + 도 (Location additive)", isCompound: true },
		{ text: "에는", ids: [132, 36], desc: "에 + 는 (Time/Location topic)", isCompound: true },
		{ text: "에다가", ids: [995, 996], desc: "에다가 (Location on / in addition to)", isCompound: true },
		{ text: "에다", ids: [995, 996], desc: "에다 (Location on / in addition to)", isCompound: true },
		{ text: "에도", ids: [132, 366], desc: "에 + 도 (Time/Location additive)", isCompound: true },
		{ text: "에게는", ids: [618, 36], desc: "에게 + 는 (Dative topic)", isCompound: true },
		{ text: "에게도", ids: [618, 366], desc: "에게 + 도 (Dative additive)", isCompound: true },
		{ text: "한테는", ids: [618, 36], desc: "한테 + 는 (Dative informal topic)", isCompound: true },
		{ text: "한테도", ids: [618, 366], desc: "한테 + 도 (Dative informal additive)", isCompound: true },
		{ text: "에게나", ids: [618, 1333], desc: "에게 + 나 (Dative quantity/choice)", isCompound: true },
		{ text: "만의", ids: [1402, 856], desc: "만 + 의 (Only + Possessive)", isCompound: true },
		{ text: "에나", ids: [132, 1333], desc: "에 + 나 (Location + inclusive delimiter)", isCompound: true },
		{ text: "께서도", ids: [648, 366], desc: "께서 + 도 (Honorific subject + also)", isCompound: true },
		{ text: "께는", ids: [647, 36], desc: "께 + 는 (Dative honorific topic)", isCompound: true },
		{ text: "께도", ids: [647, 366], desc: "께 + 도 (Dative honorific additive)", isCompound: true },
	
		// Primary case & delimiter particles
		{ text: "에서", ids: [199], desc: "에서 (Location of action / source)" },
		{ text: "에게", ids: [618], desc: "에게 (Dative)" },
		{ text: "한테", ids: [618], desc: "한테 (Dative informal)" },
		{ text: "께", ids: [647], desc: "께 (Dative honorific)" },
		{ text: "께서", ids: [648], desc: "께서 (Honorific subject marker)" },
		{ text: "으로", ids: [1240, 1241, 1242], desc: "-(으)로 (Direction / Means / Status)", batchimReq: "consonant_not_l" },
		{ text: "로", ids: [1240, 1241, 1242], desc: "-(으)로 (Direction / Means / Status)", batchimReq: "vowel_or_l" },
		{ text: "이나", ids: [1333, 1334], desc: "이나 (Choice / Quantity)", batchimReq: true },
		{ text: "나", ids: [1333, 1334], desc: "(이)나 (Choice / Quantity)", batchimReq: false },
		{ text: "마다", ids: [1797], desc: "마다 (Each / Every)" },
		{ text: "이랑", ids: [276], desc: "(이)랑 (And / With)", batchimReq: true },
		{ text: "랑", ids: [276], desc: "(이)랑 (And / With)", batchimReq: false },
		{ text: "이라서", ids: [1385], desc: "이라서 (Cause/reason for noun)", batchimReq: true },
		{ text: "라서", ids: [1385], desc: "(이)라서 (Cause/reason for noun)", batchimReq: false },
		{ text: "이라도", ids: [1453], desc: "(이)라도 (Compromise / At least)", batchimReq: true },
		{ text: "라도", ids: [1453], desc: "(이)라도 (Compromise / At least)", batchimReq: false },
		{ text: "하고", ids: [367], desc: "하고 (And / With)" },
		{ text: "부터", ids: [1312], desc: "부터 (Starting point)" },
		{ text: "까지", ids: [1826], desc: "까지 (Ending point)" },
		{ text: "은", ids: [36], desc: "은 / 는 (Topic)", batchimReq: true },
		{ text: "는", ids: [36], desc: "은 / 는 (Topic)", batchimReq: false },
		{ text: "이", ids: [96], desc: "이 / 가 (Subject)", batchimReq: true },
		{ text: "가", ids: [96], desc: "이 / 가 (Subject)", batchimReq: false },
		{ text: "을", ids: [173], desc: "을 / 를 (Object)", batchimReq: true },
		{ text: "를", ids: [173], desc: "을 / 를 (Object)", batchimReq: false },
		{ text: "에", ids: [132, 200, 275], desc: "에 (Location / Direction / Time)" },
		{ text: "과", ids: [1624], desc: "과 (And / With)", batchimReq: true },
		{ text: "와", ids: [1624], desc: "와 (And / With)", batchimReq: false },
		{ text: "도", ids: [366], desc: "도 (Also / Too)" },
		{ text: "의", ids: [856, 857], desc: "의 (Possessive / Relation)" },
		{ text: "보다", ids: [680], desc: "보다 (Comparative particle)" },
		{ text: "만큼", ids: [1469], desc: "만큼 (Extent / Degree delimiter)" },
		{ text: "밖에", ids: [1522], desc: "밖에 (Restriction / Only with negative verb)" },
		{ text: "에게서", ids: [1706], desc: "에게서 (Ablative / From person formal)" },
		{ text: "한테서", ids: [1707], desc: "한테서 (Ablative / From person informal)" },
		{ text: "쯤", ids: [653], desc: "쯤 (Approximation particle)" },
		{ text: "만", ids: [1402], desc: "만 (Only)" },
		{ text: "아", ids: [1834], desc: "아 / 야 (Vocative)", batchimReq: true },
		{ text: "야", ids: [1834], desc: "아 / 야 (Vocative)", batchimReq: false },
		{ text: "이라고", ids: [1865], desc: "(이)라고 (Quotation)", batchimReq: true },
		{ text: "라고", ids: [1865], desc: "(이)라고 (Quotation)", batchimReq: false }
	]),
	// ALLOWED_COMPOUND_P1 (korean/analyzer/particles.js). Mechanics: grammar machinery (jamo, particles, endings) that legitimately lives in code.
	PARTICLE_ALLOWED_COMPOUND_P1: new Set([
		"에서", "에", "에게", "한테", "께서", "으로", "로", "과", "와", "부터", "까지", "만", "보다"
	]),
	// ALLOWED_COMPOUND_P2 (korean/analyzer/particles.js). Mechanics: grammar machinery (jamo, particles, endings) that legitimately lives in code.
	PARTICLE_ALLOWED_COMPOUND_P2: new Set([
		"는", "은", "도", "만", "의", "나", "야"
	]),
	// VALID_CONTRACTED_TOPIC_STEMS (korean/analyzer/particles.js). Mechanics: grammar machinery (jamo, particles, endings) that legitimately lives in code.
	PARTICLE_VALID_CONTRACTED_TOPIC_STEMS: new Set([
		"나", "너", "저", "우리", "저희", "그대",
		"이거", "그거", "저거", "여기", "거기", "저기", "어디",
		"어제", "때", "오빠", "엄마", "아빠", "친구", "누나", "언니",
		"뭐", "누구"
	]),
	// NON_SUBJECT_DEICTICS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_NON_SUBJECT_DEICTICS: new Set([
		"누구", "누가", "무엇", "뭐", "어디", "언제", "얼마", "몇",
		"이곳", "그곳", "저곳", "이거", "그거", "저거", "이것", "그것", "저것"
	]),
	// SUBJECT_PERSONAL_PRONOUNS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_SUBJECT_PERSONAL_PRONOUNS: new Set(["나", "저", "우리", "저희", "그", "그녀"]),
	// COLLOQUIAL_NON_SUBJECT_PERSONS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_COLLOQUIAL_NON_SUBJECT_PERSONS: new Set(["얘들", "놈", "녀석"]),
	// NON_AGENT_PERSON_WORDS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_NON_AGENT_PERSON_WORDS: new Set([
		"사람", "나이", "이름", "성함", "연세", "생일", "생신", "고향", "주소", "전화번호", "번호",
		"취미", "전공", "성별", "국적", "키", "몸무게", "얼굴", "마음", "성격", "버릇", "습관",
		"목소리", "눈물", "땀", "피", "꿈", "생각", "기분", "감정", "말씀", "진지", "댁", "병환", "약주"
	]),
	// NO_DIRECT_OBJECT_VERBS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_NO_DIRECT_OBJECT_VERBS: new Set(["말씀하다", "끓다", "식다", "터지다", "들어있다"]),
	// PLACEMENT_VERBS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_PLACEMENT_VERBS: new Set(["놓다", "올려놓다", "두다", "담다", "넣다"]),
	// ORIGIN_MOTION_VERBS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_ORIGIN_MOTION_VERBS: new Set(["출발하다", "나가다", "나오다", "출국하다", "떠나다"]),
	// STATIC_POSTURE_VERBS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_STATIC_POSTURE_VERBS: new Set(["눕다", "앉다", "살다"]),
	// DYNAMIC_ACTIVITY_MOTION_VERBS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_DYNAMIC_ACTIVITY_MOTION_VERBS: new Set(["달리다", "걷다", "뛰다", "산책하다", "조깅하다", "수영하다", "등산하다"]),
	// PATH_MOTION_NOUNS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_PATH_MOTION_NOUNS: new Set(["길", "거리", "횡단보도", "다리", "공원", "학교"]),
	// DEPARTURE_ORIGIN_NOUNS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_DEPARTURE_ORIGIN_NOUNS: new Set(["공항", "인천공항", "김포공항", "한국", "미국", "일본", "중국", "서울"]),
	// BROAD_WORLD_REGIONS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_BROAD_WORLD_REGIONS: new Set(["서양", "동양", "세계"]),
	// STATIC_REST_PLACES (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_STATIC_REST_PLACES: new Set(["침대", "방", "집", "소파", "의자"]),
	// RESIDENTIAL_LIVING_PLACES (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_RESIDENTIAL_LIVING_PLACES: new Set(["집", "아파트", "기숙사", "하숙집", "원룸", "한국", "서울", "부산", "제주도", "미국", "일본", "중국", "고향", "시골", "도시", "동네"]),
	// SEATING_SURFACE_PLACES (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_SEATING_SURFACE_PLACES: new Set(["의자", "자리", "소파", "벤치", "바닥"]),
	// LYING_SURFACE_PLACES (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_LYING_SURFACE_PLACES: new Set(["침대", "소파", "바닥", "방"]),
	// DAILY_ROUTINE_POSTURE_VERBS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_DAILY_ROUTINE_POSTURE_VERBS: new Set(["샤워하다", "세수하다", "목욕하다", "닦다", "자다", "일어나다", "앉다", "눕다"]),
	// DAILY_DEICTIC_TIME_WORDS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_DAILY_DEICTIC_TIME_WORDS: new Set(["아침", "오전", "오후", "저녁", "밤", "오늘", "어제", "내일", "매일", "날마다", "일찍"]),
	// MEDIA_WORK_NOUNS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_MEDIA_WORK_NOUNS: new Set(["액션영화", "코미디 영화", "영화", "드라마", "프로그램"]),
	// MOVING_RESIDENCE_PLACES (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_MOVING_RESIDENCE_PLACES: new Set(["집", "원룸", "아파트", "기숙사", "하숙집", "방", "서울", "부산", "대구", "인천", "한국", "고향", "동네"]),
	// ATTENDANCE_VENUES (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_ATTENDANCE_VENUES: new Set(["학교", "수업", "학원", "모임", "회의", "대학교"]),
	// RUNNING_VENUES (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_RUNNING_VENUES: new Set(["공원", "한강공원", "운동장", "길", "거리", "산", "바다"]),
	// SOLID_COOKING_VERBS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_SOLID_COOKING_VERBS: new Set(["삶다", "굽다", "볶다", "튀기다", "다지다", "썰다"]),
	// SOLID_COOKING_NOUNS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_SOLID_COOKING_NOUNS: new Set(["고기", "생선", "채소", "라면", "돼지고기", "소고기", "닭고기", "달걀", "감자", "양파"]),
	// NON_SOLID_COOKING_NOUNS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_NON_SOLID_COOKING_NOUNS: new Set(["물", "주스", "콜라", "사이다", "커피", "차", "술", "맥주", "우유", "뷔페", "식당", "설렁탕", "미역국", "된장찌개", "김치찌개"]),
	// BOILABLE_NOUNS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_BOILABLE_NOUNS: new Set(["물", "라면", "찌개", "국", "탕", "차", "보리차", "설렁탕", "미역국", "된장찌개", "김치찌개"]),
	// DRINKABLE_NOUNS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_DRINKABLE_NOUNS: new Set(["물", "주스", "콜라", "사이다", "커피", "차", "술", "맥주", "우유"]),
	// FRAGILE_BREAKABLE_NOUNS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_FRAGILE_BREAKABLE_NOUNS: new Set(["유리", "거울", "접시", "컵", "그릇", "달걀", "잠"]),
	// QUITTABLE_NOUNS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_QUITTABLE_NOUNS: new Set(["일", "직장", "회사", "공부", "운동", "아르바이트", "담배", "술"]),
	// GENERAL_TRANSITIVE_FALLBACK_KOREAN (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_GENERAL_TRANSITIVE_FALLBACK_KOREAN: new Set([
		"사다", "보다", "찾다", "기다리다", "준비하다", "바꾸다",
		"사용하다", "이용하다", "배우다", "기억하다", "좋아하다", "원하다", "고르다"
	]),
	// GENERAL_EVALUATIVE_FALLBACK_KOREAN (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_GENERAL_EVALUATIVE_FALLBACK_KOREAN: new Set([
		"좋다", "많다", "괜찮다", "필요하다", "중요하다", "유명하다",
		"편하다", "어렵다", "쉽다", "비싸다", "싸다", "크다", "작다"
	]),
	// POSSESSION_CALQUE_VERBS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_POSSESSION_CALQUE_VERBS: new Set(["가지다", "사다", "구매하다", "주문하다", "선물하다", "만들다", "빌리다", "얻다", "줍다"]),
	// SOUP_STEW_NOUNS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_SOUP_STEW_NOUNS: new Set(["설렁탕", "미역국", "된장찌개", "김치찌개"]),
	// SOUP_STEW_ACTION_VERBS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_SOUP_STEW_ACTION_VERBS: new Set(["먹다", "끓이다", "데우다", "주문하다", "좋아하다", "맛보다"]),
	// DRINK_ACTION_VERBS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_DRINK_ACTION_VERBS: new Set(["마시다", "사다", "주문하다", "따르다", "좋아하다"]),
	// LANGUAGE_ACTION_VERBS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_LANGUAGE_ACTION_VERBS: new Set(["공부하다", "배우다", "가르치다", "잘하다", "연습하다", "알다", "모르다", "좋아하다"]),
	// TRANSITIVE_PLACE_VERBS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_TRANSITIVE_PLACE_VERBS: new Set(["방문하다", "찾다", "청소하다", "구경하다"]),
	// BODY_CARE_ACTION_VERBS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_BODY_CARE_ACTION_VERBS: new Set(["닦다", "씻다", "치료하다", "보다", "만지다"]),
	// COMMERCIAL_TRANSACTION_VERBS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_COMMERCIAL_TRANSACTION_VERBS: new Set(["사다", "팔다", "바꾸다", "주문하다", "이용하다", "사용하다"]),
	// NON_COMMODITY_NOUNS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_NON_COMMODITY_NOUNS: new Set([
		"잠", "휴대", "길이", "소화", "기온", "기분", "마음", "성격",
		"손", "코", "얼굴", "허리", "강남스타일", "주차 금지", "경치", "생활", "대화", "태권도", "반", "제목"
	]),
	// FIRST_PERSON_SUBJECT_PRONOUNS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_FIRST_PERSON_SUBJECT_PRONOUNS: new Set(["저", "나", "우리", "저희"]),
	// PRICING_ELIGIBLE_NOUNS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_PRICING_ELIGIBLE_NOUNS: new Set(["물건", "선물", "음식", "옷", "표", "가방", "모자", "신발", "시계", "자동차"]),
	// RELATIONAL_OR_FORMULAIC_DVS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_RELATIONAL_OR_FORMULAIC_DVS: new Set(["안녕하다", "싶다", "결과 다르다", "같다", "비슷하다", "다르다", "어울리다", "오랜만이다", "친하다"]),
	// RESTRICTED_NON_TARGET_DVS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_RESTRICTED_NON_TARGET_DVS: new Set(["정숙하다", "웬만하다", "울퉁불퉁하다", "따사롭다", "야하다", "고맙다", "감사하다", "미안하다", "죄송하다", "낫다", "싫다"]),
	// INTERROGATIVE_DVS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_INTERROGATIVE_DVS: new Set(["어떻다", "어떠하다"]),
	// INTERPERSONAL_ATTITUDE_DVS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_INTERPERSONAL_ATTITUDE_DVS: new Set(["감사하다", "죄송하다", "미안하다", "고맙다"]),
	// SUBJECTIVE_EXPERIENCER_DVS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_SUBJECTIVE_EXPERIENCER_DVS: new Set([
		"즐겁다", "기쁘다", "슬프다", "부럽다", "그립다", "부끄럽다", "외롭다", "불안하다",
		"무섭다", "힘들다", "졸리다", "창피하다", "심심하다", "행복하다", "섭섭하다", "피곤하다"
	]),
	// NON_PERSON_ATTRIBUTE_DVS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_NON_PERSON_ATTRIBUTE_DVS: new Set([
		"울퉁불퉁하다", "매끄럽다", "비싸다", "싸다", "맑다", "흐리다",
		"따뜻하다", "시원하다", "춥다", "덥다", "적다", "야하다", "빠르다"
	]),
	// PRICING_DVS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_PRICING_DVS: new Set(["비싸다", "싸다"]),
	// SMALL_STATIONERY_NOUNS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_SMALL_STATIONERY_NOUNS: new Set(["거울", "필통", "지우개", "볼펜", "연필", "휴지", "가위", "자"]),
	// ERGONOMIC_INTEREST_DVS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_ERGONOMIC_INTEREST_DVS: new Set(["편하다", "불편하다", "재미없다", "재미있다", "간단하다"]),
	// TICKET_CREDENTIAL_NOUNS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_TICKET_CREDENTIAL_NOUNS: new Set(["기차표", "표", "명함", "엽서", "우표", "카드", "신분증", "학생증", "여권"]),
	// SIZE_THICKNESS_DVS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_SIZE_THICKNESS_DVS: new Set(["작다", "크다", "얇다", "두껍다"]),
	// PHYSICAL_DIMENSION_DVS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_PHYSICAL_DIMENSION_DVS: new Set(["작다", "크다", "얇다", "두껍다", "무겁다", "가볍다", "길다", "짧다"]),
	// AGE_COMPATIBLE_DVS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_AGE_COMPATIBLE_DVS: new Set(["많다", "적다", "어리다"]),
	// RESULTATIVE_PAST_DVS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_RESULTATIVE_PAST_DVS: new Set(["잘생기다", "못생기다", "오래되다"]),
	// SOUP_STEW_DVS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_SOUP_STEW_DVS: new Set(["맛있다", "뜨겁다", "따뜻하다", "싱겁다", "짜다", "얼큰하다"]),
	// RULE_PROHIBITION_DVS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_RULE_PROHIBITION_DVS: new Set(["필요하다", "중요하다", "엄격하다", "있다", "없다"]),
	// LANGUAGE_DVS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_LANGUAGE_DVS: new Set(["어렵다", "쉽다", "재미있다", "중요하다", "좋다", "필요하다"]),
	// BODY_PART_DVS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_BODY_PART_DVS: new Set(["아프다", "시리다", "좋다", "튼튼하다", "괜찮다", "하얗다"]),
	// NON_PHYSICAL_ATTR_NOUNS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_NON_PHYSICAL_ATTR_NOUNS: new Set(["나이", "게임", "날씨", "생활"]),
	// HUMAN_APPEARANCE_DVS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_HUMAN_APPEARANCE_DVS: new Set(["날씬하다", "뚱뚱하다", "잘생기다", "못생기다", "마르다", "정숙하다", "웬만하다"]),
	// WEATHER_TEMPERATURE_DVS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_WEATHER_TEMPERATURE_DVS: new Set(["맑다", "흐리다", "쌀쌀하다", "화창하다", "무덥다", "춥다", "덥다", "따뜻하다", "시원하다"]),
	// CONCRETE_PHYSICAL_DVS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_CONCRETE_PHYSICAL_DVS: new Set([
		"크다", "작다", "넓다", "좁다", "길다", "짧다", "높다", "낮다",
		"있다", "없다", "오래되다", "필요하다", "비싸다", "싸다", "무겁다", "가볍다", "편하다", "불편하다"
	]),
	// BULKY_OR_MEDIUM_OBJECTS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_BULKY_OR_MEDIUM_OBJECTS: new Set([
		"컴퓨터", "텔레비전", "책상", "의자", "소파", "침대", "가방", "신발", "구두", "운동화",
		"옷", "코트", "바지", "치마", "책", "공책", "우산", "옷걸이", "거울", "칠판"
	]),
	// FOOD_OR_DRINK_ITEMS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_FOOD_OR_DRINK_ITEMS: new Set(["우유", "물", "음료", "주스", "김치", "고기", "과일", "달걀", "음식", "사과", "빵", "반찬"]),
	// PUT_IN_CONTAINERS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_PUT_IN_CONTAINERS: new Set(["가방", "주머니", "상자", "냉장고", "서랍", "봉투", "지갑"]),
	// TINY_CONTAINERS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_TINY_CONTAINERS: new Set(["봉투", "주머니", "지갑", "필통", "컵", "그릇"]),
	// FALLBACK_CONTAINERS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_FALLBACK_CONTAINERS: new Set(["가방", "상자", "서랍"]),
	// PLURAL_SUBJECT_WORDS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_PLURAL_SUBJECT_WORDS: new Set(["우리", "저희", "가족", "친구들", "학생들", "사람들", "아이들", "부모님"]),
	// EXCLUDED_TIME_ADVERBS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_EXCLUDED_TIME_ADVERBS: new Set(["아직", "벌써", "이미", "언제", "금방", "이제", "방금", "아까", "새로", "드디어", "미리", "오래"]),
	// DAILY_HABIT_ADVERBS (korean/concord/argument_concord.js). Data fix: a class of words; each member is a fact about that word, so a data.tags/SemanticData tag.
	ARG_DAILY_HABIT_ADVERBS: new Set(["날마다", "매일"]),

	// ---- HOISTED: chains and inline tables lifted out of functions (2026-11-22). AUTONAMED = name is mechanical (file, function, subject): rename to the rule. ----

	// AUTONAMED chain (korean/generation/unit_sentence_generator.js, expandFormulaIntoClause): restOfFormula is one of these. Unclassified: rename to the rule; Data fix if a word class.
	UNITGEN_EXPAND_FORMULA_INTO_CLAUSE_RESTOFFORMULA_ONE_OF: Object.freeze(['있어요','없어요']),

	// AUTONAMED chain (korean/generation/unit_sentence_generator.js, buildASTForGrammarUnit): aKo is one of these. Unclassified: rename to the rule; Data fix if a word class.
	UNITGEN_AST_GRAMMAR_UNIT_AKO_ONE_OF: Object.freeze(['안','못']),

	// AUTONAMED chain (korean/generation/unit_sentence_generator.js, buildASTForGrammarUnit): ko is one of these. Unclassified: rename to the rule; Data fix if a word class.
	UNITGEN_AST_GRAMMAR_UNIT_KO_ONE_OF: Object.freeze(['(이)랑','하고']),

	// AUTONAMED chain (korean/generation/unit_sentence_generator.js, buildASTForNominal): chosenKo is one of these. Unclassified: rename to the rule; Data fix if a word class.
	UNITGEN_AST_NOMINAL_CHOSENKO_ONE_OF: Object.freeze(['담다','놓다','두다','넣다']),

	// AUTONAMED chain (korean/generation/unit_sentence_generator.js, buildASTForNominal): ko is one of these. Unclassified: rename to the rule; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF: Object.freeze(['무엇','뭐']),

	// AUTONAMED chain (korean/generation/unit_sentence_generator.js, buildASTForNominal): ko is one of these. Unclassified: rename to the rule; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_2: Object.freeze(['누구','누가']),

	// AUTONAMED chain (korean/generation/unit_sentence_generator.js, buildASTForNominal): ko is one of these. Unclassified: rename to the rule; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_3: Object.freeze(['여기','이곳']),

	// AUTONAMED chain (korean/generation/unit_sentence_generator.js, buildASTForNominal): vKo is one of these. Unclassified: rename to the rule; Data fix if a word class.
	UNITGEN_AST_NOMINAL_VKO_ONE_OF: Object.freeze(['이사하다','살다','생활하다']),

	// AUTONAMED chain (korean/generation/unit_sentence_generator.js, buildASTForNominal): ko is one of these. Unclassified: rename to the rule; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_4: Object.freeze(['저기','저곳']),

	// AUTONAMED chain (korean/generation/unit_sentence_generator.js, buildASTForNominal): ko is one of these. Unclassified: rename to the rule; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_5: Object.freeze(['살','세']),

	// AUTONAMED chain (korean/generation/unit_sentence_generator.js, buildASTForNominal): ko is one of these. Unclassified: rename to the rule; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_6: Object.freeze(['잔','병']),

	// AUTONAMED chain (korean/generation/unit_sentence_generator.js, buildASTForNominal): ko is one of these. Unclassified: rename to the rule; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_7: Object.freeze(['명','분']),

	// AUTONAMED chain (korean/generation/unit_sentence_generator.js, buildASTForNominal): ko is one of these. Unclassified: rename to the rule; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_8: Object.freeze(['월','일']),

	// AUTONAMED chain (korean/generation/unit_sentence_generator.js, buildASTForActionVerb): verbKo is one of these. Unclassified: rename to the rule; Data fix if a word class.
	UNITGEN_AST_ACTION_VERB_VERBKO_ONE_OF: Object.freeze(['잘하다','못하다']),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, expandFormulaIntoClause): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_EXPAND_FORMULA_INTO_CLAUSE_CHOSENV_DATA_SCHEMA_KOREAN_ONE_OF: new Set(["잘생기다", "못생기다", "오래되다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, expandFormulaIntoClause): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_EXPAND_FORMULA_INTO_CLAUSE_P_DATA_SCHEMA_KOREAN_ONE_OF_2: new Set(["이것", "그것", "저것", "이거", "그거", "저거"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, expandFormulaIntoClause): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_EXPAND_FORMULA_INTO_CLAUSE_P_DATA_SCHEMA_KOREAN_ONE_OF: new Set(["저", "나", "우리"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, expandFormulaIntoClause): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_EXPAND_FORMULA_INTO_CLAUSE_N_DATA_SCHEMA_KOREAN_ONE_OF_5: new Set(["말씀", "진지", "연세", "성함", "생신", "댁", "병환", "약주"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, expandFormulaIntoClause): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.

	// AUTONAMED (korean/generation/unit_sentence_generator.js, expandFormulaIntoClause): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_EXPAND_FORMULA_INTO_CLAUSE_N_DATA_SCHEMA_KOREAN_ONE_OF_3: new Set(["한국어", "영어", "일본어", "중국어", "요리", "노래", "운전", "컴퓨터", "수영", "태권도", "말"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, expandFormulaIntoClause): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_EXPAND_FORMULA_INTO_CLAUSE_CVERBKO_ONE_OF: new Set(["가르치다", "주다", "드리다", "보내다", "선물하다", "빌려주다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, expandFormulaIntoClause): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_EXPAND_FORMULA_INTO_CLAUSE_N_DATA_SCHEMA_KOREAN_ONE_OF_2: new Set(["친구", "동생", "남동생", "여동생", "학생", "아이"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, expandFormulaIntoClause): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_EXPAND_FORMULA_INTO_CLAUSE_N_DATA_SCHEMA_KOREAN_ONE_OF: new Set(["얼마", "누구", "무엇", "뭐", "어디", "언제", "몇", "며칠"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, expandFormulaIntoClause): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_EXPAND_FORMULA_INTO_CLAUSE_V_DATA_SCHEMA_KOREAN_ONE_OF_3: new Set(["잘생기다", "못생기다", "오래되다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, expandFormulaIntoClause): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_EXPAND_FORMULA_INTO_CLAUSE_V_DATA_SCHEMA_KOREAN_ONE_OF_2: new Set(["오다", "올라오다", "내려오다", "들어오다", "나오다", "돌아오다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, expandFormulaIntoClause): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_EXPAND_FORMULA_INTO_CLAUSE_V_DATA_SCHEMA_KOREAN_ONE_OF: new Set(["전화가 오다", "화가 나다", "비가 오다", "눈이 오다", "바람이 불다", "못하다", "잘하다", "방학하다", "나빠하다", "좋아하다", "싫어하다", "부러워하다", "슬퍼하다", "기뻐하다", "결석하다", "지각하다", "실수하다", "잊어버리다", "잃어버리다", "넘어지다", "때리다"]),

	// NOMINAL_CAUSE_MAIN_VERBS (korean/generation/unit_sentence_generator.js, buildASTForGrammarUnit), hoisted whole. Unclassified: Data fix if a word class, Mechanics if grammar machinery.
	UNITGEN_AST_GRAMMAR_UNIT_NOMINAL_CAUSE_MAIN_VERBS: new Set(["피곤하다", "바쁘다", "힘들다", "늦다", "기쁘다", "슬프다", "건강하다", "괜찮다", "좋다", "나쁘다", "걱정되다", "쉬다", "일하다", "공부하다", "기다리다", "만나다", "가다", "오다", "먹다", "사다", "준비하다"]),

	// EXCLUDED_CAUSAL_MAIN_VERBS (korean/generation/unit_sentence_generator.js, buildASTForGrammarUnit), hoisted whole. Unclassified: Data fix if a word class, Mechanics if grammar machinery.
	UNITGEN_AST_GRAMMAR_UNIT_EXCLUDED_CAUSAL_MAIN_VERBS: new Set(["돌아가시다", "기뻐하다", "몸이 떨리다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForGrammarUnit): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_GRAMMAR_UNIT_N_DATA_SCHEMA_KOREAN_ONE_OF_5: new Set(["할아버지", "할머니"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForGrammarUnit): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_GRAMMAR_UNIT_MAINVERB_DATA_SCHEMA_KOREA_ONE_OF: new Set(["놓다", "올려놓다", "두다", "담다", "넣다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForGrammarUnit): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_GRAMMAR_UNIT_VKO_ONE_OF_3: new Set(["잘생기다", "못생기다", "오래되다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForGrammarUnit): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_GRAMMAR_UNIT_VKO_ONE_OF_2: new Set(["비슷하다", "다르다", "같다", "이다", "아니다", "태어나다", "줄다", "늘다", "걱정되다", "어떻다", "어떠하다", "어울리다", "오랜만이다", "행복하다", "외롭다", "불안하다", "부끄럽다", "슬프다", "기쁘다", "즐겁다", "부럽다", "그립다", "무섭다", "힘들다", "졸리다", "창피하다", "심심하다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForGrammarUnit): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_GRAMMAR_UNIT_VKO_ONE_OF: new Set(["죽다", "걸리다", "지내다", "빌리다", "들다", "되다", "나다", "태어나다", "줄다", "늘다", "걱정되다", "들어주다", "대다", "도와드리다", "여쭙다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForGrammarUnit): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_GRAMMAR_UNIT_AKO_ONE_OF_2: new Set(["그렇게", "이렇게", "저렇게", "다함께", "따로"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForGrammarUnit): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_GRAMMAR_UNIT_N_DATA_SCHEMA_KOREAN_ONE_OF_4: new Set(["사과", "빵", "공책", "책", "연필", "볼펜", "지우개", "가방", "상자", "의자", "선물", "컵", "우산", "모자"]),

	// korSpecs (korean/generation/unit_sentence_generator.js, buildASTForGrammarUnit), hoisted whole. Unclassified: Data fix if a word class, Mechanics if grammar machinery.
	UNITGEN_AST_GRAMMAR_UNIT_KOR_SPECS: Object.freeze([
					{ c: "개", n: ["사과", "빵", "선물", "모자", "우산", "가방"], v: ["사다", "먹다", "주다", "받다"] },
					{ c: "잔", n: ["커피", "녹차", "차", "우유", "주스", "물"], v: ["마시다", "사다", "시키다", "주문하다"] },
					{ c: "병", n: ["물", "맥주", "우유", "주스"], v: ["마시다", "사다", "시키다"] },
					{ c: "권", n: ["책", "공책", "교과서", "잡지"], v: ["읽다", "사다", "빌리다"] },
					{ c: "마리", n: ["강아지", "고양이"], v: ["키우다", "보다", "좋아하다"] }
				]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForGrammarUnit): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_GRAMMAR_UNIT_V_DATA_SCHEMA_KOREAN_ONE_OF_5: new Set(["읽다", "보다", "공부하다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForGrammarUnit): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_GRAMMAR_UNIT_V_DATA_SCHEMA_KOREAN_ONE_OF_4: new Set(["내다", "받다", "쓰다", "주다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForGrammarUnit): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_GRAMMAR_UNIT_V_DATA_SCHEMA_KOREAN_ONE_OF_3: new Set(["시키다", "주문하다", "먹다", "사다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForGrammarUnit): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_GRAMMAR_UNIT_N_DATA_SCHEMA_KOREAN_ONE_OF_3: new Set(["책", "교과서", "소설책", "만화책", "잡지", "공책"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForGrammarUnit): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_GRAMMAR_UNIT_N_DATA_SCHEMA_KOREAN_ONE_OF_2: new Set(["돈", "현금", "용돈", "배달비", "버스비"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForGrammarUnit): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_GRAMMAR_UNIT_N_DATA_SCHEMA_KOREAN_ONE_OF: new Set(["불고기", "삼겹살", "비빔밥", "냉면", "삼계탕"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForGrammarUnit): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_GRAMMAR_UNIT_V_DATA_SCHEMA_KOREAN_ONE_OF_2: new Set(["읽다", "보다", "먹다", "만나다", "가다", "연습하다", "운동하다", "듣다", "부르다", "쓰다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForGrammarUnit): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_GRAMMAR_UNIT_V_DATA_SCHEMA_KOREAN_ONE_OF: new Set(["일어나다", "출발하다", "도착하다", "만나다", "시작하다", "끝나다", "자다", "출근하다", "퇴근하다", "식사하다", "운동하다", "공부하다"]),

	// conjDomainSpecs (korean/generation/unit_sentence_generator.js, buildASTForGrammarUnit), hoisted whole. Unclassified: Data fix if a word class, Mechanics if grammar machinery.
	UNITGEN_AST_GRAMMAR_UNIT_CONJ_DOMAIN_SPECS: Object.freeze([
				{ nouns: ["불고기", "비빔밥", "김밥", "냉면", "삼겹살", "피자", "자장면", "짬뽕", "우동", "초밥", "빵", "사과", "딸기", "과일", "김치"], dvs: ["맛있다", "좋다", "비싸다", "싸다", "많다"] },
				{ nouns: ["커피", "녹차", "차", "우유", "주스", "물", "맥주"], dvs: ["맛있다", "따뜻하다", "시원하다", "좋다", "싸다"] },
				{ nouns: ["책", "공책", "가방", "모자", "시계", "우산", "볼펜", "연필", "사전", "교과서"], dvs: ["좋다", "많다", "비싸다", "싸다", "작다", "크다", "필요하다"] },
				{ nouns: ["교실", "도서관", "방", "집", "기숙사", "식당", "카페", "사무실", "공원"], dvs: ["깨끗하다", "조용하다", "넓다", "크다", "좋다", "가깝다"] },
				{ nouns: ["친구", "동생", "학생", "요리사", "가수", "의사", "간호사"], dvs: ["친절하다", "바쁘다", "좋다", "유명하다"] }
			]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForModifierOrParticleLike): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_N_DATA_SCHEMA_KOREAN_ONE_OF_8: new Set(["친구", "동생", "형", "오빠", "누나", "언니", "학생", "부모님", "어머니", "아버지"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForModifierOrParticleLike): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_CHOSENVERB_DATA_SCHEMA_KOR_ONE_OF: new Set(["통화하다", "이야기하다", "인사하다", "싸우다", "결혼하다", "사귀다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForModifierOrParticleLike): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_U_DATA_SCHEMA_KOREAN_ONE_OF_2: new Set(["누구", "누가", "무엇", "뭐", "언제", "어디"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForModifierOrParticleLike): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_P_DATA_SCHEMA_KOREAN_ONE_OF: new Set(["우리", "저희"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForModifierOrParticleLike): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_KO_ONE_OF_7: new Set(["모두", "다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForModifierOrParticleLike): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_K_VKO_INCLUDES_K_LIST_SOME: Object.freeze(["낫다", "걸리다", "끝나다", "시작되다", "고장 나다", "죽다", "생기다", "열리다", "닫히다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForModifierOrParticleLike): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_K_ONE_OF_3: new Set(["잘생기다", "못생기다", "오래되다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForModifierOrParticleLike): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_K_ONE_OF_2: new Set(["알아보다", "고치다", "물어보다", "키우다", "이사하다", "입학하다", "졸업하다", "결혼하다", "세다", "빌리다", "바꾸다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForModifierOrParticleLike): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_K_ONE_OF: new Set(["생기다", "방학하다", "시작되다", "태어나다", "졸업하다", "입학하다", "이사하다", "죽다", "결혼하다", "고장 나다", "끝나다", "터지다", "내리다", "끓다", "식다", "말다", "사먹다", "여쭙다", "돌아가시다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForModifierOrParticleLike): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_KO_ONE_OF_6: new Set(["날마다", "매일"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForModifierOrParticleLike): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_KO_ONE_OF_5: new Set(["열심히", "천천히", "빨리"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForModifierOrParticleLike): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_KO_ONE_OF_4: new Set(["가끔", "자주", "항상", "늘", "언제나", "보통", "매달", "매주", "매년", "날마다", "매일"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForModifierOrParticleLike): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_KO_ONE_OF_3: new Set(["가끔", "자주", "항상", "늘", "언제나", "보통", "매일", "매주", "매달", "매년", "날마다"]),

	// counters (korean/generation/unit_sentence_generator.js, buildASTForModifierOrParticleLike), hoisted whole. Unclassified: Data fix if a word class, Mechanics if grammar machinery.
	UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_COUNTERS: Object.freeze(["명", "개", "권", "잔", "병", "시간", "달", "마리"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForModifierOrParticleLike): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_V_DATA_SCHEMA_KOREAN_ONE_OF_4: new Set(["안녕하다", "싶다", "어떠하다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForModifierOrParticleLike): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_V_DATA_SCHEMA_KOREAN_ONE_OF_3: new Set(["안녕하다", "싶다", "어떠하다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForModifierOrParticleLike): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_U_DATA_SCHEMA_KOREAN_ONE_OF: new Set(["인형", "드라마", "자전거", "오토바이", "햇빛"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForModifierOrParticleLike): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_VKO_ONE_OF: new Set(["싶다", "안녕하다", "죄송하다", "어떻다", "이렇다", "그렇다", "저렇다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForModifierOrParticleLike): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_V_DATA_SCHEMA_KOREAN_ONE_OF_2: new Set(["내다", "쓰다", "받다", "주다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForModifierOrParticleLike): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_V_DATA_SCHEMA_KOREAN_ONE_OF: new Set(["읽다", "보다", "쓰다", "공부하다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForModifierOrParticleLike): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_N_DATA_SCHEMA_KOREAN_ONE_OF_7: new Set(["책", "교과서", "소설책", "만화책", "동화책", "전공책", "잡지", "공책"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForModifierOrParticleLike): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_N_DATA_SCHEMA_KOREAN_ONE_OF_6: new Set(["돈", "현금", "용돈", "배달비", "버스비", "교통비", "입장료", "요금"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForModifierOrParticleLike): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_N_DATA_SCHEMA_KOREAN_ONE_OF_5: new Set(["사과", "빵", "공책", "책", "연필", "볼펜", "지우개", "가방", "상자", "의자", "선물", "컵", "우산", "모자"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForModifierOrParticleLike): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_N_DATA_SCHEMA_KOREAN_ONE_OF_4: new Set(["이", "얼마", "누구", "무엇", "뭐", "어디", "언제", "몇"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForModifierOrParticleLike): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_N_DATA_SCHEMA_KOREAN_ONE_OF_3: new Set(["나라", "고향", "도시", "학교", "회사", "집", "방", "가게", "식당", "카페", "은행", "병원", "공원", "친구", "사람", "선생님", "버스", "지하철", "계절", "요일", "쪽", "음식", "색깔", "책", "영화", "노래", "신발"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForModifierOrParticleLike): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_N_DATA_SCHEMA_KOREAN_ONE_OF_2: new Set(["직진", "좌회전", "우회전", "유턴", "스크린도어"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForModifierOrParticleLike): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_N_DATA_SCHEMA_KOREAN_ONE_OF: new Set(["이", "얼마", "누구", "무엇", "뭐", "어디", "언제", "몇"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForModifierOrParticleLike): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_KO_ONE_OF_2: new Set(["지난", "이번", "다음", "올"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForModifierOrParticleLike): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_KO_ONE_OF: new Set(["어느", "무슨", "어떤", "몇"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_27: new Set(["책상", "탁자", "식탁", "의자", "바닥", "침대"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_26: new Set(["접시", "그릇", "상자", "가방", "냉장고", "바구니"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_CHOSENVERB_DATA_SCHEMA_KOR_ONE_OF_2: new Set(["어떻다", "어떠하다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_25: new Set(["접시", "그릇", "바구니", "상자"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_VERBUNIT_DATA_SCHEMA_KOREA_ONE_OF: new Set(["잘생기다", "못생기다", "오래되다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_VKO_ONE_OF_18: new Set(["할인하다", "팔다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_39: new Set(["아랫사람", "노인", "어른", "아이", "학생", "조카", "남동생", "여동생", "얘들", "사나이", "놈"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_38: new Set(["아이", "조카", "동생", "남동생", "여동생", "사나이", "놈"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_37: new Set(["저", "나", "우리", "저희", "제", "내"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_36: new Set(["이것", "그것", "저것", "이거", "그거", "저거", "무엇", "뭐", "얼마", "몇", "여기", "거기", "저기", "어디", "이곳", "그곳", "저곳", "언제", "며칠"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_35: new Set(["나", "저", "우리", "저희", "너", "너희", "그", "그녀", "당신", "누구", "누가", "제", "내", "네"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_24: new Set(["언니", "누나", "여동생", "어머니", "엄마", "친구", "여자", "학생"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_SUBJ_DATA_SCHEMA_KOREAN_ONE_OF: new Set(["오빠", "형", "남동생", "아버지", "아빠", "할아버지", "작은아버지", "큰아버지", "삼촌", "아저씨", "남자", "사나이"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_ARG_NOUNUNIT_DATA_SCHEMA_K_ONE_OF: new Set(["치마", "원피스"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_VERBKOPLACE_ONE_OF_2: new Set(["출근하다", "도착하다", "입학하다", "출국하다", "떠나다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_VERBKOPLACE_ONE_OF: new Set(["달리다", "걷다", "뛰다", "산책하다", "조깅하다", "수영하다", "등산하다", "떠나다", "출국하다", "출발하다", "나오다", "지나가다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_VKO_ONE_OF_17: new Set(["출근하다", "도착하다", "입학하다", "출국하다", "떠나다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_VKO_ONE_OF_16: new Set(["가다", "소풍을 가다", "여행하다", "출발하다", "나가다", "돌아가다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_VKO_ONE_OF_15: new Set(["치다", "녹음하다", "다운로드하다", "원하다", "기억하다", "사용하다", "찾다", "바르다", "소독하다", "깎다", "덜다", "연기하다", "서명하다", "발표하다", "주고받다", "세우다", "올려놓다", "보여주다", "부르다", "내려오다", "올라오다", "사귀다", "모으다", "안내하다", "질문하다", "빌리다", "설거지하다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_34: new Set(["꽃집", "문구점", "찜질방", "도서관", "병원", "약국", "은행", "백화점", "빵집", "체육관", "학생식당", "학생회관", "서울", "부산"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_VKO_ONE_OF_14: new Set(["자르다", "튀기다", "썰다", "볶다", "굽다", "끓이다", "삶다", "말다", "부치다", "양념하다", "내리다", "다지다", "뿌리다", "깎다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_VKO_ONE_OF_13: new Set(["세수하다", "목욕하다", "샤워하다", "자다", "낮잠 자다", "졸다", "일어나다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_33: new Set(["집", "할아버지 댁", "고향"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_VKO_ONE_OF_12: new Set(["사귀다", "안내하다", "모으다", "올리다", "올려놓다", "보여주다", "바르다", "깎다", "소독하다", "주고받다", "연기하다", "낚시하다", "서명하다", "부르다", "발표하다", "질문하다", "내려오다", "올라오다", "세우다", "물어보다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_32: new Set(["꽃집", "문구점", "빵집", "학생회관", "학생식당"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_VKO_ONE_OF_11: new Set(["공부하다", "읽다", "쓰다", "배우다", "빌리다", "가르치다", "필기하다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_VKO_ONE_OF_10: new Set(["사다", "고르다", "팔다", "준비하다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_VKO_ONE_OF_9: new Set(["먹다", "마시다", "시키다", "주문하다", "말다", "씹다", "덜다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_VKO_ONE_OF_8: new Set(["내리다", "하차하다", "타다", "갈아타다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_VKO_ONE_OF_7: new Set(["입학하다", "결석하다", "출석하다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_VKO_ONE_OF_6: new Set(["출근하다", "퇴근하다", "벌다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_VKO_ONE_OF_5: new Set(["생활하다", "초대하다", "설거지하다", "키우다", "정리하다", "신다", "벗다", "입다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_31: new Set(["집", "기숙사", "하숙집", "원룸", "아파트", "고향"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_VKO_ONE_OF_4: new Set(["오다", "올라오다", "내려오다", "들어오다", "나오다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_30: new Set(["바다", "강", "호수"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_29: new Set(["수영장", "바다", "강", "운동장"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_28: new Set(["바다", "산", "시골", "제주도", "속초"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_27: new Set(["학교", "수업", "학원", "회사", "모임", "회의", "대학교"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_26: new Set(["산", "설악산", "백두산", "한라산"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_25: new Set(["공항", "인천공항", "김포공항", "한국", "미국", "일본", "중국", "서울", "외국"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_24: new Set(["산", "바다", "강", "호수", "공원", "한강공원", "공항", "인천공항", "김포공항", "학교", "대학교", "학원", "회사", "한국", "미국", "일본", "중국", "서울", "시골", "제주도", "속초"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_VKO_ONE_OF_3: new Set(["걸리다", "지내다", "되다", "나다", "죽다", "생기다", "터지다", "끓다", "식다", "놓다", "두다", "담다", "넣다", "보이다", "끼다", "개다", "싸다", "쌓다", "알다", "모르다", "기억하다", "원하다", "생각하다", "사랑하다", "남다", "붓다", "낫다", "뜨거워지다", "피다", "늘다", "줄다", "돌아가시다", "넘어지다", "떨리다", "눕다", "서다", "앉다", "잘하다", "못하다", "올려놓다", "보여주다", "보여드리다", "때리다", "지나가다", "빌려주다", "나빠하다", "배달시키다", "걸레질하다", "좌회전하다", "우회전하다", "세일하다", "할인하다", "바르다", "깎다", "소독하다", "묶다", "매다", "접다", "당기다", "밀다", "세다", "확인하다", "섞다", "버리다", "서명하다", "전하다", "짓다", "잡다", "예약하다", "건너다", "출국하다", "지각하다", "등산하다", "민박하다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_23: new Set(["산", "바다", "강", "호수", "공원", "한강공원", "스키장", "온천", "농구장"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_22: new Set(["저기", "거기", "여기", "이곳", "그곳", "저곳"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_21: new Set(["주차장", "길", "집", "회사", "학교", "백화점", "마트"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_20: new Set(["도서관", "교실", "학교", "대학교", "학원", "집", "기숙사", "원룸", "서재", "방", "서점"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_19: new Set(["꽃집", "문구점", "백화점", "마트", "가게", "서점", "빵집", "편의점", "약국", "시장"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_18: new Set(["식당", "학생식당", "카페", "빵집", "집", "기숙사", "맛집", "뷔페", "북경반점"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_17: new Set(["버스", "지하철", "택시", "기차", "정류장", "버스 정류장", "지하철역", "역", "터미널", "공항", "서울역", "부산역", "이촌역", "홍대입구역", "광화문역"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_16: new Set(["학교", "초등학교", "중학교", "고등학교", "대학교", "회사", "학원", "병원", "교회", "은행"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_15: new Set(["학교", "초등학교", "중학교", "고등학교", "대학교", "대학원", "유치원", "학원"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_14: new Set(["회사", "사무실", "은행", "병원", "학교", "공장", "가게", "식당", "카페", "서점", "빵집", "마트", "백화점", "약국"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_13: new Set(["집", "원룸", "아파트", "기숙사", "하숙집", "고향", "서울", "부산", "대구", "속초", "한국", "미국", "일본", "중국", "독일", "베트남", "프랑스", "외국", "도시", "동네"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_12: new Set(["학생회관", "식당", "카페", "편의점", "저기", "거기", "여기", "그곳"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_11: new Set(["교실", "도서관", "은행", "우체국", "병원", "약국", "학교", "사무실", "서점", "공항", "박물관", "미술관", "지하철역", "버스 정류장", "꽃집", "문구점", "찜질방", "산", "바다", "강", "호수", "공원", "한강공원", "노래방", "피시방", "영화관", "극장", "체육관", "백화점", "마트", "시장", "미용실", "세탁소"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_V_DATA_SCHEMA_KOREAN_ONE_OF_9: new Set(["크다", "작다", "아름답다", "많다", "좋다", "유명하다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_10: new Set(["여기", "거기", "저기", "어디", "이곳", "그곳", "저곳"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_23: new Set(["달", "주", "해", "번", "학기", "겨울", "여름"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_VKO_ONE_OF_2: new Set(["맑다", "흐리다", "쌀쌀하다", "화창하다", "무덥다", "춥다", "덥다", "따뜻하다", "시원하다"]),

	// TRANSIENT_TIME_DVS (korean/generation/unit_sentence_generator.js, buildASTForNominal), hoisted whole. Unclassified: Data fix if a word class, Mechanics if grammar machinery.
	UNITGEN_AST_NOMINAL_TRANSIENT_TIME_DVS: new Set(["바쁘다", "한가하다", "조용하다", "시끄럽다", "복잡하다", "피곤하다", "배고프다", "춥다", "덥다", "따뜻하다", "시원하다", "쌀쌀하다", "맑다", "흐리다", "화창하다", "무덥다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_KO_ONE_OF_9: new Set(["아침", "점심", "저녁"]),

	// PREFERRED_TIME_AVS (korean/generation/unit_sentence_generator.js, buildASTForNominal), hoisted whole. Unclassified: Data fix if a word class, Mechanics if grammar machinery.
	UNITGEN_AST_NOMINAL_PREFERRED_TIME_AVS: new Set(["일어나다", "자다", "출근하다", "퇴근하다", "가다", "오다", "도착하다", "출발하다", "공부하다", "일하다", "운동하다", "산책하다", "쉬다", "먹다", "마시다", "식사하다", "요리하다", "만나다", "전화하다", "이야기하다", "읽다", "쓰다", "보다", "듣다", "청소하다", "쇼핑하다", "사다", "준비하다", "연습하다", "운전하다"]),

	// EXCLUDED_TIME_AVS (korean/generation/unit_sentence_generator.js, buildASTForNominal), hoisted whole. Unclassified: Data fix if a word class, Mechanics if grammar machinery.
	UNITGEN_AST_NOMINAL_EXCLUDED_TIME_AVS: new Set(["때리다", "검사하다", "전하다", "밀다", "당기다", "말다", "포장하다", "세다", "올려놓다", "내려놓다", "붓다", "뜨거워지다", "낫다", "피다", "늘다", "줄다", "돌아가시다", "넘어지다", "떨리다", "바르다", "깎다", "소독하다", "묶다", "매다", "접다", "걸레질하다", "세일하다", "할인하다", "좌회전하다", "우회전하다", "썰다", "볶다", "굽다", "끓이다", "삶다", "튀기다", "다지다", "뿌리다", "가지다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_NKO_ONE_OF_9: new Set(["책", "공책", "가방", "컵", "시계", "열쇠", "우산", "신발", "인형", "고양이", "강아지", "사과", "연필", "볼펜", "안경", "휴대전화", "모자", "지갑"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_NKO_ONE_OF_8: new Set(["팩스", "프린터", "텔레비전", "컴퓨터", "냉장고", "세탁기"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_NKO_ONE_OF_7: new Set(["사람", "학생", "친구", "차", "자전거", "버스", "나무", "공원", "정류장", "카페", "서점", "빵집", "식당", "고양이", "강아지", "의자", "벤치"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_NKO_ONE_OF_6: new Set(["나라", "외국", "세계", "방", "서재", "욕실"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_NKO_ONE_OF_5: new Set(["책상", "의자", "탁자", "침대", "소파", "창문", "문", "거실", "화장실", "부엌", "방", "서재", "교실", "사람", "친구", "학생"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_NKO_ONE_OF_4: new Set(["책", "공책", "가방", "지갑", "열쇠", "사과", "연필", "볼펜", "안경", "휴대전화", "우산"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_NKO_ONE_OF_3: new Set(["팩스", "프린터"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_NKO_ONE_OF_2: new Set(["책상", "의자", "탁자", "침대", "소파", "학생", "친구", "사람", "선생님"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_NKO_ONE_OF: new Set(["사람", "학생", "친구", "아이", "고양이", "강아지", "나무", "차", "버스", "자전거", "택시", "벤치"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_GROUNDKO_ONE_OF_2: new Set(["학교", "도서관", "식당", "건물", "빌딩", "공원", "집", "나무", "기숙사", "카페", "병원", "은행"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_GROUNDKO_ONE_OF: new Set(["방", "교실", "서재", "욕실", "화장실", "거실", "부엌", "안방", "연구실", "사무실", "강의실"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_22: new Set(["이", "나이", "기분", "소화", "기온", "길이", "성격", "마음", "스트레스", "여유", "잠", "베트남말", "한국말", "배달비", "천", "이쪽", "저쪽", "여기", "거기", "무릎", "손", "발", "눈", "코", "귀", "입", "머리", "목", "테니스", "수영", "축구", "인사", "계산", "앱", "어플", "프로그램", "참기름", "설탕", "소금", "간장", "변비약", "냉동식품", "초밥", "얼마", "덱", "댁", "구경거리", "롤러코스터"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_21: new Set(["이", "나이", "말", "한국말", "베트남말", "중국말", "일본말", "영어", "서울", "부산", "호주", "러시아", "한국", "미국", "일본", "중국", "저기", "그곳", "여기", "거기", "산", "바다", "강", "호수", "한강공원", "스키장", "온천", "농구장", "고속도로", "뷔페", "극장", "노약자석", "횡단보도", "방석"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_20: new Set(["학교", "도서관", "식당", "집", "방", "책상", "의자", "식탁", "탁자", "침대", "소파", "가방", "상자", "나무", "건물", "빌딩", "공원", "문"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_19: new Set(["책상", "탁자", "식탁", "침대", "의자", "소파", "바닥", "가방", "책", "공책", "상자"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_18: new Set(["집", "학교", "도서관", "교실", "방", "식당", "카페", "건물", "빌딩", "병원", "은행", "기숙사"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_17: new Set(["책상", "의자", "식탁", "탁자", "침대", "소파", "나무", "창문"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_V_DATA_SCHEMA_KOREAN_ONE_OF_8: new Set(["좋아하다", "원하다", "찾다", "바라다", "생각하다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_MAINVERBKO_ONE_OF: new Set(["가다", "오다", "다니다", "살다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_V_DATA_SCHEMA_KOREAN_ONE_OF_7: new Set(["찾다", "가다", "좋아하다", "원하다", "알아보다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_V_DATA_SCHEMA_KOREAN_ONE_OF_6: new Set(["좋다", "조용하다", "깨끗하다", "편하다", "따뜻하다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_V_DATA_SCHEMA_KOREAN_ONE_OF_5: new Set(["가다", "살다", "쉬다", "만나다", "공부하다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_PORTIONOBJ_DATA_SCHEMA_KOR_ONE_OF_2: new Set(["우유", "물"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_PORTIONOBJ_DATA_SCHEMA_KOR_ONE_OF: new Set(["책", "숙제"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_16: new Set(["사과", "케이크", "피자", "빵", "우유", "책", "숙제", "물"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_15: new Set(["식당", "집", "가게", "방", "교실", "학교", "카페", "부엌", "식탁", "책상"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_14: new Set(["할인", "이자율", "확률", "비율", "성공률"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_13: new Set(["영화", "드라마", "시", "소설", "비디오"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_12: new Set(["대강당", "강당", "교실", "학원"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_11: new Set(["초등학교", "중학교", "고등학교", "대학교", "대학원", "학생"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_10: new Set(["방", "교실", "사무실", "호실"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_9: new Set(["집", "하숙집", "빌딩", "건물", "아파트"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_8: new Set(["아이", "아기", "학생", "동생", "조카", "친구"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_7: new Set(["책", "잡지", "공책", "사전"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_6: new Set(["책", "교과서", "잡지", "신문", "사전", "만화책"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_V_DATA_SCHEMA_KOREAN_ONE_OF_4: new Set(["보다", "읽다", "만나다", "가다", "먹다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_V_DATA_SCHEMA_KOREAN_ONE_OF_3: new Set(["입학하다", "졸업하다", "출발하다", "도착하다", "여행하다", "만나다", "이사하다", "방학하다", "운동하다", "쉬다", "가다", "오다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_SUBJUNIT_DATA_SCHEMA_KOREA_ONE_OF_3: new Set(["저", "나", "우리", "저희"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_V_DATA_SCHEMA_KOREAN_ONE_OF_2: new Set(["만나다", "출발하다", "도착하다", "가다", "오다", "이사하다", "입학하다", "졸업하다", "방학하다", "모이다", "예약하다", "쉬다", "여행하다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_5: new Set(["학생", "친구", "동생", "형", "오빠", "누나", "언니", "가족", "언니", "회사원"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_SUBJUNIT_DATA_SCHEMA_KOREA_ONE_OF_2: new Set(["저", "나", "우리", "저희"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_V_DATA_SCHEMA_KOREAN_ONE_OF: new Set(["먹다", "마시다", "사다", "보다", "읽다", "만들다", "준비하다", "찾다", "배우다", "듣다", "고르다", "공부하다", "요리하다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_4: new Set(["학생", "친구", "동생", "형", "오빠", "누나", "언니", "아이", "손님", "요리사"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_SUBJUNIT_DATA_SCHEMA_KOREA_ONE_OF: new Set(["저", "나", "우리", "저희"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_3: new Set(["영화", "음식", "책", "노래", "운동", "공부", "일", "선물", "옷", "과일", "음악", "커피", "차", "빵", "고기"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_CHOSENVERB_DATA_SCHEMA_KOR_ONE_OF: new Set(["잘생기다", "못생기다", "오래되다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF_2: new Set(["집", "방", "학교", "회사", "고향", "나라", "교실", "사무실", "이름", "전화번호", "이메일", "주소", "직업", "취미", "전공", "생일", "생각", "마음", "기분", "계획", "약속", "시간", "돈"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForNominal): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_NOMINAL_N_DATA_SCHEMA_KOREAN_ONE_OF: new Set(["이", "얼마", "누구", "무엇", "뭐", "어디", "언제", "몇", "너희", "하늘", "바다", "소화", "기온", "프랑스말", "한국말", "영어", "일본어", "중국어", "비", "눈", "바람", "태풍", "서양", "동양", "한국", "점"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForDescriptiveVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_DESCRIPTIVE_VERB_DVKO_ONE_OF_8: new Set(["있다", "없다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForDescriptiveVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_DESCRIPTIVE_VERB_DVKO_ONE_OF_7: new Set(["있다", "없다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForDescriptiveVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_DESCRIPTIVE_VERB_DVKO_ONE_OF_6: new Set(["아프다", "시리다", "좋다", "튼튼하다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForDescriptiveVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_DESCRIPTIVE_VERB_P_DATA_SCHEMA_KOREAN_ONE_OF_3: new Set(["저", "나", "우리", "저희"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForDescriptiveVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_DESCRIPTIVE_VERB_DVKO_ONE_OF_5: new Set(["피곤하다", "섭섭하다", "졸리다", "배고프다", "목마르다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForDescriptiveVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_DESCRIPTIVE_VERB_DVKO_ONE_OF_4: new Set(["죄송하다", "감사하다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForDescriptiveVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_DESCRIPTIVE_VERB_DVKO_ONE_OF_3: new Set(["죄송하다", "감사하다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForDescriptiveVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_DESCRIPTIVE_VERB_DVKO_ONE_OF_2: new Set(["감사하다", "죄송하다", "미안하다", "고맙다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForDescriptiveVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_DESCRIPTIVE_VERB_P_DATA_SCHEMA_KOREAN_ONE_OF_2: new Set(["이것", "그것", "저것", "이거", "그거", "저거"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForDescriptiveVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_DESCRIPTIVE_VERB_P_DATA_SCHEMA_KOREAN_ONE_OF: new Set(["저", "나", "우리"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForDescriptiveVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_DESCRIPTIVE_VERB_N_DATA_SCHEMA_KOREAN_ONE_OF: new Set(["부장", "교수", "과장", "사장", "선배"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForDescriptiveVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_DESCRIPTIVE_VERB_DVKO_ONE_OF: new Set(["잘생기다", "못생기다", "오래되다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForActionVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_ACTION_VERB_N_DATA_SCHEMA_KOREAN_ONE_OF_15: new Set(["선물", "책", "사과", "꽃", "용돈", "과자", "우산", "모자", "가방", "시계", "편지", "공책"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForActionVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_ACTION_VERB_VERBKO_ONE_OF_5: new Set(["주다", "드리다", "보내다", "선물하다", "빌려주다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForActionVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_ACTION_VERB_N_DATA_SCHEMA_KOREAN_ONE_OF_14: new Set(["질문", "길", "시간", "장소", "이유", "이름", "뜻", "전화번호", "나이", "생일", "약속 시간", "주소"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForActionVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_ACTION_VERB_VERBKO_ONE_OF_4: new Set(["묻다", "물어보다", "여쭙다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForActionVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_ACTION_VERB_N_DATA_SCHEMA_KOREAN_ONE_OF_13: new Set(["한국어", "영어", "일본어", "중국어", "수학", "음악", "태권도", "요리", "한국말"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForActionVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_ACTION_VERB_N_DATA_SCHEMA_KOREAN_ONE_OF_12: new Set(["운동", "요리", "공부", "노래", "춤", "수영", "축구", "농구", "테니스", "태권도", "피아노", "운전", "한국어", "영어", "일본어", "중국어", "한국말", "일본말", "중국말"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForActionVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_ACTION_VERB_N_DATA_SCHEMA_KOREAN_ONE_OF_11: new Set(["수업", "학교", "대학교", "학원", "회의", "모임"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForActionVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_ACTION_VERB_VERBKO_ONE_OF_3: new Set(["결석하다", "출석하다", "입학하다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForActionVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_ACTION_VERB_N_DATA_SCHEMA_KOREAN_ONE_OF_10: new Set(["책", "돈", "지갑", "열쇠", "편지"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForActionVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_ACTION_VERB_N_DATA_SCHEMA_KOREAN_ONE_OF_9: new Set(["가방", "상자", "주머니", "지갑", "방"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForActionVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_ACTION_VERB_N_DATA_SCHEMA_KOREAN_ONE_OF_8: new Set(["접시", "그릇", "상자", "가방", "냉장고", "바구니"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForActionVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_ACTION_VERB_N_DATA_SCHEMA_KOREAN_ONE_OF_7: new Set(["책", "가방", "모자", "휴대전화", "컵", "그릇", "열쇠"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForActionVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_ACTION_VERB_N_DATA_SCHEMA_KOREAN_ONE_OF_6: new Set(["책상", "탁자", "식탁", "의자", "바닥", "침대"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForActionVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_ACTION_VERB_N_DATA_SCHEMA_KOREAN_ONE_OF_5: new Set(["언니", "누나", "여동생", "어머니", "엄마", "친구", "여자", "학생", "선생님"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForActionVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_ACTION_VERB_SUBJUNIT_DATA_SCHEMA_KOREA_ONE_OF_2: new Set(["오빠", "형", "남동생", "아버지", "아빠", "할아버지", "작은아버지", "큰아버지", "삼촌", "아저씨", "남자", "사나이"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForActionVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_ACTION_VERB_ARG_NOUNUNIT_DATA_SCHEMA_K_ONE_OF: new Set(["치마", "원피스"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForActionVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_ACTION_VERB_N_DATA_SCHEMA_KOREAN_ONE_OF_4: new Set(["가게", "마트", "백화점", "식당", "카페", "회사원", "종업원", "사장님", "선배", "친구"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForActionVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_ACTION_VERB_SUBJUNIT_DATA_SCHEMA_KOREA_ONE_OF: new Set(["아랫사람", "윗사람", "노인", "어른", "아이", "얘들", "사나이", "놈"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForActionVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_ACTION_VERB_VERBKO_ONE_OF_2: new Set(["할인하다", "팔다", "배달하다"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForActionVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_ACTION_VERB_N_DATA_SCHEMA_KOREAN_ONE_OF_3: new Set(["풍선", "타이어"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForActionVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_ACTION_VERB_N_DATA_SCHEMA_KOREAN_ONE_OF_2: new Set(["밥", "국", "찌개", "커피", "차", "피자", "음식"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForActionVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_ACTION_VERB_N_DATA_SCHEMA_KOREAN_ONE_OF: new Set(["물", "라면", "찌개", "국", "탕", "보리차"]),

	// AUTONAMED (korean/generation/unit_sentence_generator.js, buildASTForActionVerb): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	UNITGEN_AST_ACTION_VERB_K_VERBKO_INCLUDES_K_LIST_SOME: Object.freeze(["끝나다", "시작되다", "고장 나다", "죽다", "생기다", "열리다", "닫히다", "끓다", "식다", "터지다", "말씀하다", "들어있다"]),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, recomposeASTFromVerifiedSentence): g.text is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_RECOMPOSE_AST_FROM_VERIFIED_SENTENCE_G_TEXT_ONE_OF: Object.freeze(['에게','한테','께']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, recomposeASTFromVerifiedSentence): g.text is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_RECOMPOSE_AST_FROM_VERIFIED_SENTENCE_G_TEXT_ONE_OF_2: Object.freeze(['로','으로']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, recomposeASTFromVerifiedSentence): g.text is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_RECOMPOSE_AST_FROM_VERIFIED_SENTENCE_G_TEXT_ONE_OF_3: Object.freeze(['을','를']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, recomposeASTFromVerifiedSentence): g.text is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_RECOMPOSE_AST_FROM_VERIFIED_SENTENCE_G_TEXT_ONE_OF_4: Object.freeze(['이','가']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, recomposeASTFromVerifiedSentence): g.text is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_RECOMPOSE_AST_FROM_VERIFIED_SENTENCE_G_TEXT_ONE_OF_5: Object.freeze(['은','는']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, recomposeASTFromVerifiedSentence): gText is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_RECOMPOSE_AST_FROM_VERIFIED_SENTENCE_GTEXT_ONE_OF: Object.freeze(['이다','입니다','이에요','예요','이야','야','이고']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, recomposeASTFromVerifiedSentence): gText is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_RECOMPOSE_AST_FROM_VERIFIED_SENTENCE_GTEXT_ONE_OF_2: Object.freeze(['-게','게']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, recomposeASTFromVerifiedSentence): surf is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_RECOMPOSE_AST_FROM_VERIFIED_SENTENCE_SURF_ONE_OF: Object.freeze(['안','못']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, realizeSlot): ko is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_REALIZE_SLOT_KO_ONE_OF: Object.freeze(['너','네']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, realizeSlot): ko is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_REALIZE_SLOT_KO_ONE_OF_2: Object.freeze(['너','네']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, realizeSlot): ko is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_REALIZE_SLOT_KO_ONE_OF_3: Object.freeze(['너','네']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, realizeSlot): ko is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_REALIZE_SLOT_KO_ONE_OF_4: Object.freeze(['나','내']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, realizeSlot): ko is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_REALIZE_SLOT_KO_ONE_OF_5: Object.freeze(['나','내']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, realizeSlot): ko is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_REALIZE_SLOT_KO_ONE_OF_6: Object.freeze(['나','내']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, realizeSlot): ko is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_REALIZE_SLOT_KO_ONE_OF_7: Object.freeze(['저','제']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, realizeSlot): ko is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_REALIZE_SLOT_KO_ONE_OF_8: Object.freeze(['저','제']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, realizeSlot): ko is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_REALIZE_SLOT_KO_ONE_OF_9: Object.freeze(['저','제']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, isUnitEligibleForSlot): uKo must be none of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_IS_UNIT_ELIGIBLE_FOR_SLOT_UKO_NONE_OF: Object.freeze(['이번','다음']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, realizeVerbInflection): suffix is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_REALIZE_VERB_INFLECTION_SUFFIX_ONE_OF: Object.freeze(['어요','아요']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, deduceCopulaMorph): tail is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_DEDUCE_COPULA_MORPH_TAIL_ONE_OF: Object.freeze(['이다','다']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, deduceCopulaMorph): tail is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_DEDUCE_COPULA_MORPH_TAIL_ONE_OF_2: Object.freeze(['이냐고','냐고']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, deduceCopulaMorph): tail is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_DEDUCE_COPULA_MORPH_TAIL_ONE_OF_3: Object.freeze(['이니까','니까']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, deduceCopulaMorph): tail is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_DEDUCE_COPULA_MORPH_TAIL_ONE_OF_4: Object.freeze(['이어서','여서']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, deduceCopulaMorph): tail is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_DEDUCE_COPULA_MORPH_TAIL_ONE_OF_5: Object.freeze(['이었는데','였는데']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, deduceCopulaMorph): tail is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_DEDUCE_COPULA_MORPH_TAIL_ONE_OF_6: Object.freeze(['이었으면','였으면']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, deduceCopulaMorph): tail is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_DEDUCE_COPULA_MORPH_TAIL_ONE_OF_7: Object.freeze(['이었습니다','였습니다']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, deduceCopulaMorph): tail is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_DEDUCE_COPULA_MORPH_TAIL_ONE_OF_8: Object.freeze(['이었어요','였어요']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, deduceCopulaMorph): tail is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_DEDUCE_COPULA_MORPH_TAIL_ONE_OF_9: Object.freeze(['이야','야']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, deduceCopulaMorph): tail is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_DEDUCE_COPULA_MORPH_TAIL_ONE_OF_10: Object.freeze(['이에요','예요']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, normalizeNominalParticleMorph): t is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_NORMALIZE_NOMINAL_PARTICLE_MORPH_T_ONE_OF: Object.freeze(['이랑도','랑도']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, normalizeNominalParticleMorph): t is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_NORMALIZE_NOMINAL_PARTICLE_MORPH_T_ONE_OF_2: Object.freeze(['이랑은','랑은']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, normalizeNominalParticleMorph): t is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_NORMALIZE_NOMINAL_PARTICLE_MORPH_T_ONE_OF_3: Object.freeze(['으로만','로만']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, normalizeNominalParticleMorph): t is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_NORMALIZE_NOMINAL_PARTICLE_MORPH_T_ONE_OF_4: Object.freeze(['으로도','로도']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, normalizeNominalParticleMorph): t is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_NORMALIZE_NOMINAL_PARTICLE_MORPH_T_ONE_OF_5: Object.freeze(['으로는','로는']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, normalizeNominalParticleMorph): t is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_NORMALIZE_NOMINAL_PARTICLE_MORPH_T_ONE_OF_6: Object.freeze(['과도','와도']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, normalizeNominalParticleMorph): t is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_NORMALIZE_NOMINAL_PARTICLE_MORPH_T_ONE_OF_7: Object.freeze(['과는','와는']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, normalizeNominalParticleMorph): t is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_NORMALIZE_NOMINAL_PARTICLE_MORPH_T_ONE_OF_8: Object.freeze(['과의','와의']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, normalizeNominalParticleMorph): t is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_NORMALIZE_NOMINAL_PARTICLE_MORPH_T_ONE_OF_9: Object.freeze(['이라도','라도']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, normalizeNominalParticleMorph): t is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_NORMALIZE_NOMINAL_PARTICLE_MORPH_T_ONE_OF_10: Object.freeze(['이라서','라서']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, normalizeNominalParticleMorph): t is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_NORMALIZE_NOMINAL_PARTICLE_MORPH_T_ONE_OF_11: Object.freeze(['이나','나','(이)나','이/나','이나/나']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, normalizeNominalParticleMorph): t is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_NORMALIZE_NOMINAL_PARTICLE_MORPH_T_ONE_OF_12: Object.freeze(['으로','로','(으)로','-(으)로']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, normalizeNominalParticleMorph): t is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_NORMALIZE_NOMINAL_PARTICLE_MORPH_T_ONE_OF_13: Object.freeze(['이랑','랑']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, normalizeNominalParticleMorph): t is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_NORMALIZE_NOMINAL_PARTICLE_MORPH_T_ONE_OF_14: Object.freeze(['와','과']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, normalizeNominalParticleMorph): t is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_NORMALIZE_NOMINAL_PARTICLE_MORPH_T_ONE_OF_15: Object.freeze(['을','를']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, normalizeNominalParticleMorph): t is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_NORMALIZE_NOMINAL_PARTICLE_MORPH_T_ONE_OF_16: Object.freeze(['이','가']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, normalizeNominalParticleMorph): t is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_NORMALIZE_NOMINAL_PARTICLE_MORPH_T_ONE_OF_17: Object.freeze(['은','는']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, getEffectiveConjRule): ko must be none of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_GET_EFFECTIVE_CONJ_RULE_KO_NONE_OF: Object.freeze(['치르다','들르다','따르다']),

	// ANTONYM_PAIRS (korean/generation/verified_sentence_generator.js, validateVerifiedSentence), hoisted whole. Unclassified: Data fix if a word class, Mechanics if grammar machinery.
	VERIFIED_VALIDATE_VERIFIED_SENTENCE_ANTONYM_PAIRS: new Map([
				["많다", "적다"], ["적다", "많다"], ["크다", "작다"], ["작다", "크다"],
				["길다", "짧다"], ["짧다", "길다"], ["높다", "낮다"], ["낮다", "높다"],
				["넓다", "좁다"], ["좁다", "넓다"], ["덥다", "춥다"], ["춥다", "덥다"],
				["깨끗하다", "더럽다"], ["더럽다", "깨끗하다"], ["밝다", "어둡다"], ["어둡다", "밝다"],
				["쉽다", "어렵다"], ["어렵다", "쉽다"], ["비싸다", "싸다"], ["싸다", "비싸다"],
				["가깝다", "멀다"], ["멀다", "가깝다"], ["빠르다", "느리다"], ["느리다", "빠르다"],
				["가볍다", "무겁다"], ["무겁다", "가볍다"], ["있다", "없다"], ["없다", "있다"],
				["좋다", "나쁘다"], ["나쁘다", "좋다"], ["지루하다", "재미있다"], ["재미있다", "지루하다"],
				["재미없다", "재미있다"], ["시끄럽다", "조용하다"], ["조용하다", "시끄럽다"],
				["친절하다", "불친절하다"], ["편하다", "불편하다"], ["불편하다", "편하다"],
				["편리하다", "불편하다"], ["혼자", "함께"], ["함께", "혼자"], ["같이", "혼자"],
				["네", "아니요"], ["아니요", "네"], ["예", "아니요"]
			]),

	// LEXICAL_HONORIFIC_PREDICATES (korean/generation/verified_sentence_generator.js, validateVerifiedSentence), hoisted whole. Unclassified: Data fix if a word class, Mechanics if grammar machinery.
	VERIFIED_VALIDATE_VERIFIED_SENTENCE_LEXICAL_HONORIFIC_PREDICATES: new Set(["편찮으시다", "계시다", "안 계시다", "주무시다", "드시다", "잡수시다", "말씀하시다", "말씀하다", "돌아가시다"]),

	// GENERIC_REL_HEADS (korean/generation/verified_sentence_generator.js, validateVerifiedSentence), hoisted whole. Unclassified: Data fix if a word class, Mechanics if grammar machinery.
	VERIFIED_VALIDATE_VERIFIED_SENTENCE_GENERIC_REL_HEADS: new Set(["것", "거", "때", "날", "시간", "수", "줄", "일", "방법", "곳", "점", "프로그램", "약속", "생활"]),

	// STRICT_DESCRIPTIVE_VERBS (korean/generation/verified_sentence_generator.js, validateVerifiedSentence), hoisted whole. Unclassified: Data fix if a word class, Mechanics if grammar machinery.
	VERIFIED_VALIDATE_VERIFIED_SENTENCE_STRICT_DESCRIPTIVE_VERBS: new Set([
							"맵다", "달다", "짜다", "시다", "싱겁다",
							"높다", "낮다", "깊다", "넓다", "좁다", "무겁다", "가볍다",
							"따뜻하다", "춥다", "덥다", "쌀쌀하다", "시원하다",
							"건강하다", "똑똑하다", "친절하다", "피곤하다", "배고프다", "심심하다"
						]),

	// WEATHER_PHENOMENON_NOUNS (korean/generation/verified_sentence_generator.js, validateVerifiedSentence), hoisted whole. Unclassified: Data fix if a word class, Mechanics if grammar machinery.
	VERIFIED_VALIDATE_VERIFIED_SENTENCE_WEATHER_PHENOMENON_NOUNS: new Set(["비", "눈", "바람", "태풍"]),

	// VEHICLE_COUNT_VERBS (korean/generation/verified_sentence_generator.js, validateVerifiedSentence), hoisted whole. Unclassified: Data fix if a word class, Mechanics if grammar machinery.
	VERIFIED_VALIDATE_VERIFIED_SENTENCE_VEHICLE_COUNT_VERBS: new Set(["사다", "팔다", "타다", "운전하다", "빌리다", "고치다", "주차하다", "주문하다", "보내다", "쓰다", "사용하다"]),

	// CLOTHING_COUNT_VERBS (korean/generation/verified_sentence_generator.js, validateVerifiedSentence), hoisted whole. Unclassified: Data fix if a word class, Mechanics if grammar machinery.
	VERIFIED_VALIDATE_VERIFIED_SENTENCE_CLOTHING_COUNT_VERBS: new Set(["사다", "팔다", "입다", "벗다", "고르다", "빌리다", "빨다", "다림질하다", "걸다", "선물하다", "주문하다", "보내다", "가지다", "찾다"]),

	// NON_GENERIC_GEOT_VERBS (korean/generation/verified_sentence_generator.js, validateVerifiedSentence), hoisted whole. Unclassified: Data fix if a word class, Mechanics if grammar machinery.
	VERIFIED_VALIDATE_VERIFIED_SENTENCE_NON_GENERIC_GEOT_VERBS: new Set(["마시다", "입다", "신다", "끼다", "벗다", "부르다", "타다", "피우다", "끓이다", "치다", "연주하다"]),

	// STRICT_COLLOCATION_VERBS (korean/generation/verified_sentence_generator.js, validateVerifiedSentence), hoisted whole. Unclassified: Data fix if a word class, Mechanics if grammar machinery.
	VERIFIED_VALIDATE_VERIFIED_SENTENCE_STRICT_COLLOCATION_VERBS: new Set([
								"입다", "신다", "쓰다", "끼다", "매다", "벗다",
								"마시다", "먹다", "피우다", "타다", "치다"
							]),

	// BUTEO_INCOMPATIBLE_VERBS (korean/generation/verified_sentence_generator.js, validateVerifiedSentence), hoisted whole. Unclassified: Data fix if a word class, Mechanics if grammar machinery.
	VERIFIED_VALIDATE_VERIFIED_SENTENCE_BUTEO_INCOMPATIBLE_VERBS: new Set(["놓다", "두다", "담다", "넣다", "잃어버리다", "잊어버리다", "모르다", "알다", "만지다"]),

	// COMPOUND_PREFIX_EN (korean/generation/verified_sentence_generator.js, realizeSlot), hoisted whole. Unclassified: Data fix if a word class, Mechanics if grammar machinery.
	VERIFIED_REALIZE_SLOT_COMPOUND_PREFIX_EN: Object.freeze({ "그": "that", "이": "this", "저": "that", "새": "new", "첫": "first", "한": "one", "가을": "autumn", "여름": "summer", "봄": "spring", "겨울": "winter", "광화문": "Gwanghwamun", "강남": "Gangnam", "신촌": "Sinchon", "서울": "Seoul" }),

	// morphPrefixes (korean/generation/verified_sentence_generator.js, deduceVerbInflection), hoisted whole. Unclassified: Data fix if a word class, Mechanics if grammar machinery.
	VERIFIED_DEDUCE_VERB_INFLECTION_MORPH_PREFIXES: Object.freeze([
			"으/ㄴ데", "으/ㄴ가요", "으/ㄴ지", "으/ㄴ",
			"으/ㄹ까요", "으/ㄹ까", "으/ㄹ래요", "으/ㄹ래", "으/ㄹ게요", "으/ㄹ게", "으/ㄹ",
			"으/면", "으/면서", "으/니까", "으/려고", "으/려면", "으/러",
			"으/시", "으/셔", "으/셨", "으/세",
			"(느)ㄴ다", "(느)ㄴ다고", "는"
		]),

	// candidateConjSuffixes (korean/generation/verified_sentence_generator.js, deduceVerbInflection), hoisted whole. Unclassified: Data fix if a word class, Mechanics if grammar machinery.
	VERIFIED_DEDUCE_VERB_INFLECTION_CANDIDATE_CONJ_SUFFIXES: Object.freeze([
			"습니다/ㅂ니다",
			"습니까/ㅂ니까",
			"으/십니까",
			"으/ㅂ시다",
			"으/십시오",
			"으/세요",
			"으/셨습니다",
			"으/셨어요",
			"으/셔서",
			"으/십니다",
			"으/신",
			"으/시는"
		]),

	// AUTONAMED chain (korean/core/morphology.js, validateTemporalConcord): ch is one of these. Unclassified: rename to the rule; Data fix if a word class.
	MORPH_VALIDATE_TEMPORAL_CONCORD_CH_ONE_OF: Object.freeze(['있','없','겠']),
	// Endings that embed a clause: a future time word there may go with a past main verb (내일 만나기로 했어요, 내일 간다고 했어요).
	MORPH_TEMPORAL_EMBEDDING_ENDINGS: ["기로", "려고", "다고", "라고", "자고", "냐고"],

	// AUTONAMED chain (korean/core/morphology.js, applyHonorificConcord): part is one of these. Unclassified: rename to the rule; Data fix if a word class.
	MORPH_APPLY_HONORIFIC_CONCORD_PART_ONE_OF: Object.freeze(['은','는']),

	// AUTONAMED chain (korean/core/morphology.js, applyHonorificConcord): part is one of these. Unclassified: rename to the rule; Data fix if a word class.
	MORPH_APPLY_HONORIFIC_CONCORD_PART_ONE_OF_2: Object.freeze(['이','가']),

	// AUTONAMED chain (korean/core/morphology.js, applyHonorificConcord): part is one of these. Unclassified: rename to the rule; Data fix if a word class.
	MORPH_APPLY_HONORIFIC_CONCORD_PART_ONE_OF_3: Object.freeze(['을','를']),

	// AUTONAMED chain (korean/core/morphology.js, filterWordsByTense): ko is one of these. Unclassified: rename to the rule; Data fix if a word class.
	MORPH_FILTER_WORDS_BY_TENSE_KO_ONE_OF: Object.freeze(['요즘','지금']),

	// AUTONAMED chain (korean/core/morphology.js, conjugatePredicate): ko is one of these. Unclassified: rename to the rule; Data fix if a word class.
	MORPH_CONJUGATE_PREDICATE_KO_ONE_OF: Object.freeze(['뵙다','뵈다']),

	// AUTONAMED chain (korean/core/morphology.js, attachParticle): nounKo is one of these. Unclassified: rename to the rule; Data fix if a word class.
	MORPH_ATTACH_PARTICLE_NOUNKO_ONE_OF: Object.freeze(['너','네']),

	// AUTONAMED chain (korean/core/morphology.js, attachParticle): nounKo is one of these. Unclassified: rename to the rule; Data fix if a word class.
	MORPH_ATTACH_PARTICLE_NOUNKO_ONE_OF_2: Object.freeze(['나','내']),

	// AUTONAMED chain (korean/core/morphology.js, attachParticle): nounKo is one of these. Unclassified: rename to the rule; Data fix if a word class.
	MORPH_ATTACH_PARTICLE_NOUNKO_ONE_OF_3: Object.freeze(['저','제']),

	// NON_PERSON_HONORIFICS (korean/core/morphology.js, isElderNoun), hoisted whole. Unclassified: Data fix if a word class, Mechanics if grammar machinery.
	MORPH_IS_ELDER_NOUN_NON_PERSON_HONORIFICS: new Set(["말씀", "진지", "연세", "댁", "생신", "병환", "약주", "치하", "성함", "존함", "이름", "나이"]),

	// AUTONAMED (korean/core/morphology.js, canTakeMood): table that was inline in code. Unclassified: rename to the rule it implements; Data fix if a word class.
	MORPH_CAN_TAKE_MOOD_K_KO_INCLUDES_K_LIST_SOME: Object.freeze(["끝나다", "시작되다", "고장 나다", "죽다", "생기다", "열리다", "닫히다"]),

	// ---- HOISTED: chains and inline tables lifted out of functions (2026-11-22). AUTONAMED = name is mechanical (file, function, subject): rename to the rule. ----

	// AUTONAMED chain (korean/generation/unit_sentence_generator.js, expandFormulaIntoClause): suffix is one of these. Unclassified: rename to the rule; Data fix if a word class.
	UNITGEN_EXPAND_FORMULA_INTO_CLAUSE_SUFFIX_INCLUDES_ONE_OF: Object.freeze(['에게','한테']),

	// AUTONAMED chain (korean/generation/unit_sentence_generator.js, expandFormulaIntoClause): suffix is one of these. Unclassified: rename to the rule; Data fix if a word class.
	UNITGEN_EXPAND_FORMULA_INTO_CLAUSE_SUFFIX_INCLUDES_ONE_OF_2: Object.freeze(['이/가','께서']),

	// AUTONAMED chain (korean/generation/unit_sentence_generator.js, expandFormulaIntoClause): suffix is one of these. Unclassified: rename to the rule; Data fix if a word class.
	UNITGEN_EXPAND_FORMULA_INTO_CLAUSE_SUFFIX_INCLUDES_ONE_OF_3: Object.freeze(['이/예요','입니다','이야']),

	// AUTONAMED chain (korean/generation/unit_sentence_generator.js, expandFormulaIntoClause): formula is one of these. Unclassified: rename to the rule; Data fix if a word class.
	UNITGEN_EXPAND_FORMULA_INTO_CLAUSE_FORMULA_INCLUDES_ONE_OF: Object.freeze(['못','안']),

	// AUTONAMED chain (korean/generation/unit_sentence_generator.js, buildASTForGrammarUnit): ko must be none of these. Unclassified: rename to the rule; Data fix if a word class.
	UNITGEN_AST_GRAMMAR_UNIT_KO_INCLUDES_NONE_OF: Object.freeze(['이에요','입니다','이야']),

	// AUTONAMED chain (korean/generation/unit_sentence_generator.js, buildASTForGrammarUnit): f is one of these. Unclassified: rename to the rule; Data fix if a word class.
	UNITGEN_AST_GRAMMAR_UNIT_F_INCLUDES_ONE_OF: Object.freeze(['못','안']),

	// AUTONAMED chain (korean/generation/unit_sentence_generator.js, buildASTForModifierOrParticleLike): k is one of these. Unclassified: rename to the rule; Data fix if a word class.
	UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_K_ENDSWITH_ONE_OF: Object.freeze(['있다','알다']),

	// AUTONAMED chain (korean/generation/unit_sentence_generator.js, buildASTForModifierOrParticleLike): k is one of these. Unclassified: rename to the rule; Data fix if a word class.
	UNITGEN_AST_MODIFIER_OR_PARTICLE_LIKE_K_ENDSWITH_ONE_OF_2: Object.freeze(['있다','알다']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, validateVerifiedSentence): ko is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_VALIDATE_VERIFIED_SENTENCE_KO_ENDSWITH_ONE_OF: Object.freeze(['있다','없다']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, recomposeASTFromVerifiedSentence): surf is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_RECOMPOSE_AST_FROM_VERIFIED_SENTENCE_SURF_INCLUDES_ONE_OF: Object.freeze(['지 않','지 못하']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, recomposeASTFromVerifiedSentence): surf must be none of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_RECOMPOSE_AST_FROM_VERIFIED_SENTENCE_SURF_ENDSWITH_NONE_OF: Object.freeze(['마다','보다']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, recomposeASTFromVerifiedSentence): surf is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_RECOMPOSE_AST_FROM_VERIFIED_SENTENCE_SURF_INCLUDES_ONE_OF_2: Object.freeze(['습니다','ㅂ니다','십니까','십시오']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, realizeSlot): gTexts is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_REALIZE_SLOT_GTEXTS_INCLUDES_ONE_OF: Object.freeze(['을','를']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, realizeSlot): gTexts is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_REALIZE_SLOT_GTEXTS_INCLUDES_ONE_OF_2: Object.freeze(['이','가']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, realizeSlot): gTexts is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_REALIZE_SLOT_GTEXTS_INCLUDES_ONE_OF_3: Object.freeze(['은','는']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, getGrammarLiteralSuffix): cleanSurf must be none of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_GET_GRAMMAR_LITERAL_SUFFIX_CLEANSURF_INCLUDES_NONE_OF: Object.freeze(['알','모르']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, isUnitEligibleForSlot): slotTpl is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_IS_UNIT_ELIGIBLE_FOR_SLOT_SLOTTPL_INCLUDES_ONE_OF: Object.freeze(['지 않','없다','못하']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, realizeVerbInflection): ko is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_REALIZE_VERB_INFLECTION_KO_ENDSWITH_ONE_OF: Object.freeze(['있다','없다']),

	// ---- HOISTED: chains and inline tables lifted out of functions (2026-11-22). AUTONAMED = name is mechanical (file, function, subject): rename to the rule. ----

	// AUTONAMED chain (korean/generation/unit_sentence_generator.js, buildASTForNominal): verbUnit[DATA_SCHEMA.Korean] is one of these. Unclassified: rename to the rule; Data fix if a word class.
	UNITGEN_AST_NOMINAL_VERBUNIT_DATA_SCHEMA_KOREA_ONE_OF_2: Object.freeze(['넣다','담다']),

	// AUTONAMED chain (korean/generation/unit_sentence_generator.js, buildASTForNominal): verbUnit[DATA_SCHEMA.Korean] is one of these. Unclassified: rename to the rule; Data fix if a word class.
	UNITGEN_AST_NOMINAL_VERBUNIT_DATA_SCHEMA_KOREA_ONE_OF_3: Object.freeze(['계시다','있다']),

	// AUTONAMED chain (korean/generation/unit_sentence_generator.js, buildASTForNominal): v[DATA_SCHEMA.Korean] is one of these. Unclassified: rename to the rule; Data fix if a word class.
	UNITGEN_AST_NOMINAL_V_DATA_SCHEMA_KOREAN_ONE_OF_10: Object.freeze(['사다','먹다']),

	// AUTONAMED chain (korean/generation/verified_sentence_generator.js, isUnitEligibleForSlot): u[DATA_SCHEMA.Korean] is one of these. Unclassified: rename to the rule; Data fix if a word class.
	VERIFIED_IS_UNIT_ELIGIBLE_FOR_SLOT_U_DATA_SCHEMA_KOREAN_ONE_OF: Object.freeze(['못','안']),

});

if (typeof module !== 'undefined' && module.exports) module.exports = { HANGUL_CONSTANTS };
else root.HANGUL_CONSTANTS = HANGUL_CONSTANTS;
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : global));
