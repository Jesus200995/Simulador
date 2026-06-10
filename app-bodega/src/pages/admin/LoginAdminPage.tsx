import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { Eye, EyeOff, ShieldCheck, Mail, Lock, AlertCircle, UserPlus } from 'lucide-react';

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

  const inputCls =
    'w-full pl-9 pr-4 py-3 sm:py-3.5 bg-gray-50 focus:bg-white border border-gray-200 rounded-xl ' +
    'text-[13px] sm:text-[14px] text-gray-900 placeholder-gray-400 outline-none ' +
    'focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/15 transition-all duration-200';

  return (
    <div className="relative min-h-screen bg-[#F5F6F8] overflow-hidden flex flex-col items-center justify-center py-8 px-4">
      {/* Ambient light gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-15%] w-[55%] h-[55%] rounded-full bg-emerald-200/40 blur-[130px]" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[50%] h-[50%] rounded-full bg-blue-200/30 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-[400px] sm:max-w-[420px] animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-14 h-14 sm:w-[58px] sm:h-[58px] rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-[0_8px_24px_rgba(16,92,56,0.25)] mb-4">
            <ShieldCheck className="text-white" size={24} strokeWidth={2.3} />
          </div>
          <h2 className="text-[24px] sm:text-[27px] font-black text-gray-900 tracking-tight leading-none">SIMAC Admin</h2>
          <p className="text-[11px] sm:text-[12px] text-gray-500 font-medium mt-2 tracking-wide">
            Panel de Administración · Plan Nacional Maíz 2026
          </p>
        </div>

        {/* Card */}
        <div className="w-full bg-white border border-gray-200/80 rounded-[24px] sm:rounded-[28px] shadow-[0_20px_50px_rgba(15,23,42,0.10)] overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500" />
          <div className="px-5 sm:px-7 pt-6 pb-1">
            <h1 className="text-[17px] sm:text-[20px] font-extrabold text-gray-900 tracking-tight">Acceso administrativo</h1>
            <p className="text-[11px] sm:text-[12px] text-gray-500 mt-1">Ingresa tus credenciales autorizadas</p>
          </div>

          <form onSubmit={handleSubmit} className="px-5 sm:px-7 pt-5 pb-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                Correo corporativo
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input type="email" value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  required autoComplete="email" placeholder="nombre@simac.gob.mx" className={inputCls} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                Contraseña
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input type={showPwd ? 'text' : 'password'} value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  required autoComplete="current-password" placeholder="••••••••"
                  className={inputCls.replace('pr-4', 'pr-11')} />
                <button type="button" onClick={() => setShowPwd(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3.5 py-3 text-red-600 text-[12px] leading-relaxed animate-fade-in">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white rounded-xl py-3 sm:py-3.5 text-[13px] sm:text-[14px] font-bold active:scale-[0.98] transition-all duration-200 shadow-[0_8px_20px_rgba(16,92,56,0.25)] mt-1">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Verificando…
                </span>
              ) : 'Ingresar al panel'}
            </button>

            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[10px] text-gray-400 font-medium">o</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <Link to="/admin/registro"
              className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:border-emerald-300 bg-white hover:bg-emerald-50 rounded-xl py-3 text-[12.5px] sm:text-[13px] font-semibold text-gray-600 hover:text-emerald-700 active:scale-[0.98] transition-all duration-200">
              <UserPlus size={14} />
              Crear cuenta administrativa
            </Link>

            <div className="text-center pt-1">
              <Link to="/login" className="text-[11px] sm:text-[12px] text-gray-400 hover:text-gray-600 transition-colors duration-200">
                Volver al portal público
              </Link>
            </div>
          </form>
        </div>

        <p className="mt-6 text-center text-[9px] sm:text-[10px] text-gray-400 max-w-xs leading-relaxed mx-auto px-4">
          SIMAC — Sistema de Información de Mercados Agropecuarios Consolidados. Uso confidencial del Plan Nacional Maíz 2026.
        </p>
      </div>
    </div>
  );
}
