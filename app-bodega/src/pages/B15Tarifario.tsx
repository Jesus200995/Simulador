import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Truck, Scale, Wind, Sun, Package, Shield, Tag } from 'lucide-react';
import { PageBanner } from '../components/Layout';
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

  const iconMap: Record<string, React.ReactNode> = {
    truck: <Truck size={18} />, scale: <Scale size={18} />, wind: <Wind size={18} />,
    sun: <Sun size={18} />, box: <Package size={18} />, shield: <Shield size={18} />, package: <Package size={18} />,
  };

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
    <div className="w-full">
      <PageBanner title="Tarifario de Servicios" subtitle="Precios que ofreces en tu bodega" back="/mas" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        {/* Selector de bodega */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-5">
          <label className="block text-[15px] font-medium text-gray-600 mb-1.5">Bodega</label>
          <select
            value={bodegaId}
            onChange={e => setBodegaId(e.target.value)}
            className="w-full bg-[#F2F2F7] rounded-xl px-4 py-3.5 text-[17px] outline-none focus:ring-2 focus:ring-[#1A5C38]/30 border-0"
          >
            <option value="">Selecciona bodega</option>
            {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </select>
        </div>

        {/* Lista de conceptos */}
        {bodegaId && (
          <div className="bg-white rounded-2xl shadow-sm border border-black/5 divide-y divide-gray-100">
            {conceptos.map(c => {
              const tarifa = getTarifa(c.id);
              const isEdit = editando === c.id;
              return (
                <div key={c.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-[#1A5C38]/[0.08] text-[#1A5C38] flex items-center justify-center flex-shrink-0">{iconMap[c.icono] || <Tag size={18} />}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[15px] text-gray-900">{c.nombre}</p>
                      <p className="text-[12px] text-gray-400">{c.unidad_default}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {tarifa ? (
                        <p className="font-bold text-[16px] text-[#1A5C38]">${Number(tarifa.precio).toLocaleString()}</p>
                      ) : (
                        <p className="text-[13px] text-gray-400">Sin precio</p>
                      )}
                      <button
                        onClick={() => { setEditando(isEdit ? null : c.id); setPrecio(tarifa?.precio || ''); }}
                        className="text-[13px] text-[#1A5C38] font-semibold mt-0.5"
                      >
                        {isEdit ? 'Cancelar' : tarifa ? 'Editar' : 'Agregar'}
                      </button>
                    </div>
                  </div>
                  {isEdit && (
                    <div className="flex gap-2 mt-3">
                      <input
                        type="number"
                        value={precio}
                        onChange={e => setPrecio(e.target.value)}
                        placeholder={`Precio en ${c.unidad_default}`}
                        className="flex-1 bg-[#F2F2F7] rounded-xl px-4 py-3 text-[16px] outline-none focus:ring-2 focus:ring-[#1A5C38]/30 border-0"
                      />
                      <button
                        onClick={() => guardar(c.id)}
                        disabled={saving}
                        className="bg-[#1A5C38] text-white px-5 py-3 rounded-xl text-[15px] font-semibold disabled:opacity-40 active:opacity-80 transition-opacity"
                      >
                        {saving ? '…' : 'Guardar'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={() => navigate('/tarifario/proponer')}
          className="w-full text-[15px] text-[#1A5C38] font-semibold border border-dashed border-[#1A5C38]/40 rounded-2xl py-4 active:opacity-70 transition-opacity flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Proponer nuevo servicio
        </button>
      </div>
    </div>
  );
}
