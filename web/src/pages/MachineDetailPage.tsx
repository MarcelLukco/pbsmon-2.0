import { useTranslation } from "react-i18next";

export function MachineDetailPage() {
  const { t } = useTranslation();
  return <h1>{t("pages.machineDetail")}</h1>;
}
