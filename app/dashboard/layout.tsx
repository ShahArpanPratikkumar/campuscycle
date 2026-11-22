import { redirect } from "next/navigation";
import { InfoBanner } from "@/components/common/info-banner";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { APP_NAME } from "@/lib/constants";
import { connectToDatabase } from "@/lib/db/connect";
import { getCurrentStudent } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Dashboard shell.
 *
 * The title, tab bar and identity notice live here so the individual dashboard
 * pages only render their own content. Visitors without a valid session are
 * sent to `/login` and returned here afterwards.
 */
export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  await connectToDatabase();

  const student = await getCurrentStudent();
  if (!student) redirect("/login?next=/dashboard");

  return (
    <Container className="py-8 sm:py-10">
      <PageHeader
        title="Dashboard"
        description="Everything you have listed, plus the enquiries and offers students have sent you."
      />

      <div className="mt-6">
        <InfoBanner title={`Signed in as ${student.displayName}`}>
          You are acting as <span className="font-medium">@{student.handle}</span>{" "}
          ({student.campus}). Your listings, enquiries and offers are tied to
          your {APP_NAME} account.
        </InfoBanner>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
        <DashboardNav />
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
