import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  featured_image: string;
  tags?: string[];
  category: string;
  created_at: string;
  status: "published" | "draft";
}

interface Category {
  id: string;
  name: string;
}

export default function BlogPage() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Add categories query
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["blog-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_categories")
        .select("id, name")
        .order("name");

      if (error) throw error;
      return (data as Category[]) || [];
    },
  });

  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: allTags } = useQuery<string[]>({
    queryKey: ["blog-tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("tags")
        .eq("status", "published");

      if (error) throw error;
      const tags = data
        .filter((post) => post.tags != null)
        .flatMap((post) => post.tags || []);
      return Array.from(new Set(tags));
    },
  });

  // Update filtered posts to include category filtering
  const filteredPosts = posts?.filter((post) => {
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) => post.tags?.includes(tag));
    const matchesCategories =
      selectedCategories.length === 0 ||
      selectedCategories.includes(post.category_id); // Update to category_id
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTags && matchesCategories && matchesSearch;
  });

  // Add this in the search and filters section
  return (
    <div className="min-h-screen bg-filmeja-dark text-white">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-[50vh] md:h-[60vh] bg-gradient-to-br from-filmeja-purple via-purple-900 to-black overflow-hidden"
      >
        {/* Animated background elements */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 bg-[url('/images/film-pattern.png')] bg-repeat opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-filmeja-dark via-transparent to-transparent" />

        {/* Floating shapes */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute right-10 top-20 w-32 h-32 bg-filmeja-purple/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            y: [0, 20, 0],
            rotate: [0, -5, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute left-20 bottom-20 w-40 h-40 bg-purple-600/20 rounded-full blur-3xl"
        />

        {/* Content */}
        <div className="container mx-auto h-full flex items-center relative z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="mb-4 text-filmeja-purple font-medium tracking-wider"
            >
              BLOG
            </motion.div>
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300"
            >
              Blog FilmeJá
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-xl md:text-2xl text-gray-300 leading-relaxed max-w-2xl"
            >
              Descubra as últimas novidades sobre cinema, séries e
              entretenimento
            </motion.p>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-8 flex gap-4"
            >
              <Button
                size="lg"
                className="bg-filmeja-purple hover:bg-filmeja-purple/90"
              >
                Últimos Posts
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-filmeja-purple text-filmeja-purple hover:bg-filmeja-purple/10"
              >
                Explorar Categorias
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col md:flex-row gap-4 items-center mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black/40 w-full"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                Categorias <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {categories?.map((category: Category) => (
                <DropdownMenuCheckboxItem
                  key={category.id}
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={(checked) => {
                    setSelectedCategories((prev) =>
                      checked
                        ? [...prev, category.id]
                        : prev.filter((c) => c !== category.id)
                    );
                  }}
                >
                  {category.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex gap-2 flex-wrap">
            {allTags?.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer hover:bg-filmeja-purple/80"
                onClick={() =>
                  setSelectedTags((prev) =>
                    prev.includes(tag)
                      ? prev.filter((t) => t !== tag)
                      : [...prev, tag]
                  )
                }
              >
                {tag}
              </Badge>
            ))}
          </div>
        </motion.div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={`skeleton-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Skeleton className="h-64 w-full rounded-lg" />
                </motion.div>
              ))
            ) : filteredPosts?.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-full flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="w-24 h-24 mb-6 text-filmeja-purple/50">
                  <Search className="w-full h-full" />
                </div>
                <h3 className="text-2xl font-bold mb-2">
                  Nenhum post encontrado
                </h3>
                <p className="text-gray-400 mb-6 max-w-md">
                  {searchQuery ||
                  selectedTags.length ||
                  selectedCategories.length
                    ? "Não encontramos posts com os filtros selecionados. Tente ajustar sua busca."
                    : "Ainda não há posts publicados. Volte em breve para novidades!"}
                </p>
                {(searchQuery ||
                  selectedTags.length ||
                  selectedCategories.length) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedTags([]);
                      setSelectedCategories([]);
                    }}
                    className="border-filmeja-purple text-filmeja-purple hover:bg-filmeja-purple/10"
                  >
                    Limpar filtros
                  </Button>
                )}
              </motion.div>
            ) : (
              filteredPosts?.map((post, index) => (
                <motion.article
  key={post.id}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ delay: index * 0.1 }}
  className="group relative overflow-hidden rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300"
>
  <Link to={`/blog/${post.slug}`} className="block">
    <div className="aspect-video overflow-hidden">
      <img
        src={post.featured_image}
        alt={post.title}
        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
      />
    </div>
    <div className="p-6">
      <div className="flex items-center gap-2 mb-4">
        {post.tags?.map(tag => (
          <Badge key={tag} variant="secondary">{tag}</Badge>
        ))}
      </div>
      <h2 className="text-xl font-bold mb-2 group-hover:text-filmeja-purple transition-colors">
        {post.title}
      </h2>
      <p className="text-gray-400 mb-4 line-clamp-2">
        {post.summary}
      </p>
      <div className="flex items-center justify-end">
        <Button variant="ghost" size="sm">
          Ler mais <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  </Link>
</motion.article>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
