import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/auth';
import { Warehouse, Factory, Eye, EyeOff, Wheat } from 'lucide-react';

type Rol = 'bodega' | 'industria';

export default function B01Login() {
  const [rol, setRol] = useState<Rol | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rol) { setError('Selecciona tu tipo de cuenta para continuar'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await api.auth.login(email, password, rol);
      const u = res.usuario || res.user;
      setAuth(res.token, { ...u, userId: u?.id ?? u?.userId });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    /*
     * LAYOUT: fixed background layer + scrollable overlay
     * This prevents white gaps on scroll on all devices.
     */
    <div className="relative">

      {/* ── Fixed full-screen background ────────────────── */}
      <div className="fixed inset-0 bg-[#0d3320]">
        {/* Multi-layer green gradient simulating maiz field depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a2918] via-[#1A5C38] to-[#145c30]" />
        {/* Radial glow center */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(34,115,63,0.55),transparent)]" />
        {/* Subtle grain texture */}
        <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='80' height='80' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: '160px 160px',
        }} />
        {/* Decorative wheat stalks (SVG icons as large bg elements) */}
        <div className="absolute bottom-0 left-0 right-0 h-40 opacity-[0.07] flex items-end justify-around px-8">
          {[0,1,2,3,4,5,6,7].map(i => (
            <Wheat key={i} size={i % 2 === 0 ? 48 : 36} className="text-green-300 mb-2" style={{ transform: `rotate(${(i-3)*4}deg)` }} />
          ))}
        </div>
        {/* Soft vignette edges */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_100%_at_50%_50%,transparent_40%,rgba(0,0,0,0.45))]" />
      </div>

      {/* ── Scrollable content ──────────────────────────── */}
      <div className="relative min-h-screen flex items-center justify-center p-4 py-12">

        {/* Responsive layout: stacked on mobile, side-by-side on lg */}
        <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

          {/* Left: Branding — visible on lg, shown above card on mobile */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex lg:flex items-center justify-center lg:justify-start gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/25 shadow-2xl">
                <img src="/icono.png" alt="SOMEC" className="w-12 h-12 rounded-xl" />
              </div>
              <div className="text-left">
                <h1 className="text-[36px] font-black text-white tracking-tight leading-none">SOMEC</h1>
                <p className="text-green-300/80 text-[13px] font-medium mt-0.5">Plan Nacional Maíz 2026</p>
              </div>
            </div>
            <p className="text-white/70 text-[15px] leading-relaxed max-w-sm mx-auto lg:mx-0 hidden lg:block">
              Sistema de Ordenamiento de la Producción y Comercialización del Maíz Blanco en México
            </p>
            <div className="hidden lg:flex flex-col gap-3 mt-8">
              {[
                { icon: Warehouse, text: 'Para bodegueros y acopiadores de maíz' },
                { icon: Factory,   text: 'Para industria tortillera y nixtamalera' },
                { icon: Wheat,     text: 'Conectando campo e industria nacional' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={15} className="text-green-300" />
                  </div>
                  <p className="text-white/60 text-[13px]">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Login card */}
          <div className="w-full max-w-sm lg:max-w-md flex-shrink-0">
            <div className="bg-white/[0.96] backdrop-blur-2xl rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.4)] overflow-hidden">

              {/* Card top stripe */}
              <div className="h-1 bg-gradient-to-r from-[#1A5C38] via-[#4ade80] to-[#1A5C38]" />

              <div className="px-7 pt-6 pb-3">
                <p className="text-[20px] font-black text-gray-900">Iniciar sesión</p>
                <p className="text-[13px] text-gray-400 mt-0.5">Selecciona tu tipo de cuenta</p>
              </div>

              <div className="px-7 pb-7 space-y-4">
                {/* Selector de rol */}
                <div className="grid grid-cols-2 gap-2.5">
                  {([
                    { key: 'bodega' as Rol, icon: Warehouse, label: 'Bodega', desc: 'Almacenista · Acopiador' },
                    { key: 'industria' as Rol, icon: Factory, label: 'Industria', desc: 'Tortillería · Nixtamal' },
                  ]).map(({ key, icon: Icon, label, desc }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setRol(key)}
                      className={`group flex flex-col items-center gap-2 py-4 px-2 rounded-2xl border-2 transition-all duration-150 active:scale-[0.97]
                        ${rol === key
                          ? 'border-[#1A5C38] bg-[#1A5C38]/[0.07] text-[#1A5C38]'
                          : 'border-gray-100 text-gray-400 bg-gray-50 hover:border-gray-200'}`}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                        rol === key ? 'bg-[#1A5C38]/[0.12]' : 'bg-white'
                      }`}>
                        <Icon size={22} strokeWidth={rol === key ? 2.2 : 1.5} />
                      </div>
                      <div className="text-center">
                        <p className="text-[14px] font-bold leading-none">{label}</p>
                        <p className="text-[10px] mt-1 leading-tight opacity-60">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Correo electrónico</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="correo@ejemplo.com"
                      className="w-full bg-gray-50 rounded-xl px-4 py-3 text-[15px] text-gray-900 outline-none focus:ring-2 focus:ring-[#1A5C38]/25 focus:bg-white border border-gray-100 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Contraseña</label>
                    <div className="relative">
                      <input
                        type={showPwd ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full bg-gray-50 rounded-xl px-4 py-3 text-[15px] text-gray-900 outline-none focus:ring-2 focus:ring-[#1A5C38]/25 focus:bg-white border border-gray-100 pr-11 transition-colors"
                      />
                      <button type="button" onClick={() => setShowPwd(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                        {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-xl px-4 py-3">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#1A5C38] text-white rounded-2xl py-3.5 text-[15px] font-black tracking-wide active:opacity-80 hover:bg-[#1e6b42] transition-colors disabled:opacity-40 shadow-lg shadow-[#1A5C38]/30"
                  >
                    {loading ? 'Ingresando…' : 'Entrar'}
                  </button>
                </form>

                <p className="text-center text-[13px] text-gray-400 pt-1">
                  ¿Aún no tienes cuenta?{' '}
                  <Link to="/registro" className="text-[#1A5C38] font-bold hover:underline">
                    Regístrate
                  </Link>
                </p>
              </div>
            </div>

            {/* Footer note below card */}
            <p className="mt-4 text-center text-[11px] text-white/30 leading-snug px-4 lg:hidden">
              Sistema de Ordenamiento de la Producción y Comercialización del Maíz Blanco en México
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
