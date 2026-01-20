import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { syncAll } from "@/lib/sync/sync-service";

const syncSchema = z.object({
  quantidade: z.number().min(1).max(100).optional().default(10),
});

export async function POST(req: Request) {
  try {
    // Verifica autenticação
    const session = await auth();

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Valida body
    const body = await req.json();
    const { quantidade } = syncSchema.parse(body);

    // Executa sincronização global
    const resultado = await syncAll(quantidade);

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

    console.error("[SYNC_ALL]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
