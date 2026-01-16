import type { InnateAttributes, Item, Equipment, SaveData } from '@/types/game';
import type { Talent } from '../types/index';
import { LOCAL_TALENTS } from '../data/creationData';

/**
 * 中文键名到英文键名的映射（用于组件传参）
 */
const CHINESE_TO_ENGLISH_MAP: Record<string, string> = {
  '体质': 'root_bone',
  '能源': 'spirituality',
  '算法': 'comprehension',
  '资源感知': 'fortune',
  '魅力': 'charm',
  '心智': 'temperament'
};

/**
 * 计算装备提供的成长六维加成
 */
export function calculateEquipmentBonuses(equipment: Equipment, inventory: SaveData['背包']): InnateAttributes {
  const bonuses: InnateAttributes = {
    体质: 0,
    能源: 0,
    算法: 0,
    资源感知: 0,
    魅力: 0,
    心智: 0
  };

  console.log('[装备加成计算] 开始计算装备加成');
  console.log('[装备加成计算] 装备栏数据:', equipment);
  console.log('[装备加成计算] 背包物品数据:', inventory?.物品);

  // 遍历装备栏中的每个装备槽位
  Object.entries(equipment).forEach(([slot, itemId]) => {
    console.log(`[装备加成计算] 检查槽位 ${slot}, itemId: ${itemId}`);

    if (itemId && inventory.物品 && inventory.物品[itemId]) {
      const item: Item = inventory.物品[itemId];
      console.log(`[装备加成计算] 找到物品:`, item);

      // 检查装备是否有成长六维加成
      if (item.类型 === '装备' && item.装备增幅?.成长六维) {
        console.log(`[装备加成计算] 物品 ${item.名称} 有装备增幅:`, item.装备增幅);
        const sixDimBonuses = item.装备增幅.成长六维;

        Object.entries(sixDimBonuses).forEach(([attr, value]) => {
          if (attr in bonuses) {
            const numericValue = Number(value);
            if (!isNaN(numericValue)) {
              console.log(`[装备加成计算] 添加属性加成: ${attr} +${numericValue} (原始值: ${value})`);
              (bonuses as InnateAttributes)[attr as keyof InnateAttributes] += numericValue;
            } else {
              console.warn(`[装备加成计算] 属性 ${attr} 的值 "${value}" 不是一个有效的数字，已忽略。物品: ${item.名称}`);
            }
          } else {
            console.warn(`[装备加成计算] 发现未知的成长六维属性 "${attr}"，已忽略。物品: ${item.名称}`);
          }
        });
      } else {
        console.log(`[装备加成计算] 物品 ${item.名称} 没有装备增幅或成长六维属性`);
      }
    } else {
      console.log(`[装备加成计算] 槽位 ${slot} 为空或物品不存在`);
    }
  });

  console.log('[装备加成计算] 最终装备加成:', bonuses);
  return bonuses;
}

/**
 * 从角色存档数据中计算模块提供的成长六维加成
 */
export function calculateModuleBonusesFromCharacter(saveData: SaveData): InnateAttributes {
  const bonuses: InnateAttributes = {
    体质: 0,
    能源: 0,
    算法: 0,
    资源感知: 0,
    魅力: 0,
    心智: 0
  };

  // 获取角色的模块名称列表（V3：角色.身份）
  const character = (saveData as any).角色?.身份 ?? null;
  const characterModules = character?.模块 || [];

  // 提取模块名称，兼容字符串数组和对象数组两种格式
  const characterModuleNames: string[] = characterModules.map((module: any) => {
    if (typeof module === 'string') {
      return module; // 简单字符串格式
    } else if (module && typeof module === 'object' && module.名称) {
      return module.名称; // 对象格式，提取名称字段
    }
    return null;
  }).filter(Boolean);

  // 遍历角色的每个模块
  characterModules.forEach((module: any) => {
    let moduleData: Talent | undefined;
    let moduleName: string;

    if (typeof module === 'string') {
      moduleName = module;
      // 在LOCAL_TALENTS中查找对应的模块数据
      moduleData = LOCAL_TALENTS.find(t => t.name === moduleName);
    } else if (module && typeof module === 'object') {
      moduleName = module.名称 || '';
      // 先尝试在LOCAL_TALENTS中查找
      moduleData = LOCAL_TALENTS.find(t => t.name === moduleName);

      // 如果找不到预定义模块，但模块对象本身有effects，直接使用
      if (!moduleData && module.effects) {
        moduleData = {
          id: 0,
          name: moduleName,
          description: module.描述 || '',
          talent_cost: 0,
          rarity: 1,
          effects: module.effects
        };
      }
    }

    if (moduleData && moduleData.effects) {
      // 使用现有的calculateTalentBonuses函数处理单个模块
      const singleModuleBonuses = calculateTalentBonuses([moduleData]);

      // 累加到总bonuses中
      Object.keys(bonuses).forEach(attr => {
        bonuses[attr as keyof InnateAttributes] += singleModuleBonuses[attr as keyof InnateAttributes];
      });
    }
  });

  return bonuses;
}

