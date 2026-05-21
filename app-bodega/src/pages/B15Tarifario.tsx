import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageHeader } from '../components/Layout';
import { api } from '../services/api';

export default function B15Tarifario() {
  const [bodegas, setBodegas] = useState<any[]>([]);
  const [bodegaId, setBodegaId] = useState('');
  const [conceptos, setConceptos] = useState<any[]>([]);
  const [tarifas, setTarifas] = useState<any[]>([]);
  const [editando, setEditando] = useState<number | null>(null);
  const [precio, setPrecio] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.bodeguero.misBodegas().then((r: any) => setBodegas(r)).catch(() => {});
    api.conceptos.list().then((r: any) => setConceptos(r)).catch(() => {});
  }, []);

  useEffect(() => {
    if (bodegaId) {
      api.tarifario.get(Number(bodegaId)).then((r: any) => setTarifas(r)).catch(() => {});
    }
  }, [bodegaId]);

  const iconMap: Record<string, string> = { truck: '🚛', scale: '⚖️', wind: '💨', sun: '☀️', box: '📦', shield: '🛡️', package: '📦' };

  function getTarifa(conceptoId: number) {
    return tarifas.find(t => t.concepto_id === conceptoId);
  }

  async function guardar(conceptoId: number) {
    if (!precio || !bodegaId) return;
    setSaving(true);
    try {
      const existente = getTarifa(conceptoId);
      if (existente) {
        await api.tarifario.update(Number(bodegaId), existente.id, { precio });
      } else {
        await api.tarifario.create(Number(bodegaId), { concepto_id: conceptoId, precio });
      }
      const r: any = await api.tarifario.get(Number(bodegaId));
      setTarifas(r);
      setEditando(null);
      setPrecio('');
    } catch (err: any) {
      alert(err.message);
    } finally { setSaving(false); }
  }

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader title="Tarifario de Servicios" subtitle="Precios que ofreces en tu bodega" />

      <div className="px-4 py-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bodega</label>
          <select value={bodegaId} onChange={e => setBodegaId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]">
            <option value="">Selecciona bodega</option>
            {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </select>
        </div>

        {bodegaId && (
          <div className="space-y-2">
            {conceptos.map(c => {
              const tarifa = getTarifa(c.id);
              const isEdit = editando === c.id;
              return (
                <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{iconMap[c.icono] || '📋'}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900">{c.nombre}</p>
                      <p className="text-xs text-gray-400">{c.unidad_default}</p>
                    </div>
                    <div className="text-right">
                      {tarifa ? (
                        <p className="font-bold text-[#1A5C38]">${Number(tarifa.precio).toLocaleString()}</p>
                      ) : (
                        <p className="text-xs text-gray-400">Sin precio</p>
                      )}
                      <button
                        onClick={() => { setEditando(isEdit ? null : c.id); setPrecio(tarifa?.precio || ''); }}
                        className="text-xs text-[#1A5C38] font-semibold hover:underline"
                      >
                        {isEdit ? 'Cancelar' : tarifa ? 'Editar' : 'Agregar'}
                      </button>
                    </div>
                  </div>
                  {isEdit && (
                    <div className="flex gap-2 mt-3">
                      <input
                        type="number" value={precio} onChange={e => setPrecio(e.target.value)}
                        placeholder={`Precio en ${c.unidad_default}`}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]"
                      />
                      <button onClick={() => guardar(c.id)} disabled={saving}
                        className="bg-[#1A5C38] text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60">
                        {saving ? '…' : 'Guardar'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <button onClick={() => navigate('/tarifario/proponer')}
          className="w-full text-sm text-[#1A5C38] font-semibold border border-dashed border-[#1A5C38] rounded-xl py-3 hover:bg-green-50">
          <Plus size={14} className="inline mr-1" />
          Proponer nuevo servicio
        </button>
      </div>
    </div>
  );
}
