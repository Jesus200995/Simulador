export default function DisponibilidadStepper({ paso }: { paso: 1 | 2 | 3 }) {
  const labels = ['Tipo', 'Variedad', 'Volumen y fecha'];
  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-center gap-2">
        {([1, 2, 3] as const).map(n => (
          <div key={n} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center
              text-sm font-bold transition-all
              ${n < paso  ? 'bg-[#1A5C38] text-white'
              : n === paso ? 'bg-[#1A5C38] text-white ring-4 ring-green-100'
              : 'bg-gray-200 text-gray-400'}`}>
              {n < paso ? '✓' : n}
            </div>
            {n < 3 && (
              <div className={`h-0.5 w-8 transition-all
                ${n < paso ? 'bg-[#1A5C38]' : 'bg-gray-200'}`}
              />
            )}
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-gray-400 mt-2">{labels[paso - 1]}</p>
    </div>
  );
}
