import HeroSection from "@/components/hero-section";
import Ballpage from "@/components/iconslider";
import TechStackSection from "@/components/tech-stack-section";
import { prisma } from "@repo/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export default async function Home() {
  const count = await prisma.user.count();
  if (count === 0) {
    redirect("/onboarding");
  }
  return (
    <>
      <HeroSection />
      <TechStackSection />
      <Ballpage />
    </>
  );
}
