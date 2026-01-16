import type { SaveData, GameTime, EventSystem } from '@/types/game';
import type { SaveDataV3 } from '@/types/saveSchemaV3';
import type { SaveDataV4 } from '@/types/saveSchemaV4';

export type SaveMigrationIssue =
  | 'legacy-root-keys'
  | 'missing-required-keys'
  | 'invalid-structure';

export interface SaveMigrationDetection {
  needsMigration: boolean;
  issues: SaveMigrationIssue[];
  legacyKeysFound: string[];
}

export interface SaveMigrationReport {
  legacyKeysFound: string[];
  removedLegacyKeys: string[];
  warnings: string[];
}

const LEGACY_ROOT_KEYS = [
  '状态',
  '玩家角色状态',
  '玩家角色状态信息',
  '玩家角色信息',
  '角色基础信息',
  '玩家角色基础信息',
  '训练状态',
  '状态效果',
  '叙事历史',
  '对话历史',
  '任务系统',
  '事件系统',
  '组织系统',
  '世界信息',
  '人物关系',
  '装备栏',
  '游戏时间',
  '专精体系',
  '训练程序',
  '掌握技能',
  '身体部位开发',
] as const;

const REQUIRED_V3_KEYS = ['元数据', '角色', '社交', '世界', '系统'] as const;

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const stripAIFieldsDeep = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stripAIFieldsDeep);
  if (!isPlainObject(value)) return value;

  const output: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value)) {
    if (key === '_AI说明' || key === '_AI修改规则' || key === '_AI重要提醒') continue;
    output[key] = stripAIFieldsDeep(val);
  }
  return output;
};

const coerceTime = (value: any): GameTime => {
  const base: GameTime = { 年: 1000, 月: 1, 日: 1, 小时: 8, 分钟: 0 };
  if (!isPlainObject(value)) return base;
  return {
    年: Number(value.年 ?? value.年数 ?? base.年),
    月: Number(value.月 ?? base.月),
    日: Number(value.日 ?? base.日),
    小时: Number(value.小时 ?? base.小时),
    分钟: Number(value.分钟 ?? base.分钟),
  } as GameTime;
};

export function isSaveDataV3(saveData: SaveData | null | undefined): saveData is SaveDataV3 {
  if (!saveData || typeof saveData !== 'object') return false;
  const anySave = saveData as any;
  return (
    isPlainObject(anySave.元数据) &&
    isPlainObject(anySave.角色) &&
    isPlainObject(anySave.社交) &&
    isPlainObject(anySave.世界) &&
    isPlainObject(anySave.系统)
  );
}

export function isSaveDataV4(saveData: SaveData | null | undefined): saveData is SaveDataV4 {
  if (!saveData || typeof saveData !== 'object') return false;
  const anySave = saveData as any;
  return (
    isPlainObject(anySave.元数据) &&
    isPlainObject(anySave.角色) &&
    isPlainObject(anySave.社交) &&
    isPlainObject(anySave.世界) &&
    isPlainObject(anySave.系统) &&
    isPlainObject(anySave.角色.档案) &&
    isPlainObject(anySave.角色.能力)
  );
}

export function detectLegacySaveData(saveData: SaveData | null | undefined): SaveMigrationDetection {
  if (!saveData || typeof saveData !== 'object') {
    return {
      needsMigration: true,
      issues: ['invalid-structure'],
      legacyKeysFound: [],
    };
  }

  const anySave = saveData as any;

  if (isSaveDataV3(saveData)) {
    return { needsMigration: false, issues: [], legacyKeysFound: [] };
  }

  const legacyKeysFound = [
    ...LEGACY_ROOT_KEYS.filter((k) => k in anySave),
    // “短路径平铺结构”也视为旧结构（需要迁移到 5 领域 V3）
    ...(anySave.属性 || anySave.位置 || anySave.背包 || anySave.时间 ? ['短路径平铺'] : []),
  ] as string[];

  const missingRequired = REQUIRED_V3_KEYS.filter((k) => !(k in anySave));
  const issues: SaveMigrationIssue[] = [];
  if (legacyKeysFound.length > 0) issues.push('legacy-root-keys');
  if (missingRequired.length > 0) issues.push('missing-required-keys');

  return {
    needsMigration: issues.length > 0,
    issues,
    legacyKeysFound,
  };
}

