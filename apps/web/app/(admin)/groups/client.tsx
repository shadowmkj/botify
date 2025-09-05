"use client";

import { MoreHorizontal } from "lucide-react";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

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
import { ContactGroup } from "@repo/db";
import { deleteContactGroup } from "@/actions/contact";
import Link from "next/link";
import { useTheme } from "next-themes";
type Group = {
  _count: {
    contacts: number;
  };
} & ContactGroup;
export default function ContactGroupsTable({ initialContacts }: { initialContacts: Group[] }) {
  const [contacts, setContacts] = useState<Group[]>(initialContacts);
  const { theme } = useTheme();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(theme === "dark");
  }, [theme]);


  const handleEditContact = (contactId: string) => {
    alert(`Edit action for contact ID: ${contactId}`);
  };

  const handleDeleteContact = (contactId: string) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      background: isDark ? 'oklch(0.2795 0.0368 260.0310)' : 'oklch(1.0000 0 0)',
      color: isDark ? 'oklch(0.8717 0.0093 258.3382)' : 'oklch(0.3729 0.0306 259.7328)',
      confirmButtonColor: 'oklch(0.6368 0.2078 25.3313)',
      cancelButtonColor: 'oklch(0.7227 0.1920 149.5793)',
    }).then((result) => {
      if (result.isConfirmed) {
        deleteContactGroup({ id: contactId })
        setContacts(contacts.filter(c => c.id !== contactId));
        Swal.fire({
          title: "Deleted!",
          text: "Your file has been deleted.",
          icon: "success",
          background: isDark ? 'oklch(0.2795 0.0368 260.0310)' : 'oklch(1.0000 0 0)',
          color: isDark ? 'oklch(0.8717 0.0093 258.3382)' : 'oklch(0.3729 0.0306 259.7328)',
        });
      }
    });
  };

  return (
    <div className="border rounded-lg rounded-t-none">
      <Table>
        <TableHeader className="bg-secondary">
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Number of Contacts</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact, index) => (

            <TableRow key={contact.id}>
              <TableCell className="font-medium">{index + 1}</TableCell>
              <TableCell>{contact.name}</TableCell>
              <TableCell>{contact._count.contacts}</TableCell>
              <TableCell className="text-right">
                <Link href={`/groups/${contact.id}`} key={contact.id} legacyBehavior>
                  <Button variant={'link'}>View Contacts</Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleEditContact(contact.id)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteContact(contact.id)}
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
