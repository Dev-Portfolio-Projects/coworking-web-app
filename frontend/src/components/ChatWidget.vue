<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted, watch } from "vue";
import { MessageCircle, Send, X, Bot, User, Trash2 } from "@lucide/vue";
import { chatService } from "@/services/chat.service";

const DEFAULT_WAIT_SECONDS = 15;
const STORAGE_KEY = "workplace_chat_history";
const DEFAULT_GREETING =
  "¡Hola! Soy el asistente de WorkPlace. Pregúntame por espacios disponibles, capacidad, horarios o cómo reservar.";

interface ChatMessage {
  role: "user" | "bot";
  text: string;
}

const open = ref(false);
const input = ref("");
const pending = ref(false);
const buttonRemaining = ref(0);
const elapsed = ref(0);
const nextWaitSeconds = ref(DEFAULT_WAIT_SECONDS);
const listRef = ref<HTMLElement | null>(null);

const messages = ref<ChatMessage[]>([]);

let countdownTimer: ReturnType<typeof setInterval> | null = null;
let elapsedTimer: ReturnType<typeof setInterval> | null = null;

function cleanBotText(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/^\s*\*+\s+/gm, "")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/\*\*/g, "")
    .trim();
}

function startButtonCountdown() {
  stopButtonCountdown();
  buttonRemaining.value = nextWaitSeconds.value;
  countdownTimer = setInterval(() => {
    buttonRemaining.value -= 1;
    if (buttonRemaining.value <= 0 && countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
      buttonRemaining.value = 0;
    }
  }, 1000);
}

function stopButtonCountdown() {
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = null;
}

function startElapsedTimer() {
  elapsed.value = 0;
  elapsedTimer = setInterval(() => {
    elapsed.value += 1;
  }, 1000);
}

function stopElapsedTimer() {
  if (elapsedTimer) clearInterval(elapsedTimer);
  elapsedTimer = null;
}

function scrollToBottom() {
  void nextTick(() => {
    if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight;
  });
}

function persist() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ messages: messages.value, waitSeconds: nextWaitSeconds.value }),
  );
}

function restore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw) as { messages?: ChatMessage[]; waitSeconds?: number };
    if (Array.isArray(saved.messages) && saved.messages.length > 0) {
      messages.value = saved.messages;
    }
    if (typeof saved.waitSeconds === "number" && saved.waitSeconds > 0) {
      nextWaitSeconds.value = saved.waitSeconds;
    }
  } catch {
    /* historial corrupto: se ignora */
  }
}

async function send() {
  const text = input.value.trim();
  if (!text || pending.value || buttonRemaining.value > 0) return;

  messages.value.push({ role: "user", text });
  input.value = "";
  pending.value = true;
  startElapsedTimer();
  startButtonCountdown();
  scrollToBottom();

  try {
    const res = await chatService.sendMessage(text);
    nextWaitSeconds.value = res.waitSeconds ?? DEFAULT_WAIT_SECONDS;
    messages.value.push({ role: "bot", text: cleanBotText(res.reply) });
  } catch {
    messages.value.push({
      role: "bot",
      text: "No pude procesar tu consulta. Inténtalo nuevamente en unos momentos.",
    });
  } finally {
    pending.value = false;
    stopElapsedTimer();
    scrollToBottom();
  }
}

function clearChat() {
  stopButtonCountdown();
  stopElapsedTimer();
  pending.value = false;
  buttonRemaining.value = 0;
  elapsed.value = 0;
  nextWaitSeconds.value = DEFAULT_WAIT_SECONDS;
  messages.value = [{ role: "bot", text: DEFAULT_GREETING }];
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    void send();
  }
}

watch([messages, nextWaitSeconds], persist, { deep: true });

onMounted(() => {
  restore();
  if (messages.value.length === 0) {
    messages.value.push({ role: "bot", text: DEFAULT_GREETING });
  }
});

onUnmounted(() => {
  stopButtonCountdown();
  stopElapsedTimer();
});
</script>

<template>
  <div class="fixed bottom-5 right-5 z-[900] flex flex-col items-end gap-3">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-4 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-4 scale-95"
    >
      <div
        v-if="open"
        class="flex h-[480px] w-[min(92vw,380px)] flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl"
      >
        <header class="flex items-center justify-between bg-blue-600 px-4 py-3 text-white">
          <div class="flex items-center gap-2.5">
            <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
              <Bot :size="20" />
            </span>
            <div>
              <p class="text-sm font-semibold leading-tight">Asistente virtual</p>
              <p class="text-xs leading-tight text-blue-100">WorkPlace · solo clientes</p>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button
              class="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-white/20"
              :aria-label="'Limpiar conversación'"
              :title="'Limpiar conversación'"
              @click="clearChat"
            >
              <Trash2 :size="18" />
            </button>
            <button
              class="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-white/20"
              @click="open = false"
            >
              <X :size="18" />
            </button>
          </div>
        </header>

        <div ref="listRef" class="scroll-area flex-1 space-y-3 overflow-y-auto px-4 py-4">
          <div
            v-for="(m, i) in messages"
            :key="i"
            class="flex"
            :class="m.role === 'user' ? 'justify-end' : 'justify-start'"
          >
            <div
              class="flex max-w-[85%] items-start gap-2"
              :class="m.role === 'user' ? 'flex-row-reverse' : ''"
            >
              <span
                class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl"
                :class="m.role === 'user' ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-600'"
              >
                <component :is="m.role === 'user' ? User : Bot" :size="15" />
              </span>
              <p
                class="whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                :class="m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'"
              >
                {{ m.text }}
              </p>
            </div>
          </div>

          <div v-if="pending" class="flex items-center gap-2 text-xs text-gray-500">
            <span class="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Bot :size="15" />
            </span>
            <span>El asistente está respondiendo… {{ elapsed }}s</span>
          </div>
        </div>

        <div class="border-t border-gray-200 p-3">
          <div class="flex items-end gap-2">
            <textarea
              v-model="input"
              rows="1"
              :disabled="pending"
              placeholder="Escribe tu consulta…"
              class="max-h-28 min-h-[42px] flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
              @keydown="onKeydown"
            />
            <button
              class="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="pending || buttonRemaining > 0 || !input.trim()"
              @click="send"
            >
              <template v-if="buttonRemaining > 0">
                <span>{{ buttonRemaining }}</span>
              </template>
              <Send v-else :size="18" />
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <button
      class="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl transition hover:scale-105 hover:bg-blue-700"
      :aria-label="open ? 'Cerrar asistente' : 'Abrir asistente'"
      @click="open = !open"
    >
      <component :is="open ? X : MessageCircle" :size="24" />
    </button>
  </div>
</template>

<style scoped>
.scroll-area {
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: #2563eb transparent;
}

.scroll-area::-webkit-scrollbar {
  width: 8px;
}

.scroll-area::-webkit-scrollbar-track {
  background: transparent;
}

.scroll-area::-webkit-scrollbar-thumb {
  background: #2563eb;
  border-radius: 9999px;
}
</style>
