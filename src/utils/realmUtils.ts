/**
 * 阶位工具函数
 * 用于格式化阶位显示
 */

/**
 * 格式化阶位和阶段显示
 * @param rank 阶位对象或字符串
 * @returns 格式化后的阶位字符串
 */
export function formatRankWithStage(rank: any): string {
  if (!rank) {
    return '凡人';
  }

  // 如果是字符串，直接返回
  if (typeof rank === 'string') {
    return rank;
  }

  // 如果是对象，提取名称和阶段
  const name = rank.名称 || rank.name || '凡人';
  const stage = rank.阶段 || rank.stage || '';

  // 凡人不加阶段
  if (name === '凡人' || name === 'Mortal') {
    return '凡人';
  }

  // 如果有阶段，返回"阶位+阶段"
  if (stage) {
    return `${name}·${stage}`;
  }

  // 否则只返回阶位名称
  return name;
}
