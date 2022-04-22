<template>
    <div>
    <template v-for="(item) in menuList">
      <el-submenu
        v-if="item.children && item.children.length"
        :key="item._id"
        :index="item._id"
        style="text-align: left"
      >
        <template slot="title">
          <i
            :class="item.icon ? item.icon : `el-icon-eleme icon-title`"
          ></i>
          <span slot="title">{{ item.name }}</span>
        </template>
        <menu-stack :menuList="item.children" v-bind="$attrs" v-on="$listeners"/>
      </el-submenu>
      <el-menu-item
        :key="item._id"
        :index="item._id"
        v-else
        @click="handleMenuItemClick(item.categoryId,item._id)"
        >
          <a slot="title">
            <i :class="item.icon"></i>
            <span slot="title" >{{ item.name }}</span>
          </a>
        </el-menu-item>
      </template>
    </div>
</template>

<script>
export default {
  name: "MenuStack",
  props: {
    menuList: {
      type: Array,
      default: () => []
    },
  },
  data() {
    return {
      selectedCategoryId: ""
    }
  },
  methods:{
    handleMenuItemClick(parentId, id) {
      this.$store.commit('saveSeletedId', {
        parentId,
        id,
      })

      if (this.$route.path.includes('/nav')) {
        this.$router.push('/')
        return
      }
       if (this.selectedCategoryId === parentId) {
        document.getElementById(id).scrollIntoView();
        return;
      }
      this.selectedCategoryId = parentId;
      this.$emit("handleSubMenuItemClick", parentId, id);
    }
  }
}
</script>

<style lang="scss" scoped>
.el-menu--collapse>div>.el-menu-item span, .el-menu--collapse>div>.el-submenu>.el-submenu__title span {
  height: 0;
  width: 0;
  overflow: hidden;
  visibility: hidden;
  display: inline-block;
 
}
.el-submenu__title {
  background-color: var(--color-primary);
  i {
    color: #fff;
  }
}
.el-menu--popup {
    .el-menu-item {
      padding-left: 3rem !important;
    }

    .el-submenu__title {
      span {
        color:#303133;
    }
    i {
      color: #303133;
    }
  }
  }

.el-submenu__title,
.el-menu-item {
  text-align: left;
}
</style>