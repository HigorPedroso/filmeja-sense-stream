
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const RecentActivitiesPanel: React.FC = () => {
  // Query for recent users
  const { data: recentUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ['dashboard-recent-users'],
    queryFn: async () => {
      // In a real app, we would fetch from Supabase
      // const { data, error } = await supabase
      //   .from('profiles')
      //   .select('*')
      //   .order('created_at', { ascending: false })
      //   .limit(5);
      
      // if (error) throw error;
      // return data || [];
      
      // Mock data for now
      return [
        { id: '1', full_name: 'Ana Silva', created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
        { id: '2', full_name: 'Carlos Mendes', created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
        { id: '3', full_name: 'Maria Santos', created_at: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString() },
        { id: '4', full_name: 'João Pereira', created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() },
        { id: '5', full_name: 'Lucia Costa', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() }
      ];
    }
  });

  // Query for recent recommendations
  const { data: recentRecommendations, isLoading: loadingRecommendations } = useQuery({
    queryKey: ['dashboard-recent-recommendations'],
    queryFn: async () => {
      // Mock data for now
      return [
        { id: '1', title: 'Duna', user_name: 'Ana Silva', created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
        { id: '2', title: 'Oppenheimer', user_name: 'Carlos Mendes', created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
        { id: '3', title: 'Breaking Bad', user_name: 'Maria Santos', created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
        { id: '4', title: 'Stranger Things', user_name: 'João Pereira', created_at: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString() },
        { id: '5', title: 'O Poderoso Chefão', user_name: 'Lucia Costa', created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString() }
      ];
    }
  });

  // Query for recent feedback
  const { data: recentFeedback, isLoading: loadingFeedback } = useQuery({
    queryKey: ['dashboard-recent-feedback'],
    queryFn: async () => {
      // Mock data for now
      return [
        { 
          id: '1', 
          user_name: 'Ana Silva', 
          content: 'Adorei as recomendações! Exatamente o que eu estava procurando.', 
          rating: 5,
          created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString() 
        },
        { 
          id: '2', 
          user_name: 'Carlos Mendes', 
          content: 'Boas sugestões, mas algumas não são do meu gosto.', 
          rating: 4,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() 
        },
        { 
          id: '3', 
          user_name: 'Maria Santos', 
          content: 'O sistema recomendou filmes ótimos baseados nas minhas preferências!', 
          rating: 5,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString() 
        }
      ];
    }
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="bg-black/30 border-gray-800 text-white shadow-md">
        <CardHeader>
          <CardTitle>Usuários Recentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingUsers ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full bg-gray-700" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 bg-gray-700" />
                  <Skeleton className="h-3 w-24 bg-gray-700/50" />
                </div>
              </div>
            ))
          ) : (
            recentUsers?.map((user) => (
              <div key={user.id} className="flex items-center space-x-4">
                <Avatar>
                  <div className="flex h-full w-full items-center justify-center bg-filmeja-purple rounded-full">
                    {user.full_name.charAt(0)}
                  </div>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{user.full_name}</p>
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="bg-black/30 border-gray-800 text-white shadow-md">
        <CardHeader>
          <CardTitle>Recomendações Recentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingRecommendations ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-start space-x-4">
                <Skeleton className="h-10 w-10 rounded-md bg-gray-700" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4 bg-gray-700" />
                  <Skeleton className="h-3 w-1/2 bg-gray-700/50" />
                </div>
              </div>
            ))
          ) : (
            recentRecommendations?.map((rec) => (
              <div key={rec.id} className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded bg-filmeja-purple/20 flex items-center justify-center">
                  <span className="text-filmeja-purple text-lg">🎬</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{rec.title}</p>
                  <p className="text-xs text-gray-400">
                    {rec.user_name} · {formatDistanceToNow(new Date(rec.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="bg-black/30 border-gray-800 text-white shadow-md">
        <CardHeader>
          <CardTitle>Feedback Recente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingFeedback ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="space-y-2 pb-4 border-b border-gray-700 last:border-0">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-32 bg-gray-700" />
                  <Skeleton className="h-4 w-16 bg-gray-700" />
                </div>
                <Skeleton className="h-16 w-full bg-gray-700/50" />
              </div>
            ))
          ) : (
            recentFeedback?.map((feedback) => (
              <div key={feedback.id} className="space-y-2 pb-4 border-b border-gray-700 last:border-0">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">{feedback.user_name}</p>
                  <div className="flex">
                    {Array(5).fill(0).map((_, i) => (
                      <span 
                        key={i} 
                        className={`text-xs ${i < feedback.rating ? 'text-yellow-400' : 'text-gray-600'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-300">{feedback.content}</p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RecentActivitiesPanel;
