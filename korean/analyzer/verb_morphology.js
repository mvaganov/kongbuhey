/**
 * korean/analyzer/verb_morphology.js
 *
 * Declarative Verb and Adnominal Suffix Deconstructor Engine.
 * Handles irregular stems (ㅂ, ㄷ, 르, ㅡ), honorifics, tense infixes,
 * inchoatives (-아/어지다), and adnominal participles.
 *
 * Platform: Node.js & Browser (Vanilla JS, zero dependencies).
 */

const { DATA_SCHEMA, decomposeHangul, composeHangul, setFinal, hasBatchim } =
	(typeof require !== 'undefined' ? require('../core/primitives.js') : window);

const VERB_SUFFIX_RULES = [
	// 5-syllable compound endings
	{ suffix: "도와주셨어요", stemType: "fixed_base", baseVerb: "도와주다", grammar: [{ text: "-(으)시-", pos: "Honorific Infix", id: 678, gloss: "honorific subject (ID 678)" }, { text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-아요/어요", pos: "Verb Ending", id: 49, gloss: "polite informal (ID 49)" }] },
	{ suffix: "이야기하셔서", stemType: "fixed_base", baseVerb: "이야기하다", grammar: [{ text: "-(으)시-", pos: "Honorific Infix", id: 678, gloss: "honorific subject (ID 678)" }, { text: "-아/어서", pos: "Verb Ending", id: 459, gloss: "cause / sequential (ID 459)" }] },
	{ suffix: "이야기했어요", stemType: "fixed_base", baseVerb: "이야기하다", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-아요/어요", pos: "Verb Ending", id: 49, gloss: "polite informal (ID 49)" }] },
	{ suffix: "익숙해졌어요", stemType: "fixed_base", baseVerb: "익숙하다", grammar: [{ text: "-어지다", pos: "Verb Ending", id: 801, gloss: "become / get (ID 801)" }, { text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-아요/어요", pos: "Verb Ending", id: 49, gloss: "polite informal (ID 49)" }] },
	{ suffix: "재미있었어요", stemType: "fixed_base", baseVerb: "재미있다", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-아요/어요", pos: "Verb Ending", id: 49, gloss: "polite informal (ID 49)" }] },
	{ suffix: "어려웠어요", stemType: "fixed_base", baseVerb: "어렵다", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-아요/어요", pos: "Verb Ending", id: 49, gloss: "polite informal (ID 49)" }] },
	{ suffix: "어려웠지만", stemType: "fixed_base", baseVerb: "어렵다", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "~지만", pos: "Verb Ending", id: 461, gloss: "but/although (ID 461)" }] },
	{ suffix: "해야겠습니다", stemType: "hada", grammar: [{ text: "-아/어야 하다", pos: "Grammar Pattern", id: 574, gloss: "must/have to do (ID 574)" }, { text: "-겠-", pos: "Pre-final Ending", id: 838, gloss: "volition/intention (ID 838)" }, { text: "-습니다", pos: "Verb Ending", id: 50, gloss: "formal declarative (ID 50)" }] },
	{ suffix: "아야겠습니다", stemType: "stem_da", grammar: [{ text: "-아/어야 하다", pos: "Grammar Pattern", id: 574, gloss: "must/have to do (ID 574)" }, { text: "-겠-", pos: "Pre-final Ending", id: 838, gloss: "volition/intention (ID 838)" }, { text: "-습니다", pos: "Verb Ending", id: 50, gloss: "formal declarative (ID 50)" }] },
	{ suffix: "어야겠습니다", stemType: "stem_da", grammar: [{ text: "-아/어야 하다", pos: "Grammar Pattern", id: 574, gloss: "must/have to do (ID 574)" }, { text: "-겠-", pos: "Pre-final Ending", id: 838, gloss: "volition/intention (ID 838)" }, { text: "-습니다", pos: "Verb Ending", id: 50, gloss: "formal declarative (ID 50)" }] },
	{ suffix: "하시는군요", stemType: "hada", grammar: [{ text: "-(으)시-", pos: "Honorific Infix", id: 678, gloss: "honorific subject (ID 678)" }, { text: "-는군요", pos: "Verb Ending", id: 1645, gloss: "realization exclamatory (ID 1645)" }] },
	{ suffix: "하겠습니다", stemType: "hada", grammar: [{ text: "-겠-", pos: "Pre-final Ending", id: 838, gloss: "volition/intention (ID 838)" }, { text: "-습니다", pos: "Verb Ending", id: 50, gloss: "formal declarative (ID 50)" }] },

	// Interrogative endings (-(으)ㄴ가요 ID 932, -나요 ID 930)
	{ suffix: "은가요", stemType: "stem_da", grammar: [{ text: "-(으)ㄴ가요", pos: "Verb Ending", id: 932, gloss: "polite interrogative (ID 932)" }] },
	{ suffix: "한가요", stemType: "hada", grammar: [{ text: "-(으)ㄴ가요", pos: "Verb Ending", id: 932, gloss: "polite interrogative (ID 932)" }] },
	{ suffix: "인가요", stemType: "fixed_base", baseVerb: "이다", grammar: [{ text: "-(으)ㄴ가요", pos: "Verb Ending", id: 932, gloss: "polite interrogative (ID 932)" }] },
	{ suffix: "나요", stemType: "stem_da", grammar: [{ text: "-나요", pos: "Verb Ending", id: 930, gloss: "polite interrogative (ID 930)" }] },

	// Polite honorific endings (-(으)세요 ID 416)
	{ suffix: "으세요", stemType: "stem_da", grammar: [{ text: "-(으)세요", pos: "Verb Ending", id: 416, gloss: "polite honorific ending (ID 416)" }] },
	{ suffix: "하세요", stemType: "hada", grammar: [{ text: "-(으)세요", pos: "Verb Ending", id: 416, gloss: "polite honorific ending (ID 416)" }] },
	{ suffix: "세요", stemType: "stem_da", grammar: [{ text: "-(으)세요", pos: "Verb Ending", id: 416, gloss: "polite honorific ending (ID 416)" }] },

	// ㅎ-irregular polite endings
	{ suffix: "어때요", stemType: "fixed_base", baseVerb: "어떻다", grammar: [{ text: "-아/어요", pos: "Verb Ending", id: 49, gloss: "polite informal (ID 49)" }] },
	{ suffix: "어때", stemType: "fixed_base", baseVerb: "어떻다", grammar: [{ text: "-아/어", pos: "Verb Ending", id: 459, gloss: "informal (ID 459)" }] },
	{ suffix: "그래요", stemType: "fixed_base", baseVerb: "그렇다", grammar: [{ text: "-아/어요", pos: "Verb Ending", id: 49, gloss: "polite informal (ID 49)" }] },
	{ suffix: "이래요", stemType: "fixed_base", baseVerb: "이렇다", grammar: [{ text: "-아/어요", pos: "Verb Ending", id: 49, gloss: "polite informal (ID 49)" }] },

	// Polite additive and connective -고 endings
	{ suffix: "했고요", stemType: "hada", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-고", pos: "Verb Ending", id: 336, gloss: "connective 'and' (ID 336)" }, { text: "-요", pos: "Particle", id: 49, gloss: "polite particle (ID 49)" }] },
	{ suffix: "았고요", stemType: "stem_da", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-고", pos: "Verb Ending", id: 336, gloss: "connective 'and' (ID 336)" }, { text: "-요", pos: "Particle", id: 49, gloss: "polite particle (ID 49)" }] },
	{ suffix: "었고요", stemType: "stem_da", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-고", pos: "Verb Ending", id: 336, gloss: "connective 'and' (ID 336)" }, { text: "-요", pos: "Particle", id: 49, gloss: "polite particle (ID 49)" }] },
	{ suffix: "하고요", stemType: "hada", grammar: [{ text: "-고", pos: "Verb Ending", id: 336, gloss: "connective 'and' (ID 336)" }, { text: "-요", pos: "Particle", id: 49, gloss: "polite particle (ID 49)" }] },
	{ suffix: "고요", stemType: "stem_da", grammar: [{ text: "-고", pos: "Verb Ending", id: 336, gloss: "connective 'and' (ID 336)" }, { text: "-요", pos: "Particle", id: 49, gloss: "polite particle (ID 49)" }] },

	// Confirmation endings (-지요 / -죠)
	{ suffix: "하지요", stemType: "hada", grammar: [{ text: "-지요", pos: "Verb Ending", id: 1773, gloss: "confirmation ending (ID 1773)" }] },
	{ suffix: "지요", stemType: "stem_da", grammar: [{ text: "-지요", pos: "Verb Ending", id: 1773, gloss: "confirmation ending (ID 1773)" }] },
	{ suffix: "죠", stemType: "stem_da", grammar: [{ text: "-지요", pos: "Verb Ending", id: 1773, gloss: "confirmation ending (ID 1773)" }] },

	// Suggestion / Interrogative endings (-(으)ㄹ까요? ID 1021)
	{ suffix: "일까요", stemType: "copula_l_kkayo", grammar: [{ text: "이다", pos: "Copula", id: 56, gloss: "copula 'be' (ID 56)" }, { text: "-(으)ㄹ까요?", pos: "Verb Ending", id: 1021, gloss: "shall we? / is it? (ID 1021)" }] },
	{ suffix: "할까요", stemType: "hada", grammar: [{ text: "-(으)ㄹ까요?", pos: "Verb Ending", id: 1021, gloss: "shall we? (ID 1021)" }] },
	{ suffix: "을까요", stemType: "stem_da", grammar: [{ text: "-(으)ㄹ까요?", pos: "Verb Ending", id: 1021, gloss: "shall we? (ID 1021)" }] },
	{ suffix: "까요", stemType: "stem_l_kkayo", grammar: [{ text: "-(으)ㄹ까요?", pos: "Verb Ending", id: 1021, gloss: "shall we? (ID 1021)" }] },

	// Present polite informal endings (-아요/어요 ID 49)
	{ suffix: "있어요", stemType: "fixed_base", baseVerb: "있다", grammar: [{ text: "-아요/어요", pos: "Verb Ending", id: 49, gloss: "polite informal (ID 49)" }] },
	{ suffix: "없어요", stemType: "fixed_base", baseVerb: "없다", grammar: [{ text: "-아요/어요", pos: "Verb Ending", id: 49, gloss: "polite informal (ID 49)" }] },
	{ suffix: "어요", stemType: "stem_consonant_polite", grammar: [{ text: "-아요/어요", pos: "Verb Ending", id: 49, gloss: "polite informal (ID 49)" }] },
	{ suffix: "아요", stemType: "stem_consonant_polite", grammar: [{ text: "-아요/어요", pos: "Verb Ending", id: 49, gloss: "polite informal (ID 49)" }] },
	{ suffix: "요", stemType: "stem_open_polite", grammar: [{ text: "-아요/어요", pos: "Verb Ending", id: 49, gloss: "polite informal (ID 49)" }] },

	// Inchoative past conditional (-어지다 + -았/었- + -(으)면)
	{ suffix: "졌으면", stemType: "stem_inchoative_past_cond", grammar: [{ text: "-어지다", pos: "Verb Ending", id: 801, gloss: "become / get (ID 801)" }, { text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-(으)면", pos: "Verb Ending", id: 619, gloss: "conditional 'if/when' (ID 619)" }] },

	// Obligatory / Conditional endings (-아/어야 ID 574)
	{ suffix: "해야", stemType: "hada", grammar: [{ text: "-아/어야", pos: "Verb Ending", id: 574, gloss: "must / only if (ID 574)" }] },
	{ suffix: "아야", stemType: "stem_da", grammar: [{ text: "-아/어야", pos: "Verb Ending", id: 574, gloss: "must / only if (ID 574)" }] },
	{ suffix: "어야", stemType: "stem_da", grammar: [{ text: "-아/어야", pos: "Verb Ending", id: 574, gloss: "must / only if (ID 574)" }] },

	// Bare informal/connective endings on consonant stems (e.g. 먹어 -> 먹다, 받아 -> 받다)
	{ suffix: "어", stemType: "stem_consonant_informal", grammar: [{ text: "-아/어", pos: "Verb Ending", id: 459, gloss: "informal / sequential (ID 459)" }] },
	{ suffix: "아", stemType: "stem_consonant_informal", grammar: [{ text: "-아/어", pos: "Verb Ending", id: 459, gloss: "informal / sequential (ID 459)" }] },

	// 4-syllable compound endings
	{ suffix: "하겠어요", stemType: "hada", grammar: [{ text: "-겠-", pos: "Pre-final Ending", id: 838, gloss: "volition/intention (ID 838)" }, { text: "-아요/어요", pos: "Verb Ending", id: 49, gloss: "polite informal (ID 49)" }] },
	{ suffix: "했습니다", stemType: "hada", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-습니다", pos: "Verb Ending", id: 50, gloss: "formal declarative (ID 50)" }] },
	{ suffix: "갔습니다", stemType: "fixed_base", baseVerb: "가다", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-습니다", pos: "Verb Ending", id: 50, gloss: "formal declarative (ID 50)" }] },
	{ suffix: "왔습니다", stemType: "fixed_base", baseVerb: "오다", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-습니다", pos: "Verb Ending", id: 50, gloss: "formal declarative (ID 50)" }] },
	{ suffix: "봤습니다", stemType: "fixed_base", baseVerb: "보다", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-습니다", pos: "Verb Ending", id: 50, gloss: "formal declarative (ID 50)" }] },
	{ suffix: "됐습니다", stemType: "fixed_base", baseVerb: "되다", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-습니다", pos: "Verb Ending", id: 50, gloss: "formal declarative (ID 50)" }] },
	{ suffix: "줬습니다", stemType: "fixed_base", baseVerb: "주다", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-습니다", pos: "Verb Ending", id: 50, gloss: "formal declarative (ID 50)" }] },
	{ suffix: "있었습니다", stemType: "fixed_base", baseVerb: "있다", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-습니다", pos: "Verb Ending", id: 50, gloss: "formal declarative (ID 50)" }] },
	{ suffix: "없었습니다", stemType: "fixed_base", baseVerb: "없다", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-습니다", pos: "Verb Ending", id: 50, gloss: "formal declarative (ID 50)" }] },
	{ suffix: "았습니다", stemType: "stem_da", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-습니다", pos: "Verb Ending", id: 50, gloss: "formal declarative (ID 50)" }] },
	{ suffix: "었습니다", stemType: "stem_da", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-습니다", pos: "Verb Ending", id: 50, gloss: "formal declarative (ID 50)" }] },
	{ suffix: "하시고", stemType: "hada", grammar: [{ text: "-(으)시-", pos: "Honorific Infix", id: 678, gloss: "honorific subject (ID 678)" }, { text: "-고", pos: "Verb Ending", id: 336, gloss: "connective 'and' (ID 336)" }] },
	{ suffix: "으시고", stemType: "stem_da", grammar: [{ text: "-(으)시-", pos: "Honorific Infix", id: 678, gloss: "honorific subject (ID 678)" }, { text: "-고", pos: "Verb Ending", id: 336, gloss: "connective 'and' (ID 336)" }] },
	{ suffix: "했으면", stemType: "hada", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-(으)면", pos: "Verb Ending", id: 619, gloss: "conditional 'if/when' (ID 619)" }] },
	{ suffix: "았으면", stemType: "stem_da", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-(으)면", pos: "Verb Ending", id: 619, gloss: "conditional 'if/when' (ID 619)" }] },
	{ suffix: "었으면", stemType: "stem_da", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-(으)면", pos: "Verb Ending", id: 619, gloss: "conditional 'if/when' (ID 619)" }] },
	{ suffix: "으십시오", stemType: "stem_da", grammar: [{ text: "-(으)십시오", pos: "Verb Ending", id: 1644, gloss: "formal imperative (ID 1644)" }] },
	{ suffix: "하십시오", stemType: "hada", grammar: [{ text: "-(으)십시오", pos: "Verb Ending", id: 1644, gloss: "formal imperative (ID 1644)" }] },
	{ suffix: "하십니까", stemType: "hada", grammar: [{ text: "-(으)시-", pos: "Honorific Infix", id: 678, gloss: "honorific subject (ID 678)" }, { text: "-ㅂ니까", pos: "Verb Ending", id: 50, gloss: "formal question (ID 50)" }] },
	{ suffix: "으십니까", stemType: "stem_da", grammar: [{ text: "-(으)시-", pos: "Honorific Infix", id: 678, gloss: "honorific subject (ID 678)" }, { text: "-ㅂ니까", pos: "Verb Ending", id: 50, gloss: "formal question (ID 50)" }] },
	{ suffix: "하셔서", stemType: "hada", grammar: [{ text: "-(으)시-", pos: "Honorific Infix", id: 678, gloss: "honorific subject (ID 678)" }, { text: "-아/어서", pos: "Verb Ending", id: 459, gloss: "cause / sequential (ID 459)" }] },
	{ suffix: "셨어요", stemType: "stem_da", grammar: [{ text: "-(으)시-", pos: "Honorific Infix", id: 678, gloss: "honorific subject (ID 678)" }, { text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-아요/어요", pos: "Verb Ending", id: 49, gloss: "polite informal (ID 49)" }] },
	{ suffix: "해졌어요", stemType: "hada", grammar: [{ text: "-어지다", pos: "Verb Ending", id: 801, gloss: "become / get (ID 801)" }, { text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-아요/어요", pos: "Verb Ending", id: 49, gloss: "polite informal (ID 49)" }] },
	{ suffix: "했지만", stemType: "hada", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "~지만", pos: "Verb Ending", id: 461, gloss: "but/although (ID 461)" }] },
	{ suffix: "았지만", stemType: "stem_da", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "~지만", pos: "Verb Ending", id: 461, gloss: "but/although (ID 461)" }] },
	{ suffix: "었지만", stemType: "stem_da", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "~지만", pos: "Verb Ending", id: 461, gloss: "but/although (ID 461)" }] },
	{ suffix: "왔는데", stemType: "fixed_base", baseVerb: "오다", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-는데", pos: "Verb Ending", id: 620, gloss: "background/contrastive (ID 620)" }] },
	{ suffix: "봤는데", stemType: "fixed_base", baseVerb: "보다", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-는데", pos: "Verb Ending", id: 620, gloss: "background/contrastive (ID 620)" }] },
	{ suffix: "됐는데", stemType: "fixed_base", baseVerb: "되다", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-는데", pos: "Verb Ending", id: 620, gloss: "background/contrastive (ID 620)" }] },
	{ suffix: "했는데", stemType: "hada", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-는데", pos: "Verb Ending", id: 620, gloss: "background/contrastive (ID 620)" }] },
	{ suffix: "았는데", stemType: "stem_da", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-는데", pos: "Verb Ending", id: 620, gloss: "background/contrastive (ID 620)" }] },
	{ suffix: "었는데", stemType: "stem_da", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-는데", pos: "Verb Ending", id: 620, gloss: "background/contrastive (ID 620)" }] },
	{ suffix: "괜찮은데", stemType: "fixed_base", baseVerb: "괜찮다", grammar: [{ text: "-는데", pos: "Verb Ending", id: 620, gloss: "background/contrastive (ID 620)" }] },
	{ suffix: "좋았어요", stemType: "fixed_base", baseVerb: "좋다", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-아요/어요", pos: "Verb Ending", id: 49, gloss: "polite informal (ID 49)" }] },
	{ suffix: "있었어요", stemType: "fixed_base", baseVerb: "있다", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-아요/어요", pos: "Verb Ending", id: 49, gloss: "polite informal (ID 49)" }] },
	{ suffix: "없었어요", stemType: "fixed_base", baseVerb: "없다", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-아요/어요", pos: "Verb Ending", id: 49, gloss: "polite informal (ID 49)" }] },
	{ suffix: "왔어요", stemType: "fixed_base", baseVerb: "오다", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-아요/어요", pos: "Verb Ending", id: 49, gloss: "polite informal (ID 49)" }] },
	{ suffix: "봤어요", stemType: "fixed_base", baseVerb: "보다", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-아요/어요", pos: "Verb Ending", id: 49, gloss: "polite informal (ID 49)" }] },
	{ suffix: "됐어요", stemType: "fixed_base", baseVerb: "되다", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-아요/어요", pos: "Verb Ending", id: 49, gloss: "polite informal (ID 49)" }] },
	{ suffix: "했어요", stemType: "hada", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-아요/어요", pos: "Verb Ending", id: 49, gloss: "polite informal (ID 49)" }] },
	{ suffix: "웠어요", stemType: "stem_b_irregular", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-아요/어요", pos: "Verb Ending", id: 49, gloss: "polite informal (ID 49)" }] },
	{ suffix: "웠지만", stemType: "stem_b_irregular", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "~지만", pos: "Verb Ending", id: 461, gloss: "but/although (ID 461)" }] },

	// Inchoative change of state endings (-아/어지다 + -ㅂ니다)
	{ suffix: "아집니다", stemType: "stem_da", grammar: [{ text: "-어지다", pos: "Verb Ending", id: 801, gloss: "become / get (ID 801)" }, { text: "-ㅂ니다", pos: "Verb Ending", id: 50, gloss: "formal declarative (ID 50)" }] },
	{ suffix: "어집니다", stemType: "stem_da", grammar: [{ text: "-어지다", pos: "Verb Ending", id: 801, gloss: "become / get (ID 801)" }, { text: "-ㅂ니다", pos: "Verb Ending", id: 50, gloss: "formal declarative (ID 50)" }] },
	{ suffix: "해집니다", stemType: "hada", grammar: [{ text: "-어지다", pos: "Verb Ending", id: 801, gloss: "become / get (ID 801)" }, { text: "-ㅂ니다", pos: "Verb Ending", id: 50, gloss: "formal declarative (ID 50)" }] },

	// 3-syllable endings
	{ suffix: "으려고", stemType: "stem_da", grammar: [{ text: "-(으)려고", pos: "Verb Ending", id: 816, gloss: "intentive 'in order to' (ID 816)" }] },
	{ suffix: "하려고", stemType: "hada", grammar: [{ text: "-(으)려고", pos: "Verb Ending", id: 816, gloss: "intentive 'in order to' (ID 816)" }] },
	{ suffix: "하니까", stemType: "hada", grammar: [{ text: "-(으)니까", pos: "Verb Ending", id: 53, gloss: "since / because (ID 53)" }] },
	{ suffix: "하면서", stemType: "hada", grammar: [{ text: "-(으)면서", pos: "Verb Ending", id: 711, gloss: "while doing (ID 711)" }] },
	{ suffix: "하는데", stemType: "hada", grammar: [{ text: "-는데", pos: "Verb Ending", id: 620, gloss: "background/contrastive (ID 620)" }] },
	{ suffix: "으면서", stemType: "stem_da", grammar: [{ text: "-(으)면서", pos: "Verb Ending", id: 711, gloss: "while doing (ID 711)" }] },
	{ suffix: "으니까", stemType: "stem_da", grammar: [{ text: "-(으)니까", pos: "Verb Ending", id: 53, gloss: "since / because (ID 53)" }] },
	{ suffix: "으러", stemType: "stem_da", grammar: [{ text: "-(으)러", pos: "Verb Ending", id: 485, gloss: "in order to (ID 485)" }] },
	{ suffix: "하러", stemType: "hada", grammar: [{ text: "-(으)러", pos: "Verb Ending", id: 485, gloss: "in order to (ID 485)" }] },
	{ suffix: "하거나", stemType: "hada", grammar: [{ text: "-거나", pos: "Verb Ending", id: 1291, gloss: "or (ID 1291)" }] },
	{ suffix: "하겠습니다", stemType: "stem_da", grammar: [{ text: "-겠-", pos: "Pre-final Ending", id: 838, gloss: "volition/intention (ID 838)" }, { text: "-습니다", pos: "Verb Ending", id: 50, gloss: "formal declarative (ID 50)" }] },
	{ suffix: "하십시오", stemType: "hada", grammar: [{ text: "-(으)십시오", pos: "Verb Ending", id: 1644, gloss: "formal imperative (ID 1644)" }] },
	{ suffix: "십시오", stemType: "stem_da", grammar: [{ text: "-(으)십시오", pos: "Verb Ending", id: 1644, gloss: "formal imperative (ID 1644)" }] },
	{ suffix: "습니다", stemType: "stem_da", grammar: [{ text: "-습니다", pos: "Verb Ending", id: 50, gloss: "formal declarative (ID 50)" }] },
	{ suffix: "합니다", stemType: "hada", grammar: [{ text: "-ㅂ니다", pos: "Verb Ending", id: 50, gloss: "formal declarative (ID 50)" }] },
	{ suffix: "는군요", stemType: "stem_da", grammar: [{ text: "-는군요", pos: "Verb Ending", id: 1645, gloss: "realization exclamatory (ID 1645)" }] },
	{ suffix: "했네요", stemType: "hada", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-네요", pos: "Verb Ending", id: 839, gloss: "realization/surprise (ID 839)" }] },
	{ suffix: "겠네요", stemType: "stem_da", grammar: [{ text: "-겠-", pos: "Pre-final Ending", id: 838, gloss: "conjecture/volition (ID 838)" }, { text: "-네요", pos: "Verb Ending", id: 839, gloss: "realization/surprise (ID 839)" }] },
	{ suffix: "겠어요", stemType: "stem_da", grammar: [{ text: "-겠-", pos: "Pre-final Ending", id: 838, gloss: "volition/intention (ID 838)" }, { text: "-아요/어요", pos: "Verb Ending", id: 49, gloss: "polite informal (ID 49)" }] },
	{ suffix: "았어요", stemType: "stem_da", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-아요/어요", pos: "Verb Ending", id: 49, gloss: "polite informal (ID 49)" }] },
	{ suffix: "었어요", stemType: "stem_da", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-아요/어요", pos: "Verb Ending", id: 49, gloss: "polite informal (ID 49)" }] },
	{ suffix: "하지만", stemType: "hada", grammar: [{ text: "~지만", pos: "Verb Ending", id: 461, gloss: "but/although (ID 461)" }] },
	{ suffix: "못해요", stemType: "fixed_base", baseVerb: "못하다", grammar: [{ text: "-아요/어요", pos: "Verb Ending", id: 49, gloss: "polite informal (ID 49)" }] },
	{ suffix: "해서", stemType: "hada", grammar: [{ text: "-아/어서", pos: "Verb Ending", id: 459, gloss: "cause / sequential (ID 459)" }] },
	{ suffix: "겨서", stemType: "stem_gi_da", grammar: [{ text: "-아/어서", pos: "Verb Ending", id: 459, gloss: "cause / sequential (ID 459)" }] },
	{ suffix: "아서", stemType: "stem_da", grammar: [{ text: "-아/어서", pos: "Verb Ending", id: 459, gloss: "cause / sequential (ID 459)" }] },
	{ suffix: "어서", stemType: "stem_da", grammar: [{ text: "-아/어서", pos: "Verb Ending", id: 459, gloss: "cause / sequential (ID 459)" }] },
	{ suffix: "하면", stemType: "hada", grammar: [{ text: "-(으)면", pos: "Verb Ending", id: 619, gloss: "conditional 'if/when' (ID 619)" }] },
	{ suffix: "으면", stemType: "stem_da", grammar: [{ text: "-(으)면", pos: "Verb Ending", id: 619, gloss: "conditional 'if/when' (ID 619)" }] },
	{ suffix: "했고", stemType: "hada", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-고", pos: "Verb Ending", id: 336, gloss: "connective 'and' (ID 336)" }] },
	{ suffix: "았고", stemType: "stem_da", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-고", pos: "Verb Ending", id: 336, gloss: "connective 'and' (ID 336)" }] },
	{ suffix: "었고", stemType: "stem_da", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-고", pos: "Verb Ending", id: 336, gloss: "connective 'and' (ID 336)" }] },

	// 2-syllable endings
	{ suffix: "하고", stemType: "hada_or_particle", grammar: [{ text: "-고", pos: "Verb Ending", id: 336, gloss: "connective 'and' (ID 336)" }] },
	{ suffix: "해요", stemType: "hada", grammar: [{ text: "-아/어요", pos: "Verb Ending", id: 49, gloss: "polite informal (ID 49)" }] },
	{ suffix: "네요", stemType: "stem_da", grammar: [{ text: "-네요", pos: "Verb Ending", id: 839, gloss: "realization/surprise (ID 839)" }] },
	{ suffix: "군요", stemType: "stem_da", grammar: [{ text: "-군요", pos: "Verb Ending", id: 1645, gloss: "realization exclamatory (ID 1645)" }] },
	{ suffix: "는데", stemType: "stem_da", grammar: [{ text: "-는데", pos: "Verb Ending", id: 620, gloss: "background/contrastive (ID 620)" }] },
	{ suffix: "니까", stemType: "stem_da", grammar: [{ text: "-(으)니까", pos: "Verb Ending", id: 53, gloss: "since / because (ID 53)" }] },
	{ suffix: "면서", stemType: "stem_da", grammar: [{ text: "-(으)면서", pos: "Verb Ending", id: 711, gloss: "while doing (ID 711)" }] },
	{ suffix: "려고", stemType: "stem_da", grammar: [{ text: "-(으)려고", pos: "Verb Ending", id: 816, gloss: "intentive 'in order to' (ID 816)" }] },
	{ suffix: "지만", stemType: "stem_da", grammar: [{ text: "~지만", pos: "Verb Ending", id: 461, gloss: "but/although (ID 461)" }] },
	{ suffix: "은데", stemType: "stem_da", grammar: [{ text: "-는데", pos: "Verb Ending", id: 620, gloss: "background/contrastive (ID 620)" }] },
	{ suffix: "거나", stemType: "stem_da", grammar: [{ text: "-거나", pos: "Verb Ending", id: 1291, gloss: "or (ID 1291)" }] },
	{ suffix: "하게", stemType: "hada", grammar: [{ text: "-게", pos: "Adverbial Suffix", id: 800, gloss: "in a manner of (ID 800)" }] },
	{ suffix: "하기", stemType: "hada", grammar: [{ text: "-기", pos: "Nominalizing Suffix", id: 1815, gloss: "nominalizer '-ing' (ID 1815)" }] },
	{ suffix: "러", stemType: "stem_da", grammar: [{ text: "-(으)러", pos: "Verb Ending", id: 485, gloss: "in order to (ID 485)" }] },
	{ suffix: "워요", stemType: "stem_b_irregular", grammar: [{ text: "-아요/어요", pos: "Verb Ending", id: 49, gloss: "polite informal (ID 49)" }] },
	{ suffix: "워서", stemType: "stem_b_irregular", grammar: [{ text: "-아/어서", pos: "Verb Ending", id: 459, gloss: "cause / sequential (ID 459)" }] },

	// Past contracted endings
	{ suffix: "지만", stemType: "stem_past_contracted", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "~지만", pos: "Verb Ending", id: 461, gloss: "but/although (ID 461)" }] },
	{ suffix: "어요", stemType: "stem_past_contracted", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-아요/어요", pos: "Verb Ending", id: 49, gloss: "polite informal (ID 49)" }] },
	{ suffix: "는데", stemType: "stem_past_contracted", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-는데", pos: "Verb Ending", id: 620, gloss: "background/contrastive (ID 620)" }] },
	{ suffix: "으면", stemType: "stem_past_contracted", grammar: [{ text: "-았/었-", pos: "Tense Infix", id: 335, gloss: "past tense (ID 335)" }, { text: "-(으)면", pos: "Verb Ending", id: 619, gloss: "conditional 'if/when' (ID 619)" }] },

	// 1-syllable endings
	{ suffix: "해", stemType: "hada_informal", grammar: [{ text: "-아/어", pos: "Verb Ending", id: 459, gloss: "informal / sequential (ID 459)" }] },
	{ suffix: "실", stemType: "honorific_adnominal", isAdnominal: true, grammar: [{ text: "-(으)시-", pos: "Honorific Infix", id: 678, gloss: "honorific subject (ID 678)" }, { text: "-(으)ㄹ", pos: "Adnominal Ending", id: 646, gloss: "future/prospective adnominal (ID 646)" }] },
	{ suffix: "신", stemType: "honorific_past_adnominal", isAdnominal: true, grammar: [{ text: "-(으)시-", pos: "Honorific Infix", id: 678, gloss: "honorific subject (ID 678)" }, { text: "-(으)ㄴ", pos: "Adnominal Ending", id: 644, gloss: "past adnominal (ID 644)" }] },
	{ suffix: "본", stemType: "trial_past_adnominal", isAdnominal: true, grammar: [{ text: "-어 보다 (experience)", pos: "Auxiliary Verb", id: 879, gloss: "experience (ID 879)" }, { text: "-(으)ㄴ", pos: "Adnominal Ending", id: 644, gloss: "past adnominal (ID 644)" }] },
	{ suffix: "운", stemType: "stem_b_irregular", isAdnominal: true, grammar: [{ text: "-(으)ㄴ", pos: "Adnominal Ending", id: 644, gloss: "relative clause (adjective present) (ID 644)" }] },
	{ suffix: "워", stemType: "stem_b_irregular", grammar: [{ text: "-아/어", pos: "Verb Ending", id: 459, gloss: "informal / sequential (ID 459)" }] },
	{ suffix: "게", stemType: "stem_da", grammar: [{ text: "-게", pos: "Adverbial Suffix", id: 800, gloss: "in a manner of (ID 800)" }] },
	{ suffix: "기", stemType: "stem_da", grammar: [{ text: "-기", pos: "Nominalizing Suffix", id: 1815, gloss: "nominalizer '-ing' (ID 1815)" }] },
	{ suffix: "면", stemType: "stem_da", grammar: [{ text: "-(으)면", pos: "Verb Ending", id: 619, gloss: "conditional 'if/when' (ID 619)" }] },
	{ suffix: "고", stemType: "stem_da", grammar: [{ text: "-고", pos: "Verb Ending", id: 336, gloss: "connective 'and' (ID 336)" }] }
].sort((a, b) => b.suffix.length - a.suffix.length);

/**
 * Matches conjugated verb ending patterns and recovers the underlying dictionary stem.
 * 
 * @param {string} word The Korean word/token to match
 * @param {string} prevWord Preceding word for context
 * @param {string} nextWord Succeeding word for context
 * @param {Object} index Fast lookup index
 * @param {Function} evaluateSyntaxFrameFn Evaluator function for SyntaxFrame
 * @returns {Object|null} Analysis object or null if no verb match
 */
function matchVerbSuffix(word, prevWord = "", nextWord = "", index, evaluateSyntaxFrameFn) {
	const vocabByKo = index.vocabByKo;
	const unitById = index.unitById;

	for (const rule of VERB_SUFFIX_RULES) {
		if (word.endsWith(rule.suffix)) {
			let baseVerb = null;
			let isAdnominal = rule.isAdnominal || false;

			if (rule.stemType === 'fixed_base') {
				const root = word.slice(0, -rule.suffix.length);
				baseVerb = root ? root + rule.baseVerb : rule.baseVerb;
			} else if (rule.stemType === 'hada') {
				const root = word.slice(0, -rule.suffix.length);
				baseVerb = root ? root + "하다" : "하다";
			} else if (rule.stemType === 'stem_da') {
				if (word.length <= rule.suffix.length) continue;
				const stem = word.slice(0, -rule.suffix.length);
				const lastChar = stem.slice(-1);
				const d = decomposeHangul(lastChar);
				if (d && d.final === 20 && stem !== "있" && !stem.endsWith("있")) continue; // let past tense rules handle it
				let candidateVerb = stem + "다";
				if ((rule.suffix.includes("세요") || rule.suffix.includes("는데") || rule.suffix.includes("니까") || rule.suffix === "면") && d && d.final === 0) {
					// Check ㄹ-irregular drop (e.g. 썰다 -> 써세요, 팔다 -> 파는데/파니까, 만들다 -> 만드세요, 살다 -> 사세요)
					const lChar = composeHangul(d.initial, d.medial, 8);
					const lVerb = stem.slice(0, -1) + lChar + "다";
					if (!vocabByKo.has(candidateVerb) && vocabByKo.has(lVerb)) {
						candidateVerb = lVerb;
					}
				}
				baseVerb = candidateVerb;
			} else if (rule.stemType === 'copula_l_kkayo') {
				if (word.length <= rule.suffix.length) continue;
				const stem = word.slice(0, -rule.suffix.length);
				const sUnits = vocabByKo.get(stem) || [];
				const nounUnits = sUnits.filter(u => u[DATA_SCHEMA.PartofSpeech] === 'Noun' || u[DATA_SCHEMA.PartofSpeech] === 'Pronoun');
				if (nounUnits.length > 0) {
					const nUnit = nounUnits[0];
					return {
						surface: word,
						category: "noun_copula",
						lexical: { text: stem, pos: nUnit[DATA_SCHEMA.PartofSpeech], unit: nUnit, missing: false, gloss: nUnit[DATA_SCHEMA.English] },
						grammar: rule.grammar.map(g => ({
							text: g.text,
							pos: g.pos,
							unit: unitById.get(g.id) || null,
							missing: !unitById.has(g.id),
							gloss: g.gloss
						})),
						disambiguation: null
					};
				}
			} else if (rule.stemType === 'stem_open_polite') {
				if (word.length < 2) continue;
				const stem = word.slice(0, -1);
				const lastChar = stem.slice(-1);
				const d = decomposeHangul(lastChar);
				if (d && d.final === 0) {
					const baseCandidate = stem + "다";
					if (vocabByKo.has(baseCandidate)) {
						const vUnits = (vocabByKo.get(baseCandidate) || []).filter(u => u[DATA_SCHEMA.PartofSpeech] === 'Action Verb' || u[DATA_SCHEMA.PartofSpeech] === 'Descriptive Verb');
						if (vUnits.length > 0) {
							baseVerb = baseCandidate;
						}
					}
				}
			} else if (rule.stemType === 'stem_inchoative_past_cond') {
				if (word.length <= rule.suffix.length) continue;
				const stemBefore = word.slice(0, -rule.suffix.length); // e.g. '많아'
				if (stemBefore.endsWith("아") || stemBefore.endsWith("어")) {
					const rootStem = stemBefore.slice(0, -1);
					const candVerb = rootStem + "다";
					if (vocabByKo.has(candVerb)) {
						baseVerb = candVerb;
					}
				}
			} else if (rule.stemType === 'stem_l_kkayo') {
				if (word.length <= rule.suffix.length) continue;
				const stemBefore = word.slice(0, -rule.suffix.length);
				const prevChar = stemBefore.slice(-1);
				const d = decomposeHangul(prevChar);
				if (d && d.final === 8) { // ㄹ batchim (e.g. 볼까요 -> 보다, 갈까요 -> 가다)
					const stripped = setFinal(prevChar, 0);
					const stem = stemBefore.slice(0, -1) + stripped;
					let candidateVerb = stem + "다";
					if (!vocabByKo.has(candidateVerb)) {
						const lVerb = stemBefore + "다";
						if (vocabByKo.has(lVerb)) candidateVerb = lVerb;
					}
					baseVerb = candidateVerb;
				} else {
					continue;
				}
			} else if (rule.stemType === 'stem_consonant_polite') {
				const stem = word.slice(0, -rule.suffix.length);
				if (stem.length < 1) continue;
				const lastChar = stem.slice(-1);
				if (!hasBatchim(lastChar)) continue;
				const baseCandidate = stem + "다";
				if (vocabByKo.has(baseCandidate)) {
					baseVerb = baseCandidate;
				} else {
					continue;
				}
			} else if (rule.stemType === 'stem_gi_da') {
				if (word.length <= rule.suffix.length) continue;
				baseVerb = word.slice(0, -rule.suffix.length) + "기다";
			} else if (rule.stemType === 'hada_informal') {
				const root = word.slice(0, -rule.suffix.length);
				baseVerb = root ? root + "하다" : "하다";
			} else if (rule.stemType === 'honorific_adnominal') {
				if (word.length <= rule.suffix.length) continue;
				const root = word.slice(0, -1);
				baseVerb = root + "다";
				isAdnominal = true;
			} else if (rule.stemType === 'honorific_past_adnominal') {
				if (word.length <= rule.suffix.length) continue;
				const root = word.slice(0, -1);
				baseVerb = root + "다";
				isAdnominal = true;
			} else if (rule.stemType === 'trial_past_adnominal') {
				if (word.length <= rule.suffix.length) continue;
				const root = word.slice(0, -1);
				baseVerb = root + "다";
				isAdnominal = true;
			} else if (rule.stemType === 'stem_b_irregular') {
				const stemWithoutSuffix = word.slice(0, -rule.suffix.length);
				if (stemWithoutSuffix.length < 1) continue;
				const lastChar = stemWithoutSuffix.slice(-1);
				const d = decomposeHangul(lastChar);
				if (d && d.final === 0) { // open vowel (e.g. 어려, 반가, 고마, 쉬)
					const bChar = composeHangul(d.initial, d.medial, 17); // attach ㅂ coda (종성 17 = ㅂ)
					baseVerb = stemWithoutSuffix.slice(0, -1) + bChar + "다";
				} else {
					continue;
				}
			} else if (rule.stemType === 'stem_past_contracted') {
				const stemWithFinal = word.slice(0, -rule.suffix.length);
				if (stemWithFinal.length < 1) continue;
				const lastChar = stemWithFinal.slice(-1);
				const d = decomposeHangul(lastChar);
				if (d && d.final === 20 && stemWithFinal !== "있" && !stemWithFinal.endsWith("있")) { // ㅆ batchim, excluding root '있'
					if (d.medial === 6) { // ㅕ + ㅆ (contracted from ㅣ + 었, e.g. 생겼으면 -> 생기다, 마셨으면 -> 마시다)
						const iChar = composeHangul(d.initial, 20, 0);
						const candI = stemWithFinal.slice(0, -1) + iChar + "다";
						if (vocabByKo.has(candI)) {
							baseVerb = candI;
						} else {
							const stripped = setFinal(lastChar, 0);
							baseVerb = stemWithFinal.slice(0, -1) + stripped + "다";
						}
					} else {
						const stripped = setFinal(lastChar, 0);
						baseVerb = stemWithFinal.slice(0, -1) + stripped + "다";
					}
				} else {
					continue;
				}
			} else if (rule.stemType === 'stem_consonant_informal') {
				const stem = word.slice(0, -rule.suffix.length);
				if (stem.length < 1 || !hasBatchim(stem.slice(-1))) continue;
				baseVerb = stem + "다";
			} else if (rule.stemType === 'hada_or_particle') {
				const root = word.slice(0, -rule.suffix.length);
				const candidateVerb = root ? root + "하다" : "하다";
				const hasVerb = vocabByKo.has(candidateVerb);
				const hasNoun = root && vocabByKo.has(root);

				const evalContext = { tokenSurface: word, isVerbStem: hasVerb, isNounStem: hasNoun, prevWord, nextWord };
				const connectiveUnit = unitById.get(336);
				const particleUnit = unitById.get(367);
				const evalConnective = evaluateSyntaxFrameFn ? evaluateSyntaxFrameFn(connectiveUnit, evalContext, index) : { score: 1.0 };
				const evalParticle = evaluateSyntaxFrameFn ? evaluateSyntaxFrameFn(particleUnit, evalContext, index) : { score: 0.0 };

				if (evalConnective.score > evalParticle.score && hasVerb) {
					baseVerb = candidateVerb;
				} else {
					continue;
				}
			}

			if (baseVerb) {
				const vUnits = vocabByKo.get(baseVerb) || [];
				const vUnit = vUnits.length > 0 ? vUnits[0] : null;

				if (baseVerb.startsWith("안") && !vUnit) {
					continue;
				}

				if (!vUnit && !baseVerb.endsWith("하다") && rule.suffix.length < 2) {
					continue;
				}

				const pos = vUnit ? vUnit[DATA_SCHEMA.PartofSpeech] : "Action Verb";
				const grammarList = rule.grammar.map(g => {
					const u = unitById.get(g.id) || null;
					return {
						text: g.text,
						pos: g.pos,
						unit: u,
						missing: !u,
						gloss: g.gloss || (u ? u[DATA_SCHEMA.English] : g.text)
					};
				});

				return {
					surface: word,
					category: isAdnominal ? "adnominal_modifier" : "conjugated_verb",
					lexical: {
						text: baseVerb,
						pos,
						unit: vUnit,
						missing: !vUnit,
						gloss: vUnit ? vUnit[DATA_SCHEMA.English] : ""
					},
					grammar: grammarList,
					disambiguation: rule.stemType === 'hada_or_particle' ? {
						resolved: true,
						target: `${baseVerb} + -고 (ID 336)`,
						rule: "Satisfies verb connective frame over nominal particle"
					} : null
				};
			}
		}
	}

	// Open-stem -ㅂ니다 (e.g. 갑니다, 옵니다, 봅니다, 배웁니다)
	if (word.endsWith("니다") && word.length >= 3) {
		const stemWithFinal = word.slice(0, -2);
		const lastChar = stemWithFinal.slice(-1);
		const d = decomposeHangul(lastChar);
		if (d && d.final === 17) {
			const stripped = setFinal(lastChar, 0);
			const stem = stemWithFinal.slice(0, -1) + stripped;
			const baseVerb = stem + "다";
			const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
			if (vUnit) {
				return {
					surface: word,
					category: "conjugated_verb",
					lexical: { text: baseVerb, pos: vUnit[DATA_SCHEMA.PartofSpeech], unit: vUnit, gloss: vUnit[DATA_SCHEMA.English] },
					grammar: [{ text: "-ㅂ니다", pos: "Verb Ending", unit: unitById.get(50), gloss: "formal declarative (ID 50)" }]
				};
			}
		}
	}

	// Contracted open-stem verbs + -서 (e.g. 가서, 만나서, 와서, 봐서, 배워서, 마셔서)
	if (word.endsWith("서") && word.length >= 2) {
		const stemChar = word.slice(-2, -1);
		let candidateStems = [word.slice(0, -1)];
		const d = decomposeHangul(stemChar);
		if (d) {
			if (d.medial === 9) candidateStems.push(word.slice(0, -2) + composeHangul(d.initial, 8, 0));
			else if (d.medial === 14) candidateStems.push(word.slice(0, -2) + composeHangul(d.initial, 13, 0));
			else if (d.medial === 6) candidateStems.push(word.slice(0, -2) + composeHangul(d.initial, 20, 0));
			else if (d.medial === 4 && d.final === 0) candidateStems.push(word.slice(0, -2) + composeHangul(d.initial, 18, 0)); // ㅡ-irregular (e.g. 써서 -> 쓰다, 떠서 -> 뜨다, 꺼서 -> 끄다)
		}
		for (const s of candidateStems) {
			const baseVerb = s + "다";
			const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
			if (vUnit) {
				return {
					surface: word,
					category: "conjugated_verb",
					lexical: { text: baseVerb, pos: vUnit[DATA_SCHEMA.PartofSpeech], unit: vUnit, gloss: vUnit[DATA_SCHEMA.English] },
					grammar: [{ text: "-아/어서", pos: "Verb Ending", unit: unitById.get(459), gloss: "cause / sequential (ID 459)" }]
				};
			}
		}
	}

	// Contracted open-stem verbs + bare connective/informal -아/어 (e.g. 보여 -> 보이다, 마셔 -> 마시다)
	if (word.length >= 1) {
		const lastChar = word.slice(-1);
		const d = decomposeHangul(lastChar);
		if (d && d.medial === 6 && d.final === 0) { // medial ㅕ without batchim (ㅣ + ㅓ -> ㅕ)
			const iChar = composeHangul(d.initial, 20, 0);
			const baseVerb = word.slice(0, -1) + iChar + "다";
			const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
			if (vUnit) {
				return {
					surface: word,
					category: "conjugated_verb",
					lexical: { text: baseVerb, pos: vUnit[DATA_SCHEMA.PartofSpeech], unit: vUnit, missing: false, gloss: vUnit[DATA_SCHEMA.English] },
					grammar: [{ text: "-아/어", pos: "Verb Ending", unit: unitById.get(459), gloss: "informal / sequential (ID 459)" }]
				};
			}
		}
	}

	// Interrogative open/ㄹ-irregular stem + -ㄴ가요 (e.g. 힘든가요 -> 힘들다, 큰가요 -> 크다)
	if (word.endsWith("가요") && word.length >= 3) {
		const stemWithN = word.slice(0, -2);
		const lastChar = stemWithN.slice(-1);
		const d = decomposeHangul(lastChar);
		if (d && d.final === 4) { // ㄴ batchim
			const stripped = setFinal(lastChar, 0);
			const candOpen = stemWithN.slice(0, -1) + stripped + "다";
			const candL = stemWithN.slice(0, -1) + composeHangul(d.initial, d.medial, 8) + "다"; // attach ㄹ batchim
			let baseVerb = null;
			if (vocabByKo.has(candL)) baseVerb = candL;
			else if (vocabByKo.has(candOpen)) baseVerb = candOpen;

			if (baseVerb) {
				const vUnit = vocabByKo.get(baseVerb)[0];
				return {
					surface: word,
					category: "conjugated_verb",
					lexical: { text: baseVerb, pos: vUnit[DATA_SCHEMA.PartofSpeech], unit: vUnit, gloss: vUnit[DATA_SCHEMA.English] },
					grammar: [{ text: "-(으)ㄴ가요", pos: "Verb Ending", unit: unitById.get(932), gloss: "polite interrogative (ID 932)" }]
				};
			}
		}
	}

	return null;
}

/**
 * Matches adnominal participle forms (~한, ~은, ~는, ~(으)ㄴ, ~(으)ㄹ).
 * 
 * @param {string} word The Korean word to analyze
 * @param {Object} index Fast lookup index
 * @returns {Object|null} Analysis object or null
 */
function matchAdnominalEnding(word, index) {
	const vocabByKo = index.vocabByKo;
	const unitById = index.unitById;

	if (word.endsWith("한")) {
		const baseVerb = word.slice(0, -1) + "하다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "adnominal_modifier",
			lexical: { text: baseVerb, pos: "Action Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" },
			grammar: [{ text: "-(으)ㄴ", pos: "Adnominal Ending", unit: unitById.get(644), gloss: "past adnominal (ID 644)" }]
		};
	}
	if (word.endsWith("할")) {
		const baseVerb = word.slice(0, -1) + "하다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		return {
			surface: word,
			category: "adnominal_modifier",
			lexical: { text: baseVerb, pos: vUnit ? vUnit[DATA_SCHEMA.PartofSpeech] : "Descriptive Verb", unit: vUnit, missing: !vUnit, gloss: vUnit ? vUnit[DATA_SCHEMA.English] : "" },
			grammar: [{ text: "-(으)ㄹ", pos: "Adnominal Ending", unit: unitById.get(646), gloss: "prospective adnominal (ID 646)" }]
		};
	}
	if (word.endsWith("은")) {
		const stem = word.slice(0, -1);
		const baseVerb = stem + "다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		if (vUnit && (vUnit[DATA_SCHEMA.PartofSpeech] === 'Descriptive Verb' || vUnit[DATA_SCHEMA.PartofSpeech] === 'Action Verb')) {
			return {
				surface: word,
				category: "adnominal_modifier",
				lexical: { text: baseVerb, pos: vUnit[DATA_SCHEMA.PartofSpeech], unit: vUnit, missing: false, gloss: vUnit[DATA_SCHEMA.English] },
				grammar: [{ text: "-(으)ㄴ", pos: "Adnominal Ending", unit: unitById.get(644), gloss: "adnominal modifier (ID 644)" }]
			};
		}
	}
	if (word.endsWith("는")) {
		const stem = word.slice(0, -1);
		let baseVerb = stem + "다";
		if (stem === "모르") baseVerb = "모르다";
		const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
		if (vUnit && (vUnit[DATA_SCHEMA.PartofSpeech] === 'Action Verb' || vUnit[DATA_SCHEMA.PartofSpeech] === 'Descriptive Verb')) {
			return {
				surface: word,
				category: "adnominal_modifier",
				lexical: { text: baseVerb, pos: vUnit[DATA_SCHEMA.PartofSpeech], unit: vUnit, missing: false, gloss: vUnit[DATA_SCHEMA.English] },
				grammar: [{ text: "-는", pos: "Adnominal Ending", unit: unitById.get(645), gloss: "present adnominal (ID 645)" }]
			};
		}
	}
	if (word.length >= 1 && hasBatchim(word.slice(-1))) {
		const d = decomposeHangul(word.slice(-1));
		if (d && d.final === 4) { // ㄴ batchim (past adnominal -(으)ㄴ, e.g. 온, 간, 본, 산, 된)
			const strippedChar = setFinal(word.slice(-1), 0);
			const stem = word.slice(0, -1) + strippedChar;
			let baseVerb = stem + "다";
			const vUnits = vocabByKo.get(baseVerb) || [];
			let vUnit = vUnits.length > 0 ? vUnits[0] : null;
			if (stem === "부지") {
				baseVerb = "부치다";
				const cookingUnit = (vocabByKo.get("부치다") || []).find(u => u[DATA_SCHEMA.Id] === 1658);
				vUnit = cookingUnit || vUnit;
			}
			if (vUnit && (vUnit[DATA_SCHEMA.PartofSpeech] === 'Action Verb' || vUnit[DATA_SCHEMA.PartofSpeech] === 'Descriptive Verb')) {
				return {
					surface: word,
					category: "adnominal_modifier",
					lexical: { text: baseVerb, pos: vUnit[DATA_SCHEMA.PartofSpeech], unit: vUnit, missing: false, gloss: vUnit[DATA_SCHEMA.English] },
					grammar: [{ text: "-(으)ㄴ", pos: "Adnominal Ending", unit: unitById.get(644), gloss: "adnominal modifier (ID 644)" }]
				};
			}
		}
		if (d && d.final === 8) { // ㄹ batchim (prospective/future adnominal -(으)ㄹ, e.g. 할, 갈, 놀, 지루할)
			// Case A: Base stem already ends in ㄹ (놀다, 살다, 알다, 만들다)
			const lBaseVerb = word + "다";
			const lUnit = vocabByKo.get(lBaseVerb) ? vocabByKo.get(lBaseVerb)[0] : null;
			if (lUnit && (lUnit[DATA_SCHEMA.PartofSpeech] === 'Action Verb' || lUnit[DATA_SCHEMA.PartofSpeech] === 'Descriptive Verb')) {
				return {
					surface: word,
					category: "adnominal_modifier",
					lexical: { text: lBaseVerb, pos: lUnit[DATA_SCHEMA.PartofSpeech], unit: lUnit, missing: false, gloss: lUnit[DATA_SCHEMA.English] },
					grammar: [{ text: "-(으)ㄹ", pos: "Adnominal Ending", unit: unitById.get(646), gloss: "prospective adnominal (ID 646)" }]
				};
			}

			// Case B: Open stem + ㄹ (할 -> 하다, 갈 -> 가다, 지루할 -> 지루하다, 볼 -> 보다)
			const strippedChar = setFinal(word.slice(-1), 0);
			const stem = word.slice(0, -1) + strippedChar;
			const baseVerb = stem + "다";
			const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
			if (vUnit && (vUnit[DATA_SCHEMA.PartofSpeech] === 'Action Verb' || vUnit[DATA_SCHEMA.PartofSpeech] === 'Descriptive Verb')) {
				return {
					surface: word,
					category: "adnominal_modifier",
					lexical: { text: baseVerb, pos: vUnit[DATA_SCHEMA.PartofSpeech], unit: vUnit, missing: false, gloss: vUnit[DATA_SCHEMA.English] },
					grammar: [{ text: "-(으)ㄹ", pos: "Adnominal Ending", unit: unitById.get(646), gloss: "prospective adnominal (ID 646)" }]
				};
			}
		}

		// Case C: Consonant stem + 을 (e.g. 있을, 없을, 먹을, 들을, 작을, 많을)
		if (word.endsWith("을") && word.length >= 2) {
			const rawStem = word.slice(0, -1);
			let baseVerb = rawStem + "다";
			if (rawStem === "들") baseVerb = "듣다"; // ㄷ-irregular
			else if (rawStem === "걸") baseVerb = "걷다";
			const vUnit = vocabByKo.get(baseVerb) ? vocabByKo.get(baseVerb)[0] : null;
			if (vUnit && (vUnit[DATA_SCHEMA.PartofSpeech] === 'Action Verb' || vUnit[DATA_SCHEMA.PartofSpeech] === 'Descriptive Verb')) {
				return {
					surface: word,
					category: "adnominal_modifier",
					lexical: { text: baseVerb, pos: vUnit[DATA_SCHEMA.PartofSpeech], unit: vUnit, missing: false, gloss: vUnit[DATA_SCHEMA.English] },
					grammar: [{ text: "-(으)ㄹ", pos: "Adnominal Ending", unit: unitById.get(646), gloss: "prospective adnominal (ID 646)" }]
				};
			}
		}
	}

	return null;
}

if (typeof window !== 'undefined') {
	window.VERB_SUFFIX_RULES = VERB_SUFFIX_RULES;
	window.matchVerbSuffix = matchVerbSuffix;
	window.matchAdnominalEnding = matchAdnominalEnding;
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		VERB_SUFFIX_RULES,
		matchVerbSuffix,
		matchAdnominalEnding
	};
}
