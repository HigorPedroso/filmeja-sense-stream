
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Loader2, ChevronLeft, Apple } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { loginWithGoogle } from '@/lib/googleAuth';
import { loginWithApple } from '@/lib/appleAuth';
import { Capacitor } from '@capacitor/core';
import { cn } from '@/lib/utils';

const isNative = Capacitor.isNativePlatform();
// Apple only requires offering Sign in with Apple on iOS (App Store review
// guideline 4.8) — the plugin's Android support needs a server redirect
// flow we don't have set up, so keep this iOS-only.
const isIOS = Capacitor.getPlatform() === 'ios';

const Signup = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [session, setSession] = useState(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) navigate('/dashboard');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) navigate('/dashboard');
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuthentication = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Login with email and password
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: 'Login bem-sucedido!',
          description: 'Redirecionando para a dashboard...',
        });
      } else {
        // Sign up with email and password
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        toast({
          title: 'Conta criada com sucesso!',
          description: 'Verifique seu email e confirme sua conta...',
        });
      }

      // The redirect will happen automatically via onAuthStateChange
    } catch (error) {
      toast({
        title: 'Erro!',
        description: error.message || 'Ocorreu um erro durante a autenticação.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();

      // On the web this redirects away; on native the session is set directly
      // and the onAuthStateChange effect above navigates to /dashboard.
    } catch (error) {
      toast({
        title: 'Erro!',
        description: error.message || 'Ocorreu um erro ao conectar com Google.',
        variant: 'destructive',
      });
      setGoogleLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setAppleLoading(true);
    try {
      await loginWithApple();
      // The session is set directly and the onAuthStateChange effect above
      // navigates to /dashboard.
    } catch (error) {
      toast({
        title: 'Erro!',
        description: error.message || 'Ocorreu um erro ao conectar com a Apple.',
        variant: 'destructive',
      });
      setAppleLoading(false);
    }
  };

  const busy = loading || googleLoading || appleLoading;

  return (
    <div className="min-h-[100dvh] relative bg-filmeja-dark overflow-hidden">
      {/* Decorative glow orbs */}
      <div className="pointer-events-none absolute -top-24 -left-16 w-72 h-72 bg-filmeja-purple/25 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-20 w-80 h-80 bg-filmeja-blue/20 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 w-64 h-64 bg-filmeja-purple-dark/20 rounded-full blur-3xl" />

      {!isNative && (
        <Link
          to="/"
          className="absolute top-[max(1rem,env(safe-area-inset-top))] left-4 z-10 inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar ao site
        </Link>
      )}

      <div
        className="relative z-0 min-h-[100dvh] flex flex-col items-center justify-center px-5 py-10"
        style={{
          paddingTop: 'max(2.5rem, env(safe-area-inset-top))',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        }}
      >
        <div className="w-full max-w-sm flex flex-col items-center mb-8">
          <img
            src="/icone_novo.png"
            alt="FilmeJá"
            className="w-14 h-14 rounded-2xl shadow-lg shadow-filmeja-purple/30 mb-4"
          />
          <h1 className="text-xl font-bold text-white text-center">
            <span className="text-filmeja-purple">Filme</span>Já
          </h1>
        </div>

        <div className="w-full max-w-sm bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-6">
          {/* Segmented tabs */}
          <div className="grid grid-cols-2 gap-1 bg-black/30 rounded-xl p-1 mb-6">
            <button
              type="button"
              disabled={busy}
              onClick={() => setIsLogin(true)}
              className={cn(
                'py-2 rounded-lg text-sm font-semibold transition-colors',
                isLogin ? 'bg-filmeja-purple text-white shadow' : 'text-gray-400 hover:text-white'
              )}
            >
              Entrar
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setIsLogin(false)}
              className={cn(
                'py-2 rounded-lg text-sm font-semibold transition-colors',
                !isLogin ? 'bg-filmeja-purple text-white shadow' : 'text-gray-400 hover:text-white'
              )}
            >
              Criar conta
            </button>
          </div>

          <h2 className="text-lg font-bold text-white text-center mb-1">
            {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
          </h2>
          <p className="text-sm text-gray-400 text-center mb-6">
            {isLogin
              ? 'Entre para continuar sua jornada cinematográfica'
              : 'Comece sua jornada por apenas R$9,99/mês'}
          </p>

          <Button
            variant="outline"
            className="w-full h-12 rounded-xl bg-white text-gray-900 border-transparent hover:bg-gray-100 font-medium"
            onClick={handleGoogleLogin}
            type="button"
            disabled={busy}
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <img src="/google.png" alt="" className="w-5 h-5 mr-2" />
            )}
            Continuar com Google
          </Button>

          {isIOS && (
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl bg-black text-white border-transparent hover:bg-black/80 font-medium mt-3"
              onClick={handleAppleLogin}
              type="button"
              disabled={busy}
            >
              {appleLoading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Apple className="w-5 h-5 mr-2 fill-white" />
              )}
              Continuar com Apple
            </Button>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#17131f] px-2 text-gray-500">ou continue com email</span>
            </div>
          </div>

          <form onSubmit={handleAuthentication} className="space-y-3">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nome completo"
                  className="h-12 pl-10 rounded-xl bg-white/5 border-white/10 text-white"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                  disabled={busy}
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="email"
                placeholder="Email"
                className="h-12 pl-10 rounded-xl bg-white/5 border-white/10 text-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={busy}
                autoComplete="email"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Senha"
                className="h-12 pl-10 pr-10 rounded-xl bg-white/5 border-white/10 text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={busy}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
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
              disabled={busy}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isLogin ? (
                'Entrar'
              ) : (
                'Criar conta'
              )}
            </Button>
          </form>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6 max-w-sm">
          Ao continuar, você concorda com nossos{' '}
          <Link to="/termos" className="text-filmeja-purple hover:underline">
            Termos de Uso
          </Link>{' '}
          e{' '}
          <Link to="/privacidade" className="text-filmeja-purple hover:underline">
            Política de Privacidade
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

export default Signup;
