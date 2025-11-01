import { prisma } from "@repo/db";
import { notFound } from "next/navigation";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PlanDetailsPage = async ({ params }: { params: Promise<{ planId: string }> }) => {
  const plan = await prisma.plan.findUnique({
    where: {
      id: (await params).planId,
    },
    include: {
      users: true,
    },
  });

  if (!plan) {
    notFound();
  }

  return (
    <div className="space-y-8 p-4">
      <h1 className="text-3xl font-bold text-primary mb-6">Plan: {plan.name}</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Plan Name</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{plan.name}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Price</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(plan.price / 100)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Message Limit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{plan.messageLimit ?? 'Unlimited'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Devices Limit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{plan.devicesLimit}</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mt-10 mb-4 text-primary">Users on this Plan</h2>
      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead className="w-[300px]">Email</TableHead>
              <TableHead>Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plan.users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No users on this plan.
                </TableCell>
              </TableRow>
            ) : (
              plan.users.map((user, idx) => (
                <TableRow key={user.id}>
                  <TableCell className="font-bold">{idx + 1}</TableCell>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.name}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PlanDetailsPage;
