"use client";

import { getConnectedDevices } from "@/actions/device";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useDeviceStore } from "@/store/device-store";
import { useQuery } from "@tanstack/react-query";
import {
  BookUser,
  FilePen,
  LayoutDashboard,
  Reply,
  Send,
  TabletSmartphoneIcon,
  Users,
  CreditCard,
  Key,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import Logo from "./logo";
import { NavUser } from "./nav-user";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Skeleton } from "./ui/skeleton";
import { authClient } from "@/lib/auth-client";

export default function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const {
    device: currentDevice,
    setDevice,
    setInitialState,
  } = useDeviceStore();
  const { data: devices } = useQuery({
    queryKey: ["devices"],
    queryFn: getConnectedDevices,
  });
  useEffect(() => {
    setInitialState(devices?.map((device: any) => device.body) || []);
  }, [devices, setInitialState]);
  const pathname = usePathname();
  const session = authClient.useSession();
  const user = session?.data?.user;
  const isAdmin = user?.role === "admin";
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="flex items-center">
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-2 py-4 gap-y-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname.startsWith("/dashboard")}
              size="lg"
            >
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <span className={`text-sm font-medium`}>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname.startsWith("/devices")}
              size="lg"
            >
              <Link href="/devices" className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                  <TabletSmartphoneIcon />
                </div>
                <span className={`text-sm font-medium`}>Devices</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {currentDevice ? (
            <SidebarMenuItem>
              <Select
                onValueChange={(val) => setDevice(val)}
                defaultValue={currentDevice}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Device" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Devices</SelectLabel>
                    {devices?.map((device: any) => (
                      <SelectItem value={device.body} key={device.id}>
                        {device.body}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </SidebarMenuItem>
          ) : (
            <SidebarMenuItem>
              <Skeleton className="w-full h-9" />
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname.startsWith("/send-message")}
              size="lg"
            >
              <Link href="/send-message" className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                  <Send />
                </div>
                <span className={`text-sm font-medium`}>Send Message</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname.startsWith("/contacts")}
              size="lg"
            >
              <Link href="/groups" className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                  <BookUser />
                </div>
                <span className={`text-sm font-medium`}>Contacts</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname.startsWith("/campaigns")}
              size="lg"
            >
              <Link href="/campaigns" className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                  <FilePen />
                </div>
                <span className={`text-sm font-medium`}>Campaigns</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname.startsWith("/group-extraction")}
              size="lg"
            >
              <Link
                href="/group-extraction"
                className="flex items-center gap-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                  <Users />
                </div>
                <span className={`text-sm font-medium`}>Group Extraction</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname.startsWith("/autoreplies")}
              size="lg"
            >
              <Link href="/autoreplies" className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                  <Reply />
                </div>
                <span className={`text-sm font-medium`}>Autoreplies</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname.startsWith("/settings/api-keys")}
              size="lg"
            >
              <Link
                href="/settings/api-keys"
                className="flex items-center gap-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                  <Key />
                </div>
                <span className={`text-sm font-medium`}>API Keys</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {isAdmin && (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname.startsWith("/plans")}
                  size="lg"
                >
                  <Link href="/plans" className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                      <CreditCard />
                    </div>
                    <span className={`text-sm font-medium`}>Plans</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname.startsWith("/manage-users")}
                  size="lg"
                >
                  <Link
                    href="/manage-users"
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                      <Users />
                    </div>
                    <span className={`text-sm font-medium`}>Users</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
