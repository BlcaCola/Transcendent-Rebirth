/**
 * 组织数据自动计算器
 * 用算法确保数据的一致性和合理性，不依赖AI生成
 */

export interface SectCalculationData {
  名称: string;
  类型: string;
  等级: string;
  首领阶位?: string;
  最强阶位?: string;
  管理层数量?: number;
  核心成员数?: number;
  内部成员数?: number;
  外围成员数?: number;
}

export interface CalculatedSectData {
  声望值: number;
  综合战力: number;
}

/**
 * 阶位强度映射表 - 用于计算战力
 */
const _RANK_POWER_MAP: Record<string, number> = {
  '街区级初期': 5, '街区级中期': 8, '街区级后期': 12, '街区级圆满': 15, '街区级极境': 18,
  '区域级初期': 20, '区域级中期': 25, '区域级后期': 30, '区域级圆满': 35, '区域级极境': 40,
  '城市级初期': 45, '城市级中期': 52, '城市级后期': 60, '城市级圆满': 68, '城市级极境': 75,
  '核心级初期': 80, '核心级中期': 88, '核心级后期': 95, '核心级圆满': 102, '核心级极境': 110,
  '主宰级初期': 115, '主宰级中期': 125, '主宰级后期': 135, '主宰级圆满': 145, '主宰级极境': 155,
  '超域级初期': 160, '超域级中期': 170, '超域级后期': 180, '超域级圆满': 190, '超域级极境': 200,
  '星域级初期': 210, '星域级中期': 225, '星域级后期': 240, '星域级圆满': 255, '星域级极境': 270,
  '终极级初期': 280, '终极级中期': 310, '终极级后期': 340, '终极级圆满': 370, '终极级极境': 400,
  '街区级': 10, '区域级': 25, '城市级': 55, '核心级': 90, '主宰级': 130,
  '超域级': 175, '星域级': 235, '终极级': 325
};

/**
 * 组织等级基础倍数
 */
const _SECT_LEVEL_MULTIPLIER: Record<string, number> = {
  '超级': 1.2,
  '超级组织': 1.2,
  '一流': 1.0,
  '一流组织': 1.0,
  '二流': 0.8,
  '二流组织': 0.8,
  '三流': 0.6,
  '三流组织': 0.6,
  '末流': 0.4,
  '末流组织': 0.4
};

/**
 * 组织类型修正系数
 */
const SECT_TYPE_MODIFIER: Record<string, number> = {
  '赛博组织': 1.0,
  '守序组织': 1.0,
  '黑域组织': 1.1,
  '影域势力': 1.1,
  '家族集团': 0.9,
  '财团': 0.9,
  '商会': 0.7,
  '商业联盟': 0.7,
  '中立组织': 0.85,
  '自由网络': 0.75
};

/**
 * 计算组织综合战力 - 重新设计更合理的评分系统
 */
function calculateSectPower(data: SectCalculationData): number {
  let baseScore = 0;
  const maxRank = data.最强阶位 || data.首领阶位 || '';

  if (maxRank.includes('街区')) baseScore = 5;
  else if (maxRank.includes('区域')) baseScore = 15;
  else if (maxRank.includes('城市')) baseScore = 25;
  else if (maxRank.includes('核心')) baseScore = 35;
  else if (maxRank.includes('主宰')) baseScore = 45;
  else if (maxRank.includes('超域')) baseScore = 55;
  else if (maxRank.includes('星域')) baseScore = 65;
  else if (maxRank.includes('终极')) baseScore = 75;
  else baseScore = 20;

  const elderCount = data.管理层数量 || 0;
  const totalMembers = (data.核心成员数 || 0) + (data.内部成员数 || 0) + (data.外围成员数 || 0);

  let scaleScore = 0;
  if (elderCount >= 50) scaleScore += 15;
  else if (elderCount >= 30) scaleScore += 12;
  else if (elderCount >= 20) scaleScore += 10;
  else if (elderCount >= 10) scaleScore += 7;
  else if (elderCount >= 5) scaleScore += 4;
  else scaleScore += Math.max(0, elderCount);

  if (totalMembers >= 10000) scaleScore += 10;
  else if (totalMembers >= 5000) scaleScore += 8;
  else if (totalMembers >= 2000) scaleScore += 6;
  else if (totalMembers >= 1000) scaleScore += 4;
  else if (totalMembers >= 500) scaleScore += 2;
  else scaleScore += Math.max(0, Math.floor(totalMembers / 250));

  let levelBonus = 0;
  switch (data.等级) {
    case '超级':
    case '超级组织':
      levelBonus = 10;
      break;
    case '一流':
    case '一流组织':
      levelBonus = 7;
      break;
    case '二流':
    case '二流组织':
      levelBonus = 4;
      break;
    case '三流':
    case '三流组织':
      levelBonus = 2;
      break;
    default:
      levelBonus = 0;
  }

  let typeBonus = 0;
  switch (data.类型) {
    case '黑域组织':
    case '影域势力':
      typeBonus = 3;
      break;
    case '守序组织':
    case '赛博组织':
      typeBonus = 1;
      break;
    case '家族集团':
    case '财团':
      typeBonus = -1;
      break;
    case '商会':
    case '商业联盟':
      typeBonus = -3;
      break;
    case '自由网络':
      typeBonus = -2;
      break;
    default:
      typeBonus = 0;
  }

  let finalScore = baseScore + scaleScore + levelBonus + typeBonus;

  if (maxRank.includes('终极')) finalScore = Math.max(finalScore, 85);
  else if (maxRank.includes('星域')) finalScore = Math.max(finalScore, 75);
  else if (maxRank.includes('超域')) finalScore = Math.max(finalScore, 65);
  else if (maxRank.includes('主宰')) finalScore = Math.max(finalScore, 55);

  return Math.min(100, Math.max(1, Math.round(finalScore)));
}

/**
 * 计算组织声望值
 */
function calculateSectReputation(data: SectCalculationData): number {
  let baseReputation = 5;

  switch (data.等级) {
    case '超级':
    case '超级组织':
      baseReputation = 25;
      break;
    case '一流':
    case '一流组织':
      baseReputation = 20;
      break;
    case '二流':
    case '二流组织':
      baseReputation = 15;
      break;
    case '三流':
    case '三流组织':
      baseReputation = 10;
      break;
    default:
      baseReputation = 5;
  }

  const typeBonus = SECT_TYPE_MODIFIER[data.类型] || 1.0;

  let scaleBonus = 0;
  const elderCount = data.管理层数量 || 0;
  if (elderCount >= 10) scaleBonus += 3;
  else if (elderCount >= 5) scaleBonus += 2;
  else if (elderCount >= 3) scaleBonus += 1;

  const randomFactor = 0.8 + Math.random() * 0.4;
  const finalReputation = Math.round((baseReputation * typeBonus + scaleBonus) * randomFactor);

  return Math.min(30, Math.max(0, finalReputation));
}

/**
 * 计算组织数据的主函数
 */
export function calculateSectData(data: SectCalculationData): CalculatedSectData {
  return {
    声望值: calculateSectReputation(data),
    综合战力: calculateSectPower(data)
  };
}

/**
 * 批量计算多个组织数据
 */
export function batchCalculateSectData(sectList: SectCalculationData[]): (SectCalculationData & CalculatedSectData)[] {
  return sectList.map(sect => ({
    ...sect,
    ...calculateSectData(sect)
  }));
}
