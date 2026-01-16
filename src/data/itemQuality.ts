/**
 * 物品品质系统定义
 * 品质等级：禁忌、特级、军规、改装、民用
 * 品级：0 残缺；1-3 下品；4-6 中品；7-9 上品；10 极品
 */

export interface QualityInfo {
  color: string;
  rarity: string; // 文案描述
}

export interface GradeInfo {
  name: string; // 残缺/下品/中品/上品/极品
  description: string;
  effect: string; // 可用于UI特效描述
}

export interface ItemQualitySystem {
  // 品质等级（禁忌、特级、军规、改装、民用）
  qualities: {
    禁忌: QualityInfo;
    特级: QualityInfo;
    军规: QualityInfo;
    改装: QualityInfo;
    民用: QualityInfo;
  };

  // 品级（0 残缺；1-3 下品；4-6 中品；7-9 上品；10 极品）
  grades: {
    0: GradeInfo;
    1: GradeInfo;
    2: GradeInfo;
    3: GradeInfo;
    4: GradeInfo;
    5: GradeInfo;
    6: GradeInfo;
    7: GradeInfo;
    8: GradeInfo;
    9: GradeInfo;
    10: GradeInfo;
  };
}

export const ITEM_QUALITY_SYSTEM: ItemQualitySystem = {
  qualities: {
    禁忌: { color: '#9932CC', rarity: '禁忌级黑箱技术，极端稀有且伴随高风险。' },
    特级: { color: '#FF69B4', rarity: '特级定制与小批量武装，性能强悍，极难获取。' },
    军规: { color: '#00CED1', rarity: '军规标准制造，稳定可靠，具备高强度作战性能。' },
    改装: { color: '#DAA520', rarity: '基于民用改装，性能增强，仍可在黑市流通。' },
    民用: { color: '#808080', rarity: '城邦民用量产装备，稳定耐用，基础功能齐全。' },
  },

  grades: {
    0: { name: '残缺', description: '破损不堪', effect: '破损效果' },
    1: { name: '下品', description: '品质一般', effect: '淡色光效' },
    2: { name: '下品', description: '品质一般', effect: '淡色光效' },
    3: { name: '下品', description: '品质一般', effect: '淡色光效' },
    4: { name: '中品', description: '品质中等', effect: '中等光效' },
    5: { name: '中品', description: '品质中等', effect: '中等光效' },
    6: { name: '中品', description: '品质中等', effect: '中等光效' },
    7: { name: '上品', description: '品质上乘', effect: '强烈光效' },
    8: { name: '上品', description: '品质上乘', effect: '强烈光效' },
    9: { name: '上品', description: '品质上乘', effect: '强烈光效' },
    10: { name: '极品', description: '完美无瑕', effect: '炫目特效' },
  },
};

export type QualityType = keyof typeof ITEM_QUALITY_SYSTEM.qualities;
export type GradeType = keyof typeof ITEM_QUALITY_SYSTEM.grades;

export function getQualityInfo(quality: QualityType): QualityInfo {
  return ITEM_QUALITY_SYSTEM.qualities[quality];
}

export function getGradeInfo(grade: GradeType): GradeInfo {
  return ITEM_QUALITY_SYSTEM.grades[grade];
}

export function getFullQualityDescription(quality: QualityType, grade: GradeType): string {
  const qualityInfo = getQualityInfo(quality);
  const gradeInfo = getGradeInfo(grade);
  return `${quality}·${gradeInfo.name} - ${qualityInfo.rarity}`;
}

export function getItemColor(quality: QualityType, grade: GradeType): string {
  if (grade === 0) return '#666666';
  return getQualityInfo(quality).color;
}

export function getGradeRange(grade: number): string {
  if (grade === 0) return '残缺';
  if (grade >= 1 && grade <= 3) return '下品';
  if (grade >= 4 && grade <= 6) return '中品';
  if (grade >= 7 && grade <= 9) return '上品';
  if (grade === 10) return '极品';
  return '未知';
}

export function generateQualitySystemPrompt(): string {
  return `
## 物品品质系统 (重要参考)
此世界的物品分为两个维度：品质等级 与 品级

### 品质等级 (从低到高):
- 民用: ${ITEM_QUALITY_SYSTEM.qualities.民用.rarity}
- 改装: ${ITEM_QUALITY_SYSTEM.qualities.改装.rarity}
- 军规: ${ITEM_QUALITY_SYSTEM.qualities.军规.rarity}
- 特级: ${ITEM_QUALITY_SYSTEM.qualities.特级.rarity}
- 禁忌: ${ITEM_QUALITY_SYSTEM.qualities.禁忌.rarity}

### 品级 (物品完美程度):
- 残缺 (0): 破损不堪，效果大减
- 下品 (1-3): 品质一般，淡色光效
- 中品 (4-6): 品质中等，中等光效
- 上品 (7-9): 品质上乘，强烈光效
- 极品 (10): 完美无瑕，炫目特效

### 物品命名规则 (建议):
两种推荐的命名格式：

格式1 - 简洁版（推荐）: [物品名]
示例：
- "应急止血喷雾" (民用下品)
- "能量注射剂" (改装中品)
- "便携合成炉" (军规下品)
- "反应护盾模块" (特级中品)

格式2 - 完整版（特殊情况）: [品质][品级][物品名]
示例：
- "民用下品应急止血喷雾"
- "改装中品能量注射剂"
- "军规上品反应护盾模块"
- "禁忌极品超核电池"

命名建议：
- 日常物品使用简洁版命名
- 高品质或特殊物品可使用完整版
- 避免使用 "民下" 这种连写格式
- 如需标注品级，使用 "民用下品" 的分离格式

重要提示：初始角色通常只有民用或改装的下品物品，高品质物品极其稀少。
`;
}

