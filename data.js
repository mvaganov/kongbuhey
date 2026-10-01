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
,

  // Vocabulary from SUOBI04
  ["저분", "that person (honorific)", "Noun", ["person", "honorific"], "", "", "SUOBI04", "", ""],
  ["한국말", "Korean language", "Noun", ["language", "object"], "", "", "SUOBI04", "", ""],
  ["배우다", "to learn", "Action Verb", ["transitive_general"], "", "regular", "SUOBI04", "", ""],
  ["오다", "to come", "Action Verb", ["intransitive_motion"], "", "regular", "SUOBI04", "", ""],
  ["베트남말", "Vietnamese language", "Noun", ["language", "object"], "", "", "SUOBI04", "", ""],
  ["빵", "bread", "Noun", ["food"], "", "", "SUOBI04", "", ""],
  ["영어", "English language", "Noun", ["language", "object", "sinoRoot"], "", "", "SUOBI04", "", ""],
  ["음악", "Music", "Noun", ["object", "sinoRoot"], "", "", "SUOBI04", "", ""],
  ["일본말", "Japanese language", "Noun", ["language", "object"], "", "", "SUOBI04", "", ""],
  ["중국말", "Chinese language", "Noun", ["language", "object"], "", "", "SUOBI04", "", ""],
  ["커피", "coffee", "Noun", ["drink"], "", "", "SUOBI04", "", ""],
  ["프랑스말", "French language", "Noun", ["language", "object"], "", "", "SUOBI04", "", ""],
  ["가르치다", "to teach", "Action Verb", ["transitive_general"], "", "regular", "SUOBI04", "", ""],
  ["기다리다", "to wait", "Action Verb", ["transitive_general"], "", "regular", "SUOBI04", "", ""],
  ["듣다", "to listen/hear", "Action Verb", ["transitive_general"], "", "d_irregular", "SUOBI04", "", ""],
  ["만나다", "to meet", "Action Verb", ["transitive_person"], "", "regular", "SUOBI04", "", ""],
  ["보다", "to see/watch", "Action Verb", ["transitive_general"], "", "regular", "SUOBI04", "", ""],
  ["사다", "to buy", "Action Verb", ["transitive_general"], "", "regular", "SUOBI04", "", ""],
  ["쓰다", "to write", "Action Verb", ["transitive_general"], "", "eu_irregular", "SUOBI04", "", ""],
  ["읽다", "to read", "Action Verb", ["transitive_general"], "", "regular", "SUOBI04", "", ""],
  ["입다", "to wear", "Action Verb", ["transitive_general"], "", "regular", "SUOBI04", "", ""],
  ["지금", "now", "Noun", ["time"], "", "", "SUOBI04", "", ""],
  ["게임", "game", "Noun", ["object"], "", "", "SUOBI04", "", ""],
  ["날마다", "everyday", "Adverb", ["frequency"], "", "", "SUOBI04", "", ""],
  ["피시방", "internet cafe", "Noun", ["place"], "", "", "SUOBI04", "", ""],
  ["하다", "to do", "Action Verb", ["transitive_general"], "", "hada", "SUOBI04", "", ""],
  ["꽃집", "flower shop", "Noun", ["place"], "", "", "SUOBI04", "", ""],
  ["노래방", "karaoke", "Noun", ["place"], "", "", "SUOBI04", "", ""],
  ["문구점", "stationery store", "Noun", ["place"], "", "", "SUOBI04", "", ""],
  ["백화점", "department store", "Noun", ["place"], "", "", "SUOBI04", "", ""],
  ["빵집", "bakery", "Noun", ["place"], "", "", "SUOBI04", "", ""],
  ["찜질방", "korean sauna", "Noun", ["place"], "", "", "SUOBI04", "", ""],
  ["태권도", "taekwondo", "Noun", ["object"], "", "", "SUOBI04", "", ""],
  ["게임하다", "to play games", "Action Verb", ["intransitive_general"], "", "hada", "SUOBI04", "", ""],
  ["공부하다", "to study", "Action Verb", ["transitive_general"], "", "hada", "SUOBI04", "", ""],
  ["노래하다", "to sing", "Action Verb", ["intransitive_general"], "", "hada", "SUOBI04", "", ""],
  ["식사하다", "to have a meal", "Action Verb", ["intransitive_general"], "", "hada", "SUOBI04", "", ""],
  ["아르바이트하다", "to work part time", "Action Verb", ["intransitive_general"], "", "hada", "SUOBI04", "", ""],
  ["운동하다", "to exercise", "Action Verb", ["intransitive_general"], "", "hada", "SUOBI04", "", ""],
  ["일하다", "to work", "Action Verb", ["intransitive_general"], "", "hada", "SUOBI04", "", ""],
  
  // Grammar from SUOBI04
  ["을 / 를", "object marker", "Grammar", ["particle", "object"], "", ["{N}을/를"], "SUOBI04", "", ""],

  // Vocabulary from SUOBI05
  ["고향", "hometown", "Noun", ["place"], "", "", "SUOBI05", "", ""],
  ["바다", "ocean", "Noun", ["place"], "", "", "SUOBI05", "", ""],
  ["수영", "swimming", "Noun", ["activity"], "", "", "SUOBI05", "", ""],
  ["언제", "when", "Pronoun", ["questionWord", "time"], "", "", "SUOBI05", "", ""],
  ["강", "river", "Noun", ["place"], "", "", "SUOBI05", "", ""],
  ["산", "mountain", "Noun", ["place"], "", "", "SUOBI05", "", ""],
  ["집", "house/home", "Noun", ["place"], "", "", "SUOBI05", "", "Replace with 댁 for respected subjects"],
  ["호수", "lake", "Noun", ["place"], "", "", "SUOBI05", "", ""],
  ["회사", "company", "Noun", ["place"], "", "", "SUOBI05", "", ""],
  ["서울", "Seoul", "Noun", ["place"], "", "", "SUOBI05", "", ""],
  ["복잡하다", "to be crowded/complicated", "Descriptive Verb", ["descriptive_place"], "", "hada", "SUOBI05", "", ""],
  ["아름답다", "to be beautiful", "Descriptive Verb", ["descriptive_place", "descriptive_person"], "", "b_irregular", "SUOBI05", "", ""],
  ["경치", "scenery", "Noun", ["attribute"], "", "", "SUOBI05", "", ""],
  ["남자", "man", "Noun", ["person"], "", "", "SUOBI05", "", ""],
  ["생선", "fish (food)", "Noun", ["food"], "", "", "SUOBI05", "", ""],
  ["생활", "life/living", "Noun", ["attribute"], "", "", "SUOBI05", "", ""],
  ["여자", "woman", "Noun", ["person"], "", "", "SUOBI05", "", ""],
  ["깨끗하다", "to be clean", "Descriptive Verb", ["descriptive_place", "descriptive_general"], "", "hada", "SUOBI05", "", ""],
  ["더럽다", "to be dirty", "Descriptive Verb", ["descriptive_place", "descriptive_general"], "", "b_irregular", "SUOBI05", "", ""],
  ["바쁘다", "to be busy", "Descriptive Verb", ["descriptive_person"], "", "eu_irregular", "SUOBI05", "", ""],
  ["예쁘다", "to be pretty", "Descriptive Verb", ["descriptive_person"], "", "eu_irregular", "SUOBI05", "", ""],
  ["재미없다", "to be not fun", "Descriptive Verb", ["descriptive_general"], "", "regular", "SUOBI05", "", ""],
  ["재미있다", "to be fun", "Descriptive Verb", ["descriptive_general"], "", "regular", "SUOBI05", "", ""],
  ["친절하다", "to be kind", "Descriptive Verb", ["descriptive_person"], "", "hada", "SUOBI05", "", ""],
  ["한가하다", "to be not busy", "Descriptive Verb", ["descriptive_person"], "", "hada", "SUOBI05", "", ""],
  
  // Grammar from SUOBI05
  ["에서", "location action marker", "Grammar", ["particle", "location_action"], "", ["{N}에서 {VP_AVst}"], "SUOBI05", "", ""],
  ["에 (direction)", "direction marker", "Grammar", ["particle", "direction"], "", ["{N}에 {VP_AVst}"], "SUOBI05", "", ""], // Wait, intransitive_motion verbs already use 에 in generator, we don't necessarily need a grammar rule, but we can have it

  // Vocabulary from SUOBI06
  ["몇", "what/how many", "Pronoun", ["questionWord", "number"], "", "", "SUOBI06", "", ""],
  ["반", "half", "Noun", ["time_amount"], "", "", "SUOBI06", "", ""],
  ["보통", "usually", "Adverb", ["frequency"], "", "", "SUOBI06", "", ""],
  ["시", "hour/o'clock", "Noun", ["measureWord", "koreanMeasureWord"], "", "", "SUOBI06", "", ""],
  ["아홉", "nine", "Number", ["koreanNumber"], "", "", "SUOBI06", "", ""],
  ["점심", "lunch", "Noun", ["time", "meal"], "", "", "SUOBI06", "", ""],
  ["한", "one", "Number", ["koreanNumber"], "", "", "SUOBI06", "", ""],
  ["아침", "morning/breakfast", "Noun", ["time", "meal"], "", "", "SUOBI06", "", ""],
  ["영화", "movie", "Noun", ["object"], "", "", "SUOBI06", "", ""],
  ["오전", "morning/AM", "Noun", ["time"], "", "", "SUOBI06", "", ""],
  ["오후", "afternoon/PM", "Noun", ["time"], "", "", "SUOBI06", "", ""],
  ["저녁", "dinner/evening", "Noun", ["time", "meal"], "", "", "SUOBI06", "", ""],
  ["두", "two", "Number", ["koreanNumber"], "", "", "SUOBI06", "", ""],
  ["세", "three", "Number", ["koreanNumber"], "", "", "SUOBI06", "", ""],
  ["네", "four", "Number", ["koreanNumber"], "", "", "SUOBI06", "", ""],
  ["다섯", "five", "Number", ["koreanNumber"], "", "", "SUOBI06", "", ""],
  ["여섯", "six", "Number", ["koreanNumber"], "", "", "SUOBI06", "", ""],
  ["일곱", "seven", "Number", ["koreanNumber"], "", "", "SUOBI06", "", ""],
  ["여덟", "eight", "Number", ["koreanNumber"], "", "", "SUOBI06", "", ""],
  ["열", "ten", "Number", ["koreanNumber"], "", "", "SUOBI06", "", ""],
  ["열한", "eleven", "Number", ["koreanNumber"], "", "", "SUOBI06", "", ""],
  ["열두", "twelve", "Number", ["koreanNumber"], "", "", "SUOBI06", "", ""],
  ["삼십", "thirty", "Number", ["sinoNumber"], "", "", "SUOBI06", "", ""],
  ["교과서", "textbook", "Noun", ["object"], "", "", "SUOBI06", "", ""],
  ["대화", "conversation", "Noun", ["activity"], "", "", "SUOBI06", "", ""],
  ["번", "times/number", "Noun", ["measureWord", "koreanMeasureWord"], "", "", "SUOBI06", "", ""],
  ["수업", "class", "Noun", ["activity"], "", "", "SUOBI06", "", ""],
  ["숙제", "homework", "Noun", ["activity"], "", "", "SUOBI06", "", ""],
  ["쪽", "page", "Noun", ["measureWord", "sinoMeasureWord"], "", "", "SUOBI06", "", ""],
  ["알다", "to know/understand", "Action Verb", ["transitive_general"], "", "l_irregular", "SUOBI06", "", ""],
  ["고맙다", "to be thankful", "Descriptive Verb", ["emotion"], "", "b_irregular", "SUOBI06", "", ""],
  ["닫다", "to close", "Action Verb", ["transitive_general"], "", "regular", "SUOBI06", "", ""],
  ["운전하다", "to drive", "Action Verb", ["transitive_general", "intransitive_general"], "", "hada", "SUOBI06", "", ""],
  ["전화하다", "to call", "Action Verb", ["transitive_person"], "", "hada", "SUOBI06", "", ""],
  ["피곤하다", "to be tired", "Descriptive Verb", ["descriptive_person"], "", "hada", "SUOBI06", "", ""],
  ["일", "one", "Number", ["sinoNumber"], "", "", "SUOBI06", "", ""],
  ["이", "two", "Number", ["sinoNumber"], "", "", "SUOBI06", "", ""],
  ["삼", "three", "Number", ["sinoNumber"], "", "", "SUOBI06", "", ""],
  ["사", "four", "Number", ["sinoNumber"], "", "", "SUOBI06", "", ""],
  ["오", "five", "Number", ["sinoNumber"], "", "", "SUOBI06", "", ""],
  ["육", "six", "Number", ["sinoNumber"], "", "", "SUOBI06", "", ""],
  ["칠", "seven", "Number", ["sinoNumber"], "", "", "SUOBI06", "", ""],
  ["팔", "eight", "Number", ["sinoNumber"], "", "", "SUOBI06", "", ""],
  ["구", "nine", "Number", ["sinoNumber"], "", "", "SUOBI06", "", ""],
  ["십", "ten", "Number", ["sinoNumber"], "", "", "SUOBI06", "", ""],
  ["이십", "twenty", "Number", ["sinoNumber"], "", "", "SUOBI06", "", ""],
  ["사십", "forty", "Number", ["sinoNumber"], "", "", "SUOBI06", "", ""],
  ["오십", "fifty", "Number", ["sinoNumber"], "", "", "SUOBI06", "", ""],
  ["분", "minute", "Noun", ["measureWord", "sinoMeasureWord"], "", "", "SUOBI06", "", ""],
  ["나이", "age", "Noun", ["attribute"], "", "", "SUOBI06", "", "Honorific: 연세"],
  ["안", "not", "Adverb", ["negative"], "", "", "SUOBI06", "", ""],
  
  // Grammar from SUOBI06
  ["-지 않다", "to not do/be", "Grammar", ["negative"], "", ["{VP_AVst}지 않아요", "{VP_DVst}지 않아요"], "SUOBI06", "", ""],
  ["에 (time)", "time marker", "Grammar", ["particle", "time"], "", ["{N:time}에 {VP_AVst}"], "SUOBI06", "", ""],
  ["(이)랑", "and/with", "Grammar", ["particle", "conjunction"], "", ["{N}(이)랑 {N}이/가 {VP_DVst}"], "SUOBI06", "", ""],
  ["시간 표현", "time expression", "Grammar", ["N_Phrase", "time"], "", ["{Number:koreanNumber} 시 {Number:sinoNumber} 분"], "SUOBI06", "", ""],
  ["횟수 표현", "number of times", "Grammar", ["Adv"], "", ["{Number:koreanNumber} 번"], "SUOBI06", "", ""]

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
