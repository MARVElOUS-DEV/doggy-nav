<template>
  <div class="app-log">
    <el-dialog title="更新日志" :visible="show" @close="$emit('closeLog')">
      <ul v-for="log in logs" :key="log.tome">
        <li>{{log.content}}</li>
      </ul>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'AppLog',
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      logs: [
        {
          time: '2022-04-13',
          content: '【新增】server支持初始化数据库 & 支持 yarn workspace monorepo',
        },
        {
          time: '2022-04-14',
          content: '【新增】现在支持多级菜单，递归实现',
        },
        {
          time: '2022-04-16',
          content: '【新增】server支持导入chrome json格式书签',
        },
        {
          time: '2022-04-19',
          content: '【新增】支持一键docker部署',
        },
        {
          time: '2022-04-22',
          content: '【新增】更换背景，修复主题',
        },
      ]
    }
  }
};
</script>

<style lang="scss" scoped>
.app-log {
  li {
    list-style: disc;
    line-height: 30px;
    font-size: 15px;
  }
}
</style>
