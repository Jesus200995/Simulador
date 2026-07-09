import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldCheck, Plus, Pencil, Trash2, X,
  Copy, Download, CheckCircle2, AlertTriangle, ChevronDown,
  Loader2, RefreshCw, UserPlus, KeySquare,
  TriangleAlert, Sparkles, LayoutDashboard, Users, Warehouse,
  TrendingUp, Sprout, BarChart3, Leaf,
} from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const HDR  = (): Record<string, string> => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('simac_token')}`,
});

/* ─── Tipos ──────────────────────────────────────────────────────────── */
interface RolPanel { clave: string; etiqueta: string; permisos_totales: boolean; aplica_filtro_estado: boolean; vistas_default: Record<string, string[]> | null; }
interface UsuarioPanel { id: number; nombre_completo: string; email: string; rol: string; rol_etiqueta: string; activo: boolean; estado_asignado: string | null; debe_cambiar_pass: boolean; ultimo_login: string | null; created_at: string; permisos_totales: boolean; aplica_filtro_estado: boolean; }
interface Permiso { vista: string; sub_accion: string; habilitado: boolean; }
interface CredencialesNuevas { email: string; password_temporal: string; nombre_completo: string; rol: string; estado_asignado: string | null; }

const VISTAS_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  dashboard:           { label: 'Dashboard',        icon: <LayoutDashboard size={14} className="text-blue-500" /> },
  productores:         { label: 'Productores',       icon: <Users size={14} className="text-emerald-500" /> },
  bodegas:             { label: 'Bodegas',           icon: <Warehouse size={14} className="text-amber-500" /> },
  alertas:             { label: 'Alertas',           icon: <AlertTriangle size={14} className="text-red-500" /> },
  precios:             { label: 'Precios',           icon: <TrendingUp size={14} className="text-violet-500" /> },
  produccion:          { label: 'Producción',        icon: <Sprout size={14} className="text-green-600" /> },
  mercado:             { label: 'Mercado',           icon: <BarChart3 size={14} className="text-cyan-500" /> },
  senasica:            { label: 'SENASICA',          icon: <Leaf size={14} className="text-lime-600" /> },
  'avisos-privacidad': { label: 'Avisos Privacidad', icon: <ShieldCheck size={14} className="text-slate-500" /> },
};

const ACCION_LABELS: Record<string, string> = {
  ver: 'Ver', crear: 'Crear', editar: 'Editar', eliminar: 'Eliminar', exportar: 'Exportar',
};

const VISTAS_ACCIONES: Record<string, string[]> = {
  dashboard:           ['ver'],
  productores:         ['ver', 'editar', 'eliminar', 'exportar'],
  bodegas:             ['ver', 'crear', 'editar', 'eliminar', 'exportar'],
  alertas:             ['ver', 'crear', 'eliminar'],
  precios:             ['ver', 'editar'],
  produccion:          ['ver', 'editar', 'exportar'],
  mercado:             ['ver', 'exportar'],
  senasica:            ['ver', 'crear', 'eliminar'],
  'avisos-privacidad': ['ver', 'exportar'],
};

const ESTADOS_MX = [
  'AGUASCALIENTES','BAJA CALIFORNIA','BAJA CALIFORNIA SUR','CAMPECHE','CHIAPAS','CHIHUAHUA',
  'CIUDAD DE MEXICO','COAHUILA','COLIMA','DURANGO','ESTADO DE MEXICO','GUANAJUATO','GUERRERO',
  'HIDALGO','JALISCO','MICHOACAN','MORELOS','NAYARIT','NUEVO LEON','OAXACA','PUEBLA','QUERETARO',
  'QUINTANA ROO','SAN LUIS POTOSI','SINALOA','SONORA','TABASCO','TAMAULIPAS','TLAXCALA',
  'VERACRUZ','YUCATAN','ZACATECAS',
];

/* ─── Toggle switch ──────────────────────────────────────────────────── */
function Toggle({ on, onChange, disabled = false, size = 'md' }: {
  on: boolean; onChange: () => void; disabled?: boolean; size?: 'sm' | 'md';
}) {
  const w = size === 'sm' ? 'w-8 h-[18px]' : 'w-10 h-[22px]';
  const k = size === 'sm' ? 'w-[13px] h-[13px]' : 'w-[17px] h-[17px]';
  const tx = on ? (size === 'sm' ? 'translate-x-[14px]' : 'translate-x-[18px]') : 'translate-x-[2px]';
  return (
    <button type="button" onClick={onChange} disabled={disabled}
      className={`${w} relative rounded-full transition-all duration-200 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0e5c33]/50 ${
        on ? 'bg-[#0e5c33] shadow-[0_2px_8px_rgba(14,92,51,0.45)]' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}>
      <span className={`absolute top-[2.5px] ${k} bg-white rounded-full shadow-sm transition-all duration-200 ${tx}`} />
    </button>
  );
}

