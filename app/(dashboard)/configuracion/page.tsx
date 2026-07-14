import { CompanySettingsForm } from "@/features/settings/components/CompanySettingsForm";
import { QuickActions } from "@/features/settings/components/QuickActions";
import { PageHeader } from "@/shared/components/ui/PageHeader";

export default function ConfiguracionPage() {
  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Ajustes"
        title="Ajustes generales"
        description="Datos de la empresa y opciones de sesion."
      />
      <QuickActions />
      <CompanySettingsForm />
    </div>
  );
}
