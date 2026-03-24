import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/server/auth";

export async function getServerUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}