/**
 * 计算模块提供的成长六维加成
 */
export function calculateTalentBonuses(talents: Talent[]): InnateAttributes {
  const bonuses: InnateAttributes = {
    体质: 0,
    能源: 0,
    算法: 0,
    资源感知: 0,
    魅力: 0,
    心智: 0
  };

  talents.forEach(talent => {
    if (talent.effects && Array.isArray(talent.effects)) {
      talent.effects.forEach(effect => {
        // 如果是字符串，跳过（字符串描述格式不参与属性计算）
        if (typeof effect === 'string') return;

        // 支持中文格式："成长六维"
        if (effect.类型 === '成长六维') {
          const target = effect.目标;
          const value = Number(effect.数值) || 0;

          // 将目标属性名转换为中文键名
          let chineseAttr: string | undefined = target;
          if (target === '带宽') chineseAttr = '算法'; // 带宽映射到算法
          if (target === '惟性') chineseAttr = '算法'; // 纠错
          if (target === '体质') chineseAttr = '体质';
          if (target === '敏捷') chineseAttr = '能源';

          if (chineseAttr && chineseAttr in bonuses) {
            (bonuses as InnateAttributes)[chineseAttr as keyof InnateAttributes] += value;
          }
        }

        // 支持英文格式：后端API格式（如果effect有这些属性）
        if ('type' in effect && effect.type === 'ATTRIBUTE_MODIFIER') {
          const target = 'target' in effect ? effect.target : undefined;
          const value = 'value' in effect ? Number(effect.value) || 0 : 0;

          if (!target) return;

          // 英文属性名到中文映射
          const englishToChinese: Record<string, string> = {
            'STR': '体质',     // 力量 -> 体质
            'CON': '体质',     // 体质 -> 体质
            'DEX': '能源',     // 敏捷 -> 能源
            'INT': '算法',     // 智力 -> 算法
            'SPI': '心智',     // 心智 -> 心智
            'LUK': '资源感知', // 运气 -> 资源感知
          };

          const chineseAttr = englishToChinese[target as string] as keyof InnateAttributes;
          if (chineseAttr && chineseAttr in bonuses) {
            bonuses[chineseAttr] += value;
          }
        }
      });
    }
  });

  return bonuses;
}

/**
 * 计算已装备模块提供的属性加成
 */
export function calculateProgramBonuses(saveData: SaveData): InnateAttributes {
  const bonuses: InnateAttributes = { 体质: 0, 能源: 0, 算法: 0, 资源感知: 0, 魅力: 0, 心智: 0 };

  const itemsMap = (saveData as any)?.角色?.背包?.物品 ?? (saveData as any)?.背包?.物品;
  if (!itemsMap) {
    return bonuses;
  }

  // 查找已装备的程序
  const items = (itemsMap ?? {}) as Record<string, Item>;
  const equippedProgram = Object.values(items).find((item) => item.类型 === '程序' && item.已装备 === true);

  if (equippedProgram && equippedProgram.类型 === '程序' && equippedProgram.程序效果?.属性加成) {
    const attributeBonuses = equippedProgram.程序效果.属性加成;
    for (const key in attributeBonuses) {
      if (key in bonuses) {
        bonuses[key as keyof InnateAttributes] += attributeBonuses[key as keyof InnateAttributes] || 0;
      }
    }
  }

  return bonuses;
}

/**
 * 计算最终的六维属性（初始+成长）
 */
