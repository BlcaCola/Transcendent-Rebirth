/**
 * @fileoverview 训练速度计算模块
 *
 * 【职责】
 * - 计算训练速度的各项因子
 * - 综合计算最终训练速度
 * - 预估升级时间
 *
 * 【核心公式】
 * 最终速度 = 基础速度 × 信号系数 × 六维系数 × 状态系数 × (1 + 模块加成 + 环境加成)
 * 六维系数 = 初始六维系数 × 0.7 + 成长六维系数 × 0.3
 */

import type {
  CultivationSpeedFactors,
  CultivationSpeedResult,
} from '@/types/game';

// ============================================================================
// 常量定义
// ============================================================================

/** 六维属性权重配置 */
const SIX_SI_WEIGHTS = {
  体质: 0.25,  // 25% - 影响耐受与生命值上限
  能源: 0.25,  // 25% - 影响电量与能量运转
  算法: 0.20,  // 20% - 影响模块理解与升级效率
  心智: 0.15,  // 15% - 影响训练稳定性
  资源感知: 0.10,  // 10% - 影响机会与升级成功率
  魅力: 0.05,  // 5%  - 影响社交和资源获取
} as const;

/** 初始六维系数范围 */
const INNATE_SIX_SI_RANGE = {
  minValue: 0,
  maxValue: 10,
  minFactor: 0.5,
  maxFactor: 2.0,
} as const;

/** 成长六维系数范围 */
const ACQUIRED_SIX_SI_RANGE = {
  minValue: 0,
  maxValue: 20,
  minFactor: 0.0,
  maxFactor: 0.6,
} as const;

/** 信号强度系数映射表 */
const SPIRIT_DENSITY_RANGES = [
  { min: 1, max: 20, minFactor: 0.1, maxFactor: 0.4, desc: '信号稀薄' },
  { min: 21, max: 40, minFactor: 0.4, maxFactor: 0.7, desc: '信号普通' },
  { min: 41, max: 60, minFactor: 0.7, maxFactor: 1.0, desc: '信号充沛' },
  { min: 61, max: 80, minFactor: 1.0, maxFactor: 1.5, desc: '信号浓郁' },
  { min: 81, max: 100, minFactor: 1.5, maxFactor: 2.0, desc: '信号极盛' },
] as const;

/** 等级升级时间标准（游戏时间，单位：月） - 内部使用 */
interface InternalBreakthroughTime {
  阶位名称: string;
  阶段: string;
  最短月数: number;
  标准月数: number;
  最长月数: number;
}

/** 等级升级时间标准（游戏时间，单位：月） */
export const REALM_BREAKTHROUGH_STANDARDS: InternalBreakthroughTime[] = [
  // 街头人
  { 阶位名称: '街头人', 阶段: '初期', 最短月数: 3, 标准月数: 12, 最长月数: 36 },
  { 阶位名称: '街头人', 阶段: '中期', 最短月数: 6, 标准月数: 24, 最长月数: 60 },
  { 阶位名称: '街头人', 阶段: '后期', 最短月数: 12, 标准月数: 36, 最长月数: 120 },
  { 阶位名称: '街头人', 阶段: '圆满', 最短月数: 24, 标准月数: 60, 最长月数: 240 },
  // 跑者
  { 阶位名称: '跑者', 阶段: '初期', 最短月数: 12, 标准月数: 60, 最长月数: 180 },
  { 阶位名称: '跑者', 阶段: '中期', 最短月数: 24, 标准月数: 96, 最长月数: 300 },
  { 阶位名称: '跑者', 阶段: '后期', 最短月数: 36, 标准月数: 144, 最长月数: 480 },
  { 阶位名称: '跑者', 阶段: '圆满', 最短月数: 60, 标准月数: 240, 最长月数: 720 },
  // 潜影者
  { 阶位名称: '潜影者', 阶段: '初期', 最短月数: 60, 标准月数: 240, 最长月数: 600 },
  { 阶位名称: '潜影者', 阶段: '中期', 最短月数: 120, 标准月数: 360, 最长月数: 960 },
  { 阶位名称: '潜影者', 阶段: '后期', 最短月数: 180, 标准月数: 480, 最长月数: 1200 },
  { 阶位名称: '潜影者', 阶段: '圆满', 最短月数: 240, 标准月数: 720, 最长月数: 1800 },
  // 雇佣猎手
  { 阶位名称: '雇佣猎手', 阶段: '初期', 最短月数: 240, 标准月数: 720, 最长月数: 1800 },
  { 阶位名称: '雇佣猎手', 阶段: '中期', 最短月数: 360, 标准月数: 1080, 最长月数: 2400 },
  { 阶位名称: '雇佣猎手', 阶段: '后期', 最短月数: 480, 标准月数: 1440, 最长月数: 3600 },
  { 阶位名称: '雇佣猎手', 阶段: '圆满', 最短月数: 720, 标准月数: 2160, 最长月数: 6000 },
  // 战术大师
  { 阶位名称: '战术大师', 阶段: '初期', 最短月数: 600, 标准月数: 1800, 最长月数: 6000 },
  { 阶位名称: '战术大师', 阶段: '中期', 最短月数: 960, 标准月数: 2880, 最长月数: 9600 },
  { 阶位名称: '战术大师', 阶段: '后期', 最短月数: 1440, 标准月数: 4320, 最长月数: 14400 },
  { 阶位名称: '战术大师', 阶段: '圆满', 最短月数: 2400, 标准月数: 7200, 最长月数: 24000 },
];

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 线性插值计算
 */
