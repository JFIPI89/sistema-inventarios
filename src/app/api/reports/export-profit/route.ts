import { NextRequest, NextResponse } from "next/server";
import { exportProfitCsv } from "@/actions/reports";

export async function GET(request: NextRequest) {
  const start = request.nextUrl.searchParams.get("start") || "";
  const end = request.nextUrl.searchParams.get("end") || "";

  if (!start || !end) {
    return NextResponse.json({ error: "Fechas requeridas" }, { status: 400 });
  }

  const csv = await exportProfitCsv(start, end);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="utilidades-${start}-${end}.csv"`,
    },
  });
}
