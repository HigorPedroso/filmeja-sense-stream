
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
import { BlogPostsPanel } from '@/components/AdminDashboard/BlogPostsPanel';

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

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-metrics', dateRange],
    queryFn: async () => {
      const [
        usersData,
        recommendationsData,
        watchedData,
        subscriptionsData,
        revenueData,
        blogPostsData 
        ] = await Promise.all([
          // Users metrics
          supabase
            .from('profiles')
            .select('id, created_at, last_sign_in_at, subscription_status')
            .gte('created_at', dateRange.from?.toISOString())
            .lte('created_at', dateRange.to?.toISOString()),
  
          // Recommendations data
          supabase
            .from('recommendations')
            .select('id, created_at, content_id, user_id, rating, content_type')
            .gte('created_at', dateRange.from?.toISOString())
            .lte('created_at', dateRange.to?.toISOString()),
  
          // Watched content
          supabase
            .from('watched_content')
            .select('id, created_at, content_id, user_id, watch_duration, content_type')
            .gte('created_at', dateRange.from?.toISOString())
            .lte('created_at', dateRange.to?.toISOString()),
  
          // Subscriptions
          supabase
            .from('subscriptions')
            .select('id, created_at, user_id, status, plan_type')
            .gte('created_at', dateRange.from?.toISOString())
            .lte('created_at', dateRange.to?.toISOString()),
  
          // Revenue/Transactions
          supabase
            .from('transactions')
            .select('id, created_at, amount, status, user_id')
            .gte('created_at', dateRange.from?.toISOString())
            .lte('created_at', dateRange.to?.toISOString()),

        // Fix the blog posts query
        // In the Promise.all array, update the blog posts query
        supabase
          .from('blog_posts')
          .select('*')
          .order('created_at', { ascending: false })
        ]);
  
        // Process and return the metrics
        return {
          users: {
            total: usersData.data?.length || 0,
            active: usersData.data?.filter(u => u.last_sign_in_at)?.length || 0,
            withSubscription: usersData.data?.filter(u => u.subscription_status === 'active')?.length || 0
          },
          recommendations: {
            total: recommendationsData.data?.length || 0,
            avgRating: recommendationsData.data?.reduce((acc, rec) => acc + (rec.rating || 0), 0) / 
              (recommendationsData.data?.length || 1),
            byType: recommendationsData.data?.reduce((acc, rec) => {
              acc[rec.content_type] = (acc[rec.content_type] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          },
          watched: {
            total: watchedData.data?.length || 0,
            uniqueUsers: new Set(watchedData.data?.map(w => w.user_id)).size,
            avgDuration: watchedData.data?.reduce((acc, w) => acc + (w.watch_duration || 0), 0) / 
              (watchedData.data?.length || 1),
            byType: watchedData.data?.reduce((acc, w) => {
              acc[w.content_type] = (acc[w.content_type] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          },
          subscriptions: {
            total: subscriptionsData.data?.length || 0,
            active: subscriptionsData.data?.filter(s => s.status === 'active')?.length || 0,
            byPlan: subscriptionsData.data?.reduce((acc, sub) => {
              acc[sub.plan_type] = (acc[sub.plan_type] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          },
          revenue: {
            total: revenueData.data?.reduce((acc, tx) => 
              tx.status === 'completed' ? acc + (tx.amount || 0) : acc, 0
            ) || 0,
            transactions: revenueData.data?.length || 0
          },
          blogPosts: {
            total: blogPostsData.data?.length || 0,
            posts: blogPostsData.data || [],
            published: blogPostsData.data?.filter(post => post.status === 'published').length || 0,
            draft: blogPostsData.data?.filter(post => post.status === 'draft').length || 0
          }
        };
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
            <TabsList className="grid grid-cols-6 w-full max-w-4xl mb-6">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
              <TabsTrigger value="activities">Atividades</TabsTrigger>
              <TabsTrigger value="financial">Financeiro</TabsTrigger>
              <TabsTrigger value="blog">Blog</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <OverviewPanel 
                data={dashboardData}
                isLoading={isLoading}
                dateRange={dateRange}
              />
            </TabsContent>
            
            <TabsContent value="users" className="space-y-6">
              <UserMetricsPanel 
                data={dashboardData?.users}
                isLoading={isLoading}
                dateRange={dateRange}
              />
            </TabsContent>
            
            <TabsContent value="recommendations" className="space-y-6">
              <RecommendationPanel 
                data={dashboardData?.recommendations}
                isLoading={isLoading}
                dateRange={dateRange}
              />
            </TabsContent>
            
            <TabsContent value="activities" className="space-y-6">
              <RecentActivitiesPanel 
                data={dashboardData?.watched}
                isLoading={isLoading}
              />
            </TabsContent>
            
            <TabsContent value="financial" className="space-y-6">
              <FinancialPanel 
                data={{
                  subscriptions: dashboardData?.subscriptions,
                  revenue: dashboardData?.revenue
                }}
                isLoading={isLoading}
                dateRange={dateRange}
              />
            </TabsContent>
            
            <TabsContent value="blog" className="space-y-6">
              <BlogPostsPanel 
                data={dashboardData?.blogPosts}
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
};

export default SuperDashboard;
