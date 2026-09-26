import React from 'react';
import { Crown, Percent, ClipboardCheck, Bell, Info } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import type { AdminMetrics } from '@/types/dashboard';
import { BarList, fmt, pct, PALETTE, REASON_LABELS, relabel, Section, StatCard } from './shared';

interface FinancialPanelProps {
  data?: AdminMetrics;
  isLoading: boolean;
}

const icon = (Icon: React.ElementType) => <Icon className="h-6 w-6 text-filmeja-purple" />;

const FinancialPanel: React.FC<FinancialPanelProps> = ({ data, isLoading }) => {
  const f = data?.funnel;
  const n = data?.notifications;

  const funnel = [
    { name: 'Cadastraram', value: f?.signed_up ?? 0 },
    { name: 'Concluíram o onboarding', value: f?.onboarded ?? 0 },
    { name: 'Geraram recomendação', value: f?.recommended ?? 0 },
    { name: 'Assinaram Premium', value: f?.premium ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-4 text-sm text-sky-200 flex gap-3">
        <Info className="h-5 w-5 shrink-0 mt-0.5" />
        <p>
          Valores em reais não aparecem aqui: as assinaturas são cobradas pela App Store / Google Play (via
          RevenueCat) e o banco só guarda se o usuário é Premium ou não. Receita e MRR reais estão no painel do
          RevenueCat.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Usuários Premium" value={fmt(f?.premium)} icon={icon(Crown)} loading={isLoading} />
        <StatCard
          title="Conversão para Premium"
          value={pct(f?.premium ?? 0, f?.signed_up ?? 0)}
          hint={`${fmt(f?.premium)} de ${fmt(f?.signed_up)} cadastrados`}
          icon={icon(Percent)}
          loading={isLoading}
        />
        <StatCard
          title="Concluíram o onboarding"
          value={pct(f?.onboarded ?? 0, f?.signed_up ?? 0)}
          hint={`${fmt(f?.onboarded)} de ${fmt(f?.signed_up)} cadastrados`}
          icon={icon(ClipboardCheck)}
          loading={isLoading}
        />
        <StatCard
          title="Notificações enviadas"
          value={fmt(n?.sent)}
          hint={`${fmt(n?.opened)} abertas no período`}
          icon={icon(Bell)}
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Funil (desde o início)" loading={isLoading} height={250}>
          <ChartContainer className="h-[250px]" config={{ value: { label: 'Usuários', color: '#9b87f5' } }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" axisLine={{ stroke: '#444' }} tick={{ fill: '#888' }} allowDecimals={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={{ stroke: '#444' }}
                  tick={{ fill: '#888' }}
                  width={150}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar name="Usuários" dataKey="value" radius={[0, 4, 4, 0]}>
                  {funnel.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Section>

        <Section title="Notificações enviadas por tipo" loading={isLoading} height={250}>
          <BarList items={relabel(n?.by_reason, REASON_LABELS)} color="#1EAEDB" />
        </Section>
      </div>
    </div>
  );
};

export default FinancialPanel;
