import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Warehouse, Factory, Eye, EyeOff, Wheat, ShieldCheck } from 'lucide-react';
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
    return v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  }

  function setNombre(v: string) {
    setForm(f => ({ ...f, nombre_completo: normalizarTexto(v) }));
  }

  function setTelefono(v: string) {
    const solo = v.replace(/\D/g, '').slice(0, 10);
    setForm(f => ({ ...f, telefono: solo }));
  }

  function setCurp(v: string) {
    const upper = normalizarTexto(v).replace(/[^A-Z0-9]/g, '').slice(0, 18);
    setForm(f => ({ ...f, curp: upper }));
  }

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{2}[A-Z]{3}[A-Z0-9]\d$/;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre_completo.trim()) { setError('El nombre es obligatorio'); return; }
    if (form.telefono.length !== 10) { setError('El teléfono debe tener exactamente 10 dígitos'); return; }
    if (!form.curp.trim()) { setError('La CURP es obligatoria'); return; }
    if (form.curp.length !== 18 || !CURP_REGEX.test(form.curp)) {
      setError('CURP inválida. Formato: 4 letras + 6 dígitos + H/M + 2 letras + 3 letras + 1 alfanum. + 1 dígito');
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

  const inp = 'w-full bg-[#F5F5F7] rounded-[14px] px-4 py-3.5 text-[15px] text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#1A5C38]/20 focus:bg-white border-0 transition-all';
  const lbl = 'text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em]';

  return (
    <div className="relative overflow-x-hidden">
      {/* Fixed background — same as login */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#071f12] via-[#0f3d22] to-[#1A5C38]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_60%_30%,rgba(45,122,80,0.6),transparent)]" />
        <div className="absolute bottom-0 inset-x-0 h-32 flex items-end justify-around px-6 opacity-[0.06]">
          {[0,1,2,3,4,5,6,7,8,9].map(i => (
            <Wheat key={i} size={i%3===0?52:i%2===0?40:30} className="text-white mb-1" style={{transform:`rotate(${(i-4)*3}deg)`}} />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20" />
      </div>

      {/* Scrollable overlay */}
      <div
        className="relative min-h-[100dvh] flex flex-col items-center px-4 py-8 overflow-x-hidden"
        style={{ paddingTop: 'max(2rem, env(safe-area-inset-top))', paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >

        {/* Back button */}
        <div className="animate-auth-in w-full max-w-[440px] mb-4">
          <button onClick={() => navigate('/login')}
            className="flex items-center gap-1 text-green-200/70 text-[13px] font-medium hover:text-green-200 transition-colors active:opacity-60">
            <ChevronLeft size={16} strokeWidth={2.5} className="-ml-0.5" />
            Iniciar sesión
          </button>
        </div>

        {/* Logo */}
        <div className="animate-auth-in flex items-center gap-3 mb-6" style={{ animationDelay: '0.05s' }}>
          <div className="w-[46px] h-[46px] rounded-[12px] bg-white/15 backdrop-blur-md ring-1 ring-white/20 flex items-center justify-center shadow-xl">
            <img src="/icono.png" alt="SIMAC" className="w-8 h-8 rounded-[8px]" />
          </div>
          <div>
            <p className="text-[24px] font-black text-white tracking-[-0.5px] leading-none">SIMAC</p>
            <p className="text-[11px] text-green-300/70 font-medium mt-0.5 tracking-wide">Plan Nacional Maíz 2026</p>
          </div>
        </div>

        {/* Card */}
        <div className="animate-auth-in w-full max-w-[440px] bg-white rounded-[28px] shadow-[0_24px_64px_rgba(0,0,0,0.45)] overflow-hidden mb-8" style={{ animationDelay: '0.1s' }}>
          <div className="h-[3px] bg-gradient-to-r from-[#1A5C38] via-[#34d079] to-[#1A5C38]" />

          <div className="px-8 pt-7 pb-2">
            <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Crear cuenta</h1>
            <p className="text-[13px] text-gray-400 mt-1">Completa tu información para comenzar</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 pt-5 pb-7 space-y-5">

            {/* Tipo de cuenta */}
            <div className="space-y-2">
              <p className={lbl}>Tipo de cuenta</p>
              <div className="grid grid-cols-2 gap-2.5">
                {([
                  { key: 'bodega' as Rol, icon: Warehouse, label: 'Bodega', desc: 'Almacenista · Acopiador' },
                  { key: 'industria' as Rol, icon: Factory, label: 'Industria', desc: 'Tortillería · Nixtamal' },
                ]).map(({ key, icon: Icon, label, desc }) => (
                  <button key={key} type="button" onClick={() => setRol(key)}
                    className={`flex flex-col items-center gap-2 py-4 px-3 rounded-[16px] border-2 transition-all duration-150 active:scale-[0.97]
                      ${rol === key
                        ? 'border-[#1A5C38] bg-[#1A5C38]/[0.06] text-[#1A5C38]'
                        : 'border-gray-100 text-gray-400 bg-[#F5F5F7] hover:border-gray-200'}`}>
                    <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center ${
                      rol === key ? 'bg-[#1A5C38]/10' : 'bg-white'
                    }`}>
                      <Icon size={20} strokeWidth={rol === key ? 2.2 : 1.5} />
                    </div>
                    <div className="text-center">
                      <p className="text-[14px] font-semibold leading-none">{label}</p>
                      <p className="text-[10px] mt-0.5 opacity-55 leading-tight">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Datos personales */}
            <div className="space-y-2.5">
              <p className={lbl}>Datos personales</p>
              <input type="text" value={form.nombre_completo}
                onChange={e => setNombre(e.target.value)}
                placeholder="NOMBRE COMPLETO" required autoCapitalize="characters"
                className={`${inp} uppercase tracking-wide`} />
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="Correo electrónico" required className={inp} />
              <input type="tel" value={form.telefono}
                onChange={e => setTelefono(e.target.value)}
                placeholder="10 dígitos" required maxLength={10} inputMode="numeric"
                className={inp} />
              <input type="text" value={form.curp}
                onChange={e => setCurp(e.target.value)}
                placeholder="18 caracteres" required maxLength={18} autoCapitalize="characters"
                className={`${inp} font-mono tracking-widest uppercase`} />
              {form.curp.length > 0 && form.curp.length < 18 && (
                <p className="text-[11px] text-orange-500 mt-1">{form.curp.length}/18 caracteres</p>
              )}
              {form.curp.length === 18 && !CURP_REGEX.test(form.curp) && (
                <p className="text-[11px] text-red-500 mt-1">Formato de CURP inválido</p>
              )}
              {form.curp.length === 18 && CURP_REGEX.test(form.curp) && (
                <p className="text-[11px] text-[#1A5C38] mt-1">CURP válida</p>
              )}
            </div>

            {/* Ubicación */}
            <div className="space-y-2.5">
              <p className={lbl}>Ubicación</p>
              <select value={form.state_id}
                onChange={e => { set('state_id', e.target.value); set('municipality_id', ''); }}
                required className={inp}>
                <option value="">Estado donde opera</option>
                {states.map((s: any) => (
                  <option key={s.state_id||s.id} value={s.state_id||s.id}>{s.name||s.nombre}</option>
                ))}
              </select>
              <select value={form.municipality_id}
                onChange={e => set('municipality_id', e.target.value)}
                required disabled={!form.state_id}
                className={`${inp} disabled:opacity-40`}>
                <option value="">Municipio</option>
                {municipalities.map((m: any) => (
                  <option key={m.municipality_id||m.id} value={m.municipality_id||m.id}>{m.name||m.nombre}</option>
                ))}
              </select>
            </div>

            {/* Contraseña */}
            <div className="space-y-2.5">
              <p className={lbl}>Contraseña</p>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="Mínimo 8 caracteres" required className={`${inp} pr-12`} />
                <button type="button" onClick={() => setShowPwd(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <div className="relative">
                <input type={showConfirm ? 'text' : 'password'} value={form.confirm}
                  onChange={e => set('confirm', e.target.value)}
                  placeholder="Confirmar contraseña" required className={`${inp} pr-12`} />
                <button type="button" onClick={() => setShowConfirm(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
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
              className="w-full bg-[#1A5C38] hover:bg-[#1e6b42] active:scale-[0.98] text-white rounded-[14px] py-3.5 text-[15px] font-semibold transition-all disabled:opacity-40 shadow-[0_4px_14px_rgba(26,92,56,0.4)]">
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Creando cuenta…</span>
                : 'Crear cuenta'}
            </button>

            <p className="text-center text-[13px] text-gray-400">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-[#1A5C38] font-semibold hover:underline">Inicia sesión</Link>
            </p>

          </form>
        </div>

      </div>
    </div>
  );
}
