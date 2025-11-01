import { authClient } from "@/lib/auth-client";

export interface Apikey {
    id: string;
    name: string | null;
    start: string | null;
    prefix: string | null;
    userId: string;
    refillInterval: number | null;
    refillAmount: number | null;
    lastRefillAt: Date | null;
    enabled: boolean | null;
    rateLimitEnabled: boolean | null;
    rateLimitTimeWindow: number | null;
    rateLimitMax: number | null;
    requestCount: number | null;
    remaining: number | null;
    lastRequest: Date | null;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    permissions: { [key: string]: string[] } | null;
    metadata: Record<string, unknown> | null;
}

export interface CreateApiKeyInput {
    name?: string;
    expiresIn?: number; // in seconds
    prefix?: string;
    remaining?: number;
    metadata?: Record<string, unknown>;
}

export interface UpdateApiKeyInput {
    keyId: string;
    name?: string;
    enabled?: boolean;
    remaining?: number;
    refillAmount?: number;
    refillInterval?: number;
    metadata?: Record<string, unknown>;
}

export interface ApiKeyWithSecret extends Apikey {
    key: string;
}

export class ApiKeyService {
    static async list(): Promise<{ data: Apikey[] | null; error: unknown }> {
        return await authClient.apiKey.list();
    }

    static async create(input: CreateApiKeyInput): Promise<{ data: ApiKeyWithSecret | null; error: unknown }> {
        const expiresIn = input.expiresIn == -1 ? undefined : input.expiresIn;
        return await authClient.apiKey.create({ ...input, expiresIn: expiresIn });
    }

    static async update(input: UpdateApiKeyInput): Promise<{ data: Apikey | null; error: unknown }> {
        return await authClient.apiKey.update(input);
    }

    static async delete(keyId: string): Promise<{ data: { success: boolean } | null; error: unknown }> {
        return await authClient.apiKey.delete({ keyId });
    }

    static async get(id: string): Promise<{ data: Apikey | null; error: unknown }> {
        return await authClient.apiKey.get({ query: { id } });
    }

}
