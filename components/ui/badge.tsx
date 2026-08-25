import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide", {
  variants: {
    variant: {
      default: "border-transparent bg-slate-900 text-white",
      secondary: "border-slate-200 bg-slate-100 text-slate-600",
      success: "border-emerald-200 bg-emerald-50 text-emerald-700",
      warning: "border-amber-200 bg-amber-50 text-amber-700",
      danger: "border-red-200 bg-red-50 text-red-700",
      outline: "border-slate-200 bg-white text-slate-600",
    },
  },
  defaultVariants: { variant: "default" },
})

function Badge({ className, variant, ...props }: React.ComponentProps<"div"> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
