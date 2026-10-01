import React, { useState } from 'react';
import { Lock, Mail, ShieldAlert, ArrowLeft, KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { verifyAdminLogin, DEFAULT_ADMIN, getAdminCredentials, isSuperAdminEmail } from '../utils/storeManager';
import { signInWithGoogle } from '../supabase';

interface Props {
  onBackToApp: () => void;
  onLoginSuccess: () => void;
}

export const SuperAdminLoginView: React.FC<Props> = ({ onBackToApp, onLoginSuccess }) => {
  // Empty fields by default - clean inputs for real test
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    setTimeout(() => {
      const isValid = verifyAdminLogin(email, password);
      if (isValid) {
        onLoginSuccess();
      } else {
        setErrorMsg('E-mail ou senha de Super Admin inválidos. Digite seu e-mail cadastrado ou faça login com o Google.');
        setIsLoading(false);
      }
    }, 300);
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
      // O Supabase redireciona para o Google e retorna autenticado
    } catch (err: unknown) {
      console.error('Google login error:', err);
      const message = err instanceof Error ? err.message : 'Falha na autenticação';
      setErrorMsg(`Erro ao conectar com o Google: ${message}`);
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 min-h-screen bg-neutral-950 text-white selection:bg-amber-400 selection:text-neutral-950">
      <div className="max-w-md w-full space-y-6">
        {/* Back link */}
        <button
          onClick={onBackToApp}
          className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 text-neutral-500 group-hover:-translate-x-0.5 transition-transform" />
          <span>Voltar ao Login de Lojistas</span>
        </button>

        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-400 text-neutral-950 shadow-lg font-black text-2xl font-mono-num">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Painel Super Admin
          </h1>
          <p className="text-xs text-neutral-400">
            Acesso master para gestão de lojistas, planos e faturamento mensal
          </p>
        </div>

        {/* Authorized Super Admin Account Badge */}
        <div className="p-4 bg-neutral-900 border-2 border-amber-500/40 rounded-2xl text-xs space-y-2.5 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-amber-400">
              <KeyRound className="w-4 h-4" />
              <span>Super Admin Autorizado:</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-400/20 text-amber-300 rounded-full border border-amber-400/30">
              Master
            </span>
          </div>
          <div className="text-[11px] font-mono-num bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400 text-[11px]">E-mail Google Master:</span>
              <span className="text-amber-300 font-bold select-all text-xs">icaroetatiana@gmail.com</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-neutral-900">
              <span className="text-neutral-500 text-[10px]">Senha backup padrão:</span>
              <span className="text-neutral-300 font-mono text-[11px]">CotaFacil@Admin2026</span>
            </div>
          </div>
          <p className="text-[11px] text-neutral-400 leading-tight">
            Clique no botão do Google abaixo para login direto com 1 clique ou digite os dados nos campos com bordas destacadas.
          </p>
        </div>

        {/* Botão de Login com Google direto (Requisito Principal do Usuário) */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
          className="w-full py-3.5 px-4 bg-white hover:bg-neutral-100 active:scale-[0.99] text-neutral-900 font-bold rounded-2xl text-xs shadow-lg border-2 border-neutral-200 transition-all flex items-center justify-center gap-3 cursor-pointer group"
        >
          {isGoogleLoading ? (
            <div className="w-4 h-4 border-2 border-neutral-900/30 border-t-neutral-900 rounded-full animate-spin" />
          ) : (
            <>
              {/* Google G Official Colored Logo */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Entrar com Google (icaroetatiana@gmail.com)</span>
            </>
          )}
        </button>

        {/* Separador Visual */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-neutral-800" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            ou digite suas credenciais
          </span>
          <div className="flex-1 h-px bg-neutral-800" />
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-950/80 border-2 border-rose-700 rounded-xl text-xs text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form with high-contrast highlighted borders around inputs */}
        <form onSubmit={handleSubmit} className="space-y-4 bg-neutral-900/90 border border-neutral-800 p-6 rounded-3xl shadow-xl">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-neutral-200 uppercase tracking-wider flex items-center justify-between">
              <span>E-mail do Administrador</span>
              <span className="text-[10px] text-amber-400 lowercase font-mono">campo obrigatório</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Digite seu e-mail (ex: icaroetatiana@gmail.com)"
                className="w-full pl-10 pr-3.5 py-3 bg-neutral-950 border-2 border-neutral-600 hover:border-neutral-500 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-hidden transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-neutral-200 uppercase tracking-wider flex items-center justify-between">
              <span>Senha de Acesso</span>
              <span className="text-[10px] text-amber-400 lowercase font-mono">campo obrigatório</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Digite sua senha de acesso"
                className="w-full pl-10 pr-10 py-3 bg-neutral-950 border-2 border-neutral-600 hover:border-neutral-500 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-hidden transition-all font-mono shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1 cursor-pointer"
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-neutral-950 font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-neutral-900/30 border-t-neutral-900 rounded-full animate-spin" />
            ) : (
              <>
                <ShieldAlert className="w-4 h-4" />
                <span>Entrar no Painel Super Admin</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center text-[11px] text-neutral-500">
          CotaFácil B2B • Módulo Administrativo Seguro & Gestão SaaS
        </div>
      </div>
    </div>
  );
};
