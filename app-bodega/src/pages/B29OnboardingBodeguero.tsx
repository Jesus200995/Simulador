import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, ChevronRight, ChevronLeft, Tag, Activity, Signal, Warehouse } from 'lucide-react';
import { api } from '../services/api';

interface Paso {
  key: string;
  titulo: string;
  desc: string;
  icon: React.ReactNode;
  ruta: string;
  hecho: boolean;
}

export default function B29OnboardingBodeguero() {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [tieneBodega, setTieneBodega] = useState(false);
  const [tienePrecio, setTienePrecio] = useState(false);
  const [tieneSemaforo, setTieneSemaforo] = useState(false);
  const [tieneRequerimiento, setTieneRequerimiento] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      api.bodeguero.misBodegasEstatus(),
      api.bodeguero.misBodegas(),
      api.home.stats(),
      api.senales.list(),
    ]).then(([estatusR, bodegasR, statsR, senalesR]) => {
      // 1. Bodega asociada (aprobada)
      if (estatusR.status === 'fulfilled') {
        const arr = Array.isArray(estatusR.value) ? estatusR.value : (estatusR.value as any).bodegas || [];
        setTieneBodega(arr.some((b: any) => b.estatus === 'aprobada'));
      }
      // 3. Semáforo activo en alguna bodega
      if (bodegasR.status === 'fulfilled') {
        const arr = Array.isArray(bodegasR.value) ? bodegasR.value : [];
        setTieneSemaforo(arr.some((b: any) => b.semaforo_compra && b.semaforo_compra !== 'sin_actividad'));
      }
      // 2. Primer precio publicado
      if (statsR.status === 'fulfilled') {
        const s = (statsR.value as any).stats || {};
        setTienePrecio((s.ultimo_precio ?? 0) > 0);
      }
      // 4. Primer requerimiento (señal de compra)
      if (senalesR.status === 'fulfilled') {
        const arr = Array.isArray(senalesR.value) ? senalesR.value : [];
        setTieneRequerimiento(arr.length > 0);
      }
    }).finally(() => setCargando(false));
  }, []);

  const pasos: Paso[] = [
    {
      key: 'bodega', titulo: 'Confirma tu bodega asociada',
      desc: 'Asocia la bodega que operas para activar todas las funciones.',
      icon: <Warehouse size={18} />, ruta: '/bodegas/seleccionar', hecho: tieneBodega,
    },
    {
      key: 'precio', titulo: 'Publica tu primer precio diario',
      desc: 'Indica el precio de compra que ofreces hoy a los productores.',
      icon: <Tag size={18} />, ruta: '/precio-diario', hecho: tienePrecio,
    },
    {
      key: 'semaforo', titulo: 'Activa tu semáforo de compra',
      desc: 'Indica si estás comprando, con capacidad limitada o sin actividad.',
      icon: <Activity size={18} />, ruta: '/mis-bodegas', hecho: tieneSemaforo,
    },
    {
      key: 'requerimiento', titulo: 'Publica tu primer requerimiento',
      desc: 'Lanza una señal de compra para que los productores cercanos te encuentren.',
      icon: <Signal size={18} />, ruta: '/requerimientos', hecho: tieneRequerimiento,
    },
  ];

  const completados = pasos.filter(p => p.hecho).length;
  const total = pasos.length;
  const pct = Math.round((completados / total) * 100);

  return (
    <div className="w-full">
      {/* Banner */}
      <div className="w-full bg-gradient-to-br from-[#1A5C38] via-[#1e6b42] to-[#22733f] rounded-b-3xl shadow-[0_4px_20px_rgba(26,92,56,0.25)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-6">
          <button onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1 text-green-200/80 text-[13px] font-medium mb-2 active:opacity-60">
            <ChevronLeft size={16} className="-ml-1" /> Ir al tablero
          </button>
          <p className="text-[11px] font-semibold text-green-300/70 uppercase tracking-widest mb-1">Primeros pasos</p>
          <h1 className="text-[22px] sm:text-[26px] font-black text-white leading-tight">Configura tu cuenta</h1>
          <p className="text-green-200/70 text-[14px] mt-1">
            {completados} de {total} pasos completados
          </p>
          {/* Barra de progreso */}
          <div className="mt-3 bg-white/15 rounded-full h-2 w-full overflow-hidden">
            <div className="h-full bg-[#22c55e] rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-3">
        {cargando ? (
          [1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)
        ) : (
          <>
            {pasos.map((p, i) => (
              <button
                key={p.key}
                onClick={() => navigate(p.ruta)}
                className={`w-full flex items-center gap-4 px-4 py-4 bg-white rounded-2xl border shadow-[0_1px_4px_rgba(0,0,0,0.06)] text-left active:scale-[0.99] transition-transform ${
                  p.hecho ? 'border-green-200' : 'border-black/[0.06]'
                }`}
              >
                <span className={`flex-shrink-0 ${p.hecho ? 'text-green-600' : 'text-gray-300'}`}>
                  {p.hecho ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`${p.hecho ? 'text-green-600' : 'text-[#1A5C38]'}`}>{p.icon}</span>
                    <p className={`text-[15px] font-semibold ${p.hecho ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                      {i + 1}. {p.titulo}
                    </p>
                  </div>
                  <p className="text-[12px] text-gray-400 mt-0.5 ml-7">{p.desc}</p>
                </div>
                <ChevronRight size={18} className="text-gray-300 flex-shrink-0" />
              </button>
            ))}

            {completados === total && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mt-2">
                <p className="text-3xl mb-1">🎉</p>
                <p className="font-semibold text-green-800">¡Configuración completa!</p>
                <p className="text-green-700 text-sm mt-1">Ya estás listo para operar en SIMAC.</p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="mt-3 px-5 py-2.5 bg-[#1A5C38] text-white rounded-xl text-sm font-semibold"
                >
                  Ir al tablero →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
