import { Hono } from 'hono';
import { CategoryService } from 'doggy-nav-core';
import D1CategoryRepository from '../adapters/d1CategoryRepository';
import { responses } from '../index';

// Keep in sync with server's globalRootCategoryId
const GLOBAL_ROOT_CATEGORY_ID = '4bvirtualcb9ff050738cc16';

export const categoryRoutes = new Hono<{ Bindings: { DB: D1Database } }>();

categoryRoutes.get('/list', async (c) => {
  try {
    const showInMenu = c.req.query('showInMenu');
    const repo = new D1CategoryRepository(c.env.DB);
    const svc = new CategoryService(repo);
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
