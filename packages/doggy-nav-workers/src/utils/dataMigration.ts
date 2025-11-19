import { D1Database } from '@cloudflare/workers-types';
import { nowChromeTime } from 'doggy-nav-core';

/**
 * Data migration utilities for converting MongoDB data to D1 SQL database
 */
export class DataMigration {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * Generate UUID for new records (compatible with D1's text primary keys)
   */
  generateUUID(): string {
    // D1 doesn't have native UUID, so we create a simple one
    return (
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    );
  }

  /**
   * Convert MongoDB ObjectId to UUID string
   * @param objectId MongoDB ObjectId as string
   * @returns UUID-compatible string
   */
  convertObjectId(objectId: string): string {
    // Simple conversion: take the ObjectId and make it lowercase UUID-like
    return objectId.toLowerCase();
  }

  /**
   * Migrate users from MongoDB format to D1 format
   * @param mongoUsers Array of MongoDB user documents
   */
  async migrateUsers(mongoUsers: any[]): Promise<void> {
    const insertUser = this.db.prepare(`
      INSERT INTO users (
        id, username, email, password_hash, is_active, nick_name, phone,
        extra_permissions, last_login_at, created_at, updated_at,
        reset_password_token, reset_password_expires, avatar
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertUserRole = this.db.prepare(`
      INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)
    `);

    const insertUserGroup = this.db.prepare(`
      INSERT INTO user_groups (user_id, group_id) VALUES (?, ?)
    `);

    for (const user of mongoUsers) {
      const userId = this.convertObjectId(user._id.toString());

      // Insert user
      await insertUser
        .bind(
          userId,
          user.username || '',
          user.email || '',
          user.password || '',
          user.isActive ? 1 : 0,
          user.nickName || '',
          user.phone || '',
          JSON.stringify(user.extraPermissions || []),
          user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
          user.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
          user.updatedAt ? user.updatedAt.toISOString() : new Date().toISOString(),
          user.resetPasswordToken || null,
          user.resetPasswordExpires ? user.resetPasswordExpires.toISOString() : null,
          user.avatar || null
        )
        .run();

      // Insert user roles
      if (user.roles && Array.isArray(user.roles)) {
        for (const roleId of user.roles) {
          if (roleId) {
            await insertUserRole.bind(userId, this.convertObjectId(roleId.toString())).run();
          }
        }
      }

      // Insert user groups
      if (user.groups && Array.isArray(user.groups)) {
        for (const groupId of user.groups) {
          if (groupId) {
            await insertUserGroup.bind(userId, this.convertObjectId(groupId.toString())).run();
          }
        }
      }
    }
  }

  /**
   * Migrate roles from MongoDB format to D1 format
   * @param mongoRoles Array of MongoDB role documents
   */
  async migrateRoles(mongoRoles: any[]): Promise<void> {
    const insertRole = this.db.prepare(`
      INSERT INTO roles (
        id, slug, display_name, description, permissions,
        is_system, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const role of mongoRoles) {
      const roleId = this.convertObjectId(role._id.toString());

      await insertRole
        .bind(
          roleId,
          role.slug || '',
          role.displayName || '',
          role.description || '',
          JSON.stringify(role.permissions || []),
          role.isSystem ? 1 : 0,
          role.createdAt ? role.createdAt.toISOString() : new Date().toISOString(),
          role.updatedAt ? role.updatedAt.toISOString() : new Date().toISOString()
        )
        .run();
    }
  }

  /**
   * Migrate groups from MongoDB format to D1 format
   * @param mongoGroups Array of MongoDB group documents
   */
  async migrateGroups(mongoGroups: any[]): Promise<void> {
    const insertGroup = this.db.prepare(`
      INSERT INTO groups (
        id, slug, display_name, description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const group of mongoGroups) {
      const groupId = this.convertObjectId(group._id.toString());

      await insertGroup
        .bind(
          groupId,
          group.slug || '',
          group.displayName || '',
          group.description || '',
          group.createdAt ? group.createdAt.toISOString() : new Date().toISOString(),
          group.updatedAt ? group.updatedAt.toISOString() : new Date().toISOString()
        )
        .run();
    }
  }

  /**
   * Migrate categories from MongoDB format to D1 format
   * @param mongoCategories Array of MongoDB category documents
   */
  async migrateCategories(mongoCategories: any[]): Promise<void> {
    const insertCategory = this.db.prepare(`
      INSERT INTO categories (
        id, name, category_id, description, create_at, only_folder,
        icon, show_in_menu, audience_visibility, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertCategoryChild = this.db.prepare(`
      INSERT INTO category_children (
        category_id, name, category_id_ref, create_at, show_in_menu
      ) VALUES (?, ?, ?, ?, ?)
    `);

    const insertCategoryRolePermission = this.db.prepare(`
      INSERT INTO category_role_permissions (category_id, role_id) VALUES (?, ?)
    `);

    const insertCategoryGroupPermission = this.db.prepare(`
      INSERT INTO category_group_permissions (category_id, group_id) VALUES (?, ?)
    `);

    for (const category of mongoCategories) {
      const categoryId = this.convertObjectId(category._id.toString());

      await insertCategory
        .bind(
          categoryId,
          category.name || '',
          category.categoryId || '',
          category.description || '',
          category.createAt || nowChromeTime(),
          category.onlyFolder ? 1 : 0,
          category.icon || '',
          category.showInMenu ? 1 : 0,
          category.audience?.visibility || 'public',
          category.createdAt ? category.createdAt.toISOString() : new Date().toISOString(),
          category.updatedAt ? category.updatedAt.toISOString() : new Date().toISOString()
        )
        .run();

      // Insert category children
      if (category.children && Array.isArray(category.children)) {
        for (const child of category.children) {
          if (child.name) {
            await insertCategoryChild
              .bind(
                categoryId,
                child.name,
                child.categoryId || '',
                child.createAt || nowChromeTime(),
                child.showInMenu ? 1 : 0
              )
              .run();
          }
        }
      }

      // Insert category role permissions
      if (category.audience?.allowRoles && Array.isArray(category.audience.allowRoles)) {
        for (const roleId of category.audience.allowRoles) {
          if (roleId) {
            await insertCategoryRolePermission
              .bind(categoryId, this.convertObjectId(roleId.toString()))
              .run();
          }
        }
      }

      // Insert category group permissions
      if (category.audience?.allowGroups && Array.isArray(category.audience.allowGroups)) {
        for (const groupId of category.audience.allowGroups) {
          if (groupId) {
            await insertCategoryGroupPermission
              .bind(categoryId, this.convertObjectId(groupId.toString()))
              .run();
          }
        }
      }
    }
  }

  /**
   * Migrate bookmarks (nav items) from MongoDB format to D1 format
   * @param mongoBookmarks Array of MongoDB nav documents
   */
  async migrateBookmarks(mongoBookmarks: any[]): Promise<void> {
    const insertBookmark = this.db.prepare(`
      INSERT INTO bookmarks (
        id, category_id, name, href, description, detail, logo, author_name, author_url,
        audit_time, create_time, tags, view_count, star_count, status, is_favorite,
        url_status, last_url_check, response_time, audience_visibility, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertBookmarkRolePermission = this.db.prepare(`
      INSERT INTO bookmark_role_permissions (bookmark_id, role_id) VALUES (?, ?)
    `);

    const insertBookmarkGroupPermission = this.db.prepare(`
      INSERT INTO bookmark_group_permissions (bookmark_id, group_id) VALUES (?, ?)
    `);

    const insertBookmarkTag = this.db.prepare(`
      INSERT INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)
    `);

    for (const bookmark of mongoBookmarks) {
      const bookmarkId = this.convertObjectId(bookmark._id.toString());
      const categoryId = bookmark.categoryId
        ? this.convertObjectId(bookmark.categoryId.toString())
        : null;

      await insertBookmark
        .bind(
          bookmarkId,
          categoryId,
          bookmark.name || '',
          bookmark.href || '',
          bookmark.desc || '',
          bookmark.detail || bookmark.desc || '',
          bookmark.logo || '',
          bookmark.authorName || '',
          bookmark.authorUrl || '',
          bookmark.auditTime ? bookmark.auditTime.toISOString() : null,
          bookmark.createTime || nowChromeTime(),
          JSON.stringify(bookmark.tags || []),
          bookmark.view || 0,
          bookmark.star || 0,
          bookmark.status || 0,
          bookmark.isFavorite ? 1 : 0,
          bookmark.urlStatus || 'unknown',
          bookmark.lastUrlCheck || null,
          bookmark.responseTime || null,
          bookmark.audience?.visibility || 'public',
          bookmark.createdAt ? bookmark.createdAt.toISOString() : new Date().toISOString(),
          bookmark.updatedAt ? bookmark.updatedAt.toISOString() : new Date().toISOString()
        )
        .run();

      // Insert bookmark role permissions
      if (bookmark.audience?.allowRoles && Array.isArray(bookmark.audience.allowRoles)) {
        for (const roleId of bookmark.audience.allowRoles) {
          if (roleId) {
            await insertBookmarkRolePermission
              .bind(bookmarkId, this.convertObjectId(roleId.toString()))
              .run();
          }
        }
      }

      // Insert bookmark group permissions
      if (bookmark.audience?.allowGroups && Array.isArray(bookmark.audience.allowGroups)) {
        for (const groupId of bookmark.audience.allowGroups) {
          if (groupId) {
            await insertBookmarkGroupPermission
              .bind(bookmarkId, this.convertObjectId(groupId.toString()))
              .run();
          }
        }
      }
    }
  }

  /**
   * Migrate tags from MongoDB format to D1 format
   * @param mongoTags Array of MongoDB tag documents (if they exist)
   */
  async migrateTags(mongoTags: any[]): Promise<void> {
    const insertTag = this.db.prepare(`
      INSERT INTO tags (
        id, name, slug, description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const tag of mongoTags) {
      const tagId = this.convertObjectId(tag._id.toString());
      const slug = tag.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '';

      await insertTag
        .bind(
          tagId,
          tag.name || '',
          slug,
          tag.description || '',
          tag.createdAt ? tag.createdAt.toISOString() : new Date().toISOString(),
          tag.updatedAt ? tag.updatedAt.toISOString() : new Date().toISOString()
        )
        .run();
    }
  }

  /**
   * Migrate favorites from MongoDB format to D1 format
   * @param mongoFavorites Array of MongoDB favorite documents
   */
  async migrateFavorites(mongoFavorites: any[]): Promise<void> {
    const insertFavorite = this.db.prepare(`
      INSERT INTO favorites (
        user_id, bookmark_id, folder_name, created_at
      ) VALUES (?, ?, ?, ?)
    `);

    for (const favorite of mongoFavorites) {
      const userId = this.convertObjectId(favorite.userId.toString());
      const bookmarkId = this.convertObjectId(favorite.bookmarkId.toString());

      await insertFavorite
        .bind(
          userId,
          bookmarkId,
          favorite.folderName || '',
          favorite.createdAt ? favorite.createdAt.toISOString() : new Date().toISOString()
        )
        .run();
    }
  }

  /**
   * Validate data migration integrity
   */
  async validateMigration(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check that all tables have expected row counts
    const checks = [
      { table: 'users', expected: 'at least 1 user' },
      { table: 'roles', expected: 'at least 1 role' },
      { table: 'groups', expected: 'at least 1 group' },
      { table: 'categories', expected: 'at least 1 category' },
      { table: 'bookmarks', expected: 'at least 1 bookmark' },
    ];

    for (const check of checks) {
      const result = await this.db.prepare(`SELECT COUNT(*) as count FROM ${check.table}`).first();
      const count = result?.count || 0;

      if (count === 0) {
        errors.push(`Table ${check.table} has no records, expected ${check.expected}`);
      }
    }

    // Check foreign key relationships
    const fkChecks = [
      { table: 'user_roles', fkTable: 'users', fkColumn: 'user_id' },
      { table: 'user_groups', fkTable: 'users', fkColumn: 'user_id' },
      { table: 'category_role_permissions', fkTable: 'categories', fkColumn: 'category_id' },
      { table: 'bookmark_role_permissions', fkTable: 'bookmarks', fkColumn: 'bookmark_id' },
    ];

    for (const check of fkChecks) {
      const orphanedQuery = `
        SELECT COUNT(*) as orphaned_count
        FROM ${check.table}
        WHERE ${check.fkColumn} NOT IN (SELECT id FROM ${check.fkTable})
      `;
      const result = await this.db.prepare(orphanedQuery).first();
      const orphanedCount = Number((result as any)?.orphaned_count ?? 0);

      if (orphanedCount > 0) {
        errors.push(`Found ${orphanedCount} orphaned records in ${check.table}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get migration statistics
   */
  async getMigrationStats(): Promise<Record<string, number>> {
    const tables = ['users', 'roles', 'groups', 'categories', 'bookmarks', 'tags', 'favorites'];
    const stats: Record<string, number> = {};

    for (const table of tables) {
      const result = await this.db.prepare(`SELECT COUNT(*) as count FROM ${table}`).first();
      stats[table] = Number((result as any)?.count ?? 0);
    }

    return stats;
  }

  /**
   * Reset all data (for development/testing)
   */
  async resetAllData(): Promise<void> {
    const tables = [
      'favorites',
      'bookmark_tags',
      'bookmark_role_permissions',
      'bookmark_group_permissions',
      'category_children',
      'category_role_permissions',
      'category_group_permissions',
      'user_roles',
      'user_groups',
      'bookmarks',
      'categories',
      'tags',
      'users',
      'roles',
      'groups',
    ];

    for (const table of tables) {
      await this.db.prepare(`DELETE FROM ${table}`).run();
    }
  }
}
