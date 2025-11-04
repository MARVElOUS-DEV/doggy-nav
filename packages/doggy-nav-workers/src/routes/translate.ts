import { Hono } from 'hono';
import { createAuthMiddleware } from '../middleware/auth';
import { TOKENS } from '../ioc/tokens';
import { getDI } from '../ioc/helpers';

export const translateRoutes = new Hono<{ Bindings: { DB: D1Database } }>();

// Server-compat: POST /api/translate returns raw payload (no { code/msg/data } envelope)
translateRoutes.post('/', createAuthMiddleware({ required: true }), async (c) => {
  try {
    const body = await c.req.json();
    const { text, sourceLang, targetLang } = body || {};
    if (!text || !sourceLang || !targetLang) {
      return c.json(
        {
          error: 'Missing required fields',
          message: 'text, sourceLang, and targetLang are required',
        },
        400
      );
    }
    if (String(text).length > 5000) {
      return c.json(
        { error: 'Text too long', message: 'Text must be less than 5000 characters' },
        400
      );
    }
    const svc = getDI(c).resolve(TOKENS.TranslateService) as any;
    const translatedText: string = await svc.translateText(String(text), String(sourceLang), String(targetLang));
    return c.json({ translatedText, sourceLang, targetLang }, 200);
  } catch (err: any) {
    console.error('Translate error:', err);
    return c.json(
      { error: 'Translation failed', message: err?.message || 'Unknown error occurred' },
      500
    );
  }
});

export default translateRoutes;
