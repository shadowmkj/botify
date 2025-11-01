"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";

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

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: FormValues) {
    try {
      const { data, error } = await authClient.requestPasswordReset({
        email: values.email, // required
        redirectTo: "http://localhost:3000/reset-password", // optional
      });
      if (error) {
        throw error;
      }
      if (data.status) {
        toast.success("Password reset email sent. Please check your inbox.");
      }
      form.reset();
    } catch {
      toast.error("Failed to send reset email. Please try again.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <h1 className="text-xl font-semibold text-foreground">
          Forgot password
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email to receive a password reset link.
        </p>

        <div className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Send reset link
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-right text-sm">
            <Link
              href="/sign-in"
              className="font-medium text-foreground hover:text-foreground/90"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
