// src/types/game.d.ts

/**
 * @fileoverview
 * 系统蓝图 - 游戏核心数据结构规范
 * 此文件定义了整个游戏存档、角色、NPC等核心数据的TypeScript类型。
 * 所有数据结构均基于最新的系统设计文档。
 */

import type { QualityType, GradeType } from '@/data/itemQuality';
import type { World, TalentTier, Origin, SpiritRoot, Talent } from './index';
export type { WorldMapConfig } from './worldMap';

// --- AI 元数据通用接口 ---
// 注意：存档落盘结构不允许出现 `_AI说明/_AI修改规则/_AI重要提醒` 等字段；
// 这些提示仅允许存在于提示词/代码内部，不进入 SaveData。
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AIMetadata {}

// --- 系统与规则（可嵌入提示与限制） ---
export interface AttributeLimitConfig {
  初始六维?: {
    每项上限: number; // 六项单项最大值（默认10）
  };
}

export interface SystemConfig extends AIMetadata {
  初始年龄?: number; // 开局年龄，用于自动计算寿命
  开局时间?: GameTime; // 开局游戏时间，用于自动计算寿命
  规则?: {
    属性上限?: AttributeLimitConfig;
    装备系统?: string;
    品质控制?: string;
  };
  提示?: string | string[]; // 可放置给AI的约束提示，随存档一并注入
  nsfwMode?: boolean; // 是否开启NSFW模式
  nsfwGenderFilter?: 'all' | 'male' | 'female'; // NSFW性别过滤
}

// --- 状态变更日志接口 ---
export type StateChange = {
  key: string;
  action: string;
  oldValue: unknown;
  newValue: unknown;
};

export interface StateChangeLog {
  before?: any;
  after?: any;
  changes: StateChange[];
  timestamp?: string;
}

// --- 记忆条目接口 ---
export interface MemoryEntry {
  id: string;
  content: string;
  timestamp: Date;
  importance: number; // 1-10
  tags: string[];
  type: 'user_action' | 'ai_response' | 'system_event' | 'summary' | 'short' | 'mid' | 'long';
  hidden?: boolean; // 是否为隐藏记忆
  convertedFrom?: 'short' | 'mid' | 'long'; // 转换来源
  category: 'combat' | 'social' | 'training' | 'exploration' | 'other';
  metadata?: {
    location?: string;
    npcs?: string[];
    items?: string[];
    skills?: string[];
  };
}

// --- 处理响应接口 ---
export interface ProcessedResponse {
  content: string;
  metadata: {
    confidence: number;
    reasoning: string[];
    memoryUpdates: MemoryEntry[];
    suggestedActions: string[];
    memoryStats?: {
      shortTermCount: number;
      midTermCount: number;
      longTermCount: number;
      hiddenMidTermCount: number;
      lastConversion?: Date;
    };
  };
}

// --- 系统规则相关类型 ---
export interface SystemCalibration {
  系统值: number;
  修正因子: number;
  基础计算: any;
  [key: string]: any;
}

// 简化的核心属性类型（仅用于系统规则内部计算）
export interface CoreAttributes {
  攻击力: number;
  防御力: number;
  感知: number;
  敏捷: number;
  资源感知: number;
  阶位加成: number;
}

// 简化的死亡状态类型（仅用于系统规则内部判定）
export interface DeathState {
  已死亡: boolean;
  死亡时间?: string;
  死亡原因?: string;
}

// 简化的系统规则类型（仅用于内部计算，不存储到 PlayerStatus）
export interface SystemCore {
  版本: string;
  角色名称: string;
  阶位等级: number;
  核心属性: CoreAttributes;
  死亡状态: DeathState;
  更新时间: string;
}

// --- 基础与通用类型 ---

export interface Rank {
  名称: string;        // 阶位名称
  阶段: string;        // 阶位阶段，如"初期"、"中期"、"后期"、"圆满"
  当前进度: number;    // 当前训练进度
  下一级所需: number;  // 升级到下一阶段所需进度
  升级描述: string;    // 升级到下一阶段的描述
}
// 阶位子阶段类型
export type RankStage = '初期' | '中期' | '后期' | '圆满' | '极境';

