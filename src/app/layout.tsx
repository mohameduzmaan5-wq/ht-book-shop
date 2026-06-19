import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BookShop ERP | Enterprise Management System',
  description:
    'Modern enterprise-grade bookshop management system with multi-branch control, real-time analytics, and premium POS. Manage inventory, employees, and sales across all your branches.',
  keywords: [
    'bookshop ERP',
    'book store management',
    'multi-branch POS',
    'inventory management',
    'retail analytics',
  ],
  authors: [{ name: 'BookShop ERP' }],
  robots: 'noindex, nofollow',
  openGraph: {
    title: 'BookShop ERP | Enterprise Management System',
    description:
      'Modern enterprise-grade bookshop management system with multi-branch control.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-[#0A0A0F] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
