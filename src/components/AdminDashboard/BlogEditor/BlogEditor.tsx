import { useEffect, useState } from "react";
import { Editor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { useEditor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Quote,
  Undo,
  Redo,
  Save,
  Strikethrough,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface BlogEditorProps {
  initialData?: {
    id?: string;
    title: string;
    slug: string;
    summary: string;
    content: string;
    featured_image?: string;
    tags: string[];
  };
  onSave: (data: any) => Promise<void>;
}

export const BlogEditor = ({ initialData, onSave }: BlogEditorProps) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [summary, setSummary] = useState(initialData?.summary || "");
  const [saving, setSaving] = useState(false);
  const [featuredImage, setFeaturedImage] = useState(
    initialData?.featured_image
  );
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [isToolbarFloating, setIsToolbarFloating] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        paragraph: {
          HTMLAttributes: {
            class: "text-gray-300 leading-relaxed mb-4",
          },
        },
        bulletList: {
          HTMLAttributes: {
            class: "list-disc pl-6 my-4 text-gray-300 space-y-2",
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal pl-6 my-4 text-gray-300 space-y-2",
          },
        },
        listItem: {
          HTMLAttributes: {
            class: "pl-2 text-gray-300",
          },
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg max-w-full my-4",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class:
            "text-filmeja-purple hover:text-filmeja-purple/80 transition-colors",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
    ],
    content: initialData?.content || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none min-h-[400px] p-4 focus:outline-none",
      },
    },
  });

  const setLink = () => {
    if (linkUrl) {
      editor?.chain().focus().setLink({ href: linkUrl }).run();
    } else {
      editor?.chain().focus().unsetLink().run();
    }
    setShowLinkDialog(false);
    setLinkUrl("");
  };

  const handleImageUpload = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `blog/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from("blog-images")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Error uploading image:", uploadError);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("blog-images").getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSave = async (status: "draft" | "published") => {
    if (!editor || !title) return;

    setSaving(true);
    try {
      const content = editor.getHTML();
      await onSave({
        title,
        slug: title
          .toLowerCase()
          .replace(/[^\w\s]/g, "")
          .replace(/\s+/g, "-"),
        summary,
        content,
        featured_image: featuredImage,
        status,
      });
    } catch (error) {
      console.error("Error saving post:", error);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const editorElement = document.querySelector('.ProseMirror');
      if (editorElement) {
        const rect = editorElement.getBoundingClientRect();
        setIsToolbarFloating(rect.top < 0);
      }
    };
  
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {initialData?.id ? "Editar Post" : "Novo Post"}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave("draft")}
            disabled={saving}
          >
            Salvar Rascunho
          </Button>
          <Button
            onClick={() => handleSave("published")}
            disabled={saving}
            className="bg-filmeja-purple hover:bg-filmeja-purple/90"
          >
            <Save className="w-4 h-4 mr-2" />
            Publicar
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Título</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Digite o título do post..."
            className="bg-black/40"
          />
        </div>

        <div>
          <Label>Resumo</Label>
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Digite um breve resumo..."
            className="bg-black/40"
          />
        </div>

        <div>
          <Label>Imagem Destaque</Label>
          <div className="flex gap-2 items-center">
            <Input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = await handleImageUpload(file);
                  setFeaturedImage(url);
                }
              }}
              className="bg-black/40"
            />
            {featuredImage && (
              <img
                src={featuredImage}
                alt="Preview"
                className="w-20 h-20 object-cover rounded"
              />
            )}
          </div>
        </div>

        <div className={`border border-white/10 rounded-lg overflow-hidden relative ${isToolbarFloating ? 'pt-16' : ''}`}>
  <div className={`bg-black/40 p-2 flex gap-2 flex-wrap border-b border-white/10
    ${isToolbarFloating ? 'fixed top-0 left-0 right-0 z-50 backdrop-blur-sm' : ''}`}>
            <div className="flex gap-1 items-center pr-2 border-r border-white/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  editor?.chain().focus().toggleHeading({ level: 1 }).run()
                }
                className={
                  editor?.isActive("heading", { level: 1 }) ? "bg-white/10" : ""
                }
                title="Heading 1"
              >
                <Heading1 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  editor?.chain().focus().toggleHeading({ level: 2 }).run()
                }
                className={
                  editor?.isActive("heading", { level: 2 }) ? "bg-white/10" : ""
                }
                title="Heading 2"
              >
                <Heading2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  editor?.chain().focus().toggleHeading({ level: 3 }).run()
                }
                className={
                  editor?.isActive("heading", { level: 3 }) ? "bg-white/10" : ""
                }
                title="Heading 3"
              >
                <Heading3 className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex gap-1 items-center px-2 border-r border-white/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLinkDialog(true)}
                className={editor?.isActive("link") ? "bg-white/10" : ""}
                title="Insert Link"
              >
                <LinkIcon className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex gap-1 items-center px-2 border-r border-white/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                className={editor?.isActive("bold") ? "bg-white/10" : ""}
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                className={editor?.isActive("italic") ? "bg-white/10" : ""}
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                className={editor?.isActive("underline") ? "bg-white/10" : ""}
                title="Underline"
              >
                <UnderlineIcon className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleStrike().run()}
                className={editor?.isActive("strike") ? "bg-white/10" : ""}
                title="Strikethrough"
              >
                <Strikethrough className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex gap-1 items-center px-2 border-r border-white/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  editor?.chain().focus().setTextAlign("left").run()
                }
                className={
                  editor?.isActive({ textAlign: "left" }) ? "bg-white/10" : ""
                }
                title="Align Left"
              >
                <AlignLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  editor?.chain().focus().setTextAlign("center").run()
                }
                className={
                  editor?.isActive({ textAlign: "center" }) ? "bg-white/10" : ""
                }
                title="Align Center"
              >
                <AlignCenter className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  editor?.chain().focus().setTextAlign("right").run()
                }
                className={
                  editor?.isActive({ textAlign: "right" }) ? "bg-white/10" : ""
                }
                title="Align Right"
              >
                <AlignRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex gap-1 items-center px-2 border-r border-white/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                className={editor?.isActive("bulletList") ? "bg-white/10" : ""}
                title="Bullet List"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  editor?.chain().focus().toggleOrderedList().run()
                }
                className={editor?.isActive("orderedList") ? "bg-white/10" : ""}
                title="Numbered List"
              >
                <ListOrdered className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex gap-1 items-center px-2 border-r border-white/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                className={editor?.isActive("codeBlock") ? "bg-white/10" : ""}
                title="Code Block"
              >
                <Code className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                className={editor?.isActive("blockquote") ? "bg-white/10" : ""}
                title="Quote"
              >
                <Quote className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex gap-1 items-center pl-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().undo().run()}
                title="Undo"
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().redo().run()}
                title="Redo"
              >
                <Redo className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <EditorContent editor={editor} className="min-h-[400px]" />
        </div>
      </div>

      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="bg-black/40"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
              Cancel
            </Button>
            <Button onClick={setLink}>
              {editor?.isActive("link") ? "Update Link" : "Insert Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
