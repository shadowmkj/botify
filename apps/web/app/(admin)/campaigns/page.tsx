import { prisma } from "@repo/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { Button } from "@/components/ui/button";
import Link from "next/link";

async function getCampaigns(userId: string) {
  const campaigns = await prisma.campaign.findMany({
    where: {
      userId: userId,
    },
  });
  return campaigns;
}

const CampaignsPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    return <div>Not authorized</div>
  }
  const campaigns = await getCampaigns(session.user.id);

  return (
    <div className="space-y-8">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <Button asChild>
          <Link href="/campaigns/new">Create Campaign</Link>
        </Button>
      </div>
      <DataTable columns={columns} data={campaigns} />
    </div>
  );
};

export default CampaignsPage;