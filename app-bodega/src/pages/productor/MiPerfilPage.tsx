import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, MapPin, LogOut, CircleDot, CalendarCheck, ChevronRight, Sprout, Trash2, Plus } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import MapaUP from '../../components/productor/MapaUP';
import ProfileHero from '../../components/ProfileHero';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const PROGRAMAS_GOBIERNO = [
  { clave: 'fertilizantes_bienestar', nombre: 'Fertilizantes para el Bienestar' },
  { clave: 'produccion_bienestar', nombre: 'Producción para el Bienestar' },
  { clave: 'precios_garantia', nombre: 'Precios de Garantía' },
  { clave: 'maiz_blanco_precio_justo', nombre: 'Maíz Blanco / Precio Justo' },
  { clave: 'maiz_es_raiz', nombre: 'Plan El Maíz es la Raíz' },
  { clave: 'cosechando_soberania', nombre: 'Cosechando Soberanía' },
  { clave: 'sembrando_vida', nombre: 'Sembrando Vida' },
];

interface Perfil {
  curp: string; nombres: string; apellido_paterno: string; apellido_materno: string;
  telefono: string; correo: string | null; estado_validacion: string; tipo_registro: string;
  programas_beneficiario: string[];
  state_name: string; municipality_name: string;
  location_confirmed: boolean; centroid_source: string;
  lat: number; lng: number;
  area_ha_calc: number | null; area_ha_real: number | null;
}

interface CropInfo {
  cycle_crop_id: number; crop: string;
  variety_id: string | null; variety_other: string | null;
  area_sown_ha: number | null; yield_expected: number | null;
  planting_date: string | null; estimated_harvest_date: string | null;
  destination: string | null;
}
interface Ciclo {
  cycle_id: number; cycle_year: number; cycle_type: string;
  crops: CropInfo[];
}

