<!-- src/views/ModeSelection.vue -->
<template>
  <div class="mode-selection-container">
    <VideoBackground />

    <!-- 左上角：标题 -->
    <div class="top-left-section">
      <h1 class="main-title">超凡新生</h1>
      <p class="sub-title">关于我穿越到异世界开启第二人生的故事</p>
    </div>

    <!-- 左下角：功能按钮、已连接、版本号 -->
    <div class="bottom-left-section">
      <div class="left-bottom-content">
        <div class="info-group">
          <div class="status-indicator" :class="backendReady ? 'online' : 'offline'">
            <span class="status-dot"></span>
            <span>{{ backendReady ? '已连接' : '离线' }}</span>
          </div>
          <div class="version-tag">V{{ displayVersion }}</div>
        </div>
      </div>
    </div>

    <!-- 右下角：模式选择卡片 -->
    <div class="bottom-right-section">
      <div class="gate-container">
        <!-- 单机模式 -->
        <div
          class="gate-card"
          @click="startNewGame"
        >
          <div class="gate-icon">
            <div class="icon-bg"></div>
            <User :size="36" :stroke-width="1.5" />
          </div>
          <div class="gate-info">
            <h2 class="gate-title">{{ $t('开始游戏') }}</h2>
            <div class="gate-tags">
              <span class="tag-local">安全存储</span>
              <span class="tag-offline">隐私保障</span>
            </div>
          </div>
        </div>

        <!-- 联机模式已移除 -->

        <!-- 加载存档 -->
        <div
          class="gate-card load-archive"
          @click="enterCharacterSelection"
        >
          <div class="gate-icon">
            <div class="icon-bg"></div>
            <History :size="36" :stroke-width="1.5" />
          </div>
          <div class="gate-info">
            <h2 class="gate-title">{{ $t('加载存档') }}</h2>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import VideoBackground from '@/components/common/VideoBackground.vue';
import { History, User } from 'lucide-vue-next';
import { useUIStore } from '@/stores/uiStore';
import { isBackendConfigured, fetchBackendVersion } from '@/services/backendConfig';
import { verifyStoredToken } from '@/services/request';

const backendReady = ref(false);
const backendVersion = ref<string | null>(null);

const displayVersion = computed(() => (
  backendReady.value ? (backendVersion.value ?? '同步中') : APP_VERSION
));

onMounted(async () => {
  // 真正检测后端连接状态，而不是只检查配置
  if (isBackendConfigured()) {
    const version = await fetchBackendVersion();
    if (version) {
      backendReady.value = true;
      backendVersion.value = version;
    }
  }
});

const emit = defineEmits<{
  (e: 'start-creation', mode: 'single'): void;
  (e: 'show-character-list'): void;
  (e: 'go-to-login'): void;
}>();

const uiStore = useUIStore();

const startNewGame = async () => {
  // 单机与联机都需要先登录并验证 token 有效性
  const isValid = await verifyStoredToken();
  if (!isValid) {
    uiStore.showRetryDialog({
      title: '请先登录',
      message: '开始游戏需要先登录账号，是否前往登录？',
      confirmText: '前往登录',
      cancelText: '取消',
      onConfirm: () => {
        emit('go-to-login');
      },
      onCancel: () => {}
    });
    return;
  }

  emit('start-creation', 'single');
};

const enterCharacterSelection = async () => {
  emit('show-character-list');
};
</script>

<style scoped>
/* 容器 - 绝对定位布局 */
.mode-selection-container {
  width: 100%;
  height: 100vh;
  height: 100svh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  box-sizing: border-box;
  overflow: hidden;
  position: relative;
}

/* 左上角：标题 */
.top-left-section {
  position: absolute;
  top: 2rem;
  left: 2rem;
  z-index: 10;
}

.main-title {
  font-family: var(--font-family-serif);
  font-size: 7.5rem;
  font-weight: 400;
  letter-spacing: 0.5em;
  color: var(--tech-primary);
  margin: 0 0 0.5rem 0;
  text-shadow: 0 0 30px rgba(0, 217, 255, 0.6), 0 0 60px rgba(0, 217, 255, 0.3);
  animation: neon-glow 3s ease-in-out infinite;
}

.sub-title {
  font-size: 2rem;
  color: rgba(0, 217, 255, 0.8);
  letter-spacing: 0.15em;
  margin: 0;
  text-shadow: 0 0 20px rgba(0, 217, 255, 0.4);
}

/* 左下角：功能按钮、已连接、版本号 */
.bottom-left-section {
  position: absolute;
  bottom: 2rem;
  left: 2rem;
  z-index: 10;
}

