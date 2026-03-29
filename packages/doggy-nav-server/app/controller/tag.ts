import Controller from '../core/base_controller';
import { buildAudienceFilterEx } from '../utils/audience';
import type { AuthUserContext } from '../../types/rbac';

export default class CategoryController extends Controller {
  tableName(): string {
    return 'Tag';
  }

  async getList() {
    const query = this.getSanitizedQuery();
    const pageSize = Math.min(Math.max(Number(query.pageSize) || 10, 1), 200);
    const pageNumber = Math.max(Number(query.pageNumber) || 1, 1);
    const skip = pageSize * pageNumber - pageSize;
    const userCtx = this.ctx.state.userinfo as AuthUserContext | undefined;
    const isAuthenticated = !!userCtx;

    const baseFilter: any = isAuthenticated
      ? {
          $or: [{ status: { $exists: false } }, { status: 0 }],
        }
      : { status: 0 };

    let matchFilter: any = buildAudienceFilterEx(baseFilter, userCtx);

    try {
      const allowedCategories = await this.ctx.model.Category.find(
        buildAudienceFilterEx({}, userCtx)
      ).select('_id');
      const allowedCategoryIds = allowedCategories.map((c: any) => c._id.toString());
      matchFilter = {
        $and: [
          matchFilter,
          {
            $or: [
              { categoryId: { $in: allowedCategoryIds } },
              { categoryId: { $exists: false } },
              { categoryId: null },
            ],
          },
        ],
      };
    } catch {
      // Fall back to nav-only visibility checks if category lookup fails
    }

    const basePipeline = [
      { $match: matchFilter },
      { $project: { tags: 1 } },
      { $unwind: '$tags' },
      {
        $project: {
          name: {
            $trim: {
              input: { $ifNull: ['$tags', ''] },
            },
          },
        },
      },
      { $match: { name: { $ne: '' } } },
      {
        $group: {
          _id: { $toLower: '$name' },
          name: { $first: '$name' },
          count: { $sum: 1 },
        },
      },
    ];

    const [rows, totalRows] = await Promise.all([
      this.ctx.model.Nav.aggregate([
        ...basePipeline,
        { $sort: { count: -1, name: 1 } },
        { $skip: skip },
        { $limit: pageSize },
      ]),
      this.ctx.model.Nav.aggregate([...basePipeline, { $count: 'total' }]),
    ]);

    const total = totalRows?.[0]?.total || 0;
    this.success({
      data: (rows || []).map((row: any) => ({
        id: row._id,
        name: row.name,
        count: row.count,
      })),
      total,
      pageNumber: Math.ceil(total / pageSize),
    });
  }
}
