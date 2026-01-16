/**
 * @fileoverview 装备属性增幅应用系统
 * 负责在装备/卸下装备时，自动应用或移除属性加成
 */

import { get, set } from 'lodash';
import type { SaveData, AttributeBonus, Item } from '@/types/game';

function ensureAttributes(saveData: SaveData): any {
  const anySave = saveData as any;
  if (anySave.角色?.属性 && typeof anySave.角色.属性 === 'object') return anySave.角色.属性;

  anySave.角色 = anySave.角色 && typeof anySave.角色 === 'object' ? anySave.角色 : {};
  anySave.角色.属性 = {
    阶位: { 名称: '街头新人', 阶段: '', 当前进度: 0, 下一级所需: 100, 升级描述: '' },
    声望: 0,
    生命值: { 当前: 100, 上限: 100 },
    电量: { 当前: 50, 上限: 50 },
    带宽: { 当前: 10, 上限: 10 },
    寿命: { 当前: 18, 上限: 80 },
  };
  return anySave.角色.属性;
}

function resolveCharacterTarget(saveData: SaveData): { character: any } {
  const anySave = saveData as any;
  if (anySave.角色?.身份 && typeof anySave.角色.身份 === 'object') return { character: anySave.角色.身份 };
  anySave.角色 = anySave.角色 && typeof anySave.角色 === 'object' ? anySave.角色 : {};
  anySave.角色.身份 = { 成长六维: { 体质: 0, 能源: 0, 算法: 0, 资源感知: 0, 魅力: 0, 心智: 0 } };
  return { character: anySave.角色.身份 };
}

/**
 * 应用装备的属性加成到角色属性
 * @param saveData 存档数据
 * @param equipmentItemId 装备物品ID
 * @returns 是否成功应用
 */
export function applyEquipmentBonus(saveData: SaveData, equipmentItemId: string): boolean {
  try {
    const attributes = ensureAttributes(saveData);
    const { character } = resolveCharacterTarget(saveData);

    // 获取装备物品数据
    const itemMap = (saveData as any)?.角色?.背包?.物品;
    const item: Item | undefined = itemMap?.[equipmentItemId];
    if (!item || item.类型 !== '装备') {
      console.warn(`[装备增幅] 物品 ${equipmentItemId} 不是装备类型`);
      return false;
    }

    const bonus: AttributeBonus | undefined = item.装备增幅;
    if (!bonus) {
      console.log(`[装备增幅] 装备 ${item.名称} 没有属性加成`);
      return true; // 没有加成不算失败
    }

    console.log(`[装备增幅] 开始应用装备 ${item.名称} 的属性加成:`, bonus);

    // 应用生命值上限加成
    if (bonus.生命值上限 && typeof bonus.生命值上限 === 'number') {
      const current生命值 = get(attributes, '生命值', { 当前: 100, 上限: 100 });
      const new上限 = current生命值.上限 + bonus.生命值上限;
      set(attributes, '生命值.上限', new上限);
      console.log(`[装备增幅] 生命值上限: ${current生命值.上限} -> ${new上限} (+${bonus.生命值上限})`);
    }

    // 应用电量上限加成
    if (bonus.电量上限 && typeof bonus.电量上限 === 'number') {
      const current电量 = get(attributes, '电量', { 当前: 50, 上限: 50 });
      const new上限 = current电量.上限 + bonus.电量上限;
      set(attributes, '电量.上限', new上限);
      console.log(`[装备增幅] 电量上限: ${current电量.上限} -> ${new上限} (+${bonus.电量上限})`);
    }

    // 应用带宽上限加成
    if (bonus.带宽上限 && typeof bonus.带宽上限 === 'number') {
      const current带宽 = get(attributes, '带宽', { 当前: 10, 上限: 10 });
      const new上限 = current带宽.上限 + bonus.带宽上限;
      set(attributes, '带宽.上限', new上限);
      console.log(`[装备增幅] 带宽上限: ${current带宽.上限} -> ${new上限} (+${bonus.带宽上限})`);
    }

    // 应用成长六维加成
    if (bonus.成长六维) {
      const 六维属性 = ['体质', '能源', '算法', '资源感知', '魅力', '心智'] as const;
      六维属性.forEach(attr => {
        const bonusValue = bonus.成长六维?.[attr as keyof typeof bonus.成长六维];
        if (bonusValue && typeof bonusValue === 'number') {
          const currentValue = get(character, `成长六维.${attr}`, 0);
          const newValue = currentValue + bonusValue;
          set(character, `成长六维.${attr}`, newValue);
          console.log(`[装备增幅] 成长六维.${attr}: ${currentValue} -> ${newValue} (+${bonusValue})`);
        }
      });
    }

    console.log(`[装备增幅] ✅ 成功应用装备 ${item.名称} 的属性加成`);
    return true;
  } catch (error) {
    console.error(`[装备增幅] 应用装备加成失败:`, error);
    return false;
  }
}

