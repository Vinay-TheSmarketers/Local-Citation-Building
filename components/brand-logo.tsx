import { cn } from "@/lib/utils"

export function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)} aria-label="Smarketers">
      <svg viewBox="0 0 40 40" role="img" aria-hidden="true" className="h-9 w-9 overflow-visible">
        <path d="M5 29.5c5.5 4.1 12.8 3.2 15.9-.9 3.2-4.3-1.5-7.3-6.5-8.5-5-1.2-8.1-4.5-5.5-8.2 3.4-4.9 12.4-4.7 17.8-.8" fill="none" stroke="currentColor" strokeWidth="3.8" strokeLinecap="round" />
        <path d="M23.5 14.5 32.5 5m0 0-.3 8.1M32.5 5l-8.2.7" fill="none" stroke="#ff5c35" strokeWidth="3.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-xl font-black tracking-[-.045em] text-slate-950">Smarketers</span>
    </div>
  )
}
