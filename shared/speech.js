/**
 * shared/speech.js - Korean text-to-speech through the browser's speechSynthesis (native ko voice only).
 * Browser global (window.speakKorean) or CommonJS (no-op without a browser).
 */
(function() {
'use strict';

/** Turns a lexicon form such as "(이)랑", "-습니다" or "은 / 는" into something a voice can read. */
function speakableKorean(text) {
	return String(text || '')
		.replace(/\[.*?\]/g, '')
		.replace(/[()~]/g, '')
		.replace(/(^|\s)-+/g, '$1')
		.replace(/\s*\/\s*/g, ', ')
		.trim();
}

function speakKorean(text, buttonEl = null) {
	const clean = speakableKorean(text);
	if (!clean || typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
	try {
		window.speechSynthesis.cancel();
		const utterance = new SpeechSynthesisUtterance(clean);
		utterance.lang = 'ko-KR';
		utterance.rate = 0.9;
		const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
		const koVoice = Array.isArray(voices) ? voices.find(v => v.lang === 'ko-KR' || v.lang.startsWith('ko')) : null;
		if (koVoice) utterance.voice = koVoice;
		if (buttonEl) {
			buttonEl.classList.add('is-speaking');
			const done = () => buttonEl.classList.remove('is-speaking');
			utterance.onend = done;
			utterance.onerror = done;
		}
		window.speechSynthesis.speak(utterance);
		return true;
	} catch (_) {
		if (buttonEl) buttonEl.classList.remove('is-speaking');
		return false;
	}
}

if (typeof window !== 'undefined') { window.speakKorean = speakKorean; window.speakableKorean = speakableKorean; }
if (typeof module !== 'undefined' && module.exports) module.exports = { speakKorean, speakableKorean };
})();
