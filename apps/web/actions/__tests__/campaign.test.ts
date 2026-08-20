import { createCampaign, deleteCampaign } from "@/actions/campaign";
import { prisma, MessageType } from "@repo/db";
import { auth } from "@/lib/auth";
import { MessageService } from "@/lib/messageService";

jest.mock("@repo/db", () => ({
  prisma: {
    campaign: {
      create: jest.fn(),
      delete: jest.fn(),
    },
    contactGroup: {
      findFirst: jest.fn(),
    },
    blast: {
      create: jest.fn(),
    },
  },
  MessageType: {
    Text: "Text",
    Image: "Image",
    Video: "Video",
    Document: "Document",
    Button: "Button",
  },
}));

jest.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}));

jest.mock("@/lib/messageService", () => {
  return {
    MessageService: jest.fn().mockImplementation(() => ({
      queueCampaign: jest.fn().mockResolvedValue({ id: "job_camp" }),
      queueButtonCampaign: jest.fn().mockResolvedValue({ id: "job_btn_camp" }),
    })),
  };
});

jest.mock("next/headers", () => ({
  headers: jest.fn().mockResolvedValue(new Headers()),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

describe("campaign actions", () => {
  beforeEach(() => {
    (auth.api.getSession as jest.Mock).mockResolvedValue({
      user: { id: "user_1" },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createCampaign", () => {
    it("should create text campaign and queue blasts", async () => {
      (prisma.campaign.create as jest.Mock).mockResolvedValue({
        id: "camp_1",
      });
      (prisma.contactGroup.findFirst as jest.Mock).mockResolvedValue({
        contacts: [{ id: "c1" }, { id: "c2" }],
      });

      await createCampaign({
        name: "Spring Sale",
        sender: "+919999999999",
        message: "Big discounts today!",
        contactGroupId: "group_1",
        isButtonCampaign: false,
      });

      expect(prisma.campaign.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "Spring Sale",
          senderNumber: "+919999999999",
          userId: "user_1",
          campaignType: MessageType.Text,
        }),
      });
      expect(prisma.blast.create).toHaveBeenCalledTimes(2);
    });

    it("should create media campaign when image URL provided", async () => {
      (prisma.campaign.create as jest.Mock).mockResolvedValue({
        id: "camp_img",
      });
      (prisma.contactGroup.findFirst as jest.Mock).mockResolvedValue({
        contacts: [],
      });

      await createCampaign({
        name: "Photo Campaign",
        sender: "+919999999999",
        message: "Check this photo",
        media: "https://example.com/banner.png",
        contactGroupId: "group_1",
        isButtonCampaign: false,
      });

      expect(prisma.campaign.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          campaignType: MessageType.Image,
        }),
      });
    });

    it("should create button campaign when isButtonCampaign is true", async () => {
      const buttonPayload = JSON.stringify({
        header: "Hi",
        body: "Click below",
        buttons: [{ id: "b1", type: "quick_reply", text: "OK", payload: "ok" }],
      });

      (prisma.campaign.create as jest.Mock).mockResolvedValue({
        id: "camp_btn",
      });
      (prisma.contactGroup.findFirst as jest.Mock).mockResolvedValue({
        contacts: [{ id: "c1" }],
      });

      await createCampaign({
        name: "Interactive Campaign",
        sender: "+919999999999",
        isButtonCampaign: true,
        buttonPayloadJson: buttonPayload,
        contactGroupId: "group_1",
      });

      expect(prisma.campaign.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          campaignType: MessageType.Button,
        }),
      });
    });

    it("should throw error if buttonPayloadJson is invalid JSON", async () => {
      await expect(
        createCampaign({
          name: "Bad Button",
          sender: "+919999999999",
          isButtonCampaign: true,
          buttonPayloadJson: "{ bad-json }",
          contactGroupId: "group_1",
        })
      ).rejects.toThrow("Invalid button payload JSON.");
    });
  });

  describe("deleteCampaign", () => {
    it("should delete campaign", async () => {
      await deleteCampaign("camp_1");
      expect(prisma.campaign.delete).toHaveBeenCalledWith({
        where: { id: "camp_1" },
      });
    });
  });
});
