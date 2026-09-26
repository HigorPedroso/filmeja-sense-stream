import React from 'react';
import { Users, Activity, Sparkles, Crown, Eye, ThumbsUp, Bookmark, MousePointerClick } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { format } from 'date-fns';
import type { AdminMetrics } from '@/types/dashboard';
import { Empty, fmt, pct, Section, StatCard } from './shared';

interface OverviewPanelProps {
  data?: AdminMetrics;
  isLoading: boolean;
}

const icon = (Icon: React.ElementType) => <Icon className="h-6 w-6 text-filmeja-purple" />;

const OverviewPanel: React.FC<OverviewPanelProps> = ({ data, isLoading }) => {
  const u = data?.users;
  const e = data?.engagement;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Usuários cadastrados"
          value={fmt(u?.total)}
          hint={`${fmt(u?.new)} novos no período`}
          icon={icon(Users)}
          loading={isLoading}
        />
        <StatCard
          title="Usuários ativos no período"
          value={fmt(u?.active)}
          hint={`Hoje: ${fmt(u?.dau)} · 7 dias: ${fmt(u?.wau)} · 30 dias: ${fmt(u?.mau)}`}
          icon={icon(Activity)}
          loading={isLoading}
        />
        <StatCard
          title="Recomendações geradas"
          value={fmt(data?.recommendations.total)}
          hint={`${fmt(data?.recommendations.users)} usuários diferentes`}
          icon={icon(Sparkles)}
          loading={isLoading}
        />
        <StatCard
          title="Usuários Premium"
          value={fmt(u?.premium)}
          hint={`${pct(u?.premium ?? 0, u?.total ?? 0)} dos cadastrados`}
          icon={icon(Crown)}
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Títulos visualizados" value={fmt(e?.views)} icon={icon(Eye)} loading={isLoading} />
        <StatCard
          title="Curtidas"
          value={fmt(e?.likes)}
          hint={`${fmt(e?.dislikes)} descurtidas`}
          icon={icon(ThumbsUp)}
          loading={isLoading}
        />
        <StatCard title="Títulos salvos" value={fmt(e?.saves)} icon={icon(Bookmark)} loading={isLoading} />
        <StatCard
          title="Cliques em streaming"
          value={fmt(e?.provider_clicks)}
          hint="Abriu um serviço para assistir"
          icon={icon(MousePointerClick)}
          loading={isLoading}
        />
      </div>

      <Section title="Atividade diária" loading={isLoading}>
        {data && data.daily.length > 0 ? (
          <ChartContainer
            className="h-[300px]"
            config={{
              active_users: { label: 'Usuários ativos', color: '#9b87f5' },
              signups: { label: 'Novos cadastros', color: '#22C55E' },
              recommendations: { label: 'Recomendações', color: '#1EAEDB' },
              views: { label: 'Títulos vistos', color: '#F97316' },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.daily} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="date"
                  axisLine={{ stroke: '#444' }}
                  tick={{ fill: '#888' }}
                  tickFormatter={(v) => format(new Date(`${v}T12:00:00`), 'dd/MM')}
                />
                <YAxis axisLine={{ stroke: '#444' }} tick={{ fill: '#888' }} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line type="monotone" name="Usuários ativos" dataKey="active_users" stroke="#9b87f5" strokeWidth={2} dot={false} />
                <Line type="monotone" name="Novos cadastros" dataKey="signups" stroke="#22C55E" strokeWidth={2} dot={false} />
                <Line type="monotone" name="Recomendações" dataKey="recommendations" stroke="#1EAEDB" strokeWidth={2} dot={false} />
                <Line type="monotone" name="Títulos vistos" dataKey="views" stroke="#F97316" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <Empty />
        )}
      </Section>
    </div>
  );
};

export default OverviewPanel;
