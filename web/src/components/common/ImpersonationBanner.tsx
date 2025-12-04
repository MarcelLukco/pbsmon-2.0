import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useImpersonation } from "@/contexts/ImpersonationContext";

export function ImpersonationBanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { impersonatedUsername, cancelImpersonation } = useImpersonation();

  if (!impersonatedUsername) {
    return null;
  }

  const handleCancel = () => {
    cancelImpersonation();
    // Redirect to personal view page after canceling impersonation
    navigate("/personal-view");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-yellow-500 text-yellow-900 border-t-2 border-yellow-600 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon icon="mdi:account-switch" className="w-5 h-5 text-yellow-800" />
          <span className="font-medium">
            {t("users.impersonating", { username: impersonatedUsername })}
          </span>
        </div>
        <button
          onClick={handleCancel}
          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-yellow-900 font-medium rounded border border-yellow-700 hover:border-yellow-800 transition-colors flex items-center gap-2"
        >
          <Icon icon="mdi:close" className="w-4 h-4" />
          {t("users.cancelImpersonation")}
        </button>
      </div>
    </div>
  );
}
