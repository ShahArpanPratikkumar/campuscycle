import Link from "next/link";
import { Inbox, Send } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Received / Sent sub-tabs shared by the dashboard enquiry and offer inboxes.
 *
 * The scope is a URL query (`?view=sent`) so the server component re-queries with
 * the right `role` — no client state, and the tab survives a refresh or a share.
 */
export function InboxTabs({
  basePath,
  scope,
  receivedLabel = "Received",
  sentLabel = "Sent",
}: {
  basePath: string;
  scope: "received" | "sent";
  receivedLabel?: string;
  sentLabel?: string;
}) {
  const tabs = [
    {
      key: "received" as const,
      label: receivedLabel,
      href: basePath,
      icon: Inbox,
    },
    {
      key: "sent" as const,
      label: sentLabel,
      href: `${basePath}?view=sent`,
      icon: Send,
    },
  ];

  return (
    <nav
      aria-label="Inbox scope"
      className="flex w-fit gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
    >
      {tabs.map((tab) => {
        const isActive = tab.key === scope;
        const Icon = tab.icon;

        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-brand-600 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
