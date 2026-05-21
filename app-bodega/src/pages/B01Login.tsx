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
      setAuth(res.token, res.user || res);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-svh bg-gradient-to-br from-[#1A5C38] to-[#2d7a52] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <img src="/favicon.svg" alt="SIMAC" className="w-16 h-16" />
          </div>
          <h1 className="text-2xl font-black text-[#1A5C38]">SIMAC</h1>
          <p className="text-xs text-gray-500 mt-1 leading-snug px-2">
            Sistema de Ordenamiento de la Producción<br />
            y Comercialización del Maíz Blanco en México
          </p>
        </div>

        {/* Selector de rol */}
        <p className="text-sm font-semibold text-gray-700 mb-3">¿Quién eres?</p>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {([
            { key: 'bodega', emoji: '🏪', label: 'Soy Bodega' },
            { key: 'industria', emoji: '🏭', label: 'Soy Industria' },
          ] as const).map(({ key, emoji, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setRol(key)}
              className={`flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition-all font-medium text-sm
                ${rol === key
                  ? 'border-[#1A5C38] bg-green-50 text-[#1A5C38]'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              <span className="text-2xl">{emoji}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="correo@ejemplo.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1A5C38] text-white py-3 rounded-xl font-semibold text-sm
              hover:bg-[#16503.1] active:scale-95 transition-all disabled:opacity-60"
          >
            {loading ? 'Ingresando…' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          ¿Aún no tienes cuenta?{' '}
          <Link to="/registro" className="text-[#1A5C38] font-semibold hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
