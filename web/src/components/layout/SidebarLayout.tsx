import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function SidebarLayout() {
  const { t } = useTranslation();
  return (
    <div>
      <header className="bg-primary-800 text-white px-6 py-4 shadow flex items-center justify-between">
        <span className="text-lg font-semibold">PBSMon 2.0</span>
        {/* Add more navbar content here if needed */}
      </header>
      <div className="flex h-screen">
        <aside className="w-64 bg-primary text-white">
          <nav>
            <ul>
              <li>
                <NavLink
                  to="/personal-view"
                  className={({ isActive }) =>
                    [
                      "block px-4 py-2 transition-colors text-white hover:bg-primary-800",
                      isActive ? "bg-primary-900 font-bold" : "",
                    ].join(" ")
                  }
                >
                  {t("pages.personalView")}
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/qsub-assembler"
                  className={({ isActive }) =>
                    [
                      "block px-4 py-2 transition-colors text-white hover:bg-primary-800",
                      isActive ? "bg-primary-900 font-bold" : "",
                    ].join(" ")
                  }
                >
                  {t("pages.qsubAssembler")}
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/machines"
                  className={({ isActive }) =>
                    [
                      "block px-4 py-2 transition-colors text-white hover:bg-primary-800",
                      isActive ? "bg-primary-900 font-bold" : "",
                    ].join(" ")
                  }
                >
                  {t("pages.machines")}
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/jobs"
                  className={({ isActive }) =>
                    [
                      "block px-4 py-2 transition-colors text-white hover:bg-primary-800",
                      isActive ? "bg-primary-900 font-bold" : "",
                    ].join(" ")
                  }
                >
                  {t("pages.jobs")}
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/queues"
                  className={({ isActive }) =>
                    [
                      "block px-4 py-2 transition-colors text-white hover:bg-primary-800",
                      isActive ? "bg-primary-900 font-bold" : "",
                    ].join(" ")
                  }
                >
                  {t("pages.queues")}
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/machines-properties"
                  className={({ isActive }) =>
                    [
                      "block px-4 py-2 transition-colors text-white hover:bg-primary-800",
                      isActive ? "bg-primary-900 font-bold" : "",
                    ].join(" ")
                  }
                >
                  {t("pages.propertiesOfMachines")}
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/users"
                  className={({ isActive }) =>
                    [
                      "block px-4 py-2 transition-colors text-white hover:bg-primary-800",
                      isActive ? "bg-primary-900 font-bold" : "",
                    ].join(" ")
                  }
                >
                  {t("pages.users")}
                </NavLink>
              </li>
            </ul>
          </nav>
        </aside>

        <div className="flex-1 flex flex-col h-full">
          <main className="flex-1 p-6 overflow-auto bg-gray-50">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
