import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Criar usuário ADMIN padrão
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@marketfinance.com' },
    update: {},
    create: {
      email: 'admin@marketfinance.com',
      name: 'Administrador',
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  })
  console.log(`Created admin user: ${adminUser.email}`)

  // Criar Marketplaces
  const marketplaces = [
    {
      nome: 'Amazon',
      slug: 'amazon',
      config: {
        apiUrl: 'https://api.amazon.com',
        taxaPadrao: 15,
      },
    },
    {
      nome: 'Mercado Livre',
      slug: 'mercado-livre',
      config: {
        apiUrl: 'https://api.mercadolibre.com',
        taxaPadrao: 12,
      },
    },
    {
      nome: 'Shopee',
      slug: 'shopee',
      config: {
        apiUrl: 'https://api.shopee.com',
        taxaPadrao: 10,
      },
    },
    {
      nome: 'Magalu',
      slug: 'magalu',
      config: {
        apiUrl: 'https://api.magazineluiza.com',
        taxaPadrao: 13,
      },
    },
    {
      nome: 'B2W',
      slug: 'b2w',
      config: {
        apiUrl: 'https://api.b2w.com',
        taxaPadrao: 14,
      },
    },
  ]

  for (const marketplace of marketplaces) {
    await prisma.marketplace.upsert({
      where: { slug: marketplace.slug },
      update: {},
      create: marketplace,
    })
    console.log(`Created marketplace: ${marketplace.nome}`)
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
