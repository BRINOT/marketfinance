import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const contaSchema = z.object({
  marketplaceId: z.string().min(1, 'Marketplace ID is required'),
  sellerId: z.string().min(1, 'Seller ID is required'),
  credenciais: z.object({
    apiKey: z.string().optional(),
    apiSecret: z.string().optional(),
    accessToken: z.string().optional(),
  }).optional(),
})

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = contaSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { marketplaceId, sellerId, credenciais } = validation.data

    // Check if marketplace exists
    const marketplace = await prisma.marketplace.findUnique({
      where: { id: marketplaceId },
    })

    if (!marketplace) {
      return NextResponse.json(
        { error: 'Marketplace not found' },
        { status: 404 }
      )
    }

    // Mock: Create conta with mock credentials
    const conta = await prisma.contaMarketplace.create({
      data: {
        marketplaceId,
        sellerId,
        status: 'ativa',
        credenciais: credenciais || {
          apiKey: 'mock_api_key_' + Date.now(),
          apiSecret: 'mock_api_secret_' + Date.now(),
          accessToken: 'mock_access_token_' + Date.now(),
        },
      },
      include: {
        marketplace: true,
      },
    })

    return NextResponse.json(conta, { status: 201 })
  } catch (error: any) {
    console.error('Error creating conta:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Conta already exists for this marketplace and seller' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const contas = await prisma.contaMarketplace.findMany({
      include: {
        marketplace: true,
        _count: {
          select: { transacoes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(contas)
  } catch (error) {
    console.error('Error fetching contas:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
