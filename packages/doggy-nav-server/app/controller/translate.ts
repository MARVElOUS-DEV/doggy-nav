import { Controller } from 'egg';
import type { TranslateService } from 'doggy-nav-core';
import { TOKENS } from '../core/ioc';
import { Inject } from '../core/inject';

/**
 * Translation Controller
 * Handles translation requests
 */
export default class TranslateController extends Controller {
  @Inject(TOKENS.TranslateService)
  private translateService!: TranslateService;
  /**
   * Translate text from source language to target language
   * POST /api/translate
   */
  async translate() {
    const { ctx } = this;
    const { text, sourceLang, targetLang } = ctx.request.body;

    // Validate required parameters
    if (!text || !sourceLang || !targetLang) {
      ctx.status = 400;
      ctx.body = {
        error: 'Missing required fields',
        message: 'text, sourceLang, and targetLang are required',
      };
      return;
    }

    // Validate text length
    if (text.length > 5000) {
      ctx.status = 400;
      ctx.body = {
        error: 'Text too long',
        message: 'Text must be less than 5000 characters',
      };
      return;
    }

    try {
      const translatedText = await this.translateService.translateText(text, sourceLang, targetLang);

      ctx.status = 200;
      ctx.body = {
        translatedText,
        sourceLang,
        targetLang,
      };
    } catch (error) {
      ctx.logger.error('Translation error:', error);
      ctx.status = 500;
      ctx.body = {
        error: 'Translation failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}
