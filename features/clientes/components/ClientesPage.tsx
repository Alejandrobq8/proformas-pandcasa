"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import {
  useClientesQuery,
  useCreateCliente,
  useUpdateCliente,
  useDeleteCliente,
} from "@/features/clientes/hooks";
import type { Cliente } from "@/features/clientes/api";
import { clientSchema, type ClientInput } from "@/features/clientes/schema";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { StatCard, Card } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Field, Input } from "@/shared/components/ui/Input";

const emptyForm: ClientInput = { nombre: "", empresa: "", cedulaJuridica: "" };

export function ClientesPage() {
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "form">("list");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: emptyForm,
  });

  const debouncedQuery = useDebouncedValue(query, 300);
  const { data, isFetching } = useClientesQuery(debouncedQuery);
  const clientes = data?.data ?? [];
  const total = data?.total ?? 0;

  const createCliente = useCreateCliente();
  const updateCliente = useUpdateCliente();
  const deleteCliente = useDeleteCliente();

  function startCreate() {
    setEditingId(null);
    reset(emptyForm);
    setError(null);
    setActiveTab("form");
  }

  function startEdit(cliente: Cliente) {
    setEditingId(cliente.id);
    reset({
      nombre: cliente.nombre,
      empresa: cliente.empresa ?? "",
      cedulaJuridica: cliente.cedulaJuridica ?? "",
    });
    setError(null);
    setActiveTab("form");
  }

  const onSubmit = handleSubmit(async (values) => {
    setError(null);

    try {
      if (editingId) {
        await updateCliente.mutateAsync({ id: editingId, input: values });
      } else {
        await createCliente.mutateAsync(values);
      }
      startCreate();
      setActiveTab("list");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar el cliente."
      );
    }
  });

  async function handleDelete(id: string) {
    if (!confirm("Eliminar cliente?")) return;
    try {
      await deleteCliente.mutateAsync(id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo eliminar el cliente."
      );
    }
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Clientes"
        title="Clientes"
        description="Busca, crea y edita los clientes registrados."
        aside={
          <>
            <StatCard label="Registros" value={total} />
            <StatCard label="Busqueda" value="Nombre, empresa o cedula" />
            <StatCard label="Flujo" value="Alta y edicion en una sola vista" />
          </>
        }
      />

      {activeTab === "list" ? (
        <Card variant="plain">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rc-gold-dark">
                Clientes
              </p>
              <h2 className="mt-1 font-serif text-2xl font-semibold text-rc-ink">
                {total} registros
              </h2>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Input
                className="sm:w-72"
                placeholder="Buscar por nombre, empresa o cedula"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <Button onClick={startCreate}>Nuevo cliente</Button>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {isFetching ? (
              <p className="text-sm text-rc-ink/60">Cargando...</p>
            ) : clientes.length === 0 ? (
              <p className="text-sm text-rc-ink/60">No hay clientes aun.</p>
            ) : (
              clientes.map((cliente) => (
                <Card
                  key={cliente.id}
                  variant="plain"
                  className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-rc-ink">{cliente.nombre}</p>
                    {cliente.empresa || cliente.cedulaJuridica ? (
                      <p className="text-xs text-rc-ink/60">
                        {cliente.empresa ?? ""}
                        {cliente.cedulaJuridica
                          ? ` - ${cliente.cedulaJuridica}`
                          : ""}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(cliente)}
                      aria-label="Editar"
                      title="Editar"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(cliente.id)}
                      aria-label="Eliminar"
                    >
                      Eliminar
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </Card>
      ) : (
        <Card variant="plain">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rc-gold-dark">
                {editingId ? "Editar" : "Nuevo"} cliente
              </p>
              <h3 className="mt-1 font-serif text-xl font-semibold text-rc-ink">
                Datos base
              </h3>
            </div>
            <Button variant="ghost" onClick={() => setActiveTab("list")}>
              Ver listado
            </Button>
          </div>

          <form className="mt-5 grid gap-4" onSubmit={onSubmit}>
            <Field label="Nombre" htmlFor="nombre" error={errors.nombre?.message}>
              <Input id="nombre" placeholder="Nombre" {...register("nombre")} />
            </Field>
            <Field label="Empresa" htmlFor="empresa">
              <Input id="empresa" placeholder="Empresa" {...register("empresa")} />
            </Field>
            <Field label="Cedula juridica" htmlFor="cedulaJuridica" hint="Opcional">
              <Input
                id="cedulaJuridica"
                placeholder="Cedula juridica"
                {...register("cedulaJuridica")}
              />
            </Field>
            {error ? (
              <p className="rounded-[3px] border border-rc-stamp bg-rc-stamp/10 px-4 py-3 text-sm text-rc-stamp">
                {error}
              </p>
            ) : null}
            <Button type="submit">
              {editingId ? "Guardar cambios" : "Crear cliente"}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
