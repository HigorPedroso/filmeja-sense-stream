import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { subDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import AdminSidebar from '@/components/AdminDashboard/AdminSidebar';
import DashboardHeader from '@/components/AdminDashboard/DashboardHeader';
import OverviewPanel from '@/components/AdminDashboard/OverviewPanel';
import UserMetricsPanel from '@/components/AdminDashboard/UserMetricsPanel';
import RecommendationPanel from '@/components/AdminDashboard/RecommendationPanel';
import RecentActivitiesPanel from '@/components/AdminDashboard/RecentActivitiesPanel';
import FinancialPanel from '@/components/AdminDashboard/FinancialPanel';
import { ErrorBanner } from '@/components/AdminDashboard/shared';
import { DateRangePicker } from '@/components/AdminDashboard/DateRangePicker';
import { BlogPostsPanel } from '@/components/AdminDashboard/BlogPostsPanel';
import { useAdminMetrics } from '@/hooks/useAdminDashboard';

// The sidebar links to /super/<section>; each one opens the matching tab.
const PATH_TO_TAB: Record<string, string> = {
  '/super/users': 'users',
  '/super/analytics': 'overview',
  '/super/recommendations': 'recommendations',
  '/super/finances': 'financial',
};

const TAB_TO_PATH: Record<string, string> = {
  overview: '/super',
  users: '/super/users',
  recommendations: '/super/recommendations',
  financial: '/super/finances',
};

const SuperDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState(PATH_TO_TAB[location.pathname] ?? 'overview');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  useEffect(() => {
    setTab(PATH_TO_TAB[location.pathname] ?? 'overview');
  }, [location.pathname]);

  const { data: metrics, isLoading, error } = useAdminMetrics(dateRange);

  // blog_posts isn't in the generated Supabase types yet, hence the loose cast.
  const { data: blogPosts, isLoading: loadingBlog } = useQuery({
    queryKey: ['admin-blog-posts'],
    queryFn: async () => {
      const client = supabase as unknown as {
        from: (table: string) => {
          select: (cols: string) => {
            order: (col: string, opts: { ascending: boolean }) => Promise<{
              data: Array<{ status: string } & Record<string, unknown>> | null;
              error: { message: string } | null;
            }>;
          };
        };
      };
      const { data, error } = await client.from('blog_posts').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      const posts = data ?? [];
      return {
        total: posts.length,
        posts,
        published: posts.filter((p) => p.status === 'published').length,
        draft: posts.filter((p) => p.status === 'draft').length,
      };
    },
  });

  return (
    <div className="flex min-h-screen bg-filmeja-dark text-white">
      <AdminSidebar />

      <div className="flex-1 p-6 md:p-8 overflow-auto">
        <DashboardHeader title="SuperDashboard" subtitle="Visão administrativa completa do FilmeJá" />

        <div className="my-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Visão Geral</h2>
            <p className="text-sm text-gray-400">
              Números reais do banco. O período vale para os totais e gráficos; “ativos hoje/7/30 dias” é sempre
              relativo a agora.
            </p>
          </div>
          <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} />
        </div>

        {error && <ErrorBanner error={error} />}

        <Tabs
          value={tab}
          onValueChange={(value) => {
            setTab(value);
            if (TAB_TO_PATH[value]) navigate(TAB_TO_PATH[value], { replace: true });
          }}
          className="w-full mt-4"
        >
          <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full max-w-4xl mb-6 h-auto">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
            <TabsTrigger value="activities">Atividades</TabsTrigger>
            <TabsTrigger value="financial">Premium</TabsTrigger>
            <TabsTrigger value="blog">Blog</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OverviewPanel data={metrics} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserMetricsPanel data={metrics} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <RecommendationPanel data={metrics} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="activities" className="space-y-6">
            <RecentActivitiesPanel />
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <FinancialPanel data={metrics} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="blog" className="space-y-6">
            <BlogPostsPanel data={blogPosts as never} isLoading={loadingBlog} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SuperDashboard;
