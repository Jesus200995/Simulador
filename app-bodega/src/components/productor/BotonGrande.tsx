import { type ReactNode } from 'react';

interface Props {
  icono: ReactNode;
  texto: string;
  subtexto?: string;
  onClick: () => void;
  disabled?: boolean;
  variante?: 'primary' | 'secondary';
}

export default function BotonGrande({ icono, texto, subtexto, onClick, disabled, variante = 'primary' }: Props) {
  const base = variante === 'primary'
    ? 'bg-[#1A5C38] hover:bg-[#15482d] text-white shadow-lg shadow-green-900/20'
    : 'bg-white hover:bg-zinc-50 text-zinc-800 ring-1 ring-zinc-200';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-5 sm:py-5 rounded-2xl text-xs font-semibold
        flex items-center justify-center gap-3 transition-all duration-200
        active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed
        ${base}`}
    >
      <span className="shrink-0">{icono}</span>
      <div className="text-left">
        <p className="leading-tight">{texto}</p>
        {subtexto && <p className="text-xs font-normal opacity-70 mt-0.5">{subtexto}</p>}
      </div>
    </button>
  );
}
