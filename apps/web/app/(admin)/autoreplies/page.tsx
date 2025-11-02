import { auth } from "@/lib/auth";
import { prisma } from "@repo/db";
import { headers } from "next/headers";
import { Suspense } from "react";
import AutoreplyTable from "./autoreplies-table";
import { TableSkeleton } from "./table-skeleton";
import AddAutoReplyDialog from "./add-autoreply-dialog";
const AutorepliesPage = async () => {
  return (
    <div className="container mx-auto py-10">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Autoreplies</h1>
        <AddAutoReplyDialog />
      </header>
      <Suspense fallback={<TableSkeleton />}>
        <AutorepliesServerComponent />
      </Suspense>
    </div>
  );
};

const AutorepliesServerComponent = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const devices = await prisma.device.findMany({
    where: {
      userId: session?.user.id,
    },
    include: {
      autoreplies: {
        include: {
          device: true,
        },
      },
    },
  });
  console.log(JSON.stringify(devices));
  const autoreplies = devices.flatMap((device) => device.autoreplies);
  return <AutoreplyTable initialAutoreplies={autoreplies} />;
};

export default AutorepliesPage;
