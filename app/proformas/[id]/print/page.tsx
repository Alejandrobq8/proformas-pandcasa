import { redirect } from "next/navigation";

export default async function ProformaPrintAlias({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;
  const suffix = token ? `?token=${token}` : "";
  redirect(`/proformas/${id}/print-template${suffix}`);
}
