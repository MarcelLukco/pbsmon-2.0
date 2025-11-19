import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";

export function SidebarLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const [isResourceStatusOpen, setIsResourceStatusOpen] = useState(true);

  // Check if any resource status route is active
  const isResourceStatusActive = [
    "/machines",
    "/storage-spaces",
    "/queues",
    "/jobs",
    "/waiting-jobs",
    "/users",
    "/outages",
    "/status",
  ].some((path) => location.pathname.startsWith(path));

  return (
    <div className="flex flex-col h-screen bg-primary-600">
      {/* Top Navbar */}
      <nav className="h-[45px] bg-[#424441] border-b-[10px] border-secondary"></nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-primary-600 text-white flex flex-col">
          {/* Logo Section */}
          <div className="px-10 py-6 border-b border-primary-700">
            <img
              src="/images/logo-white.png"
              alt="metacentrum cesnet"
              className="w-full"
            />
          </div>

          {/* User Section */}
          <div className="px-4 py-4 border-b border-primary-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <span className="text-sm">xlukco</span>
            </div>
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 overflow-y-auto py-2">
            <ul className="space-y-1">
              {/* Personal View */}
              <li>
                <NavLink
                  to="/personal-view"
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 px-4 py-2 transition-colors",
                      isActive
                        ? "bg-secondary text-white"
                        : "text-white hover:bg-primary-700",
                    ].join(" ")
                  }
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                  <span>{t("pages.personalView")}</span>
                </NavLink>
              </li>

              {/* Qsub Assembler */}
              <li>
                <NavLink
                  to="/qsub-assembler"
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 px-4 py-2 transition-colors",
                      isActive
                        ? "bg-secondary text-white"
                        : "text-white hover:bg-primary-700",
                    ].join(" ")
                  }
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                    />
                  </svg>
                  <span>{t("pages.qsubAssembler")}</span>
                </NavLink>
              </li>

              {/* Resource Status - Expandable Section */}
              <li>
                <button
                  onClick={() => setIsResourceStatusOpen(!isResourceStatusOpen)}
                  className={[
                    "w-full flex items-center justify-between px-4 py-2 transition-colors",
                    isResourceStatusActive
                      ? "bg-secondary text-white"
                      : "text-white hover:bg-primary-700",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    <span>{t("pages.resourceStatus")}</span>
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      isResourceStatusOpen ? "rotate-180" : ""
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
                {isResourceStatusOpen && (
                  <ul className="bg-primary-700">
                    <li>
                      <NavLink
                        to="/machines"
                        className={({ isActive }) =>
                          [
                            "flex items-center gap-3 px-4 py-2 pl-12 transition-colors",
                            isActive
                              ? "bg-secondary text-white"
                              : "text-white hover:bg-primary-600",
                          ].join(" ")
                        }
                      >
                        {t("pages.machines")}
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        to="/storage-spaces"
                        className={({ isActive }) =>
                          [
                            "flex items-center gap-3 px-4 py-2 pl-12 transition-colors",
                            isActive
                              ? "bg-secondary text-white"
                              : "text-white hover:bg-primary-600",
                          ].join(" ")
                        }
                      >
                        {t("pages.storageSpaces")}
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        to="/queues"
                        className={({ isActive }) =>
                          [
                            "flex items-center gap-3 px-4 py-2 pl-12 transition-colors",
                            isActive
                              ? "bg-secondary text-white"
                              : "text-white hover:bg-primary-600",
                          ].join(" ")
                        }
                      >
                        {t("pages.queues")}
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        to="/jobs"
                        className={({ isActive }) =>
                          [
                            "flex items-center gap-3 px-4 py-2 pl-12 transition-colors",
                            isActive
                              ? "bg-secondary text-white"
                              : "text-white hover:bg-primary-600",
                          ].join(" ")
                        }
                      >
                        {t("pages.jobs")}
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        to="/waiting-jobs"
                        className={({ isActive }) =>
                          [
                            "flex items-center gap-3 px-4 py-2 pl-12 transition-colors",
                            isActive
                              ? "bg-secondary text-white"
                              : "text-white hover:bg-primary-600",
                          ].join(" ")
                        }
                      >
                        {t("pages.waitingJobs")}
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        to="/users"
                        className={({ isActive }) =>
                          [
                            "flex items-center gap-3 px-4 py-2 pl-12 transition-colors",
                            isActive
                              ? "bg-secondary text-white"
                              : "text-white hover:bg-primary-600",
                          ].join(" ")
                        }
                      >
                        {t("pages.users")}
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        to="/outages"
                        className={({ isActive }) =>
                          [
                            "flex items-center gap-3 px-4 py-2 pl-12 transition-colors",
                            isActive
                              ? "bg-secondary text-white"
                              : "text-white hover:bg-primary-600",
                          ].join(" ")
                        }
                      >
                        {t("pages.outages")}
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        to="/status"
                        className={({ isActive }) =>
                          [
                            "flex items-center gap-3 px-4 py-2 pl-12 transition-colors",
                            isActive
                              ? "bg-secondary text-white"
                              : "text-white hover:bg-primary-600",
                          ].join(" ")
                        }
                      >
                        {t("pages.currentStatus")}
                      </NavLink>
                    </li>
                  </ul>
                )}
              </li>
            </ul>
          </nav>

          {/* Support Links */}
          <div className="border-t border-primary-700 py-2">
            <ul className="space-y-1">
              <li>
                <a
                  href="#"
                  className="flex items-center gap-3 px-4 py-2 text-white hover:bg-primary-700 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm">{t("pages.userSupport")}</span>
                  <svg
                    className="w-3 h-3 ml-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="flex items-center gap-3 px-4 py-2 text-white hover:bg-primary-700 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="text-sm">{t("pages.documentation")}</span>
                  <svg
                    className="w-3 h-3 ml-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="flex items-center gap-3 px-4 py-2 text-white hover:bg-primary-700 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm">{t("pages.faq")}</span>
                  <svg
                    className="w-3 h-3 ml-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="flex items-center gap-3 px-4 py-2 text-white hover:bg-primary-700 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                    />
                  </svg>
                  <span className="text-sm">{t("pages.metacentrum")}</span>
                  <svg
                    className="w-3 h-3 ml-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-primary-900">
                {location.pathname === "/queues" && t("pages.queues")}
                {location.pathname === "/machines" && t("pages.machines")}
                {location.pathname === "/jobs" && t("pages.jobs")}
                {location.pathname === "/users" && t("pages.users")}
                {location.pathname === "/personal-view" &&
                  t("pages.personalView")}
                {location.pathname === "/qsub-assembler" &&
                  t("pages.qsubAssembler")}
                {location.pathname === "/machines-properties" &&
                  t("pages.propertiesOfMachines")}
              </h1>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-gray-light">
            <div className="p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
