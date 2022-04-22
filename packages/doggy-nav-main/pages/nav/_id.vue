<template>
    <div class="container" v-loading="loading">
      <el-row :gutter="25" class="site-info">
        <el-col class="item" :md="6" :xs="24">
          <div class="left">
            <div class="img-wrap">
              <nuxt-link to="/">
                <el-image :src="detail.logo"/>
              </nuxt-link>
            </div>
            <div class="tool">
              <el-tooltip content="访问数" placement="top">
                <div class="tool-item">
                  <i class="iconfont icon-attentionfill"></i>
                  <p>{{ detail.view }}</p>
                </div>
              </el-tooltip>
              <div style="width: 30px"></div>

              <el-tooltip content="点赞数" placement="top">
                <div :class="`tool-item ${isStar && 'active'}`" @click="handleNavStarFn">
                  <i class="iconfont icon-appreciatefill"></i>
                  <p>{{ detail.star }}</p>
                </div>
              </el-tooltip>
            </div>
          </div>
        </el-col>
        <el-col class="item" :md="10" :xs="24">
          <div class="content">
            <h1 class="title">{{ detail.name }}</h1>
            <p class="desc">{{ detail.desc }}</p>
            <p class="tags" v-if="detail.tags.length">标签：
              <span v-for="(tag, index) in detail.tags" :key="tag">{{index != 0 ? '，' : ''}}{{tag}}</span>
            </p>
            <p class="author" v-if="detail.authorName">
              <span class="el-icon-user-solid"></span>
              <span>推荐人：</span>
              <a :href="detail.authorUrl">{{detail.authorName}}</a>
            </p>
            <div class="btn-group">
              <div @click="handleNavClick(detail)" target="_blank" class="btn-link btn-group-item">链接直达<i
                class="iconfont icon-Icons_ToolBar_ArrowRight"></i></div>
              <!--              <div class="btn-moblie btn-group-item">手机查看<i class="iconfont icon-QR-code"></i></div>-->
            </div>
          </div>
        </el-col>
        <el-col class="item" :md="8" :xs="24">
          <div class="right">
            <div class="app-card">
              <div class="app-card-header">
                <h3 class="app-card-title">随机网址</h3>
                <div class="app-card-extra"><i class="iconfont icon-shuaxin" @click="getRandomNavList"></i></div>
              </div>
              <div class="app-card-content">
                <el-row :gutter="10">
                  <el-col :span="12" v-for="item in randomNavList" :key="item._id">
                    <nuxt-link class="nav-block" :to="`/nav/${item._id}`">
                      <img :src="item.logo" alt="" class="nav-logo">
                      <h4 class="nav-name">{{ item.name }}</h4>
                    </nuxt-link>
                  </el-col>
                </el-row>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="site-detail">
        <el-col :span="18">
          <div class="detail">{{ detail.detail || detail.desc }}</div>
        </el-col>
        <el-col :span="6">
          <aside></aside>
        </el-col>
      </el-row>
    </div>
</template>

<script>
import axios from "@/plugins/axios";
import {API_NAV, API_NAV_RANDOM} from "../../api";
import navActionMixin from "../../mixins/navActionMixin";

export default {
  name: "NavDetail",
  mixins: [navActionMixin],
  layout:"NavDetail",
  head() {
    const { name, desc } = this.detail
    return {
      title: name + ` - ${desc.slice(0, 15)}`
    }
  },
  data() {
    return {
      loading:false,
      detail: {},
      randomNavList: [],
    }
  },
  methods: {
    async getRandomNavList() {
      this.loading=true;
      const res = await axios.get(API_NAV_RANDOM);
      this.loading=false;
      this.randomNavList = res.data
    },
    handleNavStarFn() {
      this.handleNavStar(this.detail, ()=> {
        this.isStar = true
        this.detail.star += 1
      })
    }
  },
  async asyncData({params}) {
    const [detailRes, randomRes] = await Promise.all([
      axios.get(API_NAV + `?id=${params.id}`),
      axios.get(API_NAV_RANDOM)
    ]);
    return {
      detail: detailRes.data,
      randomNavList: randomRes.data
    }
  },
}
</script>

<style lang="scss" scoped>

.container {
  max-width: 1200px;
  margin: auto;
  padding: 3rem 15px;
}

.placeholder {
  background: #eee;
  min-height: 300px;
}

.site-info {
  font-size: 14px;
  margin-top: 50px;

  .left {
    padding: 30px 20px;
    background: #e6e8ed;
    border-radius: 15px;
    position: relative;
    box-shadow: 0 30px 20px -20px rgba(#000, .15);

    .img-wrap {
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .el-image {
      margin-bottom: 50px;
      width: 100px;
      height: 100px;
      object-fit: cover;

      img {
        width: 100%;
      }
    }

    .tool {
      position: absolute;
      bottom: 20px;
      left: calc(50% - 65px);
      display: flex;

      p {
        margin: 0;
      }

      .iconfont {
        padding-right: 0;
      }

      &-item {
        background: #f0f1f4;
        font-size: 12px;
        cursor: pointer;
        border-radius: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 50px;
        height: 50px;
        box-shadow: 0 0 20px rgba(#000, .12);
        color: #999;
        &.active {
          color: $color-primary;
        }
      }
    }
  }

  .category {
    padding: 2px;
    background: #f1404b;
    color: #fff;
    font-size: 10px;
    border-radius: 2px;

    &-bar {
      color: #f1404b;
    }
  }

  .title {
    margin-top: 20px;
    margin-bottom: 30px;
    font-size: 28px;
    font-weight: bold;
    color: #000;
  }

  .desc {
    font-size: 16px;
    margin-bottom: 20px;
    @include text-overflow(3)
  }

  .btn-group {
    display: flex;

    &-item {
      background: #e9e9e9;
      color: #666;
      padding: 10px 20px;
      margin-right: 15px;
      display: flex;
      align-items: center;
      border-radius: 5px;
      transition: all .3s;
      cursor: pointer;

      &:hover {
        background: #000;

        &,
        .iconfont {
          color: #fff;
        }
      }
    }

    &,
    .iconfont {
      color: #333;
    }

    .iconfont {
      font-size: 12px;
      margin-left: 10px;
    }
  }
}

.site-detail {
  margin-top: 300px;
  font-size: 16px;
}

.app-card {
  border: 2px solid #eee;
  background: #f9f9f9;

  &-header {
    display: flex;
    justify-content: space-between;
    padding: 20px;
  }
  &-title {
    margin: 0;
  }

  &-content {
    display: flex;
    flex-wrap: wrap;
    padding: 20px;
    padding-top: 0;

    .nav-block {
      margin-bottom: 10px;
    }
  }

  .iconfont {
    cursor: pointer;
  }
}

.nav-block {
  display: flex;
  align-items: center;
  padding: 5px;
  background: #f1f3f6;
  border: 1px solid transparent;
  color: #666;

  &:hover {
    opacity: .8;
  }

  img {
    width: 20px;
    height: 20px;
    margin-right: 8px;
  }

  .nav-name {
    margin: 0;
    @include text-overflow(1);
  }
}


@media screen and (max-width: 568px) {
  .site-info {
    margin-top: 0;

    .item {
      margin-bottom: 40px;
    }
  }
}
</style>
