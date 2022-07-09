const request = require('request');
const cheerio = require('cheerio');
const mongoose = require("mongoose");
const mongoCfg =require('../config/mongodb').default;
var db = mongoose.connect(mongoCfg.mongoUrl, { useNewUrlParser: true,useUnifiedTopology: true });
db.mongoose=mongoose
//引入数据模型模块
const navData = require("../app/model/nav")(db);
const categorySchema = require("../app/model/category")(db);
const userSchema = require("../app/model/user")(db);
class Reptile {
  rootUrl: string;
  url: any;
  type: any;
  categoryId: any;
  constructor(url, type) {
    this.rootUrl = process.env.INIT_DB_URL?? ''
    this.url = this.rootUrl + url
    this.type = type
    this.init()
  }

  async init() {
    let categoryData = {
      name: this.type,
      categoryId: '',
    }
    const categoryDataRes = await categorySchema.create(categoryData)
    this.categoryId = categoryDataRes._id
    this.start()
  }

  async start() {
    return request(this.url, async (error, res, body) => {
      if (!error && res.statusCode == 200) {
        const $ = cheerio.load(body)
        const $cardBlock = $('.panel')

        for (let i = 0; i < $cardBlock.length; i++) {
          const secondCategoryName = $('.panel-title.card').eq(i).text().trim()
          const {_id: secondCategoryId } = await categorySchema.create({
            categoryId: this.categoryId,
            name: secondCategoryName
          })

          const websites:any[] = []
          const length = $('.panel').eq(i).find('.card-title').length
          for (let j = 0; j < length; j++) {
            const name = $('.panel').eq(i).find('.card-title').eq(j).text().trim()
            const href = $('.panel').eq(i).find('.card .card-heading').eq(j).attr('title')
            const desc = $('.panel').eq(i).find('.card .card-body').eq(j).text().trim()
            const logo = this.rootUrl + $('.panel').eq(i).find('.card-icon img').eq(j).attr('src')
            websites.push(navData.create({
              categoryId: secondCategoryId,
              name,
              href,
              desc,
              logo,
            }))
          }
          await Promise.all(websites)
        }
      }

      console.log(`${this.url}请求完成`)
    });
  }
}


async function getCategorys(url:string) {
  const categoryList= ['常用推荐','产品汪','设计狮','程序猿','运营马','数据可视化','数据分析','物联网IOT','办公']
  return request(url, async (error, res, body) => {
    if (!error && res.statusCode == 200) {
      let categoryData = {
        name: '产品经理',
        categoryId: '',
      }
      const categoryDataRes = await categorySchema.create(categoryData)

      const $ = cheerio.load(body)
      const $cardBlock = $('#content>.row.io-mx-n2')
      for (let i = 0; i < $cardBlock.length; i++) {
        if (categoryList.length ==i) {
          break
        }
        const secondCategoryName = categoryList[i]
        const {_id: secondCategoryId } = await categorySchema.create({
          categoryId: categoryDataRes._id,
          name: secondCategoryName
        })

        const websites:any[] = []
        const $aTags = $cardBlock.eq(i).find('.url-card a.card')
        const length = $aTags.length
        for (let j = 0; j < length; j++) {
          const name = $aTags.eq(j).find('strong').text().trim()
          const href = $aTags.eq(j).attr('data-url')
          const desc = $aTags.eq(j).attr('title')
          const logo = $aTags.eq(j).find('img').attr('data-src')
          websites.push(navData.create({
            categoryId: secondCategoryId,
            name,
            href,
            desc,
            logo,
          }))
        }
        await Promise.all(websites)
      }
    }
    console.log(`${url}请求完成`)
    process.exit(0);
  })
}


async function main() {
  // we recommend set INIT_DB_URL = 'https://www.peterx.cn/' just for a test
  const promise =() => new Promise(async (res) => {
    await getCategorys(process.env.INIT_DB_URL??'')
    let admin = {
      username: process.env.USERNAME??'admin',
      password: process.env.PASSWORD??'admin',
      isAdmin:true
    }
    const userDataRes = await userSchema.create(admin)
    res('success')
  }).then(_ => {
    console.log("db init done✅✅✅✅")
  })
  await promise()
}

main()
export default {
  getCategorys,
  Reptile
}
