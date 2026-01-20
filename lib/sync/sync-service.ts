/**
 * Serviço de sincronização automatizada para marketplaces
 * Simula a importação de pedidos e transações de marketplaces
 */

import { db } from "@/lib/db";
import { gerarPedidosMock, gerarEstatisticas } from "./mock-data-generator";

/**
 * Resultado da sincronização
 */
export interface SyncResult {
  success: boolean;
  message: string;
  transacoesCriadas: number;
  estatisticas?: any;
  error?: string;
}

/**
 * Sincroniza transações para uma conta específica
 */
export async function syncByConta(
  contaId: string,
  quantidadeTransacoes: number = 10
): Promise<SyncResult> {
  try {
    // Busca a conta com marketplace
    const conta = await db.contaMarketplace.findUnique({
      where: { id: contaId },
      include: {
        marketplace: true,
      },
    });

    if (!conta) {
      return {
        success: false,
        message: "Conta não encontrada",
        transacoesCriadas: 0,
        error: "CONTA_NAO_ENCONTRADA",
      };
    }

    if (conta.status !== "ATIVA") {
      return {
        success: false,
        message: "Conta não está ativa",
        transacoesCriadas: 0,
        error: "CONTA_INATIVA",
      };
    }

    // Gera pedidos mock
    const pedidosMock = gerarPedidosMock(
      contaId,
      conta.marketplace.nome,
      quantidadeTransacoes
    );

    // Cria transações no banco
    const transacoesCriadas = [];
    for (const pedido of pedidosMock) {
      const transacao = await db.transacao.create({
        data: pedido,
      });
      transacoesCriadas.push(transacao);
    }

    // Gera estatísticas
    const estatisticas = gerarEstatisticas(transacoesCriadas);

    return {
      success: true,
      message: `Sincronização concluída: ${transacoesCriadas.length} transações criadas para ${conta.marketplace.nome}`,
      transacoesCriadas: transacoesCriadas.length,
      estatisticas,
    };
  } catch (error) {
    console.error("Erro ao sincronizar conta:", error);
    return {
      success: false,
      message: "Erro ao sincronizar conta",
      transacoesCriadas: 0,
      error: error instanceof Error ? error.message : "ERRO_DESCONHECIDO",
    };
  }
}

/**
 * Sincroniza transações para todas as contas de um marketplace
 */
export async function syncByMarketplace(
  marketplaceId: string,
  quantidadeTransacoesPorConta: number = 10
): Promise<SyncResult> {
  try {
    // Busca o marketplace
    const marketplace = await db.marketplace.findUnique({
      where: { id: marketplaceId },
      include: {
        contas: {
          where: {
            status: "ATIVA",
          },
        },
      },
    });

    if (!marketplace) {
      return {
        success: false,
        message: "Marketplace não encontrado",
        transacoesCriadas: 0,
        error: "MARKETPLACE_NAO_ENCONTRADO",
      };
    }

    if (marketplace.contas.length === 0) {
      return {
        success: false,
        message: "Nenhuma conta ativa encontrada para este marketplace",
        transacoesCriadas: 0,
        error: "NENHUMA_CONTA_ATIVA",
      };
    }

    // Sincroniza cada conta
    let totalTransacoes = 0;
    const todasTransacoes = [];

    for (const conta of marketplace.contas) {
      const resultado = await syncByConta(conta.id, quantidadeTransacoesPorConta);
      if (resultado.success) {
        totalTransacoes += resultado.transacoesCriadas;
        
        // Busca as transações criadas para estatísticas
        const transacoes = await db.transacao.findMany({
          where: { contaId: conta.id },
          orderBy: { dataPedido: "desc" },
          take: quantidadeTransacoesPorConta,
        });
        todasTransacoes.push(...transacoes);
      }
    }

    // Gera estatísticas consolidadas
    const estatisticas = gerarEstatisticas(todasTransacoes);

    return {
      success: true,
      message: `Sincronização concluída: ${totalTransacoes} transações criadas para ${marketplace.contas.length} conta(s) do ${marketplace.nome}`,
      transacoesCriadas: totalTransacoes,
      estatisticas,
    };
  } catch (error) {
    console.error("Erro ao sincronizar marketplace:", error);
    return {
      success: false,
      message: "Erro ao sincronizar marketplace",
      transacoesCriadas: 0,
      error: error instanceof Error ? error.message : "ERRO_DESCONHECIDO",
    };
  }
}

/**
 * Sincroniza todas as contas ativas de todos os marketplaces
 */
export async function syncAll(
  quantidadeTransacoesPorConta: number = 10
): Promise<SyncResult> {
  try {
    // Busca todos os marketplaces ativos
    const marketplaces = await db.marketplace.findMany({
      where: {
        ativo: true,
      },
      include: {
        contas: {
          where: {
            status: "ATIVA",
          },
        },
      },
    });

    if (marketplaces.length === 0) {
      return {
        success: false,
        message: "Nenhum marketplace ativo encontrado",
        transacoesCriadas: 0,
        error: "NENHUM_MARKETPLACE_ATIVO",
      };
    }

    let totalTransacoes = 0;
    let totalContas = 0;
    const todasTransacoes = [];

    // Sincroniza cada marketplace
    for (const marketplace of marketplaces) {
      if (marketplace.contas.length > 0) {
        const resultado = await syncByMarketplace(
          marketplace.id,
          quantidadeTransacoesPorConta
        );
        
        if (resultado.success) {
          totalTransacoes += resultado.transacoesCriadas;
          totalContas += marketplace.contas.length;
          
          // Busca transações para estatísticas
          for (const conta of marketplace.contas) {
            const transacoes = await db.transacao.findMany({
              where: { contaId: conta.id },
              orderBy: { dataPedido: "desc" },
              take: quantidadeTransacoesPorConta,
            });
            todasTransacoes.push(...transacoes);
          }
        }
      }
    }

    // Gera estatísticas consolidadas
    const estatisticas = gerarEstatisticas(todasTransacoes);

    return {
      success: true,
      message: `Sincronização global concluída: ${totalTransacoes} transações criadas para ${totalContas} conta(s) em ${marketplaces.length} marketplace(s)`,
      transacoesCriadas: totalTransacoes,
      estatisticas,
    };
  } catch (error) {
    console.error("Erro ao sincronizar todos:", error);
    return {
      success: false,
      message: "Erro ao sincronizar todos os marketplaces",
      transacoesCriadas: 0,
      error: error instanceof Error ? error.message : "ERRO_DESCONHECIDO",
    };
  }
}

/**
 * Limpa transações antigas (útil para testes)
 */
export async function limparTransacoes(contaId?: string): Promise<SyncResult> {
  try {
    const resultado = await db.transacao.deleteMany({
      where: contaId ? { contaId } : {},
    });

    return {
      success: true,
      message: `${resultado.count} transações removidas`,
      transacoesCriadas: 0,
    };
  } catch (error) {
    console.error("Erro ao limpar transações:", error);
    return {
      success: false,
      message: "Erro ao limpar transações",
      transacoesCriadas: 0,
      error: error instanceof Error ? error.message : "ERRO_DESCONHECIDO",
    };
  }
}
