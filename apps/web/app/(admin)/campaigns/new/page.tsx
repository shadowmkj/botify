import { auth } from "@/lib/auth";
import CampaignForm from "./client";
import { headers } from "next/headers";
import { prisma } from "@repo/db";

const NewCampaignPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  const groups = await prisma.contactGroup.findMany({
    where: {
      userId: session?.user?.id
    }
  })
  return (
    <div className="space-y-8">
      <CampaignForm contactGroups={groups} />
    </div>
  )
}

export default NewCampaignPage;
