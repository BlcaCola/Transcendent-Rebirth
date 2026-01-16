<template>
  <div class="creation-container">
    <VideoBackground />
    <div class="creation-shell">
      <aside class="creation-rail">
        <div class="rail-header">
          <div class="rail-title">{{ $t('穿越进度') }}</div>
          <div class="rail-mode">{{ store.isLocalCreation ? $t('单机') : $t('联机') }}</div>
        </div>
        <div class="rail-steps">
          <div
            v-for="step in store.totalSteps"
            :key="step"
            class="rail-step"
            :class="{ active: store.currentStep >= step }"
          >
            <div class="rail-index">{{ step }}</div>
            <div class="rail-label">{{ stepLabels[step - 1] }}</div>
          </div>
        </div>
      </aside>

      <section class="creation-main">
        <div class="header-container">
          <div class="header-top">
            <div class="mode-indicator">
              {{ $t('准备穿越异世界') }}
            </div>
          </div>
        </div>

        <div class="step-content">
          <transition name="fade-step" mode="out-in">
            <div :key="store.currentStep" class="step-wrapper">
              <Step1_WorldSelection
                v-if="store.currentStep === 1"
                ref="step1Ref"
                @ai-generate="handleAIGenerateClick"
              />
              <Step2_TalentTierSelection
                v-else-if="store.currentStep === 2"
                ref="step2Ref"
                @ai-generate="handleAIGenerateClick"
              />
              <Step3_OriginSelection
                v-else-if="store.currentStep === 3"
                ref="step3Ref"
                @ai-generate="handleAIGenerateClick"
              />
              <Step4_SpiritRootSelection
                v-else-if="store.currentStep === 4"
                ref="step4Ref"
                @ai-generate="handleAIGenerateClick"
              />
              <Step5_TalentSelection
                v-else-if="store.currentStep === 5"
                ref="step5Ref"
                @ai-generate="handleAIGenerateClick"
              />
              <Step6_AttributeAllocation v-else-if="store.currentStep === 6" />
              <Step7_Preview
                v-else-if="store.currentStep === 7"
                :is-local-creation="store.isLocalCreation"
              />
            </div>
          </transition>
        </div>

        <div class="navigation-buttons">
          <button @click.prevent="handleBack" type="button" class="btn btn-secondary">
            {{ store.currentStep === 1 ? $t('返回') : $t('上一步') }}
          </button>
          <button
            type="button"
            @click.prevent="(event: Event) => { console.log('[DEBUG] 开启超凡新生按钮被点击!'); handleNext(event); }"
            :disabled="
              isGenerating ||
              isNextDisabled ||
              (store.currentStep === store.totalSteps && store.remainingTalentPoints < 0)
            "
            class="btn"
            :class="{
              'btn-complete': store.currentStep === store.totalSteps,
              'disabled': isGenerating || isNextDisabled || (store.currentStep === store.totalSteps && store.remainingTalentPoints < 0)
            }"
          >
            {{ store.currentStep === store.totalSteps ? $t('开启超凡新生') : $t('下一步') }}
          </button>
        </div>
      </section>

      <aside class="creation-side">
        <div class="side-card">
          <div class="side-title">{{ $t('控制台') }}</div>
          <div v-if="store.isLocalCreation" class="cloud-sync-container">
            <CloudDataSync @sync-completed="onSyncCompleted" variant="compact" size="small" />
            <StorePreSeting
              variant="compact"
              size="small"
              :current-step="store.currentStep"
              :total-steps="store.totalSteps"
              :character-data="characterDataForPreset"
              @store-completed="onStoreCompleted"
            />
            <LoadingPreSeting variant="compact" size="small" @load-completed="onLoadCompleted" />
            <DataClearButtons variant="horizontal" size="small" @data-cleared="onDataCleared" />
          </div>
          <p v-else class="side-muted">{{ $t('联机模式由服务器托管数据') }}</p>
        </div>
        <div class="side-card">
          <div class="side-title">{{ $t('资源状态') }}</div>
          <div class="resource-item">
            <span class="resource-label">{{ $t('当前步骤') }}</span>
            <span class="resource-value">{{ store.currentStep }}/{{ store.totalSteps }}</span>
          </div>
          <div v-if="store.currentStep >= 3" class="resource-item">
            <span class="resource-label">{{ $t('剩余技能点') }}</span>
            <span class="resource-value" :class="{ low: store.remainingTalentPoints < 0 }">
              {{ store.remainingTalentPoints }}
            </span>
          </div>
        </div>
      </aside>
    </div>

    <!-- 穿越点数确认弹窗 -->
    <div v-if="showTravelConfirm" class="travel-confirm-overlay" @click.self="closeTravelConfirm">
      <div class="travel-confirm-card">
        <h3 class="travel-confirm-title">{{ $t('穿越点数确认') }}</h3>
        <p class="travel-confirm-message">{{ $t('创建新的世界会消耗10个穿越点数') }}</p>
        <div class="travel-confirm-points">
          <span class="points-label">{{ $t('当前剩余') }}:</span>
          <span class="points-value">{{ travelPointsDisplay }}</span>
        </div>
        <div class="travel-confirm-actions">
          <button class="btn btn-secondary" type="button" @click="closeTravelConfirm" :disabled="travelConfirmLoading">
            {{ $t('取消') }}
          </button>
          <button class="btn btn-complete" type="button" @click="confirmTravelAndCreate" :disabled="travelConfirmLoading">
            {{ $t('确定') }}
          </button>
        </div>
      </div>
    </div>

    <!-- AI生成等待由全局toast处理 -->
  </div>
