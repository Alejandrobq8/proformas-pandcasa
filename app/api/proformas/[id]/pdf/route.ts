import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signPdfToken } from "@/lib/pdfToken";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export const runtime = "nodejs";

function getBaseUrl(request: Request) {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto =
    request.headers.get("x-forwarded-proto") ??
    (host?.includes("localhost") ? "http" : "https");

  return `${proto}://${host}`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const proforma = await prisma.proforma.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!proforma) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const tokenPayload = `${session.user.id}:${id}`;
  const token = signPdfToken(tokenPayload);
  const baseUrl = getBaseUrl(request);
  const printUrl = `${baseUrl}/proformas/${id}/print-template?token=${token}`;

  const packUrl = process.env.CHROMIUM_PACK_URL;
  let executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH ??
    process.env.CHROME_EXECUTABLE_PATH ??
    null;
  if (!executablePath) {
    try {
      executablePath = packUrl
        ? await chromium.executablePath(packUrl)
        : await chromium.executablePath();
    } catch {
      executablePath = null;
    }
  }
  if (!executablePath) {
    return NextResponse.json(
      {
        error:
          "No se encontro Chrome. Define PUPPETEER_EXECUTABLE_PATH o CHROME_EXECUTABLE_PATH. En Vercel con chromium-min, define CHROMIUM_PACK_URL.",
      },
      { status: 500 }
    );
  }

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: executablePath || undefined,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.goto(printUrl, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${proforma.number}.pdf"`,
      },
    });
  } finally {
    await browser.close();
  }
}
