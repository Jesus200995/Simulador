import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/auth';
import { Warehouse, Factory, Eye, EyeOff } from 'lucide-react';

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
    <div className="min-h-dvh relative flex flex-col">
      {/* Background: green gradient simulating field */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0d3320] via-[#1A5C38] to-[#2d7a52]" />
      {/* Decorative grain/texture overlay */}
      <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'7\' cy=\'7\' r=\'1\'/%3E%3Ccircle cx=\'27\' cy=\'27\' r=\'1\'/%3E%3Ccircle cx=\'47\' cy=\'47\' r=\'1\'/%3E%3Ccircle cx=\'17\' cy=\'47\' r=\'1\'/%3E%3Ccircle cx=\'47\' cy=\'17\' r=\'1\'/%3E%3C/g%3E%3C/svg%3E")' }} />
      {/* Decorative circles */}
      <div className="absolute top-[-80px] right-[-80px] w-64 h-64 rounded-full bg-white/[0.04]" />
      <div className="absolute bottom-[-60px] left-[-60px] w-48 h-48 rounded-full bg-white/[0.04]" />

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-10 min-h-dvh">

        {/* Branding top */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30">
              <img src="/icono.png" alt="SOMEC" className="w-14 h-14 rounded-2xl" />
            </div>
          </div>
          <h1 className="text-[32px] font-black text-white tracking-tight leading-none">SOMEC</h1>
          <p className="text-green-200/80 text-[13px] mt-1.5 leading-snug">
            Plan Nacional Maíz 2026
          </p>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm bg-white/[0.97] backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">

          {/* Card header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <p className="text-[17px] font-bold text-gray-900">Iniciar sesión</p>
            <p className="text-[13px] text-gray-400 mt-0.5">Elige tu tipo de cuenta para continuar</p>
          </div>

          <div className="px-6 py-5 space-y-4">
            {/* Selector de rol */}
            <div className="grid grid-cols-2 gap-2.5">
              {([
                { key: 'bodega' as Rol, icon: Warehouse, label: 'Bodega', desc: 'Almacenista / Acopiador' },
                { key: 'industria' as Rol, icon: Factory, label: 'Industria', desc: 'Tortillería / Nixtamal' },
              ]).map(({ key, icon: Icon, label, desc }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRol(key)}
                  className={`flex flex-col items-center gap-2 py-4 px-2 rounded-2xl border-2 transition-all active:scale-[0.97]
                    ${rol === key
                      ? 'border-[#1A5C38] bg-[#1A5C38]/[0.06] text-[#1A5C38]'
                      : 'border-gray-200/70 text-gray-400 bg-[#F2F2F7]'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    rol === key ? 'bg-[#1A5C38]/10' : 'bg-white'
                  }`}>
                    <Icon size={20} strokeWidth={rol === key ? 2.2 : 1.6} />
                  </div>
                  <div className="text-center">
                    <p className="text-[14px] font-bold leading-none">{label}</p>
                    <p className="text-[10px] mt-0.5 leading-tight opacity-70">{desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[13px] font-semibold text-gray-500 mb-1">Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="correo@ejemplo.com"
                  className="w-full bg-[#F2F2F7] rounded-xl px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-[#1A5C38]/30 border-0"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-gray-500 mb-1">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-[#F2F2F7] rounded-xl px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-[#1A5C38]/30 border-0 pr-11"
                  />
                  <button type="button" onClick={() => setShowPwd(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 active:text-gray-600">
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-xl px-4 py-3 flex items-start gap-2">
                  <span className="flex-1">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1A5C38] text-white rounded-2xl py-3.5 text-[16px] font-bold active:opacity-80 transition-opacity disabled:opacity-40"
              >
                {loading ? 'Ingresando…' : 'Entrar'}
              </button>
            </form>

            <p className="text-center text-[14px] text-gray-400">
              ¿Aún no tienes cuenta?{' '}
              <Link to="/registro" className="text-[#1A5C38] font-bold">
                Regístrate
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-green-200/50 max-w-xs">
          Sistema de Ordenamiento de la Producción y Comercialización del Maíz Blanco en México
        </p>
      </div>
    </div>
  );
}