function lerp(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  const t = Math.max(0, Math.min(1, (value - inMin) / (inMax - inMin)));
  return outMin + t * (outMax - outMin);
}

/**
 * 限制数值在指定范围内
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ============================================================================
// 六维系数计算
// ============================================================================

/** 六维数据类型 */
export interface SixSiData {
  体质: number;
  能源: number;
  算法: number;
  资源感知: number;
  魅力: number;
  心智: number;
}

/**
 * 计算六维加权总分
 */
function calculateWeightedSixSi(sixSi: SixSiData): number {
  return (
    sixSi.体质 * SIX_SI_WEIGHTS.体质 +
    sixSi.能源 * SIX_SI_WEIGHTS.能源 +
    sixSi.算法 * SIX_SI_WEIGHTS.算法 +
    sixSi.心智 * SIX_SI_WEIGHTS.心智 +
    sixSi.资源感知 * SIX_SI_WEIGHTS.资源感知 +
    sixSi.魅力 * SIX_SI_WEIGHTS.魅力
  );
}

/**
 * 计算初始六维系数
 * @param sixSi 初始六维数据（每项0-10）
 * @returns 系数范围 0.5 - 2.0
 */
export function calculateInnateSixSiFactor(sixSi: SixSiData): number {
  const weightedScore = calculateWeightedSixSi(sixSi);
  const { minValue, maxValue, minFactor, maxFactor } = INNATE_SIX_SI_RANGE;
  return lerp(weightedScore, minValue, maxValue, minFactor, maxFactor);
}

/**
 * 计算成长六维系数
 * @param sixSi 成长六维数据（每项0-20）
 * @returns 系数范围 0.0 - 0.6（作为额外加成）
 */
export function calculateAcquiredSixSiFactor(sixSi: SixSiData): number {
  const weightedScore = calculateWeightedSixSi(sixSi);
  const { minValue, maxValue, minFactor, maxFactor } = ACQUIRED_SIX_SI_RANGE;
  return lerp(weightedScore, minValue, maxValue, minFactor, maxFactor);
}

/**
 * 计算综合六维系数
 * 公式：初始系数 × 0.7 + 成长系数 × 0.3
 */
export function calculateCombinedSixSiFactor(
  innateSixSi: SixSiData,
  acquiredSixSi: SixSiData
): { innate: number; acquired: number; combined: number } {
  const innate = calculateInnateSixSiFactor(innateSixSi);
  const acquired = calculateAcquiredSixSiFactor(acquiredSixSi);
  // 初始占70%权重，成长作为额外加成（30%权重）
  const combined = innate * 0.7 + (1 + acquired) * 0.3;
  return { innate, acquired, combined };
}

