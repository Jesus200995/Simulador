import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Phone, Wheat, MapPin } from 'lucide-react';
import { PageHeader } from '../components/Layout';
import { api } from '../services/api';

interface Interesado {
  id: number;
  nombre: string;
  municipio: string;
  estado: string;
  telefono: string;
  fecha_interes: string;
}

export default function B27InteresadosSenal() {
  const { id } = useParams<{ id: string }>();

  const [interesados, setInteresados] = useState<Interesado[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.senales.interesados(id)
      .then((d: any) => {
        setInteresados(d.interesados || []);
        setTotal(d.total || 0);
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [id]);

  return (
    <div className="w-full pb-10">
      <PageHeader title="Productores interesados" subtitle={`${total} productor${total !== 1 ? 'es' : ''} respondió`} back={-1} />

      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {cargando ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-white/50 rounded-[1.5rem] border border-black/[0.04] animate-pulse" />
            ))}
          </div>
        ) : interesados.length === 0 ? (
          <div className="text-center py-24 bg-white/50 backdrop-blur-sm rounded-[1.5rem] border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="w-20 h-20 bg-[#f4fbf7] rounded-[1.25rem] flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Wheat size={40} className="text-gray-300" />
            </div>
            <p className="text-[17px] text-gray-600 font-bold tracking-tight">Aún no hay productores interesados</p>
            <p className="text-[14px] text-gray-400 mt-1 font-medium">Los productores en tu radio recibirán la notificación</p>
          </div>
        ) : (
          <div className="space-y-4">
            {interesados.map(prod => (
              <div key={prod.id}
                className="bg-white rounded-[1.5rem] shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-black/[0.04] p-5 flex items-center justify-between gap-4 transition-transform duration-500 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 group/card"
              >
                <div className="flex-1 min-w-0 transition-transform duration-500 group-hover/card:translate-x-1">
                  <p className="font-bold text-[16px] text-gray-900 truncate">
                    {prod.nombre || 'Productor registrado'}
                  </p>
                  <p className="text-[13px] font-medium text-gray-500 mt-1 flex items-center gap-1.5">
                    <MapPin size={14} className="text-gray-400" /> {[prod.municipio, prod.estado].filter(Boolean).join(', ') || 'Ubicación no disponible'}
                  </p>
                  <p className="text-[12px] font-medium text-gray-400 mt-1">
                    {new Date(prod.fecha_interes).toLocaleDateString('es-MX', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
                {prod.telefono && (
                  <a href={`tel:${prod.telefono}`}
                    className="flex items-center gap-2 bg-[#1e5b4f] text-white px-5 py-3 rounded-[1.25rem] text-[14px] font-bold active:scale-[0.98] transition-all shadow-[0_4px_12px_rgba(26,92,56,0.2)] hover:shadow-[0_8px_24px_rgba(26,92,56,0.3)] whitespace-nowrap">
                    <Phone size={16} />
                    Llamar
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
