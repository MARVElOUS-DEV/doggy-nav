export interface TranslateProvider {
  translate(text: string, sourceLang: string, targetLang: string): Promise<string>;
  detectLanguage(text: string): Promise<string>;
}

export class TranslateService {
  constructor(private readonly provider: TranslateProvider) {}

  translateText(text: string, sourceLang: string, targetLang: string) {
    return this.provider.translate(text, sourceLang, targetLang);
  }

  detectLanguage(text: string) {
    return this.provider.detectLanguage(text);
  }
}

export default TranslateService;
