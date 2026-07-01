import { type ReactNode, useEffect, useRef } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  titulo: string;
  nombre: string;
  initials: string;
  back?: string | number;
  badges?: ReactNode;
  meta?: string;
  variant?: 'productor' | 'bodega';
}

/* ── Canvas de fondo animado (solo dentro del hero verde) ─────────────── */
function HeroCanvas({ variant }: { variant: 'productor' | 'bodega' }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let W = 0, H = 0;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width  = W * DPR;
      canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    interface P {
      x: number; y: number; s: number;      // posición y tamaño
      vx: number; vy: number;                // velocidad
      rot: number; vr: number;               // rotación
      op: number; ph: number;                // opacidad base y fase
    }

    const N = 16;
    const parts: P[] = Array.from({ length: N }, () => ({
      x: Math.random(),
      y: Math.random(),
      s: 5 + Math.random() * 9,
      vx: (Math.random() - 0.5) * 0.00018,
      vy: -0.00006 - Math.random() * 0.00012,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.008,
      op: 0.05 + Math.random() * 0.09,
      ph: Math.random() * Math.PI * 2,
    }));

    // Hoja (productor)
    const drawHoja = (s: number) => {
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(s * 0.9, -s * 0.3, 0, s);
      ctx.quadraticCurveTo(-s * 0.9, -s * 0.3, 0, -s);
      ctx.fill();
      // nervadura
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.8);
      ctx.lineTo(0, s * 0.8);
      ctx.lineWidth = 0.8;
      ctx.stroke();
    };

    // Caja/hexágono (bodega)
    const drawCaja = (s: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        const px = Math.cos(a) * s, py = Math.sin(a) * s;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 0.8;
      ctx.stroke();
    };

    let t = 0;
    const tick = () => {
      t += 1;
      ctx.clearRect(0, 0, W, H);

      for (const p of parts) {
        p.x += p.vx + Math.sin(t * 0.008 + p.ph) * 0.00008;
        p.y += p.vy;
        p.rot += p.vr;
        // reciclar al salir por arriba
        if (p.y * H < -20) { p.y = 1 + 20 / H; p.x = Math.random(); }
        if (p.x < -0.05) p.x = 1.05;
        if (p.x > 1.05) p.x = -0.05;

        const flicker = p.op * (0.75 + 0.25 * Math.sin(t * 0.02 + p.ph));
        ctx.save();
        ctx.translate(p.x * W, p.y * H);
        ctx.rotate(p.rot);
        ctx.fillStyle   = `rgba(255,255,255,${flicker})`;
        ctx.strokeStyle = `rgba(255,255,255,${flicker * 0.9})`;
        variant === 'productor' ? drawHoja(p.s) : drawCaja(p.s * 0.8);
        ctx.restore();
      }

      // ondas suaves de luz en la parte baja
      ctx.save();
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        const base = H * (0.78 + i * 0.09);
        ctx.moveTo(0, base);
        for (let x = 0; x <= W; x += 8) {
          ctx.lineTo(x, base + Math.sin(x * 0.012 + t * 0.014 + i * 2) * 6);
        }
        ctx.strokeStyle = `rgba(255,255,255,${0.05 - i * 0.018})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
      ctx.restore();

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [variant]);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}

export default function ProfileHero({ titulo, nombre, initials, back, badges, meta, variant = 'bodega' }: Props) {
  const navigate = useNavigate();

  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-br from-[#1A5C38] via-[#1e6b42] to-[#22733f]">
      {/* Círculos decorativos */}
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/[0.04] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white/[0.03] pointer-events-none" />
      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[340px] h-[340px] rounded-full bg-white/[0.025] pointer-events-none" />

      {/* Canvas animado según rol */}
      <HeroCanvas variant={variant} />

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
        className="relative flex flex-col items-center text-center px-6 pb-8"
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
