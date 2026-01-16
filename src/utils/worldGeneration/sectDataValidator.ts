/**
 * 组织数据验证器
 * 确保AI生成的组织数据逻辑一致性
 */

// 阶位等级映射 - 支持带阶段后缀的格式
// 注意：同一阶位的不同阶段（初期、中期、后期、圆满、极境）都算同一等级
const RANK_LEVELS: Record<string, number> = {
  // 街头级
  '街头级': 1, '街头级初期': 1, '街头级中期': 1, '街头级后期': 1, '街头级圆满': 1, '街头级极境': 1,
  // 区域级
  '区域级': 2, '区域级初期': 2, '区域级中期': 2, '区域级后期': 2, '区域级圆满': 2, '区域级极境': 2,
  // 城域级
  '城域级': 3, '城域级初期': 3, '城域级中期': 3, '城域级后期': 3, '城域级圆满': 3, '城域级极境': 3,
  // 核心级
  '核心级': 4, '核心级初期': 4, '核心级中期': 4, '核心级后期': 4, '核心级圆满': 4, '核心级极境': 4,
  // 主权级
  '主权级': 5, '主权级初期': 5, '主权级中期': 5, '主权级后期': 5, '主权级圆满': 5, '主权级极境': 5,
  // 超域级
  '超域级': 6, '超域级初期': 6, '超域级中期': 6, '超域级后期': 6, '超域级圆满': 6, '超域级极境': 6,
  // 星域级
  '星域级': 7, '星域级初期': 7, '星域级中期': 7, '星域级后期': 7, '星域级圆满': 7, '星域级极境': 7,
  // 极域级
  '极域级': 8, '极域级初期': 8, '极域级中期': 8, '极域级后期': 8, '极域级圆满': 8, '极域级极境': 8
};

/**
 * 获取阶位等级
 */
function getRankLevel(rank: string): number {
  return RANK_LEVELS[rank] || 0;
}

/**
 * 验证并修复组织阶位分布数据
 */