const buildDefaultEventSystem = (): EventSystem => ({
  配置: {
    启用随机事件: true,
    最小间隔年: 1,
    最大间隔年: 10,
    事件提示词: '',
  },
  下次事件时间: null,
  事件记录: [],
});

const buildDefaultOnline = (): SaveDataV3['系统']['联机'] => ({
  模式: '单机',
  房间ID: null,
  玩家ID: null,
  只读路径: ['世界'],
  世界曝光: false,
  冲突策略: '服务器',
});

const buildDefaultWorldInfo = (nowIso: string) => ({
  世界名称: '霓虹群岛',
  大陆信息: [],
  势力信息: [],
  地点信息: [],
  生成时间: nowIso,
  世界背景: '',
  世界纪元: '',
  特殊设定: [],
  版本: 'v1',
});

const buildDefaultIdentity = () => ({
  名字: '无名跑者',
  性别: '男',
  出生日期: { 年: 982, 月: 1, 日: 1 },
  种族: '人族',
  世界: '霓虹群岛',
  天资: '凡人',
  出生: '街区平民',
  改造核心: '复合核心',
  模块: [],
  初始六维: { 体质: 5, 能源: 5, 算法: 5, 资源感知: 5, 魅力: 5, 心智: 5 },
  成长六维: { 体质: 0, 能源: 0, 算法: 0, 资源感知: 0, 魅力: 0, 心智: 0 },
});

