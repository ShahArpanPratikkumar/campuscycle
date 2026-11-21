import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { connectToDatabase } from "@/lib/db/connect";
import { getCurrentStudentId } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Guard for the sell flow.
 *
 * Creating a product needs an authenticated actor, so a visitor without a
 * valid session is sent to `/login` first and returned here afterwards.
 *
 * The check lives in the layout rather than the page on purpose: a layout
 * renders before its segment's `loading.tsx` boundary, so this `redirect()`
 * produces a real HTTP `307` instead of a client-side redirect after the
 * skeleton has already streamed. See `streaming.md` §"Status codes".
 */
export default async function SellLayout({
  children,
}: {
  children: ReactNode;
}) {
  await connectToDatabase();

  const studentId = await getCurrentStudentId();
  if (!studentId) redirect("/login?next=/sell");

  return <>{children}</>;
}
