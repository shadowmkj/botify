import { type DeviceStatus } from "@repo/db";
export declare const updateDeviceStatus: (number: string, status: DeviceStatus) => Promise<{
    id: string;
    messagesSent: number;
    body: string;
    status: import("@repo/db").$Enums.DeviceStatus;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
}>;
//# sourceMappingURL=helper.d.ts.map