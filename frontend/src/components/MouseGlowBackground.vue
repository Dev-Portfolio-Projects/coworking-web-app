<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const props = withDefaults(
  defineProps<{
    intensity?: number;
    primaryColor?: string;
    secondaryColor?: string;
  }>(),
  {
    intensity: 1,
    primaryColor: "bg-blue-400/20",
    secondaryColor: "bg-purple-400/20",
  },
);

const primaryBlob = ref<HTMLDivElement | null>(null);
const secondaryBlob = ref<HTMLDivElement | null>(null);

const mouse = { x: 0, y: 0 };
const target = { x: 0, y: 0 };

let animationFrame = 0;
let running = false;
let idleTimer: ReturnType<typeof setTimeout> | null = null;

function stopLoop() {
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
  if (running) {
    running = false;
    cancelAnimationFrame(animationFrame);
  }
}

function tick() {
  mouse.x += (target.x - mouse.x) * 0.12;
  mouse.y += (target.y - mouse.y) * 0.12;

  if (primaryBlob.value) {
    primaryBlob.value.style.transform = `translate3d(${(mouse.x - 260) * props.intensity}px, ${(mouse.y - 260) * props.intensity}px, 0)`;
  }

  if (secondaryBlob.value) {
    secondaryBlob.value.style.transform = `translate3d(${(mouse.x - 190) * -0.35}px, ${(mouse.y - 190) * -0.35}px, 0)`;
  }

  if (running) {
    animationFrame = requestAnimationFrame(tick);
  }
}

function startLoop() {
  if (document.hidden) return;
  if (!running) {
    running = true;
    animationFrame = requestAnimationFrame(tick);
  }
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(stopLoop, 1500);
}

function handleMouseMove(event: MouseEvent) {
  target.x = event.clientX;
  target.y = event.clientY;
  startLoop();
}

function handleVisibility() {
  if (document.hidden) {
    stopLoop();
  } else {
    startLoop();
  }
}

onMounted(() => {
  window.addEventListener("mousemove", handleMouseMove, { passive: true });
  document.addEventListener("visibilitychange", handleVisibility);
  startLoop();
});

onUnmounted(() => {
  stopLoop();
  window.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("visibilitychange", handleVisibility);
});
</script>

<template>
  <div
    class="relative flex h-full min-h-0 flex-col overflow-hidden bg-gradient-to-b from-white via-gray-50 to-white"
  >
    <div
      ref="primaryBlob"
      class="pointer-events-none absolute left-0 top-0 h-[520px] w-[520px] will-change-transform"
    >
      <div
        class="glow-scale h-full w-full rounded-full blur-[80px]"
        :class="props.primaryColor"
      />
    </div>

    <div
      ref="secondaryBlob"
      class="pointer-events-none absolute right-0 top-1/3 h-[380px] w-[380px] will-change-transform"
    >
      <div
        class="glow-scale-alt h-full w-full rounded-full blur-[64px]"
        :class="props.secondaryColor"
      />
    </div>

    <div
      class="pointer-events-none absolute bottom-[-120px] left-1/2 h-[450px] w-[800px] -translate-x-1/2"
    >
      <div class="glow-scale-slow h-full w-full rounded-full bg-blue-300/10 blur-[80px]" />
    </div>

    <div class="relative z-10 flex min-h-0 flex-1 flex-col">
      <slot />
    </div>
  </div>
</template>

<style scoped>
@keyframes glow-scale {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
}

@keyframes glow-scale-alt {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.12);
  }
}

@keyframes glow-scale-slow {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.glow-scale {
  animation: glow-scale 6s ease-in-out infinite;
  will-change: transform;
}

.glow-scale-alt {
  animation: glow-scale-alt 8s ease-in-out infinite;
  will-change: transform;
}

.glow-scale-slow {
  animation: glow-scale-slow 10s ease-in-out infinite;
  will-change: transform;
}
</style>
