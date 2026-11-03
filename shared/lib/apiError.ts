import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

/**
 * Logs the error with a route context tag and returns a JSON error response.
 * Keeps unhandled DB/runtime errors from falling through to Next's default
 * HTML error page, which breaks clients expecting JSON and leaves no trace
 * in the logs of which route/operation actually failed.
 */
export function handleApiError(
  error: unknown,
  context: string,
  fallbackMessage: string,
  conflictMessage?: string
) {
  console.error(`[api:${context}]`, error);

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return NextResponse.json(
      { error: conflictMessage ?? "Ya existe un registro con ese valor." },
      { status: 409 }
    );
  }

  return NextResponse.json({ error: fallbackMessage }, { status: 400 });
}
