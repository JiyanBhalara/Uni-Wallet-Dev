"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [email, setEmail] = useState("alex@campus.edu");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password");
    } else {
      router.push(callbackUrl);
    }
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-3xl bg-white shadow-md border border-[rgba(40,54,24,0.08)] p-6 space-y-4"
      >
        <h1 className="text-2xl font-semibold text-[var(--sc-green-dark)]">
          Sign in to your wallet
        </h1>
        <div className="space-y-1">
          <label className="text-sm text-[var(--sc-green)]">Email</label>
          <input
            type="email"
            className="w-full rounded-xl border border-[rgba(40,54,24,0.2)] px-3 py-2 text-base outline-none focus:ring-2 focus:ring-[var(--sc-green)]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-[var(--sc-green)]">Password</label>
          <input
            type="password"
            className="w-full rounded-xl border border-[rgba(40,54,24,0.2)] px-3 py-2 text-base outline-none focus:ring-2 focus:ring-[var(--sc-green)]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
        <p className="text-xs text-center text-[var(--sc-green)]">
          No account?{" "}
          <a href="/signup" className="underline">
            Sign up
          </a>
        </p>
      </form>
    </main>
  );
}
