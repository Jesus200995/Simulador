/**
 * Shared premium map marker factory — Apple 2026 style
 * Used across all Leaflet maps in SIMAC
 */
import L from 'leaflet';

export type MarkerVariant = 'green' | 'amber' | 'blue' | 'red' | 'gray' | 'white';

interface MarkerConfig {
  fill: string;
  ring: string;
  glow: string;
}

const VARIANTS: Record<MarkerVariant, MarkerConfig> = {
  green:  { fill: '#10b981', ring: '#34d399', glow: '#10b98155' },
  amber:  { fill: '#f59e0b', ring: '#fbbf24', glow: '#f59e0b55' },
  blue:   { fill: '#3b82f6', ring: '#60a5fa', glow: '#3b82f655' },
  red:    { fill: '#ef4444', ring: '#f87171', glow: '#ef444455' },
  gray:   { fill: '#6b7280', ring: '#9ca3af', glow: '#6b728040' },
  white:  { fill: '#f9fafb', ring: '#ffffff', glow: '#ffffff30' },
};

/**
 * Creates a premium Apple-style circular pin marker with glow, gradient and shadow.
 * @param variant   Color theme
 * @param size      Outer diameter in px (default 34)
 * @param selected  If true, renders larger and brighter
 */
export function createPremiumMarker(
  variant: MarkerVariant = 'green',
  size = 34,
  selected = false
): L.DivIcon {
  const c = VARIANTS[variant];
  const s = selected ? Math.round(size * 1.25) : size;
  const outerR = Math.round(s * 0.32);
  const innerDot = Math.round(outerR * 0.38);
  const cx = s / 2;
  const cy = s / 2 - 2;
  const totalH = s + 10;
  const id = `${variant}-${s}`;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${totalH}" viewBox="0 0 ${s} ${totalH}">
  <defs>
    <filter id="gf-${id}" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="${selected ? 4.5 : 3}" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="rg-${id}" cx="38%" cy="32%" r="65%">
      <stop offset="0%" stop-color="${c.ring}"/>
      <stop offset="100%" stop-color="${c.fill}"/>
    </radialGradient>
    <radialGradient id="shine-${id}" cx="33%" cy="28%" r="55%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="${selected ? 0.5 : 0.38}"/>
      <stop offset="70%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- Drop shadow -->
  <ellipse cx="${cx}" cy="${s - 1}" rx="${outerR * 0.7}" ry="3.5" fill="#00000035"/>
  <!-- Outer glow ring -->
  <circle cx="${cx}" cy="${cy}" r="${outerR + 4}" fill="${c.glow}" filter="url(#gf-${id})"/>
  <!-- Translucent outer ring -->
  <circle cx="${cx}" cy="${cy}" r="${outerR + 1}" fill="${c.fill}" opacity="0.18"/>
  <!-- Main body -->
  <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="url(#rg-${id})"/>
  <!-- Shine overlay -->
  <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="url(#shine-${id})"/>
  <!-- White center dot -->
  <circle cx="${cx}" cy="${cy}" r="${innerDot}" fill="#ffffff" opacity="0.96"/>
  <!-- Pin tail -->
  <polygon
    points="${cx - 5},${cy + outerR - 2} ${cx + 5},${cy + outerR - 2} ${cx},${totalH - 1}"
    fill="${c.fill}"
    opacity="0.85"
  />
</svg>`;

  return L.divIcon({
    html: svg.trim(),
    className: '',
    iconSize: [s, totalH],
    iconAnchor: [cx, totalH],
    popupAnchor: [0, -totalH + 4],
  });
}

/** Helper: variant from bodega estatus */
export function variantFromEstatus(estatus: string): MarkerVariant {
  if (estatus === 'aprobada') return 'green';
  if (estatus === 'pendiente') return 'amber';
  if (estatus === 'rechazada') return 'gray';
  return 'green';
}

/** Helper: variant from semaforo color */
export function variantFromSemaforo(sem: string): MarkerVariant {
  if (sem === 'verde') return 'green';
  if (sem === 'amarillo') return 'amber';
  if (sem === 'rojo') return 'red';
  return 'green';
}
