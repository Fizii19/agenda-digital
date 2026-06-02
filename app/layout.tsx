import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { FeedbackProvider } from '@/components/shared/FeedbackProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EduAgenda - Agenda Kelas Digital',
  description: 'Sistem Manajemen Agenda Kelas Sekolah',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <FeedbackProvider>{children}</FeedbackProvider>
      </body>
    </html>
  );
}
