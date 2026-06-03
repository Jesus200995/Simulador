import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wheat, Building2, ChevronRight, X, LogIn, ShieldCheck, UserPlus } from 'lucide-react';

type Menu = null | 'productor' | 'bodega';

interface Opcion {
  icon: typeof LogIn;
  title: string;
  desc: string;
  to: string;
  accent?: boolean;
}

const OPCIONES: Record<'productor' | 'bodega', { titulo: string; subtitulo: string; items: Opcion[] }> = {
  productor: {
    titulo: 'Soy Productor',
    subtitulo: 'Elige la opción según tu caso',
    items: [
      { icon: LogIn,       title: 'Ya tengo cuenta',        desc: 'Entra con tu CURP y tu PIN de 4 dígitos.', to: '/login-productor', accent: true },
      { icon: ShieldCheck, title: 'Activar mi cuenta',      desc: 'Ya estás en el padrón del Plan Maíz. Crea tu PIN con tu CURP.', to: '/activar' },
      { icon: UserPlus,    title: 'Soy nuevo, registrarme', desc: 'No estás en el padrón. Crea tu cuenta desde cero con tu CURP.', to: '/registro-nuevo' },
    ],
  },
  bodega: {
    titulo: 'Soy Bodega / Industria',
    subtitulo: 'Elige una opción',
    items: [
      { icon: LogIn,    title: 'Ya tengo cuenta',     desc: 'Entra con tu correo electrónico y contraseña.', to: '/login', accent: true },
      { icon: UserPlus, title: 'Crear cuenta nueva',  desc: 'Registra tu bodega o industria por primera vez.', to: '/registro' },
    ],
  },
};

export default function WelcomePage() {
  const navigate = useNavigate();
  const [menu, setMenu] = useState<Menu>(null);
  const data = menu ? OPCIONES[menu] : null;

  return (
    <div className="relative min-h-[100dvh] flex flex-col overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#061510] via-[#0c2e1a] to-[#1A5C38]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_0%,rgba(52,208,121,0.12),transparent)]" />
        <div className="absolute bottom-0 inset-x-0 h-40 flex items-end justify-around px-6 opacity-[0.05] pointer-events-none">
          {[0,1,2,3,4,5,6,7,8,9,10,11].map(i => (
            <Wheat
              key={i}
              size={i % 3 === 0 ? 48 : i % 2 === 0 ? 36 : 26}
              className="text-white mb-1"
              style={{ transform: `rotate(${(i - 5) * 4}deg)` }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-5 py-12 sm:py-16">

        {/* Logo + brand */}
        <div className="animate-auth-in flex flex-col items-center mb-10 sm:mb-12">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[20px] sm:rounded-[24px] bg-white/10 backdrop-blur-md ring-1 ring-white/20 flex items-center justify-center shadow-2xl mb-4">
            <img src="/icono.png" alt="SIMAC" className="w-11 h-11 sm:w-14 sm:h-14 rounded-[12px]" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-[-0.5px] leading-none">
            SIMAC
          </h1>
          <p className="text-sm sm:text-base text-green-300/70 font-medium mt-1.5 tracking-wide text-center">
            Plan Nacional Maíz 2026
          </p>
        </div>

        {/* Subtitle */}
        <div className="animate-auth-in mb-6 sm:mb-8 text-center" style={{ animationDelay: '0.05s' }}>
          <p className="text-white/60 text-sm sm:text-base">¿Cómo deseas ingresar?</p>
        </div>

        {/* Cards */}
        <div className="w-full max-w-sm space-y-3 sm:space-y-4">

          {/* Productor */}
          <button
            onClick={() => setMenu('productor')}
            className="animate-auth-in w-full group relative bg-white/10 hover:bg-white/15 active:bg-white/20 backdrop-blur-md ring-1 ring-white/15 rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-left transition-all duration-200 active:scale-[0.98]"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#1A5C38] rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-green-900/40 shrink-0">
                <Wheat size={22} className="text-white sm:hidden" />
                <Wheat size={26} className="text-white hidden sm:block" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-base sm:text-lg leading-tight">Soy Productor</p>
                <p className="text-white/50 text-xs sm:text-sm mt-0.5 leading-snug">Iniciar sesión, activar o registrar tu cuenta</p>
              </div>
              <ChevronRight size={18} className="text-white/30 group-hover:text-white/60 transition-colors shrink-0" />
            </div>
          </button>

          {/* Bodega / Industria */}
          <button
            onClick={() => setMenu('bodega')}
            className="animate-auth-in w-full group relative bg-white/06 hover:bg-white/10 active:bg-white/15 backdrop-blur-md ring-1 ring-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-left transition-all duration-200 active:scale-[0.98]"
            style={{ animationDelay: '0.15s' }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                <Building2 size={22} className="text-white/70 sm:hidden" />
                <Building2 size={26} className="text-white/70 hidden sm:block" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/80 font-bold text-base sm:text-lg leading-tight">Soy Bodega / Industria</p>
                <p className="text-white/40 text-xs sm:text-sm mt-0.5 leading-snug">Iniciar sesión o registrar tu bodega</p>
              </div>
              <ChevronRight size={18} className="text-white/20 group-hover:text-white/50 transition-colors shrink-0" />
            </div>
          </button>
        </div>

        {/* Footer */}
        <p className="animate-auth-in mt-6 text-center text-[10px] sm:text-[11px] text-white/20 max-w-xs leading-relaxed px-4" style={{ animationDelay: '0.25s' }}>
          Sistema de Ordenamiento de la Producción y Comercialización del Maíz Blanco en México
        </p>
      </div>

      {/* ── Bottom sheet de opciones ── */}
      {data && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 animate-backdrop-in" onClick={() => setMenu(null)} />
          <div
            className="relative bg-white rounded-t-[28px] px-5 pt-3 shadow-[0_-10px_40px_rgba(0,0,0,0.4)] animate-sheet-up max-h-[88dvh] overflow-y-auto"
            style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
          >
            {/* Handle */}
            <div className="w-10 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />

            {/* Header */}
            <div className="flex items-start justify-between mb-1">
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">{data.titulo}</h2>
                <p className="text-gray-400 text-sm mt-0.5">{data.subtitulo}</p>
              </div>
              <button
                onClick={() => setMenu(null)}
                aria-label="Cerrar"
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 active:scale-90 transition-transform shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Opciones */}
            <div className="space-y-2.5 mt-4">
              {data.items.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.to}
                    onClick={() => navigate(item.to)}
                    className={`w-full flex items-center gap-3.5 p-4 rounded-2xl text-left transition-all active:scale-[0.98] border
                      ${item.accent
                        ? 'bg-[#1A5C38] border-[#1A5C38] shadow-lg shadow-green-900/20'
                        : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${item.accent ? 'bg-white/15' : 'bg-white shadow-sm'}`}>
                      <Icon size={20} className={item.accent ? 'text-white' : 'text-[#1A5C38]'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-[15px] leading-tight ${item.accent ? 'text-white' : 'text-gray-900'}`}>{item.title}</p>
                      <p className={`text-xs mt-1 leading-snug ${item.accent ? 'text-green-100/80' : 'text-gray-500'}`}>{item.desc}</p>
                    </div>
                    <ChevronRight size={18} className={`shrink-0 ${item.accent ? 'text-white/60' : 'text-gray-300'}`} />
                  </button>
                );
              })}
            </div>

            {/* Volver */}
            <button
              onClick={() => setMenu(null)}
              className="w-full mt-4 py-3 text-gray-400 text-sm font-semibold active:text-gray-600 transition-colors"
            >
              ← Volver
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
