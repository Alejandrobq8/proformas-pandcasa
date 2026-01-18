import crypto from "crypto";

const SECRET = process.env.PDF_TOKEN_SECRET ?? "dev-secret";

export function signPdfToken(payload: string) {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
}

export function verifyPdfToken(payload: string, token: string) {
  const expected = signPdfToken(payload);
  if (expected.length !== token.length) {
    return false;
  }
  return crypto.timingSafeEqual(
    Buffer.from(expected, "utf8"),
    Buffer.from(token, "utf8")
  );
}
