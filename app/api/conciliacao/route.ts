import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const conciliacaoSchema = z.object({
  transacaoId: z.string().min(1, 'Transacao ID is required'),
  contaBancariaId: z.string().min(1, 'Conta Bancaria ID is required'),
  valorConciliado: z.number().positive('Valor must be positive'),
  dataConciliacao: z.string().min(1, 'Data is required'),
  observacoes: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = conciliacaoSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { transacaoId, contaBancariaId, valorConciliado, dataConciliacao, observacoes } = validation.data

    // Check if transacao exists
    const transacao = await prisma.transacao.findUnique({
      where: { id: transacaoId },
    })

    if (!transacao) {
      return NextResponse.json(
        { error: 'Transacao not found' },
        { status: 404 }
      )
    }

    // Check if conta bancaria exists
    const contaBancaria = await prisma.contaBancaria.findUnique({
      where: { id: contaBancariaId },
    })

    if (!contaBancaria) {
      return NextResponse.json(
        { error: 'Conta Bancaria not found' },
        { status: 404 }
      )
    }

    // Create conciliacao
    const conciliacao = await prisma.conciliacao.create({
      data: {
        transacaoId,
        contaBancariaId,
        valorConciliado,
        dataConciliacao: new Date(dataConciliacao),
        status: 'conciliada',
        observacoes,
      },
      include: {
        transacao: {
          include: {
            contaMarketplace: {
              include: {
                marketplace: true,
              },
            },
          },
        },
        contaBancaria: true,
      },
    })

    return NextResponse.json(conciliacao, { status: 201 })
  } catch (error: any) {
    console.error('Error creating conciliacao:', error)

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Conciliacao already exists for this transaction' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
