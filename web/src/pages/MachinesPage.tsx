import { useTranslation } from "react-i18next";

export function MachinesPage() {
  const { t } = useTranslation();
  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary-900">
            {t("pages.machines")}
          </h1>
        </div>
      </header>
      <div className="p-6">
        <h1>Machines</h1>
      </div>
    </>
  );
}
