import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales, type Locale } from '@/i18n/config'
import "../globals.css";
import TopBar from "@/components/TopBar";
import { AuthProvider } from "@/components/providers/AuthProvider";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  const t = await getTranslations({ locale: lang, namespace: 'Metadata' })

  return {
    title: t('title'),
    description: t('description'),
    icons: {
      icon: '/assets/logo.png',
    },
  }
}

export function generateStaticParams() {
  return locales.map((locale) => ({ lang: locale }))
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params

  const messages = await getMessages()

  return (
    <html lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <body className="min-h-screen bg-white">
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <TopBar />
            {children}
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
