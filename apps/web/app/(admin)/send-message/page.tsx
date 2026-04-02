"use client";
import { sendMessage, sendButtonMessage } from "@/actions/message";
import EmojiTextarea from "@/components/emoji-textarea";
import MediaUpload from "@/components/media-upload";
import ButtonMessageBuilder from "@/components/message/ButtonMessageBuilder";
import type { ButtonMessagePayload } from "@/components/message/ButtonMessageTypes";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDeviceStore } from "@/store/device-store";
import { sendMessageSchema, SendMessageValues } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Send, MessageSquare, LayoutTemplate } from "lucide-react";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type MessageMode = "text" | "button";

const SendMessagePage = () => {
    const { device: currentDevice } = useDeviceStore();
    const [file, setFile] = useState<File | null>(null);
    const [mode, setMode] = useState<MessageMode>("text");
    const buttonPayloadRef = useRef<ButtonMessagePayload | null>(null);

    const form = useForm({
        resolver: zodResolver(sendMessageSchema),
        defaultValues: {
            number: "",
            message: "",
            mode: "text",
        },
    });

    // ── Text message mutation ─────────────────────────────────────────────────
    const { mutate: sendText, isPending: isSendingText } = useMutation({
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

    // ── Button message mutation ───────────────────────────────────────────────
    const { mutate: sendButton, isPending: isSendingButton } = useMutation({
        mutationFn: sendButtonMessage,
        onSuccess: (res) => {
            if (res.status) toast.success(res.message);
        },
        onError: (error) => {
            toast.error(
                error instanceof Error ? error.message : "Failed to send button message"
            );
        },
    });

    const isPending = isSendingText || isSendingButton;

    // ── Submit ────────────────────────────────────────────────────────────────
    const onSubmit = async (data: SendMessageValues) => {
        console.log(mode, data)
        if (!currentDevice) return toast.error("No device selected");

        if (mode === "button") {
            const bp = buttonPayloadRef.current;
            if (!bp) return toast.error("Please complete the button message builder (body is required).");
            sendButton({
                receiver: data.number,
                sender: currentDevice,
                buttonPayload: bp,
            });
            return;
        }

        // Text mode
        if (!file && !data.message) {
            return toast.error("Message or media is required");
        }

        let media: string | undefined = undefined;
        let fileName: string | undefined = undefined;
        let mimeType: string | undefined = undefined;
        let mediaType: "image" | "video" | "document" | undefined = undefined;

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

        sendText({
            message: data.message,
            receiver: data.number,
            sender: currentDevice,
            media,
            mediaType,
            fileName,
            mimeType,
        });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 md:p-8">
            <Card className={`w-full mx-auto rounded-xl shadow-lg ${mode === "button" ? "max-w-4xl" : "max-w-lg"}`}>
                <CardHeader className="space-y-3">
                    <p className="text-lg font-semibold">Send Message</p>

                    {/* Mode toggle */}
                     <Tabs
                         value={mode}
                         onValueChange={(v) => {
                             const nextMode = v as MessageMode;
                             setMode(nextMode);
                             form.setValue("mode", nextMode);
                         }}
                     >
                        <TabsList className="w-full">
                            <TabsTrigger value="text" className="flex-1 gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Text
                            </TabsTrigger>
                            <TabsTrigger value="button" className="flex-1 gap-2">
                                <LayoutTemplate className="h-4 w-4" />
                                Button Message
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>

                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <div className="grid grid-cols-1 gap-4">
                                {/* Phone number — always shown */}
                                <FormField
                                    name="number"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Number</FormLabel>
                                            <FormControl>
                                                <Input type="tel" placeholder="+91 99999 99999" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* ── Text mode ────────────────────────────────────────── */}
                                {mode === "text" && (
                                    <>
                                        <FormField
                                            name="message"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Message</FormLabel>
                                                    <FormControl>
                                                        <EmojiTextarea
                                                            placeholder="Type your message..."
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            name="media"
                                            render={({ }) => (
                                                <FormItem>
                                                    <FormLabel>Media</FormLabel>
                                                    <FormControl>
                                                        <MediaUpload onFileSelect={(f) => setFile(f)} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </>
                                )}

                                {/* ── Button mode ─────────────────────────────────────── */}
                                {mode === "button" && (
                                    <ButtonMessageBuilder
                                        onChange={(p) => { buttonPayloadRef.current = p; }}
                                    />
                                )}
                            </div>
                        </form>
                    </Form>
                </CardContent>

                <CardFooter className="flex justify-end">
                    <Button
                        disabled={isPending}
                        onClick={form.handleSubmit(onSubmit)}
                    >
                        {isPending ? "Sending..." : "Send"}
                        <Send className="ml-2 h-4 w-4" />
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default SendMessagePage;
