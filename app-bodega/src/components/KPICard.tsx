import { type ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendText?: string;
  color?: 'green' | 'yellow' | 'red' | 'blue';
  onClick?: () => void;
}

const iconBg: Record<string, string> = {
  green: 'bg-[#1A5C38]/10 text-[#1A5C38]',
  yellow: 'bg-amber-500/10 text-amber-600',
  red: 'bg-red-500/10 text-red-500',
  blue: 'bg-blue-500/10 text-blue-600',
};

const TrendIcon = { up: TrendingUp, down: TrendingDown, neutral: Minus };
const trendColor = { up: 'text-[#1A5C38]', down: 'text-red-500', neutral: 'text-gray-400' };

export function KPICard({ title, value, subtitle, icon, trend, trendText, color = 'green', onClick }: KPICardProps) {
  const TIcon = trend ? TrendIcon[trend] : null;
  return (
    <div
      className={`bg-white/90 backdrop-blur-xl rounded-[1.25rem] border border-black/[0.04] p-3.5 sm:p-4 flex flex-col gap-1.5 sm:gap-2
        shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-black/[0.08] hover:-translate-y-0.5
        ${onClick ? 'cursor-pointer active:scale-[0.98] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] select-none group' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] sm:text-[12px] font-bold text-gray-400/90 uppercase tracking-widest leading-none transition-colors duration-300 group-hover:text-emerald-600/80">{title}</p>
        {icon && (
          <span className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110 group-hover:rotate-6 ${iconBg[color]}`}>
            {icon}
          </span>
        )}
      </div>
      <p className="text-[22px] sm:text-[26px] font-black text-gray-900 leading-none tracking-tight">{value}</p>
      {trendText && trend && TIcon && (
        <p className={`text-[11px] sm:text-[12px] font-semibold flex items-center gap-1 ${trendColor[trend]}`}>
          <TIcon size={14} /> {trendText}
        </p>
      )}
      {subtitle && <div className="text-[11px] sm:text-[12px] text-gray-400/90 leading-snug">{subtitle}</div>}
    </div>
  );
}
