export interface User {
   id: string;
   name: string;
   email: string;
   emailVerified: boolean;
   createdAt: Date;
   updatedAt: Date;
   role?: string | undefined | null;
   image?: string | null | undefined;
   staticLogoUrl?: string | null | undefined;
}
