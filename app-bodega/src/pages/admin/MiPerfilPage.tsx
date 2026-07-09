import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Lock, Eye, EyeOff, CheckCircle2,
  AlertTriangle, Loader2, ShieldCheck, ChevronDown,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const HDR  = (): Record<string, string> => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('simac_token')}`,
});

interface PerfilData {
  id: number;
  email: string;
  nombre_completo: string;
  rol: string;
  estado_asignado: string | null;
  ultimo_login: string | null;
  created_at: string;
}

/* ─── Helpers visuales ───────────────────────────────────────────────── */
const iCls = 'w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-[13px] text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#0e5c33]/50 focus:ring-2 focus:ring-[#0e5c33]/10 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed';
const lCls = 'text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] mb-1.5 block';

function Avatar({ nombre, size = 72, rol }: { nombre: string; size?: number; rol?: string }) {
  const ini = nombre.split(' ').slice(0, 2).map(p => p[0] ?? '').join('').toUpperCase();
  const bg  = rol === 'admin' ? 'from-[#0e5c33] to-[#1a7a44]'
             : rol === 'oref'  ? 'from-violet-500 to-violet-700'
             : 'from-emerald-400 to-emerald-600';
  return (
    <div style={{ width: size, height: size, fontSize: size * 0.35, borderRadius: size * 0.28 }}
      className={`bg-gradient-to-br ${bg} flex items-center justify-center text-white font-black shadow-lg shrink-0`}>
      {ini}
    </div>
  );
}

function RolLabel({ rol }: { rol: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    admin:  { label: 'Administrador',     cls: 'bg-[#0e5c33] text-white' },
    user:   { label: 'Usuario Operativo', cls: 'bg-emerald-100 text-emerald-800' },
    oref:   { label: 'OREF',              cls: 'bg-violet-100 text-violet-700' },
  };
  const m = map[rol] ?? { label: rol, cls: 'bg-gray-100 text-gray-700' };
  return <span className={`text-[10.5px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide ${m.cls}`}>{m.label}</span>;
}

/* ─── Barra de fuerza de contraseña ────────────────────────────────── */
function PassStrength({ pass }: { pass: string }) {
  if (!pass) return null;
  const score = [pass.length >= 8, pass.length >= 12, /[A-Z]/.test(pass) && /[0-9]/.test(pass), /[^A-Za-z0-9]/.test(pass)].filter(Boolean).length;
  const colors = ['bg-red-400', 'bg-amber-400', 'bg-yellow-400', 'bg-emerald-500'];
  const labels = ['Muy débil', 'Débil', 'Buena', 'Fuerte'];
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[0,1,2,3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? colors[score - 1] : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className={`text-[10.5px] mt-1 font-semibold ${['text-red-400','text-amber-400','text-yellow-500','text-emerald-600'][score - 1] ?? 'text-gray-400'}`}>
        {labels[score - 1] ?? 'Ingresa tu contraseña'}
      </p>
    </div>
  );
}

/* ─── Toast inline ─────────────────────────────────────────────────── */
function Toast({ msg, type }: { msg: string; type: 'ok' | 'err' }) {
  return (
    <div className={`flex items-center gap-2.5 rounded-2xl px-3.5 py-3 border text-[12px] font-semibold ${
      type === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-600'
    }`}>
      {type === 'ok' ? <CheckCircle2 size={13} className="shrink-0" /> : <AlertTriangle size={13} className="shrink-0" />}
      {msg}
    </div>
  );
}

/* ─── Sección colapsable ────────────────────────────────────────────── */
function Section({ title, icon, children, defaultOpen = true }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/60 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-[#0e5c33]/10 flex items-center justify-center text-[#0e5c33]">
            {icon}
          </div>
          <span className="text-[13px] font-black text-gray-900">{title}</span>
        </div>
        <ChevronDown size={15} className={`text-gray-400 transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && <div className="px-5 pb-5 pt-1 border-t border-gray-100">{children}</div>}
    </div>
  );
}

