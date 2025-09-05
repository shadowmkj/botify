import { StarsBackground } from "@/components/animate-ui/backgrounds/stars";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import { UserProvider } from "@/context/UserContext";
import { auth } from "@/lib/auth";

import { headers } from "next/headers";

export default async function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  const user = session?.user ?? null;
  return (
    <UserProvider user={user}>
      <div className="relative">
        <div className="absolute inset-x-0 top-0 w-full h-[450px] sm:h[500px] md:h-[550px] lg:h-[800px] -z-10 pointer-events-none">
          <StarsBackground className="w-full h-full" />
        </div>
        <Navbar />
        <main>
          {children}
        </main>
        <Footer />
      </div>
    </UserProvider>
  );
}