// 阶位子阶段定义
export interface RankStageDefinition {
  stage: RankStage;
  title: string;
  breakthrough_difficulty: '简单' | '普通' | '困难' | '极难' | '逆天';
  resource_multiplier: number; // 资源倍数（生命值、电量、带宽）
  lifespan_bonus: number; // 寿命加成
  special_abilities: string[]; // 特殊能力
}
  quality: QualityType; // 品质等级：超核、传奇、精英、专业、增强、标准
  grade: GradeType; // 品级：0-10
}


// --- 初始六维 ---

export interface InnateAttributes {
  体质: number;
  能源: number;
  算法: number;
  资源感知: number;
  魅力: number;
  心智: number;
}

/** 英文键名的初始六维，用于组件传参 */

export interface InnateAttributesEnglish {
  root_bone: number;
  spirituality: number;
  comprehension: number;
  fortune: number;
  charm: number;
  temperament: number;
}

export type AttributeKey = keyof InnateAttributesEnglish;

// --- 物品与背包 ---

/** 装备增幅或程序属性加成 */
export interface AttributeBonus {
  生命值上限?: number;
  电量上限?: number;
  带宽上限?: number;
  成长六维?: Partial<InnateAttributes>;
  [key: string]: any; // 允许其他动态属性
}

/** 程序技能（背包中程序物品的技能数组） */
export interface ProgramSkill {
  技能名称: string;
  技能描述: string;
  消耗?: string;
  熟练度要求?: number; // 达到此训练进度后解锁（0-100百分比）
  [key: string]: any; // 允许其他动态属性
}

/** 程序效果 */
export interface ProgramEffects {
  训练速度加成?: number;
  属性加成?: Partial<InnateAttributes & { [key: string]: number }>;
  特殊能力?: string[];
}

/** 物品类型 */
export type ItemType = '装备' | '程序' | '药剂' | '材料' | '其他';

/** 基础物品接口 */
export interface BaseItem {
  物品ID: string;
  名称: string;
  类型: ItemType;
  品质: ItemQuality;
  数量: number;
  已装备?: boolean; // true表示装备中/训练中，false表示未装备
  描述: string;
  可叠加?: boolean;
}

/** 装备类型物品 */
export interface EquipmentItem extends BaseItem {
  类型: '装备';
  装备增幅?: AttributeBonus;
  特殊效果?: string | AttributeBonus;
}

/** 程序类型物品 */
export interface ProgramItem extends BaseItem {
  类型: '程序';
  程序效果?: ProgramEffects;
  程序技能?: ProgramSkill[]; // ✅ 改为数组格式
  训练进度?: number; // 0-100 百分比
  训练中?: boolean; // 是否正在训练（兼容旧代码）
  已解锁技能?: string[]; // ✅ 已解锁的技能名称列表
  // 注意：新代码应使用 已装备 字段，训练中 仅为向后兼容
}

/** 消耗品/材料类型物品（药剂、材料、其他） */
export interface ConsumableItem extends BaseItem {
  类型: '药剂' | '材料' | '其他';
  使用效果?: string;
}

/** 物品的联合类型 */
export type Item = EquipmentItem | ProgramItem | ConsumableItem;


/** 训练程序引用（只存储引用，不存储完整数据） */
export interface ProgramReference {
  物品ID: string;    // 引用背包中的程序ID
  名称: string;      // 程序名称（用于快速显示）
}

/** 掌握的技能（技能数据+进度合并） */
export interface MasteredSkill {
  技能名称: string;
  技能描述: string;
  来源: string; // 来源程序名称
  消耗?: string; // 消耗说明

  // 进度数据（与技能数据合并）
  熟练度: number; // 技能熟练度
  使用次数: number; // 使用次数统计
}

export interface Inventory extends AIMetadata {
  信用点: {
    低额: number;
    中额: number;
    高额: number;
    最高额: number;
  };
  物品: Record<string, Item>; // 物品现在是对象结构，key为物品ID，value为Item对象
}

/** 程序中的技能信息 */
export interface SkillInfo {
  name: string;
  description: string;
  type: string; // 简化：统一为字符串类型
  unlockCondition: string;
  unlocked: boolean;
}

// --- 组织系统相关类型 ---

/** 组织类型 */
export type FactionType = '企业集团' | '地下组织' | '街区帮派' | '情报网络' | '商会' | '家族' | '独立联盟';