</template>

<script setup lang="ts">
import VideoBackground from '@/components/common/VideoBackground.vue';
import CloudDataSync from '@/components/common/CloudDataSync.vue';
import DataClearButtons from '@/components/common/DataClearButtons.vue';
import StorePreSeting from '@/components/common/StorePreSeting.vue';
import LoadingPreSeting from '@/components/common/LoadingPreSeting.vue';
import { useCharacterCreationStore } from '../stores/characterCreationStore';
import Step1_WorldSelection from '../components/character-creation/Step1_WorldSelection.vue'
import Step2_TalentTierSelection from '../components/character-creation/Step2_TalentTierSelection.vue'
import Step3_OriginSelection from '../components/character-creation/Step3_OriginSelection.vue'
import Step4_SpiritRootSelection from '../components/character-creation/Step4_SpiritRootSelection.vue'
import Step5_TalentSelection from '../components/character-creation/Step5_TalentSelection.vue'
import Step6_AttributeAllocation from '../components/character-creation/Step6_AttributeAllocation.vue'
import Step7_Preview from '../components/character-creation/Step7_Preview.vue'
import { toast } from '../utils/toast'
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { getCurrentCharacterName } from '../utils/tavern';
import { useI18n } from '../i18n';
import type { CharacterPreset } from '@/utils/presetManager';
import { request } from '@/services/request';
import { isBackendConfigured } from '@/services/backendConfig';


const props = defineProps<{
  onBack: () => void;
}>();

const emit = defineEmits<{
  (e: 'creation-complete', payload: { error?: unknown; [key: string]: unknown }): void; // 允许传递错误对象
}>()
const store = useCharacterCreationStore();
const { t } = useI18n();
const isGenerating = ref(false) // This now primarily acts as a state guard for buttons
const TRAVEL_POINT_COST = 10;
const showTravelConfirm = ref(false);
const travelPoints = ref<number | null>(null);
const travelConfirmLoading = ref(false);
const pendingTravelAction = ref<null | (() => Promise<void>)>(null);

const travelPointsDisplay = computed(() => travelPoints.value ?? 0);

type PresetGender = NonNullable<CharacterPreset['data']['gender']>;

function normalizeGender(value: unknown): CharacterPreset['data']['gender'] {
  if (value === '男' || value === '女' || value === '其他') return value satisfies PresetGender;
  return undefined;
}

