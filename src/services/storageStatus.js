import { reactive } from 'vue'

// 持久化健康状态（模块级单例，store 上报、组件订阅）
// healthy：上次写入成功；failed：写入失败，内存中的改动尚未落盘
export const storageStatus = reactive({
  state: 'healthy', // 'healthy' | 'failed'
  quota: false, // 失败是否由存储空间不足引起
  firstFailure: true, // 本次运行期间是否还没向用户解释过（控制弹窗只弹一次）
  lastErrorAt: null,
})

// 上报一次写入结果。返回是否写入成功。
export function reportWriteResult(result) {
  if (result?.ok) {
    storageStatus.state = 'healthy'
    storageStatus.quota = false
    storageStatus.lastErrorAt = null
    return true
  }
  storageStatus.state = 'failed'
  storageStatus.quota = !!result?.quota
  storageStatus.lastErrorAt = Date.now()
  // firstFailure 保持为 true，直到用户在弹窗中选择处理方式
  return false
}

// 用户已阅读弹窗；常驻提示条仍保留，直到下次写入真正成功
export function dismissFirstFailure() {
  storageStatus.firstFailure = false
}
