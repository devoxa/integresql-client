import { PrismaClient } from '@prisma/client'

export async function seed(prisma: PrismaClient) {
  await prisma.user.create({ data: { name: 'foo' } })
}
