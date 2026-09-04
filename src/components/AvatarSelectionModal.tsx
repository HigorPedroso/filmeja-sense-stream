import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface AvatarSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAvatarSelect: (avatarUrl: string) => void;
  currentAvatar?: string;
}

const AvatarSelectionModal = ({ isOpen, onClose, onAvatarSelect, currentAvatar }: AvatarSelectionModalProps) => {
  const { t } = useTranslation();
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const avatarStyles = [
    "avataaars", "bottts", "pixel-art", "lorelei", "adventurer",
    "big-ears", "micah", "miniavs", "personas"
  ];

  const handleAvatarSelect = async (style: string) => {
    setLoading(true);
    const seed = Math.random().toString(36).substring(7);
    const newAvatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: newAvatarUrl }
      });

      if (error) throw error;

      onAvatarSelect(newAvatarUrl);
      toast({
        title: t("avatarModal.toasts.updated.title"),
        description: t("avatarModal.toasts.updated.description"),
      });
      onClose();
    } catch (error) {
      toast({
        title: t("avatarModal.toasts.error.title"),
        description: t("avatarModal.toasts.error.description"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-black/90 border-white/10 text-white">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-center">{t("avatarModal.title")}</h2>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
            {avatarStyles.map((style) => (
              <motion.div
                key={style}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative cursor-pointer rounded-lg p-4 bg-filmeja-purple/10 
                  hover:bg-filmeja-purple/20 transition-all duration-300
                  ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                onClick={() => handleAvatarSelect(style)}
              >
                <img
                  src={`https://api.dicebear.com/7.x/${style}/svg?seed=${style}`}
                  alt={`Avatar style ${style}`}
                  className="w-full h-auto rounded-lg"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <span className="bg-black/80 px-3 py-1 rounded-full text-sm">
                    {t("avatarModal.select")}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarSelectionModal;