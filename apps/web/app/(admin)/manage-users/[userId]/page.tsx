import { prisma } from "@repo/db"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect, notFound } from "next/navigation"
import UserDetails from "./client"

export default async function Page({ params }: { params: Promise<{ userId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return redirect("/sign-in")
  const role = (session.user as unknown as { role?: string })?.role
  if (role !== "admin") return redirect("/dashboard")

  const [user, plans] = await Promise.all([
    prisma.user.findUnique({
      where: { id: (await params).userId },
      include: { plan: true, Device: true, Campaign: true, ContactGroup: true },
    }),
    prisma.plan.findMany({ select: { id: true, name: true } }),
  ])

  if (!user) return notFound()

  return <UserDetails user={user} plans={plans} />
}
