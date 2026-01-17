<template>
  <div class="login-container">
    <div class="login-panel">
      <div class="login-status">
        <span class="status-dot" :class="backendReady ? 'online' : 'offline'"></span>
        <span class="status-text">{{ backendReady ? 'LINK OK' : 'LINK OFF' }}</span>
        <span class="status-divider"></span>
        <span class="status-mode">{{ isRegisterMode ? $t('注册模式') : $t('登录模式') }}</span>
      </div>
      <h2 class="title">{{ isRegisterMode ? $t('注册账号') : $t('登录/注册') }}</h2>
      <p v-if="backendReady" class="subtitle">
        {{ isRegisterMode ? $t('注册新用户名，踏入异世界。') : $t('登录账户，以便同步云端数据。') }}
      </p>
      <p v-else class="subtitle">未配置后端服务器，登录/注册不可用</p>

      <form v-if="backendReady" @submit.prevent="isRegisterMode ? handleRegister() : handleLogin()">
        <div class="form-group">
          <label for="username">{{ $t('用户名') }}</label>
          <input type="text" id="username" v-model="username" :placeholder="$t('请输入您的用户名')" required />
        </div>

        <div class="form-group">
          <label for="password">{{ $t('密码') }}</label>
          <input type="password" id="password" v-model="password" :placeholder="$t('请输入您的身份密码')" required />
        </div>

        <div v-if="isRegisterMode" class="form-group">
          <label for="confirmPassword">{{ $t('确认密码') }}</label>
          <input type="password" id="confirmPassword" v-model="confirmPassword" :placeholder="$t('请再次输入密码')" required />
        </div>

        <!-- 邮箱字段（注册时显示） -->
        <div v-if="isRegisterMode" class="form-group">
          <label for="email">{{ $t('邮箱') }} <span class="optional">({{ $t('可选') }})</span></label>
          <input type="email" id="email" v-model="email" :placeholder="$t('请输入您的邮箱')" />
        </div>

        <!-- 邀请码字段（注册时显示） -->
        <div v-if="isRegisterMode" class="form-group">
          <label for="invitationCode">{{ $t('邀请码') }} <span class="required">*</span></label>
          <input type="text" id="invitationCode" v-model="invitationCode" :placeholder="$t('请输入邀请码')" required />
        </div>

        <!-- 邮箱验证（仅注册且启用时显示） -->
        <template v-if="isRegisterMode && emailVerificationEnabled">
          <div class="form-group">
            <label for="emailCode">{{ $t('验证码') }}</label>
            <div class="email-input-row">
              <input type="text" id="emailCode" v-model="emailCode" :placeholder="$t('请输入邮箱验证码')" required />
              <button
                type="button"
                class="btn btn-small"
                @click="sendEmailCode"
                :disabled="sendingCode || emailCooldown > 0 || !email"
              >
                {{ emailCooldown > 0 ? `${emailCooldown}s` : (sendingCode ? '发送中...' : '发送验证码') }}
              </button>
            </div>
          </div>
        </template>

        <!-- Turnstile 人机验证 -->
        <div v-if="turnstileEnabled" class="form-group turnstile-group">
          <div ref="turnstileContainer" class="turnstile-container"></div>
        </div>

        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>

        <div class="form-actions">
           <button type="button" @click="emit('back')" class="btn btn-secondary">{{ $t('返回') }}</button>
           <button type="submit" class="btn" :class="{ 'is-loading': isLoading }" :disabled="isLoading">
             <span class="btn-text">{{ isRegisterMode ? $t('注册') : $t('登入') }}</span>
           </button>
        </div>

        <div class="form-footer">
          <a href="#" @click.prevent="toggleMode" class="link">
            {{ isRegisterMode ? $t('已有用户名？立即登入') : $t('没有账号？立即注册') }}
          </a>
          <div v-if="!isRegisterMode" class="admin-login-toggle">
            <label class="admin-checkbox">
              <input type="checkbox" v-model="isAdminLogin" />
              <span>{{ $t('管理员登录') }}</span>
            </label>
          </div>
        </div>
      </form>

      <div v-else class="form-actions">
        <button type="button" @click="emit('back')" class="btn btn-secondary">{{ $t('返回') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { toast } from '../utils/toast';
import { request } from '../services/request';
import { waitForTurnstile, renderTurnstile, resetTurnstile, removeTurnstile } from '../services/turnstile';
import { isBackendConfigured } from '@/services/backendConfig';

const emit = defineEmits(['loggedIn', 'back']);

const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const email = ref('');
const invitationCode = ref('');
const emailCode = ref('');
const isLoading = ref(false);
const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const isRegisterMode = ref(false);
const isAdminLogin = ref(false);
const backendReady = ref(isBackendConfigured());

// 安全配置（从后端获取）
const turnstileEnabled = ref(false);
const turnstileSiteKey = ref('');
const emailVerificationEnabled = ref(false);

// Turnstile 相关
const turnstileContainer = ref<HTMLElement | null>(null);
const turnstileWidgetId = ref<string | null>(null);
const turnstileToken = ref('');

// 邮箱验证码相关
const sendingCode = ref(false);
const emailCooldown = ref(0);
let cooldownTimer: ReturnType<typeof setInterval> | null = null;

// 从后端获取安全配置
const fetchSecuritySettings = async () => {
  try {
    const data = await request<{
      turnstile_enabled: boolean;
      turnstile_site_key: string;
      email_verification_enabled: boolean;
    }>('/api/v1/auth/security-settings');
    turnstileEnabled.value = data.turnstile_enabled;
    turnstileSiteKey.value = data.turnstile_site_key || '';
    emailVerificationEnabled.value = data.email_verification_enabled;
  } catch (e) {
    console.warn('[Security] 获取配置失败:', e);
    turnstileEnabled.value = false;
    emailVerificationEnabled.value = false;
  }
};

const toggleMode = () => {
  isRegisterMode.value = !isRegisterMode.value;
  error.value = null;
  successMessage.value = null;
  password.value = '';
  confirmPassword.value = '';
  email.value = '';
  emailCode.value = '';
  turnstileToken.value = '';
  if (turnstileEnabled.value) {
    resetTurnstile(turnstileWidgetId.value);
  }
};

// 发送邮箱验证码
const sendEmailCode = async () => {
  if (!email.value) {
    error.value = '请先输入邮箱';
    return;
  }

  // 简单的邮箱格式验证
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailPattern.test(email.value)) {
    error.value = '邮箱格式不正确';
    return;
  }

  sendingCode.value = true;
  error.value = null;

  try {
    const res = await request<{ success: boolean; message: string }>('/api/v1/auth/send-email-code', {
      method: 'POST',
      body: JSON.stringify({
        email: email.value,
        purpose: 'register',
      }),
    });

    if (res.success) {
      toast.success('验证码已发送，请查收邮件');
      // 开始倒计时
      emailCooldown.value = 60;
      cooldownTimer = setInterval(() => {
        emailCooldown.value--;
        if (emailCooldown.value <= 0) {
          if (cooldownTimer) {
            clearInterval(cooldownTimer);
            cooldownTimer = null;
          }
        }
      }, 1000);
    } else {
      error.value = res.message || '发送失败';
    }
  } catch (e: any) {
    error.value = e.detail || e.message || '发送验证码失败';
  } finally {
    sendingCode.value = false;
  }
};

const initTurnstile = async () => {
  if (!turnstileEnabled.value || !turnstileSiteKey.value) return;
  if (!turnstileContainer.value) return;

  const ok = await waitForTurnstile();
  if (!ok) {
    error.value = '人机验证组件加载失败，请检查网络或刷新页面后重试';
    return;
  }

  try {
    removeTurnstile(turnstileWidgetId.value);
    turnstileWidgetId.value = renderTurnstile(turnstileContainer.value, {
      siteKey: turnstileSiteKey.value,
      theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light',
      onSuccess: (token) => {
        turnstileToken.value = token;
        error.value = null;
      },
      onExpired: () => {
        turnstileToken.value = '';
      },
      onError: () => {
        turnstileToken.value = '';
        error.value = '无效域。如果此问题仍然存在，请与站点管理员联系。';
      },
    });
  } catch (e) {
    console.error('[Turnstile] render failed:', e);
    error.value = '人机验证组件渲染失败，请刷新页面后重试';
  }
};

// 监听 turnstileEnabled 变化，启用后初始化
watch(turnstileEnabled, (enabled) => {
  if (enabled && turnstileSiteKey.value) {
    setTimeout(() => void initTurnstile(), 100);
  }
});

onMounted(async () => {
  if (!backendReady.value) return;
  await fetchSecuritySettings();
});

onBeforeUnmount(() => {
  removeTurnstile(turnstileWidgetId.value);
  if (cooldownTimer) {
    clearInterval(cooldownTimer);
  }
});

const handleRegister = async () => {
  if (isLoading.value) return;
  if (!backendReady.value) {
    toast.info('未配置后端服务器，注册不可用');
    return;
  }
  if (password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致！';
    return;
  }

  // 邀请码必填检查
  if (!invitationCode.value) {
    error.value = '请输入邀请码';
    toast.error(error.value);
    return;
  }

  // 邮箱验证检查
  if (emailVerificationEnabled.value) {
    if (!email.value) {
      error.value = '请输入邮箱';
      return;
    }
    if (!emailCode.value) {
      error.value = '请输入邮箱验证码';
      return;
    }
  }

  // Turnstile 验证检查
  if (turnstileEnabled.value && !turnstileToken.value) {
    error.value = '请先完成人机验证';
    toast.error(error.value);
    return;
  }

  isLoading.value = true;
  error.value = null;
  successMessage.value = null;

  try {
    const body: Record<string, any> = {
      user_name: username.value,
      password: password.value,
    };

    // 添加邮箱
    if (email.value) {
      body.email = email.value;
    }

    // 添加邀请码（必填）
    body.invitation_code = invitationCode.value;

    // 添加邮箱验证信息
    if (emailVerificationEnabled.value) {
      if (!emailCode.value) {
        error.value = '请输入邮箱验证码';
        return;
      }
      body.email_code = emailCode.value;
    }

    // 添加 Turnstile token
    if (turnstileEnabled.value && turnstileToken.value) {
      body.turnstile_token = turnstileToken.value;
    }

    await request<any>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    toast.success('用户名注册成功，欢迎踏入霓虹之城！');

    // 注册成功后切换到登录模式，让用户手动登录
    successMessage.value = '注册成功！请登录您的用户名';
    isRegisterMode.value = false;
    turnstileToken.value = '';
    if (turnstileEnabled.value) {
      resetTurnstile(turnstileWidgetId.value);
    }

  } catch (e: unknown) {
    let errorMessage = '一个未知的错误发生了';
    if (typeof e === 'object' && e !== null) {
      if ('detail' in e && typeof (e as any).detail === 'string') {
        errorMessage = (e as any).detail;
      } else if ('message' in e && typeof (e as any).message === 'string') {
        errorMessage = (e as any).message;
      }
    }
    error.value = errorMessage;
    toast.error(errorMessage);
  } finally {
    isLoading.value = false;
    turnstileToken.value = '';
    if (turnstileEnabled.value) {
      resetTurnstile(turnstileWidgetId.value);
    }
  }
};

const handleLogin = async () => {
  if (isLoading.value) return;
  if (!backendReady.value) {
    toast.info('未配置后端服务器，登录不可用');
    return;
  }

  // Turnstile 验证检查
  if (turnstileEnabled.value && !turnstileToken.value) {
    error.value = '请先完成人机验证';
    toast.error(error.value);
    return;
  }

  isLoading.value = true;
  error.value = null;
  successMessage.value = null;

  try {
    const body: Record<string, any> = {
      username: username.value,
      password: password.value,
      is_admin: isAdminLogin.value,
    };
    if (turnstileEnabled.value && turnstileToken.value) {
      body.turnstile_token = turnstileToken.value;
    }

    const data = await request<any>('/api/v1/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('username', username.value);

    // 根据用户勾选的状态设置管理员标记
    if (isAdminLogin.value) {
      localStorage.setItem('is_admin', 'true');
    } else {
      localStorage.removeItem('is_admin');
    }

    toast.success('登入成功，异世界已连通！');
    emit('loggedIn');

  } catch (e: unknown) {
    let errorMessage = '一个未知的错误发生了';
    if (typeof e === 'object' && e !== null) {
      if ('detail' in e && typeof (e as any).detail === 'string') {
        errorMessage = (e as any).detail;
      } else if ('message' in e && typeof (e as any).message === 'string') {
        errorMessage = (e as any).message;
      }
    }
    error.value = errorMessage;
    toast.error(errorMessage);
  } finally {
    isLoading.value = false;
    turnstileToken.value = '';
    if (turnstileEnabled.value) {
      resetTurnstile(turnstileWidgetId.value);
    }
  }
};
</script>

<style scoped>
.login-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: radial-gradient(1200px 600px at 10% 10%, rgba(0, 240, 255, 0.08), transparent 60%),
    radial-gradient(900px 500px at 90% 20%, rgba(138, 43, 255, 0.08), transparent 55%),
    linear-gradient(160deg, #05070f 0%, #0b0f1a 45%, #0a1122 100%);
  position: relative;
  overflow: hidden;
}

.login-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(0deg, transparent 24%, rgba(0, 240, 255, 0.03) 25%, rgba(0, 240, 255, 0.03) 26%, transparent 27%, transparent 74%, rgba(0, 240, 255, 0.03) 75%, rgba(0, 240, 255, 0.03) 76%, transparent 77%, transparent),
    linear-gradient(90deg, transparent 24%, rgba(0, 240, 255, 0.03) 25%, rgba(0, 240, 255, 0.03) 26%, transparent 27%, transparent 74%, rgba(0, 240, 255, 0.03) 75%, rgba(0, 240, 255, 0.03) 76%, transparent 77%, transparent);
  background-size: 48px 48px;
  pointer-events: none;
  z-index: 0;
}

.login-container::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent 35%, transparent 65%, rgba(255, 255, 255, 0.03));
  mix-blend-mode: screen;
  opacity: 0.35;
  pointer-events: none;
}

