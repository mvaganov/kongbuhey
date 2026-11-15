/**
 * flashcards/deck.js - pure deck logic for the flashcard app (no DOM, no storage).
 *
 * A deck is an ordered list of card ids plus a recognition score per id. The front of the deck
 * (index 0) is the card being shown. Self-scoring moves the card:
 *    -2  3..5 cards ahead              -1  5..10 ahead (front half if the deck is < 20 cards)
 *     0  middle 50% of the deck        +1/+2  back of the deck, kept sorted by score so equal scores
 *                                      form a "tier" band; a new arrival lands at a random spot in its tier.
 * Scores are remembered for cards removed from the deck, so re-adding a card keeps its history.
 * Browser global (window.Deck) or CommonJS.
 */
(function() {
'use strict';

const SCORE_BUTTONS = [
	{ value: -2, label: 'Very hard' },
	{ value: -1, label: 'Missed It' },
	{ value: 0, label: 'Still Needs Practice' },
	{ value: 1, label: 'Correct' },
	{ value: 2, label: 'Easy' }
];
const MIN_SCORE = -6;
const MAX_SCORE = 6;
const HISTORY_LIMIT = 100;

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const randInt = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1)); // inclusive

/** Start index of the sorted run of positive-score cards at the back of `list` (list.length when there is none). */
function tailStart(list, score) {
	const n = list.length;
	let tail = n;
	while (tail > 0 && score(list[tail - 1]) > 0 && (tail === n || score(list[tail - 1]) <= score(list[tail]))) tail--;
	return tail;
}

/**
 * Where a scored card is inserted into the remaining deck (the cards after it was taken off the front).
 * Returns an insertion index 0..remaining.length.
 */
function placementIndex(remaining, scores, value, newScore, rng) {
	const n = remaining.length;
	const score = id => scores.get(id) || 0;
	const tail = tailStart(remaining, score);
	if (value > 0) {
		let lo = tail;
		while (lo < n && score(remaining[lo]) < newScore) lo++;
		let hi = lo;
		while (hi < n && score(remaining[hi]) === newScore) hi++;
		return randInt(rng, lo, hi);
	}
	let at;
	if (value <= -2) at = randInt(rng, 3, 5);
	else if (value === -1) at = n >= 19 ? randInt(rng, 5, 10) : randInt(rng, 4, Math.max(4, Math.floor(n / 2)));
	else at = randInt(rng, Math.floor(n * 0.25), Math.ceil(n * 0.75));
	return clamp(at, 0, tail); // never cut into the sorted positive tail
}

class Deck {
	constructor(ids = [], scores = {}, rng = Math.random) {
		this.rng = rng;
		this.order = ids.slice();
		this.scores = new Map();
		for (const [k, v] of Object.entries(scores || {})) this.scores.set(Number(k), clamp(Number(v) || 0, MIN_SCORE, MAX_SCORE));
		for (const id of this.order) if (!this.scores.has(id)) this.scores.set(id, 0);
		this.history = []; // [{ id, prevScore }]
	}

	get size() { return this.order.length; }
	get frontId() { return this.order.length ? this.order[0] : null; }
	scoreOf(id) { return this.scores.get(id) || 0; }
	has(id) { return this.order.includes(id); }

	/** Apply a self-score to the front card. Returns { id, from, to, at } or null when the deck is empty. */
	score(value) {
		if (!this.order.length) return null;
		const id = this.order.shift();
		const prev = this.scoreOf(id);
		const next = clamp(prev + value, MIN_SCORE, MAX_SCORE);
		this.scores.set(id, next);
		this.history.push({ id, prevScore: prev });
		if (this.history.length > HISTORY_LIMIT) this.history.shift();
		const at = placementIndex(this.order, this.scores, value, next, this.rng);
		this.order.splice(at, 0, id);
		return { id, from: prev, to: next, at };
	}

