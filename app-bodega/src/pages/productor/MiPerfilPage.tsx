import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, MapPin, LogOut, Check, CircleDot } from 'lucide-react';
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
  telefono: string; estado_validacion: string; tipo_registro: string;
  programas_beneficiario: string[];
  state_name: string; municipality_name: string;
  location_confirmed: boolean; centroid_source: string;
  lat: number; lng: number;
}

export default function MiPerfilPage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [editTel, setEditTel] = useState(false);
  const [telefono, setTelefono] = useState('');
  const [editProg, setEditProg] = useState(false);
  const [programas, setProgramas] = useState<string[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('simac_token');
    fetch(`${BASE}/productor/perfil`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        setPerfil(d);
        setTelefono(d.telefono || '');
        setProgramas(d.programas_beneficiario || []);
      })
      .finally(() => setLoading(false));
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
      <div className="w-full bg-white/90 backdrop-blur-sm border-b border-black/[0.06] px-4 sm:px-6 pt-3.5 pb-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-[20px] font-bold text-gray-900 leading-tight">Mi perfil</h1>
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
            <div className="space-y-2">
              <input value={telefono}
                onChange={e => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:border-[#1A5C38] focus:outline-none" />
              <button onClick={guardarTelefono}
                className="w-full bg-[#1A5C38] text-white py-2 rounded-xl text-sm font-semibold">
                Guardar
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-800">{perfil.telefono || 'Sin teléfono'}</p>
          )}
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
