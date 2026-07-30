import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { BlogEditor } from '@/components/AdminDashboard/BlogEditor/BlogEditor';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Helmet } from 'react-helmet';

export const BlogPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchCategories();
    if (id) {
      fetchPost();
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('blog_categories')
      .select('*')
      .order('name');

    if (!error && data) {
      setCategories(data);
    }
  };

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o post',
        variant: 'destructive',
      });
      navigate('/super/blog');
    } else {
      setPost(data);
    }
    setLoading(false);
  };

  const handleSave = async (postData: any) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar logado para salvar posts',
          variant: 'destructive',
        });
        return;
      }
  
      if (user.email !== 'higor533@gmail.com') {
        toast({
          title: 'Erro',
          description: 'Você não tem permissão para salvar posts',
          variant: 'destructive',
        });
        return;
      }
  
      // Format the content to ensure proper HTML structure
      const formattedContent = postData.content
        .replace(/<p><br><\/p>/g, '<br />') // Replace empty paragraphs with line breaks
        .replace(/\n(?![<])/g, '<br />') // Convert newlines to <br /> if not followed by HTML tag
        .replace(/\s{2,}/g, ' ') // Normalize multiple spaces to single space
        .trim();
  
      // Save the blog post with formatted content
      const { error } = await supabase
        .from('blog_posts')
        .upsert({
          ...postData,
          content: formattedContent,
          id: id || undefined,
          author_id: user.id,
          category_id: post.category_id,
          meta_description: post.meta_description,
          updated_at: new Date().toISOString()
        });
  
      if (error) {
        console.error('Save error:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível salvar o post',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Sucesso',
          description: 'Post salvo com sucesso',
        });
        navigate('/super');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="p-6 md:p-8">
      <Helmet>
        <link rel="amphtml" href={`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/amp-story/${post.slug}`} />
      </Helmet>
      <div className="space-y-6 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Categoria
          </label>
          <Select
            value={post?.category_id || ''}
            onValueChange={(value) => setPost({ ...post, category_id: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Meta Description
          </label>
          <Input
            placeholder="Digite a meta description do post"
            value={post?.meta_description || ''}
            onChange={(e) => setPost({ ...post, meta_description: e.target.value })}
            className="w-full"
          />
        </div>
      </div>

      <BlogEditor 
        initialData={post} 
        onSave={handleSave}
      />

      {/* Botão para o Web Story */}
      <Link 
        to={`/stories/${post.slug}`}
        className="inline-flex items-center gap-2 bg-filmeja-primary text-white px-4 py-2 rounded-full font-medium"
      >
        <span>Ver Web Story</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg>
      </Link>
    </div>
  );
};