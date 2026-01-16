/**
 * @fileoverview 六维系统管理模块
 *
 * 【职责】
 * - 管理初始/成长六维的约束
 * - 计算六维对各项属性的加成
 * - 验证六维修改的合法性
 *
 * 【核心概念】
 * - 初始六维：代表初始天赋，范围0-10，占加成权重70%
 * - 成长六维：代表后天增长，范围0-20，占加成权重30%
 * - 等价原则：初始1点 ≈ 成长2.33点效果
 */

// ============================================================================
// 常量定义
// ============================================================================

/** 六维约束配置 - 内部扩展版本 */
export interface InternalSixSiConstraints {
  初始六维: {
    每项上限: number;
    总分上限: number;
    对加成权重: number;
  };
  成长六维: {
    每项上限: number;
    总分上限: number;
    单次增加上限: number;
    稀有机缘上限: number;
    对加成权重: number;
  };
}

/** 六维约束配置 */
export const SIX_SI_CONSTRAINTS: InternalSixSiConstraints = {
  初始六维: {
    每项上限: 10,
    总分上限: 60,
    对加成权重: 0.7,
  },
  成长六维: {
    每项上限: 20,
    总分上限: 120,
    单次增加上限: 3,
    稀有机缘上限: 5,
    对加成权重: 0.3,
  },
};

/** 六维属性名称 */
export const SIX_SI_ATTRIBUTES = ['体质', '能源', '算法', '资源感知', '魅力', '心智'] as const;
export type SixSiAttribute = (typeof SIX_SI_ATTRIBUTES)[number];

/** 六维属性权重（用于综合计算） */
export const SIX_SI_WEIGHTS: Record<SixSiAttribute, number> = {
  体质: 0.25,  // 影响耐受、生命值上限
  能源: 0.25,  // 影响电量上限与能量运转
  算法: 0.20,  // 影响模块理解、晋升概率
  心智: 0.15,  // 影响训练稳定、抗过载
  资源感知: 0.10,  // 影响机会、资源品质、晋升运势
  魅力: 0.05,  // 影响社交、NPC好感
};

/** 六维对各项属性的加成系数 */
export const SIX_SI_BONUS_COEFFICIENTS = {
  体质: {
    生命值上限: 0.05,      // 每点体质增加5%生命值上限
    电量恢复: 0.03,        // 每点体质增加3%电量恢复效率
    结构强度: 0.04,        // 每点体质增加4%结构强度
  },
  能源: {
    电量上限: 0.05,      // 每点能源增加5%电量上限
    模块效能: 0.04,      // 每点能源增加4%模块效能
    信号感应: 0.03,      // 每点能源增加3%信号感应范围
  },
  算法: {
    训练速度: 0.04,      // 每点算法增加4%训练速度
    模块理解: 0.05,      // 每点算法增加5%模块理解速度
    晋升概率: 0.02,      // 每点算法增加2%晋升成功率
  },
  心智: {
    训练稳定: 0.04,      // 每点心智增加4%训练稳定性
    抗过载: 0.05,        // 每点心智增加5%抗过载能力
    意志强度: 0.03,      // 每点心智增加3%意志强度
  },
  资源感知: {
    机会概率: 0.03,      // 每点资源感知增加3%机会触发概率
    资源品质: 0.02,      // 每点资源感知增加2%资源品质
    晋升运势: 0.02,      // 每点资源感知增加2%晋升运势
  },
  魅力: {
    好感获取: 0.05,      // 每点魅力增加5%好感获取
    交易折扣: 0.02,      // 每点魅力增加2%交易折扣
    说服成功: 0.03,      // 每点魅力增加3%说服成功率
  },
} as const;

/** 成长六维获取方式 */
export const ACQUIRED_SIX_SI_SOURCES = {
  装备增幅: { 最大增加: 3, 描述: '穿戴特殊装备获得的临时/永久加成' },
  模块效果: { 最大增加: 2, 描述: '特殊模块带来的永久加成' },
  注入耗材: { 最大增加: 2, 描述: '注入强化剂等特殊耗材' },
  稀有机遇: { 最大增加: 5, 描述: '极稀有机遇，如核心授权、试验洗礼' },
  关键突破: { 最大增加: 1, 描述: '关键晋升时的系统适配加成' },
  阶位晋升: { 最大增加: 1, 描述: '阶位晋升时的体质跃迁' },
} as const;

// ============================================================================
// 类型定义
// ============================================================================

/** 六维数据 */
export interface SixSiData {
  体质: number;
  能源: number;
  算法: number;
  资源感知: number;
  魅力: number;
  心智: number;
}

/** 六维修改请求 */
export interface SixSiModifyRequest {
  属性: SixSiAttribute;
  增加值: number;
  来源: keyof typeof ACQUIRED_SIX_SI_SOURCES;
  描述?: string;
}

/** 六维修改验证结果 */
export interface SixSiModifyValidation {
  valid: boolean;
  reason: string;
  adjustedValue?: number;  // 如果需要调整，返回调整后的值
}

