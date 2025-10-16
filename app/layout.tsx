import type React from 'react';
import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { QueryClientProvider } from '@/module/query/QueryClientProvider';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'Open Hyperfolio',
  description: 'Track your Hyperliquid portfolio',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} antialiased`}>
      <body className="font-mono">
        <QueryClientProvider>{children}</QueryClientProvider>
      </body>
    </html>
  );
}