.login-panel {
  width: 100%;
  max-width: 400px;
  padding: 2.5rem;
  background: linear-gradient(135deg, rgba(8, 12, 22, 0.96), rgba(10, 14, 28, 0.92));
  border: 1px solid rgba(0, 240, 255, 0.5);
  border-radius: 10px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.55), 0 0 30px rgba(0, 240, 255, 0.25);
  position: relative;
  z-index: 1;
  clip-path: polygon(0 0, 96% 0, 100% 8%, 100% 100%, 4% 100%, 0 92%);
}

.login-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 1px solid rgba(138, 43, 255, 0.4);
  border-radius: 10px;
  pointer-events: none;
  clip-path: polygon(0 0, 96% 0, 100% 8%, 100% 100%, 4% 100%, 0 92%);
}

.login-status {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(0, 240, 255, 0.75);
  margin-bottom: 1.25rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff2d6f;
  box-shadow: 0 0 10px rgba(255, 45, 111, 0.8);
}

.status-dot.online {
  background: #00f0ff;
  box-shadow: 0 0 12px rgba(0, 240, 255, 0.9);
}

.status-divider {
  width: 1px;
  height: 12px;
  background: rgba(0, 240, 255, 0.3);
}

.status-mode {
  color: rgba(255, 122, 0, 0.85);
}

