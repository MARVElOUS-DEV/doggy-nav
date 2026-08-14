import createApp from '../testApp';
import { JWTUtils } from '../utils/jwtUtils';

class HiddenImportMockD1Database {
  users = new Map<string, any>();
  roles = new Map<string, any>();
  userRoles = new Map<string, string[]>();
  bookmarks = new Map<string, any>();
  categories = new Map<string, any>();

  constructor() {
    this.roles.set('sysadmin', {
      id: 'role-sysadmin',
      slug: 'sysadmin',
      permissions: JSON.stringify(['*']),
    });
    this.roles.set('admin', {
      id: 'role-admin',
      slug: 'admin',
      permissions: JSON.stringify([
        'nav:create',
        'nav:update',
        'nav:delete',
        'nav:list',
        'nav:read',
      ]),
    });

    this.users.set('u-sysadmin', {
      id: 'u-sysadmin',
      username: 'root',
      email: 'root@example.com',
      is_active: 1,
      extra_permissions: '[]',
      avatar: null,
      password_hash: 'hash',
    });
    this.users.set('u-admin', {
      id: 'u-admin',
      username: 'admin',
      email: 'admin@example.com',
      is_active: 1,
      extra_permissions: '[]',
      avatar: null,
      password_hash: 'hash',
    });

    this.userRoles.set('u-sysadmin', ['sysadmin']);
    this.userRoles.set('u-admin', ['admin']);

    this.bookmarks.set('hidden-nav-1', {
      id: 'hidden-nav-1',
      category_id: null,
      name: 'Hidden',
      href: 'https://hidden.example.com',
      description: 'Hidden',
      detail: '',
      logo: '',
      author_name: '',
      author_url: '',
      audit_time: null,
      create_time: 111,
      tags: '["hidden-only"]',
      audience_visibility: 'hide',
      status: 0,
      view_count: 0,
      star_count: 0,
    });
  }

  prepare(sql: string) {
    const db = this;
    let params: any[] = [];

    const api = {
      bind(...bound: any[]) {
        params = bound;
        return api;
      },
      async first<T = any>() {
        if (sql.includes('FROM users WHERE id = ?')) {
          return (db.users.get(String(params[0])) || null) as T;
        }
        if (sql.includes('FROM categories WHERE id = ?')) {
          return (db.categories.get(String(params[0])) || null) as T;
        }
        if (sql.includes('FROM bookmarks WHERE id = ? LIMIT 1')) {
          return (db.bookmarks.get(String(params[0])) || null) as T;
        }
        if (sql.includes('SELECT * FROM bookmarks WHERE')) {
          const id = String(params[0]);
          return (db.bookmarks.get(id) || null) as T;
        }
        if (sql.includes('SELECT name FROM categories WHERE id = ? LIMIT 1')) {
          return (db.categories.get(String(params[0])) || null) as T;
        }
        return null as T;
      },
      async all<T = any>() {
        if (sql.includes('FROM roles r')) {
          const userId = String(params[0]);
          const slugs = db.userRoles.get(userId) || [];
          return {
            results: slugs
              .map((slug) => db.roles.get(slug))
              .filter(Boolean)
              .map((role) => ({ id: role.id, slug: role.slug })),
          } as T;
        }
        if (sql.includes('FROM groups g')) {
          return { results: [] } as T;
        }
        if (sql.includes('SELECT permissions FROM roles WHERE slug IN')) {
          return {
            results: params
              .map((slug) => db.roles.get(String(slug)))
              .filter(Boolean)
              .map((role) => ({ permissions: role.permissions })),
          } as T;
        }
        if (sql.includes("FROM bookmarks b") && sql.includes("json_each(COALESCE(b.tags, '[]')) jt")) {
          const includesHidden =
            sql.includes('WHERE (b.status = 0 OR b.status IS NULL)') &&
            sql.includes('AND 1=1') &&
            !sql.includes(`b.audience_visibility != 'hide'`) &&
            !sql.includes(`b.audience_visibility = 'public'`);
          const rows = Array.from(db.bookmarks.values())
            .filter((bookmark) => (bookmark.status ?? 0) === 0)
            .filter((bookmark) => includesHidden || bookmark.audience_visibility !== 'hide')
            .flatMap((bookmark) => {
              let tags: string[] = [];
              try {
                tags = JSON.parse(bookmark.tags || '[]');
              } catch {
                tags = [];
              }
              return tags.map((tag) => String(tag || '').trim()).filter(Boolean);
            })
            .reduce((map, tag) => {
              const id = tag.toLowerCase();
              const current = map.get(id);
              map.set(id, { id, name: tag, count: (current?.count || 0) + 1 });
              return map;
            }, new Map<string, { id: string; name: string; count: number }>());

          const sorted = Array.from(rows.values()).sort(
            (a, b) => b.count - a.count || a.name.localeCompare(b.name)
          );

          if (sql.includes('COUNT(1) AS cnt')) {
            return { results: [{ cnt: sorted.length }] } as T;
          }

          const limit = Number(params[0] ?? sorted.length);
          const offset = Number(params[1] ?? 0);
          return { results: sorted.slice(offset, offset + limit) } as T;
        }
        return { results: [] } as T;
      },
      async run() {
        if (sql.includes('INSERT INTO bookmarks')) {
          const [
            id,
            categoryId,
            name,
            href,
            description,
            detail,
            logo,
            authorName,
            authorUrl,
            createTime,
            tags,
            audienceVisibility,
            status,
          ] = params;
          db.bookmarks.set(String(id), {
            id: String(id),
            category_id: categoryId,
            name,
            href,
            description,
            detail,
            logo,
            author_name: authorName,
            author_url: authorUrl,
            create_time: createTime,
            tags,
            audience_visibility: audienceVisibility,
            status,
            audit_time: null,
            view_count: 0,
            star_count: 0,
          });
        }
        if (sql.includes('DELETE FROM bookmarks WHERE id = ?')) {
          const existed = db.bookmarks.delete(String(params[0]));
          return { meta: { rows_written: existed ? 1 : 0 } };
        }
        return { meta: { rows_written: 1 } };
      },
      raw: async () => [],
    };

    return api;
  }

