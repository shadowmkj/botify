import { renderPasswordResetEmail } from "@/lib/templates";

describe("renderPasswordResetEmail", () => {
  it("should generate subject, html, and text with correct user email and resetUrl", () => {
    const data = {
      userEmail: "test@example.com",
      resetUrl: "https://example.com/reset-password?token=abc",
    };

    const rendered = renderPasswordResetEmail(data);

    expect(rendered.subject).toBe("Reset your password");
    expect(rendered.html).toContain("test@example.com");
    expect(rendered.html).toContain("https://example.com/reset-password?token=abc");
    expect(rendered.text).toContain("test@example.com");
    expect(rendered.text).toContain("https://example.com/reset-password?token=abc");
  });
});
