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
  width: 'device-width',
  initialScale: 1,
  // No userScalable:false / maximumScale:1 — blocking pinch-zoom fails
  // WCAG 1.4.4 and is occasionally flagged in App Store review. The map has
  // its own gesture handling, so page zoom does not interfere with play.
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      {/* No safe-area padding on <body>: it made the document taller than the
          viewport, so the whole page became scrollable. That is what showed the
          body colour as an opaque band under the full-bleed map, and what let
          the keyboard drag the map up along with the search field. Each screen
          insets its own chrome instead — see the overlays in game-screen. */}
      <body
        className={`${_nunito.variable} ${_nunitoSans.variable} font-sans antialiased`}
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
