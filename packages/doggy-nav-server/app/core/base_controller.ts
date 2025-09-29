import { Controller } from 'egg';

export default class CommonController extends Controller {

  // Input sanitization function
  private sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return input
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    if (typeof input === 'object' && input !== null && !Array.isArray(input)) {
      const sanitized: any = {};
      for (const key in input) {
        if (Object.prototype.hasOwnProperty.call(input, key)) {
          sanitized[key] = this.sanitizeInput(input[key]);
        }
      }
      return sanitized;
    }
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    return input;
  }

  // Get sanitized request body
  protected getSanitizedBody() {
    return this.sanitizeInput(this.ctx.request.body);
  }

  // Get sanitized query parameters
  protected getSanitizedQuery() {
    return this.sanitizeInput(this.ctx.query);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.ctx.state.userinfo;
  }

  // Get user info if authenticated
  getUserInfo() {
    return this.ctx.state.userinfo;
  }

  tableName() {
    return '';
  }

  success(data) {
    const sanitizedData = this.sanitizeResponseData(data);
    this.ctx.body = {
      code: 1,
      msg: 'ok',
      data: sanitizedData,
    };
  }

  error(msg) {
    this.ctx.body = {
      code: 0,
      msg: typeof msg === 'string' ? msg.replace(/[<>]/g, '') : msg,
      data: null,
    };
  }

  // Sanitize response data to prevent sensitive info leakage
  private sanitizeResponseData(data: any): any {
    if (!data) return data;

    if (typeof data === 'object' && data !== null) {
      const plainData = data.toObject ? data.toObject() : data;
      if (Array.isArray(data)) {
        return data.map(item => this.sanitizeResponseData(item));
      }

      const sanitized: any = {};
      for (const key in plainData) {
        if (Object.prototype.hasOwnProperty.call(plainData, key)) {
          if (key === 'password' || key === 'resetPasswordToken') {
            continue;
          }
          sanitized[key] = this.sanitizeResponseData(plainData[key]);
        }
      }
      return sanitized;
    }

    return data.toObject ? data.toObject() : data;
  }


  // 添加
  async add() {
    const body = this.getSanitizedBody();
    const tableName = this.tableName();
    try {
      const res = await this.ctx.model[tableName].create(body);
      this.success(res);
    } catch (e: any) {
      this.error(e.message);
    }
  }

  // 删除
  async remove() {
    const body = this.getSanitizedBody();
    const tableName = this.tableName();
    try {
      const id = body.id;
      if (!id) {
        throw new Error('ID is required');
      }
      const res = await this.ctx.model[tableName].deleteOne({ _id: id });
      this.success(res);
    } catch (e: any) {
      this.error(e.message);
    }
  }

  // 更新
  async update() {
    const body = this.getSanitizedBody();
    const tableName = this.tableName();
    try {
      const id = body.id;
      if (!id) {
        throw new Error('ID is required');
      }
      delete body.id;
      const res = await this.ctx.model[tableName].updateOne({ _id: id }, body);
      this.success(res);
    } catch (e: any) {
      this.error(e.message);
    }
  }

  // 查找一个
  async get() {
    const query = this.getSanitizedQuery();
    const tableName = this.tableName();
    try {
      const id = query.id;
      if (!id) {
        throw new Error('ID is required');
      }
      const res = await this.ctx.model[tableName].findOne({ _id: id });
      this.success(res);
    } catch (e: any) {
      this.error(e.message);
    }
  }

  // 查找多个
  async getList(findObj = {}, otherCMD = (_table: any) => _table) {
    const query = this.getSanitizedQuery();
    const tableName = this.tableName();

    try {
      let { pageSize = 10, pageNumber = 1 } = query;
      pageSize = Math.min(Math.max(Number(pageSize) || 10, 1), 100);
      pageNumber = Math.max(Number(pageNumber) || 1, 1);
      const skipNumber = pageSize * pageNumber - pageSize;
      const table = this.ctx.model[tableName];

      const [ data, total ] = await Promise.all([
        otherCMD(table.find(findObj).skip(skipNumber).limit(pageSize)
          .sort({ _id: -1 })),
        table.find(findObj).countDocuments(),
      ]);

      this.success({
        data: data.toObject ? data.toObject() : data,
        total,
        pageNumber: Math.ceil(total / pageSize),
      });
    } catch (e: any) {
      this.error(e.message);
    }
  }

  // 查找随机数量列表
  async getRandomList(randomNumber = 10) {
    const tableName = this.tableName();
    try {
      const safeRandomNumber = Math.min(Math.max(Number(randomNumber) || 10, 1), 50);
      const res = await this.ctx.model[tableName].aggregate([{ $sample: { size: safeRandomNumber } }]);
      this.success(res);
    } catch (e: any) {
      this.error(e.message);
    }
  }
}
