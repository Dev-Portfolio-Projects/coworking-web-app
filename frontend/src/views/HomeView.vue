<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import {
    DoorOpen,
    CalendarCheck,
    Users,
    Boxes,
    BriefcaseBusiness,
} from "@lucide/vue";

import { Motion, AnimatePresence } from "motion-v";
import MouseGlowBackground from "@/components/MouseGlowBackground.vue";

const dynamicWords = [
  "tu oficina flexible",
  "tu espacio profesional",
  "tu lugar para crecer",
  "tu próxima sede",
  "tu espacio de trabajo",
];

const currentWord = ref(dynamicWords[0]);
const wordIndex = ref(0);

let wordTimer: number | undefined;

function changeWord() {
  wordIndex.value = (wordIndex.value + 1) % dynamicWords.length;

  currentWord.value = dynamicWords[wordIndex.value];
}

const carouselEl = ref<HTMLElement | null>(null);
const paused = ref(false);

let animationFrame = 0;
let offset = 0;

const CARD_WIDTH = 354;
const GAP = 24;

const cardsWidth = (CARD_WIDTH + GAP) * 5;

function animateCarousel() {
  if (!document.hidden && !paused.value && carouselEl.value) {
    offset -= 0.55;
    if (Math.abs(offset) >= cardsWidth) {
      offset = 0;
    }

    carouselEl.value.style.transform = `translate3d(${offset}px,0,0)`;
  }

  animationFrame = requestAnimationFrame(animateCarousel);
}

const cards = [
  {
    title: "Oficinas privadas equipadas",
    description:
      "Espacios exclusivos listos para trabajar con mobiliario profesional, internet rápido y privacidad para tu equipo.",
    icon: DoorOpen,
    badge: "Privacidad",
    metric: "Listas desde el primer día",
    gradient: "from-blue-500/20 to-blue-100",
    iconStyle: "bg-blue-600 text-white",
  },

  {
    title: "Coworking flexible",
    description:
      "Encuentra escritorios y espacios compartidos adaptados a tus horarios, necesidades y forma de trabajar.",
    icon: BriefcaseBusiness,
    badge: "Flexibilidad",
    metric: "Por horas, días o meses",
    gradient: "from-purple-500/20 to-purple-100",
    iconStyle: "bg-purple-600 text-white",
  },

  {
    title: "Reserva online inmediata",
    description:
      "Consulta disponibilidad, selecciona tu espacio y reserva en segundos desde cualquier dispositivo.",
    icon: CalendarCheck,
    badge: "Reservas",
    metric: "Disponible 24/7",
    gradient: "from-green-500/20 to-green-100",
    iconStyle: "bg-green-600 text-white",
  },

  {
    title: "Salas para reuniones",
    description:
      "Salas profesionales preparadas para reuniones, clientes, presentaciones y equipos de trabajo.",
    icon: Users,
    badge: "Reuniones",
    metric: "Ambientes profesionales",
    gradient: "from-pink-500/20 to-pink-100",
    iconStyle: "bg-pink-600 text-white",
  },

  {
        title: "Recursos incluidos",
    description:
      "WiFi rápido, café, zonas cómodas y todo lo necesario para trabajar sin preocuparte por detalles.",
        icon: Boxes,
        badge: "Todo incluido",
    metric: "Solo llega y trabaja",
    gradient: "from-orange-500/20 to-orange-100",
    iconStyle: "bg-orange-600 text-white",
  },
];

onMounted(() => {
  wordTimer = window.setInterval(changeWord, 2800);

  animationFrame = requestAnimationFrame(animateCarousel);
});

onUnmounted(() => {
  if (wordTimer) {
    clearInterval(wordTimer);
  }

  cancelAnimationFrame(animationFrame);
});
</script>

<template>
  <MouseGlowBackground>
    <div class="relative flex min-h-full flex-col overflow-hidden">
      <section
        class="relative z-10 mx-auto flex min-h-full w-full max-w-7xl flex-col items-center justify-center px-5 sm:px-8 lg:px-12"
      >
        <Motion
          class="w-full text-center"
          :initial="{
            opacity: 0,
            y: 25,
          }"
          :animate="{
            opacity: 1,
            y: 0,
          }"
          :transition="{
            duration: 0.7,
          }"
        >
          <h1
            class="mx-auto max-w-5xl text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl leading-[1.05]"
          >
            Trabaja mejor con

            <span class="text-blue-600">
              <AnimatePresence mode="wait">
                <Motion
                  :key="currentWord"
                  :initial="{
                    opacity: 0,
                    y: 20,
                  }"
                  :animate="{
                    opacity: 1,
                    y: 0,
                  }"
                  :exit="{
                    opacity: 0,
                    y: -20,
                  }"
                  :transition="{
                    duration: 0.35,
                  }"
                  class="inline-block"
                >
                  {{ currentWord }}
                </Motion>
              </AnimatePresence>
            </span>
          </h1>

          <div
            class="relative mt-10 w-full overflow-hidden py-6"
            @mouseenter="paused = true"
            @mouseleave="paused = false"
            @touchstart="paused = true"
            @touchend="paused = false"
          >
            <div
              class="absolute left-0 top-6 z-20 h-[294px] sm:h-[270px] w-24 bg-gradient-to-r from-gray-50 via-gray-50/80 to-transparent"
            />

            <div
              class="absolute right-0 top-6 z-20 h-[294px] sm:h-[270px] w-24 bg-gradient-to-l from-gray-50 via-gray-50/80 to-transparent"
            />

            <div
              ref="carouselEl"
              class="flex gap-6 will-change-transform"
            >
              <template v-for="loop in 2" :key="loop">
                <Motion
                  v-for="card in cards"
                  :key="`${loop}-${card.title}`"
                  class="group min-w-[280px] rounded-3xl border border-white/70 bg-white/80 p-6 text-left shadow-xl shadow-gray-200/40 backdrop-blur-xl sm:min-w-[330px]"
                  @mouseenter="paused = true"
                  @mouseleave="paused = false"
                  :whileHover="{
                    y: -8,
                    scale: 1.02,
                  }"
                  :transition="{
                    duration: 0.25,
                  }"
                >
                  <div class="flex items-start justify-between">
                    <div
                      class="flex h-12 w-12 items-center justify-center rounded-2xl"
                      :class="card.iconStyle"
                    >
                      <component :is="card.icon" :size="24" />
                    </div>

                    <span
                      class="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
                    >
                      {{ card.badge }}
                    </span>
                  </div>

                  <h3 class="mt-5 text-lg font-semibold text-gray-900">
                    {{ card.title }}
                  </h3>

                  <p class="mt-3 text-sm leading-relaxed text-gray-600">
                    {{ card.description }}
                  </p>

                  <div class="mt-5">
                    <span class="text-xs font-medium text-gray-500">
                      {{ card.metric }}
                    </span>
                  </div>
                </Motion>
              </template>
            </div>
          </div>
        </Motion>
      </section>
    </div>
  </MouseGlowBackground>
</template>