export default function MiPerfilPage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [editTel, setEditTel] = useState(false);
  const [telefono, setTelefono] = useState('');
  const [editCorreo, setEditCorreo] = useState(false);
  const [correo, setCorreo] = useState('');
  const [editProg, setEditProg] = useState(false);
  const [programas, setProgramas] = useState<string[]>([]);
  const [ciclos, setCiclos] = useState<Ciclo[] | null>(null);
  const [parcelas, setParcelas] = useState<any[]>([]);
  const [confirmDel, setConfirmDel] = useState<number | null>(null);
  const [eliminando, setEliminando] = useState<number | null>(null);
  const [delError, setDelError] = useState<string>('');

  const ringDe = (u: any): [number, number][] | null => {
    const g = u?.geom_geojson;
    if (!g?.coordinates) return null;
    const ring = g.type === 'MultiPolygon' ? g.coordinates[0]?.[0] : g.coordinates[0];
    return (ring && ring.length >= 3) ? (ring as [number, number][]) : null;
  };

  const eliminarParcela = async (upId: number) => {
    setEliminando(upId);
    setDelError('');
    try {
      const token = localStorage.getItem('simac_token');
      const r = await fetch(`${BASE}/mis-ups/${upId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setDelError(d.error || 'No se pudo eliminar.'); setConfirmDel(null); return; }
      setParcelas(prev => prev.filter(p => p.up_id !== upId));
      setConfirmDel(null);
    } catch {
      setDelError('Error de conexión.');
      setConfirmDel(null);
    } finally {
      setEliminando(null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('simac_token');
    fetch(`${BASE}/productor/perfil`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        setPerfil(d);
        setTelefono(d.telefono || '');
        setCorreo(d.correo || '');
        setProgramas(d.programas_beneficiario || []);
      })
      .finally(() => setLoading(false));
    const token2 = localStorage.getItem('simac_token');
    fetch(`${BASE}/mis-ups`, { headers: { Authorization: `Bearer ${token2}` } })
      .then(r => r.json())
      .then(d => {
        const ups = d.ups ?? (Array.isArray(d) ? d : []);
        setParcelas(ups);
        const up = ups[0];
        if (!up) return;
        return fetch(`${BASE}/ups/${up.up_id}/cycles`, { headers: { Authorization: `Bearer ${token2}` } })
          .then(r => r.json())
          .then(d => setCiclos(d.cycles ?? d));
      }).catch(() => setCiclos([]));
  }, []);

  const guardarTelefono = async () => {
    const token = localStorage.getItem('simac_token');
    await fetch(`${BASE}/productor/perfil`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ telefono }),
    });
    setEditTel(false);
    setPerfil(prev => prev ? { ...prev, telefono } : prev);
  };

  const guardarCorreo = async () => {
    const token = localStorage.getItem('simac_token');
    await fetch(`${BASE}/productor/perfil`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ correo: correo || null }),
    });
    setEditCorreo(false);
    setPerfil(prev => prev ? { ...prev, correo } : prev);
  };

  const guardarProgramas = async () => {
    const token = localStorage.getItem('simac_token');
    await fetch(`${BASE}/productor/perfil`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ programas_beneficiario: programas }),
    });
    setEditProg(false);
    setPerfil(prev => prev ? { ...prev, programas_beneficiario: programas } : prev);
  };

  const togglePrograma = (clave: string) => {
    setProgramas(prev =>
      prev.includes(clave) ? prev.filter(p => p !== clave) : [...prev, clave]
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>;
  if (!perfil) return <div className="min-h-screen flex items-center justify-center text-gray-400">Error</div>;

  const nombreCompleto = [perfil.nombres, perfil.apellido_paterno, perfil.apellido_materno].filter(Boolean).join(' ');
  const initials = [perfil.nombres, perfil.apellido_paterno].filter(Boolean).map(w => w[0]).join('').toUpperCase() || 'P';

  const estadoBadgeColor = perfil.estado_validacion === 'activo'
    ? 'bg-emerald-400/90 text-emerald-950'
    : perfil.estado_validacion === 'pendiente'
    ? 'bg-amber-300/90 text-amber-950'
    : 'bg-red-400/90 text-red-950';

  return (
    <div className="bg-[#eef8f2] min-h-screen">
      <ProfileHero
        titulo="Mi Perfil"
        nombre={nombreCompleto || 'Productor'}
        initials={initials}
        badges={
          <>
            <span className="text-[11px] font-bold text-white/90 bg-white/15 rounded-full px-3 py-1">
              Tipo {perfil.tipo_registro}
            </span>
            <span className={`text-[11px] font-bold rounded-full px-3 py-1 ${estadoBadgeColor}`}>
              {perfil.estado_validacion.charAt(0).toUpperCase() + perfil.estado_validacion.slice(1)}
            </span>
          </>
        }
      />

      <div className="max-w-5xl mx-auto px-4 pt-4 space-y-4">
        {/* Datos personales — no editables */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">Datos personales</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Nombre</span>
              <span className="font-medium text-gray-800">{perfil.nombres} {perfil.apellido_paterno} {perfil.apellido_materno}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">CURP</span>
              <span className="font-mono text-xs text-gray-800">{perfil.curp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tipo registro</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                ${perfil.tipo_registro === 'A' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                Tipo {perfil.tipo_registro}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Estado</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                ${perfil.estado_validacion === 'activo' ? 'bg-green-100 text-green-700'
                : perfil.estado_validacion === 'pendiente' ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'}`}>
                {perfil.estado_validacion.charAt(0).toUpperCase() + perfil.estado_validacion.slice(1)}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Estos datos vienen del padrón. Si hay un error, contacta a tu técnico territorial.
          </p>
        </div>

        {/* Contacto — editable */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Contacto</p>
            <button onClick={() => setEditTel(!editTel)} className="text-[#1A5C38]">
              <Edit2 size={14} />
            </button>
          </div>
          {editTel ? (
            <div className="space-y-2 mb-3">
              <input value={telefono}
                onChange={e => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:border-[#1A5C38] focus:outline-none" />
              <button onClick={guardarTelefono}
                className="w-full bg-[#1A5C38] text-white py-2 rounded-xl text-sm font-semibold">
                Guardar teléfono
              </button>
            </div>
          ) : (
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-gray-400">Teléfono</span>
              <span className="text-sm text-gray-800">{perfil.telefono || 'Sin teléfono'}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Correo</span>
            {editCorreo ? (
              <div className="flex items-center gap-2">
                <input type="email" value={correo}
                  onChange={e => setCorreo(e.target.value)}
                  autoCapitalize="off" autoCorrect="off" inputMode="email"
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:border-[#1A5C38] focus:outline-none" />
                <button onClick={guardarCorreo} className="text-[#1A5C38] text-xs font-bold">OK</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-800">{perfil.correo || <span className="text-gray-400 italic text-xs">sin correo</span>}</span>
                <button onClick={() => setEditCorreo(true)} className="text-[#1A5C38]"><Edit2 size={12} /></button>
              </div>
            )}
          </div>
        </div>

        {/* Mis parcelas — una tarjeta por parcela, con su mapa y acciones */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
              Mis parcelas{parcelas.length > 0 ? ` (${parcelas.length})` : ''}
            </p>
          </div>

          {delError && (
            <div className="mb-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <p className="text-[12px] text-red-600">{delError}</p>
            </div>
          )}

          {parcelas.length === 0 ? (
            <div className="text-center py-6">
              <Sprout size={30} className="text-gray-300 mx-auto mb-2" />
              <p className="text-[14px] font-medium text-gray-600">Aún no registras parcelas</p>
              <p className="text-[12px] text-gray-400 mt-0.5">Agrega tu primera parcela y dibújala en el mapa</p>
            </div>
          ) : (
            <div className="max-h-[460px] overflow-y-auto pr-1 -mr-1 space-y-3">
              {parcelas.map((p: any, i: number) => {
                const ring = ringDe(p);
                const lat = p.centroid_lat ?? p.lat;
                const lng = p.centroid_lng ?? p.lng;
                return (
                  <div key={p.up_id ?? i} className="rounded-2xl border border-gray-100 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
                    {/* Mini mapa de la parcela */}
                    {lat && lng ? (
                      <MapaUP
                        lat={lat} lng={lng}
                        locationConfirmed={!!p.location_confirmed}
                        centroidSource={p.centroid_source}
                        radioKm={3} height="140px" zoom={14}
                        poligono={ring}
                      />
                    ) : (
                      <div className="h-[100px] bg-[#f4fbf7] flex flex-col items-center justify-center gap-1">
                        <MapPin size={22} className="text-[#1A5C38]/40" />
                        <p className="text-[11px] text-gray-400">Sin ubicación en el mapa</p>
                      </div>
                    )}

                    <div className="p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[15px] font-bold text-gray-900 truncate">{p.up_name || `Parcela ${i + 1}`}</p>
                          <p className="text-[12.5px] text-gray-500 truncate">
                            {[p.municipality_name, p.state_name].filter(Boolean).join(', ') || 'Sin ubicación'}
                          </p>
                        </div>
                        {p.area_ha_calc != null && (
                          <span className="flex-shrink-0 text-[12px] font-bold text-[#1A5C38] bg-[#1A5C38]/[0.08] px-2.5 py-1 rounded-full">
                            {Number(p.area_ha_calc).toLocaleString('es-MX', { maximumFractionDigits: 1 })} ha
                          </span>
                        )}
                      </div>

                      {/* Acciones / confirmación de borrado */}
                      {confirmDel === p.up_id ? (
                        <div className="mt-3 bg-red-50 ring-1 ring-red-200 rounded-xl p-2.5 flex items-center justify-between gap-2 animate-fade-in">
                          <span className="text-[12.5px] font-semibold text-red-700">¿Eliminar esta parcela?</span>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <button onClick={() => setConfirmDel(null)} disabled={eliminando === p.up_id}
                              className="px-3 py-1.5 rounded-lg text-[12px] font-bold text-gray-600 bg-white ring-1 ring-gray-200">
                              Cancelar
                            </button>
                            <button onClick={() => eliminarParcela(p.up_id)} disabled={eliminando === p.up_id}
                              className="px-3 py-1.5 rounded-lg text-[12px] font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60">
                              {eliminando === p.up_id ? 'Eliminando…' : 'Sí, eliminar'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => navigate(`/productor/ubicacion?up_id=${p.up_id}`)}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-[#1A5C38] hover:bg-[#15482d] text-white py-2.5 rounded-xl text-[13px] font-bold active:scale-[0.97] transition-all shadow-[0_3px_12px_rgba(26,92,56,0.22)]"
                          >
                            <MapPin size={14} /> {ring ? 'Editar' : 'Dibujar'}
                          </button>
                          <button
                            onClick={() => { setConfirmDel(p.up_id); setDelError(''); }}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-bold text-red-600 bg-red-50 hover:bg-red-100 active:scale-[0.97] transition-all"
                          >
                            <Trash2 size={14} /> Quitar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button onClick={() => navigate('/productor/ups/nueva')}
            className="mt-3 w-full flex items-center justify-center gap-2 border-2 border-dashed border-[#1A5C38] text-[#1A5C38] py-3 rounded-xl text-sm font-bold hover:bg-green-50 active:scale-[0.98] transition-all">
            <Plus size={16} /> Agregar otra parcela
          </button>
        </div>

        {/* Ciclo productivo */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Ciclo productivo</p>
            <button onClick={() => navigate('/productor/ciclo')} className="text-[#1A5C38]">
              {ciclos && ciclos.length > 0 ? <Edit2 size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>
          {ciclos === null && <p className="text-xs text-gray-400">Cargando...</p>}
          {ciclos !== null && ciclos.length === 0 && (
            <button onClick={() => navigate('/productor/ciclo')}
              className="w-full flex items-center gap-2 text-[#1A5C38] text-sm font-semibold">
              <CalendarCheck size={14} /> Declarar ciclo {new Date().getFullYear()}
            </button>
          )}
          {ciclos !== null && ciclos.length > 0 && (
            <div className="space-y-4">
              {ciclos.map(c => {
                const crop = c.crops?.[0];
                const tipoCiclo = c.cycle_type === 'PV' ? 'Primavera-Verano'
                  : c.cycle_type === 'OI' ? 'Otoño-Invierno' : 'Anual';
                return (
                  <div key={c.cycle_id} className="bg-[#f4fbf7] rounded-2xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <p className="text-sm font-bold text-gray-800">{tipoCiclo} {c.cycle_year}</p>
                        {crop && <p className="text-xs text-gray-500 mt-0.5">{crop.variety_other || crop.variety_id || 'Maíz'}</p>}
                      </div>
                      <button onClick={() => navigate('/productor/ciclo', { state: { cicloId: c.cycle_id } })}
                        className="text-xs text-[#1A5C38] font-medium border border-[#1A5C38] px-3 py-1 rounded-lg">
                        Editar
                      </button>
                    </div>
                    {crop && (
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        {crop.area_sown_ha && (
                          <div className="bg-white rounded-xl p-2.5 text-center">
                            <p className="text-xs text-gray-400">Sembrado</p>
                            <p className="text-sm font-bold text-gray-800 mt-0.5">{crop.area_sown_ha} ha</p>
                          </div>
                        )}
                        {crop.yield_expected && (
                          <div className="bg-white rounded-xl p-2.5 text-center">
                            <p className="text-xs text-gray-400">Esperado</p>
                            <p className="text-sm font-bold text-gray-800 mt-0.5">{crop.yield_expected} t/ha</p>
                          </div>
                        )}
                        {crop.area_sown_ha && crop.yield_expected && (
                          <div className="bg-green-50 rounded-xl p-2.5 text-center">
                            <p className="text-xs text-gray-400">Total est.</p>
                            <p className="text-sm font-bold text-[#1A5C38] mt-0.5">
                              {(Number(crop.area_sown_ha) * Number(crop.yield_expected)).toFixed(1)} ton
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    {crop?.planting_date && (
                      <p className="text-xs text-gray-400 mt-1">
                        Siembra: {new Date(crop.planting_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {crop.estimated_harvest_date && (
                          <span> · Cosecha: {new Date(crop.estimated_harvest_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}</span>
                        )}
                      </p>
                    )}
                  </div>
                );
              })}
              <button onClick={() => navigate('/productor/ciclo', { state: { nuevoCiclo: true } })}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-[#1A5C38] text-[#1A5C38] py-3 rounded-2xl text-sm font-semibold hover:bg-[#f4fbf7] active:scale-[0.98] transition-all">
                <Plus size={16} /> Agregar nuevo ciclo
              </button>
            </div>
          )}
        </div>

        {/* Programas */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Programas de beneficiario</p>
            <button onClick={() => setEditProg(!editProg)} className="text-[#1A5C38]">
              <Edit2 size={14} />
            </button>
          </div>
          {editProg ? (
            <div className="space-y-2">
              {PROGRAMAS_GOBIERNO.map(p => (
                <button key={p.clave} onClick={() => togglePrograma(p.clave)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl ring-1 text-sm transition-all duration-200 flex items-center gap-2
                    ${programas.includes(p.clave) ? 'ring-2 ring-[#1A5C38] bg-emerald-50 text-emerald-800 font-medium' : 'ring-zinc-200 text-zinc-700 hover:bg-[#eef8f2]'}`}>
                  <CircleDot size={14} className={programas.includes(p.clave) ? 'text-[#1A5C38]' : 'text-zinc-300'} />
                  {p.nombre}
                </button>
              ))}
              <button onClick={guardarProgramas}
                className="w-full bg-[#1A5C38] text-white py-2 rounded-xl text-sm font-semibold mt-2">
                Guardar
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {(perfil.programas_beneficiario || []).length === 0 && (
                <p className="text-sm text-gray-400">Ninguno seleccionado</p>
              )}
              {(perfil.programas_beneficiario || []).map(clave => {
                const prog = PROGRAMAS_GOBIERNO.find(p => p.clave === clave);
                return <p key={clave} className="text-sm text-zinc-800 flex items-center gap-2"><CircleDot size={12} className="text-[#1A5C38]" /> {prog?.nombre || clave}</p>;
              })}
            </div>
          )}
        </div>

        {/* Mis solicitudes */}
        <button onClick={() => navigate('/productor/solicitud/0')}
          className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left">
          <p className="font-semibold text-gray-800 text-sm">Mis solicitudes de apoyo</p>
          <p className="text-xs text-gray-500 mt-1">Ver el estado de tus solicitudes a ventanillas</p>
        </button>

        {/* Cerrar sesión */}
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-4 text-red-500 font-semibold text-sm">
          <LogOut size={16} /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}
