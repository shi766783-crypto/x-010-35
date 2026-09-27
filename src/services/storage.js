// localStorage 通用封装：按命名空间隔离，统一异常处理与序列化
const PREFIX = 'family-travel-manager'

// 配额不足 / 拒绝访问等写入错误的判定
export function isQuotaError(error) {
  if (!error) return false
  // 各浏览器配额错误码：Chrome/Edge/Firefox 22，Safari 1014
  return (
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    error.code === 22 ||
    error.code === 1014
  )
}

export function createStorage(namespace) {
  const key = `${PREFIX}:${namespace}`
  return {
    key,
    read(fallback = null) {
      try {
        const raw = localStorage.getItem(key)
        return raw == null ? fallback : JSON.parse(raw)
      } catch (error) {
        console.error(`[storage] 读取 ${key} 失败`, error)
        return fallback
      }
    },
    // 返回 { ok, quotaExceeded, error }，由调用方决定如何提示用户
    write(value) {
      try {
        localStorage.setItem(key, JSON.stringify(value))
        return { ok: true, quotaExceeded: false }
      } catch (error) {
        const quotaExceeded = isQuotaError(error)
        console.error(
          `[storage] 写入 ${key} 失败${quotaExceeded ? '（存储空间不足）' : ''}`,
          error,
        )
        return { ok: false, quotaExceeded, error }
      }
    },
    remove() {
      localStorage.removeItem(key)
    },
  }
}

// 估算本应用在 localStorage 中占用的字节数（含同前缀的所有键）
export function appStorageBytes() {
  let bytes = 0
  for (let i = 0; i < localStorage.length; i += 1) {
    const k = localStorage.key(i)
    if (k && k.startsWith(PREFIX)) {
      bytes += k.length + (localStorage.getItem(k) || '').length
    }
  }
  // localStorage 按 UTF-16 存储，每字符约 2 字节
  return bytes * 2
}

export const planStorage = createStorage('plans')
