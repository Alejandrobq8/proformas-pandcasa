import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/server/auth";
import { prisma } from "@/shared/lib/prisma";
import { signPdfToken } from "@/features/proformas/server/pdfToken";
import {
  getBaseUrl,
  PdfSetupError,
  renderPdfFromUrl,
} from "@/shared/server/renderPdf";

export const runtime = "nodejs";

const safePart = (value?: string | null) =>
  (value ?? "")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 60);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const factura = await prisma.invoice.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!factura) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const token = signPdfToken(`invoice:${session.user.id}:${id}`);
  const printUrl = `${getBaseUrl(request)}/facturas/${id}/print-template?token=${token}`;

  try {
    const pdf = await renderPdfFromUrl(printUrl);
    const filename =
      [safePart(factura.number) || "factura", safePart(factura.clientNombre)]
        .filter(Boolean)
        .join(" - ") || "factura";

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Invoice PDF generation failed", error);
    if (error instanceof PdfSetupError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      {
        error: "No se pudo generar el PDF.",
        details: error instanceof Error ? error.message : "Error generando PDF",
      },
      { status: 500 }
    );
  }
}
