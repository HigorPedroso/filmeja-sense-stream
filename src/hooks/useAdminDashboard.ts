import { useQuery } from '@tanstack/react-query';
import { endOfDay, startOfDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { DateRange } from 'react-day-picker';
import type { AdminActivity, AdminMetrics } from '@/types/dashboard';

// admin_dashboard_metrics / admin_recent_activity aren't in the generated
// Supabase types (see supabase/admin_dashboard_rpc.sql), hence the casts.
const rpc = supabase.rpc.bind(supabase) as unknown as (
  fn: string,
  args?: Record<string, unknown>
) => Promise<{ data: unknown; error: { message: string } | null }>;

export function useAdminMetrics(dateRange: DateRange) {
  const from = dateRange.from ? startOfDay(dateRange.from) : undefined;
  const to = dateRange.to ? endOfDay(dateRange.to) : from ? endOfDay(from) : undefined;

  return useQuery<AdminMetrics>({
    queryKey: ['admin-dashboard-metrics', from?.toISOString(), to?.toISOString()],
    enabled: !!from && !!to,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await rpc('admin_dashboard_metrics', {
        p_from: from!.toISOString(),
        p_to: to!.toISOString(),
      });
      if (error) throw new Error(error.message);
      return data as AdminMetrics;
    },
  });
}

export function useAdminActivity() {
  return useQuery<AdminActivity>({
    queryKey: ['admin-recent-activity'],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await rpc('admin_recent_activity');
      if (error) throw new Error(error.message);
      return data as AdminActivity;
    },
  });
}
