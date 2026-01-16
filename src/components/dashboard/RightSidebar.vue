
<template>
  <div :class="['right-sidebar', { fullscreen: props.fullscreen }]">
    <div class="profile-header" v-if="isDataLoaded && characterInfo">
      <div class="profile-id">
        <span class="profile-name">{{ characterInfo?.名字 || t('无名者') }}</span>
        <span class="profile-realm">{{ formatRealmDisplay(playerStatus?.境界?.名称) }}</span>
      </div>
      <div class="profile-meta">
        <span class="meta-item">{{ t('寿元') }}：{{ currentAge }}</span>
        <span class="meta-item">{{ t('声望') }}：{{ getReputationDisplay() }}</span>
      </div>
    </div>

    <div v-if="isDataLoaded && characterInfo" class="info-grid">
      <div class="info-card">
        <div class="card-title">{{ t('生命体征') }}</div>
        <div class="stat-grid">
          <div class="stat-item">
            <span class="stat-label">{{ t('气血') }}</span>
            <span class="stat-value">{{ playerStatus?.气血?.当前 }} / {{ playerStatus?.气血?.上限 }}</span>
            <div class="stat-bar"><span class="stat-fill health" :style="{ width: getVitalPercent('气血') + '%' }"></span></div>
          </div>
          <div class="stat-item">
            <span class="stat-label">{{ t('灵气') }}</span>
            <span class="stat-value">{{ playerStatus?.灵气?.当前 }} / {{ playerStatus?.灵气?.上限 }}</span>
            <div class="stat-bar"><span class="stat-fill mana" :style="{ width: getVitalPercent('灵气') + '%' }"></span></div>
          </div>
          <div class="stat-item">
            <span class="stat-label">{{ t('神识') }}</span>
            <span class="stat-value">{{ playerStatus?.神识?.当前 }} / {{ playerStatus?.神识?.上限 }}</span>
            <div class="stat-bar"><span class="stat-fill spirit" :style="{ width: getVitalPercent('神识') + '%' }"></span></div>
          </div>
          <div class="stat-item">
            <span class="stat-label">{{ t('寿元') }}</span>
            <span class="stat-value">{{ currentAge }} / {{ playerStatus?.寿命?.上限 }}</span>
            <div class="stat-bar"><span class="stat-fill lifespan" :style="{ width: getLifespanPercent() + '%' }"></span></div>
          </div>
        </div>
      </div>

      <div class="info-card">
        <div class="card-title">{{ t('修为进度') }}</div>
        <div class="realm-block">
          <span class="realm-name">{{ formatRealmDisplay(playerStatus?.境界?.名称) }}</span>
          <span v-if="playerStatus?.境界?.突破描述" class="realm-desc">{{ playerStatus?.境界?.突破描述 }}</span>
          <div v-if="playerStatus?.境界?.名称 === '凡人'" class="realm-hint">{{ t('等待仙缘，引气入体') }}</div>
          <div v-else class="realm-progress">
            <div class="stat-bar"><span class="stat-fill cultivation" :class="getRealmProgressClass()" :style="{ width: realmProgressPercent + '%' }"></span></div>
            <span class="realm-percent" :class="getRealmProgressClass()">{{ realmProgressPercent }}%</span>
          </div>
        </div>
      </div>

      <div class="info-card">
        <div class="card-title">{{ t('天赋神通') }}</div>
        <div class="chip-grid">
          <button
            v-for="talent in characterInfo.天赋"
            :key="typeof talent === 'string' ? talent : talent.name"
            class="chip"
            @click="showTalentDetail(typeof talent === 'string' ? talent : talent.name)"
          >
            {{ typeof talent === 'string' ? talent : talent.name }}
          </button>
          <div v-if="!characterInfo.天赋 || characterInfo.天赋.length === 0" class="empty-text">
            {{ t('暂无天赋神通') }}
          </div>
        </div>
      </div>

      <div class="info-card">
        <div class="card-title">{{ t('状态效果') }}</div>
        <div v-if="statusEffects.length === 0" class="empty-text">{{ t('清净无为') }}</div>
        <div v-else class="status-grid">
          <button
            v-for="(effect, index) in statusEffects"
            :key="effect.状态名称 || `effect-${index}`"
            class="status-card"
            :class="[(String(effect.类型 || '').toLowerCase() === 'buff') ? 'buff' : 'debuff']"
            @click="showStatusDetail(effect)"
          >
            <span class="status-name">{{ effect.状态名称 || '未知状态' }}</span>
            <span class="status-desc" v-if="effect.状态描述">{{ effect.状态描述 }}</span>
            <span class="status-meta" v-if="effect.强度">{{ t('强度') }} {{ effect.强度 }}</span>
            <span class="status-meta" v-if="formatTimeDisplay(effect.时间)">{{ formatTimeDisplay(effect.时间) }}</span>
          </button>
        </div>
      </div>
    </div>

    <div v-else class="no-character">
      <div class="no-char-text">{{ t('请选择角色开启修仙之旅') }}</div>
    </div>

    <DetailModal />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { LOCAL_TALENTS } from '@/data/creationData';
