/**
 * flashcards/app.js - mobile flashcard app (front/back cycle, self-scoring, deck visualization, notes, flags).
 * Pure deck rules live in deck.js; string helpers in render.js; sentence generation in shared/sentence_adapter.js.
 * All state is stored in localStorage under "kb.fc.v1.*" (this page is independent of the webapp's IndexedDB).
 */
(function() {
'use strict';

const { Deck, SCORE_BUTTONS, scoreColor, gridLayout } = window;
const { escapeHtml, sentenceHtml, sourceSummary } = window.FlashcardRender;
const C = window.DATA_SCHEMA;
const LS_PREFIX = 'kb.fc.v1.';
const GAP = 1;
const SPEAK_MODES = [['none', "Don't speak"], ['front', 'When front is shown'], ['back', 'When back is shown'], ['both', 'When front or back are shown']];
const DEFAULT_OPTS = { reverse: false, speak: 'none', count: 3, onlyFromSet: false, sources: null, vizExpanded: false };

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
		this.sources = sourceSummary(window.KR_EN_languageUnits, C.Source);
		this.opts = { ...DEFAULT_OPTS, ...store.load('opts', {}) };
		this.notes = store.load('notes', {});
		this.flags = store.load('flags', []);
		this.deck = this.loadDeck();
		this.side = 'front';
		this.editingNotes = false;
		this.sentences = [];
		this.sentenceMsg = '';
		this.modal = null;
		this.bind();
		this.showCard();
	}

	// ---------- state ----------
	deckIdsFromSources() {
		const want = this.opts.sources ? new Set(this.opts.sources) : null;
		return Array.from(this.units.values()).filter(u => !want || want.has(u[C.Source])).map(u => u[C.Id]);
	}

	loadDeck() {
		const saved = store.load('deck', null);
		const ids = this.deckIdsFromSources();
		if (saved && Array.isArray(saved.order)) {
			const deck = Deck.fromJSON(saved);
			deck.order = deck.order.filter(id => this.units.has(id));
			deck.setMembers(ids);
			return deck;
		}
		return new Deck(ids);
	}

	persist() { store.save('deck', this.deck.toJSON()); }
	persistOpts() { store.save('opts', this.opts); }
	get unit() { return this.deck.frontId == null ? null : this.units.get(this.deck.frontId); }

	showCard() {
		this.side = 'front';
		this.editingNotes = false;
		this.generate();
		this.render();
		this.maybeSpeak('front');
	}

	generate() {
		const u = this.unit;
		this.sentences = [];
		this.sentenceMsg = '';
		if (!u) return;
		try {
			const options = { seedOffset: Math.floor(Math.random() * 997) };
			if (this.opts.onlyFromSet) { options.onlyFromSet = true; options.allowedUnitIds = new Set(this.deck.order); }
			const list = window.generateSentencesForUnit(u[C.Id], this.opts.count, options);
			this.sentences = Array.from(list);
			if (!this.sentences.length) this.sentenceMsg = list.message || 'No example sentences are available for this unit yet.';
		} catch (err) {
			this.sentenceMsg = 'Could not generate sentences for this unit.';
		}
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
		if (this.deck.score(value)) { this.persist(); this.showCard(); }
	}

	undo() {
		if (this.deck.undo() != null) { this.persist(); this.showCard(); }
	}

	// ---------- flags ----------
	isFlagged(ko) { return this.flags.some(f => f.ko === ko); }

	toggleFlag(i) {
		const item = this.sentences[i], u = this.unit;
		if (!item || !u) return false;
		const was = this.isFlagged(item.ko);
		if (was) this.flags = this.flags.filter(f => f.ko !== item.ko);
		else this.flags.push({ ...window.buildFlagEntry(item, u[C.Id], 'flashcards'), flaggedAt: new Date().toISOString() });
		store.save('flags', this.flags);
		return !was;
	}

	flagPayload() {
		return { app: 'kongbuhey', kind: 'flagged-sentences', version: 1, exportedAt: new Date().toISOString(), items: this.flags };
	}

	// ---------- rendering ----------
	speakBtn(act, extra = '') {
		return `<button type="button" class="icon-btn speak" data-act="${act}" ${extra} aria-label="Speak">🔊</button>`;
	}

	sentenceListHtml(withEnglish) {
		if (!this.sentences.length) return `<p class="muted">${escapeHtml(this.sentenceMsg)}</p>`;
		const u = this.unit, id = u[C.Id];
		const koHidden = this.opts.reverse && this.side === 'front';
		return '<ul class="sentences">' + this.sentences.map((s, i) => {
			const flagged = this.isFlagged(s.ko);
			const ko = koHidden ? '' : `<div class="s-ko">${sentenceHtml(s, id)}</div>`;
			const en = (withEnglish || koHidden)
				? `<div class="s-en-lit">${escapeHtml(s.enLiteral)}</div><div class="s-en">${escapeHtml(s.enNatural || s.en)}</div>` : '';
			return `<li class="sentence">
				<div class="s-body">${ko}${en}</div>
				<div class="s-actions">
					${koHidden ? '' : this.speakBtn('speak-sent', `data-i="${i}"`)}
					<button type="button" class="icon-btn flag${flagged ? ' flagged' : ''}" data-act="flag" data-i="${i}" aria-label="Flag bad sentence" title="Flag bad sentence">⚑</button>
				</div></li>`;
		}).join('') + '</ul>';
	}

	topbarHtml() {
		const u = this.unit;
		const sc = u ? this.deck.scoreOf(u[C.Id]) : 0;
		return `<header class="topbar">
			<button type="button" class="icon-btn" data-act="undo" aria-label="Back (undo last score)" ${this.deck.history.length ? '' : 'disabled'}>↩︎ Back</button>
			<div class="progress"><span class="chip" style="background:${scoreColor(sc)}">${sc > 0 ? '+' : ''}${sc}</span> ${this.deck.size} cards</div>
			<button type="button" class="icon-btn" data-act="options" aria-label="Options">☰</button>
		</header>`;
	}

	frontHtml(u) {
		const rev = this.opts.reverse;
		const main = rev
			? `<h1 class="unit-main english">${escapeHtml(u[C.English])}</h1>${u[C.Disambiguation] ? `<div class="gloss">${escapeHtml(u[C.Disambiguation])}</div>` : ''}`
			: `<div class="unit-row"><h1 class="unit-main">${escapeHtml(u[C.Korean])}</h1>${this.speakBtn('speak-unit')}</div>`;
		return `<div class="face front">${main}${this.sentenceListHtml(false)}
			<button type="button" class="btn" data-act="regen">↻ New examples</button>
			<p class="hint">Tap empty space to reveal the answer</p></div>`;
	}

	backHtml(u) {
		const notes = this.notes[u[C.Id]] || '';
		const notesBody = this.editingNotes
			? `<textarea class="notes-edit" data-notes rows="6" placeholder="Markdown notes…">${escapeHtml(notes)}</textarea>`
			: (notes.trim() ? `<div class="notes-md">${window.renderMarkdownWithHtml(notes)}</div>` : '<p class="muted">No notes yet.</p>');
		return `<div class="face back">
			<div class="unit-row"><h1 class="unit-main">${escapeHtml(u[C.Korean])}</h1>${this.speakBtn('speak-unit')}</div>
			<div class="unit-en">${escapeHtml(u[C.English])}</div>
			<div class="gloss">${escapeHtml(u[C.PartofSpeech] || '')}${u[C.Disambiguation] ? ' · ' + escapeHtml(u[C.Disambiguation]) : ''}</div>
			${this.sentenceListHtml(true)}
			<button type="button" class="btn" data-act="regen">↻ New examples</button>
			<section class="notes"><div class="notes-head"><h2>Notes</h2>
				<button type="button" class="btn small" data-act="notes-toggle">${this.editingNotes ? 'Done' : 'Edit'}</button></div>${notesBody}</section>
		</div>
		<nav class="scorebar">${SCORE_BUTTONS.map(b => `<button type="button" class="score s${b.value < 0 ? 'n' + -b.value : b.value}" data-act="score" data-v="${b.value}" style="--c:${scoreColor(b.value * 3)}"><b>${b.value > 0 ? '+' : ''}${b.value}</b>${escapeHtml(b.label)}</button>`).join('')}</nav>`;
	}

	render() {
		const u = this.unit;
		const body = !u ? '<div class="face"><p class="muted">The deck is empty. Open the options (☰) and choose which sources to study.</p></div>'
			: (this.side === 'front' ? this.frontHtml(u) : this.backHtml(u));
		this.root.querySelector('#top').innerHTML = this.topbarHtml();
		this.root.querySelector('#card').innerHTML = body;
		this.root.querySelector('#card').classList.toggle('has-scorebar', Boolean(u) && this.side === 'back');
		this.drawViz();
	}

	// ---------- deck visualization ----------
	drawViz() {
		const wrap = this.root.querySelector('#vizwrap'), canvas = this.root.querySelector('#viz');
		wrap.classList.toggle('expanded', this.opts.vizExpanded);
		const width = Math.max(120, wrap.clientWidth || 340), n = this.deck.size;
		const layout = this.opts.vizExpanded ? gridLayout(n, width, 1e6, 3, 12, GAP) : gridLayout(n, width, 72, 3, 14, GAP);
		this.vizLayout = layout;
		const dpr = window.devicePixelRatio || 1;
		canvas.style.width = width + 'px';
		canvas.style.height = layout.height + 'px';
		canvas.width = Math.round(width * dpr);
		canvas.height = Math.round(layout.height * dpr);
		const ctx = canvas.getContext && canvas.getContext('2d');
		if (!ctx) return;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		const step = layout.cell + GAP;
		this.deck.order.forEach((id, i) => {
			const x = (i % layout.cols) * step, y = Math.floor(i / layout.cols) * step;
			ctx.fillStyle = scoreColor(this.deck.scoreOf(id));
			ctx.fillRect(x, y, layout.cell, layout.cell);
			if (i === 0) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.strokeRect(x + 0.5, y + 0.5, layout.cell - 1, layout.cell - 1); }
		});
	}

	vizPick(ev) {
		const canvas = this.root.querySelector('#viz'), rect = canvas.getBoundingClientRect(), l = this.vizLayout;
		if (!l) return;
		const step = l.cell + GAP;
		const col = Math.floor((ev.clientX - rect.left) / step), row = Math.floor((ev.clientY - rect.top) / step);
		const idx = row * l.cols + col;
		if (col < 0 || col >= l.cols || row < 0 || idx < 0 || idx >= this.deck.size) return;
		this.deck.toFront(this.deck.order[idx]);
		this.persist();
		this.showCard();
	}

	// ---------- modals ----------
	openModal(title, html) {
		const m = this.root.querySelector('#modal');
		m.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true"><header><h2>${escapeHtml(title)}</h2>
			<button type="button" class="icon-btn" data-act="close-modal" aria-label="Close">✕</button></header><div class="modal-body">${html}</div></div>`;
		m.classList.remove('hidden');
		this.modal = title;
	}

	closeModal() {
		this.root.querySelector('#modal').classList.add('hidden');
		this.modal = null;
	}

	optionsHtml() {
		const o = this.opts;
		const selected = o.sources ? new Set(o.sources) : null;
		return `
			<label class="row"><input type="checkbox" data-opt="reverse" ${o.reverse ? 'checked' : ''}> Test the Korean: show English on the front</label>
			<label class="row">Speak the Korean unit
				<select data-opt="speak">${SPEAK_MODES.map(([v, l]) => `<option value="${v}" ${o.speak === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
			<label class="row">Example sentences per card
				<select data-opt="count">${[1, 2, 3, 4, 5, 6].map(n => `<option ${o.count === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
			<label class="row"><input type="checkbox" data-opt="onlyFromSet" ${o.onlyFromSet ? 'checked' : ''}> Build examples only from words in my deck</label>
			<div class="btn-row">
				<button type="button" class="btn" data-act="shuffle">Shuffle deck</button>
				<button type="button" class="btn danger" data-act="reset-scores">Clear all scores</button>
			</div>
			<details><summary>Deck contents (${this.deck.size} cards)</summary>
				<div class="btn-row"><button type="button" class="btn small" data-act="src-all">All</button><button type="button" class="btn small" data-act="src-none">None</button></div>
				<div class="sources">${this.sources.map(s => `<label><input type="checkbox" data-src="${escapeHtml(s.source)}" ${!selected || selected.has(s.source) ? 'checked' : ''}> ${escapeHtml(s.source)} <span class="muted">${s.count}</span></label>`).join('')}</div>
				<button type="button" class="btn" data-act="src-apply">Apply deck contents</button></details>
			<div class="btn-row">
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
		const json = JSON.stringify({ app: 'kongbuhey-flashcards', version: 1, deck: this.deck.toJSON(), notes: this.notes, opts: this.opts, flags: this.flags });
		return `<p class="muted">Scores, deck order, notes, options and flags. Paste a backup below and press Restore to load it.</p>
			<textarea id="backup-text" class="export" rows="10">${escapeHtml(json)}</textarea>
			<div class="btn-row"><button type="button" class="btn" data-act="copy" data-target="backup-text">Copy</button>
			<button type="button" class="btn danger" data-act="restore">Restore from text</button></div><p id="backup-msg" class="muted"></p>`;
	}

	// ---------- events ----------
	bind() {
		this.root.addEventListener('click', ev => {
			const viz = ev.target.closest('#viz');
			if (viz) { this.vizPick(ev); return; }
			const el = ev.target.closest('[data-act]');
			if (el) { this.act(el.dataset.act, el); return; }
			const interactive = ev.target.closest('button, a, textarea, select, input, label, summary, details, #vizwrap, #modal, .notes');
			if (!interactive && this.side === 'front' && this.unit) this.flip();
		});
		this.root.addEventListener('change', ev => {
			const opt = ev.target.dataset && ev.target.dataset.opt;
			if (!opt) return;
			const t = ev.target;
			this.opts[opt] = t.type === 'checkbox' ? t.checked : (opt === 'count' ? parseInt(t.value, 10) : t.value);
			this.persistOpts();
			if (opt === 'reverse' || opt === 'onlyFromSet' || opt === 'count') { this.generate(); this.render(); }
		});
		this.root.addEventListener('input', ev => {
			if (!ev.target.matches('[data-notes]') || !this.unit) return;
			this.notes[this.unit[C.Id]] = ev.target.value;
			store.save('notes', this.notes);
		});
		window.addEventListener('resize', () => this.drawViz());
	}

	act(name, el) {
		switch (name) {
			case 'speak-unit': window.speakKorean(this.unit[C.Korean], el); break;
			case 'speak-sent': window.speakKorean(this.sentences[Number(el.dataset.i)].ko, el); break;
			case 'flag': el.classList.toggle('flagged', this.toggleFlag(Number(el.dataset.i))); break;
			case 'regen': this.generate(); this.render(); break;
			case 'score': this.score(Number(el.dataset.v)); break;
			case 'undo': this.undo(); break;
			case 'notes-toggle': this.editingNotes = !this.editingNotes; this.render(); break;
			case 'toggle-viz': this.opts.vizExpanded = !this.opts.vizExpanded; this.persistOpts(); this.drawViz(); break;
			case 'options': this.openModal('Options', this.optionsHtml()); break;
			case 'close-modal': this.closeModal(); break;
			case 'shuffle': this.deck.shuffle(); this.persist(); this.closeModal(); this.showCard(); break;
			case 'reset-scores':
				if (window.confirm('Set every card\'s score back to 0?')) { this.deck.resetScores(); this.persist(); this.closeModal(); this.render(); }
				break;
			case 'src-all': case 'src-none':
				this.root.querySelectorAll('[data-src]').forEach(cb => { cb.checked = name === 'src-all'; });
				break;
			case 'src-apply': {
				const picked = Array.from(this.root.querySelectorAll('[data-src]')).filter(cb => cb.checked).map(cb => cb.dataset.src);
				this.opts.sources = picked.length === this.sources.length ? null : picked;
				this.persistOpts();
				this.deck.setMembers(this.deckIdsFromSources());
				this.persist(); this.closeModal(); this.showCard();
				break;
			}
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
			store.save('deck', data.deck); store.save('notes', data.notes || {}); store.save('opts', data.opts || {}); store.save('flags', data.flags || []);
			this.opts = { ...DEFAULT_OPTS, ...(data.opts || {}) };
			this.notes = data.notes || {}; this.flags = data.flags || [];
			this.deck = this.loadDeck();
			this.closeModal(); this.showCard();
		} catch (err) {
			msg.textContent = 'Could not restore: ' + err.message;
		}
	}
}

window.addEventListener('DOMContentLoaded', () => { window.flashcardApp = new FlashcardApp(document.getElementById('app')); });
})();
