import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '장례식장 관리 시스템',
  description: '영등병원 장례식장 관리 시스템',
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
