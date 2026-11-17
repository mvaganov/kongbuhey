/**
 * fc2/fx.js - "juice": particle bursts on a full-screen canvas, floating numbers, count-up counters, banners,
 * synthesized sound effects (WebAudio, no assets) and haptics. Browser only (window.FC2Fx). Everything is a no-op
 * when the platform lacks the feature or the player prefers reduced motion.
 */
(function() {
'use strict';

const reduce = () => Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : null;
const opts = { sound: true, haptics: true, particle: 'sparks' };
const GLYPHS = { sparks: null, stars: ['★', '✦', '✧'], petals: ['❀', '✿', '❁'] };
let canvas = null, ctx = null, parts = [], running = false, audio = null;

function ensureCanvas() {
	if (canvas) return Boolean(ctx);
	canvas = document.createElement('canvas');
	canvas.id = 'fx';
	document.body.appendChild(canvas);
	ctx = canvas.getContext ? canvas.getContext('2d') : null;
	const size = () => {
		const d = window.devicePixelRatio || 1;
		canvas.width = Math.round(window.innerWidth * d); canvas.height = Math.round(window.innerHeight * d);
		if (ctx) ctx.setTransform(d, 0, 0, d, 0, 0);
	};
	size();
	window.addEventListener('resize', size);
	return Boolean(ctx);
}

function tick() {
	ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
	parts = parts.filter(p => p.life > 0);
	for (const p of parts) {
		p.vy += p.g; p.x += p.vx; p.y += p.vy; p.vx *= 0.985; p.life -= 1; p.rot += p.spin;
		ctx.globalAlpha = Math.min(1, p.life / 18);
		ctx.fillStyle = p.color;
		if (p.glyph) {
			ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
			ctx.font = `${p.size * 3}px system-ui, "Noto Sans KR", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
			ctx.fillText(p.glyph, 0, 0); ctx.restore();
		} else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 6.2832); ctx.fill(); }
	}
	ctx.globalAlpha = 1;
	if (parts.length) raf(tick); else running = false;
}

/** Burst of particles at a point. o: { count, colors, glyphs (overrides the cosmetic style), power, gravity } */
function burst(x, y, o = {}) {
	if (reduce() || !raf || !ensureCanvas()) return;
	const colors = o.colors || ['#ffd166', '#fff3c4', '#ff9f1c'];
	const glyphs = o.glyphs || GLYPHS[opts.particle] || null;
	const n = Math.min(o.count || 18, 400 - parts.length);
	for (let i = 0; i < n; i++) {
		const a = Math.random() * 6.2832, sp = (o.power || 6) * (0.35 + Math.random() * 0.65);
		parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2, g: o.gravity == null ? 0.22 : o.gravity, life: 34 + Math.random() * 26,
			size: 2 + Math.random() * 3, color: colors[i % colors.length], glyph: glyphs ? glyphs[i % glyphs.length] : null, rot: Math.random() * 6, spin: (Math.random() - 0.5) * 0.3 });
	}
	if (!running) { running = true; raf(tick); }
}

const center = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
function burstAt(el, o) { if (el) { const c = center(el); burst(c.x, c.y, o); } }

/** A number that floats up from an element and fades ("+12"). */
function floatText(el, text, cls = '') {
	if (!el) return;
	const c = center(el), n = document.createElement('div');
	n.className = 'float-text ' + cls;
	n.textContent = text;
	n.style.left = c.x + 'px'; n.style.top = c.y + 'px';
	document.body.appendChild(n);
	setTimeout(() => n.remove(), 1100);
}

/** Small dots that fly from one element to another (coins into the counter). */
function fly(fromEl, toEl, n = 6, glyph = '●', cls = '') {
	if (reduce() || !fromEl || !toEl) return;
	const a = center(fromEl), b = center(toEl);
	for (let i = 0; i < Math.min(n, 12); i++) {
		const d = document.createElement('div');
		d.className = 'fly-coin' + (cls ? ' ' + cls : '');
		d.textContent = glyph;
		d.style.left = (a.x + (Math.random() - 0.5) * 60) + 'px'; d.style.top = (a.y + (Math.random() - 0.5) * 40) + 'px';
		document.body.appendChild(d);
		setTimeout(() => { d.style.left = b.x + 'px'; d.style.top = b.y + 'px'; d.style.opacity = '0.2'; d.style.transform = 'scale(0.5)'; }, 30 + i * 45);
		setTimeout(() => d.remove(), 750 + i * 45);
	}
}

/** Animate an element's number from its current value to `to`, with a little pop. */
function countUp(el, to, ms = 600) {
	if (!el) return;
	const from = Number(el.dataset.n || 0);
	el.dataset.n = String(to);
	if (reduce() || !raf || from === to) { el.textContent = Math.round(to).toLocaleString(); return; }
	el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
	const t0 = performance.now(), token = (el._cu = (el._cu || 0) + 1);
	const step = t => {
		if (el._cu !== token) return;
		const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3);
		el.textContent = Math.round(from + (to - from) * e).toLocaleString();
		if (k < 1) raf(step);
	};
	raf(step);
}

function banner(title, sub = '', cls = '') {
	const b = document.createElement('div');
	b.className = 'banner ' + cls;
	b.innerHTML = '<b></b><span></span>';
	b.firstChild.textContent = title; b.lastChild.textContent = sub;
	document.body.appendChild(b);
	setTimeout(() => b.remove(), 1900);
	burst(window.innerWidth / 2, window.innerHeight * 0.38, { count: 60, power: 11 });
}

function flash(cls = 'good') {
	const f = document.createElement('div');
	f.className = 'flash ' + cls;
	document.body.appendChild(f);
	setTimeout(() => f.remove(), 420);
}

// ---------- sound: tiny synthesized blips, pitch climbs with the combo ----------
function tone(freq, at, dur, type = 'triangle', vol = 0.12) {
	const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime + at;
	o.type = type; o.frequency.setValueAtTime(freq, t);
	g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
	o.connect(g); g.connect(audio.destination); o.start(t); o.stop(t + dur + 0.02);
}
const semi = n => Math.pow(2, n / 12);
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
function sfx(name, combo = 0) {
	if (!opts.sound) return;
	try {
		const AC = window.AudioContext || window.webkitAudioContext;
		if (!AC) return;
		if (!audio) audio = new AC();
		if (audio.state === 'suspended') audio.resume();
		const up = semi(SCALE[Math.min(SCALE.length - 1, Math.floor(combo / 3))]);
		switch (name) {
			case 'flip': tone(520, 0, 0.05, 'sine', 0.06); break;
			case 'tap': tone(330, 0, 0.04, 'sine', 0.05); break;
			case 'answer': tone(392 * up, 0, 0.09); tone(523 * up, 0.06, 0.12); break;
			case 'miss': tone(196, 0, 0.14, 'sine', 0.1); break;
			case 'harvest': [523, 659, 784].forEach((f, i) => tone(f * up, i * 0.06, 0.16)); break;
			case 'crit': [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.05, 0.22, 'square', 0.07)); break;
			case 'coin': tone(988, 0, 0.06, 'square', 0.05); tone(1319, 0.06, 0.16, 'square', 0.05); break;
			case 'establish': [392, 523, 659, 784].forEach((f, i) => tone(f, i * 0.07, 0.2)); break;
			case 'promote': [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.3)); tone(1568, 0.36, 0.5, 'sine', 0.1); break;
			case 'level': [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.35, 'triangle', 0.14)); break;
			case 'reveal': tone(300, 0, 0.25, 'sawtooth', 0.04); tone(600, 0.1, 0.2, 'triangle', 0.08); break;
			case 'buy': tone(440, 0, 0.08); tone(660, 0.07, 0.08); tone(880, 0.14, 0.18); break;
			case 'deny': tone(160, 0, 0.12, 'square', 0.06); break;
			default: break;
		}
	} catch (_) { /* sound is optional */ }
}

function buzz(pattern) {
	if (opts.haptics && navigator.vibrate) { try { navigator.vibrate(pattern); } catch (_) { /* optional */ } }
}

window.FC2Fx = { opts, burst, burstAt, floatText, fly, countUp, banner, flash, sfx, buzz };
})();
