import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const marketplaces = await prisma.marketplace.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
    })

    return NextResponse.json(marketplaces)
  } catch (error) {
    console.error('Error fetching marketplaces:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