onMounted(async () => {
  // 1. 初始化创世神殿（确保数据已加载）
  // 单机模式也需要获取更新数据作为备选
  console.log('【角色创建】当前模式:', store.isLocalCreation ? '单机' : '联机');

  // 2. 初始化创世神殿，确保本地和云端数据都加载
  await store.initializeStore(store.isLocalCreation ? 'single' : 'cloud');

  // 检查是否需要补充云端数据（检查总数据量而不是source标记）
  const totalWorlds = store.creationData.worlds.length;
  const totalTalents = store.creationData.talents.length;

  console.log('【角色创建】当前数据量:');
  console.log('- 总世界数量:', totalWorlds);
  console.log('- 总天赋数量:', totalTalents);

  // 在联机模式下，如果数据量明显不足（小于等于本地数据量），尝试获取更新数据
  if (!store.isLocalCreation && (totalWorlds <= 3 || totalTalents <= 5)) {
    console.log('【角色创建】联机模式下数据量不足，尝试获取更新数据...');

    await store.fetchAllCloudData();

    console.log('【角色创建】云端数据获取完成，最终数据量:');
    console.log('- 总世界数量:', store.creationData.worlds.length);
    console.log('- 总天赋数量:', store.creationData.talents.length);
  }

  // 2. 获取角色名字 - 自动从酒馆获取，无需用户输入
  try {
    const tavernCharacterName = await getCurrentCharacterName();
    if (tavernCharacterName) {
      console.log('【角色创建】成功获取酒馆角色卡名字:', tavernCharacterName);
      store.characterPayload.character_name = tavernCharacterName;
    } else {
      console.log('【角色创建】无法获取酒馆角色卡名字，使用默认值');
      store.characterPayload.character_name = store.isLocalCreation ? '无名者' : '修士';
    }
  } catch (error) {
    console.error('【角色创建】获取角色名字时出错:', error);
    store.characterPayload.character_name = store.isLocalCreation ? '无名者' : '修士';
  }
});

onUnmounted(() => {
  store.resetOnExit();
});

// 父组件的AI生成处理器（联机模式已移除）
function handleAIGenerateClick() {
  // 本地模式的点击事件由子组件自行处理，此处无需操作
}

// 暴露给步骤组件调用
defineExpose({
  handleAIGenerateClick,
})

const stepLabels = computed(() => [
  t('次元选择'),
  t('初始人设'),
  t('出身设置'),
  t('基础设定'),
  t('天赋选择'),
  t('属性加点'),
  t('最终预览'),
])

const characterDataForPreset = computed(() => ({
  // 基础信息
  character_name: store.characterPayload.character_name,
  gender: store.characterPayload.gender,
  race: store.characterPayload.race,
  current_age: store.characterPayload.current_age,

  // 创角选择（完整对象）
  world: store.selectedWorld,
  talentTier: store.selectedTalentTier,
  origin: store.selectedOrigin,
  spiritRoot: store.selectedSpiritRoot,
  talents: store.selectedTalents,

  // 先天六司
  baseAttributes: {
    root_bone: store.attributes.root_bone,
    spirituality: store.attributes.spirituality,
    comprehension: store.attributes.comprehension,
    fortune: store.attributes.fortune,
    charm: store.attributes.charm,
    temperament: store.attributes.temperament,
  }
}))

const handleBack = () => {
  if (store.currentStep > 1) {
    store.prevStep()
  } else {
    props.onBack();
  }
}

const isNextDisabled = computed(() => {
  const currentStep = store.currentStep;
  const totalSteps = store.totalSteps;
  const selectedWorld = store.selectedWorld;
  const selectedTalentTier = store.selectedTalentTier;
  const remainingPoints = store.remainingTalentPoints;
  const generating = isGenerating.value;

  console.log('[DEBUG] 按钮状态检查 - 当前步骤:', currentStep, '/', totalSteps);
  console.log('[DEBUG] 按钮状态检查 - isGenerating:', generating);
  console.log('[DEBUG] 按钮状态检查 - 选中的世界:', selectedWorld?.name);
  console.log('[DEBUG] 按钮状态检查 - 选中的天资:', selectedTalentTier?.name);
  console.log('[DEBUG] 按钮状态检查 - 剩余天赋点:', remainingPoints);

  // You can add validation logic here for each step
  if (currentStep === 1 && !selectedWorld) {
    console.log('[DEBUG] 按钮被禁用：第1步未选择世界');
    return true;
  }
  if (currentStep === 2 && !selectedTalentTier) {
    console.log('[DEBUG] 按钮被禁用：第2步未选择天资');
    return true;
  }

  console.log('[DEBUG] 按钮状态：启用');
  return false;
})

