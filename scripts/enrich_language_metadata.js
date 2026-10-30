#!/usr/bin/env node
/**
 * scripts/enrich_language_metadata.js
 *
 * Phase 1 Migration & Enrichment Script:
 * Populates structured bilingual translation metadata (`en`) inside `SemanticData`
 * (column 11 of `DATA_SCHEMA`) across all 2,006 language units in `data.js`.
 *
 * Guarantees that every unit has clean, deterministic metadata for:
 *   1. `enLiteral` (Direct Korean-Word-Order Translation — Primary Priority)
 *   2. `enNatural` (Natural Idiomatic SVO Translation — Secondary Priority)
 *
 * Preserves all existing `SemanticData` keys (`domain`, `logic`, `polarity`,
 * `collocation_filter`, `req`, `prod`, `surface_forms`, etc.).
 */

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.resolve(__dirname, '..', 'data.js');
const { KR_EN_languageUnits, DATA_SCHEMA, hasTag } = require(DATA_PATH);
const { executeUpdateFromFile } = require(path.resolve(__dirname, '..', 'select.js'));
const { updateSchemaSummary } = require(path.resolve(__dirname, '..', 'schema_analysis.js'));

// ============================================================================
// 1. Irregular English Verb Principal Parts Table
// ============================================================================
const IRREGULAR_EN_VERBS = {
	'be': { past: 'was', part: 'been', s: 'is', ing: 'being' },
	'have': { past: 'had', part: 'had', s: 'has', ing: 'having' },
	'do': { past: 'did', part: 'done', s: 'does', ing: 'doing' },
	'go': { past: 'went', part: 'gone', s: 'goes', ing: 'going' },
	'come': { past: 'came', part: 'come', s: 'comes', ing: 'coming' },
	'eat': { past: 'ate', part: 'eaten', s: 'eats', ing: 'eating' },
	'drink': { past: 'drank', part: 'drunk', s: 'drinks', ing: 'drinking' },
	'see': { past: 'saw', part: 'seen', s: 'sees', ing: 'seeing' },
	'meet': { past: 'met', part: 'met', s: 'meets', ing: 'meeting' },
	'buy': { past: 'bought', part: 'bought', s: 'buys', ing: 'buying' },
	'read': { past: 'read', part: 'read', s: 'reads', ing: 'reading' },
	'write': { past: 'wrote', part: 'written', s: 'writes', ing: 'writing' },
	'wear': { past: 'wore', part: 'worn', s: 'wears', ing: 'wearing' },
	'put': { past: 'put', part: 'put', s: 'puts', ing: 'putting' },
	'take': { past: 'took', part: 'taken', s: 'takes', ing: 'taking' },
	'make': { past: 'made', part: 'made', s: 'makes', ing: 'making' },
	'give': { past: 'gave', part: 'given', s: 'gives', ing: 'giving' },
	'get': { past: 'got', part: 'gotten', s: 'gets', ing: 'getting' },
	'sit': { past: 'sat', part: 'sat', s: 'sits', ing: 'sitting' },
	'stand': { past: 'stood', part: 'stood', s: 'stands', ing: 'standing' },
	'sleep': { past: 'slept', part: 'slept', s: 'sleeps', ing: 'sleeping' },
	'wake': { past: 'woke', part: 'woken', s: 'wakes', ing: 'waking' },
	'know': { past: 'knew', part: 'known', s: 'knows', ing: 'knowing' },
	'understand': { past: 'understood', part: 'understood', s: 'understands', ing: 'understanding' },
	'teach': { past: 'taught', part: 'taught', s: 'teaches', ing: 'teaching' },
	'learn': { past: 'learned', part: 'learned', s: 'learns', ing: 'learning' },
	'hear': { past: 'heard', part: 'heard', s: 'hears', ing: 'hearing' },
	'listen': { past: 'listened', part: 'listened', s: 'listens', ing: 'listening' },
	'ride': { past: 'rode', part: 'ridden', s: 'rides', ing: 'riding' },
	'drive': { past: 'drove', part: 'driven', s: 'drives', ing: 'driving' },
	'find': { past: 'found', part: 'found', s: 'finds', ing: 'finding' },
	'lose': { past: 'lost', part: 'lost', s: 'loses', ing: 'losing' },
	'win': { past: 'won', part: 'won', s: 'wins', ing: 'winning' },
	'sing': { past: 'sang', part: 'sung', s: 'sings', ing: 'singing' },
	'draw': { past: 'drew', part: 'drawn', s: 'draws', ing: 'drawing' },
	'speak': { past: 'spoke', part: 'spoken', s: 'speaks', ing: 'speaking' },
	'say': { past: 'said', part: 'said', s: 'says', ing: 'saying' },
	'tell': { past: 'told', part: 'told', s: 'tells', ing: 'telling' },
	'send': { past: 'sent', part: 'sent', s: 'sends', ing: 'sending' },
	'spend': { past: 'spent', part: 'spent', s: 'spends', ing: 'spending' },
	'lend': { past: 'lent', part: 'lent', s: 'lends', ing: 'lending' },
	'build': { past: 'built', part: 'built', s: 'builds', ing: 'building' },
	'sell': { past: 'sold', part: 'sold', s: 'sells', ing: 'selling' },
	'pay': { past: 'paid', part: 'paid', s: 'pays', ing: 'paying' },
	'keep': { past: 'kept', part: 'kept', s: 'keeps', ing: 'keeping' },
	'leave': { past: 'left', part: 'left', s: 'leaves', ing: 'leaving' },
	'feel': { past: 'felt', part: 'felt', s: 'feels', ing: 'feeling' },
	'sweep': { past: 'swept', part: 'swept', s: 'sweeps', ing: 'sweeping' },
	'hang': { past: 'hung', part: 'hung', s: 'hangs', ing: 'hanging' },
	'hold': { past: 'held', part: 'held', s: 'holds', ing: 'holding' },
	'become': { past: 'became', part: 'become', s: 'becomes', ing: 'becoming' },
	'begin': { past: 'began', part: 'begun', s: 'begins', ing: 'beginning' },
	'break': { past: 'broke', part: 'broken', s: 'breaks', ing: 'breaking' },
	'bring': { past: 'brought', part: 'brought', s: 'brings', ing: 'bringing' },
	'catch': { past: 'caught', part: 'caught', s: 'catches', ing: 'catching' },
	'choose': { past: 'chose', part: 'chosen', s: 'chooses', ing: 'choosing' },
	'think': { past: 'thought', part: 'thought', s: 'thinks', ing: 'thinking' },
	'forget': { past: 'forgot', part: 'forgotten', s: 'forgets', ing: 'forgetting' },
	'grow': { past: 'grew', part: 'grown', s: 'grows', ing: 'growing' },
	'throw': { past: 'threw', part: 'thrown', s: 'throws', ing: 'throwing' },
	'blow': { past: 'blew', part: 'blown', s: 'blows', ing: 'blowing' },
	'fly': { past: 'flew', part: 'flown', s: 'flies', ing: 'flying' },
	'fall': { past: 'fell', part: 'fallen', s: 'falls', ing: 'falling' },
	'shake': { past: 'shook', part: 'shaken', s: 'shakes', ing: 'shaking' },
	'run': { past: 'ran', part: 'run', s: 'runs', ing: 'running' },
	'swim': { past: 'swam', part: 'swum', s: 'swims', ing: 'swimming' },
	'cut': { past: 'cut', part: 'cut', s: 'cuts', ing: 'cutting' },
	'hit': { past: 'hit', part: 'hit', s: 'hits', ing: 'hitting' },
	'hurt': { past: 'hurt', part: 'hurt', s: 'hurts', ing: 'hurting' },
	'let': { past: 'let', part: 'let', s: 'lets', ing: 'letting' },
	'set': { past: 'set', part: 'set', s: 'sets', ing: 'setting' },
	'shut': { past: 'shut', part: 'shut', s: 'shuts', ing: 'shutting' },
	'lie': { past: 'lay', part: 'lain', s: 'lies', ing: 'lying' },
	'die': { past: 'died', part: 'died', s: 'dies', ing: 'dying' }
};

