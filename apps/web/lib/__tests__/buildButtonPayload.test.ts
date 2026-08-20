import {
  entryToRawButton,
  buildBaileysButtons,
  validateAndBuildButtons,
  buildButtonMessageArgs,
} from "@/lib/buildButtonPayload";
import type { ButtonEntry, ButtonMessagePayload } from "@/components/message/ButtonMessageTypes";

describe("buildButtonPayload", () => {
  it("should convert quick_reply ButtonEntry to RawButton", () => {
    const btn: ButtonEntry = {
      id: "btn_1",
      type: "quick_reply",
      text: "Click Me",
      payload: "payload_1",
    };
    const raw = entryToRawButton(btn);
    expect(raw).toEqual({
      name: "quick_reply",
      buttonParamsJson: {
        display_text: "Click Me",
        id: "payload_1",
      },
    });
  });

  it("should fallback to btn.id if payload is empty for quick_reply", () => {
    const btn: ButtonEntry = {
      id: "btn_fallback",
      type: "quick_reply",
      text: "Click Me",
    };
    const raw = entryToRawButton(btn);
    expect(raw).toEqual({
      name: "quick_reply",
      buttonParamsJson: {
        display_text: "Click Me",
        id: "btn_fallback",
      },
    });
  });

  it("should convert cta_url ButtonEntry to RawButton", () => {
    const btn: ButtonEntry = {
      id: "btn_2",
      type: "cta_url",
      text: "Visit Website",
      payload: "https://example.com",
    };
    const raw = entryToRawButton(btn);
    expect(raw).toEqual({
      name: "cta_url",
      buttonParamsJson: {
        display_text: "Visit Website",
        url: "https://example.com",
      },
    });
  });

  it("should convert cta_call ButtonEntry to RawButton", () => {
    const btn: ButtonEntry = {
      id: "btn_3",
      type: "cta_call",
      text: "Call Us",
      payload: "+1234567890",
    };
    const raw = entryToRawButton(btn);
    expect(raw).toEqual({
      name: "cta_call",
      buttonParamsJson: {
        display_text: "Call Us",
        phone_number: "+1234567890",
      },
    });
  });

  it("should convert cta_copy ButtonEntry to RawButton", () => {
    const btn: ButtonEntry = {
      id: "btn_4",
      type: "cta_copy",
      text: "Copy Promo Code",
      payload: "PROMO2026",
    };
    const raw = entryToRawButton(btn);
    expect(raw).toEqual({
      name: "cta_copy",
      buttonParamsJson: {
        display_text: "Copy Promo Code",
        copy_code: "PROMO2026",
      },
    });
  });

  it("should convert single_select ButtonEntry to RawButton", () => {
    const btn: ButtonEntry = {
      id: "btn_5",
      type: "single_select",
      text: "Choose Option",
      sections: [
        {
          title: "Section 1",
          rows: [
            { id: "row_1", title: "Option 1", description: "First choice" },
            { id: "row_2", title: "Option 2" },
          ],
        },
      ],
    };
    const raw = entryToRawButton(btn);
    expect(raw).toEqual({
      name: "single_select",
      buttonParamsJson: {
        title: "Choose Option",
        sections: [
          {
            title: "Section 1",
            rows: [
              { id: "row_1", title: "Option 1", description: "First choice" },
              { id: "row_2", title: "Option 2", description: undefined },
            ],
          },
        ],
      },
    });
  });

  it("should build baileys buttons list", () => {
    const buttons: ButtonEntry[] = [
      { id: "1", type: "quick_reply", text: "Yes", payload: "yes" },
      { id: "2", type: "quick_reply", text: "No", payload: "no" },
    ];
    const raw = buildBaileysButtons(buttons);
    expect(raw).toHaveLength(2);
  });

  it("should validate and build valid buttons", () => {
    const buttons: ButtonEntry[] = [
      { id: "1", type: "quick_reply", text: "Yes", payload: "yes" },
      { id: "2", type: "cta_url", text: "Google", payload: "https://google.com" },
    ];
    const validated = validateAndBuildButtons(buttons);
    expect(validated).toHaveLength(2);
    expect(validated[0].name).toBe("quick_reply");
  });

  it("should throw error if button is invalid during validation", () => {
    const buttons: ButtonEntry[] = [
      { id: "1", type: "cta_url", text: "Invalid", payload: "not-a-valid-url" },
    ];
    expect(() => validateAndBuildButtons(buttons)).toThrow(/Button 1 is invalid/);
  });

  it("should build button message args from payload", () => {
    const payload: ButtonMessagePayload = {
      header: "Welcome",
      body: "Please choose an action",
      footer: "Botify Team",
      buttons: [
        { id: "1", type: "quick_reply", text: "Subscribe", payload: "sub" },
      ],
    };

    const args = buildButtonMessageArgs(payload);
    expect(args.title).toBe("Welcome");
    expect(args.text).toBe("Please choose an action");
    expect(args.footer).toBe("Botify Team");
    expect(args.buttons).toHaveLength(1);
  });
});
