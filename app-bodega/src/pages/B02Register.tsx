import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Warehouse, Factory, Eye, EyeOff, Wheat } from 'lucide-react';
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

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Las contraseñas no coinciden'); return; }
    if (form.password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    setError('');
    setLoading(true);
    try {
      const payload: any = {
        nombre_completo: form.nombre_completo,
        email: form.email,
        telefono: form.telefono,
        state_id: form.state_id,
        municipality_id: form.municipality_id,
        password: form.password,
        rol,
      };
      if (form.curp.trim()) payload.curp = form.curp.trim().toUpperCase();

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

  const inp = 'w-full bg-gray-50 rounded-xl px-4 py-3 text-[15px] text-gray-900 outline-none focus:ring-2 focus:ring-[#1A5C38]/25 focus:bg-white border border-gray-100 transition-colors';
  const lbl = 'block text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-1.5';

  return (
    <div className="relative">

      {/* ── Fixed background (same as login) ───────────── */}
      <div className="fixed inset-0 bg-[#0d3320]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a2918] via-[#1A5C38] to-[#145c30]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(34,115,63,0.55),transparent)]" />
        <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='80' height='80' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: '160px 160px',
        }} />
        <div className="absolute bottom-0 left-0 right-0 h-40 opacity-[0.07] flex items-end justify-around px-8">
          {[0,1,2,3,4,5,6,7].map(i => (
            <Wheat key={i} size={i % 2 === 0 ? 48 : 36} className="text-green-300 mb-2" style={{ transform: `rotate(${(i-3)*4}deg)` }} />
          ))}
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_100%_at_50%_50%,transparent_40%,rgba(0,0,0,0.45))]" />
      </div>

      {/* ── Scrollable content ─────────────────────────── */}
      <div className="relative min-h-screen">

        {/* Back button */}
        <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-5 pb-2">
          <button onClick={() => navigate('/login')}
            className="flex items-center gap-1 text-green-200/80 text-[14px] font-medium active:opacity-60">
            <ChevronLeft size={17} strokeWidth={2.5} className="-ml-1" />
            Iniciar sesión
          </button>
        </div>

        {/* Responsive layout */}
        <div className="flex flex-col lg:flex-row min-h-screen">

          {/* Left: Branding — desktop only */}
          <div className="hidden lg:flex flex-col justify-center flex-1 px-16 py-20">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/25 shadow-2xl">
                <img src="/icono.png" alt="SOMEC" className="w-12 h-12 rounded-xl" />
              </div>
              <div>
                <h1 className="text-[36px] font-black text-white tracking-tight leading-none">SOMEC</h1>
                <p className="text-green-300/80 text-[13px] font-medium mt-0.5">Plan Nacional Maíz 2026</p>
              </div>
            </div>
            <p className="text-white/70 text-[15px] leading-relaxed max-w-sm mb-8">
              Crea tu cuenta para acceder al sistema de acopio y comercialización de maíz.
            </p>
            <div className="flex flex-col gap-3">
              {[
                { icon: Warehouse, text: 'Bodega — gestiona inventario y señales de compra' },
                { icon: Factory,   text: 'Industria — tortillerías y plantas nixtamaleras' },
                { icon: Wheat,     text: 'Conectado al Padrón Nacional de Productores' },
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

          {/* Right: Form card */}
          <div className="flex-shrink-0 w-full lg:w-[480px] flex flex-col justify-center px-4 lg:px-10 pt-20 pb-10">

            {/* Mobile branding */}
            <div className="lg:hidden text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm ring-2 ring-white/30 mb-3">
                <img src="/icono.png" alt="SOMEC" className="w-10 h-10 rounded-xl" />
              </div>
              <h1 className="text-[24px] font-black text-white">Crear cuenta</h1>
              <p className="text-green-200/70 text-[13px] mt-0.5">SOMEC · Plan Nacional Maíz 2026</p>
            </div>

            <div className="bg-white/[0.96] backdrop-blur-2xl rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.4)] overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-[#1A5C38] via-[#4ade80] to-[#1A5C38]" />

              <div className="px-6 pt-6 pb-3 border-b border-gray-100">
                <p className="text-[20px] font-black text-gray-900">Registro</p>
                <p className="text-[13px] text-gray-400 mt-0.5">Completa tu información para comenzar</p>
              </div>

              <div className="px-6 py-5">
                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* Tipo de cuenta */}
                  <div>
                    <p className={lbl}>Tipo de cuenta</p>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { key: 'bodega' as Rol, icon: Warehouse, label: 'Bodega', desc: 'Almacenista · Acopiador' },
                        { key: 'industria' as Rol, icon: Factory, label: 'Industria', desc: 'Tortillería · Nixtamal' },
                      ]).map(({ key, icon: Icon, label, desc }) => (
                        <button key={key} type="button" onClick={() => setRol(key)}
                          className={`flex flex-col items-center gap-2 py-3.5 px-2 rounded-2xl border-2 transition-all duration-150 active:scale-[0.97]
                            ${rol === key ? 'border-[#1A5C38] bg-[#1A5C38]/[0.07] text-[#1A5C38]' : 'border-gray-100 text-gray-400 bg-gray-50'}`}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            rol === key ? 'bg-[#1A5C38]/[0.12]' : 'bg-white'
                          }`}>
                            <Icon size={20} strokeWidth={rol === key ? 2.2 : 1.5} />
                          </div>
                          <div className="text-center">
                            <p className="text-[13px] font-bold leading-none">{label}</p>
                            <p className="text-[10px] mt-0.5 opacity-60 leading-tight">{desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Datos personales */}
                  <div className="space-y-3">
                    <p className={lbl}>Datos personales</p>
                    <input type="text" value={form.nombre_completo} onChange={e => set('nombre_completo', e.target.value)}
                      placeholder="Nombre completo" required className={inp} />
                    <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                      placeholder="Correo electrónico" required className={inp} />
                    <input type="tel" value={form.telefono} onChange={e => set('telefono', e.target.value)}
                      placeholder="Teléfono (10 dígitos)" required className={inp} />
                    <input type="text" value={form.curp} onChange={e => set('curp', e.target.value.toUpperCase())}
                      placeholder="CURP (opcional)" maxLength={18} className={`${inp} font-mono tracking-widest`} />
                  </div>

                  {/* Ubicación */}
                  <div className="space-y-3">
                    <p className={lbl}>Ubicación</p>
                    <select value={form.state_id} onChange={e => { set('state_id', e.target.value); set('municipality_id', ''); }} required className={inp}>
                      <option value="">Estado donde opera</option>
                      {states.map((s: any) => (
                        <option key={s.state_id || s.id} value={s.state_id || s.id}>{s.name || s.nombre}</option>
                      ))}
                    </select>
                    <select value={form.municipality_id} onChange={e => set('municipality_id', e.target.value)} required
                      disabled={!form.state_id} className={`${inp} disabled:opacity-40`}>
                      <option value="">Municipio</option>
                      {municipalities.map((m: any) => (
                        <option key={m.municipality_id || m.id} value={m.municipality_id || m.id}>{m.name || m.nombre}</option>
                      ))}
                    </select>
                  </div>

                  {/* Contraseña */}
                  <div className="space-y-3">
                    <p className={lbl}>Contraseña</p>
                    <div className="relative">
                      <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)}
                        placeholder="Contraseña (mín. 8 caracteres)" required className={`${inp} pr-11`} />
                      <button type="button" onClick={() => setShowPwd(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                        {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                    <div className="relative">
                      <input type={showConfirm ? 'text' : 'password'} value={form.confirm} onChange={e => set('confirm', e.target.value)}
                        placeholder="Confirmar contraseña" required className={`${inp} pr-11`} />
                      <button type="button" onClick={() => setShowConfirm(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                        {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-xl px-4 py-3">
                      {error}
                    </div>
                  )}

                  <button type="submit" disabled={loading}
                    className="w-full bg-[#1A5C38] text-white rounded-2xl py-3.5 text-[15px] font-black tracking-wide hover:bg-[#1e6b42] active:opacity-80 transition-colors disabled:opacity-40 shadow-lg shadow-[#1A5C38]/30">
                    {loading ? 'Creando cuenta…' : 'Crear cuenta'}
                  </button>

                  <p className="text-center text-[13px] text-gray-400">
                    ¿Ya tienes cuenta?{' '}
                    <Link to="/login" className="text-[#1A5C38] font-bold hover:underline">Inicia sesión</Link>
                  </p>

                </form>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
