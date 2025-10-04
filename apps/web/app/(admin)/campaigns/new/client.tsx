'use client'
import { createCampaign } from "@/actions/campaign";
import { getConnectedDevices } from "@/actions/device";
import MediaUpload from "@/components/media-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { ContactGroup } from "@repo/db";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { createCampaignSchema } from "./campaignSchema";

export default function CampaignForm({ contactGroups }: { contactGroups: ContactGroup[] }) {
  const { data: devices } = useQuery({
    queryKey: ['devices'],
    queryFn: getConnectedDevices,
  });
  const [file, setFile] = useState<File | null>(null);
  const form = useForm<z.infer<typeof createCampaignSchema>>({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: {
      name: '',
      message: '',
      contactGroupId: '',
      sender: '',
      media: undefined
    },
  });

  const handleFileSelect = (file: File | null) => {
    setFile(file);
  }

  async function onSubmit(values: z.infer<typeof createCampaignSchema>) {
    if (!file && !values.message) {
      return toast.error("Message or media is required")
    }

    const readFileAsBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
      });
    };

    let media: string | undefined = undefined;
    if (file) {
      try {
        media = await readFileAsBase64(file);
      } catch (error) {
        console.error("Error reading file:", error);
        toast.error("Error reading file.");
        return;
      }
    }

    try {
      await createCampaign({ ...values, media })
      toast.success("Campaign Created!")
      form.reset();
      setFile(null);
    } catch {
      toast.error("Error creating campaign!")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign Details</CardTitle>
        <CardDescription>Fill out the form to create a new campaign.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Summer Sale Announcement" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="contactGroupId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Group</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contactGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write your campaign message here..."
                      className="resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField name="sender" render={({ field }) => (
              <FormItem>
                <FormLabel>Sender</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {devices?.map((d) => (
                      <SelectItem key={d.id} value={d.body}>{d.body}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="media" render={({ }) => (
              <FormItem>
                <FormLabel>Media</FormLabel>
                <FormControl>
                  <MediaUpload onFileSelect={handleFileSelect} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit">Create Campaign</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
