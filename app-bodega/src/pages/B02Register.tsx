import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Warehouse, Factory, Eye, EyeOff, AlertCircle, Loader2, Wheat, Check } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/auth';

type Rol = 'bodega' | 'industria';

export default function B02Register() {
  const [rol, setRol] = useState<Rol>('bodega');
  const [form, setForm] = useState({
    nombre_completo: '', email: '', telefono: '', curp: '',
    state_id: '', municipality_id: '', password: '', confirm: '',
  });
  const [states, setStates] = useState<any[]>([]);
  const [municipalities, setMunicipalities] = useState<any[]>([]);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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

  function normalizarTexto(v: string) {
    return v.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  }
  function setNombre(v: string) { setForm(f => ({ ...f, nombre_completo: normalizarTexto(v) })); }
  function setTelefono(v: string) { setForm(f => ({ ...f, telefono: v.replace(/\D/g, '').slice(0, 10) })); }
  function setCurp(v: string) { setForm(f => ({ ...f, curp: normalizarTexto(v).replace(/[^A-Z0-9]/g, '').slice(0, 18) })); }
  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{2}[A-Z]{3}[A-Z0-9]\d$/;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre_completo.trim()) { setError('El nombre es obligatorio'); return; }
    if (form.telefono.length !== 10) { setError('El teléfono debe tener exactamente 10 dígitos'); return; }
    if (!form.curp.trim()) { setError('La CURP es obligatoria'); return; }
    if (form.curp.length !== 18 || !CURP_REGEX.test(form.curp)) {
      setError('CURP inválida. Revisa el formato.');
      return;
    }
    if (!form.state_id) { setError('Selecciona tu estado'); return; }
    if (!form.municipality_id) { setError('Selecciona tu municipio'); return; }
    if (form.password !== form.confirm) { setError('Las contraseñas no coinciden'); return; }
    if (form.password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    setError('');
    setLoading(true);
    try {
      const payload: any = {
        nombre_completo: form.nombre_completo.trim(),
        email: form.email.trim(),
        telefono: form.telefono,
        curp: form.curp,
        state_id: form.state_id,
        municipality_id: form.municipality_id,
        password: form.password,
        rol,
      };
      const res = await api.auth.registro(payload);
      if (res.token) {
        const u = res.usuario || res.user;
        setAuth(res.token, { ...u, userId: u?.id ?? u?.userId });
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

  const inp =
    'w-full bg-white/10 ring-1 ring-white/20 rounded-xl px-4 py-3.5 text-xs text-white ' +
    'placeholder-white/30 focus:ring-2 focus:ring-white/50 focus:outline-none transition-all';
  const sel = `${inp} appearance-none`;
  const lbl = 'block text-xs font-semibold text-white/50 uppercase tracking-wide mb-1.5';

  return (
    <div
      className="relative min-h-[100dvh] flex flex-col overflow-x-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#061510] via-[#0c2e1a] to-[#1A5C38]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_50%_at_50%_0%,rgba(52,208,121,0.1),transparent)]" />
      </div>

      {/* Header */}
      <div className="relative flex items-center px-4 py-3 flex-shrink-0">
        <button
          onClick={() => navigate('/login')}
          className="p-2 -ml-1 rounded-xl hover:bg-white/10 active:bg-white/15 transition-colors flex items-center gap-1 text-white/70"
        >
          <ChevronLeft size={13} /> <span className="text-xs font-medium">Iniciar sesión</span>
        </button>
      </div>

      {/* Content */}
      <div className="relative flex-1 px-5 pb-8">
        <div className="w-full max-w-sm mx-auto animate-auth-in">

          {/* Title */}
          <div className="mb-5">
            <h1 className="text-xs sm:text-3xl font-bold text-white tracking-tight">Crear cuenta</h1>
            <p className="text-white/50 text-xs sm:text-xs mt-1">Bodega o Industria · Plan Maíz 2026</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Tipo de cuenta */}
            <div>
              <p className={lbl}>Tipo de cuenta</p>
              <div className="grid grid-cols-2 gap-2.5">
                {([
                  { key: 'bodega' as Rol, icon: Warehouse, label: 'Bodega', desc: 'Almacenista · Acopiador' },
                  { key: 'industria' as Rol, icon: Factory, label: 'Industria', desc: 'Tortillería · Nixtamal' },
                ]).map(({ key, icon: Icon, label, desc }) => (
                  <button key={key} type="button" onClick={() => setRol(key)}
                    className={`flex flex-col items-center gap-2 py-4 px-3 rounded-2xl ring-1 transition-all duration-150 active:scale-[0.97]
                      ${rol === key ? 'ring-2 ring-white bg-white/15' : 'ring-white/15 bg-white/5 hover:bg-white/10'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${rol === key ? 'bg-white' : 'bg-white/10'}`}>
                      <Icon size={12} className={rol === key ? 'text-[#1A5C38]' : 'text-white/60'} strokeWidth={2} />
                    </div>
                    <div className="text-center">
                      <p className={`text-xs font-bold leading-none ${rol === key ? 'text-white' : 'text-white/70'}`}>{label}</p>
                      <p className="text-[10px] mt-1 text-white/40 leading-tight">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Datos personales */}
            <div className="space-y-2.5">
              <p className={lbl}>Datos personales</p>
              <input type="text" value={form.nombre_completo} onChange={e => setNombre(e.target.value)}
                placeholder="NOMBRE COMPLETO" required autoCapitalize="characters" className={`${inp} tracking-wide`} />
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="Correo electrónico" required autoCapitalize="off" inputMode="email" className={inp} />
              <input type="tel" value={form.telefono} onChange={e => setTelefono(e.target.value)}
                placeholder="Teléfono (10 dígitos)" required maxLength={10} inputMode="numeric" className={`${inp} font-mono tracking-wider`} />
              <input type="text" value={form.curp} onChange={e => setCurp(e.target.value)}
                placeholder="CURP (18 caracteres)" required maxLength={18} autoCapitalize="characters" className={`${inp} font-mono tracking-widest`} />
              {form.curp.length > 0 && form.curp.length < 18 && (
                <p className="text-[9.5px] text-amber-300/90 pl-1">{form.curp.length}/18 caracteres</p>
              )}
              {form.curp.length === 18 && !CURP_REGEX.test(form.curp) && (
                <p className="text-[9.5px] text-red-300 pl-1 flex items-center gap-1"><AlertCircle size={12} /> Formato de CURP inválido</p>
              )}
              {form.curp.length === 18 && CURP_REGEX.test(form.curp) && (
                <p className="text-[9.5px] text-green-300 pl-1 flex items-center gap-1"><Check size={12} /> CURP válida</p>
              )}
            </div>

            {/* Ubicación */}
            <div className="space-y-2.5">
              <p className={lbl}>Ubicación</p>
              <select value={form.state_id}
                onChange={e => { set('state_id', e.target.value); set('municipality_id', ''); }}
                required className={sel} style={{ colorScheme: 'dark' }}>
                <option value="" style={{ background: '#0c2e1a' }}>Estado donde opera</option>
                {states.map((s: any) => (
                  <option key={s.state_id||s.id} value={s.state_id||s.id} style={{ background: '#0c2e1a' }}>{s.name||s.nombre}</option>
                ))}
              </select>
              <select value={form.municipality_id}
                onChange={e => set('municipality_id', e.target.value)}
                required disabled={!form.state_id} className={`${sel} disabled:opacity-30`} style={{ colorScheme: 'dark' }}>
                <option value="" style={{ background: '#0c2e1a' }}>{form.state_id ? 'Municipio' : 'Primero elige el estado'}</option>
                {municipalities.map((m: any) => (
                  <option key={m.municipality_id||m.id} value={m.municipality_id||m.id} style={{ background: '#0c2e1a' }}>{m.name||m.nombre}</option>
                ))}
              </select>
            </div>

            {/* Contraseña */}
            <div className="space-y-2.5">
              <p className={lbl}>Contraseña</p>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} value={form.password}
                  onChange={e => set('password', e.target.value)} placeholder="Mínimo 8 caracteres" required className={`${inp} pr-12`} />
                <button type="button" onClick={() => setShowPwd(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                  {showPwd ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              <div className="relative">
                <input type={showConfirm ? 'text' : 'password'} value={form.confirm}
                  onChange={e => set('confirm', e.target.value)} placeholder="Confirmar contraseña" required className={`${inp} pr-12`} />
                <button type="button" onClick={() => setShowConfirm(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                  {showConfirm ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/15 ring-1 ring-red-400/30 rounded-xl text-red-300 text-xs flex items-start gap-2">
                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-white hover:bg-white/90 active:bg-white/80 text-[#1A5C38] py-4 rounded-2xl text-xs font-bold
                         disabled:opacity-40 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={13} className="animate-spin" /> Creando cuenta…</> : 'Crear cuenta'}
            </button>
          </form>

          {/* Opciones */}
          <div className="mt-6 space-y-3 text-center">
            <button onClick={() => navigate('/login')}
              className="text-xs font-semibold text-white/60 hover:text-white transition-colors">
              ¿Ya tienes cuenta? Inicia sesión
            </button>
            <div className="border-t border-white/10 pt-4">
              <button
                onClick={() => navigate('/bienvenida', { state: { menu: 'productor' } })}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-300 hover:text-green-200 transition-colors"
              >
                <Wheat size={13} /> ¿Eres productor? Ver opciones
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
