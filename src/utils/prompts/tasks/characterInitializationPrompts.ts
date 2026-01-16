/**
 * @fileoverview 角色初始化AI提示词
 *
 * 开局流程：世界生成 → 角色初始化（本文件）
 */

import type { World, TalentTier, Origin, SpiritRoot, Talent } from '@/types';
import type { WorldInfo, WorldMapConfig, SystemConfig } from '@/types/game';
import { SAVE_DATA_STRUCTURE, stripNsfwContent } from '../definitions/dataDefinitions';
import { assembleSystemPrompt } from '../promptAssembler';
import { isTavernEnv } from '@/utils/tavern';

// =====================================================================
// 响应格式定义
// =====================================================================

const RESPONSE_FORMAT = `
## 输出格式（最高优先级）

仅输出一个 JSON 对象（可用 \`\`\`json 代码围栏包裹）；不要输出任何解释性文字/标签。

JSON结构：
\`\`\`json
{
  "text": "1200-2500字开局叙事（沉浸式、禁止包含任何游戏数据/JSON/标签）",
  "mid_term_memory": "50-100字摘要（必填，不能为空）",
  "tavern_commands": [
    {"action":"set","key":"元数据.时间","value":{"年":1050,"月":1,"日":1,"小时":8,"分钟":0}},
    {"action":"set","key":"角色.位置","value":{"描述":"大陆·地点","x":5000,"y":5000}},
    {"action":"set","key":"角色.背包.信用点","value":{"低额":100,"中额":0,"高额":0,"最高额":0}}
  ],
  "action_options": ["选项1","选项2","选项3","选项4","选项5"]
}
\`\`\`

要求：
- text 只写故事正文；不要夹带命令、数据、变量名
- tavern_commands 必须是数组；用 {action,key,value} 格式
- action_options 必须输出5个且不能为空
- 严禁输出 \`<thinking>\` / 思维链 / 推理过程
`.trim();

// =====================================================================
// 初始化命令规则
// =====================================================================

const COMMANDS_RULES = `
## 初始化命令（tavern_commands）

按顺序执行：

1. **时间** - 设置 \`元数据.时间\`；并设置 \`角色.身份.出生日期\`（出生年 = 元数据.时间.年 - 开局年龄）
2. **位置** - 设置 \`角色.位置\`，必须包含 {描述, x, y}，从可用地点选择
3. **热度** - 设置 \`角色.属性.声望\`（普通0-10, 城区10-50, 高层50-100）
4. **随机项** - 若“义体倾向/背景”为"随机"，用 \`set\` 写入 \`角色.身份.改造核心\` / \`角色.身份.出生\` 的具体内容
5. **资源** - 设置 \`角色.背包.信用点\` 与 \`角色.背包.物品.{物品ID}\`；技能模块只作为“物品.类型=模块”进入背包
6. **NPC** - 仅创建文本中明确提到的重要人物（0-3个），写入 \`社交.关系.{npcKey}\`
7. **专精** - 若天赋/模块影响专精，写入 \`角色.流派.流派列表.{专精名}\`（完整对象）

约束：
- 所有 key 必须以 \`元数据/角色/社交/世界/系统\` 开头（短路径）
`.trim();

// =====================================================================
// 叙事规则
// =====================================================================

const NARRATIVE_RULES = `
## 叙事要求与文风设定

### 文风基调
- **赛博朋克现实风**: 冷峻、压迫感强，强调技术、秩序与生存压力。
- **沉浸式体验**: 侧重环境噪声、光影、设备负载、人体感知，而非罗列数据。
- **禁止游戏术语**: 文本中严禁出现"玩家"、"获得"、"升级"等出戏词汇。

### 逻辑与难度
- **成长艰难**: 训练与改造需要代价、时间与风险，严禁“瞬间提升”。
- **时间感知**: 必须体现时间流逝与资源消耗。
- **等级严谨**: 只有经过训练与实战积累才能晋升。

### 角色塑造
- **年龄**: 行为举止与年龄认知匹配。
- **一致性**: 背景决定视野与起点，必须与选择一致。
`.trim();

// =====================================================================
// 资源范围参考
// =====================================================================

const RESOURCE_RANGES = `
## 初始资源控制（严格执行）

### 信用点 (基于背景)
- **底层/流浪**: 0-100
- **普通/雇员**: 100-500
- **公司体系**: 800-2000
- **高危高薪**: 2000-5000

### 物品与装备
- **数量限制**: 1-5件，宁缺毋滥。
- **品质限制**: 初始物品以**民用/改装**为主。严禁开局直接给予“禁忌”装备。
- **技能模块**: 0-2个，多数开局不应自带高阶模块。

### NPC与关系
- **数量**: 0-3个（重要人物）。
- **关系**: 初始好感度不宜过高，体现现实关系成本。

### 等级判定
- **街头人**: 绝大多数开局应为街头人（进度0）。
- **跑者**: 仅当背景合理时允许进入低阶跑者。
`.trim();

// =====================================================================
// 导出的提示词常量（用于提示词管理UI显示）
// =====================================================================

export const CHARACTER_INITIALIZATION_PROMPT = `
# 角色初始化任务

${RESPONSE_FORMAT}

---

${COMMANDS_RULES}

---

${NARRATIVE_RULES}

---

${RESOURCE_RANGES}

---

# 数据结构
${SAVE_DATA_STRUCTURE}
`.trim();

