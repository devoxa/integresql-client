export class IntegreSQLApiClientError extends Error {
  responseStatus: number
  responseText: string
}

export interface CreateIntegreSQLApiClientErrorOptions {
  responseStatus: number
  responseText: string
}

export function createIntegreSQLApiClientError(options: CreateIntegreSQLApiClientErrorOptions) {
  const message = `API request to IntegreSQL failed: ${options.responseText} (Status ${options.responseStatus})`

  const error = new IntegreSQLApiClientError(message)
  error.responseStatus = options.responseStatus
  error.responseText = options.responseText
  return error
}
