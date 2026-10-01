const KR_EN_languageUnits = [
  // Vocabulary from SUOBI01
  ["미국 사람", "American person", "Noun", ["person"], "", "", "SUOBI01", "", ""],
  ["이름", "name", "Noun", ["attribute", "koreanRoot"], "", "", "SUOBI01", "", "Replace with 성함 for respected subjects"],
  ["저", "I", "Pronoun", ["person"], "humble I", "", "SUOBI01", "Formal/Polite", ""],
  ["제", "my", "Pronoun", ["person"], "humble my", "", "SUOBI01", "Formal/Polite", ""],
  ["네", "yes", "Exclamation", ["greeting"], "", "", "SUOBI01", "Polite", ""],
  ["안녕하다", "doing well", "Descriptive Verb", ["descriptive_person", "greeting", "emotion"], "", "regular", "SUOBI01", "", ""],
  ["나라", "country", "Noun", ["place"], "", "", "SUOBI01", "", ""],
  ["노르웨이", "Norway", "Noun", ["place"], "", "", "SUOBI01", "", ""],
  ["미국", "the U.S.", "Noun", ["place"], "", "", "SUOBI01", "", ""],
  ["베트남", "Vietnam", "Noun", ["place"], "", "", "SUOBI01", "", ""],
  ["브라질", "Brazil", "Noun", ["place"], "", "", "SUOBI01", "", ""],
  ["사람", "person", "Noun", ["person", "koreanRoot"], "", "", "SUOBI01", "", "Replace with 분 for respected subjects"],
  ["일본", "Japan", "Noun", ["place"], "", "", "SUOBI01", "", ""],
  ["중국", "China", "Noun", ["place"], "", "", "SUOBI01", "", ""],
  ["케냐", "Kenya", "Noun", ["place"], "", "", "SUOBI01", "", ""],
  ["프랑스", "France", "Noun", ["place"], "", "", "SUOBI01", "", ""],
  ["한국", "Korea", "Noun", ["place"], "", "", "SUOBI01", "", ""],
  ["한국 사람", "Korean person", "Noun", ["person"], "", "", "SUOBI01", "", ""],
  ["호주", "Australia", "Noun", ["place"], "", "", "SUOBI01", "", ""],
  ["어느", "which", "Pronoun", ["questionWord"], "", "", "SUOBI01", "", ""],
  ["감사하다", "to be thankful", "Descriptive Verb", ["greeting", "emotion"], "", "hada", "SUOBI01", "Formal", ""],
  ["괜찮다", "to be okay", "Descriptive Verb", ["emotion"], "", "regular", "SUOBI01", "", ""],
  ["죄송하다", "to be sorry", "Descriptive Verb", ["emotion"], "", "hada", "SUOBI01", "Formal", ""],
  ["씨", "Mr./Ms.", "Noun", ["person", "honorific"], "", "", "SUOBI01", "", "Attached to names"],
  ["학생", "student", "Noun", ["person", "profession", "sinoRoot"], "", "", "SUOBI01", "", ""],
  ["회사원", "company worker", "Noun", ["person", "profession", "sinoRoot"], "", "", "SUOBI01", "", ""],
  ["아니요", "no", "Exclamation", ["greeting"], "", "", "SUOBI01", "Polite", ""],
  ["가수", "singer", "Noun", ["person", "profession", "sinoRoot"], "", "", "SUOBI01", "", ""],
  ["의사", "doctor", "Noun", ["person", "profession", "sinoRoot"], "", "", "SUOBI01", "", ""],

  // Extra Vocabulary from SUOBI00 to make interesting sentences
  ["밥", "rice/meal", "Noun", ["food", "koreanRoot"], "", "", "SUOBI00", "", ""],
  ["물", "water", "Noun", ["drink", "koreanRoot"], "", "", "SUOBI00", "", ""],
  ["먹다", "to eat", "Action Verb", ["transitive_food", "koreanRoot"], "", "regular_eo", "SUOBI00", "", "Replace with 드시다 for respected subjects"],
  ["마시다", "to drink", "Action Verb", ["transitive_drink", "koreanRoot"], "", "i_irregular", "SUOBI00", "", "Replace with 드시다 for respected subjects"],
  ["크다", "to be big", "Descriptive Verb", ["descriptive_general", "koreanRoot"], "", "eu_irregular", "SUOBI00", "", ""],
  ["맛있다", "to be delicious", "Descriptive Verb", ["descriptive_food", "food_adjective"], "", "regular", "SUOBI00", "", ""],
  ["가다", "to go", "Action Verb", ["intransitive_motion", "koreanRoot"], "", "regular_a", "SUOBI00", "", ""],
  ["오늘", "today", "Noun", ["time", "koreanRoot"], "", "", "SUOBI00", "", ""],
  ["내일", "tomorrow", "Noun", ["time", "sinoRoot"], "", "", "SUOBI00", "", ""],
  ["자주", "often", "Adverb", ["frequency", "koreanRoot"], "", "", "SUOBI00", "", ""],
  ["가끔", "sometimes", "Adverb", ["frequency", "koreanRoot"], "", "", "SUOBI00", "", ""],


  // Grammar from SUOBI00
  ["~아요 / ~어요 / ~해요", "polite ending", "Grammar", ["declarative", "interrogative", "present"], "", ["{AVst}아/어요", "{DVst}아/어요"], "SUOBI00", "Polite Informal (해요체)", ""],
  ["~습니다 / ~ㅂ니다", "formal polite declarative ending", "Grammar", ["declarative", "present", "honorific"], "", ["{AVst}습니다/ㅂ니다", "{DVst}습니다/ㅂ니다"], "SUOBI00", "Formal Polite (합쇼체)", ""],
  ["~자", "let's do...", "Grammar", ["suggestion"], "", ["{AVst}자"], "SUOBI00", "Plain (한다체)", "Cannot be used with honorific subject"],
  ["-아/어서", "because / so", "Grammar", ["reason", "conjunction", "sequential"], "", ["{VP_AVst}아/어서 {Clause}", "{VP_DVst}아/어서 {Clause}"], "SUOBI00", "", "No past tense in first clause"],
  ["-(으)니까", "since / because", "Grammar", ["reason", "conjunction"], "", ["{VP_AVst}으/니까 {Clause}", "{VP_DVst}으/니까 {Clause}"], "SUOBI00", "", "Often followed by imperative or propositive"],
  ["-기 때문에", "because of", "Grammar", ["reason", "conjunction"], "", ["{VP_AVst}기 때문에 {Clause}", "{VP_DVst}기 때문에 {Clause}", "{N} 때문에 {Clause}"], "SUOBI00", "", ""],
  ["이다", "to be", "Descriptive Verb", ["particle"], "", "regular", "SUOBI00", "", "Copula verb"],
  ["입니다", "is/are", "Grammar", ["declarative", "present", "honorific"], "", ["{N}입니다"], "SUOBI00", "Formal Polite (합쇼체)", ""]
];

const cache = {};

function addLearningUnit(unit) {
  // If the unit isn't in the main array, add it (useful for runtime additions)
  if (!KR_EN_languageUnits.includes(unit)) {
    KR_EN_languageUnits.push(unit);
  }

  const pos = unit[2];
  const tags = unit[3] || [];

  if (!cache[pos]) {
    cache[pos] = { _all: [] };
  }

  cache[pos]._all.push(unit);

  tags.forEach(tag => {
    if (!cache[pos][tag]) {
      cache[pos][tag] = [];
    }
    cache[pos][tag].push(unit);
  });
}

function rebuildCache() {
  for (let key in cache) delete cache[key];
  KR_EN_languageUnits.forEach(unit => addLearningUnit(unit));
}

// Build the initial cache from the hardcoded array
rebuildCache();

function getWords(pos, requiredTag = null) {
  if (!cache[pos]) return [];
  if (!requiredTag) return cache[pos]._all || [];
  return cache[pos][requiredTag] || [];
}

module.exports = { KR_EN_languageUnits, addLearningUnit, getWords, rebuildCache };
