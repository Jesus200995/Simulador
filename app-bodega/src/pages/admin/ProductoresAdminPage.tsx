import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Check, X, Eye, ShieldAlert, RefreshCw,
  AlertTriangle, BarChart3, ChevronDown, ChevronLeft, ChevronRight,
  Users, UserCheck, UserX, Clock, Download
} from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const HDR  = () => ({ Authorization: `Bearer ${localStorage.getItem('simac_token')}` });

interface Productor {
  id: number;
  nombre: string;
  apellidos: string;
  curp: string;
  email: string;
  telefono: string;
  rol: string;
  estado_validacion: 'pendiente' | 'activo' | 'rechazado' | 'suspendido';
  created_at: string;
  tipo_productor: 'A' | 'B';
  up_estado?: string;
  up_municipio?: string;
  up_cultivo?: string;
}

function calcularGeneroDesadeCurp(curp: string): 'H' | 'M' | null {
  if (!curp || curp.length < 11) return null;
  const g = curp.charAt(10).toUpperCase();
  return g === 'H' || g === 'M' ? g : null;
}

function calcularEdadDesdeCurp(curp: string): number | null {
  if (!curp || curp.length < 10) return null;
  const yy = parseInt(curp.substring(4, 6), 10);
  const mm = parseInt(curp.substring(6, 8), 10) - 1;
  const dd = parseInt(curp.substring(8, 10), 10);
  if (isNaN(yy) || isNaN(mm) || isNaN(dd)) return null;
  const siglo = yy <= 30 ? 2000 : 1900;
  const nacimiento = new Date(siglo + yy, mm, dd);
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mDiff = hoy.getMonth() - nacimiento.getMonth();
  if (mDiff < 0 || (mDiff === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return edad >= 0 && edad < 130 ? edad : null;
}

const STATUS_CFG = {
  activo:    { label: 'Activo',    color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  pendiente: { label: 'Pendiente', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  rechazado: { label: 'Rechazado', color: 'text-red-700 bg-red-50 border-red-200' },
  suspendido:{ label: 'Suspendido',color: 'text-gray-600 bg-gray-100 border-gray-200' },
};

export default function ProductoresAdminPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'todos' | 'pendiente' | 'suspendido'>('todos');
  const [productores, setProductores] = useState<Productor[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarStats, setMostrarStats] = useState(false);

  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [estatusFilter, setEstatusFilter] = useState('');
  const [estadosDisponibles, setEstadosDisponibles] = useState<string[]>([]);

  const [selectedProd, setSelectedProd] = useState<Productor | null>(null);
  const [modalType, setModalType] = useState<'aprobar' | 'rechazar' | 'suspender' | 'reactivar' | null>(null);
  const [notaInterna, setNotaInterna] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [page, setPage] = useState(1);
  const limit = 50;

  function descargarExcel() {
    const headers = ['#','Nombre','Apellidos','CURP','Email','Teléfono','Tipo','Estatus','Estado (UP)','Municipio (UP)','Cultivo','Fecha registro'];
    const rows = productores.map((p, i) => [
      i + 1,
      p.nombre,
      p.apellidos,
      p.curp || '',
      p.email || '',
      p.telefono || '',
      p.tipo_productor === 'B' ? 'Tipo B (Silos/Báscula)' : 'Tipo A (Auto-declarado)',
      p.estado_validacion,
      p.up_estado || '',
      p.up_municipio || '',
      p.up_cultivo || 'Maíz Blanco',
      p.created_at ? new Date(p.created_at).toLocaleDateString('es-MX') : '',
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const bom = '﻿'; // BOM para que Excel abra con acentos correctos
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SIMAC_Productores_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function cargarProductores() {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/admin/usuarios`, { headers: HDR() });
      if (!r.ok) throw new Error(`Error ${r.status}`);
      const data = await r.json();
      const prods = data.productores || data.usuarios || data;
      setProductores(prods.map((u: any) => ({
        id: u.id || u.producer_id,
        nombre: u.nombres || u.nombre || '',
        apellidos: [u.apellido_paterno, u.apellido_materno].filter(Boolean).join(' ') || u.apellidos || '',
        curp: u.curp || '',
        email: u.correo || u.email || '',
        telefono: u.telefono || '',
        rol: 'productor',
        estado_validacion: u.estado_validacion || 'pendiente',
        created_at: u.fecha_registro || u.created_at || new Date().toISOString(),
        tipo_productor: (u.tipo_registro || 'B') as 'A' | 'B',
        up_estado: u.estado_up || '',
        up_municipio: u.municipio_up || '',
        up_cultivo: 'Maíz Blanco',
      })));
    } catch (e) {
      console.error(e);
      setProductores([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarProductores();
    fetch(`${BASE}/admin/usuarios/estados-disponibles`, { headers: HDR() })
      .then(r => r.json())
      .then(d => setEstadosDisponibles(d.estados || []))
      .catch(() => setEstadosDisponibles(['Sinaloa','Jalisco','Guanajuato','Michoacán','Colima','Querétaro','Nayarit','Durango']));
  }, []);

  async function handleConfirmAction() {
    if (!selectedProd || !modalType) return;
    setActionError('');
    if (modalType === 'rechazar' && notaInterna.trim().length < 20) {
      setActionError('Debes ingresar un motivo detallado (mínimo 20 caracteres).');
      return;
    }
    let nuevoEstatus: 'activo' | 'rechazado' | 'suspendido' = 'activo';
    if (modalType === 'rechazar')  nuevoEstatus = 'rechazado';
    if (modalType === 'suspender') nuevoEstatus = 'suspendido';
    setActionLoading(true);
    try {
      await fetch(`${BASE}/admin/usuarios/${selectedProd.id}/estatus`, {
        method: 'PATCH',
        headers: { ...HDR(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado_validacion: nuevoEstatus, nota: notaInterna }),
      });
    } catch { /* continúa con cambio local */ } finally {
      setProductores(prev => prev.map(p => p.id === selectedProd.id ? { ...p, estado_validacion: nuevoEstatus } : p));
      setSelectedProd(null); setModalType(null); setNotaInterna(''); setActionLoading(false);
    }
  }

  const filteredProductores = productores.filter(p => {
    if (tab === 'pendiente'  && p.estado_validacion !== 'pendiente')  return false;
    if (tab === 'suspendido' && p.estado_validacion !== 'suspendido') return false;
    if (tab === 'todos' && estatusFilter && p.estado_validacion !== estatusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!(p.nombre + ' ' + p.apellidos).toLowerCase().includes(q) && !p.curp.toLowerCase().includes(q) && !p.email.toLowerCase().includes(q)) return false;
    }
    if (estadoFilter && p.up_estado !== estadoFilter) return false;
    if (tipoFilter  && p.tipo_productor !== tipoFilter) return false;
    return true;
  });

  const totalItems = filteredProductores.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const paginatedList = filteredProductores.slice((page - 1) * limit, page * limit);

  // Contadores para chips de tabs
  const cntPendiente  = productores.filter(p => p.estado_validacion === 'pendiente').length;
  const cntSuspendido = productores.filter(p => p.estado_validacion === 'suspendido').length;

  return (
    <div className="flex flex-col gap-3">

      {/* ── KPIs compactos ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { icon: Users,     label: 'Total',      val: productores.length,                                          color: 'text-[#1A5C38] bg-[#eef8f2]' },
          { icon: UserCheck, label: 'Activos',     val: productores.filter(p => p.estado_validacion === 'activo').length,    color: 'text-emerald-700 bg-emerald-50' },
          { icon: Clock,     label: 'Pendientes',  val: cntPendiente,                                               color: 'text-amber-700 bg-amber-50' },
          { icon: UserX,     label: 'Suspendidos', val: cntSuspendido,                                              color: 'text-gray-600 bg-gray-100' },
        ].map(({ icon: Icon, label, val, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 px-3 py-2.5 flex items-center gap-2.5 shadow-sm">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={13} />
            </div>
            <div className="min-w-0">
              <p className="text-[18px] font-black text-gray-900 leading-none">{val}</p>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs + Filtros ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Tabs + botón descarga en la misma fila */}
        <div className="flex items-center border-b border-gray-100 pr-3">
          <div className="flex flex-1">
            {([
              { key: 'todos',      label: 'Padrón general', cnt: productores.length },
              { key: 'pendiente',  label: 'Pendientes',     cnt: cntPendiente },
              { key: 'suspendido', label: 'Suspendidos',    cnt: cntSuspendido },
            ] as const).map(t => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setPage(1); }}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-[11.5px] font-bold border-b-2 transition-all whitespace-nowrap ${
                  tab === t.key
                    ? 'border-[#1A5C38] text-[#1A5C38]'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {t.label}
                {t.cnt > 0 && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    tab === t.key ? 'bg-[#eef8f2] text-[#1A5C38]' : 'bg-gray-100 text-gray-500'
                  }`}>{t.cnt}</span>
                )}
              </button>
            ))}
          </div>

          {/* Botón descargar Excel */}
          <button
            onClick={descargarExcel}
            disabled={loading || productores.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#eef8f2] hover:bg-[#1A5C38] text-[#1A5C38] hover:text-white text-[11px] font-bold border border-[#1A5C38]/20 hover:border-transparent transition disabled:opacity-40 disabled:cursor-not-allowed"
            title="Descargar todos los productores en Excel/CSV"
          >
            <Download size={12} />
            Exportar Excel
          </button>
        </div>

        {/* Filtros */}
        <div className="px-4 py-3 bg-white border-b border-gray-100">
          <div className="flex flex-wrap gap-2 items-center">

            {/* Buscador — flexible */}
            <div className="relative flex-1 min-w-[180px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar nombre, CURP o correo..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-[#1A5C38]/50 focus:bg-white transition"
              />
            </div>

            {/* Estado */}
            <select
              value={estadoFilter}
              onChange={e => { setEstadoFilter(e.target.value); setPage(1); }}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 outline-none focus:border-[#1A5C38]/50 focus:bg-white cursor-pointer transition min-w-[130px]"
            >
              <option value="">Estado (todos)</option>
              {estadosDisponibles.map(e => <option key={e} value={e}>{e}</option>)}
            </select>

            {/* Tipo */}
            <select
              value={tipoFilter}
              onChange={e => { setTipoFilter(e.target.value); setPage(1); }}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 outline-none focus:border-[#1A5C38]/50 focus:bg-white cursor-pointer transition"
            >
              <option value="">Tipo (A / B)</option>
              <option value="A">Tipo A</option>
              <option value="B">Tipo B</option>
            </select>

            {/* Estatus — solo en pestaña "todos" */}
            {tab === 'todos' && (
              <select
                value={estatusFilter}
                onChange={e => { setEstatusFilter(e.target.value); setPage(1); }}
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 outline-none focus:border-[#1A5C38]/50 focus:bg-white cursor-pointer transition"
              >
                <option value="">Estatus (todos)</option>
                <option value="activo">Activo</option>
                <option value="pendiente">Pendiente</option>
                <option value="rechazado">Rechazado</option>
                <option value="suspendido">Suspendido</option>
              </select>
            )}

            {/* Contador + refresh */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                {totalItems} registro{totalItems !== 1 ? 's' : ''}
              </span>
              <button
                onClick={cargarProductores}
                className="p-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-400 hover:text-[#1A5C38] hover:border-[#1A5C38]/30 transition"
                title="Recargar"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Estadísticas demográficas (colapsable) ─────────────────────── */}
      <div>
        <button
          onClick={() => setMostrarStats(!mostrarStats)}
          className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 hover:text-[#1A5C38] transition px-0.5 mb-1.5"
        >
          <BarChart3 size={12} className="text-[#1A5C38]" />
          Estadísticas demográficas
          <ChevronDown size={11} className={`transition-transform ${mostrarStats ? 'rotate-180' : ''}`} />
        </button>

        {mostrarStats && (() => {
          const conCurp = productores.filter(p => p.curp && p.curp.length >= 11);
          const hombres = conCurp.filter(p => calcularGeneroDesadeCurp(p.curp) === 'H').length;
          const mujeres = conCurp.filter(p => calcularGeneroDesadeCurp(p.curp) === 'M').length;
          const edades = conCurp.map(p => calcularEdadDesdeCurp(p.curp)).filter((e): e is number => e !== null);
          const edadPromedio = edades.length > 0 ? Math.round(edades.reduce((s, e) => s + e, 0) / edades.length) : 0;
          const mayores60 = edades.filter(e => e >= 60).length;
          return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Hombres',       val: hombres,      sub: 'productores' },
                { label: 'Mujeres',       val: mujeres,      sub: 'productoras' },
                { label: 'Edad promedio', val: `${edadPromedio}`, sub: `de ${edades.length} con CURP` },
                { label: 'Mayores de 60', val: mayores60,    sub: 'adultos mayores' },
              ].map(({ label, val, sub }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-100 px-3 py-2.5 shadow-sm">
                  <p className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                  <p className="text-[20px] font-black text-gray-900 leading-tight mt-0.5">{val}</p>
                  <p className="text-[10px] text-gray-400">{sub}</p>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* ── Tabla con scroll interno ───────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <RefreshCw size={20} className="text-[#1A5C38] animate-spin" />
            <p className="text-[12px] text-gray-400">Cargando productores...</p>
          </div>
        ) : paginatedList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-center px-4">
            <ShieldAlert size={28} className="text-gray-300" />
            <p className="text-[13px] font-bold text-gray-500">Sin resultados</p>
            <p className="text-[11px] text-gray-400">No hay productores que coincidan con los filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 370px)', minHeight: '200px' }}>
            <table className="w-full text-left border-collapse" style={{ fontSize: '11.5px' }}>
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['#', 'Productor', 'CURP', 'Estado · Municipio', 'Tipo', 'Estatus', 'Acciones'].map(h => (
                    <th key={h} className="py-2 px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap first:pl-4 last:pr-4 last:text-right">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedList.map((prod, idx) => {
                  const cfg = STATUS_CFG[prod.estado_validacion];
                  const rowNum = (page - 1) * limit + idx + 1;
                  return (
                    <tr key={prod.id} className="hover:bg-[#f9fdfb] transition-colors group">

                      {/* # */}
                      <td className="py-2 pl-4 pr-2 text-[10.5px] text-gray-300 font-mono w-8 whitespace-nowrap">
                        {rowNum}
                      </td>

                      {/* Productor */}
                      <td className="py-2 px-3">
                        <p className="font-bold text-gray-800 leading-tight whitespace-nowrap">
                          {prod.nombre} {prod.apellidos}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5 whitespace-nowrap">{prod.email || '—'}</p>
                      </td>

                      {/* CURP */}
                      <td className="py-2 px-3 font-mono text-[10.5px] text-gray-500 whitespace-nowrap">
                        {prod.curp || <span className="text-gray-300 italic">Sin CURP</span>}
                      </td>

                      {/* Geografía */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        {prod.up_estado || prod.up_municipio ? (
                          <>
                            <p className="font-semibold text-gray-700 text-[11px]">{prod.up_municipio || '—'}</p>
                            <p className="text-[10px] text-gray-400">{prod.up_estado || ''}</p>
                          </>
                        ) : (
                          <span className="text-gray-300 text-[10.5px] italic">Sin ubicación</span>
                        )}
                      </td>

                      {/* Tipo */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className={`text-[9.5px] font-black px-1.5 py-0.5 rounded border ${
                          prod.tipo_productor === 'B'
                            ? 'text-indigo-700 bg-indigo-50 border-indigo-200'
                            : 'text-gray-500 bg-gray-50 border-gray-200'
                        }`}>
                          Tipo {prod.tipo_productor}
                        </span>
                      </td>

                      {/* Estatus */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-full border ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-2 px-3 pr-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/admin/productores/${prod.id}`)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#1A5C38] hover:bg-[#eef8f2] transition"
                            title="Ver detalle"
                          >
                            <Eye size={12} />
                          </button>

                          {prod.estado_validacion === 'pendiente' && (
                            <>
                              <button
                                onClick={() => { setSelectedProd(prod); setModalType('aprobar'); }}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                                title="Aprobar"
                              >
                                <Check size={12} />
                              </button>
                              <button
                                onClick={() => { setSelectedProd(prod); setModalType('rechazar'); }}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                                title="Rechazar"
                              >
                                <X size={12} />
                              </button>
                            </>
                          )}

                          {prod.estado_validacion === 'activo' && (
                            <button
                              onClick={() => { setSelectedProd(prod); setModalType('suspender'); }}
                              className="text-[9.5px] font-bold px-2 py-1 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-100 hover:border-red-200 transition"
                            >
                              Suspender
                            </button>
                          )}

                          {prod.estado_validacion === 'suspendido' && (
                            <button
                              onClick={() => { setSelectedProd(prod); setModalType('reactivar'); }}
                              className="text-[9.5px] font-bold px-2 py-1 rounded-lg text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 border border-gray-100 hover:border-emerald-200 transition"
                            >
                              Reactivar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación compacta */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-gray-50 bg-gray-50/50 flex-shrink-0">
            <p className="text-[10.5px] text-gray-400">
              Pág. <strong className="text-gray-700">{page}</strong> / {totalPages}
              <span className="ml-2 text-gray-300">·</span>
              <span className="ml-2">{totalItems} productores</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)} disabled={page === 1}
                className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-20 transition text-[10px] font-bold"
              >
                «
              </button>
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}
                className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-20 transition"
              >
                <ChevronLeft size={12} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const p = start + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-6 h-6 rounded text-[10.5px] font-bold transition ${
                      p === page
                        ? 'bg-[#1A5C38] text-white'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages}
                className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-20 transition"
              >
                <ChevronRight size={12} />
              </button>
              <button
                onClick={() => setPage(totalPages)} disabled={page === totalPages}
                className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-20 transition text-[10px] font-bold"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal acción ───────────────────────────────────────────────── */}
      {selectedProd && modalType && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-100 rounded-2xl max-w-[400px] w-full shadow-2xl overflow-hidden">

            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                modalType === 'aprobar' || modalType === 'reactivar'
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-red-50 text-red-500'
              }`}>
                {modalType === 'aprobar' || modalType === 'reactivar'
                  ? <Check size={14} />
                  : <AlertTriangle size={14} />}
              </div>
              <h3 className="text-[14px] font-extrabold text-gray-900">
                {modalType === 'aprobar'    && 'Aprobar productor'}
                {modalType === 'rechazar'   && 'Rechazar productor'}
                {modalType === 'suspender'  && 'Suspender productor'}
                {modalType === 'reactivar'  && 'Reactivar productor'}
              </h3>
            </div>

            <div className="px-5 py-4 space-y-3">
              <p className="text-[12.5px] text-gray-600 leading-relaxed">
                {modalType === 'aprobar'   && 'Se activará el acceso de '}
                {modalType === 'rechazar'  && 'Se rechazará el registro de '}
                {modalType === 'suspender' && 'Se suspenderá temporalmente a '}
                {modalType === 'reactivar' && 'Se reactivará la cuenta de '}
                <strong className="text-gray-900">{selectedProd.nombre} {selectedProd.apellidos}</strong>.
              </p>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  {modalType === 'rechazar' ? 'Motivo (obligatorio, mín. 20 caracteres)' : 'Nota interna (opcional)'}
                </label>
                <textarea
                  rows={3}
                  placeholder={modalType === 'rechazar'
                    ? 'Describe el motivo del rechazo...'
                    : 'Nota adicional...'}
                  value={notaInterna}
                  onChange={e => setNotaInterna(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-[12px] text-gray-800 placeholder-gray-400 outline-none focus:border-[#1A5C38]/40 resize-none transition"
                />
              </div>

              {actionError && (
                <div className="flex items-start gap-2 text-[11.5px] text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">
                  <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                  <p>{actionError}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => { setSelectedProd(null); setModalType(null); setNotaInterna(''); setActionError(''); }}
                className="px-3 py-2 rounded-xl text-[12px] font-bold text-gray-500 hover:bg-gray-100 transition"
                disabled={actionLoading}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-xl text-[12px] font-bold text-white transition ${
                  modalType === 'aprobar' || modalType === 'reactivar'
                    ? 'bg-[#1A5C38] hover:bg-[#15482d]'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionLoading ? 'Aplicando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
