import { onMounted } from 'vue'
import { toast } from 'vue-sonner'
import { pingBackend } from '@/services/health.service'

const FAST_TIMEOUT_MS = 6_000
const ATTEMPTS = 3
const WAKE_TIMEOUT_MS = 60_000
const RETRY_DELAY_MS = 15_000
const TOAST_ID = 'backend-wake'
const AWAKE_FLAG = 'backend-awake'

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isAwakeConfirmed(): boolean {
  return sessionStorage.getItem(AWAKE_FLAG) === '1'
}

function markAwake() {
  sessionStorage.setItem(AWAKE_FLAG, '1')
}

async function wakeAndNotify(): Promise<void> {
  toast.loading('Despertando el servidor…', { id: TOAST_ID, duration: Infinity })

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const ok = await pingBackend(WAKE_TIMEOUT_MS)
    if (ok) {
      markAwake()
      toast.success('El backend está corriendo. ¡Todo listo!', { id: TOAST_ID })
      return
    }
    if (attempt < ATTEMPTS) {
      toast.loading(`El servidor aún está despertando… (intento ${attempt} de ${ATTEMPTS})`, {
        id: TOAST_ID,
        duration: Infinity,
      })
      await wait(RETRY_DELAY_MS)
    }
  }

  toast.error('No se pudo conectar con el servidor. Intenta de nuevo en un momento.', {
    id: TOAST_ID,
  })
}

export function useBackendWake() {
  onMounted(async () => {
    // Ya confirmado en esta pestaña: los refrescos no vuelven a despertar el backend.
    if (isAwakeConfirmed()) return

    // Chequeo rápido: si responde, el backend ya está corriendo y no hace falta despertarlo.
    const awake = await pingBackend(FAST_TIMEOUT_MS)
    if (awake) {
      markAwake()
      toast.success('El backend está corriendo. ¡Todo listo!', { id: TOAST_ID })
      return
    }

    // No respondió: el backend está dormido (Render). Despiértalo.
    await wakeAndNotify()
  })
}
