import { type ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';

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
  green: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20',
  yellow: 'bg-amber-500/10 text-amber-600 ring-amber-500/20',
  red: 'bg-red-500/10 text-red-600 ring-red-500/20',
  blue: 'bg-blue-500/10 text-blue-600 ring-blue-500/20',
};

const gradientBg: Record<string, string> = {
  green: 'from-emerald-50/50 to-transparent',
  yellow: 'from-amber-50/50 to-transparent',
  red: 'from-red-50/50 to-transparent',
  blue: 'from-blue-50/50 to-transparent',
};

const TrendIcon = { up: TrendingUp, down: TrendingDown, neutral: Minus };
const trendColor = { up: 'text-[#1e5b4f]', down: 'text-red-500', neutral: 'text-gray-400' };

export function KPICard({ title, value, subtitle, icon, trend, trendText, color = 'green', onClick }: KPICardProps) {
  const TIcon = trend ? TrendIcon[trend] : null;
  return (
    <div
      className={`relative overflow-hidden bg-white/95 backdrop-blur-2xl rounded-[1.5rem] border border-black/[0.04] p-5 sm:p-6 flex flex-col justify-between min-h-[140px]
        shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] hover:border-black/[0.08] hover:-translate-y-1
        ${onClick ? 'cursor-pointer active:scale-[0.98] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] select-none group' : ''}`}
      onClick={onClick}
    >
      {/* Subtle corner gradient */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${gradientBg[color]} opacity-50 rounded-bl-[4rem] pointer-events-none transition-opacity duration-500 group-hover:opacity-100`} />
      
      <div className="flex items-start justify-between relative z-10 gap-3">
        <p className="text-[13px] font-bold text-gray-500 uppercase tracking-wide leading-snug transition-colors duration-300 group-hover:text-gray-800">{title}</p>
        {icon && (
          <span className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ring-1 shadow-sm transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110 group-hover:-rotate-3 group-hover:shadow-md bg-white ${iconBg[color]}`}>
            {icon}
          </span>
        )}
      </div>
      
      <div className="mt-3 relative z-10">
        <p className="text-[28px] sm:text-[32px] font-black text-gray-900 leading-none tracking-tight">{value}</p>
        
        {trendText && trend && TIcon && (
          <p className={`text-[12px] font-bold flex items-center gap-1 mt-2 ${trendColor[trend]}`}>
            <TIcon size={16} strokeWidth={2.5} /> {trendText}
          </p>
        )}
        
        {subtitle && (
          <div className="text-[12px] text-gray-500 font-medium leading-relaxed mt-2 opacity-90 group-hover:opacity-100 transition-opacity">
            {subtitle}
          </div>
        )}
      </div>

      {onClick && (
        <div className="absolute bottom-5 right-5 opacity-0 -translate-x-2 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:opacity-100 group-hover:translate-x-0">
          <ChevronRight size={20} className="text-gray-300 group-hover:text-emerald-500" />
        </div>
      )}
    </div>
  );
}
