import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { conciliarAutomaticamente, conciliarTodasContas } from "@/lib/conciliacao/conciliacao-service";
import { z } from "zod";

const conciliacaoSchema = z.object({
  contaId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const json = await req.json();
    const body = conciliacaoSchema.parse(json);

    if (body.contaId) {
      // Conciliar conta específica
      const resultado = await conciliarAutomaticamente(body.contaId);
      return NextResponse.json(resultado);
    } else {
      // Conciliar todas as contas
      const resultado = await conciliarTodasContas();
      return NextResponse.json(resultado);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 });
    }

    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
