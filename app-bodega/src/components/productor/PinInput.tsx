import { Delete } from 'lucide-react';

interface PinInputProps {
  value: string;
  onChange: (pin: string) => void;
  /** Pinta los puntos en rojo y aplica una animación de sacudida. */
  error?: boolean;
  /** Pinta los puntos en verde (PIN confirmado correctamente). */
  success?: boolean;
  /** Variante para fondo oscuro (puntos claros). Por defecto: claro. */
  dark?: boolean;
}

export default function PinInput({ value, onChange, error, success, dark }: PinInputProps) {
  const keys: (number | string)[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'];

  const handlePress = (key: number | string) => {
    if (navigator.vibrate) navigator.vibrate(8);
    if (key === 'del') onChange(value.slice(0, -1));
    else if (typeof key === 'number' && value.length < 4) onChange(value + key);
  };

  const dotBase = 'w-4 h-4 sm:w-[18px] sm:h-[18px] rounded-full ring-2 transition-all duration-200';
  const filledColor = success ? 'bg-[#34d079] ring-[#34d079]' : error ? 'bg-red-500 ring-red-500' : 'bg-[#1A5C38] ring-[#1A5C38]';
  const emptyColor = dark ? 'ring-white/30 bg-transparent' : 'ring-zinc-300 bg-white';

  const keyDark = 'bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15 active:bg-white/25';
  const keyLight = 'bg-white text-zinc-800 ring-1 ring-zinc-200 shadow-sm hover:bg-zinc-50';
  const delDark = 'bg-white/5 text-white/70 hover:bg-white/10';
  const delLight = 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200';

  return (
    <div className={error ? 'animate-shake' : ''}>
      <div className="flex justify-center gap-4 sm:gap-4 mb-8 sm:mb-10">
        {[0, 1, 2, 3].map(i => (
          <div key={i}
            className={`${dotBase} ${i < value.length ? `${filledColor} scale-110` : emptyColor}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 max-w-[280px] sm:max-w-xs mx-auto">
        {keys.map((k, i) => (
          <button key={i} type="button" onClick={() => handlePress(k)}
            disabled={k === ''}
            className={`h-[58px] sm:h-16 rounded-2xl text-xs font-semibold
              active:scale-90 transition-all duration-150 select-none flex items-center justify-center
              ${k === '' ? 'invisible'
                : k === 'del' ? (dark ? delDark : delLight)
                : (dark ? keyDark : keyLight)}`}
          >
            {k === 'del' ? <Delete size={13} /> : k}
          </button>
        ))}
      </div>
    </div>
  );
}