export function migrateSaveDataToLatest(raw: SaveData): { migrated: SaveDataV3; report: SaveMigrationReport } {
  const sourceRaw = deepClone(raw ?? ({} as any)) as any;
  const source = stripAIFieldsDeep(sourceRaw) as any;

  const report: SaveMigrationReport = {
    legacyKeysFound: [],
    removedLegacyKeys: [],
    warnings: [],
  };

  if (isSaveDataV3(source)) {
    return { migrated: source, report };
  }

  report.legacyKeysFound = LEGACY_ROOT_KEYS.filter((k) => k in source) as string[];

  const nowIso = new Date().toISOString();

  const flatCharacter =
    source.角色 ??
    source.角色基础信息 ??
    source.玩家角色基础信息 ??
    source.玩家角色信息 ??
    source.玩家角色状态信息?.角色 ??
    null;

  const legacyStatusLike = source.属性 ?? source.状态 ?? source.玩家角色状态 ?? source.玩家角色状态信息 ?? null;
  const legacyStatusObj = isPlainObject(legacyStatusLike) ? legacyStatusLike : ({} as any);

  const flatAttributes = {
    阶位: (legacyStatusObj as any).阶位 ?? null,
    声望: (legacyStatusObj as any).声望 ?? 0,
    生命值: (legacyStatusObj as any).生命值 ?? { 当前: 100, 上限: 100 },
    电量: (legacyStatusObj as any).电量 ?? { 当前: 50, 上限: 50 },
    带宽: (legacyStatusObj as any).带宽 ?? { 当前: 30, 上限: 30 },
    寿命: (legacyStatusObj as any).寿命 ?? { 当前: 18, 上限: 80 },
  };

  const effectsCandidate =
    source.效果 ??
    source.修行状态 ??
    (legacyStatusObj as any).状态效果 ??
    source.状态效果 ??
    [];
  const flatEffects = Array.isArray(effectsCandidate) ? effectsCandidate : [];

  const flatLocation =
    source.位置 ??
    (legacyStatusObj as any).位置 ??
    (source.状态位置 as any) ??
    { 描述: '霓虹群岛·无名节点', x: 5000, y: 5000 };

  const flatTime = coerceTime(source.元数据?.时间 ?? source.时间 ?? source.游戏时间);

  const flatInventory = source.背包 ?? { 信用点: { 低额: 0, 中额: 0, 高额: 0, 最高额: 0 }, 物品: {} };
  const flatEquipment =
    source.装备 ?? source.装备栏 ?? { 装备1: null, 装备2: null, 装备3: null, 装备4: null, 装备5: null, 装备6: null };

  const flatProgramSystem =
    source.程序 ??
    {
      当前程序ID: null,
      程序进度: {},
      程序套装: { 主槽: null, 副槽: [] },
    };

  const flatTraining =
    source.训练 ?? (source.训练程序 !== undefined ? { 训练程序: source.训练程序 } : { 训练程序: null });

  const flatProtocol = source.流派 ?? source.专精 ?? { 流派列表: {} };
  const flatSkills =
    source.技能 ??
    (source.掌握技能
      ? { 掌握技能: source.掌握技能, 装备栏: [], 冷却: {} }
      : { 掌握技能: [], 装备栏: [], 冷却: {} });

  const flatSect = source.组织 ?? source.组织系统 ?? undefined;
  const flatRelationships = source.关系 ?? source.人物关系 ?? {};
  const flatMemory =
    source.记忆 ?? { 短期记忆: [], 中期记忆: [], 长期记忆: [], 隐式中期记忆: [] };

  const flatEventRaw = source.事件 ?? source.事件系统 ?? buildDefaultEventSystem();
  const flatEvent = (() => {
    const eventSystem = isPlainObject(flatEventRaw)
      ? (deepClone(flatEventRaw) as any)
      : (buildDefaultEventSystem() as any);

    if (!Array.isArray(eventSystem.事件记录)) eventSystem.事件记录 = [];
    if (!isPlainObject(eventSystem.下次事件时间)) eventSystem.下次事件时间 = null;

    return eventSystem as any;
  })();

  const worldInfoCandidate = source.世界?.信息 ?? source.世界 ?? source.世界信息 ?? source.worldInfo ?? undefined;
  const worldInfo = isPlainObject(worldInfoCandidate) ? worldInfoCandidate : buildDefaultWorldInfo(nowIso);

  const systemConfig = source.系统?.配置 ?? source.系统 ?? source.系统配置 ?? undefined;

  const narrative =
    source.系统?.历史?.叙事 ??
    source.历史?.叙事 ??
    (source.叙事历史 ? source.叙事历史 : source.对话历史 ? source.对话历史 : []);

  const online =
    source.系统?.联机 ??
    source.联机 ??
    buildDefaultOnline();

  const identity = (isPlainObject(flatCharacter) ? (flatCharacter as any) : buildDefaultIdentity()) as any;
  const migrated: SaveDataV3 = {
    元数据: {
      版本号: 3,
      存档ID: String(source.元数据?.存档ID ?? source.存档ID ?? `save_${Date.now()}`),
      存档名: String(source.元数据?.存档名 ?? source.存档名 ?? '迁移存档'),
      游戏版本: source.元数据?.游戏版本 ?? source.游戏版本,
      创建时间: String(source.元数据?.创建时间 ?? source.创建时间 ?? nowIso),
      更新时间: nowIso,
      游戏时长秒: Number(source.元数据?.游戏时长秒 ?? source.游戏时长秒 ?? source.元数据?.游戏时长 ?? source.游戏时长 ?? 0),
      时间: flatTime,
    },
    角色: {
      身份: identity,
      属性: flatAttributes,
      位置: flatLocation,
      效果: flatEffects,
      身体: source.身体 ?? (source.身体部位开发 ? { 部位开发: source.身体部位开发 } : undefined),
      背包: flatInventory,
      装备: flatEquipment,
      程序: flatProgramSystem,
      训练: flatTraining,
      流派: flatProtocol,
      技能: flatSkills,
    },
    社交: {
      关系: flatRelationships,
      组织: flatSect ?? null,
      事件: flatEvent,
      记忆: flatMemory,
    },
    世界: {
      信息: worldInfo as any,
      状态: source.世界?.状态 ?? source.世界状态 ?? undefined,
    },
    系统: {
      配置: systemConfig,
      设置: source.系统?.设置 ?? source.设置 ?? undefined,
      缓存: source.系统?.缓存 ?? source.缓存 ?? undefined,
      行动队列: source.系统?.行动队列 ?? source.行动队列 ?? undefined,
      历史: { 叙事: Array.isArray(narrative) ? narrative : [] },
      扩展: source.系统?.扩展 ?? source.扩展 ?? {},
      联机: isPlainObject(online) ? { ...buildDefaultOnline(), ...(online as any) } : buildDefaultOnline(),
    },
  };

  // 清除旧key：迁移后的对象严格只保留新字段
  for (const key of LEGACY_ROOT_KEYS) {
    if (key in source) report.removedLegacyKeys.push(String(key));
  }

  // 最小校验与告警
  for (const key of REQUIRED_V3_KEYS) {
    if (!(key in migrated as any)) report.warnings.push(`迁移后缺少必填字段：${String(key)}`);
  }
  if (!migrated.角色?.身份) report.warnings.push('迁移后仍缺少 角色.身份（将导致部分界面无法展示）');

  return { migrated: migrated as SaveDataV3, report };
}

