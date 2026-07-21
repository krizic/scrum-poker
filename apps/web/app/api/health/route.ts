import { NextResponse } from "next/server";

// Thin liveness placeholder used by the Docker healthcheck (issue #17).
// Real service wiring lands later; this only proves the app/api segment works.
export function GET() {
  return NextResponse.json({ status: "ok" });
}
