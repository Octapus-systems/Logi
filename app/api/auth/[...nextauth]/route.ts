import NextAuth from "next-auth";
import dns from "node:dns";

export const runtime = "nodejs";

// Must run before importing NextAuth options so Atlas SRV lookups use public DNS.
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
  dns.setDefaultResultOrder?.("ipv4first");
} catch {
  // best-effort
}

console.log("[nextauth] dns servers:", dns.getServers());

const { authOptions } = await import("@/lib/auth");

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
