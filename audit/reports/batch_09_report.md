# Linguistic Audit Report: Batch 09 (Nouns (Part C))

> **Batch ID:** 09  
> **Category:** Nouns (Part C)  
> **Target Manifest:** `audit/batches/batch_09_nouns_part_c.json`  
> **Total In-Scope Units:** 221  
> **PRNG Seed:** `1793700900000`  
> **Date:** 2026-11-04  
> **Evaluation Status:** **COMPLETE (221 / 221 Analyzed)**  
> **Audit Summary:** **Clean: 221 units (100.0%) | Flagged: 0 units (0.0%)**  

---

## 1. Executive Summary & Critical Linguistic Findings

Batch 09 audits 221 Nouns spanning condiments, culinary ingredients, academic terms, furniture, containers, and abstract concepts.
Following Round 1 findings and Round 2 targeted remediation, all 221 units were generated with seed 1793700900000 and evaluated, achieving 100% clean sentence generation.

### Key Round 2 Remediations Verified:
1. Rule and Prohibition Argument Restraints ('주차 금지', ID 1254): Excluded instrumental action verbs ('이용하다', '사용하다') and commercial pricing statives from traffic rules and prohibition nouns, restricting them to cognitive/normative frames ('주차 금지가 중요해요', '주차 금지를 기억해요').
2. Academic Domain Scoping on Tuition Fees ('등록금', ID 1283): Re-scoped financial fee noun '등록금' to prevent it from being selected as an academic field of study with '전공하다' (*'등록금을 전공해요'*).
3. Culinary Condiment Collocation Precision ('고추장', ID 933; '참기름', ID 989): Paste condiments and cooking oils separated from solid physical food manipulation (slicing, pancake griddling, mincing).
4. Furniture & Container Verb Restrictions ('책장', ID 991; '배낭', ID 1031): Physical storage items restricted to spatial/utilitarian frames, barred from cognitive comprehension (*'배낭을 이해해요'*) and occupational resignation (*'책장을 그만둬요'*).
5. Anti-Self-Exaltation Enforcement: 1st-person plural subject '우리' strictly prevented from selecting elder-exalting suppletive predicates (*'우리는 양파를 잡수셨어요'*).

---

## 2. Detailed Linguistic Audit Findings

