import { useNavigate } from 'react-router-dom';
import { Wheat, Building2, ChevronRight } from 'lucide-react';

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
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
            onClick={() => navigate('/registro-nuevo')}
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
                <p className="text-white/50 text-xs sm:text-sm mt-0.5 leading-snug">Regístrate con tu CURP y crea tu PIN de 4 dígitos</p>
              </div>
              <ChevronRight size={18} className="text-white/30 group-hover:text-white/60 transition-colors shrink-0" />
            </div>
          </button>

          {/* Link para productores ya registrados */}
          <div className="text-center mt-3">
            <button
              onClick={() => navigate('/login-productor')}
              className="text-sm text-green-300 underline hover:text-white transition-colors"
            >
              ¿Ya tienes cuenta? Inicia sesión aquí
            </button>
          </div>

          {/* Bodega / Industria */}
          <button
            onClick={() => navigate('/login')}
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
                <p className="text-white/40 text-xs sm:text-sm mt-0.5 leading-snug">Ingresa con correo electrónico y contraseña</p>
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
    </div>
  );
}
