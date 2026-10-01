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
  ["미국", "the U.S.", "Noun", ["place", "devtest"], "", "", "SUOBI01", "", ""],
  ["베트남", "Vietnam", "Noun", ["place"], "", "", "SUOBI01", "", ""],
  ["브라질", "Brazil", "Noun", ["place"], "", "", "SUOBI01", "", ""],
  ["사람", "person", "Noun", ["person", "koreanRoot", "devtest"], "", "", "SUOBI01", "", "Replace with 분 for respected subjects"],
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
  ["간호사", "nurse", "Noun", ["person", "profession", "sinoRoot"], "", "", "SUOBI01", "", ""],
  ["기자", "journalist", "Noun", ["person", "profession", "sinoRoot"], "", "", "SUOBI01", "", ""],
  ["누구", "who", "Pronoun", ["questionWord", "person"], "", "", "SUOBI01", "", ""],
  ["배우", "actor", "Noun", ["person", "profession", "sinoRoot"], "", "", "SUOBI01", "", ""],
  ["선생님", "teacher", "Noun", ["person", "profession", "honorific"], "", "", "SUOBI01", "", "Honorific form included"],
  ["요리사", "chef", "Noun", ["person", "profession", "sinoRoot"], "", "", "SUOBI01", "", ""],
  ["은행원", "bank teller", "Noun", ["person", "profession", "sinoRoot"], "", "", "SUOBI01", "", ""],
  ["의사", "doctor", "Noun", ["person", "profession", "sinoRoot", "devtest"], "", "", "SUOBI01", "", ""],

  // Grammar from SUOBI01
  ["은 / 는", "topic marker", "Grammar", ["particle", "topic", "devtest"], "Marks the theme or contrast", ["{N}은/는"], "SUOBI01", "", ""],
  ["이에요 / 예요", "polite informal 'to be'", "Grammar", ["declarative", "present", "devtest"], "Attached directly to nouns", ["{N}이/예요"], "SUOBI01", "Polite Informal (해요체)", ""],

  // Extra Vocabulary from SUOBI00 to make interesting sentences
  ["밥", "rice/meal", "Noun", ["food", "koreanRoot", "devtest"], "", "", "SUOBI00", "", ""],
  ["물", "water", "Noun", ["drink", "koreanRoot", "devtest"], "", "", "SUOBI00", "", ""],
  ["먹다", "to eat", "Action Verb", ["transitive_food", "koreanRoot", "devtest"], "", "regular_eo", "SUOBI00", "", "Replace with 드시다 for respected subjects"],
  ["마시다", "to drink", "Action Verb", ["transitive_drink", "koreanRoot", "devtest"], "", "i_irregular", "SUOBI00", "", "Replace with 드시다 for respected subjects"],
  ["크다", "to be big", "Descriptive Verb", ["descriptive_general", "koreanRoot", "devtest"], "", "eu_irregular", "SUOBI00", "", ""],
  ["맛있다", "to be delicious", "Descriptive Verb", ["descriptive_food", "food_adjective"], "", "regular", "SUOBI00", "", ""],
  ["가다", "to go", "Action Verb", ["intransitive_motion", "koreanRoot"], "", "regular_a", "SUOBI00", "", ""],
  ["오늘", "today", "Noun", ["time", "koreanRoot"], "", "", "SUOBI00", "", ""],
  ["내일", "tomorrow", "Noun", ["time", "sinoRoot"], "", "", "SUOBI00", "", ""],
  ["자주", "often", "Adverb", ["frequency", "koreanRoot"], "", "", "SUOBI00", "", ""],
  ["가끔", "sometimes", "Adverb", ["frequency", "koreanRoot"], "", "", "SUOBI00", "", ""],


  // Grammar from SUOBI00
  ["~아요 / ~어요 / ~해요", "polite ending", "Grammar", ["declarative", "interrogative", "present", "devtest"], "", ["{AVst}아/어요", "{DVst}아/어요"], "SUOBI00", "Polite Informal (해요체)", ""],
  ["~습니다 / ~ㅂ니다", "formal polite declarative ending", "Grammar", ["declarative", "present", "honorific", "devtest"], "", ["{AVst}습니다/ㅂ니다", "{DVst}습니다/ㅂ니다"], "SUOBI00", "Formal Polite (합쇼체)", ""],
  ["~자", "let's do...", "Grammar", ["suggestion"], "", ["{AVst}자"], "SUOBI00", "Plain (한다체)", "Cannot be used with honorific subject"],
  ["-아/어서", "because / so", "Grammar", ["reason", "conjunction", "sequential"], "", ["{VP_AVst}아/어서 {Clause}", "{VP_DVst}아/어서 {Clause}"], "SUOBI00", "", "No past tense in first clause"],
  ["-(으)니까", "since / because", "Grammar", ["reason", "conjunction", "devtest"], "", ["{VP_AVst}으/니까 {Clause}", "{VP_DVst}으/니까 {Clause}"], "SUOBI00", "", "Often followed by imperative or propositive"],
  ["-기 때문에", "because of", "Grammar", ["reason", "conjunction"], "", ["{VP_AVst}기 때문에 {Clause}", "{VP_DVst}기 때문에 {Clause}", "{N} 때문에 {Clause}"], "SUOBI00", "", ""],
  ["이다", "to be", "Descriptive Verb", ["particle"], "", "regular", "SUOBI00", "", "Copula verb"],
  ["입니다", "is/are", "Grammar", ["declarative", "present", "honorific"], "", ["{N}입니다"], "SUOBI00", "Formal Polite (합쇼체)", ""],

  // Vocabulary from SUOBI02
  ["교실", "classroom", "Noun", ["place", "sinoRoot"], "", "", "SUOBI02", "", ""],
  ["그것", "that (near you)", "Pronoun", ["demonstrative"], "", "", "SUOBI02", "", ""],
  ["무엇", "what", "Pronoun", ["questionWord", "thing"], "", "", "SUOBI02", "", ""],
  ["여기", "here", "Pronoun", ["place"], "", "", "SUOBI02", "", ""],
  ["우리", "we/us/our", "Pronoun", ["person"], "", "", "SUOBI02", "", ""],
  ["이것", "this (thing)", "Pronoun", ["demonstrative"], "", "", "SUOBI02", "", ""],
  ["컴퓨터", "computer", "Noun", ["object"], "", "", "SUOBI02", "", ""],
  ["거울", "mirror", "Noun", ["object"], "", "", "SUOBI02", "", ""],
  ["누가", "who (subject)", "Pronoun", ["questionWord", "person"], "subject is unknown person", "", "SUOBI02", "", ""],
  ["달력", "calendar", "Noun", ["object"], "", "", "SUOBI02", "", ""],
  ["지도", "map", "Noun", ["object"], "", "", "SUOBI02", "", ""],
  ["문", "door", "Noun", ["object", "sinoRoot"], "", "", "SUOBI02", "", ""],
  ["시계", "clock", "Noun", ["object", "sinoRoot"], "", "", "SUOBI02", "", ""],
  ["옷걸이", "coat hanger", "Noun", ["object"], "", "", "SUOBI02", "", ""],
  ["의자", "chair", "Noun", ["object"], "", "", "SUOBI02", "", ""],
  ["저것", "that (thing)", "Pronoun", ["demonstrative"], "", "", "SUOBI02", "", ""],
  ["창문", "window", "Noun", ["object", "sinoRoot"], "", "", "SUOBI02", "", ""],
  ["책상", "desk", "Noun", ["object", "sinoRoot"], "", "", "SUOBI02", "", ""],
  ["친구", "friend", "Noun", ["person", "sinoRoot"], "", "", "SUOBI02", "", ""],
  ["칠판", "blackboard", "Noun", ["object", "sinoRoot"], "", "", "SUOBI02", "", ""],
  ["텔레비전", "television", "Noun", ["object"], "", "", "SUOBI02", "", ""],
  ["공책", "notebook", "Noun", ["object", "sinoRoot"], "", "", "SUOBI02", "", ""],
  ["책", "book", "Noun", ["object", "sinoRoot"], "", "", "SUOBI02", "", ""],
  ["없다", "to not have", "Descriptive Verb", ["descriptive_general", "existence"], "", "regular", "SUOBI02", "", "Replace with 계시다 for respected subjects"],
  ["있다", "to have", "Descriptive Verb", ["descriptive_general", "existence"], "", "regular", "SUOBI02", "", "Replace with 계시다 for respected subjects"],
  ["가방", "bag", "Noun", ["object"], "", "", "SUOBI02", "", ""],
  ["돈", "money", "Noun", ["object"], "", "", "SUOBI02", "", ""],
  ["볼펜", "pen", "Noun", ["object"], "", "", "SUOBI02", "", ""],
  ["신문", "newspaper", "Noun", ["object", "sinoRoot"], "", "", "SUOBI02", "", ""],
  ["연필", "pencil", "Noun", ["object"], "", "", "SUOBI02", "", ""],
  ["잡지", "magazine", "Noun", ["object", "sinoRoot"], "", "", "SUOBI02", "", ""],
  ["지갑", "wallet", "Noun", ["object"], "", "", "SUOBI02", "", ""],
  ["지우개", "eraser", "Noun", ["object"], "", "", "SUOBI02", "", ""],
  ["필통", "pencil case", "Noun", ["object"], "", "", "SUOBI02", "", ""],
  ["학생증", "student ID card", "Noun", ["object", "sinoRoot"], "", "", "SUOBI02", "", ""],
  ["휴대전화", "cell phone", "Noun", ["object", "sinoRoot"], "", "", "SUOBI02", "", ""],
  ["휴지", "tissue", "Noun", ["object"], "", "", "SUOBI02", "", ""],
  
  // Grammar from SUOBI02
  ["이/가 아니에요", "to not be", "Grammar", ["declarative", "negative"], "", ["{N}이/가 아니에요"], "SUOBI02", "Polite Informal (해요체)", "Replace with 께서 for respected subjects"],
  ["이 / 가", "subject marker", "Grammar", ["particle", "subject"], "Marks the grammatical subject", ["{N}이/가"], "SUOBI02", "", "Replace with 께서 for respected subjects"],

  // Vocabulary from SUOBI03
  ["도서관", "library", "Noun", ["place", "sinoRoot"], "", "", "SUOBI03", "", ""],
  ["안", "inside", "Noun", ["position"], "", "", "SUOBI03", "", ""],
  ["앞", "front", "Noun", ["position"], "", "", "SUOBI03", "", ""],
  ["어디", "where", "Pronoun", ["questionWord", "place"], "", "", "SUOBI03", "", ""],
  ["은행", "bank", "Noun", ["place", "sinoRoot"], "", "", "SUOBI03", "", ""],
  ["학생회관", "student union", "Noun", ["place", "sinoRoot"], "", "", "SUOBI03", "", ""],
  ["기숙사", "dormitory", "Noun", ["place", "sinoRoot"], "", "", "SUOBI03", "", ""],
  ["꽃", "flower", "Noun", ["object"], "", "", "SUOBI03", "", ""],
  ["뒤", "behind", "Noun", ["position"], "", "", "SUOBI03", "", ""],
  ["밖", "outside", "Noun", ["position"], "", "", "SUOBI03", "", ""],
  ["사무실", "office", "Noun", ["place", "sinoRoot"], "", "", "SUOBI03", "", ""],
  ["서점", "bookstore", "Noun", ["place", "sinoRoot"], "", "", "SUOBI03", "", ""],
  ["식당", "restaurant", "Noun", ["place", "sinoRoot"], "", "", "SUOBI03", "", ""],
  ["아래", "below/under", "Noun", ["position"], "", "", "SUOBI03", "", ""],
  ["옆", "next to", "Noun", ["position"], "", "", "SUOBI03", "", ""],
  ["우체국", "post office", "Noun", ["place", "sinoRoot"], "", "", "SUOBI03", "", ""],
  ["위", "above", "Noun", ["position"], "", "", "SUOBI03", "", ""],
  ["저기", "over there", "Pronoun", ["place"], "", "", "SUOBI03", "", ""],
  ["체육관", "gym", "Noun", ["place", "sinoRoot"], "", "", "SUOBI03", "", ""],
  ["편의점", "convenience store", "Noun", ["place", "sinoRoot"], "", "", "SUOBI03", "", ""],
  ["근처", "near", "Noun", ["position"], "", "", "SUOBI03", "", ""],
  ["방", "room", "Noun", ["place"], "", "", "SUOBI03", "", ""],
  ["학생식당", "student cafeteria", "Noun", ["place", "sinoRoot"], "", "", "SUOBI03", "", ""],
  ["어떻다", "to be how", "Descriptive Verb", ["descriptive_general", "questionWord", "devtest"], "", "h_irregular", "SUOBI03", "", ""],
  ["좋다", "to be good", "Descriptive Verb", ["descriptive_general", "emotion"], "", "regular", "SUOBI03", "", ""],
  ["아주", "very", "Adverb", ["degree"], "", "", "SUOBI03", "", ""],
  ["날씨", "weather", "Noun", ["attribute"], "", "", "SUOBI03", "", ""],
  ["나쁘다", "to be bad", "Descriptive Verb", ["descriptive_general"], "", "eu_irregular", "SUOBI03", "", ""],
  ["덥다", "to be hot", "Descriptive Verb", ["descriptive_general", "devtest"], "", "b_irregular", "SUOBI03", "", ""],
  ["많다", "to be many/much", "Descriptive Verb", ["descriptive_general", "quantity"], "", "regular", "SUOBI03", "", ""],
  ["시끄럽다", "to be noisy", "Descriptive Verb", ["descriptive_general"], "", "b_irregular", "SUOBI03", "", ""],
  ["작다", "to be small", "Descriptive Verb", ["descriptive_general"], "", "regular", "SUOBI03", "", ""],
  ["적다", "to be little/few", "Descriptive Verb", ["descriptive_general", "quantity"], "", "regular", "SUOBI03", "", ""],
  ["조용하다", "to be quiet", "Descriptive Verb", ["descriptive_general"], "", "hada", "SUOBI03", "", ""],
  ["춥다", "to be cold", "Descriptive Verb", ["descriptive_general"], "", "b_irregular", "SUOBI03", "", ""],
  
  // Grammar from SUOBI03
  ["에 (location)", "location marker", "Grammar", ["particle", "location"], "Expresses location of (with 있다/없다)", ["{N}에 있다/없다"], "SUOBI03", "", ""],

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
