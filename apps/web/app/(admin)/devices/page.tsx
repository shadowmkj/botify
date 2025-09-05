import React from 'react';
import { Users, MessageSquareText, QrCodeIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@repo/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import AddDeviceModal from '@/components/add-device-modal';

import DeleteDeviceButton from '@/components/delete-device';
import Link from 'next/link';

export default async function Devices() {
  const session = await auth.api.getSession({ headers: await headers() });
  const { user } = session || {};
  const devices = await prisma.device.findMany({
    where: {
      userId: user?.id, // Replace with the actual user ID or context
    }
  })
  return (
    <div className="min-h-screen w-full  p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header Cards Section */}
        <header className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* All Contacts Card */}
          <Card className="flex items-center space-x-4">
            <div className="bg-secondary p-4 rounded-lg">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">ALL CONTACTS</p>
              <p className="text-4xl font-bold ">54</p>
            </div>
          </Card>

          {/* Blast Message Card */}
          <Card className="flex items-center space-x-4">
            <div className="bg-secondary p-4 rounded-lg">
              <MessageSquareText className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium">BLAST MESSAGE</p>
              <p className="text-base font-semibold text-green-600">390 Success</p>
              <p className="text-base font-semibold text-red-600">160 Failed</p>
            </div>
          </Card>
        </header>

        {/* List Devices Section */}
        <main>
          <Card>
            {/* Card Header */}
            <div className="flex flex-col p-4 sm:flex-row justify-between items-start sm:items-center mb-4">
              <div className="mb-4 sm:mb-0">
                <h2 className="text-2xl font-bold ">List Devices</h2>
                <p className="text-orange-500 text-sm">*You have 5 limit devices</p>
              </div>
              <AddDeviceModal />
            </div>

            {/* Devices Table */}
            <div className="overflow-x-auto p-4">
              <Table>
                <TableHeader className='border'>
                  <TableRow>
                    <TableHead className="w-[150px]">Number</TableHead>
                    <TableHead>Webhook</TableHead>
                    <TableHead>Messages Sent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.map((device, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{device.body}</TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          placeholder="Enter webhook URL"
                          defaultValue={device.body}
                          className="border-gray-300"
                        />
                      </TableCell>
                      <TableCell>{device.messagesSent}</TableCell>
                      <TableCell>
                        <Badge variant={device.status == 'Connected' ? 'default' : 'destructive'}>
                          {device.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2 items-center">
                          <Link href={`/devices/${device.id}/connect`}>
                            <QrCodeIcon />
                            <span className="sr-only">Options</span>
                          </Link>
                          <DeleteDeviceButton id={device.id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
