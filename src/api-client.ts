import fetch from 'node-fetch'
import path from 'path'
import { createIntegreSQLApiClientError } from './api-client-error'
import { GetTestDatabaseResponse, InitializeTemplateResponse } from './interfaces'

export interface IntegreSQLApiClientOptions {
  url: string
}

export class IntegreSQLApiClient {
  baseUrl: string

  constructor(options: IntegreSQLApiClientOptions) {
    const url = new URL(options.url)
    this.baseUrl = url.toString() + 'api/v1'
  }

  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = path.join(this.baseUrl, endpoint)

    const response = await fetch(url, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: { 'Content-Type': 'application/json' },
    })

    const text = await response.text()

    if (response.status >= 400) {
      throw createIntegreSQLApiClientError({ responseStatus: response.status, responseText: text })
    }

    return text ? JSON.parse(text) : null
  }

  async initializeTemplate(hash: string) {
    return this.request<InitializeTemplateResponse>('POST', '/templates', { hash })
  }

  async finalizeTemplate(hash: string) {
    return this.request<null>('PUT', `/templates/${hash}`)
  }

  async discardTemplate(hash: string) {
    return this.request<null>('DELETE', `/templates/${hash}`)
  }

  async discardAllTemplates() {
    return this.request<null>('DELETE', `/admin/templates`)
  }

  async getTestDatabase(hash: string) {
    return this.request<GetTestDatabaseResponse>('GET', `/templates/${hash}/tests`)
  }

  async reuseTestDatabase(hash: string, id: number) {
    return this.request<null>('DELETE', `/templates/${hash}/tests/${id}`)
  }
}
