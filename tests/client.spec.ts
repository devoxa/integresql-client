import { IntegreSQLApiClient } from '../src/apiClient'
import { createIntegreSQLApiClientError } from '../src/apiClientError'
import { IntegreSQLClient } from '../src/client'
import { sha1HashFiles } from '../src/hash'
import { IntegreSQLDatabaseConfig } from '../src/interfaces'

jest.mock('../src/apiClient')
const mockIntegreSQLApiClient = jest.mocked(IntegreSQLApiClient)
const MockIntegreSQLApiClient = mockIntegreSQLApiClient.prototype

jest.mock('../src/hash')
const mockSha1HashFiles = jest.mocked(sha1HashFiles)

const client = new IntegreSQLClient({ url: 'http://localhost:5000' })

const mockDatabaseConfig: IntegreSQLDatabaseConfig = {
  username: 'user',
  password: 'pass',
  host: 'localhost',
  port: 5432,
  database: 'mock_database_0',
}

describe('client', () => {
  beforeEach(() => {
    for (const key of Object.keys(MockIntegreSQLApiClient)) {
      const value = MockIntegreSQLApiClient[key as keyof typeof MockIntegreSQLApiClient]

      if (typeof value === 'function') {
        value.mockReset()
      }
    }
  })

  test('instantiates the API client', () => {
    expect(client.api).toBeInstanceOf(IntegreSQLApiClient)
    expect(typeof client.api.initializeTemplate).toEqual('function')
  })

  test('can initialize a template', async () => {
    const mockSetupCallback = jest.fn().mockImplementation(() => Promise.resolve('noop'))

    MockIntegreSQLApiClient.initializeTemplate.mockImplementation(() =>
      Promise.resolve({
        database: {
          templateHash: 'mock-hash',
          config: { ...mockDatabaseConfig, database: 'mock_template_1' },
        },
      })
    )

    MockIntegreSQLApiClient.getTestDatabase.mockImplementation(() =>
      Promise.resolve({
        id: 1,
        database: {
          templateHash: 'mock-hash',
          config: { ...mockDatabaseConfig, database: 'mock_database_1' },
        },
      })
    )

    await client.initializeTemplate('mock-hash', mockSetupCallback)

    expect(MockIntegreSQLApiClient.initializeTemplate.mock.calls).toEqual([['mock-hash']])
    expect(mockSetupCallback.mock.calls).toMatchSnapshot()
    expect(MockIntegreSQLApiClient.discardTemplate.mock.calls).toEqual([])
    expect(MockIntegreSQLApiClient.finalizeTemplate.mock.calls).toEqual([['mock-hash']])
    expect(MockIntegreSQLApiClient.getTestDatabase.mock.calls).toEqual([['mock-hash']])
  })

  test('can skip initializing a template when another process is already doing it', async () => {
    const mockSetupCallback = jest.fn()

    MockIntegreSQLApiClient.initializeTemplate.mockImplementation(() => {
      const responseStatus = 423
      const responseText = JSON.stringify({ message: 'template is already initialized' })
      return Promise.reject(createIntegreSQLApiClientError({ responseStatus, responseText }))
    })

    await client.initializeTemplate('mock-hash', mockSetupCallback)

    expect(MockIntegreSQLApiClient.initializeTemplate.mock.calls).toEqual([['mock-hash']])
    expect(mockSetupCallback.mock.calls).toEqual([])
    expect(MockIntegreSQLApiClient.discardTemplate.mock.calls).toEqual([])
    expect(MockIntegreSQLApiClient.finalizeTemplate.mock.calls).toEqual([])
    expect(MockIntegreSQLApiClient.getTestDatabase.mock.calls).toEqual([])
  })

  test('can rethrow error when initializing a template', async () => {
    const mockSetupCallback = jest.fn()

    MockIntegreSQLApiClient.initializeTemplate.mockImplementation(() => {
      const responseStatus = 500
      const responseText = JSON.stringify({ message: 'connect: connection refused' })
      return Promise.reject(createIntegreSQLApiClientError({ responseStatus, responseText }))
    })

    await expect(
      client.initializeTemplate('mock-hash', mockSetupCallback)
    ).rejects.toThrowErrorMatchingSnapshot()

    expect(MockIntegreSQLApiClient.initializeTemplate.mock.calls).toEqual([['mock-hash']])
    expect(mockSetupCallback.mock.calls).toEqual([])
    expect(MockIntegreSQLApiClient.discardTemplate.mock.calls).toEqual([])
    expect(MockIntegreSQLApiClient.finalizeTemplate.mock.calls).toEqual([])
    expect(MockIntegreSQLApiClient.getTestDatabase.mock.calls).toEqual([])
  })

  test('can discard a template when the setup callback fails', async () => {
    const mockSetupCallback = jest.fn().mockImplementation(() => {
      return Promise.reject(new Error('Some migration error'))
    })

    MockIntegreSQLApiClient.initializeTemplate.mockImplementation(() =>
      Promise.resolve({
        database: {
          templateHash: 'mock-hash',
          config: { ...mockDatabaseConfig, database: 'mock_template_1' },
        },
      })
    )

    await expect(client.initializeTemplate('mock-hash', mockSetupCallback)).rejects.toThrow(
      'Some migration error'
    )

    expect(MockIntegreSQLApiClient.initializeTemplate.mock.calls).toEqual([['mock-hash']])
    expect(mockSetupCallback.mock.calls).toMatchSnapshot()
    expect(MockIntegreSQLApiClient.discardTemplate.mock.calls).toEqual([['mock-hash']])
    expect(MockIntegreSQLApiClient.finalizeTemplate.mock.calls).toEqual([])
    expect(MockIntegreSQLApiClient.getTestDatabase.mock.calls).toEqual([])
  })

  test('can get a test database', async () => {
    MockIntegreSQLApiClient.getTestDatabase.mockImplementation(() =>
      Promise.resolve({
        id: 2,
        database: {
          templateHash: 'mock-hash',
          config: { ...mockDatabaseConfig, database: 'mock_database_2' },
        },
      })
    )

    const databaseConfig = await client.getTestDatabase('mock-hash')

    expect(MockIntegreSQLApiClient.getTestDatabase.mock.calls).toEqual([['mock-hash']])
    expect(databaseConfig).toMatchSnapshot()
  })

  test('can call the hash files helper', async () => {
    await client.hashFiles(['./prisma/schema.prisma', './src/__fixtures__/**/*'])

    expect(mockSha1HashFiles.mock.calls).toMatchSnapshot()
  })

  test('can convert the database config into a connection url', () => {
    expect(client.databaseConfigToConnectionUrl(mockDatabaseConfig)).toMatchSnapshot()
  })
})
