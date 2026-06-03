import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Edit2, Check, X, User, Mail, Phone, Warehouse,
  LogOut, ShieldCheck, Calendar, ChevronRight, Building2
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { PageBanner } from '../components/Layout';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const HDR = () => ({ Authorization: `Bearer ${localStorage.getItem('simac_token')}`, 'Content-Type': 'application/json' });

interface PerfilBodega {
  id: number;
  email: string;
  nombre_completo: string;
  telefono: string;
  rol: string;
  created_at: string;
}

interface BodegaInfo {
  bodega_id: number;
  nombre: string;
  municipio: string;
  estado: string;
  semaforo_compra: string;
}

function Spinner() {
  return (
    <div className="w-6 h-6 border-2 border-[#1A5C38]/20 border-t-[#1A5C38] rounded-full animate-spin" />
  );
}

export default function B24PerfilBodega() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [perfil, setPerfil] = useState<PerfilBodega | null>(null);
  const [bodegas, setBodegas] = useState<BodegaInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Edición de campos
  const [editTel, setEditTel] = useState(false);
  const [telefono, setTelefono] = useState('');
  const [savingTel, setSavingTel] = useState(false);

  const [editNombre, setEditNombre] = useState(false);
  const [nombre, setNombre] = useState('');
  const [savingNombre, setSavingNombre] = useState(false);

  const [toast, setToast] = useState<string | null>(null);

  // Cargar datos
  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        // Perfil del usuario
        const r = await fetch(`${BASE}/auth/perfil`, { headers: HDR() });
        if (r.ok) {
          const d = await r.json();
          const u = d.usuario ?? d;
          setPerfil(u);
          setTelefono(u.telefono || '');
          setNombre(u.nombre_completo || '');
        }
        // Bodegas del usuario
        const rb = await fetch(`${BASE}/mis-bodegas`, { headers: HDR() });
        if (rb.ok) {
          const db = await rb.json();
          setBodegas(db.bodegas ?? db ?? []);
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    cargar();
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function guardarTelefono() {
    setSavingTel(true);
    try {
      const r = await fetch(`${BASE}/auth/perfil`, {
        method: 'PATCH',
        headers: HDR(),
        body: JSON.stringify({ telefono }),
      });
      if (r.ok) {
        setPerfil(prev => prev ? { ...prev, telefono } : prev);
        setEditTel(false);
        showToast('Teléfono actualizado');
      } else {
        showToast('Error al guardar. Intenta de nuevo.');
      }
    } finally { setSavingTel(false); }
  }

  async function guardarNombre() {
    if (!nombre.trim()) return;
    setSavingNombre(true);
    try {
      const r = await fetch(`${BASE}/auth/perfil`, {
        method: 'PATCH',
        headers: HDR(),
        body: JSON.stringify({ nombre_completo: nombre.trim().toUpperCase() }),
      });
      if (r.ok) {
        setPerfil(prev => prev ? { ...prev, nombre_completo: nombre.trim().toUpperCase() } : prev);
        setEditNombre(false);
        showToast('Nombre actualizado');
      } else {
        showToast('Error al guardar. Intenta de nuevo.');
      }
    } finally { setSavingNombre(false); }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = (perfil?.nombre_completo || user?.nombre_completo || 'U')
    .split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();

  const rolLabel = (perfil?.rol || user?.rol || 'bodega');
  const rolDisplay = rolLabel === 'bodega' ? 'Bodega' : rolLabel === 'industria' ? 'Industria' : rolLabel.charAt(0).toUpperCase() + rolLabel.slice(1);

  const fechaRegistro = perfil?.created_at
    ? new Date(perfil.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const SEMAFORO_COLOR: Record<string, string> = {
    comprando: 'bg-green-100 text-green-700',
    pausado: 'bg-amber-100 text-amber-700',
    sin_actividad: 'bg-gray-100 text-gray-500',
    rojo: 'bg-red-100 text-red-700',
    amarillo: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="bg-[#F2F2F7] min-h-screen pb-8">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-gray-900/90 text-white text-sm font-medium px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-md animate-fade-in-down">
          {toast}
        </div>
      )}

      {/* Banner header */}
      <PageBanner
        title="Mi Perfil"
        subtitle={rolDisplay}
        back="/dashboard"
      />

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">

        {loading ? (
          <div className="flex justify-center pt-16"><Spinner /></div>
        ) : (
          <>
            {/* Avatar card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1A5C38] to-[#2d7a52] flex items-center justify-center flex-shrink-0 shadow-md">
                <span className="text-white text-[22px] font-black">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[17px] font-bold text-gray-900 leading-tight truncate">{perfil?.nombre_completo || user?.nombre_completo || '—'}</p>
                <p className="text-[13px] text-gray-500 mt-0.5 truncate">{perfil?.email || user?.email || '—'}</p>
                <span className="inline-block mt-1.5 bg-[#1A5C38]/10 text-[#1A5C38] text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize">
                  {rolDisplay}
                </span>
              </div>
            </div>

            {/* Datos personales */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-4">Datos de cuenta</p>

              {/* Nombre */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-gray-500">
                    <User size={14} />
                    <span className="text-xs font-medium">Nombre completo</span>
                  </div>
                  <button onClick={() => { setEditNombre(!editNombre); setNombre(perfil?.nombre_completo || ''); }} className="text-[#1A5C38] active:opacity-60">
                    {editNombre ? <X size={14} /> : <Edit2 size={14} />}
                  </button>
                </div>
                {editNombre ? (
                  <div className="flex gap-2 mt-2">
                    <input
                      value={nombre}
                      onChange={e => setNombre(e.target.value)}
                      placeholder="Tu nombre completo"
                      className="flex-1 border-2 border-[#1A5C38]/30 focus:border-[#1A5C38] rounded-xl px-3 py-2 text-sm outline-none transition-colors"
                    />
                    <button
                      onClick={guardarNombre}
                      disabled={savingNombre}
                      className="flex items-center gap-1 bg-[#1A5C38] text-white px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-60 active:scale-95 transition-all"
                    >
                      {savingNombre ? <Spinner /> : <Check size={14} />}
                    </button>
                  </div>
                ) : (
                  <p className="text-[15px] font-medium text-gray-800">{perfil?.nombre_completo || '—'}</p>
                )}
              </div>

              <div className="h-px bg-gray-100 my-3" />

              {/* Email */}
              <div className="mb-4">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Mail size={14} />
                  <span className="text-xs font-medium">Correo electrónico</span>
                </div>
                <p className="text-[15px] font-medium text-gray-800">{perfil?.email || '—'}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Para cambiar el correo, contacta al administrador</p>
              </div>

              <div className="h-px bg-gray-100 my-3" />

              {/* Teléfono */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Phone size={14} />
                    <span className="text-xs font-medium">Teléfono</span>
                  </div>
                  <button onClick={() => { setEditTel(!editTel); setTelefono(perfil?.telefono || ''); }} className="text-[#1A5C38] active:opacity-60">
                    {editTel ? <X size={14} /> : <Edit2 size={14} />}
                  </button>
                </div>
                {editTel ? (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={telefono}
                      onChange={e => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10 dígitos"
                      className="flex-1 border-2 border-[#1A5C38]/30 focus:border-[#1A5C38] rounded-xl px-3 py-2 text-sm outline-none transition-colors"
                    />
                    <button
                      onClick={guardarTelefono}
                      disabled={savingTel || telefono.length < 10}
                      className="flex items-center gap-1 bg-[#1A5C38] text-white px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 active:scale-95 transition-all"
                    >
                      {savingTel ? <Spinner /> : <Check size={14} />}
                    </button>
                  </div>
                ) : (
                  <p className="text-[15px] font-medium text-gray-800">{perfil?.telefono || 'Sin teléfono'}</p>
                )}
              </div>
            </div>

            {/* Info adicional */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-4">Información del sistema</p>

              <div className="space-y-3">
                {fechaRegistro && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar size={14} />
                      <span className="text-xs font-medium">Miembro desde</span>
                    </div>
                    <span className="text-sm text-gray-700 font-medium">{fechaRegistro}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-500">
                    <ShieldCheck size={14} />
                    <span className="text-xs font-medium">Rol</span>
                  </div>
                  <span className="text-sm text-gray-700 font-medium capitalize">{rolDisplay}</span>
                </div>
              </div>
            </div>

            {/* Mis bodegas */}
            {bodegas.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Mis bodegas</p>
                  <button onClick={() => navigate('/mis-bodegas')} className="text-[#1A5C38] text-xs font-semibold flex items-center gap-0.5">
                    Ver todas <ChevronRight size={13} />
                  </button>
                </div>
                <div className="space-y-2">
                  {bodegas.slice(0, 3).map(b => (
                    <button
                      key={b.bodega_id}
                      onClick={() => navigate(`/bodegas/${b.bodega_id}`)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#F2F2F7] hover:bg-gray-100 active:scale-[0.98] transition-all text-left"
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#1A5C38]/10 flex items-center justify-center flex-shrink-0">
                        <Warehouse size={16} className="text-[#1A5C38]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{b.nombre}</p>
                        <p className="text-xs text-gray-400 truncate">{b.municipio}, {b.estado}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SEMAFORO_COLOR[b.semaforo_compra] || 'bg-gray-100 text-gray-500'}`}>
                        {b.semaforo_compra?.replace('_', ' ') || 'N/A'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Acciones */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button
                onClick={() => navigate('/configuracion')}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100"
              >
                <div className="w-9 h-9 rounded-xl bg-[#F2F2F7] flex items-center justify-center flex-shrink-0">
                  <Building2 size={16} className="text-[#1A5C38]" />
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-medium text-gray-800">Configuración</p>
                  <p className="text-xs text-gray-400">Cambiar contraseña y preferencias</p>
                </div>
                <ChevronRight size={15} className="text-gray-300" />
              </button>
            </div>

            {/* Cerrar sesión */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-red-50 border border-red-100 text-red-600 rounded-2xl py-4 text-[15px] font-semibold active:bg-red-100 transition-colors"
            >
              <LogOut size={18} />
              Cerrar sesión
            </button>

            <div className="pb-4" />
          </>
        )}
      </div>
    </div>
  );
}
