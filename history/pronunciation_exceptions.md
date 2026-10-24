# Standard Korean Pronunciation Exceptions (표준 발음법 예외 조항)

This document provides a comprehensive analysis of the explicit exceptions and conditional rules defined in the **Standard Pronunciation Rules of the Korean Language (국립국어원 표준 발음법)** published by the National Institute of Korean Language.

While the core rule-based pronunciation engine in `korean.js` covers the standard phonetic mutations (연음, 평폐쇄음화, 비음화, 유음화, 기본 경음화, 격음화, 구개음화), the exceptions documented below require lexical, morphemic, or etymological context. They are cataloged here for future implementation.

---

## 1. Double Batchim Exceptions (자음군 단순화 예외)

### 1.1 'ㄼ' Stem Exception (제10항 다만)
* **General Rule (제10항):** 'ㄼ' is simplified to `[ㄹ]` before consonants or at word ends:
  - 넓다 $\rightarrow$ `[널따]`
  - 얇다 $\rightarrow$ `[얄따]`
  - 여덟 $\rightarrow$ `[여덜]`
* **Explicit Exceptions:**
  1. **The verb root `밟-` (to step on):** Pronounced as `[ㅂ]` before all consonants:
     - 밟다 $\rightarrow$ `[밥따]` (NOT `*[발따]`)
     - 밟고 $\rightarrow$ `[밥꼬]`
     - 밟지 $\rightarrow$ `[밥찌]`
     - 밟는 $\rightarrow$ `[밤는]` (coda `ㅂ` assimilates to `ㅁ` before `ㄴ`)
     - *(Note: Before a vowel suffix, standard liaison applies: 밟아 $\rightarrow$ `[발바]`)*
  2. **Compound / Derivative Words with `넓-`:**
     - 넓죽하다 $\rightarrow$ `[넙쭈카다]` (NOT `*[널쭈카다]`)
     - 넓둥글다 $\rightarrow$ `[넙뚱글다]` (NOT `*[널뚱글다]`)

---

### 1.2 'ㄺ' Verb Stem Exception before 'ㄱ' (제11항 다만)
* **General Rule (제11항):** 'ㄺ' is simplified to `[ㄱ]` before consonants or at word ends:
  - 닭 $\rightarrow$ `[닥]`
  - 흙 $\rightarrow$ `[흑]`
  - 맑다 $\rightarrow$ `[막따]`
  - 늙다 $\rightarrow$ `[늑따]`
  - 읽다 $\rightarrow$ `[익따]`
* **Explicit Exception:** When 'ㄺ' is the final consonant of an **inflected verb/adjective stem (용언 어간)** and is immediately followed by a suffix starting with **`ㄱ`**, it dissimilates to **`[ㄹ]`** (to avoid adjacent `[ㄱ]` sounds):
  - 맑게 $\rightarrow$ `[말께]` (NOT `*[막께]`)
  - 묽고 $\rightarrow$ `[물꼬]` (NOT `*[묵꼬]`)
  - 읽거나 $\rightarrow$ `[일꺼나]` (NOT `*[익꺼나]`)
  - 얽히고 $\rightarrow$ `[얼키고]`

---

## 2. Morpheme Boundaries: Substantive vs. Grammatical Morphemes (제15항)

### 2.1 Liaison with Substantive Roots (실질 형태소 앞의 연음 예외)
* **General Rule (제13항 / 제14항):** When a coda is followed by a vowel in **grammatical morphemes (형식 형태소: 조사, 어미, 접미사)**, the coda liaisons directly preserving its original consonant quality:
  - 옷이 $\rightarrow$ `[오시]`
  - 밭에 $\rightarrow$ `[바테]`
  - 꽃을 $\rightarrow$ `[꼬츨]`
  - 늪에 $\rightarrow$ `[느페]`
* **Explicit Exception (제15항):** When a coda is followed by a **substantive morpheme (실질 형태소: 명사, 동사/형용사 어근)** starting with vowels `ㅏ, ㅓ, ㅗ, ㅜ, ㅟ`:
  - The coda **first undergoes neutralization** (음절 끝소리 규칙) to its representative stop (`ㄱ, ㄷ, ㅂ`), and **then** liaisons into the onset of the following syllable:
  - 밭 아래 $\rightarrow$ `[받 아래]` $\rightarrow$ `[바다래]` (NOT `*[바타래]`)
  - 늪 앞 $\rightarrow$ `[늡 앞]` $\rightarrow$ `[느밥]` (NOT `*[느팦]`)
  - 옷 안 $\rightarrow$ `[옫 안]` $\rightarrow$ `[오단]` (NOT `*[오산]`)
  - 겉옷 $\rightarrow$ `[걷옫]` $\rightarrow$ `[거돋]` (NOT `*[거톧]`)
  - 젖어미 $\rightarrow$ `[젇어미]` $\rightarrow$ `[저더미]` (NOT `*[저저미]`)
  - 맛없다 $\rightarrow$ `[맏업따]` $\rightarrow$ `[마덥따]` (NOT `*[마섭따]`)
  - 첫인상 $\rightarrow$ `[첟인상]` $\rightarrow$ `[처딘상]` (NOT `*[처신상]`)

