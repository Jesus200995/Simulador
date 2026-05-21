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

const colorMap = {
  green: 'bg-green-50 border-green-200',
  yellow: 'bg-yellow-50 border-yellow-200',
  red: 'bg-red-50 border-red-200',
  blue: 'bg-blue-50 border-blue-200',
};

const trendColor = { up: 'text-green-600', down: 'text-red-500', neutral: 'text-gray-400' };

export function KPICard({ title, value, subtitle, icon, trend, trendText, color = 'green', onClick }: KPICardProps) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-sm ${colorMap[color]} ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
        {icon && <span className="text-gray-400">{icon}</span>}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {trendText && trend && (
        <p className={`text-xs font-medium mt-1 ${trendColor[trend]}`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '—'} {trendText}
        </p>
      )}
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}
