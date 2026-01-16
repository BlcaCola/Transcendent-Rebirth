<template>
  <div :class="['left-sidebar', { fullscreen: props.fullscreen }]">
    <div class="menu-top">
      <div class="menu-brand">
        <LayoutGrid :size="20" class="brand-icon" />
        <div class="brand-text">
          <span class="brand-title">{{ t('游戏菜单') }}</span>
          <span class="brand-sub">{{ currentRealTime }}</span>
        </div>
      </div>
      <div class="menu-meta">
        <span class="version-chip">V{{ displayVersion }}</span>
      </div>
    </div>

    <div class="menu-body">
      <div class="menu-section">
        <div class="section-header">{{ t('角色中枢') }}</div>
        <div class="tile-grid">
          <button class="menu-tile" @click="handleCharacterDetails">
            <User :size="18" />
            <span>{{ t('人物属性') }}</span>
          </button>
          <button class="menu-tile" @click="handleInventory">
            <Package :size="18" />
            <span>{{ t('背包物品') }}</span>
          </button>
        </div>
      </div>

      <div class="menu-section">
        <div class="section-header">{{ t('修炼模块') }}</div>
        <div class="tile-grid">
          <button class="menu-tile" @click="handleTechniques">
            <BookOpen :size="18" />
            <span>{{ t('功法技能') }}</span>
          </button>
          <button class="menu-tile" @click="handleThousandDao">
            <Zap :size="18" />
            <span>{{ t('大道感悟') }}</span>
          </button>
        </div>
      </div>

      <div class="menu-section">
        <div class="section-header">{{ t('事件探索') }}</div>
        <div class="tile-grid">
          <button class="menu-tile" @click="handleEvents">
            <Bell :size="18" />
            <span>{{ t('世界事件') }}</span>
          </button>
          <button class="menu-tile" @click="handleWorldMap">
            <Map :size="18" />
            <span>{{ t('世界地图') }}</span>
          </button>
        </div>
      </div>

      <div class="menu-section">
        <div class="section-header">{{ t('社交势力') }}</div>
        <div class="tile-grid">
          <button class="menu-tile" @click="handleRelationships">
            <Users :size="18" />
            <span>{{ t('人物关系') }}</span>
          </button>
          <button class="menu-tile" @click="handleSect">
            <Home :size="18" />
            <span>{{ t('宗门') }}</span>
          </button>
          <button class="menu-tile" @click="handleMemoryCenter">
            <Brain :size="18" />
            <span>{{ t('记忆') }}</span>
          </button>
        </div>
      </div>

      <div class="menu-section">
        <button class="system-toggle" @click="systemExpanded = !systemExpanded">
          <Settings :size="18" />
          <span>{{ t('系统设置') }}</span>
          <ChevronDown :size="14" class="toggle-arrow" :class="{ expanded: systemExpanded }" />
        </button>
        <div v-show="systemExpanded" class="tile-grid system-grid">
          <button class="menu-tile" @click="handleSaveGame" :disabled="!activeCharacter">
            <Save :size="18" />
            <span>{{ t('保存游戏') }}</span>
          </button>
          <button class="menu-tile" v-if="!isOnlineMode" @click="handleGameVariables">
            <Database :size="18" />
            <span>{{ t('游戏变量') }}</span>
          </button>
          <button class="menu-tile" @click="handlePrompts">
            <FileText :size="18" />
            <span>{{ t('提示词管理') }}</span>
          </button>
          <button class="menu-tile" @click="handleAPIManagement">
            <Plug :size="18" />
            <span>{{ t('API管理') }}</span>
          </button>
          <button class="menu-tile" @click="handleSettings">
            <Settings :size="18" />
            <span>{{ t('系统设置') }}</span>
          </button>
          <button v-if="isAdmin" class="menu-tile admin-tile" @click="handleBackendAdmin">
            <Shield :size="18" />
            <span>{{ t('管理员后台') }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="menu-footer">
      <button class="exit-strip" @click="handleBackToMenu">
        <LogOut :size="18" />
        <span>{{ t('退出当前游戏') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { Package, User, Users, BookOpen, Zap, Brain, Map, Save, Settings, LogOut, Home, Bell, Database, Clock, FileText, Plug, LayoutGrid, Shield, ChevronDown } from 'lucide-vue-next';
import { useCharacterStore } from '@/stores/characterStore';
import { toast } from '@/utils/toast';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/i18n';
import { panelBus } from '@/utils/panelBus';
import { isBackendConfigured, fetchBackendVersion } from '@/services/backendConfig';

const props = defineProps<{ fullscreen?: boolean }>();

const router = useRouter();
const characterStore = useCharacterStore();
const uiStore = useUIStore();
const { t } = useI18n();

// 版本号相关
const backendReady = ref(false);
const backendVersion = ref<string | null>(null);

const displayVersion = computed(() => (
  backendReady.value ? (backendVersion.value ?? '同步中') : APP_VERSION
));

// 实时北京时间
const currentRealTime = ref('');
let timeInterval: number | null = null;
const systemExpanded = ref(false);

const updateRealTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  currentRealTime.value = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

onMounted(async () => {
  updateRealTime();
  timeInterval = window.setInterval(updateRealTime, 1000);

  // 获取后端版本
  if (isBackendConfigured()) {
    const version = await fetchBackendVersion();
    if (version) {
      backendReady.value = true;
      backendVersion.value = version;
    }
  }
});

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
});

// 使用 store 的 getters 获取数据
const activeCharacter = computed(() => characterStore.activeCharacterProfile);
const isOnlineMode = computed(() => activeCharacter.value?.模式 === '联机');
const isAdmin = computed(() => localStorage.getItem('is_admin') === 'true');

const closeMenuOverlay = () => {
  if (props.fullscreen) {
    panelBus.emit('close-left-menu');
  }
};

const handleSaveGame = async () => {
  void router.push('/game/save');
  closeMenuOverlay();
};

const handleInventory = () => {
  void router.push('/game/inventory');
  closeMenuOverlay();
};

const handleCharacterDetails = () => {
  void router.push('/game/character-details');
  closeMenuOverlay();
};

const handleEvents = () => {
  void router.push('/game/events');
  closeMenuOverlay();
};

const handleSect = () => {
  void router.push('/game/sect');
  closeMenuOverlay();
};

const handleRelationships = () => {
  void router.push('/game/relationships');
  closeMenuOverlay();
};

const handleTechniques = () => {
  void router.push('/game/techniques');
  closeMenuOverlay();
};

const handleThousandDao = () => {
  void router.push('/game/thousand-dao');
  closeMenuOverlay();
};

const handleMemoryCenter = () => {
  void router.push('/game/memory');
  closeMenuOverlay();
};

const handleWorldMap = () => {
  void router.push('/game/world-map');
  closeMenuOverlay();
};


const handlePrompts = () => {
  void router.push('/game/prompts');
  closeMenuOverlay();
};

const handleSettings = () => {
  void router.push('/game/settings');
  closeMenuOverlay();
};

const handleAPIManagement = () => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    toast.info(t('请先登录'));
    void router.push('/login');
    closeMenuOverlay();
    return;
  }
  void router.push('/game/api-management');
  closeMenuOverlay();
};

