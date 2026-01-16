/**
 * 数据修复和清洗工具
 *
 * 功能:
 * - 修复AI返回的不完整或错误的存档数据
 * - 填充缺失的必需字段
 * - 验证并修正数据类型和范围
 *
 * 被以下文件引用:
 * - src/stores/characterStore.ts
 */

import type { SaveData, Item, NpcProfile, GameTime, Rank, PlayerAttributes, PlayerLocation } from '@/types/game';
import type { GradeType } from '@/data/itemQuality';
import { cloneDeep } from 'lodash';
import { isSaveDataV3, migrateSaveDataToLatest } from '@/utils/saveMigration';
import { validateSaveDataV3 } from '@/utils/saveValidationV3';

/**
 * 修复并清洗存档数据，确保所有必需字段存在且格式正确
 */
export function repairSaveData(saveData: SaveData | null | undefined): SaveData {
  console.log('[数据修复] 开始修复存档数据');

  try {
    if (!saveData || typeof saveData !== 'object') {
      console.error('[数据修复] ❌ 存档数据为空或无效，创建默认存档');
      return createMinimalSaveDataV3();
    }

    // 统一入口：非V3一律先迁移到V3（迁移后只保留V3结构）
    const migrated = isSaveDataV3(saveData) ? (saveData as any) : migrateSaveDataToLatest(saveData as any).migrated;
    const repaired = cloneDeep(migrated) as any;

    // 运行期校验（允许轻微修复，但结构必须是 V3 五领域）
    const validation = validateSaveDataV3(repaired);
    if (!validation.isValid) {
      console.warn('[数据修复] ⚠️ 存档结构不合格，使用最小V3模板兜底:', validation.errors);
      return createMinimalSaveDataV3();
    }

    // --- 元数据 ---
    repaired.元数据 = repaired.元数据 && typeof repaired.元数据 === 'object' ? repaired.元数据 : createMinimalSaveDataV3().元数据;
    repaired.元数据.版本号 = 3;
    repaired.元数据.存档ID = repaired.元数据.存档ID || `save_${Date.now()}`;
    repaired.元数据.存档名 = repaired.元数据.存档名 || '自动存档';
    repaired.元数据.创建时间 = repaired.元数据.创建时间 || new Date().toISOString();
    repaired.元数据.更新时间 = new Date().toISOString();
    repaired.元数据.游戏时长秒 = validateNumber(repaired.元数据.游戏时长秒, 0, 999999999, 0);
    repaired.元数据.时间 = repairGameTime(repaired.元数据.时间);

    // --- 角色 ---
    repaired.角色 = repaired.角色 && typeof repaired.角色 === 'object' ? repaired.角色 : createMinimalSaveDataV3().角色;
    repaired.角色.身份 = repaired.角色.身份 && typeof repaired.角色.身份 === 'object' ? repaired.角色.身份 : createMinimalSaveDataV3().角色.身份;

    repaired.角色.身份.名字 = repaired.角色.身份.名字 || '无名行动者';
    repaired.角色.身份.性别 = repaired.角色.身份.性别 || '男';
    if (!repaired.角色.身份.出生日期) repaired.角色.身份.出生日期 = { 年: 982, 月: 1, 日: 1 };
    if (!repaired.角色.身份.初始六维 || typeof repaired.角色.身份.初始六维 !== 'object') {
      repaired.角色.身份.初始六维 = { 体质: 5, 能源: 5, 算法: 5, 资源感知: 5, 魅力: 5, 心智: 5 };
    } else {
      const attrs = repaired.角色.身份.初始六维;
      attrs.体质 = validateNumber(attrs.体质, 0, 10, 5);
      attrs.能源 = validateNumber(attrs.能源, 0, 10, 5);
      attrs.算法 = validateNumber(attrs.算法, 0, 10, 5);
      attrs.资源感知 = validateNumber(attrs.资源感知, 0, 10, 5);
      attrs.魅力 = validateNumber(attrs.魅力, 0, 10, 5);
      attrs.心智 = validateNumber(attrs.心智, 0, 10, 5);
    }
    if (!repaired.角色.身份.成长六维 || typeof repaired.角色.身份.成长六维 !== 'object') {
      repaired.角色.身份.成长六维 = { 体质: 0, 能源: 0, 算法: 0, 资源感知: 0, 魅力: 0, 心智: 0 };
    }

    // --- 属性 ---
    if (!repaired.角色.属性 || typeof repaired.角色.属性 !== 'object') {
      console.warn('[数据修复] 属性缺失，创建默认值');
      repaired.角色.属性 = createDefaultAttributes();
    } else {
      repaired.角色.属性.阶位 = repairRank(repaired.角色.属性.阶位);
      repaired.角色.属性.生命值 = repairValuePair(repaired.角色.属性.生命值, 100, 100);
      repaired.角色.属性.电量 = repairValuePair(repaired.角色.属性.电量, 50, 50);
      repaired.角色.属性.带宽 = repairValuePair(repaired.角色.属性.带宽, 30, 30);
      repaired.角色.属性.寿命 = repairValuePair(repaired.角色.属性.寿命, 18, 80);
      repaired.角色.属性.声望 = validateNumber(repaired.角色.属性.声望, 0, 999999, 0);
    }

    // --- 位置 ---
    if (!repaired.角色.位置 || typeof repaired.角色.位置 !== 'object') {
      repaired.角色.位置 = createDefaultLocation();
    } else if (!repaired.角色.位置.描述) {
      repaired.角色.位置.描述 = '霓虹城·无名区';
    }

    // --- 效果 ---
    if (!Array.isArray(repaired.角色.效果)) repaired.角色.效果 = [];

    // --- 装备（槽位只存物品ID）---
    const defaultEquipment = { 装备1: null, 装备2: null, 装备3: null, 装备4: null, 装备5: null, 装备6: null };
    if (!repaired.角色.装备 || typeof repaired.角色.装备 !== 'object') repaired.角色.装备 = { ...defaultEquipment };
    for (let i = 1; i <= 6; i++) {
      const key = `装备${i}`;
      const slotValue = repaired.角色.装备[key];
      if (slotValue == null) repaired.角色.装备[key] = null;
      else if (typeof slotValue === 'string') repaired.角色.装备[key] = slotValue;
      else if (typeof slotValue === 'object' && slotValue !== null && '物品ID' in slotValue) {
        repaired.角色.装备[key] = String((slotValue as any).物品ID || '');
      } else repaired.角色.装备[key] = null;
    }

    // --- 背包 ---
    if (!repaired.角色.背包 || typeof repaired.角色.背包 !== 'object') {
      repaired.角色.背包 = { 信用点: { 低额: 0, 中额: 0, 高额: 0, 最高额: 0 }, 物品: {} };
    } else {
      if (!repaired.角色.背包.信用点 || typeof repaired.角色.背包.信用点 !== 'object') {
        repaired.角色.背包.信用点 = { 低额: 0, 中额: 0, 高额: 0, 最高额: 0 };
      } else {
        repaired.角色.背包.信用点.低额 = validateNumber(repaired.角色.背包.信用点.低额, 0, 999999999, 0);
        repaired.角色.背包.信用点.中额 = validateNumber(repaired.角色.背包.信用点.中额, 0, 999999999, 0);
        repaired.角色.背包.信用点.高额 = validateNumber(repaired.角色.背包.信用点.高额, 0, 999999999, 0);
        repaired.角色.背包.信用点.最高额 = validateNumber(repaired.角色.背包.信用点.最高额, 0, 999999999, 0);
      }

      if (!repaired.角色.背包.物品 || typeof repaired.角色.背包.物品 !== 'object') {
        repaired.角色.背包.物品 = {};
      } else {
        const validItems: Record<string, Item> = {};
        for (const [id, item] of Object.entries(repaired.角色.背包.物品 as Record<string, unknown>)) {
          const rawItem = item as any;
          if (rawItem && typeof rawItem === 'object' && typeof rawItem.名称 === 'string' && rawItem.名称.trim()) {
            validItems[id] = repairItem(rawItem as Item);
          }
        }
        repaired.角色.背包.物品 = validItems;
      }
    }

    // --- 社交.关系 ---
    if (!repaired.社交 || typeof repaired.社交 !== 'object') repaired.社交 = createMinimalSaveDataV3().社交;
    if (!repaired.社交.关系 || typeof repaired.社交.关系 !== 'object') {
      repaired.社交.关系 = {};
    } else {
      const raw = repaired.社交.关系 as Record<string, unknown>;
      const validNpcs: Record<string, NpcProfile> = {};

      for (const [key, value] of Object.entries(raw)) {
        if (key.startsWith('_')) continue;
        if (!value || typeof value !== 'object') continue;

        const npc = value as any;
        const nameFromValue = typeof npc.名字 === 'string' ? npc.名字.trim() : '';
        const nameFromKey = typeof key === 'string' ? key.trim() : '';
        const finalName = nameFromValue || nameFromKey;
        if (!finalName) continue;

        npc.名字 = finalName;
        validNpcs[finalName] = repairNpc(npc as NpcProfile);
      }

      repaired.社交.关系 = validNpcs;
    }

    // --- 社交.记忆 ---
    if (!repaired.社交.记忆 || typeof repaired.社交.记忆 !== 'object') {
      repaired.社交.记忆 = { 短期记忆: [], 中期记忆: [], 长期记忆: [], 隐式中期记忆: [] };
    } else {
      repaired.社交.记忆.短期记忆 = Array.isArray(repaired.社交.记忆.短期记忆) ? repaired.社交.记忆.短期记忆 : [];
      repaired.社交.记忆.中期记忆 = Array.isArray(repaired.社交.记忆.中期记忆) ? repaired.社交.记忆.中期记忆 : [];
      repaired.社交.记忆.长期记忆 = Array.isArray(repaired.社交.记忆.长期记忆) ? repaired.社交.记忆.长期记忆 : [];
      repaired.社交.记忆.隐式中期记忆 = Array.isArray(repaired.社交.记忆.隐式中期记忆) ? repaired.社交.记忆.隐式中期记忆 : [];
    }

    // --- 系统.历史 ---
    if (!repaired.系统 || typeof repaired.系统 !== 'object') repaired.系统 = createMinimalSaveDataV3().系统;
    if (!repaired.系统.历史 || typeof repaired.系统.历史 !== 'object') repaired.系统.历史 = { 叙事: [] };
    if (!Array.isArray(repaired.系统.历史.叙事)) repaired.系统.历史.叙事 = [];

    // --- 角色子模块最小化补全 ---
    if (!repaired.角色.流派 || typeof repaired.角色.流派 !== 'object') repaired.角色.流派 = { 流派列表: {} };
    if (!repaired.角色.程序 || typeof repaired.角色.程序 !== 'object') repaired.角色.程序 = { 当前程序ID: null, 程序进度: {}, 程序套装: { 主修: null, 辅修: [] } };
    if (!repaired.角色.训练 || typeof repaired.角色.训练 !== 'object') repaired.角色.训练 = { 训练程序: null, 训练状态: { 模式: '未训练' } };
    if (!repaired.角色.技能 || typeof repaired.角色.技能 !== 'object') repaired.角色.技能 = { 掌握技能: [], 装备栏: [], 冷却: {} };

    // --- 社交.事件 ---
    if (!repaired.社交.事件 || typeof repaired.社交.事件 !== 'object') {
      repaired.社交.事件 = {
        配置: { 启用随机事件: true, 最小间隔年: 1, 最大间隔年: 10, 事件提示词: '' },
        下次事件时间: null,
        事件记录: [],
      };
    } else {
      if (!repaired.社交.事件.配置 || typeof repaired.社交.事件.配置 !== 'object') {
        repaired.社交.事件.配置 = { 启用随机事件: true, 最小间隔年: 1, 最大间隔年: 10, 事件提示词: '' };
      }
      if (!Array.isArray(repaired.社交.事件.事件记录)) repaired.社交.事件.事件记录 = [];
      if (repaired.社交.事件.下次事件时间 && typeof repaired.社交.事件.下次事件时间 !== 'object') {
        repaired.社交.事件.下次事件时间 = null;
      }
    }

    // --- 训练.训练程序引用校验 ---
    if (repaired.角色.训练?.训练程序 && typeof repaired.角色.训练.训练程序 === 'object') {
      const technique = repaired.角色.训练.训练程序 as any;
      if (!technique.物品ID) {
        repaired.角色.训练.训练程序 = null;
      } else {
        const referencedItem = repaired.角色?.背包?.物品?.[technique.物品ID];
        if (!referencedItem || referencedItem.类型 !== '程序') {
          repaired.角色.训练.训练程序 = null;
        } else if (!technique.名称 || technique.名称 !== referencedItem.名称) {
          technique.名称 = referencedItem.名称;
        }
      }
    }


    console.log('[数据修复] ✅ 存档数据修复完成');
    return repaired;
  } catch (error) {
    console.error('[数据修复] ❌ 修复过程发生严重错误，返回默认存档:', error);
    return createMinimalSaveDataV3();
  }
}

