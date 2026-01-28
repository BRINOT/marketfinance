import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listarPendentesRevisao } from "@/lib/conciliacao/conciliacao-service";

export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const contaId = searchParams.get("contaId");

    const pendentes = await listarPendentesRevisao(contaId || undefined);

    return NextResponse.json(pendentes);
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
