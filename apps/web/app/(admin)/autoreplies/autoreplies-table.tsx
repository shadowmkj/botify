"use client";
import { deleteAutoreply } from "@/actions/autoreply";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Autoreply } from "@repo/db";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
export default function AutoreplyTable({ initialAutoreplies }: { initialAutoreplies: Autoreply[] }) {
  const [autoreplys, setAutoreplys] = useState<Autoreply[]>(initialAutoreplies);
  const handleEditAutoreply = (autoreplyId: string) => {
    alert(`Edit action for autoreply ID: ${autoreplyId}`);
  };
  const handleDeleteAutoreply = async (autoreplyId: string) => {
    if (confirm("Are you sure you want to delete this autoreply?")) {
      await deleteAutoreply({
        id: autoreplyId,
      });
      setAutoreplys(autoreplys.filter(c => c.id !== autoreplyId));
      console.log(`Deleting autoreply ID: ${autoreplyId}`);
    }
  };

  return (
    <div className="border rounded-lg rounded-t-none">
      <Table>
        <TableHeader className="bg-secondary">
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Number</TableHead>
            <TableHead>Keyword</TableHead>
            <TableHead>Reply</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {autoreplys.map((autoreply, index) => (
            <TableRow key={autoreply.id}>
              <TableCell className="font-medium">{index + 1}</TableCell>
              <TableCell>{autoreply.deviceId}</TableCell>
              <TableCell>{autoreply.keyword}</TableCell>
              <TableCell>{autoreply.reply}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleEditAutoreply(autoreply.id)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteAutoreply(autoreply.id)}
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div >
  );
}
