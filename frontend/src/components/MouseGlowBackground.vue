<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { Motion } from "motion-v";

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

const mouseX = ref(0);
const mouseY = ref(0);

const targetX = ref(0);
const targetY = ref(0);

let animationFrame = 0;

function handleMouseMove(event: MouseEvent) {
  targetX.value = event.clientX;
  targetY.value = event.clientY;
}

function animate() {
  mouseX.value += (targetX.value - mouseX.value) * 0.18;
  mouseY.value += (targetY.value - mouseY.value) * 0.18;

  animationFrame = requestAnimationFrame(animate);
}

onMounted(() => {
  window.addEventListener("mousemove", handleMouseMove);
  animationFrame = requestAnimationFrame(animate);
});

onUnmounted(() => {
  window.removeEventListener("mousemove", handleMouseMove);
  cancelAnimationFrame(animationFrame);
});
</script>

<template>
  <div
    class="relative flex h-full min-h-0 flex-col overflow-hidden bg-gradient-to-b from-white via-gray-50 to-white"
  >
    <Motion
      class="pointer-events-none absolute left-0 top-0 h-[520px] w-[520px] rounded-full blur-[120px]"
      :class="primaryColor"
      :animate="{
        x: (mouseX - 260) * props.intensity,
        y: (mouseY - 260) * props.intensity,
        scale: [1, 1.08, 1],
      }"
      :transition="{
        x: {
          duration: 0.15,
          ease: 'easeOut',
        },
        y: {
          duration: 0.15,
          ease: 'easeOut',
        },
        scale: {
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      }"
    />

    <Motion
      class="pointer-events-none absolute right-0 top-1/3 h-[380px] w-[380px] rounded-full blur-[100px]"
      :class="secondaryColor"
      :animate="{
        x: (mouseX - 190) * -0.35,
        y: (mouseY - 190) * -0.35,
        scale: [1, 1.12, 1],
      }"
      :transition="{
        x: {
          duration: 0.2,
          ease: 'easeOut',
        },
        y: {
          duration: 0.2,
          ease: 'easeOut',
        },
        scale: {
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      }"
    />

    <Motion
      class="pointer-events-none absolute bottom-[-120px] left-1/2 h-[450px] w-[800px] -translate-x-1/2 rounded-full bg-blue-300/10 blur-[120px]"
      :animate="{
        scale: [1, 1.1, 1],
      }"
      :transition="{
        duration: 10,
        repeat: Infinity,
        ease: 'easeInOut',
      }"
    />

    <div class="relative z-10 flex min-h-0 flex-1 flex-col">
      <slot />
    </div>
  </div>
</template>
