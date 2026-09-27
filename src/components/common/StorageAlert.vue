<script setup>
import { computed, onBeforeUnmount, watch } from 'vue'
import Modal from './Modal.vue'
import { useTravelStore } from '../../stores/travel'
import { storageStatus, dismissFirstFailure } from '../../services/storageStatus'
import { formatBytes } from '../../services/backup'

const store = useTravelStore()

const failed = computed(() => storageStatus.state === 'failed')
const quota = computed(() => storageStatus.quota)
const showDetail = computed(() => failed.value && storageStatus.firstFailure)

const title = computed(() =>
  quota.value ? '浏览器存储空间不足，数据未能保存' : '自动保存失败，数据暂未写入浏览器',
)

const sizeText = computed(() => formatBytes(store.storageBytes))

function retry() {
  if (store.retryPersist()) {
    dismissFirstFailure()
  }
  // 仍失败时弹窗/提示条继续保留，状态无变化
}

function exportBackup() {
  store.exportBackup()
}

// 用户选择"继续操作"：关闭解释弹窗，但保留顶部常驻提示条
function keepWorking() {
  dismissFirstFailure()
}

// 存储未恢复时拦截关闭/刷新，避免误以为已保存而丢失本次操作
function beforeUnloadHandler(event) {
  if (storageStatus.state === 'failed') {
    event.preventDefault()
    event.returnValue = ''
  }
}

watch(
  failed,
  (isFailed) => {
    if (isFailed) window.addEventListener('beforeunload', beforeUnloadHandler)
    else window.removeEventListener('beforeunload', beforeUnloadHandler)
  },
  { immediate: true },
)

onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnloadHandler))
</script>

<template>
  <!-- 失败期间常驻顶部提示条 -->
  <div v-if="failed" class="storage-banner" role="alert">
    <span class="storage-banner-text">
      <strong>⚠️ 数据未保存成功。</strong>
      当前操作仍保留在本页面中，{{ quota ? '请清理浏览器存储空间后重试，' : '' }}
      或先导出备份；恢复保存前请勿关闭页面。（当前数据约 {{ sizeText }}）
    </span>
    <span class="storage-banner-actions">
      <button type="button" class="btn btn-sm btn-primary" @click="retry">重新保存</button>
      <button type="button" class="btn btn-sm btn-ghost" @click="exportBackup">导出备份</button>
    </span>
  </div>

  <!-- 首次失败的明确解释弹窗 -->
  <Modal :show="showDetail" :title="title" @close="keepWorking">
    <div class="storage-detail">
      <p v-if="quota">
        浏览器为网页分配的本地存储空间已满或已达上限，刚才的修改<strong>没有写入磁盘</strong>，
        刷新或关闭页面后会丢失。
      </p>
      <p v-else>
        浏览器本地存储当前无法写入（可能是隐私模式或存储被禁用），刚才的修改<strong>暂未保存</strong>。
      </p>
      <ul v-if="quota" class="storage-tips">
        <li>清理本网站或其他网站占用的浏览器数据 / 缓存后，点击「重新保存」；</li>
        <li>删除不需要的旧出行计划、行程照片后重试；</li>
        <li>先「导出备份」把当前数据下载为文件，避免丢失。</li>
      </ul>
      <p v-else class="storage-tip-line">
        可先「导出备份」保存当前数据，或退出隐私模式后点击「重新保存」。
      </p>
      <p class="storage-safe">
        本次操作仍完整保留在当前页面内存中，你可以继续编辑；在提示消失前请不要关闭或刷新页面。
      </p>
    </div>
    <template #footer>
      <button type="button" class="btn btn-ghost" @click="keepWorking">继续操作</button>
      <button type="button" class="btn btn-ghost" @click="exportBackup">导出备份</button>
      <button type="button" class="btn btn-primary" @click="retry">清理完，重新保存</button>
    </template>
  </Modal>
</template>

<style scoped>
.storage-banner {
  position: sticky;
  top: 0;
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 20px;
  background: var(--danger);
  color: #fff;
  font-size: 13px;
  box-shadow: var(--shadow);
}

.storage-banner strong {
  margin-right: 4px;
}

.storage-banner-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.storage-banner-actions .btn-ghost {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.4);
}

.storage-banner-actions .btn-ghost:hover {
  background: rgba(255, 255, 255, 0.28);
}

.storage-detail p {
  margin-bottom: 12px;
}

.storage-tips {
  margin: 0 0 12px;
  padding-left: 20px;
  color: var(--text-secondary);
}

.storage-tips li {
  margin-bottom: 6px;
}

.storage-tip-line {
  color: var(--text-secondary);
}

.storage-safe {
  margin-bottom: 0;
  padding: 10px 12px;
  background: var(--warning-light);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: 13px;
}

@media (max-width: 900px) {
  .storage-banner {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
