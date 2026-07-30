import { ref, computed } from 'vue'
import { useRetryStore } from '@/stores/retry.store'

export function useRetryButton(key: string) {
  const store = useRetryStore()
  const isLoading = ref(false)

  function getCooldownDuration(errors: number): number {
    return Math.max(0, errors - 2) * 5
  }

  const item = computed(() => store.getOrCreate(key))
  const consecutiveErrors = computed(() => item.value.consecutiveErrors)
  const cooldownRemaining = computed(() => item.value.cooldownRemaining)
  const isBlocked = computed(() => cooldownRemaining.value > 0)

  async function execute(action: () => Promise<void>): Promise<void> {
    if (isBlocked.value || isLoading.value) return

    isLoading.value = true

    try {
      await action()
      store.reset(key)
    } catch {
      const errors = store.incrementErrors(key)
      if (errors >= 3) {
        store.startCooldown(key, getCooldownDuration(errors))
      }
    } finally {
      isLoading.value = false
    }
  }

  function reset() {
    isLoading.value = false
    store.reset(key)
  }

  return {
    isLoading,
    isBlocked,
    consecutiveErrors,
    cooldownRemaining,
    execute,
    reset,
  }
}
