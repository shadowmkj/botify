
"use client";
import { Input } from "@/components/ui/input"
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

import { useState } from "react"
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { addContactGroup } from "@/actions/contact";
import { toast } from "sonner";
import { useRouter } from "next/navigation";


const AddGroupDialog = () => {
  const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
  })
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    }
  })
  const router = useRouter();
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      await addContactGroup(data)
      toast.success("Group added successfully!");
      router.refresh();
    } catch {
      toast.error("Failed to add group. Please try again.");
    }
    setAddDialogOpen(false);
  }
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  return (
    < Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen} >
      <DialogTrigger asChild>
        <Button>Add New Group</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Group</DialogTitle>
          <DialogDescription>
            Enter the details below. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
              <FormField name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          <DialogFooter>
              <Button type="submit">Save Group</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent >
    </Dialog >
  )
}

export default AddGroupDialog;
