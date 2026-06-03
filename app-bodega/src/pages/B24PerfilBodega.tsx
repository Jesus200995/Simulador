import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Edit2, Check, X, User, Mail, Phone, Warehouse,
  LogOut, ShieldCheck, Calendar, ChevronRight, Building2,
  MapPin, AlertTriangle, CreditCard
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { PageBanner } from '../components/Layout';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const HDR = () => ({ Authorization: `Bearer ${localStorage.getItem('simac_token')}`, 'Content-Type': 'application/json' });

// Quita tildes y pasa a mayúsculas
function normalizar(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

interface PerfilBodega {
  id: number;
  email: string;
  nombre_completo: string;
  telefono: string;
  rol: string;
  curp: string | null;
  state_id: string | null;
  municipality_id: string | null;
  created_at: string;
}

interface BodegaInfo {
  bodega_id: number;
  nombre: string;
  municipio: string;
  estado: string;
  semaforo_compra: string;
}

interface GeoState  { state_id: string; name: string; }
interface GeoMuni   { municipality_id: string; name: string; }

function Spinner({ small = false }: { small?: boolean }) {
  const sz = small ? 'w-4 h-4 border-[1.5px]' : 'w-6 h-6 border-2';
  return <div className={`${sz} border-[#1A5C38]/20 border-t-[#1A5C38] rounded-full animate-spin`} />;
}

// ─── Modal de confirmación genérico ──────────────────────────────────────────
function ConfirmModal({
  title, body, warning, onConfirm, onCancel, loading,
}: {
  title: string; body: string; warning?: string;
  onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center px-4 pb-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      {/* Sheet */}
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Icon */}
        <div className="flex flex-col items-center px-6 pt-7 pb-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mb-4 shadow-inner">
            <AlertTriangle size={26} className="text-amber-600" />
          </div>
          <h2 className="text-[18px] font-black text-gray-900 text-center leading-snug">{title}</h2>
          <p className="text-[13px] text-gray-500 text-center mt-2 leading-relaxed">{body}</p>
          {warning && (
            <p className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-3 text-center leading-snug">
              {warning}
            </p>
          )}
        </div>
        <div className="px-5 pb-6 pt-4 flex flex-col gap-2">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#1A5C38] text-white py-3.5 rounded-2xl text-[15px] font-bold active:scale-[0.98] transition-all disabled:opacity-60 shadow-[0_4px_14px_rgba(26,92,56,0.3)]"
          >
            {loading ? <><Spinner small /> Guardando...</> : 'Sí, actualizar'}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl text-[15px] font-semibold text-gray-600 bg-gray-100 active:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal edición CURP ───────────────────────────────────────────────────────
function ModalCURP({ curpActual, onSave, onClose }: {
  curpActual: string; onSave: (curp: string) => Promise<void>; onClose: () => void;
}) {
  const [valor, setValor] = useState(curpActual);
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const CURP_RE = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
  const limpio = normalizar(valor.replace(/\s/g, '')).slice(0, 18);
  const valido = CURP_RE.test(limpio);

  async function handleConfirm() {
    setLoading(true);
    try { await onSave(limpio); } catch { setError('Error al guardar'); }
    finally { setLoading(false); }
  }

  if (confirm) {
    return (
      <ConfirmModal
        title="¿Actualizar tu CURP?"
        body={`La nueva CURP será: ${limpio}`}
        warning="Este cambio es importante para tu identificación en el sistema. Asegúrate de que sea correcta."
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(false)}
        loading={loading}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center px-4 pb-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#1A5C38]/10 flex items-center justify-center">
                <CreditCard size={18} className="text-[#1A5C38]" />
              </div>
              <h2 className="text-[17px] font-black text-gray-900">Actualizar CURP</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 active:bg-gray-200">
              <X size={16} />
            </button>
          </div>

          <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-2">CURP (18 caracteres)</label>
          <input
            value={limpio}
            onChange={e => { setValor(normalizar(e.target.value)); setError(''); }}
            maxLength={18}
            placeholder="XEXX000000HXXXXXX0"
            className={`w-full font-mono text-[16px] tracking-widest border-2 rounded-2xl px-4 py-3.5 outline-none transition-colors
              ${error ? 'border-red-400 bg-red-50'
              : valido ? 'border-[#1A5C38] bg-green-50'
              : 'border-gray-200 focus:border-[#1A5C38]'}`}
          />

          {/* Indicador de formato */}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-400">Formato: XEXX000000HXXXXXX0</span>
            <span className={`text-xs font-bold ${limpio.length === 18 ? (valido ? 'text-green-600' : 'text-red-500') : 'text-gray-400'}`}>
              {limpio.length}/18 {valido ? '✓' : ''}
            </span>
          </div>

          {error && <p className="text-xs text-red-600 mt-2 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

          <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
            Solo letras A-Z (sin tildes) y números. Se convierte automáticamente a mayúsculas.
          </p>
        </div>

        <div className="px-5 pb-6 flex flex-col gap-2">
          <button
            onClick={() => { setError(''); if (!valido) { setError('CURP inválida. Verifica el formato.'); return; } setConfirm(true); }}
            className="w-full bg-[#1A5C38] text-white py-3.5 rounded-2xl text-[15px] font-bold active:scale-[0.98] transition-all shadow-[0_4px_14px_rgba(26,92,56,0.25)] disabled:opacity-50"
          >
            Continuar
          </button>
          <button onClick={onClose} className="w-full py-3.5 rounded-2xl text-[15px] font-semibold text-gray-600 bg-gray-100 active:bg-gray-200 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal edición Estado + Municipio ────────────────────────────────────────
function ModalUbicacion({ stateIdActual, muniIdActual, onSave, onClose }: {
  stateIdActual: string | null; muniIdActual: string | null;
  onSave: (stateId: string, muniId: string, stateNombre: string, muniNombre: string) => Promise<void>;
  onClose: () => void;
}) {
  const [estados, setEstados] = useState<GeoState[]>([]);
  const [munis, setMunis]     = useState<GeoMuni[]>([]);
  const [stateId, setStateId] = useState<string | null>(stateIdActual);
  const [muniId, setMuniId]   = useState<string | null>(muniIdActual);
  const [loadingE, setLoadingE] = useState(true);
  const [loadingM, setLoadingM] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving]   = useState(false);

  // Cargar estados
  useEffect(() => {
    fetch(`${BASE}/auth/states`, { headers: HDR() })
      .then(r => r.json())
      .then(d => setEstados(d.states ?? d ?? []))
      .finally(() => setLoadingE(false));
  }, []);

  // Cargar municipios cuando cambia estado
  useEffect(() => {
    if (!stateId) { setMunis([]); return; }
    setLoadingM(true);
    setMuniId(null);
    fetch(`${BASE}/auth/municipalities?state_id=${stateId}`, { headers: HDR() })
      .then(r => r.json())
      .then(d => setMunis(d.municipalities ?? d ?? []))
      .finally(() => setLoadingM(false));
  }, [stateId]);

  const stateNombre = estados.find(e => e.state_id === stateId)?.name ?? '';
  const muniNombre  = munis.find(m => m.municipality_id === muniId)?.name ?? '';

  async function handleConfirm() {
    if (!stateId || !muniId) return;
    setSaving(true);
    try { await onSave(stateId, muniId, stateNombre, muniNombre); } finally { setSaving(false); }
  }

  if (confirm) {
    return (
      <ConfirmModal
        title="¿Actualizar tu ubicación?"
        body={`Estado: ${stateNombre}\nMunicipio: ${muniNombre}`}
        warning="Asegúrate de seleccionar la ubicación correcta antes de confirmar."
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(false)}
        loading={saving}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center px-4 pb-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#1A5C38]/10 flex items-center justify-center">
                <MapPin size={18} className="text-[#1A5C38]" />
              </div>
              <h2 className="text-[17px] font-black text-gray-900">Actualizar ubicación</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 active:bg-gray-200">
              <X size={16} />
            </button>
          </div>

          {/* Estado */}
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-2">Estado</label>
          {loadingE ? (
            <div className="flex justify-center py-4"><Spinner /></div>
          ) : (
            <select
              value={stateId ?? ''}
              onChange={e => setStateId(e.target.value || null)}
              className="w-full border-2 border-gray-200 focus:border-[#1A5C38] rounded-2xl px-4 py-3 text-sm outline-none transition-colors bg-white appearance-none"
            >
              <option value="">— Selecciona un estado —</option>
              {estados.map(e => (
                <option key={e.state_id} value={e.state_id}>{e.name}</option>
              ))}
            </select>
          )}

          {/* Municipio */}
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mt-4 mb-2">Municipio</label>
          {loadingM ? (
            <div className="flex justify-center py-4"><Spinner /></div>
          ) : (
            <select
              value={muniId ?? ''}
              onChange={e => setMuniId(e.target.value || null)}
              disabled={!stateId || munis.length === 0}
              className="w-full border-2 border-gray-200 focus:border-[#1A5C38] rounded-2xl px-4 py-3 text-sm outline-none transition-colors bg-white appearance-none disabled:opacity-50"
            >
              <option value="">
                {!stateId ? '— Primero selecciona un estado —' : munis.length === 0 ? 'Sin municipios disponibles' : '— Selecciona un municipio —'}
              </option>
              {munis.map(m => (
                <option key={m.municipality_id} value={m.municipality_id}>{m.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 pb-6 pt-2 flex flex-col gap-2 flex-shrink-0">
          <button
            onClick={() => { if (stateId && muniId) setConfirm(true); }}
            disabled={!stateId || !muniId}
            className="w-full bg-[#1A5C38] text-white py-3.5 rounded-2xl text-[15px] font-bold active:scale-[0.98] transition-all shadow-[0_4px_14px_rgba(26,92,56,0.25)] disabled:opacity-40"
          >
            Continuar
          </button>
          <button onClick={onClose} className="w-full py-3.5 rounded-2xl text-[15px] font-semibold text-gray-600 bg-gray-100 active:bg-gray-200 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function B24PerfilBodega() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [perfil, setPerfil]   = useState<PerfilBodega | null>(null);
  const [bodegas, setBodegas] = useState<BodegaInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Campos editables
  const [editTel, setEditTel]       = useState(false);
  const [telefono, setTelefono]     = useState('');
  const [savingTel, setSavingTel]   = useState(false);

  const [editNombre, setEditNombre]     = useState(false);
  const [nombre, setNombre]             = useState('');
  const [savingNombre, setSavingNombre] = useState(false);

  // Modales
  const [showModalCURP, setShowModalCURP]         = useState(false);
  const [showModalUbicacion, setShowModalUbicacion] = useState(false);

  // Nombres de ubicación para mostrar
  const [stateNombre, setStateNombre] = useState('');
  const [muniNombre, setMuniNombre]   = useState('');

  const [toast, setToast] = useState<string | null>(null);

  // Cargar datos
  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        const r = await fetch(`${BASE}/auth/perfil`, { headers: HDR() });
        if (r.ok) {
          const d  = await r.json();
          const u  = d.usuario ?? d;
          setPerfil(u);
          setTelefono(u.telefono || '');
          setNombre(u.nombre_completo || '');
        }
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

  // Cargar nombre estado y municipio cuando perfil carga
  useEffect(() => {
    if (!perfil?.state_id) return;
    fetch(`${BASE}/auth/states`, { headers: HDR() })
      .then(r => r.json())
      .then(d => {
        const st = (d.states ?? d ?? []).find((e: GeoState) => e.state_id === perfil.state_id);
        if (st) setStateNombre(st.name);
      });
    if (!perfil.municipality_id) return;
    fetch(`${BASE}/auth/municipalities?state_id=${perfil.state_id}`, { headers: HDR() })
      .then(r => r.json())
      .then(d => {
        const mn = (d.municipalities ?? d ?? []).find((m: GeoMuni) => m.municipality_id === perfil.municipality_id);
        if (mn) setMuniNombre(mn.name);
      });
  }, [perfil?.state_id, perfil?.municipality_id]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function guardarTelefono() {
    setSavingTel(true);
    try {
      const r = await fetch(`${BASE}/auth/perfil`, {
        method: 'PATCH', headers: HDR(), body: JSON.stringify({ telefono }),
      });
      if (r.ok) { setPerfil(prev => prev ? { ...prev, telefono } : prev); setEditTel(false); showToast('Teléfono actualizado ✓'); }
      else showToast('Error al guardar. Intenta de nuevo.');
    } finally { setSavingTel(false); }
  }

  async function guardarNombre() {
    const clean = normalizar(nombre).trim();
    if (!clean || clean.length < 3) return;
    setSavingNombre(true);
    try {
      const r = await fetch(`${BASE}/auth/perfil`, {
        method: 'PATCH', headers: HDR(), body: JSON.stringify({ nombre_completo: clean }),
      });
      if (r.ok) { setPerfil(prev => prev ? { ...prev, nombre_completo: clean } : prev); setEditNombre(false); showToast('Nombre actualizado ✓'); }
      else showToast('Error al guardar. Intenta de nuevo.');
    } finally { setSavingNombre(false); }
  }

  async function guardarCURP(curp: string) {
    const r = await fetch(`${BASE}/auth/perfil`, {
      method: 'PATCH', headers: HDR(), body: JSON.stringify({ curp }),
    });
    if (!r.ok) throw new Error('Error');
    setPerfil(prev => prev ? { ...prev, curp } : prev);
    setShowModalCURP(false);
    showToast('CURP actualizada ✓');
  }

  async function guardarUbicacion(sid: string, mid: string, sNombre: string, mNombre: string) {
    const r = await fetch(`${BASE}/auth/perfil`, {
      method: 'PATCH', headers: HDR(), body: JSON.stringify({ state_id: sid, municipality_id: mid }),
    });
    if (!r.ok) throw new Error('Error');
    setPerfil(prev => prev ? { ...prev, state_id: sid, municipality_id: mid } : prev);
    setStateNombre(sNombre);
    setMuniNombre(mNombre);
    setShowModalUbicacion(false);
    showToast('Ubicación actualizada ✓');
  }

  function handleLogout() { logout(); navigate('/login'); }

  const initials = (perfil?.nombre_completo || user?.nombre_completo || 'U')
    .split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
  const rolLabel   = perfil?.rol || user?.rol || 'bodega';
  const rolDisplay = rolLabel === 'bodega' ? 'Bodega' : rolLabel === 'industria' ? 'Industria' : rolLabel.charAt(0).toUpperCase() + rolLabel.slice(1);
  const fechaRegistro = perfil?.created_at
    ? new Date(perfil.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

  const SEMAFORO_COLOR: Record<string, string> = {
    comprando: 'bg-green-100 text-green-700', pausado: 'bg-amber-100 text-amber-700',
    sin_actividad: 'bg-gray-100 text-gray-500', rojo: 'bg-red-100 text-red-700', amarillo: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="bg-[#F2F2F7] min-h-screen pb-8">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-gray-900/90 text-white text-sm font-medium px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-md">
          {toast}
        </div>
      )}

      {/* Modales */}
      {showModalCURP && (
        <ModalCURP
          curpActual={perfil?.curp ?? ''}
          onSave={guardarCURP}
          onClose={() => setShowModalCURP(false)}
        />
      )}
      {showModalUbicacion && (
        <ModalUbicacion
          stateIdActual={perfil?.state_id ?? null}
          muniIdActual={perfil?.municipality_id ?? null}
          onSave={guardarUbicacion}
          onClose={() => setShowModalUbicacion(false)}
        />
      )}

      <PageBanner title="Mi Perfil" subtitle={rolDisplay} back="/dashboard" />

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

            {/* ── Datos de cuenta ─────────────────────────────────── */}
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
                  <div className="mt-2 space-y-2">
                    <input
                      value={nombre}
                      onChange={e => setNombre(normalizar(e.target.value))}
                      placeholder="TU NOMBRE COMPLETO"
                      maxLength={80}
                      style={{ textTransform: 'uppercase' }}
                      className="w-full border-2 border-[#1A5C38]/30 focus:border-[#1A5C38] rounded-xl px-3 py-2 text-sm outline-none transition-colors tracking-wide"
                    />
                    <p className="text-[10px] text-gray-400">Solo letras mayúsculas, sin tildes ni caracteres especiales</p>
                    <button
                      onClick={guardarNombre}
                      disabled={savingNombre || nombre.trim().length < 3}
                      className="flex items-center gap-1.5 bg-[#1A5C38] text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 active:scale-95 transition-all"
                    >
                      {savingNombre ? <Spinner small /> : <Check size={14} />} Guardar nombre
                    </button>
                  </div>
                ) : (
                  <p className="text-[15px] font-medium text-gray-800">{perfil?.nombre_completo || '—'}</p>
                )}
              </div>

              <div className="h-px bg-gray-100 my-3" />

              {/* Email (no editable) */}
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
              <div className="mb-4">
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
                      type="tel" inputMode="numeric" value={telefono} maxLength={10}
                      onChange={e => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10 dígitos"
                      className="flex-1 border-2 border-[#1A5C38]/30 focus:border-[#1A5C38] rounded-xl px-3 py-2 text-sm outline-none transition-colors"
                    />
                    <button onClick={guardarTelefono} disabled={savingTel || telefono.length < 10}
                      className="flex items-center gap-1 bg-[#1A5C38] text-white px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 active:scale-95 transition-all">
                      {savingTel ? <Spinner small /> : <Check size={14} />}
                    </button>
                  </div>
                ) : (
                  <p className="text-[15px] font-medium text-gray-800">{perfil?.telefono || 'Sin teléfono'}</p>
                )}
              </div>

              <div className="h-px bg-gray-100 my-3" />

              {/* CURP */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-gray-500">
                    <CreditCard size={14} />
                    <span className="text-xs font-medium">CURP</span>
                  </div>
                  <button onClick={() => setShowModalCURP(true)} className="text-[#1A5C38] active:opacity-60">
                    <Edit2 size={14} />
                  </button>
                </div>
                <p className="text-[15px] font-mono font-medium text-gray-800 tracking-wider">
                  {perfil?.curp || <span className="text-gray-400 font-sans text-sm not-italic">Sin CURP registrada</span>}
                </p>
              </div>

              <div className="h-px bg-gray-100 my-3" />

              {/* Estado / Municipio */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-gray-500">
                    <MapPin size={14} />
                    <span className="text-xs font-medium">Estado / Municipio</span>
                  </div>
                  <button onClick={() => setShowModalUbicacion(true)} className="text-[#1A5C38] active:opacity-60">
                    <Edit2 size={14} />
                  </button>
                </div>
                <p className="text-[15px] font-medium text-gray-800">
                  {stateNombre && muniNombre
                    ? `${muniNombre}, ${stateNombre}`
                    : stateNombre || <span className="text-gray-400 text-sm">Sin ubicación registrada</span>}
                </p>
              </div>
            </div>

            {/* ── Información del sistema ──────────────────────────── */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-4">Información del sistema</p>
              <div className="space-y-3">
                {fechaRegistro && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-500"><Calendar size={14} /><span className="text-xs font-medium">Miembro desde</span></div>
                    <span className="text-sm text-gray-700 font-medium">{fechaRegistro}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-500"><ShieldCheck size={14} /><span className="text-xs font-medium">Rol</span></div>
                  <span className="text-sm text-gray-700 font-medium capitalize">{rolDisplay}</span>
                </div>
              </div>
            </div>

            {/* ── Mis bodegas ──────────────────────────────────────── */}
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
                    <button key={b.bodega_id} onClick={() => navigate(`/bodegas/${b.bodega_id}`)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#F2F2F7] hover:bg-gray-100 active:scale-[0.98] transition-all text-left">
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

            {/* ── Acciones ─────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button onClick={() => navigate('/configuracion')}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors">
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
            <button onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-red-50 border border-red-100 text-red-600 rounded-2xl py-4 text-[15px] font-semibold active:bg-red-100 transition-colors">
              <LogOut size={18} /> Cerrar sesión
            </button>

            <div className="pb-4" />
          </>
        )}
      </div>
    </div>
  );
}
