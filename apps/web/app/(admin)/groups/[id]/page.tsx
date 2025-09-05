
import { Suspense } from "react";
import { prisma } from "@repo/db";

import AddContactDialog from "../dialog";
import { TableSkeleton } from "../table-skeleton";
import ContactsTable from "./contact-table";
const ContactsPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const group = await prisma.contactGroup.findFirst({
    where: {
      id: id
    }
  })
  return (
    <div className="container mx-auto py-10">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Contacts 👥 Group: {group?.name}</h1>
        <AddContactDialog groupId={id} />
      </header>
      <Suspense fallback={<TableSkeleton />}>
        <ContactsServerComponent id={id} />
      </Suspense>
    </div >
  )
}

const ContactsServerComponent = async ({ id }: { id: string }) => {
  const contacts = await prisma.contact.findMany({
    where: {
      contactGroupId: id
    },
  })
  return (
    <ContactsTable initialContacts={contacts} />
  )
}


export default ContactsPage;
