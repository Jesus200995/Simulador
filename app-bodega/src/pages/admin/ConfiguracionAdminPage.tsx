import { useState, useEffect } from 'react';
import { Settings, Save, Users, Plus, X, Eye, EyeOff, List, CheckCircle } from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const HDR  = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('simac_token')}` });

interface Parametros {
  margen_pct: number; ventana_dias: number; min_txns: number;
  harineras_n: number; servicios_default: number; flete_default: number;
  costo_fira: number; precio_garantia_sader: number;
}
interface Usuario { id: number; nombre_completo: string; email: string; rol: string; activo: boolean; }
interface NuevoUsuario { nombre_completo: string; email: string; password: string; rol: string; }
interface Concepto { id: number; nombre: string; estatus: string; }

export default function ConfiguracionAdminPage() {
  const [params, setParams]         = useState<Parametros | null>(null);
  const [editParams, setEditParams] = useState<Partial<Parametros>>({});
  const [savingParams, setSavingParams] = useState(false);
  const [savedParams, setSavedParams]   = useState(false);
  const [admins, setAdmins]             = useState<Usuario[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [nuevoUser, setNuevoUser]       = useState<NuevoUsuario>({ nombre_completo: '', email: '', password: '', rol: 'responsable' });
  const [showPass, setShowPass]         = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createError, setCreateError]   = useState('');
  const [conceptos, setConceptos]       = useState<Concepto[]>([]);
  const [loadingConceptos, setLoadingConceptos] = useState(true);
  const [showConceptoModal, setShowConceptoModal] = useState(false);
  const [nuevoConcepto, setNuevoConcepto] = useState('');
  const [creatingConcepto, setCreatingConcepto] = useState(false);
  const [conceptoError, setConceptoError] = useState('');

  async function cargarParams() {
    try {
      const r = await fetch(`${BASE}/precios/parametros`, { headers: HDR() });
      const d = await r.json();
      setParams(d.parametros); setEditParams(d.parametros);
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
      setShowConceptoModal(false); setNuevoConcepto(''); cargarConceptos();
    } catch { setConceptoError('Error de conexión'); } finally { setCreatingConcepto(false); }
  }
  async function toggleAprobar(id: number) {
    try {
      await fetch(`${BASE}/cat-conceptos-servicio/${id}/aprobar`, { method: 'PATCH', headers: HDR() });
      cargarConceptos();
    } catch (e) { console.error(e); }
  }
  useEffect(() => { cargarParams(); cargarAdmins(); cargarConceptos(); }, []);
  async function guardarParams() {
    setSavingParams(true);
    try {
      const r = await fetch(`${BASE}/precios/parametros`, { method: 'PUT', headers: HDR(), body: JSON.stringify(editParams) });
      if (r.ok) { setSavedParams(true); setTimeout(() => setSavedParams(false), 2000); cargarParams(); }
    } catch (e) { console.error(e); } finally { setSavingParams(false); }
  }
  async function crearUsuario() {
    setCreateError('');
    if (!nuevoUser.nombre_completo || !nuevoUser.email || !nuevoUser.password) { setCreateError('Todos los campos son obligatorios'); return; }
    if (nuevoUser.password.length < 8) { setCreateError('La contraseña debe tener al menos 8 caracteres'); return; }
    setCreatingUser(true);
    try {
      const r = await fetch(`${BASE}/admin/crear-usuario`, {
        method: 'POST', headers: HDR(),
        body: JSON.stringify({ ...nuevoUser, curp: 'XXXXX00000XXXXXX00', telefono: '0000000000' }),
      });
      const d = await r.json();
      if (!r.ok) { setCreateError(d.error || 'Error al crear usuario'); return; }
      setShowModal(false); setNuevoUser({ nombre_completo: '', email: '', password: '', rol: 'responsable' }); cargarAdmins();
    } catch (e) { setCreateError('Error de conexión'); } finally { setCreatingUser(false); }
  }

  const INPUT = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[12px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#002f2a]/40 focus:bg-white transition-all duration-150';
  const LABEL = 'text-[9.5px] font-bold text-gray-400 uppercase tracking-wide mb-1 block';

  return (
    <div className="flex flex-col gap-3">

      {/* ── Barra de acciones ── */}
      <div className="bg-[#e6f0ef] flex-shrink-0 rounded-b-2xl border border-[#002f2a]/30 border-t-0 px-3 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10.5px] text-[#002f2a]/70 font-medium">
          <Settings size={11} className="text-[#002f2a]" />
          <span>Sistema SIMAC</span>
          <span className="text-[#002f2a]/30">·</span>
          <span>Parámetros · Usuarios · Catálogos</span>
        </div>
        <button
          onClick={guardarParams} disabled={savingParams}
          className={`flex items-center gap-1.5 text-[10.5px] font-bold px-3 py-1 rounded-lg border transition-all duration-150 active:scale-95 disabled:opacity-50 ${
            savedParams
              ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
              : 'bg-[#cce8e5] border-[#002f2a]/30 text-[#002f2a] hover:bg-[#002f2a] hover:text-white hover:border-transparent'
          }`}>
          <Save size={10} />
          {savedParams ? 'Guardado ✓' : savingParams ? 'Guardando…' : 'Guardar parámetros'}
        </button>
      </div>

      {/* Parámetros */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Settings size={13} className="text-[#002f2a]" />
            <h2 className="text-[12.5px] font-bold text-gray-900">Parámetros del Sistema</h2>
          </div>
          <button
            onClick={guardarParams} disabled={savingParams}
            className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all duration-150 active:scale-95 disabled:opacity-50 ${
              savedParams
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                : 'bg-[#e6f0ef] border-[#002f2a]/20 text-[#002f2a] hover:bg-[#002f2a] hover:text-white hover:border-transparent'
            }`}
          >
            <Save size={11} />
            {savedParams ? 'Guardado' : savingParams ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { key: 'margen_pct'             as keyof Parametros, label: 'Umbral brecha crítica (%)',       hint: 'Porcentaje sobre PO+S' },
            { key: 'ventana_dias'           as keyof Parametros, label: 'Ventana promedio PO (días)',       hint: 'Días para cálculo promedio' },
            { key: 'servicios_default'      as keyof Parametros, label: 'Servicios bodega por defecto',    hint: 'MXN/ton' },
            { key: 'flete_default'          as keyof Parametros, label: 'Flete por defecto',               hint: 'MXN/ton' },
            { key: 'costo_fira'             as keyof Parametros, label: 'Costo FIRA por defecto',          hint: 'MXN/ton' },
            { key: 'precio_garantia_sader'  as keyof Parametros, label: 'Precio garantía SADER',           hint: 'MXN/ton' },
          ].map(({ key, label, hint }) => (
            <div key={key} className="space-y-1">
              <label className={LABEL}>{label}</label>
              <input
                type="number" step="0.01" className={INPUT}
                value={editParams[key] ?? params?.[key] ?? ''}
                onChange={e => setEditParams(p => ({ ...p, [key]: parseFloat(e.target.value) }))}
              />
              <p className="text-[9px] text-gray-400">{hint}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Admins */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Users size={13} className="text-blue-600" />
            <h2 className="text-[12.5px] font-bold text-gray-900">Gestión de Administradores</h2>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-transparent px-3 py-1.5 rounded-lg transition-all duration-150 active:scale-95">
            <Plus size={11} /> Nuevo usuario
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 text-[9.5px] uppercase tracking-wide font-bold bg-gray-50/60">
                <th className="px-4 py-2.5">Nombre</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Rol</th>
                <th className="px-4 py-2.5 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loadingAdmins ? (
                [1,2,3].map(i => (
                  <tr key={i}><td colSpan={4} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : admins.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-[12px] text-gray-400">Sin administradores registrados</td></tr>
              ) : admins.map((u, i) => (
                <tr key={i} className="hover:bg-gray-50/60 transition-all duration-150">
                  <td className="px-4 py-2.5 text-[12px] font-semibold text-gray-800">{u.nombre_completo}</td>
                  <td className="px-4 py-2.5 text-[11.5px] text-gray-500">{u.email}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 uppercase">
                      {u.rol.charAt(0).toUpperCase() + u.rol.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${u.activo ? 'text-emerald-600 bg-emerald-50 border border-emerald-200' : 'text-red-600 bg-red-50 border border-red-200'}`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Catálogos */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <List size={13} className="text-amber-600" />
            <div>
              <h2 className="text-[12.5px] font-bold text-gray-900">Catálogos del sistema</h2>
              <p className="text-[10px] text-gray-400">Conceptos de servicio de bodega</p>
            </div>
          </div>
          <button onClick={() => setShowConceptoModal(true)}
            className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 bg-amber-50 hover:bg-amber-600 hover:text-white border border-amber-200 hover:border-transparent px-3 py-1.5 rounded-lg transition-all duration-150 active:scale-95">
            <Plus size={11} /> Nuevo concepto
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 text-[9.5px] uppercase tracking-wide font-bold bg-gray-50/60">
                <th className="px-4 py-2.5">Nombre</th>
                <th className="px-4 py-2.5 text-center">Estatus</th>
                <th className="px-4 py-2.5 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loadingConceptos ? (
                [1,2,3].map(i => (
                  <tr key={i}><td colSpan={3} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : conceptos.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-[12px] text-gray-400">Sin conceptos registrados</td></tr>
              ) : conceptos.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/60 transition-all duration-150">
                  <td className="px-4 py-2.5 text-[12px] font-semibold text-gray-800">{c.nombre}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${
                      c.estatus === 'aprobado'
                        ? 'text-emerald-600 bg-emerald-50 border border-emerald-200'
                        : 'text-amber-600 bg-amber-50 border border-amber-200'
                    }`}>{c.estatus}</span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <button onClick={() => toggleAprobar(c.id)}
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all duration-150 active:scale-95 ${
                        c.estatus === 'aprobado'
                          ? 'text-gray-500 bg-gray-50 border-gray-200 hover:bg-white'
                          : 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-600 hover:text-white hover:border-transparent'
                      }`}>
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

      {/* Modal concepto */}
      {showConceptoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13.5px] font-bold text-gray-900">Nuevo concepto de servicio</h3>
              <button onClick={() => { setShowConceptoModal(false); setConceptoError(''); }} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X size={15} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className={LABEL}>Nombre del concepto</label>
                <input className={INPUT} value={nuevoConcepto} onChange={e => setNuevoConcepto(e.target.value)} placeholder="Ej. Secado, Fumigación" />
              </div>
              {conceptoError && <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{conceptoError}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={() => { setShowConceptoModal(false); setConceptoError(''); }} className="flex-1 text-[12px] font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 py-2 rounded-xl transition-all duration-150 active:scale-95">Cancelar</button>
                <button onClick={proponerConcepto} disabled={creatingConcepto} className="flex-1 text-[12px] font-bold text-white bg-amber-600 hover:bg-amber-500 py-2 rounded-xl transition-all duration-150 active:scale-95 disabled:opacity-50">
                  {creatingConcepto ? 'Creando...' : 'Proponer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal usuario */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13.5px] font-bold text-gray-900">Crear nuevo usuario</h3>
              <button onClick={() => { setShowModal(false); setCreateError(''); }} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X size={15} />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { key: 'nombre_completo', label: 'Nombre completo', type: 'text', placeholder: 'Ej. Juan Pérez García' },
                { key: 'email',           label: 'Email',           type: 'email', placeholder: 'usuario@ejemplo.com' },
              ].map(f => (
                <div key={f.key}>
                  <label className={LABEL}>{f.label}</label>
                  <input type={f.type} className={INPUT} placeholder={f.placeholder}
                    value={(nuevoUser as any)[f.key]}
                    onChange={e => setNuevoUser(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label className={LABEL}>Contraseña</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} className={INPUT + ' pr-9'} value={nuevoUser.password}
                    onChange={e => setNuevoUser(p => ({ ...p, password: e.target.value }))} placeholder="Mín. 8 caracteres" />
                  <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
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
              {createError && <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{createError}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={() => { setShowModal(false); setCreateError(''); }} className="flex-1 text-[12px] font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 py-2 rounded-xl transition-all duration-150 active:scale-95">Cancelar</button>
                <button onClick={crearUsuario} disabled={creatingUser} className="flex-1 text-[12px] font-bold text-white bg-[#002f2a] hover:bg-[#1e5b4f] py-2 rounded-xl transition-all duration-150 active:scale-95 disabled:opacity-50">
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