.left-bottom-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
}

/* 版本号 - 科技发光风格 */
.version-tag {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--tech-primary);
  padding: 0.25rem 0.6rem;
  background: linear-gradient(135deg, rgba(0, 217, 255, 0.15), rgba(0, 217, 255, 0.08));
  border: 1px solid var(--tech-border);
  border-radius: 6px;
  text-shadow: 0 0 10px rgba(0, 217, 255, 0.6);
  box-shadow: 0 0 15px rgba(0, 217, 255, 0.3), inset 0 0 10px rgba(0, 217, 255, 0.1);
  transition: all 0.3s ease;
  display: inline-block;
  width: fit-content;
}

.version-tag:hover {
  color: #fff;
  border-color: var(--tech-primary);
  box-shadow: 0 0 25px rgba(0, 217, 255, 0.5), inset 0 0 15px rgba(0, 217, 255, 0.2);
  text-shadow: 0 0 15px rgba(0, 217, 255, 0.8);
}

/* 状态指示器 */
.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid;
}

.status-indicator.online {
  background: linear-gradient(135deg, rgba(0, 255, 136, 0.15), rgba(0, 255, 136, 0.08));
  border-color: rgba(0, 255, 136, 0.4);
  color: var(--tech-success);
  box-shadow: 0 0 15px rgba(0, 255, 136, 0.2);
}

.status-indicator.offline {
  background: linear-gradient(135deg, rgba(255, 0, 85, 0.15), rgba(255, 0, 85, 0.08));
  border-color: rgba(255, 0, 85, 0.4);
  color: var(--tech-danger);
  box-shadow: 0 0 15px rgba(255, 0, 85, 0.2);
}

.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 右下角：模式选择和按钮 */
.bottom-right-section {
  position: absolute;
  bottom: 2rem;
  right: 2rem;
  z-index: 10;
}

/* 卡片容器 */
.gate-container {
  padding: 0;
  display: flex;
  flex-direction: row;
  gap: 1rem;
  align-items: center;
}

/* 卡片 */
.gate-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, rgba(0, 217, 255, 0.08), rgba(157, 0, 255, 0.05));
  border: 2px solid var(--tech-border);
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  min-height: 96px;
  box-shadow: 0 0 20px rgba(0, 217, 255, 0.1), inset 0 0 15px rgba(0, 217, 255, 0.05);
}

.gate-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--tech-primary), transparent);
  opacity: 0.5;
}

.gate-card:hover {
  background: linear-gradient(135deg, rgba(0, 217, 255, 0.15), rgba(157, 0, 255, 0.1));
  border-color: var(--tech-primary);
  transform: translateY(-3px);
  box-shadow: 0 0 40px rgba(0, 217, 255, 0.3), inset 0 0 20px rgba(0, 217, 255, 0.1);
}

.gate-card.selected {
  background: linear-gradient(135deg, rgba(0, 217, 255, 0.2), rgba(157, 0, 255, 0.15));
  border-color: var(--tech-primary);
  box-shadow: 0 0 50px rgba(0, 217, 255, 0.4), inset 0 0 25px rgba(0, 217, 255, 0.15);
}

.gate-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.gate-card.disabled:hover {
  transform: none;
  background: linear-gradient(135deg, rgba(0, 217, 255, 0.05), rgba(157, 0, 255, 0.03));
  border-color: var(--tech-border);
  box-shadow: 0 0 15px rgba(0, 217, 255, 0.08);
}

/* 卡片图标 */
.gate-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--tech-primary);
  flex-shrink: 0;
  position: relative;
  width: 48px;
  height: 48px;
}

.icon-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(0, 217, 255, 0.2), rgba(157, 0, 255, 0.1));
  border: 1px solid rgba(0, 217, 255, 0.3);
  border-radius: 4px;
  box-shadow: 0 0 15px rgba(0, 217, 255, 0.2), inset 0 0 10px rgba(0, 217, 255, 0.1);
}

.gate-icon svg {
  position: relative;
  z-index: 1;
}

.gate-card:hover .gate-icon,
.gate-card.selected .gate-icon {
  color: #fff;
  text-shadow: 0 0 10px rgba(0, 217, 255, 0.8);
}

.gate-card:hover .icon-bg,
.gate-card.selected .icon-bg {
  background: linear-gradient(135deg, rgba(0, 217, 255, 0.3), rgba(157, 0, 255, 0.2));
  border-color: rgba(0, 217, 255, 0.5);
  box-shadow: 0 0 25px rgba(0, 217, 255, 0.3), inset 0 0 15px rgba(0, 217, 255, 0.15);
}

