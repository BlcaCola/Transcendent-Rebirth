<template>
  <div class="action-menu" :class="positionClass" :style="offsetStyle">
    <transition name="menu-fade">
      <div v-if="open" class="overlay" @click="close"></div>
    </transition>

    <transition name="menu-pop">
      <div v-if="open" class="menu" @click.stop>
        <slot name="menu" :close="close" />
      </div>
    </transition>

    <button
      class="fab"
      :title="open ? closeTitle : openTitle"
      :aria-label="open ? closeTitle : openTitle"
      :aria-expanded="open"
      @click="toggle"
    >
      <component :is="open ? X : Menu" :size="22" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Menu, X } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    position?: 'top-right' | 'bottom-right';
    offsetPx?: number;
    openTitle?: string;
    closeTitle?: string;
  }>(),
  {
    position: 'bottom-right',
    offsetPx: 24,
    openTitle: '菜单',
    closeTitle: '关闭',
  },
);

const open = ref(false);

const close = () => {
  open.value = false;
};

const toggle = () => {
  open.value = !open.value;
};

const positionClass = computed(() => {
  return props.position === 'top-right' ? 'pos-top-right' : 'pos-bottom-right';
});

const offsetStyle = computed(() => {
  const px = `${props.offsetPx}px`;
  if (props.position === 'top-right') return { top: px, right: px };
  return { bottom: px, right: px };
});
</script>

<style scoped>
.action-menu {
  position: fixed;
  z-index: 120;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(2px);
  z-index: 0;
}

.fab {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  background: linear-gradient(135deg, rgba(0, 217, 255, 0.1), rgba(157, 0, 255, 0.08));
  backdrop-filter: blur(10px);
  border: 2px solid var(--tech-primary);
  color: var(--tech-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  position: relative;
  z-index: 2;
  box-shadow: 0 0 20px rgba(0, 217, 255, 0.3), inset 0 0 10px rgba(0, 217, 255, 0.1);
}

.fab:hover {
  background: linear-gradient(135deg, rgba(0, 217, 255, 0.2), rgba(157, 0, 255, 0.12));
  color: var(--tech-primary);
  border-color: var(--tech-primary);
  transform: translateY(-2px);
  box-shadow: 0 0 30px rgba(0, 217, 255, 0.5), inset 0 0 15px rgba(0, 217, 255, 0.15);
}

.menu {
  position: absolute;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border-radius: 4px;
  background: linear-gradient(135deg, rgba(15, 21, 53, 0.98), rgba(10, 14, 39, 0.98));
  border: 2px solid var(--tech-primary);
  box-shadow: 0 0 30px rgba(0, 217, 255, 0.4), inset 0 0 20px rgba(0, 217, 255, 0.1);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  z-index: 2;
  min-width: 180px;
  white-space: nowrap;
}

:deep(.action-menu-item) {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 4px;
  border: 1px solid var(--tech-border);
  background: linear-gradient(135deg, rgba(0, 217, 255, 0.05), rgba(157, 0, 255, 0.03));
  color: var(--tech-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;
  text-decoration: none;
  font-family: inherit;
  font-size: 0.95rem;
  box-sizing: border-box;
  font-weight: 500;
}

/* 确保 <a> 标签作为菜单项时样式一致 */
:deep(a.action-menu-item) {
  display: flex;
}

:deep(.action-menu-item:hover) {
  background: linear-gradient(135deg, rgba(0, 217, 255, 0.15), rgba(157, 0, 255, 0.1));
  border-color: var(--tech-primary);
  color: var(--tech-primary);
  transform: translateX(-2px);
  box-shadow: 0 0 15px rgba(0, 217, 255, 0.3);
}

:deep(.action-menu-item.is-disabled) {
  opacity: 0.45;
  cursor: not-allowed;
  pointer-events: none;
}

:deep(.action-menu-item span) {
  font-size: 0.95rem;
  letter-spacing: 0.05em;
}

:deep(.action-menu-item.is-danger) {
  border-color: var(--tech-danger);
  color: var(--tech-danger);
  background: linear-gradient(135deg, rgba(255, 0, 85, 0.08), rgba(255, 0, 85, 0.03));
}

:deep(.action-menu-item.is-danger:hover) {
  border-color: var(--tech-danger);
  background: linear-gradient(135deg, rgba(255, 0, 85, 0.15), rgba(255, 0, 85, 0.08));
  box-shadow: 0 0 15px rgba(255, 0, 85, 0.3);
}

.pos-bottom-right .menu {
  bottom: 62px;
}

.pos-top-right .menu {
  top: 62px;
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.18s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
}

.menu-pop-enter-active,
.menu-pop-leave-active {
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.menu-pop-enter-from,
.menu-pop-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.98);
}

@media (max-width: 600px) {
  .action-menu {
    bottom: 12px;
    right: 12px;
    top: auto;
  }

  .pos-top-right {
    top: 12px;
    bottom: auto;
  }

  .fab {
    width: 40px;
    height: 40px;
    border-radius: 10px;
  }

  .pos-bottom-right .menu {
    bottom: 52px;
    min-width: 150px;
  }

  .pos-top-right .menu {
    top: 52px;
    min-width: 150px;
  }
}
</style>
