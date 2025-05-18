import { useAuth } from "@/hooks/useAuth";
import { User } from "@supabase/supabase-js";
import { useState } from "react";
import AvatarSelectionModal from "./AvatarSelectionModal";

const HeaderDashboard = () => {
  const { user } = useAuth();
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const randomAvatarId = Math.floor(Math.random() * 100);
  const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomAvatarId}`;

  if (!user) return null;

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    // The user metadata will be updated automatically through auth state change
    setIsAvatarModalOpen(false);
  };

  return (
    <>
      <header className="p-4 sticky top-0 z-10">
        <div className="flex justify-end items-center">
          <div className="flex items-center space-x-3">
            <span className="text-white text-sm md:text-base">
              {user.user_metadata?.name || user.email}
            </span>
            <div 
              className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden bg-filmeja-purple/10 
                cursor-pointer transform hover:scale-105 transition-all duration-300
                hover:ring-2 hover:ring-filmeja-purple hover:ring-offset-2 hover:ring-offset-filmeja-dark"
              onClick={() => setIsAvatarModalOpen(true)}
            >
              <img
                src={user.user_metadata?.avatar_url || defaultAvatar}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      <AvatarSelectionModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        onAvatarSelect={handleAvatarUpdate}
        currentAvatar={user.user_metadata?.avatar_url}
      />
    </>
  );
};

export default HeaderDashboard;