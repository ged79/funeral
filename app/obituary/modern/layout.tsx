import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '코넥서스 부고장 서비스',
  description: '코넥서스 장례서비스 부고장',
  icons: {
    icon: '/icon-512x512.png',
    apple: '/icon-512x512.png',
  },
}

export default function ModernObituaryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
