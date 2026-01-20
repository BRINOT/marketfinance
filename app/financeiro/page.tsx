"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

// Dados iniciais vazios - conectar com API real
const mockData = {
  receitaBruta: 0,
  receitaLiquida: 0,
  totalTaxas: 0,
  margemEstimada: 0,
};

const marketplaceData: Array<{ name: string; receita: number; taxas: number; liquida: number }> = [];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function FinanceiroPage() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">
            Visão geral das suas métricas financeiras
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Bruta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mockData.receitaBruta)}</div>
            <p className="text-xs text-muted-foreground">Total de vendas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Líquida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mockData.receitaLiquida)}</div>
            <p className="text-xs text-muted-foreground">Após taxas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Taxas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mockData.totalTaxas)}</div>
            <p className="text-xs text-muted-foreground">Comissões e taxas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem Estimada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.margemEstimada.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Margem líquida</p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown por Marketplace */}
      {marketplaceData.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Receita por Marketplace</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={marketplaceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="receita" fill="#8884d8" name="Receita Bruta" />
                    <Bar dataKey="liquida" fill="#82ca9d" name="Receita Líquida" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Receita</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={marketplaceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="receita"
                    >
                      {marketplaceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Detalhes */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhamento por Marketplace</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Marketplace</th>
                      <th className="text-right p-2">Receita Bruta</th>
                      <th className="text-right p-2">Taxas</th>
                      <th className="text-right p-2">Receita Líquida</th>
                      <th className="text-right p-2">Margem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketplaceData.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">{item.name}</td>
                        <td className="text-right p-2">{formatCurrency(item.receita)}</td>
                        <td className="text-right p-2">{formatCurrency(item.taxas)}</td>
                        <td className="text-right p-2">{formatCurrency(item.liquida)}</td>
                        <td className="text-right p-2">{((item.liquida / item.receita) * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Dados Financeiros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-2">Nenhum dado disponível</p>
              <p className="text-sm text-muted-foreground">
                Conecte suas contas de marketplace para visualizar suas métricas financeiras
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
