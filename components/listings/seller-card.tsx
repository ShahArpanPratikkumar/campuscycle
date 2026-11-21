import {
  CalendarDays,
  GraduationCap,
  MapPin,
  MessageSquare,
  Package,
  Star,
  type LucideIcon,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { contactPreferenceLabel } from "@/lib/constants";
import type { Student } from "@/lib/types";
import { cn, formatMonthYear, pluralize } from "@/lib/utils";

export interface SellerCardProps {
  seller: Student;
  className?: string;
  /** Hides the "View profile" button on the seller's own profile page. */
  showProfileLink?: boolean;
}

/**
 * Seller summary used on the listing detail page and the seller profile.
 * Rendered on the server — it has no interactivity.
 */
export function SellerCard({
  seller,
  className,
  showProfileLink = true,
}: SellerCardProps) {
  const department = [seller.department, seller.year ? `Year ${seller.year}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-center gap-3.5">
        <Avatar name={seller.displayName} src={seller.avatarUrl} size="lg" />
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-slate-900">
            {seller.displayName}
          </h2>
          <p className="truncate text-xs text-slate-500">@{seller.handle}</p>
        </div>
      </div>

      <dl className="mt-5 flex flex-col gap-2.5 text-sm">
        <MetaRow icon={MapPin} label="Campus" value={seller.campus} />
        {department ? (
          <MetaRow icon={GraduationCap} label="Studying" value={department} />
        ) : null}
        <MetaRow
          icon={CalendarDays}
          label="Joined"
          value={formatMonthYear(seller.joinedAt)}
        />
        <MetaRow
          icon={MessageSquare}
          label="Prefers"
          value={contactPreferenceLabel(seller.contactPreference)}
        />
      </dl>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Stat
          icon={Package}
          value={seller.stats.activeListings}
          label={pluralize(seller.stats.activeListings, "active listing")}
        />
        <Stat
          icon={Star}
          value={seller.stats.soldCount}
          label={pluralize(seller.stats.soldCount, "item") + " sold"}
        />
      </div>

      {showProfileLink ? (
        <ButtonLink
          href={`/seller/${seller.id}`}
          variant="outline"
          className="mt-5 w-full"
        >
          View profile
        </ButtonLink>
      ) : null}
    </Card>
  );
}

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-xs text-slate-400">{label}</dt>
        <dd className="text-sm text-slate-700">{value}</dd>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2.5">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </span>
      <p className="mt-0.5 text-lg font-semibold text-slate-900 tabular-nums">
        {value}
      </p>
    </div>
  );
}
