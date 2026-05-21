import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/Layout';
import { api } from '../services/api';

type Sem = 'verde' | 'amarillo' | 'rojo';

const OPTIONS: { key: Sem; emoji: string; label: string; desc: string; activeBg: string; activeBorder: string }[] = [
  { key: 'verde', emoji: '🟢', label: 'Estoy comprando maíz esta semana', desc: 'Visible para productores', activeBg: 'bg-green-50', activeBorder: 'border-green-500' },
  { key: 'amarillo', emoji: '🟡', label: 'Comprando con capacidad limitada', desc: 'Espacio limitado disponible', activeBg: 'bg-yellow-50', activeBorder: 'border-yellow-500' },
  { key: 'rojo', emoji: '🔴', label: 'No estoy comprando esta semana', desc: 'Sin compras por ahora', activeBg: 'bg-red-50', activeBorder: 'border-red-500' },
];

export default function B08Semaforo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Sem>('verde');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.bodegas.get(Number(id))
      .then((r: any) => setSelected(r.bodega?.semaforo_compra || 'verde'))
      .catch(() => {});
  }, [id]);

  async function guardar() {
    setSaving(true);
    try {
      await api.bodegas.semaforo(Number(id), selected);
      navigate(-1);
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="max-w-2xl mx-auto overflow-x-hidden">
      <PageHeader title="Estado de Compra" back={`/bodegas/${id}`} />

      <div className="px-4 sm:px-6 py-6 space-y-3">
        <p className="text-[15px] text-gray-500 text-center mb-2">
          Este estado es visible para los productores que buscan dónde vender su maíz
        </p>

        {OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setSelected(opt.key)}
            className={`w-full p-5 rounded-2xl border-2 text-left transition-all active:scale-[0.98]
              ${selected === opt.key
                ? `${opt.activeBg} ${opt.activeBorder}`
                : 'bg-white border-gray-200/80 shadow-sm'}`}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl flex-shrink-0">{opt.emoji}</span>
              <div>
                <p className="font-bold text-[16px] text-gray-900">{opt.label}</p>
                <p className="text-[13px] text-gray-500 mt-0.5">{opt.desc}</p>
              </div>
            </div>
          </button>
        ))}

        <button
          onClick={guardar}
          disabled={saving}
          className="w-full mt-2 bg-[#1A5C38] text-white rounded-2xl py-4 text-[17px] font-semibold active:opacity-80 transition-opacity disabled:opacity-40"
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}
