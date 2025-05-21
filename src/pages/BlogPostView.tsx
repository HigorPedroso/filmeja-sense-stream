import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  Share2,
  BookmarkPlus,
  Clock,
  Eye,
  Facebook,
  Twitter,
  Link as LinkIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const BlogPostView = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;

      const formattedData = {
        ...data,
        author: {
          name: "Filmeja Team",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=filmeja",
          role: "Editor de Conteúdo",
        },
        tags: data.tags || ["10", "20"], // Add default empty array if tags is null
      };

      // Fetch related posts
      const { data: relatedPosts } = await supabase
        .from("blog_posts")
        .select("id, title, slug, featured_image")
        .neq("id", data.id)
        .limit(2);

      setPost({
        ...formattedData,
        related_posts: relatedPosts || [],
      });
    } catch (error) {
      console.error("Error fetching post:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  const handleShare = async (platform: string) => {
    const url = window.location.href;
    const text = `Confira: ${post.title}`;

    switch (platform) {
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${url}`,
          "_blank"
        );
        break;
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
          "_blank"
        );
        break;
      case "linkedin":
        window.open(
          `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${text}`,
          "_blank"
        );
        break;
      case "copy":
        await navigator.clipboard.writeText(url);
        // Add toast notification here
        break;
    }
  };

  // Update the return JSX to handle null post
  if (!post && !loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl">Post não encontrado</h1>
      </div>
    );
  }

  // Update references to post data to handle optional chaining
  return (
    <div className="min-h-screen bg-filmeja-dark text-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-filmeja-dark/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-filmeja-purple hover:text-filmeja-purple/80"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar ao Blog</span>
          </Link>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleShare("facebook")}>
                  <Facebook className="w-4 h-4 mr-2" /> Facebook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare("twitter")}>
                  <Twitter className="w-4 h-4 mr-2" /> Twitter
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare("copy")}>
                  <LinkIcon className="w-4 h-4 mr-2" /> Copiar Link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="pt-16" // Add padding for fixed nav
      >
        {/* Hero Section */}
        <div
          className="h-[60vh] relative bg-cover bg-center"
          style={{ backgroundImage: `url(${post?.featured_image})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-filmeja-dark to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="max-w-4xl mx-auto">
              <motion.h1
                className="text-4xl md:text-5xl font-bold mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {post.title}
              </motion.h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={post.author.avatar} />
                    <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{post.author.name}</div>
                    <div className="text-xs text-gray-400">
                      {post.author.role}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {post.reading_time} min leitura
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {post.views_count} visualizações
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section with improvements */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 rounded-lg p-6 mb-8 border border-white/10"
          >
            <p className="text-lg text-gray-300">{post.summary}</p>
          </motion.div>

          {/* Main Content */}
          <div className="flex gap-8">
            <div className="hidden md:block">
              <div className="sticky top-4 space-y-4">
                {post.tags?.length > 0 &&
                  post.tags.map((tag) => (
                    <Button
                      key={tag}
                      variant="ghost"
                      className="block w-full text-left"
                    >
                      #{tag}
                    </Button>
                  ))}
              </div>
            </div>

            <article className="flex-1">
              <div
                className="prose prose-invert prose-lg max-w-none
                  [&>*]:text-gray-300
                  [&>h1]:text-5xl [&>h1]:font-black [&>h1]:text-white
                  [&>h2]:text-4xl [&>h2]:font-bold [&>h2]:text-filmeja-purple
                  [&>h3]:text-2xl [&>h3]:font-semibold [&>h3]:text-gray-200
                  
                  [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:my-4
                  [&>ul>li]:text-gray-300 [&>ul>li]:marker:text-filmeja-purple
                  
                  [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:my-4
                  [&>ol>li]:text-gray-300 [&>ol>li]:marker:text-filmeja-purple
                  
                  [&>blockquote]:border-l-4 [&>blockquote]:border-filmeja-purple
                  [&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:bg-white/5
                  
                  [&>p]:leading-relaxed [&>p]:mb-4
                  
                  [&>a]:text-filmeja-purple [&>a]:no-underline
                  [&>a:hover]:text-filmeja-purple/80
                  
                  [&>code]:bg-white/10 [&>code]:text-filmeja-purple
                  [&>code]:px-2 [&>code]:py-1 [&>code]:rounded-md
                  
                  [&>pre]:bg-white/5 [&>pre]:p-4 [&>pre]:rounded-lg
                  
                  [&>img]:rounded-lg [&>img]:my-6 [&>img]:shadow-lg"
                dangerouslySetInnerHTML={{
                  __html: post.content || "",
                }}
              />
            </article>
          </div>

          {/* Related Posts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16"
          >
            <h2 className="text-2xl font-bold mb-6">Posts Relacionados</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {post.related_posts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  to={`/blog/${relatedPost.slug}`}
                  className="group relative overflow-hidden rounded-lg aspect-video"
                >
                  <img
                    src={relatedPost.featured_image}
                    alt={relatedPost.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                    <h3 className="text-lg font-semibold group-hover:text-filmeja-purple transition-colors">
                      {relatedPost.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
