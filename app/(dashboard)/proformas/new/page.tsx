import { ProformaForm } from "@/features/proformas/components/ProformaForm";

export default function ProformaNewPage() {
  return (
    <>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--cocoa)]">
          Nueva proforma
        </p>
        <h2 className="font-[var(--font-cormorant)] text-2xl font-semibold">
          Crear proforma
        </h2>
      </div>
      <ProformaForm />
    </>
  );
}
