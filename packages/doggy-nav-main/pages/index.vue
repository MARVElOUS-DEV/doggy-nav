<template>
  <el-container class="user-layout">
    <AppNavMenus
      @handleSubMenuClick="handleSubMenuClick"
      :categorys="category"
      :show-menu-type="showMenuType"
      @showMenus="toggleMenu2"
    />
    <el-container class="body" :style="{ marginLeft: contentMarginLeft }">
      <AppHeader
        @handleShowPopup="showPopup = true"
        @handleShowMenu="toggleMenu"
      />
      <div class="main" v-loading="loading">
        <affiche />
        <nav-ranking-list :data="navRanking" />

        <div class="website-wrapper" v-for="item in data" :key="item.name">
            <p class="website-title" :id="item._id">{{ item.name }}</p>
            <app-nav-list :list="item.list" />
          </div>
      </div>
      
    </el-container>

    <Toolbar @showLog="showLog = true"/>
    <AppLog :show="showLog" @closeLog="showLog = false" />
  </el-container>
</template>

<script>
import api from "~/api";
import layoutMixin from "../mixins/layoutMixin";
import axios from "../plugins/axios";
import {API_NAV_RANKING} from "../api";
export default {
  mixins: [layoutMixin],
  layout: 'index',
  components: () => ({
    Affiche,
    NavRankingList,
    NavRanking,
    AppLog,
    CustomerServiceBtn,
    AppSearch,
    AppNavList,
    Toolbar
  }),
  data() {
    return {
      loading: false,
      active: "私人书签",
      data: [],
      categorys: [],
      navRanking: {
        view: [],
        star: [],
        news: []
      },
      selfIndex: 0,
      isLeftbar: true
    };
  },

  methods: {
    dataScroll() {
      const that = this;
      let scrollTop =
        document.documentElement.scrollTop || document.body.scrollTop;
      let allSite = document.querySelectorAll(".box");
      for (let i = 0; i < allSite.length; i++) {
        if (scrollTop >= allSite[i].offsetTop) {
          that.selfIndex = i;
        }
      }
    },
  },
  mounted() {
    this.$store.commit('saveCategory', this.categorys)
  },
  async asyncData({ store }) {
    const [{ data: categorys }, { data: navRanking }] = await Promise.all([
      api.getCategoryList(),
      axios.get(API_NAV_RANKING)
    ])
    const id = store.state.seletedMenuParentId || (categorys.length && categorys[0]._id) || '';
    const { data } = await api.findNav(id);
    return {
      categorys,
      navRanking,
      data
    };
  },
};
</script>

<style lang="scss">

.el-container {
  flex-direction: column;
}
.user-layout {
  position: relative;
  .footer {
    position: fixed;
    left: 200px;
    right: 0;
    bottom: 0;
    font-size: 14px;
    color: #999;
  }
  /deep/ .el-submenu__title i {
    color: #fff;
  }

  .body {
    margin-left: 0;
  }
}


/deep/ .el-menu--popup-right-start {
  height: 500px !important;
  overflow: auto;
}
body {
  .el-menu--popup-right-start {
    background-color: #fff !important;
    .el-menu-item {
      background-color: #fff !important;
      color: #333 !important;
      &:hover {
        background-color: #ecf5ff !important;
      }
    }
  }
}

.main {
  padding: 20px;
  position: relative;
}


.website-wrapper {
  .website-title {
    font-size: 14px;
    margin: 50px 0 20px;
    background: #fff;
    display: inline-block;
    padding: 5px 10px;
    border-top-right-radius: 15px;
  }
}
</style>
