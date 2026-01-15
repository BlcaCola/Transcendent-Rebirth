<template>
  <div class="account-container">
    <VideoBackground />

    <div class="account-panel">
      <div class="header">
        <div class="title-row">
          <h2 class="title">账号中心</h2>
          <span class="status" :class="{ ok: loggedIn, warn: !loggedIn }">
            {{ loggedIn ? '已登录' : '未登录' }}
          </span>
        </div>
        <p class="subtitle">集中管理账号信息</p>
      </div>

      <div v-if="!backendReady" class="backend-locked">
        <p>未配置后端服务器，账号中心不可用。</p>
        <div class="actions">
          <button class="btn btn-secondary" @click="goBack">返回</button>
        </div>
      </div>

      <template v-else>
        <div v-if="loading" class="loading">加载中…</div>
        <div v-else class="sections">
          <details v-for="section in sections" :key="section.title" class="section" :open="section.open">
            <summary class="section-title">{{ section.title }}</summary>
            <div class="section-body">
              <div v-if="section.items.length" class="info-list">
                <div v-for="item in section.items" :key="item.label" class="info-row">
                  <span class="info-label">{{ item.label }}</span>
                  <span class="info-value">{{ item.value }}</span>
                </div>
              </div>
              <div v-else class="info-empty">{{ section.emptyText || '暂无信息' }}</div>
            </div>
          </details>
        </div>

        <div class="actions">
          <button class="btn btn-secondary" @click="goBack">返回</button>
          <button class="btn danger" @click="logout">退出登录</button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import VideoBackground from '@/components/common/VideoBackground.vue';
import { request } from '@/services/request';
import { isBackendConfigured } from '@/services/backendConfig';
import { toast } from '@/utils/toast';
import { useAPIManagementStore } from '@/stores/apiManagementStore';
import { useCharacterStore } from '@/stores/characterStore';
import { promptStorage } from '@/services/promptStorage';

type UserProfile = {
  user_id: number;
  account_id: number;
  user_name: string;
  email?: string;
  travel_points?: number;
  last_login?: string;
  created_at: string;
};

const router = useRouter();
const apiStore = useAPIManagementStore();
const characterStore = useCharacterStore();
const backendReady = ref(isBackendConfigured());
const loading = ref(false);
const profile = ref<UserProfile | null>(null);

const loggedIn = computed(() => !!profile.value);

const formatDate = (isoText: string) => {
  if (!isoText) return '-';
  const date = new Date(isoText);
  if (Number.isNaN(date.getTime())) return isoText;
  return date.toLocaleString();
};

const sections = computed(() => {
  const infoItems = profile.value
    ? [
        { label: '用户名', value: profile.value.user_name },
        { label: '账号ID', value: String(profile.value.account_id) },
        { label: '邮箱', value: profile.value.email || '未设置' },
        { label: '穿越点数', value: String(profile.value.travel_points ?? 0) },
        { label: '最后登录-北京时间', value: profile.value.last_login ? formatDate(profile.value.last_login) : '未记录' },
        { label: '注册时间', value: formatDate(profile.value.created_at) },
      ]
    : [];
  return [
    {
      title: '账号信息',
      open: true,
      items: infoItems,
      emptyText: '未获取到账号信息',
    },
  ];
});

const goBack = () => {
  router.push('/');
};

const logout = async () => {
  try {
    await characterStore.saveLocalDataToBackend();
  } catch {
    // ignore
  }
  try {
    await promptStorage.resetAll();
  } catch {
    // ignore
  }
  localStorage.removeItem('access_token');
  localStorage.removeItem('username');
  void apiStore.clearAll({ clearRemote: true });
  void characterStore.clearLocalCharacterData();
  profile.value = null;
  toast.info('已退出登录');
  router.push('/login');
};

onMounted(async () => {
  if (!backendReady.value) return;
  const token = localStorage.getItem('access_token');
  if (!token) {
    router.push('/login');
    return;
  }
  loading.value = true;
  try {
    profile.value = await request.get<UserProfile>('/api/v1/auth/me');
  } catch (_e) {
    profile.value = null;
    router.push('/login');
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.account-container {
  width: 100%;
  height: 100vh;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  box-sizing: border-box;
  overflow: auto;
  background: linear-gradient(135deg, rgba(0, 217, 255, 0.05), rgba(157, 0, 255, 0.03));
  position: relative;
}

.account-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(0deg, transparent 24%, rgba(0, 217, 255, 0.02) 25%, rgba(0, 217, 255, 0.02) 26%, transparent 27%, transparent 74%, rgba(0, 217, 255, 0.02) 75%, rgba(0, 217, 255, 0.02) 76%, transparent 77%, transparent),
    linear-gradient(90deg, transparent 24%, rgba(0, 217, 255, 0.02) 25%, rgba(0, 217, 255, 0.02) 26%, transparent 27%, transparent 74%, rgba(0, 217, 255, 0.02) 75%, rgba(0, 217, 255, 0.02) 76%, transparent 77%, transparent);
  background-size: 50px 50px;
  pointer-events: none;
  z-index: 0;
}

.account-panel {
  width: 100%;
  max-width: 900px;
  background: linear-gradient(135deg, rgba(15, 21, 53, 0.95), rgba(10, 14, 39, 0.95));
  border: 2px solid var(--tech-primary);
  border-radius: 4px;
  box-shadow: 0 25px 50px rgba(0, 217, 255, 0.2), inset 0 0 40px rgba(0, 217, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 2.5rem;
  color: var(--tech-primary);
  position: relative;
  z-index: 1;
}

.account-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--tech-primary), transparent);
}