// ============================================================================
// 信号强度系数计算
// ============================================================================

/**
 * 计算信号强度系数
 * @param density 信号强度（1-100）
 * @returns 系数范围 0.1 - 2.0
 */
export function calculateSpiritDensityFactor(density: number): number {
  const clampedDensity = clamp(density, 1, 100);

  for (const range of SPIRIT_DENSITY_RANGES) {
    if (clampedDensity >= range.min && clampedDensity <= range.max) {
      return lerp(clampedDensity, range.min, range.max, range.minFactor, range.maxFactor);
    }
  }

  // 默认返回最低系数
  return 0.1;
}

/**
 * 获取信号强度描述
 */
export function getSpiritDensityDescription(density: number): string {
  const clampedDensity = clamp(density, 1, 100);

  for (const range of SPIRIT_DENSITY_RANGES) {
    if (clampedDensity >= range.min && clampedDensity <= range.max) {
      return range.desc;
    }
  }

  return '信号稀薄';
}

// ============================================================================
// 状态效果系数计算
// ============================================================================

/** 状态效果类型 */
export interface StatusEffect {
  状态名称: string;
  类型: 'buff' | 'debuff';
  强度?: number;  // 0-100，默认50
  状态描述?: string;
}

/**
 * 计算状态效果系数
 * @param effects 当前状态效果列表
 * @returns 系数范围 0.5 - 2.0
 */
export function calculateStatusEffectFactor(effects: StatusEffect[]): number {
  if (!effects || effects.length === 0) {
    return 1.0;
  }

  let totalModifier = 0;

  for (const effect of effects) {
    const intensity = effect.强度 ?? 50;
    const modifier = (intensity / 100) * 0.5; // 最大±0.5

    if (effect.类型 === 'buff') {
      totalModifier += modifier;
    } else {
      totalModifier -= modifier;
    }
  }

  // 限制在0.5-2.0范围内
  return clamp(1.0 + totalModifier, 0.5, 2.0);
}

// ============================================================================
// 模块加成系数计算
// ============================================================================

/** 模块品质到加成的映射 */
const MODULE_QUALITY_BONUS: Record<string, number> = {
  '凡': 0.0,
  '黄': 0.1,
  '玄': 0.25,
  '地': 0.45,
  '天': 0.7,
  '仙': 0.9,
  '神': 1.0,
};

/**
 * 计算模块加成系数
 * @param quality 模块品质
 * @param proficiency 训练进度（0-100）
 * @returns 系数范围 0.0 - 1.0
 */
export function calculateModuleBonus(quality: string, proficiency: number): number {
  const baseBonus = MODULE_QUALITY_BONUS[quality] ?? 0;
  const proficiencyMultiplier = proficiency / 100;
  return baseBonus * proficiencyMultiplier;
}

// ============================================================================
// 综合训练速度计算
// ============================================================================

/** 训练速度计算输入参数 */
export interface CultivationSpeedInput {
  // 位置信息
  信号强度: number;  // 1-100

  // 六维信息
  初始六维: SixSiData;
  成长六维: SixSiData;

  // 状态效果
  当前效果?: StatusEffect[];

  // 模块信息
  模块品质?: string;
  训练进度?: number;

  // 阶位信息
  当前阶位: string;
  当前阶段: string;
  当前进度: number;
  下一级所需: number;

  // 环境加成（可选）
  环境加成?: number;  // 0.0 - 0.5
}

/** 基础训练速度（每回合进度增加） */
const BASE_TRAINING_SPEED = 1;

/**
 * 计算综合训练速度
 */
