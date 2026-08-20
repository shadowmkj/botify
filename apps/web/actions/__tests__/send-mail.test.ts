import { sendPasswordResetEmail } from "@/actions/send-mail";
import { sendMail } from "@/lib/mail";

jest.mock("@/lib/mail", () => ({
  sendMail: jest.fn().mockResolvedValue({ messageId: "msg_reset_1" }),
}));

describe("send-mail actions", () => {
  it("should format and send password reset email", async () => {
    const res = await sendPasswordResetEmail({
      email: "user@example.com",
      resetUrl: "https://example.com/reset?token=xyz",
    });

    expect(sendMail).toHaveBeenCalledWith({
      to: "user@example.com",
      subject: "Reset your password",
      text: expect.stringContaining("https://example.com/reset?token=xyz"),
      html: expect.stringContaining("https://example.com/reset?token=xyz"),
    });
    expect(res).toEqual({ messageId: "msg_reset_1" });
  });
});
