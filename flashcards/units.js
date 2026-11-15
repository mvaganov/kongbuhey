/**
 * flashcards/units.js - Units mode: a phone-sized port of the webapp's Unit Selector & Details.
 *   List page: search, filter (all / in deck / not in deck), collapsible sources with tri-state
 *   "whole source in deck" toggles, one row per unit with an in-deck tick and a score dot.
 *   Details page: definition, rules, tags, study stats, example sentences with a morpheme-by-morpheme
 *   breakdown (every part links to its own unit), notes, previous/next, add/remove, study now.
 * No inner scroll containers: the page itself scrolls.
 */
(function() {
'use strict';

const R = window.FlashcardRender;
const { escapeHtml } = R;
const C = window.DATA_SCHEMA;
const SEARCH_LIMIT = 300;
const FILTERS = [['all', 'All units'], ['deck', 'In deck'], ['out', 'Not in deck']];

class UnitsView {
	constructor(app) {
		this.app = app;
		this.screen = 'list';
		this.detailId = null;
		this.expanded = new Set();
		this.query = '';
		this.filter = 'all';
		this.sentences = [];
		this.message = '';
		this.bySource = new Map();
		for (const u of app.units.values()) {
			const s = u[C.Source];
			if (!this.bySource.has(s)) this.bySource.set(s, []);
			this.bySource.get(s).push(u[C.Id]);
		}
	}

	show() {
		this.app.mode = 'units';
		this.screen = 'list';
		this.app.editingNotes = false;
		this.app.render();
	}

	openDetail(id) {
		if (!this.app.units.has(id)) return;
		this.app.mode = 'units';
		this.app.editingNotes = false;
		this.screen = 'detail';
		this.detailId = id;
		this.generate();
		this.app.render();
		scrollToTop();
	}

	generate() {
		const g = this.app.generateFor(this.detailId);
		this.sentences = g.sentences;
		this.message = g.message;
	}

	setQuery(q) { this.query = q; this.renderList(); }
	setFilter(f) { this.filter = f; this.renderList(); }

	renderList() {
		const el = this.app.root.querySelector('#ulist');
		if (el) el.innerHTML = this.listHtml();
	}

	matches(id, q) {
		const u = this.app.units.get(id);
		return String(u[C.Korean]).toLowerCase().includes(q) || String(u[C.English]).toLowerCase().includes(q) || String(id) === q;
	}

	/** Sources with the units that pass the search and filter. */
	groups(members) {
		const q = this.query.trim().toLowerCase();
		const out = [];
		for (const [source, ids] of this.bySource) {
			const srcHit = !q || String(source).toLowerCase().includes(q);
			const shown = ids.filter(id => (srcHit || this.matches(id, q)) && (this.filter === 'all' || (this.filter === 'deck') === members.has(id)));
			if (!shown.length) continue;
			const inCount = ids.reduce((n, id) => n + (members.has(id) ? 1 : 0), 0);
			out.push({ source, ids, shown, inCount });
		}
		return out;
	}

	/** Unit ids in list order, for previous/next on the details page. */
	navOrder() {
		return this.groups(new Set(this.app.deck.order)).flatMap(g => g.shown);
	}

	html() {
		return this.screen === 'detail' && this.app.units.has(this.detailId) ? this.detailHtml() : this.listPageHtml();
	}

	listPageHtml() {
		return `<div class="units">
			<div class="u-tools">
				<input type="search" data-u-search placeholder="Search Korean, English or source" value="${escapeHtml(this.query)}" autocomplete="off" aria-label="Search units">
				<select data-u-filter aria-label="Filter">${FILTERS.map(([v, l]) => `<option value="${v}" ${this.filter === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
			</div>
			<div class="btn-row"><button type="button" class="btn small" data-act="u-expand-all">Expand all</button>
				<button type="button" class="btn small" data-act="u-collapse-all">Collapse all</button></div>
			<div id="ulist">${this.listHtml()}</div>
		</div>`;
	}

	listHtml() {
		const members = new Set(this.app.deck.order);
		const groups = this.groups(members);
		if (!groups.length) return '<p class="muted">No units match.</p>';
		const searching = Boolean(this.query.trim());
		let rows = 0;
		const html = groups.map(g => {
			const state = g.inCount === 0 ? 'none' : (g.inCount === g.ids.length ? 'all' : 'partial');
			const open = searching || this.expanded.has(g.source);
			const src = escapeHtml(g.source);
			let body = '';
			if (open) {
				const list = searching ? g.shown.slice(0, Math.max(0, SEARCH_LIMIT - rows)) : g.shown;
				rows += list.length;
				body = `<div class="u-rows">${list.map(id => this.rowHtml(id, members.has(id))).join('')}</div>`;
			}
			return `<section class="u-src${open ? ' open' : ''}">
				<div class="u-src-head">
					<button type="button" class="tri tri-${state}" data-act="u-src-toggle" data-src="${src}" aria-label="Add or remove all of ${src}">${state === 'all' ? '✓' : (state === 'partial' ? '~' : '')}</button>
					<button type="button" class="u-src-name" data-act="u-src-expand" data-src="${src}"><span class="chev">${open ? '▾' : '▸'}</span>${src}<span class="muted">${g.inCount}/${g.ids.length}</span></button>
				</div>${body}</section>`;
		}).join('');
		return html + (searching && rows >= SEARCH_LIMIT ? `<p class="muted">Showing the first ${SEARCH_LIMIT} matches.</p>` : '');
	}

	rowHtml(id, inDeck) {
		const u = this.app.units.get(id);
		return `<div class="u-row${inDeck ? ' in' : ''}">
			<button type="button" class="tick" data-act="u-toggle" data-id="${id}" aria-pressed="${inDeck}" aria-label="In deck">${inDeck ? '✓' : ''}</button>
			<button type="button" class="u-row-main" data-act="u-open" data-id="${id}"><span class="u-ko">${escapeHtml(u[C.Korean])}</span><span class="u-en">${escapeHtml(u[C.English])}</span></button>
			<span class="dot" style="background:${window.scoreColor(this.app.deck.scoreOf(id))}"></span>
		</div>`;
	}

	detailHtml() {
		const app = this.app, id = this.detailId, u = app.units.get(id);
		const inDeck = app.deck.has(id), score = app.deck.scoreOf(id), st = app.stat(id);
		const order = this.navOrder(), i = order.indexOf(id);
		const prev = i > 0 ? order[i - 1] : null, next = (i >= 0 && i < order.length - 1) ? order[i + 1] : null;
		const conj = Array.isArray(u[C.Conjugation]) ? u[C.Conjugation].join(', ') : String(u[C.Conjugation] || '');
		const hon = String(u[C.HonorificRules] || '');
		const tags = Array.from(u[C.SemanticTags] || []);
		const navBtn = (to, label, text) => `<button type="button" class="icon-btn" data-act="u-open" data-id="${to == null ? '' : to}" ${to == null ? 'disabled' : ''} aria-label="${label}">${text}</button>`;
		return `<div class="u-detail">
			<div class="u-nav">
				<button type="button" class="btn small" data-act="u-back">◀ All units</button>
				<span class="muted">${i >= 0 ? `${i + 1} / ${order.length}` : ''}</span>
				<span>${navBtn(prev, 'Previous unit', '‹')} ${navBtn(next, 'Next unit', '›')}</span>
			</div>
			<div class="pills"><span class="pill">#${id}</span><span class="pill">${escapeHtml(u[C.PartofSpeech])}</span><span class="pill">${escapeHtml(u[C.Source])}</span>${u[C.FormalityLevel] ? `<span class="pill">${escapeHtml(u[C.FormalityLevel])}</span>` : ''}</div>
			<div class="unit-row"><h1 class="unit-main">${escapeHtml(u[C.Korean])}</h1>${app.speakBtn('speak-unit')}</div>
			<div class="unit-en">${escapeHtml(u[C.English])}</div>
			${u[C.Disambiguation] ? `<div class="gloss">${escapeHtml(u[C.Disambiguation])}</div>` : ''}
			${conj.trim() || hon.trim() ? `<div class="rules">${conj.trim() ? `<div><span class="label">Conjugation / grammar</span> <code>${escapeHtml(conj)}</code></div>` : ''}${hon.trim() ? `<div><span class="label">Honorifics</span> ${escapeHtml(hon)}</div>` : ''}</div>` : ''}
			${tags.length ? `<div class="tags">${tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
			<div class="hud"><span class="chip" style="background:${window.scoreColor(score)}">${score > 0 ? '+' : ''}${score}</span>
				<span title="Last seen">👁 ${R.ago(st.seen)}</span><span title="Last correct">🎯 ${R.ago(st.correct)}</span></div>
			<div class="btn-row">
				<button type="button" class="btn${inDeck ? '' : ' primary'}" data-act="u-toggle" data-id="${id}">${inDeck ? '✓ In deck · remove' : '+ Add to deck'}</button>
				<button type="button" class="btn" data-act="u-study" data-id="${id}">Study now</button>
			</div>
			<h2 class="section">Example sentences</h2>
			${app.sentenceListHtml({ id, sentences: this.sentences, message: this.message, english: true, breakdown: true })}
			<button type="button" class="btn" data-act="regen">↻ New examples</button>
			${app.notesHtml(id)}
		</div>`;
	}

	act(name, el) {
		const app = this.app, id = Number(el.dataset.id), src = el.dataset.src;
		switch (name) {
			case 'u-open': if (el.dataset.id !== '') this.openDetail(id); break;
			case 'u-back': {
				this.screen = 'list';
				app.render();
				const row = app.root.querySelector(`[data-act="u-open"][data-id="${this.detailId}"]`);
				if (row && row.scrollIntoView) row.scrollIntoView({ block: 'center' });
				break;
			}
			case 'u-toggle':
				if (app.deck.has(id)) app.removeFromDeck(id); else app.addToDeck(id);
				app.render();
				break;
			case 'u-src-toggle': {
				const ids = this.bySource.get(src) || [];
				const allIn = ids.every(i => app.deck.has(i));
				for (const i of ids) { if (allIn) app.deck.remove(i); else app.deck.add(i); }
				app.persist();
				app.render();
				break;
			}
			case 'u-src-expand':
				if (this.expanded.has(src)) this.expanded.delete(src); else this.expanded.add(src);
				this.renderList();
				break;
			case 'u-expand-all': for (const s of this.bySource.keys()) this.expanded.add(s); this.renderList(); break;
			case 'u-collapse-all': this.expanded.clear(); this.renderList(); break;
			case 'u-study':
				app.addToDeck(id);
				app.deck.toFront(id);
				app.persist();
				app.showCard();
				break;
			default: break;
		}
	}
}

function scrollToTop() {
	try { if (!/jsdom/i.test(navigator.userAgent)) window.scrollTo(0, 0); } catch (_) { /* not a real browser */ }
}

window.UnitsView = UnitsView;
})();
