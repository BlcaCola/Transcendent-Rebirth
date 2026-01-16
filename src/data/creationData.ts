import type { World, TalentTier, Origin, SpiritRoot, Talent } from '@/types';

// =======================================================================
//                           本地世界数据
// =======================================================================
export const LOCAL_WORLDS: Omit<World, 'source'>[] = [
  {
    id: 1,
    name: '霓虹巨城',
    era: '赛博纪元67年',
    description: '这是一座永不熄灯的超级都市，塔楼与贫民区层层叠压。公司联盟掌控能源、网络与生命数据，街头帮派争夺灰色通道。天空被广告投影与监控无人机占据，地表则被雨与霓虹浸透。每一次升级、每一条情报都以信用点计价，而你的生存依赖于速度、关系与胆量。',
  },
  {
    id: 2,
    name: '边缘环带',
    era: '合成纪元97年',
    description: '远离中心城的环带充斥废弃工厂与自动化农场。这里没有完整法度，只有廉价的义体、走私的技术和被抛弃的人群。夜晚的风携带着工业尘埃与电磁噪声，任何人都可能在这里崛起或被抹去。',
  },
  {
    id: 3,
    name: '深网遗域',
    era: '深网纪元88年',
    description: '被封锁的旧网络层与失控AI残留在此徘徊。深网遗域像一座无形城市，规则由算法与黑客共写。你的意识可能在一次潜入中被重写，但也可能在这里找到改变命运的钥匙。',
  },
  {
    id: 4,
    name: '海雾自由港',
    era: '海雾纪元54年',
    description: '浮动港口与海上居住区拼接成移动城邦。这里是走私者、佣兵与情报贩子的汇合点，法律只在枪口与合同之间存在。海雾掩护着交易与背叛，也掩护着你下一次选择。',
  },
  {
    id: 5,
    name: '白噪高地',
    era: '战争纪元77年',
    description: '高地信号干扰严重，旧时代的军事设施仍在运转。无人机巡逻、自动炮台与未知防火墙构成无法预测的威胁。传闻这里藏有军规级义体核心与失踪数据，但进入者鲜少返回。',
  },
];

// =======================================================================
//                           本地天资数据
// =======================================================================
export const LOCAL_TALENT_TIERS: Omit<TalentTier, 'source'>[] = [
  { id: 1, name: '底层改造', description: '基础义体、资源稀缺、网络权限极低，需要靠生存技巧与人脉突围。', total_points: 10, rarity: 1, color: '#718096' },
  { id: 2, name: '街头专业', description: '具备一两项实用技能，能在黑市与委托中立足。', total_points: 20, rarity: 2, color: '#E2E8F0' },
  { id: 3, name: '精英跑者', description: '敏锐、强韧、效率极高，能完成高风险任务。', total_points: 35, rarity: 3, color: '#63B3ED' },
  { id: 4, name: '合成尖兵', description: '多重改造与算法加持，能力稳定且覆盖广。', total_points: 50, rarity: 4, color: '#9F7AEA' },
  { id: 5, name: '黑墙幸存者', description: '经历深网污染仍能保持自我，极具稀有性。', total_points: 70, rarity: 5, color: '#F6E05E' },
  { id: 6, name: '原型载体', description: '实验级神经接口与模块兼容性极高。', total_points: 85, rarity: 6, color: '#F56565' },
  { id: 7, name: '幽网传说', description: '几乎不被记录，却被圈内当作传奇存在。', total_points: 100, rarity: 7, color: '#ED8936' },
];

