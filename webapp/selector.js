/**
 * ============================================================================
 * webapp/selector.js - Streamlined Source/Unit Selector & Unit Details View
 * ============================================================================
 *
 * Implements:
 *   1. Collapsible Source list with tri-state checkboxes:
 *      - Checked ('✓', state="all") when all units in the Source are included
 *      - Empty ('', state="none") when 0 units in the Source are included
 *      - Tilde ('~', state="partial") when some (not all) units are included
 *      - Clicking toggles between including all and excluding all units in Source
 *   2. Expandable individual Language Units list per Source:
 *      - Individual checkbox per unit to include/exclude (InSet)
 *      - Clicking the language unit text opens the Language Unit Details view
 *   3. Language Unit Details view:
 *      - Single-line minimalist videogame HUD for RecognitionScore,
 *        LongTermRecognition, TimeStampLastCorrect, and clickable TimeStampLastSeen
 *      - Korean text, Conjugation/Grammar rules (if available), English definition,
 *        and Notes (rendered as Markdown including tiered lists and inline HTML)
 *      - Edit button to edit Korean, Conjugation, English, and pure-text Markdown Notes
 *        in-place where they appear in the Details view
 *      - 3 dynamically generated sentences/phrases using the language unit with a
 *        Regenerate button
 */

// ============================================================================
// 1. Markdown + Inline HTML Renderer (with Tiered Lists Support)
// ============================================================================

function formatInlineMarkdown(text) {
	if (!text) return '';
	// Strip any unsafe <script> tags while keeping legitimate inline HTML intact
	let out = String(text).replace(/<\s*\/?\s*script[^>]*>/gi, '');

	// Protect inline code spans first
	const codeTokens = [];
	out = out.replace(/`([^`]+)`/g, (_, code) => {
		const idx = codeTokens.length;
		const escaped = code
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
		codeTokens.push(`<code>${escaped}</code>`);
		return `\u0000CODE_${idx}\u0000`;
	});

	// Links: [label](url)
	out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
	// Bold: **text** or __text__
	out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
	out = out.replace(/__([^_]+)__/g, '<strong>$1</strong>');
	// Strikethrough: ~~text~~
	out = out.replace(/~~([^~]+)~~/g, '<del>$1</del>');
	// Italic: *text* or _text_
	out = out.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
	out = out.replace(/(^|[^_])_([^_\n]+)_(?!_)/g, '$1<em>$2</em>');

	// Restore inline code spans
	out = out.replace(/\u0000CODE_(\d+)\u0000/g, (_, idx) => codeTokens[Number(idx)] || '');
	return out;
}

/**
 * Renders Markdown string to HTML, supporting tiered (nested) unordered/ordered
 * lists, headings, blockquotes, fenced code blocks, and inline HTML.
 */
function renderMarkdownWithHtml(markdownStr) {
	if (!markdownStr || !String(markdownStr).trim()) return '';
	const lines = String(markdownStr).replace(/\r\n/g, '\n').split('\n');
	const htmlParts = [];
	const listStack = []; // Array<{ type: 'ul' | 'ol', indent: number }>
	let inCodeBlock = false;
	let codeBuffer = [];

	const closeListsToIndent = (targetIndent) => {
		while (listStack.length > 0 && listStack[listStack.length - 1].indent > targetIndent) {
			const popped = listStack.pop();
			htmlParts.push(`</li></${popped.type}>`);
		}
	};

	const closeAllLists = () => {
		while (listStack.length > 0) {
			const popped = listStack.pop();
			htmlParts.push(`</li></${popped.type}>`);
		}
	};

	for (let i = 0; i < lines.length; i++) {
		const rawLine = lines[i];

		// Fenced code blocks
		if (rawLine.trim().startsWith('```')) {
			closeAllLists();
			if (!inCodeBlock) {
				inCodeBlock = true;
				codeBuffer = [];
			} else {
				inCodeBlock = false;
				const escaped = codeBuffer.join('\n')
					.replace(/&/g, '&amp;')
					.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;');
				htmlParts.push(`<pre><code>${escaped}</code></pre>`);
			}
			continue;
		}
		if (inCodeBlock) {
			codeBuffer.push(rawLine);
			continue;
		}

		// Check for list item (unordered: -, *, + | ordered: 1., 2., a.)
		const listMatch = rawLine.match(/^([ \t]*)(?:([-*+])|(\d+|[a-zA-Z])[.)])\s+(.*)$/);
		if (listMatch) {
			const indentRaw = listMatch[1].replace(/\t/g, '  ');
			const indent = indentRaw.length;
			const listType = listMatch[2] ? 'ul' : 'ol';
			const itemContent = formatInlineMarkdown(listMatch[4]);

			if (listStack.length === 0) {
				listStack.push({ type: listType, indent });
				htmlParts.push(`<${listType}><li>${itemContent}`);
			} else {
				const top = listStack[listStack.length - 1];
				if (indent > top.indent) {
					listStack.push({ type: listType, indent });
					htmlParts.push(`<${listType}><li>${itemContent}`);
				} else if (indent === top.indent) {
					if (top.type !== listType) {
						listStack.pop();
						htmlParts.push(`</li></${top.type}>`);
						listStack.push({ type: listType, indent });
						htmlParts.push(`<${listType}><li>${itemContent}`);
					} else {
						htmlParts.push(`</li><li>${itemContent}`);
					}
				} else {
					closeListsToIndent(indent);
					const currentTop = listStack[listStack.length - 1];
					if (!currentTop) {
						listStack.push({ type: listType, indent });
						htmlParts.push(`<${listType}><li>${itemContent}`);
					} else if (currentTop.type !== listType) {
						listStack.pop();
						htmlParts.push(`</li></${currentTop.type}>`);
						listStack.push({ type: listType, indent });
						htmlParts.push(`<${listType}><li>${itemContent}`);
					} else {
						htmlParts.push(`</li><li>${itemContent}`);
					}
				}
			}
			continue;
		}

		// Non-list line closes any open lists
		closeAllLists();

		const trimmed = rawLine.trim();
		if (!trimmed) continue;

		// Headings (# .. ######)
		const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
		if (headingMatch) {
			const level = headingMatch[1].length;
			htmlParts.push(`<h${level}>${formatInlineMarkdown(headingMatch[2])}</h${level}>`);
			continue;
		}

		// Horizontal rule
		if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
			htmlParts.push('<hr>');
			continue;
		}

		// Blockquote
		if (trimmed.startsWith('>')) {
			const quoteText = trimmed.replace(/^>\s?/, '');
			htmlParts.push(`<blockquote>${formatInlineMarkdown(quoteText)}</blockquote>`);
			continue;
		}

		htmlParts.push(`<p>${formatInlineMarkdown(rawLine)}</p>`);
	}

	closeAllLists();
	if (inCodeBlock && codeBuffer.length > 0) {
		const escaped = codeBuffer.join('\n')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
		htmlParts.push(`<pre><code>${escaped}</code></pre>`);
	}

	return htmlParts.join('\n');
}

// ============================================================================
// 2. Minimalist Videogame HUD Formatter
// ============================================================================

