
"use client";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { useState } from "react";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { importContacts } from "@/actions/contact-import";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Papa from "papaparse";

const formSchema = z.object({
  groupName: z.string().min(1, "Group name is required"),
  file: z.any().refine((files) => files?.length === 1, "File is required."),
});

const ImportContactsDialog = () => {
  const [isImportDialogOpen, setImportDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      groupName: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsImporting(true);
    const file = data.file[0];

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const contacts = results.data as { name: string; phone: string }[];
        const validation = results.meta.fields?.every(field => ['name', 'phone'].includes(field));

        if (!validation) {
          toast.error("Invalid CSV headers. Please ensure columns are named 'name' and 'phone'.");
          setIsImporting(false);
          return;
        }

        try {
          const response = await importContacts({ groupName: data.groupName, contacts });
          if (response.success) {
            toast.success("Contacts imported successfully!");
            router.refresh();
            setImportDialogOpen(false);
          } else {
            toast.error(response.error || "Failed to import contacts.");
          }
        } catch {
          toast.error("An unexpected error occurred.");
        } finally {
          setIsImporting(false);
        }
      },
      error: (error) => {
        toast.error("Failed to parse CSV file.");
        console.error(error);
        setIsImporting(false);
      },
    });
  };

  return (
    <Dialog open={isImportDialogOpen} onOpenChange={setImportDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Import Contacts</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Contacts</DialogTitle>
          <DialogDescription>
            Select a CSV file and provide a name for the new group.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="groupName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input placeholder="New Group" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CSV File</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={(e) => field.onChange(e.target.files)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isImporting}>
                {isImporting ? "Importing..." : "Import"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ImportContactsDialog;
