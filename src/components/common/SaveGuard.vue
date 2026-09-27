<script setup>
import { computed, ref } from 'vue'
import Modal from './Modal.vue'
import { useTravelStore } from '../../stores/travel'
import { useSaveStore } from '../../stores/save'
import { exportPlans } from '../../services/backup'
import { appStorageBytes } from '../../services/storage'

const store = useTravelStore()
const saveStore = useSaveStore()

const retrying = ref(false)
const exportTip = ref('')

const storageKB = computed(() => `${(appStorageBytes() / 1024).toFixed(1)} KB`)

const failTitle = computed(() =>
  saveStore.quotaExceeded ? '存储空间不足，数据未保存' : '保存失败，数据未保存',
)

async function retry() {
  retrying.value = true
  exportTip.value = ''
  try {
    const result = await saveStore.retryPersist()
    if (!result.ok) exportTip.value = '仍然无法保存，请先导出备份或清理存储空间'
  } finally {
    retrying.value = false
  }
}

function exportBackup() {
  exportTip.value = exportPlans(store.plans)
    ? '备份文件已开始下载，当前页面的操作已保存到文件中'
    : '导出失败，请尝试复制数据或更换浏览器后再试'
}
</script>

<template>
  <!-- 失败期间持续显示的横幅：点击可重新打开详情弹窗 -->
  <div v-if="saveStore.saveFailed" class="save-banner">
    <span class="save-banner-text">
      ⚠️ 数据未保存成功{{ saveStore.quotaExceeded ? '（存储空间不足）' : ''
      }}，当前操作仍保留在本页面，请勿关闭或刷新
    </span>
    <div class="save-banner-actions">
      <button type="button" class="btn btn-sm btn-ghost" @click="exportBackup">
        导出备份
      </button>
      <button type="button" class="btn btn-sm btn-ghost" @click="retry" :disabled="retrying">
        {{ retrying ? '重试中…' : '重试保存' }}
      </button>
      <button type="button" class="btn btn-sm btn-primary" @click="saveStore.showErrorDialog = true">
        查看详情
      </button>
    </div>
  </div>

  <Modal :show="saveStore.showErrorDialog" :title="failTitle" @close="saveStore.dismissDialog()">
    <div class="fail-body">
      <p>
        刚刚的更改<strong>未能保存到浏览器存储空间</strong>。请放心，数据仍保留在当前页面中，
        但如果现在刷新或关闭页面，这些更改将会丢失。
      </p>
      <p v-if="saveStore.quotaExceeded" class="tip">
        建议先清理存储空间：删除不再需要的出行计划或照片，或在浏览器设置中清理本站点数据后重试。
      </p>
      <p v-else class="tip">
        可能是浏览器处于无痕模式或禁止了本站存储，可尝试更换浏览器后重试。
      </p>
      <ul class="fail-meta">
        <li>当前本应用占用存储：<strong>{{ storageKB }}</strong></li>
        <li>连续失败次数：<strong>{{ saveStore.failCount }}</strong></li>
      </ul>
      <p v-if="exportTip" class="export-tip">{{ exportTip }}</p>
    </div>
    <template #footer>
      <button type="button" class="btn btn-ghost" @click="saveStore.dismissDialog()">
        继续操作
      </button>
      <button type="button" class="btn btn-ghost" @click="exportBackup">
        先导出备份
      </button>
      <button type="button" class="btn btn-primary" @click="retry" :disabled="retrying">
        {{ retrying ? '重试中…' : '重试保存' }}
      </button>
    </template>
  </Modal>
</template>

<style scoped>
.save-banner {
  position: fixed;
  left: 50%;
  bottom: 20px;
  transform: translateX(-50%);
  z-index: 90;
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: calc(100vw - 40px);
  padding: 10px 14px;
  background: #7c3f0b;
  color: #fff;
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  font-size: 13px;
}

.save-banner-text {
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 900px) {
  .save-banner {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .save-banner-text {
    white-space: normal;
  }

  .save-banner-actions {
    justify-content: flex-end;
  }
}

.save-banner-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.save-banner .btn-ghost {
  background: rgba(255, 255, 255, 0.14);
  border-color: transparent;
  color: #fff;
}

.save-banner .btn-ghost:hover {
  background: rgba(255, 255, 255, 0.24);
}

.save-banner .btn-primary {
  background: #fff;
  color: #7c3f0b;
}

.fail-body p + p {
  margin-top: 10px;
}

.tip {
  color: var(--text-secondary);
}

.fail-meta {
  margin: 14px 0 0;
  padding: 10px 14px;
  background: var(--bg);
  border-radius: var(--radius-sm);
  list-style: none;
  font-size: 13px;
  color: var(--text-secondary);
}

.fail-meta li + li {
  margin-top: 4px;
}

.export-tip {
  margin-top: 12px;
  color: var(--success);
  font-size: 13px;
}
</style>