/**
 * 根据等级和阶段生成赛博朋克风格的升级描述
 */
function getDefaultBreakthroughDescription(rankName?: string, stage?: string): string {
  const name = rankName || '凡人';
  const currentStage = stage || '';

  // 旧存档默认兜底
  if (name === '凡人') {
    return '身份未登记，完成首次任务以解锁基础权限';
  }

  // 定义各等级的升级描述
  const realmDescriptions: Record<string, Record<string, string>> = {
    '街头人': {
      '初期': '完成低风险委托，建立基础权限，准备迈向中期',
      '中期': '补强装备与关系网，提升行动效率，准备进入后期',
      '后期': '稳定资源渠道，扩展行动范围，准备阶段圆满',
      '圆满': '完成基础认证，准备升级为跑者',
      '': '完成街区任务，稳固基础权限'
    },
    '跑者': {
      '初期': '适配基础义体，拓展委托网络，准备进入中期',
      '中期': '提升协作与效率，解锁更高风险任务，准备进入后期',
      '后期': '稳定战术流程，积累关键情报，准备阶段圆满',
      '圆满': '获得稳定通行权限，准备升级为潜影者',
      '': '提升执行力与稳定性，推进跑者阶段'
    },
    '潜影者': {
      '初期': '强化渗透能力，优化隐匿流程，准备进入中期',
      '中期': '掌握关键节点，提升情报处理，准备进入后期',
      '后期': '稳定深度行动，扩展资源触达，准备阶段圆满',
      '圆满': '完成高危认证，准备升级为雇佣猎手',
      '': '提升潜行与渗透效率，推进潜影者阶段'
    },
    '雇佣猎手': {
      '初期': '优化战术配置，提升火力效率，准备进入中期',
      '中期': '整合情报与火力，提升执行效率，准备进入后期',
      '后期': '稳定高危行动，建立团队影响力，准备阶段圆满',
      '圆满': '完成关键任务链，准备升级为战术大师',
      '': '强化战术适配与执行力，推进雇佣猎手阶段'
    },
    '战术大师': {
      '初期': '建立指挥链路，提升战术协同，准备进入中期',
      '中期': '掌控多线行动，扩展资源调度，准备进入后期',
      '后期': '稳定局势操控，构建长线优势，准备阶段圆满',
      '圆满': '完成核心协定，准备升级为企业特使',
      '': '优化指挥与调度，推进战术大师阶段'
    }
  };

  // 获取对应阶位的描述
  const stageDescriptions = realmDescriptions[name];
  if (stageDescriptions) {
    return stageDescriptions[currentStage] || stageDescriptions[''] || '提升等级阶段，准备下一步升级';
  }

  // 未知阶位的通用描述
  const genericDescriptions: Record<string, string> = {
    '初期': '稳固当前阶段，准备进入中期',
    '中期': '优化配置与流程，准备进入后期',
    '后期': '巩固关键能力，准备阶段圆满',
    '圆满': '完成阶段目标，准备升级下一等级',
    '': '提升等级阶段，准备下一步升级'
  };

  return genericDescriptions[currentStage] || '提升等级阶段，准备下一步升级';
}

