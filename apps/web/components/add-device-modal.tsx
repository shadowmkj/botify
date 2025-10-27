/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormControl, Form, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "./ui/input";
import { deviceCreateSchema, DeviceCreateValues } from "@/types";
import { addDevice } from "@/actions/device";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const AddDeviceModal = () => {
    const router = useRouter();
    const form = useForm<DeviceCreateValues>({
        resolver: zodResolver(deviceCreateSchema),
        defaultValues: {
            number: "",
        }
    })
    const onSubmit = async (data: DeviceCreateValues) => {
        try {
            const res = await addDevice(data);
            console.log(JSON.stringify(res));
            if (res.status) {
                router.refresh();
            } else {
                const errMsg = typeof (res as any).error === "string"
                  ? (res as any).error
                  : (res as any).error?.error
                toast.error(errMsg || "Failed to add device");
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Something went wrong");
            console.error(error);
            return;
        }
        setIsOpen(false);
    }
    const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            <Button onClick={() => setIsOpen(true)}>
                <Plus />
                Add Device
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Add new device</DialogTitle>
                        <DialogDescription>
                            Add a new device to your account. You can manage your devices here.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)}>
                                <FormField control={form.control} name="number" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Device Number</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Number" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </form>
                        </Form>
                    </div>
                    <DialogFooter>
                        <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
                            Save changes
                        </Button>
                        <Button variant="outline" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >
        </>
    )
}

export default AddDeviceModal
