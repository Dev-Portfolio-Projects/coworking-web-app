<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from "vue";
import { Motion } from "motion-v";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Doughnut, Bar } from "vue-chartjs";
import type { ChartData, ChartOptions } from "chart.js";
import {
  CalendarCheck,
  DoorOpen,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  ChevronRight,
  XCircle,
} from "@lucide/vue";
import MouseGlowBackground from "@/components/MouseGlowBackground.vue";
import { useDashboardStore } from "@/stores/dashboard.store";
import { useAuthStore } from "@/stores/auth.store";
import { useRouter } from "vue-router";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const dashboard = useDashboardStore();
const auth = useAuthStore();
const router = useRouter();

const PRIMARY = "#2563eb";
const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#22c55e",
  CANCELLED: "#ef4444",
};

const statusLabel: Record<string, string> = {
  PENDING: "Pendientes",
  CONFIRMED: "Confirmadas",
  CANCELLED: "Canceladas",
};

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const POLL_INTERVAL_MS = 5000;

let pollTimer: ReturnType<typeof setInterval> | null = null;

async function refresh() {
  if (document.visibilityState !== "visible") return;
  await dashboard.fetchData();
}

function handleVisibilityChange() {
  if (document.visibilityState === "visible") refresh();
}

onMounted(() => {
  dashboard.fetchData();
  document.addEventListener("visibilitychange", handleVisibilityChange);
  pollTimer = setInterval(refresh, POLL_INTERVAL_MS);
});

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer);
  document.removeEventListener("visibilitychange", handleVisibilityChange);
});

