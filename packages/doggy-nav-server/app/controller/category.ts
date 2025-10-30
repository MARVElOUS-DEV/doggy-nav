import Controller from '../core/base_controller';
import { Types } from 'mongoose';
import { globalRootCategoryId } from '../../constants';
import { buildAudienceFilterEx } from '../utils/audience';
import type { AuthUserContext } from '../../types/rbac';

export default class CategoryController extends Controller {
  tableName(): string {
    return 'Category';
  }

  // visibility order from least to most restrictive
  private visibilityRank(v?: string) {
    const order: Record<string, number> = {
      public: 0,
      authenticated: 1,
      restricted: 2,
      hide: 3,
    };
    return order[v || 'public'] ?? 0;
  }

  private toIdStrings(arr: any): string[] {
    if (!Array.isArray(arr)) return [];
    return arr
      .map((x) => (typeof x === 'string' ? x : (x && x.toString ? x.toString() : '')))
      .filter((s) => typeof s === 'string' && /^[a-fA-F0-9]{24}$/.test(s));
  }

  private isAudienceNarrowerOrEqual(parentAud: any = {}, childAud: any = {}): boolean {
    const pVis = parentAud?.visibility || 'public';
    const cVis = childAud?.visibility || 'public';
    if (this.visibilityRank(cVis) < this.visibilityRank(pVis)) return false;

    if (pVis === 'restricted' && cVis === 'restricted') {
      const pRoles = new Set(this.toIdStrings(parentAud?.allowRoles));
      const pGroups = new Set(this.toIdStrings(parentAud?.allowGroups));
      const cRoles = this.toIdStrings(childAud?.allowRoles);
      const cGroups = this.toIdStrings(childAud?.allowGroups);
      const rolesOk = cRoles.every((r) => pRoles.has(r));
      const groupsOk = cGroups.every((g) => pGroups.has(g));
      return rolesOk && groupsOk;
    }
    return true;
  }

  async list() {
    const { ctx } = this;
    const { showInMenu } = ctx.query;
    try {
      const params: any = {};
      if (showInMenu) {
        params.showInMenu = { $eq: showInMenu !== 'false' };
      }

      // Audience filtering (+ legacy hide compatibility)
      const userCtx = ctx.state.userinfo as AuthUserContext | undefined;
      const filter = buildAudienceFilterEx(params, userCtx);

      const data = await ctx.model.Category.find(filter).limit(100000);
      const tree = ctx.service.category.formatCategoryList(data);
      this.success(tree);
    } catch (error: any) {
      this.error(error.message);
    }
  }

  async add() {
    const { ctx } = this;
    const body = this.getSanitizedBody();
    const { categoryId, audience } = body || {};
    if (categoryId && categoryId !== globalRootCategoryId && Types.ObjectId.isValid(categoryId)) {
      const parent = await ctx.model.Category.findOne({ _id: categoryId });
      if (parent) {
        if (!this.isAudienceNarrowerOrEqual(parent.audience, audience)) {
          this.error('Child category audience must be same or narrower than parent');
          return;
        }
      }
    }
    await super.add();
  }

  async edit() {
    const { ctx } = this;
    const body = this.getSanitizedBody();
    const { id } = body || {};
    if (id) {
      const current = await ctx.model.Category.findOne({ _id: id });
      if (current) {
        const effectiveAudience = body.audience ?? current.audience;
        const effectiveParentId = body.categoryId ?? current.categoryId;
        if (
          effectiveParentId &&
          effectiveParentId !== globalRootCategoryId &&
          Types.ObjectId.isValid(effectiveParentId)
        ) {
          const parent = await ctx.model.Category.findOne({ _id: effectiveParentId });
          if (parent) {
            if (!this.isAudienceNarrowerOrEqual(parent.audience, effectiveAudience)) {
              this.error('Child category audience must be same or narrower than parent');
              return;
            }
          }
        }
      }
    }
    await super.update();
  }

  async del() {
    const { ctx } = this;
    try {
      const { id } = ctx.request.body;
      const data = await Promise.all([
        ctx.model.Category.deleteOne({ _id: id }),
        ctx.model.Category.deleteOne({ categoryId: id }),
      ]);
      this.success(data);
    } catch (error: any) {
      this.error(error.message);
    }
  }
}