async function handleNext(event?: Event) {
  console.log('[DEBUG] handleNext 被调用，当前步骤:', store.currentStep, '总步骤:', store.totalSteps);

  if (event) {
    event.preventDefault();
    event.stopPropagation();
    console.log('[DEBUG] 事件已阻止默认行为');
  }

  if (store.currentStep < store.totalSteps) {
    console.log('[DEBUG] 执行下一步');
    store.nextStep()
  } else {
    // Final step: Create Character
    console.log('[DEBUG] 最后一步，准备创建角色');
    await requestTravelConfirm(async () => {
      await createCharacter();
    });
  }
}

const fetchTravelPoints = async (): Promise<number | null> => {
  if (!isBackendConfigured()) {
    toast.error('后端未配置，无法获取穿越点数');
    return null;
  }
  const token = localStorage.getItem('access_token');
  if (!token) {
    toast.error('请先登录后端');
    return null;
  }
  try {
    const profile = await request.get<{ travel_points: number }>('/api/v1/auth/me');
    const points = Number(profile?.travel_points ?? 0);
    travelPoints.value = points;
    return points;
  } catch (error) {
    console.error('获取穿越点数失败:', error);
    toast.error('获取穿越点数失败');
    return null;
  }
};

const requestTravelConfirm = async (action: () => Promise<void>) => {
  const points = await fetchTravelPoints();
  if (points === null) return;
  if (points < TRAVEL_POINT_COST) {
    toast.error(`穿越点数不足，当前剩余 ${points} 点`);
    return;
  }
  pendingTravelAction.value = action;
  showTravelConfirm.value = true;
};

const closeTravelConfirm = () => {
  if (travelConfirmLoading.value) return;
  showTravelConfirm.value = false;
  pendingTravelAction.value = null;
};

const confirmTravelAndCreate = async () => {
  if (travelConfirmLoading.value) return;
  travelConfirmLoading.value = true;
  try {
    const result = await request.post<{ travel_points: number }>(
      '/api/v1/auth/travel-points/consume',
      { amount: TRAVEL_POINT_COST }
    );
    travelPoints.value = Number(result?.travel_points ?? (travelPoints.value ?? 0) - TRAVEL_POINT_COST);
    showTravelConfirm.value = false;
    const action = pendingTravelAction.value;
    pendingTravelAction.value = null;
    if (action) {
      await action();
    }
  } catch (error) {
    console.error('扣减穿越点数失败:', error);
    toast.error('扣减穿越点数失败');
  } finally {
    travelConfirmLoading.value = false;
  }
};

const step1Ref = ref<InstanceType<typeof Step1_WorldSelection> | null>(null)
const step2Ref = ref<InstanceType<typeof Step2_TalentTierSelection> | null>(null)
const step3Ref = ref<InstanceType<typeof Step3_OriginSelection> | null>(null)
const step4Ref = ref<InstanceType<typeof Step4_SpiritRootSelection> | null>(null)
const step5Ref = ref<InstanceType<typeof Step5_TalentSelection> | null>(null)

