import * as index from '../src/index'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const expectTypeExport = <T>() => 'noop'

describe('index', () => {
  it('has the correct exports', () => {
    expect(typeof index.IntegreSQLApiClient).toEqual('function')
    expectTypeExport<index.IntegreSQLApiClientOptions>()

    expect(typeof index.IntegreSQLApiClientError).toEqual('function')
    expectTypeExport<index.IntegreSQLApiClientErrorOptions>()

    expectTypeExport<index.IntegreSQLDatabaseConfig>()
  })
})
