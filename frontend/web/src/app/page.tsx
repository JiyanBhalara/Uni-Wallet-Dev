// src/app/page.tsx
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="rounded-2xl bg-slate-900 border border-slate-800 px-6 py-4 shadow-lg max-w-md w-full">
        <p className="text-xs text-emerald-400 font-medium tracking-wide mb-1">
          Smart Campus Wallet
        </p>
        <h1 className="text-xl font-semibold text-slate-50 mb-2">
          Hello, Tailwind v4.1 + Next.js 👋
        </h1>
        <p className="text-sm text-slate-400">
          This is your starter screen. Next we’ll hook this into your .NET
          backend and later drop in shadcn components.
        </p>
      </div>
    </main>
  );
}