async function createCharacter() {
  console.log('[DEBUG] createCharacter 开始执行');
  console.log('[DEBUG] isGenerating.value:', isGenerating.value);

  if (isGenerating.value) {
    console.warn('[CharacterCreation.vue] 角色创建已在进行中，忽略重复请求');
    return;
  }
  console.log('[CharacterCreation.vue] createCharacter() called.');

  // 1. 统一数据校验
  console.log('[DEBUG] 开始数据校验');
  console.log('[DEBUG] 角色名:', store.characterPayload.character_name);
  console.log('[DEBUG] 选中的世界:', store.selectedWorld);
  console.log('[DEBUG] 选中的天资:', store.selectedTalentTier);
  console.log('[DEBUG] 选中的出身:', store.selectedOrigin);
  console.log('[DEBUG] 选中的灵根:', store.selectedSpiritRoot);

  // 角色名自动获取，如果为空则使用默认值
  if (!store.characterPayload.character_name) {
    console.log('[DEBUG] 角色名为空，使用默认值');
    store.characterPayload.character_name = '修士';
  }
  if (!store.selectedWorld || !store.selectedTalentTier) {
    console.log('[DEBUG] 验证失败：缺少必需选择项');
    console.log('[DEBUG] selectedWorld:', store.selectedWorld);
    console.log('[DEBUG] selectedTalentTier:', store.selectedTalentTier);
    toast.error('创建数据不完整，请检查世界和天资选择！');
    return;
  }

  // 出身和灵根可以为空（表示随机选择）
  console.log('[DEBUG] selectedOrigin:', store.selectedOrigin, '(可为空，表示随机出生)');
  console.log('[DEBUG] selectedSpiritRoot:', store.selectedSpiritRoot, '(可为空，表示随机灵根)');

  // 进入创建流程后锁定按钮，防止重复点击/重复请求
  isGenerating.value = true;

  console.log('[DEBUG] 数据校验通过，开始创建角色');

  try {
    // 2. 角色名由酒馆助手的角色管理功能编辑，此处不同步

    // 3. 构造 CharacterBaseInfo
    // 3. 构造 CharacterBaseInfo，确保所有选择都使用完整的对象结构
    const _baseInfo = {
      名字: store.characterPayload.character_name,
      性别: store.characterPayload.gender,
      种族: store.characterPayload.race,
      // 🔥 关键修复：确保所有核心选择都传递完整对象，而不仅仅是名称或ID
      // 这解决了下游服务（如AI提示生成）无法获取详细描述的问题
      世界: store.selectedWorld,
      天资: store.selectedTalentTier,
      出生: store.selectedOrigin || '随机出身', // service层会处理字符串
      灵根: store.selectedSpiritRoot || '随机灵根', // service层会处理字符串
      天赋: store.selectedTalents,
      先天六司: {
        根骨: store.attributes.root_bone,
        灵性: store.attributes.spirituality,
        悟性: store.attributes.comprehension,
        气运: store.attributes.fortune,
        魅力: store.attributes.charm,
        心性: store.attributes.temperament,
      },
      后天六司: {
        根骨: 0,
        灵性: 0,
        悟性: 0,
        气运: 0,
        魅力: 0,
        心性: 0,
      },
      // 移除冗余的 "详情" 字段，因为主字段现在就是完整对象
    };

    // 4. 构造完整的创建载荷并发射creation-complete事件
    const creationPayload = {
      charId: `char_${Date.now()}`,
      characterName: store.characterPayload.character_name,
      world: store.selectedWorld,
      talentTier: store.selectedTalentTier,
      origin: store.selectedOrigin,
      spiritRoot: store.selectedSpiritRoot,
      talents: store.selectedTalents,
      baseAttributes: {
        root_bone: store.attributes.root_bone,
        spirituality: store.attributes.spirituality,
        comprehension: store.attributes.comprehension,
        fortune: store.attributes.fortune,
        charm: store.attributes.charm,
        temperament: store.attributes.temperament,
      },
      mode: (store.isLocalCreation ? '单机' : '联机') as '单机' | '联机',
      age: store.characterPayload.current_age,
      gender: store.characterPayload.gender,
      race: store.characterPayload.race, // 🔥 添加种族字段
    };

    console.log('🔥 [角色创建] 当前选择的开局年龄:', store.characterPayload.current_age);
    console.log('🔥 [角色创建] 当前选择的种族:', store.characterPayload.race);
    console.log('发射creation-complete事件，载荷:', creationPayload);

    // 发射事件让App.vue处理创建逻辑
    emit('creation-complete', creationPayload);

  } catch (error: unknown) {
    console.error('创建角色时发生严重错误:', error);
    // 重置状态
    isGenerating.value = false;
    // 错误现在由App.vue统一处理，这里只记录日志并重新抛出，以便App.vue捕获
    emit('creation-complete', { error: error }); // 发射一个带错误的事件
  }
  // 注意：成功情况下不在这里重置isGenerating.value，因为需要等待整个流程完成
}

