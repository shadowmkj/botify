import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@repo/db"
import { sendPasswordResetEmail } from "@/actions/send-mail";
import { admin, apiKey } from "better-auth/plugins"

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql"
    }),
    trustedOrigins: [process.env.BETTER_AUTH_URL as string],
    emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, url }) => {
            await sendPasswordResetEmail({ email: user.email, resetUrl: url });
        },
        autoSignIn: false
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },
    rateLimit: {
        window: 60, // time window in seconds
        max: 10,
    },
    plugins: [
        admin(),
        apiKey()
    ]
})
