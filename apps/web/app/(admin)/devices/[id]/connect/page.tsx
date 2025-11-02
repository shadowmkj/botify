"use client";
import { logoutDevice } from "@/actions/device";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { SocketEvent } from "@repo/types";
import Image from "next/image";
import { use, useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { io, Socket } from "socket.io-client";
let socket: Socket;

const WhatsappScannerPage = ({
    params,
}: {
    params: Promise<{ id: string }>;
}) => {
    const { id: sessionId } = use(params);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [status, setStatus] = useState("");
    const [profilePic, setProfilePic] = useState("");

    useEffect(() => {
        const socketUrl =
            process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

        socket = io(socketUrl);

        socket.on("qr-update", (message: string) => {
            const data = JSON.parse(message) as SocketEvent;
            console.log(data);
            if (data.event == "QR") {
                setQrCode(data.qr!);
                setProfilePic("");
                setStatus("Disconnected");
            } else if (data.event == "OPEN") {
                setQrCode(null);
                setProfilePic(data.profile || "");
                setStatus("Connected");
            } else if (data.event == "LOGOUT") {
                setQrCode(null);
                setProfilePic("");
                setStatus("Disconnected");
            }
        });

        socket.emit("subscribe-to-qr", { sessionId });

        return () => {
            if (socket) socket.disconnect();
        };
    }, [sessionId]);

    const handleLogout = async () => {
        await logoutDevice(sessionId);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen  p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-1">
                {/* QR Code Scanner Section */}
                <Card className="w-full max-w-lg mx-auto rounded-xl shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-center">
                            Scan QR Code
                        </CardTitle>
                        <CardDescription className="text-center">
                            To link your WhatsApp account, scan this code with your phone.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center p-6">
                        {qrCode && (
                            <div className="bg-white p-4 rounded-lg flex items-center justify-center">
                                <QRCode level="M" value={qrCode} />
                            </div>
                        )}
                        {profilePic && (
                            <Image
                                width={100}
                                height={100}
                                src={profilePic}
                                alt="Profile"
                                className="rounded-full"
                            />
                        )}
                        {!qrCode && status != "Connected" && <span>Loading..</span>}
                        {status === "Connected" && (
                            <div className="text-green-500 mt-4">Connected Successfully!</div>
                        )}
                        {status === "Disconnected" && (
                            <div className="text-red-500 mt-4">
                                Disconnected. Please try again.
                            </div>
                        )}
                        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
                            Need help?{" "}
                            <a href="#" className="underline">
                                Learn how to connect
                            </a>
                            .
                        </p>
                        <div className="mt-auto w-half pt-4">
                            <Button
                                onClick={handleLogout}
                                className="w-full "
                                variant={"destructive"}
                            >
                                Log out
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* User Information Section */}
                {/* <Card className="w-full max-w-md mx-auto rounded-xl shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              Account Information
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              This is the account linked to this session.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-24 h-24 border-4 border-white dark:border-gray-800 shadow-md">
                <AvatarImage src={userInfo.avatarUrl} alt={userInfo.name} />
                <AvatarFallback>
                  {userInfo.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h2 className="text-xl font-semibold">{userInfo.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  &quot;{userInfo.status}&quot;
                </p>
              </div>
            </div>
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
              <InfoItem label="Phone Number" value={userInfo.phone} />
              <InfoItem label="Status" value="Connected" />
              <InfoItem label="Device" value="Web Browser" />
            </div>
            <Button
              onClick={handleLogout}
              className="flex w-full"
              variant={"destructive"}
            >
              Log out
            </Button>
          </CardContent>
        </Card> */}
            </div>
        </div>
    );
};

export default WhatsappScannerPage;
