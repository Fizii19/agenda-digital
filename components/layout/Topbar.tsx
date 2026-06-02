'use client';
import { Search, Bell, Menu, LogOut, User, Settings, Loader2, School } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { User as UserType } from '@/lib/types';
import { logoutAction, globalSearch } from '@/app/actions/agenda';

interface TopbarProps {
  onMenuClick: () => void;
  user: UserType;
}

export default function Topbar({ onMenuClick, user }: TopbarProps) {
  const router = useRouter();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logoutAction();
    router.push('/');
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        const res = await globalSearch(searchQuery);
        if (res.success) {
          setSearchResults(res.results);
          setShowResults(true);
        }
        setIsSearching(false);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-xl hover:bg-gray-100"><Menu className="w-5 h-5 text-gray-600" /></button>
        <div className="hidden sm:flex items-center gap-3 flex-1 max-w-md ml-4 lg:ml-0 relative" ref={searchRef}>
          <div className="relative flex-1 group">
            {isSearching ? (
              <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4F46E5] animate-spin" />
            ) : (
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#4F46E5] transition-colors" />
            )}
            <input 
              type="text" 
              placeholder="Cari agenda, kelas, siswa..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#4F46E5] focus:ring-4 focus:ring-indigo-50 focus:bg-white outline-none transition-all" 
            />
          </div>

          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200">
              {searchResults.map((res, i) => (
                <button
                  key={`${res.type}-${res.id}-${i}`}
                  onClick={() => {
                    router.push(res.href);
                    setShowResults(false);
                    setSearchQuery('');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                    {res.type === 'agenda' && <Calendar className="w-4 h-4 text-[#4F46E5]" />}
                    {res.type === 'user' && <User className="w-4 h-4 text-[#4F46E5]" />}
                    {res.type === 'kelas' && <School className="w-4 h-4 text-[#4F46E5]" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{res.title}</p>
                    <p className="text-xs text-gray-500 capitalize">{res.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {showResults && searchResults.length === 0 && !isSearching && searchQuery.length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="text-sm text-gray-500">Tidak ada hasil ditemukan untuk "{searchQuery}"</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5 text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-gray-50"><p className="text-sm font-semibold text-gray-800">Notifikasi</p></div>
                <div className="max-h-64 overflow-y-auto">
                  {[
                    { title: 'Agenda baru ditambahkan', desc: 'Ulangan Harian Matematika - XII IPA 1', time: '5 menit lalu' },
                    { title: 'Presensi diperbarui', desc: '3 siswa alpha hari ini', time: '1 jam lalu' },
                    { title: 'Laporan siap dicetak', desc: 'Laporan bulanan Mei 2026', time: '3 jam lalu' },
                  ].map((n, i) => (
                    <div key={i} className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                      <p className="text-sm font-medium text-gray-700">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{n.desc}</p>
                      <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button onClick={() => setShowProfile(!showProfile)} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="w-8 h-8 bg-[#4F46E5] rounded-full flex items-center justify-center text-white text-xs font-bold">{user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</div>
              <div className="hidden md:block text-left"><p className="text-sm font-medium text-gray-700 leading-tight">{user.name}</p><p className="text-xs text-gray-400 capitalize">{user.role}</p></div>
            </button>
            {showProfile && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-gray-50"><p className="text-sm font-semibold text-gray-800">{user.name}</p><p className="text-xs text-gray-500">{user.email}</p></div>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"><User className="w-4 h-4" /> Profil</button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"><Settings className="w-4 h-4" /> Pengaturan</button>
                <div className="border-t border-gray-50 mt-1 pt-1">
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"><LogOut className="w-4 h-4" /> Keluar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}