const LTR_HUD_SPECS = {
	unknown: { icon: '🔒', code: 'UNK', label: 'Unknown', tierClass: 'hud-tier-0' },
	recognized: { icon: '🥉', code: 'REC', label: 'Recognized', tierClass: 'hud-tier-1' },
	definitionKnown: { icon: '🥈', code: 'DEF', label: 'Definition Known', tierClass: 'hud-tier-2' },
	knownByDefinition: { icon: '👑', code: 'MAX', label: 'Known By Definition', tierClass: 'hud-tier-3' }
};

function formatPithyTime(unixSeconds, nowSeconds = Math.floor(Date.now() / 1000)) {
	const ts = Number(unixSeconds) || 0;
	if (ts <= 0) return '--';
	const diff = Math.max(0, nowSeconds - ts);
	if (diff < 5) return 'NOW';
	if (diff < 60) return `${diff}s`;
	if (diff < 3600) return `${Math.floor(diff / 60)}m`;
	if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
	if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d`;
	const d = new Date(ts * 1000);
	return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatHudTelemetry(scoreOrObj, ltr, lastCorrect, lastSeen, nowSeconds = Math.floor(Date.now() / 1000)) {
	let s = scoreOrObj;
	let l = ltr;
	let lc = lastCorrect;
	let ls = lastSeen;
	let now = nowSeconds;
	if (scoreOrObj && typeof scoreOrObj === 'object') {
		s = scoreOrObj.RecognitionScore;
		l = scoreOrObj.LongTermRecognition;
		lc = scoreOrObj.TimeStampLastCorrect;
		ls = scoreOrObj.TimeStampLastSeen;
		if (typeof ltr === 'number') now = ltr;
	}
	const numScore = Number(s) || 0;
	const scoreText = numScore > 0 ? `+${numScore}` : String(numScore);
	const ltrSpec = LTR_HUD_SPECS[l] || LTR_HUD_SPECS.unknown;
	const correctText = formatPithyTime(lc, now);
	const seenText = formatPithyTime(ls, now);

	return {
		scoreText,
		scorePill: `⚡ ${scoreText}`,
		ltrPill: `${ltrSpec.icon} ${ltrSpec.code}`,
		ltrSpec,
		ltrBadge: ltrSpec,
		lastCorrectText: correctText,
		correctPill: `🎯 ${correctText}`,
		lastSeenText: seenText,
		seenPill: `👁 ${seenText}`,
		summaryLine: `⚡ ${scoreText} · ${ltrSpec.icon} ${ltrSpec.code} · 🎯 ${correctText} · 👁 ${seenText}`
	};
}

// ============================================================================
// 3. Korean Morphology & Dynamic 3-Sentence Generator for Any Language Unit
// ============================================================================

function _decomposeHangul(ch) {
	if (!ch) return null;
	const code = ch.charCodeAt(0);
	if (code < 0xAC00 || code > 0xD7A3) return null;
	const offset = code - 0xAC00;
	return {
		initial: Math.floor(offset / 588),
		medial: Math.floor((offset % 588) / 28),
		final: offset % 28
	};
}

function _composeHangul(initial, medial, final = 0) {
	return String.fromCharCode(0xAC00 + (initial * 21 + medial) * 28 + final);
}

function _hasBatchim(word) {
	if (!word) return false;
	for (let i = word.length - 1; i >= 0; i--) {
		const d = _decomposeHangul(word[i]);
		if (d) return d.final !== 0;
	}
	return false;
}

function _hasRieulBatchim(word) {
	if (!word) return false;
	for (let i = word.length - 1; i >= 0; i--) {
		const d = _decomposeHangul(word[i]);
		if (d) return d.final === 8;
	}
	return false;
}

function _attachParticle(noun, type) {
	const b = _hasBatchim(noun);
	const r = _hasRieulBatchim(noun);
	switch (type) {
		case 'topic': return noun + (b ? '은' : '는');
		case 'subject': return noun + (b ? '이' : '가');
		case 'object': return noun + (b ? '을' : '를');
		case 'copula': return noun + (b ? '이에요' : '예요');
		case 'copula_past': return noun + (b ? '이었어요' : '였어요');
		case 'ro': return noun + (!b || r ? '로' : '으로');
		case 'with': return noun + (b ? '과' : '와');
		case 'loc': return noun + '에';
		case 'loc_act': return noun + '에서';
		case 'also': return noun + '도';
		default: return noun;
	}
}

function _getVerbStem(lemma) {
	const s = String(lemma || '').trim();
	return s.endsWith('다') ? s.slice(0, -1) : s;
}

function _conjugateAoStem(lemma, conjRule = '') {
	const stem = _getVerbStem(lemma);
	if (!stem) return '';
	const rule = String(conjRule || '').toLowerCase();

	if (stem.endsWith('하') || rule.includes('hada')) {
		return stem.slice(0, -1) + '해';
	}
	const lastChar = stem[stem.length - 1];
	const prefix = stem.slice(0, -1);
	const d = _decomposeHangul(lastChar);
	if (!d) return stem + '어';

	// ㅂ irregular (e.g. 어렵다 -> 어려워, 돕다 -> 도와)
	if (rule.includes('p_irregular') && d.final === 17) {
		const baseNoBatchim = _composeHangul(d.initial, d.medial, 0);
		if (stem === '돕' || stem === '곱') {
			return prefix + baseNoBatchim + '와';
		}
		return prefix + baseNoBatchim + '워';
	}
	// ㄷ irregular (e.g. 듣다 -> 들어, 걷다 -> 걸어)
	if (rule.includes('d_irregular') && d.final === 7) {
		const rieulSyl = _composeHangul(d.initial, d.medial, 8);
		const vowel = (d.medial === 0 || d.medial === 8) ? '아' : '어';
		return prefix + rieulSyl + vowel;
	}
	// ㅅ irregular (e.g. 짓다 -> 지어, 낫다 -> 나아)
	if (rule.includes('s_irregular') && d.final === 19) {
		const baseNoBatchim = _composeHangul(d.initial, d.medial, 0);
		const vowel = (d.medial === 0 || d.medial === 8) ? '아' : '어';
		return prefix + baseNoBatchim + vowel;
	}
	// 르 irregular (e.g. 모르다 -> 몰라, 부르다 -> 불러)
	if ((rule.includes('reu_irregular') || lastChar === '르') && d.initial === 5 && d.medial === 18 && d.final === 0 && prefix.length > 0) {
		const prevChar = prefix[prefix.length - 1];
		const prevD = _decomposeHangul(prevChar);
		if (prevD && prevD.final === 0) {
			const prevWithRieul = _composeHangul(prevD.initial, prevD.medial, 8);
			const isBright = prevD.medial === 0 || prevD.medial === 8;
			return prefix.slice(0, -1) + prevWithRieul + (isBright ? '라' : '러');
		}
	}
	// ㅡ drop (e.g. 크다 -> 커, 바쁘다 -> 바빠, 쓰다 -> 써)
	if (d.medial === 18 && d.final === 0) {
		let isBright = false;
		if (prefix.length > 0) {
			const prevD = _decomposeHangul(prefix[prefix.length - 1]);
			if (prevD && (prevD.medial === 0 || prevD.medial === 8)) isBright = true;
		}
		return prefix + _composeHangul(d.initial, isBright ? 0 : 4, 0);
	}

	const isBright = (d.medial === 0 || d.medial === 2 || d.medial === 8 || d.medial === 12) && !rule.includes('regular_eo');
	if (d.final === 0) {
		if (d.medial === 0 || d.medial === 4 || d.medial === 1 || d.medial === 5) return stem; // 가 -> 가, 서 -> 서
		if (d.medial === 8) return prefix + _composeHangul(d.initial, 9, 0); // 오 -> 와
		if (d.medial === 13) return prefix + _composeHangul(d.initial, 14, 0); // 주 -> 줘
		if (d.medial === 20) return prefix + _composeHangul(d.initial, 6, 0); // 마시 -> 마셔
		if (d.medial === 11) return prefix + _composeHangul(d.initial, 10, 0); // 되 -> 돼
	}

	return stem + (isBright ? '아' : '어');
}

function _conjugatePolite(lemma, conjRule = '') {
	if (lemma === '이다') return '이에요';
	if (lemma === '아니다') return '아니에요';
	return _conjugateAoStem(lemma, conjRule) + '요';
}

function _conjugatePastPolite(lemma, conjRule = '') {
	if (lemma === '이다') return '이었어요';
	const ao = _conjugateAoStem(lemma, conjRule);
	if (!ao) return '';
	const last = ao[ao.length - 1];
	const d = _decomposeHangul(last);
	if (d && d.final === 0) {
		return ao.slice(0, -1) + _composeHangul(d.initial, d.medial, 20) + '어요';
	}
	return ao + '았어요';
}

function _conjugateFuturePolite(lemma, conjRule = '') {
	const stem = _getVerbStem(lemma);
	if (!stem) return '';
	const rule = String(conjRule || '').toLowerCase();
	const last = stem[stem.length - 1];
	const d = _decomposeHangul(last);
	if (!d) return stem + '을 거예요';

	if (rule.includes('p_irregular') && d.final === 17) {
		return stem.slice(0, -1) + _composeHangul(d.initial, d.medial, 0) + '울 거예요';
	}
	if (rule.includes('d_irregular') && d.final === 7) {
		return stem.slice(0, -1) + _composeHangul(d.initial, d.medial, 8) + '을 거예요';
	}
	if (d.final === 0) {
		return stem.slice(0, -1) + _composeHangul(d.initial, d.medial, 8) + ' 거예요';
	}
	if (d.final === 8) {
		return stem + ' 거예요';
	}
	return stem + '을 거예요';
}

function _hasUnitTag(unit, schema, ...targetTags) {
	if (!unit) return false;
	const raw = unit[schema.SemanticTags];
	if (!raw) return false;
	if (raw instanceof Set) return targetTags.some(t => raw.has(t));
	if (Array.isArray(raw)) return targetTags.some(t => raw.includes(t));
	return false;
}

function _parseVec(unit, schema) {
	if (!unit) return {};
	const raw = unit[schema.SemanticVector];
	if (!raw) return {};
	if (typeof raw === 'object') return raw;
	try { return JSON.parse(raw); } catch (_) { return {}; }
}

function _pickDistinctRandom(arr, count) {
	if (!arr || arr.length === 0) return [];
	const copy = [...arr];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy.slice(0, count);
}

/**
 * Generates `count` (default 3) natural Korean sentences/phrases using the
 * specified language unit `unitId`.
 */
function generateSentencesForUnit(unitId, count = 3, rawUnits = null, dataSchema = null) {
	const units = rawUnits || (typeof KR_EN_languageUnits !== 'undefined' ? KR_EN_languageUnits : []);
	const schema = dataSchema || (typeof DATA_SCHEMA !== 'undefined' ? DATA_SCHEMA : {
		Id: 0, Korean: 1, English: 2, PartofSpeech: 3, SemanticTags: 4,
		Disambiguation: 5, Conjugation: 6, Source: 7, PriorityScore: 8,
		FormalityLevel: 9, HonorificRules: 10, SemanticVector: 11, SyntaxFrame: 12
	});

	const target = units[unitId];
	if (!target) return [];

	const ko = String(target[schema.Korean] || '').trim();
	const en = String(target[schema.English] || '').trim();
	const pos = String(target[schema.PartofSpeech] || 'Noun');
	const conj = target[schema.Conjugation] || '';
	const sv = _parseVec(target, schema);

	const nouns = units.filter(u => u && u[schema.PartofSpeech] === 'Noun');
	const personNouns = nouns.filter(u => _hasUnitTag(u, schema, 'person', 'profession') && !_hasUnitTag(u, schema, 'measureWord'));
	const placeNouns = nouns.filter(u => _hasUnitTag(u, schema, 'place', 'country', 'building', 'facility'));
	const foodNouns = nouns.filter(u => _hasUnitTag(u, schema, 'food'));
	const drinkNouns = nouns.filter(u => _hasUnitTag(u, schema, 'drink'));
	const actionVerbs = units.filter(u => u && u[schema.PartofSpeech] === 'Action Verb');
	const descVerbs = units.filter(u => u && u[schema.PartofSpeech] === 'Descriptive Verb');

	const candidates = [];

	const sampleWord = (pool, fallbackKo, fallbackEn) => {
		if (!pool || pool.length === 0) return { ko: fallbackKo, en: fallbackEn };
		const picked = pool[Math.floor(Math.random() * pool.length)];
		return { ko: picked[schema.Korean], en: picked[schema.English], conj: picked[schema.Conjugation] };
	};

	if (pos === 'Action Verb') {
		const req = sv.req || '';
		let objPool = nouns.filter(u => !_hasUnitTag(u, schema, 'measureWord', 'time', 'person'));
		let useLocative = _hasUnitTag(target, schema, 'intransitive_motion', 'locative_goal') || req === 'place';

		if (req === 'food' || _hasUnitTag(target, schema, 'transitive_food')) objPool = foodNouns;
		else if (req === 'drink') objPool = drinkNouns;
		else if (useLocative) objPool = placeNouns;

		for (let i = 0; i < 8; i++) {
			const subj = sampleWord(personNouns, '학생', 'student');
			const obj = sampleWord(objPool, useLocative ? '학교' : '책', useLocative ? 'school' : 'book');
			const place = sampleWord(placeNouns, '집', 'home');
			const argPhrase = useLocative
				? _attachParticle(obj.ko, 'loc')
				: (req === 'subject' || _hasUnitTag(target, schema, 'intransitive') ? _attachParticle(place.ko, 'loc_act') : _attachParticle(obj.ko, 'object'));

			candidates.push({
				ko: `${_attachParticle(subj.ko, 'topic')} 오늘 ${argPhrase} ${_conjugatePolite(ko, conj)}.`,
				en: `Today the ${subj.en} (${ko}: ${en}) — with ${obj.en}.`
			});
			candidates.push({
				ko: `어제 친구와 같이 ${argPhrase} ${_conjugatePastPolite(ko, conj)}.`,
				en: `Yesterday with a friend: ${ko} (${en}, past tense).`
			});
			candidates.push({
				ko: `내일도 ${argPhrase} ${_conjugateFuturePolite(ko, conj)}.`,
				en: `Tomorrow as well: will ${en} (${ko}).`
			});
			candidates.push({
				ko: `저는 지금 ${argPhrase} ${_getVerbStem(ko)}고 싶어요.`,
				en: `Right now I want to ${en} (${ko}).`
			});
			candidates.push({
				ko: `${_attachParticle(subj.ko, 'subject')} 지금 ${argPhrase} ${_getVerbStem(ko)}고 있어요.`,
				en: `The ${subj.en} is currently doing: ${ko} (${en}).`
			});
		}
	} else if (pos === 'Descriptive Verb') {
		const req = sv.req || '';
		let subjPool = nouns.filter(u => !_hasUnitTag(u, schema, 'measureWord', 'time'));
		if (req === 'food' || _hasUnitTag(target, schema, 'descriptive_food')) subjPool = [...foodNouns, ...drinkNouns];
		else if (req === 'person' || _hasUnitTag(target, schema, 'descriptive_person')) subjPool = personNouns;
		else if (req === 'place') subjPool = placeNouns;

		const degreeAdverbs = ['아주', '매우', '정말', '참'];
		for (let i = 0; i < 8; i++) {
			const subj = sampleWord(subjPool, '음식', 'food');
			const adv = degreeAdverbs[i % degreeAdverbs.length];
			candidates.push({
				ko: `이 ${_attachParticle(subj.ko, 'topic')} ${adv} ${_conjugatePolite(ko, conj)}.`,
				en: `This ${subj.en} is ${adv} ${en} (${ko}).`
			});
			candidates.push({
				ko: `어제는 ${_attachParticle(subj.ko, 'subject')} 정말 ${_conjugatePastPolite(ko, conj)}.`,
				en: `Yesterday the ${subj.en} was really ${en} (${ko}).`
			});
			candidates.push({
				ko: `${_attachParticle(subj.ko, 'subject')} ${_conjugateAoStem(ko, conj)}서 기분이 좋아요.`,
				en: `Because the ${subj.en} is ${en} (${ko}), I feel good.`
			});
			candidates.push({
				ko: `요즘도 ${_attachParticle(subj.ko, 'subject')} 많이 ${_conjugatePolite(ko, conj)}?`,
				en: `Is the ${subj.en} still very ${en} (${ko}) these days?`
			});
		}
	} else if (pos === 'Noun' || pos === 'Pronoun') {
		const isPlace = _hasUnitTag(target, schema, 'place', 'country', 'building', 'facility') || sv.domain === 'place';
		const isFood = _hasUnitTag(target, schema, 'food') || sv.domain === 'food';
		const isDrink = _hasUnitTag(target, schema, 'drink') || sv.domain === 'drink';
		const isPerson = _hasUnitTag(target, schema, 'person', 'profession') || sv.domain === 'person';
		const isTime = _hasUnitTag(target, schema, 'time') || sv.domain === 'time';

		for (let i = 0; i < 8; i++) {
			if (isPlace) {
				const person = sampleWord(personNouns, '학생', 'student');
				candidates.push({
					ko: `${_attachParticle(person.ko, 'topic')} 오늘 ${_attachParticle(ko, 'loc')} 가요.`,
					en: `Today the ${person.en} goes to ${en} (${ko}).`
				});
				candidates.push({
					ko: `저는 어제 ${_attachParticle(ko, 'loc_act')} 친구를 만났어요.`,
					en: `Yesterday I met a friend at ${en} (${ko}).`
				});
				candidates.push({
					ko: `여기가 바로 유명한 ${_attachParticle(ko, 'copula')}.`,
					en: `This place right here is the famous ${en} (${ko}).`
				});
			} else if (isFood || isDrink) {
				const verb = isDrink ? '마시다' : '먹다';
				const verbConj = isDrink ? 'i_irregular' : 'regular_eo';
				candidates.push({
					ko: `저는 오늘 ${_attachParticle(ko, 'object')} ${_conjugatePolite(verb, verbConj)}.`,
					en: `Today I ${isDrink ? 'drink' : 'eat'} ${en} (${ko}).`
				});
				candidates.push({
					ko: `이 ${_attachParticle(ko, 'topic')} 정말 맛있어요.`,
					en: `This ${en} (${ko}) is really delicious.`
				});
				candidates.push({
					ko: `우리 같이 ${_attachParticle(ko, 'object')} 먹을까요?`,
					en: `Shall we have ${en} (${ko}) together?`
				});
			} else if (isPerson) {
				const place = sampleWord(placeNouns, '학교', 'school');
				candidates.push({
					ko: `${_attachParticle(ko, 'topic')} 지금 ${_attachParticle(place.ko, 'loc')} 있어요.`,
					en: `The ${en} (${ko}) is at ${place.en} right now.`
				});
				candidates.push({
					ko: `저기 있는 분은 친절한 ${_attachParticle(ko, 'copula')}.`,
					en: `That person over there is a kind ${en} (${ko}).`
				});
				candidates.push({
					ko: `${_attachParticle(ko, 'with')} 함께 한국어를 공부해요.`,
					en: `I study Korean together with ${en} (${ko}).`
				});
			} else if (isTime) {
				const av = sampleWord(actionVerbs, '공부하다', 'to study');
				candidates.push({
					ko: `${ko} 친구와 같이 한국어를 ${_conjugatePolite(av.ko, av.conj)}.`,
					en: `At/on ${en} (${ko}), I ${av.en} with a friend.`
				});
				candidates.push({
					ko: `${_attachParticle(ko, 'topic')} 날씨가 참 좋아요.`,
					en: `As for ${en} (${ko}), the weather is very nice.`
				});
				candidates.push({
					ko: `${ko} 시간이 괜찮아요?`,
					en: `Is the time okay on/at ${en} (${ko})?`
				});
			} else {
				const person = sampleWord(personNouns, '학생', 'student');
				const dv = sampleWord(descVerbs, '좋다', 'to be good');
				candidates.push({
					ko: `이것은 제가 좋아하는 ${_attachParticle(ko, 'copula')}.`,
					en: `This is the ${en} (${ko}) that I like.`
				});
				candidates.push({
					ko: `${_attachParticle(person.ko, 'topic')} ${_attachParticle(ko, 'object')} 찾고 있어요.`,
					en: `The ${person.en} is looking for ${en} (${ko}).`
				});
				candidates.push({
					ko: `이 ${_attachParticle(ko, 'subject')} 아주 ${_conjugatePolite(dv.ko, dv.conj)}.`,
					en: `This ${en} (${ko}) is very ${dv.en}.`
				});
			}
		}
	} else if (pos === 'Grammar') {
		for (let i = 0; i < 8; i++) {
			const person = sampleWord(personNouns, '학생', 'student');
			const place = sampleWord(placeNouns, '학교', 'school');
			const food = sampleWord(foodNouns, '밥', 'rice/meal');
			const av = sampleWord(actionVerbs, '가다', 'to go');
			const stem = _getVerbStem(av.ko);
			const cleanGram = ko.replace(/^-/, '').split('/')[0].trim();

			if (ko.startsWith('-')) {
				candidates.push({
					ko: `저는 오늘 ${_attachParticle(place.ko, 'loc')} ${stem}${cleanGram}.`,
					en: `Pattern [${ko}] (${en}) applied to ${av.ko} (${av.en}).`
				});
				candidates.push({
					ko: `${_attachParticle(person.ko, 'topic')} ${_attachParticle(food.ko, 'object')} 먹${cleanGram}.`,
					en: `Using grammar [${ko}] (${en}) with 먹다 (to eat).`
				});
				candidates.push({
					ko: `한국어를 열심히 공부하${cleanGram}.`,
					en: `Using grammar [${ko}] (${en}) with 공부하다 (to study).`
				});
			} else {
				candidates.push({
					ko: `${person.ko}${cleanGram} 지금 ${_attachParticle(place.ko, 'loc')} 가요.`,
					en: `Using particle/grammar [${ko}] (${en}) with ${person.ko} (${person.en}).`
				});
				candidates.push({
					ko: `오늘 ${food.ko}${cleanGram} 정말 맛있어요.`,
					en: `Using [${ko}] (${en}) in a descriptive sentence with ${food.ko}.`
				});
				candidates.push({
					ko: `이곳은 ${place.ko}${cleanGram} 맞아요.`,
					en: `Using [${ko}] (${en}) with ${place.ko} (${place.en}).`
				});
			}
		}
	} else {
		// Adverb, Determiner, Number, Exclamation
		for (let i = 0; i < 8; i++) {
			const person = sampleWord(personNouns, '친구', 'friend');
			const place = sampleWord(placeNouns, '한국', 'Korea');
			const av = sampleWord(actionVerbs, '공부하다', 'to study');
			if (pos === 'Determiner' || pos === 'Number') {
				candidates.push({
					ko: `${ko} ${_attachParticle(person.ko, 'topic')} 한국어를 잘해요.`,
					en: `${en} (${ko}) ${person.en} speaks Korean well.`
				});
				candidates.push({
					ko: `저는 ${ko} 책을 읽고 싶어요.`,
					en: `I want to read ${en} (${ko}) book(s).`
				});
				candidates.push({
					ko: `${ko} 사람이 ${_attachParticle(place.ko, 'loc')} 왔어요.`,
					en: `${en} (${ko}) person/people came to ${place.en}.`
				});
			} else if (pos === 'Exclamation') {
				candidates.push({
					ko: `${ko}! 만나서 반가워요.`,
					en: `${en} (${ko})! Nice to meet you.`
				});
				candidates.push({
					ko: `${ko}, 저는 ${_attachParticle(place.ko, 'loc')} 가고 있어요.`,
					en: `${en} (${ko}), I am going to ${place.en}.`
				});
				candidates.push({
					ko: `${ko}, 오늘 시간이 괜찮아요.`,
					en: `${en} (${ko}), the time works today.`
				});
			} else {
				// Adverb
				candidates.push({
					ko: `${_attachParticle(person.ko, 'topic')} ${ko} 한국어를 ${_conjugatePolite(av.ko, av.conj)}.`,
					en: `The ${person.en} (${ko}: ${en}) ${av.en} Korean.`
				});
				candidates.push({
					ko: `오늘도 ${ko} ${_attachParticle(place.ko, 'loc')} 갔어요.`,
					en: `Today too, went to ${place.en} (${ko}: ${en}).`
				});
				candidates.push({
					ko: `우리 ${ko} 같이 연습해요!`,
					en: `Let's practice together (${ko}: ${en})!`
				});
			}
		}
	}

	// Deduplicate by Korean string and pick `count`
	const uniqueMap = new Map();
	for (const item of candidates) {
		if (!uniqueMap.has(item.ko)) {
			uniqueMap.set(item.ko, item);
		}
	}
	return _pickDistinctRandom(Array.from(uniqueMap.values()), count);
}

