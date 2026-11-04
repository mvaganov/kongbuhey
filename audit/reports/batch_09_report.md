# Linguistic Audit Report: Batch 09 (Nouns Part C)

> **Batch ID:** 09  
> **Category:** Nouns (Part C: Geography, Kitchenware, Ingredients, Clothing, Transit & Administration)  
> **Target Manifest:** `audit/batches/batch_09_nouns_part_c.json`  
> **Total In-Scope Units:** 221  
> **PRNG Seed:** `1793700900000`  
> **Date:** 2026-11-04  
> **Evaluation Status:** **COMPLETE (221 / 221 Analyzed)**  
> **Audit Summary:** **Clean: 196 units (89%) | Flagged: 25 units (11%)**  

---

## 1. Executive Summary & Critical Linguistic Findings

Batch 09 audits the third quintile of Nouns (221 units, IDs 853..1289), spanning geographic and natural features, culinary ingredients and seasonings, residential spaces and furniture, transport signage, and university academic/administrative vocabulary.

### Key Discoveries & Root Causes:

1. **Academic Discipline Over-Generalization on `등록금` (ID 1283):**
   - The financial tuition noun `등록금` (tuition fee) carries the generic `academic` tag in `data.js`.
   - Consequently, the academic major predicate `전공하다` (to major in) selected `등록금` across 5 separate variations (*`누나는 등록금을 전공해요`*, *`영수는 등록금을 전공할 거예요`*, *`기자는 등록금을 전공했어요`*).
   - In Korean, one majors in academic disciplines (경제학, 언어학, 공학), never in tuition bills.
   - *Mitigation:* Re-tag Unit 1283 to `[finance, academic_fee]` and exclude from `[academic_field, major]`.

2. **Paste & Liquid Seasoning Collocation Mismatches:**
   - **Thick Paste Condiment (`고추장` ID 933):** Paired with knife slicing (*`고추장을 썰 거예요`*) and pan griddling like a pancake (*`고추장을 부칠 거예요`*).
   - **Liquid Cooking Oil (`참기름` ID 989):** Paired with solid mastication (*`참기름을 씹을 거예요`*) and mincing (*`참기름을 다져요`*).
   - *Mitigation:* Subcategorize liquid and paste condiments separately from solid foods; restrict to seasoning, pouring, or mixing frames.

3. **Honorific Self-Exaltation on 1st-Person Subject (`양파` ID 984):**
   - In generation variation 5 of `양파`, the first-person plural subject `우리` was paired with the elder-exalting suppletive eating verb `잡수셨어요` (*`우리는 양파를 잡수셨어요`*).
   - Korean sociolinguistic grammar strictly forbids speakers from exalting themselves using honorific verbal suppletives.

4. **Traffic Rule / Signage Category Confusion (`주차 금지` ID 1254):**
   - The prohibition concept `주차 금지` (no parking) was paired with commercial facility utilization (*`주차 금지를 이용할 거예요`*) and price evaluation (*`주차 금지가 싸요`*).
   - *Mitigation:* Restrict traffic prohibition terms strictly to rule / signage frames.

5. **Copula Inflection Defects (`여요` / `였어요`):**
   - Detached copula endings generated on `책장` (ID 991, *`책장이 여요`*) and `배낭` (ID 1031, *`배낭이 여요`*).

6. **Flawless Kinship Concord on Paternal Elders (`큰아버지` ID 853 & `큰어머니` ID 854):**
   - Both units maintained **100% honorific concord**:
     - Subject particles: strictly `께서` / `께서는`.
     - Verb honorific infix: strictly `-(으)시-` (`맛보십니다`, `드실 거예요`, `부치세요`, `차세요`).

---

## 2. Detailed Unit-by-Unit Linguistic Evaluations