/**
 * 修复阶位数据
 */
function repairRank(rank: any): Rank {
  if (!rank || typeof rank !== 'object') {
    return {
      名称: "凡人",
      阶段: "",
      当前进度: 0,
      下一级所需: 100,
      突破描述: '身份未登记，完成首次任务以解锁基础权限'
    };
  }

  // 🔥 修复：保留原有阶位数据，只补充缺失字段
  const name = rank.名称 || "凡人";
  const stage = rank.阶段 !== undefined ? rank.阶段 : "";
  const progress = validateNumber(rank.当前进度, 0, 999999999, 0);
  const required = validateNumber(rank.下一级所需, 1, 999999999, 100);

  return {
    名称: name,
    阶段: stage,
    当前进度: progress,
    下一级所需: required,
    突破描述: rank.突破描述 || getDefaultBreakthroughDescription(name, stage)
  };
}

/**
 * 修复ValuePair数据
 */
function repairValuePair(pair: any, defaultCurrent: number, defaultMax: number): { 当前: number; 上限: number } {
  if (!pair || typeof pair !== 'object') {
    return { 当前: defaultCurrent, 上限: defaultMax };
  }

  const current = validateNumber(pair.当前, 0, 999999999, defaultCurrent);
  const max = validateNumber(pair.上限, 1, 999999999, defaultMax);

  return {
    当前: Math.min(current, max), // 确保当前值不超过上限
    上限: max
  };
}

