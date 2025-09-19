'use client';

import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import "./globals.css";

export const dynamic = 'force-dynamic';


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`antialiased`}
      >
        <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
      </body>
    </html>
  );
}
