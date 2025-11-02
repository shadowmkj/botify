"use client";
import { createCampaign } from "@/actions/campaign";
import { getConnectedDevices } from "@/actions/device";
import MediaUpload from "@/components/media-upload";
import EmojiTextarea from "@/components/emoji-textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { ContactGroup } from "@repo/db";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { createCampaignSchema } from "./campaignSchema";

export default function CampaignForm({
  contactGroups,
}: {
  contactGroups: ContactGroup[];
}) {
  const { data: devices } = useQuery({
    queryKey: ["devices"],
    queryFn: getConnectedDevices,
  });
  const [file, setFile] = useState<File | null>(null);
  const form = useForm({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: {
      name: "",
      message: "",
      contactGroupId: "",
      sender: "",
      media: undefined,
    },
  });

  const handleFileSelect = (file: File | null) => {
    setFile(file);
  };

  async function onSubmit(values: z.infer<typeof createCampaignSchema>) {
    if (!file && !values.message) {
      return toast.error("Message or media is required");
    }

    let media: string | undefined = undefined;
    if (file) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Upload failed");
        const json = await res.json();
        media = json.url as string;
      } catch (error) {
        console.error("Error uploading file:", error);
        toast.error("Error uploading file.");
        return;
      }
    }

    try {
      await createCampaign({ ...values, media });
      toast.success("Campaign Created!");
      form.reset();
      setFile(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error creating campaign"
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign Details</CardTitle>
        <CardDescription>
          Fill out the form to create a new campaign.
        </CardDescription>
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
                    <Input
                      placeholder="e.g., Summer Sale Announcement"
                      {...field}
                    />
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
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
                    <EmojiTextarea
                      placeholder="Write your campaign message here..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="sender"
              render={({ field }) => (
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
                        <SelectItem key={d.id} value={d.body}>
                          {d.body}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="media"
              render={({}) => (
                <FormItem>
                  <FormLabel>Media</FormLabel>
                  <FormControl>
                    <MediaUpload onFileSelect={handleFileSelect} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit">Create Campaign</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
