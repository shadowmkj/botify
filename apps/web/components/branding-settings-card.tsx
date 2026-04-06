"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useUser, useSetUser } from "@/context/UserContext"
import { updateUserLogo } from "@/actions/user"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"

export default function BrandingSettingsCard() {
  const user = useUser()
  const setUser = useSetUser()
  const [logoUrl, setLogoUrl] = useState(user?.staticLogoUrl || "")
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    try {
      setLoading(true)
      const res = await updateUserLogo({ staticLogoUrl: logoUrl })
      if (res.ok) {
        toast.success("Logo updated successfully")
        if (user) {
          setUser({ ...user, staticLogoUrl: logoUrl })
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update logo")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding Settings</CardTitle>
        <CardDescription>
          Customize your dashboard branding by adding a static logo URL.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="logo-url">Static Logo URL</Label>
          <Input
            id="logo-url"
            placeholder="https://example.com/logo.png"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
          />
        </div>
        {logoUrl && (
          <div className="mt-4 p-4 border rounded-lg bg-muted/50 flex flex-col items-center justify-center gap-2">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Preview</p>
            <img 
              src={logoUrl} 
              alt="Logo Preview" 
              className="max-h-20 object-contain"
              onError={(e) => {
                (e.target as any).src = "https://placehold.co/200x80?text=Invalid+Image"
              }}
            />
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={loading} className="w-full sm:w-auto gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  )
}
