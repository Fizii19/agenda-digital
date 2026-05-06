import Card from '../ui/Card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky';
}

const colors = {
  indigo: 'bg-indigo-50 text-[#4F46E5]',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  sky: 'bg-sky-50 text-sky-600',
};

export default function StatCard({ title, value, icon: Icon, trend, color = 'indigo' }: StatCardProps) {
  return (
    <Card hover>
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {trend && (
            <p className={cn('text-xs font-medium', trend.isPositive ? 'text-emerald-600' : 'text-rose-600')}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% dari bulan lalu
            </p>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', colors[color])}><Icon className="w-5 h-5" /></div>
      </div>
    </Card>
  );
}