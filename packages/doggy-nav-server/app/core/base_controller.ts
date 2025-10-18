import { buildAudienceOr } from '../utils/audience';
import { Controller } from 'egg';
import { ValidationError } from './errors';

export default class CommonController extends Controller {

  // Input sanitization function
  private sanitizeInput(input: any): any {
    if (input instanceof Date) {
      // Return Date objects as-is to preserve their type
      return input;
    }
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

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeResponseData(item));
    }

    // Handle mongoose documents and plain objects
    if (typeof data === 'object' && data !== null) {
      // For mongoose documents, use toJSON() which applies schema transforms
      if (data.toJSON) {
        return data.toJSON();
      }

      // For plain objects, process recursively
      const sanitized: any = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          // Convert ObjectId to string if present
          if (key === '_id' && typeof data[key] === 'object' && data[key].toString) {
            sanitized[key] = data[key].toString();
          } else {
            sanitized[key] = this.sanitizeResponseData(data[key]);
          }
        }
      }

      return sanitized;
    }

    return data;
  }


  // 添加
  async add() {
    const body = this.getSanitizedBody();
    const tableName = this.tableName();
    const res = await this.ctx.model[tableName].create(body);
    this.success(res);
  }

  // 删除
  async remove() {
    const body = this.getSanitizedBody();
    const tableName = this.tableName();
    const id = body.id;
    if (!id) {
      throw new ValidationError('ID is required');
    }
    const res = await this.ctx.model[tableName].deleteOne({ _id: id });
    this.success(res);
  }

  // 更新
  async update() {
    const body = this.getSanitizedBody();
    const tableName = this.tableName();
    const id = body.id;
    if (!id) {
      throw new ValidationError('ID is required');
    }
    delete body.id;
    const res = await this.ctx.model[tableName].updateOne({ _id: id }, body);
    this.success(res);
  }

  // 查找一个
  async get() {
    const query = this.getSanitizedQuery();
    const tableName = this.tableName();
    const id = query.id;
    if (!id) {
      throw new ValidationError('ID is required');
    }
    const res = await this.ctx.model[tableName].findOne({ _id: id });
    this.success(res);
  }

  // 查找多个
  async getList(findObj = {}, otherCMD = (_table: any) => _table) {
    const query = this.getSanitizedQuery();
    const tableName = this.tableName();

    let { pageSize = 10, pageNumber = 1 } = query;
    pageSize = Math.min(Math.max(Number(pageSize) || 10, 1), 100);
    pageNumber = Math.max(Number(pageNumber) || 1, 1);
    const skipNumber = pageSize * pageNumber - pageSize;
    const table = this.ctx.model[tableName];

    const [ data, total ] = await Promise.all([
      otherCMD(
        table
          .find(findObj)
          .skip(skipNumber)
          .limit(pageSize)
          .sort({ _id: -1 })
          .lean()
          .select('-__v')
      ),
      table.find(findObj).countDocuments(),
    ]);

    this.success({
      data,
      total,
      pageNumber: Math.ceil(total / pageSize),
    });
  }

  // 查找随机数量列表
  async getRandomList(randomNumber = 10) {
    const tableName = this.tableName();
    const safeRandomNumber = Math.min(Math.max(Number(randomNumber) || 10, 1), 50);

    // Add filtering based on authentication and hide field for Nav model
    const pipeline: any[] = [];

    if (tableName === 'Nav') {
      const isAuthenticated = this.isAuthenticated();
      const userCtx = this.ctx.state.userinfo;
      const matchQuery: any = {};

      if (!isAuthenticated) {
        matchQuery.status = 0; // NAV_STATUS.pass
      }

      const or = buildAudienceOr(userCtx);
      const finalMatch = Object.keys(matchQuery).length > 0 ? { $and: [ matchQuery, { $or: or } ] } : { $or: or };
      pipeline.push({ $match: finalMatch });
    }

    pipeline.push({ $sample: { size: safeRandomNumber } });

    const res = await this.ctx.model[tableName].aggregate(pipeline);

    // Convert aggregation results to Mongoose documents to apply schema transformations
    const model = this.ctx.model[tableName];
    const transformedRes = res.map(doc => {
      const mongooseDoc = new model(doc);
      return mongooseDoc.toJSON();
    });

    this.success(transformedRes);
  }
}
