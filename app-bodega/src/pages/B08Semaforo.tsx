import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageBanner } from '../components/Layout';
import { api } from '../services/api';
import { CheckCircle2 } from 'lucide-react';
import { useToast } from '../components/Toast';

type Sem = 'verde' | 'amarillo' | 'rojo';

const OPTIONS: { key: Sem; dotColor: string; label: string; desc: string; activeBg: string; activeBorder: string; activeText: string }[] = [
  { key: 'verde',    dotColor: 'bg-emerald-500', label: 'Comprando esta semana',          desc: 'Visible para productores en el mapa', activeBg: 'bg-emerald-50', activeBorder: 'border-emerald-400', activeText: 'text-emerald-700' },
  { key: 'amarillo', dotColor: 'bg-amber-400',   label: 'Comprando con capacidad limitada', desc: 'Espacio reducido disponible',          activeBg: 'bg-amber-50',   activeBorder: 'border-amber-400',   activeText: 'text-amber-700' },
  { key: 'rojo',     dotColor: 'bg-red-500',     label: 'No compro esta semana',           desc: 'Sin compras por el momento',          activeBg: 'bg-red-50',     activeBorder: 'border-red-400',     activeText: 'text-red-700' },
];

export default function B08Semaforo() {
  const { toast } = useToast();
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
    } catch (err: any) { toast(err.message, 'error'); }
    finally { setSaving(false); }
  }

  return (
    <div className="w-full">
      <PageBanner title="Estado de Compra" subtitle="Visible para productores" back={`/bodegas/${id}`} />

      <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 space-y-3">
        <p className="text-[14px] text-gray-400 text-center mb-4">
          Indica si tu bodega está comprando maíz esta semana
        </p>

        {OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setSelected(opt.key)}
            className={`w-full p-5 rounded-2xl border-2 text-left transition-all active:scale-[0.98]
              ${selected === opt.key ? `${opt.activeBg} ${opt.activeBorder}` : 'bg-white border-gray-200/60 shadow-[0_1px_4px_rgba(0,0,0,0.06)]'}`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-4 h-4 rounded-full flex-shrink-0 ${opt.dotColor} shadow-sm`} />
              <div className="flex-1">
                <p className={`font-bold text-[15px] ${selected === opt.key ? opt.activeText : 'text-gray-900'}`}>{opt.label}</p>
                <p className="text-[12px] text-gray-400 mt-0.5">{opt.desc}</p>
              </div>
              {selected === opt.key && <CheckCircle2 size={20} className={opt.activeText} />}
            </div>
          </button>
        ))}

        <button
          onClick={guardar}
          disabled={saving}
          className="w-full mt-2 bg-[#1A5C38] text-white rounded-2xl py-4 text-[17px] font-semibold active:opacity-80 transition-opacity disabled:opacity-40"
        >
          {saving ? 'Guardando…' : 'Guardar estado'}
        </button>
      </div>
    </div>
  );
}
