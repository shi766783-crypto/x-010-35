import { defineStore } from 'pinia'

// 全局保存状态：捕获持久化失败，提示用户并允许重试 / 导出备份
// status: 'saved' 已落盘 | 'saving' 写入中 | 'error' 最近一次写入失败
export const useSaveStore = defineStore('save', {
  state: () => ({
    status: 'saved',
    // 内存数据是否比 localStorage 更新（失败期间用户继续操作会保持 dirty）
    dirty: false,
    // 是否为存储空间不足（区别于隐私模式等其他写入错误）
    quotaExceeded: false,
    // 失败后自动弹出一次提示弹窗，用户关闭后靠横幅提醒
    showErrorDialog: false,
    failCount: 0,
    lastErrorAt: null,
    // 由 main.js 注入的重试函数（避免 store 间循环依赖）
    _retryHandler: null,
  }),

  getters: {
    saveFailed: (state) => state.status === 'error',
    hasUnsavedChanges: (state) => state.dirty,
  },

  actions: {
    markSaving() {
      this.status = 'saving'
    },
    markSaved() {
      this.status = 'saved'
      this.dirty = false
      this.quotaExceeded = false
      this.showErrorDialog = false
      this.failCount = 0
      this.lastErrorAt = null
    },
    markFailed(quotaExceeded = false) {
      this.status = 'error'
      this.dirty = true
      this.quotaExceeded = quotaExceeded
      this.failCount += 1
      this.lastErrorAt = Date.now()
      // 同一轮失败只自动弹一次；后续失败靠横幅上的按钮查看
      this.showErrorDialog = this.failCount === 1
    },
    dismissDialog() {
      this.showErrorDialog = false
    },
    registerRetry(handler) {
      this._retryHandler = handler
    },
    // 清理空间后手动 / 自动重试写入
    async retryPersist() {
      if (typeof this._retryHandler === 'function') {
        return this._retryHandler()
      }
      return { ok: false }
    },
  },
})
