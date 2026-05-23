import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, X, MapPin, CheckCircle, ChevronLeft } from 'lucide-react';
import { api } from '../services/api';

interface Bodega { id: number; nombre: string; municipio: string; estado: string; capacidad_ton: number; }

export default function B03SelectBodegas() {
  const [query, setQuery] = useState('');
  const [estado, setEstado] = useState('');
  const [results, setResults] = useState<Bodega[]>([]);
  const [selected, setSelected] = useState<Bodega[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [states, setStates] = useState<any[]>([]);
  const navigate = useNavigate();

  async function search(q = query, est = estado) {
    setLoading(true);
    try {
      const res = await api.bodegas.list({ q, estado: est });
      setResults((res.bodegas || res).slice(0, 30));
    } catch { /* ignore */ } finally { setLoading(false); }
  }

  useEffect(() => {
    api.auth.states().then((r: any) => setStates(r.states || r)).catch(() => {});
    search('', '');
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query, estado), 400);
    return () => clearTimeout(t);
  }, [query, estado]);

  function toggle(b: Bodega) {
    setSelected(s =>
      s.some(x => x.id === b.id) ? s.filter(x => x.id !== b.id) : [...s, b]
    );
  }

  async function continuar() {
    if (selected.length === 0) return;
    setSaving(true);
    setError('');
    const failed: string[] = [];
    for (const b of selected) {
      try {
        await api.bodeguero.solicitar(b.id);
      } catch (err: any) {
        failed.push(`${b.nombre}: ${err.message}`);
      }
    }
    setSaving(false);
    if (failed.length > 0) {
      setError(failed.join('\n'));
      return;
    }
    navigate('/mis-bodegas');
  }

  return (
    <div className="min-h-dvh bg-[#F2F2F7] flex flex-col overflow-x-hidden">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#1A5C38] px-4 pt-safe-top pb-4">
        <div className="flex items-center gap-2 mb-4 pt-3">
          <button onClick={() => navigate('/login')}
            className="text-white/80 flex items-center gap-0.5 active:opacity-60 transition-opacity">
            <ChevronLeft size={20} strokeWidth={2.5} className="-ml-1" />
            <span className="text-[15px] font-medium">Volver</span>
          </button>
        </div>
        <h1 className="text-[22px] font-bold text-white">Selecciona tus bodegas</h1>
        <p className="text-green-200 text-[14px] mt-0.5">Busca en el catálogo nacional</p>
      </div>

      {/* Chips seleccionadas */}
      {selected.length > 0 && (
        <div className="bg-white border-b border-gray-100 px-4 py-3">
          <p className="text-[13px] font-semibold text-[#1A5C38] mb-2">
            Seleccionadas ({selected.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {selected.map(b => (
              <span key={b.id} className="bg-[#1A5C38]/10 text-[#1A5C38] text-[13px] font-medium rounded-full px-3 py-1 flex items-center gap-1.5">
                {b.nombre}
                <button onClick={() => toggle(b)} className="text-[#1A5C38]/60 active:text-red-500">
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 px-4 sm:px-6 pt-4 pb-32 space-y-3 max-w-2xl mx-auto w-full">
        {/* Filtros */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 text-gray-400" size={17} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar bodega…"
              className="w-full bg-white pl-10 pr-4 py-3.5 rounded-xl text-[15px] outline-none focus:ring-2 focus:ring-[#1A5C38]/30 border border-black/5 shadow-sm"
            />
          </div>
          <select
            value={estado}
            onChange={e => setEstado(e.target.value)}
            className="bg-white rounded-xl px-3 py-3.5 text-[14px] outline-none focus:ring-2 focus:ring-[#1A5C38]/30 border border-black/5 shadow-sm min-w-0 max-w-28"
          >
            <option value="">Estado</option>
            {states.map((s: any) => <option key={s.state_id} value={s.name}>{s.name}</option>)}
          </select>
        </div>

        {/* Resultados */}
        {loading && <p className="text-center text-[14px] text-gray-400 py-4">Buscando…</p>}
        <div className="space-y-2">
          {results.map(b => {
            const isSelected = selected.some(x => x.id === b.id);
            return (
              <div key={b.id} className={`bg-white rounded-2xl border p-4 flex items-center gap-3 shadow-sm transition-all
                ${isSelected ? 'border-[#1A5C38]/40' : 'border-black/5'}`}>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[15px] text-gray-900 truncate">{b.nombre}</p>
                  <p className="text-[13px] text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={11} />{b.municipio}, {b.estado}
                    {b.capacidad_ton > 0 && ` · ${b.capacidad_ton.toLocaleString()} ton`}
                  </p>
                </div>
                <button
                  onClick={() => toggle(b)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0
                    ${isSelected ? 'bg-[#1A5C38] text-white' : 'bg-[#F2F2F7] text-gray-500'}`}
                >
                  {isSelected ? <CheckCircle size={18} /> : <Plus size={18} />}
                </button>
              </div>
            );
          })}
        </div>

        {/* Leyenda F-07 */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-2">
          <p className="text-[13px] text-amber-800 font-medium">¿Tu bodega no aparece en la lista?</p>
          <p className="text-[12px] text-amber-700 mt-1">
            Contacta al administrador del sistema para que registre tu bodega en el catálogo nacional.
            Una vez registrada podrás asociarla a tu cuenta desde aquí.
          </p>
        </div>

        {/* Continuar sin seleccionar bodega */}
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full text-[15px] text-gray-400 font-medium py-2 active:opacity-70 transition-opacity"
        >
          Continuar sin asociar bodega por ahora
        </button>
      </div>

      {/* Botón continuar fijo abajo */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200/50 px-4 py-3 pb-safe">
        <div className="max-w-2xl mx-auto space-y-2">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <p className="text-[12px] text-red-600 whitespace-pre-line">{error}</p>
            </div>
          )}
          <button
            onClick={continuar}
            disabled={selected.length === 0 || saving}
            className="w-full bg-[#1A5C38] text-white rounded-2xl py-4 text-[17px] font-semibold active:opacity-80 transition-opacity disabled:opacity-40"
          >
            {saving ? 'Guardando…' : `Asociar ${selected.length} bodega${selected.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
