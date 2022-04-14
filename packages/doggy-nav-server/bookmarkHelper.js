import  mongoCfg from './config/mongodb'
const fs = require('fs')
const request = require('request');
const cheerio = require('cheerio');
const mongoose = require("mongoose");
const path = require('path');

var db = mongoose.connect(mongoCfg.mongoUrl, { useNewUrlParser: true });
db.mongoose=mongoose
//引入数据模型模块
const navData = require("./app/model/nav")(db);
const categorySchema = require("./app/model/category")(db);
const map = new Map()

function extractOrigin (url){
  return url.match(/^https?:\/\/.+?(?=\/)/)[0]
}
function isAbsoluteUrl (url) {
  return url.startsWith('http') || url.startsWith('//') || url.startsWith("data:image")
}

async function getBookmarkRoots (path){
  return new Promise((resolve) => {
    fs.readFile(path,{encoding:'utf-8'},(err, data) => {
      if (err) throw err;
      resolve(JSON.parse(data))
    })
  })
}

async function getLogo (url){
  const origin =extractOrigin(url)
  if (map.has(origin)) {
    return map.get(origin)
  }
  return new Promise((resolve)=> {
    request(origin,{timeout:10000}, (error, requestData, body) => {
      if (!error && requestData.statusCode == 200) {
        const $ = cheerio.load(body)
        let logo=''
        let final =''
        if($('link[rel="icon"]').length) {
          logo = $('link[rel="icon"]').eq(0).attr("href")
        }else if ($('link[rel*="shortcut"]').length) {
          logo = $('link[rel*="shortcut"]').eq(0).attr("href")
        }else if($('link[rel*="-icon"]').length){
          logo = $('link[rel*="-icon"]').eq(0).attr("href")
        }
        console.log("logo,",origin, logo);
        if (!logo) {
          final=`${origin}/favicon.ico`
        } else {
          final = logo
          if(!isAbsoluteUrl(logo)) {
            final =logo.startsWith('/')? `${origin}${logo}`:`${origin}/${logo}`
          }
        }
        map.set(origin,final)
        resolve(final)
      } else {
        console.error(`获取${url} 站点logo icon失败,error= ${error}`)
        map.set(origin,`${origin}/favicon.ico`)
        resolve(`${origin}/favicon.ico`)
      }
    })
  })
}
async function sleep (ms) {
  return new Promise((r) => {
    setTimeout(()=> {
      r()
    },ms)
  })
}

async function recursive(children, parentId) {
  for (let index = 0; index < children.length; index++) {
    const el = children[index];
    if (el.type === 'folder') {
      firstName = el.name
      const [f] = await categorySchema.find({
        name: { $eq: firstName },
        categoryId: {$eq: parentId}
      })
      let secondCategoryId=''
      if (f && f._id) {
        secondCategoryId= f._id
      }else {
        const { _id } = await categorySchema.create({
          categoryId: parentId,
          name: firstName
        })
        secondCategoryId = _id
      }
      await recursive(el.children, secondCategoryId)
    } else if(el.type==='url'){
      const {name,url:href} = el
      await navData.create({
        categoryId: parentId,
        name,
        href,
        desc:name,
        createDate:new Date(),
        logo: await getLogo(href),
      })
    }
  }
}

async function transform(roots) {
  let categoryData = {
    name: "私人书签",
    categoryId: '',
  }
  const categoryDataRes = await categorySchema.create(categoryData)
  const firstStage = roots.bookmark_bar.children
  await recursive(firstStage, categoryDataRes._id)
}

(async () => {
  try {
    if (!process.env.HOME) {
      console.info("try start with 【 npx ts-node && HOME=yourHomeDirName ts-node bookmarkHelper.js 】")
      return
    }
    const macPath = `${process.env.HOME}/Library/Application\ Support/Google/Chrome/Default/Bookmarks`
    const p = path.resolve(macPath)
    console.log(p);
    const bookmarks= await getBookmarkRoots(p)
    await transform(bookmarks.roots)
    console.info("import bookmarks done✅✅✅✅")
  } catch (error) {
    console.error(error);
  }
})()

