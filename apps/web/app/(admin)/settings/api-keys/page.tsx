import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ApiKeysPage } from "./client";

export default async function Page() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session) {
        return redirect("/sign-in");
    }

    return <ApiKeysPage />;
}
