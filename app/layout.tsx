import type { Metadata } from "next"
import { Geist, Noto_Sans_Thai } from "next/font/google"
import "./globals.css"
import Navbar from "./components/Navbar"
import { SITE_URL } from "@/lib/site"
import Footer from "./components/Footer"
import CompareBar from "./components/CompareBar"

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
})

// Geist has no Thai glyphs — without this, Thai text fell back to a random system font
const notoThai = Noto_Sans_Thai({
  variable: "--font-thai",
  subsets: ["thai"],
  weight: ["400", "500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: "rod2buy — ซื้อรถเหมือนเล่นเกม",
  description: "marketplace รถมือสองไทย ข้อมูลครบ ติดต่อง่าย",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    siteName: "rod2buy",
    locale: "th_TH",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th" className={`${geist.variable} ${notoThai.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 font-sans">
        <Navbar />
        <div className="flex-1">{children}</div>
        <Footer />
        <CompareBar />
      </body>
    </html>
  )
}