/**
 * 移除装备的属性加成从角色属性
 * @param saveData 存档数据
 * @param equipmentItemId 装备物品ID
 * @returns 是否成功移除
 */
export function removeEquipmentBonus(saveData: SaveData, equipmentItemId: string): boolean {
  try {
    const attributes = ensureAttributes(saveData);
    const { character } = resolveCharacterTarget(saveData);

    // 获取装备物品数据
    const itemMap = (saveData as any)?.角色?.背包?.物品;
    const item: Item | undefined = itemMap?.[equipmentItemId];
    if (!item || item.类型 !== '装备') {
      console.warn(`[装备增幅] 物品 ${equipmentItemId} 不是装备类型`);
      return false;
    }

    const bonus: AttributeBonus | undefined = item.装备增幅;
    if (!bonus) {
      console.log(`[装备增幅] 装备 ${item.名称} 没有属性加成`);
      return true; // 没有加成不算失败
    }

    console.log(`[装备增幅] 开始移除装备 ${item.名称} 的属性加成:`, bonus);

    // 移除生命值上限加成
    if (bonus.生命值上限 && typeof bonus.生命值上限 === 'number') {
      const current生命值 = get(attributes, '生命值', { 当前: 100, 上限: 100 });
      const new上限 = Math.max(1, current生命值.上限 - bonus.生命值上限); // 最小为1
      set(attributes, '生命值.上限', new上限);

      // 如果当前值超过新的上限，调整当前值
      if (current生命值.当前 > new上限) {
        set(attributes, '生命值.当前', new上限);
        console.log(`[装备增幅] 生命值当前值超过新上限，已调整: ${current生命值.当前} -> ${new上限}`);
      }

      console.log(`[装备增幅] 生命值上限: ${current生命值.上限} -> ${new上限} (-${bonus.生命值上限})`);
    }

    // 移除电量上限加成
    if (bonus.电量上限 && typeof bonus.电量上限 === 'number') {
      const current电量 = get(attributes, '电量', { 当前: 50, 上限: 50 });
      const new上限 = Math.max(1, current电量.上限 - bonus.电量上限);
      set(attributes, '电量.上限', new上限);

      if (current电量.当前 > new上限) {
        set(attributes, '电量.当前', new上限);
        console.log(`[装备增幅] 电量当前值超过新上限，已调整: ${current电量.当前} -> ${new上限}`);
      }

      console.log(`[装备增幅] 电量上限: ${current电量.上限} -> ${new上限} (-${bonus.电量上限})`);
    }

    // 移除带宽上限加成
    if (bonus.带宽上限 && typeof bonus.带宽上限 === 'number') {
      const current带宽 = get(attributes, '带宽', { 当前: 10, 上限: 10 });
      const new上限 = Math.max(1, current带宽.上限 - bonus.带宽上限);
      set(attributes, '带宽.上限', new上限);

      if (current带宽.当前 > new上限) {
        set(attributes, '带宽.当前', new上限);
        console.log(`[装备增幅] 带宽当前值超过新上限，已调整: ${current带宽.当前} -> ${new上限}`);
      }

      console.log(`[装备增幅] 带宽上限: ${current带宽.上限} -> ${new上限} (-${bonus.带宽上限})`);
    }

    // 移除成长六维加成
    if (bonus.成长六维) {
      const 六维属性 = ['体质', '能源', '算法', '资源感知', '魅力', '心智'] as const;
      六维属性.forEach(attr => {
        const bonusValue = bonus.成长六维?.[attr as keyof typeof bonus.成长六维];
        if (bonusValue && typeof bonusValue === 'number') {
          const currentValue = get(character, `成长六维.${attr}`, 0);
          const newValue = Math.max(0, currentValue - bonusValue);
          set(character, `成长六维.${attr}`, newValue);
          console.log(`[装备增幅] 成长六维.${attr}: ${currentValue} -> ${newValue} (-${bonusValue})`);
        }
      });
    }

    console.log(`[装备增幅] ✅ 成功移除装备 ${item.名称} 的属性加成`);
    return true;
  } catch (error) {
    console.error(`[装备增幅] 移除装备加成失败:`, error);
    return false;
  }
}

