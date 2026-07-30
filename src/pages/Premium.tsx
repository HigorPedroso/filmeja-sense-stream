import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { PremiumPaywallContent } from "@/components/Premium/PremiumPaywallContent";

const Premium = () => {
  const navigate = useNavigate();

  return (
    <div
      className="h-[100dvh] bg-filmeja-dark flex flex-col overflow-hidden"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex items-center px-4 py-3 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-300 hover:text-white p-1 -ml-1 flex items-center gap-1"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">Voltar</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <PremiumPaywallContent onClose={() => navigate(-1)} />
      </div>
    </div>
  );
};

export default Premium;
