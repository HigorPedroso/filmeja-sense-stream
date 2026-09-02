import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { deleteAccount } from "@/lib/account/deleteAccount";
import { translateAuthError } from "@/lib/errors/translateAuthError";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Public, standalone account-deletion page — required by the Google Play
// Data Safety policy as a web resource that lets a user request deletion
// of their account/data without needing the app installed. Login here is
// the same Supabase auth used by the app; it does not require the app.
const DeleteAccountRequest = () => {
  const { session, user, isLoading } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Erro ao entrar",
        description: translateAuthError(error, "Verifique seu e-mail e senha e tente novamente."),
        variant: "destructive",
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      setIsDeleted(true);
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Erro ao excluir conta",
        description: "Não foi possível excluir sua conta agora. Tente novamente ou entre em contato conosco.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] relative bg-filmeja-dark overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -left-16 w-72 h-72 bg-filmeja-purple/25 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-20 w-80 h-80 bg-filmeja-blue/20 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 w-64 h-64 bg-filmeja-purple-dark/20 rounded-full blur-3xl" />

      <div className="relative z-10 min-h-[100dvh] flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm flex flex-col items-center mb-8">
          <img src="/icone.png" alt="FilmeJá" className="w-14 h-14 rounded-2xl shadow-lg shadow-filmeja-purple/30 mb-4" />
          <h1 className="text-xl font-bold text-white text-center">
            <span className="text-filmeja-purple">Filme</span>Já
          </h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-6"
        >
          <h2 className="text-lg font-bold text-white text-center mb-1 flex items-center justify-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            Excluir conta
          </h2>

          {isDeleted ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-white font-medium mb-2">Conta excluída com sucesso</p>
              <p className="text-sm text-gray-400">
                Sua conta e todos os seus dados foram removidos permanentemente do FilmeJá.
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-filmeja-purple" />
            </div>
          ) : session && user ? (
            <div className="pt-2">
              <p className="text-sm text-gray-400 text-center mb-1">Conta conectada:</p>
              <p className="text-sm text-white text-center font-medium mb-6">{user.email}</p>

              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                Ao confirmar, seu perfil, preferências, histórico de recomendações, favoritos,
                token de notificações e assinatura serão excluídos permanentemente. Essa ação
                não pode ser desfeita.
              </p>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold">
                    Excluir minha conta
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-filmeja-dark border-white/10">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                      Essa ação é permanente e não pode ser desfeita. Todos os seus dados serão excluídos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {isDeleting ? "Excluindo..." : "Excluir permanentemente"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-400 text-center mb-6">
                Entre com sua conta FilmeJá para solicitar a exclusão permanente dos seus dados.
              </p>
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="Email"
                    className="h-12 pl-10 rounded-xl bg-white/5 border-white/10 text-white"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loginLoading}
                    autoComplete="email"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Senha"
                    className="h-12 pl-10 pr-10 rounded-xl bg-white/5 border-white/10 text-white"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loginLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  className="w-full h-12 rounded-xl bg-filmeja-purple hover:bg-filmeja-purple/90 text-white font-semibold mt-2"
                  type="submit"
                  disabled={loginLoading}
                >
                  {loginLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Entrar"}
                </Button>
              </form>
            </>
          )}
        </motion.div>

        <p className="text-xs text-gray-500 text-center mt-6 max-w-sm">
          Prefere não usar esta página? Envie um e-mail para{" "}
          <a href="mailto:privacidade@filmeja.com" className="text-filmeja-purple hover:underline">
            privacidade@filmeja.com
          </a>{" "}
          solicitando a exclusão da sua conta. Veja também nossa{" "}
          <Link to="/privacidade" className="text-filmeja-purple hover:underline">
            Política de Privacidade
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

export default DeleteAccountRequest;