---

## 3. Lateralization Exceptions (유음화의 예외 - 제20항 다만)

* **General Rule (제20항):** `ㄴ` before or after `ㄹ` assimilates into `[ㄹ]` (Liquid Lateralization):
  - 신라 $\rightarrow$ `[실라]`
  - 난로 $\rightarrow$ `[날로]`
  - 칼날 $\rightarrow$ `[칼랄]`
  - 설날 $\rightarrow$ `[설랄]`
* **Explicit Exception (제20항 다만):** In certain compound words and Sino-Korean independent lexemes, lateralization does **not** occur. Instead, `ㄹ` undergoes nasalization to `[ㄴ]`, resulting in a `[ㄴ + ㄴ]` sequence:
  - 생산량 (生産量) $\rightarrow$ `[생산냥]` (NOT `*[생살량]`)
  - 의견란 (意見欄) $\rightarrow$ `[의견난]` (NOT `*[의결란]`)
  - 임진란 (壬辰亂) $\rightarrow$ `[임진난]` (NOT `*[임질란]`)
  - 결단력 (決斷力) $\rightarrow$ `[결딴녁]` (NOT `*[결딸력]`)
  - 상견례 (相見禮) $\rightarrow$ `[상견녜]` (NOT `*[상결례]`)
  - 입원료 (入院料) $\rightarrow$ `[이붠뇨]` (NOT `*[이붤료]`)
  - 횡단로 (橫斷路) $\rightarrow$ `[횡단노]` (NOT `*[횡달로]`)
  - 이원론 (二元論) $\rightarrow$ `[이원논]` (NOT `*[이월론]`)
  - 구근류 (球根類) $\rightarrow$ `[구근뉴]` (NOT `*[구글류]`)

---

## 4. Tensification Exceptions & Saisori (경음화 예외 및 사잇소리 현상)

### 4.1 Passive / Causative Suffix `-기-` (제24항 다만)
* **General Rule (제24항):** Verb/adjective stems ending in `ㄴ(ㄵ), ㅁ(ㄻ)` tensify following suffixes starting with `ㄱ, ㄷ, ㅅ, ㅈ`:
  - 신다 $\rightarrow$ `[신따]`, 안고 $\rightarrow$ `[안꼬]`, 젊지 $\rightarrow$ `[점찌]`
* **Explicit Exception:** The passive / causative suffix **`-기-`** is **NOT** tensified:
  - 안기다 (to be embraced) $\rightarrow$ `[안기다]` (NOT `*[안끼다]`)
  - 감기다 (to close eyes / to wash hair) $\rightarrow$ `[감기다]` (NOT `*[감끼다]`)
  - 굶기다 (to starve someone) $\rightarrow$ `[굼기다]` (NOT `*[굼끼다]`)
  - 옮기다 (to move something) $\rightarrow$ `[옴기다]` (NOT `*[옴끼다]`)

---

### 4.2 Reduplicated Hanja Compounds (제26항 다만)
* **General Rule (제26항):** In Sino-Korean words, `ㄹ` coda tensifies following `ㄷ, ㅅ, ㅈ`:
  - 갈등 $\rightarrow$ `[갈뜨]`, 발전 $\rightarrow$ `[발쩐]`, 일시 $\rightarrow$ `[일씨]`
* **Explicit Exception:** Reduplicated Sino-Korean words (same Hanja repeated) do **NOT** tensify:
  - 허허실실 (虛虛實實) $\rightarrow$ `[허허실실]` (NOT `*[허허실씰]`)
  - 절절하다 (切切하다) $\rightarrow$ `[절절하다]` (NOT `*[절쩌라다]`)

---

### 4.3 Saisori Glottalization in Compounds (제28항)
* In pure Korean or hybrid compound nouns without final stop codas, internal tensification occurs due to historical genitive *saisori*:
  - 문고리 $\rightarrow$ `[문꼬리]`
  - 눈동자 $\rightarrow$ `[눈똥자]`
  - 길가 $\rightarrow$ `[길까]`
  - 손재주 $\rightarrow$ `[손째주]`
  - 술잔 $\rightarrow$ `[술짠]`
  - 강가 $\rightarrow$ `[강까]`
  - 등불 $\rightarrow$ `[등뿔]`
  - *(Note: Lexically idiosyncratic; requires a dictionary lookup flag).*

---

## 5. 'ㄴ' Insertion Rules & Exceptions (ㄴ 첨가 - 제29항)