const mapV3StatsToV4 = (attributes: any) => {
  const realm = attributes?.阶位 ?? {};
  return {
    等级: {
      称号: String(realm?.名称 ?? '街头新人'),
      阶段: realm?.阶段 ?? '',
      进度: Number(realm?.当前进度 ?? 0),
      晋升需求: realm?.下一级所需 ?? 100,
      晋升说明: realm?.升级描述 ?? '',
    },
    热度: Number(attributes?.声望 ?? 0),
  };
};

const mapV3ResourcesToV4 = (attributes: any) => ({
  生命值: attributes?.生命值 ?? { 当前: 100, 上限: 100 },
  电量: attributes?.电量 ?? { 当前: 50, 上限: 50 },
  带宽: attributes?.带宽 ?? { 当前: 30, 上限: 30 },
  生理耐久: attributes?.寿命 ?? { 当前: 18, 上限: 80 },
});

const mapV3IdentityToV4 = (identity: any, time: GameTime) => ({
  姓名: String(identity?.名字 ?? '无名者'),
  性别: (identity?.性别 ?? '其他') as '男' | '女' | '其他',
  年龄: Number(identity?.年龄 ?? 18),
  出生日期: coerceTime(identity?.出生日期 ?? time),
  所属世界: String(identity?.世界 ?? '未知'),
  族群: String(identity?.种族 ?? '未知'),
  背景: String(identity?.出生 ?? '未知'),
  天赋: Array.isArray(identity?.模块) ? identity.模块 : [],
  基础素质: {
    体格: Number(identity?.初始六维?.体质 ?? 5),
    反应: Number(identity?.初始六维?.能源 ?? 5),
    智识: Number(identity?.初始六维?.算法 ?? 5),
    幸运: Number(identity?.初始六维?.资源感知 ?? 5),
    魅力: Number(identity?.初始六维?.魅力 ?? 5),
    意志: Number(identity?.初始六维?.心智 ?? 5),
  },
  改造素质: {
    体格: Number(identity?.成长六维?.体质 ?? 0),
    反应: Number(identity?.成长六维?.能源 ?? 0),
    智识: Number(identity?.成长六维?.算法 ?? 0),
    幸运: Number(identity?.成长六维?.资源感知 ?? 0),
    魅力: Number(identity?.成长六维?.魅力 ?? 0),
    意志: Number(identity?.成长六维?.心智 ?? 0),
  },
});

