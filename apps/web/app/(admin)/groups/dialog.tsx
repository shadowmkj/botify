"use client";
import { Input } from "@/components/ui/input"
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

import { useState } from "react"
import z from "zod";
import { phoneNumberSchema } from "@repo/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { addContact } from "@/actions/contact";
import { toast } from "sonner";

const AddContactDialog = ({ groupId }: { groupId: string }) => {
  const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    phone: phoneNumberSchema
  })
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: ""
    }
  })
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    console.log(data)
    try {
      await addContact({ name: data.name, phone: data.phone, groupId: groupId })
      toast.success("Contact added successfully!")
    } catch {
      toast.error("Error adding contact!")
    } finally {
      setAddDialogOpen(false)
    }
  }
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  return (
    < Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen} >
      <DialogTrigger asChild>
        <Button>Add New Contact</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
          <DialogDescription>
            Enter the details below. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Form {...form}>
            <div className="flex flex-col gap-y-4">
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <FormField name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Name
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Phone
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </form>
            </div>
          </Form>
        </div>
        <DialogFooter>
          <Button onClick={form.handleSubmit(onSubmit)} type="submit">Save Contact</Button>
        </DialogFooter>
      </DialogContent >
    </Dialog >
  )
}

export default AddContactDialog;
