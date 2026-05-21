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
  green: 'bg-[#1A5C38]/[0.08] text-[#1A5C38]',
  yellow: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-500',
  blue: 'bg-blue-50 text-blue-600',
};

const TrendIcon = { up: TrendingUp, down: TrendingDown, neutral: Minus };
const trendColor = { up: 'text-[#1A5C38]', down: 'text-red-500', neutral: 'text-gray-400' };

export function KPICard({ title, value, subtitle, icon, trend, trendText, color = 'green', onClick }: KPICardProps) {
  const TIcon = trend ? TrendIcon[trend] : null;
  return (
    <div
      className={`bg-white rounded-2xl border border-black/[0.06] p-4 flex flex-col gap-2
        shadow-[0_1px_4px_rgba(0,0,0,0.06)]
        ${onClick ? 'cursor-pointer active:scale-[0.97] transition-transform select-none' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest leading-none">{title}</p>
        {icon && (
          <span className={`w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 ${iconBg[color]}`}>
            {icon}
          </span>
        )}
      </div>
      <p className="text-[28px] font-black text-gray-900 leading-none tracking-tight">{value}</p>
      {trendText && trend && TIcon && (
        <p className={`text-[11px] font-semibold flex items-center gap-1 ${trendColor[trend]}`}>
          <TIcon size={12} /> {trendText}
        </p>
      )}
      {subtitle && <div className="text-[11px] text-gray-400 leading-snug">{subtitle}</div>}
    </div>
  );
}
