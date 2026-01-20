import { prisma } from "@/lib/prisma";
import { formatCRC } from "@/lib/money";
import { verifyPdfToken } from "@/lib/pdfToken";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (value && typeof value === "object" && "toString" in value) {
    return Number((value as { toString: () => string }).toString());
  }
  return 0;
}

function splitList(value: string) {
  return value
    .split(/[;,]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function stripBullet(line: string) {
  return line.replace(/^[-*•]\s*/, "");
}

function parseDescription(description: string) {
  const lines = description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { title: "", bullets: [] as string[] };
  }

  const first = lines[0];
  const rest = lines.slice(1).map(stripBullet);

  if (/^[-*•]\s*/.test(first)) {
    return { title: "", bullets: [stripBullet(first), ...rest] };
  }

  if (lines.length === 1) {
    const colonIndex = first.indexOf(":");
    if (colonIndex >= 0) {
      const title = first.slice(0, colonIndex + 1).trim();
      const tail = first.slice(colonIndex + 1).trim();
      const bullets = tail ? splitList(tail) : [];
      return { title, bullets };
    }

    const bullets = splitList(first);
    if (bullets.length > 1) {
      return { title: "", bullets };
    }

    return { title: "", bullets: [stripBullet(first)] };
  }

  return { title: first, bullets: rest };
}

export default async function ProformaTemplatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token: rawToken } = await searchParams;
  const proforma = await prisma.proforma.findUnique({
    where: { id },
    include: {
      items: true,
      user: { include: { companySetting: true } },
    },
  });

  if (!proforma) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const token = rawToken ?? "";
  const tokenValid = verifyPdfToken(`${proforma.userId}:${proforma.id}`, token);
  const isOwner = session?.user?.id === proforma.userId;

  if (!isOwner && !tokenValid) {
    notFound();
  }

  const company = proforma.user.companySetting;
  const subtotal = toNumber(proforma.subtotal);
  const discount = toNumber(proforma.discount ?? 0);
  const total = toNumber(proforma.total);
  const deliveryText = proforma.notes?.trim() || "Por definir";

  return (
    <div className="sheet">
      <style>{`
        :root {
          --amber: #f4c430;
          --coffee: #6b4b1a;
          --ink: #2d2a26;
          --muted: #6b6b6b;
          --line: #d9cdbf;
          --row: #f0f0f0;
          --paper: #ffffff;
        }

        @page {
          size: A4;
          margin: 0;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          color: var(--ink);
          background: #eae6e0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .sheet {
          --amber: #f4c430;
          --coffee: #6b4b1a;
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
        }

        .top-band {
          height: 40px;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          background: linear-gradient(
            120deg,
            var(--coffee) 0 40%,
            #ffffff 40% 42%,
            var(--amber) 42% 100%
          );
        }

        .header {
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          margin-top: 8px;
        }

        .brand {
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .title {
          text-align: right;
          font-size: 44px;
          font-weight: 800;
          font-style: italic;
          color: var(--coffee);
          letter-spacing: 1px;
        }

        .divider {
          margin: 18px 0 24px;
          border-bottom: 3px solid var(--amber);
        }

        .bill-to {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid var(--coffee);
        }

        .bill-to h3 {
          margin: 0 0 6px;
          font-size: 22px;
        }

        .bill-to p {
          margin: 2px 0;
          color: var(--muted);
          font-size: 14px;
        }

        .invoice-meta {
          text-align: right;
          font-size: 13px;
          color: var(--muted);
        }

        .invoice-meta strong {
          display: block;
          font-size: 22px;
          color: var(--ink);
          margin-top: 6px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 18px;
          font-size: 14px;
        }

        thead th {
          background: var(--amber);
          color: var(--coffee);
          text-align: left;
          padding: 10px 12px;
          font-weight: 700;
        }

        tbody td {
          padding: 12px;
          vertical-align: top;
        }

        tbody tr:nth-child(odd) {
          background: var(--row);
        }

        .col-price,
        .col-qty,
        .col-total {
          text-align: right;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 28px;
          margin-top: 24px;
        }

        .payment {
          font-size: 13px;
          color: var(--muted);
          line-height: 1.6;
        }

        .totals {
          font-size: 14px;
        }

        .totals div {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .totals .grand {
          font-weight: 700;
          font-size: 16px;
        }

        .terms {
          margin-top: 24px;
          padding-top: 16px;
          border-top: 2px solid var(--amber);
        }

        .terms h4 {
          margin: 0 0 8px;
          font-size: 14px;
          letter-spacing: 0.6px;
        }

        .terms p {
          margin: 0;
          font-size: 12px;
          color: var(--muted);
          line-height: 1.6;
        }

        .contact-row {
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
          margin-top: 28px;
          font-size: 13px;
        }

        .contact-row > div {
          display: inline-flex;
          align-items: baseline;
          gap: 6px;
          white-space: nowrap;
        }

        .bottom-band {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 16px;
          background: linear-gradient(
            120deg,
            var(--amber) 0 60%,
            #ffffff 60% 62%,
            var(--coffee) 62% 100%
          );
        }

        .item-title {
          margin: 0 0 6px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 12px;
          color: var(--coffee);
        }

        .item-list {
          margin: 0;
          padding-left: 18px;
          list-style-type: disc;
        }

        .item-list li {
          margin-bottom: 3px;
        }

        @media print {
          body {
            background: #ffffff;
          }

          .sheet {
            width: 210mm;
            min-height: 297mm;
            margin: 0;
            box-shadow: none;
            padding-top: 56px;
            padding-bottom: 64px;
            -webkit-box-decoration-break: clone;
            box-decoration-break: clone;
          }

          .top-band,
          .bottom-band {
            position: fixed;
            left: 0;
            right: 0;
            z-index: 0;
          }

          .top-band {
            top: 0;
          }

          .bottom-band {
            bottom: 0;
          }

          .header,
          .divider,
          .bill-to,
          table,
          .footer-grid,
          .terms,
          .contact-row {
            position: relative;
            z-index: 1;
          }

          table {
            page-break-inside: auto;
          }

          thead {
            display: table-header-group;
          }

          tfoot {
            display: table-footer-group;
          }

          tr,
          td,
          th {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .bill-to,
          .footer-grid,
          .terms,
          .contact-row {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="top-band"></div>

      <div className="header">
        <div className="brand">{company?.name ?? "Pan d' Casa"}</div>
        <div className="title">PROFORMA</div>
      </div>

      <div className="divider"></div>

      <section className="bill-to">
        <div>
          <h3>{proforma.clientNombre}</h3>
          <p>
            <strong>Céd. Jurídica:</strong> {proforma.clientCedulaJuridica}
          </p>
          <p>
            <strong>Empresa:</strong> {proforma.clientEmpresa}
          </p>
          <p>
            <strong>Entrega:</strong> {deliveryText}
          </p>
        </div>
        <div className="invoice-meta">
          PROFORMA#
          <strong>{proforma.number}</strong>
        </div>
      </section>

      <table>
        <thead>
          <tr>
            <th>PRODUCTO</th>
            <th className="col-price">PRECIO</th>
            <th className="col-qty">CANT.</th>
            <th className="col-total">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {proforma.items.map((item) => {
            const lineTotal = item.quantity * toNumber(item.unitPrice);
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
                <td className="col-price">
                  {formatCRC(toNumber(item.unitPrice))}
                </td>
                <td className="col-qty">{item.quantity}</td>
                <td className="col-total">{formatCRC(lineTotal)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="footer-grid">
        <div className="payment">
          <strong>DATOS DE PAGO:</strong>
          <br />
          NUMERO DE CUENTA: -
          <br />
          NOMBRE: {company?.contactName ?? company?.name ?? "Pan d' Casa"}
          <br />
          MÉTODO DE PAGO: TRANSFERENCIA BANCARIA
        </div>
        <div className="totals">
          <div>
            <span>SUBTOTAL</span>
            <span>{formatCRC(subtotal)}</span>
          </div>
          <div className="grand">
            <span>TOTAL</span>
            <span>{formatCRC(total)}</span>
          </div>
        </div>
      </div>

      <div className="terms">
        <h4>TÉRMINOS Y CONDICIONES</h4>
        <p>
          <strong>
            No se procede con el pedido, sino se recibe la orden de compra
            o visto bueno formal.
          </strong>
          <br />
          En este documento se pactan los servicios brindados y sus respectivos
          costos, por lo que nos liberamos de toda responsabilidad por la falta de
          atención de servicios que no se encuentren en el presente documento, por
          lo que se recomienda revisar con detenimiento los servicios contratados
        </p>
      </div>

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
      </div>

      <div className="bottom-band"></div>
    </div>
  );
}
