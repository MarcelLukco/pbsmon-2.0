import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Tabs } from "@/components/common/Tabs";
import { QueueTreeNode } from "@/components/common/QueueTreeNode";
import { QueuePbsJobsTab } from "@/components/queues/QueuePbsJobsTab";
import { QueuePbsMachinesTab } from "@/components/queues/QueuePbsMachinesTab";
import { QueuePbsSystemInfoTab } from "@/components/queues/QueuePbsSystemInfoTab";
import { Icon } from "@iconify/react";
import type { QueueDetailDTO, QueueListDTO } from "@/lib/generated-api";

type SortColumn =
  | "id"
  | "name"
  | "state"
  | "owner"
  | "node"
  | "cpuReserved"
  | "gpuReserved"
  | "memoryReserved"
  | "createdAt";

interface QueueDetailContentProps {
  queue: QueueDetailDTO;
  queueId: string;
}

export function QueueDetailContent({
  queue,
  queueId,
}: QueueDetailContentProps) {
  const { t } = useTranslation();
  const { data: currentUser } = useCurrentUser();
  const isAdmin = currentUser?.role === "admin";
  const [activeTab, setActiveTab] = useState("jobs");

  const [jobsPage, setJobsPage] = useState(1);
  const [jobsLimit] = useState(20);
  const [jobsSort, setJobsSort] = useState<SortColumn>("createdAt");
  const [jobsOrder, setJobsOrder] = useState<"asc" | "desc">("desc");
  const [jobsSearch, setJobsSearch] = useState("");

  const queueName = queue.name;

  // Convert children from QueueDetailDTO to QueueListDTO for display
  const childrenQueues: QueueListDTO[] =
    queue.children?.map((child) => ({
      name: child.name,
      server: child.server || null,
      queueType: child.queueType,
      priority: child.priority,
      totalJobs: child.totalJobs,
      stateCount: child.stateCount,
      fairshare: null,
      maximumForUser: null,
      minWalltime: null,
      maxWalltime: null,
      enabled: child.enabled,
      started: child.started,
      hasAccess: child.hasAccess,
      canBeDirectlySubmitted: true,
      children: child.children
        ? child.children.map((c) => ({
            name: c.name,
            server: c.server || null,
            queueType: c.queueType,
            priority: c.priority,
            totalJobs: c.totalJobs,
            stateCount: c.stateCount,
            fairshare: null,
            maximumForUser: null,
            minWalltime: null,
            maxWalltime: null,
            enabled: c.enabled,
            started: c.started,
            hasAccess: c.hasAccess,
            canBeDirectlySubmitted: true,
            children: undefined,
          }))
        : undefined,
    })) || [];

  const handleJobsSort = (column: SortColumn) => {
    if (jobsSort === column) {
      setJobsOrder(jobsOrder === "asc" ? "desc" : "asc");
    } else {
      setJobsSort(column);
      setJobsOrder("desc");
    }
    setJobsPage(1);
  };

  const handleJobsPageChange = (newPage: number) => {
    setJobsPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleJobsSearchChange = (query: string) => {
    setJobsSearch(query);
    setJobsPage(1);
  };

  const tabs = [
    {
      id: "jobs",
      label: t("queues.tabs.jobs"),
      content: (
        <QueuePbsJobsTab
          queueName={queueName}
          isAdmin={isAdmin}
          jobsPage={jobsPage}
          jobsLimit={jobsLimit}
          jobsSort={jobsSort}
          jobsOrder={jobsOrder}
          jobsSearch={jobsSearch}
          onJobsPageChange={handleJobsPageChange}
          onJobsSort={handleJobsSort}
          onJobsSearchChange={handleJobsSearchChange}
        />
      ),
    },
    {
      id: "machines",
      label: t("queues.tabs.machines"),
      content: <QueuePbsMachinesTab queueName={queueName} />,
    },
    {
      id: "system",
      label: t("queues.tabs.systemInfo"),
      content: (
        <QueuePbsSystemInfoTab
          rawAttributes={queue.additionalAttributes || null}
        />
      ),
    },
  ];

  const queuedJobs = queue.stateCount?.queued ?? 0;
  const runningJobs = queue.stateCount?.running ?? 0;
  const doneJobs =
    (queue.stateCount?.begun ?? 0) + (queue.stateCount?.exiting ?? 0);
  const totalJobs = typeof queue.totalJobs === "number" ? queue.totalJobs : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t("queues.basicInformation")}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">
                {t("queues.queueName")}
              </div>
              <div className="text-lg font-medium text-gray-900">
                {queueName}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">
                {t("queues.queueType")}
              </div>
              <div className="text-lg font-medium text-gray-900">
                {queue.queueType}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">
                {t("queues.priority")}
              </div>
              <div className="text-lg font-medium text-gray-900">
                {queue.priority !== null && queue.priority !== undefined
                  ? String(queue.priority)
                  : "-"}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">{t("queues.status")}</div>
              <div className="text-lg font-medium text-gray-900">
                {queue.enabled && queue.started
                  ? t("queues.enabledAndStarted")
                  : queue.enabled
                    ? t("queues.enabled")
                    : t("queues.disabled")}
              </div>
            </div>
            {(() => {
              const isReserved =
                (queue.acl?.groups && queue.acl.groups.length > 0) ||
                (queue.acl?.users && queue.acl.users.length > 0);

              if (!isReserved) {
                return null;
              }

              let message = "";
              if (queue.acl?.groups && queue.acl.groups.length > 0) {
                message =
                  queue.hasAccess === false
                    ? t("queues.noAccessGroups", {
                        groups: queue.acl.groups.join(", "),
                      })
                    : t("queues.restrictedGroups", {
                        groups: queue.acl.groups.join(", "),
                      });
              } else if (queue.acl?.users && queue.acl.users.length > 0) {
                message = t("queues.reservedForUsers", {
                  users: queue.acl.users
                    .map((u) => {
                      // Show full info if username is available, otherwise just nickname
                      if (u.username) {
                        return u.name
                          ? `${u.name} (${u.username})`
                          : u.username;
                      } else {
                        return u.nickname || "Unknown";
                      }
                    })
                    .join(", "),
                });
              }

              return (
                <div className="col-span-2">
                  <span
                    className={`flex items-center px-2 py-1 text-xs rounded ${
                      queue.hasAccess === false
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    <Icon
                      icon={
                        queue.hasAccess === false
                          ? "bxs:lock-alt"
                          : "bxs:lock-open-alt"
                      }
                      className="w-4 h-4 mr-1"
                    />
                    {message}
                  </span>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ACL Groups */}
      {queue.acl?.groups && queue.acl.groups.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t("queues.aclGroups")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {queue.acl.groups.map((groupName) => (
                <Link
                  key={groupName}
                  to={`/groups/${encodeURIComponent(groupName)}`}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100 hover:text-primary-800"
                >
                  {groupName}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ACL Users */}
      {queue.acl?.users && queue.acl.users.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t("queues.aclUsers")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {queue.acl.users.map((user, index) => {
                const displayKey = user.username || `user-${index}`;
                const displayText = user.username
                  ? user.name
                    ? `${user.name} (${user.username})`
                    : user.username
                  : user.nickname || "Unknown";

                // Only make it a link if username is available (user can see full info)
                if (user.username) {
                  return (
                    <Link
                      key={displayKey}
                      to={`/users/${encodeURIComponent(user.username)}`}
                      className="inline-flex items-center px-3 py-1 text-sm font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md hover:bg-yellow-100 hover:text-yellow-800"
                    >
                      <Icon icon="bxs:lock" className="w-4 h-4 mr-1" />
                      {displayText}
                    </Link>
                  );
                } else {
                  return (
                    <span
                      key={displayKey}
                      className="inline-flex items-center px-3 py-1 text-sm font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md"
                    >
                      <Icon icon="bxs:lock" className="w-4 h-4 mr-1" />
                      {displayText}
                    </span>
                  );
                }
              })}
            </div>
          </div>
        </div>
      )}

      {/* Parent Queue */}
      {queue.parent && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t("queues.parentQueue")}
            </h2>
            <div>
              <Link
                to={(() => {
                  // Use the current queue's server for the parent link
                  const server = queue.server || queueId.match(/@(.+)$/)?.[1];
                  const parentId = server
                    ? `${queue.parent}@${server}.metacentrum.cz`
                    : queue.parent;
                  return `/queues/${parentId}`;
                })()}
                className="text-primary-600 hover:text-primary-800 font-medium"
              >
                {queue.parent}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Children Queues */}
      {childrenQueues.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t("queues.childrenQueues")}
            </h2>
          </div>
          <div>
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-700">
                <div className="col-span-3">{t("queues.queueName")}</div>
                <div className="col-span-1">{t("queues.priority")}</div>
                <div className="col-span-2">{t("queues.timeLimits")}</div>
                <div className="col-span-5">{t("queues.jobs")}</div>
                <div className="col-span-1">{t("queues.fairshare")}</div>
              </div>
            </div>
            <div>
              {childrenQueues.map((child, index) => (
                <QueueTreeNode
                  key={child.name}
                  queue={child}
                  level={0}
                  isLast={index === childrenQueues.length - 1}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Job Statistics */}
      {totalJobs > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t("queues.jobStatistics")}
            </h2>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-500">
                  {t("queues.queued")}
                </div>
                <div className="text-lg font-medium text-gray-900">
                  {queuedJobs}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">
                  {t("queues.running")}
                </div>
                <div className="text-lg font-medium text-blue-600">
                  {runningJobs}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">{t("queues.done")}</div>
                <div className="text-lg font-medium text-green-600">
                  {doneJobs}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">{t("queues.total")}</div>
                <div className="text-lg font-medium text-gray-900">
                  {totalJobs}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>
    </div>
  );
}