### Unit #853 큰아버지 (Noun) - "paternal uncle (father's older brother)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 853 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_853.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '큰아버지' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #854 큰어머니 (Noun) - "aunt (wife of father's older brother)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 854 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_854.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '큰어머니' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #858 거리 (Noun) - "street, road, distance"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 858 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_858.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '거리' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #859 구경거리 (Noun) - "attraction, sight to see"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 859 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_859.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '구경거리' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #860 남해 (Noun) - "South Sea (of Korea)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 860 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_860.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '남해' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #862 도시 (Noun) - "city"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 862 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_862.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '도시' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #863 동창회 (Noun) - "alumni association, reunion"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 863 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_863.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '동창회' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #864 롤러코스터 (Noun) - "roller coaster"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 864 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_864.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '롤러코스터' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #865 빌딩 (Noun) - "building"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 865 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_865.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '빌딩' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #866 서해 (Noun) - "West Sea (Yellow Sea)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 866 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_866.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '서해' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #867 섬 (Noun) - "island"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 867 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_867.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '섬' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #868 숲 (Noun) - "forest, woods"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 868 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_868.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '숲' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #869 시골 (Noun) - "countryside, rural area"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 869 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_869.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '시골' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #871 온천 (Noun) - "hot spring"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 871 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_871.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '온천' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #874 한라산 (Noun) - "Hallasan (mountain in Jeju)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 874 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_874.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '한라산' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #875 해변 (Noun) - "beach, seashore"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 875 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_875.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '해변' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #876 해산물 (Noun) - "seafood"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 876 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_876.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '해산물' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #880 관광지 (Noun) - "tourist attraction, sight"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 880 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_880.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '관광지' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #896 동네 (Noun) - "neighborhood, village"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 896 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_896.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '동네' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #897 룸메이트 (Noun) - "roommate"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 897 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_897.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '룸메이트' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #898 미용실 (Noun) - "hair salon, beauty parlor"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 898 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_898.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '미용실' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #899 분식집 (Noun) - "snack bar (casual Korean food eatery)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 899 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_899.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '분식집' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #903 약도 (Noun) - "rough map, simplified map, directions sketch"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 903 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_903.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '약도' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #905 이삿짐 (Noun) - "moving luggage, household belongings for moving"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 905 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_905.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이삿짐' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #906 이삿짐센터 (Noun) - "moving company"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 906 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_906.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이삿짐센터' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #908 주유소 (Noun) - "gas station"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 908 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_908.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '주유소' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #909 짐 (Noun) - "luggage, load, baggage"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 909 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_909.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '짐' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #910 찜질방 (Noun) - "Korean sauna, bathhouse"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 910 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_910.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '찜질방' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #913 거실 (Noun) - "living room"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 913 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_913.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '거실' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #917 베란다 (Noun) - "veranda, balcony"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 917 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_917.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '베란다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #918 벽 (Noun) - "wall"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 918 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_918.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '벽' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #919 부엌 (Noun) - "kitchen"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 919 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_919.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '부엌' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #921 서재 (Noun) - "study room, library (in a home)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 921 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_921.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '서재' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #922 세탁기 (Noun) - "washing machine"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 922 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_922.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '세탁기' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #923 소파 (Noun) - "sofa, couch"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 923 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_923.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '소파' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #924 수건 (Noun) - "towel"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 924 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_924.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '수건' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #925 식탁 (Noun) - "dining table"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 925 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_925.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '식탁' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #926 옷장 (Noun) - "closet, wardrobe"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 926 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_926.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '옷장' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #927 욕실 (Noun) - "bathroom"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 927 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_927.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '욕실' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #928 주변 (Noun) - "surroundings, vicinity"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 928 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_928.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '주변' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #929 현관 (Noun) - "main entrance, front door, foyer"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 929 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_929.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '현관' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #933 고추장 (Noun) - "red chili paste"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 933 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_933.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '고추장' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #937 된장 (Noun) - "soybean paste"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 937 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_937.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '된장' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #939 명절 (Noun) - "traditional holiday"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 939 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_939.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '명절' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #940 방법 (Noun) - "method, way"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 940 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_940.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '방법' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #943 삼성역 (Noun) - "Samseong Station"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 943 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_943.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '삼성역' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #945 설탕 (Noun) - "sugar"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 945 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_945.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '설탕' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #946 소고기 (Noun) - "beef"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 946 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_946.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '소고기' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #947 소금 (Noun) - "salt"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 947 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_947.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '소금' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #948 스트레스 (Noun) - "stress"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 948 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_948.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '스트레스' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #949 식초 (Noun) - "vinegar"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 949 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_949.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '식초' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #950 양념 (Noun) - "seasoning, marinade, sauce"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 950 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_950.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '양념' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #952 인사동 (Noun) - "Insadong (neighborhood in Seoul)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 952 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_952.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '인사동' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #953 접시 (Noun) - "plate, dish"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 953 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_953.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '접시' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #955 후추 (Noun) - "black pepper"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 955 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_955.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '후추' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #960 간 (Noun) - "seasoning, salty taste, liver"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 960 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_960.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '간' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #961 감자 (Noun) - "potato"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 961 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_961.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '감자' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #962 고기 (Noun) - "meat"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 962 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_962.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '고기' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #964 기름 (Noun) - "oil, grease"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 964 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_964.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '기름' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #967 냄비 (Noun) - "pot, saucepan"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 967 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_967.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '냄비' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #969 닭고기 (Noun) - "chicken meat"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 969 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_969.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '닭고기' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #970 당근 (Noun) - "carrot"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 970 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_970.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '당근' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #971 돼지고기 (Noun) - "pork"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 971 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_971.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '돼지고기' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #973 면 (Noun) - "noodles, side, face, surface"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 973 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_973.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '면' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #975 버섯 (Noun) - "mushroom"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 975 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_975.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '버섯' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #979 설렁탕 (Noun) - "ox bone soup (seolleongtang)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 979 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_979.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '설렁탕' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #980 소스 (Noun) - "sauce"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 980 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_980.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '소스' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #982 쓰레기 (Noun) - "trash, garbage"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 982 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_982.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '쓰레기' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #983 쓰레기통 (Noun) - "trash can, wastebasket"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 983 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_983.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '쓰레기통' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #984 양파 (Noun) - "onion"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 984 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_984.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '양파' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #985 요리법 (Noun) - "recipe, cooking method"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 985 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_985.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '요리법' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #987 재료 (Noun) - "ingredient, material"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 987 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_987.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '재료' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #989 참기름 (Noun) - "sesame oil"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 989 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_989.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '참기름' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #990 채소 (Noun) - "vegetable"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 990 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_990.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '채소' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #991 책장 (Noun) - "bookshelf, bookcase"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 991 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_991.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '책장' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #993 파 (Noun) - "green onion, scallion"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 993 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_993.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '파' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #994 프라이팬 (Noun) - "frying pan"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 994 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_994.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '프라이팬' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #998 감 (Noun) - "persimmon, feeling, sense"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 998 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_998.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '감' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #999 냉동식품 (Noun) - "frozen food"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 999 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_999.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '냉동식품' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1000 대회 (Noun) - "competition, contest, tournament"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1000 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1000.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '대회' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1001 마트 (Noun) - "mart, supermarket"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1001 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1001.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '마트' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1002 방석 (Noun) - "floor cushion"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1002 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1002.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '방석' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1003 배추 (Noun) - "napa cabbage, Chinese cabbage"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1003 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1003.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '배추' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1004 비누 (Noun) - "soap"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1004 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1004.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '비누' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1005 생수 (Noun) - "bottled mineral water"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1005 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1005.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '생수' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1006 생활용품 (Noun) - "household items, daily necessities"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1006 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1006.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '생활용품' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1007 소리 (Noun) - "sound, noise"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1007 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1007.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '소리' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1008 식료품 (Noun) - "groceries, foodstuffs"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1008 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1008.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '식료품' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1009 음료 (Noun) - "beverage, drink"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1009 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1009.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '음료' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1010 이불 (Noun) - "blanket, duvet, bedding"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1010 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1010.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이불' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1011 참외 (Noun) - "Korean melon (oriental melon)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1011 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1011.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '참외' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1012 치약 (Noun) - "toothpaste"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1012 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1012.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '치약' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1013 칫솔 (Noun) - "toothbrush"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1013 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1013.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '칫솔' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1014 토마토 (Noun) - "tomato"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1014 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1014.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '토마토' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1016 포도 (Noun) - "grape"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1016 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1016.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '포도' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1017 포스터 (Noun) - "poster"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1017 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1017.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '포스터' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1018 햄 (Noun) - "ham"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1018 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1018.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '햄' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1023 가전제품 (Noun) - "home appliances, electronic goods"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1023 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1023.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '가전제품' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1024 귀걸이 (Noun) - "earrings"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1024 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1024.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '귀걸이' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1025 남성복 (Noun) - "men's clothing"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1025 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1025.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '남성복' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1026 둘다 (Noun) - "both"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1026 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1026.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '둘다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1027 매장 (Noun) - "shop, store, sales floor"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1027 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1027.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '매장' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1029 목걸이 (Noun) - "necklace"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1029 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1029.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '목걸이' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1030 반지 (Noun) - "ring (jewelry)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1030 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1030.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '반지' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1031 배낭 (Noun) - "backpack, rucksack"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1031 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1031.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '배낭' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1032 상품 (Noun) - "product, merchandise, prize"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1032 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1032.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '상품' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1034 수영복 (Noun) - "swimsuit, swimwear"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1034 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1034.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '수영복' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1035 스포츠용품 (Noun) - "sporting goods"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1035 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1035.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '스포츠용품' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1037 여성복 (Noun) - "women's clothing"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1037 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1037.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '여성복' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1038 장갑 (Noun) - "gloves"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1038 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1038.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '장갑' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1040 패션잡화 (Noun) - "fashion accessories, fashion goods"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1040 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1040.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '패션잡화' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1041 할인 (Noun) - "discount, reduction"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1041 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1041.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '할인' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1043 핸드백 (Noun) - "handbag, purse"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1043 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1043.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '핸드백' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1052 반바지 (Noun) - "shorts, short pants"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1052 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1052.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '반바지' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1053 보라색 (Noun) - "purple"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1053 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1053.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '보라색' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1054 분홍색 (Noun) - "pink"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1054 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1054.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '분홍색' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1055 색깔 (Noun) - "color"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1055 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1055.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '색깔' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1056 양복 (Noun) - "suit, formal attire"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1056 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1056.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '양복' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1057 운동복 (Noun) - "sportswear, athletic clothes"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1057 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1057.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '운동복' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1058 원피스 (Noun) - "dress, one-piece suit"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1058 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1058.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '원피스' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1060 점퍼 (Noun) - "jumper, jacket"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1060 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1060.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '점퍼' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1061 조끼 (Noun) - "vest, waistcoat"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1061 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1061.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '조끼' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1062 청바지 (Noun) - "jeans, denim pants"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1062 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1062.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '청바지' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1064 하늘색 (Noun) - "sky blue"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1064 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1064.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '하늘색' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1065 회색 (Noun) - "gray"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1065 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1065.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '회색' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1066 흰색 (Noun) - "white"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1066 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1066.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '흰색' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1077 모양 (Noun) - "shape, form, appearance"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1077 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1077.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '모양' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1081 사이즈 (Noun) - "size"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1081 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1081.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '사이즈' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1084 월급 (Noun) - "monthly salary, wage"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1084 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1084.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '월급' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1087 주머니 (Noun) - "pocket, pouch"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1087 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1087.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '주머니' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1088 첫 (Noun) - "first (determiner)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1088 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1088.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '첫' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1093 ㅎ동사 (Noun) - "h-irregular verbs (grammatical category)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1093 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1093.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit 'ㅎ동사' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1094 강아지 (Noun) - "puppy, dog"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1094 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1094.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '강아지' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1095 기대 (Noun) - "expectation, anticipation"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1095 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1095.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '기대' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1096 도움 (Noun) - "help, assistance"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1096 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1096.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '도움' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1097 동아리 (Noun) - "club, student group"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1097 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1097.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '동아리' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1098 동창 (Noun) - "classmate, alumnus"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1098 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1098.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '동창' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1099 동해 (Noun) - "East Sea (Sea of Japan)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1099 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1099.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '동해' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1100 동호회 (Noun) - "club, interest group, society"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1100 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1100.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '동호회' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1105 모임 (Noun) - "meeting, gathering, get-together"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1105 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1105.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '모임' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1106 송별회 (Noun) - "farewell party"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1106 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1106.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '송별회' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1108 초대장 (Noun) - "invitation card"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1108 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1108.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '초대장' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1111 환영회 (Noun) - "welcome party"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1111 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1111.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '환영회' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1112 회비 (Noun) - "membership fee, dues"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1112 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1112.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '회비' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1115 꽃바구니 (Noun) - "flower basket"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1115 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1115.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '꽃바구니' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1116 떡 (Noun) - "rice cake"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1116 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1116.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '떡' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1119 벽시계 (Noun) - "wall clock"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1119 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1119.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '벽시계' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1120 부인 (Noun) - "wife (honorific)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1120 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1120.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '부인' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1121 부케 (Noun) - "bouquet (wedding)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1121 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1121.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '부케' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1122 분위기 (Noun) - "atmosphere, mood, ambiance"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1122 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1122.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '분위기' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1123 샐러드 (Noun) - "salad"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1123 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1123.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '샐러드' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1124 샤부샤부 (Noun) - "shabu-shabu (hot pot)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1124 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1124.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '샤부샤부' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1125 선배 (Noun) - "senior (at school or work)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1125 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1125.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '선배' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1126 세제 (Noun) - "detergent, cleaning agent"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1126 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1126.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '세제' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1129 앨범 (Noun) - "album (photo or music)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1129 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1129.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '앨범' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1131 잡채 (Noun) - "japchae (stir-fried glass noodles with vegetables)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1131 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1131.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '잡채' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1133 주방용품 (Noun) - "kitchenware, kitchen utensils"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1133 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1133.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '주방용품' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1134 집들이 (Noun) - "housewarming party"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1134 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1134.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '집들이' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1135 찻잔 (Noun) - "teacup"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1135 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1135.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '찻잔' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1136 향초 (Noun) - "scented candle"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1136 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1136.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '향초' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1137 화분 (Noun) - "flowerpot, potted plant"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1137 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1137.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '화분' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1138 휴지 (Noun) - "tissue, toilet paper"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1138 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1138.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '휴지' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1144 뒤풀이 (Noun) - "after-party, post-event gathering"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1144 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1144.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '뒤풀이' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1145 말 (Noun) - "word, speech, language, horse"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1145 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1145.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '말' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1149 성함 (Noun) - "name (honorific)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1149 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1149.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '성함' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1150 세상 (Noun) - "world, society"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1150 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1150.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '세상' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1152 연세 (Noun) - "age (honorific)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1152 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1152.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '연세' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1155 진지 (Noun) - "meal (honorific)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1155 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1155.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '진지' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1161 나흘 (Noun) - "four days"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1161 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1161.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '나흘' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1162 닷새 (Noun) - "five days"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1162 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1162.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '닷새' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1165 사흘 (Noun) - "three days"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1165 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1165.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '사흘' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1169 세 (Noun) - "years old (Sino-Korean age counter)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1169 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1169.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '세' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1175 열흘 (Noun) - "ten days"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1175 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1175.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '열흘' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1177 이틀 (Noun) - "two days"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1177 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1177.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이틀' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1179 하루 (Noun) - "one day"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1179 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1179.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '하루' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1180 후 (Noun) - "after, later (Sino-Korean)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1180 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1180.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '후' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1191 부탁 (Noun) - "request, favor"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1191 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1191.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '부탁' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1200 부장 (Noun) - "department manager, head of department"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1200 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1200.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '부장' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1201 서류 (Noun) - "document, paper"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1201 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1201.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '서류' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1213 광화문 (Noun) - "Gwanghwamun (historic gate/place in Seoul)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1213 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1213.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '광화문' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1214 교통카드 (Noun) - "transit card, transportation card"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1214 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1214.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '교통카드' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1217 노선도 (Noun) - "route map, transit map"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1217 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1217.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '노선도' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1218 노약자석 (Noun) - "priority seat (for elderly, disabled, pregnant)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1218 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1218.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '노약자석' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1220 단말기 (Noun) - "terminal (card reader device)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1220 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1220.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '단말기' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1222 반대 (Noun) - "opposite, opposition"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1222 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1222.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '반대' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1223 벨 (Noun) - "bell"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1223 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1223.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '벨' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1225 손잡이 (Noun) - "handle, handrail, strap"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1225 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1225.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '손잡이' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1226 스크린도어 (Noun) - "screen door (subway platform door)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1226 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1226.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '스크린도어' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1227 승강장 (Noun) - "platform (train, subway)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1227 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1227.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '승강장' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1228 안전선 (Noun) - "safety line"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1228 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1228.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '안전선' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1229 여의도역 (Noun) - "Yeouido Station"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1229 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1229.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '여의도역' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1231 요금 (Noun) - "fare, fee"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1231 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1231.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '요금' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1232 을지로입구역 (Noun) - "Euljiro 1-ga Station"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1232 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1232.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '을지로입구역' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1233 이태원역 (Noun) - "Itaewon Station"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1233 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1233.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이태원역' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1234 종로 (Noun) - "Jongno (street/area in Seoul)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1234 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1234.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '종로' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1235 줄 (Noun) - "line, queue, rope, string"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1235 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1235.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '줄' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1236 쪽 (Noun) - "direction, side, page"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1236 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1236.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '쪽' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1237 홍대 (Noun) - "Hongdae (Hongik University area)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1237 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1237.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '홍대' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1238 홍대입구역 (Noun) - "Hongik Univ. Station"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1238 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1238.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '홍대입구역' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1243 경복궁 (Noun) - "Gyeongbokgung Palace"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1243 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1243.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '경복궁' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1244 광장 시장 (Noun) - "Gwangjang Market"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1244 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1244.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '광장 시장' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1245 기사 (Noun) - "driver, technician, article (news)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1245 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1245.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '기사' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1248 삼거리 (Noun) - "three-way intersection"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1248 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1248.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '삼거리' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1250 우회전 (Noun) - "right turn"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1250 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1250.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '우회전' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1251 유턴 (Noun) - "U-turn"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1251 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1251.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '유턴' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1252 좌회전 (Noun) - "left turn"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1252 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1252.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '좌회전' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1254 주차 금지 (Noun) - "no parking"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1254 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1254.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '주차 금지' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1255 주차장 (Noun) - "parking lot"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1255 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1255.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '주차장' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1257 직진 (Noun) - "go straight"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1257 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1257.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '직진' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1258 출퇴근 (Noun) - "commuting to and from work"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1258 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1258.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '출퇴근' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1264 마지막 (Noun) - "last, final"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1264 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1264.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '마지막' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1265 메모 (Noun) - "note, memo"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1265 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1265.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '메모' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1267 버튼 (Noun) - "button"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1267 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1267.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '버튼' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1279 교환 (Noun) - "exchange, swap"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1279 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1279.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '교환' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1280 기간 (Noun) - "period, duration"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1280 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1280.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '기간' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1282 등록 (Noun) - "registration, enrollment"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1282 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1282.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '등록' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1283 등록금 (Noun) - "tuition fee"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1283 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1283.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '등록금' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1284 시간표 (Noun) - "timetable, class schedule"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1284 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1284.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '시간표' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1285 신청서 (Noun) - "application form"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1285 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1285.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '신청서' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1288 취소 (Noun) - "cancellation"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1288 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1288.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '취소' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1289 홈페이지 (Noun) - "website, homepage"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1289 -eng none --ast -sentence 10 --seed 1793700900000 -o scratch/audit/unit_1289.txt`
- **Seed:** `1793700900000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '홈페이지' functions correctly within its syntactic slot without allomorphic or case errors.

