import { useEffect, useRef } from 'react';

/* ── Canvas fluido para el banner del dashboard (ambos roles) ──
   Ondas tipo aurora en verde más intenso, orbes de luz flotantes,
   partículas brillantes y un barrido de destello. Solo vive dentro
   del banner verde. */
export default function BannerCanvas() {
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

    const rnd = (a: number, b: number) => a + Math.random() * (b - a);

    /* Orbes de luz — esferas difusas que derivan lentamente */
    interface Orb { x: number; y: number; r: number; vx: number; vy: number; ph: number; hue: number; }
    const orbs: Orb[] = Array.from({ length: 5 }, () => ({
      x: Math.random(), y: Math.random(),
      r: rnd(40, 90),
      vx: rnd(-0.00012, 0.00012),
      vy: rnd(-0.00008, 0.00008),
      ph: Math.random() * Math.PI * 2,
      hue: rnd(140, 160),           // verdes un poco más fuertes/saturados
    }));

    /* Partículas brillantes pequeñas */
    interface Spark { x: number; y: number; r: number; ph: number; spd: number; vx: number; vy: number; }
    const sparks: Spark[] = Array.from({ length: 26 }, () => ({
      x: Math.random(), y: Math.random(),
      r: rnd(0.5, 1.6),
      ph: Math.random() * Math.PI * 2,
      spd: rnd(0.01, 0.028),
      vx: rnd(-0.00006, 0.00006),
      vy: rnd(-0.00012, -0.00003),
    }));

    let t = 0;
    const tick = () => {
      t += 1;
      ctx.clearRect(0, 0, W, H);

      /* Orbes difusos con verde saturado */
      for (const o of orbs) {
        o.x += o.vx + Math.sin(t * 0.004 + o.ph) * 0.00006;
        o.y += o.vy + Math.cos(t * 0.005 + o.ph) * 0.00005;
        if (o.x < -0.2) o.x = 1.2; if (o.x > 1.2) o.x = -0.2;
        if (o.y < -0.3) o.y = 1.3; if (o.y > 1.3) o.y = -0.3;
        const pulse = 0.75 + 0.25 * Math.sin(t * 0.009 + o.ph);
        const g = ctx.createRadialGradient(o.x * W, o.y * H, 0, o.x * W, o.y * H, o.r * pulse);
        g.addColorStop(0, `hsla(${o.hue}, 65%, 45%, 0.16)`);
        g.addColorStop(0.6, `hsla(${o.hue}, 60%, 40%, 0.07)`);
        g.addColorStop(1, 'hsla(150, 60%, 40%, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }

      /* Ondas aurora — 3 bandas fluidas que se mecen por todo el banner */
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const baseY = H * (0.3 + i * 0.22);
        ctx.moveTo(-10, baseY);
        for (let x = -10; x <= W + 10; x += 5) {
          const y = baseY
            + Math.sin(x * 0.008 + t * 0.014 + i * 1.9) * 12
            + Math.sin(x * 0.019 - t * 0.009 + i * 0.8) * 6
            + Math.cos(x * 0.004 + t * 0.006 + i * 2.4) * 8;
          ctx.lineTo(x, y);
        }
        // banda con degradado vertical suave
        ctx.lineTo(W + 10, H + 20);
        ctx.lineTo(-10, H + 20);
        ctx.closePath();
        const bg = ctx.createLinearGradient(0, baseY - 20, 0, H);
        bg.addColorStop(0, `hsla(152, 60%, ${38 + i * 4}%, ${0.10 - i * 0.025})`);
        bg.addColorStop(1, 'hsla(152, 60%, 35%, 0)');
        ctx.fillStyle = bg;
        ctx.fill();

        // línea de cresta brillante
        ctx.beginPath();
        ctx.moveTo(-10, baseY);
        for (let x = -10; x <= W + 10; x += 5) {
          const y = baseY
            + Math.sin(x * 0.008 + t * 0.014 + i * 1.9) * 12
            + Math.sin(x * 0.019 - t * 0.009 + i * 0.8) * 6
            + Math.cos(x * 0.004 + t * 0.006 + i * 2.4) * 8;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(255,255,255,${0.06 - i * 0.015})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      /* Partículas brillantes subiendo con parpadeo */
      for (const s of sparks) {
        s.x += s.vx + Math.sin(t * 0.007 + s.ph) * 0.00004;
        s.y += s.vy;
        if (s.y < -0.03) { s.y = 1.03; s.x = Math.random(); }
        if (s.x < -0.02) s.x = 1.02; if (s.x > 1.02) s.x = -0.02;
        const tw = 0.5 + 0.5 * Math.sin(t * s.spd * 2.4 + s.ph);
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.06 + tw * 0.14})`;
        ctx.fill();
        // halo en las más brillantes
        if (tw > 0.85) {
          ctx.beginPath();
          ctx.arc(s.x * W, s.y * H, s.r * 2.6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(160, 255, 200, ${(tw - 0.85) * 0.25})`;
          ctx.fill();
        }
      }

      /* Barrido de luz diagonal lento */
      const sweep = ((t * 0.0014) % 1.7) - 0.35;
      const sg = ctx.createLinearGradient(W * (sweep - 0.15), 0, W * (sweep + 0.15), H * 0.6);
      sg.addColorStop(0, 'rgba(255,255,255,0)');
      sg.addColorStop(0.5, 'rgba(255,255,255,0.035)');
      sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(0, 0, W, H);

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}