/** 组织职位 */
export type FactionPosition = '独行者' | '外围成员' | '内部成员' | '核心成员' | '继承人' | '执行官' | '顾问' | '董事' | '副掌门' | '首领';

/** 组织关系 */
export type FactionRelationship = '仇敌' | '敌对' | '冷淡' | '中立' | '友好' | '盟友' | '附庸';

/** 阶位等级 */
export type RankLevel = '街头级' | '区域级' | '城域级' | '核心级' | '主权级' | '超域级' | '星域级' | '极域级';

/** 组织成员信息 */
export interface FactionMemberInfo {
  组织名称: string;
  组织类型: FactionType;
  职位: FactionPosition;
  贡献: number;
  关系: FactionRelationship;
  声望: number;
  加入日期: string;
  描述?: string;
}

/** 组织基础信息 */
export interface FactionInfo {
  名称: string; // 组织名称
  类型: FactionType; // 组织类型
  等级: '一流' | '二流' | '三流' | '末流'; // 组织等级
  位置?: string; // 总部位置
  描述: string; // 组织描述
  特色: string[]; // 组织特色
  成员数量: FactionMemberCount; // 成员数量统计
  与玩家关系: FactionRelationship; // 与玩家的关系
  声望: number; // 玩家在该组织的声望
  可否加入: boolean; // 是否可以加入
  加入条件?: string[]; // 加入条件
  加入好处?: string[]; // 加入后的好处
  // 新增：组织领导和实力展示
  领导层?: {
    首领: string; // 首领姓名
    首领等级: string; // 如"核心级"
    副首领?: string; // 副首领姓名（如有）
    顾问数量: number; // 顾问总数
    最强等级: string; // 组织内最高阶位
  };
  // 新增：简化的势力范围信息
  势力范围?: {
    控制区域: string[]; // 控制的区域，如：["主城", "附属镇", "资源点"]
    影响范围: string; // 影响范围的简单描述，如："方圆百里"
    战略价值: number; // 战略价值 (1-10)
  };
}

/** 组织成员数量统计 */
export interface FactionMemberCount {
  总数?: number; // 总成员数
  total?: number; // 英文字段名兼容
  按阶位?: Record<RankLevel, number>; // 按阶位统计
  byRank?: Record<string, number>; // 英文字段名兼容
  按职位?: Record<FactionPosition, number>; // 按职位统计
  byPosition?: Record<string, number>; // 英文字段名兼容
}

/** 组织系统数据 */
export interface FactionSystemData extends AIMetadata {
  availableFactions: FactionInfo[]; // 可用的组织列表
  factionRelationships: Record<string, number>; // 与各组织的关系值
  factionHistory: string[]; // 组织历史记录 (修复拼写错误)
}

/** 组织系统迁移记录 */
export interface FactionMigrationRecord {
  来源版本: number;
  目标版本: number;
  时间: string;
  说明?: string;
}

/** 组织系统数据 - V2 */
export interface FactionSystemV2 extends AIMetadata {
  版本: number;
  当前组织?: string | null;
  组织档案: Record<string, WorldFaction>;
  组织成员?: Record<string, string[]>;
  组织档案库?: Record<string, any[]>;
  组织供应站?: Record<string, any[]>;
  迁移记录?: FactionMigrationRecord;
  内容状态?: Record<string, FactionContentStatus>; // 组织内容初始化状态
}

/** 组织内容初始化状态 */
export interface FactionContentStatus {
  档案库已初始化: boolean;
  供应站已初始化: boolean;
  最后更新时间?: string;
  演变次数: number; // AI随机增加内容的次数
}

/** 组织档案库程序 - 扩展版本 */
export interface FactionArchiveProgramExtended {
  id: string;
  name: string;
  quality: string;
  qualityTier: string;
  cost: number;
  description: string;
  程序效果?: string;
  阶位要求?: string;
  职位要求?: string; // 外围成员/内部成员/核心成员等
  已被兑换?: boolean;
  剩余数量?: number;
}

/** 组织供应站物品 - 扩展版本 */
export interface FactionSupplyItemExtended {
  id: string;
  name: string;
  icon: string;
  type: string;
  quality: string;
  description: string;
  cost: number;
  stock?: number;
  使用效果?: string;
  限购数量?: number;
  职位要求?: string;
  稀有度?: '普通' | '稀有' | '珍贵' | '极品';
}

