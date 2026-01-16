/**
 * 此文件定义了与 AI Game Master (游戏主控) 交互的核心数据结构。
 * 它是整个动态交互系统的“系统规则”。
 * 基于《超凡新生·AI交互完全参考书》 v1.0.0 系统定稿
 */

// =======================================================================
//                           核心：系统指令
// =======================================================================

/**
 * 定义单条酒馆变量操作指令的结构。
 */
export interface TavernCommand {
  action: "set" | "add" | "delete" | "push" | "pull";
  key: string; // 支持点状路径, e.g., "character.identity.age"
  value?: unknown;
  scope?: "global" | "chat" | "character" | "message"; // 可选字段，实际不使用
}

// =======================================================================
//                           核心：角色与物品定义
// =======================================================================


/**
 * 角色/NPC 完整数据结构 (Ultimate Version)
 * 根据《参考书》第二章定义
 */
export interface GameCharacter {
  // ==================== 基础信息 ====================
  identity: {
    name: string;
    title?: string;
    age: number;
    apparent_age: number;
    gender: string;
    description: string;
  };

  // ==================== 阶位 ====================
  rank: {
    title: string;
    progress: number;
    lifespan_remaining: number;
    upgrade_bottleneck?: string;
  };

  // ==================== 六维属性 ====================
  attributes: {
    STR: number; // 力量
    CON: number; // 体质
    DEX: number; // 身法
    INT: number; // 算法
    SPI: number; // 心智
    LUK: number; // 资源感知
  };

  // ==================== 三大资源 ====================
  resources: {
    hp: { current: number; max: number };      // 生命值
    energy: { current: number; max: number };  // 电量
    bandwidth: { current: number; max: number }; // 带宽
  };

  // ==================== 模块资质 ====================
  modules: {
    origin: {
      name: string;
      effects: string[];
    };
    augmentCore: {
      name: string;
      quality: string;
      attributes: string[];
    };
    physique?: {
      name: string;
      effects: string[];
    };
    modules: Array<{
      name: string;
      type: string;
      effects: string[];
    }>;
  };

  // ==================== 技能专长 ====================
  skills: {
    [key: string]: { // 动态支持多种技艺
      level: number;
      rank: string;
      [key: string]: any;
    };
  };

  // ==================== 程序装备 ====================
  program_loadout: {
    main_program?: {
      name: string;
      rank: string;
      proficiency: number;
      special_effects: string[];
    };
    combat_programs?: Array<{
      name: string;
      type: string;
      cost: number;
      cooldown: number;
    }>;
    auxiliary_programs?: string[];
  };

  equipment: {
    weapon?: Item;
    armor?: Item;
    accessories: Item[];
    treasures: Item[];
    consumables: Item[];
  };

  // ==================== 社交关系 ====================
  social: {
    faction?: string;
    职位?: string;
    master?: string;
    disciples?: string[];
    dao_companion?: string;
    relationships: Record<string, {
      value: number;
      type: string;
    }>;
    声望: Record<string, number>;
  };

  // ==================== 隐藏状态 ====================
  hidden_state: {
    karma: {
      righteous: number;
      demonic: number;
      heavenly_favor: number;
    };
    dao_heart: {
      stability: number;
      demons: string[];
      enlightenment: number;
    };
    special_marks: string[];
  };

  // ==================== 当前状态 ====================
  status: {
    conditions: string[];
    location: string;
    activity: string;
    mood?: string; // 心情，可选
  };
}


// =======================================================================
//                           核心：AI请求与响应
// =======================================================================

/**
 * 发送给 AI Game Master 的结构化请求对象 (系统请求)。
 * 它现在直接使用完整的角色数据结构。
 */
export interface GM_Request {
  /** 完整的角色数据 */
  character: GameCharacter;
  /** 完整的世界状态 */
  world: {
    lorebook: string;
    mapInfo: any;
    time: string;
  };
  /** 记忆模块 */
  memory: {
    short_term: string[];
    mid_term: string[];
    long_term: string[];
  };
}

/**
 * AI Game Master 返回的结构化响应对象 (系统响应)。
 */
export interface GM_Response {
  /** AI生成的主要叙事内容，用于展示给用户。也作为短期记忆存储 */
  text: string;
  /**
   * 一个包含所有状态变更指令的数组。
   * 前端需要解析并执行这些指令。
   */
  tavern_commands?: TavernCommand[];
  /** 新增：用于承载关键记忆的烙印，将被注入到中期记忆中。 */
  mid_term_memory?: string;
  /** 短期记忆（别名，指向text字段） */
  short_term_memory?: string;
  /** 新增：用于承载AI返回的结构化数据，例如生成的物品、角色等。 */
  json?: any;
  /** 处理后的具体出身（从随机出身转化而来） */
  processedOrigin?: string;
  /** 处理后的具体改造核心（从随机改造转化而来） */
  processedSpiritRoot?: string;
  /** AI缓存的世界数据 */
  cachedWorldData?: any;
  /** 可选：当触发【判定】时，返回本次判定的结构化结果 */
  judgement?: {
    type: string;
    dc: number;
    roll: number; // 1-100
    success_rate: number; // 0-100
    grade: '天眷' | '完胜' | '险胜' | '失手' | '反噬' | string;
    details?: any;
  };
  stateChanges?: import('./game').StateChangeLog;
  system_messages?: string[];
  /** 行动选项（必填，3-5个选项） */
  action_options: string[];
}