/**
 * 修复游戏时间
 */
function repairGameTime(time: any): GameTime {
  if (!time || typeof time !== 'object') {
    return { 年: 1000, 月: 1, 日: 1, 小时: 8, 分钟: 0 };
  }

  return {
    年: validateNumber(time.年, 1, 999999, 1000),
    月: validateNumber(time.月, 1, 12, 1),
    日: validateNumber(time.日, 1, 30, 1),
    小时: validateNumber(time.小时, 0, 23, 8),
    分钟: validateNumber(time.分钟, 0, 59, 0)
  };
}

/**
 * 修复物品数据
 */
function repairItem(item: Item): Item {
  const repaired = { ...item };

  // 确保基础字段
  repaired.物品ID = repaired.物品ID || `item_${Date.now()}`;
  repaired.名称 = repaired.名称 || '未命名物品';
  repaired.数量 = validateNumber(repaired.数量, 1, 999999, 1);

  // 修复品质
  if (!repaired.品质 || typeof repaired.品质 !== 'object') {
    repaired.品质 = { quality: '凡', grade: 1 };
  } else {
    const validQualities = ['凡', '黄', '玄', '地', '天', '仙', '神'];
    if (!validQualities.includes(repaired.品质.quality)) {
      repaired.品质.quality = '凡';
    }
    repaired.品质.grade = validateNumber(repaired.品质.grade, 0, 10, 1) as GradeType;
  }

  // 确保类型有效
  const validTypes = ['装备', '程序', '药剂', '材料', '其他'];
  if (!validTypes.includes(repaired.类型)) {
    repaired.类型 = '其他';
  }

  return repaired;
}

