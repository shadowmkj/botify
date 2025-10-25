import { prisma } from "@repo/db";
import { notFound } from "next/navigation";
import PlanForm from "./client";

const EditPlanPage = async ({ params }: { params: Promise<{ planId: string }> }) => {
  const plan = await prisma.plan.findUnique({
    where: { id: (await params).planId },
  });

  if (!plan) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PlanForm plan={plan} />
    </div>
  );
};

export default EditPlanPage;
