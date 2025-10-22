"use client"

import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { redirect, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"
import { resetPasswordSchema } from "@/lib/auth-schema"

type FormValues = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const form = useForm<FormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: FormValues) {
    if (!token) {
      toast.error("Invalid reset link. Please request a new one.")
      return
    }

    await authClient.resetPassword({
      token,
      newPassword: values.password,
    }, {
      onRequest: () => {
        toast.loading("Resetting password...")
      },
      onSuccess: () => {
        toast.dismiss()
        toast.success("Password reset successfully. Redirecting to sign in...")
        redirect("/sign-in")
      },
      onError: (ctx: { error: { message: string } }) => {
        toast.dismiss()
        toast.error(ctx.error.message || "Failed to reset password. Please try again.")
      },
    })
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md text-center">
          <h1 className="text-xl font-semibold text-foreground">Invalid Reset Link</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This reset link is invalid or expired. Please request a new password reset.
          </p>
          <Button asChild className="mt-4">
            <a href="/forgot-password">Request New Reset</a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <h1 className="text-xl font-semibold text-foreground">Reset your password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your new password below.
        </p>

        <div className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                Reset Password
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}