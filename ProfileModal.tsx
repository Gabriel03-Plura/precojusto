import React, { useState, useRef } from 'react';
import {
  User,
  Phone,
  Mail,
  Camera,
  Upload,
  LogOut,
  Check,
  X,
  Navigation,
  Loader2,
  Save,
  CheckCircle2,
  UserPlus,
} from 'lucide-react';
import { Usuario } from '../types';
import { obterLocalizacaoGPS } from '../utils/location';

interface ProfileModalProps {
  usuario: Usuario | null;
  onUpdateUsuario: (updated: Usuario) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: () => void;
  totalEconomiaGeral?: number;
  totalHistoricoCount?: number;
  theme?: 'dark' | 'light';
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  usuario,
  onUpdateUsuario,
  onLogout,
  isOpen,
  onClose,
  onOpenAuth,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [nome, setNome] = useState(usuario?.nome || '');
  const [email, setEmail] = useState(usuario?.email || '');
  const [telefone, setTelefone] = useState(usuario?.telefone || '');
  const [avatarUrl, setAvatarUrl] = useState(usuario?.avatarUrl || '');
  const [cidade, setCidade] = useState(usuario?.cidade || 'Araraquara');
  const [bairro, setBairro] = useState(usuario?.bairro || 'Centro');
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !usuario) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Por favor escolha uma imagem de até 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGetExactGPS = async () => {
    setIsLoadingGPS(true);
    setGpsStatus('Localizando via GPS...');
    const loc = await obterLocalizacaoGPS();
    setIsLoadingGPS(false);

    setCidade(loc.cidade);
    setBairro(loc.bairro);
    setGpsStatus(`GPS ativado: ${loc.cidade} (${loc.bairro})`);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Usuario = {
      ...usuario,
      nome: nome.trim() || usuario.nome,
      email: email.trim() || undefined,
      telefone: telefone.trim() || usuario.telefone,
      avatarUrl: avatarUrl.trim() || undefined,
      cidade,
      bairro,
    };

    onUpdateUsuario(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 2500);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 backdrop-blur-md animate-fade-in ${
      isDark ? 'bg-black/80 text-slate-100' : 'bg-slate-900/40 text-slate-900'
    }`}>
      <div className={`rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border flex flex-col max-h-[90vh] ${
        isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-slate-200'
      }`}>
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isDark ? 'bg-[#0F0F12] border-[#27272A] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-[#FF6B00] stroke-[1.75px]" />
            <h2 className="font-sora font-extrabold text-base tracking-tight">Meu Perfil e Dados da Conta</h2>
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

        {/* Content Form */}
        <form onSubmit={handleSaveProfile} className="p-5 overflow-y-auto space-y-4">
          {savedSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-500 text-xs font-sora font-semibold flex items-center space-x-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>Dados da conta atualizados com sucesso!</span>
            </div>
          )}

          {/* Avatar Photo Section */}
          <div className={`flex flex-col items-center justify-center p-4 rounded-2xl border space-y-3 ${
            isDark ? 'bg-[#0F0F12] border-[#27272A]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="relative group">
              <div className={`w-20 h-20 rounded-full border-2 border-[#FF6B00] overflow-hidden flex items-center justify-center font-sora font-extrabold text-[#FF6B00] text-2xl shadow-md ${
                isDark ? 'bg-[#18181B]' : 'bg-white'
              }`}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt={nome} className="w-full h-full object-cover" />
                ) : (
                  (nome || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-[#FF6B00] hover:bg-[#E05D00] text-white rounded-full shadow-lg transition-transform active:scale-90"
                title="Alterar Foto de Perfil"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div className="text-center space-y-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-sora font-bold text-[#FF6B00] hover:underline flex items-center justify-center space-x-1"
              >
                <Upload className="w-3 h-3" />
                <span>Enviar Foto Real do Dispositivo</span>
              </button>
              <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>PNG, JPG ou WEBP até 5MB</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            {/* Nome Real */}
            <div>
              <label className={`block text-[11px] font-sora font-bold mb-1 ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Nome Real / Completo
              </label>
              <div className="relative">
                <User className={`w-4 h-4 absolute left-3 top-3 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`} />
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome completo"
                  className={`w-full pl-9 pr-3 py-2.5 text-xs font-sans rounded-xl border focus:outline-none focus:border-[#FF6B00] transition-all ${
                    isDark
                      ? 'bg-[#0F0F12] text-white placeholder:text-zinc-500 border-[#27272A]'
                      : 'bg-slate-50 text-slate-900 placeholder:text-slate-400 border-slate-200 focus:bg-white'
                  }`}
                  required
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
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
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(16) 99999-9999"
                  className={`w-full pl-9 pr-3 py-2.5 text-xs font-sans rounded-xl border focus:outline-none focus:border-[#FF6B00] transition-all ${
                    isDark
                      ? 'bg-[#0F0F12] text-white placeholder:text-zinc-500 border-[#27272A]'
                      : 'bg-slate-50 text-slate-900 placeholder:text-slate-400 border-slate-200 focus:bg-white'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* GPS Accurate Auto-Detect */}
          <div className={`p-3.5 rounded-2xl border space-y-2 ${
            isDark ? 'bg-[#0F0F12] border-[#27272A]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Navigation className="w-4 h-4 text-[#FF6B00] stroke-[1.75px]" />
                <span className={`text-xs font-sora font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Localização GPS ({cidade} - {bairro})
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGetExactGPS}
              disabled={isLoadingGPS}
              className={`w-full py-2 border font-sora font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50 ${
                isDark
                  ? 'bg-[#18181B] hover:bg-[#27272A] border-[#27272A] text-slate-300 hover:text-white'
                  : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
              }`}
            >
              {isLoadingGPS ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Obtendo Coordenadas GPS...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5 text-[#FF6B00]" />
                  <span>Atualizar Localização GPS</span>
                </>
              )}
            </button>

            {gpsStatus && (
              <p className="text-[10px] text-[#FF6B00] font-sora font-semibold text-center">
                {gpsStatus}
              </p>
            )}
          </div>

          {/* Submit Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              className="w-full py-3 bg-[#FF6B00] hover:bg-[#E05D00] text-white font-sora font-bold text-xs rounded-xl transition-all shadow-md shadow-[#FF6B00]/20 flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações da Conta</span>
            </button>

            {onOpenAuth && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className={`w-full py-2.5 border font-sora font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-2 ${
                  isDark
                    ? 'bg-[#0F0F12] hover:bg-[#27272A] border-[#27272A] text-slate-200'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                }`}
              >
                <UserPlus className="w-4 h-4 text-[#FF6B00]" />
                <span>Criar Nova Conta / Alternar Usuário</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              className={`w-full py-2.5 border font-sora font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-2 ${
                isDark
                  ? 'bg-[#0F0F12] hover:bg-[#27272A] border-[#27272A] text-zinc-400 hover:text-white'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>Sair da Conta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
