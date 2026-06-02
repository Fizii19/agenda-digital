'use client';
import { Search, Filter, Download } from 'lucide-react';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface SearchFilterProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onExport?: () => void;
  exportLabel?: string;
  children?: React.ReactNode;
}

export default function SearchFilter({ searchPlaceholder = 'Cari...', searchValue, onSearchChange, onExport, exportLabel = 'Export', children }: SearchFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="flex-1"><Input leftIcon={<Search className="w-4 h-4" />} placeholder={searchPlaceholder} value={searchValue} onChange={(e) => onSearchChange(e.target.value)} /></div>
      <div className="flex gap-2">
        {children}
        {onExport && <Button variant="outline" leftIcon={<Download className="w-4 h-4" />} onClick={onExport}>{exportLabel}</Button>}
        <Button variant="outline" leftIcon={<Filter className="w-4 h-4" />}>Filter</Button>
      </div>
    </div>
  );
}