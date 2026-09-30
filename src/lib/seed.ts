import bcrypt from "bcryptjs";
import User from "./models/User";
import Word from "./models/Word";
import Lesson from "./models/Lesson";
import Notice from "./models/Notice";

const DEMO_EMAIL = "demo@lingua.local";

const SAMPLE_WORDS = [
  { term: "apple", translation: "яблоко", transcription: "ˈæpl", partOfSpeech: "noun", example: "An apple a day keeps the doctor away.", language: "en", tags: ["еда"], mastery: 2 },
  { term: "to learn", translation: "учить, изучать", transcription: "lɜːn", partOfSpeech: "verb", example: "I learn English every day.", language: "en", tags: ["глаголы"], mastery: 3 },
  { term: "resilient", translation: "устойчивый", transcription: "rɪˈzɪliənt", partOfSpeech: "adjective", example: "She is a resilient student.", language: "en", tags: ["прилагательные"], mastery: 1 },
  { term: "vocabulary", translation: "словарный запас", transcription: "vəˈkæbjələri", partOfSpeech: "noun", example: "Reading expands vocabulary.", language: "en", tags: ["учёба"], mastery: 4 },
  { term: "bonjour", translation: "здравствуйте", transcription: "bɔ̃ʒuʁ", partOfSpeech: "interjection", example: "Bonjour, comment ça va?", language: "fr", tags: ["приветствия"], mastery: 2 },
  { term: "Haus", translation: "дом", transcription: "haʊs", partOfSpeech: "noun", example: "Das Haus ist groß.", language: "de", tags: ["быт"], mastery: 1 },
  { term: "because", translation: "потому что", transcription: "bɪˈkɒz", partOfSpeech: "conjunction", example: "I stay because I study.", language: "en", tags: ["служебные"], mastery: 5 },
  { term: "progress", translation: "прогресс", transcription: "ˈprəʊɡres", partOfSpeech: "noun", example: "Progress takes time.", language: "en", tags: ["учёба"], mastery: 3 },
];

const SAMPLE_LESSONS = [
  {
    title: "Приветствие и знакомство",
    level: "A1",
    language: "en",
    content:
      "Базовые фразы: Hello, Hi, Good morning, My name is..., Nice to meet you. Повторите диалог и добавьте незнакомые слова в словарь.",
  },
  {
    title: "Еда и покупки",
    level: "A2",
    language: "en",
    content:
      "Тема покрывает названия продуктов, вежливые просьбы и числительные. Составьте пять предложений с новыми словами и отметьте их в словаре.",
  },
  {
    title: "Времена Past Simple",
    level: "B1",
    language: "en",
    content:
      "Правильные глаголы получают окончание -ed. Неправильные формы нужно запомнить. Выполните упражнение: перескажите вчерашний день пятью предложениями.",
  },
];

export async function seedIfEmpty() {
  const existing = await User.findOne({ email: DEMO_EMAIL }).lean();
  if (existing) {
    return;
  }

  const passwordHash = await bcrypt.hash("Demo12345", 10);
  const user = await User.create({
    name: "Демо-пользователь",
    email: DEMO_EMAIL,
    passwordHash,
    nativeLanguage: "ru",
    targetLanguage: "en",
  });

  await Word.insertMany(
    SAMPLE_WORDS.map((item) => ({ ...item, userId: user._id }))
  );
  await Lesson.insertMany(
    SAMPLE_LESSONS.map((item) => ({ ...item, userId: user._id }))
  );
  await Notice.create({
    userId: user._id,
    title: "Добро пожаловать",
    message: "Демо-аккаунт заполнен словами и уроками. Можно сразу открыть словарь.",
    kind: "success",
  });
}
