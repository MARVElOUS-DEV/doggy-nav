import { Hono } from 'hono';
import { TOKENS } from '../ioc/tokens';
import { getDI } from '../ioc/helpers';
import { responses } from '../utils/responses';
import { createAuthMiddleware, requireRole, publicRoute } from '../middleware/auth';
import { newId24 } from '../utils/id';
import { GLOBAL_ROOT_CATEGORY_ID, nowChromeTime } from 'doggy-nav-core';

export const categoryRoutes = new Hono<{ Bindings: { DB: D1Database } }>();

categoryRoutes.get('/list', publicRoute(), async (c) => {
  try {
    const showInMenu = c.req.query('showInMenu');
    const svc = getDI(c).resolve(TOKENS.CategoryService);
    const user = c.get?.('user');
    const auth = user
      ? ({
          roles: Array.isArray(user.roles) ? user.roles : [],
          groups: Array.isArray(user.groups) ? user.groups : [],
          source: 'main' as const,
        } as any)
      : undefined;
    const tree = await svc.listTree(auth, {
      showInMenu: showInMenu ? showInMenu !== 'false' : undefined,
      rootId: GLOBAL_ROOT_CATEGORY_ID,
    });
    return c.json(responses.ok(tree));
  } catch (err) {
    console.error('Worker category list error:', err);
    return c.json(responses.serverError(), 500);
  }
});

// Create category (server-compat)
categoryRoutes.post(
  '/',
  createAuthMiddleware({ required: true }),
  requireRole('sysadmin'),
  async (c) => {
    try {
      const body = await c.req.json();
      const { name, categoryId, description, icon, showInMenu, onlyFolder, audience } = body || {};
      if (!name || !categoryId)
        return c.json(responses.badRequest('name and categoryId are required'), 400);
      const createAt = nowChromeTime();
      const vis = (audience?.visibility as string) || 'public';
      const db = c.env.DB;
      const id = newId24();
      await db
        .prepare(
          `INSERT INTO categories (id, name, category_id, description, create_at, only_folder, icon, show_in_menu, audience_visibility)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          id,
          String(name),
          String(categoryId),
          description || '',
          createAt,
          onlyFolder ? 1 : 0,
          icon || '',
          showInMenu ? 1 : 0,
          vis
        )
        .run();

      // Permissions when restricted
      if (vis === 'restricted') {
        const allowRoles: string[] = Array.isArray(audience?.allowRoles) ? audience.allowRoles : [];
        const allowGroups: string[] = Array.isArray(audience?.allowGroups)
          ? audience.allowGroups
          : [];
        for (const rid of allowRoles) {
          await db
            .prepare(`INSERT INTO category_role_permissions (category_id, role_id) VALUES (?, ?)`)
            .bind(id, rid)
            .run();
        }
        for (const gid of allowGroups) {
          await db
            .prepare(`INSERT INTO category_group_permissions (category_id, group_id) VALUES (?, ?)`)
            .bind(id, gid)
            .run();
        }
      }

      return c.json(responses.ok({ id }));
    } catch (err) {
      console.error('Category create error:', err);
      return c.json(responses.serverError(), 500);
    }
  }
);

// Update category (server-compat)
categoryRoutes.put(
  '/',
  createAuthMiddleware({ required: true }),
  requireRole('sysadmin'),
  async (c) => {
    try {
      const body = await c.req.json();
      const { id, name, categoryId, description, icon, showInMenu, onlyFolder, audience } =
        body || {};
      if (!id) return c.json(responses.badRequest('id required'), 400);
      const db = c.env.DB;
      const fields: string[] = [];
      const params: any[] = [];
      if (name !== undefined) {
        fields.push('name = ?');
        params.push(String(name));
      }
      if (categoryId !== undefined) {
        fields.push('category_id = ?');
        params.push(String(categoryId));
      }
      if (description !== undefined) {
        fields.push('description = ?');
        params.push(description || '');
      }
      if (onlyFolder !== undefined) {
        fields.push('only_folder = ?');
        params.push(onlyFolder ? 1 : 0);
      }
      if (icon !== undefined) {
        fields.push('icon = ?');
        params.push(icon || '');
      }
      if (showInMenu !== undefined) {
        fields.push('show_in_menu = ?');
        params.push(showInMenu ? 1 : 0);
      }
      let vis: string | undefined;
      if (audience && audience.visibility !== undefined) {
        vis = String(audience.visibility || 'public');
        fields.push('audience_visibility = ?');
        params.push(vis);
      }
      if (fields.length) fields.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')");
      if (fields.length) {
        const sql = `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`;
        await db
          .prepare(sql)
          .bind(...params, id)
          .run();
      }

      // Reset permissions
      if (audience) {
        await db
          .prepare('DELETE FROM category_role_permissions WHERE category_id = ?')
          .bind(id)
          .run();
        await db
          .prepare('DELETE FROM category_group_permissions WHERE category_id = ?')
          .bind(id)
          .run();
        if ((audience.visibility || vis) === 'restricted') {
          const allowRoles: string[] = Array.isArray(audience.allowRoles)
            ? audience.allowRoles
            : [];
          const allowGroups: string[] = Array.isArray(audience.allowGroups)
            ? audience.allowGroups
            : [];
          for (const rid of allowRoles) {
            await db
              .prepare(`INSERT INTO category_role_permissions (category_id, role_id) VALUES (?, ?)`)
              .bind(id, rid)
              .run();
          }
          for (const gid of allowGroups) {
            await db
              .prepare(
                `INSERT INTO category_group_permissions (category_id, group_id) VALUES (?, ?)`
              )
              .bind(id, gid)
              .run();
          }
        }
      }

      return c.json(responses.ok({ id }));
    } catch (err) {
      console.error('Category update error:', err);
      return c.json(responses.serverError(), 500);
    }
  }
);

// Delete category (server-compat)
categoryRoutes.delete(
  '/',
  createAuthMiddleware({ required: true }),
  requireRole('sysadmin'),
  async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      const id = body?.id;
      if (!id) return c.json(responses.badRequest('id required'), 400);
      const res = await c.env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
      if ((res.meta?.rows_written ?? 0) === 0)
        return c.json(responses.notFound('Category not found'), 404);
      return c.json(responses.ok({}));
    } catch (err) {
      console.error('Category delete error:', err);
      return c.json(responses.serverError(), 500);
    }
  }
);
