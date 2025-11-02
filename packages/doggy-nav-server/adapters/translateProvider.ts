import type { TranslateProvider } from 'doggy-nav-core';
import axios from 'axios';

export class GoogleTranslateProvider implements TranslateProvider {
  async translate(text: string, sourceLang: string, targetLang: string): Promise<string> {
    const url = 'https://translate.googleapis.com/translate_a/single';
    const params = { client: 'gtx', sl: sourceLang, tl: targetLang, dt: 't', q: text } as const;
    const response = await axios.get(url, { params, timeout: 10000 });
    const data = response.data;
    if (data && Array.isArray(data) && data[0]) {
      let out = '';
      for (const seg of data[0]) if (seg && seg[0]) out += seg[0];
      return out || text;
    }
    return text;
  }

  async detectLanguage(text: string): Promise<string> {
    const url = 'https://translate.googleapis.com/translate_a/single';
    const params = { client: 'gtx', sl: 'auto', tl: 'en', dt: 't', q: text.substring(0, 500) } as const;
    const response = await axios.get(url, { params, timeout: 5000 });
    const data = response.data;
    if (data && Array.isArray(data) && data[2]) return data[2];
    return 'unknown';
  }
}

export default GoogleTranslateProvider;
