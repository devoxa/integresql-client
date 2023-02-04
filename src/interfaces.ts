export interface IntegreSQLDatabaseConfig {
  username: string
  password: string
  host: string
  port: number
  database: string
}

export interface InitializeTemplateResponse {
  database: {
    templateHash: string
    config: IntegreSQLDatabaseConfig
  }
}

export interface GetTestDatabaseResponse {
  id: number
  database: {
    templateHash: string
    config: IntegreSQLDatabaseConfig
  }
}
