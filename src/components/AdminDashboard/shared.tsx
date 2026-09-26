import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { NamedValue } from '@/types/dashboard';

export const PALETTE = ['#9b87f5', '#1EAEDB', '#7E69AB', '#BE95C4', '#22C55E', '#F97316', '#EAB308', '#5E548E'];

export const fmt = (n: number | undefined | null) => (n ?? 0).toLocaleString('pt-BR');

// "—" instead of 0% / NaN when there's nothing to divide by.
export const pct = (part: number, total: number) =>
  total > 0 ? `${((part / total) * 100).toFixed(1).replace('.', ',')}%` : '—';

export const SOURCE_LABELS: Record<string, string> = {
  mood: 'Por humor',
  genre: 'Por gênero',
  desconhecido: 'Não informado',
};

export const REASON_LABELS: Record<string, string> = {
  weekend_session: 'Sessão de fim de semana',
  reengagement: 'Reengajamento',
  title_compatibility: 'Compatibilidade com título',
  desconhecido: 'Não informado',
};

export const LANGUAGE_LABELS: Record<string, string> = {
  'pt-BR': 'Português',
  'en-US': 'Inglês',
  'es-419': 'Espanhol',
};

export const PLATFORM_LABELS: Record<string, string> = {
  android: 'Android',
  ios: 'iOS',
  web: 'Web',
  desconhecido: 'Não informado',
};

export const relabel = (items: NamedValue[] | undefined, labels: Record<string, string>): NamedValue[] =>
  (items ?? []).map((i) => ({ ...i, name: labels[i.name] ?? i.name }));

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ReactNode;
  loading?: boolean;
}

export const StatCard = ({ title, value, hint, icon, loading }: StatCardProps) => (
  <Card className="bg-black/30 border-gray-800 text-white shadow-md">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-gray-300">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      {loading ? (
        <Skeleton className="h-8 w-28 bg-gray-700" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </CardContent>
  </Card>
);

interface SectionProps {
  title: string;
  loading?: boolean;
  height?: number;
  children: React.ReactNode;
  className?: string;
}

export const Section = ({ title, loading, height = 300, children, className }: SectionProps) => (
  <Card className={`bg-black/30 border-gray-800 text-white shadow-md overflow-hidden ${className ?? ''}`}>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {loading ? <Skeleton className="w-full bg-gray-700/30" style={{ height }} /> : children}
    </CardContent>
  </Card>
);

export const Empty = ({ text = 'Sem dados no período selecionado.' }: { text?: string }) => (
  <p className="text-sm text-gray-500 py-6 text-center">{text}</p>
);

// Horizontal bars, each scaled against the largest value in the list.
export const BarList = ({ items, color = '#9b87f5' }: { items: NamedValue[]; color?: string }) => {
  if (!items.length) return <Empty />;
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.name} className="flex items-center gap-3">
          <span className="text-sm text-gray-300 w-2/5 truncate" title={item.name}>
            {item.name}
          </span>
          <div className="flex-1 bg-gray-700 rounded-full h-2">
            <div className="h-2 rounded-full" style={{ width: `${(item.value / max) * 100}%`, background: color }} />
          </div>
          <span className="text-sm font-medium w-10 text-right">{fmt(item.value)}</span>
        </div>
      ))}
    </div>
  );
};

export const ErrorBanner = ({ error }: { error: unknown }) => (
  <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
    Não foi possível carregar as métricas: {error instanceof Error ? error.message : 'erro desconhecido'}.
    {error instanceof Error && error.message === 'forbidden' &&
      ' Faça login com o e-mail de administrador.'}
  </div>
);
