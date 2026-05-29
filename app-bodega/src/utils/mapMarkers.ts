/**
 * Shared premium map marker factory — Apple 2026 style
 * Optimized for lightweight rendering with zero heavy SVG filters/animations.
 * Uses hardware-accelerated CSS drop-shadows and highly distinct inside symbols.
 */
import L from 'leaflet';

export type MarkerVariant = 'green' | 'amber' | 'blue' | 'red' | 'gray' | 'white';

interface MarkerConfig {
  fill: string;
  border: string;
}

const VARIANTS: Record<MarkerVariant, MarkerConfig> = {
  green:  { fill: '#34C759', border: '#ffffff' }, // Verde esmeralda (Aprobada)
  amber:  { fill: '#FF9500', border: '#ffffff' }, // Ámbar iOS (Pendiente)
  blue:   { fill: '#007AFF', border: '#ffffff' }, // Azul iOS (Productor/Ubicación)
  red:    { fill: '#FF3B30', border: '#ffffff' }, // Rojo iOS (Alerta/Rechazada)
  gray:   { fill: '#8E8E93', border: '#ffffff' }, // Gris iOS (Rechazada/Inactivo)
  white:  { fill: '#ffffff', border: '#8E8E93' }, // Blanco
};

const ICONS: Record<MarkerVariant, string> = {
  // Checkmark para aprobada/verde
  green: `<path d="M11.5 19.5l-4-4 1.5-1.5 2.5 2.5 6-6 1.5 1.5-7.5 7.5z" fill="#ffffff" />`,
  
  // Reloj para pendiente/amber
  amber: `<circle cx="16" cy="15.5" r="6.5" stroke="#ffffff" stroke-width="2" fill="none" /><path d="M16 12v3.5h3" stroke="#ffffff" stroke-width="2" stroke-linecap="round" fill="none" />`,
  
  // Usuario para azul
  blue: `<circle cx="16" cy="12" r="3.5" fill="#ffffff" /><path d="M10 20.5c0-2.5 2.7-4.5 6-4.5s6 2 6 4.5v0.5H10v-0.5z" fill="#ffffff" />`,
  
  // Signo de exclamación para rojo
  red: `<path d="M16 9.5v5" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" /><circle cx="16" cy="18.5" r="1.25" fill="#ffffff" />`,
  
  // Cruz para gray
  gray: `<path d="M11 11l10 10M21 11l-10 10" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />`,
  
  // Círculo pequeño para white
  white: `<circle cx="16" cy="15.5" r="4.5" fill="#8E8E93" />`
};

/**
 * Creates an ultra-performant Apple-style pin marker with distinct inner symbols.
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

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 32 38" style="overflow: visible;">
  <!-- Hardware-friendly selection ring -->
  ${selected ? `<circle cx="16" cy="15.5" r="19.5" fill="none" stroke="${c.fill}" stroke-width="2.5" opacity="0.35" />` : ''}
  
  <!-- Classic teardrop pin with crispy white stroke -->
  <path 
    d="M16 2C8.8 2 3 7.8 3 15c0 7.8 11.2 20.3 12 21.2.5.6 1.5.6 2 0 0.8-.9 12-13.4 12-21.2C30 7.8 24.2 2 16 2z" 
    fill="${c.fill}" 
    stroke="${c.border}" 
    stroke-width="1.8" 
    stroke-linejoin="round"
  />
  
  <!-- Crisp inner vector icon for high distinguishability -->
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