/**
 * 重新计算所有装备的属性加成
 * 用于修复数据不一致的情况
 * @param saveData 存档数据
 */
export function recalculateAllEquipmentBonuses(saveData: SaveData): void {
  console.log('[装备增幅] 开始重新计算所有装备的属性加成...');

  try {
    const { character } = resolveCharacterTarget(saveData);

    // 1. 重置成长六维为0（清除所有装备加成）
    const emptyBonuses = { 体质: 0, 能源: 0, 算法: 0, 资源感知: 0, 魅力: 0, 心智: 0 };
    character.成长六维 = { ...emptyBonuses };

    console.log('[装备增幅] 已重置成长六维为0');

    // 2. 遍历装备槽位中的所有装备（V3：saveData.角色.装备 / saveData.角色.背包）
    const equipmentSlots = ((saveData as any).角色?.装备 ?? {}) as Record<string, unknown>;
    const inventory = (saveData as any).角色?.背包;
    if (!equipmentSlots || !inventory?.物品) {
      console.log('[装备增幅] 没有装备数据或背包数据');
      return;
    }

    const totalBonuses = {
      体质: 0,
      能源: 0,
      算法: 0,
      资源感知: 0,
      魅力: 0,
      心智: 0
    };

    // 3. 累加所有已装备的装备加成
    Object.entries(equipmentSlots).forEach(([slot, slotValue]) => {
      const itemId =
        typeof slotValue === 'string'
          ? slotValue
          : typeof slotValue === 'object' && slotValue !== null && '物品ID' in slotValue
            ? String((slotValue as any).物品ID || '')
            : '';
      if (!itemId) return;

      const item = inventory.物品[itemId];
      if (!item || item.类型 !== '装备') return;

      const bonus = item.装备增幅;
      if (!bonus || !bonus.成长六维) return;

      console.log(`[装备增幅] 处理装备 ${item.名称} (${slot}):`, bonus.成长六维);

      // 累加成长六维加成
      Object.entries(bonus.成长六维).forEach(([attr, value]) => {
        if (attr in totalBonuses && typeof value === 'number') {
          totalBonuses[attr as keyof typeof totalBonuses] += value;
        }
      });
    });

    // 4. 应用累加后的加成（V3：角色.身份.成长六维）
    character.成长六维 = totalBonuses;

    console.log('[装备增幅] ✅ 重新计算完成，最终成长六维:', totalBonuses);
  } catch (error) {
    console.error('[装备增幅] 重新计算失败:', error);
  }
}
