"use client";
import { createCampaign } from "@/actions/campaign";
import { getConnectedDevices } from "@/actions/device";
import MediaUpload from "@/components/media-upload";
import EmojiTextarea from "@/components/emoji-textarea";
import ButtonMessageBuilder from "@/components/message/ButtonMessageBuilder";
import type { ButtonMessagePayload } from "@/components/message/ButtonMessageTypes";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { ContactGroup } from "@repo/db";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { createCampaignSchema } from "./campaignSchema";
import { MessageSquare, LayoutTemplate } from "lucide-react";

type CampaignMode = "text" | "button";

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
  const [mode, setMode] = useState<CampaignMode>("text");
  const buttonPayloadRef = useRef<ButtonMessagePayload | null>(null);

  const form = useForm({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: {
      name: "",
      message: "",
      contactGroupId: "",
      sender: "",
      media: undefined,
      buttonPayloadJson: undefined,
      isButtonCampaign: false,
    },
  });

  const handleFileSelect = (file: File | null) => {
    setFile(file);
  };

  async function onSubmit(values: z.infer<typeof createCampaignSchema>) {
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

    // Button campaign path
    if (mode === "button") {
      const bp = buttonPayloadRef.current;
      if (!bp) return toast.error("Please complete the button message builder (body is required).");

      try {
        await createCampaign({
          ...values,
          isButtonCampaign: true,
          buttonPayloadJson: JSON.stringify(bp),
          message: bp.body,
          media,
        });
        toast.success("Button Campaign Created!");
        form.reset();
        buttonPayloadRef.current = null;
        setFile(null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error creating campaign");
      }
      return;
    }

    // Text campaign path (existing logic)
    if (!file && !values.message) {
      return toast.error("Message or media is required");
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
    <Card className={mode === "button" ? "max-w-4xl mx-auto" : ""}>
      <CardHeader>
        <CardTitle>Campaign Details</CardTitle>
        <CardDescription>
          Fill out the form to create a new campaign.
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Campaign name */}
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

            {/* Contact Group */}
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

            {/* Sender */}
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

            {/* Message type toggle */}
            <div className="space-y-1.5">
              <FormLabel>Message Type</FormLabel>
              <Tabs
                value={mode}
                onValueChange={(v) => {
                  setMode(v as CampaignMode);
                  form.setValue("isButtonCampaign", v === "button");
                }}
              >
                <TabsList className="w-full">
                  <TabsTrigger value="text" className="flex-1 gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Text / Media
                  </TabsTrigger>
                  <TabsTrigger value="button" className="flex-1 gap-2">
                    <LayoutTemplate className="h-4 w-4" />
                    Button Message
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* ── Text mode ───────────────────────────────────────────── */}
            {mode === "text" && (
              <>
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
              </>
            )}

            {/* ── Button mode ─────────────────────────────────────────── */}
            {mode === "button" && (
              <ButtonMessageBuilder
                onChange={(p) => { buttonPayloadRef.current = p; }}
                mediaPreviewUrl={file ? URL.createObjectURL(file) : null}
              />
            )}

            {/* ── Media Upload (Shared) ────────────────────────────── */}
            <FormField
              name="media"
              render={() => (
                <FormItem className={mode === "button" ? "mt-4" : ""}>
                  <FormLabel>Media (Optional)</FormLabel>
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
