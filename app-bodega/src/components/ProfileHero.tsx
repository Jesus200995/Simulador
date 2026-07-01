import { type ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  titulo: string;
  nombre: string;
  initials: string;
  back?: string | number;
  badges?: ReactNode;
  meta?: string;
}

export default function ProfileHero({ titulo, nombre, initials, back, badges, meta }: Props) {
  const navigate = useNavigate();

  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-br from-[#1A5C38] via-[#1e6b42] to-[#22733f]">
      {/* Círculos decorativos */}
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/[0.04] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white/[0.03] pointer-events-none" />
      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[340px] h-[340px] rounded-full bg-white/[0.025] pointer-events-none" />

      {/* Botón volver */}
      {back !== undefined && (
        <button
          onClick={() => typeof back === 'number' ? navigate(back as number) : navigate(back as string)}
          className="absolute top-4 left-4 flex items-center gap-1 text-green-200/80 text-[13px] font-semibold z-10 active:opacity-60 transition-opacity"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <ChevronLeft size={18} strokeWidth={2.5} className="-ml-1" />
          Volver
        </button>
      )}

      {/* Contenido centrado */}
      <div
        className="flex flex-col items-center text-center px-6 pb-8"
        style={{ paddingTop: back !== undefined ? 'calc(env(safe-area-inset-top, 0px) + 3.5rem)' : 'calc(env(safe-area-inset-top, 0px) + 1.5rem)' }}
      >
        {/* Avatar */}
        <div
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-[22px] sm:rounded-[26px] bg-white/15 backdrop-blur-sm ring-[2.5px] ring-white/25 flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.25)] mb-5"
          style={{ animation: 'phPop .45s cubic-bezier(0.34,1.56,0.64,1) both' }}
        >
          <span className="text-white text-[28px] sm:text-[32px] font-black tracking-tight select-none">
            {initials}
          </span>
        </div>

        {/* Etiqueta título */}
        <p
          className="text-[10px] sm:text-[11px] font-bold text-green-300/70 uppercase tracking-[0.18em] mb-2"
          style={{ animation: 'phFadeUp .35s .12s ease both' }}
        >
          {titulo}
        </p>

        {/* Nombre */}
        <h1
          className="text-[22px] sm:text-[26px] font-black text-white leading-tight tracking-tight max-w-xs sm:max-w-sm"
          style={{ animation: 'phFadeUp .35s .18s ease both' }}
        >
          {nombre}
        </h1>

        {/* Meta (email, curp, etc.) */}
        {meta && (
          <p
            className="text-green-200/60 text-[12px] sm:text-[13px] font-medium mt-1.5 truncate max-w-[240px]"
            style={{ animation: 'phFadeUp .35s .22s ease both' }}
          >
            {meta}
          </p>
        )}

        {/* Badges */}
        {badges && (
          <div
            className="flex items-center gap-2 mt-3.5 flex-wrap justify-center"
            style={{ animation: 'phFadeUp .35s .27s ease both' }}
          >
            {badges}
          </div>
        )}
      </div>

      {/* Curva inferior suave */}
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-[#eef8f2] rounded-t-[24px]" />

      <style>{`
        @keyframes phPop     { from { opacity:0; transform:scale(0.75) } to { opacity:1; transform:scale(1) } }
        @keyframes phFadeUp  { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </div>
  );
}
