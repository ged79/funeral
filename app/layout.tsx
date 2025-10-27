import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '장례식장 관리 페이지',
  description: '코넥서스 장례식장 관리 시스템',
  icons: {
    icon: '/icon-512x512.png',
    apple: '/icon-512x512.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