* **General Rule (제29항):** In compound and derived words, if the preceding element ends in a consonant coda and the succeeding element begins with `이, 야, 여, 요, 유`, an `[ㄴ]` sound is inserted:
  - 솜이불 $\rightarrow$ `[솜니불]`
  - 맨입 $\rightarrow$ `[맨닙]`
  - 꽃잎 $\rightarrow$ `[꼰닙]` (`꽃` $\rightarrow$ `[꼳]` + `[닙]` $\rightarrow$ nasalization `[꼰닙]`)
  - 물약 $\rightarrow$ `[물냑]` $\rightarrow$ lateralization `[물략]`
  - 식용유 $\rightarrow$ `[시굥뉴]`
* **Explicit Exceptions (Words where 'ㄴ' is NOT inserted):**
  - 6·25 $\rightarrow$ `[유기오]` (NOT `*[육니오]`)
  - 금융 $\rightarrow$ `[그뮹]` (NOT `*[금늉]`)
  - 송별연 $\rightarrow$ `[송벼련]` (NOT `*[송별련]`)
  - 등용문 $\rightarrow$ `[등용문]` (NOT `*[등뇽문]`)
  - 검열 $\rightarrow$ `[검녈]` or `[거멸]` (Dual pronunciation permitted)

---

## 6. Multiple Permitted Standard Pronunciations (복수 표준 발음)

The National Institute of Korean Language allows dual standard pronunciations for certain vowel combinations and orthographic forms:

| Form | Article | Primary Standard | Permitted Secondary Standard | Examples |
| :--- | :--- | :--- | :--- | :--- |
| **Non-initial `의`** | 제5항 다만 3 | `[의]` | `[이]` | `주의` $\rightarrow$ `[주의]` / `[주일]`<br>`민주주의` $\rightarrow$ `[민주주의]` / `[민주주이]` |
| **Genitive Particle `의`** | 제5항 다만 4 | `[의]` | `[에]` | `우리의` $\rightarrow$ `[우리의]` / `[우리에]`<br>`강의의` $\rightarrow$ `[강의의]` / `[강이에]` |
| **Syllables with `ㅖ` (except `예`, `례`)** | 제5항 다만 2 | `[ㅖ]` | `[ㅔ]` | `계시다` $\rightarrow$ `[계시다]` / `[게시다]`<br>`시계` $\rightarrow$ `[시계]` / `[시게]`<br>`혜택` $\rightarrow$ `[혜택]` / `[헤택]` |
| **Sai-siot (`ㅅ`) before stops** | 제30항 1 | `[된소리]` | `[ㄷ + 된소리]` | `냇가` $\rightarrow$ `[내까]` / `[낻까]`<br>`찻길` $\rightarrow$ `[차낄]` / `[찯낄]`<br>`햇살` $\rightarrow$ `[해쌀]` / `[핻쌀]` |

---

## 7. Korean Alphabet Letter Names (자모 명칭의 발음 예외 - 제16항)

When a Korean letter name ending in a consonant is followed by a vowel-initial particle (`이, 을, 에`), archaic sound values produce irregular liaison:

| Letter | Regular Expected (Invalid) | Standard Pronunciation (제16항) |
| :--- | :--- | :--- |
| **디귿이** | `*[디그디]` | **`[디그시]`** |
| **지읒이** | `*[지으지]` | **`[지으시]`** |
| **치읓이** | `*[치으치]` | **`[치으시]`** |
| **키읔이** | `*[키으키]` | **`[키으기]`** |
| **티읕이** | `*[티으티]` | **`[티으시]`** |
| **피읖이** | `*[피으피]` | **`[피으비]`** |
| **히읗이** | `*[히으히]` | **`[히으시]`** |

---

## 8. Implementation Strategy for Future Code Architecture

Implementing these exceptions requires context beyond pure syllable-level Unicode operations:

1. **Part of Speech (POS) & Morpheme Tags**:
   - `korean.js` already receives Language Unit objects and Language Unit Trees (LUT).
   - Verb stems vs. nouns can be distinguished using the LUT / `DATA_SCHEMA.PartofSpeech` (resolves `신다 [신따]` vs. `친구 [친구]`).
2. **Grammatical vs. Substantive Boundaries**:
   - In template generation (`{N}은/는`, `{AVst}아/어요`), the junction between token replacement and suffix is known. When `{N}` is replaced by a substantive noun followed by a substantive compound word (e.g., `겉` + `옷`), a substantive boundary flag will indicate `겉옷` $\rightarrow$ `[거돋]`.
3. **Lexical Exception Table**:
   - Maintain a compact lookup map for idiosyncratic words (`생산량`, `밟다`, `넓죽하다`, `맛없다`).
4. **Secondary Pronunciation Flag**:
   - An optional mode in `getPronunciation(text, { allowSecondary: true })` can output secondary standard forms like `[계시다/게시다]`.
