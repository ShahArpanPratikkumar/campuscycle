import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your CampusCycle account to sell, save and manage listings.",
};

/** Only same-site absolute paths are accepted, so `next` cannot open a redirect. */
function safeNext(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }
  return "/dashboard";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);
  const registered = params.registered === "1";

  return (
    <Container>
      <AuthShell
        title="Welcome back"
        description="Log in to manage your listings and saved items."
        footer={
          <span>
            New to CampusCycle?{" "}
            <Link
              href="/register"
              className="font-medium text-brand-700 hover:text-brand-800 hover:underline"
            >
              Create an account
            </Link>
          </span>
        }
      >
        <LoginForm next={next} registered={registered} />
      </AuthShell>
    </Container>
  );
}
