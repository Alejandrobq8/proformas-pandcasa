import { FacturaForm } from "@/features/facturas/components/FacturaForm";
import { PageHeader } from "@/shared/components/ui/PageHeader";

export default function FacturaNewPage() {
  return (
    <div className="grid gap-8">
      <PageHeader eyebrow="Nueva factura" title="Crear factura digital" />
      <FacturaForm />
    </div>
  );
}
