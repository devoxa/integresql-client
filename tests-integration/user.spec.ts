import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import path from 'path'
import { IntegreSQLClient } from '../src/client'
import { seed } from './__fixtures__/seed'

const integreSQL = new IntegreSQLClient({ url: 'http://localhost:5000' })

let hash: string
let prisma: PrismaClient

describe('user', () => {
  beforeAll(async () => {
    // Get a hash of the migrations & fixtures
    hash = await integreSQL.hashFiles([
      './prisma/schema.prisma',
      './tests-integration/__fixtures__/**/*',
    ])

    // Initialize the template database
    await integreSQL.initializeTemplate(hash, async (databaseConfig) => {
      const connectionUrl = integreSQL.databaseConfigToConnectionUrl(databaseConfig)

      console.log('Migrating template database')
      const prismaBin = path.join(process.cwd(), './node_modules/.bin/prisma')
      const env = { DATABASE_POSTGRES_URL: connectionUrl, PATH: process.env.PATH }
      execSync(`${prismaBin} db push --force-reset --skip-generate`, { env })

      console.log('Seeding template database')
      prisma = new PrismaClient({ datasources: { database: { url: connectionUrl } } })
      await seed(prisma)

      // Close the database connection, without this the tests can hang
      await prisma.$disconnect()
    })
  })

  beforeEach(async () => {
    // Get a isolated test database
    const databaseConfig = await integreSQL.getTestDatabase(hash)
    const connectionUrl = integreSQL.databaseConfigToConnectionUrl(databaseConfig)
    prisma = new PrismaClient({ datasources: { database: { url: connectionUrl } } })
  })

  it('can create a user', async () => {
    const beforeUsers = await prisma.user.findMany({ orderBy: { name: 'asc' } })
    expect(beforeUsers.map((x) => x.name)).toEqual(['foo'])

    await prisma.user.create({ data: { name: 'bar' } })

    const afterUsers = await prisma.user.findMany({ orderBy: { name: 'asc' } })
    expect(afterUsers.map((x) => x.name)).toEqual(['bar', 'foo'])
  })

  it('can delete a user', async () => {
    const beforeUsers = await prisma.user.findMany({ orderBy: { name: 'asc' } })
    expect(beforeUsers.map((x) => x.name)).toEqual(['foo'])

    await prisma.user.deleteMany()

    const afterUsers = await prisma.user.findMany({ orderBy: { name: 'asc' } })
    expect(afterUsers.map((x) => x.name)).toEqual([])
  })

  it('can create multiple users', async () => {
    const beforeUsers = await prisma.user.findMany({ orderBy: { name: 'asc' } })
    expect(beforeUsers.map((x) => x.name)).toEqual(['foo'])

    await prisma.user.create({ data: { name: 'zar' } })
    await prisma.user.create({ data: { name: 'zog' } })

    const afterUsers = await prisma.user.findMany({ orderBy: { name: 'asc' } })
    expect(afterUsers.map((x) => x.name)).toEqual(['foo', 'zar', 'zog'])
  })
})
