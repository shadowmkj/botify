import { prisma } from "@repo/db";
import { notFound } from "next/navigation";
import CampaignForm from "./client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const EditCampaignPage = async ({ params }: { params: Promise<{ campaignId: string }> }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const campaign = await prisma.campaign.findUnique({
    where: {
      id: (await params).campaignId,
    },
  });

  const groups = await prisma.contactGroup.findMany({
    where: {
      userId: session?.user?.id,
    },
  });

  if (!campaign) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <CampaignForm campaign={campaign} contactGroups={groups} />
    </div>
  );
};

export default EditCampaignPage;
