import { signInWithGoogle } from "@/actions/google-auth-action";
import { authClient } from "@/lib/auth-client";

jest.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      social: jest.fn(),
    },
  },
}));

describe("google-auth-action", () => {
  it("should trigger social sign in with google", async () => {
    await signInWithGoogle();
    expect(authClient.signIn.social).toHaveBeenCalledWith({
      provider: "google",
    });
  });
});
