"use client";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { formSchema } from "@/lib/auth-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { redirect } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { promoteFirstUser } from "@/actions/onboarding";

export default function OnboardingForm() {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: "", email: "", password: "" },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        const { name, email, password } = values;

        await authClient.signUp.email(
            { email, password, name },
            {
                onRequest: () => { toast("Creating admin user...") },
                onSuccess: async () => {
                    try {
                        await promoteFirstUser({ email });
                        toast.success("Admin created");
                        await authClient.signIn.email(
                            { email, password },
                            {
                                onSuccess: () => redirect("/dashboard"),
                                onError: (ctx) => { toast.error(ctx.error.message) },
                            }
                        );
                        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                    } catch (e: any) {
                        toast.error(e?.message ?? "Failed to finalize onboarding");
                    }
                },
                onError: (ctx) => { toast.error(ctx.error.message) },
            }
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="m@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="********" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full">
                    Create Admin and Continue
                </Button>
            </form>
        </Form>
    );
}
