/**
 * Gerador de dados mock para simulação de sincronização de marketplaces
 */

import { Prisma } from "@prisma/client";

// Tipos de produtos mock
const PRODUTOS_MOCK = [
  { nome: "Notebook Dell", categoria: "Eletrônicos", precoBase: 3500 },
  { nome: "Mouse Gamer", categoria: "Periféricos", precoBase: 150 },
  { nome: "Teclado Mecânico", categoria: "Periféricos", precoBase: 450 },
  { nome: "Monitor 27\"", categoria: "Eletrônicos", precoBase: 1200 },
  { nome: "Headset Bluetooth", categoria: "Áudio", precoBase: 280 },
  { nome: "Webcam Full HD", categoria: "Eletrônicos", precoBase: 350 },
  { nome: "SSD 1TB", categoria: "Armazenamento", precoBase: 600 },
  { nome: "Memória RAM 16GB", categoria: "Hardware", precoBase: 400 },
  { nome: "Placa de Vídeo", categoria: "Hardware", precoBase: 2500 },
  { nome: "Cadeira Gamer", categoria: "Móveis", precoBase: 1100 },
];

// Configurações de taxas por marketplace
const TAXAS_MARKETPLACE: Record<string, { comissao: number; taxaFixa: number; taxaProcessamento: number }> = {
  "Amazon": { comissao: 0.15, taxaFixa: 2.50, taxaProcessamento: 0.029 },
  "Mercado Livre": { comissao: 0.16, taxaFixa: 3.00, taxaProcessamento: 0.035 },
  "Shopee": { comissao: 0.12, taxaFixa: 1.50, taxaProcessamento: 0.025 },
  "Magalu": { comissao: 0.14, taxaFixa: 2.00, taxaProcessamento: 0.030 },
  "B2W": { comissao: 0.13, taxaFixa: 2.20, taxaProcessamento: 0.028 },
};

// Status possíveis para transações
const STATUS_TRANSACAO = ["PENDENTE", "APROVADO", "CANCELADO", "ESTORNADO"];

/**
 * Gera um SKU aleatório
 */
function gerarSKU(): string {
  const prefixo = "SKU";
  const numero = Math.floor(Math.random() * 900000) + 100000;
  return `${prefixo}-${numero}`;
}

/**
 * Gera um ID de pedido aleatório
 */
function gerarPedidoId(marketplaceName: string): string {
  const prefixos: Record<string, string> = {
    "Amazon": "AMZ",
    "Mercado Livre": "MLB",
    "Shopee": "SHP",
    "Magalu": "MAG",
    "B2W": "B2W",
  };
  
  const prefixo = prefixos[marketplaceName] || "MKT";
  const numero = Math.floor(Math.random() * 9000000000) + 1000000000;
  return `${prefixo}-${numero}`;
}

/**
 * Gera uma data aleatória nos últimos N dias
 */
function gerarDataAleatoria(diasAtras: number = 30): Date {
  const agora = new Date();
  const diasAleatorios = Math.floor(Math.random() * diasAtras);
  const horasAleatorias = Math.floor(Math.random() * 24);
  const minutosAleatorios = Math.floor(Math.random() * 60);
  
  agora.setDate(agora.getDate() - diasAleatorios);
  agora.setHours(horasAleatorias, minutosAleatorios, 0, 0);
  
  return agora;
}

/**
 * Calcula taxas e valores para uma transação
 */
export function calcularTaxas(
  valorBruto: number,
  marketplaceName: string
): {
  valorBruto: number;
  comissao: number;
  taxaFixa: number;
  taxaProcessamento: number;
  valorLiquido: number;
} {
  const taxas = TAXAS_MARKETPLACE[marketplaceName] || {
    comissao: 0.15,
    taxaFixa: 2.50,
    taxaProcessamento: 0.03,
  };

  const comissao = valorBruto * taxas.comissao;
  const taxaFixa = taxas.taxaFixa;
  const taxaProcessamento = valorBruto * taxas.taxaProcessamento;
  const valorLiquido = valorBruto - comissao - taxaFixa - taxaProcessamento;

  return {
    valorBruto: Number(valorBruto.toFixed(2)),
    comissao: Number(comissao.toFixed(2)),
    taxaFixa: Number(taxaFixa.toFixed(2)),
    taxaProcessamento: Number(taxaProcessamento.toFixed(2)),
    valorLiquido: Number(valorLiquido.toFixed(2)),
  };
}

