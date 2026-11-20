import { verifyPdfToken } from "@/features/proformas/server/pdfToken";
import { authOptions } from "@/features/auth/server/auth";
import { formatCRC, toNumber } from "@/shared/lib/money";
import { prisma } from "@/shared/lib/prisma";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

function stripBullet(line: string) {
  return line.replace(/^[-*•]\s*/, "");
}

function parseDescription(description: string) {
  const lines = description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return { title: "", bullets: [] as string[] };
  }
  return { title: lines[0], bullets: lines.slice(1).map(stripBullet) };
}

function toNum(value: unknown) {
  if (value && typeof value === "object" && "toString" in value) {
    return toNumber((value as { toString: () => string }).toString());
  }
  return toNumber(value);
}

function StarIcon() {
  return (
    <svg
      className="star-icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2l2.2 6.6H21l-5.6 4.1 2.2 6.6L12 15.2 6.4 19.3l2.2-6.6L3 8.6h6.8z" />
    </svg>
  );
}

export default async function FacturaTemplatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token: rawToken } = await searchParams;
  const factura = await prisma.invoice.findUnique({
    where: { id },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      user: { include: { companySetting: true } },
    },
  });

  if (!factura) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const tokenValid = verifyPdfToken(
    `invoice:${factura.userId}:${factura.id}`,
    rawToken ?? ""
  );
  const isOwner = session?.user?.id === factura.userId;

  if (!isOwner && !tokenValid) {
    notFound();
  }

  const company = factura.user.companySetting;
  const companyName = company?.name ?? "Pan d' Casa";
  const subtotal = toNum(factura.subtotal);
  const total = toNum(factura.total);
  const discount = toNum(factura.discount ?? 0);
  const showUnitPrice = factura.showUnitPrice ?? true;
  const notes = factura.notes?.trim() || "";
  const issuedDate = new Intl.DateTimeFormat("es-CR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Costa_Rica",
  }).format(factura.issueDate);

  return (
    <div className="sheet">
      <style>{`
        .sheet {
          --amber: #2f6b45;
          --coffee: #a32020;
          --ink: #2d2a26;
          --muted: #6b6b6b;
          --line: #d9cdbf;
          --row: #f0f0f0;
          --paper: #ffffff;
          width: 900px;
          margin: 32px auto;
          background: var(--paper);
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.08);
          position: relative;
          padding: 48px 56px 64px;
          color: var(--ink);
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          box-sizing: border-box;
        }
        .sheet *, .sheet *::before, .sheet *::after { box-sizing: border-box; }

        @page { size: A4; margin: 0; }

        body {
          margin: 0;
          background: #eae6e0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .top-band {
          height: 40px;
          position: absolute;
          top: 0; left: 0; right: 0;
          background: linear-gradient(120deg,
            var(--coffee) 0 33%, #ffffff 33% 35%,
            var(--amber) 35% 68%, #ffffff 68% 70%,
            var(--coffee) 70% 100%);
        }
        .bottom-band {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 16px;
          background: linear-gradient(120deg,
            var(--amber) 0 33%, #ffffff 33% 35%,
            var(--coffee) 35% 68%, #ffffff 68% 70%,
            var(--amber) 70% 100%);
        }

        .content { position: relative; z-index: 1; }

        .header {
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          margin-top: 8px;
        }
        .brand {
          display: flex; align-items: center; gap: 8px;
          font-size: 28px; font-weight: 700; letter-spacing: 0.5px;
        }
        .star-icon { color: var(--amber); flex-shrink: 0; }
        .title {
          text-align: right;
          font-size: 40px;
          font-weight: 800;
          font-style: italic;
          color: var(--coffee);
          letter-spacing: 1px;
          line-height: 1;
        }
        .title small {
          display: block;
          margin-top: 6px;
          font-size: 12px;
          font-style: normal;
          font-weight: 700;
          letter-spacing: 0.32em;
          color: var(--amber);
        }

        .divider { margin: 18px 0 24px; border-bottom: 3px dotted var(--amber); }

        .bill-to {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          padding-bottom: 16px;
          border-bottom: 2px dotted var(--coffee);
        }
        .bill-label {
          margin: 0 0 6px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.22em;
          color: var(--amber);
        }
        .bill-to h3 { margin: 0 0 6px; font-size: 22px; }
        .bill-to p { margin: 2px 0; color: var(--muted); font-size: 14px; }
        .invoice-meta { text-align: right; font-size: 13px; color: var(--muted); }
        .invoice-meta .meta-number {
          display: block; font-size: 22px; color: var(--ink); margin: 6px 0 8px;
        }
        .invoice-meta p { margin: 2px 0; font-size: 13px; color: var(--muted); }

        table { width: 100%; border-collapse: collapse; margin-top: 18px; font-size: 14px; }
        thead th {
          background: var(--amber); color: #ffffff; text-align: left;
          padding: 10px 12px; font-weight: 700;
        }
        tbody td { padding: 12px; vertical-align: top; }
        tbody tr:nth-child(odd) { background: var(--row); }
        .col-price, .col-qty, .col-total { text-align: right; }
        thead th.col-price, thead th.col-qty, thead th.col-total { text-align: right; }

        .item-title {
          margin: 0 0 6px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.08em; font-size: 12px; color: var(--coffee);
        }
        .item-list { margin: 0; padding-left: 18px; list-style-type: disc; }
        .item-list li { margin-bottom: 3px; }

        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 28px;
          margin-top: 24px;
        }
        .notes { font-size: 13px; color: var(--muted); line-height: 1.6; white-space: pre-line; }
        .totals { font-size: 14px; }
        .totals div { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .totals .grand {
          font-weight: 700; font-size: 18px; color: var(--coffee);
          padding-top: 8px; border-top: 2px solid var(--ink);
        }

        .thanks {
          margin-top: 20px; padding-top: 14px;
          border-top: 1px dashed var(--amber);
          text-align: center; font-size: 13px; font-style: italic; color: var(--coffee);
        }

        .contact-row {
          display: flex; flex-wrap: wrap; gap: 18px;
          margin-top: 28px; font-size: 13px;
        }
        .contact-row > div {
          display: inline-flex; align-items: baseline; gap: 6px; white-space: nowrap;
        }

        @media print {
          body { background: #ffffff; }
          .sheet {
            width: 210mm; min-height: 297mm; margin: 0;
            box-shadow: none; padding-top: 56px; padding-bottom: 64px;
          }
          .top-band, .bottom-band { position: fixed; left: 0; right: 0; z-index: 0; }
          .top-band { top: 0; }
          .bottom-band { bottom: 0; }
          thead { display: table-header-group; }
          tr, td, th { break-inside: avoid; page-break-inside: avoid; }
          .bill-to, .footer-grid, .thanks, .contact-row {
            break-inside: avoid; page-break-inside: avoid;
          }
        }

        @media (max-width: 768px) {
          body { background: #f5f1eb; }
          .sheet { width: 100%; margin: 0; box-shadow: none; padding: 28px 20px 40px; }
          .header { grid-template-columns: 1fr; gap: 12px; }
          .title { text-align: left; font-size: 32px; }
          .bill-to, .footer-grid { grid-template-columns: 1fr; gap: 16px; }
          .invoice-meta { text-align: left; }
          table { font-size: 12px; }
          thead th, tbody td { padding: 8px; }
          .contact-row { gap: 12px; font-size: 12px; }
          .contact-row > div { width: 100%; }
        }
      `}</style>

      <div className="top-band"></div>

      <div className="content">
        <div className="header">
          <div className="brand">
            <StarIcon />
            {companyName}
          </div>
          <div className="title">
            FACTURA
            <small>DIGITAL</small>
          </div>
        </div>

        <div className="divider"></div>

        <section className="bill-to">
          <div>
            <p className="bill-label">FACTURADO A</p>
            <h3>{factura.clientNombre}</h3>
            {factura.clientCedula ? (
              <p>
                <strong>Cédula:</strong> {factura.clientCedula}
              </p>
            ) : null}
          </div>
          <div className="invoice-meta">
            FACTURA #
            <strong className="meta-number">{factura.number}</strong>
            <p>
              <strong>Fecha:</strong> {issuedDate}
            </p>
          </div>
        </section>

        <table>
          <thead>
            <tr>
              <th>DESCRIPCIÓN</th>
              {showUnitPrice ? <th className="col-price">PRECIO</th> : null}
              <th className="col-qty">CANT.</th>
              <th className="col-total">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {factura.items.map((item) => {
              const unitPrice = toNum(item.unitPrice);
              const parsed = parseDescription(item.description);

              return (
                <tr key={item.id}>
                  <td>
                    {parsed.title ? (
                      <>
                        <p className="item-title">{parsed.title}</p>
                        {parsed.bullets.length > 0 ? (
                          <ul className="item-list">
                            {parsed.bullets.map((bullet, index) => (
                              <li key={`${item.id}-bullet-${index}`}>{bullet}</li>
                            ))}
                          </ul>
                        ) : null}
                      </>
                    ) : (
                      <span>{item.description}</span>
                    )}
                  </td>
                  {showUnitPrice ? (
                    <td className="col-price">{formatCRC(unitPrice)}</td>
                  ) : null}
                  <td className="col-qty">{item.quantity}</td>
                  <td className="col-total">
                    {formatCRC(item.quantity * unitPrice)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="footer-grid">
          <div className="notes">
            {notes ? (
              <>
                <strong>NOTAS:</strong>
                <br />
                {notes}
              </>
            ) : null}
          </div>
          <div className="totals">
            <div>
              <span>SUBTOTAL</span>
              <span>{formatCRC(subtotal)}</span>
            </div>
            {discount > 0 ? (
              <div>
                <span>DESCUENTO</span>
                <span>- {formatCRC(discount)}</span>
              </div>
            ) : null}
            <div className="grand">
              <span>TOTAL</span>
              <span>{formatCRC(total)}</span>
            </div>
          </div>
        </div>

        <p className="thanks">¡Gracias por su compra en {companyName}!</p>

        <div className="contact-row">
          <div>
            <strong>Teléfono.</strong>
            {company?.phone ?? "-"}
          </div>
          <div>
            <strong>Nombre.</strong>
            {company?.contactName ?? "-"}
          </div>
          <div>
            <strong>Cédula.</strong>
            {company?.cedula ?? "-"}
          </div>
          <div>
            <strong>Email.</strong>
            {company?.email ?? "-"}
          </div>
          {company?.address ? (
            <div>
              <strong>Dirección.</strong>
              {company.address}
            </div>
          ) : null}
        </div>
      </div>

      <div className="bottom-band"></div>
    </div>
  );
}