/* ─── Página ────────────────────────────────────────────────────────── */
export default function MiPerfilPage() {
  const { user, token, setAuth, logout } = useAuthStore();
  const navigate = useNavigate();

  const [perfil,      setPerfil]      = useState<PerfilData | null>(null);
  const [loadingP,    setLoadingP]    = useState(true);

  /* Form info personal */
  const [nombre, setNombre] = useState('');
  const [email,  setEmail]  = useState('');
  const [savingInfo, setSavingInfo]   = useState(false);
  const [msgInfo,    setMsgInfo]      = useState<{ t: 'ok' | 'err'; m: string } | null>(null);

  /* Form contraseña */
  const [passActual,  setPassActual]  = useState('');
  const [passNueva,   setPassNueva]   = useState('');
  const [passConfirm, setPassConfirm] = useState('');
  const [showA, setShowA] = useState(false);
  const [showN, setShowN] = useState(false);
  const [showC, setShowC] = useState(false);
  const [savingPass,  setSavingPass]  = useState(false);
  const [msgPass,     setMsgPass]     = useState<{ t: 'ok' | 'err'; m: string } | null>(null);

  const timerInfo = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const timerPass = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /* Cargar perfil */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${BASE}/auth/perfil`, { headers: HDR() });
        const d = await r.json();
        if (r.ok && d.usuario) {
          setPerfil(d.usuario);
          setNombre(d.usuario.nombre_completo ?? '');
          setEmail(d.usuario.email ?? '');
        }
      } catch { /* ignore */ } finally { setLoadingP(false); }
    })();
  }, []);

  function flashInfo(t: 'ok' | 'err', m: string) {
    setMsgInfo({ t, m });
    clearTimeout(timerInfo.current);
    timerInfo.current = setTimeout(() => setMsgInfo(null), 3500);
  }

  function flashPass(t: 'ok' | 'err', m: string) {
    setMsgPass({ t, m });
    clearTimeout(timerPass.current);
    timerPass.current = setTimeout(() => setMsgPass(null), 3500);
  }

  /* Guardar info personal */
  async function guardarInfo(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !email.trim()) { flashInfo('err', 'Nombre y email son obligatorios'); return; }
    setSavingInfo(true);
    try {
      const r = await fetch(`${BASE}/auth/perfil`, {
        method: 'PATCH', headers: HDR(),
        body: JSON.stringify({ nombre_completo: nombre.trim(), email: email.trim().toLowerCase() }),
      });
      const d = await r.json();
      if (!r.ok) { flashInfo('err', d.error || 'Error al guardar'); return; }
      flashInfo('ok', 'Perfil actualizado correctamente');
      if (perfil) setPerfil({ ...perfil, nombre_completo: d.usuario.nombre_completo, email: d.usuario.email });
      // Actualizar store para reflejar cambio de nombre en el header
      if (token && user) {
        setAuth(token, { ...user, nombre_completo: d.usuario.nombre_completo, email: d.usuario.email });
      }
    } catch { flashInfo('err', 'Error de conexión'); } finally { setSavingInfo(false); }
  }

  /* Cambiar contraseña */
  async function cambiarPass(e: React.FormEvent) {
    e.preventDefault();
    if (!passActual || !passNueva || !passConfirm) { flashPass('err', 'Completa todos los campos'); return; }
    if (passNueva.length < 8) { flashPass('err', 'La nueva contraseña debe tener al menos 8 caracteres'); return; }
    if (passNueva !== passConfirm) { flashPass('err', 'Las contraseñas no coinciden'); return; }
    setSavingPass(true);
    try {
      const r = await fetch(`${BASE}/auth/cambiar-password`, {
        method: 'POST', headers: HDR(),
        body: JSON.stringify({ password_actual: passActual, password_nuevo: passNueva }),
      });
      const d = await r.json();
      if (!r.ok) { flashPass('err', d.error || 'Error al cambiar contraseña'); return; }
      flashPass('ok', '¡Contraseña actualizada correctamente!');
      setPassActual(''); setPassNueva(''); setPassConfirm('');
      if (token && user) setAuth(token, { ...user, debe_cambiar_pass: false });
    } catch { flashPass('err', 'Error de conexión'); } finally { setSavingPass(false); }
  }

  function handleLogout() { logout(); navigate('/admin/login'); }

  /* ── RENDER ─────────────────────────────────────────────────────── */
  if (loadingP) {
    return (
      <div className="flex items-center justify-center py-24 gap-2.5 text-gray-400">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-[13px]">Cargando perfil…</span>
      </div>
    );
  }

  const rolLabel = perfil?.rol ?? user?.rol ?? '';
  const nombre_display = perfil?.nombre_completo || user?.nombre_completo || 'Usuario';

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">

      {/* ── Tarjeta hero de perfil ────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Banda superior */}
        <div className="h-20 bg-gradient-to-r from-[#0e5c33] via-[#1a7a44] to-[#0e5c33] relative">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%,white 1px,transparent 1px),radial-gradient(circle at 80% 50%,white 1px,transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>

        <div className="px-6 pb-5">
          {/* Avatar sobre la banda */}
          <div className="-mt-9 mb-3 flex items-end justify-between">
            <div className="ring-4 ring-white rounded-[calc(72px*0.28+4px)]">
              <Avatar nombre={nombre_display} size={72} rol={rolLabel} />
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-[11.5px] font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-100 px-3 py-1.5 rounded-xl transition-all active:scale-95 mb-1">
              <LogOut size={12} /> Cerrar sesión
            </button>
          </div>

          <p className="text-[17px] font-black text-gray-900 leading-tight">{nombre_display}</p>
          <p className="text-[12.5px] text-gray-500 mt-0.5">{perfil?.email ?? user?.email}</p>

          <div className="flex items-center gap-2 mt-2.5">
            <RolLabel rol={rolLabel} />
            {perfil?.estado_asignado && (
              <span className="text-[10.5px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">{perfil.estado_asignado}</span>
            )}
            {rolLabel === 'admin' && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#0e5c33]/70 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                <ShieldCheck size={9} /> Acceso total
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="mt-4 flex gap-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Último acceso</p>
              <p className="text-[12px] font-bold text-gray-700 mt-0.5">
                {perfil?.ultimo_login
                  ? new Date(perfil.ultimo_login).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
                  : 'Primer acceso'}
              </p>
            </div>
            <div className="w-px bg-gray-100" />
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Miembro desde</p>
              <p className="text-[12px] font-bold text-gray-700 mt-0.5">
                {perfil?.created_at
                  ? new Date(perfil.created_at).toLocaleDateString('es-MX', { dateStyle: 'long' })
                  : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sección: Información personal ────────────────────────────── */}
      <Section title="Información personal" icon={<User size={14} />}>
        <form onSubmit={guardarInfo} className="flex flex-col gap-3.5 mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className={lCls}>Nombre completo</label>
              <input className={iCls} value={nombre} onChange={e => setNombre(e.target.value)}
                placeholder="Tu nombre completo" />
            </div>
            <div>
              <label className={lCls}>Email</label>
              <input type="email" className={iCls} value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com" />
            </div>
          </div>

          {/* Campos de solo lectura */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className={lCls}>Rol <span className="normal-case font-normal text-gray-300">(no editable)</span></label>
              <div className={`${iCls} bg-gray-100 text-gray-500 cursor-not-allowed flex items-center gap-2`}>
                <ShieldCheck size={13} className="text-gray-400 shrink-0" />
                <RolLabel rol={rolLabel} />
              </div>
            </div>
            {perfil?.estado_asignado && (
              <div>
                <label className={lCls}>Estado asignado <span className="normal-case font-normal text-gray-300">(no editable)</span></label>
                <input className={`${iCls} bg-gray-100 text-gray-500 cursor-not-allowed`}
                  value={perfil.estado_asignado} disabled />
              </div>
            )}
          </div>

          {msgInfo && <Toast msg={msgInfo.m} type={msgInfo.t} />}

          <div className="flex justify-end">
            <button type="submit" disabled={savingInfo}
              className="flex items-center gap-2 bg-[#0e5c33] hover:bg-[#0a3d22] active:scale-95 disabled:opacity-50 text-white text-[12.5px] font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm">
              {savingInfo ? <><Loader2 size={13} className="animate-spin" />Guardando…</> : <><CheckCircle2 size={13} />Guardar cambios</>}
            </button>
          </div>
        </form>
      </Section>

      {/* ── Sección: Seguridad ────────────────────────────────────────── */}
      <Section title="Seguridad" icon={<Lock size={14} />} defaultOpen={false}>
        <form onSubmit={cambiarPass} className="flex flex-col gap-3.5 mt-3">
          <div>
            <label className={lCls}>Contraseña actual</label>
            <div className="relative">
              <input type={showA ? 'text' : 'password'} className={`${iCls} pr-11`}
                value={passActual} onChange={e => setPassActual(e.target.value)}
                placeholder="••••••••" autoComplete="current-password" />
              <button type="button" onClick={() => setShowA(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                {showA ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className={lCls}>Nueva contraseña</label>
              <div className="relative">
                <input type={showN ? 'text' : 'password'} className={`${iCls} pr-11`}
                  value={passNueva} onChange={e => setPassNueva(e.target.value)}
                  placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
                <button type="button" onClick={() => setShowN(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showN ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <PassStrength pass={passNueva} />
            </div>
            <div>
              <label className={lCls}>Confirmar contraseña</label>
              <div className="relative">
                <input type={showC ? 'text' : 'password'} className={`${iCls} pr-11`}
                  value={passConfirm} onChange={e => setPassConfirm(e.target.value)}
                  placeholder="Repite la contraseña" autoComplete="new-password" />
                <button type="button" onClick={() => setShowC(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showC ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {passConfirm && passNueva !== passConfirm && (
                <p className="text-[11px] text-red-500 mt-1.5 font-semibold">Las contraseñas no coinciden</p>
              )}
              {passConfirm && passNueva === passConfirm && passNueva.length >= 8 && (
                <p className="text-[11px] text-emerald-600 mt-1.5 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={11} /> Coinciden
                </p>
              )}
            </div>
          </div>

          {msgPass && <Toast msg={msgPass.m} type={msgPass.t} />}

          <div className="flex justify-end">
            <button type="submit" disabled={savingPass}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 active:scale-95 disabled:opacity-50 text-white text-[12.5px] font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm">
              {savingPass ? <><Loader2 size={13} className="animate-spin" />Actualizando…</> : <><Lock size={13} />Cambiar contraseña</>}
            </button>
          </div>
        </form>
      </Section>

      {/* ── Zona de email como ID informativo ─────────────────────────── */}
      <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
        <Mail size={14} className="text-blue-500 shrink-0" />
        <p className="text-[11.5px] text-blue-700">Tu email es tu identificador en el sistema. Al cambiarlo deberás usar el nuevo para iniciar sesión.</p>
      </div>

    </div>
  );
}
