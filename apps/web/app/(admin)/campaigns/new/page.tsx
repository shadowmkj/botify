import { auth } from "@/lib/auth";
import CampaignForm from "./client";
import { headers } from "next/headers";
import { prisma } from "@repo/db";

const NewCampaignPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  const groups = await prisma.contactGroup.findMany({
    where: {
      userId: session?.user?.id
    }
  });
  return (
    <div className="p-4 md:p-8">
      <div className="mb-4">
        <h1 className="text-3xl font-bold">Create Campaign</h1>
        <p className="text-muted-foreground">
          Fill in the details below to create a new campaign.
        </p>
      </div>
      <CampaignForm contactGroups={groups} />
    </div>
  );
};

export default NewCampaignPage;
