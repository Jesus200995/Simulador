import { Delete } from 'lucide-react';

interface PinInputProps {
  value: string;
  onChange: (pin: string) => void;
}

export default function PinInput({ value, onChange }: PinInputProps) {
  const keys: (number | string)[] = [1,2,3,4,5,6,7,8,9,'',0,'del'];

  const handlePress = (key: number | string) => {
    if (key === 'del') onChange(value.slice(0, -1));
    else if (typeof key === 'number' && value.length < 4) onChange(value + key);
  };

  return (
    <div>
      <div className="flex justify-center gap-5 mb-10">
        {[0,1,2,3].map(i => (
          <div key={i}
            className={`w-5 h-5 rounded-full ring-2 transition-all duration-200
              ${i < value.length
                ? 'bg-[#1A5C38] ring-[#1A5C38] scale-110'
                : 'ring-zinc-300 bg-white'}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
        {keys.map((k, i) => (
          <button key={i} onClick={() => handlePress(k)}
            disabled={k === ''}
            className={`h-16 rounded-2xl text-2xl font-semibold
              active:scale-90 transition-all duration-150 select-none flex items-center justify-center
              ${k === ''    ? 'invisible'
              : k === 'del' ? 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
              : 'bg-white text-zinc-800 ring-1 ring-zinc-200 shadow-sm hover:bg-zinc-50'}`}
          >
            {k === 'del' ? <Delete size={22} /> : k}
          </button>
        ))}
      </div>
    </div>
  );
}
