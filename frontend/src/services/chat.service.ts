import httpClient from './http.client'

export interface ChatResponse {
  reply: string
  waitSeconds: number
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

type ChatRequestConfig = Parameters<typeof httpClient.post>[2] & { skipToast?: boolean }

export const chatService = {
  async sendMessage(message: string) {
    const res = await httpClient.post<ApiResponse<ChatResponse>>(
      '/chat',
      { message },
      { skipToast: true } as ChatRequestConfig,
    )
    return res.data.data
  },
}
