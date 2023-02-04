import { IntegreSQLApiClient } from './api-client'
import { IntegreSQLApiClientError } from './api-client-error'
import { sha1HashFiles } from './hash'
import { IntegreSQLDatabaseConfig } from './interfaces'

export interface IntegreSQLClientOptions {
  url: string
}

export class IntegreSQLClient {
  api: IntegreSQLApiClient

  constructor(options: IntegreSQLClientOptions) {
    this.api = new IntegreSQLApiClient({ url: options.url })
  }

  async initializeTemplate(
    hash: string,
    setupCallback: (databaseConfig: IntegreSQLDatabaseConfig) => Promise<void>
  ): Promise<void> {
    // Attempt to create a new template database identified through the hash
    let databaseConfig
    try {
      const response = await this.api.initializeTemplate(hash)
      databaseConfig = response.database.config
    } catch (err) {
      // Some other process has already created a template database for this hash,
      // so we can just consider it ready at this point.
      if (err instanceof IntegreSQLApiClientError && err.responseStatus === 423) {
        return
      }

      throw err
    }

    // The template database is created and ready for setup (apply migrations / seed fixtures)
    try {
      await setupCallback(databaseConfig)
    } catch (err) {
      // If we encountered any errors during setup we discard the template database
      await this.api.discardTemplate(hash)

      throw err
    }

    // The template database is setup and ready for tests
    await this.api.finalizeTemplate(hash)

    // Warm up the template database, since getting the first test database can take a second or two
    await this.getTestDatabase(hash)
  }

  async getTestDatabase(hash: string): Promise<IntegreSQLDatabaseConfig> {
    const response = await this.api.getTestDatabase(hash)
    return response.database.config
  }

  // --- Helpers --- //

  async hashFiles(globPatterns: Array<string>): Promise<string> {
    return sha1HashFiles(globPatterns)
  }

  databaseConfigToConnectionUrl(databaseConfig: IntegreSQLDatabaseConfig): string {
    const { username, password, host, port, database } = databaseConfig
    return `postgresql://${username}:${password}@${host}:${port}/${database}`
  }
}
