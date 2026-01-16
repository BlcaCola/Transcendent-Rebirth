import type { SectContentStatus, SectMemberInfo, SectSystemV2, SectType, WorldFaction } from '@/types/game';
import { SECT_SYSTEM_VERSION } from '@/utils/sectMigration';

// ============================================================================
// 类型定义
// ============================================================================

type ShopItem = {
  id: string;
  name: string;
  icon: string;
  type: string;
  quality: string;
  description: string;
  cost: number;
  stock?: number;
};

type LibraryTechnique = {
  id: string;
  name: string;
  quality: string;
  qualityTier: string;
  cost: number;
  description: string;
};

type ItemTemplate = {
  name: string;
  type: string;
  quality: string;
  description: string;
  icon?: string;
};

type TechniqueTemplate = {
  name: string;
  quality: string;
  description: string;
};

/** 组织内容生成选项 */
export interface SectContentGenerationOptions {
  /** 是否使用AI生成（true=等待AI生成，false=使用本地随机生成） */
  useAIGeneration?: boolean;
  /** 当前时间ISO字符串 */
  nowIso?: string;
}

/** 组织框架创建结果 */
export interface SectFrameworkResult {
  sectSystem: SectSystemV2;
  memberInfo: SectMemberInfo;
  contentStatus: SectContentStatus;
}

const QUALITY_COST: Record<string, number> = {
  '民用': 80,
  '改装': 200,
  '军规': 500,
  '特级': 900,
  '禁忌': 2600,
};

const TYPE_MULTIPLIER: Record<string, number> = {
  '药剂': 0.85,
  '程序': 1.4,
  '装备': 1.2,
  '材料': 0.65,
  '杂项': 1.0,
};

const BASE_SHOP_POOL: ItemTemplate[] = [
  { name: '能量注射剂', type: '药剂', quality: '改装下', description: '加速电量恢复，稳定训练节奏。', icon: '*' },
  { name: '电池回充针', type: '药剂', quality: '改装中', description: '迅速恢复电量消耗，适合战斗后补给。', icon: '*' },
  { name: '应急止血喷雾', type: '药剂', quality: '民用', description: '外伤止血，缓解疲劳。', icon: '*' },
  { name: '反应护盾模块', type: '装备', quality: '改装下', description: '减轻低阶火力伤害。', icon: 'O' },
  { name: '芯币收纳盒', type: '杂项', quality: '民用', description: '短期存放信用点的轻便盒。', icon: 'O' },
  { name: '合成药草', type: '材料', quality: '民用', description: '基础制剂材料，常见培养物。', icon: 'O' },
  { name: '导电粉末', type: '材料', quality: '改装下', description: '装配辅材，增强能量导通。', icon: 'O' },
];

const BASE_LIBRARY_POOL: TechniqueTemplate[] = [
  { name: '基础散热协议', quality: '民用', description: '稳定能量循环，适合打底训练。' },
  { name: '能量引导协议', quality: '改装下', description: '引导能量流转，提升系统稳定性。' },
  { name: '心智稳定协议', quality: '改装中', description: '降低过载波动，提升专注度。' },
  { name: '防护矩阵', quality: '改装中', description: '生成临时护盾，提升基础防御。' },
];

