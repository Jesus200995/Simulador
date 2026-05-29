import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { Eye, EyeOff, ShieldCheck, Lock } from 'lucide-react';

export default function LoginAdminPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.auth.login(email, password);
      const u = res.usuario || res.user;
      
      // Validar rol de administrador o responsable
      if (u?.rol !== 'admin' && u?.rol !== 'responsable') {
        throw new Error('No tienes permisos para acceder al panel administrativo');
      }

      setAuth(res.token, { ...u, userId: u?.id ?? u?.userId });
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center bg-[#0d131a]">
      {/* Decorative gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[#1A5C38]/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-[#1B4F8A]/20 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-[420px] px-4">
        
        {/* Title / Logo block */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-[58px] h-[58px] rounded-[16px] bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl mb-3">
            <Lock className="text-emerald-500" size={24} />
          </div>
          <h2 className="text-[26px] font-black text-white tracking-tight leading-none">SIMAC Admin</h2>
          <p className="text-[12px] text-gray-400 font-medium mt-1.5 tracking-wide">
            Panel de Administración · Plan Nacional Maíz 2026
          </p>
        </div>

        {/* Card */}
        <div className="w-full bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[28px] shadow-[0_30px_70px_rgba(0,0,0,0.5)] overflow-hidden">
          
          {/* Subtle accent bar */}
          <div className="h-[2px] bg-gradient-to-r from-emerald-500 via-teal-500 to-[#1B4F8A]" />

          <div className="px-8 pt-7 pb-2">
            <h1 className="text-[20px] font-extrabold text-white tracking-tight">Acceso Administrativo</h1>
            <p className="text-[12px] text-gray-400 mt-1">Ingresa tus credenciales autorizadas</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 pt-4 pb-8 space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Correo Corporativo</label>
              <input
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required 
                autoComplete="email" 
                placeholder="nombre@simac.gob.mx"
                className="w-full bg-white/[0.04] focus:bg-white/[0.08] border border-white/5 rounded-xl px-4 py-3.5 text-[14px] text-white placeholder-gray-500 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-300"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Contraseña</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required 
                  autoComplete="current-password" 
                  placeholder="••••••••"
                  className="w-full bg-white/[0.04] focus:bg-white/[0.08] border border-white/5 rounded-xl px-4 py-3.5 text-[14px] text-white placeholder-gray-500 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 pr-12 transition-all duration-300"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPwd(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-[12.5px] leading-relaxed animate-shake">
                <ShieldCheck size={14} className="mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl py-3.5 text-[14px] font-bold active:scale-[0.98] transition-all duration-200 disabled:opacity-40 shadow-lg shadow-emerald-950/50 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Verificando credenciales…
                </span>
              ) : (
                'Ingresar al panel'
              )}
            </button>

            <div className="pt-2 text-center">
              <Link 
                to="/login" 
                className="text-[12px] text-gray-400 hover:text-white transition-colors duration-200 inline-block border-b border-gray-600 hover:border-white leading-tight"
              >
                Volver al inicio público
              </Link>
            </div>

          </form>
        </div>

        <p className="mt-8 text-center text-[10px] text-gray-500 max-w-xs leading-relaxed mx-auto">
          SIMAC es un sistema cerrado de uso confidencial gubernamental para auditoría y visualización de mercados agropecuarios.
        </p>

      </div>
    </div>
  );
}
