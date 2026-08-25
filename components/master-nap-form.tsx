"use client"

import { useState } from "react"
import { Building2, Check, Globe2, MapPin, Phone } from "lucide-react"
import { toast } from "sonner"
import { BusinessRecord } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = { business: BusinessRecord; onSaved: (business: BusinessRecord) => void }

export function MasterNapForm({ business, onSaved }: Props) {
  const [form, setForm] = useState(business)
  const [saving, setSaving] = useState(false)

  function update(field: keyof BusinessRecord, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    try {
      const response = await fetch("/api/business", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      const payload = await response.json()
      if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Please review every NAP field.")
      setForm(payload.business)
      onSaved(payload.business)
      toast.success("Master NAP saved", { description: "Your source of truth is ready for every directory." })
    } catch (error) {
      toast.error("Couldn’t save the profile", { description: error instanceof Error ? error.message : "Try again." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field icon={Building2} label="Business name" id="name" value={form.name} onChange={(value) => update("name", value)} />
        <Field icon={Globe2} label="Website" id="website" type="url" value={form.website} onChange={(value) => update("website", value)} />
        <Field icon={MapPin} label="Address line 1" id="address1" value={form.address1} onChange={(value) => update("address1", value)} />
        <Field label="Address line 2" id="address2" value={form.address2 ?? ""} required={false} onChange={(value) => update("address2", value)} />
        <Field label="City" id="city" value={form.city} onChange={(value) => update("city", value)} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="State / Region" id="region" value={form.region} onChange={(value) => update("region", value)} />
          <Field label="Postal code" id="postalCode" value={form.postalCode} onChange={(value) => update("postalCode", value)} />
        </div>
        <Field icon={Phone} label="Phone" id="phone" type="tel" value={form.phone} onChange={(value) => update("phone", value)} />
        <div className="grid grid-cols-[1fr_90px] gap-3">
          <Field label="Primary category" id="category" value={form.category} onChange={(value) => update("category", value)} />
          <Field label="Country" id="country" value={form.country} onChange={(value) => update("country", value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Business description</Label>
        <textarea id="description" required value={form.description} onChange={(event) => update("description", event.target.value)} className="min-h-24 w-full resize-y rounded-lg border border-input bg-white px-3.5 py-3 text-sm shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10" />
        <div className="text-right text-xs text-slate-400">{form.description.length}/700</div>
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 pt-5">
        <p className="flex items-center gap-2 text-xs text-slate-500"><Check className="h-3.5 w-3.5 text-emerald-600" /> Used as the canonical source for audit fixes</p>
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save master profile"}</Button>
      </div>
    </form>
  )
}

function Field({ icon: Icon, label, id, value, onChange, type = "text", required = true }: { icon?: typeof Building2; label: string; id: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {Icon ? <Icon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /> : null}
        <Input id={id} name={id} type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className={Icon ? "pl-10" : undefined} />
      </div>
    </div>
  )
}