const mapV3CreditsToV4 = (inventory: any) => {
  const credits = inventory?.信用点 ?? { 低额: 0, 中额: 0, 高额: 0, 最高额: 0 };
  const base = Number(credits?.低额 ?? 0);
  return Number.isFinite(base) ? base : 0;
};

const mapV3WorldInfoToV4 = (worldInfo: any) => ({
  ...worldInfo,
  区域信息: worldInfo?.大陆信息 ?? [],
  公司势力: worldInfo?.势力信息 ?? [],
  节点信息: worldInfo?.地点信息 ?? [],
});

export function migrateSaveDataToV4(raw: SaveData): { migrated: SaveDataV4; report: SaveMigrationReport } {
  const sourceRaw = deepClone(raw ?? ({} as any)) as any;
  const source = stripAIFieldsDeep(sourceRaw) as any;

  const report: SaveMigrationReport = {
    legacyKeysFound: [],
    removedLegacyKeys: [],
    warnings: [],
  };

  if (isSaveDataV4(source)) {
    return { migrated: source, report };
  }

  const v3 = isSaveDataV3(source) ? source : migrateSaveDataToLatest(source as any).migrated;
  const time = coerceTime((v3 as any)?.元数据?.时间 ?? null);

  const migrated: SaveDataV4 = {
    元数据: {
      ...(v3 as any)?.元数据,
      时间: time,
      版本: 'v4',
    },
    角色: {
      档案: mapV3IdentityToV4((v3 as any)?.角色?.身份 ?? {}, time),
      能力: mapV3StatsToV4((v3 as any)?.角色?.属性 ?? {}),
      资源: mapV3ResourcesToV4((v3 as any)?.角色?.属性 ?? {}),
      位置: {
        ...(v3 as any)?.角色?.位置,
        信号强度: (v3 as any)?.角色?.位置?.信号强度,
      },
      状态效果: (v3 as any)?.角色?.效果 ?? [],
      背包: {
        信用点: mapV3CreditsToV4((v3 as any)?.角色?.背包 ?? {}),
        物品: (v3 as any)?.角色?.背包?.物品 ?? {},
      },
      装备: (v3 as any)?.角色?.装备 ?? {},
      技能树: (v3 as any)?.角色?.程序 ?? {},
      训练: (v3 as any)?.角色?.训练 ?? {},
      专精树: (v3 as any)?.角色?.流派 ?? {},
      技能: (v3 as any)?.角色?.技能 ?? {},
      身体: (v3 as any)?.角色?.身体,
    },
    社交: {
      关系: (v3 as any)?.社交?.关系 ?? {},
      组织: (v3 as any)?.社交?.组织 ?? undefined,
      记忆: (v3 as any)?.社交?.记忆 ?? undefined,
      事件: (v3 as any)?.社交?.事件 ?? undefined,
    },
    世界: {
      信息: mapV3WorldInfoToV4((v3 as any)?.世界?.信息 ?? {}),
      状态: (v3 as any)?.世界?.状态 ?? {},
    },
    系统: {
      配置: (v3 as any)?.系统?.配置 ?? {},
      历史: (v3 as any)?.系统?.历史 ?? {},
      联机: (v3 as any)?.系统?.联机 ?? undefined,
      设置: (v3 as any)?.系统?.设置 ?? undefined,
    },
  };

  return { migrated, report };
}