### Unit #853 큰아버지 (Noun) - "paternal uncle (father's older brother)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 853 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_853.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #854 큰어머니 (Noun) - "aunt (wife of father's older brother)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 854 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_854.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #858 거리 (Noun) - "street, road, distance"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 858 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_858.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #859 구경거리 (Noun) - "attraction, sight to see"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 859 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_859.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #860 남해 (Noun) - "South Sea (of Korea)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 860 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_860.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #862 도시 (Noun) - "city"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 862 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_862.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #863 동창회 (Noun) - "alumni association, reunion"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 863 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_863.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #864 롤러코스터 (Noun) - "roller coaster"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 864 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_864.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #865 빌딩 (Noun) - "building"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 865 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_865.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #866 서해 (Noun) - "West Sea (Yellow Sea)"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 866 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_866.txt`
- **Seed:** `1793700900000`
- **Generation Sample (Offending Variations):**
  - *Var 7:* `사나이는 서해에서 나와요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #867 섬 (Noun) - "island"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 867 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_867.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #868 숲 (Noun) - "forest, woods"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 868 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_868.txt`
- **Seed:** `1793700900000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `사나이는 숲에서 연기해요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #869 시골 (Noun) - "countryside, rural area"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 869 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_869.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #871 온천 (Noun) - "hot spring"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 871 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_871.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #874 한라산 (Noun) - "Hallasan (mountain in Jeju)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 874 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_874.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #875 해변 (Noun) - "beach, seashore"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 875 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_875.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #876 해산물 (Noun) - "seafood"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 876 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_876.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #880 관광지 (Noun) - "tourist attraction, sight"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 880 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_880.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #896 동네 (Noun) - "neighborhood, village"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 896 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_896.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #897 룸메이트 (Noun) - "roommate"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 897 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_897.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #898 미용실 (Noun) - "hair salon, beauty parlor"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 898 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_898.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #899 분식집 (Noun) - "snack bar (casual Korean food eatery)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 899 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_899.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #903 약도 (Noun) - "rough map, simplified map, directions sketch"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 903 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_903.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #905 이삿짐 (Noun) - "moving luggage, household belongings for moving"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 905 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_905.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #906 이삿짐센터 (Noun) - "moving company"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 906 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_906.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #908 주유소 (Noun) - "gas station"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 908 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_908.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #909 짐 (Noun) - "luggage, load, baggage"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 909 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_909.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #910 찜질방 (Noun) - "Korean sauna, bathhouse"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 910 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_910.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #913 거실 (Noun) - "living room"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 913 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_913.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #917 베란다 (Noun) - "veranda, balcony"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 917 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_917.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #918 벽 (Noun) - "wall"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 918 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_918.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #919 부엌 (Noun) - "kitchen"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 919 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_919.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #921 서재 (Noun) - "study room, library (in a home)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 921 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_921.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #922 세탁기 (Noun) - "washing machine"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 922 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_922.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #923 소파 (Noun) - "sofa, couch"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 923 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_923.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #924 수건 (Noun) - "towel"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 924 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_924.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #925 식탁 (Noun) - "dining table"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 925 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_925.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #926 옷장 (Noun) - "closet, wardrobe"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 926 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_926.txt`
- **Seed:** `1793700900000`
- **Generation Sample (Offending Variations):**
  - *Var 9:* `사나이는 옷장을 잃어버릴 거예요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #927 욕실 (Noun) - "bathroom"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 927 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_927.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #928 주변 (Noun) - "surroundings, vicinity"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 928 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_928.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #929 현관 (Noun) - "main entrance, front door, foyer"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 929 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_929.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #933 고추장 (Noun) - "red chili paste"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 933 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_933.txt`
- **Seed:** `1793700900000`
- **Generation Sample (Offending Variations):**
  - *Var 3:* `미국 사람은 고추장을 부칠 거예요.`
  - *Var 9:* `우리는 고추장을 썰 거예요.`
  - **Linguistic Error:** Culinary collocation violation: Paste condiment '고추장' (red chili paste) paired with knife slicing (*'고추장을 썰 거예요'*) and griddling like a pancake (*'고추장을 부칠 거예요'*).
  - **Suggested Remediation:** Distinguish [food_condiment_paste] from solid sliceable foods; restrict to mixing/seasoning verbs (비비다, 넣다, 찍다).

