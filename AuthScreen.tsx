import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Mail,
  Lock,
  User,
  MapPin,
  Camera,
  Upload,
  Globe,
  LockKeyhole,
  Phone,
  CheckCircle,
  Sparkles,
  CheckCircle2,
  Building2,
  Store,
  QrCode,
  TrendingDown,
} from 'lucide-react';
import { Usuario } from '../types';
import { USUARIO_PADRAO } from '../data/mockData';
import { signInWithGoogle, registerWithEmail, loginWithEmail } from '../lib/firebase';

interface AuthScreenProps {
  onSuccess: (usuario: Usuario) => void;
  theme?: 'dark' | 'light';
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess, theme = 'dark' }) => {
  const isDark = theme === 'dark';
  const [currentScreen, setCurrentScreen] = useState<'login' | 'register' | 'quick'>('login');

  // Register state
  const [regNome, setRegNome] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regSenha, setRegSenha] = useState('');
  const [regTelefone, setRegTelefone] = useState('');
  const [regCidade, setRegCidade] = useState('Araraquara');
  const [regBairro, setRegBairro] = useState('Centro');
  const [regAvatar, setRegAvatar] = useState('');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginSenha, setLoginSenha] = useState('');

  // Quick / SMS state
  const [telefone, setTelefone] = useState('');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [otpCode, setOtpCode] = useState(['5', '4', '8', '2', '9', '0']);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const switchPage = (page: 'login' | 'register' | 'quick') => {
    setErrorMessage(null);
    setCurrentScreen(page);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Por favor escolha uma imagem de até 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setRegAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNome.trim() || !regEmail.trim() || !regSenha.trim()) {
      setErrorMessage('Por favor, preencha nome, e-mail e senha.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const user = await registerWithEmail(
        regNome.trim(),
        regEmail.trim(),
        regSenha,
        regTelefone.trim() || '(16) 99782-4102',
        regCidade.trim() || 'Araraquara',
        regBairro.trim() || 'Centro',
        regAvatar || undefined
      );
      onSuccess(user);
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err?.code === 'auth/email-already-in-use') {
        setErrorMessage('Este e-mail já está cadastrado. Tente fazer Login.');
      } else if (err?.code === 'auth/weak-password') {
        setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setErrorMessage(err?.message || 'Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginSenha.trim()) {
      setErrorMessage('Informe e-mail e senha.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const user = await loginWithEmail(loginEmail.trim(), loginSenha);
      onSuccess(user);
    } catch (err: any) {
      console.error('Login error:', err);
      if (
        err?.code === 'auth/user-not-found' ||
        err?.code === 'auth/wrong-password' ||
        err?.code === 'auth/invalid-credential'
      ) {
        setErrorMessage('E-mail ou senha incorretos.');
      } else {
        setErrorMessage(err?.message || 'Falha ao realizar login.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const user = await signInWithGoogle();
      onSuccess(user);
    } catch (err: any) {
      console.error('Google auth error:', err);
      if (err?.message !== 'A janela de login do Google já está aberta.') {
        setErrorMessage('Não foi possível conectar com o Google.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep('otp');
    }, 600);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const user: Usuario = {
        ...USUARIO_PADRAO,
        nome: regNome || 'Consumidor PreçoJusto',
        telefone: telefone || '(16) 99782-4102',
      };
      onSuccess(user);
    }, 600);
  };

  return (
    <div className="w-full max-w-md mx-auto my-auto animate-fade-in space-y-4">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div
          className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border ${
            isDark
              ? 'bg-[#18181B] border-[#27272A] text-white'
              : 'bg-white border-slate-200 text-slate-900 shadow-sm'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-[#FF6B00]" />
          <span className="text-xs font-sora font-extrabold tracking-wide">
            Acesso Restrito ao PreçoJusto
          </span>
        </div>

        <h1
          className={`font-sora font-black text-2xl tracking-tight flex items-center justify-center space-x-2 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
        >
          <span>PreçoJusto</span>
          <span className="text-[#FF6B00] font-sans text-xs px-2 py-0.5 bg-[#FF6B00]/10 border border-[#FF6B00]/30 rounded-md">
            REGIONAL
          </span>
        </h1>

        <p className={`text-xs max-w-xs mx-auto ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
          Economize na sua cidade comparando preços de supermercados e farmácias em tempo real.
        </p>
      </div>

      {/* Main Auth Container - Dedicated Page Screen */}
      <div
        className={`rounded-3xl p-6 border shadow-2xl space-y-4 transition-colors ${
          isDark
            ? 'bg-[#18181B] border-[#27272A] text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* PAGE TITLE HEADER */}
        <div className={`border-b pb-3 flex items-center justify-between ${isDark ? 'border-[#27272A]' : 'border-slate-200'}`}>
          <h2 className={`font-sora font-extrabold text-base tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {currentScreen === 'login' && 'Página de Login'}
            {currentScreen === 'register' && 'Página de Cadastro'}
            {currentScreen === 'quick' && 'Página Google / SMS'}
          </h2>
          <span className={`text-[10px] font-sora font-semibold px-2 py-0.5 text-[#FF6B00] rounded-full border ${
            isDark ? 'bg-[#0F0F12] border-[#27272A]' : 'bg-slate-100 border-slate-200'
          }`}>
            {currentScreen === 'login' && 'Acesso E-mail'}
            {currentScreen === 'register' && 'Nova Conta'}
            {currentScreen === 'quick' && 'Acesso Rápido'}
          </span>
        </div>

        {/* Informational Privacy & Community Box */}
        <div className={`p-3 rounded-2xl border space-y-2 ${isDark ? 'bg-[#0F0F12] border-[#27272A]' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center space-x-2 text-emerald-500 font-sora font-bold text-xs">
            <LockKeyhole className="w-3.5 h-3.5 shrink-0" />
            <span>Sua Conta Pessoal é 100% Privada</span>
          </div>
          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
            Seus cupons escaneados, histórico de compras e economia acumulada são totalmente privados.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-[#0F0F12] border border-[#FF6B00]/40 rounded-2xl text-[#FF6B00] text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#FF6B00]" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* PAGE 1: DEDICATED LOGIN PAGE */}
        {currentScreen === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3 pt-1">
            <div>
              <label className={`block text-[11px] font-sora font-bold mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                E-mail da Conta
              </label>
              <div className="relative">
                <Mail className={`w-4 h-4 absolute left-3 top-3 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`} />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  placeholder="seu.email@exemplo.com"
                  className={`w-full pl-9 pr-3 py-2.5 text-xs font-sans rounded-xl border focus:outline-none focus:border-[#FF6B00] transition-colors ${
                    isDark
                      ? 'bg-[#0F0F12] text-white placeholder:text-neutral-500 border-[#27272A]'
                      : 'bg-slate-50 text-slate-900 placeholder:text-slate-400 border-slate-200'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-[11px] font-sora font-bold mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                Sua Senha
              </label>
              <div className="relative">
                <Lock className={`w-4 h-4 absolute left-3 top-3 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`} />
                <input
                  type="password"
                  value={loginSenha}
                  onChange={(e) => setLoginSenha(e.target.value)}
                  required
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-3 py-2.5 text-xs font-sans rounded-xl border focus:outline-none focus:border-[#FF6B00] transition-colors ${
                    isDark
                      ? 'bg-[#0F0F12] text-white placeholder:text-neutral-500 border-[#27272A]'
                      : 'bg-slate-50 text-slate-900 placeholder:text-slate-400 border-slate-200'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#FF6B00] hover:bg-[#E05D00] text-white font-sora font-bold text-xs rounded-xl shadow-md shadow-[#FF6B00]/20 transition-all flex items-center justify-center space-x-2 mt-2"
            >
              {isSubmitting ? (
                <span>Entrando...</span>
              ) : (
                <>
                  <span>Entrar no Aplicativo</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Redirection Links */}
            <div className={`space-y-2 pt-3 border-t text-center ${isDark ? 'border-[#27272A]' : 'border-slate-200'}`}>
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>Deseja usar outro método?</p>
              
              <button
                type="button"
                onClick={() => switchPage('register')}
                className={`w-full py-2.5 border font-sora font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-2 ${
                  isDark
                    ? 'bg-[#0F0F12] hover:bg-[#27272A] border-[#27272A] text-neutral-200'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <span>Ir para Página de Criar Conta</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FF6B00]" />
              </button>

              <button
                type="button"
                onClick={() => switchPage('quick')}
                className={`w-full py-2.5 border font-sora font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-2 ${
                  isDark
                    ? 'bg-[#0F0F12] hover:bg-[#27272A] border-[#27272A] text-neutral-200'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <span>Ir para Página de Google / SMS</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FF6B00]" />
              </button>
            </div>
          </form>
        )}

        {/* PAGE 2: DEDICATED REGISTER PAGE */}
        {currentScreen === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3 pt-1">
            {/* Foto Avatar */}
            <div className={`flex items-center space-x-3 p-3 rounded-2xl border ${
              isDark ? 'bg-[#0F0F12] border-[#27272A]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="relative">
                <div className={`w-12 h-12 rounded-full border-2 border-[#FF6B00] overflow-hidden flex items-center justify-center font-sora font-extrabold text-[#FF6B00] text-base ${
                  isDark ? 'bg-[#0F0F12]' : 'bg-white'
                }`}>
                  {regAvatar ? (
                    <img src={regAvatar} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    (regNome || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-1 bg-[#FF6B00] text-white rounded-full shadow"
                >
                  <Camera className="w-3 h-3" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-sora font-bold text-[#FF6B00] hover:underline flex items-center space-x-1"
                >
                  <Upload className="w-3 h-3" />
                  <span>Enviar Foto de Perfil (Opcional)</span>
                </button>
                <p className={`text-[10px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>PNG, JPG ou WEBP até 5MB</p>
              </div>
            </div>

            {/* Nome Real */}
            <div>
              <label className={`block text-[11px] font-sora font-bold mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                Nome Completo
              </label>
              <div className="relative">
                <User className={`w-4 h-4 absolute left-3 top-3 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  value={regNome}
                  onChange={(e) => setRegNome(e.target.value)}
                  required
                  placeholder="Seu nome completo"
                  className={`w-full pl-9 pr-3 py-2.5 text-xs font-sans rounded-xl border focus:outline-none focus:border-[#FF6B00] transition-colors ${
                    isDark
                      ? 'bg-[#0F0F12] text-white placeholder:text-neutral-500 border-[#27272A]'
                      : 'bg-slate-50 text-slate-900 placeholder:text-slate-400 border-slate-200'
                  }`}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className={`block text-[11px] font-sora font-bold mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                E-mail da Conta
              </label>
              <div className="relative">
                <Mail className={`w-4 h-4 absolute left-3 top-3 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`} />
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                  placeholder="seu.email@exemplo.com"
                  className={`w-full pl-9 pr-3 py-2.5 text-xs font-sans rounded-xl border focus:outline-none focus:border-[#FF6B00] transition-colors ${
                    isDark
                      ? 'bg-[#0F0F12] text-white placeholder:text-neutral-500 border-[#27272A]'
                      : 'bg-slate-50 text-slate-900 placeholder:text-slate-400 border-slate-200'
                  }`}
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className={`block text-[11px] font-sora font-bold mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                Senha
              </label>
              <div className="relative">
                <Lock className={`w-4 h-4 absolute left-3 top-3 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`} />
                <input
                  type="password"
                  value={regSenha}
                  onChange={(e) => setRegSenha(e.target.value)}
                  required
                  placeholder="Criar senha (mínimo 6 caracteres)"
                  className={`w-full pl-9 pr-3 py-2.5 text-xs font-sans rounded-xl border focus:outline-none focus:border-[#FF6B00] transition-colors ${
                    isDark
                      ? 'bg-[#0F0F12] text-white placeholder:text-neutral-500 border-[#27272A]'
                      : 'bg-slate-50 text-slate-900 placeholder:text-slate-400 border-slate-200'
                  }`}
                />
              </div>
            </div>

            {/* Telefone */}
            <div>
              <label className={`block text-[11px] font-sora font-bold mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                Telefone / WhatsApp
              </label>
              <div className="relative">
                <Phone className={`w-4 h-4 absolute left-3 top-3 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`} />
                <input
                  type="tel"
                  value={regTelefone}
                  onChange={(e) => setRegTelefone(e.target.value)}
                  placeholder="(16) 99999-9999"
                  className={`w-full pl-9 pr-3 py-2.5 text-xs font-sans rounded-xl border focus:outline-none focus:border-[#FF6B00] transition-colors ${
                    isDark
                      ? 'bg-[#0F0F12] text-white placeholder:text-neutral-500 border-[#27272A]'
                      : 'bg-slate-50 text-slate-900 placeholder:text-slate-400 border-slate-200'
                  }`}
                />
              </div>
            </div>

            {/* Cidade & Bairro */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={`block text-[11px] font-sora font-bold mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                  Cidade
                </label>
                <input
                  type="text"
                  value={regCidade}
                  onChange={(e) => setRegCidade(e.target.value)}
                  required
                  placeholder="Sua cidade"
                  className={`w-full px-3 py-2.5 text-xs font-sans rounded-xl border focus:outline-none focus:border-[#FF6B00] transition-colors ${
                    isDark
                      ? 'bg-[#0F0F12] text-white placeholder:text-neutral-500 border-[#27272A]'
                      : 'bg-slate-50 text-slate-900 placeholder:text-slate-400 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[11px] font-sora font-bold mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                  Bairro
                </label>
                <input
                  type="text"
                  value={regBairro}
                  onChange={(e) => setRegBairro(e.target.value)}
                  required
                  placeholder="Seu bairro"
                  className={`w-full px-3 py-2.5 text-xs font-sans rounded-xl border focus:outline-none focus:border-[#FF6B00] transition-colors ${
                    isDark
                      ? 'bg-[#0F0F12] text-white placeholder:text-neutral-500 border-[#27272A]'
                      : 'bg-slate-50 text-slate-900 placeholder:text-slate-400 border-slate-200'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#FF6B00] hover:bg-[#E05D00] text-white font-sora font-bold text-xs rounded-xl shadow-md shadow-[#FF6B00]/20 transition-all flex items-center justify-center space-x-2 mt-2"
            >
              {isSubmitting ? (
                <span>Criando sua conta...</span>
              ) : (
                <>
                  <span>Criar Minha Conta Grátis</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Redirection Links */}
            <div className={`space-y-2 pt-3 border-t text-center ${isDark ? 'border-[#27272A]' : 'border-slate-200'}`}>
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>Já possui cadastro?</p>
              
              <button
                type="button"
                onClick={() => switchPage('login')}
                className={`w-full py-2.5 border font-sora font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-2 ${
                  isDark
                    ? 'bg-[#0F0F12] hover:bg-[#27272A] border-[#27272A] text-neutral-200'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <span>Voltar para Página de Login</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FF6B00]" />
              </button>
            </div>
          </form>
        )}

        {/* PAGE 3: DEDICATED GOOGLE / SMS PAGE */}
        {currentScreen === 'quick' && (
          <div className="space-y-4 pt-1">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className={`w-full py-3 px-4 font-sora font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 border ${
                isDark
                  ? 'bg-white hover:bg-slate-100 text-slate-900 border-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Entrar Instantaneamente com Google</span>
            </button>

            <div className="relative flex items-center my-2">
              <div className={`flex-grow border-t ${isDark ? 'border-[#262626]' : 'border-slate-200'}`}></div>
              <span className={`flex-shrink mx-2 text-[10px] uppercase tracking-wider font-sora ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                Ou celular SMS
              </span>
              <div className={`flex-grow border-t ${isDark ? 'border-[#262626]' : 'border-slate-200'}`}></div>
            </div>

            {step === 'input' ? (
              <form onSubmit={handleSendCode} className="space-y-3">
                <div>
                  <label className={`block text-[11px] font-sora font-bold mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                    Número de Celular com DDD
                  </label>
                  <input
                    type="tel"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    required
                    placeholder="(16) 99999-9999"
                    className={`w-full px-3 py-2.5 text-xs font-sans rounded-xl border focus:outline-none focus:border-[#FF6B00] transition-colors ${
                      isDark
                        ? 'bg-[#0F0F12] text-white placeholder:text-neutral-500 border-[#27272A]'
                        : 'bg-slate-50 text-slate-900 placeholder:text-slate-400 border-slate-200'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-[#FF6B00] hover:bg-[#E05D00] text-white font-sora font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <span>Enviar Código SMS</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <p className={`text-xs text-center ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                  Digite o código enviado para <strong>{telefone}</strong>
                </p>
                <div className="flex justify-between space-x-1">
                  {otpCode.map((digit, idx) => (
                    <input
                      key={idx}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const newCode = [...otpCode];
                        newCode[idx] = e.target.value;
                        setOtpCode(newCode);
                      }}
                      className={`w-10 h-10 text-center font-sora font-bold text-sm text-[#FF6B00] rounded-xl border ${
                        isDark ? 'bg-[#0F0F12] border-[#27272A]' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-[#FF6B00] text-white font-sora font-bold text-xs rounded-xl shadow-md"
                >
                  Verificar Código e Entrar
                </button>
              </form>
            )}

            {/* Redirection Links */}
            <div className={`space-y-2 pt-3 border-t text-center ${isDark ? 'border-[#27272A]' : 'border-slate-200'}`}>
              <button
                type="button"
                onClick={() => switchPage('login')}
                className={`w-full py-2.5 border font-sora font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-2 ${
                  isDark
                    ? 'bg-[#0F0F12] hover:bg-[#27272A] border-[#27272A] text-neutral-200'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <span>Ir para Página de Login por E-mail</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FF6B00]" />
              </button>

              <button
                type="button"
                onClick={() => switchPage('register')}
                className={`w-full py-2.5 border font-sora font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-2 ${
                  isDark
                    ? 'bg-[#0F0F12] hover:bg-[#27272A] border-[#27272A] text-neutral-200'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <span>Ir para Página de Criar Conta</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FF6B00]" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Features */}
      <div className={`grid grid-cols-3 gap-2 text-center text-[10px] pt-2 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
        <div className={`p-2 rounded-xl border ${isDark ? 'bg-[#0F0F12] border-[#27272A]' : 'bg-slate-100 border-slate-200'}`}>
          <QrCode className="w-3.5 h-3.5 text-[#FF6B00] mx-auto mb-1" />
          <span>Leitura de NFC-e</span>
        </div>
        <div className={`p-2 rounded-xl border ${isDark ? 'bg-[#0F0F12] border-[#27272A]' : 'bg-slate-100 border-slate-200'}`}>
          <TrendingDown className="w-3.5 h-3.5 text-emerald-500 mx-auto mb-1" />
          <span>Menor Preço</span>
        </div>
        <div className={`p-2 rounded-xl border ${isDark ? 'bg-[#0F0F12] border-[#27272A]' : 'bg-slate-100 border-slate-200'}`}>
          <Globe className="w-3.5 h-3.5 text-blue-500 mx-auto mb-1" />
          <span>Sua Cidade</span>
        </div>
      </div>
    </div>
  );
};
