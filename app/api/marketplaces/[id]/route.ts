import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const marketplace = await prisma.marketplace.findUnique({
      where: { id: params.id },
    })

    if (!marketplace) {
      return NextResponse.json(
        { error: 'Marketplace not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(marketplace)
  } catch (error) {
    console.error('Error fetching marketplace:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
