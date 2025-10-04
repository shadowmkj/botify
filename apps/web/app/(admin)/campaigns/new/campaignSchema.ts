import { phoneNumberSchema } from "@repo/types";
import z from "zod";

export const createCampaignSchema = z.object({
  name: z.string().min(3, {
    message: 'Campaign name must be at least 3 characters long.',
  }).max(50, {
    message: 'Campaign name must not exceed 50 characters.',
  }),
  message: z.string().min(1, {
    message: 'Message is required',
  }).max(500, {
    message: 'Message must not exceed 500 characters.',
  }),
  sender: phoneNumberSchema,
  contactGroupId: z.string().refine(value => value !== "", {
    message: 'Please select a contact group.',
  }),
  media: z.string().optional(),
});
