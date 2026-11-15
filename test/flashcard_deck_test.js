#!/usr/bin/env node
'use strict';
const { Deck, placementIndex, scoreColor, gridLayout } = require('../flashcards/deck.js');

let passed = 0, failed = 0;
const assert = (c, m) => { if (c) { passed++; console.log(`  [PASS] ${m}`); } else { failed++; console.error(`  [FAIL] ${m}`); } };
function lcg(seed) { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
const ids = n => Array.from({ length: n }, (_, i) => i);

console.log('======================================================');
console.log('          FLASHCARD DECK LOGIC                        ');
console.log('======================================================');

// Placement ranges for the front card scored with each value (50 cards -> 49 remaining)
for (const [value, lo, hi, label] of [[-2, 3, 5, '-2 returns 3-5 cards later'], [-1, 5, 10, '-1 returns 5-10 cards later'], [0, 12, 37, '0 lands in the middle 50%']]) {
	let ok = true;
	for (let seed = 1; seed <= 200; seed++) {
		const d = new Deck(ids(50), {}, lcg(seed));
		const r = d.score(value);
		if (r.at < lo || r.at > hi || d.order[r.at] !== 0) ok = false;
	}
	assert(ok, label);
}
{
	let ok = true;
	for (let seed = 1; seed <= 100; seed++) { const d = new Deck(ids(12), {}, lcg(seed)); const r = d.score(-1); if (r.at < 4 || r.at > 6) ok = false; }
	assert(ok, '-1 in a deck under 20 cards lands in the front half (index 4-6 of 11)');
}
{
	const d = new Deck(ids(3), {}, lcg(1));
	d.score(-2);
	assert(d.size === 3 && d.order.includes(0), 'tiny decks clamp placement and never lose a card');
	const one = new Deck([7], {}, lcg(1));
	one.score(2);
	assert(one.order.join() === '7' && one.scoreOf(7) === 2, 'single-card deck scores in place');
}

// Positive scores sort to the back; equal scores clump; the tail stays non-decreasing
{
	const d = new Deck(ids(40), {}, lcg(42));
	const rng = lcg(7);
	for (let i = 0; i < 200; i++) d.score([1, 2, 1, 2, 1, -1, 0][Math.floor(rng() * 7)]);
	// consider the cards with score > 0: they must form a contiguous, non-decreasing tail run
	const sc = d.order.map(id => d.scoreOf(id));
	let firstPos = sc.findIndex(s => s > 0);
	const tail = sc.slice(firstPos);
	const sorted = tail.every((s, i) => i === 0 || s >= tail[i - 1]);
	assert(sorted, 'after 200 random answers the positive-score cards form a sorted tail (tiers are bands)');
	assert(new Set(d.order).size === 40, 'deck still has every card exactly once');
}
{
	const d = new Deck(ids(10), { 3: 1, 4: 1, 5: 2 }, lcg(3));
	d.order = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
	d.order = [0, 1, 2, 6, 7, 8, 9, 3, 4, 5]; // zeros..., then +1,+1,+2 at the back
	d.scores.set(0, 0);
	d.score(1); // card 0 goes to score 1
	const s = d.order.map(id => d.scoreOf(id));
	const lastOne = s.lastIndexOf(1), firstOne = s.indexOf(1), twoAt = s.indexOf(2);
	assert(s.slice(firstOne, lastOne + 1).every(x => x === 1) && lastOne < twoAt && d.order.indexOf(0) >= firstOne, 'a new +1 lands inside the +1 band, before the +2 band');
}

// Score accumulation, clamping, undo
{
	const d = new Deck(ids(5), {}, lcg(5));
	d.score(2); d.score(2); // different cards
	assert(d.scoreOf(0) === 2 && d.scoreOf(1) === 2, 'scores accumulate on the scored card');
	const id = d.undo();
	assert(id === 1 && d.frontId === 1 && d.scoreOf(1) === 0, 'undo restores the score and returns the card to the front');
	assert(d.undo() === 0 && d.frontId === 0 && d.scoreOf(0) === 0, 'undo can step back through several answers');
	assert(d.undo() === null, 'undo with empty history is a no-op');
	const e = new Deck([1], {}, lcg(1));
	for (let i = 0; i < 10; i++) e.score(2);
	assert(e.scoreOf(1) === 6, 'scores clamp at the maximum');
}

// toFront, shuffle, reset, setMembers, JSON
{
	const d = new Deck(ids(6), { 2: 1 }, lcg(9));
	assert(d.toFront(4) && d.frontId === 4 && d.size === 6, 'toFront brings a clicked card to the front');
	d.shuffle();
	assert([...d.order].sort().join() === ids(6).join(), 'shuffle keeps all cards');
	d.resetScores();
	assert(d.order.every(id => d.scoreOf(id) === 0), 'resetScores sets every card to 0');
	d.scores.set(1, 2);
	d.setMembers([1, 2, 9]);
	assert(d.size === 3 && d.scoreOf(1) === 2 && d.scoreOf(9) === 0 && d.order.includes(9), 'setMembers keeps scores of retained cards and appends new ones');
	const copy = Deck.fromJSON(JSON.parse(JSON.stringify(d.toJSON())));
	assert(copy.order.join() === d.order.join() && copy.scoreOf(1) === 2, 'deck survives JSON round trip');
}

// Membership: add / remove / moveTo / sortBy
{
	const d = new Deck(ids(30), {}, lcg(11));
	d.scores.set(99, 3);
	assert(d.add(99) && d.has(99) && d.frontId === 0, 'add puts a card into the deck without replacing the current card');
	assert(!d.add(99), 'adding a card twice is a no-op');
	assert(d.remove(99) && !d.has(99) && d.scoreOf(99) === 3, 'remove takes the card out but remembers its score');
	d.add(99);
	const sc = d.order.map(id => d.scoreOf(id)), at = d.order.indexOf(99);
	assert(sc.slice(at).every(x => x >= 3), 're-added card with a positive score rejoins its tier at the back');
	assert(d.moveTo(5, 1) && d.order[1] === 5 && d.frontId === 0, 'moveTo(id, 1) queues a card right after the current one');
	const seen = { 3: 50, 7: 10 };
	d.sortBy(id => seen[id] || 0);
	assert(d.order.indexOf(7) < d.order.indexOf(3) && d.order.indexOf(3) === d.size - 1 && new Set(d.order).size === d.size, 'sortBy orders by key ascending (never-seen first) and keeps every card');
	const empty = new Deck([], {}, lcg(1));
	assert(empty.add(4) && empty.frontId === 4, 'add works on an empty deck');
}

// Visualization helpers
assert(scoreColor(-6) !== scoreColor(6) && scoreColor(-6).startsWith('hsl(0,') && scoreColor(6).startsWith('hsl(120,'), 'score colors run red to green');
{
	const g = gridLayout(2045, 340, 90);
	assert(g.cell >= 2 && g.height <= 90 && g.rows * g.cols >= 2045, `grid lays out all 2045 cards (cell ${g.cell}px, ${g.cols}x${g.rows})`);
	const small = gridLayout(60, 340, 90);
	assert(small.cell > g.cell, 'small decks get bigger cells');
}

console.log(`\nTOTAL: ${passed + failed}  PASSED: ${passed}  FAILED: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
