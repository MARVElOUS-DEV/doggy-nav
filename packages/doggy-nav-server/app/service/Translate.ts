import { Service } from 'egg';
import axios from 'axios';

/**
 * Translation Service
 * Provides translation functionality using Google Translate API (free tier)
 */
export default class TranslateService extends Service {
  /**
   * Translate text using Google Translate API
   * @param text - Text to translate
   * @param sourceLang - Source language code
   * @param targetLang - Target language code
   * @returns Translated text
   */
  async translateText(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<string> {
    try {
      // Use Google Translate API (free, no API key required)
      // This uses the unofficial API endpoint
      const url = 'https://translate.googleapis.com/translate_a/single';
      
      const params = {
        client: 'gtx',
        sl: sourceLang,
        tl: targetLang,
        dt: 't',
        q: text,
      };

      const response = await axios.get(url, {
        params,
        timeout: 10000, // 10 second timeout
      });

      // Parse the response
      // Response format: [[[translated_text, original_text, null, null, 3]], null, source_lang]
      if (response.data && Array.isArray(response.data) && response.data[0]) {
        const translations = response.data[0];
        let translatedText = '';
        
        // Concatenate all translation segments
        for (const segment of translations) {
          if (segment && segment[0]) {
            translatedText += segment[0];
          }
        }

        return translatedText || text;
      }

      // Fallback if response format is unexpected
      this.logger.warn('Unexpected translation response format:', response.data);
      return text;
    } catch (error) {
      this.logger.error('Translation API error:', error);
      
      // If translation fails, return a fallback
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Translation request timed out');
        }
        if (error.response?.status === 429) {
          throw new Error('Translation rate limit exceeded, please try again later');
        }
      }
      
      throw new Error('Translation service unavailable');
    }
  }

  /**
   * Detect language of text
   * @param text - Text to detect language
   * @returns Detected language code
   */
  async detectLanguage(text: string): Promise<string> {
    try {
      const url = 'https://translate.googleapis.com/translate_a/single';
      
      const params = {
        client: 'gtx',
        sl: 'auto',
        tl: 'en',
        dt: 't',
        q: text.substring(0, 500), // Only use first 500 chars for detection
      };

      const response = await axios.get(url, {
        params,
        timeout: 5000,
      });

      // Response format includes detected language at index 2
      if (response.data && Array.isArray(response.data) && response.data[2]) {
        return response.data[2];
      }

      return 'unknown';
    } catch (error) {
      this.logger.error('Language detection error:', error);
      return 'unknown';
    }
  }
}
