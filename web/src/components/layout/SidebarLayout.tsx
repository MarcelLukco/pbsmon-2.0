import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import type { ReactNode } from "react";

type MenuItem = {
  id: string;
  path: string;
  translationKey: string;
  icon?: ReactNode;
  isExpandable?: boolean;
  subItems?: Omit<MenuItem, "isExpandable" | "subItems">[];
};

type SupportLink = {
  id: string;
  href: string;
  translationKey: string;
  icon: ReactNode;
  external?: boolean;
};

const menuItems: MenuItem[] = [
  {
    id: "personal-view",
    path: "/personal-view",
    translationKey: "pages.personalView",
    icon: (
      <svg
        className="w-6 h-6 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
        />
      </svg>
    ),
  },
  {
    id: "qsub-assembler",
    path: "/qsub-assembler",
    translationKey: "pages.qsubAssembler",
    icon: (
      <svg
        className="w-6 h-6 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={0.67}
          d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
        />
      </svg>
    ),
  },
  {
    id: "resource-status",
    path: "/resource-status",
    translationKey: "pages.resourceStatus",
    isExpandable: true,
    icon: (
      <svg
        className="w-6 h-6 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={0.67}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    ),
    subItems: [
      { id: "machines", path: "/machines", translationKey: "pages.machines" },
      {
        id: "storage-spaces",
        path: "/storage-spaces",
        translationKey: "pages.storageSpaces",
      },
      { id: "queues", path: "/queues", translationKey: "pages.queues" },
      { id: "jobs", path: "/jobs", translationKey: "pages.jobs" },
      {
        id: "waiting-jobs",
        path: "/waiting-jobs",
        translationKey: "pages.waitingJobs",
      },
      { id: "users", path: "/users", translationKey: "pages.users" },
      /*  { id: "outages", path: "/outages", translationKey: "pages.outages" },
      { id: "status", path: "/status", translationKey: "pages.currentStatus" }, */
    ],
  },
];

const supportLinks: SupportLink[] = [
  {
    id: "user-support",
    href: "#",
    translationKey: "pages.userSupport",
    external: true,
    icon: (
      <svg
        className="w-6 h-6 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={0.33}
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    id: "documentation",
    href: "#",
    translationKey: "pages.documentation",
    external: true,
    icon: (
      <svg
        className="w-6 h-6 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={0.67}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    id: "faq",
    href: "#",
    translationKey: "pages.faq",
    external: true,
    icon: (
      <svg
        className="w-6 h-6 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={0.67}
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    id: "metacentrum",
    href: "#",
    translationKey: "pages.metacentrum",
    external: true,
    icon: (
      <svg
        className="w-6 h-6 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
        />
      </svg>
    ),
  },
];

export function SidebarLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set(["resource-status"])
  );

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const isItemActive = (item: MenuItem): boolean => {
    if (item.subItems) {
      return item.subItems.some((subItem) =>
        location.pathname.startsWith(subItem.path)
      );
    }
    return location.pathname === item.path;
  };

  return (
    <div className="flex flex-col min-h-screen bg-primary-600">
      {/* Top Navbar */}
      <nav className="h-[45px] bg-[#424441] border-b-[10px] border-secondary"></nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-primary-600 text-white flex flex-col shadow-[1px_1px_5px_rgba(0,0,0,0.25),inset_0_0_8px_rgba(0,0,0,0.25)]">
          {/* Logo Section */}
          <div className="pl-[29px] pr-4 pt-10 pb-6 border-b border-primary-700">
            <img
              src="/images/logo-white.png"
              alt="metacentrum cesnet"
              className="w-[195px] h-[47px]"
            />
          </div>

          {/* User Section */}
          <div className="pl-[30px] pr-4 py-4 border-b border-primary-700">
            <div className="flex items-center gap-[10px]">
              <div className="w-[30px] h-[30px] flex items-center justify-center">
                <svg
                  className="w-[30px] h-[30px] text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.67}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <span className="text-sm">xlukco</span>
            </div>
          </div>

          {/* Main Navigation */}
          <nav>
            <ul className="space-y-0">
              {menuItems.map((item) => (
                <li key={item.id}>
                  {item.isExpandable ? (
                    <>
                      <button
                        onClick={() => toggleExpanded(item.id)}
                        className={[
                          "w-full flex items-center justify-between pl-[14px] pr-4 h-[54px] transition-colors",
                          isItemActive(item)
                            ? "bg-secondary text-white rounded-[5px]"
                            : "text-white hover:bg-primary-700",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-[14px]">
                          {item.icon}
                          <span>{t(item.translationKey)}</span>
                        </div>
                        <svg
                          className={`w-[14px] h-[14px] text-white transition-transform ${
                            expandedItems.has(item.id) ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      {expandedItems.has(item.id) && item.subItems && (
                        <ul className="bg-[#82909E]">
                          {item.subItems.map((subItem, index) => {
                            const isLast = index === item.subItems!.length - 1;
                            const isActive = location.pathname.startsWith(
                              subItem.path
                            );
                            return (
                              <li key={subItem.id}>
                                <NavLink
                                  to={subItem.path}
                                  className={[
                                    "flex items-center h-[48px] pl-[53px] pr-4 relative transition-colors",
                                    isActive
                                      ? "bg-secondary text-white"
                                      : "text-white hover:bg-primary-500",
                                  ].join(" ")}
                                >
                                  {/* Vertical line - to middle for all items, full height for last */}
                                  <div
                                    className={`absolute left-[27px] top-0 w-[17px] border-l border-white ${
                                      isLast ? "h-[24px]" : "h-[48px]"
                                    }`}
                                  ></div>
                                  {/* Horizontal line at middle (only if not last) */}

                                  <div className="absolute left-[27px] top-[23.5px] w-[17px] h-[1px] bg-white"></div>

                                  {t(subItem.translationKey)}
                                </NavLink>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </>
                  ) : (
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        [
                          "flex items-center gap-[14px] pl-[14px] pr-4 h-[54px] transition-colors",
                          isActive
                            ? "bg-secondary text-white"
                            : "text-white hover:bg-primary-700",
                        ].join(" ")
                      }
                    >
                      {item.icon}
                      <span>{t(item.translationKey)}</span>
                    </NavLink>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Support Links */}
          <div className="border-t border-primary-700">
            <ul className="space-y-0">
              {supportLinks.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.href}
                    className="flex items-center gap-[14px] pl-[14px] pr-4 h-[54px] text-white hover:bg-primary-700 transition-colors"
                    {...(link.external && {
                      target: "_blank",
                      rel: "noopener noreferrer",
                    })}
                  >
                    {link.icon}
                    <span className="text-sm flex-1">
                      {t(link.translationKey)}
                    </span>
                    {link.external && (
                      <svg
                        className="w-[14px] h-[14px] text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-gray-light">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