// ============================================================================
// 4. Streamlined Unit Selector & Details View Controller
// ============================================================================

class UnitSelectorView {
	constructor(options = {}) {
		this.engine = options.engine;
		this.onStateChange = options.onStateChange || (() => {});

		this.expandedSources = new Set();
		this.selectedUnitId = null;
		this.isEditingDetails = false;
		this.generatedSentences = [];
		this.searchQuery = '';

		this.container = null;
		this.sourcesListEl = null;
		this.detailsPaneEl = null;
	}

	/**
	 * Groups all language units by their Source in canonical order.
	 * Returns Array<{ source: string, unitIds: number[], includedCount: number, state: 'all' | 'none' | 'partial' }>
	 */
	getSourceGroups() {
		const groupsMap = new Map();
		const q = this.searchQuery.trim().toLowerCase();
		const total = this.engine.rawUnits.length;

		for (let unitId = 0; unitId < total; unitId++) {
			const unit = this.engine.rawUnits[unitId];
			if (!unit) continue;
			const srcIdx = this.engine.dataSchema?.Source ?? 7;
			const src = String(this.engine.getCellValue(unitId, 'Source') || unit[srcIdx] || 'Uncategorized');

			if (q) {
				const ko = String(this.engine.getCellValue(unitId, 'Korean') || '').toLowerCase();
				const en = String(this.engine.getCellValue(unitId, 'English') || '').toLowerCase();
				const srcLower = src.toLowerCase();
				if (!ko.includes(q) && !en.includes(q) && !srcLower.includes(q) && !String(unitId).includes(q)) {
					continue;
				}
			}

			if (!groupsMap.has(src)) {
				groupsMap.set(src, []);
			}
			groupsMap.get(src).push(unitId);
		}

		const result = [];
		for (const [source, unitIds] of groupsMap.entries()) {
			let includedCount = 0;
			for (const id of unitIds) {
				if (this.engine.getCellValue(id, 'InSet')) {
					includedCount++;
				}
			}
			let state = 'none';
			let icon = '';
			if (unitIds.length > 0 && includedCount === unitIds.length) {
				state = 'all';
				icon = '✓';
			} else if (includedCount > 0) {
				state = 'partial';
				icon = '~';
			}
			result.push({
				source,
				unitIds,
				includedCount,
				totalCount: unitIds.length,
				state,
				icon
			});
		}
		return result;
	}

