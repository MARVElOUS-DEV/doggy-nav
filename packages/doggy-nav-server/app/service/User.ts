import { Service } from 'egg';


export default class UserService extends Service {
  async login() {
    const { ctx, app } = this;
    const { username, password } = ctx.request.body;
    if (username === undefined || password === undefined) {
      throw new Error('请输入用户名和密码');
    }
    const users = await ctx.model.User.findOne({ username, password });
    if (!users) {
      throw new Error('账号或密码错误');
    } else {
      const token = await app.jwt.sign({
        username,
      }, app.config.jwt.secret);
      return 'Bearer ' + token;
    }
  }
}
