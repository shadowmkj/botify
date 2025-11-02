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
import { Badge } from "@/components/ui/badge";

const CampaignDetailsPage = async ({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) => {
  const campaign = await prisma.campaign.findUnique({
    where: {
      id: (await params).campaignId,
    },
    include: {
      blasts: {
        include: {
          contact: {
            include: {
              contactGroup: true,
            },
          },
        },
      },
    },
  });

  if (!campaign) {
    notFound();
  }

  const groupName =
    campaign.blasts.length > 0
      ? campaign.blasts[0].contact.contactGroup.name
      : "N/A";

  return (
    <div className="space-y-8 p-4">
      <h1 className="text-3xl font-bold text-primary mb-6">
        Campaign: {campaign.name}
      </h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Name</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{campaign.name}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Associated Group</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{groupName}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Message Content</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{campaign.message}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Created On</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">
              {new Date(campaign.createdAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            {
              campaign.blasts.filter((blast) => blast.status === "Sent")
                .length
            }{" "}
            / {campaign.blasts.length}
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mt-10 mb-4 text-primary">
        Campaign Blasts
      </h2>
      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead className="w-[150px]">Contact Name</TableHead>
              <TableHead className="w-[150px]">Contact Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Message Type</TableHead>
              <TableHead className="text-right">Sent At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaign.blasts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No blasts found for this campaign.
                </TableCell>
              </TableRow>
            )}
            {campaign.blasts.map((blast, idx) => (
              <TableRow key={blast.id}>
                <TableCell className="font-bold">{idx + 1}</TableCell>
                <TableCell className="font-medium">
                  {blast.contact.name}
                </TableCell>
                <TableCell>{blast.contact.phone}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      blast.status === "Sent"
                        ? "default"
                        : blast.status === "Failed"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {blast.status}
                  </Badge>
                </TableCell>
                <TableCell>{blast.messageType}</TableCell>
                <TableCell className="text-right">
                  {new Date(blast.createdAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CampaignDetailsPage;
