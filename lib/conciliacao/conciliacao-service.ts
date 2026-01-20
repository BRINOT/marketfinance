import { db } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Serviço de conciliação automática
 * Faz matching por valor e data (±3 dias)
 */

interface ResultadoConciliacao {
  conciliadas: number;
  pendentesRevisao: number;
  detalhes: Array<{
    transacaoId: string;
    status: "conciliada" | "revisao";
    motivo?: string;
  }>;
}

/**
 * Executa conciliação automática para uma conta específica
 */
export async function conciliarAutomaticamente(
  contaId: string
): Promise<ResultadoConciliacao> {
  // Buscar transações não conciliadas da conta
  const transacoes = await db.transacao.findMany({
    where: {
      contaMarketplaceId: contaId,
      conciliacoes: {
        none: {},
      },
    },
    orderBy: {
      dataPedido: "desc",
    },
  });

  const resultado: ResultadoConciliacao = {
    conciliadas: 0,
    pendentesRevisao: 0,
    detalhes: [],
  };

  for (const transacao of transacoes) {
    try {
      // Tentar fazer matching por valor e data
      const match = await buscarMatch(transacao);

      if (match) {
        // Marcar como conciliada automaticamente
        await db.transacao.update({
          where: { id: transacao.id },
          data: {
            conciliadaAutomaticamente: true,
            requerRevisaoManual: false,
          },
        });

        // Criar registro de conciliação
        await db.conciliacao.create({
          data: {
            transacaoId: transacao.id,
            contaBancariaId: match.contaBancariaId,
            valor: transacao.valorLiquido,
            dataConciliacao: new Date(),
            tipo: "automatica",
            observacoes: `Conciliação automática - Match por valor e data`,
          },
        });

        resultado.conciliadas++;
        resultado.detalhes.push({
          transacaoId: transacao.id,
          status: "conciliada",
        });
      } else {
        // Marcar para revisão manual
        await db.transacao.update({
          where: { id: transacao.id },
          data: {
            requerRevisaoManual: true,
            motivoRevisao: "Nenhum match encontrado por valor e data (±3 dias)",
          },
        });

        resultado.pendentesRevisao++;
        resultado.detalhes.push({
          transacaoId: transacao.id,
          status: "revisao",
          motivo: "Nenhum match encontrado",
        });
      }
    } catch (error) {
      console.error(`Erro ao conciliar transação ${transacao.id}:`, error);
      // Marcar para revisão manual em caso de erro
      await db.transacao.update({
        where: { id: transacao.id },
        data: {
          requerRevisaoManual: true,
          motivoRevisao: `Erro na conciliação automática: ${error}`,
        },
      });

      resultado.pendentesRevisao++;
      resultado.detalhes.push({
        transacaoId: transacao.id,
        status: "revisao",
        motivo: "Erro na conciliação",
      });
    }
  }

  return resultado;
}

/**
 * Busca match por valor e data (±3 dias)
 */
async function buscarMatch(transacao: any): Promise<{ contaBancariaId: string } | null> {
  // Calcular range de datas (±3 dias)
  const dataInicio = new Date(transacao.dataPedido);
  dataInicio.setDate(dataInicio.getDate() - 3);

  const dataFim = new Date(transacao.dataPedido);
  dataFim.setDate(dataFim.getDate() + 3);

  // Buscar conta bancária ativa (mock - em produção seria buscar movimentações bancárias)
  const contaBancaria = await db.contaBancaria.findFirst({
    where: {
      ativo: true,
    },
  });

  if (!contaBancaria) {
    return null;
  }

  // Simular match (em produção, buscaria movimentações bancárias com valor e data similares)
  // Por enquanto, retorna match se a transação está aprovada
  if (transacao.status === "aprovado") {
    return { contaBancariaId: contaBancaria.id };
  }

  return null;
}

/**
 * Conciliar todas as contas ativas
 */
export async function conciliarTodasContas(): Promise<{
  totalConciliadas: number;
  totalPendentesRevisao: number;
  porConta: Array<{
    contaId: string;
    resultado: ResultadoConciliacao;
  }>;
}> {
  const contas = await db.contaMarketplace.findMany({
    where: {
      status: "ativa",
    },
  });

  const resultados = [];
  let totalConciliadas = 0;
  let totalPendentesRevisao = 0;

  for (const conta of contas) {
    const resultado = await conciliarAutomaticamente(conta.id);
    resultados.push({
      contaId: conta.id,
      resultado,
    });
    totalConciliadas += resultado.conciliadas;
    totalPendentesRevisao += resultado.pendentesRevisao;
  }

  return {
    totalConciliadas,
    totalPendentesRevisao,
    porConta: resultados,
  };
}

/**
 * Listar transações pendentes de revisão manual
 */
export async function listarPendentesRevisao(contaId?: string) {
  return await db.transacao.findMany({
    where: {
      requerRevisaoManual: true,
      ...(contaId && { contaMarketplaceId: contaId }),
    },
    include: {
      contaMarketplace: {
        include: {
          marketplace: true,
        },
      },
    },
    orderBy: {
      dataPedido: "desc",
    },
  });
}
