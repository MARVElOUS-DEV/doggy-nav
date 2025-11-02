import { Hono } from 'hono';
import { TOKENS } from '../ioc/tokens';
import { getDI } from '../ioc/helpers';
import { responses } from '../index';

// Keep in sync with server's globalRootCategoryId
const GLOBAL_ROOT_CATEGORY_ID = '4bvirtualcb9ff050738cc16';

export const categoryRoutes = new Hono<{ Bindings: { DB: D1Database } }>();

categoryRoutes.get('/list', async (c) => {
  try {
    const showInMenu = c.req.query('showInMenu');
    const svc = getDI(c).resolve(TOKENS.CategoryService);
    const tree = await svc.listTree(undefined, {
      showInMenu: showInMenu ? showInMenu !== 'false' : undefined,
      rootId: GLOBAL_ROOT_CATEGORY_ID,
    });
    return c.json(responses.ok(tree));
  } catch (err) {
    console.error('Worker category list error:', err);
    return c.json(responses.serverError(), 500);
  }
});
