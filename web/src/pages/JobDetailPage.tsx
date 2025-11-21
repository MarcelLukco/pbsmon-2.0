import { useTranslation } from "react-i18next";

export function JobDetailPage() {
  const { t } = useTranslation();
  return <h1>{t("pages.jobDetail")}</h1>;
}
