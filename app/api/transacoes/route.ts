import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const contaId = searchParams.get('contaId')
    const status = searchParams.get('status')
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')

    const where: any = {}

    if (contaId) {
      where.contaMarketplaceId = contaId
    }

    if (status) {
      where.status = status
    }

    if (dataInicio || dataFim) {
      where.dataPedido = {}
      if (dataInicio) {
        where.dataPedido.gte = new Date(dataInicio)
      }
      if (dataFim) {
        where.dataPedido.lte = new Date(dataFim)
      }
    }

    const transacoes = await prisma.transacao.findMany({
      where,
      include: {
        contaMarketplace: {
          include: {
            marketplace: true,
          },
        },
        conciliacoes: true,
      },
      orderBy: { dataPedido: 'desc' },
      take: 100,
    })

    return NextResponse.json(transacoes)
  } catch (error) {
    console.error('Error fetching transacoes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
