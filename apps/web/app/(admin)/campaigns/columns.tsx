"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Campaign } from "@repo/db"
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
import { deleteCampaign } from "@/actions/campaign"
import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"



export const columns: ColumnDef<Campaign>[] = [
  {
    header: "#",
    cell: ({ row }) => <div className="text-left font-medium">{row.index + 1}</div>,
  },
  {
    header: "Name",
    accessorKey: "name",
    cell: ({ row }) => {
      return <Link legacyBehavior href={`/campaigns/${row.original.id}`}>
        <Button variant={'link'}>{row.original.name}</Button>
      </Link>
    },
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
      const date = new Date(row.getValue("createdAt"))
      const formatted = format(date, "PPP")
      return <div className="text-left font-medium">{formatted}</div>
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: function Cell({ row }) {
      const campaign = row.original
      const [isDialogOpen, setIsDialogOpen] = useState(false)

      const handleDelete = async () => {
        try {
          await deleteCampaign(campaign.id)
          toast.success("Campaign deleted successfully!")
        } catch {
          toast.error("Failed to delete campaign.")
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
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(campaign.id)}
              >
                Copy campaign ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/campaigns/${campaign.id}`}>View campaign</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/campaigns/${campaign.id}/edit`}>Edit campaign</Link>
              </DropdownMenuItem>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem>Delete campaign</DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your campaign
                and remove your data from our servers.
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
