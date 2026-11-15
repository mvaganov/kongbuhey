/**
 * shared/markdown.js - tiny Markdown + inline-HTML renderer (tiered lists, code, headings).
 * Used by the webapp Unit Details view and the flashcard app. Browser global or CommonJS.
 */
(function() {
function formatInlineMarkdown(text) {
	if (!text) return '';
	let out = String(text).replace(/<\s*\/?\s*script[^>]*>/gi, '');
	const codeTokens = [];
	out = out.replace(/`([^`]+)`/g, (_, code) => {
		const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		return `\u0000CODE_${codeTokens.push(`<code>${escaped}</code>`) - 1}\u0000`;
	});
	out = out
		.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
		.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
		.replace(/__([^_]+)__/g, '<strong>$1</strong>')
		.replace(/~~([^~]+)~~/g, '<del>$1</del>')
		.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
		.replace(/(^|[^_])_([^_\n]+)_(?!_)/g, '$1<em>$2</em>');
	return out.replace(/\u0000CODE_(\d+)\u0000/g, (_, idx) => codeTokens[Number(idx)] || '');
}

function renderMarkdownWithHtml(markdownStr) {
	if (!markdownStr || !String(markdownStr).trim()) return '';
	const lines = String(markdownStr).replace(/\r\n/g, '\n').split('\n');
	const htmlParts = [], listStack = [];
	let inCodeBlock = false, codeBuffer = [];

	const closeListsTo = (targetIndent) => {
		while (listStack.length > 0 && listStack[listStack.length - 1].indent > targetIndent) {
			htmlParts.push(`</li></${listStack.pop().type}>`);
		}
	};
	const closeAllLists = () => closeListsTo(-1);

	for (let i = 0; i < lines.length; i++) {
		const rawLine = lines[i];
		if (rawLine.trim().startsWith('```')) {
			closeAllLists();
			if (!inCodeBlock) { inCodeBlock = true; codeBuffer = []; }
			else {
				inCodeBlock = false;
				const esc = codeBuffer.join('\n').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
				htmlParts.push(`<pre><code>${esc}</code></pre>`);
			}
			continue;
		}
		if (inCodeBlock) { codeBuffer.push(rawLine); continue; }

		const listMatch = rawLine.match(/^([ \t]*)(?:([-*+])|(\d+|[a-zA-Z])[.)])\s+(.*)$/);
		if (listMatch) {
			const indent = listMatch[1].replace(/\t/g, '  ').length;
			const listType = listMatch[2] ? 'ul' : 'ol';
			const itemContent = formatInlineMarkdown(listMatch[4]);
			const top = listStack[listStack.length - 1];

			if (!top || indent > top.indent) {
				listStack.push({ type: listType, indent });
				htmlParts.push(`<${listType}><li>${itemContent}`);
			} else if (indent === top.indent) {
				if (top.type !== listType) {
					htmlParts.push(`</li></${listStack.pop().type}>`);
					listStack.push({ type: listType, indent });
					htmlParts.push(`<${listType}><li>${itemContent}`);
				} else {
					htmlParts.push(`</li><li>${itemContent}`);
				}
			} else {
				closeListsTo(indent);
				const curTop = listStack[listStack.length - 1];
				if (!curTop || curTop.indent < indent) {
					listStack.push({ type: listType, indent });
					htmlParts.push(`<${listType}><li>${itemContent}`);
				} else if (curTop.type !== listType) {
					htmlParts.push(`</li></${listStack.pop().type}>`);
					listStack.push({ type: listType, indent });
					htmlParts.push(`<${listType}><li>${itemContent}`);
				} else {
					htmlParts.push(`</li><li>${itemContent}`);
				}
			}
			continue;
		}

		closeAllLists();
		const trimmed = rawLine.trim();
		if (!trimmed) continue;

		const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
		if (headingMatch) {
			htmlParts.push(`<h${headingMatch[1].length}>${formatInlineMarkdown(headingMatch[2])}</h${headingMatch[1].length}>`);
			continue;
		}
		if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) { htmlParts.push('<hr>'); continue; }
		if (trimmed.startsWith('>')) {
			htmlParts.push(`<blockquote>${formatInlineMarkdown(trimmed.replace(/^>\s?/, ''))}</blockquote>`);
			continue;
		}
		htmlParts.push(`<p>${formatInlineMarkdown(rawLine)}</p>`);
	}
	closeAllLists();
	if (inCodeBlock && codeBuffer.length > 0) {
		const esc = codeBuffer.join('\n').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		htmlParts.push(`<pre><code>${esc}</code></pre>`);
	}
	return htmlParts.join('\n');
}

if (typeof window !== 'undefined') { window.renderMarkdownWithHtml = renderMarkdownWithHtml; window.formatInlineMarkdown = formatInlineMarkdown; }
if (typeof module !== 'undefined' && module.exports) { module.exports = { renderMarkdownWithHtml, formatInlineMarkdown }; }
})();
