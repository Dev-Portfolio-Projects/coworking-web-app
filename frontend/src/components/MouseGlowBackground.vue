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

const smoothX = ref(0);
const smoothY = ref(0);

let frame = 0;

const targetX = ref(0);
const targetY = ref(0);

const handleMouseMove = (event: MouseEvent) => {
  targetX.value = event.clientX;
  targetY.value = event.clientY;
};

const animate = () => {
  smoothX.value += (targetX.value - smoothX.value) * 0.08;

  smoothY.value += (targetY.value - smoothY.value) * 0.08;

  mouseX.value = smoothX.value;
  mouseY.value = smoothY.value;

  frame = requestAnimationFrame(animate);
};

onMounted(() => {
  frame = requestAnimationFrame(animate);
});

onUnmounted(() => {
  cancelAnimationFrame(frame);
});
</script>

<template>
  <div
    class="relative h-full overflow-hidden bg-gradient-to-b from-white via-gray-50 to-white"
    @mousemove="handleMouseMove"
  >
    <Motion
      class="pointer-events-none absolute left-0 top-0 h-[650px] w-[650px] rounded-full blur-[160px]"
      :class="primaryColor"
      :animate="{
        x: (mouseX - 325) * intensity,

        y: (mouseY - 325) * intensity,

        scale: [1, 1.08, 1],
      }"
      :transition="{
        x: {
          type: 'spring',
          stiffness: 35,
          damping: 45,
        },

        y: {
          type: 'spring',
          stiffness: 35,
          damping: 45,
        },

        scale: {
          duration: 6,
          repeat: Infinity,
        },
      }"
    />

    <Motion
      class="pointer-events-none absolute right-0 top-1/3 h-[450px] w-[450px] rounded-full blur-[140px]"
      :class="secondaryColor"
      :animate="{
        x: (mouseX - 225) * -0.35,

        y: (mouseY - 225) * -0.35,

        scale: [1, 1.15, 1],
      }"
      :transition="{
        x: {
          type: 'spring',
          stiffness: 20,
          damping: 50,
        },

        y: {
          type: 'spring',
          stiffness: 20,
          damping: 50,
        },

        scale: {
          duration: 8,
          repeat: Infinity,
        },
      }"
    />

    <Motion
      class="pointer-events-none absolute bottom-[-150px] left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-blue-300/10 blur-[130px]"
      :animate="{
        scale: [1, 1.1, 1],
      }"
      :transition="{
        duration: 10,
        repeat: Infinity,
        ease: 'easeInOut',
      }"
    />

    <div class="relative z-10 h-full">
      <slot />
    </div>
  </div>
</template>
