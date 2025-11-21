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
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M13 8V4C13 3.71667 13.096 3.47933 13.288 3.288C13.48 3.09667 13.7173 3.00067 14 3H20C20.2833 3 20.521 3.096 20.713 3.288C20.905 3.48 21.0007 3.71733 21 4V8C21 8.28333 20.904 8.521 20.712 8.713C20.52 8.905 20.2827 9.00067 20 9H14C13.7167 9 13.4793 8.904 13.288 8.712C13.0967 8.52 13.0007 8.28267 13 8ZM3 12V4C3 3.71667 3.096 3.47933 3.288 3.288C3.48 3.09667 3.71733 3.00067 4 3H10C10.2833 3 10.521 3.096 10.713 3.288C10.905 3.48 11.0007 3.71733 11 4V12C11 12.2833 10.904 12.521 10.712 12.713C10.52 12.905 10.2827 13.0007 10 13H4C3.71667 13 3.47933 12.904 3.288 12.712C3.09667 12.52 3.00067 12.2827 3 12ZM13 20V12C13 11.7167 13.096 11.4793 13.288 11.288C13.48 11.0967 13.7173 11.0007 14 11H20C20.2833 11 20.521 11.096 20.713 11.288C20.905 11.48 21.0007 11.7173 21 12V20C21 20.2833 20.904 20.521 20.712 20.713C20.52 20.905 20.2827 21.0007 20 21H14C13.7167 21 13.4793 20.904 13.288 20.712C13.0967 20.52 13.0007 20.2827 13 20ZM3 20V16C3 15.7167 3.096 15.4793 3.288 15.288C3.48 15.0967 3.71733 15.0007 4 15H10C10.2833 15 10.521 15.096 10.713 15.288C10.905 15.48 11.0007 15.7173 11 16V20C11 20.2833 10.904 20.521 10.712 20.713C10.52 20.905 10.2827 21.0007 10 21H4C3.71667 21 3.47933 20.904 3.288 20.712C3.09667 20.52 3.00067 20.2827 3 20ZM5 11H9V5H5V11ZM15 19H19V13H15V19ZM15 7H19V5H15V7ZM5 19H9V17H5V19Z"
          fill="white"
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
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clip-path="url(#clip0_178_400)">
          <path
            d="M6 4.5C5.60218 4.5 5.22064 4.65804 4.93934 4.93934C4.65804 5.22064 4.5 5.60218 4.5 6V18C4.5 18.3978 4.65804 18.7794 4.93934 19.0607C5.22064 19.342 5.60218 19.5 6 19.5H18C18.3978 19.5 18.7794 19.342 19.0607 19.0607C19.342 18.7794 19.5 18.3978 19.5 18V6C19.5 5.60218 19.342 5.22064 19.0607 4.93934C18.7794 4.65804 18.3978 4.5 18 4.5H6ZM21 16.5V18C21 18.7956 20.6839 19.5587 20.1213 20.1213C19.5587 20.6839 18.7956 21 18 21H16.5V24H15V21H12.75V24H11.25V21H9V24H7.5V21H6C5.20435 21 4.44129 20.6839 3.87868 20.1213C3.31607 19.5587 3 18.7956 3 18V16.5H0V15H3V12.75H0V11.25H3V9H0V7.5H3V6C3 5.20435 3.31607 4.44129 3.87868 3.87868C4.44129 3.31607 5.20435 3 6 3H7.5V0H9V3H11.25V0H12.75V3H15V0H16.5V3H18C18.7956 3 19.5587 3.31607 20.1213 3.87868C20.6839 4.44129 21 5.20435 21 6V7.5H24V9H21V11.25H24V12.75H21V15H24V16.5H21Z"
            fill="white"
          />
          <path
            d="M15 7.5H9C8.17157 7.5 7.5 8.17157 7.5 9V15C7.5 15.8284 8.17157 16.5 9 16.5H15C15.8284 16.5 16.5 15.8284 16.5 15V9C16.5 8.17157 15.8284 7.5 15 7.5Z"
            fill="white"
          />
        </g>
        <defs>
          <clipPath id="clip0_178_400">
            <rect width="24" height="24" fill="white" />
          </clipPath>
        </defs>
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
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3.7 13.625C3.11667 13.0417 2.68767 12.375 2.413 11.625C2.13833 10.875 2.00067 10.0917 2 9.275C2 7.55833 2.55833 6.08333 3.675 4.85C4.79167 3.61667 6.18333 3 7.85 3C8.65 3 9.40433 3.15833 10.113 3.475C10.8217 3.79167 11.4507 4.23333 12 4.8C12.5333 4.23333 13.1543 3.79167 13.863 3.475C14.5717 3.15833 15.3257 3 16.125 3C17.7917 3 19.1877 3.61667 20.313 4.85C21.4383 6.08333 22.0007 7.55 22 9.25C22 10.0667 21.8583 10.85 21.575 11.6C21.2917 12.35 20.8667 13.0167 20.3 13.6L11.975 21.95L3.7 13.625ZM7.85 5C6.75 5 5.83333 5.421 5.1 6.263C4.36667 7.105 4 8.10067 4 9.25C4 9.55 4.025 9.846 4.075 10.138C4.125 10.43 4.20833 10.7173 4.325 11H9.525L10.7 12.75L12.05 8.45H13.825L15.525 11H19.675C19.7917 10.7167 19.8793 10.4293 19.938 10.138C19.9967 9.84667 20.0257 9.55067 20.025 9.25C19.9917 8.1 19.6083 7.11233 18.875 6.287C18.1417 5.46167 17.225 5.04933 16.125 5.05C15.6083 5.05 15.1127 5.15 14.638 5.35C14.1633 5.55 13.7507 5.84167 13.4 6.225L12.35 7.35H11.625L10.575 6.225C10.225 5.84167 9.81667 5.54167 9.35 5.325C8.88333 5.10833 8.38333 5 7.85 5ZM12 19.1L18.075 13H14.45L13.3 11.25L11.95 15.575H10.15L8.45 13H5.9L12 19.1Z"
          fill="white"
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
    href: "https://www.metacentrum.cz/cs/about/user_support.html",
    translationKey: "pages.userSupport",
    external: true,
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clip-path="url(#clip0_178_463)">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M9.70526 0.266C9.97975 0.241533 10.2552 0.229021 10.5308 0.2285C10.8223 0.2285 11.1033 0.244 11.3568 0.266C11.7991 0.3019 12.2098 0.509337 12.5013 0.844C16.8638 1.6485 20.4548 5.314 20.6363 9.7955L22.6903 12.4105C23.0324 12.8458 23.2183 13.3834 23.2183 13.937C23.2183 14.9095 22.6433 15.822 21.6998 16.192C21.3338 16.336 20.8828 16.505 20.4288 16.652L19.9703 19.7175C19.8842 20.2979 19.5718 20.8206 19.1015 21.1714C18.6312 21.5222 18.0411 21.6725 17.4603 21.5895L16.3853 21.4355V22.7305C16.3853 22.9957 16.2799 23.2501 16.0924 23.4376C15.9048 23.6251 15.6505 23.7305 15.3853 23.7305C15.12 23.7305 14.8657 23.6251 14.6782 23.4376C14.4906 23.2501 14.3853 22.9957 14.3853 22.7305V20.282C14.3853 20.1387 14.416 19.9971 14.4755 19.8668C14.535 19.7364 14.6218 19.6204 14.7301 19.5265C14.8383 19.4326 14.9655 19.3631 15.1029 19.3226C15.2404 19.2822 15.3849 19.2717 15.5268 19.292L17.7443 19.61C17.7729 19.6139 17.802 19.6122 17.83 19.6049C17.8579 19.5976 17.8842 19.5848 17.9072 19.5674C17.9302 19.5499 17.9496 19.5281 17.9642 19.5032C17.9788 19.4782 17.9883 19.4506 17.9923 19.422L18.5448 15.728C18.5736 15.5351 18.6582 15.3548 18.7882 15.2094C18.9181 15.064 19.0878 14.9597 19.2763 14.9095C19.8103 14.7675 20.4498 14.5345 20.9683 14.3305C21.1073 14.276 21.2183 14.1305 21.2183 13.937C21.2186 13.8314 21.1834 13.7287 21.1183 13.6455L18.8568 10.768C18.7183 10.5919 18.6429 10.3745 18.6428 10.1505C18.6428 6.8735 16.2193 3.971 12.9758 3.011C12.9838 3.4735 12.9893 4.0165 12.9893 4.645C12.9893 5.1115 12.9863 5.869 12.9818 6.366C13.6546 6.81499 14.1913 7.44008 14.5334 8.17313C14.8754 8.90617 15.0096 9.71905 14.9214 10.5231C14.8332 11.3272 14.526 12.0917 14.0332 12.7332C13.5404 13.3747 12.881 13.8685 12.1268 14.161C13.3673 15.239 14.9423 15.8955 16.4063 15.8955C16.5376 15.8955 16.6676 15.9214 16.7889 15.9716C16.9103 16.0219 17.0205 16.0955 17.1134 16.1884C17.2062 16.2813 17.2799 16.3915 17.3301 16.5128C17.3804 16.6341 17.4063 16.7642 17.4063 16.8955C17.4063 17.0268 17.3804 17.1569 17.3301 17.2782C17.2799 17.3995 17.2062 17.5097 17.1134 17.6026C17.0205 17.6955 16.9103 17.7691 16.7889 17.8194C16.6676 17.8696 16.5376 17.8955 16.4063 17.8955C13.9118 17.8955 11.3918 16.553 9.76276 14.598C9.70344 14.5268 9.6543 14.4477 9.61676 14.363C8.76648 14.1825 7.98831 13.7553 7.37966 13.1347C6.77101 12.5141 6.35892 11.7278 6.19496 10.8742C6.031 10.0206 6.12247 9.13758 6.4579 8.33568C6.79334 7.53379 7.35784 6.84864 8.08076 6.366C8.07569 5.79235 8.07303 5.21868 8.07276 4.645C8.07343 4.062 8.07743 3.55083 8.08476 3.1115C4.96076 4.1885 2.71826 7.1515 2.71826 10.635C2.71826 13.6565 4.39676 16.503 6.81676 17.8485C6.97256 17.9351 7.10237 18.0619 7.19275 18.2155C7.28312 18.3692 7.33077 18.5442 7.33076 18.7225V22.73C7.33076 22.9952 7.2254 23.2496 7.03787 23.4371C6.85033 23.6246 6.59598 23.73 6.33076 23.73C6.06555 23.73 5.81119 23.6246 5.62365 23.4371C5.43612 23.2496 5.33076 22.9952 5.33076 22.73V19.288C2.53726 17.4815 0.718262 14.1385 0.718262 10.635C0.718262 5.885 4.04726 1.915 8.49876 0.9185C8.64351 0.731902 8.82555 0.577511 9.03328 0.465168C9.24101 0.352824 9.46987 0.284994 9.70526 0.266Z"
            fill="white"
          />
        </g>
        <defs>
          <clipPath id="clip0_178_463">
            <rect width="24" height="24" fill="white" />
          </clipPath>
        </defs>
      </svg>
    ),
  },
  {
    id: "documentation",
    href: "https://docs.metacentrum.cz/en/docs/welcome",
    translationKey: "pages.documentation",
    external: true,
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M9 13H15C15.2833 13 15.521 12.904 15.713 12.712C15.905 12.52 16.0007 12.2827 16 12C15.9993 11.7173 15.9033 11.48 15.712 11.288C15.5207 11.096 15.2833 11 15 11H9C8.71667 11 8.47933 11.096 8.288 11.288C8.09667 11.48 8.00067 11.7173 8 12C7.99933 12.2827 8.09533 12.5203 8.288 12.713C8.48067 12.9057 8.718 13.0013 9 13ZM9 16H15C15.2833 16 15.521 15.904 15.713 15.712C15.905 15.52 16.0007 15.2827 16 15C15.9993 14.7173 15.9033 14.48 15.712 14.288C15.5207 14.096 15.2833 14 15 14H9C8.71667 14 8.47933 14.096 8.288 14.288C8.09667 14.48 8.00067 14.7173 8 15C7.99933 15.2827 8.09533 15.5203 8.288 15.713C8.48067 15.9057 8.718 16.0013 9 16ZM9 19H12C12.2833 19 12.521 18.904 12.713 18.712C12.905 18.52 13.0007 18.2827 13 18C12.9993 17.7173 12.9033 17.48 12.712 17.288C12.5207 17.096 12.2833 17 12 17H9C8.71667 17 8.47933 17.096 8.288 17.288C8.09667 17.48 8.00067 17.7173 8 18C7.99933 18.2827 8.09533 18.5203 8.288 18.713C8.48067 18.9057 8.718 19.0013 9 19ZM6 22C5.45 22 4.97933 21.8043 4.588 21.413C4.19667 21.0217 4.00067 20.5507 4 20V4C4 3.45 4.196 2.97933 4.588 2.588C4.98 2.19667 5.45067 2.00067 6 2H13.175C13.4417 2 13.696 2.05 13.938 2.15C14.18 2.25 14.3923 2.39167 14.575 2.575L19.425 7.425C19.6083 7.60833 19.75 7.821 19.85 8.063C19.95 8.305 20 8.559 20 8.825V20C20 20.55 19.8043 21.021 19.413 21.413C19.0217 21.805 18.5507 22.0007 18 22H6ZM18 9H14.5C14.0833 9 13.7293 8.85433 13.438 8.563C13.1467 8.27167 13.0007 7.91733 13 7.5V4H6V20H18V9Z"
          fill="white"
        />
      </svg>
    ),
  },
  {
    id: "faq",
    href: "https://docs.metacentrum.cz/docs/support/faqs",
    translationKey: "pages.faq",
    external: true,
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M11 18H13V16H11V18ZM12 2C10.6868 2 9.38642 2.25866 8.17317 2.7612C6.95991 3.26375 5.85752 4.00035 4.92893 4.92893C3.05357 6.8043 2 9.34784 2 12C2 14.6522 3.05357 17.1957 4.92893 19.0711C5.85752 19.9997 6.95991 20.7362 8.17317 21.2388C9.38642 21.7413 10.6868 22 12 22C14.6522 22 17.1957 20.9464 19.0711 19.0711C20.9464 17.1957 22 14.6522 22 12C22 10.6868 21.7413 9.38642 21.2388 8.17317C20.7362 6.95991 19.9997 5.85752 19.0711 4.92893C18.1425 4.00035 17.0401 3.26375 15.8268 2.7612C14.6136 2.25866 13.3132 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM12 6C10.9391 6 9.92172 6.42143 9.17157 7.17157C8.42143 7.92172 8 8.93913 8 10H10C10 9.46957 10.2107 8.96086 10.5858 8.58579C10.9609 8.21071 11.4696 8 12 8C12.5304 8 13.0391 8.21071 13.4142 8.58579C13.7893 8.96086 14 9.46957 14 10C14 12 11 11.75 11 15H13C13 12.75 16 12.5 16 10C16 8.93913 15.5786 7.92172 14.8284 7.17157C14.0783 6.42143 13.0609 6 12 6Z"
          fill="white"
        />
      </svg>
    ),
  },
  {
    id: "metacentrum",
    href: "https://www.metacentrum.cz",
    translationKey: "pages.metacentrum",
    external: true,
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1.5 12C1.5 14.7848 2.60625 17.4555 4.57538 19.4246C6.54451 21.3938 9.21523 22.5 12 22.5C14.7848 22.5 17.4555 21.3938 19.4246 19.4246C21.3938 17.4555 22.5 14.7848 22.5 12C22.5 9.21523 21.3938 6.54451 19.4246 4.57538C17.4555 2.60625 14.7848 1.5 12 1.5C9.21523 1.5 6.54451 2.60625 4.57538 4.57538C2.60625 6.54451 1.5 9.21523 1.5 12Z"
          stroke="white"
          stroke-linejoin="round"
        />
        <path
          d="M7.5 12C7.5 9.21523 7.97411 6.54451 8.81802 4.57538C9.66193 2.60625 10.8065 1.5 12 1.5C13.1935 1.5 14.3381 2.60625 15.182 4.57538C16.0259 6.54451 16.5 9.21523 16.5 12C16.5 14.7848 16.0259 17.4555 15.182 19.4246C14.3381 21.3938 13.1935 22.5 12 22.5C10.8065 22.5 9.66193 21.3938 8.81802 19.4246C7.97411 17.4555 7.5 14.7848 7.5 12Z"
          stroke="white"
          stroke-linejoin="round"
        />
        <path
          d="M2.25 15.5H21.75M2.25 8.5H21.75"
          stroke="white"
          stroke-linecap="round"
        />
      </svg>
    ),
  },
];