### Unit #937 된장 (Noun) - "soybean paste"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 937 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_937.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #939 명절 (Noun) - "traditional holiday"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 939 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_939.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #940 방법 (Noun) - "method, way"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 940 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_940.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #943 삼성역 (Noun) - "Samseong Station"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 943 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_943.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #945 설탕 (Noun) - "sugar"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 945 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_945.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #946 소고기 (Noun) - "beef"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 946 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_946.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #947 소금 (Noun) - "salt"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 947 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_947.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #948 스트레스 (Noun) - "stress"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 948 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_948.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #949 식초 (Noun) - "vinegar"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 949 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_949.txt`
- **Seed:** `1793700900000`
- **Generation Sample (Offending Variations):**
  - *Var 9:* `사나이는 식초를 볶을 거예요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #950 양념 (Noun) - "seasoning, marinade, sauce"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 950 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_950.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #952 인사동 (Noun) - "Insadong (neighborhood in Seoul)"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 952 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_952.txt`
- **Seed:** `1793700900000`
- **Generation Sample (Offending Variations):**
  - *Var 4:* `사나이는 인사동에서 여행을 가요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #953 접시 (Noun) - "plate, dish"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 953 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_953.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #955 후추 (Noun) - "black pepper"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 955 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_955.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #960 간 (Noun) - "seasoning, salty taste, liver"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 960 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_960.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #961 감자 (Noun) - "potato"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 961 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_961.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #962 고기 (Noun) - "meat"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 962 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_962.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #964 기름 (Noun) - "oil, grease"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 964 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_964.txt`
- **Seed:** `1793700900000`
- **Generation Sample (Offending Variations):**
  - *Var 9:* `사나이는 기름을 구울 거예요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #967 냄비 (Noun) - "pot, saucepan"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 967 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_967.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #969 닭고기 (Noun) - "chicken meat"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 969 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_969.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #970 당근 (Noun) - "carrot"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 970 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_970.txt`
- **Seed:** `1793700900000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `사나이는 당근을 섞어요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #971 돼지고기 (Noun) - "pork"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 971 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_971.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #973 면 (Noun) - "noodles, side, face, surface"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 973 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_973.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #975 버섯 (Noun) - "mushroom"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 975 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_975.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #979 설렁탕 (Noun) - "ox bone soup (seolleongtang)"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 979 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_979.txt`
- **Seed:** `1793700900000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `사나이는 설렁탕을 시켜요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #980 소스 (Noun) - "sauce"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 980 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_980.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #982 쓰레기 (Noun) - "trash, garbage"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 982 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_982.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #983 쓰레기통 (Noun) - "trash can, wastebasket"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 983 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_983.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #984 양파 (Noun) - "onion"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 984 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_984.txt`
- **Seed:** `1793700900000`
- **Generation Sample (Offending Variations):**
  - *Var 5:* `우리는 양파를 잡수셨어요.`
  - *Var 10:* `종업원은 양파를 잡수셨어요.`
  - **Linguistic Error:** Sociolinguistic honorific violation: 1st-person plural '우리' paired with elder-exalting suppletive eating verb '잡수셨어요' (*'우리는 양파를 잡수셨어요'*), violating the prohibition on self-exaltation.
  - **Suggested Remediation:** Prevent 1st-person subjects ('우리', '저희', '나', '저') from selecting subject-exalting honorific predicates.

### Unit #985 요리법 (Noun) - "recipe, cooking method"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 985 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_985.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #987 재료 (Noun) - "ingredient, material"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 987 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_987.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #989 참기름 (Noun) - "sesame oil"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 989 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_989.txt`
- **Seed:** `1793700900000`
- **Generation Sample (Offending Variations):**
  - *Var 3:* `노인은 참기름을 씹을 거예요.`
  - *Var 7:* `종업원은 참기름을 다져요.`
  - **Linguistic Error:** Culinary collocation violation: Liquid cooking oil '참기름' (sesame oil) paired with solid mastication (*'참기름을 씹을 거예요'*) and mincing (*'참기름을 다져요'*).
  - **Suggested Remediation:** Tag '참기름' as [liquid_condiment]; restrict to seasoning/pouring verbs (두르다, 넣다, 양념하다) and exclude mastication.

