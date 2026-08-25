import * as React from "react"
import { cn } from "@/lib/utils"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("text-xs font-semibold uppercase tracking-[.08em] text-slate-500", className)} {...props} />
}

export { Label }
