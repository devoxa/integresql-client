export class IntegreSQLApiClientError extends Error {
  responseStatus: number
  responseText: string
}

export interface CreateIntegreSQLApiClientErrorOptions {
  message: string
  responseStatus: number
  responseText: string
}

export function createIntegreSQLApiClientError(options: CreateIntegreSQLApiClientErrorOptions) {
  const error = new IntegreSQLApiClientError(options.message)
  error.responseStatus = options.responseStatus
  error.responseText = options.responseText
  return error
}
