/**
 * 游戏元素生成提示词
 *
 * 【职责】
 * - 定义世界、天资、出身、改造核心、天赋、模块等游戏元素的生成规则
 * - 提供详细的字段说明和示例
 * - 定义品质等级和世界观适配规则
 *
 * 【设计原则】
 * - 专注于生成逻辑和字段定义
 * - 通用格式规则从 sharedRules 导入
 * - 避免重复定义JSON格式要求
 */


// 基础指令 - 精简版
const BASE_INSTRUCTION = `**立即执行任务，输出JSON格式的数据。禁止输出确认消息或纯文本！**

你是专业的世界观内容生成器，根据用户提供的主题生成对应风格的内容。

【世界观核心理念】
- 赛博朋克现实主义：科技、阶层、资源与秩序冲突
- 严格按照用户的选择和世界设定来生成内容
- 如果用户指定了特定风格（近未来、反乌托邦、硬科幻等），必须完全遵循该风格
- 不要预设固定剧情方向，让用户自己决定故事走向

【输出格式示例】
\`\`\`json
{
  "name": "示例名称",
  "description": "示例描述",
  "其他字段": "根据具体任务要求"
}
\`\`\`

【输出要求】
1. 所有数值字段必须是数字类型（不要用字符串）
2. 必须使用\`\`\`json代码块包裹
3. 不得添加任何额外的解释说明文字
4. ❌ 禁止输出确认消息（如"法则已刻入天轨"、"明白了"、"收到"等）
5. ❌ 禁止输出纯文本，必须是JSON格式
`;

// 1. 世界生成
export const IMPROVED_WORLD_GENERATION_PROMPT = `${BASE_INSTRUCTION}

【任务】生成世界设定

【字段】name(2-6字)/description(200-400字)/era(5-10字)
`;

// 2. 天资等级
export const IMPROVED_TALENT_TIER_PROMPT = `${BASE_INSTRUCTION}

【任务】生成资质等级

【必填字段】
- name: 资质名称
- description: 描述文字（50-150字）
- total_points: 总点数（数字类型，范围10-50）
- rarity: 稀有度（数字类型，范围1-5）
- color: 颜色（十六进制格式）
`;

// 3. 出身背景 - 优化版
export const IMPROVED_ORIGIN_PROMPT = `${BASE_INSTRUCTION}

【任务】生成背景身份

【字段要求】
-- name (字符串): 4-6字的身份名称
-- description (字符串): 100-300字的背景故事
-- talent_cost (数字): 0-10之间的整数
-- rarity (数字): 1-5之间的整数
-- attribute_modifiers (对象): 基础素质加成，总和不超过5点
-- effects (数组): 1-2个独特效果的文字描述

【输出示例】
\`\`\`json
{
  "name": "街头弃子",
  "description": "自幼在贫民区长大，靠本能与关系求生...",
  "talent_cost": 2,
  "rarity": 3,
  "attribute_modifiers": {
    "体格": 2,
    "反应": -1,
    "智识": 0,
    "幸运": 1,
    "魅力": -1,
    "意志": 1
  },
  "effects": ["街头直觉：在混乱环境中感知力提升", "灰区通行：更容易接触黑市"]
}
\`\`\`
`;

// 4. 改造核心类型 - 优化版
export const IMPROVED_SPIRIT_ROOT_PROMPT = `${BASE_INSTRUCTION}

【任务】生成义体倾向（如神经适配、改造兼容等）

【字段要求】
-- name (字符串): 倾向名称，不含等级前缀
-- tier (字符串): 等级，可选值：基础、增强、军规、原型、禁忌
-- description (字符串): 50-200字的描述
-- cultivation_speed (字符串): 成长速度，格式为"数字x"
- special_effects (数组): 1-3个特殊效果
- base_multiplier (数字): 基础倍率，纯数字
- talent_cost (数字): 3-30之间的整数
- rarity (数字): 1-5之间的整数

【输出示例】
\`\`\`json
{
  "name": "神经低延迟",
  "tier": "增强",
  "description": "神经信号传导效率极高，反应与微操占优...",
  "cultivation_speed": "1.8x",
  "special_effects": ["反应速度提升", "动作误差降低", "操作稳定"],
  "base_multiplier": 1.8,
  "talent_cost": 15,
  "rarity": 4
}
\`\`\`
`;

