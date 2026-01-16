<template>
  <div class="character-details-wrapper">
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>{{ t('加载角色数据..') }}</p>
    </div>

    <div v-else-if="!baseInfo || !saveData" class="error-container">
      <div class="error-icon">
        <AlertCircle :size="48" />
      </div>
      <p>{{ t('无法加载角色数据') }}</p>
      <button class="retry-btn" @click="refreshData">{{ t('重试') }}</button>
    </div>

    <div v-else-if="baseInfo" class="character-details-content">
      <!-- 顶部角色信息卡片 - 全新设计 -->
      <div class="character-header-card">
        <!-- 背景装饰 -->
        <div class="header-bg-decoration"></div>

        <!-- 主要信息区 -->
        <div class="header-content">
          <!-- 左侧：头像和基础信息 -->
          <div class="profile-section">
            <div class="avatar-wrapper">
              <div class="avatar-circle" :title="baseInfo.名字">
                <span class="avatar-text">{{ nameInitial }}</span>
              </div>
              <div class="avatar-glow"></div>
            </div>

            <div class="identity-info">
              <h1 class="character-title">{{ baseInfo.名字 }}</h1>
              <div class="character-subtitle">
                <template v-if="baseInfo.性别">
                  <span class="subtitle-item" :class="`gender-badge gender-${baseInfo.性别}`">
                    {{ (baseInfo.性别 === '男' ? '♂' : '♀') + ' ' + t(baseInfo.性别) }}
                  </span>
                  <span class="subtitle-divider">·</span>
                </template>
                <span class="subtitle-item race-text">{{ t(baseInfo.种族 || '人族') }}</span>
                <span class="subtitle-divider">·</span>
                <span class="subtitle-item age-text">{{ currentAge }}{{ t('岁') }}</span>
                <span class="subtitle-divider">·</span>
                <span class="subtitle-item origin-text">
                  {{ getOriginDisplay(baseInfo.出生) }}
                </span>
              </div>
            </div>
          </div>

          <!-- 中间：核心数据卡片组 -->
          <div class="core-stats-grid">
            <!-- 等级卡片 -->
            <div class="stat-card rank-card">
              <div class="card-icon">
                <Mountain :size="20" />
              </div>
              <div class="card-content">
                <div class="card-label">{{ t('等级') }}</div>
                <div class="card-value rank-value">{{ formatRankDisplay(playerStatus?.阶位?.名称) || t('新手') }}</div>
              </div>
            </div>

            <!-- 改造核心卡片 -->
            <div class="stat-card core-card" v-if="baseInfo.改造核心">
              <div class="card-icon">
                <Sparkles :size="20" />
              </div>
              <div class="card-content">
                <div class="card-label">{{ t('改造核心') }}</div>
                <div class="card-value core-value">{{ formatCore(baseInfo.改造核心) }}</div>
              </div>
            </div>

            <!-- 位置卡片 -->
            <div class="stat-card location-card" v-if="playerLocation?.描述" :title="playerLocation.描述">
              <div class="card-icon">
                <MapPin :size="20" />
              </div>
              <div class="card-content">
                <div class="card-label">{{ t('位置') }}</div>
                <div class="card-value location-value">{{ playerLocation.描述 }}</div>
              </div>
            </div>

            <!-- 机体（仅酒馆端） -->
            <div
              v-if="isTavernEnvFlag"
              class="stat-card body-card clickable"
              @click="activeTab = 'body'"
              :title="t('点击查看身体档案')"
            >
              <div class="card-icon">
                <Heart :size="20" />
              </div>
              <div class="card-content">
                <div class="card-label">{{ t('机体') }}</div>
                <div class="card-value body-value">{{ bodySummary }}</div>
              </div>
            </div>

            <!-- 出生卡片 -->
            <div
              class="stat-card origin-card clickable"
              v-if="baseInfo.出生"
              @click="showOriginDetails(baseInfo.出生)"
              :title="typeof baseInfo.出生 === 'object' ? t('点击查看详情') : ''"
            >
              <div class="card-icon">
                <Sprout :size="20" />
              </div>
              <div class="card-content">
                <div class="card-label">{{ t('出生') }}</div>
                <div class="card-value origin-value">{{ getOriginDisplay(baseInfo.出生) }}</div>
              </div>
            </div>
          </div>

          <!-- 右侧：等级进度 -->
          <div class="training-section">
            <div v-if="isUninitializedStage(playerStatus?.阶位?.名称)" class="training-status mortal-status">
              <div class="status-icon">🌱</div>
              <div class="status-text">{{ getUninitializedStageDisplay() }}</div>
            </div>
            <div v-else-if="hasValidTraining()" class="training-progress-card">
              <div class="progress-header">
                <span class="progress-label">{{ t('等级进度') }}</span>
                <span class="progress-percentage">{{ getTrainingProgress() }}%</span>
              </div>
              <div class="progress-bar-container">
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" :style="{ width: getTrainingProgress() + '%' }">
                    <div class="progress-bar-shine"></div>
                  </div>
                </div>
              </div>
              <div class="progress-text">{{ formatTrainingText() }}</div>
            </div>
            <div v-else class="training-status waiting-status">
              <div class="status-icon"><Sparkles :size="18" /></div>
              <div class="status-text">{{ t('等待任务') }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 标签页导航 -->
      <div class="tabs-nav">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="['tab-btn', { active: activeTab === tab.id }]"
        >
          <component :is="tab.icon" :size="16" />
          <span>{{ t(tab.label) }}</span>
        </button>
      </div>

      <!-- 角色信息标签页 -->
      <div v-if="activeTab === 'character'" class="tab-content">
        <div class="content-grid">
          <!-- 生命状态 -->
      <div class="info-section">
        <h3 class="section-title">
          <div class="title-icon">
            <Heart :size="18" />
          </div>
          {{ t('生命状态') }}
        </h3>
            <div class="vitals-grid">
              <div class="vital-item" v-for="vital in vitalsData" :key="vital.label">
                <div class="vital-label">{{ vital.label }}</div>
                <div class="vital-bar">
                  <div class="bar-container">
                    <div
                      class="bar-fill"
                      :class="`bar-${vital.color}`"
                      :style="{ width: getPercentage(vital.current, vital.max) + '%' }"
                    ></div>
                  </div>
                  <div class="vital-text">{{ vital.current }}/{{ vital.max }}</div>
                </div>
              </div>
              <!-- 声望显示 -->
              <div class="vital-item reputation-item">
                <div class="vital-label">{{ t('声望') }}</div>
                <div class="reputation-display">
                  <span class="reputation-value">
                    {{ playerStatus?.声望 || t('籍籍无名') }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 角色基础信息 -->
          <div class="info-section">
            <h3 class="section-title">
              <div class="title-icon">
                <Users :size="18" />
              </div>
              {{ t('角色背景') }}
            </h3>
            <div class="basic-info-grid">
              <div class="basic-info-item">
                <span class="info-label">{{ t('等级') }}</span>
                <span class="info-value rank">{{ formatRankDisplay(playerStatus?.阶位) }}</span>
              </div>
              <div v-if="baseInfo.性别" class="basic-info-item">
                <span class="info-label">{{ t('性别') }}</span>
                <span class="info-value gender" :class="`gender-${baseInfo.性别}`">{{ t(baseInfo.性别) }}</span>
              </div>
              <div class="basic-info-item">
                <span class="info-label">{{ t('改造核心') }}</span>
                <span class="info-value core" :class="`core-${getCoreClass(baseInfo.改造核心)}`">{{ getCoreDisplay(baseInfo.改造核心) }}</span>
              </div>
              <div class="basic-info-item">
                <span class="info-label">{{ t('年龄') }}</span>
                <span class="info-value">{{ currentAge }}{{ t('岁') }}</span>
              </div>
              <div v-if="playerLocation?.描述" class="basic-info-item">
                <span class="info-label">{{ t('位置') }}</span>
                <span class="info-value location">{{ playerLocation.描述 }}</span>
              </div>
              <div v-else-if="baseInfo.世界" class="basic-info-item">
                <span class="info-label">{{ t('世界') }}</span>
                <span class="info-value world">{{ baseInfo.世界 }}</span>
              </div>
            </div>
          </div>

            <!-- 模块与改造核心 -->
      <div class="info-section">
        <h3 class="section-title">
          <div class="title-icon">
            <Sparkles :size="18" />
          </div>
          {{ t('模块与改造核心') }}
        </h3>
        <div class="talent-content">
          <!-- 模块阶位卡片 -->
          <div class="module-tier-card">
            <div class="tier-header">
              <div class="tier-icon"><Star :size="18" /></div>
              <span class="tier-label">{{ t('模块阶位') }}</span>
            </div>
            <div class="tier-value-display">
              <span class="tier-value" :class="`tier-${getModuleTierName(baseInfo.模块阶位)}`">{{ getModuleTierName(baseInfo.模块阶位) }}</span>
            </div>
            <div v-if="getModuleTierDescription(baseInfo.模块阶位)" class="tier-description">
              {{ getModuleTierDescription(baseInfo.模块阶位) }}
            </div>
          </div>

          <!-- 改造核心属性卡片 (Re-designed) -->
          <div class="core-card" @click="showCoreDetails">
            <div class="root-header">
              <div class="root-icon"><Zap :size="18" /></div>
              <span class="root-label">{{ t('改造核心属性') }}</span>
              <span class="click-hint">{{ t('点击查看详情') }}</span>
            </div>
            <div class="root-main-info">
              <span class="root-name" :class="`core-${getCoreClass(baseInfo.改造核心)}`">
                {{ getCoreDisplay(baseInfo.改造核心) }}
              </span>
              <div class="property-badges">
                <span class="prop-badge grade-badge" :class="`grade-${getCoreGrade(baseInfo.改造核心) || '民用'}`">
                  {{ t(getCoreGradeDisplay(baseInfo.改造核心)) }}
                </span>
                <span class="prop-badge speed-badge">
                  {{ getCoreTrainingSpeed(baseInfo) }}
                </span>
              </div>
            </div>
            <div v-if="getCoreDescription(baseInfo.改造核心)" class="root-description">
              {{ getCoreDescription(baseInfo.改造核心) }}
            </div>
            <div v-if="getCoreEffects(baseInfo).length > 0" class="root-effects">
              <div class="effects-tags">
                <span v-for="effect in getCoreEffects(baseInfo)" :key="effect" class="effect-tag">
                  {{ effect }}
                </span>
              </div>
            </div>
          </div>

          <!-- 模块列表卡片 -->
          <div class="modules-card">
            <div class="talents-header">
              <div class="talents-icon"><Sparkles :size="18" /></div>
              <span class="talents-label">{{ t('模块特质') }}</span>
              <span v-if="getModuleList(baseInfo.模块)?.length" class="talents-count">({{ getModuleList(baseInfo.模块).length }})</span>
            </div>
            <div v-if="getModuleList(baseInfo.模块)?.length" class="talents-container">
              <div v-for="talent in getModuleList(baseInfo.模块)" :key="talent.name"
                   class="talent-item" :title="talent.description">
                <div class="talent-name"><strong>{{ talent.name }}</strong></div>
                <div v-if="talent.description" class="talent-description-display">
                  {{ talent.description }}
                </div>
              </div>
            </div>
            <div v-else class="talents-container no-talents">
              <div class="talent-item no-talent">
                <div class="talent-name">{{ t('无') }}</div>
              </div>
            </div>
          </div>
        </div>
          </div>

          <!-- 六维属性 -->
          <div class="info-section">
            <h3 class="section-title">
              <div class="title-icon">
                <BarChart3 :size="18" />
              </div>
              {{ t('六维属性') }}
            </h3>
            <div class="attributes-display">
              <!-- 最终属性 -->
              <div class="final-attributes">
                <h4 class="attribute-group-title">{{ t('最终六维') }}</h4>
                <div class="attributes-grid">
                  <div v-for="(value, key) in finalAttributes" :key="key" class="attribute-item final">
                    <span class="attr-name">{{ t(String(key)) }}</span>
                    <span class="attr-value">{{ value }}</span>
                  </div>
                </div>
              </div>

              <!-- 属性详情 -->
              <div class="attribute-breakdown">
                <div class="innate-attrs">
                  <h4 class="attribute-group-title">{{ t('初始六维') }}</h4>
                  <div class="attributes-grid compact">
                    <div v-for="(value, key) in innateAttributesWithDefaults" :key="key" class="attribute-item innate">
                      <span class="attr-name">{{ t(String(key)) }}</span>
                      <span class="attr-value">{{ value }}</span>
                    </div>
                  </div>
                </div>

                <div class="acquired-attrs">
                  <h4 class="attribute-group-title">{{ t('成长六维') }}</h4>
                  <div class="attributes-grid compact">
                    <div v-for="(value, key) in acquiredAttributes" :key="key" class="attribute-item acquired"
                         :class="{ 'has-bonus': value > 0 }">
                      <span class="attr-name">{{ t(String(key)) }}</span>
                      <span class="attr-value">{{ value > 0 ? `+${value}` : value }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- 身体档案标签页（仅酒馆端） -->
      <div v-if="isTavernEnvFlag && activeTab === 'body'" class="tab-content">
        <div class="content-grid">
          <div class="info-section">
            <h3 class="section-title">
              <div class="title-icon">
                <Heart :size="18" />
              </div>
              {{ t('身体档案') }}
            </h3>
            <BodyStatsPanel :body-stats="bodyStats" :lifespan="lifespanForBodyPanel" />
          </div>
        </div>
      </div>

      <!-- 训练体系标签页 -->
      <div v-if="activeTab === 'training'" class="tab-content">
        <div class="content-grid">
          <!-- 训练模块 -->
          <div class="info-section">
            <h3 class="section-title">
              <div class="title-icon">
                <BookOpen :size="18" />
              </div>
              {{ t('训练模块') }}
            </h3>
            <div v-if="!fullTrainingProgram" class="empty-state">
              <div class="empty-icon">
                <BookOpen :size="32" />
              </div>
              <span>{{ t('尚未训练模块') }}</span>
            </div>
            <div v-else class="training-display">
              <div class="program-info">
                <div class="program-header" @click="toggleProgramDetails">
                  <div class="program-main">
                    <h4 class="program-name" :class="getItemQualityClass(fullTrainingProgram, 'text')">
                      {{ fullTrainingProgram?.名称 }}
                    </h4>
                    <div class="program-quality">
                      {{ t(fullTrainingProgram?.品质?.quality || '未知') }}{{ t('品') }}{{ fullTrainingProgram?.品质?.grade ? `${fullTrainingProgram.品质.grade}${t('阶')}` : '' }}</div>
                  </div>
                  <div class="program-toggle">
                    <ChevronDown
                      :size="16"
                      :class="{ 'rotated': showProgramDetails }"
                      class="toggle-icon"
                    />
                  </div>
                </div>

                <!-- 模块详情（可折叠） -->
                <div v-show="showProgramDetails" class="program-details">
                  <div class="program-description">
                    <p>{{ t(fullTrainingProgram?.描述 || '此模块潜力巨大，随训练加深方可解锁其性能。') }}</p>
                  </div>

                  <div v-if="hasProgramEffects && fullTrainingProgram?.程序效果" class="program-effects">
                    <h5 class="effects-title">{{ t('模块效果') }}</h5>
                    <div class="effects-list">
                      <div v-if="fullTrainingProgram.程序效果.训练速度加成" class="effect-item">
                        <span class="effect-label">{{ t('训练加成：') }}</span>
                        <span class="effect-value">{{ (fullTrainingProgram.程序效果.训练速度加成 * 100).toFixed(0) }}%</span>
                      </div>
                      <div v-if="fullTrainingProgram.程序效果.属性加成" class="effect-item">
                        <span class="effect-label">{{ t('属性提升：') }}</span>
                        <div class="attribute-bonuses">
                          <span
                            v-for="(value, attr) in fullTrainingProgram.程序效果.属性加成"
                            :key="attr"
                            class="bonus-tag"
                          >
                            {{ t(String(attr)) }} +{{ value }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-else-if="fullTrainingProgram" class="program-effects no-effects">
                    <h5 class="effects-title">{{ t('模块效果') }}</h5>
                    <p class="no-effects-text">{{ t('此模块无特殊效果') }}</p>
                  </div>
                </div>

                <div class="program-progress">
                  <div class="progress-item" v-if="fullTrainingProgram">
                    <span class="progress-label">{{ t('模块进度') }}</span>
                    <div class="progress-bar">
                      <div class="progress-fill" :style="{ width: Math.max(2, fullTrainingProgram.训练进度 || 0) + '%' }"></div>
                    </div>
                    <span class="progress-text">{{ fullTrainingProgram.训练进度 || 0 }}%</span>
                  </div>
                </div>
              </div>

              <!-- 已学技能 -->
              <div v-if="allLearnedSkills.length" class="learned-skills">
                <div class="skills-header" @click="toggleSkillsDetails">
                  <h4 class="skills-title">{{ t('已掌握技能') }}</h4>
                  <div class="skills-count">({{ totalSkillsCount }}{{ t('个') }})</div>
                  <ChevronDown
                    :size="14"
                    :class="{ 'rotated': isSkillsExpanded }"
                    class="toggle-icon"
                  />
                </div>

                <div v-show="!isSkillsExpanded" class="skills-preview">
                  <div class="skills-list-compact">
                    <span
                      v-for="skill in allLearnedSkills.slice(0, 3)"
                      :key="skill.name"
                      class="skill-tag compact"
                    >
                      {{ skill.name }}
                    </span>
                    <span v-if="totalSkillsCount > 3" class="more-skills">...</span>
                  </div>
                </div>

                <div v-show="isSkillsExpanded" class="skills-details">
                  <!-- 所有已掌握的技能 -->
                  <div v-if="allLearnedSkills.length" class="skill-category">
                    <h5 class="category-title">{{ t('所有技能') }}</h5>
                    <div class="skills-grid">
                      <div
                        v-for="skill in allLearnedSkills"
                        :key="skill.name"
                        class="skill-card"
                        @click="showSkillDetails(skill)"
                      >
                        <div class="skill-name">{{ skill.name }}</div>
                        <div class="skill-type">{{ t(skill.type) }}</div>
                        <div class="skill-source">{{ skill.source }}</div>
                        <div class="skill-proficiency-mini">
                          {{ t('熟练度') }} {{ skill.proficiency }}%
                        </div>
                        <div class="skill-status">
                          <Star :size="12" class="unlock-icon" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 未解锁的程序技能 -->
                  <div v-if="skillsList.length > 0" class="skill-category">
                    <h5 class="category-title">{{ t('未解锁技能') }}</h5>
                    <div class="skills-grid">
                      <div
                        v-for="skill in skillsList"
                        :key="skill.name"
                        class="skill-card skill-locked"
                        @click="showSkillDetails(skill)"
                      >
                        <div class="skill-name">{{ skill.name }}</div>
                        <div class="skill-type">{{ t(skill.type) }}</div>
                        <div class="skill-unlock">
                          {{ skill.unlockCondition }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 三千流派 -->
          <div class="info-section">
            <h3 class="section-title">
              <div class="title-icon">
                <Zap :size="18" />
              </div>
              {{ t('三千流派') }}
            </h3>
            <div v-if="!unlockedProtocolList.length" class="empty-state">
              <div class="empty-icon">
                <Sprout :size="32" />
              </div>
              <span>{{ t('尚未解锁流派') }}</span>
            </div>
            <div v-else class="protocol-list">
              <div class="protocol-header-section">
                <div class="protocol-summary">
                  <span class="protocol-count">{{ t('已解') }} {{ unlockedProtocolList.length }} {{ t('条流派') }}</span>
                  <button class="protocol-expand-btn" @click="toggleProtocolDetails">
                    <span>{{ showProtocolDetails ? t('收起') : t('展开') }}</span>
                    <ChevronDown
                      :size="14"
                      :class="{ 'rotated': showProtocolDetails }"
                      class="toggle-icon"
                    />
                  </button>
                </div>
              </div>

              <div v-show="!showProtocolDetails" class="protocol-preview">
                <div
                  v-for="protocolName in unlockedProtocolList.slice(0, 2).map(d => d.流派名)"
                  :key="protocolName"
                  class="protocol-item compact"
                  @click="showProtocolInfo(protocolName)"
                >
                  <div class="protocol-header">
                    <span class="protocol-name">{{ protocolName }}</span>
                    <span class="protocol-stage">{{ t('第') }}{{ getProtocolStage(protocolName) }}{{ t('阶段') }}</span>
                  </div>
                  <div class="protocol-progress">
                    <div class="progress-bar small">
                      <div class="progress-fill" :style="{ width: getProtocolProgress(protocolName) + '%' }"></div>
                    </div>
                    <span class="progress-text small">{{ getProtocolProgress(protocolName) }}%</span>
                  </div>
                </div>
                <div v-if="unlockedProtocolList.length > 2" class="more-protocol">
                  {{ t('还有') }} {{ unlockedProtocolList.length - 2 }} {{ t('条流派..') }}
                </div>
              </div>

              <div v-show="showProtocolDetails" class="protocol-details">
                <div
                  v-for="protocolName in unlockedProtocolList.map(d => d.流派名)"
                  :key="protocolName"
                  class="protocol-item detailed"
                  @click="showProtocolInfo(protocolName)"
                >
                  <div class="protocol-header">
                    <span class="protocol-name">{{ protocolName }}</span>
                    <span class="protocol-stage">{{ t('第') }}{{ getProtocolStage(protocolName) }}{{ t('阶段') }}</span>
                  </div>
                  <div class="protocol-progress">
                    <div class="progress-bar small">
                      <div class="progress-fill" :style="{ width: getProtocolProgress(protocolName) + '%' }"></div>
                    </div>
                    <span class="progress-text small">{{ getProtocolProgress(protocolName) }}%</span>
                  </div>

                  <div class="protocol-stats">
                    <div class="stat-item">
                      <span class="stat-label">{{ t('当前经验') }}</span>
                      <span class="stat-value">{{ getProtocolCurrentExp(protocolName) }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">{{ t('总经验') }}</span>
                      <span class="stat-value">{{ getProtocolTotalExp(protocolName) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- 社交关系标签页 -->
      <div v-if="activeTab === 'social'" class="tab-content">
        <div class="content-grid">
          <!-- 人际关系 -->
          <div class="info-section">
            <h3 class="section-title">
              <div class="title-icon">
                <Users :size="18" />
              </div>
              {{ t('人际关系') }}
            </h3>
            <div v-if="!relationshipCount" class="empty-state">
              <div class="empty-icon">
                <Handshake :size="32" />
              </div>
              <span>{{ t('暂无人际关系') }}</span>
            </div>
            <div v-else class="relationships-summary">
              <div class="relationship-stats">
                <div class="stat-item">
                  <span class="stat-label">{{ t('总人数') }}</span>
                  <span class="stat-value">{{ relationshipCount }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">{{ t('平均好感') }}</span>
                  <span class="stat-value">{{ averageFavorability }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 背包概览 -->
          <div class="info-section">
            <h3 class="section-title">
              <div class="title-icon">
                <Backpack :size="18" />
              </div>
              {{ t('背包概览') }}
            </h3>
            <div class="inventory-summary">
              <div class="inventory-stats">
                <div class="stat-group">
                  <div class="stat-item">
                    <span class="stat-label">{{ t('物品总数') }}</span>
                    <span class="stat-value">{{ inventoryItemCount }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">{{ t('装备数量') }}</span>
                    <span class="stat-value">{{ getItemTypeCount('装备') }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">{{ t('模块数量') }}</span>
                    <span class="stat-value">{{ getItemTypeCount('程序') }}</span>
                  </div>
                </div>
              </div>

              <div class="credit-reserves">
                <h4 class="stones-title">{{ t('信用点储备') }}</h4>
                <div class="stones-grid">
                  <div v-for="grade in creditGrades" :key="grade.name"
                       class="stone-item" :class="grade.class">
                    <span class="stone-name">{{ grade.name }}</span>
                    <span class="stone-count">{{ getCreditCount(grade.name as '低级' | '中级' | '高级' | '顶级') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 组织信息 -->
          <div class="info-section" v-if="playerFactionInfo">
            <h3 class="section-title">
              <div class="title-icon">
                <Mountain :size="18" />
              </div>
              {{ t('组织信息') }}
            </h3>
            <div class="faction-info">
              <div class="faction-header">
                <h4 class="faction-name">{{ playerFactionInfo?.组织名称 }}</h4>
                <span class="faction-type">{{ formatFactionType(playerFactionInfo?.组织类型) }}</span>
              </div>
              <div class="faction-details">
                <div class="detail-row">
                  <span class="detail-label">{{ t('职位') }}</span>
                  <span class="detail-value">{{ playerFactionInfo?.职位 }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">{{ t('贡献值') }}</span>
                  <span class="detail-value">{{ playerFactionInfo?.贡献 }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">{{ t('关系') }}</span>
                  <span class="detail-value" :class="`relationship-${playerFactionInfo?.关系}`">
                    {{ playerFactionInfo?.关系 }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 技能详情弹窗 -->
      <div v-if="showSkillModal" class="modal-overlay" @click="closeModals">
        <div class="skill-modal" @click.stop>
          <div class="modal-header">
            <h3>{{ getSkillModalContent()?.name }}</h3>
            <button class="modal-close-btn" @click="closeModals">
              <X :size="20" />
            </button>
          </div>
          <div class="modal-content">
            <div class="skill-detail-grid">
              <div class="skill-detail-item">
                <span class="detail-label">{{ t('类型') }}</span>
                <span class="detail-value">{{ t(getSkillModalContent()?.type ?? '未知') }}</span>
              </div>
              <div class="skill-detail-item">
                <span class="detail-label">{{ t('状态') }}</span>
                <span class="detail-value" :class="`status-${getSkillModalContent()?.status === '已解锁' ? 'unlocked' : 'locked'}`">
                  {{ t(getSkillModalContent()?.status ?? '未知') }}
                </span>
              </div>
              <div class="skill-detail-item">
                <span class="detail-label">{{ t('熟练度') }}</span>
                <span class="detail-value">{{ getSkillModalContent()?.proficiency ? getSkillModalContent()?.proficiency + '%' : t('未知') }}</span>
              </div>
              <div class="skill-detail-item">
                <span class="detail-label">{{ t('解锁条件') }}</span>
                <span class="detail-value">{{ getSkillModalContent()?.condition }}</span>
              </div>
              <div class="skill-detail-item">
                <span class="detail-label">{{ t('技能来源') }}</span>
                <span class="detail-value">{{ getSkillModalContent()?.source }}</span>
              </div>
            </div>
            <div class="skill-description">
              <h4>{{ t('技能描述') }}</h4>
              <p>{{ getSkillModalContent()?.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 流派详情弹窗 -->
      <div v-if="showProtocolModal" class="modal-overlay" @click="closeModals">
        <div class="protocol-modal" @click.stop>
          <div class="modal-header">
            <h3>{{ getProtocolModalContent()?.name }}</h3>
            <button class="modal-close-btn" @click="closeModals">
              <X :size="20" />
            </button>
          </div>
          <div class="modal-content">
            <div class="protocol-progress-section">
              <div class="protocol-stage-info">
                <span class="stage-label">{{ t('当前阶段') }}</span>
                <span class="stage-value">{{ getProtocolModalContent()?.stage }}</span>
              </div>
              <div class="protocol-progress-bar">
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" :style="{ width: (getProtocolModalContent()?.progressPercent || 0) + '%' }"></div>
                </div>
                <span class="progress-text">{{ getProtocolModalContent()?.progressPercent }}%</span>
              </div>
            </div>
            <div class="protocol-stats-grid">
              <div class="protocol-stat-item">
                <span class="stat-label">{{ t('当前经验') }}</span>
                <span class="stat-value">{{ getProtocolModalContent()?.currentExp }}</span>
              </div>
              <div class="protocol-stat-item">
                <span class="stat-label">{{ t('总经验') }}</span>
                <span class="stat-value">{{ getProtocolModalContent()?.totalExp }}</span>
              </div>
            </div>
            <div class="protocol-description">
              <h4>{{ t('训练感悟') }}</h4>
              <p>{{ getProtocolModalContent()?.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 改造核心详情弹窗 (Re-designed) -->
      <div v-if="showCoreModal" class="modal-overlay" @click="closeModals">
        <div class="core-modal" @click.stop>
          <div class="modal-header">
            <h3>{{ getCoreDisplay(baseInfo.改造核心) }} {{ t('详情') }}</h3>
            <button class="modal-close-btn" @click="closeModals">
              <X :size="20" />
            </button>
          </div>
          <div class="modal-content">
            <div class="core-detail-grid">
              <div class="detail-item">
                <span class="detail-label">{{ t('类型') }}</span>
                <div class="detail-value type-value" :class="`core-${getCoreClass(baseInfo.改造核心)}`">
                  {{ getCoreDisplay(baseInfo.改造核心) }}
                </div>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ t('等级') }}</span>
                <div class="detail-value grade-value" :class="`grade-${getCoreGrade(baseInfo.改造核心) || '基础级'}`">
                  {{ t(getCoreGradeDisplay(baseInfo.改造核心)) }}
                </div>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ t('训练加成') }}</span>
                <span class="detail-value">{{ getCoreTrainingSpeed(baseInfo) }}</span>
              </div>
            </div>

            <div v-if="getCoreEffects(baseInfo).length > 0" class="core-effects-section">
              <h4>{{ t('特殊效果') }}</h4>
              <div class="effects-tags">
                <span v-for="effect in getCoreEffects(baseInfo)" :key="effect" class="effect-tag-modal">
                  {{ effect }}
                </span>
              </div>
            </div>

            <div v-if="typeof baseInfo.改造核心 === 'object' && baseInfo.改造核心" class="advanced-details">
              <h4>{{ t('高级参数') }}</h4>
              <div class="advanced-grid">
                <div v-if="typeof baseInfo.改造核心 === 'object' && baseInfo.改造核心.base_multiplier" class="advanced-item">
                  <span class="advanced-label">{{ t('基础倍率') }}</span>
                  <span class="advanced-value">{{ baseInfo.改造核心.base_multiplier }}x</span>
                </div>
                <div v-if="typeof baseInfo.改造核心 === 'object' && baseInfo.改造核心.training_speed" class="advanced-item">
                  <span class="advanced-label">{{ t('训练速度') }}</span>
                  <span class="advanced-value">{{ baseInfo.改造核心.training_speed }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated } from 'vue';
import { useI18n } from '@/i18n';
import { useUIStore } from '@/stores/uiStore';
import { useCharacterStore } from '@/stores/characterStore';
import { useGameStateStore } from '@/stores/gameStateStore';
import { isTavernEnv } from '@/utils/tavern';
import { debug } from '@/utils/debug';
import { calculateFinalAttributes } from '@/utils/attributeCalculation';
import { escapeRegExp } from '@/utils/regex';
import BodyStatsPanel from '@/components/dashboard/components/BodyStatsPanel.vue';
import type { CharacterBaseInfo, ProtocolData, Item, SkillInfo, InnateAttributes, StatusEffect, ItemQuality, Rank, ProgramSkill, GameTime, NpcProfile, ProgramItem, MasteredSkill } from '@/types/game.d.ts';
import type { Origin, TalentTier, SpiritRoot } from '@/types';

const calculateAgeFromBirthdate = (birthdate: GameTime, currentTime: GameTime): number => {
  let age = currentTime.年 - birthdate.年;
  if (currentTime.月 < birthdate.月 || (currentTime.月 === birthdate.月 && currentTime.日 < birthdate.日)) {
    age--;
  }
  return Math.max(0, age);
};
import { formatRankWithStage } from '@/utils/realmUtils';
import {
  calculateRemainingMinutes,
  formatMinutesToDuration,
  removeStatusEffect
} from '@/utils/statusEffectManager';
import {
  AlertCircle, Heart, Sparkles, Star, BarChart3, BookOpen,
  Zap, Users, Backpack, Mountain, Sprout, Handshake, ChevronDown, X, MapPin, Rocket
} from 'lucide-vue-next';

// 使用 gameStateStore 获取数据
const { t } = useI18n();
const uiStore = useUIStore();
const characterStore = useCharacterStore();
const gameStateStore = useGameStateStore();
const isTavernEnvFlag = ref(isTavernEnv());
const isLoading = ref(false);

onMounted(() => {
  isTavernEnvFlag.value = isTavernEnv();
});

onActivated(() => {
  isTavernEnvFlag.value = isTavernEnv();
});

// 从 gameStateStore 获取数据的计算属性
const saveData = computed(() => gameStateStore.toSaveData());
const baseInfo = computed(() => gameStateStore.character);
const playerStatus = computed(() => gameStateStore.attributes);
const playerLocation = computed(() => gameStateStore.location);
const playerFactionInfo = computed(() => gameStateStore.factionMemberInfo);
const protocolData = computed(() => gameStateStore.protocolSystem);
const bodyStats = computed(() => gameStateStore.body || null);
const lifespanForBodyPanel = computed(() => {
  const life = playerStatus.value?.寿命;
  if (!life) return undefined;
  const current = Number((life as any).当前 ?? 0);
  const max = Number((life as any).上限 ?? 0);
  if (!max) return undefined;
  return { current, max };
});

const bodySummary = computed(() => {
  if (!isTavernEnvFlag.value) return '';
  const body: any = bodyStats.value;
  const height = Number(body?.身高);
  const weight = Number(body?.体重);
  if (Number.isFinite(height) && height > 0 && Number.isFinite(weight) && weight > 0) {
    return `${height}cm · ${weight}kg`;
  }
  if (body && typeof body === 'object') return t('待完善');
  return t('未建立');
});
const showProtocolDetails = ref(false);
const showSkillModal = ref(false);
const showProtocolModal = ref(false);
const showCoreModal = ref(false);
const showProgramDetails = ref(false);
const isSkillsExpanded = ref(false);

// 将LearnedSkillDisplay 类型定义移到顶层作用域
type LearnedSkillDisplay = {
  name: string;
  type: string;
  source: string;
  proficiency: number;
  description?: string;
  unlocked: boolean;
};

const selectedSkill = ref<SkillInfo | LearnedSkillDisplay | string | null>(null);
const selectedProtocol = ref<string | null>(null);

// 标签页状态
const activeTab = ref<string>('character');

// 标签页配置
const tabs = computed(() => {
  const base = [
    { id: 'character', label: '角色信息', icon: Users },
    { id: 'training', label: '训练体系', icon: BookOpen },
    { id: 'social', label: '社交关系', icon: Users },
  ];

  if (isTavernEnvFlag.value) {
    base.push({ id: 'body', label: '身体档案', icon: Heart });
  }

  return base;
});

// 名字首字，用于头像占位
const nameInitial = computed(() => {
  const n = String(baseInfo.value?.名字 || '').trim();
  return n ? n.charAt(0) : '?';
});

// 自动计算当前年龄
const currentAge = computed(() => {
  const birthdate = baseInfo.value?.出生日期;
  const gameTime = saveData.value?.元数据?.时间;

  if (birthdate && gameTime) {
    // 为可选的 birthdate 属性提供默认值以匹配 GameTime 类型
    const fullBirthdate: GameTime = {
      年: birthdate.年,
      月: birthdate.月,
      日: birthdate.日,
      小时: birthdate.小时 ?? 0,
      分钟: birthdate.分钟 ?? 0,
    };
    return calculateAgeFromBirthdate(fullBirthdate, gameTime);
  }

  // 兜底：返回寿命的当前值
  return playerStatus.value?.寿命?.当前 || 0;
});

// fullTrainingProgram数据 - 从背包中解析完整程序数据
const fullTrainingProgram = computed((): ProgramItem | null => {
  if (!saveData.value?.角色?.训练?.训练程序 || !saveData.value?.角色?.背包?.物品) {
    return null;
  }
  const programId = saveData.value.角色?.训练?.训练程序?.物品ID;
  if (!programId) {
    return null;
  }
  const programItem = saveData.value.角色.背包.物品[programId];
  if (programItem && programItem.类型 === '程序') {
    // 明确类型转换为ProgramItem
    return programItem as ProgramItem;
  }
  return null;
});


const unlockedProtocolList = computed((): ProtocolData[] => {
  if (!protocolData.value?.流派列表) return [];
  return (Object.values(protocolData.value.流派列表) as ProtocolData[]).filter(d => d.是否解锁);
});

// 生命状态数据
const vitalsData = computed(() => {
  if (!playerStatus.value) return [];

  const safe = (n: unknown) => (typeof n === 'number' ? n : Number(n || 0)) || 0;
  const safeMax = (n: unknown) => {
    const v = (typeof n === 'number' ? n : Number(n || 0));
    return isNaN(v) ? 0 : Math.max(0, v);
  };
  return [
    {
      label: t('生命值'),
      current: safe(playerStatus.value.生命值?.当前),
      max: safeMax(playerStatus.value.生命值?.上限),
      color: 'red'
    },
    {
      label: t('电量'),
      current: safe(playerStatus.value.电量?.当前),
      max: safeMax(playerStatus.value.电量?.上限),
      color: 'blue'
    },
    {
      label: t('带宽'),
      current: safe(playerStatus.value.带宽?.当前),
      max: safeMax(playerStatus.value.带宽?.上限),
      color: 'gold'
    }
  ];
});


// 获取完整的初始六维（含默认值）
const clamp0to10 = (n: unknown): number => {
  const v = typeof n === 'number' ? n : Number(n || 0);
  if (isNaN(v)) return 0;
  return Math.max(0, Math.min(10, Math.round(v)));
};

const innateAttributesWithDefaults = computed((): InnateAttributes => {
  const innate = baseInfo.value?.初始六维 || ({} as Partial<InnateAttributes>);
  return {
    体质: clamp0to10(innate.体质),
    能源: clamp0to10(innate.能源),
    算法: clamp0to10(innate.算法),
    资源感知: clamp0to10(innate.资源感知),
    魅力: clamp0to10(innate.魅力),
    心智: clamp0to10(innate.心智)
  };
});

// 属性计算
const finalAttributes = computed((): InnateAttributes => {
  if (!saveData.value) return innateAttributesWithDefaults.value;
  const result = calculateFinalAttributes(innateAttributesWithDefaults.value, saveData.value);
  return result?.最终六维 || innateAttributesWithDefaults.value;
});


const acquiredAttributes = computed((): InnateAttributes => {
  const defaultAttributes: InnateAttributes = { 体质: 0, 能源: 0, 算法: 0, 资源感知: 0, 魅力: 0, 心智: 0 };
  if (!saveData.value) return defaultAttributes;
  const result = calculateFinalAttributes(innateAttributesWithDefaults.value, saveData.value);
  return result?.成长六维 || defaultAttributes;
});

const hasProgramEffects = computed(() => {
  const effects = fullTrainingProgram.value?.程序效果;
  if (!effects) return false;
  const hasSpeedBonus = effects.训练速度加成 && effects.训练速度加成 > 0;
  const hasAttributeBonus = effects.属性加成 && Object.keys(effects.属性加成).length > 0;
  return hasSpeedBonus || hasAttributeBonus;
});

// 技能相关计算属性
const skillsList = computed((): SkillInfo[] => {
  const program = fullTrainingProgram.value;
  if (!program || !program.程序技能) return [];

  return program.程序技能
    .filter((skillInfo: ProgramSkill) => {
      const isExplicitlyUnlocked = (program.已解锁技能 || []).includes(skillInfo.技能名称);
      const requiredProficiency = skillInfo.熟练度要求 ?? 100;
      const isUnlockedByProficiency = (program.训练进度 || 0) >= requiredProficiency;
      return !(isExplicitlyUnlocked || isUnlockedByProficiency);
    })
    .map((skillInfo: ProgramSkill) => {
      const requiredProficiency = skillInfo.熟练度要求 ?? 100;
      return {
        name: skillInfo.技能名称,
        description: skillInfo.技能描述 || '',
        type: t('程序技能'),
        unlockCondition: requiredProficiency === 0 ? t('自动解锁') : t('需要熟练度 {0}%').replace('{0}', String(requiredProficiency)),
        unlocked: false,
      };
    });
});

// 已学技能（所有已掌握的技能）
const allLearnedSkills = computed((): LearnedSkillDisplay[] => {
  const mastered = saveData.value?.技能?.掌握技能 || [];

  let fromProgram: LearnedSkillDisplay[] = [];
  if (fullTrainingProgram.value && fullTrainingProgram.value.程序技能) {
    const program = fullTrainingProgram.value;
    if (!program.程序技能) return [];
    fromProgram = program.程序技能
      .filter((skillInfo: ProgramSkill) => {
        const isExplicitlyUnlocked = (program.已解锁技能 || []).includes(skillInfo.技能名称);
        const isUnlockedByProficiency = (program.训练进度 || 0) >= (skillInfo.熟练度要求 ?? 100);
        return isExplicitlyUnlocked || isUnlockedByProficiency;
      })
      .map((skillInfo: ProgramSkill) => {
        return {
          name: skillInfo.技能名称,
          proficiency: getPersistentProficiency(skillInfo.技能名称, 'program'),
          source: program.名称 || t('程序'),
          type: t('程序技能'),
          description: skillInfo.技能描述 || t('通过程序训练掌握'),
          unlocked: true,
        };
      });
  }

  const allSkills = [...mastered.map((s: MasteredSkill) => ({
    name: s.技能名称,
    proficiency: s.熟练度,
    source: s.来源,
    type: t('掌握技能'),
    description: s.技能描述,
    unlocked: true,
  })), ...fromProgram];

  // 去重
  const uniqueSkills = new Map<string, LearnedSkillDisplay>();
  allSkills.forEach(skill => {
    if (!uniqueSkills.has(skill.name)) {
      uniqueSkills.set(skill.name, skill);
    }
  });

  return Array.from(uniqueSkills.values());
});

const totalSkillsCount = computed(() => {
  return allLearnedSkills.value.length;
});

// 人际关系统计
const relationshipCount = computed(() => {
  const relations = saveData.value?.社交?.关系 || {};
  return (Object.values(relations) as NpcProfile[]).filter(npc => npc && npc.名字).length;
});

const averageFavorability = computed(() => {
  if (!saveData.value?.社交?.关系) return 0;
  const relations = (Object.values(saveData.value.社交.关系) as NpcProfile[]).filter(npc => npc && npc.名字);
  if (relations.length === 0) return 0;
  const total = relations.reduce((sum, rel) => sum + (rel.好感度 || 0), 0);
  return Math.round(total / relations.length);
});

// 背包统计
const inventoryItemCount = computed(() => {
  const items = saveData.value?.角色?.背包?.物品 || {};
  // 仅统计有效物品：键不以下划线开头，值为对象且包含名称
  return Object.entries(items)
    .filter(([key, val]) => !String(key).startsWith('_') && val && typeof val === 'object' && typeof (val as Item).名称 === 'string')
    .length;
});

const creditGrades = [
  { name: t('低级'), class: 'grade-common' },
  { name: t('中级'), class: 'grade-rare' },
  { name: t('高级'), class: 'grade-epic' },
  { name: t('顶级'), class: 'grade-legend' }
];

// 方法
// 判断是否为未接入阶段（没有训练进度）
const isUninitializedStage = (rankName?: string): boolean => {
  if (!rankName) return true;
  const uninitializedStages = ['未接入', '街头人', '无改造', '普通人', '游民'];
  return uninitializedStages.includes(rankName);
};

// 获取未接入阶段的显示文本
const getUninitializedStageDisplay = (): string => {
  const rankName = playerStatus.value?.阶位?.名称;
  switch (rankName) {
    case '未接入':
    case '普通人':
      return t('等待接入');
    case '街头人':
    case '游民':
      return t('街头生存');
    case '无改造':
      return t('基础状态');
    default:
      return t('等待接入');
  }
};

// 检查是否有有效的等级数据
const hasValidTraining = (): boolean => {
  const current = playerStatus.value?.阶位?.当前进度;
  const max = playerStatus.value?.阶位?.下一级所需;
  return typeof current === 'number' && typeof max === 'number' && max > 0;
};

// 格式化等级显示文本
const formatTrainingText = (): string => {
  const current = playerStatus.value?.阶位?.当前进度 || 0;
  const max = playerStatus.value?.阶位?.下一级所需 || 100;

  // 如果数值很大，使用简化显示
  if (max >= 10000) {
    const currentK = Math.floor(current / 1000);
    const maxK = Math.floor(max / 1000);
    if (currentK > 0 && maxK > 0) {
      return `${currentK}k/${maxK}k`;
    }
  }

  return `${current}/${max}`;
};

// 显示等级：统一返回"等级+阶段"
const formatRankDisplay = (rankInput?: string | Rank): string => {
  // 如果传入的是对象（Rank类型）
  if (rankInput && typeof rankInput === 'object') {
    const name = rankInput.名称 || '';
    const stage = rankInput.阶段 || '';
    const progress = rankInput.当前进度;
    const maxProgress = rankInput.下一级所需;
    return formatRankWithStage({ name, 阶段: stage, 当前进度: progress, 下一级所需: maxProgress });
  }

  // 如果传入的是字符串（name）
  const name = typeof rankInput === 'string' ? rankInput : undefined;
  const progress = playerStatus.value?.阶位?.当前进度;
  const maxProgress = playerStatus.value?.阶位?.下一级所需;
  const stage = playerStatus.value?.阶位?.阶段;
  return formatRankWithStage({ name, 阶段: stage, 当前进度: progress, 下一级所需: maxProgress });
};

const formatFactionType = (type?: string): string => {
  if (!type) return t('未知');
  const labelMap: Record<string, string> = {
    '秩序组织': '秩序组织',
    '核心组织': '核心组织',
    '黑市组织': '黑市组织',
    '黑市势力': '黑市势力',
    '中立组织': '中立组织',
    '企业家族': '企业家族',
    '家族势力': '家族势力',
    '商业联盟': '商业联盟',
    '独立联盟': '独立联盟'
  };
  return labelMap[type] || type;
};

const getTrainingProgress = (): number => {
  const current = playerStatus.value?.阶位?.当前进度 || 0;
  const max = playerStatus.value?.阶位?.下一级所需 || 100;
  return Math.round((current / max) * 100);
};



// 获取模块阶位名称
const getModuleTierName = (moduleTier: TalentTier | string | undefined): string => {
  if (!moduleTier) return t('未知');
  if (typeof moduleTier === 'string') return moduleTier;
  return moduleTier.name || t('未知');
};

// 获取模块阶位描述
const getModuleTierDescription = (moduleTier: TalentTier | string | undefined): string => {
  if (typeof moduleTier === 'object' && moduleTier) {
    return moduleTier.description || '';
  }
  return '';
};

const getModuleList = (modules: unknown): { name: string; description: string }[] => {
  let processedModules: unknown[] = [];

  if (!modules) {
    return [];
  }

  if (Array.isArray(modules)) {
    processedModules = modules;
  } else if (typeof modules === 'string') {
    try {
      // Try to parse it as a JSON array
      const parsed = JSON.parse(modules);
      if (Array.isArray(parsed)) {
        processedModules = parsed;
      } else if (typeof parsed === 'string') {
        // It's a valid JSON but not an array (e.g., a string literal "模块1"), treat as single module
        processedModules = [{ name: parsed, description: '' }];
      }
    } catch (error) {
      // It's not a JSON string, so treat the whole string as a single talent name
      processedModules = [{ name: modules, description: '' }];
    }
  } else if (typeof modules === 'object' && modules !== null) {
    // Handle the case where it's a single talent object, not in an array
    processedModules = [modules];
  }

  return processedModules
    .map(talent => {
      if (typeof talent === 'string') {
        return { name: talent, description: '' };
      }
      if (typeof talent === 'object' && talent !== null) {
        // 修复：正确提取中英文字段的名称和描述
        const talentObj = talent as Record<string, unknown>;
        const name = (talentObj.name || talentObj['名称'] || '') as string;
        const description = (talentObj.description || talentObj['描述'] || '') as string;

        // 只有当名称和描述都为空时才过滤掉
        if (!name && !description) return null;

        return {
          name: name || t('未知模块'),
          description: description,
        };
      }
      return null;
    })
    .filter(Boolean) as { name: string; description: string }[];
};


const getPercentage = (current: number, max: number): number => {
  return Math.round((current / max) * 100);
};

const getItemQualityClass = (item: { 品质?: ItemQuality } | null, type: 'border' | 'text' = 'border'): string => {
  if (!item) return '';
  const quality = item.品质?.quality || t('未知');
  return `${type}-quality-${quality}`;
};

const getProtocolData = (protocolName: string): ProtocolData | undefined => {
  return protocolData.value?.流派列表?.[protocolName];
};

const getProtocolStage = (protocolName: string): number => {
  return getProtocolData(protocolName)?.当前阶段 || 0;
};

const getProtocolProgress = (protocolName: string): number => {
  const protocol = getProtocolData(protocolName);
  if (!protocol) return 0;
  const currentStageIndex = protocol.当前阶段 || 0;
  const currentStage = protocol.阶段列表?.[currentStageIndex];
  if (!currentStage) return 0;
  const nextStageExp = currentStage.突破经验;
  if (nextStageExp <= 0) return 100;
  return Math.min(100, Math.round((protocol.当前经验 / nextStageExp) * 100));
};

const getProtocolCurrentExp = (protocolName: string): number => {
  return getProtocolData(protocolName)?.当前经验 || 0;
};

const getProtocolTotalExp = (protocolName: string): number => {
  return getProtocolData(protocolName)?.总经验 || 0;
};

const getItemTypeCount = (type: string): number => {
  const items = saveData.value?.角色?.背包?.物品 || {};
  return Object.entries(items)
    .filter(([key, val]) => !String(key).startsWith('_') && val && typeof val === 'object')
    .map(([, val]) => val as Item)
    .filter((item: Item) => item.类型 === type).length;
};

const getCreditCount = (grade: '低级' | '中级' | '高级' | '顶级'): number => {
  return saveData.value?.角色?.背包?.信用点?.[t(grade) as '低级' | '中级' | '高级' | '顶级'] || 0;
};

// 清理状态效果描述，去除重复的时间信息
const _getCleanEffectDescription = (effect: StatusEffect): string => {
  if (!effect || !effect.状态描述) return '';

  let description = effect.状态描述;
  const durationText = effect.时间 == null ? '' : String(effect.时间);

  // 如果描述中包含了时间信息，则移除重复部分
  if (durationText && description.includes(durationText)) {
    const escapedDuration = escapeRegExp(durationText);
    // 移除包含时间信息的句子或短语
    description = description
      .replace(new RegExp(`[^。]*${escapedDuration}[^。]*。`, 'g'), '')
      .replace(new RegExp(t('持续时间[：][^。]*{0}[^。]*。').replace('{0}', escapedDuration), 'g'), '')
      .replace(new RegExp(t('剩余时间[：][^。]*{0}[^。]*。').replace('{0}', escapedDuration), 'g'), '')
      .replace(new RegExp(t('时间[：][^。]*{0}[^。]*。').replace('{0}', escapedDuration), 'g'), '')
      .trim();
  }

  return description || t('无描述');
};

// 格式化状态效果生成时间
const _formatEffectCreatedTime = (effect: StatusEffect): string => {
  if (!effect.生成时间) return t('未知');
  const { 年, 月, 日, 小时, 分钟 } = effect.生成时间;
  return t('{0}年{1}月{2}日 {3}:{4}').replace('{0}', String(年)).replace('{1}', String(月)).replace('{2}', String(日)).replace('{3}', String(小时 || 0)).replace('{4}', String(分钟 ?? 0).padStart(2, '0'));
};

// 格式化状态效果剩余时间
const _formatEffectRemainingTime = (effect: StatusEffect): string => {
  if (!saveData.value?.元数据?.时间) return t('未知');
  const remainingMinutes = calculateRemainingMinutes(effect, saveData.value.元数据.时间);
  return formatMinutesToDuration(remainingMinutes);
};

// 移除状态效果
const _handleRemoveEffect = async (effectName: string) => {
  const confirmed = confirm(t('确定要移除状态效果"{0}"吗？').replace('{0}', effectName));
  if (!confirmed) return;

  try {
    if (!saveData.value) {
      debug.error(t('角色详情面板'), t('存档数据不存在'));
      return;
    }

    // 使用 statusEffectManager 移除状态效果
    const removed = removeStatusEffect(saveData.value, effectName);

    if (removed) {
      await characterStore.saveCurrentGame();
      debug.log(t('角色详情面板'), t('已移除状态效果: {0}').replace('{0}', effectName));
    } else {
      debug.warn(t('角色详情面板'), t('未找到状态效果: {0}').replace('{0}', effectName));
    }
  } catch (error) {
    debug.error(t('角色详情面板'), t('移除状态效果失败:'), error);
  }
};

// 获取持久化的熟练度（根据技能名和来源生成固定熟练度）
const getPersistentProficiency = (skillName: string, source: string): number => {
  // 使用技能名和来源生成一个固定的种子
  const seed = skillName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + source.length;
  // 基于种子生成 30-95 之间的固定值
  return 30 + (seed % 66);
};

// 界面交互方法
const toggleProgramDetails = () => {
  showProgramDetails.value = !showProgramDetails.value;
};

const toggleSkillsDetails = () => {
  isSkillsExpanded.value = !isSkillsExpanded.value;
};

const toggleProtocolDetails = () => {
  showProtocolDetails.value = !showProtocolDetails.value;
};

const showProtocolInfo = (protocolName: string) => {
  selectedProtocol.value = protocolName;
  showProtocolModal.value = true;
};

const showSkillDetails = (skill: SkillInfo | LearnedSkillDisplay | string) => {
  selectedSkill.value = skill;
  showSkillModal.value = true;
};

const showCoreDetails = () => {
  showCoreModal.value = true;
};

const closeModals = () => {
  showSkillModal.value = false;
  showProtocolModal.value = false;
  showCoreModal.value = false;
  selectedSkill.value = null;
  selectedProtocol.value = null;
};

const getProtocolModalContent = () => {
  if (!selectedProtocol.value) return null;
  const protocol = getProtocolData(selectedProtocol.value);
  if (!protocol) {
    return {
      name: selectedProtocol.value,
      stage: t('初始阶段'),
      currentExp: 0,
      totalExp: 0,
      progressPercent: 0,
      description: t('此流派已解锁，但尚未开始训练')
    };
  }

  const stage = protocol.当前阶段 || 0;
  const currentExp = protocol.当前经验 || 0;
  const totalExp = protocol.总经验 || 0;
  const progressPercent = getProtocolProgress(selectedProtocol.value);

  // 获取阶段名称，优先使用阶段列表中的名称
  let stageName: string;
  if (protocol.阶段列表?.[stage]) {
    stageName = protocol.阶段列表[stage].名称;
  } else {
    stageName = stage === 0 ? t('未门') : t('第{0}阶段').replace('{0}', String(stage));
  }

  return {
    name: selectedProtocol.value,
    stage: stageName,
    currentExp,
    totalExp,
    progressPercent,
    description: protocol.描述 || t('此流派深奥精密，需持续训练方能有所成就')
  };
};

const getSkillModalContent = () => {
  if (!selectedSkill.value) return null;

  // 处理已掌握技能
  if (typeof selectedSkill.value === 'object' && 'proficiency' in selectedSkill.value) {
    const skill = selectedSkill.value as LearnedSkillDisplay;
    return {
      name: skill.name,
      type: skill.type,
      status: t('已解锁'),
      condition: t('已掌握'),
      description: skill.description,
      source: skill.source,
      proficiency: skill.proficiency
    };
  }

  // 处理字符串技能名（向后兼容）
  if (typeof selectedSkill.value === 'string') {
    return {
      name: selectedSkill.value,
      type: t('程序技能'),
      status: t('已解锁'),
      condition: t('训练完成'),
      description: t('通过程序训练获得的技能'),
      source: t('程序训练')
    };
  }

  // 处理程序技能对象
  const skill = selectedSkill.value as SkillInfo;
  return {
    name: skill.name,
    type: skill.type,
    status: skill.unlocked ? t('已解锁') : t('未解锁'),
    condition: skill.unlocked ? t('训练完成') : skill.unlockCondition,
    description: skill.description,
    source: t('程序传承')
  };
};

const refreshData = async () => {
  isLoading.value = true;
  try {
    // 🔥 修复：从存储重新加载后，需要同步到 gameStateStore
    await characterStore.reloadFromStorage();

    // 重新加载当前游戏到 gameStateStore
    const gameStateStore = useGameStateStore();
    const currentSaveData = gameStateStore.getCurrentSaveData();
    if (currentSaveData) {
      gameStateStore.loadFromSaveData(currentSaveData);
      debug.log(t('人物详情'), t('已同步最新数据到 gameStateStore'));
    }
  } catch (error) {
    debug.error(t('人物详情'), t('刷新数据失败'), error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  debug.log(t('人物详情'), t('组件挂载，同步数据'));
  // 🔥 修复：首次挂载时不需要重新加载，直接使用 gameStateStore 中的数据
  // await refreshData();
});

// 每次面板激活时重新获取数据
onActivated(async () => {
  debug.log(t('人物详情'), t('面板激活'));
  // 🔥 修复：面板激活时不需要重新加载存储数据，gameStateStore 中已经是最新的
  // await refreshData();
});

// 获取出生地显示文本
const getOriginDisplay = (origin: Origin | string | undefined): string => {
  if (!origin) return t('待定');
  if (typeof origin === 'string') return origin;
  return (origin as any).名称 || origin.name || t('待定');
};

// 显示出身详情
const showOriginDetails = (origin: Origin | string | undefined) => {
  if (origin && typeof origin === 'object') {
    const name = (origin as any).名称 || origin.name;
    const desc = (origin as any).描述 || origin.description;
    uiStore.showDetailModal({
      title: t('出身背景: {0}').replace('{0}', name),
      content: desc,
    });
  }
};

// 增强的改造核心系统 - 简化版
const getCoreDisplay = (core: SpiritRoot | string | undefined): string => {
  if (!core) return t('未知');
  if (typeof core === 'string') return core;
  const name = (core as any).名称 || core.name || t('未知');
  let tier = (core as any).品级 || core.tier;
  if (tier && typeof tier === 'object') {
    tier = tier.quality || tier.grade || t('未知');
  }
  if (tier && tier !== '未知' && tier !== '基础级') {
    return `${name}(${t(String(tier))})`;
  }
  return name;
};

// 格式化改造核心显示（简洁版，用于顶部）
const formatCore = (core: SpiritRoot | string | undefined): string => {
  if (!core) return t('未知');
  if (typeof core === 'string') return core;
  return (core as any).名称 || core.name || t('未知');
};

const getCoreGrade = (core: SpiritRoot | string | undefined): string => {
  if (typeof core === 'object' && core) {
    const rawGrade = (core as any).品级 || core.tier;
    if (typeof rawGrade === 'object' && rawGrade) {
      return String((rawGrade as any).quality || (rawGrade as any).grade || '基础级');
    }
    return String(rawGrade || '基础级');
  }
  return '基础级';
};

const getCoreGradeDisplay = (core: SpiritRoot | string | undefined): string => {
  const grade = getCoreGrade(core) || '基础级';
  const gradeMap: Record<string, string> = {
    '基础级': '基础级',
    '改良级': '改良级',
    '精良级': '精良级',
    '高级': '高级',
    '顶级': '顶级',
    '神话级': '神话级',
    '特殊': '特殊'
  };
  return gradeMap[grade] || grade;
};

const getCoreDescription = (core: SpiritRoot | string | undefined): string => {
  if (typeof core === 'object' && core) {
    return (core as any).描述 || core.description || t('未知');
  }
  return t('未知');
};

const getCoreClass = (core: SpiritRoot | string | undefined): string => {
  if (typeof core !== 'object' || !core) return 'core-unknown';
  let grade = (core as any).品级 || core.tier || '';
  // 处理对象类型的 tier/品级
  if (typeof grade === 'object' && grade) {
    grade = grade.quality || grade.grade || '';
  }
  // 安全转换为字符串并转小写
  const gradeStr = String(grade).toLowerCase();

  if (gradeStr.includes('神话')) return 'core-mythic';
  if (gradeStr.includes('顶级')) return 'core-legend';
  if (gradeStr.includes('高级')) return 'core-epic';
  if (gradeStr.includes('精良')) return 'core-rare';
  if (gradeStr.includes('改良')) return 'core-uncommon';
  if (gradeStr.includes('基础')) return 'core-common';

  return 'core-unknown';
};

// 获取改造核心训练速度
const getCoreTrainingSpeed = (baseInfo: CharacterBaseInfo | undefined): string => {
  const core = baseInfo?.改造核心;
  if (core && typeof core === 'object') {
    const coreObj = core as { base_multiplier?: number; training_speed?: string };
    if ('base_multiplier' in coreObj && coreObj.base_multiplier) {
      return `${coreObj.base_multiplier}x`;
    }
    if ('training_speed' in coreObj && coreObj.training_speed) {
      return coreObj.training_speed;
    }
  }

  // 如果没有详情，根据品级推断基础训练速度
  const grade = getCoreGrade(core);

  const speedMap: Record<string, string> = {
    '基础级': '1.0x',
    '改良级': '1.1x',
    '精良级': '1.3x',
    '高级': '1.6x',
    '顶级': '2.0x',
    '神话级': '2.8x',
    '特殊': t('特殊')
  };

  return speedMap[grade] || '1.0x';
};

// 获取改造核心特殊效果
const getCoreEffects = (baseInfo: CharacterBaseInfo | undefined): string[] => {
  const core = baseInfo?.改造核心;
  if (core && typeof core === 'object') {
    const coreObj = core as { special_effects?: string[] };
    if ('special_effects' in coreObj && Array.isArray(coreObj.special_effects)) {
      return coreObj.special_effects;
    }
  }
  return [];
};
</script>

<style scoped>
.character-details-wrapper {
  padding: 1rem;
  height: 100%;
  overflow: auto;
  background: var(--color-background);
  color: var(--color-text);
}

.character-details-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* Loading / Error */
.loading-container,
.error-container {
  min-height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 1.5rem;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  border: 3px solid rgba(var(--color-primary-rgb), 0.18);
  border-top-color: var(--color-primary);
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-icon {
  color: rgba(239, 68, 68, 0.9);
}

.retry-btn {
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  padding: 0.6rem 0.9rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.retry-btn:hover {
  border-color: var(--color-primary);
  transform: translateY(-1px);
}

/* Header card */
.character-header-card {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: linear-gradient(
      135deg,
      rgba(var(--color-primary-rgb), 0.12) 0%,
      rgba(var(--color-accent-rgb), 0.08) 45%,
      rgba(255, 255, 255, 0.02) 100%
    ),
    var(--color-surface);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.header-bg-decoration {
  position: absolute;
  inset: -30%;
  background: radial-gradient(circle at 20% 25%, rgba(var(--color-primary-rgb), 0.22), transparent 55%),
    radial-gradient(circle at 75% 60%, rgba(var(--color-accent-rgb), 0.18), transparent 55%);
  filter: blur(22px);
  opacity: 0.9;
  pointer-events: none;
}

.header-content {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1.25fr 2fr 1fr;
  gap: 1rem;
  padding: 1.25rem;
  align-items: center;
}

.profile-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}

.avatar-wrapper {
  position: relative;
  width: 64px;
  height: 64px;
  flex: 0 0 auto;
}

.avatar-circle {
  width: 64px;
  height: 64px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--color-primary-rgb), 0.14);
  border: 1px solid rgba(var(--color-primary-rgb), 0.35);
  color: var(--color-text);
  font-weight: 800;
  font-size: 1.35rem;
  letter-spacing: 0.02em;
  user-select: none;
}

.avatar-glow {
  position: absolute;
  inset: -14px;
  border-radius: 9999px;
  background: radial-gradient(circle at center, rgba(var(--color-primary-rgb), 0.25), transparent 65%);
  filter: blur(10px);
  opacity: 0.9;
  pointer-events: none;
}

.identity-info {
  min-width: 0;
}

.character-title {
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0;
  line-height: 1.1;
}

.character-subtitle {
  margin-top: 0.4rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.5rem;
  align-items: center;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.subtitle-divider {
  opacity: 0.6;
}

.gender-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0.55rem;
  border-radius: 9999px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(255, 255, 255, 0.05);
}

.core-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  align-content: start;
}

.stat-card {
  border-radius: 14px;
  transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease;
  min-width: 0;
}

.stat-card.clickable {
  cursor: pointer;
}

.stat-card:hover {
  border-color: rgba(var(--color-primary-rgb), 0.55);
  transform: translateY(-1px);
}

.stat-card .card-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--color-primary-rgb), 0.12);
  color: var(--color-primary);
  flex: 0 0 auto;
}

.stat-card .card-content {
  min-width: 0;
}

.stat-card .card-label {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.15rem;
}

.stat-card .card-value {
  font-weight: 700;
  color: var(--color-text);
  font-size: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.body-card .card-icon {
  background: rgba(239, 68, 68, 0.12);
  color: rgba(239, 68, 68, 0.95);
}

.training-section {
  display: flex;
  justify-content: flex-end;
  align-items: stretch;
}

.training-progress-card,
.training-status {
  width: 100%;
  max-width: 260px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 14px;
  padding: 0.85rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.5rem;
}

.progress-label {
  color: var(--color-text-secondary);
  font-size: 0.85rem;
}

.progress-percentage {
  font-weight: 800;
}

.progress-bar-bg {
  height: 10px;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, rgba(var(--color-primary-rgb), 0.8), rgba(var(--color-accent-rgb), 0.85));
  border-radius: 9999px;
  position: relative;
}

.progress-bar-shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
  transform: translateX(-60%);
  animation: shine 2.4s ease-in-out infinite;
}

@keyframes shine {
  0% {
    transform: translateX(-70%);
  }
  50% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(70%);
  }
}

.progress-text {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

/* Tabs */
.tabs-nav {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding: 0.5rem 0.25rem;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.75rem;
  border-radius: 9999px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 0.9rem;
}

.tab-btn:hover {
  border-color: rgba(var(--color-primary-rgb), 0.55);
  color: var(--color-text);
}

.tab-btn.active {
  background: rgba(var(--color-primary-rgb), 0.14);
  border-color: rgba(var(--color-primary-rgb), 0.55);
  color: var(--color-text);
}

/* Content */
.tab-content {
  padding: 0.25rem;
}

.content-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 1.25rem;
  overflow: hidden;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.info-section:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border-color: rgba(var(--color-primary-rgb), 0.3);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0 0 1.25rem;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-text);
  padding-bottom: 0.75rem;
  border-bottom: 2px solid var(--color-border);
}

.title-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.15), rgba(var(--color-accent-rgb), 0.1));
  color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(var(--color-primary-rgb), 0.15);
}

/* Vitals */
.vitals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.vital-item {
  padding: 1rem;
  background: linear-gradient(135deg, var(--color-background) 0%, var(--color-surface-light) 100%);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  transition: all 0.2s ease;
}

.vital-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: rgba(var(--color-primary-rgb), 0.3);
}

.vital-label {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.vital-bar {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bar-container {
  height: 12px;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.1);
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.bar-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.3s ease;
  position: relative;
  overflow: hidden;
}

.bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.bar-red {
  background: linear-gradient(90deg, #ef4444, #f87171);
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.3);
}

.bar-blue {
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
}

.bar-gold {
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.3);
}

.vital-text {
  font-size: 0.85rem;
  color: var(--color-text);
  font-weight: 600;
  display: flex;
  justify-content: space-between;
}

.reputation-item {
  grid-column: span 1;
}

.reputation-display {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  background: linear-gradient(135deg, rgba(var(--color-accent-rgb), 0.1), rgba(var(--color-primary-rgb), 0.05));
  border-radius: 10px;
  border: 1px solid rgba(var(--color-accent-rgb), 0.2);
}

.reputation-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-accent);
}

/* 基础信息网格 */
.basic-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.85rem;
}

.basic-info-item {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.85rem 1rem;
  background: linear-gradient(135deg, var(--color-surface-light) 0%, var(--color-background) 100%);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.basic-info-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  border-color: rgba(var(--color-primary-rgb), 0.25);
}

.info-label {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
}

.info-value.rank {
  color: var(--color-primary);
  font-size: 1.05rem;
}

.info-value.gender {
  font-weight: 600;
}

.info-value.gender.gender-男 {
  color: #3b82f6;
}

.info-value.gender.gender-女 {
  color: #ec4899;
}

.info-value.core {
  color: var(--color-accent);
}

.info-value.location {
  color: var(--color-text);
  font-size: 0.95rem;
}

/* 属性显示 */
.attributes-display {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.final-attributes {
  padding: 1.25rem;
  background: linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.08), rgba(var(--color-accent-rgb), 0.05));
  border: 2px solid rgba(var(--color-primary-rgb), 0.2);
  border-radius: 14px;
}

.attribute-group-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.attributes-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.85rem;
}

.attributes-grid.compact {
  grid-template-columns: repeat(6, 1fr);
  gap: 0.65rem;
}

.attribute-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 0.85rem 0.65rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.attribute-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: rgba(var(--color-primary-rgb), 0.3);
}

.attribute-item.final {
  background: linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.1), rgba(var(--color-accent-rgb), 0.05));
  border-color: rgba(var(--color-primary-rgb), 0.25);
}

.attribute-item.innate {
  background: var(--color-surface-light);
}

.attribute-item.acquired {
  background: var(--color-background);
}

.attribute-item.acquired.has-bonus {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(16, 185, 129, 0.05));
  border-color: rgba(34, 197, 94, 0.25);
}

.attr-name {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.attr-value {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--color-text);
}

.attribute-item.final .attr-value {
  color: var(--color-primary);
  font-size: 1.4rem;
}

.attribute-item.acquired.has-bonus .attr-value {
  color: #10b981;
}

.attribute-breakdown {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.innate-attrs,
.acquired-attrs {
  padding: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.skill-modal,
.protocol-modal,
.core-modal {
  width: min(820px, 100%);
  max-height: 85vh;
  overflow: auto;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-close-btn {
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  border-radius: 10px;
  padding: 0.4rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.modal-close-btn:hover {
  border-color: rgba(var(--color-primary-rgb), 0.55);
  transform: translateY(-1px);
}

.modal-content {
  padding: 1rem;
}

@media (max-width: 980px) {
  .header-content {
    grid-template-columns: 1fr;
    gap: 0.85rem;
  }
  .training-section {
    justify-content: flex-start;
  }
  .training-progress-card,
  .training-status {
    max-width: none;
  }
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
