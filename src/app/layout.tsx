import '@/styles/globals.css';

import { Inter } from 'next/font/google';

import { cn } from '@/lib/tailwind/merge';
import { Navbar } from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Gumball',
  description: 'Application to track recurrent expenses',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn('bg-white text-slate-900 antialiased', inter.className)}>
      <body className="min-h-full bg-slate-50 pt-12 antialiased">
        <Navbar />
        <div className="container mx-auto h-full max-w-7xl pt-12">{children}</div>
      </body>
    </html>
  );
}
