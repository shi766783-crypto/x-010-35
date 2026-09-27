// localStorage 通用封装：按命名空间隔离，统一异常处理与序列化
const PREFIX = 'family-travel-manager'

// 判断是否为存储空间不足（各浏览器/隐私模式错误名与码不一致）
export function isQuotaError(error) {
  if (!error) return false
  if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') return true
  // 旧版 Firefox 用错误码表示配额超限
  return error.code === 22 || error.code === 1014
}

export function createStorage(namespace) {
  const key = `${PREFIX}:${namespace}`
  return {
    read(fallback = null) {
      try {
        const raw = localStorage.getItem(key)
        return raw == null ? fallback : JSON.parse(raw)
      } catch (error) {
        console.error(`[storage] 读取 ${key} 失败`, error)
        return fallback
      }
    },
    // 返回 { ok, quota }，由调用方决定如何提示；localStorage 写入是原子的，
    // 失败时磁盘上仍保留上一次成功保存的数据，不会写坏
    write(value) {
      try {
        localStorage.setItem(key, JSON.stringify(value))
        return { ok: true, quota: false }
      } catch (error) {
        const quota = isQuotaError(error)
        console.error(`[storage] 写入 ${key} 失败${quotaLabel(quota)}`, error)
        return { ok: false, quota, error }
      }
    },
    remove() {
      try {
        localStorage.removeItem(key)
        return { ok: true }
      } catch (error) {
        console.error(`[storage] 删除 ${key} 失败`, error)
        return { ok: false, error }
      }
    },
  }
}

function quotaLabel(quota) {
  return quota ? '（存储空间不足）' : ''
}

export const planStorage = createStorage('plans')
