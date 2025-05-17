
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AdminSidebar from '@/components/AdminDashboard/AdminSidebar';
import DashboardHeader from '@/components/AdminDashboard/DashboardHeader';
import OverviewPanel from '@/components/AdminDashboard/OverviewPanel';
import UserMetricsPanel from '@/components/AdminDashboard/UserMetricsPanel';
import RecommendationPanel from '@/components/AdminDashboard/RecommendationPanel';
import RecentActivitiesPanel from '@/components/AdminDashboard/RecentActivitiesPanel';
import FinancialPanel from '@/components/AdminDashboard/FinancialPanel';
import { DateRangePicker } from '@/components/AdminDashboard/DateRangePicker';

const SuperDashboard = () => {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  });

  const { data: totalUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ['dashboard-users'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    }
  });

  const { data: recommendations, isLoading: loadingRecommendations } = useQuery({
    queryKey: ['dashboard-recommendations'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('recommendations')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    }
  });

  const { data: watchedContent, isLoading: loadingWatched } = useQuery({
    queryKey: ['dashboard-watched'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('watched_content')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    }
  });

  return (
    <div className="flex min-h-screen bg-filmeja-dark text-white">
      <AdminSidebar />
      
      <div className="flex-1 p-6 md:p-8 overflow-auto">
        <DashboardHeader 
          title="SuperDashboard" 
          subtitle="Visão administrativa completa do FilmeJá"
        />
        
        <div className="my-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Visão Geral</h2>
          <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} />
        </div>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-5 w-full max-w-4xl mb-6">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
            <TabsTrigger value="activities">Atividades</TabsTrigger>
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <OverviewPanel 
              totalUsers={totalUsers} 
              recommendations={recommendations}
              watched={watchedContent}
              isLoading={loadingUsers || loadingRecommendations || loadingWatched}
              dateRange={dateRange}
            />
          </TabsContent>
          
          <TabsContent value="users" className="space-y-6">
            <UserMetricsPanel dateRange={dateRange} />
          </TabsContent>
          
          <TabsContent value="recommendations" className="space-y-6">
            <RecommendationPanel dateRange={dateRange} />
          </TabsContent>
          
          <TabsContent value="activities" className="space-y-6">
            <RecentActivitiesPanel />
          </TabsContent>
          
          <TabsContent value="financial" className="space-y-6">
            <FinancialPanel dateRange={dateRange} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SuperDashboard;