.title {
  text-align: center;
  font-family: var(--font-family-serif);
  font-size: 1.9rem;
  color: #00f0ff;
  margin-top: 0;
  margin-bottom: 0.5rem;
  text-shadow: 0 0 25px rgba(0, 240, 255, 0.6);
}

.subtitle {
  text-align: center;
  color: rgba(138, 43, 255, 0.7);
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: rgba(0, 240, 255, 0.9);
  font-size: 0.9rem;
}

.form-group input {
  width: 100%;
  padding: 0.8rem 1rem;
  background: linear-gradient(135deg, rgba(6, 9, 18, 0.8), rgba(12, 16, 32, 0.85));
  border: 1px solid rgba(0, 240, 255, 0.35);
  border-radius: 6px;
  color: #00f0ff;
  font-size: 1rem;
  box-sizing: border-box;
  transition: all 0.3s ease;
}

.form-group input::placeholder {
  color: rgba(0, 217, 255, 0.3);
}

.form-group input:focus {
  outline: none;
  border-color: rgba(0, 240, 255, 0.9);
  box-shadow: 0 0 18px rgba(0, 240, 255, 0.35), inset 0 0 12px rgba(0, 240, 255, 0.15);
  background: linear-gradient(135deg, rgba(6, 9, 18, 0.95), rgba(14, 18, 38, 0.95));
}

