interface Props {
  icono: string;
  texto: string;
  subtexto?: string;
  onClick: () => void;
  disabled?: boolean;
  variante?: 'primary' | 'secondary';
}

export default function BotonGrande({ icono, texto, subtexto, onClick, disabled, variante = 'primary' }: Props) {
  const base = variante === 'primary'
    ? 'bg-[#1A5C38] text-white shadow-lg shadow-green-900/20'
    : 'bg-white text-gray-800 border-2 border-gray-200';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-5 rounded-2xl text-lg font-bold
        flex items-center justify-center gap-3 transition-all
        active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed
        ${base}`}
    >
      <span className="text-2xl">{icono}</span>
      <div className="text-left">
        <p className="leading-tight">{texto}</p>
        {subtexto && <p className="text-xs font-normal opacity-70 mt-0.5">{subtexto}</p>}
      </div>
    </button>
  );
}
