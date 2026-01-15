<template>
  <div class="toast-container">
    <transition-group name="toast-fade" tag="div">
      <div v-for="toast in toasts" :key="toast.id" :class="['toast', `toast-${toast.type}`]">
        <div v-if="toast.type === 'loading'" class="toast-icon">
          <div class="spinner"></div>
        </div>
        <div class="toast-message" v-html="toast.message"></div>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { toastsReadonly as toasts } from '@/utils/toast';
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 20000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 16px;
}

.toast {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  border-radius: 4px;
  background: linear-gradient(135deg, rgba(15, 21, 53, 0.95), rgba(10, 14, 39, 0.95));
  border: 2px solid;
  box-shadow: 0 0 20px rgba(0, 217, 255, 0.3);
  color: var(--tech-primary);
  min-width: 250px;
  max-width: 400px;
  margin-bottom: 8px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  animation: toast-slide-in 0.3s ease-out;
}

@keyframes toast-slide-in {
  from {
    opacity: 0;
    transform: translateX(100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.toast-icon {
  margin-right: 12px;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
}

.toast-message {
  word-break: break-word;
  font-size: 0.95rem;
  line-height: 1.4;
  font-weight: 500;
}

/* Toast Types */
.toast-success {
  border-color: var(--tech-success);
  box-shadow: 0 0 20px rgba(0, 255, 170, 0.3);
}

.toast-success .toast-icon::before {
  content: '✓';
  color: var(--tech-success);
}

.toast-error {
  border-color: var(--tech-danger);
  box-shadow: 0 0 20px rgba(255, 0, 85, 0.3);
}

.toast-error .toast-icon::before {
  content: '✕';
  color: var(--tech-danger);
}

.toast-warning {
  border-color: var(--tech-warning);
  box-shadow: 0 0 20px rgba(255, 107, 0, 0.3);
}

.toast-warning .toast-icon::before {
  content: '⚠';
  color: var(--tech-warning);
}

.toast-info {
  border-color: var(--tech-primary);
  box-shadow: 0 0 20px rgba(0, 217, 255, 0.3);
}

.toast-info .toast-icon::before {
  content: 'ℹ';
  color: var(--tech-primary);
}

.toast-loading {
  border-color: var(--tech-primary);
  box-shadow: 0 0 20px rgba(0, 217, 255, 0.4);
}

/* Spinner for loading */
.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(0, 217, 255, 0.2);
  border-top-color: var(--tech-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  box-shadow: 0 0 10px rgba(0, 217, 255, 0.3);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Transitions */
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.5s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

@media (max-width: 768px) {
  .toast-container {
    top: 12px;
    right: 12px;
    gap: 12px;
  }

  .toast {
    min-width: 220px;
    max-width: 85vw;
  }
}
</style>
