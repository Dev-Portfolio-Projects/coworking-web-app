<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { Building2, Coffee, CalendarCheck } from "@lucide/vue";
import { Motion } from "motion-v";
import MouseGlowBackground from "@/components/MouseGlowBackground.vue";

const phrases = [
  "Alquila un coworking diseñado para crecer",
  "Espacios profesionales sin complicaciones",
  "Encuentra el lugar perfecto para tu equipo",
  "Oficinas y escritorios adaptados a tu ritmo",
  "Trabaja en un espacio creado para tus objetivos",
  "Tu espacio de trabajo, cuando lo necesitas",
  "Coworking flexible para profesionales y empresas",
  "Una oficina moderna para impulsar tus proyectos",
  "Todo lo que necesitas para trabajar mejor",
  "Un lugar profesional para tus mejores ideas",
  "Espacios privados y colaborativos para crecer",
  "Coworking pensado para emprendedores y equipos",
];

const displayedText = ref("");
const phraseIndex = ref(0);

let typingTimer: number;
let animationFrame: number;

let deleting = false;

const typeWriter = () => {
  const currentPhrase = phrases[phraseIndex.value];

  if (!deleting) {
    displayedText.value = currentPhrase.slice(
      0,
      displayedText.value.length + 1,
    );

    if (displayedText.value === currentPhrase) {
      deleting = true;

      typingTimer = window.setTimeout(typeWriter, 1800);

      return;
    }
  } else {
    displayedText.value = currentPhrase.slice(
      0,
      displayedText.value.length - 1,
    );

    if (displayedText.value.length === 0) {
      deleting = false;

      phraseIndex.value = (phraseIndex.value + 1) % phrases.length;
    }
  }

  typingTimer = window.setTimeout(typeWriter, deleting ? 35 : 80);
};

const carouselX = ref(0);
const paused = ref(false);

const animateCarousel = () => {
  if (!paused.value) {
    carouselX.value -= 0.7;

    if (carouselX.value <= -2016) {
      carouselX.value = 0;
    }
  }

  animationFrame = requestAnimationFrame(animateCarousel);
};

onMounted(() => {
  typeWriter();

  animateCarousel();
});

onUnmounted(() => {
  clearTimeout(typingTimer);

  cancelAnimationFrame(animationFrame);
});

const cards = [
  {
    title: "Espacios adaptables",
    description:
      "Oficinas privadas y zonas colaborativas pensadas para cada forma de trabajo.",
    icon: Building2,
    color: "bg-blue-100 text-blue-600",
  },

  {
    title: "Servicios incluidos",
    description:
      "Conectividad, café, impresión y todo lo necesario para enfocarte.",
    icon: Coffee,
    color: "bg-green-100 text-green-600",
  },

  {
    title: "Reserva inmediata",
    description:
      "Elige tu espacio, selecciona el horario y comienza cuando quieras.",
    icon: CalendarCheck,
    color: "bg-purple-100 text-purple-600",
  },

  {
    title: "Salas profesionales",
    description:
      "Salas equipadas para reuniones, presentaciones y encuentros importantes.",
    icon: Building2,
    color: "bg-orange-100 text-orange-600",
  },

  {
    title: "Comunidad activa",
    description:
      "Conecta con emprendedores, equipos y profesionales en un mismo lugar.",
    icon: Coffee,
    color: "bg-pink-100 text-pink-600",
  },

  {
    title: "Ubicación estratégica",
    description:
      "Accede a un espacio cómodo y preparado para impulsar tus proyectos.",
    icon: CalendarCheck,
    color: "bg-indigo-100 text-indigo-600",
  },
];
</script>

<template>
  <MouseGlowBackground>
    <div class="relative h-full overflow-hidden">
      <section
        class="relative z-10 mx-auto flex h-full max-w-6xl flex-col items-center justify-center px-6 text-center"
      >
        <Motion
          class="w-full"
          :initial="{
            opacity: 0,
            scale: 0.97,
          }"
          :animate="{
            opacity: 1,
            scale: 1,
          }"
          :transition="{
            duration: 0.8,
          }"
        >
          <h1
            class="min-h-[130px] text-4xl font-bold tracking-tight text-gray-900 sm:min-h-[150px] sm:text-5xl lg:text-6xl"
          >
            {{ displayedText }}

            <span class="animate-pulse text-blue-600"> | </span>
          </h1>

          <p class="mx-auto max-w-2xl text-lg leading-relaxed text-gray-600">
            Soluciones flexibles para profesionales y equipos que buscan
            productividad, comodidad y un espacio listo para trabajar.
          </p>

          <div
            class="relative mt-10 w-full overflow-hidden py-3"
            @mouseenter="paused = true"
            @mouseleave="paused = false"
          >

            <div
              class="pointer-events-none absolute left-0 top-1/2 z-20 h-[240px] w-32 -translate-y-1/2 bg-gradient-to-r from-gray-50 via-gray-50/90 to-transparent"
            ></div>

            <div
              class="pointer-events-none absolute right-0 top-1/2 z-20 h-[240px] w-32 -translate-y-1/2 bg-gradient-to-l from-gray-50 via-gray-50/90 to-transparent"
            ></div>

            <Motion
              class="flex gap-6"
              :style="{
                transform: `translateX(${carouselX}px)`,
              }"
            >
              <template v-for="loop in 2" :key="loop">
                <article
                  v-for="card in cards"
                  :key="`${loop}-${card.title}`"
                  class="min-w-[300px] rounded-2xl border border-gray-200 bg-white p-8 text-left"
                >
                  <div
                    class="mb-5 flex h-12 w-12 items-center justify-center rounded-xl"
                    :class="card.color"
                  >
                    <component :is="card.icon" :size="24" stroke-width="2" />
                  </div>

                  <h3 class="text-lg font-semibold text-gray-900">
                    {{ card.title }}
                  </h3>

                  <p class="mt-3 text-sm leading-relaxed text-gray-600">
                    {{ card.description }}
                  </p>
                </article>
              </template>
            </Motion>
          </div>
        </Motion>
      </section>
    </div>
  </MouseGlowBackground>
</template>
