/* eslint-disable @typescript-eslint/no-explicit-any */
import { sendMail } from "@/lib/mail";
import nodemailer from "nodemailer";

jest.mock("nodemailer", () => {
  const sendMailMock = jest.fn();
  return {
    createTransport: jest.fn(() => ({
      sendMail: sendMailMock,
    })),
    __mockSendMail: sendMailMock,
  };
});

describe("mail service sendMail", () => {
  let mockSendMail: jest.Mock;

  beforeEach(() => {
    mockSendMail = (nodemailer as any).__mockSendMail;
    mockSendMail.mockReset();
  });

  it("should send email successfully", async () => {
    mockSendMail.mockResolvedValue({
      messageId: "msg_123",
      accepted: ["recipient@example.com"],
      rejected: [],
    });

    const result = await sendMail({
      to: "recipient@example.com",
      subject: "Test Subject",
      text: "Hello World",
    });

    expect(result.messageId).toBe("msg_123");
    expect(result.accepted).toContain("recipient@example.com");
  });

  it("should handle EAUTH authentication error", async () => {
    const error: any = new Error("Auth failed");
    error.code = "EAUTH";
    mockSendMail.mockRejectedValue(error);

    await expect(
      sendMail({ to: "recipient@example.com", subject: "Test" })
    ).rejects.toThrow("Authentication failed. Check SMTP credentials.");
  });

  it("should handle ECONNREFUSED connection error", async () => {
    const error: any = new Error("Connection refused");
    error.code = "ECONNREFUSED";
    mockSendMail.mockRejectedValue(error);

    await expect(
      sendMail({ to: "recipient@example.com", subject: "Test" })
    ).rejects.toThrow("Connection to SMTP server failed.");
  });

  it("should handle ETIMEDOUT timeout error", async () => {
    const error: any = new Error("Timed out");
    error.code = "ETIMEDOUT";
    mockSendMail.mockRejectedValue(error);

    await expect(
      sendMail({ to: "recipient@example.com", subject: "Test" })
    ).rejects.toThrow("Email send timed out.");
  });

  it("should handle generic unknown errors", async () => {
    mockSendMail.mockRejectedValue(new Error("Unknown error"));

    await expect(
      sendMail({ to: "recipient@example.com", subject: "Test" })
    ).rejects.toThrow("Failed to send email. Please try again later.");
  });
});
