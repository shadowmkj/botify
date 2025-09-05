"use client";
import { Input } from "@/components/ui/input"
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { addAutoreply } from "@/actions/autoreply";
import { useDeviceStore } from "@/store/device-store";


const AddAutoReplyDialog = () => {
  const formSchema = z.object({
    keyword: z.string().min(1, "Keyword is required"),
    reply: z.string().min(1, "Reply is required"),
  })
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reply: "",
      keyword: ""
    }
  })
  const { device: currentDevice } = useDeviceStore()
  const router = useRouter();
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      await addAutoreply({ ...data, deviceNumber: currentDevice! });
      toast.success("Autoreply added successfully!");
      router.refresh();
    } catch {
      toast.error("Failed to add autoreply. Please try again.");
    }
    setAddDialogOpen(false);
  }
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  return (
    < Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen} >
      <DialogTrigger asChild>
        <Button>Add New Autoreply</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Autoreply</DialogTitle>
          <DialogDescription>
            Enter the details below. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
              <FormField name="keyword" render={({ field }) => (
                <FormItem>
                  <FormLabel>Keyword</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="reply" render={({ field }) => (
                <FormItem>
                  <FormLabel>Reply</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </form>
        </Form>
        <DialogFooter>
          <Button onClick={form.handleSubmit(onSubmit)} type="submit">Save Autoreply</Button>
        </DialogFooter>
      </DialogContent >
    </Dialog >
  )
}

export default AddAutoReplyDialog;