const THEME_SHOP_POOL: Record<string, ItemTemplate[]> = {
  sword: [
    { name: '近战协议残片', type: '程序', quality: '改装中', description: '近战基础篇章，适合入门成员。', icon: '*' },
    { name: '合金刀胚', type: '装备', quality: '改装中', description: '可塑性良好的合金胚件。', icon: 'O' },
    { name: '刃口研磨器', type: '材料', quality: '民用', description: '提升刃口锋锐度。', icon: 'O' },
  ],
  alchemy: [
    { name: '制剂工艺', type: '程序', quality: '改装中', description: '制剂基础流程，讲究温控与纯度。', icon: '*' },
    { name: '便携合成炉', type: '装备', quality: '改装下', description: '小型制剂合成炉，稳定反应。', icon: 'O' },
    { name: '药剂培养芯', type: '材料', quality: '改装下', description: '适合培养舱使用，产量稳定。', icon: 'O' },
  ],
  array: [
    { name: '算法标记入门', type: '程序', quality: '改装下', description: '标记绘制基础，稳定协议结构。', icon: '*' },
    { name: '小五域矩阵盘', type: '装备', quality: '改装中', description: '临时布控用矩阵盘，效果有限。', icon: 'O' },
    { name: '导电墨', type: '材料', quality: '民用', description: '标记材料，稳定线路。', icon: 'O' },
  ],
  demonic: [
    { name: '暗网吞噬协议', type: '程序', quality: '改装中', description: '高效吞并数据流，但风险更大。', icon: '*' },
    { name: '过载兴奋剂', type: '药剂', quality: '改装中', description: '短时提升输出，副作用明显。', icon: '*' },
    { name: '污染晶体', type: '材料', quality: '改装下', description: '暗网辅材，能量不稳定。', icon: 'O' },
  ],
  merchant: [
    { name: '折扣令', type: '杂项', quality: '民用', description: '兑换商会折扣的令牌。', icon: 'O' },
    { name: '情报芯片', type: '杂项', quality: '改装下', description: '记录周边势力动态的芯片。', icon: 'O' },
    { name: '通行许可', type: '杂项', quality: '改装中', description: '可通行部分管控关卡。', icon: 'O' },
  ],
  beast: [
    { name: '无人机驾驭协议', type: '程序', quality: '改装中', description: '基础无人机控制协议，适合入门。', icon: '*' },
    { name: '无人机补给包', type: '材料', quality: '民用', description: '补充无人机续航的补给包。', icon: 'O' },
    { name: '生物样本晶', type: '材料', quality: '改装下', description: '蕴含生体活性样本。', icon: 'O' },
  ],
};

const THEME_LIBRARY_POOL: Record<string, TechniqueTemplate[]> = {
  sword: [
    { name: '近战协议', quality: '改装中', description: '身法与战术配合的基础近战协议。' },
    { name: '疾行步法', quality: '军规下', description: '高速位移，步法飘逸难测。' },
    { name: '智能武器控制', quality: '军规下', description: '智能武器远程控制，提升机动性。' },
  ],
  alchemy: [
    { name: '药剂配方库', quality: '改装中', description: '配方辨识与材料搭配要诀。' },
    { name: '制剂工艺', quality: '军规下', description: '制剂温控与流程掌控之法。' },
    { name: '药剂识别', quality: '民用', description: '识别药剂品质与属性。' },
  ],
  array: [
    { name: '算法标记精义', quality: '改装中', description: '标记勾勒技巧，提升协议稳定。' },
    { name: '小五域阵图', quality: '军规下', description: '常用矩阵结构，稳定防守。' },
  ],
  demonic: [
    { name: '暗网增幅协议', quality: '军规下', description: '短时爆发增幅，风险较高。' },
    { name: '暗影潜行协议', quality: '改装中', description: '降低被侦测概率，强化感知。' },
  ],
  merchant: [
    { name: '商路策略', quality: '改装下', description: '洞察人心，稳固交易秩序。' },
    { name: '物资鉴定协议', quality: '军规下', description: '辨识物资真伪与来源。' },
  ],
  beast: [
    { name: '无人机感应协议', quality: '军规下', description: '感知无人机状态与情绪。' },
    { name: '无人机绑定协议', quality: '改装中', description: '稳固无人机绑定的协议。' },
  ],
};

const normalizeSectType = (typeText: string): SectType => {
  if (/黑域|暗网|影/i.test(typeText)) return '黑域组织';
  if (/自由|联盟|独立/i.test(typeText)) return '自由网络';
  if (/中立/i.test(typeText)) return '中立组织';
  if (/家族|门阀|财团/i.test(typeText)) return '家族集团';
  if (/商会|商盟|商号/i.test(typeText)) return '商会';
  return '守序组织';
};

const hashString = (input: string) => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const createSeededRandom = (seed: number) => {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 48271) % 2147483647;
    return value / 2147483647;
  };
};

const pickRandomUnique = <T,>(pool: T[], count: number, rand: () => number) => {
  const available = [...pool];
  const picked: T[] = [];
  const finalCount = Math.min(count, available.length);
  for (let i = 0; i < finalCount; i += 1) {
    const index = Math.floor(rand() * available.length);
    picked.push(available.splice(index, 1)[0]);
  }
  return picked;
};

const extractQualityTier = (quality: string) => {
  const match = quality.match(/民用|改装|军规|特级|禁忌/);
  return match ? match[0] : '民用';
};

