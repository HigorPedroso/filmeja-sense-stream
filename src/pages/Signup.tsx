
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import VideoBackground from '@/components/VideoBackground';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Signup = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
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
          description: 'Redirecionando para a dashboard...',
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
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard',
        },
      });

      if (error) throw error;
    } catch (error) {
      toast({
        title: 'Erro!',
        description: error.message || 'Ocorreu um erro ao conectar com Google.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    <>
    <div className="min-h-screen bg-filmeja-dark relative">
      <VideoBackground />
      <Navbar transparent />
      
      <div className="container mx-auto min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-8">
          <h1 className="text-2xl font-bold text-white mb-2 text-center">
            {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
          </h1>
          
          <p className="text-gray-300 text-center mb-6">
            {isLogin 
              ? 'Entre para continuar sua jornada cinematográfica' 
              : 'Comece sua jornada por apenas R$9,99/mês'}
          </p>
          
          <form onSubmit={handleAuthentication} className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10"
              onClick={handleGoogleLogin}
              type="button"
              disabled={loading}
            >
              <img src="/google.svg" alt="Google" className="w-5 h-5 mr-2" />
              Continuar com Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-filmeja-dark px-2 text-gray-400">ou continue com email</span>
              </div>
            </div>

            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nome completo"
                  className="pl-10 bg-white/5 border-white/10 text-white"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                  disabled={loading}
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="email"
                placeholder="Email"
                className="pl-10 bg-white/5 border-white/10 text-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="password"
                placeholder="Senha"
                className="pl-10 bg-white/5 border-white/10 text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button 
              className="w-full bg-filmeja-purple hover:bg-filmeja-purple/90 text-white"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>

          <div className="text-center mt-6">
            <p className="text-gray-400">
              {isLogin ? 'Ainda não tem uma conta?' : 'Já tem uma conta?'}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-filmeja-purple hover:underline ml-2"
                type="button"
                disabled={loading}
              >
                {isLogin ? 'Criar conta' : 'Fazer login'}
              </button>
            </p>
          </div>
          
          <p className="text-xs text-gray-400 text-center mt-6">
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
    </div>
    </>
  );
};

export default Signup;
