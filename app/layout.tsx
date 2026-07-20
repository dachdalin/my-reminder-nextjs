import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'

const hanuman = localFont({
  src: [
    {
      path: './fonts/Hanuman-Thin.ttf',
      weight: '100',
      style: 'normal',
    },
    {
      path: './fonts/Hanuman-Light.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: './fonts/Hanuman-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/Hanuman-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: './fonts/Hanuman-Black.ttf',
      weight: '900',
      style: 'normal',
    },
  ],
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
})

export const metadata: Metadata = {
  title: 'ប្រព័ន្ធជូនដំណឹងប្រជុំ',
  description: 'បង្កើត និងគ្រប់គ្រងការជូនដំណឹងប្រជុំតាម Telegram',
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
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="km" className="bg-background" suppressHydrationWarning>
      <head>
        {/* Prevent theme flash: apply class before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme:dark)').matches;var isDark=t==='dark'||(t!=='light'&&d);document.documentElement.classList.toggle('dark',isDark);document.documentElement.classList.toggle('light',!isDark);}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${hanuman.className} antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
