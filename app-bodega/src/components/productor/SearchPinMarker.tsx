import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface Props {
  position: [number, number];
}

// Pin SVG estilo Google Maps — teardrop con sombra y punto blanco interior
const PIN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
  <defs>
    <filter id="shadow" x="-30%" y="-10%" width="160%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#00000055"/>
    </filter>
  </defs>
  <!-- Cuerpo del pin -->
  <path d="M18 2C10.27 2 4 8.27 4 16c0 11.25 14 30 14 30S32 27.25 32 16C32 8.27 25.73 2 18 2z"
        fill="#1A5C38" filter="url(#shadow)"/>
  <!-- Borde blanco -->
  <path d="M18 3.5C11.1 3.5 5.5 9.1 5.5 16c0 10.5 12.5 27.5 12.5 27.5S30.5 26.5 30.5 16C30.5 9.1 24.9 3.5 18 3.5z"
        fill="none" stroke="white" stroke-width="1.5" opacity="0.9"/>
  <!-- Punto interior blanco -->
  <circle cx="18" cy="16" r="5.5" fill="white" opacity="0.95"/>
  <!-- Punto interior verde -->
  <circle cx="18" cy="16" r="3" fill="#1A5C38"/>
</svg>
`.trim();

const ICON = L.divIcon({
  html: PIN_SVG,
  className: '',
  iconSize: [36, 48],
  iconAnchor: [18, 48],
  popupAnchor: [0, -48],
});

export default function SearchPinMarker({ position }: Props) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    const marker = L.marker(position, { icon: ICON, zIndexOffset: 1000 });

    // Animación de caída
    const el = marker.getElement?.();
    if (el) {
      el.style.transition = 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)';
      el.style.transform = 'translateY(-20px)';
      requestAnimationFrame(() => {
        if (el) el.style.transform = 'translateY(0)';
      });
    }

    marker.addTo(map);
    markerRef.current = marker;

    return () => {
      marker.remove();
      markerRef.current = null;
    };
  }, [map, position]);

  return null;
}
