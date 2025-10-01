import { parseHTML } from '../../utils/reptileHelper';
import { nowToChromeTime } from '../../utils/timeUtil';
import Controller from '../core/base_controller';

enum NAV_STATUS {
  pass,
  wait,
  refuse,
}

export default class NavController extends Controller {
  tableName(): string {
    return 'Nav';
  }

  async list() {
    const { ctx } = this;
    const { status = 0, categoryId, name, hide } = ctx.query;

    let findParam: any = {};

    // Handle status filter
    if (status !== undefined && status !== '') {
      findParam.status = Number(status);
    } else {
      findParam = {
        $or: [
          { status: { $exists: false } },
          { status: 0 },
        ],
      };
    }

    // Filter hide based on authentication state
    const isAuthenticated = this.isAuthenticated();
    if (!isAuthenticated) {
      // For non-authenticated users, only show non-hidden items
      if (!hide) {
        findParam.hide = { $eq: false };
      }
    } else if (hide !== undefined) {
      // For authenticated users, respect the hide parameter if provided
      findParam.hide = { $eq: hide === 'true' };
    }

    if (categoryId) {
      findParam.categoryId = {
        $eq: categoryId,
      };
    }
    if (name) {
      const reg = new RegExp(name, 'i');
      findParam.name = {
        $regex: reg,
      };
    }

    await super.getList(findParam);
  }

  async add() {
    this.ctx.request.body.status = NAV_STATUS.wait;
    this.ctx.request.body.createTime = nowToChromeTime();
    await super.add();
  }

  async reptile() {
    const { ctx } = this;
    const { url } = ctx.query;
    const res = await parseHTML(url);
    if (res === null) {
      this.error('获取网站信息失败');
      return;
    }
    this.success(res);
  }

  async del() {
    await super.remove();
  }

  async edit() {
    this.ctx.request.body.updateTime = new Date();
    const { tags } = this.ctx.request.body;
    if (Array.isArray(tags)) {
      await this.ctx.service.tag.addMultiTag(tags);
    }
    await super.update();
  }

  async audit() {
    this.ctx.request.body.auditTime = new Date();

    const { status, id } = this.ctx.request.body;

    const navItem = await this.ctx.model.Nav.findOne({ _id: id });
    const { tags } = navItem;

    if (status === NAV_STATUS.pass) {
      // 批量添加tag
      await this.ctx.service.tag.addMultiTag(tags);
    }
    await super.update();
  }

  /**
   * 取出一级分类下面的所有网站，并且处理返回
   */
  async info() {
    const { request, model } = this.ctx;
    try {
      const { categoryId } = request.query;
      const resData: any = [];
      // 取所有子分类， filter by hide based on authentication
      const isAuthenticated = this.isAuthenticated();
      const categoryFilter: any = {
        $or: [
          { categoryId },
          { _id: categoryId },
        ] };

      // For non-authenticated users, also filter out hidden categories
      if (!isAuthenticated) {
        categoryFilter.hide = { $eq: false };
      }

      const categorys = await model.Category.find(categoryFilter);
      const categoryIds = categorys.reduce((t, v) => [ ...t, v._id ], []);

      const navFindParam: any = {
        categoryId: { $in: categoryIds },
        $or: [
          { status: { $exists: false } },
          { status: 0 },
        ],
      };

      // For non-authenticated users, also filter out hidden nav items
      if (!isAuthenticated) {
        navFindParam.hide = { $eq: false };
      }

      const navs = await model.Nav.find(navFindParam);

      categorys.map(category => {
        const nowNavs = navs.filter(nav => nav.categoryId === category._id.toString());
        resData.push({
          _id: category._id,
          name: category.name,
          list: nowNavs,
        });
        return category;
      });
      this.success(resData);
    } catch (error:any) {
      this.error(error.message);
    }
  }


  async get() {
    const { ctx } = this;
    const { id, keyword } = ctx.query;

    if (id) {
      const nav = await ctx.model.Nav.findOne({ _id: id });
      if (nav && nav.categoryId) {
        const category = await ctx.model.Category.findOne({ _id: nav.categoryId });
        if (category) {
          const navObj = nav.toObject();
          navObj.categoryName = category.name;
          this.success(navObj);
        } else {
          this.success(nav);
        }
      } else {
        this.success(nav);
      }
    } else if (keyword) {
      const reg = new RegExp(keyword, 'i');
      let { pageSize = 10, pageNumber = 1 } = ctx.query;
      pageSize = Number(pageSize);
      pageNumber = Number(pageNumber);
      const skipNumber = pageSize * pageNumber - pageSize;

      const searchQuery: any = {
        name: { $regex: reg },
      };

      // For non-authenticated users, also filter out hidden nav items
      const isAuthenticated = this.isAuthenticated();
      if (!isAuthenticated) {
        searchQuery.hide = { $eq: false };
      }

      const [ navs, total ] = await Promise.all([
        ctx.model.Nav.find(searchQuery).skip(skipNumber).limit(pageSize)
          .sort({ _id: -1 }),
        ctx.model.Nav.find(searchQuery).countDocuments(),
      ]);

      const navsWithCategory = await Promise.all(navs.map(async nav => {
        if (nav.categoryId) {
          const category = await ctx.model.Category.findOne({ _id: nav.categoryId });
          const navObj = nav.toObject();
          if (category) {
            navObj.categoryName = category.name;
          }
          return navObj;
        }
        return nav.toObject();
      }));

      this.success({
        data: navsWithCategory,
        total,
        pageNumber: Math.ceil(total / pageSize),
      });
    }
  }

  async random() {
    await super.getRandomList();
  }

  async ranking() {
    const isAuthenticated = this.isAuthenticated();

    const [ view, star, news ] = await Promise.all([
      this.service.nav.findMaxValueList('view', isAuthenticated),
      this.service.nav.findMaxValueList('star', isAuthenticated),
      this.service.nav.findMaxValueList('createTime', isAuthenticated),
    ]);

    this.success({
      view,
      star,
      news,
    });
  }
}
