import dns from "node:dns";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const before = dns.getServers();

  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
    dns.setDefaultResultOrder?.("ipv4first");
  } catch {
    // ignore
  }

  const after = dns.getServers();

  try {
    const records = await dns.promises.resolveSrv(
      "_mongodb._tcp.cluster0.yebi9w6.mongodb.net"
    );
    return NextResponse.json({
      ok: true,
      before,
      after,
      srvCount: records.length,
      records,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const code =
      (e && typeof e === "object" && "code" in e && (e as any).code) ||
      undefined;
    return NextResponse.json(
      { ok: false, before, after, error: { code, message: msg } },
      { status: 500 }
    );
  }
}

