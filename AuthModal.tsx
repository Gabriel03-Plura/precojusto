import React, { useState, useRef } from 'react';
import {
  Phone,
  CheckCircle,
  ShieldCheck,
  ArrowRight,
  X,
  AlertCircle,
  Mail,
  Lock,
  User,
  MapPin,
  Camera,
  Upload,
  Globe,
  LockKeyhole,
} from 'lucide-react';
import { Usuario } from '../types';
import { USUARIO_PADRAO } from '../data/mockData';
import { signInWithGoogle, registerWithEmail, loginWithEmail } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (usuario: Usuario) => void;
  theme?: 'dark' | 'light';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'register' | 'login' | 'quick'>('register');

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

  if (!isOpen) return null;

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
      onClose();
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
      onClose();
    } catch (err: any) {
      console.error('Login error:', err);
      if (err?.code === 'auth/user-not-found' || err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        setErrorMessage('E-mail ou senha incorretos.');
      } else {
        setErrorMessage(err?.message || 'Falha ao realizar login.');
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
    setErrorMessage(null);
    setTimeout(() => {
      setIsSubmitting(false);
      const user: Usuario = {
        ...USUARIO_PADRAO,
        nome: regNome || 'Consumidor PreçoJusto',
        telefone: telefone || '(16) 99782-4102',
      };
      onSuccess(user);
      onClose();
    }, 500);
  };

  const handleGoogleLogin = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const user = await signInWithGoogle();
      onSuccess(user);
      onClose();
    } catch (err: any) {
      console.error('Firebase Auth error:', err);
      if (err?.message?.includes('cancelada') || err?.code === 'auth/cancelled-popup-request') {
        // Silently handle cancelled duplicate popups
      } else {
        setErrorMessage(
          err?.message?.includes('popup-closed')
            ? 'Login cancelado.'
            : err?.message || 'Erro na autenticação Firebase com Google.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 backdrop-blur-md animate-fade-in ${
      isDark ? 'bg-black/80 text-slate-100' : 'bg-slate-900/40 text-slate-900'
    }`}>
      <div className={`rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border max-h-[90vh] flex flex-col ${
        isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-slate-200'
      }`}>
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isDark ? 'bg-[#0F0F12] border-[#27272A] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-[#FF6B00] stroke-[1.75px]" />
            <h2 className="font-sora font-extrabold text-base tracking-tight">Acessar o PreçoJusto</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors ${
              isDark ? 'hover:bg-[#27272A] text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {/* Explanation Box on Privacy vs Shared Regional Prices */}
          <div className={`p-3 rounded-2xl border space-y-1.5 ${
            isDark ? 'bg-[#0F0F12] border-[#27272A]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center space-x-2 text-emerald-500 font-sora font-bold text-xs">
              <LockKeyhole className="w-3.5 h-3.5 shrink-0" />
              <span>Seus Dados Pessoais são Privados</span>
            </div>
            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Sua economia total, histórico de cupons e lista de compras ficam salvos com segurança no seu perfil individual.
            </p>

            <div className={`pt-1 flex items-center space-x-2 text-[#FF6B00] font-sora font-bold text-xs border-t mt-1 ${
              isDark ? 'border-[#27272A]/60' : 'border-slate-200'
            }`}>
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span>Índice de Preços Compartilhado</span>
            </div>
            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Os preços de produtos, mercados e farmácias cadastrados na sua região são visíveis para toda a comunidade economizar junto!
            </p>
          </div>

          {errorMessage && (
            <div className={`p-3 border rounded-2xl text-xs flex items-center space-x-2 ${
              isDark ? 'bg-[#0F0F12] border-[#FF6B00]/40 text-[#FF6B00]' : 'bg-orange-50 border-orange-200 text-[#FF6B00]'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0 text-[#FF6B00]" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className={`flex p-1 rounded-2xl border ${
            isDark ? 'bg-[#0F0F12] border-[#27272A]' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-sora font-bold rounded-xl transition-all ${
                activeTab === 'register'
                  ? 'bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/20'
                  : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Criar Conta
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-sora font-bold rounded-xl transition-all ${
                activeTab === 'login'
                  ? 'bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/20'
                  : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Entrar
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('quick');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-sora font-bold rounded-xl transition-all ${
                activeTab === 'quick'
                  ? 'bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/20'
                  : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Google / SMS
            </button>
          </div>

          {/* Tab 1: Criar Conta */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              {/* Photo Upload Header */}
              <div className={`flex items-center space-x-3 p-3 rounded-2xl border ${
                isDark ? 'bg-[#0F0F12] border-[#27272A]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="relative">
                  <div className={`w-12 h-12 rounded-full border-2 border-[#FF6B00] overflow-hidden flex items-center justify-center font-sora font-extrabold text-[#FF6B00] text-base ${
                    isDark ? 'bg-[#18181B]' : 'bg-white'
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
                    <span>Adicionar Foto Real do Perfil</span>
                  </button>
                  <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Sua foto aparecerá na conta</p>
                </div>
              </div>

              {/* Nome Real */}
              <div>
                <label className={`block text-[11px] font-sora font-bold mb-1 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Nome Completo
                </label>
                <div className="relative">
                  <User className={`w-4 h-4 absolute left-3 top-3 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`} />
                  <input
                    type="text"
                    value={regNome}
                    onChange={(e) => setRegNome(e.target.value)}
                    required
                    placeholder="Seu nome real"
                    className={`w-full pl-9 pr-3 py-2.5 text-xs font-sans rounded-xl border focus:outline-none focus:border-[#FF6B00] transition-all ${
                      isDark
                        ? 'bg-[#0F0F12] text-white placeholder:text-zinc-500 border-[#27272A]'
                        : 'bg-slate-50 text-slate-900 placeholder:text-slate-400 border-slate-200 focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className={`block text-[11px] font-sora font-bold mb-1 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  E-mail da Conta
                </label>
                <div className="relative">
                  <Mail className={`w-4 h-4 absolute left-3 top-3 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`} />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    placeholder="seu.email@exemplo.com"
                    className={`w-full pl-9 pr-3 py-2.5 text-xs font-sans rounded-xl border focus:outline-none focus:border-[#FF6B00] transition-all ${
                      isDark
                        ? 'bg-[#0F0F12] text-white placeholder:text-zinc-500 border-[#27272A]'
                        : 'bg-slate-50 text-slate-900 placeholder:text-slate-400 border-slate-200 focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className={`block text-[11px] font-sora font-bold mb-1 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Senha
                </label>
                <div className="relative">
                  <Lock className={`w-4 h-4 absolute left-3 top-3 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`} />
                  <input
                    type="password"
                    value={regSenha}
                    onChange={(e) => setRegSenha(e.target.value)}
                    required
                    placeholder="Sua senha secreta (min. 6 caracteres)"
                    className={`w-full pl-9 pr-3 py-2.5 text-xs font-sans rounded-xl border focus:outline-none focus:border-[#FF6B00] transition-all ${
                      isDark
                        ? 'bg-[#0F0F12] text-white placeholder:text-zinc-500 border-[#27272A]'
                        : 'bg-slate-50 text-slate-900 placeholder:text-slate-400 border-slate-200 focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              {/* Telefone */}
              <div>
                <label className={`block text-[11px] font-sora font-bold mb-1 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Telefone / WhatsApp
                </label>
                <div className="relative">
                  <Phone className={`w-4 h-4 absolute left-3 top-3 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`} />
                  <input
                    type="tel"
                    value={regTelefone}
                    onChange={(e) => setRegTelefone(e.target.value)}
                    placeholder="(16) 99999-9999"
                    className={`w-full pl-9 pr-3 py-2.5 text-xs font-sans rounded-xl border focus:outline-none focus:border-[#FF6B00] transition-all ${
                      isDark
                        ? 'bg-[#0F0F12] text-white placeholder:text-zinc-500 border-[#27272A]'
                        : 'bg-slate-50 text-slate-900 placeholder:text-slate-400 border-slate-200 focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              {/* Cidade & Bairro */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`block text-[11px] font-sora font-bold mb-1 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={regCidade}
                    onChange={(e) => setRegCidade(e.target.value)}
                    required
                    placeholder="Sua cidade"
                    className={`w-full px-3 py-2.5 text-xs font-sans rounded-xl border focus:outline-none focus:border-[#FF6B00] transition-all ${
                      isDark
                        ? 'bg-[#0F0F12] text-white placeholder:text-zinc-500 border-[#27272A]'
                        : 'bg-slate-50 text-slate-900 placeholder:text-slate-400 border-slate-200 focus:bg-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-sora font-bold mb-1 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={regBairro}
                    onChange={(e) => setRegBairro(e.target.value)}
                    required
                    placeholder="Seu bairro"
                    className={`w-full px-3 py-2.5 text-xs font-sans rounded-xl border focus:outline-none focus:border-[#FF6B00] transition-all ${
                      isDark
                        ? 'bg-[#0F0F12] text-white placeholder:text-zinc-500 border-[#27272A]'
                        : 'bg-slate-50 text-slate-900 placeholder:text-slate-400 border-slate-200 focus:bg-white'
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
                  <span>Criando Conta...</span>
                ) : (
                  <>
                    <span>Criar Minha Conta</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Tab 2: Entrar (Login Email/Senha) */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3 py-2">
              <div>
                <label className={`block text-[11px] font-sora font-bold mb-1 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  E-mail da Conta
                </label>
                <div className="relative">
                  <Mail className={`w-4 h-4 absolute left-3 top-3 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`} />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    placeholder="seu.email@exemplo.com"
                    className={`w-full pl-9 pr-3 py-2.5 text-xs font-sans rounded-xl border focus:outline-none focus:border-[#FF6B00] transition-all ${
                      isDark
                        ? 'bg-[#0F0F12] text-white placeholder:text-zinc-500 border-[#27272A]'
                        : 'bg-slate-50 text-slate-900 placeholder:text-slate-400 border-slate-200 focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-[11px] font-sora font-bold mb-1 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Sua Senha
                </label>
                <div className="relative">
                  <Lock className={`w-4 h-4 absolute left-3 top-3 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`} />
                  <input
                    type="password"
                    value={loginSenha}
                    onChange={(e) => setLoginSenha(e.target.value)}
                    required
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-3 py-2.5 text-xs font-sans rounded-xl border focus:outline-none focus:border-[#FF6B00] transition-all ${
                      isDark
                        ? 'bg-[#0F0F12] text-white placeholder:text-zinc-500 border-[#27272A]'
                        : 'bg-slate-50 text-slate-900 placeholder:text-slate-400 border-slate-200 focus:bg-white'
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
                    <span>Entrar na Minha Conta</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Tab 3: Google / SMS */}
          {activeTab === 'quick' && (
            <div className="space-y-4 py-2">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                className={`w-full py-3 border font-sora font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-3 ${
                  isDark
                    ? 'bg-[#0F0F12] border-[#27272A] text-white hover:border-slate-700'
                    : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                }`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                <div className={`flex-grow border-t ${isDark ? 'border-[#27272A]' : 'border-slate-200'}`}></div>
                <span className={`flex-shrink mx-2 text-[10px] uppercase tracking-wider font-sora ${
                  isDark ? 'text-zinc-400' : 'text-slate-500'
                }`}>
                  Ou celular SMS
                </span>
                <div className={`flex-grow border-t ${isDark ? 'border-[#27272A]' : 'border-slate-200'}`}></div>
              </div>

              {step === 'input' ? (
                <form onSubmit={handleSendCode} className="space-y-3">
                  <div>
                    <label className={`block text-[11px] font-sora font-bold mb-1 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Número de Celular com DDD
                    </label>
                    <input
                      type="tel"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      required
                      placeholder="(16) 99999-9999"
                      className={`w-full px-3 py-2.5 text-xs font-sans rounded-xl border focus:outline-none focus:border-[#FF6B00] transition-all ${
                        isDark
                          ? 'bg-[#0F0F12] text-white placeholder:text-zinc-500 border-[#27272A]'
                          : 'bg-slate-50 text-slate-900 placeholder:text-slate-400 border-slate-200 focus:bg-white'
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
                  <p className={`text-xs text-center ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    Digite o código de 6 dígitos enviado para <strong>{telefone}</strong>
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
                    Verificar e Entrar
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

