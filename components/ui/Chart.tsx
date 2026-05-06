'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import Card from './Card';

interface BarChartProps {
  data: any[];
  bars: { key: string; color: string; name: string }[];
  xKey: string;
  title: string;
  height?: number;
}

export function BarChartCard({ data, bars, xKey, title, height = 300 }: BarChartProps) {
  return (
    <Card>
      <h3 className="text-base font-semibold text-gray-800 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} barSize={32} barGap={6}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }} />
          <Legend />
          {bars.map((bar) => <Bar key={bar.key} dataKey={bar.key} fill={bar.color} name={bar.name} radius={[6, 6, 0, 0]} />)}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

interface LineChartProps {
  data: any[];
  lines: { key: string; color: string; name: string }[];
  xKey: string;
  title: string;
  height?: number;
}

export function LineChartCard({ data, lines, xKey, title, height = 300 }: LineChartProps) {
  return (
    <Card>
      <h3 className="text-base font-semibold text-gray-800 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }} />
          <Legend />
          {lines.map((line) => <Line key={line.key} type="monotone" dataKey={line.key} stroke={line.color} name={line.name} strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />)}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}