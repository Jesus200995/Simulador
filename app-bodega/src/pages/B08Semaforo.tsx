import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/Layout';
import { api } from '../services/api';

type Sem = 'verde' | 'amarillo' | 'rojo';

const OPTIONS: { key: Sem; emoji: string; label: string; desc: string; bg: string; border: string }[] = [
  { key: 'verde', emoji: '🟢', label: 'Estoy comprando maíz esta semana', desc: 'Visible para productores', bg: 'bg-green-50', border: 'border-green-500' },
  { key: 'amarillo', emoji: '🟡', label: 'Comprando con capacidad limitada', desc: 'Espacio limitado disponible', bg: 'bg-yellow-50', border: 'border-yellow-500' },
  { key: 'rojo', emoji: '🔴', label: 'No estoy comprando esta semana', desc: 'Sin compras por ahora', bg: 'bg-red-50', border: 'border-red-500' },
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
    <div className="max-w-lg mx-auto">
      <PageHeader title="Estado de Compra" back={`/bodegas/${id}`} />

      <div className="px-4 py-6 space-y-3">
        <p className="text-sm text-gray-500 text-center mb-4">
          Este estado es visible para los productores que buscan dónde vender su maíz
        </p>

        {OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setSelected(opt.key)}
            className={`w-full p-5 rounded-xl border-2 text-left transition-all
              ${selected === opt.key ? `${opt.bg} ${opt.border}` : 'bg-white border-gray-200 hover:border-gray-300'}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{opt.emoji}</span>
              <div>
                <p className="font-bold text-gray-900">{opt.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
              </div>
            </div>
          </button>
        ))}

        <button
          onClick={guardar}
          disabled={saving}
          className="w-full mt-4 bg-[#1A5C38] text-white py-3 rounded-xl font-semibold disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}
