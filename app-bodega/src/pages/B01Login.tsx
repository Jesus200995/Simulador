import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/auth';
import { Eye, EyeOff, Wheat, ShieldCheck } from 'lucide-react';

export default function B01Login() {
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
      setAuth(res.token, { ...u, userId: u?.id ?? u?.userId });
      navigate(u.rol === 'productor' ? '/productor' : '/dashboard');
    } catch (err: any) {
      setError(err.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative overflow-x-hidden">
      {/* Fixed background — prevents white on any scroll */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#071f12] via-[#0f3d22] to-[#1A5C38]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_60%_30%,rgba(45,122,80,0.6),transparent)]" />
        {/* Decorative bottom wheat row */}
        <div className="absolute bottom-0 inset-x-0 h-32 flex items-end justify-around px-6 opacity-[0.06]">
          {[0,1,2,3,4,5,6,7,8,9].map(i => (
            <Wheat key={i} size={i%3===0?52:i%2===0?40:30} className="text-white mb-1" style={{transform:`rotate(${(i-4)*3}deg)`}} />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20" />
      </div>

      {/* Scrollable overlay */}
      <div
        className="relative min-h-[100dvh] flex flex-col items-center justify-center px-4 py-10 sm:py-16 overflow-x-hidden"
        style={{ paddingTop: 'max(2.5rem, env(safe-area-inset-top))', paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}
      >

        {/* ── Logo + brand ── */}
        <div className="animate-auth-in flex items-center gap-3.5 mb-7 sm:mb-8">
          <div className="w-[52px] h-[52px] rounded-[14px] bg-white/15 backdrop-blur-md ring-1 ring-white/20 flex items-center justify-center shadow-xl">
            <img src="/icono.png" alt="SIMAC" className="w-9 h-9 rounded-[10px]" />
          </div>
          <div>
            <p className="text-[26px] sm:text-[28px] font-black text-white tracking-[-0.5px] leading-none">SIMAC</p>
            <p className="text-[12px] text-green-300/70 font-medium mt-0.5 tracking-wide">Plan Nacional Maíz 2026</p>
          </div>
        </div>

        {/* ── Card ── */}
        <div className="animate-auth-in w-full max-w-[400px] bg-white rounded-[28px] shadow-[0_24px_64px_rgba(0,0,0,0.45)] overflow-hidden" style={{ animationDelay: '0.08s' }}>

          {/* Green accent bar */}
          <div className="h-[3px] bg-gradient-to-r from-[#1A5C38] via-[#34d079] to-[#1A5C38]" />

          <div className="px-8 pt-7 pb-2">
            <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Iniciar sesión</h1>
            <p className="text-[13px] text-gray-400 mt-1">Bienvenido de vuelta</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 pt-4 pb-7 space-y-4">

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em]">Correo electrónico</label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                required autoComplete="email" placeholder="correo@empresa.com"
                className="w-full bg-[#F5F5F7] rounded-[14px] px-4 py-3.5 text-[15px] text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#1A5C38]/20 focus:bg-white border-0 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em]">Contraseña</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  required autoComplete="current-password" placeholder="Mínimo 6 caracteres"
                  className="w-full bg-[#F5F5F7] rounded-[14px] px-4 py-3.5 text-[15px] text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#1A5C38]/20 focus:bg-white border-0 pr-12 transition-all"
                />
                <button type="button" onClick={() => setShowPwd(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-[14px] px-4 py-3">
                <ShieldCheck size={14} className="text-red-400 flex-shrink-0" />
                <p className="text-[13px] text-red-600">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-[#1A5C38] hover:bg-[#1e6b42] active:scale-[0.98] text-white rounded-[14px] py-3.5 text-[15px] font-semibold transition-all disabled:opacity-40 shadow-[0_4px_14px_rgba(26,92,56,0.4)] mt-1">
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Ingresando…</span>
                : 'Entrar'}
            </button>

            <p className="text-center text-[13px] text-gray-400 pt-1">
              ¿No tienes cuenta?{' '}
              <Link to="/registro" className="text-[#1A5C38] font-semibold hover:underline">Regístrate</Link>
            </p>

            <p className="text-center text-[13px] text-gray-400">
              ¿Eres productor?{' '}
              <Link to="/activar" className="text-[#1A5C38] font-semibold hover:underline">Activa tu cuenta aquí</Link>
            </p>

          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-[11px] text-white/25 max-w-xs leading-relaxed">
          Sistema de Ordenamiento de la Producción y Comercialización<br />del Maíz Blanco en México
        </p>

      </div>
    </div>
  );
}
