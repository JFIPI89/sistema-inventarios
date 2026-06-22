import { NextRequest, NextResponse } from "next/server";
import { exportReportCsv } from "@/actions/reports";
import { parseSections } from "@/lib/reports/sections";

export async function GET(request: NextRequest) {
  const start = request.nextUrl.searchParams.get("start") || "";
  const end = request.nextUrl.searchParams.get("end") || "";
  const sectionsParam = request.nextUrl.searchParams.get("sections") || "";

  if (!start || !end) {
    return NextResponse.json({ error: "Fechas requeridas" }, { status: 400 });
  }

  const sections = parseSections(sectionsParam);

  if (sections.length === 0) {
    return NextResponse.json(
      { error: "Selecciona al menos una sección" },
      { status: 400 }
    );
  }

  try {
    const csv = await exportReportCsv(start, end, sections);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="informe-horus-${start}-${end}.csv"`,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al generar CSV";
    const status = message === "No autorizado" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
