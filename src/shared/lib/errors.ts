import { ApiError } from '@/shared/api/api-client'

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.details.length ? `${error.message}: ${error.details.join(', ')}` : error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Произошла неизвестная ошибка'
}
