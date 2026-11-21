import {
  HandCoins,
  LayoutDashboard,
  MessageSquare,
  Package,
  type LucideIcon,
} from "lucide-react";

/**
 * Central navigation configuration.
 *
 * Every nav surface (desktop header, mobile drawer, footer, dashboard sidebar)
 * reads from here so links are defined once.
 */

export interface NavItem {
  href: string;
  label: string;
  /** Short description used by the mobile drawer and footer. */
  description?: string;
  /** Optional icon for surfaces that render one (the dashboard sidebar). */
  icon?: LucideIcon;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/favorites", label: "Favorites" },
  { href: "/dashboard", label: "Dashboard" },
];

export const DASHBOARD_NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Overview",
    description: "Counters across listings, enquiries and offers",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/listings",
    label: "My Listings",
    description: "Manage, reserve, relist or remove your items",
    icon: Package,
  },
  {
    href: "/dashboard/enquiries",
    label: "Enquiries",
    description: "Received questions and the ones you sent",
    icon: MessageSquare,
  },
  {
    href: "/dashboard/offers",
    label: "Offers",
    description: "Price offers to review and the ones you made",
    icon: HandCoins,
  },
];

export const FOOTER_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Explore",
    items: [
      { href: "/marketplace", label: "Browse everything" },
      { href: "/marketplace?type=free", label: "Free items" },
      { href: "/marketplace?type=exchange", label: "Exchange items" },
      { href: "/marketplace?sort=popular", label: "Most viewed" },
    ],
  },
  {
    title: "Sell & manage",
    items: [
      { href: "/sell", label: "List an item" },
      { href: "/dashboard/listings", label: "My listings" },
      { href: "/dashboard/enquiries", label: "Received enquiries" },
      { href: "/dashboard/offers", label: "Received offers" },
    ],
  },
];
