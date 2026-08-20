import { sendSuccessResponse, sendErrorResponse } from "@/lib/network";

describe("network helpers", () => {
  it("should format success response", () => {
    const data = { id: "123", name: "test" };
    const response = sendSuccessResponse(data);
    expect(response).toEqual({
      status: true,
      data,
    });
  });

  it("should format error response", () => {
    const error = { message: "Something went wrong" };
    const response = sendErrorResponse(error);
    expect(response).toEqual({
      status: false,
      error,
    });
  });
});