/**
 * Gera um pedido mock com transação
 */
export function gerarPedidoMock(
  contaId: string,
  marketplaceName: string
): Prisma.TransacaoCreateInput {
  // Seleciona produto aleatório
  const produto = PRODUTOS_MOCK[Math.floor(Math.random() * PRODUTOS_MOCK.length)];
  
  // Gera quantidade aleatória (1-3)
  const quantidade = Math.floor(Math.random() * 3) + 1;
  
  // Calcula valor bruto
  const valorBruto = produto.precoBase * quantidade;
  
  // Calcula taxas
  const valores = calcularTaxas(valorBruto, marketplaceName);
  
  // Gera status (90% aprovado, 10% outros)
  const statusRandom = Math.random();
  let status: string;
  if (statusRandom < 0.9) {
    status = "APROVADO";
  } else if (statusRandom < 0.95) {
    status = "PENDENTE";
  } else if (statusRandom < 0.98) {
    status = "CANCELADO";
  } else {
    status = "ESTORNADO";
  }
  
  // Gera datas
  const dataPedido = gerarDataAleatoria(30);
  const dataAprovacao = status === "APROVADO" ? new Date(dataPedido.getTime() + 3600000) : null; // +1 hora
  const dataRepasse = status === "APROVADO" && Math.random() > 0.3 
    ? new Date(dataPedido.getTime() + 86400000 * 7) // +7 dias
    : null;
  
  return {
    pedidoId: gerarPedidoId(marketplaceName),
    sku: gerarSKU(),
    nomeProduto: produto.nome,
    quantidade,
    valorBruto: valores.valorBruto,
    comissao: valores.comissao,
    taxaFixa: valores.taxaFixa,
    taxaProcessamento: valores.taxaProcessamento,
    valorLiquido: valores.valorLiquido,
    status,
    dataPedido,
    dataAprovacao,
    dataRepasse,
    conciliado: false,
    conta: {
      connect: { id: contaId },
    },
  };
}

/**
 * Gera múltiplos pedidos mock
 */
export function gerarPedidosMock(
  contaId: string,
  marketplaceName: string,
  quantidade: number = 10
): Prisma.TransacaoCreateInput[] {
  const pedidos: Prisma.TransacaoCreateInput[] = [];
  
  for (let i = 0; i < quantidade; i++) {
    pedidos.push(gerarPedidoMock(contaId, marketplaceName));
  }
  
  return pedidos;
}

/**
 * Gera estatísticas resumidas de um conjunto de transações
 */
export function gerarEstatisticas(transacoes: any[]) {
  const total = transacoes.length;
  const aprovadas = transacoes.filter(t => t.status === "APROVADO").length;
  const pendentes = transacoes.filter(t => t.status === "PENDENTE").length;
  const canceladas = transacoes.filter(t => t.status === "CANCELADO").length;
  
  const valorTotalBruto = transacoes.reduce((acc, t) => acc + t.valorBruto, 0);
  const valorTotalLiquido = transacoes.reduce((acc, t) => acc + t.valorLiquido, 0);
  const totalComissoes = transacoes.reduce((acc, t) => acc + t.comissao, 0);
  const totalTaxas = transacoes.reduce((acc, t) => acc + t.taxaFixa + t.taxaProcessamento, 0);
  
  return {
    total,
    aprovadas,
    pendentes,
    canceladas,
    valorTotalBruto: Number(valorTotalBruto.toFixed(2)),
    valorTotalLiquido: Number(valorTotalLiquido.toFixed(2)),
    totalComissoes: Number(totalComissoes.toFixed(2)),
    totalTaxas: Number(totalTaxas.toFixed(2)),
  };
}
