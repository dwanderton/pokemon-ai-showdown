import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Pokemon AI Showdown | v0 Studio 2026',
  description: 'Watch AI models compete to become Pokemon masters. GPT-4o vs Claude vs Gemini in the ultimate Pokemon LeafGreen showdown.',
  generator: 'v0.app',
  keywords: ['Pokemon', 'AI', 'Vercel', 'ShipAI', 'GPT-4', 'Claude', 'Gemini', 'LeafGreen', 'Emulator'],
  authors: [{ name: 'Vercel' }],
  openGraph: {
    title: 'Pokemon AI Showdown | v0 Studio 2026',
    description: 'Which AI will become the Pokemon master first?',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pokemon AI Showdown | v0 Studio 2026',
    description: 'Which AI will become the Pokemon master first?',
  },
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Toaster position="top-right" />
        <Analytics />
      </body>
    </html>
  )
}