// 5. 天赋技能 - 优化版
export const IMPROVED_TALENT_PROMPT = `${BASE_INSTRUCTION}

【任务】生成专长

【字段要求】
-- name (字符串): 4-6字的专长名称
-- description (字符串): 30-100字的专长描述

【输出示例】
\`\`\`json
{
  "name": "记忆缓存",
  "description": "对复杂信息的记忆与调用效率显著提升"
}
\`\`\`
`;

// 6. 模块生成 - 优化版
export const IMPROVED_TECHNIQUE_PROMPT = `${BASE_INSTRUCTION}

【任务】生成技能模块

【字段要求】
-- 物品ID (字符串): 唯一标识符，格式："module_" + 拼音或数字
-- 名称 (字符串): 模块名称，2-8字
-- 类型 (字符串): 固定值"模块"
-- 模块效果 (对象): 包含训练速度加成、属性加成、特殊能力
-- 模块技能 (数组): 包含技能名称、描述、消耗、解锁熟练度
- 描述 (字符串): 100-300字的介绍
-- 训练进度 (数字): 初始为0
-- 已装备 (布尔): 初始为false

【品质等级规则】
-- **默认生成民用或改装**。
-- 只有在剧情明确需要"军规级"时才生成**军规**。
-- **特级及以上严禁随意生成**。
-- **禁忌完全禁止生成**。
-- **基础模块名称**必须对应低品质。

【模块技能规则】
- **数量**: 必须包含2-5个技能，不能为空数组。
- **格式**: 每个技能必须包含：技能名称(字符串)、技能描述(字符串)、熟练度要求(数字0-100)
-- **解锁**: 第一个技能的熟练度要求必须为0（开局即可使用）。
  - **世界观**: 消耗必须使用 电量/带宽/生命值/生理耐久；禁止出现其他资源名。
-- **示例**: [{"技能名称":"快速破解","技能描述":"短时提升入侵效率","熟练度要求":0},{"技能名称":"防火墙反制","技能描述":"对追踪进行反制","熟练度要求":30}]
`;

// 导出所有优化的提示词
export const IMPROVED_PROMPTS = {
  WORLD: IMPROVED_WORLD_GENERATION_PROMPT,
  TALENT_TIER: IMPROVED_TALENT_TIER_PROMPT,
  ORIGIN: IMPROVED_ORIGIN_PROMPT,
  SPIRIT_ROOT: IMPROVED_SPIRIT_ROOT_PROMPT,
  TALENT: IMPROVED_TALENT_PROMPT,
  TECHNIQUE: IMPROVED_TECHNIQUE_PROMPT,
};

// 向后兼容的导出（使用旧名称）
export const WORLD_ITEM_GENERATION_PROMPT = IMPROVED_WORLD_GENERATION_PROMPT;
export const TALENT_TIER_ITEM_GENERATION_PROMPT = IMPROVED_TALENT_TIER_PROMPT;
export const ORIGIN_ITEM_GENERATION_PROMPT = IMPROVED_ORIGIN_PROMPT;
export const SPIRIT_ROOT_ITEM_GENERATION_PROMPT = IMPROVED_SPIRIT_ROOT_PROMPT;
export const TALENT_ITEM_GENERATION_PROMPT = IMPROVED_TALENT_PROMPT;
export const TECHNIQUE_ITEM_GENERATION_PROMPT = IMPROVED_TECHNIQUE_PROMPT;


/**
 * @deprecated Placeholder for missing export to resolve build error. Should be removed once the dependency is located and fixed.
 */
export const MAP_GENERATION_PROMPT = ``;