export function validateAndFixFactionRankData(factionData: any): any {
  if (!factionData) return factionData;

  // 字段名兼容：将英文字段名转换为中文字段名
  if (factionData.leadership && !factionData.领导层) {
    factionData.领导层 = factionData.leadership;
    delete factionData.leadership;
  }

  // 特殊规则：夜宴组织若缺失“特使”，自动补齐（避免只生成组织不生成关键职位）
  const factionName = String(factionData.名称 || factionData.name || '');
  if (factionName.includes('夜宴')) {
    if (!factionData.领导层) {
      factionData.领导层 = {
        首领: '夜宴首席',
        首领阶位: factionData.最强阶位 || '核心级圆满',
        最强阶位: factionData.最强阶位 || '核心级圆满',
        特使: '灰烬女士(夜宴特使)'
      };
    } else if (!factionData.领导层.特使) {
      factionData.领导层.特使 = '灰烬女士(夜宴特使)';
    }
  } else if (factionData.领导层) {
    // 彩蛋限定：其他组织不应出现“特使/候补特使”字段（即便AI生成了也移除）
    if ('特使' in factionData.领导层) delete factionData.领导层.特使;
    if ('候补特使' in factionData.领导层) delete factionData.领导层.候补特使;
  }

  // 处理 memberCount 字段
  if (factionData.memberCount && !factionData.成员数量) {
    factionData.成员数量 = {
      总数: factionData.memberCount.total,
      按阶位: factionData.memberCount.byRank,
      按职位: factionData.memberCount.byPosition
    };
    delete factionData.memberCount;
  }

  // 处理已存在的成员数量字段中的英文子字段
  if (factionData.成员数量) {
    const memberCount = factionData.成员数量;

    // 转换 total -> 总数
    if (memberCount.total !== undefined && memberCount.总数 === undefined) {
      memberCount.总数 = memberCount.total;
    }

    // 转换 byRank -> 按阶位
    if (memberCount.byRank && !memberCount.按阶位) {
      memberCount.按阶位 = memberCount.byRank;
    }

    // 转换 byPosition -> 按职位
    if (memberCount.byPosition && !memberCount.按职位) {
      memberCount.按职位 = memberCount.byPosition;
    }
  }

  // 获取最强阶位等级
  const maxRank = factionData.领导层?.最强阶位 || factionData.最强阶位;
  const maxLevel = getRankLevel(maxRank);

  console.log(`[组织验证] ${factionData.名称}: 最强阶位="${maxRank}" → 等级=${maxLevel}`);
  console.log(`[组织验证] ${factionData.名称}: 原始阶位分布=`, factionData.成员数量?.按阶位);

  // 🔥 智能修复：根据阶位分布自动设置最强阶位
  if (factionData.成员数量?.按阶位) {
    const rankDist = factionData.成员数量.按阶位;

    // 找出阶位分布中的最高阶位
    let highestRankLevel = 0;
    let highestRankName = '';

    Object.keys(rankDist).forEach(rank => {
      const count = rankDist[rank];
      if (count > 0) {
        const rankLevel = getRankLevel(rank);
        if (rankLevel > highestRankLevel) {
          highestRankLevel = rankLevel;
          highestRankName = rank;
        }
      }
    });

    // 如果找到了最高阶位，用它来更新最强阶位
    if (highestRankLevel > 0 && highestRankName) {
      const correctedMaxRank = highestRankName.includes('圆满') ? highestRankName : `${highestRankName}圆满`;

      // 更新领导层中的最强阶位
      if (factionData.领导层) {
        const oldMaxRank = factionData.领导层.最强阶位;
        factionData.领导层.最强阶位 = correctedMaxRank;
        console.log(`[组织验证] ${factionData.名称}: 根据阶位分布自动修正最强阶位: "${oldMaxRank}" → "${correctedMaxRank}"`);

        // 如果首领阶位低于最强阶位，也更新首领阶位
        const leaderRankLevel = getRankLevel(factionData.领导层.首领阶位 || '');
        if (leaderRankLevel < highestRankLevel) {
          factionData.领导层.首领阶位 = correctedMaxRank;
          console.log(`[组织验证] ${factionData.名称}: 同时更新首领阶位为: "${correctedMaxRank}"`);
        }
      }
    }

    console.log(`[组织验证] ${factionData.名称}: 阶位分布包含:`, Object.keys(rankDist).filter(r => rankDist[r] > 0));
  }

  console.log(`[组织验证] ${factionData.名称}: 验证后阶位分布=`, factionData.成员数量?.按阶位);

  // 验证骨干数量与高阶成员数量的一致性
  if (factionData.领导层?.骨干数量 && factionData.成员数量?.按阶位) {
    const coreCount = factionData.领导层.骨干数量;
    const rankDist = factionData.成员数量.按阶位;

    // 计算核心级及以上的成员总数
    let highRealmCount = 0;
    Object.keys(rankDist).forEach(rank => {
      const rankLevel = getRankLevel(rank);
      if (rankLevel >= 4) {
        highRealmCount += rankDist[rank] || 0;
      }
    });

    if (highRealmCount > coreCount * 1.5) {
      const ratio = coreCount * 1.2 / highRealmCount;
      Object.keys(rankDist).forEach(rank => {
        const rankLevel = getRankLevel(rank);
        if (rankLevel >= 4) {
          const originalCount = rankDist[rank];
          rankDist[rank] = Math.max(1, Math.round(originalCount * ratio));
        }
      });
    }
  }

  return factionData;
}

/**
 * 验证组织数据的整体一致性
 */
export function validateFactionConsistency(factionData: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!factionData) {
    errors.push('组织数据为空');
    return { isValid: false, errors };
  }

  // 检查最强阶位与阶位分布的一致性
  const maxRank = factionData.领导层?.最强阶位 || factionData.最强阶位;
  const maxLevel = getRankLevel(maxRank);

  if (factionData.成员数量?.按阶位) {
    Object.keys(factionData.成员数量.按阶位).forEach(rank => {
      const rankLevel = getRankLevel(rank);
      if (rankLevel > maxLevel) {
        errors.push(`阶位分布错误: 存在${rank}成员，但最强阶位仅为${maxRank}`);
      }
    });
  }

  // 检查骨干数量与高阶成员的合理性
  const coreCount = factionData.领导层?.骨干数量;
  if (coreCount && factionData.成员数量?.按阶位) {
    let highRealmCount = 0;
    Object.keys(factionData.成员数量.按阶位).forEach(rank => {
      const rankLevel = getRankLevel(rank);
      if (rankLevel >= 4) {
        highRealmCount += factionData.成员数量.按阶位[rank] || 0;
      }
    });

    if (highRealmCount > coreCount * 2) {
      errors.push(`人员配置不合理: 骨干${coreCount}位，但核心级以上成员${highRealmCount}人`);
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * 批量验证并修复组织数据列表
 */
export function validateAndFixFactionDataList(factions: any[]): any[] {
  if (!Array.isArray(factions)) return factions;

  return factions.map(faction => {
    const fixedFaction = validateAndFixFactionRankData(faction);
    const validation = validateFactionConsistency(fixedFaction);

    if (!validation.isValid) {
      console.warn(`[组织验证] ${faction.名称 || '未知组织'}存在问题:`, validation.errors);
    }

    return fixedFaction;
  });
}
