import { defineStore } from 'pinia'
import { ref } from 'vue'

interface RetryItemState {
  consecutiveErrors: number
  cooldownRemaining: number
  cooldownTimer: ReturnType<typeof setInterval> | null
}

export const useRetryStore = defineStore('retry', () => {
  const items = ref<Record<string, RetryItemState>>({})

  function getOrCreate(key: string): RetryItemState {
    if (!items.value[key]) {
      items.value[key] = {
        consecutiveErrors: 0,
        cooldownRemaining: 0,
        cooldownTimer: null,
      }
    }
    return items.value[key]
  }

  function incrementErrors(key: string): number {
    const item = getOrCreate(key)
    item.consecutiveErrors++
    return item.consecutiveErrors
  }

  function startCooldown(key: string, seconds: number) {
    const item = getOrCreate(key)
    clearCooldown(key)
    item.cooldownRemaining = seconds
    item.cooldownTimer = setInterval(() => {
      if (item.cooldownRemaining > 1) {
        item.cooldownRemaining--
      } else {
        clearCooldown(key)
      }
    }, 1000)
  }

  function clearCooldown(key: string) {
    const item = items.value[key]
    if (item?.cooldownTimer !== null && item?.cooldownTimer !== undefined) {
      clearInterval(item.cooldownTimer)
    }
    if (item) {
      item.cooldownTimer = null
      item.cooldownRemaining = 0
    }
  }

  function reset(key: string) {
    const item = items.value[key]
    if (item) {
      clearCooldown(key)
      item.consecutiveErrors = 0
    }
  }

  return {
    getOrCreate,
    incrementErrors,
    startCooldown,
    clearCooldown,
    reset,
  }
})
