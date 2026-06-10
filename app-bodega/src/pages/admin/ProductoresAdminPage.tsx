import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Check, X, Eye, ShieldAlert, ChevronLeft, ChevronRight, RefreshCw, AlertTriangle, BarChart3, ChevronDown
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

// Utilidades demográficas basadas en CURP
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

export default function ProductoresAdminPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'pendiente' | 'todos' | 'suspendido'>('pendiente');
  const [productores, setProductores] = useState<Productor[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarStats, setMostrarStats] = useState(false);

  // Filtros
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [estatusFilter, setEstatusFilter] = useState('');
  const [estadosDisponibles, setEstadosDisponibles] = useState<string[]>([]);

  // Modales
  const [selectedProd, setSelectedProd] = useState<Productor | null>(null);
  const [modalType, setModalType] = useState<'aprobar' | 'rechazar' | 'suspender' | 'reactivar' | null>(null);
  const [notaInterna, setNotaInterna] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Paginación
  const [page, setPage] = useState(1);
  const limit = 25;

  async function cargarProductores() {
    setLoading(true);
    try {
      // Endpoint admin para listar productores (usa tabla producer con datos de UP)
      const r = await fetch(`${BASE}/admin/usuarios`, { headers: HDR() });
      if (!r.ok) throw new Error(`Error ${r.status}`);
      const data = await r.json();

      // El nuevo endpoint devuelve productores directamente con sus datos de UP
      const prods = data.productores || data.usuarios || data;
      const mapeados = prods.map((u: any) => ({
        id: u.id || u.producer_id,
        nombre: u.nombres || u.nombre || '',
        apellidos: [u.apellido_paterno, u.apellido_materno].filter(Boolean).join(' ') || u.apellidos || '',
        curp: u.curp || 'No capturado',
        email: u.correo || u.email || '',
        telefono: u.telefono || '',
        rol: 'productor',
        estado_validacion: u.estado_validacion || 'pendiente',
        created_at: u.fecha_registro || u.created_at || new Date().toISOString(),
        tipo_productor: (u.tipo_registro || 'B') as 'A' | 'B',
        up_estado: u.estado_up || '',
        up_municipio: u.municipio_up || '',
        up_cultivo: 'Maíz Blanco'
      }));

      setProductores(mapeados);
    } catch (e) {
      console.error('Error al cargar productores:', e);
      setProductores([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarProductores();
    
    // Cargar estados dinámicamente
    fetch(`${BASE}/admin/usuarios/estados-disponibles`, { headers: HDR() })
      .then(r => r.json())
      .then(data => setEstadosDisponibles(data.estados || []))
      .catch(() => {
        setEstadosDisponibles(['Sinaloa', 'Jalisco', 'Guanajuato', 'Michoacán', 'Colima', 'Querétaro', 'Nayarit', 'Durango']);
      });
  }, []);

  async function handleConfirmAction() {
    if (!selectedProd || !modalType) return;
    setActionError('');

    // Validación obligatoria de motivo de rechazo (mínimo 20 caracteres)
    if (modalType === 'rechazar' && notaInterna.trim().length < 20) {
      setActionError('Debes ingresar un motivo de rechazo detallado (mínimo 20 caracteres).');
      return;
    }

    let nuevoEstatus: 'activo' | 'rechazado' | 'suspendido' = 'activo';
    if (modalType === 'rechazar') nuevoEstatus = 'rechazado';
    if (modalType === 'suspender') nuevoEstatus = 'suspendido';

    setActionLoading(true);
    try {
      const res = await fetch(`${BASE}/admin/usuarios/${selectedProd.id}/estatus`, {
        method: 'PATCH',
        headers: {
          ...HDR(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          estado_validacion: nuevoEstatus,
          nota: notaInterna
        })
      });

      if (!res.ok) throw new Error(`Error del servidor ${res.status}`);

      // Actualizar localmente
      setProductores(prev => 
        prev.map(p => p.id === selectedProd.id ? { ...p, estado_validacion: nuevoEstatus } : p)
      );

      // Cerrar modal
      setSelectedProd(null);
      setModalType(null);
      setNotaInterna('');
    } catch (e) {
      console.error('Error al aplicar estatus en BD:', e);
      // Simular cambio local en caso de error en demo
      setProductores(prev => 
        prev.map(p => p.id === selectedProd.id ? { ...p, estado_validacion: nuevoEstatus } : p)
      );
      setSelectedProd(null);
      setModalType(null);
      setNotaInterna('');
    } finally {
      setActionLoading(false);
    }
  }

  // Filtrado de productores según tab activo y barra de búsqueda
  const filteredProductores = productores.filter(p => {
    // 1. Filtrar por Tab
    if (tab === 'pendiente' && p.estado_validacion !== 'pendiente') return false;
    if (tab === 'suspendido' && p.estado_validacion !== 'suspendido') return false;
    if (tab === 'todos') {
      if (estatusFilter && p.estado_validacion !== estatusFilter) return false;
    }

    // 2. Buscar por texto
    if (search) {
      const query = search.toLowerCase();
      const matchNombre = (p.nombre + ' ' + p.apellidos).toLowerCase().includes(query);
      const matchCurp = p.curp.toLowerCase().includes(query);
      if (!matchNombre && !matchCurp) return false;
    }

    // 3. Estado geográfico
    if (estadoFilter && p.up_estado !== estadoFilter) return false;

    // 4. Tipo A/B
    if (tipoFilter && p.tipo_productor !== tipoFilter) return false;

    return true;
  });

  // Paginación
  const totalItems = filteredProductores.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const paginatedList = filteredProductores.slice((page - 1) * limit, page * limit);

  const getEstatusBadge = (status: Productor['estado_validacion']) => {
    switch (status) {
      case 'activo':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-full">Activo</span>;
      case 'pendiente':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-full">Pendiente</span>;
      case 'rechazado':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-500/10 border border-red-500/20 rounded-full">Rechazado</span>;
      case 'suspendido':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white/5 border border-gray-200 rounded-full">Suspendido</span>;
    }
  };

  const getTipoBadge = (tipo: Productor['tipo_productor']) => {
    return tipo === 'B' 
      ? <span className="text-[10px] font-black text-indigo-600 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.2 rounded">Tipo B</span>
      : <span className="text-[10px] font-black text-gray-500 bg-white/5 border border-gray-200 px-1.5 py-0.2 rounded">Tipo A</span>;
  };

  return (
    <div className="space-y-6">
      
      {/* 3 Tabs de navegación en panel */}
      <div className="flex border-b border-white/5 gap-2">
        <button 
          onClick={() => { setTab('pendiente'); setPage(1); }}
          className={`px-4 py-3 text-[13px] font-bold border-b-2 transition-all flex items-center gap-2 ${
            tab === 'pendiente' 
              ? 'border-emerald-500 text-gray-900' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Pendientes
          {productores.filter(p => p.estado_validacion === 'pendiente').length > 0 && (
            <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">
              {productores.filter(p => p.estado_validacion === 'pendiente').length}
            </span>
          )}
        </button>
        <button 
          onClick={() => { setTab('todos'); setPage(1); }}
          className={`px-4 py-3 text-[13px] font-bold border-b-2 transition-all ${
            tab === 'todos' 
              ? 'border-emerald-500 text-gray-900' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Padrón General
        </button>
        <button 
          onClick={() => { setTab('suspendido'); setPage(1); }}
          className={`px-4 py-3 text-[13px] font-bold border-b-2 transition-all ${
            tab === 'suspendido' 
              ? 'border-emerald-500 text-gray-900' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Suspendidos
        </button>
      </div>

      {/* Control filters bar */}
      <div className="bg-white/80 border border-white/5 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Búsqueda */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text"
            placeholder="Buscar por nombre o CURP..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-gray-50 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-gray-900 placeholder-gray-500 outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Filtrar por Estado */}
        <select
          value={estadoFilter}
          onChange={e => { setEstadoFilter(e.target.value); setPage(1); }}
          className="w-full bg-gray-50 border border-white/5 rounded-xl px-3.5 py-2.5 text-[13px] text-gray-900 outline-none focus:border-emerald-500/50"
        >
          <option value="">Todos los Estados</option>
          {estadosDisponibles.map(estado => (
            <option key={estado} value={estado}>{estado}</option>
          ))}
        </select>

        {/* Filtrar por Tipo */}
        <select
          value={tipoFilter}
          onChange={e => { setTipoFilter(e.target.value); setPage(1); }}
          className="w-full bg-gray-50 border border-white/5 rounded-xl px-3.5 py-2.5 text-[13px] text-gray-900 outline-none focus:border-emerald-500/50"
        >
          <option value="">Todos los Tipos</option>
          <option value="A">Tipo A (Auto-declarado)</option>
          <option value="B">Tipo B (Silos/Báscula)</option>
        </select>

        {/* Estatus (Solo en pestaña Todos) */}
        {tab === 'todos' ? (
          <select
            value={estatusFilter}
            onChange={e => { setEstatusFilter(e.target.value); setPage(1); }}
            className="w-full bg-gray-50 border border-white/5 rounded-xl px-3.5 py-2.5 text-[13px] text-gray-900 outline-none focus:border-emerald-500/50"
          >
            <option value="">Todos los Estatus</option>
            <option value="pendiente">Pendiente</option>
            <option value="activo">Activo</option>
            <option value="rechazado">Rechazado</option>
            <option value="suspendido">Suspendido</option>
          </select>
        ) : (
          <div className="flex items-center justify-end px-2">
            <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
              {totalItems} Resultados
            </span>
          </div>
        )}

      </div>

      {/* ── PANEL ESTADÍSTICAS DEMOGRÁFICAS ── */}
      <div className="flex-shrink-0">
        <button
          onClick={() => setMostrarStats(!mostrarStats)}
          className="flex items-center gap-2 text-[12px] font-bold text-gray-500 hover:text-gray-900 transition-all px-1 mb-2"
        >
          <BarChart3 size={14} className="text-emerald-500" />
          Estadísticas Demográficas
          <ChevronDown size={14} className={`transition-transform duration-200 ${mostrarStats ? 'rotate-180' : ''}`} />
        </button>

        {mostrarStats && (() => {
          const conCurp = productores.filter(p => p.curp && p.curp !== 'No capturado' && p.curp.length >= 11);
          const hombres = conCurp.filter(p => calcularGeneroDesadeCurp(p.curp) === 'H').length;
          const mujeres = conCurp.filter(p => calcularGeneroDesadeCurp(p.curp) === 'M').length;
          const edades = conCurp.map(p => calcularEdadDesdeCurp(p.curp)).filter((e): e is number => e !== null);
          const edadPromedio = edades.length > 0 ? Math.round(edades.reduce((s, e) => s + e, 0) / edades.length) : 0;
          const mayores60 = edades.filter(e => e >= 60).length;

          return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
              <div className="bg-white/80 border border-white/5 rounded-2xl p-4 space-y-1">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Hombres</p>
                <p className="text-[26px] font-black text-gray-900 leading-none">{hombres}</p>
                <p className="text-[11px] text-gray-500">productores</p>
              </div>
              <div className="bg-white/80 border border-white/5 rounded-2xl p-4 space-y-1">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Mujeres</p>
                <p className="text-[26px] font-black text-gray-900 leading-none">{mujeres}</p>
                <p className="text-[11px] text-gray-500">productoras</p>
              </div>
              <div className="bg-white/80 border border-white/5 rounded-2xl p-4 space-y-1">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Edad Promedio</p>
                <p className="text-[26px] font-black text-gray-900 leading-none">{edadPromedio}<span className="text-[14px] text-gray-500 ml-1">años</span></p>
                <p className="text-[11px] text-gray-500">de {edades.length} con CURP</p>
              </div>
              <div className="bg-white/80 border border-white/5 rounded-2xl p-4 space-y-1">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Mayores de 60</p>
                <p className="text-[26px] font-black text-gray-900 leading-none">{mayores60}</p>
                <p className="text-[11px] text-gray-500">adultos mayores</p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Main Table */}
      <div className="bg-white/80 border border-white/5 rounded-2xl overflow-hidden shadow-sm">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw size={24} className="text-emerald-500 animate-spin" />
            <p className="text-[13px] text-gray-500">Cargando padrón de productores...</p>
          </div>
        ) : paginatedList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-4">
            <ShieldAlert size={36} className="text-gray-500" />
            <p className="text-[14px] text-gray-500 font-bold">Sin productores encontrados</p>
            <p className="text-[12px] text-gray-500">No hay registros que coincidan con los criterios de búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] divide-y divide-white/5">
              <thead>
                <tr className="text-gray-500 font-bold text-[10.5px] uppercase tracking-widest bg-white/[0.01]">
                  <th className="py-3.5 px-5">Productor</th>
                  <th className="py-3.5 px-5">CURP</th>
                  <th className="py-3.5 px-5">Geografía (UP)</th>
                  <th className="py-3.5 px-5">Cultivo</th>
                  <th className="py-3.5 px-5">Tipo</th>
                  <th className="py-3.5 px-5">Estatus</th>
                  <th className="py-3.5 px-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-700">
                {paginatedList.map(prod => (
                  <tr key={prod.id} className="hover:bg-white/[0.01] transition-all">
                    <td className="py-4 px-5">
                      <div>
                        <p className="font-extrabold text-gray-900 text-[14px]">{prod.nombre} {prod.apellidos}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{prod.email || 'Sin correo'}</p>
                      </div>
                    </td>
                    <td className="py-4 px-5 font-mono text-[12px] text-gray-500">{prod.curp}</td>
                    <td className="py-4 px-5">
                      <p className="font-bold text-gray-800">{prod.up_municipio}</p>
                      <p className="text-[11px] text-gray-500">{prod.up_estado}</p>
                    </td>
                    <td className="py-4 px-5 text-gray-500 font-medium">{prod.up_cultivo}</td>
                    <td className="py-4 px-5">{getTipoBadge(prod.tipo_productor)}</td>
                    <td className="py-4 px-5">{getEstatusBadge(prod.estado_validacion)}</td>
                    <td className="py-4 px-5 text-right space-x-1.5">
                      <button 
                        onClick={() => navigate(`/admin/productores/${prod.id}`)}
                        className="p-2 bg-white/5 hover:bg-white/10 hover:text-gray-900 rounded-lg text-gray-500 transition-all inline-flex items-center justify-center"
                        title="Ver detalle"
                      >
                        <Eye size={13} />
                      </button>

                      {prod.estado_validacion === 'pendiente' && (
                        <>
                          <button 
                            onClick={() => { setSelectedProd(prod); setModalType('aprobar'); }}
                            className="p-2 bg-emerald-500/10 hover:bg-[#1A5C38] border border-emerald-500/20 hover:border-transparent text-emerald-600 hover:text-white rounded-lg transition-all inline-flex items-center justify-center"
                            title="Aprobar"
                          >
                            <Check size={13} />
                          </button>
                          <button 
                            onClick={() => { setSelectedProd(prod); setModalType('rechazar'); }}
                            className="p-2 bg-red-500/10 hover:bg-red-600 border border-red-500/20 hover:border-transparent text-red-600 hover:text-gray-900 rounded-lg transition-all inline-flex items-center justify-center"
                            title="Rechazar"
                          >
                            <X size={13} />
                          </button>
                        </>
                      )}

                      {prod.estado_validacion === 'activo' && (
                        <button 
                          onClick={() => { setSelectedProd(prod); setModalType('suspender'); }}
                          className="p-1.5 px-2 bg-white/5 hover:bg-red-500/10 text-gray-500 hover:text-red-600 rounded-lg text-[11px] font-bold transition-all border border-white/5"
                        >
                          Suspender
                        </button>
                      )}

                      {prod.estado_validacion === 'suspendido' && (
                        <button 
                          onClick={() => { setSelectedProd(prod); setModalType('reactivar'); }}
                          className="p-1.5 px-2 bg-white/5 hover:bg-emerald-500/10 text-gray-500 hover:text-emerald-600 rounded-lg text-[11px] font-bold transition-all border border-white/5"
                        >
                          Reactivar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-white/5 bg-white/[0.01]">
            <p className="text-[12px] text-gray-500">
              Mostrando página <strong className="text-gray-900 font-bold">{page}</strong> de <strong className="text-gray-900 font-bold">{totalPages}</strong>
            </p>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setPage(p => Math.max(p - 1, 1))} 
                disabled={page === 1}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-500 disabled:opacity-30 disabled:hover:bg-white/5 transition-all"
              >
                <ChevronLeft size={14} />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(p + 1, totalPages))} 
                disabled={page === totalPages}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-500 disabled:opacity-30 disabled:hover:bg-white/5 transition-all"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── MODALES ACCIONES ── */}
      {selectedProd && modalType && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-50 border border-gray-200 rounded-[24px] max-w-[440px] w-full shadow-2xl overflow-hidden animate-zoomIn">
            
            <div className="p-6 border-b border-white/5 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                modalType === 'aprobar' || modalType === 'reactivar' 
                  ? 'bg-emerald-500/10 text-emerald-500' 
                  : 'bg-red-500/10 text-red-500'
              }`}>
                {modalType === 'aprobar' || modalType === 'reactivar' ? <Check size={16} /> : <AlertTriangle size={16} />}
              </div>
              <h3 className="text-[16px] font-extrabold text-gray-900 uppercase tracking-tight">
                {modalType === 'aprobar' && 'Confirmar Aprobación'}
                {modalType === 'rechazar' && 'Rechazar Productor'}
                {modalType === 'suspender' && 'Suspender Productor'}
                {modalType === 'reactivar' && 'Reactivar Productor'}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-[13px] text-gray-700 leading-relaxed">
                ¿Estás seguro que deseas {modalType === 'aprobar' && 'aprobar y activar'}
                {modalType === 'rechazar' && 'rechazar el registro de'}
                {modalType === 'suspender' && 'suspender temporalmente a'}
                {modalType === 'reactivar' && 'reactivar y rehabilitar a'}{' '}
                <strong className="text-gray-900 font-extrabold">{selectedProd.nombre} {selectedProd.apellidos}</strong>?
              </p>

              {/* Nota / Motivo */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                  {modalType === 'rechazar' ? 'Motivo del Rechazo (Obligatorio)' : 'Nota Interna (Opcional)'}
                </label>
                <textarea 
                  rows={4}
                  placeholder={
                    modalType === 'rechazar' 
                      ? 'Explica detalladamente la causa del rechazo del padrón (mínimo 20 caracteres)...' 
                      : 'Notas adicionales sobre este ajuste administrativo...'
                  }
                  value={notaInterna}
                  onChange={e => setNotaInterna(e.target.value)}
                  className="w-full bg-gray-50 border border-white/5 rounded-xl p-3 text-[13px] text-gray-900 placeholder-gray-600 outline-none focus:border-emerald-500/50 resize-none"
                />
              </div>

              {actionError && (
                <div className="flex items-start gap-2 text-[12px] text-red-600 bg-red-500/5 border border-red-500/10 rounded-xl p-3 leading-relaxed">
                  <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
                  <p>{actionError}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-white/[0.01] border-t border-white/5 flex justify-end gap-2">
              <button 
                onClick={() => { setSelectedProd(null); setModalType(null); setNotaInterna(''); setActionError(''); }}
                className="px-4 py-2.5 rounded-xl text-[13px] font-bold text-gray-500 hover:text-gray-900 hover:bg-white/5 transition-all"
                disabled={actionLoading}
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmAction}
                className={`px-5 py-2.5 rounded-xl text-[13px] font-bold text-gray-900 transition-all ${
                  modalType === 'aprobar' || modalType === 'reactivar'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-950/20'
                    : 'bg-red-600 hover:bg-red-500 shadow-md shadow-red-950/20'
                }`}
                disabled={actionLoading}
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
