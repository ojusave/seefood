import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    data: { ok: true },
    error: null,
    meta: { service: "not-hotdog-web" },
  });
}