export function getCharacterInitializationPromptForEnv(isTavern: boolean): string {
  if (isTavern) return CHARACTER_INITIALIZATION_PROMPT;
  return stripNsfwContent(CHARACTER_INITIALIZATION_PROMPT);
}

// =====================================================================
// 构建函数
// =====================================================================

interface ContextItem {
  name?: string;
  名称?: string;
  description?: string;
  描述?: string;
  type?: string;
  类型?: string;
}

/**
 * 构建玩家选择摘要
 */
export function buildCharacterSelectionsSummary(
  userSelections: {
    name: string;
    gender: string;
    race: string;
    age: number;
    world: World;
    talentTier: TalentTier;
    origin: Origin | string;
    spiritRoot: SpiritRoot | string;
    talents: Talent[];
    attributes: Record<string, number>;
    difficultyPrompt?: string; // 难度提示词
  },
  worldContext?: {
    worldInfo?: WorldInfo;
    availableContinents?: ContextItem[];
    availableLocations?: ContextItem[];
    mapConfig?: WorldMapConfig;
    systemSettings?: SystemConfig;
  }
): string {
  // 提取数据
  const { name, gender, race, age, world, talentTier, origin, spiritRoot, talents, attributes, difficultyPrompt } = userSelections;

  const originIsObj = typeof origin === 'object' && origin !== null;
  const spiritRootIsObj = typeof spiritRoot === 'object' && spiritRoot !== null;

  // 格式化天赋列表
  const talentsList = talents.length > 0
    ? talents.map(t => `- ${t.name}: ${t.description}`).join('\n')
    : '无';

  // 格式化属性
  const attrList = Object.entries(attributes).map(([k, v]) => `${k}:${v}`).join(', ');

  // 格式化地点
  const continents = worldContext?.availableContinents
    ?.map(c => `- ${c.name || c.名称}`)
    .join('\n') || '(未生成)';

  const locations = worldContext?.availableLocations
    ?.slice(0, 8)
    .map(l => `- ${l.name || l.名称} (${l.type || l.类型})`)
    .join('\n') || '(未生成)';

  return `
# 玩家角色数据

## 基础信息
姓名: ${name} | 性别: ${gender} | 种族: ${race} | 年龄: ${age}岁

## 世界
${world.name} (${world.era})
${world.description}

## 天资
${talentTier.name}: ${talentTier.description}

## 出身
${originIsObj ? (origin as Origin).name : origin}: ${originIsObj ? (origin as Origin).description : '(随机，需AI生成)'}

## 改造核心
${spiritRootIsObj ? `${(spiritRoot as SpiritRoot).name} (${(spiritRoot as SpiritRoot).tier})` : spiritRoot}: ${spiritRootIsObj ? (spiritRoot as SpiritRoot).description : '(随机，需AI生成)'}

## 天赋
${talentsList}

## 初始六维
${attrList}

---

## 可用地点
**大陆**:
${continents}

**地点**:
${locations}

⚠️ 位置必须从上述地点选择，坐标范围: x:0-10000, y:0-10000

---

## 难度设置
${difficultyPrompt || '【难度模式：普通】\n- 世界遵循正常赛博规则，风险与资源并存'}

---

## 系统设置
${worldContext?.systemSettings?.nsfwMode ? `- **NSFW模式**: 已开启
- **私密信息生成范围**: ${worldContext?.systemSettings?.nsfwGenderFilter === 'all' ? '所有NPC' : worldContext?.systemSettings?.nsfwGenderFilter === 'female' ? '仅女性NPC' : '仅男性NPC'}
⚠️ 创建NPC时，若NPC性别符合上述范围，必须生成完整的"私密信息(PrivacyProfile)"字段` : '- **NSFW模式**: 已关闭（不生成私密信息）'}

---

## 输出要求
严格遵循系统的JSON输出规则：
- 不要输出 \`<thinking>\` / 思维链 / 任何推理过程标签
- 正文写入 JSON 的 "text" 字段（不要再输出 "<narrative>" 等标签）
- 行动选项写入 JSON 的 "action_options" 字段（5个）
`.trim();
}

/**
 * 构建角色初始化系统提示词
 */
export async function buildCharacterInitializationPrompt(): Promise<string> {
  const basePrompt = await assembleSystemPrompt([]);

  const prompt = `${basePrompt}

---

# 当前任务：角色初始化

你现在需要执行角色初始化任务。用户将提供角色的基础信息（姓名、性别、年龄、天赋、改造核心、出身等），你需要：
1. 根据用户选择生成1200-2500字的开局叙事
2. 通过tavern_commands设置初始数据（时间、位置、资源、NPC等）
3. 输出5个行动选项

**立即执行任务，输出JSON格式的角色初始化数据。**

---

${RESPONSE_FORMAT}

---

${COMMANDS_RULES}

---

${NARRATIVE_RULES}

---

${RESOURCE_RANGES}
`.trim();

  return isTavernEnv() ? prompt : stripNsfwContent(prompt);
}

/**
 * 地点名称生成提示词
 */
export const LOCATION_NAME_GENERATION_PROMPT = `
# 任务：生成层级地点名

输入: INPUT_PLACEHOLDER
输出: {"location_name": "区域·建筑·场所"}

要求:
1. 2-3层级，用"·"分隔
2. 体现世界特点
3. 只返回JSON
`.trim();

export const GAME_START_INITIALIZATION_PROMPT = '';