const buildThemeKey = (sect: WorldFaction) => {
  const raw = `${sect.类型 || ''}${Array.isArray(sect.特色) ? sect.特色.join('') : sect.特色 || ''}${Array.isArray(sect.特色列表) ? sect.特色列表.join('') : ''}`;
  if (/剑|刀|刃|近战/i.test(raw)) return 'sword';
  if (/药剂|制剂|合成/i.test(raw)) return 'alchemy';
  if (/矩阵|算法|标记/i.test(raw)) return 'array';
  if (/商/i.test(raw)) return 'merchant';
  if (/无人机|兽/i.test(raw)) return 'beast';
  if (/黑域|暗网|煞/i.test(raw)) return 'demonic';
  return 'sword';
};

const buildShopItems = (sect: WorldFaction, rand: () => number, sectKey: string): ShopItem[] => {
  const themeKey = buildThemeKey(sect);
  const pool = [...BASE_SHOP_POOL, ...(THEME_SHOP_POOL[themeKey] || [])];
  const picks = pickRandomUnique(pool, 6, rand);

  return picks.map((item, index) => {
    const qualityTier = extractQualityTier(item.quality);
    const baseCost = QUALITY_COST[qualityTier] || 120;
    const multiplier = TYPE_MULTIPLIER[item.type] || 1;
    const variance = 0.85 + rand() * 0.3;
    const cost = Math.max(40, Math.round((baseCost * multiplier * variance) / 10) * 10);
    let stock: number | undefined;

    if (item.type === '程序') {
      stock = undefined;
    } else if (item.type === '装备') {
      stock = Math.max(1, Math.floor(rand() * 3) + 1);
    } else if (item.type === '药剂') {
      stock = Math.max(3, Math.floor(rand() * 8) + 3);
    } else if (item.type === '材料') {
      stock = Math.max(5, Math.floor(rand() * 14) + 5);
    } else {
      stock = Math.max(2, Math.floor(rand() * 6) + 2);
    }

    return {
      id: `sect_${sectKey}_shop_${index + 1}`,
      name: item.name,
      icon: item.icon || 'O',
      type: item.type,
      quality: item.quality,
      description: item.description,
      cost,
      stock,
    };
  });
};

const buildLibraryTechniques = (sect: WorldFaction, rand: () => number, sectKey: string): LibraryTechnique[] => {
  const themeKey = buildThemeKey(sect);
  const pool = [...BASE_LIBRARY_POOL, ...(THEME_LIBRARY_POOL[themeKey] || [])];
  const picks = pickRandomUnique(pool, 5, rand);

  return picks.map((tech, index) => {
    const qualityTier = extractQualityTier(tech.quality);
    const baseCost = QUALITY_COST[qualityTier] || 120;
    const variance = 0.85 + rand() * 0.25;
    const cost = Math.max(60, Math.round((baseCost * 1.2 * variance) / 10) * 10);

    return {
      id: `sect_${sectKey}_lib_${index + 1}`,
      name: tech.name,
      quality: tech.quality,
      qualityTier,
      cost,
      description: tech.description,
    };
  });
};

export const createJoinedSectState = (
  sect: WorldFaction,
  options?: { nowIso?: string }
): { sectSystem: SectSystemV2; memberInfo: SectMemberInfo } => {
  const nowIso = options?.nowIso || new Date().toISOString();
  const sectName = sect.名称;
  const sectKey = String(hashString(sectName));
  const rand = createSeededRandom(hashString(`${sectName}_${nowIso}`));

  const memberInfo: SectMemberInfo = {
    组织名称: sectName,
    组织类型: normalizeSectType(String(sect.类型 || '秩序组织')),
    职位: '外部成员',
    贡献: 0,
    关系: '友好',
    声望: 0,
    加入日期: nowIso,
    描述: sect.描述 || '',
  };

  return {
    sectSystem: {
      版本: SECT_SYSTEM_VERSION,
      当前组织: sectName,
      组织档案: {
        [sectName]: sect,
      },
      组织成员: {},
      组织资料库: {
        [sectName]: buildLibraryTechniques(sect, rand, sectKey),
      },
      组织权限商店: {
        [sectName]: buildShopItems(sect, rand, sectKey),
      },
    },
    memberInfo,
  };
};

// ============================================================================
// 框架+延迟初始化模式（新）
// ============================================================================

/**
 * 创建默认的组织内容状态
 */
export function createDefaultContentStatus(): SectContentStatus {
  return {
    资料库已初始化: false,
    权限商店已初始化: false,
    演变次数: 0,
  };
}

