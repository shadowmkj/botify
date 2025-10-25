import z from "zod";

export const planSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  messageLimit: z.number().positive("Message limit must be positive").optional(),
  devicesLimit: z.number().int().min(1, "Devices limit must be at least 1"),
});
