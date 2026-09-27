import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useTravelStore } from './stores/travel'
import { useSaveStore } from './stores/save'
import './styles/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// 初始化：先从 localStorage 恢复数据，再订阅变更自动持久化
const store = useTravelStore(pinia)
const saveStore = useSaveStore(pinia)

store.load()

// 统一的持久化入口：写入失败时更新全局保存状态（不再静默失败）
function persistWithGuard() {
  saveStore.markSaving()
  const result = store.persist()
  if (result.ok) {
    saveStore.markSaved()
  } else {
    saveStore.markFailed(result.quotaExceeded)
  }
  return result
}

store.$subscribe(() => persistWithGuard(), { detached: true })

// 供失败提示弹窗 / 横幅调用的“重试保存”
saveStore.registerRetry(() => {
  return persistWithGuard()
})

// 用户可能切出去清理了浏览器存储，回到页面后自动重试一次
window.addEventListener('focus', () => {
  if (saveStore.saveFailed) persistWithGuard()
})
window.addEventListener('online', () => {
  if (saveStore.saveFailed) persistWithGuard()
})

// 仍有未落盘数据时，阻止关闭 / 刷新，避免操作丢失
window.addEventListener('beforeunload', (event) => {
  if (saveStore.hasUnsavedChanges) {
    event.preventDefault()
    // 旧版浏览器需要 returnValue 才会弹出原生确认
    event.returnValue = ''
  }
})

app.mount('#app')