	/** Undo the last self-score: restore its score and put that card back on the front. */
	undo() {
		const h = this.history.pop();
		if (!h) return null;
		this.toFront(h.id);
		this.scores.set(h.id, h.prevScore);
		return h.id;
	}

	moveTo(id, index) {
		const i = this.order.indexOf(id);
		if (i < 0) return false;
		this.order.splice(i, 1);
		this.order.splice(clamp(index, 0, this.order.length), 0, id);
		return true;
	}

	toFront(id) { return this.moveTo(id, 0); }

	/** Add a card behind the current one: a scored-positive card joins its tier, others land in the middle. */
	add(id) {
		if (this.has(id)) return false;
		if (!this.scores.has(id)) this.scores.set(id, 0);
		if (!this.order.length) { this.order.push(id); return true; }
		const s = this.scoreOf(id);
		const at = placementIndex(this.order.slice(1), this.scores, s > 0 ? 1 : 0, s, this.rng);
		this.order.splice(1 + at, 0, id);
		return true;
	}

	/** Remove a card from the deck (its score is kept in case it comes back). */
	remove(id) {
		const i = this.order.indexOf(id);
		if (i < 0) return false;
		this.order.splice(i, 1);
		this.history = this.history.filter(h => h.id !== id);
		return true;
	}

	shuffle() {
		for (let i = this.order.length - 1; i > 0; i--) {
			const j = randInt(this.rng, 0, i);
			[this.order[i], this.order[j]] = [this.order[j], this.order[i]];
		}
		this.history = [];
	}

	/** Stable sort by a numeric key (ascending). */
	sortBy(keyFn) {
		this.order = this.order.map((id, i) => ({ id, i, k: Number(keyFn(id)) || 0 }))
			.sort((a, b) => a.k - b.k || a.i - b.i).map(x => x.id);
		this.history = [];
	}

	resetScores() {
		for (const id of Array.from(this.scores.keys())) this.scores.set(id, 0);
		this.history = [];
	}

	/** Keep the order of cards that remain, drop the rest, append newcomers at the back. */
	setMembers(ids) {
		const want = new Set(ids);
		const kept = this.order.filter(id => want.has(id));
		const have = new Set(kept);
		const added = ids.filter(id => !have.has(id));
		this.order = kept.concat(added);
		for (const id of added) if (!this.scores.has(id)) this.scores.set(id, 0);
		this.history = this.history.filter(h => want.has(h.id));
	}

	toJSON() {
		return { order: this.order, scores: Object.fromEntries(this.scores) };
	}

	static fromJSON(data, rng = Math.random) {
		return new Deck(Array.isArray(data && data.order) ? data.order : [], (data && data.scores) || {}, rng);
	}
}

/** Card color for the deck visualization: red (low) through yellow to green (high). */
function scoreColor(score) {
	const t = (clamp(score, MIN_SCORE, MAX_SCORE) - MIN_SCORE) / (MAX_SCORE - MIN_SCORE);
	return `hsl(${Math.round(t * 120)}, 70%, 48%)`;
}

/** Grid layout for the deck visualization: the biggest square cell that fits n cards in width x height. */
function gridLayout(n, width, height, minCell = 2, maxCell = 18, gap = 1) {
	if (n <= 0) return { cell: maxCell, cols: 1, rows: 0, height: 0 };
	let cell = maxCell;
	for (; cell > minCell; cell--) {
		const cols = Math.max(1, Math.floor((width + gap) / (cell + gap)));
		if (Math.ceil(n / cols) * (cell + gap) <= height) break;
	}
	const cols = Math.max(1, Math.floor((width + gap) / (cell + gap)));
	const rows = Math.ceil(n / cols);
	return { cell, cols, rows, height: rows * (cell + gap) - gap };
}

const api = { Deck, SCORE_BUTTONS, MIN_SCORE, MAX_SCORE, placementIndex, scoreColor, gridLayout };
if (typeof window !== 'undefined') Object.assign(window, api);
if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