	/**
	 * Toggles inclusion/exclusion of all language units in a Source section.
	 * If currently 'all' -> sets all to false (excluded).
	 * If currently 'none' or 'partial' -> sets all to true (included).
	 */
	async toggleSourceInclusion(sourceName) {
		const groups = this.getSourceGroups();
		const group = groups.find(g => g.source === sourceName);
		if (!group || group.unitIds.length === 0) return null;

		const shouldInclude = group.state !== 'all';
		await this.engine.setBulkColumnValue(group.unitIds, 'InSet', shouldInclude);
		this.renderSourcesList();
		if (this.selectedUnitId !== null) {
			this.renderDetailsPane();
		}
		this.onStateChange({ type: 'selector-source-toggled', source: sourceName, included: shouldInclude });
		return { source: sourceName, targetInclude: shouldInclude, count: group.unitIds.length };
	}

	toggleSourceExpanded(sourceName) {
		if (this.expandedSources.has(sourceName)) {
			this.expandedSources.delete(sourceName);
		} else {
			this.expandedSources.add(sourceName);
		}
		this.renderSourcesList();
		return this.expandedSources.has(sourceName);
	}

	toggleSourceExpand(sourceName) {
		return this.toggleSourceExpanded(sourceName);
	}

	async toggleUnitInclusion(unitId, checked) {
		const nextVal = checked !== undefined ? Boolean(checked) : !this.engine.getCellValue(unitId, 'InSet');
		await this.engine.setCellValue(unitId, 'InSet', nextVal);
		this.renderSourcesList();
		if (this.selectedUnitId === unitId) {
			this.renderDetailsPane();
		}
		this.onStateChange({ type: 'selector-unit-toggled', unitId, included: nextVal });
		return nextVal;
	}

