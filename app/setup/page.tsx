import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profile setup",
  description: "Account setup is handled by login and registration.",
};

/**
 * Legacy identity-bootstrap route.
 *
 * The old flow let a visitor "become" any student by storing an editable cookie.
 * With real authentication that would be impersonation, so /setup now routes
 * visitors to the account flow instead. The existing profile components and
 * seller pages remain untouched.
 */
export default async function SetupPage() {
  const user = await getSessionUser();
  redirect(user ? "/dashboard" : "/login");
}
