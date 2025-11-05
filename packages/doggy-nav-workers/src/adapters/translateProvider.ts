import type { TranslateProvider } from 'doggy-nav-core';

export class FetchTranslateProvider implements TranslateProvider {
  async translate(text: string, sourceLang: string, targetLang: string): Promise<string> {
    const url = new URL('https://translate.googleapis.com/translate_a/single');
    url.searchParams.set('client', 'gtx');
    url.searchParams.set('sl', sourceLang);
    url.searchParams.set('tl', targetLang);
    url.searchParams.set('dt', 't');
    url.searchParams.set('q', text);
    const res = await fetch(url.toString(), { method: 'GET' });
    const data = await res.json();
    if (data && Array.isArray(data) && data[0]) {
      let out = '';
      for (const seg of data[0]) if (seg && seg[0]) out += seg[0];
      return out || text;
    }
    return text;
  }

  async detectLanguage(text: string): Promise<string> {
    const url = new URL('https://translate.googleapis.com/translate_a/single');
    url.searchParams.set('client', 'gtx');
    url.searchParams.set('sl', 'auto');
    url.searchParams.set('tl', 'en');
    url.searchParams.set('dt', 't');
    url.searchParams.set('q', text.substring(0, 500));
    const res = await fetch(url.toString(), { method: 'GET' });
    const data = await res.json();
    if (data && Array.isArray(data) && data[2]) return data[2];
    return 'unknown';
  }
}

export default FetchTranslateProvider;
