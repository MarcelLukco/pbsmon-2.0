import { useTranslation } from "react-i18next";

export function UserDetailPage() {
  const { t } = useTranslation();
  return <h1>{t("pages.userDetail")}</h1>;
}
