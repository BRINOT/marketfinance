import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const transacao = await prisma.transacao.findUnique({
      where: { id: params.id },
      include: {
        contaMarketplace: {
          include: {
            marketplace: true,
          },
        },
        conciliacoes: {
          include: {
            contaBancaria: true,
          },
        },
      },
    })

    if (!transacao) {
      return NextResponse.json(
        { error: 'Transacao not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(transacao)
  } catch (error) {
    console.error('Error fetching transacao:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
