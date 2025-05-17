
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useQuery } from '@tanstack/react-query';
import { DateRange } from 'react-day-picker';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Badge } from '@/components/ui/badge';

interface RecommendationPanelProps {
  dateRange: DateRange;
}

const RecommendationPanel: React.FC<RecommendationPanelProps> = ({ dateRange }) => {
  // Query for genre distribution
  const { data: genreData, isLoading: loadingGenres } = useQuery({
    queryKey: ['dashboard-genres'],
    queryFn: async () => {
      // Mock data - in a real app, fetch from Supabase
      return [
        { name: 'Ação', value: 25, color: '#9b87f5' },
        { name: 'Drama', value: 20, color: '#1EAEDB' },
        { name: 'Comédia', value: 18, color: '#7E69AB' },
        { name: 'Sci-Fi', value: 15, color: '#5E548E' },
        { name: 'Romance', value: 12, color: '#BE95C4' },
        { name: 'Outros', value: 10, color: '#555555' }
      ];
    }
  });

  // Query for keyword trends
  const { data: keywordData, isLoading: loadingKeywords } = useQuery({
    queryKey: ['dashboard-keywords'],
    queryFn: async () => {
      // Mock data - in a real app, fetch from Supabase
      return [
        { text: "ação", count: 156 },
        { text: "suspense", count: 123 },
        { text: "romance", count: 105 },
        { text: "ficção científica", count: 98 },
        { text: "comédia", count: 87 },
        { text: "drama", count: 82 },
        { text: "animação", count: 76 },
        { text: "aventura", count: 72 },
        { text: "super-herói", count: 65 },
        { text: "fantasia", count: 59 },
        { text: "terror", count: 53 },
        { text: "mistério", count: 47 }
      ];
    }
  });

  // Query for recommendation monthly data
  const { data: monthlyData, isLoading: loadingMonthly } = useQuery({
    queryKey: ['dashboard-monthly-recommendations'],
    queryFn: async () => {
      // Mock data - in a real app, fetch from Supabase
      return [
        { month: 'Jan', filmes: 245, series: 178 },
        { month: 'Fev', filmes: 320, series: 210 },
        { month: 'Mar', filmes: 285, series: 205 },
        { month: 'Abr', filmes: 390, series: 240 },
        { month: 'Mai', filmes: 430, series: 280 },
        { month: 'Jun', filmes: 510, series: 330 },
        { month: 'Jul', filmes: 485, series: 310 }
      ];
    }
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-black/30 border-gray-800 text-white shadow-md overflow-hidden">
          <CardHeader>
            <CardTitle>Gêneros Mais Recomendados</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingGenres ? (
              <div className="w-full h-[300px] flex items-center justify-center">
                <Skeleton className="h-[250px] w-full bg-gray-700/30" />
              </div>
            ) : (
              <ChartContainer 
                className="h-[300px]"
                config={{
                  Ação: { color: "#9b87f5" },
                  Drama: { color: "#1EAEDB" },
                  Comédia: { color: "#7E69AB" },
                  "Sci-Fi": { color: "#5E548E" },
                  Romance: { color: "#BE95C4" },
                  Outros: { color: "#555555" }
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genreData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {genreData?.map((entry, index) => (
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

        <Card className="bg-black/30 border-gray-800 text-white shadow-md">
          <CardHeader>
            <CardTitle>Volume de Recomendações</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMonthly ? (
              <div className="w-full h-[300px] flex items-center justify-center">
                <Skeleton className="h-[250px] w-full bg-gray-700/30" />
              </div>
            ) : (
              <ChartContainer 
                className="h-[300px]"
                config={{
                  filmes: { color: "#9b87f5" },
                  series: { color: "#1EAEDB" }
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <XAxis 
                      dataKey="month" 
                      axisLine={{ stroke: '#444' }}
                      tick={{ fill: '#888' }}
                    />
                    <YAxis 
                      axisLine={{ stroke: '#444' }}
                      tick={{ fill: '#888' }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar 
                      name="Filmes" 
                      dataKey="filmes" 
                      fill="#9b87f5" 
                      radius={[4, 4, 0, 0]}
                      stackId="a"
                    />
                    <Bar 
                      name="Séries" 
                      dataKey="series" 
                      fill="#1EAEDB" 
                      radius={[4, 4, 0, 0]}
                      stackId="a"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-black/30 border-gray-800 text-white shadow-md">
        <CardHeader>
          <CardTitle>Palavras-chave Mais Buscadas</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingKeywords ? (
            <Skeleton className="h-32 w-full bg-gray-700/30" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {keywordData?.map((keyword) => (
                <Badge 
                  key={keyword.text} 
                  className="bg-filmeja-dark border border-filmeja-purple/50 text-white hover:bg-filmeja-purple/20 px-3 py-1.5"
                  style={{ fontSize: `${Math.max(0.75, Math.min(1.5, 0.75 + (keyword.count / 200)))}rem` }}
                >
                  {keyword.text} <span className="ml-1 text-xs text-gray-400">({keyword.count})</span>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-black/30 border-gray-800 text-white shadow-md">
          <CardHeader>
            <CardTitle>Estatísticas de Recomendações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Taxa de Aceitação</span>
                <div className="w-2/3 bg-gray-700 rounded-full h-2">
                  <div className="bg-filmeja-purple h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
                <span className="text-sm font-medium">78%</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Avaliações Positivas</span>
                <div className="w-2/3 bg-gray-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '82%' }}></div>
                </div>
                <span className="text-sm font-medium">82%</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Re-engajamento</span>
                <div className="w-2/3 bg-gray-700 rounded-full h-2">
                  <div className="bg-filmeja-blue h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <span className="text-sm font-medium">65%</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Recomendações por Usuário</span>
                <div className="w-2/3 bg-gray-700 rounded-full h-2">
                  <div className="bg-filmeja-purple-dark h-2 rounded-full" style={{ width: '54%' }}></div>
                </div>
                <span className="text-sm font-medium">5.4</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/30 border-gray-800 text-white shadow-md">
          <CardHeader>
            <CardTitle>Plataformas Mais Populares</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Netflix</span>
                <div className="w-2/3 bg-gray-700 rounded-full h-2">
                  <div className="bg-red-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <span className="text-sm font-medium">85%</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Prime Video</span>
                <div className="w-2/3 bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '68%' }}></div>
                </div>
                <span className="text-sm font-medium">68%</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Disney+</span>
                <div className="w-2/3 bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-700 h-2 rounded-full" style={{ width: '52%' }}></div>
                </div>
                <span className="text-sm font-medium">52%</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">HBO Max</span>
                <div className="w-2/3 bg-gray-700 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <span className="text-sm font-medium">45%</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Globoplay</span>
                <div className="w-2/3 bg-gray-700 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '38%' }}></div>
                </div>
                <span className="text-sm font-medium">38%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RecommendationPanel;
