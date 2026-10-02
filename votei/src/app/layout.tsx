import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/shared/providers/query-provider';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'VOTEI';

export const metadata: Metadata = {
  title: `${APP_NAME} — moldura da sua foto`,
  description:
    'Põe uma moldura na sua foto com o número em que você votou. Pronto em segundos, pago no Pix.',
  openGraph: {
    title: `${APP_NAME} — moldura da sua foto`,
    description: 'Sua foto com o número do seu voto. Pago no Pix.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // No zoom lock: pinching a photo preview is reasonable.
  themeColor: '#09090b',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  return (
    <html lang={locale} className="dark">
      <body className={`${geistSans.variable} bg-zinc-950 text-zinc-100 antialiased`}>
        <NextIntlClientProvider>
          <QueryProvider>
            {children}
            <Toaster richColors theme="dark" />
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