// ============================================================================
// 2. Grammar & Particle Explicit Metadata Table (Keyed by Korean / ID)
// ============================================================================
const GRAMMAR_METADATA_BY_ID = {
	23: { kind: 'suffix', lit: '-Mr./Ms.', nat: 'Mr./Ms.' },
	36: { kind: 'particle', role: 'TOPIC', lit: '-[topic]', nat: '' },
	37: { kind: 'copula', lit: '-is/am/are', nat: 'be', tense: 'present', formality: 'polite' },
	49: { kind: 'ending', lit: '', nat: '', tense: 'present', formality: 'polite' },
	50: { kind: 'ending', lit: '', nat: '', tense: 'present', formality: 'formal' },
	51: { kind: 'ending', lit: "-let's", nat: "let's", mood: 'propositive', formality: 'casual' },
	52: { kind: 'connective', lit: '-because/so', frame: 'Because {C1}, {C2}', logic: 'cause_effect' },
	53: { kind: 'connective', lit: '-since/because', frame: 'Since {C1}, {C2}', logic: 'cause_effect' },
	54: { kind: 'connective', lit: '-because-of', frame: 'Because {C1}, {C2}', logic: 'cause_effect' },
	56: { kind: 'copula', lit: '-is/am/are', nat: 'be', tense: 'present', formality: 'formal' },
	57: { kind: 'pattern', lit: '', nat: '' },
	95: { kind: 'copula_neg', lit: '-[subj] not-be', nat: 'be not', tense: 'present', formality: 'polite' },
	96: { kind: 'particle', role: 'SUBJECT', lit: '-[subj]', nat: '' },
	132: { kind: 'particle', role: 'LOC_STATIC', lit: '-at/in', prep: 'at' },
	173: { kind: 'particle', role: 'OBJECT', lit: '-[obj]', nat: '' },
	199: { kind: 'particle', role: 'LOC_DYNAMIC', lit: '-at/from', prep: 'at', sourcePrep: 'from' },
	200: { kind: 'particle', role: 'LOC_GOAL', lit: '-to', prep: 'to' },
	274: { kind: 'auxiliary', lit: '-not', polarity: 'negative', nat: 'not' },
	275: { kind: 'particle', role: 'TIME', lit: '-at/on', prep: 'at' },
	276: { kind: 'particle', role: 'COMITATIVE', lit: '-with/and', prep: 'with', conj: 'and' },
	335: { kind: 'ending', lit: '-past', nat: '', tense: 'past', formality: 'polite' },
	336: { kind: 'connective', lit: '-and', frame: '{C1}, and {C2}', logic: 'parallel' },
	366: { kind: 'particle', role: 'ADDITIVE', lit: '-also', adv: 'also' },
	367: { kind: 'particle', role: 'COMITATIVE', lit: '-with/and', prep: 'with', conj: 'and' },
	416: { kind: 'ending', lit: '-please(imp)', mood: 'imperative', formality: 'polite' },
	417: { kind: 'auxiliary', lit: '-want-to', modal: 'want to' },
	459: { kind: 'connective', lit: '-and-then/because', frame: 'Because {C1}, {C2}' },
	460: { kind: 'ending', lit: '-will', tense: 'future', modal: 'will', formality: 'polite' },
	461: { kind: 'connective', lit: '-but', frame: '{C1}, but {C2}', logic: 'contrast' },
	484: { kind: 'ending', lit: '-will(promise)', tense: 'future', modal: 'will', formality: 'polite' },
	485: { kind: 'connective', lit: '-in-order-to', frame: '{C2} to {C1_inf}' },
	522: { kind: 'auxiliary', lit: '-can', modal: 'can' },
	523: { kind: 'auxiliary', lit: '-cannot', modal: 'cannot', polarity: 'negative' },
	524: { kind: 'auxiliary', lit: '-cannot', modal: 'cannot', polarity: 'negative' },
	572: { kind: 'auxiliary', lit: '-may', modal: 'may' },
	573: { kind: 'auxiliary', lit: '-must-not', modal: 'must not', polarity: 'negative' },
	574: { kind: 'auxiliary', lit: '-must', modal: 'have to' },
	618: { kind: 'particle', role: 'DATIVE', lit: '-to(person)', prep: 'to' },
	619: { kind: 'connective', lit: '-if/when', frame: 'If {C1}, {C2}', logic: 'condition' },
	620: { kind: 'connective', lit: '-and/but', frame: '{C1}, and {C2}' },
	621: { kind: 'connective', lit: '-and/but', frame: '{C1}, but {C2}' },
	644: { kind: 'adnominal', lit: '-[past/state-mod]', tense: 'past_or_state' },
	645: { kind: 'adnominal', lit: '-[pres-mod]', tense: 'present' },
	646: { kind: 'adnominal', lit: '-[fut-mod]', tense: 'future' },
	647: { kind: 'particle', role: 'DATIVE', lit: '-to(hon)', prep: 'to', honorific: true },
	648: { kind: 'particle', role: 'SUBJECT', lit: '-[subj-hon]', nat: '', honorific: true },
	653: { kind: 'particle', lit: '-approx', prep: 'around' },
	678: { kind: 'infix', lit: '-(hon)', honorific: true },
	679: { kind: 'auxiliary', lit: '-past-experience-exist', modal: 'have (ever)' },
	680: { kind: 'particle', role: 'COMPARATIVE', lit: '-more-than', prep: 'more than' },
	710: { kind: 'connective', lit: '-after/before', frame: 'After {C1}, {C2}' },
	711: { kind: 'connective', lit: '-while', frame: 'While {C1}, {C2}' },
	738: { kind: 'nominalizer', lit: '-ing(noun)', nat: '-ing' },
	800: { kind: 'adverbializer', lit: '-ly', nat: '-ly' },
	801: { kind: 'auxiliary', lit: '-become', modal: 'become' },
	816: { kind: 'connective', lit: '-in-order-to', frame: 'In order to {C1_inf}, {C2}' },
	817: { kind: 'connective', lit: '-since(elapsed)', frame: 'Since {C1}, {C2}' },
	837: { kind: 'ending', lit: '-must-be(guess)', modal: 'must' },
	838: { kind: 'ending', lit: '-will(intent)', modal: 'will', tense: 'future' },
	839: { kind: 'ending', lit: '-indeed!', mood: 'exclamatory' },
	855: { kind: 'connective', lit: '-when', frame: 'When {C1}, {C2}' },
	856: { kind: 'particle', role: 'GENITIVE', lit: "-'s/of", prep: 'of' },
	857: { kind: 'particle', role: 'GENITIVE', lit: "-of", prep: 'of' },
	877: { kind: 'particle', lit: '-after(duration)', prep: 'after' },
	878: { kind: 'auxiliary', lit: '-try-doing', modal: 'try to' },
	879: { kind: 'auxiliary', lit: '-tried-doing', modal: 'have tried', tense: 'past' },
	892: { kind: 'connective', lit: '-because-of', frame: 'Because {C1}, {C2}' },
	893: { kind: 'connective', lit: '-and/so', frame: '{C1}, and {C2}' },
	894: { kind: 'connective', lit: '-but', frame: '{C1}, but {C2}' },
	911: { kind: 'ending', lit: '-should/must', modal: 'should' },
	912: { kind: 'ending', lit: '-wish-that', modal: 'wish that' },
	930: { kind: 'ending', lit: '-?', mood: 'interrogative' },
	931: { kind: 'auxiliary', lit: '-in-middle-of', aspect: 'progressive' },
	932: { kind: 'ending', lit: '-?', mood: 'interrogative' },
	956: { kind: 'connective', lit: '-and/so', frame: '{C1}, and {C2}' },
	957: { kind: 'connective', lit: '-but', frame: '{C1}, but {C2}' },
	958: { kind: 'auxiliary', lit: '-try-doing', modal: 'try to' },
	959: { kind: 'auxiliary', lit: '-tried-doing', modal: 'have tried', tense: 'past' },
	995: { kind: 'particle', role: 'LOC_GOAL', lit: '-onto/in', prep: 'into' },
	996: { kind: 'particle', role: 'ADDITIVE', lit: '-in-addition-to', prep: 'in addition to' },
	997: { kind: 'auxiliary', lit: '-past-experience-exist', modal: 'have (ever)' },
	1019: { kind: 'ending', lit: '-will', tense: 'future', modal: 'will' },
	1020: { kind: 'ending', lit: '-probably-will', tense: 'future', modal: 'will probably' },
	1021: { kind: 'ending', lit: '-shall-we?', mood: 'propositive_interrogative', modal: 'shall we' },
	1022: { kind: 'ending', lit: '-do-you-think?', mood: 'interrogative', modal: 'do you think' },
	1044: { kind: 'connective', lit: '-and/so', frame: '{C1}, and {C2}' },
	1045: { kind: 'connective', lit: '-but', frame: '{C1}, but {C2}' },
	1046: { kind: 'auxiliary', lit: '-feel(3rd)', modal: 'feel' },
	1067: { kind: 'auxiliary', lit: '-may', modal: 'may' },
	1068: { kind: 'auxiliary', lit: '-must-not', modal: 'must not', polarity: 'negative' },
	1092: { kind: 'ending', lit: '-how-much-unknowable', modal: 'so much' },
	1113: { kind: 'ending', lit: '', formality: 'casual' },
	1114: { kind: 'auxiliary', lit: '-thinking-of-doing', modal: 'be thinking of' },
	1139: { kind: 'connective', lit: '-because/so', frame: 'Because {C1}, {C2}' },
	1140: { kind: 'connective', lit: '-and-then', frame: '{C1}, and then {C2}' },
	1141: { kind: 'ending', lit: '-do-not(imp)', mood: 'imperative', polarity: 'negative', formality: 'casual' },
	1156: { kind: 'ending', lit: '', tense: 'present', formality: 'plain' },
	1157: { kind: 'ending', lit: '-?', mood: 'interrogative', formality: 'casual' },
	1158: { kind: 'ending', lit: '-will(promise)', tense: 'future', modal: 'will' },
	1170: { kind: 'ending', lit: "-let's", mood: 'propositive' },
	1181: { kind: 'auxiliary', lit: '-come-to-do', modal: 'end up' },
	1182: { kind: 'ending', lit: '-(imp)', mood: 'imperative', formality: 'plain' },
	1183: { kind: 'ending', lit: "-let's", mood: 'propositive', formality: 'plain' },
	1198: { kind: 'connective', lit: '-did-and-then', frame: 'After {C1}, {C2}' },
	1199: { kind: 'ending', lit: '-would-you-like-to?', mood: 'interrogative', modal: 'would you like to' },
	1211: { kind: 'auxiliary', lit: '-know-whether', modal: 'know whether' },
	1212: { kind: 'connective', lit: '-but(formal)', frame: '{C1}, however {C2}' },
	1239: { kind: 'connective', lit: '-while-doing', frame: 'While {C1}, {C2}' },
	1240: { kind: 'particle', role: 'LOC_GOAL', lit: '-toward', prep: 'toward' },
	1241: { kind: 'particle', role: 'INSTRUMENT', lit: '-by/with', prep: 'by' },
	1242: { kind: 'particle', role: 'COMPLEMENT', lit: '-into/as', prep: 'into' },
	1259: { kind: 'connective', lit: '-if-intending-to', frame: 'If you want to {C1_inf}, {C2}' },
	1260: { kind: 'particle', role: 'INSTRUMENT', lit: '-via', prep: 'via' },
	1276: { kind: 'connective', lit: '-only-if', frame: 'Only if {C1}, {C2}' },
	1277: { kind: 'auxiliary', lit: '-if-then-fine', modal: 'just need to' },
	1291: { kind: 'connective', lit: '-or', frame: '{C1} or {C2}' },
	1292: { kind: 'ending', lit: '-(background)', formality: 'polite' },
	1293: { kind: 'ending', lit: '-(contrast)', formality: 'polite' },
	1311: { kind: 'connective', lit: '-while', frame: 'While {C1}, {C2}' },
	1312: { kind: 'particle', role: 'LOC_SOURCE', lit: '-from', prep: 'from' },
	1332: { kind: 'ending', lit: '-will-you?', tense: 'future', mood: 'interrogative' },
	1333: { kind: 'particle', lit: '-or', conj: 'or' },
	1334: { kind: 'particle', lit: '-as-many-as', adv: 'as many as' },
	1346: { kind: 'ending', lit: '-asked-whether', modal: 'ask whether' },
	1347: { kind: 'ending', lit: '-said-that', modal: 'say that' },
	1362: { kind: 'ending', lit: '-told-to', modal: 'tell to' },
	1363: { kind: 'ending', lit: '-suggested-doing', modal: 'suggest' },
	1383: { kind: 'ending', lit: '-asked-to-give', modal: 'ask for' },
	1384: { kind: 'ending', lit: '-asked-to-do-for', modal: 'ask to help' },
	1385: { kind: 'connective', lit: '-because-is', frame: 'Because it is {C1}, {C2}' },
	1402: { kind: 'particle', lit: '-only', adv: 'only' },
	1403: { kind: 'particle', lit: '-in(elapsed)', prep: 'in' },
	1404: { kind: 'adnominal', lit: '-[past-retro-mod]', tense: 'past' },
	1432: { kind: 'connective', lit: '-in-addition-to', frame: 'In addition to {C1}, {C2}' },
	1453: { kind: 'particle', lit: '-at-least/even', adv: 'at least' },
	1454: { kind: 'auxiliary', lit: '-must', modal: 'must' },
	1469: { kind: 'particle', lit: '-as-much-as', prep: 'as much as' },
	1470: { kind: 'connective', lit: '-even-if', frame: 'Even if {C1}, {C2}' },
	1490: { kind: 'adnominal', lit: '-[used-to-mod]', tense: 'past' },
	1491: { kind: 'auxiliary', lit: '-know-how-to', modal: 'know how to' },
	1506: { kind: 'ending', lit: '-(recalled)', tense: 'past' },
	1507: { kind: 'particle', lit: '-whichever', adv: 'any' },
	1522: { kind: 'particle', lit: '-only(neg)', adv: 'only' },
	1523: { kind: 'auxiliary', lit: '-thought-that', modal: 'thought that', tense: 'past' },
	1543: { kind: 'connective', lit: '-after', frame: 'After {C1}, {C2}' },
	1544: { kind: 'particle', lit: '-or', conj: 'or' },
	1545: { kind: 'particle', lit: '-as-many-as', adv: 'as many as' },
	1557: { kind: 'auxiliary', lit: '-decided-to', modal: 'decide to' },
	1558: { kind: 'connective', lit: '-as-soon-as', frame: 'As soon as {C1}, {C2}' },
	1579: { kind: 'connective', lit: '-since-they-say', frame: 'Since they say {C1}, {C2}' },
	1580: { kind: 'connective', lit: '-do-not-and-instead', frame: 'Instead of {C1}, {C2}' },
	1601: { kind: 'connective', lit: '-since-will', frame: 'Since {C1}, {C2}' },
	1624: { kind: 'particle', role: 'COMITATIVE', lit: '-with/and', prep: 'with', conj: 'and' },
	1625: { kind: 'auxiliary', lit: '-wants-to', modal: 'want to' },
	1644: { kind: 'ending', lit: '-please(formal-imp)', mood: 'imperative', formality: 'formal' },
	1645: { kind: 'ending', lit: '-I-see!', mood: 'exclamatory' },
	1646: { kind: 'ending', lit: '-hope-that', modal: 'hope that' },
	1702: { kind: 'infix', lit: '-(hon)', honorific: true },
	1703: { kind: 'particle', role: 'TOPIC', lit: '-[topic-hon]', nat: '', honorific: true },
	1704: { kind: 'particle', role: 'DATIVE', lit: '-to(person)', prep: 'to' },
	1705: { kind: 'particle', role: 'DATIVE', lit: '-to(person)', prep: 'to' },
	1706: { kind: 'particle', role: 'LOC_SOURCE', lit: '-from(person)', prep: 'from' },
	1707: { kind: 'particle', role: 'LOC_SOURCE', lit: '-from(person)', prep: 'from' },
	1710: { kind: 'auxiliary', lit: '-ing(prog)', aspect: 'progressive' },
	1711: { kind: 'ending', lit: '-past', tense: 'past', formality: 'formal' },
	1712: { kind: 'auxiliary', lit: '-plan-to', modal: 'plan to' },
	1736: { kind: 'ending', lit: "-let's", mood: 'propositive', formality: 'formal' },
	1737: { kind: 'ending', lit: '-please-do-not', mood: 'imperative', polarity: 'negative', formality: 'polite' },
	1738: { kind: 'ending', lit: '-please-do-not(formal)', mood: 'imperative', polarity: 'negative', formality: 'formal' },
	1744: { kind: 'connective', lit: '-because-of-doing', frame: 'Because of {C1}, {C2}' },
	1745: { kind: 'connective', lit: '-due-to', frame: 'Because {C1}, {C2}' },
	1746: { kind: 'connective', lit: '-therefore', frame: 'Because {C1}, {C2}' },
	1773: { kind: 'ending', lit: '-right?', mood: 'interrogative' },
	1797: { kind: 'particle', lit: '-every', det: 'every' },
	1815: { kind: 'nominalizer', lit: '-ing(noun)', nat: '-ing' },
	1826: { kind: 'particle', role: 'LOC_GOAL', lit: '-until/to', prep: 'until' },
	1833: { kind: 'copula', lit: '-is/am/are', nat: 'be', tense: 'present', formality: 'casual' },
	1834: { kind: 'particle', lit: '-(vocative)', nat: '' },
	1855: { kind: 'ending', lit: '-?', mood: 'interrogative', formality: 'formal' },
	1865: { kind: 'particle', lit: '-called/quoting', prep: 'called' },
	1949: { kind: 'ending', lit: '-I-see!', mood: 'exclamatory', formality: 'plain' },
	1987: { kind: 'connective', lit: '-whether', frame: '{C2} whether {C1}' },
	1994: { kind: 'auxiliary', lit: '-dislike-doing', modal: 'hate to', polarity: 'negative' }
};