// 处理云端同步完成事件
function onSyncCompleted(result: { success: boolean; newItemsCount: number; message: string }) {
  console.log('[角色创建] 云端同步完成:', result);
  if (result.success && result.newItemsCount > 0) {
    toast.success(`已更新 ${result.newItemsCount} 项云端数据`);
  }
}

// 处理数据清除完成事件
function onDataCleared(type: string, count: number) {
  console.log('[角色创建] 数据清除完成:', { type, count });
  // 清除数据后可能需要重置当前选择
  if (count > 0) {
    // 如果清除的数据包含当前选中的项目，重置选择
    store.resetCharacter();
  }
}

// 处理存储预设完成事件
async function onStoreCompleted(result: { success: boolean; message: string; presetData?: { name?: unknown; description?: unknown } }) {
  console.log('[角色创建] 存储预设完成:', result);
  if (result.success && result.presetData) {
    try {
      const { savePreset } = await import('@/utils/presetManager');

      const presetName = typeof result.presetData.name === 'string' ? result.presetData.name : '未命名预设';
      const presetDescription = typeof result.presetData.description === 'string' ? result.presetData.description : '';

      // 构造预设数据
      const presetData: Omit<CharacterPreset, 'id' | 'savedAt'> = {
        name: presetName,
        description: presetDescription,
        data: {
          character_name: store.characterPayload.character_name,
          gender: normalizeGender(store.characterPayload.gender),
          race: store.characterPayload.race,
          current_age: store.characterPayload.current_age,
          world: store.selectedWorld ?? null,
          talentTier: store.selectedTalentTier ?? null,
          origin: store.selectedOrigin ?? null,
          spiritRoot: store.selectedSpiritRoot ?? null,
          talents: store.selectedTalents ?? [],
          baseAttributes: {
            root_bone: store.attributes.root_bone,
            spirituality: store.attributes.spirituality,
            comprehension: store.attributes.comprehension,
            fortune: store.attributes.fortune,
            charm: store.attributes.charm,
            temperament: store.attributes.temperament,
          }
        }
      };

      // 保存到 IndexedDB
      const presetId = await savePreset(presetData);
      console.log('[角色创建] 预设已保存到 IndexedDB, ID:', presetId);
      toast.success('预设保存成功！');
    } catch (error) {
      console.error('[角色创建] 保存预设到 IndexedDB 失败:', error);
      toast.error('预设保存失败');
    }
  }
}

