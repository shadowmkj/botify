import OnboardingForm from "@/components/onboarding-form";
import { prisma } from "@repo/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export default async function OnboardingPage() {
  const total = await prisma.user.count();
  if (total > 0) {
    redirect("/");
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold">Welcome to Botify</h1>
        <p className="text-sm text-muted-foreground">
          Let’s create the first administrator account.
        </p>
        <OnboardingForm />
      </div>
    </div>
  );
}