// ============================================================================
// 3. Helper Functions for Clean Gloss Extraction & Verb Inflection
// ============================================================================

/**
 * Strips parenthetical explanations, semicolons, and secondary senses from a raw English gloss.
 */
function extractPrimaryEnglishSense(rawEn) {
	if (!rawEn || typeof rawEn !== 'string') return '';
	let s = rawEn.trim();
	// Remove parenthetical notes like "(medical)", "(brand name in ...)", "(informal)"
	s = s.replace(/\s*\([^)]*\)/g, '').trim();
	// Split on semicolon or comma or slash and take the first clean phrase
	const parts = s.split(/[;,/]/).map(p => p.trim()).filter(Boolean);
	let primary = parts[0] || rawEn.trim();
	// Clean quotes or trailing dots
	primary = primary.replace(/^["']+|["']+$/g, '').trim();
	return primary;
}

/**
 * Converts a multi-word English phrase into a hyphenated literal token for `enLiteral`
 * (e.g. "wake up" -> "wake-up", "older sister" -> "older-sister").
 */
function toHyphenatedLiteral(phrase) {
	if (!phrase) return '';
	return phrase
		.trim()
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-');
}

/**
 * Computes regular English verb inflections (3rd-person -s, past -ed, participle, -ing)
 */
function inflectSingleEnglishVerb(verb) {
	const v = verb.toLowerCase().trim();
	if (IRREGULAR_EN_VERBS[v]) {
		return { base: v, ...IRREGULAR_EN_VERBS[v] };
	}

	// 3rd person singular (-s / -es / -ies)
	let sForm = v + 's';
	if (/(?:s|sh|ch|x|z|o)$/.test(v)) {
		sForm = v + 'es';
	} else if (/[^aeiou]y$/.test(v)) {
		sForm = v.slice(0, -1) + 'ies';
	}

	// Past & Past Participle (-ed / -d / -ied)
	let pastForm = v + 'ed';
	if (v.endsWith('e')) {
		pastForm = v + 'd';
	} else if (/[^aeiou]y$/.test(v)) {
		pastForm = v.slice(0, -1) + 'ied';
	} else if (/^[^aeiou]+[aeiou][^aeiouwxy]$/.test(v) && v.length <= 4) {
		// CVC doubling for short monosyllables (stop -> stopped, mop -> mopped, chat -> chatted)
		pastForm = v + v.slice(-1) + 'ed';
	}

	// Present Participle (-ing)
	let ingForm = v + 'ing';
	if (v.endsWith('ie')) {
		ingForm = v.slice(0, -2) + 'ying';
	} else if (v.endsWith('e') && !v.endsWith('ee') && !v.endsWith('ye') && !v.endsWith('oe')) {
		ingForm = v.slice(0, -1) + 'ing';
	} else if (/^[^aeiou]+[aeiou][^aeiouwxy]$/.test(v) && v.length <= 4) {
		ingForm = v + v.slice(-1) + 'ing';
	}

	return {
		base: v,
		past: pastForm,
		part: pastForm,
		s: sForm,
		ing: ingForm
	};
}

/**
 * Inflects a potentially multi-word English verb phrase (e.g. "take a photo", "wake up", "go out with someone")
 */
function buildVerbEnglishMeta(unit, rawEn) {
	const ko = unit[DATA_SCHEMA.Korean];
	let sense = extractPrimaryEnglishSense(rawEn);
	// Strip leading "to "
	sense = sense.replace(/^to\s+/i, '').trim();
	// Strip "one's" -> "my/one's" or clean up
	sense = sense.replace(/\bone's\b/g, 'my');

	// Special Korean verb overrides for maximum pedagogical clarity
	const SPECIAL_AV = {
		'계시다': { lit: 'stay/be(hon)', base: 'stay', past: 'stayed', part: 'stayed', s: 'stays', ing: 'staying' },
		'드시다': { lit: 'eat/drink(hon)', base: 'eat', past: 'ate', part: 'eaten', s: 'eats', ing: 'eating' },
		'잡수시다': { lit: 'eat(hon)', base: 'eat', past: 'ate', part: 'eaten', s: 'eats', ing: 'eating' },
		'주무시다': { lit: 'sleep(hon)', base: 'sleep', past: 'slept', part: 'slept', s: 'sleeps', ing: 'sleeping' },
		'말씀하시다': { lit: 'speak(hon)', base: 'speak', past: 'spoke', part: 'spoken', s: 'speaks', ing: 'speaking' },
		'돌아가시다': { lit: 'pass-away(hon)', base: 'pass away', past: 'passed away', part: 'passed away', s: 'passes away', ing: 'passing away' },
		'드리다': { lit: 'give(humble)', base: 'give', past: 'gave', part: 'given', s: 'gives', ing: 'giving' },
		'말씀드리다': { lit: 'say(humble)', base: 'say', past: 'said', part: 'said', s: 'says', ing: 'saying' },
		'여쭙다': { lit: 'ask(humble)', base: 'ask', past: 'asked', part: 'asked', s: 'asks', ing: 'asking' },
		'여쭈어보다': { lit: 'inquire(humble)', base: 'ask', past: 'asked', part: 'asked', s: 'asks', ing: 'asking' },
		'뵙다': { lit: 'meet(humble)', base: 'meet', past: 'met', part: 'met', s: 'meets', ing: 'meeting' },
		'도와드리다': { lit: 'help(humble)', base: 'help', past: 'helped', part: 'helped', s: 'helps', ing: 'helping' },
		'보여드리다': { lit: 'show(humble)', base: 'show', past: 'showed', part: 'shown', s: 'shows', ing: 'showing' }
	};
	if (SPECIAL_AV[ko]) return SPECIAL_AV[ko];

	const words = sense.split(/\s+/);
	const headVerb = words[0] || 'do';
	const rest = words.slice(1).join(' ');
	const inflected = inflectSingleEnglishVerb(headVerb);
	const suffix = rest ? ` ${rest}` : '';

	const meta = {
		lit: toHyphenatedLiteral(sense),
		base: inflected.base + suffix,
		past: inflected.past + suffix
	};
	if (inflected.part !== inflected.past) {
		meta.part = inflected.part + suffix;
	}
	if (IRREGULAR_EN_VERBS[headVerb.toLowerCase()]) {
		meta.s = inflected.s + suffix;
		meta.ing = inflected.ing + suffix;
	}
	return meta;
}

/**
 * Builds English metadata for Descriptive Verbs (adjectives / stative predicates)
 */
function buildDescriptiveVerbEnglishMeta(unit, rawEn) {
	const ko = unit[DATA_SCHEMA.Korean];
	const SPECIAL_DV = {
		'이다': { lit: 'be', adj: '', copula: true, stative: 'be' },
		'아니다': { lit: 'not-be', adj: 'not', copula: true, stative: 'not be' },
		'있다': { lit: 'exist/have', adj: 'present', copula: false, stative: 'have', locStative: 'be' },
		'없다': { lit: 'not-exist/not-have', adj: 'absent', copula: false, stative: 'not have', locStative: 'not be' },
		'맛있다': { lit: 'delicious', adj: 'delicious', copula: true },
		'맛없다': { lit: 'not-delicious', adj: 'not delicious', copula: true },
		'재미있다': { lit: 'fun/interesting', adj: 'interesting', copula: true },
		'재미없다': { lit: 'boring/not-fun', adj: 'not fun', copula: true },
		'배가 고프다': { lit: 'hungry', adj: 'hungry', copula: true },
		'시간이 없다': { lit: 'no-time-exist', adj: 'out of time', copula: false, stative: 'have no time' },
		'약속이 있다': { lit: 'appointment-exist', adj: 'busy with an appointment', copula: false, stative: 'have an appointment' },
		'약속이 없다': { lit: 'no-appointment-exist', adj: 'free', copula: false, stative: 'have no appointment' },
		'어떻다': { lit: 'how-be', adj: 'how', copula: true },
		'이렇다': { lit: 'like-this', adj: 'like this', copula: true },
		'그렇다': { lit: 'like-that', adj: 'like that', copula: true },
		'저렇다': { lit: 'like-that', adj: 'like that', copula: true },
		'편찮으시다': { lit: 'unwell(hon)', adj: 'unwell', copula: true }
	};
	if (SPECIAL_DV[ko]) return SPECIAL_DV[ko];

	let sense = extractPrimaryEnglishSense(rawEn);
	sense = sense.replace(/^to\s+be\s+/i, '').replace(/^to\s+/i, '').trim();
	return {
		lit: toHyphenatedLiteral(sense),
		adj: sense,
		copula: true
	};
}

/**
 * Builds English metadata for Nouns, Pronouns, Numbers, Determiners, Adverbs, Exclamations
 */
function buildNominalOrModifierEnglishMeta(unit, pos, rawEn) {
	const ko = unit[DATA_SCHEMA.Korean];
	const sense = extractPrimaryEnglishSense(rawEn);

	if (pos === 'Pronoun') {
		const PRONOUN_MAP = {
			'저': { lit: 'I(humble)', nat: 'I', obj: 'me', poss: 'my', person: 1, number: 'sg' },
			'나': { lit: 'I', nat: 'I', obj: 'me', poss: 'my', person: 1, number: 'sg' },
			'제': { lit: 'my(humble)', nat: 'my', person: 1, number: 'sg', possOnly: true },
			'내': { lit: 'my', nat: 'my', person: 1, number: 'sg', possOnly: true },
			'우리': { lit: 'we/our', nat: 'we', obj: 'us', poss: 'our', person: 1, number: 'pl' },
			'저희': { lit: 'we(humble)', nat: 'we', obj: 'us', poss: 'our', person: 1, number: 'pl' },
			'너': { lit: 'you', nat: 'you', obj: 'you', poss: 'your', person: 2, number: 'sg' },
			'너희': { lit: 'you-all', nat: 'you all', obj: 'you all', poss: 'your', person: 2, number: 'pl' },
			'여러분': { lit: 'everyone', nat: 'everyone', person: 2, number: 'pl' },
			'누구': { lit: 'who', nat: 'who', wh: true },
			'누가': { lit: 'who-[subj]', nat: 'who', wh: true },
			'무엇': { lit: 'what', nat: 'what', wh: true },
			'뭐': { lit: 'what', nat: 'what', wh: true },
			'뭘': { lit: 'what-[obj]', nat: 'what', wh: true },
			'어디': { lit: 'where', nat: 'where', wh: true },
			'언제': { lit: 'when', nat: 'when', wh: true },
			'얼마': { lit: 'how-much', nat: 'how much', wh: true },
			'몇': { lit: 'how-many', nat: 'how many', wh: true },
			'며칠': { lit: 'what-date', nat: 'what date', wh: true },
			'어느': { lit: 'which', nat: 'which', wh: true },
			'여기': { lit: 'here', nat: 'here', deictic: true },
			'이곳': { lit: 'this-place', nat: 'here', deictic: true },
			'거기': { lit: 'there', nat: 'there', deictic: true },
			'그곳': { lit: 'that-place', nat: 'there', deictic: true },
			'저기': { lit: 'over-there', nat: 'over there', deictic: true },
			'저곳': { lit: 'that-place-over-there', nat: 'over there', deictic: true },
			'이것': { lit: 'this-thing', nat: 'this' },
			'이거': { lit: 'this-thing', nat: 'this' },
			'그것': { lit: 'that-thing', nat: 'that' },
			'그거': { lit: 'that-thing', nat: 'that' },
			'저것': { lit: 'that-thing(distal)', nat: 'that over there' },
			'저거': { lit: 'that-thing(distal)', nat: 'that over there' },
			'이분': { lit: 'this-person(hon)', nat: 'this person' }
		};
		if (PRONOUN_MAP[ko]) return PRONOUN_MAP[ko];
		return { lit: toHyphenatedLiteral(sense), nat: sense, count: 'p' };
	}

	if (pos === 'Determiner') {
		return { lit: toHyphenatedLiteral(sense), nat: sense };
	}

	if (pos === 'Adverb' || pos === 'Exclamation' || pos === 'Number') {
		return { lit: toHyphenatedLiteral(sense), nat: sense };
	}

	// Noun (including counters, proper nouns, kinship, uncountable, countable)
	if (hasTag(unit, 'measureWord', 'sinoMeasureWord', 'koreanMeasureWord', 'counter')) {
		return {
			lit: `-${toHyphenatedLiteral(sense)}(${ko})`,
			nat: sense,
			count: 'counter'
		};
	}

	let count = 'c';
	if (hasTag(unit, 'proper_noun', 'name', 'country', 'city')) {
		count = 'p';
	} else if (hasTag(unit, 'time', 'weather', 'language', 'academic_subject', 'drink', 'liquid')) {
		count = 'u';
	} else if (hasTag(unit, 'family', 'kinship', 'kinship_elder')) {
		count = 'k';
	}

	return {
		lit: toHyphenatedLiteral(sense),
		nat: sense,
		count
	};
}

// ============================================================================
// 4. Main Enrichment Pass
// ============================================================================
function runEnrichment() {
	const updates = [];
	let enrichedCount = 0;

	for (let i = 0; i < KR_EN_languageUnits.length; i++) {
		const unit = KR_EN_languageUnits[i];
		const id = unit[DATA_SCHEMA.Id];
		const ko = unit[DATA_SCHEMA.Korean];
		const rawEn = unit[DATA_SCHEMA.English];
		const pos = unit[DATA_SCHEMA.PartofSpeech];
		const rawSd = unit[DATA_SCHEMA.SemanticData];

		let sd = {};
		if (rawSd && typeof rawSd === 'string') {
			try { sd = JSON.parse(rawSd); } catch (_) { sd = {}; }
		} else if (rawSd && typeof rawSd === 'object') {
			sd = { ...rawSd };
		}

		// Ensure required domain or logic exists for Stage 1 test integrity
		if (!sd.domain && !sd.logic) {
			sd.domain = pos === 'Grammar' ? 'grammar' : 'general';
		}

		// Compute `en` metadata by POS
		let enMeta = null;
		if (pos === 'Grammar') {
			if (GRAMMAR_METADATA_BY_ID[id]) {
				enMeta = GRAMMAR_METADATA_BY_ID[id];
			} else {
				const clean = extractPrimaryEnglishSense(rawEn);
				enMeta = { kind: 'pattern', lit: `-${toHyphenatedLiteral(clean)}`, nat: clean };
			}
		} else if (pos === 'Action Verb') {
			enMeta = buildVerbEnglishMeta(unit, rawEn);
		} else if (pos === 'Descriptive Verb') {
			enMeta = buildDescriptiveVerbEnglishMeta(unit, rawEn);
		} else {
			enMeta = buildNominalOrModifierEnglishMeta(unit, pos, rawEn);
		}

		sd.en = { ...(sd.en || {}), ...enMeta };
		enrichedCount++;

		updates.push({
			Id: id,
			SemanticData: JSON.stringify(sd)
		});
	}

	const tmpPath = path.resolve(__dirname, 'tmp_enrichment_updates.json');
	fs.writeFileSync(tmpPath, JSON.stringify(updates, null, 2), 'utf8');
	const res = executeUpdateFromFile(tmpPath, ['SemanticData'], { dataFile: DATA_PATH });
	fs.unlinkSync(tmpPath);

	// Re-sync schema_summary.json
	updateSchemaSummary();

	console.log(`Enriched ${enrichedCount} language units in data.js (updated: ${res.updated}).`);
}

if (require.main === module) {
	runEnrichment();
}

module.exports = { runEnrichment };