import DetailModal from '@/components/common/DetailModal.vue';
import StatusDetailCard from './components/StatusDetailCard.vue';
import { useGameStateStore } from '@/stores/gameStateStore';
import { useUIStore } from '@/stores/uiStore';
import type { StatusEffect } from '@/types/game.d.ts';
import { formatRealmWithStage } from '@/utils/realmUtils';
import { calculateAgeFromBirthdate } from '@/utils/lifespanCalculator';
import { useI18n } from '@/i18n';

const { t } = useI18n();
const props = defineProps<{ fullscreen?: boolean }>();


const gameStateStore = useGameStateStore();
const uiStore = useUIStore();

// 数据加载状态
const isDataLoaded = computed(() => gameStateStore.isGameLoaded && !!gameStateStore.character);

// 直接使用中文字段访问数据
const characterInfo = computed(() => gameStateStore.character);
const playerStatus = computed(() => gameStateStore.attributes);
const statusEffects = computed(() => {
  const effects = gameStateStore.effects || [];
  // 🔥 过滤掉无效的状态效果（undefined、null或缺少状态名称）
  return effects.filter((effect): effect is StatusEffect =>
    effect != null && typeof effect === 'object' && '状态名称' in effect
  );
});

// 自动计算当前年龄（基于出生日期）
const currentAge = computed(() => {
  const birthdate = characterInfo.value?.出生日期;
  const gameTime = gameStateStore.gameTime;

  if (birthdate && gameTime) {
    return calculateAgeFromBirthdate(birthdate, gameTime);
  }

  // 兜底：返回寿命当前值
  return gameStateStore.attributes?.寿命?.当前 || 0;
});

// 模态框状态（通过 uiStore 管理，不再需要本地状态）

