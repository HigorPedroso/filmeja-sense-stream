import React from 'react';
import { Users, UserPlus, Repeat, CalendarDays } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { format } from 'date-fns';
import type { AdminMetrics } from '@/types/dashboard';
import { Empty, fmt, LANGUAGE_LABELS, PALETTE, PLATFORM_LABELS, pct, relabel, Section, StatCard } from './shared';

interface UserMetricsPanelProps {
  data?: AdminMetrics;
  isLoading: boolean;
}

const icon = (Icon: React.ElementType) => <Icon className="h-6 w-6 text-filmeja-purple" />;

const Donut = ({ items }: { items: { name: string; value: number }[] }) =>
  items.length === 0 ? (
    <Empty />
  ) : (
    <ChartContainer className="h-[280px]" config={{}}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={items}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={95}
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {items.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Legend />
          <ChartTooltip content={<ChartTooltipContent />} />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );

const UserMetricsPanel: React.FC<UserMetricsPanelProps> = ({ data, isLoading }) => {
  const u = data?.users;
  const r = data?.retention;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Ativos nas últimas 24h"
          value={fmt(u?.dau)}
          hint={`${pct(u?.dau ?? 0, u?.total ?? 0)} da base`}
          icon={icon(Users)}
          loading={isLoading}
        />
        <StatCard
          title="Ativos nos últimos 7 dias"
          value={fmt(u?.wau)}
          hint={`${pct(u?.wau ?? 0, u?.total ?? 0)} da base`}
          icon={icon(CalendarDays)}
          loading={isLoading}
        />
        <StatCard
          title="Ativos nos últimos 30 dias"
          value={fmt(u?.mau)}
          hint={`${pct(u?.mau ?? 0, u?.total ?? 0)} da base`}
          icon={icon(CalendarDays)}
          loading={isLoading}
        />
        <StatCard
          title="Novos no período"
          value={fmt(u?.new)}
          hint={`Total: ${fmt(u?.total)} cadastrados`}
          icon={icon(UserPlus)}
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatCard
          title="Retorno em até 7 dias"
          value={pct(r?.returned ?? 0, r?.eligible ?? 0)}
          hint={
            r && r.eligible > 0
              ? `${fmt(r.returned)} de ${fmt(r.eligible)} novos usuários voltaram entre o dia 1 e o dia 7 após o cadastro`
              : 'Sem novos usuários com 7+ dias no período'
          }
          icon={icon(Repeat)}
          loading={isLoading}
        />
        <Section title="Idioma dos usuários" loading={isLoading} height={280}>
          <Donut items={relabel(data?.languages, LANGUAGE_LABELS)} />
        </Section>
        <Section title="Dispositivos com notificações ativas" loading={isLoading} height={280}>
          <Donut items={relabel(data?.devices, PLATFORM_LABELS)} />
        </Section>
      </div>

      <Section title="Novos cadastros por dia" loading={isLoading} height={280}>
        {data && data.daily.length > 0 ? (
          <ChartContainer className="h-[280px]" config={{ signups: { label: 'Cadastros', color: '#9b87f5' } }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.daily} margin={{ left: -10 }}>
                <XAxis
                  dataKey="date"
                  axisLine={{ stroke: '#444' }}
                  tick={{ fill: '#888' }}
                  tickFormatter={(v) => format(new Date(`${v}T12:00:00`), 'dd/MM')}
                />
                <YAxis axisLine={{ stroke: '#444' }} tick={{ fill: '#888' }} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar name="Cadastros" dataKey="signups" fill="#9b87f5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <Empty />
        )}
      </Section>
    </div>
  );
};

export default UserMetricsPanel;
