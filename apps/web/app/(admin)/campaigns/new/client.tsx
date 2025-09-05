'use client'
import { createCampaign } from "@/actions/campaign";
import { getConnectedDevices } from "@/actions/device";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { ContactGroup } from "@repo/db";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import z from "zod";
import { createCampaignSchema } from "./campaignSchema";
import { toast } from "sonner";

export default function CampaignForm({ contactGroups }: { contactGroups: ContactGroup[] }) {
  const { data: devices } = useQuery({
    queryKey: ['devices'],
    queryFn: getConnectedDevices,
  });
  const form = useForm({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: {
      name: '',
      message: '',
      contactGroupId: '',
    },
  });

  async function onSubmit(values: z.infer<typeof createCampaignSchema>) {
    try {
      await createCampaign(values)
      toast.success("Campaign Created!")
    } catch {
      toast.error("Error creating campaign!")
    }
    form.reset();
  }

  return (
    <Form {...form} >
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campaign Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Summer Sale Announcement" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Contact Group Field */}
        <FormField
          name="contactGroupId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Group</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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

        <FormField
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Write your campaign message here..."
                  className="resize-y"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField name="sender" render={({ field }) => (
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
                  <SelectItem key={d.id} value={d.body}>{d.body}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit">Create Campaign</Button>
      </form>
    </Form>
  );
}
