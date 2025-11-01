"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import type { User, Plan } from "@repo/db"
import { assignPlan, impersonateUser, updateUser } from "@/actions/admin-users"

type Props = {
  user: User & { plan: Plan | null }
  plans: { id: string, name: string }[]
}

export default function UserDetails({ user, plans }: Props) {
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState(user.name ?? "")
  const [role, setRole] = useState<"user" | "admin">((user.role as "user" | "admin") ?? "user")
  const [banned, setBanned] = useState(!!user.banned)
  const [banReason, setBanReason] = useState(user.banReason ?? "")

  // Plan draft vs committed
  const [planId, setPlanId] = useState<string | null>(user.plan?.id ?? null)
  const [planDraft, setPlanDraft] = useState<string | null>(planId)

  const onSave = () => {
    startTransition(async () => {
      try {
        await updateUser({
          id: user.id,
          name: name || null,
          role,
          banned,
          banReason: banned ? (banReason || null) : null,
        })
        toast.success("User updated")
      } catch {
        toast.error("Failed to update user")
      }
    })
  }

  const onSavePlan = () => {
    if (planDraft === planId) return
    startTransition(async () => {
      try {
        await assignPlan({ userId: user.id, planId: planDraft })
        setPlanId(planDraft)
        toast.success("Plan updated")
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to update plan"
        toast.error(msg)
      }
    })
  }

  const onImpersonate = () => {
    startTransition(async () => {
      try {
        await impersonateUser({ userId: user.id })
        // redirect handled by server action
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to impersonate")
      }
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Details</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onImpersonate} disabled={pending || role === "admin"}>
            Impersonate
          </Button>
          <Button onClick={onSave} disabled={pending}>Save Changes</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user.email} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "user" | "admin")}>
              <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Banned</Label>
              <p className="text-sm text-muted-foreground">Prevent login and access</p>
            </div>
            <Switch checked={banned} onCheckedChange={setBanned} />
          </div>
          <div className="space-y-2">
            <Label>Ban reason</Label>
            <Input value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder="Optional reason" disabled={!banned} />
          </div>

          {/* Plan assignment with separate Save Plan */}
          <div className="space-y-2">
            <Label>Plan</Label>
            <div className="flex items-center gap-2">
              <Select
                value={planDraft ?? "__none__"}
                onValueChange={(v) => setPlanDraft(v === "__none__" ? null : v)}
              >
                <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No Plan</SelectItem>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={onSavePlan} disabled={pending || planDraft === planId}>
                Save Plan
              </Button>
            </div>
            {planDraft !== planId && (
              <p className="text-xs text-muted-foreground">You have unsaved plan changes.</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Created</Label>
            <Input value={new Date(user.createdAt).toLocaleString()} readOnly />
          </div>
          <div className="space-y-1">
            <Label>Updated</Label>
            <Input value={new Date(user.updatedAt).toLocaleString()} readOnly />
          </div>
        </div>
      </div>
    </div>
  )
}