// --- 流派系统 ---

/** 流派阶段定义 */
export interface ProtocolStage {
  名称: string;
  描述: string;
  突破经验: number;
}

/** 流派数据（流派定义+进度合并） */
export interface ProtocolData {
  流派名: string;
  描述: string;
  阶段列表: ProtocolStage[]; // 流派的所有阶段定义

  // 进度数据（与流派数据合并）
  是否解锁: boolean;
  当前阶段: number; // 阶段索引，0为"入门"
  当前经验: number;
  总经验: number;
}

/** 流派系统数据 */
export interface ProtocolSystem extends AIMetadata {
  流派列表: Record<string, ProtocolData>; // 以流派名称为key，数据+进度合并
}

// --- 装备 ---

/** 装备槽类型 */
export interface EquipmentSlot {
  名称: string;
  物品ID: string;
  装备特效?: string[];
  装备增幅?: {
    生命值上限?: number;
    电量上限?: number;
    带宽上限?: number;
    成长六维?: Partial<InnateAttributes>;
  };
  耐久度?: ValuePair<number>;
  品质?: ItemQuality;
}

export interface Equipment extends AIMetadata {
  装备1: string | null;
  装备2: string | null;
  装备3: string | null;
  装备4: string | null;
  装备5: string | null;
  装备6: string | null;
}

// --- 状态效果 ---

export type StatusEffectType = 'buff' | 'debuff'; // 统一小写

export interface StatusEffect {
  状态名称: string;
  类型: 'buff' | 'debuff';
  生成时间: {
    年: number;
    月: number;
    日: number;
    小时: number;
    分钟: number;
  };
  持续时间分钟: number;
  状态描述: string;
  强度?: number;
  来源?: string;
  时间?: string; // 可选：时间描述（如"3天"、"1个月"）
  剩余时间?: string; // 可选：剩余时间描述
}

// --- 角色实时状态 ---

export interface Rank {
  名称: string;        // 阶位名称
  阶段: string;        // 阶位阶段，如"初期"、"中期"、"后期"、"圆满"
  当前进度: number;    // 当前训练进度
  下一级所需: number;  // 升级到下一阶段所需进度
  升级描述: string;    // 升级到下一阶段的描述
}
// 阶位子阶段类型
export type RankStage = '初期' | '中期' | '后期' | '圆满' | '极境';

// 阶位子阶段定义
export interface RankStageDefinition {
  stage: RankStage;
  title: string;
  breakthrough_difficulty: '简单' | '普通' | '困难' | '极难' | '逆天';
  resource_multiplier: number; // 资源倍数（生命值、电量、带宽）
  lifespan_bonus: number; // 寿命加成
  special_abilities: string[]; // 特殊能力
  can_cross_rank_battle?: boolean; // 是否可越阶战斗
}

export interface RankDefinition {
  level: number;
  name: string;
  title: string;
  coreFeature: string;
  lifespan: string;
  activityScope: string;
  gapDescription: string;
  stages?: RankStageDefinition[]; // 阶位子阶段，凡人阶位没有子阶段
}



export interface PlayerStatus extends AIMetadata {
  阶位: Rank; // 阶位包含了训练进度（当前进度 = 训练当前，下一级所需 = 训练最大）
  声望: number;
  位置: {
    描述: string;
    x?: number; // 经度坐标 (Longitude, 通常 100-115)
    y?: number; // 纬度坐标 (Latitude, 通常 25-35)
    信号强度?: number; // 当前位置的信号强度，1-100，影响训练速度
  };
  生命值: ValuePair<number>;
  电量: ValuePair<number>;
  带宽: ValuePair<number>;
  寿命: ValuePair<number>;
  状态效果?: StatusEffect[];
  组织信息?: FactionMemberInfo;
  事件系统?: EventSystem;
  // 注意: 玩家的NSFW数据存储在 SaveData.身体部位开发 中，不使用 PrivacyProfile
}

// --- MECE短路径：拆分“属性/位置/效果” ---
// 属性：动态数值（阶位/生命值/电量/带宽/寿命/声望等）
export type PlayerAttributes = Pick<PlayerStatus, '阶位' | '声望' | '生命值' | '电量' | '带宽' | '寿命'>;
// 位置：空间信息（从 PlayerStatus.位置 提取）
export type PlayerLocation = PlayerStatus['位置'];

