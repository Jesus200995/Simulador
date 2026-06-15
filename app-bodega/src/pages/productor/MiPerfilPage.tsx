import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, MapPin, LogOut, Check, CircleDot, CalendarCheck, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import MapaUP from '../../components/productor/MapaUP';

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
  const [poligono, setPoligono] = useState<[number, number][] | null>(null);
  const [ciclos, setCiclos] = useState<Ciclo[] | null>(null);

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
        const up = d.ups?.[0] ?? d[0];
        if (!up) return;
        const geom = up.geom_geojson;
        if (geom?.coordinates) {
          const ring = geom.type === 'MultiPolygon'
            ? geom.coordinates[0]?.[0]
            : geom.coordinates[0];
          if (ring?.length >= 3) setPoligono(ring as [number, number][]);
        }
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

  return (
    <div className="bg-[#F2F2F7] min-h-screen">
      <div className="w-full bg-gradient-to-br from-[#1A5C38] via-[#1e6b42] to-[#22733f] rounded-b-[28px] shadow-[0_4px_20px_rgba(26,92,56,0.25)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-5 pt-4 pb-6">
          <p className="text-[9.5px] font-semibold text-green-300/70 uppercase tracking-widest mb-3">Perfil</p>
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm ring-2 ring-white/20 flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-white text-[9.5px] font-black">{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-[9.5px] sm:text-[10px] font-black text-white leading-tight tracking-tight truncate">{nombreCompleto || 'Mi perfil'}</h1>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-white bg-white/15 rounded-full px-2 py-0.5">Tipo {perfil.tipo_registro}</span>
                <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${
                  perfil.estado_validacion === 'activo' ? 'bg-green-400/90 text-green-950'
                  : perfil.estado_validacion === 'pendiente' ? 'bg-amber-300/90 text-amber-950'
                  : 'bg-red-400/90 text-red-950'}`}>
                  {perfil.estado_validacion}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Datos personales — no editables */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">Datos personales</p>
          <div className="space-y-2 text-xs">
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
                {perfil.estado_validacion}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Estos datos vienen del padrón. Si hay un error, contacta a tu técnico territorial.
          </p>
        </div>

        {/* Contacto — editable */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Contacto</p>
            <button onClick={() => setEditTel(!editTel)} className="text-[#1A5C38]">
              <Edit2 size={12} />
            </button>
          </div>
          {editTel ? (
            <div className="space-y-2 mb-3">
              <input value={telefono}
                onChange={e => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-xs focus:border-[#1A5C38] focus:outline-none" />
              <button onClick={guardarTelefono}
                className="w-full bg-[#1A5C38] text-white py-2 rounded-xl text-xs font-semibold">
                Guardar teléfono
              </button>
            </div>
          ) : (
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-gray-400">Teléfono</span>
              <span className="text-xs text-gray-800">{perfil.telefono || 'Sin teléfono'}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Correo</span>
            {editCorreo ? (
              <div className="flex items-center gap-2">
                <input type="email" value={correo}
                  onChange={e => setCorreo(e.target.value)}
                  autoCapitalize="off" autoCorrect="off" inputMode="email"
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:border-[#1A5C38] focus:outline-none" />
                <button onClick={guardarCorreo} className="text-[#1A5C38] text-xs font-bold">OK</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-800">{perfil.correo || <span className="text-gray-400 italic text-xs">sin correo</span>}</span>
                <button onClick={() => setEditCorreo(true)} className="text-[#1A5C38]"><Edit2 size={12} /></button>
              </div>
            )}
          </div>
        </div>

        {/* Mi parcela */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">Mi parcela</p>

          {/* Mapa mini de la UP */}
          {perfil.lat && perfil.lng && (
            <div className="mb-4">
              <MapaUP
                lat={perfil.lat}
                lng={perfil.lng}
                locationConfirmed={perfil.location_confirmed}
                centroidSource={perfil.centroid_source}
                radioKm={5}
                height="160px"
                zoom={13}
                poligono={poligono}
              />
            </div>
          )}

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Estado</span>
              <span className="font-medium text-gray-800">{perfil.state_name || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Municipio</span>
              <span className="font-medium text-gray-800">{perfil.municipality_name || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Ubicación</span>
              <span className={`text-xs flex items-center gap-1 ${perfil.location_confirmed ? 'text-green-600' : 'text-amber-600'}`}>
                {perfil.location_confirmed ? <><Check size={12} /> Confirmada</> : 'Aproximada'}
              </span>
            </div>
          </div>
          <button onClick={() => navigate('/productor/ubicacion')}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-[#1A5C38] hover:bg-[#15482d] text-white py-3 rounded-xl text-xs font-semibold active:scale-[0.98] transition-all shadow-[0_4px_14px_rgba(26,92,56,0.25)]">
            <MapPin size={12} /> {poligono ? 'Editar mi parcela en el mapa' : 'Dibujar mi parcela en el mapa'}
          </button>
          <button onClick={() => navigate('/productor/ups/nueva')}
            className="mt-2 w-full flex items-center justify-center gap-2 border-2 border-dashed border-[#1A5C38] text-[#1A5C38] py-3 rounded-xl text-xs font-medium hover:bg-green-50 active:scale-[0.98] transition-all">
            <span className="text-xs leading-none">+</span> Agregar otra parcela
          </button>
        </div>

        {/* Ciclo productivo */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Ciclo productivo</p>
            <button onClick={() => navigate('/productor/ciclo')} className="text-[#1A5C38]">
              {ciclos && ciclos.length > 0 ? <Edit2 size={12} /> : <ChevronRight size={12} />}
            </button>
          </div>
          {ciclos === null && <p className="text-xs text-gray-400">Cargando...</p>}
          {ciclos !== null && ciclos.length === 0 && (
            <button onClick={() => navigate('/productor/ciclo')}
              className="w-full flex items-center gap-2 text-[#1A5C38] text-xs font-semibold">
              <CalendarCheck size={12} /> Declarar ciclo {new Date().getFullYear()}
            </button>
          )}
          {ciclos !== null && ciclos.length > 0 && (
            <div className="space-y-4">
              {ciclos.map(c => {
                const crop = c.crops?.[0];
                const tipoCiclo = c.cycle_type === 'PV' ? 'Primavera-Verano'
                  : c.cycle_type === 'OI' ? 'Otoño-Invierno' : 'Anual';
                return (
                  <div key={c.cycle_id} className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <p className="text-xs font-bold text-gray-800">{tipoCiclo} {c.cycle_year}</p>
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
                            <p className="text-xs font-bold text-gray-800 mt-0.5">{crop.area_sown_ha} ha</p>
                          </div>
                        )}
                        {crop.yield_expected && (
                          <div className="bg-white rounded-xl p-2.5 text-center">
                            <p className="text-xs text-gray-400">Esperado</p>
                            <p className="text-xs font-bold text-gray-800 mt-0.5">{crop.yield_expected} t/ha</p>
                          </div>
                        )}
                        {crop.area_sown_ha && crop.yield_expected && (
                          <div className="bg-green-50 rounded-xl p-2.5 text-center">
                            <p className="text-xs text-gray-400">Total est.</p>
                            <p className="text-xs font-bold text-[#1A5C38] mt-0.5">
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
            </div>
          )}
        </div>

        {/* Programas */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Programas de beneficiario</p>
            <button onClick={() => setEditProg(!editProg)} className="text-[#1A5C38]">
              <Edit2 size={12} />
            </button>
          </div>
          {editProg ? (
            <div className="space-y-2">
              {PROGRAMAS_GOBIERNO.map(p => (
                <button key={p.clave} onClick={() => togglePrograma(p.clave)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl ring-1 text-xs transition-all duration-200 flex items-center gap-2
                    ${programas.includes(p.clave) ? 'ring-2 ring-[#1A5C38] bg-emerald-50 text-emerald-800 font-medium' : 'ring-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}>
                  <CircleDot size={12} className={programas.includes(p.clave) ? 'text-[#1A5C38]' : 'text-zinc-300'} />
                  {p.nombre}
                </button>
              ))}
              <button onClick={guardarProgramas}
                className="w-full bg-[#1A5C38] text-white py-2 rounded-xl text-xs font-semibold mt-2">
                Guardar
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {(perfil.programas_beneficiario || []).length === 0 && (
                <p className="text-xs text-gray-400">Ninguno seleccionado</p>
              )}
              {(perfil.programas_beneficiario || []).map(clave => {
                const prog = PROGRAMAS_GOBIERNO.find(p => p.clave === clave);
                return <p key={clave} className="text-xs text-zinc-800 flex items-center gap-2"><CircleDot size={12} className="text-[#1A5C38]" /> {prog?.nombre || clave}</p>;
              })}
            </div>
          )}
        </div>

        {/* Mis solicitudes */}
        <button onClick={() => navigate('/productor/solicitud/0')}
          className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left">
          <p className="font-semibold text-gray-800 text-xs">Mis solicitudes de apoyo</p>
          <p className="text-xs text-gray-500 mt-1">Ver el estado de tus solicitudes a ventanillas</p>
        </button>

        {/* Cerrar sesión */}
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-4 text-red-500 font-semibold text-xs">
          <LogOut size={12} /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}
