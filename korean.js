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
    resolvedKo = resolvedKo.replace(/([가-힣])\[b_irregular\]으\/(니까|면|러|려고|세|시|셔|십|ㄹ|ㄴ)/g, (match, prevChar, suffix) => {
        // Drop ㅂ (jongseong 17) -> add 우
        const stemNoB = String.fromCharCode(prevChar.charCodeAt(0) - 17);
        return stemNoB + '우' + suffix;
    });

    // 2. b_irregular + 아/어 -> 워
    resolvedKo = resolvedKo.replace(/([가-힣])\[b_irregular\](아\/어|았\/었)(요|서|어|)/g, (match, prevChar, harmonyMarker, suffix) => {
        const stemNoB = String.fromCharCode(prevChar.charCodeAt(0) - 17);
        const added = harmonyMarker === "았/었" ? "웠" : "워";
        return stemNoB + added + suffix;
    });

    // 3. l_irregular (ㄹ drops before ㄴ, ㅂ, ㅅ and doesn't take 으)
    // ㄹ + 으/니까 -> 드니까 (ㄹ drops, 으 drops)
    resolvedKo = resolvedKo.replace(/([가-힣])\[l_irregular\]으\/(니까|면|러|려고|세|시|셔|십|ㄹ|ㄴ)/g, (match, prevChar, suffix) => {
        // Drop ㄹ (jongseong 8)
        const stemNoL = String.fromCharCode(prevChar.charCodeAt(0) - 8);
        return stemNoL + suffix;
    });

    // ㄹ drops before 는
    resolvedKo = resolvedKo.replace(/([가-힣])\[l_irregular\]는/g, (match, prevChar) => {
        const stemNoL = String.fromCharCode(prevChar.charCodeAt(0) - 8);
        return stemNoL + '는';
    });
    
    // ㄹ + 습니다 -> ㅂ니다
    resolvedKo = resolvedKo.replace(/([가-힣])\[l_irregular\]습니다\/ㅂ니다/g, (match, prevChar) => {
        const stemNoL = String.fromCharCode(prevChar.charCodeAt(0) - 8);
        const stemWithB = String.fromCharCode(stemNoL.charCodeAt(0) + 17); // Add ㅂ batchim
        return stemWithB + "니다";
    });

    // 4. d_irregular (ㄷ -> ㄹ before vowels 으 and 아/어)
    resolvedKo = resolvedKo.replace(/([가-힣])\[d_irregular\]으\/(니까|면|러|려고|세|시|셔|십|ㄹ|ㄴ)/g, (match, prevChar, suffix) => {
        // Change ㄷ (jongseong 7) to ㄹ (jongseong 8)
        const stemWithL = String.fromCharCode(prevChar.charCodeAt(0) + 1);
        return stemWithL + '으' + suffix;
    });

    resolvedKo = resolvedKo.replace(/([가-힣])\[d_irregular\](아\/어|았\/었)(요|서|어|)/g, (match, prevChar, harmonyMarker, suffix) => {
        // Change ㄷ (jongseong 7) to ㄹ (jongseong 8)
        const stemWithL = String.fromCharCode(prevChar.charCodeAt(0) + 1);
        return stemWithL + harmonyMarker + suffix; // harmony is resolved later
    });

    // 5. eu_irregular (drop 으, use previous vowel for harmony)
    resolvedKo = resolvedKo.replace(/([가-힣])\[eu_irregular\](아\/어|았\/었)(요|서|어|)/g, (match, prevChar, harmonyMarker, suffix) => {
        const idx = resolvedKo.indexOf(match);
        let harmonyVowel = '어';
        if (idx > 0) {
            harmonyVowel = getVowelHarmony(resolvedKo[idx - 1]);
        }
        
        const code = prevChar.charCodeAt(0) - 44032;
        const initial = Math.floor(code / 588);
        
        let newMedial = harmonyVowel === '아' ? 0 : 4;
        let newJongseong = harmonyMarker === "았/었" ? 20 : 0;
        
        const newChar = String.fromCharCode(44032 + (initial * 588) + (newMedial * 28) + newJongseong);
        return newChar + suffix;
    });

    // 6. reu_irregular (르 drops, previous gets ㄹ batchim, 르 becomes 라/러)
    resolvedKo = resolvedKo.replace(/([가-힣])르\[reu_irregular\](아\/어|았\/었)(요|서|어|)/g, (match, preReu, harmonyMarker, suffix) => {
        // Add ㄹ batchim (8) to preReu
        const stemWithL = String.fromCharCode(preReu.charCodeAt(0) + 8);
        
        const harmonyVowel = getVowelHarmony(preReu);
        let newReuMedial = harmonyVowel === '아' ? 0 : 4; // ㅏ(0) or ㅓ(4)
        let newReuJongseong = harmonyMarker === "았/었" ? 20 : 0; // ㅆ(20)
        
        // 5 is initial ㄹ. 5 * 588 = 2940.
        const newReuBlock = String.fromCharCode(44032 + 2940 + (newReuMedial * 28) + newReuJongseong);
        
        return stemWithL + newReuBlock + suffix;
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
            const code = prevChar.charCodeAt(0) - 44032;
            if (hasBatchim(prevChar)) {
                // If ㄹ batchim, drop ㄹ and add ㅂ니다
                if (code % 28 === 8) {
                    const stemNoL = String.fromCharCode(prevChar.charCodeAt(0) - 8);
                    const stemWithB = String.fromCharCode(stemNoL.charCodeAt(0) + 17);
                    return stemWithB + "니다";
                }
                return prevChar + "습니다";
            }
            // Merge ㅂ batchim (offset 17 in jongseong)
            return String.fromCharCode(prevChar.charCodeAt(0) + 17) + "니다"; 
        }
        return match;
    });

    // Resolve 아/어/았/었 vowel harmony
    resolvedKo = resolvedKo.replace(/([가-힣])(아\/어|았\/었)(요|서|어|)/g, (match, prevChar, harmonyMarker, suffix) => {
        const harmonyVowel = getVowelHarmony(prevChar);
        if (harmonyMarker === "았/었") {
            return prevChar + (harmonyVowel === '아' ? '았' : '었') + suffix;
        }
        return prevChar + harmonyVowel + suffix;
    });

    // Resolve 으 insertion (e.g., 으/니까, 으/면, 으/세요) based on batchim
    resolvedKo = resolvedKo.replace(/([가-힣])으\/(니까|면|러|려고|세|시|셔|십)/g, (match, prevChar, suffix) => {
        const code = prevChar.charCodeAt(0) - 44032;
        if (hasBatchim(prevChar)) {
            // ㄹ batchim doesn't take 으.
            if (code % 28 === 8) {
                return prevChar + suffix;
            }
            return prevChar + '으' + suffix;
        } else {
            return prevChar + suffix;
        }
    });

    // Resolve 으/ㄹ (e.g., 으/ㄹ 거예요)
    resolvedKo = resolvedKo.replace(/([가-힣])으\/ㄹ/g, (match, prevChar) => {
        const code = prevChar.charCodeAt(0) - 44032;
        if (hasBatchim(prevChar)) {
            if (code % 28 === 8) { // ㄹ batchim
                return prevChar;
            }
            return prevChar + '을';
        } else {
            // Add ㄹ (jongseong 8) to prevChar
            return String.fromCharCode(prevChar.charCodeAt(0) + 8);
        }
    });
    
    // Resolve 으/ㄴ (e.g., 으/ㄴ데)
    resolvedKo = resolvedKo.replace(/([가-힣])으\/ㄴ/g, (match, prevChar) => {
        const code = prevChar.charCodeAt(0) - 44032;
        if (hasBatchim(prevChar)) {
            if (code % 28 === 8) { // ㄹ batchim drops ㄹ and adds ㄴ
                return String.fromCharCode(prevChar.charCodeAt(0) - 8 + 4);
            }
            return prevChar + '은';
        } else {
            // Add ㄴ (jongseong 4) to prevChar
            return String.fromCharCode(prevChar.charCodeAt(0) + 4);
        }
    });

    // Basic Vowel Contractions
    // Generic 아 + 아 = 아
    resolvedKo = resolvedKo.replace(/([가-힣])아(요|서|)/g, (match, prevChar, suffix) => {
        const code = prevChar.charCodeAt(0) - 44032;
        if (code >= 0) {
            const medial = Math.floor(code / 28) % 21;
            const jongseong = code % 28;
            if (medial === 0 && jongseong === 0) { // 'ㅏ' vowel, no batchim
                return prevChar + suffix; // e.g. 가 + 아요 -> 가요
            }
        }
        return match;
    });
    
    // Generic 아 + 았 = 았
    resolvedKo = resolvedKo.replace(/([가-힣])았(어요|어)/g, (match, prevChar, suffix) => {
        const code = prevChar.charCodeAt(0) - 44032;
        if (code >= 0) {
            const medial = Math.floor(code / 28) % 21;
            const jongseong = code % 28;
            if (medial === 0 && jongseong === 0) { // 'ㅏ' vowel, no batchim
                const initial = Math.floor(code / 588);
                const newChar = String.fromCharCode(44032 + (initial * 588) + (0 * 28) + 20); // 0 is 'ㅏ', 20 is 'ㅆ'
                return newChar + suffix;
            }
        }
        return match;
    });

    resolvedKo = resolvedKo.replace(/오아요/g, "와요");
    resolvedKo = resolvedKo.replace(/오아서/g, "와서");
    resolvedKo = resolvedKo.replace(/오았어요/g, "왔어요");
    resolvedKo = resolvedKo.replace(/하여요/g, "해요");
    resolvedKo = resolvedKo.replace(/하여서/g, "해서");
    resolvedKo = resolvedKo.replace(/하였어요/g, "했어요");
    resolvedKo = resolvedKo.replace(/마시아요/g, "마셔요");
    resolvedKo = resolvedKo.replace(/마시어요/g, "마셔요");
    resolvedKo = resolvedKo.replace(/마시어서/g, "마셔서");
    resolvedKo = resolvedKo.replace(/크아요/g, "커요");
    resolvedKo = resolvedKo.replace(/크어요/g, "커요");
    resolvedKo = resolvedKo.replace(/크어서/g, "커서");
    resolvedKo = resolvedKo.replace(/이어요/g, "이에요");

    // Generic 이 + 어 = 여 contraction
    resolvedKo = resolvedKo.replace(/([가-힣])어(요|서)/g, (match, prevChar, suffix) => {
        const code = prevChar.charCodeAt(0) - 44032;
        if (code >= 0) {
            const medial = Math.floor(code / 28) % 21;
            const jongseong = code % 28;
            if (medial === 20 && jongseong === 0) { // 'ㅣ' vowel, no batchim
                const initial = Math.floor(code / 588);
                const newChar = String.fromCharCode(44032 + (initial * 588) + (6 * 28) + 0); // 6 is 'ㅕ'
                return newChar + suffix;
            }
        }
        return match;
    });
    
    // Generic 이 + 었 = 였 contraction
    resolvedKo = resolvedKo.replace(/([가-힣])었(어요|어)/g, (match, prevChar, suffix) => {
        const code = prevChar.charCodeAt(0) - 44032;
        if (code >= 0) {
            const medial = Math.floor(code / 28) % 21;
            const jongseong = code % 28;
            if (medial === 20 && jongseong === 0) { // 'ㅣ' vowel, no batchim
                const initial = Math.floor(code / 588);
                const newChar = String.fromCharCode(44032 + (initial * 588) + (6 * 28) + 20); // 6 is 'ㅕ', 20 is 'ㅆ'
                return newChar + suffix;
            }
        }
        return match;
    });

    return resolvedKo;
}

// Support both Node.js (for scripts) and Browser (for the app)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { hasBatchim, getStem, applyMorphology };
}