/** 用于UI组件显示的角色状态信息 */
export interface CharacterStatusForDisplay {
  name: string;
  rank: Rank;
  age: number; // 来自寿命的当前值
  hp: string;
  mana: string;
  spirit: string;
  lifespan: ValuePair<number>;
  声望: number;
  training_exp: number;
  training_exp_max: number;
  root_bone: number;
  spirituality: number;
  comprehension: number;
  fortune: number;
  charm: number;
  temperament: number;
}

// --- 世界数据类型定义 ---

/** 世界大陆信息 */
export interface WorldContinent {
  名称: string;
  name?: string; // 兼容英文名
  描述: string;
  地理特征?: string[];
  科技生态?: string;
  气候?: string;
  天然屏障?: string[];
  大洲边界?: { x: number; y: number }[];
  主要势力?: (string | number)[]; // 兼容id和名称
  factions?: (string | number)[]; // 兼容英文名
}

/** 世界势力信息 - 统一的组织/势力数据结构 */
export interface WorldFaction {
  id?: string | number; // 增加可选的id字段
  名称: string;
  类型: '企业集团' | '地下组织' | '街区帮派' | '情报网络' | '商会' | '家族' | '独立联盟' | string;
  等级: '超级' | '一流' | '二流' | '三流' | string;
  所在大洲?: string; // 增加可选的所在大洲字段
  位置?: string | { x: number; y: number }; // 支持字符串描述或坐标
  势力范围?: string[] | { x: number; y: number }[]; // 支持字符串数组或坐标数组
  描述: string;
  特色: string | string[]; // 支持字符串或字符串数组
  与玩家关系?: '敌对' | '中立' | '友好' | '盟友' | string;
  声望值?: number;

  // 组织系统扩展字段 - 只对组织类型势力有效
  特色列表?: string[]; // 组织特色列表，替代 特色 字符串

  // 组织成员统计
  成员数量?: FactionMemberCount;

  // 组织领导层 - 新增必需字段
  领导层?: {
    首领: string;
    首领等级: string; // 如"核心级"
    副首领?: string;
    首席分析师?: string;
    首席工程师?: string;
    董事?: string;
    董事等级?: string;
    顾问数量?: number; // 组织顾问数量
    最强等级: string; // 组织内最高阶位
    综合战力?: number; // 1-100的综合战力评估
    核心成员数?: number;
    内部成员数?: number;
    外围成员数?: number;
  };

  // 势力范围详情
  势力范围详情?: {
    控制区域?: string[]; // 替代 势力范围 字符串数组
    影响范围?: string;
    战略价值?: number; // 1-10
  };

  // 加入相关
  可否加入?: boolean;
  加入条件?: string[];
  加入好处?: string[];
}

/** 世界地点信息 */
export interface WorldLocation {
  名称: string;
  类型: '城区' | '组织' | '禁区' | '险地' | '商会' | '黑市' | '避难所' | string;
  位置: string;
  coordinates?: { x: number; y: number }; // 原始坐标数据
  描述: string;
  特色: string;
  安全等级: '安全' | '较安全' | '危险' | '极危险' | string;
  开放状态: '开放' | '限制' | '封闭' | '未发现' | string;
  相关势力?: string[];
  特殊功能?: string[];
}

/** 世界生成信息 */
export interface WorldGenerationInfo {
  生成时间: string;
  世界背景: string;
  世界纪元: string;
  特殊设定: string[];
  版本: string;
}

/** 完整的世界信息数据结构 */
export interface WorldInfo {
  世界名称: string;
  大陆信息: WorldContinent[];
  continents?: WorldContinent[]; // 兼容旧数据
  势力信息: WorldFaction[];
  地点信息: WorldLocation[];
  地图配置?: WorldMapConfig; // 新增地图配置
  // 从 WorldGenerationInfo 扁平化
  生成时间: string;
  世界背景: string;
  世界纪元: string;
  特殊设定: string[];
  版本: string;
}

// --- 事件系统 ---

