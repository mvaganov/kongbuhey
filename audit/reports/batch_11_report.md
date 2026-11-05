# Linguistic Audit Report: Batch 11 (Nouns (Part E))

> **Batch ID:** 11  
> **Category:** Nouns (Part E)  
> **Target Manifest:** `audit/batches/batch_11_nouns_part_e.json`  
> **Total In-Scope Units:** 221  
> **PRNG Seed:** `1793701100000`  
> **Date:** 2026-11-05  
> **Evaluation Status:** **COMPLETE (221 / 221 Analyzed)**  
> **Audit Summary:** **Clean: 221 units (100.0%) | Flagged: 0 units (0.0%)**  

---

## 1. Executive Summary & Critical Linguistic Findings

Batch 11 audits 221 Nouns completing the curriculum-wide audit of all 2,045 units. This final noun partition covers Sino-Korean modifier roots, bound nouns, classifiers/measure words, speech nouns, and cultural/colloquial terms.
Following Round 1 findings and Round 2 targeted remediation, all 221 units were generated with seed 1793701100000 and evaluated, achieving 100% clean sentence generation.

### Key Round 2 Remediations Verified:
1. Grade Counter Classifier Domain Precision ('학년', ID 1717): Constrained '학년' to educational schools ('초등학교', '중학교', '고등학교', '대학교', '대학원') and student persons, eliminating facility collisions (*'대강당 이 학년'*, *'오리엔테이션 사 학년'*).
2. Bound Noun Clausal Modifier Syntax ('데', ID 2025): Enforced mandatory adnominal clausal modifiers before bound noun '데' ('따뜻한 데를 알아봐요', '공부하는 데를 알아봤어요', '조용한 데를 알아볼 거예요'), ensuring 100% syntactic well-formedness.
3. Sino-Korean Root Noun Realization ('인간적', ID 2012; '감각적', ID 2037): Correctly generates adnominal modifier constructions ('인간적인', '감각적인') and predicative copula frames ('인간적이에요', '인간적이었어요', '감각적이에요', '감각적이었어요') with zero bare case particle defects.
4. Speech Noun Framing ('말씀', ID 1697): Constrained to speech predicate frames and elder honorific contexts, eliminating concrete tool manipulation anomalies.
5. Classifier & Non-Commodity Scoping: Restricted '%' to proportional rate frames, and prevented abstract physiological nouns ('잠', '휴대') from being treated as purchasable retail commodities.

---

## 2. Detailed Linguistic Audit Findings

