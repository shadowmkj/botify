/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { updatePlan } from "@/actions/plan";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plan } from "@repo/db";
import { useForm } from "react-hook-form";
import z from "zod";
import { planSchema } from "@/app/(admin)/plans/new/planSchema";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function PlanForm({ plan }: { plan: Plan }) {
    const router = useRouter();
    const form = useForm({
        resolver: zodResolver(planSchema),
        defaultValues: {
            name: plan.name,
            description: plan.description || "",
            price: plan.price,
            messageLimit: plan.messageLimit || undefined,
            devicesLimit: plan.devicesLimit,
        },
    });

    async function onSubmit(values: z.infer<typeof planSchema>) {
        try {
            await updatePlan(plan.id, values);
            toast.success("Plan updated!");
            router.push("/plans");
        } catch {
            toast.error("Error updating plan!");
        }
        form.reset();
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <Button type="submit">Update Plan</Button>
            </form>
        </Form>
    );
}