/** 事件类型（可扩展） */
export type EventType =
  | '组织冲突'
  | '世界变革'
  | '稀有资源出现'
  | '禁区现世'
  | '人物风波'
  | '势力变动'
  | '天灾人祸'
  | string;

/** 事件记录 */
export interface GameEvent {
  事件ID: string;
  事件名称: string;
  事件类型: EventType;
  事件描述: string;
  影响等级?: '轻微' | '中等' | '重大' | '灾难' | string;
  影响范围?: string;
  相关人物?: string[];
  相关势力?: string[];
  事件来源: '随机' | '玩家影响' | '系统' | string;
  发生时间: GameTime;
}

/** 事件系统配置 */
export interface EventSystemConfig {
  启用随机事件: boolean;
  最小间隔年: number;
  最大间隔年: number;
  事件提示词: string;
}

/** 事件系统（统一管理世界事件） */
export interface EventSystem {
  配置: EventSystemConfig;
  下次事件时间: GameTime | null;
  事件记录: GameEvent[];
}

// --- 世界地图 ---

// --- NPC 模块 ---

// TavernCommand is now imported from AIGameMaster.d.ts to avoid conflicts

/** 身体部位开发数据 */
export interface BodyPartDevelopment {
  部位名称: string; // 如：胸部、小穴、菊穴、嘴唇、耳朵等
  敏感度: number; // 0-100
  开发度: number; // 0-100（统一使用"开发度"，与AI提示词保持一致）
  特殊印记?: string; // 如：「已调教」「极度敏感」「可喷奶」、「合欢莲印」等
  特征描述: string; // 部位的详细描述，如："娇小粉嫩，轻触即颤"、"紧致温润，吸附感强"
}

/** 玩家身体部位开发数据 - 简化结构 */
export interface PlayerBodyPart {
  特征描述: string;
}

/** 玩家身体详细数据 (NSFW/Tavern Only) */
export interface BodyStats {
  // 基础体格
  身高: number; // cm
  体重: number; // kg
  体脂率?: number; // %

  // 三围数据
  三围: {
    胸围: number; // cm
    腰围: number; // cm
    臀围: number; // cm
  };

  // 性征描述
  胸部描述?: string; // 罩杯、形状等
  私处描述?: string; // 女性私处/特殊部位
  生殖器描述?: string; // 尺寸、形状、特征

  // 外观细节
  肤色?: string;
  发色?: string;
  瞳色?: string;
  纹身与印记?: string[];
  穿刺?: string[];

  // 敏感与开发
  敏感点?: string[];
  开发度?: Record<string, number>; // 部位 -> 0-100

  // 其他
  其它?: Record<string, any>;
}

/** 统一的私密信息模块 (NSFW) */
export interface PrivacyProfile {
  是否为处女: boolean;
  身体部位: BodyPartDevelopment[];
  性格倾向: string;
  性取向: string;
  性癖好: string[];
  性渴望程度: number;
  当前性状态: string;
  体液分泌状态: string;
  性交总次数: number;
  性伴侣名单: string[];
  最近一次性行为时间: string;
  特殊体质: string[];
}

/** NPC核心档案 - 精简高效的数据结构 */
export interface NpcProfile {
  // === 核心身份 ===
  名字: string;
  性别: '男' | '女' | '其他';
  出生日期: { 年: number; 月: number; 日: number; 小时?: number; 分钟?: number }; // 出生日期（用于自动计算年龄）
  种族?: string; // 如：人族、妖族、魔族
  出生: string | { 名称?: string; 描述?: string }; // 出生背景，如："焚天林氏遗孤"（必填）
  外貌描述: string; // AI生成的外貌描述，必填
  性格特征: string[]; // 如：['冷静', '谨慎', '好色']

  // === 训练属性 ===
  阶位: Rank;
  改造核心: CharacterBaseInfo['改造核心'];
  模块: CharacterBaseInfo['模块']; // 模块列表
  初始六维: InnateAttributes; // NPC只有一个六维字段，不分初始/最终

  // === 社交关系 ===
  与玩家关系: string; // 如：搭档、同事、朋友、敌人、陌生人
  好感度: number; // -100 到 100
  当前位置: {
    描述: string;
    x?: number; // 经度坐标 (Longitude, 通常 100-115)
    y?: number; // 纬度坐标 (Latitude, 通常 25-35)
    信号强度?: number; // 当前位置的信号强度，1-100
  };
  势力归属?: string;

