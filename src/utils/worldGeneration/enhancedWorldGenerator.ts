/**
 * 增强的世界生成器 - 集成数据校验和重试机制
 * 确保生成数据的质量和一致性
 */

import { getTavernHelper, isTavernEnv } from '../tavern';
import { EnhancedWorldPromptBuilder, type WorldPromptConfig } from './enhancedWorldPrompts';
import type { WorldInfo } from '@/types/game.d';
import { calculateSectData, type SectCalculationData } from './sectDataCalculator';
import { WorldMapConfig } from '@/types/worldMap';
import { promptStorage } from '@/services/promptStorage';

// 重新定义 ValidationResult 接口，解除对外部文件的依赖
interface ValidationError {
  path: string;
  message: string;
  expected?: any;
  received?: any;
}
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

 interface RawWorldData {
   continents?: Record<string, any>[];
  factions?: Record<string, any>[];
  locations?: Record<string, any>[];
  [key: string]: any;
}

export interface EnhancedWorldGenConfig {
  worldName?: string;
  worldBackground?: string;
  worldEra?: string;
  factionCount: number;
  locationCount: number;
  secretRealmsCount: number;
  continentCount: number; // 新增大陆数量配置
  maxRetries: number;
  retryDelay: number;
  characterBackground?: string;
  mapConfig?: WorldMapConfig;
  onStreamChunk?: (chunk: string) => void; // 流式输出回调
}

export class EnhancedWorldGenerator {
  private config: EnhancedWorldGenConfig;
  private previousErrors: string[] = [];
  // 保存原始配置，用于重试时的数量计算
  private originalConfig: {
    factionCount: number;
    locationCount: number;
    secretRealmsCount: number;
    continentCount: number;
  };

  constructor(config: EnhancedWorldGenConfig) {
    this.config = config;
    // 保存原始数量配置
    this.originalConfig = {
      factionCount: config.factionCount,
      locationCount: config.locationCount,
      secretRealmsCount: config.secretRealmsCount,
      continentCount: config.continentCount
    };
  }

  /**
   * 生成验证过的世界数据 (重构后)
   */
  async generateValidatedWorld(): Promise<{ success: boolean; worldInfo?: WorldInfo; errors?: string[] }> {
    for (let i = 0; i <= this.config.maxRetries; i++) {
      try {
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * i));
          this.reduceCountsForRetry(i);
        }

        const worldData = await this.generateWorldData();
        const validationResult = this.validateWorldData(worldData);

