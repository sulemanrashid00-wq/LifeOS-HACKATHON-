import './globals.css';
import 'leaflet/dist/leaflet.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LIFEOS | Autonomous Emergency Operating System',
  description: 'Defense-grade AI rescue coordination system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark bg-[#030712]">
      <body className="bg-[#030712] text-slate-100 min-h-screen antialiased overflow-hidden m-0 p-0 font-sans">
        {children}
      </body>
    </html>
  );
}