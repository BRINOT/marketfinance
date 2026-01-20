import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { syncByConta } from "@/lib/sync/sync-service";

const syncSchema = z.object({
  quantidade: z.number().min(1).max(100).optional().default(10),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verifica autenticação
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const contaId = params.id;

    // Valida body
    const body = await req.json();
    const { quantidade } = syncSchema.parse(body);

    // Executa sincronização
    const resultado = await syncByConta(contaId, quantidade);

    if (!resultado.success) {
      return NextResponse.json(
        { error: resultado.message, details: resultado.error },
        { status: 400 }
      );
    }

    return NextResponse.json(resultado);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("[SYNC_CONTA]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
