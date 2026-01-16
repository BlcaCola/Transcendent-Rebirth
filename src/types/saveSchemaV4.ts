// src/types/saveSchemaV4.ts

/**
 * V4 存档结构（赛博朋克主题）
 * 仅定义结构，不包含业务规则。
 */

export type GameTimeV4 = {
  年: number;
  月: number;
  日: number;
  小时: number;
  分钟: number;
};

export interface SaveDataV4 {
  元数据: {
    时间: GameTimeV4;
    版本?: string;
    [k: string]: any;
  };
  角色: {
    档案: {
      姓名: string;
      性别: '男' | '女' | '其他';
      年龄: number;
      出生日期: GameTimeV4;
      所属世界: string;
      族群: string;
      背景: string;
      模块: Array<{ 名称: string; 描述?: string }>
      | Array<{ name: string; description?: string }>;
      基础素质: {
        体格: number;
        反应: number;
        智识: number;
        幸运: number;
        魅力: number;
        意志: number;
      };
      改造素质: {
        体格: number;
        反应: number;
        智识: number;
        幸运: number;
        魅力: number;
        意志: number;
      };
      [k: string]: any;
    };
    能力: {
      等级: {
        称号: string;
        阶段?: string;
        进度?: number;
        晋升需求?: number | string;
        晋升说明?: string;
      };
      热度: number;
      [k: string]: any;
    };
    资源: {
      生命值: { 当前: number; 上限: number };
      电量: { 当前: number; 上限: number };
      带宽: { 当前: number; 上限: number };
      生理耐久: { 当前: number; 上限: number };
      [k: string]: any;
    };
    位置: {
      描述: string;
      x?: number;
      y?: number;
      信号强度?: number;
      [k: string]: any;
    };
    状态效果: Array<Record<string, any>>;
    背包: {
      信用点: number | { 低额: number; 中额: number; 高额: number; 最高额: number };
      物品: Record<string, any>;
    };
    装备: Record<string, any>;
    技能树: Record<string, any>;
    训练: Record<string, any>;
    专精树: Record<string, any>;
    技能: Record<string, any>;
    身体?: Record<string, any>;
  };
  社交: {
    关系: Record<string, any>;
    组织?: Record<string, any>;
    记忆?: Record<string, any>;
    事件?: Record<string, any>;
  };
  世界: {
    信息: Record<string, any>;
    状态?: Record<string, any>;
  };
  系统: {
    配置?: Record<string, any>;
    历史?: Record<string, any>;
    联机?: Record<string, any>;
    设置?: Record<string, any>;
  };
}