### Unit #990 채소 (Noun) - "vegetable"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 990 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_990.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #991 책장 (Noun) - "bookshelf, bookcase"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 991 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_991.txt`
- **Seed:** `1793700900000`
- **Generation Sample (Offending Variations):**
  - *Var 10:* `책장이 여요.`
  - **Linguistic Error:** Copula inflection bug: Unit 55 '이다' generated as bare detached defect '*여요*' or '*였어요*' (*'책장이 여요.'*) instead of bound predicative ending '이에요/예요' or '이었어요/였어요'.
  - **Suggested Remediation:** Ensure Unit 55 '이다' attaches directly to the nominal stem: -이에요/-이었어요 after consonants, -예요/-였어요 after vowels.
  - *Var 3:* `기자는 책장을 깰 거예요.`
  - *Var 5:* `공무원은 책장을 그만뒀어요.`
  - **Linguistic Error:** Collocation violation: Furniture item '책장' (bookshelf) paired with employment resignation '그만두다' (*'책장을 그만뒀어요'*) and brittle shattering '깨다'.
  - **Suggested Remediation:** Restrict '그만두다' strictly to occupations, duties, and habits; restrict '깨다' to fragile items.

### Unit #993 파 (Noun) - "green onion, scallion"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 993 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_993.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #994 프라이팬 (Noun) - "frying pan"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 994 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_994.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #998 감 (Noun) - "persimmon, feeling, sense"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 998 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_998.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #999 냉동식품 (Noun) - "frozen food"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 999 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_999.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1000 대회 (Noun) - "competition, contest, tournament"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1000 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1000.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1001 마트 (Noun) - "mart, supermarket"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1001 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1001.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1002 방석 (Noun) - "floor cushion"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1002 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1002.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1003 배추 (Noun) - "napa cabbage, Chinese cabbage"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1003 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1003.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1004 비누 (Noun) - "soap"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1004 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1004.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1005 생수 (Noun) - "bottled mineral water"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1005 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1005.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1006 생활용품 (Noun) - "household items, daily necessities"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1006 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1006.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1007 소리 (Noun) - "sound, noise"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1007 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1007.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1008 식료품 (Noun) - "groceries, foodstuffs"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1008 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1008.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1009 음료 (Noun) - "beverage, drink"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1009 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1009.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1010 이불 (Noun) - "blanket, duvet, bedding"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1010 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1010.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1011 참외 (Noun) - "Korean melon (oriental melon)"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1011 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1011.txt`
- **Seed:** `1793700900000`
- **Generation Sample (Offending Variations):**
  - *Var 3:* `사나이는 참외를 끓일 거예요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #1012 치약 (Noun) - "toothpaste"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1012 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1012.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1013 칫솔 (Noun) - "toothbrush"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1013 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1013.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1014 토마토 (Noun) - "tomato"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1014 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1014.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1016 포도 (Noun) - "grape"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1016 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1016.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1017 포스터 (Noun) - "poster"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1017 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1017.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1018 햄 (Noun) - "ham"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1018 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1018.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1023 가전제품 (Noun) - "home appliances, electronic goods"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1023 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1023.txt`
- **Seed:** `1793700900000`
- **Generation Sample (Offending Variations):**
  - *Var 5:* `사나이는 가전제품을 걸레질했어요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #1024 귀걸이 (Noun) - "earrings"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1024 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1024.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1025 남성복 (Noun) - "men's clothing"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1025 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1025.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1026 둘다 (Noun) - "both"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1026 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1026.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1027 매장 (Noun) - "shop, store, sales floor"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1027 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1027.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1029 목걸이 (Noun) - "necklace"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1029 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1029.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1030 반지 (Noun) - "ring (jewelry)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1030 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1030.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1031 배낭 (Noun) - "backpack, rucksack"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1031 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1031.txt`
