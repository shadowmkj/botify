import { prisma } from "@repo/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { Button } from "@/components/ui/button";

async function getUsers() {
  const users = await prisma.user.findMany({
    include: { plan: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return users;
}

export default async function ManageUsersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return redirect("/sign-in");
  }
  const role = (session.user as unknown as { role?: string })?.role;
  if (role !== "admin") {
    return redirect("/dashboard");
  }

  const users = await getUsers();

  return (
    <div className="space-y-8">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <Button variant="outline" disabled>
          Actions
        </Button>
      </div>
      <DataTable columns={columns} data={users} />
    </div>
  );
}
