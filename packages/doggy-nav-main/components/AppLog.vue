<template>
  <div class="app-log">
    <el-dialog title="更新日志" :visible="show" @close="$emit('closeLog')">
      <ul>
        <li>feat: monorepo supported</li>
        <li>feat: doggy-nav created</li>
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
          time: '2021-08-13',
          content: '【新增】标签功能',
        },

        {
          time: '2021-08-12',
          content: '【新增】站内搜索，控制分类显示',
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
