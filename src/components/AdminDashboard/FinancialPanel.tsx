
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useQuery } from '@tanstack/react-query';
import { DateRange } from 'react-day-picker';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Coins, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface FinancialPanelProps {
  dateRange: DateRange;
}

const FinancialPanel: React.FC<FinancialPanelProps> = ({ dateRange }) => {
  // Query for revenue data
  const { data: revenueData, isLoading: loadingRevenue } = useQuery({
    queryKey: ['dashboard-revenue', dateRange],
    queryFn: async () => {
      // Mock data - in a real app, fetch from Supabase
      return [
        { month: 'Jan', receita: 2500 },
        { month: 'Fev', receita: 3200 },
        { month: 'Mar', receita: 3100 },
        { month: 'Abr', receita: 4200 },
        { month: 'Mai', receita: 4800 },
        { month: 'Jun', receita: 5300 },
        { month: 'Jul', receita: 6100 }
      ];
    },
    enabled: !!(dateRange.from && dateRange.to)
  });

  // Query for plan distribution
  const { data: planData, isLoading: loadingPlans } = useQuery({
    queryKey: ['dashboard-plans'],
    queryFn: async () => {
      // Mock data - in a real app, fetch from Supabase
      return [
        { name: 'Básico', value: 55, color: '#1EAEDB' },
        { name: 'Premium', value: 30, color: '#9b87f5' },
        { name: 'Familiar', value: 15, color: '#7E69AB' }
      ];
    }
  });

  // Query for conversion rates
  const { data: conversionData, isLoading: loadingConversion } = useQuery({
    queryKey: ['dashboard-conversion'],
    queryFn: async () => {
      // Mock data
      return [
        { name: 'Trial → Básico', rate: 22 },
        { name: 'Básico → Premium', rate: 15 },
        { name: 'Trial → Premium', rate: 8 },
        { name: 'Premium → Familiar', rate: 12 }
      ];
    }
  });

  // Query for recent transactions
  const { data: transactionData, isLoading: loadingTransactions } = useQuery({
    queryKey: ['dashboard-transactions'],
    queryFn: async () => {
      // Mock data
      return [
        { id: '1', user: 'Ana Silva', plan: 'Premium', amount: 'R$29,90', date: '2023-07-15', status: 'completed' },
        { id: '2', user: 'Carlos Mendes', plan: 'Familiar', amount: 'R$39,90', date: '2023-07-14', status: 'completed' },
        { id: '3', user: 'Maria Santos', plan: 'Básico', amount: 'R$19,90', date: '2023-07-14', status: 'completed' },
        { id: '4', user: 'João Pereira', plan: 'Premium', amount: 'R$29,90', date: '2023-07-13', status: 'completed' },
        { id: '5', user: 'Lucia Costa', plan: 'Básico', amount: 'R$19,90', date: '2023-07-12', status: 'failed' },
      ];
    }
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-black/30 border-gray-800 text-white shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Receita Total (Mês)
            </CardTitle>
            <DollarSign className="h-6 w-6 text-filmeja-purple" />
          </CardHeader>
          <CardContent>
            {loadingRevenue ? (
              <Skeleton className="h-8 w-28 bg-gray-700" />
            ) : (
              <div className="text-2xl font-bold">R$6.100</div>
            )}
            <p className="text-xs text-green-500 mt-1">
              +15% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="bg-black/30 border-gray-800 text-white shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Valor por Usuário
            </CardTitle>
            <Coins className="h-6 w-6 text-filmeja-purple" />
          </CardHeader>
          <CardContent>
            {loadingRevenue ? (
              <Skeleton className="h-8 w-28 bg-gray-700" />
            ) : (
              <div className="text-2xl font-bold">R$24,50</div>
            )}
            <p className="text-xs text-green-500 mt-1">
              +5% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="bg-black/30 border-gray-800 text-white shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Taxa de Conversão
            </CardTitle>
            <TrendingUp className="h-6 w-6 text-filmeja-purple" />
          </CardHeader>
          <CardContent>
            {loadingConversion ? (
              <Skeleton className="h-8 w-28 bg-gray-700" />
            ) : (
              <div className="text-2xl font-bold">22%</div>
            )}
            <p className="text-xs text-green-500 mt-1">
              +3% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="bg-black/30 border-gray-800 text-white shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Taxa de Cancelamento
            </CardTitle>
            <TrendingDown className="h-6 w-6 text-filmeja-purple" />
          </CardHeader>
          <CardContent>
            {loadingConversion ? (
              <Skeleton className="h-8 w-28 bg-gray-700" />
            ) : (
              <div className="text-2xl font-bold">8%</div>
            )}
            <p className="text-xs text-red-500 mt-1">
              +1% vs mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-black/30 border-gray-800 text-white shadow-md">
          <CardHeader>
            <CardTitle>Receita Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRevenue ? (
              <div className="w-full h-[300px] flex items-center justify-center">
                <Skeleton className="h-[250px] w-full bg-gray-700/30" />
              </div>
            ) : (
              <ChartContainer 
                className="h-[300px]"
                config={{
                  receita: { color: "#9b87f5" }
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9b87f5" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#9b87f5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="month" 
                      axisLine={{ stroke: '#444' }}
                      tick={{ fill: '#888' }}
                    />
                    <YAxis 
                      axisLine={{ stroke: '#444' }}
                      tick={{ fill: '#888' }}
                      tickFormatter={(value) => `R$${value}`}
                    />
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <ChartTooltip 
                      content={
                        <ChartTooltipContent 
                          formatter={(value) => `R$${value}`}
                        />
                      } 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="receita" 
                      name="Receita" 
                      stroke="#9b87f5" 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-black/30 border-gray-800 text-white shadow-md">
          <CardHeader>
            <CardTitle>Distribuição por Plano</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPlans ? (
              <div className="w-full h-[300px] flex items-center justify-center">
                <Skeleton className="h-[250px] w-full bg-gray-700/30" />
              </div>
            ) : (
              <ChartContainer 
                className="h-[300px]"
                config={{
                  Básico: { color: "#1EAEDB" },
                  Premium: { color: "#9b87f5" },
                  Familiar: { color: "#7E69AB" }
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={planData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {planData?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-black/30 border-gray-800 text-white shadow-md">
          <CardHeader>
            <CardTitle>Taxas de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingConversion ? (
              <div className="w-full h-[250px] flex items-center justify-center">
                <Skeleton className="h-[200px] w-full bg-gray-700/30" />
              </div>
            ) : (
              <ChartContainer 
                className="h-[250px]"
                config={{
                  rate: { color: "#9b87f5" }
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conversionData} layout="vertical">
                    <XAxis 
                      type="number" 
                      axisLine={{ stroke: '#444' }}
                      tick={{ fill: '#888' }}
                    />
                    <YAxis 
                      dataKey="name" 
                      type="category"
                      axisLine={{ stroke: '#444' }}
                      tick={{ fill: '#888' }}
                      width={120}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="rate" 
                      name="Taxa de Conversão (%)" 
                      fill="#9b87f5"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-black/30 border-gray-800 text-white shadow-md">
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTransactions ? (
              <Skeleton className="h-64 w-full bg-gray-700/30" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-white">Usuário</TableHead>
                      <TableHead className="text-white">Plano</TableHead>
                      <TableHead className="text-white">Valor</TableHead>
                      <TableHead className="text-white text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionData?.map((transaction) => (
                      <TableRow key={transaction.id} className="border-gray-700">
                        <TableCell className="font-medium">{transaction.user}</TableCell>
                        <TableCell>{transaction.plan}</TableCell>
                        <TableCell>{transaction.amount}</TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            className={
                              transaction.status === 'completed' 
                                ? 'bg-green-600/20 text-green-500 hover:bg-green-600/30' 
                                : 'bg-red-600/20 text-red-500 hover:bg-red-600/30'
                            }
                          >
                            {transaction.status === 'completed' ? 'Completo' : 'Falhou'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinancialPanel;
