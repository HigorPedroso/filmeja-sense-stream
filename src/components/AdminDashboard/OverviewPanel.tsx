
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BarChart3, TrendingUp, PieChart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from 'react-day-picker';
import { addDays, differenceInDays, format } from 'date-fns';

interface OverviewPanelProps {
  totalUsers?: number;
  recommendations?: number;
  watched?: number;
  isLoading: boolean;
  dateRange: DateRange;
}

const OverviewPanel: React.FC<OverviewPanelProps> = ({
  totalUsers,
  recommendations,
  watched,
  isLoading,
  dateRange
}) => {
  // Generate daily data for the chart
  const { data: usageTrends, isLoading: loadingTrends } = useQuery({
    queryKey: ['dashboard-trends', dateRange],
    queryFn: async () => {
      if (!dateRange.from || !dateRange.to) return [];
      
      const startDate = dateRange.from;
      const endDate = dateRange.to;
      const dayCount = differenceInDays(endDate, startDate) + 1;
      
      // Generate daily dates
      const dates = Array.from({ length: dayCount }, (_, i) => {
        const date = addDays(startDate, i);
        return format(date, 'yyyy-MM-dd');
      });
      
      // This is mock data - in a real app, you'd fetch actual data from Supabase
      return dates.map((date, index) => {
        const users = Math.floor(Math.random() * 20) + (index * 0.5);
        const recommendations = Math.floor(Math.random() * 30) + (index * 1.2);
        const watched = Math.floor(Math.random() * 40) + (index * 0.8);
        
        return {
          date,
          users,
          recommendations,
          watched,
          mrr: Math.floor(Math.random() * 500) + (index * 10)
        };
      });
    },
    enabled: !!(dateRange.from && dateRange.to)
  });
  
  const metricCards = [
    {
      title: "Usuários Registrados",
      value: totalUsers || 0,
      icon: <Users className="h-6 w-6 text-filmeja-purple" />,
      change: "+12% no mês",
      positive: true
    },
    {
      title: "Recomendações Geradas",
      value: recommendations || 0,
      icon: <BarChart3 className="h-6 w-6 text-filmeja-purple" />,
      change: "+8% no mês",
      positive: true
    },
    {
      title: "Conteúdos Assistidos",
      value: watched || 0,
      icon: <PieChart className="h-6 w-6 text-filmeja-purple" />,
      change: "+15% no mês",
      positive: true
    },
    {
      title: "MRR (Mensal)",
      value: "R$3,250",
      icon: <TrendingUp className="h-6 w-6 text-filmeja-purple" />,
      change: "+5% no mês",
      positive: true
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((card, index) => (
          <Card key={index} className="bg-black/30 border-gray-800 text-white shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">
                {card.title}
              </CardTitle>
              {card.icon}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-28 bg-gray-700" />
              ) : (
                <div className="text-2xl font-bold">{card.value}</div>
              )}
              <p className={`text-xs ${card.positive ? 'text-green-500' : 'text-red-500'} mt-1`}>
                {card.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-black/30 border-gray-800 text-white shadow-md overflow-hidden">
        <CardHeader>
          <CardTitle>Evolução de Uso da Plataforma</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loadingTrends ? (
            <div className="w-full h-[300px] flex items-center justify-center">
              <Skeleton className="h-[250px] w-full bg-gray-700/30" />
            </div>
          ) : (
            <ChartContainer 
              className="h-[300px]" 
              config={{
                users: { color: "#9b87f5" },
                recommendations: { color: "#7E69AB" },
                watched: { color: "#1EAEDB" }
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={usageTrends}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9b87f5" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#9b87f5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRecommendations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7E69AB" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#7E69AB" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorWatched" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1EAEDB" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#1EAEDB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    axisLine={{ stroke: '#444' }}
                    tick={{ fill: '#888' }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return format(date, 'dd/MM');
                    }}
                  />
                  <YAxis 
                    axisLine={{ stroke: '#444' }}
                    tick={{ fill: '#888' }}
                  />
                  <ChartTooltip 
                    content={
                      <ChartTooltipContent nameKey="name" labelKey="value" />
                    } 
                  />
                  <Area 
                    name="Usuários" 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#9b87f5" 
                    fillOpacity={1} 
                    fill="url(#colorUsers)" 
                  />
                  <Area 
                    name="Recomendações" 
                    type="monotone" 
                    dataKey="recommendations" 
                    stroke="#7E69AB" 
                    fillOpacity={1} 
                    fill="url(#colorRecommendations)" 
                  />
                  <Area 
                    name="Conteúdos" 
                    type="monotone" 
                    dataKey="watched" 
                    stroke="#1EAEDB" 
                    fillOpacity={1} 
                    fill="url(#colorWatched)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewPanel;