// 处理加载预设完成事件
async function onLoadCompleted(result: { success: boolean; message: string; presetData?: CharacterPreset }) {
  console.log('[角色创建] 加载预设完成:', result);

  if (!result.success) {
    toast.error(result.message);
    return;
  }

  if (!result.presetData) {
    console.warn('[角色创建] 预设数据为空');
    toast.error('预设数据无效');
    return;
  }

  console.log('[角色创建] 准备使用预设数据创建角色:', result.presetData);

  // 使用预设数据恢复store状态
  try {
    const presetData = result.presetData.data;

    // 1. 查找对象
    const world = store.creationData.worlds.find(w => w.name === presetData.world?.name);
    const talentTier = store.creationData.talentTiers.find(t => t.name === presetData.talentTier?.name);
    const origin = store.creationData.origins.find(o => o.name === presetData.origin?.name);
    const spiritRoot = store.creationData.spiritRoots.find(s => s.name === presetData.spiritRoot?.name);

    // 2. 显式注解类型来解决 TypeScript 推断问题
    const worldId: number | '' = world ? world.id : '';
    const talentTierId: number | '' = talentTier ? talentTier.id : '';

    const talentIds = (presetData.talents && Array.isArray(presetData.talents))
      ? presetData.talents
          .map((presetTalent: any) => store.creationData.talents.find(t => t.name === presetTalent.name)?.id)
          // 显式为 'id' 参数添加类型注解
          .filter((id: number | undefined): id is number => id !== undefined)
      : [];

    // 3. 构建新的 payload 对象
    const newPayload = {
      ...store.characterPayload,
      character_name: presetData.character_name || '无名者',
      gender: presetData.gender || '男',
      race: presetData.race || '人族',
      current_age: presetData.current_age ?? 16,
      world_id: worldId,
      talent_tier_id: talentTierId,
      origin_id: origin ? origin.id : null,
      spirit_root_id: spiritRoot ? spiritRoot.id : null,
      selected_talent_ids: talentIds,
      root_bone: presetData.baseAttributes?.root_bone ?? 0,
      spirituality: presetData.baseAttributes?.spirituality ?? 0,
      comprehension: presetData.baseAttributes?.comprehension ?? 0,
      fortune: presetData.baseAttributes?.fortune ?? 0,
      charm: presetData.baseAttributes?.charm ?? 0,
      temperament: presetData.baseAttributes?.temperament ?? 0,
    };

    // 4. 一次性更新整个 payload
    store.characterPayload = newPayload;

    console.log('[角色创建] 预设数据已原子性恢复, 新的Payload:', newPayload);

    // 5. 验证恢复后的状态
    await nextTick();

    if (!store.selectedWorld || !store.selectedTalentTier) {
      console.error('[角色创建] 预设恢复后检查失败，核心数据缺失。');
      toast.error('预设数据不完整或已失效，请重新选择。');
      store.currentStep = 1;
      return;
    }

    // 6. 跳转到最后一步并创建角色
    store.currentStep = store.totalSteps;
    await nextTick();

    console.log('[角色创建] 预设数据恢复且校验通过，执行创建...');
    await createCharacter();

  } catch (error) {
    console.error('[角色创建] 使用预设数据失败:', error);
    toast.error('预设数据处理失败');
  }
}
</script>

<style>
/* Step transition animation */
.fade-step-enter-active,
.fade-step-leave-active {
  transition: opacity 0.3s ease;
}

.fade-step-enter-from,
.fade-step-leave-to {
  opacity: 0;
}
</style>

<style scoped>
/* ========== 基础布局 - 赛博朋克三栏结构 ========== */
.step-wrapper {
  height: 100%;
}

.creation-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  background: transparent;
}

.creation-shell {
  width: min(1320px, 96vw);
  height: min(92vh, 920px);
  display: grid;
  grid-template-columns: 210px 1fr 260px;
  gap: 1.25rem;
  position: relative;
  z-index: 1;
}

.creation-rail,
.creation-main,
.creation-side {
  background: rgba(8, 12, 22, 0.9);
  border: 1px solid rgba(0, 240, 255, 0.25);
  border-radius: 12px;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.45);
  position: relative;
}

.creation-rail::before,
.creation-main::before,
.creation-side::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 12px;
  border: 1px solid rgba(138, 43, 255, 0.3);
  pointer-events: none;
}

.creation-rail {
  display: flex;
  flex-direction: column;
  padding: 1.5rem 1rem;
}

.creation-main {
  display: flex;
  flex-direction: column;
  padding: 1.5rem 1.75rem;
  min-height: 0;
}

.creation-side {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem 1rem;
}

.rail-header {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 1.5rem;
}

.rail-title {
  font-size: 0.9rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #00f0ff;
}

.rail-mode {
  font-size: 0.75rem;
  color: rgba(255, 122, 0, 0.8);
}

