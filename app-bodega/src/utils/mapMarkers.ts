/**
 * Shared premium map marker factory — Apple 2026 style
 * Uses GPU-accelerated CSS effects, rich linear gradients, and highly distinct
 * premium outline symbols (Warehouse for approved, Clock for pending, Cross for rejected).
 */
import L from 'leaflet';

export type MarkerVariant = 'green' | 'amber' | 'blue' | 'red' | 'gray' | 'white';

interface MarkerConfig {
  start: string;
  end: string;
  border: string;
}

const VARIANTS: Record<MarkerVariant, MarkerConfig> = {
  green:  { start: '#10B981', end: '#059669', border: '#ffffff' }, // Verde esmeralda fuerte (Aprobada)
  amber:  { start: '#FF9500', end: '#D97706', border: '#ffffff' }, // Ámbar/naranja fuerte (Pendiente)
  blue:   { start: '#3B82F6', end: '#1D4ED8', border: '#ffffff' }, // Azul iOS (Ubicación/Productor)
  red:    { start: '#EF4444', end: '#B91C1C', border: '#ffffff' }, // Rojo fuerte (Alerta)
  gray:   { start: '#6B7280', end: '#374151', border: '#ffffff' }, // Gris carbón premium (Rechazada)
  white:  { start: '#FFFFFF', end: '#E5E7EB', border: '#9CA3AF' }, // Blanco
};

const ICONS: Record<MarkerVariant, string> = {
  // Silueta de bodega/silo premium para aprobada
  green: `
    <path 
      d="M9 16.5v6a1 1 0 001 1h12a1 1 0 001-1v-6M6 16.5l10-6 10 6M16 13v10" 
      stroke="#ffffff" 
      stroke-width="1.8" 
      stroke-linecap="round" 
      stroke-linejoin="round" 
      fill="none" 
    />
  `,
  
  // Reloj de espera premium para pendiente
  amber: `
    <circle cx="16" cy="15.5" r="5.5" stroke="#ffffff" stroke-width="1.8" fill="none" />
    <path d="M16 12v3.5h2.5" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" fill="none" />
  `,
  
  // Usuario premium para azul
  blue: `
    <circle cx="16" cy="12.5" r="3.5" fill="#ffffff" />
    <path d="M10 21c0-2.5 2.7-4.5 6-4.5s6 2 6 4.5v0.5H10V21z" fill="#ffffff" />
  `,
  
  // Signo de exclamación para rojo
  red: `
    <path d="M16 10v5.5" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
    <circle cx="16" cy="19" r="1.25" fill="#ffffff" />
  `,
  
  // Cruz limpia para rechazada
  gray: `
    <path d="M11.5 11l9 9M20.5 11l-9 9" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
  `,
  
  // Mini círculo para blanco
  white: `
    <circle cx="16" cy="15.5" r="4.5" fill="#8E8E93" />
  `
};

/**
 * Creates a premium Apple-style linear gradient pin marker with distinct inner symbols.
 * Zero filters or animations. Extremely lightweight SVG.
 * @param variant   Color theme
 * @param size      Outer diameter in px (default 34)
 * @param selected  If true, renders larger and adds a selection ring
 */
export function createPremiumMarker(
  variant: MarkerVariant = 'green',
  size = 34,
  selected = false
): L.DivIcon {
  const c = VARIANTS[variant];
  const s = selected ? Math.round(size * 1.25) : size;
  
  // viewBox mapping to 32x38
  const w = s;
  const h = Math.round(s * (38 / 32));
  
  const cx = w / 2;
  const id = `lg-${variant}`;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 32 38" style="overflow: visible;">
  <defs>
    <!-- Hardware-friendly linear gradient for deep contrast colors -->
    <linearGradient id="${id}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${c.start}"/>
      <stop offset="100%" stop-color="${c.end}"/>
    </linearGradient>
  </defs>
  
  <!-- Hardware-friendly selection glow ring -->
  ${selected ? `<circle cx="16" cy="15.5" r="20" fill="none" stroke="${c.start}" stroke-width="2.5" opacity="0.38" />` : ''}
  
  <!-- Modern 2.5D teardrop pin with brilliant white stroke -->
  <path 
    d="M16 2C8.8 2 3 7.8 3 15c0 7.8 11.2 20.3 12 21.2.5.6 1.5.6 2 0 0.8-.9 12-13.4 12-21.2C30 7.8 24.2 2 16 2z" 
    fill="url(#${id})" 
    stroke="${c.border}" 
    stroke-width="1.8" 
    stroke-linejoin="round"
  />
  
  <!-- High fidelity white outline icon inside -->
  ${ICONS[variant] || ''}
</svg>`.trim();

  return L.divIcon({
    html: svg,
    className: 'custom-leaflet-marker-premium',
    iconSize: [w, h],
    iconAnchor: [cx, h],
    popupAnchor: [0, -h + 2],
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


