import { ProformaForm } from "@/features/proformas/components/ProformaForm";
import { PageHeader } from "@/shared/components/ui/PageHeader";

export default function ProformaNewPage() {
  return (
    <div className="grid gap-8">
      <PageHeader eyebrow="Nueva proforma" title="Crear proforma" />
      <ProformaForm />
    </div>
  );
}