.rail-steps {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.rail-step {
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 0.6rem;
  align-items: center;
  opacity: 0.45;
  transition: all 0.3s ease;
}

.rail-step.active {
  opacity: 1;
}

.rail-index {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  color: rgba(0, 240, 255, 0.9);
  border: 1px solid rgba(0, 240, 255, 0.35);
  background: rgba(0, 240, 255, 0.08);
}

.rail-step.active .rail-index {
  background: rgba(0, 240, 255, 0.2);
  box-shadow: 0 0 15px rgba(0, 240, 255, 0.4);
}

.rail-label {
  font-size: 0.8rem;
  color: rgba(226, 232, 240, 0.85);
  letter-spacing: 0.08em;
}

/* ========== 头部区域 ========== */
.header-container {
  margin-bottom: 1rem;
  flex-shrink: 0;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

/* ========== 穿越点数确认弹窗 ========== */
.travel-confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.travel-confirm-card {
  width: min(520px, 90vw);
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
  color: #e2e8f0;
}

.travel-confirm-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.travel-confirm-message {
  margin-bottom: 0.75rem;
  color: rgba(226, 232, 240, 0.9);
}

.travel-confirm-points {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  margin-bottom: 1.25rem;
}

.travel-confirm-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.mode-indicator {
  font-size: 0.75rem;
  color: #00f0ff;
  padding: 0.35rem 0.75rem;
  background: rgba(0, 240, 255, 0.08);
  border: 1px solid rgba(0, 240, 255, 0.25);
  border-radius: 6px;
  font-weight: 500;
  letter-spacing: 0.05em;
}

.cloud-sync-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.side-card {
  background: rgba(6, 10, 20, 0.85);
  border: 1px solid rgba(138, 43, 255, 0.35);
  border-radius: 10px;
  padding: 1rem;
  box-shadow: inset 0 0 20px rgba(0, 240, 255, 0.08);
}

.side-title {
  font-size: 0.8rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(0, 240, 255, 0.85);
  margin-bottom: 0.75rem;
}

.side-muted {
  color: rgba(226, 232, 240, 0.7);
  font-size: 0.8rem;
}

.resource-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px dashed rgba(0, 240, 255, 0.15);
}

.resource-item:last-child {
  border-bottom: none;
}

.resource-label {
  color: rgba(226, 232, 240, 0.7);
  font-size: 0.78rem;
}

.resource-value {
  color: #00f0ff;
  font-weight: 600;
  font-size: 0.95rem;
}

.resource-value.low {
  color: #ff2d6f;
}

/* ========== 内容区域 ========== */
.step-content {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1.2rem 0.25rem;
  border-top: 1px solid rgba(0, 240, 255, 0.08);
  border-bottom: 1px solid rgba(0, 240, 255, 0.08);
  scrollbar-width: thin;
  scrollbar-color: rgba(147, 197, 253, 0.3) transparent;
}

.step-content::-webkit-scrollbar {
  width: 6px;
}

.step-content::-webkit-scrollbar-track {
  background: transparent;
}

.step-content::-webkit-scrollbar-thumb {
  background: rgba(147, 197, 253, 0.3);
  border-radius: 3px;
}

.step-content::-webkit-scrollbar-thumb:hover {
  background: rgba(147, 197, 253, 0.5);
}

/* ========== 导航按钮 ========== */
.navigation-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
  padding-top: 1rem;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ========== 亮色主题适配 ========== */
[data-theme="light"] .creation-rail,
[data-theme="light"] .creation-main,
[data-theme="light"] .creation-side {
  background: rgba(248, 250, 252, 0.9);
  border-color: rgba(0, 0, 0, 0.08);
}

/* ========== 平板适配 ========== */
@media (max-width: 768px) {
  .creation-shell {
    grid-template-columns: 1fr;
    height: 96vh;
  }

  .creation-rail {
    flex-direction: row;
    overflow-x: auto;
    padding: 1rem;
  }

  .rail-steps {
    flex-direction: row;
    gap: 0.75rem;
  }

  .creation-side {
    order: 3;
  }

  .navigation-buttons {
    flex-wrap: wrap;
  }
}

/* ========== 手机适配 ========== */
@media (max-width: 480px) {
  .creation-main {
    padding: 1rem;
  }

  .creation-side {
    padding: 1rem;
  }
}

/* ========== 超小屏幕适配 ========== */
@media (max-width: 360px) {
  .rail-label {
    font-size: 0.7rem;
  }
}
</style>
