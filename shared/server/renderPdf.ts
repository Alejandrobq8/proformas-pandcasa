import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export function getBaseUrl(request: Request) {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto =
    request.headers.get("x-forwarded-proto") ??
    (host?.includes("localhost") ? "http" : "https");

  if (host) return `${proto}://${host}`;

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`.replace(/\/$/, "");

  return "http://localhost:3000";
}

export class PdfSetupError extends Error {}

/** Renders `url` with headless Chromium and returns the PDF bytes. */
export async function renderPdfFromUrl(url: string): Promise<Buffer> {
  const packUrl =
    process.env.CHROMIUM_PACK_URL ??
    "https://github.com/Sparticuz/chromium/releases/download/v143.0.4/chromium-v143.0.4-pack.x64.tar";
  const usePack = Boolean(process.env.VERCEL);
  const localExecutablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH ??
    process.env.CHROME_EXECUTABLE_PATH ??
    null;

  let executablePath = localExecutablePath;
  if (!executablePath) {
    try {
      executablePath = usePack
        ? await chromium.executablePath(packUrl)
        : await chromium.executablePath();
    } catch (error) {
      console.error("Chromium executablePath failed", error);
      if (!usePack) {
        try {
          executablePath = await chromium.executablePath(packUrl);
        } catch (packError) {
          console.error("Chromium pack download failed", packError);
          executablePath = null;
        }
      } else {
        executablePath = null;
      }
    }
  }
  if (!executablePath) {
    throw new PdfSetupError(
      "No se encontro Chrome. Define PUPPETEER_EXECUTABLE_PATH o CHROME_EXECUTABLE_PATH, o configura CHROMIUM_PACK_URL."
    );
  }

  const browser = await puppeteer.launch({
    args: localExecutablePath ? ["--no-sandbox"] : chromium.args,
    executablePath,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