// 时间显示格式化
const formatTimeDisplay = (time: string | undefined): string => {
  if (!time || time === '未指定') return '';
  if (time === '永久') return '永久';

  // 处理数字形式的时间（分钟）
  if (/^\d+$/.test(time)) {
    const minutes = parseInt(time);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}时${mins}分` : `${hours}时`;
    }
    return `${minutes}分钟`;
  }

  return time;
};



// 计算百分比的工具方法
const realmProgressPercent = computed(() => {
  if (!gameStateStore.attributes?.境界) return 0;
  const progress = gameStateStore.attributes.境界.当前进度;
  const maxProgress = gameStateStore.attributes.境界.下一级所需;
  return progress && maxProgress ? Math.round((progress / maxProgress) * 100) : 0;
});

// 根据进度百分比返回CSS类名
const getRealmProgressClass = (): string => {
  const percent = realmProgressPercent.value;
  if (percent >= 100) return 'realm-breakthrough';  // 红色 - 可突破
  if (percent >= 90) return 'realm-sprint';         // 黄色 - 可冲刺
  return '';                                         // 紫色 - 默认
};

// 计算生命体征百分比
const getVitalPercent = (type: '气血' | '灵气' | '神识') => {
  if (!gameStateStore.attributes) return 0;
  const vital = (gameStateStore.attributes as any)[type];
  if (!vital?.当前 || !vital?.上限) return 0;
  return Math.round((vital.当前 / vital.上限) * 100);
};

// 计算寿命百分比（使用计算后的年龄）
const getLifespanPercent = () => {
  const maxLifespan = gameStateStore.attributes?.寿命?.上限;
  if (!maxLifespan) return 0;
  return Math.round((currentAge.value / maxLifespan) * 100);
};

// 获取天赋数据
const getTalentData = (talent: string): any => {
  // 从角色身份信息（V3：gameStateStore.character）的天赋列表中查找
  const baseInfoValue = gameStateStore.character;
  if (baseInfoValue?.天赋 && Array.isArray(baseInfoValue.天赋)) {
    const talentDetail = baseInfoValue.天赋.find((t: any) => t.名称 === talent);
    if (talentDetail) {
      return talentDetail;
    }
  }

  // 向后兼容：从三千大道系统中查找
  const daoDataValue = gameStateStore.thousandDao;
  const daoProgress = daoDataValue?.大道列表?.[talent];
  return daoProgress;
};

// 显示天赋详情
const showTalentDetail = (talent: string) => {
  // 首先尝试从角色的天赋列表中查找(AI生成的自定义天赋)
  const baseInfoValue = characterInfo.value;
  const customTalent = baseInfoValue?.天赋?.find((t: any) => t.name === talent);

  // 然后从LOCAL_TALENTS中查找天赋信息(前端内嵌天赋)
  const localTalent = LOCAL_TALENTS.find(t => t.name === talent);

  // 优先使用自定义天赋数据,其次使用内嵌天赋数据
  const talentInfo = customTalent ? {
    description: customTalent.description || '自定义天赋'
  } : localTalent ? {
    description: localTalent.description || ''
  } : {
    description: `天赋《${talent}》的详细描述暂未开放，请期待后续更新。`
  };

  // 构建详情内容文本（只显示描述）
  const contentText = talentInfo.description;

  uiStore.showDetailModal({
    title: talent,
    content: contentText
  });
};

// 显示状态效果详情
const showStatusDetail = (effect: StatusEffect) => {
  if (!effect || !effect.状态名称) {
    console.warn('[RightSidebar] 状态效果数据异常，无法显示详情', effect);
    return;
  }
  uiStore.showDetailModal({
    title: effect.状态名称,
    component: StatusDetailCard,
    props: { effect }
  });
};

// 显示境界：统一返回"境界+阶段"（初期/中期/后期/圆满），凡人不加阶段
const formatRealmDisplay = (name?: string): string => {
  const progress = playerStatus.value?.境界?.当前进度;
  const maxProgress = playerStatus.value?.境界?.下一级所需;
  const stage = playerStatus.value?.境界?.阶段;
  return formatRealmWithStage({ name, 阶段: stage, progress, maxProgress });
};

// 获取声望显示文本
const getReputationDisplay = (): string => {
  const reputation = playerStatus.value?.声望;
  if (reputation === undefined || reputation === null) {
    return '籍籍无名';
  }

  const repValue = Number(reputation);

  // 负数声望（恶名）
  if (repValue < 0) {
    if (repValue <= -5000) return `恶名昭彰 (${repValue})`;
    if (repValue <= -1000) return `臭名远扬 (${repValue})`;
    if (repValue <= -500) return `声名狼藉 (${repValue})`;
    if (repValue <= -100) return `恶名在外 (${repValue})`;
    return `小有恶名 (${repValue})`;
  }

  // 正数声望
  if (repValue >= 10000) return `传说人物 (${repValue})`;
  if (repValue >= 5000) return `名满天下 (${repValue})`;
  if (repValue >= 3000) return `威震四方 (${repValue})`;
  if (repValue >= 1000) return `名动一方 (${repValue})`;
  if (repValue >= 500) return `声名远播 (${repValue})`;
  if (repValue >= 100) return `小有名气 (${repValue})`;

  return '籍籍无名';
};

// 获取声望CSS类名
const getReputationClass = (): string => {
  const reputation = playerStatus.value?.声望;
  if (reputation === undefined || reputation === null) {
    return 'reputation-neutral';
  }

  const repValue = Number(reputation);

  if (repValue < 0) {
    if (repValue <= -5000) return 'reputation-evil-legendary';
    if (repValue <= -1000) return 'reputation-evil-high';
    if (repValue <= -500) return 'reputation-evil-medium';
    if (repValue <= -100) return 'reputation-evil-low';
    return 'reputation-evil-minor';
  }

  if (repValue >= 10000) return 'reputation-legendary';
  if (repValue >= 5000) return 'reputation-famous';
  if (repValue >= 3000) return 'reputation-renowned';
  if (repValue >= 1000) return 'reputation-notable';
  if (repValue >= 500) return 'reputation-known';
  if (repValue >= 100) return 'reputation-minor';

  return 'reputation-neutral';
};
</script>

<style scoped>
.right-sidebar {
  width: 100%;
  height: 100%;
  padding: 18px;
  box-sizing: border-box;
  font-family: var(--font-family-sans-serif);
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: rgba(6, 10, 20, 0.96);
  color: #e2e8f0;
}

.right-sidebar.fullscreen {
  height: 100%;
  overflow: hidden;
}

.profile-header {
  padding: 12px 14px;
  border: 1px solid rgba(0, 240, 255, 0.25);
  border-radius: 12px;
  background: rgba(0, 240, 255, 0.06);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.profile-id {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.profile-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #00f0ff;
}

.profile-realm {
  font-size: 0.8rem;
  color: rgba(138, 43, 255, 0.9);
}

.profile-meta {
  display: flex;
  gap: 14px;
  font-size: 0.75rem;
  color: rgba(226, 232, 240, 0.7);
}

.info-grid {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.info-card {
  background: rgba(8, 12, 22, 0.9);
  border: 1px solid rgba(0, 240, 255, 0.18);
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-title {
  font-size: 0.8rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(0, 240, 255, 0.8);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  border: 1px solid rgba(0, 240, 255, 0.12);
  border-radius: 10px;
  background: rgba(6, 9, 18, 0.85);
}

.stat-label {
  font-size: 0.7rem;
  color: rgba(226, 232, 240, 0.7);
}

.stat-value {
  font-size: 0.8rem;
  font-weight: 600;
}

.stat-bar {
  height: 6px;
  border-radius: 999px;
  background: rgba(0, 240, 255, 0.1);
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s ease;
}

.stat-fill.health { background: #ff2d6f; }
.stat-fill.mana { background: #00f0ff; }
.stat-fill.spirit { background: #8a2bff; }
.stat-fill.lifespan { background: #f59e0b; }
.stat-fill.cultivation { background: #00ffa7; }
.stat-fill.cultivation.realm-sprint { background: #f59e0b; }
.stat-fill.cultivation.realm-breakthrough { background: #ff2d6f; }

.realm-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.realm-name {
  font-size: 0.95rem;
  color: #00ffa7;
}

.realm-desc {
  font-size: 0.75rem;
  color: rgba(226, 232, 240, 0.6);
}

.realm-hint {
  font-size: 0.75rem;
  color: rgba(226, 232, 240, 0.6);
  padding: 6px 8px;
  border: 1px dashed rgba(0, 240, 255, 0.3);
  border-radius: 8px;
}

.realm-progress {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.realm-percent {
  font-size: 0.7rem;
  color: rgba(226, 232, 240, 0.8);
}

.realm-percent.realm-sprint { color: #f59e0b; }
.realm-percent.realm-breakthrough { color: #ff2d6f; }

.chip-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  background: rgba(0, 240, 255, 0.12);
  border: 1px solid rgba(0, 240, 255, 0.35);
  color: #00f0ff;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.chip:hover {
  background: rgba(0, 240, 255, 0.25);
  box-shadow: 0 0 12px rgba(0, 240, 255, 0.25);
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
}

.status-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(0, 240, 255, 0.2);
  background: rgba(6, 9, 18, 0.85);
  color: rgba(226, 232, 240, 0.9);
  cursor: pointer;
}

.status-card.buff {
  border-color: rgba(0, 255, 167, 0.45);
}

.status-card.debuff {
  border-color: rgba(255, 45, 111, 0.45);
}

.status-name {
  font-size: 0.75rem;
  font-weight: 600;
}

.status-desc {
  font-size: 0.7rem;
  color: rgba(226, 232, 240, 0.6);
}

.status-meta {
  font-size: 0.65rem;
  color: rgba(226, 232, 240, 0.5);
}

.empty-text {
  font-size: 0.75rem;
  color: rgba(226, 232, 240, 0.6);
}

.no-character {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.no-char-text {
  font-size: 0.9rem;
  color: rgba(226, 232, 240, 0.6);
}

@media (max-width: 768px) {
  .stat-grid {
    grid-template-columns: 1fr;
  }
}
</style>