// =======================================================================
//                           本地出身数据
// =======================================================================
export const LOCAL_ORIGINS: Omit<Origin, 'source'>[] = [
  { id: 1, name: '街头弃子', description: '在贫民区长大，靠本能与直觉生存。', talent_cost: 0, attribute_modifiers: { root_bone: 1 }, rarity: 3 },
  { id: 2, name: '公司雇员', description: '接受标准化培训，擅长流程与规避风险。', talent_cost: 2, attribute_modifiers: { comprehension: 2 }, rarity: 3 },
  { id: 3, name: '黑市中介', description: '熟悉交易规则，善于建立人脉与谈判。', talent_cost: 2, attribute_modifiers: { charm: 2 }, rarity: 3 },
  { id: 4, name: '安保退役', description: '曾在武装体系服役，体能与意志坚韧。', talent_cost: 3, attribute_modifiers: { temperament: 2, root_bone: 1 }, rarity: 3 },
  { id: 5, name: '独立黑客', description: '擅长系统渗透与信息搜集。', talent_cost: 4, attribute_modifiers: { comprehension: 1, temperament: 1 }, rarity: 4 },
  { id: 6, name: '边境走私', description: '习惯游走灰区，面对危机反应更快。', talent_cost: 1, attribute_modifiers: { temperament: 3 }, rarity: 4 },
  { id: 7, name: '记忆断片者', description: '保留部分异常记忆碎片，对局势感知异常敏锐。', talent_cost: 5, attribute_modifiers: { comprehension: 2, luck: 1 }, rarity: 5 },
  { id: 8, name: '义体技师', description: '熟悉改造流程，对人体与机械连接有优势。', talent_cost: 6, attribute_modifiers: { spirit: 2, root_bone: 1 }, rarity: 5 },
  { id: 9, name: '合成试验体', description: '经历过高风险试验，精神负荷更大但上限更高。', talent_cost: 7, attribute_modifiers: { comprehension: 3, temperament: -1 }, rarity: 5 },
  { id: 10, name: '港口搬运', description: '体能强健，耐力突出。', talent_cost: 1, attribute_modifiers: { root_bone: 2 }, rarity: 2 },
  { id: 11, name: '媒体线人', description: '善于收集情报并操控舆论风向。', talent_cost: 3, attribute_modifiers: { charm: 2, temperament: 1 }, rarity: 4 },
  { id: 12, name: '机械学徒', description: '擅长拆装与改造，理解硬件结构。', talent_cost: 2, attribute_modifiers: { spirit: 1, comprehension: 1 }, rarity: 3 },
  { id: 13, name: '边缘医师', description: '长期接触改造手术与药物，神经耐受更高。', talent_cost: 3, attribute_modifiers: { comprehension: 2, spirit: 1 }, rarity: 4 },
  { id: 14, name: '流浪者', description: '适应力极强，但资源不足。', talent_cost: -1, attribute_modifiers: { temperament: 2, luck: -1 }, rarity: 2 },
];

// =======================================================================
//                           本地改造核心数据
// =======================================================================
export const LOCAL_SPIRIT_ROOTS: Omit<SpiritRoot, 'source'>[] = [
  {
    id: 1,
    name: '神经低延迟',
    tier: '增强',
    description: '神经信号传导效率极高，反应与微操占优。',
    cultivation_speed: '1.6x',
    special_effects: ['反应速度+50%', '动作误差降低'],
    base_multiplier: 1.6,
    talent_cost: 10,
    rarity: 3
  },
  {
    id: 2,
    name: '高耐受体质',
    tier: '增强',
    description: '对改造副作用具有更高耐受度。',
    cultivation_speed: '1.5x',
    special_effects: ['改造惩罚降低', '恢复速度提升'],
    base_multiplier: 1.5,
    talent_cost: 9,
    rarity: 3
  },
  {
    id: 3,
    name: '深网亲和',
    tier: '军规',
    description: '对数据流的感知极强，适合潜入与操控。',
    cultivation_speed: '1.8x',
    special_effects: ['黑客效率提升', '异常流量识别'],
    base_multiplier: 1.8,
    talent_cost: 12,
    rarity: 4
  },
  {
    id: 4,
    name: '义体兼容',
    tier: '原型',
    description: '对多类型义体的兼容性极高，升级成本更低。',
    cultivation_speed: '2.0x',
    special_effects: ['模块冲突降低', '改装上限提高'],
    base_multiplier: 2.0,
    talent_cost: 15,
    rarity: 4
  },
  {
    id: 5,
    name: '量子同步',
    tier: '禁忌',
    description: '可短暂同步高维数据，代价是极高精神负荷。',
    cultivation_speed: '2.6x',
    special_effects: ['超频能力', '短时算力爆发'],
    base_multiplier: 2.6,
    talent_cost: 22,
    rarity: 5
  },
  {
    id: 6,
    name: '零改造',
    tier: '基础',
    description: '未经过强化的自然体，潜力需要外部支撑。',
    cultivation_speed: '1.0x',
    special_effects: ['低成本维护'],
    base_multiplier: 1.0,
    talent_cost: 0,
    rarity: 1
  }
];


