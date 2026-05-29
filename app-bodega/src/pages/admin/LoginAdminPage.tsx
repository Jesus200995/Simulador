import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { Eye, EyeOff, ShieldAlert, Mail, Lock, AlertCircle, UserPlus } from 'lucide-react';

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

  return (
    <div className="relative min-h-screen bg-[#0b1117] overflow-hidden flex flex-col items-center justify-center py-8 px-4">

      {/* Ambient gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-15%] w-[55%] h-[55%] rounded-full bg-[#1A5C38]/15 blur-[130px]" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[50%] h-[50%] rounded-full bg-[#1B4F8A]/15 blur-[110px]" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] rounded-full bg-emerald-500/5 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-[400px] sm:max-w-[420px]">

        {/* Logo */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-14 h-14 sm:w-[58px] sm:h-[58px] rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] flex items-center justify-center shadow-2xl mb-4">
            <ShieldAlert className="text-emerald-400" size={22} />
          </div>
          <h2 className="text-[24px] sm:text-[27px] font-black text-white tracking-tight leading-none">SIMAC Admin</h2>
          <p className="text-[11px] sm:text-[12px] text-gray-500 font-medium mt-2 tracking-wide">
            Panel de Administración · Plan Nacional Maíz 2026
          </p>
        </div>

        {/* Card */}
        <div className="w-full bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-[24px] sm:rounded-[28px] shadow-[0_24px_60px_rgba(0,0,0,0.5)] overflow-hidden">

          {/* Accent bar */}
          <div className="h-[2px] bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500" />

          <div className="px-5 sm:px-7 pt-6 pb-1">
            <h1 className="text-[17px] sm:text-[20px] font-extrabold text-white tracking-tight">Acceso administrativo</h1>
            <p className="text-[11px] sm:text-[12px] text-gray-500 mt-1">Ingresa tus credenciales autorizadas</p>
          </div>

          <form onSubmit={handleSubmit} className="px-5 sm:px-7 pt-5 pb-6 space-y-4">

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                Correo corporativo
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  required
                  autoComplete="email"
                  placeholder="nombre@simac.gob.mx"
                  className="w-full pl-9 pr-4 py-3 sm:py-3.5 bg-white/[0.04] focus:bg-white/[0.07] border border-white/[0.07] rounded-xl text-[13px] sm:text-[14px] text-white placeholder-gray-600 outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/15 transition-all duration-200"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                Contraseña
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full pl-9 pr-11 py-3 sm:py-3.5 bg-white/[0.04] focus:bg-white/[0.07] border border-white/[0.07] rounded-xl text-[13px] sm:text-[14px] text-white placeholder-gray-600 outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/15 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-3 text-red-400 text-[12px] leading-relaxed">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white rounded-xl py-3 sm:py-3.5 text-[13px] sm:text-[14px] font-bold active:scale-[0.98] transition-all duration-200 shadow-lg shadow-emerald-950/50 mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Verificando…
                </span>
              ) : (
                'Ingresar al panel'
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-[10px] text-gray-600 font-medium">o</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            {/* Register link */}
            <Link
              to="/admin/registro"
              className="w-full flex items-center justify-center gap-2 border border-white/[0.07] hover:border-emerald-500/30 bg-white/[0.02] hover:bg-emerald-500/5 rounded-xl py-3 text-[12.5px] sm:text-[13px] font-semibold text-gray-400 hover:text-emerald-300 active:scale-[0.98] transition-all duration-200"
            >
              <UserPlus size={14} />
              Crear cuenta administrativa
            </Link>

            {/* Back link */}
            <div className="text-center pt-1">
              <Link
                to="/login"
                className="text-[11px] sm:text-[12px] text-gray-600 hover:text-gray-400 transition-colors duration-200"
              >
                Volver al portal público
              </Link>
            </div>
          </form>
        </div>

        <p className="mt-6 text-center text-[9px] sm:text-[10px] text-gray-700 max-w-xs leading-relaxed mx-auto px-4">
          SIMAC — Sistema de Información de Mercados Agropecuarios Consolidados. Uso confidencial del Plan Nacional Maíz 2026.
        </p>
      </div>
    </div>
  );
}