- **Seed:** `1793700900000`
- **Generation Sample (Offending Variations):**
  - *Var 10:* `배낭이 여요.`
  - **Linguistic Error:** Copula inflection bug: Unit 55 '이다' generated as bare detached defect '*여요*' or '*였어요*' (*'배낭이 여요.'*) instead of bound predicative ending '이에요/예요' or '이었어요/였어요'.
  - **Suggested Remediation:** Ensure Unit 55 '이다' attaches directly to the nominal stem: -이에요/-이었어요 after consonants, -예요/-였어요 after vowels.
  - *Var 1:* `내는 배낭을 이해해요.`
  - **Linguistic Error:** Cognitive predicate mismatch: Physical bag artifact '배낭' (backpack) paired with cognitive comprehension predicate '이해하다' (*'내는 배낭을 이해해요'*).
  - **Suggested Remediation:** Restrict direct objects of '이해하다' to languages, explanations, situations, or humans [concept, speech, person].

### Unit #1032 상품 (Noun) - "product, merchandise, prize"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1032 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1032.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1034 수영복 (Noun) - "swimsuit, swimwear"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1034 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1034.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1035 스포츠용품 (Noun) - "sporting goods"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1035 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1035.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1037 여성복 (Noun) - "women's clothing"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1037 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1037.txt`
- **Seed:** `1793700900000`
- **Generation Sample (Offending Variations):**
  - *Var 7:* `사나이는 여성복을 갈아입어요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #1038 장갑 (Noun) - "gloves"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1038 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1038.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1040 패션잡화 (Noun) - "fashion accessories, fashion goods"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1040 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1040.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1041 할인 (Noun) - "discount, reduction"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1041 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1041.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1043 핸드백 (Noun) - "handbag, purse"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1043 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1043.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1052 반바지 (Noun) - "shorts, short pants"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1052 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1052.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1053 보라색 (Noun) - "purple"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1053 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1053.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1054 분홍색 (Noun) - "pink"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1054 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1054.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1055 색깔 (Noun) - "color"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1055 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1055.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1056 양복 (Noun) - "suit, formal attire"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1056 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1056.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1057 운동복 (Noun) - "sportswear, athletic clothes"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1057 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1057.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1058 원피스 (Noun) - "dress, one-piece suit"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1058 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1058.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1060 점퍼 (Noun) - "jumper, jacket"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1060 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1060.txt`
- **Seed:** `1793700900000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `사나이는 점퍼를 개요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #1061 조끼 (Noun) - "vest, waistcoat"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1061 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1061.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1062 청바지 (Noun) - "jeans, denim pants"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1062 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1062.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1064 하늘색 (Noun) - "sky blue"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1064 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1064.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1065 회색 (Noun) - "gray"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1065 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1065.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1066 흰색 (Noun) - "white"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1066 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1066.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1077 모양 (Noun) - "shape, form, appearance"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1077 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1077.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1081 사이즈 (Noun) - "size"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1081 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1081.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1084 월급 (Noun) - "monthly salary, wage"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1084 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1084.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1087 주머니 (Noun) - "pocket, pouch"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1087 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1087.txt`
- **Seed:** `1793700900000`
- **Generation Sample (Offending Variations):**
  - *Var 5:* `사나이는 주머니를 할인했어요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #1088 첫 (Noun) - "first (determiner)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1088 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1088.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1093 ㅎ동사 (Noun) - "h-irregular verbs (grammatical category)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1093 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1093.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1094 강아지 (Noun) - "puppy, dog"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1094 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1094.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1095 기대 (Noun) - "expectation, anticipation"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1095 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1095.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1096 도움 (Noun) - "help, assistance"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1096 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1096.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1097 동아리 (Noun) - "club, student group"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1097 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1097.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1098 동창 (Noun) - "classmate, alumnus"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1098 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1098.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1099 동해 (Noun) - "East Sea (Sea of Japan)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1099 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1099.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1100 동호회 (Noun) - "club, interest group, society"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1100 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1100.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1105 모임 (Noun) - "meeting, gathering, get-together"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1105 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1105.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1106 송별회 (Noun) - "farewell party"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1106 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1106.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1108 초대장 (Noun) - "invitation card"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1108 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1108.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1111 환영회 (Noun) - "welcome party"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1111 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1111.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1112 회비 (Noun) - "membership fee, dues"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1112 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1112.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1115 꽃바구니 (Noun) - "flower basket"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1115 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1115.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1116 떡 (Noun) - "rice cake"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1116 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1116.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1119 벽시계 (Noun) - "wall clock"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1119 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1119.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1120 부인 (Noun) - "wife (honorific)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1120 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1120.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1121 부케 (Noun) - "bouquet (wedding)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1121 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1121.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1122 분위기 (Noun) - "atmosphere, mood, ambiance"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1122 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1122.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1123 샐러드 (Noun) - "salad"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1123 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1123.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1124 샤부샤부 (Noun) - "shabu-shabu (hot pot)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1124 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1124.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1125 선배 (Noun) - "senior (at school or work)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1125 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1125.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1126 세제 (Noun) - "detergent, cleaning agent"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1126 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1126.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1129 앨범 (Noun) - "album (photo or music)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1129 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1129.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1131 잡채 (Noun) - "japchae (stir-fried glass noodles with vegetables)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1131 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1131.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1133 주방용품 (Noun) - "kitchenware, kitchen utensils"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1133 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1133.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1134 집들이 (Noun) - "housewarming party"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1134 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1134.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1135 찻잔 (Noun) - "teacup"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1135 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1135.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1136 향초 (Noun) - "scented candle"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1136 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1136.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1137 화분 (Noun) - "flowerpot, potted plant"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1137 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1137.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1138 휴지 (Noun) - "tissue, toilet paper"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1138 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1138.txt`
