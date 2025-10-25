'use client'

import { createPlan } from "@/actions/plan";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";
import { planSchema } from "./planSchema";
import { toast } from "sonner";

export default function PlanForm() {
  const form = useForm<z.infer<typeof planSchema>>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      messageLimit: undefined,
      devicesLimit: 1,
    },
    mode: 'onSubmit'
  });

  async function onSubmit(values: z.infer<typeof planSchema>) {
    try {
      await createPlan(values);
      toast.success("Plan created!");
      form.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error creating plan");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan Details</CardTitle>
        <CardDescription>Fill out the form to create a new plan.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Pro, Starter" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Short description (optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (in cents)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step={1} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? undefined as any : Number(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="messageLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message Limit</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} step={1} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? undefined as any : Number(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="devicesLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Devices Limit</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} step={1} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? undefined as any : Number(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit">Create Plan</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
