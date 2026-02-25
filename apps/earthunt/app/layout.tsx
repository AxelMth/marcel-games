import type { Metadata, Viewport } from 'next'
import { Nunito, Nunito_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AdMobInit } from '@/components/admob-init'
import { LanguageProvider } from '@/components/language-provider'
import './globals.css'

const _nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
})
const _nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-nunito-sans',
})

export const metadata: Metadata = {
  title: 'EartHunt - Geography Quiz Game',
  description:
    'Find all missing countries on an interactive world map. Test your geography knowledge!',
}

export const viewport: Viewport = {
  themeColor: '#55b3d1',
  userScalable: false,
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body
        className={`${_nunito.variable} ${_nunitoSans.variable} font-sans antialiased`}
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        }}
      >
        <LanguageProvider>
          {children}
          <AdMobInit />
          <Analytics />
        </LanguageProvider>
      </body>
    </html>
  )
}
