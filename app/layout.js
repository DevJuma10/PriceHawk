import Navbar from '@/components/Navbar'
import './globals.css'

// FONTS
import { Inter, Space_Grotesk } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })
const spaceGrotesk = Space_Grotesk({
    subsets:['latin'],
  weight: ['300', '400', '500', '600', '700'] })

export const metadata = {
  title: 'PriceHawk',
  description: 'Track product prices effortlessly and save money shoping online',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className='max-w-10xl mx-auto'>
          <Navbar />
          {children}
        </main>

        
      </body>
    </html>
  )
}
