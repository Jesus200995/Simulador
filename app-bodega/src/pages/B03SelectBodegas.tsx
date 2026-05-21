import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, X, MapPin, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

interface Bodega { id: number; nombre: string; municipio: string; estado: string; capacidad_ton: number; }

export default function B03SelectBodegas() {
  const [query, setQuery] = useState('');
  const [estado, setEstado] = useState('');
  const [results, setResults] = useState<Bodega[]>([]);
  const [selected, setSelected] = useState<Bodega[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [states, setStates] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.auth.states().then((r: any) => setStates(r.states || r)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(), 400);
    return () => clearTimeout(t);
  }, [query, estado]);

  async function search() {
    setLoading(true);
    try {
      const res = await api.bodegas.list({ q: query, estado });
      setResults((res.bodegas || res).slice(0, 20));
    } catch (_) {} finally { setLoading(false); }
  }

  function toggle(b: Bodega) {
    setSelected(s =>
      s.some(x => x.id === b.id) ? s.filter(x => x.id !== b.id) : [...s, b]
    );
  }

  async function continuar() {
    if (selected.length === 0) return;
    setSaving(true);
    try {
      for (const b of selected) {
        await api.bodeguero.solicitar(b.id);
      }
      navigate('/dashboard');
    } catch (err: any) {
      alert(err.message);
    } finally { setSaving(false); }
  }

  return (
    <div className="min-h-svh bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#1A5C38] text-white px-4 pt-10 pb-6">
        <h1 className="text-2xl font-bold">Selecciona las bodegas que operas</h1>
        <p className="text-green-200 text-sm mt-1">Busca en el catálogo nacional</p>
      </div>

      <div className="flex-1 px-4 pt-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Filtros */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar bodega…"
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]"
            />
          </div>
          <select
            value={estado}
            onChange={e => setEstado(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38] max-w-32"
          >
            <option value="">Estado</option>
            {states.map((s: any) => <option key={s.state_id} value={s.name}>{s.name}</option>)}
          </select>
        </div>

        {/* Resultados */}
        <div className="space-y-2">
          {loading && <p className="text-center text-sm text-gray-500 py-4">Buscando…</p>}
          {results.map(b => {
            const isSelected = selected.some(x => x.id === b.id);
            return (
              <div key={b.id} className={`bg-white rounded-xl border p-3 flex items-center gap-3 shadow-sm transition-all
                ${isSelected ? 'border-[#1A5C38]' : 'border-gray-200'}`}>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{b.nombre}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin size={11} />{b.municipio}, {b.estado}
                    {b.capacidad_ton > 0 && ` · ${b.capacidad_ton.toLocaleString()} ton`}
                  </p>
                </div>
                <button
                  onClick={() => toggle(b)}
                  className={`p-2 rounded-lg transition-all ${isSelected
                    ? 'bg-[#1A5C38] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {isSelected ? <CheckCircle size={18} /> : <Plus size={18} />}
                </button>
              </div>
            );
          })}
        </div>

        {/* Seleccionadas */}
        {selected.length > 0 && (
          <div className="bg-green-50 rounded-xl border border-green-200 p-3">
            <p className="text-xs font-semibold text-[#1A5C38] mb-2">Mis bodegas seleccionadas ({selected.length})</p>
            <div className="flex flex-wrap gap-2">
              {selected.map(b => (
                <span key={b.id} className="bg-white border border-green-300 text-green-800 text-xs rounded-full px-3 py-1 flex items-center gap-1">
                  {b.nombre}
                  <button onClick={() => toggle(b)} className="text-green-500 hover:text-red-500">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Mi bodega no está */}
        <button
          onClick={() => navigate('/infraestructura/nueva')}
          className="w-full text-sm text-[#1A5C38] font-semibold border border-dashed border-[#1A5C38] rounded-xl py-3 hover:bg-green-50 transition-colors"
        >
          + Mi bodega no está en la lista
        </button>

        {/* Continuar */}
        <button
          onClick={continuar}
          disabled={selected.length === 0 || saving}
          className="w-full bg-[#1A5C38] text-white py-3 rounded-xl font-semibold text-sm
            disabled:opacity-40 hover:bg-green-900 active:scale-95 transition-all"
        >
          {saving ? 'Guardando…' : `Continuar (${selected.length} bodega${selected.length !== 1 ? 's' : ''})`}
        </button>
      </div>
    </div>
  );
}
