import { useTranslation } from "react-i18next";

interface MachinePbsOutagesTabProps {
  nodeOutages: Array<Record<string, any>>;
}

export function MachinePbsOutagesTab({
  nodeOutages,
}: MachinePbsOutagesTabProps) {
  const { t } = useTranslation();

  return (
    <div className="px-6 py-4">
      {nodeOutages.length === 0 ? (
        <div className="text-gray-500">{t("machines.noOutages")}</div>
      ) : (
        <div className="space-y-4">
          {nodeOutages.map((outage, index) => (
            <div
              key={index}
              className="p-4 bg-yellow-50 border border-yellow-200 rounded"
            >
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(outage, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
