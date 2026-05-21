import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

  const field = (key: string, label: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={(form as any)[key]}
        onChange={e => set(key, e.target.value)}
        placeholder={placeholder}
        required
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]"
      />
    </div>
  );

  return (
    <div className="min-h-svh bg-gradient-to-br from-[#1A5C38] to-[#2d7a52] flex flex-col items-center justify-start pt-10 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
        <div className="text-center mb-5">
          <h1 className="text-2xl font-black text-[#1A5C38]">Crear cuenta</h1>
          <p className="text-sm text-gray-500">Módulo Bodega</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {field('nombre_completo', 'Nombre completo', 'text', 'Juan Pérez González')}
          {field('email', 'Correo electrónico', 'email', 'correo@ejemplo.com')}
          {field('telefono', 'Teléfono celular (10 dígitos)', 'tel', '6671234567')}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado donde opera</label>
            <select
              value={form.state_id}
              onChange={e => set('state_id', e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]"
            >
              <option value="">Selecciona estado</option>
              {states.map((s: any) => (
                <option key={s.state_id || s.id} value={s.state_id || s.id}>{s.name || s.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Municipio</label>
            <select
              value={form.municipality_id}
              onChange={e => set('municipality_id', e.target.value)}
              required
              disabled={!form.state_id}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38] disabled:bg-gray-100"
            >
              <option value="">Selecciona municipio</option>
              {municipalities.map((m: any) => (
                <option key={m.municipality_id || m.id} value={m.municipality_id || m.id}>{m.name || m.nombre}</option>
              ))}
            </select>
          </div>

          {field('password', 'Contraseña (mín. 8 caracteres)', 'password', '••••••••')}
          {field('confirm', 'Confirmar contraseña', 'password', '••••••••')}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1A5C38] text-white py-3 rounded-xl font-semibold text-sm
              hover:bg-green-900 active:scale-95 transition-all disabled:opacity-60"
          >
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-[#1A5C38] font-semibold hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
