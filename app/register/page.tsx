import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Create account",
  description: "Join the CampusCycle student marketplace.",
};

export default function RegisterPage() {
  return (
    <Container>
      <AuthShell
        title="Create your account"
        description="One account for buying, selling and saving items across campus."
        footer={
          <span>
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-brand-700 hover:text-brand-800 hover:underline"
            >
              Log in
            </Link>
          </span>
        }
      >
        <RegisterForm />
      </AuthShell>
    </Container>
  );
}
