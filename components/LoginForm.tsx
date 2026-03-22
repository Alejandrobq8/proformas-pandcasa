"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: true,
      callbackUrl: "/",
    });

    if (res?.error) {
      setError("Credenciales invalidas.");
      setLoading(false);
    }
  }

  return (
    <form
      className="mt-6 grid gap-4"
      onSubmit={handleSubmit}
    >
      <div>
        <label className="text-xs uppercase tracking-[0.2em] text-[var(--cocoa)]">
          Email
        </label>
        <input
          className="mt-2 w-full rounded-[1.25rem] border border-[var(--border)] bg-white/45 px-4 py-3 text-sm shadow-sm transition focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)]"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-[0.2em] text-[var(--cocoa)]">
          Password
        </label>
        <input
          className="mt-2 w-full rounded-[1.25rem] border border-[var(--border)] bg-white/45 px-4 py-3 text-sm shadow-sm transition focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)]"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      {error ? (
        <p className="rounded-[1.2rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <button
        className="btn-primary rounded-full px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        disabled={loading}
        type="submit"
      >
        {loading ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}



