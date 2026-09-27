// 数据备份：把当前内存中的最新数据导出为 JSON 文件
// 存储写入失败时也能导出，保证用户当前页面的操作不丢失
const EXPORT_PREFIX = 'family-travel-manager-backup'

function pad(n) {
  return String(n).padStart(2, '0')
}

export function backupFileName(date = new Date()) {
  const stamp =
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  return `${EXPORT_PREFIX}-${stamp}.json`
}

// 触发浏览器下载；返回布尔值表示是否成功
export function exportPlans(plans) {
  try {
    const payload = JSON.stringify(
      {
        app: 'family-travel-manager',
        exportedAt: new Date().toISOString(),
        version: 1,
        plans,
      },
      null,
      2,
    )
    const blob = new Blob([payload], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = backupFileName()
    document.body.appendChild(link)
    link.click()
    link.remove()
    // 稍后释放，确保下载已开始
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    return true
  } catch (error) {
    console.error('[backup] 导出失败', error)
    return false
  }
}

// 校验并解析导入的备份文件内容
export function parseBackup(text) {
  const data = JSON.parse(text)
  if (!data || !Array.isArray(data.plans)) {
    throw new Error('备份文件格式不正确')
  }
  return data.plans
}
