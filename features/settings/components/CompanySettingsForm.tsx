"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  companySettingsSchema,
  type CompanySettingsInput,
} from "@/features/settings/schema";
import { Card } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Field, Input } from "@/shared/components/ui/Input";

const emptyForm: CompanySettingsInput = {
  name: "",
  contactName: "",
  cedula: "",
  address: "",
  phone: "",
  email: "",
  logoUrl: "",
};

export function CompanySettingsForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompanySettingsInput>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: emptyForm,
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch("/api/company-settings");
      if (res.ok) {
        const data = await res.json();
        if (data) {
          reset({
            name: data.name ?? "",
            contactName: data.contactName ?? "",
            cedula: data.cedula ?? "",
            address: data.address ?? "",
            phone: data.phone ?? "",
            email: data.email ?? "",
            logoUrl: data.logoUrl ?? "",
          });
        }
      }
      setLoading(false);
    }
    void load();
  }, [reset]);

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    setSuccess(null);
    setSaving(true);

    const res = await fetch("/api/company-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      setError("No se pudo guardar la configuracion.");
      setSaving(false);
      return;
    }

    setSuccess("Datos guardados correctamente.");
    setSaving(false);
  });

  if (loading) {
    return (
      <Card variant="plain">
        <p className="text-sm text-rc-ink/60">Cargando...</p>
      </Card>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <Card variant="plain">
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Nombre de la empresa"
          htmlFor="name"
          error={errors.name?.message}
          className="md:col-span-2"
        >
          <Input id="name" {...register("name")} />
        </Field>
        <Field label="Nombre" htmlFor="contactName">
          <Input id="contactName" {...register("contactName")} />
        </Field>
        <Field label="Cedula" htmlFor="cedula">
          <Input id="cedula" {...register("cedula")} />
        </Field>
        <Field label="Direccion" htmlFor="address" className="md:col-span-2">
          <Input id="address" {...register("address")} />
        </Field>
        <Field label="Telefono" htmlFor="phone">
          <Input id="phone" {...register("phone")} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" {...register("email")} />
        </Field>
        <Field
          label="Logo URL (opcional)"
          htmlFor="logoUrl"
          error={errors.logoUrl?.message}
          className="md:col-span-2"
        >
          <Input id="logoUrl" type="url" {...register("logoUrl")} />
        </Field>
      </div>
      {error ? (
        <p className="mt-4 rounded-[3px] border border-rc-stamp bg-rc-stamp/10 px-4 py-3 text-sm text-rc-stamp">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-4 rounded-[3px] border border-[#4a6b46] bg-[#4a6b46]/10 px-4 py-3 text-sm text-[#4a6b46]">
          {success}
        </p>
      ) : null}
      <Button className="mt-6" disabled={saving} type="submit">
        {saving ? "Guardando..." : "Guardar datos"}
      </Button>
      </Card>
    </form>
  );
}
