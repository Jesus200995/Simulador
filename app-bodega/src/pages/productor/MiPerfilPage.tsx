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

interface Ciclo {
  cycle_id: number; cycle_year: number; cycle_type: string;
  hectareas_sembradas: number | null;
  fecha_siembra: string | null;
  variedad_nombre: string | null;
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
  const [ciclo, setCiclo] = useState<Ciclo | null | undefined>(undefined);

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
    fetch(`${BASE}/productor/mi-ciclo`, { headers: { Authorization: `Bearer ${token2}` } })
      .then(r => r.json()).then(setCiclo).catch(() => setCiclo(null));
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

  return (
    <div className="bg-[#F2F2F7]">
      <div className="w-full bg-gradient-to-br from-[#1A5C38] via-[#1e6b42] to-[#22733f] rounded-b-3xl shadow-[0_4px_20px_rgba(26,92,56,0.25)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-5">
          <p className="text-[11px] font-semibold text-green-300/70 uppercase tracking-widest mb-2">Perfil</p>
          <h1 className="text-[19px] sm:text-[22px] font-black text-white leading-tight tracking-tight">Mi perfil</h1>
          <p className="text-[13px] font-medium text-white/40 mt-0.5">Informacion personal</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
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
                {perfil.estado_validacion}
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

        {/* Mi parcela */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
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
              />
            </div>
          )}

          <div className="space-y-2 text-sm">
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
            className="mt-3 flex items-center gap-1 text-[#1A5C38] text-sm font-semibold">
            <MapPin size={14} /> Actualizar ubicación en el mapa
          </button>
        </div>

        {/* Ciclo activo */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Ciclo productivo</p>
            <button onClick={() => navigate('/productor/ciclo')} className="text-[#1A5C38]">
              {ciclo ? <Edit2 size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>
          {ciclo ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Año</span>
                <span className="font-medium text-gray-800">{ciclo.cycle_year}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tipo</span>
                <span className="font-medium text-gray-800">{ciclo.cycle_type}</span>
              </div>
              {ciclo.hectareas_sembradas && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Hectáreas</span>
                  <span className="font-medium text-gray-800">{ciclo.hectareas_sembradas} ha</span>
                </div>
              )}
              {ciclo.variedad_nombre && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Variedad</span>
                  <span className="font-medium text-gray-800">{ciclo.variedad_nombre}</span>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => navigate('/productor/ciclo')}
              className="w-full flex items-center gap-2 text-[#1A5C38] text-sm font-semibold">
              <CalendarCheck size={14} /> Declarar ciclo {new Date().getFullYear()}
            </button>
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
                    ${programas.includes(p.clave) ? 'ring-2 ring-[#1A5C38] bg-emerald-50 text-emerald-800 font-medium' : 'ring-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}>
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