	selectUnitForDetails(unitId) {
		this.selectedUnitId = unitId;
		this.isEditingDetails = false;
		this.regenerateSentences(unitId);
		this.renderSourcesList();
		this.renderDetailsPane();
	}

	selectUnit(unitId) {
		return this.selectUnitForDetails(unitId);
	}

	getSentencesForSelectedUnit() {
		if (this.selectedUnitId === null) return [];
		if (!this.generatedSentences || this.generatedSentences.length === 0) {
			this.regenerateSentences(this.selectedUnitId);
		}
		return this.generatedSentences;
	}

	regenerateSentences(unitId = this.selectedUnitId) {
		const targetId = unitId !== undefined && unitId !== null ? unitId : this.selectedUnitId;
		if (targetId === null || targetId === undefined) {
			this.generatedSentences = [];
			return [];
		}
		const prevJson = JSON.stringify(this.generatedSentences || []);
		let next = [];
		for (let attempt = 0; attempt < 5; attempt++) {
			next = generateSentencesForUnit(
				targetId,
				3,
				this.engine.rawUnits,
				this.engine.dataSchema
			);
			if (JSON.stringify(next) !== prevJson) break;
		}
		this.generatedSentences = next;
		return this.generatedSentences;
	}

	setEditMode(isEditing) {
		this.isEditingDetails = Boolean(isEditing);
		this.renderDetailsPane();
	}

