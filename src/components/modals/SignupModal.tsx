import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { loginWithGoogle } from "@/lib/googleAuth";
import { translateAuthError } from "@/lib/errors/translateAuthError";
import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  signupName: string;
  setSignupName: (value: string) => void;
  signupEmail: string;
  setSignupEmail: (value: string) => void;
  signupPassword: string;
  setSignupPassword: (value: string) => void;
  signupError: string;
  isSigningUp: boolean;
}

export function SignupModal({
  isOpen,
  onClose,
  onSubmit,
  signupName,
  setSignupName,
  signupEmail,
  setSignupEmail,
  signupPassword,
  setSignupPassword,
  signupError,
  isSigningUp,
}: SignupModalProps) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
          await loginWithGoogle();

          // On the web this redirects away; on native the session is set
          // directly and the caller's auth listener picks it up.
        } catch (error) {
          toast({
            title: t('auth.toasts.genericErrorTitle'),
            description: translateAuthError(error, t('auth.toasts.googleErrorFallback')),
            variant: 'destructive',
          });
          setLoading(false);
        }
      };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-filmeja-dark to-black border-white/10 text-white max-w-md w-full p-0 overflow-hidden">
        <div className="relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-filmeja-purple/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-filmeja-blue/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

          <div className="p-6 relative z-10">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-filmeja-purple" />
                {t('auth.createAccountTitle')}
              </DialogTitle>
              <DialogDescription className="text-gray-300">
                {t('signupModal.description')}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={onSubmit} className="space-y-4">
            <Button
              variant="outline"
              className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10"
              onClick={handleGoogleLogin}
              type="button"
              disabled={loading}
            >
              <img src="/google.png" alt="Google" className="w-5 h-5 mr-2" />
              {t('auth.continueWithGoogle')}
            </Button>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-200">
                  {t('signupModal.nameLabel')}
                </Label>
                <Input
                  id="name"
                  placeholder={t('signupModal.namePlaceholder')}
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-200">
                  {t('signupModal.emailLabel')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('signupModal.emailPlaceholder')}
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-200">
                  {t('signupModal.passwordLabel')}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('signupModal.passwordPlaceholder')}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                />
              </div>

              {signupError && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-md text-sm text-red-200">
                  {signupError}
                </div>
              )}

              <Button
                type="submit"
                disabled={isSigningUp}
                className="w-full bg-gradient-to-r from-filmeja-purple to-filmeja-blue hover:opacity-90 transition-all py-2 h-11"
              >
                {isSigningUp ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {t('signupModal.creatingAccount')}
                  </div>
                ) : (
                  t('sidebar.signupDialog.createAccountCta')
                )}
              </Button>

              <div className="text-center text-sm text-gray-400 mt-4">
                <Trans
                  i18nKey="signupModal.termsAgreement"
                  components={{
                    terms: (
                      <a
                        href="https://filmesja.com.br/termos"
                        target="_blank"
                        rel="noreferrer"
                        className="text-filmeja-purple hover:underline"
                      />
                    ),
                    privacy: (
                      <a
                        href="https://filmesja.com.br/privacidade"
                        target="_blank"
                        rel="noreferrer"
                        className="text-filmeja-purple hover:underline"
                      />
                    ),
                  }}
                />
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}