        if (validationResult.isValid) {
          return { success: true, worldInfo: worldData };
        } else {
          this.previousErrors = validationResult.errors.map(e => e.message);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.previousErrors = [message];
      }
    }

    return { success: false, errors: this.previousErrors };
  }

  /**
   * 重试时减少数量参数，降低token消耗
   * @param retryCount 当前重试次数
   */
  private reduceCountsForRetry(retryCount: number): void {
    const reductionFactor = 0.8;
    const factor = Math.pow(reductionFactor, retryCount);

    this.config.factionCount = Math.max(3, Math.floor(this.originalConfig.factionCount * factor));
    this.config.locationCount = Math.max(5, Math.floor(this.originalConfig.locationCount * factor));
    this.config.secretRealmsCount = Math.max(2, Math.floor(this.originalConfig.secretRealmsCount * factor));
    this.config.continentCount = Math.max(2, Math.floor(this.originalConfig.continentCount * factor));
  }

  /**
   * 生成世界数据 (重构后)
   */
  private async generateWorldData(): Promise<WorldInfo> {
    const tavern = getTavernHelper();
    if (!tavern) {
      throw new Error('AI服务未初始化，请在设置中配置AI服务');
    }

    const prompt = await this.buildPromptWithErrors();

    try {
      const orderedPrompts: Array<{ role: 'system' | 'user'; content: string }> = [
        {
          role: 'user',
          content: prompt
        },
        {
          role: 'user',
          content: '请根据上述要求生成完整的世界数据JSON。'
        }
      ];

      const response = await tavern.generateRaw({
        ordered_prompts: orderedPrompts,
        should_stream: true,
        usageType: 'world_generation',
        overrides: {
          world_info_before: '',
          world_info_after: ''
        },
        onStreamChunk: (chunk: string) => {
          if (this.config.onStreamChunk) {
            this.config.onStreamChunk(chunk);
          }
        }
      });

      const worldData = this.parseAIResponse(String(response));
      return this.convertToWorldInfo(worldData);

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`AI生成失败: ${message}`);
    }
  }

  /**
   * 构建带有错误修正信息的提示词
   * 注意：重试时不添加错误信息，因为数量参数已调整
   */
  private async buildPromptWithErrors(): Promise<string> {
    return await this.buildPrompt();
  }

  /**
   * 构建基础提示词
   * 优先使用用户自定义的提示词，如果没有则使用默认生成的
   */
  private async buildPrompt(): Promise<string> {
      // 优先从 promptStorage 获取用户修改过的提示词
      const customPrompt = await promptStorage.get('worldGeneration');

      // 🔥 彩蛋：酒馆端 70% 概率生成夜宴组织
      // "这个概率就是随机数，超过30%就会生成夜宴组织" -> 随机数(0-100) > 30 -> 70% 概率
      const shouldGenerateNightGala = isTavernEnv() && Math.random() > 0.3;
      if (shouldGenerateNightGala) {
        console.log('[世界生成] 🎲 彩蛋触发：将强制生成夜宴组织');
      }

      // 获取默认提示词用于比较
      const { factionCount, locationCount, secretRealmsCount, continentCount, mapConfig } = this.config;
      const promptConfig: WorldPromptConfig = {
        factionCount,
        totalLocations: locationCount,
        secretRealms: secretRealmsCount,
        continentCount,
        characterBackground: this.config.characterBackground,
        worldBackground: this.config.worldBackground,
        worldEra: this.config.worldEra,
        worldName: this.config.worldName,
        mapConfig: mapConfig
      };
      let defaultPrompt = EnhancedWorldPromptBuilder.buildPrompt(promptConfig);

      // 🔥 注入夜宴组织要求
      if (shouldGenerateNightGala) {
        defaultPrompt += `

【特殊要求】
    请务必在势力列表中包含一个名为"夜宴组织"的势力。设定为黑域或中立，以感官改造与情报交易闻名，组织风格开放诡秘。`;
      }

      // 如果用户有自定义提示词且不为空，使用自定义的
      // 注意：promptStorage.get 在用户未修改时会返回默认值，所以需要检查是否真的被修改过
      if (customPrompt && customPrompt.trim()) {
        // 检查是否是用户修改过的（通过检查 modified 标记）
        const allPrompts = await promptStorage.loadAll();
        if (allPrompts['worldGeneration']?.modified) {
          return customPrompt;
        }
      }

      return defaultPrompt;
    }

  /**
   * 解析AI响应
   */
  private parseAIResponse(response: string): RawWorldData {
    try {
      let jsonMatch = null;
      let jsonText = '';

      jsonMatch = response.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }

      // 🔥 修改：支持仅包含continents的JSON（仅生成大陆模式）
      if (!jsonMatch) {
        // 优先匹配包含continents的完整JSON
        jsonMatch = response.match(/(\{[\s\S]*?"continents"\s*:\s*\[[\s\S]*?\][\s\S]*?\})/);
        if (jsonMatch) {
          jsonText = jsonMatch[1];
        }
      }

      if (!jsonMatch) {
        const jsonMatches = response.match(/\{[\s\S]*?\}/g);
        if (jsonMatches) {
          for (const match of jsonMatches) {
            try {
              const testParse = JSON.parse(match);
              // 🔥 修改：只要有continents就接受（支持仅生成大陆模式）
              if (testParse.continents || testParse.factions || testParse.locations) {
                jsonText = match;
                break;
              }
            } catch {
              continue;
            }
          }
        }
      }

      if (!jsonText) {
        throw new Error('无法解析AI响应中的JSON数据');
      }

      let worldDataRaw = JSON.parse(jsonText);

      if (worldDataRaw.world_data && typeof worldDataRaw.world_data === 'object') {
        worldDataRaw = worldDataRaw.world_data;
      }

      return {
        continents: Array.isArray(worldDataRaw.continents) ? worldDataRaw.continents : [],
        factions: Array.isArray(worldDataRaw.factions) ? worldDataRaw.factions : [],
        locations: Array.isArray(worldDataRaw.locations) ? worldDataRaw.locations : []
      };

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`JSON解析失败: ${message}`);
    }
  }

  /**
   * 转换为标准WorldInfo格式
   */
  private convertToWorldInfo(rawData: RawWorldData): WorldInfo {
    return {
      世界名称: this.config.worldName || rawData.world_name || rawData.worldName || '霓虹域',
      世界背景: this.config.worldBackground || rawData.world_background || rawData.worldBackground || '',
      大陆信息: (rawData.continents || []).map((continent: Record<string, any>) => ({
        名称: continent.名称 || continent.name || '未名大陆',
        描述: continent.描述 || continent.description || '一片霓虹闪烁的赛博大陆，数据脉络交织，势力林立',
        地理特征: continent.terrain_features || continent.地理特征 || [],
        科技生态: continent.tech_ecosystem || continent.科技生态 || '高密度网络与改造设施并存',
        气候: continent.climate || continent.气候 || '四季分明，温和宜人',
        天然屏障: continent.natural_barriers || continent.天然屏障 || [],
        大洲边界: continent.continent_bounds || continent.大洲边界 || []
      })),
      势力信息: (rawData.factions || []).map((faction: Record<string, any>) => {
        // 计算声望与综合战力（若可）
        const calcInput: SectCalculationData = {
          名称: faction.name || faction.名称,
          类型: faction.type || faction.类型 || '企业集团',
          等级: faction.level || faction.等级 || '三流',
          首领阶位: faction.leadership?.首领等级,
          最强阶位: faction.leadership?.最强等级,
          管理层数量: faction.leadership?.顾问数量 ?? faction.memberCount?.byPosition?.顾问 ?? 0,
          核心成员数: faction.leadership?.核心成员数,
          内部成员数: faction.leadership?.内部成员数,
          外围成员数: faction.leadership?.外围成员数
        };
        const calculated = calculateSectData(calcInput);
        const factionName = String(faction.name || faction.名称 || '');
        const isNightGala = factionName.includes('夜宴');

        const leadership = faction.leadership
          ? {
              首领: faction.leadership.首领,
              首领等级: faction.leadership.首领等级,
              副首领: faction.leadership.副首领 ?? undefined,
              特使: isNightGala ? (faction.leadership.特使 ?? undefined) : undefined,
              首席分析师: faction.leadership.首席分析师 ?? undefined,
              首席工程师: faction.leadership.首席工程师 ?? undefined,
              董事: faction.leadership.董事 ?? undefined,
              董事等级: faction.leadership.董事等级 ?? undefined,
              最强等级: faction.leadership.最强等级 || faction.leadership.首领等级,
              综合战力: calculated.综合战力,
              核心成员数: faction.leadership.核心成员数,
              内部成员数: faction.leadership.内部成员数,
              外围成员数: faction.leadership.外围成员数
            }
          : undefined;

        const memberCount = faction.memberCount
          ? {
              total: Number(faction.memberCount.total) || 0,
              byRank: faction.memberCount.byRank || faction.memberCount.byRealm || {},
              byPosition: faction.memberCount.byPosition || {}
            }
          : undefined;

        const territoryInfo = faction.territoryInfo
          ? {
              controlledAreas: faction.territoryInfo.controlledAreas || [],
              influenceRange: faction.territoryInfo.influenceRange,
              strategicValue: faction.territoryInfo.strategicValue
            }
          : undefined;

        return {
          名称: faction.name || faction.名称,
          类型: faction.type || faction.类型,
          等级: faction.level || faction.等级,
          位置: faction.location || faction.headquarters || faction.位置,
          势力范围: faction.territory || faction.territory_bounds || faction.势力范围 || [],
          描述: faction.description || faction.描述,
          特色: faction.specialties || faction.features || faction.特色 || [],
          与玩家关系: faction.与玩家关系 || '中立',
          声望值: calculated.声望值,

          // 同时提供中英字段，兼容旧UI/新生成器
          领导层: leadership,
          leadership,

          成员数量: memberCount
            ? {
                总数: memberCount.total,
                按阶位: memberCount.byRank,
                按职位: memberCount.byPosition,
                ...memberCount
              }
            : undefined,
          memberCount,

          势力范围详情: territoryInfo
            ? {
                控制区域: territoryInfo.controlledAreas,
                影响范围: territoryInfo.influenceRange,
                战略价值: territoryInfo.strategicValue
              }
            : undefined,
          territoryInfo,

          可否加入: faction.canJoin !== undefined ? !!faction.canJoin : true,
          canJoin: faction.canJoin !== undefined ? !!faction.canJoin : true,
          加入条件: faction.joinRequirements || [],
          joinRequirements: faction.joinRequirements || [],
          加入好处: faction.benefits || [],
          benefits: faction.benefits || []
        };
      }),
      地点信息: (rawData.locations || []).map((location: Record<string, any>) => ({
        名称: location.name || location.名称,
        类型: location.type || location.类型,
        位置: location.位置,
        coordinates: location.coordinates,
        描述: location.description || location.描述,
        特色: location.features || location.特色,
        安全等级: location.safety_level || location.danger_level || location.安全等级 || '较安全',
        开放状态: location.status || location.开放状态 || '开放',
        相关势力: location.related_factions || location.相关势力 || [],
        特殊功能: location.special_functions || location.特殊功能 || []
      })),
      地图配置: this.config.mapConfig || (rawData as any).地图配置 || (rawData as any).map_config || {
        width: 10000,
        height: 10000,
        minLng: 0,
        maxLng: 10000,
        minLat: 0,
        maxLat: 10000,
      },
      生成时间: new Date().toISOString(),
      世界纪元: this.config.worldEra || rawData.world_era || '霓虹纪元',
      特殊设定: rawData.special_settings || [],
      版本: '2.0-Enhanced'
    };
  }

  /**
   * 校验世界数据 (重构后)
   */
  private validateWorldData(worldInfo: WorldInfo): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] };
    this.performCustomValidation(worldInfo, result);

    if (!result.isValid) {
      this.previousErrors = result.errors.map(e => e.message);
    }

    return result;
  }

  /**
   * 执行自定义校验
   * 注意：不再检查数量，AI生成多少就是多少
   */
  private performCustomValidation(worldInfo: WorldInfo, result: ValidationResult): void {
    // 势力数量和地点数量不再检查，AI生成多少都接受

    // 检查势力等级分布
    const levelCounts = worldInfo.势力信息.reduce((counts: Record<string, number>, faction) => {
      const level = faction.等级;
      counts[level] = (counts[level] || 0) + 1;
      return counts;
    }, {});

    if (levelCounts['超级'] > 1) {
      result.errors.push({
        path: '势力信息.等级',
        message: '超级势力不能超过1个',
        expected: '1个超级势力',
        received: `${levelCounts['超级']}个超级势力`
      });
    }

    // 检查名称唯一性
    const factionNames = worldInfo.势力信息.map(f => f.名称);
    const uniqueFactionNames = new Set(factionNames);
    if (factionNames.length !== uniqueFactionNames.size) {
      result.errors.push({
        path: '势力信息.名称',
        message: '势力名称存在重复',
        expected: '所有名称唯一',
        received: '存在重复名称'
      });
    }

    const locationNames = worldInfo.地点信息.map(l => l.名称);
    const uniqueLocationNames = new Set(locationNames);
    if (locationNames.length !== uniqueLocationNames.size) {
      result.errors.push({
        path: '地点信息.名称',
        message: '地点名称存在重复',
        expected: '所有名称唯一',
        received: '存在重复名称'
      });
    }

    // 世界名称与用户选择一致性
    if (this.config.worldName && worldInfo.世界名称 !== this.config.worldName) {
      result.errors.push({
        path: '世界名称',
        message: '世界名称必须与玩家选择一致',
        expected: this.config.worldName,
        received: worldInfo.世界名称
      });
    }

    result.isValid = result.errors.length === 0;
  }
}