	async touchUnitLastSeen(unitId = this.selectedUnitId) {
		if (unitId === null || unitId === undefined) return null;
		const nowUnix = Math.floor(Date.now() / 1000);
		await this.engine.setCellValue(unitId, 'TimeStampLastSeen', nowUnix);
		this.renderDetailsPane();
		this.onStateChange({ type: 'selector-last-seen-updated', unitId, timestamp: nowUnix });
		return nowUnix;
	}

	async saveEditedDetails(unitId, fields = {}) {
		const ko = fields.korean !== undefined ? fields.korean : fields.Korean;
		const conj = fields.conjugation !== undefined ? fields.conjugation : fields.Conjugation;
		const en = fields.english !== undefined ? fields.english : fields.English;
		const notes = fields.notes !== undefined ? fields.notes : fields.Notes;

		if (ko !== undefined) {
			await this.engine.setCellValue(unitId, 'Korean', ko);
		}
		if (conj !== undefined) {
			await this.engine.setCellValue(unitId, 'Conjugation', conj);
		}
		if (en !== undefined) {
			await this.engine.setCellValue(unitId, 'English', en);
		}
		if (notes !== undefined) {
			await this.engine.setCellValue(unitId, 'notes', notes);
		}
		this.isEditingDetails = false;
		this.regenerateSentences(unitId);
		this.renderSourcesList();
		this.renderDetailsPane();
		this.onStateChange({ type: 'selector-details-saved', unitId });
	}

	// =========================================================================
	// Browser DOM Mounting & Rendering
	// =========================================================================

	mount(containerElement) {
		this.container = containerElement;
		this.container.innerHTML = '';

		const layout = document.createElement('div');
		layout.className = 'selector-split-layout';

		// Left Column: Streamlined Source & Unit Tree
		const leftCol = document.createElement('div');
		leftCol.className = 'selector-tree-pane';

		const treeHeader = document.createElement('div');
		treeHeader.className = 'selector-tree-header';
		treeHeader.innerHTML = `
			<div class="selector-search-row">
				<input type="search" id="selector-quick-search" class="selector-search-input" placeholder="Filter sources or units..." autocomplete="off">
				<button type="button" id="btn-selector-expand-all" class="btn btn-secondary" title="Expand all Sources">Expand All</button>
				<button type="button" id="btn-selector-collapse-all" class="btn btn-ghost" title="Collapse all Sources">Collapse</button>
			</div>
		`;
		leftCol.appendChild(treeHeader);

		this.sourcesListEl = document.createElement('div');
		this.sourcesListEl.className = 'selector-sources-list';
		leftCol.appendChild(this.sourcesListEl);

		// Right Column: Language Unit Details View
		this.detailsPaneEl = document.createElement('div');
		this.detailsPaneEl.className = 'selector-details-pane';

		layout.appendChild(leftCol);
		layout.appendChild(this.detailsPaneEl);
		this.container.appendChild(layout);

		// Bind quick filter & expand/collapse all
		const searchInput = treeHeader.querySelector('#selector-quick-search');
		if (searchInput) {
			searchInput.addEventListener('input', () => {
				this.searchQuery = searchInput.value;
				if (this.searchQuery.trim()) {
					this.getSourceGroups().forEach(g => this.expandedSources.add(g.source));
				}
				this.renderSourcesList();
			});
		}
		treeHeader.querySelector('#btn-selector-expand-all')?.addEventListener('click', () => {
			this.getSourceGroups().forEach(g => this.expandedSources.add(g.source));
			this.renderSourcesList();
		});
		treeHeader.querySelector('#btn-selector-collapse-all')?.addEventListener('click', () => {
			this.expandedSources.clear();
			this.renderSourcesList();
		});

		this.render();
	}

	render() {
		this.renderSourcesList();
		this.renderDetailsPane();
	}

	renderSourcesList() {
		if (!this.sourcesListEl) return;
		this.sourcesListEl.innerHTML = '';

		const groups = this.getSourceGroups();
		if (groups.length === 0) {
			const empty = document.createElement('div');
			empty.className = 'sheet-empty-state';
			empty.textContent = 'No sources or language units match your filter.';
			this.sourcesListEl.appendChild(empty);
			return;
		}

		for (const group of groups) {
			const isExpanded = this.expandedSources.has(group.source);
			const sectionEl = document.createElement('div');
			sectionEl.className = `source-section${isExpanded ? ' is-expanded' : ''}`;
			sectionEl.dataset.source = group.source;

			// Source Header Row
			const headerRow = document.createElement('div');
			headerRow.className = 'source-header-row';

			// Tri-state checkbox ('✓' for all, '~' for partial, '' for none)
			const triBtn = document.createElement('button');
			triBtn.type = 'button';
			triBtn.className = `source-tri-checkbox state-${group.state}`;
			triBtn.dataset.state = group.state;
			triBtn.setAttribute('aria-label', `Toggle all units in ${group.source}`);
			triBtn.title = group.state === 'all'
				? `All ${group.totalCount} units included — Click to exclude all`
				: (group.state === 'partial'
					? `${group.includedCount} of ${group.totalCount} units included (~) — Click to include all`
					: `No units included — Click to include all ${group.totalCount} units`);
			triBtn.textContent = group.state === 'all' ? '✓' : (group.state === 'partial' ? '~' : '');
			triBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				this.toggleSourceInclusion(group.source);
			});
			headerRow.appendChild(triBtn);

			// Expand/Collapse clickable Source label
			const titleArea = document.createElement('div');
			titleArea.className = 'source-title-area';
			titleArea.addEventListener('click', () => {
				this.toggleSourceExpanded(group.source);
			});

