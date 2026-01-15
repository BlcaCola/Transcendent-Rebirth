<template>
  <transition name="fade">
    <div v-if="uiStore.isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="spinner"></div>
        <p class="loading-text" v-html="uiStore.loadingText"></p>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { useUIStore } from '@/stores/uiStore';

const uiStore = useUIStore();
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(10, 14, 39, 0.85), rgba(15, 21, 53, 0.85));
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  border-top: 2px solid var(--tech-primary);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(0, 217, 255, 0.2);
  border-top-color: var(--tech-primary);
  border-right-color: var(--tech-secondary);
  border-radius: 50%;
  animation: spin 1.2s linear infinite;
  box-shadow: 0 0 20px rgba(0, 217, 255, 0.4), inset 0 0 20px rgba(0, 217, 255, 0.1);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: var(--tech-primary);
  font-size: 1.2rem;
  font-weight: 600;
  text-shadow: 0 0 15px rgba(0, 217, 255, 0.5);
  letter-spacing: 0.05em;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
