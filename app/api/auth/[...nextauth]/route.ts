export const dynamic = 'force-dynamic';
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// NextAuth API route for App Router
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