.email-input-row {
  display: flex;
  gap: 0.5rem;
}

.email-input-row input {
  flex: 1;
}

.btn-small {
  padding: 0.8rem 1rem;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 100px;
  border: 1px solid rgba(0, 240, 255, 0.8);
  background: linear-gradient(135deg, rgba(0, 240, 255, 0.12), rgba(138, 43, 255, 0.12));
  color: #00f0ff;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 15px rgba(0, 240, 255, 0.2);
}

.btn-small:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(0, 217, 255, 0.2), rgba(157, 0, 255, 0.15));
  box-shadow: 0 0 25px rgba(0, 217, 255, 0.4);
}

.btn-small:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.turnstile-group {
  margin-top: 0.25rem;
}

.turnstile-container {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 72px;
}

.error-message {
    color: var(--tech-danger);
    text-align: center;
    margin-bottom: 1rem;
    animation: fadeIn 0.3s ease;
    background: linear-gradient(135deg, rgba(255, 0, 85, 0.1), rgba(255, 0, 85, 0.05));
    border: 1px solid rgba(255, 0, 85, 0.3);
    padding: 0.75rem;
    border-radius: 4px;
}

.success-message {
    color: var(--tech-success);
    text-align: center;
    margin-bottom: 1rem;
    animation: fadeIn 0.3s ease;
    background: linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 255, 136, 0.05));
    border: 1px solid rgba(0, 255, 136, 0.3);
    padding: 0.75rem;
    border-radius: 4px;
}