/* 卡片信息 */
.gate-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.gate-title {
  font-family: var(--font-family-serif);
  font-size: 1rem;
  font-weight: 400;
  margin: 0;
  color: var(--tech-primary);
  letter-spacing: 0.1em;
  text-shadow: 0 0 8px rgba(0, 217, 255, 0.4);
}

.gate-tags {
  display: flex;
  gap: 0.4rem;
}

.gate-tags span {
  font-size: 0.65rem;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-weight: 500;
  border: 1px solid;
}

/* 本地存储 - 橙色科技 */
.tag-local {
  color: var(--tech-warning);
  background: linear-gradient(135deg, rgba(255, 107, 0, 0.15), rgba(255, 107, 0, 0.08));
  border-color: rgba(255, 107, 0, 0.4);
  box-shadow: 0 0 10px rgba(255, 107, 0, 0.2);
}

/* 隐私保障 - 青色科技 */
.tag-offline {
  color: var(--tech-primary);
  background: linear-gradient(135deg, rgba(0, 217, 255, 0.15), rgba(0, 217, 255, 0.08));
  border-color: rgba(0, 217, 255, 0.4);
  box-shadow: 0 0 10px rgba(0, 217, 255, 0.2);
}

/* 云端同步 - 紫色科技 */
.tag-cloud {
  color: var(--tech-secondary);
  background: linear-gradient(135deg, rgba(157, 0, 255, 0.15), rgba(157, 0, 255, 0.08));
  border-color: rgba(157, 0, 255, 0.4);
  box-shadow: 0 0 10px rgba(157, 0, 255, 0.2);
}

/* 数据安全 - 绿色科技 */
.tag-secure {
  color: var(--tech-success);
  background: linear-gradient(135deg, rgba(0, 255, 136, 0.15), rgba(0, 255, 136, 0.08));
  border-color: rgba(0, 255, 136, 0.4);
  box-shadow: 0 0 10px rgba(0, 255, 136, 0.2);
}

/* 选中标记 */
.check-mark {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 255, 136, 0.1));
  border: 1px solid var(--tech-success);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--tech-success);
  box-shadow: 0 0 15px rgba(0, 255, 136, 0.3);
  animation: pulse 2s ease-in-out infinite;
}

/* 禁用遮罩 */
.disabled-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(10, 14, 39, 0.85), rgba(10, 14, 39, 0.9));
  backdrop-filter: blur(4px);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  color: rgba(0, 217, 255, 0.5);
  font-size: 0.8rem;
}

/* 操作按钮区域 */
.actions-section {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.action-group {
  display: flex;
  gap: 1rem;
}

/* 按钮基础 */
button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  font-family: var(--font-family-serif);
  font-size: 1rem;
  letter-spacing: 0.08em;
  padding: 0.85rem 1.75rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.25s ease;
  border: 2px solid transparent;
}

.btn-primary {
  background: linear-gradient(135deg, rgba(0, 217, 255, 0.2), rgba(157, 0, 255, 0.12));
  color: var(--tech-primary);
  border-color: var(--tech-primary);
  box-shadow: 0 0 20px rgba(0, 217, 255, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, rgba(0, 217, 255, 0.3), rgba(157, 0, 255, 0.2));
  box-shadow: 0 0 30px rgba(0, 217, 255, 0.5);
  transform: translateY(-1px);
}

.btn-secondary {
  background: linear-gradient(135deg, rgba(157, 0, 255, 0.1), rgba(157, 0, 255, 0.05));
  border-color: var(--tech-secondary);
  color: var(--tech-secondary);
}

.btn-secondary:hover {
  background: linear-gradient(135deg, rgba(157, 0, 255, 0.2), rgba(157, 0, 255, 0.1));
  box-shadow: 0 0 25px rgba(157, 0, 255, 0.4);
}

.btn-ghost {
  background: transparent;
  border-color: var(--tech-border);
  color: rgba(0, 217, 255, 0.7);
}

.btn-ghost:hover {
  background: linear-gradient(135deg, rgba(0, 217, 255, 0.08), rgba(157, 0, 255, 0.05));
  border-color: var(--tech-primary);
  color: var(--tech-primary);
  box-shadow: 0 0 20px rgba(0, 217, 255, 0.25);
}

/* 过渡动画 */
.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 0.3s ease;
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* 亮色主题 */
[data-theme="light"] .main-title {
  color: #1e293b;
  text-shadow: none;
}