- **Seed:** `1793700900000`
- **Generation Sample (Offending Variations):**
  - *Var 5:* `사나이는 휴지를 가졌어요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #1144 뒤풀이 (Noun) - "after-party, post-event gathering"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1144 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1144.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1145 말 (Noun) - "word, speech, language, horse"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1145 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1145.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1149 성함 (Noun) - "name (honorific)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1149 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1149.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1150 세상 (Noun) - "world, society"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1150 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1150.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1152 연세 (Noun) - "age (honorific)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1152 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1152.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1155 진지 (Noun) - "meal (honorific)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1155 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1155.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1161 나흘 (Noun) - "four days"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1161 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1161.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1162 닷새 (Noun) - "five days"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1162 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1162.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1165 사흘 (Noun) - "three days"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1165 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1165.txt`
- **Seed:** `1793700900000`
- **Generation Sample (Offending Variations):**
  - *Var 10:* `사흘에 나이가 배가 고파요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #1169 세 (Noun) - "years old (Sino-Korean age counter)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1169 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1169.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1175 열흘 (Noun) - "ten days"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1175 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1175.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1177 이틀 (Noun) - "two days"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1177 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1177.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1179 하루 (Noun) - "one day"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1179 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1179.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1180 후 (Noun) - "after, later (Sino-Korean)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1180 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1180.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1191 부탁 (Noun) - "request, favor"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1191 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1191.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1200 부장 (Noun) - "department manager, head of department"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1200 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1200.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1201 서류 (Noun) - "document, paper"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1201 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1201.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1213 광화문 (Noun) - "Gwanghwamun (historic gate/place in Seoul)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1213 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1213.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1214 교통카드 (Noun) - "transit card, transportation card"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1214 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1214.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1217 노선도 (Noun) - "route map, transit map"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1217 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1217.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1218 노약자석 (Noun) - "priority seat (for elderly, disabled, pregnant)"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1218 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1218.txt`
- **Seed:** `1793700900000`
- **Generation Sample (Offending Variations):**
  - *Var 6:* `사나이는 노약자석에서 문을 예매할 거예요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #1220 단말기 (Noun) - "terminal (card reader device)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1220 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1220.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1222 반대 (Noun) - "opposite, opposition"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1222 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1222.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1223 벨 (Noun) - "bell"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1223 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1223.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1225 손잡이 (Noun) - "handle, handrail, strap"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1225 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1225.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1226 스크린도어 (Noun) - "screen door (subway platform door)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1226 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1226.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1227 승강장 (Noun) - "platform (train, subway)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1227 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1227.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1228 안전선 (Noun) - "safety line"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1228 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1228.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1229 여의도역 (Noun) - "Yeouido Station"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1229 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1229.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1231 요금 (Noun) - "fare, fee"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1231 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1231.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1232 을지로입구역 (Noun) - "Euljiro 1-ga Station"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1232 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1232.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1233 이태원역 (Noun) - "Itaewon Station"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1233 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1233.txt`
