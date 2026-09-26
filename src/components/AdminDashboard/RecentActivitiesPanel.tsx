import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { useAdminActivity } from '@/hooks/useAdminDashboard';
import { Empty, ErrorBanner, Section, SOURCE_LABELS } from './shared';

const ago = (iso: string) => formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ptBR });

const REACTION: Record<string, { emoji: string; label: string }> = {
  title_liked: { emoji: '👍', label: 'curtiu' },
  title_disliked: { emoji: '👎', label: 'descurtiu' },
  title_saved: { emoji: '🔖', label: 'salvou' },
};

const Rows = () => (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <Skeleton key={i} className="h-10 w-full bg-gray-700/40" />
    ))}
  </div>
);

const RecentActivitiesPanel: React.FC = () => {
  const { data, isLoading, error } = useAdminActivity();

  if (error) return <ErrorBanner error={error} />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Section title="Usuários recentes">
        {isLoading ? (
          <Rows />
        ) : !data?.users.length ? (
          <Empty text="Nenhum usuário ainda." />
        ) : (
          <div className="space-y-4">
            {data.users.map((user) => (
              <div key={user.id} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-filmeja-purple font-medium">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{user.full_name}</p>
                  <p className="text-xs text-gray-400">{ago(user.created_at)}</p>
                </div>
                {user.is_premium && <Badge className="bg-yellow-500/20 text-yellow-400">Premium</Badge>}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Recomendações recentes">
        {isLoading ? (
          <Rows />
        ) : !data?.recommendations.length ? (
          <Empty text="Nenhuma recomendação ainda." />
        ) : (
          <div className="space-y-4">
            {data.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-filmeja-purple/20">🎬</div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{rec.title ?? 'Sem título'}</p>
                  <p className="text-xs text-gray-400">
                    {rec.user_name} · {SOURCE_LABELS[rec.source ?? 'desconhecido'] ?? rec.source} · {ago(rec.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Reações recentes">
        {isLoading ? (
          <Rows />
        ) : !data?.reactions.length ? (
          <Empty text="Nenhuma reação ainda." />
        ) : (
          <div className="space-y-4">
            {data.reactions.map((r, i) => {
              const meta = REACTION[r.event_type] ?? { emoji: '•', label: r.event_type };
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-white/5 text-lg">
                    {meta.emoji}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.title ?? 'Sem título'}</p>
                    <p className="text-xs text-gray-400">
                      {r.user_name} {meta.label} · {ago(r.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
};

export default RecentActivitiesPanel;
