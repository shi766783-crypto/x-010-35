<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTravelStore } from '../stores/travel'
import { formatMoney, formatDate } from '../utils/format'
import { planTotalSpend, planPackingRate } from '../services/selectors'
import { exportPlans, parseBackup } from '../services/backup'
import { appStorageBytes } from '../services/storage'
import StarRating from '../components/common/StarRating.vue'

const store = useTravelStore()
const router = useRouter()

const stats = computed(() => store.dashboardStats)
const unlocked = computed(() => store.achievements.filter((a) => a.unlocked))
const summarized = computed(() => store.plans.filter((p) => p.summary))
const storageKB = computed(() => `${(appStorageBytes() / 1024).toFixed(1)} KB`)
const fileInput = ref(null)
const backupTip = ref('')

function handleExport() {
  backupTip.value = exportPlans(store.plans)
    ? '备份文件已开始下载'
    : '导出失败，请稍后重试'
}

function triggerImport() {
  fileInput.value?.click()
}

async function handleImportFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  try {
    const plans = parseBackup(await file.text())
    if (window.confirm(`将导入 ${plans.length} 个出行计划，并覆盖当前全部数据，确定继续吗？`)) {
      store.replaceAll(plans)
      // 持久化结果由 main.js 的订阅统一处理；失败时会自动弹出提示
      backupTip.value = '导入成功'
    }
  } catch (error) {
    backupTip.value = error.message || '导入失败：无法解析备份文件'
  } finally {
    event.target.value = ''
  }
}
</script>

<template>
  <div>
    <!-- 概览 -->
    <div class="grid-3">
      <div class="card stat">
        <span class="stat-label">累计出行次数</span>
        <strong>{{ stats.totalTrips }}</strong>
      </div>
      <div class="card stat">
        <span class="stat-label">总花费</span>
        <strong>{{ formatMoney(stats.totalSpend) }}</strong>
      </div>
      <div class="card stat">
        <span class="stat-label">已解锁徽章</span>
        <strong>{{ unlocked.length }} / {{ store.totalAchievements }}</strong>
      </div>
    </div>

    <!-- 我的出行计划 -->
    <div class="card mt-16">
      <h3 class="card-title">我的出行计划</h3>
      <table v-if="store.plans.length" class="table">
        <thead>
          <tr><th>名称</th><th>目的地</th><th>日期</th><th>花费</th><th>打包</th></tr>
        </thead>
        <tbody>
          <tr v-for="p in store.plans" :key="p.id" class="link-row" @click="router.push(`/plans/${p.id}`)">
            <td>{{ p.name }}</td>
            <td>{{ p.destination }}</td>
            <td>{{ formatDate(p.startDate) }} - {{ formatDate(p.endDate) }}</td>
            <td>{{ formatMoney(planTotalSpend(p)) }}</td>
            <td>{{ planPackingRate(p) }}%</td>
          </tr>
        </tbody>
      </table>
      <p v-else class="empty">暂无出行计划</p>
    </div>

    <!-- 出行总结 -->
    <div class="card mt-16">
      <h3 class="card-title">出行总结</h3>
      <div v-if="summarized.length" class="summary-list">
        <div v-for="p in summarized" :key="p.id" class="summary-item">
          <div>
            <strong>{{ p.name }}</strong>
            <span class="text-muted">{{ p.destination }}</span>
          </div>
          <StarRating :model-value="p.summary.rating" readonly size="16px" />
        </div>
      </div>
      <p v-else class="empty">还没有出行总结，去出行结束后撰写吧</p>
    </div>

    <!-- 成就徽章 -->
    <div class="card mt-16">
      <h3 class="card-title">我的成就徽章</h3>
      <div v-if="unlocked.length" class="badge-list">
        <div v-for="a in unlocked" :key="a.id" class="badge">
          <div class="badge-icon" :style="{ background: a.color }">{{ a.glyph }}</div>
          <div class="badge-name">{{ a.name }}</div>
        </div>
      </div>
      <p v-else class="empty">还没有解锁徽章</p>
    </div>

    <!-- 数据备份 -->
    <div class="card mt-16">
      <h3 class="card-title">数据备份</h3>
      <p class="text-secondary">
        数据保存在本机浏览器中（当前占用约 {{ storageKB }}）。清理浏览器数据或存储空间不足时可能丢失，
        建议定期导出备份。
      </p>
      <div class="flex gap-8 mt-16">
        <button type="button" class="btn btn-primary" @click="handleExport">导出备份文件</button>
        <button type="button" class="btn btn-ghost" @click="triggerImport">从备份恢复</button>
        <input
          ref="fileInput"
          type="file"
          accept="application/json,.json"
          hidden
          @change="handleImportFile"
        />
      </div>
      <p v-if="backupTip" class="backup-tip">{{ backupTip }}</p>
    </div>
  </div>
</template>

<style scoped>
.stat {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.stat strong {
  font-size: 26px;
  margin-top: 6px;
}

.link-row {
  cursor: pointer;
}

.summary-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.summary-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--bg);
  border-radius: var(--radius-sm);
}

.summary-item div {
  display: flex;
  flex-direction: column;
}

.summary-item .text-muted {
  font-size: 13px;
}

.backup-tip {
  margin-top: 12px;
  font-size: 13px;
  color: var(--success);
}
</style>