export function SidebarLayout() {
  const { t, i18n } = useTranslation();
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
                            ? "bg-secondary text-white"
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
                        width="11"
                        height="11"
                        viewBox="0 0 11 11"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M9.33333 5.83333V9.33333C9.33333 9.64275 9.21042 9.9395 8.99162 10.1583C8.77283 10.3771 8.47609 10.5 8.16667 10.5H1.16667C0.857247 10.5 0.560501 10.3771 0.341709 10.1583C0.122916 9.9395 0 9.64275 0 9.33333V2.33333C0 2.02391 0.122916 1.72717 0.341709 1.50838C0.560501 1.28958 0.857247 1.16667 1.16667 1.16667H4.66667V2.33333H1.16667V9.33333H8.16667V5.83333H9.33333ZM5.83333 0V1.16667H8.5085L3.96258 5.71258L4.78742 6.53742L9.33333 1.9915V4.66667H10.5V0H5.83333Z"
                          fill="white"
                        />
                      </svg>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Language Switcher */}
          <div className="border-t border-primary-700 mt-auto">
            <div className="pl-[14px] pr-4 py-3">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                  />
                </svg>
                <span className="text-sm text-white flex-1">
                  {t("language.switchLanguage")}
                </span>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => i18n.changeLanguage("cs")}
                  className={`flex-1 px-3 py-1.5 text-sm rounded transition-colors ${
                    i18n.language === "cs"
                      ? "bg-secondary text-white"
                      : "bg-primary-700 text-white hover:bg-primary-500"
                  }`}
                >
                  {t("language.czech")}
                </button>
                <button
                  onClick={() => i18n.changeLanguage("en")}
                  className={`flex-1 px-3 py-1.5 text-sm rounded transition-colors ${
                    i18n.language === "en"
                      ? "bg-secondary text-white"
                      : "bg-primary-700 text-white hover:bg-primary-500"
                  }`}
                >
                  {t("language.english")}
                </button>
              </div>
            </div>
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