  // === 人格系统 ===
  人格底线: string[] | string; // 如：['背叛信任', '伤害亲友', '公开侮辱', '强迫违背意愿']，触犯后好感度断崖式下跌

  // === 记忆系统 ===
  记忆: Array<{ 时间: string; 事件: string } | string>; // 兼容新旧格式：对象或纯字符串
  记忆总结?: string[];

  // === 实时状态（用 set 直接替换）===
  当前外貌状态: string; // 如："脸颊微红，眼神迷离" / "衣衫整洁，神态自然"
  当前内心想法: string; // 如："在思考什么..." / "对xxx感到好奇"

  // === 资产物品 ===
  背包: {
    信用点: { 低额: number; 中额: number; 高额: number; 最高额: number };
    物品: Record<string, Item>;
  };

  // === 可选模块 ===
  私密信息?: PrivacyProfile; // 仅NSFW模式下存在
  实时关注: boolean; // 标记为关注的NPC会在AI回合中主动更新

  // === 旧数据兼容字段 ===
  外貌?: string;
  性格?: string;
}


// --- 记忆模块 ---

export interface Memory extends AIMetadata {
  短期记忆?: string[]; // 最近的对话、事件的完整记录
  中期记忆: string[]; // 对短期记忆的总结，关键信息点
  长期记忆: string[]; // 核心人设、世界观、重大事件的固化记忆
  隐式中期记忆?: string[]; // 隐式中期记忆数组，与短期记忆同步增长，溢出时转入真正的中期记忆
}

// --- 游戏时间 ---

export interface GameTime extends AIMetadata {
  年: number;
  月: number;
  日: number;
  小时: number;
  分钟: number;
}

// --- 存档数据核心 ---

export interface GameMessage {
  type: 'user' | 'ai' | 'system' | 'player' | 'gm';
  content: string;
  time: string;
  stateChanges?: StateChangeLog; // 状态变更记录
  actionOptions: string[]; // 行动选项（必填）
  metadata?: {
    commands?: any[];
  };
}

// 保持人物关系为严格的字典，键为NPC名称/ID，值为NpcProfile

// --- 单个存档槽位 ---

export interface SaveSlot {
  游戏时长?: number; // 游戏时长（秒）
  角色名字?: string; // 角色名字
  位置?: string; // 当前位置
  训练进度?: number; // 训练进度
  世界地图?: WorldMap;
  存档数据?: any | null;
}

// --- 角色基础信息 (静态) ---

export interface CharacterBaseInfo extends AIMetadata {
  名字: string;
  性别: '男' | '女' | '其他' | string;
  出生日期: { 年: number; 月: number; 日: number; 小时?: number; 分钟?: number }; // 出生日期（用于自动计算年龄）
  种族?: string; // 添加种族字段
  阶位?: string; // NPC当前阶位
  世界: World;
  模块阶位: TalentTier;
  出生: Origin | string;
  改造核心: SpiritRoot | string;
  模块: Talent[];
  初始六维: InnateAttributes;
  成长六维: InnateAttributes; // 成长获得的六维加成（装备、流派等），开局默认全为0
  创建时间?: string; // 添加创建时间字段
  描述?: string; // 添加描述字段
}


// --- 角色档案 (动静合一) ---

export interface CharacterProfile {
  模式: '单机' | '联机';
  // 角色身份（静态信息，用于列表展示/导出）
  角色: CharacterBaseInfo;
  // 🔥 统一结构：单机和联机都使用存档列表
  // 单机模式：可以有多个存档（"存档1", "存档2", ...）
  // 联机模式：只有一个存档（通常key为"云端修行"或"online"）
  存档列表: Record<string, SaveSlot & {
    // 联机模式专属字段（单机模式下为undefined）
    云端同步信息?: {
      最后同步: string;
      版本: number;
      需要同步: boolean;
      后端创建失败?: boolean; // 标记后端创建是否失败
    };
  }>;

  // 🔥 废弃字段：为了兼容旧数据，保留但标记为废弃
  /** @deprecated 请使用存档列表，此字段仅用于兼容旧版本联机存档 */
  存档?: SaveSlot & {
    云端同步信息?: {
      最后同步: string;
      版本: number;
      需要同步: boolean;
      后端创建失败?: boolean;
    };
  };
}

