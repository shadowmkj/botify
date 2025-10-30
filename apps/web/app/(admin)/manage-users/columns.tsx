"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import type { User } from "@repo/db"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// Extend the User type to include the joined plan name from the query
export type UserWithPlan = User & { plan: { name: string } | null }

export const columns: ColumnDef<UserWithPlan>[] = [
  {
    header: "#",
    cell: ({ row }) => <div className="text-left font-medium">{row.index + 1}</div>,
  },
  {
    header: "Name",
    accessorKey: "name",
    cell: ({ row }) => <div className="text-left">{row.original.name ?? "-"}</div>,
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="text-left font-medium">
        <Link href={`/manage-users/${row.original.id}`}>{row.original.email}</Link>
      </div>
    ),
  },
  {
    header: "Role",
    accessorKey: "role",
    cell: ({ row }) => <div className="text-left">{row.original.role ?? "user"}</div>,
  },
  {
    id: "plan",
    header: "Plan",
    cell: ({ row }) => <div className="text-left">{row.original.plan?.name ?? "-"}</div>,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt") as string | Date)
      const formatted = format(date, "PPP")
      return <div className="text-left font-medium">{formatted}</div>
    },
  },
]
