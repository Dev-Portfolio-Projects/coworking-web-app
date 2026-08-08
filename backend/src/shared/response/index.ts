export interface SuccessResponse<T = unknown> {
  success: true
  message: string
  data: T
}

export function success<T>(data: T, message: string): SuccessResponse<T> {
  return { success: true, message, data }
}
