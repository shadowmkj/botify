import z from "zod";
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

const QuickReplySchema = z.object({
    name: z.literal('quick_reply'),
    id: z.string(),
    text: z.string()
})

const CtaCopyButton = z.object({
    name: z.literal('cta_copy'),
    buttonParamsJson: z.object({
        display_text: z.string(),
        copy_code: z.string(),
    }).transform((val) => JSON.stringify(val))
})

const CtaCallButton = z.object({
    name: z.literal('cta_call'),
    buttonParamsJson: z.object({
        display_text: z.string(),
        phone_number: z.string()
    }).transform((val) => JSON.stringify(val))
})

const SingleSelectSchema = z.object({
    name: z.literal('single_select'),
    buttonParamsJson: z.object({
        title: z.string(),
        sections: z.array(z.object({
            title: z.string().optional(),
            rows: z.array(z.object({
                id: z.string(),
                title: z.string(),
                description: z.string().optional(),
                header: z.string().optional(),
            }))
        })
        )
    }).transform((val) => JSON.stringify(val))
})

export const NativeButtonSchema = z.discriminatedUnion("name", [QuickReplySchema, CtaCallButton, CtaCopyButton, SingleSelectSchema])

export type NativeButton = z.infer<typeof NativeButtonSchema>
export type RawButton = z.input<typeof NativeButtonSchema>


interface ConnectWhatsappJob {
    type: 'connect-whatsapp';
    sender: string;
}

interface SendMessageJob {
    type: 'send-message';
    sender: string;
    noDelay?: boolean;
    blastId?: string;
    receiver: string;
    message: string;
    // media may be a URL (preferred) or a data: URL (temporary backward compatibility)
    media?: string;
    // Optional media metadata to help the worker build the Baileys message
    mediaType?: 'image' | 'video' | 'document';
    fileName?: string;
    mimeType?: string;
}

interface SendButtonJob {
    type: 'send-button';
    sender: string;
    receiver: string;
    title: string;
    text: string;
    footer?: string;
    buttons: NativeButton[]
}

interface CampaignJob {
    type: 'campaign';
    sender: string;
    campaignId: string
}

interface LogoutWhatsappJob {
    type: 'logout';
    sender: string;
}

export type WhatsappJob = ConnectWhatsappJob | SendMessageJob | LogoutWhatsappJob | CampaignJob | SendButtonJob

export type SocketEvent = {
    event: "OPEN" | "QR" | "LOGOUT"
    qr?: string;
    profile?: string;
}
