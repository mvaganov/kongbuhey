/**
 * flashcards/app.js - mobile flashcard app.
 *   Cards mode: front/back cycle, self-scoring, notes, flags, clickable example units.
 *   Units mode (units.js): browse sources and unit details, choose what is in the deck.
 * Both share the animated deck visualization at the top.
 * Pure deck rules: deck.js. String helpers: render.js. Sentence generation: shared/sentence_adapter.js.
 * State lives in localStorage under "kb.fc.v1.*" (independent of the webapp's IndexedDB).
 */
(function() {
'use strict';

const { Deck, SCORE_BUTTONS, scoreColor, gridLayout } = window;
const R = window.FlashcardRender;
const { escapeHtml } = R;
const C = window.DATA_SCHEMA;
const LS_PREFIX = 'kb.fc.v1.';
const GAP = 1;
const VIZ_MAX_HEIGHT = 64; // px; cells shrink (down to 2px) so the whole deck fits without a scrollbar
const ANIM_MS = 250;
const SPEAK_MODES = [['none', "Don't speak"], ['front', 'When front is shown'], ['back', 'When back is shown'], ['both', 'When front or back are shown']];
const UNIT_CLICK_MODES = [['show', 'Show card now'], ['queue', 'Queue card next'], ['none', 'Do nothing']];
const DEFAULT_OPTS = { reverse: false, speak: 'none', count: 3, onlyFromSet: false, unitClick: 'queue' };
const nowSec = () => Math.floor(Date.now() / 1000);

const store = {
	load(key, fallback) {
		try { const raw = window.localStorage.getItem(LS_PREFIX + key); return raw == null ? fallback : JSON.parse(raw); } catch (_) { return fallback; }
	},
	save(key, value) {
		try { window.localStorage.setItem(LS_PREFIX + key, JSON.stringify(value)); return true; } catch (_) { return false; }
	}
};

class FlashcardApp {
	constructor(root) {
		this.root = root;
		this.units = new Map(window.KR_EN_languageUnits.map(u => [u[C.Id], u]));
		const savedOpts = store.load('opts', {});
		delete savedOpts.sources; // replaced by Units mode
		delete savedOpts.vizExpanded;
		this.opts = { ...DEFAULT_OPTS, ...savedOpts };
		this.notes = store.load('notes', {});
		this.flags = store.load('flags', []);
		this.stats = store.load('stats', {}); // id -> { seen, correct } unix seconds
		this.deck = this.loadDeck();
		this.mode = 'cards';
		this.side = 'front';
		this.shownId = null;
		this.editingNotes = false;
		this.sentences = [];
		this.sentenceMsg = '';
		this.vizCur = null;
		this.vizAnim = 0;
		this.unitsView = new window.UnitsView(this);
		this.bind();
		this.showCard();
	}

	// ---------- state ----------
	loadDeck() {
		const saved = store.load('deck', null);
		if (saved && Array.isArray(saved.order)) {
			const deck = Deck.fromJSON(saved);
			deck.order = deck.order.filter(id => this.units.has(id));
			return deck;
		}
		return new Deck(Array.from(this.units.keys()));
	}

	persist() { store.save('deck', this.deck.toJSON()); }
	persistOpts() { store.save('opts', this.opts); }
	get unit() { return this.deck.frontId == null ? null : this.units.get(this.deck.frontId); }
	stat(id) { return this.stats[id] || {}; }

	/** "Seen": shown as a flashcard, or used in an example sentence that was spoken. */
	markSeen(ids) {
		const t = nowSec();
		for (const id of ids) if (this.units.has(id)) this.stats[id] = { ...this.stats[id], seen: t };
		store.save('stats', this.stats);
	}

	/** "Correct": scored with a positive button on the back of its card. */
	markCorrect(id) {
		this.stats[id] = { ...this.stats[id], correct: nowSec() };
		store.save('stats', this.stats);
	}

	/** The unit and example sentences currently on screen (card, or the Units details page). */
	context() {
		if (this.mode === 'units') return { id: this.unitsView.detailId, sentences: this.unitsView.sentences };
		return { id: this.deck.frontId, sentences: this.sentences };
	}

	showCard() {
		this.mode = 'cards';
		this.side = 'front';
		this.editingNotes = false;
		this.shownId = this.deck.frontId;
		if (this.shownId != null) this.markSeen([this.shownId]);
		const g = this.generateFor(this.shownId);
		this.sentences = g.sentences;
		this.sentenceMsg = g.message;
		this.render();
		this.maybeSpeak('front');
	}

	showCards() {
		if (this.deck.frontId !== this.shownId) { this.showCard(); return; }
		this.mode = 'cards';
		this.render();
	}

	generateFor(id) {
		if (id == null || !this.units.has(id)) return { sentences: [], message: '' };
		try {
			const options = { seedOffset: Math.floor(Math.random() * 997) };
			if (this.opts.onlyFromSet) { options.onlyFromSet = true; options.allowedUnitIds = new Set(this.deck.order); }
			const list = window.generateSentencesForUnit(id, this.opts.count, options);
			const sentences = Array.from(list);
			return { sentences, message: sentences.length ? '' : (list.message || 'No example sentences are available for this unit yet.') };
		} catch (_) {
			return { sentences: [], message: 'Could not generate sentences for this unit.' };
		}
	}

	regenerate() {
		if (this.mode === 'units') this.unitsView.generate();
		else { const g = this.generateFor(this.deck.frontId); this.sentences = g.sentences; this.sentenceMsg = g.message; }
		this.render();
	}

	maybeSpeak(side) {
		const u = this.unit;
		const m = this.opts.speak;
		if (!u || m === 'none' || (m !== 'both' && m !== side)) return;
		if (side === 'front' && this.opts.reverse) return; // would give away the answer
		window.speakKorean(u[C.Korean]);
	}

	flip() { this.side = 'back'; this.render(); this.maybeSpeak('back'); }

	score(value) {
		const id = this.deck.frontId;
		if (!this.deck.score(value)) return;
		if (value > 0) this.markCorrect(id);
		this.persist();
		this.showCard();
	}

	undo() {
		if (this.deck.undo() != null) { this.persist(); this.showCard(); }
	}

	// ---------- deck membership ----------
	addToDeck(id) {
		if (!this.units.has(id) || !this.deck.add(id)) return false;
		this.persist();
		return true;
	}

	removeFromDeck(id) {
		if (!this.deck.remove(id)) return false;
		this.persist();
		return true;
	}

	/** A unit link inside an example sentence was tapped (Cards mode). */
	clickExampleUnit(id) {
		const mode = this.opts.unitClick;
		if (mode === 'none' || !this.units.has(id)) return;
		const added = this.addToDeck(id);
		const ko = this.units.get(id)[C.Korean];
		if (mode === 'show') {
			this.deck.toFront(id);
			this.persist();
			this.showCard();
			this.toast(added ? `${ko} added to the deck` : ko);
			return;
		}
		if (id !== this.deck.frontId) this.deck.moveTo(id, 1);
		this.persist();
		this.render();
		this.toast(`${ko} is next${added ? ' (added to the deck)' : ''}`);
	}

	sortDeck(field, label) {
		this.deck.sortBy(id => this.stat(id)[field] || 0);
		this.persist();
		this.closeModal();
		this.showCard();
		this.toast(label);
	}

	// ---------- flags & speech ----------
	isFlagged(ko) { return this.flags.some(f => f.ko === ko); }

	toggleFlag(i) {
		const { id, sentences } = this.context();
		const item = sentences[i];
		if (!item || id == null) return false;
		const was = this.isFlagged(item.ko);
		if (was) this.flags = this.flags.filter(f => f.ko !== item.ko);
		else this.flags.push({ ...window.buildFlagEntry(item, id, 'flashcards'), flaggedAt: new Date().toISOString() });
		store.save('flags', this.flags);
		return !was;
	}

	flagPayload() {
		return { app: 'kongbuhey', kind: 'flagged-sentences', version: 1, exportedAt: new Date().toISOString(), items: this.flags };
	}

	speakSentence(i, el) {
		const s = this.context().sentences[i];
		if (!s) return;
		window.speakKorean(s.ko, el);
		this.markSeen(R.unitIdsOf(s));
	}

	toast(text) {
		let el = this.root.querySelector('#toast');
		if (!el) {
			el = document.createElement('div');
			el.id = 'toast';
			el.setAttribute('role', 'status');
			this.root.appendChild(el);
		}
		el.textContent = text;
		el.classList.add('show');
		clearTimeout(this.toastTimer);
		this.toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
	}

	// ---------- rendering ----------
	speakBtn(act, extra = '') {
		return `<button type="button" class="icon-btn speak" data-act="${act}" ${extra} aria-label="Speak">🔊</button>`;
	}

	/** Example sentence list. opts: { id, sentences, message, english, hideKo, breakdown } */
	sentenceListHtml(o) {
		if (!o.sentences.length) return `<p class="muted">${escapeHtml(o.message)}</p>`;
		return '<ul class="sentences">' + o.sentences.map((s, i) => {
			const flagged = this.isFlagged(s.ko);
			const ko = o.hideKo ? '' : `<div class="s-ko">${R.sentenceHtml(s, o.id)}</div>`;
			const en = (o.english || o.hideKo)
				? `<div class="s-en-lit">${escapeHtml(s.enLiteral)}</div><div class="s-en">${escapeHtml(s.enNatural || s.en)}</div>` : '';
			const parts = o.breakdown && !o.hideKo ? `<div class="s-parts">${R.breakdownHtml(s, o.id)}</div>` : '';
			return `<li class="sentence">
				<div class="s-body">${ko}${en}${parts}</div>
				<div class="s-actions">
					${o.hideKo ? '' : this.speakBtn('speak-sent', `data-i="${i}"`)}
					<button type="button" class="icon-btn flag${flagged ? ' flagged' : ''}" data-act="flag" data-i="${i}" aria-label="Flag bad sentence" title="Flag bad sentence">⚑</button>
				</div></li>`;
		}).join('') + '</ul>';
	}

	notesHtml(id) {
		const notes = this.notes[id] || '';
		const body = this.editingNotes
			? `<textarea class="notes-edit" data-notes rows="6" placeholder="Markdown notes…">${escapeHtml(notes)}</textarea>`
			: (notes.trim() ? `<div class="notes-md">${window.renderMarkdownWithHtml(notes)}</div>` : '<p class="muted">No notes yet.</p>');
		return `<section class="notes"><div class="notes-head"><h2>Notes</h2>
			<button type="button" class="btn small" data-act="notes-toggle">${this.editingNotes ? 'Done' : 'Edit'}</button></div>${body}</section>`;
	}

	topbarHtml() {
		if (this.mode === 'units') {
			return `<header class="topbar">
				<button type="button" class="icon-btn" data-act="mode-cards">🃏 Cards</button>
				<div class="progress">${this.deck.size} cards in deck</div>
				<button type="button" class="icon-btn" data-act="options" aria-label="Options">☰</button>
			</header>`;
		}
		const u = this.unit;
		const sc = u ? this.deck.scoreOf(u[C.Id]) : 0;
		return `<header class="topbar">
			<button type="button" class="icon-btn" data-act="undo" aria-label="Back (undo last score)" ${this.deck.history.length ? '' : 'disabled'}>↩︎ Back</button>
			<div class="progress"><span class="chip" style="background:${scoreColor(sc)}">${sc > 0 ? '+' : ''}${sc}</span> ${this.deck.size}</div>
			<button type="button" class="icon-btn" data-act="mode-units">📚 Units</button>
			<button type="button" class="icon-btn" data-act="options" aria-label="Options">☰</button>
		</header>`;
	}

	frontHtml(u) {
		const rev = this.opts.reverse;
		const main = rev
			? `<h1 class="unit-main english">${escapeHtml(u[C.English])}</h1>${u[C.Disambiguation] ? `<div class="gloss">${escapeHtml(u[C.Disambiguation])}</div>` : ''}`
			: `<div class="unit-row"><h1 class="unit-main">${escapeHtml(u[C.Korean])}</h1>${this.speakBtn('speak-unit')}</div>`;
		const list = this.sentenceListHtml({ id: u[C.Id], sentences: this.sentences, message: this.sentenceMsg, hideKo: rev });
		return `<div class="face front">${main}${list}
			<button type="button" class="btn" data-act="regen">↻ New examples</button>
			<p class="hint">Tap empty space to reveal the answer</p></div>`;
	}

	backHtml(u) {
		const id = u[C.Id];
		return `<div class="face back">
			<div class="unit-row"><h1 class="unit-main">${escapeHtml(u[C.Korean])}</h1>${this.speakBtn('speak-unit')}
				<button type="button" class="icon-btn remove" data-act="remove-unit" title="Remove this card from the deck">✕ Remove</button></div>
			<div class="unit-en">${escapeHtml(u[C.English])}</div>
			<div class="gloss">${escapeHtml(u[C.PartofSpeech] || '')}${u[C.Disambiguation] ? ' · ' + escapeHtml(u[C.Disambiguation]) : ''}</div>
			${this.sentenceListHtml({ id, sentences: this.sentences, message: this.sentenceMsg, english: true })}
			<button type="button" class="btn" data-act="regen">↻ New examples</button>
			${this.notesHtml(id)}
		</div>
		<nav class="scorebar">${SCORE_BUTTONS.map(b => `<button type="button" class="score" data-act="score" data-v="${b.value}" style="--c:${scoreColor(b.value * 3)}"><b>${b.value > 0 ? '+' : ''}${b.value}</b>${escapeHtml(b.label)}</button>`).join('')}</nav>`;
	}

	render() {
		const card = this.root.querySelector('#card');
		this.root.querySelector('#top').innerHTML = this.topbarHtml();
		let body;
		if (this.mode === 'units') body = this.unitsView.html();
		else if (!this.unit) body = '<div class="face"><p class="muted">The deck is empty.</p><button type="button" class="btn" data-act="mode-units">📚 Choose units</button></div>';
		else body = this.side === 'front' ? this.frontHtml(this.unit) : this.backHtml(this.unit);
		card.innerHTML = body;
		card.classList.toggle('has-scorebar', this.mode === 'cards' && Boolean(this.unit) && this.side === 'back');
		this.drawViz();
	}

	// ---------- deck visualization (animated) ----------
	drawViz() {
		const wrap = this.root.querySelector('#vizwrap'), canvas = this.root.querySelector('#viz');
		const width = Math.max(120, (wrap.clientWidth || 348) - 8);
		const layout = gridLayout(this.deck.size, width, VIZ_MAX_HEIGHT, 2, 14, GAP);
		const step = layout.cell + GAP;
		const target = new Map(this.deck.order.map((id, i) => [id, { x: (i % layout.cols) * step, y: Math.floor(i / layout.cols) * step }]));
		this.vizLayout = layout;
		const dpr = window.devicePixelRatio || 1;
		canvas.style.width = width + 'px';
		canvas.style.height = layout.height + 'px';
		canvas.width = Math.round(width * dpr);
		canvas.height = Math.round(layout.height * dpr);
		const ctx = canvas.getContext && canvas.getContext('2d');
		if (!ctx) { this.vizCur = target; return; }
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

		// Each card slides from where it was last drawn to its new slot; the cards that move furthest draw on top.
		const from = this.vizCur || target;
		const moves = this.deck.order.map(id => {
			const b = target.get(id), a = from.get(id) || b;
			return { id, a, b, d: Math.abs(a.x - b.x) + Math.abs(a.y - b.y) };
		}).sort((p, q) => p.d - q.d);
		const frontId = this.deck.frontId, cell = layout.cell;
		const paint = e => {
			ctx.clearRect(0, 0, width, layout.height);
			const cur = new Map();
			for (const m of moves) {
				const x = m.a.x + (m.b.x - m.a.x) * e, y = m.a.y + (m.b.y - m.a.y) * e;
				cur.set(m.id, { x, y });
				ctx.fillStyle = scoreColor(this.deck.scoreOf(m.id));
				ctx.fillRect(x, y, cell, cell);
			}
			const f = cur.get(frontId);
			if (f) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.strokeRect(f.x - 0.5, f.y - 0.5, cell + 1, cell + 1); }
			this.vizCur = cur;
		};
		if (this.vizAnim && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this.vizAnim);
		const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduce || !moves.some(m => m.d > 0) || typeof requestAnimationFrame !== 'function') { paint(1); return; }
		const start = performance.now();
		const tick = t => {
			const k = Math.min(1, (t - start) / ANIM_MS);
			paint(1 - Math.pow(1 - k, 3)); // ease-out
			this.vizAnim = k < 1 ? requestAnimationFrame(tick) : 0;
		};
		paint(0);
		this.vizAnim = requestAnimationFrame(tick);
	}

	vizPick(ev) {
		const canvas = this.root.querySelector('#viz'), rect = canvas.getBoundingClientRect(), l = this.vizLayout;
		if (!l) return;
		const step = l.cell + GAP;
		const col = Math.floor((ev.clientX - rect.left) / step), row = Math.floor((ev.clientY - rect.top) / step);
		const idx = row * l.cols + col;
		if (col < 0 || col >= l.cols || row < 0 || idx < 0 || idx >= this.deck.size) return;
		const id = this.deck.order[idx];
		if (this.mode === 'units') { this.unitsView.openDetail(id); return; }
		this.deck.toFront(id);
		this.persist();
		this.showCard();
	}

	// ---------- modals ----------
	openModal(title, html) {
		const m = this.root.querySelector('#modal');
		m.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true"><header><h2>${escapeHtml(title)}</h2>
			<button type="button" class="icon-btn" data-act="close-modal" aria-label="Close">✕</button></header><div class="modal-body">${html}</div></div>`;
		m.classList.remove('hidden');
	}

	closeModal() { this.root.querySelector('#modal').classList.add('hidden'); }

	optionsHtml() {
		const o = this.opts;
		const select = (key, list, cur) => `<select data-opt="${key}">${list.map(([v, l]) => `<option value="${v}" ${String(cur) === String(v) ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
		return `
			<label class="row"><input type="checkbox" data-opt="reverse" ${o.reverse ? 'checked' : ''}> Test the Korean: show English on the front</label>
			<label class="row">Speak the Korean unit ${select('speak', SPEAK_MODES, o.speak)}</label>
			<label class="row">When clicking on example language ${select('unitClick', UNIT_CLICK_MODES, o.unitClick)}</label>
			<label class="row">Example sentences per card ${select('count', [1, 2, 3, 4, 5, 6].map(n => [n, n]), o.count)}</label>
			<label class="row"><input type="checkbox" data-opt="onlyFromSet" ${o.onlyFromSet ? 'checked' : ''}> Build examples only from words in my deck</label>
			<div class="btn-row">
				<button type="button" class="btn" data-act="shuffle">Shuffle deck</button>
				<button type="button" class="btn" data-act="sort-seen" title="Least recently seen first">Sort by last seen</button>
				<button type="button" class="btn" data-act="sort-correct" title="Least recently correct first">Sort by last correct</button>
				<button type="button" class="btn danger" data-act="reset-scores">Clear all scores</button>
			</div>
			<div class="btn-row">
				<button type="button" class="btn" data-act="mode-units">📚 Choose units (${this.deck.size} in deck)</button>
				<button type="button" class="btn" data-act="flags-open">Flagged sentences (${this.flags.length})</button>
				<button type="button" class="btn" data-act="backup-open">Backup / restore</button>
			</div>`;
	}

	flagsHtml() {
		const json = JSON.stringify(this.flagPayload(), null, 2);
		return `<p class="muted">${this.flags.length} flagged. Copy this and save it as a file in the project's <code>flagged/</code> folder.</p>
			<textarea id="export-text" class="export" readonly rows="10">${escapeHtml(json)}</textarea>
			<div class="btn-row"><button type="button" class="btn" data-act="copy" data-target="export-text">Copy</button>
			<button type="button" class="btn" data-act="download-flags">Download</button>
			<button type="button" class="btn danger" data-act="clear-flags">Clear all flags</button></div>`;
	}

	backupHtml() {
		const json = JSON.stringify({ app: 'kongbuhey-flashcards', version: 2, deck: this.deck.toJSON(), notes: this.notes, opts: this.opts, flags: this.flags, stats: this.stats });
		return `<p class="muted">Deck, scores, notes, options, flags and seen/correct times. Paste a backup below and press Restore to load it.</p>
			<textarea id="backup-text" class="export" rows="10">${escapeHtml(json)}</textarea>
			<div class="btn-row"><button type="button" class="btn" data-act="copy" data-target="backup-text">Copy</button>
			<button type="button" class="btn danger" data-act="restore">Restore from text</button></div><p id="backup-msg" class="muted"></p>`;
	}

	// ---------- events ----------
	bind() {
		this.root.addEventListener('click', ev => {
			if (ev.target.closest('#viz')) { this.vizPick(ev); return; }
			const link = ev.target.closest('[data-unit]');
			if (link) {
				ev.preventDefault();
				const id = Number(link.dataset.unit);
				if (this.mode === 'units') this.unitsView.openDetail(id);
				else this.clickExampleUnit(id);
				return;
			}
			const el = ev.target.closest('[data-act]');
			if (el) { if (!el.disabled) this.act(el.dataset.act, el); return; }
			const interactive = ev.target.closest('button, a, textarea, select, input, label, summary, details, #vizwrap, #modal, .notes');
			if (!interactive && this.mode === 'cards' && this.side === 'front' && this.unit) this.flip();
		});
		this.root.addEventListener('change', ev => {
			const t = ev.target;
			if (t.matches('[data-u-filter]')) { this.unitsView.setFilter(t.value); return; }
			const opt = t.dataset && t.dataset.opt;
			if (!opt) return;
			this.opts[opt] = t.type === 'checkbox' ? t.checked : (opt === 'count' ? parseInt(t.value, 10) : t.value);
			this.persistOpts();
			if (opt === 'reverse' || opt === 'onlyFromSet' || opt === 'count') this.regenerate();
		});
		this.root.addEventListener('input', ev => {
			const t = ev.target;
			if (t.matches('[data-u-search]')) { this.unitsView.setQuery(t.value); return; }
			if (!t.matches('[data-notes]')) return;
			const id = this.context().id;
			if (id == null) return;
			this.notes[id] = t.value;
			store.save('notes', this.notes);
		});
		window.addEventListener('resize', () => this.drawViz());
	}

	act(name, el) {
		if (name.startsWith('u-')) { this.unitsView.act(name, el); return; }
		const ctxId = this.context().id;
		switch (name) {
			case 'speak-unit': if (ctxId != null) window.speakKorean(this.units.get(ctxId)[C.Korean], el); break;
			case 'speak-sent': this.speakSentence(Number(el.dataset.i), el); break;
			case 'flag': el.classList.toggle('flagged', this.toggleFlag(Number(el.dataset.i))); break;
			case 'regen': this.regenerate(); break;
			case 'score': this.score(Number(el.dataset.v)); break;
			case 'undo': this.undo(); break;
			case 'remove-unit': {
				const id = this.deck.frontId;
				if (id == null) break;
				this.removeFromDeck(id);
				this.showCard();
				this.toast(`${this.units.get(id)[C.Korean]} removed from the deck`);
				break;
			}
			case 'notes-toggle': this.editingNotes = !this.editingNotes; this.render(); break;
			case 'mode-units': this.closeModal(); this.unitsView.show(); break;
			case 'mode-cards': this.showCards(); break;
			case 'options': this.openModal('Options', this.optionsHtml()); break;
			case 'close-modal': this.closeModal(); break;
			case 'shuffle': this.deck.shuffle(); this.persist(); this.closeModal(); this.showCard(); break;
			case 'sort-seen': this.sortDeck('seen', 'Sorted: least recently seen first'); break;
			case 'sort-correct': this.sortDeck('correct', 'Sorted: least recently correct first'); break;
			case 'reset-scores':
				if (window.confirm('Set every card\'s score back to 0?')) { this.deck.resetScores(); this.persist(); this.closeModal(); this.render(); }
				break;
			case 'flags-open': this.openModal('Flagged sentences', this.flagsHtml()); break;
			case 'backup-open': this.openModal('Backup / restore', this.backupHtml()); break;
			case 'copy': this.copyText(this.root.querySelector('#' + el.dataset.target), el); break;
			case 'download-flags': this.download('flags-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.json', JSON.stringify(this.flagPayload(), null, 2)); break;
			case 'clear-flags':
				if (window.confirm('Delete all flagged sentences?')) { this.flags = []; store.save('flags', this.flags); this.openModal('Flagged sentences', this.flagsHtml()); this.render(); }
				break;
			case 'restore': this.restore(); break;
			default: break;
		}
	}

	copyText(textarea, btn) {
		if (!textarea) return;
		const done = () => { const t = btn.textContent; btn.textContent = 'Copied'; setTimeout(() => { btn.textContent = t; }, 1200); };
		textarea.focus(); textarea.select();
		if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(textarea.value).then(done, () => { document.execCommand('copy'); done(); });
		else { document.execCommand('copy'); done(); }
	}

	download(name, text) {
		const a = document.createElement('a');
		a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
		a.download = name;
		document.body.appendChild(a); a.click(); a.remove();
	}

	restore() {
		const msg = this.root.querySelector('#backup-msg');
		try {
			const data = JSON.parse(this.root.querySelector('#backup-text').value);
			if (data.app !== 'kongbuhey-flashcards') throw new Error('Not a flashcard backup');
			store.save('deck', data.deck); store.save('notes', data.notes || {}); store.save('opts', data.opts || {});
			store.save('flags', data.flags || []); store.save('stats', data.stats || {});
			this.opts = { ...DEFAULT_OPTS, ...(data.opts || {}) };
			this.notes = data.notes || {}; this.flags = data.flags || []; this.stats = data.stats || {};
			this.deck = this.loadDeck();
			this.closeModal(); this.showCard();
		} catch (err) {
			msg.textContent = 'Could not restore: ' + err.message;
		}
	}
}

window.addEventListener('DOMContentLoaded', () => { window.flashcardApp = new FlashcardApp(document.getElementById('app')); });
})();