/**
 * 修复NPC数据
 */
function repairNpc(npc: NpcProfile): NpcProfile {
  const repaired = { ...npc };

  // 确保基础字段
  repaired.名字 = repaired.名字 || '无名';
  repaired.性别 = repaired.性别 || '男';

  // 年龄已自动从出生日期计算,删除年龄字段

  // 修复阶位
  repaired.阶位 = repairRank(repaired.阶位);

  // 修复初始六维
  if (!repaired.初始六维 || typeof repaired.初始六维 !== 'object') {
    repaired.初始六维 = { 体质: 5, 能源: 5, 算法: 5, 资源感知: 5, 魅力: 5, 心智: 5 };
  }

  // 修复位置
  if (!repaired.当前位置 || typeof repaired.当前位置 !== 'object') {
    repaired.当前位置 = { 描述: '霓虹城·无名区' };
  } else if (!repaired.当前位置.描述) {
    repaired.当前位置.描述 = '霓虹城·无名区';
  }

  // 修复好感度
  repaired.好感度 = validateNumber(repaired.好感度, -100, 100, 0);

  // 修复记忆
  if (!Array.isArray(repaired.记忆)) {
    repaired.记忆 = [];
  }

  // 修复背包
  if (!repaired.背包 || typeof repaired.背包 !== 'object') {
    repaired.背包 = {
      信用点: { 低额: 0, 中额: 0, 高额: 0, 最高额: 0 },
      物品: {}
    };
  }

  return repaired;
}