export function convertV4ToV3Compat(source: SaveDataV4): SaveDataV3 {
  const time = coerceTime(source?.元数据?.时间 ?? null);
  const archive = source?.角色?.档案 ?? ({} as any);
  const ability = source?.角色?.能力 ?? ({} as any);
  const resources = source?.角色?.资源 ?? ({} as any);

  const identity = {
    名字: String(archive.姓名 ?? '无名者'),
    性别: archive.性别 ?? '其他',
    年龄: Number(archive.年龄 ?? 18),
    出生日期: coerceTime(archive.出生日期 ?? time),
    世界: String(archive.所属世界 ?? '未知'),
    种族: String(archive.族群 ?? '未知'),
    出生: String(archive.背景 ?? '未知'),
    模块: Array.isArray(archive.天赋) ? archive.天赋 : [],
    初始六维: {
      体质: Number(archive?.基础素质?.体格 ?? 5),
      能源: Number(archive?.基础素质?.反应 ?? 5),
      算法: Number(archive?.基础素质?.智识 ?? 5),
      资源感知: Number(archive?.基础素质?.幸运 ?? 5),
      魅力: Number(archive?.基础素质?.魅力 ?? 5),
      心智: Number(archive?.基础素质?.意志 ?? 5),
    },
    成长六维: {
      体质: Number(archive?.改造素质?.体格 ?? 0),
      能源: Number(archive?.改造素质?.反应 ?? 0),
      算法: Number(archive?.改造素质?.智识 ?? 0),
      资源感知: Number(archive?.改造素质?.幸运 ?? 0),
      魅力: Number(archive?.改造素质?.魅力 ?? 0),
      心智: Number(archive?.改造素质?.意志 ?? 0),
    },
  } as any;

  const realm = ability?.等级 ?? {};
  const attributes = {
    阶位: {
      名称: String(realm?.称号 ?? '街头新人'),
      阶段: realm?.阶段 ?? '',
      当前进度: Number(realm?.进度 ?? 0),
      下一级所需: realm?.晋升需求 ?? 100,
      升级描述: realm?.晋升说明 ?? '',
    },
    声望: Number(ability?.热度 ?? 0),
    生命值: resources?.生命值 ?? { 当前: 100, 上限: 100 },
    电量: resources?.电量 ?? { 当前: 50, 上限: 50 },
    带宽: resources?.带宽 ?? { 当前: 30, 上限: 30 },
    寿命: resources?.生理耐久 ?? { 当前: 18, 上限: 80 },
  } as any;

  const creditValue = source?.角色?.背包?.信用点;
  const lowerCredits = typeof creditValue === 'number' ? creditValue : Number((creditValue as any)?.低额 ?? 0);

  return {
    元数据: { ...(source as any)?.元数据, 时间: time },
    角色: {
      身份: identity,
      属性: attributes,
      位置: {
        ...(source?.角色?.位置 ?? {}),
        信号强度: source?.角色?.位置?.信号强度,
      },
      效果: source?.角色?.状态效果 ?? [],
      身体: source?.角色?.身体,
      背包: {
        信用点: { 低额: lowerCredits, 中额: 0, 高额: 0, 最高额: 0 },
        物品: source?.角色?.背包?.物品 ?? {},
      },
      装备: source?.角色?.装备 ?? {},
      程序: source?.角色?.技能树 ?? {},
      训练: source?.角色?.训练 ?? {},
      流派: source?.角色?.专精树 ?? {},
      技能: source?.角色?.技能 ?? {},
    },
    社交: {
      关系: source?.社交?.关系 ?? {},
      组织: source?.社交?.组织 ?? undefined,
      事件: source?.社交?.事件 ?? undefined,
      记忆: source?.社交?.记忆 ?? undefined,
    },
    世界: {
      信息: {
        ...(source?.世界?.信息 ?? {}),
        大陆信息: (source?.世界?.信息 as any)?.区域信息 ?? [],
        势力信息: (source?.世界?.信息 as any)?.公司势力 ?? [],
        地点信息: (source?.世界?.信息 as any)?.节点信息 ?? [],
      },
      状态: source?.世界?.状态 ?? {},
    },
    系统: {
      配置: source?.系统?.配置 ?? {},
      设置: source?.系统?.设置 ?? undefined,
      历史: source?.系统?.历史 ?? {},
      联机: source?.系统?.联机 ?? undefined,
    },
  } as SaveDataV3;
}
