import z from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { Blast } from "@repo/db"

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
  media?: string;
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

export type WhatsappJob = ConnectWhatsappJob | SendMessageJob | LogoutWhatsappJob | CampaignJob;

export type SocketEvent = {
  event: "OPEN" | "QR" | "LOGOUT"
  qr?: string;
  profile?: string;
}
