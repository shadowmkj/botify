import { NativeButtonSchema, type NativeButton, type RawButton } from "@repo/types";
import type { ButtonEntry, ButtonMessagePayload } from "@/components/message/ButtonMessageTypes";

/**
 * Converts a single ButtonEntry (UI state) to a RawButton (Baileys input shape).
 * RawButton is the *un-transformed* input that NativeButtonSchema accepts.
 */
export function entryToRawButton(btn: ButtonEntry): RawButton {
  switch (btn.type) {
    case "quick_reply":
      return {
        name: "quick_reply",
        buttonParamsJson: {
          display_text: btn.text,
          id: btn.payload || btn.id,
        },
      };
    case "cta_url":
      return {
        name: "cta_url",
        buttonParamsJson: {
          display_text: btn.text,
          url: btn.payload,
        },
      };
    case "cta_call":
      return {
        name: "cta_call",
        buttonParamsJson: {
          display_text: btn.text,
          phone_number: btn.payload,
        },
      };
    case "cta_copy":
      return {
        name: "cta_copy",
        buttonParamsJson: {
          display_text: btn.text,
          copy_code: btn.payload,
        },
      };
    case "single_select":
      return {
        name: "single_select",
        buttonParamsJson: {
          // title is the list button label shown in the chat bubble
          title: btn.text,
          sections: (btn.sections ?? []).map((s) => ({
            title: s.title,
            rows: s.rows.map((r) => ({
              id: r.id,
              title: r.title,
              description: r.description,
            })),
          })),
        },
      };
  }
}

/**
 * Converts a ButtonMessagePayload's buttons to RawButton[].
 * Safe to call client-side (no Zod transform yet).
 */
export function buildBaileysButtons(buttons: ButtonEntry[]): RawButton[] {
  return buttons.map(entryToRawButton);
}

/**
 * Validates and transforms RawButton[] → NativeButton[] (server-side).
 * Throws if any button fails validation.
 */
export function validateAndBuildButtons(buttons: ButtonEntry[]): NativeButton[] {
  const rawButtons = buildBaileysButtons(buttons);
  return rawButtons.map((raw, i) => {
    const result = NativeButtonSchema.safeParse(raw);
    if (!result.success) {
      throw new Error(
        `Button ${i + 1} is invalid: ${result.error.issues.map((e) => e.message).join(", ")}`
      );
    }
    return result.data;
  });
}

/**
 * Full helper: ButtonMessagePayload → args ready for MessageService.queueButtonMessage()
 */
export function buildButtonMessageArgs(payload: ButtonMessagePayload) {
  const nativeButtons = validateAndBuildButtons(payload.buttons);
  return {
    title: payload.header,
    text: payload.body,
    footer: payload.footer,
    buttons: nativeButtons,
  };
}
