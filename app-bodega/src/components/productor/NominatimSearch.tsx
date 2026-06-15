import { useState, useRef } from 'react';
import { Search } from 'lucide-react';

interface Props {
  placeholder: string;
  onSelect: (lat: number, lng: number, nombre: string) => void;
}

export default function NominatimSearch({ placeholder, onSelect }: Props) {
  const [query, setQuery] = useState('');
  interface NominatimResult { lat: string; lon: string; display_name: string; }
  const [resultados, setResultados] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const buscar = (q: string) => {
    setQuery(q);
    clearTimeout(timerRef.current);
    if (q.length < 3) { setResultados([]); return; }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=mx&format=json&limit=5`,
          { headers: { 'Accept-Language': 'es' } }
        );
        setResultados(await res.json());
      } finally { setLoading(false); }
    }, 500);
  };

  return (
    <div className="relative">
      <div className="flex items-center bg-white rounded-xl shadow-md px-3 py-2.5">
        <Search size={12} className="text-gray-400 mr-2" />
        <input
          value={query}
          onChange={e => buscar(e.target.value)}
          placeholder={placeholder}
          className="flex-1 text-xs outline-none bg-transparent"
        />
        {loading && <span className="text-xs text-gray-400">Buscando...</span>}
      </div>

      {resultados.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl
                        shadow-lg z-10 overflow-hidden max-h-60 overflow-y-auto">
          {resultados.map((r, i) => (
            <button key={i}
              onClick={() => {
                onSelect(parseFloat(r.lat), parseFloat(r.lon), r.display_name);
                setResultados([]);
                setQuery(r.display_name.split(',')[0]);
              }}
              className="w-full px-4 py-3 text-left text-xs text-gray-700
                         hover:bg-gray-50 border-b border-gray-100 last:border-0"
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
