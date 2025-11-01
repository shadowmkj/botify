import { phoneNumberSchema } from "@repo/types";
import z from "zod";

export const createCampaignSchema = z.object({
  name: z.string().min(3, {
    message: 'Campaign name must be at least 3 characters long.',
  }).max(50, {
    message: 'Campaign name must not exceed 50 characters.',
  }),
  message: z.string().max(500, {
    message: 'Message must not exceed 500 characters.',
  }).default(''),
  sender: phoneNumberSchema,
  contactGroupId: z.string().refine(value => value !== "", {
    message: 'Please select a contact group.',
  }),
  media: z.string().optional(),
}).superRefine((data, ctx) => {
  const hasMessage = typeof data.message === 'string' && data.message.trim().length > 0;
  const hasMedia = typeof data.media === 'string' && data.media.trim().length > 0;
  if (!hasMessage && !hasMedia) {
    ctx.addIssue({ code: 'custom', message: 'Message or media is required' });
  }
});
