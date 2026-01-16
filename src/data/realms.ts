import type { RealmDefinition, RealmStageDefinition, RealmStage } from '../types/game';

// 通用子阶段定义函数
function createStandardStages(realmLevel: number): RealmStageDefinition[] {
  const baseMultiplier = 1 + realmLevel * 0.2;

  return [
    {
      stage: '初期' as RealmStage,
      title: '初窥门径',
      breakthrough_difficulty: '普通' as const,
      resource_multiplier: baseMultiplier,
      lifespan_bonus: 0,
      special_abilities: []
    },
    {
      stage: '中期' as RealmStage,
      title: '渐入佳境',
      breakthrough_difficulty: '普通' as const,
      resource_multiplier: baseMultiplier * 1.3,
      lifespan_bonus: Math.floor(realmLevel * 10),
      special_abilities: []
    },
    {
      stage: '后期' as RealmStage,
      title: '炉火纯青',
      breakthrough_difficulty: '困难' as const,
      resource_multiplier: baseMultiplier * 1.6,
      lifespan_bonus: Math.floor(realmLevel * 20),
      special_abilities: []
    },
    {
      stage: '圆满' as RealmStage,
      title: '臻至完美',
      breakthrough_difficulty: '困难' as const,
      resource_multiplier: baseMultiplier * 2,
      lifespan_bonus: Math.floor(realmLevel * 30),
      special_abilities: [`${getRealmName(realmLevel)}圆满气息`, '阶位稳固']
    },
    {
      stage: '极境' as RealmStage,
      title: '逆天而行',
      breakthrough_difficulty: '逆天' as const,
      resource_multiplier: baseMultiplier * 3,
      lifespan_bonus: Math.floor(realmLevel * 50),
      special_abilities: [
        '同境无敌',
        '有限越阶战斗',
        '协议烙印',
        '规则亲和提升'
      ],
      can_cross_realm_battle: true
    }
  ];
}

function getRealmName(level: number): string {
  const names = ['街头人', '跑者', '潜影者', '雇佣猎手', '战术大师', '企业特使', '幽网主宰', '城邦执掌', '传说级'];
  return names[level] || '未知阶位';
}

// 导出getRealmName函数供其他模块使用
export { getRealmName };

export const REALM_DEFINITIONS: RealmDefinition[] = [
  {
    level: 0,
    name: '街头人',
    title: '底层幸存',
    coreFeature: '资源匮乏，靠本能与关系存活',
    lifespan: '不稳定',
    activityScope: '贫民区与灰区',
    gapDescription: '没有护盾与权限，风险无处不在。'
  },
  {
    level: 1,
    name: '跑者',
    title: '任务新人',
    coreFeature: '具备基础义体与行动许可',
    lifespan: '常规',
    activityScope: '街区与委托网络',
    gapDescription: '能接到低风险任务，但仍极易被替代。',
    stages: createStandardStages(1)
  },
  {
    level: 2,
    name: '潜影者',
    title: '行动专家',
    coreFeature: '拥有隐匿与情报处理能力',
    lifespan: '不确定',
    activityScope: '公司边缘地带',
    gapDescription: '开始接触高价值情报与关键通道。',
    stages: createStandardStages(2)
  },
  {
    level: 3,
    name: '雇佣猎手',
    title: '高危执行者',
    coreFeature: '多重改造与战术适配',
    lifespan: '中等',
    activityScope: '公司禁区与战区',
    gapDescription: '掌控关键资源，具备独立小队影响力。',
    stages: createStandardStages(3)
  },
  {
    level: 4,
    name: '战术大师',
    title: '局势操盘者',
    coreFeature: '可调度团队与情报网络',
    lifespan: '视维护而定',
    activityScope: '跨区行动',
    gapDescription: '以战略影响地区秩序。',
    stages: createStandardStages(4)
  },
  {
    level: 5,
    name: '企业特使',
    title: '协议代行者',
    coreFeature: '掌控公司核心授权',
    lifespan: '极不稳定',
    activityScope: '企业核心区',
    gapDescription: '能改变城市级资源分配。',
    stages: createStandardStages(5)
  },
  {
    level: 6,
    name: '幽网主宰',
    title: '黑墙越界者',
    coreFeature: '能够操控深网结构',
    lifespan: '难以估计',
    activityScope: '深网与现实交界',
    gapDescription: '可重写规则与记录。',
    stages: createStandardStages(6)
  },
  {
    level: 7,
    name: '城邦执掌',
    title: '权力核心',
    coreFeature: '控制城市运行节点',
    lifespan: '由维护决定',
    activityScope: '城市级治理',
    gapDescription: '一念可改地区秩序。',
    stages: createStandardStages(7)
  },
  {
    level: 8,
    name: '传说级',
    title: '未知变量',
    coreFeature: '对系统造成不可预测影响',
    lifespan: '不可定义',
    activityScope: '跨域影响',
    gapDescription: '成为规则之外的例外。',
    stages: createStandardStages(8)
  }
];

/**
 * 获取特定阶位的定义
 */
export function getRealmDefinition(level: number): RealmDefinition | undefined {
  return REALM_DEFINITIONS.find(realm => realm.level === level);
}

/**
 * 获取阶位子阶段信息
 */
export function getRealmStageInfo(realmLevel: number, stage: RealmStage) {
  const realm = getRealmDefinition(realmLevel);
  const stageInfo = realm?.stages?.find(s => s.stage === stage);

  return {
    realmName: realm?.name || '未知阶位',
    stageInfo,
    fullTitle: stageInfo ? `${realm?.name}${stage}·${stageInfo.title}` : `${realm?.name || '未知'}${stage}`
  };
}