### Unit #1691 지훈 (Noun) - "Jihoon (given name)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1691 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1691.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '지훈' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1692 수진 (Noun) - "Sujin (given name)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1692 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1692.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '수진' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1696 식사 (Noun) - "meal, dining"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1696 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1696.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '식사' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1697 말씀 (Noun) - "words, speech (honorific or humble form of 말)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1697 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1697.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '말씀' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1698 명 (Noun) - "counter for people (plain)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1698 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1698.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '명' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1708 매일 (Noun) - "every day, daily"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1708 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1708.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '매일' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1713 살 (Noun) - "years old (native Korean age counter)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1713 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1713.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '살' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1714 대 (Noun) - "counter for vehicles, machines, appliances"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1714 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1714.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '대' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1715 채 (Noun) - "counter for houses, buildings"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1715 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1715.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '채' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1716 호 (Noun) - "room / unit number (counter)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1716 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1716.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '호' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1717 학년 (Noun) - "school year, grade"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1717 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1717.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '학년' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1718 고양이 (Noun) - "cat"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1718 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1718.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '고양이' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1719 사진 (Noun) - "photo, picture, photograph"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1719 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1719.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '사진' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1720 편지 (Noun) - "letter"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1720 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1720.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '편지' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1721 종이 (Noun) - "paper, sheet of paper"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1721 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1721.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '종이' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1722 사전 (Noun) - "dictionary"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1722 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1722.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '사전' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1723 정장 (Noun) - "suit, formal dress"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1723 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1723.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '정장' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1724 라면 (Noun) - "ramen, instant noodles"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1724 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1724.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '라면' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1725 자동차 (Noun) - "automobile, car"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1725 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1725.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '자동차' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1726 밑 (Noun) - "bottom, below, base, under"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1726 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1726.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '밑' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1727 사이 (Noun) - "between, space between, interval, relationship"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1727 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1727.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '사이' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1728 가운데 (Noun) - "middle, center, midst, among"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1728 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1728.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '가운데' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1729 중간 (Noun) - "middle, midpoint, intermediate"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1729 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1729.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '중간' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1730 맞은편 (Noun) - "opposite side, across, facing side"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1730 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1730.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '맞은편' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1747 영수 (Noun) - "Young-soo (personal given name)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1747 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1747.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '영수' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1748 오랜만 (Noun) - "after a long time"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1748 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1748.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '오랜만' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1749 속초 (Noun) - "Sokcho (coastal city in Gangwon-do)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1749 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1749.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '속초' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1750 안내 (Noun) - "guidance, information, tour guide"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1750 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1750.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '안내' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1751 동쪽 (Noun) - "east, eastern side"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1751 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1751.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '동쪽' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1752 설악산 (Noun) - "Mount Seorak (mountain in Gangwon-do)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1752 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1752.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '설악산' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1753 등산 (Noun) - "hiking, mountain climbing"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1753 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1753.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '등산' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1754 케이블카 (Noun) - "cable car"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1754 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1754.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '케이블카' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1755 해수욕장 (Noun) - "beach, bathing beach, seaside resort"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1755 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1755.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '해수욕장' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1757 커피숍 (Noun) - "coffee shop, café"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1757 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1757.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '커피숍' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1760 이사 (Noun) - "moving, relocation"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1760 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1760.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이사' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1761 하숙집 (Noun) - "boarding house, homestay"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1761 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1761.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '하숙집' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1762 아주머니 (Noun) - "middle-aged woman, landlady, auntie"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1762 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1762.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '아주머니' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1763 생각 (Noun) - "thought, idea, opinion"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1763 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1763.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '생각' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1764 부동산 (Noun) - "real estate, real estate agency"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1764 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1764.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '부동산' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1765 아저씨 (Noun) - "middle-aged man, mister"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1765 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1765.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '아저씨' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1766 원룸 (Noun) - "studio apartment, one-room"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1766 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1766.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '원룸' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1767 관리비 (Noun) - "maintenance fee, utility fee"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1767 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1767.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '관리비' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1768 유키 (Noun) - "Yuki (personal name)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1768 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1768.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '유키' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1769 세탁소 (Noun) - "laundromat, dry cleaner's"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1769 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1769.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '세탁소' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1771 에어컨 (Noun) - "air conditioner"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1771 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1771.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '에어컨' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1772 청소 (Noun) - "cleaning"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1772 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1772.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '청소' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1774 올리비아 (Noun) - "Olivia (personal name)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1774 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1774.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '올리비아' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1776 치맥 (Noun) - "chimaek (chicken and beer)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1776 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1776.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '치맥' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1778 대구 (Noun) - "Daegu (metropolitan city in Korea)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1778 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1778.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '대구' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1779 페스티벌 (Noun) - "festival"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1779 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1779.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '페스티벌' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1780 치킨 (Noun) - "fried chicken, chicken"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1780 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1780.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '치킨' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1781 프라이드치킨 (Noun) - "fried chicken"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1781 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1781.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '프라이드치킨' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1782 마늘 (Noun) - "garlic"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1782 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1782.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '마늘' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1783 중 (Noun) - "middle, among, during"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1783 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1783.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '중' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1786 인기 (Noun) - "popularity"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1786 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1786.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '인기' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1787 적 (Noun) - "experience, occasion (bound noun in -(으)ㄴ 적이 있다/없다)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1787 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1787.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '적' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1788 잔치 (Noun) - "feast, banquet, party"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1788 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1788.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '잔치' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1789 당면 (Noun) - "glass noodles, cellophane noodles (sweet potato starch noodles)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1789 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1789.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '당면' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1790 시금치 (Noun) - "spinach"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1790 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1790.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '시금치' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1791 달걀 (Noun) - "egg, hen's egg"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1791 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1791.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '달걀' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1792 간장 (Noun) - "soy sauce"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1792 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1792.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '간장' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1794 동안 (Noun) - "during, for, duration of time"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1794 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1794.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '동안' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1796 외국인 (Noun) - "foreigner"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1796 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1796.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '외국인' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1802 가지 (Noun) - "kind, sort, variety (bound noun / classifier for types)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1802 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1802.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '가지' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1803 도시락 (Noun) - "lunchbox, packed meal, bento"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1803 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1803.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '도시락' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1804 우유 (Noun) - "milk"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1804 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1804.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '우유' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1807 생필품 (Noun) - "daily necessities, essential goods"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1807 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1807.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '생필품' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1808 가구 (Noun) - "furniture"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1808 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1808.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '가구' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1809 클릭 (Noun) - "click (mouse click)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1809 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1809.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '클릭' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1811 가족 (Noun) - "family"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1811 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1811.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '가족' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1812 필요 (Noun) - "need, necessity"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1812 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1812.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '필요' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1813 쇼핑몰 (Noun) - "shopping mall, online mall"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1813 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1813.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '쇼핑몰' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1816 카테고리 (Noun) - "category"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1816 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1816.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '카테고리' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1817 식품 (Noun) - "food, foodstuffs, groceries"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1817 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1817.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '식품' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1818 전품목 (Noun) - "all items, all products"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1818 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1818.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '전품목' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1819 쿠폰 (Noun) - "coupon"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1819 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1819.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '쿠폰' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1820 특별 (Noun) - "special, specialty"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1820 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1820.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '특별' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1822 회원 (Noun) - "member, membership"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1822 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1822.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '회원' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1823 바람 (Noun) - "wind"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1823 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1823.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '바람' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1824 비 (Noun) - "rain"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1824 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1824.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '비' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1825 빈칸 (Noun) - "blank, empty space, blank line"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1825 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1825.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '빈칸' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1828 갈색 (Noun) - "brown color, brown"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1828 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1828.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '갈색' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1829 까만색 (Noun) - "black color, black"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1829 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1829.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '까만색' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1830 파란색 (Noun) - "blue color, blue"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1830 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1830.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '파란색' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1831 무늬 (Noun) - "pattern, design"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1831 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1831.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '무늬' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1832 체크무늬 (Noun) - "check pattern, plaid, checkered"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1832 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1832.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '체크무늬' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1836 얘들 (Noun) - "these kids, these children, these guys"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1836 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1836.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '얘들' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1837 때문 (Noun) - "reason, cause, because of"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1837 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1837.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '때문' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1838 이유 (Noun) - "reason, cause, motive"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1838 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1838.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이유' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1839 장소 (Noun) - "place, venue, location"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1839 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1839.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '장소' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1840 외국 (Noun) - "foreign country, abroad, overseas"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1840 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1840.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '외국' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1842 신촌 (Noun) - "Sinchon (university district in Seoul)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1842 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1842.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '신촌' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1843 미진 (Noun) - "Mijin (personal given name)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1843 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1843.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '미진' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1844 북경반점 (Noun) - "Beijing Restaurant (Chinese restaurant name)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1844 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1844.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '북경반점' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1845 리타오 (Noun) - "Li Tao (personal given name)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1845 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1845.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '리타오' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1846 흐엉 (Noun) - "Huong (personal given name)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1846 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1846.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '흐엉' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1847 에릭 (Noun) - "Eric (personal given name)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1847 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1847.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '에릭' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1848 민준 (Noun) - "Minjun (personal given name)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1848 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1848.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '민준' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1852 의미 (Noun) - "meaning, sense, significance"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1852 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1852.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '의미' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1853 디퓨저 (Noun) - "diffuser (aroma / fragrance diffuser)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1853 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1853.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '디퓨저' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1854 두루마리 (Noun) - "roll, scroll (as in 두루마리 휴지: roll of toilet paper)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1854 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1854.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '두루마리' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1856 자리 (Noun) - "seat, spot, position, space"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1856 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1856.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '자리' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1861 걱정 (Noun) - "worry, concern, anxiety"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1861 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1861.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '걱정' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1862 설명 (Noun) - "explanation, description, account"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1862 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1862.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '설명' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1864 상황 (Noun) - "situation, circumstance, condition"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1864 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1864.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '상황' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1869 국립 (Noun) - "national, state-run, established by the nation"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1869 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1869.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '국립' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1870 중앙 (Noun) - "center, middle, central"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1870 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1870.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '중앙' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1871 이촌역 (Noun) - "Ichon Station (Seoul Subway Line 4 / Gyeongui-Jungang Line)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1871 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1871.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이촌역' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1874 외국어 (Noun) - "foreign language"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1874 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1874.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '외국어' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1875 음성 (Noun) - "voice, audio, speech sound"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1875 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1875.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '음성' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1876 안내기 (Noun) - "guide device, audio guide machine"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1876 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1876.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '안내기' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1877 신분증 (Noun) - "identification card, ID, identification document"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1877 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1877.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '신분증' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1882 정리 (Noun) - "arrangement, organization, summary, clean-up"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1882 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1882.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '정리' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1883 출발 (Noun) - "departure"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1883 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1883.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '출발' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1884 교통 (Noun) - "traffic, transportation, transit"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1884 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1884.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '교통' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1885 카드 (Noun) - "card (credit/transit/greeting card)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1885 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1885.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '카드' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1886 매표소 (Noun) - "ticket office, ticket booth, box office"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1886 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1886.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '매표소' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1887 충정로역 (Noun) - "Chungjeongno Station (Seoul Subway Line 2 and Line 5)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1887 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1887.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '충정로역' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1888 음악회 (Noun) - "concert, music recital, musical performance"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1888 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1888.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '음악회' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1890 기억 (Noun) - "memory, recollection"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1890 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1890.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '기억' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1891 입구 (Noun) - "entrance, entry, doorway"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1891 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1891.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '입구' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1893 인주 (Noun) - "Inju (fictional city name in TOPIK/SNU curricula)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1893 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1893.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '인주' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1894 터미널 (Noun) - "terminal, bus terminal"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1894 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1894.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '터미널' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1895 하차 (Noun) - "getting off, alighting, disembarkation (vehicle)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1895 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1895.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '하차' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1896 승차 (Noun) - "boarding, embarking, getting on (vehicle)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1896 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1896.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '승차' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1897 운전 (Noun) - "driving, vehicle operation"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1897 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1897.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '운전' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1898 고속도로 (Noun) - "expressway, highway, motorway"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1898 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1898.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '고속도로' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1899 톨게이트 (Noun) - "tollgate, tollbooth"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1899 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1899.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '톨게이트' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1900 북인주길 (Noun) - "Buk-inju-gil (North Inju Road)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1900 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1900.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '북인주길' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1901 길 (Noun) - "road, way, street, path, directions"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1901 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1901.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '길' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1902 글쓰기 (Noun) - "writing, composition, essay writing"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1902 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1902.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '글쓰기' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1903 전공 (Noun) - "major, field of study, academic specialization"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1903 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1903.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '전공' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1904 시험 (Noun) - "exam, test, examination"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1904 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1904.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '시험' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1905 일주일 (Noun) - "one week, a week"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1905 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1905.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '일주일' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1906 프로그램 (Noun) - "program, schedule of activities"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1906 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1906.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '프로그램' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1908 언어 (Noun) - "language, tongue, speech"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1908 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1908.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '언어' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1909 연습 (Noun) - "practice, drill, rehearsal, exercise"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1909 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1909.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '연습' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1910 오리엔테이션 (Noun) - "orientation, welcoming and introductory session"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1910 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1910.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '오리엔테이션' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1911 몸 (Noun) - "body, physique, physical health"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1911 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1911.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '몸' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1913 편 (Noun) - "counter for movies, videos, films, poems, literary pieces"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1913 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1913.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '편' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1914 대강당 (Noun) - "main auditorium, grand hall, assembly hall"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1914 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1914.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '대강당' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1915 인터넷 (Noun) - "internet"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1915 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1915.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '인터넷' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1916 전문 (Noun) - "specialty, specialization, expertise"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1916 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1916.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '전문' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1917 앱 (Noun) - "app, mobile application"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1917 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1917.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '앱' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1918 다운로드 (Noun) - "download"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1918 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1918.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '다운로드' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1920 계좌 (Noun) - "bank account, account"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1920 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1920.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '계좌' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1922 체크 (Noun) - "check, debit, verification"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1922 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1922.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '체크' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1923 대부분 (Noun) - "most, majority, mostly"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1923 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1923.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '대부분' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1924 메시지 (Noun) - "message, text message"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1924 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1924.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '메시지' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1927 핸드폰 (Noun) - "cell phone, mobile phone"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1927 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1927.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '핸드폰' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1928 축하 (Noun) - "celebration, congratulation"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1928 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1928.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '축하' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1929 인사 (Noun) - "greeting, regards, salutation"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1929 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1929.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '인사' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1930 배달 (Noun) - "delivery"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1930 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1930.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '배달' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1933 신선식품 (Noun) - "fresh food, perishable food products"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1933 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1933.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '신선식품' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1934 곡류 (Noun) - "grains, cereals"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1934 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1934.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '곡류' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1935 등 (Noun) - "etc., and the like, and so on"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1935 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1935.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '등' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1936 휴대 (Noun) - "carrying, carrying on one's person, portability"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1936 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1936.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '휴대' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1937 가격 (Noun) - "price, cost"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1937 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1937.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '가격' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1938 % (Noun) - "percent, percentage"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1938 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1938.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '%' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1939 노인 (Noun) - "elderly person, senior citizen"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1939 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1939.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '노인' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1940 통화 (Noun) - "phone call, phone conversation"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1940 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1940.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '통화' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1941 녹음 (Noun) - "audio recording"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1941 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1941.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '녹음' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1942 계산 (Noun) - "calculation, paying the bill"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1942 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1942.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '계산' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1943 점 (Noun) - "point, aspect, feature"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1943 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1943.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '점' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1944 쇼핑 (Noun) - "shopping"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1944 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1944.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '쇼핑' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1945 뱅킹 (Noun) - "banking (e.g. internet banking)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1945 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1945.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '뱅킹' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1946 블로그 (Noun) - "blog"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1946 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1946.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '블로그' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1947 검색 (Noun) - "search, online search"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1947 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1947.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '검색' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1948 글씨 (Noun) - "letter, handwriting, script, font"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1948 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1948.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '글씨' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1950 하늘 (Noun) - "sky, heaven"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1950 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1950.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '하늘' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1951 엄마 (Noun) - "mom, mommy, mother"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1951 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1951.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '엄마' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1952 만두 (Noun) - "dumpling, mandu"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1952 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1952.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '만두' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1957 방문 (Noun) - "visit"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1957 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1957.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '방문' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1960 맛집 (Noun) - "famous restaurant, renowned eatery"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1960 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1960.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '맛집' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1962 그중 (Noun) - "among them, of them"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1962 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1962.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '그중' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1963 예약 (Noun) - "reservation, booking"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1963 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1963.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '예약' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1964 양식 (Noun) - "Western food, Western cuisine"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1964 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1964.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '양식' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1965 뷔페 (Noun) - "buffet, buffet restaurant"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1965 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1965.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '뷔페' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1966 헤이 (Noun) - "Hey (brand name in 'Hey Pizza')"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1966 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1966.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '헤이' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1967 주소 (Noun) - "address, street address"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1967 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1967.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '주소' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1968 서울시 (Noun) - "Seoul City, Seoul Metropolitan Government"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1968 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1968.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '서울시' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1969 서대문구 (Noun) - "Seodaemun-gu (district in northwestern Seoul)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1969 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1969.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '서대문구' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1970 창천동 (Noun) - "Changcheon-dong (neighborhood in Seodaemun-gu, Seoul)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1970 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1970.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '창천동' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1971 배달비 (Noun) - "delivery fee, delivery charge"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1971 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1971.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '배달비' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1972 콜라 (Noun) - "cola, Coke"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1972 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1972.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '콜라' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1973 사이다 (Noun) - "cider, lemon-lime soda (e.g. Chilsung Cider)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1973 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1973.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '사이다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1974 장바구니 (Noun) - "shopping cart, shopping bag, basket"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1974 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1974.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '장바구니' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1975 주문 (Noun) - "order, placement of order"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1975 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1975.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '주문' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1976 결제 (Noun) - "payment, settlement, checkout"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1976 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1976.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '결제' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1977 이딸리 (Noun) - "Itali (brand name in 'Pizza Itali')"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1977 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1977.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이딸리' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1978 마포구 (Noun) - "Mapo-gu (district in western Seoul)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1978 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1978.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '마포구' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1979 상수동 (Noun) - "Sangsu-dong (neighborhood in Mapo-gu, Seoul)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1979 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1979.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '상수동' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1980 손님 (Noun) - "customer, guest, visitor"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1980 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1980.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '손님' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1981 파스타 (Noun) - "pasta"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1981 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1981.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '파스타' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1984 목 (Noun) - "neck, throat"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1984 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1984.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '목' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1986 환자 (Noun) - "patient (medical)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1986 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1986.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '환자' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1989 차례 (Noun) - "turn, order, sequence"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1989 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1989.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '차례' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1990 대답 (Noun) - "answer, reply, response"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1990 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1990.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '대답' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1999 잠 (Noun) - "sleep (noun)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1999 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1999.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '잠' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2001 연고 (Noun) - "ointment, salve"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2001 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2001.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '연고' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2002 바닥 (Noun) - "bottom, floor"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2002 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2002.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '바닥' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2006 싸이 (Noun) - "Psy (South Korean singer/rapper)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2006 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2006.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '싸이' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2007 강남스타일 (Noun) - "Gangnam Style (cultural style / song)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2007 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2007.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '강남스타일' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2008 가사 (Noun) - "lyrics, words of a song"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2008 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2008.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '가사' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2009 강남 (Noun) - "Gangnam (district in Seoul)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2009 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2009.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '강남' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2010 스타일 (Noun) - "style, fashion, manner"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2010 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2010.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '스타일' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2012 인간적 (Noun) - "humane, humanistic, warm-hearted"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2012 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2012.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '인간적' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2013 한잔 (Noun) - "a cup, a drink, a glass of drink"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2013 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2013.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '한잔' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2014 여유 (Noun) - "leisure, composure, relaxedness"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2014 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2014.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '여유' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2015 품격 (Noun) - "dignity, elegance, class, grace"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2015 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2015.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '품격' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2016 심장 (Noun) - "heart (organ or figurative seat of emotion)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2016 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2016.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '심장' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2019 사나이 (Noun) - "man, guy, fellow (manly)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2019 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2019.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '사나이' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2021 원샷 (Noun) - "bottoms up, one-shot (drinking in one gulp)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2021 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2021.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '원샷' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2025 데 (Noun) - "place, spot, case (bound noun)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2025 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2025.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '데' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2028 이때 (Noun) - "this moment, this time, now"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2028 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2028.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이때' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2031 머리 (Noun) - "head, hair (body part)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2031 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2031.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '머리' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2035 노출 (Noun) - "exposure, revealing (clothing, body, facts)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2035 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2035.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '노출' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2037 감각적 (Noun) - "sensuous, stylish, sensible, tasteful"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2037 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2037.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '감각적' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2041 근육 (Noun) - "muscle (body part)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2041 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2041.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '근육' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2042 사상 (Noun) - "thought, ideology, philosophy, ideas"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2042 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2042.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '사상' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2044 놈 (Noun) - "guy, fellow, rascal (vulgar or colloquial)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2044 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2044.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '놈' functions correctly within its syntactic slot without allomorphic or case errors.

