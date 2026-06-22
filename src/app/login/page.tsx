import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";
import { HorusLogo } from "@/components/brand/horus-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div
        className="pointer-events-none absolute inset-0 dark:opacity-100 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 400px 300px at 50% 35%, rgba(201,168,76,0.15) 0%, transparent 70%)",
        }}
      />
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <div className="relative z-10 w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <HorusLogo size="lg" subtitle="inventarios" className="flex-col items-center gap-4" />
          <p className="mt-6 font-crimson italic text-muted-foreground">
            Inicia sesión para continuar
          </p>
        </div>
        <LoginForm />
        <p className="text-center font-space-mono text-[10px] tracking-wide text-muted-foreground">
          Demo: alpha@inventarios.local / alpha123
        </p>
      </div>
    </div>
  );
}
