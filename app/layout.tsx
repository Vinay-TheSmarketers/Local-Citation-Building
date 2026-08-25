import type { Metadata } from "next"
import { Toaster } from "sonner"
import "./globals.css"
import { TrustBar } from "@/components/trust-bar"

export const metadata: Metadata = {
  title: "vLC — Local Citation Builder by Smarketers",
  description: "Build, track, audit, and fix local business citations from one local-first workspace.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white font-sans text-slate-950 antialiased">
        {children}
        <TrustBar />
        <Toaster position="top-right" richColors closeButton toastOptions={{ className: "font-sans" }} />
      </body>
    </html>
  )
}
