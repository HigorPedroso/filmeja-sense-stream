import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  featured_image?: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  author: {
    email: string;
    user_metadata: {
      full_name?: string;
      avatar_url?: string;
    };
  };
}

interface BlogPostsPanelProps {
  data?: {
    total: number;
    posts: BlogPost[];
    published: number;
    draft: number;
  };
  isLoading: boolean;
}

export const BlogPostsPanel = ({ data, isLoading }: BlogPostsPanelProps) => {
  const { toast } = useToast();

  const handleDelete = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível excluir o post",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Post excluído com sucesso",
        });
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir o post",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Carregando...</div>;
  }

  if (!data?.posts || data.posts.length === 0) {
    return <div className="flex items-center justify-center p-8">Nenhum post encontrado</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Blog Posts</h2>
          <p className="text-gray-400">
            {data.published} publicados • {data.draft} rascunhos
          </p>
        </div>
        <Link to="/super/blog/new">
          <Button className="bg-filmeja-purple hover:bg-filmeja-purple/90">
            <Plus className="w-4 h-4 mr-2" />
            Novo Post
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {data.posts.map((post) => (
          <Card key={post.id} className="bg-black/40 border-white/10">
            <CardContent className="flex items-center p-4">
              {post.featured_image && (
                <img 
                  src={post.featured_image} 
                  alt={post.title}
                  className="w-24 h-16 object-cover rounded-lg mr-4"
                />
              )}
              
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{post.title}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>{post.profiles?.email || 'Unknown'}</span>
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(new Date(post.created_at), {
                      addSuffix: true,
                      locale: ptBR
                    })}
                  </span>
                  <span>•</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    post.status === 'published' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {post.status === 'published' ? 'Publicado' : 'Rascunho'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link to={`/blog/${post.slug}`} target="_blank">
                  <Button variant="ghost" size="icon">
                    <Eye className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to={`/super/blog/edit/${post.id}`}>
                  <Button variant="ghost" size="icon">
                    <Edit className="w-4 h-4" />
                  </Button>
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-black/95 border border-white/10">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-xl text-white">
                        Excluir Post
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-400">
                        Tem certeza que deseja excluir o post <span className="font-semibold text-white">"{post.title}"</span>? 
                        <br />Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-transparent border border-white/20 hover:bg-white/5">
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDelete(post.id)}
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        Excluir Post
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};