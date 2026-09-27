// 数据备份：导出为 JSON 文件让用户下载保存。
// 走 Blob + a[download]，不依赖 localStorage，因此存储写满时仍可导出。

function timestamp() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`
}

export function exportPlansBackup(plans) {
  const payload = {
    app: 'family-travel-manager',
    exportedAt: new Date().toISOString(),
    version: 1,
    plans,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `出行管家备份-${timestamp()}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  // 释放对象 URL，释放内存
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

// 当前数据占用的估算大小（字节，UTF-16 长度近似，localStorage 按 UTF-16 计量）
export function estimatePlansSize(plans) {
  return JSON.stringify(plans).length * 2
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
