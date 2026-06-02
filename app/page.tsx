'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { School, User, Lock, ArrowRight, ChevronDown } from 'lucide-react';
import { Role } from '@/lib/types';
import { loginAction } from '@/app/actions/agenda';

const roleLabels: Record<Role, string> = { admin: 'Admin Sekolah', sekretaris: 'Sekretaris', walikelas: 'Wali Kelas', pimpinan: 'Pimpinan Sekolah', siswa: 'Siswa', guru: 'Guru Mapel' };
const roleDashboards: Record<Role, string> = { admin: '/admin', sekretaris: '/sekretaris', walikelas: '/walikelas', pimpinan: '/pimpinan', siswa: '/siswa', guru: '/guru' };

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role>('admin');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await loginAction(identifier, selectedRole);

    if (result.success && result.role) {
      router.push(roleDashboards[result.role]);
    } else {
      setError(result.error || 'Login gagal.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-md relative">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#4F46E5] rounded-2xl shadow-lg shadow-indigo-200 mb-4">
            <School className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">EduAgenda</h1>
          <p className="text-sm text-gray-500 mt-1">Sistem Agenda Kelas Digital</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Masuk ke Akun</h2>

          {/* Role Selector */}
          <div className="relative mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Peran</label>
            <button onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 hover:border-[#4F46E5] transition-all focus:ring-2 focus:ring-indigo-100 outline-none">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#4F46E5]" />
                {roleLabels[selectedRole]}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            {showRoleDropdown && (
              <div className="absolute top-full mt-1 w-full bg-white rounded-xl border border-gray-100 shadow-lg z-10 py-1 animate-in fade-in slide-in-from-top-2">
                {(Object.keys(roleLabels) as Role[]).map((role) => (
                  <button key={role} onClick={() => { setSelectedRole(role); setShowRoleDropdown(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-indigo-50 hover:text-[#4F46E5] transition-colors flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${selectedRole === role ? 'bg-[#4F46E5]' : 'bg-gray-300'}`} />
                    {roleLabels[role]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">NIS / NIP</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Masukkan NIS atau NIP" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100 outline-none transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100 outline-none transition-all" />
              </div>
            </div>
            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-xl border border-red-100">{error}</div>}
            <button type="submit" disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#4F46E5] text-white py-3 rounded-xl font-medium text-sm hover:bg-[#4338CA] shadow-sm shadow-indigo-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
              {isLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Masuk <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">© 2026 EduAgenda. Seluruh hak cipta dilindungi.</p>
        </div>
      </div>
    </div>
  );
}
