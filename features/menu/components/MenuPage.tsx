"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatCRC } from "@/shared/lib/money";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { menuCategorySchema, type MenuCategory } from "@/features/menu/schema";
import type { MenuItemRecord as MenuItem } from "@/features/menu/api";
import {
  useMenuItemsQuery,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
} from "@/features/menu/hooks";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { StatCard, Card } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Field, Input, Textarea, Select } from "@/shared/components/ui/Input";
import { Badge } from "@/shared/components/ui/Badge";

const categories: Array<{ value: MenuCategory; label: string }> = [
  { value: "BOCADILLOS", label: "Bocadillos" },
  { value: "POSTRES", label: "Postres" },
  { value: "QUEQUES", label: "Queques" },
];

const menuFormSchema = z.object({
  category: menuCategorySchema,
  name: z.string().min(1, "Nombre requerido"),
  description: z.string().optional(),
  price: z
    .string()
    .min(1, "Precio requerido")
    .refine(
      (value) => Number.isFinite(Number(value.replace(",", "."))),
      "Precio invalido"
    )
    .refine(
      (value) => Number(value.replace(",", ".")) >= 0,
      "Precio invalido"
    ),
});

type MenuFormValues = z.infer<typeof menuFormSchema>;

const emptyForm: MenuFormValues = {
  category: "BOCADILLOS",
  name: "",
  description: "",
  price: "",
};

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (value && typeof value === "object" && "toString" in value) {
    return Number((value as { toString: () => string }).toString());
  }
  return 0;
}

export function MenuPage() {
  const [activeCategory, setActiveCategory] = useState<MenuCategory>("BOCADILLOS");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "form">("list");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<MenuFormValues>({
    resolver: zodResolver(menuFormSchema),
    defaultValues: emptyForm,
  });

  const debouncedQuery = useDebouncedValue(query, 300);
  const { data, isFetching } = useMenuItemsQuery(debouncedQuery, activeCategory);
  const items = data?.data ?? [];
  const total = data?.total ?? 0;

  const createMenuItem = useCreateMenuItem();
  const updateMenuItem = useUpdateMenuItem();
  const deleteMenuItem = useDeleteMenuItem();

  useEffect(() => {
    if (!success) return;
    const clearSuccessTimeout = setTimeout(() => setSuccess(null), 1400);
    return () => clearTimeout(clearSuccessTimeout);
  }, [success]);

  function resetForm() {
    setEditingId(null);
    reset({ ...emptyForm, category: activeCategory });
    setError(null);
  }

  function startCreate() {
    resetForm();
    setSuccess(null);
    setActiveTab("form");
  }

  function startEdit(item: MenuItem) {
    setEditingId(item.id);
    reset({
      category: item.category,
      name: item.name,
      description: item.description ?? "",
      price: String(item.price ?? ""),
    });
    setError(null);
    setSuccess(null);
    setActiveTab("form");
  }

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    setSuccess(null);

    const payload = {
      category: values.category,
      name: values.name.trim(),
      description: values.description?.trim() || null,
      price: Number(values.price.replace(",", ".")),
    };

    try {
      if (editingId) {
        await updateMenuItem.mutateAsync({ id: editingId, input: payload });
      } else {
        await createMenuItem.mutateAsync(payload);
      }
      resetForm();
      setSuccess(editingId ? "Producto actualizado." : "Producto agregado.");
      setActiveTab("list");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar el producto."
      );
    }
  });

  async function handleDelete(id: string) {
    if (!confirm("Eliminar producto?")) return;
    try {
      await deleteMenuItem.mutateAsync(id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo eliminar el producto."
      );
    }
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Menu"
        title="Menu de productos"
        description="Productos y precios por categoria."
        aside={
          <>
            <StatCard label="Items" value={total} />
            <StatCard
              label="Categoria"
              value={categories.find((c) => c.value === activeCategory)?.label}
            />
            <StatCard label="Vista" value="Catalogo editable" />
          </>
        }
      />

      <div className="flex flex-wrap gap-2.5">
        {categories.map((category) => (
          <button
            key={category.value}
            type="button"
            className={`rounded-[3px] border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
              activeCategory === category.value
                ? "border-rc-ink bg-rc-kraft text-rc-ink"
                : "border-rc-line text-rc-ink/70 hover:bg-rc-kraft/40"
            }`}
            onClick={() => {
              setActiveCategory(category.value);
              if (!editingId) {
                setValue("category", category.value);
              }
            }}
          >
            {category.label}
          </button>
        ))}
      </div>

      {activeTab === "list" ? (
        <Card variant="plain">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rc-gold-dark">
                Productos
              </p>
              <h2 className="mt-1 font-serif text-2xl font-semibold text-rc-ink">
                {total} registrados
              </h2>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Input
                className="sm:w-64"
                placeholder="Buscar por nombre"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <Button onClick={startCreate}>Nuevo producto</Button>
            </div>
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

          <div className="mt-6 space-y-3">
            {isFetching ? (
              <p className="text-sm text-rc-ink/60">Cargando...</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-rc-ink/60">
                No hay productos en esta categoria.
              </p>
            ) : (
              items.map((item) => (
                <Card
                  key={item.id}
                  variant="plain"
                  className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-rc-ink">{item.name}</p>
                    {item.description ? (
                      <p className="text-xs text-rc-ink/60">{item.description}</p>
                    ) : null}
                  </div>
                  <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end">
                    <Badge tone="gold">{formatCRC(toNumber(item.price))}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(item)}
                      aria-label="Editar"
                      title="Editar"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
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
                {editingId ? "Editar" : "Nuevo"} producto
              </p>
              <h3 className="mt-1 font-serif text-xl font-semibold text-rc-ink">
                Datos del producto
              </h3>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {editingId ? (
                <Button variant="ghost" size="sm" onClick={startCreate}>
                  Limpiar
                </Button>
              ) : null}
              <Button variant="ghost" size="sm" onClick={() => setActiveTab("list")}>
                Ver listado
              </Button>
            </div>
          </div>

          <form className="mt-5 grid gap-4" onSubmit={onSubmit}>
            <Field label="Categoria" htmlFor="category">
              <Select id="category" {...register("category")}>
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Nombre" htmlFor="name" error={errors.name?.message}>
              <Input id="name" placeholder="Nombre" {...register("name")} />
            </Field>
            <Field label="Descripcion" htmlFor="description" hint="Opcional">
              <Textarea
                id="description"
                className="min-h-[90px]"
                placeholder="Descripcion (opcional)"
                {...register("description")}
              />
            </Field>
            <Field label="Precio (CRC)" htmlFor="price" error={errors.price?.message}>
              <Input id="price" placeholder="Precio (CRC)" {...register("price")} />
            </Field>
            {error ? (
              <p className="rounded-[3px] border border-rc-stamp bg-rc-stamp/10 px-4 py-3 text-sm text-rc-stamp">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="rounded-[3px] border border-[#4a6b46] bg-[#4a6b46]/10 px-4 py-3 text-sm text-[#4a6b46]">
                {success}
              </p>
            ) : null}
            <Button type="submit">
              {editingId ? "Guardar cambios" : "Guardar producto"}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