// ============================================================================
// 验证函数
// ============================================================================

/**
 * 验证初始六维数据是否合法
 */
export function validateInnateSixSi(sixSi: SixSiData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const { 每项上限, 总分上限 } = SIX_SI_CONSTRAINTS.初始六维;

  let total = 0;
  for (const attr of SIX_SI_ATTRIBUTES) {
    const value = sixSi[attr];
    if (value < 0) {
      errors.push(`${attr}不能为负数`);
    }
    if (value > 每项上限) {
      errors.push(`${attr}超过上限${每项上限}，当前值${value}`);
    }
    total += value;
  }

  if (total > 总分上限) {
    errors.push(`初始六维总分${total}超过上限${总分上限}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 验证成长六维数据是否合法
 */
export function validateAcquiredSixSi(sixSi: SixSiData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const { 每项上限, 总分上限 } = SIX_SI_CONSTRAINTS.成长六维;

  let total = 0;
  for (const attr of SIX_SI_ATTRIBUTES) {
    const value = sixSi[attr];
    if (value < 0) {
      errors.push(`${attr}不能为负数`);
    }
    if (value > 每项上限) {
      errors.push(`${attr}超过上限${每项上限}，当前值${value}`);
    }
    total += value;
  }

  if (total > 总分上限) {
    errors.push(`成长六维总分${total}超过上限${总分上限}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 验证成长六维修改请求是否合法
 */
export function validateSixSiModify(
  currentSixSi: SixSiData,
  request: SixSiModifyRequest
): SixSiModifyValidation {
  const { 属性, 增加值, 来源 } = request;
  const { 每项上限, 单次增加上限, 稀有机缘上限 } = SIX_SI_CONSTRAINTS.成长六维;

  // 检查来源是否有效
  const sourceConfig = ACQUIRED_SIX_SI_SOURCES[来源];
  if (!sourceConfig) {
    return { valid: false, reason: `无效的获取来源：${来源}` };
  }

  // 检查增加值是否为正
  if (增加值 <= 0) {
    return { valid: false, reason: '增加值必须为正数' };
  }

  // 检查单次增加上限
  const maxIncrease = 来源 === '稀有机遇' ? 稀有机缘上限 : 单次增加上限;
  if (增加值 > maxIncrease) {
    return {
      valid: false,
      reason: `${来源}单次最多增加${maxIncrease}点，请求增加${增加值}点`,
      adjustedValue: maxIncrease,
    };
  }

  // 检查来源限制
  if (增加值 > sourceConfig.最大增加) {
    return {
      valid: false,
      reason: `${来源}最多增加${sourceConfig.最大增加}点`,
      adjustedValue: sourceConfig.最大增加,
    };
  }

  // 检查是否超过属性上限
  const currentValue = currentSixSi[属性];
  const newValue = currentValue + 增加值;
  if (newValue > 每项上限) {
    const actualIncrease = 每项上限 - currentValue;
    if (actualIncrease <= 0) {
      return { valid: false, reason: `${属性}已达上限${每项上限}` };
    }
    return {
      valid: true,
      reason: `${属性}将达到上限，实际增加${actualIncrease}点`,
      adjustedValue: actualIncrease,
    };
  }

  return { valid: true, reason: '修改合法' };
}

// ============================================================================
// 加成计算函数
// ============================================================================

/**
 * 计算单项六维对特定属性的加成
 */
export function calculateSingleBonus(
  attribute: SixSiAttribute,
  innateValue: number,
  acquiredValue: number,
  bonusType: string
): number {
  const coefficients = SIX_SI_BONUS_COEFFICIENTS[attribute];
  const coefficient = (coefficients as Record<string, number>)[bonusType];

  if (coefficient === undefined) {
    return 0;
  }

  // 初始权重70%，成长权重30%
  const innateBonus = innateValue * coefficient * SIX_SI_CONSTRAINTS.初始六维.对加成权重;
  const acquiredBonus = acquiredValue * coefficient * SIX_SI_CONSTRAINTS.成长六维.对加成权重;

  return innateBonus + acquiredBonus;
}

/** 六维加成结果 - 内部扩展版本 */
export interface InternalSixSiBonus {
  训练速度加成: number;
  生命值上限加成: number;
  电量上限加成: number;
  带宽上限加成: number;
  晋升概率加成: number;
  机会概率加成: number;
}

/**
 * 计算综合六维加成
 */
export function calculateSixSiBonus(
  innateSixSi: SixSiData,
  acquiredSixSi: SixSiData
): InternalSixSiBonus {
  const bonus: InternalSixSiBonus = {
    训练速度加成: 0,
    生命值上限加成: 0,
    电量上限加成: 0,
    带宽上限加成: 0,
    晋升概率加成: 0,
    机会概率加成: 0,
  };

  // 体质加成
  bonus.生命值上限加成 += calculateSingleBonus('体质', innateSixSi.体质, acquiredSixSi.体质, '生命值上限');

  // 能源加成
  bonus.电量上限加成 += calculateSingleBonus('能源', innateSixSi.能源, acquiredSixSi.能源, '电量上限');

  // 算法加成
  bonus.训练速度加成 += calculateSingleBonus('算法', innateSixSi.算法, acquiredSixSi.算法, '训练速度');
  bonus.晋升概率加成 += calculateSingleBonus('算法', innateSixSi.算法, acquiredSixSi.算法, '晋升概率');

  // 心智加成（影响带宽）
  bonus.带宽上限加成 += calculateSingleBonus('心智', innateSixSi.心智, acquiredSixSi.心智, '抗过载') * 0.5;

  // 资源感知加成
  bonus.机会概率加成 += calculateSingleBonus('资源感知', innateSixSi.资源感知, acquiredSixSi.资源感知, '机会概率');
  bonus.晋升概率加成 += calculateSingleBonus('资源感知', innateSixSi.资源感知, acquiredSixSi.资源感知, '晋升运势');

  return bonus;
}

/**
 * 计算六维综合评分
 * 用于快速评估角色天赋
 */
export function calculateSixSiScore(
  innateSixSi: SixSiData,
  acquiredSixSi: SixSiData
): { innateScore: number; acquiredScore: number; totalScore: number; grade: string } {
  let innateScore = 0;
  let acquiredScore = 0;

  for (const attr of SIX_SI_ATTRIBUTES) {
    const weight = SIX_SI_WEIGHTS[attr];
    innateScore += innateSixSi[attr] * weight;
    acquiredScore += acquiredSixSi[attr] * weight;
  }

  // 初始满分10，成长满分20，但成长权重只有30%
  // 综合评分 = 初始评分 * 0.7 + 成长评分 * 0.3 / 2（因为成长上限是初始的2倍）
  const totalScore = innateScore * 0.7 + (acquiredScore / 2) * 0.3;

  // 评级
  let grade: string;
  if (totalScore >= 9) {
    grade = '天赋极佳';
  } else if (totalScore >= 7) {
    grade = '天赋上佳';
  } else if (totalScore >= 5) {
    grade = '中等水平';
  } else if (totalScore >= 3) {
    grade = '表现平庸';
  } else {
    grade = '潜力有限';
  }

  return {
    innateScore: Math.round(innateScore * 100) / 100,
    acquiredScore: Math.round(acquiredScore * 100) / 100,
    totalScore: Math.round(totalScore * 100) / 100,
    grade,
  };
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 创建空的六维数据
 */
export function createEmptySixSi(): SixSiData {
  return {
    体质: 0,
    能源: 0,
    算法: 0,
    资源感知: 0,
    魅力: 0,
    心智: 0,
  };
}

/**
 * 创建默认的初始六维（中等水平）
 */
export function createDefaultInnateSixSi(): SixSiData {
  return {
    体质: 5,
    能源: 5,
    算法: 5,
    资源感知: 5,
    魅力: 5,
    心智: 5,
  };
}

/**
 * 随机生成初始六维
 * @param totalPoints 总点数（默认30，即平均每项5点）
 * @param variance 方差系数（0-1，越大越不均匀）
 */
export function generateRandomInnateSixSi(totalPoints: number = 30, variance: number = 0.5): SixSiData {
  const sixSi = createEmptySixSi();
  const { 每项上限 } = SIX_SI_CONSTRAINTS.初始六维;

  // 先平均分配
  const baseValue = Math.floor(totalPoints / 6);
  let remaining = totalPoints - baseValue * 6;

  for (const attr of SIX_SI_ATTRIBUTES) {
    sixSi[attr] = baseValue;
  }

  // 根据方差随机调整
  const adjustments = Math.floor(totalPoints * variance);
  for (let i = 0; i < adjustments; i++) {
    // 随机选择两个属性，一个加一个减
    const attrs = [...SIX_SI_ATTRIBUTES];
    const fromIdx = Math.floor(Math.random() * attrs.length);
    const fromAttr = attrs[fromIdx];
    attrs.splice(fromIdx, 1);
    const toIdx = Math.floor(Math.random() * attrs.length);
    const toAttr = attrs[toIdx];

    if (sixSi[fromAttr] > 1 && sixSi[toAttr] < 每项上限) {
      sixSi[fromAttr]--;
      sixSi[toAttr]++;
    }
  }

  // 分配剩余点数
  while (remaining > 0) {
    const attr = SIX_SI_ATTRIBUTES[Math.floor(Math.random() * SIX_SI_ATTRIBUTES.length)];
    if (sixSi[attr] < 每项上限) {
      sixSi[attr]++;
      remaining--;
    }
  }

  return sixSi;
}

/**
 * 格式化六维数据为显示字符串
 */
export function formatSixSiDisplay(sixSi: SixSiData, type: '初始' | '成长'): string {
  const maxValue = type === '初始'
    ? SIX_SI_CONSTRAINTS.初始六维.每项上限
    : SIX_SI_CONSTRAINTS.成长六维.每项上限;

  return SIX_SI_ATTRIBUTES.map(attr => `${attr}:${sixSi[attr]}/${maxValue}`).join(' ');
}
