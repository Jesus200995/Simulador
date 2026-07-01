import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Edit2, MapPin, LogOut, CircleDot, CalendarCheck, ChevronRight,
  Sprout, Trash2, Plus, Phone, Mail, Check, X, Leaf,
  ClipboardList, Award,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import MapaUP from '../../components/productor/MapaUP';
import ProfileHero from '../../components/ProfileHero';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const PROGRAMAS_GOBIERNO = [
  { clave: 'fertilizantes_bienestar', nombre: 'Fertilizantes para el Bienestar' },
  { clave: 'produccion_bienestar',    nombre: 'Producción para el Bienestar' },
  { clave: 'precios_garantia',        nombre: 'Precios de Garantía' },
  { clave: 'maiz_blanco_precio_justo',nombre: 'Maíz Blanco / Precio Justo' },
  { clave: 'maiz_es_raiz',            nombre: 'Plan El Maíz es la Raíz' },
  { clave: 'cosechando_soberania',    nombre: 'Cosechando Soberanía' },
  { clave: 'sembrando_vida',          nombre: 'Sembrando Vida' },
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
interface Ciclo { cycle_id: number; cycle_year: number; cycle_type: string; crops: CropInfo[]; }

export default function MiPerfilPage() {
  const navigate    = useNavigate();
  const { logout }  = useAuthStore();
  const [perfil, setPerfil]       = useState<Perfil | null>(null);
  const [loading, setLoading]     = useState(true);
  const [editTel, setEditTel]     = useState(false);
  const [telefono, setTelefono]   = useState('');
  const [editCorreo, setEditCorreo] = useState(false);
  const [correo, setCorreo]       = useState('');
  const [editProg, setEditProg]   = useState(false);
  const [programas, setProgramas] = useState<string[]>([]);
  const [ciclos, setCiclos]       = useState<Ciclo[] | null>(null);
  const [parcelas, setParcelas]   = useState<any[]>([]);
  const [confirmDel, setConfirmDel] = useState<number | null>(null);
  const [eliminando, setEliminando] = useState<number | null>(null);
  const [delError, setDelError]   = useState('');
  const [savedTel, setSavedTel]   = useState(false);
  const [savedCorreo, setSavedCorreo] = useState(false);

  const ringDe = (u: any): [number, number][] | null => {
    const g = u?.geom_geojson;
    if (!g?.coordinates) return null;
    const ring = g.type === 'MultiPolygon' ? g.coordinates[0]?.[0] : g.coordinates[0];
    return ring && ring.length >= 3 ? (ring as [number, number][]) : null;
  };

  const eliminarParcela = async (upId: number) => {
    setEliminando(upId); setDelError('');
    try {
      const token = localStorage.getItem('simac_token');
      const r = await fetch(`${BASE}/mis-ups/${upId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setDelError(d.error || 'No se pudo eliminar.'); setConfirmDel(null); return; }
      setParcelas(prev => prev.filter(p => p.up_id !== upId));
      setConfirmDel(null);
    } catch { setDelError('Error de conexión.'); setConfirmDel(null); }
    finally { setEliminando(null); }
  };

  useEffect(() => {
    const token = localStorage.getItem('simac_token');
    fetch(`${BASE}/productor/perfil`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setPerfil(d); setTelefono(d.telefono || ''); setCorreo(d.correo || ''); setProgramas(d.programas_beneficiario || []); })
      .finally(() => setLoading(false));
    const t2 = localStorage.getItem('simac_token');
    fetch(`${BASE}/mis-ups`, { headers: { Authorization: `Bearer ${t2}` } })
      .then(r => r.json())
      .then(d => {
        const ups = d.ups ?? (Array.isArray(d) ? d : []);
        setParcelas(ups);
        const up = ups[0];
        if (!up) return;
        return fetch(`${BASE}/ups/${up.up_id}/cycles`, { headers: { Authorization: `Bearer ${t2}` } })
          .then(r => r.json()).then(d => setCiclos(d.cycles ?? d));
      }).catch(() => setCiclos([]));
  }, []);

  const guardarTelefono = async () => {
    const token = localStorage.getItem('simac_token');
    await fetch(`${BASE}/productor/perfil`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ telefono }) });
    setEditTel(false); setPerfil(prev => prev ? { ...prev, telefono } : prev);
    setSavedTel(true); setTimeout(() => setSavedTel(false), 2000);
  };

  const guardarCorreo = async () => {
    const token = localStorage.getItem('simac_token');
    await fetch(`${BASE}/productor/perfil`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ correo: correo || null }) });
    setEditCorreo(false); setPerfil(prev => prev ? { ...prev, correo } : prev);
    setSavedCorreo(true); setTimeout(() => setSavedCorreo(false), 2000);
  };

  const guardarProgramas = async () => {
    const token = localStorage.getItem('simac_token');
    await fetch(`${BASE}/productor/perfil`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ programas_beneficiario: programas }) });
    setEditProg(false); setPerfil(prev => prev ? { ...prev, programas_beneficiario: programas } : prev);
  };

  const togglePrograma = (clave: string) =>
    setProgramas(prev => prev.includes(clave) ? prev.filter(p => p !== clave) : [...prev, clave]);

  if (loading) return (
    <div className="min-h-screen bg-[#eef8f2] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-[3px] border-[#1A5C38]/20 border-t-[#1A5C38] animate-spin" />
    </div>
  );
  if (!perfil) return null;

  const nombreCompleto = [perfil.nombres, perfil.apellido_paterno, perfil.apellido_materno].filter(Boolean).join(' ');
  const initials = [perfil.nombres, perfil.apellido_paterno].filter(Boolean).map(w => w[0]).join('').toUpperCase() || 'P';
  const estadoColor = perfil.estado_validacion === 'activo' ? 'bg-emerald-400/90 text-emerald-950' : perfil.estado_validacion === 'pendiente' ? 'bg-amber-300/90 text-amber-950' : 'bg-red-400/90 text-red-950';

  const delay = (i: number) => ({ animation: `pfFadeUp .4s ${i * 55}ms ease both` });

  return (
    <div className="bg-[#eef8f2] min-h-screen pb-28">
      <style>{`
        @keyframes pfFadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pfPop    { from { opacity:0; transform:scale(0.92) }       to { opacity:1; transform:scale(1) }    }
      `}</style>

      <ProfileHero
        titulo="Mi Perfil"
        nombre={nombreCompleto || 'Productor'}
        initials={initials}
        badges={
          <>
            <span className="text-[11px] font-bold text-white/90 bg-white/15 rounded-full px-3 py-1">
              Tipo {perfil.tipo_registro}
            </span>
            <span className={`text-[11px] font-bold rounded-full px-3 py-1 ${estadoColor}`}>
              {perfil.estado_validacion.charAt(0).toUpperCase() + perfil.estado_validacion.slice(1)}
            </span>
          </>
        }
      />

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-3">

        {/* ── CURP pill (dato único no repetido) ── */}
        <div style={delay(0)} className="bg-white rounded-2xl px-5 py-3.5 shadow-sm ring-1 ring-black/[0.04] flex items-center justify-between">
          <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-widest">CURP</span>
          <span className="font-mono text-[13px] text-slate-700 tracking-wider">{perfil.curp || '—'}</span>
        </div>

        {/* ── Contacto ── */}
        <div style={delay(1)} className="bg-white rounded-2xl shadow-sm ring-1 ring-black/[0.04] overflow-hidden">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-5 pt-4 pb-0">Contacto</p>

          {/* Teléfono */}
          <div className="px-5 pt-3 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Phone size={15} className="text-[#1A5C38]" />
                <span className="text-[13px] text-slate-500 font-medium">Teléfono</span>
              </div>
              {!editTel && (
                <div className="flex items-center gap-2">
                  {savedTel && <span className="text-[11px] text-emerald-600 font-bold">Guardado ✓</span>}
                  <span className="text-[14px] font-semibold text-slate-800">{perfil.telefono || <span className="text-slate-300 font-normal text-[13px]">sin teléfono</span>}</span>
                  <button onClick={() => setEditTel(true)} className="w-7 h-7 rounded-xl bg-[#eef8f2] flex items-center justify-center active:scale-95 transition-transform">
                    <Edit2 size={13} className="text-[#1A5C38]" />
                  </button>
                </div>
              )}
            </div>
            {editTel && (
              <div className="mt-2.5 flex gap-2" style={{ animation: 'pfPop .25s ease both' }}>
                <input
                  type="tel" inputMode="numeric" autoFocus
                  value={telefono} maxLength={10}
                  onChange={e => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="flex-1 bg-[#f4fbf7] border-2 border-[#1A5C38]/20 focus:border-[#1A5C38] rounded-xl px-3 py-2.5 text-[15px] outline-none transition-colors"
                />
                <button onClick={guardarTelefono} disabled={telefono.length < 10}
                  className="w-11 h-11 rounded-xl bg-[#1A5C38] flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all shadow-sm shadow-[#1A5C38]/20">
                  <Check size={16} className="text-white" />
                </button>
                <button onClick={() => { setEditTel(false); setTelefono(perfil.telefono || ''); }}
                  className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center active:scale-95 transition-transform">
                  <X size={15} className="text-slate-400" />
                </button>
              </div>
            )}
          </div>

          <div className="h-px bg-slate-50 mx-5" />

          {/* Correo */}
          <div className="px-5 pt-3 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Mail size={15} className="text-[#1A5C38]" />
                <span className="text-[13px] text-slate-500 font-medium">Correo</span>
              </div>
              {!editCorreo && (
                <div className="flex items-center gap-2">
                  {savedCorreo && <span className="text-[11px] text-emerald-600 font-bold">Guardado ✓</span>}
                  <span className="text-[13px] font-medium text-slate-700 truncate max-w-[170px]">
                    {perfil.correo || <span className="text-slate-300 font-normal">sin correo</span>}
                  </span>
                  <button onClick={() => setEditCorreo(true)} className="w-7 h-7 rounded-xl bg-[#eef8f2] flex items-center justify-center active:scale-95 transition-transform">
                    <Edit2 size={13} className="text-[#1A5C38]" />
                  </button>
                </div>
              )}
            </div>
            {editCorreo && (
              <div className="mt-2.5 flex gap-2" style={{ animation: 'pfPop .25s ease both' }}>
                <input
                  type="email" inputMode="email" autoFocus autoCapitalize="off" autoCorrect="off"
                  value={correo} onChange={e => setCorreo(e.target.value)}
                  className="flex-1 bg-[#f4fbf7] border-2 border-[#1A5C38]/20 focus:border-[#1A5C38] rounded-xl px-3 py-2.5 text-[14px] outline-none transition-colors"
                  placeholder="tu@correo.com"
                />
                <button onClick={guardarCorreo}
                  className="w-11 h-11 rounded-xl bg-[#1A5C38] flex items-center justify-center active:scale-95 transition-all shadow-sm shadow-[#1A5C38]/20">
                  <Check size={16} className="text-white" />
                </button>
                <button onClick={() => { setEditCorreo(false); setCorreo(perfil.correo || ''); }}
                  className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center active:scale-95 transition-transform">
                  <X size={15} className="text-slate-400" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Mis parcelas ── */}
        <div style={delay(2)} className="bg-white rounded-2xl shadow-sm ring-1 ring-black/[0.04] overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Leaf size={15} className="text-[#1A5C38]" />
              <p className="text-[13px] font-bold text-slate-700">
                Mis parcelas{parcelas.length > 0 && <span className="ml-1.5 text-[11px] text-slate-400 font-normal">({parcelas.length})</span>}
              </p>
            </div>
          </div>

          {delError && (
            <div className="mx-5 mb-3 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              <p className="text-[12px] text-red-600">{delError}</p>
            </div>
          )}

          {parcelas.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2 text-center px-5">
              <div className="w-12 h-12 rounded-2xl bg-[#eef8f2] flex items-center justify-center">
                <Sprout size={20} className="text-[#1A5C38]/40" />
              </div>
              <p className="text-[14px] font-semibold text-slate-600 mt-1">Aún sin parcelas</p>
              <p className="text-[12px] text-slate-400">Agrega tu primera unidad de producción y dibújala en el mapa</p>
            </div>
          ) : (
            <div className="px-4 space-y-2.5 pb-4">
              {parcelas.map((p: any, i: number) => {
                const ring = ringDe(p);
                const lat  = p.centroid_lat ?? p.lat;
                const lng  = p.centroid_lng ?? p.lng;
                return (
                  <div key={p.up_id ?? i} className="rounded-2xl border border-slate-100 overflow-hidden" style={{ animation: `pfFadeUp .35s ${i * 60 + 80}ms ease both` }}>
                    {lat && lng ? (
                      <MapaUP lat={lat} lng={lng} locationConfirmed={!!p.location_confirmed} centroidSource={p.centroid_source} radioKm={3} height="120px" zoom={14} poligono={ring} />
                    ) : (
                      <div className="h-20 bg-[#f4fbf7] flex items-center justify-center gap-2">
                        <MapPin size={16} className="text-[#1A5C38]/30" />
                        <span className="text-[12px] text-slate-400">Sin ubicación</span>
                      </div>
                    )}
                    <div className="p-3.5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <p className="text-[14px] font-bold text-slate-900 truncate">{p.up_name || `Parcela ${i + 1}`}</p>
                          <p className="text-[12px] text-slate-400 truncate mt-0.5">{[p.municipality_name, p.state_name].filter(Boolean).join(', ') || 'Sin ubicación'}</p>
                        </div>
                        {p.area_ha_calc != null && (
                          <span className="flex-shrink-0 text-[12px] font-bold text-[#1A5C38] bg-[#eef8f2] px-2.5 py-1 rounded-full">
                            {Number(p.area_ha_calc).toLocaleString('es-MX', { maximumFractionDigits: 1 })} ha
                          </span>
                        )}
                      </div>

                      {confirmDel === p.up_id ? (
                        <div className="bg-red-50 ring-1 ring-red-100 rounded-xl p-3 flex items-center justify-between gap-2">
                          <span className="text-[12.5px] font-semibold text-red-700">¿Eliminar?</span>
                          <div className="flex gap-1.5">
                            <button onClick={() => setConfirmDel(null)} disabled={eliminando === p.up_id}
                              className="px-3 py-1.5 rounded-lg text-[12px] font-bold text-slate-600 bg-white ring-1 ring-slate-200 active:scale-95 transition-transform">
                              Cancelar
                            </button>
                            <button onClick={() => eliminarParcela(p.up_id)} disabled={eliminando === p.up_id}
                              className="px-3 py-1.5 rounded-lg text-[12px] font-bold text-white bg-red-500 active:scale-95 transition-all disabled:opacity-60">
                              {eliminando === p.up_id ? '…' : 'Sí, quitar'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => navigate(`/productor/ubicacion?up_id=${p.up_id}`)}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-[#1A5C38] text-white py-2.5 rounded-xl text-[13px] font-bold active:scale-[0.97] transition-all shadow-[0_3px_10px_rgba(26,92,56,0.2)]">
                            <MapPin size={13} /> {ring ? 'Editar' : 'Dibujar'}
                          </button>
                          <button onClick={() => { setConfirmDel(p.up_id); setDelError(''); }}
                            className="px-4 py-2.5 rounded-xl text-[13px] font-bold text-red-500 bg-red-50 active:scale-[0.97] transition-all">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="px-4 pb-4">
            <button onClick={() => navigate('/productor/ups/nueva')}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-[#1A5C38]/30 text-[#1A5C38] py-3 rounded-2xl text-[13px] font-bold hover:bg-[#f4fbf7] active:scale-[0.98] transition-all">
              <Plus size={15} /> Agregar parcela
            </button>
          </div>
        </div>

        {/* ── Ciclo productivo ── */}
        <div style={delay(3)} className="bg-white rounded-2xl shadow-sm ring-1 ring-black/[0.04] overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <CalendarCheck size={15} className="text-[#1A5C38]" />
              <p className="text-[13px] font-bold text-slate-700">Ciclo productivo</p>
            </div>
            <button onClick={() => navigate('/productor/ciclo')} className="w-7 h-7 rounded-xl bg-[#eef8f2] flex items-center justify-center active:scale-95 transition-transform">
              {ciclos && ciclos.length > 0 ? <Edit2 size={13} className="text-[#1A5C38]" /> : <ChevronRight size={14} className="text-[#1A5C38]" />}
            </button>
          </div>

          {ciclos === null && <p className="px-5 pb-4 text-[12px] text-slate-400">Cargando...</p>}

          {ciclos !== null && ciclos.length === 0 && (
            <button onClick={() => navigate('/productor/ciclo')}
              className="w-full px-5 pb-5 flex items-center gap-2 text-[#1A5C38] text-[13px] font-semibold">
              <Plus size={14} /> Declarar ciclo {new Date().getFullYear()}
            </button>
          )}

          {ciclos !== null && ciclos.length > 0 && (
            <div className="px-4 pb-4 space-y-2.5">
              {ciclos.map(c => {
                const crop = c.crops?.[0];
                const tipoCiclo = c.cycle_type === 'PV' ? 'Primavera-Verano' : c.cycle_type === 'OI' ? 'Otoño-Invierno' : 'Anual';
                const total = crop?.area_sown_ha && crop?.yield_expected ? (Number(crop.area_sown_ha) * Number(crop.yield_expected)).toFixed(1) : null;
                return (
                  <div key={c.cycle_id} className="bg-gradient-to-br from-[#f4fbf7] to-[#eef8f2] rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-[14px] font-bold text-slate-800">{tipoCiclo} {c.cycle_year}</p>
                        {crop && <p className="text-[12px] text-slate-500 mt-0.5">{crop.variety_other || crop.variety_id || 'Maíz blanco'}</p>}
                      </div>
                      <button onClick={() => navigate('/productor/ciclo', { state: { cicloId: c.cycle_id } })}
                        className="text-[11px] text-[#1A5C38] font-bold border border-[#1A5C38]/30 px-3 py-1.5 rounded-xl bg-white active:scale-95 transition-transform">
                        Editar
                      </button>
                    </div>
                    {crop && (
                      <div className="grid grid-cols-3 gap-2">
                        {crop.area_sown_ha && (
                          <div className="bg-white rounded-xl p-2.5 text-center ring-1 ring-black/[0.04]">
                            <p className="text-[10px] text-slate-400 font-medium">Sembrado</p>
                            <p className="text-[14px] font-black text-slate-800 mt-0.5">{crop.area_sown_ha} <span className="text-[10px] font-normal text-slate-500">ha</span></p>
                          </div>
                        )}
                        {crop.yield_expected && (
                          <div className="bg-white rounded-xl p-2.5 text-center ring-1 ring-black/[0.04]">
                            <p className="text-[10px] text-slate-400 font-medium">Rendim.</p>
                            <p className="text-[14px] font-black text-slate-800 mt-0.5">{crop.yield_expected} <span className="text-[10px] font-normal text-slate-500">t/ha</span></p>
                          </div>
                        )}
                        {total && (
                          <div className="bg-[#1A5C38] rounded-xl p-2.5 text-center shadow-sm shadow-[#1A5C38]/25">
                            <p className="text-[10px] text-green-200/80 font-medium">Total est.</p>
                            <p className="text-[14px] font-black text-white mt-0.5">{total} <span className="text-[10px] font-normal text-green-200/80">ton</span></p>
                          </div>
                        )}
                      </div>
                    )}
                    {crop?.planting_date && (
                      <p className="text-[11px] text-slate-400 mt-2.5">
                        Siembra: {new Date(crop.planting_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
                        {crop.estimated_harvest_date && ` · Cosecha est.: ${new Date(crop.estimated_harvest_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}`}
                      </p>
                    )}
                  </div>
                );
              })}
              <button onClick={() => navigate('/productor/ciclo', { state: { nuevoCiclo: true } })}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-[#1A5C38]/30 text-[#1A5C38] py-2.5 rounded-2xl text-[13px] font-bold hover:bg-[#f4fbf7] active:scale-[0.98] transition-all">
                <Plus size={14} /> Nuevo ciclo
              </button>
            </div>
          )}
        </div>

        {/* ── Programas ── */}
        <div style={delay(4)} className="bg-white rounded-2xl shadow-sm ring-1 ring-black/[0.04] overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Award size={15} className="text-[#1A5C38]" />
              <p className="text-[13px] font-bold text-slate-700">Programas de apoyo</p>
            </div>
            <button onClick={() => setEditProg(!editProg)} className="w-7 h-7 rounded-xl bg-[#eef8f2] flex items-center justify-center active:scale-95 transition-transform">
              {editProg ? <X size={14} className="text-slate-400" /> : <Edit2 size={13} className="text-[#1A5C38]" />}
            </button>
          </div>

          <div className="px-5 pb-4">
            {editProg ? (
              <div className="space-y-1.5" style={{ animation: 'pfPop .25s ease both' }}>
                {PROGRAMAS_GOBIERNO.map(p => (
                  <button key={p.clave} onClick={() => togglePrograma(p.clave)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl ring-1 text-[13px] transition-all duration-200 flex items-center gap-2.5
                      ${programas.includes(p.clave) ? 'ring-[#1A5C38]/40 bg-[#eef8f2] text-[#1A5C38] font-semibold' : 'ring-slate-100 text-slate-600 hover:bg-slate-50'}`}>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${programas.includes(p.clave) ? 'border-[#1A5C38] bg-[#1A5C38]' : 'border-slate-300'}`}>
                      {programas.includes(p.clave) && <Check size={9} className="text-white" strokeWidth={3} />}
                    </div>
                    {p.nombre}
                  </button>
                ))}
                <button onClick={guardarProgramas}
                  className="w-full mt-2 bg-[#1A5C38] text-white py-3 rounded-xl text-[13px] font-bold active:scale-[0.98] transition-all shadow-sm shadow-[#1A5C38]/20">
                  Guardar cambios
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {(perfil.programas_beneficiario || []).length === 0 ? (
                  <p className="text-[13px] text-slate-400">Ninguno seleccionado</p>
                ) : (
                  (perfil.programas_beneficiario || []).map(clave => {
                    const prog = PROGRAMAS_GOBIERNO.find(p => p.clave === clave);
                    return (
                      <span key={clave} className="inline-flex items-center gap-1.5 bg-[#eef8f2] text-[#1A5C38] text-[11.5px] font-semibold px-2.5 py-1 rounded-full">
                        <CircleDot size={10} />
                        {prog?.nombre || clave}
                      </span>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Mis solicitudes ── */}
        <button style={delay(5)} onClick={() => navigate('/productor/solicitud/0')}
          className="w-full bg-white rounded-2xl shadow-sm ring-1 ring-black/[0.04] px-5 py-4 flex items-center gap-3.5 text-left active:scale-[0.98] transition-all group">
          <div className="w-10 h-10 rounded-xl bg-[#eef8f2] flex items-center justify-center flex-shrink-0 group-active:bg-[#d9f0e5] transition-colors">
            <ClipboardList size={17} className="text-[#1A5C38]" />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-bold text-slate-800">Mis solicitudes de apoyo</p>
            <p className="text-[12px] text-slate-400 mt-0.5">Ver estado de solicitudes a ventanillas</p>
          </div>
          <ChevronRight size={16} className="text-slate-300 group-active:text-[#1A5C38] transition-colors" />
        </button>

        {/* ── Cerrar sesión ── */}
        <button style={delay(6)} onClick={() => { logout(); navigate('/login'); }}
          className="w-full flex items-center justify-center gap-2 py-4 text-red-500 font-semibold text-[14px] active:opacity-70 transition-opacity">
          <LogOut size={16} /> Cerrar sesión
        </button>

      </div>
    </div>
  );
}
