'use client';
import { useState, useEffect } from 'react';
import { School, Users, GraduationCap, ArrowRight, LayoutGrid, BookOpen, Calendar, DoorOpen } from 'lucide-react';
import StatCard from '@/components/shared/StatCard';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import { getKelasList } from '@/app/actions/kelas';
import { getGuruList } from '@/app/actions/mapel';
import prisma from '@/lib/prisma'; // Note: This is a client component, we should ideally use actions

// Simple placeholder for real counts until we have more actions
export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalKelas: 0,
    totalGuru: 0,
    totalSiswa: 0,
    totalMapel: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, we'd fetch these from a dedicated dashboard action
    // For now, let's keep it simple and clean
    const fetchStats = async () => {
      setLoading(false);
    };
    fetchStats();
  }, []);

  const quickLinks = [
    { title: 'Manajemen Kelas', desc: 'Kelola data rombel dan wali kelas', icon: School, href: '/admin/kelas', color: 'bg-indigo-50 text-indigo-600' },
    { title: 'Data Guru', desc: 'Atur penugasan dan akun pengajar', icon: Users, href: '/admin/guru', color: 'bg-emerald-50 text-emerald-600' },
    { title: 'Data Siswa', desc: 'Kelola identitas dan angkatan siswa', icon: GraduationCap, href: '/admin/siswa', color: 'bg-sky-50 text-sky-600' },
    { title: 'Mata Pelajaran', desc: 'Atur mapel dan pengampu per kelas', icon: BookOpen, href: '/admin/mapel', color: 'bg-amber-50 text-amber-600' },
    { title: 'Jadwal Pelajaran', desc: 'Susun jadwal mingguan per kelas', icon: Calendar, href: '/admin/jadwal', color: 'bg-rose-50 text-rose-600' },
    { title: 'Manajemen Ruangan', desc: 'Kelola ruang kelas dan laboratorium', icon: DoorOpen, href: '/admin/ruangan', color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard Admin</h1>
        <p className="text-base text-gray-500 mt-2">Selamat datang di pusat kendali EduAgenda. Kelola data sekolah dengan lebih efisien.</p>
      </div>

      {/* Stat Cards Section - More focused */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="transform hover:scale-[1.02] transition-all">
          <StatCard title="Total Kelas" value={8} icon={School} color="indigo" description="Kelas terdaftar aktif" />
        </div>
        <div className="transform hover:scale-[1.02] transition-all">
          <StatCard title="Total Guru" value={45} icon={Users} color="emerald" description="Tenaga pengajar" />
        </div>
        <div className="transform hover:scale-[1.02] transition-all">
          <StatCard title="Total Siswa" value={291} icon={GraduationCap} color="sky" description="Siswa terdaftar" />
        </div>
      </div>

      {/* Quick Navigation Section - The New Hero */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <LayoutGrid className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-bold text-gray-800">Akses Cepat Manajemen</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className="group block">
              <Card className="h-full hover:border-[#4F46E5] hover:shadow-md transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl ${link.color} group-hover:scale-110 transition-transform`}>
                    <link.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 group-hover:text-[#4F46E5] transition-colors">{link.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{link.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#4F46E5] group-hover:translate-x-1 transition-all mt-1" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Modern Info Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="relative overflow-hidden rounded-3xl bg-[#4F46E5] p-8 text-white shadow-xl shadow-indigo-100">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">Panduan Integrasi Data</h3>
              </div>
              <p className="text-indigo-100 text-sm leading-relaxed mb-6 max-w-xl">
                Untuk memastikan sistem berjalan optimal, ikuti alur pendataan berikut: 
                Mulai dari <strong>Manajemen Ruangan</strong>, lalu buat <strong>Kelas</strong>, tambahkan <strong>Mata Pelajaran</strong>, dan terakhir susun <strong>Jadwal</strong>.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/admin/mapel" className="inline-flex items-center gap-2 text-sm font-semibold bg-white text-[#4F46E5] px-5 py-2.5 rounded-xl hover:bg-indigo-50 transition-all shadow-sm">
                  Cek Penugasan Guru <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/admin/jadwal" className="inline-flex items-center gap-2 text-sm font-semibold bg-indigo-500/50 backdrop-blur-sm text-white border border-white/20 px-5 py-2.5 rounded-xl hover:bg-indigo-500/70 transition-all">
                  Lihat Jadwal
                </Link>
              </div>
            </div>
            {/* Abstract Background Elements */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 bg-black/10 rounded-full blur-3xl" />
          </div>
        </div>
        
        <div className="bg-white rounded-3xl border border-gray-100 p-8 flex flex-col items-center text-center justify-center shadow-sm">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 text-amber-600">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Pusat Bantuan</h3>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Butuh bantuan teknis atau menemukan kendala data?
          </p>
          <button className="mt-5 w-full py-3 px-4 bg-gray-50 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-100 transition-colors border border-gray-100">
            Hubungi Admin IT
          </button>
        </div>
      </div>
    </div>
  );
}