/**
 * 创建组织框架（不生成具体内容）
 *
 * 使用延迟初始化模式：
 * 1. 玩家加入组织时只创建框架和成员信息
 * 2. 资料库、权限商店等内容需要手动初始化
 * 3. 初始化可通过AI生成或本地随机生成
 *
 * @param sect 组织信息
 * @param options 选项
 * @returns 组织框架结果
 */
export function createSectFramework(
  sect: WorldFaction,
  options?: SectContentGenerationOptions
): SectFrameworkResult {
  const nowIso = options?.nowIso || new Date().toISOString();
  const sectName = sect.名称;

  const memberInfo: SectMemberInfo = {
    组织名称: sectName,
    组织类型: normalizeSectType(String(sect.类型 || '秩序组织')),
    职位: '外部成员',
    贡献: 0,
    关系: '友好',
    声望: 0,
    加入日期: nowIso,
    描述: sect.描述 || '',
  };

  const contentStatus = createDefaultContentStatus();

  return {
    sectSystem: {
      版本: SECT_SYSTEM_VERSION,
      当前组织: sectName,
      组织档案: {
        [sectName]: sect,
      },
      组织成员: {},
      组织资料库: {},  // 空，等待初始化
      组织权限商店: {},  // 空，等待初始化
      内容状态: {
        [sectName]: contentStatus,
      },
    },
    memberInfo,
    contentStatus,
  };
}

/**
 * 使用本地随机生成初始化资料库
 */
export function initializeLibraryLocal(
  sect: WorldFaction,
  nowIso?: string
): LibraryTechnique[] {
  const sectName = sect.名称;
  const sectKey = String(hashString(sectName));
  const rand = createSeededRandom(hashString(`${sectName}_${nowIso || Date.now()}`));
  return buildLibraryTechniques(sect, rand, sectKey);
}

/**
 * 使用本地随机生成初始化权限商店
 */
export function initializeShopLocal(
  sect: WorldFaction,
  nowIso?: string
): ShopItem[] {
  const sectName = sect.名称;
  const sectKey = String(hashString(sectName));
  const rand = createSeededRandom(hashString(`${sectName}_${nowIso || Date.now()}`));
  return buildShopItems(sect, rand, sectKey);
}

/**
 * 检查组织内容是否需要初始化
 */
export function checkSectContentNeedsInit(
  sectSystem: SectSystemV2,
  sectName: string
): { library: boolean; shop: boolean } {
  const status = sectSystem.内容状态?.[sectName];

  if (!status) {
    // 没有状态记录，检查实际内容
    const hasLibrary = (sectSystem.组织资料库?.[sectName]?.length ?? 0) > 0;
    const hasShop = (sectSystem.组织权限商店?.[sectName]?.length ?? 0) > 0;

    return {
      library: !hasLibrary,
      shop: !hasShop,
    };
  }

  return {
    library: !status.资料库已初始化,
    shop: !status.权限商店已初始化,
  };
}

/**
 * 获取组织主题关键字（用于AI生成提示）
 */
export function getSectThemeKeywords(sect: WorldFaction): string[] {
  const themeKey = buildThemeKey(sect);
  const keywords: string[] = [];

  switch (themeKey) {
    case 'sword':
      keywords.push('近战', '战术', '刃具', '突进');
      break;
    case 'alchemy':
      keywords.push('制剂', '合成', '药剂', '培养');
      break;
    case 'array':
      keywords.push('矩阵', '算法', '标记', '阵盘');
      break;
    case 'demonic':
      keywords.push('黑域', '过载', '暗网', '渗透');
      break;
    case 'merchant':
      keywords.push('商路', '交易', '鉴定', '情报');
      break;
    case 'beast':
      keywords.push('无人机', '生体', '操控', '绑定');
      break;
  }

  // 添加组织特色
  if (Array.isArray(sect.特色)) {
    keywords.push(...sect.特色);
  } else if (sect.特色) {
    keywords.push(sect.特色);
  }

  return [...new Set(keywords)];
}

// ============================================================================
// 导出
// ============================================================================

export type { ShopItem, LibraryTechnique };

// 导出内部工具函数供高级用途
export {
  hashString,
  createSeededRandom,
  buildThemeKey,
  extractQualityTier,
  QUALITY_COST,
  TYPE_MULTIPLIER,
  BASE_SHOP_POOL,
  BASE_LIBRARY_POOL,
  THEME_SHOP_POOL,
  THEME_LIBRARY_POOL,
};
