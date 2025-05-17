
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useQuery } from '@tanstack/react-query';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Smartphone, Laptop, TrendingDown } from 'lucide-react';

interface UserMetricsPanelProps {
  dateRange: DateRange;
}

const UserMetricsPanel: React.FC<UserMetricsPanelProps> = ({ dateRange }) => {
  // Query for active users data
  const { data: activeUsers, isLoading: loadingActiveUsers } = useQuery({
    queryKey: ['dashboard-active-users', dateRange],
    queryFn: async () => {
      // Mock data - in a real app, fetch from Supabase
      return [
        { name: 'DAU (Daily)', value: 158 },
        { name: 'WAU (Weekly)', value: 487 },
        { name: 'MAU (Monthly)', value: 1258 }
      ];
    }
  });
  
  // Query for device distribution
  const { data: deviceData, isLoading: loadingDevices } = useQuery({
    queryKey: ['dashboard-devices'],
    queryFn: async () => {
      // Mock data - in a real app, fetch from Supabase
      return [
        { name: 'Desktop', value: 65, color: '#9b87f5' },
        { name: 'Mobile', value: 30, color: '#1EAEDB' },
        { name: 'Tablet', value: 5, color: '#7E69AB' }
      ];
    }
  });
  
  // Query for locations
  const { data: locationData, isLoading: loadingLocations } = useQuery({
    queryKey: ['dashboard-locations'],
    queryFn: async () => {
      // Mock data - in a real app, fetch from Supabase
      return [
        { country: 'Brasil', users: 720, percentage: '72%' },
        { country: 'Portugal', users: 160, percentage: '16%' },
        { country: 'Estados Unidos', users: 50, percentage: '5%' },
        { country: 'Canadá', users: 30, percentage: '3%' },
        { country: 'Outros', users: 40, percentage: '4%' }
      ];
    }
  });

  // Query for user retention data
  const { data: retentionData, isLoading: loadingRetention } = useQuery({
    queryKey: ['dashboard-retention'],
    queryFn: async () => {
      // Mock data - in a real app, fetch from Supabase
      return [
        { month: 'Jan', retention: 92 },
        { month: 'Fev', retention: 89 },
        { month: 'Mar', retention: 91 },
        { month: 'Abr', retention: 85 },
        { month: 'Mai', retention: 83 },
        { month: 'Jun', retention: 88 },
        { month: 'Jul', retention: 92 }
      ];
    }
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-black/30 border-gray-800 text-white shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Usuários Ativos Diários
            </CardTitle>
            <Users className="h-6 w-6 text-filmeja-purple" />
          </CardHeader>
          <CardContent>
            {loadingActiveUsers ? (
              <Skeleton className="h-8 w-28 bg-gray-700" />
            ) : (
              <div className="text-2xl font-bold">158</div>
            )}
            <p className="text-xs text-green-500 mt-1">
              +12% vs semana passada
            </p>
          </CardContent>
        </Card>

        <Card className="bg-black/30 border-gray-800 text-white shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Usuários Mobile
            </CardTitle>
            <Smartphone className="h-6 w-6 text-filmeja-purple" />
          </CardHeader>
          <CardContent>
            {loadingDevices ? (
              <Skeleton className="h-8 w-28 bg-gray-700" />
            ) : (
              <div className="text-2xl font-bold">30%</div>
            )}
            <p className="text-xs text-green-500 mt-1">
              +5% vs mês passado
            </p>
          </CardContent>
        </Card>

        <Card className="bg-black/30 border-gray-800 text-white shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Usuários Desktop
            </CardTitle>
            <Laptop className="h-6 w-6 text-filmeja-purple" />
          </CardHeader>
          <CardContent>
            {loadingDevices ? (
              <Skeleton className="h-8 w-28 bg-gray-700" />
            ) : (
              <div className="text-2xl font-bold">65%</div>
            )}
            <p className="text-xs text-green-500 mt-1">
              +2% vs mês passado
            </p>
          </CardContent>
        </Card>

        <Card className="bg-black/30 border-gray-800 text-white shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Taxa de Churn
            </CardTitle>
            <TrendingDown className="h-6 w-6 text-filmeja-purple" />
          </CardHeader>
          <CardContent>
            {loadingRetention ? (
              <Skeleton className="h-8 w-28 bg-gray-700" />
            ) : (
              <div className="text-2xl font-bold">12%</div>
            )}
            <p className="text-xs text-red-500 mt-1">
              +2% vs mês passado
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-black/30 border-gray-800 text-white shadow-md overflow-hidden">
          <CardHeader>
            <CardTitle>Distribuição por Dispositivos</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingDevices ? (
              <div className="w-full h-[300px] flex items-center justify-center">
                <Skeleton className="h-[250px] w-full bg-gray-700/30" />
              </div>
            ) : (
              <ChartContainer 
                className="h-[300px]"
                config={{
                  Desktop: { color: "#9b87f5" },
                  Mobile: { color: "#1EAEDB" },
                  Tablet: { color: "#7E69AB" }
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {deviceData?.map((entry, index) => (
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
            <CardTitle>Taxa de Retenção</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRetention ? (
              <div className="w-full h-[300px] flex items-center justify-center">
                <Skeleton className="h-[250px] w-full bg-gray-700/30" />
              </div>
            ) : (
              <ChartContainer 
                className="h-[300px]"
                config={{
                  retention: { color: "#9b87f5" }
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={retentionData}>
                    <XAxis 
                      dataKey="month" 
                      axisLine={{ stroke: '#444' }}
                      tick={{ fill: '#888' }}
                    />
                    <YAxis 
                      domain={[0, 100]}
                      axisLine={{ stroke: '#444' }}
                      tick={{ fill: '#888' }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      name="Taxa de Retenção (%)" 
                      dataKey="retention" 
                      fill="#9b87f5"
                      radius={[4, 4, 0, 0]}
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
          <CardTitle>Localização Geográfica</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingLocations ? (
            <Skeleton className="h-64 w-full bg-gray-700/30" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-white">País</TableHead>
                  <TableHead className="text-right text-white">Usuários</TableHead>
                  <TableHead className="text-right text-white">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locationData?.map((location) => (
                  <TableRow key={location.country} className="border-gray-700">
                    <TableCell>{location.country}</TableCell>
                    <TableCell className="text-right">{location.users}</TableCell>
                    <TableCell className="text-right">{location.percentage}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserMetricsPanel;