// --- 动作队列系统 ---

/** 动作类型 */
export type QueueActionType =
  | 'item_use'      // 使用物品
  | 'item_equip'    // 装备物品
  | 'item_discard'  // 丢弃物品
  | 'item_train'    // 训练程序
  | 'npc_interact'  // NPC互动
  | 'custom';       // 自定义动作

/** 动作撤回数据 */
export interface ActionUndoData {
  type: QueueActionType;
  itemId?: string;
  itemName?: string;
  quantity?: number;
  originalQuantity?: number;
  [key: string]: any; // 其他撤回需要的数据
}

/** 单个动作项 */
export interface QueueActionItem {
  id: string;
  text: string; // 显示给用户的文本
  type: QueueActionType;
  canUndo: boolean; // 是否可以撤回
  undoData?: ActionUndoData; // 撤回时需要的数据
  timestamp: number;
}

/** 动作队列 - 用于收集用户操作的文本描述 */
export interface ActionQueue {
  actions: QueueActionItem[]; // 动作列表
}

// --- 顶层本地存储结构 ---

export interface LocalStorageRoot {
  当前激活存档: {
    角色ID: string;
    存档槽位: string; // e.g., "存档1" for single player, or a default key for online
  } | null;
  角色列表: Record<string, CharacterProfile>; // 以角色唯一ID (char_1001) 为key
}

export type Continent = WorldContinent;
export type Location = WorldLocation;

// --- 训练速度系统 ---

/** 训练速度影响因子 */
export interface TrainingSpeedFactors {
  信号强度系数: number;    // 0.1 - 2.0，基于位置信号强度(1-100)
  初始六维系数: number;    // 0.5 - 2.0，基于初始六维综合值
  成长六维系数: number;    // 0.0 - 0.6，基于成长六维综合值（额外加成）
  状态效果系数: number;    // 0.5 - 2.0，基于buff/debuff
  程序加成系数: number;    // 0.0 - 1.0，基于当前训练程序
  环境加成系数: number;    // 0.0 - 0.5，避难所、组织中心等
}

/** 训练速度计算结果 */
export interface TrainingSpeedResult {
  基础速度: number;        // 每回合基础进度增加
  综合系数: number;        // 所有因子的综合乘数
  最终速度: number;        // 基础速度 * 综合系数
  预计升级时间: string;    // 预计到达下一阶段的游戏时间
  因子详情: TrainingSpeedFactors;
}

/** 阶位升级时间标准（游戏时间） */
export interface RankUpgradeTime {
  阶位名称: string;
  阶段: string;
  最短月数: number;        // 最短升级时间（月）
  标准月数: number;        // 标准升级时间（月）
  最长月数: number;        // 最长升级时间（月）
  // 兼容旧格式
  最短时间?: string;       // 如 "1年"
  标准时间?: string;       // 如 "5年"
  最长时间?: string;       // 如 "20年"
  升级难度?: '简单' | '普通' | '困难' | '极难' | '逆天';
}

// --- 六维系统约束 ---

/** 六维约束配置 */
export interface SixDimConstraints {
  初始六维: {
    每项上限: 10;          // 固定值，不可修改
    总分上限: 60;          // 6项 × 10
    对加成权重: 0.7;       // 占总加成的70%
  };
  成长六维: {
    每项上限: 20;          // 单项最大值
    单次增加上限: 3;       // 每次最多增加1-3点（极稀有资源可达5点）
    单次减少上限: 5;       // 每次最多减少1-5点（惩罚）
    对加成权重: 0.3;       // 占总加成的30%
    获取方式: string[];    // ['装备', '模块', '药剂', '资源事件', '流派研习']
  };
}

/** 六维加成结果 */
export interface SixDimBonus {
  训练速度加成: number;    // 百分比 0-100
  战斗力加成: number;      // 百分比 0-100
  感知范围加成: number;    // 百分比 0-100
  交际能力加成: number;    // 百分比 0-100
  资源概率加成: number;    // 百分比 0-100
}

/** 六维权重配置 */
export interface SixDimWeights {
  体质: number;
  能源: number;
  算法: number;
  心智: number;
  资源感知: number;
  魅力: number;
}
