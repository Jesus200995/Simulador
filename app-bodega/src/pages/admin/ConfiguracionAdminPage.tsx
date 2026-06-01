import { useState, useEffect } from 'react';
import { Settings, RefreshCw, Save, Users, Plus, X, Eye, EyeOff, List, CheckCircle } from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const HDR  = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('simac_token')}` });

interface Parametros {
  margen_pct: number;
  ventana_dias: number;
  min_txns: number;
  harineras_n: number;
  servicios_default: number;
  flete_default: number;
  costo_fira: number;
  precio_garantia_sader: number;
}

interface Usuario {
  id: number; nombre_completo: string; email: string; rol: string; activo: boolean;
}

interface NuevoUsuario {
  nombre_completo: string; email: string; password: string; rol: string;
}

interface Concepto {
  id: number; nombre: string; estatus: string;
}

export default function ConfiguracionAdminPage() {
  const [params, setParams] = useState<Parametros | null>(null);
  const [editParams, setEditParams] = useState<Partial<Parametros>>({});
  const [savingParams, setSavingParams] = useState(false);
  const [savedParams, setSavedParams] = useState(false);

  const [admins, setAdmins] = useState<Usuario[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [nuevoUser, setNuevoUser] = useState<NuevoUsuario>({ nombre_completo: '', email: '', password: '', rol: 'responsable' });
  const [showPass, setShowPass] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createError, setCreateError] = useState('');

  /* ── Catálogos ── */
  const [conceptos, setConceptos] = useState<Concepto[]>([]);
  const [loadingConceptos, setLoadingConceptos] = useState(true);
  const [showConceptoModal, setShowConceptoModal] = useState(false);
  const [nuevoConcepto, setNuevoConcepto] = useState('');
  const [creatingConcepto, setCreatingConcepto] = useState(false);
  const [conceptoError, setConceptoError] = useState('');

  async function cargarParams() {
    try {
      const r = await fetch(`${BASE}/precios/parametros`, { headers: HDR() });
      const d = await r.json();
      setParams(d.parametros);
      setEditParams(d.parametros);
    } catch (e) { console.error(e); }
  }

  async function cargarAdmins() {
    setLoadingAdmins(true);
    try {
      const r = await fetch(`${BASE}/admin/usuarios?rol=admin`, { headers: HDR() });
      const d = await r.json();
      setAdmins(d.usuarios ?? d.productores ?? []);
    } catch (e) { console.error(e); } finally { setLoadingAdmins(false); }
  }

  async function cargarConceptos() {
    setLoadingConceptos(true);
    try {
      const r = await fetch(`${BASE}/cat-conceptos-servicio`, { headers: HDR() });
      const d = await r.json();
      setConceptos(d.conceptos ?? d ?? []);
    } catch (e) { console.error(e); } finally { setLoadingConceptos(false); }
  }

  async function proponerConcepto() {
    setConceptoError('');
    if (!nuevoConcepto.trim()) { setConceptoError('El nombre es obligatorio'); return; }
    setCreatingConcepto(true);
    try {
      const r = await fetch(`${BASE}/cat-conceptos-servicio/proponer`, {
        method: 'POST', headers: HDR(), body: JSON.stringify({ nombre: nuevoConcepto.trim() }),
      });
      const d = await r.json();
      if (!r.ok) { setConceptoError(d.error || 'Error al proponer concepto'); return; }
      setShowConceptoModal(false);
      setNuevoConcepto('');
      cargarConceptos();
    } catch { setConceptoError('Error de conexión'); } finally { setCreatingConcepto(false); }
  }

  async function toggleAprobar(id: number) {
    try {
      await fetch(`${BASE}/cat-conceptos-servicio/${id}/aprobar`, { method: 'PATCH', headers: HDR() });
      cargarConceptos();
    } catch (e) { console.error(e); }
  }

  useEffect(() => {
    cargarParams();
    cargarAdmins();
    cargarConceptos();
  }, []);

  async function guardarParams() {
    setSavingParams(true);
    try {
      const r = await fetch(`${BASE}/precios/parametros`, {
        method: 'PUT', headers: HDR(), body: JSON.stringify(editParams),
      });
      if (r.ok) { setSavedParams(true); setTimeout(() => setSavedParams(false), 3000); cargarParams(); }
    } catch (e) { console.error(e); } finally { setSavingParams(false); }
  }

  async function crearUsuario() {
    setCreateError('');
    if (!nuevoUser.nombre_completo || !nuevoUser.email || !nuevoUser.password) {
      setCreateError('Todos los campos son obligatorios'); return;
    }
    if (nuevoUser.password.length < 8) { setCreateError('La contraseña debe tener al menos 8 caracteres'); return; }
    setCreatingUser(true);
    try {
      const r = await fetch(`${BASE}/admin/crear-usuario`, {
        method: 'POST', headers: HDR(),
        body: JSON.stringify({ ...nuevoUser, curp: 'XXXXX00000XXXXXX00', telefono: '0000000000' }),
      });
      const d = await r.json();
      if (!r.ok) { setCreateError(d.error || 'Error al crear usuario'); return; }
      setShowModal(false);
      setNuevoUser({ nombre_completo: '', email: '', password: '', rol: 'responsable' });
      cargarAdmins();
    } catch (e) { setCreateError('Error de conexión'); } finally { setCreatingUser(false); }
  }

  const INPUT = 'w-full bg-[#0d1117] border border-white/[0.08] rounded-xl px-3 py-2 text-[12px] text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/40 transition-colors';
  const LABEL = 'text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block';

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-0.5">Sistema</p>
          <h1 className="text-[17px] sm:text-[19px] font-black text-white tracking-tight leading-none">Configuración</h1>
        </div>
      </div>

      {/* Parámetros del sistema */}
      <div className="bg-[#080c11] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.05]">
          <div className="flex items-center gap-2">
            <Settings size={13} className="text-emerald-400" />
            <h2 className="text-[13px] font-bold text-white">Parámetros del Sistema</h2>
          </div>
          <button
            onClick={guardarParams} disabled={savingParams}
            className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all active:scale-95 disabled:opacity-50"
            style={{ background: savedParams ? 'rgba(34,197,94,0.1)' : 'rgba(26,92,56,0.2)', borderColor: savedParams ? 'rgba(34,197,94,0.3)' : 'rgba(26,92,56,0.4)', color: savedParams ? '#22c55e' : '#4ade80' }}
          >
            <Save size={11} />
            {savedParams ? 'Guardado' : savingParams ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { key: 'margen_pct' as keyof Parametros, label: 'Umbral brecha crítica (%)', hint: 'Porcentaje sobre PO+S' },
            { key: 'ventana_dias' as keyof Parametros, label: 'Ventana de promedio PO (días)', hint: 'Días para promedio' },
            { key: 'servicios_default' as keyof Parametros, label: 'Servicios bodega por defecto', hint: 'MXN/ton' },
            { key: 'flete_default' as keyof Parametros, label: 'Flete por defecto', hint: 'MXN/ton' },
            { key: 'costo_fira' as keyof Parametros, label: 'Costo FIRA por defecto', hint: 'MXN/ton' },
            { key: 'precio_garantia_sader' as keyof Parametros, label: 'Precio garantía SADER', hint: 'MXN/ton' },
          ].map(({ key, label, hint }) => (
            <div key={key}>
              <label className={LABEL}>{label}</label>
              <input
                type="number" step="0.01" className={INPUT}
                value={editParams[key] ?? params?.[key] ?? ''}
                onChange={e => setEditParams(p => ({ ...p, [key]: parseFloat(e.target.value) }))}
              />
              <p className="text-[9px] text-gray-600 mt-1">{hint}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Gestión de usuarios admin */}
      <div className="bg-[#080c11] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.05]">
          <div className="flex items-center gap-2">
            <Users size={13} className="text-blue-400" />
            <h2 className="text-[13px] font-bold text-white">Gestión de Administradores</h2>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 text-[11px] font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 px-3 py-1.5 rounded-lg transition-all active:scale-95"
          >
            <Plus size={11} /> Nuevo usuario
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-600 text-[9px] uppercase tracking-widest font-bold">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loadingAdmins ? (
                [1,2,3].map(i => (
                  <tr key={i}>
                    <td colSpan={4} className="px-4 py-3"><div className="h-5 bg-white/[0.03] rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : admins.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-[12px] text-gray-600">Sin administradores registrados</td></tr>
              ) : admins.map((u, i) => (
                <tr key={i} className="hover:bg-white/[0.015] transition-colors">
                  <td className="px-4 py-2.5 text-[12px] font-semibold text-gray-200">{u.nombre_completo}</td>
                  <td className="px-4 py-2.5 text-[12px] text-gray-400">{u.email}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-2 py-0.5 uppercase">
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${u.activo ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-red-400 bg-red-500/10 border border-red-500/20'}`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Catálogos del sistema */}
      <div className="bg-[#080c11] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.05]">
          <div className="flex items-center gap-2">
            <List size={13} className="text-amber-400" />
            <div>
              <h2 className="text-[13px] font-bold text-white">Catálogos del sistema</h2>
              <p className="text-[10px] text-gray-500">Conceptos de servicio de bodega</p>
            </div>
          </div>
          <button
            onClick={() => setShowConceptoModal(true)}
            className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 px-3 py-1.5 rounded-lg transition-all active:scale-95"
          >
            <Plus size={11} /> Nuevo concepto
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-600 text-[9px] uppercase tracking-widest font-bold">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3 text-center">Estatus</th>
                <th className="px-4 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loadingConceptos ? (
                [1,2,3].map(i => (
                  <tr key={i}>
                    <td colSpan={3} className="px-4 py-3"><div className="h-5 bg-white/[0.03] rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : conceptos.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-[12px] text-gray-600">Sin conceptos registrados</td></tr>
              ) : conceptos.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.015] transition-colors">
                  <td className="px-4 py-2.5 text-[12px] font-semibold text-gray-200">{c.nombre}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${
                      c.estatus === 'aprobado'
                        ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                        : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                    }`}>
                      {c.estatus}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <button
                      onClick={() => toggleAprobar(c.id)}
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all active:scale-95 ${
                        c.estatus === 'aprobado'
                          ? 'text-gray-400 bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.07]'
                          : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15'
                      }`}
                    >
                      <CheckCircle size={10} />
                      {c.estatus === 'aprobado' ? 'Revocar' : 'Aprobar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal crear concepto */}
      {showConceptoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0d1117] border border-white/[0.08] rounded-2xl p-5 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-bold text-white">Nuevo concepto de servicio</h3>
              <button onClick={() => { setShowConceptoModal(false); setConceptoError(''); }} className="text-gray-500 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className={LABEL}>Nombre del concepto</label>
                <input className={INPUT} value={nuevoConcepto} onChange={e => setNuevoConcepto(e.target.value)} placeholder="Ej. Secado, Fumigación" />
              </div>
              {conceptoError && <p className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{conceptoError}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={() => { setShowConceptoModal(false); setConceptoError(''); }} className="flex-1 text-[12px] font-bold text-gray-400 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] py-2 rounded-xl transition-all active:scale-95">Cancelar</button>
                <button onClick={proponerConcepto} disabled={creatingConcepto} className="flex-1 text-[12px] font-bold text-white bg-amber-600 hover:bg-amber-500 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-50">
                  {creatingConcepto ? 'Creando...' : 'Proponer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear usuario */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0d1117] border border-white/[0.08] rounded-2xl p-5 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-bold text-white">Crear nuevo usuario</h3>
              <button onClick={() => { setShowModal(false); setCreateError(''); }} className="text-gray-500 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className={LABEL}>Nombre completo</label>
                <input className={INPUT} value={nuevoUser.nombre_completo} onChange={e => setNuevoUser(p => ({ ...p, nombre_completo: e.target.value }))} placeholder="Ej. Juan Pérez García" />
              </div>
              <div>
                <label className={LABEL}>Email</label>
                <input type="email" className={INPUT} value={nuevoUser.email} onChange={e => setNuevoUser(p => ({ ...p, email: e.target.value }))} placeholder="usuario@ejemplo.com" />
              </div>
              <div>
                <label className={LABEL}>Contraseña</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} className={INPUT + ' pr-9'} value={nuevoUser.password} onChange={e => setNuevoUser(p => ({ ...p, password: e.target.value }))} placeholder="Mín. 8 caracteres" />
                  <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
              <div>
                <label className={LABEL}>Rol</label>
                <select className={INPUT} value={nuevoUser.rol} onChange={e => setNuevoUser(p => ({ ...p, rol: e.target.value }))}>
                  <option value="admin">Admin</option>
                  <option value="responsable">Responsable</option>
                </select>
              </div>
              {createError && <p className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{createError}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={() => { setShowModal(false); setCreateError(''); }} className="flex-1 text-[12px] font-bold text-gray-400 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] py-2 rounded-xl transition-all active:scale-95">Cancelar</button>
                <button onClick={crearUsuario} disabled={creatingUser} className="flex-1 text-[12px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-50">
                  {creatingUser ? 'Creando...' : 'Crear usuario'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
