import { useState } from 'react';
import { MapPin, ArrowRight, X, AlertCircle } from 'lucide-react';

interface Props {
  onSelect: (lat: number, lng: number) => void;
  theme?: 'dark' | 'light';
  className?: string;
}

const LAT_MX = { min: 14.5, max: 32.7 };
const LNG_MX = { min: -118.4, max: -86.7 };

export default function CoordenadasGPSInput({ onSelect, theme = 'dark', className = '' }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [error, setError] = useState('');

  const limpiar = () => { setLat(''); setLng(''); setError(''); setAbierto(false); };

  const aplicar = () => {
    const la = parseFloat(lat.replace(',', '.'));
    const lo = parseFloat(lng.replace(',', '.'));
    if (isNaN(la) || isNaN(lo)) { setError('Ingresa valores numéricos válidos.'); return; }
    if (la < LAT_MX.min || la > LAT_MX.max) { setError(`Latitud fuera de México (${LAT_MX.min}–${LAT_MX.max}).`); return; }
    if (lo < LNG_MX.min || lo > LNG_MX.max) { setError(`Longitud fuera de México (${LNG_MX.min}–${LNG_MX.max}).`); return; }
    setError('');
    onSelect(la, lo);
    limpiar();
  };

  const dark = theme === 'dark';

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
          dark
            ? 'bg-white shadow-md text-[#1A5C38] hover:bg-gray-50'
            : 'bg-[#f0f9f4] ring-1 ring-[#1A5C38]/20 text-[#1A5C38] hover:bg-[#e3f5ea]'
        } ${className}`}
      >
        <MapPin size={12} />
        Coordenadas GPS
      </button>
    );
  }

  return (
    <div
      className={`rounded-2xl p-3 ${
        dark
          ? 'bg-black/65 backdrop-blur-xl ring-1 ring-white/15'
          : 'bg-white ring-1 ring-gray-200 shadow-md'
      } ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <MapPin size={13} className={dark ? 'text-green-400' : 'text-[#1A5C38]'} />
          <span className={`text-xs font-bold ${dark ? 'text-white/90' : 'text-slate-700'}`}>
            Coordenadas GPS
          </span>
        </div>
        <button
          onClick={limpiar}
          className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
            dark ? 'hover:bg-white/15 text-white/50 hover:text-white/80' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
          }`}
        >
          <X size={11} />
        </button>
      </div>

      {/* Inputs */}
      <div className="flex gap-2 mb-2">
        <div className="flex-1">
          <label className={`block text-[10px] font-semibold uppercase tracking-wide mb-1 ${dark ? 'text-white/50' : 'text-gray-400'}`}>
            Latitud
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={lat}
            onChange={e => { setLat(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && aplicar()}
            placeholder="19.4326"
            className={`w-full text-sm font-mono rounded-xl px-3 py-2 focus:outline-none transition-all ${
              dark
                ? 'bg-white/10 ring-1 ring-white/20 text-white placeholder-white/25 focus:ring-white/40'
                : 'bg-gray-50 ring-1 ring-gray-200 text-slate-800 placeholder-gray-300 focus:ring-[#1A5C38]/40'
            }`}
          />
        </div>
        <div className="flex-1">
          <label className={`block text-[10px] font-semibold uppercase tracking-wide mb-1 ${dark ? 'text-white/50' : 'text-gray-400'}`}>
            Longitud
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={lng}
            onChange={e => { setLng(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && aplicar()}
            placeholder="-99.1332"
            className={`w-full text-sm font-mono rounded-xl px-3 py-2 focus:outline-none transition-all ${
              dark
                ? 'bg-white/10 ring-1 ring-white/20 text-white placeholder-white/25 focus:ring-white/40'
                : 'bg-gray-50 ring-1 ring-gray-200 text-slate-800 placeholder-gray-300 focus:ring-[#1A5C38]/40'
            }`}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 mb-2 text-red-400 text-[11px]">
          <AlertCircle size={11} className="shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={aplicar}
        disabled={!lat.trim() || !lng.trim()}
        className={`w-full flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold disabled:opacity-30 active:scale-[0.98] transition-all ${
          dark
            ? 'bg-green-500 hover:bg-green-400 text-white shadow-lg shadow-green-900/30'
            : 'bg-[#1A5C38] hover:bg-[#16502f] text-white'
        }`}
      >
        Ir al lugar <ArrowRight size={13} />
      </button>
    </div>
  );
}
