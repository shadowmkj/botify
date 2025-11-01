import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function PlansAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return redirect("/sign-in");
    }
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const role = (session.user as any)?.role as string | undefined;

    if (role !== "admin") {
        return redirect("/dashboard");
    }

    return children;
}
