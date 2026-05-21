import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Warehouse, Factory, Eye, EyeOff, User, Mail, Phone, MapPin, Lock } from 'lucide-react';
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

  const inp = 'w-full bg-[#F2F2F7] rounded-xl px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-[#1A5C38]/30 border-0';
  const lbl = 'block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-1';

  return (
    <div className="min-h-dvh relative flex flex-col">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0d3320] via-[#1A5C38] to-[#2d7a52]" />
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\'%3E%3Ccircle cx=\'7\' cy=\'7\' r=\'1\'/%3E%3Ccircle cx=\'27\' cy=\'27\' r=\'1\'/%3E%3Ccircle cx=\'47\' cy=\'47\' r=\'1\'/%3E%3C/g%3E%3C/svg%3E")' }} />
      <div className="absolute top-[-60px] right-[-60px] w-56 h-56 rounded-full bg-white/[0.04]" />

      {/* Sticky back button over the background */}
      <div className="relative z-10 px-4 pt-safe pt-4 pb-2">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-1 text-green-200/90 text-[14px] font-medium active:opacity-60"
        >
          <ChevronLeft size={18} strokeWidth={2.5} className="-ml-1" />
          Iniciar sesión
        </button>
      </div>

      {/* Scrollable content */}
      <div className="relative flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 pb-12 pt-2">

          {/* Branding */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm ring-2 ring-white/30 mb-3">
              <img src="/icono.png" alt="SOMEC" className="w-10 h-10 rounded-xl" />
            </div>
            <h1 className="text-[24px] font-black text-white">Crear cuenta</h1>
            <p className="text-green-200/70 text-[13px] mt-0.5">SOMEC · Plan Nacional Maíz 2026</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">

            {/* Tipo de cuenta */}
            <div className="bg-white/[0.97] rounded-2xl shadow-xl overflow-hidden">
              <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                <p className="text-[13px] font-bold text-gray-700">Tipo de cuenta</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Este rol define tus funciones en el sistema</p>
              </div>
              <div className="px-5 py-4">
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
              </div>
            </div>

            {/* Datos personales */}
            <div className="bg-white/[0.97] rounded-2xl shadow-xl overflow-hidden">
              <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                <p className="text-[13px] font-bold text-gray-700">Datos personales</p>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div>
                  <label className={lbl}><User size={10} className="inline mr-1" />Nombre completo</label>
                  <input type="text" value={form.nombre_completo} onChange={e => set('nombre_completo', e.target.value)}
                    placeholder="Juan Pérez González" required className={inp} />
                </div>
                <div>
                  <label className={lbl}><Mail size={10} className="inline mr-1" />Correo electrónico</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder="correo@ejemplo.com" required className={inp} />
                </div>
                <div>
                  <label className={lbl}><Phone size={10} className="inline mr-1" />Teléfono celular</label>
                  <input type="tel" value={form.telefono} onChange={e => set('telefono', e.target.value)}
                    placeholder="6671234567" required className={inp} />
                </div>
                <div>
                  <label className={lbl}>CURP <span className="normal-case font-normal text-gray-300">(opcional)</span></label>
                  <input type="text" value={form.curp} onChange={e => set('curp', e.target.value.toUpperCase())}
                    placeholder="XXXX000000XXXXXXX0" maxLength={18}
                    className={`${inp} font-mono tracking-widest`} />
                </div>
              </div>
            </div>

            {/* Ubicación */}
            <div className="bg-white/[0.97] rounded-2xl shadow-xl overflow-hidden">
              <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                <p className="text-[13px] font-bold text-gray-700">Ubicación</p>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div>
                  <label className={lbl}><MapPin size={10} className="inline mr-1" />Estado donde opera</label>
                  <select value={form.state_id} onChange={e => { set('state_id', e.target.value); set('municipality_id', ''); }} required className={inp}>
                    <option value="">Selecciona estado</option>
                    {states.map((s: any) => (
                      <option key={s.state_id || s.id} value={s.state_id || s.id}>{s.name || s.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Municipio</label>
                  <select value={form.municipality_id} onChange={e => set('municipality_id', e.target.value)} required
                    disabled={!form.state_id} className={`${inp} disabled:opacity-40`}>
                    <option value="">Selecciona municipio</option>
                    {municipalities.map((m: any) => (
                      <option key={m.municipality_id || m.id} value={m.municipality_id || m.id}>{m.name || m.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Contraseña */}
            <div className="bg-white/[0.97] rounded-2xl shadow-xl overflow-hidden">
              <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                <p className="text-[13px] font-bold text-gray-700">Contraseña</p>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div>
                  <label className={lbl}><Lock size={10} className="inline mr-1" />Contraseña (mín. 8 caracteres)</label>
                  <div className="relative">
                    <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)}
                      placeholder="••••••••" required className={`${inp} pr-11`} />
                    <button type="button" onClick={() => setShowPwd(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={lbl}>Confirmar contraseña</label>
                  <div className="relative">
                    <input type={showConfirm ? 'text' : 'password'} value={form.confirm} onChange={e => set('confirm', e.target.value)}
                      placeholder="••••••••" required className={`${inp} pr-11`} />
                    <button type="button" onClick={() => setShowConfirm(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 backdrop-blur-sm border border-red-400/40 text-white text-[13px] rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-white text-[#1A5C38] rounded-2xl py-3.5 text-[16px] font-black active:opacity-80 transition-opacity disabled:opacity-40 shadow-lg">
              {loading ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>

            <p className="text-center text-[13px] text-green-200/60 pb-4">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-white font-bold">Inicia sesión</Link>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}