// =======================================================================
//                           本地天赋数据 (预留)
// =======================================================================
export const LOCAL_TALENTS: Omit<Talent, 'source'>[] = [
  {
    id: 1,
    name: '霓虹幸存者',
    description: '资源感知惊人，总能在绝境中脱险，获得意想不到的机会。',
    talent_cost: 15,
    rarity: 5,
    effects: [
      { 类型: '成长六维', 目标: '资源感知', 数值: 8 },
      { 类型: '特殊能力', 名称: '逢凶化吉', 数值: 0.1 }
    ]
  },
  {
    id: 2,
    name: '近战协议专精',
    description: '天生对近战协议高度适配，任何战术一看便会，且威力倍增。',
    talent_cost: 12,
    rarity: 5,
    effects: [
      { 类型: '技能加成', 技能: '刃系战术', 数值: 0.2 },
      { 类型: '成长六维', 目标: '体质', 数值: 3 }
    ]
  },
  {
    id: 3,
    name: '制剂专家',
    description: '对配方与反应有超凡的领悟力，制剂成功率与品质大幅提升。',
    talent_cost: 12,
    rarity: 5,
    effects: [
      { 类型: '技能加成', 技能: '制剂', 数值: 0.15 },
      { 类型: '成长六维', 目标: '算法', 数值: 2 }
    ]
  },
  {
    id: 4,
    name: '矩阵大师',
    description: '对矩阵结构有极高的天赋，学习和部署矩阵的效率大大提高。',
    talent_cost: 8,
    rarity: 4,
    effects: [
      { 类型: '技能加成', 技能: '矩阵', 数值: 0.12 },
      { 类型: '成长六维', 目标: '算法', 数值: 2 }
    ]
  },
  {
    id: 5,
    name: '装配鬼才',
    description: '天生对各种材料有敏锐的感知，装配时更容易出现极品。',
    talent_cost: 8,
    rarity: 4,
    effects: [
      { 类型: '技能加成', 技能: '装配', 数值: 0.1 },
      { 类型: '特殊能力', 名称: '材料感知', 数值: 1 }
    ]
  },
  {
    id: 6,
    name: '物资猎手',
    description: '外出行动时，更容易发现高价值资源。',
    talent_cost: 7,
    rarity: 4,
    effects: [
      { 类型: '成长六维', 目标: '资源感知', 数值: 3 },
      { 类型: '特殊能力', 名称: '寻宝天赋', 数值: 0.15 }
    ]
  },
  {
    id: 7,
    name: '体核强化',
    description: '体能天生强横，生命值旺盛，适合训练近战模块。',
    talent_cost: 5,
    rarity: 3,
    effects: [
      { 类型: '成长六维', 目标: '体质', 数值: 3 },
      { 类型: '特殊能力', 名称: '体修天赋', 数值: 0.1 }
    ]
  },
  {
    id: 8,
    name: '带宽过人',
    description: '天生带宽强大，不易被心智噪声干扰，施展感知技巧效果更佳。',
    talent_cost: 5,
    rarity: 3,
    effects: [
      { 类型: '成长六维', 目标: '算法', 数值: 3 },
      { 类型: '特殊能力', 名称: '心魔抗性', 数值: 0.1 }
    ]
  },
  {
    id: 9,
    name: '机动幽影',
    description: '机动路径更高效，战斗中闪避能力更强。',
    talent_cost: 4,
    rarity: 3,
    effects: [
      { 类型: '成长六维', 目标: '能源', 数值: 2 },
      { 类型: '特殊能力', 名称: '闪避天赋', 数值: 0.08 }
    ]
  },
  {
    id: 10,
    name: '舱区后代',
    description: '出身底层舱区，心智坚韧，对作物培育有额外亲和力。',
    talent_cost: 2,
    rarity: 2,
    effects: [
      { 类型: '成长六维', 目标: '心智', 数值: 1 },
      { 类型: '特殊能力', 名称: '灵植亲和', 数值: 0.1 }
    ]
  },
  {
    id: 11,
    name: '缓存记忆',
    description: '记忆力超群，学习模块资料速度加快。',
    talent_cost: 2,
    rarity: 2,
    effects: [
      { 类型: '成长六维', 目标: '算法', 数值: 2 }
    ]
  },
  {
    id: 12,
    name: '信用守则',
    description: '与人交易时，不容易被欺骗。',
    talent_cost: 1,
    rarity: 1,
    effects: [
      { 类型: '特殊能力', 名称: '防欺诈', 数值: 1 }
    ]
  },
  {
    id: 13,
    name: '合约信誉',
    description: '你的承诺极具分量，更容易获得他人的信任与好感。',
    talent_cost: 3,
    rarity: 2,
    effects: [
      { 类型: '成长六维', 目标: '魅力', 数值: 2 }
    ]
  },
  {
    id: 14,
    name: '抗毒机体',
    description: '毒素难侵，且能更好地驾驭腐蚀协议，但常人不敢轻易接近。',
    talent_cost: 6,
    rarity: 4,
    effects: [
      { 类型: '特殊能力', 名称: '毒素免疫', 数值: 1 },
      { 类型: '技能加成', 技能: '腐蚀协议', 数值: 0.15 },
      { 类型: '成长六维', 目标: '魅力', 数值: -2 }
    ]
  },
  {
    id: 15,
    name: '标记画龙',
    description: '在绘制矩阵标记时，有一定几率产生意想不到的强大效果。',
    talent_cost: 4,
    rarity: 3,
    effects: [
      { 类型: '技能加成', 技能: '矩阵标记', 数值: 0.1 },
      { 类型: '特殊能力', 名称: '标记变异', 数值: 0.05 }
    ]
  },
  {
    id: 16,
    name: '聚光人格',
    description: '气质出众，魅力超群。无论走到哪里都是众人瞩目的焦点，极容易获得他人的好感与信任。在社交场合如鱼得水，能够以言语和魅力化解大部分冲突。',
    talent_cost: 8,
    rarity: 4,
    effects: [
      { 类型: '成长六维', 目标: '魅力', 数值: 5 },
      { 类型: '特殊能力', 名称: '魅力光环', 数值: 0.2 },
      { 类型: '特殊能力', 名称: '社交天赋', 数值: 0.15 }
    ]
  },
  {
    id: 17,
    name: '心智固态',
    description: '心智如铁，噪声难侵。晋升时更不容易失控，受到诱惑和幻象影响的几率大幅降低。',
    talent_cost: 6,
    rarity: 4,
    effects: [
      { 类型: '成长六维', 目标: '心智', 数值: 3 },
      { 类型: '特殊能力', 名称: '心魔抗性', 数值: 0.3 }
    ]
  },
  {
    id: 18,
    name: '力矩强化',
    description: '天生力矩强劲，体质远超常人。擅长近战搏杀，生命值旺盛。',
    talent_cost: 5,
    rarity: 3,
    effects: [
      { 类型: '成长六维', 目标: '体质', 数值: 4 },
      { 类型: '特殊能力', 名称: '近战增幅', 数值: 0.2 }
    ]
  },
  {
    id: 19,
    name: '危机预警',
    description: '感知敏锐，对危险有本能的预感。在战斗和探险中能够提前感知到威胁。',
    talent_cost: 4,
    rarity: 3,
    effects: [
      { 类型: '成长六维', 目标: '能源', 数值: 3 },
      { 类型: '特殊能力', 名称: '危险感知', 数值: 1 }
    ]
  },
  {
    id: 20,
    name: '夜行优化',
    description: '夜晚精神百倍，训练效率提升。但白天会感到困倦。',
    talent_cost: 1,
    rarity: 2,
    effects: [
      { 类型: '特殊能力', 名称: '夜间训练加速', 数值: 0.3 }
    ]
  },
  {
    id: 21,
    name: '系统眷顾',
    description: '受系统眷顾，晋升时成功率更高，遭遇异常冲击时威力减弱。',
    talent_cost: 10,
    rarity: 5,
    effects: [
      { 类型: '成长六维', 目标: '资源感知', 数值: 5 },
      { 类型: '特殊能力', 名称: '晋升成功率', 数值: 0.2 },
      { 类型: '特殊能力', 名称: '异常冲击削弱', 数值: 0.15 }
    ]
  },
  {
    id: 22,
    name: '刃系适配',
    description: '天生与刃系武装高度契合，近战输出倍增，战术掌握速度极快。',
    talent_cost: 10,
    rarity: 5,
    effects: [
      { 类型: '成长六维', 目标: '体质', 数值: 2 },
      { 类型: '技能加成', 技能: '刃系战术', 数值: 0.25 },
      { 类型: '特殊能力', 名称: '刃系直觉', 数值: 0.2 }
    ]
  },
  {
    id: 23,
    name: '核心架构体',
    description: '传说中的核心架构，天生契合系统规则，训练任何模块都事半功倍。',
    talent_cost: 18,
    rarity: 5,
    effects: [
      { 类型: '成长六维', 目标: '算法', 数值: 4 },
      { 类型: '成长六维', 目标: '能源', 数值: 4 },
      { 类型: '特殊能力', 名称: '万法精通', 数值: 0.3 }
    ]
  },
  {
    id: 24,
    name: '标记奇才',
    description: '对矩阵标记有超凡的领悟，绘制成功率高，威力强大。',
    talent_cost: 7,
    rarity: 4,
    effects: [
      { 类型: '成长六维', 目标: '算法', 数值: 2 },
      { 类型: '技能加成', 技能: '矩阵标记', 数值: 0.2 },
      { 类型: '特殊能力', 名称: '标记精通', 数值: 0.15 }
    ]
  },
  {
    id: 25,
    name: '无人机亲和',
    description: '天生亲和伴生无人机，更容易调校与沟通，载具战力提升。',
    talent_cost: 6,
    rarity: 4,
    effects: [
      { 类型: '成长六维', 目标: '魅力', 数值: 2 },
      { 类型: '特殊能力', 名称: '载具契约', 数值: 0.3 },
      { 类型: '特殊能力', 名称: '载具战力', 数值: 0.2 }
    ]
  },
  {
    id: 26,
    name: '暗域心智',
    description: '心智偏向暗域路线，训练黑市模块速度极快，但容易过载失控。合规模块训练困难。',
    talent_cost: 5,
    rarity: 4,
    effects: [
      { 类型: '成长六维', 目标: '心智', 数值: -2 },
      { 类型: '特殊能力', 名称: '黑市模块加速', 数值: 0.4 },
      { 类型: '特殊能力', 名称: '过载失控', 数值: 0.15 }
    ]
  },
  {
    id: 27,
    name: '装配总监',
    description: '对装配有非凡的天赋，打造的装备品质更高，成功率更高。',
    talent_cost: 9,
    rarity: 4,
    effects: [
      { 类型: '成长六维', 目标: '算法', 数值: 2 },
      { 类型: '技能加成', 技能: '装配', 数值: 0.25 },
      { 类型: '特殊能力', 名称: '极品概率', 数值: 0.1 }
    ]
  },
  {
    id: 28,
    name: '黑星命格',
    description: '黑星命格，注定孤独一生。资源感知极低，但在绝境中更容易晋升。',
    talent_cost: -3,
    rarity: 3,
    effects: [
      { 类型: '成长六维', 目标: '资源感知', 数值: -5 },
      { 类型: '特殊能力', 名称: '绝境晋升', 数值: 0.3 }
    ]
  },
  {
    id: 29,
    name: '预兆梦境',
    description: '偶尔能在梦中窥见未来的片段，提前规避危险或把握机缘。',
    talent_cost: 8,
    rarity: 5,
    effects: [
      { 类型: '成长六维', 目标: '算法', 数值: 2 },
      { 类型: '成长六维', 目标: '资源感知', 数值: 3 },
      { 类型: '特殊能力', 名称: '预知危险', 数值: 1 }
    ]
  },
  {
    id: 30,
    name: '延寿体质',
    description: '天生寿命悠长，比常人更不易衰老，有更多时间追求专精。',
    talent_cost: 12,
    rarity: 5,
    effects: [
      { 类型: '成长六维', 目标: '体质', 数值: 3 },
      { 类型: '特殊能力', 名称: '寿命延长', 数值: 0.3 }
    ]
  }
];