			const chevron = document.createElement('span');
			chevron.className = 'source-chevron';
			chevron.textContent = isExpanded ? '▾' : '▸';
			titleArea.appendChild(chevron);

			const nameSpan = document.createElement('span');
			nameSpan.className = 'source-name-text';
			nameSpan.textContent = group.source;
			titleArea.appendChild(nameSpan);

			const countBadge = document.createElement('span');
			countBadge.className = `source-count-badge state-${group.state}`;
			countBadge.textContent = `${group.includedCount} / ${group.totalCount}`;
			titleArea.appendChild(countBadge);

			headerRow.appendChild(titleArea);
			sectionEl.appendChild(headerRow);

			// Expanded Individual Language Units List
			if (isExpanded) {
				const unitsContainer = document.createElement('div');
				unitsContainer.className = 'source-units-list';

				for (const unitId of group.unitIds) {
					const isIncluded = Boolean(this.engine.getCellValue(unitId, 'InSet'));
					const isSelected = this.selectedUnitId === unitId;
					const ko = this.engine.getCellValue(unitId, 'Korean');
					const en = this.engine.getCellValue(unitId, 'English');
					const pos = this.engine.getCellValue(unitId, 'PartofSpeech');

					const unitRow = document.createElement('div');
					unitRow.className = `selector-unit-row${isIncluded ? ' is-included' : ''}${isSelected ? ' is-active-detail' : ''}`;
					unitRow.dataset.unitId = String(unitId);

					const cb = document.createElement('input');
					cb.type = 'checkbox';
					cb.className = 'unit-row-checkbox';
					cb.checked = isIncluded;
					cb.title = `Include/Exclude "${ko}" in Practice Set`;
					cb.addEventListener('click', (e) => e.stopPropagation());
					cb.addEventListener('change', () => {
						this.toggleUnitInclusion(unitId, cb.checked);
					});
					unitRow.appendChild(cb);

					const textBtn = document.createElement('div');
					textBtn.className = 'unit-row-text';
					textBtn.title = 'Click to view Language Unit Details';
					textBtn.innerHTML = `
						<span class="unit-row-ko">${ko}</span>
						<span class="unit-row-en">${en}</span>
						<span class="unit-row-pos">${pos}</span>
					`;
					textBtn.addEventListener('click', () => {
						this.selectUnitForDetails(unitId);
					});
					unitRow.appendChild(textBtn);

					unitsContainer.appendChild(unitRow);
				}

				sectionEl.appendChild(unitsContainer);
			}