/**
 * 验证数字，确保在范围内
 */
function validateNumber(value: any, min: number, max: number, defaultValue: number): number {
  if (typeof value === 'number' && !isNaN(value)) {
    return Math.max(min, Math.min(max, value));
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      return Math.max(min, Math.min(max, parsed));
    }
  }
  return defaultValue;
}

/**
 * 创建默认玩家状态
 */
function createDefaultAttributes(): PlayerAttributes {
  return {
    阶位: {
      名称: '凡人',
      阶段: '',
      当前进度: 0,
      下一级所需: 100,
      突破描述: '完成基础任务，解锁初级权限'
    },
    声望: 0,
    生命值: { 当前: 100, 上限: 100 },
    电量: { 当前: 50, 上限: 50 },
    带宽: { 当前: 30, 上限: 30 },
    寿命: { 当前: 18, 上限: 80 },
  } as PlayerAttributes;
}

function createDefaultLocation(): PlayerLocation {
  return { 描述: '霓虹城·无名区', x: 5000, y: 5000 } as PlayerLocation;
}

/**
 * 创建最小可用存档
 */
function createMinimalSaveData(): SaveData {
  return createMinimalSaveDataV3();
}

function createMinimalSaveDataV3(): SaveData {
  const nowIso = new Date().toISOString();
  const time = { 年: 1000, 月: 1, 日: 1, 小时: 8, 分钟: 0 } as GameTime;
  return {
    元数据: {
      版本号: 3,
      存档ID: `save_${Date.now()}`,
      存档名: '自动存档',
      游戏版本: '0.0.0',
      创建时间: nowIso,
      更新时间: nowIso,
      游戏时长秒: 0,
      时间: time,
    },
    角色: {
      身份: {
        名字: '无名行动者',
        性别: '男',
        出生日期: { 年: 982, 月: 1, 日: 1 },
        种族: '人类',
        世界: '霓虹城' as any,
        模块阶位: '凡人' as any,
        出生: '自由人',
        改造核心: '基础核心',
        模块: [],
        初始六维: { 体质: 5, 能源: 5, 算法: 5, 资源感知: 5, 魅力: 5, 心智: 5 },
        成长六维: { 体质: 0, 能源: 0, 算法: 0, 资源感知: 0, 魅力: 0, 心智: 0 },
      },
      属性: createDefaultAttributes(),
      位置: createDefaultLocation(),
      效果: [],
      身体: { 总体状况: '', 部位: {} },
      背包: { 信用点: { 低额: 0, 中额: 0, 高额: 0, 最高额: 0 }, 物品: {} },
      装备: { 装备1: null, 装备2: null, 装备3: null, 装备4: null, 装备5: null, 装备6: null },
      程序: { 当前程序ID: null, 程序进度: {}, 程序套装: { 主修: null, 辅修: [] } },
      训练: { 训练程序: null, 训练状态: { 模式: '未训练' } },
      流派: { 流派列表: {} },
      技能: { 掌握技能: [], 装备栏: [], 冷却: {} },
    },
    社交: {
      关系: {},
      组织: null,
      事件: {
        配置: { 启用随机事件: true, 最小间隔年: 1, 最大间隔年: 10, 事件提示词: '' },
        下次事件时间: null,
        事件记录: [],
      },
      记忆: { 短期记忆: [], 中期记忆: [], 长期记忆: [], 隐式中期记忆: [] },
    },
    世界: {
      信息: {
        世界名称: '霓虹城',
        大陆信息: [],
        势力信息: [],
        地点信息: [],
        生成时间: nowIso,
        世界背景: '',
        世界纪元: '',
        特殊设定: [],
        版本: 'v1',
      },
      状态: { 环境: {}, 事件: [], 历史: [], NPC状态: {} },
    },
    系统: {
      配置: {},
      设置: {},
      缓存: { 掌握技能: [], 临时统计: {} },
      行动队列: { actions: [] },
      历史: { 叙事: [] },
      扩展: {},
      联机: { 模式: '单机', 房间ID: null, 玩家ID: null, 只读路径: ['世界'], 世界曝光: false, 冲突策略: '服务器' },
    },
  } as any;
}