  batch = jest.fn();
  exec = jest.fn();
  withSession = jest.fn();
  dump = jest.fn();
}

async function makeToken(payload: {
  userId: string;
  email: string;
  username: string;
  roles: string[];
  groups?: string[];
  permissions?: string[];
}) {
  const jwt = new JWTUtils('test-secret-key');
  const tokens = await jwt.generateTokenPair({
    userId: payload.userId,
    email: payload.email,
    username: payload.username,
    roles: payload.roles,
    roleIds: [],
    groups: payload.groups || [],
    groupIds: [],
    permissions: payload.permissions || [],
  });
  return tokens.accessToken;
}

describe('workers hidden bookmark import access', () => {
  it('blocks admin from creating hidden nav records', async () => {
    const db = new HiddenImportMockD1Database();
    const app = createApp({
      DB: db as any,
      JWT_SECRET: 'test-secret-key',
      NODE_ENV: 'test',
    } as any);
    const token = await makeToken({
      userId: 'u-admin',
      email: 'admin@example.com',
      username: 'admin',
      roles: ['admin'],
    });

    const response = await app.request('/api/nav', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Source': 'admin',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Hidden import',
        href: 'https://example.com',
        audience: { visibility: 'hide' },
      }),
    });

    expect(response.status).toBe(403);
  });

  it('allows sysadmin hidden imports and returns them by id', async () => {
    const db = new HiddenImportMockD1Database();
    const app = createApp({
      DB: db as any,
      JWT_SECRET: 'test-secret-key',
      NODE_ENV: 'test',
    } as any);
    const token = await makeToken({
      userId: 'u-sysadmin',
      email: 'root@example.com',
      username: 'root',
      roles: ['sysadmin'],
      permissions: ['*'],
    });

    const createResponse = await app.request('/api/nav', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Source': 'admin',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Hidden import',
        href: 'https://example.com',
        audience: { visibility: 'hide' },
        createTime: 123456,
      }),
    });

    expect(createResponse.status).toBe(200);
    const createData = await createResponse.json();
    const createdId = createData.data.id;
    const stored = db.bookmarks.get(createdId);
    expect(stored.audience_visibility).toBe('hide');
    expect(stored.status).toBe(0);
    expect(stored.create_time).toBe(123456);

    const getResponse = await app.request(`/api/nav?id=${createdId}`, {
      headers: {
        'X-App-Source': 'admin',
        Authorization: `Bearer ${token}`,
      },
    });

    expect(getResponse.status).toBe(200);
    const getData = await getResponse.json();
    expect(getData.data.id).toBe(createdId);
    expect(getData.data.name).toBe('Hidden import');
  });

  it('blocks admin from deleting hidden nav records', async () => {
    const db = new HiddenImportMockD1Database();
    const app = createApp({
      DB: db as any,
      JWT_SECRET: 'test-secret-key',
      NODE_ENV: 'test',
    } as any);
    const token = await makeToken({
      userId: 'u-admin',
      email: 'admin@example.com',
      username: 'admin',
      roles: ['admin'],
    });

    const response = await app.request('/api/nav', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Source': 'admin',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id: 'hidden-nav-1' }),
    });

    expect(response.status).toBe(403);
    expect(db.bookmarks.has('hidden-nav-1')).toBe(true);
  });

  it('returns hidden-only tags for sysadmin on tag list route', async () => {
    const db = new HiddenImportMockD1Database();
    db.bookmarks.set('public-nav-1', {
      id: 'public-nav-1',
      category_id: null,
      name: 'Public',
      href: 'https://public.example.com',
      description: 'Public',
      detail: '',
      logo: '',
      author_name: '',
      author_url: '',
      audit_time: null,
      create_time: 222,
      tags: '["public-tag"]',
      audience_visibility: 'public',
      status: 0,
      view_count: 0,
      star_count: 0,
    });

    const app = createApp({
      DB: db as any,
      JWT_SECRET: 'test-secret-key',
      NODE_ENV: 'test',
    } as any);
    const token = await makeToken({
      userId: 'u-sysadmin',
      email: 'root@example.com',
      username: 'root',
      roles: ['sysadmin'],
      permissions: ['*'],
    });

    const anonymousResponse = await app.request('/api/tag/list', {
      headers: {
        'X-App-Source': 'main',
      },
    });
    expect(anonymousResponse.status).toBe(200);
    const anonymousData = await anonymousResponse.json();
    expect(anonymousData.data.data).toEqual([
      { id: 'public-tag', name: 'public-tag', count: 1 },
    ]);

    const sysadminResponse = await app.request('/api/tag/list', {
      headers: {
        'X-App-Source': 'admin',
        Authorization: `Bearer ${token}`,
      },
    });
    expect(sysadminResponse.status).toBe(200);
    const sysadminData = await sysadminResponse.json();
    expect(sysadminData.data.data).toEqual([
      { id: 'hidden-only', name: 'hidden-only', count: 1 },
      { id: 'public-tag', name: 'public-tag', count: 1 },
    ]);
  });
});
