import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

/* ── Canvas corn animation ── */
function CornCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    if (!ctx) return;

    let animId: number;
    let W = canvas.offsetWidth;
    let H = canvas.offsetHeight;
    canvas.width = W;
    canvas.height = H;

    // Particles (pollen / firefly dots)
    const particles = Array.from({ length: 70 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 2.2 + 0.6,
      speed: Math.random() * 0.35 + 0.1,
      drift: (Math.random() - 0.5) * 0.25,
      alpha: Math.random() * 0.55 + 0.15,
      hue: Math.random() * 25 + 42, // gold–amber range
      phase: Math.random() * Math.PI * 2,
    }));

    function drawStalk(x: number, baseY: number, totalH: number, alpha: number, tick: number, idx: number) {
      const sway = Math.sin(tick * 0.007 + idx * 1.1) * 5;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(sway * 0.5, 0);

      // Main stalk — bezier curve for natural bend
      ctx.beginPath();
      ctx.moveTo(x, baseY);
      ctx.bezierCurveTo(
        x + sway * 0.3, baseY - totalH * 0.4,
        x + sway * 0.6, baseY - totalH * 0.7,
        x + sway,       baseY - totalH
      );
      ctx.strokeStyle = '#2a6e45';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Leaves
      const leafData = [
        { t: 0.28, side: 1, len: 52, curve: 18 },
        { t: 0.52, side: -1, len: 58, curve: 20 },
        { t: 0.74, side: 1, len: 42, curve: 14 },
      ];
      leafData.forEach(({ t, side, len, curve }) => {
        const lx = x + sway * t;
        const ly = baseY - totalH * t;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.bezierCurveTo(
          lx + side * len * 0.6, ly - curve,
          lx + side * len * 0.9, ly + curve * 0.5,
          lx + side * len * 0.5, ly + curve * 1.2
        );
        ctx.bezierCurveTo(
          lx + side * len * 0.3, ly + curve * 0.8,
          lx + side * 10, ly + 4,
          lx, ly
        );
        const leafGrad = ctx.createLinearGradient(lx, ly - curve, lx + side * len, ly + curve);
        leafGrad.addColorStop(0, `rgba(26,92,56,${alpha * 0.95})`);
        leafGrad.addColorStop(1, `rgba(40,120,70,${alpha * 0.55})`);
        ctx.fillStyle = leafGrad;
        ctx.fill();
      });

      // Corn cob (ear)
      const cobX = x + sway * 0.45;
      const cobY = baseY - totalH * 0.55;
      const cobAngle = 0.22;

      ctx.save();
      ctx.translate(cobX + 18, cobY);
      ctx.rotate(cobAngle);

      // 1. Husk leaves behind cob (deep, rich green shadows)
      // Left back husk leaf
      ctx.beginPath();
      ctx.moveTo(-2, 24);
      ctx.bezierCurveTo(-18, 15, -22, -10, -10, -32);
      ctx.bezierCurveTo(-6, -20, -2, 0, -2, 24);
      ctx.fillStyle = `rgba(32,106,56,${alpha * 0.75})`;
      ctx.fill();

      // Right back husk leaf
      ctx.beginPath();
      ctx.moveTo(2, 24);
      ctx.bezierCurveTo(18, 15, 22, -10, 10, -32);
      ctx.bezierCurveTo(6, -20, 2, 0, 2, 24);
      ctx.fillStyle = `rgba(28,96,50,${alpha * 0.70})`;
      ctx.fill();

      // 2. Corn silk (stigmas) emerging from tip of cob (at around y = -26)
      ctx.strokeStyle = `rgba(204, 119, 34, ${alpha * 0.7})`; // Ochre/bronze color
      ctx.lineWidth = 0.6;
      for (let s = 0; s < 7; s++) {
        ctx.beginPath();
        ctx.moveTo(0, -25);
        const silkSway = Math.sin(tick * 0.012 + s * 1.3 + idx) * 3;
        ctx.bezierCurveTo(
          -3 + s * 1.0, -32,
          -6 + s * 1.5 + silkSway, -42,
          -10 + s * 2.0 + silkSway * 1.5, -48
        );
        ctx.stroke();
      }

      // 3. Cob base body under kernels (rich warm gold gradient)
      const cobGrad = ctx.createLinearGradient(-8, -26, 8, 26);
      cobGrad.addColorStop(0, `rgba(180,120,20,${alpha})`);
      cobGrad.addColorStop(0.5, `rgba(220,160,30,${alpha})`);
      cobGrad.addColorStop(1, `rgba(150,90,10,${alpha})`);
      ctx.beginPath();
      ctx.ellipse(0, 0, 9.5, 26, 0, 0, Math.PI * 2);
      ctx.fillStyle = cobGrad;
      ctx.fill();

      // 4. Staggered individual 3D kernels
      const rows = 12;
      const cols = 5;
      for (let r = 0; r < rows; r++) {
        const t = -0.85 + (r / (rows - 1)) * 1.7; // -0.85 to 0.85
        const ky = t * 26;
        
        // Taper row width based on ellipse height
        const wFactor = Math.sqrt(Math.max(0, 1 - t * t * 0.95));
        const rowWidth = 9.5 * wFactor;
        
        for (let c = 0; c < cols; c++) {
          const stagger = (r % 2 === 0) ? 0.08 : -0.08;
          const colT = -0.8 + (c / (cols - 1)) * 1.6 + stagger;
          const clampedColT = Math.max(-0.9, Math.min(0.9, colT));
          const kx = clampedColT * rowWidth;
          
          const kr = 2.1 * (1 + (1 - Math.abs(clampedColT)) * 0.2); // larger in middle
          
          // Organic grain color variation
          const grainHue = 43 + ((r * 3 + c * 7) % 7);
          const grainLightness = 53 + ((r * 5 + c * 3) % 9) - 4; // 49% to 57%
          
          ctx.fillStyle = `hsla(${grainHue}, 98%, ${grainLightness}%, ${alpha})`;
          ctx.beginPath();
          ctx.arc(kx, ky, kr, 0, Math.PI * 2);
          ctx.fill();
          
          // Specular highlight (shine)
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.85})`;
          ctx.beginPath();
          ctx.arc(kx - kr * 0.35, ky - kr * 0.35, kr * 0.25, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 5. Foreground husks wrapping the bottom and sides
      // Left foreground husk
      ctx.beginPath();
      ctx.moveTo(-3, 26);
      ctx.bezierCurveTo(-14, 20, -15, 6, -7, -10);
      ctx.bezierCurveTo(-4, 0, -1, 14, -3, 26);
      ctx.fillStyle = `rgba(46, 142, 82, ${alpha * 0.95})`;
      ctx.fill();
      // Vein highlight on left husk
      ctx.strokeStyle = `rgba(80, 200, 130, ${alpha * 0.65})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-3, 26);
      ctx.bezierCurveTo(-9, 16, -10, 5, -7, -10);
      ctx.stroke();

      // Right foreground husk
      ctx.beginPath();
      ctx.moveTo(3, 26);
      ctx.bezierCurveTo(14, 20, 15, 6, 7, -10);
      ctx.bezierCurveTo(4, 0, 1, 14, 3, 26);
      ctx.fillStyle = `rgba(40, 132, 76, ${alpha * 0.95})`;
      ctx.fill();
      // Vein highlight on right husk
      ctx.strokeStyle = `rgba(80, 200, 130, ${alpha * 0.65})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(3, 26);
      ctx.bezierCurveTo(9, 16, 10, 5, 7, -10);
      ctx.stroke();

      // 6. Peduncle / Stalk base
      ctx.beginPath();
      ctx.moveTo(-3.5, 25);
      ctx.lineTo(3.5, 25);
      ctx.lineTo(2, 34);
      ctx.lineTo(-2, 34);
      ctx.closePath();
      ctx.fillStyle = `rgba(32, 102, 54, ${alpha})`;
      ctx.fill();

      ctx.restore();

      ctx.restore();
    }

    // Stalk layout — spread across bottom
    const stalks = [
      { xr: 0.04, hr: 0.52, a: 0.55 },
      { xr: 0.14, hr: 0.63, a: 0.75 },
      { xr: 0.26, hr: 0.70, a: 0.90 },
      { xr: 0.38, hr: 0.68, a: 0.85 },
      { xr: 0.50, hr: 0.75, a: 1.00 },
      { xr: 0.62, hr: 0.67, a: 0.88 },
      { xr: 0.74, hr: 0.71, a: 0.90 },
      { xr: 0.86, hr: 0.62, a: 0.72 },
      { xr: 0.95, hr: 0.50, a: 0.55 },
    ];

    let tick = 0;

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // Sky glow — radial from top center
      const skyGrad = ctx.createRadialGradient(W * 0.5, -H * 0.1, 0, W * 0.5, H * 0.4, W * 0.85);
      skyGrad.addColorStop(0, 'rgba(26,92,56,0.18)');
      skyGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // Ground strip
      const groundGrad = ctx.createLinearGradient(0, H * 0.75, 0, H);
      groundGrad.addColorStop(0, 'rgba(5,25,10,0)');
      groundGrad.addColorStop(1, 'rgba(3,15,6,0.75)');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, H * 0.75, W, H * 0.25);

      // Draw stalks
      stalks.forEach((s, i) => {
        drawStalk(s.xr * W, H, s.hr * H, s.a, tick, i);
      });

      // Particles (pollen / fireflies)
      particles.forEach(p => {
        p.y -= p.speed;
        p.x += p.drift + Math.sin(tick * 0.012 + p.phase) * 0.18;
        if (p.y < -8) { p.y = H + 8; p.x = Math.random() * W; }
        if (p.x < -8) p.x = W + 8;
        if (p.x > W + 8) p.x = -8;

        const pulse = 0.55 + 0.45 * Math.sin(tick * 0.025 + p.phase);
        ctx.save();
        ctx.globalAlpha = p.alpha * pulse;
        // Glow
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.5);
        glow.addColorStop(0, `hsla(${p.hue},85%,65%,0.8)`);
        glow.addColorStop(1, `hsla(${p.hue},85%,65%,0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3.5, 0, Math.PI * 2);
        ctx.fill();
        // Core dot
        ctx.fillStyle = `hsla(${p.hue},90%,75%,1)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      tick++;
      animId = requestAnimationFrame(draw);
    }

    draw();

    const ro = new ResizeObserver(() => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W;
      canvas.height = H;
    });
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

/* ── Main page ── */
export default function WelcomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const menuInicial = (location.state as { menu?: Menu } | null)?.menu ?? null;
  const [menu, setMenu] = useState<Menu>(menuInicial);
  const [visible, setVisible] = useState(false);
  const data = menu ? OPCIONES[menu] : null;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  const closeMenu = () => setMenu(null);

  return (
    <div className="relative min-h-[100dvh] flex overflow-hidden bg-[#092213]">

      {/* ── LEFT PANEL — corn illustration (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col overflow-hidden">
        {/* Deep green gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#05160d] via-[#0b2b18] to-[#124225]" />
        {/* Top vignette */}
        <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-black/50 to-transparent z-10 pointer-events-none" />
        {/* Bottom vignette */}
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none" />
        {/* Right fade — blends into right panel */}
        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-[#092213] to-transparent z-10 pointer-events-none" />

        {/* Canvas animation */}
        <CornCanvas />

        {/* Overlay content */}
        <div className="relative z-20 flex flex-col h-full px-10 py-10">
          {/* Top badge */}
          <div
            className="inline-flex items-center gap-2 bg-white/8 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 w-fit"
            style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(-10px)', transition: 'opacity 0.5s ease, transform 0.5s ease' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-emerald-300/90 tracking-widest uppercase">Plan Nacional Maíz 2026</span>
          </div>

          {/* Bottom text */}
          <div className="mt-auto">
            <div
              style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)', transition: 'opacity 0.7s ease 0.15s, transform 0.7s ease 0.15s' }}
            >
              <h2 className="text-[38px] xl:text-[46px] font-black text-white leading-tight tracking-tight">
                El campo mexicano<br />
                <span className="text-emerald-400">conectado</span> al mercado
              </h2>
              <p className="text-white/45 text-[15px] font-medium mt-3 leading-relaxed max-w-md">
                Sistema de Ordenamiento de la Producción y Comercialización del Maíz Blanco en México.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — login options ── */}
      <div className="flex-1 flex flex-col min-h-[100dvh] lg:min-h-auto relative">
        {/* Mobile background */}
        <div className="lg:hidden absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#092213] via-[#0b2b18] to-[#144728]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(34,197,94,0.10),transparent)]" />
          {/* Mobile canvas too */}
          <CornCanvas />
          <div className="absolute inset-0 bg-gradient-to-b from-[#092213]/70 via-transparent to-[#092213]/80" />
        </div>

        {/* Right panel content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 sm:py-16 lg:bg-[#040f08]/0">

          {/* Logo */}
          <div
            className="flex flex-col items-center mb-8 lg:mb-10"
            style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(-16px) scale(0.95)', transition: 'opacity 0.5s ease, transform 0.5s ease' }}
          >
            <div className="w-[72px] h-[72px] lg:w-20 lg:h-20 rounded-[22px] lg:rounded-[26px] bg-white/10 backdrop-blur-xl ring-1 ring-white/20 flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.4)] mb-4">
              <img
                src="/icono.png"
                alt="SIMAC"
                className="w-12 h-12 lg:w-14 lg:h-14 rounded-[14px]"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <h1 className="text-[34px] lg:text-[38px] font-black text-white tracking-[-1px] leading-none">
              SIMAC
            </h1>
            <p className="text-[13px] text-emerald-400/70 font-semibold mt-1.5 tracking-[0.12em] uppercase text-center">
              Plan Nacional Maíz 2026
            </p>
          </div>

          {/* Subtitle */}
          <div
            className="mb-6 text-center"
            style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease 0.08s' }}
          >
            <p className="text-white/50 text-[15px] font-medium">¿Cómo deseas ingresar?</p>
          </div>

          {/* Cards */}
          <div className="w-full max-w-[360px] space-y-3">

            {/* Productor */}
            <button
              onClick={() => setMenu('productor')}
              className="w-full group relative overflow-hidden rounded-2xl p-[1px] transition-all duration-300"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'none' : 'translateY(20px)',
                transition: 'opacity 0.5s ease 0.12s, transform 0.5s ease 0.12s',
                background: 'linear-gradient(135deg, rgba(34,197,94,0.4) 0%, rgba(26,92,56,0.2) 100%)',
              }}
            >
              <div className="relative bg-[#133c23]/90 backdrop-blur-xl hover:bg-[#194a2b]/90 active:bg-[#0e2c1a]/90 rounded-[calc(1rem-1px)] p-5 text-left transition-colors duration-200">
                {/* Shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 rounded-[calc(1rem-1px)]" />
                <div className="flex items-center gap-4 relative">
                  <div className="w-13 h-13 bg-gradient-to-br from-[#1A5C38] to-[#0f3821] rounded-xl flex items-center justify-center shadow-[0_4px_16px_rgba(26,92,56,0.6)] shrink-0 transition-transform duration-200 group-hover:scale-105">
                    <Wheat size={24} className="text-emerald-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-[17px] leading-tight">Soy Productor</p>
                    <p className="text-white/45 text-[13px] mt-0.5 leading-snug">Iniciar sesión, activar o registrar tu cuenta</p>
                  </div>
                  <ChevronRight size={18} className="text-emerald-500/60 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all duration-200 shrink-0" />
                </div>
              </div>
            </button>

            {/* Bodega / Industria */}
            <button
              onClick={() => setMenu('bodega')}
              className="w-full group relative overflow-hidden rounded-2xl p-[1px] transition-all duration-300"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'none' : 'translateY(20px)',
                transition: 'opacity 0.5s ease 0.18s, transform 0.5s ease 0.18s',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%)',
              }}
            >
              <div className="relative bg-white/[0.05] backdrop-blur-xl hover:bg-white/[0.08] active:bg-white/[0.03] rounded-[calc(1rem-1px)] p-5 text-left transition-colors duration-200">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 rounded-[calc(1rem-1px)]" />
                <div className="flex items-center gap-4 relative">
                  <div className="w-13 h-13 bg-white/10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                    <Building2 size={24} className="text-white/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 font-bold text-[17px] leading-tight">Soy Bodega / Industria</p>
                    <p className="text-white/35 text-[13px] mt-0.5 leading-snug">Iniciar sesión o registrar tu bodega</p>
                  </div>
                  <ChevronRight size={18} className="text-white/25 group-hover:text-white/50 group-hover:translate-x-1 transition-all duration-200 shrink-0" />
                </div>
              </div>
            </button>
          </div>

          {/* Footer */}
          <p
            className="mt-8 text-center text-[10px] text-white/18 max-w-[260px] leading-relaxed"
            style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease 0.28s' }}
          >
            Sistema de Ordenamiento de la Producción y Comercialización del Maíz Blanco en México
          </p>
        </div>
      </div>

      {/* ── Bottom sheet / Dialog de opciones ── */}
      {data && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:items-center lg:justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            style={{ animation: 'fadeIn 0.2s ease forwards' }}
            onClick={closeMenu}
          />

          {/* Sheet — bottom on mobile, centered dialog on desktop */}
          <div
            className="
              relative bg-white rounded-t-[28px] lg:rounded-[28px]
              px-5 pt-3 pb-8 lg:pb-6
              shadow-[0_-10px_60px_rgba(0,0,0,0.5)] lg:shadow-[0_24px_80px_rgba(0,0,0,0.4)]
              max-h-[90dvh] overflow-y-auto
              w-full lg:max-w-[420px]
            "
            style={{ animation: 'sheetUp 0.28s cubic-bezier(0.32,0.72,0,1) forwards' }}
          >
            {/* Handle (mobile only) */}
            <div className="w-10 h-1.5 bg-gray-200 rounded-full mx-auto mb-5 lg:hidden" />

            {/* Header */}
            <div className="flex items-start justify-between mb-1">
              <div>
                <h2 className="text-[21px] font-black text-gray-900 tracking-tight">{data.titulo}</h2>
                <p className="text-gray-400 text-[13px] mt-0.5">{data.subtitulo}</p>
              </div>
              <button
                onClick={closeMenu}
                aria-label="Cerrar"
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 active:scale-90 transition-all shrink-0"
              >
                <X size={17} />
              </button>
            </div>

            {/* Options */}
            <div className="space-y-2.5 mt-5">
              {data.items.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.to}
                    onClick={() => navigate(item.to)}
                    className={`w-full flex items-center gap-3.5 p-4 rounded-2xl text-left transition-all active:scale-[0.98] border
                      ${item.accent
                        ? 'bg-[#1A5C38] border-[#1A5C38] shadow-lg shadow-green-900/25 hover:bg-[#155030]'
                        : 'bg-[#f5fbf7] border-gray-100 hover:bg-[#edf8f2] hover:border-gray-200'}`}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${item.accent ? 'bg-white/15' : 'bg-white shadow-sm border border-gray-100'}`}>
                      <Icon size={20} className={item.accent ? 'text-white' : 'text-[#1A5C38]'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-[15px] leading-tight ${item.accent ? 'text-white' : 'text-gray-900'}`}>{item.title}</p>
                      <p className={`text-[12px] mt-0.5 leading-snug ${item.accent ? 'text-green-100/75' : 'text-gray-500'}`}>{item.desc}</p>
                    </div>
                    <ChevronRight size={17} className={`shrink-0 ${item.accent ? 'text-white/55' : 'text-gray-300'}`} />
                  </button>
                );
              })}
            </div>

            {/* Back */}
            <button
              onClick={closeMenu}
              className="w-full mt-4 py-3 text-gray-400 text-[13px] font-semibold hover:text-gray-600 transition-colors"
            >
              ← Volver
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes sheetUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
