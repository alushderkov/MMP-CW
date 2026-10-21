export type Option = { code: string; label: string };

export const STUDY_LANGUAGES: (Option & { speech: string })[] = [
  { code: "en", label: "английский", speech: "en-US" },
  { code: "de", label: "немецкий", speech: "de-DE" },
  { code: "fr", label: "французский", speech: "fr-FR" },
  { code: "es", label: "испанский", speech: "es-ES" },
];

export const NATIVE_LANGUAGES: (Option & { speech: string })[] = [
  { code: "ru", label: "русский", speech: "ru-RU" },
  { code: "be", label: "белорусский", speech: "be-BY" },
  { code: "uk", label: "украинский", speech: "uk-UA" },
];

export const ALL_LANGUAGES = [...STUDY_LANGUAGES, ...NATIVE_LANGUAGES];

export const PARTS_OF_SPEECH: Option[] = [
  { code: "noun", label: "существительное" },
  { code: "verb", label: "глагол" },
  { code: "adjective", label: "прилагательное" },
  { code: "adverb", label: "наречие" },
  { code: "pronoun", label: "местоимение" },
  { code: "numeral", label: "числительное" },
  { code: "preposition", label: "предлог" },
  { code: "conjunction", label: "союз" },
  { code: "interjection", label: "междометие" },
  { code: "phrase", label: "устойчивое выражение" },
];

export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const DEFAULT_TAGS = ["еда", "быт", "учёба", "работа", "путешествия", "приветствия", "глаголы", "прилагательные"];

export function isStudyLanguage(code: string) {
  return STUDY_LANGUAGES.some((item) => item.code === code);
}

export function isNativeLanguage(code: string) {
  return NATIVE_LANGUAGES.some((item) => item.code === code);
}

export function languageLabel(code: string) {
  return ALL_LANGUAGES.find((item) => item.code === code)?.label || code;
}

export function speechLang(code: string) {
  return ALL_LANGUAGES.find((item) => item.code === code)?.speech || code;
}

export function partOfSpeechLabel(code: string) {
  return PARTS_OF_SPEECH.find((item) => item.code === code)?.label || code;
}

export function normalizePartOfSpeech(value: unknown) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) {
    return "";
  }
  const found = PARTS_OF_SPEECH.find((item) => item.code === raw || item.label === raw);
  return found ? found.code : null;
}