export function calculateCultivationSpeed(input: CultivationSpeedInput): CultivationSpeedResult {
  // 1. 计算信号强度系数
  const spiritDensityFactor = calculateSpiritDensityFactor(input.信号强度);

  // 2. 计算六维系数
  const sixSiResult = calculateCombinedSixSiFactor(input.初始六维, input.成长六维);

  // 3. 计算状态效果系数
  const statusFactor = calculateStatusEffectFactor(input.当前效果 ?? []);

  // 4. 计算模块加成
  const techniqueBonus = input.模块品质
    ? calculateModuleBonus(input.模块品质, input.训练进度 ?? 0)
    : 0;

  // 5. 环境加成
  const environmentBonus = clamp(input.环境加成 ?? 0, 0, 0.5);

  // 6. 综合计算
  // 公式：基础速度 × 信号系数 × 六维综合系数 × 状态系数 × (1 + 模块加成 + 环境加成)
  const combinedFactor =
    spiritDensityFactor *
    sixSiResult.combined *
    statusFactor *
    (1 + techniqueBonus + environmentBonus);

  const finalSpeed = BASE_TRAINING_SPEED * combinedFactor;

  // 7. 预估晋升时间
  const remainingProgress = input.下一级所需 - input.当前进度;
  const estimatedBreakthroughTime = estimatePromotionTime(
    input.当前阶位,
    input.当前阶段,
    remainingProgress,
    finalSpeed
  );

  return {
    基础速度: BASE_TRAINING_SPEED,
    综合系数: combinedFactor,
    最终速度: finalSpeed,
    预计晋升时间: estimatedBreakthroughTime,
    因子详情: {
      信号强度系数: spiritDensityFactor,
      初始六维系数: sixSiResult.innate,
      成长六维系数: sixSiResult.acquired,
      状态效果系数: statusFactor,
      模块加成系数: techniqueBonus,
      环境加成系数: environmentBonus,
    },
  };
}

// ============================================================================
// 晋升时间预估
// ============================================================================

/**
 * 预估晋升时间
 */
function estimatePromotionTime(
  realm: string,
  stage: string,
  remainingProgress: number,
  speed: number
): string {
  if (speed <= 0 || remainingProgress <= 0) {
    return '已可晋升';
  }

  // 查找当前阶位阶段的标准时间
  const standard = REALM_BREAKTHROUGH_STANDARDS.find(
    (s) => s.阶位名称 === realm && s.阶段 === stage
  );

  if (!standard) {
    // 未找到标准，使用简单计算
    const rounds = Math.ceil(remainingProgress / speed);
    return `约${rounds}回合`;
  }

  // 基于标准时间和当前速度计算
  // 假设标准速度为1.0时需要标准月数
  const adjustedMonths = Math.ceil(standard.标准月数 * (remainingProgress / 100) / speed);

  if (adjustedMonths < 1) {
    return '不足一月';
  } else if (adjustedMonths < 12) {
    return `约${adjustedMonths}月`;
  } else {
    const years = Math.floor(adjustedMonths / 12);
    const months = adjustedMonths % 12;
    if (months === 0) {
      return `约${years}年`;
    }
    return `约${years}年${months}月`;
  }
}

/**
 * 获取阶位晋升时间标准
 */
export function getPromotionStandard(
  realm: string,
  stage: string
): InternalBreakthroughTime | undefined {
  return REALM_BREAKTHROUGH_STANDARDS.find(
    (s) => s.阶位名称 === realm && s.阶段 === stage
  );
}

/**
 * 验证训练进度是否合理
 * @returns 是否合理，以及原因
 */
export function validateTrainingProgress(
  realm: string,
  stage: string,
  progressGain: number,
  elapsedMonths: number,
  speed: number
): { valid: boolean; reason: string } {
  const standard = getPromotionStandard(realm, stage);

  if (!standard) {
    return { valid: true, reason: '未找到标准，默认通过' };
  }

  // 计算理论上的最大进度增长
  // 假设100进度需要标准月数，则每月最大进度 = 100 / 最短月数 * speed
  const maxProgressPerMonth = (100 / standard.最短月数) * speed;
  const theoreticalMaxProgress = maxProgressPerMonth * elapsedMonths;

  if (progressGain > theoreticalMaxProgress * 1.2) {
    // 允许20%的浮动
    return {
      valid: false,
      reason: `进度增长过快：${progressGain}超过理论最大值${theoreticalMaxProgress.toFixed(1)}`,
    };
  }

  return { valid: true, reason: '进度合理' };
}

// ============================================================================
// 导出常量供外部使用
// ============================================================================

export { SIX_SI_WEIGHTS, SPIRIT_DENSITY_RANGES };