/* ─── Input / Select base ────────────────────────────────────────────── */
const iCls = 'w-full bg-gray-50/80 border border-gray-200 rounded-2xl px-4 py-3 text-[13px] text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#0e5c33]/50 focus:ring-2 focus:ring-[#0e5c33]/10 transition-all duration-200';
const lCls = 'text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] mb-1.5 block';

/* ─── Avatar ─────────────────────────────────────────────────────────── */
function Avatar({ nombre, size = 32, rol }: { nombre: string; size?: number; rol?: string }) {
  const ini = nombre.split(' ').slice(0, 2).map(p => p[0] ?? '').join('').toUpperCase();
  const bg  = rol === 'admin' ? 'from-[#0e5c33] to-[#1a7a44]'
             : rol === 'oref'  ? 'from-violet-500 to-violet-700'
             : 'from-emerald-400 to-emerald-600';
  return (
    <div style={{ width: size, height: size, fontSize: size * 0.36 }}
      className={`rounded-[${Math.round(size * 0.28)}px] bg-gradient-to-br ${bg} flex items-center justify-center text-white font-black shrink-0 shadow-sm`}>
      {ini}
    </div>
  );
}

/* ─── Rol chip ───────────────────────────────────────────────────────── */
function RolChip({ rol, etiqueta }: { rol: string; etiqueta: string }) {
  const cls = rol === 'admin'   ? 'bg-[#0e5c33] text-white'
            : rol === 'oref'    ? 'bg-violet-100 text-violet-700'
            : 'bg-emerald-100 text-emerald-800';
  return <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${cls}`}>{etiqueta}</span>;
}

/* ─── MODAL BASE ─────────────────────────────────────────────────────── */
const SPRING = 'cubic-bezier(0.32,1.6,0.56,1)';

function ModalOverlay({ open, onClose, children, maxW = 'max-w-lg', noPad = false }: {
  open: boolean; onClose: () => void; children: React.ReactNode; maxW?: string; noPad?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-950/55 backdrop-blur-[18px]"
        style={{ animation: `fadein 180ms ease both` }}
        onClick={onClose}
      />
      {/* Sheet */}
      <div ref={ref}
        className={`relative w-full ${maxW} bg-white rounded-[24px] sm:rounded-[28px] shadow-[0_32px_72px_rgba(0,0,0,0.22),0_0_0_1px_rgba(0,0,0,0.06)] flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden`}
        style={{ animation: `modalIn 220ms ${SPRING} both` }}>
        {!noPad && children}
        {noPad && children}
      </div>
      <style>{`
        @keyframes fadein{from{opacity:0}to{opacity:1}}
        @keyframes modalIn{from{opacity:0;transform:scale(.93) translateY(14px)}to{opacity:1;transform:scale(1) translateY(0)}}
      `}</style>
    </div>,
    document.body
  );
}

/* ─── ÁRBOL DE PERMISOS ──────────────────────────────────────────────── */
function ArbolPermisos({ permisos, onChange, disabled = false }: {
  permisos: Permiso[]; onChange: (p: Permiso[]) => void; disabled?: boolean;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const getH = (v: string, a: string) => permisos.find(p => p.vista === v && p.sub_accion === a)?.habilitado ?? false;
  const vistaOn = (v: string) => getH(v, 'ver');

  function toggleVista(v: string) {
    const acciones = VISTAS_ACCIONES[v] ?? [];
    const on = vistaOn(v);
    const next = permisos.filter(p => p.vista !== v);
    acciones.forEach(a => next.push({ vista: v, sub_accion: a, habilitado: !on }));
    if (!on) setOpen(o => ({ ...o, [v]: true }));
    onChange(next);
  }

  function toggleAccion(v: string, a: string) {
    const on = getH(v, a);
    const next = permisos.filter(p => !(p.vista === v && p.sub_accion === a));
    next.push({ vista: v, sub_accion: a, habilitado: !on });
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-1.5">
      {Object.entries(VISTAS_LABELS).map(([vista, { label, icon }]) => {
        const acciones = VISTAS_ACCIONES[vista] ?? [];
        const on = vistaOn(vista);
        const expanded = open[vista] ?? on;
        const soloVer = acciones.length === 1;

        return (
          <div key={vista}
            className={`border rounded-2xl overflow-hidden transition-all duration-200 ${on ? 'border-[#0e5c33]/25 bg-emerald-50/40' : 'border-gray-150 bg-gray-50/60'}`}>
            <div className="flex items-center gap-2.5 px-3.5 py-2.5">
              <button type="button" onClick={() => !soloVer && setOpen(o => ({ ...o, [vista]: !expanded }))}
                disabled={soloVer || disabled || !on}
                className="flex items-center gap-2 flex-1 min-w-0 text-left">
                <span className="text-[13px]">{icon}</span>
                <span className={`text-[12.5px] font-bold truncate ${on ? 'text-gray-800' : 'text-gray-500'}`}>{label}</span>
                {!soloVer && on && (
                  <span className={`ml-auto text-gray-400 transition-transform duration-200 ${expanded ? '' : '-rotate-90'}`}>
                    <ChevronDown size={13} />
                  </span>
                )}
              </button>
              <Toggle on={on} onChange={() => toggleVista(vista)} disabled={disabled} size="sm" />
            </div>

            {on && !soloVer && expanded && (
              <div className="border-t border-[#0e5c33]/10 px-3.5 pb-2.5 pt-2 flex flex-col gap-2">
                {acciones.filter(a => a !== 'ver').map(accion => (
                  <div key={accion} className="flex items-center justify-between pl-5 relative">
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-px bg-gray-300" />
                    <span className="text-[11.5px] text-gray-600 font-medium">{ACCION_LABELS[accion] ?? accion}</span>
                    <Toggle on={getH(vista, accion)} onChange={() => toggleAccion(vista, accion)} disabled={disabled} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── MODAL CREDENCIALES ─────────────────────────────────────────────── */
function ModalCredenciales({ creds, onClose }: { creds: CredencialesNuevas; onClose: () => void }) {
  const [copiado, setCopiado] = useState(false);

  function copiar() {
    const t = `Nombre: ${creds.nombre_completo}\nEmail: ${creds.email}\nContraseña temporal: ${creds.password_temporal}\nRol: ${creds.rol}${creds.estado_asignado ? `\nEstado: ${creds.estado_asignado}` : ''}`;
    navigator.clipboard.writeText(t);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2200);
  }

  function csv() {
    const blob = new Blob([`nombre_completo,email,password_temporal,rol,estado_asignado\n"${creds.nombre_completo}","${creds.email}","${creds.password_temporal}","${creds.rol}","${creds.estado_asignado ?? ''}"`], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `credenciales_SIMAC_${Date.now()}.csv` });
    a.click();
  }

  return (
    <ModalOverlay open onClose={onClose} maxW="max-w-sm" noPad>
      {/* Top strip */}
      <div className="bg-gradient-to-br from-[#0e5c33] to-[#1a7a44] px-5 sm:px-6 pt-5 sm:pt-6 pb-4 sm:pb-5">
        <div className="flex items-start justify-between mb-3.5 sm:mb-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/20 flex items-center justify-center">
            <Sparkles size={17} className="text-white" />
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all">
            <X size={13} className="text-white/80" />
          </button>
        </div>
        <p className="text-white text-[14px] sm:text-[15px] font-black leading-tight">Usuario creado</p>
        <p className="text-white/60 text-[11px] sm:text-[11.5px] mt-0.5">Guarda estas credenciales ahora</p>
      </div>

      <div className="px-4 sm:px-5 py-4 sm:py-5 flex flex-col gap-3.5">
        {/* Warning */}
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl px-3.5 py-3">
          <TriangleAlert size={14} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-amber-700 text-[11.5px] leading-relaxed">La contraseña temporal <strong>solo aparece una vez</strong>. El usuario debe cambiarla en su primer acceso.</p>
        </div>

        {/* Credentials card */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2 font-mono text-[12px]">
          {[
            ['Nombre',       creds.nombre_completo, 'text-gray-800'],
            ['Email',        creds.email,            'text-gray-800'],
            ['Contraseña',   creds.password_temporal,'text-[#0e5c33] font-black tracking-wider'],
            ['Rol',          creds.rol,              'text-gray-800'],
            ...(creds.estado_asignado ? [['Estado', creds.estado_asignado, 'text-gray-800']] : []),
          ].map(([k, v, cls]) => (
            <div key={k} className="flex gap-2">
              <span className="text-gray-400 min-w-[80px] shrink-0">{k}</span>
              <span className={cls}>{v}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2.5">
          <button onClick={copiar}
            className={`flex-1 flex items-center justify-center gap-1.5 text-[12px] font-bold py-2.5 rounded-2xl border transition-all active:scale-95 ${
              copiado ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
            }`}>
            <CheckCircle2 size={13} className={copiado ? '' : 'hidden'} />
            <Copy size={13} className={copiado ? 'hidden' : ''} />
            {copiado ? 'Copiado' : 'Copiar'}
          </button>
          <button onClick={csv}
            className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-bold py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#0e5c33] hover:bg-emerald-100 transition-all active:scale-95">
            <Download size={13} /> CSV
          </button>
        </div>

        <button onClick={onClose}
          className="w-full bg-[#0e5c33] hover:bg-[#0a3d22] active:scale-[0.98] text-white text-[13px] font-bold py-3 rounded-2xl transition-all shadow-sm hover:shadow-md">
          Entendido
        </button>
      </div>
    </ModalOverlay>
  );
}

/* ─── PÁGINA PRINCIPAL ───────────────────────────────────────────────── */
export default function PermisosAdminPage() {
  const [usuarios,  setUsuarios]  = useState<UsuarioPanel[]>([]);
  const [roles,     setRoles]     = useState<RolPanel[]>([]);
  const [loading,   setLoading]   = useState(true);

  /* Crear */
  const [modalCrear, setModalCrear] = useState(false);
  const [fCrear,  setFCrear]  = useState({ nombre_completo: '', email: '', rol: 'user', estado_asignado: '' });
  const [pCrear,  setPCrear]  = useState<Permiso[]>([]);
  const [creando, setCreando] = useState(false);
  const [errCrear, setErrCrear] = useState('');
  const [creds,   setCreds]   = useState<CredencialesNuevas | null>(null);

  /* Editar */
  const [modalEditar, setModalEditar]   = useState(false);
  const [usuEdit,     setUsuEdit]       = useState<UsuarioPanel | null>(null);
  const [fEditar,  setFEditar]  = useState({ nombre_completo: '', email: '', rol: 'user', estado_asignado: '' });
  const [pEditar,  setPEditar]  = useState<Permiso[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [errEdit,  setErrEdit]  = useState('');
  const [savedOk,  setSavedOk]  = useState(false);

  /* Eliminar */
  const [modalDel, setModalDel]   = useState(false);
  const [usuDel,   setUsuDel]     = useState<UsuarioPanel | null>(null);
  const [deleting, setDeleting]   = useState(false);

  const rolDe = (clave: string) => roles.find(r => r.clave === clave);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [rU, rR] = await Promise.all([
        fetch(`${BASE}/admin/permisos/usuarios`, { headers: HDR() }),
        fetch(`${BASE}/admin/permisos/roles`,    { headers: HDR() }),
      ]);
      const [dU, dR] = await Promise.all([rU.json(), rR.json()]);
      setUsuarios(dU.usuarios ?? []);
      setRoles(dR.roles ?? []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  /* Pre-carga permisos default al cambiar rol en crear */
  useEffect(() => {
    const r = rolDe(fCrear.rol);
    if (!r || r.permisos_totales) { setPCrear([]); return; }
    const def: Permiso[] = [];
    const vd = r.vistas_default ?? {};
    Object.entries(VISTAS_ACCIONES).forEach(([v, acciones]) => {
      const h = vd[v] ?? [];
      acciones.forEach(a => def.push({ vista: v, sub_accion: a, habilitado: h.includes(a) }));
    });
    setPCrear(def);
  }, [fCrear.rol, roles]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Abrir editar */
  async function abrirEditar(u: UsuarioPanel) {
    setUsuEdit(u);
    setFEditar({ nombre_completo: u.nombre_completo, email: u.email, rol: u.rol, estado_asignado: u.estado_asignado ?? '' });
    setErrEdit(''); setSavedOk(false);
    try {
      const r = await fetch(`${BASE}/admin/permisos/${u.id}`, { headers: HDR() });
      const d = await r.json();
      if (d.permisos_totales) { setPEditar([]); }
      else {
        const perms: Permiso[] = [];
        Object.entries(VISTAS_ACCIONES).forEach(([v, acciones]) => {
          acciones.forEach(a => {
            const ex = d.permisos?.find((p: Permiso) => p.vista === v && p.sub_accion === a);
            perms.push({ vista: v, sub_accion: a, habilitado: ex?.habilitado ?? false });
          });
        });
        setPEditar(perms);
      }
    } catch { setPEditar([]); }
    setModalEditar(true);
  }

  /* Crear usuario */
  async function crearUsuario() {
    setErrCrear('');
    if (!fCrear.nombre_completo.trim() || !fCrear.email.trim()) { setErrCrear('Nombre y email son obligatorios'); return; }
    const r = rolDe(fCrear.rol);
    if (r?.aplica_filtro_estado && !fCrear.estado_asignado) { setErrCrear('Selecciona el estado asignado'); return; }
    setCreando(true);
    try {
      const resp = await fetch(`${BASE}/admin/permisos/usuarios`, {
        method: 'POST', headers: HDR(),
        body: JSON.stringify({
          nombre_completo: fCrear.nombre_completo.trim(),
          email: fCrear.email.trim().toLowerCase(),
          rol: fCrear.rol,
          estado_asignado: r?.aplica_filtro_estado ? fCrear.estado_asignado : null,
          permisos: r?.permisos_totales ? [] : pCrear,
        }),
      });
      const d = await resp.json();
      if (!resp.ok) { setErrCrear(d.error || 'Error al crear usuario'); return; }
      setModalCrear(false);
      setFCrear({ nombre_completo: '', email: '', rol: 'user', estado_asignado: '' });
      setCreds({ email: d.usuario.email, password_temporal: d.password_temporal, nombre_completo: d.usuario.nombre_completo, rol: d.usuario.rol, estado_asignado: d.usuario.estado_asignado ?? null });
      cargar();
    } catch { setErrCrear('Error de conexión'); } finally { setCreando(false); }
  }

  /* Guardar editar */
  async function guardarEditar() {
    if (!usuEdit) return;
    setGuardando(true); setErrEdit(''); setSavedOk(false);
    try {
      await fetch(`${BASE}/admin/permisos/usuarios/${usuEdit.id}`, {
        method: 'PATCH', headers: HDR(),
        body: JSON.stringify({
          nombre_completo: fEditar.nombre_completo.trim(),
          email: fEditar.email.trim().toLowerCase(),
          rol: fEditar.rol,
          estado_asignado: rolDe(fEditar.rol)?.aplica_filtro_estado ? fEditar.estado_asignado : null,
        }),
      });
      const r2 = rolDe(fEditar.rol);
      if (!r2?.permisos_totales) {
        await fetch(`${BASE}/admin/permisos/${usuEdit.id}`, {
          method: 'PATCH', headers: HDR(),
          body: JSON.stringify({ permisos: pEditar }),
        });
      }
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2500);
      cargar();
    } catch { setErrEdit('Error al guardar'); } finally { setGuardando(false); }
  }

  /* Eliminar */
  async function eliminar() {
    if (!usuDel) return;
    setDeleting(true);
    try {
      await fetch(`${BASE}/admin/permisos/usuarios/${usuDel.id}`, { method: 'DELETE', headers: HDR() });
      setModalDel(false); setUsuDel(null); cargar();
    } catch { /* ignore */ } finally { setDeleting(false); }
  }

  /* ── RENDER ─────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col gap-4">

      {/* Barra superior */}
      <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#0e5c33]/10 flex items-center justify-center">
            <ShieldCheck size={15} className="text-[#0e5c33]" />
          </div>
          <div>
            <p className="text-[13px] font-black text-gray-900 leading-none">Permisos Administrativos</p>
            <p className="text-[10.5px] text-gray-400 mt-0.5">{usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} del panel</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={cargar} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all active:scale-95">
            <RefreshCw size={13} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => { setErrCrear(''); setModalCrear(true); }}
            className="flex items-center gap-2 bg-[#0e5c33] hover:bg-[#0a3d22] active:scale-[0.97] text-white text-[12px] font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm hover:shadow-md">
            <UserPlus size={13} /> Nuevo usuario
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2.5 text-gray-400">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-[13px]">Cargando usuarios…</span>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <ShieldCheck size={36} className="mb-3 opacity-20" />
            <p className="text-[13.5px] font-bold">Sin usuarios del panel</p>
            <p className="text-[12px] mt-1">Crea el primero con el botón de arriba</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.08em] px-5 py-3 rounded-tl-2xl">Usuario</th>
                  <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.08em] px-5 py-3">Rol</th>
                  <th className="hidden md:table-cell text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.08em] px-5 py-3">Estado</th>
                  <th className="hidden lg:table-cell text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.08em] px-5 py-3">Último acceso</th>
                  <th className="hidden sm:table-cell text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.08em] px-5 py-3">Cuenta</th>
                  <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.08em] px-5 py-3 rounded-tr-2xl"></th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u, i) => (
                  <tr key={u.id} className={`border-b border-gray-50 hover:bg-gray-50/70 transition-colors ${i === usuarios.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar nombre={u.nombre_completo} size={34} rol={u.rol} />
                        <div>
                          <p className="text-[12.5px] font-bold text-gray-900 leading-none">{u.nombre_completo}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><RolChip rol={u.rol} etiqueta={u.rol_etiqueta ?? u.rol} /></td>
                    <td className="hidden md:table-cell px-5 py-3.5">
                      {u.estado_asignado
                        ? <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">{u.estado_asignado}</span>
                        : <span className="text-[11px] text-gray-400">Nacional</span>}
                    </td>
                    <td className="hidden lg:table-cell px-5 py-3.5 text-[12px] text-gray-500">
                      {u.ultimo_login
                        ? new Date(u.ultimo_login).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
                        : <span className="text-amber-500 font-semibold text-[11px]">Nunca</span>}
                    </td>
                    <td className="hidden sm:table-cell px-5 py-3.5">
                      {u.debe_cambiar_pass
                        ? <span className="text-[10.5px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Pass pendiente</span>
                        : <span className="text-[10.5px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Activo</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => abrirEditar(u)}
                          className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-emerald-50 hover:text-[#0e5c33] text-gray-500 flex items-center justify-center transition-all active:scale-90 group">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => { setUsuDel(u); setModalDel(true); }}
                          className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 flex items-center justify-center transition-all active:scale-90">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══ MODAL CREAR ════════════════════════════════════════════════ */}
      <ModalOverlay open={modalCrear} onClose={() => setModalCrear(false)} maxW="max-w-2xl" noPad>
        {/* Header verde */}
        <div className="bg-gradient-to-br from-[#0e5c33] to-[#1a7a44] px-5 sm:px-6 pt-5 sm:pt-6 pb-4 sm:pb-5 shrink-0">
          <div className="flex items-start justify-between mb-3.5 sm:mb-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <UserPlus size={17} className="text-white" />
            </div>
            <button onClick={() => setModalCrear(false)}
              className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all active:scale-90">
              <X size={13} className="text-white/80" />
            </button>
          </div>
          <p className="text-white text-[14px] sm:text-[15px] font-black">Nuevo usuario del panel</p>
          <p className="text-white/60 text-[11px] sm:text-[11.5px] mt-0.5">Contraseña temporal auto-generada · Email como identificador</p>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 sm:px-6 py-4 sm:py-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className={lCls}>Nombre completo *</label>
              <input className={iCls} placeholder="María García López"
                value={fCrear.nombre_completo} onChange={e => setFCrear(p => ({ ...p, nombre_completo: e.target.value }))} />
            </div>
            <div>
              <label className={lCls}>Email institucional *</label>
              <input type="email" className={iCls} placeholder="m.garcia@simac.mx"
                value={fCrear.email} onChange={e => setFCrear(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className={lCls}>Rol *</label>
              <select className={iCls} value={fCrear.rol}
                onChange={e => setFCrear(p => ({ ...p, rol: e.target.value, estado_asignado: '' }))}>
                {roles.map(r => <option key={r.clave} value={r.clave}>{r.etiqueta}</option>)}
              </select>
            </div>
            {rolDe(fCrear.rol)?.aplica_filtro_estado && (
              <div>
                <label className={lCls}>Estado asignado *</label>
                <select className={iCls} value={fCrear.estado_asignado}
                  onChange={e => setFCrear(p => ({ ...p, estado_asignado: e.target.value }))}>
                  <option value="">Selecciona un estado…</option>
                  {ESTADOS_MX.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            )}
          </div>

          {!rolDe(fCrear.rol)?.permisos_totales ? (
            <div>
              <p className={lCls}>Permisos por vista</p>
              <ArbolPermisos permisos={pCrear} onChange={setPCrear} />
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
              <p className="text-[12.5px] text-emerald-800 font-semibold">Acceso total al sistema — no requiere configurar permisos individuales.</p>
            </div>
          )}

          {errCrear && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-2xl px-3.5 py-3">
              <AlertTriangle size={13} className="text-red-500 shrink-0" />
              <p className="text-[12px] text-red-600">{errCrear}</p>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-1">
            <button onClick={() => setModalCrear(false)}
              className="px-4 py-2.5 rounded-xl text-[12.5px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all active:scale-95">Cancelar</button>
            <button onClick={crearUsuario} disabled={creando}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[12.5px] font-bold text-white bg-[#0e5c33] hover:bg-[#0a3d22] transition-all active:scale-95 shadow-sm disabled:opacity-50">
              {creando ? <><Loader2 size={13} className="animate-spin" />Creando…</> : <><Plus size={13} />Crear usuario</>}
            </button>
          </div>
        </div>
      </ModalOverlay>

      {/* ═══ MODAL EDITAR ═══════════════════════════════════════════════ */}
      <ModalOverlay open={modalEditar} onClose={() => setModalEditar(false)} maxW="max-w-2xl" noPad>
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 px-5 sm:px-6 pt-5 sm:pt-6 pb-4 sm:pb-5 shrink-0">
          <div className="flex items-start justify-between mb-3.5 sm:mb-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/15 flex items-center justify-center">
              <KeySquare size={17} className="text-white" />
            </div>
            <button onClick={() => setModalEditar(false)}
              className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all active:scale-90">
              <X size={13} className="text-white/80" />
            </button>
          </div>
          <p className="text-white text-[14px] sm:text-[15px] font-black truncate">{usuEdit?.nombre_completo}</p>
          <p className="text-white/50 text-[11px] sm:text-[11.5px] mt-0.5">Los permisos se aplican en tiempo real — sin recargar</p>
        </div>

        <div className="overflow-y-auto px-5 sm:px-6 py-4 sm:py-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className={lCls}>Nombre completo</label>
              <input className={iCls} value={fEditar.nombre_completo}
                onChange={e => setFEditar(p => ({ ...p, nombre_completo: e.target.value }))} />
            </div>
            <div>
              <label className={lCls}>Email</label>
              <input type="email" className={iCls} value={fEditar.email}
                onChange={e => setFEditar(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className={lCls}>Rol</label>
              <select className={iCls} value={fEditar.rol}
                onChange={e => setFEditar(p => ({ ...p, rol: e.target.value }))}>
                {roles.map(r => <option key={r.clave} value={r.clave}>{r.etiqueta}</option>)}
              </select>
            </div>
            {rolDe(fEditar.rol)?.aplica_filtro_estado && (
              <div>
                <label className={lCls}>Estado asignado</label>
                <select className={iCls} value={fEditar.estado_asignado}
                  onChange={e => setFEditar(p => ({ ...p, estado_asignado: e.target.value }))}>
                  <option value="">Sin estado específico</option>
                  {ESTADOS_MX.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            )}
          </div>

          {!rolDe(fEditar.rol)?.permisos_totales ? (
            <div>
              <p className={lCls}>Permisos por vista</p>
              <ArbolPermisos permisos={pEditar} onChange={setPEditar} />
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
              <p className="text-[12.5px] text-emerald-800 font-semibold">Acceso total al sistema.</p>
            </div>
          )}

          {errEdit && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-2xl px-3.5 py-3">
              <AlertTriangle size={13} className="text-red-500 shrink-0" />
              <p className="text-[12px] text-red-600">{errEdit}</p>
            </div>
          )}
          {savedOk && (
            <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl px-3.5 py-3">
              <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
              <p className="text-[12px] text-emerald-700 font-semibold">Cambios guardados y enviados en tiempo real ✓</p>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-1">
            <button onClick={() => setModalEditar(false)}
              className="px-4 py-2.5 rounded-xl text-[12.5px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all active:scale-95">Cerrar</button>
            <button onClick={guardarEditar} disabled={guardando}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[12.5px] font-bold text-white bg-gray-800 hover:bg-gray-900 transition-all active:scale-95 shadow-sm disabled:opacity-50">
              {guardando ? <><Loader2 size={13} className="animate-spin" />Guardando…</> : <><CheckCircle2 size={13} />Guardar cambios</>}
            </button>
          </div>
        </div>
      </ModalOverlay>

      {/* ═══ MODAL ELIMINAR ═════════════════════════════════════════════ */}
      <ModalOverlay open={modalDel} onClose={() => setModalDel(false)} maxW="max-w-sm" noPad>
        <div className="bg-gradient-to-br from-red-600 to-red-700 px-5 sm:px-6 pt-5 sm:pt-6 pb-4 sm:pb-5">
          <div className="flex items-start justify-between mb-3.5 sm:mb-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Trash2 size={17} className="text-white" />
            </div>
            <button onClick={() => setModalDel(false)}
              className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all active:scale-90">
              <X size={13} className="text-white/80" />
            </button>
          </div>
          <p className="text-white text-[14px] sm:text-[15px] font-black">Eliminar usuario</p>
          <p className="text-white/60 text-[11px] sm:text-[11.5px] mt-0.5">Esta acción no se puede deshacer</p>
        </div>

        <div className="px-5 sm:px-6 py-4 sm:py-5 flex flex-col gap-4">
          <p className="text-[13px] text-gray-700 leading-relaxed">
            <strong className="text-gray-900">{usuDel?.nombre_completo}</strong> perderá acceso inmediato al panel y todos sus permisos serán eliminados.
          </p>
          <div className="flex flex-col-reverse sm:flex-row gap-2.5">
            <button onClick={() => setModalDel(false)}
              className="flex-1 py-3 rounded-2xl text-[13px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all active:scale-95">Cancelar</button>
            <button onClick={eliminar} disabled={deleting}
              className="flex-1 py-3 rounded-2xl text-[13px] font-bold text-white bg-red-600 hover:bg-red-700 transition-all active:scale-95 shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
              {deleting ? <><Loader2 size={13} className="animate-spin" />Eliminando…</> : <><Trash2 size={13} />Sí, eliminar</>}
            </button>
          </div>
        </div>
      </ModalOverlay>

      {/* Credenciales */}
      {creds && <ModalCredenciales creds={creds} onClose={() => setCreds(null)} />}
    </div>
  );
}
