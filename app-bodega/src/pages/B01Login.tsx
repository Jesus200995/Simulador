import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/auth';

type Rol = 'bodega' | 'industria';

export default function B01Login() {
  const [rol, setRol] = useState<Rol | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-dvh bg-gradient-to-b from-[#1A5C38] via-[#1e6b42] to-[#2d7a52] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Logo section */}
        <div className="px-8 pt-10 pb-6 text-center">
          <div className="flex justify-center mb-4">
            <img src="/icono.png" alt="SIMAC" className="w-20 h-20 rounded-2xl ring-2 ring-[#4ade80]" />
          </div>
          <h1 className="text-[28px] font-black text-[#1A5C38] tracking-tight">SIMAC</h1>
          <p className="text-[13px] text-gray-400 mt-1 leading-snug">
            Sistema de Ordenamiento de la Producción<br />
            y Comercialización del Maíz Blanco en México
          </p>
        </div>

        <div className="px-6 pb-8 space-y-5">
          {/* Selector de rol */}
          <div>
            <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2.5">Tipo de cuenta</p>
            <div className="grid grid-cols-2 gap-2.5">
              {([
                { key: 'bodega', emoji: '🏪', label: 'Soy Bodega' },
                { key: 'industria', emoji: '🏭', label: 'Soy Industria' },
              ] as const).map(({ key, emoji, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRol(key)}
                  className={`flex flex-col items-center gap-1.5 py-4 rounded-2xl border-2 transition-all font-semibold text-[15px]
                    ${rol === key
                      ? 'border-[#1A5C38] bg-[#1A5C38]/5 text-[#1A5C38]'
                      : 'border-gray-200 text-gray-500 bg-[#F2F2F7]'}`}
                >
                  <span className="text-2xl">{emoji}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          {rol && (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[15px] font-medium text-gray-600 mb-1.5">Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="correo@ejemplo.com"
                  className="w-full bg-[#F2F2F7] rounded-xl px-4 py-3.5 text-[17px] outline-none focus:ring-2 focus:ring-[#1A5C38]/30 border-0"
                />
              </div>
              <div>
                <label className="block text-[15px] font-medium text-gray-600 mb-1.5">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#F2F2F7] rounded-xl px-4 py-3.5 text-[17px] outline-none focus:ring-2 focus:ring-[#1A5C38]/30 border-0"
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 text-[14px] rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1A5C38] text-white rounded-2xl py-4 text-[17px] font-semibold active:opacity-80 transition-opacity disabled:opacity-40 mt-1"
              >
                {loading ? 'Ingresando…' : 'Entrar'}
              </button>
            </form>
          )}

          <p className="text-center text-[15px] text-gray-500">
            ¿Aún no tienes cuenta?{' '}
            <Link to="/registro" className="text-[#1A5C38] font-semibold">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
