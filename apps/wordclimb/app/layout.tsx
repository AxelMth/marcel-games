import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: 'WordClimb - Word Ladder Puzzle',
  description: 'Climb the word ladder! A fun word puzzle game where you find missing words that change by one letter at each step.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  // Teinte haute du dégradé de l'accueil, reprise du vert du logo. C'est ce
  // que le système peint autour de la web view, donc il doit s'accorder au
  // haut de la page, pas au bleu d'earthunt d'où il avait été copié.
  themeColor: '#69bf8e',
  width: 'device-width',
  initialScale: 1,
  // No userScalable:false — blocking pinch-zoom fails WCAG 1.4.4 and is
  // occasionally flagged in App Store review. Same call as earthunt.
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${_inter.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
