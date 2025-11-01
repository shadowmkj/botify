"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Plan } from "@repo/db"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deletePlan } from "@/actions/plan"
import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"

export const columns: ColumnDef<Plan>[] = [
  {
    header: "#",
    cell: ({ row }) => <div className="text-left font-medium">{row.index + 1}</div>,
  },
  {
    header: "Name",
    accessorKey: "name",
    cell: ({ row }) => {
      return (
        <Link legacyBehavior href={`/plans/${row.original.id}`}>
          <Button variant={"link"}>{row.original.name}</Button>
        </Link>
      )
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const price = row.getValue("price") as number
      const formatted = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(price / 100)
      return <div className="text-left font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "messageLimit",
    header: "Message Limit",
    cell: ({ row }) => <div className="text-left">{row.original.messageLimit ?? '-'}</div>,
  },
  {
    accessorKey: "devicesLimit",
    header: "Devices Limit",
    cell: ({ row }) => <div className="text-left">{row.original.devicesLimit}</div>,
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
  {
    id: "actions",
    header: "Actions",
    cell: function Cell({ row }) {
      const plan = row.original
      const [isDialogOpen, setIsDialogOpen] = useState(false)

      const handleDelete = async () => {
        try {
          await deletePlan(plan.id)
          toast.success("Plan deleted successfully!")
        } catch {
          toast.error("Failed to delete plan.")
        }
        setIsDialogOpen(false)
      }

      return (
        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(plan.id)}>
                Copy plan ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/plans/${plan.id}`}>View plan</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/plans/${plan.id}/edit`}>Edit plan</Link>
              </DropdownMenuItem>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem>Delete plan</DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the plan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )
    },
  },
]