.header {
  margin-bottom: 1.5rem;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.title {
  margin: 0;
  font-family: var(--font-family-serif);
  font-size: 2rem;
  color: var(--tech-primary);
  text-shadow: 0 0 15px rgba(0, 217, 255, 0.4);
}

.status {
  padding: 0.35rem 0.9rem;
  border-radius: 3px;
  border: 1px solid;
  font-size: 0.85rem;
  font-weight: 600;
}

.status.ok {
  border-color: rgba(0, 255, 136, 0.4);
  color: var(--tech-success);
  background: linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 255, 136, 0.05));
  box-shadow: 0 0 10px rgba(0, 255, 136, 0.2);
}

.status.warn {
  border-color: rgba(255, 107, 0, 0.4);
  color: var(--tech-warning);
  background: linear-gradient(135deg, rgba(255, 107, 0, 0.1), rgba(255, 107, 0, 0.05));
  box-shadow: 0 0 10px rgba(255, 107, 0, 0.2);
}

.subtitle {
  margin: 0.6rem 0 0;
  color: rgba(0, 217, 255, 0.7);
}

.sections {
  display: grid;
  gap: 1rem;
}

.section {
  border: 1px solid var(--tech-border);
  border-radius: 4px;
  background: linear-gradient(135deg, rgba(15, 21, 53, 0.7), rgba(10, 14, 39, 0.7));
  overflow: hidden;
  box-shadow: 0 0 10px rgba(0, 217, 255, 0.05);
  transition: all 0.3s ease;
}

.section:hover {
  box-shadow: 0 0 20px rgba(0, 217, 255, 0.1);
  border-color: var(--tech-primary);
}

.section-title {
  list-style: none;
  padding: 0.85rem 1rem;
  font-weight: 700;
  color: var(--tech-primary);
  cursor: pointer;
  background: linear-gradient(135deg, rgba(0, 217, 255, 0.08), rgba(157, 0, 255, 0.05));
  text-shadow: 0 0 8px rgba(0, 217, 255, 0.3);
  transition: all 0.3s ease;
}

.section-title::-webkit-details-marker {
  display: none;
}

.section:hover .section-title {
  background: linear-gradient(135deg, rgba(0, 217, 255, 0.15), rgba(157, 0, 255, 0.1));
}

.section-body {
  padding: 0 1rem 1rem;
}

.info-list {
  display: grid;
  gap: 0.6rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid var(--tech-border);
}

.info-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.info-label {
  color: rgba(0, 217, 255, 0.6);
  font-size: 0.9rem;
  font-weight: 500;
}

.info-value {
  font-weight: 600;
  color: var(--tech-primary);
}

.info-empty {
  color: rgba(0, 217, 255, 0.4);
  font-size: 0.9rem;
  padding: 0.3rem 0;
}

.actions {
  margin-top: 2rem;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.btn {
  flex: 1;
  padding: 0.9rem 1rem;
  border-radius: 4px;
  border: 2px solid var(--tech-primary);
  background: linear-gradient(135deg, rgba(0, 217, 255, 0.1), rgba(157, 0, 255, 0.1));
  color: var(--tech-primary);
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  box-shadow: 0 0 15px rgba(0, 217, 255, 0.2);
}

.btn:hover {
  background: linear-gradient(135deg, rgba(0, 217, 255, 0.2), rgba(157, 0, 255, 0.15));
  box-shadow: 0 0 30px rgba(0, 217, 255, 0.4);
}

.btn.btn-secondary {
  border-color: var(--tech-secondary);
  background: linear-gradient(135deg, rgba(157, 0, 255, 0.1), rgba(157, 0, 255, 0.05));
  color: var(--tech-secondary);
  box-shadow: 0 0 15px rgba(157, 0, 255, 0.2);
}

.btn.btn-secondary:hover {
  background: linear-gradient(135deg, rgba(157, 0, 255, 0.2), rgba(157, 0, 255, 0.1));
  box-shadow: 0 0 25px rgba(157, 0, 255, 0.4);
}

.btn.danger {
  border-color: var(--tech-danger);
  background: linear-gradient(135deg, rgba(255, 0, 85, 0.1), rgba(255, 0, 85, 0.05));
  color: var(--tech-danger);
  box-shadow: 0 0 15px rgba(255, 0, 85, 0.2);
}

.btn.danger:hover {
  background: linear-gradient(135deg, rgba(255, 0, 85, 0.2), rgba(255, 0, 85, 0.1));
  box-shadow: 0 0 25px rgba(255, 0, 85, 0.4);
}

.loading {
  text-align: center;
  padding: 2rem;
  color: var(--tech-primary);
  font-size: 1.1rem;
}

.backend-locked {
  text-align: center;
  padding: 2rem;
}

.backend-locked p {
  color: rgba(0, 217, 255, 0.7);
  margin-bottom: 1.5rem;
}

@media (max-width: 768px) {
  .account-panel {
    padding: 2rem 1.5rem;
  }

  .title-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
