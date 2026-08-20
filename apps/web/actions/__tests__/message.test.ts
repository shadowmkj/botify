import { sendMessage, sendButtonMessage } from "@/actions/message";
import { prisma } from "@repo/db";
import { MessageService } from "@/lib/messageService";

jest.mock("@repo/db", () => ({
  prisma: {
    device: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("@/lib/messageService", () => {
  return {
    MessageService: jest.fn().mockImplementation(() => ({
      queueSendMessage: jest.fn().mockResolvedValue({ id: "job_send" }),
      queueButtonMessage: jest.fn().mockResolvedValue({ id: "job_btn" }),
    })),
  };
});

describe("message actions", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("sendMessage", () => {
    it("should throw error if input validation fails", async () => {
      await expect(
        sendMessage({
          sender: "invalid",
          receiver: "invalid",
          message: "",
        })
      ).rejects.toThrow(/Invalid data/);
    });

    it("should throw error if sender device not found", async () => {
      (prisma.device.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        sendMessage({
          sender: "+919999999999",
          receiver: "+918888888888",
          message: "Hello",
        })
      ).rejects.toThrow(/Device not found/);
    });

    it("should queue send message successfully", async () => {
      (prisma.device.findUnique as jest.Mock).mockResolvedValue({
        userId: "user_1",
      });

      const res = await sendMessage({
        sender: "+919999999999",
        receiver: "+918888888888",
        message: "Hello World",
      });

      expect(res).toEqual({
        status: true,
        message: "Message queued successfully",
      });
    });

    it("should handle QUOTA_EXCEEDED error", async () => {
      (prisma.device.findUnique as jest.Mock).mockResolvedValue({
        userId: "user_1",
      });
      const error: any = new Error("Quota");
      error.code = "QUOTA_EXCEEDED";

      (MessageService as unknown as jest.Mock).mockImplementationOnce(() => ({
        queueSendMessage: jest.fn().mockRejectedValue(error),
      }));

      await expect(
        sendMessage({
          sender: "+919999999999",
          receiver: "+918888888888",
          message: "Hello",
        })
      ).rejects.toThrow("Your plan limit is reached. Upgrade your plan or wait for reset.");
    });
  });

  describe("sendButtonMessage", () => {
    it("should throw error if button message body is empty", async () => {
      await expect(
        sendButtonMessage({
          sender: "+919999999999",
          receiver: "+918888888888",
          buttonPayload: {
            header: "Header",
            body: "   ",
            footer: "Footer",
            buttons: [{ id: "1", type: "quick_reply", text: "Click" }],
          },
        })
      ).rejects.toThrow("Button message body is required.");
    });

    it("should throw error if button list is empty", async () => {
      await expect(
        sendButtonMessage({
          sender: "+919999999999",
          receiver: "+918888888888",
          buttonPayload: {
            header: "Header",
            body: "Hello",
            footer: "Footer",
            buttons: [],
          },
        })
      ).rejects.toThrow("At least one button is required.");
    });

    it("should queue button message successfully", async () => {
      (prisma.device.findUnique as jest.Mock).mockResolvedValue({
        userId: "user_1",
      });

      const res = await sendButtonMessage({
        sender: "+919999999999",
        receiver: "+918888888888",
        buttonPayload: {
          header: "Header",
          body: "Choose an option",
          footer: "Footer",
          buttons: [{ id: "1", type: "quick_reply", text: "Yes", payload: "yes" }],
        },
      });

      expect(res).toEqual({
        status: true,
        message: "Button message queued successfully",
      });
    });
  });
});
