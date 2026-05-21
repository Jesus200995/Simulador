import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/auth';

export default function B02Register() {
  const [form, setForm] = useState({
    nombre_completo: '', email: '', telefono: '',
    state_id: '', municipality_id: '', password: '', confirm: '',
  });
  const [states, setStates] = useState<any[]>([]);
  const [municipalities, setMunicipalities] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    api.auth.states().then((res: any) => setStates(res.states || res)).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.state_id) {
      api.auth.municipalities(form.state_id)
        .then((res: any) => setMunicipalities(res.municipalities || res))
        .catch(() => {});
    }
  }, [form.state_id]);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Las contraseñas no coinciden'); return; }
    if (form.password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await api.auth.registro({
        nombre_completo: form.nombre_completo,
        email: form.email,
        telefono: form.telefono,
        state_id: form.state_id,
        municipality_id: form.municipality_id,
        password: form.password,
        rol: 'bodega',
      });
      if (res.token) {
        setAuth(res.token, res.user || res);
        navigate('/bodegas/seleccionar');
      } else {
        navigate('/login');
      }
    } catch (err: any) {
      setError(err.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = 'w-full bg-[#F2F2F7] rounded-xl px-4 py-3.5 text-[17px] outline-none focus:ring-2 focus:ring-[#1A5C38]/30 border-0';
  const labelClass = 'block text-[15px] font-medium text-gray-600 mb-1.5';

  return (
    <div className="min-h-dvh bg-[#F2F2F7] overflow-x-hidden">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-200/50 px-4 h-14 flex items-center">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-0.5 text-[#1A5C38] text-[15px] font-medium active:opacity-60 transition-opacity"
        >
          <ChevronLeft size={20} strokeWidth={2.5} className="-ml-1" />
          Iniciar sesión
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900">Crear cuenta</h1>
          <p className="text-[15px] text-gray-500 mt-1">Módulo Bodega — SOMAC</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Datos personales */}
          <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-5 space-y-4">
            <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Datos personales</p>
            <div>
              <label className={labelClass}>Nombre completo</label>
              <input type="text" value={form.nombre_completo} onChange={e => set('nombre_completo', e.target.value)}
                placeholder="Juan Pérez González" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Correo electrónico</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="correo@ejemplo.com" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Teléfono celular</label>
              <input type="tel" value={form.telefono} onChange={e => set('telefono', e.target.value)}
                placeholder="6671234567" required className={inputClass} />
            </div>
          </div>

          {/* Ubicación */}
          <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-5 space-y-4">
            <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Ubicación</p>
            <div>
              <label className={labelClass}>Estado donde opera</label>
              <select value={form.state_id} onChange={e => set('state_id', e.target.value)} required className={inputClass}>
                <option value="">Selecciona estado</option>
                {states.map((s: any) => (
                  <option key={s.state_id || s.id} value={s.state_id || s.id}>{s.name || s.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Municipio</label>
              <select value={form.municipality_id} onChange={e => set('municipality_id', e.target.value)} required
                disabled={!form.state_id} className={`${inputClass} disabled:opacity-50`}>
                <option value="">Selecciona municipio</option>
                {municipalities.map((m: any) => (
                  <option key={m.municipality_id || m.id} value={m.municipality_id || m.id}>{m.name || m.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Contraseña */}
          <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-5 space-y-4">
            <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Contraseña</p>
            <div>
              <label className={labelClass}>Contraseña (mín. 8 caracteres)</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                placeholder="••••••••" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Confirmar contraseña</label>
              <input type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)}
                placeholder="••••••••" required className={inputClass} />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-[14px] rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-[#1A5C38] text-white rounded-2xl py-4 text-[17px] font-semibold active:opacity-80 transition-opacity disabled:opacity-40">
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-[15px] text-gray-500 pb-8">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-[#1A5C38] font-semibold">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