.form-actions {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 2rem;
}

.form-footer {
    text-align: center;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--tech-border);
}

.link {
    color: var(--tech-primary);
    text-decoration: none;
    transition: all 0.3s ease;
    font-weight: 500;
}

.link:hover {
    color: #fff;
    text-shadow: 0 0 10px rgba(0, 217, 255, 0.8);
}

.admin-login-toggle {
    margin-top: 1rem;
}

.admin-checkbox {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    cursor: pointer;
    color: rgba(0, 217, 255, 0.7);
    font-size: 0.9rem;
    transition: all 0.3s ease;
}

.admin-checkbox input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: var(--tech-warning);
}

.admin-checkbox:hover {
    color: var(--tech-warning);
}

.btn {
  padding: 0.8rem 1.5rem;
  border-radius: 6px;
  border: 1px solid rgba(0, 240, 255, 0.8);
  background: linear-gradient(135deg, rgba(0, 240, 255, 0.18), rgba(138, 43, 255, 0.12));
  color: #00f0ff;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  box-shadow: 0 0 18px rgba(0, 240, 255, 0.25);
}

.btn:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(0, 217, 255, 0.25), rgba(157, 0, 255, 0.15));
  box-shadow: 0 0 30px rgba(0, 217, 255, 0.4);
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-secondary {
  border-color: var(--tech-secondary);
  background: linear-gradient(135deg, rgba(157, 0, 255, 0.1), rgba(157, 0, 255, 0.05));
  color: var(--tech-secondary);
  box-shadow: 0 0 15px rgba(157, 0, 255, 0.2);
}

.btn-secondary:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(157, 0, 255, 0.2), rgba(157, 0, 255, 0.1));
  box-shadow: 0 0 25px rgba(157, 0, 255, 0.4);
}

.btn.is-loading {
  opacity: 0.7;
  pointer-events: none;
}

.btn-text {
  display: inline-block;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