- **Seed:** `1793700900000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `사나이는 이태원역에서 뭘 세워요.`
  - *Var 10:* `사나이는 이태원역에 태어나요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #1234 종로 (Noun) - "Jongno (street/area in Seoul)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1234 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1234.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1235 줄 (Noun) - "line, queue, rope, string"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1235 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1235.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1236 쪽 (Noun) - "direction, side, page"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1236 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1236.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1237 홍대 (Noun) - "Hongdae (Hongik University area)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1237 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1237.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1238 홍대입구역 (Noun) - "Hongik Univ. Station"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1238 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1238.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1243 경복궁 (Noun) - "Gyeongbokgung Palace"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1243 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1243.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1244 광장 시장 (Noun) - "Gwangjang Market"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1244 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1244.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1245 기사 (Noun) - "driver, technician, article (news)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1245 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1245.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1248 삼거리 (Noun) - "three-way intersection"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1248 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1248.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1250 우회전 (Noun) - "right turn"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1250 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1250.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1251 유턴 (Noun) - "U-turn"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1251 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1251.txt`
- **Seed:** `1793700900000`
- **Generation Sample (Offending Variations):**
  - *Var 5:* `사나이는 유턴을 준비했어요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #1252 좌회전 (Noun) - "left turn"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1252 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1252.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1254 주차 금지 (Noun) - "no parking"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1254 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1254.txt`
- **Seed:** `1793700900000`
- **Generation Sample (Offending Variations):**
  - *Var 3:* `아저씨는 주차 금지를 이용할 거예요.`
  - *Var 4:* `주차 금지가 싸요.`
  - *Var 7:* `형제는 주차 금지를 이용해요.`
  - **Linguistic Error:** Semantic category violation: Prohibition rule/sign '주차 금지' (no parking) paired with facility utilization (*'주차 금지를 이용할 거예요'*) and commercial price statives (*'주차 금지가 싸요'*).
  - **Suggested Remediation:** Tag '주차 금지' strictly as [traffic_rule, signage]; exclude from commercial facility / pricing contexts.

### Unit #1255 주차장 (Noun) - "parking lot"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1255 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1255.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1257 직진 (Noun) - "go straight"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1257 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1257.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1258 출퇴근 (Noun) - "commuting to and from work"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1258 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1258.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1264 마지막 (Noun) - "last, final"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1264 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1264.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1265 메모 (Noun) - "note, memo"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1265 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1265.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1267 버튼 (Noun) - "button"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1267 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1267.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1279 교환 (Noun) - "exchange, swap"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1279 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1279.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1280 기간 (Noun) - "period, duration"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1280 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1280.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1282 등록 (Noun) - "registration, enrollment"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1282 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1282.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1283 등록금 (Noun) - "tuition fee"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1283 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1283.txt`
- **Seed:** `1793700900000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `누나는 등록금을 전공해요.`
  - *Var 3:* `영수는 등록금을 전공할 거예요.`
  - *Var 5:* `기자는 등록금을 전공했어요.`
  - **Linguistic Error:** Semantic tag over-generalization: Financial fee noun '등록금' (tuition fee) carries the 'academic' tag, causing it to be selected as an academic field of study / major with '전공하다' (*'누나는 등록금을 전공해요'*, *'영수는 등록금을 전공할 거예요'*).
  - **Suggested Remediation:** Re-tag Unit 1283 '등록금' to [finance, academic_fee] and exclude from [academic_field, major].

### Unit #1284 시간표 (Noun) - "timetable, class schedule"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1284 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1284.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1285 신청서 (Noun) - "application form"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1285 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1285.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1288 취소 (Noun) - "cancellation"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1288 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1288.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1289 홈페이지 (Noun) - "website, homepage"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1289 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1289.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

