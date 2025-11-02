"use client";
import { sendMessage } from "@/actions/message";
import EmojiTextarea from "@/components/emoji-textarea";
import MediaUpload from "@/components/media-upload";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
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
import { Textarea } from "@/components/ui/textarea";
import { useDeviceStore } from "@/store/device-store";
import { sendMessageSchema, SendMessageValues } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const SendMessagePage = () => {
  const { device: currentDevice } = useDeviceStore();
  const [file, setFile] = useState<File | null>(null);
  const form = useForm({
    resolver: zodResolver(sendMessageSchema),
    defaultValues: {
      number: "",
      message: "",
    },
  });
  const { mutate, isPending } = useMutation({
    mutationFn: sendMessage,
    onSuccess: (res) => {
      if (res.status) {
        toast.success(res.message);
        form.resetField("message");
        setFile(null);
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to send message"
      );
    },
  });
  const onSubmit = async (data: SendMessageValues) => {
    if (!file && !data.message) {
      return toast.error("Message or media is required");
    }

    let media: string | undefined = undefined;
    let fileName: string | undefined = undefined;
    let mimeType: string | undefined = undefined;
    let mediaType: "image" | "video" | "document" | undefined = undefined;

    if (file) {
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/media/upload", {
          method: "POST",
          body: form,
        });
        if (!res.ok) throw new Error("Upload failed");
        const json = await res.json();
        media = json.url as string;
        fileName = json.fileName as string | undefined;
        mimeType = json.mimeType as string | undefined;
        const t = (mimeType || "").toLowerCase();
        if (t.startsWith("image/")) mediaType = "image";
        else if (t.startsWith("video/")) mediaType = "video";
        else mediaType = "document";
      } catch (error) {
        console.error("Error uploading file:", error);
        toast.error("Error uploading file.");
        return;
      }
    }

    mutate({
      message: data.message,
      receiver: data.number,
      sender: currentDevice!,
      media,
      mediaType,
      fileName,
      mimeType,
    });
  };

  const handleFileSelect = (file: File | null) => {
    setFile(file);
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-screen  p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-lg mx-auto rounded-xl shadow-lg">
        <CardHeader>Send Message</CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>message</FormLabel>
                      <FormControl>
                        <EmojiTextarea
                          placeholder="type your message..."
                          {...field}
                        />
                      </FormControl>
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
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button disabled={isPending} onClick={form.handleSubmit(onSubmit)}>
            Send
            <Send />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SendMessagePage;
