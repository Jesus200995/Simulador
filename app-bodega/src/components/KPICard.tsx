import { type ReactNode } from 'react';

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
  yellow: 'bg-yellow-100 text-yellow-700',
  red: 'bg-red-100 text-red-600',
  blue: 'bg-blue-100 text-blue-600',
};

const trendColor = {
  up: 'text-[#1A5C38]',
  down: 'text-red-500',
  neutral: 'text-gray-400',
};

export function KPICard({ title, value, subtitle, icon, trend, trendText, color = 'green', onClick }: KPICardProps) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-black/5 p-4 ${onClick ? 'cursor-pointer active:scale-[0.97] transition-transform' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2.5">
        <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide leading-tight flex-1 pr-2">{title}</p>
        {icon && (
          <span className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${iconBg[color]}`}>
            {icon}
          </span>
        )}
      </div>
      <p className="text-[26px] font-bold text-gray-900 leading-none">{value}</p>
      {trendText && trend && (
        <p className={`text-[12px] font-semibold mt-1.5 ${trendColor[trend]}`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '—'} {trendText}
        </p>
      )}
      {subtitle && <div className="text-[12px] text-gray-500 mt-1.5">{subtitle}</div>}
    </div>
  );
}
