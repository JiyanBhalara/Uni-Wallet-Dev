"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [universityName, setUniversityName] = useState("");
  const [semester, setSemester] = useState("Fall 2025");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await fetch(
        `${apiUrl}/api/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName, email, password, universityName, semester }),
        }
      );

      setLoading(false);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message || "Could not sign up");
        return;
      }

      // after signup, go to login
      router.push("/login");
    } catch (err) {
      setLoading(false);
      setError("Failed to connect to server. Make sure the backend is running.");
      console.error("Signup error:", err);
    }
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-3xl bg-white shadow-md border border-[rgba(40,54,24,0.08)] p-6 space-y-4"
      >
        <h1 className="text-2xl font-semibold text-[var(--sc-green-dark)]">
          Create your campus wallet
        </h1>
        <div className="space-y-1">
          <label className="text-sm text-[var(--sc-green)]">Full name</label>
          <input
            className="w-full rounded-xl border border-[rgba(40,54,24,0.2)] px-3 py-2 text-base outline-none focus:ring-2 focus:ring-[var(--sc-green)]"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
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
        <div className="space-y-1">
          <label className="text-sm text-[var(--sc-green)]">University</label>
          <input
            type="text"
            className="w-full rounded-xl border border-[rgba(40,54,24,0.2)] px-3 py-2 text-base outline-none focus:ring-2 focus:ring-[var(--sc-green)]"
            value={universityName}
            onChange={(e) => setUniversityName(e.target.value)}
            placeholder="e.g., Rutgers Newark"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-[var(--sc-green)]">Semester</label>
          <select
            className="w-full rounded-xl border border-[rgba(40,54,24,0.2)] px-3 py-2 text-base outline-none focus:ring-2 focus:ring-[var(--sc-green)]"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
          >
            <option value="Fall 2025">Fall 2025</option>
            <option value="Spring 2026">Spring 2026</option>
            <option value="Summer 2026">Summer 2026</option>
            <option value="Fall 2026">Fall 2026</option>
          </select>
        </div>
        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account..." : "Sign up"}
        </Button>
      </form>
    </main>
  );
}
