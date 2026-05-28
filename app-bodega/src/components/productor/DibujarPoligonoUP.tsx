import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import * as turf from '@turf/turf';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';

interface Props {
  poligonoInicial?: [number, number][];
  onPoligonoCompleto: (
    coordenadas: [number, number][],
    centroide: { lat: number; lng: number },
    areaHa: number
  ) => void;
  onPoligonoEliminado: () => void;
}

export default function DibujarPoligonoUP({
  poligonoInicial,
  onPoligonoCompleto,
  onPoligonoEliminado,
}: Props) {
  const map = useMap();
  const drawnItemsRef = useRef(new L.FeatureGroup());
  const controlRef = useRef<any>(null);

  useEffect(() => {
    const drawnItems = drawnItemsRef.current;
    map.addLayer(drawnItems);

    if (poligonoInicial && poligonoInicial.length >= 3) {
      const latlngs = poligonoInicial.map(([lat, lng]) => [lat, lng] as L.LatLngTuple);
      const poly = L.polygon(latlngs, {
        color: '#1A5C38',
        fillColor: '#1A5C38',
        fillOpacity: 0.2,
        weight: 2,
      });
      drawnItems.addLayer(poly);
      map.fitBounds(poly.getBounds(), { padding: [40, 40] });
    }

    const drawControl = new (L as any).Control.Draw({
      position: 'topright',
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          metric: true,
          shapeOptions: {
            color: '#1A5C38',
            fillColor: '#1A5C38',
            fillOpacity: 0.2,
            weight: 2,
          },
          drawError: {
            color: '#e1e100',
            message: '<strong>Error:</strong> Los lados no pueden cruzarse.',
          },
        },
        polyline: false,
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });

    controlRef.current = drawControl;
    map.addControl(drawControl);

    map.on((L as any).Draw.Event.CREATED, (e: any) => {
      drawnItems.clearLayers();
      drawnItems.addLayer(e.layer);

      const latlngs: [number, number][] = e.layer.getLatLngs()[0].map(
        (p: L.LatLng) => [p.lat, p.lng] as [number, number]
      );

      const turfPolygon = turf.polygon([[
        ...latlngs.map(([lat, lng]) => [lng, lat]),
        [latlngs[0][1], latlngs[0][0]],
      ]]);
      const areaHa = parseFloat((turf.area(turfPolygon) / 10000).toFixed(4));
      const centroide = e.layer.getBounds().getCenter();
      onPoligonoCompleto(latlngs, { lat: centroide.lat, lng: centroide.lng }, areaHa);
    });

    map.on((L as any).Draw.Event.DELETED, () => {
      onPoligonoEliminado();
    });

    return () => {
      if (controlRef.current) map.removeControl(controlRef.current);
      map.removeLayer(drawnItems);
      map.off((L as any).Draw.Event.CREATED);
      map.off((L as any).Draw.Event.DELETED);
    };
  }, [map]);

  return null;
}