[data-theme="light"] .sub-title {
  color: #64748b;
}

[data-theme="light"] .gate-card {
  background: rgba(248, 250, 252, 0.8);
  border-color: rgba(0, 0, 0, 0.06);
}

[data-theme="light"] .gate-card:hover,
[data-theme="light"] .gate-card.selected {
  background: rgba(239, 246, 255, 0.9);
}

[data-theme="light"] .gate-title {
  color: #1e293b;
}

[data-theme="light"] .gate-icon {
  color: #3b82f6;
}

[data-theme="light"] .icon-bg {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(37, 99, 235, 0.04) 100%);
  border-color: rgba(59, 130, 246, 0.15);
}

[data-theme="light"] .gate-detail {
  color: #94a3b8;
}

[data-theme="light"] .btn-secondary {
  background: rgba(248, 250, 252, 0.9);
  border-color: rgba(0, 0, 0, 0.08);
  color: #475569;
}

[data-theme="light"] .btn-ghost {
  color: #64748b;
  border-color: rgba(0, 0, 0, 0.08);
}

[data-theme="light"] .version-tag {
  color: #0891b2;
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.15) 0%, rgba(56, 189, 248, 0.1) 100%);
  border-color: rgba(34, 211, 238, 0.35);
  text-shadow: none;
  box-shadow: 0 0 8px rgba(34, 211, 238, 0.1);
}

/* 响应式 */
@media (max-width: 1024px) {
  .mode-selection-container {
    padding: 1.5rem;
  }

  .top-left-section {
    top: 1.5rem;
    left: 1.5rem;
  }

  .bottom-left-section {
    bottom: 1.5rem;
    left: 1.5rem;
  }

  .bottom-right-section {
    bottom: 1.5rem;
    right: 1.5rem;
    max-width: calc(100% - 3rem);
  }

  .main-title {
    font-size: 2.5rem;
    letter-spacing: 0.4em;
  }

  .sub-title {
    font-size: 1rem;
  }

  .gate-container {
    flex-direction: column;
  }

  .gate-card {
    flex: 1;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 1.5rem 1.5rem;
    min-height: auto;
  }

  .gate-icon {
    width: 60px;
    height: 60px;
  }

  .gate-info {
    width: 100%;
  }

  .gate-detail {
    display: none;
  }

  .gate-tags {
    justify-content: center;
    flex-wrap: wrap;
  }

  .actions-section {
    justify-content: center;
    flex-wrap: wrap;
  }

  .action-group {
    flex-direction: column;
    width: 100%;
  }

  button {
    width: 100%;
    min-height: 46px;
  }
}

@media (max-width: 768px) {
  .mode-selection-container {
    padding: 1rem;
  }

  .top-left-section {
    top: 1rem;
    left: 1rem;
  }

  .bottom-left-section {
    bottom: 1rem;
    left: 1rem;
  }

  .bottom-right-section {
    bottom: 1rem;
    right: 1rem;
    max-width: calc(100% - 2rem);
  }

  .main-title {
    font-size: 2rem;
    letter-spacing: 0.35em;
  }

  .sub-title {
    font-size: 0.9rem;
  }

  .gate-title {
    font-size: 1.2rem;
  }

  .gate-desc {
    font-size: 0.85rem;
  }

  .info-group {
    gap: 0.5rem;
  }

  button {
    padding: 0.75rem 1.5rem;
    font-size: 0.95rem;
  }

  .version-tag,
  .status-indicator {
    font-size: 0.7rem;
    padding: 0.2rem 0.5rem;
  }
}

@media (max-width: 480px) {
  .mode-selection-container {
    padding: 0.75rem;
  }

  .top-left-section {
    top: 0.75rem;
    left: 0.75rem;
  }

  .bottom-left-section {
    bottom: 0.75rem;
    left: 0.75rem;
  }

  .bottom-right-section {
    bottom: 0.75rem;
    right: 0.75rem;
    max-width: calc(100% - 1.5rem);
  }

  .main-title {
    font-size: 1.5rem;
    letter-spacing: 0.3em;
  }

  .sub-title {
    font-size: 0.8rem;
  }

  .gate-card {
    padding: 1.25rem 1rem;
  }

  .gate-icon {
    width: 50px;
    height: 50px;
  }

  .gate-title {
    font-size: 1.1rem;
  }

  .actions-section {
    flex-direction: column;
    gap: 0.75rem;
  }

  button {
    padding: 0.65rem 1.25rem;
    font-size: 0.9rem;
  }
}
</style>
