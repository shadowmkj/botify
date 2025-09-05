import z from "zod";
export declare const sendTextSchema: z.ZodObject<{
    token: z.ZodString;
    number: z.ZodString;
    text: z.ZodString;
    type: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type sendTextType = z.infer<typeof sendTextSchema>;
//# sourceMappingURL=messageSchema.d.ts.map