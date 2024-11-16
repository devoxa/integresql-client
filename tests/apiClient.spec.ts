import { IntegreSQLApiClient } from '../src/apiClient'
import { IntegreSQLApiClientError } from '../src/apiClientError'
import {
  GetTestDatabaseResponse,
  InitializeTemplateResponse,
  IntegreSQLDatabaseConfig,
} from '../src/interfaces'

const mockFetch = jest.fn()
global.fetch = mockFetch

function getMockFetchImplementation(status: number, response: string) {
  const mockFetchImplementation = async () => ({
    status: status,
    text: async () => response,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return mockFetchImplementation as any
}

const client = new IntegreSQLApiClient({ url: 'http://localhost:5000' })

const mockDatabaseConfig: IntegreSQLDatabaseConfig = {
  username: 'user',
  password: 'pass',
  host: 'localhost',
  port: 5432,
  database: 'mock_database_0',
}

describe('apiClient', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  test('sets the correct base URL', () => {
    const withTrailingSlash = new IntegreSQLApiClient({ url: 'http://localhost:5000/' })
    const withoutTrailingSlash = new IntegreSQLApiClient({ url: 'http://localhost:5000' })

    expect(withTrailingSlash.baseUrl).toEqual('http://localhost:5000/api/v1')
    expect(withoutTrailingSlash.baseUrl).toEqual('http://localhost:5000/api/v1')
  })

  test('errors when the HTTP response status indicates an issue', async () => {
    const mockResponse = { message: 'template is already initialized' }
    mockFetch.mockImplementation(getMockFetchImplementation(423, JSON.stringify(mockResponse)))

    let error
    try {
      await client.initializeTemplate('mock-hash')
    } catch (err) {
      error = err as IntegreSQLApiClientError
    }

    expect(error).toBeInstanceOf(IntegreSQLApiClientError)
    expect(error?.message).toMatchSnapshot()
    expect(error?.responseStatus).toEqual(423)
    expect(error?.responseText).toEqual(JSON.stringify(mockResponse))
  })

  describe('endpoints', () => {
    test('can initialize a template', async () => {
      const mockResponse: InitializeTemplateResponse = {
        database: { templateHash: 'mock-hash', config: mockDatabaseConfig },
      }
      mockFetch.mockImplementation(getMockFetchImplementation(200, JSON.stringify(mockResponse)))

      const response = await client.initializeTemplate('mock-hash')

      expect(response).toEqual(mockResponse)
      expect(mockFetch.mock.calls).toMatchSnapshot()
    })

    test('can finalize a template', async () => {
      mockFetch.mockImplementation(getMockFetchImplementation(200, ''))

      const response = await client.finalizeTemplate('mock-hash')

      expect(response).toEqual(null)
      expect(mockFetch.mock.calls).toMatchSnapshot()
    })

    test('can discard a template', async () => {
      mockFetch.mockImplementation(getMockFetchImplementation(200, ''))

      const response = await client.discardTemplate('mock-hash')

      expect(response).toEqual(null)
      expect(mockFetch.mock.calls).toMatchSnapshot()
    })

    test('can discard all templates', async () => {
      mockFetch.mockImplementation(getMockFetchImplementation(200, ''))

      const response = await client.discardAllTemplates()

      expect(response).toEqual(null)
      expect(mockFetch.mock.calls).toMatchSnapshot()
    })

    test('can get a test database', async () => {
      const mockResponse: GetTestDatabaseResponse = {
        id: 1,
        database: { templateHash: 'mock-hash', config: mockDatabaseConfig },
      }
      mockFetch.mockImplementation(getMockFetchImplementation(200, JSON.stringify(mockResponse)))

      const response = await client.getTestDatabase('mock-hash')

      expect(response).toEqual(mockResponse)
      expect(mockFetch.mock.calls).toMatchSnapshot()
    })

    test('can reuse a test database', async () => {
      mockFetch.mockImplementation(getMockFetchImplementation(200, ''))

      const response = await client.reuseTestDatabase('mock-hash', 42)

      expect(response).toEqual(null)
      expect(mockFetch.mock.calls).toMatchSnapshot()
    })

    test('can recreate a test database', async () => {
      mockFetch.mockImplementation(getMockFetchImplementation(200, ''))

      const response = await client.recreateTestDatabase('mock-hash', 42)

      expect(response).toEqual(null)
      expect(mockFetch.mock.calls).toMatchSnapshot()
    })
  })
})
