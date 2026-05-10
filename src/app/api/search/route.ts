import { NextResponse } from "next/server";
import { globalSearch } from "@/services/globalSearch";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const limitRaw = Number(searchParams.get("limit") ?? 5);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(20, Math.max(1, limitRaw))
    : 5;

  if (q.length < 2) {
    return NextResponse.json(
      { groups: [], total: 0, q, took_ms: 0 },
      { headers: { "Cache-Control": "private, max-age=10" } },
    );
  }

  const t0 = Date.now();
  const result = await globalSearch(q, limit);
  const took_ms = Date.now() - t0;
  // Log básico no server pra observabilidade — útil pra entender latência
  // sem precisar instrumentar APM. Não é spammy: 1 linha por request.
  // eslint-disable-next-line no-console
  console.log(`[search] q="${q}" took=${took_ms}ms total=${result.total}`);

  return NextResponse.json(
    { ...result, q, took_ms },
    { headers: { "Cache-Control": "private, max-age=10" } },
  );
}
