import * as index from '../src/index'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const expectTypeExport = <T>() => 'noop'

describe('index', () => {
  test('has the correct exports', () => {
    expect(typeof index.IntegreSQLClient).toEqual('function')
    expectTypeExport<index.IntegreSQLClientOptions>()

    expect(typeof index.IntegreSQLApiClient).toEqual('function')
    expectTypeExport<index.IntegreSQLApiClientOptions>()

    expect(typeof index.IntegreSQLApiClientError).toEqual('function')
    expectTypeExport<index.CreateIntegreSQLApiClientErrorOptions>()

    expectTypeExport<index.IntegreSQLDatabaseConfig>()
  })
})