function formatCurrency(value: number) {
  return `$ ${value.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatNumber(value: number) {
  return value.toLocaleString("es-ES");
}

function formatShortDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });
}

function formatBookingDate(value: string | null) {
  if (!value) return "Por definir";
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const kpis = computed(() => {
  const c = dashboard.data?.counters;
  return [
    {
      label: "Espacios activos",
      value: c ? formatNumber(c.availableSpaces) : "—",
      hint: c ? `${formatNumber(c.totalSpaces)} en total` : "",
      icon: DoorOpen,
      box: "bg-blue-100 text-blue-600",
    },
    {
      label: "Reservas confirmadas",
      value: c ? formatNumber(c.confirmedBookings) : "—",
      hint: c ? `${formatNumber(c.pendingBookings)} pendientes` : "",
      icon: CalendarCheck,
      box: "bg-green-100 text-green-600",
    },
    {
      label: "Ingresos",
      value: c ? formatCurrency(c.revenue) : "—",
      hint: "Reservas confirmadas",
      icon: DollarSign,
      box: "bg-purple-100 text-purple-600",
    },
    {
      label: "Clientes registrados",
      value: c ? formatNumber(c.clients) : "—",
      hint: "Cuentas activas",
      icon: Users,
      box: "bg-amber-100 text-amber-600",
    },
  ];
});

const lineLabels = computed(() => dashboard.data?.bookingsByDay.map((d) => formatShortDate(d.date)) ?? []);
const lineTotals = computed(() => dashboard.data?.bookingsByDay.map((d) => d.total) ?? []);

const lineData = computed<ChartData<"line">>(() => ({
  labels: lineLabels.value,
  datasets: [
    {
      label: "Reservas",
      data: lineTotals.value,
      borderColor: PRIMARY,
      backgroundColor: "rgba(37, 99, 235, 0.12)",
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointBackgroundColor: PRIMARY,
      borderWidth: 2,
    },
  ],
}));

const lineOptions = computed<ChartOptions<"line">>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#111827",
      padding: 10,
      cornerRadius: 8,
      titleFont: { family: "Inter, system-ui, sans-serif" },
      bodyFont: { family: "Inter, system-ui, sans-serif" },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "#6b7280", maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
    },
    y: {
      beginAtZero: true,
      ticks: { color: "#6b7280", precision: 0 },
      grid: { color: "#f3f4f6" },
      border: { display: false },
    },
  },
}));

const doughnutData = computed<ChartData<"doughnut">>(() => {
  const byStatus = dashboard.data?.bookingsByStatus ?? [];
  return {
    labels: byStatus.map((s) => statusLabel[s.status] ?? s.status),
    datasets: [
      {
        data: byStatus.map((s) => s.total),
        backgroundColor: byStatus.map((s) => STATUS_COLORS[s.status]),
        borderColor: "#ffffff",
        borderWidth: 3,
        hoverOffset: 6,
      },
    ],
  };
});

const doughnutOptions = computed<ChartOptions<"doughnut">>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: "70%",
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        usePointStyle: true,
        boxWidth: 8,
        padding: 16,
        color: "#374151",
        font: { family: "Inter, system-ui, sans-serif", size: 12 },
      },
    },
    tooltip: {
      backgroundColor: "#111827",
      padding: 10,
      cornerRadius: 8,
      titleFont: { family: "Inter, system-ui, sans-serif" },
      bodyFont: { family: "Inter, system-ui, sans-serif" },
    },
  },
}));

const barLabels = computed(() => dashboard.data?.bookingsBySpace.map((s) => s.spaceName) ?? []);
const barTotals = computed(() => dashboard.data?.bookingsBySpace.map((s) => s.total) ?? []);

const barData = computed<ChartData<"bar">>(() => ({
  labels: barLabels.value,
  datasets: [
    {
      label: "Reservas",
      data: barTotals.value,
      backgroundColor: PRIMARY,
      borderRadius: 8,
      borderSkipped: false,
      maxBarThickness: 26,
    },
  ],
}));

const barOptions = computed<ChartOptions<"bar">>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: "y",
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#111827",
      padding: 10,
      cornerRadius: 8,
      titleFont: { family: "Inter, system-ui, sans-serif" },
      bodyFont: { family: "Inter, system-ui, sans-serif" },
    },
  },
  scales: {
    x: {
      beginAtZero: true,
      ticks: { color: "#6b7280", precision: 0 },
      grid: { color: "#f3f4f6" },
      border: { display: false },
    },
    y: {
      grid: { display: false },
      ticks: { color: "#374151", font: { family: "Inter, system-ui, sans-serif", size: 12 } },
    },
  },
}));

const hasBarData = computed(() => barLabels.value.length > 0);
</script>

<template>
  <MouseGlowBackground>
    <div class="relative h-full overflow-y-auto">
      <div class="relative z-10 mx-auto w-full max-w-6xl px-6 pb-10 pt-5">
        <Motion :initial="{ opacity: 0, y: -15 }" :animate="{ opacity: 1, y: 0 }" :transition="{ duration: 0.5 }">
          <div>
            <h1 class="text-3xl font-bold tracking-tight text-gray-900">Panel de control</h1>
            <p class="mt-1 text-sm text-gray-500 sm:text-base">
              Hola, {{ auth.user?.name }}. Así va el movimiento de WorkPlace.
            </p>
          </div>
        </Motion>

        <div v-if="dashboard.error && !dashboard.data" class="mt-6">
          <div class="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            <XCircle :size="18" />
            {{ dashboard.error }}
            <button class="ml-auto rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700" @click="dashboard.fetchData()">
              Reintentar
            </button>
          </div>
        </div>

        <div v-if="!dashboard.data && dashboard.loading" class="flex justify-center pt-24">
          <Motion :animate="{ rotate: 360 }" :transition="{ duration: 1.2, repeat: Infinity, ease: 'linear' }">
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
              <TrendingUp :size="28" />
            </div>
          </Motion>
        </div>

        <template v-if="dashboard.data">
          <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Motion
              v-for="(kpi, i) in kpis"
              :key="kpi.label"
              :initial="{ opacity: 0, y: 15 }"
              :animate="{ opacity: 1, y: 0 }"
              :transition="{ delay: i * 0.07, duration: 0.4 }"
            >
              <div class="rounded-2xl border border-gray-200 bg-white/80 p-5 backdrop-blur-xl">
                <div class="flex items-center justify-between">
                  <span class="flex h-11 w-11 items-center justify-center rounded-2xl" :class="kpi.box">
                    <component :is="kpi.icon" :size="22" />
                  </span>
                  <TrendingUp :size="16" class="text-gray-300" />
                </div>
                <p class="mt-4 text-2xl font-bold tracking-tight text-gray-900">{{ kpi.value }}</p>
                <p class="mt-0.5 text-sm font-medium text-gray-500">{{ kpi.label }}</p>
                <p class="mt-0.5 text-xs text-gray-400">{{ kpi.hint }}</p>
              </div>
            </Motion>
          </div>

          <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Motion
              :initial="{ opacity: 0, y: 15 }"
              :animate="{ opacity: 1, y: 0 }"
              :transition="{ delay: 0.2, duration: 0.4 }"
              class="lg:col-span-2"
            >
              <div class="flex h-full flex-col rounded-2xl border border-gray-200 bg-white/80 p-5 backdrop-blur-xl">
                <div class="mb-4 flex items-center justify-between">
                  <div>
                    <h2 class="text-base font-semibold text-gray-900">Reservas por día</h2>
                    <p class="text-xs text-gray-500">Últimos 14 días</p>
                  </div>
                  <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <CalendarCheck :size="18" />
                  </span>
                </div>
                <div class="relative h-64 flex-1">
                  <Line :data="lineData" :options="lineOptions" />
                </div>
              </div>
            </Motion>

            <Motion
              :initial="{ opacity: 0, y: 15 }"
              :animate="{ opacity: 1, y: 0 }"
              :transition="{ delay: 0.3, duration: 0.4 }"
            >
              <div class="flex h-full flex-col rounded-2xl border border-gray-200 bg-white/80 p-5 backdrop-blur-xl">
                <div class="mb-2 flex items-center justify-between">
                  <div>
                    <h2 class="text-base font-semibold text-gray-900">Estado de reservas</h2>
                    <p class="text-xs text-gray-500">Distribución total</p>
                  </div>
                  <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <Clock :size="18" />
                  </span>
                </div>
                <div class="relative h-64 flex-1">
                  <Doughnut :data="doughnutData" :options="doughnutOptions" />
                </div>
              </div>
            </Motion>
          </div>

          <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Motion
              :initial="{ opacity: 0, y: 15 }"
              :animate="{ opacity: 1, y: 0 }"
              :transition="{ delay: 0.35, duration: 0.4 }"
              class="lg:col-span-2"
            >
              <div class="flex h-full flex-col rounded-2xl border border-gray-200 bg-white/80 p-5 backdrop-blur-xl">
                <div class="mb-4 flex items-center justify-between">
                  <div>
                    <h2 class="text-base font-semibold text-gray-900">Espacios más reservados</h2>
                    <p class="text-xs text-gray-500">Top 5, sin canceladas</p>
                  </div>
                  <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                    <DoorOpen :size="18" />
                  </span>
                </div>
                <div v-if="hasBarData" class="relative h-64 flex-1">
                  <Bar :data="barData" :options="barOptions" />
                </div>
                <div v-else class="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
                  <DoorOpen :size="28" class="text-gray-300" />
                  <p class="text-sm text-gray-500">Aún no hay reservas registradas.</p>
                </div>
              </div>
            </Motion>

            <Motion
              :initial="{ opacity: 0, y: 15 }"
              :animate="{ opacity: 1, y: 0 }"
              :transition="{ delay: 0.45, duration: 0.4 }"
            >
              <div class="flex h-full flex-col rounded-2xl border border-gray-200 bg-white/80 p-5 backdrop-blur-xl">
                <h2 class="text-base font-semibold text-gray-900">Accesos rápidos</h2>
                <p class="text-xs text-gray-500">Gestión administrativa</p>
                <div class="mt-4 flex flex-col gap-2">
                  <button
                    class="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-blue-50 hover:text-blue-600"
                    @click="router.push('/admin/reservas')"
                  >
                    <CalendarCheck :size="17" class="shrink-0 text-gray-400" />
                    Ver reservas
                    <ChevronRight :size="16" class="ml-auto text-gray-300" />
                  </button>
                  <button
                    class="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-blue-50 hover:text-blue-600"
                    @click="router.push('/admin/espacios')"
                  >
                    <DoorOpen :size="17" class="shrink-0 text-gray-400" />
                    Gestionar espacios
                    <ChevronRight :size="16" class="ml-auto text-gray-300" />
                  </button>
                  <button
                    class="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-blue-50 hover:text-blue-600"
                    @click="router.push('/admin/usuarios')"
                  >
                    <Users :size="17" class="shrink-0 text-gray-400" />
                    Ver usuarios
                    <ChevronRight :size="16" class="ml-auto text-gray-300" />
                  </button>
                </div>
              </div>
            </Motion>
          </div>

          <Motion
            :initial="{ opacity: 0, y: 15 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ delay: 0.5, duration: 0.4 }"
            class="mt-4"
          >
            <div class="rounded-2xl border border-gray-200 bg-white/80 p-5 backdrop-blur-xl">
              <div class="mb-3 flex items-center justify-between">
                <div>
                  <h2 class="text-base font-semibold text-gray-900">Reservas recientes</h2>
                  <p class="text-xs text-gray-500">Últimas actividades</p>
                </div>
                <button
                  class="text-sm font-medium text-blue-600 transition hover:text-blue-700"
                  @click="router.push('/admin/reservas')"
                >
                  Ver todas
                </button>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr class="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                      <th class="pb-2 pr-4 font-medium">Espacio</th>
                      <th class="pb-2 pr-4 font-medium">Cliente</th>
                      <th class="pb-2 pr-4 font-medium">Fecha</th>
                      <th class="pb-2 pr-4 font-medium">Horario</th>
                      <th class="pb-2 pr-4 font-medium">Total</th>
                      <th class="pb-2 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-50">
                    <tr v-for="b in dashboard.data.recentBookings" :key="b.id" class="transition hover:bg-gray-50/60">
                      <td class="py-3 pr-4 font-medium text-gray-900">{{ b.spaceName }}</td>
                      <td class="py-3 pr-4 text-gray-600">{{ b.userName }}</td>
                      <td class="py-3 pr-4 text-gray-600">{{ formatBookingDate(b.date) }}</td>
                      <td class="py-3 pr-4 text-gray-600">
                        <span v-if="b.startTime && b.endTime">{{ b.startTime }} - {{ b.endTime }}</span>
                        <span v-else class="text-gray-400">—</span>
                      </td>
                      <td class="py-3 pr-4 font-medium text-gray-900">
                        <span v-if="b.totalPrice">${{ b.totalPrice }}</span>
                        <span v-else class="text-gray-400">—</span>
                      </td>
                      <td class="py-3">
                        <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium" :class="statusStyles[b.status]">
                          {{ statusLabel[b.status] }}
                        </span>
                      </td>
                    </tr>
                    <tr v-if="dashboard.data.recentBookings.length === 0">
                      <td colspan="6" class="py-10 text-center text-sm text-gray-500">No hay reservas todavía.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Motion>
        </template>
      </div>
    </div>
  </MouseGlowBackground>
</template>
