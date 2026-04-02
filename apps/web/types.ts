import { z } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";

export const phoneNumberSchema = z
  .string()
  .transform((value, ctx) => {
    const cleanedValue = value.replace(/\D/g, '');
    const phoneNumber = parsePhoneNumberFromString(cleanedValue, "IN");
    if (!phoneNumber) {
      ctx.addIssue({
        code: "custom",
        message: "Please provide a valid phone number.",
        fatal: true,
      })
    }
    if (!phoneNumber || !phoneNumber.isValid() || !phoneNumber.isPossible()) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid phone number. Please check the format.",
        fatal: true,
      });
      return z.NEVER;
    }
    // You can add more checks here if needed, for example:
    // if (phoneNumber.getType() !== 'MOBILE') {
    //   ctx.addIssue({
    //     code: "custom",
    //     message: "Only mobile numbers are accepted.",
    //     fatal: true,
    //   });
    //   return z.NEVER;
    // }

    return phoneNumber.format("E.164");
  });
export const deviceCreateSchema = z.object({
  number: phoneNumberSchema
})
export type DeviceCreateValues = z.infer<typeof deviceCreateSchema>;

export const sendMessageSchema = z.object({
  number: phoneNumberSchema,
  message: z.string().max(500).default(''),
  media: z.any().optional(),
  mode: z.enum(['text', 'button']).default('text')
}).superRefine((data, ctx) => {
  const hasMessage = typeof data.message === 'string' && data.message.trim().length > 0;
  const hasMedia = !!data.media;

  if (data.mode === 'text' && !hasMessage && !hasMedia) {
    ctx.addIssue({ code: 'custom', message: 'Message or media is required' });
  }
})
export type SendMessageValues = z.infer<typeof sendMessageSchema>;
