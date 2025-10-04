"use client"
import { sendMessage } from "@/actions/message"
import MediaUpload from "@/components/media-upload"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useDeviceStore } from "@/store/device-store"
import { sendMessageSchema, SendMessageValues } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { Send } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

const SendMessagePage = () => {
  const { device: currentDevice } = useDeviceStore();
  const [file, setFile] = useState<File | null>(null);
  const form = useForm({
    resolver: zodResolver(sendMessageSchema),
    defaultValues: {
      number: '',
      message: ''
    }
  })
  const { mutate, isPending } = useMutation({
    mutationFn: sendMessage,
    onSuccess: (res) => {
      if (res.status) {
        toast.success(res.message);
        form.resetField("message")
        setFile(null);
      }
    },
    onError: () => {
      toast.error("Failed to send message");
    }
  })
  const onSubmit = async (data: SendMessageValues) => {
    if (!file && !data.message) {
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

    mutate({
      message: data.message,
      receiver: data.number,
      sender: currentDevice!,
      media
    })
  }

  const handleFileSelect = (file: File | null) => {
    setFile(file);
  }
  return (
    <div className="flex flex-col items-center justify-center min-h-screen  p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-lg mx-auto rounded-xl shadow-lg">
        <CardHeader>Send Message</CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 gap-4">
                <FormField name="number" render={({ field }) => (
                  <FormItem>
                    <FormLabel>number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="message" render={({ field }) => (
                  <FormItem>
                    <FormLabel>message</FormLabel>
                    <FormControl>
                      <Textarea placeholder="type your message..." {...field} />
                    </FormControl>
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
  )
}

export default SendMessagePage