			this.sourcesListEl.appendChild(sectionEl);
		}
	}

	renderDetailsPane() {
		if (!this.detailsPaneEl) return;
		this.detailsPaneEl.innerHTML = '';

		if (this.selectedUnitId === null || !this.engine.rawUnits[this.selectedUnitId]) {
			this.detailsPaneEl.innerHTML = `
				<div class="details-empty-state">
					<div class="details-empty-icon">📖</div>
					<h3>Language Unit Details</h3>
					<p>Expand any <strong>Source</strong> on the left and click on a language unit's text to inspect its details, markdown notes, videogame mastery HUD, and generated example sentences.</p>
				</div>
			`;
			return;
		}

		const unitId = this.selectedUnitId;
		const ko = String(this.engine.getCellValue(unitId, 'Korean') ?? '');
		const en = String(this.engine.getCellValue(unitId, 'English') ?? '');
		const pos = String(this.engine.getCellValue(unitId, 'PartofSpeech') ?? '');
		const src = String(this.engine.getCellValue(unitId, 'Source') ?? '');
		const rawConj = this.engine.getCellValue(unitId, 'Conjugation');
		const conjStr = Array.isArray(rawConj) ? rawConj.join(', ') : String(rawConj ?? '');
		const honorific = String(this.engine.getCellValue(unitId, 'HonorificRules') ?? '');
		const notesRaw = String(this.engine.getCellValue(unitId, 'notes') ?? '');
		const isInSet = Boolean(this.engine.getCellValue(unitId, 'InSet'));

		const score = this.engine.getCellValue(unitId, 'RecognitionScore');
		const ltr = this.engine.getCellValue(unitId, 'LongTermRecognition');
		const lastCorrect = this.engine.getCellValue(unitId, 'TimeStampLastCorrect');
		const lastSeen = this.engine.getCellValue(unitId, 'TimeStampLastSeen');
		const hud = formatHudTelemetry(score, ltr, lastCorrect, lastSeen);

		const card = document.createElement('div');
		card.className = 'unit-details-card';

		// ---------------------------------------------------------------------
		// 1. Minimalist Videogame HUD Bar (Single Line) + Action Bar
		// ---------------------------------------------------------------------
		const topBar = document.createElement('div');
		topBar.className = 'unit-details-topbar';

		const hudBar = document.createElement('div');
		hudBar.className = 'unit-hud-bar';
		hudBar.setAttribute('aria-label', 'Language Unit Mastery HUD');

		const scoreBadge = document.createElement('span');
		scoreBadge.className = 'hud-chip hud-chip-score';
		scoreBadge.title = `RecognitionScore: ${Number(score) || 0}`;
		scoreBadge.textContent = hud.scorePill;
		hudBar.appendChild(scoreBadge);

		const ltrBadge = document.createElement('span');
		ltrBadge.className = `hud-chip hud-chip-ltr ${hud.ltrSpec.tierClass}`;
		ltrBadge.title = `LongTermRecognition: ${hud.ltrSpec.label} (${ltr})`;
		ltrBadge.textContent = hud.ltrPill;
		hudBar.appendChild(ltrBadge);

		const corrBadge = document.createElement('span');
		corrBadge.className = 'hud-chip hud-chip-correct';
		corrBadge.title = `TimeStampLastCorrect: ${this.engine.formatCellValue(lastCorrect, this.engine.columnMap.get('TimeStampLastCorrect'))}`;
		corrBadge.textContent = hud.correctPill;
		hudBar.appendChild(corrBadge);

		const seenBtn = document.createElement('button');
		seenBtn.type = 'button';
		seenBtn.className = 'hud-chip hud-chip-seen hud-seen-btn';
		seenBtn.title = `TimeStampLastSeen: ${this.engine.formatCellValue(lastSeen, this.engine.columnMap.get('TimeStampLastSeen'))}\nClick to update TimeStampLastSeen to current time!`;
		seenBtn.textContent = hud.seenPill;
		seenBtn.addEventListener('click', () => {
			this.touchUnitLastSeen(unitId);
		});
		hudBar.appendChild(seenBtn);

		topBar.appendChild(hudBar);

		const topActions = document.createElement('div');
		topActions.className = 'unit-details-actions';

		const inSetLabel = document.createElement('label');
		inSetLabel.className = 'details-inset-toggle';
		const inSetCb = document.createElement('input');
		inSetCb.type = 'checkbox';
		inSetCb.checked = isInSet;
		inSetCb.addEventListener('change', () => {
			this.toggleUnitInclusion(unitId, inSetCb.checked);
		});
		const inSetTxt = document.createElement('span');
		inSetTxt.textContent = isInSet ? 'In Practice Set' : 'Add to Set';
		inSetLabel.appendChild(inSetCb);
		inSetLabel.appendChild(inSetTxt);
		topActions.appendChild(inSetLabel);

		const editBtn = document.createElement('button');
		editBtn.type = 'button';
		editBtn.id = 'btn-details-edit-toggle';
		editBtn.className = `btn ${this.isEditingDetails ? 'btn-ghost' : 'btn-secondary'}`;
		editBtn.textContent = this.isEditingDetails ? 'Cancel Edit' : '✎ Edit';
		editBtn.addEventListener('click', () => {
			this.isEditingDetails = !this.isEditingDetails;
			this.renderDetailsPane();
		});
		topActions.appendChild(editBtn);

		topBar.appendChild(topActions);
		card.appendChild(topBar);

		// ---------------------------------------------------------------------
		// 2. Core Language Unit Details (View Mode vs In-Place Edit Mode)
		// ---------------------------------------------------------------------
		const coreSection = document.createElement('div');
		coreSection.className = 'unit-core-section';

		if (!this.isEditingDetails) {
			// VIEW MODE
			const metaRow = document.createElement('div');
			metaRow.className = 'details-meta-pills';
			metaRow.innerHTML = `
				<span class="details-pill">ID #${unitId}</span>
				<span class="details-pill">${pos}</span>
				<span class="details-pill">${src}</span>
			`;
			coreSection.appendChild(metaRow);

			const koHeading = document.createElement('h2');
			koHeading.className = 'details-korean-heading';
			koHeading.textContent = ko;
			coreSection.appendChild(koHeading);

			const enHeading = document.createElement('div');
			enHeading.className = 'details-english-definition';
			enHeading.textContent = en;
			coreSection.appendChild(enHeading);

			if (conjStr.trim() || honorific.trim()) {
				const rulesBox = document.createElement('div');
				rulesBox.className = 'details-grammar-box';
				let rulesHtml = '';
				if (conjStr.trim()) {
					rulesHtml += `<div><span class="details-field-label">Conjugation / Grammar Rules:</span> <code>${conjStr}</code></div>`;
				}
				if (honorific.trim()) {
					rulesHtml += `<div><span class="details-field-label">Honorifics:</span> ${honorific}</div>`;
				}
				rulesBox.innerHTML = rulesHtml;
				coreSection.appendChild(rulesBox);
			}

			if (notesRaw.trim()) {
				const notesBox = document.createElement('div');
				notesBox.className = 'details-notes-box';
				const notesLabel = document.createElement('div');
				notesLabel.className = 'details-field-label';
				notesLabel.textContent = 'Notes';
				notesBox.appendChild(notesLabel);

				const mdContainer = document.createElement('div');
				mdContainer.className = 'details-markdown-body';
				mdContainer.innerHTML = renderMarkdownWithHtml(notesRaw);
				notesBox.appendChild(mdContainer);
				coreSection.appendChild(notesBox);
			}
		} else {
			// IN-PLACE EDIT MODE (Roughly where each element appears in the view)
			const form = document.createElement('form');
			form.className = 'details-edit-form';
			form.innerHTML = `
				<div class="details-edit-group">
					<label class="details-field-label" for="edit-detail-korean">Korean Text</label>
					<input type="text" id="edit-detail-korean" class="details-edit-input details-edit-ko" required>
				</div>
				<div class="details-edit-group">
					<label class="details-field-label" for="edit-detail-english">English Definition</label>
					<input type="text" id="edit-detail-english" class="details-edit-input details-edit-en" required>
				</div>
				<div class="details-edit-group">
					<label class="details-field-label" for="edit-detail-conj">Conjugation / Grammar Rules</label>
					<input type="text" id="edit-detail-conj" class="details-edit-input" placeholder="e.g. regular_eo, hada, or [{VP_AVst}으/니까 {Clause}]">
				</div>
				<div class="details-edit-group">
					<label class="details-field-label" for="edit-detail-notes">Notes (Markdown &amp; Inline HTML)</label>
					<textarea id="edit-detail-notes" class="details-edit-textarea" rows="6" placeholder="Write Markdown notes, tiered lists (- item /   - subitem), or inline HTML..."></textarea>
				</div>
				<div class="details-edit-actions">
					<button type="submit" id="btn-save-details" class="btn btn-primary">✓ Save Changes</button>
					<button type="button" id="btn-cancel-details" class="btn btn-ghost">Cancel</button>
				</div>
			`;

			const koInput = form.querySelector('#edit-detail-korean');
			const enInput = form.querySelector('#edit-detail-english');
			const conjInput = form.querySelector('#edit-detail-conj');
			const notesInput = form.querySelector('#edit-detail-notes');

			koInput.value = ko;
			enInput.value = en;
			conjInput.value = Array.isArray(rawConj) ? JSON.stringify(rawConj) : conjStr;
			notesInput.value = notesRaw; // Pure-text version of the markdown!

			form.addEventListener('submit', async (e) => {
				e.preventDefault();
				await this.saveEditedDetails(unitId, {
					korean: koInput.value.trim(),
					english: enInput.value.trim(),
					conjugation: conjInput.value.trim(),
					notes: notesInput.value
				});
			});
			form.querySelector('#btn-cancel-details').addEventListener('click', () => {
				this.isEditingDetails = false;
				this.renderDetailsPane();
			});

			coreSection.appendChild(form);
		}

		card.appendChild(coreSection);

		// ---------------------------------------------------------------------
		// 3. Generated Sentences / Phrases (3 items + Regenerate Button)
		// ---------------------------------------------------------------------
		const sentencesSection = document.createElement('div');
		sentencesSection.className = 'details-sentences-section';

		const sentHeader = document.createElement('div');
		sentHeader.className = 'details-sentences-header';
		sentHeader.innerHTML = `<span class="details-field-label">Generated Example Sentences (3)</span>`;

		const regenBtn = document.createElement('button');
		regenBtn.type = 'button';
		regenBtn.id = 'btn-regenerate-sentences';
		regenBtn.className = 'btn btn-secondary';
		regenBtn.textContent = '↻ Regenerate';
		regenBtn.addEventListener('click', () => {
			this.regenerateSentences();
			this.renderDetailsPane();
		});
		sentHeader.appendChild(regenBtn);
		sentencesSection.appendChild(sentHeader);

		if (this.generatedSentences.length === 0) {
			this.regenerateSentences();
		}

		const sentList = document.createElement('ol');
		sentList.className = 'details-sentences-list';
		for (const item of this.generatedSentences) {
			const li = document.createElement('li');
			li.className = 'details-sentence-item';
			li.innerHTML = `
				<div class="sentence-item-ko">${item.ko}</div>
				<div class="sentence-item-en">${item.en}</div>
			`;
			sentList.appendChild(li);
		}
		sentencesSection.appendChild(sentList);
		card.appendChild(sentencesSection);

		this.detailsPaneEl.appendChild(card);
	}
}

if (typeof window !== 'undefined') {
	window.renderMarkdownWithHtml = renderMarkdownWithHtml;
	window.formatPithyTime = formatPithyTime;
	window.formatHudTelemetry = formatHudTelemetry;
	window.generateSentencesForUnit = generateSentencesForUnit;
	window.UnitSelectorView = UnitSelectorView;
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		renderMarkdownWithHtml,
		formatPithyTime,
		formatHudTelemetry,
		generateSentencesForUnit,
		UnitSelectorView
	};
}
