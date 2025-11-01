import { prisma } from "@repo/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { Button } from "@/components/ui/button";
import Link from "next/link";

async function getPlans() {
  const plans = await prisma.plan.findMany();
  return plans;
}

const PlansPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    return <div>Not authorized</div>;
  }
  const plans = await getPlans();

  return (
    <div className="space-y-8">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Plans</h1>
        <Button asChild>
          <Link href="/plans/new">Create Plan</Link>
        </Button>
      </div>
      <DataTable columns={columns} data={plans} />
    </div>
  );
};

export default PlansPage;
