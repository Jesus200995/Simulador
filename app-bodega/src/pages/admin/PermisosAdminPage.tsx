import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, Plus, Pencil, Trash2, X, Eye, EyeOff,
  Copy, Download, CheckCircle2, AlertTriangle, ChevronDown,
  ChevronRight, Loader2, RefreshCw,
} from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const HDR  = (): Record<string, string> => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('simac_token')}`,
});

// ─── Tipos ──────────────────────────────────────────────────────────────────
interface RolPanel { clave: string; etiqueta: string; permisos_totales: boolean; aplica_filtro_estado: boolean; vistas_default: Record<string, string[]> | null; }
interface UsuarioPanel { id: number; nombre_completo: string; email: string; rol: string; rol_etiqueta: string; activo: boolean; estado_asignado: string | null; debe_cambiar_pass: boolean; ultimo_login: string | null; created_at: string; permisos_totales: boolean; aplica_filtro_estado: boolean; }
interface Permiso { vista: string; sub_accion: string; habilitado: boolean; }
interface CredencialesNuevas { email: string; password_temporal: string; nombre_completo: string; rol: string; estado_asignado: string | null; }

const VISTAS_LABELS: Record<string, { label: string; icon: string }> = {
  dashboard:           { label: 'Dashboard / Resumen',  icon: '📊' },
  productores:         { label: 'Productores',           icon: '👥' },
  bodegas:             { label: 'Bodegas',               icon: '🏚' },
  alertas:             { label: 'Alertas',               icon: '🔔' },
  precios:             { label: 'Precios',               icon: '💹' },
  produccion:          { label: 'Producción',            icon: '🌽' },
  mercado:             { label: 'Mercado',               icon: '📈' },
  senasica:            { label: 'SENASICA',              icon: '🌿' },
  'avisos-privacidad': { label: 'Avisos Privacidad',     icon: '📋' },
};

const ACCION_LABELS: Record<string, string> = {
  ver: 'Ver', crear: 'Crear', editar: 'Editar', eliminar: 'Eliminar', exportar: 'Exportar',
};

// Mapa de vistas → acciones disponibles (igual que backend)
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

// Estados de la república mexicana
const ESTADOS_MX = [
  'AGUASCALIENTES','BAJA CALIFORNIA','BAJA CALIFORNIA SUR','CAMPECHE','CHIAPAS','CHIHUAHUA',
  'CIUDAD DE MEXICO','COAHUILA','COLIMA','DURANGO','ESTADO DE MEXICO','GUANAJUATO','GUERRERO',
  'HIDALGO','JALISCO','MICHOACAN','MORELOS','NAYARIT','NUEVO LEON','OAXACA','PUEBLA','QUERETARO',
  'QUINTANA ROO','SAN LUIS POTOSI','SINALOA','SONORA','TABASCO','TAMAULIPAS','TLAXCALA',
  'VERACRUZ','YUCATAN','ZACATECAS',
];

// ─── Helpers UI ─────────────────────────────────────────────────────────────
const inputCls = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-[12.5px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1A5C38]/50 focus:ring-2 focus:ring-[#1A5C38]/10 transition-all';
const labelCls = 'text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block';
const btnPrimary = 'flex items-center gap-2 bg-[#0e5c33] hover:bg-[#0a3d22] text-white text-[12.5px] font-bold px-4 py-2.5 rounded-xl transition-all active:scale-[0.98] shadow-sm hover:shadow-md disabled:opacity-50';
const btnSecondary = 'flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[12.5px] font-bold px-4 py-2.5 rounded-xl transition-all active:scale-[0.98]';
const btnDanger = 'flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-[12.5px] font-bold px-4 py-2.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50';

function rolColor(rol: string) {
  if (rol === 'admin')   return 'bg-[#0e5c33] text-white';
  if (rol === 'oref')    return 'bg-violet-100 text-violet-800';
  return 'bg-emerald-100 text-emerald-800';
}

function Avatar({ nombre, color = '#0e5c33' }: { nombre: string; color?: string }) {
  const ini = nombre.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
  return (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[11px] font-black shrink-0"
      style={{ background: color }}>
      {ini}
    </div>
  );
}

// ─── Componente árbol de permisos ────────────────────────────────────────────
function ArbolPermisos({
  permisos, onChange, disabled = false,
}: {
  permisos: Permiso[];
  onChange: (permisos: Permiso[]) => void;
  disabled?: boolean;
}) {
  const [abiertos, setAbiertos] = useState<Record<string, boolean>>({});

  function getHabilitado(vista: string, accion: string) {
    return permisos.find(p => p.vista === vista && p.sub_accion === accion)?.habilitado ?? false;
  }

  function vistaActiva(vista: string) {
    return getHabilitado(vista, 'ver');
  }

  function toggleVista(vista: string) {
    const acciones = VISTAS_ACCIONES[vista] ?? [];
    const activa   = vistaActiva(vista);
    const nuevo    = permisos.filter(p => p.vista !== vista);
    acciones.forEach(accion => nuevo.push({ vista, sub_accion: accion, habilitado: !activa }));
    if (!activa) setAbiertos(a => ({ ...a, [vista]: true }));
    onChange(nuevo);
  }

  function toggleAccion(vista: string, accion: string) {
    const actual  = getHabilitado(vista, accion);
    const filtrado = permisos.filter(p => !(p.vista === vista && p.sub_accion === accion));
    filtrado.push({ vista, sub_accion: accion, habilitado: !actual });
    onChange(filtrado);
  }

  return (
    <div className="flex flex-col gap-2">
      {Object.entries(VISTAS_LABELS).map(([vista, { label, icon }]) => {
        const acciones = VISTAS_ACCIONES[vista] ?? [];
        const activa   = vistaActiva(vista);
        const abierto  = abiertos[vista] ?? activa;
        const soloverVista = acciones.length === 1; // solo "ver"

        return (
          <div key={vista} className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Fila principal de la vista */}
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-gray-50">
              <button
                type="button"
                onClick={() => !soloverVista && setAbiertos(a => ({ ...a, [vista]: !abierto }))}
                className="flex items-center gap-2 flex-1 min-w-0"
                disabled={soloverVista || disabled}
              >
                <span className="text-[15px]">{icon}</span>
                <span className="text-[12.5px] font-bold text-gray-800 truncate">{label}</span>
                {!soloverVista && (
                  <span className="text-gray-400 ml-auto">
                    {abierto ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </span>
                )}
              </button>
              {/* Toggle principal */}
              <button
                type="button"
                disabled={disabled}
                onClick={() => toggleVista(vista)}
                className={`ml-3 w-9 h-5 rounded-full relative transition-colors shrink-0 ${activa ? 'bg-[#0e5c33]' : 'bg-gray-300'} ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-all shadow ${activa ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>

            {/* Sub-permisos (solo si vista activa y tiene más acciones) */}
            {activa && !soloverVista && abierto && (
              <div className="bg-white border-t border-gray-100 px-3.5 py-2 flex flex-col gap-1.5">
                {acciones.filter(a => a !== 'ver').map(accion => (
                  <div key={accion} className="flex items-center justify-between pl-6 relative">
                    <div className="absolute left-3 top-1/2 w-2.5 h-px bg-gray-300" />
                    <span className="text-[11.5px] text-gray-600">{ACCION_LABELS[accion] ?? accion}</span>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleAccion(vista, accion)}
                      className={`w-7 h-[15px] rounded-full relative transition-colors shrink-0 ${getHabilitado(vista, accion) ? 'bg-[#0e5c33]' : 'bg-gray-300'} ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className={`absolute w-[11px] h-[11px] bg-white rounded-full top-[2px] transition-all shadow ${getHabilitado(vista, accion) ? 'right-[2px]' : 'left-[2px]'}`} />
                    </button>
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

// ─── Modal base Apple-style ──────────────────────────────────────────────────
function Modal({ open, onClose, title, subtitle, children, maxWidth = 'max-w-lg' }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode; maxWidth?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-md" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-modal-in`}
        style={{ animation: 'modal-in .25s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <style>{`@keyframes modal-in{from{opacity:0;transform:scale(.93) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-[15px] font-black text-gray-900">{title}</h2>
            {subtitle && <p className="text-[11.5px] text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all ml-4 mt-0.5 shrink-0">
            <X size={13} className="text-gray-600" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Modal credenciales ──────────────────────────────────────────────────────
function ModalCredenciales({ creds, onClose }: { creds: CredencialesNuevas; onClose: () => void }) {
  const [copiado, setCopiado] = useState(false);

  function copiar() {
    const texto = `Nombre: ${creds.nombre_completo}\nEmail: ${creds.email}\nContraseña temporal: ${creds.password_temporal}\nRol: ${creds.rol}${creds.estado_asignado ? `\nEstado: ${creds.estado_asignado}` : ''}`;
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  function descargarCSV() {
    const cabecera = 'nombre_completo,email,password_temporal,rol,estado_asignado';
    const fila = `"${creds.nombre_completo}","${creds.email}","${creds.password_temporal}","${creds.rol}","${creds.estado_asignado ?? ''}"`;
    const blob = new Blob([`${cabecera}\n${fila}`], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `credenciales_SIMAC_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-950/70 backdrop-blur-md" />
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        style={{ animation: 'modal-in .25s cubic-bezier(0.34,1.56,0.64,1)' }}>

        <div className="bg-[#0e5c33] px-6 py-5 flex items-center gap-3">
          <CheckCircle2 size={22} className="text-emerald-300 shrink-0" />
          <div>
            <p className="text-white text-[13px] font-black">Usuario creado exitosamente</p>
            <p className="text-white/60 text-[11px] mt-0.5">Guarda estas credenciales ahora — no podrás verlas después</p>
          </div>
        </div>

        <div className="px-6 py-5 flex flex-col gap-3">
          {/* Aviso */}
          <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-3">
            <AlertTriangle size={14} className="text-amber-600 shrink-0" />
            <p className="text-amber-700 text-[11.5px] font-medium">La contraseña temporal <strong>solo se muestra una vez</strong>. El usuario deberá cambiarla en su primer login.</p>
          </div>

          {/* Caja de credenciales */}
          <div className="bg-gray-50 border border-gray-200 border-dashed rounded-xl p-4 font-mono text-[12px] flex flex-col gap-2">
            <div className="flex gap-2"><span className="text-gray-500 min-w-[110px]">Nombre</span><span className="text-gray-900 font-bold">{creds.nombre_completo}</span></div>
            <div className="flex gap-2"><span className="text-gray-500 min-w-[110px]">Email</span><span className="text-gray-900 font-bold">{creds.email}</span></div>
            <div className="flex gap-2"><span className="text-gray-500 min-w-[110px]">Contraseña</span><span className="text-[#0e5c33] font-black tracking-wide">{creds.password_temporal}</span></div>
            <div className="flex gap-2"><span className="text-gray-500 min-w-[110px]">Rol</span><span className="text-gray-900 font-bold capitalize">{creds.rol}</span></div>
            {creds.estado_asignado && <div className="flex gap-2"><span className="text-gray-500 min-w-[110px]">Estado</span><span className="text-gray-900 font-bold">{creds.estado_asignado}</span></div>}
          </div>

          <div className="flex gap-2.5">
            <button onClick={copiar} className={`flex-1 flex items-center justify-center gap-2 text-[12px] font-bold py-2.5 rounded-xl border transition-all ${copiado ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'}`}>
              {copiado ? <CheckCircle2 size={14} /> : <Copy size={14} />}
              {copiado ? 'Copiado' : 'Copiar todo'}
            </button>
            <button onClick={descargarCSV} className="flex-1 flex items-center justify-center gap-2 text-[12px] font-bold py-2.5 rounded-xl border border-[#1A5C38]/30 bg-emerald-50 text-[#0e5c33] hover:bg-emerald-100 transition-all">
              <Download size={14} />Descargar CSV
            </button>
          </div>

          <button onClick={onClose} className="w-full bg-[#0e5c33] hover:bg-[#0a3d22] text-white text-[12.5px] font-bold py-3 rounded-xl transition-all mt-1">
            Entendido, ya guardé las credenciales
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────
export default function PermisosAdminPage() {
  const [usuarios,  setUsuarios]  = useState<UsuarioPanel[]>([]);
  const [roles,     setRoles]     = useState<RolPanel[]>([]);
  const [loading,   setLoading]   = useState(true);

  // Modal crear
  const [modalCrear,  setModalCrear]  = useState(false);
  const [formCrear,   setFormCrear]   = useState({ nombre_completo: '', email: '', rol: 'user', estado_asignado: '' });
  const [permisosCrear, setPermisosCrear] = useState<Permiso[]>([]);
  const [creando,     setCreando]     = useState(false);
  const [errCrear,    setErrCrear]    = useState('');
  const [creds,       setCreds]       = useState<CredencialesNuevas | null>(null);

  // Modal editar
  const [modalEditar,   setModalEditar]   = useState(false);
  const [usuEdit,       setUsuEdit]       = useState<UsuarioPanel | null>(null);
  const [formEditar,    setFormEditar]    = useState({ nombre_completo: '', email: '', rol: 'user', estado_asignado: '' });
  const [permisosEditar,setPermisosEditar] = useState<Permiso[]>([]);
  const [guardandoPerm, setGuardandoPerm] = useState(false);
  const [errEditar,     setErrEditar]     = useState('');
  const [guardadoOk,    setGuardadoOk]    = useState(false);

  // Modal eliminar
  const [modalEliminar, setModalEliminar] = useState(false);
  const [usuEliminar,   setUsuEliminar]   = useState<UsuarioPanel | null>(null);
  const [eliminando,    setEliminando]    = useState(false);

  const rolActual = (clave: string) => roles.find(r => r.clave === clave);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [rU, rR] = await Promise.all([
        fetch(`${BASE}/admin/permisos/usuarios`, { headers: HDR() }),
        fetch(`${BASE}/admin/permisos/roles`,    { headers: HDR() }),
      ]);
      const dU = await rU.json(); const dR = await rR.json();
      setUsuarios(dU.usuarios ?? []);
      setRoles(dR.roles ?? []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // ── Pre-cargar permisos default al cambiar rol en form crear ──
  useEffect(() => {
    const r = rolActual(formCrear.rol);
    if (!r || r.permisos_totales) { setPermisosCrear([]); return; }
    const defaults: Permiso[] = [];
    const vd = r.vistas_default ?? {};
    Object.entries(VISTAS_ACCIONES).forEach(([vista, acciones]) => {
      const habilitadas = vd[vista] ?? [];
      acciones.forEach(accion => defaults.push({ vista, sub_accion: accion, habilitado: habilitadas.includes(accion) }));
    });
    setPermisosCrear(defaults);
  }, [formCrear.rol, roles]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Abrir modal editar: cargar permisos actuales ──
  async function abrirEditar(u: UsuarioPanel) {
    setUsuEdit(u);
    setFormEditar({ nombre_completo: u.nombre_completo, email: u.email, rol: u.rol, estado_asignado: u.estado_asignado ?? '' });
    setErrEditar(''); setGuardadoOk(false);
    try {
      const r = await fetch(`${BASE}/admin/permisos/${u.id}`, { headers: HDR() });
      const d = await r.json();
      if (d.permisos_totales) { setPermisosEditar([]); }
      else {
        // Rellenar acciones faltantes como false
        const perms: Permiso[] = [];
        Object.entries(VISTAS_ACCIONES).forEach(([vista, acciones]) => {
          acciones.forEach(accion => {
            const ex = d.permisos?.find((p: Permiso) => p.vista === vista && p.sub_accion === accion);
            perms.push({ vista, sub_accion: accion, habilitado: ex?.habilitado ?? false });
          });
        });
        setPermisosEditar(perms);
      }
    } catch { setPermisosEditar([]); }
    setModalEditar(true);
  }

  // ── Crear usuario ──
  async function crearUsuario() {
    setErrCrear('');
    if (!formCrear.nombre_completo.trim() || !formCrear.email.trim()) { setErrCrear('Nombre y email son obligatorios'); return; }
    const r = rolActual(formCrear.rol);
    if (r?.aplica_filtro_estado && !formCrear.estado_asignado) { setErrCrear('Selecciona el estado asignado'); return; }
    setCreando(true);
    try {
      const resp = await fetch(`${BASE}/admin/permisos/usuarios`, {
        method: 'POST', headers: HDR(),
        body: JSON.stringify({
          nombre_completo: formCrear.nombre_completo.trim(),
          email:           formCrear.email.trim().toLowerCase(),
          rol:             formCrear.rol,
          estado_asignado: r?.aplica_filtro_estado ? formCrear.estado_asignado : null,
          permisos:        r?.permisos_totales ? [] : permisosCrear,
        }),
      });
      const d = await resp.json();
      if (!resp.ok) { setErrCrear(d.error || 'Error al crear usuario'); return; }
      setModalCrear(false);
      setFormCrear({ nombre_completo: '', email: '', rol: 'user', estado_asignado: '' });
      setCreds({
        email:             d.usuario.email,
        password_temporal: d.password_temporal,
        nombre_completo:   d.usuario.nombre_completo,
        rol:               d.usuario.rol,
        estado_asignado:   d.usuario.estado_asignado ?? null,
      });
      cargar();
    } catch { setErrCrear('Error de conexión'); } finally { setCreando(false); }
  }

  // ── Guardar permisos en editar (en caliente via SSE) ──
  async function guardarPermisos() {
    if (!usuEdit) return;
    setGuardandoPerm(true); setErrEditar(''); setGuardadoOk(false);
    try {
      // Guardar datos básicos
      await fetch(`${BASE}/admin/permisos/usuarios/${usuEdit.id}`, {
        method: 'PATCH', headers: HDR(),
        body: JSON.stringify({
          nombre_completo: formEditar.nombre_completo.trim(),
          email:           formEditar.email.trim().toLowerCase(),
          rol:             formEditar.rol,
          estado_asignado: rolActual(formEditar.rol)?.aplica_filtro_estado ? formEditar.estado_asignado : null,
        }),
      });
      // Guardar permisos (SSE los empuja al usuario)
      const r = rolActual(formEditar.rol);
      if (!r?.permisos_totales) {
        await fetch(`${BASE}/admin/permisos/${usuEdit.id}`, {
          method: 'PATCH', headers: HDR(),
          body: JSON.stringify({ permisos: permisosEditar }),
        });
      }
      setGuardadoOk(true);
      setTimeout(() => setGuardadoOk(false), 2000);
      cargar();
    } catch { setErrEditar('Error al guardar cambios'); } finally { setGuardandoPerm(false); }
  }

  // ── Eliminar usuario ──
  async function eliminarUsuario() {
    if (!usuEliminar) return;
    setEliminando(true);
    try {
      await fetch(`${BASE}/admin/permisos/usuarios/${usuEliminar.id}`, { method: 'DELETE', headers: HDR() });
      setModalEliminar(false); setUsuEliminar(null); cargar();
    } catch { /* ignore */ } finally { setEliminando(false); }
  }

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">

      {/* Header de sección */}
      <div className="bg-[#eef8f2] rounded-b-2xl border border-[#1A5C38]/30 border-t-0 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10.5px] text-[#1A5C38]/70 font-medium">
          <ShieldCheck size={11} className="text-[#1A5C38]" />
          <span>Permisos Administrativos</span>
          <span className="text-[#1A5C38]/30">·</span>
          <span>{usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} del panel</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={cargar} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => { setErrCrear(''); setModalCrear(true); }}
            className="flex items-center gap-1.5 bg-[#0e5c33] hover:bg-[#0a3d22] text-white text-[10.5px] font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95 shadow-sm">
            <Plus size={12} /> Nuevo usuario
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
            <Loader2 size={16} className="animate-spin" /><span className="text-[12.5px]">Cargando usuarios…</span>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <ShieldCheck size={32} className="mb-3 opacity-30" />
            <p className="text-[13px] font-semibold">No hay usuarios del panel</p>
            <p className="text-[11.5px] mt-1">Crea el primer usuario con el botón de arriba</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Usuario</th>
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 py-3">Rol</th>
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 py-3">Estado</th>
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 py-3">Último acceso</th>
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 py-3">Estado cuenta</th>
                  <th className="text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar nombre={u.nombre_completo} color={u.rol === 'admin' ? '#0e5c33' : u.rol === 'oref' ? '#6d28d9' : '#1a7a44'} />
                        <div>
                          <p className="font-bold text-gray-900">{u.nombre_completo}</p>
                          <p className="text-[11px] text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-[10.5px] font-bold px-2 py-1 rounded-full uppercase tracking-wide ${rolColor(u.rol)}`}>
                        {u.rol_etiqueta ?? u.rol}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {u.estado_asignado
                        ? <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">{u.estado_asignado}</span>
                        : <span className="text-[11px] text-gray-400">— Total —</span>}
                    </td>
                    <td className="px-3 py-3 text-gray-500">
                      {u.ultimo_login ? new Date(u.ultimo_login).toLocaleString('es-MX', { dateStyle:'short', timeStyle:'short' }) : <span className="text-amber-500 font-medium">Nunca</span>}
                    </td>
                    <td className="px-3 py-3">
                      {u.debe_cambiar_pass
                        ? <span className="text-[10.5px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Pass pendiente</span>
                        : <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Activo</span>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => abrirEditar(u)}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600 hover:text-[#0e5c33] bg-gray-100 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-200 px-2.5 py-1.5 rounded-lg transition-all">
                          <Pencil size={11} /> Editar
                        </button>
                        <button onClick={() => { setUsuEliminar(u); setModalEliminar(true); }}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-100 hover:border-red-200 px-2.5 py-1.5 rounded-lg transition-all">
                          <Trash2 size={11} /> Eliminar
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

      {/* ════ MODAL CREAR ════ */}
      <Modal open={modalCrear} onClose={() => setModalCrear(false)}
        title="Nuevo usuario del panel" subtitle="Email como identificador · Contraseña temporal auto-generada"
        maxWidth="max-w-2xl">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nombre completo *</label>
              <input className={inputCls} value={formCrear.nombre_completo}
                onChange={e => setFormCrear(p => ({ ...p, nombre_completo: e.target.value }))}
                placeholder="María García López" />
            </div>
            <div>
              <label className={labelCls}>Email institucional *</label>
              <input type="email" className={inputCls} value={formCrear.email}
                onChange={e => setFormCrear(p => ({ ...p, email: e.target.value }))}
                placeholder="m.garcia@simac.mx" />
            </div>
            <div>
              <label className={labelCls}>Rol *</label>
              <select className={inputCls + ' appearance-none [&>option]:text-gray-900'}
                value={formCrear.rol}
                onChange={e => setFormCrear(p => ({ ...p, rol: e.target.value, estado_asignado: '' }))}>
                {roles.map(r => <option key={r.clave} value={r.clave}>{r.etiqueta}</option>)}
              </select>
            </div>
            {rolActual(formCrear.rol)?.aplica_filtro_estado && (
              <div>
                <label className={labelCls}>Estado asignado *</label>
                <select className={inputCls + ' appearance-none [&>option]:text-gray-900'}
                  value={formCrear.estado_asignado}
                  onChange={e => setFormCrear(p => ({ ...p, estado_asignado: e.target.value }))}>
                  <option value="">Selecciona un estado…</option>
                  {ESTADOS_MX.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Árbol de permisos (solo si rol no tiene permisos totales) */}
          {!rolActual(formCrear.rol)?.permisos_totales && (
            <div>
              <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider mb-2">Permisos por vista</p>
              <ArbolPermisos permisos={permisosCrear} onChange={setPermisosCrear} />
            </div>
          )}

          {rolActual(formCrear.rol)?.permisos_totales && (
            <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
              <p className="text-emerald-800 text-[12px] font-semibold">Este rol tiene acceso total al sistema — no requiere configurar permisos individuales.</p>
            </div>
          )}

          {errCrear && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
              <AlertTriangle size={13} className="text-red-500 shrink-0" />
              <p className="text-red-600 text-[12px]">{errCrear}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => setModalCrear(false)} className={btnSecondary}>Cancelar</button>
            <button type="button" onClick={crearUsuario} disabled={creando} className={btnPrimary}>
              {creando ? <><Loader2 size={13} className="animate-spin" />Creando…</> : <><Plus size={13} />Crear usuario</>}
            </button>
          </div>
        </div>
      </Modal>

      {/* ════ MODAL EDITAR ════ */}
      <Modal open={modalEditar} onClose={() => setModalEditar(false)}
        title={`Editar · ${usuEdit?.nombre_completo}`}
        subtitle="Los cambios de permisos se aplican en tiempo real al usuario"
        maxWidth="max-w-2xl">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nombre completo</label>
              <input className={inputCls} value={formEditar.nombre_completo}
                onChange={e => setFormEditar(p => ({ ...p, nombre_completo: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" className={inputCls} value={formEditar.email}
                onChange={e => setFormEditar(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Rol</label>
              <select className={inputCls + ' appearance-none [&>option]:text-gray-900'}
                value={formEditar.rol}
                onChange={e => setFormEditar(p => ({ ...p, rol: e.target.value }))}>
                {roles.map(r => <option key={r.clave} value={r.clave}>{r.etiqueta}</option>)}
              </select>
            </div>
            {rolActual(formEditar.rol)?.aplica_filtro_estado && (
              <div>
                <label className={labelCls}>Estado asignado</label>
                <select className={inputCls + ' appearance-none [&>option]:text-gray-900'}
                  value={formEditar.estado_asignado}
                  onChange={e => setFormEditar(p => ({ ...p, estado_asignado: e.target.value }))}>
                  <option value="">Sin estado específico</option>
                  {ESTADOS_MX.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Árbol de permisos editable */}
          {!rolActual(formEditar.rol)?.permisos_totales && usuEdit && (
            <div>
              <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider mb-2">Permisos por vista</p>
              <ArbolPermisos permisos={permisosEditar} onChange={setPermisosEditar} />
            </div>
          )}

          {rolActual(formEditar.rol)?.permisos_totales && (
            <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
              <p className="text-emerald-800 text-[12px] font-semibold">Acceso total — sin permisos configurables para este rol.</p>
            </div>
          )}

          {errEditar && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
              <AlertTriangle size={13} className="text-red-500 shrink-0" />
              <p className="text-red-600 text-[12px]">{errEditar}</p>
            </div>
          )}
          {guardadoOk && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">
              <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
              <p className="text-emerald-700 text-[12px] font-semibold">Cambios guardados y enviados al usuario en tiempo real ✓</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => setModalEditar(false)} className={btnSecondary}>Cerrar</button>
            <button type="button" onClick={guardarPermisos} disabled={guardandoPerm} className={btnPrimary}>
              {guardandoPerm ? <><Loader2 size={13} className="animate-spin" />Guardando…</> : <><CheckCircle2 size={13} />Guardar cambios</>}
            </button>
          </div>
        </div>
      </Modal>

      {/* ════ MODAL ELIMINAR ════ */}
      <Modal open={modalEliminar} onClose={() => setModalEliminar(false)}
        title="Eliminar usuario" maxWidth="max-w-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center text-center gap-3 py-2">
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <div>
              <p className="text-[13.5px] font-black text-gray-900">¿Eliminar este usuario?</p>
              <p className="text-[12px] text-gray-500 mt-1">
                <strong className="text-gray-800">{usuEliminar?.nombre_completo}</strong> perderá acceso al panel inmediatamente. Esta acción no se puede deshacer.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setModalEliminar(false)} className={`${btnSecondary} flex-1 justify-center`}>Cancelar</button>
            <button type="button" onClick={eliminarUsuario} disabled={eliminando} className={`${btnDanger} flex-1 justify-center`}>
              {eliminando ? <><Loader2 size={13} className="animate-spin" />Eliminando…</> : <><Trash2 size={13} />Eliminar</>}
            </button>
          </div>
        </div>
      </Modal>

      {/* ════ MODAL CREDENCIALES ════ */}
      {creds && <ModalCredenciales creds={creds} onClose={() => setCreds(null)} />}

    </div>
  );
}