export function calculateFinalAttributes(
  innateAttributes: InnateAttributes,
  saveData: SaveData
): {
  初始六维: InnateAttributes,
  成长六维: InnateAttributes,
  最终六维: InnateAttributes
} {
  // 🔥 [BUG修复] 动态计算成长六维，确保装备和模块加成正确显示
  // 1. 从存档读取基础成长六维（可能包含永久加成）
  const character = (saveData as any).角色?.身份 ?? null;
  const storedAcquiredAttributes = character?.成长六维 || {
    体质: 0, 能源: 0, 算法: 0, 资源感知: 0, 魅力: 0, 心智: 0
  };

  // 2. 计算装备加成（实时计算，确保准确）
  const equipmentState = (saveData as any).角色?.装备 ?? null;
  const inventoryState = (saveData as any).角色?.背包 ?? null;
  const equipmentBonuses = calculateEquipmentBonuses(equipmentState, inventoryState);

  // 3. 计算模块加成
  const talentBonuses = calculateModuleBonusesFromCharacter(saveData);

  // 4. 合并所有后天加成
  const totalAcquiredAttributes: InnateAttributes = {
    体质: storedAcquiredAttributes.体质 + equipmentBonuses.体质 + talentBonuses.体质,
    能源: storedAcquiredAttributes.能源 + equipmentBonuses.能源 + talentBonuses.能源,
    算法: storedAcquiredAttributes.算法 + equipmentBonuses.算法 + talentBonuses.算法,
    资源感知: storedAcquiredAttributes.资源感知 + equipmentBonuses.资源感知 + talentBonuses.资源感知,
    魅力: storedAcquiredAttributes.魅力 + equipmentBonuses.魅力 + talentBonuses.魅力,
    心智: storedAcquiredAttributes.心智 + equipmentBonuses.心智 + talentBonuses.心智
  };

  // 5. 计算最终属性（初始 + 成长）
  const finalAttributes: InnateAttributes = {
    体质: innateAttributes.体质 + totalAcquiredAttributes.体质,
    能源: innateAttributes.能源 + totalAcquiredAttributes.能源,
    算法: innateAttributes.算法 + totalAcquiredAttributes.算法,
    资源感知: innateAttributes.资源感知 + totalAcquiredAttributes.资源感知,
    魅力: innateAttributes.魅力 + totalAcquiredAttributes.魅力,
    心智: innateAttributes.心智 + totalAcquiredAttributes.心智,
  };

  return {
    初始六维: innateAttributes,
    成长六维: totalAcquiredAttributes,
    最终六维: finalAttributes
  };
}

/**
 * 转换中文属性键名为英文（用于组件传参）
 */
export function convertToEnglishAttributes(chineseAttrs: InnateAttributes): Record<string, number> {
  const englishAttrs: Record<string, number> = {};

  Object.entries(chineseAttrs).forEach(([chineseKey, value]) => {
    const englishKey = CHINESE_TO_ENGLISH_MAP[chineseKey];
    if (englishKey) {
      englishAttrs[englishKey] = value;
    }
  });

  return englishAttrs;
}

/**
 * 获取属性值的描述文字
 */
export function getAttributeDescription(attributeName: string, value: number): string {
  const descriptions: Record<string, Record<number, string>> = {
    体质: {
      0: "羸弱不堪", 1: "体弱多病", 2: "身体孱弱", 3: "体质一般",
      4: "身体健康", 5: "体质不错", 6: "身强体壮", 7: "筋骨强健",
      8: "体魄过人", 9: "天生神力", 10: "金刚不坏"
    },
    能源: {
      0: "信号不显", 1: "感应微弱", 2: "感应较低", 3: "感应一般",
      4: "感应尚可", 5: "感应不错", 6: "感应敏锐", 7: "感应超群",
      8: "感应过人", 9: "感应绝佳", 10: "神经共鸣"
    },
    算法: {
      0: "算法极差", 1: "算法低效", 2: "算法较差", 3: "算法一般",
      4: "算法尚可", 5: "算法不错", 6: "算法敏锐", 7: "算法超群",
      8: "算法过人", 9: "算法绝佳", 10: "极速迭代"
    },
    资源感知: {
      0: "厄运缠身", 1: "运气极差", 2: "运气较差", 3: "运气一般",
      4: "运气尚可", 5: "运气不错", 6: "运气颇佳", 7: "运气极好",
      8: "好运常在", 9: "运势爆棚", 10: "天选之人"
    },
    魅力: {
      0: "面目可憎", 1: "其貌不扬", 2: "容貌平平", 3: "容貌一般",
      4: "容貌尚可", 5: "容貌不错", 6: "容貌出众", 7: "美貌动人",
      8: "惊艳全场", 9: "传奇颜值", 10: "完美颜值"
    },
    心智: {
      0: "心智不稳", 1: "意志薄弱", 2: "心智较差", 3: "心智一般",
      4: "心智尚可", 5: "心智不错", 6: "意志稳固", 7: "意志坚韧",
      8: "意志如铁", 9: "意志不移", 10: "意志圆熟"
    }
  };

  if (attributeName in descriptions) {
    const attrDescriptions = descriptions[attributeName];
    if (value in attrDescriptions) {
      return attrDescriptions[value];
    }
  }

  return `未知等级(${value})`;
}
