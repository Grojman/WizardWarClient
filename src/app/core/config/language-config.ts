export interface LanguageOption {
  code: string;
  label: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
];

const DEFAULT_LANGUAGE = 'es';
const STORAGE_KEY = 'wizardwar_language';

export class LanguageConfig {
  private currentLanguage: string = DEFAULT_LANGUAGE;

  constructor() {
    this.loadFromLocalStorage();
  }

  getLanguage(): string {
    return this.currentLanguage;
  }

  setLanguage(code: string): void {
    this.currentLanguage = code;
    this.saveToLocalStorage();
  }

  private saveToLocalStorage(): void {
    localStorage.setItem(STORAGE_KEY, this.currentLanguage);
  }

  private loadFromLocalStorage(): void {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANGUAGE_OPTIONS.some(opt => opt.code === saved)) {
      this.currentLanguage = saved;
    }
  }
}

export const languageConfig = new LanguageConfig();