const handleGameVariables = () => {
  void router.push('/game/game-variables');
  closeMenuOverlay();
};

const handleBackendAdmin = () => {
  void router.push('/backend-admin');
  closeMenuOverlay();
};

const handleBackToMenu = () => {
  closeMenuOverlay();
  uiStore.showRetryDialog({
    title: t('返回'),
    message: t('您想如何退出当前游戏？'),
    confirmText: t('保存并退出'),
    cancelText: t('取消'),
    neutralText: t('不保存直接退出'),
    onConfirm: async () => {
      console.log('[返回] 用户选择保存并退出...');
      try {
        // 使用 gameStateStore 的 saveBeforeExit 保存
        const { useGameStateStore } = await import('@/stores/gameStateStore');
        const gameStateStore = useGameStateStore();
        await gameStateStore.saveBeforeExit();
        toast.success(t('游戏已保存'));
      } catch (error) {
        console.error('[返回] 保存游戏失败:', error);
        toast.error(t('游戏保存失败，但仍会继续退出。'));
      }
      await exitToMenu();
    },
    onNeutral: async () => {
      console.log('[返回] 用户选择不保存直接退出...');
      toast.info(t('游戏进度未保存'));
      await exitToMenu(); // 传入 false 表示不保存
    },
    onCancel: () => {
      console.log('[返回] 用户取消操作');
    }
  });
};

// 封装一个统一的退出函数，避免代码重复
const exitToMenu = async () => {
  // 🔥 [新架构] 不再需要清理酒馆上下文，数据已在IndexedDB中管理
  console.log('[返回] 准备返回主菜单');

  characterStore.rootState.当前激活存档 = null;
  await characterStore.commitMetadataToStorage();
  console.log('[返回] 已重置激活存档状态');

  uiStore.stopLoading();
  await router.push('/');
  console.log('[返回] 已跳转至主菜单');
};
</script>

<style scoped>
.left-sidebar {
  width: 100%;
  height: 100%;
  padding: 18px;
  box-sizing: border-box;
  font-family: var(--font-family-sans-serif);
  display: flex;
  flex-direction: column;
  background: rgba(6, 10, 20, 0.96);
  color: #e2e8f0;
}
.left-sidebar.fullscreen {
  height: 100%;
  overflow: hidden;
}

.menu-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 240, 255, 0.2);
}

.menu-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-icon {
  color: #00f0ff;
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand-title {
  font-size: 0.9rem;
  letter-spacing: 0.2em;
  color: #00f0ff;
  text-transform: uppercase;
}

.brand-sub {
  font-size: 0.7rem;
  color: rgba(226, 232, 240, 0.7);
  font-family: 'Courier New', monospace;
}

.version-chip {
  font-size: 0.7rem;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(0, 240, 255, 0.15);
  border: 1px solid rgba(0, 240, 255, 0.4);
  color: #00f0ff;
}

.menu-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.menu-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-header {
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(0, 240, 255, 0.75);
}

.tile-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.menu-tile {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(8, 12, 22, 0.8);
  border: 1px solid rgba(0, 240, 255, 0.2);
  border-radius: 10px;
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
}

.menu-tile:hover {
  background: rgba(0, 240, 255, 0.12);
  border-color: rgba(0, 240, 255, 0.55);
  box-shadow: 0 0 16px rgba(0, 240, 255, 0.25);
}

.menu-tile:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.system-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  background: rgba(138, 43, 255, 0.15);
  border: 1px solid rgba(138, 43, 255, 0.4);
  color: #d9c7ff;
  cursor: pointer;
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  justify-content: space-between;
}

.toggle-arrow {
  transition: transform 0.2s ease;
}

.toggle-arrow.expanded {
  transform: rotate(180deg);
}

.system-grid {
  margin-top: 8px;
}

.admin-tile {
  border-color: rgba(255, 193, 7, 0.6);
  color: #ffd166;
}

.menu-footer {
  padding-top: 12px;
  border-top: 1px solid rgba(0, 240, 255, 0.2);
}

.exit-strip {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 45, 111, 0.6);
  background: rgba(255, 45, 111, 0.1);
  color: #ff2d6f;
  cursor: pointer;
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .tile-grid {
    grid-template-columns: 1fr;
  }
}
</style>
