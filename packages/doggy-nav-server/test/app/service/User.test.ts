import * as assert from 'assert';
import { Context } from 'egg';
import { app,mock } from 'egg-mock/bootstrap';

describe('test/app/service/User.test.js', () => {
  let ctx: Context;

  beforeEach(async () => {
    ctx = app.mockContext();
    mock(app.jwt,"sign",async ()=> 'testToken')
    mock(ctx.model.User, "findOne",async ()=> ({username:'test',password:"111111"}))
  });
  afterEach(async()=> {
    mock.restore()
  })

  it('should login ok', async () => {
    mock(ctx.request,"body",{username:'test',password:"111111"})
    const result = await ctx.service.user.login();
    assert(result === 'Bearer testToken');
  });
  it('should login fail', async () => {
    mock(ctx.request,"body",{username:'fake',password:"111111"})
    const result = await ctx.service.user.login().catch(e => e.message);
    assert(result === '账号或密码错误');
  });

  it('should login ok and create a default user', async () => {
    mock(app.jwt,"sign",async ()=> 'testToken')
    mock(ctx.model.User, "findOne",async ()=> null)
    mock(ctx.model.User, "create",async ()=> "ok")
    mock(ctx.request,"body",{username:'test',password:"111111"})
    const result = await ctx.service.user.login();
    assert(result === 'Bearer testToken');
  });
});
