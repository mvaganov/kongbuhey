function hasBatchim(char) {
  const code = char.charCodeAt(0) - 44032;
  if (code < 0 || code > 11171) return false;
  return code % 28 !== 0;
}

function getStem(baseForm) {
  return baseForm.replace(/다$/, '');
}

function getVowelHarmony(char) {
    if (char === '하') return '여'; // Special case for 하 -> 하여 -> 해
    const code = char.charCodeAt(0) - 44032;
    if (code < 0 || code > 11171) return '어'; // Fallback
    const medial = Math.floor(code / 28) % 21;
    // 0: ㅏ, 2: ㅑ, 8: ㅗ
    if (medial === 0 || medial === 2 || medial === 8) {
        return '아';
    }
    return '어';
}

function applyMorphology(text) {
    let resolvedKo = text;
    
    // Irregular Verbs Handling
    // 1. b_irregular + 으 -> 우
    resolvedKo = resolvedKo.replace(/([가-힣])\[b_irregular\]으\/(니까|면|러|려고)/g, (match, prevChar, suffix) => {
        // Drop ㅂ (jongseong 17) -> add 우
        const stemNoB = String.fromCharCode(prevChar.charCodeAt(0) - 17);
        return stemNoB + '우' + suffix;
    });

    // 2. b_irregular + 아/어 -> 워
    resolvedKo = resolvedKo.replace(/([가-힣])\[b_irregular\]아\/어(요|서|)/g, (match, prevChar, suffix) => {
        // Drop ㅂ (jongseong 17) -> add 워 (or 와 for 돕다/곱다, but default to 워)
        const stemNoB = String.fromCharCode(prevChar.charCodeAt(0) - 17);
        return stemNoB + '워' + suffix;
    });

    // Strip leftover conjugation markers that didn't trigger an irregular change (or are unimplemented)
    resolvedKo = resolvedKo.replace(/\[[a-z_]+\]/g, '');

    // Resolve particles based on previous character's batchim
    resolvedKo = resolvedKo.replace(/([가-힣])(이\/가|은\/는|을\/를|\(이\)랑)/g, (match, prevChar, particleStr) => {
        const hasB = hasBatchim(prevChar);
        if (particleStr === "이/가") return prevChar + (hasB ? "이" : "가");
        if (particleStr === "은/는") return prevChar + (hasB ? "은" : "는");
        if (particleStr === "을/를") return prevChar + (hasB ? "을" : "를");
        if (particleStr === "(이)랑") return prevChar + (hasB ? "이랑" : "랑");
        return match;
    });
    
    // Resolve 이/예요 based on batchim
    resolvedKo = resolvedKo.replace(/([가-힣])이\/예요/g, (match, prevChar) => {
        if (hasBatchim(prevChar)) {
            return prevChar + '이에요';
        } else {
            return prevChar + '예요';
        }
    });

    // Resolve 습니다/ㅂ니다 based on previous character's batchim
    resolvedKo = resolvedKo.replace(/([가-힣])(습니다\/ㅂ니다|습니다|ㅂ니다)/g, (match, prevChar, ending) => {
        if (ending === "습니다/ㅂ니다") {
            if (hasBatchim(prevChar)) return prevChar + "습니다";
            // Merge ㅂ batchim (offset 17 in jongseong)
            const code = prevChar.charCodeAt(0);
            return String.fromCharCode(code + 17) + "니다"; 
        }
        return match;
    });

    // Resolve 아/어 vowel harmony
    resolvedKo = resolvedKo.replace(/([가-힣])아\/어(요|서|)/g, (match, prevChar, suffix) => {
        const harmonyVowel = getVowelHarmony(prevChar);
        return prevChar + harmonyVowel + suffix;
    });

    // Resolve 으 insertion (e.g., 으/니까, 으/면) based on batchim
    resolvedKo = resolvedKo.replace(/([가-힣])으\/(니까|면|러|려고)/g, (match, prevChar, suffix) => {
        if (hasBatchim(prevChar)) {
            // Note: ㄹ batchim irregulars would drop ㄹ and not take 으, but we can add that later when needed
            return prevChar + '으' + suffix;
        } else {
            return prevChar + suffix;
        }
    });

    // Basic Vowel Contractions
    resolvedKo = resolvedKo.replace(/가아요/g, "가요");
    resolvedKo = resolvedKo.replace(/가어서/g, "가서");
    resolvedKo = resolvedKo.replace(/가아/g, "가");
    resolvedKo = resolvedKo.replace(/오아요/g, "와요");
    resolvedKo = resolvedKo.replace(/마시아요/g, "마셔요");
    resolvedKo = resolvedKo.replace(/마시어요/g, "마셔요");
    resolvedKo = resolvedKo.replace(/마시어서/g, "마셔서");
    resolvedKo = resolvedKo.replace(/크아요/g, "커요");
    resolvedKo = resolvedKo.replace(/크어요/g, "커요");
    resolvedKo = resolvedKo.replace(/크어서/g, "커서");
    resolvedKo = resolvedKo.replace(/하여요/g, "해요");
    resolvedKo = resolvedKo.replace(/하여서/g, "해서");
    resolvedKo = resolvedKo.replace(/이어요/g, "이에요");

    return resolvedKo;
}

// Support both Node.js (for scripts) and Browser (for the app)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { hasBatchim, getStem, applyMorphology };
}
