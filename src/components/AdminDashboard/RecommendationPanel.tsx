import React from 'react';
import { Sparkles, Users, Gauge, ThumbsUp } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer } from 'recharts';
import type { AdminMetrics } from '@/types/dashboard';
import { BarList, Empty, fmt, PALETTE, pct, relabel, Section, SOURCE_LABELS, StatCard } from './shared';

interface RecommendationPanelProps {
  data?: AdminMetrics;
  isLoading: boolean;
}

const icon = (Icon: React.ElementType) => <Icon className="h-6 w-6 text-filmeja-purple" />;

const RecommendationPanel: React.FC<RecommendationPanelProps> = ({ data, isLoading }) => {
  const rec = data?.recommendations;
  const eng = data?.engagement;
  const sources = relabel(rec?.by_source, SOURCE_LABELS);
  const reactions = (eng?.likes ?? 0) + (eng?.dislikes ?? 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Recomendações geradas" value={fmt(rec?.total)} icon={icon(Sparkles)} loading={isLoading} />
        <StatCard title="Usuários que pediram" value={fmt(rec?.users)} icon={icon(Users)} loading={isLoading} />
        <StatCard
          title="Média por usuário"
          value={rec && rec.users > 0 ? (rec.total / rec.users).toFixed(1).replace('.', ',') : '—'}
          icon={icon(Gauge)}
          loading={isLoading}
        />
        <StatCard
          title="Aprovação (curtidas)"
          value={pct(eng?.likes ?? 0, reactions)}
          hint={`${fmt(eng?.likes)} curtidas · ${fmt(eng?.dislikes)} descurtidas`}
          icon={icon(ThumbsUp)}
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Como o usuário pede a recomendação" loading={isLoading} height={260}>
          {sources.length === 0 ? (
            <Empty />
          ) : (
            <ChartContainer className="h-[260px]" config={{}}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sources}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {sources.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </Section>

        <Section title="Serviços de streaming mais clicados" loading={isLoading} height={260}>
          <BarList items={eng?.providers ?? []} color="#1EAEDB" />
        </Section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Section title="Gêneros mais escolhidos" loading={isLoading} height={220}>
          <BarList items={rec?.top_genres ?? []} />
        </Section>
        <Section title="Humores mais escolhidos" loading={isLoading} height={220}>
          <BarList items={rec?.top_moods ?? []} color="#BE95C4" />
        </Section>
        <Section title="Títulos mais recomendados" loading={isLoading} height={220}>
          <BarList items={rec?.top_titles ?? []} color="#22C55E" />
        </Section>
      </div>
    </div>
  );
};

export default RecommendationPanel;
